const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { base, success, modLog, fail } = require('../../utils/embed');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID')
    .addStringOption((o) => o.setName('user_id').setDescription('The user ID to unban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const id = interaction.options.getString('user_id').trim();
    const reason = interaction.options.getString('reason') ?? 'No reason given';

    try {
      const user = await interaction.guild.members.unban(id, reason);
      await interaction.reply({ embeds: [success(`${e('unlock')} **${user.tag}** was unbanned.`)] });
      modLog(interaction.guild, base(config.colors.success).setTitle(`${e('unlock')} Member Unbanned`).addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user}`, inline: true },
        { name: 'Reason', value: reason },
      ));
    } catch {
      return fail(interaction, 'That user is not banned or the ID is wrong.');
    }
  },
};
