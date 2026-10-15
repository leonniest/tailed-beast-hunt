// MUGEN character import: .def (files), .air (animations), .sff v1/v2
// (sprites) and .act (palettes). A character listed in
// assets/mugen/manifest.json replaces the procedural placeholder art with the
// same draw() interface. See ART_BRIEF.md for the manifest format.
import { ctx } from "./core.js";

const BASE = new URL("../../assets/mugen/", import.meta.url);
const bank = new Map(); // key -> art object

export function mugenFor(key) { return bank.get(key) ?? null; }
// Debug hook for tools/drive.mjs.
window.__mugen = { keys: () => [...bank.keys()], errors: [], get: (k) => bank.get(k) };

async function fetchJson(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; }
}

/**
 * Load every character listed in the sprite workshop's manifest
 * (SPRITES/manifest.json, maintained by the art workstream; falls back to
 * manifest.example.json) merged with local overrides in
 * assets/mugen/manifest.json. Paths are relative to assets/mugen/.
 */
export async function loadMugen(onProgress = () => {}) {
  // Release builds ship pre-rendered atlases (tools/bake.mjs); ?live=1 or
  // ?bake=1 forces the live SFF import.
  const q = new URLSearchParams(location.search);
  if (!q.has("live") && !q.has("bake")) {
    const idx = await fetchJson(new URL("../baked/index.json", BASE));
    if (idx?.keys?.length) return loadBaked(idx, onProgress);
  }
  const shop = (await fetchJson(new URL("../../SPRITES/manifest.json", BASE))) ?? (await fetchJson(new URL("../../SPRITES/manifest.example.json", BASE))) ?? {};
  const local = (await fetchJson(new URL("manifest.json", BASE))) ?? {};
  const manifest = { ...shop, ...local };
  // Entries are merged per field, so an override may give just `anims` or `act`.
  for (const [k, v] of Object.entries(local)) if (shop[k] && !v.like) manifest[k] = { ...shop[k], ...v, anims: { ...(shop[k].anims ?? {}), ...(v.anims ?? {}) } };
  // Stand-ins: `"like": "<key>"` reuses another entry's files, usually with
  // `recolor` rules, until a character's own pack exists.
  const resolve = (cfg) => {
    if (!cfg.like || !manifest[cfg.like]) return cfg;
    const b = resolve(manifest[cfg.like]);
    return { ...b, ...cfg, anims: { ...(b.anims ?? {}), ...(cfg.anims ?? {}) }, recolor: cfg.recolor ?? [] };
  };
  const entries = Object.entries(manifest).filter(([k, v]) => !k.startsWith("_") && v && (v.def || v.like));
  let done = 0;
  for (const [key, cfg0] of entries) {
    const cfg = resolve(cfg0);
    try {
      bank.set(key, await loadChar(key, cfg));
    } catch (e) {
      console.warn(`MUGEN: ${key} failed`, e);
      window.__mugen.errors.push(`${key}: ${e.message}`);
    }
    onProgress(++done, entries.length);
  }
  return bank.size;
}

// Files are fetched once even when stand-ins share a pack.
const files = new Map();
function fetchRaw(path) {
  if (!files.has(path)) {
    files.set(path, fetch(new URL(path, BASE)).then(async (r) => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return r.arrayBuffer();
    }));
  }
  return files.get(path);
}
async function loadBaked(idx, onProgress) {
  const { bakedArt } = await import("./baked.js");
  const dir = new URL("../baked/", BASE);
  let done = 0;
  await Promise.all(idx.keys.map(async (key) => {
    try {
      const file = encodeURIComponent(key.replace(/[^a-z0-9@]+/gi, "_"));
      const [d, img] = await Promise.all([
        fetchJson(new URL(`${file}.json`, dir)),
        new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = new URL(`${file}.png?v=${idx.v ?? 0}`, dir).href; }),
      ]);
      bank.set(key, bakedArt(key, d, img));
    } catch (e) {
      window.__mugen.errors.push(`${key}: baked load failed`);
    }
    onProgress(++done, idx.keys.length);
  }));
  return bank.size;
}

