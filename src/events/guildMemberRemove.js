const { Events } = require('discord.js');
const { base, modLog } = require('../utils/embed');
const config = require('../config');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    modLog(member.guild, base(config.colors.warn)
      .setTitle('Member Left')
      .setDescription(`**${member.user.tag}** (${member.id}) left the server.`)
      .setThumbnail(member.user.displayAvatarURL()));
  },
};
