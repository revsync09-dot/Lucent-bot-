const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} = require("discord.js");

// ── Custom Discord Emoji Helpers ──────────────────────────────────
// Text content in Discord requires the REAL emoji name: <:real_name:id>
// Since we only have IDs, we use unicode in text and custom emojis on buttons only.
// Buttons work with just { id } via setEmoji().

function btnEmoji(id, anim) { return { id, animated: !!anim }; }

const E = {
  shop:    "<a:e:1445924320730808391>",
  gold:    "<:e:1006637475067859105>",
  success: "<a:e:1473670205094887474>",
  error:   "<:e:1006637475067859105>",
  page:    "<:e:1437069843353571449>",
};

// ── Shop Items ────────────────────────────────────────────────────
const SHOP_ITEMS = [
  {
    key: "potion",
    name: "Mana Potion",
    description: "+100 mana instantly",
    lore: "A shimmering vial of compressed mana essence, brewed by S-rank alchemists.",
    price: 120,
    rarity: "Common",
    category: "consumable",
    emoji: { id: "1475915084911087708", animated: false },
    apply: (hunter) => ({ mana: Math.min(9999, Number(hunter.mana || 0) + 100) }),
  },
  {
    key: "hunter_key",
    name: "Hunter Key",
    description: "Used for advanced gate access",
    lore: "An ornate key etched with runes. Opens gates beyond normal rank restrictions.",
    price: 180,
    rarity: "Uncommon",
    category: "consumable",
    emoji: { id: "1475924101179899994", animated: false },
    apply: () => ({}),
  },
  {
    key: "stat_reset",
    name: "Stat Reset Token",
    description: "Respec all allocated stats",
    lore: "A divine artifact that unravels your stat distribution, letting you start fresh.",
    price: 500,
    rarity: "Rare",
    category: "special",
    emoji: { id: "1475924134650445884", animated: false },
    apply: (hunter) => ({
      strength: 5, agility: 5, intelligence: 5, vitality: 5,
      stat_points: Number(hunter.stat_points || 0)
        + Math.max(0, Number(hunter.strength || 5) - 5)
        + Math.max(0, Number(hunter.agility || 5) - 5)
        + Math.max(0, Number(hunter.intelligence || 5) - 5)
        + Math.max(0, Number(hunter.vitality || 5) - 5),
    }),
  },
  {
    key: "shadow_essence",
    name: "Shadow Essence",
    description: "Material for shadow enhancement",
    lore: "Raw shadow energy crystallized from defeated monarchs. Used in enhancement rituals.",
    price: 260,
    rarity: "Rare",
    category: "material",
    emoji: { id: "1477554399097389198", animated: false },
    inventoryToken: "material:shadow_essence",
    apply: () => ({}),
  },
  {
    key: "gate_crystal",
    name: "Gate Crystal",
    description: "Improves gate reward quality",
    lore: "A pulsating crystal forged at the core of a double-dungeon gate. Enhances loot drops.",
    price: 320,
    rarity: "Rare",
    category: "material",
    emoji: { id: "1477554472032014449", animated: false },
    inventoryToken: "material:gate_crystal",
    apply: () => ({}),
  },
  {
    key: "rune_fragment",
    name: "Rune Fragment",
    description: "Rare fragment from dungeon relics",
    lore: "A shard of an ancient relic, humming with residual magic power.",
    price: 380,
    rarity: "Epic",
    category: "material",
    emoji: { id: "1477554321074950194", animated: false },
    inventoryToken: "material:rune_fragment",
    apply: () => ({}),
  },
  {
    key: "jeju_ant_core",
    name: "Jeju Ant Core",
    description: "High-tier raid crafting core",
    lore: "Extracted from the heart of a Jeju Island mutant ant. Required for elite crafting.",
    price: 560,
    rarity: "Epic",
    category: "material",
    emoji: { id: "1477554431238344735", animated: false },
    inventoryToken: "material:jeju_ant_core",
    apply: () => ({}),
  },
  {
    key: "reawakened_stone",
    name: "Reawakened Stone",
    description: "Use with /class to change your hunter class",
    lore: "A stone vibrating with second-awakening energy. Those who hold it feel their power shift.",
    price: 5000,
    rarity: "Epic",
    category: "special",
    emoji: { id: "1477554358525890601", animated: false },
    inventoryToken: "item:reawakened_stone",
    apply: () => ({}),
  },
  {
    key: "monarch_sigil",
    name: "Monarch Sigil",
    description: "Legendary emblem with immense aura",
    lore: "The mark of the Shadow Monarch. An overwhelming aura emanates from this sigil.",
    price: 900,
    rarity: "Legendary",
    category: "special",
    emoji: { id: "1477554506031169577", animated: false },
    inventoryToken: "item:monarch_sigil",
    apply: () => ({}),
  },
  {
    key: "flame_slash_scroll",
    name: "Flame Slash Scroll",
    description: "Use /use flame_slash to activate for next raid",
    lore: "Contains the blazing technique of a Fire Dragon Knight. Burns enemies with each strike.",
    price: 420,
    rarity: "Rare",
    category: "skill",
    emoji: { id: "1477554553531531307", animated: false },
    inventoryToken: "skill_scroll:flame_slash",
    apply: () => ({}),
  },
  {
    key: "shadow_step_scroll",
    name: "Shadow Step Scroll",
    description: "Use /use shadow_step to activate for next raid",
    lore: "A forbidden movement technique stolen from the Shadow Monarch's elite corps.",
    price: 480,
    rarity: "Rare",
    category: "skill",
    emoji: { id: "1477554803243483197", animated: false },
    inventoryToken: "skill_scroll:shadow_step",
    apply: () => ({}),
  },
  {
    key: "monarch_roar_scroll",
    name: "Monarch Roar Scroll",
    description: "Use /use monarch_roar to activate for next raid",
    lore: "The battle cry of the Shadow Monarch himself, capable of paralyzing entire armies.",
    price: 700,
    rarity: "Epic",
    category: "skill",
    emoji: { id: "1477556142199541953", animated: false },
    inventoryToken: "skill_scroll:monarch_roar",
    apply: () => ({}),
  },
  {
    key: "raid_medkit",
    name: "Raid Medkit",
    description: "Used in raid battle to heal yourself",
    lore: "Military-grade emergency kit stocked by the Hunter Association for raid operations.",
    price: 300,
    rarity: "Uncommon",
    category: "consumable",
    emoji: { id: "1477557061935173733", animated: false },
    inventoryToken: "raid_heal_kit",
    apply: () => ({}),
  },
];

