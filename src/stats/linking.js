// Pushes a Discord <-> Minecraft link to the server.
// 1) RCON "hfqlb link" (instant)  2) fallback: write connections.yml over SFTP (live after reload/restart)
const rcon = require('./rcon');
const sftp = require('./sftp');

async function pushLink(minecraftName, discordId) {
  const cmd = discordId ? `hfqlb link ${minecraftName} ${discordId}` : `hfqlb unlink ${minecraftName}`;
  if (rcon.isConfigured()) {
    try {
      const [reply] = await rcon.run([cmd]);
      if (/Linked|Unlinked/i.test(reply)) return { ok: true, live: true };
    } catch (err) {
      console.warn('RCON link failed, trying SFTP:', err.message);
    }
  }
  try {
    if (await sftp.writeConnection(minecraftName, discordId)) return { ok: true, live: false };
  } catch (err) {
    console.warn('SFTP link failed:', err.message);
  }
  return { ok: false };
}

module.exports = { pushLink };
