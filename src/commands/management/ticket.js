const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { base, success, fail } = require('../../utils/embed');
const { setSetting } = require('../../utils/db');
const { getPanel, getTicketOptions, update, resolveEmoji } = require('../../utils/settings');
const { buildModal, field } = require('../../utils/modal');
const tickets = require('../../tickets');
const { e } = require('../../emojis');

const ephemeral = { flags: MessageFlags.Ephemeral };
const MAX_OPTIONS = 25;

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'ticket';

/** Form used for both adding and editing a dropdown option. */
const optionModal = (customId, title, o = {}) => buildModal(customId, title, [
  { id: 'label', label: 'Name in the menu', value: o.label, required: true, max: 50, placeholder: 'Ban Appeal' },
  { id: 'description', label: 'Short description', value: o.description, max: 100, placeholder: 'Appeal a ban or punishment' },
  { id: 'emoji', label: 'Emoji', value: o.emoji, max: 60,
    description: 'An hfq name (diamond, crown, shield...), any emoji, or <:name:id>' },
  { id: 'question', label: 'Question in the pop-up form', value: o.question, max: 45, placeholder: 'Why should we unban you?' },
]);

const readOption = (interaction) => ({
  label: field(interaction, 'label'),
  description: field(interaction, 'description'),
  emoji: field(interaction, 'emoji'),
  question: field(interaction, 'question'),
});

async function savedReply(interaction, msg) {
  const refreshed = await tickets.refreshPanel(interaction.guild);
  const note = refreshed ? ' The posted panel was updated.' : ' Post the panel with `/ticket panel`.';
  return interaction.reply({ embeds: [success(msg + note)], ...ephemeral });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system')
    .addSubcommand((s) => s.setName('panel').setDescription('Post the ticket dropdown panel')
      .addChannelOption((o) => o.setName('channel').setDescription('Where (default: here)').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand((s) => s.setName('setup').setDescription('Edit panel text, ticket category and staff role')
      .addChannelOption((o) => o.setName('category').setDescription('Category where tickets are created').addChannelTypes(ChannelType.GuildCategory))
      .addRoleOption((o) => o.setName('staffrole').setDescription('Role that can see tickets')))
    .addSubcommand((s) => s.setName('add-option').setDescription('Add a new option to the ticket dropdown'))
    .addSubcommand((s) => s.setName('edit-option').setDescription('Edit a dropdown option')
      .addStringOption((o) => o.setName('option').setDescription('Which one').setRequired(true).setAutocomplete(true)))
    .addSubcommand((s) => s.setName('remove-option').setDescription('Remove a dropdown option')
      .addStringOption((o) => o.setName('option').setDescription('Which one').setRequired(true).setAutocomplete(true)))
    .addSubcommand((s) => s.setName('options').setDescription('List the dropdown options'))
    .addSubcommand((s) => s.setName('close').setDescription('Close this ticket'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const gid = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const options = getTicketOptions(gid);

    switch (sub) {
      case 'panel': {
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const message = await channel.send(tickets.buildPanel(interaction.guild));
        tickets.savePanelLocation(interaction.guild, message);
        return interaction.reply({ embeds: [success(`Ticket panel posted in ${channel}. It updates automatically when you change options.`)], ...ephemeral });
      }

      case 'setup': {
        const category = interaction.options.getChannel('category');
        const role = interaction.options.getRole('staffrole');
        if (category) setSetting(gid, 'ticketCategory', category.id);
        if (role) setSetting(gid, 'staffRole', role.id);
        const p = getPanel(gid);
        return interaction.showModal(buildModal('ticket_setup', 'Ticket Panel', [
          { id: 'title', label: 'Panel title', value: p.title, required: true, max: 256 },
          { id: 'description', label: 'Panel message', long: true, value: p.description, required: true,
            description: 'You can use {server} and :hfq_diamond: emojis' },
          { id: 'placeholder', label: 'Dropdown placeholder', value: p.placeholder, required: true, max: 150 },
        ]));
      }

      case 'add-option':
        if (options.length >= MAX_OPTIONS) return fail(interaction, `The dropdown can hold at most ${MAX_OPTIONS} options.`);
        return interaction.showModal(optionModal('ticket_addopt', 'New Ticket Option'));

      case 'edit-option': {
        const o = options.find((x) => x.id === interaction.options.getString('option'));
        if (!o) return fail(interaction, 'Option not found.');
        return interaction.showModal(optionModal(`ticket_editopt:${o.id}`, `Edit: ${o.label}`, o));
      }

      case 'remove-option': {
        const id = interaction.options.getString('option');
        const o = options.find((x) => x.id === id);
        if (!o) return fail(interaction, 'Option not found.');
        setSetting(gid, 'ticketOptions', options.filter((x) => x.id !== id));
        return savedReply(interaction, `${e('trash')} Removed **${o.label}**.`);
      }

      case 'options': {
        const list = options.map((o, i) =>
          `**${i + 1}.** ${resolveEmoji(o.emoji) ?? '•'} **${o.label}** \`${o.id}\`\n${o.description || '*no description*'}`);
        return interaction.reply({ ...ephemeral, embeds: [base()
          .setTitle(`${e('ticket')} Ticket Options (${options.length}/${MAX_OPTIONS})`)
          .setDescription(list.join('\n\n') || 'No options. Add one with `/ticket add-option`.')] });
      }

      case 'close':
        return tickets.close(interaction);
    }
  },

  async autocomplete(interaction) {
    const q = interaction.options.getFocused().toLowerCase();
    const choices = getTicketOptions(interaction.guild.id)
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, 25)
      .map((o) => ({ name: o.label, value: o.id }));
    return interaction.respond(choices);
  },

  handlers: {
    async ticket_setup(interaction) {
      update(interaction.guild.id, 'ticketPanel', {
        title: field(interaction, 'title'),
        description: field(interaction, 'description'),
        placeholder: field(interaction, 'placeholder'),
      });
      return savedReply(interaction, 'Ticket panel saved.');
    },

    async ticket_addopt(interaction) {
      const options = getTicketOptions(interaction.guild.id);
      if (options.length >= MAX_OPTIONS) return fail(interaction, `The dropdown can hold at most ${MAX_OPTIONS} options.`);
      const data = readOption(interaction);
      if (data.emoji && !resolveEmoji(data.emoji)) return fail(interaction, `\`${data.emoji}\` is not a valid emoji.`);

      let id = slug(data.label);
      while (options.some((o) => o.id === id)) id = `${slug(data.label).slice(0, 16)}-${Math.floor(Math.random() * 1000)}`;
      setSetting(interaction.guild.id, 'ticketOptions', [...options, { id, ...data }]);
      return savedReply(interaction, `${resolveEmoji(data.emoji) ?? e('ticket')} Added **${data.label}** to the ticket menu.`);
    },

    async ticket_editopt(interaction, id) {
      const options = getTicketOptions(interaction.guild.id);
      const data = readOption(interaction);
      if (data.emoji && !resolveEmoji(data.emoji)) return fail(interaction, `\`${data.emoji}\` is not a valid emoji.`);
      if (!options.some((o) => o.id === id)) return fail(interaction, 'That option was removed.');
      setSetting(interaction.guild.id, 'ticketOptions', options.map((o) => (o.id === id ? { ...o, ...data } : o)));
      return savedReply(interaction, `Updated **${data.label}**.`);
    },
  },

  // from the panel – open to everyone
  publicHandlers: {
    ticket_select: (interaction) => tickets.onSelect(interaction),
    ticket_modal: (interaction, id) => tickets.onModal(interaction, id),
    ticket_close: (interaction) => tickets.close(interaction),
  },
};
