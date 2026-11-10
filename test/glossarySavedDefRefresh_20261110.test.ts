/**
 * Saved glossary definitions are refreshed (owner 2026-11-10, "Yes, fix it").
 * A definition saved on the phone was only filled when missing, never re-read,
 * so a term the academy corrected kept its old text there. Two fixes:
 *   1. the members' background save rechecks every saved definition weekly;
 *   2. a member opening a term corrects its line and the saved copy at once.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { idsWithDefinitionsAfter, saveDefinitions, saveTerms } from '../src/features/glossary/offlineCorpus.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const PREFETCH = read('src/features/glossary/offlinePrefetch.ts');
const NATIVE = read('src/features/glossary/offlineCorpus.native.ts');
const SCREEN = read('src/screens/glossary/GlossaryScreen.tsx');

describe('the recheck walk', () => {
  it('walks saved definitions in id order, after a cursor, a page at a time', async () => {
    const src = 'test_refresh';
    await saveTerms(src, ['c', 'a', 'd', 'b'].map((id) => ({ id, term: `T${id}`, achievement_id: null, also_called: [] })));
    await saveDefinitions(src, [
      { id: 'a', definition: 'A' },
      { id: 'b', definition: 'B' },
      { id: 'd', definition: 'D' },
    ]);
    assert.deepEqual(await idsWithDefinitionsAfter(src, '', 2), ['a', 'b']);
    assert.deepEqual(await idsWithDefinitionsAfter(src, 'b', 2), ['d']); // c has none
    assert.deepEqual(await idsWithDefinitionsAfter(src, 'd', 2), []);
  });
  it('the native store asks the same of SQLite, queued behind writes', () => {
    assert.match(NATIVE, /definition IS NOT NULL AND id > \? ORDER BY id LIMIT \?/);
    assert.match(NATIVE, /export function idsWithDefinitionsAfter[\s\S]{0,120}return serial\(/);
  });
});

describe('the weekly recheck in the background save', () => {
  it('runs every 7 days, resumes from a saved cursor and overwrites the saved text', () => {
    assert.match(PREFETCH, /RECHECK_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
    assert.match(PREFETCH, /getMeta\(cursorKey\(table\)\)/);
    assert.match(PREFETCH, /idsWithDefinitionsAfter\(table, cursor, PAGE\)/);
    assert.match(PREFETCH, /await saveDefinitions\(table, rows\);\n\s*cursor = ids\[ids\.length - 1\]/);
  });
  it('a store filled from nothing starts its clock; an older store is rechecked at once', () => {
    assert.match(PREFETCH, /if \(downloaded && !last\) \{\n\s*await setMeta\(checkedKey\(table\), String\(Date\.now\(\)\)\);\n\s*return;/);
    assert.match(PREFETCH, /if \(!ids\.length\) break; \/\/ complete/);
  });
  it('each finished pass resets the cursor and stamps the time', () => {
    assert.match(PREFETCH, /setMeta\(checkedKey\(table\), String\(Date\.now\(\)\)\);\n\s*await setMeta\(cursorKey\(table\), ''\);/);
  });
});

describe('an opened term corrects its definition', () => {
  it('runs after the live detail read', () => {
    assert.match(SCREEN, /putDetail\(id, data as unknown as EntryDetail\);\n\s*correctSavedDefRef\.current\(id,/);
  });
  it('members only, only when the text differs, and the saved copy too', () => {
    assert.match(SCREEN, /if \(!definition \|\| defTierRef\.current !== 'member'\) return;/);
    assert.match(SCREEN, /if \(!e \|\| !e\.definition \|\| e\.definition === definition\) return;/);
    assert.match(SCREEN, /saveStoredDefinitions\(table, \[\{ id, definition \}\]\)/);
  });
});
