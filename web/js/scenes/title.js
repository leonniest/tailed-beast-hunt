// Title screen: moonlit Konoha, falling leaves, the main menu, options and the
// Ninja Registry (meta unlocks).
import { ctx, W, H, input, layer, hash2, ui } from "../core.js";
import { win, text, bigText, hand, hints, fill, menuList, COLORS } from "../gfx.js";
import { mouse } from "../core.js";
import { Leaves } from "../fx.js";
import * as audio from "../audio.js";
import { game, registerScene, scene, route } from "../main.js";
import { loadRun, loadMeta, UNLOCKS, WHO, G, C } from "../bend.js";
import { fighterArt, hokageRock } from "../art.js";

let sky = null;
function paintSky() {
  if (sky) return sky;
  const [c, g] = layer(W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#0a0c24");
  gr.addColorStop(0.6, "#2a2458");
  gr.addColorStop(1, "#5a3a5a");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) {
    g.fillStyle = `rgba(255,255,255,${0.3 + hash2(i, 1) * 0.7})`;
    g.fillRect(hash2(i, 2) * W, hash2(i, 3) * H * 0.6, 1, 1);
  }
  // moon with a soft halo
  const halo = g.createRadialGradient(410, 50, 10, 410, 50, 70);
  halo.addColorStop(0, "rgba(255,240,200,0.35)");
  halo.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = halo;
  g.fillRect(330, 0, 150, 130);
  g.fillStyle = "#fff6d8";
  g.beginPath(); g.arc(410, 50, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(220,200,160,0.5)";
  g.beginPath(); g.arc(402, 44, 5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(419, 59, 3, 0, Math.PI * 2); g.fill();
  // the Hokage rock at night
  hokageRock(g, 90, 128, 1.05, "#4a4468", "#24203a", "#2e2a48");
  // village roofs
  for (let x = -10; x < W + 20; x += 22) {
    const h = 18 + hash2(x, 7) * 30, y = H - 40 - h;
    g.fillStyle = "#1a1630"; g.fillRect(x, y, 20, h + 40);
    g.fillStyle = "#2c2440"; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 10, y - 9); g.lineTo(x + 23, y); g.closePath(); g.fill();
    if (hash2(x, 8) > 0.45) { g.fillStyle = "#ffd070"; g.fillRect(x + 4, y + 8, 3, 3); g.fillRect(x + 12, y + 16, 3, 3); }
  }
  sky = c;
  return c;
}

registerScene("title", () => {
  const leaves = new Leaves(34);
  let phase = "press"; // press -> menu -> options | registry
  let cur = 0, ocur = 0, rcur = 0;
  let t0 = performance.now();
  const hasSave = () => !!loadRun() && !["GameOver", "Victory"].includes(loadRun()?.mode?.$);
  const items = () => [
    { label: "New Game", id: "new" },
    { label: "Continue", id: "cont", disabled: !hasSave() },
    { label: "Ninja Registry", id: "reg" },
    { label: "Bestiary", id: "best" },
    { label: "Options", id: "opt" },
  ];

  return {
    enter() { audio.play("title"); t0 = performance.now(); },
    update(dt) {
      leaves.update(dt);
      if (phase === "press") {
        if (input.pressed("ok") || input.pressed("menu")) { audio.sfx("ok"); phase = "menu"; }
        return;
      }
      if (phase === "menu") {
        const it = items();
        const m = ui.menu("title", cur);
        cur = m.cur;
        if (input.pressed("up")) { cur = (cur + it.length - 1) % it.length; audio.sfx("cursor"); }
        if (input.pressed("down")) { cur = (cur + 1) % it.length; audio.sfx("cursor"); }
        if (input.pressed("back")) { phase = "press"; audio.sfx("back"); }
        if (input.pressed("ok") || m.ok) {
          const sel = it[cur];
          if (sel.disabled) { audio.sfx("buzz"); return; }
          audio.sfx("ok");
          if (sel.id === "new") game.go(scene("squad"));
          if (sel.id === "cont") { game.run = loadRun(); route(); }
          if (sel.id === "opt") { phase = "options"; ocur = 0; }
          if (sel.id === "reg") { phase = "registry"; rcur = 0; }
          if (sel.id === "best") game.go(scene("bestiary"));
        }
        return;
      }
      if (phase === "options") {
        const s = audio.getSettings();
        const m = ui.menu("opt", ocur);
        ocur = m.cur;
        const md = ui.clicked("optL") ? -1 : ui.clicked("optR") ? 1 : 0;
        if (input.pressed("up")) { ocur = (ocur + 2) % 3; audio.sfx("cursor"); }
        if (input.pressed("down")) { ocur = (ocur + 1) % 3; audio.sfx("cursor"); }
        const mc = m.ok ? (mouse.x > W / 2 + 64 ? 1 : mouse.x > W / 2 + 30 ? -1 : 0) : 0;
        const d = input.pressed("right") || md > 0 || mc > 0 ? 1 : input.pressed("left") || md < 0 || mc < 0 ? -1 : 0;
        if (d) {
          if (ocur === 0) s.music = Math.max(0, Math.min(1, Math.round((s.music + d * 0.1) * 10) / 10));
          if (ocur === 1) s.sfx = Math.max(0, Math.min(1, Math.round((s.sfx + d * 0.1) * 10) / 10));
          if (ocur === 2) s.speed = [1, 1.5, 2][([1, 1.5, 2].indexOf(s.speed) + 3 + d) % 3];
          audio.saveSettings();
          audio.sfx("cursor");
        }
        if (input.pressed("back") || input.pressed("ok")) { phase = "menu"; audio.sfx("back"); }
        return;
      }
      if (phase === "registry") {
        rcur = ui.menu("reg", rcur).cur;
        if (input.pressed("left")) { rcur = (rcur + WHO.length - 1) % WHO.length; audio.sfx("cursor"); }
        if (input.pressed("right")) { rcur = (rcur + 1) % WHO.length; audio.sfx("cursor"); }
        if (input.pressed("up")) { rcur = (rcur + WHO.length - 4) % WHO.length; audio.sfx("cursor"); }
        if (input.pressed("down")) { rcur = (rcur + 4) % WHO.length; audio.sfx("cursor"); }
        if (input.pressed("back") || input.pressed("ok")) { phase = "menu"; audio.sfx("back"); }
      }
    },
    draw(t) {
      ctx.drawImage(paintSky(), 0, 0);
      leaves.draw();
      const intro = Math.min((t - t0) / 900, 1);
      // title
      const ty = 40 - (1 - intro) * 20;
      bigText("TAILED BEAST", W / 2 - 40, ty, { size: 28, color: "#ff9a2a", outline: "#2a0a00", lw: 5, italic: true, alpha: intro });
      bigText("HUNT", W / 2 + 58, ty + 30, { size: 34, color: "#ffd84a", outline: "#2a0a00", lw: 5, italic: true, alpha: intro });
      text("a Naruto roguelike", W / 2 + 58, ty + 52, { size: 8, align: "center", color: "#e8d8ff", alpha: intro, italic: true });
      if (phase === "press") {
        ui.anywhere();
        if (Math.floor(t / 500) % 2) bigText("CLICK OR PRESS  ✕  TO START", W / 2, 200, { size: 11, color: "#ffffff", lw: 3 });
        text("Mouse: click / right-click back    Keys: Z = ✕   X = ○   C = △   Arrows move", W / 2, 250, { size: 7, align: "center", color: "#b8b0d8" });
        return;
      }
      if (phase === "menu") {
        const it = items();
        win(W / 2 - 62, 140, 124, 14 + it.length * 13);
        menuList(it, W / 2 - 42, 148, cur, { lh: 13, id: "title", hitW: 120 });
        hints([["x", "Select"], ["o", "Back"]]);
      }
      if (phase === "options") {
        const s = audio.getSettings();
        win(W / 2 - 100, 140, 200, 70);
        const rows = [["Music", `${Math.round(s.music * 10)}`], ["Sound effects", `${Math.round(s.sfx * 10)}`], ["Battle speed", `${s.speed}x`]];
        rows.forEach(([k, v], i) => {
          ui.hit(`opt:${i}`, W / 2 - 92, 148 + i * 15, 184, 15);
          text(k, W / 2 - 78, 152 + i * 15);
          text(`◂ ${v} ▸`, W / 2 + 84, 152 + i * 15, { align: "right", color: i === ocur ? COLORS.hi : COLORS.text });
        });
        hand(W / 2 - 81, 157 + ocur * 15);
        hints([["x", "Done"]]);
      }
      if (phase === "registry") drawRegistry(rcur, t);
    },
  };
});

function drawRegistry(cur, t) {
  const meta = loadMeta();
  fill("#000", 0.45);
  win(14, 12, W - 28, H - 36);
  text("NINJA REGISTRY", 28, 22, { size: 11, color: COLORS.hi });
  text(`Runs ${meta.runs}   Wins ${meta.totalWins}   Best day ${meta.bestDay}   Most seals ${meta.bestSealed}   Victories ${meta.victories}`, W - 30, 25, { size: 7.5, align: "right", color: "#c8d0ff" });
  WHO.forEach((w, i) => {
    const x = 40 + (i % 4) * 104, y = 52 + Math.floor(i / 4) * 86;
    const open = meta.unlocked.includes(w);
    win(x - 8, y - 6, 96, 78, { dim: i !== cur, top: open ? "#3a4fb8" : "#30324a", bottom: open ? "#0d1656" : "#14141e" });
    ui.hit(`reg:${i}`, x - 8, y - 6, 96, 78);
    const art = fighterArt(G.body_key(C("Ninja", { who: C(w) })));
    ctx.save();
    if (!open) ctx.filter = "brightness(0)";
    art.draw(x + 40, y + 52, { pose: i === cur ? "ready" : "idle", t, scale: 1 });
    ctx.restore();
    text(open ? G.who_name(C(w)) : "???", x + 40, y + 56, { size: 8, align: "center", color: open ? COLORS.text : COLORS.dim });
    if (i === cur) hand(x - 8, y + 30, t);
  });
  const w = WHO[cur];
  const open = meta.unlocked.includes(w);
  const u = UNLOCKS[w];
  const line = open ? `${G.who_passive(C(w))}: ${G.who_passive_desc(C(w))}` : `Locked. ${u.text}`;
  text(line, W / 2, H - 46, { size: 8, align: "center", color: open ? "#dfe6ff" : "#ffb0b0" });
  hints([["o", "Back"]]);
}
