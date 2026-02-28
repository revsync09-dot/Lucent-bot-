const { randomInt, clamp } = require("../utils/math");
const { DUNGEON_DIFFICULTIES } = require("../utils/constants");
const { ensureHunter, addXpAndGold } = require("./hunterService");
const { getEquippedShadows } = require("./shadowService");
const { getBattleBonus, tryGrantSingleCard } = require("./cardsService");
const { updateUser } = require("./database");

const sessions = new Map();

const DEFAULT_ROUND_BANNERS = [
  "https://media.discordapp.net/attachments/1477018034169188362/1477412590534787122/sung-jin-woo-spinning-solo-leveling-episode-12-9p9rleq0o9kx8qyy.webp?ex=69a4ab32&is=69a359b2&hm=6f79fcae8bf77d9f62ed62ed92895d81051164b9227cfe2e3f58ce760028ed35&=&animated=true",
  "https://media.discordapp.net/attachments/1477018034169188362/1477412591092633630/solo-leveling-sung-jin-woo.gif?ex=69a4ab32&is=69a359b2&hm=5308d6f264b28b31462b53f0785aa1a95fe9b7fb47d15ad0b104f10587049817&=",
  "https://media.discordapp.net/attachments/1477018034169188362/1477412591574974645/222254.gif?ex=69a4ab32&is=69a359b2&hm=fe417bda5d5eed4e8ff4bf67595a13c721fb27e5550ccdbc8c32a2a870fc41d1&=",
  "https://media.discordapp.net/attachments/1477018034169188362/1477412591981695088/wmp4naz677qc1.gif?ex=69a4ab32&is=69a359b2&hm=e31099880b730192ee2f8139c5f13192d48e3455f9bb916c033d7c4e796be2bf&=",
  "https://media.discordapp.net/attachments/1477018034169188362/1477412592304525342/digging-digg.gif?ex=69a4ab33&is=69a359b3&hm=4fcede3c57c30a62615cd620ad40fa48c4146e04a83d61771202305f8b010421&=",
];
const ROUND_BANNERS_ENV = process.env.RAID_ROUND_BANNERS || process.env.DUNGEON_ROUND_BANNERS || "";

function normalizeDiscordBannerUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (!/discordapp\.com$/i.test(parsed.hostname) && !/discordapp\.net$/i.test(parsed.hostname)) {
      return raw;
    }
    if (parsed.hostname === "cdn.discordapp.com") {
      parsed.hostname = "media.discordapp.net";
    }
    if (!/\.gif$/i.test(parsed.pathname)) {
      parsed.searchParams.set("format", "gif");
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

function parseRoundBanners(raw) {
  const list = String(raw || "")
    .split(/[\n,]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
  if (!list.length) return DEFAULT_ROUND_BANNERS.map(normalizeDiscordBannerUrl);
  return list.map(normalizeDiscordBannerUrl);
}

const ROUND_BANNERS = parseRoundBanners(ROUND_BANNERS_ENV);

const SOLO_LEVELING_BOSSES = [
  { name: "Baran", baseHp: 3600, attack: 170 },
  { name: "Vulcan", baseHp: 3400, attack: 155 },
  { name: "Kargalgan", baseHp: 3000, attack: 145 },
  { name: "Ant King", baseHp: 4200, attack: 190 },
  { name: "Architect", baseHp: 3900, attack: 180 },
  { name: "Demon Monarch", baseHp: 4600, attack: 210 },
];

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function shuffleRoundBanners() {
  const arr = [...ROUND_BANNERS];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function healthBar(current, max, length = 24) {
  const safeMax = Math.max(1, Number(max || 1));
  const safeCurrent = clamp(Number(current || 0), 0, safeMax);
  const ratio = safeCurrent / safeMax;
  const filled = Math.round(ratio * length);
  const empty = Math.max(0, length - filled);
  const percent = Math.round(ratio * 100);
  return `${"▰".repeat(filled)}${"▱".repeat(empty)} ${percent}% (${safeCurrent}/${safeMax})`;
}

function difficultyMultiplier(key) {
  const cfg = DUNGEON_DIFFICULTIES[key] || DUNGEON_DIFFICULTIES.normal;
  return Number(cfg.multiplier || 1);
}

function pickBoss(difficultyKey) {
  const d = difficultyMultiplier(difficultyKey);
  const base = SOLO_LEVELING_BOSSES[randomInt(0, SOLO_LEVELING_BOSSES.length - 1)];
  return {
    name: base.name,
    maxHp: Math.floor(base.baseHp * d),
    hp: Math.floor(base.baseHp * d),
    attack: Math.floor(base.attack * (0.9 + d * 0.22)),
  };
}

function basePlayerHp(hunter) {
  return Math.max(400, 320 + Number(hunter.vitality || 0) * 42 + Number(hunter.level || 1) * 24);
}

async function loadActiveSkillsAndConsume(hunter) {
  const inventory = Array.isArray(hunter.inventory) ? [...hunter.inventory] : [];
  const skills = {};
  const kept = [];

  for (const item of inventory) {
    const text = String(item || "").trim();
    if (text.startsWith("active_skill:")) {
      const key = text.slice("active_skill:".length);
      skills[key] = Number(skills[key] || 0) + 1;
      continue;
    }
    kept.push(item);
  }

  if (kept.length !== inventory.length) {
    await updateUser(hunter.user_id, hunter.guild_id, { inventory: kept });
  }

  return { skills, inventory: kept };
}

function participantTag(userId) {
  return `<@${userId}>`;
}

function createLobby({ guildId, channelId, ownerId, difficultyKey = "normal" }) {
  const sessionId = createId();
  const session = {
    id: sessionId,
    guildId,
    channelId,
    ownerId,
    difficultyKey,
    state: "lobby",
    createdAt: Date.now(),
    maxRounds: randomInt(4, 5),
    round: 0,
    participants: new Map(),
    defeated: new Set(),
    rewards: [],
    boss: null,
    bannerOrder: shuffleRoundBanners(),
  };
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(String(sessionId || "")) || null;
}

function removeSession(sessionId) {
  sessions.delete(String(sessionId || ""));
}

function listParticipants(session) {
  return Array.from(session.participants.values());
}

async function joinLobby(sessionId, userId, guildId) {
  const session = getSession(sessionId);
  if (!session) return { ok: false, reason: "missing" };
  if (session.state !== "lobby") return { ok: false, reason: "started" };
  if (session.guildId !== guildId) return { ok: false, reason: "wrong_guild" };
  if (session.participants.has(userId)) return { ok: true, session, joined: false };
  if (session.participants.size >= 8) return { ok: false, reason: "full" };

  const hunter = await ensureHunter({ userId, guildId });
  const shadows = await getEquippedShadows(userId, guildId);
  const cards = await getBattleBonus(hunter);
  const prepared = await loadActiveSkillsAndConsume(hunter);
  const healKits = prepared.inventory.filter((x) => String(x) === "raid_heal_kit").length;
  const hp = basePlayerHp(hunter);

  session.participants.set(userId, {
    userId,
    hunter,
    hp,
    maxHp: hp,
    shield: 0,
    acted: false,
    shadows,
    cardBonus: cards.totalPower,
    skills: prepared.skills,
    inventory: prepared.inventory,
    healKits,
    totalDamage: 0,
    dead: false,
  });

  return { ok: true, session, joined: true };
}

async function startRaid(sessionId, starterId) {
  const session = getSession(sessionId);
  if (!session) return { ok: false, reason: "missing" };
  if (session.state !== "lobby") return { ok: false, reason: "already" };
  if (session.ownerId !== starterId && session.ownerId !== "auto") return { ok: false, reason: "owner_only" };
  if (!session.participants.size) return { ok: false, reason: "empty" };

  session.state = "in_progress";
  session.round = 1;
  session.boss = pickBoss(session.difficultyKey);
  for (const p of session.participants.values()) p.acted = false;
  return { ok: true, session };
}

function actionDamage(participant, action) {
  const h = participant.hunter;
  const base =
    Number(h.strength || 0) * 2 +
    Number(h.agility || 0) * 1.2 +
    Number(h.intelligence || 0) * 1.15 +
    Number(h.level || 1) * 8 +
    Number(participant.cardBonus || 0) * 0.75 +
    participant.shadows.reduce((n, s) => n + Number(s.base_damage || 0) + Number(s.ability_bonus || 0), 0) * 0.28;

  if (action === "guard") {
    participant.shield = Math.floor(100 + Number(h.vitality || 0) * 7 + Number(h.level || 1) * 5);
    return 0;
  }

  if (action === "heal") return 0;

  let mult = 1;
  if (action === "skill") {
    const skillEntries = Object.entries(participant.skills || {}).filter(([, n]) => Number(n) > 0);
    if (skillEntries.length) {
      const [skill] = skillEntries[0];
      participant.skills[skill] -= 1;
      if (skill === "flame_slash") mult = 1.55;
      if (skill === "shadow_step") mult = 1.35;
      if (skill === "monarch_roar") mult = 1.85;
    } else {
      mult = 1.1;
    }
  }

  const variance = randomInt(90, 115) / 100;
  return Math.max(20, Math.floor(base * mult * variance));
}

async function consumeHealKit(participant, guildId) {
  const inventory = Array.isArray(participant.inventory) ? [...participant.inventory] : [];
  const index = inventory.indexOf("raid_heal_kit");
  if (index < 0) return false;
  inventory.splice(index, 1);
  participant.inventory = inventory;
  participant.healKits = Math.max(0, Number(participant.healKits || 0) - 1);
  await updateUser(participant.userId, guildId, { inventory });
  return true;
}

function everyoneActed(session) {
  for (const p of session.participants.values()) {
    if (!p.dead && !p.acted) return false;
  }
  return true;
}

function applyBossStrike(session) {
  const alive = listParticipants(session).filter((p) => !p.dead);
  if (!alive.length) return;
  for (const p of alive) {
    const raw = Math.floor(session.boss.attack * (randomInt(85, 115) / 100));
    const blocked = Math.min(raw, Number(p.shield || 0));
    const dmg = Math.max(0, raw - blocked);
    p.shield = Math.max(0, Number(p.shield || 0) - raw);
    p.hp = Math.max(0, p.hp - dmg);
    if (p.hp <= 0) {
      p.dead = true;
      session.defeated.add(p.userId);
    }
  }
}

function shouldAutoAdvanceByHalfHp(session) {
  const alive = listParticipants(session).filter((p) => !p.dead);
  if (!alive.length) return false;
  const lowHpCount = alive.filter((p) => p.hp <= p.maxHp / 2).length;
  return lowHpCount >= Math.ceil(alive.length / 2);
}

function raidEnded(session) {
  const alive = listParticipants(session).filter((p) => !p.dead).length;
  return session.boss.hp <= 0 || alive <= 0 || session.round > session.maxRounds;
}

function raidWon(session) {
  return session.boss.hp <= 0;
}

async function finalizeRaid(session) {
  const cfg = DUNGEON_DIFFICULTIES[session.difficultyKey] || DUNGEON_DIFFICULTIES.normal;
  const won = raidWon(session);
  const rewards = [];

  for (const p of session.participants.values()) {
    const aliveAtEnd = !p.dead;
    if (won && aliveAtEnd) {
      const xp = randomInt(cfg.xp[0], cfg.xp[1]);
      const gold = randomInt(cfg.gold[0], cfg.gold[1]);
      const progression = await addXpAndGold(p.userId, session.guildId, xp, gold);
      const card = await tryGrantSingleCard(progression.hunter);
      rewards.push({ userId: p.userId, xp, gold, card: card.granted ? card.card.name : null, alive: true });
    } else {
      const xp = Math.floor(cfg.xp[0] * 0.2);
      const penalty = randomInt(12, 40);
      await addXpAndGold(p.userId, session.guildId, xp, -penalty);
      rewards.push({ userId: p.userId, xp, gold: -penalty, card: null, alive: false });
    }
  }

  session.rewards = rewards;
  session.state = "ended";
  return { won, rewards };
}

function startNextRound(session) {
  applyBossStrike(session);
  session.round += 1;
  for (const part of session.participants.values()) part.acted = false;
}

async function performAction(sessionId, userId, action) {
  const session = getSession(sessionId);
  if (!session) return { ok: false, reason: "missing" };
  if (session.state !== "in_progress") return { ok: false, reason: "not_running" };

  const p = session.participants.get(userId);
  if (!p) return { ok: false, reason: "not_joined" };
  if (p.dead) return { ok: false, reason: "dead" };

  if (shouldAutoAdvanceByHalfHp(session)) {
    startNextRound(session);
    const endedAuto = raidEnded(session);
    const autoFinal = endedAuto ? await finalizeRaid(session) : null;
    return {
      ok: true,
      session,
      damage: 0,
      action: "auto_next",
      progressedRound: true,
      ended: endedAuto,
      finalResult: autoFinal,
    };
  }

  if (p.acted) return { ok: false, reason: "already_acted" };

  if (action === "heal") {
    if (Number(p.healKits || 0) <= 0) return { ok: false, reason: "no_heal_item" };
    const consumed = await consumeHealKit(p, session.guildId);
    if (!consumed) return { ok: false, reason: "no_heal_item" };
    const healAmount = Math.floor(p.maxHp * 0.35);
    p.hp = Math.min(p.maxHp, p.hp + healAmount);
    p.acted = true;
  }

  const dmg = actionDamage(p, action);
  p.totalDamage += dmg;
  if (!p.acted) p.acted = true;
  session.boss.hp = Math.max(0, session.boss.hp - dmg);

  let progressedRound = false;
  let ended = false;

  if (session.boss.hp <= 0) {
    ended = true;
  } else if (everyoneActed(session) || shouldAutoAdvanceByHalfHp(session)) {
    startNextRound(session);
    progressedRound = true;
    ended = raidEnded(session);
  }

  const finalResult = ended ? await finalizeRaid(session) : null;

  return {
    ok: true,
    session,
    damage: dmg,
    action,
    progressedRound,
    ended,
    finalResult,
  };
}

async function forceNextRound(sessionId, userId) {
  const session = getSession(sessionId);
  if (!session) return { ok: false, reason: "missing" };
  if (session.state !== "in_progress") return { ok: false, reason: "not_running" };
  if (!session.participants.has(userId)) return { ok: false, reason: "not_joined" };

  startNextRound(session);
  const ended = raidEnded(session);
  const finalResult = ended ? await finalizeRaid(session) : null;
  return { ok: true, session, ended, finalResult };
}

function summary(session) {
  const players = listParticipants(session);
  const roundBannerUrl =
    Array.isArray(session.bannerOrder) && session.bannerOrder.length && session.round > 0
      ? session.bannerOrder[(session.round - 1) % session.bannerOrder.length]
      : null;
  return {
    id: session.id,
    state: session.state,
    round: session.round,
    maxRounds: session.maxRounds,
    difficultyKey: session.difficultyKey,
    difficultyLabel: (DUNGEON_DIFFICULTIES[session.difficultyKey] || DUNGEON_DIFFICULTIES.normal).label,
    boss: session.boss,
    roundBannerUrl,
    bossHpBar: session.boss ? healthBar(session.boss.hp, session.boss.maxHp) : null,
    players: players.map((part) => ({
      userId: part.userId,
      mention: participantTag(part.userId),
      hp: part.hp,
      maxHp: part.maxHp,
      hpBar: healthBar(part.hp, part.maxHp, 14),
      acted: part.acted,
      dead: part.dead,
      totalDamage: part.totalDamage,
      healKits: Number(part.healKits || 0),
    })),
    defeated: Array.from(session.defeated.values()).map((id) => participantTag(id)),
    rewards: session.rewards || [],
  };
}

module.exports = {
  createLobby,
  getSession,
  removeSession,
  joinLobby,
  startRaid,
  performAction,
  forceNextRound,
  summary,
};

