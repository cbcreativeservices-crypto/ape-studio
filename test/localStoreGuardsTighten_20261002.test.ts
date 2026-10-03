/**
 * G1 tightening (2026-10-02 evening) — the receipts for the two stores the
 * tightened guard newly caught with a REAL bug. Both are driven for real on a
 * fake AsyncStorage whose READS can be made to fail (writes still land, which
 * is exactly when a store that took "unreadable" for "empty" does damage).
 * The guard itself, and its fixtures for the three holes, live in
 * localStoreGuards_20261002.test.ts.
 *
 *   homeCardsStore — a failed read set `readFailed` and marked the store
 *     hydrated, and nothing ever read again that launch: every later Home
 *     Setup save, book tap and core-slot reservation LOOKED applied on screen
 *     and was silently never written. Migrated onto createLocalStore.
 *   onboardingFlow (multiGet — invisible to the old guard) — a failed read
 *     fell through to "hydrated, not complete, nothing visited": the whole
 *     first-run sampler replayed to someone who had finished it, and the next
 *     ✓ Explored mark wrote a one-item list over the stored one. Now it stays
 *     unhydrated, writes nothing, reads again, and lays early marks on top.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

class FlakyMap extends Map<string, string> {
  failReads = false;
  override has(k: string): boolean {
    if (this.failReads) throw new Error('storage read failed');
    return super.has(k);
  }
}
const store = new FlakyMap();
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE_MULTI__ = store;

/** getItem / multiGet READ through `has` (so they throw while failReads);
 *  the writes never do. */
const FAKE = `
const s = globalThis.__FAKE_ASYNC_STORAGE_MULTI__;
const get = (k) => (s.has(k) ? s.get(k) : null);
export default {
  async getItem(k) { return get(k); },
  async multiGet(ks) { return ks.map((k) => [k, get(k)]); },
  async setItem(k, v) { s.set(k, v); },
  async multiSet(kvs) { for (const [k, v] of kvs) s.set(k, v); },
  async removeItem(k) { s.delete(k); },
  async multiRemove(ks) { for (const k of ks) s.delete(k); },
};`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: `data:text/javascript,${encodeURIComponent(FAKE)}`, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const settle = async () => {
  for (let i = 0; i < 6; i++) await new Promise<void>((r) => setImmediate(r));
};
const stored = (k: string) => JSON.parse(store.get(k) ?? 'null') as unknown;

// onboardingFlow hydrates at import: its stored record is in place, and the
// read FAILS, before the module loads.
store.set('ape:onboarding:complete', '1');
store.set('ape:onboarding:visited', JSON.stringify(['calc']));
store.failReads = true;
const onboarding = await import('../src/features/intro/onboardingFlow.ts');
const home = await import('../src/features/home/homeCardsStore.ts');

test('onboarding: a failed read is NOT "first run" — nothing written over, the finished state comes back', async () => {
  await settle();
  // Still failing: the mark is held in memory, never written over ['calc'].
  onboarding.markChoiceVisited('decibel');
  await settle();
  assert.deepEqual(stored('ape:onboarding:visited'), ['calc'], 'a one-item list was written over the stored visited list');
  // The read recovers: the store reads AGAIN, the finish is back and the early
  // mark is laid on top of the stored list.
  store.failReads = false;
  void onboarding.isOnboardingComplete();
  await settle();
  assert.equal(onboarding.isOnboardingComplete(), true, 'a finished onboarding read as not finished after a failed read');
  assert.deepEqual(onboarding.getVisitedChoices(), ['calc', 'decibel']);
  assert.deepEqual(stored('ape:onboarding:visited'), ['calc', 'decibel']);
});

test('Home: after a failed read the store reads AGAIN (it used to stay dead for the launch); a save then lands', async () => {
  store.failReads = false;
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11, 22]));
  home.resetLocal();
  store.failReads = true;
  void home.getHomeGs(); // hydrate — the read throws
  await settle();
  store.failReads = false;
  // Home Setup → Save on a draft built from the UNREAD list: refused (hunt 6,
  // 2026-10-03 — it was written over [11, 22] once storage answered), and
  // the refusal reads again, so the reopened sheet shows the real list.
  assert.equal(await home.setHomeGs([5, 6]), false);
  await settle();
  assert.deepEqual(home.getHomeGs(), [11, 22]);
  assert.deepEqual(stored('ape:homeCards'), [11, 22]);
  // The next save (from a sheet built on the real list) is written.
  assert.equal(await home.setHomeGs([11, 22, 5]), true);
  assert.deepEqual(stored('ape:homeCards'), [11, 22, 5], 'the Home Setup save looked applied but was never written');
});

test('Home: while the read KEEPS failing, nothing is written over the stored list; the save lands once it answers', async () => {
  store.failReads = false;
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11, 22]));
  store.set('ape:homeDefaultGs', '22');
  home.resetLocal();
  store.failReads = true;
  void home.getHomeGs();
  await settle();
  // A whole-list save over the unread list is refused outright (hunt 6).
  assert.equal(await home.setHomeGs([7]), false);
  home.ensureHome(3060);
  await settle();
  assert.deepEqual(stored('ape:homeCards'), [11, 22], 'a save over an unreadable list was written');
  assert.equal(store.get('ape:homeDefaultGs'), '22');
  // The screen still answers the (additive) taps meanwhile.
  assert.deepEqual(home.getHomeGs(), [3060]);
  store.failReads = false;
  home.toggleHome(44); // the next tap reads again
  await settle();
  // Laid ON TOP of the stored list — never over it.
  assert.deepEqual(stored('ape:homeCards'), [11, 22, 3060, 44]);
  assert.equal(store.get('ape:homeDefaultGs'), '22');
});

test('Home: the default landing card round-trips in the stored format and stays one of the Home topics', async () => {
  store.failReads = false;
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11, 22]));
  store.set('ape:homeDefaultGs', '22'); // what the hand-rolled store wrote
  home.resetLocal();
  void home.getHomeGs();
  void home.getDefaultHomeGs();
  await settle();
  assert.equal(home.getDefaultHomeGs(), 22);
  home.setDefaultHomeGs(11);
  await settle();
  assert.equal(store.get('ape:homeDefaultGs'), '11');
  home.setDefaultHomeGs(999); // not on Home → stored as none
  await settle();
  assert.equal(home.getDefaultHomeGs(), null);
  assert.equal(store.has('ape:homeDefaultGs'), false);
  home.setDefaultHomeGs(22);
  home.toggleHome(22); // removing the default topic clears the landing choice
  await settle();
  assert.deepEqual(home.getHomeGs(), [11]);
  assert.equal(home.getDefaultHomeGs(), null);
  assert.equal(store.has('ape:homeDefaultGs'), false);
});

test('Home: the 20-card cap still counts topics and bundles together', async () => {
  store.failReads = false;
  store.clear();
  store.set('ape:homeCards', JSON.stringify(Array.from({ length: 19 }, (_, i) => i + 1)));
  store.set('ape:homeBundles', JSON.stringify(['cert:a']));
  home.resetLocal();
  void home.getHomeGs();
  void home.isBundleOnHome('cert:a');
  await settle();
  assert.equal(home.homeCardCount(), 20);
  assert.equal(home.toggleHome(500), 'full');
  assert.equal(home.ensureHome(500), false);
  assert.equal(home.toggleHomeBundle('cert:b'), 'full');
  await settle();
  assert.equal((stored('ape:homeCards') as number[]).length, 19);
});
