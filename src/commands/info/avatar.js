const { SlashCommandBuilder } = require('discord.js');
const { base } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Show someone\'s avatar')
    .addUserOption((o) => o.setName('user').setDescription('Who (default: you)')),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const url = user.displayAvatarURL({ size: 1024 });
    await interaction.reply({ embeds: [base().setTitle(`${user.displayName}'s avatar`).setImage(url).setURL(url)] });
  },
};
