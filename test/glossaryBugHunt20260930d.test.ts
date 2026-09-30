/**
 * Glossary "toddler + cat" — day bug pass 3 of 3, 2026-09-30.
 *
 *  1. The background save re-saves a term list that was left PARTIAL (a save
 *     killed midway) instead of skipping it because "some terms" exist.
 *  2. A tier change clears the PARKED rows of an interrupted term save too,
 *     and the term-save upsert keeps a definition only from its own src.
 *  3. Dictation does not open the mic when the permission answer arrives after
 *     the button has gone.
 *  4. A different reader on the same phone (same tier) no longer inherits the
 *     last reader's paid full definitions on the session-cached entries.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');

test('the background save checks the completeness marker, not just a row count', () => {
  const pre = read('src/features/glossary/offlinePrefetch.ts');
  assert.match(pre, /const complete = Number\(await getMeta\(`terms_complete:\$\{table\}`\)\);/);
  assert.match(pre, /if \(!stats\.terms \|\| complete !== stats\.terms\) \{/);
  // The key must stay the one the store writes.
  const native = read('src/features/glossary/offlineCorpus.native.ts');
  assert.match(native, /const completeKey = \(src: string\) => `terms_complete:\$\{src\}`;/);
});

test('parked rows are cleared on a tier change and never carry another src\'s text', () => {
  const native = read('src/features/glossary/offlineCorpus.native.ts');
  const align = native.slice(native.indexOf('export async function alignDefinitionTier'));
  assert.match(align.slice(0, 900), /SET definition = NULL WHERE src = \? OR src = \?', \[src, `\$\{src\}#stale`\]/);
  // The parked name used by saveTerms must match.
  assert.match(native, /const parked = `\$\{src\}#stale`;/);
  assert.match(
    native,
    /definition = CASE WHEN glossary_corpus\.src IN \(excluded\.src, excluded\.src \|\| '#stale'\)\s*THEN glossary_corpus\.definition END/,
  );
});

test('dictation stands down if the button unmounted during the permission prompt', () => {
  const dict = read('src/screens/glossary/GlossaryDictation.tsx');
  const toggle = dict.slice(dict.indexOf('const toggle = useCallback('));
  const perm = toggle.indexOf('await ExpoSpeechRecognitionModule.requestPermissionsAsync()');
  const guard = toggle.indexOf('if (!mountedRef.current) {');
  const start = toggle.indexOf('ExpoSpeechRecognitionModule.start(');
  assert.ok(perm > 0 && guard > perm && guard < start, 'no unmount guard between the permission answer and start()');
  assert.match(dict, /useEffect\(\(\) => \{\s*mountedRef\.current = true;\s*return \(\) => \{\s*mountedRef\.current = false;/);
});

test('a different reader blanks the cached entries even when the tier did not move', () => {
  const screen = read('src/screens/glossary/GlossaryScreen.tsx');
  assert.match(screen, /let ENTRIES_UID: string \| null \| undefined = undefined;/);
  assert.match(screen, /setReaderUid\(session\?\.user\?\.id \?\? null\);/);
  assert.match(screen, /setReaderUid\(data\.session\?\.user\?\.id \?\? null\);/);
  const eff = screen.slice(screen.indexOf('const readerChanged ='));
  assert.match(eff.slice(0, 400), /ENTRIES_UID !== undefined && ENTRIES_UID !== readerUid/);
  assert.match(eff.slice(0, 400), /\(ENTRIES_DEF_TIER !== null && ENTRIES_DEF_TIER !== defTier\) \|\| readerChanged/);
  assert.match(eff, /if \(readerUid !== undefined\) ENTRIES_UID = readerUid;/);
  assert.match(eff, /\}, \[defTier, entries, readerUid\]\);/);
});
