const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, TextDisplayBuilder } = require("discord.js");

const ATTACK_EMOJI_ID = "1136755867899924480";
const GUARD_EMOJI_ID = "1043563693557956708";
const SKILL_EMOJI_ID = "1473673520549462229";

function buildLobbyPayload(view) {
  const top = [
    "**Dungeon Raid Lobby**",
    `Session: \`${view.id}\``,
    `Difficulty: **${view.difficultyLabel}** | Rounds: **${view.maxRounds}**`,
  ].join("\n");

  const line = "_______________________________";

  const party = [
    "**Hunters Inside**",
    ...(view.players.length ? view.players.map((p, i) => `${i + 1}. ${p.mention}`) : ["No one joined yet."]),
    "",
    "Press **Join** to enter. Press **Start Raid** to begin.",
  ].join("\n");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`raid_join:${view.id}`).setLabel("Join").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`raid_start:${view.id}`).setLabel("Start Raid").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`raid_cancel:${view.id}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary)
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(top))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(line))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(party))
    .addActionRowComponents(row);

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function buildBattlePayload(view) {
  const bossTop = [
    `**Boss: ${view.boss.name}**`,
    `Round: **${view.round}/${view.maxRounds}** | Difficulty: **${view.difficultyLabel}**`,
    `HP: ${view.bossHpBar}`,
  ].join("\n");

  const line = "_______________________________";

  const playerList = [
    "**Player Status**",
    ...view.players.map(
      (p) =>
        `${p.mention} | DMG **${p.totalDamage}** | HP ${p.hpBar} | Kits ${p.healKits} | ${
          p.dead ? "DEFEATED" : p.acted ? "Acted" : "Ready"
        }`
    ),
  ].join("\n");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`raid_act:${view.id}:attack`)
      .setLabel("Attack")
      .setStyle(ButtonStyle.Danger)
      .setEmoji({ id: ATTACK_EMOJI_ID }),
    new ButtonBuilder()
      .setCustomId(`raid_act:${view.id}:guard`)
      .setLabel("Guard")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji({ id: GUARD_EMOJI_ID }),
    new ButtonBuilder()
      .setCustomId(`raid_act:${view.id}:skill`)
      .setLabel("Skill")
      .setStyle(ButtonStyle.Primary)
      .setEmoji({ id: SKILL_EMOJI_ID }),
    new ButtonBuilder().setCustomId(`raid_act:${view.id}:heal`).setLabel("Heal").setStyle(ButtonStyle.Success)
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(bossTop))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(line))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(playerList))
    .addActionRowComponents(row);

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function buildDefeatedPayload(view) {
  const lines = ["**Defeated Hunters**", ...(view.defeated.length ? view.defeated : ["No one is defeated."])];
  const container = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")));
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function buildRewardsPayload(view, won) {
  const lines = [
    `**Raid ${won ? "Cleared" : "Failed"}**`,
    `Boss: **${view.boss.name}**`,
    "_______________________________",
    "**Rewards**",
    ...view.rewards.map((r) => {
      const card = r.card ? ` | Card: **${r.card}**` : "";
      return `<@${r.userId}> -> XP ${r.xp} | Gold ${r.gold}${card}`;
    }),
  ];

  const container = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")));
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

module.exports = {
  buildLobbyPayload,
  buildBattlePayload,
  buildDefeatedPayload,
  buildRewardsPayload,
};