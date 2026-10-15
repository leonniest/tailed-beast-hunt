// The bridge to the rules (game.mjs, compiled from src/game.bend), plus the
// run save (every state is saved: quitting cannot dodge a death) and the meta
// save (roster unlocks, which survive death).
import G from "../game.mjs";

export { G };

export const arr = (l) => { const a = []; while (l && l.$ === "Con") { a.push(l.head); l = l.tail; } return a; };
export const list = (a) => a.reduceRight((tail, head) => ({ $: "Con", head, tail }), { $: "Nil" });
export const C = (name, fields = {}) => ({ $: name, ...fields });
export const yes = (b) => b === true || b?.$ === "True";

export const WHO = ["Naruto", "Sasuke", "Sakura", "Kakashi", "Lee", "Hinata", "Shikamaru", "Gaara"];
export const RANKS = ["D", "C", "B", "A", "S"];

/** Jutsu rank title by level (the Chunin exam at 6, the Shippuden form at 15). */
export function rankTitle(lvl) {
  return lvl >= 25 ? "Kage" : lvl >= 15 ? "Jonin" : lvl >= 6 ? "Chunin" : "Genin";
}

// ---------------------------------------------------------------------------
// Run save
// ---------------------------------------------------------------------------

// v2: the three-act map structure (v1 saves are from the old world map).
const RUN_KEY = "tbh.run.v3";
try { localStorage.removeItem("tbh.run.v1"); localStorage.removeItem("tbh.run.v2"); } catch { /* ignore */ }
const META_KEY = "tbh.meta.v1";

