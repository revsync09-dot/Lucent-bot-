const LOCKED_GUILD_ID = "1425973312588091394";
const LOCKED_PORTAL_CHANNEL_ID = "1425973313288536132";

function getConfig() {
  const required = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.DISCORD_GUILD_ID && process.env.DISCORD_GUILD_ID !== LOCKED_GUILD_ID) {
    console.warn(
      `[config:warn] DISCORD_GUILD_ID (${process.env.DISCORD_GUILD_ID}) ignored. Bot is locked to ${LOCKED_GUILD_ID}.`
    );
  }

  return {
    discordToken: process.env.DISCORD_TOKEN,
    discordClientId: process.env.DISCORD_CLIENT_ID,
    discordGuildId: LOCKED_GUILD_ID,
    portalChannelId: process.env.PORTAL_CHANNEL_ID || LOCKED_PORTAL_CHANNEL_ID,
    portalSpawnMinutes: Number(process.env.PORTAL_SPAWN_MINUTES || 60),
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

module.exports = { getConfig };
