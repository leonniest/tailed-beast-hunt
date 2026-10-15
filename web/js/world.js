// Battle backdrops, painted once per kind.
import { layer, fbm, hash2, noise } from "./core.js";

/** Battle backdrop for where the squad stands: each act has its own lands,
 * and each tailed beast its own arena. */
export function backdropKind(run) {
  const LANDS = [["bridge", "forest", "beach"], ["rain", "plains", "temple"], ["valley", "gorge", "canyon"]];
  const BOSS = ["beach", "rain", "valley"];
  const act = Math.min(run.act ?? 0, 2);
  if (run.pos === 84) return BOSS[act];
  const pos = run.pos === 999 ? 0 : run.pos;
  return LANDS[act][(Math.floor(pos / 7) + pos) % 3];
}

// ---------------------------------------------------------------------------
// Battle backdrops, 480 x 272 (the bottom is covered by windows).
// ---------------------------------------------------------------------------

const backdrops = new Map();
export function backdrop(kind) {
  if (backdrops.has(kind)) return backdrops.get(kind);
  const [c, g] = layer(480, 272);
  const P = {
    forest: { sky: ["#7ab8e8", "#cde8f0"], far: "#3a7050", mid: "#2a5a3a", ground: ["#5a9a48", "#3a6a30"] },
    valley: { sky: ["#5a8ad0", "#c8e0f0"], far: "#6a7a8a", mid: "#4a5a6a", ground: ["#7a8a7a", "#4a5a52"] },
    plains: { sky: ["#68a8e8", "#d8f0f8"], far: "#7aa868", mid: "#5a8a4a", ground: ["#8ac060", "#5a9040"] },
    temple: { sky: ["#e89a6a", "#f8e0b0"], far: "#8a6a5a", mid: "#6a4a3a", ground: ["#a89a70", "#7a6a48"] },
    ruins: { sky: ["#e8b878", "#f8e8c0"], far: "#c8a070", mid: "#a8804a", ground: ["#e0c890", "#c0a060"] },
    desert: { sky: ["#f0b860", "#f8e8b8"], far: "#e0b878", mid: "#d0a060", ground: ["#ecd090", "#d0ac68"] },
    bridge: { sky: ["#88b0d8", "#e0eef4"], far: "#8aa0b0", mid: "#6a8090", ground: ["#8a6a48", "#5a4430"], water: true },
    beach: { sky: ["#58a0e8", "#d0f0f8"], far: "#2a70b0", mid: "#3a8ac0", ground: ["#ecdca8", "#d0bc80"], water: true },
    gorge: { sky: ["#4a5a80", "#a0aac0"], far: "#5a5a6a", mid: "#44444e", ground: ["#7a7a7a", "#54545a"], storm: true },
    canyon: { sky: ["#d8a070", "#f0d8b0"], far: "#a8805a", mid: "#8a6040", ground: ["#b09068", "#8a6a48"] },
    rain: { sky: ["#3a4a5a", "#7a8a98"], far: "#3a4a4e", mid: "#2a3a3e", ground: ["#4a5a58", "#2e3a3a"], rain: true },
    springs: { sky: ["#8ab0d0", "#e8f0f4"], far: "#8a9aa8", mid: "#6a7a7a", ground: ["#8a9a78", "#62725a"], steam: true },
    snow: { sky: ["#a8b8d0", "#eef2f8"], far: "#c8d0e0", mid: "#a8b4c8", ground: ["#f0f4fa", "#c8d2e0"] },
  }[kind] ?? null;
  const p = P ?? { sky: ["#7ab8e8", "#cde8f0"], far: "#3a7050", mid: "#2a5a3a", ground: ["#5a9a48", "#3a6a30"] };
  const horizon = 110;
  let gr = g.createLinearGradient(0, 0, 0, horizon);
  gr.addColorStop(0, p.sky[0]);
  gr.addColorStop(1, p.sky[1]);
  g.fillStyle = gr;
  g.fillRect(0, 0, 480, horizon);
  // clouds
  for (let i = 0; i < 6; i++) {
    const cx = hash2(i, 1, kind.length) * 480, cy = 15 + hash2(i, 2, kind.length) * 50;
    g.fillStyle = p.storm || p.rain ? "rgba(60,64,80,0.5)" : "rgba(255,255,255,0.7)";
    for (let k = 0; k < 4; k++) g.fillRect(cx + k * 9 - 18, cy - (k % 2) * 4, 22, 7);
  }
  // far and mid silhouettes
  const ridge = (base, amp, col, seed, sharp) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, horizon + 10);
    for (let x = 0; x <= 480; x += 4) {
      const n = sharp ? Math.abs(noise(x / 40, 0, seed) - 0.5) * 2 : fbm(x / 70, 0, seed, 3);
      g.lineTo(x, base - n * amp);
    }
    g.lineTo(480, horizon + 10);
    g.closePath();
    g.fill();
  };
  const sharp = ["gorge", "canyon", "snow", "springs", "valley"].includes(kind);
  ridge(horizon - 10, 50, p.far, 21, sharp);
  ridge(horizon + 2, kind === "forest" || kind === "rain" ? 40 : 26, p.mid, 22, sharp);
  if (kind === "forest" || kind === "rain") {
    for (let x = -10; x < 490; x += 14) {
      const h = 40 + hash2(x, 5, 1) * 30;
      g.fillStyle = kind === "rain" ? "#22302e" : "#24502e";
      g.beginPath(); g.moveTo(x, horizon + 6); g.lineTo(x + 8, horizon + 6 - h); g.lineTo(x + 16, horizon + 6); g.closePath(); g.fill();
    }
  }
  if (kind === "valley") {
    // the statues of the Valley of the End
    for (const [sx, col] of [[70, "#5a6070"], [410, "#5a6070"]]) {
      g.fillStyle = col; g.fillRect(sx - 14, 20, 28, 80); g.fillRect(sx - 10, 6, 20, 16);
      g.fillStyle = "#6a7080"; g.fillRect(sx - 14, 20, 8, 80);
    }
    g.fillStyle = "#a8d0f0"; g.fillRect(220, 30, 40, 80);
    g.fillStyle = "#e0f0ff"; for (let y = 30; y < 110; y += 6) g.fillRect(224 + (y % 12), y, 3, 4);
  }
  if (kind === "temple") {
    g.fillStyle = "#8a2a20"; g.fillRect(200, 40, 80, 8); g.fillRect(212, 48, 6, 50); g.fillRect(262, 48, 6, 50); g.fillRect(205, 58, 70, 5);
  }
  if (kind === "ruins") {
    for (const x of [90, 130, 360, 400]) { g.fillStyle = "#b08a5a"; g.fillRect(x, 60 + (x % 30), 14, 50); g.fillStyle = "#c8a070"; g.fillRect(x, 60 + (x % 30), 5, 50); }
  }
  // ground
  gr = g.createLinearGradient(0, horizon, 0, 272);
  gr.addColorStop(0, p.ground[0]);
  gr.addColorStop(1, p.ground[1]);
  g.fillStyle = gr;
  g.fillRect(0, horizon, 480, 272 - horizon);
  if (p.water) {
    g.fillStyle = kind === "bridge" ? "#3a7ab0" : "#3a8ac8";
    g.fillRect(0, horizon, 480, kind === "bridge" ? 162 : 26);
    g.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 40; i++) g.fillRect(hash2(i, 3, 7) * 480, horizon + 2 + hash2(i, 4, 7) * (kind === "bridge" ? 150 : 22), 8, 1);
    if (kind === "bridge") {
      g.fillStyle = "#8a6a48"; g.fillRect(0, 150, 480, 50);
      g.fillStyle = "#6a4c30"; for (let x = 0; x < 480; x += 12) g.fillRect(x, 150, 2, 50);
      g.fillStyle = "#5a4028"; g.fillRect(0, 146, 480, 4); g.fillRect(0, 200, 480, 3);
    }
  }
  // perspective ground lines
  g.strokeStyle = "rgba(0,0,0,0.08)";
  g.lineWidth = 1;
  for (let k = 0; k < 8; k++) {
    const y = horizon + 6 + (k * k) * 2.2;
    g.beginPath(); g.moveTo(0, y); g.lineTo(480, y); g.stroke();
  }
  // tufts and pebbles
  for (let i = 0; i < 90; i++) {
    const x = hash2(i, 9, kind.length) * 480, y = horizon + 14 + hash2(i, 10, kind.length) * 140;
    g.fillStyle = kind === "snow" ? "rgba(160,176,200,0.7)" : kind === "desert" || kind === "ruins" ? "rgba(170,130,70,0.5)" : "rgba(30,60,20,0.35)";
    g.fillRect(x, y, 3, 1);
    g.fillRect(x + 1, y - 1, 1, 1);
  }
  backdrops.set(kind, { canvas: c, rain: !!p.rain, steam: !!p.steam, storm: !!p.storm, snow: kind === "snow" });
  return backdrops.get(kind);
}
