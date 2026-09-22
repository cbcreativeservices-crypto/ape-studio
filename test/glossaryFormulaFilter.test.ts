/**
 * The glossary formula pass must filter SERVER-SIDE.
 *
 * ⛔ WHAT THIS PINS — a production app hang, caught by Sentry (APE-STUDIO-F,
 * 2026-09-21) on a tester's iPhone 16 Pro running iOS 27, build 1.0.0 (28).
 *
 * `fetchAllGlossaryFormulas` paged the ENTIRE glossary corpus with a bare
 * select and discarded the rows with no formula on the device. The breadcrumbs
 * show what that costs: 27 sequential 1000-row requests about 230 ms apart,
 * each parsed on the JS thread, the last one at `offset=22000` — and 34 ms
 * after it landed, "App hanging for at least 2000 ms". The device had 112 MiB
 * free.
 *
 * Two stale comments hid it. They said no client role held a SELECT grant on
 * the formula columns and that "0 of 14,246 rows" carried a formula, which
 * made the scan look free. Checked against production on 2026-09-21: anon and
 * authenticated BOTH hold the grant, and 1,911 of 26,975 rows carry a formula.
 * The scan was always wasteful and simply got slower as the corpus grew.
 *
 * Filtering in the query fetches 1,911 rows in 2 pages instead of 26,975 in
 * 27. This is a source-text guard because the query is built inline in the
 * screen and there is no seam to call it through — the thing worth pinning is
 * that the filter is still ON the query, not that the function returns a map.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');

/** The body of fetchAllGlossaryFormulas, so a filter elsewhere cannot satisfy this. */
function formulaFetcher(): string {
  const start = SRC.indexOf('async function fetchAllGlossaryFormulas');
  assert.ok(start > -1, 'fetchAllGlossaryFormulas has been renamed — update this test, do not delete it');
  const end = SRC.indexOf('\n}', start);
  assert.ok(end > start, 'could not find the end of fetchAllGlossaryFormulas');
  return SRC.slice(start, end);
}

test('the formula query excludes NULL formulas in the request, not on the device', () => {
  const body = formulaFetcher();
  assert.match(
    body,
    /\.not\(\s*'formula_symbolic'\s*,\s*'is'\s*,\s*null\s*\)/,
    'the paged formula fetch must filter out NULL formula_symbolic server-side',
  );
});

test('the formula query also excludes empty-string formulas', () => {
  assert.match(
    formulaFetcher(),
    /\.neq\(\s*'formula_symbolic'\s*,\s*''\s*\)/,
    "empty strings are not NULL — without .neq('formula_symbolic','') they all come down too",
  );
});

test('the device-side trim check stays — it is the authority on what counts', () => {
  // `neq ''` does not catch a whitespace-only value, so the client check is
  // still load-bearing. Removing it would let "   " appear as a formula.
  assert.match(
    formulaFetcher(),
    /formula_symbolic\.trim\(\)\s*!==\s*''/,
    'the trim() guard must remain alongside the server-side filter',
  );
});

test('the fetch still pages — the filtered set must not be capped at one page', () => {
  const body = formulaFetcher();
  assert.match(body, /\.range\(/, 'the fetch must still use .range() paging');
  assert.match(body, /for\s*\(/, 'the fetch must still loop over pages');
});
