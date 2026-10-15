// Boot, the frame loop, scenes and transitions.
import { ctx, canvas, W, H, SCALE, pollInput, input, resetTransform, ease, clamp } from "./core.js";
import { fill, text, win, bar, COLORS } from "./gfx.js";
import * as audio from "./audio.js";
import { loadMugen } from "./mugen.js";
import { G, saveRun, loadRun, arr as listArr } from "./bend.js";
import { logInput } from "./runlog.js";

export const game = {
  run: null,
  scene: null,
  trans: null,
  t: 0,
  /** Switch scenes with a transition: "fade" | "battle" | "none". */
  go(scene, how = "fade") {
    if (how === "none" || !this.scene) { this.set(scene); return; }
    const snap = document.createElement("canvas");
    snap.width = canvas.width;
    snap.height = canvas.height;
    snap.getContext("2d").drawImage(canvas, 0, 0);
    this.trans = { how, t: 0, dur: how === "battle" ? 1100 : 520, next: scene, snap, swapped: false };
  },
  set(scene) {
    this.scene?.leave?.();
    this.scene = scene;
    scene.enter?.();
  },
  /** Apply a rules input; saves the run. Returns the new run. */
  act(inp) {
    const before = this.run?.party ? listArr(this.run.party).map((m) => m.ftier) : [];
    const prev = this.run;
    this.run = G.input(this.run, inp);
    if (!this.demo) logInput(inp, prev, this.run);
    listArr(this.run.party).forEach((m, i) => { if (m.ftier > (before[i] ?? m.ftier)) this.awaken.push({ i, tier: m.ftier }); });
    if (!this.demo) saveRun(this.run);
    return this.run;
  },
  save() { if (this.run && !this.demo) saveRun(this.run); },
  demo: false,
  awaken: [], // forms earned, shown before returning to the map
};

const scenes = {};
export function registerScene(name, factory) { scenes[name] = factory; }
export function scene(name, ...args) {
  const s = scenes[name](...args);
  const inner = s.info;
  s.info = () => ({ name, ...(inner?.() ?? {}) });
  return s;
}

// Read-only hook for tools/drive.mjs (headless play-testing).
window.__tbh = game;

