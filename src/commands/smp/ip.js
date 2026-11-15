const { SlashCommandBuilder } = require('discord.js');
const { base } = require('../../utils/embed');
const { getMc, javaAddress } = require('../../utils/settings');
const { e } = require('../../emojis');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder().setName('ip').setDescription('Get the SMP server IP'),

  async execute(interaction) {
    const mc = getMc(interaction.guild.id);
    const embed = base()
      .setTitle(`${e('grass')} ${config.serverName}`)
      .setDescription(`${e('pickaxe')} Join us and start your adventure!`)
      .addFields(
        { name: `${e('diamond')} Java IP`, value: `\`\`\`${javaAddress(mc)}\`\`\``, inline: true },
        { name: `${e('star')} Version`, value: `\`\`\`${mc.version}\`\`\``, inline: true },
      );
    if (mc.bedrockIp) {
      embed.addFields({ name: `${e('crown')} Bedrock`, value: `\`\`\`IP:   ${mc.bedrockIp}\nPort: ${mc.bedrockPort}\`\`\`` });
    }
    await interaction.reply({ embeds: [embed] });
  },
};
