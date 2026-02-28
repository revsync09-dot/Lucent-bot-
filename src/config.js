const required = [
  "DISCORD_TOKEN",
  "DISCORD_CLIENT_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function readConfig() {
  const DEFAULT_LOCKED_GUILD_ID = "1425973312588091394";
  const LOCKED_GUILD_ID = process.env.BOT_LOCKED_GUILD_ID || DEFAULT_LOCKED_GUILD_ID;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const placeholderValues = Object.entries(process.env)
    .filter(([key, value]) => required.includes(key) && typeof value === "string" && value.startsWith("your_"))
    .map(([key]) => key);
  if (placeholderValues.length) {
    throw new Error(`Replace placeholder values in .env for: ${placeholderValues.join(", ")}`);
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
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

module.exports = { readConfig };
