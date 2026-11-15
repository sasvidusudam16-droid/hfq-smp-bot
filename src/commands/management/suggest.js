const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { base, success, fail } = require('../../utils/embed');
const { getSettings } = require('../../utils/db');
const { e, raw } = require('../../emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Suggest something for the SMP')
    .addStringOption((o) => o.setName('idea').setDescription('Your suggestion').setRequired(true).setMaxLength(1500)),

  async execute(interaction) {
    const channelId = getSettings(interaction.guild.id).suggestChannel;
    const channel = channelId && interaction.guild.channels.cache.get(channelId);
    if (!channel) return fail(interaction, 'Suggestions are not set up yet. An admin needs to run `/config suggestions`.');

    const msg = await channel.send({ embeds: [base()
      .setTitle(`${e('suggest')} New Suggestion`)
      .setDescription(interaction.options.getString('idea'))
      .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL() })] });

    await msg.react(raw('upvote')).catch(() => {});
    await msg.react(raw('downvote')).catch(() => {});
    await interaction.reply({ embeds: [success(`Your suggestion was posted in ${channel}!`)], flags: MessageFlags.Ephemeral });
  },
};
