const { SlashCommandBuilder, ContainerBuilder, MessageFlags, TextDisplayBuilder } = require("discord.js");

const HELP_EMOJI = "<:help:976524440080883802>";

module.exports = {
  data: new SlashCommandBuilder().setName("help").setDescription("Show all bot commands and features."),
  async execute(interaction) {
    const lines = [
      `${HELP_EMOJI} **Solo Leveling Help**`,
      "",
      "**Start**",
      "`/start` - Create your hunter profile",
      "`/help` - Show this list",
      "",
      "**Main**",
      "`/profile` - Show your hunter profile",
      "`/stats` - Show detailed stats",
      "`/hunt` - Hunt for XP and gold",
      "`/inventory` - Show your inventory",
      "`/shop` - Open the shop",
      "`/cards` - Show your card collection",
      "",
      "**Advanced**",
      "`/class` - Change class (needs item)",
      "`/rankup` - Rank up if requirements are met",
      "`/battle` - PvP against another hunter",
      "`/use` - Use bought skill items",
      "`/guild_salary` - Daily salary (staff only)",
      "`/gate_risk` - Risk gate rewards (staff only)",
      "`/spwanduengeon` - Force spawn a dungeon lobby (owner/staff)",
      "`/addcurreny` - Add gold/level/stats to a user (restricted)",
    ];

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(lines.join("\n"))
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
