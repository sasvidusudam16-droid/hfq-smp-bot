const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { success } = require('../../utils/embed');
const { e } = require('../../emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for this channel')
    .addIntegerOption((o) => o.setName('seconds').setDescription('0 to turn off (max 21600)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    await interaction.channel.setRateLimitPerUser(seconds);
    const msg = seconds === 0 ? 'Slowmode is now **off**.' : `Slowmode set to **${seconds}s**.`;
    await interaction.reply({ embeds: [success(`${e('timeout')} ${msg}`)] });
  },
};
