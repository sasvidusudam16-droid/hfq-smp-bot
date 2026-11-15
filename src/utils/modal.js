// Small helper to build pop-up forms (modals).
const { ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

/**
 * fields: [{ id, label, description?, long?, value?, placeholder?, required?, max? }]
 */
function buildModal(customId, title, fields) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title.slice(0, 45));
  for (const f of fields) {
    const input = new TextInputBuilder()
      .setCustomId(f.id)
      .setStyle(f.long ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(f.required ?? false)
      .setMaxLength(f.max ?? (f.long ? 4000 : 200));
    if (f.value) input.setValue(String(f.value).slice(0, f.max ?? 4000));
    if (f.placeholder) input.setPlaceholder(f.placeholder.slice(0, 100));

    const label = new LabelBuilder().setLabel(f.label.slice(0, 45)).setTextInputComponent(input);
    if (f.description) label.setDescription(f.description.slice(0, 100));
    modal.addLabelComponents(label);
  }
  return modal;
}

/** Read a field, returns '' when empty. */
const field = (interaction, id) => interaction.fields.getTextInputValue(id)?.trim() ?? '';

module.exports = { buildModal, field };
