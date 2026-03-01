const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/cardGenerator.js');
let content = fs.readFileSync(filePath, 'utf8');
const broken = `  ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);
async function generateProfileCard(user, hunter) {`;

const fixed = `  ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);
  ctx.textAlign = "left";
}

async function generateProfileCard(user, hunter) {`;

content = content.replace(broken, fixed);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed missing closing brace in drawModernProgressBar');