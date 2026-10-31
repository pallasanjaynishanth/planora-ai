import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
const output = process.argv[2] || "../planora-ai-starter.zip";
execFileSync(
  "git",
  [
    "archive",
    "-0",
    "--format=zip",
    "--prefix=planora-ai/",
    "-o",
    output,
    "HEAD",
  ],
  { stdio: "inherit" },
);
console.log(
  `${output}: ${statSync(output).size} bytes. Includes tracked source only.`,
);
