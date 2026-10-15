// Side-view battle in the FF II / FF IV PSP style. The rules (Bend) resolve a
// whole action at once and return a log; this scene plays the log back as
// choreography, then asks for the next command.
import { ctx, W, H, input, clamp, lerp, ease, ui } from "../core.js";
import { win, text, bigText, hand, hints, bar, COLORS, NATURE_COLORS, NATURE_NAMES, diamond, wrap, measure, fill } from "../gfx.js";
import { FX } from "../fx.js";
import * as audio from "../audio.js";
import { game, registerScene, route } from "../main.js";
import { arr, G, C, toolCounts, moveInfo, yes, markSeen, markMove, seenMoves } from "../bend.js";
import { fighterArt, shadow, drawSummon } from "../art.js";
import { mugenFor } from "../mugen.js";
import { formColor, formInfo, lighten } from "../bend.js";
import { backdrop, backdropKind } from "../world.js";

const ST_TEXT = { SBurn: ["Burn", "#ff9a3a"], SPoison: ["Poison", "#c070ff"], SStun: ["Bound!", "#ffe060"], SGuard: ["Guard", "#7fb8ff"], SAtkUp: ["ATK ↑", "#ff7070"], SDefUp: ["DEF ↑", "#7fb8ff"], SDefDown: ["DEF ↓", "#c0a080"], SEvade: ["Evasion ↑", "#c0ffd0"], SClones: ["Clones!", "#ffb050"], SCharge: ["Chakra gathering!", "#ff4040"] };
const BASIC = new Set(["Strike", "Defend", "ThrowKunai", "TailSwipe", "Ambush", "Idle", "SparStrike"]);
const LEADERS = new Set(["Haku", "Zabuza", "Kabuto", "Kisame", "Deidara", "Itachi", "Gozu", "Meizu", "Orochimaru", "Jirobo", "Kidomaru", "Tayuya", "Sakon", "Kimimaro", "Hidan", "Kakuzu", "Sasori", "Raiga", "Aoi"]);

