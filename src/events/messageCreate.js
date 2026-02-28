const { ContainerBuilder, Events, MessageFlags, PermissionsBitField, TextDisplayBuilder } = require("discord.js");
const { ensureHunter, addXpAndGold, getHunter, xpRequired } = require("../services/hunterService");
const { getCooldown, setCooldown, remainingSeconds } = require("../services/cooldownService");
const { runHunt, computePower } = require("../services/combatService");
const { runDungeon } = require("../services/dungeonService");
const { cooldownRemaining, nextCooldown } = require("../utils/cooldownHelper");
const {
  generateBattleResultCard,
  generateCardsCollectionCard,
  generateGateCard,
  generateHuntResultCard,
  generateInventoryCard,
  generateProfileCard,
  generateRankupCard,
  generateSalaryCard,
  generateStartCard,
  generateStatsCard,
} = require("../services/cardGenerator");
const { dungeonSelectionRows, profileRows } = require("../handlers/components");
const { getEquippedShadows } = require("../services/shadowService");
const { getBattleBonus, getOwnedCards, tryGrantSingleCard } = require("../services/cardsService");
const { runPvp } = require("../services/pvpService");
const { updateUser } = require("../services/database");
const { RANKS, RANK_THRESHOLDS, DUNGEON_DIFFICULTIES } = require("../utils/constants");
const { randomInt } = require("../utils/math");
const { buildShopRowsForMessage, buildShopText } = require("../services/shopService");
const { upsertDungeonConfig } = require("../services/autoDungeonService");
const { getConfig } = require("../config/config");
const { buildStatusPayload } = require("../utils/statusMessage");
const {
  HUNTER_CLASSES,
  getHunterClass,
  consumeReawakenedStoneAndSetClass,
  normalizeClass,
} = require("../services/classService");
const { tryGrantMonarchRole } = require("../utils/rewardRoles");
const { buildDungeonResultV2Payload } = require("../utils/dungeonResultV2");

const PREFIXES = ["!", "?"];
const HELP_EMOJI = "<:help:976524440080883802>";
const processedMessages = new Set();
const config = getConfig();
const CHANNEL_BYPASS_USERS = new Set(["795466540140986368", "760194150452035595"]);

function helpText() {
  const lines = [
    "SOLO LEVELING - PREFIX HELP",
    "",
    "START",
    "!start / ?start            Create your hunter profile",
    "!help / ?help              Show this list",
    "",
    "MAIN",
    "!profile / ?profile        Show your hunter profile",
    "!stats [@user]             Show detailed stats",
    "!hunt / ?hunt              Hunt for XP and gold",
    "!inventory / ?inventory    Show your inventory",
    "!shop                      Open the shop",
    "!cards / ?cards            Show your card collection",
    "",
    "ADVANCED",
    "!class [name]              Change class (needs item)",
    "!rankup                    Rank up if requirements are met",
    "!battle @user / !pvp @user PvP battle",
    "/use                       Use bought skill items",
    "!setupdungeon [#ch] [min]  Configure auto dungeon (staff)",
    "!guild_salary              Daily salary (staff)",
    "!gate_risk                 Risk gate rewards (staff)",
  ];

  return [
    `${HELP_EMOJI} **Solo Leveling Prefix Help**`,
    "",
    "```",
    ...lines,
    "```",
  ].join("\n");
}

function prefixHelpV2Payload() {
  const container = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(helpText()));
  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

function mapCollectionCards(owned) {
  return owned.map((card) => ({
    title: card.name,
    subtitle: `${card.rank}-Rank ${card.role}`,
    meta: `ATK ${card.atk} | HP ${card.hp} | DEF ${card.def}`,
    rarity:
      String(card.rank).toUpperCase() === "NATIONAL" || String(card.rank).toUpperCase() === "NATIONAL LEVEL"
        ? "Mythic"
        : String(card.rank).toUpperCase() === "S" || String(card.rank).toUpperCase() === "S-RANK"
          ? "Legendary"
          : card.rank,
    asset: card.asset || card.name,
  }));
}

