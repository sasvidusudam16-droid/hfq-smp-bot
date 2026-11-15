const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { base, success, modLog, fail } = require('../../utils/embed');
const { addWarning } = require('../../utils/db');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption((o) => o.setName('user').setDescription('Who to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    if (user.bot) return fail(interaction, 'You cannot warn bots.');

    const total = addWarning(interaction.guild.id, user.id, {
      reason,
      moderator: interaction.user.id,
      date: Date.now(),
    });

    await user.send({ embeds: [base(config.colors.warn)
      .setDescription(`${e('warn')} You were **warned** in **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${total}`)] }).catch(() => {});

    await interaction.reply({ embeds: [success(`${e('warn')} **${user.tag}** was warned. They now have **${total}** warning(s).\n**Reason:** ${reason}`)] });

    modLog(interaction.guild, base(config.colors.warn).setTitle(`${e('warn')} Member Warned`).addFields(
      { name: 'User', value: `${user} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
      { name: 'Total', value: `${total}`, inline: true },
      { name: 'Reason', value: reason },
    ));
  },
};
