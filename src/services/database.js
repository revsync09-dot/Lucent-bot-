const { supabase } = require("../lib/supabase");

async function findUser(userId, guildId) {
  const { data, error } = await supabase
    .from("hunters")
    .select("*")
    .eq("user_id", userId)
    .eq("guild_id", guildId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateUser(userId, guildId, patch) {
  let updatePatch = { ...patch, updated_at: new Date().toISOString() };

  for (let i = 0; i < 6; i += 1) {
    const { data, error } = await supabase
      .from("hunters")
      .update(updatePatch)
      .eq("user_id", userId)
      .eq("guild_id", guildId)
      .select("*")
      .single();

    if (!error) return data;

    const isMissingColumn = error.code === "PGRST204" && typeof error.message === "string";
    if (!isMissingColumn) throw error;

    const match = error.message.match(/'([^']+)' column/);
    const missingColumn = match && match[1];
    if (!missingColumn || !(missingColumn in updatePatch)) throw error;
    delete updatePatch[missingColumn];
  }

  throw new Error("Failed to update user due to unresolved schema mismatch.");
}

async function saveInventory(userId, guildId, inventory) {
  return updateUser(userId, guildId, { inventory });
}

module.exports = { findUser, updateUser, saveInventory };
