const fs = require("fs");
const path = require("path");

let code = fs.readFileSync(path.join(__dirname, "src/services/cardGenerator.js"), "utf8");

function replaceFunction(funcName, newCode) {
  const startText = "async function " + funcName + " (";
  let idx = code.indexOf("async function " + funcName + "(");
  if (idx === -1) idx = code.indexOf("async function " + funcName + " (");
  if (idx === -1) idx = code.indexOf("async function " + funcName);

  if (idx === -1) {
    console.log("Could not find " + funcName);
    return;
  }
  
  let nextFuncIdx = code.indexOf("\nasync function ", idx + 20);
  if (nextFuncIdx === -1) nextFuncIdx = code.indexOf("\nfunction ", idx + 20);
  const endIdx = nextFuncIdx !== -1 ? nextFuncIdx : code.indexOf("\nmodule.exports");
  
  if (endIdx === -1) {
     console.log("Could not find end of " + funcName);
     return;
  }
  
  const before = code.slice(0, idx);
  const after = code.slice(endIdx);
  code = before + newCode + "\n" + after;
  console.log("Replaced " + funcName);
}

// 1. 3D GLOW HELPER to make it look like a POPUP Window

const helper3D = `
// Helper: Draw an epic 3D System Box with deep neon glows
function drawEpic3DBox(ctx, x, y, w, h, baseColor, glowColor = null) {
  if (!glowColor) glowColor = baseColor;
  
  // Outer blurred shadow to simulate space depth
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 15;
  roundedRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = "rgba(4, 8, 20, 0.9)";
  ctx.fill();
  ctx.restore();

  // Dark background
  ctx.save();
  roundedRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = "rgba(10, 15, 30, 0.95)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = baseColor;
  ctx.stroke();
  ctx.restore();
  
  // Highlight overlay (3D glass effect)
  ctx.save();
  roundedRect(ctx, x + 2, y + 2, w - 4, h/2 - 2, 14);
  const grad = ctx.createLinearGradient(x, y, x, y + h/2);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.1)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}
`;

importHelperIfMissing(helper3D);

function importHelperIfMissing(helperStr) {
  if (!code.includes("drawEpic3DBox")) {
     const lastConst = code.indexOf("const FONT_CANDIDATES");
     code = code.slice(0, lastConst) + helperStr + "\n" + code.slice(lastConst);
  }
}

