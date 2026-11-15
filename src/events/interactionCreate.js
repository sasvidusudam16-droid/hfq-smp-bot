const { Events, PermissionsBitField } = require('discord.js');
const { fail } = require('../utils/embed');

/**
 * Buttons, dropdowns and pop-up forms use customId "name" or "name:arg".
 * Commands export:
 *   handlers       – admin forms, re-checked against the command's permission
 *   publicHandlers – anyone can use (e.g. the ticket dropdown)
 */
let routes;
function buildRoutes(client) {
  routes = new Map();
  for (const command of client.commands.values()) {
    const perms = command.data.default_member_permissions;
    for (const [id, fn] of Object.entries(command.handlers ?? {})) routes.set(id, { fn, perms });
    for (const [id, fn] of Object.entries(command.publicHandlers ?? {})) routes.set(id, { fn, perms: null });
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!routes) buildRoutes(client);
    try {
      if (!interaction.inGuild()) {
        if (interaction.isRepliable()) await interaction.reply({ content: 'Use my commands inside the server.' });
        return;
      }

      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        return command?.autocomplete?.(interaction);
      }

      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
        return;
      }

      if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        const [name, arg] = interaction.customId.split(':');
        const route = routes.get(name);
        if (!route) return fail(interaction, 'This menu is outdated. Ask an admin to post it again.');
        if (route.perms && !interaction.memberPermissions.has(new PermissionsBitField(BigInt(route.perms)))) {
          return fail(interaction, 'You do not have permission to do that.');
        }
        return route.fn(interaction, arg);
      }
    } catch (err) {
      console.error(`Error in ${interaction.commandName ?? interaction.customId}:`, err);
      if (interaction.isRepliable()) {
        await fail(interaction, 'Something went wrong. Check my permissions and try again.').catch(() => {});
      }
    }
  },
};
