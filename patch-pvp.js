const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "services", "cardGenerator.js");
let content = fs.readFileSync(filePath, "utf8");

const startMarker = "async function generateBattleResultCard(attacker, defender, result) {";
const endMarker = "async function generateRankupCard(";
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  console.error("Battle markers not found");
  process.exit(1);
}

const newFn = `async function generateBattleResultCard(attacker, defender, result) {
  const attackerName = formatDisplayName(attacker.username);
  const defenderName = formatDisplayName(defender.username);
  const W = 1440;
  const H = 820;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  const FONT_NUM = "Orbitron";
  const FONT_LBL = "Rajdhani";
  const FONT_FB = "Inter";
  function numFont(sz) { return "900 " + sz + "px " + FONT_NUM + ", " + FONT_FB; }
  function lblFont(sz) { return "700 " + sz + "px " + FONT_LBL + ", " + FONT_FB; }

  // ── BACKGROUND 
  await drawMainBackground(ctx, W, H);
  const clrAtt = "#3B82F6";  // Blue for attacker
  const clrDef = "#EF4444";  // Red for defender

  // Split diagonal background: Blue left/top, Red right/bottom
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(0, H); ctx.closePath();
  const grdAtt = ctx.createLinearGradient(0, 0, W/2, H/2);
  grdAtt.addColorStop(0, "rgba(10, 20, 50, 0.95)"); grdAtt.addColorStop(1, "rgba(5, 10, 25, 0.95)");
  ctx.fillStyle = grdAtt; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  const grdDef = ctx.createLinearGradient(W, H, W/2, H/2);
  grdDef.addColorStop(0, "rgba(50, 10, 15, 0.95)"); grdDef.addColorStop(1, "rgba(25, 5, 8, 0.95)");
  ctx.fillStyle = grdDef; ctx.fill();
  ctx.restore();

  // Dark wash over center
  const centerWash = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W/2);
  centerWash.addColorStop(0, "rgba(0,0,0,0.4)");
  centerWash.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = centerWash; ctx.fillRect(0, 0, W, H);

  // ── Lightning in the middle line
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#FFFFFF"; ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(W - 100, 0);
  // draw jagged line down to (100, H)
  let cx = W - 100, cy = 0;
  while(cy < H) {
    cy += randomInt(30, 80);
    cx -= randomInt(30, 80) * (W/H);
    ctx.lineTo(cx + randomInt(-40, 40), cy);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(167, 139, 250, 0.4)";
  ctx.lineWidth = 8; ctx.stroke();
  ctx.restore();

  // ── CENTER "VS" Badge
  const vsR = 80;
  ctx.save();
  ctx.shadowColor = "#F59E0B"; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(W/2, H/2 - 60, vsR, 0, Math.PI*2);
  ctx.fillStyle = "#1E293B"; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = "#F59E0B"; ctx.stroke();
  ctx.fillStyle = "#F59E0B";
  ctx.font = numFont(64); ctx.textAlign = "center";
  ctx.fillText("VS", W/2, H/2 - 40);
  ctx.restore();
  ctx.textAlign = "left";

  // ── PLAYER CARDS function
  function drawFighter(isAttacker, x, y) {
    const isWin = isAttacker ? result.attackerWon : !result.attackerWon;
    const clr = isAttacker ? clrAtt : clrDef;
    const name = isAttacker ? attackerName : defenderName;
    const power = isAttacker ? result.attScore : result.defScore;
    const hp = isAttacker ? result.attackerHp : result.defenderHp;
    const maxHp = isAttacker ? result.attackerMaxHp : result.defenderMaxHp;
    const rew = isAttacker ? result.rewards?.attacker : result.rewards?.defender;

    const fw = 440;
    const fh = 260;

    // Outer glow if win
    if (isWin) {
      ctx.save();
      ctx.shadowColor = clr; ctx.shadowBlur = 40;
      roundedRect(ctx, x, y, fw, fh, 16); ctx.fillStyle = clr; ctx.fill();
      ctx.restore();
    }

    roundedRect(ctx, x, y, fw, fh, 16);
    ctx.fillStyle = "rgba(10, 15, 30, 0.85)"; ctx.fill();
    ctx.lineWidth = isWin ? 5 : 2; ctx.strokeStyle = isWin ? clr : "#334155"; ctx.stroke();

    // Inner top accent
    roundedRect(ctx, x, y, fw, 60, 16);
    ctx.fillStyle = clr + "33"; ctx.fill();
    ctx.fillStyle = clr; ctx.font = numFont(24);
    ctx.textAlign = "center";
    ctx.fillText(isAttacker ? "ATTACKER" : "DEFENDER", x + fw/2, y + 40);

    // WIN/LOSE Stamp
    ctx.save();
    ctx.translate(x + fw/2, y + fh/2);
    ctx.rotate((isAttacker ? -15 : 15) * Math.PI / 180);
    ctx.textAlign = "center";
    ctx.font = numFont(60);
    ctx.fillStyle = isWin ? clr+"22" : "rgba(255,255,255,0.05)";
    ctx.fillText(isWin ? "VICTORY" : "DEFEAT", 0, 0);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#F8FAFC";
    const nSz = fitFontSize(ctx, name, 45, 24, fw - 40);
    ctx.font = \`900 \${nSz}px \${FONT_NUM}\`;
    ctx.fillText(ellipsizeText(ctx, name, fw - 40), x + fw/2, y + 105);

    ctx.fillStyle = "#94A3B8"; ctx.font = lblFont(20);
    ctx.fillText("COMBAT POWER", x + fw/2, y + 145);
    ctx.fillStyle = clr; ctx.font = numFont(32);
    ctx.fillText(power.toLocaleString(), x + fw/2, y + 175);

    // HP Bar
    const barW = fw - 60;
    const barX = x + 30;
    const barY = y + 195;
    roundedRect(ctx, barX, barY, barW, 14, 7);
    ctx.fillStyle = "#1E293B"; ctx.fill();
    const hpPct = Math.max(0, Math.min(1, hp / maxHp));
    if (hpPct > 0) {
      roundedRect(ctx, barX, barY, barW * hpPct, 14, 7);
      ctx.fillStyle = isWin ? "#10B981" : "#EF4444"; ctx.fill();
    }
    ctx.fillStyle = "#E2E8F0"; ctx.font = lblFont(14);
    ctx.fillText(\`HP: \${hp} / \${maxHp}\`, x + fw/2, barY + 30);
    ctx.textAlign = "left";
  }

  // Draw fighters
  drawFighter(true, 80, 180);
  drawFighter(false, W - 440 - 80, 180);

  // ── COMBAT LOG (Bottom Center)
  const lw = 900;
  const lh = 220;
  const lx = W/2 - lw/2;
  const ly = H - lh - 40;

  roundedRect(ctx, lx, ly, lw, lh, 16);
  ctx.fillStyle = "rgba(10, 12, 25, 0.85)"; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = "#475569"; ctx.stroke();

  ctx.fillStyle = "#94A3B8"; ctx.font = numFont(24);
  ctx.textAlign = "center";
  ctx.fillText("COMBAT LOG", W/2, ly + 40);

  const logs = Array.isArray(result.combatLog) && result.combatLog.length ? result.combatLog : ["No combat log available."];
  ctx.textAlign = "left";
  ctx.font = lblFont(18);
  
  // Draw logs
  const startY = ly + 75;
  const lineHeight = 28;
  for (let i = 0; i < Math.min(5, logs.length); i++) {
    let text = logs[i];
    
    // Highlight A->D or D->A
    ctx.fillStyle = "#64748B"; // default gray
    if (text.includes("A->D")) ctx.fillStyle = clrAtt;
    if (text.includes("D->A")) ctx.fillStyle = clrDef;
    if (text.includes("[CRIT]")) ctx.fillStyle = "#F59E0B";

    ctx.fillText(ellipsizeText(ctx, text, lw - 60), lx + 30, startY + i * lineHeight);
  }

  // Draw overall battle result on bottom log right
  ctx.textAlign = "right";
  ctx.fillStyle = "#E2E8F0"; ctx.font = lblFont(20);
  ctx.fillText(\`Length: \${result.rounds || 0} Rounds\`, lx + lw - 30, ly + 80);
  ctx.fillStyle = "#A78BFA";
  ctx.fillText(\`Win Probability: \${result.winChance.toFixed(1)}%\`, lx + lw - 30, ly + 110);
  ctx.textAlign = "left";

  return toBuffer(canvas);
}
`;

const before = content.slice(0, startIdx);
const after = content.slice(endIdx);
fs.writeFileSync(filePath, before + newFn + after, "utf8");
console.log("✅ PvP Card patched!");