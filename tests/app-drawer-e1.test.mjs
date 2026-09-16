import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

// Plan 1 E1 (Canvas) — the app drawer/launcher are UI-served fullscreen iframe overlays, not an app list.
// Run: node --test tests/app-drawer-e1.test.mjs
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

test('AppDrawer embeds UI-owned drawer and launcher overlays instead of rendering an app list', () => {
  const d = read('src/lib/components/layout/app-drawer.tsx');
  assert.match(d, /type OverlayKind = "drawer" \| "launcher"/);
  assert.match(d, /\/embed\/\$\{kind\}\?mode=\$\{mode\}/);
  assert.match(d, /<iframe/);
  assert.match(d, /uiBaseUrl/);
  assert.match(d, /youeye:close/);
  assert.match(d, /youeye:overlay-visibility/);
  assert.match(d, /youeye:overlay-command/);
  assert.match(d, /command === "open-launcher"/);
  assert.doesNotMatch(d, /action === "open-launcher"/);
  assert.match(d, /prewarm/);
  assert.match(d, /active && loaded/);
  assert.match(d, /fixed inset-0 z-\[60\] h-screen w-screen/);
  // the old app-list grid + status dots are gone (the app no longer sees the list)
  assert.doesNotMatch(d, /apps\.filter/);
  assert.doesNotMatch(d, /statusColor/);
  assert.doesNotMatch(d, /youeye:resize|drawerHeight|absolute right-0 top-full/);
});

test('AppDrawer disables the host trigger when no UI base url is available', () => {
  const d = read('src/lib/components/layout/app-drawer.tsx');
  assert.match(d, /disabled=\{!base\}/);
});

test('AppHeader passes uiBaseUrl to the drawer (not the apps list)', () => {
  const h = read('src/lib/components/layout/app-header.tsx');
  assert.match(h, /<AppDrawer uiBaseUrl=\{uiBaseUrl\}/);
  assert.doesNotMatch(h, /<AppDrawer apps=/);
});

test('NotificationBell preloads the UI-owned notification centre overlay', () => {
  const n = read('src/lib/components/layout/notification-bell.tsx');
  assert.match(n, /NotificationFrame/);
  assert.match(n, /\/embed\/notifications\?mode=\$\{mode\}/);
  assert.match(n, /youeye:close/);
  assert.match(n, /youeye:notifications/);
  assert.match(n, /youeye:overlay-visibility/);
  assert.match(n, /prewarm/);
  assert.match(n, /active && loaded/);
  assert.match(n, /fixed inset-0 z-\[60\] h-screen w-screen/);
});
