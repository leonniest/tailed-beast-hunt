// Loot (after fights, treasure, events, the run's start), Slay the Spire
// style: a list of rewards. Scrolls open with a summon reveal (or all at
// once), jutsu are taught through the slot picker, relics / Will of Fire /
// Affinity / the Mission Log are picked from cards. Required picks (marked)
// must be made before moving on; the rest can be skipped.
import { ctx, W, H, input, ui, ease, clamp } from "../core.js";
import { win, text, bigText, hand, hints, COLORS, wrap, NATURE_COLORS } from "../gfx.js";
import { FX } from "../fx.js";
import * as audio from "../audio.js";
import { game, registerScene, route, scene } from "../main.js";
import { arr, G, C, RARITY_COLORS, GRADE_COLORS, WILL_TRACKS, SCROLL_KINDS } from "../bend.js";
import { drawSummon } from "../art.js";
import { describe, freshSummons, drawSummonStrip } from "./summon.js";
import { SlotPicker, knownBy } from "../picker.js";

const MUST = new Set(["LWill", "LAff", "LTrain", "LLog"]);
const RAR_NAMES = ["Common", "Uncommon", "Rare"];
const RAR_COL = ["#dfe6ff", "#7fd8ff", "#ffd84a"];

export function lootLabel(run, l) {
  switch (l.$) {
    case "LScroll": return [`Summon: ${l.n} ${SCROLL_KINDS[l.kind]} Scroll${l.n > 1 ? "s" : ""}`, ["#c83a3a", "#3a7ac8", "#3aa860"][l.kind]];
    case "LJutsu": return ["New jutsu scroll (pick 1 of 3)", "#9affc0"];
    case "LRelic": return ["Relic (pick 1 of 3)", "#ffd84a"];
    case "LWill": return ["Will of Fire blessing (pick a track)", "#ff9a5a"];
    case "LAff": return ["Chakra Affinity (pick a line)", "#c89aff"];
    case "LTrain": return [`${G.who_name(arr(run.party)[l.who].who)} levelled up: train a jutsu (+${l.n})`, "#7dff9a"];
    case "LLog": return ["Mission Log reward (pick 1 of 4)", "#7fb8ff"];
    default: return [l.$, "#fff"];
  }
}

