const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { base, info } = require('../../utils/embed');
const { getWarnings } = require('../../utils/db');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('See a member\'s warnings')
    .addUserOption((o) => o.setName('user').setDescription('Whose warnings').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const list = getWarnings(interaction.guild.id, user.id);

    if (!list.length) return interaction.reply({ embeds: [info(`**${user.tag}** has no warnings. ${e('star')}`)] });

    const lines = list.slice(-15).map((w, i) =>
      `**${i + 1}.** ${w.reason}\n   by <@${w.moderator}> • <t:${Math.floor(w.date / 1000)}:R>`);

    await interaction.reply({ embeds: [base(config.colors.warn)
      .setTitle(`${e('warn')} Warnings for ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setDescription(lines.join('\n'))
      .addFields({ name: 'Total', value: `${list.length}` })] });
  },
};
