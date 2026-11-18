import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const base = process.env.BASE_REF || "origin/main";
const strict = process.env.BUSINESS_COVERAGE_STRICT === "true";
const inCI = process.env.GITHUB_ACTIONS === "true";
const summaryFile = "coverage/coverage-summary.json";

// Business files (controllers/services) are defined once, in the
// "test:business:coverage" script in package.json.
const run = spawnSync(
  "npm",
  [
    "run",
    "test:business:coverage",
    "--",
    `--coverage.changed=${base}`,
    "--coverage.reporter=json-summary",
    "--coverage.reporter=text",
  ],
  { stdio: "inherit", shell: process.platform === "win32" },
);
if (run.status !== 0) process.exit(run.status ?? 1);

if (!existsSync(summaryFile)) {
  console.log("No changed business files to check.");
  process.exit(0);
}

const summary = JSON.parse(readFileSync(summaryFile, "utf8"));
const missing = [];
for (const [absPath, stats] of Object.entries(summary)) {
  if (absPath === "total") continue;
  const file = path.relative(process.cwd(), absPath).split(path.sep).join("/");
  if (stats.lines.total > 0 && stats.lines.covered === 0) missing.push(file);
}

if (missing.length === 0) {
  console.log("OK: every changed business file is run by at least one business test.");
  process.exit(0);
}

const level = strict ? "error" : "warning";
const message =
  "No business test runs this file, so wrong logic here would not be caught. " +
  "Add or extend a test in tests/business/ that calls it.";

for (const file of missing) {
  if (inCI) console.log(`::${level} file=${file},title=Not in any business test::${message}`);
  else console.log(`${level.toUpperCase()}: ${file}: ${message}`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = missing.map((f) => `| \`${f}\` |`).join("\n");
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Changed files not run by any business test\n\n| File |\n| --- |\n${rows}\n\n${message}\n`,
  );
}

process.exit(strict ? 1 : 0);
