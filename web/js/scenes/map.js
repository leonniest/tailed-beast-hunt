// The act map (Slay the Spire style): an ink-on-parchment scroll climbing 12
// floors to a tailed beast. Pick one of the next nodes, walk there, meet it.
import { ctx, W, H, input, clamp, lerp, hash2, layer, ease, ui } from "../core.js";
import { win, text, bigText, hand, hints, bar, COLORS, diamond, wrap } from "../gfx.js";
import * as audio from "../audio.js";
import { game, registerScene, scene, route } from "../main.js";
import { arr, G, C, memberView, formInfo, sealedCount, loadMeta } from "../bend.js";
import { fighterArt, shadow } from "../art.js";
import { freshSummons, drawSummonStrip } from "./summon.js";

const KIND = ["", "Mission", "Elite", "Event", "Hot Spring", "Village", "Treasure", "Story", "Boss"];
const KIND_INFO = [
  "",
  "A squad of enemies. XP, ryo and scrolls.",
  "A dangerous named foe. Always drops a relic.",
  "Something happens. Choose how to respond.",
  "Rest, train, or meditate. One choice.",
  "Hospital, jutsu scrolls, relics and tools for ryo.",
  "A hidden cache: scrolls and a relic.",
  "A place from a ninja's past.",
  "The tailed beast of this act.",
];
const ACT_TINT = ["#efe2c0", "#d8d6cc", "#f2dcb4"];
const FLOOR_H = 44, TOP = 70, MAP_W = 392;
const PAPER_H = TOP + 13 * FLOOR_H + 80;
const START = { x: 196, y: TOP + 13 * FLOOR_H + 30 };

/** Scroll-space position of cell i (84 is the boss). */
function cellPos(i) {
  if (i === 999) return START;
  if (i === 84) return { x: 196, y: TOP };
  const f = Math.floor(i / 7), l = i % 7;
  return { x: 46 + l * 50 + (hash2(i, 3) - 0.5) * 16, y: TOP + (12 - f) * FLOOR_H + 36 + (hash2(i, 4) - 0.5) * 10 };
}

