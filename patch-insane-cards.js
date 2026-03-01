const fs = require("fs");
const path = require("path");

let code = fs.readFileSync(path.join(__dirname, "src/services/cardGenerator.js"), "utf8");

const advancedHelpers = `
function drawNeoUIBacking(ctx, x, y, w, h, color) {
  ctx.save();
  // Deep Shadow
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 20;
  roundedRect(ctx, x, y, w, h, 20);
  ctx.fillStyle = "#02040a";
  ctx.fill();
  ctx.restore();

  // Glass Layer
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "rgba(255,255,255,0.05)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.01)");
  grad.addColorStop(1, "rgba(255,255,255,0.03)");
  roundedRect(ctx, x, y, w, h, 20);
  ctx.fillStyle = grad;
  ctx.fill();
  
  // High-Tech border
  ctx.strokeStyle = color + "88";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Inner glow rim
  ctx.strokeStyle = color + "22";
  ctx.lineWidth = 10;
  roundedRect(ctx, x+5, y+5, w-10, h-10, 15);
  ctx.stroke();
  ctx.restore();
}

function drawHUDBrackets(ctx, x, y, w, h, color, size = 30) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "square";
  
  // Top Left
  ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y); ctx.stroke();
  // Top Right
  ctx.beginPath(); ctx.moveTo(x + w - size, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + size); ctx.stroke();
  // Bottom Left
  ctx.beginPath(); ctx.moveTo(x, y + h - size); ctx.lineTo(x, y + h); ctx.lineTo(x + size, y + h); ctx.stroke();
  // Bottom Right
  ctx.beginPath(); ctx.moveTo(x + w - size, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - size); ctx.stroke();
  
  ctx.restore();
}

function drawTechCircles(ctx, x, y, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 1.2, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
`;

if (!code.includes("drawNeoUIBacking")) {
  const lastConst = code.indexOf("const FONT_CANDIDATES");
  code = code.slice(0, lastConst) + advancedHelpers + "\n" + code.slice(lastConst);
}

function replaceBlock(funcName, newBody) {
  let start = code.indexOf("async function " + funcName);
  if (start === -1) return;
  
  let nextFunc = code.indexOf("\nasync function ", start + 20);
  if (nextFunc === -1) nextFunc = code.indexOf("\nfunction ", start + 20);
  if (nextFunc === -1) nextFunc = code.indexOf("\nmodule.exports");
  if (nextFunc === -1) nextFunc = code.length;

  code = code.slice(0, start) + newBody + "\n" + code.slice(nextFunc);
}

