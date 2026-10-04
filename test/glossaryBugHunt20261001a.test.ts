/**
 * Glossary "toddler + cat + timing" — night bug pass 1 of 3, 2026-10-01.
 *
 *  1. A read still in flight across a reader change (sign-out, account switch)
 *     no longer lands after the blank and hands the last reader's text to the
 *     next one — metered reads, detail reads, share reads and the definition
 *     batches all check a reader generation.
 *  2. SAVE ALL stops on a reader change and does not file the page in flight.
 *  3. The offline store runs its writes one at a time, so two term saves (the
 *     screen's revalidate + the background save) cannot drop each other's
 *     parked rows, and the save loops cannot read "nothing missing" mid-save.
 *  4. The background save checks for a cancel after the tier align.
 *  5. Dictation stops when the Glossary is covered, not only when it unmounts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const screen = read('src/screens/glossary/GlossaryScreen.tsx');

const body = (src: string, start: string, len = 2500) => {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `not found: ${start}`);
  return src.slice(i, i + len);
};

test('every async read is fenced by the reader generation', () => {
  assert.match(screen, /const readerGenRef = useRef\(0\);/);
  const gw = body(screen, 'const readViaGateway = useCallback(', 1000);
  // (evening hunt 2, 2026-10-02: the read goes through the shared session
  // cache, readDefinitionOnce; the fence right after it is what this pins.)
  assert.match(gw, /const gen = readerGenRef\.current;[\s\S]{0,500}?const r = await readDefinitionOnce\(id, isMember\);\s*\/\/[^\n]*\n\s*if \(gen !== readerGenRef\.current\) return false;/);
  const fd = body(screen, 'const fetchDetails = useCallback(', 3000);
  assert.match(fd, /const gen = readerGenRef\.current;/);
  assert.ok(
    fd.indexOf('if (gen !== readerGenRef.current) return;') < fd.indexOf('putDetail(id, data'),
    'fetchDetails writes before checking the reader',
  );
  const gd = body(screen, 'const getDetail = useCallback(', 3000);
  assert.match(gd, /if \(!data \|\| gen !== readerGenRef\.current\) return null;/);
  const ed = body(screen, 'const ensureDefinitions = useCallback(', 5000);
  assert.equal((ed.match(/defTierRef\.current !== tier \|\| gen !== readerGenRef\.current/g) ?? []).length, 2);
});

test('the reader-change blank bumps the generation, drops shared reads and stops SAVE ALL', () => {
  const eff = body(screen, 'const readerChanged =', 2500);
  assert.match(eff, /readerGenRef\.current \+= 1;/);
  assert.match(eff, /gatewayInFlightRef\.current = new Map\(\);/);
  assert.match(eff, /cancelSaveRef\.current = true;/);
  // The bump comes before the open terms are refilled, so the refill is the new reader's.
  assert.ok(eff.indexOf('readerGenRef.current += 1;') < eff.indexOf('void fetchDetails(id)'));
  // A stale read's finally must not delete a new reader's in-flight entry.
  assert.match(screen, /if \(gatewayInFlightRef\.current\.get\(id\) === p\) gatewayInFlightRef\.current\.delete\(id\);/);
});

test('SAVE ALL does not store a page fetched for the last reader', () => {
  const save = body(screen, 'const saveWholeGlossary = useCallback(', 4000);
  assert.match(save, /const gen = readerGenRef\.current;/);
  const fetchAt = save.indexOf('await fetchDefinitionsFor(table, ids);');
  const guard = save.indexOf('if (gen !== readerGenRef.current) break;');
  const store = save.indexOf('await saveStoredDefinitions(table, rows);');
  assert.ok(fetchAt > 0 && guard > fetchAt && store > guard, 'no reader check between fetch and store');
});

test('the native offline store serialises its writes and the missing-ids read', () => {
  const native = read('src/features/glossary/offlineCorpus.native.ts');
  assert.match(native, /function serial<T>\(run: \(\) => Promise<T>\): Promise<T> \{/);
  assert.match(native, /export async function saveTerms\(src: string, rows: OfflineTerm\[\]\): Promise<void> \{\s*return serial\(\(\) => saveTermsNow\(src, rows\)\);/);
  assert.match(native, /await serial\(\(\) => db\(\)\.withTransactionAsync\(/);
  assert.match(body(native, 'export function idsMissingDefinitions', 300), /return serial\(async \(\) => \{/);
  assert.match(body(native, 'export async function alignDefinitionTier', 300), /await serial\(\(\) => alignNow\(src, tier\)\);/);
  assert.match(body(native, 'export async function clearCorpus', 200), /return serial\(/);
  // No serialised step may call another serialised export, or the chain deadlocks.
  const inner = body(native, 'async function saveTermsNow', 4000);
  assert.ok(!/await (saveTerms|saveDefinitions|idsMissingDefinitions|alignDefinitionTier|clearCorpus)\(/.test(inner));
});

test('the background save stops after the tier align when cancelled', () => {
  const pre = read('src/features/glossary/offlinePrefetch.ts');
  assert.match(pre, /await alignDefinitionTier\(table, 'member'\);[\s\S]{0,300}?if \(cancelled\(\)\) return;\s*\n\s*\n?\s*\/\/ The term list first/);
});

test('dictation stops on blur and never starts on a covered screen', () => {
  const dict = read('src/screens/glossary/GlossaryDictation.tsx');
  assert.match(dict, /import \{ useIsFocused \} from '@react-navigation\/native';/);
  assert.match(dict, /useEffect\(\(\) => \{\s*if \(isFocused\) return;[\s\S]{0,120}ExpoSpeechRecognitionModule\.stop\(\);/);
  assert.match(dict, /if \(!mountedRef\.current \|\| !focusedRef\.current\) \{/);
});
