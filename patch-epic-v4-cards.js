const fs = require("fs");
const path = require("path");

let code = fs.readFileSync(path.join(__dirname, "src/services/cardGenerator.js"), "utf8");

// Helper: Ensure utility functions exist
const utilityFns = `
function drawDigitalGrid(ctx, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.1;
  for (let x = 0; x < w; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
}

function drawSystemHeader(ctx, w, title, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "900 24px Orbitron";
  ctx.fillText("[ SYSTEM ALERT ]", 50, 60);
  
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 50px Orbitron";
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillText(title, 50, 120);
  ctx.restore();
}
`;

if (!code.includes("drawDigitalGrid")) {
  const lastConst = code.indexOf("const FONT_CANDIDATES");
  code = code.slice(0, lastConst) + utilityFns + "\n" + code.slice(lastConst);
}

function safeReplace(funcName, newCode) {
  let start = code.indexOf("async function " + funcName + "(");
  if (start === -1) start = code.indexOf("async function " + funcName + " (");
  if (start === -1) start = code.indexOf("async function " + funcName);
  
  if (start === -1) {
    console.log("Missing " + funcName);
    return;
  }
  
  let nextFunc = code.indexOf("\nasync function ", start + 20);
  if (nextFunc === -1) nextFunc = code.indexOf("\nfunction ", start + 20);
  if (nextFunc === -1) nextFunc = code.indexOf("\nmodule.exports");

  if (nextFunc === -1) return;

  code = code.slice(0, start) + newCode + "\n" + code.slice(nextFunc);
  console.log("Replaced " + funcName);
}

const huntCard = `async function generateHuntResultCard(user, result, levelsGained) {
  const W = 1200;
  const H = 600;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  try {
    const bg = await loadImage(MAIN_BACKGROUND_PATH);
    ctx.drawImage(bg, 0, 0, W, H);
  } catch (e) {}
  
  const grad = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, W);
  grad.addColorStop(0, "rgba(10, 0, 0, 0.6)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  
  drawDigitalGrid(ctx, W, H, "#EF4444");
  drawSystemHeader(ctx, W, "MONSTER SLAIN", "#EF4444");

  // Center Info Panel
  drawEpic3DBox(ctx, W/2 - 500, 180, 1000, 350, "#EF4444");
  
  // Victim text
  ctx.fillStyle = "#94A3B8";
  ctx.font = "700 24px Rajdhani";
  ctx.textAlign = "center";
  const nameToUse = user.username || user.displayName || "Unknown";
  ctx.fillText("ELIMINATED BY HUNTER: " + nameToUse.toUpperCase(), W/2, 230);

  // Rewards layout
  const rewW = 400, rewH = 180;
  // Gold Box
  drawEpic3DBox(ctx, W/2 - 420, 270, rewW, rewH, "#FBBF24");
  ctx.fillStyle = "#FBBF24";
  ctx.font = "900 60px Orbitron";
  ctx.shadowColor = "#FBBF24"; ctx.shadowBlur = 15;
  ctx.fillText("+" + (result.gold || 0), W/2 - 220, 360);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 20px Rajdhani";
  ctx.fillText("GOLD CREDITED", W/2 - 220, 400);

  // XP Box
  drawEpic3DBox(ctx, W/2 + 20, 270, rewW, rewH, "#3B82F6");
  ctx.fillStyle = "#3B82F6";
  ctx.font = "900 60px Orbitron";
  ctx.shadowColor = "#3B82F6"; ctx.shadowBlur = 15;
  ctx.fillText("+" + (result.xp || 0), W/2 + 220, 360);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 20px Rajdhani";
  ctx.fillText("EXPERIENCE GAINED", W/2 + 220, 400);

  if (levelsGained > 0) {
    drawEpic3DBox(ctx, W/2 - 150, 140, 300, 60, "#10B981");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 26px Orbitron";
    ctx.fillText("LEVEL UP", W/2, 182);
  }

  return await canvas.toBuffer("png");
}`;

