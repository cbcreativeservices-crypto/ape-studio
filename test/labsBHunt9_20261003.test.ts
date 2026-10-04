/**
 * LABS B — hunt 9 (2026-10-03). Receipts.
 *
 * 1. Drum Tuning Lab, Chapter 6 (Tuning a kit): "Build the tom range" was
 *    credited for a range never heard. ▶ BOTH on the upside-down starting
 *    pair (140 / 160 Hz, UNBALANCED) set the one-way `heardBoth` flag; a
 *    fader ride to DISTINCT then banked the interactive with the distinct
 *    pair never played ("Reach DISTINCT and hear ▶ BOTH"; the Chapter 4
 *    rule: heard per setup). The credit now needs ▶ BOTH heard AT DISTINCT.
 * 2. Cymatics Pattern Gallery, art board: "Save failed — retry" skipped the
 *    autosave's rules — a slow retry landing after a newer edit's failed
 *    save read "Artwork saved ✓" over unsaved work; a landed retry left
 *    `dirty` set (the leave-flush re-wrote and could warn "not saved" about
 *    saved work); the gallery's thumbnail cache never heard it.
 * 3. A failed tone START was silent in three labs (the hunt-7 Cymatics
 *    Nodes / Harmonics rule): Cymatics Harmony, Digital Audio's Nyquist
 *    sampling (PLAY INPUT / PREDICTED ALIAS) and the Foundations course voice.
 *    The button just stayed PLAY; AUDIO_UNAVAILABLE_MESSAGE is now said.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** Comments out, so a receipt reads code only. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('Drum Ch6: the tom-range credit needs ▶ BOTH heard at a DISTINCT pair', () => {
  const s = code(read('src/screens/lab/drumtuning/modules/ch6Kit.tsx'));
  // The timer records whether the pair heard was distinct…
  assert.match(s, /const atDistinct = verdict\.kind === 'distinct';[\s\S]*?if \(atDistinct\) setHeardDistinct\(true\);/);
  // …and the credit reads that, never the one-way "heard anything" flag.
  assert.match(s, /if \(verdict\.kind === 'distinct' && heardDistinct && !reported\.current\)/);
  assert.doesNotMatch(s, /verdict\.kind === 'distinct' && heardBoth && !reported\.current/);
});

test('Cymatics art board: RETRY lands like the autosave (latest-edit guard, dirty, gallery cache)', () => {
  const s = code(read('src/screens/lab/cymatics/GalleryArt.tsx'));
  assert.doesNotMatch(s, /onPress=\{\(\) => void patternStore\(\)\.saveArtwork\(art\)\.then\(\(ok\) => setSaveState/);
  assert.match(s, /onPress=\{retrySave\}/);
  const at = s.indexOf('const retrySave = () =>');
  assert.ok(at > 0, 'retrySave exists');
  const fn = s.slice(at, at + 400);
  assert.match(fn, /if \(ok\) onArtwork\(a\);\s*if \(latest\.current !== a\) return;\s*setSaveState\(ok \? 'saved' : 'failed'\);\s*dirty\.current = !ok;/);
});

test('a refused tone start is SAID in Cymatics Harmony, Digital sampling and the Foundations course', () => {
  for (const [p, catches] of [
    ['src/screens/lab/cymatics/modules/modHarmony.tsx', 1],
    ['src/screens/lab/digital/modules/modAnalog.tsx', 1],
    ['src/screens/lab/foundations/FoundationsCourseScreen.tsx', 3],
  ] as const) {
    const s = code(read(p));
    const said = s.match(/catch \{\s*if \((?:g === gen\.current|gen === genRef\.current)\) setError\(AUDIO_UNAVAILABLE_MESSAGE\);\s*\}/g) ?? [];
    assert.equal(said.length, catches, `${p}: every start's catch says the failure`);
    assert.match(s, /\{tone\.error \? <Text style=\{\[[^\]]+\]\}>\{tone\.error\}<\/Text> : null\}/, `${p}: the error is rendered`);
  }
});
