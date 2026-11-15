const { SlashCommandBuilder } = require('discord.js');
const { base } = require('../../utils/embed');
const { e } = require('../../emojis');
const { getMc } = require('../../utils/settings');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder().setName('status').setDescription('Check if the SMP is online and who is playing'),

  async execute(interaction) {
    await interaction.deferReply();
    const { ip, port } = getMc(interaction.guild.id);

    let data;
    try {
      const res = await fetch(`https://api.mcsrvstat.us/3/${ip}:${port}`, { signal: AbortSignal.timeout(10_000) });
      data = await res.json();
    } catch {
      data = { online: false };
    }

    if (!data.online) {
      return interaction.editReply({ embeds: [base(config.colors.error)
        .setTitle(`${e('offline')} ${config.serverName} is Offline`)
        .setDescription(`The server at \`${ip}\` is not responding right now. Try again later!`)] });
    }

    const names = data.players?.list?.map((p) => p.name) ?? [];
    const motd = data.motd?.clean?.join('\n') ?? '';
    const embed = base(config.colors.success)
      .setTitle(`${e('online')} ${config.serverName} is Online`)
      .addFields(
        { name: `${e('players')} Players`, value: `**${data.players.online}** / ${data.players.max}`, inline: true },
        { name: `${e('star')} Version`, value: data.version ?? 'Unknown', inline: true },
        { name: `${e('diamond')} IP`, value: `\`${ip}\``, inline: true },
      );
    if (motd) embed.setDescription(`*${motd}*`);
    if (names.length) embed.addFields({ name: 'Online now', value: names.slice(0, 40).map((n) => `\`${n}\``).join(', ') });
    if (data.icon) embed.setThumbnail(`https://api.mcsrvstat.us/icon/${ip}:${port}`);
    await interaction.editReply({ embeds: [embed] });
  },
};