export function saveRun(run) {
  try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch { /* storage full or blocked */ }
}
export function loadRun() {
  try {
    const s = localStorage.getItem(RUN_KEY);
    const run = s ? JSON.parse(s) : null;
    // Saves from before the collection update have no bag: start fresh.
    return run && run.bag && run.bag.cash && run.map && run.mode && run.met ? run : null;
  } catch { return null; }
}
export function clearRun() {
  try { localStorage.removeItem(RUN_KEY); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Meta progression: which ninja may be drafted.
// ---------------------------------------------------------------------------

export const UNLOCKS = {
  Naruto: { start: true },
  Sasuke: { start: true },
  Sakura: { start: true },
  Kakashi: { text: "Seal the Three-Tails, Isobu.", test: (m) => m.sealedEver.includes(3) },
  Lee: { text: "Win 15 battles (all runs).", test: (m) => m.totalWins >= 15 },
  Hinata: { text: "Travel 25 map nodes in one run.", test: (m) => m.bestDay >= 25 },
  Shikamaru: { text: "Seal the Six-Tails, Saiken.", test: (m) => m.sealedEver.includes(6) },
  Gaara: { text: "Seal the Nine-Tails: win a run.", test: (m) => m.victories >= 1 },
};

export function loadMeta() {
  const base = { runs: 0, totalWins: 0, bestDay: 0, bestSealed: 0, sealedEver: [], unlocked: ["Naruto", "Sasuke", "Sakura"], victories: 0 };
  try { return { ...base, ...JSON.parse(localStorage.getItem(META_KEY) ?? "{}") }; } catch { return base; }
}

/** Remember enemies met (for the Bestiary). */
export function markSeen(keys) {
  const m = loadMeta();
  const seen = new Set(m.seen ?? []);
  const before = seen.size;
  for (const k of keys) seen.add(k);
  if (seen.size !== before) { m.seen = [...seen]; saveMeta(m); }
}

/** Remember a jutsu seen from an enemy (meta: shown in battle and the Bestiary). */
export function markMove(key, name) {
  const m = loadMeta();
  const moves = m.moves ?? {};
  const list = moves[key] ?? [];
  if (list.includes(name)) return;
  moves[key] = [...list, name];
  m.moves = moves;
  saveMeta(m);
}
export function seenMoves(key) { return loadMeta().moves?.[key] ?? []; }

export function saveMeta(m) {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

/** Fold a run's results into the meta save; returns newly unlocked ninja. */
export function recordRun(run, extraWins = 0) {
  const m = loadMeta();
  const sealed = arr(run.sealed);
  m.totalWins += (run.wins ?? 0) + extraWins;
  m.bestDay = Math.max(m.bestDay, run.day);
  m.bestSealed = Math.max(m.bestSealed, sealed.length);
  m.sealedEver = [...new Set([...m.sealedEver, ...sealed])];
  if (run.mode.$ === "Victory") m.victories++;
  const fresh = [];
  for (const [w, u] of Object.entries(UNLOCKS)) {
    if (!m.unlocked.includes(w) && u.test?.(m)) { m.unlocked.push(w); fresh.push(w); }
  }
  saveMeta(m);
  return fresh;
}

// ---------------------------------------------------------------------------
// Rules helpers for the screens
// ---------------------------------------------------------------------------

export function newRun(squad) {
  const seed = (Math.random() * 4294967295) >>> 0;
  const m = loadMeta();
  m.runs++;
  saveMeta(m);
  return G.new_run_squad(seed, list(squad.map((w) => C(w))));
}

export function foeName(f) { return G.body_name(C("Enemy", { foe: f })); }
export function beastName(t) { return G.beast_name(t); }

/** Stats panel data for party member i. */
export function memberView(run, i) {
  const m = arr(run.party)[i];
  const s = G.member_max(run, i);
  return { m, who: m.who.$, name: G.who_name(m.who), lvl: m.lvl, hp: m.hp, mhp: s.hp, ck: m.ck, mck: s.ck, stats: s, xp: m.xp, need: G.xp_need(m.lvl), sp: m.sp, jlv: arr(m.jlv) };
}

export function toolCounts(run) {
  const counts = new Map();
  for (const t of arr(run.tools)) counts.set(t.$, (counts.get(t.$) ?? 0) + 1);
  return counts;
}

export const ALL_TOOLS = arr(G.all_tools()).map((t) => t.$);
export const toolInfo = (name) => G.tool_info(C(name));
export const moveInfo = (m) => G.move_info(typeof m === "string" ? C(m) : m);

// ---------------------------------------------------------------------------
// Collection and forms
// ---------------------------------------------------------------------------

export const RARITY_COLORS = ["#c8c8d4", "#6ab0ff", "#c47aff", "#ffa040", "#3ee8d0", "#ff4a5a", "#7a8aff"];
export const GRADE_COLORS = ["#6ab0ff", "#c47aff", "#ffa040", "#7dff9a", "#ff4a5a"];
export const CASH = [["wsc", "Weapon Scrolls"], ["csc", "Contract Scrolls"], ["gsc", "Gear Scrolls"], ["whet", "Whetstones"], ["ore", "Chakra Ore"], ["seal", "Seal Paper"], ["wp", "Will of Fire"], ["ap", "Affinity Points"]];
export const SCROLL_KINDS = ["Weapon", "Contract", "Gear"];
/** Will of Fire tracks: [name, effect at level l]. */
export const WILL_TRACKS = [["ATK", (l) => `+${3 * l} ATK`], ["HP", (l) => `+${2 * l}% Max HP`], ["DEF", (l) => `+${l} DEF`], ["Damage", (l) => `+${l}% Damage`]];

export const cash = (run) => run.bag.cash;
export const weapons = (run) => arr(run.bag.weps);
export const contracts = (run) => arr(run.bag.smns);
export const kit = (run) => arr(run.bag.kit);
export const sealedCount = (run) => arr(run.sealed).length;

export function formInfo(who, t) { return G.form_info(C(who), t); }

/** Plain-language trigger, and whether this squad member meets it now. */
export function formStatus(run, i, t) {
  const m = arr(run.party)[i];
  const fi = formInfo(m.who.$, t);
  const tr = fi.trig;
  let text = "", met = false;
  if (tr.$ === "TJutsu") {
    const mv = arr(G.who_moves(m.who))[tr.slot];
    text = `Train ${G.move_info(mv.move).name} to Lv ${tr.lvl}`;
    met = (arr(m.jlv)[tr.slot] ?? 0) >= tr.lvl;
  } else if (tr.$ === "TEvent") {
    text = "Reach their ★ story place on the map (Act 2+)";
    const c = arr(run.map)[run.pos];
    met = !!c && c.kind === 7 && c.arg === G.who_id(m.who);
  } else {
    text = `Find the ${G.art_name(tr.art)}`;
    met = arr(run.arts).some((a) => a.$ === tr.art.$);
  }
  const gateOk = sealedCount(run) >= fi.gate;
  return { fi, text, met, gateOk, gate: fi.gate, unlocked: m.ftier >= t, color: `#${fi.color.toString(16).padStart(6, "0")}` };
}

export const formColor = (who, t) => `#${formInfo(who, t).color.toString(16).padStart(6, "0")}`;

/** Mix a #rrggbb colour toward white (k = 0..1), for text on blue windows. */
export function lighten(hex, k = 0.45) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * k));
  return `rgb(${c.join(",")})`;
}
