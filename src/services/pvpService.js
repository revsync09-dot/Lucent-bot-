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

  const hpScale = 560;
  let attackerHp = Math.max(700, Math.floor(hpScale + attacker.vitality * 46 + attacker.level * 18));
  let defenderHp = Math.max(700, Math.floor(hpScale + defender.vitality * 46 + defender.level * 18));
  const attackerMaxHp = attackerHp;
  const defenderMaxHp = defenderHp;

  const attBaseDmg = Math.max(120, Math.floor(attScore * 0.17));
  const defBaseDmg = Math.max(120, Math.floor(defScore * 0.17));

  const rounds = randomInt(3, 5);
  const combatLog = [];
  let roundCount = 0;

  for (let r = 1; r <= rounds; r += 1) {
    roundCount = r;

    const attackerDodged = randomInt(1, 100) <= clamp(8 + defender.agility * 0.18, 6, 25);
    const attackerCrit = randomInt(1, 100) <= clamp(10 + attacker.agility * 0.15, 8, 30);
    const attackerSkillBurst = randomInt(1, 100) <= clamp(7 + attacker.intelligence * 0.12, 6, 24);
    let attackerDmg = attackerDodged ? 0 : Math.floor(attBaseDmg * (randomInt(90, 115) / 100));
    if (attackerCrit && attackerDmg > 0) attackerDmg = Math.floor(attackerDmg * 1.45);
    if (attackerSkillBurst && attackerDmg > 0) attackerDmg = Math.floor(attackerDmg * 1.25);
    defenderHp = Math.max(0, defenderHp - attackerDmg);

    combatLog.push(
      `R${r} A->D: ${attackerDmg}` +
        `${attackerDodged ? " (dodged)" : ""}` +
        `${attackerCrit ? " [CRIT]" : ""}` +
        `${attackerSkillBurst ? " [SKILL]" : ""}`
    );

    if (defenderHp <= 0) break;

    const defenderDodged = randomInt(1, 100) <= clamp(8 + attacker.agility * 0.18, 6, 25);
    const defenderCrit = randomInt(1, 100) <= clamp(10 + defender.agility * 0.15, 8, 30);
    const defenderSkillBurst = randomInt(1, 100) <= clamp(7 + defender.intelligence * 0.12, 6, 24);
    let defenderDmg = defenderDodged ? 0 : Math.floor(defBaseDmg * (randomInt(90, 115) / 100));
    if (defenderCrit && defenderDmg > 0) defenderDmg = Math.floor(defenderDmg * 1.45);
    if (defenderSkillBurst && defenderDmg > 0) defenderDmg = Math.floor(defenderDmg * 1.25);
    attackerHp = Math.max(0, attackerHp - defenderDmg);

    combatLog.push(
      `R${r} D->A: ${defenderDmg}` +
        `${defenderDodged ? " (dodged)" : ""}` +
        `${defenderCrit ? " [CRIT]" : ""}` +
        `${defenderSkillBurst ? " [SKILL]" : ""}`
    );

    if (attackerHp <= 0) break;
  }

  const hpTieBreak = attackerHp === defenderHp ? randomInt(1, 100) <= winChance : attackerHp > defenderHp;
  const attackerWon = defenderHp <= 0 || (attackerHp > 0 && hpTieBreak);

  const baseWinnerXp = randomInt(110, 170);
  const baseWinnerGold = randomInt(140, 240);
  const baseLoserXp = randomInt(45, 85);
  const baseLoserGold = randomInt(35, 80);
  const streakBonus = clamp(Math.floor(Math.abs(attScore - defScore) * 0.02), 0, 45);

  const winnerXp = baseWinnerXp + streakBonus;
  const winnerGold = baseWinnerGold + streakBonus;
  const loserXp = baseLoserXp;
  const loserGold = baseLoserGold;

  let attackerProgression;
  let defenderProgression;
  let rewards;

  if (attackerWon) {
    attackerProgression = await addXpAndGold(attacker.user_id, attacker.guild_id, winnerXp, winnerGold);
    defenderProgression = await addXpAndGold(defender.user_id, defender.guild_id, loserXp, loserGold);
    rewards = {
      attacker: { xp: winnerXp, gold: winnerGold },
      defender: { xp: loserXp, gold: loserGold },
    };
  } else {
    attackerProgression = await addXpAndGold(attacker.user_id, attacker.guild_id, loserXp, loserGold);
    defenderProgression = await addXpAndGold(defender.user_id, defender.guild_id, winnerXp, winnerGold);
    rewards = {
      attacker: { xp: loserXp, gold: loserGold },
      defender: { xp: winnerXp, gold: winnerGold },
    };
  }

  return {
    attackerWon,
    winChance,
    attScore,
    defScore,
    rounds: roundCount,
    attackerHp,
    defenderHp,
    attackerMaxHp,
    defenderMaxHp,
    combatLog: combatLog.slice(0, 8),
    rewards,
    attackerProgression,
    defenderProgression,
  };
}

module.exports = { runPvp };