async function fetchBuf(path) {
  return new Uint8Array(await fetchRaw(path));
}
async function fetchText(path) {
  return new TextDecoder("latin1").decode(await fetchRaw(path));
}

// ---------------------------------------------------------------------------
// Recolouring (stand-ins): rules move a hue band to another hue and scale
// its saturation / lightness. {h: [from, to] | (greys), to: hue, shift, s: x,
// sAdd, l: +-, lk: x, minS, maxS, sMax, lmin, lmax}
// ---------------------------------------------------------------------------

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  const f = (n) => {
    const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}
const inBand = (h, [a, b]) => (a <= b ? h >= a && h <= b : h >= a || h <= b);

export function recolorCanvas(img, rules) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height);
  const d = id.data;
  const memo = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let out = memo.get(key);
    if (!out) {
      let [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      for (const r of rules) {
        // a rule matches a hue band (saturated pixels) or, without `h`, greys
        const hit = r.h ? s >= (r.minS ?? 0.12) && inBand(h, r.h) : s <= (r.maxS ?? 0.15);
        if (!hit || s > (r.sMax ?? 1) || l < (r.lmin ?? 0) || l > (r.lmax ?? 1)) continue;
        if (r.to !== undefined) h = r.to;
        if (r.shift) h = (h + r.shift + 360) % 360;
        if (r.s !== undefined) s *= r.s;
        if (r.sAdd !== undefined) s += r.sAdd;
        s = Math.max(0, Math.min(1, s));
        if (r.l !== undefined) l = Math.max(0, Math.min(1, l + r.l));
        if (r.lk !== undefined) l = Math.max(0, Math.min(1, l * r.lk));
        break;
      }
      out = hsl2rgb(h, s, l);
      memo.set(key, out);
    }
    d[i] = out[0]; d[i + 1] = out[1]; d[i + 2] = out[2];
  }
  g.putImageData(id, 0, 0);
  return c;
}
const dir = (p) => p.slice(0, p.lastIndexOf("/") + 1);

// ---------------------------------------------------------------------------
// .def: the [Files] section names the sprite, animation and palette files.
// ---------------------------------------------------------------------------

export function parseDef(text) {
  const out = {};
  let section = "";
  for (let line of text.split(/\r?\n/)) {
    line = line.replace(/;.*/, "").trim();
    if (!line) continue;
    const s = /^\[(.+)\]$/.exec(line);
    if (s) { section = s[1].trim().toLowerCase(); continue; }
    const kv = /^([^=]+)=(.*)$/.exec(line);
    if (kv) out[`${section}.${kv[1].trim().toLowerCase()}`] = kv[2].trim().replace(/^"|"$/g, "");
  }
  return out;
}

// ---------------------------------------------------------------------------
// .air: [Begin Action N] blocks of "group, image, x, y, time[, flip[, blend]]".
// ---------------------------------------------------------------------------

export function parseAir(text) {
  const actions = new Map();
  let cur = null;
  for (let line of text.split(/\r?\n/)) {
    line = line.replace(/;.*/, "").trim();
    if (!line) continue;
    const a = /^\[\s*begin\s+action\s+(-?\d+)\s*\]/i.exec(line);
    if (a) { cur = { frames: [], loop: 0 }; actions.set(Number(a[1]), cur); continue; }
    if (!cur) continue;
    if (/^loopstart/i.test(line)) { cur.loop = cur.frames.length; continue; }
    if (/^clsn/i.test(line)) continue;
    const p = line.split(",").map((s) => s.trim());
    if (p.length >= 5 && /^-?\d+$/.test(p[0])) {
      const flip = (p[5] ?? "").toUpperCase();
      cur.frames.push({ g: +p[0], i: +p[1], x: +p[2] || 0, y: +p[3] || 0, time: +p[4], fh: flip.includes("H"), fv: flip.includes("V") });
    }
  }
  return actions;
}

