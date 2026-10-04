/**
 * Shared area, hunt 9 (2026-10-03) — receipts.
 *
 * 1 · (correction to deep-dive A, d44fcee4) LabRequirementsSheet swapped its
 *     "n of N labs complete" summary for CREDENTIAL_LAB_PROGRESS_UNREADABLE
 *     when labCompletion could not be read — but the rows under it still drew
 *     an empty ○ and told a screen reader "Not started." for every lab the
 *     stand-in copy lacked, plus a session-only "2 of 12" partial. D51: a
 *     failed read is never shown as "not started". LabChecklist now takes
 *     `unreadable`; a tracked, not-done row reads "?" / "Progress could not
 *     be read." with no partial, and the sheet passes its flag to both lists.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
/** Comments out, so a mention in prose never passes. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('1 · the requirements sheet hands its unreadable flag to BOTH checklists', () => {
  const src = code(read('src/components/LabRequirementsSheet.tsx'));
  const lists = src.match(/<LabChecklist\b[^>]*\/>/g) ?? [];
  assert.equal(lists.length, 2);
  for (const l of lists) assert.match(l, /unreadable=\{progressUnreadable\}/);
});

test('1 · LabChecklist never says "Not started" (or draws ○ / a partial) for an unknown row', () => {
  const src = code(read('src/components/LabChecklist.tsx'));
  assert.match(src, /unreadable\?:\s*boolean/);
  assert.match(src, /const unknown = !!unreadable && r\.tracked && !r\.done/);
  // The empty box is only drawn once `unknown` has been ruled out.
  assert.match(src, /r\.done \? '✓' : unknown \? '\?' : '○'/);
  // The partial count is a stand-in under an unreadable read.
  assert.match(src, /const partial = !unknown &&/);
  // Every "Not started." in a label sits behind an `unknown` check.
  const labels = src.split("'Not started.'").length - 1;
  const guarded = (src.match(/unknown\s*\?\s*'Progress could not be read\.'\s*:\s*(?:partial[\s\S]{0,160}?)?'Not started\.'/g) ?? []).length;
  assert.equal(labels, 2);
  assert.equal(guarded, 2);
});
