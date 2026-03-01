const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.git'];

function getAllJsFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!excludeDirs.includes(file)) {
        getAllJsFiles(fullPath, files);
      }
    } else if (file.endsWith('.js') && !file.includes('clean-comments.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const jsFiles = getAllJsFiles(process.cwd());

jsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern to match lines that contain ONLY "// -----" (at least 3 dashes) and possibly whitespace
  // Or match any "// ---" inside a line to clean it up if that's what user meant by "alle // ----"
  // Let's do a more careful approach: replace any "//" followed by 3+ dashes with nothing
  
  const regex = /\/\/\s*-{3,}.*$/gm;
  
  if (regex.test(content)) {
    content = content.replace(regex, '');
    changed = true;
  }

  // Also clean up any resulting double empty lines
  if (changed) {
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned: ${file}`);
  }
});
