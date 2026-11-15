// Uploads the bot to your hosting panel over SFTP.
//   npm run upload -- sftp://host:2022 username
// You type the password yourself (hidden). Uploads code, .env and data/ –
// NOT node_modules (the server must install its own Linux packages).
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const SftpClient = require('ssh2-sftp-client');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '.claude']);

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}
function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
  });
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

(async () => {
  const urlArg = process.argv[2] || await ask('SFTP address (e.g. sftp://usa-b1.aurex.lk:2022): ');
  const url = new URL(urlArg.includes('://') ? urlArg : `sftp://${urlArg}`);
  const username = process.argv[3] || await ask('SFTP username: ');
  const password = await askHidden('SFTP password (hidden): ');
  const remoteRoot = (process.argv[4] || '/').replace(/\/+$/, '') || '';

  const files = walk(ROOT);
  if (!files.some((f) => path.basename(f) === '.env')) console.warn('Warning: no .env found – the bot will not start on the server without it.');

  const sftp = new SftpClient('hfq-upload', { error: () => {}, end: () => {}, close: () => {} });
  console.log(`Connecting to ${url.hostname}:${url.port || 22} ...`);
  await sftp.connect({ host: url.hostname, port: Number(url.port || 22), username, password, readyTimeout: 30_000 });

  let done = 0;
  const madeDirs = new Set();
  for (const file of files) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const remote = `${remoteRoot}/${rel}`;
    const dir = remote.slice(0, remote.lastIndexOf('/'));
    if (dir && !madeDirs.has(dir)) {
      await sftp.mkdir(dir, true).catch(() => {});
      madeDirs.add(dir);
    }
    await sftp.fastPut(file, remote);
    done++;
    process.stdout.write(`\rUploaded ${done}/${files.length}  ${rel.slice(0, 60).padEnd(60)}`);
  }
  await sftp.end();
  console.log(`\n\nDone! ${done} files uploaded.`);
  console.log('In the panel: set the startup file to index.js, then start the server.');
  console.log('The server installs packages from package.json on start (or run "npm install" in its console).');
})().catch((err) => {
  console.error('\nUpload failed:', err.message);
  if (/handshake|timed out/i.test(err.message)) console.error('Your network may block SFTP – try a phone hotspot, or upload the zip in the panel file manager.');
  process.exit(1);
});
