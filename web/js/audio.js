// A tiny chiptune synth: square/triangle/noise voices, a lookahead step
// sequencer for music, and one-shot sound effects. All tunes are original,
// written in pentatonic and Japanese "in" scales.

let ac = null, master = null, musicBus = null, sfxBus = null;
const settings = loadSettings();

function loadSettings() {
  try { return { music: 0.5, sfx: 0.7, speed: 1, ...JSON.parse(localStorage.getItem("tbh.settings") ?? "{}") }; }
  catch { return { music: 0.5, sfx: 0.7, speed: 1 }; }
}
export function getSettings() { return settings; }
export function saveSettings() {
  try { localStorage.setItem("tbh.settings", JSON.stringify(settings)); } catch { /* private mode */ }
  if (musicBus) musicBus.gain.value = settings.music * 0.35;
  if (sfxBus) sfxBus.gain.value = settings.sfx * 0.5;
}

/** Audio can only start after a user gesture. */
export function unlock() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain();
  master.gain.value = 0.9;
  master.connect(ac.destination);
  musicBus = ac.createGain();
  sfxBus = ac.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  saveSettings();
  if (pending) { const p = pending; pending = null; play(p); }
}

const NOTE = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
function midi(name) {
  const m = /^([A-G][#b]?)(\d)$/.exec(name);
  return m ? 12 * (Number(m[2]) + 1) + NOTE[m[1]] : null;
}
const freq = (m) => 440 * 2 ** ((m - 69) / 12);

function voice(type, f, t, dur, vol, bus, opts = {}) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(opts.slide, 20), t + dur);
  if (opts.vib) {
    const lfo = ac.createOscillator();
    const lg = ac.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.value = f * 0.012;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t + 0.08);
    lfo.stop(t + dur + 0.05);
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.setValueAtTime(vol, t + Math.max(dur - 0.04, 0.01));
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur + (opts.release ?? 0.05));
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + (opts.release ?? 0.05) + 0.02);
}

let noiseBuf = null;
function noise(t, dur, vol, bus, hp = 800, lp = 9000) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  const f1 = ac.createBiquadFilter();
  f1.type = "highpass";
  f1.frequency.value = hp;
  const f2 = ac.createBiquadFilter();
  f2.type = "lowpass";
  f2.frequency.value = lp;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f1).connect(f2).connect(g).connect(bus);
  s.start(t);
  s.stop(t + dur + 0.02);
}

// ---------------------------------------------------------------------------
// Sound effects
// ---------------------------------------------------------------------------

