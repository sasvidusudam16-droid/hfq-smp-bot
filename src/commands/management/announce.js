const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { base, success, fail } = require('../../utils/embed');
const { e } = require('../../emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post an announcement embed')
    .addChannelOption((o) => o.setName('channel').setDescription('Where to post').setRequired(true)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addStringOption((o) => o.setName('message').setDescription('The text. Use \\n for a new line').setRequired(true))
    .addStringOption((o) => o.setName('title').setDescription('Title (optional)'))
    .addStringOption((o) => o.setName('ping').setDescription('Who to ping')
      .addChoices({ name: 'Nobody', value: 'none' }, { name: '@everyone', value: 'everyone' }, { name: '@here', value: 'here' }))
    .addAttachmentOption((o) => o.setName('image').setDescription('Image to show (optional)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const text = interaction.options.getString('message').replace(/\\n/g, '\n');
    const title = interaction.options.getString('title') ?? 'Announcement';
    const ping = interaction.options.getString('ping') ?? 'none';
    const image = interaction.options.getAttachment('image');

    const embed = base()
      .setTitle(`${e('announce')} ${title}`)
      .setDescription(text)
      .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL() });
    if (image?.contentType?.startsWith('image/')) embed.setImage(image.url);

    try {
      await channel.send({
        content: ping === 'none' ? undefined : `@${ping}`,
        embeds: [embed],
        allowedMentions: { parse: ping === 'none' ? [] : ['everyone'] },
      });
    } catch {
      return fail(interaction, `I cannot send messages in ${channel}.`);
    }
    await interaction.reply({ embeds: [success(`Announcement posted in ${channel}.`)], flags: MessageFlags.Ephemeral });
  },
};
