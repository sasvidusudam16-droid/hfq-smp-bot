// ── HFQ Custom SMP – default settings ────────────────────────
// These are only DEFAULTS. Change them live in Discord with /config
// (IP, port, welcome message, rules) and /ticket (ticket menu).
module.exports = {
  serverName: 'HFQ Custom SMP',

  // Minecraft server info (shown by /ip and /status)
  minecraft: {
    ip: 'play.hfqmc.xyz', // <- change to your real IP
    port: 25565,
    version: '1.21',
    bedrock: { ip: 'play.hfqsmp.net', port: 19132, enabled: false },
  },

  // Embed colours
  colors: {
    main: 0x8b5cf6,    // purple
    success: 0x22c55e,
    error: 0xef4444,
    warn: 0xf59e0b,
    info: 0x3b82f6,
  },

  // Server rules shown by /rules
  rules: [
    'Be respectful to everyone – no harassment, racism or hate.',
    'No griefing, stealing or raiding other players\' builds.',
    'No hacked clients, x-ray, dupes or unfair mods.',
    'No spamming, advertising or excessive caps in chat.',
    'Keep builds appropriate – no offensive structures.',
    'Listen to staff. If you disagree, open a ticket.',
    'Have fun and help keep HFQ a great community!',
  ],
};
