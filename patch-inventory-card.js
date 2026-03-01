const fs = require("fs");
const path = require("path");

// Item catalog matching shopService tokens ──────────────────────
const ITEM_CATALOG = {
  
  "Mana Potion":              { display: "Mana Potion",         category: "Consumable", rarity: "Common",    color: "#A78BFA", icon: "🔮" },
  "Hunter Key":               { display: "Hunter Key",          category: "Consumable", rarity: "Uncommon",  color: "#22C55E", icon: "🗝️" },
  "raid_heal_kit":            { display: "Raid Medkit",         category: "Consumable", rarity: "Uncommon",  color: "#22C55E", icon: "🩺" },
  // Materials
  "material:shadow_essence":  { display: "Shadow Essence",      category: "Material",   rarity: "Rare",      color: "#3B82F6", icon: "🌑" },
  "material:gate_crystal":    { display: "Gate Crystal",        category: "Material",   rarity: "Rare",      color: "#3B82F6", icon: "💎" },
  "material:rune_fragment":   { display: "Rune Fragment",       category: "Material",   rarity: "Epic",      color: "#8B5CF6", icon: "🔷" },
  "material:jeju_ant_core":   { display: "Jeju Ant Core",      category: "Material",   rarity: "Epic",      color: "#8B5CF6", icon: "🐜" },

  "item:reawakened_stone":    { display: "Reawakened Stone",    category: "Special",    rarity: "Epic",      color: "#8B5CF6", icon: "🪨" },
  "item:monarch_sigil":       { display: "Monarch Sigil",       category: "Special",    rarity: "Legendary", color: "#F59E0B", icon: "👑" },
  "Stat Reset Token":         { display: "Stat Reset Token",    category: "Special",    rarity: "Rare",      color: "#3B82F6", icon: "♻️" },
 
  "skill_scroll:flame_slash": { display: "Flame Slash Scroll",  category: "Skill",      rarity: "Rare",      color: "#EF4444", icon: "🔥" },
  "skill_scroll:shadow_step": { display: "Shadow Step Scroll",  category: "Skill",      rarity: "Rare",      color: "#6366F1", icon: "👟" },
  "skill_scroll:monarch_roar":{ display: "Monarch Roar Scroll", category: "Skill",      rarity: "Epic",      color: "#8B5CF6", icon: "📣" },
};

const RARITY_COLORS = {
  Common:    "#94A3B8",
  Uncommon:  "#22C55E",
  Rare:      "#3B82F6",
  Epic:      "#8B5CF6",
  Legendary: "#F59E0B",
};

function resolveItem(token) {
  if (ITEM_CATALOG[token]) return ITEM_CATALOG[token];

  return { display: token, category: "Item", rarity: "Common", color: "#94A3B8", icon: "📦" };
}

const filePath = path.join(__dirname, "src", "services", "cardGenerator.js");
let content    = fs.readFileSync(filePath, "utf8");

const startMarker = "async function generateInventoryCard(user, hunter) {";
const endMarker   = "async function generateCardsCollectionCard(";

const startIdx = content.indexOf(startMarker);
const endIdx   = content.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) { console.error("Markers not found", {startIdx, endIdx}); process.exit(1); }

