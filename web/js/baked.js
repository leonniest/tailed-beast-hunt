// Baked sprites: the release build pre-renders every MUGEN character's poses
// into one small PNG atlas + JSON (tools/bake.mjs), so players download a few
// MB instead of ~250 MB of SFF files. Same draw()/portrait() interface as the
// live importer in mugen.js.
import { ctx } from "./core.js";

const POSES = ["idle", "ready", "walk", "attack", "cast", "hurt", "ko", "guard", "win"];

// ---------------------------------------------------------------------------
// Baking (runs in the browser on ?bake=1, driven by tools/bake.mjs)
// ---------------------------------------------------------------------------

/** Pre-render one live MUGEN character; returns { json, png (data URL) }. */
export function bakeChar(art) {
  const { air, anims, sprite, scale, cfg } = art.bake;
  const q = Math.min(1, 2.4 * scale); // baked px per source px (crisp up to 1.2x zoom on the 2x canvas)
  const sprites = [], index = new Map();
  const use = (g, i) => {
    const k = `${g},${i}`;
    if (index.has(k)) return index.get(k);
    const s = sprite(g, i);
    if (!s?.img) { index.set(k, -1); return -1; }
    sprites.push({ img: s.img, ax: s.ax, ay: s.ay, w: Math.max(1, Math.ceil(s.img.width * q)), h: Math.max(1, Math.ceil(s.img.height * q)) });
    index.set(k, sprites.length - 1);
    return sprites.length - 1;
  };
  const actions = {};
  const idleAct = anims.idle;
  for (const pose of POSES) {
    const id = anims[pose] ?? idleAct;
    if (actions[id]) continue;
    const a = air.get(id) ?? air.get(idleAct);
    if (!a) continue;
    let lastVis = -1;
    const frames = a.frames.map((f) => {
      let s = use(f.g, f.i);
      if (s < 0) s = lastVis; else lastVis = s;
      return { s, x: f.x, y: f.y, t: f.time, h: f.fh ? 1 : 0, v: f.fv ? 1 : 0 };
    });
    actions[id] = frames;
  }
  // portrait for jutsu cut-ins, kept at full resolution
  const p = sprite(9000, 1) ?? sprite(9000, 0);
  let portrait = null;
  if (p?.img) { sprites.push({ img: p.img, ax: 0, ay: 0, w: p.img.width, h: p.img.height, full: true }); portrait = sprites.length - 1; }
  // shelf-pack into an atlas
  const W = 1024;
  let x = 0, y = 0, row = 0;
  for (const s of sprites) {
    if (x + s.w > W) { x = 0; y += row + 1; row = 0; }
    s.x = x; s.y = y;
    x += s.w + 1;
    row = Math.max(row, s.h);
  }
  const atlas = document.createElement("canvas");
  atlas.width = W;
  atlas.height = Math.max(1, y + row);
  const g = atlas.getContext("2d");
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  for (const s of sprites) g.drawImage(s.img, s.x, s.y, s.w, s.h);
  const json = {
    v: 1, q, scale, height: art.height, big: art.big, portraitScale: cfg.portraitScale ?? 0.5,
    anims: Object.fromEntries(POSES.map((ps) => [ps, actions[anims[ps]] ? anims[ps] : idleAct])),
    actions,
    sprites: sprites.map((s) => [s.x, s.y, s.w, s.h, s.ax, s.ay, s.full ? 1 : 0]),
    portrait,
  };
  return { json, png: atlas.toDataURL("image/png") };
}

// ---------------------------------------------------------------------------
// Playing from baked data
// ---------------------------------------------------------------------------

export function bakedArt(key, d, img) {
  const total = (fr) => fr.reduce((s, f) => s + Math.max(f.t, 1), 0);
  const frameAt = (id, ms) => {
    const fr = d.actions[id] ?? d.actions[d.anims.idle];
    if (!fr?.length) return null;
    const ticks = Math.floor((ms / 1000) * 60);
    if (fr.some((f) => f.t < 0)) {
      let t = ticks;
      for (const f of fr) { if (f.t < 0 || t < f.t) return f; t -= f.t; }
    }
    let t = ticks % total(fr);
    for (const f of fr) { if (t < Math.max(f.t, 1)) return f; t -= Math.max(f.t, 1); }
    return fr[0];
  };
  return {
    key,
    big: d.big,
    height: d.height,
    mugen: true,
    baked: true,
    draw(x, y, o = {}) {
      const { pose = "idle", t = performance.now(), face = "left", scale: s2 = 1, alpha = 1, flash = 0, poseStart = 0, glow = null } = o;
      let f = frameAt(d.anims[pose] ?? d.anims.idle, t - poseStart);
      if (!f || f.s < 0) f = frameAt(d.anims.idle, t);
      if (!f || f.s < 0) return;
      const [sx, sy, sw, sh, ax, ay] = d.sprites[f.s];
      const flip = (face === "left") !== !!f.h;
      const k = d.scale * s2;
      const kq = k / d.q;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(flip ? -kq : kq, f.v ? -kq : kq);
      if (glow) ctx.filter = `drop-shadow(0 0 ${2 / kq}px ${glow}) drop-shadow(0 0 ${2 / kq}px ${glow})`;
      const dx = (-ax + f.x) * d.q, dy = (-ay + f.y) * d.q;
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
      ctx.filter = "none";
      if (flash > 0) { ctx.globalAlpha *= flash; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh); }
      ctx.restore();
    },
    portrait(x, y, s = 3) {
      if (d.portrait === null || d.portrait === undefined) { this.draw(x, y, { pose: "cast", scale: s * 0.6 }); return; }
      const [sx, sy, sw, sh] = d.sprites[d.portrait];
      const k = d.portraitScale * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-k, k);
      ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh, sw, sh);
      ctx.restore();
    },
  };
}
