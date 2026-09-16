import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

// Source-regression checks for Plan 1 Workstream E0 — Canvas unified embed child side.
// Run: node --test tests/embed-e0.test.mjs
const root = process.env.CANVAS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const has = (p) => existsSync(join(root, p));

test('unified embed emit posts the youeye:ready/resize/action protocol', () => {
  const i = read('src/lib/embed/index.tsx');
  assert.match(i, /youeye:ready/);
  assert.match(i, /youeye:resize/);
  assert.match(i, /youeye:action/);
  assert.match(i, /ResizeObserver/);
  assert.match(i, /export function EmbedReadyScript/);
  assert.match(i, /export function UnifiedEmbedLayout/);
  assert.match(i, /export function youeyeEmitAction/);
  assert.match(i, /export const EmbedLayout = UnifiedEmbedLayout/);
  assert.match(i, /export const InfoCardLayout = UnifiedEmbedLayout/);
  assert.doesNotMatch(i, /youeye-card-ready|youeye-embed-ready|youeye-embed-resize|youeye-app-settings-resize/);
});

test('embed layouts suppress top-level mobile/PWA account chrome', () => {
  const i = read('src/lib/embed/index.tsx');
  const globals = read('src/app/globals.css');
  const libraryGlobals = read('src/lib/styles/globals.css');

  assert.match(i, /ye-mobile-shell-only, \.ye-mobile-shell-spacer/);
  assert.match(i, /display: none !important/);
  assert.match(globals, /body\.embed-mode \.ye-mobile-shell-only/);
  assert.match(globals, /body\.embed-mode \.ye-mobile-shell-spacer/);
  assert.match(libraryGlobals, /body\.embed-mode \.ye-mobile-shell-only/);
  assert.match(libraryGlobals, /body\.embed-mode \.ye-mobile-shell-spacer/);
});

test('SettingsPanel kit exists with token-styled primitives', () => {
  assert.ok(has('src/lib/embed/settings-panel.tsx'), 'settings-panel.tsx must exist');
  const s = read('src/lib/embed/settings-panel.tsx');
  for (const fn of ['SettingsPanel', 'SettingsGroup', 'SettingsRow', 'SettingsToggle', 'SettingsSelect', 'SettingsButton']) {
    assert.match(s, new RegExp(`export function ${fn}`));
  }
  // token-styled (rides on delivered Settings tokens), not hardcoded colours
  assert.match(s, /bg-card|bg-primary|text-muted-foreground/);
  assert.doesNotMatch(s, /bg-gray-\d|text-gray-\d/);
  // re-exported from the embed module entry
  assert.match(read('src/lib/embed/index.tsx'), /export \* from "\.\/settings-panel"/);
});

test('Canvas declares the modern surface contract and no request-bridge API', () => {
  const manifest = read('youeye-app.yaml');
  const route = read('src/app/api/manifest/route.ts');
  const connections = read('src/lib/connections/index.ts');

  assert.match(manifest, /surfaceSchemaVersion: 1/);
  for (const kind of ['widget', 'timeline-card', 'settings-panel', 'info-card', 'notification']) {
    assert.match(manifest, new RegExp(`kind: ${kind}`));
    assert.match(route, new RegExp(`kind: "${kind}"`));
  }
  assert.doesNotMatch(manifest, /kind: launcher/);
  assert.doesNotMatch(route, /kind: "launcher"/);
  assert.match(route, /surfaceSchemaVersion: 1/);
  assert.match(connections, /Authorization: `Bearer \$\{YOUEYE_APP_TOKEN\}`/);
  assert.match(connections, /\/proxy\/\$\{encodeURIComponent\(targetAppId\)\}/);
  assert.match(connections, /internetFetch/);
  assert.match(connections, /\/internet\?url=\$\{encodeURIComponent\(targetUrl\)\}/);
  assert.ok(!has('src/app/api/connections/request-bridge/route.ts'));
  assert.ok(!has('src/lib/connections/request-bridge.ts'));
  assert.ok(!has('src/lib/routes/connections/index.ts'));
});
