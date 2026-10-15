// Minimal playtest log: one compact JSON line per run, sent to the local dev
// server (tools/serve.py appends it to logs/runs.jsonl). Only human runs on
// localhost: never in demo/screenshot URLs, the headless driver (?nolog) or a
// hosted build. Used for balancing from real play.
import { arr, G } from "./bend.js";

const KEY = "tbh.runlog.v1";
const q = new URLSearchParams(location.search);
export const enabled = ["localhost", "127.0.0.1"].includes(location.hostname) && !q.has("nolog") && !q.has("scene") && !navigator.webdriver;

const KIND = ".ME?R$T*B";
let log = null;
try { log = JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { log = null; }
const store = () => { try { localStorage.setItem(KEY, JSON.stringify(log)); } catch { /* full */ } };
const hpPct = (run) => {
  const ps = arr(run.party);
  return Math.round((100 * ps.reduce((s, m, i) => s + m.hp / Math.max(1, G.member_max(run, i).hp), 0)) / Math.max(1, ps.length));
};

function send(end, run) {
  if (!log) return;
  const out = { ...log, end, act: run ? run.act + 1 : log.act, fl: run ? (run.pos === 84 ? "B" : run.pos === 999 ? 0 : Math.floor(run.pos / 7) + 1) : null, lv: run ? arr(run.party).map((m) => m.lvl) : null, ryo: run?.ryo, relics: run ? arr(run.arts).map((a) => a.$) : null };
  log = null;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  fetch("/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(out) }).catch(() => {});
}

/** A new run begins (an unfinished previous one is sent as abandoned). */
export function startLog(run) {
  if (!enabled) return;
  if (log) send("abandoned", null);
  log = { v: 1, t: new Date().toISOString().slice(0, 16), sq: arr(run.party).map((m) => m.who.$), path: "", fights: [], picks: [] };
  store();
}

/** Called with every rules input and the run before / after it. */
export function logInput(inp, before, after) {
  if (!enabled || !log || !before || !after) return;
  const bm = before.mode.$, am = after.mode.$;
  const tag = `a${after.act + 1}`;
  switch (inp.$) {
    case "Travel": if (after.pos !== before.pos) log.path += (after.pos === 84 ? "B" : KIND[arr(after.map)[after.pos]?.kind] ?? "?"); break;
    case "Loot": {
      const it = arr(before.mode.items ?? { $: "Nil" })[inp.idx];
      if (!it) break;
      if (it.$ === "LJutsu") {
        const k = arr(it.opts)[inp.opt];
        log.picks.push(`${tag} J:${G.move_info(G.gen_move(k)).name}>${arr(before.party)[inp.who]?.who.$}${inp.slot}`);
      } else if (it.$ === "LRelic") log.picks.push(`${tag} R:${arr(it.opts)[inp.opt]?.$}`);
      else if (it.$ === "LWill") log.picks.push(`${tag} W:${arr(it.opts)[inp.opt]}`);
      else if (it.$ === "LAff") { const l = arr(it.opts)[inp.opt]; log.picks.push(`${tag} A:${l?.stat}/${l?.grade}`); }
      else if (it.$ === "LTrain") log.picks.push(`${tag} T:${arr(before.party)[it.who]?.who.$}${inp.slot}`);
      break;
    }
    case "SkipLoot": { const it = arr(before.mode.items ?? { $: "Nil" })[inp.idx]; if (it) log.picks.push(`${tag} skip:${it.$}`); break; }
    case "Choose": if (bm === "InEvent") log.picks.push(`${tag} ev${before.mode.id}:${inp.idx}`); else if (bm === "InRest") log.picks.push(`${tag} rest:${inp.idx}`); break;
    case "RestTrain": log.picks.push(`${tag} rest:train`); break;
    case "VJutsu": if (after.ryo !== before.ryo) log.picks.push(`${tag} buyJ:${G.move_info(G.gen_move(arr(before.mode.jut)[inp.idx])).name}`); break;
    case "VArt": if (after.ryo !== before.ryo) log.picks.push(`${tag} buyR:${arr(before.mode.arts)[inp.idx]?.$}`); break;
    case "VHeal": if (after.ryo !== before.ryo) log.picks.push(`${tag} heal`); break;
    default: break;
  }
  // a battle ended: who, how many rounds, squad HP afterwards, won or lost
  if (bm === "InBattle" && am !== "InBattle") {
    const b = before.mode.b;
    const foes = arr(b.fs).filter((f) => f.side === 1).map((f) => G.body_name(f.body)).join("+");
    const fl = before.pos === 84 ? "B" : Math.floor(before.pos / 7) + 1;
    log.fights.push(`${tag}f${fl} ${foes} r${b.round} hp${hpPct(after)} ${am === "GameOver" ? "L" : "W"}`);
  }
  store();
  if (am === "GameOver" || am === "Victory") send(am === "Victory" ? "win" : "dead", after);
}

/** The player quit to the title mid-run (the run is still saved). */
export function noteQuit() {
  if (!enabled || !log) return;
  log.picks.push("quit");
  store();
}
