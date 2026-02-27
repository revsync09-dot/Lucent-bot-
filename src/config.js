const required = [
  "DISCORD_TOKEN",
  "DISCORD_CLIENT_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function readConfig() {
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

  return {
    discordToken: process.env.DISCORD_TOKEN,
    discordClientId: process.env.DISCORD_CLIENT_ID,
    discordGuildId: process.env.DISCORD_GUILD_ID || null,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

module.exports = { readConfig };
