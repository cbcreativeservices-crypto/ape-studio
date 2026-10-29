/**
 * Must-do D24 (2026-10-28): two phones overwrote each other's Study list.
 *
 * `sync_my_enrollments` replaces the whole server list, so the phone that
 * synced last won, and a phone whose list had ever been edited never took the
 * server's. The owner's Pixel left Pro1's 14 complete topics switched off.
 * Fix (Comp A's design): every sync reads the server list and merges it three
 * ways against the copy this device last saw confirmed (`ape:enrollmentLastSynced`).
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { mergeEnrollment, type SyncTopic } from '../src/features/enrollment/enrollmentPlan.ts';

const g = globalThis as Record<string, unknown>;
g.__D24_STORE__ = new Map<string, string>();
g.__D24_RPC__ = [] as { fn: string; args: { p_items: SyncTopic[] } }[];
/** What the server read answers: rows, or an error. */
g.__D24_READ__ = { data: [], error: null };
/** Optional gates: a promise the read / the push waits on. */
g.__D24_READ_GATE__ = null;
g.__D24_RPC_GATE__ = null;

const STORAGE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`const s = globalThis.__D24_STORE__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, v); },
    async removeItem(k) { s.delete(k); },
  };`);
const SUPABASE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: { user: { id: 'u1', is_anonymous: false } } }, error: null }; } },
    async rpc(fn, args) {
      if (globalThis.__D24_RPC_GATE__) await globalThis.__D24_RPC_GATE__;
      globalThis.__D24_RPC__.push({ fn, args });
      return { data: null, error: null };
    },
    from() { return { select() { return { async order() {
      if (globalThis.__D24_READ_GATE__) await globalThis.__D24_READ_GATE__;
      return globalThis.__D24_READ__;
    } }; } }; },
  };`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE_STUB, shortCircuit: true };
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_STUB, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const t = (gs: number, active = true, favorite = false): SyncTopic => ({ gs, favorite, active });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const AS = g.__D24_STORE__ as Map<string, string>;
const rpcs = () => g.__D24_RPC__ as { fn: string; args: { p_items: SyncTopic[] } }[];
const lastPush = () => rpcs().at(-1)!.args.p_items.map(({ gs, favorite, active }) => ({ gs, favorite, active }));
const serverRows = (l: SyncTopic[]) => ({ data: l.map((e, i) => ({ ...e, position: i })), error: null });

describe('mergeEnrollment (pure)', () => {
  it('two phones: a stale phone that changed nothing keeps the other phone’s add and activation', () => {
    const s0 = [t(3060), t(3970), t(4100, false)];
    const fromA = [t(3060), t(3970), t(4100, true), t(4200)]; // A activated 4100, added 4200
    assert.deepEqual(mergeEnrollment(s0, s0, fromA), fromA);
  });

  it('this phone’s own change wins for that topic only', () => {
    const base = [t(3060), t(4100), t(4200)];
    const mine = [t(3060), t(4100, false), t(4200)]; // switched 4100 off here
    const theirs = [t(3060), t(4100), t(4200, true, true), t(4300)]; // other phone: starred 4200, added 4300
    assert.deepEqual(mergeEnrollment(base, mine, theirs), [t(3060), t(4100, false), t(4200, true, true), t(4300)]);
  });

  it('a removal on either side sticks unless the other side changed that topic', () => {
    const base = [t(3060), t(4100), t(4200)];
    assert.deepEqual(mergeEnrollment(base, [t(3060), t(4200)], base), [t(3060), t(4200)], 'removed here');
    assert.deepEqual(mergeEnrollment(base, base, [t(3060), t(4100)]), [t(3060), t(4100)], 'removed on the other phone');
  });

  it('no last-synced copy: the server list in its order, then topics only this phone holds', () => {
    const seed = [t(3060), t(3970)];
    const server = [t(4100, false), t(3060, false), t(4200)];
    assert.deepEqual(mergeEnrollment(null, seed, server), [t(4100, false), t(3060, false), t(4200), t(3970)]);
  });
});

describe('enrollmentStore sync (D24)', async () => {
  const es = await import('../src/features/enrollment/enrollmentStore.ts');

  /** A phone with `list` stored (null: a fresh install), `last` as its last-synced copy,
   *  and `server` as what the server read answers from the start. */
  async function fresh(list: SyncTopic[] | null, last: SyncTopic[] | null, server: unknown = { data: [], error: null }) {
    es.resetLocal();
    g.__D24_READ__ = server;
    AS.clear();
    if (list) {
      AS.set('ape:enrollmentList', JSON.stringify(list));
      AS.set('ape:enrollmentSeeded5', '1');
    }
    if (last) AS.set('ape:enrollmentLastSynced', JSON.stringify({ uid: 'u1', items: last }));
    g.__D24_READ_GATE__ = null;
    g.__D24_RPC_GATE__ = null;
    es.getEnrollment();
    await sleep(1200); // hydrate + any seed sync
    rpcs().length = 0;
  }
  const snapshot = () => {
    const raw = AS.get('ape:enrollmentLastSynced');
    return raw ? (JSON.parse(raw) as { uid: string; items: SyncTopic[] }) : null;
  };

  it('two phones: the stale phone keeps the other phone’s add and activation (and its own edit)', async () => {
    const s0 = [t(3060), t(3970), t(4100, false)];
    await fresh(s0, s0);
    g.__D24_READ__ = serverRows([t(3060), t(3970), t(4100, true), t(4200)]);
    es.toggleFavorite(3970); // this phone's only change
    await sleep(1500);
    const want = [t(3060), t(3970, true, true), t(4100, true), t(4200)];
    assert.deepEqual(lastPush(), want);
    assert.deepEqual(es.getEnrollment(), want);
    assert.deepEqual(snapshot()?.items, want, 'the pushed list becomes the last-synced copy');
  });

  it('reinstall: no last-synced copy + untouched seed + 20 topics on the server → the 20, plus the free topics', async () => {
    const twenty = Array.from({ length: 20 }, (_, i) => t(4000 + i * 10, i % 3 !== 0));
    rpcs().length = 0;
    es.resetLocal();
    AS.clear();
    g.__D24_READ__ = serverRows(twenty);
    es.getEnrollment(); // fresh install: seeds 3060 + 3970, and the seed arms the first sync
    await sleep(2000);
    const got = es.getEnrollment();
    for (const e of twenty) assert.deepEqual(got.find((x) => x.gs === e.gs), e);
    assert.ok(got.some((e) => e.gs === 3060) && got.some((e) => e.gs === 3970), 'the free topics stay');
    assert.equal(got.length, 22);
    assert.deepEqual(lastPush(), got);
  });

  it('a topic switched off on this phone stays off on both, though the server still had it on', async () => {
    const s0 = [t(3060), t(4100)];
    await fresh(s0, s0);
    g.__D24_READ__ = serverRows(s0);
    es.toggleActive(4100);
    await sleep(1500);
    assert.deepEqual(lastPush(), [t(3060), t(4100, false)]);
    assert.deepEqual(es.getEnrollment(), [t(3060), t(4100, false)]);
  });

  it('a denied or empty server read pushes this phone’s list unchanged, as before', async () => {
    const mine = [t(3060), t(4100)];
    for (const read of [{ data: null, error: { message: 'permission denied', code: '42501' } }, { data: [], error: null }]) {
      await fresh(mine, [t(3060)]);
      g.__D24_READ__ = read;
      es.toggleActive(4100);
      await sleep(1500);
      assert.deepEqual(lastPush(), [t(3060), t(4100, false)]);
    }
  });

  it('an account wipe during the push writes no last-synced copy for the next identity', async () => {
    const s0 = [t(3060), t(4100)];
    await fresh(s0, s0);
    g.__D24_READ__ = serverRows(s0);
    let open!: () => void;
    g.__D24_RPC_GATE__ = new Promise<void>((r) => (open = r));
    es.toggleActive(4100);
    await sleep(1100); // the read is done, the push is waiting
    es.resetLocal();
    AS.clear(); // the wipe's ape:* sweep
    open();
    await sleep(300);
    assert.equal(AS.get('ape:enrollmentLastSynced'), undefined);
  });

  it('an account wipe during the read merges nothing and pushes nothing', async () => {
    const s0 = [t(3060), t(4100)];
    await fresh(s0, s0);
    g.__D24_READ__ = serverRows([t(9999)]);
    let open!: () => void;
    g.__D24_READ_GATE__ = new Promise<void>((r) => (open = r));
    es.toggleActive(4100);
    await sleep(1000);
    es.resetLocal();
    AS.clear();
    open();
    await sleep(300);
    assert.equal(rpcs().length, 0);
    assert.ok(!es.getEnrollment().some((e) => e.gs === 9999), 'the departing account’s rows were not merged');
    assert.equal(AS.get('ape:enrollmentLastSynced'), undefined);
  });
});
