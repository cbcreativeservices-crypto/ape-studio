/**
 * Toddler bug hunt 2026-10-14 — section 3 owner decisions (client half):
 *
 *   #2  an unfinished (unacknowledged) Android purchase is re-checked once per
 *       app open through the same validate → finish path;
 *   #4  the remembered member tier stops at the access end date + 3 days
 *       offline (lifetime / no-end grants unchanged);
 *   #5  a lapse seen while the app is open is re-checked at +5 and +30 min;
 *   #27 the upgrade surfaces tell a guest a free ACCOUNT gets 5 calculations;
 *   #32 the lab-preview sheet stops selling once the person is a member.
 *
 * HARNESS: AsyncStorage, the supabase client and the expo-iap loader are
 * replaced via node:module registerHooks, controllable from the tests.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';

const g = globalThis as Record<string, unknown>;

const STUBS: Record<string, string> = {
  'ape-tdd:async-storage': `
    const mem = new Map();
    globalThis.__tddStorage = mem;
    export default {
      async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
      async setItem(k, v) { mem.set(k, String(v)); },
      async removeItem(k) { mem.delete(k); },
    };
  `,
  'ape-tdd:supabase': `
    const S = () => globalThis.__TDD__;
    export const supabase = {
      auth: { async getSession() { return { data: { session: S().session }, error: null }; } },
      functions: {
        async invoke(name, { body }) {
          S().validated.push(body.purchaseToken);
          return S().validateOk ? { data: { ok: true }, error: null } : { data: { ok: false, error: 'nope' }, error: null };
        },
      },
    };
  `,
  'ape-tdd:optional': `
    export function optionalModule() {
      const S = () => globalThis.__TDD__;
      return {
        async initConnection() {},
        async endConnection() {},
        async fetchProducts() { return []; },
        async requestPurchase() {},
        async finishTransaction({ purchase }) { S().finished.push(purchase.purchaseToken); },
        async getAvailablePurchases() {
          S().queries += 1;
          await new Promise((r) => setTimeout(r, 5));
          return S().purchases;
        },
        purchaseUpdatedListener() { return { remove() {} }; },
        purchaseErrorListener() { return { remove() {} }; },
      };
    }
  `,
  'ape-tdd:entitlement': `export const ENTITLEMENTS = ['anonymous','free','academy','lapsed'];`,
};

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'ape-tdd:async-storage', shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: 'ape-tdd:supabase', shortCircuit: true };
    if (specifier.endsWith('capture/optionalModule')) return { url: 'ape-tdd:optional', shortCircuit: true };
    if (specifier.endsWith('commercial/EntitlementProvider')) return { url: 'ape-tdd:entitlement', shortCircuit: true };
    if (context.parentURL?.includes('/src/') && /^\.{1,2}\//.test(specifier) && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', shortCircuit: true, source: STUBS[url] };
    return next(url, context);
  },
});

const { saveLastTier, loadLastTier } = await import('../src/features/commercial/lastTierCache.ts');
const { OFFLINE_GRACE_MS, pastOfflineGrace } = await import('../src/features/commercial/entitlementExpiry.ts');
const purchase = await import('../src/features/commercial/purchase.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const DAY = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
describe('#4 the remembered member tier stops at the end date + 3 days offline', () => {
  beforeEach(() => (g.__tddStorage as Map<string, string>).clear());

  it('the grace is three days, and only a real end date can run out', () => {
    assert.equal(OFFLINE_GRACE_MS, 3 * DAY);
    const end = Date.parse('2026-10-01T00:00:00Z');
    assert.equal(pastOfflineGrace(end, end + 3 * DAY - 1), false);
    assert.equal(pastOfflineGrace(end, end + 3 * DAY + 1), true);
    assert.equal(pastOfflineGrace(null, end + 400 * DAY), false, 'a lifetime / no-end grant never runs out');
    assert.equal(pastOfflineGrace(undefined, end + 400 * DAY), false, 'a pre-2026-10-14 entry keeps the old behaviour');
    assert.equal(pastOfflineGrace(Number.NaN, end + 400 * DAY), false);
  });

  it('a member inside end + grace is still a member offline', async () => {
    const end = Date.now() - 2 * DAY;
    await saveLastTier('uid-1', 'academy', end);
    assert.equal(await loadLastTier('uid-1'), 'academy');
    assert.equal(await loadLastTier('uid-1', { now: end - DAY }), 'academy');
  });

  it('past end + grace the remembered member reads lapsed — and nothing is deleted', async () => {
    const end = Date.now() - 4 * DAY;
    await saveLastTier('uid-1', 'academy', end);
    assert.equal(await loadLastTier('uid-1'), 'lapsed');
    const stored = JSON.parse((g.__tddStorage as Map<string, string>).get('ape:ent:lastTier')!);
    assert.equal(stored.tier, 'academy', 'the cache is not rewritten — the next server answer decides');
    assert.equal(stored.endsAt, end);
  });

  it('a lifetime / no-end grant (endsAt null) keeps access however long offline', async () => {
    await saveLastTier('uid-1', 'academy', null);
    assert.equal(await loadLastTier('uid-1', { now: Date.now() + 1000 * DAY }), 'academy');
    await saveLastTier('uid-1', 'academy'); // default = no known end
    assert.equal(await loadLastTier('uid-1', { now: Date.now() + 1000 * DAY }), 'academy');
  });

  it('an entry saved before end dates were remembered keeps working', async () => {
    (g.__tddStorage as Map<string, string>).set('ape:ent:lastTier', JSON.stringify({ uid: 'uid-1', tier: 'academy', at: 1 }));
    assert.equal(await loadLastTier('uid-1', { now: Date.now() + 1000 * DAY }), 'academy');
  });

  it('the end date is handed to the provider; free / lapsed carry none', async () => {
    const end = Date.now() + 10 * DAY;
    await saveLastTier('uid-1', 'academy', end);
    let seen: number | null | undefined;
    await loadLastTier('uid-1', { onEndsAt: (e) => (seen = e) });
    assert.equal(seen, end);
    await saveLastTier('uid-1', 'free', end);
    const stored = JSON.parse((g.__tddStorage as Map<string, string>).get('ape:ent:lastTier')!);
    assert.equal(stored.endsAt, null);
    assert.equal(await loadLastTier('uid-1', { now: end + 100 * DAY }), 'free');
  });

  it('the provider saves the end date and applies the same grace when a read fails', () => {
    const s = read('src/features/commercial/EntitlementProvider.tsx');
    assert.match(s, /saveLastTier\(lastUid\.current, tier, endsAtRef\.current\)/);
    assert.match(s, /saveLastTier\(uidAtStart, tier, endsAtRef\.current\)/);
    const arm = s.slice(s.indexOf('const armExpiryRecheck'), s.indexOf('const applyOfflineGrace'));
    assert.match(arm, /endsAtRef\.current = endsAt;/);
    assert.match(arm, /endsAt \+ OFFLINE_GRACE_MS/, 'a re-read when the grace runs out');
    const grace = s.slice(s.indexOf('const applyOfflineGrace'), s.indexOf('armExpiryRef.current = armExpiryRecheck'));
    assert.match(grace, /entitlementRef\.current !== 'academy' \|\| !pastOfflineGrace\(endsAtRef\.current\)\) return;/);
    assert.match(grace, /setEntitlementState\('lapsed'\);\s*setTierKnown\(false\);/);
    assert.doesNotMatch(grace, /clear|remove|wipe/i, 'never wipes anything');
    const retry = s.slice(s.indexOf('const deriveWithRetry'), s.indexOf('const identityOf'));
    assert.equal((retry.match(/applyOfflineGrace\(mine\);/g) ?? []).length, 2, 'first attempt and every retry');
    assert.match(s, /loadLastTier\(uid, \{ onEndsAt: \(e\) => \(rememberedEnds = e\) \}\)/);
    assert.match(s, /if \(graceTimer\) clearTimeout\(graceTimer\);\s*if \(expiryTimer\) clearTimeout\(expiryTimer\);\s*sub\.subscription\.unsubscribe\(\);/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('#5 a lapse seen while the app is open is re-checked at +5 and +30 minutes', () => {
  const s = read('src/features/commercial/EntitlementProvider.tsx');
  it('the delays', () => {
    assert.match(s, /export const LAPSE_RECHECK_MS = \[5 \* 60 \* 1000, 30 \* 60 \* 1000\] as const;/);
  });
  it('only academy → lapsed arms them; a tier change or unmount cancels them', () => {
    const fx = s.slice(s.indexOf('const prevTierRef'), s.indexOf('const setEntitlement = useCallback'));
    assert.match(fx, /if \(prev !== 'academy' \|\| entitlement !== 'lapsed'\) return;/);
    assert.match(fx, /LAPSE_RECHECK_MS\.map\(\(ms\) =>\s*setTimeout\(\(\) => \{\s*void refreshEntitlement\(\);/);
    assert.match(fx, /return \(\) => timers\.forEach\(clearTimeout\);/);
    assert.match(fx, /\}, \[entitlement, refreshEntitlement\]\);/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('#2 unfinished Android purchases are re-checked once per app open', () => {
  const P = (token: string, extra: Record<string, unknown> = {}) => ({
    productId: 'academy_monthly',
    purchaseToken: token,
    purchaseState: 'purchased',
    isAcknowledgedAndroid: false,
    ...extra,
  });
  let changed = 0;
  let open = 100;
  beforeEach(async () => {
    g.__TDD__ = {
      session: { user: { id: 'u1', is_anonymous: false } },
      validateOk: true,
      validated: [] as string[],
      finished: [] as string[],
      queries: 0,
      purchases: [] as unknown[],
    };
    changed = 0;
    open += 1;
    await purchase.startPurchaseListeners(() => {
      changed += 1;
    });
  });
  const T = () => g.__TDD__ as { validated: string[]; finished: string[]; queries: number; purchases: unknown[]; session: unknown; validateOk: boolean };

  it('only a paid, unacknowledged purchase of one of our plans is sent', () => {
    assert.equal(purchase.isUnfinishedAndroidPurchase(P('a')), true);
    assert.equal(purchase.isUnfinishedAndroidPurchase(P('a', { isAcknowledgedAndroid: true })), false);
    assert.equal(purchase.isUnfinishedAndroidPurchase(P('a', { isAcknowledgedAndroid: undefined })), false, 'iOS has no such field');
    assert.equal(purchase.isUnfinishedAndroidPurchase(P('a', { purchaseState: 'pending' })), false);
    assert.equal(purchase.isUnfinishedAndroidPurchase(P('a', { productId: 'something_else' })), false);
  });

  it('validates and finishes it through the same path, then re-reads the tier', async () => {
    T().purchases = [P('tok-1'), P('tok-done', { isAcknowledgedAndroid: true }), P('tok-wait', { purchaseState: 'pending' })];
    assert.equal(await purchase.recheckUnfinishedAndroidPurchases(open), 1);
    assert.deepEqual(T().validated, ['tok-1']);
    assert.deepEqual(T().finished, ['tok-1']);
    assert.equal(changed, 1);
  });

  it('a purchase the server still refuses is NOT finished (Play keeps it; the next open tries again)', async () => {
    T().purchases = [P('tok-1')];
    T().validateOk = false;
    assert.equal(await purchase.recheckUnfinishedAndroidPurchases(open), 0);
    assert.deepEqual(T().validated, ['tok-1']);
    assert.deepEqual(T().finished, []);
    assert.equal(changed, 0);
    T().validateOk = true;
    assert.equal(await purchase.recheckUnfinishedAndroidPurchases(open + 1000), 1, 'a later open retries it');
  });

  it('idempotent: twice at once is one run; again for the same open does nothing', async () => {
    T().purchases = [P('tok-1')];
    const [a, b] = await Promise.all([
      purchase.recheckUnfinishedAndroidPurchases(open),
      purchase.recheckUnfinishedAndroidPurchases(open),
    ]);
    assert.equal(a, 1);
    assert.equal(b, 1, 'the second caller shares the first run');
    assert.equal(T().queries, 1);
    assert.equal(await purchase.recheckUnfinishedAndroidPurchases(open), 0);
    assert.equal(T().queries, 1);
    assert.deepEqual(T().validated, ['tok-1']);
  });

  it('no signed-in session: nothing is sent, and the open is not used up', async () => {
    T().purchases = [P('tok-1')];
    T().session = null;
    assert.equal(await purchase.recheckUnfinishedAndroidPurchases(open), 0);
    assert.equal(T().queries, 0);
    T().session = { user: { id: 'u1', is_anonymous: false } };
    assert.equal(await purchase.recheckUnfinishedAndroidPurchases(open), 1);
  });

  it('the app root runs it on Android once the signed-in session is ready, per open', () => {
    const root = read('src/features/commercial/PurchaseListenerRoot.tsx');
    assert.match(root, /const tier = tierOf\(entitlement, resolved\);\s*const sessionReady = tierKnown && \(tier === 'free' \|\| tier === 'member'\);/);
    assert.match(root, /if \(Platform\.OS !== 'android' \|\| !sessionReady\) return;/);
    assert.match(root, /if \(ok && alive\) void recheckUnfinishedAndroidPurchases\(open\);/);
    assert.match(root, /if \(state === 'background' && next === 'active'\) setOpen\(\(n\) => n \+ 1\);/);
    assert.match(root, /return \(\) => sub\.remove\(\);/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('#27 guests are told a free ACCOUNT includes the calculations', () => {
  it('the sentence, and where it sits', () => {
    const copy = read('src/lib/copy.ts');
    assert.match(copy, /calcFreeAllowance: 'A free account also includes 5 calculations a week\.'/);
    assert.doesNotMatch(copy, /Free use also includes 5 calculations/);
    for (const f of ['src/features/commercial/UpgradeSheet.tsx', 'src/screens/commercial/PaywallScreen.tsx']) {
      assert.match(read(f), /COPY\.glossaryFreeAllowance \+ ' ' \+ COPY\.calcFreeAllowance/, f);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('#32 the lab-preview sheet stops selling once the person is a member', () => {
  const overlay = read('src/features/lab/LabPreviewOverlay.tsx');
  const sheet = read('src/features/commercial/UpgradeSheet.tsx');

  it('only a false → true change during a live, un-left preview', () => {
    const fn = overlay.slice(overlay.indexOf('export function becameMemberDuringPreview'), overlay.indexOf('export function LabPreviewOverlay'));
    assert.match(fn, /return !wasMember && isMember && preview\.active && !preview\.leaving;/);
  });

  it('the member face comes first and its one button closes the sheet only', () => {
    const body = overlay.slice(overlay.indexOf('export function LabPreviewOverlay'));
    const member = body.indexOf('if (memberRoute !== null)');
    assert.ok(member > 0 && member < body.indexOf('<FreeLookBar') && member < body.indexOf('onSeePlans'));
    assert.match(body, /<UpgradeSheet visible onClose=\{openLabAsMember\} onMemberOpen=\{openLabAsMember\} \/>/);
    const open = body.slice(body.indexOf('const openLabAsMember'), body.indexOf('const endTimer'));
    assert.match(open, /setMemberRoute\(null\);\s*endLabPreview\(\);/);
    assert.doesNotMatch(open, /safeGoBack|goBack|navigate/, 'the lab stays open');
    assert.match(body, /if \(navigationRef\.getCurrentRoute\(\)\?\.name !== memberRoute\) setMemberRoute\(null\);/);
  });

  it('the sheet’s member face has no membership copy', () => {
    const start = sheet.indexOf('if (onMemberOpen) {');
    const face = sheet.slice(start, sheet.indexOf('\n  return (', start));
    assert.match(face, /COPY\.labPreviewMemberTitle/);
    assert.match(face, /label=\{COPY\.labPreviewMemberButton\}/);
    assert.doesNotMatch(face, /upgradePhrase|SEE PLANS|FreeAllowance|onSeePlans/);
    assert.match(read('src/lib/copy.ts'), /labPreviewMemberTitle: 'You’re a member — open the lab'/);
  });
});
