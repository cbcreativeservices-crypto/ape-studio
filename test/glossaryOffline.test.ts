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

  test('saving everything is member-only, but OFFERED to everyone', () => {
    // Owner: "only member can save all to phone - yes offer the option - let
    // user decide". Hiding it from non-members would leave them never knowing
    // the app can do this, and the decision is theirs to make.
    assert.match(screen, /\{!resolved \|\| isMember \? \(/, 'the offline block no longer branches on membership');
    assert.match(screen, /SEE MEMBERSHIP/, 'non-members are no longer offered the option');
    // The UI is not the enforcement.
    assert.match(screen, /if \(resolved && !isMember\) return;/, 'saveWholeGlossary no longer refuses a non-member');
  });

  test('the offer names real situations, not an abstraction', () => {
    // Owner asked for the examples: a ship, a flight, a tour with no wi-fi.
    for (const word of ['ship', 'flight', 'tour']) {
      assert.ok(new RegExp(word, 'i').test(screen), `the offline copy no longer mentions a ${word}`);
    }
  });

  test('the corpus is written in BATCHES, never one row at a time', () => {
    // ⛔ THIS FROZE THE APP. The first version awaited a prepared statement once
    // per row: 31,858 sequential round-trips across the native bridge with
    // nothing given back to the JS thread in between. It surfaced on a FREE
    // account because a member runs the same write from the background
    // prefetch, where it is invisible.
    assert.match(native, /const ROWS_PER_INSERT = \d+/, 'the batch size is gone');
    assert.match(native, /VALUES \$\{values\}/, 'the corpus insert is no longer a multi-row statement');
    assert.ok(
      !/for \(const r of rows\) await stmt\.executeAsync/.test(native),
      'saveTerms is back to one statement per row — that is the freeze',
    );
  });

  test('an interrupted save reads as NO corpus, not a short one', () => {
    // Batching without an enclosing transaction is what lets the write yield —
    // the cost is that a kill mid-write leaves a partial corpus, and the
    // caller's test is `if (stored.length)`. 5,000 of 31,858 terms would be
    // served as the whole glossary, silently and permanently.
    assert.match(native, /const completeKey = \(src: string\) =>/, 'the completeness marker is gone');
    assert.match(native, /if \(!expected\) return \[\];/, 'loadTerms no longer requires a completeness marker');
    assert.match(native, /!== expected\) return \[\]; \/\/ partial/, 'loadTerms no longer rejects a partial corpus');
    // Cleared BEFORE the write, set only after the last batch.
    assert.match(native, /DELETE FROM glossary_meta WHERE k = \?/, 'the marker is not cleared before writing');
    assert.match(native, /await setMeta\(completeKey\(src\), String\(rows\.length\)\);/, 'the marker is not set after the write');
    // The web fallback must honour the same contract or it drifts.
    assert.match(web, /if \(!expected\) return \[\];/, 'the web fallback does not check completeness');
  });

  test('the save-everything loop cannot spin forever', () => {
    // A definition that is NULL upstream returns the same ids every pass.
    assert.match(screen, /for \(let pass = 0; pass < 80; pass \+= 1\)/, 'the offline save loop is no longer bounded');
    assert.match(screen, /if \(!rows\.some\(\(r\) => r\.definition\)\) break;/, 'the loop no longer stops on a page with nothing storable');
  });
});
