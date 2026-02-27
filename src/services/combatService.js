const { randomInt, clamp } = require("../utils/math");
const { DUNGEON_DIFFICULTIES } = require("../utils/constants");

function computePower(hunter, shadows, cardBonus = 0) {
  const shadowBonus = (shadows || []).reduce((sum, s) => sum + s.base_damage + s.ability_bonus, 0);
  return hunter.strength * 2 + hunter.agility + Math.floor(hunter.intelligence / 2) + hunter.vitality + shadowBonus + cardBonus;
}

function runHunt(hunter) {
  const xp = randomInt(20, 42);
  const gold = randomInt(16, 40);
  return {
    xp,
    gold,
    message: `Hunt complete. +${xp} XP and +${gold} Gold.`,
  };
}

function runDungeonCombat(hunter, shadows, difficultyKey) {
  const difficulty = DUNGEON_DIFFICULTIES[difficultyKey];
  if (!difficulty) throw new Error("Invalid difficulty");

  const playerPower = computePower(hunter, shadows);
  const enemyPower = Math.floor((hunter.level * 5 + randomInt(10, 30)) * difficulty.multiplier);
  const winChance = clamp(55 + (playerPower - enemyPower) * 0.65, 10, 95);
  const didWin = randomInt(1, 100) <= winChance;

  return { difficulty, playerPower, enemyPower, winChance, didWin };
}

module.exports = { runHunt, runDungeonCombat, computePower };
