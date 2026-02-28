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

    const posted = await postManualDungeonSpawn(interaction.client, {
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    });

    if (!posted) {
      await sendStatus(interaction, {
        ok: false,
        text: "A dungeon was just spawned. Wait a few seconds and try again.",
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
