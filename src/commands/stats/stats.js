const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { fail } = require('../../utils/embed');
const store = require('../../stats/store');
const sftp = require('../../stats/sftp');
const { renderStatsCard } = require('../../card/statsCard');
const { getMc, javaAddress } = require('../../utils/settings');
const { compact, formatMoney, formatPlaytime } = require('../../utils/format');
const config = require('../../config');

const NAME = /^[A-Za-z0-9_.]{3,17}$/; // "." prefix = Bedrock (Floodgate) players

// Online player list from the public status API, cached for 60s.
let onlineCache = { at: 0, names: null };
async function onlineNames(mc) {
  if (Date.now() - onlineCache.at < 60_000) return onlineCache.names;
  let names = null;
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${mc.ip}:${mc.port}`, { signal: AbortSignal.timeout(4000) });
    const json = await res.json();
    if (json.online && Array.isArray(json.players?.list)) names = json.players.list.map((p) => p.name.toLowerCase());
    else if (!json.online) names = [];
  } catch { /* unknown */ }
  onlineCache = { at: Date.now(), names };
  return names;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show a player\'s HFQ stats card')
    .addUserOption((o) => o.setName('user').setDescription('A linked Discord member'))
    .addStringOption((o) => o.setName('minecraft_username').setDescription('Look up a Minecraft name directly')
      .setMinLength(3).setMaxLength(17)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    let name = interaction.options.getString('minecraft_username')?.trim();

    if (name && !NAME.test(name)) return fail(interaction, 'That is not a valid Minecraft name.');
    if (!name) {
      const who = user ?? interaction.user;
      const link = store.getLink(who.id);
      if (!link) {
        return fail(interaction, who.id === interaction.user.id
          ? 'You have not linked your Minecraft account yet. Use `/connect` first, or pass `minecraft_username`.'
          : `${who} has not linked a Minecraft account yet.`);
      }
      name = link.name;
    }

    if (!sftp.isConfigured() && !store.lastSync()) {
      return fail(interaction, 'Stats are not set up yet. The bot owner needs to add the server SFTP login to `.env`.');
    }

    await interaction.deferReply();
    const p = store.getPlayer(name);
    if (!p) return interaction.editReply({ content: `No stats found for **${name}** yet. They need to play on the server first.` });

    const mc = getMc(interaction.guild.id);
    const online = await onlineNames(mc);
    const status = p.hearts <= 0 && p.eliminatedAt ? 'eliminated'
      : online ? (online.includes(p.name.toLowerCase()) ? 'online' : 'offline') : null;

    const data = {
      name: p.name,
      hearts: p.hearts,
      maxHearts: 20,
      kills: p.kills,
      deaths: p.deaths,
      playtimeMinutes: p.minutes,
      balance: p.balance,
      rank: store.rankOf(p.name, 'hearts'),
      killRank: store.rankOf(p.name, 'kills'),
      status,
      serverName: config.serverName,
      ip: javaAddress(mc).toUpperCase(),
    };

    try {
      const png = await renderStatsCard(data);
      const linked = store.getLinkedDiscordId(p.name);
      await interaction.editReply({
        content: linked ? `Stats for **${p.name}** (linked to <@${linked}>)` : `Stats for **${p.name}**`,
        files: [new AttachmentBuilder(png, { name: `hfq-stats-${p.name.toLowerCase()}.png` })],
        allowedMentions: { parse: [] },
      });
    } catch (err) {
      console.error('Stats card failed:', err);
      await interaction.editReply({ content: [
        `**${p.name}** (card could not be drawn)`,
        `❤️ Hearts: ${p.hearts}${data.rank ? ` (#${data.rank})` : ''}`,
        `⚔️ Kills: ${compact(p.kills)} • Deaths: ${compact(p.deaths)}`,
        `💎 Balance: ${formatMoney(p.balance)} • ⏳ Playtime: ${formatPlaytime(p.minutes)}`,
      ].join('\n') });
    }
  },
};