// ---------------------------------------------------------------------------
// .act palettes: 256 RGB triplets, stored in reverse order.
// ---------------------------------------------------------------------------

export function parseAct(buf, reversed = true) {
  const pal = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const j = (reversed ? 255 - i : i) * 3;
    pal[i * 4] = buf[j]; pal[i * 4 + 1] = buf[j + 1]; pal[i * 4 + 2] = buf[j + 2];
    pal[i * 4 + 3] = i === 0 ? 0 : 255;
  }
  return pal;
}

// .act files come in both byte orders in the wild (MUGEN's reversed one and
// Photoshop's plain one). Pick the order closest to the palette embedded in
// the character's own idle sprite.
function palDist(a, b) {
  let d = 0;
  for (let i = 4; i < 1024; i += 4) d += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  return d;
}
function pickAct(buf, ref) {
  const rev = parseAct(buf, true), fwd = parseAct(buf, false);
  // A black reference palette (sprites that rely on the .act) can't decide:
  // use MUGEN's standard reversed order.
  if (!ref || ref.reduce((s, v, i) => (i % 4 === 3 ? s : s + v), 0) / 768 < 20) return rev;
  return palDist(fwd, ref) < palDist(rev, ref) ? fwd : rev;
}

// ---------------------------------------------------------------------------
// .sff
// ---------------------------------------------------------------------------

const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const s16 = (b, o) => (u16(b, o) << 16) >> 16;
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

/** Returns { sprites: Map("g,i" -> sprite), version }. Sprites decode lazily. */
export function parseSff(b) {
  const sig = String.fromCharCode(...b.subarray(0, 11));
  if (sig !== "ElecbyteSpr") throw new Error("not an SFF file");
  const verHi = b[15];
  return verHi === 2 ? parseSff2(b) : parseSff1(b);
}

// SFF v1: a linked list of subfiles, each a PCX image (or a link). The
// character palette (`act`) is set after loading; portraits (group 9000)
// keep their own palettes.
function parseSff1(b) {
  const nImages = u32(b, 20);
  let off = u32(b, 24);
  const list = [];
  const sprites = new Map();
  let sharedPal = null;
  // Header palette type: 1 = shared (the .act recolors every sprite),
  // 0 = individual (each sprite carries its own palette).
  const out = { sprites, version: 1, act: null, shared: b[32] === 1 };
  for (let n = 0; n < nImages && off > 0 && off < b.length; n++) {
    const next = u32(b, off);
    const len = u32(b, off + 4);
    const sp = { ax: s16(b, off + 8), ay: s16(b, off + 10), g: u16(b, off + 12), i: u16(b, off + 14), link: u16(b, off + 16), same: b[off + 18] };
    if (len === 0) {
      const src = list[sp.link];
      if (src) Object.assign(sp, { pcx: src.pcx, pal: src.pal, linked: src });
    } else {
      sp.pcx = b.subarray(off + 32, off + 32 + len);
      const own = !sp.same && sp.pcx.length > 769 && sp.pcx[sp.pcx.length - 769] === 12;
      if (own) {
        const p = sp.pcx.subarray(sp.pcx.length - 768);
        const pal = new Uint8Array(1024);
        for (let i = 0; i < 256; i++) { pal[i * 4] = p[i * 3]; pal[i * 4 + 1] = p[i * 3 + 1]; pal[i * 4 + 2] = p[i * 3 + 2]; pal[i * 4 + 3] = i === 0 ? 0 : 255; }
        sp.pal = pal;
        if (!sharedPal) sharedPal = pal;
      } else sp.pal = null;
    }
    list.push(sp);
    if (!sprites.has(`${sp.g},${sp.i}`)) sprites.set(`${sp.g},${sp.i}`, sp);
    off = next;
  }
  let prev = null;
  for (const sp of list) {
    const own = sp.pal ?? (sp.same ? prev : null);
    if (sp.pal) prev = sp.pal;
    sp.decode = () => decodePcx(sp.pcx, (sp.g !== 9000 && out.act) || own || sharedPal);
  }
  return out;
}

