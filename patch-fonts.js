const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "services", "cardGenerator.js");
let content = fs.readFileSync(filePath, "utf8");


const oldFn = "function setupPrimaryFont()";
const idx = content.indexOf(oldFn);
if (idx === -1) { console.error("setupPrimaryFont not found"); process.exit(1); }


const setupEnd = content.indexOf("setupPrimaryFont();", idx) + "setupPrimaryFont();".length;

const newSetup = `function setupFonts() {
  // Orbitron — retro-futuristic for big numbers & headings
  const orbitron = path.join(ASSETS_DIR, "fonts", "Orbitron-Bold.ttf");
  if (fs.existsSync(orbitron)) FontLibrary.use("Orbitron", orbitron);

  // Rajdhani — clean military/gaming for labels & subtext
  const rajBold = path.join(ASSETS_DIR, "fonts", "Rajdhani-Bold.ttf");
  if (fs.existsSync(rajBold)) FontLibrary.use("Rajdhani", rajBold);

  // Fallback Inter alias from existing candidates
  for (const file of FONT_CANDIDATES) {
    const full = path.join(ASSETS_DIR, "fonts", file);
    if (fs.existsSync(full)) {
      FontLibrary.use("Inter", full);
      return file;
    }
  }
  return null;
}

setupFonts();`;

content = content.slice(0, idx) + newSetup + content.slice(setupEnd);
fs.writeFileSync(filePath, content, "utf8");
console.log("✅ Font setup patched!");


const { FontLibrary } = require("skia-canvas");
const orbitron = path.join(__dirname, "assets", "fonts", "Orbitron-Bold.ttf");
const rajdhani = path.join(__dirname, "assets", "fonts", "Rajdhani-Bold.ttf");
if (fs.existsSync(orbitron)) { FontLibrary.use("Orbitron", orbitron); console.log("✅ Orbitron loaded"); }
if (fs.existsSync(rajdhani)) { FontLibrary.use("Rajdhani", rajdhani); console.log("✅ Rajdhani loaded"); }
