const { SlashCommandBuilder } = require('discord.js');
const { base } = require('../../utils/embed');
const { getWarnings } = require('../../utils/db');
const { e } = require('../../emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Info about a member')
    .addUserOption((o) => o.setName('user').setDescription('Who (default: you)')),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const member = interaction.options.getMember('user') ?? (user.id === interaction.user.id ? interaction.member : null);
    const ts = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;

    const embed = base()
      .setTitle(`${e('players')} ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Account Created', value: ts(user.createdTimestamp), inline: true },
        { name: `${e('warn')} Warnings`, value: `${getWarnings(interaction.guild.id, user.id).length}`, inline: true },
      );

    if (member) {
      const roles = member.roles.cache.filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position);
      embed.setColor(member.displayColor || undefined).addFields(
        { name: 'Joined Server', value: ts(member.joinedTimestamp), inline: true },
        { name: `Roles (${roles.size})`, value: roles.size ? roles.first(15).join(' ') : 'None' },
      );
    }
    await interaction.reply({ embeds: [embed] });
  },
};
