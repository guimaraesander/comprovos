import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".idea",
  ".vscode",
  ".cache",
]);

const TARGET_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".md",
  ".json",
]);

const PATTERN = /(Ã|Â|â\u0080|â\u2019|â€˜|â€œ|â€|â€¢)/g;

const found = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (IGNORED_DIRS.has(entry.name)) continue;

    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!TARGET_EXTS.has(path.extname(entry.name))) continue;

    const text = fs.readFileSync(full, "utf8");
    if (PATTERN.test(text)) {
      found.push(full);
    }
  }
}

walk(path.join(ROOT, "src"));

if (found.length > 0) {
  console.error("Arquivos com possível corrupção de encoding:");
  for (const file of found) {
    console.error(`- ${path.relative(ROOT, file)}`);
  }
  process.exit(1);
}

console.log("check:encoding OK");
