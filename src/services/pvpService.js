const { randomInt, clamp } = require("../utils/math");
const { getEquippedShadows } = require("./shadowService");
const { addXpAndGold } = require("./hunterService");
const { normalizeRank } = require("../utils/constants");

function score(hunter, shadowSum) {
  const rankBonus = {
    "E-Rank": 1.0,
    "D-Rank": 1.05,
    "C-Rank": 1.12,
    "B-Rank": 1.2,
    "A-Rank": 1.32,
    "S-Rank": 1.48,
    "National Level": 1.65,
    "Monarch Level": 1.82,
    "Ruler Level": 1.95,
    "Shadow Monarch": 2.1,
  };

  const mult = rankBonus[normalizeRank(hunter.rank)] || 1;
  return Math.floor((hunter.level * 6 + hunter.strength * 2 + hunter.agility + hunter.intelligence + hunter.vitality) * mult + shadowSum);
}

async function runPvp(attacker, defender) {
  const attackerShadows = await getEquippedShadows(attacker.user_id, attacker.guild_id);
  const defenderShadows = await getEquippedShadows(defender.user_id, defender.guild_id);

  const attShadow = attackerShadows.reduce((n, s) => n + s.base_damage + s.ability_bonus, 0);
  const defShadow = defenderShadows.reduce((n, s) => n + s.base_damage + s.ability_bonus, 0);

  const attScore = score(attacker, attShadow);
  const defScore = score(defender, defShadow);

  const winChance = clamp(50 + (attScore - defScore) * 0.2, 15, 85);
  const attackerWon = randomInt(1, 100) <= winChance;

  if (attackerWon) {
    const attackerProgression = await addXpAndGold(attacker.user_id, attacker.guild_id, 80, 120);
    const defenderProgression = await addXpAndGold(defender.user_id, defender.guild_id, 20, 30);
    return { attackerWon, winChance, attScore, defScore, attackerProgression, defenderProgression };
  } else {
    const attackerProgression = await addXpAndGold(attacker.user_id, attacker.guild_id, 20, 25);
    const defenderProgression = await addXpAndGold(defender.user_id, defender.guild_id, 80, 120);
    return { attackerWon, winChance, attScore, defScore, attackerProgression, defenderProgression };
  }
}

module.exports = { runPvp };
