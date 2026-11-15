const { Events } = require('discord.js');
const { getSettings } = require('../utils/db');
const { getWelcome } = require('../utils/settings');
const { buildWelcome } = require('../welcome');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const s = getSettings(member.guild.id);

    if (s.autoRole) await member.roles.add(s.autoRole).catch((err) => console.error('Autorole failed:', err.message));

    if (!getWelcome(member.guild.id).enabled) return;
    const channel = s.welcomeChannel && member.guild.channels.cache.get(s.welcomeChannel);
    if (channel) await channel.send(buildWelcome(member)).catch(() => {});
  },
};
