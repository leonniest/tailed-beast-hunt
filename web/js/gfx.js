// Drawing primitives in logical pixels: FF-style windows, text, the hand
// cursor, PSP button glyphs, gauges, overlays.
import { ctx, W, H, ui } from "./core.js";

export const COLORS = {
  text: "#ffffff",
  dim: "#8890b0",
  hi: "#ffe070",
  hp: "#ffffff",
  ck: "#7fd8ff",
  good: "#7dff9a",
  bad: "#ff6a6a",
  shadow: "rgba(0,0,20,0.85)",
};
export const RANK_COLORS = ["#e8e8e8", "#7dff9a", "#7fb8ff", "#d68cff", "#ff6060"];
export const NATURE_COLORS = ["#ffffff", "#ff7a2a", "#7ff0d8", "#ffe84a", "#c89060", "#4aa8ff", "#a070ff", "#fff0a0"];
export const NATURE_NAMES = ["", "Fire", "Wind", "Lightning", "Earth", "Water", "Yin", "Yang"];

const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

export function font(size = 9, weight = 600, italic = false) {
  return `${italic ? "italic " : ""}${weight} ${size}px ${FONT}`;
}

/** Text with the classic dark drop shadow. */
export function text(str, x, y, opts = {}) {
  const { color = COLORS.text, size = 9, align = "left", weight = 600, italic = false, shadow = true, alpha = 1, base = "top" } = opts;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = font(size, weight, italic);
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if (shadow) {
    ctx.fillStyle = COLORS.shadow;
    ctx.fillText(str, x + 0.75, y + 0.75);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** Text with a thick outline (damage numbers, banners). */
export function bigText(str, x, y, opts = {}) {
  const { color = "#fff", size = 14, align = "center", outline = "#101018", lw = 2.5, italic = false, alpha = 1, weight = 800 } = opts;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = font(size, weight, italic);
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = lw;
  ctx.strokeStyle = outline;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}

export function measure(str, size = 9, weight = 600) {
  ctx.save();
  ctx.font = font(size, weight);
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The blue FF window. `dim` for an inactive window. */
export function win(x, y, w, h, opts = {}) {
  const { dim = false, alpha = 0.94, top = "#3a4fb8", bottom = "#0d1656" } = opts;
  ctx.save();
  ctx.globalAlpha *= dim ? alpha * 0.75 : alpha;
  rr(x, y, w, h, 3.5);
  ctx.fillStyle = "rgba(0,0,10,0.9)";
  ctx.fill();
  rr(x + 1, y + 1, w - 2, h - 2, 3);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.globalAlpha = dim ? 0.55 : 1;
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "#f4f6ff";
  rr(x + 1.7, y + 1.7, w - 3.4, h - 3.4, 2.6);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = "rgba(120,130,170,0.9)";
  rr(x + 2.8, y + 2.8, w - 5.6, h - 5.6, 2);
  ctx.stroke();
  // soft gloss on the upper third
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#fff";
  rr(x + 3, y + 3, w - 6, Math.min(h * 0.35, 20), 2);
  ctx.fill();
  ctx.restore();
}

/** The white pointing hand, tip at (x, y), pointing right. */
export function hand(x, y, t = performance.now(), dir = 1) {
  const bob = Math.round(Math.sin(t / 110) * 1.5);
  ctx.save();
  ctx.translate(x - bob * dir, y);
  ctx.scale(dir, 1);
  ctx.beginPath();
  // finger
  ctx.moveTo(0, -1);
  ctx.lineTo(-6, -2.5);
  ctx.quadraticCurveTo(-7.5, -2.5, -7.5, -1.2);
  // knuckles and palm
  ctx.lineTo(-8, 0);
  ctx.lineTo(-13, -2);
  ctx.quadraticCurveTo(-15, 0.5, -14, 3.5);
  ctx.lineTo(-10, 4.5);
  ctx.quadraticCurveTo(-8, 4.5, -7.5, 3);
  ctx.lineTo(-6.5, 1.2);
  ctx.lineTo(0, 1);
  ctx.quadraticCurveTo(1, 0, 0, -1);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#141420";
  ctx.lineWidth = 1.1;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8.5, 1.5);
  ctx.lineTo(-10.5, 1.8);
  ctx.moveTo(-8.7, -0.3);
  ctx.lineTo(-11, -0.6);
  ctx.strokeStyle = "#9aa0c0";
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();
}

/** PSP face-button glyph: "x" cross, "o" circle, "t" triangle, "s" square, "l"/"r". */
export function glyph(kind, x, y, r = 5) {
  const col = { x: "#7fb0ff", o: "#ff7f8f", t: "#7fffb0", s: "#ff9fe8", l: "#d0d0e0", r: "#d0d0e0" }[kind] ?? "#fff";
  ctx.save();
  ctx.fillStyle = "#1a1c28";
  ctx.strokeStyle = "#5a5e78";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  if (kind === "l" || kind === "r") rr(x - r * 1.3, y - r * 0.8, r * 2.6, r * 1.6, 2);
  else ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  const k = r * 0.48;
  if (kind === "x") { ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke(); }
  else if (kind === "o") { ctx.arc(x, y, k, 0, Math.PI * 2); ctx.stroke(); }
  else if (kind === "t") { ctx.moveTo(x, y - k); ctx.lineTo(x + k, y + k * 0.8); ctx.lineTo(x - k, y + k * 0.8); ctx.closePath(); ctx.stroke(); }
  else if (kind === "s") { ctx.strokeRect(x - k * 0.85, y - k * 0.85, k * 1.7, k * 1.7); }
  else { text(kind.toUpperCase(), x, y - 3.5, { size: 6, align: "center", color: col, shadow: false }); }
  ctx.restore();
}

/** A row of button hints, right-aligned at (x, y): [["x","Select"],["o","Back"]]. */
// Each hint is also a button for the mouse (clicking it presses the button).
const HINT_KEY = { x: "ok", o: "back", t: "menu", s: "alt", l: "l", r: "r" };
export function hints(list, x = W - 8, y = H - 9) {
  let cx = x;
  for (const [g, label] of [...list].reverse()) {
    const w = measure(label, 7.5);
    const left = cx - w - 15;
    const id = `key:${HINT_KEY[g] ?? g}`;
    if (ui.over(id)) {
      ctx.save();
      ctx.fillStyle = "rgba(120,150,255,0.28)";
      rr(left - 2, y - 7, w + 19, 14, 3);
      ctx.fill();
      ctx.restore();
    }
    text(label, cx, y - 4.5, { size: 7.5, align: "right", color: "#dfe4ff" });
    cx -= w + 9;
    glyph(g, cx, y, 4.2);
    cx -= 10;
    ui.hit(id, left - 2, y - 7, w + 19, 14);
  }
}

/** A gauge bar with a dark track. */
export function bar(x, y, w, h, frac, color, back = "rgba(0,0,0,0.55)") {
  ctx.save();
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  const fw = Math.max(0, Math.min(1, frac)) * w;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.25, color);
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, fw, h);
  ctx.restore();
}

