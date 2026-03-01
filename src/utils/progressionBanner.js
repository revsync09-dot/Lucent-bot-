const {
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  TextDisplayBuilder,
} = require("discord.js");

const RANK_UP_BANNER_URL =
  "https://cdn.discordapp.com/attachments/1469861756548677853/1475648387473997834/images.png?ex=699e4027&is=699ceea7&hm=71a20c1e99cba06d93e62bd7b75558ac9ac5cd496771f29aa4810911c82f123f&";

function hasProgress(progression) {
  if (!progression) return false;
  return progression.levelsGained > 0 || progression.rankChanged;
}

async function sendProgressionBanner(interaction, progression) {
  if (!hasProgress(progression)) return;

  const lines = ["**Rank up progress achieved**"];
  if (progression.levelsGained > 0) {
    lines.push(`Level ${progression.previousLevel} -> ${progression.newLevel} (+${progression.levelsGained})`);
  }
  if (progression.rankChanged) {
    lines.push(`Rank ${progression.previousRank} -> ${progression.newRank}`);
  }
  lines.push("Keep grinding dungeons, raids, and battles.");

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(RANK_UP_BANNER_URL))
    );

  const payload = {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
      return;
    }
    await interaction.reply(payload);
  } catch (error) {
    if (error?.code === 40060 || error?.code === 10062) return;
    throw error;
  }
}

module.exports = { sendProgressionBanner };