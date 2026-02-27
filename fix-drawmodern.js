const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/cardGenerator.js');
let content = fs.readFileSync(filePath, 'utf8');

const broken = `  ctx.textAlign = "left";
}

async function generateProfileCard(user, hunter) {`;
if (!content.includes(broken)) {
  console.log("Pattern not found, looking for alternative...");
  const pattern = `ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);
async function generateProfileCard(user, hunter) {`;
  
  if (content.includes(pattern)) {
    const fixed = `ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);
  ctx.textAlign = "left";
}

async function generateProfileCard(user, hunter) {`;
    
    content = content.replace(pattern, fixed);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✓ Added missing closing brace to drawModernProgressBar');
  } else {
    console.log('Could not find the pattern to fix');
  }
} else {
  console.log('Pattern already exists, no changes needed');
}
