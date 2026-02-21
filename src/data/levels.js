// ─── Level generation helpers ─────────────────────────────────────────────────

function staggeredGrid(cols, rows, x0, y0, dx, dy) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const n = r % 2 === 0 ? cols : cols - 1;
    const ox = r % 2 === 1 ? dx / 2 : 0;
    for (let c = 0; c < n; c++) {
      out.push({ x: Math.round(x0 + c * dx + ox), y: Math.round(y0 + r * dy) });
    }
  }
  return out;
}

function circle(cx, cy, radius, count) {
  return Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 / count) * i - Math.PI / 2;
    return { x: Math.round(cx + Math.cos(a) * radius), y: Math.round(cy + Math.sin(a) * radius) };
  });
}

function arc(cx, cy, radius, startAngle, endAngle, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / (count - 1));
    out.push({ x: Math.round(cx + Math.cos(a) * radius), y: Math.round(cy + Math.sin(a) * radius) });
  }
  return out;
}

function assignTypes(positions, orangeSet, greenSet, purpleIdx) {
  return positions.map((pos, i) => ({
    ...pos,
    type: orangeSet.has(i) ? 'orange'
        : greenSet.has(i)  ? 'green'
        : i === purpleIdx  ? 'purple'
        : 'blue',
  }));
}

// ─── Level 1 · "Meadow" ───────────────────────────────────────────────────────
// Classic staggered grid — gentle introduction

const meadowPositions = staggeredGrid(10, 7, 75, 115, 70, 65);
// Total: 10+9+10+9+10+9+10 = 67 pegs
const meadowOrange = new Set([0, 2, 5, 8, 10, 13, 16, 19, 22, 25, 28, 30, 33, 36, 38, 41, 44, 47, 49, 52, 54, 57, 60, 63, 66]);
const meadowGreen  = new Set([7, 48]);
const meadowPurple = 34;

// ─── Level 2 · "Arches" ───────────────────────────────────────────────────────
// Rows of arching curves — requires angle play

const PI = Math.PI;
const archPositions = [
  // Three arching rows
  ...arc(390, 620, 320, PI * 1.12, PI * 1.88, 13),
  ...arc(390, 620, 230, PI * 1.15, PI * 1.85, 11),
  ...arc(390, 620, 140, PI * 1.18, PI * 1.82, 9),
  // Middle ring (use circle() to avoid duplicate start/end point)
  ...circle(390, 340,  90, 10),
  // Top diamond clusters
  { x: 160, y: 140 }, { x: 240, y: 140 }, { x: 320, y: 140 }, { x: 400, y: 120 },
  { x: 480, y: 140 }, { x: 560, y: 140 }, { x: 640, y: 140 },
  { x: 200, y: 200 }, { x: 300, y: 200 }, { x: 400, y: 200 }, { x: 500, y: 200 }, { x: 600, y: 200 },
  // Vertical pillars
  { x: 100, y: 280 }, { x: 100, y: 350 }, { x: 100, y: 420 },
  { x: 680, y: 280 }, { x: 680, y: 350 }, { x: 680, y: 420 },
];
// 13+11+9+10+7+5+6 = 61 pegs
const archOrange = new Set([0,2,5,8,11,13,15,18,21,23,25,27,29,31,33,35,37,40,43,46,48,50,53,56,59]);
const archGreen  = new Set([4, 38]);
const archPurple = 26;

// ─── Level 3 · "Galaxy" ───────────────────────────────────────────────────────
// Concentric rings — tight corridors, high skill ceiling

const galaxyPositions = [
  ...circle(390, 340, 220, 16),  // outer ring
  ...circle(390, 340, 150, 13),  // middle ring
  ...circle(390, 340,  85, 10),  // inner ring
  ...circle(390, 340,  32,  6),  // core
  // Corner clusters
  { x: 80,  y: 110 }, { x: 130, y: 110 }, { x: 80,  y: 155 }, { x: 130, y: 155 },
  { x: 700, y: 110 }, { x: 650, y: 110 }, { x: 700, y: 155 }, { x: 650, y: 155 },
  // Bottom bumpers
  { x: 180, y: 560 }, { x: 280, y: 560 }, { x: 390, y: 560 }, { x: 500, y: 560 }, { x: 600, y: 560 },
];
// 16+13+10+6+4+4+5 = 58 pegs
const galaxyOrange = new Set([0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48]);
const galaxyGreen  = new Set([3, 19]);
const galaxyPurple = 35;

// ─── Export ───────────────────────────────────────────────────────────────────

// ─── Test Level · one peg of each colour ──────────────────────────────────────
const testPegs = [
  { x: 390, y: 240, type: 'orange' },
  { x: 260, y: 340, type: 'blue'   },
  { x: 520, y: 340, type: 'green'  },
  { x: 390, y: 440, type: 'purple' },
];

export const TEST_LEVEL_INDEX = 3;

export const levels = [
  {
    id: 1,
    name: 'Level 1 · Meadow',
    pegs: assignTypes(meadowPositions, meadowOrange, meadowGreen, meadowPurple),
  },
  {
    id: 2,
    name: 'Level 2 · Tropical',
    pegs: assignTypes(archPositions, archOrange, archGreen, archPurple),
  },
  {
    id: 3,
    name: 'Level 3 · Volcano',
    pegs: assignTypes(galaxyPositions, galaxyOrange, galaxyGreen, galaxyPurple),
  },
  {
    id: 0,
    name: 'Test Level',
    pegs: testPegs,
  },
];
