import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateSourceTemplate } from "../scripts/validate-source.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const tagPrefix = version.split(".").length === 6 ? "dev-v" : "v";
const expectedTag = `${tagPrefix}${version}`;
const parts = version.split(".");
parts[parts.length - 1] = String(Number(parts.at(-1)) + 1);
const wrongTag = `${tagPrefix}${parts.join(".")}`;

function fixture(t) {
  const target = mkdtempSync(join(tmpdir(), "canvas-source-release-"));
  cpSync(root, target, {
    recursive: true,
    filter(source) {
      const path = relative(root, source).replaceAll("\\", "/");
      return path !== ".git" && !path.startsWith(".git/") && path !== ".next" && !path.startsWith(".next/") && path !== "node_modules" && !path.startsWith("node_modules/");
    },
  });
  t.after(() => rmSync(target, { recursive: true, force: true }));
  return target;
}

function replace(path, before, after) {
  const content = readFileSync(path, "utf8");
  assert.ok(content.includes(before), `fixture replacement source is missing: ${before}`);
  writeFileSync(path, content.replace(before, after));
}

function rejects(rootPath, options, pattern) {
  assert.throws(() => validateSourceTemplate({ root: rootPath, ...options }), pattern);
}

test("accepts the repository as a deterministic source template", () => {
  const result = validateSourceTemplate({ root, expectedTag });
  assert.equal(result.derivedTag, expectedTag);
  assert.match(result.version, /^\d+\.\d+\.\d+(?:\.\d+){0,3}$/);
});

test("derives one exact release tag from package.json.version", (t) => {
  const target = fixture(t);
  rejects(target, { expectedTag: version }, /malformed/);
  rejects(target, { expectedTag: wrongTag }, /does not match/);
});

test("rejects a malformed package version", (t) => {
  const target = fixture(t);
  const packagePath = join(target, "package.json");
  replace(packagePath, `"version": "${version}"`, `"version": "v${version}"`);
  rejects(target, {}, /package\.json\.version/);
});

test("rejects application manifest kind drift", (t) => {
  const target = fixture(t);
  replace(join(target, "youeye-app.yaml"), "kind: app", "kind: infra");
  rejects(target, {}, /kind: app/);
});

test("rejects a missing or private template repository identity", (t) => {
  const target = fixture(t);
  const manifestPath = join(target, "youeye-app.yaml");
  const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
  if (pkg.name === "youeye-canvas") {
    replace(manifestPath, "YOUR_PUBLIC_ORG/YOUR_APP_REPOSITORY", "private-owner/private-app");
    rejects(target, {}, /public repository placeholder/);
  } else {
    writeFileSync(manifestPath, readFileSync(manifestPath, "utf8").replace(/^\s*repo:.*$/m, "      repo: invalid/source/path"));
    rejects(target, {}, /owner\/repository/);
  }
});

test("rejects agent-specific files and private public-text references", (t) => {
  const target = fixture(t);
  writeFileSync(join(target, "AGENTS.md"), "internal history\n");
  rejects(target, {}, /agent-specific file/);
  rmSync(join(target, "AGENTS.md"));
  writeFileSync(join(target, "src", "private-note.txt"), "service host: repository.internal\n");
  rejects(target, {}, /private infrastructure hostname/);
});

test("rejects private paths, hosts, and worker history", (t) => {
  const cases = [
    ["private path", "operator path: /workspace/private/app"],
    ["private host", "DATABASE_URL=http://database.incus:5432/app"],
    ["worker history", "VM: internal-runner"],
  ];
  for (const [name, content] of cases) {
    const target = fixture(t);
    writeFileSync(join(target, "src", `${name.replaceAll(" ", "-")}.txt`), `${content}\n`);
    rejects(target, {}, /forbidden/);
  }
});

test("rejects generated runtime output and runtime packaging", (t) => {
  const outputTarget = fixture(t);
  mkdirSync(join(outputTarget, ".next", "standalone"), { recursive: true });
  writeFileSync(join(outputTarget, ".next", "standalone", "server.js"), "generated\n");
  rejects(outputTarget, {}, /generated runtime\/build output/);

  const scriptTarget = fixture(t);
  replace(join(scriptTarget, "package.json"), '"build": "next build"', '"build": "next build && node scripts/postbuild.mjs"');
  rejects(scriptTarget, {}, /must be exactly/);
});

test("requires the contributor and release policy", (t) => {
  const target = fixture(t);
  rmSync(join(target, "CONTRIBUTING.md"));
  rejects(target, {}, /required public release file/);
});