const newProfile = `async function generateProfileCard(user, hunter) {
  const width = 1200;
  const height = 750;
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  try {
    const bg = await loadImage(MAIN_BACKGROUND_PATH);
    ctx.drawImage(bg, 0, 0, width, height);
  } catch (e) {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);
  }
  
  const gradBG = ctx.createRadialGradient(width/2, height/2, height/4, width/2, height/2, width);
  gradBG.addColorStop(0, "rgba(0, 0, 0, 0.4)");
  gradBG.addColorStop(1, "rgba(0, 0, 0, 0.95)");
  ctx.fillStyle = gradBG;
  ctx.fillRect(0, 0, width, height);

  drawHighTechGrid(ctx, width, height, "rgba(56, 189, 248, 0.05)");
  const rankColorHex = rankColor(hunter.rank);
  
  drawEpic3DBox(ctx, 40, 40, 400, 670, rankColorHex);
  
  const cx = 240, cy = 200, r = 100;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.shadowColor = rankColorHex;
  ctx.shadowBlur = 35;
  ctx.lineWidth = 10;
  ctx.strokeStyle = rankColorHex;
  ctx.stroke();
  ctx.clip();
  let avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
  if (user && typeof user.displayAvatarURL === "function") {
      avatarUrl = user.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
  } else if (user && user.avatarURL) {
      avatarUrl = user.avatarURL;
  }
  try {
    const avatar = await loadImage(avatarUrl);
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
  } catch (err) {}
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 38px Orbitron";
  ctx.textAlign = "center";
  const nameToUse = user.username || user.displayName || "Unknown";
  let safeName = ellipsizeText(ctx, nameToUse, 350);
  ctx.shadowColor = "#FFF";
  ctx.shadowBlur = 10;
  ctx.fillText(safeName, cx, cy + 160);
  ctx.shadowBlur = 0;

  ctx.font = "700 24px Rajdhani";
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("Level " + hunter.level + " | " + hunter.rank, cx, cy + 200);
  
  let hClass = "WARRIOR";
  try { hClass = String(require("./classService").getHunterClass(hunter)).toUpperCase(); } catch(e){}
  
  drawEpic3DBox(ctx, cx - 120, cy + 240, 240, 50, "#8B5CF6");
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 28px Orbitron";
  ctx.fillText(hClass, cx, cy + 276);

  const maxExp = Math.ceil(100 * Math.pow(hunter.level, 1.5));
  const expPercent = Math.min(Math.max((Number(hunter.exp)||0) / maxExp, 0), 1);
  ctx.fillStyle = "#1E293B";
  roundedRect(ctx, cx - 140, cy + 320, 280, 25, 12);
  ctx.fill();
  ctx.fillStyle = "#3B82F6";
  ctx.shadowColor = "#3B82F6";
  ctx.shadowBlur = 10;
  if(expPercent > 0) {
    roundedRect(ctx, cx - 140, cy + 320, 280 * expPercent, 25, 12);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#FFF";
  ctx.font = "700 16px Rajdhani";
  ctx.fillText((hunter.exp||0) + " / " + maxExp + " XP", cx, cy + 338);

  drawEpic3DBox(ctx, 480, 40, 680, 310, "rgba(99, 102, 241, 0.8)");
  ctx.textAlign = "left";
  ctx.fillStyle = "#6366F1";
  ctx.font = "900 34px Orbitron";
  ctx.fillText("SYSTEM CAPABILITIES", 520, 90);
  
  const stats = [
    { label: "STR", val: hunter.strength, c: "#EF4444" },
    { label: "AGI", val: hunter.agility, c: "#10B981" },
    { label: "INT", val: hunter.intelligence, c: "#3B82F6" },
    { label: "VIT", val: hunter.vitality, c: "#F59E0B" }
  ];
  
  for(let i=0; i<stats.length; i++) {
     const s = stats[i];
     const bx = 520 + (i % 2) * 310;
     const by = 130 + Math.floor(i / 2) * 90;
     drawEpic3DBox(ctx, bx, by, 280, 70, s.c);
     ctx.fillStyle = "#FFF";
     ctx.font = "900 28px Orbitron";
     ctx.fillText(s.label, bx + 25, by + 45);
     ctx.textAlign = "right";
     ctx.fillStyle = s.c;
     ctx.shadowColor = s.c; ctx.shadowBlur = 15;
     ctx.fillText(Number(s.val), bx + 265, by + 48);
     ctx.shadowBlur = 0;
     ctx.textAlign = "left";
  }

  drawEpic3DBox(ctx, 480, 400, 680, 310, "rgba(245, 158, 11, 0.8)");
  ctx.fillStyle = "#F59E0B";
  ctx.font = "900 34px Orbitron";
  ctx.fillText("INVENTORY RESOURCES", 520, 450);

  const res = [
    { label: "GOLD", val: hunter.gold||0, c: "#FBBF24" },
    { label: "MANA", val: hunter.mana||0, c: "#A78BFA" },
    { label: "STAT POINTS", val: hunter.stat_points||0, c: "#EC4899" }
  ];
  
  for(let j=0; j<res.length; j++) {
     const r = res[j];
     const by = 490 + j * 65;
     drawEpic3DBox(ctx, 520, by, 600, 50, r.c);
     ctx.fillStyle = "#FFF";
     ctx.font = "900 24px Rajdhani";
     ctx.fillText(r.label, 545, by + 34);
     ctx.textAlign = "right";
     ctx.fillStyle = r.c;
     ctx.fillText(Number(r.val), 1090, by + 34);
     ctx.textAlign = "left";
  }

  return await canvas.toBuffer("png");
}`;

const newHunt = `async function generateHuntResultCard(user, result, levelsGained) {
  const width = 900;
  const height = 400;
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "rgba(239, 68, 68, 0.15)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.9)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  
  drawEpic3DBox(ctx, 20, 20, width - 40, height - 40, "#EF4444");

  ctx.fillStyle = "#EF4444";
  ctx.font = "900 50px Orbitron";
  ctx.textAlign = "center";
  ctx.shadowColor = "#EF4444";
  ctx.shadowBlur = 20;
  ctx.fillText("HUNT COMPLETE", width/2, 90);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#FFF";
  ctx.font = "700 28px Rajdhani";
  const nameToUse = user.username || user.displayName || "Unknown";
  ctx.fillText("Target Eliminated by " + nameToUse, width/2, 140);
  
  drawEpic3DBox(ctx, 150, 200, 250, 140, "#FBBF24");
  drawEpic3DBox(ctx, 500, 200, 250, 140, "#3B82F6");

  ctx.font = "900 45px Orbitron";
  ctx.shadowColor = "#FBBF24"; ctx.shadowBlur = 10;
  ctx.fillStyle = "#FBBF24";
  ctx.fillText("+" + (result.gold||0), 275, 270);
  ctx.shadowBlur = 0;
  ctx.font = "700 22px Rajdhani";
  ctx.fillStyle = "#FFF";
  ctx.fillText("GOLD ACQUIRED", 275, 310);

  ctx.shadowColor = "#3B82F6"; ctx.shadowBlur = 10;
  ctx.fillStyle = "#3B82F6";
  ctx.font = "900 45px Orbitron";
  ctx.fillText("+" + (result.xp||0), 625, 270);
  ctx.shadowBlur = 0;
  ctx.font = "700 22px Rajdhani";
  ctx.fillStyle = "#FFF";
  ctx.fillText("XP GAINED", 625, 310);

  if (levelsGained > 0) {
    drawEpic3DBox(ctx, 350, 160, 200, 60, "#10B981");
    ctx.fillStyle = "#10B981";
    ctx.font = "900 24px Orbitron";
    ctx.shadowColor = "#10B981"; ctx.shadowBlur = 15;
    ctx.fillText("LEVEL UP +" + levelsGained, width/2, 200);
    ctx.shadowBlur = 0;
  }

  return await canvas.toBuffer("png");
}`;

