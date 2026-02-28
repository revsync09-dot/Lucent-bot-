const { SlashCommandBuilder } = require("discord.js");
const { ensureHunter } = require("../services/hunterService");
const { updateUser } = require("../services/database");

const SKILLS = [
  {
    key: "flame_slash",
    label: "Flame Slash",
    scrollToken: "skill_scroll:flame_slash",
    activeToken: "active_skill:flame_slash",
  },
  {
    key: "shadow_step",
    label: "Shadow Step",
    scrollToken: "skill_scroll:shadow_step",
    activeToken: "active_skill:shadow_step",
  },
  {
    key: "monarch_roar",
    label: "Monarch Roar",
    scrollToken: "skill_scroll:monarch_roar",
    activeToken: "active_skill:monarch_roar",
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("use")
    .setDescription("Use a purchased skill scroll and activate it for your next raid.")
    .addStringOption((option) =>
      option
        .setName("skill")
        .setDescription("Skill to activate")
        .setRequired(true)
        .addChoices(...SKILLS.map((s) => ({ name: s.label, value: s.key })))
    ),
  async execute(interaction) {
    const key = interaction.options.getString("skill", true);
    const skill = SKILLS.find((s) => s.key === key);
    if (!skill) {
      await interaction.reply({ content: "Unknown skill.", ephemeral: true });
      return;
    }

    const hunter = await ensureHunter({ userId: interaction.user.id, guildId: interaction.guildId });
    const inventory = Array.isArray(hunter.inventory) ? [...hunter.inventory] : [];
    const idx = inventory.indexOf(skill.scrollToken);
    if (idx < 0) {
      await interaction.reply({
        content: `You need **${skill.label} Scroll** from /shop first.`,
        ephemeral: true,
      });
      return;
    }

    inventory.splice(idx, 1);
    inventory.push(skill.activeToken);
    await updateUser(interaction.user.id, interaction.guildId, { inventory });

    await interaction.reply({
      content: `Activated **${skill.label}** for your next raid.`,
      ephemeral: true,
    });
  },
};
