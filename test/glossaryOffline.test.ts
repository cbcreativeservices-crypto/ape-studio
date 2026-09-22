/**
 * GUARD — the glossary must survive with no connection.
 *
 * Owner 2026-09-22: "the glossary needs to work offline after being loaded. a
 * user lets say who works on a cruise will not be able to load it every time."
 *
 * Before this there was NO persistence of any kind. The corpus lived in a
 * module-level variable, so every cold start re-downloaded all 31,858 terms and
 * a reader out of signal had no glossary at all — the app's headline feature,
 * unusable exactly where a working engineer most needs a reference.
 *
 * Three properties have to hold, and each is easy to undo by accident:
 *  1. reads come off the device FIRST, so no network is required;
 *  2. definitions fetched over the network are KEPT, or the reader pays for
 *     them again on every launch;
 *  3. the store is scoped by SOURCE VIEW. `glossary_browse_v` masks definitions
 *     to a teaser for non-members — serving a paying member rows cached while
 *     they were a guest would show them truncated text they have paid for.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const screen = strip(read('src', 'screens', 'glossary', 'GlossaryScreen.tsx'));
const native = strip(read('src', 'features', 'glossary', 'offlineCorpus.native.ts'));
const web = strip(read('src', 'features', 'glossary', 'offlineCorpus.ts'));

describe('glossary works offline once loaded', () => {
  test('the corpus is read from the device before the network', () => {
    assert.match(screen, /const stored = await loadStoredTerms\(table\)/, 'the corpus no longer reads the device copy first');
    // The stored copy must be RETURNED, not merely consulted.
    assert.match(screen, /if \(stored\.length\) \{/, 'a stored corpus is no longer used');
  });

  test('a freshly downloaded corpus is written to the device', () => {
    assert.match(screen, /void saveStoredTerms\(/, 'the corpus is downloaded and then thrown away again');
  });

  test('definitions are read from the device before the network', () => {
    assert.match(screen, /await loadStoredDefinitions\(table, want\)/, 'definitions no longer check the device first');
    assert.match(screen, /want\.filter\(\(id\) => !stored\.has\(id\)\)/, 'every definition is refetched even when stored');
  });

  test('definitions fetched over the network are kept', () => {
    assert.match(screen, /void saveStoredDefinitions\(table, rows\)/, 'fetched definitions are no longer persisted');
  });

  test('the store is scoped by source view, member vs guest', () => {
    // Every statement must filter on src EXCEPT clearCorpus, whose whole job is
    // to wipe the lot when the reader asks for the space back.
    const withoutClear = native.slice(0, native.indexOf('export async function clearCorpus'));
    for (const sql of withoutClear.match(/(SELECT|UPDATE|DELETE)[^;'`]*FROM glossary_corpus[^'`]*/g) ?? []) {
      assert.ok(/src = \?/.test(sql), `a glossary_corpus statement is not scoped by src: ${sql.slice(0, 80)}`);
    }
    // And that exemption is real, not an accident of ordering.
    assert.match(native, /export async function clearCorpus[\s\S]*DELETE FROM glossary_corpus'/);
    assert.match(native, /INSERT OR REPLACE INTO glossary_corpus \(id, term, achievement_id, definition, src\)/);
  });

  test('web never claims to be available offline', () => {
    // expo-sqlite's web build needs SharedArrayBuffer; the in-memory fallback
    // forgets everything on reload, so offering "saved on this device" there
    // would be a promise the platform cannot keep.
    assert.match(web, /export const OFFLINE_AVAILABLE = false/);
    assert.match(native, /export const OFFLINE_AVAILABLE = true/);
    assert.match(screen, /!OFFLINE_AVAILABLE \|\| loading \|\| !offlineStats\?\.terms \? null/, 'the offline UI no longer hides itself on web');
  });

  test('the save-everything loop cannot spin forever', () => {
    // A definition that is NULL upstream returns the same ids every pass.
    assert.match(screen, /for \(let pass = 0; pass < 80; pass \+= 1\)/, 'the offline save loop is no longer bounded');
    assert.match(screen, /if \(!rows\.some\(\(r\) => r\.definition\)\) break;/, 'the loop no longer stops on a page with nothing storable');
  });
});
