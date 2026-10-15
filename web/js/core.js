// Screen, input and timing. The game draws in PSP logical pixels (480 x 272)
// on a canvas twice that size: pixel art is upscaled 2x, text stays smooth.

export const W = 480, H = 272, SCALE = 2;

export const canvas = document.getElementById("screen");
canvas.width = W * SCALE;
canvas.height = H * SCALE;
export const ctx = canvas.getContext("2d");

export function resetTransform() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
resetTransform();

// Fit the window: whole multiples of 480x272 when possible, letterboxed.
function fit() {
  const k = Math.min(innerWidth / W, innerHeight / H);
  const s = k >= 1 ? Math.floor(k) : k;
  canvas.style.width = `${Math.round(W * s)}px`;
  canvas.style.height = `${Math.round(H * s)}px`;
}
addEventListener("resize", fit);
fit();

// ---------------------------------------------------------------------------
// Input: PSP buttons. ok = Cross, back = Circle, menu = Triangle, alt = Square.
// ---------------------------------------------------------------------------

const KEYS = {
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  KeyZ: "ok", Enter: "ok", Space: "ok", NumpadEnter: "ok",
  KeyX: "back", Escape: "back", Backspace: "back",
  KeyC: "menu", Tab: "menu", KeyV: "alt", KeyQ: "l", KeyE: "r",
};
const PAD = { 0: "ok", 1: "back", 2: "alt", 3: "menu", 4: "l", 5: "r", 9: "ok", 12: "up", 13: "down", 14: "left", 15: "right" };
const DIRS = new Set(["up", "down", "left", "right"]);

const held = new Map();     // button -> ms held
const fresh = new Set();    // pressed this frame (edge or key repeat)
const keyDown = new Set();
let padDown = new Set();
const listeners = [];

export const input = {
  /** True once per press (directions auto-repeat while held). */
  pressed(b) { return fresh.has(b); },
  held(b) { return held.has(b); },
  any() { return fresh.size > 0; },
  onFirst(fn) { listeners.push(fn); },
};

addEventListener("keydown", (e) => {
  const b = KEYS[e.code];
  if (!b) return;
  e.preventDefault();
  keyDown.add(b);
  for (const fn of listeners.splice(0)) fn();
});
addEventListener("keyup", (e) => { const b = KEYS[e.code]; if (b) keyDown.delete(b); });
addEventListener("blur", () => keyDown.clear());
// ---------------------------------------------------------------------------
// Mouse: the whole game is playable with it. Scenes register clickable
// rectangles while drawing (ui.hit); the next frame hit-tests against them.
// Clicking a "key:<button>" region presses that button (on-screen hints use
// this), right-click is back, the wheel scrolls lists.
// ---------------------------------------------------------------------------

export const mouse = { x: -1, y: -1, moved: false, click: false, rclick: false, over: null };
const mq = { moved: false, click: false, rclick: false, wheel: 0 };
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * W;
  mouse.y = ((e.clientY - r.top) / r.height) * H;
}
canvas.addEventListener("pointermove", (e) => { toLogical(e); mq.moved = true; });
canvas.addEventListener("pointerdown", (e) => {
  canvas.focus();
  for (const fn of listeners.splice(0)) fn();
  toLogical(e);
  if (e.button === 2) mq.rclick = true; else if (e.button === 0) mq.click = true;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("wheel", (e) => { e.preventDefault(); mq.wheel += Math.sign(e.deltaY); }, { passive: false });
canvas.addEventListener("pointerleave", () => { mouse.x = mouse.y = -1; });

let regions = [], nextRegions = [];
export const ui = {
  /** Register a clickable rectangle for this frame (call while drawing). */
  hit(id, x, y, w, h) { nextRegions.push({ id, x, y, w, h }); },
  /** The whole screen means "continue" (register first; others sit on top). */
  anywhere() { nextRegions.push({ id: "key:ok", x: 0, y: 0, w: W, h: H }); },
  /** Region under the mouse (from last frame's draw), or null. */
  top() { return mouse.over; },
  over(id) { return mouse.over === id; },
  clicked(id) { return mouse.click && mouse.over === id; },
  /** Index i of a hovered "<prefix>:i" region, or -1. */
  hoverIndex(prefix) {
    const o = mouse.over;
    return o && o.startsWith(`${prefix}:`) ? Number(o.slice(prefix.length + 1)) : -1;
  },
  /**
   * A list's cursor under the mouse: hovering moves it, clicking picks.
   * Returns { cur, ok } (ok: the item was clicked this frame).
   */
  menu(prefix, cur) {
    const i = ui.hoverIndex(prefix);
    if (i < 0) return { cur, ok: false };
    return { cur: mouse.moved || mouse.click ? i : cur, ok: mouse.click };
  },
};

function pollMouse() {
  regions = nextRegions;
  nextRegions = [];
  mouse.moved = mq.moved;
  mouse.click = mq.click;
  mouse.rclick = mq.rclick;
  mouse.over = null;
  for (let i = regions.length - 1; i >= 0; i--) {
    const r = regions[i];
    if (mouse.x >= r.x && mouse.x < r.x + r.w && mouse.y >= r.y && mouse.y < r.y + r.h) { mouse.over = r.id; break; }
  }
  canvas.style.cursor = mouse.over && mouse.over !== "key:ok" ? "pointer" : "default";
  if (mouse.click && mouse.over?.startsWith("key:")) fresh.add(mouse.over.slice(4));
  if (mouse.rclick) fresh.add("back");
  if (mq.wheel) fresh.add(mq.wheel > 0 ? "down" : "up");
  mq.moved = mq.click = mq.rclick = false;
  mq.wheel = 0;
}

function pollPad() {
  const now = new Set();
  for (const pad of navigator.getGamepads?.() ?? []) {
    if (!pad) continue;
    pad.buttons.forEach((btn, i) => { if (btn.pressed && PAD[i]) now.add(PAD[i]); });
    const [x = 0, y = 0] = pad.axes;
    if (x < -0.5) now.add("left");
    if (x > 0.5) now.add("right");
    if (y < -0.5) now.add("up");
    if (y > 0.5) now.add("down");
  }
  if (now.size && !padDown.size) for (const fn of listeners.splice(0)) fn();
  padDown = now;
}

/** Called once per frame before the scene updates. */
export function pollInput(dt) {
  pollPad();
  fresh.clear();
  const down = new Set([...keyDown, ...padDown]);
  for (const b of down) {
    const t = held.get(b);
    if (t === undefined) { held.set(b, 0); fresh.add(b); continue; }
    const t2 = t + dt;
    held.set(b, t2);
    // Directions repeat: first after 260 ms, then every 75 ms.
    if (DIRS.has(b) && t2 > 260 && Math.floor((t2 - 260) / 75) > Math.floor(Math.max(t - 260, -1) / 75)) fresh.add(b);
  }
  for (const b of [...held.keys()]) if (!down.has(b)) held.delete(b);
  pollMouse();
}

// ---------------------------------------------------------------------------
// Small math helpers
// ---------------------------------------------------------------------------

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t ** 3,
  inOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2,
};

/** Deterministic hash noise in [0, 1) for procedural art. */
export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in [0, 1). */
export function noise(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, s(xf)), lerp(c, d, s(xf)), s(yf));
}

export function fbm(x, y, seed = 0, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * noise(x * f, y * f, seed + i * 17); f *= 2; amp *= 0.5; }
  return v / (1 - 0.5 ** oct);
}

/** An offscreen canvas at logical size (1x pixels). */
export function layer(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return [c, g];
}
