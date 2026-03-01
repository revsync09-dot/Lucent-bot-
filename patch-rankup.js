const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "services", "cardGenerator.js");
let content = fs.readFileSync(filePath, "utf8");

const startMarker = "async function generateRankupCard(user, newRank, previousRank) {";
const endMarker = "async function generateSalaryCard(";
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const newFn = `async function generateRankupCard(user, newRank, previousRank) {
  const displayName = formatDisplayName(user.username);
  const W = 1300;
  const H = 700;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  await drawMainBackground(ctx, W, H);

  // ── Fonts
  const FONT_NUM = "Orbitron";
  const FONT_LBL = "Rajdhani";
  const FONT_FB = "Inter";
  function numFont(sz) { return "900 " + sz + "px " + FONT_NUM + ", " + FONT_FB; }
  function lblFont(sz) { return "700 " + sz + "px " + FONT_LBL + ", " + FONT_FB; }

  // ── Dark Vibe Gradient 
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, "rgba(2, 4, 18, 0.95)");
  wash.addColorStop(0.5, "rgba(8, 12, 32, 0.85)");
  wash.addColorStop(1, "rgba(2, 4, 18, 0.95)");
  ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);

  // ── Rank Colors
  const nrColor = rankColor(newRank);
  const prColor = rankColor(previousRank);

  // ── Glow behind everything
  const cx = W / 2;
  const cy = H / 2;
  const glow = ctx.createRadialGradient(cx, cy, 50, cx, cy, 450);
  glow.addColorStop(0, nrColor + "66");
  glow.addColorStop(0.5, nrColor + "22");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Aura Rings
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 180 + i * 25, 0, Math.PI * 2);
    ctx.strokeStyle = nrColor;
    ctx.globalAlpha = 0.8 - i * 0.25;
    ctx.lineWidth = 3 - i * 0.5;
    ctx.setLineDash([20 + i * 10, 15 + i * 5]);
    ctx.stroke();
  }
  ctx.restore();

  // ── Text: "SYSTEM MESSAGE"
  ctx.fillStyle = "#A78BFA";
  ctx.font = lblFont(24);
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText("[ SYSTEM NOTIFICATION ]", cx, 80);
  ctx.letterSpacing = "0px";

  // ── Main Titles
  ctx.fillStyle = "#F8FAFC";
  ctx.font = numFont(64);
  ctx.fillText("RANK UP SUCCESSFUL", cx, 150);

  ctx.fillStyle = "#94A3B8";
  ctx.font = lblFont(28);
  ctx.fillText("Hunter " + displayName + " has awakened new powers.", cx, 190);

  // ── Middle Boxes (Previous -> Arrow -> New)
  const boxW = 280;
  const boxH = 140;
  const boxY = 320;

  // Box 1: Previous
  const pX = cx - boxW - 100;
  roundedRect(ctx, pX - boxW/2, boxY - boxH/2, boxW, boxH, 16);
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)"; ctx.fill();
  ctx.strokeStyle = prColor + "88"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#64748B"; ctx.font = lblFont(20); ctx.fillText("PREVIOUS RANK", pX, boxY - 30);
  ctx.fillStyle = prColor; ctx.font = numFont(48); ctx.fillText(previousRank, pX, boxY + 30);

  // Box 2: New
  const nX = cx + boxW + 100;
  ctx.save();
  ctx.shadowColor = nrColor; ctx.shadowBlur = 30;
  roundedRect(ctx, nX - boxW/2, boxY - boxH/2, boxW, boxH, 16);
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)"; ctx.fill();
  ctx.strokeStyle = nrColor; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
  ctx.fillStyle = nrColor; ctx.font = lblFont(20); ctx.fillText("NEW RANK", nX, boxY - 30);
  
  ctx.save();
  ctx.shadowColor = nrColor; ctx.shadowBlur = 15;
  ctx.fillStyle = "#ffffff"; ctx.font = numFont(48); ctx.fillText(newRank, nX, boxY + 30);
  ctx.restore();

  // Draw Arrow
  ctx.fillStyle = "#94A3B8";
  ctx.font = numFont(72);
  ctx.fillText("»", cx, boxY + 20);

  // ── Stats Box Bottom
  const sbW = 600;
  const sbH = 90;
  const sbY = H - 140;
  roundedRect(ctx, cx - sbW/2, sbY, sbW, sbH, 14);
  const sbg = ctx.createLinearGradient(0, sbY, 0, sbY + sbH);
  sbg.addColorStop(0, "rgba(30, 41, 59, 0.6)");
  sbg.addColorStop(1, "rgba(2, 6, 23, 0.8)");
  ctx.fillStyle = sbg; ctx.fill();
  ctx.strokeStyle = nrColor + "66"; ctx.lineWidth = 2; ctx.stroke();
  
  ctx.fillStyle = "#E2E8F0"; ctx.font = lblFont(22);
  ctx.fillText("Level Cap Increased. New Dungeons unlocked.", cx, sbY + 40);
  ctx.fillStyle = nrColor; ctx.font = lblFont(18);
  ctx.fillText("Your body has adapted to the greater mana flow.", cx, sbY + 68);

  ctx.fillStyle = "#4B5563"; ctx.font = lblFont(14); ctx.textAlign = "right";
  ctx.fillText("Solo Leveling System  •  v2.0 UI", W - 20, H - 20);

  return toBuffer(canvas);
}
`;

const before = content.slice(0, startIdx);
const after = content.slice(endIdx);
fs.writeFileSync(filePath, before + newFn + after, "utf8");
console.log("✅ Rankup patched!");