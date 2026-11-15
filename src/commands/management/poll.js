const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { base, fail } = require('../../utils/embed');
const { e, raw } = require('../../emojis');

const NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption((o) => o.setName('question').setDescription('The question').setRequired(true))
    .addStringOption((o) => o.setName('options').setDescription('Choices split by | e.g. Red | Blue | Green (leave empty for yes/no)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const options = (interaction.options.getString('options') ?? '')
      .split('|').map((s) => s.trim()).filter(Boolean);

    if (options.length === 1) return fail(interaction, 'Give at least 2 options, or none for a yes/no poll.');
    if (options.length > NUMBERS.length) return fail(interaction, `Max ${NUMBERS.length} options.`);

    const embed = base()
      .setTitle(`${e('poll')} ${question}`)
      .setAuthor({ name: `Poll by ${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() });

    const reactions = options.length
      ? options.map((_, i) => NUMBERS[i])
      : [raw('upvote'), raw('downvote')];

    embed.setDescription(options.length
      ? options.map((opt, i) => `${NUMBERS[i]}  ${opt}`).join('\n\n')
      : `${e('upvote')} Yes   •   ${e('downvote')} No`);

    await interaction.reply({ embeds: [embed] });
    const message = await interaction.fetchReply();
    for (const r of reactions) await message.react(r).catch(() => {});
  },
};
