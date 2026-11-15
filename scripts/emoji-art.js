// HFQ emoji pack – Minecraft-style 16x16 pixel art, exported as 128x128 PNGs.
const zlib = require('zlib');

const S = 16;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const mix = (c, t, a) => [0, 1, 2].map((i) => Math.round(c[i] + (t[i] - c[i]) * a)).concat(255);
const lighten = (c, a) => mix(c, [255, 255, 255], a);
const darken = (c, a) => mix(c, [0, 0, 0], a);
const OUTLINE = hex('#17171c');

const blank = () => Array.from({ length: S }, () => Array(S).fill(null));
const inside = (x, y) => x >= 0 && y >= 0 && x < S && y < S;

/** Add a dark 1px outline around every filled shape. */
function outline(img) {
  const out = img.map((r) => r.slice());
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (img[y][x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(x + dx, y + dy) && img[y + dy][x + dx])) out[y][x] = OUTLINE;
  }
  return out;
}

/** Light top edges, dark bottom edges – gives a block-like 3D look. */
function shade(img) {
  const out = img.map((r) => r.slice());
  const empty = (x, y) => !inside(x, y) || !img[y][x];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const c = img[y][x];
    if (!c) continue;
    if (empty(x, y - 1)) out[y][x] = lighten(c, 0.35);
    else if (empty(x, y + 1)) out[y][x] = darken(c, 0.3);
    else if (empty(x - 1, y)) out[y][x] = lighten(c, 0.15);
    else if (empty(x + 1, y)) out[y][x] = darken(c, 0.15);
  }
  return out;
}

function fromMap(rows, palette) {
  const img = blank();
  rows.forEach((row, y) => {
    if (row.length !== S) throw new Error(`Row ${y} is ${row.length} wide: "${row}"`);
    [...row].forEach((ch, x) => { if (palette[ch]) img[y][x] = hex(palette[ch]); });
  });
  return img;
}

/** Rounded 14x14 block with a 10x10 glyph in the middle. */
function badge(color, glyph, glyphColor = '#ffffff') {
  const base = hex(color);
  const img = blank();
  for (let y = 1; y <= 14; y++) for (let x = 1; x <= 14; x++) {
    if ((x === 1 || x === 14) && (y === 1 || y === 14)) continue;
    img[y][x] = y === 1 || x === 1 ? lighten(base, 0.3) : y === 14 || x === 14 ? darken(base, 0.3) : base;
  }
  const g = hex(glyphColor);
  const shadow = darken(base, 0.35);
  glyph.forEach((row, gy) => {
    if (row.length !== 10) throw new Error(`Glyph row ${gy} is ${row.length} wide: "${row}"`);
    [...row].forEach((ch, gx) => {
      if (ch !== '#') return;
      const x = gx + 3, y = gy + 3;
      if (glyph[gy + 1]?.[gx + 1] !== '#') img[y + 1][x + 1] = shadow;
      img[y][x] = g;
    });
  });
  // redraw glyph on top of shadows
  glyph.forEach((row, gy) => [...row].forEach((ch, gx) => { if (ch === '#') img[gy + 3][gx + 3] = g; }));
  return outline(img);
}

function orb(color) {
  const base = hex(color);
  const img = blank();
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - 7.5, dy = y - 7.5;
    if (Math.hypot(dx, dy) > 6.2) continue;
    let c = base;
    if (Math.hypot(x - 5.5, y - 5.5) < 1.6) c = lighten(base, 0.7);
    else if (Math.hypot(dx, dy) > 5 && dx + dy > 0) c = darken(base, 0.35);
    img[y][x] = c;
  }
  return outline(img);
}

function grass() {
  const img = blank();
  const drip = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
  const greens = ['#5fa83a', '#4e8f2f', '#6fbf45'].map(hex);
  const dirts = ['#86603c', '#6e4e30', '#9a7048'].map(hex);
  for (let y = 2; y <= 13; y++) for (let x = 2; x <= 13; x++) {
    const v = (x * 7 + y * 13) % 5;
    const isGrass = y <= 4 || (y === 5 && drip[x - 2]);
    img[y][x] = (isGrass ? greens : dirts)[v < 3 ? 0 : v - 2];
  }
  return outline(img);
}

function shield() {
  const img = blank();
  const rim = hex('#cbd5e1'), body = hex('#8b5cf6'), gold = hex('#f5c518');
  const half = (y) => (y <= 8 ? 6 : 6 - (y - 8));
  for (let y = 2; y <= 13; y++) {
    const w = half(y);
    for (let x = 8 - w; x <= 7 + w; x++) {
      const edge = y === 2 || x === 8 - w || x === 7 + w || y === 13;
      img[y][x] = edge ? rim : x === 7 || x === 8 || y === 6 ? gold : body;
    }
  }
  return outline(shade(img));
}

