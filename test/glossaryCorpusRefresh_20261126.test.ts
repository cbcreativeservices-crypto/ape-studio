/**
 * Receipt D88 (owner GO 2026-11-26, "go ahead with the glossary refresh fix").
 *
 * The phone's stored glossary was refreshed only when get_glossary_term_count
 * changed, so the 2026-11-23 merge (2,125 names moved into kept cards'
 * also_called) could not reach a phone that already held a copy. A content
 * version mark now forces ONE re-download; fresh downloads carry the mark.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

const src = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const body = (() => {
  const i = src.indexOf('async function revalidateCorpus(');
  assert.ok(i > 0, 'revalidateCorpus exists');
  return src.slice(i, src.indexOf('\n}\n', i));
})();

it('a content version mark exists, keyed per table', () => {
  assert.match(src, /const CORPUS_CONTENT_REV = '2026-11-26-also-called';/);
  assert.match(src, /const corpusRevKey = \(table: string\) => `corpus_rev:\$\{table\}`;/);
});

it('a stale or missing mark re-downloads even when the count has not moved', () => {
  // The count RPC is consulted ONLY inside `if (revCurrent)`.
  const gate = body.indexOf('if (revCurrent) {');
  const rpc = body.indexOf("supabase.rpc('get_glossary_term_count')");
  // (2026-11-27) the early return now also waits on the shown total (names changed).
  const close = body.indexOf('if (!cardsChanged && !namesChanged) return;');
  const fetch = body.indexOf('const fresh = await fetchCorpusTerms(table);');
  assert.ok(body.includes('const revCurrent = rev === CORPUS_CONTENT_REV;'));
  assert.ok(gate > 0 && rpc > gate && close > rpc && fetch > close, `${gate} ${rpc} ${close} ${fetch}`);
});

it('the mark is written only after the new copy is saved (a failed download retries next start)', () => {
  const save = body.indexOf('await saveStoredTerms(table, fresh);');
  const mark = body.indexOf('await setStoredMeta(corpusRevKey(table), CORPUS_CONTENT_REV);');
  assert.ok(save > 0 && mark > save, 'saveStoredTerms before setStoredMeta');
});

it('a first download carries the mark, so a new install does not download twice', () => {
  // (2026-11-27) it also records the shown total it was downloaded for.
  assert.match(src, /void saveStoredTerms\(table, terms\)\n\s*\.then\(\(\) => setStoredMeta\(corpusRevKey\(table\), CORPUS_CONTENT_REV\)\)\n\s*\.then\(\(\) => \(shown != null \? setStoredMeta\(corpusShownKey\(table\), String\(shown\)\) : undefined\)\)\n\s*\.catch\(\(\) => \{\}\);/);
});

it('definitions stay out of the corpus select (the ⛔ note stands)', () => {
  const f = readFileSync(new URL('../src/features/glossary/corpusFetch.ts', import.meta.url), 'utf8');
  const fetchFn = f.slice(f.indexOf('export async function fetchCorpusTerms'));
  assert.ok(fetchFn.length > 0);
  assert.ok(fetchFn.slice(0, 2000).includes(".select('id, term, achievement_id, also_called')"));
});
