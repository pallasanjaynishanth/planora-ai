import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AIza[0-9A-Za-z_-]{35}/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /"private_key"\s*:\s*"[^"\s]+/,
];
const findings = [];
for (const file of files) {
  if (
    (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example")) ||
    /service[-_]?account.*\.json$/i.test(file)
  )
    findings.push(`${file}: prohibited credential filename`);
  const text = readFileSync(file, "utf8");
  if (patterns.some((p) => p.test(text)))
    findings.push(`${file}: possible embedded credential`);
}
if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `PASS: scanned ${files.length} tracked files for common credential patterns and prohibited filenames. This is a heuristic scan, not a complete secret audit.`,
  );
