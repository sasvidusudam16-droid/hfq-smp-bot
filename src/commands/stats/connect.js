const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { success, fail, warn } = require('../../utils/embed');
const store = require('../../stats/store');
const { pushLink } = require('../../stats/linking');
const { e } = require('../../emojis');

const NAME = /^[A-Za-z0-9_]{3,16}$/;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('connect')
    .setDescription('Link your Minecraft account to Discord')
    .addStringOption((o) => o.setName('minecraft_username').setDescription('Your Minecraft name').setRequired(true)
      .setMinLength(3).setMaxLength(16)),

  async execute(interaction) {
    const name = interaction.options.getString('minecraft_username').trim();
    if (!NAME.test(name)) return fail(interaction, 'Minecraft names are 3-16 letters, numbers or underscores.');

    const owner = store.getLinkedDiscordId(name);
    if (owner && owner !== interaction.user.id) {
      return fail(interaction, `**${name}** is already linked to another member. Ask staff if this is your account.`);
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    store.link(interaction.user.id, name);
    const known = store.getPlayer(name);
    const result = await pushLink(name, interaction.user.id);

    const lines = [`${e('pickaxe')} Linked to **${known?.name ?? name}**! Use \`/stats\` to see your card.`];
    if (!known) lines.push(`${e('info')} No stats for that name yet. They show up after you play on the server.`);
    if (result.ok && !result.live) lines.push(`${e('timeout')} The in-game link goes live after the next server restart.`);
    if (!result.ok) lines.push(`${e('warn')} Saved here, but the server could not be updated right now.`);
    await interaction.editReply({ embeds: [result.ok ? success(lines.join('\n')) : warn(lines.join('\n'))] });
  },
};
