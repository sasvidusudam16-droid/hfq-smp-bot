// Reload custom emojis automatically when someone adds/edits/removes one.
const { Events } = require('discord.js');
const { loadEmojis } = require('../emojis');

module.exports = {
  names: [Events.GuildEmojiCreate, Events.GuildEmojiUpdate, Events.GuildEmojiDelete],
  async execute(emoji) {
    await loadEmojis(emoji.client, emoji.guild).catch(() => {});
  },
};
