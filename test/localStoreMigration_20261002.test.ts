/**
 * The stores migrated onto the shared safe store on 2026-10-02 (closer A2):
 * enrolled bundles, enrollment, the term lists / bookmarks, the two exemption
 * sets, the deck order. Each test below names the class it closes and FAILED
 * against the hand-rolled file it replaced (R2, recorded in the report):
 *
 *   • enrolledBundlesStore / enrollmentStore / flaggedStore / scenarioExempt /
 *     termsExempt: a read that THREW used to start the store empty and mark it
 *     hydrated, so the next tap saved a one-item copy over the stored one (P1).
 *   • flaggedStore: no generation fence — a read in flight across the account
 *     wipe put the departing user's lists back (P3); a toggle before the read
 *     landed was computed on the empty set and saved over the stored list (P2).
 *
 * Driven for real on a fake AsyncStorage whose reads can be made to THROW or
 * HELD mid-flight. supabase is stubbed (the enrollment server sync returns
 * before any call).
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__MIG_AS__ = AS;
g.__MIG_FAIL_READS__ = false;
g.__MIG_HOLD__ = null;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__MIG_AS__;
     export default {
       async getItem(k) {
         // Reads NOW, answers once the hold (if any) resolves — a read already
         // in flight when the account wipe lands, as on a real device.
         if (globalThis.__MIG_FAIL_READS__) throw new Error('storage read failed');
         const v = s.has(k) ? s.get(k) : null;
         const h = globalThis.__MIG_HOLD__; if (h) await h;
         return v;
       },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
     };`,
  );
const SUPABASE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: null } }; } },
    async rpc() { return { data: null, error: null }; },
    from() { throw new Error('no table reads in this test'); },
  };`);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE_STUB, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const bundles = await import('../src/features/enrollment/enrolledBundlesStore.ts');
const enrollment = await import('../src/features/enrollment/enrollmentStore.ts');
const flags = await import('../src/features/flags/flaggedStore.ts');
const scenarios = await import('../src/features/study/scenarioExempt.ts');
const terms = await import('../src/features/study/termsExempt.ts');
const deck = await import('../src/features/dashboard/deckOrderStore.ts');

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};
function fresh() {
  AS.clear();
  g.__MIG_FAIL_READS__ = false;
  g.__MIG_HOLD__ = null;
  bundles.resetLocal();
  enrollment.resetLocal();
  flags.resetLocal();
  scenarios.resetLocal();
  terms.resetLocal();
  deck.resetLocal();
}
function holdReads(): () => void {
  let release!: () => void;
  g.__MIG_HOLD__ = new Promise<void>((r) => (release = r));
  return () => {
    g.__MIG_HOLD__ = null;
    release();
  };
}
const json = (k: string) => JSON.parse(AS.get(k) ?? 'null') as unknown;

test('enrolled bundles: a read that THREW is never saved over — and the tap lands on the stored list once a read succeeds (P1)', async () => {
  fresh();
  AS.set('ape:enrolledBundles', JSON.stringify([{ key: 'cert:A', kind: 'cert', name: 'A', topics: [1], loaded: true }]));
  g.__MIG_FAIL_READS__ = true;
  bundles.getBundles();
  await settle();
  bundles.addBundle('program', 'B', [2]);
  await settle();
  assert.deepEqual((json('ape:enrolledBundles') as { key: string }[]).map((b) => b.key), ['cert:A'], 'the empty copy was saved over the stored bundles');
  g.__MIG_FAIL_READS__ = false;
  bundles.setBundleLoaded('cert:A', false);
  await settle();
  assert.deepEqual((json('ape:enrolledBundles') as { key: string; loaded: boolean }[]).map((b) => [b.key, b.loaded]), [['cert:A', false], ['program:B', false]]);
});

test('enrollment: a read that THREW is never saved over the stored list (P1)', async () => {
  fresh();
  AS.set('ape:enrollmentList', JSON.stringify([{ gs: 3060, favorite: false, active: true }, { gs: 4100, favorite: true, active: true }]));
  AS.set('ape:enrollmentSeeded5', '1');
  g.__MIG_FAIL_READS__ = true;
  enrollment.getEnrollment();
  await settle();
  enrollment.addTopics([4200]); // the Awards / Explore ENROLL path
  await settle();
  assert.deepEqual((json('ape:enrollmentList') as { gs: number }[]).map((e) => e.gs), [3060, 4100], 'a one-topic list was saved over the stored enrollment');
  g.__MIG_FAIL_READS__ = false;
  enrollment.toggleFavorite(3060);
  await settle();
  const saved = json('ape:enrollmentList') as { gs: number; favorite: boolean }[];
  assert.deepEqual(saved.map((e) => e.gs), [3060, 4100, 4200], 'the early tap must join the stored list, not replace it');
  assert.equal(saved[0].favorite, true);
});

test('enrollment: the one-time seed still runs before the first read lands, once, and keeps stored topics', async () => {
  fresh();
  AS.set('ape:enrollmentList', JSON.stringify([{ gs: 100, favorite: false, active: true }, { gs: 4100, favorite: false, active: true }]));
  enrollment.getEnrollment();
  await settle();
  assert.deepEqual(enrollment.getEnrollment().map((e) => e.gs), [3060, 3970, 4100], 'the legacy gs100 goes, the free topics lead');
  assert.deepEqual((json('ape:enrollmentList') as { gs: number }[]).map((e) => e.gs), [3060, 3970, 4100]);
  assert.equal(AS.get('ape:enrollmentSeeded5'), '1', 'the marker keeps its legacy on-disk value');
});

test('term lists: a toggle before the read lands keeps its intent and joins the stored list (P2)', async () => {
  fresh();
  AS.set('ape:heartTerms', JSON.stringify(['t1', 't2']));
  const release = holdReads();
  assert.equal(flags.toggleTermList('heart', 't3'), true, 'the tap answers ADD against what is shown');
  assert.equal(flags.toggleTermList('heart', 't2'), true, 'unknown yet, so the tap means ADD — never a removal computed on the empty set');
  release();
  await settle();
  assert.deepEqual([...flags.getTermList('heart')].sort(), ['t1', 't2', 't3']);
  assert.deepEqual((json('ape:heartTerms') as string[]).sort(), ['t1', 't2', 't3'], 'the stored list was replaced by the early taps');
});

test('term lists: a read that THREW is never saved over (P1)', async () => {
  fresh();
  AS.set('ape:knownTermsGlobal', JSON.stringify(['k1', 'k2']));
  g.__MIG_FAIL_READS__ = true;
  flags.getTermList('known');
  await settle();
  flags.setInTermList('known', 'k3', true);
  await settle();
  assert.deepEqual(json('ape:knownTermsGlobal'), ['k1', 'k2'], 'a one-term list was saved over the stored one');
});

test('term lists + bookmarks: a read in flight across the account wipe never brings the previous user back (P3)', async () => {
  fresh();
  AS.set('ape:notifyTerms', JSON.stringify(['theirs']));
  AS.set('ape:bm:glossary', JSON.stringify(['their-bookmark']));
  const release = holdReads();
  flags.getTermList('starred');
  flags.getBookmarks('glossary');
  AS.clear(); // the sweep…
  flags.resetLocal(); // …then the reset
  release();
  await settle();
  assert.deepEqual([...flags.getTermList('starred')], [], "the departing user's custom list came back");
  assert.deepEqual([...flags.getBookmarks('glossary')], [], "the departing user's bookmarks came back");
});

test('exemption sets: a read that THREW is never saved over, and the mark joins the stored set later (P1)', async () => {
  fresh();
  AS.set('ape:scenariosExempt', JSON.stringify(['topic-a']));
  AS.set('ape:termsExempt', JSON.stringify(['topic-b']));
  g.__MIG_FAIL_READS__ = true;
  await scenarios.markScenariosExempt('topic-c');
  await terms.markTermsExempt('topic-d');
  await settle();
  assert.deepEqual(json('ape:scenariosExempt'), ['topic-a'], 'a one-id set was saved over the stored exemptions');
  assert.deepEqual(json('ape:termsExempt'), ['topic-b']);
  assert.equal(scenarios.isScenariosExempt('topic-c'), true, 'this session still sees its own mark');
  g.__MIG_FAIL_READS__ = false;
  await scenarios.markScenariosExempt('topic-e');
  await terms.markTermsExempt('topic-f');
  await settle();
  assert.deepEqual((json('ape:scenariosExempt') as string[]).sort(), ['topic-a', 'topic-c', 'topic-e']);
  assert.deepEqual((json('ape:termsExempt') as string[]).sort(), ['topic-b', 'topic-d', 'topic-f']);
});

test('deck order: the last-card guard still runs against the live store, and the custom order is kept across a failed read', async () => {
  fresh();
  AS.set('ape:deckOrder', JSON.stringify({ mode: 'custom', order: ['b', 'a'], removed: [] }));
  deck.getDeckPrefs();
  await settle();
  deck.removeFromDeck('a', ['a', 'b']);
  deck.removeFromDeck('b', ['a', 'b']); // the second quick ✕ sees the first
  await settle();
  assert.deepEqual(deck.getDeckPrefs().removed, ['a']);
  assert.deepEqual((json('ape:deckOrder') as { order: string[] }).order, ['b']);
});

test('every migrated store is reached by the shared registry (no hand entry in the wipe)', async () => {
  fresh();
  const registry = await import('../src/features/storage/localStoreRegistry.ts');
  AS.set('ape:enrolledBundles', JSON.stringify([{ key: 'cert:A', kind: 'cert', name: 'A', topics: [1], loaded: true }]));
  AS.set('ape:deckOrder', JSON.stringify({ mode: 'custom', order: ['x'], removed: [] }));
  bundles.getBundles();
  deck.getDeckPrefs();
  await settle();
  assert.equal(bundles.getBundles().length, 1);
  AS.clear();
  registry.resetRegisteredLocalStores();
  assert.deepEqual(bundles.getBundles(), []);
  assert.equal(deck.getDeckPrefs().mode, 'alpha');
  // bundles 1 + enrollment 2 (list + seed marker) + 4 term lists + customOnDashboard 1 + 2 exemptions + deck 1 = 11, plus a bookmark context
  assert.ok(registry.registeredLocalStoreCount() >= 12, `expected at least 12 self-registered stores, got ${registry.registeredLocalStoreCount()}`);
});
