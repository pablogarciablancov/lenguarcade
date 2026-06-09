import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve("apps-script");
const files = fs.readdirSync(root, { withFileTypes: true });
let checked = 0;

for (const entry of files) {
  if (!entry.isFile()) {
    continue;
  }

  const filePath = path.join(root, entry.name);
  const source = fs.readFileSync(filePath, "utf8");

  if (entry.name.endsWith(".gs") || entry.name.endsWith(".js")) {
    new Function(source);
    checked += 1;
    continue;
  }

  if (entry.name.endsWith(".html")) {
    const scripts = source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of scripts) {
      new Function(match[1]);
      checked += 1;
    }
  }
}

console.log(`Sintaxis correcta: ${checked} bloques JavaScript.`);
process.exitCode = 0;
