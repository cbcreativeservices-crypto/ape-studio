/**
 * ACCOUNT + COMMERCE, HUNT 10 (2026-10-03) — receipts.
 *
 * The safe-session sweep (3ba06aa9) taught EntitlementProvider that a null
 * INITIAL_SESSION (auth-js `_emitInitialSession` on an ERRORED read — a
 * member's expired token on a dead connection, session still stored) is
 * UNKNOWN, not a guest. Two gaps remained around it:
 *
 * 1. accountLocalSync — the app-root identity listener — still took that null
 *    at its word: identity '' ≠ the stored marker → clearLocalAccountData():
 *    unsent offline queues, saved measurements, designs, enrollment, Home
 *    cards… gone, for a member who simply opened the app offline.
 * 2. EntitlementProvider — after such a boot nothing re-asked once the
 *    network came back (lastUid null blocks the foreground re-read; the token
 *    refresh that gets through was ignored): "not confirmed" all run.
 *
 * Both are driven here through the real modules (transpiled, stubbed deps).
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const g = globalThis as Record<string, any>;
g.__DEV__ = false;

const PROVIDER_URL = new URL('../src/features/commercial/EntitlementProvider.tsx', import.meta.url).href;
const SYNC_URL = new URL('../src/features/account/accountLocalSync.ts', import.meta.url).href;
const API_URL = new URL('../src/features/auth/api.ts', import.meta.url).href;

const STUBS: Record<string, string> = {
  'ape-h10:react': `
    const H = () => globalThis.__H__;
    export function createContext(v) { return { Provider: 'Provider', _v: v }; }
    export function useContext() { return null; }
    export function useState(init) {
      const h = H(); const i = h.si++;
      if (!(i in h.state)) h.state[i] = typeof init === 'function' ? init() : init;
      const set = (v) => {
        const nv = typeof v === 'function' ? v(h.state[i]) : v;
        h.state[i] = nv; h.log.push([i, nv]);
      };
      return [h.state[i], set];
    }
    export function useRef(v) { const h = H(); const i = h.ri++; if (!(i in h.refs)) h.refs[i] = { current: v }; return h.refs[i]; }
    export function useEffect(fn) { H().effects.push(fn); }
    export function useCallback(fn) { return fn; }
    export function useMemo(fn) { return fn(); }
  `,
  'ape-h10:jsx': `export const jsx = () => null; export const jsxs = () => null; export const Fragment = 'F';`,
  'ape-h10:rn': `
    export const AppState = { currentState: 'active', addEventListener: () => ({ remove() {} }) };
    export const Platform = { OS: 'ios' };
  `,
  'ape-h10:async-storage': `
    const KV = () => globalThis.__KV__;
    export default {
      async getItem(k) { return KV().has(k) ? KV().get(k) : null; },
      async setItem(k, v) { KV().set(k, v); },
      async removeItem(k) { KV().delete(k); },
    };
  `,
  'ape-h10:lastTier': `export async function loadLastTier() { return null; } export async function saveLastTier() {}`,
  'ape-h10:devMode': `export const devBypass = () => false;`,
  'ape-h10:flags': `export const DEV_COMMERCIAL_FLAG_KEY = 'x'; export const DEV_ENTITLEMENT_KEY = 'y'; export const FLAG_DEFAULTS = { commercialMode: true };`,
  'ape-h10:supabase': `
    const SB = () => globalThis.__SB__;
    export const supabase = {
      auth: {
        getSession: () => SB().getSession(),
        onAuthStateChange: (cb) => { SB().listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      },
      from: () => ({ select: () => ({ eq: async () => SB().rows() }) }),
    };
  `,
  'ape-h10:memberStanding': `export function setMemberStanding() {}`,
  'ape-h10:localSchedule': `export function requestLocalNotifSync() {}`,
  'ape-h10:settings': `export async function loadLocalSettings() { return {}; }`,
  'ape-h10:localProgress': `export async function clearAllLocalMethodStates() { globalThis.__WIPES__.push('mirror'); }`,
  'ape-h10:sync': `export function emitStudyProgress() {}`,
  'ape-h10:clearLocal': `
    export async function clearLocalAccountData() {
      globalThis.__WIPES__.push('device');
      for (const k of [...globalThis.__KV__.keys()]) if (k.startsWith('ape:')) globalThis.__KV__.delete(k);
    }
    export function resetAllLocalStores() {}
  `,
  'ape-h10:authSupabase': `
    const SB = () => globalThis.__SB__;
    export const supabase = {
      auth: {
        getSession: () => SB().getSession(),
        admin: { signOut: async () => { SB().revokes += 1; return { error: SB().revokeError }; } },
        _removeSession: async () => { SB().removed += 1; },
        signOut: async () => ({ error: null }),
      },
    };
  `,
  'ape-h10:sessionCarry': `
    export function noteSessionIdentity(id) { globalThis.__NOTED__.push(id); }
    export async function settleSessionCarry() {}
  `,
};
const PROVIDER_MAP: Record<string, string> = {
  react: 'ape-h10:react',
  'react/jsx-runtime': 'ape-h10:jsx',
  'react-native': 'ape-h10:rn',
  '@react-native-async-storage/async-storage': 'ape-h10:async-storage',
  './lastTierCache': 'ape-h10:lastTier',
  '../../config/devMode': 'ape-h10:devMode',
  '../../config/flags': 'ape-h10:flags',
  '../../lib/supabase': 'ape-h10:supabase',
  './memberStanding': 'ape-h10:memberStanding',
  '../notifications/localSchedule': 'ape-h10:localSchedule',
  '../settings/store': 'ape-h10:settings',
  '../study/localProgress': 'ape-h10:localProgress',
  '../study/sync': 'ape-h10:sync',
};
const SYNC_MAP: Record<string, string> = {
  react: 'ape-h10:react',
  '@react-native-async-storage/async-storage': 'ape-h10:async-storage',
  '../../lib/supabase': 'ape-h10:supabase',
  './clearLocalAccountData': 'ape-h10:clearLocal',
  '../lab/sessionCarry': 'ape-h10:sessionCarry',
};
const API_MAP: Record<string, string> = { '../../lib/supabase': 'ape-h10:authSupabase' };
registerHooks({
  resolve(specifier, context, next) {
    const map =
      context.parentURL === PROVIDER_URL ? PROVIDER_MAP
        : context.parentURL === SYNC_URL ? SYNC_MAP
          : context.parentURL === API_URL ? API_MAP
            : null;
    if (map) {
      if (specifier in map) return { url: map[specifier], shortCircuit: true };
      // getSessionSafe, boundedCall, realAccount, entitlementExpiry: REAL (import-free).
      if (/^\.{1,2}\//.test(specifier)) return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', source: STUBS[url], shortCircuit: true };
    if (url === PROVIDER_URL || url === SYNC_URL) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        fileName: url === PROVIDER_URL ? 'EntitlementProvider.tsx' : 'accountLocalSync.ts',
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

type SessionResult = { data: { session: unknown }; error?: unknown };
const RETRYABLE: SessionResult = { data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } };
const SIGNED_OUT: SessionResult = { data: { session: null }, error: null };
const member = (id: string): SessionResult => ({ data: { session: { user: { id, is_anonymous: false } } }, error: null });

const flush = async () => {
  for (let i = 0; i < 30; i += 1) await new Promise((r) => setImmediate(r));
};

function freshWorld(sessionNow: () => SessionResult) {
  g.__WIPES__ = [];
  g.__NOTED__ = [];
  g.__KV__ = new Map<string, string>();
  g.__H__ = { si: 0, ri: 0, state: {}, refs: {}, effects: [], log: [] as [number, unknown][] };
  g.__SB__ = {
    getSession: async () => sessionNow(),
    listeners: [] as ((event: string, session: unknown) => void)[],
    rows: () => ({ data: [{ product: 'academy', status: 'active', expires_at: null }], error: null }),
  };
  return {
    emit: (event: string, session: unknown) => {
      for (const cb of g.__SB__.listeners) cb(event, session);
    },
  };
}

/* ── 1. accountLocalSync ─────────────────────────────────────────────── */
async function mountSync(sessionNow: () => SessionResult, marker: string | null) {
  const w = freshWorld(sessionNow);
  if (marker !== null) g.__KV__.set('ape:localUserId', marker);
  g.__KV__.set('ape:measurements', 'the member’s saved readings');
  g.__KV__.set('ape:studyQueue', 'unsent offline study');
  const { useAccountLocalSync } = await import(SYNC_URL);
  useAccountLocalSync();
  for (const fx of g.__H__.effects) fx();
  return {
    ...w,
    deviceWipes: () => (g.__WIPES__ as string[]).filter((x) => x === 'device').length,
    noted: () => g.__NOTED__ as string[],
  };
}

