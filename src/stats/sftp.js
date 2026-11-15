// Downloads the HFQLeaderboards export files from the Minecraft host over SFTP.
// Settings come from .env (same names as the old HFQ bot):
//   LIFESTEAL_FTP_HOST, LIFESTEAL_FTP_PORT, LIFESTEAL_FTP_USER, LIFESTEAL_FTP_PASS,
//   LIFESTEAL_FTP_REMOTE_DIR (default /plugins/HFQLeaderboards/export),
//   LIFESTEAL_FTP_POLL_SECONDS (default 30)
const SftpClient = require('ssh2-sftp-client');
const store = require('./store');

const env = () => ({
  host: (process.env.LIFESTEAL_FTP_HOST || '').trim().replace(/^\w+:\/\//, '').replace(/\/+$/, ''),
  port: Number(process.env.LIFESTEAL_FTP_PORT || 22),
  username: process.env.LIFESTEAL_FTP_USER,
  password: process.env.LIFESTEAL_FTP_PASS,
  remoteDir: (process.env.LIFESTEAL_FTP_REMOTE_DIR || '/plugins/HFQLeaderboards/export').replace(/\/+$/, ''),
});

const isConfigured = () => {
  const c = env();
  return Boolean(c.host && c.username && c.password);
};

/** Open an SFTP session, run fn(sftp, config), always close. Hard 60s limit. */
async function withSftp(fn) {
  const c = env();
  // Quiet listeners: the library's defaults print "Global close listener: close event raised"
  // every time a connection is closed normally.
  const sftp = new SftpClient('hfq-stats', {
    error: (err) => console.warn('SFTP:', err.message),
    end: () => {},
    close: () => {},
  });
  const hardStop = setTimeout(() => {
    try { sftp.client?.destroy?.(); } catch { /* gone */ }
  }, 60_000);
  try {
    await sftp.connect({ host: c.host, port: c.port, username: c.username, password: c.password, readyTimeout: 20_000 });
    return await fn(sftp, c);
  } finally {
    clearTimeout(hardStop);
    await sftp.end().catch(() => {});
  }
}

async function readJson(sftp, path) {
  if (!(await sftp.exists(path))) return null;
  return JSON.parse((await sftp.get(path)).toString('utf8') || '{}');
}

async function syncOnce() {
  return withSftp(async (sftp, { remoteDir }) => {
    for (const [file, field] of [['hearts.json', 'hearts'], ['playtime.json', 'minutes'], ['economy.json', 'balance']]) {
      try {
        const snap = await readJson(sftp, `${remoteDir}/${file}`);
        if (snap) store.applySnapshot(field, snap.players);
      } catch (err) {
        console.warn(`Stats sync: could not read ${file}:`, err.message);
      }
    }
    const eventsPath = `${remoteDir}/events.jsonl`;
    if (await sftp.exists(eventsPath)) {
      const lines = (await sftp.get(eventsPath)).toString('utf8').split('\n').map((l) => l.trim()).filter(Boolean);
      const added = store.applyEvents(lines);
      if (added) console.log(`Stats sync: ${added} new kill/death event(s)`);
    }
    // Optional exact kill counts (written by some setups); overrides event counting.
    const kills = await readJson(sftp, `${remoteDir}/kills.json`).catch(() => null);
    if (kills) store.applySnapshot('kills', kills.players);
  });
}

function startStatsSync() {
  if (!isConfigured()) {
    console.warn('Stats sync off: set LIFESTEAL_FTP_HOST / USER / PASS in .env to enable /stats data.');
    return;
  }
  const every = Math.max(10, Number(process.env.LIFESTEAL_FTP_POLL_SECONDS || 30)) * 1000;
  let running = false;
  let failures = 0;
  let lastFail = 0;

  const tick = async () => {
    if (running) return;
    // back off after failures so the host's SSH rate-limit isn't hammered
    if (failures && Date.now() - lastFail < Math.min(300_000, every * 2 ** Math.min(failures, 4))) return;
    running = true;
    try {
      await syncOnce();
      if (failures) console.log('Stats sync: reconnected.');
      failures = 0;
    } catch (err) {
      failures++;
      lastFail = Date.now();
      console.warn(`Stats sync failed (${failures}x):`, err.message);
    } finally {
      running = false;
    }
  };
  tick();
  setInterval(tick, every);
  console.log(`Stats sync: polling ${env().host} every ${every / 1000}s`);
}

// ── /connect: write the link into the plugin's connections.yml ──
const yamlKey = (s) => (/^[a-z0-9_]+$/i.test(s) ? s : `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);

function parseFlatYaml(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = /^\s*"?([^"#:]+?)"?\s*:\s*"?([^"#]*?)"?\s*$/.exec(line);
    if (m && m[1]) out[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return out;
}

/** Add/replace (or remove when discordId is null) a link in connections.yml. Live after /hfqlb reload or restart. */
async function writeConnection(minecraftName, discordId) {
  if (!isConfigured()) return false;
  return withSftp(async (sftp, { remoteDir }) => {
    const file = process.env.LIFESTEAL_LB_CONNECTIONS_PATH || remoteDir.replace(/\/export$/, '') + '/connections.yml';
    const links = (await sftp.exists(file)) ? parseFlatYaml((await sftp.get(file)).toString('utf8')) : {};
    const name = minecraftName.toLowerCase();
    if (discordId) links[name] = String(discordId);
    else delete links[name];
    const yaml = [
      '# Minecraft username (lowercase) -> Discord user id. Managed by the HFQ bot\'s /connect.',
      ...Object.entries(links).map(([n, id]) => `${yamlKey(n)}: "${id}"`),
      '',
    ].join('\n');
    await sftp.put(Buffer.from(yaml, 'utf8'), file);
    return true;
  });
}

module.exports = { startStatsSync, syncOnce, writeConnection, isConfigured };