const newSalary = `async function generateSalaryCard(user, goldGained, totalGold) {
  const width = 800;
  const height = 350;
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#2c2007");
  grad.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  drawEpic3DBox(ctx, 30, 30, width - 60, height - 60, "#F59E0B");

  ctx.fillStyle = "#FBBF24";
  ctx.font = "900 45px Orbitron";
  ctx.textAlign = "center";
  ctx.shadowColor = "#FBBF24"; ctx.shadowBlur = 20;
  ctx.fillText("DAILY GUILD SALARY", width/2, 100);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#FFF";
  ctx.font = "700 26px Rajdhani";
  ctx.fillText("FUNDS DEPOSITED INTO YOUR ACCOUNT", width/2, 145);

  drawEpic3DBox(ctx, width/2 - 200, 180, 400, 100, "#FBBF24");
  
  ctx.fillStyle = "#10B981";
  ctx.font = "900 50px Orbitron";
  ctx.shadowColor = "#10B981"; ctx.shadowBlur = 10;
  ctx.fillText("+" + goldGained + " G", width/2, 245);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#94A3B8";
  ctx.font = "700 22px Rajdhani";
  ctx.fillText("Total Balance: " + totalGold + " G", width/2, 315);

  return await canvas.toBuffer("png");
}`;

const newGate = `async function generateGateCard(user, difficultyText, results, isSuccess) {
  const width = 900;
  const height = 450;
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  const color = isSuccess ? "#10B981" : "#EF4444";
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, isSuccess ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)");
  bgGrad.addColorStop(1, "#0A0A0A");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  
  drawEpic3DBox(ctx, 20, 20, width - 40, height - 40, color);

  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.font = "900 50px Orbitron";
  ctx.shadowColor = color; ctx.shadowBlur = 20;
  ctx.fillText(isSuccess ? "GATE CLEARED" : "GATE FAILED", width/2, 100);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#FFF";
  ctx.font = "700 28px Rajdhani";
  ctx.fillText("Difficulty: " + (difficultyText || "EXTREME"), width/2, 150);

  if (isSuccess) {
      drawEpic3DBox(ctx, 150, 200, 600, 120, "#10B981");
      ctx.fillStyle = "#10B981";
      ctx.shadowColor = "#10B981"; ctx.shadowBlur = 10;
      ctx.font = "900 40px Orbitron";
      ctx.fillText("+" + (results.xp||0) + " XP  |  +" + (results.gold||0) + " GOLD", width/2, 275);
      ctx.shadowBlur = 0;
  } else {
      drawEpic3DBox(ctx, 200, 200, 500, 120, "#EF4444");
      ctx.fillStyle = "#EF4444";
      ctx.shadowColor = "#EF4444"; ctx.shadowBlur = 10;
      ctx.font = "900 35px Orbitron";
      ctx.fillText("PENALTY: -" + (results.penalty||0) + " GOLD", width/2, 270);
      ctx.shadowBlur = 0;
  }

  return await canvas.toBuffer("png");
}`;

code = code.replace(/async function generateProfileCard[\s\S]*?module.exports/m, newProfile + "\nmodule.exports");

replaceFunction("generateProfileCard", newProfile);
replaceFunction("generateHuntResultCard", newHunt);
replaceFunction("generateSalaryCard", newSalary);
replaceFunction("generateGateCard", newGate);

fs.writeFileSync(path.join(__dirname, "src/services/cardGenerator.js"), code, "utf8");
console.log("OK Rewrite Cards");
