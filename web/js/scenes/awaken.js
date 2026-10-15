// A form awakens: the ninja, their new aura, the form's name and its jutsu.
import { ctx, W, H, input, ease, clamp, ui } from "../core.js";
import { win, text, bigText, hints, fill, wrap, COLORS } from "../gfx.js";
import { FX } from "../fx.js";
import * as audio from "../audio.js";
import { game, registerScene, route } from "../main.js";
import { arr, G, C, formInfo, formColor } from "../bend.js";
import { fighterArt } from "../art.js";

const TIER = ["", "FIRST FORM", "SECOND FORM", "FINAL FORM"];

function bonusText(b) {
  const parts = [];
  if (b.atkp) parts.push(`ATK +${b.atkp}%`);
  if (b.taip) parts.push(`Taijutsu +${b.taip}%`);
  if (b.ninp) parts.push(`Ninjutsu +${b.ninp}%`);
  if (b.haste) parts.push(`Haste +${b.haste}%`);
  if (b.cr) parts.push(`Crit +${b.cr}%`);
  if (b.dfnf) parts.push(`DEF +${b.dfnf}`);
  if (b.fd > 1000) parts.push(`Final DMG +${(b.fd - 1000) / 10}%`);
  if (b.pen < 1000) parts.push(`Def Pen ${(1000 - b.pen) / 10}%`);
  return parts.join("   ");
}
export { bonusText };

registerScene("awaken", () => {
  const ev = game.awaken.shift() ?? { i: 0, tier: 1 };
  const m = arr(game.run.party)[ev.i];
  const who = m.who.$;
  const fi = formInfo(who, ev.tier);
  const col = formColor(who, ev.tier);
  const art = fighterArt(G.body_key(C("Ninja", { who: m.who })));
  const sig = G.move_info(fi.sig);
  const fx = new FX();
  let t0 = 0;
  return {
    enter() { t0 = performance.now(); audio.sfx("combo"); setTimeout(() => audio.sfx("levelup"), 500); },
    update(dt) {
      fx.update(dt);
      const k = performance.now() - t0;
      if (Math.random() < 0.6) fx.burst(W / 2 + (Math.random() - 0.5) * 40, 170, { n: 1, color: col, speed: 0.8, life: 900, gravity: -0.003, spread: 0.6, size: 2 });
      if (k > 1500 && input.pressed("ok")) { audio.sfx("ok"); route(); }
    },
    draw(t) {
      ui.anywhere();
      const k = clamp((performance.now() - t0) / 1200, 0, 1);
      fill("#05040c");
      // radial burst
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2 + t / 3000;
        ctx.save();
        ctx.globalAlpha = 0.12 * ease.out(k);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(W / 2, 120);
        ctx.lineTo(W / 2 + Math.cos(a) * 500, 120 + Math.sin(a) * 500);
        ctx.lineTo(W / 2 + Math.cos(a + 0.09) * 500, 120 + Math.sin(a + 0.09) * 500);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      const g = ctx.createRadialGradient(W / 2, 130, 5, W / 2, 130, 110);
      g.addColorStop(0, col);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalAlpha = 0.35 * ease.out(k);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      fx.drawParts();
      art.draw(W / 2, 176, { pose: k < 1 ? "cast" : "win", t, scale: 2.6, glow: col, face: "left" });
      bigText(`${G.who_name(m.who).toUpperCase()}  -  ${TIER[ev.tier]}`, W / 2, 22, { size: 9, color: "#e8e8ff", lw: 2.5 });
      bigText(fi.name, W / 2, 44 + (1 - ease.back(k)) * 20, { size: 22, color: col, outline: "#0a0612", lw: 5, italic: true, alpha: k });
      win(30, 190, W - 60, 70);
      wrap(fi.desc, W - 90, 8.5).slice(0, 1).forEach((l) => text(l, W / 2, 197, { size: 8.5, align: "center" }));
      text(bonusText(fi.bon), W / 2, 211, { size: 7.5, align: "center", color: "#7dff9a" });
      text(`New jutsu: ${sig.name}  (${sig.cost ? `${sig.cost} CK` : `${sig.hpcost}% HP`})  -  ${sig.desc}`, W / 2, 224, { size: 7.5, align: "center", color: "#ffd84a" });
      text(`In battle, choose Transform. The form drains ${fi.drain} chakra per turn.`, W / 2, 238, { size: 7.5, align: "center", color: COLORS.dim });
      if (performance.now() - t0 > 1500) hints([["x", "Continue"]]);
    },
  };
});