const salaryCard = `async function generateSalaryCard(user, goldGained, totalGold) {
  const W = 1000;
  const H = 500;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  // Luxury Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1a1a1a");
  grad.addColorStop(0.5, "#2d2007");
  grad.addColorStop(1, "#1a1a1a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  drawDigitalGrid(ctx, W, H, "#F59E0B");
  drawSystemHeader(ctx, W, "PAYROLL DEPOSIT", "#F59E0B");

  // Main UI Panel
  drawEpic3DBox(ctx, 50, 160, 900, 280, "#F59E0B");
  
  ctx.textAlign = "left";
  ctx.fillStyle = "#94A3B8";
  ctx.font = "700 24px Rajdhani";
  ctx.fillText("TRANSACTION TYPE: GUILD WEEKLY SALARY", 100, 220);
  ctx.fillText("RECIPIENT: " + (user.username || "HUNTER").toUpperCase(), 100, 255);

  // Big Amount Panel
  drawEpic3DBox(ctx, 100, 300, 800, 100, "rgba(16, 185, 129, 0.6)");
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 55px Orbitron";
  ctx.shadowColor = "#10B981"; ctx.shadowBlur = 15;
  ctx.fillText("AMOUNT: +" + goldGained.toLocaleString() + " G", 140, 370);
  ctx.shadowBlur = 0;

  ctx.textAlign = "right";
  ctx.fillStyle = "#64748B";
  ctx.font = "700 22px Rajdhani";
  ctx.fillText("UPDATED BALANCE: " + totalGold.toLocaleString() + " G", 880, 425);

  return await canvas.toBuffer("png");
}`;

const gateCard = `async function generateGateCard(user, difficultyText, results, isSuccess) {
  const W = 1100;
  const H = 600;
  const canvas = new Canvas(W, H);
  const ctx = canvas.getContext("2d");

  const themeColor = isSuccess ? "#10B981" : "#EF4444";
  
  // Dynamic Background
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W);
  grad.addColorStop(0, themeColor + "22");
  grad.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  drawDigitalGrid(ctx, W, H, themeColor);
  drawSystemHeader(ctx, W, isSuccess ? "GATE CLEARANCE" : "MISSION FAILED", themeColor);

  // Status Badge
  drawEpic3DBox(ctx, W - 350, 50, 300, 80, themeColor);
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 30px Orbitron";
  ctx.fillText(difficultyText.toUpperCase(), W - 200, 102);

  // Center Result Box
  drawEpic3DBox(ctx, 100, 200, 900, 330, themeColor);
  
  if (isSuccess) {
    ctx.fillStyle = "#94A3B8";
    ctx.font = "700 26px Rajdhani";
    ctx.fillText("THE GATE HAS BEEN STABILIZED. REWARDS ISSUED.", W/2, 260);

    // Reward Tiles
    const boxW = 400, boxY = 300, boxH = 150;
    drawEpic3DBox(ctx, 130, boxY, boxW, boxH, "#FBBF24");
    ctx.fillStyle = "#FBBF24";
    ctx.font = "900 50px Orbitron";
    ctx.fillText("+" + (results.gold || 0), 330, 385);
    ctx.fillStyle = "#FFF"; ctx.font = "700 20px Rajdhani"; ctx.fillText("GOLD REWARD", 330, 420);

    drawEpic3DBox(ctx, 570, boxY, boxW, boxH, "#3B82F6");
    ctx.fillStyle = "#3B82F6";
    ctx.font = "900 50px Orbitron";
    ctx.fillText("+" + (results.xp || 0), 770, 385);
    ctx.fillStyle = "#FFF"; ctx.font = "700 20px Rajdhani"; ctx.fillText("EXP REWARD", 770, 420);
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 45px Orbitron";
    ctx.shadowColor = "#EF4444"; ctx.shadowBlur = 20;
    ctx.fillText("SYSTEM PENALTY IMPOSED", W/2, 320);
    ctx.shadowBlur = 0;
    
    drawEpic3DBox(ctx, W/2 - 250, 360, 500, 100, "#EF4444");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 40px Orbitron";
    ctx.fillText("-" + (results.penalty || 0) + " GOLD", W/2, 425);
    
    ctx.fillStyle = "#94A3B8";
    ctx.font = "700 22px Rajdhani";
    ctx.fillText("YOU FAILED TO CLEAR THE GATE IN TIME.", W/2, 500);
  }

  return await canvas.toBuffer("png");
}`;

safeReplace("generateHuntResultCard", huntCard);
safeReplace("generateSalaryCard", salaryCard);
safeReplace("generateGateCard", gateCard);

fs.writeFileSync(path.join(__dirname, "src/services/cardGenerator.js"), code, "utf8");
console.log("FINAL PREMIUM UPGRADE COMPLETE!");