const huntBody = `async function generateHuntResultCard(user, result, levelsGained) {
  const W = 1440;
  const H = 810;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  // Cinematic Background
  ctx.fillStyle = "#000000"; ctx.fillRect(0,0,W,H);
  try {
    const bg = await loadImage(MAIN_BACKGROUND_PATH);
    ctx.globalAlpha = 0.3;
    ctx.drawImage(bg, 0, 0, W, H);
    ctx.globalAlpha = 1.0;
  } catch (e) {}

  const grad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W);
  grad.addColorStop(0, "rgba(239, 68, 68, 0.15)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.95)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

  drawDigitalGrid(ctx, W, H, "#EF4444");
  drawHUDBrackets(ctx, 40, 40, W-80, H-80, "#EF4444", 60);

  // Header
  ctx.textAlign = "left";
  ctx.fillStyle = "#EF4444";
  ctx.font = "900 24px Orbitron";
  ctx.shadowColor = "#EF4444"; ctx.shadowBlur = 15;
  ctx.fillText("[ SYSTEM OVERRIDE ] STATUS: TARGET ELIMINATED", 80, 100);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 80px Orbitron";
  ctx.fillText("MONSTER SLAIN", 80, 180);

  // Main Display
  drawNeoUIBacking(ctx, 80, 220, W-160, 500, "#EF4444");
  
  // Telemetry Decoration
  ctx.font = "700 14px Rajdhani"; ctx.fillStyle = "#475569";
  for(let i=0; i<8; i++) {
    ctx.fillText("DATA_" + Math.random().toString(16).slice(2,8).toUpperCase(), 110, 260 + i*60);
    ctx.fillText("VAL_" + (Math.random()*100).toFixed(2), W-200, 260 + i*60);
  }

  // Large Reward Circle for Gold
  const cx1 = 450, cy = 460, r = 160;
  drawTechCircles(ctx, cx1, cy, r, "#FBBF24");
  ctx.textAlign = "center";
  ctx.fillStyle = "#FBBF24";
  ctx.font = "900 70px Orbitron";
  ctx.shadowColor = "#FBBF24"; ctx.shadowBlur = 20;
  ctx.fillText("+" + (result.gold || 0), cx1, cy + 20);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFF"; ctx.font = "700 24px Rajdhani";
  ctx.fillText("GOLD ACQUIRED", cx1, cy + 60);

  // Large Reward Circle for XP
  const cx2 = 990;
  drawTechCircles(ctx, cx2, cy, r, "#3B82F6");
  ctx.fillStyle = "#3B82F6";
  ctx.font = "900 70px Orbitron";
  ctx.shadowColor = "#3B82F6"; ctx.shadowBlur = 20;
  ctx.fillText("+" + (result.xp || 0), cx2, cy + 20);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFF"; ctx.font = "700 24px Rajdhani";
  ctx.fillText("EXP VESTED", cx2, cy + 60);

  // Level Up Alert
  if (levelsGained > 0) {
    ctx.save();
    ctx.translate(W/2, 220);
    ctx.rotate(-0.02);
    drawEpic3DBox(ctx, -200, -40, 400, 80, "#10B981");
    ctx.fillStyle = "#FFF"; ctx.font = "900 40px Orbitron"; ctx.textAlign = "center";
    ctx.shadowColor = "#10B981"; ctx.shadowBlur = 20;
    ctx.fillText("LEVEL UP", 0, 15);
    ctx.restore();
  }

  // Footer Tag
  ctx.textAlign = "center";
  ctx.fillStyle = "#1E293B"; ctx.font = "700 16px Rajdhani";
  ctx.fillText("OPERATOR: " + (user.username||"UNKNOWN").toUpperCase() + " | SESSION_ID: " + Date.now().toString(36).toUpperCase(), W/2, H-60);

  return await canvas.toBuffer("png");
}`;

const salaryBody = `async function generateSalaryCard(user, goldGained, totalGold) {
  const W = 1200;
  const H = 600;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  // Deep Premium Gradient
  ctx.fillStyle = "#050505"; ctx.fillRect(0,0,W,H);
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0, "#1c1405");
  grad.addColorStop(0.5, "#0a0a0a");
  grad.addColorStop(1, "#1c1405");
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

  drawDigitalGrid(ctx, W, H, "#FBBF24");
  drawHUDBrackets(ctx, 30, 30, W-60, H-60, "#FBBF24", 50);

  // Gilded Header
  ctx.textAlign = "center";
  ctx.fillStyle = "#FBBF24";
  ctx.font = "700 20px Rajdhani";
  ctx.fillText("— MONARCH'S TREASURY DISPERSEMENT —", W/2, 80);
  
  ctx.font = "900 60px Orbitron";
  ctx.shadowColor = "#FBBF24"; ctx.shadowBlur = 25;
  ctx.fillText("GUILD SALARY", W/2, 160);
  ctx.shadowBlur = 0;

  // Transaction Display
  drawNeoUIBacking(ctx, 100, 200, 1000, 320, "#FBBF24");
  
  // Center Piece
  ctx.fillStyle = "rgba(251, 191, 36, 0.05)";
  ctx.beginPath(); ctx.arc(W/2, 360, 120, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 100px Orbitron";
  ctx.shadowColor = "#10B981"; ctx.shadowBlur = 20;
  ctx.fillText("+" + goldGained.toLocaleString(), W/2, 400);
  ctx.shadowBlur = 0;
  
  ctx.font = "700 28px Rajdhani"; ctx.fillStyle = "#10B981";
  ctx.fillText("GOLD CREDITS ADDED", W/2, 440);

  // Side Details
  ctx.textAlign = "left";
  ctx.font = "700 18px Rajdhani"; ctx.fillStyle = "#94A3B8";
  ctx.fillText("RECIPIENT", 140, 260);
  ctx.fillStyle = "#FFF"; ctx.font = "900 24px Orbitron";
  ctx.fillText((user.username||"HUNTER").toUpperCase(), 140, 290);

  ctx.textAlign = "right";
  ctx.fillStyle = "#94A3B8"; ctx.font = "700 18px Rajdhani";
  ctx.fillText("TOTAL BALANCE", W-140, 260);
  ctx.fillStyle = "#FBBF24"; ctx.font = "900 24px Orbitron";
  ctx.fillText(totalGold.toLocaleString() + " G", W-140, 290);

  // Authenticity Stamp
  ctx.strokeStyle = "rgba(251, 191, 36, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, 480); ctx.lineTo(1100, 480); ctx.stroke();

  return await canvas.toBuffer("png");
}`;

