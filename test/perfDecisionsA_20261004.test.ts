/**
 * PERF DECISIONS A — owner-approved 2026-10-04 ("1 and 2 and all other
 * decisions: do your recommendations").
 *
 * 1. USER ID FROM THE STORED SESSION. myUserRow / myUserId, weeklyConcept's
 *    authUserId / appUserId and push's appUserId each called
 *    `supabase.auth.getUser()` — a round trip to the auth server — before the
 *    users-row read could start, and every caller re-read the users row. They
 *    now read the uid from the stored session (`safeSessionResult`, timedOut =
 *    the same answer a failed read gave before, never a sign-out) and share
 *    one memoised users.id per auth uid with in-flight dedupe
 *    (features/account/appUserIdMemo), reset by the account wipe.
 *    Accepted trade-off: the client no longer re-validates the token with the
 *    auth server on each call; RLS / RPCs still authenticate every request.
 *
 * 2. HOME PAINTS ON THE REMEMBERED TIER. EntitlementProvider flipped
 *    `resolved` only after the network entitlement read (bounded up to 15 s),
 *    even when this account's last confirmed tier had already been restored.
 *    It now flips as soon as that remembered tier, or a server answer, is
 *    applied. `tierKnown` is unchanged (a remembered tier is not a known one).
 *    Accepted trade-off: a refunded member may see member content for about
 *    one round trip before it locks.
 *
 * R2: every test marked [R2] FAILED against src/features/account/myUserRow.ts,
 * src/features/notifications/weeklyConcept.ts, src/features/notifications/push.ts,
 * src/features/account/clearLocalAccountData.ts and
 * src/features/commercial/EntitlementProvider.tsx as they were at HEAD
 * d594a85b (= 401df890 for src/) — copied aside, `git show HEAD:<path>`
 * written back, run, restored, cmp clean. Unmarked tests are controls that
 * pass on both.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const g = globalThis as Record<string, any>;
g.__DEV__ = false;

const PROVIDER_URL = new URL('../src/features/commercial/EntitlementProvider.tsx', import.meta.url).href;

/* ── stubs ─────────────────────────────────────────────────────────────── */
const STUBS: Record<string, string> = {
  // A users/auth stand-in for myUserRow + weeklyConcept: counts getUser calls
  // and users-row reads; a users read answers after a short delay so parallel
  // callers genuinely overlap.
  'ape-pda:sb-account': `
    const C = () => globalThis.__PDA__;
    function builder(table) {
      let authId = null;
      const b = {
        select() { return b; },
        eq(col, v) { if (col === 'auth_id') authId = v; return b; },
        update() { C().updates++; return b; },
        async upsert() { C().upserts++; return { error: null }; },
        maybeSingle() {
          if (table !== 'users') return Promise.resolve({ data: null, error: null });
          C().usersReads++;
          return new Promise((r) => setTimeout(() => r(C().usersAnswer(authId)), 5));
        },
        then(res, rej) { return Promise.resolve({ data: [{ user_id: 'x' }], error: null }).then(res, rej); },
      };
      return b;
    }
    export const supabase = {
      auth: {
        async getUser() { C().getUser++; return C().user(); },
        getSession() { return C().session(); },
      },
      from: builder,
    };
  `,
  // EntitlementProvider harness (the safeSessionSweep pattern).
  'ape-pda:react': `
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
  'ape-pda:jsx': `export const jsx = () => null; export const jsxs = () => null; export const Fragment = 'F';`,
  'ape-pda:rn': `
    export const AppState = { currentState: 'active', addEventListener: () => ({ remove() {} }) };
    export const Platform = { OS: 'ios' };
  `,
  'ape-pda:async-storage': `export default { async getItem() { return null; }, async setItem() {}, async removeItem() {} };`,
  'ape-pda:lastTier': `
    export async function loadLastTier(uid) { globalThis.__LT_CALLS__.push(uid); return globalThis.__LT__; }
    export async function saveLastTier() {}`,
  'ape-pda:devMode': `export const devBypass = () => false;`,
  'ape-pda:flags': `export const DEV_COMMERCIAL_FLAG_KEY = 'x'; export const DEV_ENTITLEMENT_KEY = 'y'; export const FLAG_DEFAULTS = { commercialMode: true };`,
  'ape-pda:sb-provider': `
    const SB = () => globalThis.__SB__;
    export const supabase = {
      auth: {
        getSession: () => SB().getSession(),
        onAuthStateChange: (cb) => { SB().listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      },
      from: () => ({ select: () => ({ eq: async () => SB().rows() }) }),
    };
  `,
  'ape-pda:memberStanding': `export function setMemberStanding() {}`,
  'ape-pda:localSchedule': `export function requestLocalNotifSync() {}`,
  'ape-pda:settings': `export async function loadLocalSettings() { return {}; }`,
  'ape-pda:localProgress': `export async function clearAllLocalMethodStates() { globalThis.__WIPES__.push(Date.now()); }`,
  'ape-pda:sync': `export function emitStudyProgress() {}`,
};
const PROVIDER_MAP: Record<string, string> = {
  react: 'ape-pda:react',
  'react/jsx-runtime': 'ape-pda:jsx',
  'react-native': 'ape-pda:rn',
  '@react-native-async-storage/async-storage': 'ape-pda:async-storage',
  './lastTierCache': 'ape-pda:lastTier',
  '../../config/devMode': 'ape-pda:devMode',
  '../../config/flags': 'ape-pda:flags',
  '../../lib/supabase': 'ape-pda:sb-provider',
  './memberStanding': 'ape-pda:memberStanding',
  '../notifications/localSchedule': 'ape-pda:localSchedule',
  '../settings/store': 'ape-pda:settings',
  '../study/localProgress': 'ape-pda:localProgress',
  '../study/sync': 'ape-pda:sync',
};
registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL === PROVIDER_URL) {
      if (specifier in PROVIDER_MAP) return { url: PROVIDER_MAP[specifier], shortCircuit: true };
      if (/^\.{1,2}\//.test(specifier)) return next(`${specifier}.ts`, context);
    }
    if (/(^|\/)lib\/supabase$/.test(specifier)) return { url: 'ape-pda:sb-account', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL?.startsWith('file:')) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', source: STUBS[url], shortCircuit: true };
    if (url === PROVIDER_URL) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        fileName: 'EntitlementProvider.tsx',
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* ══ 1. user id from the stored session ═════════════════════════════════ */

type Ctl = {
  uid: string | null;
  getUser: number;
  usersReads: number;
  updates: number;
  upserts: number;
  usersFail: boolean;
  sessionRejects: boolean;
  user: () => unknown;
  session: () => Promise<unknown>;
  usersAnswer: (authId: string | null) => unknown;
};
function ctl(uid: string | null): Ctl {
  const c: Ctl = {
    uid,
    getUser: 0,
    usersReads: 0,
    updates: 0,
    upserts: 0,
    usersFail: false,
    sessionRejects: false,
    user: () => (c.sessionRejects ? Promise.reject(new Error('network down')) : { data: { user: c.uid ? { id: c.uid, is_anonymous: false } : null }, error: null }),
    session: () =>
      c.sessionRejects
        ? Promise.reject(new Error('secure store read failed'))
        : Promise.resolve({ data: { session: c.uid ? { user: { id: c.uid, is_anonymous: false } } : null }, error: null }),
    usersAnswer: (authId) =>
      c.usersFail ? { data: null, error: { message: 'users read timed out' } } : { data: authId ? { id: `app-${authId}` } : null, error: null },
  };
  g.__PDA__ = c;
  return c;
}

const myRow = await import('../src/features/account/myUserRow.ts');
const weekly = await import('../src/features/notifications/weeklyConcept.ts');
const memo = await import('../src/features/account/appUserIdMemo.ts');

test('[R2] 1 · myUserId reads the uid from the stored session: ZERO getUser() calls', async () => {
  memo.resetAppUserIdMemo();
  const c = ctl('auth-1');
  assert.equal(await myRow.myUserId(), 'app-auth-1');
  assert.equal(await myRow.myUserRow<{ id: string }>('id').then((r) => r?.id), 'app-auth-1');
  assert.equal(c.getUser, 0, 'a getUser() round trip to the auth server still runs before the users read');
});

test('[R2] 1 · weeklyConcept writes read the uid from the stored session: ZERO getUser() calls', async () => {
  memo.resetAppUserIdMemo();
  const c = ctl('auth-1');
  assert.equal(await weekly.setWeeklyConceptPref(true), true);
  assert.equal(await weekly.saveCategorySchedule('Acoustics', { dayName: 'Monday', hhmm: '09:00', active: true }), true);
  assert.equal(c.getUser, 0, 'weeklyConcept still asks the auth server for the user before each write');
});

test('[R2] 1 · parallel callers share ONE users-row read (myUserId ×3 + the weekly pref)', async () => {
  memo.resetAppUserIdMemo();
  const c = ctl('auth-1');
  const out = await Promise.all([myRow.myUserId(), myRow.myUserId(), myRow.myUserId(), weekly.setWeeklyConceptPref(true)]);
  assert.deepEqual(out, ['app-auth-1', 'app-auth-1', 'app-auth-1', true]);
  assert.equal(c.usersReads, 1, `expected one shared users-row read, got ${c.usersReads}`);
  // …and a later call is answered from the memo.
  assert.equal(await myRow.myUserId(), 'app-auth-1');
  assert.equal(c.usersReads, 1);
});

test('[R2] 1 · push appUserId reads the stored session and the shared memo, never getUser()', () => {
  const s = strip(read('src/features/notifications/push.ts'));
  const fn = s.slice(s.indexOf('async function appUserId'), s.indexOf('export async function registerAndSavePushToken'));
  assert.ok(!/getUser\(/.test(fn), 'push still calls getUser()');
  assert.match(fn, /safeSessionResult\(supabase\.auth\.getSession\(\), 'push'\)/);
  assert.match(fn, /if \(timedOut\) return null;/);
  assert.match(fn, /sharedAppUserId\(uid,/);
  assert.match(fn, /\.eq\('auth_id', uid\)\.maybeSingle\(\)/, 'the read stays scoped to the caller');
});

test('[R2] 1 · the account wipe resets the memo (the house registry, not an exemption)', () => {
  const s = read('src/features/account/clearLocalAccountData.ts');
  assert.match(s, /import \{ resetAppUserIdMemo \} from '\.\/appUserIdMemo';/);
  const wipe = s.slice(s.indexOf('export function resetAllLocalStores'));
  assert.match(wipe, /^\s*resetAppUserIdMemo\(\);/m);
});

test('1 · a timed-out session read answers null / "not saved" exactly as a failed read did — no write, no sign-out', async () => {
  memo.resetAppUserIdMemo();
  const warn = console.warn;
  console.warn = () => {};
  try {
    const c = ctl('auth-1');
    c.sessionRejects = true; // the store read rejects (and getUser's network is down too)
    assert.equal(await myRow.myUserId(), null);
    assert.equal(await myRow.myUserRow('id'), null);
    assert.equal(await weekly.setWeeklyConceptPref(true), false);
    assert.equal(await weekly.saveCategorySchedule('Acoustics', { dayName: 'Monday', hhmm: '09:00', active: true }), false);
    assert.equal(c.usersReads, 0, 'a users read was attempted without an identity');
    assert.equal(c.updates + c.upserts, 0, 'a write went out without an identity');
    // The session comes back: the same calls work, nothing was cached as "signed out".
    c.sessionRejects = false;
    assert.equal(await myRow.myUserId(), 'app-auth-1');
  } finally {
    console.warn = warn;
  }
});

test('1 · the memo is keyed by the auth uid: a different identity never gets the previous id', async () => {
  memo.resetAppUserIdMemo();
  const c = ctl('auth-1');
  assert.equal(await myRow.myUserId(), 'app-auth-1');
  c.uid = 'auth-2'; // account switch, before any wipe has run
  assert.equal(await myRow.myUserId(), 'app-auth-2');
  c.uid = null; // signed out
  assert.equal(await myRow.myUserId(), null);
});

test('1 · a failed or empty users read is not remembered; a read in flight across a reset is not remembered', async () => {
  memo.resetAppUserIdMemo();
  const c = ctl('auth-1');
  c.usersFail = true;
  assert.equal(await myRow.myUserId(), null);
  c.usersFail = false;
  assert.equal(await myRow.myUserId(), 'app-auth-1', 'a failed read was cached');
  // In flight across the wipe:
  memo.resetAppUserIdMemo();
  const before = c.usersReads;
  const p = myRow.myUserId();
  await new Promise((r) => setImmediate(r));
  memo.resetAppUserIdMemo();
  assert.equal(await p, 'app-auth-1');
  await myRow.myUserId();
  assert.equal(c.usersReads, before + 2, 'a read that straddled the wipe was remembered');
});

/* ══ 2. Home paints on the remembered tier ══════════════════════════════ */

const S = { entitlement: 1, resolved: 2, tierKnown: 3, tierReadFailed: 4 } as const;
type SessionResult = { data: { session: unknown }; error?: unknown };
const RETRYABLE: SessionResult = { data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } };
const member = (id: string): SessionResult => ({ data: { session: { user: { id, is_anonymous: false } } }, error: null });
const ACADEMY_ROWS = { data: [{ product: 'academy', status: 'active', expires_at: null }], error: null };

const flush = async () => {
  for (let i = 0; i < 30; i += 1) await new Promise((r) => setImmediate(r));
};
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

async function mountProvider(opts: { session: () => Promise<SessionResult>; rows: () => Promise<unknown> | unknown; cached: string | null }) {
  g.__WIPES__ = [];
  g.__LT__ = opts.cached;
  g.__LT_CALLS__ = [];
  g.__H__ = { si: 0, ri: 0, state: {}, refs: {}, effects: [], log: [] as [number, unknown][] };
  g.__SB__ = { getSession: opts.session, listeners: [] as ((e: string, s: unknown) => void)[], rows: opts.rows };
  const { EntitlementProvider } = await import(PROVIDER_URL);
  EntitlementProvider({ children: null });
  for (const fx of g.__H__.effects) fx();
  const H = g.__H__;
  return {
    emit: (event: string, session: unknown) => {
      for (const cb of g.__SB__.listeners) cb(event, session);
    },
    wipes: () => g.__WIPES__.length as number,
    now: (slot: number) => H.state[slot],
    sets: (slot: number) => (H.log as [number, unknown][]).filter(([i]) => i === slot).map(([, v]) => v),
  };
}

test('[R2] 2 · `resolved` is true as soon as the remembered tier is applied — BEFORE the network read lands', async () => {
  const rows = deferred<unknown>();
  const p = await mountProvider({ session: async () => member('u1'), rows: () => rows.promise, cached: 'academy' });
  await flush();
  assert.equal(p.now(S.entitlement), 'academy', 'the remembered tier was applied');
  assert.equal(p.now(S.resolved), true, 'Home still waits on the network read although the remembered tier is applied');
  assert.notEqual(p.now(S.tierKnown), true, 'a remembered tier must stay "remembered", never tierKnown');
  // The read lands and confirms.
  rows.resolve(ACADEMY_ROWS);
  await flush();
  assert.equal(p.now(S.tierKnown), true);
  assert.equal(p.now(S.entitlement), 'academy');
});

test('[R2] 2 · the read still corrects the tier when it lands (the accepted refund window)', async () => {
  const rows = deferred<unknown>();
  const p = await mountProvider({ session: async () => member('u1'), rows: () => rows.promise, cached: 'academy' });
  await flush();
  assert.equal(p.now(S.resolved), true);
  rows.resolve({ data: [], error: null }); // refunded: no academy row any more
  await flush();
  assert.equal(p.now(S.entitlement), 'free', 'the network answer must replace the remembered tier');
  assert.equal(p.now(S.tierKnown), true);
});

test('[R2] 2 · an INITIAL_SESSION answer that is applied first flips `resolved` while the boot read is still out', async () => {
  const boot = deferred<SessionResult>();
  let calls = 0;
  // The boot getSession is the slow one; the derive's own reads answer.
  const p = await mountProvider({
    session: () => (++calls === 1 ? boot.promise : Promise.resolve(member('u1'))),
    rows: () => ACADEMY_ROWS,
    cached: null,
  });
  p.emit('INITIAL_SESSION', member('u1').data.session);
  await flush();
  assert.equal(p.now(S.entitlement), 'academy');
  assert.equal(p.now(S.resolved), true, 'an applied INITIAL_SESSION answer still waited on the boot read');
  boot.resolve(member('u1'));
  await flush();
  assert.equal(p.now(S.resolved), true);
  assert.equal(p.wipes(), 0, 'a member’s own launch never wipes');
});

test('2 · CONTROL: with NO remembered tier Home still waits for a real answer (M6 first-paint guard)', async () => {
  const rows = deferred<unknown>();
  const p = await mountProvider({ session: async () => member('u1'), rows: () => rows.promise, cached: null });
  await flush();
  assert.notEqual(p.now(S.resolved), true, 'first paint proceeded on the boot "anonymous" with nothing applied');
  rows.resolve(ACADEMY_ROWS);
  await flush();
  assert.equal(p.now(S.resolved), true);
  assert.equal(p.now(S.entitlement), 'academy');
});

test('2 · CONTROL: a timed-out boot session never wipes, never applies a cached tier, never claims signed out', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const warn = console.warn;
  console.warn = () => {};
  try {
    const p = await mountProvider({ session: async () => RETRYABLE, rows: () => ACADEMY_ROWS, cached: 'academy' });
    await flush();
    p.emit('INITIAL_SESSION', null);
    await flush();
    assert.equal(p.wipes(), 0, 'an unknown session ran the guest wipe');
    assert.deepEqual(g.__LT_CALLS__, [], 'the remembered tier was read for an identity nobody confirmed');
    assert.ok(!p.sets(S.entitlement).includes('anonymous'), 'an unknown session was settled as signed out');
    assert.ok(!p.sets(S.tierKnown).includes(true));
    assert.equal(p.now(S.resolved), true, 'first paint must still proceed (the .finally backstop)');
    for (const ms of [1500, 4000, 10000]) {
      mock.timers.tick(ms);
      await flush();
    }
    assert.equal(p.now(S.tierReadFailed), true);
    assert.equal(p.wipes(), 0);
  } finally {
    console.warn = warn;
    mock.timers.reset();
  }
});

test('2 · the gates still read tierKnown: a remembered member is not "known", a remembered free stays locked', async () => {
  const { memberGateOf, tierOf, upsellAllowed } = await import('../src/features/commercial/tier.ts');
  // resolved=true + remembered academy, tierKnown=false: the offline-boot state.
  assert.equal(memberGateOf(tierOf('academy', true), false, false), 'open');
  assert.equal(upsellAllowed(tierOf('academy', true), false), false, 'no marketing to a remembered member');
  // A guest is never remembered ('anonymous' is never cached), so no early resolve can read a guest.
  const lt = read('src/features/commercial/lastTierCache.ts');
  assert.match(lt, /if \(!uid \|\| tier === 'anonymous'\) return;/);
});
