/**
 * Bug pass 3 of 3, 2026-09-30 — Labs group A ("toddler + cat"). Source-reading
 * pins for the third pass's fixes, so each one cannot quietly regress:
 *
 *   • A superseded start may genStop() only while the LAST act was a stop()
 *     (or the gate closed). Pass 2's `stopGen > gen` still fired on ▶ ■ ▶
 *     mashed inside one native start — the first start's genStop landed after
 *     the third's genStart: silence under a lit ■. Course voice, Playground,
 *     EQ audition, Cymatics drive.
 *   • The Cymatics drive no longer drops a ▶ while a start is in flight (pass
 *     2's lock swallowed ▶ after ■, and every ▶ while the output popup was up,
 *     so the gate's re-present-on-second-tap never ran).
 *   • Start Here and the Foundations course wait for the entitlement tier
 *     before restoring a place (the PagedLab rule): a signed-out device no
 *     longer resumes the previous account's page.
 *   • The Gain chain's region label is 44 wide, not 64 — QUIET SOURCE wraps
 *     at the space instead of running into the next column at 360 wide.
 *   • Cymatics home: one screen per tap.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8');

test('a superseded start stops the generator only while the last act was a stop', () => {
  for (const p of [
    'src/screens/lab/foundations/FoundationsCourseScreen.tsx',
    'src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx',
    'src/screens/lab/eq/modules/eqAudition.tsx',
    'src/screens/lab/cymatics/useDriveTone.ts',
  ]) {
    const src = read(p);
    assert.doesNotMatch(src, /stopGenRef\.current > gen/, p);
    // The start fence (startFenced, 2026-10-02) owns the gate and epoch
    // checks; the site's `stop` declines only for 'superseded' while a stop()
    // is not the latest act.
    assert.match(src, /why === 'superseded' && stopGenRef\.current !== genRef\.current(\) return;| \? undefined : ApeDsp\.genStop\(\))/, p);
    assert.match(src, /stopGenRef\.current = \+\+genRef\.current;/, p);
  }
});

test('the Cymatics drive never swallows a ▶ while a start is in flight', () => {
  const src = read('src/screens/lab/cymatics/useDriveTone.ts');
  assert.doesNotMatch(src, /startingRef/);
  assert.match(src, /const start = useCallback\(async \(\) => \{\s*\n\s*if \(!engineReady\) return;/);
});

test('Start Here and the Foundations course restore only once the tier is known', () => {
  const sh = read('src/screens/startHere/StartHereScreen.tsx');
  assert.match(sh, /useEffect\(\(\) => \{\s*\n\s*if \(!resolved\) return;\s*\n\s*let alive = true;\s*\n\s*void loadPagedProgress\(START_HERE_ID\)/);
  // Owner ruling 2026-10-01 (guest work carried at sign-in): the restore also
  // re-runs when the account state changes — still never before `resolved`.
  assert.match(sh, /setPage\(Math\.min\(p\.lastPage, PAGES\.length - 1\)\);\s*\n\s*\}\);\s*\n\s*return \(\) => \{\s*\n\s*alive = false;\s*\n\s*\};\s*\n\s*\}, \[resolved, noAccount\]\);/);
  const fc = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
  assert.match(fc, /if \(!resolved\) return;\s*\n\s*let alive = true;\s*\n\s*void stepStore\.hydrate\(\)/);
  assert.match(fc, /\}, \[resolved\]\);/);
});

test('the Gain chain region label wraps inside 44 pt', () => {
  const src = read('src/screens/lab/gain/gainViz.tsx');
  assert.match(src, /vRegionUnder: \{ width: 44, textAlign: 'center' \}/);
});

test('Cymatics home opens one screen per tap', () => {
  const src = read('src/screens/lab/cymatics/CymaticsHomeScreen.tsx');
  assert.match(src, /if \(now - lastOpenAt\.current < 600\) return;/);
  assert.doesNotMatch(src, /onPress=\{\(\) => goToCymatics\(/);
  assert.equal((src.match(/onPress=\{\(\) => go\('Cymatics[A-Za-z]+', \{\}\)\}/g) ?? []).length, 4);
});
