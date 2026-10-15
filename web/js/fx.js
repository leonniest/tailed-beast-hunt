// Particles, floating text, shake and flashes shared by the scenes.
import { ctx, W, H } from "./core.js";
import { bigText, fill } from "./gfx.js";

export class FX {
  constructor() { this.parts = []; this.floats = []; this.shakeT = 0; this.shakeMag = 0; this.flashT = 0; this.flashCol = "#fff"; }

  burst(x, y, opts = {}) {
    const { n = 14, color = "#fff", speed = 1.2, life = 520, size = 2, gravity = 0.002, spread = Math.PI * 2, dir = -Math.PI / 2, shape = "sq", drag = 0.985 } = opts;
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - 0.5) * spread;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color: Array.isArray(color) ? color[i % color.length] : color, size, gravity, shape, drag, rot: Math.random() * 6 });
    }
  }

  /** A floating number or word that bounces up (FF damage style). */
  float(str, x, y, opts = {}) {
    this.floats.push({ str, x, y, t: 0, life: opts.life ?? 1000, color: opts.color ?? "#fff", size: opts.size ?? 13, bounce: opts.bounce ?? true, delay: opts.delay ?? 0 });
  }

  shake(mag = 3, ms = 220) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, ms); }
  flash(col = "#fff", ms = 160) { this.flashCol = col; this.flashT = ms; this.flashMax = ms; }

  update(dt) {
    for (const p of this.parts) {
      p.vy += p.gravity * dt;
      p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06;
      p.life -= dt; p.rot += dt * 0.01;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter((f) => f.t < f.life + f.delay);
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (!this.shakeT) this.shakeMag = 0;
    this.flashT = Math.max(0, this.flashT - dt);
  }

  offset() {
    if (!this.shakeT) return [0, 0];
    const m = this.shakeMag * (this.shakeT / 220);
    return [(Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m];
  }

  drawParts() {
    for (const p of this.parts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.6);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      if (p.shape === "leaf") { ctx.rotate(p.rot); ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); }
      else if (p.shape === "ring") { ctx.strokeStyle = p.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, p.size * (2 - p.life / p.max) * 3, 0, Math.PI * 2); ctx.stroke(); }
      else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  drawFloats() {
    for (const f of this.floats) {
      const t = f.t - f.delay;
      if (t < 0) continue;
      let dy = -t * 0.012;
      if (f.bounce) {
        // rise, fall back with a small bounce, then hold
        const k = Math.min(t / 420, 1);
        dy = -Math.abs(Math.sin(k * Math.PI)) * 14 * (1 - k * 0.5) - (k >= 1 ? 0 : 0);
        if (t > 420) dy = -Math.abs(Math.sin(Math.min((t - 420) / 180, 1) * Math.PI)) * 3;
      }
      const a = t > f.life - 250 ? Math.max(0, (f.life - t) / 250) : 1;
      bigText(f.str, f.x, f.y + dy, { color: f.color, size: f.size, alpha: a });
    }
  }

  drawFlash() {
    if (this.flashT > 0) fill(this.flashCol, (this.flashT / this.flashMax) * 0.7);
  }
}

/** Falling leaves for ambient scenes. */
export class Leaves {
  constructor(n = 26, colors = ["#e8902a", "#d86a1a", "#8ac04a", "#f0c040"]) {
    this.l = Array.from({ length: n }, () => this.spawn(colors, true));
    this.colors = colors;
  }
  spawn(colors, any = false) {
    return { x: Math.random() * W * 1.2, y: any ? Math.random() * H : -8, v: 0.25 + Math.random() * 0.4, ph: Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)], s: 1.5 + Math.random() * 1.5 };
  }
  update(dt) {
    for (const l of this.l) {
      l.y += l.v * dt * 0.05;
      l.x += Math.sin(l.ph + l.y / 30) * 0.3 - 0.15;
      if (l.y > H + 10) Object.assign(l, this.spawn(this.colors));
    }
  }
  draw() {
    for (const l of this.l) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(Math.sin(l.ph + l.y / 20));
      ctx.fillStyle = l.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, l.s * 1.6, l.s * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
