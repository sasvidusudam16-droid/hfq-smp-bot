const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { base, success, modLog, fail } = require('../../utils/embed');
const { canModerate } = require('../../utils/mod');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption((o) => o.setName('user').setDescription('Who to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') ?? 'No reason given';

    if (!(await canModerate(interaction, member))) return;
    if (!member.kickable) return fail(interaction, 'I cannot kick that user (their role is above mine).');

    await member.send({ embeds: [base(config.colors.warn)
      .setDescription(`${e('kick')} You were **kicked** from **${interaction.guild.name}**.\n**Reason:** ${reason}`)] }).catch(() => {});

    await member.kick(reason);
    await interaction.reply({ embeds: [success(`${e('kick')} **${member.user.tag}** was kicked.\n**Reason:** ${reason}`)] });

    modLog(interaction.guild, base(config.colors.warn).setTitle(`${e('kick')} Member Kicked`).addFields(
      { name: 'User', value: `${member.user} (${member.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
      { name: 'Reason', value: reason },
    ));
  },
};
