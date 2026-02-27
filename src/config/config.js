function getConfig() {
  const required = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    discordToken: process.env.DISCORD_TOKEN,
    discordClientId: process.env.DISCORD_CLIENT_ID,
    discordGuildId: process.env.DISCORD_GUILD_ID || null,
    portalChannelId: process.env.PORTAL_CHANNEL_ID || null,
    portalSpawnMinutes: Number(process.env.PORTAL_SPAWN_MINUTES || 60),
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

module.exports = { getConfig };
