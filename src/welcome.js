// Builds the welcome message from the saved /config welcome settings.
const { base } = require('./utils/embed');
const { getWelcome, fill, parseColor } = require('./utils/settings');
const { e } = require('./emojis');

function buildWelcome(member) {
  const w = getWelcome(member.guild.id);
  const vars = { member };
  const embed = base(parseColor(w.color) ?? undefined)
    .setTitle(fill(w.title, vars).slice(0, 256) || null)
    .setDescription(fill(w.message, vars).slice(0, 4000) || null)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields({ name: `${e('players')} Member`, value: `#${member.guild.memberCount}`, inline: true });
  if (/^https?:\/\/\S+$/i.test(w.image)) embed.setImage(w.image);
  return { content: `${member}`, embeds: [embed] };
}

module.exports = { buildWelcome };
