// Game over, or victory (the Nine-Tails sealed). Records meta progress.
import { ctx, W, H, input, ui } from "../core.js";
import { win, text, bigText, hints, COLORS } from "../gfx.js";
import * as audio from "../audio.js";
import { game, registerScene, scene } from "../main.js";
import { arr, G, C, recordRun, clearRun } from "../bend.js";
import { fighterArt } from "../art.js";
import { Leaves } from "../fx.js";

registerScene("end", () => {
  const run = game.run;
  const won = run.mode.$ === "Victory";
  const fresh = game.demo ? [] : recordRun(run);
  if (!game.demo) clearRun();
  const leaves = new Leaves(won ? 40 : 10, won ? ["#ffd84a", "#ff9a2a", "#ffffff"] : ["#5a4a5a", "#3a3040"]);
  let t0 = 0;
  return {
    enter() { audio.play(won ? "victory" : "gameover"); t0 = performance.now(); },
    update(dt) {
      leaves.update(dt);
      if (performance.now() - t0 > 1200 && input.pressed("ok")) { audio.sfx("ok"); game.run = null; game.go(scene("title")); }
    },
    draw(t) {
      ui.anywhere();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, won ? "#3a5a9a" : "#1a0a14");
      g.addColorStop(1, won ? "#f0b860" : "#000000");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      leaves.draw();
      if (won) {
        // the three sealed beasts, ghostly behind the squad
        [3, 6, 9].forEach((tl, i) => fighterArt(`beast${tl}`).draw(90 + i * 150, 132, { t, scale: 0.55, alpha: 0.35, face: i === 2 ? "left" : "right" }));
        bigText("THE NINE-TAILS IS SEALED", W / 2, 40, { size: 18, color: "#ffd84a", lw: 4, italic: true });
        text("Isobu, Saiken and Kurama rest in their seals. The shinobi world is at peace... for now.", W / 2, 60, { size: 8, align: "center", color: "#fff6d8" });
      } else {
        const boss = ["The Three-Tails", "The Six-Tails", "The Nine-Tails"][Math.min(run.act, 2)];
        bigText("GAME OVER", W / 2, 44, { size: 24, color: "#ff5a5a", lw: 4 });
        text(`${boss} still runs wild.`, W / 2, 66, { size: 9, align: "center", color: "#e0c8d0" });
      }
      arr(run.party).forEach((m, i) => {
        fighterArt(G.body_key(C("Ninja", { who: m.who }))).draw(W / 2 - 50 + i * 50, 140, { pose: won ? "win" : "ko", t: t + i * 200, scale: 1.4 });
      });
      win(W / 2 - 130, 156, 260, 76);
      const sealed = arr(run.sealed);
      const rows = [won ? ["Result", "Run cleared!"] : ["Reached", `Act ${run.act + 1}, ${run.pos === 84 ? "the boss" : `floor ${run.pos === 999 ? 1 : Math.floor(run.pos / 7) + 1}`}`], ["Battles won", run.wins], ["Beasts sealed", `${sealed.length} / 3`], ["Ryo", run.ryo]];
      rows.forEach(([k, v], i) => {
        text(k, W / 2 - 116, 164 + i * 13, { size: 8.5, color: "#a8b8ff" });
        text(String(v), W / 2 + 116, 164 + i * 13, { size: 8.5, align: "right" });
      });
      if (fresh.length) bigText(`Unlocked: ${fresh.join(", ")}!`, W / 2, 246, { size: 10, color: "#7dff9a", lw: 3 });
      if (performance.now() - t0 > 1200) hints([["x", "Title"]]);
      void COLORS;
    },
  };
});
