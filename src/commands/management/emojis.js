const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { base } = require('../../utils/embed');
const { e, loadEmojis, DEFAULTS, PREFIX, resolved } = require('../../emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emojis')
    .setDescription('Show / reload the bot\'s custom emojis')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

  async execute(interaction) {
    const { found, total } = await loadEmojis(interaction.client, interaction.guild);
    const lines = Object.keys(DEFAULTS).map((key) => {
      const custom = resolved[key] !== DEFAULTS[key];
      return `${resolved[key]} \`${PREFIX}${key}\` ${custom ? '' : '— *default*'}`;
    });

    await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [base()
      .setTitle(`${e('logo')} HFQ Emoji Pack (${found}/${total} loaded)`)
      .setDescription([
        'These come from the bot\'s emoji pack. To replace one, upload a server emoji with the same name and run `/emojis` again.',
        '',
        ...lines,
      ].join('\n'))] });
  },
};
