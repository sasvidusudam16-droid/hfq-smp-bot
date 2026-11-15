// Minimal Minecraft RCON client (optional).
// .env: LIFESTEAL_RCON_HOST (default: LIFESTEAL_FTP_HOST), LIFESTEAL_RCON_PORT (25575), LIFESTEAL_RCON_PASSWORD
const net = require('net');

const AUTH = 3;
const COMMAND = 2;

const target = () => {
  const host = (process.env.LIFESTEAL_RCON_HOST || process.env.LIFESTEAL_FTP_HOST || '').trim().replace(/^\w+:\/\//, '');
  const password = process.env.LIFESTEAL_RCON_PASSWORD;
  return host && password ? { host, port: Number(process.env.LIFESTEAL_RCON_PORT || 25575), password } : null;
};
const isConfigured = () => Boolean(target());

function packet(id, type, body) {
  const b = Buffer.from(body, 'utf8');
  const p = Buffer.alloc(14 + b.length);
  p.writeInt32LE(10 + b.length, 0);
  p.writeInt32LE(id, 4);
  p.writeInt32LE(type, 8);
  b.copy(p, 12);
  return p;
}

/** Run commands over one RCON session. Resolves with their text responses. */
function run(commands, timeoutMs = 8000) {
  const t = target();
  if (!t) return Promise.reject(new Error('RCON is not configured'));
  return new Promise((resolve, reject) => {
    const socket = net.connect(t.port, t.host);
    const replies = [];
    let buf = Buffer.alloc(0);
    let step = 0; // 0 = auth, then command index + 1
    const done = (err) => {
      clearTimeout(timer);
      socket.destroy();
      err ? reject(err) : resolve(replies);
    };
    const timer = setTimeout(() => done(new Error('RCON timed out')), timeoutMs);
    const next = () => {
      if (step > commands.length) return done();
      socket.write(packet(step + 1, COMMAND, commands[step - 1]));
    };

    socket.on('connect', () => socket.write(packet(1, AUTH, t.password)));
    socket.on('error', done);
    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= 4 && buf.length >= 4 + buf.readInt32LE(0)) {
        const len = buf.readInt32LE(0);
        const id = buf.readInt32LE(4);
        const body = buf.slice(12, 4 + len - 2).toString('utf8');
        buf = buf.slice(4 + len);
        if (step === 0) {
          if (id === -1) return done(new Error('RCON password is wrong'));
          step = 1;
          next();
        } else {
          replies.push(body);
          step++;
          next();
        }
      }
    });
  });
}

module.exports = { run, isConfigured };
