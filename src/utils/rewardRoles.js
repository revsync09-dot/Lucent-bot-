const MONARCH_ROLE_ID = "1477010786735095888";

async function tryGrantMonarchRole(guild, userId) {
  if (!guild || !userId) return { granted: false, reason: "invalid_input" };
  const role = guild.roles.cache.get(MONARCH_ROLE_ID) || (await guild.roles.fetch(MONARCH_ROLE_ID).catch(() => null));
  if (!role) return { granted: false, reason: "role_not_found" };

  const member = guild.members.cache.get(userId) || (await guild.members.fetch(userId).catch(() => null));
  if (!member) return { granted: false, reason: "member_not_found" };
  if (member.roles.cache.has(MONARCH_ROLE_ID)) return { granted: false, reason: "already_has_role" };

  try {
    await member.roles.add(MONARCH_ROLE_ID, "Solo Leveling dungeon reward roll");
    return { granted: true, reason: "granted" };
  } catch {
    return { granted: false, reason: "missing_permissions" };
  }
}

module.exports = {
  MONARCH_ROLE_ID,
  tryGrantMonarchRole,
};

