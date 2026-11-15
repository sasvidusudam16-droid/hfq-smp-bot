const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { base, success, modLog, fail } = require('../../utils/embed');
const { canModerate, parseDuration } = require('../../utils/mod');
const { e } = require('../../emojis');
const config = require('../../config');

const MAX = 28 * 864e5; // Discord limit: 28 days

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member')
    .addUserOption((o) => o.setName('user').setDescription('Who to timeout').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('e.g. 10m, 2h, 1d (max 28d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('user');
    const durationText = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') ?? 'No reason given';
    const ms = parseDuration(durationText);

    if (!ms || ms > MAX) return fail(interaction, 'Invalid duration. Use something like `10m`, `2h`, `1d` (max 28d).');
    if (!(await canModerate(interaction, member))) return;
    if (!member.moderatable) return fail(interaction, 'I cannot timeout that user (their role is above mine).');

    await member.timeout(ms, reason);
    const until = Math.floor((Date.now() + ms) / 1000);
    await interaction.reply({ embeds: [success(`${e('timeout')} **${member.user.tag}** is timed out until <t:${until}:f>.\n**Reason:** ${reason}`)] });

    modLog(interaction.guild, base(config.colors.warn).setTitle(`${e('timeout')} Member Timed Out`).addFields(
      { name: 'User', value: `${member.user} (${member.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
      { name: 'Duration', value: durationText, inline: true },
      { name: 'Reason', value: reason },
    ));
  },
};