registerScene("loot", () => {
  let run = game.run;
  let cur = 0;
  let state = "list"; // list | reveal | cards | picker
  let reveal = null;   // { items, t, shown }
  let cards = null;    // { idx, kind, opts, cur }
  let picker = null;
  let summoned = null;
  const fx = new FX();
  const items = () => (run.mode.$ === "InLoot" ? arr(run.mode.items) : []);
  const mustLeft = () => items().some((l) => MUST.has(l.$));

  function act(inp) {
    run = game.act(inp);
    if (run.mode.$ !== "InLoot") { route(); return false; }
    cur = Math.min(cur, Math.max(0, items().length - 1));
    return true;
  }

  function openScrolls(idxs) {
    // claim from the back so indices stay valid
    const got = [];
    for (const i of [...idxs].sort((a, b) => b - a)) {
      if (!act(C("Loot", { idx: i, opt: 0, who: 0, slot: 0 }))) return;
      got.unshift(...arr(run.bag.got).map(describe));
    }
    reveal = { items: got, t: 0, shown: 0 };
    state = "reveal";
    audio.sfx("cutin");
  }

  function open(i) {
    const l = items()[i];
    if (!l) return;
    if (l.$ === "LScroll") { openScrolls([i]); return; }
    if (l.$ === "LTrain") {
      picker = new SlotPicker(run, {
        title: `${G.who_name(arr(run.party)[l.who].who)}: train a jutsu (+${l.n})`, train: l.n, who: l.who,
        onPick: (who, slot) => { picker = null; state = "list"; act(C("Loot", { idx: i, opt: 0, who, slot })); fx.flash("#7dff9a", 200); },
        onCancel: () => { picker = null; state = "list"; },
      });
      state = "picker";
      return;
    }
    const opts = l.$ === "LLog" ? arr(run.bag.cards) : arr(l.opts);
    cards = { idx: i, kind: l.$, opts, cur: 0, t: 0 };
    state = "cards";
    audio.sfx("ok");
  }

  function pickCard() {
    const { idx, kind, cur: o } = cards;
    if (kind === "LJutsu" && knownBy(run, cards.opts[o])) {
      // already known: this card levels it up instead
      cards = null;
      state = "list";
      audio.sfx("levelup");
      fx.flash("#9affc0", 200);
      act(C("Loot", { idx, opt: o, who: 0, slot: 0 }));
      return;
    }
    if (kind === "LJutsu") {
      const gen = cards.opts[o];
      picker = new SlotPicker(run, {
        title: `Teach ${G.move_info(G.gen_move(gen)).name}: choose who learns it and which jutsu it replaces`, gen,
        onPick: (who, slot) => { picker = null; cards = null; state = "list"; act(C("Loot", { idx, opt: o, who, slot })); fx.flash("#9affc0", 200); },
        onCancel: () => { picker = null; state = "cards"; },
        onSkip: () => { picker = null; cards = null; state = "list"; audio.sfx("back"); act(C("SkipLoot", { idx })); },
        skipLabel: "Replace nothing",
      });
      state = "picker";
      return;
    }
    cards = null;
    state = "list";
    audio.sfx("levelup");
    act(C("Loot", { idx, opt: o, who: 0, slot: 0 }));
  }

  return {
    info: () => ({ state, items: items().map((l) => l.$) }),
    enter() { audio.play("village"); run = game.run; summoned = freshSummons(run); },
    update(dt) {
      fx.update(dt);
      if (state === "reveal") {
        reveal.t += dt;
        const due = Math.min(reveal.items.length, Math.floor(reveal.t / 140));
        while (reveal.shown < due) {
          const it = reveal.items[reveal.shown];
          const p = slotPos(reveal.shown, reveal.items.length);
          fx.burst(p.x, p.y, { n: it.r >= 3 ? 30 : 8, color: [RARITY_COLORS[it.r], "#ffffff"], speed: it.r >= 3 ? 2 : 1, life: 500 });
          if (it.r >= 3) { fx.flash(RARITY_COLORS[it.r], 220); audio.sfx("combo"); } else audio.sfx("coin");
          reveal.shown++;
        }
        if (input.pressed("ok") || input.pressed("back")) {
          if (reveal.shown < reveal.items.length) reveal.t = reveal.items.length * 140; // skip
          else { state = "list"; reveal = null; audio.sfx("ok"); }
        }
        return;
      }
      if (state === "picker") { picker.update(); return; }
      if (state === "cards") {
        cards.t += dt;
        const n = cards.opts.length;
        const m = ui.menu("card", cards.cur);
        cards.cur = m.cur;
        if (input.pressed("left")) { cards.cur = (cards.cur + n - 1) % n; audio.sfx("cursor"); }
        if (input.pressed("right")) { cards.cur = (cards.cur + 1) % n; audio.sfx("cursor"); }
        if (input.pressed("ok") || m.ok) pickCard();
        else if (input.pressed("back")) { state = "list"; cards = null; audio.sfx("back"); }
        else if (!MUST.has(cards.kind) && (input.pressed("alt") || ui.clicked("takenone"))) { const i = cards.idx; state = "list"; cards = null; audio.sfx("back"); act(C("SkipLoot", { idx: i })); }
        return;
      }
      // the list
      const its = items();
      const m = ui.menu("loot", cur);
      cur = m.cur;
      if (input.pressed("up")) { cur = (cur + its.length - 1) % Math.max(1, its.length); audio.sfx("cursor"); }
      if (input.pressed("down")) { cur = (cur + 1) % Math.max(1, its.length); audio.sfx("cursor"); }
      const skipIdx = ui.hoverIndex("skip");
      if (skipIdx >= 0 && ui.clicked(`skip:${skipIdx}`)) { audio.sfx("back"); act(C("SkipLoot", { idx: skipIdx })); return; }
      if (ui.clicked("openall") || input.pressed("l")) {
        const sc = its.map((l, i) => [l, i]).filter(([l]) => l.$ === "LScroll").map(([, i]) => i);
        if (sc.length) { openScrolls(sc); return; }
      }
      if ((input.pressed("ok") || m.ok) && its.length) open(cur);
      else if (input.pressed("alt") && its[cur] && !MUST.has(its[cur].$)) { audio.sfx("back"); act(C("SkipLoot", { idx: cur })); }
      else if (input.pressed("menu") || ui.clicked("continue")) {
        if (mustLeft()) { audio.sfx("buzz"); return; }
        audio.sfx("ok");
        act(C("LeaveLoot"));
      }
      if (!its.length && run.mode.$ === "InLoot") act(C("LeaveLoot"));
    },
    draw(t) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 300);
      g.addColorStop(0, "#2e2450");
      g.addColorStop(1, "#08061a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      if (state === "picker") { picker.draw(t); fx.drawParts(); fx.drawFlash(); return; }
      if (state === "reveal") { ui.anywhere(); drawReveal(reveal, t); fx.drawParts(); fx.drawFlash(); hints([["x", reveal.shown < reveal.items.length ? "Skip" : "Done"]]); return; }
      if (state === "cards") { drawCards(run, cards, t); fx.drawFlash(); return; }
      // list
      win(16, 8, W - 32, 22);
      text(run.mode.$ === "InLoot" ? run.mode.text : "", W / 2, 14, { size: 8, align: "center" });
      bigText("REWARDS", W / 2, 46, { size: 15, color: "#ffd84a", italic: true, lw: 3 });
      if (summoned) drawSummonStrip(summoned, 16, H - 52, W - 32);
      const its = items();
      const scrolls = its.filter((l) => l.$ === "LScroll").length;
      if (scrolls > 1) {
        const over = ui.over("openall");
        win(W / 2 - 70, 58, 140, 18, { top: over ? "#c86a2a" : "#a8481a", bottom: "#401004" });
        text(`Open all scrolls (${scrolls})`, W / 2, 63, { size: 8, align: "center", color: "#ffe9a8" });
        ui.hit("openall", W / 2 - 70, 58, 140, 18);
      }
      const y0 = scrolls > 1 ? 82 : 66;
      its.forEach((l, i) => {
        const y = y0 + i * 22;
        const [label, col] = lootLabel(run, l);
        const sel = i === cur;
        win(60, y, W - 120, 19, { dim: !sel, top: sel ? "#4a5fd0" : "#3a4fb8" });
        ui.hit(`loot:${i}`, 60, y, W - 160, 19);
        ctx.fillStyle = col;
        ctx.fillRect(68, y + 6, 7, 7);
        text(label, 82, y + 5, { size: 8, color: sel ? COLORS.hi : COLORS.text });
        if (MUST.has(l.$)) text("required", W - 70, y + 5, { size: 7, align: "right", color: "#ff9a7a" });
        else {
          const over = ui.over(`skip:${i}`);
          text("skip", W - 70, y + 5, { size: 7, align: "right", color: over ? "#ffffff" : COLORS.dim });
          ui.hit(`skip:${i}`, W - 100, y, 40, 19);
        }
        if (sel) hand(64, y + 9, t);
      });
      // continue
      const blocked = mustLeft();
      const cy = Math.min(H - 40, y0 + its.length * 22 + 8);
      win(W / 2 - 60, cy, 120, 20, { dim: blocked, top: blocked ? "#30324a" : "#3a8a4a", bottom: blocked ? "#14141e" : "#0a2a10" });
      text(blocked ? "Choose the required rewards" : "Continue", W / 2, cy + 6, { size: 8, align: "center", color: blocked ? COLORS.dim : "#e8ffe8" });
      ui.hit("continue", W / 2 - 60, cy, 120, 20);
      hints([["x", "Open"], ["s", "Skip"], ["t", "Continue"]]);
    },
  };
});