const gateBody = `async function generateGateCard(user, difficultyText, results, isSuccess) {
  const W = 1300;
  const H = 750;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  const color = isSuccess ? "#10B981" : "#EF4444";
  
  // Atmospheric Background
  ctx.fillStyle = "#020202"; ctx.fillRect(0,0,W,H);
  const grad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W);
  grad.addColorStop(0, color + "33");
  grad.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

  drawDigitalGrid(ctx, W, H, color);
  drawHUDBrackets(ctx, 40, 40, W-80, H-80, color, 80);

  // Dynamic Title
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.font = "900 20px Orbitron";
  ctx.fillText("[ SYSTEM REPORT ]", W/2, 100);
  
  ctx.shadowColor = color; ctx.shadowBlur = 30;
  ctx.font = "900 90px Orbitron";
  ctx.fillText(isSuccess ? "GATE CLEARED" : "GATE COMPROMISED", W/2, 200);
  ctx.shadowBlur = 0;

  // Main Display
  drawNeoUIBacking(ctx, 100, 260, 1100, 400, color);

  // Difficulty Badge
  drawEpic3DBox(ctx, W/2 - 150, 230, 300, 60, color);
  ctx.fillStyle = "#FFF"; ctx.font = "900 28px Orbitron";
  ctx.fillText(difficultyText.toUpperCase(), W/2, 272);

  if (isSuccess) {
    // Rewards Flow
    const rx = W/2;
    ctx.textAlign = "center";
    ctx.font = "700 24px Rajdhani"; ctx.fillStyle = "#94A3B8";
    ctx.fillText("ANALYSIS: MISSION OBJECTIVES MET. LOOT DISTRIBUTION ENHANCED.", rx, 350);

    // Gold Block
    drawNeoUIBacking(ctx, 180, 400, 440, 200, "#FBBF24");
    ctx.fillStyle = "#FBBF24"; ctx.font = "900 80px Orbitron";
    ctx.fillText("+" + (results.gold || 0), 400, 520);
    ctx.font = "700 22px Rajdhani"; ctx.fillStyle = "#FFF";
    ctx.fillText("GOLD RECOVERED", 400, 560);

    // XP Block
    drawNeoUIBacking(ctx, 680, 400, 440, 200, "#3B82F6");
    ctx.fillStyle = "#3B82F6"; ctx.font = "900 80px Orbitron";
    ctx.fillText("+" + (results.xp || 0), 900, 520);
    ctx.font = "700 22px Rajdhani"; ctx.fillStyle = "#FFF";
    ctx.fillText("XP SYNCED", 900, 560);
  } else {
    // Failure UI
    ctx.textAlign = "center";
    ctx.font = "900 50px Orbitron"; ctx.fillStyle = "#EF4444";
    ctx.shadowColor = "#EF4444"; ctx.shadowBlur = 20;
    ctx.fillText("PENALTY APPLIED", W/2, 420);
    ctx.shadowBlur = 0;
    
    drawNeoUIBacking(ctx, W/2 - 300, 460, 600, 140, "#EF4444");
    ctx.fillStyle = "#FFF"; ctx.font = "900 70px Orbitron";
    ctx.fillText("-" + (results.penalty || 0) + " G", W/2, 555);
    
    ctx.font = "700 20px Rajdhani"; ctx.fillStyle = "#475569";
    ctx.fillText("CRITICAL FAILURE: THE DUNGEON WAS NOT CLOSED IN TIME.", W/2, 640);
  }

  // Scanning Line effect (decorative)
  ctx.strokeStyle = color + "22"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, H/2 + Math.sin(Date.now()/500)*100); ctx.lineTo(W-40, H/2 + Math.sin(Date.now()/500)*100); ctx.stroke();

  return await canvas.toBuffer("png");
}`;

replaceBlock("generateHuntResultCard", huntBody);
replaceBlock("generateSalaryCard", salaryBody);
replaceBlock("generateGateCard", gateBody);

fs.writeFileSync(path.join(__dirname, "src/services/cardGenerator.js"), code, "utf8");
console.log("INSANE PREMIUM UI OVERHAUL COMPLETE!");