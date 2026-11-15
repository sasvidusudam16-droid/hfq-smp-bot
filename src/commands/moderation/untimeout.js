const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { base, success, modLog, fail } = require('../../utils/embed');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a member\'s timeout')
    .addUserOption((o) => o.setName('user').setDescription('Who to unmute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('user');
    if (!member) return fail(interaction, 'That user is not in this server.');
    if (!member.isCommunicationDisabled()) return fail(interaction, 'That user is not timed out.');

    await member.timeout(null);
    await interaction.reply({ embeds: [success(`${e('unlock')} **${member.user.tag}**'s timeout was removed.`)] });
    modLog(interaction.guild, base(config.colors.success).setTitle(`${e('unlock')} Timeout Removed`).addFields(
      { name: 'User', value: `${member.user}`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
    ));
  },
};
