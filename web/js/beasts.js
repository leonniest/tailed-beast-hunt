// The three act bosses, painted procedurally at 2x (300 x 240) and shown at
// the 150 x 120 beast footprint (feet near y = 116, facing right). Authored in
// 150 x 120 coordinates; frame 0..15 animates breathing and tails.
import { layer } from "./core.js";

export const HQ_BEASTS = new Set([3, 6, 9]);

const TAU = Math.PI * 2;

/** A tapered limb along a quadratic curve: width w0 at the root, w1 at the tip. */
function taper(g, x0, y0, cx, cy, x1, y1, w0, w1, n = 18) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push([x - (dy / len) * w, y + (dx / len) * w]);
    R.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  const phi = Math.atan2(y1 - cy, x1 - cx);
  g.beginPath();
  g.moveTo(...L[0]);
  for (const p of L.slice(1)) g.lineTo(...p);
  g.arc(x1, y1, w1 / 2, phi + Math.PI / 2, phi - Math.PI / 2, true);
  for (const p of R.reverse()) g.lineTo(...p);
  g.closePath();
}

function paint(g, fill, stroke = "#140c0c", lw = 1.2) {
  g.fillStyle = fill;
  g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.lineJoin = "round"; g.stroke(); }
}

function grad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([k, c]) => gr.addColorStop(k, c));
  return gr;
}

function radial(g, x, y, r, stops) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(([k, c]) => gr.addColorStop(k, c));
  return gr;
}

function ellipse(g, x, y, rx, ry, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, TAU);
}

function eye(g, x, y, r, iris, slit = true) {
  ellipse(g, x, y, r * 1.3, r);
  paint(g, "#fff8e0", "#140c0c", 0.8);
  ellipse(g, x + r * 0.2, y, r * 0.8, r * 0.9);
  paint(g, radial(g, x + r * 0.2, y, r, [[0, "#ffffff"], [0.25, iris], [1, "#400000"]]), null);
  g.fillStyle = "#100000";
  if (slit) g.fillRect(x + r * 0.1, y - r * 0.8, r * 0.28, r * 1.6);
  else { ellipse(g, x + r * 0.2, y, r * 0.35, r * 0.35); g.fill(); }
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.fillRect(x - r * 0.2, y - r * 0.5, r * 0.3, r * 0.3);
}

// ---------------------------------------------------------------------------
// Kurama, the Nine-Tails
// ---------------------------------------------------------------------------

