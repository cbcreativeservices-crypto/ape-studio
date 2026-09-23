/**
 * The two paid boundaries that a network failure used to decide, fixed
 * 2026-09-18. Both are about what happens when the SERVER CANNOT ANSWER.
 *
 * ── 1 · lastTierCache — a member offline is still a member ───────────────────
 *
 * EntitlementProvider starts every launch at 'anonymous', retries a failed boot
 * read three times, and flips `resolved` true in a `.finally()` so the UI never
 * hangs. With no network at all, every retry fails and `resolved` is true with
 * the tier still 'anonymous' — and `withMembershipPreview` gates on `resolved`,
 * so ~40 paid routes showed the non-member experience to a paying member.
 *
 * That is failing CLOSED on an infrastructure error, in exactly the place this
 * app is for: a venue, a rack room, a basement studio.
 *
 * ── 2 · calcUsage — the cap survives aeroplane mode ──────────────────────────
 *
 * Calculators compute LOCALLY; the RPC is only the meter. `consumeCalc` returned
 * a hardcoded OPEN on any error, so a free account with the network off had
 * unlimited calculations across all 53 workspaces, permanently, by flipping a
 * switch every phone has on its home screen — and the counter DISAPPEARED while
 * bypassed, which is what made it discoverable rather than theoretical.
 *
 * HARNESS: AsyncStorage and the supabase client are replaced via node:module
 * registerHooks, both controllable from the tests.
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { beforeEach, describe, it } from 'node:test';

const STUBS: Record<string, string> = {
  'ape-test:async-storage': `
    const mem = new Map();
    globalThis.__apeStorage = mem;
    const gate = () => { if (globalThis.__apeStorageFail) throw new Error('storage unreadable'); };
    export default {
      async getItem(k) { gate(); return mem.has(k) ? mem.get(k) : null; },
      async setItem(k, v) { gate(); mem.set(k, String(v)); },
      async removeItem(k) { mem.delete(k); },
    };
  `,
  // The RPC either answers or it does not; the tests drive which.
  'ape-test:supabase': `
    export const supabase = {
      async rpc(name) {
        if (globalThis.__apeRpcDown) return { data: null, error: { message: 'offline' } };
        const row = globalThis.__apeRpcRow ?? null;
        return { data: row ? [row] : null, error: null };
      },
    };
  `,
  // lastTierCache imports Entitlement as a TYPE only, but the resolver still has
  // to answer for the module specifier.
  'ape-test:entitlement': `export const ENTITLEMENTS = ['anonymous','free','academy','lapsed'];`,
};

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage')
      return { url: 'ape-test:async-storage', shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: 'ape-test:supabase', shortCircuit: true };
    // Extensionless relative imports inside the module under test: Node's ESM
    // needs the extension, the app's bundler does not. Resolve them rather than
    // forcing source files to carry `.ts` in their imports for the harness's
    // benefit. (Added 2026-09-23 when src/lib/boundedCall was extracted.)
    // ...but ONLY for our own source. The first version of this rule had no
    // parentURL check and appended `.ts` to node_modules' own relative imports
    // too, which broke async-storage's `./AsyncStorage`.
    if (
      context.parentURL?.includes('/src/') &&
      /^\.{1,2}\//.test(specifier) &&
      !/\.[cm]?[jt]sx?$/.test(specifier)
    ) {
      return next(`${specifier}.ts`, context);
    }
    if (specifier.endsWith('commercial/EntitlementProvider'))
      return { url: 'ape-test:entitlement', shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', shortCircuit: true, source: STUBS[url] };
    return next(url, context);
  },
});

const { saveLastTier, loadLastTier, clearLastTier } = await import(
  '../src/features/commercial/lastTierCache.ts'
);
const { consumeCalc, getCalcStatus, CALC_WEEKLY_LIMIT } = await import(
  '../src/features/lab/calcUsage.ts'
);

const storage = (): Map<string, string> => globalThis.__apeStorage as Map<string, string>;

beforeEach(() => {
  storage().clear();
  globalThis.__apeStorageFail = false;
  globalThis.__apeRpcDown = false;
  globalThis.__apeRpcRow = null;
});

describe('lastTierCache — an offline member keeps the standing the server confirmed', () => {
  it('remembers a confirmed tier and returns it for the same account', async () => {
    await saveLastTier('uid-1', 'academy');
    assert.equal(await loadLastTier('uid-1'), 'academy');
  });

  it('⛔ NEVER returns it to a DIFFERENT account', async () => {
    // The whole safety of this cache rests here. Without the uid check, an
    // account switch on a shared device inherits the previous member's access.
    await saveLastTier('uid-1', 'academy');
    assert.equal(await loadLastTier('uid-2'), null);
  });

  it('⛔ never caches "anonymous"', async () => {
    // Caching the absence of standing could only ever be used to DENY someone,
    // which is the failure this module exists to prevent.
    await saveLastTier('uid-1', 'anonymous');
    assert.equal(await loadLastTier('uid-1'), null);
    assert.equal(storage().size, 0, 'nothing should have been written at all');
  });

  it('caches free and lapsed too — they are real answers', async () => {
    await saveLastTier('uid-1', 'free');
    assert.equal(await loadLastTier('uid-1'), 'free');
    await saveLastTier('uid-1', 'lapsed');
    assert.equal(await loadLastTier('uid-1'), 'lapsed');
  });

  it('a corrupted entry invents nothing', async () => {
    // This value decides paid access. A malformed store must fall back to the
    // old behaviour, never to a tier nobody was granted.
    storage().set('ape:ent:lastTier', '{"uid":"uid-1","tier":"superuser"}');
    assert.equal(await loadLastTier('uid-1'), null);
    storage().set('ape:ent:lastTier', 'not json at all');
    assert.equal(await loadLastTier('uid-1'), null);
  });

  it('unreadable storage is not an upgrade', async () => {
    await saveLastTier('uid-1', 'academy');
    globalThis.__apeStorageFail = true;
    assert.equal(await loadLastTier('uid-1'), null);
  });

  it('no uid means no answer', async () => {
    await saveLastTier('uid-1', 'academy');
    assert.equal(await loadLastTier(null), null);
  });

  it('clearing forgets it', async () => {
    await saveLastTier('uid-1', 'academy');
    await clearLastTier();
    assert.equal(await loadLastTier('uid-1'), null);
  });
});

describe('calcUsage — the weekly cap survives aeroplane mode', () => {
  it('the server still wins when it can answer', async () => {
    globalThis.__apeRpcRow = { used: 3, lim: 5, window_start: '2026-09-18', allowed: true };
    const u = await consumeCalc();
    assert.equal(u.used, 3);
    assert.equal(u.unavailable, false, 'a served answer is not provisional');
  });

  it('⛔ an unreachable server no longer means unlimited', async () => {
    globalThis.__apeRpcDown = true;
    // Spend the whole allowance offline.
    for (let i = 1; i <= CALC_WEEKLY_LIMIT; i++) {
      const u = await consumeCalc();
      assert.equal(u.used, i, `offline calculation ${i} should be counted`);
      assert.equal(u.allowed, true, `calculation ${i} is within the allowance`);
    }
    // One past it.
    const over = await consumeCalc();
    assert.equal(over.allowed, false, 'the cap must hold with the network off');
    assert.equal(over.used, CALC_WEEKLY_LIMIT, 'a refused calculation must not increment');
  });

  it('the counter does not disappear offline', async () => {
    // The vanishing counter is what made the bypass discoverable: the limit
    // visibly stopped existing.
    globalThis.__apeRpcDown = true;
    await consumeCalc();
    const status = await getCalcStatus();
    assert.equal(status.used, 1);
    assert.equal(status.limit, CALC_WEEKLY_LIMIT);
  });

  it('still reports `unavailable` so the UI can say the count is provisional', async () => {
    globalThis.__apeRpcDown = true;
    const u = await consumeCalc();
    assert.equal(u.unavailable, true);
  });

  it('a reachable server overrides whatever the device counted', async () => {
    globalThis.__apeRpcDown = true;
    await consumeCalc();
    await consumeCalc();
    globalThis.__apeRpcDown = false;
    globalThis.__apeRpcRow = { used: 0, lim: 5, window_start: '2026-09-18', allowed: true };
    const u = await consumeCalc();
    assert.equal(u.used, 0, 'the server is the meter; the device window is only a floor');
  });
});
