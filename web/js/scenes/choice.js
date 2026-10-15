// Map events and hot springs: a scene, a few lines of text, pick one option.
// The rules (Bend `Choose{idx}`) decide what happens; this only shows it.
import { ctx, W, H, input, hash2, ui } from "../core.js";
import { SlotPicker } from "../picker.js";
import { win, text, bigText, hints, COLORS, menuList, wrap, fill } from "../gfx.js";
import * as audio from "../audio.js";
import { game, registerScene, route, scene } from "../main.js";
import { arr, G, C } from "../bend.js";
import { fighterArt, shadow } from "../art.js";
import { backdrop, backdropKind } from "../world.js";

const REST = {
  title: "Hot Spring",
  text: "Steam rises from a hidden spring in the rocks. There is time for one thing before moving on.",
  choices: ["Soak (heal 40% HP and chakra)", "Train (+2 levels on one jutsu)", "Meditate (a Will of Fire and an Affinity pick)"],
};

// Who greets you at each event (a sprite key, or null for a prop).
const EVENT_GUEST = [null, null, null, null, null, null, null, "mizuki", null, null,
  null, "orochimaru", "white zetsu", null, null, "gato's ronin", "beast9", null, null, null, null, null, null, null];

function makeChoiceScene(kind) {
  return () => {
    let run = game.run;
    let cur = 0;
    let done = null; // result text once chosen
    let t0 = 0;
    let picker = null;
    const id = kind === "event" ? run.mode.id : -1;
    const info = kind === "event"
      ? { title: G.event_title(id), text: G.event_text(id), choices: arr(G.event_choices(id)) }
      : REST;
    const bg = backdrop(kind === "rest" ? "springs" : backdropKind(run));
    const steam = Array.from({ length: kind === "rest" ? 22 : 0 }, (_, i) => ({ x: 180 + hash2(i, 1) * 200, y: 150 + hash2(i, 2) * 40, p: hash2(i, 3) }));

    return {
      info: () => ({ state: done ? "result" : "choose", title: info.title }),
      enter() { audio.play(kind === "rest" ? "village" : "map"); },
      update(dt) {
        t0 += dt;
        for (const s of steam) { s.p += dt / 2600; if (s.p > 1) s.p -= 1; }
        if (done) {
          if (input.pressed("ok") || input.pressed("back")) { audio.sfx("ok"); route(); }
          return;
        }
        if (picker) { picker.update(); return; }
        const n = info.choices.length;
        const mm = ui.menu("choice", cur);
        cur = mm.cur;
        if (input.pressed("up")) { cur = (cur + n - 1) % n; audio.sfx("cursor"); }
        if (input.pressed("down")) { cur = (cur + 1) % n; audio.sfx("cursor"); }
        if (input.pressed("menu")) { audio.sfx("ok"); game.go(scene("menu"), "none"); }
        if ((input.pressed("ok") || mm.ok) && kind === "rest" && cur === 1) {
          picker = new SlotPicker(run, {
            title: "Hot spring training: +2 levels on one jutsu",
            train: 2,
            onPick: (who, slot) => { picker = null; run = game.act(C("RestTrain", { who, slot })); done = run.msg; },
            onCancel: () => { picker = null; },
          });
          return;
        }
        if (input.pressed("ok") || mm.ok) {
          run = game.act(C("Choose", { idx: cur }));
          const m = run.mode.$;
          if (m === "InBattle") { audio.sfx("encounter"); route("battle"); return; }
          if (m !== "OnMap") { audio.sfx("ok"); route(); return; }
          audio.sfx(/HP|curse|lost|Lost|explosive/.test(run.msg) ? "buzz" : kind === "rest" && cur === 0 ? "heal" : "coin");
          done = run.msg;
        }
      },
      draw(t) {
        ctx.drawImage(bg.canvas, 0, 0);
        if (picker) { ctx.fillStyle = "rgba(0,0,20,0.65)"; ctx.fillRect(0, 0, W, H); picker.draw(t); return; }
        if (done) ui.anywhere();
        fill("#000010", 0.35);
        if (kind === "rest") drawSpring(t, steam);
        // the squad on the left, a guest on the right
        arr(run.party).forEach((m, i) => {
          const x = 70 + i * 30, y = 168 + (i % 2) * 6;
          shadow(x, y, 9);
          fighterArt(G.body_key(C("Ninja", { who: m.who }))).draw(x, y, { t: t + i * 230, face: "right" });
        });
        const guest = kind === "event" ? EVENT_GUEST[id] : null;
        if (guest) {
          const big = guest.startsWith("beast");
          ctx.save();
          if (big) { ctx.globalAlpha = 0.45 + 0.15 * Math.sin(t / 500); ctx.filter = "brightness(0.6) saturate(1.6)"; }
          shadow(380, 172, big ? 30 : 10);
          fighterArt(guest).draw(big ? 400 : 380, big ? 190 : 172, { t, face: "left", scale: big ? 0.9 : 1 });
          ctx.restore();
        }
        else if (kind === "event") bigText("?", 380, 140 + Math.sin(t / 400) * 3, { size: 34, color: "#ffe9a8" });

        win(8, 6, W - 16, 22);
        text(info.title, 18, 12, { size: 9.5, color: COLORS.hi });
        text(`${run.ryo} ryo`, W - 18, 12, { size: 9, align: "right", color: "#ffe070" });
        win(8, 32, W - 16, 38);
        wrap(info.text, W - 40, 8).slice(0, 3).forEach((l, i) => text(l, 18, 38 + i * 10, { size: 8 }));

        if (done) {
          win(40, 196, W - 80, 52);
          wrap(done, W - 110, 8.5).slice(0, 3).forEach((l, i) => text(l, W / 2, 204 + i * 12, { size: 8.5, align: "center" }));
          hints([["x", "Continue"]]);
        } else {
          const n = info.choices.length;
          win(8, H - 18 - n * 14 - 12, W - 16, n * 14 + 14);
          menuList(info.choices, 26, H - 18 - n * 14 - 5, cur, { lh: 14, size: 8.5, id: "choice", hitW: W - 40 });
          hints([["x", "Choose"], ["t", "Menu"]]);
        }
      },
    };
  };
}

function drawSpring(t, steam) {
  ctx.save();
  const g = ctx.createRadialGradient(280, 186, 10, 280, 186, 120);
  g.addColorStop(0, "rgba(120,200,230,0.95)");
  g.addColorStop(1, "rgba(60,120,170,0.9)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(280, 186, 120, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5a5048";
  ctx.lineWidth = 4;
  ctx.stroke();
  for (const s of steam) {
    ctx.fillStyle = `rgba(255,255,255,${0.14 * Math.sin(s.p * Math.PI)})`;
    ctx.beginPath();
    ctx.arc(s.x + Math.sin(t / 700 + s.y) * 6, s.y - s.p * 50, 3 + s.p * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

registerScene("event", makeChoiceScene("event"));
registerScene("rest", makeChoiceScene("rest"));