function slotPos(i, n) {
  const cols = n <= 5 ? n : n <= 10 ? 5 : 8;
  const rows = Math.ceil(n / cols);
  const cw = n <= 10 ? 88 : 56, ch = n <= 10 ? 84 : 60;
  const x0 = W / 2 - ((cols - 1) * cw) / 2;
  const y0 = H / 2 - ((rows - 1) * ch) / 2 - 4;
  return { x: x0 + (i % cols) * cw, y: y0 + Math.floor(i / cols) * ch, s: n <= 10 ? 1 : 0.7 };
}

function drawReveal(rv, t) {
  bigText("SUMMONING", W / 2, 16, { size: 14, color: "#ffd84a", italic: true, lw: 3 });
  rv.items.forEach((it, i) => {
    const p = slotPos(i, rv.items.length);
    const on = i < rv.shown;
    const k = on ? ease.back(clamp((rv.t - i * 140) / 220, 0, 1)) : 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale((on ? k : 0.9) * p.s, (on ? k : 0.9) * p.s);
    win(-38, -34, 76, 76, { top: on ? RARITY_COLORS[it.r] : "#3a3070", bottom: "#0a0618" });
    if (on) {
      if (it.kind === 1) drawSummon(it.sp, 0, 20, { scale: 0.42, t, face: "right" });
      else {
        ctx.fillStyle = RARITY_COLORS[it.r];
        ctx.beginPath();
        for (let q = 0; q < 8; q++) { const a = (q / 8) * Math.PI * 2 + t / 900; const r = q % 2 ? 7 : 15; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r - 6); }
        ctx.closePath();
        ctx.fill();
      }
      text(it.name, 0, 20, { size: 6.5, align: "center", color: "#ffffff" });
      text(it.sub, 0, 29, { size: 6, align: "center", color: RARITY_COLORS[it.r] });
    }
    ctx.restore();
  });
  if (rv.shown >= rv.items.length) text("The best weapon, contracts and gear are equipped automatically.", W / 2, H - 28, { size: 7.5, align: "center", color: "#c8c0ff" });
}

