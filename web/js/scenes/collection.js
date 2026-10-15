// Collection screens, opened from the Triangle menu:
//   armory | contracts | gear | will | forms
import { ctx, W, H, input, ui } from "../core.js";
import { win, text, bigText, hand, hints, bar, COLORS, diamond, wrap } from "../gfx.js";
import * as audio from "../audio.js";
import { game, registerScene, scene } from "../main.js";
import { arr, G, C, cash, weapons, contracts, kit, RARITY_COLORS, GRADE_COLORS, formStatus, memberView } from "../bend.js";
import { fighterArt, drawSummon } from "../art.js";
import { bonusText } from "./awaken.js";

const TITLES = { armory: "ARMORY", contracts: "SUMMONING CONTRACTS", gear: "SQUAD GEAR", will: "WILL OF FIRE & CHAKRA AFFINITY", forms: "FORMS" };
const RANKS = ["Genin", "Chunin", "Jonin", "Kage"];
const WILL = [["ATK", (l) => `+${3 * l} ATK`], ["HP", (l) => `+${2 * l}% Max HP`], ["DEF", (l) => `+${l} DEF`], ["Damage", (l) => `+${l}% Damage`]];

/** Everything a Bonus gives, as short text (only non-zero parts). */
export function bonusLines(b) {
  const p = [];
  if (b.atkf) p.push(`ATK +${b.atkf}`);
  if (b.atkp) p.push(`ATK +${b.atkp}%`);
  if (b.dmgp) p.push(`Damage +${b.dmgp}%`);
  if (b.bossp) p.push(`Boss +${b.bossp}%`);
  if (b.normp) p.push(`Normal +${b.normp}%`);
  if (b.taip) p.push(`Taijutsu +${b.taip}%`);
  if (b.ninp) p.push(`Ninjutsu +${b.ninp}%`);
  if (b.fd !== 1000) p.push(`Final DMG +${((b.fd - 1000) / 10).toFixed(1).replace(/\.0$/, "")}%`);
  if (b.cr) p.push(`Crit +${b.cr}%`);
  if (b.cdmg) p.push(`Crit DMG +${b.cdmg}%`);
  if (b.pen !== 1000) p.push(`Def Pen ${((1000 - b.pen) / 10).toFixed(1).replace(/\.0$/, "")}%`);
  if (b.haste) p.push(`Haste +${b.haste}%`);
  if (b.hpp) p.push(`Max HP +${b.hpp}%`);
  if (b.dfnf) p.push(`DEF +${b.dfnf}`);
  if (b.cdr) p.push(`Cooldown -${b.cdr}`);
  if (b.hpr) p.push(`HP regen ${b.hpr}%/turn`);
  if (b.regen) p.push(`Chakra +${b.regen}/turn`);
  if (b.jlv) p.push(`All jutsu +${b.jlv} Lv`);
  if (b.ckf) p.push(`Chakra +${b.ckf}`);
  return p;
}

