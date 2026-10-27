/**
 * Wake report (owner, 2026-10-27, iPhone build 39): "after a long while away
 * … it loads from the startup login gate screen".
 *
 * Cause: auth-js `getSession()` waits for its start-up token refresh, which
 * retries with backoff (200, 400, 800, 1600, 3200 ms …) for up to 30 s. An
 * expired token + a network not up within ~3 s of launch outlasted Splash's
 * 5 s bound, safeSessionResult answered "stalled, no error", and splashBase
 * sent a signed-in member to Auth while the refresh then succeeded behind it.
 *
 * R1: each receipt fails on the pre-fix src (splashBase has no storedAccount
 * branch; Splash has no marker read and no confirm read).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const SPLASH = readFileSync(new URL('../src/screens/SplashScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const AUTH_CONSTANTS = readFileSync(
  new URL('../node_modules/@supabase/auth-js/dist/module/lib/constants.js', import.meta.url),
  'utf8',
);

test('[R1] the premise: an offline/stalled start-up refresh outlasts the Splash bound', async () => {
  const { SESSION_TIMEOUT_MS } = await import('../src/lib/getSessionSafe.ts');
  const tick = /AUTO_REFRESH_TICK_DURATION_MS = (\d+) \* 1000/.exec(AUTH_CONSTANTS);
  assert.ok(tick, 'auth-js still bounds its refresh retries by AUTO_REFRESH_TICK_DURATION_MS');
  // Backoff 200·2^(n-1) while it fits in the tick: the last attempt that can
  // start inside 5 s is at 3.0 s; the next is at 6.2 s.
  let t = 0;
  let n = 1;
  while (t + 200 * 2 ** (n - 1) < Number(tick[1]) * 1000) t += 200 * 2 ** (n++ - 1);
  assert.ok(t > SESSION_TIMEOUT_MS, `a failing refresh keeps retrying for ${t} ms, past the ${SESSION_TIMEOUT_MS} ms bound`);
});

test('[R1] splashBase: a STALL on a device whose marker names an account is the member (Main)', async () => {
  const { splashBase } = await import('../src/navigation/splashRoute.ts');
  const stall = { result: { data: { session: null } }, timedOut: true };
  assert.equal(splashBase({ ...stall, storedAccount: true }), 'Main');
  // No marker / a guest marker → unchanged fallback.
  assert.equal(splashBase({ ...stall, storedAccount: false }), 'Auth');
  assert.equal(splashBase(stall), 'Auth');
  // A dead refresh token answers FAST (not a stall) → signed out, marker or not.
  assert.equal(
    splashBase({ result: { data: { session: null }, error: { name: 'AuthApiError' } }, timedOut: false, storedAccount: true }),
    'Auth',
  );
  // No session, no error, not stalled → signed out, marker or not.
  assert.equal(splashBase({ result: { data: { session: null }, error: null }, timedOut: false, storedAccount: true }), 'Auth');
  // An anonymous device key is never an account.
  assert.equal(
    splashBase({ result: { data: { session: { user: { is_anonymous: true } } } }, timedOut: false, storedAccount: true }),
    'Auth',
  );
});

test('[R1] Splash asks the account marker ONLY for a stall, bounded', () => {
  assert.match(SPLASH, /read\.timedOut && !read\.result\.error\s*\?\s*await softDeadline\(async \(\) => !!\(await readDeviceAccountMarker\(\)\), false, 'Splash\/accountMarker', \d+\)\s*:\s*false/);
});

test('[R1] a stalled launch that went in is confirmed once, and a definite "no account" goes to Auth', () => {
  const i = SPLASH.indexOf('if (signedIn && read.timedOut) {');
  assert.ok(i > SPLASH.indexOf('navigation.reset({'), 'the confirm runs after the hand-off');
  const block = SPLASH.slice(i, SPLASH.indexOf('.catch(() => {});', i));
  assert.match(block, /safeSessionResult\(supabase\.auth\.getSession\(\), 'Splash\/confirm'\)/);
  assert.match(block, /if \(late\.timedOut \|\| splashBase\(late\) === 'Main'\) return;/, 'a still-unknown or retryable read stays in');
  assert.match(block, /navigationRef\.reset\(\{ index: 0, routes: \[\{ name: 'Auth' as never \}\] \}\)/);
});
