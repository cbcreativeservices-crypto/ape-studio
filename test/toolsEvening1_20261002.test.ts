/**
 * Evening toddler hunt, pass 1 (2026-10-02) — TOOLS + AUDIO area.
 *
 *  1. ToolInfoScreen: OPEN TOOL / LEARN / DEMO are three different routes with
 *     no shared latch — two fingers stacked two screens. One open per
 *     navigation, the hub's openOnce rule.
 *  2. ExposureCheckin's AUDIO_ROUTES predates most of the labs: routine and
 *     ELEVATED-level check-ins never appeared in Mastering, Drum Tuning, the
 *     Mixing labs, Tuning, Ear Training, Cymatics… Every *Lab route (the
 *     calculator lab excepted) and its module screens must be listed.
 *  3. deleteExposureHistory swallowed a failed delete and the screen emptied
 *     the history list anyway. It now resolves false and the screen says so.
 *
 * Source pins: these are RN screens / RN-importing modules that node cannot
 * load. R2: each test fails against the pre-fix copies.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../src/${rel}`, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');

test('1. ToolInfo: every door goes through one open-per-navigation latch', () => {
  const src = read('screens/tools/ToolInfoScreen.tsx');
  assert.match(src, /const openOnce = \(go: \(\) => void\) => \{/);
  assert.ok(!/onPress=\{\(\) => navigation\.navigate\(/.test(src), 'a bare navigate on a press skips the latch');
  assert.match(src, /if \(r\) openOnce\(/, 'OPEN TOOL goes through the latch');
  const latched = src.match(/openOnce\(\(\) => navigation\.navigate\(/g) ?? [];
  assert.equal(latched.length, 4, 'LEARN, DEMO and both locked keys go through the latch');
});

test('2. every lab route is an audio screen for the exposure check-in', () => {
  const types = read('navigation/types.ts');
  const routes = [...types.matchAll(/^\s+([A-Z][A-Za-z0-9]+)\??:/gm)].map((m) => m[1]);
  const labRoutes = routes.filter(
    (r) =>
      (/Lab$/.test(r) && r !== 'CalcLab') ||
      /^(Cymatics|SoundSystems)/.test(r) ||
      r === 'EarModule' ||
      r === 'AmpModule' ||
      /^Production(Stage|Activity)$/.test(r),
  );
  assert.ok(labRoutes.length > 30, 'route scan found the labs');
  const chk = read('features/audio/ExposureCheckin.tsx');
  const block = chk.match(/AUDIO_ROUTES = new Set<string>\(\[([\s\S]*?)\]\)/);
  assert.ok(block, 'AUDIO_ROUTES found');
  const listed = new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
  const missing = labRoutes.filter((r) => !listed.has(r));
  assert.deepEqual(missing, [], `lab routes with no exposure check-in: ${missing.join(', ')}`);
});

test('3. Delete all exposure history reports a failed delete instead of showing it gone', () => {
  const mon = read('features/audio/exposureMonitor.ts');
  const fn = mon.match(/export async function deleteExposureHistory\(\): Promise<boolean> \{([\s\S]*?)\n\}/);
  assert.ok(fn, 'deleteExposureHistory resolves a boolean');
  assert.match(fn[1], /catch \{\s*ok = false;/);
  assert.match(fn[1], /return ok;/);
  const screen = read('screens/tools/ExposureMonitorScreen.tsx');
  assert.match(screen, /deleteExposureHistory\(\)\.then\(\(deleted\) => \{/);
  assert.match(screen, /'History not deleted'/);
});
