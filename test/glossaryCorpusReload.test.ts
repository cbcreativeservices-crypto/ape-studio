/**
 * GUARD — returning to the app must not freeze it on the Glossary.
 *
 * Owner report 2026-09-22: "my iphone froze the app when i received and viewed
 * a sms message - when i returned the app was frozen." Sentry APE-STUDIO-F,
 * iPhone 16 Pro / iOS 27 / build 28, production: "App hanging for at least
 * 2000 ms", with `glossary_browse_v` paging calls at offsets 19000–22000 as the
 * last breadcrumbs and 112 MiB of free memory.
 *
 * Three separate defects combined into the freeze, and this file pins all three
 * because fixing any one of them alone leaves the report reproducible:
 *
 *  1. The cache-release valve dropped the whole corpus after 60 s in the
 *     background — while its own comment promised that "checking a message"
 *     would not cost a reload. Reading a text takes longer than a minute.
 *  2. The reload did not set the loading state, so the previous list stayed on
 *     screen and simply stopped responding. Busy looked identical to crashed.
 *  3. The paging loops never yielded, so nothing queued — touches, timers, a
 *     re-render — could run until all 27 pages had been fetched and parsed.
 *
 * Also pinned: the server-side formula filter, which is what cuts that loader
 * from 27 pages to 2 (1,911 of 26,975 rows carry a formula, verified against
 * production). It is load-bearing for this freeze, not an optimisation.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src', 'screens', 'glossary', 'GlossaryScreen.tsx');
const raw = readFileSync(SRC, 'utf8');

/** Every defect below is DESCRIBED in a comment in that file — matching prose
 *  would let the guard pass on its own documentation. */
function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
const code = stripComments(raw);

describe('the Glossary corpus cannot silently freeze the app', () => {
  test('the background cache-release window covers reading a message', () => {
    const m = code.match(/const CACHE_RELEASE_MS\s*=\s*(\d+)/);
    assert.ok(m, 'CACHE_RELEASE_MS is gone — if the release valve was removed, re-verify this whole guard');
    const ms = Number(m[1]);
    assert.ok(
      ms >= 300000,
      `CACHE_RELEASE_MS is ${ms} ms. Anything under five minutes drops the corpus while the user is reading a text, and coming back re-pages 26,975 rows.`,
    );
  });

  test('every corpus paging loop yields to the UI', () => {
    // Three loaders: media and formulas in the screen, the term corpus in the
    // shared corpusFetch module it was extracted to on 2026-09-22.
    const fetchSrc = readFileSync(join(process.cwd(), 'src', 'features', 'glossary', 'corpusFetch.ts'), 'utf8');
    const yields = (code.match(/await yieldToUi\(\)/g) ?? []).length
      + (fetchSrc.match(/await yieldToUi\(\)/g) ?? []).length;
    assert.ok(
      yields >= 3,
      `only ${yields} paging loop(s) yield. A loop that pages without yielding blocks touches for the whole load.`,
    );
    assert.match(fetchSrc, /export function yieldToUi\(\)/, 'yieldToUi is gone');
  });

  test('a reload announces itself instead of freezing a drawn screen', () => {
    assert.match(
      code,
      /if \(alive && corpusNeedsLoad\(table\)\) setLoading\(true\)/,
      'the focus effect no longer sets the loading state when the cache is empty, so a re-page happens behind a fully drawn, unresponsive list',
    );
    // Table-aware: a sign-in swaps the table and re-pages just as long.
    assert.match(code, /ENTRIES_CACHE === null \|\| ENTRIES_TABLE !== table/);
  });

  test('the formula pass still filters server-side', () => {
    // This is what makes that loader 2 pages instead of 27.
    assert.match(code, /\.not\('formula_symbolic', 'is', null\)/);
    assert.match(code, /\.neq\('formula_symbolic', ''\)/);
  });
});
