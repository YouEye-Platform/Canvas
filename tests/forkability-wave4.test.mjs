import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

// Plan 4 Phase 4 — Canvas forkability contract.
// Run: node --test tests/forkability-wave4.test.mjs
const root = process.env.CANVAS_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const has = (p) => existsSync(join(root, p));

test('docs describe Canvas as a fork, not a package dependency', () => {
  for (const file of ['README.md']) {
    const text = read(file);
    assert.match(text, /fork/i, `${file} should guide a fork workflow`);
    assert.match(text, /scripts\/rename\.mjs/, `${file} should document the rename script`);
    assert.match(text, /IDENTITY_URL/, `${file} should use current identity env names`);
    assert.match(text, /surfaceSchemaVersion: 1/, `${file} should document the modern surface schema`);
    assert.doesNotMatch(text, /@youeye\/canvas|withCanvas|link:|MYAPP_EXTERNAL_URL|AUTHENTIK_URL/);
  }
});

test('rename script exists and rewrites the starter placeholders', () => {
  assert.ok(has('scripts/rename.mjs'));
  const script = read('scripts/rename.mjs');
  for (const needle of ['--dry-run', 'ye-myapp', 'My App', 'youeye-canvas', 'defaultSubdomain', 'APP_ICON']) {
    assert.match(script, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('source declares one working route per app-facing surface kind', () => {
  for (const file of [
    'src/app/embed/widget/[widgetId]/page.tsx',
    'src/app/api/widgets/sample-widget/data/route.ts',
    'src/app/embed/timeline/sample/page.tsx',
    'src/app/embed/card/sample/page.tsx',
    'src/app/embed/notification/default/page.tsx',
    'src/app/embed/settings/page.tsx',
  ]) {
    assert.ok(has(file), `${file} should exist`);
  }

  const manifest = read('youeye-app.yaml');
  const runtimeManifest = read('src/app/api/manifest/route.ts');
  for (const kind of ['widget', 'timeline-card', 'info-card', 'notification', 'settings-panel']) {
    assert.match(manifest, new RegExp(`kind: ${kind}`));
    assert.match(runtimeManifest, new RegExp(`kind: "${kind}"`));
  }
});

test('manifest and auth use current identity/app URL env names', () => {
  const manifest = read('youeye-app.yaml');
  assert.match(manifest, /IDENTITY_URL/);
  assert.match(manifest, /IDENTITY_INTERNAL_URL/);
  assert.match(manifest, /IDENTITY_CLIENT_ID/);
  assert.match(manifest, /IDENTITY_CLIENT_SECRET/);
  assert.match(manifest, /APP_EXTERNAL_URL/);
  assert.doesNotMatch(manifest, /AUTHENTIK_|MYAPP_EXTERNAL_URL/);

  const auth = read('src/lib/auth/authentik.ts');
  assert.match(auth, /IDENTITY_CLIENT_ID/);
  assert.match(auth, /AUTHENTIK_CLIENT_ID/);
});

test('legacy manifest fields are absent from Canvas public types', () => {
  const types = read('src/lib/types/index.ts');
  assert.doesNotMatch(types, /widgets\?|info_cards\?|timeline_embeds\?/);
  assert.doesNotMatch(types, /interface WidgetManifest|interface InfoCardManifest|interface TimelineEmbedManifest/);
});
