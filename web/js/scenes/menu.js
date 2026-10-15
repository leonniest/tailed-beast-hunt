// The Triangle menu: party panels, Status, Jutsu training, Tools, Relics.
import { ctx, W, H, input, ui } from "../core.js";
import { kitView } from "../picker.js";
import { noteQuit } from "../runlog.js";
import { win, text, hand, hints, bar, COLORS, NATURE_COLORS, NATURE_NAMES, diamond, wrap } from "../gfx.js";
import * as audio from "../audio.js";
import { game, registerScene, route, scene } from "../main.js";
import { arr, G, C, memberView, toolCounts, toolInfo, moveInfo, rankTitle } from "../bend.js";
import { fighterArt } from "../art.js";

const CMDS = ["Status", "Jutsu", "Forms", "Collection", "Will & Affinity", "Tools", "Relics", "Bestiary", "Return", "Quit to Title"];
const PAGES = { Forms: "forms", Collection: "armory", "Will & Affinity": "will" };

registerScene("menu", () => {
  let run = game.run;
  let state = "cmd"; // cmd | who | status | jutsu | tools | relics
  let cur = 0, who = 0, jcur = 0, list = 0;
  let note = "";
  const n = () => arr(run.party).length;

  return {
    enter() { run = game.run; },
    update() {
      // mouse: hovering a ninja panel or a list row moves the cursor
      const hp = ui.hoverIndex("who");
      if (hp >= 0 && state !== "cmd") who = hp;
      if (state === "cmd") {
        const m = ui.menu("cmd", cur);
        cur = m.cur;
        if (hp >= 0 && ui.clicked(`who:${hp}`)) { who = hp; cur = 0; state = "status"; audio.sfx("ok"); return; }
        if (input.pressed("up")) { cur = (cur + CMDS.length - 1) % CMDS.length; audio.sfx("cursor"); }
        if (input.pressed("down")) { cur = (cur + 1) % CMDS.length; audio.sfx("cursor"); }
        if (input.pressed("back") || input.pressed("menu")) { audio.sfx("back"); route("none"); }
        if (input.pressed("ok") || m.ok) {
          audio.sfx("ok");
          const c = CMDS[cur];
          if (c === "Bestiary") game.go(scene("bestiary", "menu"), "none");
          if (c === "Status" || c === "Jutsu") { state = "who"; who = 0; }
          if (PAGES[c]) game.go(scene("collection", PAGES[c]), "none");
          if (c === "Tools") { state = "tools"; list = 0; }
          if (c === "Relics") { state = "relics"; list = 0; }
          if (c === "Return") route("none");
          if (c === "Quit to Title") { game.save(); noteQuit(); game.go(scene("title")); }
        }
        return;
      }
      if (state === "who") {
        if (input.pressed("up")) { who = (who + n() - 1) % n(); audio.sfx("cursor"); }
        if (input.pressed("down")) { who = (who + 1) % n(); audio.sfx("cursor"); }
        if (input.pressed("back")) { state = "cmd"; audio.sfx("back"); }
        if (input.pressed("ok") || (hp >= 0 && ui.clicked(`who:${hp}`))) { audio.sfx("ok"); state = CMDS[cur] === "Status" ? "status" : "jutsu"; jcur = 0; note = ""; }
        return;
      }
      if (state === "jutsu") {
        if (input.pressed("up")) { jcur = (jcur + 3) % 4; audio.sfx("cursor"); }
        if (input.pressed("down")) { jcur = (jcur + 1) % 4; audio.sfx("cursor"); }
        if (input.pressed("left") || input.pressed("l")) { who = (who + n() - 1) % n(); audio.sfx("cursor"); }
        if (input.pressed("right") || input.pressed("r")) { who = (who + 1) % n(); audio.sfx("cursor"); }
        jcur = ui.menu("jut", jcur).cur;
        if (input.pressed("back") || input.pressed("ok")) { state = "who"; audio.sfx("back"); }
        return;
      }
      if (state === "status") {
        if (input.pressed("left") || input.pressed("up")) { who = (who + n() - 1) % n(); audio.sfx("cursor"); }
        if (input.pressed("right") || input.pressed("down")) { who = (who + 1) % n(); audio.sfx("cursor"); }
        if (input.pressed("back") || input.pressed("ok")) { state = "who"; audio.sfx("back"); }
        return;
      }
      const len = state === "tools" ? toolCounts(run).size : arr(run.arts).length;
      list = Math.min(ui.menu("row", list).cur, Math.max(0, len - 1));
      if (len) {
        if (input.pressed("up")) { list = (list + len - 1) % len; audio.sfx("cursor"); }
        if (input.pressed("down")) { list = (list + 1) % len; audio.sfx("cursor"); }
      }
      if (input.pressed("back") || input.pressed("ok")) { state = "cmd"; audio.sfx("back"); }
    },
    draw(t) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#141a3a");
      g.addColorStop(1, "#06081a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // party panels
      win(6, 6, 340, 206);
      for (let i = 0; i < n(); i++) {
        const v = memberView(run, i);
        const y = 14 + i * 66;
        ui.hit(`who:${i}`, 10, y - 4, 332, 64);
        fighterArt(G.body_key(C("Ninja", { who: v.m.who }))).draw(36, y + 50, { t: t + i * 300, pose: i === who && state !== "cmd" ? "ready" : "idle", scale: 1.25 });
        text(v.name, 66, y + 4, { size: 10, color: COLORS.hi });
        text(`${rankTitle(v.lvl)}   Lv ${v.lvl}`, 66, y + 18, { size: 8, color: "#c8d0ff" });
        text("HP", 172, y + 4, { size: 8, color: "#a8b8ff" });
        text(`${v.hp} / ${v.mhp}`, 300, y + 4, { size: 8.5, align: "right" });
        bar(172, y + 15, 128, 3, v.hp / v.mhp, "#7dff9a");
        text("CK", 172, y + 21, { size: 8, color: "#a8b8ff" });
        text(`${v.ck} / ${v.mck}`, 300, y + 21, { size: 8.5, align: "right", color: COLORS.ck });
        bar(172, y + 32, 128, 3, v.ck / v.mck, "#4ab8ff");
        text(`XP ${v.xp} / ${v.need}`, 66, y + 34, { size: 7.5, color: COLORS.dim });
        bar(66, y + 45, 90, 2, v.xp / v.need, "#ffd84a");
        if (state === "who" && i === who) hand(14, y + 30, t);
      }
      // commands
      win(352, 6, 122, 154, { dim: state !== "cmd" });
      CMDS.forEach((c, i) => { if (state === "cmd") ui.hit(`cmd:${i}`, 356, 10 + i * 13, 114, 13); text(c, 372, 12 + i * 13, { size: 8.5, color: state === "cmd" && ui.over(`cmd:${i}`) ? "#ffffff" : COLORS.text }); });
      if (state === "cmd") hand(370, 12 + cur * 13 + 5, t);
      // run info
      win(352, 164, 122, 48);
      text(`Act ${run.act + 1}`, 362, 169, { size: 8 });
      text(`${run.ryo} ryo`, 464, 169, { size: 8, align: "right", color: "#ffe070" });
      const sealed = arr(run.sealed);
      [3, 6, 9].forEach((k, i) => { diamond(368 + i * 22, 186, 4, sealed.includes(k) ? "#ffd84a" : "rgba(30,34,70,0.9)"); text(String(k), 375 + i * 22, 182, { size: 6.5, color: COLORS.dim }); });
      text(`Wins ${run.wins}   Log ${Math.min(run.bag.logp, 5)}/5`, 362, 196, { size: 7, color: COLORS.dim });
      // currencies (spent automatically on the best gear)
      win(6, 214, 468, 22);
      const w = run.bag.cash;
      text(`Whetstones ${w.whet}    Chakra Ore ${w.ore}    Seal Paper ${w.seal}    (spent automatically on your best gear)`, 16, 220, { size: 7.5, color: "#c8d0ff" });

      if (state === "jutsu") drawJutsu(run, who, jcur, note, t);
      if (state === "status") drawStatus(run, who);
      if (state === "tools") drawTools(run, list, t);
      if (state === "relics") drawRelics(run, list, t);
      const h = state === "jutsu" ? [["l", "Ninja"], ["o", "Back"]] : state === "cmd" ? [["x", "Select"], ["o", "Close"]] : [["o", "Back"]];
      hints(h);
    },
  };
});

