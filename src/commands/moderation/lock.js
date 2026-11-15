const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { base, modLog } = require('../../utils/embed');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel so members cannot talk')
    .addChannelOption((o) => o.setName('channel').setDescription('Channel (default: this one)').addChannelTypes(ChannelType.GuildText))
    .addStringOption((o) => o.setName('reason').setDescription('Why'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') ?? interaction.channel;
    const reason = interaction.options.getString('reason') ?? 'No reason given';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason });
    const embed = base(config.colors.error).setDescription(`${e('lock')} **${channel}** has been locked.\n**Reason:** ${reason}`);

    await interaction.reply({ embeds: [embed] });
    if (channel.id !== interaction.channel.id) await channel.send({ embeds: [embed] }).catch(() => {});
    modLog(interaction.guild, base(config.colors.error).setTitle(`${e('lock')} Channel Locked`)
      .addFields({ name: 'Channel', value: `${channel}`, inline: true }, { name: 'Moderator', value: `${interaction.user}`, inline: true }));
  },
};
