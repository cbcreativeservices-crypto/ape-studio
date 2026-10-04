/**
 * Shared area, hunt 8 (2026-10-03) — receipts.
 *
 * 1 · LabReviewButton (Sound Playground, Signal Chain Builder) is the only
 *     progress display those two read-through labs have. 215d7f25 gave every
 *     lab hub the shared ProgressUnreadableNote when labCompletion could not
 *     be read (owner "do 2", D51: a failed read is never shown as "not
 *     started"), but this control was missed: a lab reviewed on an earlier
 *     visit read "MARK AS REVIEWED" as if it never was. It now asks
 *     useLabCompletionUnreadable() and draws the shared note above the button
 *     (the button stays — labs never block; a second mark is idempotent).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
/** Comments out, so a mention in prose never passes. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('1 · LabReviewButton reads the unreadable flag of the completion store', () => {
  const src = code(read('src/features/lab/LabReviewButton.tsx'));
  assert.match(src, /import\s*\{[^}]*\buseLabCompletionUnreadable\b[^}]*\}\s*from\s*'\.\/labCompletion'/);
  assert.match(src, /=\s*useLabCompletionUnreadable\(\)/);
});

test('1 · LabReviewButton draws the shared note (never its own words) when unreadable, and keeps the button', () => {
  const src = code(read('src/features/lab/LabReviewButton.tsx'));
  assert.match(src, /import\s*\{\s*ProgressUnreadableNote\s*\}\s*from\s*'\.\.\/\.\.\/screens\/lab\/kit\/ProgressUnreadableNote'/);
  assert.match(src, /<ProgressUnreadableNote\s*\/>/);
  // The button is still rendered alongside the note — never replaced by it.
  const tail = src.slice(src.indexOf('<ProgressUnreadableNote'));
  assert.match(tail, /\{button\}/);
  // A lab whose mark DID land this session still reads ✓ REVIEWED first.
  assert.ok(src.indexOf('if (complete)') < src.indexOf('<ProgressUnreadableNote'));
});
