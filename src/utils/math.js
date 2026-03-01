function xpRequired(level) {
  return Math.ceil(100 * Math.pow(level, 1.5));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

module.exports = { xpRequired, randomInt, clamp };