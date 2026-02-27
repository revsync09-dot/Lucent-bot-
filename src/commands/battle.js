const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const { ensureHunter } = require("../services/hunterService");
const { runPvp } = require("../services/pvpService");
const { generateBattleResultCard } = require("../services/cardGenerator");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("battle")
    .setDescription("Battle another hunter (PvP).")
    .addUserOption((option) => option.setName("opponent").setDescription("Target hunter").setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const opponent = interaction.options.getUser("opponent", true);
    if (opponent.bot || opponent.id === interaction.user.id) {
      await interaction.editReply({ content: "Choose a valid opponent." });
      return;
    }

    const attacker = await ensureHunter({ userId: interaction.user.id, guildId: interaction.guildId });
    const defender = await ensureHunter({ userId: opponent.id, guildId: interaction.guildId });
    const result = await runPvp(attacker, defender);

    const card = await generateBattleResultCard(attacker, defender, result);
    await interaction.editReply({ files: [{ attachment: card, name: "battle-result.png" }] });
  },
};
