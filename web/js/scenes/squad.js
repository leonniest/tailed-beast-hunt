// Squad draft: pick 3 unlocked ninja, then depart.
import { ctx, W, H, input, ui } from "../core.js";
import { win, text, bigText, hand, hints, fill, COLORS, wrap } from "../gfx.js";
import * as audio from "../audio.js";
import { game, registerScene, scene, route } from "../main.js";
import { loadMeta, UNLOCKS, WHO, G, C, arr, newRun, saveRun, moveInfo } from "../bend.js";
import { fighterArt } from "../art.js";
import { startLog } from "../runlog.js";
import { Leaves } from "../fx.js";

registerScene("squad", () => {
  const meta = loadMeta();
  const picked = ["Naruto", "Sasuke", "Sakura"].filter((w) => meta.unlocked.includes(w));
  let cur = 0;
  const leaves = new Leaves(14, ["#8ac04a", "#5a9a3a"]);
  return {
    enter() { audio.play("village"); },
    update(dt) {
      leaves.update(dt);
      const mv = (d) => { cur = (cur + d + WHO.length) % WHO.length; audio.sfx("cursor"); };
      if (input.pressed("left")) mv(-1);
      if (input.pressed("right")) mv(1);
      if (input.pressed("up")) mv(-4);
      if (input.pressed("down")) mv(4);
      const m = ui.menu("pick", cur);
      cur = m.cur;
      if (input.pressed("ok") || m.ok) {
        const w = WHO[cur];
        if (!meta.unlocked.includes(w)) { audio.sfx("buzz"); return; }
        const k = picked.indexOf(w);
        if (k >= 0) { picked.splice(k, 1); audio.sfx("back"); }
        else if (picked.length < 3) { picked.push(w); audio.sfx("ok"); }
        else audio.sfx("buzz");
      }
      if ((input.pressed("menu") || ui.clicked("depart")) && picked.length === 3) {
        audio.sfx("ok");
        game.run = newRun(picked);
        if (!game.demo) { saveRun(game.run); startLog(game.run); }
        route();
      }
      if (input.pressed("back")) { audio.sfx("back"); game.go(scene("title")); }
    },
    draw(t) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#2a5a3a");
      g.addColorStop(1, "#122a1a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      leaves.draw();
      win(10, 8, W - 20, 22);
      text("Choose your squad", 22, 14, { size: 9.5, color: COLORS.hi });
      text(`${picked.length} / 3`, W - 24, 14, { size: 9.5, align: "right" });
      WHO.forEach((w, i) => {
        const x = 18 + (i % 4) * 66, y = 38 + Math.floor(i / 4) * 78;
        const open = meta.unlocked.includes(w);
        const k = picked.indexOf(w);
        ui.hit(`pick:${i}`, x, y, 60, 72);
        win(x, y, 60, 72, { dim: i !== cur, top: k >= 0 ? "#b8743a" : open ? "#3a4fb8" : "#30324a", bottom: k >= 0 ? "#5a2a0a" : open ? "#0d1656" : "#14141e" });
        const art = fighterArt(G.body_key(C("Ninja", { who: C(w) })));
        ctx.save();
        if (!open) ctx.filter = "brightness(0)";
        art.draw(x + 30, y + 52, { pose: k >= 0 ? "ready" : "idle", t: t + i * 300 });
        ctx.restore();
        text(open ? G.who_name(C(w)) : "???", x + 30, y + 56, { size: 7.5, align: "center", color: open ? COLORS.text : COLORS.dim });
        if (k >= 0) bigText(String(k + 1), x + 9, y + 10, { size: 10, color: "#ffd84a" });
        if (i === cur) hand(x - 1, y + 36, t);
      });
      // info panel
      const w = WHO[cur];
      const open = meta.unlocked.includes(w);
      win(286, 38, 184, 150);
      if (open) {
        const who = C(w);
        const b = G.who_base(who);
        text(G.who_name(who), 296, 46, { size: 10, color: COLORS.hi });
        text(G.who_passive(who), 296, 60, { size: 8, color: "#ffc070" });
        wrap(G.who_passive_desc(who), 164, 7.5).forEach((l, i) => text(l, 296, 71 + i * 9, { size: 7.5, color: "#dfe6ff" }));
        const stats = [["HP", b.hp], ["CK", b.ck], ["TAI", b.atk], ["NIN", b.nin], ["DEF", b.dfn], ["SPD", b.spd]];
        stats.forEach(([k, v], i) => {
          const sx = 296 + (i % 3) * 56, sy = 94 + Math.floor(i / 3) * 11;
          text(k, sx, sy, { size: 7.5, color: "#a8b8ff" });
          text(String(v), sx + 44, sy, { size: 7.5, align: "right" });
        });
        arr(G.who_moves(who)).forEach((l, i) => {
          const mi = moveInfo(l.move);
          text(`${mi.name}`, 296, 122 + i * 15, { size: 7.5 });
          text(`Lv${l.lvl}  ${mi.cost}ck`, 460, 122 + i * 15, { size: 7, align: "right", color: "#7fd8ff" });
          wrap(mi.desc, 160, 6.5).slice(0, 1).forEach((d) => text(d, 300, 130 + i * 15, { size: 6.5, color: COLORS.dim }));
        });
      } else {
        text("Locked", 296, 50, { size: 10, color: COLORS.dim });
        wrap(UNLOCKS[w].text, 164, 8).forEach((l, i) => text(l, 296, 68 + i * 11, { size: 8, color: "#ffb0b0" }));
      }
      const h = [["x", "Pick"], ["o", "Back"]];
      if (picked.length === 3) h.unshift(["t", "Depart!"]);
      hints(h);
      if (picked.length === 3) {
        const over = ui.over("depart");
        win(318, 194, 120, 22, { top: over ? "#3aa85a" : "#2a8a4a", bottom: "#0a2a10" });
        bigText("DEPART!", 378, 205, { size: 11, color: Math.floor(t / 450) % 2 || over ? "#ffffff" : "#7fffb0" });
        ui.hit("depart", 318, 194, 120, 22);
      }
    },
  };
});
