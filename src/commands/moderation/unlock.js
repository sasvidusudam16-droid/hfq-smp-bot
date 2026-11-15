const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { base, modLog } = require('../../utils/embed');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a locked channel')
    .addChannelOption((o) => o.setName('channel').setDescription('Channel (default: this one)').addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') ?? interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
    const embed = base(config.colors.success).setDescription(`${e('unlock')} **${channel}** has been unlocked.`);

    await interaction.reply({ embeds: [embed] });
    if (channel.id !== interaction.channel.id) await channel.send({ embeds: [embed] }).catch(() => {});
    modLog(interaction.guild, base(config.colors.success).setTitle(`${e('unlock')} Channel Unlocked`)
      .addFields({ name: 'Channel', value: `${channel}`, inline: true }, { name: 'Moderator', value: `${interaction.user}`, inline: true }));
  },
};
