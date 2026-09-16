#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const skipDirs = new Set([".git", ".next", "node_modules", "public", "scripts", "tests"]);
const textExtensions = new Set([
  ".css",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.id || !args.name) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const appId = normalizeAppId(String(args.id));
const shortId = appId.replace(/^ye-/, "");
const appName = String(args.name);
const packageName = String(args.package || `ye-app-${shortId}`);
const subdomain = String(args.subdomain || shortId);
const iconName = String(args.icon || "Star");
const iconYamlName = toKebab(iconName);
const repoName = String(args.repo || "YOUR_PUBLIC_ORG/YOUR_APP_REPOSITORY");
const description = String(args.description || `A YouEye native app for ${appName}`);
const dryRun = Boolean(args["dry-run"]);

const replacements = [
  ["youeye-canvas", packageName],
  ["YOUR_PUBLIC_ORG/YOUR_APP_REPOSITORY", repoName],
  ["YE-App-MyApp", repoName],
  ["A YouEye native app built with Canvas template", description],
  ["A YouEye native app built with Canvas", description],
  ["My App", appName],
  ["MyApp", toPascal(shortId)],
  ["ye-myapp", appId],
  ["myapp", shortId],
  ['icon: "star"', `icon: "${iconYamlName}"`],
  ["defaultSubdomain: \"" + shortId + "\"", `defaultSubdomain: "${subdomain}"`],
  ['const APP_ICON = "Star";', `const APP_ICON = "${iconName}";`],
  ["import { Star } from \"lucide-react\";", `import { ${iconName} } from "lucide-react";`],
  ["<Star className=\"h-5 w-5\" />", `<${iconName} className="h-5 w-5" />`],
];

const changed = [];
for (const file of walk(root)) {
  if (file === fileURLToPath(import.meta.url)) continue;
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const [from, to] of replacements) {
    after = after.split(from).join(to);
  }
  if (after === before) continue;
  changed.push(relative(root, file));
  if (!dryRun) writeFileSync(file, after);
}

const prefix = dryRun ? "Would update" : "Updated";
for (const file of changed) {
  console.log(`${prefix}: ${file}`);
}
console.log(`${dryRun ? "Dry run complete" : "Rename complete"}: ${changed.length} files`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (raw === "--help" || raw === "-h") {
      out.help = true;
      continue;
    }
    if (raw === "--dry-run") {
      out["dry-run"] = true;
      continue;
    }
    if (!raw.startsWith("--")) {
      throw new Error(`Unexpected argument: ${raw}`);
    }
    const [key, inlineValue] = raw.slice(2).split("=", 2);
    const value = inlineValue ?? argv[++i];
    if (!value) throw new Error(`Missing value for --${key}`);
    out[key] = value;
  }
  return out;
}

function normalizeAppId(value) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.startsWith("ye-") ? normalized : `ye-${normalized}`;
}

function toPascal(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toKebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walk(full);
      continue;
    }
    if (!stat.isFile()) continue;
    if (!isTextFile(full)) continue;
    yield full;
  }
}

function isTextFile(file) {
  if (file.endsWith("AGENTS.md") || file.endsWith("README.md") || file.endsWith("CLAUDE.md")) return true;
  const dot = file.lastIndexOf(".");
  return dot >= 0 && textExtensions.has(file.slice(dot));
}

function printHelp() {
  console.log(`Usage:
  node scripts/rename.mjs --id ye-tasks --name "Tasks" [options]

Required:
  --id            App id. "tasks" is normalized to "ye-tasks".
  --name          Human app name.

Options:
  --package       package.json name. Default: ye-app-<id-without-ye-prefix>
  --subdomain     metadata.defaultSubdomain. Default: <id-without-ye-prefix>
  --icon          Lucide icon component name. Default: Star
  --repo          Source owner/repository, e.g. example/Tasks; default retains placeholder
  --description   App description used by package/manifests
  --dry-run       Print files that would change without writing them
`);
}
