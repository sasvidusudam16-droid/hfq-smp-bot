#!/usr/bin/env bash
# HFQ Custom SMP bot – deploy / update script (Linux, VPS, or a panel shell)
#
#   ./deploy.sh              pull latest code, install, register commands, (re)start
#   ./deploy.sh --emojis     also re-upload the HFQ emoji pack
#   ./deploy.sh --no-start   set everything up but don't start the bot
set -euo pipefail
cd "$(dirname "$0")"

EMOJIS=false
START=true
for arg in "$@"; do
  case "$arg" in
    --emojis) EMOJIS=true ;;
    --no-start) START=false ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

step() { printf '\n\033[1;35m==> %s\033[0m\n' "$1"; }

step "Checking Node.js"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node.js 18 or newer: https://nodejs.org"
  exit 1
fi
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js $NODE_MAJOR found – version 18 or newer is required."
  exit 1
fi
echo "Node.js $(node -v)"

if [ -d .git ]; then
  step "Pulling latest code"
  git pull --ff-only || echo "git pull failed – continuing with the local code"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example."
  echo "Fill in DISCORD_TOKEN, CLIENT_ID and GUILD_ID (and the LIFESTEAL_* stats settings), then run ./deploy.sh again."
  exit 1
fi

step "Installing packages"
npm ci --omit=dev || npm install --omit=dev

step "Registering slash commands"
npm run deploy

if [ "$EMOJIS" = true ]; then
  step "Uploading the HFQ emoji pack"
  npm run emojis
fi

if [ "$START" = false ]; then
  step "Done (not started). Start with: node index.js"
  exit 0
fi

if command -v pm2 >/dev/null 2>&1; then
  step "Starting with pm2"
  pm2 restart hfq-bot 2>/dev/null || pm2 start index.js --name hfq-bot
  pm2 save
  echo "Running in the background. Logs: pm2 logs hfq-bot"
else
  step "Starting the bot (Ctrl+C to stop)"
  echo "Tip: install pm2 (npm i -g pm2) to keep it running in the background."
  exec node index.js
fi