const SFX = {
  cursor: (t, b) => voice("square", 1320, t, 0.025, 0.12, b),
  ok: (t, b) => { voice("square", 990, t, 0.04, 0.13, b); voice("square", 1480, t + 0.045, 0.06, 0.12, b); },
  back: (t, b) => { voice("square", 880, t, 0.04, 0.12, b); voice("square", 600, t + 0.04, 0.06, 0.1, b); },
  buzz: (t, b) => voice("square", 140, t, 0.12, 0.12, b),
  step: (t, b) => noise(t, 0.04, 0.08, b, 2000, 6000),
  hit: (t, b) => { noise(t, 0.12, 0.35, b, 300, 5000); voice("triangle", 160, t, 0.1, 0.4, b, { slide: 60 }); },
  crit: (t, b) => { noise(t, 0.2, 0.45, b, 200, 8000); voice("square", 330, t, 0.15, 0.2, b, { slide: 80 }); voice("triangle", 110, t, 0.2, 0.5, b, { slide: 40 }); },
  slash: (t, b) => noise(t, 0.09, 0.25, b, 3000, 12000),
  miss: (t, b) => noise(t, 0.12, 0.12, b, 4000, 12000),
  block: (t, b) => { voice("triangle", 520, t, 0.05, 0.3, b); noise(t, 0.08, 0.15, b, 1500, 4000); },
  heal: (t, b) => [0, 4, 7, 12].forEach((n, i) => voice("triangle", freq(76 + n), t + i * 0.05, 0.12, 0.18, b)),
  chakra: (t, b) => [0, 7, 12].forEach((n, i) => voice("square", freq(81 + n), t + i * 0.04, 0.06, 0.07, b)),
  status: (t, b) => voice("square", 620, t, 0.12, 0.09, b, { slide: 300 }),
  ko: (t, b) => { voice("square", 400, t, 0.35, 0.15, b, { slide: 60 }); noise(t, 0.4, 0.15, b, 200, 2000); },
  dissolve: (t, b) => { for (let i = 0; i < 6; i++) voice("square", 900 - i * 110, t + i * 0.05, 0.05, 0.08, b); },
  cutin: (t, b) => { noise(t, 0.35, 0.25, b, 1500, 9000); voice("sawtooth", 220, t, 0.3, 0.08, b, { slide: 880 }); },
  fire: (t, b) => noise(t, 0.45, 0.35, b, 150, 3000),
  wind: (t, b) => { noise(t, 0.5, 0.25, b, 2500, 9000); voice("sine", 300, t, 0.4, 0.15, b, { slide: 900 }); },
  lightning: (t, b) => { for (let i = 0; i < 5; i++) noise(t + i * 0.03, 0.05, 0.3, b, 3000, 12000); voice("square", 1800, t, 0.2, 0.06, b, { slide: 200 }); },
  earth: (t, b) => { voice("triangle", 90, t, 0.35, 0.6, b, { slide: 40 }); noise(t, 0.3, 0.3, b, 80, 1200); },
  water: (t, b) => { noise(t, 0.5, 0.22, b, 400, 3500); voice("sine", 500, t, 0.3, 0.1, b, { slide: 200 }); },
  yin: (t, b) => { voice("sine", 140, t, 0.6, 0.3, b, { slide: 70, vib: true }); noise(t, 0.4, 0.1, b, 100, 900); },
  yang: (t, b) => [0, 7, 12, 19].forEach((n, i) => voice("triangle", freq(72 + n), t + i * 0.04, 0.3, 0.12, b)),
  combo: (t, b) => { noise(t, 0.5, 0.3, b, 300, 9000); [0, 4, 7, 11, 14].forEach((n, i) => voice("square", freq(69 + n), t + i * 0.035, 0.25, 0.09, b)); },
  levelup: (t, b) => [0, 4, 7, 12, 16].forEach((n, i) => voice("square", freq(72 + n), t + i * 0.07, 0.1, 0.1, b)),
  coin: (t, b) => { voice("square", 1320, t, 0.05, 0.1, b); voice("square", 1760, t + 0.05, 0.12, 0.1, b); },
  door: (t, b) => { noise(t, 0.25, 0.15, b, 200, 2500); voice("triangle", 200, t, 0.2, 0.2, b, { slide: 120 }); },
  encounter: (t, b) => { for (let i = 0; i < 8; i++) voice("square", 220 * 2 ** (i / 6), t + i * 0.035, 0.05, 0.1, b); noise(t, 0.5, 0.15, b, 1000, 8000); },
  beast: (t, b) => { voice("sawtooth", 70, t, 0.9, 0.3, b, { slide: 45, vib: true }); noise(t, 0.9, 0.25, b, 60, 700); },
};

export function sfx(name) {
  if (!ac || !SFX[name]) return;
  SFX[name](ac.currentTime + 0.005, sfxBus);
}

// ---------------------------------------------------------------------------
// Music: tokens are one step each; "." holds the previous note, "-" rests.
// ---------------------------------------------------------------------------