test('1 · accountLocalSync: a member opening the app OFFLINE (null INITIAL_SESSION, session still stored) wipes NOTHING', async () => {
  const p = await mountSync(() => RETRYABLE, 'u1');
  p.emit('INITIAL_SESSION', null);
  await flush();
  assert.equal(p.deviceWipes(), 0, 'the member’s whole device (offline queues, measurements, designs) was wiped as a guest’s');
  assert.equal(g.__KV__.get('ape:measurements'), 'the member’s saved readings');
  assert.equal(g.__KV__.get('ape:localUserId'), 'u1', 'the marker must still name the member');
  assert.deepEqual(p.noted(), [], 'an unknown session must not tell the lab ledger "guest"');
});

test('1 · accountLocalSync: the refresh that gets through confirms the member — same marker, no wipe, ledger told', async () => {
  let now: SessionResult = RETRYABLE;
  const p = await mountSync(() => now, 'u1');
  p.emit('INITIAL_SESSION', null);
  await flush();
  now = member('u1');
  p.emit('TOKEN_REFRESHED', member('u1').data.session);
  await flush();
  assert.equal(p.deviceWipes(), 0);
  assert.deepEqual(p.noted(), ['u1']);
  // An ordinary later refresh is not a new answer.
  p.emit('TOKEN_REFRESHED', member('u1').data.session);
  await flush();
  assert.deepEqual(p.noted(), ['u1']);
});

