// Live settings: values saved with /config and /ticket, falling back to config.js.
const config = require('../config');
const { getSettings, setSetting } = require('./db');
const { e, raw, DEFAULTS, PREFIX } = require('../emojis');

const DEFAULT_WELCOME = {
  enabled: true,
  title: ':hfq_logo: Welcome to {server}! :hfq_welcome:',
  message: [
    'Hey {user}, glad you\'re here! :hfq_grass:',
    '',
    ':hfq_diamond: **IP:** `{ip}`',
    ':hfq_shield: Read the rules with `/rules`',
    ':hfq_ticket: Need help? Open a ticket!',
  ].join('\n'),
  image: '',
  color: '',
};

const DEFAULT_PANEL = {
  title: ':hfq_ticket: {server} Support',
  description: 'Need help from staff? Pick a topic from the menu below and a private ticket will open.',
  placeholder: 'Choose a ticket type...',
};

const DEFAULT_TICKET_OPTIONS = [
  { id: 'support', label: 'General Support', description: 'Questions or help with anything', emoji: 'ticket', question: 'How can we help you?' },
  { id: 'report', label: 'Report a Player', description: 'Griefing, cheating or rule breaking', emoji: 'shield', question: 'Who are you reporting and what did they do?' },
  { id: 'bug', label: 'Bug Report', description: 'Something is broken on the server', emoji: 'settings', question: 'What is the bug and how do we reproduce it?' },
  { id: 'items', label: 'Lost Items', description: 'Lost items or rollback request', emoji: 'diamond', question: 'What did you lose, where and when?' },
  { id: 'apply', label: 'Staff Application', description: 'Apply to join the HFQ team', emoji: 'crown', question: 'Why do you want to join the staff team?' },
];

/** Minecraft server info. */
function getMc(guildId) {
  const d = config.minecraft;
  return {
    ip: d.ip,
    port: d.port,
    version: d.version,
    bedrockIp: d.bedrock.enabled ? d.bedrock.ip : '',
    bedrockPort: d.bedrock.port,
    ...getSettings(guildId).minecraft,
  };
}

/** "play.x.net" or "play.x.net:25566" */
function javaAddress(mc) {
  return Number(mc.port) === 25565 ? mc.ip : `${mc.ip}:${mc.port}`;
}

const getRules = (guildId) => getSettings(guildId).rules ?? config.rules;
const getWelcome = (guildId) => ({ ...DEFAULT_WELCOME, ...getSettings(guildId).welcome });
const getPanel = (guildId) => ({ ...DEFAULT_PANEL, ...getSettings(guildId).ticketPanel });
const getTicketOptions = (guildId) => getSettings(guildId).ticketOptions ?? DEFAULT_TICKET_OPTIONS;

function update(guildId, key, patch) {
  setSetting(guildId, key, { ...getSettings(guildId)[key], ...patch });
}

/**
 * Fill placeholders: {user} {username} {server} {count} {ip}
 * and :hfq_name: -> the bot's custom emoji.
 */
function fill(text, { member, guild } = {}) {
  if (!text) return text;
  const g = guild ?? member?.guild;
  return text
    .replaceAll('{user}', member ? `${member}` : '@user')
    .replaceAll('{username}', member?.user.username ?? 'user')
    .replaceAll('{server}', config.serverName)
    .replaceAll('{count}', g ? `${g.memberCount}` : '0')
    .replaceAll('{ip}', g ? javaAddress(getMc(g.id)) : config.minecraft.ip)
    .replace(new RegExp(`:${PREFIX}(\\w+):`, 'g'), (m, key) => (key in DEFAULTS ? e(key) : m));
}

/** Turn what an admin typed ("diamond", ":hfq_diamond:", "🔥", "<:x:123>") into a component emoji. */
function resolveEmoji(input) {
  if (!input) return undefined;
  const s = input.trim();
  const key = s.replace(/^:?(hfq_)?/, '').replace(/:$/, '');
  if (key in DEFAULTS) return raw(key);
  if (/^<a?:\w+:\d+>$/.test(s)) return s;
  if (/^\p{Extended_Pictographic}/u.test(s)) return s;
  return undefined;
}

/** "#8b5cf6" -> number, or null if invalid */
function parseColor(input) {
  const m = /^#?([0-9a-f]{6})$/i.exec(input?.trim() ?? '');
  return m ? parseInt(m[1], 16) : null;
}

module.exports = {
  getMc, javaAddress, getRules, getWelcome, getPanel, getTicketOptions, update, fill, resolveEmoji, parseColor,
  DEFAULT_WELCOME, DEFAULT_PANEL, DEFAULT_TICKET_OPTIONS,
};
