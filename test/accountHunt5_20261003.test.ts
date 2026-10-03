/**
 * Area 8 (ACCOUNT + COMMERCE), hunt 5, 2026-10-03.
 *
 * 1. tier.ts disagreed with itself about a REMEMBERED 'free' tier (the
 *    account's last server-confirmed answer, restored at boot from
 *    lastTierCache while the live read fails): `memberGateOf` called it a
 *    KNOWN non-member ('locked' — the 🔒), while `upsellAllowed` refused the
 *    membership copy, so useUpsellAllowed screens showed member copy beside a
 *    lock with no way in. Both now use the same `known` rule.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { memberGateOf, tierOf, upsellAllowed } from '../src/features/commercial/tier.ts';

test('a remembered free/lapsed tier is KNOWN to both the gate and the upsell rule', () => {
  for (const remembered of ['free', 'lapsed'] as const) {
    const tier = tierOf(remembered, true);
    for (const failed of [false, true]) {
      assert.equal(memberGateOf(tier, false, failed), 'locked');
      assert.equal(upsellAllowed(tier, false), true, `${remembered}: the lock comes with the way in`);
    }
  }
});

test('owner rules still hold: never to a member, never on a failed read with nothing remembered', () => {
  // Remembered academy: open, no upsell.
  assert.equal(memberGateOf(tierOf('academy', true), false, true), 'open');
  assert.equal(upsellAllowed(tierOf('academy', true), false), false);
  // Signed-in learner whose read failed with no cache: boot 'anonymous', resolved.
  const failed = tierOf('anonymous', true);
  assert.equal(upsellAllowed(failed, false), false);
  assert.equal(memberGateOf(failed, false, true), 'unconfirmed');
  assert.equal(memberGateOf(failed, false, false), 'checking');
  // Before the first read lands: nothing.
  assert.equal(upsellAllowed(tierOf('anonymous', false), false), false);
  // A KNOWN guest still gets lock + upsell.
  assert.equal(memberGateOf(failed, true, false), 'locked');
  assert.equal(upsellAllowed(failed, true), true);
});

/**
 * 2. EntitlementProvider's boot chain awaits `loadLastTier(uid)` before its
 *    `.finally()` flips `resolved` (its only setter). The read was a bare
 *    AsyncStorage.getItem: one that never settled left `resolved` false for
 *    the run, so `tierOf` read 'unknown' and every members-only gate sat on
 *    'checking' even after INITIAL_SESSION produced the tier. Now bounded.
 *    HARNESS: AsyncStorage replaced via registerHooks with a getItem that
 *    never settles.
 */
import { registerHooks } from 'node:module';
import { mock } from 'node:test';

const HANG_STUBS: Record<string, string> = {
  'ape-hunt5:async-storage': `
    export default {
      getItem() { return new Promise(() => {}); },
      async setItem() {},
      async removeItem() {},
    };
  `,
  'ape-hunt5:entitlement': `export const ENTITLEMENTS = ['anonymous','free','academy','lapsed'];`,
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage')
      return { url: 'ape-hunt5:async-storage', shortCircuit: true };
    if (specifier.endsWith('commercial/EntitlementProvider'))
      return { url: 'ape-hunt5:entitlement', shortCircuit: true };
    if (context.parentURL?.includes('/src/') && /^\.{1,2}\//.test(specifier) && !/\.[cm]?[jt]sx?$/.test(specifier))
      return next(`${specifier}.ts`, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in HANG_STUBS) return { format: 'module', shortCircuit: true, source: HANG_STUBS[url] };
    return next(url, context);
  },
});

test('a lastTier read that never settles answers "no cache" instead of holding the boot chain', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const warn = console.warn;
  console.warn = () => {};
  try {
    const { loadLastTier } = await import('../src/features/commercial/lastTierCache.ts');
    let settled: unknown = 'pending';
    const p = loadLastTier('uid-1').then((v) => (settled = v));
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    mock.timers.tick(10_000);
    await Promise.race([p, new Promise((r) => setImmediate(r))]);
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    assert.equal(settled, null, 'the boot chain must reach its .finally() and flip `resolved`');
  } finally {
    console.warn = warn;
    mock.timers.reset();
  }
});
