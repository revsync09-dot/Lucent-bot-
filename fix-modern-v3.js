const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/cardGenerator.js');
let content = fs.readFileSync(filePath, 'utf8');
const searchStr = 'ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);\nasync function generateProfileCard';
const replacementStr = 'ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);\n  ctx.textAlign = "left";\n}\n\nasync function generateProfileCard';

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Fixed drawModernProgressBar');
} else {
  const regex = /ctx\.fillText\(valueText, pillX \+ pillW \/ 2, pillY \+ 26\);\s*async function generateProfileCard/;
  if (regex.test(content)) {
    content = content.replace(regex, 'ctx.fillText(valueText, pillX + pillW / 2, pillY + 26);\n  ctx.textAlign = "left";\n}\n\nasync function generateProfileCard');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✓ Fixed using regex');
  } else {
    console.log('Could not find pattern, dumping nearby content:');
    const pos = content.indexOf('fillText(valueText');
    console.log(content.substring(pos, pos + 200));
  }
}
