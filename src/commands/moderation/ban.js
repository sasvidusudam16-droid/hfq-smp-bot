const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { base, success, modLog, fail } = require('../../utils/embed');
const { canModerate } = require('../../utils/mod');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption((o) => o.setName('user').setDescription('Who to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why'))
    .addIntegerOption((o) =>
      o.setName('delete_days').setDescription('Delete their messages from the last X days (0-7)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') ?? 'No reason given';
    const days = interaction.options.getInteger('delete_days') ?? 0;
    const member = interaction.options.getMember('user');

    if (member) {
      if (!(await canModerate(interaction, member))) return;
      if (!member.bannable) return fail(interaction, 'I cannot ban that user (their role is above mine).');
    }

    await user.send({ embeds: [base(config.colors.error)
      .setDescription(`${e('ban')} You were **banned** from **${interaction.guild.name}**.\n**Reason:** ${reason}`)] }).catch(() => {});

    await interaction.guild.members.ban(user.id, { reason, deleteMessageSeconds: days * 86400 });
    await interaction.reply({ embeds: [success(`${e('ban')} **${user.tag}** was banned.\n**Reason:** ${reason}`)] });

    modLog(interaction.guild, base(config.colors.error).setTitle(`${e('ban')} Member Banned`).addFields(
      { name: 'User', value: `${user} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
      { name: 'Reason', value: reason },
    ));
  },
};
