// Registers slash commands with Discord. Run: npm run deploy
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Fill in DISCORD_TOKEN, CLIENT_ID and GUILD_ID in .env first.');
  process.exit(1);
}

const commands = [];
const commandsDir = path.join(__dirname, 'commands');
for (const category of fs.readdirSync(commandsDir)) {
  for (const file of fs.readdirSync(path.join(commandsDir, category)).filter((f) => f.endsWith('.js'))) {
    commands.push(require(path.join(commandsDir, category, file)).data.toJSON());
  }
}

const rest = new REST().setToken(DISCORD_TOKEN);
(async () => {
  try {
    console.log(`Registering ${commands.length} commands...`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Done! Commands are ready in your server.');
  } catch (err) {
    console.error(err);
  }
})();
