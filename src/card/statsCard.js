// /stats card – HFQ Custom SMP player card (PNG).
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { PACK } = require('../../scripts/emoji-art');
const { drawText, measureText } = require('./font');
const { compact, formatMoney, formatPlaytime } = require('../utils/format');

const W = 1000;
const H = 660;
const C = {
  bg: '#0d0b14',
  frame: '#17141f',
  border: '#2c2540',
  panel: '#100e18',
  panelBorder: '#241e33',
  text: '#ffffff',
  muted: '#8c84a6',
  purple: '#8b5cf6',
  purpleLight: '#c4b5fd',
  gold: '#facc15',
  green: '#22c55e',
  red: '#ef4444',
};

// ── drawing helpers ──────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, x, y, w, h, { fill = C.panel, border = C.panelBorder, r = 16 } = {}) {
  rrect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = border;
  ctx.stroke();
}

/** Draw a 16x16 grid from the emoji pack. */
function drawIcon(ctx, name, x, y, scale) {
  const grid = PACK[name]();
  grid.forEach((row, py) => row.forEach((p, px) => {
    if (!p) return;
    ctx.fillStyle = `rgba(${p[0]},${p[1]},${p[2]},${p[3] / 255})`;
    ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
  }));
}

// Minecraft-style heart, 9x9
const HEART = ['.kk...kk.', 'kwrk.krrk', 'kwrrkrrrk', 'krrrrrrrk', 'krrrrrrdk', '.krrrrdk.', '..krrdk..', '...kdk...', '....k....'];
const HEART_FULL = { k: '#1a0b0f', w: '#ffb3b3', r: '#e8263b', d: '#9e1426' };
const HEART_EMPTY = { k: '#1a0b0f', w: '#3b3350', r: '#2a2438', d: '#221d2e' };

function drawHeart(ctx, x, y, scale, fill /* 0, 0.5, 1 */) {
  HEART.forEach((row, py) => [...row].forEach((ch, px) => {
    if (ch === '.') return;
    const pal = fill >= 1 || (fill >= 0.5 && px < 4.5) ? HEART_FULL : HEART_EMPTY;
    ctx.fillStyle = pal[ch];
    ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
  }));
}

/** Pixel grass block slab used as a pedestal under the player. */
function drawPedestal(ctx, cx, y, units, px) {
  const x0 = Math.round(cx - (units * px) / 2);
  const greens = ['#5fa83a', '#4e8f2f', '#6fbf45'];
  const dirts = ['#86603c', '#6e4e30', '#9a7048'];
  const drip = (i) => (i * 7) % 3 === 0;
  for (let gy = 0; gy < 6; gy++) {
    for (let gx = 0; gx < units; gx++) {
      const v = (gx * 7 + gy * 13) % 5;
      const grass = gy < 2 || (gy === 2 && drip(gx));
      ctx.fillStyle = (grass ? greens : dirts)[v < 3 ? 0 : v - 2];
      ctx.fillRect(x0 + gx * px, y + gy * px, px, px);
    }
  }
  // edge shading
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x0, y, units * px, px / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x0, y + 6 * px - px / 2, units * px, px / 2);
}

function pill(ctx, x, y, text, color, { icon } = {}) {
  const scale = 2;
  const pad = 14;
  const iconW = icon ? 16 * 2 + 8 : 0;
  const w = measureText(text, scale) + pad * 2 + iconW;
  const h = 34;
  rrect(ctx, x, y, w, h, 10);
  ctx.fillStyle = `${color}26`;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `${color}99`;
  ctx.stroke();
  if (icon) drawIcon(ctx, icon, x + pad - 4, y + 1, 2);
  drawText(ctx, text, x + pad + iconW - (icon ? 4 : 0), y + 10, scale, color);
  return w;
}

function statTile(ctx, x, y, w, h, { icon, label, value, color = C.text }) {
  panel(ctx, x, y, w, h);
  drawIcon(ctx, icon, x + 14, y + 14, 3);
  drawText(ctx, label, x + 72, y + 30, 2, C.muted, { shadow: false });
  // shrink the value if it is too wide
  let scale = 4;
  while (scale > 2 && measureText(value, scale) > w - 28) scale--;
  drawText(ctx, value, x + 16, y + h - 16 - 7 * scale, scale, color);
}

