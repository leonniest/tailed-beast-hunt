// Bestiary: every enemy and tailed beast, with art, stats and signature moves.
// Enemies you have not met yet show as silhouettes (the demo shows all).
import { ctx, W, H, input, ui } from "../core.js";
import { win, text, bigText, hints, COLORS, wrap } from "../gfx.js";
import * as audio from "../audio.js";
import { game, registerScene, scene } from "../main.js";
import { arr, G, C, loadMeta, seenMoves } from "../bend.js";
import { fighterArt, shadow } from "../art.js";

const BLURB = {
  zori: "A rogue for hire. Never far from his partner Waraji.",
  waraji: "A ronin-ninja who ambushes travellers on the coast road.",
  oboro: "Mist genin. Hides in clone illusions and strikes from the rear.",
  mizuki: "A Leaf chunin turned traitor, with a giant fuma shuriken.",
  gozu: "One of the Demon Brothers. Chains coated in poison.",
  meizu: "The other Demon Brother. Never fights alone.",
  haku: "Zabuza's tool. Ice mirrors and senbon that seal chakra points.",
  zabuza: "The Demon of the Hidden Mist. Silent Killing in the fog.",
  dosu: "Sound genin. His gauntlet turns sound into a weapon.",
  zaku: "Sound genin with air tubes in his palms.",
  kin: "Sound kunoichi. Her bells weave genjutsu.",
  yoroi: "Kabuto's teammate. His touch drains chakra.",
  misumi: "Kabuto's teammate. Bends his body like rope to bind you.",
  "rain shinobi": "Amegakure soldiers. Rain of needles from their umbrellas.",
  kabuto: "Orochimaru's right hand. Medic, spy, and far stronger than he lets on.",
  orochimaru: "The Snake Sannin. Hunts for a new body, and for forbidden jutsu.",
  jirobo: "Sound Four. A mountain of a man who eats chakra.",
  kidomaru: "Sound Four. Six arms, golden spider-silk arrows.",
  tayuya: "Sound Four. Her flute summons Doki demons.",
  sakon: "Sound Four. Two brothers in one body.",
  kimimaro: "Last of the Kaguya. Bones sharper than any blade.",
  "root anbu": "Danzo's Root. No names, no emotions, ink beasts.",
  "white zetsu": "Spores of the Akatsuki. They drain chakra and multiply.",
  kisame: "Monster of the Hidden Mist. Samehada eats chakra.",
  deidara: "Akatsuki bomber. Art is an explosion!",
  itachi: "Akatsuki. Tsukuyomi and the black flames of Amaterasu.",
  hidan: "Akatsuki. Immortal priest of Jashin.",
  kakuzu: "Akatsuki. Five hearts, five elements.",
  sasori: "Akatsuki puppeteer. The Iron Sand of the Third Kazekage.",
  mubi: "Rain genin from the Chunin Exams. Drains chakra through his touch.",
  kagari: "Rain genin. Hides among his clones.",
  kamikiri: "Fuma clan. Giant shears and a short temper.",
  hanzaki: "Fuma clan. Throws windmill shuriken bigger than he is.",
  jigumo: "Fuma clan. Spins sticky webs to bind.",
  kagero: "Fuma kunoichi. Her bells hide a genjutsu.",
  raiga: "Raiga Kurosuki of the Seven Swordsmen. Twin lightning swords, and a funeral for every fight.",
  "aoi rokusho": "Leaf traitor turned Rain ninja. Wields the stolen Thunder God Sword.",
  shigure: "Rain genin with an umbrella full of needles.",
  kankuro: "Gaara's brother. His Crow puppet carries poison blades.",
  temari: "Gaara's sister. Her giant fan cuts with the wind.",
  baki: "Sand jonin. The Wind Blade cuts without a sound.",
  "fu yamanaka": "Root. Mind transfer turns your own body against you.",
  torune: "Root. Nano-sized insects poison at a touch.",
  guren: "Crystal Release. Orochimaru once considered her body.",
  kigiri: "Guren's team. Chains and brute force.",
  nurari: "Guren's team. Bends his body like water.",
  kiseru: "Guren's team. Smoke and explosions.",
  rinji: "Guren's team. Draws power from his allies.",
  "ameyuri ringo": "Seven Swordsmen. The Kiba blades crackle with lightning.",
  jinpachi: "Seven Swordsmen. The Shibuki sword explodes on impact.",
  kushimaru: "Seven Swordsmen. Stitches foes with the Needle Wire.",
  "kiri chunin": "A Mist chunin. Fights hidden in the fog.",
  "waterfall ninja": "Hidden Waterfall ninja. Water prisons from the rapids.",
  "sound chunin": "A veteran of the Hidden Sound.",
  "rain chunin": "Amegakure veteran. Needles from the rain.",
  arashi: "Fuma clan leader. Mind and body twisted by Orochimaru.",
  "gato's ronin": "Hired swords of the shipping tycoon Gato.",
  "kiri hunter-nin": "Mist hunter-nin. Senbon and illusions.",
  "sound genin": "The rank and file of the Hidden Sound.",
  "grass ninja": "A Grass ninja from the exams. Or is it someone else?",
  "fuguki suikazan": "Seven Swordsmen. Samehada's previous master.",
  "mangetsu hozuki": "Seven Swordsmen. Mastered every blade the Mist ever forged.",
  beast3: "Isobu, the Three-Tails. A giant coral turtle from the Land of Waves.",
  beast6: "Saiken, the Six-Tails. A slug that oozes corrosive alkali.",
  beast9: "Kurama, the Nine-Tails. The strongest of all the tailed beasts.",
};
// Dev contact sheet: ?scene=bestiary&grid=1 (enemies: 1-4, forms: 5-6).
const GRID = Number(new URLSearchParams(location.search).get("grid") ?? 0);
function drawGrid(list, t) {
  ctx.fillStyle = "#3a4058";
  ctx.fillRect(0, 0, W, H);
  const forms = ["naruto", "sasuke", "sakura", "kakashi", "rock lee", "hinata", "shikamaru", "gaara"].flatMap((w) => [w, `${w}@1`, `${w}@2`, `${w}@3`]).map((key) => ({ key }));
  const page = GRID >= 5 ? forms.slice((GRID - 5) * 16, (GRID - 4) * 16) : list.slice((GRID - 1) * 16, GRID * 16);
  page.forEach((e, i) => {
    const x = 30 + (i % 8) * 58, y = 120 + Math.floor(i / 8) * 130;
    fighterArt(e.key).draw(x, y, { t, face: "right", scale: e.boss ? 0.5 : 1.6 });
    text(e.key, x, y + 4, { size: 7, align: "center" });
  });
}
const ACT_OF = (i) => (i < 21 ? 1 : i < 42 ? 2 : 3); // all_foes: 15+6, 14+7, 14+6