function dungeonLootText(result, monarchGranted = false) {
  const parts = [];
  if (result.weaponDrop) parts.push(`Weapon: ${result.weaponDrop}`);
  if (result.companionDrop) parts.push(`Companion: ${result.companionDrop}`);
  if (result.statusEffects?.length) parts.push(`Status: ${result.statusEffects.join(", ")}`);
  if (monarchGranted) parts.push("Shadow Monarch Role obtained");
  if (!parts.length) return null;
  return parts.join(" | ");
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    if (config.discordGuildId && message.guild.id !== config.discordGuildId) return;
    if (config.commandChannelId && message.channelId !== config.commandChannelId && !CHANNEL_BYPASS_USERS.has(message.author.id)) return;
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);
    setTimeout(() => processedMessages.delete(message.id), 15_000);

    const matchedPrefix = PREFIXES.find((p) => message.content.startsWith(p));
    if (!matchedPrefix) return;

    const args = message.content.slice(matchedPrefix.length).trim().split(/\s+/);
    const command = (args.shift() || "").toLowerCase();
    const userId = message.author.id;
    const guildId = message.guild.id;

    try {
      if (command === "help") {
        await message.reply(prefixHelpV2Payload());
        return;
      }

      if (command === "start") {
        const hunter = await ensureHunter({ userId, guildId });
        const card = await generateStartCard(message.author, hunter);
        await message.reply({ files: [{ attachment: card, name: "start-card.png" }] });
        return;
      }

      if (command === "setupdungeon") {
        const member = message.member;
        const isOwner = message.guild.ownerId === message.author.id;
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
        const canManageGuild = member.permissions.has(PermissionsBitField.Flags.ManageGuild);
        if (!isOwner && !isAdmin && !canManageGuild) {
          await message.reply("Only the server owner or co-owner (admin/manage server) can use this.");
          return;
        }

        const firstArg = (args[0] || "").toLowerCase();
        if (firstArg === "off" || firstArg === "disable") {
          const config = await upsertDungeonConfig({
            guildId,
            channelId: null,
            intervalMinutes: 15,
            enabled: false,
          });
          await message.reply(
            `Auto dungeon disabled.\nEnabled: ${config.dungeon_enabled ? "yes" : "no"}`
          );
          return;
        }

        const mentionedChannel = message.mentions.channels.first();
        const channel = mentionedChannel || message.channel;

        const minuteArg = args.find((a) => /^\d+$/.test(a));
        const minutes = Math.max(1, Math.min(180, Number(minuteArg || 15)));

        const config = await upsertDungeonConfig({
          guildId,
          channelId: channel.id,
          intervalMinutes: minutes,
          enabled: true,
        });

        await message.reply(
          `Auto dungeon enabled in <#${config.dungeon_channel_id}> every ${config.dungeon_interval_minutes} minute(s).\n` +
            "Use `!setupdungeon off` to disable."
        );
        return;
      }

      if (command === "profile") {
        const hunter = await ensureHunter({ userId, guildId });
        const card = await generateProfileCard(message.author, hunter);
        await message.reply({
          files: [{ attachment: card, name: "profile-card.png" }],
          components: profileRows(userId),
        });
        return;
      }

      if (command === "stats") {
        const targetUser = message.mentions.users.first() || message.author;
        if (targetUser.bot) {
          await message.reply("Bots do not have hunter stats.");
          return;
        }

        let hunter;
        if (targetUser.id === userId) {
          hunter = await ensureHunter({ userId, guildId });
        } else {
          hunter = await getHunter(targetUser.id, guildId);
          if (!hunter) {
            await message.reply(`${targetUser.username} has no hunter profile in this server yet.`);
            return;
          }
        }

        const [equippedShadows, cardBonus, ownedCards] = await Promise.all([
          getEquippedShadows(targetUser.id, guildId),
          getBattleBonus(hunter),
          getOwnedCards(hunter),
        ]);

        const shadowPower = equippedShadows.reduce((sum, s) => sum + s.base_damage + s.ability_bonus, 0);
        const basePower = computePower(hunter, []);
        const finalPower = computePower(hunter, equippedShadows, cardBonus.totalPower);
        const expNeeded = xpRequired(hunter.level);
        const topCards = cardBonus.cards.map((c) => c.name).slice(0, 3).join(", ") || "None";

        const card = await generateStatsCard(targetUser, hunter, {
          expNeeded,
          basePower,
          shadowPower,
          cardPower: cardBonus.totalPower,
          finalPower,
          equippedShadows: equippedShadows.length,
          shadowSlots: hunter.shadow_slots,
          ownedCards: ownedCards.length,
          topCards,
        });

        await message.reply({ files: [{ attachment: card, name: "stats-card.png" }] });
        return;
      }

      if (command === "class") {
        const hunter = await ensureHunter({ userId, guildId });
        const arg = normalizeClass(args[0] || "");
        if (!args[0]) {
          await message.reply(
            `Current class: **${getHunterClass(hunter)}**\nAvailable: ${HUNTER_CLASSES.join(
              ", "
            )}\nUse \`!class <name>\` with **Reawakened Stone** in inventory.`
          );
          return;
        }

        const changed = await consumeReawakenedStoneAndSetClass(hunter, arg);
        if (!changed.ok) {
          await message.reply("You need a **Reawakened Stone** in your inventory to change class.");
          return;
        }
        await message.reply(`Class changed to **${changed.className}**. Reawakened Stone consumed.`);
        return;
      }

      if (command === "hunt") {
        const hunter = await ensureHunter({ userId, guildId });
        const cd = await getCooldown(userId, guildId, "hunt");
        if (cd && new Date(cd.available_at).getTime() > Date.now()) {
          await message.reply(`Hunt cooldown active: ${cooldownRemaining(cd.available_at)}s`);
          return;
        }

        const rewards = runHunt(hunter);
        const progression = await addXpAndGold(userId, guildId, rewards.xp, rewards.gold);
        await setCooldown(userId, guildId, "hunt", nextCooldown(300));
        const cardDrop = await tryGrantSingleCard(progression.hunter);

        const card = await generateHuntResultCard(message.author, rewards, progression.levelsGained);
        const files = [{ attachment: card, name: "hunt-result.png" }];
        if (cardDrop.granted && cardDrop.imagePath) {
          files.push({ attachment: cardDrop.imagePath, name: "single-card.png" });
        }
        await message.reply({
          content: cardDrop.granted ? `You unlocked **${cardDrop.card.name}** (drop chance: 0.0025%).` : undefined,
          files,
        });
        return;
      }

      if (command === "dungeon") return;

      if (command === "inventory") {
        const hunter = await ensureHunter({ userId, guildId });
        const card = await generateInventoryCard(message.author, hunter);
        await message.reply({ files: [{ attachment: card, name: "inventory-card.png" }] });
        return;
      }

      if (command === "cards") {
        const hunter = await ensureHunter({ userId, guildId });
        const owned = await getOwnedCards(hunter);
        const collection = await generateCardsCollectionCard(message.author.username, mapCollectionCards(owned));
        await message.reply({ files: [{ attachment: collection, name: "cards-collection.png" }] });
        return;
      }

      if (command === "rankup") {
        const hunter = await ensureHunter({ userId, guildId });
        const currentIndex = RANKS.indexOf(hunter.rank);
        if (currentIndex < 0 || currentIndex >= RANKS.length - 1) {
          await message.reply("You are already at the maximum rank.");
          return;
        }
        const nextRank = RANKS[currentIndex + 1];
        const requiredLevel = RANK_THRESHOLDS[nextRank];
        const examCost = 300 + currentIndex * 250;
        if (hunter.level < requiredLevel) {
          await message.reply(`You need level ${requiredLevel} for rank ${nextRank}.`);
          return;
        }
        if (hunter.gold < examCost) {
          await message.reply(`Not enough gold. Required: ${examCost}.`);
          return;
        }

        await updateUser(userId, guildId, { rank: nextRank, gold: hunter.gold - examCost });
        const card = await generateRankupCard(message.author, nextRank, hunter.rank);
        await message.reply({ files: [{ attachment: card, name: "rankup-card.png" }] });
        return;
      }

      if (command === "battle" || command === "pvp") {
        const cd = await getCooldown(userId, guildId, "battle");
        if (cd && new Date(cd.available_at).getTime() > Date.now()) {
          await message.reply(`Battle cooldown active: ${cooldownRemaining(cd.available_at)}s`);
          return;
        }

        const opponent = message.mentions.users.first();
        if (!opponent || opponent.bot || opponent.id === userId) {
          await message.reply("Use a valid opponent mention. Example: `!battle @user`");
          return;
        }

        const attacker = await ensureHunter({ userId, guildId });
        const defender = await ensureHunter({ userId: opponent.id, guildId });
        const result = await runPvp(attacker, defender);
        const card = await generateBattleResultCard(
          { username: message.author.username },
          { username: opponent.username },
          result
        );
        await message.reply({
          content:
            `Rounds: ${result.rounds} | ` +
            `${result.attackerWon ? message.author.username : opponent.username} won\n` +
            `You: +${result.rewards?.attacker?.xp || 0} XP, +${result.rewards?.attacker?.gold || 0} Gold`,
          files: [{ attachment: card, name: "battle-result.png" }],
        });
        await setCooldown(userId, guildId, "battle", nextCooldown(300));
        return;
      }

      if (command === "shop") {
        const hunter = await ensureHunter({ userId, guildId });
        await message.reply({
          content: buildShopText({ hunter, page: 0 }),
          components: buildShopRowsForMessage({ userId, page: 0 }),
        });
        return;
      }

      if (command === "guild_salary" || command === "salary") {
        await ensureHunter({ userId, guildId });
        const cooldown = await getCooldown(userId, guildId, "guild_salary");
        if (cooldown && new Date(cooldown.available_at).getTime() > Date.now()) {
          await message.reply(`Guild salary is on cooldown. Try again in ${remainingSeconds(cooldown.available_at)}s.`);
          return;
        }

        const gold = randomInt(200, 350);
        const xp = randomInt(30, 65);
        const progression = await addXpAndGold(userId, guildId, xp, gold);
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await setCooldown(userId, guildId, "guild_salary", tomorrow);

        const card = await generateSalaryCard(message.author, gold, progression.hunter.gold);
        await message.reply({ files: [{ attachment: card, name: "salary-card.png" }] });
        return;
      }

      if (command === "gate_risk" || command === "gaterisk") {
        const hunter = await ensureHunter({ userId, guildId });
        const cooldown = await getCooldown(userId, guildId, "gate_risk");
        if (cooldown && new Date(cooldown.available_at).getTime() > Date.now()) {
          await message.reply(`Gate risk cooldown active: ${cooldownRemaining(cooldown.available_at)}s`);
          return;
        }
        const difficulty = "EXTREME";
        const successChance = Math.min(80, 35 + hunter.level * 0.6 + hunter.agility * 0.5);
        const roll = randomInt(1, 100);
        const didWin = roll <= successChance;

        let rewards = {};
        if (didWin) {
          const gold = randomInt(280, 520);
          const xp = randomInt(120, 240);
          rewards = { gold, xp };
          await addXpAndGold(userId, guildId, xp, gold);
        } else {
          const penalty = randomInt(80, 180);
          rewards = { penalty };
          await addXpAndGold(userId, guildId, 30, -penalty);
        }

        const card = await generateGateCard(message.author, difficulty, rewards, didWin);
        await setCooldown(userId, guildId, "gate_risk", nextCooldown(600));
        await message.reply({ files: [{ attachment: card, name: "gate-card.png" }] });
        return;
      }

      await message.reply(
        buildStatusPayload(message, {
          ok: false,
          text: "Unknown prefix command. Use !help or ?help.",
          ephemeral: false,
        })
      );
    } catch (error) {
      console.error(error);
      await message.reply(
        buildStatusPayload(message, {
          ok: false,
          text: "An unexpected error occurred. Please try again.",
          ephemeral: false,
        })
      );
    }
  },
};
