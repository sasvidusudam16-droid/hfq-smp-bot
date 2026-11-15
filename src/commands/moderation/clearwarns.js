const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { success, modLog, base } = require('../../utils/embed');
const { clearWarnings } = require('../../utils/db');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Clear all warnings for a member')
    .addUserOption((o) => o.setName('user').setDescription('Whose warnings').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const count = clearWarnings(interaction.guild.id, user.id);
    await interaction.reply({ embeds: [success(`${e('trash')} Cleared **${count}** warning(s) for **${user.tag}**.`)] });
    modLog(interaction.guild, base(config.colors.info).setTitle(`${e('trash')} Warnings Cleared`).addFields(
      { name: 'User', value: `${user}`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
      { name: 'Removed', value: `${count}`, inline: true },
    ));
  },
};
