// Procedural pixel art: SD ninja sprites, tailed beasts and portraits.
// These are placeholders; a MUGEN sprite bank (mugen.js) overrides any
// character listed in assets/mugen/manifest.json. Everything is drawn at 1x
// into small canvases, outlined, cached, and upscaled 2x by the main canvas.
import { layer, ctx } from "./core.js";
import { mugenFor } from "./mugen.js";
import { beastHQ, HQ_BEASTS } from "./beasts.js";

// ---------------------------------------------------------------------------
// Character specs
// ---------------------------------------------------------------------------

const SKIN = "#f6c9a0", SKIN_D = "#d89a74";
const SPECS = {
  naruto: { hair: "#ffd23a", hairD: "#d89a10", style: "spiky", top: "#ff8a1e", topD: "#c85a10", pants: "#ff8a1e", accent: "#222838", band: "#2a4cc8", whiskers: true, eyes: "#2a6ad8" },
  sasuke: { hair: "#262c44", hairD: "#121624", style: "duck", top: "#2c3c8c", topD: "#1a2458", pants: "#e8e8f0", accent: "#e8e8f0", band: "#2a4cc8", eyes: "#202020" },
  sakura: { hair: "#ff9cc4", hairD: "#d86a98", style: "long", top: "#d83a4a", topD: "#a0202e", pants: "#3a3c48", accent: "#ffffff", band: "#d83a4a", eyes: "#2aa860" },
  kakashi: { hair: "#d8dce8", hairD: "#9aa0b4", style: "silver", top: "#2c3a5c", topD: "#1a2440", pants: "#2c3a5c", accent: "#5c7a4c", band: "#2a4cc8", mask: true, vest: "#5c7a4c", eyes: "#202020", eyepatch: true },
  "rock lee": { hair: "#16161c", hairD: "#000000", style: "bowl", top: "#3ab040", topD: "#22802a", pants: "#3ab040", accent: "#ff8a1e", band: "#c83030", brows: true, warmers: true, eyes: "#000" },
  hinata: { hair: "#2c2c58", hairD: "#18183a", style: "hime", top: "#d8d0f0", topD: "#a89cc8", pants: "#2c3060", accent: "#2c3060", band: "#2a4cc8", eyes: "#e8e4ff", pale: true },
  shikamaru: { hair: "#1e1e26", hairD: "#0c0c10", style: "pineapple", top: "#7a8a6a", topD: "#56664a", pants: "#3a3a48", accent: "#5c7a4c", band: "#2a4cc8", vest: "#6a8a52", eyes: "#202020" },
  gaara: { hair: "#c8382a", hairD: "#8a2018", style: "short", top: "#8a3038", topD: "#5c1c22", pants: "#5c1c22", accent: "#d8b070", gourd: true, eyes: "#6ad0b0", rings: true },
  bandit: { hair: "#4a3020", hairD: "#2a1a10", style: "bandana", top: "#8a6a48", topD: "#5c4630", pants: "#5c4630", accent: "#b03030", eyes: "#202020", skin: "#e0b088" },
  "rogue genin": { hair: "#5a5248", hairD: "#38322c", style: "short", top: "#6a6a78", topD: "#46464e", pants: "#46464e", accent: "#2a2a30", band: "#707888", slashed: true, eyes: "#202020" },
  "sound ninja": { hair: "#584a3a", hairD: "#3a2e22", style: "spiky", top: "#b8a880", topD: "#8a7c5a", pants: "#4a4a40", accent: "#6a5a3a", band: "#8a8a98", eyes: "#202020", camo: true },
  "mist chunin": { hair: "#6a7a8a", hairD: "#465260", style: "short", top: "#5a7088", topD: "#3a4a5c", pants: "#3a4a5c", accent: "#9ab0c0", band: "#8a98a8", mask: true, eyes: "#202020" },
  "rogue jonin": { hair: "#2a2a2a", hairD: "#101010", style: "silver", top: "#3a3a44", topD: "#24242a", pants: "#24242a", accent: "#5a4a3a", vest: "#4a4038", band: "#707888", slashed: true, eyes: "#a02020" },
  haku: { hair: "#1c1c28", hairD: "#0a0a12", style: "hime", top: "#3a6a50", topD: "#244634", pants: "#5a7a68", accent: "#d8d8d8", whitemask: true, eyes: "#202020" },
  zabuza: { hair: "#2a2a2a", hairD: "#141414", style: "short", top: "#6a7080", topD: "#464a56", pants: "#5a6474", accent: "#c0c4cc", band: "#8a98a8", bandage: true, bigsword: true, eyes: "#202020" },
  kabuto: { hair: "#c8ccd8", hairD: "#9096a8", style: "ponytail", top: "#5a3a7a", topD: "#3a2452", pants: "#3a2452", accent: "#c8c0d8", band: "#7a6a98", glasses: true, eyes: "#202020" },
  kisame: { hair: "#4a6a9a", hairD: "#2a4a70", style: "spiky", top: "#1c1c26", topD: "#0c0c12", pants: "#1c1c26", accent: "#c83030", cloak: true, skin: "#7aa0b8", bigsword: "wrap", eyes: "#f0f0f0" },
  deidara: { hair: "#ffd84a", hairD: "#c8a020", style: "ponytail", top: "#1c1c26", topD: "#0c0c12", pants: "#1c1c26", accent: "#c83030", cloak: true, eyes: "#2a6ad8" },
  itachi: { hair: "#16161c", hairD: "#060608", style: "ponytail", top: "#1c1c26", topD: "#0c0c12", pants: "#1c1c26", accent: "#c83030", cloak: true, eyes: "#e02020", band: "#707888", slashed: true },
  "training dummy": { dummy: true },
  "sparring partner": { hair: "#3a3a3a", hairD: "#1a1a1a", style: "short", top: "#4a5a7a", topD: "#2a3a5a", pants: "#2a3a5a", accent: "#c0c0c0", band: "#2a4cc8", eyes: "#202020" },
};

