const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "services", "raidDungeonService.js");
let content = fs.readFileSync(filePath, "utf8");

// We need to inject "boss.intent" to make battles fun.
// Inside `startRaid`, after `session.boss = pickBoss(...)`, we add `session.boss.intent = "attack";`
const srMark = "session.boss = pickBoss(session.difficultyKey);";
content = content.replace(srMark, `session.boss = pickBoss(session.difficultyKey);
  session.boss.intent = "attack";
  session.boss.intentName = "";
  session.combatLog = ["The Raid begins! Boss approaches."];
  session.mvpUserId = null;`);

// Inside `applyBossStrike`, we check the intent text to make it devastating if it's "ultimate"
const absMark = "function applyBossStrike(session) {";
const absEndMark = "function shouldAutoAdvanceByHalfHp(session) {";
const newAbs = `function applyBossStrike(session) {
  const alive = listParticipants(session).filter((p) => !p.dead);
  if (!alive.length) return;
  
  const isUltimate = session.boss.intent === "ultimate";
  const logs = [];
  
  if (isUltimate) {
    logs.push(\`[ALERT] \${session.boss.name} unleashed \${session.boss.intentName || 'Devastating Ultimate'}!\`);
  } else if (session.boss.intent === "charge") {
    logs.push(\`[WARNING] \${session.boss.name} is charging energy...\`);
    return; // No damage this turn!
  }
  
  for (const p of alive) {
    let raw = Math.floor(session.boss.attack * (randomInt(85, 115) / 100));
    // Ultimate does 3.5x normal damage, forces players to guard/heal!
    if (isUltimate) raw = Math.floor(raw * 3.5);

    // If player used Shadow Step, they dodge completely!
    if (p.lastAction === "shadow_step") {
      logs.push(\`  <@\${p.userId}> vanished into shadows and dodged the attack!\`);
      continue;
    }

    const blocked = Math.min(raw, Number(p.shield || 0));
    const dmg = Math.max(0, raw - blocked);
    p.shield = Math.max(0, Number(p.shield || 0) - raw);
    p.hp = Math.max(0, p.hp - dmg);
    
    // reset shield after boss turn
    p.shield = 0;

    if (p.hp <= 0) {
      p.dead = true;
      session.defeated.add(p.userId);
      logs.push(\`  💀 <@\${p.userId}> was struck down!\`);
    } else if (dmg > 0 && isUltimate) {
      logs.push(\`  <@\${p.userId}> took \${dmg} massive damage!\`);
    } else if (blocked > 0 && isUltimate) {
      logs.push(\`  🛡️ <@\${p.userId}> guarded against the ultimate! (\${blocked} blocked)\`);
    }
  }
  
  // Decide next intent
  const opts = ["attack", "attack", "charge", "charge", "ultimate"];
  if (isUltimate) {
    session.boss.intent = "attack";
    session.boss.intentName = "";
  } else if (session.boss.intent === "charge") {
    session.boss.intent = "ultimate";
    const uNames = ["Infernal Flame", "Death Strike", "Annihilation Ray", "Monarch's Wrath"];
    session.boss.intentName = uNames[randomInt(0, uNames.length-1)];
  } else {
    session.boss.intent = opts[randomInt(0, opts.length - 1)];
  }
  
  session.combatLog = logs;
}
`;
content = content.replace(content.substring(content.indexOf(absMark), content.indexOf(absEndMark)), newAbs);


