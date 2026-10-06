/**
 * SAFE-SESSION SWEEP, 2026-10-03 — "a stalled or offline session read is
 * treated as signed out".
 *
 * Hunt 8 made Splash send a member whose token expired while offline to Main
 * (splashRoute.ts). auth-js answers that state FAST and without rejecting:
 * `getSession()` → `{ session: null, error: AuthRetryableFetchError }` with the
 * session still stored, and `_emitInitialSession` emits INITIAL_SESSION null on
 * the same error. EntitlementProvider read both as a guest: the GUEST WIPE of
 * the member's local study mirror ran and the tier settled 'anonymous' (known).
 *
 * The house helper `safeSessionResult()` reports that state (and a stall, and a
 * rejection) as `timedOut` — UNKNOWN, never signed out. Every site below now
 * asks it.
 *
 * A. HARNESS: EntitlementProvider.tsx is transpiled with the TypeScript
 *    compiler and run once against a stub React (hooks recorded, effects run
 *    after the render), a stub Supabase client whose getSession / auth events
 *    the test drives, and a spy in place of `clearAllLocalMethodStates`.
 * B–I: source pins on the session read of each function.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const g = globalThis as Record<string, any>;
g.__DEV__ = false;

const PROVIDER_URL = new URL('../src/features/commercial/EntitlementProvider.tsx', import.meta.url).href;

/* ── stub modules ─────────────────────────────────────────────────────── */
const STUBS: Record<string, string> = {
  'ape-sss:react': `
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
  'ape-sss:jsx': `export const jsx = () => null; export const jsxs = () => null; export const Fragment = 'F';`,
  'ape-sss:rn': `
    export const AppState = { currentState: 'active', addEventListener: () => ({ remove() {} }) };
    export const Platform = { OS: 'ios' };
  `,
  'ape-sss:async-storage': `export default { async getItem() { return null; }, async setItem() {}, async removeItem() {} };`,
  'ape-sss:lastTier': `export async function loadLastTier() { return null; } export async function saveLastTier() {}`,
  'ape-sss:devMode': `export const devBypass = () => false;`,
  'ape-sss:flags': `export const DEV_ENTITLEMENT_KEY = 'y';`,
  'ape-sss:supabase': `
    const SB = () => globalThis.__SB__;
    export const supabase = {
      auth: {
        getSession: () => SB().getSession(),
        onAuthStateChange: (cb) => { SB().listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      },
      from: () => ({ select: () => ({ eq: async () => SB().rows() }) }),
    };
  `,
  'ape-sss:memberStanding': `export function setMemberStanding() {}`,
  'ape-sss:localSchedule': `export function requestLocalNotifSync() {}`,
  'ape-sss:settings': `export async function loadLocalSettings() { return {}; }`,
  'ape-sss:localProgress': `export async function clearAllLocalMethodStates() { globalThis.__WIPES__.push(Date.now()); }`,
  'ape-sss:sync': `export function emitStudyProgress() {}`,
};
const MAP: Record<string, string> = {
  react: 'ape-sss:react',
  'react/jsx-runtime': 'ape-sss:jsx',
  'react-native': 'ape-sss:rn',
  '@react-native-async-storage/async-storage': 'ape-sss:async-storage',
  './lastTierCache': 'ape-sss:lastTier',
  '../../config/devMode': 'ape-sss:devMode',
  '../../config/flags': 'ape-sss:flags',
  '../../lib/supabase': 'ape-sss:supabase',
  './memberStanding': 'ape-sss:memberStanding',
  '../notifications/localSchedule': 'ape-sss:localSchedule',
  '../settings/store': 'ape-sss:settings',
  '../study/localProgress': 'ape-sss:localProgress',
  '../study/sync': 'ape-sss:sync',
};
registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL === PROVIDER_URL) {
      if (specifier in MAP) return { url: MAP[specifier], shortCircuit: true };
      // getSessionSafe, boundedCall, realAccount, entitlementExpiry: REAL (import-free).
      if (/^\.{1,2}\//.test(specifier)) return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', source: STUBS[url], shortCircuit: true };
    if (url === PROVIDER_URL) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
        fileName: 'EntitlementProvider.tsx',
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

/* ── harness ──────────────────────────────────────────────────────────── */
// useState order in EntitlementProvider: entitlement, resolved, tierKnown,
// tierReadFailed.
const S = { entitlement: 0, resolved: 1, tierKnown: 2, tierReadFailed: 3 } as const;
type SessionResult = { data: { session: unknown }; error?: unknown };
const RETRYABLE: SessionResult = { data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } };
const SIGNED_OUT: SessionResult = { data: { session: null }, error: null };
const member = (id: string): SessionResult => ({ data: { session: { user: { id, is_anonymous: false } } }, error: null });

const flush = async () => {
  for (let i = 0; i < 30; i += 1) await new Promise((r) => setImmediate(r));
};

async function mountProvider(sessionNow: () => SessionResult) {
  g.__WIPES__ = [];
  g.__H__ = { si: 0, ri: 0, state: {}, refs: {}, effects: [], log: [] as [number, unknown][] };
  g.__SB__ = {
    getSession: async () => sessionNow(),
    listeners: [] as ((event: string, session: unknown) => void)[],
    rows: () => ({ data: [{ product: 'academy', status: 'active', expires_at: null }], error: null }),
  };
  const { EntitlementProvider } = await import(PROVIDER_URL);
  EntitlementProvider({ children: null });
  for (const fx of g.__H__.effects) fx();
  const H = g.__H__;
  return {
    emit: (event: string, session: unknown) => {
      for (const cb of g.__SB__.listeners) cb(event, session);
    },
    wipes: () => g.__WIPES__.length as number,
    sets: (slot: number) => (H.log as [number, unknown][]).filter(([i]) => i === slot).map(([, v]) => v),
  };
}

test('A · offline member (expired token + AuthRetryableFetchError): no guest wipe, no settled guest tier; retries end honest', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const warn = console.warn;
  console.warn = () => {};
  try {
    const p = await mountProvider(() => RETRYABLE);
    await flush();
    // auth-js `_emitInitialSession`: the read errored → INITIAL_SESSION null.
    p.emit('INITIAL_SESSION', null);
    await flush();
    assert.equal(p.wipes(), 0, 'the member’s local study mirror was wiped as a guest’s');
    assert.ok(!p.sets(S.tierKnown).includes(true), 'the tier was settled as KNOWN while nobody knew who this was');
    assert.ok(!p.sets(S.entitlement).includes('anonymous'), 'a member was set to anonymous');
    assert.ok(p.sets(S.resolved).includes(true), 'first paint must still proceed');
    // The bounded retry takes over and, with the network still down, ends on
    // tierReadFailed ("couldn't confirm"), never on a guess.
    for (const ms of [1500, 4000, 10000]) {
      mock.timers.tick(ms);
      await flush();
    }
    assert.deepEqual(p.sets(S.tierReadFailed).filter((v) => v === true), [true]);
    assert.equal(p.wipes(), 0);
  } finally {
    console.warn = warn;
    mock.timers.reset();
  }
});

test('A · when the network comes back the retry confirms the member, and a later SIGNED_OUT still wipes', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const warn = console.warn;
  console.warn = () => {};
  try {
    let now: SessionResult = RETRYABLE;
    const p = await mountProvider(() => now);
    await flush();
    p.emit('INITIAL_SESSION', null);
    await flush();
    now = member('u1'); // refresh got through
    mock.timers.tick(1500);
    await flush();
    assert.equal(p.sets(S.entitlement).at(-1), 'academy');
    assert.ok(p.sets(S.tierKnown).includes(true));
    assert.equal(p.wipes(), 0);
    // The confirmed identity was seeded, so a real sign-out still wipes.
    now = SIGNED_OUT;
    p.emit('SIGNED_OUT', null);
    await flush();
    assert.equal(p.wipes(), 1, 'a real sign-out after recovery must wipe');
    assert.equal(p.sets(S.entitlement).at(-1), 'anonymous');
  } finally {
    console.warn = warn;
    mock.timers.reset();
  }
});

test('A · CONTROL: a real SIGNED_OUT of a signed-in member wipes exactly as before', async () => {
  let now: SessionResult = member('u1');
  const p = await mountProvider(() => now);
  await flush();
  p.emit('INITIAL_SESSION', (member('u1').data.session));
  await flush();
  assert.equal(p.wipes(), 0, 'a member’s own launch never wipes');
  now = SIGNED_OUT;
  p.emit('SIGNED_OUT', null);
  await flush();
  assert.equal(p.wipes(), 1);
  assert.equal(p.sets(S.entitlement).at(-1), 'anonymous');
  assert.equal(p.sets(S.tierKnown).at(-1), true);
});

test('A · CONTROL: a dead refresh token (auth-js REMOVED the session) is a real guest — wipe + known anonymous', async () => {
  const p = await mountProvider(() => SIGNED_OUT);
  await flush();
  p.emit('INITIAL_SESSION', null);
  await flush();
  assert.equal(p.wipes(), 1, 'a guest launch is factory-reset (owner 2026-08-17)');
  assert.equal(p.sets(S.entitlement).at(-1), 'anonymous');
  assert.equal(p.sets(S.tierKnown).at(-1), true);
});

/* ── B–I source pins ───────────────────────────────────────────────────── */
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const fnBody = (src: string, start: string) => {
  const at = src.indexOf(start);
  assert.ok(at >= 0, `missing: ${start}`);
  const end = src.indexOf('\n}\n', at);
  return src.slice(at, end < 0 ? undefined : end);
};
const profile = read('src/features/profile/api.ts').replace(/\r\n/g, '\n');
const employer = read('src/features/employer/api.ts').replace(/\r\n/g, '\n');

test('B · fetchProfile: an unknown session is "unavailable" (RETRY), not the guest card', () => {
  const b = fnBody(profile, 'export async function fetchProfile');
  assert.match(b, /safeSessionResult\(supabase\.auth\.getSession\(\), 'profile\/api'\)/);
  assert.ok(b.indexOf("if (timedOut) return { state: 'unavailable' };") >= 0);
  assert.ok(b.indexOf("if (timedOut) return { state: 'unavailable' };") < b.indexOf("return { state: 'none' };"));
});

test('C · fetchMyRegistryListing: an unknown session is "unavailable", not "not listed"', () => {
  const b = fnBody(profile, 'export async function fetchMyRegistryListing');
  assert.match(b, /safeSessionResult\(supabase\.auth\.getSession\(\)/);
  assert.ok(b.indexOf("if (timedOut) return { state: 'unavailable' };") >= 0);
  assert.ok(b.indexOf("if (timedOut) return { state: 'unavailable' };") < b.indexOf("return { state: 'none' };"));
});

test('D · fetchMyQrTokenOrThrow: an unknown session THROWS (no QR-less certificate)', () => {
  const b = fnBody(profile, 'export async function fetchMyQrTokenOrThrow');
  assert.match(b, /safeSessionResult\(supabase\.auth\.getSession\(\), 'fetchMyQrTokenOrThrow'\)/);
  assert.match(b, /if \(timedOut\) throw new Error/);
  assert.doesNotMatch(b, /hasSafeSession/);
});

test('E · fetchMyEmployerApplication: an unknown session is "error", not "never applied"', () => {
  const b = fnBody(employer, 'export async function fetchMyEmployerApplication');
  assert.match(b, /if \(timedOut\) return \{ state: 'error' \};/);
  assert.doesNotMatch(b, /hasSafeSession/);
});

test('F · amIVerifiedEmployer: an unknown session is null (read failed), not false', () => {
  const b = fnBody(employer, 'export async function amIVerifiedEmployer');
  assert.match(b, /if \(timedOut\) return null;/);
  assert.doesNotMatch(b, /hasSafeSession/);
});

test('G · Guest Mode after a failed signOut refuses on an unknown session — never wipes over a stored account', () => {
  const src = read('src/screens/auth/AuthScreen.tsx').replace(/\r\n/g, '\n');
  const at = src.indexOf("'AuthScreen/guest'");
  const seg = src.slice(at - 200, at + 400);
  assert.match(seg, /safeSessionResult\(supabase\.auth\.getSession\(\), 'AuthScreen\/guest'\)/);
  assert.match(seg, /if \(timedOut \|\| isRealAccount\(still\.session\)\) \{\s*consumeIntentionalSignOut\(\);[^\n]*\n\s*setError\('Couldn’t reach the Academy — check your connection and try again\.'\);\s*return;/);
});

test('H · Home: an unknown session never flips the guest gate on', () => {
  const src = read('src/screens/courses/CourseSelectionScreen.tsx').replace(/\r\n/g, '\n');
  assert.match(src, /safeSessionResult\(supabase\.auth\.getSession\(\), 'Home'\)/);
  assert.match(src, /if \(!sessionUnknown\) setIsGuest\(!isRealAccount\(sessData\.session\)\);/);
  assert.doesNotMatch(src, /const isGuest = !isRealAccount\(sessData\.session\);\s*setIsGuest\(isGuest\);/);
});

test('I · quiz start: an unknown session still earns the one user_not_found retry', () => {
  const src = read('src/features/quiz/api.ts').replace(/\r\n/g, '\n');
  assert.match(src, /safeSessionResult\(supabase\.auth\.getSession\(\), 'quiz\/start'\)/);
  assert.match(src, /if \(timedOut \|\| got\.data\.session\) \{\s*console\.warn\('\[quiz\] start denied before the session loaded; retrying once'\);/);
});