// ---------------------------------------------------------------------------
// SD ninja, 32 x 44, feet at (16, 42), facing left.
// ---------------------------------------------------------------------------

const SW = 32, SH = 44;

function outline(g, w, h, col = "#14121c") {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  const [r, gg, b] = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] > 40) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < w && ny < h && d[(ny * w + nx) * 4 + 3] > 140;
      });
      if (near) { out[i] = r; out[i + 1] = gg; out[i + 2] = b; out[i + 3] = 255; }
    }
  }
  img.data.set(out);
  g.putImageData(img, 0, 0);
}

function ninja(spec, pose, frame) {
  const [c, g] = layer(SW, SH);
  const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const skin = spec.skin ?? SKIN;
  if (spec.dummy) return dummySprite(c, g, P, pose, frame);

  if (pose === "ko") {
    // lying down, head to the left
    P(4, 34, 22, 6, spec.top); P(4, 38, 22, 2, spec.topD);
    P(24, 35, 7, 4, spec.pants);
    P(-1, 30, 9, 9, skin);
    P(-1, 29, 9, 3, spec.hair);
    if (spec.band) P(0, 32, 8, 1, spec.band);
    P(1, 36, 2, 1, "#202020");
    outline(g, SW, SH);
    return c;
  }

  const bob = pose === "idle" || pose === "ready" ? (frame % 2) : 0;
  const lean = pose === "attack" ? -3 : pose === "hurt" ? 2 : pose === "ready" ? -1 : 0;
  const crouch = pose === "cast" || pose === "guard" ? 1 : 0;
  const by = bob + crouch;

  // back items
  if (spec.gourd) { g.fillStyle = "#d8b070"; g.beginPath(); g.ellipse(22 + lean, 26 + by, 5, 7, 0.2, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(21 + lean, 17 + by, 3, 3.5, 0, 0, Math.PI * 2); g.fill(); P(19 + lean, 22 + by, 4, 1, "#8a3038"); }
  if (spec.bigsword) {
    g.save(); g.translate(22 + lean, 20 + by); g.rotate(spec.bigsword === "wrap" ? -0.5 : -0.35);
    P(-2, -16, spec.bigsword === "wrap" ? 6 : 5, 26, spec.bigsword === "wrap" ? "#4a5a8a" : "#c8ccd8");
    if (spec.bigsword !== "wrap") { P(-2, -16, 2, 3, "#2a2a2a"); P(2, -14, 1, 2, "#2a2a2a"); }
    P(-1, 10, 3, 5, "#5a3a2a"); g.restore();
  }

  // legs
  const step = pose === "walk" ? (frame % 2 ? 2 : -2) : 0;
  const legY = 34 + crouch;
  P(12 + lean / 2 + step, legY, 4, 8 - crouch, spec.pants);
  P(17 + lean / 2 - step, legY, 4, 8 - crouch, spec.pants);
  if (spec.warmers) { P(12 + lean / 2 + step, legY + 4, 4, 3, spec.accent); P(17 + lean / 2 - step, legY + 4, 4, 3, spec.accent); }
  P(11 + lean / 2 + step, 41, 5, 2, "#2a2a38");
  P(17 + lean / 2 - step, 41, 5, 2, "#2a2a38");

  // torso
  const tx = 11 + lean, ty = 24 + by;
  if (spec.cloak) {
    P(tx - 1, ty, 13, 12, spec.top); P(tx + 8, ty, 4, 12, spec.topD);
    P(tx + 1, ty + 3, 4, 2, spec.accent); P(tx + 7, ty + 7, 3, 2, spec.accent); P(tx + 2, ty + 9, 3, 1, "#ffffff");
    P(tx, ty, 11, 2, "#ffffff"); P(tx + 1, ty, 9, 1, spec.accent);
  } else {
    P(tx, ty, 11, 10, spec.top);
    P(tx + 8, ty, 3, 10, spec.topD);
    if (spec.vest) { P(tx, ty, 3, 10, spec.vest); P(tx + 7, ty, 4, 10, spec.vest); P(tx + 3, ty + 3, 2, 3, "#3a4a2c"); }
    if (spec === SPECS.naruto) { P(tx, ty, 11, 3, spec.accent); P(tx + 4, ty + 3, 3, 4, "#ffffff"); }
    if (spec.camo) { P(tx + 2, ty + 2, 2, 2, "#6a5a3a"); P(tx + 6, ty + 6, 3, 2, "#6a5a3a"); }
    P(tx, ty + 8, 11, 1, spec.topD);
  }

  // arms (front arm is on the left: the side the sprite faces)
  const armC = spec.cloak ? spec.top : spec.top;
  if (pose === "attack") {
    P(tx - 9, ty + 3, 10, 3, armC); P(tx - 12, ty + 2, 4, 4, skin);
    P(tx + 10, ty + 1, 3, 7, spec.topD);
  } else if (pose === "cast") {
    P(tx - 2, ty + 3, 3, 4, armC); P(tx + 9, ty + 3, 3, 4, spec.topD);
    P(tx + 2, ty + 2, 5, 4, skin); P(tx + 4, ty + 1, 1, 2, skin);
  } else if (pose === "guard") {
    P(tx - 1, ty + 1, 4, 6, armC); P(tx + 1, ty + 2, 9, 3, armC); P(tx - 2, ty + 2, 3, 3, skin);
  } else if (pose === "win") {
    P(tx + 10, ty + 1, 3, 8, spec.topD); P(tx + 10, ty + 8, 3, 2, skin);
  } else {
    const sw = pose === "walk" ? (frame % 2 ? 1 : -1) : 0;
    P(tx - 2 + sw, ty + 1, 3, 8, armC); P(tx - 2 + sw, ty + 8, 3, 2, skin);
    P(tx + 10 - sw, ty + 1, 3, 8, spec.topD); P(tx + 10 - sw, ty + 8, 3, 2, SKIN_D);
  }

  // head
  const hx = 9 + lean, hy = 10 + by;
  P(hx, hy, 14, 14, skin);
  P(hx + 10, hy + 2, 4, 12, SKIN_D);
  // eyes and face (facing left)
  const blink = pose === "idle" && frame === 3;
  const eye = spec.pale ? "#c8c4f0" : spec.eyes;
  if (pose === "hurt") { P(hx + 2, hy + 8, 3, 1, "#202020"); P(hx + 6, hy + 8, 3, 1, "#202020"); }
  else if (!blink) {
    P(hx + 2, hy + 7, 2, 3, "#ffffff"); P(hx + 2, hy + 8, 2, 2, eye);
    if (!spec.eyepatch) { P(hx + 6, hy + 7, 2, 3, "#ffffff"); P(hx + 6, hy + 8, 2, 2, eye); }
  } else { P(hx + 2, hy + 9, 2, 1, "#202020"); P(hx + 6, hy + 9, 2, 1, "#202020"); }
  if (spec.brows) { P(hx + 1, hy + 5, 4, 2, "#101010"); P(hx + 6, hy + 5, 3, 2, "#101010"); }
  if (spec.whiskers) { P(hx, hy + 10, 2, 1, "#a0603a"); P(hx, hy + 12, 2, 1, "#a0603a"); }
  if (spec.glasses) { P(hx + 1, hy + 7, 8, 1, "#d8d8e8"); }
  if (spec.mask) P(hx, hy + 10, 10, 4, spec === SPECS.kakashi ? "#2c3a5c" : spec.accent);
  else if (spec.whitemask) { P(hx, hy + 4, 10, 10, "#f0f0f0"); P(hx + 2, hy + 8, 2, 1, "#202020"); P(hx + 6, hy + 8, 2, 1, "#202020"); P(hx + 1, hy + 5, 6, 1, "#c03030"); }
  else if (spec.bandage) P(hx, hy + 10, 11, 4, "#e8e4d8");
  else if (pose === "attack" || pose === "win") P(hx + 3, hy + 11, 3, 2, "#802020");
  else P(hx + 3, hy + 12, 2, 1, "#a05040");
  if (spec.rings) { P(hx + 1, hy + 6, 3, 1, "#202020"); P(hx + 6, hy + 6, 3, 1, "#202020"); }

  // hair
  hair(g, P, spec, hx, hy, frame);
  // headband
  if (spec.band) {
    P(hx, hy + 3, 14, 2, spec.band);
    P(hx + 1, hy + 2, 6, 3, "#c8ccd8"); P(hx + 2, hy + 3, 4, 1, "#8a90a8");
    if (spec.slashed) P(hx + 2, hy + 3, 4, 1, "#c03030");
    if (spec.style !== "hime" && spec.style !== "long") { P(hx + 14, hy + 3, 3, 2, spec.band); P(hx + 16, hy + 5, 2, 3, spec.band); }
  }
  // victory: the front arm thrust above the head, drawn last so it shows
  if (pose === "win") { P(hx - 4, hy - 2, 3, 15, spec.cloak ? spec.top : spec.top); P(hx - 5, hy - 6, 5, 5, skin); }
  outline(g, SW, SH);
  return c;
}

function hair(g, P, s, hx, hy, frame) {
  const H = s.hair, D = s.hairD;
  const spikes = (pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };
  switch (s.style) {
    case "spiky":
      P(hx - 1, hy - 2, 16, 6, H); P(hx + 8, hy, 7, 9, H);
      spikes([[hx - 3, hy + 3], [hx, hy - 6], [hx + 3, hy - 1], [hx + 5, hy - 8], [hx + 8, hy - 2], [hx + 11, hy - 8], [hx + 13, hy - 1], [hx + 18, hy - 4], [hx + 15, hy + 3], [hx + 19, hy + 7], [hx + 14, hy + 9]], H);
      P(hx + 9, hy - 1, 5, 2, D);
      break;
    case "duck":
      P(hx - 1, hy - 1, 15, 5, H); P(hx + 9, hy, 6, 9, H);
      spikes([[hx + 6, hy - 2], [hx + 12, hy - 6], [hx + 15, hy - 3], [hx + 21, hy - 4], [hx + 17, hy + 2], [hx + 21, hy + 6], [hx + 15, hy + 8]], H);
      P(hx - 1, hy + 4, 3, 7, H); P(hx + 12, hy + 1, 4, 3, D);
      break;
    case "long":
      P(hx - 1, hy - 2, 16, 6, H); P(hx + 8, hy, 8, 20, H); P(hx - 1, hy + 4, 2, 10, H); P(hx + 12, hy + 4, 4, 16, D);
      break;
    case "hime":
      P(hx - 1, hy - 2, 16, 6, H); P(hx + 9, hy, 7, 22, H); P(hx - 1, hy + 4, 3, 12, H); P(hx + 13, hy + 5, 3, 17, D); P(hx + 1, hy + 3, 8, 2, H);
      break;
    case "silver":
      P(hx - 1, hy - 1, 16, 5, H);
      spikes([[hx + 2, hy], [hx + 8, hy - 9], [hx + 12, hy - 4], [hx + 19, hy - 10], [hx + 17, hy - 1], [hx + 21, hy + 1], [hx + 14, hy + 5]], H);
      P(hx + 10, hy, 5, 8, H); P(hx + 12, hy - 3, 4, 3, D);
      break;
    case "bowl":
      P(hx - 1, hy - 2, 16, 6, H); P(hx + 9, hy + 2, 6, 8, H); P(hx - 1, hy + 4, 4, 3, H); P(hx + 2, hy - 1, 6, 1, "#5a5a6a");
      break;
    case "pineapple":
      P(hx - 1, hy - 1, 16, 5, H); P(hx + 9, hy, 6, 7, H);
      spikes([[hx + 9, hy - 1], [hx + 12, hy - 9], [hx + 14, hy - 4], [hx + 17, hy - 9], [hx + 17, hy - 2], [hx + 21, hy - 6], [hx + 18, hy + 1]], H);
      break;
    case "short":
      P(hx - 1, hy - 2, 16, 6, H); P(hx + 9, hy, 6, 9, H); P(hx - 1, hy + 4, 2, 3, H);
      spikes([[hx + 1, hy - 1], [hx + 4, hy - 4], [hx + 7, hy - 1], [hx + 11, hy - 4], [hx + 14, hy]], H);
      break;
    case "ponytail":
      P(hx - 1, hy - 2, 16, 6, H); P(hx + 9, hy, 6, 9, H); P(hx - 1, hy + 4, 3, 9, H);
      P(hx + 14, hy + 4 + (frame % 2), 4, 12, H); P(hx + 15, hy + 6, 2, 10, D);
      break;
    case "bandana":
      P(hx - 1, hy - 1, 16, 6, s.accent); P(hx + 14, hy + 2, 4, 2, s.accent); P(hx + 16, hy + 4, 2, 3, s.accent); P(hx + 9, hy + 4, 6, 6, H);
      break;
    default:
      P(hx - 1, hy - 2, 16, 6, H);
  }
}

function dummySprite(c, g, P, pose) {
  P(14, 14, 5, 29, "#8a5a32"); P(15, 14, 2, 29, "#a8743e");
  P(8, 22, 17, 4, "#8a5a32"); P(10, 8, 13, 9, "#c89a5a");
  P(12, 11, 2, 2, "#4a2a1a"); P(18, 11, 2, 2, "#4a2a1a");
  P(9, 30, 15, 2, "#d8c090"); P(9, 36, 15, 2, "#d8c090");
  if (pose === "hurt") P(13, 14, 7, 1, "#4a2a1a");
  outline(g, SW, SH);
  return c;
}

// ---------------------------------------------------------------------------
// Tailed beasts, 150 x 120, feet near y = 116, facing right.
// ---------------------------------------------------------------------------

const BEASTS = {
  1: { body: "#d8b878", dark: "#9a7a48", mark: "#3a5ab8", eye: "#ffe040", kind: "tanuki" },
  2: { body: "#2848c8", dark: "#142470", mark: "#101020", eye: "#ffe040", kind: "cat", flame: "#58a0ff" },
  3: { body: "#7a9a78", dark: "#4a6048", mark: "#c8c8b0", eye: "#ff4040", kind: "turtle" },
  4: { body: "#b83a28", dark: "#701c12", mark: "#ffcf60", eye: "#ffe040", kind: "ape", flame: "#ff8a30" },
  5: { body: "#ece4d4", dark: "#a89c88", mark: "#d84a3a", eye: "#4ab8ff", kind: "horse" },
  6: { body: "#cde8de", dark: "#8ab0a4", mark: "#e8f8a0", eye: "#ffe040", kind: "slug" },
  7: { body: "#4ab858", dark: "#286a30", mark: "#ffe860", eye: "#ff8030", kind: "beetle" },
  8: { body: "#7a5a6a", dark: "#46303c", mark: "#e8d8c8", eye: "#ffe040", kind: "ox" },
  9: { body: "#ff7a1e", dark: "#b8480a", mark: "#401808", eye: "#ff2020", kind: "fox", flame: "#ff5a1e" },
};
const BW = 150, BH = 120;

function beast(t, frame) {
  const s = BEASTS[t] ?? BEASTS[9];
  const [c, g] = layer(BW, BH);
  const sway = Math.sin((frame / 8) * Math.PI * 2);
  const breathe = Math.round(Math.sin((frame / 8) * Math.PI * 2) * 1.5);
  const ell = (x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
  const tri = (pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); };

  // tails, from the rump (left side)
  const n = t;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.95 + (i / Math.max(n - 1, 1)) * Math.PI * 0.75 + sway * 0.08 * ((i % 2) * 2 - 1);
    const len = s.kind === "ox" ? 52 : 44;
    const w = s.kind === "fox" ? 11 : s.kind === "ox" ? 7 : 8;
    const mx = 42 + Math.cos(a) * len * 0.6 + sway * 4, my = 78 + Math.sin(a) * len * 0.6;
    const ex = 42 + Math.cos(a - 0.4) * len, ey = 78 + Math.sin(a - 0.4) * len;
    g.lineCap = "round";
    for (const [col, lw] of [["#100a10", w + 2], [s.kind === "ox" ? s.dark : s.body, w], [s.dark, Math.max(2, w * 0.3)]]) {
      g.strokeStyle = col;
      g.lineWidth = lw;
      g.beginPath();
      g.moveTo(42, 78);
      g.quadraticCurveTo(mx, my, ex, ey);
      if (lw < w) { g.globalAlpha = 0.35; g.translate(1.5, 1.5); }
      g.stroke();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
    }
    if (s.kind === "fox") { g.fillStyle = "#fff4e0"; g.beginPath(); g.arc(ex, ey, w * 0.45, 0, Math.PI * 2); g.fill(); }
    if (s.flame) { g.fillStyle = s.flame; g.globalAlpha = 0.7; g.beginPath(); g.arc(ex, ey, 4, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
  }

  const by = breathe;
  switch (s.kind) {
    case "turtle":
      ell(78, 82 + by, 42, 26, s.dark); ell(78, 76 + by, 38, 22, s.body);
      for (let i = 0; i < 5; i++) tri([[52 + i * 12, 62 + by], [58 + i * 12, 44 + by], [64 + i * 12, 62 + by]], s.mark);
      ell(122, 84 + by, 14, 11, s.body);
      break;
    case "slug":
      ell(76, 92 + by, 46, 18, s.body); ell(104, 72 + by, 20, 24, s.body); ell(100, 86 + by, 30, 10, s.dark, 0.1);
      for (let i = 0; i < 4; i++) ell(60 + i * 12, 86 + by, 3, 3, s.mark);
      break;
    case "beetle":
      ell(78, 80 + by, 34, 22, s.body);
      g.globalAlpha = 0.55; ell(62, 54 + by, 30, 12, "#e8fff0", -0.5 + sway * 0.15); ell(70, 50 + by, 30, 10, "#d0ffe0", -0.9 + sway * 0.2); g.globalAlpha = 1;
      ell(110, 74 + by, 16, 14, s.body);
      break;
    case "horse":
      ell(74, 82 + by, 38, 22, s.body); ell(112, 60 + by, 14, 20, s.body, 0.5); ell(126, 52 + by, 13, 9, s.body, 0.3);
      tri([[112, 40 + by], [118, 26 + by], [121, 42 + by]], s.dark);
      break;
    case "ape":
      ell(74, 78 + by, 34, 28, s.body); ell(108, 56 + by, 18, 17, s.body);
      tri([[100, 42 + by], [104, 28 + by], [110, 42 + by]], s.mark); tri([[112, 42 + by], [118, 30 + by], [120, 44 + by]], s.mark);
      ell(118, 88 + by, 10, 20, s.body, 0.3);
      break;
    case "ox":
      ell(72, 80 + by, 36, 24, s.body); ell(112, 62 + by, 18, 15, s.body);
      g.strokeStyle = s.mark; g.lineWidth = 5; g.lineCap = "round";
      g.beginPath(); g.moveTo(104, 52 + by); g.quadraticCurveTo(96, 34 + by, 108, 28 + by); g.stroke();
      g.beginPath(); g.moveTo(118, 52 + by); g.quadraticCurveTo(130, 38 + by, 122, 28 + by); g.stroke();
      break;
    default: // tanuki, cat, fox
      ell(72, 82 + by, 34, 24, s.body); ell(110, 62 + by, 20, 18, s.body);
      if (s.kind === "tanuki") { tri([[96, 50 + by], [99, 36 + by], [106, 48 + by]], s.body); tri([[110, 46 + by], [116, 34 + by], [120, 48 + by]], s.body); }
      else { tri([[96, 52 + by], [96, 30 + by], [108, 46 + by]], s.body); tri([[110, 46 + by], [118, 26 + by], [122, 50 + by]], s.body); }
      ell(126, 68 + by, 10, 7, s.body);
  }
  // legs
  if (s.kind !== "slug" && s.kind !== "turtle") {
    for (const lx of [50, 66, 88, 100]) { g.fillStyle = s.dark; g.fillRect(lx, 92 + by, 9, 22 - by); g.fillStyle = s.body; g.fillRect(lx + 1, 92 + by, 7, 20 - by); }
  } else if (s.kind === "turtle") {
    for (const lx of [50, 96]) ell(lx, 104, 11, 8, s.body);
  }
  // cel shading: darker underside, a highlight on the back
  g.save();
  g.globalCompositeOperation = "source-atop";
  const shade = g.createLinearGradient(0, 40 + by, 0, 116);
  shade.addColorStop(0, "rgba(255,255,255,0.18)");
  shade.addColorStop(0.45, "rgba(255,255,255,0)");
  shade.addColorStop(0.6, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.35)");
  g.fillStyle = shade;
  g.fillRect(0, 0, BW, BH);
  g.restore();
  // markings and face
  if (s.kind === "tanuki") { for (let i = 0; i < 3; i++) { g.strokeStyle = s.mark; g.lineWidth = 2; g.beginPath(); g.arc(70, 82 + by, 10 + i * 6, -1.2, 0.6); g.stroke(); } }
  if (s.kind === "fox" || s.kind === "cat") { g.fillStyle = s.mark; g.fillRect(104, 66 + by, 14, 2); }
  const ex = s.kind === "turtle" ? 126 : s.kind === "slug" ? 108 : s.kind === "horse" ? 128 : 114;
  const ey = s.kind === "turtle" ? 80 : s.kind === "slug" ? 62 : s.kind === "horse" ? 50 : 58;
  ell(ex, ey + by, 4, 3, "#ffffff"); ell(ex + 0.5, ey + by, 2, 2.6, s.eye); g.fillStyle = "#101010"; g.fillRect(ex, ey - 2 + by, 1, 4);
  if (s.kind !== "slug" && s.kind !== "turtle") { g.fillStyle = "#401010"; g.fillRect(ex + 2, ey + 10 + by, 10, 2); g.fillStyle = "#fff"; g.fillRect(ex + 4, ey + 10 + by, 2, 2); g.fillRect(ex + 8, ey + 10 + by, 2, 2); }
  outline(g, BW, BH, "#100a10");
  return c;
}

// ---------------------------------------------------------------------------
// The Hokage rock: four carved faces with their hair silhouettes.
// ---------------------------------------------------------------------------

export function hokageRock(g, x, y, s, light = "#b8a890", dark = "#6a5a48", rock = "#9a8a78") {
  g.fillStyle = rock;
  g.beginPath();
  g.moveTo(x - 20 * s, y + 70 * s); g.lineTo(x + 10 * s, y - 6 * s); g.lineTo(x + 250 * s, y - 12 * s); g.lineTo(x + 290 * s, y + 70 * s);
  g.closePath();
  g.fill();
  const heads = [
    // First: long straight hair
    (hx) => { g.fillStyle = dark; g.fillRect(hx - 4 * s, y, 44 * s, 10 * s); g.fillRect(hx - 6 * s, y + 6 * s, 8 * s, 40 * s); g.fillRect(hx + 34 * s, y + 6 * s, 8 * s, 40 * s); },
    // Second: short spiky
    (hx) => { g.fillStyle = dark; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(hx + k * 7 * s - 2 * s, y + 8 * s); g.lineTo(hx + k * 7 * s + 2 * s, y - 4 * s); g.lineTo(hx + k * 7 * s + 7 * s, y + 8 * s); g.fill(); } },
    // Third: the Hokage hat
    (hx) => { g.fillStyle = dark; g.beginPath(); g.moveTo(hx - 6 * s, y + 9 * s); g.lineTo(hx + 18 * s, y - 8 * s); g.lineTo(hx + 42 * s, y + 9 * s); g.closePath(); g.fill(); },
    // Fourth: spiky bangs
    (hx) => { g.fillStyle = dark; g.fillRect(hx - 2 * s, y, 40 * s, 8 * s); for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(hx + k * 8 * s, y + 6 * s); g.lineTo(hx + k * 8 * s + 4 * s, y + 18 * s); g.lineTo(hx + k * 8 * s + 8 * s, y + 6 * s); g.fill(); } },
  ];
  heads.forEach((hair, k) => {
    const hx = x + (30 + k * 58) * s;
    g.fillStyle = light;
    g.beginPath();
    g.ellipse(hx + 18 * s, y + 24 * s, 19 * s, 24 * s, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.18)";
    g.beginPath();
    g.ellipse(hx + 26 * s, y + 26 * s, 10 * s, 22 * s, 0, 0, Math.PI * 2);
    g.fill();
    hair(hx);
    g.fillStyle = dark;
    g.fillRect(hx + 8 * s, y + 20 * s, 7 * s, 2 * s);
    g.fillRect(hx + 22 * s, y + 20 * s, 7 * s, 2 * s);
    g.fillRect(hx + 17 * s, y + 24 * s, 3 * s, 7 * s);
    g.fillRect(hx + 12 * s, y + 36 * s, 13 * s, 2 * s);
  });
}

