// Shared checks for moderation commands.
const { fail } = require('./embed');

/** Returns true if the target can be moderated, otherwise replies with why not. */
async function canModerate(interaction, member) {
  if (!member) {
    await fail(interaction, 'That user is not in this server.');
    return false;
  }
  if (member.id === interaction.user.id) {
    await fail(interaction, 'You cannot do that to yourself.');
    return false;
  }
  if (member.id === interaction.guild.ownerId) {
    await fail(interaction, 'You cannot do that to the server owner.');
    return false;
  }
  const isOwner = interaction.user.id === interaction.guild.ownerId;
  if (!isOwner && member.roles.highest.position >= interaction.member.roles.highest.position) {
    await fail(interaction, 'That user has an equal or higher role than you.');
    return false;
  }
  return true;
}

/** "10m", "2h", "1d" -> milliseconds (null if invalid) */
function parseDuration(str) {
  const match = /^(\d+)\s*(s|m|h|d|w)$/i.exec(str.trim());
  if (!match) return null;
  const n = Number(match[1]);
  const unit = { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[match[2].toLowerCase()];
  return n * unit;
}

module.exports = { canModerate, parseDuration };