// In `actionDamage`, we handle special skills better and set `p.lastAction`
const adMark = `function actionDamage(participant, action) {`;
const adEndMark = `function consumeHealKit(participant, guildId) {`;
const newAd = `function actionDamage(participant, action, sessionLogs) {
  const h = participant.hunter;
  const base =
    Number(h.strength || 0) * 2 +
    Number(h.agility || 0) * 1.2 +
    Number(h.intelligence || 0) * 1.15 +
    Number(h.level || 1) * 8 +
    Number(participant.cardBonus || 0) * 0.75 +
    participant.shadows.reduce((n, s) => n + Number(s.base_damage || 0) + Number(s.ability_bonus || 0), 0) * 0.28;

  participant.lastAction = action;

  if (action === "guard") {
    participant.shield = Math.floor(180 + Number(h.vitality || 0) * 12 + Number(h.level || 1) * 8);
    sessionLogs.push(\`🛡️ <@\${participant.userId}> braced for impact! (Shield: \${participant.shield})\`);
    return 0;
  }

  if (action === "heal") return 0; // handled elsewhere

  let mult = 1;
  let skillName = "";
  if (action.startsWith("skill:")) {
    const skill = action.split(":")[1];
    if (participant.skills[skill] > 0) {
      participant.skills[skill] -= 1;
      participant.lastAction = skill;
      if (skill === "flame_slash") { mult = 3.2; skillName = "🔥 Flame Slash"; }
      if (skill === "shadow_step") { mult = 1.0; skillName = "👟 Shadow Step (Dodge)"; }
      if (skill === "monarch_roar") { mult = 4.5; skillName = "📣 Monarch's Roar"; }
    } else {
      mult = 1.1; // fallback if trying to cheat
    }
  } else if (action === "attack") {
    mult = 1.0;
  }

  const variance = randomInt(90, 115) / 100;
  const dmg = Math.max(20, Math.floor(base * mult * variance));
  
  if (skillName) {
    sessionLogs.push(\`💥 <@\${participant.userId}> cast **\${skillName}** targeting the boss! (\${dmg} DMG)\`);
  }
  return dmg;
}
`;
content = content.replace(content.substring(content.indexOf(adMark), content.indexOf(adEndMark)), newAd);

// `performAction` updates
content = content.replace(/const dmg = actionDamage\(p, action\);/g, `const dmg = actionDamage(p, action, session.combatLog);`);
content = content.replace(`p.acted = true;\n  }`, `p.acted = true;\n    session.combatLog.push(\`💉 <@\${p.userId}> used a Medkit to heal!\`);\n  }`);

// `finalizeRaid` logic to grant MVP super rewards
const frMark = "function finalizeRaid(session) {";
const frEndMark = "function startNextRound(session) {";
const newFr = `async function finalizeRaid(session) {
  const cfg = DUNGEON_DIFFICULTIES[session.difficultyKey] || DUNGEON_DIFFICULTIES.normal;
  const won = raidWon(session);
  const rewards = [];
  
  // Find MVP (most damage)
  let mvpId = null;
  let maxDmg = -1;
  if (won) {
    for (const p of session.participants.values()) {
      if (p.totalDamage > maxDmg) { maxDmg = p.totalDamage; mvpId = p.userId; }
    }
    session.mvpUserId = mvpId;
  }

  for (const p of session.participants.values()) {
    const aliveAtEnd = !p.dead;
    if (won && aliveAtEnd) {
      let xp = randomInt(cfg.xp[0], cfg.xp[1]);
      let gold = randomInt(cfg.gold[0], cfg.gold[1]);
      let isMvp = (p.userId === mvpId);
      
      if (isMvp) {
        xp = Math.floor(xp * 1.5); // MVP +50%
        gold = Math.floor(gold * 1.5) + 500;
      }
      
      const progression = await addXpAndGold(p.userId, session.guildId, xp, gold);
      // MVP has much higher drop chance
      const rand = Math.random();
      const dropChance = isMvp ? 0.08 : 0.01;
      let cardName = null;
      if (rand <= dropChance) {
         const drop = await tryGrantSingleCard(progression.hunter);
         if (drop.granted) cardName = drop.card.name;
      }
      rewards.push({ userId: p.userId, xp, gold, card: cardName, alive: true, mvp: isMvp });
    } else {
      const xp = Math.floor(cfg.xp[0] * 0.2);
      const penalty = randomInt(12, 40);
      await addXpAndGold(p.userId, session.guildId, xp, -penalty);
      rewards.push({ userId: p.userId, xp, gold: -penalty, card: null, alive: false, mvp: false });
    }
  }

  session.rewards = rewards;
  session.state = "ended";
  return { won, rewards };
}
`;
content = content.replace(content.substring(content.indexOf("async " + frMark), content.indexOf(frEndMark)), newFr);


// pass intent and MVP info out to `summary`
content = content.replace(`bossHpBar: session.boss ? healthBar(session.boss.hp, session.boss.maxHp) : null,`, `bossHpBar: session.boss ? healthBar(session.boss.hp, session.boss.maxHp) : null,
    bossIntent: session.boss ? session.boss.intent : null,
    bossIntentName: session.boss ? session.boss.intentName : null,
    combatLog: session.combatLog || [],
    mvpUserId: session.mvpUserId,`);

content = content.replace(`healKits: Number(part.healKits || 0),`, `healKits: Number(part.healKits || 0),
      skills: part.skills,`);

fs.writeFileSync(filePath, content, "utf8");
console.log("✅ raidDungeonService patched for Epic Gameplay");
