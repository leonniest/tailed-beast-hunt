// Jump straight into a scene: index.html?scene=map|map2|map3|village|event|rest|battle|boss|reward|menu|end
// Used for screenshots and quick checks; never touches the real save.
import { G, C, list } from "./bend.js";

export function demoRun(which) {
  const seed = 12345;
  const squad = (new URLSearchParams(location.search).get("squad") ?? "Naruto,Sasuke,Sakura").split(",");
  let run = G.new_run_squad(seed, list(squad.map((w) => C(w))));
  // A little progress so the screens have something to show.
  run = { ...run, ryo: 340, day: 7, mode: C("OnMap") };
  const party = [];
  let l = run.party;
  while (l.$ === "Con") { party.push({ ...l.head, lvl: 7, sp: 4 }); l = l.tail; }
  run = { ...run, party: list(party) };
  run = { ...run, party: list(party.map((m, i) => ({ ...m, hp: G.member_max(run, i).hp, ck: G.member_max(run, i).ck }))) };
  switch (which) {
    case "village": return { ...run, mode: C("InVillage", { jut: list([2, 9, 17]), arts: list([C("SanninScroll"), C("ToadContract")]) }) };
    case "loot": return { ...run, mode: C("InLoot", { items: list([C("LScroll", { kind: 0, n: 6 }), C("LScroll", { kind: 1, n: 4 }), C("LJutsu", { opts: list([1, 10, 16]) }), C("LRelic", { opts: list([C("SanninScroll"), C("ToadContract"), C("SharinganEye")]) }), C("LWill", { opts: list([0, 1, 3]) }), C("LTrain", { who: 0, n: 2 })]), text: "Victory! +40 XP, +60 ryo." }) };
    case "map2": case "map3": {
      const act = which === "map2" ? 1 : 2;
      return { ...run, act, sealed: list(act === 1 ? [3] : [3, 6]), map: G.gen_map(act, seed + act, run.party), pos: 999 };
    }
    case "event": return { ...run, mode: C("InEvent", { id: Number(new URLSearchParams(location.search).get("id") ?? 6) }) };
    case "rest": return { ...run, mode: C("InRest") };
    case "battle": {
      const foes = G.foe_fighters(list([C("Dosu"), C("Zaku"), C("Kin")]), 7);
      return G.start_battle(run, foes, 0, 2);
    }
    case "boss": return G.start_battle({ ...run, act: 2, pos: 84 }, list([G.beast_fighter(9)]), 9, 9);
    case "isobu": return G.start_battle({ ...run, pos: 84 }, list([G.beast_fighter(3)]), 3, 9);
    case "zabuza": return G.start_battle(run, G.foe_fighters(list([C("Zabuza"), C("Haku")]), 7), 0, 13);
    case "sound4": return G.start_battle({ ...run, act: 1 }, G.foe_fighters(list([C("Tayuya"), C("Sakon"), C("Kidomaru")]), 12), 0, 13);
    case "forms": {
      const p2 = list(party.map((m) => ({ ...m, ftier: 2 })));
      const r2 = { ...run, party: p2, bag: { ...run.bag, smain: 4, smns: list(Array.from({ length: 28 }, (_, i) => ({ $: "Owned", copies: i === 3 ? 2 : 0, awk: 0, lvl: 1 }))) } };
      return G.start_battle(r2, G.foe_fighters(list([C("Mizuki"), C("Oboro")]), 7), 0, 2);
    }
    case "reward": return { ...run, mode: C("InLoot", { items: list([C("LRelic", { opts: list([C("SanninScroll"), C("ToadContract"), C("SharinganEye")]) })]), text: "Victory!" }) };
    case "end": return { ...run, mode: C("GameOver") };
    case "victory": return { ...run, act: 2, sealed: list([3, 6, 9]), mode: C("Victory") };
    case "armory": case "contracts": case "gear": case "will": case "formsmenu": case "awaken": return rich(run);
    default: return run;
  }
}

// A run several hours in: lots of scrolls opened (the collection equips and
// upgrades itself), Will of Fire and Affinity picked.
function rich(run) {
  const bag = run.bag;
  run = { ...run, sealed: list([3, 6]), act: 2, mode: C("OnMap"), bag: { ...bag, cash: { ...bag.cash, wsc: 40, csc: 20, gsc: 30, whet: 3000, ore: 900, seal: 40, wp: 5, ap: 3 } } };
  run = G.input(run, C("LeaveLoot")); // settles the wallet into loot
  for (let k = 0; k < 40 && run.mode.$ === "InLoot" && run.mode.items.$ === "Con"; k++) run = G.input(run, C("Loot", { idx: 0, opt: k % 3, who: 0, slot: 0 }));
  run = G.input(run, C("LeaveLoot"));
  const party = [];
  let p = run.party;
  while (p.$ === "Con") { party.push({ ...p.head, ftier: party.length === 0 ? 2 : 1, jlv: list([4, 3, 3, 1]) }); p = p.tail; }
  return { ...run, party: list(party), msg: "", mode: C("OnMap") };
}
