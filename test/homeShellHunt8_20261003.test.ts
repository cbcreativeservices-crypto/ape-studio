/**
 * HOME + SHELL — toddler HUNT 8 (2026-10-03).
 *
 * 1. The Dashboard's ★ "My Custom List" term sheet showed a list that could
 *    not be read as an EMPTY one. Tapping the Custom List card ran
 *    `fetchGlossaryItemsByIds([...starred])` on the LIVE `useTermList('starred')`
 *    set — the safe store's empty placeholder until its read lands, and still
 *    empty when that read FAILED. A learner with fifty starred terms got
 *    "0 terms" (no error, no Retry), the unreadable face shown as the empty
 *    one (AGENTS.md: three list faces). Final round C added `readTermList`
 *    for exactly this (it rejects on a failed read) and Flashcards already
 *    uses it; the Dashboard sheet now does too, so a failed read lands on
 *    "Could not load these terms" + Retry, which reads again.
 *
 * 2. Splash sent a signed-in member who opened the app OFFLINE to the login
 *    screen. auth-js answers an expired access token + no connection with
 *    `{ session: null, error: AuthRetryableFetchError }` and KEEPS the session
 *    stored (hunt 7's safeSessionResult rule). Splash routed on
 *    `data.session` alone, so an hour after the last use, in airplane mode,
 *    the member landed on a login they could not complete offline — the
 *    offline glossary out of reach — and Guest Mode from there wiped the
 *    device for a "guest" who was the member. Splash now reads through
 *    safeSessionResult and `splashBase` (src/navigation/splashRoute.ts):
 *    a retryable refresh failure is Main; a stall or a rejection keeps the
 *    documented login-screen fallback; a dead refresh token (session removed)
 *    is Auth. Splash leaves the authReadsBounded allowlist (shrunk).
 *
 * R2: each receipt FAILED against its file as it was at HEAD cf0b9c7e
 * (src/screens/dashboard/DashboardScreen.tsx, src/screens/SplashScreen.tsx —
 * copied aside, the old file written back, run, the fix restored, cmp clean;
 * splashRoute.ts is new, so its receipt fails on HEAD by not existing).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const DASH = readFileSync(new URL('../src/screens/dashboard/DashboardScreen.tsx', import.meta.url), 'utf8');

function body(src: string, start: string, end: string): string {
  const a = src.indexOf(start);
  assert.ok(a >= 0, `missing ${start}`);
  const b = src.indexOf(end, a);
  assert.ok(b > a, `missing ${end} after ${start}`);
  return src.slice(a, b);
}

test('[R2] the Custom List term sheet reads the STORED list (a failed read is an error, never "0 terms")', () => {
  const opener = body(DASH, 'const openFlaggedTerms = useCallback(', '// Dev Visual Index');
  assert.match(opener, /await readTermList\('starred'\)/, 'reads through readTermList, which rejects on a failed read');
  assert.doesNotMatch(opener, /\[\.\.\.starred\]/, 'never the live placeholder set');
  // The rejection reaches the error face (Retry), not an empty list.
  assert.match(opener, /catch \{[\s\S]*setTermsError\(true\)/);
  assert.match(DASH, /import \{[^}]*readTermList[^}]*\} from '..\/..\/features\/flags\/flaggedStore'/);
});

test('the error face retries through the same opener', () => {
  assert.match(DASH, /termsSource === 'flagged' \? openFlaggedTerms\(\) : openTerms\(\)/);
});

const SPLASH = readFileSync(new URL('../src/screens/SplashScreen.tsx', import.meta.url), 'utf8');

test('[R2] Splash routes through safeSessionResult + splashBase, not data.session alone', () => {
  assert.match(SPLASH, /safeSessionResult\(supabase\.auth\.getSession\(\), 'Splash'\)/);
  assert.match(SPLASH, /const base = splashBase\(read\)/);
  assert.doesNotMatch(SPLASH, /isRealAccount\(data\.session\)/);
});

test('[R2] splashBase: an offline member (retryable refresh failure) lands in the app; every other case is unchanged', async () => {
  const { splashBase } = await import('../src/navigation/splashRoute.ts');
  const retryable = { name: 'AuthRetryableFetchError' };
  // Offline, expired token: the session is still stored → signed in.
  assert.equal(splashBase({ result: { data: { session: null }, error: retryable }, timedOut: true }), 'Main');
  // A real session → Main; an anonymous device key → Auth (unchanged).
  assert.equal(splashBase({ result: { data: { session: { user: { is_anonymous: false } } } }, timedOut: false }), 'Main');
  assert.equal(splashBase({ result: { data: { session: { user: { is_anonymous: true } } } }, timedOut: false }), 'Auth');
  // No session, no error → signed out.
  assert.equal(splashBase({ result: { data: { session: null }, error: null }, timedOut: false }), 'Auth');
  // A STALL / rejection (safeSessionResult's `none`) → the documented fallback.
  assert.equal(splashBase({ result: { data: { session: null } }, timedOut: true }), 'Auth');
  // A dead refresh token (non-retryable; auth-js removed the session) → Auth.
  assert.equal(splashBase({ result: { data: { session: null }, error: { name: 'AuthApiError' } }, timedOut: false }), 'Auth');
});
