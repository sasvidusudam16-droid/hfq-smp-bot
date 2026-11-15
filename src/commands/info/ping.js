const { SlashCommandBuilder } = require('discord.js');
const { info } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot\'s speed'),

  async execute(interaction) {
    const sent = Date.now();
    await interaction.reply({ embeds: [info('Pinging...')] });
    await interaction.editReply({ embeds: [info(
      `Pong! **${Date.now() - sent}ms** reply • **${interaction.client.ws.ping}ms** API`,
    )] });
  },
};