// ---------------------------------------------------------------------------
// Public API: cached frames, drawn with feet anchoring.
// ---------------------------------------------------------------------------

const cache = new Map();
function frameFor(key, pose, frame) {
  const tails = /^beast(\d)$/.exec(key);
  const hq = tails && HQ_BEASTS.has(Number(tails[1]));
  const k = `${key}|${tails ? "b" : pose}|${hq ? frame % 16 : tails ? frame % 8 : frame % 4}`;
  let c = cache.get(k);
  if (!c) {
    c = hq ? beastHQ(Number(tails[1]), frame % 16) : tails ? beast(Number(tails[1]), frame % 8) : ninja(SPECS[key] ?? SPECS["sparring partner"], pose, frame % 4);
    cache.set(k, c);
  }
  return c;
}

/**
 * The art for a fighter key (G.body_key: "naruto", "rock lee", "beast9", ...).
 * draw(x, y, opts): feet at (x, y). opts: pose, t (ms), face ("left"|"right"),
 * scale, alpha, flash (white overlay 0..1), tint.
 */
export function fighterArt(key) {
  const m = mugenFor(key);
  if (m) return m;
  const isBeast = /^beast\d$/.test(key);
  return {
    key,
    big: isBeast,
    height: isBeast ? 104 : 34,
    draw(x, y, o = {}) {
      const { pose = "idle", t = performance.now(), face = "left", scale = 1, alpha = 1, flash = 0, glow = null } = o;
      const frame = Math.floor(t / (isBeast ? 120 : pose === "walk" ? 160 : 260));
      const img = frameFor(key, pose, frame);
      const w = isBeast ? BW : SW, h = isBeast ? BH : SH;
      // native facing: ninja sprites face left, beasts face right
      const nativeLeft = !isBeast;
      const flip = (face === "left") !== nativeLeft;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(flip ? -scale : scale, scale);
      const ox = (isBeast ? -75 : -16) - (img.margin ?? 0), oy = isBeast ? -116 : -42;
      if (glow) ctx.filter = `drop-shadow(0 0 1.5px ${glow}) drop-shadow(0 0 1.5px ${glow})`;
      // HQ beasts are painted at 2x: draw them into the 150 x 120 footprint
      const hq = !!img.margin;
      const dw = hq ? img.width / 2 : img.width, dh = hq ? img.height / 2 : img.height;
      ctx.drawImage(img, ox, oy, dw, dh);
      ctx.filter = "none";
      if (flash > 0) {
        ctx.globalAlpha *= flash;
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(img, ox, oy, dw, dh);
        ctx.drawImage(img, ox, oy, dw, dh);
      }
      ctx.restore();
    },
    /** Portrait for cut-ins: the sprite, scaled up. */
    portrait(x, y, scale = 3, t = performance.now()) {
      this.draw(x, y, { pose: "cast", t, scale, face: "left" });
    },
  };
}

