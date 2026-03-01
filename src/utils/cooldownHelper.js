function cooldownRemaining(availableAtIso) {
  if (!availableAtIso) return 0;
  const ms = new Date(availableAtIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

function nextCooldown(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

module.exports = { cooldownRemaining, nextCooldown };