function drawJutsu(run, who, cur, note, t) {
  const v = memberView(run, who);
  win(20, 40, 440, 170);
  text(`${v.name}'s jutsu`, 34, 48, { size: 10, color: COLORS.hi });
  text("Level up, hot springs and scrolls train them", 446, 48, { size: 7.5, align: "right", color: COLORS.dim });
  const kit = arr(G.member_kit(v.m));
  kitView(run, who).forEach((k, i) => {
    const mv = kit[i].move;
    const mi = moveInfo(mv);
    const y = 66 + i * 30;
    ui.hit(`jut:${i}`, 30, y - 3, 420, 28);
    const nat = k.nat;
    diamond(46, y + 5, 3.5, nat ? NATURE_COLORS[nat] : "#9098b8");
    text(k.locked ? `${k.name}  (unlocks at Lv ${k.need})` : k.name, 56, y, { size: 9, color: k.locked ? COLORS.dim : k.taught ? "#9affc0" : COLORS.text });
    text(`Lv ${k.lvl}${k.lvl >= 10 ? "  MAX" : ""}`, 446, y, { size: 8, align: "right", color: "#a8b8ff" });
    text(`${nat ? `${NATURE_NAMES[nat]} · ` : ""}${mi.hpcost ? `${mi.hpcost}% HP` : `${mi.cost} CK`} · CD ${G.move_cd(mv)} · power +${(k.lvl - 1) * 6}%${k.taught ? " · taught" : ""}`, 56, y + 11, { size: 7, color: "#7fd8ff" });
    wrap(mi.desc, 380, 7).slice(0, 1).forEach((d) => text(d, 56, y + 19, { size: 7, color: COLORS.dim }));
  });
  hand(42, 66 + cur * 30 + 5, t);
  void note;
}

