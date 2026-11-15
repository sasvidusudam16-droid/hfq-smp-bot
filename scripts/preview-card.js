// Renders a sample /stats card: node scripts/preview-card.js [playerName]
const fs = require('fs');
const path = require('path');
const { renderStatsCard } = require('../src/card/statsCard');
const { formatMoney } = require('../src/utils/format');

(async () => {
  const png = await renderStatsCard({
    name: process.argv[2] ?? 'jeb_',
    hearts: 14.5,
    maxHearts: 20,
    kills: 342,
    deaths: 97,
    playtimeMinutes: 7742,
    balance: 1_250_000,
    rank: 3,
    killRank: 5,
    status: 'online',
    serverName: 'HFQ Custom SMP',
    ip: 'PLAY.HFQMC.XYZ',
  });
  const out = path.join(__dirname, '..', 'assets', 'stats-preview.png');
  fs.writeFileSync(out, png);
  console.log('Wrote', out);
  console.log('Money:', [400, 1000, 1500, 999_999, 1_250_000, 20e9].map(formatMoney).join('  '));
})();
