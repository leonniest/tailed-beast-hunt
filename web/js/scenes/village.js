// A village: Hospital, Tool Shop, Training Grounds, Leave, over a painted backdrop.
import { ctx, W, H, input, layer, hash2, ui } from "../core.js";
import { win, text, hand, hints, bar, COLORS, menuList, wrap, NATURE_COLORS } from "../gfx.js";
import * as audio from "../audio.js";
import { game, registerScene, route, scene } from "../main.js";
import { arr, G, C, memberView, toolCounts, ALL_TOOLS, toolInfo } from "../bend.js";
import { SlotPicker, knownBy } from "../picker.js";
import { fighterArt, shadow, hokageRock } from "../art.js";
import { Leaves } from "../fx.js";

const VILLAGE_LOOK = {
  0: { sky: ["#6ab0f0", "#d8f0ff"], ground: "#7aa860", roof: "#c84a2a", wall: "#f0e4c8", greet: "The Hokage's office sends its regards." },
  5: { sky: ["#f0a860", "#f8e0b0"], ground: "#e0c088", roof: "#c8a060", wall: "#e8d0a0", greet: "Sand blows through the streets of Suna." },
  8: { sky: ["#8aa8c0", "#d8e4ec"], ground: "#7a9a90", roof: "#5a7a9a", wall: "#c8d4dc", greet: "Tazuna's bridge is nearly finished. The villagers wave." },
  11: { sky: ["#4a5a78", "#a0acc0"], ground: "#5a6a68", roof: "#3a4a5a", wall: "#a8b0b8", greet: "Rain drums on the pipes of Amegakure. Nobody asks questions here." },
  14: { sky: ["#a8a0c0", "#e8e0e0"], ground: "#9a8a6a", roof: "#8a6a4a", wall: "#c8b898", greet: "The Stone village stands firm." },
};

// Each act's village: Tazuna's village (Waves), Amegakure market (Rain), Konoha.
const ACT_LOOK = [8, 11, 0];
const lookOf = (run) => ACT_LOOK[Math.min(run.act, 2)];