function drawStatus(run, who) {
  const v = memberView(run, who);
  const w = v.m.who;
  win(20, 40, 440, 170);
  text(v.name, 34, 48, { size: 11, color: COLORS.hi });
  text(`${rankTitle(v.lvl)}  Lv ${v.lvl}`, 446, 50, { size: 9, align: "right", color: "#c8d0ff" });
  const s = v.stats;
  const rows = [["Max HP", s.hp], ["Max Chakra", s.ck], ["Taijutsu", s.atk], ["Ninjutsu", s.nin], ["Defense", s.dfn], ["Speed", s.spd]];
  rows.forEach(([k, val], i) => {
    const x = 34 + (i % 2) * 150, y = 70 + Math.floor(i / 2) * 15;
    text(k, x, y, { size: 8.5, color: "#a8b8ff" });
    text(String(val), x + 120, y, { size: 8.5, align: "right" });
  });
  text(`Passive: ${G.who_passive(w)}`, 34, 122, { size: 9, color: "#ffc070" });
  wrap(G.who_passive_desc(w), 400, 8).forEach((l, i) => text(l, 34, 136 + i * 11, { size: 8, color: "#dfe6ff" }));
  text("Speed sets how often a ninja acts. Jutsu levels add 6% power each.", 34, 180, { size: 7, color: COLORS.dim });
}

function drawTools(run, cur, t) {
  const counts = [...toolCounts(run).entries()];
  win(20, 40, 440, 170);
  text("Ninja tools", 34, 48, { size: 10, color: COLORS.hi });
  if (!counts.length) text("Your pouch is empty.", 34, 70, { size: 9, color: COLORS.dim });
  counts.forEach(([name, n], i) => {
    const y = 66 + i * 13;
    ui.hit(`row:${i}`, 40, y - 2, 170, 13);
    text(toolInfo(name).name, 50, y, { size: 9 });
    text(`x${n}`, 200, y, { size: 9, align: "right", color: "#a8b8ff" });
  });
  if (counts.length) {
    hand(48, 66 + cur * 13 + 5, t);
    wrap(toolInfo(counts[cur][0]).desc, 220, 8).forEach((l, i) => text(l, 220, 66 + i * 11, { size: 8, color: "#dfe6ff" }));
    text("Tools are used in battle.", 220, 196, { size: 7, color: COLORS.dim });
  }
}

function drawRelics(run, cur, t) {
  const arts = arr(run.arts);
  win(20, 40, 440, 170);
  text("Relics", 34, 48, { size: 10, color: COLORS.hi });
  if (!arts.length) text("No relics yet. Elites, treasure and tailed beasts drop them.", 34, 70, { size: 8.5, color: COLORS.dim });
  arts.forEach((a, i) => {
    const y = 66 + i * 12;
    ui.hit(`row:${i}`, 40, y - 2, 190, 12);
    text(G.art_name(a), 50, y, { size: 8.5 });
  });
  if (arts.length) {
    hand(48, 66 + cur * 12 + 5, t);
    wrap(G.art_desc(arts[cur]), 200, 8).forEach((l, i) => text(l, 250, 66 + i * 11, { size: 8, color: "#dfe6ff" }));
  }
}
