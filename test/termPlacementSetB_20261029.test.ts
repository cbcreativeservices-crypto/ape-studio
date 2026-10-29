/**
 * Comp A 2026-10-29 (term placement Set B applied on the server) + owner
 * "fix the blank wait" on the certificate viewer (D15).
 *
 *  1. A term that left a topic must not earn study credit there.
 *  2. One offline event naming a moved term must not throw away the batch.
 *  3. Certificate frames: same-origin (fast paint), never scripts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

test('studyDisplayPct skips keys outside the current term list', () => {
  const api = read('src/features/study/api.ts');
  assert.match(api, /currentIds\?: ReadonlySet<string>,\n\): number \{/);
  assert.match(api, /if \(currentIds && !currentIds\.has\(key\)\) continue;/);
});

test('every study screen passes its current item ids', () => {
  for (const [f, m] of [
    ['FlashcardsScreen', 'flashcards'],
    ['FillInBlankScreen', 'fill_in_blank'],
    ['MatchingScreen', 'matching'],
  ]) {
    const src = read(`src/screens/study/${f}.tsx`);
    assert.ok(
      src.includes(`studyDisplayPct(states, items.length, '${m}', 1, new Set(items.map((i) => i.id)))`),
      `${f} must pass the topic's current ids`,
    );
  }
});

test('invalid_event retries once with only current terms before dropping', () => {
  const sync = read('src/features/study/sync.ts');
  assert.match(sync, /async function currentTopicTermIds\(achievementId: string\)/);
  assert.match(sync, /\.range\(from, from \+ PAGE - 1\)/, 'term list must be paged');
  assert.match(sync, /if \(keep\) ev = ev\.filter\(\(x\) => keep\.has\(x\.item\)\);/);
  const retry = sync.indexOf('/invalid_event/i.test(');
  const drop = sync.indexOf("'[study-sync] dropping permanently rejected queued batch:'");
  assert.ok(retry > 0 && drop > retry, 'the retry must come before the drop');
  assert.match(sync, /await sendChunks\(buildChunks\(left, keep\)\);/);
  // An unreadable term list keeps the batch for the next loop, never drops it.
  assert.match(sync, /\} else if \(!keep\) \{\n\s+continue;/);
});

test('certificate frames are same-origin but can never run scripts', () => {
  const g = read('web/components/CertificateGallery.tsx');
  assert.match(g, /const SANDBOX = "allow-same-origin";/);
  assert.doesNotMatch(g, /const SANDBOX = "[^"]*allow-scripts/);
  assert.equal((g.match(/sandbox=\{SANDBOX\}/g) ?? []).length, 2);
  assert.doesNotMatch(g, /^\s+sandbox="/m, 'no hard-coded sandbox attribute');
  assert.match(g, /Loading certificate…/);
  assert.match(g, /fonts\.ready\.then\(mark, mark\)/);
});
