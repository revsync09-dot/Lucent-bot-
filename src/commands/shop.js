const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const { ensureHunter } = require("../services/hunterService");
const { buildShopRowsForMessage, buildShopText } = require("../services/shopService");

module.exports = {
  data: new SlashCommandBuilder().setName("shop").setDescription("Open shop and buy items."),
  async execute(interaction) {
    const hunter = await ensureHunter({ userId: interaction.user.id, guildId: interaction.guildId });
    await interaction.reply({
      content: buildShopText({ hunter, page: 0 }),
      components: buildShopRowsForMessage({ userId: interaction.user.id, page: 0 }),
      flags: MessageFlags.Ephemeral,
    });
  },
};
