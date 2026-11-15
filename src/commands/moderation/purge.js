const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { success, modLog, base } = require('../../utils/embed');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete recent messages in this channel')
    .addIntegerOption((o) => o.setName('amount').setDescription('How many (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let messages = await interaction.channel.messages.fetch({ limit: 100 });
    if (user) messages = messages.filter((m) => m.author.id === user.id);
    messages = [...messages.values()].slice(0, amount);

    // bulkDelete skips messages older than 14 days (Discord limit)
    const deleted = await interaction.channel.bulkDelete(messages, true);
    await interaction.editReply({ embeds: [success(`${e('trash')} Deleted **${deleted.size}** message(s).`)] });

    modLog(interaction.guild, base(config.colors.info).setTitle(`${e('trash')} Messages Purged`).addFields(
      { name: 'Channel', value: `${interaction.channel}`, inline: true },
      { name: 'Moderator', value: `${interaction.user}`, inline: true },
      { name: 'Amount', value: `${deleted.size}`, inline: true },
    ));
  },
};
