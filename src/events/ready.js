const { Events } = require("discord.js");
const { startAutoDungeonLoop, upsertDungeonConfig, getDungeonConfig } = require("../services/autoDungeonService");
const { getConfig } = require("../config/config");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Online as ${client.user.tag}`);
    const config = getConfig();
    if (config.discordGuildId) {
      const existing = await getDungeonConfig(config.discordGuildId).catch(() => null);
      if (existing?.dungeon_enabled && existing?.dungeon_channel_id) {
        console.log(
          `[auto-dungeon] Using saved config for guild ${config.discordGuildId} in channel ${existing.dungeon_channel_id} every ${existing.dungeon_interval_minutes} minute(s).`
        );
      } else if (config.portalChannelId) {
      const guild =
        client.guilds.cache.get(config.discordGuildId) || (await client.guilds.fetch(config.discordGuildId).catch(() => null));
      if (!guild) {
        console.error(`[startup:error] Guild ${config.discordGuildId} not found or bot is not in that server.`);
        startAutoDungeonLoop(client);
        return;
      }

      const portalChannel =
        guild.channels.cache.get(config.portalChannelId) || (await guild.channels.fetch(config.portalChannelId).catch(() => null));
      const isTextChannel =
        Boolean(portalChannel) &&
        typeof portalChannel.isTextBased === "function" &&
        portalChannel.isTextBased();
      if (!isTextChannel) {
        console.error(
          `[startup:error] Portal channel ${config.portalChannelId} not found or not text-based in guild ${config.discordGuildId}.`
        );
      }

      try {
        await upsertDungeonConfig({
          guildId: config.discordGuildId,
          channelId: config.portalChannelId,
          intervalMinutes: config.portalSpawnMinutes,
          enabled: true,
        });
        console.log(
          `[auto-dungeon] Enabled for guild ${config.discordGuildId} in channel ${config.portalChannelId} every ${config.portalSpawnMinutes} minute(s).`
        );
      } catch (error) {
        console.error("[auto-dungeon:bootstrap]", error);
      }
      } else {
        console.log("[auto-dungeon] No saved config and no PORTAL_CHANNEL_ID set. Auto spawn is idle.");
      }
    }
    startAutoDungeonLoop(client);
  },
};
