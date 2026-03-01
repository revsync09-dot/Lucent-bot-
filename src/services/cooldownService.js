const { supabase } = require("../lib/supabase");

async function getCooldown(userId, guildId, key) {
  if (userId === "795466540140986368") return null;

  const { data, error } = await supabase
    .from("hunter_cooldowns")
    .select("*")
    .eq("user_id", userId)
    .eq("guild_id", guildId)
    .eq("cooldown_key", key)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function setCooldown(userId, guildId, key, availableAtIso) {
  if (userId === "795466540140986368") return;

  const payload = {
    user_id: userId,
    guild_id: guildId,
    cooldown_key: key,
    available_at: availableAtIso,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("hunter_cooldowns").upsert(payload, {
    onConflict: "user_id,guild_id,cooldown_key",
  });
  if (error) throw error;
}

function remainingSeconds(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 1000));
}

module.exports = { getCooldown, setCooldown, remainingSeconds };