export function fill(color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Small diamond (nature mark, status pip). */
export function diamond(x, y, r, color) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#101018";
  ctx.lineWidth = 0.8;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Word-wrap `str` into lines no wider than w. */
export function wrap(str, w, size = 9) {
  const words = String(str).split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const t = cur ? `${cur} ${word}` : word;
    if (measure(t, size) > w && cur) { lines.push(cur); cur = word; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** A simple vertical list menu inside a window. Returns nothing; draws. */
export function menuList(items, x, y, cursor, opts = {}) {
  const { lh = 13, size = 9, active = true, right = null, w = 100, id = null, hitW = null } = opts;
  if (id && active) items.forEach((_, i) => ui.hit(`${id}:${i}`, x - 10, y + i * lh - 2, hitW ?? Math.max(w + 20, 110), lh));
  items.forEach((it, i) => {
    const label = typeof it === "string" ? it : it.label;
    const off = typeof it === "object" && it.disabled;
    text(label, x, y + i * lh, { size, color: off ? COLORS.dim : it.color ?? COLORS.text });
    if (right) {
      const r = right(it, i);
      if (r) text(r, x + w, y + i * lh, { size, align: "right", color: off ? COLORS.dim : COLORS.text });
    }
  });
  if (active && cursor >= 0) hand(x - 3, y + cursor * lh + size * 0.55);
}
