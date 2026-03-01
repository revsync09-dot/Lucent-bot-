function normalizeShadowRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    rank: row.rank,
    rarity: row.rarity,
    baseDamage: row.base_damage,
    abilityBonus: row.ability_bonus,
    level: row.level,
    equipped: row.equipped,
  };
}

module.exports = { normalizeShadowRow };