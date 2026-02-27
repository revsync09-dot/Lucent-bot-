const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/cardGenerator.js');
let content = fs.readFileSync(filePath, 'utf8');
const functionPattern = /(?:async\s+)?function\s+(\w+)/g;
const functions = [];
let match;

while ((match = functionPattern.exec(content)) !== null) {
  functions.push({
    name: match[1],
    pos: match.index,
    line: content.substring(0, match.index).split('\n').length
  });
}

console.log('Functions found in cardGenerator.js:');
functions.forEach((func, i) => {
  console.log(`${i + 1}. ${func.name} at line ${func.line}`);
  const startPos = func.pos;
  const afterFunc = content.substring(startPos);
  
  let braceCount = 0;
  let foundOpen = false;
  let closePos = -1;
  
  for (let j = 0; j < afterFunc.length; j++) {
    if (afterFunc[j] === '{') {
      braceCount++;
      foundOpen = true;
    }
    if (afterFunc[j] === '}') {
      braceCount--;
      if (foundOpen && braceCount === 0) {
        closePos = j;
        break;
      }
    }
  }
  
  if (closePos === -1) {
    console.log(`  ❌ UNCLOSED! Brace count: ${braceCount}`);
  } else {
    const closeLine = content.substring(0, startPos + closePos).split('\n').length;
    console.log(`  ✓ Closes at line ${closeLine}`);
  }
});
