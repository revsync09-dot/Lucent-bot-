const {
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  TextDisplayBuilder,
} = require("discord.js");

const DUNGEON_IMAGE_A = process.env.DUNGEON_RESULT_IMAGE_A || null;
const DUNGEON_IMAGE_B = process.env.DUNGEON_RESULT_IMAGE_B || null;

const EMOJI = {
  xp: "<:xp:1475916361623408902>",
  gold: "<:gold:1475915038182346894>",
  str: "<:str:1475890708140392621>",
  agi: "<:agi:1475914899870978160>",
};

function dungeonSummaryLines(result, lootText) {
  const lines = [
    `**${result.didWin ? "Dungeon Clear" : "Dungeon Failed"}**`,
    `${EMOJI.str} Your Power: **${Number(result.playerPower || 0)}**`,
    `${EMOJI.agi} Enemy Power: **${Number(result.enemyPower || 0)}**`,
    `${EMOJI.xp} XP: **${result.didWin ? `+${result.xp || 0}` : "minor"}**`,
    `${EMOJI.gold} Gold: **${result.didWin ? `+${result.gold || 0}` : `-${result.penaltyGold || 0}`}**`,
  ];

  if (lootText) lines.push(`Loot: ${lootText}`);
  return lines;
}

function maybeGallery() {
  const urls = [DUNGEON_IMAGE_A, DUNGEON_IMAGE_B].filter(Boolean);
  if (!urls.length) return null;

  const gallery = new MediaGalleryBuilder();
  urls.slice(0, 2).forEach((url) => {
    gallery.addItems(new MediaGalleryItemBuilder().setURL(url));
  });
  return gallery;
}

function buildDungeonResultV2Payload(result, { lootText = "", ephemeral = true } = {}) {
  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(dungeonSummaryLines(result, lootText).join("\n"))
  );

  const gallery = maybeGallery();
  if (gallery) {
    container.addMediaGalleryComponents(gallery);
  }

  let flags = MessageFlags.IsComponentsV2;
  if (ephemeral) flags |= MessageFlags.Ephemeral;

  return {
    components: [container],
    flags,
  };
}

module.exports = { buildDungeonResultV2Payload };
