const { ContainerBuilder, MessageFlags, TextDisplayBuilder } = require("discord.js");

const EMOJI_ERROR = { custom: "<:x:976218154583855124>", id: "976218154583855124", fallback: "[X]" };
const EMOJI_SUCCESS = { custom: "<:check:976205564499603487>", id: "976205564499603487", fallback: "[OK]" };

function resolveEmoji(interaction, emoji) {
  const guild = interaction.guild;
  const canUseExternal = Boolean(guild && guild.members?.me?.permissions?.has("UseExternalEmojis"));
  const existsInGuild = Boolean(guild && guild.emojis?.cache?.has(emoji.id));
  return canUseExternal || existsInGuild ? emoji.custom : emoji.fallback;
}

function buildStatusComponents(interaction, { ok, text }) {
  const prefix = ok ? resolveEmoji(interaction, EMOJI_SUCCESS) : resolveEmoji(interaction, EMOJI_ERROR);
  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`${prefix} ${text}`)
  );
  return [container];
}

function buildFlags(ephemeral = true) {
  let flags = MessageFlags.IsComponentsV2;
  if (ephemeral) flags |= MessageFlags.Ephemeral;
  return flags;
}

async function sendStatus(interaction, { ok, text, ephemeral = true }) {
  const payload = {
    components: buildStatusComponents(interaction, { ok, text }),
    flags: buildFlags(ephemeral),
  };

  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(payload);
    }
    return await interaction.reply(payload);
  } catch (error) {
    const code = error && error.code;
    if (code === 40060 || code === 10062) {
      return null;
    }
    throw error;
  }
}

module.exports = {
  EMOJI_ERROR,
  EMOJI_SUCCESS,
  sendStatus,
  buildStatusComponents,
  buildFlags,
};

