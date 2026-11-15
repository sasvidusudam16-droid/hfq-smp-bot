# HFQ Custom SMP Bot

A Discord management bot for the **HFQ Custom SMP** Minecraft server. It uses slash commands, clean embeds and your server's own custom emojis.

## Commands

| Category | Commands |
|---|---|
| 🛡️ Moderation | `/ban` `/unban` `/kick` `/timeout` `/untimeout` `/warn` `/warnings` `/clearwarns` `/purge` `/lock` `/unlock` `/slowmode` |
| ⛏️ SMP | `/ip` `/status` `/rules` |
| 💎 Stats | `/stats` `/connect` `/disconnect` |
| 📋 Management | `/config` `/ticket` `/announce` `/poll` `/suggest` `/emojis` |
| ℹ️ Info | `/help` `/serverinfo` `/userinfo` `/avatar` `/ping` |

Automatic: welcome messages, autorole on join, mod logs, ticket channels, and emoji reload when emojis change.

## Setup (5 minutes)

### 1. Create the bot
1. Go to https://discord.com/developers/applications → **New Application** → name it `HFQ Bot`.
2. **Bot** tab → **Reset Token** → copy the token.
3. On the same page, turn on **Server Members Intent**.
4. **OAuth2 → URL Generator** → tick `bot` and `applications.commands`, then under permissions tick **Administrator**. Open the link and add the bot to your server.

### 2. Configure
1. Copy `.env.example` to `.env` and fill in:
   - `DISCORD_TOKEN` – the bot token
   - `CLIENT_ID` – the Application ID (General Information tab)
   - `GUILD_ID` – your server ID (turn on Developer Mode in Discord, right-click the server → Copy Server ID)
2. Edit `src/config.js` to set your **Minecraft IP**, version and rules.

### 3. Run
```bash
npm install
npm run deploy
npm start
```
Only run `npm run deploy` again when you add or change commands.

### Deploying on a server

**Linux / VPS:**
```bash
git clone <this repo> hfq-bot && cd hfq-bot
chmod +x deploy.sh
./deploy.sh            # first run creates .env, so fill it in and run it again
./deploy.sh --emojis   # also upload the emoji pack (first deploy only)
```
To update later, run `./deploy.sh` again. It pulls the latest code, reinstalls packages, re-registers commands and restarts the bot (with pm2 if it's installed).

**Hosting panel (Pterodactyl / Aurex Node.js server):**
1. Upload the files, or set the server's Git repo to this one.
2. Set the startup file to `index.js`.
3. Upload your `.env`.
4. Start the server. Run `npm run deploy` once from the console to register the commands.

### 4. In Discord
Drag the bot's role **above** your member roles (Server Settings → Roles), then run:
Everything is set from Discord. Commands marked 📝 open a pop-up form.

| Command | What it does |
|---|---|
| `/config server` 📝 | Java IP, port, version, Bedrock IP/port |
| `/config welcome channel:#welcome` 📝 | Welcome title, message, image, colour |
| `/config welcome-test` | Preview the welcome message on yourself |
| `/config rules` 📝 | Edit the rules (one per line) |
| `/config logs` / `suggestions` / `autorole` | Set channels and the join role |
| `/config view` | See every setting |
| `/ticket setup category: staffrole:` 📝 | Ticket panel text + where tickets go |
| `/ticket panel` | Post the ticket **dropdown** (run in #support) |
| `/ticket add-option` 📝 | Add a new option to the dropdown |
| `/ticket edit-option` 📝 / `remove-option` | Change or remove an option |
| `/ticket options` | List the dropdown options |

The welcome message and the ticket panel text support `{user}` `{username}` `{server}` `{count}` `{ip}` and emojis like `:hfq_diamond:`.

When a player picks a ticket type, a pop-up asks for their Minecraft name and details, then a private channel opens. The posted panel updates itself when you add, edit or remove options.

## Player stats (/stats)

`/stats` draws a pixel-art card showing hearts, playtime, balance (`$400`, `$1.5K`, `$20B`), kills, deaths, K/D and ranks.

- **Where the data comes from:** the HFQLeaderboards plugin writes `hearts.json`, `playtime.json`, `economy.json` and `events.jsonl`. Every 30s the bot downloads them over **SFTP** and saves them in `data/stats.json`.
- **Setup:** fill in `LIFESTEAL_FTP_HOST`, `LIFESTEAL_FTP_USER` and `LIFESTEAL_FTP_PASS` in `.env`. They're the same values the old HFQ bot used.
- **`/connect <name>`** links your Minecraft account. The bot sends `hfqlb link` over RCON if `LIFESTEAL_RCON_PASSWORD` is set. If not, it writes the plugin's `connections.yml` over SFTP, and the link goes live at the next restart.
- **`/stats`** shows your own card, `/stats user:@x` shows a linked member's card, and `/stats minecraft_username:Name` shows any player's.
- **Preview:** `node scripts/preview-card.js` renders a sample card to `assets/stats-preview.png`.

## Custom emojis (HFQ Emoji Pack)

The bot ships with its own Minecraft-style pixel-art emoji pack (`assets/emoji-preview.png`). Upload it to the bot with:

```bash
npm run emojis
```

They're **application emojis**, so they belong to the bot and use none of your server's emoji slots. To change art, edit `scripts/emoji-art.js` and run `npm run emojis` again.

To override one with your own art, upload a server emoji (**Server Settings → Emoji**) with the same name:

```
hfq_logo
hfq_success  hfq_error   hfq_warn     hfq_info     hfq_ban      hfq_kick
hfq_timeout  hfq_lock    hfq_unlock   hfq_trash    hfq_online   hfq_offline
hfq_players  hfq_grass   hfq_diamond  hfq_pickaxe  hfq_sword    hfq_crown
hfq_ticket   hfq_announce hfq_poll    hfq_suggest  hfq_upvote   hfq_downvote
hfq_welcome  hfq_star    hfq_settings hfq_shield
```

Run `/emojis` to see which ones the bot found.
