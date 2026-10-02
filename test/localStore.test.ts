/**
 * createLocalStore — the shared safe local store (pattern catalog 2026-10-02,
 * closer A2 for P1 / P2 / P3 and the write half of P6).
 *
 * Driven for real on a fake AsyncStorage whose reads can be made to THROW,
 * HELD mid-flight, and whose writes can be refused. Each test names the bug
 * class it makes impossible; each failed against a store without the rule.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__LS_AS__ = AS;
g.__LS_FAIL_READS__ = false;
g.__LS_FAIL_WRITES__ = false;
g.__LS_HOLD__ = null;
g.__LS_WRITES__ = 0;

const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__LS_AS__;
     export default {
       async getItem(k) {
         // Reads NOW, answers once the hold (if any) resolves — a read already
         // in flight when the account wipe lands, as on a real device.
         if (globalThis.__LS_FAIL_READS__) throw new Error('storage read failed');
         const v = s.has(k) ? s.get(k) : null;
         const h = globalThis.__LS_HOLD__; if (h) await h;
         return v;
       },
       async setItem(k, v) {
         globalThis.__LS_WRITES__++;
         if (globalThis.__LS_FAIL_WRITES__) throw new Error('storage write failed');
         s.set(k, v);
       },
       async removeItem(k) { s.delete(k); },
     };`,
  );

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { createLocalStore } = await import('../src/features/storage/localStore.ts');
const registry = await import('../src/features/storage/localStoreRegistry.ts');

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};

type Prefs = { order: string[]; removed: string[] };
const KEY = 'ape:test:prefs';
const SAVED: Prefs = { order: ['b', 'a'], removed: ['c'] };

function fresh(suffix = '') {
  AS.clear();
  g.__LS_FAIL_READS__ = false;
  g.__LS_FAIL_WRITES__ = false;
  g.__LS_HOLD__ = null;
  g.__LS_WRITES__ = 0;
  return createLocalStore<Prefs>({
    key: KEY + suffix,
    empty: () => ({ order: [], removed: [] }),
    parse: (p) => {
      const o = p as Partial<Prefs> | null;
      if (!o || typeof o !== 'object') throw new Error('not an object');
      const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
      return { order: strs(o.order), removed: strs(o.removed) };
    },
  });
}

const stored = () => JSON.parse(AS.get(KEY) ?? 'null') as Prefs | null;

test('P1: a read that THROWS leaves the store UNREADABLE — nothing is written over the stored copy', async () => {
  const store = fresh();
  AS.set(KEY, JSON.stringify(SAVED));
  g.__LS_FAIL_READS__ = true;
  await store.hydrate();
  assert.equal(store.isHydrated(), false, 'a failed read must not count as hydrated');
  assert.equal(store.isUnreadable(), true, 'the screen must be able to say "could not be read"');
  // The next taps: shown on the empty copy, never saved over the real one.
  const landed = store.mutate((p) => ({ ...p, removed: [...p.removed, 'x'] }));
  await settle();
  assert.deepEqual(stored(), SAVED, 'the empty copy was saved over the stored one');
  assert.equal(g.__LS_WRITES__, 0, 'no write may happen while unreadable');
  assert.deepEqual(store.get().removed, ['x'], 'the tap is shown meanwhile');
  assert.equal(await landed, false, '"Saved" must not be claimable');
});

test('P1: after a failed read the next action reads AGAIN and the queued mutation lands on the STORED copy', async () => {
  const store = fresh();
  AS.set(KEY, JSON.stringify(SAVED));
  g.__LS_FAIL_READS__ = true;
  await store.hydrate();
  store.mutate((p) => ({ ...p, removed: [...p.removed, 'x'] }));
  await settle();
  g.__LS_FAIL_READS__ = false;
  const ok = store.mutate((p) => ({ ...p, order: p.order.filter((id) => id !== 'a') }));
  await settle();
  assert.equal(store.isUnreadable(), false);
  assert.equal(store.isHydrated(), true);
  assert.equal(await ok, true);
  assert.deepEqual(stored(), { order: ['b'], removed: ['c', 'x'] }, 'both taps applied to the real data, in order');
});

test('P1 companion: a DAMAGED blob is set aside under :damaged and the store starts empty with writes allowed', async () => {
  const store = fresh();
  AS.set(KEY, '{not json');
  await store.hydrate();
  assert.equal(store.isHydrated(), true);
  assert.equal(store.isUnreadable(), false);
  assert.deepEqual(store.get(), { order: [], removed: [] });
  await settle();
  assert.equal(AS.get(`${KEY}:damaged`), '{not json', 'the damaged copy is kept, not silently discarded');
  assert.equal(await store.mutate((p) => ({ ...p, order: ['z'] })), true);
  assert.deepEqual(stored(), { order: ['z'], removed: [] });
});

test('P1 companion: a blob `parse` refuses is damaged too (set aside), a tolerable one is cleaned', async () => {
  const store = fresh();
  AS.set(KEY, JSON.stringify(42)); // parse throws: not an object
  await store.hydrate();
  await settle();
  assert.equal(AS.get(`${KEY}:damaged`), '42');
  assert.deepEqual(store.get(), { order: [], removed: [] });
  const store2 = fresh('2');
  AS.set(KEY + '2', JSON.stringify({ order: ['a', 7, 'b'], removed: 'nope' }));
  await store2.hydrate();
  assert.deepEqual(store2.get(), { order: ['a', 'b'], removed: [] });
  assert.equal(AS.has(KEY + '2:damaged'), false);
});

test('P2: a mutation BEFORE the read lands is applied to the hydrated value, never computed from the placeholder', async () => {
  const store = fresh();
  AS.set(KEY, JSON.stringify(SAVED));
  let release!: () => void;
  g.__LS_HOLD__ = new Promise<void>((r) => (release = r));
  const p = store.mutate((v) => ({ ...v, order: [...v.order, 'z'] }));
  assert.deepEqual(store.get().order, ['z'], 'the tap is shown on what is known so far');
  assert.equal(g.__LS_WRITES__, 0, 'nothing may be written before the read lands');
  g.__LS_HOLD__ = null;
  release();
  assert.equal(await p, true);
  assert.deepEqual(store.get().order, ['b', 'a', 'z']);
  assert.deepEqual(stored(), { order: ['b', 'a', 'z'], removed: ['c'] }, 'a partial copy was saved over the stored one');
});

test('P2: get() hands back the same reference until something changes (useSyncExternalStore needs it)', async () => {
  const store = fresh();
  AS.set(KEY, JSON.stringify(SAVED));
  await store.hydrate();
  const a = store.get();
  assert.equal(store.get(), a);
  void store.mutate((v) => ({ ...v, removed: [] }));
  const b = store.get();
  assert.notEqual(b, a);
  assert.equal(store.get(), b);
});

test('P6: a write the device refused answers false; one it accepted answers true; writes are serialized in order', async () => {
  const store = fresh();
  await store.hydrate();
  g.__LS_FAIL_WRITES__ = true;
  assert.equal(await store.mutate((v) => ({ ...v, order: ['a'] })), false);
  assert.deepEqual(store.get().order, ['a'], 'memory keeps this session’s work');
  assert.equal(stored(), null);
  g.__LS_FAIL_WRITES__ = false;
  const first = store.mutate((v) => ({ ...v, order: [...v.order, 'b'] }));
  const second = store.mutate((v) => ({ ...v, order: [...v.order, 'c'] }));
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.deepEqual(stored()?.order, ['a', 'b', 'c']);
});

test('P3: an account reset while the read is in flight — the departing user’s copy never lands', async () => {
  const store = fresh();
  AS.set(KEY, JSON.stringify(SAVED));
  let release!: () => void;
  g.__LS_HOLD__ = new Promise<void>((r) => (release = r));
  const read = store.hydrate();
  const gen = store.generation();
  AS.clear(); // the sweep…
  store.reset(); // …then the reset
  assert.notEqual(store.generation(), gen);
  g.__LS_HOLD__ = null;
  release();
  await read;
  await settle();
  assert.deepEqual(store.get(), { order: [], removed: [] }, 'the previous user’s data came back');
  assert.equal(store.isHydrated(), false, 'the stale read must not mark the store hydrated');
});

test('P3: a mutation queued under the previous identity is dropped by the reset, and a write in flight is not re-created after the sweep', async () => {
  const store = fresh();
  AS.set(KEY, JSON.stringify(SAVED));
  let release!: () => void;
  g.__LS_HOLD__ = new Promise<void>((r) => (release = r));
  const queued = store.mutate((v) => ({ ...v, order: [...v.order, 'mine'] }));
  AS.clear();
  store.reset();
  g.__LS_HOLD__ = null;
  release();
  assert.equal(await queued, false, 'a dropped mutation must not report "saved"');
  await settle();
  assert.equal(AS.has(KEY), false, 'the departing user’s tap re-created the key after the sweep');
  // And a write already scheduled before the reset lands nowhere either.
  await store.hydrate();
  const late = store.mutate((v) => ({ ...v, order: ['late'] }));
  store.reset();
  assert.equal(await late, false);
  assert.equal(AS.has(KEY), false);
});

test('P3: reset() runs onReset (the store’s extra module state) and re-hydrates for a mounted subscriber', async () => {
  let resets = 0;
  AS.clear();
  g.__LS_FAIL_READS__ = false;
  g.__LS_HOLD__ = null;
  const store = createLocalStore<Prefs>({
    key: KEY + ':onreset',
    empty: () => ({ order: [], removed: [] }),
    parse: (p) => p as Prefs,
    onReset: () => {
      resets++;
    },
  });
  let notified = 0;
  const off = store.subscribe(() => notified++);
  await settle();
  assert.equal(store.isHydrated(), true);
  AS.set(KEY + ':onreset', JSON.stringify({ order: ['next'], removed: [] }));
  store.reset();
  assert.equal(resets, 1);
  assert.equal(store.isHydrated(), false);
  await settle();
  assert.equal(store.isHydrated(), true, 'a mounted hook must not sit unhydrated after the wipe');
  assert.deepEqual(store.get().order, ['next']);
  assert.ok(notified >= 2);
  off();
});

test('G2: a store registers its reset AUTOMATICALLY — the account wipe reaches it with no hand entry', async () => {
  const before = registry.registeredLocalStoreCount();
  const store = fresh(':auto');
  assert.equal(registry.registeredLocalStoreCount(), before + 1);
  AS.set(KEY + ':auto', JSON.stringify(SAVED));
  await store.hydrate();
  assert.deepEqual(store.get(), SAVED);
  registry.resetRegisteredLocalStores();
  assert.deepEqual(store.get(), { order: [], removed: [] });
  assert.equal(store.isHydrated(), false);
});

test('prepare: a one-time seed runs before the store is hydrated, its result is written, and a reset meanwhile abandons it', async () => {
  AS.clear();
  g.__LS_FAIL_READS__ = false;
  g.__LS_HOLD__ = null;
  const store = createLocalStore<Prefs>({
    key: KEY + ':seed',
    empty: () => ({ order: [], removed: [] }),
    parse: (p) => p as Prefs,
    prepare: (loaded) => (loaded.order.includes('free') ? loaded : { ...loaded, order: ['free', ...loaded.order] }),
  });
  AS.set(KEY + ':seed', JSON.stringify({ order: ['x'], removed: [] }));
  const early = store.mutate((v) => ({ ...v, order: [...v.order, 'tap'] }));
  await store.hydrate();
  assert.equal(await early, true);
  assert.deepEqual(store.get().order, ['free', 'x', 'tap'], 'the seed is in place before the queued tap applies');
  assert.deepEqual((JSON.parse(AS.get(KEY + ':seed') ?? '{}') as Prefs).order, ['free', 'x', 'tap']);
  // Fenced: a prepare still running when the reset lands writes nothing.
  let release!: () => void;
  const slow = createLocalStore<Prefs>({
    key: KEY + ':seed2',
    empty: () => ({ order: [], removed: [] }),
    parse: (p) => p as Prefs,
    prepare: async (loaded) => {
      await new Promise<void>((r) => (release = r));
      return { ...loaded, order: ['seeded'] };
    },
  });
  const h = slow.hydrate();
  await settle();
  slow.reset();
  release();
  await h;
  await settle();
  assert.equal(AS.has(KEY + ':seed2'), false, 'the abandoned prepare wrote the departing identity’s seed');
  assert.equal(slow.isHydrated(), false);
});

test('serialize returning null removes the key (a store whose empty state is "nothing saved")', async () => {
  AS.clear();
  g.__LS_FAIL_READS__ = false;
  g.__LS_HOLD__ = null;
  const store = createLocalStore<string | null>({
    key: KEY + ':nullable',
    empty: () => null,
    parse: (p) => (typeof p === 'string' ? p : null),
    serialize: (v) => (v == null ? null : JSON.stringify(v)),
  });
  await store.hydrate();
  assert.equal(await store.set('here'), true);
  assert.equal(AS.get(KEY + ':nullable'), '"here"');
  assert.equal(await store.set(null), true);
  assert.equal(AS.has(KEY + ':nullable'), false);
});
