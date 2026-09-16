#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_PATTERN = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){0,2}$/;
const TAG_PATTERN = /^(?:beta-)?v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){0,2}$/;
const REQUIRED_FILES = ["README.md", "CONTRIBUTING.md", "package.json", "youeye-app.yaml"];
const FORBIDDEN_PUBLIC_FILES = ["AGENTS.md", "CLAUDE.md", "scripts/postbuild.mjs"];
const FORBIDDEN_TRACKED_PREFIXES = [".next/", "dist/", "out/"];
const TEXT_EXTENSIONS = new Set([
  "", ".css", ".env", ".html", ".js", ".json", ".jsx", ".md", ".mjs",
  ".mts", ".sh", ".svg", ".ts", ".tsx", ".txt", ".yaml", ".yml",
]);
const SCANNED_ROOT_FILES = new Set([
  ".gitignore", "CONTRIBUTING.md", "LICENSE", "README.md", "TRADEMARK.md",
  "next.config.ts", "next-env.d.ts", "package.json", "pnpm-lock.yaml",
  "postcss.config.mjs", "tsconfig.json", "youeye-app.yaml",
]);
const SKIPPED_DIRECTORIES = new Set([".git", "node_modules"]);

function fail(message) {
  throw new Error(message);
}

function normalizePath(path) {
  return path.split(sep).join("/");
}