test('1 · accountLocalSync: after an offline boot a real sign-out still wipes, and a different account still wipes', async () => {
  let now: SessionResult = RETRYABLE;
  const p = await mountSync(() => now, 'u1');
  p.emit('INITIAL_SESSION', null);
  await flush();
  assert.equal(p.deviceWipes(), 0);
  // A direct switch to another account (no sign-out between): the stored
  // marker still names u1, so u2 wipes.
  now = member('u2');
  p.emit('SIGNED_IN', member('u2').data.session);
  await flush();
  assert.equal(p.deviceWipes(), 1, 'an account switch after an offline boot must wipe the previous user');
  now = SIGNED_OUT;
  p.emit('SIGNED_OUT', null);
  await flush();
  assert.equal(p.deviceWipes(), 2, 'a real sign-out must still wipe');
});

test('1 · accountLocalSync CONTROL: a true guest launch (read came back, no session) is still a guest', async () => {
  const p = await mountSync(() => SIGNED_OUT, 'u1');
  p.emit('INITIAL_SESSION', null);
  await flush();
  assert.equal(p.deviceWipes(), 1, 'a dead refresh token (session removed) after u1 is a change of identity');
  assert.deepEqual(p.noted(), ['']);
});

/* ── 2. EntitlementProvider ──────────────────────────────────────────── */
// useState order: commercialMode, entitlement, resolved, tierKnown, tierReadFailed.
const S = { entitlement: 1, tierKnown: 3, tierReadFailed: 4 } as const;
async function mountProvider(sessionNow: () => SessionResult) {
  const w = freshWorld(sessionNow);
  const { EntitlementProvider } = await import(PROVIDER_URL);
  EntitlementProvider({ children: null });
  for (const fx of g.__H__.effects) fx();
  const H = g.__H__;
  return {
    ...w,
    mirrorWipes: () => (g.__WIPES__ as string[]).filter((x) => x === 'mirror').length,
    sets: (slot: number) => (H.log as [number, unknown][]).filter(([i]) => i === slot).map(([, v]) => v),
  };
}

