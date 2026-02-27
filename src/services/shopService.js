const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} = require("discord.js");

const SHOP_ITEMS = [
  {
    key: "potion",
    name: "Mana Potion",
    description: "+100 mana instantly",
    price: 120,
    emoji: { id: "1475915084911087708" },
    apply: (hunter) => ({ mana: Math.min(9999, Number(hunter.mana || 0) + 100) }),
  },
  {
    key: "hunter_key",
    name: "Hunter Key",
    description: "Used for advanced gate access",
    price: 180,
    emoji: { id: "1475924101179899994" },
    apply: () => ({}),
  },
  {
    key: "stat_reset",
    name: "Stat Reset Token",
    description: "Respec all allocated stats",
    price: 500,
    emoji: { id: "1475924134650445884" },
    apply: (hunter) => ({
      strength: 5,
      agility: 5,
      intelligence: 5,
      vitality: 5,
      stat_points:
        Number(hunter.stat_points || 0) +
        Math.max(0, Number(hunter.strength || 5) - 5) +
        Math.max(0, Number(hunter.agility || 5) - 5) +
        Math.max(0, Number(hunter.intelligence || 5) - 5) +
        Math.max(0, Number(hunter.vitality || 5) - 5),
    }),
  },
  {
    key: "shadow_essence",
    name: "Shadow Essence",
    description: "Material for shadow enhancement",
    price: 260,
    inventoryToken: "material:shadow_essence",
    apply: () => ({}),
  },
  {
    key: "gate_crystal",
    name: "Gate Crystal",
    description: "Improves gate reward quality",
    price: 320,
    inventoryToken: "material:gate_crystal",
    apply: () => ({}),
  },
  {
    key: "rune_fragment",
    name: "Rune Fragment",
    description: "Rare fragment from dungeon relics",
    price: 380,
    inventoryToken: "material:rune_fragment",
    apply: () => ({}),
  },
  {
    key: "jeju_ant_core",
    name: "Jeju Ant Core",
    description: "High-tier raid crafting core",
    price: 560,
    inventoryToken: "material:jeju_ant_core",
    apply: () => ({}),
  },
  {
    key: "reawakened_stone",
    name: "Reawakened Stone",
    description: "Use with /class to change your hunter class",
    price: 700,
    inventoryToken: "item:reawakened_stone",
    apply: () => ({}),
  },
  {
    key: "monarch_sigil",
    name: "Monarch Sigil",
    description: "Legendary emblem with immense aura",
    price: 900,
    inventoryToken: "item:monarch_sigil",
    apply: () => ({}),
  },
  {
    key: "flame_slash_scroll",
    name: "Flame Slash Scroll",
    description: "Use /use flame_slash to activate for next raid",
    price: 420,
    inventoryToken: "skill_scroll:flame_slash",
    apply: () => ({}),
  },
  {
    key: "shadow_step_scroll",
    name: "Shadow Step Scroll",
    description: "Use /use shadow_step to activate for next raid",
    price: 480,
    inventoryToken: "skill_scroll:shadow_step",
    apply: () => ({}),
  },
  {
    key: "monarch_roar_scroll",
    name: "Monarch Roar Scroll",
    description: "Use /use monarch_roar to activate for next raid",
    price: 700,
    inventoryToken: "skill_scroll:monarch_roar",
    apply: () => ({}),
  },
  {
    key: "raid_medkit",
    name: "Raid Medkit",
    description: "Used in raid battle to heal yourself",
    price: 300,
    inventoryToken: "raid_heal_kit",
    apply: () => ({}),
  },
];

const PAGE_SIZE = 4;

function getItem(key) {
  return SHOP_ITEMS.find((item) => item.key === key) || null;
}

function clampPage(page) {
  const maxPage = Math.max(0, Math.ceil(SHOP_ITEMS.length / PAGE_SIZE) - 1);
  const n = Number(page);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(maxPage, Math.floor(n)));
}

function getPageItems(page) {
  const p = clampPage(page);
  const start = p * PAGE_SIZE;
  return SHOP_ITEMS.slice(start, start + PAGE_SIZE);
}

function pickSelected(pageItems, selectedKey) {
  if (!pageItems.length) return null;
  const selected = pageItems.find((x) => x.key === selectedKey);
  return selected || pageItems[0];
}

