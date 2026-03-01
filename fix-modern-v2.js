const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/cardGenerator.js');
let content = fs.readFileSync(filePath, 'utf8');

const pattern = `  ctx.fillStyle = "#F8FAFC";
  ctx.font = "900 16px Inter";
  ctx.textAlign = "center";
  ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);
async function generateProfileCard(user, hunter) {`;

const fixed = `  ctx.fillStyle = "#F8FAFC";
  ctx.font = "900 16px Inter";
  ctx.textAlign = "center";
  ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);
  ctx.textAlign = "left";
}

async function generateProfileCard(user, hunter) {`;

if (content.includes(pattern)) {
  content = content.replace(pattern, fixed);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Fixed drawModernProgressBar closing brace');
} else {
  console.log('Pattern not found');
  console.log('Looking for fillText(valueText...');
  const idx = content.indexOf('fillText(valueText');  
  if (idx > 0) {
    console.log(`Found at position ${idx}`);
    console.log(content.substring(idx - 50, idx + 150));
  }
}