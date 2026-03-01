const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "utils", "raidV2Renderer.js");
let content = fs.readFileSync(filePath, "utf8");

const startIdx = content.indexOf("function buildBattlePayload(view) {");
const endIdx = content.indexOf("function buildDefeatedPayload(view) {");

const newFn = `function buildBattlePayload(view, forUserId = null) {
  let intentText = "";
  if (view.bossIntent === "ultimate") {
    intentText = \`\\n> ⚠️ **DANGER:** \${view.boss.name} is preparing \${view.bossIntentName}! GUARD NOW!\`;
  } else if (view.bossIntent === "charge") {
    intentText = \`\\n> ⚡ **WARNING:** \${view.boss.name} is charging energy...\`;
  } else {
    intentText = \`\\n> ⚔️ \${view.boss.name} is preparing to attack!\`;
  }

  const bossTop = [
    \`**Boss: \${view.boss.name}**\`,
    \`Round: **\${view.round}/\${view.maxRounds}** | Difficulty: **\${view.difficultyLabel}**\`,
    \`HP: \${view.bossHpBar}\`,
    intentText
  ].join("\\n");

  const line = "_______________________________";

  const playerList = [
    "**Player Status**",
    ...view.players.map(
      (p) =>
        \`\${p.mention} | DMG **\${p.totalDamage}** | HP \${p.hpBar} | Kits \${p.healKits} | \${
          p.dead ? "DEFEATED" : p.acted ? "Acted" : "Ready"
        }\`
    ),
  ].join("\\n");

  // Show combat log from previous round
  let logText = "";
  if (view.combatLog && view.combatLog.length > 0) {
    logText = "\\n" + line + "\\n**Combat Log**\\n" + view.combatLog.map(l => "> " + l).join("\\n");
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(\`raid_act:\${view.id}:attack\`)
      .setLabel("Attack")
      .setStyle(ButtonStyle.Danger)
      .setEmoji({ id: ATTACK_EMOJI_ID }),
    new ButtonBuilder()
      .setCustomId(\`raid_act:\${view.id}:guard\`)
      .setLabel("Guard")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji({ id: GUARD_EMOJI_ID }),
    new ButtonBuilder().setCustomId(\`raid_act:\${view.id}:heal\`).setLabel("Heal").setStyle(ButtonStyle.Success)
  );

  // If the specific user looking at this has active skills from /use, show them as a select menu!
  let skillRow = null;
  if (forUserId) {
    const p = view.players.find(x => x.userId === forUserId);
    if (p && p.skills) {
      const availableSkills = Object.entries(p.skills).filter(([k, count]) => Number(count) > 0);
      if (availableSkills.length > 0) {
        const { StringSelectMenuBuilder } = require("discord.js");
        const select = new StringSelectMenuBuilder()
          .setCustomId(\`raid_act:\${view.id}:skill_select\`)
          .setPlaceholder("Use an active Skill...")
          .addOptions(
            availableSkills.map(([k, c]) => ({
              label: \`Use \${k.replace("_", " ").toUpperCase()} (\${c}x left)\`,
              value: \`skill:\${k}\`,
              description: "Consumes 1 active skill scroll",
              emoji: { id: SKILL_EMOJI_ID }
            }))
          );
        skillRow = new ActionRowBuilder().addComponents(select);
      }
    }
  }

  const container = new ContainerBuilder();
  if (view.roundBannerUrl) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(view.roundBannerUrl))
    );
  }
  container
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(bossTop))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(line))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(playerList + logText))
    .addActionRowComponents(row);

  if (skillRow) {
    container.addActionRowComponents(skillRow);
  }

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}
`;

const brIdx = content.indexOf("function buildRewardsPayload(view, won) {");
const oldBr = content.substring(brIdx);
const newBr = oldBr.replace(/\| Gold \${r\.gold}\${card}\`/g, 
  `| Gold \${r.gold}\${card}\${r.mvp ? " 👑 **MVP**" : ""}\``);

const finalStr = content.slice(0, startIdx) + newFn + content.substring(endIdx, brIdx) + newBr;
fs.writeFileSync(filePath, finalStr, "utf8");
console.log("✅ raidV2Renderer patched!");
