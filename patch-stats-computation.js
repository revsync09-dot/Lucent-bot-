const fs = require("fs");
const path = require("path");

function patchDungeonService() {
  const p = path.join(__dirname, "src", "services", "dungeonService.js");
  let content = fs.readFileSync(p, "utf8");
  
  if (!content.includes('const { computePower } = require("./combatService");')) {
    content = content.replace(
      'const { getHunterClass } = require("./classService");',
      'const { getHunterClass } = require("./classService");\nconst { computePower } = require("./combatService");'
    );
  }

  const oldCode = `function computeCombatPower(hunter, equippedShadows) {
  const shadowBonus = equippedShadows.reduce((acc, s) => acc + s.base_damage + s.ability_bonus, 0);
  return hunter.strength * 2 + hunter.agility + Math.floor(hunter.intelligence / 2) + shadowBonus;
}`;
  content = content.replace(oldCode, ""); // Delete it
  content = content.replace(
    "const playerPower = computeCombatPower(hunter, shadows) + cardBonus.totalPower;",
    "const playerPower = computePower(hunter, shadows, cardBonus.totalPower);"
  );
  fs.writeFileSync(p, content, "utf8");
}

function patchPvpService() {
  const p = path.join(__dirname, "src", "services", "pvpService.js");
  let content = fs.readFileSync(p, "utf8");
  
  if (!content.includes('const { computePower } = require("./combatService");')) {
    content = content.replace(
      'const { normalizeRank } = require("../utils/constants");',
      'const { normalizeRank } = require("../utils/constants");\nconst { computePower } = require("./combatService");'
    );
  }

  const targetMark = "return Math.floor((hunter.level * 6 + hunter.strength * 2 + hunter.agility + hunter.intelligence + hunter.vitality) * mult + shadowSum);";
  const replacement = "return Math.floor((hunter.level * 6 + computePower(hunter, [], 0)) * mult + shadowSum);";
  content = content.replace(targetMark, replacement);
  fs.writeFileSync(p, content, "utf8");
}

function patchRaidService() {
  const p = path.join(__dirname, "src", "services", "raidDungeonService.js");
  let content = fs.readFileSync(p, "utf8");

  if (!content.includes('const { computePower } = require("./combatService");')) {
    content = content.replace(
      'const { DUNGEON_DIFFICULTIES } = require("../utils/constants");',
      'const { DUNGEON_DIFFICULTIES } = require("../utils/constants");\nconst { computePower } = require("./combatService");'
    );
  }

  const baseCalc = `const base =
    Number(h.strength || 0) * 2 +
    Number(h.agility || 0) * 1.2 +
    Number(h.intelligence || 0) * 1.15 +
    Number(h.level || 1) * 8 +
    Number(participant.cardBonus || 0) * 0.75 +
    participant.shadows.reduce((n, s) => n + Number(s.base_damage || 0) + Number(s.ability_bonus || 0), 0) * 0.28;`;
  
  const newBaseCalc = `const base = computePower(h, participant.shadows, Number(participant.cardBonus || 0)) * 0.5 + Number(h.level || 1) * 8;`;
  
  content = content.replace(baseCalc, newBaseCalc);
  fs.writeFileSync(p, content, "utf8");
}

function updateMessageCreateHelp() {
  const p = path.join(__dirname, "src", "events", "messageCreate.js");
  let content = fs.readFileSync(p, "utf8");

  const hlMark = "function helpText() {";
  const hlEndMark = "function prefixHelpV2Payload() {";

  const newHelp = `function helpText() {
  return [
    "${"\\u003C:help:976524440080883802>"} **Solo Leveling - Command List**",
    "",
    "**Core mechanics:**",
    "\`!start\` - Create profile",
    "\`!profile\` - Level, rank, gold, and loadout",
    "\`!stats [@u]\` - Detailed combat stats",
    "\`!inventory\` - Show your items",
    "\`!hunt\` - Earn XP & Gold (5m CD)",
    "\`!battle [@u]\` - Attack another player (5m CD)",
    "",
    "**Growth & Special:**",
    "\`!rankup\` - Take the exam for the next rank",
    "\`!cards\` - View your Hunter card deck",
    "\`!shop\` - Buy skill scrolls, mana & more",
    "\`!use [skill]\` - Consume scroll to arm a skill for the next boss raid",
    "\`!class [name]\` - Needs *Reawakened Stone*. Changes class and shifts your stats!",
  ].join("\\n");
}
`;
  content = content.replace(content.substring(content.indexOf(hlMark), content.indexOf(hlEndMark)), newHelp);
  fs.writeFileSync(p, content, "utf8");
}

patchDungeonService();
patchPvpService();
patchRaidService();
updateMessageCreateHelp();
console.log("Central combat power & help text patched!");