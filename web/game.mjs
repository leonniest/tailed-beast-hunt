function word_to_u32(w) {
  let x = 0;
  for (let i = 0; w.$ === "WCon"; i++) {
    x |= Number(w.head) << i;
    w = w.tail;
  }
  return x >>> 0;
}

function u32_to_word(x) {
  let w = {$: "WNil"};
  for (let i = 31; i >= 0; i--) {
    w = {$: "WCon", head: ((x >>> i) & 1) === 1, tail: w};
  }
  return w;
}

function cmp_new(a, b) {
  return {$: a < b ? "LT"
    : a === b ? "EQ" : "GT"};
}

function nat_divmod(a, b) {
  return b === 0 ? {$: "Tuple", fst: 0, snd: a}
    : {$: "Tuple", fst: Math.trunc(a / b), snd: a % b};
}

function nat_chk(n) {
  if (n > 281474976710655) {
    throw "bend: a Nat past the largest immediate 2^48-1";
  }
  return n;
}

function nat_host(n) {
  const int = typeof n === "bigint" || Number.isInteger(n);
  if (int && n >= 0 && n <= 2 ** 53) {
    return Number(n);
  }
  return { [Symbol.toPrimitive]() { throw "bend: a Nat past the largest immediate 2^48-1"; } };
}

function f32_show(x) {
  if (x !== x) {
    return "nan";
  }
  if (!Number.isFinite(x) || Object.is(x, -0)) {
    return x < 0 ? "-inf"
      : x === 0 ? "-0" : "inf";
  }
  let s = "x";
  for (let p = 1; p <= 9 && f32_round(s) !== x; p += 1) {
    s = String(Number(x.toExponential(p - 1)));
  }
  return s;
}

function f32_bits(x) {
  return new Uint32Array(new Float32Array([x]).buffer)[0];
}

function f32_from_bits(u) {
  return new Float32Array(new Uint32Array([u]).buffer)[0];
}

function f32_read(s) {
  const re = /^\s*[+-]?((\d+\.?\d*|\.\d+)(e[+-]?\d+)?|inf(inity)?|nan)$/i;
  const v = f32_round(s.replace(/inf\w*/i, "Infinity"));
  return re.test(s) ? {$: "Some", value: v} : {$: "None"};
}

const f32_round = function f32_round(s) {
  const d = Number(s);
  const a = Math.abs(d);
  const f = Math.fround(a);
  const g = 2 * a - Math.min(f, 2 ** 128);
  if (g === f || Math.fround(g) !== g || g === Infinity) {
    return Math.sign(d) * f;
  }
  let k = 0;
  while (a * 2 ** k % 1 !== 0) {
    k += 1;
  }
  const [, i, r, e] = /(\d*)\.?(\d*)(?:e([+-]?\d+))?$/i.exec(s);
  const n = Number(e ?? 0) - r.length;
  const x = BigInt(i + r) * 2n ** BigInt(k) * 10n ** BigInt(Math.max(n, 0));
  const y = BigInt(a * 2 ** k) * 10n ** BigInt(Math.max(-n, 0));
  return Math.sign(d) * (x === y || x > y !== g > f ? f : g);
};

function char_new(code) {
  if (code > 0x10FFFF || (code >= 0xD800 && code <= 0xDFFF)) {
    throw "bend: " + code + " is not a Unicode scalar value";
  }
  return String.fromCodePoint(code);
}

// Array
// =====

function array_new(d, v) {
  if (d > 31) {
    throw "bend: an array past the deepest block class 31";
  }
  return Array(2 ** d).fill(v);
}

function array_node(a, b) {
  if (a.length !== b.length) {
    throw "bend: runtime fail-stop";
  }
  return a.concat(b);
}

function array_rmw(a, i, f) {
  const at = i % a.length;
  const old = a[at];
  a[at] = f(old);
  return {$: "Tuple", fst: a, snd: old};
}

// Run
// ===

function run_tail(f, x) {
  return {$: "$JMP", f: f.j?.f === f ? f.j : f, x: [x]};
}

function run_clo(j) {
  const f = (x) => run_loop(j(x));
  f.j = j;
  j.f = f;
  return f;
}

function run_loop(r) {
  while (r !== null && typeof r === "object" && r.$ === "$JMP") {
    r = r.f(...r.x);
  }
  return r;
}

function run_lib(f, n) {
  return (...a) => a.length < n ? run_lib((...b) => f(...a, ...b), n - a.length)
    : f(...a);
}

// Effect
// ======

// An effect source registers each effect under its def's key, as in C.
const $0eff = Object.create(null);

function io_eff(k, run, need) {
  if (k in $0eff) {
    throw new Error("bend: two effects register " + k);
  }
  $0eff[k] = { run, need };
}
// Program
// =======

function $Picks$foes$(_r_0) {
  const _foes_0 = _r_0["foes"];
  return _foes_0;
}

function $Picks$met$(_r_0) {
  const _met_0 = _r_0["met"];
  return _met_0;
}

function $Picks$with_foes$(_r_0, _v_0) {
  const _met_0 = _r_0["met"];
  return {$: "Picks", "foes": _v_0, "met": _met_0};
}

function $Picks$with_met$(_r_0, _v_0) {
  const _foes_0 = _r_0["foes"];
  return {$: "Picks", "foes": _foes_0, "met": _v_0};
}

function $Stats$hp$(_r_0) {
  const _hp_0 = _r_0["hp"];
  return _hp_0;
}

function $Stats$ck$(_r_0) {
  const _ck_0 = _r_0["ck"];
  return _ck_0;
}

function $Stats$atk$(_r_0) {
  const _atk_0 = _r_0["atk"];
  return _atk_0;
}

function $Stats$nin$(_r_0) {
  const _nin_0 = _r_0["nin"];
  return _nin_0;
}

function $Stats$dfn$(_r_0) {
  const _dfn_0 = _r_0["dfn"];
  return _dfn_0;
}

function $Stats$spd$(_r_0) {
  const _spd_0 = _r_0["spd"];
  return _spd_0;
}

function $Stats$with_hp$(_r_0, _v_0) {
  const _ck_0 = _r_0["ck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  return {$: "Stats", "hp": _v_0, "ck": _ck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0};
}

function $Stats$with_ck$(_r_0, _v_0) {
  const _hp_0 = _r_0["hp"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  return {$: "Stats", "hp": _hp_0, "ck": _v_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0};
}

function $Stats$with_atk$(_r_0, _v_0) {
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  return {$: "Stats", "hp": _hp_0, "ck": _ck_0, "atk": _v_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0};
}

function $Stats$with_nin$(_r_0, _v_0) {
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _atk_0 = _r_0["atk"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  return {$: "Stats", "hp": _hp_0, "ck": _ck_0, "atk": _atk_0, "nin": _v_0, "dfn": _dfn_0, "spd": _spd_0};
}

function $Stats$with_dfn$(_r_0, _v_0) {
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _spd_0 = _r_0["spd"];
  return {$: "Stats", "hp": _hp_0, "ck": _ck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _v_0, "spd": _spd_0};
}

function $Stats$with_spd$(_r_0, _v_0) {
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  return {$: "Stats", "hp": _hp_0, "ck": _ck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _v_0};
}

function $Learn$move$(_r_0) {
  const _move_0 = _r_0["move"];
  return _move_0;
}

function $Learn$lvl$(_r_0) {
  const _lvl_0 = _r_0["lvl"];
  return _lvl_0;
}

function $Learn$with_move$(_r_0, _v_0) {
  const _lvl_0 = _r_0["lvl"];
  return {$: "Learn", "move": _v_0, "lvl": _lvl_0};
}

function $Learn$with_lvl$(_r_0, _v_0) {
  const _move_0 = _r_0["move"];
  return {$: "Learn", "move": _move_0, "lvl": _v_0};
}

function $MoveInfo$name$(_r_0) {
  const _name_0 = _r_0["name"];
  return _name_0;
}

function $MoveInfo$cost$(_r_0) {
  const _cost_0 = _r_0["cost"];
  return _cost_0;
}

function $MoveInfo$hpcost$(_r_0) {
  const _hpcost_0 = _r_0["hpcost"];
  return _hpcost_0;
}

function $MoveInfo$tgt$(_r_0) {
  const _tgt_0 = _r_0["tgt"];
  return _tgt_0;
}

function $MoveInfo$effs$(_r_0) {
  const _effs_0 = _r_0["effs"];
  return _effs_0;
}

function $MoveInfo$desc$(_r_0) {
  const _desc_0 = _r_0["desc"];
  return _desc_0;
}

function $MoveInfo$with_name$(_r_0, _v_0) {
  const _cost_0 = _r_0["cost"];
  const _hpcost_0 = _r_0["hpcost"];
  const _tgt_0 = _r_0["tgt"];
  const _effs_0 = _r_0["effs"];
  const _desc_0 = _r_0["desc"];
  return {$: "MoveInfo", "name": _v_0, "cost": _cost_0, "hpcost": _hpcost_0, "tgt": _tgt_0, "effs": _effs_0, "desc": _desc_0};
}

function $MoveInfo$with_cost$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _hpcost_0 = _r_0["hpcost"];
  const _tgt_0 = _r_0["tgt"];
  const _effs_0 = _r_0["effs"];
  const _desc_0 = _r_0["desc"];
  return {$: "MoveInfo", "name": _name_0, "cost": _v_0, "hpcost": _hpcost_0, "tgt": _tgt_0, "effs": _effs_0, "desc": _desc_0};
}

function $MoveInfo$with_hpcost$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _cost_0 = _r_0["cost"];
  const _tgt_0 = _r_0["tgt"];
  const _effs_0 = _r_0["effs"];
  const _desc_0 = _r_0["desc"];
  return {$: "MoveInfo", "name": _name_0, "cost": _cost_0, "hpcost": _v_0, "tgt": _tgt_0, "effs": _effs_0, "desc": _desc_0};
}

function $MoveInfo$with_tgt$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _cost_0 = _r_0["cost"];
  const _hpcost_0 = _r_0["hpcost"];
  const _effs_0 = _r_0["effs"];
  const _desc_0 = _r_0["desc"];
  return {$: "MoveInfo", "name": _name_0, "cost": _cost_0, "hpcost": _hpcost_0, "tgt": _v_0, "effs": _effs_0, "desc": _desc_0};
}

function $MoveInfo$with_effs$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _cost_0 = _r_0["cost"];
  const _hpcost_0 = _r_0["hpcost"];
  const _tgt_0 = _r_0["tgt"];
  const _desc_0 = _r_0["desc"];
  return {$: "MoveInfo", "name": _name_0, "cost": _cost_0, "hpcost": _hpcost_0, "tgt": _tgt_0, "effs": _v_0, "desc": _desc_0};
}

function $MoveInfo$with_desc$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _cost_0 = _r_0["cost"];
  const _hpcost_0 = _r_0["hpcost"];
  const _tgt_0 = _r_0["tgt"];
  const _effs_0 = _r_0["effs"];
  return {$: "MoveInfo", "name": _name_0, "cost": _cost_0, "hpcost": _hpcost_0, "tgt": _tgt_0, "effs": _effs_0, "desc": _v_0};
}

function $FoeInfo$name$(_r_0) {
  const _name_0 = _r_0["name"];
  return _name_0;
}

function $FoeInfo$hp$(_r_0) {
  const _hp_0 = _r_0["hp"];
  return _hp_0;
}

function $FoeInfo$atk$(_r_0) {
  const _atk_0 = _r_0["atk"];
  return _atk_0;
}

function $FoeInfo$nin$(_r_0) {
  const _nin_0 = _r_0["nin"];
  return _nin_0;
}

function $FoeInfo$dfn$(_r_0) {
  const _dfn_0 = _r_0["dfn"];
  return _dfn_0;
}

function $FoeInfo$spd$(_r_0) {
  const _spd_0 = _r_0["spd"];
  return _spd_0;
}

function $FoeInfo$moves$(_r_0) {
  const _moves_0 = _r_0["moves"];
  return _moves_0;
}

function $FoeInfo$xp$(_r_0) {
  const _xp_0 = _r_0["xp"];
  return _xp_0;
}

function $FoeInfo$ryo$(_r_0) {
  const _ryo_0 = _r_0["ryo"];
  return _ryo_0;
}

function $FoeInfo$with_name$(_r_0, _v_0) {
  const _hp_0 = _r_0["hp"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _moves_0 = _r_0["moves"];
  const _xp_0 = _r_0["xp"];
  const _ryo_0 = _r_0["ryo"];
  return {$: "FoeInfo", "name": _v_0, "hp": _hp_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "moves": _moves_0, "xp": _xp_0, "ryo": _ryo_0};
}

function $FoeInfo$with_hp$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _moves_0 = _r_0["moves"];
  const _xp_0 = _r_0["xp"];
  const _ryo_0 = _r_0["ryo"];
  return {$: "FoeInfo", "name": _name_0, "hp": _v_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "moves": _moves_0, "xp": _xp_0, "ryo": _ryo_0};
}

function $FoeInfo$with_atk$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _hp_0 = _r_0["hp"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _moves_0 = _r_0["moves"];
  const _xp_0 = _r_0["xp"];
  const _ryo_0 = _r_0["ryo"];
  return {$: "FoeInfo", "name": _name_0, "hp": _hp_0, "atk": _v_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "moves": _moves_0, "xp": _xp_0, "ryo": _ryo_0};
}

function $FoeInfo$with_nin$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _hp_0 = _r_0["hp"];
  const _atk_0 = _r_0["atk"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _moves_0 = _r_0["moves"];
  const _xp_0 = _r_0["xp"];
  const _ryo_0 = _r_0["ryo"];
  return {$: "FoeInfo", "name": _name_0, "hp": _hp_0, "atk": _atk_0, "nin": _v_0, "dfn": _dfn_0, "spd": _spd_0, "moves": _moves_0, "xp": _xp_0, "ryo": _ryo_0};
}

function $FoeInfo$with_dfn$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _hp_0 = _r_0["hp"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _spd_0 = _r_0["spd"];
  const _moves_0 = _r_0["moves"];
  const _xp_0 = _r_0["xp"];
  const _ryo_0 = _r_0["ryo"];
  return {$: "FoeInfo", "name": _name_0, "hp": _hp_0, "atk": _atk_0, "nin": _nin_0, "dfn": _v_0, "spd": _spd_0, "moves": _moves_0, "xp": _xp_0, "ryo": _ryo_0};
}

function $FoeInfo$with_spd$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _hp_0 = _r_0["hp"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _moves_0 = _r_0["moves"];
  const _xp_0 = _r_0["xp"];
  const _ryo_0 = _r_0["ryo"];
  return {$: "FoeInfo", "name": _name_0, "hp": _hp_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _v_0, "moves": _moves_0, "xp": _xp_0, "ryo": _ryo_0};
}

function $FoeInfo$with_moves$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _hp_0 = _r_0["hp"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _xp_0 = _r_0["xp"];
  const _ryo_0 = _r_0["ryo"];
  return {$: "FoeInfo", "name": _name_0, "hp": _hp_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "moves": _v_0, "xp": _xp_0, "ryo": _ryo_0};
}

function $FoeInfo$with_xp$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _hp_0 = _r_0["hp"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _moves_0 = _r_0["moves"];
  const _ryo_0 = _r_0["ryo"];
  return {$: "FoeInfo", "name": _name_0, "hp": _hp_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "moves": _moves_0, "xp": _v_0, "ryo": _ryo_0};
}

function $FoeInfo$with_ryo$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _hp_0 = _r_0["hp"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _moves_0 = _r_0["moves"];
  const _xp_0 = _r_0["xp"];
  return {$: "FoeInfo", "name": _name_0, "hp": _hp_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "moves": _moves_0, "xp": _xp_0, "ryo": _v_0};
}

function $Bonus$atkf$(_r_0) {
  const _atkf_0 = _r_0["atkf"];
  return _atkf_0;
}

function $Bonus$atkp$(_r_0) {
  const _atkp_0 = _r_0["atkp"];
  return _atkp_0;
}

function $Bonus$hpp$(_r_0) {
  const _hpp_0 = _r_0["hpp"];
  return _hpp_0;
}

function $Bonus$dfnf$(_r_0) {
  const _dfnf_0 = _r_0["dfnf"];
  return _dfnf_0;
}

function $Bonus$dmgp$(_r_0) {
  const _dmgp_0 = _r_0["dmgp"];
  return _dmgp_0;
}

function $Bonus$bossp$(_r_0) {
  const _bossp_0 = _r_0["bossp"];
  return _bossp_0;
}

function $Bonus$normp$(_r_0) {
  const _normp_0 = _r_0["normp"];
  return _normp_0;
}

function $Bonus$taip$(_r_0) {
  const _taip_0 = _r_0["taip"];
  return _taip_0;
}

function $Bonus$ninp$(_r_0) {
  const _ninp_0 = _r_0["ninp"];
  return _ninp_0;
}

function $Bonus$fd$(_r_0) {
  const _fd_0 = _r_0["fd"];
  return _fd_0;
}

function $Bonus$cr$(_r_0) {
  const _cr_0 = _r_0["cr"];
  return _cr_0;
}

function $Bonus$cdmg$(_r_0) {
  const _cdmg_0 = _r_0["cdmg"];
  return _cdmg_0;
}

function $Bonus$pen$(_r_0) {
  const _pen_0 = _r_0["pen"];
  return _pen_0;
}

function $Bonus$haste$(_r_0) {
  const _haste_0 = _r_0["haste"];
  return _haste_0;
}

function $Bonus$cdr$(_r_0) {
  const _cdr_0 = _r_0["cdr"];
  return _cdr_0;
}

function $Bonus$regen$(_r_0) {
  const _regen_0 = _r_0["regen"];
  return _regen_0;
}

function $Bonus$hpr$(_r_0) {
  const _hpr_0 = _r_0["hpr"];
  return _hpr_0;
}

function $Bonus$jlv$(_r_0) {
  const _jlv_0 = _r_0["jlv"];
  return _jlv_0;
}

function $Bonus$ckf$(_r_0) {
  const _ckf_0 = _r_0["ckf"];
  return _ckf_0;
}

function $Bonus$with_atkf$(_r_0, _v_0) {
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _v_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_atkp$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _v_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_hpp$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _v_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_dfnf$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _v_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_dmgp$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _v_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_bossp$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _v_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_normp$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _v_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_taip$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _v_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_ninp$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _v_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_fd$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _v_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_cr$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _v_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_cdmg$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _v_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_pen$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _v_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_haste$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _v_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_cdr$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _v_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_regen$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _v_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_hpr$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _jlv_0 = _r_0["jlv"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _v_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $Bonus$with_jlv$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _ckf_0 = _r_0["ckf"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _v_0, "ckf": _ckf_0};
}

function $Bonus$with_ckf$(_r_0, _v_0) {
  const _atkf_0 = _r_0["atkf"];
  const _atkp_0 = _r_0["atkp"];
  const _hpp_0 = _r_0["hpp"];
  const _dfnf_0 = _r_0["dfnf"];
  const _dmgp_0 = _r_0["dmgp"];
  const _bossp_0 = _r_0["bossp"];
  const _normp_0 = _r_0["normp"];
  const _taip_0 = _r_0["taip"];
  const _ninp_0 = _r_0["ninp"];
  const _fd_0 = _r_0["fd"];
  const _cr_0 = _r_0["cr"];
  const _cdmg_0 = _r_0["cdmg"];
  const _pen_0 = _r_0["pen"];
  const _haste_0 = _r_0["haste"];
  const _cdr_0 = _r_0["cdr"];
  const _regen_0 = _r_0["regen"];
  const _hpr_0 = _r_0["hpr"];
  const _jlv_0 = _r_0["jlv"];
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _v_0};
}

function $FormInfo$name$(_r_0) {
  const _name_0 = _r_0["name"];
  return _name_0;
}

function $FormInfo$gate$(_r_0) {
  const _gate_0 = _r_0["gate"];
  return _gate_0;
}

function $FormInfo$trig$(_r_0) {
  const _trig_0 = _r_0["trig"];
  return _trig_0;
}

function $FormInfo$bon$(_r_0) {
  const _bon_0 = _r_0["bon"];
  return _bon_0;
}

function $FormInfo$drain$(_r_0) {
  const _drain_0 = _r_0["drain"];
  return _drain_0;
}

function $FormInfo$sig$(_r_0) {
  const _sig_0 = _r_0["sig"];
  return _sig_0;
}

function $FormInfo$desc$(_r_0) {
  const _desc_0 = _r_0["desc"];
  return _desc_0;
}

function $FormInfo$color$(_r_0) {
  const _color_0 = _r_0["color"];
  return _color_0;
}

function $FormInfo$with_name$(_r_0, _v_0) {
  const _gate_0 = _r_0["gate"];
  const _trig_0 = _r_0["trig"];
  const _bon_0 = _r_0["bon"];
  const _drain_0 = _r_0["drain"];
  const _sig_0 = _r_0["sig"];
  const _desc_0 = _r_0["desc"];
  const _color_0 = _r_0["color"];
  return {$: "FormInfo", "name": _v_0, "gate": _gate_0, "trig": _trig_0, "bon": _bon_0, "drain": _drain_0, "sig": _sig_0, "desc": _desc_0, "color": _color_0};
}

function $FormInfo$with_gate$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _trig_0 = _r_0["trig"];
  const _bon_0 = _r_0["bon"];
  const _drain_0 = _r_0["drain"];
  const _sig_0 = _r_0["sig"];
  const _desc_0 = _r_0["desc"];
  const _color_0 = _r_0["color"];
  return {$: "FormInfo", "name": _name_0, "gate": _v_0, "trig": _trig_0, "bon": _bon_0, "drain": _drain_0, "sig": _sig_0, "desc": _desc_0, "color": _color_0};
}

function $FormInfo$with_trig$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _gate_0 = _r_0["gate"];
  const _bon_0 = _r_0["bon"];
  const _drain_0 = _r_0["drain"];
  const _sig_0 = _r_0["sig"];
  const _desc_0 = _r_0["desc"];
  const _color_0 = _r_0["color"];
  return {$: "FormInfo", "name": _name_0, "gate": _gate_0, "trig": _v_0, "bon": _bon_0, "drain": _drain_0, "sig": _sig_0, "desc": _desc_0, "color": _color_0};
}

function $FormInfo$with_bon$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _gate_0 = _r_0["gate"];
  const _trig_0 = _r_0["trig"];
  const _drain_0 = _r_0["drain"];
  const _sig_0 = _r_0["sig"];
  const _desc_0 = _r_0["desc"];
  const _color_0 = _r_0["color"];
  return {$: "FormInfo", "name": _name_0, "gate": _gate_0, "trig": _trig_0, "bon": _v_0, "drain": _drain_0, "sig": _sig_0, "desc": _desc_0, "color": _color_0};
}

function $FormInfo$with_drain$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _gate_0 = _r_0["gate"];
  const _trig_0 = _r_0["trig"];
  const _bon_0 = _r_0["bon"];
  const _sig_0 = _r_0["sig"];
  const _desc_0 = _r_0["desc"];
  const _color_0 = _r_0["color"];
  return {$: "FormInfo", "name": _name_0, "gate": _gate_0, "trig": _trig_0, "bon": _bon_0, "drain": _v_0, "sig": _sig_0, "desc": _desc_0, "color": _color_0};
}

function $FormInfo$with_sig$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _gate_0 = _r_0["gate"];
  const _trig_0 = _r_0["trig"];
  const _bon_0 = _r_0["bon"];
  const _drain_0 = _r_0["drain"];
  const _desc_0 = _r_0["desc"];
  const _color_0 = _r_0["color"];
  return {$: "FormInfo", "name": _name_0, "gate": _gate_0, "trig": _trig_0, "bon": _bon_0, "drain": _drain_0, "sig": _v_0, "desc": _desc_0, "color": _color_0};
}

function $FormInfo$with_desc$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _gate_0 = _r_0["gate"];
  const _trig_0 = _r_0["trig"];
  const _bon_0 = _r_0["bon"];
  const _drain_0 = _r_0["drain"];
  const _sig_0 = _r_0["sig"];
  const _color_0 = _r_0["color"];
  return {$: "FormInfo", "name": _name_0, "gate": _gate_0, "trig": _trig_0, "bon": _bon_0, "drain": _drain_0, "sig": _sig_0, "desc": _v_0, "color": _color_0};
}

function $FormInfo$with_color$(_r_0, _v_0) {
  const _name_0 = _r_0["name"];
  const _gate_0 = _r_0["gate"];
  const _trig_0 = _r_0["trig"];
  const _bon_0 = _r_0["bon"];
  const _drain_0 = _r_0["drain"];
  const _sig_0 = _r_0["sig"];
  const _desc_0 = _r_0["desc"];
  return {$: "FormInfo", "name": _name_0, "gate": _gate_0, "trig": _trig_0, "bon": _bon_0, "drain": _drain_0, "sig": _sig_0, "desc": _desc_0, "color": _v_0};
}

function $Wallet$wsc$(_r_0) {
  const _wsc_0 = _r_0["wsc"];
  return _wsc_0;
}

function $Wallet$csc$(_r_0) {
  const _csc_0 = _r_0["csc"];
  return _csc_0;
}

function $Wallet$gsc$(_r_0) {
  const _gsc_0 = _r_0["gsc"];
  return _gsc_0;
}

function $Wallet$whet$(_r_0) {
  const _whet_0 = _r_0["whet"];
  return _whet_0;
}

function $Wallet$ore$(_r_0) {
  const _ore_0 = _r_0["ore"];
  return _ore_0;
}

function $Wallet$seal$(_r_0) {
  const _seal_0 = _r_0["seal"];
  return _seal_0;
}

function $Wallet$wp$(_r_0) {
  const _wp_0 = _r_0["wp"];
  return _wp_0;
}

function $Wallet$ap$(_r_0) {
  const _ap_0 = _r_0["ap"];
  return _ap_0;
}

function $Wallet$with_wsc$(_r_0, _v_0) {
  const _csc_0 = _r_0["csc"];
  const _gsc_0 = _r_0["gsc"];
  const _whet_0 = _r_0["whet"];
  const _ore_0 = _r_0["ore"];
  const _seal_0 = _r_0["seal"];
  const _wp_0 = _r_0["wp"];
  const _ap_0 = _r_0["ap"];
  return {$: "Wallet", "wsc": _v_0, "csc": _csc_0, "gsc": _gsc_0, "whet": _whet_0, "ore": _ore_0, "seal": _seal_0, "wp": _wp_0, "ap": _ap_0};
}

function $Wallet$with_csc$(_r_0, _v_0) {
  const _wsc_0 = _r_0["wsc"];
  const _gsc_0 = _r_0["gsc"];
  const _whet_0 = _r_0["whet"];
  const _ore_0 = _r_0["ore"];
  const _seal_0 = _r_0["seal"];
  const _wp_0 = _r_0["wp"];
  const _ap_0 = _r_0["ap"];
  return {$: "Wallet", "wsc": _wsc_0, "csc": _v_0, "gsc": _gsc_0, "whet": _whet_0, "ore": _ore_0, "seal": _seal_0, "wp": _wp_0, "ap": _ap_0};
}

function $Wallet$with_gsc$(_r_0, _v_0) {
  const _wsc_0 = _r_0["wsc"];
  const _csc_0 = _r_0["csc"];
  const _whet_0 = _r_0["whet"];
  const _ore_0 = _r_0["ore"];
  const _seal_0 = _r_0["seal"];
  const _wp_0 = _r_0["wp"];
  const _ap_0 = _r_0["ap"];
  return {$: "Wallet", "wsc": _wsc_0, "csc": _csc_0, "gsc": _v_0, "whet": _whet_0, "ore": _ore_0, "seal": _seal_0, "wp": _wp_0, "ap": _ap_0};
}

function $Wallet$with_whet$(_r_0, _v_0) {
  const _wsc_0 = _r_0["wsc"];
  const _csc_0 = _r_0["csc"];
  const _gsc_0 = _r_0["gsc"];
  const _ore_0 = _r_0["ore"];
  const _seal_0 = _r_0["seal"];
  const _wp_0 = _r_0["wp"];
  const _ap_0 = _r_0["ap"];
  return {$: "Wallet", "wsc": _wsc_0, "csc": _csc_0, "gsc": _gsc_0, "whet": _v_0, "ore": _ore_0, "seal": _seal_0, "wp": _wp_0, "ap": _ap_0};
}

function $Wallet$with_ore$(_r_0, _v_0) {
  const _wsc_0 = _r_0["wsc"];
  const _csc_0 = _r_0["csc"];
  const _gsc_0 = _r_0["gsc"];
  const _whet_0 = _r_0["whet"];
  const _seal_0 = _r_0["seal"];
  const _wp_0 = _r_0["wp"];
  const _ap_0 = _r_0["ap"];
  return {$: "Wallet", "wsc": _wsc_0, "csc": _csc_0, "gsc": _gsc_0, "whet": _whet_0, "ore": _v_0, "seal": _seal_0, "wp": _wp_0, "ap": _ap_0};
}

function $Wallet$with_seal$(_r_0, _v_0) {
  const _wsc_0 = _r_0["wsc"];
  const _csc_0 = _r_0["csc"];
  const _gsc_0 = _r_0["gsc"];
  const _whet_0 = _r_0["whet"];
  const _ore_0 = _r_0["ore"];
  const _wp_0 = _r_0["wp"];
  const _ap_0 = _r_0["ap"];
  return {$: "Wallet", "wsc": _wsc_0, "csc": _csc_0, "gsc": _gsc_0, "whet": _whet_0, "ore": _ore_0, "seal": _v_0, "wp": _wp_0, "ap": _ap_0};
}

function $Wallet$with_wp$(_r_0, _v_0) {
  const _wsc_0 = _r_0["wsc"];
  const _csc_0 = _r_0["csc"];
  const _gsc_0 = _r_0["gsc"];
  const _whet_0 = _r_0["whet"];
  const _ore_0 = _r_0["ore"];
  const _seal_0 = _r_0["seal"];
  const _ap_0 = _r_0["ap"];
  return {$: "Wallet", "wsc": _wsc_0, "csc": _csc_0, "gsc": _gsc_0, "whet": _whet_0, "ore": _ore_0, "seal": _seal_0, "wp": _v_0, "ap": _ap_0};
}

function $Wallet$with_ap$(_r_0, _v_0) {
  const _wsc_0 = _r_0["wsc"];
  const _csc_0 = _r_0["csc"];
  const _gsc_0 = _r_0["gsc"];
  const _whet_0 = _r_0["whet"];
  const _ore_0 = _r_0["ore"];
  const _seal_0 = _r_0["seal"];
  const _wp_0 = _r_0["wp"];
  return {$: "Wallet", "wsc": _wsc_0, "csc": _csc_0, "gsc": _gsc_0, "whet": _whet_0, "ore": _ore_0, "seal": _seal_0, "wp": _wp_0, "ap": _v_0};
}

function $Owned$copies$(_r_0) {
  const _copies_0 = _r_0["copies"];
  return _copies_0;
}

function $Owned$awk$(_r_0) {
  const _awk_0 = _r_0["awk"];
  return _awk_0;
}

function $Owned$lvl$(_r_0) {
  const _lvl_0 = _r_0["lvl"];
  return _lvl_0;
}

function $Owned$with_copies$(_r_0, _v_0) {
  const _awk_0 = _r_0["awk"];
  const _lvl_0 = _r_0["lvl"];
  return {$: "Owned", "copies": _v_0, "awk": _awk_0, "lvl": _lvl_0};
}

function $Owned$with_awk$(_r_0, _v_0) {
  const _copies_0 = _r_0["copies"];
  const _lvl_0 = _r_0["lvl"];
  return {$: "Owned", "copies": _copies_0, "awk": _v_0, "lvl": _lvl_0};
}

function $Owned$with_lvl$(_r_0, _v_0) {
  const _copies_0 = _r_0["copies"];
  const _awk_0 = _r_0["awk"];
  return {$: "Owned", "copies": _copies_0, "awk": _awk_0, "lvl": _v_0};
}

function $Line$stat$(_r_0) {
  const _stat_0 = _r_0["stat"];
  return _stat_0;
}

function $Line$val$(_r_0) {
  const _val_0 = _r_0["val"];
  return _val_0;
}

function $Line$grade$(_r_0) {
  const _grade_0 = _r_0["grade"];
  return _grade_0;
}

function $Line$with_stat$(_r_0, _v_0) {
  const _val_0 = _r_0["val"];
  const _grade_0 = _r_0["grade"];
  return {$: "Line", "stat": _v_0, "val": _val_0, "grade": _grade_0};
}

function $Line$with_val$(_r_0, _v_0) {
  const _stat_0 = _r_0["stat"];
  const _grade_0 = _r_0["grade"];
  return {$: "Line", "stat": _stat_0, "val": _v_0, "grade": _grade_0};
}

function $Line$with_grade$(_r_0, _v_0) {
  const _stat_0 = _r_0["stat"];
  const _val_0 = _r_0["val"];
  return {$: "Line", "stat": _stat_0, "val": _val_0, "grade": _v_0};
}

function $Kit$rar$(_r_0) {
  const _rar_0 = _r_0["rar"];
  return _rar_0;
}

function $Kit$stars$(_r_0) {
  const _stars_0 = _r_0["stars"];
  return _stars_0;
}

function $Kit$grade$(_r_0) {
  const _grade_0 = _r_0["grade"];
  return _grade_0;
}

function $Kit$lines$(_r_0) {
  const _lines_0 = _r_0["lines"];
  return _lines_0;
}

function $Kit$with_rar$(_r_0, _v_0) {
  const _stars_0 = _r_0["stars"];
  const _grade_0 = _r_0["grade"];
  const _lines_0 = _r_0["lines"];
  return {$: "Kit", "rar": _v_0, "stars": _stars_0, "grade": _grade_0, "lines": _lines_0};
}

function $Kit$with_stars$(_r_0, _v_0) {
  const _rar_0 = _r_0["rar"];
  const _grade_0 = _r_0["grade"];
  const _lines_0 = _r_0["lines"];
  return {$: "Kit", "rar": _rar_0, "stars": _v_0, "grade": _grade_0, "lines": _lines_0};
}

function $Kit$with_grade$(_r_0, _v_0) {
  const _rar_0 = _r_0["rar"];
  const _stars_0 = _r_0["stars"];
  const _lines_0 = _r_0["lines"];
  return {$: "Kit", "rar": _rar_0, "stars": _stars_0, "grade": _v_0, "lines": _lines_0};
}

function $Kit$with_lines$(_r_0, _v_0) {
  const _rar_0 = _r_0["rar"];
  const _stars_0 = _r_0["stars"];
  const _grade_0 = _r_0["grade"];
  return {$: "Kit", "rar": _rar_0, "stars": _stars_0, "grade": _grade_0, "lines": _v_0};
}

function $Card$kind$(_r_0) {
  const _kind_0 = _r_0["kind"];
  return _kind_0;
}

function $Card$lvl$(_r_0) {
  const _lvl_0 = _r_0["lvl"];
  return _lvl_0;
}

function $Card$with_kind$(_r_0, _v_0) {
  const _lvl_0 = _r_0["lvl"];
  return {$: "Card", "kind": _v_0, "lvl": _lvl_0};
}

function $Card$with_lvl$(_r_0, _v_0) {
  const _kind_0 = _r_0["kind"];
  return {$: "Card", "kind": _kind_0, "lvl": _v_0};
}

function $Bag$cash$(_r_0) {
  const _cash_0 = _r_0["cash"];
  return _cash_0;
}

function $Bag$weps$(_r_0) {
  const _weps_0 = _r_0["weps"];
  return _weps_0;
}

function $Bag$smns$(_r_0) {
  const _smns_0 = _r_0["smns"];
  return _smns_0;
}

function $Bag$kit$(_r_0) {
  const _kit_0 = _r_0["kit"];
  return _kit_0;
}

function $Bag$smain$(_r_0) {
  const _smain_0 = _r_0["smain"];
  return _smain_0;
}

function $Bag$ssub1$(_r_0) {
  const _ssub1_0 = _r_0["ssub1"];
  return _ssub1_0;
}

function $Bag$ssub2$(_r_0) {
  const _ssub2_0 = _r_0["ssub2"];
  return _ssub2_0;
}

function $Bag$will$(_r_0) {
  const _will_0 = _r_0["will"];
  return _will_0;
}

function $Bag$aff$(_r_0) {
  const _aff_0 = _r_0["aff"];
  return _aff_0;
}

function $Bag$pulls$(_r_0) {
  const _pulls_0 = _r_0["pulls"];
  return _pulls_0;
}

function $Bag$pity$(_r_0) {
  const _pity_0 = _r_0["pity"];
  return _pity_0;
}

function $Bag$cards$(_r_0) {
  const _cards_0 = _r_0["cards"];
  return _cards_0;
}

function $Bag$logp$(_r_0) {
  const _logp_0 = _r_0["logp"];
  return _logp_0;
}

function $Bag$got$(_r_0) {
  const _got_0 = _r_0["got"];
  return _got_0;
}

function $Bag$with_cash$(_r_0, _v_0) {
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _v_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_weps$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _v_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_smns$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _v_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_kit$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _v_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_smain$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _v_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_ssub1$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _v_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_ssub2$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _v_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_will$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _v_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_aff$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _v_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_pulls$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _v_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_pity$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _v_0, "cards": _cards_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_cards$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _logp_0 = _r_0["logp"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _v_0, "logp": _logp_0, "got": _got_0};
}

function $Bag$with_logp$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _got_0 = _r_0["got"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _v_0, "got": _got_0};
}

function $Bag$with_got$(_r_0, _v_0) {
  const _cash_0 = _r_0["cash"];
  const _weps_0 = _r_0["weps"];
  const _smns_0 = _r_0["smns"];
  const _kit_0 = _r_0["kit"];
  const _smain_0 = _r_0["smain"];
  const _ssub1_0 = _r_0["ssub1"];
  const _ssub2_0 = _r_0["ssub2"];
  const _will_0 = _r_0["will"];
  const _aff_0 = _r_0["aff"];
  const _pulls_0 = _r_0["pulls"];
  const _pity_0 = _r_0["pity"];
  const _cards_0 = _r_0["cards"];
  const _logp_0 = _r_0["logp"];
  return {$: "Bag", "cash": _cash_0, "weps": _weps_0, "smns": _smns_0, "kit": _kit_0, "smain": _smain_0, "ssub1": _ssub1_0, "ssub2": _ssub2_0, "will": _will_0, "aff": _aff_0, "pulls": _pulls_0, "pity": _pity_0, "cards": _cards_0, "logp": _logp_0, "got": _v_0};
}

function $Status$burn$(_r_0) {
  const _burn_0 = _r_0["burn"];
  return _burn_0;
}

function $Status$poison$(_r_0) {
  const _poison_0 = _r_0["poison"];
  return _poison_0;
}

function $Status$stun$(_r_0) {
  const _stun_0 = _r_0["stun"];
  return _stun_0;
}

function $Status$guard$(_r_0) {
  const _guard_0 = _r_0["guard"];
  return _guard_0;
}

function $Status$atkup$(_r_0) {
  const _atkup_0 = _r_0["atkup"];
  return _atkup_0;
}

function $Status$defup$(_r_0) {
  const _defup_0 = _r_0["defup"];
  return _defup_0;
}

function $Status$defdown$(_r_0) {
  const _defdown_0 = _r_0["defdown"];
  return _defdown_0;
}

function $Status$evade$(_r_0) {
  const _evade_0 = _r_0["evade"];
  return _evade_0;
}

function $Status$clones$(_r_0) {
  const _clones_0 = _r_0["clones"];
  return _clones_0;
}

function $Status$charge$(_r_0) {
  const _charge_0 = _r_0["charge"];
  return _charge_0;
}

function $Status$guts$(_r_0) {
  const _guts_0 = _r_0["guts"];
  return _guts_0;
}

function $Status$mark$(_r_0) {
  const _mark_0 = _r_0["mark"];
  return _mark_0;
}

function $Status$markt$(_r_0) {
  const _markt_0 = _r_0["markt"];
  return _markt_0;
}

function $Status$burnd$(_r_0) {
  const _burnd_0 = _r_0["burnd"];
  return _burnd_0;
}

function $Status$poisd$(_r_0) {
  const _poisd_0 = _r_0["poisd"];
  return _poisd_0;
}

function $Status$with_burn$(_r_0, _v_0) {
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _v_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_poison$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _v_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_stun$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _v_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_guard$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _v_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_atkup$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _v_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_defup$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _v_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_defdown$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _v_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_evade$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _v_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_clones$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _v_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_charge$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _v_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_guts$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _v_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_mark$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _v_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_markt$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _burnd_0 = _r_0["burnd"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _v_0, "burnd": _burnd_0, "poisd": _poisd_0};
}

function $Status$with_burnd$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _poisd_0 = _r_0["poisd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _v_0, "poisd": _poisd_0};
}

function $Status$with_poisd$(_r_0, _v_0) {
  const _burn_0 = _r_0["burn"];
  const _poison_0 = _r_0["poison"];
  const _stun_0 = _r_0["stun"];
  const _guard_0 = _r_0["guard"];
  const _atkup_0 = _r_0["atkup"];
  const _defup_0 = _r_0["defup"];
  const _defdown_0 = _r_0["defdown"];
  const _evade_0 = _r_0["evade"];
  const _clones_0 = _r_0["clones"];
  const _charge_0 = _r_0["charge"];
  const _guts_0 = _r_0["guts"];
  const _mark_0 = _r_0["mark"];
  const _markt_0 = _r_0["markt"];
  const _burnd_0 = _r_0["burnd"];
  return {$: "Status", "burn": _burn_0, "poison": _poison_0, "stun": _stun_0, "guard": _guard_0, "atkup": _atkup_0, "defup": _defup_0, "defdown": _defdown_0, "evade": _evade_0, "clones": _clones_0, "charge": _charge_0, "guts": _guts_0, "mark": _mark_0, "markt": _markt_0, "burnd": _burnd_0, "poisd": _v_0};
}

function $Fighter$body$(_r_0) {
  const _body_0 = _r_0["body"];
  return _body_0;
}

function $Fighter$side$(_r_0) {
  const _side_0 = _r_0["side"];
  return _side_0;
}

function $Fighter$lvl$(_r_0) {
  const _lvl_0 = _r_0["lvl"];
  return _lvl_0;
}

function $Fighter$hp$(_r_0) {
  const _hp_0 = _r_0["hp"];
  return _hp_0;
}

function $Fighter$mhp$(_r_0) {
  const _mhp_0 = _r_0["mhp"];
  return _mhp_0;
}

function $Fighter$ck$(_r_0) {
  const _ck_0 = _r_0["ck"];
  return _ck_0;
}

function $Fighter$mck$(_r_0) {
  const _mck_0 = _r_0["mck"];
  return _mck_0;
}

function $Fighter$atk$(_r_0) {
  const _atk_0 = _r_0["atk"];
  return _atk_0;
}

function $Fighter$nin$(_r_0) {
  const _nin_0 = _r_0["nin"];
  return _nin_0;
}

function $Fighter$dfn$(_r_0) {
  const _dfn_0 = _r_0["dfn"];
  return _dfn_0;
}

function $Fighter$spd$(_r_0) {
  const _spd_0 = _r_0["spd"];
  return _spd_0;
}

function $Fighter$bon$(_r_0) {
  const _bon_0 = _r_0["bon"];
  return _bon_0;
}

function $Fighter$st$(_r_0) {
  const _st_0 = _r_0["st"];
  return _st_0;
}

function $Fighter$tmr$(_r_0) {
  const _tmr_0 = _r_0["tmr"];
  return _tmr_0;
}

function $Fighter$cds$(_r_0) {
  const _cds_0 = _r_0["cds"];
  return _cds_0;
}

function $Fighter$jlv$(_r_0) {
  const _jlv_0 = _r_0["jlv"];
  return _jlv_0;
}

function $Fighter$form$(_r_0) {
  const _form_0 = _r_0["form"];
  return _form_0;
}

function $Fighter$ftier$(_r_0) {
  const _ftier_0 = _r_0["ftier"];
  return _ftier_0;
}

function $Fighter$kit$(_r_0) {
  const _kit_0 = _r_0["kit"];
  return _kit_0;
}

function $Fighter$with_body$(_r_0, _v_0) {
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _v_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_side$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _v_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_lvl$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _v_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_hp$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _v_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_mhp$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _v_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_ck$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _v_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_mck$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _v_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_atk$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _v_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_nin$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _v_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_dfn$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _v_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_spd$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _v_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_bon$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _v_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_st$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _v_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_tmr$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _v_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_cds$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _v_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_jlv$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _v_0, "form": _form_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_form$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _ftier_0 = _r_0["ftier"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _v_0, "ftier": _ftier_0, "kit": _kit_0};
}

function $Fighter$with_ftier$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _kit_0 = _r_0["kit"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _v_0, "kit": _kit_0};
}

function $Fighter$with_kit$(_r_0, _v_0) {
  const _body_0 = _r_0["body"];
  const _side_0 = _r_0["side"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _mhp_0 = _r_0["mhp"];
  const _ck_0 = _r_0["ck"];
  const _mck_0 = _r_0["mck"];
  const _atk_0 = _r_0["atk"];
  const _nin_0 = _r_0["nin"];
  const _dfn_0 = _r_0["dfn"];
  const _spd_0 = _r_0["spd"];
  const _bon_0 = _r_0["bon"];
  const _st_0 = _r_0["st"];
  const _tmr_0 = _r_0["tmr"];
  const _cds_0 = _r_0["cds"];
  const _jlv_0 = _r_0["jlv"];
  const _form_0 = _r_0["form"];
  const _ftier_0 = _r_0["ftier"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": _hp_0, "mhp": _mhp_0, "ck": _ck_0, "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": _st_0, "tmr": _tmr_0, "cds": _cds_0, "jlv": _jlv_0, "form": _form_0, "ftier": _ftier_0, "kit": _v_0};
}

function $Act$a$(_r_0) {
  const _a_0 = _r_0["a"];
  return _a_0;
}

function $Act$nat$(_r_0) {
  const _nat_0 = _r_0["nat"];
  return _nat_0;
}

function $Act$pmul$(_r_0) {
  const _pmul_0 = _r_0["pmul"];
  return _pmul_0;
}

function $Act$chain$(_r_0) {
  const _chain_0 = _r_0["chain"];
  return _chain_0;
}

function $Act$with_a$(_r_0, _v_0) {
  const _nat_0 = _r_0["nat"];
  const _pmul_0 = _r_0["pmul"];
  const _chain_0 = _r_0["chain"];
  return {$: "Act", "a": _v_0, "nat": _nat_0, "pmul": _pmul_0, "chain": _chain_0};
}

function $Act$with_nat$(_r_0, _v_0) {
  const _a_0 = _r_0["a"];
  const _pmul_0 = _r_0["pmul"];
  const _chain_0 = _r_0["chain"];
  return {$: "Act", "a": _a_0, "nat": _v_0, "pmul": _pmul_0, "chain": _chain_0};
}

function $Act$with_pmul$(_r_0, _v_0) {
  const _a_0 = _r_0["a"];
  const _nat_0 = _r_0["nat"];
  const _chain_0 = _r_0["chain"];
  return {$: "Act", "a": _a_0, "nat": _nat_0, "pmul": _v_0, "chain": _chain_0};
}

function $Act$with_chain$(_r_0, _v_0) {
  const _a_0 = _r_0["a"];
  const _nat_0 = _r_0["nat"];
  const _pmul_0 = _r_0["pmul"];
  return {$: "Act", "a": _a_0, "nat": _nat_0, "pmul": _pmul_0, "chain": _v_0};
}

function $Lx$lvl$(_r_0) {
  const _lvl_0 = _r_0["lvl"];
  return _lvl_0;
}

function $Lx$xp$(_r_0) {
  const _xp_0 = _r_0["xp"];
  return _xp_0;
}

function $Lx$with_lvl$(_r_0, _v_0) {
  const _xp_0 = _r_0["xp"];
  return {$: "Lx", "lvl": _v_0, "xp": _xp_0};
}

function $Lx$with_xp$(_r_0, _v_0) {
  const _lvl_0 = _r_0["lvl"];
  return {$: "Lx", "lvl": _lvl_0, "xp": _v_0};
}

function $Member$who$(_r_0) {
  const _who_0 = _r_0["who"];
  return _who_0;
}

function $Member$lvl$(_r_0) {
  const _lvl_0 = _r_0["lvl"];
  return _lvl_0;
}

function $Member$xp$(_r_0) {
  const _xp_0 = _r_0["xp"];
  return _xp_0;
}

function $Member$hp$(_r_0) {
  const _hp_0 = _r_0["hp"];
  return _hp_0;
}

function $Member$ck$(_r_0) {
  const _ck_0 = _r_0["ck"];
  return _ck_0;
}

function $Member$sp$(_r_0) {
  const _sp_0 = _r_0["sp"];
  return _sp_0;
}

function $Member$jlv$(_r_0) {
  const _jlv_0 = _r_0["jlv"];
  return _jlv_0;
}

function $Member$weapon$(_r_0) {
  const _weapon_0 = _r_0["weapon"];
  return _weapon_0;
}

function $Member$ftier$(_r_0) {
  const _ftier_0 = _r_0["ftier"];
  return _ftier_0;
}

function $Member$tech$(_r_0) {
  const _tech_0 = _r_0["tech"];
  return _tech_0;
}

function $Member$with_who$(_r_0, _v_0) {
  const _lvl_0 = _r_0["lvl"];
  const _xp_0 = _r_0["xp"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _sp_0 = _r_0["sp"];
  const _jlv_0 = _r_0["jlv"];
  const _weapon_0 = _r_0["weapon"];
  const _ftier_0 = _r_0["ftier"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _v_0, "lvl": _lvl_0, "xp": _xp_0, "hp": _hp_0, "ck": _ck_0, "sp": _sp_0, "jlv": _jlv_0, "weapon": _weapon_0, "ftier": _ftier_0, "tech": _tech_0};
}

function $Member$with_lvl$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _xp_0 = _r_0["xp"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _sp_0 = _r_0["sp"];
  const _jlv_0 = _r_0["jlv"];
  const _weapon_0 = _r_0["weapon"];
  const _ftier_0 = _r_0["ftier"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _who_0, "lvl": _v_0, "xp": _xp_0, "hp": _hp_0, "ck": _ck_0, "sp": _sp_0, "jlv": _jlv_0, "weapon": _weapon_0, "ftier": _ftier_0, "tech": _tech_0};
}

function $Member$with_xp$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _lvl_0 = _r_0["lvl"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _sp_0 = _r_0["sp"];
  const _jlv_0 = _r_0["jlv"];
  const _weapon_0 = _r_0["weapon"];
  const _ftier_0 = _r_0["ftier"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _who_0, "lvl": _lvl_0, "xp": _v_0, "hp": _hp_0, "ck": _ck_0, "sp": _sp_0, "jlv": _jlv_0, "weapon": _weapon_0, "ftier": _ftier_0, "tech": _tech_0};
}

function $Member$with_hp$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _lvl_0 = _r_0["lvl"];
  const _xp_0 = _r_0["xp"];
  const _ck_0 = _r_0["ck"];
  const _sp_0 = _r_0["sp"];
  const _jlv_0 = _r_0["jlv"];
  const _weapon_0 = _r_0["weapon"];
  const _ftier_0 = _r_0["ftier"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _who_0, "lvl": _lvl_0, "xp": _xp_0, "hp": _v_0, "ck": _ck_0, "sp": _sp_0, "jlv": _jlv_0, "weapon": _weapon_0, "ftier": _ftier_0, "tech": _tech_0};
}

function $Member$with_ck$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _lvl_0 = _r_0["lvl"];
  const _xp_0 = _r_0["xp"];
  const _hp_0 = _r_0["hp"];
  const _sp_0 = _r_0["sp"];
  const _jlv_0 = _r_0["jlv"];
  const _weapon_0 = _r_0["weapon"];
  const _ftier_0 = _r_0["ftier"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _who_0, "lvl": _lvl_0, "xp": _xp_0, "hp": _hp_0, "ck": _v_0, "sp": _sp_0, "jlv": _jlv_0, "weapon": _weapon_0, "ftier": _ftier_0, "tech": _tech_0};
}

function $Member$with_sp$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _lvl_0 = _r_0["lvl"];
  const _xp_0 = _r_0["xp"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _jlv_0 = _r_0["jlv"];
  const _weapon_0 = _r_0["weapon"];
  const _ftier_0 = _r_0["ftier"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _who_0, "lvl": _lvl_0, "xp": _xp_0, "hp": _hp_0, "ck": _ck_0, "sp": _v_0, "jlv": _jlv_0, "weapon": _weapon_0, "ftier": _ftier_0, "tech": _tech_0};
}

function $Member$with_jlv$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _lvl_0 = _r_0["lvl"];
  const _xp_0 = _r_0["xp"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _sp_0 = _r_0["sp"];
  const _weapon_0 = _r_0["weapon"];
  const _ftier_0 = _r_0["ftier"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _who_0, "lvl": _lvl_0, "xp": _xp_0, "hp": _hp_0, "ck": _ck_0, "sp": _sp_0, "jlv": _v_0, "weapon": _weapon_0, "ftier": _ftier_0, "tech": _tech_0};
}

function $Member$with_weapon$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _lvl_0 = _r_0["lvl"];
  const _xp_0 = _r_0["xp"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _sp_0 = _r_0["sp"];
  const _jlv_0 = _r_0["jlv"];
  const _ftier_0 = _r_0["ftier"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _who_0, "lvl": _lvl_0, "xp": _xp_0, "hp": _hp_0, "ck": _ck_0, "sp": _sp_0, "jlv": _jlv_0, "weapon": _v_0, "ftier": _ftier_0, "tech": _tech_0};
}

function $Member$with_ftier$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _lvl_0 = _r_0["lvl"];
  const _xp_0 = _r_0["xp"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _sp_0 = _r_0["sp"];
  const _jlv_0 = _r_0["jlv"];
  const _weapon_0 = _r_0["weapon"];
  const _tech_0 = _r_0["tech"];
  return {$: "Member", "who": _who_0, "lvl": _lvl_0, "xp": _xp_0, "hp": _hp_0, "ck": _ck_0, "sp": _sp_0, "jlv": _jlv_0, "weapon": _weapon_0, "ftier": _v_0, "tech": _tech_0};
}

function $Member$with_tech$(_r_0, _v_0) {
  const _who_0 = _r_0["who"];
  const _lvl_0 = _r_0["lvl"];
  const _xp_0 = _r_0["xp"];
  const _hp_0 = _r_0["hp"];
  const _ck_0 = _r_0["ck"];
  const _sp_0 = _r_0["sp"];
  const _jlv_0 = _r_0["jlv"];
  const _weapon_0 = _r_0["weapon"];
  const _ftier_0 = _r_0["ftier"];
  return {$: "Member", "who": _who_0, "lvl": _lvl_0, "xp": _xp_0, "hp": _hp_0, "ck": _ck_0, "sp": _sp_0, "jlv": _jlv_0, "weapon": _weapon_0, "ftier": _ftier_0, "tech": _v_0};
}

function $Cell$kind$(_r_0) {
  const _kind_0 = _r_0["kind"];
  return _kind_0;
}

function $Cell$arg$(_r_0) {
  const _arg_0 = _r_0["arg"];
  return _arg_0;
}

function $Cell$links$(_r_0) {
  const _links_0 = _r_0["links"];
  return _links_0;
}

function $Cell$with_kind$(_r_0, _v_0) {
  const _arg_0 = _r_0["arg"];
  const _links_0 = _r_0["links"];
  return {$: "Cell", "kind": _v_0, "arg": _arg_0, "links": _links_0};
}

function $Cell$with_arg$(_r_0, _v_0) {
  const _kind_0 = _r_0["kind"];
  const _links_0 = _r_0["links"];
  return {$: "Cell", "kind": _kind_0, "arg": _v_0, "links": _links_0};
}

function $Cell$with_links$(_r_0, _v_0) {
  const _kind_0 = _r_0["kind"];
  const _arg_0 = _r_0["arg"];
  return {$: "Cell", "kind": _kind_0, "arg": _arg_0, "links": _v_0};
}

function $Battle$fs$(_r_0) {
  const _fs_0 = _r_0["fs"];
  return _fs_0;
}

function $Battle$clock$(_r_0) {
  const _clock_0 = _r_0["clock"];
  return _clock_0;
}

function $Battle$round$(_r_0) {
  const _round_0 = _r_0["round"];
  return _round_0;
}

function $Battle$phase$(_r_0) {
  const _phase_0 = _r_0["phase"];
  return _phase_0;
}

function $Battle$boss$(_r_0) {
  const _boss_0 = _r_0["boss"];
  return _boss_0;
}

function $Battle$rank$(_r_0) {
  const _rank_0 = _r_0["rank"];
  return _rank_0;
}

function $Battle$arts$(_r_0) {
  const _arts_0 = _r_0["arts"];
  return _arts_0;
}

function $Battle$sealed$(_r_0) {
  const _sealed_0 = _r_0["sealed"];
  return _sealed_0;
}

function $Battle$log$(_r_0) {
  const _log_0 = _r_0["log"];
  return _log_0;
}

function $Battle$seed$(_r_0) {
  const _seed_0 = _r_0["seed"];
  return _seed_0;
}

function $Battle$chain$(_r_0) {
  const _chain_0 = _r_0["chain"];
  return _chain_0;
}

function $Battle$ctgt$(_r_0) {
  const _ctgt_0 = _r_0["ctgt"];
  return _ctgt_0;
}

function $Battle$smn$(_r_0) {
  const _smn_0 = _r_0["smn"];
  return _smn_0;
}

function $Battle$spow$(_r_0) {
  const _spow_0 = _r_0["spow"];
  return _spow_0;
}

function $Battle$with_fs$(_r_0, _v_0) {
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _v_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_clock$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _v_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_round$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _v_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_phase$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _v_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_boss$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _v_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_rank$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _v_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_arts$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _v_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_sealed$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _v_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_log$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _v_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_seed$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _v_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_chain$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _v_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_ctgt$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _smn_0 = _r_0["smn"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _v_0, "smn": _smn_0, "spow": _spow_0};
}

function $Battle$with_smn$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _spow_0 = _r_0["spow"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _v_0, "spow": _spow_0};
}

function $Battle$with_spow$(_r_0, _v_0) {
  const _fs_0 = _r_0["fs"];
  const _clock_0 = _r_0["clock"];
  const _round_0 = _r_0["round"];
  const _phase_0 = _r_0["phase"];
  const _boss_0 = _r_0["boss"];
  const _rank_0 = _r_0["rank"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _log_0 = _r_0["log"];
  const _seed_0 = _r_0["seed"];
  const _chain_0 = _r_0["chain"];
  const _ctgt_0 = _r_0["ctgt"];
  const _smn_0 = _r_0["smn"];
  return {$: "Battle", "fs": _fs_0, "clock": _clock_0, "round": _round_0, "phase": _phase_0, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": _log_0, "seed": _seed_0, "chain": _chain_0, "ctgt": _ctgt_0, "smn": _smn_0, "spow": _v_0};
}

function $Run$seed$(_r_0) {
  const _seed_0 = _r_0["seed"];
  return _seed_0;
}

function $Run$day$(_r_0) {
  const _day_0 = _r_0["day"];
  return _day_0;
}

function $Run$ryo$(_r_0) {
  const _ryo_0 = _r_0["ryo"];
  return _ryo_0;
}

function $Run$pos$(_r_0) {
  const _pos_0 = _r_0["pos"];
  return _pos_0;
}

function $Run$party$(_r_0) {
  const _party_0 = _r_0["party"];
  return _party_0;
}

function $Run$tools$(_r_0) {
  const _tools_0 = _r_0["tools"];
  return _tools_0;
}

function $Run$arts$(_r_0) {
  const _arts_0 = _r_0["arts"];
  return _arts_0;
}

function $Run$sealed$(_r_0) {
  const _sealed_0 = _r_0["sealed"];
  return _sealed_0;
}

function $Run$act$(_r_0) {
  const _act_0 = _r_0["act"];
  return _act_0;
}

function $Run$map$(_r_0) {
  const _map_0 = _r_0["map"];
  return _map_0;
}

function $Run$bag$(_r_0) {
  const _bag_0 = _r_0["bag"];
  return _bag_0;
}

function $Run$mode$(_r_0) {
  const _mode_0 = _r_0["mode"];
  return _mode_0;
}

function $Run$msg$(_r_0) {
  const _msg_0 = _r_0["msg"];
  return _msg_0;
}

function $Run$wins$(_r_0) {
  const _wins_0 = _r_0["wins"];
  return _wins_0;
}

function $Run$met$(_r_0) {
  const _met_0 = _r_0["met"];
  return _met_0;
}

function $Run$with_seed$(_r_0, _v_0) {
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _v_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_day$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _v_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_ryo$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _v_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_pos$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _v_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_party$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _v_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_tools$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _v_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_arts$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _v_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_sealed$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _v_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_act$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _v_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_map$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _v_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_bag$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _v_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_mode$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _v_0, "msg": _msg_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_msg$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _wins_0 = _r_0["wins"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _v_0, "wins": _wins_0, "met": _met_0};
}

function $Run$with_wins$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _met_0 = _r_0["met"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _v_0, "met": _met_0};
}

function $Run$with_met$(_r_0, _v_0) {
  const _seed_0 = _r_0["seed"];
  const _day_0 = _r_0["day"];
  const _ryo_0 = _r_0["ryo"];
  const _pos_0 = _r_0["pos"];
  const _party_0 = _r_0["party"];
  const _tools_0 = _r_0["tools"];
  const _arts_0 = _r_0["arts"];
  const _sealed_0 = _r_0["sealed"];
  const _act_0 = _r_0["act"];
  const _map_0 = _r_0["map"];
  const _bag_0 = _r_0["bag"];
  const _mode_0 = _r_0["mode"];
  const _msg_0 = _r_0["msg"];
  const _wins_0 = _r_0["wins"];
  return {$: "Run", "seed": _seed_0, "day": _day_0, "ryo": _ryo_0, "pos": _pos_0, "party": _party_0, "tools": _tools_0, "arts": _arts_0, "sealed": _sealed_0, "act": _act_0, "map": _map_0, "bag": _bag_0, "mode": _mode_0, "msg": _msg_0, "wins": _wins_0, "met": _v_0};
}

function $sub0$(_a_0, _b_0) {
  return $Bool$pick$((_a_0 > _b_0), ((_a_0 - _b_0) >>> 0), 0);
}

function $pct$(_x_0, _p_0) {
  const _x_1 = (Math.imul(_x_0, _p_0) >>> 0);
  return (100 === 0 ? 0 : (_x_1 / 100) >>> 0);
}

function $u32_max$(_a_0, _b_0) {
  return $Bool$pick$((_a_0 > _b_0), _a_0, _b_0);
}

function $u32_min$(_a_0, _b_0) {
  return $Bool$pick$((_a_0 < _b_0), _a_0, _b_0);
}

function $gt0$(_a_0) {
  return (_a_0 > 0);
}

function $mix$(_x_0) {
  const _x_1 = (16 >= 32 ? 0 : (_x_0 >>> 16) >>> 0);
  const _a_0 = ((_x_0 ^ _x_1) >>> 0);
  const _b_0 = (Math.imul(_a_0, 2146121005) >>> 0);
  const _x_2 = (15 >= 32 ? 0 : (_b_0 >>> 15) >>> 0);
  const _c_0 = ((_b_0 ^ _x_2) >>> 0);
  const _d_0 = (Math.imul(_c_0, 2221713035) >>> 0);
  const _x_3 = (16 >= 32 ? 0 : (_d_0 >>> 16) >>> 0);
  return ((_d_0 ^ _x_3) >>> 0);
}

function $roll$(_seed_0, _salt_0, _n_0) {
  const _x_0 = ($mix$(((_salt_0 + 1013904223) >>> 0)));
  const _x_1 = ($mix$(((_seed_0 ^ _x_0) >>> 0)));
  const _x_2 = ($u32_max$(_n_0, 1));
  return (_x_2 === 0 ? _x_1 : _x_1 % _x_2);
}

function $chance$(_seed_0, _salt_0, _p_0) {
  const _x_0 = ($roll$(_seed_0, _salt_0, 100));
  return (_x_0 < _p_0);
}

function $len$(_xs_0) {
  const _x_0 = ($List$length$(_xs_0));
  return (_x_0 >>> 0);
}

function $at_u32$(_xs_0, _i_0) {
  return $Maybe$default$(($List$get$(_xs_0, _i_0)), 0);
}

function $has_u32$(_xs_0, _x_0) {
  if (_xs_0.$ === "Nil") {
    return false;
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    const _x_1 = (_h_0 === _x_0);
    const _x_2 = ($has_u32$(_t_0, _x_0));
    return (_x_1 || _x_2);
  }
}

function $snoc$(_xs_0, _x_0) {
  return $List$append$(_xs_0, {$: "Con", "head": _x_0, "tail": {$: "Nil"}});
}

function $who_id$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return 0;
  } else if (_w_0.$ === "Sasuke") {
    return 1;
  } else if (_w_0.$ === "Sakura") {
    return 2;
  } else if (_w_0.$ === "Kakashi") {
    return 3;
  } else if (_w_0.$ === "Lee") {
    return 4;
  } else if (_w_0.$ === "Hinata") {
    return 5;
  } else if (_w_0.$ === "Shikamaru") {
    return 6;
  } else {
    return 7;
  }
}

function $who_is$(_a_0, _b_0) {
  const _x_0 = ($who_id$(_a_0));
  const _x_1 = ($who_id$(_b_0));
  return (_x_0 === _x_1);
}

function $who_name$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return "Naruto";
  } else if (_w_0.$ === "Sasuke") {
    return "Sasuke";
  } else if (_w_0.$ === "Sakura") {
    return "Sakura";
  } else if (_w_0.$ === "Kakashi") {
    return "Kakashi";
  } else if (_w_0.$ === "Lee") {
    return "Rock Lee";
  } else if (_w_0.$ === "Hinata") {
    return "Hinata";
  } else if (_w_0.$ === "Shikamaru") {
    return "Shikamaru";
  } else {
    return "Gaara";
  }
}

function $who_passive$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return "Never Give Up";
  } else if (_w_0.$ === "Sasuke") {
    return "Sharingan";
  } else if (_w_0.$ === "Sakura") {
    return "Chakra Control";
  } else if (_w_0.$ === "Kakashi") {
    return "Copy Ninja";
  } else if (_w_0.$ === "Lee") {
    return "Taijutsu Prodigy";
  } else if (_w_0.$ === "Hinata") {
    return "Byakugan";
  } else if (_w_0.$ === "Shikamaru") {
    return "IQ 200";
  } else {
    return "Absolute Defense";
  }
}

function $who_passive_desc$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return "Once per battle, survives a lethal blow with 1 HP.";
  } else if (_w_0.$ === "Sasuke") {
    return "20% chance to read an attack: dodge it and counter.";
  } else if (_w_0.$ === "Sakura") {
    return "Jutsu cost 25% less chakra. Heals are 50% stronger.";
  } else if (_w_0.$ === "Kakashi") {
    return "Gains 12 chakra whenever an enemy uses a technique.";
  } else if (_w_0.$ === "Lee") {
    return "Taijutsu (basic attack) strikes twice.";
  } else if (_w_0.$ === "Hinata") {
    return "Sees chakra points: all her attacks ignore 30% of DEF.";
  } else if (_w_0.$ === "Shikamaru") {
    return "Has a plan: the squad starts every battle with ATK up.";
  } else {
    return "Sand blocks 25% of incoming hits completely.";
  }
}

function $who_base$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return {$: "Stats", "hp": 146, "ck": 90, "atk": 21, "nin": 23, "dfn": 11, "spd": 12};
  } else if (_w_0.$ === "Sasuke") {
    return {$: "Stats", "hp": 110, "ck": 80, "atk": 19, "nin": 21, "dfn": 9, "spd": 15};
  } else if (_w_0.$ === "Sakura") {
    return {$: "Stats", "hp": 126, "ck": 105, "atk": 20, "nin": 27, "dfn": 12, "spd": 13};
  } else if (_w_0.$ === "Kakashi") {
    return {$: "Stats", "hp": 119, "ck": 100, "atk": 18, "nin": 21, "dfn": 10, "spd": 15};
  } else if (_w_0.$ === "Lee") {
    return {$: "Stats", "hp": 120, "ck": 45, "atk": 21, "nin": 6, "dfn": 11, "spd": 15};
  } else if (_w_0.$ === "Hinata") {
    return {$: "Stats", "hp": 116, "ck": 90, "atk": 21, "nin": 20, "dfn": 10, "spd": 14};
  } else if (_w_0.$ === "Shikamaru") {
    return {$: "Stats", "hp": 138, "ck": 100, "atk": 22, "nin": 32, "dfn": 13, "spd": 14};
  } else {
    return {$: "Stats", "hp": 155, "ck": 100, "atk": 18, "nin": 34, "dfn": 20, "spd": 11};
  }
}

function $who_grow$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return {$: "Stats", "hp": 15, "ck": 8, "atk": 4, "nin": 4, "dfn": 2, "spd": 1};
  } else if (_w_0.$ === "Sasuke") {
    return {$: "Stats", "hp": 11, "ck": 7, "atk": 3, "nin": 4, "dfn": 2, "spd": 2};
  } else if (_w_0.$ === "Sakura") {
    return {$: "Stats", "hp": 10, "ck": 9, "atk": 3, "nin": 4, "dfn": 2, "spd": 1};
  } else if (_w_0.$ === "Kakashi") {
    return {$: "Stats", "hp": 11, "ck": 9, "atk": 3, "nin": 4, "dfn": 2, "spd": 2};
  } else if (_w_0.$ === "Lee") {
    return {$: "Stats", "hp": 13, "ck": 3, "atk": 4, "nin": 1, "dfn": 2, "spd": 2};
  } else if (_w_0.$ === "Hinata") {
    return {$: "Stats", "hp": 10, "ck": 8, "atk": 4, "nin": 4, "dfn": 2, "spd": 2};
  } else if (_w_0.$ === "Shikamaru") {
    return {$: "Stats", "hp": 12, "ck": 8, "atk": 3, "nin": 4, "dfn": 2, "spd": 1};
  } else {
    return {$: "Stats", "hp": 14, "ck": 9, "atk": 3, "nin": 5, "dfn": 3, "spd": 1};
  }
}

function $who_moves$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return {$: "Con", "head": {$: "Learn", "move": {$: "ShadowClone"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "UzumakiBarrage"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "Rasengan"}, "lvl": 4}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "Rasenshuriken"}, "lvl": 10}, "tail": {$: "Nil"}}}}};
  } else if (_w_0.$ === "Sasuke") {
    return {$: "Con", "head": {$: "Learn", "move": {$: "Fireball"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "LionCombo"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "Chidori"}, "lvl": 4}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "Amaterasu"}, "lvl": 10}, "tail": {$: "Nil"}}}}};
  } else if (_w_0.$ === "Sakura") {
    return {$: "Con", "head": {$: "Learn", "move": {$: "MysticPalm"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "CherryImpact"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "HealingWave"}, "lvl": 4}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "CreationRebirth"}, "lvl": 10}, "tail": {$: "Nil"}}}}};
  } else if (_w_0.$ === "Kakashi") {
    return {$: "Con", "head": {$: "Learn", "move": {$: "LightningBlade"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "WaterDragon"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "NinjaHounds"}, "lvl": 4}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "Kamui"}, "lvl": 10}, "tail": {$: "Nil"}}}}};
  } else if (_w_0.$ === "Lee") {
    return {$: "Con", "head": {$: "Learn", "move": {$: "LeafHurricane"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "PrimaryLotus"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "OpenGates"}, "lvl": 4}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "MorningPeacock"}, "lvl": 10}, "tail": {$: "Nil"}}}}};
  } else if (_w_0.$ === "Hinata") {
    return {$: "Con", "head": {$: "Learn", "move": {$: "GentleFist"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "Rotation"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "SixtyFourPalms"}, "lvl": 4}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "TwinLions"}, "lvl": 10}, "tail": {$: "Nil"}}}}};
  } else if (_w_0.$ === "Shikamaru") {
    return {$: "Con", "head": {$: "Learn", "move": {$: "ShadowPossession"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "ShadowNeckBind"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "Strategy"}, "lvl": 4}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "ShadowStitch"}, "lvl": 10}, "tail": {$: "Nil"}}}}};
  } else {
    return {$: "Con", "head": {$: "Learn", "move": {$: "SandCoffin"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "SandShield"}, "lvl": 1}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "SandBurial"}, "lvl": 4}, "tail": {$: "Con", "head": {$: "Learn", "move": {$: "SandTsunami"}, "lvl": 10}, "tail": {$: "Nil"}}}}};
  }
}

function $move_id$(_m_0) {
  if (_m_0.$ === "Strike") {
    return 0;
  } else if (_m_0.$ === "Defend") {
    return 1;
  } else if (_m_0.$ === "ThrowKunai") {
    return 2;
  } else if (_m_0.$ === "TailSwipe") {
    return 3;
  } else if (_m_0.$ === "Ambush") {
    return 4;
  } else if (_m_0.$ === "TailedBeastBomb") {
    return 10;
  } else if (_m_0.$ === "GatherChakra") {
    return 11;
  } else {
    return 99;
  }
}

function $move_basic$(_m_0) {
  const _x_0 = ($move_id$(_m_0));
  return (_x_0 < 10);
}

function $mi$(_name_0, _cost_0, _tgt_0, _effs_0, _desc_0) {
  return {$: "MoveInfo", "name": _name_0, "cost": _cost_0, "hpcost": 0, "tgt": _tgt_0, "effs": _effs_0, "desc": _desc_0};
}

function $move_info$(_m_0) {
  if (_m_0.$ === "Strike") {
    return $mi$("Taijutsu", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 100, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "SelfCk", "amt": 8}, "tail": {$: "Nil"}}}, "A close-range combo. Restores 8 chakra.");
  } else if (_m_0.$ === "Defend") {
    return $mi$("Guard", 0, {$: "OnSelf"}, {$: "Con", "head": {$: "Give", "st": {$: "SGuard"}, "turns": 1, "chance": 100}, "tail": {$: "Con", "head": {$: "Chakra", "amt": 15}, "tail": {$: "Nil"}}}, "Halve damage until your next turn. Restores 15 chakra.");
  } else if (_m_0.$ === "ShadowClone") {
    return $mi$("Shadow Clone", 20, {$: "OnSelf"}, {$: "Con", "head": {$: "Give", "st": {$: "SClones"}, "turns": 2, "chance": 100}, "tail": {$: "Nil"}}, "Two clones appear. Each one takes a hit for Naruto.");
  } else if (_m_0.$ === "UzumakiBarrage") {
    return $mi$("Uzumaki Barrage", 25, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 62, "hits": 4, "pierce": 0}, "tail": {$: "Nil"}}, "Clones pile on: 4 hits.");
  } else if (_m_0.$ === "Rasengan") {
    return $mi$("Rasengan", 35, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 250, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A spinning sphere of chakra. Heavy damage.");
  } else if (_m_0.$ === "Rasenshuriken") {
    return $mi$("Rasenshuriken", 70, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 240, "hits": 1, "pierce": 20}, "tail": {$: "Nil"}}, "Wind-style Rasengan that shreds every foe.");
  } else if (_m_0.$ === "Fireball") {
    return $mi$("Fireball Jutsu", 25, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 160, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 3, "chance": 60}, "tail": {$: "Nil"}}}, "Uchiha fire. May burn.");
  } else if (_m_0.$ === "LionCombo") {
    return $mi$("Lion Combo", 20, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 95, "hits": 2, "pierce": 0}, "tail": {$: "Nil"}}, "A copied Leaf taijutsu: 2 hits.");
  } else if (_m_0.$ === "Chidori") {
    return $mi$("Chidori", 40, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 260, "hits": 1, "pierce": 40}, "tail": {$: "Nil"}}, "A thousand birds. Pierces 40% DEF.");
  } else if (_m_0.$ === "Amaterasu") {
    return $mi$("Amaterasu", 65, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 150, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 4, "chance": 100}, "tail": {$: "Nil"}}}, "Black flames engulf all foes.");
  } else if (_m_0.$ === "MysticPalm") {
    return $mi$("Mystic Palm", 20, {$: "OneAlly"}, {$: "Con", "head": {$: "Heal", "pow": 35}, "tail": {$: "Nil"}}, "Medical ninjutsu. Heals one ally.");
  } else if (_m_0.$ === "CherryImpact") {
    return $mi$("Cherry Blossom Impact", 25, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 210, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 25}, "tail": {$: "Nil"}}}, "CHA! May stun.");
  } else if (_m_0.$ === "HealingWave") {
    return $mi$("Healing Wave", 40, {$: "AllAllies"}, {$: "Con", "head": {$: "Heal", "pow": 25}, "tail": {$: "Con", "head": {$: "Cleanse"}, "tail": {$: "Nil"}}}, "Heals the squad and cures ailments.");
  } else if (_m_0.$ === "CreationRebirth") {
    return $mi$("Creation Rebirth", 70, {$: "AllAllies"}, {$: "Con", "head": {$: "Heal", "pow": 70}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SDefUp"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}}, "Byakugou seal. Big heal and DEF up for all.");
  } else if (_m_0.$ === "LightningBlade") {
    return $mi$("Lightning Blade", 40, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 245, "hits": 1, "pierce": 40}, "tail": {$: "Nil"}}, "Raikiri. Pierces 40% DEF.");
  } else if (_m_0.$ === "WaterDragon") {
    return $mi$("Water Dragon", 35, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 130, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A dragon of water hits all foes.");
  } else if (_m_0.$ === "NinjaHounds") {
    return $mi$("Ninja Hounds", 20, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 70, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 80}, "tail": {$: "Nil"}}}, "Pakkun and friends pin the target.");
  } else if (_m_0.$ === "Kamui") {
    return $mi$("Kamui", 75, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 400, "hits": 1, "pierce": 100}, "tail": {$: "Nil"}}, "Warps space. Ignores all DEF.");
  } else if (_m_0.$ === "LeafHurricane") {
    return $mi$("Leaf Hurricane", 12, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 170, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A whirlwind kick.");
  } else if (_m_0.$ === "PrimaryLotus") {
    return $mi$("Primary Lotus", 30, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 240, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "Kick up, wrap, and drive them into the ground.");
  } else if (_m_0.$ === "OpenGates") {
    return {$: "MoveInfo", "name": "Eight Gates", "cost": 0, "hpcost": 15, "tgt": {$: "OnSelf"}, "effs": {$: "Con", "head": {$: "Give", "st": {$: "SAtkUp"}, "turns": 3, "chance": 100}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SEvade"}, "turns": 2, "chance": 100}, "tail": {$: "Nil"}}}, "desc": "Costs 15% HP. ATK up and evasion."};
  } else if (_m_0.$ === "MorningPeacock") {
    return {$: "MoveInfo", "name": "Morning Peacock", "cost": 0, "hpcost": 25, "tgt": {$: "AllFoes"}, "effs": {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 90, "hits": 4, "pierce": 0}, "tail": {$: "Nil"}}, "desc": "Costs 25% HP. Flaming punches hit all foes 4 times."};
  } else if (_m_0.$ === "GentleFist") {
    return $mi$("Gentle Fist", 15, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 160, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 20}, "tail": {$: "Nil"}}}, "Strikes chakra points. Drains 20 chakra.");
  } else if (_m_0.$ === "Rotation") {
    return $mi$("Palm Rotation", 25, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 100, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A spinning chakra dome hits all foes.");
  } else if (_m_0.$ === "SixtyFourPalms") {
    return $mi$("64 Palms", 35, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 32, "hits": 8, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 25}, "tail": {$: "Nil"}}}, "8 rapid hits, drains 25 chakra.");
  } else if (_m_0.$ === "TwinLions") {
    return $mi$("Twin Lion Fists", 60, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 170, "hits": 2, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 40}, "tail": {$: "Nil"}}}, "Lion-shaped chakra fists. Drains 40 chakra.");
  } else if (_m_0.$ === "ShadowPossession") {
    return $mi$("Shadow Possession", 20, {$: "OneFoe"}, {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 2, "chance": 85}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SDefDown"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}}, "Binds a foe for 2 turns and exposes it (DEF down).");
  } else if (_m_0.$ === "Strategy") {
    return $mi$("Strategy", 15, {$: "AllAllies"}, {$: "Con", "head": {$: "Give", "st": {$: "SAtkUp"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}, "What a drag. Squad ATK up for 3 turns.");
  } else if (_m_0.$ === "ShadowNeckBind") {
    return $mi$("Shadow Neck Bind", 30, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 225, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 50}, "tail": {$: "Nil"}}}, "Shadow hands squeeze. May bind.");
  } else if (_m_0.$ === "ShadowStitch") {
    return $mi$("Shadow Stitching", 60, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 180, "hits": 1, "pierce": 30}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 60}, "tail": {$: "Nil"}}}, "Shadow needles pierce all foes.");
  } else if (_m_0.$ === "SandCoffin") {
    return $mi$("Sand Coffin", 30, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 215, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 40}, "tail": {$: "Nil"}}}, "Sand wraps the target. May bind.");
  } else if (_m_0.$ === "SandShield") {
    return $mi$("Sand Shield", 20, {$: "AllAllies"}, {$: "Con", "head": {$: "Give", "st": {$: "SDefUp"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}, "Squad DEF up for 3 turns.");
  } else if (_m_0.$ === "SandBurial") {
    return $mi$("Sand Burial", 45, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 345, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "Crushing sand. Massive damage.");
  } else if (_m_0.$ === "SandTsunami") {
    return $mi$("Sand Tsunami", 70, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 220, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 30}, "tail": {$: "Nil"}}}, "A desert's worth of sand on all foes.");
  } else if (_m_0.$ === "ThrowKunai") {
    return $mi$("Kunai Toss", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 110, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "Ambush") {
    return $mi$("Ambush", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 170, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "Senbon") {
    return $mi$("Poison Senbon", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 60, "hits": 2, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 3, "chance": 70}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "SoundWave") {
    return $mi$("Sound Wave", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 90, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 15}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "WaterPrison") {
    return $mi$("Water Prison", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 2, "chance": 85}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "HiddenMist") {
    return $mi$("Hidden Mist", 0, {$: "OnSelf"}, {$: "Con", "head": {$: "Give", "st": {$: "SEvade"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "SilentKill") {
    return $mi$("Silent Killing", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 260, "hits": 1, "pierce": 30}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "DemonMirror") {
    return $mi$("Demonic Ice Mirrors", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 45, "hits": 5, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "ChakraScalpel") {
    return $mi$("Chakra Scalpel", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 180, "hits": 1, "pierce": 60}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "SharkBite") {
    return $mi$("Samehada", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 170, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 30}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "WaterShark") {
    return $mi$("Water Shark Bomb", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 120, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "ExplodingClay") {
    return $mi$("C2 Exploding Clay", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 120, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 2, "chance": 50}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "Tsukuyomi") {
    return $mi$("Tsukuyomi", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 180, "hits": 1, "pierce": 100}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 100}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "TailSwipe") {
    return $mi$("Tail Swipe", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 130, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "SandBullet") {
    return $mi$("Wind: Sand Bullet", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 105, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "SandPrison") {
    return $mi$("Sand Prison", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 80, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 2, "chance": 80}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "BlueFlames") {
    return $mi$("Blue Flames", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 100, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 3, "chance": 70}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "CoralShell") {
    return $mi$("Coral Shell", 0, {$: "OnSelf"}, {$: "Con", "head": {$: "Give", "st": {$: "SDefUp"}, "turns": 3, "chance": 100}, "tail": {$: "Con", "head": {$: "Heal", "pow": 8}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "LavaBombs") {
    return $mi$("Lava Bombs", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 125, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 2, "chance": 50}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "SteamCharge") {
    return $mi$("Steam Charge", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 230, "hits": 1, "pierce": 40}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "AcidBubbles") {
    return $mi$("Acid Bubbles", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 90, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 3, "chance": 80}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "ScalePowder") {
    return $mi$("Scale Powder", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 70, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 35}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "InkFlood") {
    return $mi$("Ink Flood", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 110, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 25}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "TentacleLariat") {
    return $mi$("Tentacle Lariat", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 80, "hits": 3, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "FoxClaws") {
    return $mi$("Fox Claws", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 90, "hits": 3, "pierce": 20}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "ChakraRoar") {
    return $mi$("Chakra Roar", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 140, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "GatherChakra") {
    return $mi$("Gather Chakra", 0, {$: "OnSelf"}, {$: "Con", "head": {$: "Give", "st": {$: "SCharge"}, "turns": 1, "chance": 100}, "tail": {$: "Nil"}}, "A Tailed Beast Bomb is forming! GUARD!");
  } else if (_m_0.$ === "TailedBeastBomb") {
    return $mi$("Tailed Beast Bomb", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 280, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "Idle") {
    return $mi$("Wait", 0, {$: "OnSelf"}, {$: "Nil"}, "");
  } else if (_m_0.$ === "SparStrike") {
    return $mi$("Sparring Strike", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 150, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "SparWave") {
    return $mi$("Sparring Wave", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 80, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 2, "chance": 50}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "SparBind") {
    return $mi$("Sparring Bind", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 60, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 30}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "ChakraArm") {
    return $mi$("Chakra Arm Barrage", 20, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 75, "hits": 3, "pierce": 0}, "tail": {$: "Nil"}}, "Kurama's chakra arms strike 3 times.");
  } else if (_m_0.$ === "FrogKata") {
    return $mi$("Frog Kata", 25, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 170, "hits": 2, "pierce": 50}, "tail": {$: "Nil"}}, "Sage taijutsu. Natural energy hits twice, pierces 50%.");
  } else if (_m_0.$ === "BeastBombRasengan") {
    return $mi$("Tailed Beast Rasengan", 60, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 320, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A Tailed Beast Bomb inside a Rasengan.");
  } else if (_m_0.$ === "ChidoriStream") {
    return $mi$("Chidori Stream", 25, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 110, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 25}, "tail": {$: "Nil"}}}, "Lightning from every pore. May stun.");
  } else if (_m_0.$ === "ChidoriSpear") {
    return $mi$("Chidori Spear", 35, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 330, "hits": 1, "pierce": 60}, "tail": {$: "Nil"}}, "A blade of lightning. Pierces 60%.");
  } else if (_m_0.$ === "SusanooArrow") {
    return $mi$("Susano'o Arrow", 60, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 480, "hits": 1, "pierce": 40}, "tail": {$: "Nil"}}, "Susano'o looses a flaming arrow.");
  } else if (_m_0.$ === "ChakraFist") {
    return $mi$("Chakra Fist", 15, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 240, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 30}, "tail": {$: "Nil"}}}, "Pinpoint chakra in a punch. May stun.");
  } else if (_m_0.$ === "ByakugouHeal") {
    return $mi$("Byakugou Regeneration", 40, {$: "AllAllies"}, {$: "Con", "head": {$: "Heal", "pow": 45}, "tail": {$: "Con", "head": {$: "Cleanse"}, "tail": {$: "Nil"}}}, "Heals the squad and cures ailments.");
  } else if (_m_0.$ === "KatsuyuDivision") {
    return $mi$("Katsuyu Division", 50, {$: "AllAllies"}, {$: "Con", "head": {$: "Heal", "pow": 40}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SDefUp"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}}, "Katsuyu heals and shields every ally.");
  } else if (_m_0.$ === "LightningHound") {
    return $mi$("Lightning Hound", 30, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 220, "hits": 1, "pierce": 30}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 50}, "tail": {$: "Nil"}}}, "A hound of lightning. May stun.");
  } else if (_m_0.$ === "KamuiShuriken") {
    return $mi$("Kamui Shuriken", 45, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 300, "hits": 1, "pierce": 100}, "tail": {$: "Nil"}}, "A shuriken through Kamui. Ignores DEF.");
  } else if (_m_0.$ === "KamuiRaikiri") {
    return $mi$("Kamui Raikiri", 70, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 520, "hits": 1, "pierce": 100}, "tail": {$: "Nil"}}, "Raikiri through space itself.");
  } else if (_m_0.$ === "HiddenLotus") {
    return {$: "MoveInfo", "name": "Hidden Lotus", "cost": 0, "hpcost": 10, "tgt": {$: "OneFoe"}, "effs": {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 120, "hits": 3, "pierce": 0}, "tail": {$: "Nil"}}, "desc": "Costs 10% HP. Three crushing blows."};
  } else if (_m_0.$ === "AfternoonTiger") {
    return {$: "MoveInfo", "name": "Afternoon Tiger", "cost": 0, "hpcost": 15, "tgt": {$: "AllFoes"}, "effs": {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 260, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "desc": "Costs 15% HP. A tiger of air pressure."};
  } else if (_m_0.$ === "EveningElephant") {
    return {$: "MoveInfo", "name": "Evening Elephant", "cost": 0, "hpcost": 20, "tgt": {$: "OneFoe"}, "effs": {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 150, "hits": 5, "pierce": 0}, "tail": {$: "Nil"}}, "desc": "Costs 20% HP. Five unseen punches."};
  } else if (_m_0.$ === "VacuumPalm") {
    return $mi$("Vacuum Palm", 20, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 190, "hits": 1, "pierce": 40}, "tail": {$: "Nil"}}, "A palm strike of compressed air.");
  } else if (_m_0.$ === "ProtectiveTrigrams") {
    return $mi$("Protective 64 Palms", 40, {$: "AllAllies"}, {$: "Con", "head": {$: "Give", "st": {$: "SDefUp"}, "turns": 3, "chance": 100}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SEvade"}, "turns": 2, "chance": 100}, "tail": {$: "Nil"}}}, "A wall of palms: DEF up and evasion.");
  } else if (_m_0.$ === "TwinLionCrush") {
    return $mi$("Twin Lion Crush", 55, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 260, "hits": 2, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 40}, "tail": {$: "Nil"}}}, "Two lion fists. Drains 40 chakra.");
  } else if (_m_0.$ === "ShadowSewing") {
    return $mi$("Shadow Sewing", 30, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 90, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 55}, "tail": {$: "Nil"}}}, "Shadow threads bind every foe.");
  } else if (_m_0.$ === "ShadowShuriken") {
    return $mi$("Shadow Shuriken", 35, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 170, "hits": 1, "pierce": 20}, "tail": {$: "Nil"}}, "Shuriken that follow the shadows.");
  } else if (_m_0.$ === "FlyingSwallow") {
    return $mi$("Flying Swallow", 40, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 200, "hits": 2, "pierce": 30}, "tail": {$: "Nil"}}, "Chakra blades of wind, Asuma's way.");
  } else if (_m_0.$ === "SandShuriken") {
    return $mi$("Sand Shuriken", 25, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 130, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A storm of sand blades.");
  } else if (_m_0.$ === "SandSpear") {
    return $mi$("Sand Spear", 40, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 340, "hits": 1, "pierce": 30}, "tail": {$: "Nil"}}, "Shukaku's arm hurls a spear of sand.");
  } else if (_m_0.$ === "SandFuneral") {
    return $mi$("Sand Waterfall Funeral", 70, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 300, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 35}, "tail": {$: "Nil"}}}, "The desert crashes down on every foe.");
  } else if (_m_0.$ === "ToadOil") {
    return $mi$("Toad Oil Flame Bullet", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 160, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 3, "chance": 60}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "SlugHeal") {
    return $mi$("Katsuyu's Healing", 0, {$: "AllAllies"}, {$: "Con", "head": {$: "Heal", "pow": 30}, "tail": {$: "Con", "head": {$: "Cleanse"}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "SnakeBite") {
    return $mi$("Great Snake Bite", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 220, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 3, "chance": 80}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "HoundPin") {
    return $mi$("Ninken Pin", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 120, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 90}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "HawkGale") {
    return $mi$("Garuda Gale", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 110, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "MonkeyStaff") {
    return $mi$("Adamantine Staff", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 320, "hits": 1, "pierce": 30}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "WeaselScythe") {
    return $mi$("Wind Scythe", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 140, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "ChainShred") {
    return $mi$("Chain Shred", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 70, "hits": 2, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 3, "chance": 70}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "CloneAmbush") {
    return $mi$("Clone Ambush", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 55, "hits": 3, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "GiantShuriken") {
    return $mi$("Giant Shuriken", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 90, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "AirCutter") {
    return $mi$("Decapitating Air Waves", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 100, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "BellGenjutsu") {
    return $mi$("Bell Genjutsu", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 2, "chance": 70}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "DrainFist") {
    return $mi$("Chakra Absorption", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 130, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 30}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "SoftBind") {
    return $mi$("Soft Physique Bind", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 80, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 60}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "RainNeedles") {
    return $mi$("Needle Rain", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 70, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 2, "chance": 40}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "InkBeasts") {
    return $mi$("Super Beast Scroll", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 80, "hits": 2, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "SporeDrain") {
    return $mi$("Spore Drain", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 100, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 40}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "ShadowSnakes") {
    return $mi$("Striking Shadow Snakes", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 150, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 3, "chance": 90}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "KusanagiStrike") {
    return $mi$("Kusanagi", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 280, "hits": 1, "pierce": 50}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "EarthDome") {
    return $mi$("Earth Dome Prison", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 110, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 20}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "SpiderArrow") {
    return $mi$("Spider War Bow", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 260, "hits": 1, "pierce": 30}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "DemonFlute") {
    return $mi$("Demon Flute", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 80, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 30}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "TwinDemon") {
    return $mi$("Twin Demon Strike", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 90, "hits": 3, "pierce": 0}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "Clematis") {
    return $mi$("Dance of the Clematis", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 300, "hits": 1, "pierce": 40}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "JashinRitual") {
    return $mi$("Jashin Ritual", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 160, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Drain", "amt": 30}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "PressureDamage") {
    return $mi$("Pressure Damage", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 150, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 2, "chance": 60}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "EarthGrudge") {
    return $mi$("Earth Grudge Fear", 0, {$: "OnSelf"}, {$: "Con", "head": {$: "Heal", "pow": 15}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SDefUp"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "IronSand") {
    return $mi$("Iron Sand", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 110, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 3, "chance": 80}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "CrowPuppet") {
    return $mi$("Crow Puppet", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 90, "hits": 2, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 3, "chance": 70}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "CrystalLances") {
    return $mi$("Crystal Lances", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 110, "hits": 1, "pierce": 20}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "ThunderSwords") {
    return $mi$("Twin Thunder Swords", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 120, "hits": 2, "pierce": 20}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "RaijinSword") {
    return $mi$("Thunder God Sword", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 240, "hits": 1, "pierce": 30}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 30}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "MindTransfer") {
    return $mi$("Mind Transfer", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 2, "chance": 60}, "tail": {$: "Nil"}}, "");
  } else if (_m_0.$ === "BugSwarm") {
    return $mi$("Nano Insect Swarm", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 80, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SPoison"}, "turns": 4, "chance": 90}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "ExplosiveSwords") {
    return $mi$("Shibuki Blast", 0, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 120, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 2, "chance": 50}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "NeedleWire") {
    return $mi$("Needle Wire", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 60, "hits": 3, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 1, "chance": 40}, "tail": {$: "Nil"}}}, "");
  } else if (_m_0.$ === "GShurikenStorm") {
    return $mi$("Shuriken Storm", 15, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 75, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A storm of shuriken hits every foe.");
  } else if (_m_0.$ === "GPhoenixFlower") {
    return $mi$("Phoenix Flower", 20, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 48, "hits": 4, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 2, "chance": 35}, "tail": {$: "Nil"}}}, "Four fireballs. May burn.");
  } else if (_m_0.$ === "GWaterBullet") {
    return $mi$("Water Bullet", 22, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 200, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A heavy shot of water.");
  } else if (_m_0.$ === "GGreatBreakthrough") {
    return $mi$("Great Breakthrough", 30, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 115, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A blast of wind hits all foes.");
  } else if (_m_0.$ === "GEarthWall") {
    return $mi$("Earth Wall", 20, {$: "AllAllies"}, {$: "Con", "head": {$: "Give", "st": {$: "SDefUp"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}, "Squad DEF up for 3 turns.");
  } else if (_m_0.$ === "GSubstitution") {
    return $mi$("Substitution", 10, {$: "OnSelf"}, {$: "Con", "head": {$: "Give", "st": {$: "SEvade"}, "turns": 2, "chance": 100}, "tail": {$: "Con", "head": {$: "Chakra", "amt": 10}, "tail": {$: "Nil"}}}, "A log takes the hit. Evasion up, +10 chakra.");
  } else if (_m_0.$ === "GTagBarrage") {
    return $mi$("Paper Bomb Barrage", 25, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 230, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A chain of explosive tags.");
  } else if (_m_0.$ === "GBodyFlicker") {
    return $mi$("Body Flicker Strike", 8, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 150, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "SelfCk", "amt": 8}, "tail": {$: "Nil"}}}, "Blink in, strike, restore 8 chakra.");
  } else if (_m_0.$ === "GThunderHound") {
    return $mi$("Thunder Hound", 35, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 270, "hits": 1, "pierce": 30}, "tail": {$: "Nil"}}, "Lightning hound. Pierces 30% DEF.");
  } else if (_m_0.$ === "GMistVeil") {
    return $mi$("Mist Veil", 25, {$: "AllAllies"}, {$: "Con", "head": {$: "Give", "st": {$: "SEvade"}, "turns": 2, "chance": 100}, "tail": {$: "Nil"}}, "Thick mist: squad evasion up.");
  } else if (_m_0.$ === "GTreeBind") {
    return $mi$("Tree Bind Illusion", 25, {$: "OneFoe"}, {$: "Con", "head": {$: "Give", "st": {$: "SStun"}, "turns": 2, "chance": 75}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SDefDown"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}}, "Genjutsu roots: bind and expose a foe.");
  } else if (_m_0.$ === "GHealingPalm") {
    return $mi$("Healing Palm", 25, {$: "OneAlly"}, {$: "Con", "head": {$: "Heal", "pow": 45}, "tail": {$: "Nil"}}, "Medical ninjutsu for any ninja.");
  } else if (_m_0.$ === "GDragonFlame") {
    return $mi$("Dragon Flame Bombs", 40, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 125, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 3, "chance": 60}, "tail": {$: "Nil"}}}, "Fire dragons rain on all foes.");
  } else if (_m_0.$ === "GHeadhunter") {
    return $mi$("Headhunter", 30, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 250, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SDefDown"}, "turns": 2, "chance": 70}, "tail": {$: "Nil"}}}, "Drag a foe into the earth.");
  } else if (_m_0.$ === "GSickleWeasel") {
    return $mi$("Sickle Weasel", 38, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 145, "hits": 1, "pierce": 10}, "tail": {$: "Nil"}}, "Cutting wind on all foes.");
  } else if (_m_0.$ === "GFalseDarkness") {
    return $mi$("False Darkness", 55, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 210, "hits": 1, "pierce": 40}, "tail": {$: "Nil"}}, "Black lightning. Pierces 40% DEF.");
  } else if (_m_0.$ === "GGreatWaterfall") {
    return $mi$("Great Waterfall", 60, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 240, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "A torrent crashes over every foe.");
  } else if (_m_0.$ === "GFrogKumite") {
    return $mi$("Frog Kumite", 40, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 125, "hits": 3, "pierce": 20}, "tail": {$: "Nil"}}, "Sage taijutsu: 3 hits that pierce.");
  } else if (_m_0.$ === "GRashomon") {
    return $mi$("Summoning: Rashomon", 40, {$: "AllAllies"}, {$: "Con", "head": {$: "Give", "st": {$: "SDefUp"}, "turns": 3, "chance": 100}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SGuard"}, "turns": 1, "chance": 100}, "tail": {$: "Nil"}}}, "A demon gate shields the squad.");
  } else if (_m_0.$ === "GYinHealing") {
    return $mi$("Yin Healing Seal", 60, {$: "AllAllies"}, {$: "Con", "head": {$: "Heal", "pow": 40}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SAtkUp"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}}, "Heal the squad and raise ATK.");
  } else {
    return $mi$("Multi Shadow Clone", 40, {$: "OnSelf"}, {$: "Con", "head": {$: "Give", "st": {$: "SClones"}, "turns": 3, "chance": 100}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SAtkUp"}, "turns": 3, "chance": 100}, "tail": {$: "Nil"}}}, "A hundred clones: decoys and ATK up.");
  }
}

function $move_nat$(_m_0) {
  if (_m_0.$ === "CrystalLances") {
    return 4;
  } else if (_m_0.$ === "ThunderSwords") {
    return 3;
  } else if (_m_0.$ === "RaijinSword") {
    return 3;
  } else if (_m_0.$ === "MindTransfer") {
    return 6;
  } else if (_m_0.$ === "ExplosiveSwords") {
    return 1;
  } else if (_m_0.$ === "GPhoenixFlower") {
    return 1;
  } else if (_m_0.$ === "GWaterBullet") {
    return 5;
  } else if (_m_0.$ === "GGreatBreakthrough") {
    return 2;
  } else if (_m_0.$ === "GEarthWall") {
    return 4;
  } else if (_m_0.$ === "GTagBarrage") {
    return 1;
  } else if (_m_0.$ === "GThunderHound") {
    return 3;
  } else if (_m_0.$ === "GMistVeil") {
    return 5;
  } else if (_m_0.$ === "GTreeBind") {
    return 6;
  } else if (_m_0.$ === "GHealingPalm") {
    return 7;
  } else if (_m_0.$ === "GDragonFlame") {
    return 1;
  } else if (_m_0.$ === "GHeadhunter") {
    return 4;
  } else if (_m_0.$ === "GSickleWeasel") {
    return 2;
  } else if (_m_0.$ === "GFalseDarkness") {
    return 3;
  } else if (_m_0.$ === "GGreatWaterfall") {
    return 5;
  } else if (_m_0.$ === "GFrogKumite") {
    return 7;
  } else if (_m_0.$ === "GRashomon") {
    return 7;
  } else if (_m_0.$ === "GYinHealing") {
    return 6;
  } else if (_m_0.$ === "Rasengan") {
    return 2;
  } else if (_m_0.$ === "Rasenshuriken") {
    return 2;
  } else if (_m_0.$ === "Fireball") {
    return 1;
  } else if (_m_0.$ === "Chidori") {
    return 3;
  } else if (_m_0.$ === "Amaterasu") {
    return 1;
  } else if (_m_0.$ === "CherryImpact") {
    return 4;
  } else if (_m_0.$ === "LightningBlade") {
    return 3;
  } else if (_m_0.$ === "WaterDragon") {
    return 5;
  } else if (_m_0.$ === "Kamui") {
    return 6;
  } else if (_m_0.$ === "ShadowPossession") {
    return 6;
  } else if (_m_0.$ === "ShadowNeckBind") {
    return 6;
  } else if (_m_0.$ === "ShadowStitch") {
    return 6;
  } else if (_m_0.$ === "SandCoffin") {
    return 4;
  } else if (_m_0.$ === "SandBurial") {
    return 4;
  } else if (_m_0.$ === "SandTsunami") {
    return 4;
  } else if (_m_0.$ === "SoundWave") {
    return 2;
  } else if (_m_0.$ === "WaterPrison") {
    return 5;
  } else if (_m_0.$ === "WaterShark") {
    return 5;
  } else if (_m_0.$ === "ExplodingClay") {
    return 4;
  } else if (_m_0.$ === "Tsukuyomi") {
    return 6;
  } else if (_m_0.$ === "SandBullet") {
    return 2;
  } else if (_m_0.$ === "SandPrison") {
    return 4;
  } else if (_m_0.$ === "BlueFlames") {
    return 1;
  } else if (_m_0.$ === "CoralShell") {
    return 5;
  } else if (_m_0.$ === "LavaBombs") {
    return 1;
  } else if (_m_0.$ === "SteamCharge") {
    return 5;
  } else if (_m_0.$ === "AcidBubbles") {
    return 5;
  } else if (_m_0.$ === "InkFlood") {
    return 5;
  } else if (_m_0.$ === "ChakraRoar") {
    return 7;
  } else if (_m_0.$ === "TailedBeastBomb") {
    return 7;
  } else if (_m_0.$ === "FrogKata") {
    return 7;
  } else if (_m_0.$ === "BeastBombRasengan") {
    return 7;
  } else if (_m_0.$ === "ChidoriStream") {
    return 3;
  } else if (_m_0.$ === "ChidoriSpear") {
    return 3;
  } else if (_m_0.$ === "SusanooArrow") {
    return 6;
  } else if (_m_0.$ === "ChakraFist") {
    return 4;
  } else if (_m_0.$ === "LightningHound") {
    return 3;
  } else if (_m_0.$ === "KamuiShuriken") {
    return 6;
  } else if (_m_0.$ === "KamuiRaikiri") {
    return 3;
  } else if (_m_0.$ === "AfternoonTiger") {
    return 2;
  } else if (_m_0.$ === "VacuumPalm") {
    return 2;
  } else if (_m_0.$ === "ShadowSewing") {
    return 6;
  } else if (_m_0.$ === "ShadowShuriken") {
    return 6;
  } else if (_m_0.$ === "FlyingSwallow") {
    return 2;
  } else if (_m_0.$ === "SandShuriken") {
    return 4;
  } else if (_m_0.$ === "SandSpear") {
    return 4;
  } else if (_m_0.$ === "SandFuneral") {
    return 4;
  } else if (_m_0.$ === "ToadOil") {
    return 1;
  } else if (_m_0.$ === "HawkGale") {
    return 2;
  } else if (_m_0.$ === "MonkeyStaff") {
    return 4;
  } else if (_m_0.$ === "WeaselScythe") {
    return 2;
  } else if (_m_0.$ === "AirCutter") {
    return 2;
  } else if (_m_0.$ === "RainNeedles") {
    return 5;
  } else if (_m_0.$ === "ShadowSnakes") {
    return 6;
  } else if (_m_0.$ === "EarthDome") {
    return 4;
  } else if (_m_0.$ === "DemonFlute") {
    return 6;
  } else if (_m_0.$ === "PressureDamage") {
    return 1;
  } else if (_m_0.$ === "EarthGrudge") {
    return 4;
  } else {
    return 0;
  }
}

function $move_cd$(_m_0) {
  if (_m_0.$ === "GShurikenStorm") {
    return 1;
  } else if (_m_0.$ === "GPhoenixFlower") {
    return 1;
  } else if (_m_0.$ === "GWaterBullet") {
    return 1;
  } else if (_m_0.$ === "GGreatBreakthrough") {
    return 2;
  } else if (_m_0.$ === "GEarthWall") {
    return 3;
  } else if (_m_0.$ === "GSubstitution") {
    return 2;
  } else if (_m_0.$ === "GTagBarrage") {
    return 2;
  } else if (_m_0.$ === "GBodyFlicker") {
    return 1;
  } else if (_m_0.$ === "GThunderHound") {
    return 2;
  } else if (_m_0.$ === "GMistVeil") {
    return 3;
  } else if (_m_0.$ === "GTreeBind") {
    return 3;
  } else if (_m_0.$ === "GHealingPalm") {
    return 2;
  } else if (_m_0.$ === "GDragonFlame") {
    return 3;
  } else if (_m_0.$ === "GHeadhunter") {
    return 2;
  } else if (_m_0.$ === "GSickleWeasel") {
    return 2;
  } else if (_m_0.$ === "GFalseDarkness") {
    return 4;
  } else if (_m_0.$ === "GGreatWaterfall") {
    return 4;
  } else if (_m_0.$ === "GFrogKumite") {
    return 3;
  } else if (_m_0.$ === "GRashomon") {
    return 4;
  } else if (_m_0.$ === "GYinHealing") {
    return 5;
  } else if (_m_0.$ === "GMultiClone") {
    return 4;
  } else if (_m_0.$ === "ShadowClone") {
    return 3;
  } else if (_m_0.$ === "Rasengan") {
    return 2;
  } else if (_m_0.$ === "Rasenshuriken") {
    return 4;
  } else if (_m_0.$ === "Fireball") {
    return 1;
  } else if (_m_0.$ === "Chidori") {
    return 2;
  } else if (_m_0.$ === "Amaterasu") {
    return 4;
  } else if (_m_0.$ === "MysticPalm") {
    return 1;
  } else if (_m_0.$ === "CherryImpact") {
    return 2;
  } else if (_m_0.$ === "HealingWave") {
    return 3;
  } else if (_m_0.$ === "CreationRebirth") {
    return 5;
  } else if (_m_0.$ === "LightningBlade") {
    return 2;
  } else if (_m_0.$ === "WaterDragon") {
    return 2;
  } else if (_m_0.$ === "NinjaHounds") {
    return 3;
  } else if (_m_0.$ === "Kamui") {
    return 4;
  } else if (_m_0.$ === "PrimaryLotus") {
    return 2;
  } else if (_m_0.$ === "OpenGates") {
    return 4;
  } else if (_m_0.$ === "MorningPeacock") {
    return 4;
  } else if (_m_0.$ === "Rotation") {
    return 2;
  } else if (_m_0.$ === "SixtyFourPalms") {
    return 3;
  } else if (_m_0.$ === "TwinLions") {
    return 4;
  } else if (_m_0.$ === "ShadowPossession") {
    return 3;
  } else if (_m_0.$ === "Strategy") {
    return 4;
  } else if (_m_0.$ === "ShadowNeckBind") {
    return 2;
  } else if (_m_0.$ === "ShadowStitch") {
    return 4;
  } else if (_m_0.$ === "SandCoffin") {
    return 2;
  } else if (_m_0.$ === "SandShield") {
    return 4;
  } else if (_m_0.$ === "SandBurial") {
    return 3;
  } else if (_m_0.$ === "SandTsunami") {
    return 4;
  } else if (_m_0.$ === "ChakraArm") {
    return 1;
  } else if (_m_0.$ === "FrogKata") {
    return 2;
  } else if (_m_0.$ === "BeastBombRasengan") {
    return 3;
  } else if (_m_0.$ === "ChidoriStream") {
    return 2;
  } else if (_m_0.$ === "ChidoriSpear") {
    return 2;
  } else if (_m_0.$ === "SusanooArrow") {
    return 3;
  } else if (_m_0.$ === "ChakraFist") {
    return 1;
  } else if (_m_0.$ === "ByakugouHeal") {
    return 3;
  } else if (_m_0.$ === "KatsuyuDivision") {
    return 3;
  } else if (_m_0.$ === "LightningHound") {
    return 2;
  } else if (_m_0.$ === "KamuiShuriken") {
    return 2;
  } else if (_m_0.$ === "KamuiRaikiri") {
    return 3;
  } else if (_m_0.$ === "HiddenLotus") {
    return 2;
  } else if (_m_0.$ === "AfternoonTiger") {
    return 3;
  } else if (_m_0.$ === "EveningElephant") {
    return 3;
  } else if (_m_0.$ === "VacuumPalm") {
    return 1;
  } else if (_m_0.$ === "ProtectiveTrigrams") {
    return 4;
  } else if (_m_0.$ === "TwinLionCrush") {
    return 3;
  } else if (_m_0.$ === "ShadowSewing") {
    return 3;
  } else if (_m_0.$ === "ShadowShuriken") {
    return 2;
  } else if (_m_0.$ === "FlyingSwallow") {
    return 2;
  } else if (_m_0.$ === "SandShuriken") {
    return 1;
  } else if (_m_0.$ === "SandSpear") {
    return 2;
  } else if (_m_0.$ === "SandFuneral") {
    return 4;
  } else {
    return 0;
  }
}

function $tool_id$(_t_0) {
  if (_t_0.$ === "Kunai") {
    return 0;
  } else if (_t_0.$ === "Shuriken") {
    return 1;
  } else if (_t_0.$ === "PaperBomb") {
    return 2;
  } else if (_t_0.$ === "SmokeBomb") {
    return 3;
  } else if (_t_0.$ === "SoldierPill") {
    return 4;
  } else if (_t_0.$ === "Medicine") {
    return 5;
  } else if (_t_0.$ === "Antidote") {
    return 6;
  } else {
    return 7;
  }
}

function $tool_is$(_a_0, _b_0) {
  const _x_0 = ($tool_id$(_a_0));
  const _x_1 = ($tool_id$(_b_0));
  return (_x_0 === _x_1);
}

function $tool_info$(_t_0) {
  if (_t_0.$ === "Kunai") {
    return $mi$("Kunai", 15, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 140, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "Thrown blade. Solid single-target damage.");
  } else if (_t_0.$ === "Shuriken") {
    return $mi$("Shuriken Volley", 20, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 65, "hits": 1, "pierce": 0}, "tail": {$: "Nil"}}, "Hits every foe.");
  } else if (_t_0.$ === "PaperBomb") {
    return $mi$("Paper Bomb", 40, {$: "AllFoes"}, {$: "Con", "head": {$: "Hit", "stat": {$: "NinS"}, "pow": 150, "hits": 1, "pierce": 0}, "tail": {$: "Con", "head": {$: "Give", "st": {$: "SBurn"}, "turns": 2, "chance": 40}, "tail": {$: "Nil"}}}, "Explosive tag. Hits all, may burn.");
  } else if (_t_0.$ === "SmokeBomb") {
    return $mi$("Smoke Bomb", 35, {$: "OnSelf"}, {$: "Con", "head": {$: "Flee"}, "tail": {$: "Nil"}}, "Escape the battle.");
  } else if (_t_0.$ === "SoldierPill") {
    return $mi$("Soldier Pill", 30, {$: "OneAlly"}, {$: "Con", "head": {$: "Chakra", "amt": 50}, "tail": {$: "Nil"}}, "Restores 50 chakra.");
  } else if (_t_0.$ === "Medicine") {
    return $mi$("Medicine", 25, {$: "OneAlly"}, {$: "Con", "head": {$: "Heal", "pow": 40}, "tail": {$: "Nil"}}, "Heals about 40% HP.");
  } else if (_t_0.$ === "Antidote") {
    return $mi$("Antidote", 15, {$: "OneAlly"}, {$: "Con", "head": {$: "Cleanse"}, "tail": {$: "Nil"}}, "Cures burn, poison and stun.");
  } else {
    return $mi$("Revival Scroll", 80, {$: "DownAlly"}, {$: "Con", "head": {$: "Revive", "pow": 35}, "tail": {$: "Nil"}}, "Revives a fallen ally with 35% HP.");
  }
}

function $all_tools$() {
  return {$: "Con", "head": {$: "Kunai"}, "tail": {$: "Con", "head": {$: "Shuriken"}, "tail": {$: "Con", "head": {$: "PaperBomb"}, "tail": {$: "Con", "head": {$: "SmokeBomb"}, "tail": {$: "Con", "head": {$: "SoldierPill"}, "tail": {$: "Con", "head": {$: "Medicine"}, "tail": {$: "Con", "head": {$: "Antidote"}, "tail": {$: "Con", "head": {$: "RevivalScroll"}, "tail": {$: "Nil"}}}}}}}}};
}

function $art_id$(_a_0) {
  if (_a_0.$ === "HokageHat") {
    return 0;
  } else if (_a_0.$ === "ChuninVest") {
    return 1;
  } else if (_a_0.$ === "ToadContract") {
    return 2;
  } else if (_a_0.$ === "SanninScroll") {
    return 3;
  } else if (_a_0.$ === "LegWeights") {
    return 4;
  } else if (_a_0.$ === "Kubikiribocho") {
    return 5;
  } else if (_a_0.$ === "RamenCoupon") {
    return 6;
  } else if (_a_0.$ === "SharinganEye") {
    return 7;
  } else if (_a_0.$ === "SharkSkin") {
    return 8;
  } else if (_a_0.$ === "SandGourd") {
    return 9;
  } else if (_a_0.$ === "AkatsukiRing") {
    return 10;
  } else if (_a_0.$ === "AsumaBlades") {
    return 11;
  } else if (_a_0.$ === "FrogOil") {
    return 12;
  } else if (_a_0.$ === "GamaWallet") {
    return 13;
  } else if (_a_0.$ === "FirstNecklace") {
    return 14;
  } else if (_a_0.$ === "EightTrigramsKey") {
    return 15;
  } else if (_a_0.$ === "UchihaCrest") {
    return 16;
  } else if (_a_0.$ === "SlugContract") {
    return 17;
  } else if (_a_0.$ === "ObitosEye") {
    return 18;
  } else if (_a_0.$ === "GreenBeastSuit") {
    return 19;
  } else if (_a_0.$ === "MoonCharm") {
    return 20;
  } else if (_a_0.$ === "AsumaLighter") {
    return 21;
  } else if (_a_0.$ === "KazekageHat") {
    return 22;
  } else if (_a_0.$ === "IchaIcha") {
    return 23;
  } else if (_a_0.$ === "KakashiBells") {
    return 24;
  } else if (_a_0.$ === "HiruzenPipe") {
    return 25;
  } else if (_a_0.$ === "CursedSeal") {
    return 26;
  } else if (_a_0.$ === "ToadSageScroll") {
    return 27;
  } else {
    return 28;
  }
}

function $art_name$(_a_0) {
  if (_a_0.$ === "HokageHat") {
    return "Hokage's Hat";
  } else if (_a_0.$ === "ChuninVest") {
    return "Chunin Flak Vest";
  } else if (_a_0.$ === "ToadContract") {
    return "Toad Contract";
  } else if (_a_0.$ === "SanninScroll") {
    return "Sannin's Scroll";
  } else if (_a_0.$ === "LegWeights") {
    return "Lee's Leg Weights";
  } else if (_a_0.$ === "Kubikiribocho") {
    return "Kubikiribocho";
  } else if (_a_0.$ === "RamenCoupon") {
    return "Ichiraku Coupon";
  } else if (_a_0.$ === "SharinganEye") {
    return "Sharingan Implant";
  } else if (_a_0.$ === "SharkSkin") {
    return "Sharkskin Wraps";
  } else if (_a_0.$ === "SandGourd") {
    return "Sand Gourd";
  } else if (_a_0.$ === "AkatsukiRing") {
    return "Akatsuki Ring";
  } else if (_a_0.$ === "AsumaBlades") {
    return "Asuma's Trench Knives";
  } else if (_a_0.$ === "FrogOil") {
    return "Sage Frog Oil";
  } else if (_a_0.$ === "GamaWallet") {
    return "Gama-chan Wallet";
  } else if (_a_0.$ === "FirstNecklace") {
    return "First Hokage's Necklace";
  } else if (_a_0.$ === "EightTrigramsKey") {
    return "Eight Trigrams Key";
  } else if (_a_0.$ === "UchihaCrest") {
    return "Uchiha Crest";
  } else if (_a_0.$ === "SlugContract") {
    return "Slug Contract";
  } else if (_a_0.$ === "ObitosEye") {
    return "Obito's Eye";
  } else if (_a_0.$ === "GreenBeastSuit") {
    return "Green Beast Jumpsuit";
  } else if (_a_0.$ === "MoonCharm") {
    return "Hamura's Moon Charm";
  } else if (_a_0.$ === "AsumaLighter") {
    return "Asuma's Lighter";
  } else if (_a_0.$ === "KazekageHat") {
    return "Kazekage's Hat";
  } else if (_a_0.$ === "IchaIcha") {
    return "Icha Icha Paradise";
  } else if (_a_0.$ === "KakashiBells") {
    return "Kakashi's Bells";
  } else if (_a_0.$ === "HiruzenPipe") {
    return "Hiruzen's Pipe";
  } else if (_a_0.$ === "CursedSeal") {
    return "Cursed Seal of Heaven";
  } else if (_a_0.$ === "ToadSageScroll") {
    return "Toad Sage Scroll";
  } else {
    return "Samehada Scale";
  }
}

function $art_desc$(_a_0) {
  if (_a_0.$ === "HokageHat") {
    return "+15% max HP for the squad.";
  } else if (_a_0.$ === "ChuninVest") {
    return "+6 DEF for the squad.";
  } else if (_a_0.$ === "ToadContract") {
    return "Start every battle with +30 chakra.";
  } else if (_a_0.$ === "SanninScroll") {
    return "Ninjutsu deal +20% damage.";
  } else if (_a_0.$ === "LegWeights") {
    return "+12% Haste for the squad.";
  } else if (_a_0.$ === "Kubikiribocho") {
    return "Taijutsu deal +30% damage.";
  } else if (_a_0.$ === "RamenCoupon") {
    return "Heal 20% HP after every battle.";
  } else if (_a_0.$ === "SharinganEye") {
    return "+12% critical hit chance.";
  } else if (_a_0.$ === "SharkSkin") {
    return "Taijutsu hits steal 5 chakra.";
  } else if (_a_0.$ === "SandGourd") {
    return "10% chance to block any hit.";
  } else if (_a_0.$ === "AkatsukiRing") {
    return "+25% damage against tailed beasts.";
  } else if (_a_0.$ === "AsumaBlades") {
    return "+30% Defense Penetration.";
  } else if (_a_0.$ === "FrogOil") {
    return "Chakra regenerates twice as fast in battle.";
  } else if (_a_0.$ === "GamaWallet") {
    return "+50% ryo from battles.";
  } else if (_a_0.$ === "FirstNecklace") {
    return "Every ninja survives one lethal blow per battle.";
  } else if (_a_0.$ === "EightTrigramsKey") {
    return "Unlocks Naruto's third form: Kurama Link Mode.";
  } else if (_a_0.$ === "UchihaCrest") {
    return "Unlocks Sasuke's third form: Mangekyo Sharingan.";
  } else if (_a_0.$ === "SlugContract") {
    return "Unlocks Sakura's third form: Katsuyu Bond.";
  } else if (_a_0.$ === "ObitosEye") {
    return "Unlocks Kakashi's third form: Six Paths Sharingan.";
  } else if (_a_0.$ === "GreenBeastSuit") {
    return "Unlocks Lee's third form: Night Guy.";
  } else if (_a_0.$ === "MoonCharm") {
    return "Unlocks Hinata's third form: Hamura's Byakugan.";
  } else if (_a_0.$ === "AsumaLighter") {
    return "Unlocks Shikamaru's third form: Will of Asuma.";
  } else if (_a_0.$ === "KazekageHat") {
    return "Unlocks Gaara's third form: Kazekage's Sand.";
  } else if (_a_0.$ === "IchaIcha") {
    return "Jiraiya's novel. Kakashi swears by it. +25% Crit Damage.";
  } else if (_a_0.$ === "KakashiBells") {
    return "From the bell test: teamwork above all. +10% Damage.";
  } else if (_a_0.$ === "HiruzenPipe") {
    return "The Professor knew every jutsu in Konoha. Jutsu cooldowns -1.";
  } else if (_a_0.$ === "CursedSeal") {
    return "Orochimaru's mark. Power at a price. +25% ATK.";
  } else if (_a_0.$ === "ToadSageScroll") {
    return "Fukasaku's notes on sage training. All jutsu +1 level.";
  } else {
    return "A scale from the sword that eats chakra. +30 max chakra.";
  }
}

function $all_arts$() {
  return {$: "Con", "head": {$: "HokageHat"}, "tail": {$: "Con", "head": {$: "ChuninVest"}, "tail": {$: "Con", "head": {$: "ToadContract"}, "tail": {$: "Con", "head": {$: "SanninScroll"}, "tail": {$: "Con", "head": {$: "LegWeights"}, "tail": {$: "Con", "head": {$: "Kubikiribocho"}, "tail": {$: "Con", "head": {$: "RamenCoupon"}, "tail": {$: "Con", "head": {$: "SharinganEye"}, "tail": {$: "Con", "head": {$: "SharkSkin"}, "tail": {$: "Con", "head": {$: "SandGourd"}, "tail": {$: "Con", "head": {$: "AkatsukiRing"}, "tail": {$: "Con", "head": {$: "AsumaBlades"}, "tail": {$: "Con", "head": {$: "FrogOil"}, "tail": {$: "Con", "head": {$: "GamaWallet"}, "tail": {$: "Con", "head": {$: "FirstNecklace"}, "tail": {$: "Con", "head": {$: "KakashiBells"}, "tail": {$: "Con", "head": {$: "HiruzenPipe"}, "tail": {$: "Con", "head": {$: "ToadSageScroll"}, "tail": {$: "Con", "head": {$: "SamehadaScale"}, "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}};
}

function $form_relic$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return {$: "EightTrigramsKey"};
  } else if (_w_0.$ === "Sasuke") {
    return {$: "UchihaCrest"};
  } else if (_w_0.$ === "Sakura") {
    return {$: "SlugContract"};
  } else if (_w_0.$ === "Kakashi") {
    return {$: "ObitosEye"};
  } else if (_w_0.$ === "Lee") {
    return {$: "GreenBeastSuit"};
  } else if (_w_0.$ === "Hinata") {
    return {$: "MoonCharm"};
  } else if (_w_0.$ === "Shikamaru") {
    return {$: "AsumaLighter"};
  } else {
    return {$: "KazekageHat"};
  }
}

function $has_art$(_arts_0, _a_0) {
  if (_arts_0.$ === "Nil") {
    return false;
  } else {
    const _h_0 = _arts_0["head"];
    const _t_0 = _arts_0["tail"];
    const _x_0 = ($art_id$(_h_0));
    const _x_1 = ($art_id$(_a_0));
    const _x_2 = (_x_0 === _x_1);
    const _x_3 = ($has_art$(_t_0, _a_0));
    return (_x_2 || _x_3);
  }
}

function $beast_names$() {
  return {$: "Con", "head": "Shukaku", "tail": {$: "Con", "head": "Matatabi", "tail": {$: "Con", "head": "Isobu", "tail": {$: "Con", "head": "Son Goku", "tail": {$: "Con", "head": "Kokuo", "tail": {$: "Con", "head": "Saiken", "tail": {$: "Con", "head": "Chomei", "tail": {$: "Con", "head": "Gyuki", "tail": {$: "Con", "head": "Kurama", "tail": {$: "Nil"}}}}}}}}}};
}

function $beast_name$(_t_0) {
  const _x_0 = ($sub0$(_t_0, 1));
  return $Maybe$default$(($List$get$(($beast_names$()), _x_0)), "Tailed Beast");
}

function $beast_title$(_t_0) {
  const _x_0 = ($beast_name$(_t_0));
  const _x_1 = ($U32$show$(_t_0));
  const _x_2 = ("-Tails, " + _x_0);
  const _x_3 = (_x_1 + _x_2);
  return ("The " + _x_3);
}

function $beast_move_table$() {
  return {$: "Con", "head": {$: "Con", "head": {$: "TailSwipe"}, "tail": {$: "Con", "head": {$: "SandBullet"}, "tail": {$: "Con", "head": {$: "SandPrison"}, "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "TailSwipe"}, "tail": {$: "Con", "head": {$: "BlueFlames"}, "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "TailSwipe"}, "tail": {$: "Con", "head": {$: "CoralShell"}, "tail": {$: "Con", "head": {$: "WaterShark"}, "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "TailSwipe"}, "tail": {$: "Con", "head": {$: "LavaBombs"}, "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "TailSwipe"}, "tail": {$: "Con", "head": {$: "SteamCharge"}, "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "TailSwipe"}, "tail": {$: "Con", "head": {$: "AcidBubbles"}, "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "TailSwipe"}, "tail": {$: "Con", "head": {$: "ScalePowder"}, "tail": {$: "Con", "head": {$: "HiddenMist"}, "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "TentacleLariat"}, "tail": {$: "Con", "head": {$: "InkFlood"}, "tail": {$: "Con", "head": {$: "TentacleLariat"}, "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "FoxClaws"}, "tail": {$: "Con", "head": {$: "ChakraRoar"}, "tail": {$: "Con", "head": {$: "BlueFlames"}, "tail": {$: "Nil"}}}}, "tail": {$: "Nil"}}}}}}}}}};
}

function $beast_moves$(_t_0) {
  const _x_0 = ($sub0$(_t_0, 1));
  return $Maybe$default$(($List$get$(($beast_move_table$()), _x_0)), {$: "Con", "head": {$: "TailSwipe"}, "tail": {$: "Nil"}});
}

function $foe_info$(_f_0) {
  if (_f_0.$ === "Zori") {
    return {$: "FoeInfo", "name": "Zori", "hp": 60, "atk": 15, "nin": 6, "dfn": 7, "spd": 10, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "Ambush"}, "tail": {$: "Nil"}}}, "xp": 7, "ryo": 14};
  } else if (_f_0.$ === "Waraji") {
    return {$: "FoeInfo", "name": "Waraji", "hp": 70, "atk": 16, "nin": 6, "dfn": 8, "spd": 9, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "Ambush"}, "tail": {$: "Nil"}}}, "xp": 7, "ryo": 14};
  } else if (_f_0.$ === "Gozu") {
    return {$: "FoeInfo", "name": "Gozu", "hp": 150, "atk": 20, "nin": 12, "dfn": 10, "spd": 14, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "ChainShred"}, "tail": {$: "Nil"}}}, "xp": 22, "ryo": 40};
  } else if (_f_0.$ === "Meizu") {
    return {$: "FoeInfo", "name": "Meizu", "hp": 150, "atk": 20, "nin": 12, "dfn": 10, "spd": 14, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "ChainShred"}, "tail": {$: "Nil"}}}, "xp": 22, "ryo": 40};
  } else if (_f_0.$ === "Oboro") {
    return {$: "FoeInfo", "name": "Oboro", "hp": 70, "atk": 13, "nin": 16, "dfn": 8, "spd": 12, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "CloneAmbush"}, "tail": {$: "Nil"}}}, "xp": 8, "ryo": 15};
  } else if (_f_0.$ === "Mizuki") {
    return {$: "FoeInfo", "name": "Mizuki", "hp": 90, "atk": 18, "nin": 14, "dfn": 9, "spd": 12, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "GiantShuriken"}, "tail": {$: "Nil"}}}, "xp": 10, "ryo": 18};
  } else if (_f_0.$ === "Dosu") {
    return {$: "FoeInfo", "name": "Dosu", "hp": 85, "atk": 16, "nin": 18, "dfn": 9, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "SoundWave"}, "tail": {$: "Nil"}}}, "xp": 11, "ryo": 18};
  } else if (_f_0.$ === "Zaku") {
    return {$: "FoeInfo", "name": "Zaku", "hp": 80, "atk": 14, "nin": 20, "dfn": 9, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "AirCutter"}, "tail": {$: "Nil"}}}, "xp": 11, "ryo": 18};
  } else if (_f_0.$ === "Kin") {
    return {$: "FoeInfo", "name": "Kin", "hp": 75, "atk": 13, "nin": 18, "dfn": 8, "spd": 15, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "BellGenjutsu"}, "tail": {$: "Nil"}}}, "xp": 11, "ryo": 18};
  } else if (_f_0.$ === "Yoroi") {
    return {$: "FoeInfo", "name": "Yoroi", "hp": 90, "atk": 17, "nin": 16, "dfn": 10, "spd": 12, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "DrainFist"}, "tail": {$: "Nil"}}}, "xp": 12, "ryo": 20};
  } else if (_f_0.$ === "Misumi") {
    return {$: "FoeInfo", "name": "Misumi", "hp": 90, "atk": 16, "nin": 14, "dfn": 11, "spd": 12, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "SoftBind"}, "tail": {$: "Nil"}}}, "xp": 12, "ryo": 20};
  } else if (_f_0.$ === "RainNinja") {
    return {$: "FoeInfo", "name": "Rain Shinobi", "hp": 80, "atk": 15, "nin": 18, "dfn": 9, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "RainNeedles"}, "tail": {$: "Nil"}}}, "xp": 11, "ryo": 18};
  } else if (_f_0.$ === "RootAnbu") {
    return {$: "FoeInfo", "name": "Root ANBU", "hp": 100, "atk": 20, "nin": 20, "dfn": 12, "spd": 15, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "InkBeasts"}, "tail": {$: "Nil"}}}, "xp": 14, "ryo": 24};
  } else if (_f_0.$ === "WhiteZetsu") {
    return {$: "FoeInfo", "name": "White Zetsu", "hp": 95, "atk": 18, "nin": 18, "dfn": 11, "spd": 12, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "SporeDrain"}, "tail": {$: "Nil"}}}, "xp": 13, "ryo": 22};
  } else if (_f_0.$ === "Haku") {
    return {$: "FoeInfo", "name": "Haku", "hp": 210, "atk": 18, "nin": 26, "dfn": 12, "spd": 22, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "DemonMirror"}, "tail": {$: "Con", "head": {$: "HiddenMist"}, "tail": {$: "Nil"}}}}, "xp": 35, "ryo": 60};
  } else if (_f_0.$ === "Zabuza") {
    return {$: "FoeInfo", "name": "Zabuza", "hp": 270, "atk": 30, "nin": 20, "dfn": 15, "spd": 16, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "SilentKill"}, "tail": {$: "Con", "head": {$: "WaterPrison"}, "tail": {$: "Con", "head": {$: "HiddenMist"}, "tail": {$: "Nil"}}}}}, "xp": 40, "ryo": 70};
  } else if (_f_0.$ === "Kabuto") {
    return {$: "FoeInfo", "name": "Kabuto", "hp": 250, "atk": 20, "nin": 28, "dfn": 16, "spd": 16, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "ChakraScalpel"}, "tail": {$: "Con", "head": {$: "MysticPalm"}, "tail": {$: "Nil"}}}}, "xp": 40, "ryo": 70};
  } else if (_f_0.$ === "Orochimaru") {
    return {$: "FoeInfo", "name": "Orochimaru", "hp": 320, "atk": 24, "nin": 34, "dfn": 16, "spd": 18, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "ShadowSnakes"}, "tail": {$: "Con", "head": {$: "KusanagiStrike"}, "tail": {$: "Nil"}}}}, "xp": 60, "ryo": 110};
  } else if (_f_0.$ === "Jirobo") {
    return {$: "FoeInfo", "name": "Jirobo", "hp": 300, "atk": 30, "nin": 18, "dfn": 20, "spd": 10, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "EarthDome"}, "tail": {$: "Nil"}}}, "xp": 45, "ryo": 80};
  } else if (_f_0.$ === "Kidomaru") {
    return {$: "FoeInfo", "name": "Kidomaru", "hp": 260, "atk": 22, "nin": 24, "dfn": 14, "spd": 18, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "SpiderArrow"}, "tail": {$: "Nil"}}}, "xp": 45, "ryo": 80};
  } else if (_f_0.$ === "Tayuya") {
    return {$: "FoeInfo", "name": "Tayuya", "hp": 240, "atk": 16, "nin": 30, "dfn": 13, "spd": 17, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "DemonFlute"}, "tail": {$: "Nil"}}}, "xp": 45, "ryo": 80};
  } else if (_f_0.$ === "Sakon") {
    return {$: "FoeInfo", "name": "Sakon", "hp": 280, "atk": 28, "nin": 22, "dfn": 15, "spd": 16, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "TwinDemon"}, "tail": {$: "Nil"}}}, "xp": 45, "ryo": 80};
  } else if (_f_0.$ === "Kimimaro") {
    return {$: "FoeInfo", "name": "Kimimaro", "hp": 380, "atk": 32, "nin": 20, "dfn": 18, "spd": 17, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "Clematis"}, "tail": {$: "Con", "head": {$: "SoftBind"}, "tail": {$: "Nil"}}}}, "xp": 60, "ryo": 110};
  } else if (_f_0.$ === "Kisame") {
    return {$: "FoeInfo", "name": "Kisame", "hp": 400, "atk": 32, "nin": 28, "dfn": 20, "spd": 15, "moves": {$: "Con", "head": {$: "SharkBite"}, "tail": {$: "Con", "head": {$: "WaterShark"}, "tail": {$: "Con", "head": {$: "WaterPrison"}, "tail": {$: "Nil"}}}}, "xp": 60, "ryo": 110};
  } else if (_f_0.$ === "Deidara") {
    return {$: "FoeInfo", "name": "Deidara", "hp": 330, "atk": 18, "nin": 36, "dfn": 15, "spd": 19, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "ExplodingClay"}, "tail": {$: "Con", "head": {$: "ExplodingClay"}, "tail": {$: "Nil"}}}}, "xp": 60, "ryo": 110};
  } else if (_f_0.$ === "Itachi") {
    return {$: "FoeInfo", "name": "Itachi", "hp": 370, "atk": 26, "nin": 38, "dfn": 18, "spd": 22, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "Fireball"}, "tail": {$: "Con", "head": {$: "Tsukuyomi"}, "tail": {$: "Con", "head": {$: "Amaterasu"}, "tail": {$: "Nil"}}}}}, "xp": 70, "ryo": 130};
  } else if (_f_0.$ === "Hidan") {
    return {$: "FoeInfo", "name": "Hidan", "hp": 360, "atk": 32, "nin": 20, "dfn": 14, "spd": 15, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "JashinRitual"}, "tail": {$: "Nil"}}}, "xp": 55, "ryo": 100};
  } else if (_f_0.$ === "Kakuzu") {
    return {$: "FoeInfo", "name": "Kakuzu", "hp": 380, "atk": 26, "nin": 34, "dfn": 20, "spd": 13, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "PressureDamage"}, "tail": {$: "Con", "head": {$: "EarthGrudge"}, "tail": {$: "Nil"}}}}, "xp": 55, "ryo": 100};
  } else if (_f_0.$ === "Sasori") {
    return {$: "FoeInfo", "name": "Sasori", "hp": 360, "atk": 22, "nin": 34, "dfn": 18, "spd": 16, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "IronSand"}, "tail": {$: "Nil"}}}, "xp": 65, "ryo": 120};
  } else if (_f_0.$ === "Mubi") {
    return {$: "FoeInfo", "name": "Mubi", "hp": 70, "atk": 13, "nin": 17, "dfn": 8, "spd": 12, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "DrainFist"}, "tail": {$: "Nil"}}}, "xp": 8, "ryo": 15};
  } else if (_f_0.$ === "Kagari") {
    return {$: "FoeInfo", "name": "Kagari", "hp": 75, "atk": 15, "nin": 14, "dfn": 8, "spd": 12, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "CloneAmbush"}, "tail": {$: "Nil"}}}, "xp": 8, "ryo": 15};
  } else if (_f_0.$ === "Kamikiri") {
    return {$: "FoeInfo", "name": "Kamikiri", "hp": 85, "atk": 18, "nin": 10, "dfn": 9, "spd": 11, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "ChainShred"}, "tail": {$: "Nil"}}}, "xp": 9, "ryo": 16};
  } else if (_f_0.$ === "Hanzaki") {
    return {$: "FoeInfo", "name": "Hanzaki", "hp": 80, "atk": 16, "nin": 14, "dfn": 9, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "GiantShuriken"}, "tail": {$: "Nil"}}}, "xp": 9, "ryo": 16};
  } else if (_f_0.$ === "Jigumo") {
    return {$: "FoeInfo", "name": "Jigumo", "hp": 90, "atk": 17, "nin": 12, "dfn": 10, "spd": 10, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "SoftBind"}, "tail": {$: "Nil"}}}, "xp": 9, "ryo": 16};
  } else if (_f_0.$ === "Kagero") {
    return {$: "FoeInfo", "name": "Kagero", "hp": 70, "atk": 12, "nin": 18, "dfn": 8, "spd": 14, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "BellGenjutsu"}, "tail": {$: "Nil"}}}, "xp": 9, "ryo": 16};
  } else if (_f_0.$ === "Raiga") {
    return {$: "FoeInfo", "name": "Raiga", "hp": 260, "atk": 28, "nin": 26, "dfn": 14, "spd": 16, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "ThunderSwords"}, "tail": {$: "Con", "head": {$: "HiddenMist"}, "tail": {$: "Nil"}}}}, "xp": 40, "ryo": 70};
  } else if (_f_0.$ === "Aoi") {
    return {$: "FoeInfo", "name": "Aoi Rokusho", "hp": 240, "atk": 26, "nin": 26, "dfn": 14, "spd": 17, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "RaijinSword"}, "tail": {$: "Nil"}}}, "xp": 40, "ryo": 70};
  } else if (_f_0.$ === "Shigure") {
    return {$: "FoeInfo", "name": "Shigure", "hp": 85, "atk": 15, "nin": 18, "dfn": 9, "spd": 14, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "RainNeedles"}, "tail": {$: "Nil"}}}, "xp": 11, "ryo": 18};
  } else if (_f_0.$ === "Kankuro") {
    return {$: "FoeInfo", "name": "Kankuro", "hp": 95, "atk": 14, "nin": 20, "dfn": 10, "spd": 12, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "CrowPuppet"}, "tail": {$: "Nil"}}}, "xp": 12, "ryo": 20};
  } else if (_f_0.$ === "Temari") {
    return {$: "FoeInfo", "name": "Temari", "hp": 90, "atk": 14, "nin": 22, "dfn": 9, "spd": 14, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "AirCutter"}, "tail": {$: "Nil"}}}, "xp": 12, "ryo": 20};
  } else if (_f_0.$ === "Baki") {
    return {$: "FoeInfo", "name": "Baki", "hp": 110, "atk": 20, "nin": 20, "dfn": 11, "spd": 14, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "AirCutter"}, "tail": {$: "Nil"}}}, "xp": 13, "ryo": 22};
  } else if (_f_0.$ === "Fu") {
    return {$: "FoeInfo", "name": "Fu Yamanaka", "hp": 100, "atk": 18, "nin": 22, "dfn": 11, "spd": 14, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "MindTransfer"}, "tail": {$: "Nil"}}}, "xp": 14, "ryo": 24};
  } else if (_f_0.$ === "Torune") {
    return {$: "FoeInfo", "name": "Torune", "hp": 110, "atk": 20, "nin": 18, "dfn": 12, "spd": 13, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "BugSwarm"}, "tail": {$: "Nil"}}}, "xp": 14, "ryo": 24};
  } else if (_f_0.$ === "Guren") {
    return {$: "FoeInfo", "name": "Guren", "hp": 120, "atk": 18, "nin": 26, "dfn": 12, "spd": 15, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "CrystalLances"}, "tail": {$: "Nil"}}}, "xp": 15, "ryo": 26};
  } else if (_f_0.$ === "Kigiri") {
    return {$: "FoeInfo", "name": "Kigiri", "hp": 100, "atk": 22, "nin": 16, "dfn": 11, "spd": 14, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "ChainShred"}, "tail": {$: "Nil"}}}, "xp": 14, "ryo": 24};
  } else if (_f_0.$ === "Nurari") {
    return {$: "FoeInfo", "name": "Nurari", "hp": 95, "atk": 16, "nin": 22, "dfn": 10, "spd": 15, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "SoftBind"}, "tail": {$: "Nil"}}}, "xp": 14, "ryo": 24};
  } else if (_f_0.$ === "Kiseru") {
    return {$: "FoeInfo", "name": "Kiseru", "hp": 100, "atk": 15, "nin": 24, "dfn": 10, "spd": 14, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "ExplodingClay"}, "tail": {$: "Nil"}}}, "xp": 14, "ryo": 24};
  } else if (_f_0.$ === "Rinji") {
    return {$: "FoeInfo", "name": "Rinji", "hp": 110, "atk": 22, "nin": 16, "dfn": 12, "spd": 13, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "DrainFist"}, "tail": {$: "Nil"}}}, "xp": 14, "ryo": 24};
  } else if (_f_0.$ === "Ameyuri") {
    return {$: "FoeInfo", "name": "Ameyuri Ringo", "hp": 110, "atk": 22, "nin": 22, "dfn": 11, "spd": 16, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "ThunderSwords"}, "tail": {$: "Nil"}}}, "xp": 15, "ryo": 26};
  } else if (_f_0.$ === "Jinpachi") {
    return {$: "FoeInfo", "name": "Jinpachi", "hp": 120, "atk": 26, "nin": 16, "dfn": 13, "spd": 13, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "ExplosiveSwords"}, "tail": {$: "Nil"}}}, "xp": 15, "ryo": 26};
  } else if (_f_0.$ === "Kushimaru") {
    return {$: "FoeInfo", "name": "Kushimaru", "hp": 100, "atk": 22, "nin": 18, "dfn": 11, "spd": 17, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "NeedleWire"}, "tail": {$: "Nil"}}}, "xp": 15, "ryo": 26};
  } else if (_f_0.$ === "Arashi") {
    return {$: "FoeInfo", "name": "Arashi", "hp": 85, "atk": 16, "nin": 16, "dfn": 9, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "SoftBind"}, "tail": {$: "Nil"}}}, "xp": 9, "ryo": 16};
  } else if (_f_0.$ === "GatoRonin") {
    return {$: "FoeInfo", "name": "Gato's Ronin", "hp": 80, "atk": 18, "nin": 6, "dfn": 9, "spd": 11, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "Ambush"}, "tail": {$: "Nil"}}}, "xp": 8, "ryo": 15};
  } else if (_f_0.$ === "HunterNin") {
    return {$: "FoeInfo", "name": "Kiri Hunter-nin", "hp": 75, "atk": 14, "nin": 16, "dfn": 8, "spd": 14, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "CloneAmbush"}, "tail": {$: "Nil"}}}, "xp": 9, "ryo": 16};
  } else if (_f_0.$ === "SoundGenin") {
    return {$: "FoeInfo", "name": "Sound Genin", "hp": 85, "atk": 15, "nin": 18, "dfn": 9, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "SoundWave"}, "tail": {$: "Nil"}}}, "xp": 11, "ryo": 18};
  } else if (_f_0.$ === "GrassNinja") {
    return {$: "FoeInfo", "name": "Grass Ninja", "hp": 90, "atk": 16, "nin": 18, "dfn": 10, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "RainNeedles"}, "tail": {$: "Nil"}}}, "xp": 11, "ryo": 18};
  } else if (_f_0.$ === "Fuguki") {
    return {$: "FoeInfo", "name": "Fuguki Suikazan", "hp": 130, "atk": 26, "nin": 14, "dfn": 14, "spd": 12, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "DrainFist"}, "tail": {$: "Nil"}}}, "xp": 15, "ryo": 26};
  } else if (_f_0.$ === "Mangetsu") {
    return {$: "FoeInfo", "name": "Mangetsu Hozuki", "hp": 110, "atk": 22, "nin": 22, "dfn": 11, "spd": 16, "moves": {$: "Con", "head": {$: "Strike"}, "tail": {$: "Con", "head": {$: "WaterShark"}, "tail": {$: "Nil"}}}, "xp": 15, "ryo": 26};
  } else if (_f_0.$ === "KiriChunin") {
    return {$: "FoeInfo", "name": "Kiri Chunin", "hp": 85, "atk": 16, "nin": 15, "dfn": 9, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "HiddenMist"}, "tail": {$: "Nil"}}}, "xp": 9, "ryo": 16};
  } else if (_f_0.$ === "TakiNinja") {
    return {$: "FoeInfo", "name": "Waterfall Ninja", "hp": 80, "atk": 15, "nin": 16, "dfn": 9, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "WaterPrison"}, "tail": {$: "Nil"}}}, "xp": 9, "ryo": 16};
  } else if (_f_0.$ === "SoundChunin") {
    return {$: "FoeInfo", "name": "Sound Chunin", "hp": 95, "atk": 17, "nin": 18, "dfn": 10, "spd": 13, "moves": {$: "Con", "head": {$: "ThrowKunai"}, "tail": {$: "Con", "head": {$: "SoundWave"}, "tail": {$: "Nil"}}}, "xp": 12, "ryo": 20};
  } else if (_f_0.$ === "RainChunin") {
    return {$: "FoeInfo", "name": "Rain Chunin", "hp": 95, "atk": 16, "nin": 19, "dfn": 10, "spd": 14, "moves": {$: "Con", "head": {$: "Senbon"}, "tail": {$: "Con", "head": {$: "RainNeedles"}, "tail": {$: "Nil"}}}, "xp": 12, "ryo": 20};
  } else if (_f_0.$ === "Dummy") {
    return {$: "FoeInfo", "name": "Training Dummy", "hp": 1000000000, "atk": 0, "nin": 0, "dfn": 0, "spd": 12, "moves": {$: "Con", "head": {$: "Idle"}, "tail": {$: "Nil"}}, "xp": 0, "ryo": 0};
  } else if (_f_0.$ === "Sparring") {
    return {$: "FoeInfo", "name": "Sparring Partner", "hp": 1000, "atk": 22, "nin": 22, "dfn": 10, "spd": 12, "moves": {$: "Con", "head": {$: "SparStrike"}, "tail": {$: "Con", "head": {$: "SparWave"}, "tail": {$: "Con", "head": {$: "SparBind"}, "tail": {$: "Nil"}}}}, "xp": 0, "ryo": 0};
  } else {
    const _t_0 = _f_0["tails"];
    const _x_0 = (Math.imul(320, _t_0) >>> 0);
    const _x_1 = (Math.imul(10, _t_0) >>> 0);
    const _x_2 = (Math.imul(11, _t_0) >>> 0);
    const _x_3 = (Math.imul(5, _t_0) >>> 0);
    const _x_4 = (Math.imul(2, _t_0) >>> 0);
    return {$: "FoeInfo", "name": ($beast_name$(_t_0)), "hp": ((350 + _x_0) >>> 0), "atk": ((22 + _x_1) >>> 0), "nin": ((22 + _x_2) >>> 0), "dfn": ((8 + _x_3) >>> 0), "spd": ((10 + _x_4) >>> 0), "moves": ($beast_moves$(_t_0)), "xp": (Math.imul(60, _t_0) >>> 0), "ryo": (Math.imul(80, _t_0) >>> 0)};
  }
}

function $body_name$(_b_0) {
  if (_b_0.$ === "Ninja") {
    const _w_0 = _b_0["who"];
    return $who_name$(_w_0);
  } else {
    const _f_0 = _b_0["foe"];
    return $FoeInfo$name$(($foe_info$(_f_0)));
  }
}

function $body_key$(_b_0) {
  if (_b_0.$ === "Ninja") {
    const _w_0 = _b_0["who"];
    return $String$to_lower$(($who_name$(_w_0)));
  } else {
    const _t_0 = _b_0["foe"];
    if (_t_0.$ === "Beast") {
      const _t_1 = _t_0["tails"];
      const _x_0 = ($U32$show$(_t_1));
      return ("beast" + _x_0);
    } else {
      return $String$to_lower$(($FoeInfo$name$(($foe_info$(_t_0)))));
    }
  }
}

function $body_tails$(_b_0) {
  if (_b_0.$ === "Enemy") {
    const _t_0 = _b_0["foe"];
    if (_t_0.$ === "Beast") {
      const _t_1 = _t_0["tails"];
      return _t_1;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}

function $body_is$(_b_0, _w_0) {
  if (_b_0.$ === "Ninja") {
    const _v_0 = _b_0["who"];
    return $who_is$(_v_0, _w_0);
  } else {
    return false;
  }
}

function $bonus_none$() {
  return {$: "Bonus", "atkf": 0, "atkp": 0, "hpp": 0, "dfnf": 0, "dmgp": 0, "bossp": 0, "normp": 0, "taip": 0, "ninp": 0, "fd": 1000, "cr": 0, "cdmg": 0, "pen": 1000, "haste": 0, "cdr": 0, "regen": 0, "hpr": 0, "jlv": 0, "ckf": 0};
}

function $bonus_base$() {
  return {$: "Bonus", "atkf": 0, "atkp": 0, "hpp": 0, "dfnf": 0, "dmgp": 0, "bossp": 0, "normp": 0, "taip": 0, "ninp": 0, "fd": 1000, "cr": 10, "cdmg": 0, "pen": 1000, "haste": 0, "cdr": 0, "regen": 5, "hpr": 0, "jlv": 0, "ckf": 0};
}

function $mul1000$(_a_0, _b_0) {
  const _x_0 = (Math.imul(_a_0, _b_0) >>> 0);
  return (1000 === 0 ? 0 : (_x_0 / 1000) >>> 0);
}

function $haste_add$(_a_0, _b_0) {
  const _x_0 = ($sub0$(150, _a_0));
  const _x_1 = ($sub0$(150, _b_0));
  const _x_2 = (Math.imul(_x_0, _x_1) >>> 0);
  const _x_3 = (150 === 0 ? 0 : (_x_2 / 150) >>> 0);
  return ((150 - _x_3) >>> 0);
}

function $bonus_add$(_x_0, _y_0) {
  const _x_1 = ($Bonus$atkf$(_x_0));
  const _x_2 = ($Bonus$atkf$(_y_0));
  const _atkf_0 = ((_x_1 + _x_2) >>> 0);
  const _x_3 = ($Bonus$atkp$(_x_0));
  const _x_4 = ($Bonus$atkp$(_y_0));
  const _atkp_0 = ((_x_3 + _x_4) >>> 0);
  const _x_5 = ($Bonus$hpp$(_x_0));
  const _x_6 = ($Bonus$hpp$(_y_0));
  const _hpp_0 = ((_x_5 + _x_6) >>> 0);
  const _x_7 = ($Bonus$dfnf$(_x_0));
  const _x_8 = ($Bonus$dfnf$(_y_0));
  const _dfnf_0 = ((_x_7 + _x_8) >>> 0);
  const _x_9 = ($Bonus$dmgp$(_x_0));
  const _x_10 = ($Bonus$dmgp$(_y_0));
  const _dmgp_0 = ((_x_9 + _x_10) >>> 0);
  const _x_11 = ($Bonus$bossp$(_x_0));
  const _x_12 = ($Bonus$bossp$(_y_0));
  const _bossp_0 = ((_x_11 + _x_12) >>> 0);
  const _x_13 = ($Bonus$normp$(_x_0));
  const _x_14 = ($Bonus$normp$(_y_0));
  const _normp_0 = ((_x_13 + _x_14) >>> 0);
  const _x_15 = ($Bonus$taip$(_x_0));
  const _x_16 = ($Bonus$taip$(_y_0));
  const _taip_0 = ((_x_15 + _x_16) >>> 0);
  const _x_17 = ($Bonus$ninp$(_x_0));
  const _x_18 = ($Bonus$ninp$(_y_0));
  const _ninp_0 = ((_x_17 + _x_18) >>> 0);
  const _fd_0 = ($mul1000$(($Bonus$fd$(_x_0)), ($Bonus$fd$(_y_0))));
  const _x_19 = ($Bonus$cr$(_x_0));
  const _x_20 = ($Bonus$cr$(_y_0));
  const _cr_0 = ((_x_19 + _x_20) >>> 0);
  const _x_21 = ($Bonus$cdmg$(_x_0));
  const _x_22 = ($Bonus$cdmg$(_y_0));
  const _cdmg_0 = ((_x_21 + _x_22) >>> 0);
  const _pen_0 = ($mul1000$(($Bonus$pen$(_x_0)), ($Bonus$pen$(_y_0))));
  const _haste_0 = ($haste_add$(($Bonus$haste$(_x_0)), ($Bonus$haste$(_y_0))));
  const _x_23 = ($Bonus$cdr$(_x_0));
  const _x_24 = ($Bonus$cdr$(_y_0));
  const _cdr_0 = ((_x_23 + _x_24) >>> 0);
  const _x_25 = ($Bonus$regen$(_x_0));
  const _x_26 = ($Bonus$regen$(_y_0));
  const _regen_0 = ((_x_25 + _x_26) >>> 0);
  const _x_27 = ($Bonus$hpr$(_x_0));
  const _x_28 = ($Bonus$hpr$(_y_0));
  const _hpr_0 = ((_x_27 + _x_28) >>> 0);
  const _x_29 = ($Bonus$jlv$(_x_0));
  const _x_30 = ($Bonus$jlv$(_y_0));
  const _jlv_0 = ((_x_29 + _x_30) >>> 0);
  const _x_31 = ($Bonus$ckf$(_x_0));
  const _x_32 = ($Bonus$ckf$(_y_0));
  const _ckf_0 = ((_x_31 + _x_32) >>> 0);
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": _regen_0, "hpr": _hpr_0, "jlv": _jlv_0, "ckf": _ckf_0};
}

function $art_bonus$(_a_0) {
  if (_a_0.$ === "HokageHat") {
    return $Bonus$with_hpp$(($bonus_none$()), 15);
  } else if (_a_0.$ === "ChuninVest") {
    return $Bonus$with_dfnf$(($bonus_none$()), 6);
  } else if (_a_0.$ === "SanninScroll") {
    return $Bonus$with_ninp$(($bonus_none$()), 20);
  } else if (_a_0.$ === "LegWeights") {
    return $Bonus$with_haste$(($bonus_none$()), 12);
  } else if (_a_0.$ === "Kubikiribocho") {
    return $Bonus$with_taip$(($bonus_none$()), 30);
  } else if (_a_0.$ === "SharinganEye") {
    return $Bonus$with_cr$(($bonus_none$()), 12);
  } else if (_a_0.$ === "AkatsukiRing") {
    return $Bonus$with_bossp$(($bonus_none$()), 25);
  } else if (_a_0.$ === "AsumaBlades") {
    return $Bonus$with_pen$(($bonus_none$()), 700);
  } else if (_a_0.$ === "FrogOil") {
    return $Bonus$with_regen$(($bonus_none$()), 5);
  } else if (_a_0.$ === "IchaIcha") {
    return $Bonus$with_cdmg$(($bonus_none$()), 25);
  } else if (_a_0.$ === "KakashiBells") {
    return $Bonus$with_dmgp$(($bonus_none$()), 10);
  } else if (_a_0.$ === "HiruzenPipe") {
    return $Bonus$with_cdr$(($bonus_none$()), 1);
  } else if (_a_0.$ === "CursedSeal") {
    return $Bonus$with_atkp$(($bonus_none$()), 25);
  } else if (_a_0.$ === "ToadSageScroll") {
    return $Bonus$with_jlv$(($bonus_none$()), 1);
  } else if (_a_0.$ === "SamehadaScale") {
    return $Bonus$with_ckf$(($bonus_none$()), 30);
  } else {
    return $bonus_none$();
  }
}

function $arts_bonus$(_arts_0) {
  if (_arts_0.$ === "Nil") {
    return $bonus_none$();
  } else {
    const _a_0 = _arts_0["head"];
    const _t_0 = _arts_0["tail"];
    return $bonus_add$(($art_bonus$(_a_0)), ($arts_bonus$(_t_0)));
  }
}

function $who_bonus$(_w_0) {
  if (_w_0.$ === "Hinata") {
    return $Bonus$with_pen$(($bonus_none$()), 700);
  } else {
    return $bonus_none$();
  }
}

function $form_b$(_atkp_0, _taip_0, _ninp_0, _haste_0, _cr_0, _dfnf_0, _fdp_0, _penp_0) {
  const _x_0 = (Math.imul(10, _fdp_0) >>> 0);
  const _x_1 = (Math.imul(10, _penp_0) >>> 0);
  return {$: "Bonus", "atkf": 0, "atkp": _atkp_0, "hpp": 0, "dfnf": _dfnf_0, "dmgp": 0, "bossp": 0, "normp": 0, "taip": _taip_0, "ninp": _ninp_0, "fd": ((1000 + _x_0) >>> 0), "cr": _cr_0, "cdmg": 0, "pen": ((1000 - _x_1) >>> 0), "haste": _haste_0, "cdr": 0, "regen": 0, "hpr": 0, "jlv": 0, "ckf": 0};
}

function $form_list$(_w_0) {
  if (_w_0.$ === "Naruto") {
    return {$: "Con", "head": {$: "FormInfo", "name": "Nine-Tails Chakra Cloak", "gate": 0, "trig": {$: "TJutsu", "slot": 2, "lvl": 3}, "bon": ($form_b$(25, 15, 15, 15, 0, 0, 0, 0)), "drain": 6, "sig": {$: "ChakraArm"}, "desc": "Kurama's chakra wraps Naruto: faster and stronger.", "color": 16742942}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Sage Mode", "gate": 1, "trig": {$: "TEvent", "node": 19}, "bon": ($form_b$(40, 40, 40, 10, 10, 10, 10, 20)), "drain": 10, "sig": {$: "FrogKata"}, "desc": "Natural energy: every stat rises, Frog Kata unlocks.", "color": 16756800}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Kurama Link Mode", "gate": 2, "trig": {$: "TRelic", "art": {$: "EightTrigramsKey"}}, "bon": ($form_b$(80, 50, 60, 35, 15, 15, 25, 20)), "drain": 14, "sig": {$: "BeastBombRasengan"}, "desc": "Naruto and Kurama fight as one.", "color": 16767050}, "tail": {$: "Nil"}}}};
  } else if (_w_0.$ === "Sasuke") {
    return {$: "Con", "head": {$: "FormInfo", "name": "Cursed Seal", "gate": 0, "trig": {$: "TJutsu", "slot": 2, "lvl": 3}, "bon": ($form_b$(30, 20, 20, 10, 5, 0, 0, 10)), "drain": 6, "sig": {$: "ChidoriStream"}, "desc": "Orochimaru's mark spreads. Raw power, at a price.", "color": 9063104}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Cursed Seal: Level 2", "gate": 1, "trig": {$: "TEvent", "node": 18}, "bon": ($form_b$(55, 30, 40, 15, 10, 0, 10, 20)), "drain": 10, "sig": {$: "ChidoriSpear"}, "desc": "Wings of the curse mark.", "color": 5913226}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Mangekyo Sharingan", "gate": 2, "trig": {$: "TRelic", "art": {$: "UchihaCrest"}}, "bon": ($form_b$(70, 20, 80, 20, 20, 0, 25, 30)), "drain": 14, "sig": {$: "SusanooArrow"}, "desc": "Itachi's eyes awaken. Susano'o rises.", "color": 13639712}, "tail": {$: "Nil"}}}};
  } else if (_w_0.$ === "Sakura") {
    return {$: "Con", "head": {$: "FormInfo", "name": "Inner Sakura", "gate": 0, "trig": {$: "TJutsu", "slot": 1, "lvl": 3}, "bon": ($form_b$(20, 45, 10, 5, 5, 5, 0, 0)), "drain": 4, "sig": {$: "ChakraFist"}, "desc": "CHA! Pinpoint chakra in every punch.", "color": 16738976}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Strength of a Hundred", "gate": 1, "trig": {$: "TEvent", "node": 0}, "bon": ($form_b$(40, 50, 30, 10, 5, 15, 10, 10)), "drain": 8, "sig": {$: "ByakugouHeal"}, "desc": "Tsunade's seal releases its stored chakra.", "color": 10502399}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Katsuyu Bond", "gate": 2, "trig": {$: "TRelic", "art": {$: "SlugContract"}}, "bon": ($form_b$(60, 60, 60, 15, 10, 25, 20, 20)), "drain": 12, "sig": {$: "KatsuyuDivision"}, "desc": "Katsuyu splits to heal the whole squad.", "color": 8054992}, "tail": {$: "Nil"}}}};
  } else if (_w_0.$ === "Kakashi") {
    return {$: "Con", "head": {$: "FormInfo", "name": "Sharingan Unveiled", "gate": 0, "trig": {$: "TJutsu", "slot": 0, "lvl": 3}, "bon": ($form_b$(20, 10, 25, 10, 20, 0, 0, 10)), "drain": 6, "sig": {$: "LightningHound"}, "desc": "The headband goes up. The copy wheel spins.", "color": 13639712}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Mangekyo Sharingan", "gate": 1, "trig": {$: "TEvent", "node": 15}, "bon": ($form_b$(40, 20, 55, 15, 20, 0, 15, 30)), "drain": 12, "sig": {$: "KamuiShuriken"}, "desc": "Obito's gift, at Kannabi Bridge.", "color": 10491928}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Six Paths Sharingan", "gate": 2, "trig": {$: "TRelic", "art": {$: "ObitosEye"}}, "bon": ($form_b$(70, 30, 90, 25, 25, 10, 25, 40)), "drain": 14, "sig": {$: "KamuiRaikiri"}, "desc": "Both eyes, one last time.", "color": 8048895}, "tail": {$: "Nil"}}}};
  } else if (_w_0.$ === "Lee") {
    return {$: "Con", "head": {$: "FormInfo", "name": "Gate of Life", "gate": 0, "trig": {$: "TJutsu", "slot": 0, "lvl": 3}, "bon": ($form_b$(30, 45, 0, 20, 5, 0, 0, 10)), "drain": 3, "sig": {$: "HiddenLotus"}, "desc": "Three gates open. Lee's skin turns red.", "color": 8060794}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Gate of Wonder", "gate": 1, "trig": {$: "TEvent", "node": 1}, "bon": ($form_b$(55, 75, 0, 35, 10, 0, 15, 20)), "drain": 6, "sig": {$: "AfternoonTiger"}, "desc": "Six gates, as Gai taught him.", "color": 3866522}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Night Guy", "gate": 2, "trig": {$: "TRelic", "art": {$: "GreenBeastSuit"}}, "bon": ($form_b$(100, 120, 0, 50, 15, 0, 30, 30)), "drain": 10, "sig": {$: "EveningElephant"}, "desc": "All eight gates. The blood steam burns.", "color": 16724016}, "tail": {$: "Nil"}}}};
  } else if (_w_0.$ === "Hinata") {
    return {$: "Con", "head": {$: "FormInfo", "name": "Byakugan Focus", "gate": 0, "trig": {$: "TJutsu", "slot": 0, "lvl": 3}, "bon": ($form_b$(20, 30, 10, 10, 20, 0, 0, 10)), "drain": 4, "sig": {$: "VacuumPalm"}, "desc": "Every chakra point in plain sight.", "color": 13156607}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Twin Lion Stance", "gate": 1, "trig": {$: "TEvent", "node": 4}, "bon": ($form_b$(40, 50, 20, 15, 20, 10, 10, 20)), "drain": 8, "sig": {$: "ProtectiveTrigrams"}, "desc": "She stands to protect the ones she loves.", "color": 8040703}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Hamura's Byakugan", "gate": 2, "trig": {$: "TRelic", "art": {$: "MoonCharm"}}, "bon": ($form_b$(70, 80, 40, 20, 30, 15, 20, 40)), "drain": 12, "sig": {$: "TwinLionCrush"}, "desc": "The moon clan's eyes.", "color": 15261951}, "tail": {$: "Nil"}}}};
  } else if (_w_0.$ === "Shikamaru") {
    return {$: "Con", "head": {$: "FormInfo", "name": "Nara Focus", "gate": 0, "trig": {$: "TJutsu", "slot": 0, "lvl": 3}, "bon": ($form_b$(15, 0, 30, 10, 10, 0, 0, 10)), "drain": 4, "sig": {$: "ShadowSewing"}, "desc": "Fingers together. Two hundred moves ahead.", "color": 6974112}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Ino-Shika-Cho Plan", "gate": 1, "trig": {$: "TEvent", "node": 17}, "bon": ($form_b$(30, 10, 50, 15, 15, 10, 10, 20)), "drain": 8, "sig": {$: "ShadowShuriken"}, "desc": "The formation, perfected in the rain.", "color": 9071359}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Will of Asuma", "gate": 2, "trig": {$: "TRelic", "art": {$: "AsumaLighter"}}, "bon": ($form_b$(60, 40, 80, 20, 20, 15, 20, 30)), "drain": 12, "sig": {$: "FlyingSwallow"}, "desc": "His sensei's knives, his sensei's will.", "color": 8057087}, "tail": {$: "Nil"}}}};
  } else {
    return {$: "Con", "head": {$: "FormInfo", "name": "Sand Armor", "gate": 0, "trig": {$: "TJutsu", "slot": 0, "lvl": 3}, "bon": ($form_b$(15, 0, 25, 0, 0, 20, 0, 0)), "drain": 4, "sig": {$: "SandShuriken"}, "desc": "A second skin of sand.", "color": 14200944}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Shukaku's Arm", "gate": 1, "trig": {$: "TEvent", "node": 6}, "bon": ($form_b$(40, 20, 50, 5, 10, 30, 10, 10)), "drain": 8, "sig": {$: "SandSpear"}, "desc": "A tanuki arm of sand, back in the ruins.", "color": 11569216}, "tail": {$: "Con", "head": {$: "FormInfo", "name": "Kazekage's Sand", "gate": 2, "trig": {$: "TRelic", "art": {$: "KazekageHat"}}, "bon": ($form_b$(60, 30, 90, 10, 15, 40, 20, 20)), "drain": 12, "sig": {$: "SandFuneral"}, "desc": "The desert answers its Kazekage.", "color": 16773296}, "tail": {$: "Nil"}}}};
  }
}

function $form_none$() {
  return {$: "FormInfo", "name": "", "gate": 99, "trig": {$: "TEvent", "node": 999}, "bon": ($bonus_none$()), "drain": 0, "sig": {$: "Strike"}, "desc": "", "color": 16777215};
}

function $form_info$(_w_0, _t_0) {
  const _x_0 = ($sub0$(_t_0, 1));
  const _f_0 = ($Maybe$default$(($List$get$(($form_list$(_w_0)), _x_0)), ($form_none$())));
  return $Bool$pick$(($gt0$(_t_0)), _f_0, ($form_none$()));
}

function $form_body$(_b_0, _t_0) {
  if (_b_0.$ === "Ninja") {
    const _w_0 = _b_0["who"];
    return $form_info$(_w_0, _t_0);
  } else {
    return $form_none$();
  }
}

function $rarity_name$(_r_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Academy", "tail": {$: "Con", "head": "Genin", "tail": {$: "Con", "head": "Chunin", "tail": {$: "Con", "head": "Jonin", "tail": {$: "Con", "head": "Kage", "tail": {$: "Con", "head": "Sage", "tail": {$: "Con", "head": "Otsutsuki", "tail": {$: "Nil"}}}}}}}}, _r_0)), "?");
}

function $tier_name$(_t_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "T4", "tail": {$: "Con", "head": "T3", "tail": {$: "Con", "head": "T2", "tail": {$: "Con", "head": "T1", "tail": {$: "Nil"}}}}}, _t_0)), "?");
}

function $weapon_family$(_r_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Training Kunai", "tail": {$: "Con", "head": "Fuma Shuriken", "tail": {$: "Con", "head": "Chakra Blades", "tail": {$: "Con", "head": "Kubikiribocho", "tail": {$: "Con", "head": "Samehada", "tail": {$: "Con", "head": "Kusanagi", "tail": {$: "Con", "head": "Truth-Seeking Orb", "tail": {$: "Nil"}}}}}}}}, _r_0)), "?");
}

function $weapon_name$(_g_0) {
  const _x_0 = ($tier_name$((4 === 0 ? _g_0 : _g_0 % 4)));
  const _x_1 = ($weapon_family$((4 === 0 ? 0 : (_g_0 / 4) >>> 0)));
  const _x_2 = (" " + _x_0);
  return (_x_1 + _x_2);
}

function $weapon_base$(_g_0) {
  return $at_u32$({$: "Con", "head": 4, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 9, "tail": {$: "Con", "head": 11, "tail": {$: "Con", "head": 13, "tail": {$: "Con", "head": 16, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 24, "tail": {$: "Con", "head": 30, "tail": {$: "Con", "head": 36, "tail": {$: "Con", "head": 45, "tail": {$: "Con", "head": 55, "tail": {$: "Con", "head": 66, "tail": {$: "Con", "head": 80, "tail": {$: "Con", "head": 100, "tail": {$: "Con", "head": 120, "tail": {$: "Con", "head": 150, "tail": {$: "Con", "head": 180, "tail": {$: "Con", "head": 220, "tail": {$: "Con", "head": 270, "tail": {$: "Con", "head": 330, "tail": {$: "Con", "head": 400, "tail": {$: "Con", "head": 500, "tail": {$: "Con", "head": 600, "tail": {$: "Con", "head": 720, "tail": {$: "Con", "head": 860, "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, _g_0);
}

function $weapon_atk$(_g_0, _lvl_0) {
  const _x_0 = ($sub0$(_lvl_0, 1));
  const _x_1 = (Math.imul(2, _x_0) >>> 0);
  return $pct$(($weapon_base$(_g_0)), ((100 + _x_1) >>> 0));
}

function $weapon_cap$(_awk_0) {
  const _x_0 = (Math.imul(10, _awk_0) >>> 0);
  return ((20 + _x_0) >>> 0);
}

function $weapon_cost$(_g_0, _lvl_0) {
  const _x_0 = (2 === 0 ? 0 : (_g_0 / 2) >>> 0);
  const _x_1 = ((_x_0 + 1) >>> 0);
  const _x_2 = ((4 + _lvl_0) >>> 0);
  return (Math.imul(_x_1, _x_2) >>> 0);
}

function $owned0$() {
  return {$: "Owned", "copies": 0, "awk": 0, "lvl": 1};
}

function $owned_at$(_xs_0, _i_0) {
  return $Maybe$default$(($List$get$(_xs_0, _i_0)), ($owned0$()));
}

function $weapon_perk$(_r_0) {
  const _b_0 = ($bonus_none$());
  return $Bool$pick$((_r_0 === 3), ($Bonus$with_hpr$(_b_0, 3)), ($Bool$pick$((_r_0 === 4), ($Bonus$with_regen$(_b_0, 5)), ($Bool$pick$((_r_0 === 5), ($Bonus$with_pen$(_b_0, 800)), ($Bool$pick$((_r_0 === 6), ($Bonus$with_fd$(_b_0, 1150)), _b_0)))))));
}

function $weapon_perk_text$(_r_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "", "tail": {$: "Con", "head": "", "tail": {$: "Con", "head": "", "tail": {$: "Con", "head": "Perk: heals 3% HP per turn.", "tail": {$: "Con", "head": "Perk: +5 chakra per turn.", "tail": {$: "Con", "head": "Perk: +20% Defense Penetration.", "tail": {$: "Con", "head": "Perk: +15% Final Damage.", "tail": {$: "Nil"}}}}}}}}, _r_0)), "");
}

function $weapon_bonus$(_code_0, _weps_0) {
  const _g_0 = ($sub0$(_code_0, 1));
  const _b_0 = ($bonus_add$(($Bonus$with_atkp$(($bonus_none$()), ($weapon_atk$(_g_0, ($Owned$lvl$(($owned_at$(_weps_0, _g_0)))))))), ($weapon_perk$((4 === 0 ? 0 : (_g_0 / 4) >>> 0)))));
  return $Bool$pick$(($gt0$(_code_0)), _b_0, ($bonus_none$()));
}

function $owned_weps$(_xs_0, _g_0) {
  if (_xs_0.$ === "Nil") {
    return 0;
  } else {
    const _o_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    const _x_0 = ($weapon_atk$(_g_0, ($Owned$lvl$(_o_0))));
    const _x_1 = ($Bool$pick$(($gt0$(($Owned$copies$(_o_0)))), (4 === 0 ? 0 : (_x_0 / 4) >>> 0), 0));
    const _x_2 = ($owned_weps$(_t_0, ((_g_0 + 1) >>> 0)));
    return ((_x_1 + _x_2) >>> 0);
  }
}

function $species_name$(_sp_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Toads", "tail": {$: "Con", "head": "Slugs", "tail": {$: "Con", "head": "Snakes", "tail": {$: "Con", "head": "Ninken", "tail": {$: "Con", "head": "Hawks", "tail": {$: "Con", "head": "Monkeys", "tail": {$: "Con", "head": "Weasels", "tail": {$: "Nil"}}}}}}}}, _sp_0)), "?");
}

function $summon_name$(_code_0) {
  const _x_0 = ($sub0$(_code_0, 1));
  return $Maybe$default$(($List$get$({$: "Con", "head": "Gamakichi", "tail": {$: "Con", "head": "Gamaken", "tail": {$: "Con", "head": "Gamahiro", "tail": {$: "Con", "head": "Gamabunta", "tail": {$: "Con", "head": "Katsuyu Sliver", "tail": {$: "Con", "head": "Katsuyu Shard", "tail": {$: "Con", "head": "Katsuyu Body", "tail": {$: "Con", "head": "Katsuyu", "tail": {$: "Con", "head": "Viper", "tail": {$: "Con", "head": "Python", "tail": {$: "Con", "head": "Aoda", "tail": {$: "Con", "head": "Manda", "tail": {$: "Con", "head": "Pakkun", "tail": {$: "Con", "head": "Bisuke", "tail": {$: "Con", "head": "Bull", "tail": {$: "Con", "head": "Eight Ninken", "tail": {$: "Con", "head": "Messenger Hawk", "tail": {$: "Con", "head": "Taka", "tail": {$: "Con", "head": "Garuda", "tail": {$: "Con", "head": "Great Garuda", "tail": {$: "Con", "head": "Monkey Scout", "tail": {$: "Con", "head": "Ape Warrior", "tail": {$: "Con", "head": "Enma's Staff", "tail": {$: "Con", "head": "Enma", "tail": {$: "Con", "head": "Kamatari Pup", "tail": {$: "Con", "head": "Kamatari", "tail": {$: "Con", "head": "Wind Weasel", "tail": {$: "Con", "head": "Great Kamatari", "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}}}}}, _x_0)), "None");
}

function $species_effect$(_sp_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Final Damage", "tail": {$: "Con", "head": "HP regen", "tail": {$: "Con", "head": "Def Pen", "tail": {$: "Con", "head": "Crit Rate", "tail": {$: "Con", "head": "Haste", "tail": {$: "Con", "head": "Damage", "tail": {$: "Con", "head": "Ninjutsu", "tail": {$: "Nil"}}}}}}}}, _sp_0)), "");
}

function $species_action$(_sp_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Toad Oil Flame Bullet: fire on all foes.", "tail": {$: "Con", "head": "Katsuyu's Healing: heals and cures the squad.", "tail": {$: "Con", "head": "Great Snake Bite: heavy hit and poison.", "tail": {$: "Con", "head": "Ninken Pin: binds a foe.", "tail": {$: "Con", "head": "Garuda Gale: strikes all foes.", "tail": {$: "Con", "head": "Adamantine Staff: one crushing blow.", "tail": {$: "Con", "head": "Wind Scythe: wind on all foes.", "tail": {$: "Nil"}}}}}}}}, _sp_0)), "");
}

function $smn_level$(_o_0) {
  return $u32_min$(($Owned$copies$(_o_0)), 5);
}

function $smn_kp$(_code_0, _smns_0) {
  const _i_0 = ($sub0$(_code_0, 1));
  const _x_0 = (4 === 0 ? _i_0 : _i_0 % 4);
  const _x_1 = ($smn_level$(($owned_at$(_smns_0, _i_0))));
  const _x_2 = (Math.imul(10, _x_1) >>> 0);
  const _x_3 = ((_x_0 + 1) >>> 0);
  const _x_4 = ((100 + _x_2) >>> 0);
  return (Math.imul(_x_3, _x_4) >>> 0);
}

function $smn_equip$(_code_0, _smns_0) {
  const _x_0 = ($sub0$(_code_0, 1));
  const _sp_0 = (4 === 0 ? 0 : (_x_0 / 4) >>> 0);
  const _kp_0 = ($smn_kp$(_code_0, _smns_0));
  const _x_1 = (Math.imul(20, _kp_0) >>> 0);
  const _x_2 = (100 === 0 ? 0 : (_x_1 / 100) >>> 0);
  const _fd_0 = ($Bool$pick$((_sp_0 === 0), ((1000 + _x_2) >>> 0), 1000));
  const _hpr_0 = ($Bool$pick$((_sp_0 === 1), (150 === 0 ? 0 : (_kp_0 / 150) >>> 0), 0));
  const _x_3 = (Math.imul(40, _kp_0) >>> 0);
  const _pen_0 = ($Bool$pick$((_sp_0 === 2), ($sub0$(1000, (100 === 0 ? 0 : (_x_3 / 100) >>> 0))), 1000));
  const _x_4 = (Math.imul(3, _kp_0) >>> 0);
  const _cr_0 = ($Bool$pick$((_sp_0 === 3), (100 === 0 ? 0 : (_x_4 / 100) >>> 0), 0));
  const _x_5 = (Math.imul(4, _kp_0) >>> 0);
  const _haste_0 = ($Bool$pick$((_sp_0 === 4), (100 === 0 ? 0 : (_x_5 / 100) >>> 0), 0));
  const _x_6 = (Math.imul(5, _kp_0) >>> 0);
  const _dmgp_0 = ($Bool$pick$((_sp_0 === 5), (100 === 0 ? 0 : (_x_6 / 100) >>> 0), 0));
  const _x_7 = (Math.imul(6, _kp_0) >>> 0);
  const _ninp_0 = ($Bool$pick$((_sp_0 === 6), (100 === 0 ? 0 : (_x_7 / 100) >>> 0), 0));
  const _b_0 = {$: "Bonus", "atkf": 0, "atkp": 0, "hpp": 0, "dfnf": 0, "dmgp": _dmgp_0, "bossp": 0, "normp": 0, "taip": 0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": 0, "pen": _pen_0, "haste": _haste_0, "cdr": 0, "regen": 0, "hpr": _hpr_0, "jlv": 0, "ckf": 0};
  return $Bool$pick$(($gt0$(_code_0)), _b_0, ($bonus_none$()));
}

function $owned_smns$(_xs_0, _i_0) {
  if (_xs_0.$ === "Nil") {
    return $bonus_none$();
  } else {
    const _o_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    const _r_0 = (4 === 0 ? _i_0 : _i_0 % 4);
    const _own_0 = ($gt0$(($Owned$copies$(_o_0))));
    const _lo_0 = ($Bool$and$(_own_0, (_r_0 < 2)));
    const _hi_0 = ($Bool$and$(_own_0, (_r_0 >= 2)));
    const _x_0 = ((_r_0 + 1) >>> 0);
    const _x_1 = ($sub0$(_r_0, 1));
    const _x_2 = ($sub0$(_r_0, 1));
    const _b_0 = {$: "Bonus", "atkf": ($Bool$pick$(_lo_0, (Math.imul(2, _x_0) >>> 0), 0)), "atkp": 0, "hpp": ($Bool$pick$(_hi_0, (Math.imul(4, _x_1) >>> 0), 0)), "dfnf": 0, "dmgp": ($Bool$pick$(_hi_0, (Math.imul(3, _x_2) >>> 0), 0)), "bossp": 0, "normp": 0, "taip": 0, "ninp": 0, "fd": 1000, "cr": 0, "cdmg": 0, "pen": 1000, "haste": 0, "cdr": 0, "regen": 0, "hpr": 0, "jlv": 0, "ckf": 0};
    return $bonus_add$(_b_0, ($owned_smns$(_t_0, ((_i_0 + 1) >>> 0))));
  }
}

function $summon_power$(_bag_0) {
  const _code_0 = ($Bag$smain$(_bag_0));
  const _i_0 = ($sub0$(_code_0, 1));
  const _x_0 = (4 === 0 ? _i_0 : _i_0 % 4);
  const _x_1 = (Math.imul(50, _x_0) >>> 0);
  const _x_2 = ($smn_level$(($owned_at$(($Bag$smns$(_bag_0)), _i_0))));
  const _x_3 = ((100 + _x_1) >>> 0);
  const _x_4 = (Math.imul(10, _x_2) >>> 0);
  return $Bool$pick$(($gt0$(_code_0)), ((_x_3 + _x_4) >>> 0), 0);
}

function $slot_name$(_s_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Headband", "tail": {$: "Con", "head": "Flak Vest", "tail": {$: "Con", "head": "Gloves", "tail": {$: "Con", "head": "Sandals", "tail": {$: "Con", "head": "Cloak", "tail": {$: "Con", "head": "Ring", "tail": {$: "Nil"}}}}}}}, _s_0)), "?");
}

function $grade_name$(_g_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Rare", "tail": {$: "Con", "head": "Epic", "tail": {$: "Con", "head": "Unique", "tail": {$: "Con", "head": "Legendary", "tail": {$: "Con", "head": "Mythic", "tail": {$: "Nil"}}}}}}, _g_0)), "?");
}

function $rar_mult$(_r_0) {
  return $at_u32$({$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 4, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 32, "tail": {$: "Nil"}}}}}}}}, _r_0);
}

function $star_k$(_s_0) {
  const _x_0 = (Math.imul(5, _s_0) >>> 0);
  const _x_1 = ((100 + _x_0) >>> 0);
  const _x_2 = ($Bool$pick$((_s_0 >= 10), 25, 0));
  return ((_x_1 + _x_2) >>> 0);
}

function $kit_base$(_slot_0, _m_0) {
  const _atkf_0 = ($Bool$pick$((_slot_0 === 0), (Math.imul(3, _m_0) >>> 0), ($Bool$pick$((_slot_0 === 2), (Math.imul(2, _m_0) >>> 0), 0))));
  const _atkp_0 = ($Bool$pick$((_slot_0 === 5), (Math.imul(2, _m_0) >>> 0), 0));
  const _x_0 = (_slot_0 === 1);
  const _x_1 = (_slot_0 === 4);
  const _hpp_0 = ($Bool$pick$((_x_0 || _x_1), _m_0, 0));
  const _x_2 = (_slot_0 === 3);
  const _x_3 = (_slot_0 === 4);
  const _dfnf_0 = ($Bool$pick$((_slot_0 === 1), (Math.imul(2, _m_0) >>> 0), ($Bool$pick$((_x_2 || _x_3), _m_0, 0))));
  const _x_4 = ((_m_0 + 1) >>> 0);
  const _cr_0 = ($Bool$pick$((_slot_0 === 2), (2 === 0 ? 0 : (_x_4 / 2) >>> 0), 0));
  const _haste_0 = ($Bool$pick$((_slot_0 === 3), ($u32_min$((Math.imul(2, _m_0) >>> 0), 60)), 0));
  return {$: "Bonus", "atkf": _atkf_0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": _dfnf_0, "dmgp": 0, "bossp": 0, "normp": 0, "taip": 0, "ninp": 0, "fd": 1000, "cr": _cr_0, "cdmg": 0, "pen": 1000, "haste": _haste_0, "cdr": 0, "regen": 0, "hpr": 0, "jlv": 0, "ckf": 0};
}

function $line_table$() {
  return {$: "Con", "head": {$: "Con", "head": 3, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 9, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 15, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 4, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 16, "tail": {$: "Con", "head": 20, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 6, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 30, "tail": {$: "Con", "head": 40, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 6, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 30, "tail": {$: "Con", "head": 40, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 3, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 15, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 5, "tail": {$: "Con", "head": 10, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 30, "tail": {$: "Con", "head": 50, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 3, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 10, "tail": {$: "Con", "head": 14, "tail": {$: "Con", "head": 20, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 3, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 20, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 5, "tail": {$: "Con", "head": 10, "tail": {$: "Con", "head": 15, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 25, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 5, "tail": {$: "Con", "head": 10, "tail": {$: "Con", "head": 15, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 25, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 4, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 12, "tail": {$: "Con", "head": 16, "tail": {$: "Con", "head": 20, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 1, "tail": {$: "Con", "head": 3, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 12, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 1, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 3, "tail": {$: "Con", "head": 4, "tail": {$: "Nil"}}}}}}, "tail": {$: "Nil"}}}}}}}}}}}}}}};
}

function $line_val$(_stat_0, _grade_0) {
  return $at_u32$(($Maybe$default$(($List$get$(($line_table$()), _stat_0)), {$: "Nil"})), _grade_0);
}

function $stat_name$(_s_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "ATK", "tail": {$: "Con", "head": "Damage", "tail": {$: "Con", "head": "Boss Damage", "tail": {$: "Con", "head": "Normal Damage", "tail": {$: "Con", "head": "Crit Rate", "tail": {$: "Con", "head": "Crit Damage", "tail": {$: "Con", "head": "Def Pen", "tail": {$: "Con", "head": "Haste", "tail": {$: "Con", "head": "Ninjutsu", "tail": {$: "Con", "head": "Taijutsu", "tail": {$: "Con", "head": "Max HP", "tail": {$: "Con", "head": "Final Damage", "tail": {$: "Con", "head": "Cooldown", "tail": {$: "Con", "head": "All Jutsu Lv", "tail": {$: "Nil"}}}}}}}}}}}}}}}, _s_0)), "");
}

function $line_bonus$(_l_0) {
  const _s_0 = ($Line$stat$(_l_0));
  const _v_0 = ($Line$val$(_l_0));
  const _atkp_0 = ($Bool$pick$((_s_0 === 0), _v_0, 0));
  const _dmgp_0 = ($Bool$pick$((_s_0 === 1), _v_0, 0));
  const _bossp_0 = ($Bool$pick$((_s_0 === 2), _v_0, 0));
  const _normp_0 = ($Bool$pick$((_s_0 === 3), _v_0, 0));
  const _cr_0 = ($Bool$pick$((_s_0 === 4), _v_0, 0));
  const _cdmg_0 = ($Bool$pick$((_s_0 === 5), _v_0, 0));
  const _pen_0 = ($Bool$pick$((_s_0 === 6), ($sub0$(1000, (Math.imul(10, _v_0) >>> 0))), 1000));
  const _haste_0 = ($Bool$pick$((_s_0 === 7), _v_0, 0));
  const _ninp_0 = ($Bool$pick$((_s_0 === 8), _v_0, 0));
  const _taip_0 = ($Bool$pick$((_s_0 === 9), _v_0, 0));
  const _hpp_0 = ($Bool$pick$((_s_0 === 10), _v_0, 0));
  const _x_0 = (Math.imul(10, _v_0) >>> 0);
  const _fd_0 = ($Bool$pick$((_s_0 === 11), ((1000 + _x_0) >>> 0), 1000));
  const _cdr_0 = ($Bool$pick$((_s_0 === 12), _v_0, 0));
  const _jlv_0 = ($Bool$pick$((_s_0 === 13), _v_0, 0));
  return {$: "Bonus", "atkf": 0, "atkp": _atkp_0, "hpp": _hpp_0, "dfnf": 0, "dmgp": _dmgp_0, "bossp": _bossp_0, "normp": _normp_0, "taip": _taip_0, "ninp": _ninp_0, "fd": _fd_0, "cr": _cr_0, "cdmg": _cdmg_0, "pen": _pen_0, "haste": _haste_0, "cdr": _cdr_0, "regen": 0, "hpr": 0, "jlv": _jlv_0, "ckf": 0};
}

function $lines_bonus$(_ls_0) {
  if (_ls_0.$ === "Nil") {
    return $bonus_none$();
  } else {
    const _l_0 = _ls_0["head"];
    const _t_0 = _ls_0["tail"];
    return $bonus_add$(($line_bonus$(_l_0)), ($lines_bonus$(_t_0)));
  }
}

function $kit_one$(_k_0, _slot_0) {
  const _r_0 = ($Kit$rar$(_k_0));
  const _x_0 = ($rar_mult$(_r_0));
  const _x_1 = ($star_k$(($Kit$stars$(_k_0))));
  const _x_2 = (Math.imul(_x_0, _x_1) >>> 0);
  const _m_0 = ($u32_max$((100 === 0 ? 0 : (_x_2 / 100) >>> 0), 1));
  return $Bool$pick$((_r_0 < 7), ($bonus_add$(($kit_base$(_slot_0, _m_0)), ($lines_bonus$(($Kit$lines$(_k_0)))))), ($bonus_none$()));
}

function $kit_bonus$(_ks_0, _slot_0) {
  if (_ks_0.$ === "Nil") {
    return $bonus_none$();
  } else {
    const _k_0 = _ks_0["head"];
    const _t_0 = _ks_0["tail"];
    return $bonus_add$(($kit_one$(_k_0, _slot_0)), ($kit_bonus$(_t_0, ((_slot_0 + 1) >>> 0))));
  }
}

function $will_bonus$(_w_0) {
  const _x_0 = ($at_u32$(_w_0, 0));
  const _x_1 = ($at_u32$(_w_0, 1));
  return {$: "Bonus", "atkf": (Math.imul(3, _x_0) >>> 0), "atkp": 0, "hpp": (Math.imul(2, _x_1) >>> 0), "dfnf": ($at_u32$(_w_0, 2)), "dmgp": ($at_u32$(_w_0, 3)), "bossp": 0, "normp": 0, "taip": 0, "ninp": 0, "fd": 1000, "cr": 0, "cdmg": 0, "pen": 1000, "haste": 0, "cdr": 0, "regen": 0, "hpr": 0, "jlv": 0, "ckf": 0};
}

function $bag_bonus$(_bag_0) {
  const _smns_0 = ($Bag$smns$(_bag_0));
  const _eq_0 = ($bonus_add$(($smn_equip$(($Bag$smain$(_bag_0)), _smns_0)), ($bonus_add$(($smn_equip$(($Bag$ssub1$(_bag_0)), _smns_0)), ($smn_equip$(($Bag$ssub2$(_bag_0)), _smns_0))))));
  const _w_0 = ($Bonus$with_atkp$(($bonus_none$()), ($owned_weps$(($Bag$weps$(_bag_0)), 0))));
  return $bonus_add$(($bonus_add$(_w_0, ($owned_smns$(_smns_0, 0)))), ($bonus_add$(_eq_0, ($bonus_add$(($kit_bonus$(($Bag$kit$(_bag_0)), 0)), ($bonus_add$(($will_bonus$(($Bag$will$(_bag_0)))), ($lines_bonus$(($Bag$aff$(_bag_0)))))))))));
}

function $run_bonus$(_run_0) {
  const _s_0 = ($len$(($Run$sealed$(_run_0))));
  const _seal_0 = ($Bonus$with_ckf$(($Bonus$with_dmgp$(($bonus_none$()), (Math.imul(6, _s_0) >>> 0))), (Math.imul(10, _s_0) >>> 0)));
  return $bonus_add$(($arts_bonus$(($Run$arts$(_run_0)))), ($bonus_add$(_seal_0, ($bag_bonus$(($Run$bag$(_run_0)))))));
}

function $status0$() {
  return {$: "Status", "burn": 0, "poison": 0, "stun": 0, "guard": 0, "atkup": 0, "defup": 0, "defdown": 0, "evade": 0, "clones": 0, "charge": 0, "guts": 0, "mark": 0, "markt": 0, "burnd": 0, "poisd": 0};
}

function $body_learns$(_b_0) {
  if (_b_0.$ === "Ninja") {
    const _w_0 = _b_0["who"];
    return $who_moves$(_w_0);
  } else {
    return {$: "Nil"};
  }
}

function $generic_moves$() {
  return {$: "Con", "head": {$: "GShurikenStorm"}, "tail": {$: "Con", "head": {$: "GPhoenixFlower"}, "tail": {$: "Con", "head": {$: "GWaterBullet"}, "tail": {$: "Con", "head": {$: "GGreatBreakthrough"}, "tail": {$: "Con", "head": {$: "GEarthWall"}, "tail": {$: "Con", "head": {$: "GSubstitution"}, "tail": {$: "Con", "head": {$: "GTagBarrage"}, "tail": {$: "Con", "head": {$: "GBodyFlicker"}, "tail": {$: "Con", "head": {$: "GThunderHound"}, "tail": {$: "Con", "head": {$: "GMistVeil"}, "tail": {$: "Con", "head": {$: "GTreeBind"}, "tail": {$: "Con", "head": {$: "GHealingPalm"}, "tail": {$: "Con", "head": {$: "GDragonFlame"}, "tail": {$: "Con", "head": {$: "GHeadhunter"}, "tail": {$: "Con", "head": {$: "GSickleWeasel"}, "tail": {$: "Con", "head": {$: "GFalseDarkness"}, "tail": {$: "Con", "head": {$: "GGreatWaterfall"}, "tail": {$: "Con", "head": {$: "GFrogKumite"}, "tail": {$: "Con", "head": {$: "GRashomon"}, "tail": {$: "Con", "head": {$: "GYinHealing"}, "tail": {$: "Con", "head": {$: "GMultiClone"}, "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}};
}

function $gen_count$() {
  return 21;
}

function $gen_move$(_k_0) {
  return $Maybe$default$(($List$get$(($generic_moves$()), _k_0)), {$: "GBodyFlicker"});
}

function $gen_rarity$(_k_0) {
  return $Bool$pick$((_k_0 < 8), 0, ($Bool$pick$((_k_0 < 15), 1, 2)));
}

function $gen_price$(_k_0) {
  return $at_u32$({$: "Con", "head": 45, "tail": {$: "Con", "head": 75, "tail": {$: "Con", "head": 120, "tail": {$: "Nil"}}}}, ($gen_rarity$(_k_0)));
}

function $gen_in_band$(_band_0, _seed_0, _salt_0) {
  const _x_0 = ($at_u32$({$: "Con", "head": 0, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 15, "tail": {$: "Nil"}}}}, _band_0));
  const _x_1 = ($roll$(_seed_0, _salt_0, ($at_u32$({$: "Con", "head": 8, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 6, "tail": {$: "Nil"}}}}, _band_0))));
  return ((_x_0 + _x_1) >>> 0);
}

function $gen_band$(_rare_0, _seed_0, _salt_0) {
  const _r_0 = ($roll$(_seed_0, _salt_0, 100));
  const _x_0 = ((_rare_0 + 37) >>> 0);
  return $Bool$pick$((_r_0 < _rare_0), 2, ($Bool$pick$((_r_0 < _x_0), 1, 0)));
}

function $gen_offer$go$($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _n_0 = $0;
      const _acc_0 = $1;
      const _rare_0 = $2;
      const _seed_0 = $3;
      const _salt_0 = $4;
      if (_n_0 === 0) {
        return _acc_0;
      } else {
        const _p_0 = (_n_0 - 1);
        const _k_0 = ($gen_in_band$(($gen_band$(_rare_0, _seed_0, _salt_0)), _seed_0, ((_salt_0 + 1) >>> 0)));
        const _x_0 = ($len$(_acc_0));
        const _x_1 = (_x_0 >= 3);
        const _x_2 = ($has_u32$(_acc_0, _k_0));
        const _skip_0 = (_x_1 || _x_2);
        $0 = _p_0;
        $1 = ($Bool$pick$(_skip_0, _acc_0, ($snoc$(_acc_0, _k_0))));
        $2 = _rare_0;
        $3 = _seed_0;
        $4 = ((_salt_0 + 7) >>> 0);
        continue;
      }
    }
  }
}

function $gen_offer$(_rare_0, _seed_0, _salt_0) {
  return $gen_offer$go$(24, {$: "Nil"}, _rare_0, _seed_0, _salt_0);
}

function $mk_fighter$(_body_0, _side_0, _lvl_0, _hp_0, _ck_0, _s_0, _bon_0, _jlv_0) {
  const _mhp_0 = _s_0["hp"];
  const _mck_0 = _s_0["ck"];
  const _atk_0 = _s_0["atk"];
  const _nin_0 = _s_0["nin"];
  const _dfn_0 = _s_0["dfn"];
  const _spd_0 = _s_0["spd"];
  return {$: "Fighter", "body": _body_0, "side": _side_0, "lvl": _lvl_0, "hp": ($u32_min$(_hp_0, _mhp_0)), "mhp": _mhp_0, "ck": ($u32_min$(_ck_0, _mck_0)), "mck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0, "bon": _bon_0, "st": ($status0$()), "tmr": 0, "cds": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}}}, "jlv": _jlv_0, "form": 0, "ftier": 0, "kit": ($body_learns$(_body_0))};
}

function $dummy_fighter$() {
  return $mk_fighter$({$: "Enemy", "foe": {$: "Zori"}}, 1, 1, 0, 0, {$: "Stats", "hp": 1, "ck": 0, "atk": 0, "nin": 0, "dfn": 0, "spd": 0}, ($bonus_none$()), {$: "Nil"});
}

function $training_dummy$(_dfn_0) {
  return $mk_fighter$({$: "Enemy", "foe": {$: "Dummy"}}, 1, 1, 1000000000, 0, {$: "Stats", "hp": 1000000000, "ck": 0, "atk": 0, "nin": 0, "dfn": _dfn_0, "spd": 12}, ($bonus_base$()), {$: "Nil"});
}

function $member_stats$(_m_0, _bon_0) {
  const _w_0 = ($Member$who$(_m_0));
  const _l_0 = ($sub0$(($Member$lvl$(_m_0)), 1));
  const _b_0 = ($who_base$(_w_0));
  const _g_0 = ($who_grow$(_w_0));
  const _x_0 = ($Stats$hp$(_g_0));
  const _x_1 = ($Stats$hp$(_b_0));
  const _x_2 = (Math.imul(_x_0, _l_0) >>> 0);
  const _hp_0 = ((_x_1 + _x_2) >>> 0);
  const _x_3 = ($Bonus$hpp$(_bon_0));
  const _mhp_0 = ($pct$(_hp_0, ((100 + _x_3) >>> 0)));
  const _x_4 = ($Stats$ck$(_g_0));
  const _x_5 = ($Stats$ck$(_b_0));
  const _x_6 = (Math.imul(_x_4, _l_0) >>> 0);
  const _x_7 = ((_x_5 + _x_6) >>> 0);
  const _x_8 = ($Bonus$ckf$(_bon_0));
  const _mck_0 = ((_x_7 + _x_8) >>> 0);
  const _x_9 = ($Stats$atk$(_g_0));
  const _x_10 = ($Stats$atk$(_b_0));
  const _x_11 = (Math.imul(_x_9, _l_0) >>> 0);
  const _atk_0 = ((_x_10 + _x_11) >>> 0);
  const _x_12 = ($Stats$nin$(_g_0));
  const _x_13 = ($Stats$nin$(_b_0));
  const _x_14 = (Math.imul(_x_12, _l_0) >>> 0);
  const _nin_0 = ((_x_13 + _x_14) >>> 0);
  const _x_15 = ($Stats$dfn$(_g_0));
  const _x_16 = ($Stats$dfn$(_b_0));
  const _x_17 = (Math.imul(_x_15, _l_0) >>> 0);
  const _x_18 = ((_x_16 + _x_17) >>> 0);
  const _x_19 = ($Bonus$dfnf$(_bon_0));
  const _dfn_0 = ((_x_18 + _x_19) >>> 0);
  const _x_20 = ($Stats$spd$(_g_0));
  const _x_21 = ($Stats$spd$(_b_0));
  const _x_22 = (Math.imul(_x_20, _l_0) >>> 0);
  const _spd_0 = ((_x_21 + _x_22) >>> 0);
  return {$: "Stats", "hp": _mhp_0, "ck": _mck_0, "atk": _atk_0, "nin": _nin_0, "dfn": _dfn_0, "spd": _spd_0};
}

function $kit_merge$(_ls_0, _ts_0) {
  if (_ls_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _l_0 = _ls_0["head"];
    const _lt_0 = _ls_0["tail"];
    if (_ts_0.$ === "Nil") {
      return {$: "Con", "head": _l_0, "tail": _lt_0};
    } else {
      const _x_0 = _ts_0["head"];
      const _xt_0 = _ts_0["tail"];
      return {$: "Con", "head": ($Bool$pick$(($gt0$(_x_0)), {$: "Learn", "move": ($gen_move$(($sub0$(_x_0, 1)))), "lvl": 1}, _l_0)), "tail": ($kit_merge$(_lt_0, _xt_0))};
    }
  }
}

function $member_kit$(_m_0) {
  return $kit_merge$(($who_moves$(($Member$who$(_m_0)))), ($Member$tech$(_m_0)));
}

function $member_fighter$(_m_0, _bon_0, _weps_0) {
  const _b_0 = ($bonus_add$(($bonus_base$()), ($bonus_add$(_bon_0, ($bonus_add$(($who_bonus$(($Member$who$(_m_0)))), ($weapon_bonus$(($Member$weapon$(_m_0)), _weps_0))))))));
  return $Fighter$with_kit$(($Fighter$with_ftier$(($mk_fighter$({$: "Ninja", "who": ($Member$who$(_m_0))}, 0, ($Member$lvl$(_m_0)), ($Member$hp$(_m_0)), ($Member$ck$(_m_0)), ($member_stats$(_m_0, _bon_0)), _b_0, ($Member$jlv$(_m_0)))), ($Member$ftier$(_m_0)))), ($member_kit$(_m_0)));
}

function $party_fighters$(_ms_0, _bon_0, _weps_0) {
  if (_ms_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    return {$: "Con", "head": ($member_fighter$(_m_0, _bon_0, _weps_0)), "tail": ($party_fighters$(_t_0, _bon_0, _weps_0))};
  }
}

function $foe_fighter$(_f_0, _lvl_0) {
  const _fi_0 = ($foe_info$(_f_0));
  const _x_0 = (Math.imul(10, _lvl_0) >>> 0);
  const _k_0 = ((90 + _x_0) >>> 0);
  const _mhp_0 = ($pct$(($FoeInfo$hp$(_fi_0)), _k_0));
  const _x_1 = ($FoeInfo$dfn$(_fi_0));
  const _x_2 = (2 === 0 ? 0 : (_lvl_0 / 2) >>> 0);
  const _x_3 = ($FoeInfo$spd$(_fi_0));
  const _x_4 = (2 === 0 ? 0 : (_lvl_0 / 2) >>> 0);
  return $mk_fighter$({$: "Enemy", "foe": _f_0}, 1, _lvl_0, _mhp_0, 0, {$: "Stats", "hp": _mhp_0, "ck": 0, "atk": ($pct$(($FoeInfo$atk$(_fi_0)), _k_0)), "nin": ($pct$(($FoeInfo$nin$(_fi_0)), _k_0)), "dfn": ((_x_1 + _x_2) >>> 0), "spd": ((_x_3 + _x_4) >>> 0)}, ($bonus_base$()), {$: "Nil"});
}

function $foe_fighters$(_fs_0, _lvl_0) {
  if (_fs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fs_0["head"];
    const _t_0 = _fs_0["tail"];
    return {$: "Con", "head": ($foe_fighter$(_f_0, _lvl_0)), "tail": ($foe_fighters$(_t_0, _lvl_0))};
  }
}

function $foe_mult$(_act_0, _boss_0, _dmg_0) {
  const _mob_hp_0 = ($at_u32$({$: "Con", "head": 1800, "tail": {$: "Con", "head": 2255, "tail": {$: "Con", "head": 3300, "tail": {$: "Nil"}}}}, _act_0));
  const _mob_dmg_0 = ($at_u32$({$: "Con", "head": 1980, "tail": {$: "Con", "head": 2440, "tail": {$: "Con", "head": 3500, "tail": {$: "Nil"}}}}, _act_0));
  const _boss_k_0 = ($at_u32$({$: "Con", "head": 1925, "tail": {$: "Con", "head": 2120, "tail": {$: "Con", "head": 3500, "tail": {$: "Nil"}}}}, _act_0));
  return $Bool$pick$(_boss_0, _boss_k_0, ($Bool$pick$(_dmg_0, _mob_dmg_0, _mob_hp_0)));
}

function $mul_k$(_x_0, _k_0) {
  const _x_1 = (Math.imul(_x_0, _k_0) >>> 0);
  return (1000 === 0 ? 0 : (_x_1 / 1000) >>> 0);
}

function $scale_foes$(_fs_0, _kh_0, _kd_0) {
  if (_fs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fs_0["head"];
    const _t_0 = _fs_0["tail"];
    const _hp_0 = ($mul_k$(($Fighter$mhp$(_f_0)), _kh_0));
    const _f2_0 = ($Fighter$with_nin$(($Fighter$with_atk$(($Fighter$with_hp$(($Fighter$with_mhp$(_f_0, _hp_0)), _hp_0)), ($mul_k$(($Fighter$atk$(_f_0)), _kd_0)))), ($mul_k$(($Fighter$nin$(_f_0)), _kd_0))));
    return {$: "Con", "head": _f2_0, "tail": ($scale_foes$(_t_0, _kh_0, _kd_0))};
  }
}

function $act_foes$(_fs_0, _act_0, _boss_0) {
  return $scale_foes$(_fs_0, ($foe_mult$(_act_0, _boss_0, false)), ($foe_mult$(_act_0, _boss_0, true)));
}

function $beast_fighter$(_t_0) {
  const _fi_0 = ($foe_info$({$: "Beast", "tails": _t_0}));
  return $mk_fighter$({$: "Enemy", "foe": {$: "Beast", "tails": _t_0}}, 1, (Math.imul(3, _t_0) >>> 0), ($FoeInfo$hp$(_fi_0)), 0, {$: "Stats", "hp": ($FoeInfo$hp$(_fi_0)), "ck": 0, "atk": ($FoeInfo$atk$(_fi_0)), "nin": ($FoeInfo$nin$(_fi_0)), "dfn": ($FoeInfo$dfn$(_fi_0)), "spd": ($FoeInfo$spd$(_fi_0))}, ($bonus_base$()), {$: "Nil"});
}

function $f_alive$(_f_0) {
  return $gt0$(($Fighter$hp$(_f_0)));
}

function $f_name$(_f_0) {
  return $body_name$(($Fighter$body$(_f_0)));
}

function $f_party$(_f_0) {
  const _x_0 = ($Fighter$side$(_f_0));
  return (_x_0 === 0);
}

function $fbon$(_f_0) {
  const _form_0 = ($Fighter$form$(_f_0));
  return $Bool$pick$(($gt0$(_form_0)), ($bonus_add$(($Fighter$bon$(_f_0)), ($FormInfo$bon$(($form_body$(($Fighter$body$(_f_0)), _form_0)))))), ($Fighter$bon$(_f_0)));
}

function $sget$(_s_0, _f_0) {
  if (_s_0.$ === "SBurn") {
    return $Status$burn$(($Fighter$st$(_f_0)));
  } else if (_s_0.$ === "SPoison") {
    return $Status$poison$(($Fighter$st$(_f_0)));
  } else if (_s_0.$ === "SStun") {
    return $Status$stun$(($Fighter$st$(_f_0)));
  } else if (_s_0.$ === "SGuard") {
    return $Status$guard$(($Fighter$st$(_f_0)));
  } else if (_s_0.$ === "SAtkUp") {
    return $Status$atkup$(($Fighter$st$(_f_0)));
  } else if (_s_0.$ === "SDefUp") {
    return $Status$defup$(($Fighter$st$(_f_0)));
  } else if (_s_0.$ === "SDefDown") {
    return $Status$defdown$(($Fighter$st$(_f_0)));
  } else if (_s_0.$ === "SEvade") {
    return $Status$evade$(($Fighter$st$(_f_0)));
  } else if (_s_0.$ === "SClones") {
    return $Status$clones$(($Fighter$st$(_f_0)));
  } else {
    return $Status$charge$(($Fighter$st$(_f_0)));
  }
}

function $sset$(_s_0, _f_0, _v_0) {
  if (_s_0.$ === "SBurn") {
    return $Fighter$with_st$(_f_0, ($Status$with_burn$(($Fighter$st$(_f_0)), _v_0)));
  } else if (_s_0.$ === "SPoison") {
    return $Fighter$with_st$(_f_0, ($Status$with_poison$(($Fighter$st$(_f_0)), _v_0)));
  } else if (_s_0.$ === "SStun") {
    return $Fighter$with_st$(_f_0, ($Status$with_stun$(($Fighter$st$(_f_0)), _v_0)));
  } else if (_s_0.$ === "SGuard") {
    return $Fighter$with_st$(_f_0, ($Status$with_guard$(($Fighter$st$(_f_0)), _v_0)));
  } else if (_s_0.$ === "SAtkUp") {
    return $Fighter$with_st$(_f_0, ($Status$with_atkup$(($Fighter$st$(_f_0)), _v_0)));
  } else if (_s_0.$ === "SDefUp") {
    return $Fighter$with_st$(_f_0, ($Status$with_defup$(($Fighter$st$(_f_0)), _v_0)));
  } else if (_s_0.$ === "SDefDown") {
    return $Fighter$with_st$(_f_0, ($Status$with_defdown$(($Fighter$st$(_f_0)), _v_0)));
  } else if (_s_0.$ === "SEvade") {
    return $Fighter$with_st$(_f_0, ($Status$with_evade$(($Fighter$st$(_f_0)), _v_0)));
  } else if (_s_0.$ === "SClones") {
    return $Fighter$with_st$(_f_0, ($Status$with_clones$(($Fighter$st$(_f_0)), _v_0)));
  } else {
    return $Fighter$with_st$(_f_0, ($Status$with_charge$(($Fighter$st$(_f_0)), _v_0)));
  }
}

function $f_guts$(_f_0) {
  return $Status$guts$(($Fighter$st$(_f_0)));
}

function $f_with_guts$(_f_0, _v_0) {
  return $Fighter$with_st$(_f_0, ($Status$with_guts$(($Fighter$st$(_f_0)), _v_0)));
}

function $st_merge$(_s_0, _cur_0, _turns_0) {
  if (_s_0.$ === "SClones") {
    return $u32_min$(((_cur_0 + _turns_0) >>> 0), 4);
  } else {
    return $u32_max$(_cur_0, _turns_0);
  }
}

function $st_is_stun$(_s_0) {
  if (_s_0.$ === "SStun") {
    return true;
  } else {
    return false;
  }
}

function $stat_val$(_s_0, _f_0) {
  if (_s_0.$ === "AtkS") {
    return $Fighter$atk$(_f_0);
  } else {
    return $Fighter$nin$(_f_0);
  }
}

function $stat_is_atk$(_s_0) {
  if (_s_0.$ === "AtkS") {
    return true;
  } else {
    return false;
  }
}

function $atk_total$(_fa_0, _stat_0) {
  const _bon_0 = ($fbon$(_fa_0));
  const _x_0 = ($Bonus$atkp$(_bon_0));
  const _x_1 = ((100 + _x_0) >>> 0);
  const _x_2 = ($Bool$pick$(($gt0$(($sget$({$: "SAtkUp"}, _fa_0)))), 40, 0));
  const _atkp_0 = ((_x_1 + _x_2) >>> 0);
  const _x_3 = ($stat_val$(_stat_0, _fa_0));
  const _x_4 = ($Bonus$atkf$(_bon_0));
  return $pct$(((_x_3 + _x_4) >>> 0), _atkp_0);
}

function $dot_power$(_fa_0) {
  return $u32_max$(($pct$(($atk_total$(_fa_0, {$: "NinS"})), 35)), 1);
}

function $delay$(_f_0) {
  const _x_0 = ($Bonus$haste$(($fbon$(_f_0))));
  const _x_1 = ($u32_max$(($pct$(($Fighter$spd$(_f_0)), ((100 + _x_0) >>> 0))), 1));
  return (_x_1 === 0 ? 0 : (12000 / _x_1) >>> 0);
}

function $fget$(_fs_0, _i_0) {
  return $Maybe$default$(($List$get$(_fs_0, _i_0)), ($dummy_fighter$()));
}

function $bf$(_b_0, _i_0) {
  return $fget$(($Battle$fs$(_b_0)), _i_0);
}

function $bset$(_b_0, _i_0, _f_0) {
  return $Battle$with_fs$(_b_0, ($List$set$(($Battle$fs$(_b_0)), _i_0, _f_0)));
}

function $blog$(_b_0, _e_0) {
  return $Battle$with_log$(_b_0, ($snoc$(($Battle$log$(_b_0)), _e_0)));
}

function $clear_log$(_b_0) {
  return $Battle$with_log$(_b_0, {$: "Nil"});
}

function $keep_idx$(_i_0, _keep_0, _rest_0) {
  if (_keep_0) {
    return {$: "Con", "head": _i_0, "tail": _rest_0};
  } else {
    return _rest_0;
  }
}

function $side_alive$go$(_fs_0, _side_0, _i_0) {
  if (_fs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fs_0["head"];
    const _t_0 = _fs_0["tail"];
    const _x_0 = ($Fighter$side$(_f_0));
    return $keep_idx$(_i_0, ($Bool$and$((_x_0 === _side_0), ($f_alive$(_f_0)))), ($side_alive$go$(_t_0, _side_0, ((_i_0 + 1) >>> 0))));
  }
}

function $side_alive$(_b_0, _side_0) {
  return $side_alive$go$(($Battle$fs$(_b_0)), _side_0, 0);
}

function $any_alive$(_b_0, _side_0) {
  return $gt0$(($len$(($side_alive$(_b_0, _side_0)))));
}

function $pick_alive$(_b_0, _side_0, _seed_0, _salt_0) {
  const _xs_0 = ($side_alive$(_b_0, _side_0));
  return $at_u32$(_xs_0, ($roll$(_seed_0, _salt_0, ($len$(_xs_0)))));
}

function $gain_ck$(_b_0, _i_0, _amt_0) {
  const _f_0 = ($bf$(_b_0, _i_0));
  const _x_0 = ($Fighter$ck$(_f_0));
  return $bset$(_b_0, _i_0, ($Fighter$with_ck$(_f_0, ($u32_min$(($Fighter$mck$(_f_0)), ((_x_0 + _amt_0) >>> 0))))));
}

function $gain_ck_log$(_b_0, _i_0, _amt_0, _show_0) {
  if (_show_0) {
    return $blog$(($gain_ck$(_b_0, _i_0, _amt_0)), {$: "EvCk", "who": _i_0, "amt": _amt_0});
  } else {
    return _b_0;
  }
}

function $retarget$(_b_0, _side_0, _t_0, _seed_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _x_0 = ($Fighter$side$(_ft_0));
  return $Bool$pick$(($Bool$and$((_x_0 === _side_0), ($f_alive$(_ft_0)))), _t_0, ($pick_alive$(_b_0, _side_0, _seed_0, 77)));
}

function $ally_or_self$(_b_0, _a_0, _t_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _x_0 = ($Fighter$side$(_ft_0));
  const _x_1 = ($Fighter$side$(($bf$(_b_0, _a_0))));
  return $Bool$pick$(($Bool$and$((_x_0 === _x_1), ($f_alive$(_ft_0)))), _t_0, _a_0);
}

function $targets$(_tgt_0, _b_0, _a_0, _t_0, _seed_0) {
  if (_tgt_0.$ === "OneFoe") {
    const _x_0 = ($Fighter$side$(($bf$(_b_0, _a_0))));
    return {$: "Con", "head": ($retarget$(_b_0, ((1 - _x_0) >>> 0), _t_0, _seed_0)), "tail": {$: "Nil"}};
  } else if (_tgt_0.$ === "AllFoes") {
    const _x_1 = ($Fighter$side$(($bf$(_b_0, _a_0))));
    return $side_alive$(_b_0, ((1 - _x_1) >>> 0));
  } else if (_tgt_0.$ === "OneAlly") {
    return {$: "Con", "head": ($ally_or_self$(_b_0, _a_0, _t_0)), "tail": {$: "Nil"}};
  } else if (_tgt_0.$ === "AllAllies") {
    return $side_alive$(_b_0, ($Fighter$side$(($bf$(_b_0, _a_0)))));
  } else if (_tgt_0.$ === "OnSelf") {
    return {$: "Con", "head": _a_0, "tail": {$: "Nil"}};
  } else {
    return {$: "Con", "head": _t_0, "tail": {$: "Nil"}};
  }
}

function $tgt_offensive$(_t_0) {
  if (_t_0.$ === "OneFoe") {
    return true;
  } else if (_t_0.$ === "AllFoes") {
    return true;
  } else {
    return false;
  }
}

function $dot_set$(_s_0, _f_0, _pw_0) {
  if (_s_0.$ === "SBurn") {
    return $Fighter$with_st$(_f_0, ($Status$with_burnd$(($Fighter$st$(_f_0)), ($u32_max$(($Status$burnd$(($Fighter$st$(_f_0)))), _pw_0)))));
  } else if (_s_0.$ === "SPoison") {
    return $Fighter$with_st$(_f_0, ($Status$with_poisd$(($Fighter$st$(_f_0)), ($u32_max$(($Status$poisd$(($Fighter$st$(_f_0)))), _pw_0)))));
  } else {
    return _f_0;
  }
}

function $give$go$(_b_0, _t_0, _st_0, _turns_0, _pw_0, _ok_0) {
  if (!_ok_0) {
    return _b_0;
  } else {
    const _ft_0 = ($bf$(_b_0, _t_0));
    return $blog$(($bset$(_b_0, _t_0, ($dot_set$(_st_0, ($sset$(_st_0, _ft_0, ($st_merge$(_st_0, ($sget$(_st_0, _ft_0)), _turns_0)))), _pw_0)))), {$: "EvStatus", "who": _t_0, "st": _st_0});
  }
}

function $give$(_b_0, _seed_0, _t_0, _st_0, _turns_0, _ch_0, _pw_0, _salt_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _big_0 = ($Bool$and$(($st_is_stun$(_st_0)), ($gt0$(($body_tails$(($Fighter$body$(_ft_0))))))));
  const _ch2_0 = ($Bool$pick$(_big_0, (3 === 0 ? 0 : (_ch_0 / 3) >>> 0), _ch_0));
  return $give$go$(_b_0, _t_0, _st_0, _turns_0, _pw_0, ($Bool$and$(($f_alive$(_ft_0)), ($chance$(_seed_0, _salt_0, _ch2_0)))));
}

function $combo_by_key$(_k_0) {
  const _c1_0 = ($Bool$pick$((_k_0 === 12), 1, 0));
  const _c2_0 = ($Bool$pick$((_k_0 === 35), 2, _c1_0));
  const _c3_0 = ($Bool$pick$((_k_0 === 45), 3, _c2_0));
  const _c4_0 = ($Bool$pick$((_k_0 === 23), 4, _c3_0));
  const _c5_0 = ($Bool$pick$((_k_0 === 14), 5, _c4_0));
  return $Bool$pick$((_k_0 === 67), 6, _c5_0);
}

function $combo_of$(_mark_0, _nat_0) {
  const _x_0 = ($u32_min$(_mark_0, _nat_0));
  const _x_1 = (Math.imul(_x_0, 10) >>> 0);
  const _x_2 = ($u32_max$(_mark_0, _nat_0));
  const _k_0 = ((_x_1 + _x_2) >>> 0);
  const _valid_0 = ($Bool$and$(($gt0$(_mark_0)), ($Bool$and$(($gt0$(_nat_0)), ($Bool$not$((_mark_0 === _nat_0)))))));
  return $Bool$pick$(_valid_0, ($combo_by_key$(_k_0)), 0);
}

function $combo_name$(_c_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "", "tail": {$: "Con", "head": "Firestorm", "tail": {$: "Con", "head": "Conduction", "tail": {$: "Con", "head": "Mudslide", "tail": {$: "Con", "head": "Plasma Gale", "tail": {$: "Con", "head": "Lava", "tail": {$: "Con", "head": "Yin-Yang", "tail": {$: "Nil"}}}}}}}}, _c_0)), "");
}

function $combo_mult$(_c_0) {
  return $Bool$pick$(($gt0$(_c_0)), ($at_u32$({$: "Con", "head": 100, "tail": {$: "Con", "head": 160, "tail": {$: "Con", "head": 135, "tail": {$: "Con", "head": 100, "tail": {$: "Con", "head": 130, "tail": {$: "Con", "head": 100, "tail": {$: "Con", "head": 200, "tail": {$: "Nil"}}}}}}}}, _c_0)), 100);
}

function $combo_pen$(_c_0) {
  return $Bool$pick$((_c_0 === 4), 40, 0);
}

function $nature_name$(_n_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "", "tail": {$: "Con", "head": "Fire", "tail": {$: "Con", "head": "Wind", "tail": {$: "Con", "head": "Lightning", "tail": {$: "Con", "head": "Earth", "tail": {$: "Con", "head": "Water", "tail": {$: "Con", "head": "Yin", "tail": {$: "Con", "head": "Yang", "tail": {$: "Nil"}}}}}}}}}, _n_0)), "");
}

function $live_mark$(_b_0, _f_0) {
  const _st_0 = ($Fighter$st$(_f_0));
  const _x_0 = ($Status$markt$(_st_0));
  const _x_1 = ($Battle$clock$(_b_0));
  return $Bool$pick$((_x_0 >= _x_1), ($Status$mark$(_st_0)), 0);
}

function $combo_log$(_b_0, _t_0, _combo_0) {
  return $Bool$pick$(($gt0$(_combo_0)), ($blog$(_b_0, {$: "EvCombo", "who": _t_0, "text": ($combo_name$(_combo_0))})), _b_0);
}

function $set_mark$(_b_0, _t_0, _nat_0, _combo_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _st_0 = ($Fighter$st$(_ft_0));
  const _fresh_0 = ($Bool$and$(($Bool$not$(($gt0$(_combo_0)))), ($gt0$(_nat_0))));
  const _nm_0 = ($Bool$pick$(($gt0$(_combo_0)), 0, ($Bool$pick$(($gt0$(_nat_0)), _nat_0, ($Status$mark$(_st_0))))));
  const _x_0 = ($Battle$clock$(_b_0));
  const _nt_0 = ($Bool$pick$(_fresh_0, ((_x_0 + 2000) >>> 0), ($Status$markt$(_st_0))));
  return $bset$(_b_0, _t_0, ($Fighter$with_st$(_ft_0, ($Status$with_markt$(($Status$with_mark$(_st_0, _nm_0)), _nt_0)))));
}

function $combo_fx$(_b_0, _seed_0, _t_0, _c_0, _pw_0, _salt_0) {
  const _x_0 = (_c_0 === 1);
  const _x_1 = (_c_0 === 5);
  const _b1_0 = ($give$(_b_0, _seed_0, _t_0, {$: "SBurn"}, 3, ($Bool$pick$((_x_0 || _x_1), 100, 0)), _pw_0, _salt_0));
  const _b2_0 = ($give$(_b1_0, _seed_0, _t_0, {$: "SStun"}, 1, ($Bool$pick$((_c_0 === 2), 50, 0)), _pw_0, ((_salt_0 + 1) >>> 0)));
  const _b3_0 = ($give$(_b2_0, _seed_0, _t_0, {$: "SDefDown"}, 2, ($Bool$pick$((_c_0 === 3), 100, 0)), _pw_0, ((_salt_0 + 2) >>> 0)));
  return $give$(_b3_0, _seed_0, _t_0, {$: "SPoison"}, 2, ($Bool$pick$((_c_0 === 5), 100, 0)), _pw_0, ((_salt_0 + 3) >>> 0));
}

function $is_boss$(_b_0) {
  if (_b_0.$ === "Enemy") {
    const _t_0 = _b_0["foe"];
    if (_t_0.$ === "Beast") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function $fd_apply$(_x_0, _fd_0) {
  const _x_1 = (1000 === 0 ? 0 : (_x_0 / 1000) >>> 0);
  const _x_2 = (Math.imul(_x_0, _fd_0) >>> 0);
  return $Bool$pick$((_x_0 > 1000000), (Math.imul(_x_1, _fd_0) >>> 0), (1000 === 0 ? 0 : (_x_2 / 1000) >>> 0));
}

function $calc_dmg$(_b_0, _seed_0, _fa_0, _ft_0, _stat_0, _pow_0, _pierce_0, _ctx_0, _combo_0, _salt_0) {
  const _bon_0 = ($fbon$(_fa_0));
  const _atk_hit_0 = ($stat_is_atk$(_stat_0));
  const _atk_0 = ($atk_total$(_fa_0, _stat_0));
  const _raw_0 = ($pct$(($pct$(_atk_0, _pow_0)), ($Act$pmul$(_ctx_0))));
  const _x_0 = ($combo_pen$(_combo_0));
  const _pier_0 = ($u32_min$(((_pierce_0 + _x_0) >>> 0), 100));
  const _d1_0 = ($pct$(($Fighter$dfn$(_ft_0)), ($Bool$pick$(($gt0$(($sget$({$: "SDefUp"}, _ft_0)))), 150, 100))));
  const _d2_0 = ($pct$(_d1_0, ($Bool$pick$(($gt0$(($sget$({$: "SDefDown"}, _ft_0)))), 70, 100))));
  const _d3_0 = ($pct$(($mul1000$(_d2_0, ($Bonus$pen$(_bon_0)))), ((100 - _pier_0) >>> 0)));
  const _x_1 = (Math.imul(_d3_0, 2) >>> 0);
  const _x_2 = (Math.imul(_raw_0, 100) >>> 0);
  const _x_3 = ((100 + _x_1) >>> 0);
  const _dm1_0 = (_x_3 === 0 ? 0 : (_x_2 / _x_3) >>> 0);
  const _kind_0 = ($Bool$pick$(($is_boss$(($Fighter$body$(_ft_0)))), ($Bonus$bossp$(_bon_0)), ($Bonus$normp$(_bon_0))));
  const _style_0 = ($Bool$pick$(_atk_hit_0, ($Bonus$taip$(_bon_0)), ($Bonus$ninp$(_bon_0))));
  const _bound_0 = ($Bool$pick$(($gt0$(($sget$({$: "SStun"}, _ft_0)))), 30, 0));
  const _x_4 = ($Bonus$dmgp$(_bon_0));
  const _x_5 = ((100 + _x_4) >>> 0);
  const _x_6 = ((_x_5 + _kind_0) >>> 0);
  const _x_7 = ((_x_6 + _style_0) >>> 0);
  const _x_8 = ($Act$chain$(_ctx_0));
  const _x_9 = ((_x_7 + _x_8) >>> 0);
  const _bucket_0 = ((_x_9 + _bound_0) >>> 0);
  const _dm2_0 = ($pct$(($fd_apply$(($pct$(_dm1_0, _bucket_0)), ($Bonus$fd$(_bon_0)))), ($combo_mult$(_combo_0))));
  const _x_10 = ($roll$(_seed_0, _salt_0, 11));
  const _dm3_0 = ($pct$(_dm2_0, ((95 + _x_10) >>> 0)));
  const _crit_0 = ($chance$(_seed_0, ((_salt_0 + 1) >>> 0), ($Bonus$cr$(_bon_0))));
  const _x_11 = ($Bonus$cdmg$(_bon_0));
  const _dm4_0 = ($Bool$pick$(_crit_0, ($pct$(_dm3_0, ((150 + _x_11) >>> 0))), _dm3_0));
  const _dm5_0 = ($Bool$pick$(($gt0$(($sget$({$: "SGuard"}, _ft_0)))), ($pct$(_dm4_0, 50)), _dm4_0));
  return {$: "Tuple", "fst": ($u32_max$(_dm5_0, 1)), "snd": _crit_0};
}

function $hurt$go$(_b_0, _i_0, _f_0, _dmg_0, _lives_0, _guts_0) {
  if (_lives_0) {
    const _x_0 = ($Fighter$hp$(_f_0));
    return $bset$(_b_0, _i_0, ($Fighter$with_hp$(_f_0, ((_x_0 - _dmg_0) >>> 0))));
  } else {
    if (_guts_0) {
      const _x_1 = ($f_guts$(_f_0));
      const _x_2 = ($f_name$(_f_0));
      return $blog$(($bset$(_b_0, _i_0, ($f_with_guts$(($Fighter$with_hp$(_f_0, 1)), ((_x_1 - 1) >>> 0))))), {$: "EvSay", "text": (_x_2 + " refuses to fall!")});
    } else {
      return $blog$(($bset$(_b_0, _i_0, ($Fighter$with_hp$(_f_0, 0)))), {$: "EvKO", "who": _i_0});
    }
  }
}

function $hurt$(_b_0, _i_0, _dmg_0, _crit_0) {
  const _f_0 = ($bf$(_b_0, _i_0));
  const _x_0 = ($Fighter$hp$(_f_0));
  return $hurt$go$(($blog$(_b_0, {$: "EvHit", "who": _i_0, "dmg": _dmg_0, "crit": _crit_0})), _i_0, _f_0, _dmg_0, (_dmg_0 < _x_0), ($gt0$(($f_guts$(_f_0)))));
}

function $hurt_pair$(_b_0, _i_0, _r_0) {
  const _d_0 = _r_0["fst"];
  const _c_0 = _r_0["snd"];
  return $hurt$(_b_0, _i_0, _d_0, _c_0);
}

function $outcome$(_b_0, _seed_0, _a_0, _t_0, _salt_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _x_0 = ($Bool$not$(($f_alive$(_ft_0))));
  const _x_1 = ($Bool$not$(($f_alive$(($bf$(_b_0, _a_0))))));
  const _dead_0 = (_x_0 || _x_1);
  const _miss_0 = ($Bool$and$(($gt0$(($sget$({$: "SEvade"}, _ft_0)))), ($chance$(_seed_0, ((_salt_0 + 2) >>> 0), 50))));
  const _counter_0 = ($Bool$and$(($body_is$(($Fighter$body$(_ft_0)), {$: "Sasuke"})), ($chance$(_seed_0, ((_salt_0 + 3) >>> 0), 20))));
  const _sand1_0 = ($Bool$and$(($body_is$(($Fighter$body$(_ft_0)), {$: "Gaara"})), ($chance$(_seed_0, ((_salt_0 + 4) >>> 0), 25))));
  const _sand2_0 = ($Bool$and$(($f_party$(_ft_0)), ($Bool$and$(($has_art$(($Battle$arts$(_b_0)), {$: "SandGourd"})), ($chance$(_seed_0, ((_salt_0 + 5) >>> 0), 10))))));
  const _clone_0 = ($gt0$(($sget$({$: "SClones"}, _ft_0))));
  return $Bool$pick$(_dead_0, {$: "OutDead"}, ($Bool$pick$(_miss_0, {$: "OutMiss"}, ($Bool$pick$(_counter_0, {$: "OutCounter"}, ($Bool$pick$((_sand1_0 || _sand2_0), {$: "OutBlock"}, ($Bool$pick$(_clone_0, {$: "OutClone"}, {$: "OutHit"})))))))));
}

function $shark_skin$(_b_0, _a_0, _atk_hit_0) {
  return $gain_ck$(_b_0, _a_0, ($Bool$pick$(($Bool$and$(_atk_hit_0, ($Bool$and$(($f_party$(($bf$(_b_0, _a_0)))), ($has_art$(($Battle$arts$(_b_0)), {$: "SharkSkin"})))))), 5, 0)));
}

function $naked$(_f_0) {
  return $Fighter$with_dfn$(($sset$({$: "SGuard"}, ($sset$({$: "SDefUp"}, _f_0, 0)), 0)), 0);
}

function $incoming$go$(_o_0, _b_0, _seed_0, _ctx_0, _t_0, _stat_0, _pow_0, _pierce_0, _salt_0) {
  if (_o_0.$ === "OutDead") {
    return _b_0;
  } else {
    const _ft_0 = ($bf$(_b_0, _t_0));
    const _combo_0 = ($combo_of$(($live_mark$(_b_0, _ft_0)), ($Act$nat$(_ctx_0))));
    const _r_0 = ($calc_dmg$(_b_0, _seed_0, ($bf$(_b_0, ($Act$a$(_ctx_0)))), ($naked$(_ft_0)), _stat_0, _pow_0, _pierce_0, _ctx_0, _combo_0, _salt_0));
    return $blog$(_b_0, {$: "EvIncoming", "who": _t_0, "raw": ($Pair$fst$(_r_0))});
  }
}

function $land_hit$(_b_0, _seed_0, _ctx_0, _t_0, _stat_0, _pow_0, _pierce_0, _salt_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _nat_0 = ($Act$nat$(_ctx_0));
  const _combo_0 = ($combo_of$(($live_mark$(_b_0, _ft_0)), _nat_0));
  const _b1_0 = ($combo_log$(_b_0, _t_0, _combo_0));
  const _b2_0 = ($hurt_pair$(_b1_0, _t_0, ($calc_dmg$(_b1_0, _seed_0, ($bf$(_b1_0, ($Act$a$(_ctx_0)))), _ft_0, _stat_0, _pow_0, _pierce_0, _ctx_0, _combo_0, _salt_0))));
  const _b3_0 = ($set_mark$(($combo_fx$(_b2_0, _seed_0, _t_0, _combo_0, ($dot_power$(($bf$(_b2_0, ($Act$a$(_ctx_0)))))), ((_salt_0 + 50) >>> 0))), _t_0, _nat_0, _combo_0));
  return $shark_skin$(_b3_0, ($Act$a$(_ctx_0)), ($stat_is_atk$(_stat_0)));
}

function $hit$do$(_o_0, _b_0, _seed_0, _ctx_0, _t_0, _stat_0, _pow_0, _pierce_0, _salt_0) {
  if (_o_0.$ === "OutDead") {
    return _b_0;
  } else if (_o_0.$ === "OutMiss") {
    return $blog$(_b_0, {$: "EvMiss", "who": _t_0});
  } else if (_o_0.$ === "OutCounter") {
    const _a_0 = ($Act$a$(_ctx_0));
    const _r_0 = ($calc_dmg$(_b_0, _seed_0, ($bf$(_b_0, _t_0)), ($bf$(_b_0, _a_0)), {$: "AtkS"}, 80, 0, {$: "Act", "a": _t_0, "nat": 0, "pmul": 100, "chain": 0}, 0, ((_salt_0 + 7) >>> 0)));
    return $hurt_pair$(($blog$(($blog$(_b_0, {$: "EvMiss", "who": _t_0})), {$: "EvSay", "text": "Sharingan! Sasuke counters."})), _a_0, _r_0);
  } else if (_o_0.$ === "OutBlock") {
    return $blog$(_b_0, {$: "EvBlock", "who": _t_0, "text": "Sand"});
  } else if (_o_0.$ === "OutClone") {
    const _ft_0 = ($bf$(_b_0, _t_0));
    return $blog$(($bset$(_b_0, _t_0, ($sset$({$: "SClones"}, _ft_0, ($sub0$(($sget$({$: "SClones"}, _ft_0)), 1)))))), {$: "EvBlock", "who": _t_0, "text": "Clone"});
  } else {
    return $land_hit$(_b_0, _seed_0, _ctx_0, _t_0, _stat_0, _pow_0, _pierce_0, _salt_0);
  }
}

function $hits$($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  for (;;) {
    {
      const _n_0 = $0;
      const _b_0 = $1;
      const _seed_0 = $2;
      const _ctx_0 = $3;
      const _t_0 = $4;
      const _stat_0 = $5;
      const _pow_0 = $6;
      const _pierce_0 = $7;
      const _salt_0 = $8;
      if (_n_0 === 0) {
        return _b_0;
      } else {
        const _p_0 = (_n_0 - 1);
        const _o_0 = ($outcome$(_b_0, _seed_0, ($Act$a$(_ctx_0)), _t_0, _salt_0));
        $0 = _p_0;
        $1 = ($hit$do$(_o_0, ($incoming$go$(_o_0, _b_0, _seed_0, _ctx_0, _t_0, _stat_0, _pow_0, _pierce_0, _salt_0)), _seed_0, _ctx_0, _t_0, _stat_0, _pow_0, _pierce_0, _salt_0));
        $2 = _seed_0;
        $3 = _ctx_0;
        $4 = _t_0;
        $5 = _stat_0;
        $6 = _pow_0;
        $7 = _pierce_0;
        $8 = ((_salt_0 + 17) >>> 0);
        continue;
      }
    }
  }
}

function $heal$go$(_b_0, _t_0, _ft_0, _amt_0, _alive_0) {
  if (!_alive_0) {
    return _b_0;
  } else {
    const _x_0 = ($Fighter$hp$(_ft_0));
    const _hp_0 = ($u32_min$(($Fighter$mhp$(_ft_0)), ((_x_0 + _amt_0) >>> 0)));
    const _x_1 = ($Fighter$hp$(_ft_0));
    return $blog$(($bset$(_b_0, _t_0, ($Fighter$with_hp$(_ft_0, _hp_0)))), {$: "EvHeal", "who": _t_0, "amt": ((_hp_0 - _x_1) >>> 0)});
  }
}

function $heal$(_b_0, _ctx_0, _t_0, _pow_0) {
  const _fa_0 = ($bf$(_b_0, ($Act$a$(_ctx_0))));
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _x_0 = ($Fighter$nin$(_fa_0));
  const _x_1 = ($pct$(($Fighter$mhp$(_ft_0)), _pow_0));
  const _x_2 = (2 === 0 ? 0 : (_x_0 / 2) >>> 0);
  const _amt0_0 = ($pct$(((_x_1 + _x_2) >>> 0), ($Act$pmul$(_ctx_0))));
  const _amt_0 = ($Bool$pick$(($body_is$(($Fighter$body$(_fa_0)), {$: "Sakura"})), ($pct$(_amt0_0, 150)), _amt0_0));
  return $heal$go$(_b_0, _t_0, _ft_0, _amt_0, ($f_alive$(_ft_0)));
}

function $drain$(_b_0, _a_0, _t_0, _amt_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _b1_0 = ($bset$(_b_0, _t_0, ($Fighter$with_ck$(_ft_0, ($sub0$(($Fighter$ck$(_ft_0)), _amt_0))))));
  return $gain_ck_log$(_b1_0, _a_0, _amt_0, ($f_alive$(_ft_0)));
}

function $cleanse$(_b_0, _t_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  const _x_0 = ($f_name$(_ft_0));
  return $blog$(($bset$(_b_0, _t_0, ($sset$({$: "SStun"}, ($sset$({$: "SPoison"}, ($sset$({$: "SBurn"}, _ft_0, 0)), 0)), 0)))), {$: "EvSay", "text": (_x_0 + " is cured.")});
}

function $revive$go$(_b_0, _t_0, _ft_0, _pow_0, _dead_0) {
  if (!_dead_0) {
    return _b_0;
  } else {
    return $blog$(($bset$(_b_0, _t_0, ($Fighter$with_hp$(_ft_0, ($u32_max$(($pct$(($Fighter$mhp$(_ft_0)), _pow_0)), 1)))))), {$: "EvRevive", "who": _t_0});
  }
}

function $revive$(_b_0, _t_0, _pow_0) {
  const _ft_0 = ($bf$(_b_0, _t_0));
  return $revive$go$(_b_0, _t_0, _ft_0, _pow_0, ($Bool$and$(($f_party$(_ft_0)), ($Bool$not$(($f_alive$(_ft_0)))))));
}

function $apply_eff$(_e_0, _b_0, _seed_0, _ctx_0, _t_0, _salt_0) {
  if (_e_0.$ === "Hit") {
    const _stat_0 = _e_0["stat"];
    const _pow_0 = _e_0["pow"];
    const _n_0 = _e_0["hits"];
    const _pierce_0 = _e_0["pierce"];
    return $hits$(_n_0, _b_0, _seed_0, _ctx_0, _t_0, _stat_0, _pow_0, _pierce_0, _salt_0);
  } else if (_e_0.$ === "Heal") {
    const _pow_1 = _e_0["pow"];
    return $heal$(_b_0, _ctx_0, _t_0, _pow_1);
  } else if (_e_0.$ === "Give") {
    const _st_0 = _e_0["st"];
    const _turns_0 = _e_0["turns"];
    const _ch_0 = _e_0["chance"];
    return $give$(_b_0, _seed_0, _t_0, _st_0, _turns_0, _ch_0, ($dot_power$(($bf$(_b_0, ($Act$a$(_ctx_0)))))), ((_salt_0 + 9) >>> 0));
  } else if (_e_0.$ === "Drain") {
    const _amt_0 = _e_0["amt"];
    return $drain$(_b_0, ($Act$a$(_ctx_0)), _t_0, _amt_0);
  } else if (_e_0.$ === "Chakra") {
    const _amt_1 = _e_0["amt"];
    return $gain_ck_log$(_b_0, _t_0, _amt_1, true);
  } else if (_e_0.$ === "SelfCk") {
    const _amt_2 = _e_0["amt"];
    return $gain_ck$(_b_0, ($Act$a$(_ctx_0)), _amt_2);
  } else if (_e_0.$ === "Cleanse") {
    return $cleanse$(_b_0, _t_0);
  } else if (_e_0.$ === "Revive") {
    const _pow_2 = _e_0["pow"];
    return $revive$(_b_0, _t_0, _pow_2);
  } else {
    return $blog$(($Battle$with_phase$(_b_0, {$: "Fled"})), {$: "EvSay", "text": "Smoke bomb! The squad slips away."});
  }
}

function $run_effs$($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _es_0 = $0;
      const _b_0 = $1;
      const _seed_0 = $2;
      const _ctx_0 = $3;
      const _t_0 = $4;
      const _salt_0 = $5;
      if (_es_0.$ === "Nil") {
        return _b_0;
      } else {
        const _e_0 = _es_0["head"];
        const _rest_0 = _es_0["tail"];
        $0 = _rest_0;
        $1 = ($apply_eff$(_e_0, _b_0, _seed_0, _ctx_0, _t_0, _salt_0));
        $2 = _seed_0;
        $3 = _ctx_0;
        $4 = _t_0;
        $5 = ((_salt_0 + 131) >>> 0);
        continue;
      }
    }
  }
}

function $run_targets$($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _ts_0 = $0;
      const _es_0 = $1;
      const _b_0 = $2;
      const _seed_0 = $3;
      const _ctx_0 = $4;
      const _salt_0 = $5;
      if (_ts_0.$ === "Nil") {
        return _b_0;
      } else {
        const _t_0 = _ts_0["head"];
        const _rest_0 = _ts_0["tail"];
        $0 = _rest_0;
        $1 = _es_0;
        $2 = ($run_effs$(_es_0, _b_0, _seed_0, _ctx_0, _t_0, _salt_0));
        $3 = _seed_0;
        $4 = _ctx_0;
        $5 = ((_salt_0 + 1009) >>> 0);
        continue;
      }
    }
  }
}

function $move_is$(_a_0, _b_0) {
  return $String$eq$(($MoveInfo$name$(($move_info$(_a_0)))), ($MoveInfo$name$(($move_info$(_b_0)))));
}

function $lee_strike$() {
  return $mi$("Taijutsu", 0, {$: "OneFoe"}, {$: "Con", "head": {$: "Hit", "stat": {$: "AtkS"}, "pow": 100, "hits": 2, "pierce": 0}, "tail": {$: "Con", "head": {$: "SelfCk", "amt": 8}, "tail": {$: "Nil"}}}, "Lee's taijutsu: 2 hits.");
}

function $actor_info$(_f_0, _m_0) {
  const _info_0 = ($move_info$(_m_0));
  const _x_0 = ($move_id$(_m_0));
  const _lee_0 = ($Bool$and$(($body_is$(($Fighter$body$(_f_0)), {$: "Lee"})), (_x_0 === 0)));
  const _i2_0 = ($Bool$pick$(_lee_0, ($lee_strike$()), _info_0));
  return $Bool$pick$(($body_is$(($Fighter$body$(_f_0)), {$: "Sakura"})), ($MoveInfo$with_cost$(_i2_0, ($pct$(($MoveInfo$cost$(_i2_0)), 75)))), _i2_0);
}

function $knows$(_ls_0, _lvl_0, _m_0) {
  if (_ls_0.$ === "Nil") {
    return false;
  } else {
    const _l_0 = _ls_0["head"];
    const _t_0 = _ls_0["tail"];
    const _x_0 = ($Learn$lvl$(_l_0));
    const _x_1 = ($Bool$and$(($move_is$(($Learn$move$(_l_0)), _m_0)), (_x_0 <= _lvl_0)));
    const _x_2 = ($knows$(_t_0, _lvl_0, _m_0));
    return (_x_1 || _x_2);
  }
}

function $move_slot$(_ls_0, _m_0, _i_0) {
  if (_ls_0.$ === "Nil") {
    return 99;
  } else {
    const _l_0 = _ls_0["head"];
    const _t_0 = _ls_0["tail"];
    return $Bool$pick$(($move_is$(($Learn$move$(_l_0)), _m_0)), _i_0, ($move_slot$(_t_0, _m_0, ((_i_0 + 1) >>> 0))));
  }
}

function $f_learns$(_f_0) {
  const _form_0 = ($Fighter$form$(_f_0));
  const _base_0 = ($Fighter$kit$(_f_0));
  return $Bool$pick$(($gt0$(_form_0)), ($List$append$(_base_0, {$: "Con", "head": {$: "Learn", "move": ($FormInfo$sig$(($form_body$(($Fighter$body$(_f_0)), _form_0)))), "lvl": 1}, "tail": {$: "Nil"}})), _base_0);
}

function $f_slot$(_f_0, _m_0) {
  return $move_slot$(($f_learns$(_f_0)), _m_0, 0);
}

function $f_cd$(_f_0, _slot_0) {
  return $at_u32$(($Fighter$cds$(_f_0)), _slot_0);
}

function $can_jutsu$(_f_0, _m_0) {
  const _known_0 = ($knows$(($f_learns$(_f_0)), ($Fighter$lvl$(_f_0)), _m_0));
  const _ready_0 = ($Bool$not$(($gt0$(($f_cd$(_f_0, ($f_slot$(_f_0, _m_0))))))));
  const _x_0 = ($MoveInfo$cost$(($actor_info$(_f_0, _m_0))));
  const _x_1 = ($Fighter$ck$(_f_0));
  return $Bool$and$(_known_0, ($Bool$and$(_ready_0, (_x_0 <= _x_1))));
}

function $pay$(_b_0, _a_0, _info_0, _slot_0, _cd_0) {
  const _f_0 = ($bf$(_b_0, _a_0));
  const _hpc_0 = ($pct$(($Fighter$mhp$(_f_0)), ($MoveInfo$hpcost$(_info_0))));
  const _hp_0 = ($u32_max$(($sub0$(($Fighter$hp$(_f_0)), _hpc_0)), 1));
  const _cds_0 = ($List$set$(($Fighter$cds$(_f_0)), _slot_0, ($sub0$(_cd_0, ($Bonus$cdr$(($fbon$(_f_0))))))));
  return $bset$(_b_0, _a_0, ($Fighter$with_cds$(($Fighter$with_hp$(($Fighter$with_ck$(_f_0, ($sub0$(($Fighter$ck$(_f_0)), ($MoveInfo$cost$(_info_0)))))), _hp_0)), _cds_0)));
}

function $perform$(_b_0, _ctx_0, _t_0, _info_0, _e_0) {
  const _seed_0 = ($Battle$seed$(_b_0));
  const _b1_0 = ($blog$(_b_0, _e_0));
  const _ts_0 = ($targets$(($MoveInfo$tgt$(_info_0)), _b1_0, ($Act$a$(_ctx_0)), _t_0, _seed_0));
  const _b2_0 = ($run_targets$(_ts_0, ($MoveInfo$effs$(_info_0)), _b1_0, _seed_0, _ctx_0, 1));
  return $Battle$with_seed$(_b2_0, ($mix$(((_seed_0 + 40503) >>> 0))));
}

function $chain_update$(_b_0, _t_0, _off_0, _party_0) {
  const _x_0 = ($Battle$ctgt$(_b_0));
  const _x_1 = ($Battle$chain$(_b_0));
  const _c_0 = ($Bool$pick$((_x_0 === _t_0), ($u32_min$(((_x_1 + 1) >>> 0), 6)), 1));
  return $Bool$pick$(_party_0, ($Bool$pick$(_off_0, ($Battle$with_ctgt$(($Battle$with_chain$(_b_0, _c_0)), _t_0)), _b_0)), ($Battle$with_chain$(_b_0, 0)));
}

function $chain_pct$(_b_0, _party_0, _off_0) {
  const _x_0 = ($sub0$(($Battle$chain$(_b_0)), 1));
  return $Bool$pick$(($Bool$and$(_party_0, _off_0)), ($u32_min$((Math.imul(8, _x_0) >>> 0), 40)), 0);
}

function $jutsu_mul$(_f_0, _slot_0) {
  const _x_0 = ($sub0$(($at_u32$(($Fighter$jlv$(_f_0)), _slot_0)), 1));
  const _x_1 = ($Bonus$jlv$(($fbon$(_f_0))));
  const _x_2 = ((_x_0 + _x_1) >>> 0);
  const _x_3 = (Math.imul(6, _x_2) >>> 0);
  return ((100 + _x_3) >>> 0);
}

function $use_move$(_b_0, _a_0, _t_0, _m_0) {
  const _f_0 = ($bf$(_b_0, _a_0));
  const _info_0 = ($actor_info$(_f_0, _m_0));
  const _slot_0 = ($f_slot$(_f_0, _m_0));
  const _off_0 = ($tgt_offensive$(($MoveInfo$tgt$(_info_0))));
  const _party_0 = ($f_party$(_f_0));
  const _b1_0 = ($chain_update$(_b_0, _t_0, _off_0, _party_0));
  const _ctx_0 = {$: "Act", "a": _a_0, "nat": ($move_nat$(_m_0)), "pmul": ($jutsu_mul$(_f_0, _slot_0)), "chain": ($chain_pct$(_b1_0, _party_0, _off_0))};
  return $perform$(($pay$(_b1_0, _a_0, _info_0, _slot_0, ($move_cd$(_m_0)))), _ctx_0, _t_0, _info_0, {$: "EvAct", "who": _a_0, "move": _m_0});
}

function $use_tool$(_b_0, _a_0, _t_0, _tool_0) {
  return $perform$(_b_0, {$: "Act", "a": _a_0, "nat": 0, "pmul": 100, "chain": 0}, _t_0, ($tool_info$(_tool_0)), {$: "EvTool", "who": _a_0, "tool": _tool_0});
}

function $act_start$(_b_0) {
  return $Battle$with_phase$(($clear_log$(_b_0)), {$: "Busy"});
}

function $body_moves$(_b_0) {
  if (_b_0.$ === "Ninja") {
    return {$: "Con", "head": {$: "Strike"}, "tail": {$: "Nil"}};
  } else {
    const _f_0 = _b_0["foe"];
    return $FoeInfo$moves$(($foe_info$(_f_0)));
  }
}

function $ai_move$(_b_0, _i_0, _seed_0) {
  const _f_0 = ($bf$(_b_0, _i_0));
  const _moves_0 = ($body_moves$(($Fighter$body$(_f_0))));
  const _basic_0 = ($Maybe$default$(($List$head$(_moves_0)), {$: "Strike"}));
  const _specials_0 = ($List$tail$(_moves_0));
  const _x_0 = ($roll$(_seed_0, 31, ($len$(_specials_0))));
  const _sp_0 = ($Maybe$default$(($List$get$(_specials_0, _x_0)), _basic_0));
  const _normal_0 = ($Bool$pick$(($chance$(_seed_0, 32, 45)), _sp_0, _basic_0));
  const _x_1 = ($body_tails$(($Fighter$body$(_f_0))));
  const _gather_0 = ($Bool$and$((_x_1 >= 3), ($chance$(_seed_0, 33, 16))));
  return $Bool$pick$(($gt0$(($sget$({$: "SCharge"}, _f_0)))), {$: "TailedBeastBomb"}, ($Bool$pick$(_gather_0, {$: "GatherChakra"}, _normal_0)));
}

function $weakest$go$($0, $1, $2, $3) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _b_0 = $1;
      const _best_0 = $2;
      const _hp_0 = $3;
      if (_xs_0.$ === "Nil") {
        return _best_0;
      } else {
        const _i_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        const _h_0 = ($Fighter$hp$(($bf$(_b_0, _i_0))));
        const _lower_0 = (_h_0 < _hp_0);
        $0 = _t_0;
        $1 = _b_0;
        $2 = ($Bool$pick$(_lower_0, _i_0, _best_0));
        $3 = ($Bool$pick$(_lower_0, _h_0, _hp_0));
        continue;
      }
    }
  }
}

function $ai_target$(_tgt_0, _b_0, _i_0, _seed_0) {
  if (_tgt_0.$ === "OneFoe") {
    return $pick_alive$(_b_0, 0, _seed_0, 41);
  } else if (_tgt_0.$ === "OneAlly") {
    return $weakest$go$(($side_alive$(_b_0, 1)), _b_0, _i_0, 4294967295);
  } else {
    return _i_0;
  }
}

function $copy_ninja$go$($0, $1, $2) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _b_0 = $1;
      const _on_0 = $2;
      if (_xs_0.$ === "Nil") {
        return _b_0;
      } else {
        const _i_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        $0 = _t_0;
        $1 = ($gain_ck_log$(_b_0, _i_0, 12, ($Bool$and$(_on_0, ($body_is$(($Fighter$body$(($bf$(_b_0, _i_0)))), {$: "Kakashi"}))))));
        $2 = _on_0;
        continue;
      }
    }
  }
}

function $enemy_turn$(_b_0, _i_0) {
  const _seed_0 = ($Battle$seed$(_b_0));
  const _m_0 = ($ai_move$(_b_0, _i_0, _seed_0));
  const _t_0 = ($ai_target$(($MoveInfo$tgt$(($move_info$(_m_0)))), _b_0, _i_0, _seed_0));
  const _f_0 = ($bf$(_b_0, _i_0));
  const _x_0 = ($move_id$(_m_0));
  const _fired_0 = (_x_0 === 10);
  const _b1_0 = ($bset$(_b_0, _i_0, ($sset$({$: "SCharge"}, _f_0, ($Bool$pick$(_fired_0, 0, ($sget$({$: "SCharge"}, _f_0))))))));
  return $copy_ninja$go$(($side_alive$(_b1_0, 0)), ($use_move$(_b1_0, _i_0, _t_0, _m_0)), ($Bool$not$(($move_basic$(_m_0)))));
}

function $phase_over$(_p_0) {
  if (_p_0.$ === "Won") {
    return true;
  } else if (_p_0.$ === "Lost") {
    return true;
  } else if (_p_0.$ === "Fled") {
    return true;
  } else {
    return false;
  }
}

function $check_end$go$(_b_0, _over_0, _foes_0, _party_0) {
  if (_over_0) {
    return _b_0;
  } else {
    if (!_foes_0) {
      return $Battle$with_phase$(_b_0, {$: "Won"});
    } else {
      if (!_party_0) {
        return $Battle$with_phase$(_b_0, {$: "Lost"});
      } else {
        return _b_0;
      }
    }
  }
}

function $check_end$(_b_0) {
  return $check_end$go$(_b_0, ($phase_over$(($Battle$phase$(_b_0)))), ($any_alive$(_b_0, 1)), ($any_alive$(_b_0, 0)));
}

function $dot$go$(_b_0, _i_0, _dmg_0, _on_0, _text_0) {
  if (!_on_0) {
    return _b_0;
  } else {
    return $hurt$(($blog$(_b_0, {$: "EvSay", "text": _text_0})), _i_0, _dmg_0, false);
  }
}

function $burn_tick$(_b_0, _i_0) {
  const _f_0 = ($bf$(_b_0, _i_0));
  const _on_0 = ($Bool$and$(($gt0$(($sget$({$: "SBurn"}, _f_0)))), ($f_alive$(_f_0))));
  const _b1_0 = ($bset$(_b_0, _i_0, ($sset$({$: "SBurn"}, _f_0, ($sub0$(($sget$({$: "SBurn"}, _f_0)), 1))))));
  const _x_0 = ($f_name$(_f_0));
  return $dot$go$(_b1_0, _i_0, ($u32_max$(($Status$burnd$(($Fighter$st$(_f_0)))), 1)), _on_0, (_x_0 + " is burning!"));
}

function $poison_tick$(_b_0, _i_0) {
  const _f_0 = ($bf$(_b_0, _i_0));
  const _on_0 = ($Bool$and$(($gt0$(($sget$({$: "SPoison"}, _f_0)))), ($f_alive$(_f_0))));
  const _b1_0 = ($bset$(_b_0, _i_0, ($sset$({$: "SPoison"}, _f_0, ($sub0$(($sget$({$: "SPoison"}, _f_0)), 1))))));
  const _x_0 = ($f_name$(_f_0));
  return $dot$go$(_b1_0, _i_0, ($u32_max$(($Status$poisd$(($Fighter$st$(_f_0)))), 1)), _on_0, (_x_0 + " is poisoned!"));
}

function $dec_all$(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _x_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Con", "head": ($sub0$(_x_0, 1)), "tail": ($dec_all$(_t_0))};
  }
}

function $form_tick$go$(_b_0, _i_0, _f_0, _drain_0, _on_0, _keep_0) {
  if (!_on_0) {
    return _b_0;
  } else {
    if (_keep_0) {
      const _x_0 = ($Fighter$ck$(_f_0));
      return $bset$(_b_0, _i_0, ($Fighter$with_ck$(_f_0, ((_x_0 - _drain_0) >>> 0))));
    } else {
      return $blog$(($bset$(_b_0, _i_0, ($Fighter$with_form$(_f_0, 0)))), {$: "EvForm", "who": _i_0, "tier": 0});
    }
  }
}

function $form_tick$(_b_0, _i_0) {
  const _f_0 = ($bf$(_b_0, _i_0));
  const _drain_0 = ($FormInfo$drain$(($form_body$(($Fighter$body$(_f_0)), ($Fighter$form$(_f_0))))));
  const _x_0 = ($Fighter$ck$(_f_0));
  return $form_tick$go$(_b_0, _i_0, _f_0, _drain_0, ($gt0$(($Fighter$form$(_f_0)))), (_x_0 >= _drain_0));
}

function $turn_start$(_b_0, _i_0) {
  const _f_0 = ($bf$(_b_0, _i_0));
  const _s_0 = ($Fighter$st$(_f_0));
  const _s1_0 = ($Status$with_evade$(($Status$with_defdown$(($Status$with_defup$(($Status$with_atkup$(($Status$with_guard$(_s_0, 0)), ($sub0$(($Status$atkup$(_s_0)), 1)))), ($sub0$(($Status$defup$(_s_0)), 1)))), ($sub0$(($Status$defdown$(_s_0)), 1)))), ($sub0$(($Status$evade$(_s_0)), 1))));
  const _x_0 = ($Fighter$ck$(_f_0));
  const _x_1 = ($Bonus$regen$(($fbon$(_f_0))));
  const _ck_0 = ($u32_min$(($Fighter$mck$(_f_0)), ((_x_0 + _x_1) >>> 0)));
  const _x_2 = ($Fighter$hp$(_f_0));
  const _x_3 = ($Bool$pick$(($f_alive$(_f_0)), ($pct$(($Fighter$mhp$(_f_0)), ($Bonus$hpr$(($fbon$(_f_0)))))), 0));
  const _hp_0 = ($u32_min$(($Fighter$mhp$(_f_0)), ((_x_2 + _x_3) >>> 0)));
  const _f1_0 = ($Fighter$with_hp$(($Fighter$with_cds$(($Fighter$with_ck$(($Fighter$with_st$(_f_0, _s1_0)), _ck_0)), ($dec_all$(($Fighter$cds$(_f_0)))))), _hp_0));
  return $poison_tick$(($burn_tick$(($form_tick$(($bset$(_b_0, _i_0, _f1_0)), _i_0)), _i_0)), _i_0);
}

function $step$turn$(_b_0, _i_0, _over_0, _alive_0, _stunned_0, _party_0) {
  if (_over_0) {
    return {$: "Tuple", "fst": _b_0, "snd": true};
  } else {
    if (!_alive_0) {
      return {$: "Tuple", "fst": _b_0, "snd": true};
    } else {
      if (_stunned_0) {
        const _f_0 = ($bf$(_b_0, _i_0));
        const _x_0 = ($f_name$(_f_0));
        return {$: "Tuple", "fst": ($blog$(($bset$(_b_0, _i_0, ($sset$({$: "SStun"}, _f_0, ($sub0$(($sget$({$: "SStun"}, _f_0)), 1)))))), {$: "EvSay", "text": (_x_0 + " can't move!")})), "snd": false};
      } else {
        if (_party_0) {
          return {$: "Tuple", "fst": ($Battle$with_phase$(_b_0, {$: "Ask", "who": _i_0})), "snd": false};
        } else {
          return {$: "Tuple", "fst": ($check_end$(($enemy_turn$(_b_0, _i_0)))), "snd": false};
        }
      }
    }
  }
}

function $step$pop$(_b_0, _i_0) {
  const _b1_0 = ($check_end$(($turn_start$(_b_0, _i_0))));
  const _f1_0 = ($bf$(_b1_0, _i_0));
  return $step$turn$(_b1_0, _i_0, ($phase_over$(($Battle$phase$(_b1_0)))), ($f_alive$(_f1_0)), ($gt0$(($sget$({$: "SStun"}, _f1_0)))), ($f_party$(_f1_0)));
}

function $next_actor$go$($0, $1, $2, $3) {
  for (;;) {
    {
      const _fs_0 = $0;
      const _i_0 = $1;
      const _best_0 = $2;
      const _bt_0 = $3;
      if (_fs_0.$ === "Nil") {
        return _best_0;
      } else {
        const _f_0 = _fs_0["head"];
        const _t_0 = _fs_0["tail"];
        const _x_0 = ($Fighter$tmr$(_f_0));
        const _ok_0 = ($Bool$and$(($f_alive$(_f_0)), (_x_0 < _bt_0)));
        $0 = _t_0;
        $1 = ((_i_0 + 1) >>> 0);
        $2 = ($Bool$pick$(_ok_0, _i_0, _best_0));
        $3 = ($Bool$pick$(_ok_0, ($Fighter$tmr$(_f_0)), _bt_0));
        continue;
      }
    }
  }
}

function $next_actor$(_b_0) {
  return $next_actor$go$(($Battle$fs$(_b_0)), 0, 0, 4294967295);
}

function $summon_move$(_code_0) {
  const _x_0 = ($sub0$(_code_0, 1));
  const _x_1 = (4 === 0 ? 0 : (_x_0 / 4) >>> 0);
  return $Maybe$default$(($List$get$({$: "Con", "head": {$: "ToadOil"}, "tail": {$: "Con", "head": {$: "SlugHeal"}, "tail": {$: "Con", "head": {$: "SnakeBite"}, "tail": {$: "Con", "head": {$: "HoundPin"}, "tail": {$: "Con", "head": {$: "HawkGale"}, "tail": {$: "Con", "head": {$: "MonkeyStaff"}, "tail": {$: "Con", "head": {$: "WeaselScythe"}, "tail": {$: "Nil"}}}}}}}}, _x_1)), {$: "HawkGale"});
}

function $summon_act$(_b_0) {
  const _code_0 = ($Battle$smn$(_b_0));
  const _a_0 = ($at_u32$(($side_alive$(_b_0, 0)), 0));
  const _m_0 = ($summon_move$(_code_0));
  const _info_0 = ($move_info$(_m_0));
  const _t_0 = ($Bool$pick$(($tgt_offensive$(($MoveInfo$tgt$(_info_0)))), ($pick_alive$(_b_0, 1, ($Battle$seed$(_b_0)), 91)), _a_0));
  const _ctx_0 = {$: "Act", "a": _a_0, "nat": ($move_nat$(_m_0)), "pmul": ($Battle$spow$(_b_0)), "chain": 0};
  return $perform$(($blog$(_b_0, {$: "EvSummon", "text": ($summon_name$(_code_0))})), _ctx_0, _t_0, _info_0, {$: "EvAct", "who": _a_0, "move": _m_0});
}

function $step$summon$(_b_0, _fire_0) {
  if (_fire_0) {
    return $check_end$(($summon_act$(_b_0)));
  } else {
    return _b_0;
  }
}

function $step$go$(_b_0, _over_0) {
  if (_over_0) {
    return {$: "Tuple", "fst": _b_0, "snd": false};
  } else {
    const _i_0 = ($next_actor$(_b_0));
    const _f_0 = ($bf$(_b_0, _i_0));
    const _clock_0 = ($Fighter$tmr$(_f_0));
    const _x_0 = ($delay$(_f_0));
    const _b1_0 = ($bset$(_b_0, _i_0, ($Fighter$with_tmr$(_f_0, ((_clock_0 + _x_0) >>> 0)))));
    const _x_1 = (1000 === 0 ? 0 : (_clock_0 / 1000) >>> 0);
    const _nr_0 = ((_x_1 + 1) >>> 0);
    const _b2_0 = ($Battle$with_round$(($Battle$with_clock$(_b1_0, _clock_0)), _nr_0));
    const _x_2 = ($Battle$round$(_b_0));
    const _x_3 = (4 === 0 ? _nr_0 : _nr_0 % 4);
    const _fire_0 = ($Bool$and$(($gt0$(($Battle$smn$(_b_0)))), ($Bool$and$((_nr_0 > _x_2), (_x_3 === 0)))));
    return $step$pop$(($step$summon$(_b2_0, _fire_0)), _i_0);
  }
}

function $step$(_b_0) {
  const _b1_0 = ($check_end$(_b_0));
  const _over_0 = ($phase_over$(($Battle$phase$(_b1_0))));
  return $step$go$(($Bool$pick$(_over_0, _b1_0, ($Battle$with_phase$(_b1_0, {$: "Busy"})))), _over_0);
}

function $advance$($0, $1) {
  for (;;) {
    {
      const _fuel_0 = $0;
      const _sb_0 = $1;
      if (_fuel_0 === 0) {
        const _b_0 = _sb_0["fst"];
        return _b_0;
      } else {
        const _p_0 = (_fuel_0 - 1);
        const _b_1 = _sb_0["fst"];
        const _t_0 = _sb_0["snd"];
        if (!_t_0) {
          return _b_1;
        } else {
          $0 = _p_0;
          $1 = ($step$(_b_1));
          continue;
        }
      }
    }
  }
}

function $open$one$(_b_0, _i_0, _shika_0) {
  const _f_0 = ($bf$(_b_0, _i_0));
  const _arts_0 = ($Battle$arts$(_b_0));
  const _x_0 = ($body_is$(($Fighter$body$(_f_0)), {$: "Naruto"}));
  const _x_1 = ($has_art$(_arts_0, {$: "FirstNecklace"}));
  const _guts_0 = ($Bool$pick$((_x_0 || _x_1), 1, 0));
  const _x_2 = ($Fighter$ck$(_f_0));
  const _x_3 = ($Bool$pick$(($has_art$(_arts_0, {$: "ToadContract"})), 30, 0));
  const _ck_0 = ($u32_min$(($Fighter$mck$(_f_0)), ((_x_2 + _x_3) >>> 0)));
  return $bset$(_b_0, _i_0, ($sset$({$: "SAtkUp"}, ($f_with_guts$(($Fighter$with_ck$(_f_0, _ck_0)), _guts_0)), ($Bool$pick$(_shika_0, 3, 0)))));
}

function $open$go$($0, $1, $2) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _b_0 = $1;
      const _shika_0 = $2;
      if (_xs_0.$ === "Nil") {
        return _b_0;
      } else {
        const _i_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        $0 = _t_0;
        $1 = ($open$one$(_b_0, _i_0, _shika_0));
        $2 = _shika_0;
        continue;
      }
    }
  }
}

function $has_body$go$(_xs_0, _b_0, _w_0) {
  if (_xs_0.$ === "Nil") {
    return false;
  } else {
    const _i_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    const _x_0 = ($body_is$(($Fighter$body$(($bf$(_b_0, _i_0)))), _w_0));
    const _x_1 = ($has_body$go$(_t_0, _b_0, _w_0));
    return (_x_0 || _x_1);
  }
}

function $open$say$(_b_0, _shika_0) {
  if (_shika_0) {
    return $blog$(_b_0, {$: "EvSay", "text": "Shikamaru has a plan. Squad ATK up!"});
  } else {
    return _b_0;
  }
}

function $init_timers$(_fs_0) {
  if (_fs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fs_0["head"];
    const _t_0 = _fs_0["tail"];
    return {$: "Con", "head": ($Fighter$with_tmr$(_f_0, ($delay$(_f_0)))), "tail": ($init_timers$(_t_0))};
  }
}

function $battle_open$(_b_0) {
  const _b0_0 = ($Battle$with_fs$(_b_0, ($init_timers$(($Battle$fs$(_b_0))))));
  const _shika_0 = ($has_body$go$(($side_alive$(_b0_0, 0)), _b0_0, {$: "Shikamaru"}));
  return $open$say$(($open$go$(($side_alive$(_b0_0, 0)), _b0_0, _shika_0)), _shika_0);
}

function $new_battle$(_fs_0, _boss_0, _rank_0, _arts_0, _sealed_0, _seed_0, _smn_0, _spow_0) {
  const _b0_0 = {$: "Battle", "fs": _fs_0, "clock": 0, "round": 0, "phase": {$: "Busy"}, "boss": _boss_0, "rank": _rank_0, "arts": _arts_0, "sealed": _sealed_0, "log": {$: "Nil"}, "seed": _seed_0, "chain": 0, "ctgt": 99, "smn": _smn_0, "spow": _spow_0};
  return $advance$(24, {$: "Tuple", "fst": ($battle_open$(_b0_0)), "snd": true});
}

function $transform$(_b_0, _who_0) {
  const _f_0 = ($bf$(_b_0, _who_0));
  const _t_0 = ($Fighter$ftier$(_f_0));
  const _x_0 = ($Fighter$form$(_f_0));
  return $Bool$pick$((_t_0 > _x_0), ($blog$(($bset$(_b_0, _who_0, ($Fighter$with_form$(_f_0, _t_0)))), {$: "EvForm", "who": _who_0, "tier": _t_0})), _b_0);
}

function $act_cmd$(_c_0, _b_0, _who_0) {
  if (_c_0.$ === "CAttack") {
    const _t_0 = _c_0["target"];
    return $check_end$(($use_move$(($act_start$(_b_0)), _who_0, _t_0, {$: "Strike"})));
  } else if (_c_0.$ === "CJutsu") {
    const _m_0 = _c_0["move"];
    const _t_1 = _c_0["target"];
    return $check_end$(($use_move$(($act_start$(_b_0)), _who_0, _t_1, ($Bool$pick$(($can_jutsu$(($bf$(_b_0, _who_0)), _m_0)), _m_0, {$: "Strike"})))));
  } else if (_c_0.$ === "CTool") {
    return _b_0;
  } else if (_c_0.$ === "CGuard") {
    return $check_end$(($use_move$(($act_start$(_b_0)), _who_0, _who_0, {$: "Defend"})));
  } else {
    return $check_end$(($transform$(($act_start$(_b_0)), _who_0)));
  }
}

function $battle_input$go$(_p_0, _b_0, _c_0) {
  if (_p_0.$ === "Ask") {
    const _who_0 = _p_0["who"];
    return $act_cmd$(_c_0, _b_0, _who_0);
  } else {
    return _b_0;
  }
}

function $battle_input$(_b_0, _c_0) {
  return $battle_input$go$(($Battle$phase$(_b_0)), _b_0, _c_0);
}

function $battle_next$go$(_p_0, _b_0) {
  if (_p_0.$ === "Busy") {
    return $advance$(24, {$: "Tuple", "fst": ($clear_log$(_b_0)), "snd": true});
  } else {
    return _b_0;
  }
}

function $battle_next$(_b_0) {
  return $battle_next$go$(($Battle$phase$(_b_0)), _b_0);
}

function $new_member$(_w_0, _lvl_0, _bon_0) {
  const _s_0 = ($member_stats$({$: "Member", "who": _w_0, "lvl": _lvl_0, "xp": 0, "hp": 0, "ck": 0, "sp": 0, "jlv": {$: "Nil"}, "weapon": 1, "ftier": 0, "tech": {$: "Nil"}}, _bon_0));
  return {$: "Member", "who": _w_0, "lvl": _lvl_0, "xp": 0, "hp": ($Stats$hp$(_s_0)), "ck": ($Stats$ck$(_s_0)), "sp": 0, "jlv": {$: "Con", "head": 1, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 1, "tail": {$: "Nil"}}}}}, "weapon": 1, "ftier": 0, "tech": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}}};
}

function $sealed_count$(_run_0) {
  return $len$(($Run$sealed$(_run_0)));
}

function $max_level$(_ms_0) {
  if (_ms_0.$ === "Nil") {
    return 1;
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    return $u32_max$(($Member$lvl$(_m_0)), ($max_level$(_t_0)));
  }
}

function $sum_level$(_ms_0) {
  if (_ms_0.$ === "Nil") {
    return 0;
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    const _x_0 = ($Member$lvl$(_m_0));
    const _x_1 = ($sum_level$(_t_0));
    return ((_x_0 + _x_1) >>> 0);
  }
}

function $avg_level$(_ms_0) {
  const _x_0 = ($sum_level$(_ms_0));
  const _x_1 = ($u32_max$(($len$(_ms_0)), 1));
  return (_x_1 === 0 ? 0 : (_x_0 / _x_1) >>> 0);
}

function $in_party$(_ms_0, _w_0) {
  if (_ms_0.$ === "Nil") {
    return false;
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    const _x_0 = ($who_is$(($Member$who$(_m_0)), _w_0));
    const _x_1 = ($in_party$(_t_0, _w_0));
    return (_x_0 || _x_1);
  }
}

function $member_max$(_run_0, _i_0) {
  const _m_0 = ($Maybe$default$(($List$get$(($Run$party$(_run_0)), _i_0)), {$: "Member", "who": {$: "Naruto"}, "lvl": 1, "xp": 0, "hp": 0, "ck": 0, "sp": 0, "jlv": {$: "Nil"}, "weapon": 0, "ftier": 0, "tech": {$: "Nil"}}));
  return $member_stats$(_m_0, ($run_bonus$(_run_0)));
}

function $heal_members$(_ms_0, _p_0, _bon_0) {
  if (_ms_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    const _s_0 = ($member_stats$(_m_0, _bon_0));
    const _x_0 = ($Member$hp$(_m_0));
    const _x_1 = ($pct$(($Stats$hp$(_s_0)), _p_0));
    const _hp_0 = ($u32_min$(($Stats$hp$(_s_0)), ((_x_0 + _x_1) >>> 0)));
    const _x_2 = ($Member$ck$(_m_0));
    const _x_3 = ($pct$(($Stats$ck$(_s_0)), _p_0));
    const _ck_0 = ($u32_min$(($Stats$ck$(_s_0)), ((_x_2 + _x_3) >>> 0)));
    return {$: "Con", "head": ($Member$with_ck$(($Member$with_hp$(_m_0, _hp_0)), _ck_0)), "tail": ($heal_members$(_t_0, _p_0, _bon_0))};
  }
}

function $heal_party$(_run_0, _p_0) {
  return $Run$with_party$(_run_0, ($heal_members$(($Run$party$(_run_0)), _p_0, ($run_bonus$(_run_0)))));
}

function $xp_need$(_lvl_0) {
  const _x_0 = (Math.imul(_lvl_0, 20) >>> 0);
  return ((_x_0 + 10) >>> 0);
}

function $lvl_loop$(_fuel_0, _lvl_0, _xp_0) {
  if (_fuel_0 === 0) {
    return {$: "Lx", "lvl": _lvl_0, "xp": _xp_0};
  } else {
    const _p_0 = (_fuel_0 - 1);
    const _need_0 = ($xp_need$(_lvl_0));
    return $Bool$pick$(($Bool$and$((_xp_0 >= _need_0), (_lvl_0 < 30))), ($lvl_loop$(_p_0, ((_lvl_0 + 1) >>> 0), ((_xp_0 - _need_0) >>> 0))), {$: "Lx", "lvl": _lvl_0, "xp": _xp_0});
  }
}

function $gain_xp$(_m_0, _amt_0, _bon_0) {
  const _x_0 = ($Member$xp$(_m_0));
  const _r_0 = ($lvl_loop$(10, ($Member$lvl$(_m_0)), ((_x_0 + _amt_0) >>> 0)));
  const _x_1 = ($sub0$(($Lx$lvl$(_r_0)), ($Member$lvl$(_m_0))));
  const _x_2 = ($Member$sp$(_m_0));
  const _x_3 = (Math.imul(3, _x_1) >>> 0);
  const _sp_0 = ((_x_2 + _x_3) >>> 0);
  const _m2_0 = ($Member$with_sp$(($Member$with_xp$(($Member$with_lvl$(_m_0, ($Lx$lvl$(_r_0)))), ($Lx$xp$(_r_0)))), _sp_0));
  const _old_0 = ($member_stats$(_m_0, _bon_0));
  const _new_0 = ($member_stats$(_m2_0, _bon_0));
  const _x_4 = ($Member$hp$(_m_0));
  const _x_5 = ($sub0$(($Stats$hp$(_new_0)), ($Stats$hp$(_old_0))));
  const _hp_0 = ((_x_4 + _x_5) >>> 0);
  const _x_6 = ($Member$ck$(_m_0));
  const _x_7 = ($sub0$(($Stats$ck$(_new_0)), ($Stats$ck$(_old_0))));
  const _ck_0 = ((_x_6 + _x_7) >>> 0);
  return $Member$with_ck$(($Member$with_hp$(_m2_0, _hp_0)), _ck_0);
}

function $gain_all$(_ms_0, _amt_0, _bon_0) {
  if (_ms_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    return {$: "Con", "head": ($gain_xp$(_m_0, _amt_0, _bon_0)), "tail": ($gain_all$(_t_0, _amt_0, _bon_0))};
  }
}

function $write_back$(_ms_0, _fs_0, _ramen_0) {
  if (_ms_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _m_0 = _ms_0["head"];
    const _mt_0 = _ms_0["tail"];
    if (_fs_0.$ === "Nil") {
      return {$: "Con", "head": _m_0, "tail": _mt_0};
    } else {
      const _f_0 = _fs_0["head"];
      const _ft_0 = _fs_0["tail"];
      const _mhp_0 = ($Fighter$mhp$(_f_0));
      const _hp0_0 = ($Bool$pick$(($f_alive$(_f_0)), ($Fighter$hp$(_f_0)), ($pct$(_mhp_0, 20))));
      const _x_0 = ($pct$(_mhp_0, 20));
      const _hp1_0 = ($Bool$pick$(_ramen_0, ($u32_min$(_mhp_0, ((_hp0_0 + _x_0) >>> 0))), _hp0_0));
      return {$: "Con", "head": ($Member$with_ck$(($Member$with_hp$(_m_0, _hp1_0)), ($Fighter$ck$(_f_0)))), "tail": ($write_back$(_mt_0, _ft_0, _ramen_0))};
    }
  }
}

function $body_xp$(_b_0, _lvl_0) {
  if (_b_0.$ === "Ninja") {
    return 0;
  } else {
    const _foe_0 = _b_0["foe"];
    const _x_0 = ($FoeInfo$xp$(($foe_info$(_foe_0))));
    const _x_1 = (Math.imul(2, _lvl_0) >>> 0);
    return ((_x_0 + _x_1) >>> 0);
  }
}

function $body_ryo$(_b_0, _lvl_0) {
  if (_b_0.$ === "Ninja") {
    return 0;
  } else {
    const _foe_0 = _b_0["foe"];
    const _x_0 = ($FoeInfo$ryo$(($foe_info$(_foe_0))));
    const _x_1 = (Math.imul(3, _lvl_0) >>> 0);
    return ((_x_0 + _x_1) >>> 0);
  }
}

function $sum_xp$(_fs_0) {
  if (_fs_0.$ === "Nil") {
    return 0;
  } else {
    const _f_0 = _fs_0["head"];
    const _t_0 = _fs_0["tail"];
    const _x_0 = ($body_xp$(($Fighter$body$(_f_0)), ($Fighter$lvl$(_f_0))));
    const _x_1 = ($sum_xp$(_t_0));
    return ((_x_0 + _x_1) >>> 0);
  }
}

function $sum_ryo$(_fs_0) {
  if (_fs_0.$ === "Nil") {
    return 0;
  } else {
    const _f_0 = _fs_0["head"];
    const _t_0 = _fs_0["tail"];
    const _x_0 = ($body_ryo$(($Fighter$body$(_f_0)), ($Fighter$lvl$(_f_0))));
    const _x_1 = ($sum_ryo$(_t_0));
    return ((_x_0 + _x_1) >>> 0);
  }
}

function $has_tool$(_ts_0, _t_0) {
  if (_ts_0.$ === "Nil") {
    return false;
  } else {
    const _h_0 = _ts_0["head"];
    const _r_0 = _ts_0["tail"];
    const _x_0 = ($tool_is$(_h_0, _t_0));
    const _x_1 = ($has_tool$(_r_0, _t_0));
    return (_x_0 || _x_1);
  }
}

function $remove_tool$(_ts_0, _t_0) {
  if (_ts_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _ts_0["head"];
    const _r_0 = _ts_0["tail"];
    return $Bool$pick$(($tool_is$(_h_0, _t_0)), _r_0, {$: "Con", "head": _h_0, "tail": ($remove_tool$(_r_0, _t_0))});
  }
}

function $act_boss$(_act_0) {
  const _x_0 = ((_act_0 + 1) >>> 0);
  return (Math.imul(_x_0, 3) >>> 0);
}

function $act_name$(_act_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "The Land of Waves", "tail": {$: "Con", "head": "The Land of Rain", "tail": {$: "Con", "head": "The Valley of the End", "tail": {$: "Nil"}}}}, _act_0)), "?");
}

function $floor_of$(_pos_0) {
  return $Bool$pick$((_pos_0 === 999), 0, (7 === 0 ? 0 : (_pos_0 / 7) >>> 0));
}

function $threat$(_run_0) {
  const _x_0 = ($Run$act$(_run_0));
  const _x_1 = ($floor_of$(($Run$pos$(_run_0))));
  const _x_2 = (Math.imul(4, _x_0) >>> 0);
  const _x_3 = (2 === 0 ? 0 : (_x_1 / 2) >>> 0);
  return ((_x_2 + _x_3) >>> 0);
}

function $rank_name$(_r_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "D", "tail": {$: "Con", "head": "C", "tail": {$: "Con", "head": "B", "tail": {$: "Con", "head": "A", "tail": {$: "Con", "head": "S", "tail": {$: "Nil"}}}}}}, _r_0)), "?");
}

function $minion_table$() {
  return {$: "Con", "head": {$: "Con", "head": {$: "Zori"}, "tail": {$: "Con", "head": {$: "Waraji"}, "tail": {$: "Con", "head": {$: "Oboro"}, "tail": {$: "Con", "head": {$: "Mubi"}, "tail": {$: "Con", "head": {$: "Kagari"}, "tail": {$: "Con", "head": {$: "Mizuki"}, "tail": {$: "Con", "head": {$: "Kamikiri"}, "tail": {$: "Con", "head": {$: "Hanzaki"}, "tail": {$: "Con", "head": {$: "Jigumo"}, "tail": {$: "Con", "head": {$: "Kagero"}, "tail": {$: "Con", "head": {$: "Arashi"}, "tail": {$: "Con", "head": {$: "GatoRonin"}, "tail": {$: "Con", "head": {$: "HunterNin"}, "tail": {$: "Con", "head": {$: "KiriChunin"}, "tail": {$: "Con", "head": {$: "TakiNinja"}, "tail": {$: "Nil"}}}}}}}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Dosu"}, "tail": {$: "Con", "head": {$: "Zaku"}, "tail": {$: "Con", "head": {$: "Kin"}, "tail": {$: "Con", "head": {$: "Yoroi"}, "tail": {$: "Con", "head": {$: "Misumi"}, "tail": {$: "Con", "head": {$: "Shigure"}, "tail": {$: "Con", "head": {$: "RainNinja"}, "tail": {$: "Con", "head": {$: "Kankuro"}, "tail": {$: "Con", "head": {$: "Temari"}, "tail": {$: "Con", "head": {$: "Baki"}, "tail": {$: "Con", "head": {$: "SoundGenin"}, "tail": {$: "Con", "head": {$: "GrassNinja"}, "tail": {$: "Con", "head": {$: "SoundChunin"}, "tail": {$: "Con", "head": {$: "RainChunin"}, "tail": {$: "Nil"}}}}}}}}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "RootAnbu"}, "tail": {$: "Con", "head": {$: "WhiteZetsu"}, "tail": {$: "Con", "head": {$: "Fu"}, "tail": {$: "Con", "head": {$: "Torune"}, "tail": {$: "Con", "head": {$: "Guren"}, "tail": {$: "Con", "head": {$: "Kigiri"}, "tail": {$: "Con", "head": {$: "Nurari"}, "tail": {$: "Con", "head": {$: "Kiseru"}, "tail": {$: "Con", "head": {$: "Rinji"}, "tail": {$: "Con", "head": {$: "Ameyuri"}, "tail": {$: "Con", "head": {$: "Jinpachi"}, "tail": {$: "Con", "head": {$: "Kushimaru"}, "tail": {$: "Con", "head": {$: "Fuguki"}, "tail": {$: "Con", "head": {$: "Mangetsu"}, "tail": {$: "Nil"}}}}}}}}}}}}}}}, "tail": {$: "Nil"}}}};
}

function $minion_pool$(_act_0) {
  return $Maybe$default$(($List$get$(($minion_table$()), _act_0)), {$: "Con", "head": {$: "Zori"}, "tail": {$: "Nil"}});
}

function $elite_table$() {
  return {$: "Con", "head": {$: "Con", "head": {$: "Con", "head": {$: "Zabuza"}, "tail": {$: "Nil"}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Haku"}, "tail": {$: "Nil"}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Gozu"}, "tail": {$: "Con", "head": {$: "Meizu"}, "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Raiga"}, "tail": {$: "Nil"}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Aoi"}, "tail": {$: "Nil"}}, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Con", "head": {$: "Kabuto"}, "tail": {$: "Nil"}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Orochimaru"}, "tail": {$: "Nil"}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Jirobo"}, "tail": {$: "Con", "head": {$: "Kidomaru"}, "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Tayuya"}, "tail": {$: "Con", "head": {$: "Sakon"}, "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Kimimaro"}, "tail": {$: "Nil"}}, "tail": {$: "Nil"}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Con", "head": {$: "Kisame"}, "tail": {$: "Nil"}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Deidara"}, "tail": {$: "Nil"}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Itachi"}, "tail": {$: "Nil"}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Hidan"}, "tail": {$: "Con", "head": {$: "Kakuzu"}, "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": {$: "Sasori"}, "tail": {$: "Nil"}}, "tail": {$: "Nil"}}}}}}, "tail": {$: "Nil"}}}};
}

function $all_foes$() {
  return {$: "Con", "head": {$: "Zori"}, "tail": {$: "Con", "head": {$: "Waraji"}, "tail": {$: "Con", "head": {$: "Oboro"}, "tail": {$: "Con", "head": {$: "Mubi"}, "tail": {$: "Con", "head": {$: "Kagari"}, "tail": {$: "Con", "head": {$: "Mizuki"}, "tail": {$: "Con", "head": {$: "Kamikiri"}, "tail": {$: "Con", "head": {$: "Hanzaki"}, "tail": {$: "Con", "head": {$: "Jigumo"}, "tail": {$: "Con", "head": {$: "Kagero"}, "tail": {$: "Con", "head": {$: "Arashi"}, "tail": {$: "Con", "head": {$: "GatoRonin"}, "tail": {$: "Con", "head": {$: "HunterNin"}, "tail": {$: "Con", "head": {$: "KiriChunin"}, "tail": {$: "Con", "head": {$: "TakiNinja"}, "tail": {$: "Con", "head": {$: "Zabuza"}, "tail": {$: "Con", "head": {$: "Haku"}, "tail": {$: "Con", "head": {$: "Gozu"}, "tail": {$: "Con", "head": {$: "Meizu"}, "tail": {$: "Con", "head": {$: "Raiga"}, "tail": {$: "Con", "head": {$: "Aoi"}, "tail": {$: "Con", "head": {$: "Dosu"}, "tail": {$: "Con", "head": {$: "Zaku"}, "tail": {$: "Con", "head": {$: "Kin"}, "tail": {$: "Con", "head": {$: "Yoroi"}, "tail": {$: "Con", "head": {$: "Misumi"}, "tail": {$: "Con", "head": {$: "Shigure"}, "tail": {$: "Con", "head": {$: "RainNinja"}, "tail": {$: "Con", "head": {$: "Kankuro"}, "tail": {$: "Con", "head": {$: "Temari"}, "tail": {$: "Con", "head": {$: "Baki"}, "tail": {$: "Con", "head": {$: "SoundGenin"}, "tail": {$: "Con", "head": {$: "GrassNinja"}, "tail": {$: "Con", "head": {$: "SoundChunin"}, "tail": {$: "Con", "head": {$: "RainChunin"}, "tail": {$: "Con", "head": {$: "Kabuto"}, "tail": {$: "Con", "head": {$: "Orochimaru"}, "tail": {$: "Con", "head": {$: "Jirobo"}, "tail": {$: "Con", "head": {$: "Kidomaru"}, "tail": {$: "Con", "head": {$: "Tayuya"}, "tail": {$: "Con", "head": {$: "Sakon"}, "tail": {$: "Con", "head": {$: "Kimimaro"}, "tail": {$: "Con", "head": {$: "RootAnbu"}, "tail": {$: "Con", "head": {$: "WhiteZetsu"}, "tail": {$: "Con", "head": {$: "Fu"}, "tail": {$: "Con", "head": {$: "Torune"}, "tail": {$: "Con", "head": {$: "Guren"}, "tail": {$: "Con", "head": {$: "Kigiri"}, "tail": {$: "Con", "head": {$: "Nurari"}, "tail": {$: "Con", "head": {$: "Kiseru"}, "tail": {$: "Con", "head": {$: "Rinji"}, "tail": {$: "Con", "head": {$: "Ameyuri"}, "tail": {$: "Con", "head": {$: "Jinpachi"}, "tail": {$: "Con", "head": {$: "Kushimaru"}, "tail": {$: "Con", "head": {$: "Fuguki"}, "tail": {$: "Con", "head": {$: "Mangetsu"}, "tail": {$: "Con", "head": {$: "Kisame"}, "tail": {$: "Con", "head": {$: "Deidara"}, "tail": {$: "Con", "head": {$: "Itachi"}, "tail": {$: "Con", "head": {$: "Hidan"}, "tail": {$: "Con", "head": {$: "Kakuzu"}, "tail": {$: "Con", "head": {$: "Sasori"}, "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}};
}

function $pick_foe$(_pool_0, _seed_0, _salt_0) {
  const _x_0 = ($roll$(_seed_0, _salt_0, ($len$(_pool_0))));
  return $Maybe$default$(($List$get$(_pool_0, _x_0)), {$: "Zori"});
}

function $foe_name$(_f_0) {
  return $FoeInfo$name$(($foe_info$(_f_0)));
}

function $has_name$(_xs_0, _s_0) {
  if (_xs_0.$ === "Nil") {
    return false;
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    const _x_0 = ($String$eq$(_h_0, _s_0));
    const _x_1 = ($has_name$(_t_0, _s_0));
    return (_x_0 || _x_1);
  }
}

function $fresh_foes$(_fs_0, _met_0) {
  if (_fs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fs_0["head"];
    const _t_0 = _fs_0["tail"];
    return $Bool$pick$(($has_name$(_met_0, ($foe_name$(_f_0)))), ($fresh_foes$(_t_0, _met_0)), {$: "Con", "head": _f_0, "tail": ($fresh_foes$(_t_0, _met_0))});
  }
}

function $names_of$(_fs_0) {
  if (_fs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _f_0 = _fs_0["head"];
    const _t_0 = _fs_0["tail"];
    return {$: "Con", "head": ($foe_name$(_f_0)), "tail": ($names_of$(_t_0))};
  }
}

function $pick_unique$(_n_0, _pool_0, _met_0, _here_0, _seed_0, _salt_0) {
  if (_n_0 === 0) {
    return {$: "Picks", "foes": {$: "Nil"}, "met": _met_0};
  } else {
    const _p_0 = (_n_0 - 1);
    const _fresh_0 = ($fresh_foes$(_pool_0, _met_0));
    const _local_0 = ($fresh_foes$(_pool_0, _here_0));
    const _src_0 = ($Bool$pick$(($gt0$(($len$(_fresh_0)))), _fresh_0, ($Bool$pick$(($gt0$(($len$(_local_0)))), _local_0, _pool_0))));
    const _f_0 = ($pick_foe$(_src_0, _seed_0, _salt_0));
    const _nm_0 = ($foe_name$(_f_0));
    const _rest_0 = ($pick_unique$(_p_0, _pool_0, {$: "Con", "head": _nm_0, "tail": _met_0}, {$: "Con", "head": _nm_0, "tail": _here_0}, _seed_0, ((_salt_0 + 1) >>> 0)));
    return {$: "Picks", "foes": {$: "Con", "head": _f_0, "tail": ($Picks$foes$(_rest_0))}, "met": ($Picks$met$(_rest_0))};
  }
}

function $fresh_groups$(_gs_0, _met_0) {
  if (_gs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _g_0 = _gs_0["head"];
    const _t_0 = _gs_0["tail"];
    const _lead_0 = ($Maybe$default$(($List$head$(_g_0)), {$: "Zori"}));
    return $Bool$pick$(($has_name$(_met_0, ($foe_name$(_lead_0)))), ($fresh_groups$(_t_0, _met_0)), {$: "Con", "head": _g_0, "tail": ($fresh_groups$(_t_0, _met_0))});
  }
}

function $elite_pick$(_act_0, _met_0, _seed_0, _salt_0) {
  const _groups_0 = ($Maybe$default$(($List$get$(($elite_table$()), _act_0)), {$: "Con", "head": {$: "Con", "head": {$: "Zabuza"}, "tail": {$: "Nil"}}, "tail": {$: "Nil"}}));
  const _fresh_0 = ($fresh_groups$(_groups_0, _met_0));
  const _src_0 = ($Bool$pick$(($gt0$(($len$(_fresh_0)))), _fresh_0, _groups_0));
  const _x_0 = ($roll$(_seed_0, _salt_0, ($len$(_src_0))));
  const _g_0 = ($Maybe$default$(($List$get$(_src_0, _x_0)), {$: "Con", "head": {$: "Zabuza"}, "tail": {$: "Nil"}}));
  return {$: "Picks", "foes": _g_0, "met": ($List$append$(($names_of$(_g_0)), _met_0))};
}

function $fight_size$(_floor_0, _seed_0, _salt_0) {
  const _x_0 = ($roll$(_seed_0, _salt_0, 2));
  return $Bool$pick$((_floor_0 < 3), 1, ($Bool$pick$((_floor_0 < 9), ((1 + _x_0) >>> 0), 2)));
}

function $mission_lvl$(_act_0, _floor_0) {
  const _x_0 = (Math.imul(8, _act_0) >>> 0);
  const _x_1 = (Math.imul(2, _floor_0) >>> 0);
  const _x_2 = ((1 + _x_0) >>> 0);
  const _x_3 = (3 === 0 ? 0 : (_x_1 / 3) >>> 0);
  return ((_x_2 + _x_3) >>> 0);
}

function $mission_rank$(_act_0, _floor_0) {
  const _x_0 = (Math.imul(2, _act_0) >>> 0);
  const _x_1 = ($Bool$pick$((_floor_0 >= 6), 1, 0));
  return $u32_min$(((_x_0 + _x_1) >>> 0), 4);
}

function $cell0$() {
  return {$: "Cell", "kind": 0, "arg": 0, "links": {$: "Nil"}};
}

function $cell_at$(_xs_0, _i_0) {
  return $Maybe$default$(($List$get$(_xs_0, _i_0)), ($cell0$()));
}

function $set_cell$(_xs_0, _i_0, _c_0) {
  return $List$set$(_xs_0, _i_0, _c_0);
}

function $map_step$(_grid_0, _i_0, _j_0) {
  const _c_0 = ($cell_at$(_grid_0, _i_0));
  const _ls_0 = ($Cell$links$(_c_0));
  return $set_cell$(_grid_0, _i_0, ($Cell$with_links$(($Cell$with_kind$(_c_0, 9)), ($Bool$pick$(($has_u32$(_ls_0, _j_0)), _ls_0, ($snoc$(_ls_0, _j_0)))))));
}

function $walk$($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _steps_0 = $0;
      const _grid_0 = $1;
      const _floor_0 = $2;
      const _lane_0 = $3;
      const _seed_0 = $4;
      const _salt_0 = $5;
      if (_steps_0 === 0) {
        const _x_0 = (Math.imul(_floor_0, 7) >>> 0);
        return $map_step$(_grid_0, ((_x_0 + _lane_0) >>> 0), 84);
      } else {
        const _p_0 = (_steps_0 - 1);
        const _x_1 = ($roll$(_seed_0, _salt_0, 3));
        const _nl0_0 = ($u32_min$(($sub0$(((_lane_0 + _x_1) >>> 0), 1)), 6));
        const _here_0 = (Math.imul(_floor_0, 7) >>> 0);
        const _x_2 = ((_floor_0 + 1) >>> 0);
        const _x_3 = (Math.imul(_x_2, 7) >>> 0);
        const _up_0 = ((_x_3 + _lane_0) >>> 0);
        const _x_4 = ((_lane_0 + 1) >>> 0);
        const _x_5 = ((_here_0 + _lane_0) >>> 0);
        const _right_0 = ($Bool$and$((_nl0_0 === _x_4), ($has_u32$(($Cell$links$(($cell_at$(_grid_0, ((_x_5 + 1) >>> 0))))), _up_0))));
        const _x_6 = ((_nl0_0 + 1) >>> 0);
        const _left_0 = ($Bool$and$(($gt0$(_lane_0)), ($Bool$and$((_x_6 === _lane_0), ($has_u32$(($Cell$links$(($cell_at$(_grid_0, ($sub0$(((_here_0 + _lane_0) >>> 0), 1)))))), _up_0))))));
        const _nl_0 = ($Bool$pick$((_right_0 || _left_0), _lane_0, _nl0_0));
        const _x_7 = (Math.imul(_floor_0, 7) >>> 0);
        const _x_8 = ((_floor_0 + 1) >>> 0);
        const _x_9 = (Math.imul(_x_8, 7) >>> 0);
        $0 = _p_0;
        $1 = ($map_step$(_grid_0, ((_x_7 + _lane_0) >>> 0), ((_x_9 + _nl_0) >>> 0)));
        $2 = ((_floor_0 + 1) >>> 0);
        $3 = _nl_0;
        $4 = _seed_0;
        $5 = ((_salt_0 + 13) >>> 0);
        continue;
      }
    }
  }
}

function $paths$($0, $1, $2, $3) {
  for (;;) {
    {
      const _n_0 = $0;
      const _grid_0 = $1;
      const _seed_0 = $2;
      const _salt_0 = $3;
      if (_n_0 === 0) {
        return _grid_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($walk$(11, _grid_0, 0, ($roll$(_seed_0, _salt_0, 7)), _seed_0, ((_salt_0 + 7) >>> 0)));
        $2 = _seed_0;
        $3 = ((_salt_0 + 101) >>> 0);
        continue;
      }
    }
  }
}

function $fixed_kind$(_f_0) {
  return $Bool$pick$((_f_0 === 0), 1, ($Bool$pick$((_f_0 === 5), 6, ($Bool$pick$((_f_0 === 11), 4, 0)))));
}

function $count_open$(_cs_0, _i_0) {
  if (_cs_0.$ === "Nil") {
    return 0;
  } else {
    const _c_0 = _cs_0["head"];
    const _t_0 = _cs_0["tail"];
    const _x_0 = ($Cell$kind$(_c_0));
    const _x_1 = ($fixed_kind$((7 === 0 ? 0 : (_i_0 / 7) >>> 0)));
    const _open_0 = ($Bool$and$((_x_0 === 9), (_x_1 === 0)));
    const _x_2 = ($Bool$pick$(_open_0, 1, 0));
    const _x_3 = ($count_open$(_t_0, ((_i_0 + 1) >>> 0)));
    return ((_x_2 + _x_3) >>> 0);
  }
}

function $rate$(_n_0, _p_0) {
  const _x_0 = (Math.imul(_n_0, _p_0) >>> 0);
  const _x_1 = ((_x_0 + 50) >>> 0);
  return (100 === 0 ? 0 : (_x_1 / 100) >>> 0);
}

function $drop_u32$(_xs_0, _i_0) {
  const _x_0 = ((_i_0 + 1) >>> 0);
  return $List$append$(($List$take$(_xs_0, _i_0)), ($List$drop$(_xs_0, _x_0)));
}

function $shuffle$(_n_0, _xs_0, _seed_0, _salt_0) {
  if (_n_0 === 0) {
    return _xs_0;
  } else {
    const _p_0 = (_n_0 - 1);
    const _k_0 = ($roll$(_seed_0, _salt_0, ($len$(_xs_0))));
    return {$: "Con", "head": ($at_u32$(_xs_0, _k_0)), "tail": ($shuffle$(_p_0, ($drop_u32$(_xs_0, _k_0)), _seed_0, ((_salt_0 + 3) >>> 0)))};
  }
}

function $room_list$(_n_0, _seed_0) {
  const _shop_0 = ($rate$(_n_0, 5));
  const _rest_0 = ($rate$(_n_0, 12));
  const _ev_0 = ($rate$(_n_0, 22));
  const _el_0 = ($rate$(_n_0, 8));
  const _x_0 = ((_ev_0 + _el_0) >>> 0);
  const _x_1 = ((_rest_0 + _x_0) >>> 0);
  const _mon_0 = ($sub0$(_n_0, ((_shop_0 + _x_1) >>> 0)));
  const _xs_0 = ($List$append$(($List$replicate$(_shop_0, 5)), ($List$append$(($List$replicate$(_rest_0, 4)), ($List$append$(($List$replicate$(_ev_0, 3)), ($List$append$(($List$replicate$(_el_0, 2)), ($List$replicate$(_mon_0, 1))))))))));
  const _x_2 = ($len$(_xs_0));
  return $shuffle$(_x_2, _xs_0, _seed_0, 601);
}

function $parents$(_n_0, _cs_0, _j_0, _i_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    const _c_0 = ($cell_at$(_cs_0, _j_0));
    return $keep_idx$(_j_0, ($Bool$and$(($gt0$(($Cell$kind$(_c_0)))), ($has_u32$(($Cell$links$(_c_0)), _i_0)))), ($parents$(_p_0, _cs_0, ((_j_0 + 1) >>> 0), _i_0)));
  }
}

function $kinds_has$(_js_0, _cs_0, _t_0) {
  if (_js_0.$ === "Nil") {
    return false;
  } else {
    const _j_0 = _js_0["head"];
    const _rest_0 = _js_0["tail"];
    const _x_0 = ($Cell$kind$(($cell_at$(_cs_0, _j_0))));
    const _x_1 = (_x_0 === _t_0);
    const _x_2 = ($kinds_has$(_rest_0, _cs_0, _t_0));
    return (_x_1 || _x_2);
  }
}

function $kids$(_ps_0, _cs_0) {
  if (_ps_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _p_0 = _ps_0["head"];
    const _rest_0 = _ps_0["tail"];
    return $List$append$(($Cell$links$(($cell_at$(_cs_0, _p_0)))), ($kids$(_rest_0, _cs_0)));
  }
}

function $without$(_xs_0, _x_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return $keep_idx$(_h_0, ($Bool$not$((_h_0 === _x_0))), ($without$(_t_0, _x_0)));
  }
}

function $room_ok$(_cs_0, _i_0, _t_0) {
  const _f_0 = (7 === 0 ? 0 : (_i_0 / 7) >>> 0);
  const _x_0 = (_t_0 === 4);
  const _x_1 = (_t_0 === 2);
  const _early_0 = ($Bool$and$((_x_0 || _x_1), (_f_0 < 4)));
  const _pre_0 = ($Bool$and$((_t_0 === 4), (_f_0 === 10)));
  const _x_2 = ($sub0$(_f_0, 1));
  const _ps_0 = ($parents$(7, _cs_0, (Math.imul(_x_2, 7) >>> 0), _i_0));
  const _x_3 = (_t_0 === 4);
  const _x_4 = (_t_0 === 6);
  const _x_5 = (_t_0 === 5);
  const _x_6 = (_t_0 === 2);
  const _x_7 = (_x_3 || _x_4);
  const _x_8 = (_x_5 || _x_6);
  const _pmatch_0 = ($Bool$and$((_x_7 || _x_8), ($Bool$and$(($gt0$(_f_0)), ($kinds_has$(_ps_0, _cs_0, _t_0))))));
  const _smatch_0 = ($Bool$and$(($Bool$not$((_t_0 === 6))), ($Bool$and$(($gt0$(_f_0)), ($kinds_has$(($without$(($kids$(_ps_0, _cs_0)), _i_0)), _cs_0, _t_0))))));
  const _x_9 = (_early_0 || _pre_0);
  const _x_10 = (_pmatch_0 || _smatch_0);
  return $Bool$not$((_x_9 || _x_10));
}

function $first_ok$(_n_0, _cs_0, _i_0, _pool_0, _k_0) {
  if (_n_0 === 0) {
    return 999;
  } else {
    const _p_0 = (_n_0 - 1);
    return $Bool$pick$(($room_ok$(_cs_0, _i_0, ($at_u32$(_pool_0, _k_0)))), _k_0, ($first_ok$(_p_0, _cs_0, _i_0, _pool_0, ((_k_0 + 1) >>> 0))));
  }
}

function $pick_room$(_open_0, _cs_0, _i_0, _pool_0) {
  if (_open_0) {
    const _x_0 = ($len$(_pool_0));
    return $first_ok$(_x_0, _cs_0, _i_0, _pool_0, 0);
  } else {
    return 999;
  }
}

function $assign_sts$($0, $1, $2, $3, $4, $5) {
  for (;;) {
    {
      const _n_0 = $0;
      const _cs_0 = $1;
      const _i_0 = $2;
      const _pool_0 = $3;
      const _seed_0 = $4;
      const _act_0 = $5;
      if (_n_0 === 0) {
        return _cs_0;
      } else {
        const _p_0 = (_n_0 - 1);
        const _c_0 = ($cell_at$(_cs_0, _i_0));
        const _fk_0 = ($fixed_kind$((7 === 0 ? 0 : (_i_0 / 7) >>> 0)));
        const _x_0 = ($Cell$kind$(_c_0));
        const _used_0 = (_x_0 === 9);
        const _k_0 = ($pick_room$(($Bool$and$(_used_0, (_fk_0 === 0))), _cs_0, _i_0, _pool_0));
        const _found_0 = (_k_0 < 999);
        const _room_0 = ($Bool$pick$(_found_0, ($at_u32$(_pool_0, _k_0)), 1));
        const _boss_0 = (_i_0 === 84);
        const _kind_0 = ($Bool$pick$(_boss_0, 8, ($Bool$pick$(_used_0, ($Bool$pick$(($gt0$(_fk_0)), _fk_0, _room_0)), 0))));
        const _x_1 = (Math.imul(_i_0, 17) >>> 0);
        const _arg_0 = ($Bool$pick$(_boss_0, ($act_boss$(_act_0)), ($roll$(_seed_0, ((_x_1 + 3) >>> 0), 10))));
        const _pool2_0 = ($Bool$pick$(_found_0, ($drop_u32$(_pool_0, _k_0)), _pool_0));
        $0 = _p_0;
        $1 = ($set_cell$(_cs_0, _i_0, ($Cell$with_arg$(($Cell$with_kind$(_c_0, _kind_0)), _arg_0))));
        $2 = ((_i_0 + 1) >>> 0);
        $3 = _pool2_0;
        $4 = _seed_0;
        $5 = _act_0;
        continue;
      }
    }
  }
}

function $first_used$(_n_0, _cs_0, _i_0) {
  if (_n_0 === 0) {
    return _i_0;
  } else {
    const _p_0 = (_n_0 - 1);
    return $Bool$pick$(($gt0$(($Cell$kind$(($cell_at$(_cs_0, _i_0)))))), _i_0, ($first_used$(_p_0, _cs_0, ((_i_0 + 1) >>> 0))));
  }
}

function $place_story$($0, $1, $2, $3) {
  for (;;) {
    {
      const _ms_0 = $0;
      const _cs_0 = $1;
      const _k_0 = $2;
      const _act_0 = $3;
      if (_ms_0.$ === "Nil") {
        return _cs_0;
      } else {
        const _m_0 = _ms_0["head"];
        const _t_0 = _ms_0["tail"];
        const _f_0 = ($at_u32$({$: "Con", "head": 3, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 8, "tail": {$: "Nil"}}}}, _k_0));
        const _i_0 = ($first_used$(7, _cs_0, (Math.imul(_f_0, 7) >>> 0)));
        const _x_0 = ($Member$ftier$(_m_0));
        const _need_0 = ($Bool$and$(($gt0$(_act_0)), (_x_0 < 2)));
        const _cs2_0 = ($Bool$pick$(_need_0, ($set_cell$(_cs_0, _i_0, {$: "Cell", "kind": 7, "arg": ($who_id$(($Member$who$(_m_0)))), "links": ($Cell$links$(($cell_at$(_cs_0, _i_0))))})), _cs_0));
        $0 = _t_0;
        $1 = _cs2_0;
        $2 = ((_k_0 + 1) >>> 0);
        $3 = _act_0;
        continue;
      }
    }
  }
}

function $gen_map$(_act_0, _seed_0, _ms_0) {
  const _grid_0 = ($paths$(6, ($List$replicate$(85, ($cell0$()))), _seed_0, 11));
  const _pool_0 = ($room_list$(($count_open$(_grid_0, 0)), _seed_0));
  return $place_story$(_ms_0, ($assign_sts$(85, _grid_0, 0, _pool_0, _seed_0, _act_0)), 0, _act_0);
}

function $floor0$(_cs_0, _i_0) {
  if (_cs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _c_0 = _cs_0["head"];
    const _t_0 = _cs_0["tail"];
    return $keep_idx$(_i_0, ($Bool$and$((_i_0 < 7), ($gt0$(($Cell$kind$(_c_0)))))), ($floor0$(_t_0, ((_i_0 + 1) >>> 0))));
  }
}

function $next_cells$(_run_0) {
  const _pos_0 = ($Run$pos$(_run_0));
  return $Bool$pick$((_pos_0 === 999), ($floor0$(($Run$map$(_run_0)), 0)), ($Cell$links$(($cell_at$(($Run$map$(_run_0)), _pos_0)))));
}

function $start_battle$(_run_0, _foes_0, _boss_0, _rank_0) {
  const _arts_0 = ($Run$arts$(_run_0));
  const _sealed_0 = ($sealed_count$(_run_0));
  const _seed_0 = ($Run$seed$(_run_0));
  const _bag_0 = ($Run$bag$(_run_0));
  const _fs_0 = ($List$append$(($party_fighters$(($Run$party$(_run_0)), ($run_bonus$(_run_0)), ($Bag$weps$(_bag_0)))), _foes_0));
  const _b1_0 = ($new_battle$(_fs_0, _boss_0, _rank_0, _arts_0, _sealed_0, ($mix$(((_seed_0 + 13) >>> 0))), ($Bag$smain$(_bag_0)), ($summon_power$(_bag_0))));
  return $Run$with_seed$(($Run$with_mode$(_run_0, {$: "InBattle", "b": _b1_0})), ($mix$(((_seed_0 + 17) >>> 0))));
}

function $mission_battle$(_run_0, _bump_0, _text_0) {
  const _act_0 = ($Run$act$(_run_0));
  const _f_0 = ($floor_of$(($Run$pos$(_run_0))));
  const _seed_0 = ($Run$seed$(_run_0));
  const _x_0 = ($fight_size$(_f_0, _seed_0, 20));
  const _pk_0 = ($pick_unique$(_x_0, ($minion_pool$(_act_0)), ($Run$met$(_run_0)), {$: "Nil"}, _seed_0, 24));
  const _x_1 = ($mission_lvl$(_act_0, _f_0));
  const _foes_0 = ($act_foes$(($foe_fighters$(($Picks$foes$(_pk_0)), ((_x_1 + _bump_0) >>> 0))), _act_0, false));
  const _x_2 = ($mission_rank$(_act_0, _f_0));
  return $start_battle$(($Run$with_met$(($Run$with_msg$(_run_0, _text_0)), ($Picks$met$(_pk_0)))), _foes_0, 0, ($u32_min$(((_x_2 + _bump_0) >>> 0), 4)));
}

function $elite_battle$(_run_0) {
  const _act_0 = ($Run$act$(_run_0));
  const _f_0 = ($floor_of$(($Run$pos$(_run_0))));
  const _pk_0 = ($elite_pick$(_act_0, ($Run$met$(_run_0)), ($Run$seed$(_run_0)), 23));
  const _x_0 = ($mission_lvl$(_act_0, _f_0));
  const _foes_0 = ($act_foes$(($foe_fighters$(($Picks$foes$(_pk_0)), ((_x_0 + 2) >>> 0))), _act_0, false));
  const _x_1 = ($mission_rank$(_act_0, _f_0));
  const _x_2 = ($u32_min$(((_x_1 + 1) >>> 0), 4));
  return $start_battle$(($Run$with_met$(($Run$with_msg$(_run_0, "Elite: a dangerous foe bars the way!")), ($Picks$met$(_pk_0)))), _foes_0, 0, ((10 + _x_2) >>> 0));
}

function $heal_cost$(_run_0) {
  const _x_0 = ($Run$act$(_run_0));
  const _x_1 = ($Run$act$(_run_0));
  const _x_2 = (Math.imul(20, _x_1) >>> 0);
  return $Bool$pick$((_x_0 === 2), 0, ((30 + _x_2) >>> 0));
}

function $mode_free$(_m_0) {
  if (_m_0.$ === "OnMap") {
    return true;
  } else if (_m_0.$ === "InVillage") {
    return true;
  } else {
    return false;
  }
}

function $in_village$(_m_0) {
  if (_m_0.$ === "InVillage") {
    return true;
  } else {
    return false;
  }
}

function $on_map$(_m_0) {
  if (_m_0.$ === "OnMap") {
    return true;
  } else {
    return false;
  }
}

function $to_map$(_run_0, _text_0) {
  return $Run$with_msg$(($Run$with_mode$(_run_0, {$: "OnMap"})), _text_0);
}

function $set_battle$(_run_0, _b_0) {
  return $Run$with_mode$(_run_0, {$: "InBattle", "b": _b_0});
}

function $cmd_tool$(_run_0, _b_0, _who_0, _tool_0, _t_0, _ok_0) {
  if (!_ok_0) {
    return _run_0;
  } else {
    return $set_battle$(($Run$with_tools$(_run_0, ($remove_tool$(($Run$tools$(_run_0)), _tool_0)))), ($check_end$(($use_tool$(($act_start$(_b_0)), _who_0, _t_0, _tool_0)))));
  }
}

function $cmd_do$(_c_0, _run_0, _b_0, _who_0) {
  if (_c_0.$ === "CTool") {
    const _tool_0 = _c_0["tool"];
    const _t_0 = _c_0["target"];
    return $cmd_tool$(_run_0, _b_0, _who_0, _tool_0, _t_0, ($has_tool$(($Run$tools$(_run_0)), _tool_0)));
  } else if (_c_0.$ === "CAttack") {
    const _t_1 = _c_0["target"];
    return $set_battle$(_run_0, ($act_cmd$({$: "CAttack", "target": _t_1}, _b_0, _who_0)));
  } else if (_c_0.$ === "CJutsu") {
    const _m_0 = _c_0["move"];
    const _t_2 = _c_0["target"];
    return $set_battle$(_run_0, ($act_cmd$({$: "CJutsu", "move": _m_0, "target": _t_2}, _b_0, _who_0)));
  } else if (_c_0.$ === "CGuard") {
    return $set_battle$(_run_0, ($act_cmd$({$: "CGuard"}, _b_0, _who_0)));
  } else {
    return $set_battle$(_run_0, ($act_cmd$({$: "CTransform"}, _b_0, _who_0)));
  }
}

function $cmd_phase$(_p_0, _run_0, _c_0, _b_0) {
  if (_p_0.$ === "Ask") {
    const _who_0 = _p_0["who"];
    return $cmd_do$(_c_0, _run_0, _b_0, _who_0);
  } else {
    return _run_0;
  }
}

function $cmd_mode$(_m_0, _run_0, _c_0) {
  if (_m_0.$ === "InBattle") {
    const _b_0 = _m_0["b"];
    return $cmd_phase$(($Battle$phase$(_b_0)), _run_0, _c_0, _b_0);
  } else {
    return _run_0;
  }
}

function $count_art$(_arts_0, _a_0) {
  if (_arts_0.$ === "Nil") {
    return 0;
  } else {
    const _h_0 = _arts_0["head"];
    const _t_0 = _arts_0["tail"];
    const _x_0 = ($art_id$(_h_0));
    const _x_1 = ($art_id$(_a_0));
    const _x_2 = ($Bool$pick$((_x_0 === _x_1), 1, 0));
    const _x_3 = ($count_art$(_t_0, _a_0));
    return ((_x_2 + _x_3) >>> 0);
  }
}

function $under_cap$(_xs_0, _owned_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _a_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    const _x_0 = ($count_art$(_owned_0, _a_0));
    return $Bool$pick$((_x_0 >= 6), ($under_cap$(_t_0, _owned_0)), {$: "Con", "head": _a_0, "tail": ($under_cap$(_t_0, _owned_0))});
  }
}

function $party_relics$(_ms_0, _owned_0) {
  if (_ms_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    const _r_0 = ($form_relic$(($Member$who$(_m_0))));
    return $Bool$pick$(($has_art$(_owned_0, _r_0)), ($party_relics$(_t_0, _owned_0)), {$: "Con", "head": _r_0, "tail": ($party_relics$(_t_0, _owned_0))});
  }
}

function $take_rand$(_n_0, _pool_0, _seed_0, _salt_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    const _x_0 = ($roll$(_seed_0, _salt_0, ($len$(_pool_0))));
    const _k_0 = _x_0;
    const _rest_0 = ($List$append$(($List$take$(_pool_0, _k_0)), ($List$drop$(_pool_0, nat_chk(_k_0 + 1)))));
    return $List$append$(($List$take$(($List$drop$(_pool_0, _k_0)), 1)), ($take_rand$(_p_0, _rest_0, _seed_0, ((_salt_0 + 1) >>> 0))));
  }
}

function $loot_must$(_l_0) {
  if (_l_0.$ === "LWill") {
    return true;
  } else if (_l_0.$ === "LAff") {
    return true;
  } else if (_l_0.$ === "LTrain") {
    return true;
  } else if (_l_0.$ === "LLog") {
    return true;
  } else {
    return false;
  }
}

function $any_must$(_ls_0) {
  if (_ls_0.$ === "Nil") {
    return false;
  } else {
    const _l_0 = _ls_0["head"];
    const _t_0 = _ls_0["tail"];
    const _x_0 = ($loot_must$(_l_0));
    const _x_1 = ($any_must$(_t_0));
    return (_x_0 || _x_1);
  }
}

function $loot$(_run_0, _items_0, _text_0) {
  return $Bool$pick$(($gt0$(($len$(_items_0)))), ($Run$with_msg$(($Run$with_mode$(_run_0, {$: "InLoot", "items": _items_0, "text": _text_0})), _text_0)), ($Run$with_msg$(($Run$with_mode$(_run_0, {$: "OnMap"})), _text_0)));
}

function $will_offer$(_seed_0, _salt_0) {
  return $without$({$: "Con", "head": 0, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 3, "tail": {$: "Nil"}}}}}, ($roll$(_seed_0, _salt_0, 4)));
}

function $train_items$(_old_0, _new_0, _i_0) {
  if (_old_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _o_0 = _old_0["head"];
    const _ot_0 = _old_0["tail"];
    if (_new_0.$ === "Nil") {
      return {$: "Nil"};
    } else {
      const _n_0 = _new_0["head"];
      const _nt_0 = _new_0["tail"];
      const _gain_0 = ($sub0$(($Member$lvl$(_n_0)), ($Member$lvl$(_o_0))));
      const _rest_0 = ($train_items$(_ot_0, _nt_0, ((_i_0 + 1) >>> 0)));
      return $Bool$pick$(($gt0$(_gain_0)), {$: "Con", "head": {$: "LTrain", "who": _i_0, "n": _gain_0}, "tail": _rest_0}, _rest_0);
    }
  }
}

function $relic_opts$(_run_0) {
  const _owned_0 = ($Run$arts$(_run_0));
  const _x_0 = ($sealed_count$(_run_0));
  const _fr_0 = ($Bool$pick$((_x_0 >= 1), ($party_relics$(($Run$party$(_run_0)), _owned_0)), {$: "Nil"}));
  const _pick1_0 = ($take_rand$(1, _fr_0, ($Run$seed$(_run_0)), 7));
  return $List$take$(($List$append$(_pick1_0, ($take_rand$(3, ($under_cap$(($all_arts$()), _owned_0)), ($Run$seed$(_run_0)), 3)))), 3);
}

function $relic_loot$(_run_0) {
  const _opts_0 = ($relic_opts$(_run_0));
  return $Bool$pick$(($gt0$(($len$(_opts_0)))), {$: "Con", "head": {$: "LRelic", "opts": _opts_0}, "tail": {$: "Nil"}}, {$: "Nil"});
}

function $offer$(_run_0, _text_0) {
  return $loot$(_run_0, ($relic_loot$(_run_0)), _text_0);
}

function $next_act$(_run_0, _text_0, _items_0) {
  const _x_0 = ($Run$act$(_run_0));
  const _act_0 = ((_x_0 + 1) >>> 0);
  const _x_1 = ($Run$seed$(_run_0));
  const _seed_0 = ($mix$(((_x_1 + 919) >>> 0)));
  const _run1_0 = ($Run$with_seed$(($Run$with_pos$(($Run$with_map$(($Run$with_act$(_run_0, _act_0)), ($gen_map$(_act_0, _seed_0, ($Run$party$(_run_0)))))), 999)), _seed_0));
  const _x_2 = ($act_name$(_act_0));
  const _x_3 = (_x_2 + ".");
  const _x_4 = (" Onward to " + _x_3);
  return $loot$(($heal_party$(_run1_0, 100)), ($List$append$(($relic_loot$(_run1_0)), _items_0)), (_text_0 + _x_4));
}

function $win$beast$(_run_0, _t_0, _text_0, _items_0) {
  const _run1_0 = ($Run$with_sealed$(_run_0, ($snoc$(($Run$sealed$(_run_0)), _t_0))));
  const _x_0 = ($beast_name$(_t_0));
  const _x_1 = (_x_0 + " has been sealed!");
  const _x_2 = (" " + _x_1);
  const _msg_0 = (_text_0 + _x_2);
  const _x_3 = ($Run$act$(_run_0));
  return $Bool$pick$((_x_3 === 2), ($Run$with_msg$(($Run$with_mode$(_run1_0, {$: "Victory"})), _msg_0)), ($next_act$(_run1_0, _msg_0, _items_0)));
}

function $win$job$(_run_0, _rank_0, _text_0, _items_0) {
  const _seed_0 = ($Run$seed$(_run_0));
  const _drop_0 = ($chance$(_seed_0, 61, 35));
  const _x_0 = ($roll$(_seed_0, 62, 7));
  const _tool_0 = ($Maybe$default$(($List$get$(($all_tools$()), _x_0)), {$: "Kunai"}));
  const _run1_0 = ($Bool$pick$(_drop_0, ($Run$with_tools$(_run_0, ($snoc$(($Run$tools$(_run_0)), _tool_0)))), _run_0));
  const _x_1 = ($MoveInfo$name$(($tool_info$(_tool_0))));
  const _x_2 = (_x_1 + ".");
  const _x_3 = (" Found: " + _x_2);
  const _text2_0 = ($Bool$pick$(_drop_0, (_text_0 + _x_3), _text_0));
  const _elite_0 = ($List$append$(($relic_loot$(_run1_0)), {$: "Con", "head": {$: "LWill", "opts": ($will_offer$(_seed_0, 64))}, "tail": {$: "Nil"}}));
  return $loot$(_run1_0, ($List$append$(($Bool$pick$((_rank_0 >= 10), _elite_0, {$: "Nil"})), _items_0)), _text2_0);
}

function $battle_scrolls$(_rank_0, _boss_0) {
  return $Bool$pick$(($gt0$(_boss_0)), ((5 + _boss_0) >>> 0), ($at_u32$({$: "Con", "head": 1, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 3, "tail": {$: "Con", "head": 4, "tail": {$: "Nil"}}}}}}, _rank_0)));
}

function $wallet_add$(_w_0, _k_0, _a_0) {
  const _x_0 = ($Wallet$wsc$(_w_0));
  const _x_1 = ($Bool$pick$((_k_0 === 0), _a_0, 0));
  const _x_2 = ($Wallet$csc$(_w_0));
  const _x_3 = ($Bool$pick$((_k_0 === 1), _a_0, 0));
  const _x_4 = ($Wallet$gsc$(_w_0));
  const _x_5 = ($Bool$pick$((_k_0 === 2), _a_0, 0));
  const _x_6 = ($Wallet$whet$(_w_0));
  const _x_7 = ($Bool$pick$((_k_0 === 3), _a_0, 0));
  const _x_8 = ($Wallet$ore$(_w_0));
  const _x_9 = ($Bool$pick$((_k_0 === 4), _a_0, 0));
  const _x_10 = ($Wallet$seal$(_w_0));
  const _x_11 = ($Bool$pick$((_k_0 === 5), _a_0, 0));
  const _x_12 = ($Wallet$wp$(_w_0));
  const _x_13 = ($Bool$pick$((_k_0 === 6), _a_0, 0));
  const _x_14 = ($Wallet$ap$(_w_0));
  const _x_15 = ($Bool$pick$((_k_0 === 7), _a_0, 0));
  return {$: "Wallet", "wsc": ((_x_0 + _x_1) >>> 0), "csc": ((_x_2 + _x_3) >>> 0), "gsc": ((_x_4 + _x_5) >>> 0), "whet": ((_x_6 + _x_7) >>> 0), "ore": ((_x_8 + _x_9) >>> 0), "seal": ((_x_10 + _x_11) >>> 0), "wp": ((_x_12 + _x_13) >>> 0), "ap": ((_x_14 + _x_15) >>> 0)};
}

function $wallet_sub$(_w_0, _k_0, _a_0) {
  return {$: "Wallet", "wsc": ($sub0$(($Wallet$wsc$(_w_0)), ($Bool$pick$((_k_0 === 0), _a_0, 0)))), "csc": ($sub0$(($Wallet$csc$(_w_0)), ($Bool$pick$((_k_0 === 1), _a_0, 0)))), "gsc": ($sub0$(($Wallet$gsc$(_w_0)), ($Bool$pick$((_k_0 === 2), _a_0, 0)))), "whet": ($sub0$(($Wallet$whet$(_w_0)), ($Bool$pick$((_k_0 === 3), _a_0, 0)))), "ore": ($sub0$(($Wallet$ore$(_w_0)), ($Bool$pick$((_k_0 === 4), _a_0, 0)))), "seal": ($sub0$(($Wallet$seal$(_w_0)), ($Bool$pick$((_k_0 === 5), _a_0, 0)))), "wp": ($sub0$(($Wallet$wp$(_w_0)), ($Bool$pick$((_k_0 === 6), _a_0, 0)))), "ap": ($sub0$(($Wallet$ap$(_w_0)), ($Bool$pick$((_k_0 === 7), _a_0, 0))))};
}

function $wallet_get$(_w_0, _k_0) {
  return $at_u32$({$: "Con", "head": ($Wallet$wsc$(_w_0)), "tail": {$: "Con", "head": ($Wallet$csc$(_w_0)), "tail": {$: "Con", "head": ($Wallet$gsc$(_w_0)), "tail": {$: "Con", "head": ($Wallet$whet$(_w_0)), "tail": {$: "Con", "head": ($Wallet$ore$(_w_0)), "tail": {$: "Con", "head": ($Wallet$seal$(_w_0)), "tail": {$: "Con", "head": ($Wallet$wp$(_w_0)), "tail": {$: "Con", "head": ($Wallet$ap$(_w_0)), "tail": {$: "Nil"}}}}}}}}}, _k_0);
}

function $battle_cash$(_w_0, _rank_0, _boss_0) {
  const _big_0 = ($gt0$(_boss_0));
  const _sc_0 = ($battle_scrolls$(_rank_0, _boss_0));
  const _x_0 = (Math.imul(10, _rank_0) >>> 0);
  const _whet_0 = ($Bool$pick$(_big_0, (Math.imul(40, _boss_0) >>> 0), ((10 + _x_0) >>> 0)));
  const _x_1 = (Math.imul(3, _rank_0) >>> 0);
  const _ore_0 = ($Bool$pick$(_big_0, (Math.imul(10, _boss_0) >>> 0), ((3 + _x_1) >>> 0)));
  const _seal_0 = ($Bool$pick$(_big_0, 3, (2 === 0 ? 0 : (_rank_0 / 2) >>> 0)));
  const _wp_0 = ($Bool$pick$(_big_0, 2, 0));
  const _ap_0 = ($Bool$pick$(_big_0, 1, 0));
  const _x_2 = ($Wallet$wsc$(_w_0));
  const _x_3 = ($Wallet$csc$(_w_0));
  const _x_4 = ($Wallet$gsc$(_w_0));
  const _x_5 = ($Wallet$whet$(_w_0));
  const _x_6 = ($Wallet$ore$(_w_0));
  const _x_7 = ($Wallet$seal$(_w_0));
  const _x_8 = ($Wallet$wp$(_w_0));
  const _x_9 = ($Wallet$ap$(_w_0));
  return {$: "Wallet", "wsc": ((_x_2 + _sc_0) >>> 0), "csc": ((_x_3 + _sc_0) >>> 0), "gsc": ((_x_4 + _sc_0) >>> 0), "whet": ((_x_5 + _whet_0) >>> 0), "ore": ((_x_6 + _ore_0) >>> 0), "seal": ((_x_7 + _seal_0) >>> 0), "wp": ((_x_8 + _wp_0) >>> 0), "ap": ((_x_9 + _ap_0) >>> 0)};
}

function $win$items$(_old_0, _party_0, _logp_0, _rare_0, _seed_0) {
  return {$: "Con", "head": {$: "LJutsu", "opts": ($gen_offer$(_rare_0, _seed_0, 51))}, "tail": ($train_items$(_old_0, _party_0, ((_logp_0 - _logp_0) >>> 0)))};
}

function $win$go$(_beast_0, _run_0, _boss_0, _rank_0, _text_0, _items_0) {
  if (_beast_0) {
    return $win$beast$(_run_0, _boss_0, _text_0, _items_0);
  } else {
    return $win$job$(_run_0, _rank_0, _text_0, _items_0);
  }
}

function $win$(_run_0, _b_0) {
  const _fs_0 = ($Battle$fs$(_b_0));
  const _arts_0 = ($Run$arts$(_run_0));
  const _xp_0 = ($sum_xp$(_fs_0));
  const _ryo0_0 = ($sum_ryo$(_fs_0));
  const _ryo_0 = ($Bool$pick$(($has_art$(_arts_0, {$: "GamaWallet"})), ($pct$(_ryo0_0, 150)), _ryo0_0));
  const _old_0 = ($Run$party$(_run_0));
  const _party_0 = ($gain_all$(($write_back$(_old_0, _fs_0, ($has_art$(_arts_0, {$: "RamenCoupon"})))), _xp_0, ($run_bonus$(_run_0))));
  const _boss_0 = ($Battle$boss$(_b_0));
  const _bag_0 = ($Run$bag$(_run_0));
  const _x_0 = ($Battle$rank$(_b_0));
  const _x_1 = ($Bag$logp$(_bag_0));
  const _bag2_0 = ($Bag$with_logp$(($Bag$with_cash$(_bag_0, ($battle_cash$(($Bag$cash$(_bag_0)), (10 === 0 ? _x_0 : _x_0 % 10), _boss_0)))), ((_x_1 + 1) >>> 0)));
  const _x_2 = ($Run$ryo$(_run_0));
  const _x_3 = ($Run$wins$(_run_0));
  const _run1_0 = ($Run$with_bag$(($Run$with_wins$(($Run$with_seed$(($Run$with_ryo$(($Run$with_party$(_run_0, _party_0)), ((_x_2 + _ryo_0) >>> 0))), ($Battle$seed$(_b_0)))), ((_x_3 + 1) >>> 0))), _bag2_0));
  const _x_4 = ($U32$show$(_ryo_0));
  const _x_5 = (_x_4 + " ryo.");
  const _x_6 = ($U32$show$(_xp_0));
  const _x_7 = (" XP, +" + _x_5);
  const _x_8 = (_x_6 + _x_7);
  const _text_0 = ("Victory! +" + _x_8);
  const _x_9 = ($Battle$rank$(_b_0));
  const _rare_0 = ($Bool$pick$(($gt0$(_boss_0)), 35, ($Bool$pick$((_x_9 >= 10), 10, 3))));
  return $win$go$(($gt0$(_boss_0)), _run1_0, _boss_0, ($Battle$rank$(_b_0)), _text_0, ($win$items$(_old_0, _party_0, ($Bag$logp$(_bag2_0)), _rare_0, ($Battle$seed$(_b_0)))));
}

function $next_phase$(_p_0, _run_0, _b_0) {
  if (_p_0.$ === "Busy") {
    return $set_battle$(_run_0, ($battle_next$(_b_0)));
  } else if (_p_0.$ === "Ask") {
    return _run_0;
  } else if (_p_0.$ === "Won") {
    return $win$(_run_0, _b_0);
  } else if (_p_0.$ === "Lost") {
    return $Run$with_msg$(($Run$with_mode$(_run_0, {$: "GameOver"})), "The squad has fallen. The beasts roam free...");
  } else {
    const _party_0 = ($write_back$(($Run$party$(_run_0)), ($Battle$fs$(_b_0)), false));
    return $Run$with_msg$(($Run$with_mode$(($Run$with_seed$(($Run$with_party$(_run_0, _party_0)), ($Battle$seed$(_b_0)))), {$: "OnMap"})), "You escaped.");
  }
}

function $next_mode$(_m_0, _run_0) {
  if (_m_0.$ === "InBattle") {
    const _b_0 = _m_0["b"];
    return $next_phase$(($Battle$phase$(_b_0)), _run_0, _b_0);
  } else {
    return _run_0;
  }
}

function $v_heal$go$(_run_0, _cost_0, _ok_0) {
  if (!_ok_0) {
    return _run_0;
  } else {
    const _x_0 = ($Run$ryo$(_run_0));
    return $Run$with_msg$(($Run$with_ryo$(($heal_party$(_run_0, 100)), ((_x_0 - _cost_0) >>> 0))), "The squad is fully healed.");
  }
}

function $v_heal$(_run_0) {
  const _cost_0 = ($heal_cost$(_run_0));
  const _x_0 = ($Run$ryo$(_run_0));
  return $v_heal$go$(_run_0, _cost_0, ($Bool$and$(($in_village$(($Run$mode$(_run_0)))), (_x_0 >= _cost_0))));
}

function $v_buy$go$(_run_0, _t_0, _price_0, _ok_0) {
  if (!_ok_0) {
    return _run_0;
  } else {
    const _x_0 = ($Run$ryo$(_run_0));
    const _x_1 = ($MoveInfo$name$(($tool_info$(_t_0))));
    const _x_2 = (_x_1 + ".");
    return $Run$with_msg$(($Run$with_ryo$(($Run$with_tools$(_run_0, ($snoc$(($Run$tools$(_run_0)), _t_0)))), ((_x_0 - _price_0) >>> 0))), ("Bought " + _x_2));
  }
}

function $v_buy$(_run_0, _t_0) {
  const _price_0 = ($MoveInfo$cost$(($tool_info$(_t_0))));
  const _x_0 = ($Run$ryo$(_run_0));
  return $v_buy$go$(_run_0, _t_0, _price_0, ($Bool$and$(($in_village$(($Run$mode$(_run_0)))), (_x_0 >= _price_0))));
}

function $v_leave$(_m_0, _run_0) {
  if (_m_0.$ === "InVillage") {
    return $Run$with_mode$(_run_0, {$: "OnMap"});
  } else {
    return _run_0;
  }
}

function $train$go$(_run_0, _i_0, _m_0, _slot_0, _ok_0) {
  if (!_ok_0) {
    return _run_0;
  } else {
    const _lv_0 = ($at_u32$(($Member$jlv$(_m_0)), _slot_0));
    const _x_0 = ($Member$sp$(_m_0));
    const _m2_0 = ($Member$with_sp$(($Member$with_jlv$(_m_0, ($List$set$(($Member$jlv$(_m_0)), _slot_0, ((_lv_0 + 1) >>> 0))))), ((_x_0 - _lv_0) >>> 0)));
    return $Run$with_party$(_run_0, ($List$set$(($Run$party$(_run_0)), _i_0, _m2_0)));
  }
}

function $train$(_run_0, _i_0, _slot_0) {
  const _m_0 = ($Maybe$default$(($List$get$(($Run$party$(_run_0)), _i_0)), {$: "Member", "who": {$: "Naruto"}, "lvl": 1, "xp": 0, "hp": 0, "ck": 0, "sp": 0, "jlv": {$: "Nil"}, "weapon": 0, "ftier": 0, "tech": {$: "Nil"}}));
  const _lv_0 = ($at_u32$(($Member$jlv$(_m_0)), _slot_0));
  const _x_0 = ($Member$sp$(_m_0));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$((_slot_0 < 4), ($Bool$and$(($gt0$(_lv_0)), ($Bool$and$((_lv_0 < 10), (_x_0 >= _lv_0)))))))));
  return $train$go$(_run_0, _i_0, _m_0, _slot_0, _ok_0);
}

function $new_bag$() {
  const _weps_0 = ($List$set$(($List$replicate$(28, ($owned0$()))), 0, {$: "Owned", "copies": 1, "awk": 0, "lvl": 1}));
  return {$: "Bag", "cash": {$: "Wallet", "wsc": 5, "csc": 5, "gsc": 5, "whet": 40, "ore": 10, "seal": 2, "wp": 0, "ap": 0}, "weps": _weps_0, "smns": ($List$replicate$(28, ($owned0$()))), "kit": ($List$replicate$(6, {$: "Kit", "rar": 99, "stars": 0, "grade": 0, "lines": {$: "Nil"}})), "smain": 0, "ssub1": 0, "ssub2": 0, "will": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}}, "aff": {$: "Con", "head": {$: "Line", "stat": 99, "val": 0, "grade": 0}, "tail": {$: "Con", "head": {$: "Line", "stat": 99, "val": 0, "grade": 0}, "tail": {$: "Con", "head": {$: "Line", "stat": 99, "val": 0, "grade": 0}, "tail": {$: "Nil"}}}}, "pulls": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}, "pity": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}, "cards": {$: "Con", "head": {$: "Card", "kind": 0, "lvl": 0}, "tail": {$: "Con", "head": {$: "Card", "kind": 3, "lvl": 0}, "tail": {$: "Con", "head": {$: "Card", "kind": 1, "lvl": 0}, "tail": {$: "Con", "head": {$: "Card", "kind": 4, "lvl": 0}, "tail": {$: "Nil"}}}}}, "logp": 0, "got": {$: "Nil"}};
}

function $set_u32$(_xs_0, _i_0, _v_0) {
  return $List$set$(_xs_0, _i_0, _v_0);
}

function $set_owned$(_xs_0, _i_0, _o_0) {
  return $List$set$(_xs_0, _i_0, _o_0);
}

function $add_copy$(_xs_0, _i_0) {
  const _o_0 = ($owned_at$(_xs_0, _i_0));
  const _x_0 = ($Owned$copies$(_o_0));
  return $set_owned$(_xs_0, _i_0, ($Owned$with_copies$(_o_0, ((_x_0 + 1) >>> 0))));
}

function $kit_at$(_xs_0, _i_0) {
  return $Maybe$default$(($List$get$(_xs_0, _i_0)), {$: "Kit", "rar": 99, "stars": 0, "grade": 0, "lines": {$: "Nil"}});
}

function $member_at$(_run_0, _i_0) {
  return $Maybe$default$(($List$get$(($Run$party$(_run_0)), _i_0)), {$: "Member", "who": {$: "Naruto"}, "lvl": 1, "xp": 0, "hp": 0, "ck": 0, "sp": 0, "jlv": {$: "Nil"}, "weapon": 0, "ftier": 0, "tech": {$: "Nil"}});
}

function $bag_cash$(_run_0) {
  return $Bag$cash$(($Run$bag$(_run_0)));
}

function $with_cash$(_run_0, _w_0) {
  return $Run$with_bag$(_run_0, ($Bag$with_cash$(($Run$bag$(_run_0)), _w_0)));
}

function $odds_table$() {
  return {$: "Con", "head": {$: "Con", "head": 620, "tail": {$: "Con", "head": 280, "tail": {$: "Con", "head": 80, "tail": {$: "Con", "head": 18, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 0, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 450, "tail": {$: "Con", "head": 330, "tail": {$: "Con", "head": 160, "tail": {$: "Con", "head": 50, "tail": {$: "Con", "head": 9, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 300, "tail": {$: "Con", "head": 340, "tail": {$: "Con", "head": 230, "tail": {$: "Con", "head": 100, "tail": {$: "Con", "head": 25, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}}}}}, "tail": {$: "Con", "head": {$: "Con", "head": 180, "tail": {$: "Con", "head": 300, "tail": {$: "Con", "head": 280, "tail": {$: "Con", "head": 160, "tail": {$: "Con", "head": 60, "tail": {$: "Con", "head": 18, "tail": {$: "Con", "head": 2, "tail": {$: "Nil"}}}}}}}}, "tail": {$: "Nil"}}}}};
}

function $summon_level$(_pulls_0) {
  const _x_0 = (15 === 0 ? 0 : (_pulls_0 / 15) >>> 0);
  return $u32_min$(((_x_0 + 1) >>> 0), 10);
}

function $odds_band$(_lvl_0) {
  return $Bool$pick$((_lvl_0 <= 3), 0, ($Bool$pick$((_lvl_0 <= 6), 1, ($Bool$pick$((_lvl_0 <= 9), 2, 3)))));
}

function $summon_odds$(_lvl_0) {
  const _x_0 = ($odds_band$(_lvl_0));
  return $Maybe$default$(($List$get$(($odds_table$()), _x_0)), {$: "Con", "head": 1000, "tail": {$: "Nil"}});
}

function $pick_rarity$(_xs_0, _r_0, _acc_0, _i_0) {
  if (_xs_0.$ === "Nil") {
    return $sub0$(_i_0, 1);
  } else {
    const _x_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    const _x_1 = ((_acc_0 + _x_0) >>> 0);
    return $Bool$pick$((_r_0 < _x_1), _i_0, ($pick_rarity$(_t_0, _r_0, ((_acc_0 + _x_0) >>> 0), ((_i_0 + 1) >>> 0))));
  }
}

function $roll_rarity$(_pulls_0, _pity_0, _seed_0, _salt_0) {
  const _r_0 = ($pick_rarity$(($summon_odds$(($summon_level$(_pulls_0)))), ($roll$(_seed_0, _salt_0, 1000)), 0, 0));
  return $Bool$pick$((_pity_0 >= 49), ($u32_max$(_r_0, 3)), _r_0);
}

function $roll_tier$(_seed_0, _salt_0) {
  const _x_0 = ($roll$(_seed_0, _salt_0, 100));
  return $Bool$pick$((_x_0 < 40), 0, ($Bool$pick$((_x_0 < 70), 1, ($Bool$pick$((_x_0 < 90), 2, 3)))));
}

function $give_weapon$(_bag_0, _r_0, _t_0) {
  const _x_0 = (Math.imul(_r_0, 4) >>> 0);
  const _g_0 = ((_x_0 + _t_0) >>> 0);
  return $Bag$with_got$(($Bag$with_weps$(_bag_0, ($add_copy$(($Bag$weps$(_bag_0)), _g_0)))), ($snoc$(($Bag$got$(_bag_0)), _g_0)));
}

function $contract_rank$(_r_0) {
  return $Bool$pick$((_r_0 < 2), 0, ($u32_min$(($sub0$(_r_0, 1)), 3)));
}

function $give_contract$(_bag_0, _r_0, _sp_0) {
  const _x_0 = (Math.imul(_sp_0, 4) >>> 0);
  const _x_1 = ($contract_rank$(_r_0));
  const _i_0 = ((_x_0 + _x_1) >>> 0);
  return $Bag$with_got$(($Bag$with_smns$(_bag_0, ($add_copy$(($Bag$smns$(_bag_0)), _i_0)))), ($snoc$(($Bag$got$(_bag_0)), ((100 + _i_0) >>> 0))));
}

function $give_gear$(_bag_0, _r_0, _slot_0) {
  const _k_0 = ($kit_at$(($Bag$kit$(_bag_0)), _slot_0));
  const _x_0 = ($Kit$rar$(_k_0));
  const _x_1 = ($Kit$rar$(_k_0));
  const _x_2 = (_x_0 === 99);
  const _x_3 = (_r_0 > _x_1);
  const _better_0 = (_x_2 || _x_3);
  const _x_4 = (Math.imul(_slot_0, 10) >>> 0);
  const _x_5 = ((200 + _x_4) >>> 0);
  const _code_0 = ((_x_5 + _r_0) >>> 0);
  const _kit2_0 = ($List$set$(($Bag$kit$(_bag_0)), _slot_0, ($Kit$with_rar$(_k_0, _r_0))));
  const _x_6 = ((_r_0 + 1) >>> 0);
  const _cash2_0 = ($wallet_add$(($Bag$cash$(_bag_0)), 4, (Math.imul(_x_6, 3) >>> 0)));
  return $Bool$pick$(_better_0, ($Bag$with_got$(($Bag$with_kit$(_bag_0, _kit2_0)), ($snoc$(($Bag$got$(_bag_0)), _code_0)))), ($Bag$with_got$(($Bag$with_cash$(_bag_0, _cash2_0)), ($snoc$(($Bag$got$(_bag_0)), ((_code_0 + 1000) >>> 0))))));
}

function $pull_one$(_bag_0, _kind_0, _seed_0, _salt_0) {
  const _pulls_0 = ($at_u32$(($Bag$pulls$(_bag_0)), _kind_0));
  const _pity_0 = ($at_u32$(($Bag$pity$(_bag_0)), _kind_0));
  const _r_0 = ($roll_rarity$(_pulls_0, _pity_0, _seed_0, _salt_0));
  const _b1_0 = ($Bag$with_pity$(($Bag$with_pulls$(_bag_0, ($set_u32$(($Bag$pulls$(_bag_0)), _kind_0, ((_pulls_0 + 1) >>> 0))))), ($set_u32$(($Bag$pity$(_bag_0)), _kind_0, ($Bool$pick$((_r_0 >= 3), 0, ((_pity_0 + 1) >>> 0)))))));
  const _t_0 = ($roll_tier$(_seed_0, ((_salt_0 + 7) >>> 0)));
  const _sp_0 = ($roll$(_seed_0, ((_salt_0 + 11) >>> 0), 7));
  const _slot_0 = ($roll$(_seed_0, ((_salt_0 + 13) >>> 0), 6));
  return $Bool$pick$((_kind_0 === 0), ($give_weapon$(_b1_0, _r_0, _t_0)), ($Bool$pick$((_kind_0 === 1), ($give_contract$(_b1_0, _r_0, _sp_0)), ($give_gear$(_b1_0, _r_0, _slot_0)))));
}

function $pull_n$($0, $1, $2, $3, $4) {
  for (;;) {
    {
      const _n_0 = $0;
      const _bag_0 = $1;
      const _kind_0 = $2;
      const _seed_0 = $3;
      const _salt_0 = $4;
      if (_n_0 === 0) {
        return _bag_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($pull_one$(_bag_0, _kind_0, _seed_0, _salt_0));
        $2 = _kind_0;
        $3 = _seed_0;
        $4 = ((_salt_0 + 97) >>> 0);
        continue;
      }
    }
  }
}

function $do_pull$go$(_run_0, _kind_0, _n_0, _ok_0) {
  if (!_ok_0) {
    return $Run$with_msg$(_run_0, "Not enough summon scrolls.");
  } else {
    const _bag_0 = ($Run$bag$(_run_0));
    const _seed_0 = ($Run$seed$(_run_0));
    const _b1_0 = ($Bag$with_got$(($Bag$with_cash$(_bag_0, ($wallet_sub$(($Bag$cash$(_bag_0)), _kind_0, _n_0)))), {$: "Nil"}));
    return $Run$with_msg$(($Run$with_seed$(($Run$with_bag$(_run_0, ($pull_n$(_n_0, _b1_0, _kind_0, _seed_0, 1)))), ($mix$(((_seed_0 + 31) >>> 0))))), "The scrolls unroll...");
  }
}

function $do_pull$(_run_0, _kind_0, _n_0) {
  const _x_0 = ($wallet_get$(($bag_cash$(_run_0)), _kind_0));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$((_kind_0 < 3), ($Bool$and$(($gt0$(_n_0)), ($Bool$and$((_n_0 <= 10), (_x_0 >= _n_0)))))))));
  return $do_pull$go$(_run_0, _kind_0, _n_0, _ok_0);
}

function $equip$(_run_0, _i_0, _g_0) {
  const _own_0 = ($gt0$(($Owned$copies$(($owned_at$(($Bag$weps$(($Run$bag$(_run_0)))), _g_0))))));
  const _x_0 = ($len$(($Run$party$(_run_0))));
  const _x_1 = (_g_0 === 99);
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$((_i_0 < _x_0), (_x_1 || _own_0)))));
  const _m_0 = ($Member$with_weapon$(($member_at$(_run_0, _i_0)), ($Bool$pick$((_g_0 === 99), 0, ((_g_0 + 1) >>> 0)))));
  return $Bool$pick$(_ok_0, ($Run$with_party$(_run_0, ($List$set$(($Run$party$(_run_0)), _i_0, _m_0)))), _run_0);
}

function $enhance$(_run_0, _g_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _o_0 = ($owned_at$(($Bag$weps$(_bag_0)), _g_0));
  const _lvl_0 = ($Owned$lvl$(_o_0));
  const _cost_0 = ($weapon_cost$(_g_0, _lvl_0));
  const _x_0 = ($weapon_cap$(($Owned$awk$(_o_0))));
  const _x_1 = ($Wallet$whet$(($Bag$cash$(_bag_0))));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$(($gt0$(($Owned$copies$(_o_0)))), ($Bool$and$((_lvl_0 < _x_0), (_x_1 >= _cost_0)))))));
  const _bag2_0 = ($Bag$with_cash$(($Bag$with_weps$(_bag_0, ($set_owned$(($Bag$weps$(_bag_0)), _g_0, ($Owned$with_lvl$(_o_0, ((_lvl_0 + 1) >>> 0))))))), ($wallet_sub$(($Bag$cash$(_bag_0)), 3, _cost_0))));
  return $Bool$pick$(_ok_0, ($Run$with_bag$(_run_0, _bag2_0)), _run_0);
}

function $awaken$(_run_0, _g_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _o_0 = ($owned_at$(($Bag$weps$(_bag_0)), _g_0));
  const _x_0 = ($Owned$copies$(_o_0));
  const _x_1 = ($Owned$awk$(_o_0));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$((_x_0 >= 2), (_x_1 < 5)))));
  const _x_2 = ($Owned$copies$(_o_0));
  const _x_3 = ($Owned$awk$(_o_0));
  const _o2_0 = ($Owned$with_awk$(($Owned$with_copies$(_o_0, ((_x_2 - 1) >>> 0))), ((_x_3 + 1) >>> 0)));
  return $Bool$pick$(_ok_0, ($Run$with_bag$(_run_0, ($Bag$with_weps$(_bag_0, ($set_owned$(($Bag$weps$(_bag_0)), _g_0, _o2_0)))))), _run_0);
}

function $fuse$(_run_0, _g_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _o_0 = ($owned_at$(($Bag$weps$(_bag_0)), _g_0));
  const _x_0 = ($Owned$copies$(_o_0));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$((_x_0 >= 6), (_g_0 < 27)))));
  const _x_1 = ($Owned$copies$(_o_0));
  const _ws_0 = ($add_copy$(($set_owned$(($Bag$weps$(_bag_0)), _g_0, ($Owned$with_copies$(_o_0, ((_x_1 - 5) >>> 0))))), ((_g_0 + 1) >>> 0)));
  const _x_2 = ($weapon_name$(((_g_0 + 1) >>> 0)));
  const _x_3 = (_x_2 + "!");
  return $Bool$pick$(_ok_0, ($Run$with_msg$(($Run$with_bag$(_run_0, ($Bag$with_weps$(_bag_0, _ws_0)))), ("Fused into " + _x_3))), _run_0);
}

function $set_summon$(_run_0, _slot_0, _code_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _x_0 = (_code_0 === 0);
  const _x_1 = ($gt0$(($Owned$copies$(($owned_at$(($Bag$smns$(_bag_0)), ($sub0$(_code_0, 1))))))));
  const _own_0 = (_x_0 || _x_1);
  const _b1_0 = ($Bool$pick$((_slot_0 === 0), ($Bag$with_smain$(_bag_0, _code_0)), ($Bool$pick$((_slot_0 === 1), ($Bag$with_ssub1$(_bag_0, _code_0)), ($Bag$with_ssub2$(_bag_0, _code_0))))));
  return $Bool$pick$(($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$(_own_0, (_slot_0 < 3))))), ($Run$with_bag$(_run_0, _b1_0)), _run_0);
}

function $infuse_cost$(_k_0) {
  const _x_0 = ($Kit$stars$(_k_0));
  const _x_1 = ($Kit$rar$(_k_0));
  const _x_2 = (Math.imul(2, _x_1) >>> 0);
  const _x_3 = ((_x_0 + 1) >>> 0);
  const _x_4 = ((4 + _x_2) >>> 0);
  return (Math.imul(_x_3, _x_4) >>> 0);
}

function $infuse_odds$(_s_0) {
  return $u32_max$(($sub0$(950, (Math.imul(45, _s_0) >>> 0))), 300);
}

function $infuse$(_run_0, _slot_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _k_0 = ($kit_at$(($Bag$kit$(_bag_0)), _slot_0));
  const _s_0 = ($Kit$stars$(_k_0));
  const _cost_0 = ($infuse_cost$(_k_0));
  const _x_0 = ($Kit$rar$(_k_0));
  const _x_1 = ($Wallet$ore$(($Bag$cash$(_bag_0))));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$((_x_0 < 7), ($Bool$and$((_s_0 < 15), (_x_1 >= _cost_0)))))));
  const _seed_0 = ($Run$seed$(_run_0));
  const _x_2 = ($roll$(_seed_0, 5, 1000));
  const _x_3 = ($infuse_odds$(_s_0));
  const _win_0 = (_x_2 < _x_3);
  const _down_0 = ($Bool$and$(($Bool$not$(_win_0)), ($Bool$and$((_s_0 >= 10), ($chance$(_seed_0, 6, 40))))));
  const _ns_0 = ($Bool$pick$(_win_0, ((_s_0 + 1) >>> 0), ($Bool$pick$(_down_0, ($sub0$(_s_0, 1)), _s_0))));
  const _x_4 = ($U32$show$(_ns_0));
  const _x_5 = (_x_4 + " stars.");
  const _x_6 = ($slot_name$(_slot_0));
  const _x_7 = (" is now " + _x_5);
  const _x_8 = (_x_6 + _x_7);
  const _msg_0 = ($Bool$pick$(_win_0, ("Infusion succeeded! " + _x_8), ($Bool$pick$(_down_0, "Infusion failed: the gear lost a star.", "Infusion failed."))));
  const _kit2_0 = ($List$set$(($Bag$kit$(_bag_0)), _slot_0, ($Kit$with_stars$(_k_0, _ns_0))));
  const _run2_0 = ($Run$with_msg$(($Run$with_seed$(($Run$with_bag$(_run_0, ($Bag$with_cash$(($Bag$with_kit$(_bag_0, _kit2_0)), ($wallet_sub$(($Bag$cash$(_bag_0)), 4, _cost_0)))))), ($mix$(((_seed_0 + 57) >>> 0))))), _msg_0));
  return $Bool$pick$(_ok_0, _run2_0, _run_0);
}

function $gen_pool$() {
  return {$: "Con", "head": 0, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 3, "tail": {$: "Con", "head": 4, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 9, "tail": {$: "Con", "head": 10, "tail": {$: "Nil"}}}}}}}}}}};
}

function $slot_special$(_slot_0) {
  return $at_u32$({$: "Con", "head": 12, "tail": {$: "Con", "head": 11, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 11, "tail": {$: "Con", "head": 13, "tail": {$: "Nil"}}}}}}}, _slot_0);
}

function $roll_line$(_pool_0, _special_0, _grade_0, _seed_0, _salt_0) {
  const _stat_0 = ($Bool$pick$(($chance$(_seed_0, _salt_0, 30)), _special_0, ($at_u32$(_pool_0, ($roll$(_seed_0, ((_salt_0 + 1) >>> 0), ($len$(_pool_0))))))));
  return {$: "Line", "stat": _stat_0, "val": ($line_val$(_stat_0, _grade_0)), "grade": _grade_0};
}

function $roll_lines$(_n_0, _pool_0, _special_0, _grade_0, _seed_0, _salt_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": ($roll_line$(_pool_0, _special_0, _grade_0, _seed_0, _salt_0)), "tail": ($roll_lines$(_p_0, _pool_0, _special_0, _grade_0, _seed_0, ((_salt_0 + 19) >>> 0)))};
  }
}

function $ins_up$(_g_0) {
  return $at_u32$({$: "Con", "head": 150, "tail": {$: "Con", "head": 60, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 0, "tail": {$: "Nil"}}}}}}, _g_0);
}

function $inscribe$(_run_0, _slot_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _k_0 = ($kit_at$(($Bag$kit$(_bag_0)), _slot_0));
  const _g_0 = ($Kit$grade$(_k_0));
  const _cost_0 = ((1 + _g_0) >>> 0);
  const _x_0 = ($Kit$rar$(_k_0));
  const _x_1 = ($Kit$stars$(_k_0));
  const _x_2 = ($Wallet$seal$(($Bag$cash$(_bag_0))));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$((_x_0 < 7), ($Bool$and$((_x_1 >= 3), (_x_2 >= _cost_0)))))));
  const _seed_0 = ($Run$seed$(_run_0));
  const _x_3 = ($roll$(_seed_0, 8, 1000));
  const _x_4 = ($ins_up$(_g_0));
  const _up_0 = (_x_3 < _x_4);
  const _ng_0 = ($Bool$pick$(_up_0, ($u32_min$(((_g_0 + 1) >>> 0), 4)), _g_0));
  const _k2_0 = ($Kit$with_lines$(($Kit$with_grade$(_k_0, _ng_0)), ($roll_lines$(3, ($gen_pool$()), ($slot_special$(_slot_0)), _ng_0, _seed_0, 20))));
  const _kit2_0 = ($List$set$(($Bag$kit$(_bag_0)), _slot_0, _k2_0));
  const _x_5 = ($grade_name$(_ng_0));
  const _x_6 = (_x_5 + "!");
  const _msg_0 = ($Bool$pick$(_up_0, ("The seal glows: the inscriptions rose to " + _x_6), "New inscriptions."));
  const _run2_0 = ($Run$with_msg$(($Run$with_seed$(($Run$with_bag$(_run_0, ($Bag$with_cash$(($Bag$with_kit$(_bag_0, _kit2_0)), ($wallet_sub$(($Bag$cash$(_bag_0)), 5, _cost_0)))))), ($mix$(((_seed_0 + 61) >>> 0))))), _msg_0));
  return $Bool$pick$(_ok_0, _run2_0, _run_0);
}

function $will_up$(_run_0, _t_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _lvl_0 = ($at_u32$(($Bag$will$(_bag_0)), _t_0));
  const _cost_0 = ((_lvl_0 + 1) >>> 0);
  const _x_0 = ($Wallet$wp$(($Bag$cash$(_bag_0))));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), ($Bool$and$((_t_0 < 4), ($Bool$and$((_lvl_0 < 30), (_x_0 >= _cost_0)))))));
  const _bag2_0 = ($Bag$with_cash$(($Bag$with_will$(_bag_0, ($set_u32$(($Bag$will$(_bag_0)), _t_0, _cost_0)))), ($wallet_sub$(($Bag$cash$(_bag_0)), 6, _cost_0))));
  return $Bool$pick$(_ok_0, ($Run$with_bag$(_run_0, _bag2_0)), _run_0);
}

function $aff_grade$(_r_0) {
  return $Bool$pick$((_r_0 < 600), 0, ($Bool$pick$((_r_0 < 850), 1, ($Bool$pick$((_r_0 < 950), 2, ($Bool$pick$((_r_0 < 990), 3, 4)))))));
}

function $aff_line$(_seed_0, _salt_0) {
  const _grade_0 = ($aff_grade$(($roll$(_seed_0, _salt_0, 1000))));
  const _stat_0 = ($at_u32$({$: "Con", "head": 0, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 2, "tail": {$: "Con", "head": 3, "tail": {$: "Con", "head": 4, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 6, "tail": {$: "Con", "head": 7, "tail": {$: "Con", "head": 8, "tail": {$: "Con", "head": 9, "tail": {$: "Nil"}}}}}}}}}}}, ($roll$(_seed_0, ((_salt_0 + 1) >>> 0), 10))));
  return {$: "Line", "stat": _stat_0, "val": ($line_val$(_stat_0, _grade_0)), "grade": _grade_0};
}

function $attune$lines$(_ls_0, _lock_0, _i_0, _seed_0) {
  if (_ls_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _l_0 = _ls_0["head"];
    const _t_0 = _ls_0["tail"];
    const _x_0 = (Math.imul(_i_0, 17) >>> 0);
    return {$: "Con", "head": ($Bool$pick$((_i_0 === _lock_0), _l_0, ($aff_line$(_seed_0, ((_x_0 + 3) >>> 0))))), "tail": ($attune$lines$(_t_0, _lock_0, ((_i_0 + 1) >>> 0), _seed_0))};
  }
}

function $attune$(_run_0, _lock_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _x_0 = ($Bool$pick$((_lock_0 < 3), 2, 0));
  const _cost_0 = ((3 + _x_0) >>> 0);
  const _x_1 = ($Wallet$ap$(($Bag$cash$(_bag_0))));
  const _ok_0 = ($Bool$and$(($mode_free$(($Run$mode$(_run_0)))), (_x_1 >= _cost_0)));
  const _seed_0 = ($Run$seed$(_run_0));
  const _bag2_0 = ($Bag$with_cash$(($Bag$with_aff$(_bag_0, ($attune$lines$(($Bag$aff$(_bag_0)), _lock_0, 0, _seed_0)))), ($wallet_sub$(($Bag$cash$(_bag_0)), 7, _cost_0))));
  return $Bool$pick$(_ok_0, ($Run$with_seed$(($Run$with_bag$(_run_0, _bag2_0)), ($mix$(((_seed_0 + 67) >>> 0))))), _run_0);
}

function $card_name$(_k_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Weapon Scrolls", "tail": {$: "Con", "head": "Contract Scrolls", "tail": {$: "Con", "head": "Gear Scrolls", "tail": {$: "Con", "head": "Whetstones", "tail": {$: "Con", "head": "Chakra Ore", "tail": {$: "Con", "head": "Seal Paper", "tail": {$: "Con", "head": "Will of Fire", "tail": {$: "Con", "head": "Affinity Points", "tail": {$: "Nil"}}}}}}}}}, _k_0)), "?");
}

function $card_amount$(_c_0) {
  const _x_0 = ($Card$lvl$(_c_0));
  const _x_1 = ($at_u32$({$: "Con", "head": 5, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 5, "tail": {$: "Con", "head": 60, "tail": {$: "Con", "head": 20, "tail": {$: "Con", "head": 4, "tail": {$: "Con", "head": 1, "tail": {$: "Con", "head": 1, "tail": {$: "Nil"}}}}}}}}}, ($Card$kind$(_c_0))));
  const _x_2 = ((2 + _x_0) >>> 0);
  const _x_3 = (Math.imul(_x_1, _x_2) >>> 0);
  return (2 === 0 ? 0 : (_x_3 / 2) >>> 0);
}

function $bump_cards$(_cs_0, _i_0, _j_0, _fresh_0) {
  if (_cs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _c_0 = _cs_0["head"];
    const _t_0 = _cs_0["tail"];
    const _x_0 = ($Card$lvl$(_c_0));
    return {$: "Con", "head": ($Bool$pick$((_i_0 === _j_0), _fresh_0, ($Card$with_lvl$(_c_0, ($u32_min$(((_x_0 + 1) >>> 0), 5)))))), "tail": ($bump_cards$(_t_0, _i_0, ((_j_0 + 1) >>> 0), _fresh_0))};
  }
}

function $pick_card$(_run_0, _i_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _c_0 = ($Maybe$default$(($List$get$(($Bag$cards$(_bag_0)), _i_0)), {$: "Card", "kind": 0, "lvl": 0}));
  const _amt_0 = ($card_amount$(_c_0));
  const _x_0 = ($Bag$logp$(_bag_0));
  const _ok_0 = ($Bool$and$((_x_0 >= 5), (_i_0 < 4)));
  const _seed_0 = ($Run$seed$(_run_0));
  const _fresh_0 = {$: "Card", "kind": ($roll$(_seed_0, 41, 8)), "lvl": 0};
  const _bag2_0 = ($Bag$with_logp$(($Bag$with_cards$(($Bag$with_cash$(_bag_0, ($wallet_add$(($Bag$cash$(_bag_0)), ($Card$kind$(_c_0)), _amt_0)))), ($bump_cards$(($Bag$cards$(_bag_0)), _i_0, 0, _fresh_0)))), ($sub0$(($Bag$logp$(_bag_0)), 5))));
  const _x_1 = ($card_name$(($Card$kind$(_c_0))));
  const _x_2 = (_x_1 + ".");
  const _x_3 = ($U32$show$(_amt_0));
  const _x_4 = (" " + _x_2);
  const _x_5 = (_x_3 + _x_4);
  const _msg_0 = ("Mission Log: +" + _x_5);
  return $Bool$pick$(_ok_0, ($Run$with_msg$(($Run$with_seed$(($Run$with_bag$(_run_0, _bag2_0)), ($mix$(((_seed_0 + 71) >>> 0))))), _msg_0)), _run_0);
}

function $ground_name$(_k_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Whetstone Grounds", "tail": {$: "Con", "head": "Scroll Archive", "tail": {$: "Con", "head": "Chakra Ore Mine", "tail": {$: "Con", "head": "Seal Library", "tail": {$: "Con", "head": "Will of Fire Shrine", "tail": {$: "Nil"}}}}}}, _k_0)), "?");
}

function $ground$(_run_0, _k_0) {
  const _x_0 = ($Run$ryo$(_run_0));
  const _ok_0 = ($Bool$and$(($in_village$(($Run$mode$(_run_0)))), ($Bool$and$((_k_0 < 5), (_x_0 >= 50)))));
  const _th_0 = ($threat$(_run_0));
  const _x_1 = (4 === 0 ? 0 : (_th_0 / 4) >>> 0);
  const _s_0 = ($Bool$pick$((_k_0 === 1), ((1 + _x_1) >>> 0), 0));
  const _x_2 = (Math.imul(10, _th_0) >>> 0);
  const _w1_0 = ($wallet_add$(($bag_cash$(_run_0)), 3, ($Bool$pick$((_k_0 === 0), ((40 + _x_2) >>> 0), 0))));
  const _w2_0 = ($wallet_add$(($wallet_add$(($wallet_add$(_w1_0, 0, _s_0)), 1, _s_0)), 2, _s_0));
  const _x_3 = (Math.imul(3, _th_0) >>> 0);
  const _w3_0 = ($wallet_add$(_w2_0, 4, ($Bool$pick$((_k_0 === 2), ((12 + _x_3) >>> 0), 0))));
  const _x_4 = (3 === 0 ? 0 : (_th_0 / 3) >>> 0);
  const _w4_0 = ($wallet_add$(_w3_0, 5, ($Bool$pick$((_k_0 === 3), ((3 + _x_4) >>> 0), 0))));
  const _x_5 = (2 === 0 ? 0 : (_th_0 / 2) >>> 0);
  const _w5_0 = ($wallet_add$(($wallet_add$(_w4_0, 6, ($Bool$pick$((_k_0 === 4), ((3 + _x_5) >>> 0), 0)))), 7, ($Bool$pick$((_k_0 === 4), 2, 0))));
  const _run1_0 = ($Run$with_ryo$(($with_cash$(_run_0, _w5_0)), ($sub0$(($Run$ryo$(_run_0)), 50))));
  const _x_6 = ($ground_name$(_k_0));
  const _x_7 = (_x_6 + " (50 ryo).");
  return $Bool$pick$(_ok_0, ($Run$with_msg$(_run1_0, ("A session at the " + _x_7))), _run_0);
}

function $trig_ok$(_tr_0, _run_0, _m_0) {
  if (_tr_0.$ === "TJutsu") {
    const _slot_0 = _tr_0["slot"];
    const _lvl_0 = _tr_0["lvl"];
    const _x_0 = ($at_u32$(($Member$jlv$(_m_0)), _slot_0));
    return (_x_0 >= _lvl_0);
  } else if (_tr_0.$ === "TEvent") {
    const _c_0 = ($cell_at$(($Run$map$(_run_0)), ($Run$pos$(_run_0))));
    const _x_1 = ($Cell$kind$(_c_0));
    const _x_2 = ($Cell$arg$(_c_0));
    const _x_3 = ($who_id$(($Member$who$(_m_0))));
    return $Bool$and$((_x_1 === 7), (_x_2 === _x_3));
  } else {
    const _a_0 = _tr_0["art"];
    return $has_art$(($Run$arts$(_run_0)), _a_0);
  }
}

function $form_next$(_run_0, _m_0) {
  const _x_0 = ($Member$ftier$(_m_0));
  const _t_0 = ((_x_0 + 1) >>> 0);
  const _fi_0 = ($form_info$(($Member$who$(_m_0)), _t_0));
  const _x_1 = ($sealed_count$(_run_0));
  const _x_2 = ($FormInfo$gate$(_fi_0));
  const _ok_0 = ($Bool$and$((_t_0 <= 3), ($Bool$and$((_x_1 >= _x_2), ($trig_ok$(($FormInfo$trig$(_fi_0)), _run_0, _m_0))))));
  return $Bool$pick$(_ok_0, ($Member$with_ftier$(_m_0, _t_0)), _m_0);
}

function $forms_all$(_ms_0, _run_0) {
  if (_ms_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    return {$: "Con", "head": ($form_next$(_run_0, ($form_next$(_run_0, _m_0)))), "tail": ($forms_all$(_t_0, _run_0))};
  }
}

function $form_news$(_old_0, _new_0) {
  if (_old_0.$ === "Nil") {
    return "";
  } else {
    const _a_0 = _old_0["head"];
    const _at_0 = _old_0["tail"];
    if (_new_0.$ === "Nil") {
      return "";
    } else {
      const _b_0 = _new_0["head"];
      const _bt_0 = _new_0["tail"];
      const _x_0 = ($Member$ftier$(_b_0));
      const _x_1 = ($Member$ftier$(_a_0));
      const _x_2 = ($FormInfo$name$(($form_info$(($Member$who$(_b_0)), ($Member$ftier$(_b_0))))));
      const _x_3 = (_x_2 + "!");
      const _x_4 = ($who_name$(($Member$who$(_b_0))));
      const _x_5 = (" awakened " + _x_3);
      return $Bool$pick$((_x_0 > _x_1), (_x_4 + _x_5), ($form_news$(_at_0, _bt_0)));
    }
  }
}

function $check_forms$(_run_0) {
  const _ms_0 = ($forms_all$(($Run$party$(_run_0)), _run_0));
  const _news_0 = ($form_news$(($Run$party$(_run_0)), _ms_0));
  return $Bool$pick$(($String$is_empty$(_news_0)), _run_0, ($Run$with_msg$(($Run$with_party$(_run_0, _ms_0)), _news_0)));
}

function $scroll_name$(_k_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Weapon Scrolls", "tail": {$: "Con", "head": "Contract Scrolls", "tail": {$: "Con", "head": "Gear Scrolls", "tail": {$: "Nil"}}}}, _k_0)), "Scrolls");
}

function $teach$(_run_0, _who_0, _slot_0, _k_0) {
  const _m_0 = ($member_at$(_run_0, _who_0));
  const _x_0 = ($len$(($Run$party$(_run_0))));
  const _x_1 = ($gen_count$());
  const _ok_0 = ($Bool$and$((_who_0 < _x_0), ($Bool$and$((_slot_0 < 4), (_k_0 < _x_1)))));
  const _m2_0 = ($Member$with_jlv$(($Member$with_tech$(_m_0, ($set_u32$(($Member$tech$(_m_0)), _slot_0, ((_k_0 + 1) >>> 0))))), ($set_u32$(($Member$jlv$(_m_0)), _slot_0, 1))));
  const _x_2 = ($MoveInfo$name$(($move_info$(($gen_move$(_k_0))))));
  const _x_3 = (_x_2 + "!");
  const _x_4 = ($who_name$(($Member$who$(_m_0))));
  const _x_5 = (" learned " + _x_3);
  const _msg_0 = (_x_4 + _x_5);
  return $Bool$pick$(_ok_0, ($Run$with_msg$(($Run$with_party$(_run_0, ($List$set$(($Run$party$(_run_0)), _who_0, _m2_0)))), _msg_0)), _run_0);
}

function $train_slot$(_run_0, _who_0, _slot_0, _n_0) {
  const _m_0 = ($member_at$(_run_0, _who_0));
  const _lv_0 = ($at_u32$(($Member$jlv$(_m_0)), _slot_0));
  const _m2_0 = ($Member$with_jlv$(_m_0, ($set_u32$(($Member$jlv$(_m_0)), _slot_0, ($u32_min$(((_lv_0 + _n_0) >>> 0), 10))))));
  const _name_0 = ($MoveInfo$name$(($move_info$(($Learn$move$(($Maybe$default$(($List$get$(($member_kit$(_m_0)), _slot_0)), {$: "Learn", "move": {$: "Strike"}, "lvl": 1}))))))));
  const _x_0 = ($U32$show$(($u32_min$(((_lv_0 + _n_0) >>> 0), 10))));
  const _x_1 = (_x_0 + ".");
  const _x_2 = (" is now level " + _x_1);
  const _msg_0 = (_name_0 + _x_2);
  const _x_3 = ($len$(($Run$party$(_run_0))));
  return $Bool$pick$(($Bool$and$((_slot_0 < 4), (_who_0 < _x_3))), ($Run$with_msg$(($Run$with_party$(_run_0, ($List$set$(($Run$party$(_run_0)), _who_0, _m2_0)))), _msg_0)), _run_0);
}

function $will_pick$(_run_0, _t_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _lvl_0 = ($at_u32$(($Bag$will$(_bag_0)), _t_0));
  return $Run$with_msg$(($Run$with_bag$(_run_0, ($Bag$with_will$(_bag_0, ($set_u32$(($Bag$will$(_bag_0)), _t_0, ($u32_min$(((_lvl_0 + 1) >>> 0), 30)))))))), "The Will of Fire grows.");
}

function $line_key$(_l_0) {
  const _x_0 = ($Line$stat$(_l_0));
  const _x_1 = ($Line$grade$(_l_0));
  return $Bool$pick$((_x_0 === 99), 0, ((_x_1 + 1) >>> 0));
}

function $weakest_line$(_ls_0, _i_0, _best_0, _bk_0) {
  if (_ls_0.$ === "Nil") {
    return _best_0;
  } else {
    const _l_0 = _ls_0["head"];
    const _t_0 = _ls_0["tail"];
    const _k_0 = ($line_key$(_l_0));
    return $Bool$pick$((_k_0 < _bk_0), ($weakest_line$(_t_0, ((_i_0 + 1) >>> 0), _i_0, _k_0)), ($weakest_line$(_t_0, ((_i_0 + 1) >>> 0), _best_0, _bk_0)));
  }
}

function $aff_set$(_run_0, _l_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _i_0 = ($weakest_line$(($Bag$aff$(_bag_0)), 0, 0, 99));
  return $Run$with_msg$(($Run$with_bag$(_run_0, ($Bag$with_aff$(_bag_0, ($List$set$(($Bag$aff$(_bag_0)), _i_0, _l_0)))))), "Chakra Affinity attuned.");
}

function $tech_slot$(_ts_0, _code_0, _i_0) {
  if (_ts_0.$ === "Nil") {
    return 99;
  } else {
    const _x_0 = _ts_0["head"];
    const _t_0 = _ts_0["tail"];
    return $Bool$pick$((_x_0 === _code_0), _i_0, ($tech_slot$(_t_0, _code_0, ((_i_0 + 1) >>> 0))));
  }
}

function $knower$(_ms_0, _code_0, _i_0) {
  if (_ms_0.$ === "Nil") {
    return 999;
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    const _sl_0 = ($tech_slot$(($Member$tech$(_m_0)), _code_0, 0));
    const _x_0 = (Math.imul(_i_0, 10) >>> 0);
    return $Bool$pick$((_sl_0 < 99), ((_x_0 + _sl_0) >>> 0), ($knower$(_t_0, _code_0, ((_i_0 + 1) >>> 0))));
  }
}

function $learn$go$(_known_0, _run_0, _kn_0, _who_0, _slot_0, _k_0) {
  if (_known_0) {
    return $train_slot$(_run_0, (10 === 0 ? 0 : (_kn_0 / 10) >>> 0), (10 === 0 ? _kn_0 : _kn_0 % 10), 2);
  } else {
    return $teach$(_run_0, _who_0, _slot_0, _k_0);
  }
}

function $learn_or_level$(_run_0, _who_0, _slot_0, _k_0) {
  const _kn_0 = ($knower$(($Run$party$(_run_0)), ((_k_0 + 1) >>> 0), 0));
  return $learn$go$((_kn_0 < 999), _run_0, _kn_0, _who_0, _slot_0, _k_0);
}

function $claim$(_l_0, _run_0, _opt_0, _who_0, _slot_0) {
  if (_l_0.$ === "LScroll") {
    const _k_0 = _l_0["kind"];
    const _n_0 = _l_0["n"];
    const _bag_0 = ($Bag$with_got$(($Run$bag$(_run_0)), {$: "Nil"}));
    const _seed_0 = ($Run$seed$(_run_0));
    const _x_0 = ($scroll_name$(_k_0));
    const _x_1 = (_x_0 + "!");
    const _x_2 = ($U32$show$(_n_0));
    const _x_3 = (" " + _x_1);
    const _x_4 = (_x_2 + _x_3);
    return $Run$with_msg$(($Run$with_seed$(($Run$with_bag$(_run_0, ($pull_n$(_n_0, _bag_0, _k_0, _seed_0, 1)))), ($mix$(((_seed_0 + 31) >>> 0))))), ("Summoned with " + _x_4));
  } else if (_l_0.$ === "LJutsu") {
    const _opts_0 = _l_0["opts"];
    return $learn_or_level$(_run_0, _who_0, _slot_0, ($at_u32$(_opts_0, _opt_0)));
  } else if (_l_0.$ === "LRelic") {
    const _opts_1 = _l_0["opts"];
    const _a_0 = ($Maybe$default$(($List$get$(_opts_1, _opt_0)), {$: "HokageHat"}));
    const _x_5 = ($art_name$(_a_0));
    const _x_6 = (_x_5 + "!");
    return $Run$with_msg$(($Run$with_arts$(_run_0, ($snoc$(($Run$arts$(_run_0)), _a_0)))), ("Obtained " + _x_6));
  } else if (_l_0.$ === "LWill") {
    const _opts_2 = _l_0["opts"];
    return $will_pick$(_run_0, ($at_u32$(_opts_2, _opt_0)));
  } else if (_l_0.$ === "LAff") {
    const _opts_3 = _l_0["opts"];
    return $aff_set$(_run_0, ($Maybe$default$(($List$get$(_opts_3, _opt_0)), {$: "Line", "stat": 99, "val": 0, "grade": 0})));
  } else if (_l_0.$ === "LTrain") {
    const _w_0 = _l_0["who"];
    const _n_1 = _l_0["n"];
    return $train_slot$(_run_0, _w_0, _slot_0, _n_1);
  } else {
    return $pick_card$(_run_0, _opt_0);
  }
}

function $drop_loot$(_xs_0, _i_0) {
  const _x_0 = ((_i_0 + 1) >>> 0);
  return $List$append$(($List$take$(_xs_0, _i_0)), ($List$drop$(_xs_0, _x_0)));
}

function $loot_claim$(_m_0, _run_0, _i_0, _opt_0, _who_0, _slot_0) {
  if (_m_0.$ === "InLoot") {
    const _items_0 = _m_0["items"];
    const _text_0 = _m_0["text"];
    const _l_0 = ($Maybe$default$(($List$get$(_items_0, _i_0)), {$: "LLog"}));
    const _run2_0 = ($claim$(_l_0, ($Run$with_mode$(_run_0, {$: "InLoot", "items": ($drop_loot$(_items_0, _i_0)), "text": _text_0})), _opt_0, _who_0, _slot_0));
    const _x_0 = ($len$(_items_0));
    return $Bool$pick$((_i_0 < _x_0), _run2_0, _run_0);
  } else {
    return _run_0;
  }
}

function $loot_skip$(_m_0, _run_0, _i_0) {
  if (_m_0.$ === "InLoot") {
    const _items_0 = _m_0["items"];
    const _text_0 = _m_0["text"];
    const _l_0 = ($Maybe$default$(($List$get$(_items_0, _i_0)), {$: "LLog"}));
    const _x_0 = ($len$(_items_0));
    return $Bool$pick$(($Bool$and$((_i_0 < _x_0), ($Bool$not$(($loot_must$(_l_0)))))), ($Run$with_mode$(_run_0, {$: "InLoot", "items": ($drop_loot$(_items_0, _i_0)), "text": _text_0})), _run_0);
  } else {
    return _run_0;
  }
}

function $loot_leave$(_m_0, _run_0) {
  if (_m_0.$ === "InLoot") {
    const _items_0 = _m_0["items"];
    return $Bool$pick$(($any_must$(_items_0)), _run_0, ($Run$with_mode$(_run_0, {$: "OnMap"})));
  } else {
    return _run_0;
  }
}

function $scroll_items$(_w_0) {
  const _a_0 = ($Bool$pick$(($gt0$(($Wallet$wsc$(_w_0)))), {$: "Con", "head": {$: "LScroll", "kind": 0, "n": ($Wallet$wsc$(_w_0))}, "tail": {$: "Nil"}}, {$: "Nil"}));
  const _b_0 = ($Bool$pick$(($gt0$(($Wallet$csc$(_w_0)))), {$: "Con", "head": {$: "LScroll", "kind": 1, "n": ($Wallet$csc$(_w_0))}, "tail": {$: "Nil"}}, {$: "Nil"}));
  const _c_0 = ($Bool$pick$(($gt0$(($Wallet$gsc$(_w_0)))), {$: "Con", "head": {$: "LScroll", "kind": 2, "n": ($Wallet$gsc$(_w_0))}, "tail": {$: "Nil"}}, {$: "Nil"}));
  return $List$append$(_a_0, ($List$append$(_b_0, _c_0)));
}

function $will_items$(_n_0, _seed_0, _salt_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": {$: "LWill", "opts": ($will_offer$(_seed_0, _salt_0))}, "tail": ($will_items$(_p_0, _seed_0, ((_salt_0 + 5) >>> 0)))};
  }
}

function $aff_items$(_n_0, _seed_0, _salt_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": {$: "LAff", "opts": {$: "Con", "head": ($aff_line$(_seed_0, _salt_0)), "tail": {$: "Con", "head": ($aff_line$(_seed_0, ((_salt_0 + 11) >>> 0))), "tail": {$: "Con", "head": ($aff_line$(_seed_0, ((_salt_0 + 23) >>> 0))), "tail": {$: "Nil"}}}}}, "tail": ($aff_items$(_p_0, _seed_0, ((_salt_0 + 37) >>> 0)))};
  }
}

function $in_loot$(_m_0) {
  if (_m_0.$ === "InLoot") {
    return true;
  } else {
    return false;
  }
}

function $settle$loot$(_m_0, _run_0, _new_0) {
  if (_m_0.$ === "InLoot") {
    const _items_0 = _m_0["items"];
    const _text_0 = _m_0["text"];
    return $Run$with_mode$(_run_0, {$: "InLoot", "items": ($List$append$(_new_0, _items_0)), "text": _text_0});
  } else {
    return $loot$(_run_0, _new_0, ($Run$msg$(_run_0)));
  }
}

function $settle$(_run_0) {
  const _x_0 = ($on_map$(($Run$mode$(_run_0))));
  const _x_1 = ($in_loot$(($Run$mode$(_run_0))));
  const _ok_0 = (_x_0 || _x_1);
  const _w_0 = ($bag_cash$(_run_0));
  const _seed_0 = ($Run$seed$(_run_0));
  const _x_2 = ($u32_min$(($Wallet$wp$(_w_0)), 5));
  const _x_3 = ($u32_min$(($Wallet$ap$(_w_0)), 3));
  const _new_0 = ($List$append$(($will_items$(_x_2, _seed_0, 301)), ($aff_items$(_x_3, _seed_0, 401))));
  const _w2_0 = ($Wallet$with_ap$(($Wallet$with_wp$(_w_0, 0)), 0));
  const _run2_0 = ($Run$with_seed$(($settle$loot$(($Run$mode$(_run_0)), ($with_cash$(_run_0, _w2_0)), _new_0)), ($mix$(((_seed_0 + 503) >>> 0)))));
  return $Bool$pick$(($Bool$and$(_ok_0, ($gt0$(($len$(_new_0)))))), _run2_0, _run_0);
}

function $best_grade$($0, $1, $2) {
  for (;;) {
    {
      const _ws_0 = $0;
      const _i_0 = $1;
      const _best_0 = $2;
      if (_ws_0.$ === "Nil") {
        return _best_0;
      } else {
        const _o_0 = _ws_0["head"];
        const _t_0 = _ws_0["tail"];
        $0 = _t_0;
        $1 = ((_i_0 + 1) >>> 0);
        $2 = ($Bool$pick$(($gt0$(($Owned$copies$(_o_0)))), _i_0, _best_0));
        continue;
      }
    }
  }
}

function $fuse_n$($0, $1, $2) {
  for (;;) {
    {
      const _n_0 = $0;
      const _run_0 = $1;
      const _g_0 = $2;
      if (_n_0 === 0) {
        return _run_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($fuse$(_run_0, _g_0));
        $2 = _g_0;
        continue;
      }
    }
  }
}

function $fuse_all$($0, $1, $2) {
  for (;;) {
    {
      const _n_0 = $0;
      const _run_0 = $1;
      const _g_0 = $2;
      if (_n_0 === 0) {
        return _run_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($fuse_n$(4, _run_0, _g_0));
        $2 = ((_g_0 + 1) >>> 0);
        continue;
      }
    }
  }
}

function $awaken_n$($0, $1, $2) {
  for (;;) {
    {
      const _n_0 = $0;
      const _run_0 = $1;
      const _g_0 = $2;
      if (_n_0 === 0) {
        return _run_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($awaken$(_run_0, _g_0));
        $2 = _g_0;
        continue;
      }
    }
  }
}

function $enhance_n$($0, $1, $2) {
  for (;;) {
    {
      const _n_0 = $0;
      const _run_0 = $1;
      const _g_0 = $2;
      if (_n_0 === 0) {
        return _run_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($enhance$(_run_0, _g_0));
        $2 = _g_0;
        continue;
      }
    }
  }
}

function $equip_all$($0, $1, $2, $3) {
  for (;;) {
    {
      const _n_0 = $0;
      const _run_0 = $1;
      const _i_0 = $2;
      const _g_0 = $3;
      if (_n_0 === 0) {
        return _run_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($equip$(_run_0, _i_0, _g_0));
        $2 = ((_i_0 + 1) >>> 0);
        $3 = _g_0;
        continue;
      }
    }
  }
}

function $best_smn$($0, $1, $2, $3, $4, $5, $6) {
  for (;;) {
    {
      const _n_0 = $0;
      const _bag_0 = $1;
      const _c_0 = $2;
      const _best_0 = $3;
      const _bp_0 = $4;
      const _ex1_0 = $5;
      const _ex2_0 = $6;
      if (_n_0 === 0) {
        return _best_0;
      } else {
        const _p_0 = (_n_0 - 1);
        const _own_0 = ($gt0$(($Owned$copies$(($owned_at$(($Bag$smns$(_bag_0)), ($sub0$(_c_0, 1))))))));
        const _pw_0 = ($summon_power$(($Bag$with_smain$(_bag_0, _c_0))));
        const _ok_0 = ($Bool$and$(_own_0, ($Bool$and$(($Bool$not$((_c_0 === _ex1_0))), ($Bool$not$((_c_0 === _ex2_0)))))));
        const _better_0 = ($Bool$and$(_ok_0, (_pw_0 > _bp_0)));
        $0 = _p_0;
        $1 = _bag_0;
        $2 = ((_c_0 + 1) >>> 0);
        $3 = ($Bool$pick$(_better_0, _c_0, _best_0));
        $4 = ($Bool$pick$(_better_0, _pw_0, _bp_0));
        $5 = _ex1_0;
        $6 = _ex2_0;
        continue;
      }
    }
  }
}

function $auto_summons$(_run_0) {
  const _bag_0 = ($Run$bag$(_run_0));
  const _s1_0 = ($best_smn$(28, _bag_0, 1, 0, 0, 999, 999));
  const _s2_0 = ($best_smn$(28, _bag_0, 1, 0, 0, _s1_0, 999));
  const _s3_0 = ($best_smn$(28, _bag_0, 1, 0, 0, _s1_0, _s2_0));
  return $set_summon$(($set_summon$(($set_summon$(_run_0, 0, _s1_0)), 1, _s2_0)), 2, _s3_0);
}

function $infuse_safe$(_run_0, _slot_0) {
  const _x_0 = ($Kit$stars$(($kit_at$(($Bag$kit$(($Run$bag$(_run_0)))), _slot_0))));
  return $Bool$pick$((_x_0 < 10), ($infuse$(_run_0, _slot_0)), _run_0);
}

function $infuse_n$($0, $1, $2) {
  for (;;) {
    {
      const _n_0 = $0;
      const _run_0 = $1;
      const _slot_0 = $2;
      if (_n_0 === 0) {
        return _run_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($infuse_safe$(_run_0, _slot_0));
        $2 = _slot_0;
        continue;
      }
    }
  }
}

function $inscribe_first$(_run_0, _slot_0) {
  const _k_0 = ($kit_at$(($Bag$kit$(($Run$bag$(_run_0)))), _slot_0));
  const _x_0 = ($Kit$stars$(_k_0));
  const _x_1 = ($len$(($Kit$lines$(_k_0))));
  return $Bool$pick$(($Bool$and$((_x_0 >= 3), (_x_1 === 0))), ($inscribe$(_run_0, _slot_0)), _run_0);
}

function $gear_all$($0, $1, $2) {
  for (;;) {
    {
      const _n_0 = $0;
      const _run_0 = $1;
      const _slot_0 = $2;
      if (_n_0 === 0) {
        return _run_0;
      } else {
        const _p_0 = (_n_0 - 1);
        $0 = _p_0;
        $1 = ($inscribe_first$(($infuse_n$(12, _run_0, _slot_0)), _slot_0));
        $2 = ((_slot_0 + 1) >>> 0);
        continue;
      }
    }
  }
}

function $scrolls$go$(_any_0, _run_0, _bag_0, _seed_0) {
  if (_any_0) {
    return $Run$with_seed$(($Run$with_bag$(_run_0, _bag_0)), ($mix$(((_seed_0 + 29) >>> 0))));
  } else {
    return _run_0;
  }
}

function $open_scrolls$(_run_0) {
  const _w_0 = ($bag_cash$(_run_0));
  const _seed_0 = ($Run$seed$(_run_0));
  const _b0_0 = ($Bag$with_got$(($Run$bag$(_run_0)), {$: "Nil"}));
  const _x_0 = ($Wallet$gsc$(_w_0));
  const _x_1 = ($Wallet$csc$(_w_0));
  const _x_2 = ($Wallet$wsc$(_w_0));
  const _b3_0 = ($pull_n$(_x_0, ($pull_n$(_x_1, ($pull_n$(_x_2, _b0_0, 0, _seed_0, 1)), 1, _seed_0, 3001)), 2, _seed_0, 6001));
  const _w3_0 = ($Bag$cash$(_b3_0));
  const _b4_0 = ($Bag$with_cash$(_b3_0, ($Wallet$with_gsc$(($Wallet$with_csc$(($Wallet$with_wsc$(_w3_0, 0)), 0)), 0))));
  const _x_3 = ($Wallet$csc$(_w_0));
  const _x_4 = ($Wallet$gsc$(_w_0));
  const _x_5 = ($Wallet$wsc$(_w_0));
  const _x_6 = ((_x_3 + _x_4) >>> 0);
  return $scrolls$go$(($gt0$(((_x_5 + _x_6) >>> 0))), _run_0, _b4_0, _seed_0);
}

function $best_card$($0, $1, $2, $3) {
  for (;;) {
    {
      const _cs_0 = $0;
      const _i_0 = $1;
      const _best_0 = $2;
      const _bl_0 = $3;
      if (_cs_0.$ === "Nil") {
        return _best_0;
      } else {
        const _c_0 = _cs_0["head"];
        const _t_0 = _cs_0["tail"];
        const _x_0 = ($Card$lvl$(_c_0));
        const _better_0 = (_x_0 > _bl_0);
        $0 = _t_0;
        $1 = ((_i_0 + 1) >>> 0);
        $2 = ($Bool$pick$(_better_0, _i_0, _best_0));
        $3 = ($Bool$pick$(_better_0, ($Card$lvl$(_c_0)), _bl_0));
        continue;
      }
    }
  }
}

function $auto_log$(_run_0) {
  const _cs_0 = ($Bag$cards$(($Run$bag$(_run_0))));
  return $pick_card$(_run_0, ($best_card$(_cs_0, 0, 0, 0)));
}

function $auto_core$(_run_0) {
  const _r1_0 = ($fuse_all$(27, ($open_scrolls$(($auto_log$(_run_0)))), 0));
  const _g_0 = ($best_grade$(($Bag$weps$(($Run$bag$(_r1_0)))), 0, 0));
  const _r2_0 = ($enhance_n$(80, ($awaken_n$(5, _r1_0, _g_0)), _g_0));
  const _x_0 = ($len$(($Run$party$(_r2_0))));
  const _r3_0 = ($equip_all$(_x_0, _r2_0, 0, _g_0));
  return $gear_all$(6, ($auto_summons$(_r3_0)), 0);
}

function $auto$go$(_m_0, _run_0) {
  if (_m_0.$ === "InBattle") {
    return _run_0;
  } else if (_m_0.$ === "GameOver") {
    return _run_0;
  } else if (_m_0.$ === "Victory") {
    return _run_0;
  } else {
    const _msg_0 = ($Run$msg$(_run_0));
    return $Run$with_msg$(($Run$with_mode$(($auto_core$(($Run$with_mode$(_run_0, {$: "OnMap"})))), ($Run$mode$(_run_0)))), _msg_0);
  }
}

function $auto_kit$(_run_0) {
  return $auto$go$(($Run$mode$(_run_0)), _run_0);
}

function $shop_stock$(_run_0) {
  const _seed_0 = ($Run$seed$(_run_0));
  return {$: "InVillage", "jut": {$: "Con", "head": ($gen_in_band$(0, _seed_0, 801)), "tail": {$: "Con", "head": ($gen_in_band$(1, _seed_0, 803)), "tail": {$: "Con", "head": ($gen_in_band$(2, _seed_0, 805)), "tail": {$: "Nil"}}}}, "arts": ($take_rand$(2, ($under_cap$(($all_arts$()), ($Run$arts$(_run_0)))), _seed_0, 807))};
}

function $relic_price$(_run_0) {
  const _x_0 = ($Run$act$(_run_0));
  const _x_1 = (Math.imul(40, _x_0) >>> 0);
  return ((140 + _x_1) >>> 0);
}

function $v_jutsu$(_m_0, _run_0, _i_0, _who_0, _slot_0) {
  if (_m_0.$ === "InVillage") {
    const _jut_0 = _m_0["jut"];
    const _arts_0 = _m_0["arts"];
    const _k_0 = ($at_u32$(_jut_0, _i_0));
    const _price_0 = ($gen_price$(_k_0));
    const _x_0 = ($gen_count$());
    const _x_1 = ($Run$ryo$(_run_0));
    const _x_2 = ($len$(($Run$party$(_run_0))));
    const _ok_0 = ($Bool$and$((_k_0 < _x_0), ($Bool$and$((_x_1 >= _price_0), ($Bool$and$((_who_0 < _x_2), (_slot_0 < 4)))))));
    const _run2_0 = ($learn_or_level$(($Run$with_mode$(($Run$with_ryo$(_run_0, ($sub0$(($Run$ryo$(_run_0)), _price_0)))), {$: "InVillage", "jut": ($set_u32$(_jut_0, _i_0, 999)), "arts": _arts_0})), _who_0, _slot_0, _k_0));
    return $Bool$pick$(_ok_0, _run2_0, _run_0);
  } else {
    return _run_0;
  }
}

function $v_art$(_m_0, _run_0, _i_0) {
  if (_m_0.$ === "InVillage") {
    const _jut_0 = _m_0["jut"];
    const _arts_0 = _m_0["arts"];
    const _price_0 = ($relic_price$(_run_0));
    const _a_0 = ($Maybe$default$(($List$get$(_arts_0, _i_0)), {$: "HokageHat"}));
    const _x_0 = ($len$(_arts_0));
    const _x_1 = ($Run$ryo$(_run_0));
    const _ok_0 = ($Bool$and$((_i_0 < _x_0), (_x_1 >= _price_0)));
    const _x_2 = ((_i_0 + 1) >>> 0);
    const _rest_0 = ($List$append$(($List$take$(_arts_0, _i_0)), ($List$drop$(_arts_0, _x_2))));
    const _x_3 = ($art_name$(_a_0));
    const _x_4 = (_x_3 + ".");
    const _run2_0 = ($Run$with_msg$(($Run$with_arts$(($Run$with_mode$(($Run$with_ryo$(_run_0, ($sub0$(($Run$ryo$(_run_0)), _price_0)))), {$: "InVillage", "jut": _jut_0, "arts": _rest_0})), ($snoc$(($Run$arts$(_run_0)), _a_0)))), ("Bought " + _x_4)));
    return $Bool$pick$(_ok_0, _run2_0, _run_0);
  } else {
    return _run_0;
  }
}

function $rest_train$(_m_0, _run_0, _who_0, _slot_0) {
  if (_m_0.$ === "InRest") {
    return $Run$with_mode$(($train_slot$(_run_0, _who_0, _slot_0, 2)), {$: "OnMap"});
  } else {
    return _run_0;
  }
}

function $node_k$(_k_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": {$: "KNone"}, "tail": {$: "Con", "head": {$: "KMission"}, "tail": {$: "Con", "head": {$: "KElite"}, "tail": {$: "Con", "head": {$: "KEvent"}, "tail": {$: "Con", "head": {$: "KRest"}, "tail": {$: "Con", "head": {$: "KShop"}, "tail": {$: "Con", "head": {$: "KTreasure"}, "tail": {$: "Con", "head": {$: "KStory"}, "tail": {$: "Con", "head": {$: "KBoss"}, "tail": {$: "Nil"}}}}}}}}}}, _k_0)), {$: "KNone"});
}

function $village_name$(_act_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Tazuna's Village", "tail": {$: "Con", "head": "Amegakure Market", "tail": {$: "Con", "head": "Konohagakure", "tail": {$: "Nil"}}}}, _act_0)), "Village");
}

function $ev_count$() {
  return 24;
}

function $ev_fresh$(_n_0, _met_0, _i_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    const _x_0 = ($U32$show$(_i_0));
    return $keep_idx$(_i_0, ($Bool$not$(($has_name$(_met_0, ("ev" + _x_0))))), ($ev_fresh$(_p_0, _met_0, ((_i_0 + 1) >>> 0))));
  }
}

function $pick_event$(_run_0) {
  const _fresh_0 = ($ev_fresh$(24, ($Run$met$(_run_0)), 0));
  const _n_0 = ($len$(_fresh_0));
  return $Bool$pick$(($gt0$(_n_0)), ($at_u32$(_fresh_0, ($roll$(($Run$seed$(_run_0)), 91, ($u32_max$(_n_0, 1)))))), ($roll$(($Run$seed$(_run_0)), 93, ($ev_count$()))));
}

function $arrive$go$(_k_0, _run_0, _c_0) {
  if (_k_0.$ === "KMission") {
    return $mission_battle$(_run_0, 0, "Mission!");
  } else if (_k_0.$ === "KElite") {
    return $elite_battle$(_run_0);
  } else if (_k_0.$ === "KEvent") {
    const _id_0 = ($pick_event$(_run_0));
    const _x_0 = ($U32$show$(_id_0));
    return $Run$with_met$(($Run$with_mode$(_run_0, {$: "InEvent", "id": _id_0})), {$: "Con", "head": ("ev" + _x_0), "tail": ($Run$met$(_run_0))});
  } else if (_k_0.$ === "KRest") {
    return $Run$with_msg$(($Run$with_mode$(_run_0, {$: "InRest"})), "A hot spring. The squad can take one break here.");
  } else if (_k_0.$ === "KShop") {
    const _x_1 = ($village_name$(($Run$act$(_run_0))));
    const _x_2 = (_x_1 + ".");
    return $Run$with_msg$(($Run$with_mode$(_run_0, ($shop_stock$(_run_0)))), ("Welcome to " + _x_2));
  } else if (_k_0.$ === "KTreasure") {
    return $offer$(($with_cash$(_run_0, ($wallet_add$(($wallet_add$(($bag_cash$(_run_0)), 0, 2)), 2, 2)))), "A hidden cache: +2 Weapon and +2 Gear Scrolls, and a relic.");
  } else if (_k_0.$ === "KStory") {
    return $to_map$(_run_0, "A place from the past...");
  } else if (_k_0.$ === "KBoss") {
    const _t_0 = ($Cell$arg$(_c_0));
    const _x_3 = ($beast_title$(_t_0));
    return $start_battle$(($Run$with_msg$(_run_0, (_x_3 + " rises!"))), ($act_foes$({$: "Con", "head": ($beast_fighter$(_t_0)), "tail": {$: "Nil"}}, ($Run$act$(_run_0)), true)), _t_0, 9);
  } else {
    return _run_0;
  }
}

function $travel$(_run_0, _n_0) {
  const _ok_0 = ($Bool$and$(($on_map$(($Run$mode$(_run_0)))), ($has_u32$(($next_cells$(_run_0)), _n_0))));
  const _x_0 = ($Run$day$(_run_0));
  const _run1_0 = ($Run$with_day$(($Run$with_pos$(_run_0, _n_0)), ((_x_0 + 1) >>> 0)));
  const _c_0 = ($cell_at$(($Run$map$(_run_0)), _n_0));
  return $Bool$pick$(_ok_0, ($arrive$go$(($node_k$(($Cell$kind$(_c_0)))), _run1_0, _c_0)), _run_0);
}

function $ev_kind$(_id_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": {$: "EArmory"}, "tail": {$: "Con", "head": {$: "EShrine"}, "tail": {$: "Con", "head": {$: "EMerchant"}, "tail": {$: "Con", "head": {$: "ECache"}, "tail": {$: "Con", "head": {$: "EInjured"}, "tail": {$: "Con", "head": {$: "EScroll"}, "tail": {$: "Con", "head": {$: "EGamble"}, "tail": {$: "Con", "head": {$: "EAmbush"}, "tail": {$: "Con", "head": {$: "ETraining"}, "tail": {$: "Con", "head": {$: "ERamen"}, "tail": {$: "Con", "head": {$: "EMyoboku"}, "tail": {$: "Con", "head": {$: "EOroLab"}, "tail": {$: "Con", "head": {$: "EZetsuDeal"}, "tail": {$: "Con", "head": {$: "EWrittenTest"}, "tail": {$: "Con", "head": {$: "EGuyChallenge"}, "tail": {$: "Con", "head": {$: "ETazuna"}, "tail": {$: "Con", "head": {$: "EKurama"}, "tail": {$: "Con", "head": {$: "EChiyo"}, "tail": {$: "Con", "head": {$: "EAkaRing"}, "tail": {$: "Con", "head": {$: "EHokageRock"}, "tail": {$: "Con", "head": {$: "ELibrary"}, "tail": {$: "Con", "head": {$: "EShizune"}, "tail": {$: "Con", "head": {$: "EHiruzen"}, "tail": {$: "Con", "head": {$: "EJiraiya"}, "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}, _id_0)), {$: "EShrine"});
}

function $event_title$(_id_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Abandoned Armory", "tail": {$: "Con", "head": "Shrine of the Sage", "tail": {$: "Con", "head": "Wandering Merchant", "tail": {$: "Con", "head": "Buried Cache", "tail": {$: "Con", "head": "Injured Shinobi", "tail": {$: "Con", "head": "Mysterious Scroll", "tail": {$: "Con", "head": "Tsunade's Gambling Den", "tail": {$: "Con", "head": "Rogue Ambush", "tail": {$: "Con", "head": "Training Post", "tail": {$: "Con", "head": "Ichiraku on the Road", "tail": {$: "Con", "head": "Mount Myoboku", "tail": {$: "Con", "head": "Orochimaru's Hideout", "tail": {$: "Con", "head": "A Face in the Tree", "tail": {$: "Con", "head": "Chunin Exam: Written Test", "tail": {$: "Con", "head": "Might Guy's Challenge", "tail": {$: "Con", "head": "The Great Naruto Bridge", "tail": {$: "Con", "head": "A Voice in the Seal", "tail": {$: "Con", "head": "Chiyo's Workshop", "tail": {$: "Con", "head": "A Ring in the Ashes", "tail": {$: "Con", "head": "The Hokage Monument", "tail": {$: "Con", "head": "The Konoha Archive", "tail": {$: "Con", "head": "Tsunade's Debts", "tail": {$: "Con", "head": "The Professor's Grave", "tail": {$: "Con", "head": "Research at the Hot Springs", "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}, _id_0)), "?");
}

function $event_text$(_id_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": "Weapon racks stand in a ruined outpost. It is very quiet.", "tail": {$: "Con", "head": "Moss-covered toad statues guard a mountain shrine.", "tail": {$: "Con", "head": "A peddler with a huge backpack waves you over.", "tail": {$: "Con", "head": "A half-buried strongbox, sealed with a faded tag.", "tail": {$: "Con", "head": "A wounded Leaf genin lies by the road, out of supplies.", "tail": {$: "Con", "head": "A scroll covered in strange seals, still warm to the touch.", "tail": {$: "Con", "head": "A smoky den. Someone at the dice table looks a lot like Tsunade.", "tail": {$: "Con", "head": "Rogue ninja drop from the trees. Their leader smirks.", "tail": {$: "Con", "head": "A clearing with practice posts and target logs.", "tail": {$: "Con", "head": "Teuchi's travelling ramen cart! The smell is incredible.", "tail": {$: "Con", "head": "Fukasaku, the toad sage, offers to teach you the sage arts. The training is brutal. The bug stew is worse.", "tail": {$: "Con", "head": "An abandoned lab under the Land of Rice Fields. Something still pulses in a jar marked 'Heaven'.", "tail": {$: "Con", "head": "White Zetsu grins out of a tree trunk. 'The Akatsuki pays well for information. Or for trinkets...'", "tail": {$: "Con", "head": "Ibiki Morino hands out an impossible test. Cheating is allowed, as long as you are not caught.", "tail": {$: "Con", "head": "'My eternal rival's students! A youthful challenge!' Might Guy strikes his nice-guy pose.", "tail": {$: "Con", "head": "Tazuna's bridge is almost done, but Gato's hired swords are coming back to stop it.", "tail": {$: "Con", "head": "Red chakra seeps from somewhere deep. 'Let me out... and I will lend you my power.'", "tail": {$: "Con", "head": "Granny Chiyo of the Sand tinkers with puppets and poisons. 'Kids these days...'", "tail": {$: "Con", "head": "A burned cloak with red clouds, and a ring still on one finger. Someone will come looking for it.", "tail": {$: "Con", "head": "The stone faces of the Hokage watch over the land. The wind is strong up here.", "tail": {$: "Con", "head": "Dusty shelves of jutsu scrolls. A sign on one door says RESTRICTED, in Danzo's handwriting.", "tail": {$: "Con", "head": "Shizune chases a pig in a pearl necklace. 'Lady Tsunade owes money to the whole town...'", "tail": {$: "Con", "head": "Hiruzen Sarutobi's grave. Someone left his pipe on the stone.", "tail": {$: "Con", "head": "Jiraiya peeks through a fence at the women's bath, giggling. 'Shh! It's research!'", "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}, _id_0)), "");
}

function $event_choices$(_id_0) {
  return $Maybe$default$(($List$get$({$: "Con", "head": {$: "Con", "head": "Search the racks (+3 Weapon Scrolls, may be a trap)", "tail": {$: "Con", "head": "Leave", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Pray (a Will of Fire blessing)", "tail": {$: "Con", "head": "Meditate (a new Chakra Affinity)", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Revival Scroll (60 ryo)", "tail": {$: "Con", "head": "Two Soldier Pills (40 ryo)", "tail": {$: "Con", "head": "Leave", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Break the seal (ryo and scrolls, may be trapped)", "tail": {$: "Con", "head": "Leave it", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Give a Medicine (a Will of Fire blessing)", "tail": {$: "Con", "head": "Walk on", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Read it (each ninja trains, or a curse)", "tail": {$: "Con", "head": "Burn it (+3 Seal Paper)", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Bet 50 ryo (45%: win 150)", "tail": {$: "Con", "head": "Leave", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Fight (tougher mission, better spoils)", "tail": {$: "Con", "head": "Smoke bomb out (uses one, or drops 40 ryo)", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Spar (XP for the squad)", "tail": {$: "Con", "head": "Drill (+60 Whetstones)", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Eat (25 ryo: heal 40%)", "tail": {$: "Con", "head": "Leave", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Sage training (each ninja trains a jutsu +2, lose 25% HP)", "tail": {$: "Con", "head": "Toad oil and bug stew (heal 50%)", "tail": {$: "Con", "head": "Politely leave", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Take the research (Cursed Seal of Heaven, lose 30% HP)", "tail": {$: "Con", "head": "Burn it all (a Will of Fire blessing)", "tail": {$: "Con", "head": "Leave quietly", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Trade 80 ryo for an Akatsuki trinket (a relic)", "tail": {$: "Con", "head": "Attack it (a tougher fight)", "tail": {$: "Con", "head": "Ignore it", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Answer honestly (50%: +4 Gear Scrolls, else -30 ryo)", "tail": {$: "Con", "head": "Cheat with eye jutsu (Sasuke, Kakashi or Hinata: +4 of each scroll)", "tail": {$: "Con", "head": "Stay for the tenth question (a Will of Fire blessing)", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Race him around Konoha (Lee always wins; else 40%)", "tail": {$: "Con", "head": "Rock-paper-scissors (33%: Leg Weights)", "tail": {$: "Con", "head": "Decline (Guy weeps manly tears)", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Help build it (+100 ryo, lose 10% HP)", "tail": {$: "Con", "head": "Guard the workers (an elite fight)", "tail": {$: "Con", "head": "Move on", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Take the power (each ninja trains a jutsu +2, lose 35% HP)", "tail": {$: "Con", "head": "Refuse it (a Will of Fire blessing)", "tail": {$: "Con", "head": "Naruto: talk to it (an Affinity, heal 30%)", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Buy a puppet blade (80 ryo: +5 Weapon Scrolls)", "tail": {$: "Con", "head": "Learn her antidotes (+2 Antidote, +1 Medicine)", "tail": {$: "Con", "head": "Ask about Sasori (+3 Seal Paper)", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Take the ring (Akatsuki Ring; its owner may come back)", "tail": {$: "Con", "head": "Bury the body (a Will of Fire blessing)", "tail": {$: "Con", "head": "Leave it", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Pray to the First and Second (a Will of Fire blessing)", "tail": {$: "Con", "head": "Climb for the hidden cache (60%: +4 Contract Scrolls, else -20% HP)", "tail": {$: "Con", "head": "Rest in their shadow (heal 25%)", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Study a scroll (choose a jutsu)", "tail": {$: "Con", "head": "Sneak into the restricted section (40%: a rare jutsu, else -40 ryo)", "tail": {$: "Con", "head": "Borrow seal paper (+4 Seal Paper)", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Pay one of her debts (70 ryo: a relic)", "tail": {$: "Con", "head": "Help catch Tonton (+50 ryo)", "tail": {$: "Con", "head": "Leave her to it", "tail": {$: "Nil"}}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Take the pipe (Hiruzen's Pipe)", "tail": {$: "Con", "head": "Pay your respects (heal 30%, a Will of Fire blessing)", "tail": {$: "Nil"}}}, "tail": {$: "Con", "head": {$: "Con", "head": "Help his research (Icha Icha Paradise, -40 ryo in fines)", "tail": {$: "Con", "head": "Report him (+60 ryo reward)", "tail": {$: "Con", "head": "Ask him for training (a ninja trains a jutsu +3)", "tail": {$: "Nil"}}}}, "tail": {$: "Nil"}}}}}}}}}}}}}}}}}}}}}}}}}, _id_0)), {$: "Con", "head": "Leave", "tail": {$: "Nil"}});
}

function $hurt_members$(_ms_0, _p_0, _bon_0) {
  if (_ms_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    const _hp_0 = ($u32_max$(($sub0$(($Member$hp$(_m_0)), ($pct$(($Stats$hp$(($member_stats$(_m_0, _bon_0)))), _p_0)))), 1));
    return {$: "Con", "head": ($Member$with_hp$(_m_0, _hp_0)), "tail": ($hurt_members$(_t_0, _p_0, _bon_0))};
  }
}

function $hurt_party$(_run_0, _p_0) {
  return $Run$with_party$(_run_0, ($hurt_members$(($Run$party$(_run_0)), _p_0, ($run_bonus$(_run_0)))));
}

function $sp_members$(_ms_0, _n_0) {
  if (_ms_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _m_0 = _ms_0["head"];
    const _t_0 = _ms_0["tail"];
    const _x_0 = ($Member$sp$(_m_0));
    return {$: "Con", "head": ($Member$with_sp$(_m_0, ((_x_0 + _n_0) >>> 0))), "tail": ($sp_members$(_t_0, _n_0))};
  }
}

function $add_cash$(_run_0, _k_0, _a_0) {
  return $with_cash$(_run_0, ($wallet_add$(($bag_cash$(_run_0)), _k_0, _a_0)));
}

function $fight_or$go$(_run_0, _fight_0, _text_0, _ok_0) {
  if (_fight_0) {
    return $mission_battle$(_run_0, 1, _text_0);
  } else {
    return $to_map$(_run_0, _ok_0);
  }
}

function $give_art$(_run_0, _a_0) {
  return $Run$with_arts$(_run_0, ($snoc$(($Run$arts$(_run_0)), _a_0)));
}

function $ev_resolve$(_k_0, _run_0, _c_0, _seed_0) {
  if (_k_0.$ === "EMyoboku") {
    return $Bool$pick$((_c_0 === 0), ($loot$(($hurt_party$(_run_0, 25)), {$: "Con", "head": {$: "LTrain", "who": 0, "n": 2}, "tail": {$: "Con", "head": {$: "LTrain", "who": 1, "n": 2}, "tail": {$: "Con", "head": {$: "LTrain", "who": 2, "n": 2}, "tail": {$: "Nil"}}}}, "Sage training! It hurts. Each ninja trains a jutsu.")), ($Bool$pick$((_c_0 === 1), ($to_map$(($heal_party$(_run_0, 50)), "Toad oil and bug stew. Surprisingly restorative.")), ($to_map$(_run_0, "Fukasaku waves goodbye with his tongue.")))));
  } else if (_k_0.$ === "EOroLab") {
    return $Bool$pick$((_c_0 === 0), ($to_map$(($give_art$(($hurt_party$(_run_0, 30)), {$: "CursedSeal"})), "The mark burns into your skin. Power... at a price.")), ($Bool$pick$((_c_0 === 1), ($to_map$(($add_cash$(_run_0, 6, 1)), "The lab burns. The Will of Fire burns brighter.")), ($to_map$(_run_0, "You leave the jar where it is.")))));
  } else if (_k_0.$ === "EZetsuDeal") {
    const _r_0 = ($Run$ryo$(_run_0));
    const _deal_0 = ($loot$(($Run$with_ryo$(_run_0, ($sub0$(_r_0, 80)))), ($relic_loot$(_run_0)), "'Pleasure doing business.' Zetsu sinks back into the bark."));
    const _fight_0 = ($mission_battle$(_run_0, 2, "White Zetsu splits into many!"));
    return $Bool$pick$((_c_0 === 0), ($Bool$pick$((_r_0 >= 80), _deal_0, ($to_map$(_run_0, "'No ryo? No deal.'")))), ($Bool$pick$((_c_0 === 1), _fight_0, ($to_map$(_run_0, "You walk on. The tree keeps smiling.")))));
  } else if (_k_0.$ === "EWrittenTest") {
    const _x_0 = ($in_party$(($Run$party$(_run_0)), {$: "Kakashi"}));
    const _x_1 = ($in_party$(($Run$party$(_run_0)), {$: "Hinata"}));
    const _x_2 = ($in_party$(($Run$party$(_run_0)), {$: "Sasuke"}));
    const _x_3 = (_x_0 || _x_1);
    const _eyes_0 = (_x_2 || _x_3);
    const _honest_0 = ($Bool$pick$(($chance$(_seed_0, 11, 50)), ($to_map$(($add_cash$(_run_0, 2, 4)), "Full marks! +4 Gear Scrolls.")), ($to_map$(($Run$with_ryo$(_run_0, ($sub0$(($Run$ryo$(_run_0)), 30)))), "Wrong answers. The exam fee is lost: -30 ryo."))));
    const _cheat_0 = ($Bool$pick$(_eyes_0, ($to_map$(($add_cash$(($add_cash$(($add_cash$(_run_0, 0, 4)), 1, 4)), 2, 4)), "Perfect copy. Ibiki pretends not to notice. +4 of each scroll.")), ($to_map$(($Run$with_ryo$(_run_0, ($sub0$(($Run$ryo$(_run_0)), 40)))), "Caught! Thrown out of the exam: -40 ryo."))));
    return $Bool$pick$((_c_0 === 0), _honest_0, ($Bool$pick$((_c_0 === 1), _cheat_0, ($to_map$(($add_cash$(_run_0, 6, 1)), "'Then you all pass.' The tenth question was your resolve.")))));
  } else if (_k_0.$ === "EGuyChallenge") {
    const _lee_0 = ($in_party$(($Run$party$(_run_0)), {$: "Lee"}));
    const _win_0 = ($to_map$(($add_cash$(($add_cash$(_run_0, 6, 1)), 0, 3)), "Victory! Guy salutes your youth: a Will of Fire blessing, +3 Weapon Scrolls."));
    const _lose_0 = ($to_map$(($hurt_party$(_run_0, 15)), "Guy wins. Five hundred laps of penalty later: -15% HP."));
    const _x_4 = ($chance$(_seed_0, 12, 40));
    const _race_0 = ($Bool$pick$((_lee_0 || _x_4), _win_0, _lose_0));
    const _rps_0 = ($Bool$pick$(($chance$(_seed_0, 13, 33)), ($to_map$(($give_art$(_run_0, {$: "LegWeights"})), "Rock beats scissors! Guy hands over his Leg Weights.")), ($to_map$(_run_0, "Guy wins and demands a rematch. Some other time."))));
    return $Bool$pick$((_c_0 === 0), _race_0, ($Bool$pick$((_c_0 === 1), _rps_0, ($to_map$(_run_0, "Guy weeps manly tears and runs off.")))));
  } else if (_k_0.$ === "ETazuna") {
    const _x_5 = ($Run$ryo$(_run_0));
    return $Bool$pick$((_c_0 === 0), ($to_map$(($hurt_party$(($Run$with_ryo$(_run_0, ((_x_5 + 100) >>> 0))), 10)), "The bridge is finished. Tazuna pays 100 ryo and names it after you.")), ($Bool$pick$((_c_0 === 1), ($elite_battle$(_run_0)), ($to_map$(_run_0, "You move on.")))));
  } else if (_k_0.$ === "EKurama") {
    const _naruto_0 = ($in_party$(($Run$party$(_run_0)), {$: "Naruto"}));
    const _talk_0 = ($Bool$pick$(_naruto_0, ($to_map$(($heal_party$(($add_cash$(_run_0, 7, 1)), 30)), "The fox laughs at you. Then it listens. A new Chakra Affinity.")), ($to_map$(_run_0, "Nobody here can answer it. The voice fades."))));
    return $Bool$pick$((_c_0 === 0), ($loot$(($hurt_party$(_run_0, 35)), {$: "Con", "head": {$: "LTrain", "who": 0, "n": 2}, "tail": {$: "Con", "head": {$: "LTrain", "who": 1, "n": 2}, "tail": {$: "Con", "head": {$: "LTrain", "who": 2, "n": 2}, "tail": {$: "Nil"}}}}, "The red chakra floods in. It burns, but the jutsu come faster.")), ($Bool$pick$((_c_0 === 1), ($to_map$(($add_cash$(_run_0, 6, 1)), "You refuse. The Will of Fire answers instead.")), _talk_0)));
  } else if (_k_0.$ === "EChiyo") {
    const _r_1 = ($Run$ryo$(_run_0));
    const _blade_0 = ($Bool$pick$((_r_1 >= 80), ($to_map$(($add_cash$(($Run$with_ryo$(_run_0, ($sub0$(_r_1, 80)))), 0, 5)), "A poisoned puppet blade. +5 Weapon Scrolls.")), ($to_map$(_run_0, "'No money, no blade.'"))));
    return $Bool$pick$((_c_0 === 0), _blade_0, ($Bool$pick$((_c_0 === 1), ($to_map$(($Run$with_tools$(_run_0, ($List$append$(($Run$tools$(_run_0)), {$: "Con", "head": {$: "Antidote"}, "tail": {$: "Con", "head": {$: "Antidote"}, "tail": {$: "Con", "head": {$: "Medicine"}, "tail": {$: "Nil"}}}})))), "Chiyo shares her antidotes: +2 Antidote, +1 Medicine.")), ($to_map$(($add_cash$(_run_0, 5, 3)), "'My grandson... Sasori.' She gives you old seal paper: +3.")))));
  } else if (_k_0.$ === "EAkaRing") {
    const _ring_0 = ($give_art$(_run_0, {$: "AkatsukiRing"}));
    const _back_0 = ($Bool$pick$(($chance$(_seed_0, 14, 50)), ($mission_battle$(_ring_0, 2, "The ring's owner's partner wants it back!")), ($to_map$(_ring_0, "You slip the ring into your pouch. Nobody follows... yet."))));
    return $Bool$pick$((_c_0 === 0), _back_0, ($Bool$pick$((_c_0 === 1), ($to_map$(($add_cash$(_run_0, 6, 1)), "You bury the body. Even an enemy deserves that.")), ($to_map$(_run_0, "You leave it.")))));
  } else if (_k_0.$ === "EHokageRock") {
    const _climb_0 = ($Bool$pick$(($chance$(_seed_0, 15, 60)), ($to_map$(($add_cash$(_run_0, 1, 4)), "A cache behind the Fourth's hair! +4 Contract Scrolls.")), ($to_map$(($hurt_party$(_run_0, 20)), "You slip off the Third's nose: -20% HP."))));
    return $Bool$pick$((_c_0 === 0), ($to_map$(($add_cash$(_run_0, 6, 1)), "The First and Second Hokage watch over you.")), ($Bool$pick$((_c_0 === 1), _climb_0, ($to_map$(($heal_party$(_run_0, 25)), "A quiet rest in the shadow of the Hokage.")))));
  } else if (_k_0.$ === "ELibrary") {
    const _sneak_0 = ($Bool$pick$(($chance$(_seed_0, 16, 40)), ($loot$(_run_0, {$: "Con", "head": {$: "LJutsu", "opts": ($gen_offer$(100, _seed_0, 73))}, "tail": {$: "Nil"}}, "Forbidden scrolls! Choose one.")), ($to_map$(($Run$with_ryo$(_run_0, ($sub0$(($Run$ryo$(_run_0)), 40)))), "Root agents catch you. A 40 ryo 'fine'."))));
    return $Bool$pick$((_c_0 === 0), ($loot$(_run_0, {$: "Con", "head": {$: "LJutsu", "opts": ($gen_offer$(10, _seed_0, 71))}, "tail": {$: "Nil"}}, "Choose a scroll to study.")), ($Bool$pick$((_c_0 === 1), _sneak_0, ($to_map$(($add_cash$(_run_0, 5, 4)), "+4 Seal Paper.")))));
  } else if (_k_0.$ === "EShizune") {
    const _r_2 = ($Run$ryo$(_run_0));
    const _pay_0 = ($Bool$pick$((_r_2 >= 70), ($loot$(($Run$with_ryo$(_run_0, ($sub0$(_r_2, 70)))), ($relic_loot$(_run_0)), "Shizune bows and gives you something Tsunade 'won't miss'.")), ($to_map$(_run_0, "Not enough ryo for any of those debts."))));
    return $Bool$pick$((_c_0 === 0), _pay_0, ($Bool$pick$((_c_0 === 1), ($to_map$(($Run$with_ryo$(_run_0, ((_r_2 + 50) >>> 0))), "Tonton caught! Shizune pays 50 ryo.")), ($to_map$(_run_0, "You leave her to it.")))));
  } else if (_k_0.$ === "EHiruzen") {
    return $Bool$pick$((_c_0 === 0), ($to_map$(($give_art$(_run_0, {$: "HiruzenPipe"})), "His grandson would want you to have it.")), ($to_map$(($heal_party$(($add_cash$(_run_0, 6, 1)), 30)), "You pay your respects. The Will of Fire lives on.")));
  } else if (_k_0.$ === "EJiraiya") {
    const _r_3 = ($Run$ryo$(_run_0));
    const _who_0 = ($roll$(_seed_0, 17, 3));
    return $Bool$pick$((_c_0 === 0), ($to_map$(($give_art$(($Run$with_ryo$(_run_0, ($sub0$(_r_3, 40)))), {$: "IchaIcha"})), "The women catch you both. Fines: -40 ryo. Jiraiya gives you a signed copy.")), ($Bool$pick$((_c_0 === 1), ($to_map$(($Run$with_ryo$(_run_0, ((_r_3 + 60) >>> 0))), "The bath house pays 60 ryo. Jiraiya sulks.")), ($loot$(_run_0, {$: "Con", "head": {$: "LTrain", "who": _who_0, "n": 3}, "tail": {$: "Nil"}}, "'Fine, fine. One of you, come here.'")))));
  } else if (_k_0.$ === "EArmory") {
    return $Bool$pick$((_c_0 === 0), ($fight_or$go$(($add_cash$(_run_0, 0, 3)), ($chance$(_seed_0, 3, 35)), "+3 Weapon Scrolls... but it was bait. Ambush!", "+3 Weapon Scrolls.")), ($to_map$(_run_0, "You leave the armory alone.")));
  } else if (_k_0.$ === "EShrine") {
    return $Bool$pick$((_c_0 === 0), ($to_map$(($add_cash$(_run_0, 6, 1)), "The toads approve: a Will of Fire blessing.")), ($to_map$(($add_cash$(_run_0, 7, 1)), "Natural energy flows: a new Chakra Affinity.")));
  } else if (_k_0.$ === "EMerchant") {
    const _r_4 = ($Run$ryo$(_run_0));
    const _a_0 = ($Bool$and$((_c_0 === 0), (_r_4 >= 60)));
    const _b_0 = ($Bool$and$((_c_0 === 1), (_r_4 >= 40)));
    const _ra_0 = ($to_map$(($Run$with_tools$(($Run$with_ryo$(_run_0, ($sub0$(_r_4, 60)))), ($snoc$(($Run$tools$(_run_0)), {$: "RevivalScroll"})))), "Bought a Revival Scroll."));
    const _rb_0 = ($to_map$(($Run$with_tools$(($Run$with_ryo$(_run_0, ($sub0$(_r_4, 40)))), ($List$append$(($Run$tools$(_run_0)), {$: "Con", "head": {$: "SoldierPill"}, "tail": {$: "Con", "head": {$: "SoldierPill"}, "tail": {$: "Nil"}}})))), "Bought two Soldier Pills."));
    return $Bool$pick$(_a_0, _ra_0, ($Bool$pick$(_b_0, _rb_0, ($to_map$(_run_0, ($Bool$pick$((_c_0 < 2), "Not enough ryo.", "Maybe next time.")))))));
  } else if (_k_0.$ === "ECache") {
    const _x_6 = ($roll$(_seed_0, 4, 61));
    const _gain_0 = ((60 + _x_6) >>> 0);
    const _x_7 = ($Run$ryo$(_run_0));
    const _x_8 = ($U32$show$(_gain_0));
    const _x_9 = (_x_8 + " ryo and a scroll of each kind!");
    const _good_0 = ($to_map$(($add_cash$(($add_cash$(($add_cash$(($Run$with_ryo$(_run_0, ((_x_7 + _gain_0) >>> 0))), 0, 1)), 1, 1)), 2, 1)), ("+" + _x_9)));
    const _trap_0 = ($to_map$(($hurt_party$(_run_0, 15)), "An explosive tag! The squad loses 15% HP."));
    return $Bool$pick$((_c_0 === 0), ($Bool$pick$(($chance$(_seed_0, 5, 70)), _good_0, _trap_0)), ($to_map$(_run_0, "Some seals are best left alone.")));
  } else if (_k_0.$ === "EInjured") {
    const _has_0 = ($has_tool$(($Run$tools$(_run_0)), {$: "Medicine"}));
    const _helped_0 = ($to_map$(($Run$with_tools$(($add_cash$(_run_0, 6, 1)), ($remove_tool$(($Run$tools$(_run_0)), {$: "Medicine"})))), "The genin thanks you: a Will of Fire blessing."));
    return $Bool$pick$(($Bool$and$((_c_0 === 0), _has_0)), _helped_0, ($to_map$(_run_0, ($Bool$pick$((_c_0 === 0), "You have no Medicine to give.", "You walk on.")))));
  } else if (_k_0.$ === "EScroll") {
    const _good_1 = ($loot$(_run_0, {$: "Con", "head": {$: "LTrain", "who": 0, "n": 1}, "tail": {$: "Con", "head": {$: "LTrain", "who": 1, "n": 1}, "tail": {$: "Con", "head": {$: "LTrain", "who": 2, "n": 1}, "tail": {$: "Nil"}}}}, "Forbidden knowledge! Each ninja trains a jutsu."));
    const _bad_0 = ($to_map$(($hurt_party$(_run_0, 20)), "A curse seal! The squad loses 20% HP."));
    return $Bool$pick$((_c_0 === 0), ($Bool$pick$(($chance$(_seed_0, 6, 70)), _good_1, _bad_0)), ($to_map$(($add_cash$(_run_0, 5, 3)), "It burns blue. +3 Seal Paper.")));
  } else if (_k_0.$ === "EGamble") {
    const _r_5 = ($Run$ryo$(_run_0));
    const _can_0 = ($Bool$and$((_c_0 === 0), (_r_5 >= 50)));
    const _win_1 = ($to_map$(($Run$with_ryo$(_run_0, ((_r_5 + 100) >>> 0))), "Jackpot! +100 ryo. (The legendary sucker didn't win for once.)"));
    const _lose_1 = ($to_map$(($Run$with_ryo$(_run_0, ($sub0$(_r_5, 50)))), "Lost 50 ryo. Classic."));
    return $Bool$pick$(_can_0, ($Bool$pick$(($chance$(_seed_0, 7, 45)), _win_1, _lose_1)), ($to_map$(_run_0, ($Bool$pick$((_c_0 === 0), "Not enough ryo to bet.", "You keep your ryo.")))));
  } else if (_k_0.$ === "EAmbush") {
    const _smoke_0 = ($has_tool$(($Run$tools$(_run_0)), {$: "SmokeBomb"}));
    const _out_0 = ($Bool$pick$(_smoke_0, ($to_map$(($Run$with_tools$(_run_0, ($remove_tool$(($Run$tools$(_run_0)), {$: "SmokeBomb"})))), "Smoke bomb! You slip away.")), ($to_map$(($Run$with_ryo$(_run_0, ($sub0$(($Run$ryo$(_run_0)), 40)))), "You drop 40 ryo and run."))));
    return $fight_or$go$(($Bool$pick$((_c_0 === 0), _run_0, _out_0)), (_c_0 === 0), "Ambush! They're stronger than usual.", ($Run$msg$(_out_0)));
  } else if (_k_0.$ === "ETraining") {
    const _x_10 = ($Run$act$(_run_0));
    const _x_11 = ((_x_10 + 1) >>> 0);
    const _xp_0 = (Math.imul(40, _x_11) >>> 0);
    const _x_12 = ($U32$show$(_xp_0));
    const _x_13 = (_x_12 + " XP each.");
    return $Bool$pick$((_c_0 === 0), ($to_map$(($Run$with_party$(_run_0, ($gain_all$(($Run$party$(_run_0)), _xp_0, ($run_bonus$(_run_0)))))), ("Sparring! +" + _x_13))), ($to_map$(($add_cash$(_run_0, 3, 60)), "+60 Whetstones.")));
  } else {
    const _r_6 = ($Run$ryo$(_run_0));
    return $Bool$pick$(($Bool$and$((_c_0 === 0), (_r_6 >= 25))), ($to_map$(($heal_party$(($Run$with_ryo$(_run_0, ($sub0$(_r_6, 25)))), 40)), "Miso chashu, extra pork. The squad feels great.")), ($to_map$(_run_0, ($Bool$pick$((_c_0 === 0), "Not enough ryo.", "Maybe next time.")))));
  }
}

function $rest_choose$(_run_0, _c_0) {
  return $Bool$pick$((_c_0 === 0), ($to_map$(($heal_party$(_run_0, 40)), "The hot water works wonders. +40% HP and chakra.")), ($Bool$pick$((_c_0 === 1), _run_0, ($to_map$(($add_cash$(($add_cash$(_run_0, 6, 1)), 7, 1)), "Calm mind: a Will of Fire blessing and a new Affinity.")))));
}

function $choose$(_m_0, _run_0, _c_0) {
  if (_m_0.$ === "InEvent") {
    const _id_0 = _m_0["id"];
    const _x_0 = ($Run$seed$(_run_0));
    return $Run$with_seed$(($ev_resolve$(($ev_kind$(_id_0)), _run_0, _c_0, ($Run$seed$(_run_0)))), ($mix$(((_x_0 + 83) >>> 0))));
  } else if (_m_0.$ === "InRest") {
    return $rest_choose$(_run_0, _c_0);
  } else {
    return _run_0;
  }
}

function $spar_battle$(_run_0, _lvl_0, _seed_0) {
  const _arts_0 = ($Run$arts$(_run_0));
  const _sealed_0 = ($sealed_count$(_run_0));
  const _sp_0 = ($foe_fighter$({$: "Sparring"}, _lvl_0));
  const _bag_0 = ($Run$bag$(_run_0));
  const _fs_0 = ($snoc$(($party_fighters$(($Run$party$(_run_0)), ($run_bonus$(_run_0)), ($Bag$weps$(_bag_0)))), ($Fighter$with_mhp$(($Fighter$with_hp$(_sp_0, 1000000000)), 1000000000))));
  return $new_battle$(_fs_0, 0, 0, _arts_0, _sealed_0, ($mix$(_seed_0)), ($Bag$smain$(_bag_0)), ($summon_power$(_bag_0)));
}

function $edp_battle$(_run_0, _dfn_0, _seed_0) {
  const _arts_0 = ($Run$arts$(_run_0));
  const _sealed_0 = ($sealed_count$(_run_0));
  const _bag_0 = ($Run$bag$(_run_0));
  const _fs_0 = ($snoc$(($party_fighters$(($Run$party$(_run_0)), ($run_bonus$(_run_0)), ($Bag$weps$(_bag_0)))), ($training_dummy$(_dfn_0))));
  return $new_battle$(_fs_0, 0, 0, _arts_0, _sealed_0, ($mix$(_seed_0)), ($Bag$smain$(_bag_0)), ($summon_power$(_bag_0)));
}

function $new_run$(_seed_0) {
  const _s_0 = ($mix$(((_seed_0 + 1) >>> 0)));
  const _party_0 = {$: "Con", "head": ($new_member$({$: "Naruto"}, 1, ($bonus_none$()))), "tail": {$: "Con", "head": ($new_member$({$: "Sasuke"}, 1, ($bonus_none$()))), "tail": {$: "Con", "head": ($new_member$({$: "Sakura"}, 1, ($bonus_none$()))), "tail": {$: "Nil"}}}};
  const _tools_0 = {$: "Con", "head": {$: "Medicine"}, "tail": {$: "Con", "head": {$: "Medicine"}, "tail": {$: "Con", "head": {$: "Kunai"}, "tail": {$: "Con", "head": {$: "Kunai"}, "tail": {$: "Con", "head": {$: "SoldierPill"}, "tail": {$: "Con", "head": {$: "SmokeBomb"}, "tail": {$: "Nil"}}}}}}};
  const _x_0 = ($act_name$(0));
  const _x_1 = (_x_0 + ". The Three-Tails waits at the end of the road.");
  return {$: "Run", "seed": _s_0, "day": 0, "ryo": 100, "pos": 999, "party": _party_0, "tools": _tools_0, "arts": {$: "Nil"}, "sealed": {$: "Nil"}, "act": 0, "map": ($gen_map$(0, _s_0, _party_0)), "bag": ($new_bag$()), "mode": {$: "OnMap"}, "msg": ("Act 1: " + _x_1), "wins": 0, "met": {$: "Nil"}};
}

function $squad_members$(_ws_0) {
  if (_ws_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _w_0 = _ws_0["head"];
    const _t_0 = _ws_0["tail"];
    return {$: "Con", "head": ($new_member$(_w_0, 1, ($bonus_none$()))), "tail": ($squad_members$(_t_0))};
  }
}

function $new_run_squad$(_seed_0, _ws_0) {
  const _r_0 = ($new_run$(_seed_0));
  const _ms_0 = ($squad_members$(_ws_0));
  return $auto_kit$(($Run$with_map$(($Run$with_party$(_r_0, _ms_0)), ($gen_map$(0, ($Run$seed$(_r_0)), _ms_0)))));
}

function $input$go$(_run_0, _inp_0) {
  if (_inp_0.$ === "Travel") {
    const _n_0 = _inp_0["node"];
    return $travel$(_run_0, _n_0);
  } else if (_inp_0.$ === "Choose") {
    const _c_0 = _inp_0["idx"];
    return $choose$(($Run$mode$(_run_0)), _run_0, _c_0);
  } else if (_inp_0.$ === "Cmd") {
    const _c_1 = _inp_0["cmd"];
    return $cmd_mode$(($Run$mode$(_run_0)), _run_0, _c_1);
  } else if (_inp_0.$ === "Next") {
    return $next_mode$(($Run$mode$(_run_0)), _run_0);
  } else if (_inp_0.$ === "Loot") {
    const _i_0 = _inp_0["idx"];
    const _o_0 = _inp_0["opt"];
    const _w_0 = _inp_0["who"];
    const _sl_0 = _inp_0["slot"];
    return $loot_claim$(($Run$mode$(_run_0)), _run_0, _i_0, _o_0, _w_0, _sl_0);
  } else if (_inp_0.$ === "SkipLoot") {
    const _i_1 = _inp_0["idx"];
    return $loot_skip$(($Run$mode$(_run_0)), _run_0, _i_1);
  } else if (_inp_0.$ === "LeaveLoot") {
    return $loot_leave$(($Run$mode$(_run_0)), _run_0);
  } else if (_inp_0.$ === "VHeal") {
    return $v_heal$(_run_0);
  } else if (_inp_0.$ === "VBuy") {
    const _t_0 = _inp_0["tool"];
    return $v_buy$(_run_0, _t_0);
  } else if (_inp_0.$ === "VJutsu") {
    const _i_2 = _inp_0["idx"];
    const _w_1 = _inp_0["who"];
    const _sl_1 = _inp_0["slot"];
    return $v_jutsu$(($Run$mode$(_run_0)), _run_0, _i_2, _w_1, _sl_1);
  } else if (_inp_0.$ === "VArt") {
    const _i_3 = _inp_0["idx"];
    return $v_art$(($Run$mode$(_run_0)), _run_0, _i_3);
  } else if (_inp_0.$ === "VLeave") {
    return $v_leave$(($Run$mode$(_run_0)), _run_0);
  } else {
    const _w_2 = _inp_0["who"];
    const _sl_2 = _inp_0["slot"];
    return $rest_train$(($Run$mode$(_run_0)), _run_0, _w_2, _sl_2);
  }
}

function $input$(_run_0, _inp_0) {
  return $check_forms$(($auto_kit$(($settle$(($input$go$(_run_0, _inp_0)))))));
}

function $Bool$pick$(_c_0, _a_0, _b_0) {
  if (!_c_0) {
    return _b_0;
  } else {
    return _a_0;
  }
}

function $List$length$(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return 0;
  } else {
    const _t_0 = _xs_0["tail"];
    return nat_chk(($List$length$(_t_0)) + 1);
  }
}

function $Maybe$default$(_m_0, _d_0) {
  if (_m_0.$ === "None") {
    return _d_0;
  } else {
    const _x_0 = _m_0["value"];
    return _x_0;
  }
}

function $List$get$($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _n_0 = $1;
      if (_xs_0.$ === "Nil") {
        return {$: "None"};
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        if (_n_0 === 0) {
          return {$: "Some", "value": _h_0};
        } else {
          const _p_0 = (_n_0 - 1);
          $0 = _t_0;
          $1 = _p_0;
          continue;
        }
      }
    }
  }
}

function $List$append$(_xs_0, _ys_0) {
  if (_xs_0.$ === "Nil") {
    return _ys_0;
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    return {$: "Con", "head": _h_0, "tail": ($List$append$(_t_0, _ys_0))};
  }
}

function $U32$show$(_a_0) {
  const _b_0 = _a_0;
  return $U32$show$if$(_b_0, (_b_0 === 0));
}

function $String$to_lower$(_s_0) {
  if (_s_0 === "") {
    return "";
  } else {
    const _h_0 = (_s_0.codePointAt(0) > 0xFFFF ? _s_0.slice(0, 2) : _s_0[0]);
    const _t_0 = (_s_0.codePointAt(0) > 0xFFFF ? _s_0.slice(2) : _s_0.slice(1));
    return (($Char$to_lower$(_h_0)) + ($String$to_lower$(_t_0)));
  }
}

function $Bool$and$(_a_0, _b_0) {
  if (!_a_0) {
    return false;
  } else {
    return _b_0;
  }
}

function $List$set$(_xs_0, _n_0, _x_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    if (_n_0 === 0) {
      return {$: "Con", "head": _x_0, "tail": _t_0};
    } else {
      const _p_0 = (_n_0 - 1);
      return {$: "Con", "head": _h_0, "tail": ($List$set$(_t_0, _p_0, _x_0))};
    }
  }
}

function $Bool$not$(_b_0) {
  if (!_b_0) {
    return true;
  } else {
    return false;
  }
}

function $Pair$fst$(_p_0) {
  const _a_0 = _p_0["fst"];
  return _a_0;
}

function $String$eq$(_a_0, _b_0) {
  return $String$eq$fin$(($String$cmp$(_a_0, _b_0)));
}

function $List$head$(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "None"};
  } else {
    const _h_0 = _xs_0["head"];
    return {$: "Some", "value": _h_0};
  }
}

function $List$tail$(_xs_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _t_0 = _xs_0["tail"];
    return _t_0;
  }
}

function $List$take$(_xs_0, _n_0) {
  if (_xs_0.$ === "Nil") {
    return {$: "Nil"};
  } else {
    const _h_0 = _xs_0["head"];
    const _t_0 = _xs_0["tail"];
    if (_n_0 === 0) {
      return {$: "Nil"};
    } else {
      const _p_0 = (_n_0 - 1);
      return {$: "Con", "head": _h_0, "tail": ($List$take$(_t_0, _p_0))};
    }
  }
}

function $List$drop$($0, $1) {
  for (;;) {
    {
      const _xs_0 = $0;
      const _n_0 = $1;
      if (_xs_0.$ === "Nil") {
        return {$: "Nil"};
      } else {
        const _h_0 = _xs_0["head"];
        const _t_0 = _xs_0["tail"];
        if (_n_0 === 0) {
          return {$: "Con", "head": _h_0, "tail": _t_0};
        } else {
          const _p_0 = (_n_0 - 1);
          $0 = _t_0;
          $1 = _p_0;
          continue;
        }
      }
    }
  }
}

function $List$replicate$(_n_0, _x_0) {
  if (_n_0 === 0) {
    return {$: "Nil"};
  } else {
    const _p_0 = (_n_0 - 1);
    return {$: "Con", "head": _x_0, "tail": ($List$replicate$(_p_0, _x_0))};
  }
}

function $String$is_empty$(_s_0) {
  if (_s_0 === "") {
    return true;
  } else {
    return false;
  }
}

function $U32$show$if$(_a_0, _z_0) {
  if (_z_0) {
    return "0";
  } else {
    return $U32$show$go$(10, _a_0, "");
  }
}

function $Char$to_lower$(_c_0) {
  const _x_0 = ($Bool$to_u32$(($Char$is_upper$(_c_0))));
  const _x_1 = ($Char$to_u32$(_c_0));
  const _x_2 = (Math.imul(_x_0, 32) >>> 0);
  return char_new(((_x_1 + _x_2) >>> 0));
}

function $String$eq$fin$(_r_0) {
  const _t_0 = _r_0["fst"];
  const _c_0 = _r_0["snd"];
  return $Cmp$is_eq$(_c_0);
}

function $String$cmp$(_a_0, _b_0) {
  if (_a_0 === "") {
    if (_b_0 === "") {
      return {$: "Tuple", "fst": {$: "Tuple", "fst": "", "snd": ""}, "snd": {$: "EQ"}};
    } else {
      const _h_0 = (_b_0.codePointAt(0) > 0xFFFF ? _b_0.slice(0, 2) : _b_0[0]);
      const _t_0 = (_b_0.codePointAt(0) > 0xFFFF ? _b_0.slice(2) : _b_0.slice(1));
      return {$: "Tuple", "fst": {$: "Tuple", "fst": "", "snd": (_h_0 + _t_0)}, "snd": {$: "LT"}};
    }
  } else {
    const _h_1 = (_a_0.codePointAt(0) > 0xFFFF ? _a_0.slice(0, 2) : _a_0[0]);
    const _t_1 = (_a_0.codePointAt(0) > 0xFFFF ? _a_0.slice(2) : _a_0.slice(1));
    if (_b_0 === "") {
      return {$: "Tuple", "fst": {$: "Tuple", "fst": (_h_1 + _t_1), "snd": ""}, "snd": {$: "GT"}};
    } else {
      const _h2_0 = (_b_0.codePointAt(0) > 0xFFFF ? _b_0.slice(0, 2) : _b_0[0]);
      const _t2_0 = (_b_0.codePointAt(0) > 0xFFFF ? _b_0.slice(2) : _b_0.slice(1));
      return $String$cmp$fin$(_t_1, _t2_0, ($Char$cmp$(_h_1, _h2_0)));
    }
  }
}

function $U32$show$go$($0, $1, $2, $3) {
  let $pc = 0;
  for (;;) switch ($pc) {
    case 0: {
      const _f_0 = $0;
      const _n_0 = $1;
      const _acc_0 = $2;
      if (_f_0 === 0) {
        return _acc_0;
      } else {
        const _g_0 = (_f_0 - 1);
        $0 = _g_0;
        $1 = _acc_0;
        $2 = _n_0;
        $3 = (_n_0 === 0);
        $pc = 1; continue;
      }
    }
    case 1: {
      const _g_0 = $0;
      const _acc_0 = $1;
      const _n_0 = $2;
      const _z_0 = $3;
      if (_z_0) {
        return _acc_0;
      } else {
        const _x_0 = (10 === 0 ? _n_0 : _n_0 % 10);
        $0 = _g_0;
        $1 = (10 === 0 ? 0 : (_n_0 / 10) >>> 0);
        $2 = (char_new(((48 + _x_0) >>> 0)) + _acc_0);
        $pc = 0; continue;
      }
    }
  }
}

function $Char$to_u32$(_c_0) {
  const _x_0 = _c_0.codePointAt(0);
  return _x_0;
}

function $Bool$to_u32$(_b_0) {
  if (!_b_0) {
    return 0;
  } else {
    return 1;
  }
}

function $Char$is_upper$(_c_0) {
  const _x_0 = _c_0.codePointAt(0);
  return $Bool$and$((_x_0 >= 65), (_x_0 <= 90));
}

function $Cmp$is_eq$(_c_0) {
  if (_c_0.$ === "LT") {
    return false;
  } else if (_c_0.$ === "EQ") {
    return true;
  } else {
    return false;
  }
}

function $String$cmp$fin$(_t1_0, _t2_0, _hc_0) {
  const _t_0 = _hc_0["fst"];
  const _h1b_0 = _t_0["fst"];
  const _h2b_0 = _t_0["snd"];
  const _t_1 = _hc_0["snd"];
  if (_t_1.$ === "LT") {
    return {$: "Tuple", "fst": {$: "Tuple", "fst": (_h1b_0 + _t1_0), "snd": (_h2b_0 + _t2_0)}, "snd": {$: "LT"}};
  } else if (_t_1.$ === "EQ") {
    return $String$cmp$rec$(_h1b_0, _h2b_0, ($String$cmp$(_t1_0, _t2_0)));
  } else {
    return {$: "Tuple", "fst": {$: "Tuple", "fst": (_h1b_0 + _t1_0), "snd": (_h2b_0 + _t2_0)}, "snd": {$: "GT"}};
  }
}

function $Char$cmp$(_a_0, _b_0) {
  const _x_0 = _a_0.codePointAt(0);
  const _y_0 = _b_0.codePointAt(0);
  return {$: "Tuple", "fst": {$: "Tuple", "fst": char_new(_x_0), "snd": char_new(_y_0)}, "snd": cmp_new(_x_0, _y_0)};
}

function $U32$show$fin$($0, $1, $2, $3) {
  let $pc = 1;
  for (;;) switch ($pc) {
    case 0: {
      const _f_0 = $0;
      const _n_0 = $1;
      const _acc_0 = $2;
      if (_f_0 === 0) {
        return _acc_0;
      } else {
        const _g_0 = (_f_0 - 1);
        $0 = _g_0;
        $1 = _acc_0;
        $2 = _n_0;
        $3 = (_n_0 === 0);
        $pc = 1; continue;
      }
    }
    case 1: {
      const _g_0 = $0;
      const _acc_0 = $1;
      const _n_0 = $2;
      const _z_0 = $3;
      if (_z_0) {
        return _acc_0;
      } else {
        const _x_0 = (10 === 0 ? _n_0 : _n_0 % 10);
        $0 = _g_0;
        $1 = (10 === 0 ? 0 : (_n_0 / 10) >>> 0);
        $2 = (char_new(((48 + _x_0) >>> 0)) + _acc_0);
        $pc = 0; continue;
      }
    }
  }
}

function $String$cmp$rec$(_h1b_0, _h2b_0, _rr_0) {
  const _t_0 = _rr_0["fst"];
  const _t1b_0 = _t_0["fst"];
  const _t2b_0 = _t_0["snd"];
  const _r_0 = _rr_0["snd"];
  return {$: "Tuple", "fst": {$: "Tuple", "fst": (_h1b_0 + _t1b_0), "snd": (_h2b_0 + _t2b_0)}, "snd": _r_0};
}
export default {
  "Picks.foes": run_lib((a0) => { const r = (run_loop($Picks$foes$((a0)))); (a0); return r; }, 1),
  "Picks.met": run_lib((a0) => { const r = (run_loop($Picks$met$((a0)))); (a0); return r; }, 1),
  "Picks.with_foes": run_lib((a0, a1) => { const r = (run_loop($Picks$with_foes$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Picks.with_met": run_lib((a0, a1) => { const r = (run_loop($Picks$with_met$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Stats.hp": run_lib((a0) => { const r = (run_loop($Stats$hp$((a0)))); (a0); return r; }, 1),
  "Stats.ck": run_lib((a0) => { const r = (run_loop($Stats$ck$((a0)))); (a0); return r; }, 1),
  "Stats.atk": run_lib((a0) => { const r = (run_loop($Stats$atk$((a0)))); (a0); return r; }, 1),
  "Stats.nin": run_lib((a0) => { const r = (run_loop($Stats$nin$((a0)))); (a0); return r; }, 1),
  "Stats.dfn": run_lib((a0) => { const r = (run_loop($Stats$dfn$((a0)))); (a0); return r; }, 1),
  "Stats.spd": run_lib((a0) => { const r = (run_loop($Stats$spd$((a0)))); (a0); return r; }, 1),
  "Stats.with_hp": run_lib((a0, a1) => { const r = (run_loop($Stats$with_hp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Stats.with_ck": run_lib((a0, a1) => { const r = (run_loop($Stats$with_ck$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Stats.with_atk": run_lib((a0, a1) => { const r = (run_loop($Stats$with_atk$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Stats.with_nin": run_lib((a0, a1) => { const r = (run_loop($Stats$with_nin$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Stats.with_dfn": run_lib((a0, a1) => { const r = (run_loop($Stats$with_dfn$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Stats.with_spd": run_lib((a0, a1) => { const r = (run_loop($Stats$with_spd$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Learn.move": run_lib((a0) => { const r = (run_loop($Learn$move$((a0)))); (a0); return r; }, 1),
  "Learn.lvl": run_lib((a0) => { const r = (run_loop($Learn$lvl$((a0)))); (a0); return r; }, 1),
  "Learn.with_move": run_lib((a0, a1) => { const r = (run_loop($Learn$with_move$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Learn.with_lvl": run_lib((a0, a1) => { const r = (run_loop($Learn$with_lvl$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "MoveInfo.name": run_lib((a0) => { const r = (run_loop($MoveInfo$name$((a0)))); (a0); return r; }, 1),
  "MoveInfo.cost": run_lib((a0) => { const r = (run_loop($MoveInfo$cost$((a0)))); (a0); return r; }, 1),
  "MoveInfo.hpcost": run_lib((a0) => { const r = (run_loop($MoveInfo$hpcost$((a0)))); (a0); return r; }, 1),
  "MoveInfo.tgt": run_lib((a0) => { const r = (run_loop($MoveInfo$tgt$((a0)))); (a0); return r; }, 1),
  "MoveInfo.effs": run_lib((a0) => { const r = (run_loop($MoveInfo$effs$((a0)))); (a0); return r; }, 1),
  "MoveInfo.desc": run_lib((a0) => { const r = (run_loop($MoveInfo$desc$((a0)))); (a0); return r; }, 1),
  "MoveInfo.with_name": run_lib((a0, a1) => { const r = (run_loop($MoveInfo$with_name$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "MoveInfo.with_cost": run_lib((a0, a1) => { const r = (run_loop($MoveInfo$with_cost$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "MoveInfo.with_hpcost": run_lib((a0, a1) => { const r = (run_loop($MoveInfo$with_hpcost$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "MoveInfo.with_tgt": run_lib((a0, a1) => { const r = (run_loop($MoveInfo$with_tgt$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "MoveInfo.with_effs": run_lib((a0, a1) => { const r = (run_loop($MoveInfo$with_effs$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "MoveInfo.with_desc": run_lib((a0, a1) => { const r = (run_loop($MoveInfo$with_desc$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.name": run_lib((a0) => { const r = (run_loop($FoeInfo$name$((a0)))); (a0); return r; }, 1),
  "FoeInfo.hp": run_lib((a0) => { const r = (run_loop($FoeInfo$hp$((a0)))); (a0); return r; }, 1),
  "FoeInfo.atk": run_lib((a0) => { const r = (run_loop($FoeInfo$atk$((a0)))); (a0); return r; }, 1),
  "FoeInfo.nin": run_lib((a0) => { const r = (run_loop($FoeInfo$nin$((a0)))); (a0); return r; }, 1),
  "FoeInfo.dfn": run_lib((a0) => { const r = (run_loop($FoeInfo$dfn$((a0)))); (a0); return r; }, 1),
  "FoeInfo.spd": run_lib((a0) => { const r = (run_loop($FoeInfo$spd$((a0)))); (a0); return r; }, 1),
  "FoeInfo.moves": run_lib((a0) => { const r = (run_loop($FoeInfo$moves$((a0)))); (a0); return r; }, 1),
  "FoeInfo.xp": run_lib((a0) => { const r = (run_loop($FoeInfo$xp$((a0)))); (a0); return r; }, 1),
  "FoeInfo.ryo": run_lib((a0) => { const r = (run_loop($FoeInfo$ryo$((a0)))); (a0); return r; }, 1),
  "FoeInfo.with_name": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_name$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.with_hp": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_hp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.with_atk": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_atk$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.with_nin": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_nin$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.with_dfn": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_dfn$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.with_spd": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_spd$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.with_moves": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_moves$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.with_xp": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_xp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FoeInfo.with_ryo": run_lib((a0, a1) => { const r = (run_loop($FoeInfo$with_ryo$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.atkf": run_lib((a0) => { const r = (run_loop($Bonus$atkf$((a0)))); (a0); return r; }, 1),
  "Bonus.atkp": run_lib((a0) => { const r = (run_loop($Bonus$atkp$((a0)))); (a0); return r; }, 1),
  "Bonus.hpp": run_lib((a0) => { const r = (run_loop($Bonus$hpp$((a0)))); (a0); return r; }, 1),
  "Bonus.dfnf": run_lib((a0) => { const r = (run_loop($Bonus$dfnf$((a0)))); (a0); return r; }, 1),
  "Bonus.dmgp": run_lib((a0) => { const r = (run_loop($Bonus$dmgp$((a0)))); (a0); return r; }, 1),
  "Bonus.bossp": run_lib((a0) => { const r = (run_loop($Bonus$bossp$((a0)))); (a0); return r; }, 1),
  "Bonus.normp": run_lib((a0) => { const r = (run_loop($Bonus$normp$((a0)))); (a0); return r; }, 1),
  "Bonus.taip": run_lib((a0) => { const r = (run_loop($Bonus$taip$((a0)))); (a0); return r; }, 1),
  "Bonus.ninp": run_lib((a0) => { const r = (run_loop($Bonus$ninp$((a0)))); (a0); return r; }, 1),
  "Bonus.fd": run_lib((a0) => { const r = (run_loop($Bonus$fd$((a0)))); (a0); return r; }, 1),
  "Bonus.cr": run_lib((a0) => { const r = (run_loop($Bonus$cr$((a0)))); (a0); return r; }, 1),
  "Bonus.cdmg": run_lib((a0) => { const r = (run_loop($Bonus$cdmg$((a0)))); (a0); return r; }, 1),
  "Bonus.pen": run_lib((a0) => { const r = (run_loop($Bonus$pen$((a0)))); (a0); return r; }, 1),
  "Bonus.haste": run_lib((a0) => { const r = (run_loop($Bonus$haste$((a0)))); (a0); return r; }, 1),
  "Bonus.cdr": run_lib((a0) => { const r = (run_loop($Bonus$cdr$((a0)))); (a0); return r; }, 1),
  "Bonus.regen": run_lib((a0) => { const r = (run_loop($Bonus$regen$((a0)))); (a0); return r; }, 1),
  "Bonus.hpr": run_lib((a0) => { const r = (run_loop($Bonus$hpr$((a0)))); (a0); return r; }, 1),
  "Bonus.jlv": run_lib((a0) => { const r = (run_loop($Bonus$jlv$((a0)))); (a0); return r; }, 1),
  "Bonus.ckf": run_lib((a0) => { const r = (run_loop($Bonus$ckf$((a0)))); (a0); return r; }, 1),
  "Bonus.with_atkf": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_atkf$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_atkp": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_atkp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_hpp": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_hpp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_dfnf": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_dfnf$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_dmgp": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_dmgp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_bossp": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_bossp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_normp": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_normp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_taip": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_taip$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_ninp": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_ninp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_fd": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_fd$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_cr": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_cr$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_cdmg": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_cdmg$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_pen": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_pen$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_haste": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_haste$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_cdr": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_cdr$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_regen": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_regen$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_hpr": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_hpr$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_jlv": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_jlv$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bonus.with_ckf": run_lib((a0, a1) => { const r = (run_loop($Bonus$with_ckf$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FormInfo.name": run_lib((a0) => { const r = (run_loop($FormInfo$name$((a0)))); (a0); return r; }, 1),
  "FormInfo.gate": run_lib((a0) => { const r = (run_loop($FormInfo$gate$((a0)))); (a0); return r; }, 1),
  "FormInfo.trig": run_lib((a0) => { const r = (run_loop($FormInfo$trig$((a0)))); (a0); return r; }, 1),
  "FormInfo.bon": run_lib((a0) => { const r = (run_loop($FormInfo$bon$((a0)))); (a0); return r; }, 1),
  "FormInfo.drain": run_lib((a0) => { const r = (run_loop($FormInfo$drain$((a0)))); (a0); return r; }, 1),
  "FormInfo.sig": run_lib((a0) => { const r = (run_loop($FormInfo$sig$((a0)))); (a0); return r; }, 1),
  "FormInfo.desc": run_lib((a0) => { const r = (run_loop($FormInfo$desc$((a0)))); (a0); return r; }, 1),
  "FormInfo.color": run_lib((a0) => { const r = (run_loop($FormInfo$color$((a0)))); (a0); return r; }, 1),
  "FormInfo.with_name": run_lib((a0, a1) => { const r = (run_loop($FormInfo$with_name$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FormInfo.with_gate": run_lib((a0, a1) => { const r = (run_loop($FormInfo$with_gate$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FormInfo.with_trig": run_lib((a0, a1) => { const r = (run_loop($FormInfo$with_trig$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FormInfo.with_bon": run_lib((a0, a1) => { const r = (run_loop($FormInfo$with_bon$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FormInfo.with_drain": run_lib((a0, a1) => { const r = (run_loop($FormInfo$with_drain$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FormInfo.with_sig": run_lib((a0, a1) => { const r = (run_loop($FormInfo$with_sig$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FormInfo.with_desc": run_lib((a0, a1) => { const r = (run_loop($FormInfo$with_desc$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "FormInfo.with_color": run_lib((a0, a1) => { const r = (run_loop($FormInfo$with_color$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Wallet.wsc": run_lib((a0) => { const r = (run_loop($Wallet$wsc$((a0)))); (a0); return r; }, 1),
  "Wallet.csc": run_lib((a0) => { const r = (run_loop($Wallet$csc$((a0)))); (a0); return r; }, 1),
  "Wallet.gsc": run_lib((a0) => { const r = (run_loop($Wallet$gsc$((a0)))); (a0); return r; }, 1),
  "Wallet.whet": run_lib((a0) => { const r = (run_loop($Wallet$whet$((a0)))); (a0); return r; }, 1),
  "Wallet.ore": run_lib((a0) => { const r = (run_loop($Wallet$ore$((a0)))); (a0); return r; }, 1),
  "Wallet.seal": run_lib((a0) => { const r = (run_loop($Wallet$seal$((a0)))); (a0); return r; }, 1),
  "Wallet.wp": run_lib((a0) => { const r = (run_loop($Wallet$wp$((a0)))); (a0); return r; }, 1),
  "Wallet.ap": run_lib((a0) => { const r = (run_loop($Wallet$ap$((a0)))); (a0); return r; }, 1),
  "Wallet.with_wsc": run_lib((a0, a1) => { const r = (run_loop($Wallet$with_wsc$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Wallet.with_csc": run_lib((a0, a1) => { const r = (run_loop($Wallet$with_csc$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Wallet.with_gsc": run_lib((a0, a1) => { const r = (run_loop($Wallet$with_gsc$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Wallet.with_whet": run_lib((a0, a1) => { const r = (run_loop($Wallet$with_whet$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Wallet.with_ore": run_lib((a0, a1) => { const r = (run_loop($Wallet$with_ore$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Wallet.with_seal": run_lib((a0, a1) => { const r = (run_loop($Wallet$with_seal$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Wallet.with_wp": run_lib((a0, a1) => { const r = (run_loop($Wallet$with_wp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Wallet.with_ap": run_lib((a0, a1) => { const r = (run_loop($Wallet$with_ap$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Owned.copies": run_lib((a0) => { const r = (run_loop($Owned$copies$((a0)))); (a0); return r; }, 1),
  "Owned.awk": run_lib((a0) => { const r = (run_loop($Owned$awk$((a0)))); (a0); return r; }, 1),
  "Owned.lvl": run_lib((a0) => { const r = (run_loop($Owned$lvl$((a0)))); (a0); return r; }, 1),
  "Owned.with_copies": run_lib((a0, a1) => { const r = (run_loop($Owned$with_copies$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Owned.with_awk": run_lib((a0, a1) => { const r = (run_loop($Owned$with_awk$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Owned.with_lvl": run_lib((a0, a1) => { const r = (run_loop($Owned$with_lvl$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Line.stat": run_lib((a0) => { const r = (run_loop($Line$stat$((a0)))); (a0); return r; }, 1),
  "Line.val": run_lib((a0) => { const r = (run_loop($Line$val$((a0)))); (a0); return r; }, 1),
  "Line.grade": run_lib((a0) => { const r = (run_loop($Line$grade$((a0)))); (a0); return r; }, 1),
  "Line.with_stat": run_lib((a0, a1) => { const r = (run_loop($Line$with_stat$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Line.with_val": run_lib((a0, a1) => { const r = (run_loop($Line$with_val$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Line.with_grade": run_lib((a0, a1) => { const r = (run_loop($Line$with_grade$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Kit.rar": run_lib((a0) => { const r = (run_loop($Kit$rar$((a0)))); (a0); return r; }, 1),
  "Kit.stars": run_lib((a0) => { const r = (run_loop($Kit$stars$((a0)))); (a0); return r; }, 1),
  "Kit.grade": run_lib((a0) => { const r = (run_loop($Kit$grade$((a0)))); (a0); return r; }, 1),
  "Kit.lines": run_lib((a0) => { const r = (run_loop($Kit$lines$((a0)))); (a0); return r; }, 1),
  "Kit.with_rar": run_lib((a0, a1) => { const r = (run_loop($Kit$with_rar$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Kit.with_stars": run_lib((a0, a1) => { const r = (run_loop($Kit$with_stars$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Kit.with_grade": run_lib((a0, a1) => { const r = (run_loop($Kit$with_grade$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Kit.with_lines": run_lib((a0, a1) => { const r = (run_loop($Kit$with_lines$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Card.kind": run_lib((a0) => { const r = (run_loop($Card$kind$((a0)))); (a0); return r; }, 1),
  "Card.lvl": run_lib((a0) => { const r = (run_loop($Card$lvl$((a0)))); (a0); return r; }, 1),
  "Card.with_kind": run_lib((a0, a1) => { const r = (run_loop($Card$with_kind$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Card.with_lvl": run_lib((a0, a1) => { const r = (run_loop($Card$with_lvl$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.cash": run_lib((a0) => { const r = (run_loop($Bag$cash$((a0)))); (a0); return r; }, 1),
  "Bag.weps": run_lib((a0) => { const r = (run_loop($Bag$weps$((a0)))); (a0); return r; }, 1),
  "Bag.smns": run_lib((a0) => { const r = (run_loop($Bag$smns$((a0)))); (a0); return r; }, 1),
  "Bag.kit": run_lib((a0) => { const r = (run_loop($Bag$kit$((a0)))); (a0); return r; }, 1),
  "Bag.smain": run_lib((a0) => { const r = (run_loop($Bag$smain$((a0)))); (a0); return r; }, 1),
  "Bag.ssub1": run_lib((a0) => { const r = (run_loop($Bag$ssub1$((a0)))); (a0); return r; }, 1),
  "Bag.ssub2": run_lib((a0) => { const r = (run_loop($Bag$ssub2$((a0)))); (a0); return r; }, 1),
  "Bag.will": run_lib((a0) => { const r = (run_loop($Bag$will$((a0)))); (a0); return r; }, 1),
  "Bag.aff": run_lib((a0) => { const r = (run_loop($Bag$aff$((a0)))); (a0); return r; }, 1),
  "Bag.pulls": run_lib((a0) => { const r = (run_loop($Bag$pulls$((a0)))); (a0); return r; }, 1),
  "Bag.pity": run_lib((a0) => { const r = (run_loop($Bag$pity$((a0)))); (a0); return r; }, 1),
  "Bag.cards": run_lib((a0) => { const r = (run_loop($Bag$cards$((a0)))); (a0); return r; }, 1),
  "Bag.logp": run_lib((a0) => { const r = (run_loop($Bag$logp$((a0)))); (a0); return r; }, 1),
  "Bag.got": run_lib((a0) => { const r = (run_loop($Bag$got$((a0)))); (a0); return r; }, 1),
  "Bag.with_cash": run_lib((a0, a1) => { const r = (run_loop($Bag$with_cash$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_weps": run_lib((a0, a1) => { const r = (run_loop($Bag$with_weps$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_smns": run_lib((a0, a1) => { const r = (run_loop($Bag$with_smns$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_kit": run_lib((a0, a1) => { const r = (run_loop($Bag$with_kit$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_smain": run_lib((a0, a1) => { const r = (run_loop($Bag$with_smain$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_ssub1": run_lib((a0, a1) => { const r = (run_loop($Bag$with_ssub1$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_ssub2": run_lib((a0, a1) => { const r = (run_loop($Bag$with_ssub2$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_will": run_lib((a0, a1) => { const r = (run_loop($Bag$with_will$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_aff": run_lib((a0, a1) => { const r = (run_loop($Bag$with_aff$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_pulls": run_lib((a0, a1) => { const r = (run_loop($Bag$with_pulls$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_pity": run_lib((a0, a1) => { const r = (run_loop($Bag$with_pity$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_cards": run_lib((a0, a1) => { const r = (run_loop($Bag$with_cards$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_logp": run_lib((a0, a1) => { const r = (run_loop($Bag$with_logp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Bag.with_got": run_lib((a0, a1) => { const r = (run_loop($Bag$with_got$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.burn": run_lib((a0) => { const r = (run_loop($Status$burn$((a0)))); (a0); return r; }, 1),
  "Status.poison": run_lib((a0) => { const r = (run_loop($Status$poison$((a0)))); (a0); return r; }, 1),
  "Status.stun": run_lib((a0) => { const r = (run_loop($Status$stun$((a0)))); (a0); return r; }, 1),
  "Status.guard": run_lib((a0) => { const r = (run_loop($Status$guard$((a0)))); (a0); return r; }, 1),
  "Status.atkup": run_lib((a0) => { const r = (run_loop($Status$atkup$((a0)))); (a0); return r; }, 1),
  "Status.defup": run_lib((a0) => { const r = (run_loop($Status$defup$((a0)))); (a0); return r; }, 1),
  "Status.defdown": run_lib((a0) => { const r = (run_loop($Status$defdown$((a0)))); (a0); return r; }, 1),
  "Status.evade": run_lib((a0) => { const r = (run_loop($Status$evade$((a0)))); (a0); return r; }, 1),
  "Status.clones": run_lib((a0) => { const r = (run_loop($Status$clones$((a0)))); (a0); return r; }, 1),
  "Status.charge": run_lib((a0) => { const r = (run_loop($Status$charge$((a0)))); (a0); return r; }, 1),
  "Status.guts": run_lib((a0) => { const r = (run_loop($Status$guts$((a0)))); (a0); return r; }, 1),
  "Status.mark": run_lib((a0) => { const r = (run_loop($Status$mark$((a0)))); (a0); return r; }, 1),
  "Status.markt": run_lib((a0) => { const r = (run_loop($Status$markt$((a0)))); (a0); return r; }, 1),
  "Status.burnd": run_lib((a0) => { const r = (run_loop($Status$burnd$((a0)))); (a0); return r; }, 1),
  "Status.poisd": run_lib((a0) => { const r = (run_loop($Status$poisd$((a0)))); (a0); return r; }, 1),
  "Status.with_burn": run_lib((a0, a1) => { const r = (run_loop($Status$with_burn$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_poison": run_lib((a0, a1) => { const r = (run_loop($Status$with_poison$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_stun": run_lib((a0, a1) => { const r = (run_loop($Status$with_stun$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_guard": run_lib((a0, a1) => { const r = (run_loop($Status$with_guard$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_atkup": run_lib((a0, a1) => { const r = (run_loop($Status$with_atkup$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_defup": run_lib((a0, a1) => { const r = (run_loop($Status$with_defup$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_defdown": run_lib((a0, a1) => { const r = (run_loop($Status$with_defdown$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_evade": run_lib((a0, a1) => { const r = (run_loop($Status$with_evade$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_clones": run_lib((a0, a1) => { const r = (run_loop($Status$with_clones$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_charge": run_lib((a0, a1) => { const r = (run_loop($Status$with_charge$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_guts": run_lib((a0, a1) => { const r = (run_loop($Status$with_guts$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_mark": run_lib((a0, a1) => { const r = (run_loop($Status$with_mark$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_markt": run_lib((a0, a1) => { const r = (run_loop($Status$with_markt$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_burnd": run_lib((a0, a1) => { const r = (run_loop($Status$with_burnd$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Status.with_poisd": run_lib((a0, a1) => { const r = (run_loop($Status$with_poisd$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.body": run_lib((a0) => { const r = (run_loop($Fighter$body$((a0)))); (a0); return r; }, 1),
  "Fighter.side": run_lib((a0) => { const r = (run_loop($Fighter$side$((a0)))); (a0); return r; }, 1),
  "Fighter.lvl": run_lib((a0) => { const r = (run_loop($Fighter$lvl$((a0)))); (a0); return r; }, 1),
  "Fighter.hp": run_lib((a0) => { const r = (run_loop($Fighter$hp$((a0)))); (a0); return r; }, 1),
  "Fighter.mhp": run_lib((a0) => { const r = (run_loop($Fighter$mhp$((a0)))); (a0); return r; }, 1),
  "Fighter.ck": run_lib((a0) => { const r = (run_loop($Fighter$ck$((a0)))); (a0); return r; }, 1),
  "Fighter.mck": run_lib((a0) => { const r = (run_loop($Fighter$mck$((a0)))); (a0); return r; }, 1),
  "Fighter.atk": run_lib((a0) => { const r = (run_loop($Fighter$atk$((a0)))); (a0); return r; }, 1),
  "Fighter.nin": run_lib((a0) => { const r = (run_loop($Fighter$nin$((a0)))); (a0); return r; }, 1),
  "Fighter.dfn": run_lib((a0) => { const r = (run_loop($Fighter$dfn$((a0)))); (a0); return r; }, 1),
  "Fighter.spd": run_lib((a0) => { const r = (run_loop($Fighter$spd$((a0)))); (a0); return r; }, 1),
  "Fighter.bon": run_lib((a0) => { const r = (run_loop($Fighter$bon$((a0)))); (a0); return r; }, 1),
  "Fighter.st": run_lib((a0) => { const r = (run_loop($Fighter$st$((a0)))); (a0); return r; }, 1),
  "Fighter.tmr": run_lib((a0) => { const r = (run_loop($Fighter$tmr$((a0)))); (a0); return r; }, 1),
  "Fighter.cds": run_lib((a0) => { const r = (run_loop($Fighter$cds$((a0)))); (a0); return r; }, 1),
  "Fighter.jlv": run_lib((a0) => { const r = (run_loop($Fighter$jlv$((a0)))); (a0); return r; }, 1),
  "Fighter.form": run_lib((a0) => { const r = (run_loop($Fighter$form$((a0)))); (a0); return r; }, 1),
  "Fighter.ftier": run_lib((a0) => { const r = (run_loop($Fighter$ftier$((a0)))); (a0); return r; }, 1),
  "Fighter.kit": run_lib((a0) => { const r = (run_loop($Fighter$kit$((a0)))); (a0); return r; }, 1),
  "Fighter.with_body": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_body$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_side": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_side$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_lvl": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_lvl$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_hp": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_hp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_mhp": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_mhp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_ck": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_ck$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_mck": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_mck$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_atk": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_atk$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_nin": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_nin$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_dfn": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_dfn$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_spd": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_spd$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_bon": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_bon$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_st": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_st$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_tmr": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_tmr$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_cds": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_cds$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_jlv": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_jlv$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_form": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_form$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_ftier": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_ftier$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Fighter.with_kit": run_lib((a0, a1) => { const r = (run_loop($Fighter$with_kit$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Act.a": run_lib((a0) => { const r = (run_loop($Act$a$((a0)))); (a0); return r; }, 1),
  "Act.nat": run_lib((a0) => { const r = (run_loop($Act$nat$((a0)))); (a0); return r; }, 1),
  "Act.pmul": run_lib((a0) => { const r = (run_loop($Act$pmul$((a0)))); (a0); return r; }, 1),
  "Act.chain": run_lib((a0) => { const r = (run_loop($Act$chain$((a0)))); (a0); return r; }, 1),
  "Act.with_a": run_lib((a0, a1) => { const r = (run_loop($Act$with_a$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Act.with_nat": run_lib((a0, a1) => { const r = (run_loop($Act$with_nat$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Act.with_pmul": run_lib((a0, a1) => { const r = (run_loop($Act$with_pmul$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Act.with_chain": run_lib((a0, a1) => { const r = (run_loop($Act$with_chain$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Lx.lvl": run_lib((a0) => { const r = (run_loop($Lx$lvl$((a0)))); (a0); return r; }, 1),
  "Lx.xp": run_lib((a0) => { const r = (run_loop($Lx$xp$((a0)))); (a0); return r; }, 1),
  "Lx.with_lvl": run_lib((a0, a1) => { const r = (run_loop($Lx$with_lvl$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Lx.with_xp": run_lib((a0, a1) => { const r = (run_loop($Lx$with_xp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.who": run_lib((a0) => { const r = (run_loop($Member$who$((a0)))); (a0); return r; }, 1),
  "Member.lvl": run_lib((a0) => { const r = (run_loop($Member$lvl$((a0)))); (a0); return r; }, 1),
  "Member.xp": run_lib((a0) => { const r = (run_loop($Member$xp$((a0)))); (a0); return r; }, 1),
  "Member.hp": run_lib((a0) => { const r = (run_loop($Member$hp$((a0)))); (a0); return r; }, 1),
  "Member.ck": run_lib((a0) => { const r = (run_loop($Member$ck$((a0)))); (a0); return r; }, 1),
  "Member.sp": run_lib((a0) => { const r = (run_loop($Member$sp$((a0)))); (a0); return r; }, 1),
  "Member.jlv": run_lib((a0) => { const r = (run_loop($Member$jlv$((a0)))); (a0); return r; }, 1),
  "Member.weapon": run_lib((a0) => { const r = (run_loop($Member$weapon$((a0)))); (a0); return r; }, 1),
  "Member.ftier": run_lib((a0) => { const r = (run_loop($Member$ftier$((a0)))); (a0); return r; }, 1),
  "Member.tech": run_lib((a0) => { const r = (run_loop($Member$tech$((a0)))); (a0); return r; }, 1),
  "Member.with_who": run_lib((a0, a1) => { const r = (run_loop($Member$with_who$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_lvl": run_lib((a0, a1) => { const r = (run_loop($Member$with_lvl$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_xp": run_lib((a0, a1) => { const r = (run_loop($Member$with_xp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_hp": run_lib((a0, a1) => { const r = (run_loop($Member$with_hp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_ck": run_lib((a0, a1) => { const r = (run_loop($Member$with_ck$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_sp": run_lib((a0, a1) => { const r = (run_loop($Member$with_sp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_jlv": run_lib((a0, a1) => { const r = (run_loop($Member$with_jlv$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_weapon": run_lib((a0, a1) => { const r = (run_loop($Member$with_weapon$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_ftier": run_lib((a0, a1) => { const r = (run_loop($Member$with_ftier$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Member.with_tech": run_lib((a0, a1) => { const r = (run_loop($Member$with_tech$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Cell.kind": run_lib((a0) => { const r = (run_loop($Cell$kind$((a0)))); (a0); return r; }, 1),
  "Cell.arg": run_lib((a0) => { const r = (run_loop($Cell$arg$((a0)))); (a0); return r; }, 1),
  "Cell.links": run_lib((a0) => { const r = (run_loop($Cell$links$((a0)))); (a0); return r; }, 1),
  "Cell.with_kind": run_lib((a0, a1) => { const r = (run_loop($Cell$with_kind$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Cell.with_arg": run_lib((a0, a1) => { const r = (run_loop($Cell$with_arg$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Cell.with_links": run_lib((a0, a1) => { const r = (run_loop($Cell$with_links$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.fs": run_lib((a0) => { const r = (run_loop($Battle$fs$((a0)))); (a0); return r; }, 1),
  "Battle.clock": run_lib((a0) => { const r = (run_loop($Battle$clock$((a0)))); (a0); return r; }, 1),
  "Battle.round": run_lib((a0) => { const r = (run_loop($Battle$round$((a0)))); (a0); return r; }, 1),
  "Battle.phase": run_lib((a0) => { const r = (run_loop($Battle$phase$((a0)))); (a0); return r; }, 1),
  "Battle.boss": run_lib((a0) => { const r = (run_loop($Battle$boss$((a0)))); (a0); return r; }, 1),
  "Battle.rank": run_lib((a0) => { const r = (run_loop($Battle$rank$((a0)))); (a0); return r; }, 1),
  "Battle.arts": run_lib((a0) => { const r = (run_loop($Battle$arts$((a0)))); (a0); return r; }, 1),
  "Battle.sealed": run_lib((a0) => { const r = (run_loop($Battle$sealed$((a0)))); (a0); return r; }, 1),
  "Battle.log": run_lib((a0) => { const r = (run_loop($Battle$log$((a0)))); (a0); return r; }, 1),
  "Battle.seed": run_lib((a0) => { const r = (run_loop($Battle$seed$((a0)))); (a0); return r; }, 1),
  "Battle.chain": run_lib((a0) => { const r = (run_loop($Battle$chain$((a0)))); (a0); return r; }, 1),
  "Battle.ctgt": run_lib((a0) => { const r = (run_loop($Battle$ctgt$((a0)))); (a0); return r; }, 1),
  "Battle.smn": run_lib((a0) => { const r = (run_loop($Battle$smn$((a0)))); (a0); return r; }, 1),
  "Battle.spow": run_lib((a0) => { const r = (run_loop($Battle$spow$((a0)))); (a0); return r; }, 1),
  "Battle.with_fs": run_lib((a0, a1) => { const r = (run_loop($Battle$with_fs$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_clock": run_lib((a0, a1) => { const r = (run_loop($Battle$with_clock$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_round": run_lib((a0, a1) => { const r = (run_loop($Battle$with_round$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_phase": run_lib((a0, a1) => { const r = (run_loop($Battle$with_phase$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_boss": run_lib((a0, a1) => { const r = (run_loop($Battle$with_boss$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_rank": run_lib((a0, a1) => { const r = (run_loop($Battle$with_rank$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_arts": run_lib((a0, a1) => { const r = (run_loop($Battle$with_arts$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_sealed": run_lib((a0, a1) => { const r = (run_loop($Battle$with_sealed$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_log": run_lib((a0, a1) => { const r = (run_loop($Battle$with_log$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_seed": run_lib((a0, a1) => { const r = (run_loop($Battle$with_seed$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_chain": run_lib((a0, a1) => { const r = (run_loop($Battle$with_chain$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_ctgt": run_lib((a0, a1) => { const r = (run_loop($Battle$with_ctgt$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_smn": run_lib((a0, a1) => { const r = (run_loop($Battle$with_smn$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Battle.with_spow": run_lib((a0, a1) => { const r = (run_loop($Battle$with_spow$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.seed": run_lib((a0) => { const r = (run_loop($Run$seed$((a0)))); (a0); return r; }, 1),
  "Run.day": run_lib((a0) => { const r = (run_loop($Run$day$((a0)))); (a0); return r; }, 1),
  "Run.ryo": run_lib((a0) => { const r = (run_loop($Run$ryo$((a0)))); (a0); return r; }, 1),
  "Run.pos": run_lib((a0) => { const r = (run_loop($Run$pos$((a0)))); (a0); return r; }, 1),
  "Run.party": run_lib((a0) => { const r = (run_loop($Run$party$((a0)))); (a0); return r; }, 1),
  "Run.tools": run_lib((a0) => { const r = (run_loop($Run$tools$((a0)))); (a0); return r; }, 1),
  "Run.arts": run_lib((a0) => { const r = (run_loop($Run$arts$((a0)))); (a0); return r; }, 1),
  "Run.sealed": run_lib((a0) => { const r = (run_loop($Run$sealed$((a0)))); (a0); return r; }, 1),
  "Run.act": run_lib((a0) => { const r = (run_loop($Run$act$((a0)))); (a0); return r; }, 1),
  "Run.map": run_lib((a0) => { const r = (run_loop($Run$map$((a0)))); (a0); return r; }, 1),
  "Run.bag": run_lib((a0) => { const r = (run_loop($Run$bag$((a0)))); (a0); return r; }, 1),
  "Run.mode": run_lib((a0) => { const r = (run_loop($Run$mode$((a0)))); (a0); return r; }, 1),
  "Run.msg": run_lib((a0) => { const r = (run_loop($Run$msg$((a0)))); (a0); return r; }, 1),
  "Run.wins": run_lib((a0) => { const r = (run_loop($Run$wins$((a0)))); (a0); return r; }, 1),
  "Run.met": run_lib((a0) => { const r = (run_loop($Run$met$((a0)))); (a0); return r; }, 1),
  "Run.with_seed": run_lib((a0, a1) => { const r = (run_loop($Run$with_seed$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_day": run_lib((a0, a1) => { const r = (run_loop($Run$with_day$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_ryo": run_lib((a0, a1) => { const r = (run_loop($Run$with_ryo$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_pos": run_lib((a0, a1) => { const r = (run_loop($Run$with_pos$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_party": run_lib((a0, a1) => { const r = (run_loop($Run$with_party$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_tools": run_lib((a0, a1) => { const r = (run_loop($Run$with_tools$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_arts": run_lib((a0, a1) => { const r = (run_loop($Run$with_arts$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_sealed": run_lib((a0, a1) => { const r = (run_loop($Run$with_sealed$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_act": run_lib((a0, a1) => { const r = (run_loop($Run$with_act$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_map": run_lib((a0, a1) => { const r = (run_loop($Run$with_map$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_bag": run_lib((a0, a1) => { const r = (run_loop($Run$with_bag$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_mode": run_lib((a0, a1) => { const r = (run_loop($Run$with_mode$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_msg": run_lib((a0, a1) => { const r = (run_loop($Run$with_msg$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_wins": run_lib((a0, a1) => { const r = (run_loop($Run$with_wins$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "Run.with_met": run_lib((a0, a1) => { const r = (run_loop($Run$with_met$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "sub0": run_lib((a0, a1) => { const r = (run_loop($sub0$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "pct": run_lib((a0, a1) => { const r = (run_loop($pct$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "u32_max": run_lib((a0, a1) => { const r = (run_loop($u32_max$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "u32_min": run_lib((a0, a1) => { const r = (run_loop($u32_min$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "gt0": run_lib((a0) => { const r = (run_loop($gt0$((a0)))); (a0); return r; }, 1),
  "mix": run_lib((a0) => { const r = (run_loop($mix$((a0)))); (a0); return r; }, 1),
  "roll": run_lib((a0, a1, a2) => { const r = (run_loop($roll$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "chance": run_lib((a0, a1, a2) => { const r = (run_loop($chance$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "len": run_lib((a0) => { const r = (run_loop($len$((a0)))); (a0); return r; }, 1),
  "at_u32": run_lib((a0, a1) => { const r = (run_loop($at_u32$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "has_u32": run_lib((a0, a1) => { const r = (run_loop($has_u32$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "snoc": run_lib((a0, a1) => { const r = (run_loop($snoc$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "who_id": run_lib((a0) => { const r = (run_loop($who_id$((a0)))); (a0); return r; }, 1),
  "who_is": run_lib((a0, a1) => { const r = (run_loop($who_is$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "who_name": run_lib((a0) => { const r = (run_loop($who_name$((a0)))); (a0); return r; }, 1),
  "who_passive": run_lib((a0) => { const r = (run_loop($who_passive$((a0)))); (a0); return r; }, 1),
  "who_passive_desc": run_lib((a0) => { const r = (run_loop($who_passive_desc$((a0)))); (a0); return r; }, 1),
  "who_base": run_lib((a0) => { const r = (run_loop($who_base$((a0)))); (a0); return r; }, 1),
  "who_grow": run_lib((a0) => { const r = (run_loop($who_grow$((a0)))); (a0); return r; }, 1),
  "who_moves": run_lib((a0) => { const r = (run_loop($who_moves$((a0)))); (a0); return r; }, 1),
  "move_id": run_lib((a0) => { const r = (run_loop($move_id$((a0)))); (a0); return r; }, 1),
  "move_basic": run_lib((a0) => { const r = (run_loop($move_basic$((a0)))); (a0); return r; }, 1),
  "mi": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($mi$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "move_info": run_lib((a0) => { const r = (run_loop($move_info$((a0)))); (a0); return r; }, 1),
  "move_nat": run_lib((a0) => { const r = (run_loop($move_nat$((a0)))); (a0); return r; }, 1),
  "move_cd": run_lib((a0) => { const r = (run_loop($move_cd$((a0)))); (a0); return r; }, 1),
  "tool_id": run_lib((a0) => { const r = (run_loop($tool_id$((a0)))); (a0); return r; }, 1),
  "tool_is": run_lib((a0, a1) => { const r = (run_loop($tool_is$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "tool_info": run_lib((a0) => { const r = (run_loop($tool_info$((a0)))); (a0); return r; }, 1),
  "all_tools": run_lib(() => { const r = (run_loop($all_tools$()));  return r; }, 0),
  "art_id": run_lib((a0) => { const r = (run_loop($art_id$((a0)))); (a0); return r; }, 1),
  "art_name": run_lib((a0) => { const r = (run_loop($art_name$((a0)))); (a0); return r; }, 1),
  "art_desc": run_lib((a0) => { const r = (run_loop($art_desc$((a0)))); (a0); return r; }, 1),
  "all_arts": run_lib(() => { const r = (run_loop($all_arts$()));  return r; }, 0),
  "form_relic": run_lib((a0) => { const r = (run_loop($form_relic$((a0)))); (a0); return r; }, 1),
  "has_art": run_lib((a0, a1) => { const r = (run_loop($has_art$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "beast_names": run_lib(() => { const r = (run_loop($beast_names$()));  return r; }, 0),
  "beast_name": run_lib((a0) => { const r = (run_loop($beast_name$((a0)))); (a0); return r; }, 1),
  "beast_title": run_lib((a0) => { const r = (run_loop($beast_title$((a0)))); (a0); return r; }, 1),
  "beast_move_table": run_lib(() => { const r = (run_loop($beast_move_table$()));  return r; }, 0),
  "beast_moves": run_lib((a0) => { const r = (run_loop($beast_moves$((a0)))); (a0); return r; }, 1),
  "foe_info": run_lib((a0) => { const r = (run_loop($foe_info$((a0)))); (a0); return r; }, 1),
  "body_name": run_lib((a0) => { const r = (run_loop($body_name$((a0)))); (a0); return r; }, 1),
  "body_key": run_lib((a0) => { const r = (run_loop($body_key$((a0)))); (a0); return r; }, 1),
  "body_tails": run_lib((a0) => { const r = (run_loop($body_tails$((a0)))); (a0); return r; }, 1),
  "body_is": run_lib((a0, a1) => { const r = (run_loop($body_is$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "bonus_none": run_lib(() => { const r = (run_loop($bonus_none$()));  return r; }, 0),
  "bonus_base": run_lib(() => { const r = (run_loop($bonus_base$()));  return r; }, 0),
  "mul1000": run_lib((a0, a1) => { const r = (run_loop($mul1000$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "haste_add": run_lib((a0, a1) => { const r = (run_loop($haste_add$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "bonus_add": run_lib((a0, a1) => { const r = (run_loop($bonus_add$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "art_bonus": run_lib((a0) => { const r = (run_loop($art_bonus$((a0)))); (a0); return r; }, 1),
  "arts_bonus": run_lib((a0) => { const r = (run_loop($arts_bonus$((a0)))); (a0); return r; }, 1),
  "who_bonus": run_lib((a0) => { const r = (run_loop($who_bonus$((a0)))); (a0); return r; }, 1),
  "form_b": run_lib((a0, a1, a2, a3, a4, a5, a6, a7) => { const r = (run_loop($form_b$((a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7)))); (a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); return r; }, 8),
  "form_list": run_lib((a0) => { const r = (run_loop($form_list$((a0)))); (a0); return r; }, 1),
  "form_none": run_lib(() => { const r = (run_loop($form_none$()));  return r; }, 0),
  "form_info": run_lib((a0, a1) => { const r = (run_loop($form_info$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "form_body": run_lib((a0, a1) => { const r = (run_loop($form_body$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "rarity_name": run_lib((a0) => { const r = (run_loop($rarity_name$((a0)))); (a0); return r; }, 1),
  "tier_name": run_lib((a0) => { const r = (run_loop($tier_name$((a0)))); (a0); return r; }, 1),
  "weapon_family": run_lib((a0) => { const r = (run_loop($weapon_family$((a0)))); (a0); return r; }, 1),
  "weapon_name": run_lib((a0) => { const r = (run_loop($weapon_name$((a0)))); (a0); return r; }, 1),
  "weapon_base": run_lib((a0) => { const r = (run_loop($weapon_base$((a0)))); (a0); return r; }, 1),
  "weapon_atk": run_lib((a0, a1) => { const r = (run_loop($weapon_atk$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "weapon_cap": run_lib((a0) => { const r = (run_loop($weapon_cap$((a0)))); (a0); return r; }, 1),
  "weapon_cost": run_lib((a0, a1) => { const r = (run_loop($weapon_cost$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "owned0": run_lib(() => { const r = (run_loop($owned0$()));  return r; }, 0),
  "owned_at": run_lib((a0, a1) => { const r = (run_loop($owned_at$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "weapon_perk": run_lib((a0) => { const r = (run_loop($weapon_perk$((a0)))); (a0); return r; }, 1),
  "weapon_perk_text": run_lib((a0) => { const r = (run_loop($weapon_perk_text$((a0)))); (a0); return r; }, 1),
  "weapon_bonus": run_lib((a0, a1) => { const r = (run_loop($weapon_bonus$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "owned_weps": run_lib((a0, a1) => { const r = (run_loop($owned_weps$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "species_name": run_lib((a0) => { const r = (run_loop($species_name$((a0)))); (a0); return r; }, 1),
  "summon_name": run_lib((a0) => { const r = (run_loop($summon_name$((a0)))); (a0); return r; }, 1),
  "species_effect": run_lib((a0) => { const r = (run_loop($species_effect$((a0)))); (a0); return r; }, 1),
  "species_action": run_lib((a0) => { const r = (run_loop($species_action$((a0)))); (a0); return r; }, 1),
  "smn_level": run_lib((a0) => { const r = (run_loop($smn_level$((a0)))); (a0); return r; }, 1),
  "smn_kp": run_lib((a0, a1) => { const r = (run_loop($smn_kp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "smn_equip": run_lib((a0, a1) => { const r = (run_loop($smn_equip$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "owned_smns": run_lib((a0, a1) => { const r = (run_loop($owned_smns$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "summon_power": run_lib((a0) => { const r = (run_loop($summon_power$((a0)))); (a0); return r; }, 1),
  "slot_name": run_lib((a0) => { const r = (run_loop($slot_name$((a0)))); (a0); return r; }, 1),
  "grade_name": run_lib((a0) => { const r = (run_loop($grade_name$((a0)))); (a0); return r; }, 1),
  "rar_mult": run_lib((a0) => { const r = (run_loop($rar_mult$((a0)))); (a0); return r; }, 1),
  "star_k": run_lib((a0) => { const r = (run_loop($star_k$((a0)))); (a0); return r; }, 1),
  "kit_base": run_lib((a0, a1) => { const r = (run_loop($kit_base$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "line_table": run_lib(() => { const r = (run_loop($line_table$()));  return r; }, 0),
  "line_val": run_lib((a0, a1) => { const r = (run_loop($line_val$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "stat_name": run_lib((a0) => { const r = (run_loop($stat_name$((a0)))); (a0); return r; }, 1),
  "line_bonus": run_lib((a0) => { const r = (run_loop($line_bonus$((a0)))); (a0); return r; }, 1),
  "lines_bonus": run_lib((a0) => { const r = (run_loop($lines_bonus$((a0)))); (a0); return r; }, 1),
  "kit_one": run_lib((a0, a1) => { const r = (run_loop($kit_one$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "kit_bonus": run_lib((a0, a1) => { const r = (run_loop($kit_bonus$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "will_bonus": run_lib((a0) => { const r = (run_loop($will_bonus$((a0)))); (a0); return r; }, 1),
  "bag_bonus": run_lib((a0) => { const r = (run_loop($bag_bonus$((a0)))); (a0); return r; }, 1),
  "run_bonus": run_lib((a0) => { const r = (run_loop($run_bonus$((a0)))); (a0); return r; }, 1),
  "status0": run_lib(() => { const r = (run_loop($status0$()));  return r; }, 0),
  "body_learns": run_lib((a0) => { const r = (run_loop($body_learns$((a0)))); (a0); return r; }, 1),
  "generic_moves": run_lib(() => { const r = (run_loop($generic_moves$()));  return r; }, 0),
  "gen_count": run_lib(() => { const r = (run_loop($gen_count$()));  return r; }, 0),
  "gen_move": run_lib((a0) => { const r = (run_loop($gen_move$((a0)))); (a0); return r; }, 1),
  "gen_rarity": run_lib((a0) => { const r = (run_loop($gen_rarity$((a0)))); (a0); return r; }, 1),
  "gen_price": run_lib((a0) => { const r = (run_loop($gen_price$((a0)))); (a0); return r; }, 1),
  "gen_in_band": run_lib((a0, a1, a2) => { const r = (run_loop($gen_in_band$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "gen_band": run_lib((a0, a1, a2) => { const r = (run_loop($gen_band$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "gen_offer.go": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($gen_offer$go$(nat_host(a0), (a1), (a2), (a3), (a4)))); BigInt(a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "gen_offer": run_lib((a0, a1, a2) => { const r = (run_loop($gen_offer$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "mk_fighter": run_lib((a0, a1, a2, a3, a4, a5, a6, a7) => { const r = (run_loop($mk_fighter$((a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7)))); (a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); return r; }, 8),
  "dummy_fighter": run_lib(() => { const r = (run_loop($dummy_fighter$()));  return r; }, 0),
  "training_dummy": run_lib((a0) => { const r = (run_loop($training_dummy$((a0)))); (a0); return r; }, 1),
  "member_stats": run_lib((a0, a1) => { const r = (run_loop($member_stats$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "kit_merge": run_lib((a0, a1) => { const r = (run_loop($kit_merge$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "member_kit": run_lib((a0) => { const r = (run_loop($member_kit$((a0)))); (a0); return r; }, 1),
  "member_fighter": run_lib((a0, a1, a2) => { const r = (run_loop($member_fighter$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "party_fighters": run_lib((a0, a1, a2) => { const r = (run_loop($party_fighters$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "foe_fighter": run_lib((a0, a1) => { const r = (run_loop($foe_fighter$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "foe_fighters": run_lib((a0, a1) => { const r = (run_loop($foe_fighters$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "foe_mult": run_lib((a0, a1, a2) => { const r = (run_loop($foe_mult$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "mul_k": run_lib((a0, a1) => { const r = (run_loop($mul_k$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "scale_foes": run_lib((a0, a1, a2) => { const r = (run_loop($scale_foes$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "act_foes": run_lib((a0, a1, a2) => { const r = (run_loop($act_foes$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "beast_fighter": run_lib((a0) => { const r = (run_loop($beast_fighter$((a0)))); (a0); return r; }, 1),
  "f_alive": run_lib((a0) => { const r = (run_loop($f_alive$((a0)))); (a0); return r; }, 1),
  "f_name": run_lib((a0) => { const r = (run_loop($f_name$((a0)))); (a0); return r; }, 1),
  "f_party": run_lib((a0) => { const r = (run_loop($f_party$((a0)))); (a0); return r; }, 1),
  "fbon": run_lib((a0) => { const r = (run_loop($fbon$((a0)))); (a0); return r; }, 1),
  "sget": run_lib((a0, a1) => { const r = (run_loop($sget$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "sset": run_lib((a0, a1, a2) => { const r = (run_loop($sset$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "f_guts": run_lib((a0) => { const r = (run_loop($f_guts$((a0)))); (a0); return r; }, 1),
  "f_with_guts": run_lib((a0, a1) => { const r = (run_loop($f_with_guts$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "st_merge": run_lib((a0, a1, a2) => { const r = (run_loop($st_merge$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "st_is_stun": run_lib((a0) => { const r = (run_loop($st_is_stun$((a0)))); (a0); return r; }, 1),
  "stat_val": run_lib((a0, a1) => { const r = (run_loop($stat_val$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "stat_is_atk": run_lib((a0) => { const r = (run_loop($stat_is_atk$((a0)))); (a0); return r; }, 1),
  "atk_total": run_lib((a0, a1) => { const r = (run_loop($atk_total$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "dot_power": run_lib((a0) => { const r = (run_loop($dot_power$((a0)))); (a0); return r; }, 1),
  "delay": run_lib((a0) => { const r = (run_loop($delay$((a0)))); (a0); return r; }, 1),
  "fget": run_lib((a0, a1) => { const r = (run_loop($fget$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "bf": run_lib((a0, a1) => { const r = (run_loop($bf$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "bset": run_lib((a0, a1, a2) => { const r = (run_loop($bset$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "blog": run_lib((a0, a1) => { const r = (run_loop($blog$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "clear_log": run_lib((a0) => { const r = (run_loop($clear_log$((a0)))); (a0); return r; }, 1),
  "keep_idx": run_lib((a0, a1, a2) => { const r = (run_loop($keep_idx$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "side_alive.go": run_lib((a0, a1, a2) => { const r = (run_loop($side_alive$go$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "side_alive": run_lib((a0, a1) => { const r = (run_loop($side_alive$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "any_alive": run_lib((a0, a1) => { const r = (run_loop($any_alive$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "pick_alive": run_lib((a0, a1, a2, a3) => { const r = (run_loop($pick_alive$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "gain_ck": run_lib((a0, a1, a2) => { const r = (run_loop($gain_ck$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "gain_ck_log": run_lib((a0, a1, a2, a3) => { const r = (run_loop($gain_ck_log$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "retarget": run_lib((a0, a1, a2, a3) => { const r = (run_loop($retarget$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "ally_or_self": run_lib((a0, a1, a2) => { const r = (run_loop($ally_or_self$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "targets": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($targets$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "tgt_offensive": run_lib((a0) => { const r = (run_loop($tgt_offensive$((a0)))); (a0); return r; }, 1),
  "dot_set": run_lib((a0, a1, a2) => { const r = (run_loop($dot_set$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "give.go": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($give$go$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "give": run_lib((a0, a1, a2, a3, a4, a5, a6, a7) => { const r = (run_loop($give$((a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7)))); (a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); return r; }, 8),
  "combo_by_key": run_lib((a0) => { const r = (run_loop($combo_by_key$((a0)))); (a0); return r; }, 1),
  "combo_of": run_lib((a0, a1) => { const r = (run_loop($combo_of$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "combo_name": run_lib((a0) => { const r = (run_loop($combo_name$((a0)))); (a0); return r; }, 1),
  "combo_mult": run_lib((a0) => { const r = (run_loop($combo_mult$((a0)))); (a0); return r; }, 1),
  "combo_pen": run_lib((a0) => { const r = (run_loop($combo_pen$((a0)))); (a0); return r; }, 1),
  "nature_name": run_lib((a0) => { const r = (run_loop($nature_name$((a0)))); (a0); return r; }, 1),
  "live_mark": run_lib((a0, a1) => { const r = (run_loop($live_mark$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "combo_log": run_lib((a0, a1, a2) => { const r = (run_loop($combo_log$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "set_mark": run_lib((a0, a1, a2, a3) => { const r = (run_loop($set_mark$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "combo_fx": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($combo_fx$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "is_boss": run_lib((a0) => { const r = (run_loop($is_boss$((a0)))); (a0); return r; }, 1),
  "fd_apply": run_lib((a0, a1) => { const r = (run_loop($fd_apply$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "calc_dmg": run_lib((a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) => { const r = (run_loop($calc_dmg$((a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7), (a8), (a9)))); (a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); (a8); (a9); return r; }, 10),
  "hurt.go": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($hurt$go$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "hurt": run_lib((a0, a1, a2, a3) => { const r = (run_loop($hurt$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "hurt_pair": run_lib((a0, a1, a2) => { const r = (run_loop($hurt_pair$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "outcome": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($outcome$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "shark_skin": run_lib((a0, a1, a2) => { const r = (run_loop($shark_skin$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "naked": run_lib((a0) => { const r = (run_loop($naked$((a0)))); (a0); return r; }, 1),
  "incoming.go": run_lib((a0, a1, a2, a3, a4, a5, a6, a7, a8) => { const r = (run_loop($incoming$go$((a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7), (a8)))); (a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); (a8); return r; }, 9),
  "land_hit": run_lib((a0, a1, a2, a3, a4, a5, a6, a7) => { const r = (run_loop($land_hit$((a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7)))); (a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); return r; }, 8),
  "hit.do": run_lib((a0, a1, a2, a3, a4, a5, a6, a7, a8) => { const r = (run_loop($hit$do$((a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7), (a8)))); (a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); (a8); return r; }, 9),
  "hits": run_lib((a0, a1, a2, a3, a4, a5, a6, a7, a8) => { const r = (run_loop($hits$(nat_host(a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7), (a8)))); BigInt(a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); (a8); return r; }, 9),
  "heal.go": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($heal$go$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "heal": run_lib((a0, a1, a2, a3) => { const r = (run_loop($heal$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "drain": run_lib((a0, a1, a2, a3) => { const r = (run_loop($drain$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "cleanse": run_lib((a0, a1) => { const r = (run_loop($cleanse$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "revive.go": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($revive$go$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "revive": run_lib((a0, a1, a2) => { const r = (run_loop($revive$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "apply_eff": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($apply_eff$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "run_effs": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($run_effs$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "run_targets": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($run_targets$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "move_is": run_lib((a0, a1) => { const r = (run_loop($move_is$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "lee_strike": run_lib(() => { const r = (run_loop($lee_strike$()));  return r; }, 0),
  "actor_info": run_lib((a0, a1) => { const r = (run_loop($actor_info$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "knows": run_lib((a0, a1, a2) => { const r = (run_loop($knows$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "move_slot": run_lib((a0, a1, a2) => { const r = (run_loop($move_slot$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "f_learns": run_lib((a0) => { const r = (run_loop($f_learns$((a0)))); (a0); return r; }, 1),
  "f_slot": run_lib((a0, a1) => { const r = (run_loop($f_slot$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "f_cd": run_lib((a0, a1) => { const r = (run_loop($f_cd$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "can_jutsu": run_lib((a0, a1) => { const r = (run_loop($can_jutsu$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "pay": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($pay$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "perform": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($perform$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "chain_update": run_lib((a0, a1, a2, a3) => { const r = (run_loop($chain_update$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "chain_pct": run_lib((a0, a1, a2) => { const r = (run_loop($chain_pct$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "jutsu_mul": run_lib((a0, a1) => { const r = (run_loop($jutsu_mul$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "use_move": run_lib((a0, a1, a2, a3) => { const r = (run_loop($use_move$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "use_tool": run_lib((a0, a1, a2, a3) => { const r = (run_loop($use_tool$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "act_start": run_lib((a0) => { const r = (run_loop($act_start$((a0)))); (a0); return r; }, 1),
  "body_moves": run_lib((a0) => { const r = (run_loop($body_moves$((a0)))); (a0); return r; }, 1),
  "ai_move": run_lib((a0, a1, a2) => { const r = (run_loop($ai_move$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "weakest.go": run_lib((a0, a1, a2, a3) => { const r = (run_loop($weakest$go$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "ai_target": run_lib((a0, a1, a2, a3) => { const r = (run_loop($ai_target$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "copy_ninja.go": run_lib((a0, a1, a2) => { const r = (run_loop($copy_ninja$go$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "enemy_turn": run_lib((a0, a1) => { const r = (run_loop($enemy_turn$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "phase_over": run_lib((a0) => { const r = (run_loop($phase_over$((a0)))); (a0); return r; }, 1),
  "check_end.go": run_lib((a0, a1, a2, a3) => { const r = (run_loop($check_end$go$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "check_end": run_lib((a0) => { const r = (run_loop($check_end$((a0)))); (a0); return r; }, 1),
  "dot.go": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($dot$go$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "burn_tick": run_lib((a0, a1) => { const r = (run_loop($burn_tick$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "poison_tick": run_lib((a0, a1) => { const r = (run_loop($poison_tick$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "dec_all": run_lib((a0) => { const r = (run_loop($dec_all$((a0)))); (a0); return r; }, 1),
  "form_tick.go": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($form_tick$go$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "form_tick": run_lib((a0, a1) => { const r = (run_loop($form_tick$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "turn_start": run_lib((a0, a1) => { const r = (run_loop($turn_start$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "step.turn": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($step$turn$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "step.pop": run_lib((a0, a1) => { const r = (run_loop($step$pop$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "next_actor.go": run_lib((a0, a1, a2, a3) => { const r = (run_loop($next_actor$go$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "next_actor": run_lib((a0) => { const r = (run_loop($next_actor$((a0)))); (a0); return r; }, 1),
  "summon_move": run_lib((a0) => { const r = (run_loop($summon_move$((a0)))); (a0); return r; }, 1),
  "summon_act": run_lib((a0) => { const r = (run_loop($summon_act$((a0)))); (a0); return r; }, 1),
  "step.summon": run_lib((a0, a1) => { const r = (run_loop($step$summon$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "step.go": run_lib((a0, a1) => { const r = (run_loop($step$go$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "step": run_lib((a0) => { const r = (run_loop($step$((a0)))); (a0); return r; }, 1),
  "advance": run_lib((a0, a1) => { const r = (run_loop($advance$(nat_host(a0), (a1)))); BigInt(a0); (a1); return r; }, 2),
  "open.one": run_lib((a0, a1, a2) => { const r = (run_loop($open$one$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "open.go": run_lib((a0, a1, a2) => { const r = (run_loop($open$go$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "has_body.go": run_lib((a0, a1, a2) => { const r = (run_loop($has_body$go$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "open.say": run_lib((a0, a1) => { const r = (run_loop($open$say$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "init_timers": run_lib((a0) => { const r = (run_loop($init_timers$((a0)))); (a0); return r; }, 1),
  "battle_open": run_lib((a0) => { const r = (run_loop($battle_open$((a0)))); (a0); return r; }, 1),
  "new_battle": run_lib((a0, a1, a2, a3, a4, a5, a6, a7) => { const r = (run_loop($new_battle$((a0), (a1), (a2), (a3), (a4), (a5), (a6), (a7)))); (a0); (a1); (a2); (a3); (a4); (a5); (a6); (a7); return r; }, 8),
  "transform": run_lib((a0, a1) => { const r = (run_loop($transform$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "act_cmd": run_lib((a0, a1, a2) => { const r = (run_loop($act_cmd$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "battle_input.go": run_lib((a0, a1, a2) => { const r = (run_loop($battle_input$go$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "battle_input": run_lib((a0, a1) => { const r = (run_loop($battle_input$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "battle_next.go": run_lib((a0, a1) => { const r = (run_loop($battle_next$go$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "battle_next": run_lib((a0) => { const r = (run_loop($battle_next$((a0)))); (a0); return r; }, 1),
  "new_member": run_lib((a0, a1, a2) => { const r = (run_loop($new_member$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "sealed_count": run_lib((a0) => { const r = (run_loop($sealed_count$((a0)))); (a0); return r; }, 1),
  "max_level": run_lib((a0) => { const r = (run_loop($max_level$((a0)))); (a0); return r; }, 1),
  "sum_level": run_lib((a0) => { const r = (run_loop($sum_level$((a0)))); (a0); return r; }, 1),
  "avg_level": run_lib((a0) => { const r = (run_loop($avg_level$((a0)))); (a0); return r; }, 1),
  "in_party": run_lib((a0, a1) => { const r = (run_loop($in_party$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "member_max": run_lib((a0, a1) => { const r = (run_loop($member_max$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "heal_members": run_lib((a0, a1, a2) => { const r = (run_loop($heal_members$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "heal_party": run_lib((a0, a1) => { const r = (run_loop($heal_party$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "xp_need": run_lib((a0) => { const r = (run_loop($xp_need$((a0)))); (a0); return r; }, 1),
  "lvl_loop": run_lib((a0, a1, a2) => { const r = (run_loop($lvl_loop$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "gain_xp": run_lib((a0, a1, a2) => { const r = (run_loop($gain_xp$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "gain_all": run_lib((a0, a1, a2) => { const r = (run_loop($gain_all$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "write_back": run_lib((a0, a1, a2) => { const r = (run_loop($write_back$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "body_xp": run_lib((a0, a1) => { const r = (run_loop($body_xp$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "body_ryo": run_lib((a0, a1) => { const r = (run_loop($body_ryo$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "sum_xp": run_lib((a0) => { const r = (run_loop($sum_xp$((a0)))); (a0); return r; }, 1),
  "sum_ryo": run_lib((a0) => { const r = (run_loop($sum_ryo$((a0)))); (a0); return r; }, 1),
  "has_tool": run_lib((a0, a1) => { const r = (run_loop($has_tool$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "remove_tool": run_lib((a0, a1) => { const r = (run_loop($remove_tool$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "act_boss": run_lib((a0) => { const r = (run_loop($act_boss$((a0)))); (a0); return r; }, 1),
  "act_name": run_lib((a0) => { const r = (run_loop($act_name$((a0)))); (a0); return r; }, 1),
  "floor_of": run_lib((a0) => { const r = (run_loop($floor_of$((a0)))); (a0); return r; }, 1),
  "threat": run_lib((a0) => { const r = (run_loop($threat$((a0)))); (a0); return r; }, 1),
  "rank_name": run_lib((a0) => { const r = (run_loop($rank_name$((a0)))); (a0); return r; }, 1),
  "minion_table": run_lib(() => { const r = (run_loop($minion_table$()));  return r; }, 0),
  "minion_pool": run_lib((a0) => { const r = (run_loop($minion_pool$((a0)))); (a0); return r; }, 1),
  "elite_table": run_lib(() => { const r = (run_loop($elite_table$()));  return r; }, 0),
  "all_foes": run_lib(() => { const r = (run_loop($all_foes$()));  return r; }, 0),
  "pick_foe": run_lib((a0, a1, a2) => { const r = (run_loop($pick_foe$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "foe_name": run_lib((a0) => { const r = (run_loop($foe_name$((a0)))); (a0); return r; }, 1),
  "has_name": run_lib((a0, a1) => { const r = (run_loop($has_name$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "fresh_foes": run_lib((a0, a1) => { const r = (run_loop($fresh_foes$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "names_of": run_lib((a0) => { const r = (run_loop($names_of$((a0)))); (a0); return r; }, 1),
  "pick_unique": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($pick_unique$(nat_host(a0), (a1), (a2), (a3), (a4), (a5)))); BigInt(a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "fresh_groups": run_lib((a0, a1) => { const r = (run_loop($fresh_groups$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "elite_pick": run_lib((a0, a1, a2, a3) => { const r = (run_loop($elite_pick$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "fight_size": run_lib((a0, a1, a2) => { const r = (run_loop($fight_size$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "mission_lvl": run_lib((a0, a1) => { const r = (run_loop($mission_lvl$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "mission_rank": run_lib((a0, a1) => { const r = (run_loop($mission_rank$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "cell0": run_lib(() => { const r = (run_loop($cell0$()));  return r; }, 0),
  "cell_at": run_lib((a0, a1) => { const r = (run_loop($cell_at$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "set_cell": run_lib((a0, a1, a2) => { const r = (run_loop($set_cell$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "map_step": run_lib((a0, a1, a2) => { const r = (run_loop($map_step$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "walk": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($walk$(nat_host(a0), (a1), (a2), (a3), (a4), (a5)))); BigInt(a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "paths": run_lib((a0, a1, a2, a3) => { const r = (run_loop($paths$(nat_host(a0), (a1), (a2), (a3)))); BigInt(a0); (a1); (a2); (a3); return r; }, 4),
  "fixed_kind": run_lib((a0) => { const r = (run_loop($fixed_kind$((a0)))); (a0); return r; }, 1),
  "count_open": run_lib((a0, a1) => { const r = (run_loop($count_open$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "rate": run_lib((a0, a1) => { const r = (run_loop($rate$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "drop_u32": run_lib((a0, a1) => { const r = (run_loop($drop_u32$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "shuffle": run_lib((a0, a1, a2, a3) => { const r = (run_loop($shuffle$(nat_host(a0), (a1), (a2), (a3)))); BigInt(a0); (a1); (a2); (a3); return r; }, 4),
  "room_list": run_lib((a0, a1) => { const r = (run_loop($room_list$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "parents": run_lib((a0, a1, a2, a3) => { const r = (run_loop($parents$(nat_host(a0), (a1), (a2), (a3)))); BigInt(a0); (a1); (a2); (a3); return r; }, 4),
  "kinds_has": run_lib((a0, a1, a2) => { const r = (run_loop($kinds_has$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "kids": run_lib((a0, a1) => { const r = (run_loop($kids$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "without": run_lib((a0, a1) => { const r = (run_loop($without$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "room_ok": run_lib((a0, a1, a2) => { const r = (run_loop($room_ok$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "first_ok": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($first_ok$(nat_host(a0), (a1), (a2), (a3), (a4)))); BigInt(a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "pick_room": run_lib((a0, a1, a2, a3) => { const r = (run_loop($pick_room$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "assign_sts": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($assign_sts$(nat_host(a0), (a1), (a2), (a3), (a4), (a5)))); BigInt(a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "first_used": run_lib((a0, a1, a2) => { const r = (run_loop($first_used$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "place_story": run_lib((a0, a1, a2, a3) => { const r = (run_loop($place_story$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "gen_map": run_lib((a0, a1, a2) => { const r = (run_loop($gen_map$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "floor0": run_lib((a0, a1) => { const r = (run_loop($floor0$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "next_cells": run_lib((a0) => { const r = (run_loop($next_cells$((a0)))); (a0); return r; }, 1),
  "start_battle": run_lib((a0, a1, a2, a3) => { const r = (run_loop($start_battle$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "mission_battle": run_lib((a0, a1, a2) => { const r = (run_loop($mission_battle$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "elite_battle": run_lib((a0) => { const r = (run_loop($elite_battle$((a0)))); (a0); return r; }, 1),
  "heal_cost": run_lib((a0) => { const r = (run_loop($heal_cost$((a0)))); (a0); return r; }, 1),
  "mode_free": run_lib((a0) => { const r = (run_loop($mode_free$((a0)))); (a0); return r; }, 1),
  "in_village": run_lib((a0) => { const r = (run_loop($in_village$((a0)))); (a0); return r; }, 1),
  "on_map": run_lib((a0) => { const r = (run_loop($on_map$((a0)))); (a0); return r; }, 1),
  "to_map": run_lib((a0, a1) => { const r = (run_loop($to_map$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "set_battle": run_lib((a0, a1) => { const r = (run_loop($set_battle$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "cmd_tool": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($cmd_tool$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "cmd_do": run_lib((a0, a1, a2, a3) => { const r = (run_loop($cmd_do$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "cmd_phase": run_lib((a0, a1, a2, a3) => { const r = (run_loop($cmd_phase$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "cmd_mode": run_lib((a0, a1, a2) => { const r = (run_loop($cmd_mode$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "count_art": run_lib((a0, a1) => { const r = (run_loop($count_art$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "under_cap": run_lib((a0, a1) => { const r = (run_loop($under_cap$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "party_relics": run_lib((a0, a1) => { const r = (run_loop($party_relics$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "take_rand": run_lib((a0, a1, a2, a3) => { const r = (run_loop($take_rand$(nat_host(a0), (a1), (a2), (a3)))); BigInt(a0); (a1); (a2); (a3); return r; }, 4),
  "loot_must": run_lib((a0) => { const r = (run_loop($loot_must$((a0)))); (a0); return r; }, 1),
  "any_must": run_lib((a0) => { const r = (run_loop($any_must$((a0)))); (a0); return r; }, 1),
  "loot": run_lib((a0, a1, a2) => { const r = (run_loop($loot$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "will_offer": run_lib((a0, a1) => { const r = (run_loop($will_offer$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "train_items": run_lib((a0, a1, a2) => { const r = (run_loop($train_items$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "relic_opts": run_lib((a0) => { const r = (run_loop($relic_opts$((a0)))); (a0); return r; }, 1),
  "relic_loot": run_lib((a0) => { const r = (run_loop($relic_loot$((a0)))); (a0); return r; }, 1),
  "offer": run_lib((a0, a1) => { const r = (run_loop($offer$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "next_act": run_lib((a0, a1, a2) => { const r = (run_loop($next_act$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "win.beast": run_lib((a0, a1, a2, a3) => { const r = (run_loop($win$beast$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "win.job": run_lib((a0, a1, a2, a3) => { const r = (run_loop($win$job$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "battle_scrolls": run_lib((a0, a1) => { const r = (run_loop($battle_scrolls$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "wallet_add": run_lib((a0, a1, a2) => { const r = (run_loop($wallet_add$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "wallet_sub": run_lib((a0, a1, a2) => { const r = (run_loop($wallet_sub$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "wallet_get": run_lib((a0, a1) => { const r = (run_loop($wallet_get$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "battle_cash": run_lib((a0, a1, a2) => { const r = (run_loop($battle_cash$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "win.items": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($win$items$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "win.go": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($win$go$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "win": run_lib((a0, a1) => { const r = (run_loop($win$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "next_phase": run_lib((a0, a1, a2) => { const r = (run_loop($next_phase$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "next_mode": run_lib((a0, a1) => { const r = (run_loop($next_mode$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "v_heal.go": run_lib((a0, a1, a2) => { const r = (run_loop($v_heal$go$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "v_heal": run_lib((a0) => { const r = (run_loop($v_heal$((a0)))); (a0); return r; }, 1),
  "v_buy.go": run_lib((a0, a1, a2, a3) => { const r = (run_loop($v_buy$go$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "v_buy": run_lib((a0, a1) => { const r = (run_loop($v_buy$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "v_leave": run_lib((a0, a1) => { const r = (run_loop($v_leave$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "train.go": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($train$go$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "train": run_lib((a0, a1, a2) => { const r = (run_loop($train$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "new_bag": run_lib(() => { const r = (run_loop($new_bag$()));  return r; }, 0),
  "set_u32": run_lib((a0, a1, a2) => { const r = (run_loop($set_u32$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "set_owned": run_lib((a0, a1, a2) => { const r = (run_loop($set_owned$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "add_copy": run_lib((a0, a1) => { const r = (run_loop($add_copy$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "kit_at": run_lib((a0, a1) => { const r = (run_loop($kit_at$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "member_at": run_lib((a0, a1) => { const r = (run_loop($member_at$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "bag_cash": run_lib((a0) => { const r = (run_loop($bag_cash$((a0)))); (a0); return r; }, 1),
  "with_cash": run_lib((a0, a1) => { const r = (run_loop($with_cash$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "odds_table": run_lib(() => { const r = (run_loop($odds_table$()));  return r; }, 0),
  "summon_level": run_lib((a0) => { const r = (run_loop($summon_level$((a0)))); (a0); return r; }, 1),
  "odds_band": run_lib((a0) => { const r = (run_loop($odds_band$((a0)))); (a0); return r; }, 1),
  "summon_odds": run_lib((a0) => { const r = (run_loop($summon_odds$((a0)))); (a0); return r; }, 1),
  "pick_rarity": run_lib((a0, a1, a2, a3) => { const r = (run_loop($pick_rarity$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "roll_rarity": run_lib((a0, a1, a2, a3) => { const r = (run_loop($roll_rarity$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "roll_tier": run_lib((a0, a1) => { const r = (run_loop($roll_tier$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "give_weapon": run_lib((a0, a1, a2) => { const r = (run_loop($give_weapon$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "contract_rank": run_lib((a0) => { const r = (run_loop($contract_rank$((a0)))); (a0); return r; }, 1),
  "give_contract": run_lib((a0, a1, a2) => { const r = (run_loop($give_contract$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "give_gear": run_lib((a0, a1, a2) => { const r = (run_loop($give_gear$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "pull_one": run_lib((a0, a1, a2, a3) => { const r = (run_loop($pull_one$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "pull_n": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($pull_n$(nat_host(a0), (a1), (a2), (a3), (a4)))); BigInt(a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "do_pull.go": run_lib((a0, a1, a2, a3) => { const r = (run_loop($do_pull$go$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "do_pull": run_lib((a0, a1, a2) => { const r = (run_loop($do_pull$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "equip": run_lib((a0, a1, a2) => { const r = (run_loop($equip$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "enhance": run_lib((a0, a1) => { const r = (run_loop($enhance$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "awaken": run_lib((a0, a1) => { const r = (run_loop($awaken$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "fuse": run_lib((a0, a1) => { const r = (run_loop($fuse$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "set_summon": run_lib((a0, a1, a2) => { const r = (run_loop($set_summon$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "infuse_cost": run_lib((a0) => { const r = (run_loop($infuse_cost$((a0)))); (a0); return r; }, 1),
  "infuse_odds": run_lib((a0) => { const r = (run_loop($infuse_odds$((a0)))); (a0); return r; }, 1),
  "infuse": run_lib((a0, a1) => { const r = (run_loop($infuse$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "gen_pool": run_lib(() => { const r = (run_loop($gen_pool$()));  return r; }, 0),
  "slot_special": run_lib((a0) => { const r = (run_loop($slot_special$((a0)))); (a0); return r; }, 1),
  "roll_line": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($roll_line$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "roll_lines": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($roll_lines$(nat_host(a0), (a1), (a2), (a3), (a4), (a5)))); BigInt(a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "ins_up": run_lib((a0) => { const r = (run_loop($ins_up$((a0)))); (a0); return r; }, 1),
  "inscribe": run_lib((a0, a1) => { const r = (run_loop($inscribe$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "will_up": run_lib((a0, a1) => { const r = (run_loop($will_up$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "aff_grade": run_lib((a0) => { const r = (run_loop($aff_grade$((a0)))); (a0); return r; }, 1),
  "aff_line": run_lib((a0, a1) => { const r = (run_loop($aff_line$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "attune.lines": run_lib((a0, a1, a2, a3) => { const r = (run_loop($attune$lines$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "attune": run_lib((a0, a1) => { const r = (run_loop($attune$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "card_name": run_lib((a0) => { const r = (run_loop($card_name$((a0)))); (a0); return r; }, 1),
  "card_amount": run_lib((a0) => { const r = (run_loop($card_amount$((a0)))); (a0); return r; }, 1),
  "bump_cards": run_lib((a0, a1, a2, a3) => { const r = (run_loop($bump_cards$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "pick_card": run_lib((a0, a1) => { const r = (run_loop($pick_card$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "ground_name": run_lib((a0) => { const r = (run_loop($ground_name$((a0)))); (a0); return r; }, 1),
  "ground": run_lib((a0, a1) => { const r = (run_loop($ground$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "trig_ok": run_lib((a0, a1, a2) => { const r = (run_loop($trig_ok$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "form_next": run_lib((a0, a1) => { const r = (run_loop($form_next$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "forms_all": run_lib((a0, a1) => { const r = (run_loop($forms_all$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "form_news": run_lib((a0, a1) => { const r = (run_loop($form_news$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "check_forms": run_lib((a0) => { const r = (run_loop($check_forms$((a0)))); (a0); return r; }, 1),
  "scroll_name": run_lib((a0) => { const r = (run_loop($scroll_name$((a0)))); (a0); return r; }, 1),
  "teach": run_lib((a0, a1, a2, a3) => { const r = (run_loop($teach$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "train_slot": run_lib((a0, a1, a2, a3) => { const r = (run_loop($train_slot$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "will_pick": run_lib((a0, a1) => { const r = (run_loop($will_pick$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "line_key": run_lib((a0) => { const r = (run_loop($line_key$((a0)))); (a0); return r; }, 1),
  "weakest_line": run_lib((a0, a1, a2, a3) => { const r = (run_loop($weakest_line$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "aff_set": run_lib((a0, a1) => { const r = (run_loop($aff_set$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "tech_slot": run_lib((a0, a1, a2) => { const r = (run_loop($tech_slot$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "knower": run_lib((a0, a1, a2) => { const r = (run_loop($knower$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "learn.go": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($learn$go$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "learn_or_level": run_lib((a0, a1, a2, a3) => { const r = (run_loop($learn_or_level$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "claim": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($claim$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "drop_loot": run_lib((a0, a1) => { const r = (run_loop($drop_loot$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "loot_claim": run_lib((a0, a1, a2, a3, a4, a5) => { const r = (run_loop($loot_claim$((a0), (a1), (a2), (a3), (a4), (a5)))); (a0); (a1); (a2); (a3); (a4); (a5); return r; }, 6),
  "loot_skip": run_lib((a0, a1, a2) => { const r = (run_loop($loot_skip$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "loot_leave": run_lib((a0, a1) => { const r = (run_loop($loot_leave$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "scroll_items": run_lib((a0) => { const r = (run_loop($scroll_items$((a0)))); (a0); return r; }, 1),
  "will_items": run_lib((a0, a1, a2) => { const r = (run_loop($will_items$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "aff_items": run_lib((a0, a1, a2) => { const r = (run_loop($aff_items$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "in_loot": run_lib((a0) => { const r = (run_loop($in_loot$((a0)))); (a0); return r; }, 1),
  "settle.loot": run_lib((a0, a1, a2) => { const r = (run_loop($settle$loot$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "settle": run_lib((a0) => { const r = (run_loop($settle$((a0)))); (a0); return r; }, 1),
  "best_grade": run_lib((a0, a1, a2) => { const r = (run_loop($best_grade$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "fuse_n": run_lib((a0, a1, a2) => { const r = (run_loop($fuse_n$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "fuse_all": run_lib((a0, a1, a2) => { const r = (run_loop($fuse_all$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "awaken_n": run_lib((a0, a1, a2) => { const r = (run_loop($awaken_n$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "enhance_n": run_lib((a0, a1, a2) => { const r = (run_loop($enhance_n$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "equip_all": run_lib((a0, a1, a2, a3) => { const r = (run_loop($equip_all$(nat_host(a0), (a1), (a2), (a3)))); BigInt(a0); (a1); (a2); (a3); return r; }, 4),
  "best_smn": run_lib((a0, a1, a2, a3, a4, a5, a6) => { const r = (run_loop($best_smn$(nat_host(a0), (a1), (a2), (a3), (a4), (a5), (a6)))); BigInt(a0); (a1); (a2); (a3); (a4); (a5); (a6); return r; }, 7),
  "auto_summons": run_lib((a0) => { const r = (run_loop($auto_summons$((a0)))); (a0); return r; }, 1),
  "infuse_safe": run_lib((a0, a1) => { const r = (run_loop($infuse_safe$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "infuse_n": run_lib((a0, a1, a2) => { const r = (run_loop($infuse_n$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "inscribe_first": run_lib((a0, a1) => { const r = (run_loop($inscribe_first$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "gear_all": run_lib((a0, a1, a2) => { const r = (run_loop($gear_all$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "scrolls.go": run_lib((a0, a1, a2, a3) => { const r = (run_loop($scrolls$go$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "open_scrolls": run_lib((a0) => { const r = (run_loop($open_scrolls$((a0)))); (a0); return r; }, 1),
  "best_card": run_lib((a0, a1, a2, a3) => { const r = (run_loop($best_card$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "auto_log": run_lib((a0) => { const r = (run_loop($auto_log$((a0)))); (a0); return r; }, 1),
  "auto_core": run_lib((a0) => { const r = (run_loop($auto_core$((a0)))); (a0); return r; }, 1),
  "auto.go": run_lib((a0, a1) => { const r = (run_loop($auto$go$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "auto_kit": run_lib((a0) => { const r = (run_loop($auto_kit$((a0)))); (a0); return r; }, 1),
  "shop_stock": run_lib((a0) => { const r = (run_loop($shop_stock$((a0)))); (a0); return r; }, 1),
  "relic_price": run_lib((a0) => { const r = (run_loop($relic_price$((a0)))); (a0); return r; }, 1),
  "v_jutsu": run_lib((a0, a1, a2, a3, a4) => { const r = (run_loop($v_jutsu$((a0), (a1), (a2), (a3), (a4)))); (a0); (a1); (a2); (a3); (a4); return r; }, 5),
  "v_art": run_lib((a0, a1, a2) => { const r = (run_loop($v_art$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "rest_train": run_lib((a0, a1, a2, a3) => { const r = (run_loop($rest_train$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "node_k": run_lib((a0) => { const r = (run_loop($node_k$((a0)))); (a0); return r; }, 1),
  "village_name": run_lib((a0) => { const r = (run_loop($village_name$((a0)))); (a0); return r; }, 1),
  "ev_count": run_lib(() => { const r = (run_loop($ev_count$()));  return r; }, 0),
  "ev_fresh": run_lib((a0, a1, a2) => { const r = (run_loop($ev_fresh$(nat_host(a0), (a1), (a2)))); BigInt(a0); (a1); (a2); return r; }, 3),
  "pick_event": run_lib((a0) => { const r = (run_loop($pick_event$((a0)))); (a0); return r; }, 1),
  "arrive.go": run_lib((a0, a1, a2) => { const r = (run_loop($arrive$go$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "travel": run_lib((a0, a1) => { const r = (run_loop($travel$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "ev_kind": run_lib((a0) => { const r = (run_loop($ev_kind$((a0)))); (a0); return r; }, 1),
  "event_title": run_lib((a0) => { const r = (run_loop($event_title$((a0)))); (a0); return r; }, 1),
  "event_text": run_lib((a0) => { const r = (run_loop($event_text$((a0)))); (a0); return r; }, 1),
  "event_choices": run_lib((a0) => { const r = (run_loop($event_choices$((a0)))); (a0); return r; }, 1),
  "hurt_members": run_lib((a0, a1, a2) => { const r = (run_loop($hurt_members$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "hurt_party": run_lib((a0, a1) => { const r = (run_loop($hurt_party$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "sp_members": run_lib((a0, a1) => { const r = (run_loop($sp_members$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "add_cash": run_lib((a0, a1, a2) => { const r = (run_loop($add_cash$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "fight_or.go": run_lib((a0, a1, a2, a3) => { const r = (run_loop($fight_or$go$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "give_art": run_lib((a0, a1) => { const r = (run_loop($give_art$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "ev_resolve": run_lib((a0, a1, a2, a3) => { const r = (run_loop($ev_resolve$((a0), (a1), (a2), (a3)))); (a0); (a1); (a2); (a3); return r; }, 4),
  "rest_choose": run_lib((a0, a1) => { const r = (run_loop($rest_choose$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "choose": run_lib((a0, a1, a2) => { const r = (run_loop($choose$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "spar_battle": run_lib((a0, a1, a2) => { const r = (run_loop($spar_battle$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "edp_battle": run_lib((a0, a1, a2) => { const r = (run_loop($edp_battle$((a0), (a1), (a2)))); (a0); (a1); (a2); return r; }, 3),
  "new_run": run_lib((a0) => { const r = (run_loop($new_run$((a0)))); (a0); return r; }, 1),
  "squad_members": run_lib((a0) => { const r = (run_loop($squad_members$((a0)))); (a0); return r; }, 1),
  "new_run_squad": run_lib((a0, a1) => { const r = (run_loop($new_run_squad$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "input.go": run_lib((a0, a1) => { const r = (run_loop($input$go$((a0), (a1)))); (a0); (a1); return r; }, 2),
  "input": run_lib((a0, a1) => { const r = (run_loop($input$((a0), (a1)))); (a0); (a1); return r; }, 2),
};
