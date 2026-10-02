/**
 * Glossary — full-app bug run 2, 2026-10-01.
 *
 * Every one of these is the same shape run 1 fixed for the probe and the mint:
 * a request that STALLS (a socket that stops answering; Android's RN fetch has
 * no timeout of its own) never resolves AND never rejects, so the failure path
 * that already exists never runs.
 *
 *  1. corpusFetch — the on-screen definition batch and every corpus page. The
 *     batch's ids sat in the "already requested" set, so the rows stayed blank
 *     for the visit; a stalled corpus page held the session-cached load (and
 *     every later visit) on the spinner; SAVE ALL could not be stopped.
 *  2. fetchDetails / getDetail (glossary_study_v) — the [72] retry only shows
 *     for a read that answers; a stalled one left "Loading…" forever. The share
 *     hub waits on getDetail before it opens.
 *  3. GlossaryTermPopup's by-name lookup (labs / calculator term chips) — the
 *     spinner stayed up for good, no error, no retry.
 *  4. The topic list read the corpus load waits behind — a stall held the whole
 *     Glossary, device copy included, on its loading card.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withDeadline, softDeadline } from '../src/lib/boundedCall.ts';
import { classifyGatewayError } from '../src/features/glossary/gatewayFault.ts';

const read = (p: string) => readFileSync(p, 'utf8');
const never = <T,>() => () => new Promise<T>(() => {});

test('the helpers really end a stall (reject / fallback)', async () => {
  await assert.rejects(withDeadline(never<number>(), 'x', 20), /timeout/);
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(await softDeadline(never<{ data: null }>(), { data: null }, 'x', 20), { data: null });
  } finally {
    console.warn = warn;
  }
});

test('corpus pages and definition batches are bounded and still reject', () => {
  const src = read('src/features/glossary/corpusFetch.ts');
  assert.match(src, /import \{ withDeadline \} from '\.\.\/\.\.\/lib\/boundedCall';/);
  const terms = src.slice(src.indexOf('export async function fetchCorpusTerms'), src.indexOf('export async function fetchDefinitionsFor'));
  assert.match(terms, /await withDeadline\(\s*\/\/[^\n]*\n\s*async \(\) =>\s*await supabase\s*\.from\(table\)\s*\.select\('id, term, achievement_id'\)/);
  const defs = src.slice(src.indexOf('export async function fetchDefinitionsFor'));
  assert.match(defs, /await withDeadline\(\s*async \(\) => await supabase\.from\(table\)\.select\('id, definition'\)\.in\('id', ids\)/);
  // No raw, unbounded read left in the file.
  assert.equal((src.match(/await supabase/g) ?? []).length, 2);
});

test('the detail body read is bounded, and both callers use it', () => {
  const src = read('src/screens/glossary/GlossaryScreen.tsx');
  assert.match(src, /import \{ softDeadline \} from '\.\.\/\.\.\/lib\/boundedCall';/);
  const helper = src.slice(src.indexOf('async function readStudyDetail'), src.indexOf('function sessionCache'));
  assert.match(helper, /await softDeadline</);
  assert.match(helper, /\{ data: null \},\s*'glossary_study_v detail',\s*DETAIL_DEADLINE_MS/);
  // glossary_study_v is read only inside the helper now.
  assert.equal((src.match(/\.from\('glossary_study_v'\)/g) ?? []).length, 1);
  const fd = src.slice(src.indexOf('const fetchDetails = useCallback('), src.indexOf('const retryDetails'));
  assert.match(fd, /const data = await readStudyDetail\(id\);[\s\S]*if \(!data\) \{\s*setDetailErrs/);
  const gd = src.slice(src.indexOf('const getDetail = useCallback('), src.indexOf('const buildShareTerm'));
  assert.match(gd, /const data = await readStudyDetail\(id\);/);
});

test('the topic list the corpus load waits on is bounded', () => {
  const src = read('src/screens/glossary/GlossaryScreen.tsx');
  const at = src.indexOf(".from('achievements')");
  const block = src.slice(src.lastIndexOf('await Promise.all([', at), src.indexOf(']);', at));
  assert.match(block, /softDeadline<\{ data: unknown\[\] \| null \}>\(/);
  assert.match(block, /\{ data: null \},\s*'glossary topic list',\s*TOPICS_DEADLINE_MS/);
});

test('the term popup lookup is bounded and a stall shows the connection error', () => {
  const src = read('src/features/glossary/GlossaryTermPopup.tsx');
  assert.match(src, /import \{ softDeadline \} from '\.\.\/\.\.\/lib\/boundedCall';/);
  const at = src.indexOf(".ilike('term', termName)");
  const block = src.slice(src.lastIndexOf('await softDeadline', at), at + 400);
  assert.ok(src.lastIndexOf('await softDeadline', at) > src.indexOf('const probe = await probeGateway()'));
  assert.match(block, /\{ data: null, error: \{ message: 'glossary term lookup timeout' \} \}/);
  // That fallback must land in loadError (a retryable "check your connection"),
  // NOT needsKey (which would send a reader with a good key to the Glossary).
  assert.equal(classifyGatewayError({ message: 'glossary term lookup timeout' }), 'error');
  assert.match(src, /else if \(error\) setLoadError\(true\);/);
});