function kurama(g, f) {
  const ph = (f / 16) * TAU;
  const br = Math.sin(ph) * 1.2;
  const ORANGE = "#ff7a1c", DARK = "#b8420a", LIGHT = "#ffb060", INK = "#2a0c04";
  // chakra glow behind everything
  g.save();
  g.fillStyle = radial(g, 70, 66, 62, [[0, "rgba(255,90,20,0.32)"], [0.6, "rgba(255,60,10,0.1)"], [1, "rgba(255,40,0,0)"]]);
  g.fillRect(-40, 0, 190, 120);
  g.restore();
  // nine tails fanned from the rump
  for (let i = 8; i >= 0; i--) {
    const a = Math.PI * (1.08 - (i / 8) * 0.7) + Math.sin(ph + i * 0.7) * 0.06;
    const len = 60 + (i % 3) * 7;
    const x0 = 40, y0 = 82;
    const x1 = x0 + Math.cos(a) * len, y1 = y0 - Math.abs(Math.sin(a)) * len - 6;
    const cx = x0 + Math.cos(a + 0.5) * len * 0.55, cy = y0 - Math.abs(Math.sin(a + 0.5)) * len * 0.5 + 8;
    taper(g, x0, y0, cx, cy, x1, y1, 14, 5);
    paint(g, grad(g, x0, y0, x1, y1, [[0, DARK], [0.4, ORANGE], [1, LIGHT]]), INK, 1);
  }
  // hind leg (haunch + foot)
  ellipse(g, 52, 92 + br, 26, 20, -0.2);
  paint(g, grad(g, 40, 72, 60, 112, [[0, ORANGE], [1, DARK]]), INK);
  ellipse(g, 46, 112, 16, 5);
  paint(g, DARK, INK);
  // far arm
  taper(g, 96, 66 + br, 104, 92, 98, 110, 14, 10);
  paint(g, DARK, INK);
  // torso, leaning up toward the head
  g.beginPath();
  g.moveTo(34, 86 + br);
  g.bezierCurveTo(40, 58 + br, 70, 46 + br, 100, 44 + br);
  g.bezierCurveTo(110, 56 + br, 106, 84 + br, 88, 96 + br);
  g.bezierCurveTo(70, 104 + br, 44, 104 + br, 34, 86 + br);
  paint(g, grad(g, 60, 44, 70, 104, [[0, LIGHT], [0.35, ORANGE], [1, DARK]]), INK);
  // chest fur (lighter tufts)
  g.beginPath();
  g.moveTo(92, 52 + br);
  for (let k = 0; k < 5; k++) g.lineTo(96 + (k % 2) * 6, 58 + k * 6 + br);
  g.lineTo(86, 88 + br);
  g.quadraticCurveTo(84, 66 + br, 92, 52 + br);
  paint(g, "#ffd090", null);
  // the seal stripes on the shoulder
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(66 + k * 7, 58 + br); g.quadraticCurveTo(70 + k * 7, 66 + br, 66 + k * 7, 74 + br); g.stroke(); }
  // near arm with claws
  taper(g, 98, 62 + br, 116, 88, 112, 108, 16, 12);
  paint(g, grad(g, 98, 62, 112, 108, [[0, ORANGE], [1, DARK]]), INK);
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    g.moveTo(106 + k * 3.5, 110);
    g.lineTo(109 + k * 3.5, 117);
    g.lineTo(110 + k * 3.5, 110);
    paint(g, "#fff4dc", INK, 0.6);
  }
  // ears: long and pointed
  const ear = (x, tilt) => {
    g.beginPath();
    g.moveTo(x - 5, 30 + br);
    g.quadraticCurveTo(x - 10 + tilt, 12 + br, x - 6 + tilt * 2, 0 + br);
    g.quadraticCurveTo(x + 4 + tilt, 14 + br, x + 6, 30 + br);
    paint(g, grad(g, x, 0, x, 30, [[0, INK], [0.25, DARK], [1, ORANGE]]), INK);
  };
  ear(106, -3);
  ear(120, 2);
  // head
  g.beginPath();
  g.moveTo(98, 40 + br);
  g.bezierCurveTo(98, 26 + br, 118, 20 + br, 126, 30 + br);
  g.lineTo(146, 40 + br);
  g.quadraticCurveTo(148, 46 + br, 142, 50 + br);
  g.lineTo(122, 58 + br);
  g.quadraticCurveTo(104, 60 + br, 98, 40 + br);
  paint(g, grad(g, 110, 22, 120, 60, [[0, LIGHT], [0.5, ORANGE], [1, DARK]]), INK);
  // cheek ruff
  g.beginPath();
  g.moveTo(100, 44 + br);
  for (let k = 0; k < 4; k++) { g.lineTo(96 - (k % 2) * 4, 48 + k * 4 + br); }
  g.lineTo(108, 58 + br);
  paint(g, ORANGE, INK, 0.8);
  // black eye marking, then the eye
  g.beginPath();
  g.moveTo(112, 32 + br);
  g.quadraticCurveTo(122, 28 + br, 132, 36 + br);
  g.quadraticCurveTo(122, 42 + br, 110, 40 + br);
  paint(g, INK, null);
  eye(g, 122, 36 + br, 3.2, "#ff2020");
  // nose and grin with fangs
  ellipse(g, 145, 42 + br, 2.4, 2);
  paint(g, INK, null);
  g.beginPath();
  g.moveTo(118, 52 + br);
  g.quadraticCurveTo(130, 54 + br, 143, 47 + br);
  g.strokeStyle = INK;
  g.lineWidth = 1.4;
  g.stroke();
  for (let k = 0; k < 5; k++) {
    g.beginPath();
    const x = 121 + k * 4.4, y = 52.6 + br - k * 1.0;
    g.moveTo(x, y); g.lineTo(x + 1.6, y + 3.2); g.lineTo(x + 3.2, y);
    paint(g, "#ffffff", INK, 0.5);
  }
}

// ---------------------------------------------------------------------------
// Isobu, the Three-Tails
// ---------------------------------------------------------------------------

