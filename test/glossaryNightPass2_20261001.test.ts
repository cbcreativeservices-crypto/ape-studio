/**
 * Glossary "toddler + cat + timing" — night bug pass 2 of 3, 2026-10-01.
 *
 *  1. alignDefinitionTier's unqueued fast path read the tier on disk while an
 *     align for the OTHER tier was still queued behind a term save, returned
 *     "already aligned", and the queued align then re-tagged the store under
 *     the wrong tier: a member's full text filed as a free reader's offline
 *     copy (or a free reader's teasers as a member's "saved" text). While any
 *     align waits, every align queues.
 *  2. The background save read the term-list stats unqueued, mid-saveTerms,
 *     saw "incomplete" and re-paged the whole term list. It now waits for the
 *     writes already queued.
 *  3. The Glossary Links toggle: a tap before the stored preference was read
 *     was flipped back by the late read.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const body = (src: string, start: string, len = 1500) => {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `not found: ${start}`);
  return src.slice(i, i + len);
};

test('the tier fast path is skipped while another align is queued', () => {
  const native = read('src/features/glossary/offlineCorpus.native.ts');
  assert.match(native, /const aligning = new Map<string, number>\(\);/);
  const fn = body(native, 'export async function alignDefinitionTier', 500);
  // Checked before AND after the awaited meta read.
  assert.match(
    fn,
    /if \(!aligning\.has\(src\) && \(await getMeta\(tierKey\(src\)\)\) === tier && !aligning\.has\(src\)\) return;/,
  );
  const inc = fn.indexOf('aligning.set(src, (aligning.get(src) ?? 0) + 1);');
  const run = fn.indexOf('await serial(() => alignNow(src, tier));');
  const done = fn.indexOf('alignDone(src);');
  assert.ok(inc > 0 && run > inc && done > run, 'the pending count must span the queued align');
  assert.match(fn, /\} finally \{\s*alignDone\(src\);/, 'a failed align must not leave the count raised');
});

test('the background save waits for queued writes before judging the term list', () => {
  const pre = read('src/features/glossary/offlinePrefetch.ts');
  const settle = pre.indexOf('await writesSettled();');
  const stats = pre.indexOf('const stats = await corpusStats(table);');
  assert.ok(settle > 0 && stats > settle, 'stats read before the queued term save finished');
  const native = read('src/features/glossary/offlineCorpus.native.ts');
  assert.match(native, /export function writesSettled\(\): Promise<void> \{\s*return serial\(async \(\) => \{\}\);/);
  const web = read('src/features/glossary/offlineCorpus.ts');
  assert.match(web, /export async function writesSettled\(\): Promise<void> \{\}/);
});

test('a links-toggle tap is not undone by the late preference read', () => {
  const pref = read('src/features/glossary/linksPref.ts');
  assert.match(pref, /if \(alive && raw != null && !touchedRef\.current\) setOn\(raw === '1'\);/);
  assert.match(pref, /const set = useCallback\(\(v: boolean\) => \{\s*touchedRef\.current = true;/);
});
