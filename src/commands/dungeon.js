const { SlashCommandBuilder } = require("discord.js");
const { createLobby, joinLobby, summary } = require("../services/raidDungeonService");
const { DUNGEON_DIFFICULTIES } = require("../utils/constants");
const { buildLobbyPayload } = require("../utils/raidV2Renderer");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dungeon")
    .setDescription("Create a multiplayer raid dungeon (4-5 rounds).")
    .addStringOption((option) =>
      option
        .setName("difficulty")
        .setDescription("Raid difficulty")
        .setRequired(false)
        .addChoices(
          ...Object.entries(DUNGEON_DIFFICULTIES).map(([key, cfg]) => ({ name: cfg.label, value: key }))
        )
    ),
  async execute(interaction) {
    const difficulty = interaction.options.getString("difficulty") || "normal";
    const lobby = createLobby({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      ownerId: interaction.user.id,
      difficultyKey: difficulty,
    });
    await joinLobby(lobby.id, interaction.user.id, interaction.guildId);
    const view = summary(lobby);
    await interaction.reply(buildLobbyPayload(view));
  },
};
