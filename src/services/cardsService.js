const fs = require("fs");
const path = require("path");
const { updateUser } = require("./database");

const CARD_DROP_CHANCE = 0.00025; 
const SINGLE_CARD_MARKER = "card:shadow_monarch_unique";
const SINGLE_CARD_ASSET = "single_card";
const SINGLE_CARD_IMAGE_PATH = path.join(process.cwd(), "assets", "cards", "single_card.png");

const SINGLE_CARD = {
  name: "Shadow Monarch",
  rank: "NATIONAL",
  role: "Monarch",
  atk: 999,
  hp: 999,
  def: 999,
  skill: "Domain of Shadows",
  asset: SINGLE_CARD_ASSET,
};

function getInventory(hunter) {
  return Array.isArray(hunter?.inventory) ? [...hunter.inventory] : [];
}

function hasSingleCard(hunter) {
  return getInventory(hunter).includes(SINGLE_CARD_MARKER);
}

function getSingleCardImagePath() {
  return fs.existsSync(SINGLE_CARD_IMAGE_PATH) ? SINGLE_CARD_IMAGE_PATH : null;
}

async function getAllCards() {
  return [SINGLE_CARD];
}

async function getOwnedCards(hunter) {
  if (!hunter || !hasSingleCard(hunter)) return [];
  return [SINGLE_CARD];
}

async function getBattleBonus(hunter) {
  const owned = await getOwnedCards(hunter);
  const card = owned[0];
  if (!card) {
    return {
      cards: [],
      attack: 0,
      defense: 0,
      vitality: 0,
      totalPower: 0,
    };
  }

  const attack = Math.floor(card.atk * 0.08);
  const defense = Math.floor(card.def * 0.07);
  const vitality = Math.floor(card.hp * 0.06);

  return {
    cards: [card],
    attack,
    defense,
    vitality,
    totalPower: attack + defense + vitality,
  };
}

async function tryGrantSingleCard(hunter) {
  if (!hunter || hasSingleCard(hunter)) {
    return { granted: false, hunter, card: null };
  }

  if (Math.random() >= CARD_DROP_CHANCE) {
    return { granted: false, hunter, card: null };
  }

  const inventory = getInventory(hunter);
  inventory.push(SINGLE_CARD_MARKER);
  const updated = await updateUser(hunter.user_id, hunter.guild_id, { inventory });

  return {
    granted: true,
    hunter: updated,
    card: SINGLE_CARD,
    imagePath: getSingleCardImagePath(),
    chance: CARD_DROP_CHANCE,
  };
}

module.exports = {
  CARD_DROP_CHANCE,
  SINGLE_CARD,
  SINGLE_CARD_MARKER,
  getAllCards,
  getOwnedCards,
  getBattleBonus,
  hasSingleCard,
  getSingleCardImagePath,
  tryGrantSingleCard,
};
