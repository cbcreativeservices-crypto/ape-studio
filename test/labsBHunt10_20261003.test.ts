/**
 * LABS B — hunt 10 (2026-10-03). Receipts.
 *
 * 1. (correction to hunt 9) Drum Tuning Lab, Chapter 6 REVIEW: after hunt 9
 *    tied the tom-range credit to ▶ BOTH heard AT DISTINCT (heardDistinct),
 *    the REVIEW's "your run" line still read the one-way `heardBoth`: ▶ BOTH
 *    on the starting UNBALANCED pair, then a ride to green, read
 *    "DISTINCT, both heard." while the credit had not landed.
 * 2. Drum Tuning Lab, Chapter 6 REVIEW: "Tuning notes on this device: N"
 *    counted a guest's session notes and the NOT SAVED ones — the list's own
 *    heading says "THIS SESSION — …" / NOT SAVED for those.
 * 3. Drum Tuning Lab, Chapter 6 notes list: when the stored progress (the
 *    notes live in the same row) could not be read, the list read "No notes
 *    saved yet." over notes that are on the device (D51 three faces).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** Comments out, so a receipt reads code only. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const CH6 = 'src/screens/lab/drumtuning/modules/ch6Kit.tsx';

test('Drum Ch6 REVIEW: "both heard" at DISTINCT is the credit\'s own evidence (heardDistinct)', () => {
  const s = code(read(CH6));
  assert.doesNotMatch(s, /\$\{heardBoth \? ', both heard'/);
  assert.match(s, /\(verdict\.kind === 'distinct' \? heardDistinct : heardBoth\) \? ', both heard'/);
});

test('Drum Ch6 REVIEW: session / NOT SAVED notes are never counted as "on this device"', () => {
  const s = code(read(CH6));
  assert.doesNotMatch(s, /`Tuning notes on this device: \$\{notes\.length\}\.`/);
  assert.match(s, /guest \|\| account \? `Tuning notes this session, not saved on this device: \$\{notes\.length\}\.` : `Tuning notes on this device: \$\{sorted\.length - unsavedCount\}\.`/);
});

test('Drum Ch6 notes list: an unreadable progress row is said, never "No notes saved yet"', () => {
  const s = code(read(CH6));
  assert.match(s, /notesUnreadable \? PROGRESS_UNREADABLE : 'No notes saved yet\.'/);
  assert.doesNotMatch(s, /<Body>No notes saved yet\.<\/Body>/);
  const host = code(read('src/screens/lab/drumtuning/DrumTuningLabScreen.tsx'));
  assert.match(host, /notesUnreadable=\{progressUnreadable\}/);
  const shared = code(read('src/screens/lab/drumtuning/modules/shared.tsx'));
  assert.match(shared, /notesUnreadable\?: boolean;/);
});
