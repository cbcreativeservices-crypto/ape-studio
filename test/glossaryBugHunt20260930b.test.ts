/**
 * Glossary "toddler + cat" pass 2, 2026-09-30 (day).
 *
 *  1. A background teaser batch never overwrites the full text a metered read
 *     just put on the entry; a tier flip during the disk read is dropped.
 *  2. A tier change (free → member mid-visit) drops the cached detail bodies,
 *     so Common Mistakes are re-read for the member.
 *  3. The weekly lock stands aside for the Paywall instead of covering it.
 *  4. The lock's expiry re-check fires once per tick, not once per render.
 *  5. openPopupRoot no longer re-creates every render (coach object dep), and
 *     only the latest root open lands.
 *  6. The background save survives a cancel + restart and cannot start twice.
 *  7. SAVE ALL takes over from the background save.
 *  8. Re-saving the term list keeps the definitions already on the phone.
 *  9. Sharing a term the gateway refuses does not open the share sheet.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  alignDefinitionTier,
  corpusStats,
  loadDefinitions,
  loadTerms,
  saveDefinitions,
  saveTerms,
} from '../src/features/glossary/offlineCorpus.ts';

const read = (p: string) => readFileSync(p, 'utf8');
const screen = read('src/screens/glossary/GlossaryScreen.tsx');

test('re-saving the term list keeps stored definitions and drops removed terms', async () => {
  const src = 'glossary_browse_v#pass2';
  await saveTerms(src, [
    { id: 'a', term: 'Alpha', achievement_id: null },
    { id: 'b', term: 'Beta', achievement_id: null },
  ]);
  await alignDefinitionTier(src, 'member');
  await saveDefinitions(src, [
    { id: 'a', definition: 'Alpha, in full.' },
    { id: 'b', definition: 'Beta, in full.' },
  ]);
  // One term removed upstream, one added — the revalidate path.
  await saveTerms(src, [
    { id: 'a', term: 'Alpha', achievement_id: null },
    { id: 'c', term: 'Gamma', achievement_id: null },
  ]);
  assert.equal((await loadDefinitions(src, ['a'])).get('a'), 'Alpha, in full.');
  assert.deepEqual(await corpusStats(src), { terms: 2, definitions: 1 });
  assert.deepEqual((await loadTerms(src)).map((t) => t.id), ['a', 'c']);
});

test('native saveTerms upserts and parks, never wipes every definition', () => {
  const native = read('src/features/glossary/offlineCorpus.native.ts');
  const save = native.slice(native.indexOf('export async function saveTerms'), native.indexOf('/** Definitions already on the device'));
  assert.ok(!/DELETE FROM glossary_corpus WHERE src = \?', \[src\]/.test(save), 'saveTerms deletes every row (and definition) again');
  assert.match(save, /ON CONFLICT\(id\) DO UPDATE SET term = excluded\.term/);
  assert.match(save, /DELETE FROM glossary_corpus WHERE src = \?', \[parked\]/);
});

test('a teaser batch only fills blanks and re-checks the tier after the disk read', () => {
  assert.match(screen, /if \(e && r\.definition && e\.definition === ''\)/);
  const ensure = screen.slice(screen.indexOf('const fromDisk ='));
  assert.match(ensure.slice(0, 500), /if \(defTierRef\.current !== tier( \|\| gen !== readerGenRef\.current)?\)/);
});

test('a tier change drops cached detail bodies and the charged set', () => {
  const eff = screen.slice(screen.indexOf('ENTRIES_DEF_TIER !== null && ENTRIES_DEF_TIER !== defTier'));
  const body = eff.slice(0, 1800);
  assert.match(body, /detailsRef\.current = \{\};/);
  assert.match(body, /setDetails\(\{\}\);/);
  // The charged set is module level per reader since final round D (2026-10-03).
  assert.match(body, /SESSION_FALLBACK_CHARGED\.clear\(\);/);
  assert.match(body, /void fetchDetails\(id\)/);
});

test('the weekly lock stands aside for the Paywall', () => {
  assert.match(screen, /visible=\{locked && isFocused && !lockHandoff\}/);
  const hand = screen.slice(screen.indexOf('onMembership={() => {'));
  // Waits out the lock's fade through the shared hand-off (pattern P5, 2026-10-02).
  assert.match(hand.slice(0, 900), /setLockHandoff\(true\);\s*paywallHandoff\(\(\) => [^\n]*\.navigate\('Paywall'\)\);/);
  assert.match(screen, /const paywallHandoff = useModalHandoff\(\);/);
});

test('the lock expiry re-check fires once per tick', () => {
  const lock = read('src/features/glossary/GlossaryLockView.tsx');
  assert.match(lock, /if \(!expired \|\| firedForRef\.current === now\) return;/);
  assert.ok(!/\[visible, msLeft, onExpired\]/.test(lock), 'the per-render expiry effect is back');
});

test('openPopupRoot is stable and only the latest root open lands', () => {
  assert.match(screen, /\[recordRecent, registerCoach, fetchDetails, gateDefinitionOpen\]/);
  assert.ok(!/\[recordRecent, coach, fetchDetails, gateDefinitionOpen\]/.test(screen));
  assert.match(screen, /if \(seq !== openSeqRef\.current\) return;/);
});

test('the background save survives cancel + restart and never starts twice', () => {
  const pre = read('src/features/glossary/offlinePrefetch.ts');
  assert.match(pre, /if \(!OFFLINE_AVAILABLE \|\| glossaryPrefetchRunning\(\)\) return;\n  runId \+= 1;/);
  assert.match(pre, /const cancelled = \(\) => runId !== mine;/);
  assert.ok(!/let running = false/.test(pre));
  assert.match(screen, /cancelGlossaryPrefetch\(\);\n    setSavingOffline\(true\);/);
});

test('a refused metered read does not open the share sheet', () => {
  const share = screen.slice(screen.indexOf('const shareTerm = useCallback('));
  assert.match(share.slice(0, 900), /!\(await openViaGatewayRef\.current\(e\.id\)\)\) return;/);
});