function buildShopPayload({ userId, hunter, page = 0, selectedKey = null, notice = "" }) {
  const p = clampPage(page);
  const pageItems = getPageItems(p);
  const selected = pickSelected(pageItems, selectedKey);
  const maxPage = Math.max(0, Math.ceil(SHOP_ITEMS.length / PAGE_SIZE) - 1);

  const select = new StringSelectMenuBuilder()
    .setCustomId(`shop_select:${userId}:${p}`)
    .setPlaceholder("Choose an item")
    .addOptions(
      pageItems.map((item) => ({
        label: item.name,
        value: item.key,
        description: `Cost: ${item.price} gold`,
        emoji: item.emoji,
        default: selected && selected.key === item.key,
      }))
    );

  const rowSelect = new ActionRowBuilder().addComponents(select);
  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_prev:${userId}:${p}:${selected ? selected.key : "none"}`)
      .setLabel("Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p <= 0),
    new ButtonBuilder()
      .setCustomId(`shop_next:${userId}:${p}:${selected ? selected.key : "none"}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p >= maxPage),
    new ButtonBuilder()
      .setCustomId(`shop_buy:${userId}:${p}:${selected ? selected.key : "none"}`)
      .setLabel("Buy")
      .setStyle(ButtonStyle.Success)
      .setDisabled(!selected)
  );

  const lines = [
    `**Solo Leveling Shop**`,
    `Gold: ${Number(hunter.gold || 0)} | Page ${p + 1}/${maxPage + 1}`,
    "",
  ];

  if (selected) {
    lines.push(`Selected: **${selected.name}**`);
    lines.push(`Cost: **${selected.price} gold**`);
    lines.push(`Effect: ${selected.description}`);
  } else {
    lines.push("No item on this page.");
  }

  if (notice) {
    lines.push("");
    lines.push(notice);
  }

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")))
    .addActionRowComponents(rowSelect)
    .addActionRowComponents(rowButtons);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };
}

function buildShopRowsForMessage({ userId, page = 0, selectedKey = null }) {
  const p = clampPage(page);
  const pageItems = getPageItems(p);
  const selected = pickSelected(pageItems, selectedKey);
  const maxPage = Math.max(0, Math.ceil(SHOP_ITEMS.length / PAGE_SIZE) - 1);

  const select = new StringSelectMenuBuilder()
    .setCustomId(`shop_select:${userId}:${p}`)
    .setPlaceholder("Choose an item")
    .addOptions(
      pageItems.map((item) => ({
        label: item.name,
        value: item.key,
        description: `Cost: ${item.price} gold`,
        emoji: item.emoji,
        default: selected && selected.key === item.key,
      }))
    );

  const rowSelect = new ActionRowBuilder().addComponents(select);
  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_prev:${userId}:${p}:${selected ? selected.key : "none"}`)
      .setLabel("Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p <= 0),
    new ButtonBuilder()
      .setCustomId(`shop_next:${userId}:${p}:${selected ? selected.key : "none"}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p >= maxPage),
    new ButtonBuilder()
      .setCustomId(`shop_buy:${userId}:${p}:${selected ? selected.key : "none"}`)
      .setLabel("Buy")
      .setStyle(ButtonStyle.Success)
      .setDisabled(!selected)
  );

  return [rowSelect, rowButtons];
}

function buildShopText({ hunter, page = 0, selectedKey = null, notice = "" }) {
  const p = clampPage(page);
  const pageItems = getPageItems(p);
  const selected = pickSelected(pageItems, selectedKey);
  const maxPage = Math.max(0, Math.ceil(SHOP_ITEMS.length / PAGE_SIZE) - 1);
  const lines = [`**Solo Leveling Shop**`, `Gold: ${Number(hunter.gold || 0)} | Page ${p + 1}/${maxPage + 1}`, ""];
  if (selected) {
    lines.push(`Selected: **${selected.name}**`);
    lines.push(`Cost: **${selected.price} gold**`);
    lines.push(`Effect: ${selected.description}`);
  }
  if (notice) {
    lines.push("");
    lines.push(notice);
  }
  return lines.join("\n");
}

function applyPurchase(hunter, item) {
  const inventory = Array.isArray(hunter.inventory) ? [...hunter.inventory] : [];
  inventory.push(item.inventoryToken || item.name);
  const applied = typeof item.apply === "function" ? item.apply(hunter) : {};
  return {
    ...applied,
    gold: Number(hunter.gold || 0) - item.price,
    inventory,
  };
}

module.exports = {
  SHOP_ITEMS,
  buildShopPayload,
  buildShopRowsForMessage,
  buildShopText,
  getItem,
  clampPage,
  applyPurchase,
};
