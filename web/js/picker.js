// The jutsu slot picker: the squad side by side, four jutsu each. Used to
// teach a generic jutsu (pick who learns it and which jutsu it replaces) and
// to train one (level-ups, hot springs). One click picks a (ninja, slot).
import { ctx, W, H, input, ui } from "./core.js";
import { win, text, hand, hints, COLORS, NATURE_COLORS, wrap } from "./gfx.js";
import * as audio from "./audio.js";
import { arr, G, C } from "./bend.js";
import { fighterArt } from "./art.js";

/** A ninja's four jutsu: [{ name, lvl (jutsu level), need (unlock level), locked, nat, taught }]. */
export function kitView(run, i) {
  const m = arr(run.party)[i];
  const tech = arr(m.tech ?? []);
  return arr(G.member_kit(m)).map((l, s) => ({
    name: G.move_info(l.move).name,
    lvl: arr(m.jlv)[s] ?? 1,
    need: l.lvl,
    locked: l.lvl > m.lvl,
    nat: G.move_nat(l.move),
    taught: (tech[s] ?? 0) > 0,
    desc: G.move_info(l.move).desc,
    cost: G.move_info(l.move).cost,
  }));
}

/** Who already knows generic jutsu k: { who, slot, lvl } or null (then it levels up instead). */
export function knownBy(run, k) {
  const party = arr(run.party);
  for (let who = 0; who < party.length; who++) {
    const slot = arr(party[who].tech ?? []).indexOf(k + 1);
    if (slot >= 0) return { who, slot, lvl: arr(party[who].jlv)[slot] ?? 1, name: G.who_name(party[who].who) };
  }
  return null;
}

export class SlotPicker {
  /**
   * opts: { title, gen (generic jutsu index to teach) | train (levels to add),
   *         who (fixed ninja or null), onPick(who, slot), onCancel() }
   */
  constructor(run, opts) {
    this.run = run;
    this.o = opts;
    this.c = opts.who ?? 0;
    this.r = 0;
  }

  update() {
    const n = arr(this.run.party).length;
    const fixed = this.o.who !== null && this.o.who !== undefined;
    const h = ui.hoverIndex("slot");
    if (h >= 0) {
      const c = Math.floor(h / 4), r = h % 4;
      if (!fixed || c === this.o.who) { this.c = c; this.r = r; }
    }
    if (input.pressed("up")) { this.r = (this.r + 3) % 4; audio.sfx("cursor"); }
    if (input.pressed("down")) { this.r = (this.r + 1) % 4; audio.sfx("cursor"); }
    if (!fixed && input.pressed("left")) { this.c = (this.c + n - 1) % n; audio.sfx("cursor"); }
    if (!fixed && input.pressed("right")) { this.c = (this.c + 1) % n; audio.sfx("cursor"); }
    const clicked = h >= 0 && ui.clicked(`slot:${h}`) && (!fixed || Math.floor(h / 4) === this.o.who);
    if (input.pressed("ok") || clicked) {
      const k = kitView(this.run, this.c)[this.r];
      if (this.o.train && k.lvl >= 10) { audio.sfx("buzz"); return; }
      audio.sfx("levelup");
      this.o.onPick(this.c, this.r);
    }
    if (input.pressed("back") && this.o.onCancel) { audio.sfx("back"); this.o.onCancel(); }
    if (this.o.onSkip && (input.pressed("alt") || ui.clicked("pskip"))) this.o.onSkip();
  }

  draw(t) {
    const run = this.run;
    const party = arr(run.party);
    const fixed = this.o.who !== null && this.o.who !== undefined;
    win(8, 6, W - 16, 22);
    text(this.o.title, W / 2, 12, { size: 9, align: "center", color: COLORS.hi });
    const cw = (W - 16) / party.length;
    party.forEach((m, c) => {
      const x = 8 + c * cw;
      const active = !fixed || c === this.o.who;
      win(x + 2, 32, cw - 4, 150, { dim: !active || c !== this.c, top: c === this.c ? "#4a5fd0" : "#3a4fb8" });
      fighterArt(G.body_key(C("Ninja", { who: m.who }))).draw(x + 26, 74, { t: t + c * 300, face: "right", alpha: active ? 1 : 0.4 });
      text(G.who_name(m.who), x + 46, 40, { size: 8.5, color: active ? COLORS.hi : COLORS.dim });
      text(`Lv ${m.lvl}`, x + 46, 52, { size: 7, color: "#a8b8ff" });
      kitView(run, c).forEach((k, r) => {
        const y = 84 + r * 24;
        const sel = c === this.c && r === this.r;
        if (active) ui.hit(`slot:${c * 4 + r}`, x + 6, y - 3, cw - 12, 22);
        ctx.save();
        ctx.fillStyle = sel ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.18)";
        ctx.fillRect(x + 6, y - 3, cw - 12, 22);
        ctx.fillStyle = NATURE_COLORS[k.nat] ?? "#fff";
        ctx.fillRect(x + 6, y - 3, 2, 22);
        ctx.restore();
        text(k.name, x + 12, y, { size: 7.5, color: !active ? COLORS.dim : k.taught ? "#9affc0" : COLORS.text });
        text(k.locked ? `unlocks Lv ${k.need}` : `Lv ${k.lvl}${this.o.train && sel ? ` -> ${Math.min(10, k.lvl + this.o.train)}` : ""}`, x + 12, y + 10, { size: 6.5, color: k.locked ? "#ffb070" : sel && this.o.train ? "#7dff9a" : "#a8b8ff" });
        if (sel) hand(x + 8, y + 6, t);
      });
    });
    // what happens
    win(8, 186, W - 16, 62);
    const k = kitView(run, this.c)[this.r];
    if (this.o.gen !== undefined && this.o.gen !== null) {
      const mv = G.move_info(G.gen_move(this.o.gen));
      text(`${G.who_name(party[this.c].who)} learns ${mv.name}, replacing ${k.name} (Lv ${k.lvl}).`, 18, 192, { size: 8, color: COLORS.hi });
      wrap(`${mv.name}: ${mv.desc} (${mv.cost} chakra)`, W - 40, 7.5).slice(0, 2).forEach((l, i) => text(l, 18, 206 + i * 10, { size: 7.5, color: "#9affc0" }));
      wrap(`Replaced: ${k.desc}`, W - 40, 7).slice(0, 1).forEach((l) => text(l, 18, 228, { size: 7, color: COLORS.dim }));
    } else {
      text(`${k.name}: Lv ${k.lvl} -> ${Math.min(10, k.lvl + (this.o.train ?? 0))}   (+6% power per level)`, 18, 192, { size: 8, color: COLORS.hi });
      wrap(k.desc, W - 40, 7.5).slice(0, 2).forEach((l, i) => text(l, 18, 206 + i * 10, { size: 7.5, color: "#dfe6ff" }));
    }
    if (this.o.onSkip) {
      const over = ui.over("pskip");
      win(W - 128, 228, 120, 18, { top: over ? "#6a6a8a" : "#4a4a6a", bottom: "#1a1a2a" });
      text(this.o.skipLabel ?? "Skip", W - 68, 233, { size: 7.5, align: "center", color: over ? "#ffffff" : "#c8c8e0" });
      ui.hit("pskip", W - 128, 228, 120, 18);
    }
    const verb = this.o.gen !== undefined && this.o.gen !== null ? "Teach" : "Train";
    hints(this.o.onCancel ? [["x", verb], ...(this.o.onSkip ? [["s", this.o.skipLabel ?? "Skip"]] : []), ["o", "Back"]] : [["x", verb]], W - 136, H - 9);
  }
}
