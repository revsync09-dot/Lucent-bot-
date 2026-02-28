const { SlashCommandBuilder } = require("discord.js");
const { postManualDungeonSpawn } = require("../services/autoDungeonService");
const { sendStatus } = require("../utils/statusMessage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("spwanboss")
    .setDescription("Spawn a dungeon lobby in this channel (owner/staff)."),
  async execute(interaction) {
    if (!interaction.inGuild()) {
      await sendStatus(interaction, {
        ok: false,
        text: "This command can only be used inside a server.",
        ephemeral: true,
      });
      return;
    }

    const result = await postManualDungeonSpawn(interaction.client, {
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    });

    if (!result || !result.ok) {
      const text =
        result?.reason === "duplicate_message"
          ? "Spawn already exists in this channel."
          : result?.reason === "cooldown"
            ? "Please wait a few seconds before spawning again."
            : "Could not spawn dungeon in this channel.";
      await sendStatus(interaction, {
        ok: false,
        text,
        ephemeral: true,
      });
      return;
    }

    await sendStatus(interaction, {
      ok: true,
      text: "Dungeon spawn posted in this channel.",
      ephemeral: true,
    });
  },
};