// ---------------------------------------------------------------------------
// Summoning contracts: 7 species, 90 x 80, feet at (45, 76), facing right.
// ---------------------------------------------------------------------------

const SUMMONS = [
  { kind: "toad", body: "#d8682a", dark: "#8a3a14", mark: "#ffd84a" },
  { kind: "slug", body: "#e8f4f8", dark: "#7ab0d8", mark: "#3a6ac8" },
  { kind: "snake", body: "#7a4ab0", dark: "#3a1a6a", mark: "#e8d8ff" },
  { kind: "dog", body: "#c8a878", dark: "#7a6040", mark: "#2a4cc8" },
  { kind: "hawk", body: "#6a4a2a", dark: "#3a2414", mark: "#f4e8c8" },
  { kind: "monkey", body: "#4a3a2a", dark: "#22180e", mark: "#e8d8c0" },
  { kind: "weasel", body: "#f0ece4", dark: "#a8a090", mark: "#c83a3a" },
];
const smnCache = new Map();
function summonSprite(sp, frame) {
  const k = `${sp}|${frame % 4}`;
  if (smnCache.has(k)) return smnCache.get(k);
  const s = SUMMONS[sp] ?? SUMMONS[0];
  const [c, g] = layer(90, 80);
  const b = frame % 2;
  const ell = (x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
  switch (s.kind) {
    case "toad":
      ell(44, 54 - b, 30, 22, s.body); ell(58, 38 - b, 18, 14, s.body);
      for (const [x, y] of [[30, 48], [40, 60], [52, 50], [24, 58]]) ell(x, y - b, 3, 2, s.mark);
      ell(66, 32 - b, 4, 4, "#fff"); ell(67, 32 - b, 2, 3, "#101010");
      g.fillStyle = s.dark; g.fillRect(56, 44 - b, 16, 2);
      for (const x of [22, 60]) ell(x, 74, 10, 4, s.dark);
      g.fillStyle = "#3a2a5a"; g.fillRect(28, 34 - b, 28, 6); // vest
      break;
    case "slug":
      ell(44, 62, 36, 12, s.body); ell(66, 44 - b, 12, 20, s.body);
      g.fillStyle = s.mark; for (const x of [24, 36, 48]) g.fillRect(x, 54, 6, 3);
      g.strokeStyle = s.body; g.lineWidth = 3; g.beginPath(); g.moveTo(64, 28 - b); g.lineTo(60, 16 - b); g.moveTo(70, 28 - b); g.lineTo(74, 16 - b); g.stroke();
      ell(66, 40 - b, 2, 2, "#101010");
      break;
    case "snake":
      g.strokeStyle = s.body; g.lineWidth = 12; g.lineCap = "round";
      g.beginPath(); g.moveTo(16, 70); g.quadraticCurveTo(40, 40 + b * 3, 30, 56); g.quadraticCurveTo(70, 76, 64, 34 - b); g.stroke();
      ell(66, 28 - b, 12, 8, s.body); ell(70, 26 - b, 2.5, 2, "#ffe040");
      g.fillStyle = "#c83030"; g.fillRect(76, 31 - b, 8, 2);
      break;
    case "dog":
      ell(42, 54 - b, 22, 14, s.body); ell(62, 40 - b, 12, 11, s.body); ell(70, 44 - b, 7, 5, s.dark);
      g.fillStyle = s.dark; g.fillRect(52, 28 - b, 6, 8); for (const x of [26, 34, 48, 56]) g.fillRect(x, 62 - b, 5, 14 + b);
      g.fillStyle = s.mark; g.fillRect(54, 46 - b, 12, 3); ell(64, 38 - b, 2, 2, "#101010");
      break;
    case "hawk":
      ell(46, 46, 16, 20, s.body); ell(52, 24, 10, 9, s.mark);
      g.fillStyle = s.dark; g.beginPath(); g.moveTo(40, 40); g.lineTo(4, 20 + b * 10); g.lineTo(30, 52); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(52, 40); g.lineTo(88, 18 + b * 10); g.lineTo(60, 52); g.closePath(); g.fill();
      g.fillStyle = "#ffc040"; g.fillRect(60, 24, 6, 3); ell(55, 22, 2, 2, "#101010");
      break;
    case "monkey":
      ell(42, 50 - b, 18, 18, s.body); ell(54, 28 - b, 12, 11, s.body); ell(58, 30 - b, 7, 6, s.mark);
      g.fillStyle = "#c8a040"; g.save(); g.translate(64, 50); g.rotate(-0.6); g.fillRect(-2, -34, 4, 60); g.restore();
      for (const x of [32, 48]) { g.fillStyle = s.body; g.fillRect(x, 64 - b, 7, 12 + b); }
      ell(60, 28 - b, 2, 2, "#101010");
      break;
    default: // weasel with a scythe
      ell(40, 54 - b, 20, 12, s.body); ell(58, 42 - b, 10, 9, s.body);
      g.strokeStyle = s.body; g.lineWidth = 6; g.beginPath(); g.moveTo(22, 52); g.quadraticCurveTo(8, 30, 20, 20 + b * 2); g.stroke();
      g.strokeStyle = "#c8ccd8"; g.lineWidth = 3; g.beginPath(); g.arc(70, 40 - b, 14, -1.6, 0.2); g.stroke();
      g.fillStyle = s.mark; g.fillRect(52, 34 - b, 8, 2); ell(62, 40 - b, 2, 2, "#101010");
  }
  outline(g, 90, 80, "#100a10");
  smnCache.set(k, c);
  return c;
}

/** Draw a summoning contract creature (species 0..6), feet at (x, y). */
export function drawSummon(sp, x, y, o = {}) {
  const { t = performance.now(), face = "left", scale = 1, alpha = 1 } = o;
  const img = summonSprite(sp, Math.floor(t / 220));
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(face === "left" ? -scale : scale, scale);
  ctx.drawImage(img, -45, -76);
  ctx.restore();
}

/** A shadow ellipse under a fighter. */
export function shadow(x, y, w = 14) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
