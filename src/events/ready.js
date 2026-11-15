const { Events, ActivityType } = require('discord.js');
const { loadEmojis } = require('../emojis');
const config = require('../config');
const { startStatsSync } = require('../stats/sftp');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    const guild = client.guilds.cache.get(process.env.GUILD_ID) ?? client.guilds.cache.first();
    const { found, total } = await loadEmojis(client, guild);
    console.log(`Loaded ${found}/${total} HFQ emojis`);
    client.user.setPresence({
      activities: [{ name: `${config.serverName} | /help`, type: ActivityType.Playing }],
      status: 'online',
    });
    startStatsSync();
    console.log(`✅ Logged in as ${client.user.tag} – ${client.commands.size} commands loaded`);
  },
};
