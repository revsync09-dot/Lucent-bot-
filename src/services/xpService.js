function xpRequired(level) {
  return Math.ceil(100 * Math.pow(level, 1.5));
}

function applyLeveling({ level, exp, statPoints }, gainedExp) {
  let newLevel = level;
  let newExp = exp + gainedExp;
  let points = statPoints;
  let levelsGained = 0;

  while (newExp >= xpRequired(newLevel) && levelsGained < 25) {
    newExp -= xpRequired(newLevel);
    newLevel += 1;
    levelsGained += 1;
    points += 3;
  }

  return { level: newLevel, exp: newExp, statPoints: points, levelsGained };
}

module.exports = { xpRequired, applyLeveling };
