const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { success, fail } = require('../../utils/embed');
const store = require('../../stats/store');
const { pushLink } = require('../../stats/linking');

module.exports = {
  data: new SlashCommandBuilder().setName('disconnect').setDescription('Unlink your Minecraft account'),

  async execute(interaction) {
    const removed = store.unlink(interaction.user.id);
    if (!removed) return fail(interaction, 'You have no Minecraft account linked.');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await pushLink(removed.name, null);
    await interaction.editReply({ embeds: [success(`Unlinked **${removed.name}**.`)] });
  },
};