function entries() {
  const foes = arr(G.all_foes()).map((f, i) => {
    const info = G.foe_info(f);
    const key = G.body_key(C("Enemy", { foe: f }));
    return { key, name: info.name, info, act: ACT_OF(i), moves: arr(info.moves).slice(1).map((m) => G.move_info(m).name) };
  });
  const beasts = [3, 6, 9].map((t, i) => {
    const info = G.foe_info(C("Beast", { t }));
    return { key: `beast${t}`, name: G.beast_title(t), info, act: i + 1, boss: true, moves: arr(info.moves).slice(1).map((m) => G.move_info(m).name) };
  });
  return [...foes, ...beasts];
}

registerScene("bestiary", (back = "title") => {
  const list = entries();
  const meta = loadMeta();
  const seen = (e) => game.demo || (meta.seen ?? []).includes(e.key);
  let cur = 0, top = 0, poseT = 0, pose = 0;
  const POSES = ["idle", "attack", "cast", "hurt", "win"];
  const ROWS = 15;

  return {
    info: () => ({ cur, key: list[cur].key }),
    enter() { audio.play("village"); },
    update(dt) {
      poseT += dt;
      const n = list.length;
      const h = ui.hoverIndex("best");
      if (h >= 0 && h + top !== cur) { cur = h + top; poseT = 0; pose = 0; }
      const mv = input.pressed("up") ? -1 : input.pressed("down") ? 1 : input.pressed("l") ? -ROWS : input.pressed("r") ? ROWS : 0;
      if (mv) { cur = Math.max(0, Math.min(n - 1, cur + mv)); poseT = 0; pose = 0; audio.sfx("cursor"); }
      if (input.pressed("ok")) { pose = (pose + 1) % POSES.length; poseT = 0; audio.sfx("cursor"); }
      if (input.pressed("back") || input.pressed("menu")) { audio.sfx("back"); game.go(scene(back)); }
      if (cur < top) top = cur;
      if (cur >= top + ROWS) top = cur - ROWS + 1;
    },
    draw(t) {
      if (GRID) { drawGrid(list, t); return; }
      const gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "#141a3a");
      gr.addColorStop(1, "#2a1a30");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
      const known = list.filter(seen).length;
      win(6, 6, 150, H - 24);
      text("BESTIARY", 16, 11, { size: 9, color: COLORS.hi });
      text(`${known}/${list.length}`, 146, 11, { size: 7.5, align: "right", color: COLORS.dim });
      for (let r = 0; r < ROWS && top + r < list.length; r++) {
        const e = list[top + r];
        const y = 26 + r * 14;
        const on = top + r === cur;
        ui.hit(`best:${r}`, 10, y - 2, 142, 13);
        if (on) { ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(10, y - 2, 142, 13); }
        text(seen(e) ? e.name : "? ? ?", 18, y, { size: 8, color: e.boss ? "#ff9a7a" : seen(e) ? COLORS.text : COLORS.dim });
        text(`A${e.act}`, 146, y, { size: 6.5, align: "right", color: COLORS.dim });
      }
      const e = list[cur];
      const ok = seen(e);
      // the stage
      win(160, 6, W - 166, 150);
      const art = fighterArt(e.key);
      const cx = 240, cy = e.boss ? 142 : 128;
      shadow(cx, cy, e.boss ? 30 : 12);
      if (ok) art.draw(cx, cy, { t: poseT, pose: POSES[pose], poseStart: 0, face: "right", scale: e.boss ? 1.05 : 2 });
      else {
        ctx.save();
        ctx.filter = "brightness(0)";
        art.draw(cx, cy, { t, face: "right", scale: e.boss ? 1.05 : 2, alpha: 0.8 });
        ctx.restore();
        bigText("?", cx, cy - 40, { size: 30, color: "#8890c0" });
      }
      // stats
      const x0 = 330;
      bigText(ok ? e.name : "? ? ?", x0 + 68, 20, { size: 11, color: e.boss ? "#ff9a7a" : COLORS.hi, lw: 3 });
      if (ok) {
        const s = e.info;
        const rows = [["HP", s.hp], ["ATK", s.atk], ["NIN", s.nin], ["DEF", s.dfn], ["SPD", s.spd]];
        rows.forEach(([k, v], i) => {
          text(k, x0 + 4, 36 + i * 12, { size: 7.5, color: "#a8b8ff" });
          text(String(v), x0 + 60, 36 + i * 12, { size: 7.5, align: "right" });
        });
        text("Lv 1 base", x0 + 4, 98, { size: 6.5, color: COLORS.dim });
        const known = game.demo ? e.moves : seenMoves(e.key);
        e.moves.slice(0, 3).forEach((m, i) => text(known.includes(m) ? `◆ ${m}` : "◆ ???", x0 + 70, 36 + i * 12, { size: 7, color: known.includes(m) ? "#ffd8a0" : COLORS.dim }));
        text(`Act ${e.act}${e.boss ? " boss" : ""}`, x0 + 70, 98, { size: 6.5, color: COLORS.dim });
      }
      win(160, 160, W - 166, H - 178);
      const blurb = ok ? BLURB[e.key] ?? "" : "Not met yet. Find it on the map.";
      wrap(blurb, W - 190, 8).slice(0, 4).forEach((l, i) => text(l, 172, 168 + i * 11, { size: 8 }));
      if (ok) text(`Pose: ${POSES[pose]}`, W - 16, H - 30, { size: 6.5, align: "right", color: COLORS.dim });
      hints([["x", "Pose"], ["o", "Back"]]);
    },
  };
});