const newFn = `async function generateInventoryCard(user, hunter) {
  const displayName = formatDisplayName(user.username);
  const W = 1480, H = 920;
  const canvas = new Canvas(W, H);
  const ctx    = canvas.getContext("2d");

  await drawMainBackground(ctx, W, H);

  const FONT_NUM = "Orbitron";
  const FONT_LBL = "Rajdhani";
  const FONT_FB  = "Inter";
  function numFont(sz) { return "900 " + sz + "px " + FONT_NUM + ", " + FONT_FB; }
  function lblFont(sz) { return "700 " + sz + "px " + FONT_LBL + ", " + FONT_FB; }

  const ITEM_CATALOG = {
    "Mana Potion":               { display: "Mana Potion",         category: "Consumable", rarity: "Common",    color: "#A78BFA" },
    "Hunter Key":                { display: "Hunter Key",          category: "Consumable", rarity: "Uncommon",  color: "#22C55E" },
    "raid_heal_kit":             { display: "Raid Medkit",         category: "Consumable", rarity: "Uncommon",  color: "#22C55E" },
    "material:shadow_essence":   { display: "Shadow Essence",      category: "Material",   rarity: "Rare",      color: "#3B82F6" },
    "material:gate_crystal":     { display: "Gate Crystal",        category: "Material",   rarity: "Rare",      color: "#3B82F6" },
    "material:rune_fragment":    { display: "Rune Fragment",       category: "Material",   rarity: "Epic",      color: "#8B5CF6" },
    "material:jeju_ant_core":    { display: "Jeju Ant Core",       category: "Material",   rarity: "Epic",      color: "#8B5CF6" },
    "item:reawakened_stone":     { display: "Reawakened Stone",    category: "Special",    rarity: "Epic",      color: "#8B5CF6" },
    "item:monarch_sigil":        { display: "Monarch Sigil",       category: "Special",    rarity: "Legendary", color: "#F59E0B" },
    "Stat Reset Token":          { display: "Stat Reset Token",    category: "Special",    rarity: "Rare",      color: "#3B82F6" },
    "skill_scroll:flame_slash":  { display: "Flame Slash Scroll",  category: "Skill",      rarity: "Rare",      color: "#EF4444" },
    "skill_scroll:shadow_step":  { display: "Shadow Step Scroll",  category: "Skill",      rarity: "Rare",      color: "#6366F1" },
    "skill_scroll:monarch_roar": { display: "Monarch Roar Scroll", category: "Skill",      rarity: "Epic",      color: "#8B5CF6" },
  };
  const RARITY_COLORS = { Common:"#94A3B8", Uncommon:"#22C55E", Rare:"#3B82F6", Epic:"#8B5CF6", Legendary:"#F59E0B" };
  function resolveItem(token) {
    return ITEM_CATALOG[token] || { display: token, category: "Item", rarity: "Common", color: "#94A3B8" };
  }

  const rankLabel = normalizeRank(hunter.rank);
  const rankTint  = rankColor(rankLabel);
  const items     = Array.isArray(hunter.inventory) ? hunter.inventory : [];

  // ── BACKGROUND WASH ──────────────────────────────────────────────
  const wash = ctx.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, "rgba(2,4,18,0.88)"); wash.addColorStop(1, "rgba(1,2,12,0.94)");
  ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);

  // grid
  ctx.save(); ctx.globalAlpha = 0.04; ctx.strokeStyle = "#4A90D9"; ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 48) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 48) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }
  ctx.restore();

  // scan lines
  ctx.save(); ctx.globalAlpha = 0.018; ctx.strokeStyle = "#7C3AED"; ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 26) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i+H,H); ctx.stroke(); }
  ctx.restore();

  // ── TOP BAR ──────────────────────────────────────────────────────
  const topG = ctx.createLinearGradient(0,0,W,0);
  topG.addColorStop(0,rankTint); topG.addColorStop(0.35,"#7C3AED"); topG.addColorStop(0.7,"#0EA5E9"); topG.addColorStop(1,rankTint);
  ctx.fillStyle = topG; ctx.fillRect(0,0,W,8);
  const tgl = ctx.createLinearGradient(0,8,0,70); tgl.addColorStop(0,rankTint+"44"); tgl.addColorStop(1,"transparent");
  ctx.fillStyle = tgl; ctx.fillRect(0,8,W,62);
  ctx.fillStyle = topG; ctx.fillRect(0,H-8,W,8);

  // ── CORNER BRACKETS ──────────────────────────────────────────────
  function drawCorner(bx,by,size,fx,fy,color) {
    ctx.save(); ctx.translate(bx,by); ctx.scale(fx?-1:1,fy?-1:1);
    ctx.strokeStyle=color; ctx.lineWidth=3; ctx.lineCap="square";
    ctx.beginPath(); ctx.moveTo(0,size); ctx.lineTo(0,0); ctx.lineTo(size,0); ctx.stroke();
    ctx.globalAlpha=0.22; ctx.lineWidth=9; ctx.stroke(); ctx.restore();
  }
  drawCorner(16,16,46,false,false,rankTint); drawCorner(W-16,16,46,true,false,rankTint);
  drawCorner(16,H-16,46,false,true,"#0EA5E9"); drawCorner(W-16,H-16,46,true,true,"#0EA5E9");

  // ── HEADER BANNER ────────────────────────────────────────────────
  const bY=24, bH=72;
  roundedRect(ctx,28,bY,W-56,bH,18);
  const bBg=ctx.createLinearGradient(28,bY,W-28,bY+bH);
  bBg.addColorStop(0,"rgba(30,20,70,0.75)"); bBg.addColorStop(0.5,"rgba(15,25,60,0.80)"); bBg.addColorStop(1,"rgba(10,20,50,0.75)");
  ctx.fillStyle=bBg; ctx.fill(); ctx.strokeStyle="#7C3AED55"; ctx.lineWidth=1.5; ctx.stroke();
  // banner gloss
  roundedRect(ctx,30,bY+2,W-60,bH*0.44,16);
  const bGl=ctx.createLinearGradient(28,bY,28,bY+bH*0.44);
  bGl.addColorStop(0,"rgba(255,255,255,0.10)"); bGl.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=bGl; ctx.fill();

  // avatar small
  const avR=28, avX=64, avY=bY+bH/2;
  ctx.beginPath(); ctx.arc(avX,avY,avR,0,Math.PI*2); ctx.fillStyle="#0D1528"; ctx.fill();
  ctx.strokeStyle=rankTint; ctx.lineWidth=2.5; ctx.stroke();
  try {
    const au=user.displayAvatarURL({size:128});
    if(au){const ai=await loadImage(au);ctx.save();ctx.beginPath();ctx.arc(avX,avY,avR-1,0,Math.PI*2);ctx.clip();ctx.drawImage(ai,avX-avR,avY-avR,avR*2,avR*2);ctx.restore();}
  } catch(e){}

  ctx.font=lblFont(13); ctx.fillStyle="#7C3AED"; ctx.fillText("[ SYSTEM ]", 104, bY+28);
  ctx.font=numFont(24); ctx.fillStyle="#F8FAFC"; ctx.textAlign="center";
  ctx.fillText("HUNTER INVENTORY", W/2, bY+46);
  ctx.font=lblFont(14); ctx.fillStyle="#4B5563"; ctx.textAlign="right";
  ctx.fillText(displayName + "  •  " + rankLabel + "  •  Lv." + hunter.level, W-44, bY+28);
  ctx.textAlign="left";

  // stats row under header
  const statItems=[
    {label:"ITEMS",  value: items.length,                           color:"#06B6D4"},
    {label:"GOLD",   value: Number(hunter.gold||0).toLocaleString(), color:"#FBBF24"},
    {label:"LEVEL",  value: hunter.level,                           color:"#3B82F6"},
    {label:"RANK",   value: rankLabel,                              color: rankTint},
  ];
  const statW=200, statH=40, statGap=18;
  const statTotalW=statItems.length*(statW+statGap)-statGap;
  const statX=(W-statTotalW)/2, statY=bY+bH+12;
  for(let i=0;i<statItems.length;i++){
    const s=statItems[i], sx=statX+i*(statW+statGap);
    roundedRect(ctx,sx,statY,statW,statH,10);
    const sg=ctx.createLinearGradient(sx,statY,sx,statY+statH);
    sg.addColorStop(0,"rgba(12,20,50,0.90)"); sg.addColorStop(1,"rgba(6,10,28,0.95)");
    ctx.fillStyle=sg; ctx.fill(); ctx.strokeStyle=s.color+"44"; ctx.lineWidth=1.5; ctx.stroke();
    roundedRect(ctx,sx+2,statY+2,statW-4,3,2); ctx.fillStyle=s.color; ctx.fill();
    ctx.font=lblFont(11); ctx.fillStyle="#4B5563"; ctx.fillText(s.label, sx+12, statY+18);
    ctx.font=numFont(14); ctx.fillStyle=s.color; ctx.fillText(String(s.value), sx+12, statY+36);
  }

  // ── INVENTORY GRID ────────────────────────────────────────────────
  const gridY  = statY + statH + 16;
  const COLS   = 5;
  const GAP    = 14;
  const TILE_W = (W - 56 - GAP*(COLS-1)) / COLS;
  const TILE_H = 120;
  const MAX_ITEMS = 20; // 4 rows × 5 cols

  if (!items.length) {
    // empty state
    const emY = gridY + 60;
    roundedRect(ctx,28,emY,W-56,180,20);
    const emBg=ctx.createLinearGradient(28,emY,28,emY+180);
    emBg.addColorStop(0,"rgba(12,18,46,0.92)"); emBg.addColorStop(1,"rgba(6,10,28,0.96)");
    ctx.fillStyle=emBg; ctx.fill(); ctx.strokeStyle="#1E3A5F"; ctx.lineWidth=1.5; ctx.stroke();
    ctx.font=numFont(28); ctx.fillStyle="#1E3A5F"; ctx.textAlign="center";
    ctx.fillText("INVENTORY IS EMPTY", W/2, emY+70);
    ctx.font=lblFont(18); ctx.fillStyle="#374151";
    ctx.fillText("Use /shop to purchase items and begin your collection.", W/2, emY+108);
    ctx.textAlign="left";
    return toBuffer(canvas);
  }

  const visibleItems = items.slice(0, MAX_ITEMS);

  for (let idx = 0; idx < visibleItems.length; idx++) {
    const token = visibleItems[idx];
    const info  = ITEM_CATALOG[token] || { display: token, category: "Item", rarity: "Common", color: "#94A3B8" };
    const rarColor = RARITY_COLORS[info.rarity] || "#94A3B8";

    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const tx  = 28 + col * (TILE_W + GAP);
    const ty  = gridY + row * (TILE_H + GAP);

    // card bg
    roundedRect(ctx, tx, ty, TILE_W, TILE_H, 16);
    const tbg = ctx.createLinearGradient(tx, ty, tx, ty + TILE_H);
    tbg.addColorStop(0, "rgba(10,18,46,0.97)");
    tbg.addColorStop(1, "rgba(5,9,26,0.99)");
    ctx.fillStyle = tbg; ctx.fill();
    ctx.strokeStyle = rarColor + "55"; ctx.lineWidth = 1.8; ctx.stroke();

    // top rarity stripe
    roundedRect(ctx, tx + 2, ty + 2, TILE_W - 4, 4, 3);
    ctx.fillStyle = rarColor; ctx.fill();

    // left accent bar
    roundedRect(ctx, tx, ty, 5, TILE_H, 4);
    ctx.fillStyle = info.color; ctx.fill();

    // top gloss
    roundedRect(ctx, tx + 6, ty + 6, TILE_W - 12, TILE_H * 0.30, 12);
    const tgl2 = ctx.createLinearGradient(tx, ty, tx, ty + TILE_H * 0.30);
    tgl2.addColorStop(0, "rgba(255,255,255,0.08)"); tgl2.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = tgl2; ctx.fill();

    // bottom accent
    roundedRect(ctx, tx + 8, ty + TILE_H - 5, TILE_W - 16, 4, 3);
    ctx.fillStyle = rarColor + "66"; ctx.fill();

    // slot number (top-right)
    ctx.font = lblFont(11); ctx.fillStyle = "#1E3A5F"; ctx.textAlign = "right";
    ctx.fillText("#" + (idx + 1), tx + TILE_W - 10, ty + 22);
    ctx.textAlign = "left";

    // rarity badge (top-left)
    ctx.font = lblFont(11); ctx.fillStyle = rarColor;
    ctx.fillText(info.rarity.toUpperCase(), tx + 12, ty + 22);

    // category
    ctx.font = lblFont(11); ctx.fillStyle = "#374151";
    ctx.fillText(info.category.toUpperCase(), tx + 12, ty + 38);

    // item name (big, clamped)
    const nameMaxW = TILE_W - 24;
    const nameSz = (() => {
      let sz = 18; ctx.font = numFont(sz);
      while (sz > 10 && ctx.measureText(info.display).width > nameMaxW) { sz -= 1; ctx.font = numFont(sz); }
      return sz;
    })();
    ctx.font = numFont(nameSz);
    ctx.save(); ctx.shadowColor = info.color; ctx.shadowBlur = 12;
    ctx.fillStyle = rarColor; ctx.fillText(info.display, tx + 12, ty + TILE_H - 28);
    ctx.restore();

    // count badge if more than MAX_ITEMS
    if (idx === MAX_ITEMS - 1 && items.length > MAX_ITEMS) {
      const remain = items.length - MAX_ITEMS;
      roundedRect(ctx, tx + TILE_W - 44, ty + TILE_H - 28, 38, 20, 8);
      ctx.fillStyle = "rgba(30,58,138,0.90)"; ctx.fill();
      ctx.font = numFont(11); ctx.fillStyle = "#60A5FA"; ctx.textAlign = "center";
      ctx.fillText("+" + remain, tx + TILE_W - 25, ty + TILE_H - 12);
      ctx.textAlign = "left";
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────────
  const fY = gridY + Math.ceil(Math.min(items.length, MAX_ITEMS) / COLS) * (TILE_H + GAP) + 8;
  if (fY < H - 40) {
    ctx.font = lblFont(13); ctx.fillStyle = "#1E3A5F"; ctx.textAlign = "center";
    ctx.fillText(
      "Showing " + Math.min(items.length, MAX_ITEMS) + " of " + items.length + " items  •  Use /shop to buy more",
      W / 2, fY + 20
    );
    ctx.textAlign = "left";
  }

  ctx.fillStyle = "rgba(100,116,139,0.25)"; ctx.font = lblFont(12); ctx.textAlign = "right";
  ctx.fillText("Solo Leveling RPG  •  Hunter Inventory", W - 36, H - 18);
  ctx.textAlign = "left";

  return toBuffer(canvas);
}

`;

const before = content.slice(0, startIdx);
const after  = content.slice(endIdx);
fs.writeFileSync(filePath, before + newFn + after, "utf8");
console.log("✅ generateInventoryCard patched!");