// Player stats synced from the HFQLeaderboards plugin + Discord account links.
// Saved in data/stats.json.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DIR, 'stats.json');

let data = { players: {}, links: {}, seenEvents: [], lastSync: null };
try {
  if (fs.existsSync(FILE)) data = { ...data, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
} catch (err) {
  console.error('Could not read stats.json, starting fresh:', err.message);
}

let saveTimer = null;
function save() {
  // batch writes – a sync touches hundreds of players at once
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(`${FILE}.tmp`, JSON.stringify(data, null, 2));
    fs.renameSync(`${FILE}.tmp`, FILE);
  }, 500);
}

// Scoreboard junk the plugin can export (not real players)
const IGNORED = new Set(['environment', 'player combat', '']);
const key = (name) => String(name ?? '').trim().toLowerCase();

function player(uuid, name) {
  const k = key(name);
  if (IGNORED.has(k)) return null;
  const p = (data.players[k] ??= { name, uuid: '', hearts: 0, minutes: 0, balance: 0, kills: 0, deaths: 0 });
  p.name = name;
  if (uuid) p.uuid = uuid;
  return p;
}

/** Apply a snapshot file: type is hearts | minutes | balance */
function applySnapshot(field, players) {
  for (const row of players ?? []) {
    const value = Number(row[field]);
    if (!row.name || !Number.isFinite(value)) continue;
    const p = player(row.uuid, row.name);
    if (p) p[field] = Math.max(0, value);
  }
  data.lastSync = Date.now();
  save();
}

/**
 * Apply events.jsonl lines. Counts each event once (by its id).
 * kill / elimination -> killer +1 kill, victim +1 death. Other deaths -> victim +1 death.
 */
function applyEvents(lines) {
  const seen = new Set(data.seenEvents);
  const present = [];
  let added = 0;
  for (const line of lines) {
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    const id = ev.id || line;
    present.push(id);
    if (seen.has(id)) continue;
    seen.add(id);

    const victim = ev.victim?.name && player(ev.victim.id, ev.victim.name);
    if (victim) victim.deaths++;
    const isPvp = ev.type === 'kill' || ev.type === 'elimination';
    const killer = isPvp && ev.killer?.name && player(ev.killer.id, ev.killer.name);
    if (killer) killer.kills++;
    if (ev.type === 'elimination' && victim) victim.eliminatedAt = Date.now();
    added++;
  }
  // only remember ids still in the file (the plugin trims it), so this stays small
  data.seenEvents = present;
  save();
  return added;
}

const getPlayer = (name) => data.players[key(name)] ?? null;
const allPlayers = () => Object.values(data.players);

/** 1-based rank of a player for a stat, or null. */
function rankOf(name, field) {
  const sorted = allPlayers().filter((p) => p[field] > 0).sort((a, b) => b[field] - a[field]);
  const i = sorted.findIndex((p) => key(p.name) === key(name));
  return i >= 0 ? i + 1 : null;
}

function top(field, limit = 10) {
  return allPlayers().filter((p) => p[field] > 0).sort((a, b) => b[field] - a[field]).slice(0, limit);
}

// ── Discord <-> Minecraft links ──
function link(discordId, minecraftName) {
  // a Minecraft name can only belong to one Discord user
  for (const [id, l] of Object.entries(data.links)) {
    if (key(l.name) === key(minecraftName) && id !== discordId) delete data.links[id];
  }
  data.links[discordId] = { name: minecraftName, linkedAt: Date.now() };
  save();
}
function unlink(discordId) {
  const had = data.links[discordId];
  delete data.links[discordId];
  save();
  return had ?? null;
}
const getLink = (discordId) => data.links[discordId] ?? null;
function getLinkedDiscordId(minecraftName) {
  return Object.entries(data.links).find(([, l]) => key(l.name) === key(minecraftName))?.[0] ?? null;
}

const lastSync = () => data.lastSync;

module.exports = {
  applySnapshot, applyEvents, getPlayer, rankOf, top, link, unlink, getLink, getLinkedDiscordId, lastSync,
};
