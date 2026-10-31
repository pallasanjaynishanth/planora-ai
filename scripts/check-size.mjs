import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const ignored = new Set([
  "node_modules",
  ".git",
  "dist",
  ".firebase",
  "coverage",
  "playwright-report",
  "test-results",
]);
function walk(dir, ignore = ignored) {
  return readdirSync(dir).flatMap((n) => {
    if (
      ignore.has(n) ||
      (n.startsWith(".env") && n !== ".env.example") ||
      n.endsWith(".zip") ||
      n.endsWith("-debug.log")
    )
      return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p, ignore) : [p];
  });
}
const files = walk(".");
const bytes = files.reduce((a, f) => a + statSync(f).size, 0);
console.log(
  `Source: ${files.length} files, ${bytes} bytes (limit 10,000,000).`,
);
if (bytes >= 10000000) process.exitCode = 1;
let total = 0;
for (const file of walk("dist", new Set()).filter((f) =>
  /\.(js|css)$/.test(f),
)) {
  const raw = readFileSync(file);
  const gzip = gzipSync(raw).length;
  total += gzip;
  console.log(`${file}: ${raw.length} bytes; ${gzip} gzip bytes`);
}
console.log(`All JS/CSS chunks, gzip: ${total} bytes (limit 600,000).`);
if (total > 600000) process.exitCode = 1;
