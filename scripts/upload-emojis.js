// Uploads the HFQ emoji pack as APPLICATION emojis (owned by the bot,
// they don't use any server emoji slots). Run: npm run emojis
// Existing hfq_* emojis are replaced so art updates apply.
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { buildPack } = require('./emoji-art');
const { PREFIX } = require('../src/emojis');

const { DISCORD_TOKEN, CLIENT_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Fill in DISCORD_TOKEN and CLIENT_ID in .env first.');
  process.exit(1);
}

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  const { items: existing } = await rest.get(Routes.applicationEmojis(CLIENT_ID));
  const byName = new Map(existing.map((em) => [em.name, em]));
  const pack = buildPack();

  for (const [key, { png }] of Object.entries(pack)) {
    const name = PREFIX + key;
    const old = byName.get(name);
    if (old) await rest.delete(Routes.applicationEmoji(CLIENT_ID, old.id));
    await rest.post(Routes.applicationEmojis(CLIENT_ID), {
      body: { name, image: `data:image/png;base64,${png.toString('base64')}` },
    });
    console.log(`${old ? 'Replaced' : 'Uploaded'} ${name}`);
  }
  console.log(`\nDone! ${Object.keys(pack).length} emojis are on the bot. Restart the bot to use them.`);
})().catch((err) => {
  console.error('Upload failed:', err.message);
  process.exit(1);
});