let parchment = null;
function paper(act) {
  if (parchment?.act === act) return parchment.c;
  const [c, g] = layer(MAP_W, PAPER_H);
  g.fillStyle = ACT_TINT[act] ?? ACT_TINT[0];
  g.fillRect(0, 0, MAP_W, PAPER_H);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(90,60,30,${hash2(i, 1) * 0.07})`;
    g.fillRect(hash2(i, 2) * MAP_W, hash2(i, 3) * PAPER_H, 1 + hash2(i, 4) * 3, 1);
  }
  for (let i = 0; i < 14; i++) {
    g.fillStyle = "rgba(120,90,50,0.05)";
    g.beginPath();
    g.ellipse(hash2(i, 5) * MAP_W, hash2(i, 6) * PAPER_H, 20 + hash2(i, 7) * 40, 12 + hash2(i, 8) * 30, 0, 0, Math.PI * 2);
    g.fill();
  }
  // ink doodles: waves (Waves), rain (Rain), peaks (Valley of the End)
  g.strokeStyle = "rgba(60,50,40,0.2)";
  g.lineWidth = 1;
  for (let i = 0; i < 46; i++) {
    const x = hash2(i, 9) * MAP_W, y = hash2(i, 10) * PAPER_H;
    g.beginPath();
    if (act === 0) { g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 4, x + 12, y); g.quadraticCurveTo(x + 18, y + 4, x + 24, y); }
    else if (act === 1) { g.moveTo(x, y); g.lineTo(x + 2, y + 8); g.moveTo(x + 6, y - 2); g.lineTo(x + 8, y + 6); }
    else { g.moveTo(x, y + 8); g.lineTo(x + 6, y); g.lineTo(x + 12, y + 8); }
    g.stroke();
  }
  // rolled scroll edges
  for (const x of [0, MAP_W - 6]) {
    const gr = g.createLinearGradient(x, 0, x + 6, 0);
    gr.addColorStop(0, "rgba(80,50,20,0.35)");
    gr.addColorStop(1, "rgba(80,50,20,0)");
    g.fillStyle = gr;
    g.fillRect(x, 0, 6, PAPER_H);
  }
  parchment = { act, c };
  return c;
}

function icon(kind, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#2a1c10";
  ctx.fillStyle = "#2a1c10";
  ctx.lineWidth = 1.2;
  switch (kind) {
    case 1: // crossed kunai
      for (const s of [-1, 1]) {
        ctx.save(); ctx.rotate(s * 0.75);
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(2, -2); ctx.lineTo(0, 7); ctx.lineTo(-2, -2); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      break;
    case 2: // oni mask
      ctx.fillStyle = "#a01818";
      ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(-9, -11); ctx.lineTo(-2, -7); ctx.moveTo(6, -5); ctx.lineTo(9, -11); ctx.lineTo(2, -7); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f4e8c8";
      ctx.fillRect(-4.5, -3, 3, 2.5); ctx.fillRect(1.5, -3, 3, 2.5); ctx.fillRect(-3, 3, 6, 1.5);
      break;
    case 3: // question scroll
      ctx.fillStyle = "#f8f0d8";
      ctx.fillRect(-6, -6, 12, 12); ctx.strokeRect(-6, -6, 12, 12);
      ctx.fillStyle = "#8a5a2a"; ctx.fillRect(-7.5, -7, 2, 14); ctx.fillRect(5.5, -7, 2, 14);
      bigText("?", 0, 0.5, { size: 9, color: "#2a1c10", outline: "#f8f0d8", lw: 0.1 });
      break;
    case 4: // hot spring
      ctx.beginPath(); ctx.ellipse(0, 4, 8, 3.5, 0, 0, Math.PI * 2); ctx.fillStyle = "#4a8ac8"; ctx.fill(); ctx.stroke();
      for (const dx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(dx, 1); ctx.quadraticCurveTo(dx + 2.5 * Math.sin(t / 300 + dx), -3, dx, -8); ctx.stroke(); }
      break;
    case 5: // village
      ctx.fillStyle = "#f4ecd8"; ctx.fillRect(-6, -1, 12, 8); ctx.strokeRect(-6, -1, 12, 8);
      ctx.fillStyle = "#c84a2a"; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(0, -9); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#2a1c10"; ctx.fillRect(-1.5, 2, 3, 5);
      break;
    case 6: // chest
      ctx.fillStyle = "#c08a3a"; ctx.fillRect(-8, -3, 16, 9); ctx.strokeRect(-8, -3, 16, 9);
      ctx.beginPath(); ctx.moveTo(-8, -3); ctx.quadraticCurveTo(0, -10, 8, -3); ctx.closePath(); ctx.fillStyle = "#a8702a"; ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f0c040"; ctx.fillRect(-2, -1, 4, 4);
      break;
    case 7: // story star
      bigText("★", 0, 0.5, { size: 15, color: "#ffc030", outline: "#2a1c10", lw: 2 });
      break;
  }
  ctx.restore();
}

const TIPS = [
  ["The map", "Each act is a one-way map. Pick one of the glowing nodes with ← → and press ✕ to go there."],
  ["Nodes", "Kunai: a mission. Red mask: an elite (always drops a relic). Scroll: an event. Water: a hot spring. House: a village. Chest: treasure."],
  ["The boss", "A tailed beast waits at the top. Seal it to heal, take a relic and move on to the next act."],
  ["Your squad", "Press △ for the menu: summon with scrolls, equip weapons, set contracts, upgrade gear. Spend everything; nothing carries over."],
  ["Forms", "Train a jutsu to Lv 3 for a ninja's first form. Later forms wait on ★ story nodes and relics. Transform in battle."],
];

registerScene("map", () => {
  let run = game.run;
  // a title card when an act begins, then (first run only) a few tips
  let card = null;
  if (!game.demo || new URLSearchParams(location.search).get("card")) {
    if (run.pos === 999 && game.cardAct !== run.act) card = { t: 0, tip: -1, tips: run.act === 0 && (loadMeta().runs ?? 0) <= 1 };
  }
  game.cardAct = run.act;
  let sel = 0;
  let walk = null; // { t, dur, from, to }
  let camY = 0;
  let toast = { msg: run.msg, t: 0 };
  let hoverNode = -1;
  let summoned = null, summonT = 0;
  const next = () => arr(G.next_cells(run));
  const focusY = (nx) => (walk ? null : nx.length ? (cellPos(run.pos).y + cellPos(nx[sel]).y) / 2 : cellPos(run.pos).y);
  const clampCam = (y) => clamp(y - H / 2 + 10, 0, PAPER_H - H);

  function arrive(to) {
    walk = null;
    run = game.act(C("Travel", { node: to }));
    toast = { msg: run.msg, t: 0 };
    sel = 0;
    const m = run.mode.$;
    if (m === "InBattle") { audio.sfx(run.mode.b.boss ? "beast" : "encounter"); route("battle"); }
    else if (m !== "OnMap") { audio.sfx("door"); route(); }
    else if (game.awaken.length) route();
  }

  return {
    info: () => ({ state: walk ? "walk" : "pick", act: run.act, pos: run.pos, next: next() }),
    enter() {
      audio.play("map");
      run = game.run;
      toast = { msg: run.msg, t: 0 };
      summoned = freshSummons(run);
      summonT = 0;
      camY = clampCam(focusY(next()));
    },
    update(dt) {
      toast.t += dt;
      summonT += dt;
      if (card) {
        card.t += dt;
        if (card.t > 600 && (input.pressed("ok") || input.pressed("back"))) {
          audio.sfx("ok");
          if (card.tips && card.tip < TIPS.length - 1) { card.tip++; card.t = 600; }
          else card = null;
        }
        return;
      }
      const nx = next();
      if (walk) {
        walk.t += dt;
        if (Math.floor(walk.t / 180) !== Math.floor((walk.t - dt) / 180)) audio.sfx("step");
        if (walk.t >= walk.dur) { arrive(walk.to); return; }
      } else if (nx.length) {
        sel = Math.min(sel, nx.length - 1);
        // mouse: hover a reachable node to select it, click to go
        const hn = ui.hoverIndex("node");
        if (hn >= 0 && nx.includes(hn)) {
          sel = nx.indexOf(hn);
          if (ui.clicked(`node:${hn}`)) { audio.sfx("ok"); walk = { t: 0, dur: 650, from: cellPos(run.pos), to: nx[sel] }; return; }
        }
        hoverNode = hn;
        if (input.pressed("left") || input.pressed("l")) { sel = (sel + nx.length - 1) % nx.length; audio.sfx("cursor"); }
        if (input.pressed("right") || input.pressed("r")) { sel = (sel + 1) % nx.length; audio.sfx("cursor"); }
        if (input.pressed("ok")) { audio.sfx("ok"); walk = { t: 0, dur: 650, from: cellPos(run.pos), to: nx[sel] }; }
        if (input.pressed("menu")) { audio.sfx("ok"); game.go(scene("menu"), "none"); }
      }
      const fy = walk ? lerp(walk.from.y, cellPos(walk.to).y, ease.inOut(clamp(walk.t / walk.dur, 0, 1))) : focusY(nx);
      camY = lerp(camY, clampCam(fy), 0.12);
    },
    draw(t) {
      ctx.fillStyle = "#24160c";
      ctx.fillRect(0, 0, W, H);
      const cy = Math.round(camY);
      ctx.drawImage(paper(run.act), 0, cy, MAP_W, H, 0, 0, MAP_W, H);
      ctx.save();
      ctx.translate(0, -cy);
      const cs = arr(run.map);
      const nx = walk ? [] : next();
      const reach = new Set(nx);
      // roads: dotted ink, the open ones in red
      const road = (a, b, live) => {
        ctx.save();
        ctx.strokeStyle = live ? "#b02020" : "rgba(60,40,25,0.5)";
        ctx.lineWidth = live ? 1.6 : 1;
        ctx.setLineDash(live ? [4, 2] : [2, 3]);
        if (live) ctx.lineDashOffset = -t / 60;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
      };
      cs.forEach((c, i) => { if (c.kind) for (const j of arr(c.links)) road(cellPos(i), cellPos(j), i === run.pos && reach.has(j)); });
      // (no lines from the start: the glowing floor-1 nodes are the choices, as in Slay the Spire)
      // nodes
      cs.forEach((c, i) => {
        if (!c.kind) return;
        const p = cellPos(i);
        if (c.kind === 8) {
          ctx.save();
          const g = ctx.createRadialGradient(p.x, p.y + 10, 4, p.x, p.y + 10, 46);
          g.addColorStop(0, "rgba(170,30,30,0.35)");
          g.addColorStop(1, "rgba(170,30,30,0)");
          ctx.fillStyle = g;
          ctx.fillRect(p.x - 50, p.y - 40, 100, 100);
          ctx.restore();
          ui.hit(`node:${i}`, p.x - 40, p.y - 30 - Math.round(camY), 80, 70);
          fighterArt(`beast${c.arg}`).draw(p.x, p.y + 30, { scale: 0.42, t, face: "left" });
          if (reach.has(i)) hand(p.x - 40, p.y + 10, t);
          bigText(G.beast_name(c.arg), p.x, p.y + 38, { size: 8, color: "#7a1010", outline: "#f4e8c8", lw: 3 });
          return;
        }
        const on = reach.has(i);
        ui.hit(`node:${i}`, p.x - 12, p.y - 12 - Math.round(camY), 24, 24);
        const k = on ? 1 + Math.sin(t / 180) * 0.1 : 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(k, k);
        ctx.fillStyle = on ? "rgba(255,246,214,0.95)" : "rgba(244,232,200,0.6)";
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = on ? "#b02020" : "rgba(60,40,25,0.55)";
        ctx.lineWidth = on ? 1.5 : 0.8;
        ctx.stroke();
        ctx.restore();
        if (i < run.pos && run.pos !== 999 && Math.floor(i / 7) < Math.floor(run.pos / 7)) ctx.globalAlpha = 0.45;
        icon(c.kind, p.x, p.y, t);
        ctx.globalAlpha = 1;
      });
      // the squad
      const lead = arr(run.party)[0];
      let pp = cellPos(run.pos);
      if (walk) {
        const k = ease.inOut(clamp(walk.t / walk.dur, 0, 1));
        const b = cellPos(walk.to);
        pp = { x: lerp(walk.from.x, b.x, k), y: lerp(walk.from.y, b.y, k) };
      }
      shadow(pp.x, pp.y + 7, 7);
      fighterArt(G.body_key(C("Ninja", { who: lead.who }))).draw(pp.x, pp.y + 8, { pose: walk ? "walk" : "idle", t, scale: 0.6, face: "left" });
      if (!walk && nx.length && nx[sel] !== 84) { const s = cellPos(nx[sel]); hand(s.x - 14, s.y, t); }
      ctx.restore();
      drawPanel(run, walk ? null : hoverNode >= 0 && arr(run.map)[hoverNode]?.kind ? hoverNode : nx[sel]);
      if (toast.msg && toast.t < 3400) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (3400 - toast.t) / 400);
        win(8, H - 34, MAP_W - 16, 22);
        text(toast.msg, MAP_W / 2, H - 28, { size: 7.5, align: "center" });
        ctx.restore();
      }
      if (summoned && summonT < 6000 && !card) drawSummonStrip(summoned, 8, 4, MAP_W - 16, Math.min(1, (6000 - summonT) / 600));
      hints([["l", "Path"], ["x", "Go"], ["t", "Menu"]], W - 6, H - 7);
      if (card) drawCard(run, card, t);
    },
  };
});

function drawCard(run, card, t) {
  ui.anywhere();
  if (card.tip >= 0) {
    const [title, body] = TIPS[card.tip];
    ctx.save();
    ctx.fillStyle = "rgba(0,0,10,0.55)";
    ctx.fillRect(0, 0, W, H);
    win(70, 80, W - 140, 96);
    text(`${title}  (${card.tip + 1}/${TIPS.length})`, 84, 88, { size: 9.5, color: COLORS.hi });
    wrap(body, W - 170, 8.5).forEach((l, i) => text(l, 84, 108 + i * 13, { size: 8.5 }));
    hints([["x", card.tip < TIPS.length - 1 ? "Next" : "Start"]], W - 76, 168);
    ctx.restore();
    return;
  }
  const k = Math.min(card.t / 500, 1);
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = "#06060f";
  ctx.fillRect(0, 0, W, H);
  // the boss as a red silhouette
  ctx.save();
  ctx.filter = "brightness(0.25) sepia(1) hue-rotate(-50deg) saturate(4)";
  fighterArt(`beast${(run.act + 1) * 3}`).draw(W / 2, 236, { t, scale: 1.25, alpha: 0.55 });
  ctx.restore();
  bigText(`ACT ${run.act + 1}`, W / 2, 70 - (1 - k) * 10, { size: 14, color: "#ffd84a", lw: 3 });
  bigText(G.act_name(run.act), W / 2, 96, { size: 20, color: "#ffffff", lw: 4, italic: true });
  text(`${G.beast_title((run.act + 1) * 3)} awaits at the end of the road.`, W / 2, 118, { size: 8.5, align: "center", color: "#ffb8a0" });
  if (card.t > 600) hints([["x", "Begin"]]);
  ctx.restore();
}

function drawPanel(run, target) {
  const x0 = MAP_W + 2, w = W - x0 - 4;
  win(x0, 4, w, 56);
  text(`ACT ${run.act + 1}`, x0 + 8, 9, { size: 9, color: COLORS.hi });
  text(`${run.ryo}`, x0 + w - 8, 9, { size: 7.5, align: "right", color: "#ffe070" });
  wrap(G.act_name(run.act), w - 14, 7).slice(0, 2).forEach((l, i) => text(l, x0 + 8, 21 + i * 9, { size: 7, color: "#c8d0ff" }));
  const sealed = arr(run.sealed);
  [3, 6, 9].forEach((tails, k) => {
    const x = x0 + 14 + k * 20;
    diamond(x, 49, 5, sealed.includes(tails) ? "#ffd84a" : k === run.act ? "#c03030" : "rgba(30,34,70,0.9)");
    text(String(tails), x + 7, 45, { size: 6.5, color: "#a8b0d8" });
  });
  const n = arr(run.party).length;
  win(x0, 62, w, 8 + n * 17);
  for (let i = 0; i < n; i++) {
    const v = memberView(run, i);
    const y = 67 + i * 17;
    text(v.name.split(" ").pop(), x0 + 8, y, { size: 7 });
    text(`Lv${v.lvl}`, x0 + w - 8, y, { size: 6.5, align: "right", color: "#a8b8ff" });
    bar(x0 + 8, y + 9, w - 16, 2.5, v.hp / v.mhp, v.hp < v.mhp * 0.3 ? "#ff5a5a" : "#7dff9a");
    bar(x0 + 8, y + 12, w - 16, 1.5, v.ck / v.mck, "#4ab8ff");
  }
  if (target === undefined || target === null) return;
  const c = arr(run.map)[target];
  const y0 = 74 + n * 17;
  const kind = c.kind;
  let info = KIND_INFO[kind];
  if (kind === 7) {
    const m = arr(run.party).find((mm) => G.who_id(mm.who) === c.arg);
    if (m) {
      const fi = formInfo(m.who.$, 2);
      info = `${G.who_name(m.who)}'s past lies here. ${fi.name} can awaken${sealedCount(run) >= fi.gate ? "." : ` once ${fi.gate} beast is sealed.`}`;
    }
  }
  if (kind === 8) info = `${G.beast_title(c.arg)}. Seal it to move on.`;
  if (kind === 1 || kind === 2) {
    const f = Math.floor(target / 7);
    info += ` Lv ${G.mission_lvl(run.act, f) + (kind === 2 ? 2 : 0)}.`;
  }
  const lines = wrap(info, w - 14, 6.8);
  win(x0, y0, w, 22 + lines.length * 9);
  text(KIND[kind], x0 + 8, y0 + 6, { size: 8.5, color: kind === 2 || kind === 8 ? "#ff8080" : kind === 7 ? "#ffd84a" : COLORS.hi });
  lines.forEach((l, i) => text(l, x0 + 8, y0 + 18 + i * 9, { size: 6.8, color: "#dfe6ff" }));
}
