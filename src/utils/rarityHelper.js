function rarityWeightRoll() {
  const roll = Math.random() * 100;
  if (roll < 50) return "Common";
  if (roll < 75) return "Rare";
  if (roll < 90) return "Epic";
  if (roll < 98) return "Legendary";
  return "Mythic";
}

module.exports = { rarityWeightRoll };