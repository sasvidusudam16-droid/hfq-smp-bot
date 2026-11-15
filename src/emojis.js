// ── Custom emoji system ──────────────────────────────────────
// The HFQ pack (npm run emojis) is uploaded as the bot's own
// application emojis. A server emoji with the same name (hfq_<key>)
// overrides it. Anything missing falls back to the normal emoji below.
const DEFAULTS = {
  logo: '🟪',
  success: '✅',
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  ban: '🔨',
  kick: '👢',
  timeout: '⏳',
  lock: '🔒',
  unlock: '🔓',
  trash: '🗑️',
  online: '🟢',
  offline: '🔴',
  players: '👥',
  grass: '🟩',
  diamond: '💎',
  pickaxe: '⛏️',
  sword: '⚔️',
  crown: '👑',
  ticket: '🎫',
  announce: '📢',
  poll: '📊',
  suggest: '💡',
  upvote: '👍',
  downvote: '👎',
  welcome: '👋',
  star: '⭐',
  settings: '⚙️',
  shield: '🛡️',
};

const PREFIX = 'hfq_';
const resolved = { ...DEFAULTS };

/** Load the bot's application emojis, then server emojis (which override). */
async function loadEmojis(client, guild) {
  const emojis = new Map();
  try {
    (await client.application.emojis.fetch()).forEach((em) => emojis.set(em.name, em));
  } catch (err) {
    console.warn('Could not fetch bot emojis:', err.message);
  }
  if (guild) {
    try {
      (await guild.emojis.fetch()).forEach((em) => emojis.set(em.name, em));
    } catch { /* ignore */ }
  }

  let found = 0;
  for (const key of Object.keys(DEFAULTS)) {
    const custom = emojis.get(PREFIX + key);
    if (custom) {
      resolved[key] = custom.toString();
      found++;
    } else {
      resolved[key] = DEFAULTS[key];
    }
  }
  return { found, total: Object.keys(DEFAULTS).length };
}

/** e('success') -> custom emoji or fallback */
function e(name) {
  return resolved[name] ?? '';
}

/** Raw value usable for buttons / reactions */
function raw(name) {
  return resolved[name] ?? DEFAULTS[name];
}

module.exports = { e, raw, loadEmojis, DEFAULTS, PREFIX, resolved };
