const { SlashCommandBuilder } = require('discord.js');
const { base } = require('../../utils/embed');
const { e } = require('../../emojis');

module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Info about this Discord server'),

  async execute(interaction) {
    const g = interaction.guild;
    const owner = await g.fetchOwner();
    await interaction.reply({ embeds: [base()
      .setTitle(`${e('grass')} ${g.name}`)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: `${e('crown')} Owner`, value: `${owner.user}`, inline: true },
        { name: `${e('players')} Members`, value: `${g.memberCount}`, inline: true },
        { name: `${e('star')} Boosts`, value: `${g.premiumSubscriptionCount ?? 0} (Tier ${g.premiumTier})`, inline: true },
        { name: 'Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: 'Roles', value: `${g.roles.cache.size}`, inline: true },
        { name: 'Emojis', value: `${g.emojis.cache.size}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
      )] });
  },
};
