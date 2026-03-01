const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const { ensureHunter, addXpAndGold } = require("../services/hunterService");
const { getCooldown, setCooldown } = require("../services/cooldownService");
const { cooldownRemaining, nextCooldown } = require("../utils/cooldownHelper");
const { randomInt } = require("../utils/math");
const { generateGateCard } = require("../services/cardGenerator");

module.exports = {
  data: new SlashCommandBuilder().setName("gate_risk").setDescription("High-risk gate: high reward or heavy penalty."),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const hunter = await ensureHunter({ userId: interaction.user.id, guildId: interaction.guildId });
    const cd = await getCooldown(interaction.user.id, interaction.guildId, "gate_risk");
    if (cd && new Date(cd.available_at).getTime() > Date.now()) {
      await interaction.editReply({ content: `Gate risk cooldown active: ${cooldownRemaining(cd.available_at)}s` });
      return;
    }

    const difficulty = "EXTREME";
    const successChance = Math.min(80, 35 + hunter.level * 0.6 + hunter.agility * 0.5);
    const roll = randomInt(1, 100);
    const didWin = roll <= successChance;

    let rewards = {};
    if (didWin) {
      const gold = randomInt(280, 520);
      const xp = randomInt(120, 240);
      rewards = { gold, xp };
      await addXpAndGold(interaction.user.id, interaction.guildId, xp, gold);
    } else {
      const penalty = randomInt(80, 180);
      rewards = { penalty };
      await addXpAndGold(interaction.user.id, interaction.guildId, 30, -penalty);
    }

    const card = await generateGateCard(interaction.user, difficulty, rewards, didWin);
    await setCooldown(interaction.user.id, interaction.guildId, "gate_risk", nextCooldown(600));
    await interaction.editReply({ files: [{ attachment: card, name: "gate-card.png" }] });
  },
};