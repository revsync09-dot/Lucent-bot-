const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const { ensureHunter } = require("../services/hunterService");
const { runPvp } = require("../services/pvpService");
const { sendProgressionBanner } = require("../utils/progressionBanner");
const { generateBattleResultCard } = require("../services/cardGenerator");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pvp")
    .setDescription("Challenge another Hunter.")
    .addUserOption((option) => option.setName("opponent").setDescription("Hunter to challenge").setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const opponentUser = interaction.options.getUser("opponent", true);

    if (opponentUser.bot || opponentUser.id === interaction.user.id) {
      await interaction.editReply({ content: "Choose a valid human opponent." });
      return;
    }

    const attacker = await ensureHunter({ userId: interaction.user.id, guildId: interaction.guildId });
    const defender = await ensureHunter({ userId: opponentUser.id, guildId: interaction.guildId });
    const result = await runPvp(attacker, defender);

    const card = await generateBattleResultCard(
      { username: interaction.user.username },
      { username: opponentUser.username },
      result
    );
    await interaction.editReply({ files: [{ attachment: card, name: "pvp-result.png" }] });
    await sendProgressionBanner(interaction, result.attackerProgression);
  },
};
