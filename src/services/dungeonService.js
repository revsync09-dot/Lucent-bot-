const { DUNGEON_DIFFICULTIES } = require("../utils/constants");
const { randomInt, clamp } = require("../utils/math");
const { addXpAndGold } = require("./hunterService");
const { addRandomShadow, getEquippedShadows } = require("./shadowService");
const { getBattleBonus } = require("./cardsService");
const { updateUser } = require("./database");
const { getHunterClass } = require("./classService");
const { computePower } = require("./combatService");
const { CLASS_WEAPON_DROPS, STATUS_EFFECTS, COMPANION_DROPS } = require("../utils/constants");

function computeCombatPower(hunter, equippedShadows) {
  const shadowBonus = equippedShadows.reduce((acc, s) => acc + s.base_damage + s.ability_bonus, 0);
  return hunter.strength * 2 + hunter.agility + Math.floor(hunter.intelligence / 2) + shadowBonus;
}

async function runDungeon(hunter, difficultyKey) {
  const config = DUNGEON_DIFFICULTIES[difficultyKey];
  if (!config) throw new Error("Invalid dungeon difficulty");

  const shadows = await getEquippedShadows(hunter.user_id, hunter.guild_id);
  const cardBonus = await getBattleBonus(hunter);
  const playerPower = computePower(hunter, shadows, cardBonus.totalPower);
  const enemyPower = Math.floor((hunter.level * 5 + randomInt(10, 30)) * config.multiplier);
  const winChance = clamp(55 + (playerPower - enemyPower) * 0.65, 10, 95);
  const didWin = randomInt(1, 100) <= winChance;

  let xp = 0;
  let gold = 0;
  let arisenShadow = null;
  let penaltyGold = 0;
  let progression = null;
  const className = getHunterClass(hunter);
  const statusEffects = [];
  let weaponDrop = null;
  let companionDrop = null;
  let monarchRoleRollWon = false;
  const baseInventory = Array.isArray(hunter.inventory) ? [...hunter.inventory] : [];

  if (didWin) {
    xp = randomInt(config.xp[0], config.xp[1]);
    gold = randomInt(config.gold[0], config.gold[1]);
    const ariseRoll = Math.random();
    if (ariseRoll <= config.arise) {
      arisenShadow = await addRandomShadow(hunter.user_id, hunter.guild_id, hunter.rank);
    }
    progression = await addXpAndGold(hunter.user_id, hunter.guild_id, xp, gold);

    const weaponPool = CLASS_WEAPON_DROPS[className] || CLASS_WEAPON_DROPS.warrior;
    const weaponChance = difficultyKey === "easy" ? 0.12 : difficultyKey === "normal" ? 0.16 : difficultyKey === "hard" ? 0.22 : difficultyKey === "elite" ? 0.3 : 0.36;
    if (Math.random() <= weaponChance) {
      weaponDrop = weaponPool[randomInt(0, weaponPool.length - 1)];
      baseInventory.push(weaponDrop);
    }

    const isHighTierPortal = ["elite", "raid"].includes(difficultyKey);
    if (isHighTierPortal && Math.random() <= 0.08) {
      companionDrop = COMPANION_DROPS[randomInt(0, COMPANION_DROPS.length - 1)];
      baseInventory.push(`Companion: ${companionDrop}`);
    }

    if (baseInventory.length !== (Array.isArray(hunter.inventory) ? hunter.inventory.length : 0)) {
      progression.hunter = await updateUser(hunter.user_id, hunter.guild_id, { inventory: baseInventory });
    }
    monarchRoleRollWon = Math.random() <= 0.03;
  } else {
    penaltyGold = randomInt(10, 40);
    progression = await addXpAndGold(hunter.user_id, hunter.guild_id, Math.floor(config.xp[0] * 0.2), -penaltyGold);
    if (Math.random() <= 0.45) {
      statusEffects.push(STATUS_EFFECTS[randomInt(0, STATUS_EFFECTS.length - 1)]);
    }
  }

  return {
    didWin,
    xp,
    gold,
    penaltyGold,
    enemyPower,
    playerPower,
    winChance,
    difficulty: config.label,
    arisenShadow,
    className,
    weaponDrop,
    companionDrop,
    monarchRoleRollWon,
    statusEffects,
    cardBonus,
    progression,
  };
}

module.exports = { runDungeon };