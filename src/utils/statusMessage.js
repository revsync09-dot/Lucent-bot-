const { ContainerBuilder, MessageFlags, TextDisplayBuilder } = require("discord.js");

const EMOJI_ERROR = { custom: "<a:error:1428973588119289889>", id: "1428973588119289889", fallback: "[X]" };
const EMOJI_SUCCESS = { custom: "<a:ok:1271110981338267708>", id: "1271110981338267708", fallback: "[OK]" };

function resolveEmoji(ctx, emoji) {
  const guild = ctx?.guild || null;
  const me = guild?.members?.me || null;
  const canUseExternal = Boolean(me?.permissions?.has("UseExternalEmojis"));
  const existsInGuild = Boolean(guild && guild.emojis?.cache?.has(emoji.id));
  return canUseExternal || existsInGuild ? emoji.custom : emoji.fallback;
}

function buildStatusComponents(ctx, { ok, text }) {
  const prefix = ok ? resolveEmoji(ctx, EMOJI_SUCCESS) : resolveEmoji(ctx, EMOJI_ERROR);
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

function buildStatusPayload(ctx, { ok, text, ephemeral = true }) {
  return {
    components: buildStatusComponents(ctx, { ok, text }),
    flags: buildFlags(ephemeral),
  };
}

async function sendStatus(interaction, { ok, text, ephemeral = true }) {
  const payload = buildStatusPayload(interaction, { ok, text, ephemeral });

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
  buildStatusPayload,
  buildStatusComponents,
  buildFlags,
};