function isobu(g, f) {
  const ph = (f / 16) * TAU;
  const br = Math.sin(ph) * 1;
  const SHELL = "#6f8a6c", SHELL_D = "#3e5440", SKIN = "#9aae8e", SKIN_D = "#5a6e52", BONE = "#e6dcc0", INK = "#0e1610";
  // three spiked tails
  for (let i = 0; i < 3; i++) {
    const sw = Math.sin(ph + i * 1.3) * 5;
    const x1 = 4 + i * 6, y1 = 38 + i * 16 + sw;
    taper(g, 40, 88, 14 + i * 4, 76 + sw, x1, y1, 16, 7);
    paint(g, grad(g, 40, 88, x1, y1, [[0, SKIN_D], [1, SKIN]]), INK);
    for (let k = 1; k <= 3; k++) {
      const t = k / 4, u = 1 - t;
      const x = u * u * 40 + 2 * u * t * (14 + i * 4) + t * t * x1, y = u * u * 88 + 2 * u * t * (76 + sw) + t * t * y1;
      g.beginPath(); g.moveTo(x - 2.5, y - 2); g.lineTo(x - 1, y - 8); g.lineTo(x + 2.5, y - 2);
      paint(g, BONE, INK, 0.6);
    }
  }
  // legs
  for (const [x, d] of [[54, SKIN_D], [100, SKIN_D], [64, SKIN], [110, SKIN]]) {
    g.beginPath();
    g.moveTo(x - 8, 94); g.lineTo(x - 10, 112); g.quadraticCurveTo(x, 118, x + 10, 112); g.lineTo(x + 8, 94);
    paint(g, d, INK);
    for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x - 6 + k * 5, 114); g.lineTo(x - 5 + k * 5, 118); g.lineTo(x - 3 + k * 5, 114); paint(g, BONE, INK, 0.5); }
  }
  // plastron (underside)
  ellipse(g, 80, 94 + br, 46, 12);
  paint(g, grad(g, 80, 84, 80, 106, [[0, "#c8c098"], [1, "#8a8462"]]), INK);
  // the shell: a coral-spiked dome
  g.beginPath();
  g.moveTo(32, 94 + br);
  g.bezierCurveTo(30, 52 + br, 64, 36 + br, 88, 40 + br);
  g.bezierCurveTo(116, 44 + br, 130, 70 + br, 126, 94 + br);
  g.closePath();
  paint(g, grad(g, 70, 38, 80, 96, [[0, "#9ab894"], [0.3, SHELL], [1, SHELL_D]]), INK, 1.4);
  // plates
  g.strokeStyle = "rgba(14,22,16,0.55)";
  g.lineWidth = 1;
  for (const [x, y, rx, ry] of [[60, 70, 14, 10], [86, 62, 15, 11], [108, 76, 11, 9], [76, 84, 12, 6], [46, 84, 9, 7]]) { ellipse(g, x, y + br, rx, ry); g.stroke(); }
  // spikes: two rows of bone cones
  const spike = (x, y, h, lean) => {
    g.beginPath();
    g.moveTo(x - 4, y); g.lineTo(x + lean, y - h); g.lineTo(x + 4, y);
    paint(g, grad(g, x, y - h, x, y, [[0, "#fffaf0"], [1, "#b8ac88"]]), INK, 0.7);
  };
  [[44, 62, 12, -3], [56, 50, 15, -2], [70, 44, 17, -1], [84, 42, 18, 0], [98, 44, 16, 1], [110, 52, 13, 3], [120, 64, 9, 4]].forEach(([x, y, h, l]) => spike(x, y + br, h, l));
  [[62, 66, 7, -1], [78, 58, 8, 0], [94, 58, 8, 1], [106, 66, 6, 2]].forEach(([x, y, h, l]) => spike(x, y + br, h, l));
  // head under the shell lip, one eye open (the other scarred shut)
  g.beginPath();
  g.moveTo(118, 70 + br);
  g.quadraticCurveTo(140, 64 + br, 148, 80 + br);
  g.quadraticCurveTo(146, 94 + br, 128, 96 + br);
  g.quadraticCurveTo(116, 92 + br, 118, 70 + br);
  paint(g, grad(g, 120, 66, 130, 96, [[0, SKIN], [1, SKIN_D]]), INK);
  // brow plate covering the far eye
  g.beginPath();
  g.moveTo(116, 70 + br); g.quadraticCurveTo(132, 60 + br, 146, 72 + br); g.lineTo(140, 75 + br); g.quadraticCurveTo(130, 69 + br, 118, 76 + br);
  paint(g, SHELL_D, INK, 0.8);
  eye(g, 136, 78 + br, 3.6, "#ff3020");
  // mouth with fangs
  g.beginPath();
  g.moveTo(128, 89 + br); g.quadraticCurveTo(138, 92 + br, 147, 84 + br);
  g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
  for (let k = 0; k < 3; k++) { g.beginPath(); const x = 132 + k * 5, y = 90 + br - k * 1.5; g.moveTo(x, y); g.lineTo(x + 1.5, y + 3); g.lineTo(x + 3, y); paint(g, "#fff", INK, 0.5); }
}

