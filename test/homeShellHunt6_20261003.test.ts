/**
 * HOME + SHELL — toddler HUNT 6 (2026-10-03). One receipt.
 *
 * 1. Home Setup SAVE over an UNREAD Home list wiped the learner's Home cards.
 *    The sheet builds its draft from getHomeGs(); after a failed storage read
 *    that is the empty placeholder, so the draft held none of the saved cards
 *    and none of the reserved core slots. setHomeGs → listStore.set QUEUED it,
 *    the sheet said "Home not saved … may go back to how they were", and the
 *    next good read then wrote that draft OVER the stored list (and
 *    setDefaultHomeGs, validating against the empty list, stored "none" over
 *    the landing choice). Now both refuse while the list is unread and read
 *    again, so the reopened sheet shows the real list.
 *
 * R2: FAILED against homeCardsStore.ts as it was at HEAD 89f2dd18 (copied
 * aside, the old file written back, run, the fix restored, cmp clean).
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
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE_H6__ = store;

const FAKE = `
const s = globalThis.__FAKE_ASYNC_STORAGE_H6__;
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
  for (let i = 0; i < 8; i++) await new Promise<void>((r) => setImmediate(r));
};
const home = await import('../src/features/home/homeCardsStore.ts');

/** A learner with 3 Home cards (Safety's reserved slot included) and a
 *  landing choice, whose first read of the list FAILS. */
async function unreadHome(): Promise<void> {
  store.failReads = false;
  store.clear();
  store.set('ape:homeCards', JSON.stringify([3060, 11, 22]));
  store.set('ape:homeDefaultGs', '22');
  home.resetLocal();
  store.failReads = true;
  void home.getHomeGs(); // the sheet's open — the read throws
  void home.getDefaultHomeGs();
  await settle();
  store.failReads = false; // storage answers again
}

test('[R2] a Home Setup SAVE built on the unread list never lands over the stored cards', async () => {
  await unreadHome();
  // What the sheet saves: its draft from the EMPTY placeholder + one new pick.
  assert.equal(home.getHomeGs().length, 0);
  const ok = await home.setHomeGs([5]);
  assert.equal(ok, false, 'the sheet must be told the save did not happen');
  await settle();
  // The next action that reads (any Home tap) must not carry the draft over.
  home.toggleHome(44);
  await settle();
  assert.deepEqual(
    JSON.parse(store.get('ape:homeCards') ?? 'null'),
    [3060, 11, 22, 44],
    'the stored Home cards (and the reserved Safety slot) were replaced by a draft built from an unread list',
  );
});

test('[R2] the landing-card choice is not cleared by a save validated against the unread list', async () => {
  await unreadHome();
  assert.equal(await home.setDefaultHomeGs(11), false);
  await settle();
  void home.getHomeGs();
  await settle();
  assert.equal(store.get('ape:homeDefaultGs'), '22', 'the landing choice was stored as "none"');
  assert.equal(home.getDefaultHomeGs(), 22);
});

test('the refusal reads again, so the reopened sheet shows the real list and its SAVE is written', async () => {
  await unreadHome();
  assert.equal(await home.setHomeGs([5]), false);
  await settle();
  assert.deepEqual(home.getHomeGs(), [3060, 11, 22]);
  assert.equal(await home.setHomeGs([3060, 22, 11]), true);
  assert.deepEqual(JSON.parse(store.get('ape:homeCards') ?? 'null'), [3060, 22, 11]);
  assert.equal(await home.setDefaultHomeGs(11), true);
  assert.equal(store.get('ape:homeDefaultGs'), '11');
});