// ── Rarity: colors only, no colored square boxes ──────────────────
const RARITY_COLORS = {
  Common:    0x94A3B8,
  Uncommon:  0x22C55E,
  Rare:      0x3B82F6,
  Epic:      0x8B5CF6,
  Legendary: 0xF59E0B,
};

// Rarity shown as text badge only (no square emojis)
const RARITY_BADGE = {
  Common:    "◈ COMMON",
  Uncommon:  "◈ UNCOMMON",
  Rare:      "◈ RARE",
  Epic:      "◈ EPIC",
  Legendary: "◈ LEGENDARY",
};

const CATEGORY_LABELS = {
  consumable: "Consumable",
  material:   "Material",
  special:    "Special",
  skill:      "Skill Scroll",
};

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
  return SHOP_ITEMS.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
}

function pickSelected(pageItems, selectedKey) {
  if (!pageItems.length) return null;
  return pageItems.find((x) => x.key === selectedKey) || pageItems[0];
}

function buildShopPayload({ userId, hunter, page = 0, selectedKey = null, notice = "" }) {
  const p        = clampPage(page);
  const pageItems = getPageItems(p);
  const selected  = pickSelected(pageItems, selectedKey);
  const maxPage   = Math.max(0, Math.ceil(SHOP_ITEMS.length / PAGE_SIZE) - 1);

  const goldNum     = Number(hunter.gold || 0);
  const goldDisplay = goldNum.toLocaleString();

  // ── Header
  const headerText =
    `## ${E.shop}  Hunter Shop\n` +
    `> ${E.gold} **Gold:**  \`${goldDisplay}\`  ${E.page}  Page **${p + 1} / ${maxPage + 1}**`;

  // ── Item detail block
  let detailText = "";
  if (selected) {
    const badge    = RARITY_BADGE[selected.rarity] || selected.rarity;
    const category = CATEGORY_LABELS[selected.category] || selected.category;
    const canAfford = goldNum >= selected.price;
    const itemEmoji = selected.emoji ? `<:e:${selected.emoji.id}>  ` : "";

    detailText =
      `### ${itemEmoji}${selected.name}\n` +
      `> *${selected.lore}*\n\n` +
      `**${badge}**  ·  **${category}**\n` +
      `**Effect:**  ${selected.description}\n` +
      `**Price:**  ${E.gold}  \`${selected.price} Gold\``;

    if (!canAfford) {
      const missing = selected.price - goldNum;
      detailText += `\n\n> ⚠️  You need \`${missing}\` more gold to purchase this item.`;
    }
  } else {
    detailText = "*No items on this page.*";
  }

  if (notice) {
    detailText += `\n\n${notice}`;
  }

  // ── Select menu (item picker)
  const select = new StringSelectMenuBuilder()
    .setCustomId(`shop_select:${userId}:${p}`)
    .setPlaceholder("Choose an item to inspect...")
    .addOptions(
      pageItems.map((item) => ({
        label: item.name,
        value: item.key,
        description: `${RARITY_BADGE[item.rarity] || item.rarity}  ·  ${item.price} gold`,
        emoji: item.emoji,
        default: selected && selected.key === item.key,
      }))
    );

  // ── Nav buttons with animated GIF emojis
  const canBuy = selected && goldNum >= selected.price;
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_prev:${userId}:${p}:${selected?.key || "none"}`)
      .setLabel("Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p <= 0),
    new ButtonBuilder()
      .setCustomId(`shop_next:${userId}:${p}:${selected?.key || "none"}`)
      .setLabel("Next")
      .setEmoji(btnEmoji("1473670425371344907", true))    // next gif emoji
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(p >= maxPage),
    new ButtonBuilder()
      .setCustomId(`shop_buy:${userId}:${p}:${selected?.key || "none"}`)
      .setLabel(canBuy ? `Buy  —  ${selected.price} Gold` : "Buy")
      .setEmoji(btnEmoji("1006637475067859105", false))   // gold emoji on buy
      .setStyle(canBuy ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(!canBuy)
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(detailText))
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(new ActionRowBuilder().addComponents(select))
    .addActionRowComponents(navRow);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };
}

function buildShopRowsForMessage({ userId, page = 0, selectedKey = null }) {
  const p        = clampPage(page);
  const pageItems = getPageItems(p);
  const selected  = pickSelected(pageItems, selectedKey);
  const maxPage   = Math.max(0, Math.ceil(SHOP_ITEMS.length / PAGE_SIZE) - 1);

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

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`shop_prev:${userId}:${p}:${selected?.key || "none"}`)
        .setLabel("Prev").setStyle(ButtonStyle.Secondary).setDisabled(p <= 0),
      new ButtonBuilder()
        .setCustomId(`shop_next:${userId}:${p}:${selected?.key || "none"}`)
        .setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(p >= maxPage),
      new ButtonBuilder()
        .setCustomId(`shop_buy:${userId}:${p}:${selected?.key || "none"}`)
        .setLabel("Buy").setStyle(ButtonStyle.Success).setDisabled(!selected)
    ),
  ];
}

function buildShopText({ hunter, page = 0, selectedKey = null, notice = "" }) {
  const p        = clampPage(page);
  const pageItems = getPageItems(p);
  const selected  = pickSelected(pageItems, selectedKey);
  const maxPage   = Math.max(0, Math.ceil(SHOP_ITEMS.length / PAGE_SIZE) - 1);
  const lines     = [`**Hunter Shop**`, `Gold: ${Number(hunter.gold || 0)} | Page ${p + 1}/${maxPage + 1}`, ""];
  if (selected) {
    lines.push(`Selected: **${selected.name}**`);
    lines.push(`Cost: **${selected.price} gold**`);
    lines.push(`Effect: ${selected.description}`);
  }
  if (notice) { lines.push(""); lines.push(notice); }
  return lines.join("\n");
}

function applyPurchase(hunter, item) {
  const inventory = Array.isArray(hunter.inventory) ? [...hunter.inventory] : [];
  inventory.push(item.inventoryToken || item.name);
  const applied = typeof item.apply === "function" ? item.apply(hunter) : {};
  return { ...applied, gold: Number(hunter.gold || 0) - item.price, inventory };
}

module.exports = {
  SHOP_ITEMS,
  RARITY_COLORS,
  RARITY_BADGE,
  CATEGORY_LABELS,
  buildShopPayload,
  buildShopRowsForMessage,
  buildShopText,
  getItem,
  clampPage,
  applyPurchase,
};