// ---------------------------------------------------------------------------
// Saiken, the Six-Tails
// ---------------------------------------------------------------------------

function saiken(g, f) {
  const ph = (f / 16) * TAU;
  const br = Math.sin(ph) * 1.4;
  const BODY = "#e4f4f2", MID = "#a8d4d0", DARK = "#5e9a98", INK = "#0e2224", LIP = "#f0c8a0";
  // six tentacle tails, wriggling
  for (let i = 0; i < 6; i++) {
    const sw = Math.sin(ph * 1.5 + i * 1.1) * 7;
    const x1 = 2 + i * 7 + sw * 0.4, y1 = 18 + (i % 3) * 14 + sw;
    taper(g, 34 + i * 2, 80, 10 + i * 4, 56 + sw, x1, y1, 10, 3.5);
    paint(g, grad(g, 34, 80, x1, y1, [[0, MID], [0.7, BODY], [1, "#ffffff"]]), INK, 0.9);
  }
  // body: a great glossy slug rising toward the head
  g.beginPath();
  g.moveTo(12, 114);
  g.bezierCurveTo(14, 92 + br, 40, 72 + br, 70, 70 + br);
  g.bezierCurveTo(92, 66 + br, 96, 34 + br, 116, 30 + br);
  g.bezierCurveTo(140, 28 + br, 148, 52 + br, 142, 72 + br);
  g.bezierCurveTo(138, 92 + br, 126, 108, 120, 114);
  g.closePath();
  paint(g, grad(g, 80, 30, 80, 116, [[0, "#ffffff"], [0.35, BODY], [0.75, MID], [1, DARK]]), INK, 1.4);
  // the foot (a darker skirt along the ground)
  g.beginPath();
  g.moveTo(10, 114); g.quadraticCurveTo(70, 104, 124, 114); g.lineTo(124, 116); g.lineTo(10, 116);
  paint(g, DARK, INK, 0.8);
  // glossy highlights
  g.save();
  g.globalAlpha = 0.7;
  ellipse(g, 112, 40 + br, 10, 4, -0.4); g.fillStyle = "#ffffff"; g.fill();
  ellipse(g, 52, 80 + br, 14, 3, -0.2); g.fill();
  g.restore();
  // little arms
  for (const [x, y, c] of [[112, 78, MID], [124, 80, BODY]]) {
    taper(g, x, y + br, x + 6, y + 12, x + 2, y + 20, 7, 5);
    paint(g, c, INK, 0.9);
  }
  // spots along the flank
  for (let k = 0; k < 5; k++) { ellipse(g, 40 + k * 14, 92 - k * 2 + br, 3, 2.2); paint(g, "#d8ec98", INK, 0.5); }
  // eyes (yellow, round pupils) and the wide mouth
  eye(g, 118, 44 + br, 3.6, "#ffe040", false);
  eye(g, 132, 46 + br, 3.4, "#ffe040", false);
  g.beginPath();
  g.moveTo(116, 60 + br);
  g.quadraticCurveTo(130, 70 + br, 142, 58 + br);
  g.quadraticCurveTo(130, 62 + br, 116, 60 + br);
  paint(g, LIP, INK, 1);
  // corrosive drips
  for (let k = 0; k < 3; k++) {
    const p = ((f + k * 5) % 16) / 16;
    const x = 122 + k * 7, y = 64 + br + p * 30;
    g.globalAlpha = 1 - p;
    ellipse(g, x, y, 1.6, 2.4);
    paint(g, "#c8f0a0", null);
    g.globalAlpha = 1;
  }
}

const PAINTERS = { 3: isobu, 6: saiken, 9: kurama };

// Extra room on the left for tails (logical px); art.js shifts by it.
export const HQ_MARGIN = 40;

/** A (150 + margin) x 120 frame painted at 2x. */
export function beastHQ(t, frame) {
  const [c, g] = layer((150 + HQ_MARGIN) * 2, 240);
  g.imageSmoothingEnabled = true;
  g.scale(2, 2);
  g.translate(HQ_MARGIN, 0);
  PAINTERS[t](g, frame % 16);
  c.margin = HQ_MARGIN;
  return c;
}
