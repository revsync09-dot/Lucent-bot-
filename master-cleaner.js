const fs = require('fs');
const path = require('path');

function stripComments(content) {
  // Enhanced regex that avoids strings but captures comments
  // Matches "", '', ``, and regex or catches comments.
  // Then we filter out the strings and return only the code parts or the stripped part.
  
  // A standard robust way to strip comments without a parser:
  return content.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`|\/([^\/\\\n]|\\.)*\/)|(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/g, (match, stringOrRegex, s1, s2, s3, s4, comment) => {
    if (comment) return '';
    return stringOrRegex;
  });
}

function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(getAllJsFiles(filePath));
      }
    } else if (file.endsWith('.js') && !file.includes('master-cleaner.js')) {
      results.push(filePath);
    }
  }
  return results;
}

const files = getAllJsFiles(process.cwd());

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const stripped = stripComments(content);
    
    // Clean up empty lines (no more than 1 empty line in a row)
    const cleaned = stripped.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    
    if (content !== cleaned) {
      fs.writeFileSync(file, cleaned, 'utf8');
      console.log('Fully Cleaned: ' + file);
    }
  } catch (err) {
    console.error('Error cleaning ' + file + ': ' + err.message);
  }
});

console.log('--- Cleaning Complete ---');