test("accepts five-position source releases and preserves exact tag binding", (t) => {
  const target = fixture(t);
  const path = join(target, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.version = "0.3.1.0.1";
  writeFileSync(path, JSON.stringify(pkg));
  assert.equal(validateSourceTemplate({ root: target, expectedTag: "v0.3.1.0.1" }).version, pkg.version);
  rejects(target, { expectedTag: "v0.3.1.0.2" }, /does not match/);
  for (const invalid of ["0.3.1.0.1.2.3", "0.3.1.00.1", "0.3.1.0.1-beta"]) {
    pkg.version = invalid; writeFileSync(path, JSON.stringify(pkg));
    rejects(target, {}, /package\.json\.version/);
  }
});


test("rejects a second version authority in the install manifest", (t) => {
  const target = fixture(t);
  const path = join(target, "youeye-app.yaml");
  writeFileSync(path, readFileSync(path, "utf8") + "\nversion: 9.9.9\n");
  rejects(target, {}, /sole Canvas version authority/);
});

test("renaming a fork preserves source validation, PWA wiring and current identity configuration", (t) => {
  const target = fixture(t);
  const script = join(target, "scripts/rename.mjs");
  const before = readFileSync(script, "utf8");
  const args = [script, "--id", "ye-tasks", "--name", "Tasks", "--repo", "example/Tasks", "--icon", "ListTodo"];
  const manifestBefore = readFileSync(join(target, "youeye-app.yaml"), "utf8");
  execFileSync(process.execPath, [...args, "--dry-run"]);
  assert.equal(readFileSync(join(target, "youeye-app.yaml"), "utf8"), manifestBefore);
  execFileSync(process.execPath, args);
  assert.equal(readFileSync(script, "utf8"), before, "rename must not rewrite itself");
  const manifest = readFileSync(join(target, "youeye-app.yaml"), "utf8");
  assert.match(manifest, /repo: example\/Tasks/);
  assert.match(manifest, /id: "tasks"/);
  assert.match(manifest, /IDENTITY_URL/);
  assert.match(manifest, /surfaceSchemaVersion: 1/);
  assert.doesNotMatch(manifest, /^version:/m);
  assert.match(readFileSync(join(target, "src/app/sw.ts"), "utf8"), /ye-tasks/);
  assert.match(readFileSync(join(target, "next.config.ts"), "utf8"), /swSrc: "src\/app\/sw.ts"/);
  assert.equal(validateSourceTemplate({ root: target, expectedTag }).derivedTag, expectedTag);
  execFileSync(process.execPath, [join(target, "scripts/validate-source.mjs"), "--tag", expectedTag]);
});


test("runtime version comes from the package even when npm environment metadata disagrees", () => {
  const source = readFileSync(join(root, "src/lib/app-config.ts"), "utf8")
    .replace(/^import packageJson.*;\n/m, "")
    .replaceAll("export const ", "const ");
  const actual = runInNewContext(`${source}\nAPP_VERSION`, {
    packageJson: { version: "7.8.9.1" },
    process: { env: { npm_package_version: "0.0.0" } },
  });
  assert.equal(actual, "7.8.9.1");
});

test("beta source release requires exact four-position tag and version", (t) => {
  const target = fixture(t);
  const path = join(target, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.version = "0.4.0.1";
  writeFileSync(path, JSON.stringify(pkg));
  assert.equal(validateSourceTemplate({ root: target, expectedTag: "beta-v0.4.0.1" }).derivedTag, "beta-v0.4.0.1");
  rejects(target, { expectedTag: "beta-v0.4.0.2" }, /does not match/);
  pkg.version = "0.4.1";
  writeFileSync(path, JSON.stringify(pkg));
  rejects(target, { expectedTag: "beta-v0.4.1" }, /four-component/);
});


test("development source versions preserve channel depth and exact tag binding", (t) => {
  const target = fixture(t);
  const path = join(target, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.version = "0.5.13.0.0.1";
  writeFileSync(path, JSON.stringify(pkg));
  assert.equal(validateSourceTemplate({ root: target }).derivedTag, "dev-v0.5.13.0.0.1");
  assert.equal(validateSourceTemplate({ root: target, expectedTag: "dev-v0.5.13.0.0.1" }).version, pkg.version);
  rejects(target, { expectedTag: "dev-v0.5.13.0.0.2" }, /does not match/);
  rejects(target, { expectedTag: "v0.5.13.0.0.1" }, /require a dev-v tag/);
  rejects(target, { expectedTag: "beta-v0.5.13.0.0.1" }, /four-component/);
  pkg.version = "0.5.13.0.1";
  writeFileSync(path, JSON.stringify(pkg));
  rejects(target, { expectedTag: "dev-v0.5.13.0.1" }, /six-component/);
  assert.equal(validateSourceTemplate({ root: target, expectedTag: "v0.5.13.0.1" }).version, pkg.version);
});
