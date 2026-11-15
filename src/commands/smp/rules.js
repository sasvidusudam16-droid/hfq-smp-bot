const { SlashCommandBuilder } = require('discord.js');
const { base } = require('../../utils/embed');
const { e } = require('../../emojis');
const { getRules } = require('../../utils/settings');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder().setName('rules').setDescription('Show the SMP rules'),

  async execute(interaction) {
    const list = getRules(interaction.guild.id).map((r, i) => `**${i + 1}.** ${r}`).join('\n\n');
    await interaction.reply({ embeds: [base()
      .setTitle(`${e('shield')} ${config.serverName} Rules`)
      .setDescription(`${list}\n\n${e('warn')} *Breaking rules can lead to a warn, timeout or ban.*`)
      .setThumbnail(interaction.guild.iconURL())] });
  },
};
