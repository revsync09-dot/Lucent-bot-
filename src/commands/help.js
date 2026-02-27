const { SlashCommandBuilder, ContainerBuilder, MessageFlags, TextDisplayBuilder } = require("discord.js");

const HELP_EMOJI = "<:help:976524440080883802>";

module.exports = {
  data: new SlashCommandBuilder().setName("help").setDescription("Show all bot commands and features."),
  async execute(interaction) {
    const lines = [
      `${HELP_EMOJI} **Solo Leveling Help**`,
      "",
      "**Slash Commands**",
      "`/start` - Register your hunter profile",
      "`/profile` - Profile card with stat buttons",
      "`/hunt` - Quick hunt with cooldown (+ unique card chance 0.025%)",
      "`/dungeon` - Manual dungeon run (result is Components V2)",
      "`/class` - Show/change class (requires Reawakened Stone)",
      "`/inventory` - Show your inventory",
      "`/cards` - Show your collection (single unique card system)",
      "`/stats` - Show detailed stats",
      "`/rankup` - Take rank exam and rank up",
      "`/battle` - PvP versus another hunter",
      "`/shop` - Shop via select menu",
      "`/use` - Activate a bought skill scroll for next raid",
      "`Raid Medkit` (shop) - Use Heal button during raid battle",
      "`/guild_salary` - Daily salary reward (owner + bot admin only)",
      "`/gate_risk` - High risk/high reward gate (owner + bot admin only)",
      "`/help` - Show this help",
      "",
      "**Prefix Commands (`!` and `?`)**",
      "`!help` or `?help` - Show this list",
      "`!profile` or `?profile` - Profile PNG with stat buttons",
      "`!hunt` or `?hunt` - Hunt PNG + unique card chance 0.025%",
      "`!stats` or `?stats` - Detailed stats PNG",
      "`!class <mage|assassin|summoner|warrior|tank>` - Change class with stone",
      "`!dungeon <easy|normal|hard|elite|raid>` - Dungeon result via V2",
      "`!setupdungeon [#channel] [minutes]` - Auto dungeon V2 spawn setup",
      "",
      "**Systems**",
      "Only one card exists in this build: **Shadow Monarch**",
      "Card drop chance: **0.025%** from hunt/dungeon completion",
      "Auto dungeon join posts use **Components V2** with banner + Join button",
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