function decodePcx(pcx, pal) {
  const w = u16(pcx, 8) - u16(pcx, 4) + 1;
  const h = u16(pcx, 10) - u16(pcx, 6) + 1;
  const bpl = u16(pcx, 66);
  const idx = new Uint8Array(bpl * h);
  let i = 128, o = 0;
  while (o < idx.length && i < pcx.length) {
    const v = pcx[i++];
    if ((v & 0xc0) === 0xc0) { const n = v & 0x3f; const c = pcx[i++]; for (let k = 0; k < n && o < idx.length; k++) idx[o++] = c; }
    else idx[o++] = v;
  }
  return indexedToCanvas(idx, bpl, w, h, pal);
}

function indexedToCanvas(idx, stride, w, h, pal) {
  const c = document.createElement("canvas");
  c.width = Math.max(w, 1);
  c.height = Math.max(h, 1);
  const g = c.getContext("2d");
  const img = g.createImageData(c.width, c.height);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = idx[y * stride + x];
      const p = (y * w + x) * 4;
      if (!pal || v === 0) { d[p + 3] = 0; continue; }
      d[p] = pal[v * 4]; d[p + 1] = pal[v * 4 + 1]; d[p + 2] = pal[v * 4 + 2]; d[p + 3] = pal[v * 4 + 3];
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// SFF v2: a sprite table and a palette table pointing into two data blocks.
function parseSff2(b) {
  const sprOff = u32(b, 0x24), sprN = u32(b, 0x28);
  const palOff = u32(b, 0x2c), palN = u32(b, 0x30);
  const ldata = u32(b, 0x34), tdata = u32(b, 0x3c);
  const pals = [];
  for (let n = 0; n < palN; n++) {
    const o = palOff + n * 16;
    const ncol = u16(b, o + 4), link = u16(b, o + 6), off = u32(b, o + 8), len = u32(b, o + 12);
    if (len === 0 && pals[link]) { pals.push(pals[link]); continue; }
    const pal = new Uint8Array(1024);
    const src = b.subarray(ldata + off, ldata + off + ncol * 4);
    for (let i = 0; i < ncol && i < 256; i++) { pal[i * 4] = src[i * 4]; pal[i * 4 + 1] = src[i * 4 + 1]; pal[i * 4 + 2] = src[i * 4 + 2]; pal[i * 4 + 3] = i === 0 ? 0 : 255; }
    pals.push(pal);
  }
  const list = [];
  const sprites = new Map();
  for (let n = 0; n < sprN; n++) {
    const o = sprOff + n * 28;
    const sp = {
      g: u16(b, o), i: u16(b, o + 2), w: u16(b, o + 4), h: u16(b, o + 6), ax: s16(b, o + 8), ay: s16(b, o + 10),
      link: u16(b, o + 12), fmt: b[o + 14], depth: b[o + 15], off: u32(b, o + 16), len: u32(b, o + 20), pal: u16(b, o + 24), flags: u16(b, o + 26),
    };
    list.push(sp);
    if (!sprites.has(`${sp.g},${sp.i}`)) sprites.set(`${sp.g},${sp.i}`, sp);
  }
  for (const sp of list) {
    const src = sp.len === 0 ? list[sp.link] ?? sp : sp;
    const base = (src.flags & 1 ? tdata : ldata) + src.off;
    const data = b.subarray(base, base + src.len);
    const pal = pals[sp.pal] ?? pals[0];
    if (src.fmt >= 10) {
      // PNG: decoded asynchronously by loadChar(). PNG8 (fmt 10) is indexed
      // and coloured by the SFF palette, so it gets our own decoder.
      sp.png = data.subarray(4);
      sp.pngPal = src.fmt === 10 ? pal : null;
      sp.decode = () => sp.bitmap ?? null;
    } else {
      sp.decode = () => {
        const raw = src.fmt === 0 ? data : src.fmt === 2 ? rle8(data.subarray(4), src.w * src.h) : src.fmt === 3 ? rle5(data.subarray(4), src.w * src.h) : src.fmt === 4 ? lz5(data.subarray(4), u32(data, 0)) : null;
        return raw ? indexedToCanvas(raw, src.w, src.w, src.h, pal) : null;
      };
    }
  }
  return { sprites, version: 2 };
}

function rle8(src, size) {
  const out = new Uint8Array(size);
  let i = 0, o = 0;
  while (o < size && i < src.length) {
    const v = src[i++];
    if ((v & 0xc0) === 0x40) { const n = v & 0x3f; const c = src[i++]; for (let k = 0; k < n && o < size; k++) out[o++] = c; }
    else out[o++] = v;
  }
  return out;
}

function rle5(src, size) {
  const out = new Uint8Array(size);
  let i = 0, o = 0;
  while (o < size && i < src.length) {
    let run = src[i++];
    let dl = src[i] & 0x7f;
    let c = 0;
    if (src[i] >> 7) { i++; c = src[i]; }
    i++;
    for (;;) {
      if (o < size) out[o++] = c;
      run--;
      if (run < 0) {
        dl--;
        if (dl < 0) break;
        c = src[i] & 0x1f;
        run = src[i] >> 5;
        i++;
      }
    }
  }
  return out;
}

// LZ5 as implemented by Ikemen GO (image.go, Lz5Decode).
function lz5(src, size) {
  const out = new Uint8Array(size);
  if (!src.length) return out;
  let i = 0, j = 0;
  let ct = src[i], cts = 0, rb = 0, rbc = 0;
  if (i < src.length - 1) i++;
  while (j < size) {
    let d = src[i];
    if (i < src.length - 1) i++;
    if (ct & (1 << cts)) {
      let n;
      if ((d & 0x3f) === 0) {
        d = ((d << 2) | src[i]) + 1;
        if (i < src.length - 1) i++;
        n = src[i] + 2;
        if (i < src.length - 1) i++;
      } else {
        rb |= (d & 0xc0) >> rbc;
        rbc += 2;
        n = d & 0x3f;
        if (rbc < 8) {
          d = src[i] + 1;
          if (i < src.length - 1) i++;
        } else {
          d = rb + 1;
          rb = rbc = 0;
        }
      }
      for (;;) {
        if (j < size) { out[j] = out[j - d] ?? 0; j++; }
        n--;
        if (n < 0) break;
      }
    } else {
      let n;
      if ((d & 0xe0) === 0) {
        n = src[i] + 8;
        if (i < src.length - 1) i++;
      } else {
        n = d >> 5;
        d &= 0x1f;
      }
      for (; n > 0; n--) if (j < size) out[j++] = d;
    }
    cts++;
    if (cts >= 8) {
      ct = src[i];
      cts = 0;
      if (i < src.length - 1) i++;
    }
  }
  return out;
}

// PNG8 with an external palette: parse chunks, inflate, unfilter, recolour.
async function decodePng8(png, pal) {
  const be32 = (o) => ((png[o] << 24) | (png[o + 1] << 16) | (png[o + 2] << 8) | png[o + 3]) >>> 0;
  let o = 8, w = 0, h = 0, depth = 8, ctype = 3;
  const idat = [];
  while (o + 8 <= png.length) {
    const len = be32(o);
    const type = String.fromCharCode(png[o + 4], png[o + 5], png[o + 6], png[o + 7]);
    const body = png.subarray(o + 8, o + 8 + len);
    if (type === "IHDR") { w = be32(o + 8); h = be32(o + 12); depth = body[8]; ctype = body[9]; }
    if (type === "IDAT") idat.push(body);
    if (type === "IEND") break;
    o += 12 + len;
  }
  if (ctype !== 3 && ctype !== 0) return null;
  const stream = new Blob(idat).stream().pipeThrough(new DecompressionStream("deflate"));
  const raw = new Uint8Array(await new Response(stream).arrayBuffer());
  const stride = Math.ceil((w * depth) / 8);
  const out = new Uint8Array(stride * h);
  const bpp = Math.max(1, depth / 8);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  let idx = out;
  if (depth < 8) {
    idx = new Uint8Array(w * h);
    const per = 8 / depth, mask = (1 << depth) - 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) idx[y * w + x] = (out[y * stride + Math.floor(x / per)] >> ((per - 1 - (x % per)) * depth)) & mask;
  }
  return indexedToCanvas(idx, depth < 8 ? w : stride, w, h, pal);
}

