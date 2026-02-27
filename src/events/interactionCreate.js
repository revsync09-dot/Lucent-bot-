const { Events, ComponentType } = require("discord.js");
const { handleComponent } = require("../handlers/components");
const { sendStatus } = require("../utils/statusMessage");
const { getConfig } = require("../config/config");

const executingCommands = new Set();
const config = getConfig();
const PRIVILEGED_USER_ID = "795466540140986368";
const PRIVILEGED_ROLE_ID = "1458655699310739625";
const RESTRICTED_SLASH_COMMANDS = new Set(["guild_salary", "gate_risk"]);

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (interaction.inGuild() && config.discordGuildId && interaction.guildId !== config.discordGuildId) {
        if (interaction.isRepliable()) {
          await sendStatus(interaction, {
            ok: false,
            text: "This bot is locked to a specific server.",
            ephemeral: true,
          });
        }
        return;
      }

      if (interaction.isChatInputCommand()) {
        if (!interaction.inGuild()) {
          await sendStatus(interaction, {
            ok: false,
            text: "This command can only be used inside a server.",
            ephemeral: true,
          });
          return;
        }

        if (RESTRICTED_SLASH_COMMANDS.has(interaction.commandName)) {
          const isGuildOwner = interaction.guild && interaction.guild.ownerId === interaction.user.id;
          const isPrivileged = interaction.user.id === PRIVILEGED_USER_ID;
          const hasPrivilegedRole = Boolean(interaction.member && interaction.member.roles && interaction.member.roles.cache && interaction.member.roles.cache.has(PRIVILEGED_ROLE_ID));
          if (!isGuildOwner && !isPrivileged && !hasPrivilegedRole) {
            await sendStatus(interaction, {
              ok: false,
              text: "This command is restricted to owner, bot admin, or approved role.",
              ephemeral: true,
            });
            return;
          }
        }

        
        const commandKey = `${interaction.user.id}:${interaction.commandName}:${interaction.id}`;
        if (executingCommands.has(commandKey)) {
          console.log(`[warn] Duplicate command execution prevented: ${commandKey}`);
          return;
        }

        executingCommands.add(commandKey);
        setTimeout(() => executingCommands.delete(commandKey), 5000); 

        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        await command.execute(interaction);
        return;
      }

      if (
        interaction.isMessageComponent() &&
        [ComponentType.Button, ComponentType.StringSelect].includes(interaction.componentType)
      ) {
        await handleComponent(interaction);
      }
    } catch (error) {
      console.error(error);
      try {
        await sendStatus(interaction, {
          ok: false,
          text: "An unexpected error occurred. Please try again.",
          ephemeral: false,
        });
      } catch (statusError) {
        console.error("[interaction:error:status]", statusError);
      }
    }
  },
};
