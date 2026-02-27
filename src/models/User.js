function normalizeUserRow(row) {
  return {
    userId: row.user_id,
    level: row.level,
    exp: row.exp,
    rank: row.rank,
    gold: row.gold,
    mana: row.mana,
    stats: {
      strength: row.strength,
      agility: row.agility,
      intelligence: row.intelligence,
      vitality: row.vitality,
    },
    inventory: Array.isArray(row.inventory) ? row.inventory : [],
    cooldowns: row.cooldowns || {},
  };
}

module.exports = { normalizeUserRow };