function sword() {
  const img = blank();
  const set = (x, y, c) => { img[y][x] = hex(c); };
  for (let t = 0; t <= 7; t++) { set(13 - t, 2 + t, '#f1f5f9'); set(14 - t, 2 + t, '#94a3b8'); set(13 - t, 3 + t, '#94a3b8'); }
  [[3, 8], [4, 9], [5, 10], [6, 11], [7, 12]].forEach(([x, y]) => set(x, y, '#f5c518'));
  set(4, 11, '#8b5a2b'); set(3, 12, '#6b4220');
  set(2, 13, '#f5c518');
  return outline(img);
}

function pickaxe() {
  const img = blank();
  const set = (x, y, c) => { img[y][x] = hex(c); };
  for (let t = 0; t <= 8; t++) set(2 + t, 13 - t, t % 2 ? '#8b5a2b' : '#6b4220');
  const outer = [[4, 3], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 3], [11, 4], [12, 5], [13, 6], [13, 7], [13, 8], [13, 9], [12, 10]];
  const inner = [[6, 3], [7, 3], [8, 3], [9, 3], [10, 4], [11, 5], [12, 6], [12, 7], [12, 8], [12, 9]];
  outer.forEach(([x, y]) => set(x, y, '#4aedd9'));
  inner.forEach(([x, y]) => set(x, y, '#2ba89b'));
  return outline(img);
}

const diamond = () => outline(fromMap([
  '................',
  '................',
  '....llcccccC....',
  '...llcccccccC...',
  '..llcccccccccC..',
  '.CCCCCCCCCCCCCC.',
  '.lccccccccccccC.',
  '..lccccccccccC..',
  '...lccccccccC...',
  '....lccccccC....',
  '.....lccccC.....',
  '......lccC......',
  '.......cC.......',
  '................',
  '................',
  '................',
], { l: '#d1fff8', c: '#4aedd9', C: '#2ba89b' }));

const crown = () => outline(shade(fromMap([
  '................',
  '................',
  '................',
  '................',
  '..y....yy....y..',
  '..yy...yy...yy..',
  '..yyy.yyyy.yyy..',
  '..yyyyyyyyyyyy..',
  '..yyyyyyyyyyyy..',
  '..yrryybbyyrry..',
  '..yyyyyyyyyyyy..',
  '..yyyyyyyyyyyy..',
  '................',
  '................',
  '................',
  '................',
], { y: '#f5c518', r: '#e53935', b: '#1e88e5' })));

const star = () => outline(shade(fromMap([
  '................',
  '................',
  '.......yy.......',
  '......yyyy......',
  '......yyyy......',
  '.yyyyyyyyyyyyyy.',
  '..yyyyyyyyyyyy..',
  '...yyyyyyyyyy...',
  '....yyyyyyyy....',
  '....yyyyyyyy....',
  '...yyyyyyyyyy...',
  '...yyyy..yyyy...',
  '..yyy......yyy..',
  '..yy........yy..',
  '................',
  '................',
], { y: '#ffd43b' })));

// ── 10x10 glyphs for badges ──────────────────────────────────
const G = {
  check: ['..........', '........##', '.......###', '......###.', '##...###..', '###.###...', '.#####....', '..###.....', '...#......', '..........'],
  cross: ['##......##', '###....###', '.###..###.', '..######..', '...####...', '...####...', '..######..', '.###..###.', '###....###', '##......##'],
  bang: ['....##....', '....##....', '....##....', '....##....', '....##....', '....##....', '..........', '....##....', '....##....', '..........'],
  i: ['....##....', '....##....', '..........', '...###....', '....##....', '....##....', '....##....', '....##....', '...####...', '..........'],
  hammer: ['.########.', '.########.', '.########.', '....##....', '....##....', '....##....', '....##....', '....##....', '....##....', '..........'],
  boot: ['...####...', '...####...', '...####...', '...####...', '...####...', '...######.', '...#######', '...#######', '..........', '..........'],
  hourglass: ['##########', '.########.', '..######..', '...####...', '....##....', '....##....', '...#..#...', '..#....#..', '.########.', '##########'],
  lock: ['...####...', '..##..##..', '..#....#..', '..#....#..', '.########.', '.########.', '.###..###.', '.###..###.', '.########.', '.########.'],
  unlock: ['...####...', '..##..##..', '..#....#..', '.......#..', '.########.', '.########.', '.###..###.', '.###..###.', '.########.', '.########.'],
  trash: ['...####...', '##########', '..........', '.########.', '.#.#..#.#.', '.#.#..#.#.', '.#.#..#.#.', '.#.#..#.#.', '.########.', '..######..'],
  person: ['...####...', '...####...', '...####...', '...####...', '..........', '.########.', '##########', '##########', '##########', '..........'],
  ticket: ['..........', '..........', '##########', '####.#####', '.###.####.', '.###.####.', '####.#####', '##########', '..........', '..........'],
  megaphone: ['........#.', '......###.', '....#####.', '##########', '##########', '##########', '....#####.', '.##...###.', '.##.....#.', '..........'],
  bars: ['..........', '.......##.', '.......##.', '....##.##.', '....##.##.', '.##.##.##.', '.##.##.##.', '.##.##.##.', '##########', '..........'],
  bulb: ['...####...', '..######..', '.########.', '.########.', '.########.', '..######..', '...####...', '..........', '...####...', '....##....'],
  up: ['....##....', '...####...', '..######..', '.########.', '##########', '...####...', '...####...', '...####...', '...####...', '..........'],
  hand: ['.#.#.#....', '.#.#.#.#..', '.#.#.#.#..', '.#######..', '.#######.#', '.########.', '.#######..', '..######..', '...####...', '..........'],
  gear: ['....##....', '.##.##.##.', '.########.', '..######..', '####..####', '####..####', '..######..', '.########.', '.##.##.##.', '....##....'],
  hfq: ['..........', '..........', '#.#.##.###', '#.#.#..#.#', '###.##.#.#', '#.#.#..#.#', '#.#.#..###', '.........#', '..........', '..........'],
};
G.down = [...G.up].reverse();

