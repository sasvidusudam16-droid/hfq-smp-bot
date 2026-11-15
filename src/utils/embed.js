const { EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../config');
const { e } = require('../emojis');

function base(color = config.colors.main) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: config.serverName })
    .setTimestamp();
}

const success = (msg) => base(config.colors.success).setDescription(`${e('success')} ${msg}`);
const error = (msg) => base(config.colors.error).setDescription(`${e('error')} ${msg}`);
const warn = (msg) => base(config.colors.warn).setDescription(`${e('warn')} ${msg}`);
const info = (msg) => base(config.colors.info).setDescription(`${e('info')} ${msg}`);

/** Send an embed to the configured mod-log channel (if set). */
async function modLog(guild, embed) {
  const { getSettings } = require('./db');
  const id = getSettings(guild.id).logChannel;
  if (!id) return;
  const channel = guild.channels.cache.get(id);
  if (channel?.isTextBased()) await channel.send({ embeds: [embed] }).catch(() => {});
}

/** Reply with an error, ephemeral. */
function fail(interaction, msg) {
  const payload = { embeds: [error(msg)], flags: MessageFlags.Ephemeral };
  return interaction.replied || interaction.deferred
    ? interaction.followUp(payload)
    : interaction.reply(payload);
}

module.exports = { base, success, error, warn, info, modLog, fail };