/** Pick the scene that matches the run's mode. */
export function route(how = "fade") {
  const m = game.run?.mode?.$;
  if (!m) return game.go(scene("title"), how);
  if (game.awaken.length && m !== "InBattle") return game.go(scene("awaken"), how);
  const map = { OnMap: "map", InVillage: "village", InEvent: "event", InRest: "rest", InBattle: "battle", InLoot: "loot", GameOver: "end", Victory: "end" };
  game.go(scene(map[m] ?? "map"), how !== "none" && m === "InBattle" ? "battle" : how);
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

function drawTransition(dt) {
  const tr = game.trans;
  tr.t += dt;
  const k = clamp(tr.t / tr.dur, 0, 1);
  if (tr.how === "battle") {
    // The classic encounter swirl: the old screen shatters into spinning shards.
    if (k < 0.62) {
      const p = k / 0.62;
      fill("#000");
      const n = 6;
      for (let yi = 0; yi < n; yi++) for (let xi = 0; xi < n * 1.8; xi++) {
        const sw = W / (n * 1.8), sh = H / n;
        const cx = xi * sw + sw / 2, cy = yi * sh + sh / 2;
        const ang = (Math.atan2(cy - H / 2, cx - W / 2) + p * 3) % (Math.PI * 2);
        const dist = ease.in(p) * 260;
        ctx.save();
        ctx.translate(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
        ctx.rotate(p * 4 * ((xi + yi) % 2 ? 1 : -1));
        ctx.scale(1 - p * 0.6, 1 - p * 0.6);
        ctx.drawImage(tr.snap, xi * sw * SCALE, yi * sh * SCALE, sw * SCALE, sh * SCALE, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();
      }
      fill("#fff", Math.max(0, 0.8 - p * 2.5));
    } else {
      if (!tr.swapped) { tr.swapped = true; game.set(tr.next); }
      game.scene.draw(game.t);
      fill("#fff", 1 - ease.out((k - 0.62) / 0.38));
    }
  } else {
    if (k < 0.5) {
      ctx.drawImage(tr.snap, 0, 0, W, H);
      fill("#000", k * 2);
    } else {
      if (!tr.swapped) { tr.swapped = true; game.set(tr.next); }
      game.scene.draw(game.t);
      fill("#000", (1 - k) * 2);
    }
  }
  if (k >= 1) { if (!tr.swapped) game.set(tr.next); game.trans = null; }
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

// A scene that throws must not leave a frozen screen: show what happened and
// offer the title screen (the run was saved after the last action).
let crash = null;
function drawCrash() {
  resetTransform();
  fill("#08081a");
  win(60, 70, W - 120, 120);
  text("Something went wrong", W / 2, 82, { size: 11, align: "center", color: COLORS.hi });
  text("Your run was saved after your last action.", W / 2, 104, { size: 8, align: "center" });
  text(`(${crash.scene}: ${crash.msg.slice(0, 60)})`, W / 2, 122, { size: 6.5, align: "center", color: COLORS.dim });
  text("Press  ✕  to return to the title screen.", W / 2, 150, { size: 8.5, align: "center", color: "#ffe9a8" });
  if (input.pressed("ok") || input.pressed("menu")) { crash = null; game.trans = null; game.set(scene("title")); }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(now - last, 50);
  last = now;
  game.t = now;
  pollInput(dt);
  resetTransform();
  try {
    if (crash) drawCrash();
    else if (game.trans) drawTransition(dt);
    else if (game.scene) {
      game.scene.update?.(dt, now);
      game.scene.draw(now);
    }
  } catch (e) {
    console.error(e);
    crash = { msg: String(e?.message ?? e), scene: game.scene?.info?.().name ?? "?" };
    window.__tbhErrors = [...(window.__tbhErrors ?? []), crash];
  }
  requestAnimationFrame(frame);
}

async function boot() {
  input.onFirst(() => audio.unlock());
  canvas.focus();
  resetTransform();
  fill("#000");
  text("Loading...", W / 2, H / 2 - 5, { align: "center", size: 10 });
  await Promise.all([
    import("./scenes/title.js"), import("./scenes/squad.js"), import("./scenes/map.js"),
    import("./scenes/village.js"), import("./scenes/battle.js"), import("./scenes/menu.js"),
    import("./scenes/end.js"), import("./scenes/awaken.js"),
    import("./scenes/summon.js"), import("./scenes/collection.js"), import("./scenes/choice.js"), import("./scenes/bestiary.js"), import("./scenes/loot.js"),
  ]);
  await loadMugen((done, total) => {
    resetTransform();
    fill("#000");
    text("Summoning the shinobi...", W / 2, H / 2 - 14, { align: "center", size: 9 });
    bar(W / 2 - 80, H / 2 + 2, 160, 4, done / total, "#ff9a2a");
  });
  game.run = loadRun();
  // ?scene=battle|map|village|menu|reward lets the demo/screenshot tools jump in
  const q = new URLSearchParams(location.search);
  const demo = q.get("scene");
  if (demo) {
    const { demoRun } = await import("./demo.js");
    game.demo = true;
    game.run = demoRun(demo);
    const pages = { armory: "armory", contracts: "contracts", gear: "gear", will: "will", formsmenu: "forms" };
    if (demo === "menu") game.set(scene("menu"));
    else if (pages[demo]) game.set(scene("collection", pages[demo]));
    else if (demo === "awaken") { game.awaken.push({ i: 0, tier: 2 }); game.set(scene("awaken")); }
    else if (demo === "bestiary") game.set(scene("bestiary"));
    else route("none");
  } else game.set(scene("title"));
  requestAnimationFrame(frame);
}

boot();