const scenes = new Map();
function backdropFor(i) {
  if (scenes.has(i)) return scenes.get(i);
  const L = VILLAGE_LOOK[i] ?? VILLAGE_LOOK[0];
  const [c, g] = layer(W, H);
  const gr = g.createLinearGradient(0, 0, 0, 160);
  gr.addColorStop(0, L.sky[0]);
  gr.addColorStop(1, L.sky[1]);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, 160);
  if (i === 0) {
    hokageRock(g, 100, 44, 1.05);
  } else if (i === 5) {
    g.fillStyle = "#d8b070"; g.beginPath(); g.moveTo(0, 110); g.quadraticCurveTo(120, 30, 240, 100); g.quadraticCurveTo(360, 20, 480, 100); g.lineTo(480, 160); g.lineTo(0, 160); g.closePath(); g.fill();
  } else if (i === 8) {
    for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(200,215,225,${0.25 + k * 0.1})`; g.fillRect(0, 60 + k * 18, W, 30); }
  } else if (i === 11) {
    g.fillStyle = "#7a8aa8"; for (const x of [40, 140, 300, 420]) { g.fillRect(x, 30 + (x % 40), 40, 140); }
  } else if (i === 14) {
    g.fillStyle = "#8a7a5a"; for (const x of [20, 100, 330, 410]) { g.beginPath(); g.moveTo(x, 160); g.lineTo(x + 20, 30 + (x % 50)); g.lineTo(x + 50, 160); g.closePath(); g.fill(); }
  }
  // houses
  for (let x = -6; x < W; x += 34) {
    const h = 28 + hash2(x, i, 3) * 26, y = 160 - h;
    const dome = i === 5;
    g.fillStyle = L.wall;
    if (dome) { g.beginPath(); g.ellipse(x + 15, y + 6, 15, 12, 0, Math.PI, 0); g.fill(); g.fillRect(x, y + 6, 30, h); }
    else g.fillRect(x, y, 30, h);
    g.fillStyle = "rgba(0,0,0,0.15)";
    g.fillRect(x + 22, y, 8, h);
    if (!dome) {
      g.fillStyle = L.roof;
      g.beginPath(); g.moveTo(x - 4, y + 2); g.lineTo(x + 15, y - 10); g.lineTo(x + 34, y + 2); g.closePath(); g.fill();
    }
    g.fillStyle = "#3a3040";
    g.fillRect(x + 6, y + 12, 5, 6);
    g.fillRect(x + 17, y + 12, 5, 6);
  }
  g.fillStyle = L.ground;
  g.fillRect(0, 160, W, H - 160);
  g.fillStyle = "rgba(0,0,0,0.08)";
  for (let y = 166; y < H; y += 8) g.fillRect(0, y, W, 1);
  scenes.set(i, c);
  return c;
}

const RAR_NAMES = ["Common", "Uncommon", "Rare"];
const RAR_COL = ["#dfe6ff", "#7fd8ff", "#ffd84a"];

registerScene("village", () => {
  let run = game.run;
  let state = "main"; // main | jutsu | relic | tools | picker
  let cur = 0, jcur = 0, rcur = 0, tcur = 0;
  let picker = null;
  let say = (VILLAGE_LOOK[lookOf(run)] ?? VILLAGE_LOOK[0]).greet;
  const leaves = new Leaves(lookOf(run) === 0 ? 18 : 0);
  const stock = () => (run.mode.$ === "InVillage" ? { jut: arr(run.mode.jut), arts: arr(run.mode.arts) } : { jut: [], arts: [] });

  const mainItems = () => {
    const cost = G.heal_cost(run);
    return [
      { label: `Hospital  (${cost ? `${cost} ryo` : "free"})`, id: "heal", disabled: run.ryo < cost },
      { label: "Jutsu scrolls", id: "jutsu" },
      { label: "Relics", id: "relic" },
      { label: "Tools", id: "tools" },
      { label: "Leave", id: "leave" },
    ];
  };
  const back = () => { state = "main"; audio.sfx("back"); say = "Anything else?"; };

  function buyJutsu(i) {
    const k = stock().jut[i];
    if (k === undefined || k >= 999) { audio.sfx("buzz"); return; }
    if (run.ryo < G.gen_price(k)) { audio.sfx("buzz"); say = "Not enough ryo."; return; }
    if (knownBy(run, k)) { run = game.act(C("VJutsu", { idx: i, who: 0, slot: 0 })); audio.sfx("levelup"); say = run.msg; return; }
    picker = new SlotPicker(run, {
      title: `Teach ${G.move_info(G.gen_move(k)).name} (${G.gen_price(k)} ryo): who learns it, replacing which jutsu?`, gen: k,
      onPick: (who, slot) => { run = game.act(C("VJutsu", { idx: i, who, slot })); audio.sfx("coin"); say = run.msg; picker = null; state = "jutsu"; },
      onCancel: () => { picker = null; state = "jutsu"; },
      onSkip: () => { picker = null; state = "jutsu"; audio.sfx("back"); },
      skipLabel: "Replace nothing",
    });
    state = "picker";
  }

  return {
    info: () => ({ state }),
    enter() { audio.play("village"); run = game.run; },
    update(dt) {
      leaves.update(dt);
      if (state === "picker") { picker.update(); return; }
      if (state === "main") {
        const it = mainItems();
        const m = ui.menu("vmain", cur);
        cur = m.cur;
        if (input.pressed("up")) { cur = (cur + it.length - 1) % it.length; audio.sfx("cursor"); }
        if (input.pressed("down")) { cur = (cur + 1) % it.length; audio.sfx("cursor"); }
        if (input.pressed("ok") || m.ok) {
          const sel = it[cur];
          if (sel.disabled) { audio.sfx("buzz"); return; }
          audio.sfx("ok");
          if (sel.id === "heal") { const free = G.heal_cost(run) === 0; run = game.act(C("VHeal")); audio.sfx("heal"); say = free ? "The Konoha medics patch you up for free." : run.msg; }
          if (sel.id === "jutsu") { state = "jutsu"; jcur = 0; say = "Scrolls from every village. Any ninja can learn them."; }
          if (sel.id === "relic") { state = "relic"; rcur = 0; say = "Rare finds. They will be gone next time."; }
          if (sel.id === "tools") { state = "tools"; tcur = 0; say = "Kunai, tags, pills. All top quality!"; }
          if (sel.id === "leave") { audio.sfx("door"); run = game.act(C("VLeave")); route(); }
        }
        if (input.pressed("back")) { cur = 4; audio.sfx("back"); }
        if (input.pressed("menu")) { audio.sfx("ok"); game.go(scene("menu"), "none"); }
        return;
      }
      if (input.pressed("back")) { back(); return; }
      if (state === "jutsu") {
        const n = stock().jut.length;
        const m = ui.menu("vjut", jcur);
        jcur = m.cur;
        if (input.pressed("left")) { jcur = (jcur + n - 1) % n; audio.sfx("cursor"); }
        if (input.pressed("right")) { jcur = (jcur + 1) % n; audio.sfx("cursor"); }
        if (input.pressed("ok") || m.ok) buyJutsu(jcur);
      } else if (state === "relic") {
        const n = Math.max(1, stock().arts.length);
        const m = ui.menu("vart", rcur);
        rcur = Math.min(m.cur, n - 1);
        if (input.pressed("left")) { rcur = (rcur + n - 1) % n; audio.sfx("cursor"); }
        if (input.pressed("right")) { rcur = (rcur + 1) % n; audio.sfx("cursor"); }
        if ((input.pressed("ok") || m.ok) && stock().arts.length) {
          const before = run.ryo;
          run = game.act(C("VArt", { idx: rcur }));
          if (run.ryo !== before) { audio.sfx("coin"); say = run.msg; rcur = 0; } else { audio.sfx("buzz"); say = "Not enough ryo."; }
        }
      } else if (state === "tools") {
        const m = ui.menu("tool", tcur);
        tcur = m.cur;
        if (input.pressed("up")) { tcur = (tcur + ALL_TOOLS.length - 1) % ALL_TOOLS.length; audio.sfx("cursor"); }
        if (input.pressed("down")) { tcur = (tcur + 1) % ALL_TOOLS.length; audio.sfx("cursor"); }
        if (input.pressed("ok") || m.ok) {
          const name = ALL_TOOLS[tcur];
          const before = run.ryo;
          run = game.act(C("VBuy", { tool: C(name) }));
          if (run.ryo !== before) { audio.sfx("coin"); say = `Thank you! One ${toolInfo(name).name}.`; } else audio.sfx("buzz");
        }
      }
    },
    draw(t) {
      ctx.drawImage(backdropFor(lookOf(run)), 0, 0);
      leaves.draw();
      if (state === "picker") { ctx.fillStyle = "rgba(0,0,20,0.6)"; ctx.fillRect(0, 0, W, H); picker.draw(t); return; }
      arr(run.party).forEach((m, i) => {
        const x = 330 + i * 34, y = 172;
        shadow(x, y, 9);
        fighterArt(G.body_key(C("Ninja", { who: m.who }))).draw(x, y, { t: t + i * 200, face: "left" });
      });
      win(8, 6, W - 16, 22);
      text(`${G.village_name(run.act)}   Act ${run.act + 1}`, 18, 12, { size: 9, color: COLORS.hi });
      text(`${run.ryo} ryo`, W - 18, 12, { size: 9, align: "right", color: "#ffe070" });
      win(8, 32, W - 16, 22);
      text(say, 18, 38, { size: 8 });
      win(8, 180, 170, 76, { dim: state !== "main" });
      menuList(mainItems(), 24, 188, cur, { active: state === "main", lh: 13, id: "vmain", hitW: 160 });
      drawParty(run, 186, 190);
      if (state === "jutsu") drawJutsu(run, stock().jut, jcur, t);
      if (state === "relic") drawRelics(run, stock().arts, rcur, t);
      if (state === "tools") drawShop(run, tcur, t);
      hints(state === "main" ? [["x", "Select"], ["t", "Menu"]] : [["x", "Buy"], ["o", "Back"]]);
    },
  };
});

function drawParty(run, x, y) {
  const n = arr(run.party).length;
  win(x, y, W - x - 8, 8 + n * 18, { dim: true });
  for (let i = 0; i < n; i++) {
    const v = memberView(run, i);
    const yy = y + 6 + i * 18;
    text(v.name, x + 14, yy, { size: 8 });
    text(`Lv ${v.lvl}`, x + 84, yy, { size: 7.5, color: "#a8b8ff" });
    text(`${v.hp}/${v.mhp}`, x + 170, yy, { size: 7.5, align: "right" });
    bar(x + 176, yy + 3, 70, 3, v.hp / v.mhp, "#7dff9a");
    bar(x + 176, yy + 8, 70, 2, v.ck / v.mck, "#4ab8ff");
  }
}

function drawJutsu(run, jut, cur, t) {
  jut.forEach((k, i) => {
    const x = 26 + i * 146, y = 60, sold = k >= 999;
    win(x, y, 136, 114, { dim: i !== cur || sold, top: i === cur ? "#4a5fd0" : "#3a4fb8" });
    ui.hit(`vjut:${i}`, x, y, 136, 114);
    if (sold) { text("Sold", x + 68, y + 50, { size: 10, align: "center", color: COLORS.dim }); return; }
    const mv = G.move_info(G.gen_move(k));
    const rar = G.gen_rarity(k);
    ctx.fillStyle = NATURE_COLORS[G.move_nat(G.gen_move(k))] ?? "#fff";
    ctx.beginPath(); ctx.arc(x + 18, y + 18, 8, 0, Math.PI * 2); ctx.fill();
    const kb = knownBy(run, k);
    text(kb ? `Lv up: ${mv.name}` : mv.name, x + 32, y + 10, { size: 8, color: kb ? "#7dff9a" : RAR_COL[rar] });
    text(kb ? `${kb.name}: Lv ${kb.lvl} -> ${Math.min(10, kb.lvl + 2)}` : `${RAR_NAMES[rar]}  ${mv.cost} chakra`, x + 32, y + 21, { size: 6.5, color: "#c8c0ff" });
    wrap(mv.desc, 120, 7.5).slice(0, 5).forEach((l, j) => text(l, x + 8, y + 38 + j * 10, { size: 7.5, color: "#dfe6ff" }));
    const price = G.gen_price(k);
    text(`${price} ryo`, x + 68, y + 98, { size: 8.5, align: "center", color: run.ryo >= price ? "#ffe070" : "#ff7070" });
    if (i === cur) hand(x + 6, y + 18, t);
  });
}

function drawRelics(run, arts, cur, t) {
  const price = G.relic_price(run);
  if (!arts.length) { win(150, 80, 200, 40); text("Sold out.", 250, 94, { size: 9, align: "center", color: COLORS.dim }); return; }
  arts.forEach((a, i) => {
    const x = 70 + i * 180, y = 60;
    win(x, y, 160, 114, { dim: i !== cur, top: i === cur ? "#7a4ab8" : "#3a4fb8" });
    ui.hit(`vart:${i}`, x, y, 160, 114);
    text(G.art_name(a), x + 80, y + 10, { size: 8.5, align: "center", color: COLORS.hi });
    wrap(G.art_desc(a), 144, 7.5).slice(0, 6).forEach((l, j) => text(l, x + 80, y + 28 + j * 10, { size: 7.5, align: "center", color: "#dfe6ff" }));
    text(`${price} ryo`, x + 80, y + 98, { size: 8.5, align: "center", color: run.ryo >= price ? "#ffe070" : "#ff7070" });
    if (i === cur) hand(x + 8, y + 14, t);
  });
}

function drawShop(run, cur, t) {
  const counts = toolCounts(run);
  win(150, 58, 322, 116);
  ALL_TOOLS.forEach((name, i) => {
    const info = toolInfo(name);
    const y = 64 + i * 11.5;
    const can = run.ryo >= info.cost;
    ui.hit(`tool:${i}`, 156, y - 2, 180, 11.5);
    text(info.name, 168, y, { size: 8, color: can ? COLORS.text : COLORS.dim });
    text(`${info.cost}`, 300, y, { size: 8, align: "right", color: "#ffe070" });
    text(`x${counts.get(name) ?? 0}`, 330, y, { size: 7.5, align: "right", color: "#a8b8ff" });
  });
  hand(165, 64 + cur * 11.5 + 4.5, t);
  const d = toolInfo(ALL_TOOLS[cur]).desc;
  wrap(d, 120, 7.5).forEach((l, i) => text(l, 342, 68 + i * 10, { size: 7.5, color: "#dfe6ff" }));
}