async function fetchSkin(name) {
  const urls = [
    `https://visage.surgeplay.com/full/384/${encodeURIComponent(name)}`,
    `https://mc-heads.net/body/${encodeURIComponent(name)}/300`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HFQ-Bot/1.0' }, signal: AbortSignal.timeout(6000) });
      if (res.ok) return await loadImage(Buffer.from(await res.arrayBuffer()));
    } catch { /* try next */ }
  }
  return null;
}

/**
 * data: {
 *   name, hearts, maxHearts?, kills, deaths, playtimeMinutes, balance,
 *   rank?, killRank?, status? ('online'|'offline'|'eliminated'), serverName, ip
 * }
 */
async function renderStatsCard(data) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // background + subtle pixel grid
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 20) for (let x = 0; x < W; x += 20) {
    if ((x / 20 + y / 20) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.012)'; ctx.fillRect(x, y, 20, 20); }
  }

  // frame
  rrect(ctx, 20, 20, W - 40, H - 40, 26);
  ctx.fillStyle = C.frame;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.border;
  ctx.stroke();

  // top purple glow
  const glow = ctx.createRadialGradient(W * 0.62, 20, 10, W * 0.62, 20, 520);
  glow.addColorStop(0, 'rgba(139,92,246,0.28)');
  glow.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.save();
  rrect(ctx, 20, 20, W - 40, H - 40, 26);
  ctx.clip();
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // ── left: player showcase ──
  const lx = 40, ly = 40, lw = 300, lh = 528;
  rrect(ctx, lx, ly, lw, lh, 20);
  const lg = ctx.createLinearGradient(0, ly, 0, ly + lh);
  lg.addColorStop(0, '#221a38');
  lg.addColorStop(1, '#100e18');
  ctx.fillStyle = lg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.panelBorder;
  ctx.stroke();

  // spotlight behind player
  const spot = ctx.createRadialGradient(lx + lw / 2, 250, 10, lx + lw / 2, 250, 170);
  spot.addColorStop(0, 'rgba(196,181,253,0.25)');
  spot.addColorStop(1, 'rgba(196,181,253,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(lx, ly, lw, lh);

  const pedestalY = 450;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(lx + lw / 2, pedestalY + 2, 95, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  drawPedestal(ctx, lx + lw / 2, pedestalY, 26, 8);

  const skin = data.skin === undefined ? await fetchSkin(data.name) : data.skin;
  if (skin) {
    const maxH = 360, maxW = 250;
    const s = Math.min(maxH / skin.height, maxW / skin.width);
    const sw = skin.width * s, sh = skin.height * s;
    ctx.drawImage(skin, lx + (lw - sw) / 2, pedestalY + 6 - sh, sw, sh);
  } else {
    drawText(ctx, '?', lx + lw / 2, 230, 16, C.muted, { align: 'center' });
  }

  // status under pedestal: 'online' | 'offline' | 'eliminated' | null (hidden)
  const STATUS = { online: ['ONLINE', C.green], offline: ['OFFLINE', C.muted], eliminated: ['ELIMINATED', C.red] };
  if (STATUS[data.status]) {
    const [statusText, statusColor] = STATUS[data.status];
    const sw = measureText(statusText, 2) + 28 + 18;
    const sx = lx + (lw - sw) / 2;
    rrect(ctx, sx, 510, sw, 34, 10);
    ctx.fillStyle = `${statusColor}22`;
    ctx.fill();
    ctx.fillStyle = statusColor;
    ctx.fillRect(sx + 14, 523, 8, 8);
    drawText(ctx, statusText, sx + 32, 520, 2, statusColor);
  }

  // ── right: name + tags ──
  const rx = 370, rw = 590;
  const name = String(data.name).slice(0, 16);
  let nameScale = 7;
  while (nameScale > 4 && measureText(name, nameScale) > rw) nameScale--;
  // glow pass then crisp pass
  ctx.save();
  ctx.shadowColor = 'rgba(167,139,250,0.9)';
  ctx.shadowBlur = 22;
  drawText(ctx, name, rx, 48, nameScale, '#ffffff', { shadow: false });
  ctx.restore();
  drawText(ctx, name, rx, 48, nameScale, '#ffffff', { shadow: '#5b3fb3' });

  let px = rx;
  px += pill(ctx, px, 116, (data.serverName ?? 'HFQ CUSTOM SMP').toUpperCase(), C.purpleLight, { icon: 'logo' }) + 10;
  if (data.rank) pill(ctx, px, 116, `#${data.rank} IN HEARTS`, C.gold, { icon: 'crown' });

  // ── hearts panel ──
  panel(ctx, rx, 168, rw, 132);
  drawText(ctx, 'HEARTS', rx + 20, 186, 3, C.muted, { shadow: false });
  const maxHearts = Math.max(data.maxHearts ?? 20, 1);
  const hearts = Math.max(0, Number(data.hearts) || 0);
  const heartText = `${Number.isInteger(hearts) ? hearts : hearts.toFixed(1)} / ${maxHearts}`;
  drawText(ctx, heartText, rx + rw - 20, 182, 4, hearts > 0 ? '#ff6b7d' : C.muted, { align: 'right' });

  const slots = Math.min(maxHearts, 20);
  const perRow = 10, hs = 4, gap = 6;
  for (let i = 0; i < slots; i++) {
    const fill = Math.max(0, Math.min(1, hearts - i));
    const hx = rx + 20 + (i % perRow) * (9 * hs + gap);
    const hy = 214 + Math.floor(i / perRow) * (9 * hs + gap);
    drawHeart(ctx, hx, hy, hs, fill >= 1 ? 1 : fill >= 0.5 ? 0.5 : 0);
  }
  if (hearts > 20) drawText(ctx, `+${compact(hearts - 20)}`, rx + 20 + 10 * (9 * hs + gap) + 6, 232, 3, '#ff6b7d');

  // ── stat tiles ──
  const tw = (rw - 30) / 3, th = 120;
  const kills = Number(data.kills) || 0, deaths = Number(data.deaths) || 0;
  const kd = deaths ? (kills / deaths).toFixed(2) : kills.toFixed(2);
  const row1 = 316, row2 = 448;
  statTile(ctx, rx, row1, tw, th, { icon: 'timeout', label: 'PLAYTIME', value: formatPlaytime(data.playtimeMinutes) });
  statTile(ctx, rx + tw + 15, row1, tw, th, { icon: 'diamond', label: 'BALANCE', value: formatMoney(data.balance), color: '#5ff2dd' });
  statTile(ctx, rx + 2 * (tw + 15), row1, tw, th, { icon: 'sword', label: 'KILLS', value: compact(kills) });
  statTile(ctx, rx, row2, tw, th, { icon: 'error', label: 'DEATHS', value: compact(deaths) });
  statTile(ctx, rx + tw + 15, row2, tw, th, { icon: 'star', label: 'K/D RATIO', value: kd, color: C.gold });
  statTile(ctx, rx + 2 * (tw + 15), row2, tw, th, {
    icon: 'crown', label: 'KILL RANK', value: data.killRank ? `#${data.killRank}` : '-', color: C.purpleLight,
  });

  // ── footer ──
  ctx.fillStyle = C.border;
  ctx.fillRect(40, 586, W - 80, 2);
  drawIcon(ctx, 'logo', 40, 598, 2);
  drawText(ctx, (data.serverName ?? 'HFQ CUSTOM SMP').toUpperCase(), 82, 606, 3, '#ffffff');
  if (data.ip) {
    const ipW = measureText(data.ip, 3);
    drawIcon(ctx, 'grass', W - 40 - ipW - 42, 598, 2);
    drawText(ctx, data.ip, W - 40, 606, 3, C.purpleLight, { align: 'right' });
  }

  return canvas.encode('png');
}

module.exports = { renderStatsCard };