function drawCards(run, cd, t) {
  const titles = { LJutsu: "CHOOSE A JUTSU", LRelic: "CHOOSE A RELIC", LWill: "WILL OF FIRE", LAff: "CHAKRA AFFINITY", LLog: "MISSION LOG" };
  bigText(titles[cd.kind], W / 2, 22, { size: 15, color: "#ffd84a", italic: true, lw: 3 });
  const n = cd.opts.length;
  const cw = n >= 4 ? 108 : 132, gap = 8;
  const x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
  cd.opts.forEach((o, i) => {
    const k = ease.back(clamp((cd.t - i * 90) / 300, 0, 1));
    const x = x0 + i * (cw + gap), y = 46 + (1 - k) * 60;
    const sel = i === cd.cur;
    win(x, y - (sel ? 4 : 0), cw, 168, { dim: !sel, top: sel ? "#7a4ab8" : "#3a4fb8", bottom: sel ? "#200a40" : "#0d1656" });
    ui.hit(`card:${i}`, x, y - 4, cw, 172);
    const cx = x + cw / 2, yy = y - (sel ? 4 : 0);
    let name = "", body = "", sub = "", col = COLORS.hi;
    if (cd.kind === "LJutsu") {
      const mv = G.move_info(G.gen_move(o));
      const rar = G.gen_rarity(o);
      const kb = knownBy(run, o);
      name = mv.name; body = mv.desc; col = RAR_COL[rar];
      sub = `${RAR_NAMES[rar]}  ${mv.cost} chakra`;
      if (kb) { name = `Level up: ${mv.name}`; sub = `${kb.name}: Lv ${kb.lvl} -> ${Math.min(10, kb.lvl + 2)}`; col = "#7dff9a"; }
      ctx.fillStyle = NATURE_COLORS[G.move_nat(G.gen_move(o))] ?? "#fff";
      ctx.beginPath(); ctx.arc(cx, yy + 38, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#101018"; ctx.lineWidth = 1; ctx.stroke();
    } else if (cd.kind === "LRelic") {
      name = G.art_name(o); body = G.art_desc(o);
      ctx.save(); ctx.translate(cx, yy + 38); ctx.rotate(Math.sin(t / 700 + i) * 0.1);
      ctx.fillStyle = ["#ffd84a", "#7fd8ff", "#ff9a6a", "#7dff9a", "#d68cff"][G.art_id(o) % 5];
      ctx.beginPath(); for (let p = 0; p < 10; p++) { const r = p % 2 ? 9 : 20; const a = (p / 10) * Math.PI * 2 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#101018"; ctx.stroke(); ctx.restore();
    } else if (cd.kind === "LWill") {
      const lvl = arr(run.bag.will)[o] ?? 0;
      const [track, fx] = WILL_TRACKS[o];
      name = `${track} track`; body = `Level ${lvl} -> ${lvl + 1}`; sub = `${fx(lvl)} -> ${fx(lvl + 1)}`;
      bigText(String(lvl + 1), cx, yy + 38, { size: 22, color: "#ff9a5a", lw: 3 });
    } else if (cd.kind === "LAff") {
      name = `${G.stat_name(o.stat)} +${o.val}%`; col = GRADE_COLORS[o.grade];
      const lines = arr(run.bag.aff);
      const w = lines.map((l) => (l.stat === 99 ? 0 : l.grade + 1)).reduce((b, v, j, a) => (v < a[b] ? j : b), 0);
      const old = lines[w];
      body = `Replaces your weakest line: ${old && old.stat !== 99 ? `${G.stat_name(old.stat)} +${old.val}%` : "(empty)"}`;
      sub = ["Normal", "Rare", "Epic", "Unique", "Legendary"][o.grade] ?? "";
      bigText("◆", cx, yy + 38, { size: 26, color: col, lw: 3 });
    } else if (cd.kind === "LLog") {
      name = G.card_name(o.kind); body = `+${G.card_amount(o)}`; sub = o.lvl ? `upgraded x${o.lvl}` : "";
      bigText(body, cx, yy + 38, { size: 18, color: "#7dff9a", lw: 3 });
    }
    wrap(name, cw - 12, 8.5).slice(0, 2).forEach((l, j) => text(l, cx, yy + 66 + j * 11, { size: 8.5, align: "center", color: col }));
    if (sub) text(sub, cx, yy + 92, { size: 7, align: "center", color: "#c8c0ff" });
    wrap(body, cw - 14, 7.5).slice(0, 5).forEach((l, j) => text(l, cx, yy + 106 + j * 10, { size: 7.5, align: "center", color: "#dfe6ff" }));
    if (sel) hand(x + 6, yy + 38, t);
  });
  if (!MUST.has(cd.kind)) {
    const over = ui.over("takenone");
    win(W / 2 - 56, 222, 112, 20, { top: over ? "#6a6a8a" : "#4a4a6a", bottom: "#1a1a2a" });
    text("Take nothing", W / 2, 228, { size: 8, align: "center", color: over ? "#ffffff" : "#c8c8e0" });
    ui.hit("takenone", W / 2 - 56, 222, 112, 20);
  }
  hints(cd.kind === "LJutsu" ? [["x", "Choose"], ["s", "Take nothing"], ["o", "Back"]] : MUST.has(cd.kind) ? [["x", "Take"], ["o", "Back"]] : [["x", "Take"], ["s", "Take nothing"], ["o", "Back"]]);
}