test('2 · EntitlementProvider: a member who comes back online after an offline boot GETS THEIR TIER', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const warn = console.warn;
  console.warn = () => {};
  try {
    let now: SessionResult = RETRYABLE;
    const p = await mountProvider(() => now);
    await flush();
    p.emit('INITIAL_SESSION', null);
    await flush();
    for (const ms of [1500, 4000, 10000]) {
      mock.timers.tick(ms);
      await flush();
    }
    assert.ok(p.sets(S.tierReadFailed).includes(true), 'precondition: the retries were spent offline');
    // The network returns; auth-js's auto-refresh gets the token through.
    now = member('u1');
    p.emit('TOKEN_REFRESHED', member('u1').data.session);
    await flush();
    assert.equal(p.sets(S.entitlement).at(-1), 'academy', 'the member stayed unconfirmed after coming back online');
    assert.equal(p.sets(S.tierKnown).at(-1), true);
    assert.equal(p.sets(S.tierReadFailed).at(-1), false);
    assert.equal(p.mirrorWipes(), 0, 'a first confirmed uid never wipes');
    // Seeded: an account switch after it still wipes; a real sign-out too.
    now = member('u2');
    p.emit('SIGNED_IN', member('u2').data.session);
    await flush();
    assert.equal(p.mirrorWipes(), 1, 'an account switch after an offline boot must wipe');
    now = SIGNED_OUT;
    p.emit('SIGNED_OUT', null);
    await flush();
    assert.equal(p.mirrorWipes(), 2);
  } finally {
    console.warn = warn;
    mock.timers.reset();
  }
});

test('2 · EntitlementProvider CONTROL: an ordinary token refresh of a known member re-reads nothing', async () => {
  const p = await mountProvider(() => member('u1'));
  p.emit('INITIAL_SESSION', member('u1').data.session);
  await flush();
  const reads = p.sets(S.entitlement).length;
  p.emit('TOKEN_REFRESHED', member('u1').data.session);
  await flush();
  assert.equal(p.sets(S.entitlement).length, reads);
});

/* ── 3. Guest Mode's refusing sign-out ───────────────────────────────── */
async function signOutWith(result: SessionResult) {
  g.__SB__ = { getSession: async () => result, revokes: 0, removed: 0, revokeError: null };
  const { signOutLocalRefusing } = await import(API_URL);
  const out = (await signOutLocalRefusing(1000)) as { error: Error | null };
  return { out, revokes: g.__SB__.revokes as number, removed: g.__SB__.removed as number };
}

test('3 · signOutLocalRefusing: an expired token on a dead connection (still stored) is REFUSED, never removed locally', async () => {
  const { out, removed } = await signOutWith(RETRYABLE);
  assert.equal(removed, 0, 'Guest Mode removed a member’s stored session offline');
  assert.ok(out.error, 'the refusal must be reported so Guest Mode says "couldn’t reach the Academy"');
});

test('3 · signOutLocalRefusing CONTROL: online sign-out revokes then removes; no session removes nothing to revoke', async () => {
  const online = await signOutWith({ data: { session: { access_token: 't', user: { id: 'u1' } } }, error: null });
  assert.equal(online.out.error, null);
  assert.equal(online.revokes, 1);
  assert.equal(online.removed, 1);
  const none = await signOutWith(SIGNED_OUT);
  assert.equal(none.out.error, null);
  assert.equal(none.revokes, 0);
});
