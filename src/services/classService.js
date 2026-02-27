const { HUNTER_CLASSES } = require("../utils/constants");
const { updateUser } = require("./database");

const CLASS_MARKER_PREFIX = "CLASS::";

function normalizeClass(value) {
  const raw = String(value || "").trim().toLowerCase();
  return HUNTER_CLASSES.includes(raw) ? raw : "warrior";
}

function getHunterClass(hunter) {
  const inventory = Array.isArray(hunter?.inventory) ? hunter.inventory : [];
  const marker = inventory.find((item) => String(item).startsWith(CLASS_MARKER_PREFIX));
  if (!marker) return "warrior";
  return normalizeClass(String(marker).slice(CLASS_MARKER_PREFIX.length));
}

function withClassMarker(inventory, nextClass) {
  const items = (Array.isArray(inventory) ? inventory : []).filter(
    (item) => !String(item).startsWith(CLASS_MARKER_PREFIX)
  );
  items.unshift(`${CLASS_MARKER_PREFIX}${normalizeClass(nextClass)}`);
  return items;
}

async function setHunterClass(hunter, nextClass) {
  const normalized = normalizeClass(nextClass);
  const inventory = withClassMarker(hunter.inventory, normalized);
  const updated = await updateUser(hunter.user_id, hunter.guild_id, { inventory });
  return { hunter: updated, className: normalized };
}

async function consumeReawakenedStoneAndSetClass(hunter, nextClass) {
  const inventory = Array.isArray(hunter?.inventory) ? [...hunter.inventory] : [];
  const stoneIdx = inventory.findIndex((item) => String(item).toLowerCase() === "reawakened stone");
  if (stoneIdx < 0) return { ok: false, reason: "missing_stone" };
  inventory.splice(stoneIdx, 1);
  const patched = withClassMarker(inventory, nextClass);
  const updated = await updateUser(hunter.user_id, hunter.guild_id, { inventory: patched });
  return { ok: true, hunter: updated, className: normalizeClass(nextClass) };
}

module.exports = {
  HUNTER_CLASSES,
  getHunterClass,
  setHunterClass,
  consumeReawakenedStoneAndSetClass,
  normalizeClass,
};

