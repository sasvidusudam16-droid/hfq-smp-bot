const { SlashCommandBuilder } = require('discord.js');
const { base } = require('../../utils/embed');
const { e } = require('../../emojis');
const config = require('../../config');

const CATEGORIES = {
  moderation: ['shield', 'Moderation'],
  smp: ['pickaxe', 'SMP'],
  stats: ['diamond', 'Stats'],
  management: ['settings', 'Management'],
  info: ['info', 'Info'],
};

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('List all bot commands'),

  async execute(interaction) {
    const embed = base()
      .setTitle(`${e('logo')} ${config.serverName} Bot`)
      .setDescription('Here is everything I can do:')
      .setThumbnail(interaction.client.user.displayAvatarURL());

    for (const [cat, [emoji, label]] of Object.entries(CATEGORIES)) {
      const cmds = interaction.client.commands.filter((c) => c.category === cat);
      if (!cmds.size) continue;
      embed.addFields({
        name: `${e(emoji)} ${label}`,
        value: cmds.map((c) => `\`/${c.data.name}\` – ${c.data.description}`).join('\n'),
      });
    }
    await interaction.reply({ embeds: [embed] });
  },
};