const rep = (s, n) => Array(n).fill(s).join(" ");
const TRACKS = {
  title: {
    bpm: 76, step: 0.5, // eighth notes
    lead: "A4 . . . G4 F4 D4 . . . F4 . G4 . A4 . C5 . . . D5 . C5 A4 G4 . . . . . - - " +
      "A4 . . . C5 D5 F5 . . . E5 D5 C5 . A4 . G4 . . . A4 . G4 F4 D4 . . . . . - -",
    bass: rep("D3 . . . A3 . . . ", 3) + "Bb2 . . . F3 . . . " + rep("D3 . . . A3 . . . ", 2) + "C3 . . . G3 . . . Bb2 . . . A2 . . . ",
    leadType: "triangle", vib: true,
  },
  map: {
    bpm: 108, step: 0.5,
    lead: "D5 . E5 . F#5 . A5 . . . B5 . A5 F#5 E5 . D5 . E5 . F#5 . E5 . . . - - - - " +
      "B4 . D5 . E5 . F#5 . . . A5 . F#5 E5 D5 . E5 . D5 . B4 . A4 . . . - - - -",
    bass: rep("D3 - A3 - D3 - A3 - ", 2) + rep("G2 - D3 - G2 - D3 - ", 1) + "A2 - E3 - A2 - C#3 - " +
      rep("B2 - F#3 - B2 - F#3 - ", 1) + "G2 - D3 - G2 - D3 - " + "A2 - E3 - A2 - E3 - " + "D3 - A3 - D3 - - - ",
    drums: rep("k - h - s - h - ", 8),
    leadType: "square",
  },
  village: {
    bpm: 92, step: 0.5,
    lead: "G4 . A4 . C5 . D5 . E5 . . . D5 . C5 . A4 . . . C5 . A4 . G4 . . . . . - - " +
      "E5 . G5 . E5 D5 C5 . D5 . . . C5 . A4 . G4 . A4 . C5 . A4 . G4 . . . . . - -",
    bass: rep("C3 . G3 . E3 . G3 . ", 2) + rep("A2 . E3 . C3 . E3 . ", 2) + rep("F2 . C3 . A2 . C3 . ", 2) + rep("G2 . D3 . B2 . D3 . ", 2),
    leadType: "triangle",
  },
  battle: {
    bpm: 152, step: 0.25,
    lead: "D5 - D5 F5 - G5 - A5 . . . G5 F5 - D5 - C5 - D5 . . . . . - - A4 C5 D5 - F5 - " +
      "G5 - G5 A5 - C6 - A5 . . . G5 - F5 - G5 A5 - G5 F5 - D5 . . . . . . . - - - -",
    bass: rep("D2 D3 D2 D3 D2 D3 D2 D3 ", 4) + rep("Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 ", 2) + rep("C2 C3 C2 C3 C2 C3 C2 C3 ", 2),
    drums: rep("k - h k s - h - k k h - s - h h ", 4),
    leadType: "square",
  },
  boss: {
    bpm: 168, step: 0.25,
    lead: "D5 Eb5 - D5 - A4 - Bb4 . . . A4 - G4 - A4 . . . . . - D5 Eb5 - G5 - F5 Eb5 - D5 . . . " +
      "D5 Eb5 - D5 - A5 - Bb5 . . . A5 - G5 - A5 . . . . . - G5 A5 - Bb5 - A5 G5 - Eb5 . . . ",
    bass: rep("D2 D2 D3 D2 Eb2 Eb2 Eb3 Eb2 ", 4) + rep("G1 G1 G2 G1 A1 A1 A2 A1 ", 2) + rep("D2 D2 D3 D2 D2 D2 D3 D2 ", 2),
    drums: rep("k k s - k - s k k k s - k s s s ", 4),
    leadType: "sawtooth",
  },
  victory: {
    bpm: 140, step: 0.25, once: true,
    lead: "D5 - D5 - D5 - A5 . . . . . F#5 . G5 . A5 . . . G5 A5 . . . . . . . . . . . .",
    bass: "D3 . . . . . . . . . . . D3 . E3 . F#3 . . . E3 F#3 . . . . . . . . . . . .",
    leadType: "square",
  },
  gameover: {
    bpm: 64, step: 0.5, once: true,
    lead: "A4 . G4 . F4 . E4 . D4 . . . . . . . - -",
    bass: "D3 . . . Bb2 . . . A2 . . . D2 . . . . .",
    leadType: "triangle",
  },
};

const parse = (s) => s.trim().split(/\s+/);
let current = null, timer = null, pending = null;

/** Start a track by name (no-op if already playing). null stops music. */
export function play(name) {
  if (!ac) { pending = name; return; }
  if (current?.name === name) return;
  stop();
  if (!name || !TRACKS[name]) return;
  const tr = TRACKS[name];
  const parts = { lead: parse(tr.lead), bass: parse(tr.bass ?? ""), drums: parse(tr.drums ?? "") };
  const len = Math.max(parts.lead.length, parts.bass.length, parts.drums.length);
  const dt = (60 / tr.bpm) * tr.step;
  const gain = ac.createGain();
  gain.gain.value = 1;
  gain.connect(musicBus);
  current = { name, tr, parts, len, dt, i: 0, t: ac.currentTime + 0.08, gain };
  timer = setInterval(schedule, 40);
  schedule();
}

export function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  if (current) {
    const g = current.gain;
    g.gain.setTargetAtTime(0, ac.currentTime, 0.05);
    setTimeout(() => g.disconnect(), 400);
  }
  current = null;
}

function holdLen(arr, i) {
  let n = 1;
  while (arr[(i + n) % arr.length] === "." && n < arr.length) n++;
  return n;
}

function schedule() {
  const c = current;
  if (!c) return;
  while (c.t < ac.currentTime + 0.2) {
    const i = c.i % c.len;
    if (c.tr.once && c.i >= c.len) { stop(); return; }
    const L = c.parts.lead[i % c.parts.lead.length];
    const B = c.parts.bass.length ? c.parts.bass[i % c.parts.bass.length] : "-";
    const D = c.parts.drums.length ? c.parts.drums[i % c.parts.drums.length] : "-";
    const ml = midi(L);
    if (ml) voice(c.tr.leadType, freq(ml), c.t, holdLen(c.parts.lead, i % c.parts.lead.length) * c.dt * 0.92, 0.11, c.gain, { vib: c.tr.vib, release: 0.08 });
    const mb = midi(B);
    if (mb) voice("triangle", freq(mb), c.t, holdLen(c.parts.bass, i % c.parts.bass.length) * c.dt * 0.9, 0.28, c.gain);
    if (D === "k") voice("sine", 120, c.t, 0.09, 0.5, c.gain, { slide: 40 });
    if (D === "s") noise(c.t, 0.09, 0.22, c.gain, 1200, 7000);
    if (D === "h") noise(c.t, 0.03, 0.08, c.gain, 6000, 14000);
    c.t += c.dt;
    c.i++;
  }
}