// Height of the non-transparent part of a sprite (ignores empty padding).
function visibleHeight(img) {
  try {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let top = -1, bottom = -1;
    for (let y = 0; y < c.height && top < 0; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) { top = y; break; }
    for (let y = c.height - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) { bottom = y; break; }
    return top < 0 ? img.height : Math.max(1, bottom - top + 1);
  } catch { return img.height; }
}

// ---------------------------------------------------------------------------
// A character: the same draw() interface as the procedural art.
// ---------------------------------------------------------------------------

// Standard MUGEN action numbers for our poses (manifest "anims" overrides).
const POSE = { idle: 0, ready: 0, walk: 20, attack: 200, cast: 1000, hurt: 5000, ko: 5150, guard: 130, win: 181 };

async function loadChar(key, cfg) {
  const defPath = cfg.def;
  const def = parseDef(await fetchText(defPath));
  const base = dir(defPath);
  const actName = def["files.pal1"];
  const sff = parseSff(await fetchBuf(base + def["files.sprite"]));
  // The SFF header's palette-type byte is unreliable in fan packs, so look at
  // the .act itself: a real character palette (128+ colours) recolours every
  // non-portrait sprite; a stub one is ignored and sprites keep their own.
  if (actName && sff.version === 1) {
    try {
      const buf = await fetchBuf(base + actName);
      let colours = 0;
      for (let i = 0; i + 2 < Math.min(buf.length, 768); i += 3) if (buf[i] | buf[i + 1] | buf[i + 2]) colours++;
      const ref = sff.sprites.get("0,0")?.pal ?? [...sff.sprites.values()].find((s) => s.g !== 9000 && s.pal)?.pal;
      if ((colours >= 128 && cfg.act !== false) || cfg.act === true) {
        sff.act = cfg.actOrder === "plain" ? parseAct(buf, false) : cfg.actOrder === "reversed" ? parseAct(buf, true) : pickAct(buf, ref);
      }
    } catch { /* optional */ }
  }
  const air = parseAir(await fetchText(base + def["files.anim"]));
  const anims = { ...POSE, ...(cfg.anims ?? {}) };
  // No standing action 0 (some beasts): stand on the lowest action there is.
  if (!air.has(anims.idle)) anims.idle = Math.min(...[...air.keys()].filter((k) => k >= 0));
  const decoded = new Map();
  const sprite = (g, i) => {
    const k = `${g},${i}`;
    if (decoded.has(k)) return decoded.get(k);
    const sp = sff.sprites.get(k);
    let img = sp ? sp.decode() : null;
    if (img && cfg.recolor?.length) img = recolorCanvas(img, cfg.recolor);
    const c = sp ? { img, ax: sp.ax, ay: sp.ay } : null;
    if (c?.img) decoded.set(k, c);
    return c;
  };
  // Decode PNG sprites (SFF v2 formats 10-12) up front.
  await Promise.all([...sff.sprites.values()].filter((s) => s.png).map(async (s) => {
    try {
      s.bitmap = s.pngPal ? await decodePng8(s.png, s.pngPal) : await createImageBitmap(new Blob([s.png], { type: "image/png" }));
    } catch (e) { console.warn("MUGEN png", e); }
  }));
  // An idle whose frames have no sprite (some packs point at a missing 0,0):
  // stand on group 0's images instead.
  const drawable = (a) => air.get(a)?.frames.some((f) => sff.sprites.has(`${f.g},${f.i}`));
  if (!drawable(anims.idle)) {
    const g0 = [...sff.sprites.values()].filter((sp) => sp.g === 0).sort((x, y) => x.i - y.i);
    if (g0.length) {
      air.set(-77, { frames: g0.map((sp) => ({ g: 0, i: sp.i, x: 0, y: 0, time: 8, fh: false, fv: false })) });
      anims.idle = -77;
      if (anims.ready === 0) anims.ready = -77;
    }
  }
  const idle = air.get(anims.idle)?.frames[0];
  const idleSpr = idle ? sprite(idle.g, idle.i) : null;
  const target = cfg.height ?? (cfg.beast ? 104 : 40);
  const scale = cfg.scale ?? (idleSpr?.img ? target / visibleHeight(idleSpr.img) : 0.4);

  function frameAt(action, ms) {
    const a = air.get(action) ?? air.get(anims.idle);
    if (!a || !a.frames.length) return null;
    const ticks = Math.floor((ms / 1000) * 60);
    const total = a.frames.reduce((s, f) => s + Math.max(f.time, 1), 0);
    if (a.frames.some((f) => f.time < 0)) {
      // hold the -1 frame once reached
      let t = ticks;
      for (const f of a.frames) { if (f.time < 0 || t < f.time) return f; t -= f.time; }
    }
    let t = ticks % total;
    for (const f of a.frames) { if (t < Math.max(f.time, 1)) return f; t -= Math.max(f.time, 1); }
    return a.frames[0];
  }

  return {
    key,
    big: !!cfg.beast,
    height: target,
    mugen: true,
    // for tools/bake.mjs: everything needed to pre-render the poses
    bake: { air, anims, sprite, scale, cfg },
    draw(x, y, o = {}) {
      const { pose = "idle", t = performance.now(), face = "left", scale: s2 = 1, alpha = 1, flash = 0, poseStart = 0, glow = null } = o;
      const act = anims[pose] ?? 0;
      let f = frameAt(act, t - poseStart);
      let spr = f ? sprite(f.g, f.i) : null;
      // A blank frame (often the held end of a win pose): keep the last visible one.
      if (f && !spr?.img) {
        const fr = air.get(act)?.frames ?? [];
        for (let j = fr.indexOf(f) - 1; j >= 0 && !spr?.img; j--) { const s3 = sprite(fr[j].g, fr[j].i); if (s3?.img) { f = fr[j]; spr = s3; } }
      }
      // An action whose sprites aren't in the SFF falls back to standing.
      if (!spr?.img) { f = frameAt(anims.idle, t); spr = f ? sprite(f.g, f.i) : null; }
      if (!spr?.img) return;
      // MUGEN characters face right natively.
      const flip = (face === "left") !== f.fh;
      const k = scale * s2;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(flip ? -k : k, f.fv ? -k : k);
      if (glow) ctx.filter = `drop-shadow(0 0 ${2 / k}px ${glow}) drop-shadow(0 0 ${2 / k}px ${glow})`;
      ctx.drawImage(spr.img, -spr.ax + f.x, -spr.ay + f.y);
      ctx.filter = "none";
      if (flash > 0) { ctx.globalAlpha *= flash; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(spr.img, -spr.ax + f.x, -spr.ay + f.y); }
      ctx.restore();
    },
    portrait(x, y, s = 3) {
      const p = sprite(9000, 1) ?? sprite(9000, 0);
      if (!p?.img) { this.draw(x, y, { pose: "cast", scale: s * 0.6 }); return; }
      const k = (cfg.portraitScale ?? 0.5) * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-k, k); // portraits face right; cut-ins want them facing left
      ctx.drawImage(p.img, -p.img.width / 2, -p.img.height);
      ctx.restore();
    },
  };
}
