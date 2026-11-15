// Ticket system: dropdown panel -> pop-up form -> private ticket channel.
const {
  ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');
const { base, success, fail, modLog } = require('./utils/embed');
const { getSettings, setSetting, nextTicketNumber } = require('./utils/db');
const { getPanel, getTicketOptions, fill, resolveEmoji } = require('./utils/settings');
const { buildModal, field } = require('./utils/modal');
const { e, raw } = require('./emojis');
const config = require('./config');

/** The panel message: embed + dropdown of ticket types. */
function buildPanel(guild) {
  const panel = getPanel(guild.id);
  const options = getTicketOptions(guild.id);
  const embed = base()
    .setTitle(fill(panel.title, { guild }).slice(0, 256))
    .setDescription(fill(panel.description, { guild }).slice(0, 4000));

  if (!options.length) {
    embed.addFields({ name: 'Closed', value: 'Tickets are not open right now.' });
    return { embeds: [embed], components: [] };
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select')
    .setPlaceholder(panel.placeholder.slice(0, 150))
    .addOptions(options.map((o) => {
      const opt = new StringSelectMenuOptionBuilder().setLabel(o.label).setValue(o.id);
      if (o.description) opt.setDescription(o.description);
      const emoji = resolveEmoji(o.emoji);
      if (emoji) opt.setEmoji(emoji);
      return opt;
    }));
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}

/** Re-draw the posted panel after options/text change. Returns true if updated. */
async function refreshPanel(guild) {
  const loc = getSettings(guild.id).panelMessage;
  if (!loc) return false;
  try {
    const channel = await guild.channels.fetch(loc.channelId);
    const message = await channel.messages.fetch(loc.messageId);
    await message.edit(buildPanel(guild));
    return true;
  } catch {
    return false;
  }
}

const findOpenTicket = (guild, userId) => guild.channels.cache.find((c) => c.topic?.startsWith(`ticket:${userId}`));

/** Dropdown picked -> show the pop-up form. */
async function onSelect(interaction) {
  const option = getTicketOptions(interaction.guild.id).find((o) => o.id === interaction.values[0]);
  // reset the dropdown so the same option can be picked again
  interaction.message.edit(buildPanel(interaction.guild)).catch(() => {});

  if (!option) return fail(interaction, 'That ticket type no longer exists.');
  const existing = findOpenTicket(interaction.guild, interaction.user.id);
  if (existing) return fail(interaction, `You already have an open ticket: ${existing}`);

  return interaction.showModal(buildModal(`ticket_modal:${option.id}`, option.label, [
    { id: 'ign', label: 'Minecraft username', required: true, max: 16, placeholder: 'Steve' },
    { id: 'details', label: (option.question || 'Describe your issue'), long: true, required: true, max: 1500 },
  ]));
}

/** Form submitted -> create the private ticket channel. */
async function onModal(interaction, optionId) {
  const { guild, user } = interaction;
  const settings = getSettings(guild.id);
  const option = getTicketOptions(guild.id).find((o) => o.id === optionId) ?? { id: optionId, label: 'Ticket' };

  const existing = findOpenTicket(guild, user.id);
  if (existing) return fail(interaction, `You already have an open ticket: ${existing}`);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const number = String(nextTicketNumber(guild.id)).padStart(4, '0');
  const allow = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles];
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow },
    { id: guild.members.me.id, allow: [...allow, PermissionFlagsBits.ManageChannels] },
  ];
  if (settings.staffRole) overwrites.push({ id: settings.staffRole, allow });

  const channel = await guild.channels.create({
    name: `${option.id}-${number}-${user.username}`.slice(0, 90),
    type: ChannelType.GuildText,
    parent: settings.ticketCategory ?? null,
    topic: `ticket:${user.id} | ${option.label}`,
    permissionOverwrites: overwrites,
  });

  const emoji = resolveEmoji(option.emoji);
  const embed = base()
    .setTitle(`${emoji ?? e('ticket')} ${option.label} • #${number}`)
    .setDescription(`Hey ${user}, thanks for reaching out to **${config.serverName}** staff! We'll help you soon.`)
    .addFields(
      { name: `${e('pickaxe')} Minecraft username`, value: `\`${field(interaction, 'ign')}\``, inline: true },
      { name: `${e('players')} Discord`, value: `${user}`, inline: true },
      { name: option.question || 'Details', value: field(interaction, 'details').slice(0, 1024) },
    );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji(raw('lock')),
  );

  await channel.send({
    content: `${user}${settings.staffRole ? ` <@&${settings.staffRole}>` : ''}`,
    embeds: [embed],
    components: [row],
  });

  await interaction.editReply({ embeds: [success(`Your ticket is ready: ${channel}`)] });
  modLog(guild, base(config.colors.info).setTitle(`${e('ticket')} Ticket Opened`).addFields(
    { name: 'User', value: `${user}`, inline: true },
    { name: 'Type', value: option.label, inline: true },
    { name: 'Channel', value: `${channel}`, inline: true },
  ));
}

async function close(interaction) {
  const { channel, member, guild } = interaction;
  const ownerId = /^ticket:(\d+)/.exec(channel.topic ?? '')?.[1];
  if (!ownerId) return fail(interaction, 'This is not a ticket channel.');

  const staffRole = getSettings(guild.id).staffRole;
  const isStaff = member.permissions.has(PermissionFlagsBits.ManageChannels) || (staffRole && member.roles.cache.has(staffRole));
  if (member.id !== ownerId && !isStaff) return fail(interaction, 'Only staff or the ticket owner can close this.');

  await interaction.reply({ embeds: [base(config.colors.error).setDescription(`${e('lock')} Closing this ticket in 5 seconds...`)] });
  modLog(guild, base(config.colors.error).setTitle(`${e('lock')} Ticket Closed`)
    .addFields({ name: 'Ticket', value: channel.name, inline: true }, { name: 'Closed by', value: `${member}`, inline: true }));
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}

function savePanelLocation(guild, message) {
  setSetting(guild.id, 'panelMessage', { channelId: message.channelId, messageId: message.id });
}

module.exports = { buildPanel, refreshPanel, savePanelLocation, onSelect, onModal, close };
