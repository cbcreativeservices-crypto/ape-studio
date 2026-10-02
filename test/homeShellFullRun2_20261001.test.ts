/**
 * Full-app bug run 2 (2026-10-01) — area 1, HOME + SHELL. The two stores are
 * driven for real on a fake AsyncStorage that can be made to fail a READ;
 * Start Here is source-read (RN screens do not load under node:test). Each
 * failed against the pre-fix file (R2).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;

const home = await import('../src/features/home/homeCardsStore.ts');
const deck = await import('../src/features/dashboard/deckOrderStore.ts');

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise<void>((r) => setImmediate(r));
};

test('Home book tap before the saved list loads ADDS — it never removes a card already on Home', async () => {
  store.failReads = false;
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11, 22]));
  store.set('ape:homeBundles', JSON.stringify(['cert:a']));
  home.resetLocal();
  // Every card reads "not on Home" until the list loads; the tap means ADD.
  assert.equal(home.toggleHome(22), 'added');
  assert.equal(home.toggleHomeBundle('cert:a'), 'added');
  await settle();
  assert.deepEqual(home.getHomeGs(), [11, 22]);
  assert.equal(home.isBundleOnHome('cert:a'), true);
  assert.deepEqual(JSON.parse(store.get('ape:homeCards') ?? '[]'), [11, 22]);
});

test('Home: a double tap before the list loads still adds (it does not cancel itself out)', async () => {
  store.failReads = false;
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11]));
  home.resetLocal();
  home.toggleHome(33);
  home.toggleHome(33);
  await settle();
  assert.deepEqual(home.getHomeGs(), [11, 33]);
});

test('Home: a FAILED read is never saved over the stored list (core-slot effect writes on mount)', async () => {
  store.failReads = false;
  store.clear();
  store.set('ape:homeCards', JSON.stringify([11, 22, 44]));
  home.resetLocal();
  store.failReads = true;
  void home.getHomeGs(); // hydrate — the read throws
  await settle();
  store.failReads = false;
  home.ensureHome(3060); // Enrollments' automatic core-slot write
  home.removeHome(11);
  await settle();
  assert.deepEqual(JSON.parse(store.get('ape:homeCards') ?? '[]'), [11, 22, 44]);
});

test('Deck order: a FAILED read is never saved over the custom order by the next tap', async () => {
  store.failReads = false;
  store.clear();
  const saved = JSON.stringify({ mode: 'custom', order: ['b', 'a'], removed: ['c'] });
  store.set('ape:deckOrder', saved);
  deck.resetLocal();
  store.failReads = true;
  void deck.getDeckPrefs(); // hydrate — the read throws
  await settle();
  store.failReads = false;
  deck.setDeckMode('custom');
  deck.restoreToDeck('x');
  deck.removeFromDeck('a');
  await settle();
  assert.equal(store.get('ape:deckOrder'), saved);
  // …and after an account wipe (storage swept), saving works again.
  store.clear();
  deck.resetLocal();
  void deck.getDeckPrefs();
  await settle();
  deck.setDeckMode('custom');
  await settle();
  assert.equal(JSON.parse(store.get('ape:deckOrder') ?? '{}').mode, 'custom');
});

test('Start Here START OVER clears the screen BEFORE the storage removal, so a CONTINUE meanwhile cannot re-save the old ticks', () => {
  const src = readFileSync('src/screens/startHere/StartHereScreen.tsx', 'utf8');
  const fn = src.slice(src.indexOf('const doReset = () => {'), src.indexOf('const confirmReset = () => {'));
  assert.doesNotMatch(fn, /resetPagedProgress\(START_HERE_ID\)\.then/);
  const fresh = fn.indexOf('progressRef.current = fresh;');
  const removal = fn.indexOf('void resetPagedProgress(START_HERE_ID);');
  assert.ok(fresh > 0 && removal > fresh, 'progressRef is reset synchronously, then storage');
});
