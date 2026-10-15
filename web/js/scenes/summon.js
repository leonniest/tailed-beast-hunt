// Summon results: scrolls open by themselves in the rules (open_scrolls);
// this decodes Bag.got and draws a compact strip of what just arrived.
import { ctx } from "../core.js";
import { win, text } from "../gfx.js";
import { G, arr, RARITY_COLORS } from "../bend.js";
import { game } from "../main.js";

/** New summons since the last time the strip was shown, or null. */
export function freshSummons(run) {
  const total = arr(run.bag.pulls).reduce((a, b) => a + b, 0);
  const seen = game.pullsSeen ?? 0;
  game.pullsSeen = total;
  if (total <= seen) return null;
  const got = arr(run.bag.got).map(describe);
  return got.length ? got : null;
}

/** "Summoned: ..." with the notable results (Jonin and up first). */
export function drawSummonStrip(items, x, y, w, alpha = 1) {
  if (!items) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  win(x, y, w, 30);
  const best = [...items].sort((a, b) => b.r - a.r);
  text(`Summoned ${items.length}:`, x + 8, y + 5, { size: 7.5, color: "#ffd84a" });
  let cx = x + 70;
  for (const it of best.slice(0, 6)) {
    ctx.fillStyle = RARITY_COLORS[it.r];
    ctx.fillRect(cx, y + 6, 5, 5);
    const label = it.name.length > 16 ? `${it.name.slice(0, 15)}.` : it.name;
    text(label, cx + 8, y + 5, { size: 6.5, color: RARITY_COLORS[it.r] });
    cx += 12 + label.length * 4.2;
    if (cx > x + w - 40) break;
  }
  text("Best weapon, contracts and gear are equipped automatically.", x + 8, y + 17, { size: 6.5, color: "#c8c0ff" });
  ctx.restore();
}

/** Decode a result code from Bag.got. */
export function describe(code) {
  if (code < 100) return { kind: 0, r: Math.floor(code / 4), name: G.weapon_name(code), sub: `ATK +${G.weapon_atk(code, 1)}%` };
  if (code < 200) { const i = code - 100; return { kind: 1, r: (i % 4) + 1, sp: Math.floor(i / 4), name: G.summon_name(i + 1), sub: G.species_name(Math.floor(i / 4)) }; }
  const salvaged = code >= 1000;
  const c = salvaged ? code - 1000 : code;
  const slot = Math.floor((c - 200) / 10), r = (c - 200) % 10;
  return { kind: 2, r, name: `${G.rarity_name(r)} ${G.slot_name(slot)}`, sub: salvaged ? "-> Chakra Ore" : "Equipped!" };
}
