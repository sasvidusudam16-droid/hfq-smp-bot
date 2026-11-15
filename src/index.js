require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env – see .env.example');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildExpressions,
  ],
  partials: [Partials.GuildMember],
});

// Load commands from src/commands/<category>/<name>.js
client.commands = new Collection();
const commandsDir = path.join(__dirname, 'commands');
for (const category of fs.readdirSync(commandsDir)) {
  for (const file of fs.readdirSync(path.join(commandsDir, category)).filter((f) => f.endsWith('.js'))) {
    const command = require(path.join(commandsDir, category, file));
    command.category = category;
    client.commands.set(command.data.name, command);
  }
}

// Load events from src/events/<name>.js
const eventsDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsDir, file));
  const handler = (...args) => event.execute(...args, client);
  for (const name of event.names ?? [event.name]) {
    event.once ? client.once(name, handler) : client.on(name, handler);
  }
}

process.on('unhandledRejection', (err) => console.error('Unhandled error:', err));

client.login(process.env.DISCORD_TOKEN);
