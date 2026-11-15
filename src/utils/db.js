// Tiny JSON file storage – no database setup needed.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DIR, 'db.json');

let data = { settings: {}, warnings: {}, tickets: {} };

function load() {
  try {
    if (fs.existsSync(FILE)) data = { ...data, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } catch (err) {
    console.error('Could not read db.json, starting fresh:', err.message);
  }
}

function save() {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getSettings(guildId) {
  return (data.settings[guildId] ??= {});
}

function setSetting(guildId, key, value) {
  getSettings(guildId)[key] = value;
  save();
}

function getWarnings(guildId, userId) {
  return data.warnings[guildId]?.[userId] ?? [];
}

function addWarning(guildId, userId, warning) {
  data.warnings[guildId] ??= {};
  (data.warnings[guildId][userId] ??= []).push(warning);
  save();
  return data.warnings[guildId][userId].length;
}

function clearWarnings(guildId, userId) {
  const count = getWarnings(guildId, userId).length;
  if (data.warnings[guildId]) delete data.warnings[guildId][userId];
  save();
  return count;
}

function nextTicketNumber(guildId) {
  data.tickets[guildId] = (data.tickets[guildId] ?? 0) + 1;
  save();
  return data.tickets[guildId];
}

load();
module.exports = { getSettings, setSetting, getWarnings, addWarning, clearWarnings, nextTicketNumber };
