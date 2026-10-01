/**
 * Bug pass 2026-09-30 — Labs group A ("toddler + cat"). Source-reading pins
 * for the fixes, so each one cannot quietly regress:
 *
 *   • PREV on a lab's WHAT'S LEFT screen goes back to the LAST module (it used
 *     to run goToModule(idx - 1) and skip it) — every module host + Foundations.
 *   • The lab menu opens ONE lab per tap: two glass tiles tapped together no
 *     longer stack two labs (and the lock runs before a preview is armed).
 *   • Start Here: turning VIBRATION off / picking YOUR VOICE cancels a PLAY
 *     that is still starting; the sorter reports "all done" from an effect,
 *     never from inside a setState updater.
 *   • EQ trainers: moving a band clears the last CHECK verdict.
 *   • Cymatics: reopening the SAME saved pattern re-applies it (keyed on the
 *     params object); a deleted pattern leaves the compare selection.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { navView } from '../src/screens/lab/kit/labNav.ts';

const read = (p: string) => readFileSync(p, 'utf8');

test("PREV on WHAT'S LEFT returns to the last module in every module host", () => {
  // Behaviour (the shared strip, WP1 2026-09-30): on the end screen PREV is
  // live and reads "back to the last module"; the hook routes it to the
  // host's unEnd, never to go(idx - 1).
  const end = navView(4, 5, true);
  assert.equal(end.prevOn, true);
  assert.equal(end.a11y.prev, 'Back to the last module');
  for (const p of [
    'src/screens/lab/digital/DigitalModuleScreen.tsx',
    'src/screens/lab/wave/WaveModuleScreen.tsx',
    'src/screens/lab/gain/GainModuleScreen.tsx',
    'src/screens/lab/eq/EqModuleScreen.tsx',
    'src/screens/lab/cymatics/CymaticsModuleScreen.tsx',
  ]) {
    const src = read(p);
    assert.match(src, /from '\.\.\/kit\/LabNavBar'/, `${p} uses LabNavBar`);
    assert.match(src, /unEnd: \(\) => setEnding\(false\),/, p);
    assert.doesNotMatch(src, /onPress=\{\(\) => goToModule\(idx - 1\)\}/, p);
  }
  // Foundations is on the shared strip (2026-09-30): useLabNav's PREV calls
  // `unEnd` on the end screen (back to Module 14) and `go(step - 1)` otherwise.
  const fos = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
  assert.match(fos, /const unEnd = useCallback\(\(\) => setEnding\(false\), \[\]\);/);
  assert.match(fos, /useLabNav\(\{[^}]*ending, go: goTo, finish, unEnd \}\)/);
  assert.match(fos, /<LabNavBar nav=\{nav\} \/>/);
});

test('the lab menu opens one lab per tap, locked before a preview is armed', () => {
  const src = read('src/screens/lab/EarLabScreen.tsx');
  assert.match(src, /const claimOpen = \(\) =>/);
  assert.match(src, /if \(!leaf\.route \|\| !claimOpen\(\)\) return;\s*\n\s*if \(leafLocked\(leaf, sec\)\) startLabPreview/);
  assert.match(src, /if \(cat\.kind !== 'hub' \|\| !claimOpen\(\)\) return;/);
});

test('Start Here cancels a starting tone when the page takes the sound away', () => {
  const src = read('src/screens/startHere/pages.tsx');
  assert.match(src, /if \(vib\) tone\.stop\(\);/);
  assert.match(src, /if \(id === 'voice'\) tone\.stop\(\);/);
  assert.doesNotMatch(src, /tone\.playing\) tone\.stop\(\)/);
});

test('the sorter reports completion from an effect, not a state updater', () => {
  const src = read('src/screens/startHere/bits.tsx');
  assert.match(src, /setAnswers\(\(a\) => \(\{ \.\.\.a, \[i\]: bin \}\)\);/);
  assert.match(src, /useEffect\(\(\) => \{\s*\n\s*if \(allDone\) onAllDoneRef\.current\?\.\(\);/);
});

test('EQ trainers clear the verdict when a band moves', () => {
  const ff = read('src/screens/lab/eq/modules/FindFrequency.tsx');
  assert.match(ff, /const setSel = \(patch: Partial<UserBand>\) => \{\s*\n\s*setVerdict\(null\);/);
  const fs = read('src/screens/lab/eq/modules/FixSignal.tsx');
  assert.match(fs, /const moveBand = [^\n]*\n\s*setChecked\(null\);/);
  assert.equal((fs.match(/onChange: \(t\) => moveBand\(/g) ?? []).length, 3);
  assert.doesNotMatch(fs, /onChange: \(t\) => setBand\(/);
});

test('cymatics: reopening the same saved pattern re-applies it; delete prunes compare', () => {
  for (const p of [
    'src/screens/lab/cymatics/PlateStudioScreen.tsx',
    'src/screens/lab/cymatics/LiquidStudioScreen.tsx',
    'src/screens/lab/cymatics/MembraneStudioScreen.tsx',
  ]) {
    const src = read(p);
    assert.match(src, /\}, \[route\.params\]\);/, p);
    assert.doesNotMatch(src, /\}, \[savedId\]\);/, p);
  }
  const gal = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  assert.match(gal, /setCompareIds\(\(ids\) => ids\.filter\(\(x\) => x !== current\.id\)\);/);
});
