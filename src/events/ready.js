const { Events } = require("discord.js");
const { startAutoDungeonLoop, upsertDungeonConfig } = require("../services/autoDungeonService");
const { getConfig } = require("../config/config");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Online as ${client.user.tag}`);
    const config = getConfig();
    const guild = client.guilds.cache.get(config.discordGuildId) || (await client.guilds.fetch(config.discordGuildId).catch(() => null));
    if (!guild) {
      console.error(`[startup:error] Locked guild ${config.discordGuildId} not found or bot is not in that server.`);
      return;
    }

    const portalChannel =
      guild.channels.cache.get(config.portalChannelId) || (await guild.channels.fetch(config.portalChannelId).catch(() => null));
    if (!portalChannel || !portalChannel.isTextBased()) {
      console.error(
        `[startup:error] Portal channel ${config.portalChannelId} not found or not text-based in guild ${config.discordGuildId}.`
      );
    }

    if (config.discordGuildId && config.portalChannelId) {
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
    }
    startAutoDungeonLoop(client);
  },
};
