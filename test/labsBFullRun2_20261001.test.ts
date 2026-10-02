/**
 * LABS B — full-app bug run 2 (2026-10-01 evening). Receipts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

for (const f of ['src/screens/lab/drumtuning/DrumTuningLabScreen.tsx', 'src/screens/lab/roomdesign/RoomDesignLabScreen.tsx']) {
  test(`${f}: a members-only lab reads its PREVIEW from the preview store, so a signed-out guest is never promised a carry`, () => {
    const src = read(f);
    // A signed-out guest is always in a preview in a members-only lab
    // (withMembershipPreview arms it); the ledger holds nothing in a preview.
    assert.ok(!/const preview = [^\n]*entitlement !== 'anonymous'/.test(src), 'the preview flag must not exclude an anonymous guest');
    assert.match(src, /const preview = useLabPreview\(\)\.active;/);
    assert.match(src, /import \{ useLabPreview \} from '\.\.\/\.\.\/\.\.\/features\/lab\/labPreviewStore';/);
  });
}

test('cymatics gallery: a rename / notes / favourite the device refused is said, never silent', () => {
  const src = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  const body = src.slice(src.indexOf('const editLatest'), src.indexOf('const rename'));
  assert.ok(!/if \(next\) await upsert\(next\);/.test(body), 'the upsert result must be read');
  assert.match(body, /if \(next && !\(await upsert\(next\)\)\) notify\('Not saved'/);
});

test('cymatics experiment ticks: a tick before the stored ticks LOAD never writes over them', () => {
  const src = read('src/screens/lab/cymatics/ExperimentWell.tsx');
  const body = src.slice(src.indexOf('const toggle = (i: number)'), src.indexOf('const index = EXPERIMENTS.findIndex'));
  assert.match(body, /const toggle = \(i: number\) => \{\s*if \(loadedId !== experiment\.id\) return;/);
  assert.match(body, /setDone\(t\);\s*setLoadedId\(experiment\.id\);/);
});
