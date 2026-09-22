/**
 * GUARD — the glossary corpus load must not carry definitions.
 *
 * Owner 2026-09-22, after Discovery B/C took the corpus from 26,975 to 31,858
 * terms: "opening the glossary seems to brick the app" — the list drew and then
 * nothing responded to taps or scrolling.
 *
 * Measured against production at the time:
 *   definition     3,814 kB   <- 70% of the payload
 *   term             562 kB
 *   id               498 kB
 *   achievement_id   498 kB
 *   plain_english        0    <- NULL for ALL 31,858 rows, fetched every time
 *
 * The screen selected all five for all 31,858 rows and built an object per row
 * on the JS thread. Yielding between pages (added earlier the same day) let the
 * UI breathe DURING the load but could not make the load smaller — the thread
 * still had to construct the whole thing before the list settled.
 *
 * Now the corpus carries id + term + achievement_id (~1.5 MB) and definitions
 * are fetched for the rows actually drawn. Search reads only `term`
 * (`searchRank`), so finding a term never depended on the definitions.
 *
 * ⛔ This will keep growing. Re-adding `definition` to the bulk select is the
 * regression this file exists to catch.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const code = strip(readFileSync(join(process.cwd(), 'src', 'screens', 'glossary', 'GlossaryScreen.tsx'), 'utf8'));
/* The corpus reads were extracted to a shared module (2026-09-22) so the screen
   and the background prefetch cannot drift apart. The guards follow them. */
const fetchSrc = strip(readFileSync(join(process.cwd(), 'src', 'features', 'glossary', 'corpusFetch.ts'), 'utf8'));

describe('glossary loads terms first, definitions on demand', () => {
  test('the corpus select does NOT pull definitions', () => {
    // The one corpus select, identified by its ordering by term. It lives in
    // corpusFetch since the extraction — the screen no longer queries directly.
    const m = fetchSrc.match(/\.select\('([^']*)'\)\s*\n\s*\.order\('term'\)/);
    assert.ok(m, 'the corpus select changed shape — re-verify this guard');
    const cols = m[1];
    assert.ok(!/\bdefinition\b/.test(cols), `the corpus select pulls definitions again (${cols}) — that is 70% of the payload across every row`);
    assert.ok(!/\bplain_english\b/.test(cols), `the corpus select pulls plain_english (${cols}), which is NULL for every row`);
    assert.match(cols, /\bterm\b/);
    assert.match(cols, /\bid\b/);
  });

  test('there is a batched definition fetch', () => {
    assert.match(fetchSrc, /export async function fetchDefinitionsFor/, 'the batched definition fetch is gone');
    assert.match(fetchSrc, /\.in\('id', ids\)/, 'definitions are no longer fetched by id batch');
  });

  test('rows request their own definition when drawn', () => {
    // renderItem-driven, deliberately: onViewableItemsChanged was tried first
    // and fired no request at all.
    assert.match(code, /if \(!item\.definition\) queueDefinition\(item\.id\)/, 'rows no longer request their definition');
    assert.match(code, /const queueDefinition = useCallback/, 'the coalescing queue is gone');
  });

  test('a failed batch can be retried', () => {
    // Dropping the ids from the requested set is what lets a blank row recover;
    // without it a transient error leaves it blank for the session.
    assert.match(code, /for \(const id of want\) requestedDefsRef\.current\.delete\(id\)/,
      'a failed definition batch is no longer retryable — those rows stay blank forever');
  });

  test('terms opened without being on screen still fetch', () => {
    // Cross-link hops and the popup root open a term the list may never have
    // drawn, so viewport-driven fetching alone would leave them empty.
    const hits = code.match(/ensureDefsRef\.current\(\[id\]\)/g) ?? [];
    assert.ok(hits.length >= 2, `expected the popup and cross-link paths to fetch on open, found ${hits.length}`);
  });
});