registerScene("battle", () => {
  let run = game.run;
  let b = run.mode.b;
  const fx = new FX();
  const kind = backdropKind(run);
  const bg = backdrop(kind);
  const isBoss = b.boss > 0;
  const view = []; // per fighter index: display state
  let tasks = [];  // playback queue
  let task = null;
  let effects = []; // { t, dur, draw(k, t) }
  let cutin = null;
  let banner = null; // combo banner
  let nameWin = null; // { text, t }
  let state = "intro"; // intro | play | cmd | jutsu | tools | target | result | resultWait
  let menu = { cmd: 0, jutsu: 0, tool: 0, tgt: 0 };
  let pending = null; // command being targeted
  let result = null;
  let introT = 0;
  let ambient = [];
  let summonShow = null; // { sp, t }
  const summonPos = () => ({ x: 300, y: 92 });
  const levelsBefore = arr(run.party).map((m) => m.lvl);

  // ---------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------
  function layout() {
    const fs = arr(b.fs);
    const party = fs.map((f, i) => [f, i]).filter(([f]) => f.side === 0);
    const foes = fs.map((f, i) => [f, i]).filter(([f]) => f.side === 1);
    party.forEach(([f, i], k) => {
      view[i] = view[i] ?? mk(f, i);
      view[i].home = { x: 362 + k * 26, y: 138 + k * 26 };
    });
    const spots = foes.length === 1 ? [[118, 176]] : foes.length === 2 ? [[96, 150], [140, 184]] : [[86, 140], [148, 162], [100, 190], [60, 170]];
    foes.forEach(([f, i], k) => {
      view[i] = view[i] ?? mk(f, i);
      const big = view[i].art.big;
      view[i].home = big ? { x: 150, y: 178 } : { x: spots[k][0], y: spots[k][1] };
    });
  }
  function mk(f, i) {
    const key = G.body_key(f.body);
    return { i, art: fighterArt(key), key, name: G.body_name(f.body), side: f.side, hp: f.hp, mhp: f.mhp, ck: f.ck, mck: f.mck, ox: 0, oy: 0, pose: "idle", poseT: 0, flash: 0, alpha: 1, dead: f.hp <= 0, dissolve: 0, foe: f.body.$ === "Enemy" ? f.body.foe.$ : null };
  }
  layout();

  const fsNow = () => arr(b.fs);
  const pos = (i) => { const v = view[i]; return { x: v.home.x + v.ox, y: v.home.y + v.oy }; };
  const center = (i) => { const p = pos(i); return { x: p.x, y: p.y - (view[i].art.big ? 52 : 18) }; };

  // ---------------------------------------------------------------------
  // Turning the rules' log into a choreography
  // ---------------------------------------------------------------------
  function enqueueLog() {
    const log = arr(b.log);
    let act = null;
    let summonNext = false;
    const seen = new Set();
    for (const e of log) {
      switch (e.$) {
        case "EvSummon": {
          const ev = e, sp = Math.floor((b.smn - 1) / 4);
          summonNext = true;
          tasks.push({ dur: 750, start: () => { summonShow = { sp, t: 0 }; nameWin = { text: `${ev.text}!`, t: 0 }; const p = summonPos(); fx.burst(p.x, p.y - 20, { n: 40, color: ["#ffffff", "#d8d8e8"], speed: 1.6, life: 700, size: 4 }); audio.sfx("cutin"); } });
          break;
        }
        case "EvForm": {
          const ev = e;
          tasks.push({ dur: ev.tier ? 1150 : 600, start: () => formChange(ev.who, ev.tier) });
          break;
        }
        case "EvAct": {
          act = { who: e.who, move: e.move, info: moveInfo(e.move), nat: G.move_nat(e.move), summon: summonNext };
          if (!game.demo && !summonNext && view[e.who]?.side === 1 && !BASIC.has(e.move.$)) markMove(view[e.who].key, act.info.name);
          seen.clear();
          const a = act;
          if (summonNext) {
            summonNext = false;
            tasks.push({ dur: 450, start: () => { nameWin = { text: a.info.name, t: 0 }; audio.sfx("beast"); } });
            break;
          }
          tasks.push({ dur: 220, start: () => stepIn(a) });
          const party = view[a.who].side === 0;
          const special = !BASIC.has(a.move.$);
          if (special && (party || LEADERS.has(view[a.who].foe) || a.move.$ === "TailedBeastBomb")) tasks.push({ dur: 820, start: () => startCutin(a) });
          else if (special || a.move.$ === "Defend") tasks.push({ dur: 260, start: () => { nameWin = { text: a.info.name, t: 0 }; } });
          if (a.move.$ === "TailedBeastBomb") tasks.push({ dur: 900, start: () => bombCharge(a) });
          if (a.move.$ === "GatherChakra") tasks.push({ dur: 500, start: () => aura(a.who, "#ff3030") });
          break;
        }
        case "EvTool": {
          act = { who: e.who, tool: e.tool, info: G.tool_info(e.tool), nat: 0 };
          seen.clear();
          const a = act;
          tasks.push({ dur: 220, start: () => { stepIn(a); nameWin = { text: a.info.name, t: 0 }; } });
          break;
        }
        case "EvHit": case "EvHeal": case "EvMiss": case "EvBlock": {
          if (act && !seen.has(e.who) && act.who !== e.who) {
            seen.add(e.who);
            const a = act, tgt = e.who;
            tasks.push({ dur: effectDur(a), start: () => effectOn(a, tgt) });
          }
          const ev = e;
          tasks.push({ dur: e.$ === "EvHit" ? (ev.crit ? 360 : 240) : 300, start: () => play(ev) });
          break;
        }
        case "EvCombo": {
          const ev = e;
          tasks.push({ dur: 900, start: () => comboBanner(ev) });
          break;
        }
        case "EvIncoming": break;
        case "EvSay": {
          const ev = e;
          tasks.push({ dur: 650, start: () => { nameWin = { text: ev.text, t: 0 }; } });
          break;
        }
        default: {
          const ev = e;
          tasks.push({ dur: e.$ === "EvKO" ? 650 : 380, start: () => play(ev) });
        }
      }
    }
    tasks.push({ dur: 240, start: () => { for (const v of view) if (v) v.target = { ox: 0, oy: 0 }; } });
    tasks.push({ dur: 0, start: settle });
  }

  function stepIn(a) {
    const v = view[a.who];
    const dir = v.side === 0 ? -1 : 1;
    v.target = { ox: dir * (v.art.big ? 10 : 22), oy: 0 };
    const basic = BASIC.has(a.move?.$ ?? "") || !!a.tool;
    setPose(v, basic && a.move?.$ !== "Defend" ? "attack" : a.move?.$ === "Defend" ? "guard" : "cast", 900);
    if (!a.tool && !BASIC.has(a.move.$)) aura(a.who, NATURE_COLORS[a.nat] ?? "#fff");
  }

  function setPose(v, pose, ms) { v.pose = pose; v.poseT = ms; v.poseStart = game.t; }

  function startCutin(a) {
    const v = view[a.who];
    cutin = { a, v, t: 0, dur: 820, col: NATURE_COLORS[a.nat] || (v.side === 0 ? "#ffb040" : "#ff4040") };
    nameWin = { text: a.info.name, t: 0 };
    audio.sfx("cutin");
  }

  function effectDur(a) {
    if (a.tool) return 260;
    if (BASIC.has(a.move.$)) return 160;
    if (a.info.tgt.$ === "OneAlly" || a.info.tgt.$ === "AllAllies" || a.info.tgt.$ === "OnSelf") return 420;
    return 520;
  }

  function effectOn(a, tgt) {
    const from = a.summon ? { x: summonPos().x - 20, y: summonPos().y - 30 } : center(a.who), to = center(tgt);
    const mv = a.move?.$ ?? "";
    if (a.tool) {
      projectile(from, to, "#d0d0e0", 2);
      audio.sfx("slash");
      return;
    }
    if (BASIC.has(mv)) { slash(to); audio.sfx("slash"); return; }
    const tg = a.info.tgt.$;
    if (tg === "OneAlly" || tg === "AllAllies" || tg === "OnSelf" || tg === "DownAlly") {
      const healing = arr(a.info.effs).some((e) => e.$ === "Heal" || e.$ === "Revive");
      if (healing) { sparkle(to, "#7dff9a"); audio.sfx("heal"); }
      else { aura(tgt, NATURE_COLORS[a.nat] === "#ffffff" ? "#9fd0ff" : NATURE_COLORS[a.nat]); audio.sfx("status"); }
      return;
    }
    if (mv === "TailedBeastBomb") { boom(to, "#2a0a3a", "#ff60ff"); audio.sfx("earth"); fx.shake(6, 400); fx.flash("#ffffff", 300); return; }
    switch (a.nat) {
      case 1: projectile(from, to, "#ff7a2a", 5, () => { fireBurst(to); }); audio.sfx("fire"); break;
      case 2: spiral(to, "#9ff8e8"); audio.sfx("wind"); break;
      case 3: bolt(to); audio.sfx("lightning"); fx.flash("#fff8c0", 120); break;
      case 4: shards(to); audio.sfx("earth"); fx.shake(3, 250); break;
      case 5: wave(to); audio.sfx("water"); break;
      case 6: smoke(to, "#7a40c0"); audio.sfx("yin"); break;
      case 7: rays(to, "#fff0a0"); audio.sfx("yang"); break;
      default: slash(to, true); audio.sfx("slash");
    }
  }

  function play(e) {
    const v = view[e.who];
    if (!v) return;
    const c = center(e.who);
    switch (e.$) {
      case "EvHit": {
        v.hp = Math.max(0, v.hp - e.dmg);
        v.flash = 1;
        v.target = { ox: (v.side === 0 ? 5 : -5) + (v.target?.ox ?? 0) * 0.2, oy: 0 };
        setPose(v, "hurt", 300);
        const stack = fx.floats.filter((f) => Math.abs(f.x - c.x) < 6 && f.t < 500).length;
        fx.float(String(e.dmg), c.x + stack * 3, c.y - 4 - stack * 12, { color: e.crit ? "#ffe040" : "#ffffff", size: e.crit ? 17 : 13 });
        if (e.crit) { fx.float("Critical!", c.x, c.y - 22, { color: "#ffb030", size: 9, bounce: false, life: 700 }); fx.shake(4, 260); audio.sfx("crit"); }
        else { audio.sfx("hit"); if (v.side === 0) fx.shake(2, 140); }
        fx.burst(c.x, c.y, { n: 8, color: ["#ffffff", "#ffe0a0"], speed: 1.6, life: 300 });
        break;
      }
      case "EvHeal": v.hp = Math.min(v.mhp, v.hp + e.amt); fx.float(String(e.amt), c.x, c.y - 4, { color: "#7dff9a" }); break;
      case "EvCk": v.ck = Math.min(v.mck, v.ck + e.amt); fx.float(`+${e.amt} CK`, c.x, c.y - 12, { color: "#7fd8ff", size: 9, bounce: false, life: 800 }); audio.sfx("chakra"); break;
      case "EvMiss": fx.float(v.side === 0 && v.key === "sasuke" ? "Read!" : "Miss", c.x, c.y - 4, { color: "#d0d8ff", size: 10, bounce: false, life: 700 }); v.target = { ox: v.side === 0 ? 12 : -12, oy: 0 }; audio.sfx("miss"); break;
      case "EvBlock": {
        const sand = e.text === "Sand";
        fx.float(sand ? "Sand!" : "Clone!", c.x, c.y - 4, { color: sand ? "#e8c070" : "#ffb050", size: 10, bounce: false, life: 700 });
        fx.burst(c.x, c.y + 6, { n: 16, color: sand ? ["#d8b070", "#a88850"] : ["#ffffff", "#e0e0e8"], speed: 1.2, life: 500, size: 3 });
        audio.sfx("block");
        break;
      }
      case "EvStatus": {
        const [label, col] = ST_TEXT[e.st.$] ?? [e.st.$, "#fff"];
        fx.float(label, c.x, c.y - 26, { color: col, size: 8.5, bounce: false, life: 900 });
        audio.sfx("status");
        break;
      }
      case "EvKO":
        if (v.side === 1) { v.dissolving = true; audio.sfx("dissolve"); fx.burst(c.x, c.y, { n: 24, color: ["#ff5050", "#c050ff", "#ffffff"], speed: 1.4, life: 700, gravity: -0.001 }); }
        else { setPose(v, "ko", 1e9); v.dead = true; audio.sfx("ko"); }
        v.hp = 0;
        break;
      case "EvRevive": v.dead = false; v.dissolve = 0; setPose(v, "idle", 0); sparkle(c, "#ffffa0"); audio.sfx("heal"); break;
    }
  }

  function comboBanner(e) {
    const names = e.text;
    const cols = { Firestorm: ["#ff7a2a", "#9ff8e8"], Conduction: ["#4aa8ff", "#ffe84a"], Mudslide: ["#c89060", "#4aa8ff"], "Plasma Gale": ["#ffe84a", "#9ff8e8"], Lava: ["#ff7a2a", "#c89060"], "Yin-Yang": ["#a070ff", "#fff0a0"] }[names] ?? ["#fff", "#fff"];
    banner = { text: `${names.toUpperCase()}!`, t: 0, cols };
    const c = center(e.who);
    fx.burst(c.x, c.y, { n: 40, color: cols, speed: 2.4, life: 800, size: 3 });
    fx.flash(cols[0], 220);
    fx.shake(5, 300);
    audio.sfx("combo");
  }

  // ---------------------------------------------------------------------
  // Visual effects
  // ---------------------------------------------------------------------
  const eff = (dur, draw) => effects.push({ t: 0, dur, draw });
  function slash(p, big = false) {
    eff(220, (k) => {
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${1 - k})`;
      ctx.lineWidth = big ? 3 : 2;
      const r = (big ? 16 : 12) * ease.out(k);
      ctx.beginPath(); ctx.moveTo(p.x - r, p.y - r); ctx.lineTo(p.x + r, p.y + r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x + r * 0.8, p.y - r); ctx.lineTo(p.x - r * 0.6, p.y + r); ctx.stroke();
      ctx.restore();
    });
  }
  function projectile(a, b2, col, size, onHit) {
    eff(260, (k) => {
      const x = lerp(a.x, b2.x, ease.in(k)), y = lerp(a.y, b2.y, ease.in(k)) - Math.sin(k * Math.PI) * 10;
      ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(x - (b2.x - a.x) * 0.05, y, size * 1.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (k >= 0.98 && onHit) { onHit(); onHit = null; }
    });
  }
  function fireBurst(p) {
    fx.burst(p.x, p.y, { n: 30, color: ["#ffd040", "#ff7a2a", "#c83010"], speed: 1.8, life: 600, size: 3, gravity: -0.0015 });
    eff(380, (k) => { ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = "#ff9a3a"; ctx.beginPath(); ctx.arc(p.x, p.y, 6 + k * 20, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
  }
  function spiral(p, col) {
    eff(520, (k) => {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 1 - k * 0.8;
      for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(p.x, p.y, 6 + j * 6 + k * 8, k * 14 + j, k * 14 + j + 2.2); ctx.stroke(); }
      ctx.restore();
    });
    fx.burst(p.x, p.y, { n: 18, color: ["#ffffff", col], speed: 2, life: 450, size: 2, spread: Math.PI * 2 });
  }
  function bolt(p) {
    eff(300, (k) => {
      ctx.save(); ctx.strokeStyle = k < 0.5 ? "#ffffff" : "#ffe84a"; ctx.lineWidth = 2.5; ctx.globalAlpha = 1 - k;
      let x = p.x + 10, y = 0;
      ctx.beginPath(); ctx.moveTo(x, y);
      while (y < p.y) { x += (Math.random() - 0.5) * 18; y += 12; ctx.lineTo(x, Math.min(y, p.y)); }
      ctx.stroke(); ctx.restore();
    });
    fx.burst(p.x, p.y, { n: 16, color: ["#ffffff", "#ffe84a"], speed: 2.2, life: 300, size: 2 });
  }
  function shards(p) {
    for (let j = 0; j < 7; j++) {
      const dx = (j - 3) * 6;
      eff(420, (k) => {
        const h = Math.sin(Math.min(k * 1.6, 1) * Math.PI) * (14 + (j % 3) * 6);
        ctx.save(); ctx.fillStyle = j % 2 ? "#a87a50" : "#7a5434";
        ctx.beginPath(); ctx.moveTo(p.x + dx - 3, p.y + 18); ctx.lineTo(p.x + dx, p.y + 18 - h); ctx.lineTo(p.x + dx + 3, p.y + 18); ctx.closePath(); ctx.fill(); ctx.restore();
      });
    }
    fx.burst(p.x, p.y + 16, { n: 20, color: ["#c8a070", "#8a6040"], speed: 1.5, life: 500, size: 2.5 });
  }
  function wave(p) {
    eff(500, (k) => {
      ctx.save(); ctx.fillStyle = "rgba(74,168,255,0.65)";
      const x = lerp(p.x - 40, p.x + 30, k);
      ctx.beginPath(); ctx.moveTo(x - 20, p.y + 20); ctx.quadraticCurveTo(x, p.y - 26, x + 20, p.y + 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(x - 6, p.y - 8, 10, 2); ctx.restore();
    });
    fx.burst(p.x, p.y, { n: 20, color: ["#ffffff", "#4aa8ff"], speed: 1.6, life: 500, size: 2, gravity: 0.004 });
  }
  function smoke(p, col) {
    for (let j = 0; j < 6; j++) eff(600, (k) => {
      ctx.save(); ctx.globalAlpha = (1 - k) * 0.7; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(p.x + Math.cos(j) * 10 * k, p.y + Math.sin(j) * 8 * k - k * 6, 6 + k * 8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
  }
  function rays(p, col) {
    eff(500, (k) => {
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = col; ctx.lineWidth = 2;
      for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2 + k; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * 5, p.y + Math.sin(a) * 5); ctx.lineTo(p.x + Math.cos(a) * (12 + k * 26), p.y + Math.sin(a) * (12 + k * 26)); ctx.stroke(); }
      ctx.restore();
    });
  }
  function sparkle(p, col) {
    for (let j = 0; j < 10; j++) {
      const ox = (Math.random() - 0.5) * 24, d = Math.random() * 0.3;
      eff(700, (k) => {
        const kk = clamp((k - d) / (1 - d), 0, 1);
        if (kk <= 0) return;
        ctx.save(); ctx.globalAlpha = 1 - kk; ctx.fillStyle = col;
        const x = p.x + ox, y = p.y + 14 - kk * 34;
        ctx.fillRect(x - 3, y - 0.5, 6, 1); ctx.fillRect(x - 0.5, y - 3, 1, 6); ctx.restore();
      });
    }
  }
  function aura(i, col) {
    const v = view[i];
    if (!v) return;
    eff(600, (k) => {
      const p = pos(i);
      ctx.save(); ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      const h = v.art.big ? 60 : 24;
      ctx.beginPath(); ctx.ellipse(p.x, p.y - h / 2, 10 + k * 14, h / 2 + k * 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    });
    const p = pos(i);
    fx.burst(p.x, p.y - 4, { n: 10, color: col, speed: 0.8, life: 600, gravity: -0.002, spread: 1.2, dir: -Math.PI / 2 });
  }
  function boom(p, col, rim) {
    eff(500, (k) => { ctx.save(); ctx.globalAlpha = 1 - k * 0.6; ctx.fillStyle = col; ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 8 + ease.out(k) * 40, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); });
  }
  function bombCharge(a) {
    const c = center(a.who);
    const mouth = { x: c.x + 40, y: c.y - 14 };
    eff(900, (k) => {
      ctx.save();
      ctx.fillStyle = "#1a0420"; ctx.strokeStyle = "#ff60ff"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(mouth.x, mouth.y, 3 + ease.in(k) * 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    fx.burst(mouth.x, mouth.y, { n: 40, color: ["#ff60ff", "#6040ff", "#ffffff"], speed: -1.4, life: 800 });
    audio.sfx("beast");
  }

  // ---------------------------------------------------------------------
  // Flow
  // ---------------------------------------------------------------------
  function settle() {
    // snap display values to the true state
    fsNow().forEach((f, i) => {
      const v = view[i];
      if (!v) return;
      v.hp = f.hp; v.mhp = f.mhp; v.ck = f.ck; v.mck = f.mck;
      if (f.hp <= 0 && v.side === 0) { v.dead = true; setPose(v, "ko", 1e9); }
      if (f.hp > 0 && v.dead && v.side === 0) { v.dead = false; setPose(v, "idle", 0); }
    });
    const ph = b.phase.$;
    if (ph === "Ask") {
      state = "cmd";
      nameWin = null;
      menu.cmd = 0;
      const v = view[b.phase.who];
      v.target = { ox: -12, oy: 0 };
      setPose(v, "ready", 1e9);
      audio.sfx("cursor");
    } else if (ph === "Busy") {
      run = game.act(C("Next"));
      b = run.mode.b;
      state = "play";
      enqueueLog();
    } else {
      state = "result";
      result = { phase: ph, t: 0 };
      if (ph === "Won") {
        audio.play("victory");
        for (const v of view) if (v && v.side === 0 && !v.dead) setPose(v, "win", 1e9);
      } else if (ph === "Lost") audio.play("gameover");
    }
  }

  function startCommand(cmd) {
    for (const v of view) if (v?.side === 0 && v.pose === "ready") setPose(v, "idle", 0);
    run = game.act(C("Cmd", { cmd }));
    b = run.mode.b;
    state = "play";
    enqueueLog();
  }

  // targets for a command
  function targetList(tgt) {
    const fs = fsNow();
    const who = b.phase.who;
    if (tgt === "OneFoe" || tgt === "AllFoes") return fs.map((f, i) => [f, i]).filter(([f]) => f.side === 1 && f.hp > 0).map(([, i]) => i);
    if (tgt === "OneAlly" || tgt === "AllAllies") return fs.map((f, i) => [f, i]).filter(([f]) => f.side === 0 && f.hp > 0).map(([, i]) => i);
    if (tgt === "DownAlly") return fs.map((f, i) => [f, i]).filter(([f]) => f.side === 0 && f.hp <= 0).map(([, i]) => i);
    return [who];
  }

  function beginTarget(kind, data, tgt) {
    const list = targetList(tgt);
    if (!list.length) { audio.sfx("buzz"); return; }
    pending = { kind, data, tgt, list };
    if (tgt === "OnSelf") { confirmTarget(b.phase.who); return; }
    menu.tgt = tgt === "OneAlly" ? Math.max(0, list.indexOf(b.phase.who)) : 0;
    state = "target";
    audio.sfx("ok");
  }

  function confirmTarget(t) {
    audio.sfx("ok");
    const p = pending;
    pending = null;
    if (p.kind === "attack") startCommand(C("CAttack", { target: t }));
    if (p.kind === "jutsu") startCommand(C("CJutsu", { move: p.data, target: t }));
    if (p.kind === "tool") startCommand(C("CTool", { tool: C(p.data), target: t }));
  }

  function jutsuList() {
    const who = b.phase.who;
    const f = fsNow()[who];
    return arr(G.f_learns(f)).map((l, slot) => {
      const info = G.actor_info(f, l.move);
      const known = l.lvl <= f.lvl;
      const cd = arr(f.cds)[slot] ?? 0;
      const ok = yes(G.can_jutsu(f, l.move));
      return { move: l.move, info, known, cd, ok, lvl: l.lvl, jlv: arr(f.jlv)[slot] ?? 1, nat: G.move_nat(l.move) };
    });
  }

  function cmdItems() {
    const f = fsNow()[b.phase.who];
    const items = ["Taijutsu", "Jutsu", { label: "Ninja Tools", disabled: !toolList().length }, "Guard"];
    if (f && f.body.$ === "Ninja" && f.ftier > f.form) items.push({ label: "Transform", color: lighten(formColor(f.body.who.$, f.ftier)) });
    return items;
  }

  // A form takes hold (tier > 0) or fades (tier 0).
  function formChange(i, tier) {
    const v = view[i];
    const f = fsNow()[i];
    if (!tier) { nameWin = { text: `${v.name}'s form fades.`, t: 0 }; audio.sfx("ko"); return; }
    const who = f.body.who.$;
    const col = formColor(who, tier);
    const fi = formInfo(who, tier);
    cutin = { a: { info: { name: fi.name }, nat: 0 }, v, t: 0, dur: 1100, col };
    nameWin = { text: `${v.name}: ${fi.name}!`, t: 0 };
    setPose(v, "win", 1100);
    const c = center(i);
    fx.burst(c.x, c.y, { n: 60, color: [col, "#ffffff"], speed: 2.4, life: 900, size: 3 });
    fx.flash(col, 300);
    fx.shake(4, 400);
    audio.sfx("combo");
  }

  function toolList() {
    const counts = toolCounts(run);
    return [...counts.entries()].map(([name, n]) => ({ name, n, info: G.tool_info(C(name)) }));
  }

  // ---------------------------------------------------------------------
  // Scene
  // ---------------------------------------------------------------------
  return {
    info: () => ({ state }),
    enter() {
      audio.play(isBoss ? "boss" : "battle");
      if (!game.demo) markSeen(arr(b.fs).filter((f) => f.side === 1).map((f) => G.body_key(f.body)));
      for (const v of view) if (v) { v.ox = v.side === 0 ? 120 : -140; v.target = { ox: 0, oy: 0 }; }
      introT = 0;
      ambient = Array.from({ length: bg.rain ? 80 : bg.snow ? 50 : bg.steam ? 14 : 0 }, () => ({ x: Math.random() * W, y: Math.random() * 200, v: 0.5 + Math.random() }));
    },
    update(dt, now) {
      const speed = (audio.getSettings().speed ?? 1) * (input.held("r") ? 2 : 1);
      const sdt = dt * speed;
      fx.update(sdt);
      for (const a of ambient) { a.y += a.v * sdt * (bg.rain ? 0.35 : 0.04); a.x += bg.rain ? -0.1 * sdt * 0.1 : Math.sin(a.y / 20) * 0.2; if (a.y > 200) { a.y = -5; a.x = Math.random() * W; } }
      for (const v of view) {
        if (!v) continue;
        const tg = v.target ?? { ox: 0, oy: 0 };
        v.ox = lerp(v.ox, tg.ox, Math.min(1, sdt * 0.02));
        v.oy = lerp(v.oy, tg.oy, Math.min(1, sdt * 0.02));
        v.flash = Math.max(0, v.flash - sdt * 0.006);
        if (v.poseT < 1e8) { v.poseT -= sdt; if (v.poseT <= 0 && !v.dead) v.pose = "idle"; }
        if (v.dissolving) { v.dissolve = Math.min(1, v.dissolve + sdt / 600); if (v.dissolve >= 1) { v.dead = true; v.dissolving = false; } }
      }
      effects = effects.filter((e) => { e.t += sdt; return e.t < e.dur; });
      if (cutin) { cutin.t += sdt; if (cutin.t > cutin.dur) cutin = null; }
      if (summonShow) { summonShow.t += sdt; if (summonShow.t > 2600) summonShow = null; }
      if (banner) { banner.t += sdt; if (banner.t > 900) banner = null; }
      if (nameWin) { nameWin.t += sdt; if (nameWin.t > 1300) nameWin = null; }

      if (state === "intro") {
        introT += sdt;
        if (introT > 700) {
          nameWin = { text: isBoss ? `${G.beast_title(b.boss)}!` : run.msg, t: 0 };
          if (isBoss) { audio.sfx("beast"); fx.shake(5, 600); }
          state = "play";
          enqueueLog();
        }
        return;
      }
      if (state === "play") {
        if (!task && tasks.length) { task = tasks.shift(); task.t = 0; task.start(); }
        if (task) { task.t += sdt; if (task.t >= task.dur) task = null; }
        return;
      }
      const hoverF = ui.hoverIndex("btgt");
      if (state === "cmd") {
        const nc = cmdItems().length;
        const m = ui.menu("bcmd", menu.cmd);
        menu.cmd = m.cur;
        // QoL: click an enemy to attack it straight away
        if (hoverF >= 0 && ui.clicked(`btgt:${hoverF}`) && view[hoverF].side === 1 && fsNow()[hoverF].hp > 0) {
          beginTarget("attack", null, "OneFoe");
          if (pending) confirmTarget(hoverF);
          return;
        }
        if (input.pressed("up")) { menu.cmd = (menu.cmd + nc - 1) % nc; audio.sfx("cursor"); }
        if (input.pressed("down")) { menu.cmd = (menu.cmd + 1) % nc; audio.sfx("cursor"); }
        if (input.pressed("ok") || m.ok) {
          if (menu.cmd === 0) beginTarget("attack", null, "OneFoe");
          if (menu.cmd === 1) { state = "jutsu"; menu.jutsu = 0; audio.sfx("ok"); }
          if (menu.cmd === 2) { if (toolList().length) { state = "tools"; menu.tool = 0; audio.sfx("ok"); } else audio.sfx("buzz"); }
          if (menu.cmd === 3) { audio.sfx("ok"); startCommand(C("CGuard")); }
          if (menu.cmd === 4) { audio.sfx("ok"); startCommand(C("CTransform")); }
        }
        return;
      }
      if (state === "jutsu") {
        const js = jutsuList();
        const m = ui.menu("bjut", menu.jutsu);
        menu.jutsu = m.cur;
        if (input.pressed("up")) { menu.jutsu = (menu.jutsu + js.length - 1) % js.length; audio.sfx("cursor"); }
        if (input.pressed("down")) { menu.jutsu = (menu.jutsu + 1) % js.length; audio.sfx("cursor"); }
        if (input.pressed("back")) { state = "cmd"; audio.sfx("back"); }
        if (input.pressed("ok") || m.ok) {
          const j = js[menu.jutsu];
          if (!j.ok) { audio.sfx("buzz"); return; }
          beginTarget("jutsu", j.move, j.info.tgt.$);
        }
        return;
      }
      if (state === "tools") {
        const ts = toolList();
        const m = ui.menu("btool", menu.tool);
        menu.tool = m.cur;
        if (input.pressed("left")) { menu.tool = (menu.tool + ts.length - 1) % ts.length; audio.sfx("cursor"); }
        if (input.pressed("right")) { menu.tool = (menu.tool + 1) % ts.length; audio.sfx("cursor"); }
        if (input.pressed("up")) { menu.tool = (menu.tool + ts.length - 2) % ts.length; audio.sfx("cursor"); }
        if (input.pressed("down")) { menu.tool = (menu.tool + 2) % ts.length; audio.sfx("cursor"); }
        if (input.pressed("back")) { state = "cmd"; audio.sfx("back"); }
        if (input.pressed("ok") || m.ok) { const tl = ts[menu.tool]; beginTarget("tool", tl.name, tl.info.tgt.$); }
        return;
      }
      if (state === "target") {
        const p = pending;
        const single = p.tgt === "OneFoe" || p.tgt === "OneAlly" || p.tgt === "DownAlly";
        if (single) {
          const n = p.list.length;
          if (input.pressed("up") || input.pressed("left")) { menu.tgt = (menu.tgt + n - 1) % n; audio.sfx("cursor"); }
          if (input.pressed("down") || input.pressed("right")) { menu.tgt = (menu.tgt + 1) % n; audio.sfx("cursor"); }
        }
        const hi = hoverF >= 0 ? p.list.indexOf(hoverF) : -1;
        if (single && hi >= 0) menu.tgt = hi;
        if (input.pressed("back")) { state = p.kind === "jutsu" ? "jutsu" : p.kind === "tool" ? "tools" : "cmd"; pending = null; audio.sfx("back"); }
        if (input.pressed("ok") || (hi >= 0 && ui.clicked(`btgt:${hoverF}`))) confirmTarget(p.list[single ? menu.tgt : 0]);
        return;
      }
      if (state === "result") {
        result.t += sdt;
        if (result.t > 900 && input.pressed("ok")) {
          audio.sfx("ok");
          run = game.act(C("Next"));
          if (result.phase === "Won") {
            const lv = arr(run.party).map((m) => m.lvl);
            result = { phase: "spoils", t: 0, msg: run.msg, ups: arr(run.party).map((m, i) => (lv[i] > (levelsBefore[i] ?? lv[i]) ? `${G.who_name(m.who)} reached Lv ${lv[i]}!` : null)).filter(Boolean) };
            if (result.ups.length) audio.sfx("levelup");
            state = "resultWait";
          } else route();
        }
        return;
      }
      if (state === "resultWait") {
        result.t += sdt;
        if (result.t > 500 && input.pressed("ok")) { audio.sfx("ok"); route(); }
      }
      void now;
    },
    draw(t) {
      const [sx, sy] = fx.offset();
      ctx.save();
      ctx.translate(sx, sy);
      ctx.drawImage(bg.canvas, 0, 0);
      // ambient weather
      ctx.save();
      ctx.fillStyle = bg.rain ? "rgba(200,220,255,0.5)" : "rgba(255,255,255,0.8)";
      for (const a of ambient) {
        if (bg.rain) ctx.fillRect(a.x, a.y, 1, 6);
        else if (bg.snow) ctx.fillRect(a.x, a.y, 2, 2);
        else { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(a.x, 150 - (a.y % 80), 8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      }
      ctx.restore();
      // fighters, back to front
      const order = view.filter(Boolean).sort((p, q) => pos(p.i).y - pos(q.i).y);
      for (const v of order) {
        if (v.dead && v.side === 1) continue;
        const p = pos(v.i);
        if (!(v.dissolving && v.dissolve > 0.6)) shadow(p.x, p.y, v.art.big ? 46 : 11);
        let alpha = 1;
        if (v.dissolving) {
          alpha = 1 - v.dissolve;
          ctx.save();
          ctx.filter = `sepia(1) saturate(6) hue-rotate(${-40 + v.dissolve * 260}deg)`;
        }
        const low = v.side === 0 && !v.dead && v.hp > 0 && v.hp < v.mhp * 0.25 && v.pose === "idle";
        const fnow = fsNow()[v.i];
        const form = fnow?.form ?? 0;
        const glow = form ? formColor(fnow.body.who.$, form) : null;
        const art = (form && mugenFor(`${v.key}@${form}`)) || v.art;
        if (glow && Math.random() < 0.25) fx.burst(p.x + (Math.random() - 0.5) * 16, p.y - 6, { n: 1, color: glow, speed: 0.5, life: 600, gravity: -0.002, spread: 0.4, size: 1.5 });
        art.draw(p.x, p.y, { pose: low ? "hurt" : v.pose, t: t + v.i * 170, face: v.side === 0 ? "left" : "right", alpha, flash: v.flash, poseStart: v.poseStart, glow });
        if (v.dissolving) ctx.restore();
      }
      if (summonShow) {
        const k = summonShow.t / 2600;
        const a = k < 0.1 ? k / 0.1 : k > 0.8 ? (1 - k) / 0.2 : 1;
        const sp = summonPos();
        shadow(sp.x, sp.y, 26 * a);
        drawSummon(summonShow.sp, sp.x, sp.y, { t, scale: 1.1, alpha: Math.max(0, a), face: "left" });
      }
      for (const e of effects) e.draw(clamp(e.t / e.dur, 0, 1), t);
      fx.drawParts();
      // status pips and nature marks
      fsNow().forEach((f, i) => {
        const v = view[i];
        if (!v || f.hp <= 0) return;
        const p = pos(i);
        const top = p.y - (v.art.big ? 106 : 40);
        const pips = [];
        const st = f.st;
        if (st.burn) pips.push("#ff9a3a");
        if (st.poison) pips.push("#c070ff");
        if (st.stun) pips.push("#ffe060");
        if (st.atkup) pips.push("#ff7070");
        if (st.defup) pips.push("#7fb8ff");
        if (st.defdown) pips.push("#c0a080");
        if (st.evade) pips.push("#c0ffd0");
        if (st.guard) pips.push("#ffffff");
        pips.forEach((c, k) => diamond(p.x - (pips.length - 1) * 3.5 + k * 7, top, 2.6, c));
        if (st.clones) bigText(`x${st.clones}`, p.x + 12, top + 6, { size: 7, color: "#ffb050", lw: 2 });
        if (st.charge) bigText("!!", p.x + 30, top + 20, { size: 12, color: Math.floor(t / 150) % 2 ? "#ff3030" : "#ffffff" });
        if (st.mark && st.markt >= b.clock) {
          diamond(p.x + (v.side === 1 ? 14 : -14), top + 8, 4.2, NATURE_COLORS[st.mark]);
          text(NATURE_NAMES[st.mark][0], p.x + (v.side === 1 ? 14 : -14), top + 4.2, { size: 5.5, align: "center", color: "#101018", shadow: false, weight: 800 });
        }
      });
      fx.drawFloats();
      ctx.restore();

      drawWindows(t);
      if (cutin) drawCutin(t);
      if (banner) drawBanner();
      if (nameWin) {
        const a = Math.min(1, (1300 - nameWin.t) / 200);
        const w = Math.max(90, measure(nameWin.text, 9) + 24);
        ctx.save(); ctx.globalAlpha = a;
        win(W / 2 - w / 2, 6, w, 20);
        text(nameWin.text, W / 2, 11, { size: 9, align: "center" });
        ctx.restore();
      }
      drawTurnStrip(t);
      if (b.chain >= 2 && state !== "result") {
        bigText(`CHAIN x${b.chain}`, 50, 40, { size: 10, color: "#ffd84a", lw: 2.5, italic: true });
        text(`+${Math.min(8 * (b.chain - 1), 40)}% damage`, 50, 48, { size: 7, align: "center", color: "#ffe8a0" });
      }
      fx.drawFlash();
      if (state === "result" || state === "resultWait") drawResult(t);
    },
  };

  // ---------------------------------------------------------------------
  // Windows
  // ---------------------------------------------------------------------
  function drawWindows(t) {
    const fs = fsNow();
    // enemy names, FF style (grouped)
    win(4, 200, 150, 68, { dim: state !== "play" && state !== "intro" && state !== "result" });
    fs.map((f, i) => [f, i]).filter(([f]) => f.side === 1 && f.hp > 0).slice(0, 4).forEach(([f, i], k) => {
      const y = 206 + k * 15;
      ui.hit(`btgt:${i}`, 8, y - 2, 142, 15);
      text(view[i].name, 14, y, { size: 8, color: ui.over(`btgt:${i}`) ? COLORS.hi : COLORS.text });
      text(`${Math.round(view[i].hp)}`, 146, y, { size: 7, align: "right", color: "#ffb0b0" });
      bar(14, y + 10, 132, 2.5, view[i].hp / view[i].mhp, "#ff6a6a");
    });
    // clickable sprites
    fs.forEach((f, i) => {
      if (f.hp <= 0 && f.side === 1) return;
      const c = center(i);
      const big = view[i].art.big;
      ui.hit(`btgt:${i}`, c.x - (big ? 60 : 18), c.y - (big ? 50 : 22), big ? 120 : 36, big ? 100 : 44);
    });
    const hv = ui.hoverIndex("btgt");
    if (hv >= 0 && view[hv].side === 1 && (state === "cmd" || state === "target" || state === "play")) {
      const v = view[hv];
      const seen = game.demo ? arr(G.foe_info(fs[hv].body.foe).moves).slice(1).map((m) => moveInfo(m).name) : seenMoves(v.key);
      topInfo(`${v.name}   HP ${Math.round(v.hp)}/${v.mhp}   ${seen.length ? `Seen: ${seen.join(", ")}` : "No jutsu seen yet"}`);
    }
    // party
    win(158, 200, W - 162, 68);
    const party = fs.map((f, i) => [f, i]).filter(([f]) => f.side === 0);
    party.forEach(([f, i], k) => {
      const v = view[i];
      const y = 208 + k * 18;
      const active = (state === "cmd" || state === "jutsu" || state === "tools" || state === "target") && b.phase.who === i;
      const hpCol = v.hp <= 0 ? "#ff6a6a" : v.hp < v.mhp * 0.25 ? "#ffe070" : COLORS.text;
      text(v.name, 168, y, { size: 8.5, color: active ? COLORS.hi : COLORS.text });
      text(`${Math.round(v.hp)}`, 300, y, { size: 8.5, align: "right", color: hpCol });
      text(`/${v.mhp}`, 302, y + 1, { size: 7, color: COLORS.dim });
      bar(340, y + 1, 60, 3, v.hp / v.mhp, v.hp < v.mhp * 0.25 ? "#ff5a5a" : "#7dff9a");
      bar(340, y + 6, 60, 2.5, v.ck / Math.max(v.mck, 1), "#4ab8ff");
      text(`${Math.round(v.ck)}`, 466, y, { size: 7.5, align: "right", color: COLORS.ck });
      if (active && state === "cmd") hand(166, y + 4.5, t);
    });
    if (state === "cmd") {
      const f = fs[b.phase.who];
      const items = cmdItems();
      win(4, 210 - items.length * 13, 108, 10 + items.length * 13);
      const y0 = 215 - items.length * 13;
      items.forEach((it, k) => ui.hit(`bcmd:${k}`, 8, y0 + k * 13 - 2, 100, 13));
      items.forEach((it, k) => text(typeof it === "string" ? it : it.label, 26, y0 + k * 13, { size: 9, color: typeof it === "object" && it.disabled ? COLORS.dim : typeof it === "object" && it.color ? it.color : COLORS.text }));
      hand(24, y0 + menu.cmd * 13 + 5, t);
      const fi = f.ftier > f.form ? formInfo(f.body.who.$, f.ftier) : null;
      const lines = ["A combo strike. Restores 8 chakra.", "Use a jutsu.", "Use an item from your pouch.", "Halve damage until your next turn. +15 chakra.", fi ? `${fi.name}: ${fi.desc} Drains ${fi.drain} chakra per turn.` : ""];
      if (ui.hoverIndex("btgt") < 0) topInfo(lines[menu.cmd] ?? "");
      hints([["x", "Choose"], ["r", "Hold: fast"]]);
      void f;
    }
    if (state === "jutsu") {
      const js = jutsuList();
      win(4, 198, W - 8, 70);
      js.forEach((j, k) => {
        const y = 205 + k * 14.5;
        ui.hit(`bjut:${k}`, 24, y - 2, W - 40, 14.5);
        const col = j.ok ? COLORS.text : COLORS.dim;
        diamond(34, y + 5, 3, j.nat ? NATURE_COLORS[j.nat] : "#9098b8");
        text(j.known ? j.info.name : `??? (Lv ${j.lvl})`, 42, y, { size: 8.5, color: col });
        if (j.known) {
          text(j.nat ? NATURE_NAMES[j.nat] : "", 210, y + 1, { size: 7, color: NATURE_COLORS[j.nat] });
          text(`Lv${j.jlv}`, 270, y + 1, { size: 7, color: "#a8b8ff" });
          text(`CD ${G.move_cd(j.move)}`, 330, y + 1, { size: 7, color: COLORS.dim });
          text(j.cd ? `wait ${j.cd}` : j.info.hpcost ? `${j.info.hpcost}% HP` : `${j.info.cost} CK`, 460, y, { size: 8, align: "right", color: j.cd ? "#ff9a9a" : j.info.hpcost ? "#ff9a9a" : COLORS.ck });
        }
      });
      hand(30, 205 + menu.jutsu * 14.5 + 5, t);
      const j = js[menu.jutsu];
      topInfo(j.known ? `${j.nat ? `[${NATURE_NAMES[j.nat]}] ` : ""}${j.info.desc}` : `Unlocks at level ${j.lvl}.`);
      hints([["x", "Use"], ["o", "Back"]]);
    }
    if (state === "tools") {
      const ts = toolList();
      win(4, 198, W - 8, 70);
      ts.forEach((tl, k) => {
        const x = 30 + (k % 2) * 230, y = 205 + Math.floor(k / 2) * 14.5;
        ui.hit(`btool:${k}`, x - 6, y - 2, 220, 14.5);
        text(tl.info.name, x, y, { size: 8.5 });
        text(`x${tl.n}`, x + 190, y, { size: 8.5, align: "right", color: "#a8b8ff" });
      });
      hand(28 + (menu.tool % 2) * 230, 205 + Math.floor(menu.tool / 2) * 14.5 + 5, t);
      topInfo(ts[menu.tool]?.info.desc ?? "");
      hints([["x", "Use"], ["o", "Back"]]);
    }
    if (state === "target") {
      const p = pending;
      const single = p.tgt === "OneFoe" || p.tgt === "OneAlly" || p.tgt === "DownAlly";
      const ids = single ? [p.list[menu.tgt]] : p.list;
      for (const i of ids) {
        const c = center(i);
        const v = view[i];
        if (v.side === 1) hand(c.x - (v.art.big ? 50 : 14), c.y, t);
        else hand(c.x + 14, c.y, t, -1);
      }
      if (single) {
        const v = view[p.list[menu.tgt]];
        const seen = v.side === 1 ? seenMoves(v.key) : [];
        topInfo(`${v.name}   HP ${Math.round(v.hp)}/${v.mhp}${v.side === 1 ? `   ${seen.length ? `Seen: ${seen.join(", ")}` : "No jutsu seen yet"}` : ""}`);
      } else topInfo(p.tgt === "AllFoes" ? "All enemies" : "Whole squad");
      hints([["x", "Confirm"], ["o", "Back"]]);
    }
  }

  function topInfo(str) {
    win(4, 4, W - 8, 22);
    text(str, 14, 10, { size: 8 });
  }

  function drawCutin(t) {
    const { v, a, col } = cutin;
    const k = cutin.t / cutin.dur;
    const inK = ease.out(clamp(k / 0.25, 0, 1));
    const outK = ease.in(clamp((k - 0.8) / 0.2, 0, 1));
    const party = v.side === 0;
    const off = (1 - inK) * (party ? W : -W) + outK * (party ? -W : W);
    ctx.save();
    fill("#000", 0.35 * (1 - outK));
    ctx.translate(off, 0);
    ctx.beginPath();
    ctx.moveTo(0, 80); ctx.lineTo(W, 60); ctx.lineTo(W, 150); ctx.lineTo(0, 170); ctx.closePath();
    const g = ctx.createLinearGradient(0, 60, 0, 170);
    g.addColorStop(0, "#14141e"); g.addColorStop(0.5, "#24243a"); g.addColorStop(1, "#14141e");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.clip();
    // speed lines
    ctx.strokeStyle = col;
    for (let j = 0; j < 22; j++) {
      const y = 60 + ((j * 37) % 110);
      const x = ((t * 0.9 + j * 97) % (W + 120)) - 60;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1 + (j % 3);
      ctx.beginPath(); ctx.moveTo(party ? W - x : x, y); ctx.lineTo((party ? W - x : x) + (party ? 50 : -50), y - 4); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = col;
    ctx.fillRect(0, 76, W, 2);
    ctx.fillRect(0, 150, W, 2);
    v.art.portrait(party ? 360 : 120, 168, v.art.big ? 1 : 3.2, t);
    ctx.restore();
    ctx.save();
    ctx.translate(off * 0.6, 0);
    bigText(a.info.name, party ? 160 : 320, 116, { size: 20, color: "#ffffff", outline: "#000", lw: 4, italic: true });
    if (a.nat) text(NATURE_NAMES[a.nat].toUpperCase() + " STYLE", party ? 160 : 320, 132, { size: 8, align: "center", color: col, weight: 800 });
    ctx.restore();
  }

  function drawBanner() {
    const k = banner.t / 900;
    const s = k < 0.15 ? ease.back(k / 0.15) : 1;
    const a = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 70, W, 50);
    ctx.translate(W / 2, 95);
    ctx.scale(s, s);
    bigText(banner.text, 1.5, 1.5, { size: 26, color: banner.cols[1], outline: banner.cols[1], lw: 1, italic: true });
    bigText(banner.text, 0, 0, { size: 26, color: banner.cols[0], outline: "#14080a", lw: 4, italic: true });
    ctx.restore();
    text("COMBINATION", W / 2, 112, { size: 7.5, align: "center", color: "#ffffff", alpha: a, weight: 800 });
  }

  function drawTurnStrip() {
    if (state === "result" || state === "resultWait") return;
    // predict the next 7 actors from the charge timers
    const fs = fsNow();
    const tm = fs.map((f) => f.tmr);
    const delay = (f) => Math.floor(12000 / Math.max(1, Math.floor((f.spd * (100 + f.bon.haste)) / 100)));
    const out = state === "cmd" || state === "jutsu" || state === "tools" || state === "target" ? [b.phase.who] : [];
    for (let n = out.length; n < 7; n++) {
      let best = -1;
      fs.forEach((f, i) => { if (f.hp > 0 && (best < 0 || tm[i] < tm[best])) best = i; });
      if (best < 0) break;
      out.push(best);
      tm[best] += delay(fs[best]);
    }
    const x0 = W - 10 - out.length * 15;
    out.forEach((i, k) => {
      const v = view[i];
      const x = x0 + k * 15;
      ctx.save();
      ctx.fillStyle = v.side === 0 ? "#2a4cc8" : "#a02a2a";
      ctx.strokeStyle = k === 0 ? "#ffe070" : "#f0f0ff";
      ctx.lineWidth = k === 0 ? 1.5 : 0.8;
      ctx.beginPath(); ctx.arc(x + 6, 36, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      text(v.name[0], x + 6, 32, { size: 7, align: "center", weight: 800 });
    });
  }

  function drawResult(t) {
    ui.anywhere();
    if (result.phase === "Won") bigText("VICTORY!", W / 2, 70, { size: 28, color: "#ffd84a", outline: "#2a1400", lw: 4, italic: true });
    if (result.phase === "Lost") { fill("#200008", Math.min(0.6, result.t / 1500)); bigText("THE SQUAD HAS FALLEN", W / 2, 90, { size: 18, color: "#ff6060", lw: 4 }); }
    if (result.phase === "Fled") bigText("ESCAPED!", W / 2, 80, { size: 22, color: "#d0e0ff", lw: 4, italic: true });
    if (result.phase === "spoils") {
      const lines = [result.msg, ...result.ups];
      win(W / 2 - 150, 52, 300, 18 + lines.length * 13);
      lines.forEach((l, k) => text(l, W / 2, 60 + k * 13, { size: 8.5, align: "center", color: k ? "#7dff9a" : COLORS.text }));
    }
    if (result.t > 900 || state === "resultWait") hints([["x", "Continue"]]);
    void t;
  }
});