function listFiles(root, current = root) {
  const files = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(root, absolute));
    else if (entry.isFile() || entry.isSymbolicLink()) files.push(normalizePath(relative(root, absolute)));
  }
  return files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function gitTrackedFiles(root) {
  if (!existsSync(join(root, ".git"))) return listFiles(root);
  try {
    return execFileSync("git", ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .split(/\r?\n/)
      .filter(Boolean)
      .map((path) => path.replaceAll("\\", "/"))
      .filter((path) => existsSync(join(root, path)))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  } catch (error) {
    fail(`could not enumerate release-candidate files: ${error.message}`);
  }
}

function readJson(root, path) {
  try {
    return JSON.parse(readFileSync(join(root, path), "utf8"));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
  }
}

function validatePackage(root, expectedTag) {
  const pkg = readJson(root, "package.json");
  if (pkg.private !== true) fail("package.json must remain private; Canvas is released as source, not an npm package");
  if (typeof pkg.version !== "string" || !VERSION_PATTERN.test(pkg.version)) {
    fail("package.json.version must be a numeric 3-, 4-, or 5-component version without a leading v");
  }
  if (pkg.scripts?.build !== "next build") {
    fail('package.json scripts.build must be exactly "next build" and must not package standalone output');
  }
  if (pkg.scripts?.["validate:source"] !== "node scripts/validate-source.mjs") {
    fail("package.json must expose the deterministic validate:source command");
  }
  if (pkg.scripts?.["validate:release"] !== "node scripts/validate-source.mjs --release") {
    fail("package.json must expose the deterministic validate:release command");
  }

  const beta = expectedTag?.startsWith("beta-v");
  if (beta && pkg.version.split('.').length !== 4) fail("beta release requires a four-component version");
  const derivedTag = `${beta ? 'beta-' : ''}v${pkg.version}`;
  if (expectedTag !== undefined) {
    if (!TAG_PATTERN.test(expectedTag)) fail(`release tag ${JSON.stringify(expectedTag)} is malformed; expected ${derivedTag}`);
    if (expectedTag !== derivedTag) fail(`release tag ${expectedTag} does not match package.json version; expected ${derivedTag}`);
  }
  return { version: pkg.version, derivedTag };
}

function validateManifest(root) {
  const manifest = readFileSync(join(root, "youeye-app.yaml"), "utf8");
  if (!/^apiVersion:\s*v1\s*$/m.test(manifest)) fail("youeye-app.yaml must declare apiVersion: v1");
  if (!/^kind:\s*app\s*$/m.test(manifest)) fail("youeye-app.yaml must remain an application manifest with kind: app");
  if (/^kind:\s*(?:infra|appliance|artifact|runtime)\b/im.test(manifest)) fail("youeye-app.yaml must not use an infrastructure or runtime-artifact kind");
  if (!/^integration:\s*native\s*$/m.test(manifest)) fail("youeye-app.yaml must declare integration: native");
  if (/^version:/m.test(manifest)) fail("package.json is the sole Canvas version authority; omit the root manifest version");
  const isTemplate = readJson(root, "package.json").name === "youeye-canvas";
  if (isTemplate && !/^\s*repo:\s*YOUR_PUBLIC_ORG\/YOUR_APP_REPOSITORY\s*$/m.test(manifest)) {
    fail("youeye-app.yaml must retain the explicit public repository placeholder for forks to replace");
  }
  if (!isTemplate && !/^\s*repo:\s*[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\s*$/m.test(manifest)) {
    fail("a renamed fork must declare an owner/repository source identity");
  }
}

function shouldScan(path) {
  if (SCANNED_ROOT_FILES.has(path)) return true;
  if (!path.startsWith("src/")) return false;
  const name = basename(path);
  const dot = name.lastIndexOf(".");
  const extension = name.startsWith(".") || dot < 0 ? "" : name.slice(dot);
  return TEXT_EXTENSIONS.has(extension);
}

function validateCandidateFiles(root, candidateFiles) {
  for (const path of REQUIRED_FILES) {
    if (!existsSync(join(root, path))) fail(`required public release file is missing: ${path}`);
  }
  for (const path of FORBIDDEN_PUBLIC_FILES) {
    if (existsSync(join(root, path))) fail(`agent-specific file must not be included in the public release: ${path}`);
  }
  for (const path of candidateFiles) {
    if (FORBIDDEN_TRACKED_PREFIXES.some((prefix) => path === prefix.slice(0, -1) || path.startsWith(prefix))) {
      fail(`generated runtime/build output must not be included in the release candidate: ${path}`);
    }
    const absolute = join(root, path);
    if (existsSync(absolute) && lstatSync(absolute).isSymbolicLink()) fail(`symbolic links are not allowed in the release candidate: ${path}`);
  }
}

function validatePublicText(root, candidateFiles) {
  const checks = [
    { pattern: /\b(?:https?:\/\/)?[a-z0-9.-]+\.(?:internal|local|incus)\b/i, label: "private infrastructure hostname" },
    { pattern: /\b(?:10(?:\.\d{1,3}){3}|127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b/, label: "private network address" },
    { pattern: /\/workspace\//i, label: "private workspace path" },
    { pattern: /\/mnt\/[^\s`"']+/i, label: "private operator path" },
    { pattern: /^\s*(?:\*\*)?(?:Branch|VM|Agent)(?:\*\*)?:/im, label: "internal agent or machine history" },
  ];

  for (const path of candidateFiles.filter(shouldScan)) {
    const absolute = join(root, path);
    if (!existsSync(absolute) || lstatSync(absolute).isSymbolicLink()) continue;
    const content = readFileSync(absolute, "utf8");
    for (const check of checks) {
      if (check.pattern.test(content)) fail(`${path} contains a forbidden ${check.label} reference`);
    }
  }
}

export function validateSourceTemplate({ root = DEFAULT_ROOT, expectedTag } = {}) {
  root = resolve(root);
  for (const path of REQUIRED_FILES) {
    if (!existsSync(join(root, path))) fail(`required public release file is missing: ${path}`);
  }
  const candidateFiles = gitTrackedFiles(root);
  validateCandidateFiles(root, candidateFiles);
  const release = validatePackage(root, expectedTag);
  validateManifest(root);
  validatePublicText(root, candidateFiles);
  return { ...release, filesChecked: candidateFiles.length };
}

function parseCli(args, env) {
  let release = false;
  let expectedTag;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--release") release = true;
    else if (arg === "--tag") expectedTag = args[++index];
    else fail(`unknown argument: ${arg}`);
  }
  if (expectedTag === undefined && (release || env.RELEASE_TAG !== undefined)) expectedTag = env.RELEASE_TAG;
  if (release && !expectedTag) fail("release validation requires RELEASE_TAG or --tag");
  return { expectedTag };
}

function main() {
  try {
    const options = parseCli(process.argv.slice(2), process.env);
    const result = validateSourceTemplate(options);
    const suffix = options.expectedTag ? ` and release tag ${result.derivedTag}` : "";
    console.log(`Canvas source template ${result.version}${suffix} is valid (${result.filesChecked} files checked).`);
  } catch (error) {
    console.error(`Canvas source validation failed: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
