const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { base, success, fail } = require('../../utils/embed');
const { getSettings, setSetting } = require('../../utils/db');
const {
  getMc, javaAddress, getRules, getWelcome, update, parseColor, DEFAULT_WELCOME,
} = require('../../utils/settings');
const { buildModal, field } = require('../../utils/modal');
const { buildWelcome } = require('../../welcome');
const { e } = require('../../emojis');
const config = require('../../config');

const ephemeral = { flags: MessageFlags.Ephemeral };
const textChannel = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure the bot (opens a form)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) => s.setName('server').setDescription('Set the Minecraft IP, port and version'))
    .addSubcommand((s) => s.setName('welcome').setDescription('Edit the welcome message')
      .addChannelOption((o) => o.setName('channel').setDescription('Welcome channel').addChannelTypes(...textChannel))
      .addBooleanOption((o) => o.setName('enabled').setDescription('Turn welcome messages on/off')))
    .addSubcommand((s) => s.setName('welcome-test').setDescription('Preview the welcome message on yourself'))
    .addSubcommand((s) => s.setName('welcome-reset').setDescription('Reset the welcome message to default'))
    .addSubcommand((s) => s.setName('rules').setDescription('Edit the server rules'))
    .addSubcommand((s) => s.setName('logs').setDescription('Set the mod-log channel')
      .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(...textChannel)))
    .addSubcommand((s) => s.setName('suggestions').setDescription('Set the suggestions channel')
      .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true).addChannelTypes(...textChannel)))
    .addSubcommand((s) => s.setName('autorole').setDescription('Role given to new members (leave empty to turn off)')
      .addRoleOption((o) => o.setName('role').setDescription('Role')))
    .addSubcommand((s) => s.setName('view').setDescription('Show all current settings')),

  async execute(interaction) {
    const gid = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'server': {
        const mc = getMc(gid);
        return interaction.showModal(buildModal('config_server', 'Minecraft Server', [
          { id: 'ip', label: 'Java IP', value: mc.ip, required: true, placeholder: 'play.example.net' },
          { id: 'port', label: 'Java Port', value: mc.port, required: true, max: 5 },
          { id: 'version', label: 'Version', value: mc.version, placeholder: '1.21' },
          { id: 'bedrockIp', label: 'Bedrock IP', description: 'Leave empty if you have no Bedrock support', value: mc.bedrockIp },
          { id: 'bedrockPort', label: 'Bedrock Port', value: mc.bedrockPort, max: 5 },
        ]));
      }

      case 'welcome': {
        const channel = interaction.options.getChannel('channel');
        const enabled = interaction.options.getBoolean('enabled');
        if (channel) setSetting(gid, 'welcomeChannel', channel.id);
        if (enabled !== null) update(gid, 'welcome', { enabled });
        const w = getWelcome(gid);
        return interaction.showModal(buildModal('config_welcome', 'Welcome Message', [
          { id: 'title', label: 'Title', value: w.title, max: 256 },
          { id: 'message', label: 'Message', long: true, value: w.message, required: true,
            description: 'Use {user} {username} {server} {count} {ip} and :hfq_diamond: emojis' },
          { id: 'image', label: 'Image / GIF URL (optional)', value: w.image, placeholder: 'https://...' },
          { id: 'color', label: 'Colour (optional)', value: w.color, placeholder: '#8b5cf6', max: 7 },
        ]));
      }

      case 'welcome-test':
        return interaction.reply({ ...buildWelcome(interaction.member), ...ephemeral });

      case 'welcome-reset':
        setSetting(gid, 'welcome', { ...DEFAULT_WELCOME, enabled: getWelcome(gid).enabled });
        return interaction.reply({ embeds: [success('Welcome message reset to default.')], ...ephemeral });

      case 'rules':
        return interaction.showModal(buildModal('config_rules', 'Server Rules', [
          { id: 'rules', label: 'Rules (one per line)', long: true, required: true, value: getRules(gid).join('\n') },
        ]));

      case 'logs':
      case 'suggestions': {
        const channel = interaction.options.getChannel('channel');
        setSetting(gid, sub === 'logs' ? 'logChannel' : 'suggestChannel', channel.id);
        return interaction.reply({ embeds: [success(`${sub === 'logs' ? 'Mod logs' : 'Suggestions'} will go to ${channel}.`)], ...ephemeral });
      }

      case 'autorole': {
        const role = interaction.options.getRole('role');
        setSetting(gid, 'autoRole', role?.id ?? null);
        return interaction.reply({ embeds: [success(role ? `New members will get ${role}.` : 'Autorole turned off.')], ...ephemeral });
      }

      case 'view': {
        const s = getSettings(gid);
        const mc = getMc(gid);
        const w = getWelcome(gid);
        const ch = (id) => (id ? `<#${id}>` : '`not set`');
        const rl = (id) => (id ? `<@&${id}>` : '`not set`');
        return interaction.reply({ ...ephemeral, embeds: [base()
          .setTitle(`${e('settings')} ${config.serverName} Settings`)
          .addFields(
            { name: `${e('grass')} Java`, value: `\`${javaAddress(mc)}\` (${mc.version})`, inline: true },
            { name: `${e('pickaxe')} Bedrock`, value: mc.bedrockIp ? `\`${mc.bedrockIp}:${mc.bedrockPort}\`` : '`off`', inline: true },
            { name: `${e('shield')} Rules`, value: `${getRules(gid).length} rules`, inline: true },
            { name: `${e('welcome')} Welcome`, value: `${ch(s.welcomeChannel)} ${w.enabled ? e('online') : e('offline')}`, inline: true },
            { name: 'Mod Logs', value: ch(s.logChannel), inline: true },
            { name: 'Suggestions', value: ch(s.suggestChannel), inline: true },
            { name: 'Auto Role', value: rl(s.autoRole), inline: true },
            { name: `${e('ticket')} Staff Role`, value: rl(s.staffRole), inline: true },
            { name: 'Ticket Category', value: ch(s.ticketCategory), inline: true },
          )] });
      }
    }
  },

  // Pop-up form submissions
  handlers: {
    async config_server(interaction) {
      const port = Number(field(interaction, 'port'));
      const bedrockPort = Number(field(interaction, 'bedrockPort') || 19132);
      if (!Number.isInteger(port) || port < 1 || port > 65535) return fail(interaction, 'Java port must be a number from 1 to 65535.');
      if (!Number.isInteger(bedrockPort) || bedrockPort < 1 || bedrockPort > 65535) return fail(interaction, 'Bedrock port must be a number from 1 to 65535.');

      const mc = {
        ip: field(interaction, 'ip'),
        port,
        version: field(interaction, 'version') || 'Latest',
        bedrockIp: field(interaction, 'bedrockIp'),
        bedrockPort,
      };
      setSetting(interaction.guild.id, 'minecraft', mc);
      return interaction.reply({ ...ephemeral, embeds: [success(
        `${e('grass')} Server saved!\n**Java:** \`${javaAddress(mc)}\` • ${mc.version}` +
        (mc.bedrockIp ? `\n**Bedrock:** \`${mc.bedrockIp}\` port \`${mc.bedrockPort}\`` : ''),
      )] });
    },

    async config_welcome(interaction) {
      const color = field(interaction, 'color');
      const image = field(interaction, 'image');
      if (color && parseColor(color) === null) return fail(interaction, 'Colour must be a hex code like `#8b5cf6`.');
      if (image && !/^https?:\/\/\S+$/i.test(image)) return fail(interaction, 'Image must be a link starting with http.');

      update(interaction.guild.id, 'welcome', {
        title: field(interaction, 'title'),
        message: field(interaction, 'message'),
        image,
        color,
      });
      const channelId = getSettings(interaction.guild.id).welcomeChannel;
      const note = channelId ? `It will be posted in <#${channelId}>.` : `${e('warn')} No channel set yet. Use \`/config welcome channel:\`.`;
      return interaction.reply({ ...buildWelcome(interaction.member), ...ephemeral, content: `${e('success')} Welcome message saved! ${note}\nHere's a preview:` });
    },

    async config_rules(interaction) {
      const rules = field(interaction, 'rules').split('\n').map((r) => r.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
      if (!rules.length) return fail(interaction, 'Add at least one rule.');
      setSetting(interaction.guild.id, 'rules', rules);
      return interaction.reply({ embeds: [success(`${e('shield')} Saved **${rules.length}** rules. See them with \`/rules\`.`)], ...ephemeral });
    },
  },
};