const DARK = '#2a1f00';

// name -> 16x16 pixel grid
const PACK = {
  logo: () => badge('#8b5cf6', G.hfq),
  success: () => badge('#22c55e', G.check),
  error: () => badge('#ef4444', G.cross),
  warn: () => badge('#f5b52e', G.bang, DARK),
  info: () => badge('#3b82f6', G.i),
  ban: () => badge('#b91c1c', G.hammer),
  kick: () => badge('#ea7a2b', G.boot),
  timeout: () => badge('#6366f1', G.hourglass),
  lock: () => badge('#6b7280', G.lock),
  unlock: () => badge('#10b981', G.unlock),
  trash: () => badge('#dc2626', G.trash),
  online: () => orb('#22c55e'),
  offline: () => orb('#ef4444'),
  players: () => badge('#14b8a6', G.person),
  grass,
  diamond,
  pickaxe,
  sword,
  crown,
  ticket: () => badge('#8b5cf6', G.ticket),
  announce: () => badge('#ec4899', G.megaphone),
  poll: () => badge('#2563eb', G.bars),
  suggest: () => badge('#facc15', G.bulb, DARK),
  upvote: () => badge('#22c55e', G.up),
  downvote: () => badge('#ef4444', G.down),
  welcome: () => badge('#a855f7', G.hand),
  star,
  settings: () => badge('#4b5563', G.gear),
  shield,
};

// ── PNG encoder (no dependencies) ────────────────────────────
const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => { let c = ~0; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (~c) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const p = pixel(x, y) ?? [0, 0, 0, 0];
      raw.set(p, y * (w * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Build every emoji: { name: { grid, png } } */
function buildPack(scale = 8) {
  const out = {};
  for (const [name, draw] of Object.entries(PACK)) {
    const grid = draw();
    out[name] = { grid, png: encodePNG(S * scale, S * scale, (x, y) => grid[Math.floor(y / scale)][Math.floor(x / scale)]) };
  }
  return out;
}

/** One preview sheet with every emoji on a Discord-dark background. */
function buildPreview(pack, cols = 6, scale = 6) {
  const names = Object.keys(pack);
  const cell = S * scale + 24;
  const rows = Math.ceil(names.length / cols);
  const bg = hex('#2b2d31');
  return encodePNG(cols * cell, rows * cell, (x, y) => {
    const i = Math.floor(y / cell) * cols + Math.floor(x / cell);
    const lx = (x % cell) - 12, ly = (y % cell) - 12;
    if (i >= names.length || lx < 0 || ly < 0 || lx >= S * scale || ly >= S * scale) return bg;
    const p = pack[names[i]].grid[Math.floor(ly / scale)][Math.floor(lx / scale)];
    return p ?? bg;
  });
}

module.exports = { buildPack, buildPreview, PACK };

// Run directly: node scripts/emoji-art.js  -> writes assets/emojis/*.png
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '..', 'assets', 'emojis');
  fs.mkdirSync(dir, { recursive: true });
  const pack = buildPack();
  for (const [name, { png }] of Object.entries(pack)) fs.writeFileSync(path.join(dir, `hfq_${name}.png`), png);
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'emoji-preview.png'), buildPreview(pack));
  console.log(`Wrote ${Object.keys(pack).length} emojis to assets/emojis + assets/emoji-preview.png`);
}