// Read-only views: the collection manages itself (see auto_kit in the rules).
const TABS = ["armory", "contracts", "gear", "will", "forms"];
registerScene("collection", (page = "armory") => {
  let run = game.run;
  let gx = 0, gy = 0;     // grid / list cursor
  let focus = "grid";     // grid | actions
  let acur = 0;
  let who = 0;            // forms: which ninja
  let note = "";

  const party = () => arr(run.party);
  function act(inp, ok, fail) {
    const before = JSON.stringify(run.bag) + JSON.stringify(run.party);
    run = game.act(inp);
    const changed = before !== JSON.stringify(run.bag) + JSON.stringify(run.party);
    if (changed) { audio.sfx(ok ?? "ok"); note = run.msg && /Infusion|inscription|Fused|seal/i.test(run.msg) ? run.msg : note; }
    else { audio.sfx("buzz"); note = fail ?? "Can't do that right now."; }
    return changed;
  }

  // --- per-page actions -------------------------------------------------
  const pages = {
    armory: {
      rows: 7, cols: 4,
      actions() {
        const g = gy * 4 + gx;
        const o = weapons(run)[g];
        const list = party().map((m, i) => ({ label: `Equip on ${G.who_name(m.who)}`, run: () => act(C("Equip", { who: i, grade: g }), "ok", "You don't own this weapon."), disabled: !o.copies }));
        list.push({ label: `Enhance  (${G.weapon_cost(g, o.lvl)} whetstones)`, run: () => act(C("Enhance", { grade: g }), "levelup", o.lvl >= G.weapon_cap(o.awk) ? "At the level cap: awaken it." : "Not enough whetstones."), disabled: !o.copies });
        list.push({ label: "Awaken  (uses a duplicate)", run: () => act(C("Awaken", { grade: g }), "combo", "Needs a duplicate, and at most 5 stages."), disabled: o.copies < 2 });
        list.push({ label: "Fuse 5 duplicates", run: () => act(C("Fuse", { grade: g }), "combo", "Needs 6 copies."), disabled: o.copies < 6 || g >= 27 });
        return list;
      },
    },
    contracts: {
      rows: 7, cols: 4,
      actions() {
        const code = gy * 4 + gx + 1;
        const own = contracts(run)[code - 1].copies > 0;
        return ["Main (fights every 4th round)", "Sub 1", "Sub 2"].map((l, s) => ({ label: `Set as ${l}`, run: () => act(C("SetSummon", { slot: s, code }), "ok", "You don't own this contract."), disabled: !own }));
      },
    },
    gear: {
      rows: 6, cols: 1,
      actions() {
        const k = kit(run)[gy];
        const empty = k.rar === 99;
        return [
          { label: `Chakra Infusion  (${G.infuse_cost(k)} ore, ${(G.infuse_odds(k.stars) / 10).toFixed(1)}%)`, run: () => act(C("Infuse", { slot: gy }), "levelup", empty ? "No gear in this slot yet." : k.stars >= 15 ? "Already at 15 stars." : "Not enough Chakra Ore."), disabled: empty || k.stars >= 15 },
          { label: `Inscribe  (${1 + k.grade} seal paper)`, run: () => act(C("Inscribe", { slot: gy }), "combo", k.stars < 3 ? "Inscriptions unlock at 3 stars." : "Not enough Seal Paper."), disabled: empty || k.stars < 3 },
        ];
      },
    },
    will: {
      rows: 7, cols: 1,
      actions: null, // direct
    },
    forms: { rows: 1, cols: 1, actions: null },
  };
  const P = pages[page];

  return {
    info: () => ({ state: `${page}:${focus}` }),
    enter() { run = game.run; },
    update() {
      if (focus === "grid") {
        if (page === "forms") {
          if (input.pressed("left") || input.pressed("l")) { who = (who + party().length - 1) % party().length; audio.sfx("cursor"); }
          if (input.pressed("right") || input.pressed("r")) { who = (who + 1) % party().length; audio.sfx("cursor"); }
        } else {
          if (input.pressed("up")) { gy = (gy + P.rows - 1) % P.rows; audio.sfx("cursor"); }
          if (input.pressed("down")) { gy = (gy + 1) % P.rows; audio.sfx("cursor"); }
          if (P.cols > 1 && input.pressed("left")) { gx = (gx + P.cols - 1) % P.cols; audio.sfx("cursor"); }
          if (P.cols > 1 && input.pressed("right")) { gx = (gx + 1) % P.cols; audio.sfx("cursor"); }
        }
        const cell = ui.hoverIndex("cell");
        if (cell >= 0) { gy = Math.floor(cell / 8); gx = cell % 8; }
        const tab = ui.hoverIndex("tab");
        const go = (p) => { audio.sfx("cursor"); game.go(scene("collection", p), "none"); };
        if (tab >= 0 && ui.clicked(`tab:${tab}`) && TABS[tab] !== page) go(TABS[tab]);
        if (page !== "forms" && input.pressed("l")) go(TABS[(TABS.indexOf(page) + TABS.length - 1) % TABS.length]);
        if (page !== "forms" && input.pressed("r")) go(TABS[(TABS.indexOf(page) + 1) % TABS.length]);
        if (input.pressed("back") || input.pressed("ok")) { audio.sfx("back"); game.go(scene("menu"), "none"); }
      } else {
        const list = P.actions();
        if (input.pressed("up")) { acur = (acur + list.length - 1) % list.length; audio.sfx("cursor"); }
        if (input.pressed("down")) { acur = (acur + 1) % list.length; audio.sfx("cursor"); }
        if (input.pressed("ok")) { const a = list[acur]; if (a.disabled) { audio.sfx("buzz"); note = "Not available."; } else a.run(); }
        if (input.pressed("back")) { focus = "grid"; audio.sfx("back"); }
      }
    },
    draw(t) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#141a3a");
      g.addColorStop(1, "#06081a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      win(6, 4, W - 12, 20);
      text(TITLES[page], 16, 9, { size: 9, color: COLORS.hi });
      ["Armory", "Contracts", "Gear", "Will", "Forms"].forEach((lb, i) => {
        const x = 236 + i * 46, on = TABS[i] === page;
        ui.hit(`tab:${i}`, x - 2, 5, 44, 18);
        text(lb, x + 20, 9, { size: 7.5, align: "center", color: on ? COLORS.hi : ui.over(`tab:${i}`) ? "#ffffff" : COLORS.dim });
      });
      ({ armory: drawArmory, contracts: drawContracts, gear: drawGear, will: drawWill, forms: drawForms })[page]();
      // squad-wide bonus footer
      win(6, 236, W - 12, 18);
      text(`Squad: ${bonusLines(G.run_bonus(run)).slice(0, 7).join("  ") || "no bonuses yet"}`, 14, 240, { size: 6.8, color: "#c8d0ff" });
      if (note) text(note, W - 14, 226, { size: 7.5, align: "right", color: COLORS.hi });
      const h = page === "forms" ? [["l", "Ninja"], ["o", "Back"]] : [["l", "Page"], ["r", "Page"], ["o", "Back"]];
      if (page !== "forms") text("Managed automatically: the best gear is equipped and upgraded as you collect it.", 14, 226, { size: 7, color: COLORS.dim });
      hints(h, W - 8, H - 7);

      function actionsWin(x, y, wdt) {
        return; // read-only: the collection manages itself
        if (!P.actions) return;
        const list = P.actions();
        win(x, y, wdt, 8 + list.length * 12, { dim: focus !== "actions" });
        list.forEach((a, i) => text(a.label, x + 16, y + 5 + i * 12, { size: 7.5, color: a.disabled ? COLORS.dim : COLORS.text }));
        if (focus === "actions") hand(x + 13, y + 10 + acur * 12, t);
      }

      function drawArmory() {
        const ws = weapons(run);
        win(6, 28, 156, 194);
        for (let r = 0; r < 7; r++) {
          text(G.rarity_name(r), 14, 38 + r * 26, { size: 6.5, color: RARITY_COLORS[r] });
          for (let c = 0; c < 4; c++) {
            const gi = r * 4 + c, o = ws[gi];
            const x = 60 + c * 24, y = 34 + r * 26;
            ui.hit(`cell:${r * 8 + c}`, x, y, 20, 18);
            ctx.fillStyle = o.copies ? RARITY_COLORS[r] : "rgba(20,24,50,0.9)";
            ctx.globalAlpha = o.copies ? 0.9 : 1;
            ctx.fillRect(x, y, 20, 18);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = gx === c && gy === r ? "#ffffff" : "#000";
            ctx.lineWidth = gx === c && gy === r ? 1.5 : 0.6;
            ctx.strokeRect(x, y, 20, 18);
            text(G.tier_name(c), x + 10, y + 2, { size: 6, align: "center", color: o.copies ? "#101018" : COLORS.dim, shadow: false });
            if (o.copies) text(`x${o.copies}`, x + 10, y + 10, { size: 6, align: "center", color: "#101018", shadow: false, weight: 800 });
            const eq = party().filter((m) => m.weapon === gi + 1);
            eq.forEach((m, k) => diamond(x + 3 + k * 5, y + 17, 2, "#ffffff"));
          }
        }
        if (focus === "grid") hand(58 + gx * 24, 43 + gy * 26, t);
        const gi = gy * 4 + gx, o = ws[gi];
        win(168, 28, 306, 110);
        text(G.weapon_name(gi), 180, 36, { size: 10, color: RARITY_COLORS[gy] });
        text(`${G.rarity_name(gy)} grade`, 462, 38, { size: 7.5, align: "right", color: COLORS.dim });
        const lines = [
          `Equipped: ATK +${G.weapon_atk(gi, o.lvl)}%`,
          `Owned effect: squad ATK +${Math.floor(G.weapon_atk(gi, o.lvl) / 4)}%${o.copies ? "" : "  (not owned)"}`,
          `Level ${o.lvl} / ${G.weapon_cap(o.awk)}    Awakening ${o.awk} / 5    Copies ${o.copies}`,
          G.weapon_perk_text(gy) || "No perk below Jonin grade.",
          `Wielded by: ${party().filter((m) => m.weapon === gi + 1).map((m) => G.who_name(m.who)).join(", ") || "nobody"}`,
        ];
        lines.forEach((l, i) => text(l, 180, 52 + i * 14, { size: 8, color: i === 3 ? "#ffc070" : COLORS.text }));
        actionsWin(168, 142, 306);
      }

      function drawContracts() {
        const cs = contracts(run);
        win(6, 28, 156, 194);
        for (let s = 0; s < 7; s++) {
          text(G.species_name(s), 14, 38 + s * 26, { size: 6.5, color: "#dfe6ff" });
          for (let r = 0; r < 4; r++) {
            const i = s * 4 + r, o = cs[i];
            const x = 60 + r * 24, y = 34 + s * 26;
            ui.hit(`cell:${s * 8 + r}`, x, y, 20, 18);
            ctx.fillStyle = o.copies ? RARITY_COLORS[r + 1] : "rgba(20,24,50,0.9)";
            ctx.fillRect(x, y, 20, 18);
            ctx.strokeStyle = gx === r && gy === s ? "#ffffff" : "#000";
            ctx.lineWidth = gx === r && gy === s ? 1.5 : 0.6;
            ctx.strokeRect(x, y, 20, 18);
            text(RANKS[r][0], x + 10, y + 2, { size: 6, align: "center", color: o.copies ? "#101018" : COLORS.dim, shadow: false });
            if (o.copies) text(`Lv${Math.min(o.copies, 5)}`, x + 10, y + 10, { size: 5.5, align: "center", color: "#101018", shadow: false, weight: 800 });
            const code = i + 1;
            if (run.bag.smain === code) diamond(x + 3, y + 17, 2.2, "#ffd84a");
            if (run.bag.ssub1 === code || run.bag.ssub2 === code) diamond(x + 8, y + 17, 2, "#ffffff");
          }
        }
        if (focus === "grid") hand(58 + gx * 24, 43 + gy * 26, t);
        const i = gy * 4 + gx, o = cs[i], code = i + 1;
        win(168, 28, 306, 110);
        drawSummon(gy, 432, 104, { scale: 0.7, t, face: "left" });
        text(G.summon_name(code), 180, 36, { size: 10, color: RARITY_COLORS[gx + 1] });
        const eq = bonusLines(G.smn_equip(code, run.bag.smns)).join(", ");
        const lines = [
          `${G.species_name(gy)}, ${RANKS[gx]} rank   Level ${Math.min(o.copies, 5)}   Copies ${o.copies}`,
          `Equipped: ${o.copies ? eq : G.species_effect(gy)}`,
          `As main: ${G.species_action(gy)}`,
          `Owned effect: ${gx < 2 ? `ATK +${2 * (gx + 1)}` : `Damage +${3 * (gx - 1)}%, Max HP +${4 * (gx - 1)}%`}`,
          `Main: ${G.summon_name(run.bag.smain)}   Subs: ${G.summon_name(run.bag.ssub1)}, ${G.summon_name(run.bag.ssub2)}`,
        ];
        lines.forEach((l, k) => text(l, 180, 52 + k * 14, { size: 7.5, color: k === 4 ? "#ffd84a" : COLORS.text }));
        actionsWin(168, 142, 306);
      }

      function drawGear() {
        const ks = kit(run);
        win(6, 28, 156, 194);
        ks.forEach((k, s) => {
          const y = 36 + s * 30;
          ui.hit(`cell:${s * 8}`, 10, y - 4, 148, 28);
          text(G.slot_name(s), 22, y, { size: 8.5, color: s === gy ? COLORS.hi : COLORS.text });
          text(k.rar === 99 ? "empty" : G.rarity_name(k.rar), 22, y + 11, { size: 7, color: k.rar === 99 ? COLORS.dim : RARITY_COLORS[k.rar] });
          text(`★${k.stars}`, 150, y + 4, { size: 8, align: "right", color: "#ffd84a" });
        });
        if (focus === "grid") hand(20, 41 + gy * 30, t);
        const k = ks[gy];
        win(168, 28, 306, 110);
        text(`${k.rar === 99 ? "Empty" : G.rarity_name(k.rar)} ${G.slot_name(gy)}`, 180, 36, { size: 10, color: k.rar === 99 ? COLORS.dim : RARITY_COLORS[k.rar] });
        text(`★ ${k.stars} / 15   (+${G.star_k(k.stars) - 100}% base stats)`, 462, 38, { size: 7.5, align: "right", color: "#ffd84a" });
        if (k.rar === 99) text("Summon gear with Gear Scrolls to fill this slot.", 180, 54, { size: 8, color: COLORS.dim });
        else {
          text(bonusLines(G.kit_one({ ...k, lines: { $: "Nil" } }, gy)).join(", "), 180, 54, { size: 8 });
          text(k.stars >= 10 ? "From 10 stars a failed infusion can lose a star (40%)." : "Infusion is safe below 10 stars.", 180, 68, { size: 7, color: k.stars >= 10 ? "#ff9a9a" : COLORS.dim });
          text(`Inscriptions: ${k.stars < 3 ? "unlock at 3 stars" : arr(k.lines).length ? G.grade_name(k.grade) : "none yet"}`, 180, 84, { size: 8, color: arr(k.lines).length ? GRADE_COLORS[k.grade] : COLORS.dim });
          arr(k.lines).forEach((l, i) => text(`${G.stat_name(l.stat)} +${l.val}${l.stat === 12 ? " turn" : l.stat === 13 ? "" : "%"}`, 190, 97 + i * 11, { size: 8, color: GRADE_COLORS[l.grade] }));
        }
        actionsWin(168, 142, 306);
      }

      function drawWill() {
        const wl = arr(run.bag.will);
        win(6, 28, W - 12, 92);
        text("Will of Fire  (raised by blessings from elites, bosses and shrines)", 16, 34, { size: 8.5, color: COLORS.hi });
        WILL.forEach(([name, fx], i) => {
          const y = 50 + i * 16;
          text(name, 34, y, { size: 8.5, color: i === gy ? COLORS.hi : COLORS.text });
          text(`Lv ${wl[i]} / 30`, 120, y, { size: 8 });
          bar(180, y + 3, 120, 4, wl[i] / 30, "#ff8a3a");
          text(fx(wl[i]), 310, y, { size: 8, color: "#7dff9a" });
          text(`next: ${wl[i] + 1} WP`, 462, y, { size: 7.5, align: "right", color: COLORS.dim });
        });
        win(6, 124, W - 12, 98);
        text("Chakra Affinity  (each new line you pick replaces the weakest)", 16, 130, { size: 8, color: COLORS.hi });
        arr(run.bag.aff).forEach((l, i) => {
          const y = 148 + i * 18;
          const empty = l.stat === 99;
          text(`Line ${i + 1}`, 34, y, { size: 8.5, color: 4 + i === gy ? COLORS.hi : COLORS.text });
          text(empty ? "-" : `${G.stat_name(l.stat)} +${l.val}%`, 110, y, { size: 9, color: empty ? COLORS.dim : GRADE_COLORS[l.grade] });
          if (!empty) text(G.grade_name(l.grade), 300, y, { size: 8, color: GRADE_COLORS[l.grade] });
        });
        if (focus === "grid") hand(32, (gy < 4 ? 55 + gy * 16 : 153 + (gy - 4) * 18), t);
      }

      function drawForms() {
        const m = party()[who];
        const v = memberView(run, who);
        win(6, 28, 120, 194);
        fighterArt(G.body_key(C("Ninja", { who: m.who }))).draw(66, 150, { pose: "ready", t, scale: 2, glow: m.ftier ? formStatus(run, who, m.ftier).color : null });
        text(v.name, 66, 160, { size: 10, align: "center", color: COLORS.hi });
        text(`Lv ${v.lvl}   forms ${m.ftier}/3`, 66, 174, { size: 7.5, align: "center", color: "#c8d0ff" });
        text("◂ L / R ▸", 66, 200, { size: 7.5, align: "center", color: COLORS.dim });
        for (let tier = 1; tier <= 3; tier++) {
          const st = formStatus(run, who, tier);
          const y = 28 + (tier - 1) * 65;
          win(130, y, W - 136, 62, { dim: !st.unlocked, top: st.unlocked ? "#3a4fb8" : "#2a2c48", bottom: st.unlocked ? "#0d1656" : "#10101c" });
          text(`${["I", "II", "III"][tier - 1]}   ${st.fi.name}`, 142, y + 6, { size: 9.5, color: st.unlocked ? st.color : "#b8b8c8" });
          text(st.unlocked ? "AWAKENED" : "LOCKED", W - 16, y + 7, { size: 7.5, align: "right", color: st.unlocked ? "#7dff9a" : "#ff9a9a" });
          if (!st.unlocked) {
            text(`${st.gateOk ? "✓" : "✗"} Seal ${st.gate} tailed beast${st.gate > 1 ? "s" : ""}`, 150, y + 21, { size: 7.5, color: st.gateOk ? "#7dff9a" : "#ffb0b0" });
            text(`${st.met ? "✓" : "✗"} ${st.text}`, 290, y + 21, { size: 7.5, color: st.met ? "#7dff9a" : "#ffb0b0" });
          } else text(st.fi.desc, 150, y + 21, { size: 7.5, color: "#dfe6ff" });
          text(bonusText(st.fi.bon), 150, y + 33, { size: 6.2, color: "#c8ffd8" });
          const sig = G.move_info(st.fi.sig);
          text(`Jutsu: ${sig.name}   Drain ${st.fi.drain} chakra/turn`, 150, y + 45, { size: 7, color: "#ffd84a" });
        }
      }
    },
  };
});
