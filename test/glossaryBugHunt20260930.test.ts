/**
 * Glossary "toddler + cat" pass, 2026-09-30.
 *
 *  1. Stored definitions are TIER-scoped. Every reader pages
 *     `glossary_browse_v`, which masks definitions to a teaser for non-members,
 *     so `src` alone no longer separates a free reader's teasers from a
 *     member's full text.
 *  2. The calculator / lab term popup charges one lookup per term per session,
 *     not one per open.
 *  3. Android BACK closes an open popup / chooser / topic list before it
 *     leaves the Glossary.
 *  4. A renewal that finds the key already stored says so (hasSession), or the
 *     screen sits in 'mint' for the rest of the visit.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  alignDefinitionTier,
  corpusStats,
  loadDefinitions,
  saveDefinitions,
  saveTerms,
} from '../src/features/glossary/offlineCorpus.ts';

const read = (p: string) => readFileSync(p, 'utf8');

test('a different reader tier drops the stored definitions, the same tier keeps them', async () => {
  const src = 'glossary_browse_v';
  await saveTerms(src, [
    { id: 'a', term: 'Alpha', achievement_id: null },
    { id: 'b', term: 'Beta', achievement_id: null },
  ]);
  await alignDefinitionTier(src, 'free');
  await saveDefinitions(src, [{ id: 'a', definition: 'A teaser that stops mid-sen' }]);
  await alignDefinitionTier(src, 'free');
  assert.equal((await loadDefinitions(src, ['a'])).get('a'), 'A teaser that stops mid-sen');

  // The free reader joins: the teaser must not be served as the definition.
  await alignDefinitionTier(src, 'member');
  assert.equal((await loadDefinitions(src, ['a'])).size, 0);
  assert.deepEqual(await corpusStats(src), { terms: 2, definitions: 0 });
});

test('the screen and the background save align the tier before touching stored definitions', () => {
  const screen = read('src/screens/glossary/GlossaryScreen.tsx');
  assert.match(screen, /await alignDefinitionTier\(table, tier\)/);
  assert.match(screen, /if \(!tier\) return;/, 'definitions are fetched before we know whose they are');
  assert.match(screen, /ENTRIES_DEF_TIER !== defTier/, 'the session cache keeps the last reader’s text');
  assert.match(screen, /await alignDefinitionTier\(table, 'member'\)/, 'SAVE ALL no longer clears teasers first');
  const prefetch = read('src/features/glossary/offlinePrefetch.ts');
  assert.match(prefetch, /await alignDefinitionTier\(table, 'member'\)/);
  const native = read('src/features/glossary/offlineCorpus.native.ts');
  assert.match(native, /UPDATE glossary_corpus SET definition = NULL WHERE src = \?/);
});

test('SAVE ALL cannot run twice from a double tap', () => {
  const screen = read('src/screens/glossary/GlossaryScreen.tsx');
  assert.match(screen, /if \(savingOffline \|\| savingRef\.current\)/);
  assert.match(screen, /savingRef\.current = true;/);
});

test('the term popup charges a term once per session and names the missing device key', () => {
  const popup = read('src/features/glossary/GlossaryTermPopup.tsx');
  assert.match(popup, /const full = await readOnce\(hit\.id, via\);/);
  assert.ok(!/await fetchDefinitionViaGateway\(/.test(popup), 'the popup calls the metered read directly again');
  // Hunt 13: the key is named only to a reader known to have no session.
  assert.match(popup, /classifyGatewayError\(error\) === 'denied'\) \{[\s\S]{0,1400}?else setNeedsKey\(true\);/);
  // The "only the opening" note is cleared for each new term, not only on close.
  const fetchBranch = popup.slice(popup.indexOf('setLoading(true);'));
  assert.match(fetchBranch.slice(0, 400), /setPartial\(null\);/);
});

test('hardware BACK closes an in-tree overlay before leaving the Glossary', () => {
  const screen = read('src/screens/glossary/GlossaryScreen.tsx');
  assert.match(screen, /if \(overlayBackRef\.current\(\)\) return true;/);
  assert.match(screen, /if \(!openedFrom\) return false;/);
});

test('a key renewal that finds a stored session marks the key present', () => {
  const screen = read('src/screens/glossary/GlossaryScreen.tsx');
  const renewal = screen.slice(screen.indexOf("if (keyState === 'mint' && !mintingRef.current)"));
  assert.match(renewal.slice(0, 1500), /setHasSession\(true\);/);
});
