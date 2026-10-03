/**
 * LABS B — hunt 5 (2026-10-03). Receipts.
 *
 * Correction to the hunt-4 Cymatics fix (patternsUnreadable): the unreadable
 * notice covered BROWSE only. A studio's "Open the gallery ›" opens the
 * gallery in OPEN mode on the new pattern's id; while the list was loading,
 * or when its READ FAILED, OPEN mode had no pattern to draw and the screen
 * rendered NOTHING under the header — the failed read silent again. OPEN mode
 * now says "Loading…", the unreadable notice, or that the pattern is gone.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('gallery OPEN mode with no pattern to show is never a blank screen', () => {
  const s = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  const at = s.indexOf("{mode === 'open' && !current ? (");
  assert.ok(at > 0, 'OPEN mode has a branch for "no current pattern"');
  const branch = s.slice(at, s.indexOf(') : null}', at));
  assert.match(branch, /patterns === null \? 'Loading…'/, 'still loading is said');
  assert.match(branch, /patternsUnreadable\(patterns\) \? PATTERNS_UNREADABLE/, 'a failed read is said, as in BROWSE');
});

test('gallery: BROWSE and OPEN share the one unreadable notice', () => {
  const s = read('src/screens/lab/cymatics/GalleryScreen.tsx');
  assert.match(s, /const PATTERNS_UNREADABLE = '[^']*could not be read from this device just now/);
  assert.equal(s.match(/\{PATTERNS_UNREADABLE\}|\? PATTERNS_UNREADABLE/g)?.length, 2, 'used in both modes');
});
