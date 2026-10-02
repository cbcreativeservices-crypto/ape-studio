/**
 * LABS B — evening toddler hunt, pass 2 (2026-10-02). Receipts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const between = (src: string, a: string, b: string) => {
  const i = src.indexOf(a);
  assert.ok(i >= 0, `missing ${a}`);
  const j = src.indexOf(b, i + a.length);
  assert.ok(j > i, `missing ${b} after ${a}`);
  return src.slice(i, j);
};

// 1. Drum Tuning: FINISH › queues a read behind every pending write; a fast
//    ‹ PREV (or a CONTENTS jump) before it landed had the what's-left screen
//    open over the page the learner had just moved to. The Mastering fence.
test('drum tuning: a FINISH read that lands after a move does not open the end screen', () => {
  const src = read('src/screens/lab/drumtuning/DrumTuningLabScreen.tsx');
  const showEnd = between(src, 'const showEnd = useCallback(', 'const beforeAdvance');
  assert.match(showEnd, /const seq = \+\+navSeqRef\.current;/);
  assert.match(showEnd, /if \(seq === navSeqRef\.current\) setEndState\(s\);/);
  assert.doesNotMatch(showEnd, /\.then\(setEndState\)/);
  // Every move bumps the fence: a chapter open, a step, leaving the end screen.
  assert.match(between(src, 'const openModule = useCallback(', 'void updateDrumProgress'), /navSeqRef\.current\+\+;/);
  assert.match(between(src, 'const setStep = useCallback(', 'void updateDrumProgress'), /navSeqRef\.current\+\+;/);
  assert.match(between(src, 'const unEnd = useCallback(', '}, []);'), /navSeqRef\.current\+\+;/);
});

// 2. CORRECTION to pass 1 (Gallery drafts): DUPLICATE with a name or note
//    still being typed copied the STORED text; the draft was flushed onto the
//    original only when the copy opened, so the copy on screen showed the old
//    text. The drafts are written first and the copy waits for that chain.
test('gallery: duplicate writes the typed drafts first and copies after them', () => {
  const src = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  const dup = between(src, 'const doDuplicate = () => {', 'const doDelete');
  const flushAt = dup.indexOf('flushDrafts();');
  const copyAt = dup.indexOf('duplicate(id)');
  assert.ok(flushAt > 0 && copyAt > flushAt, 'drafts flushed before the copy');
  assert.match(dup, /editChain\.current\s*\.then\(\(\) => duplicate\(id\)\)/);
});

// 3. Art board: the unmount flush was fire-and-forget — a refused write lost
//    the colouring without a word, and the gallery thumbnail (fed before the
//    write resolved) showed it as kept. Said now, and the cache hears only a
//    write that landed.
test('gallery art: a refused save is said on leaving and never reaches the thumbnail cache', () => {
  const src = read('src/screens/lab/cymatics/GalleryArt.tsx');
  const flush = between(src, 'if (dirty.current) {', '// eslint-disable-next-line');
  assert.match(flush, /\.saveArtwork\(a\)\s*\.then\(\(ok\) => \{\s*if \(ok\) onArtwork\(a\);\s*else notify\(/);
  const autosave = between(src, 'const t = setTimeout(() => {', '}, 500);');
  assert.match(autosave, /\.then\(\(ok\) => \{[\s\S]*if \(ok\) onArtwork\(art\);/);
  assert.doesNotMatch(autosave, /\}\);\s*onArtwork\(art\);/, 'no cache update ahead of the write');
});
