/**
 * Account / auth / settings — NIGHT bug pass 2 of 3 (2026-10-01).
 * Source-reading regressions for the fixes made in that pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const api = read('src/features/auth/api.ts');
const auth = read('src/screens/auth/AuthScreen.tsx');
const settings = read('src/screens/settings/SettingsScreen.tsx');
const wipe = read('src/features/account/clearLocalAccountData.ts');

const body = (src: string, start: string, end: string) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));

test('a sign-in that lands after its deadline is signed back out unless a newer attempt started', () => {
  const fn = body(api, 'async function boundedSignIn', 'export const REGISTER_ERROR_COPY');
  assert.match(fn, /const mine = \+\+signInAttempt;/);
  assert.match(fn, /const call = run\(\);/);
  assert.match(fn, /catch \(e\) \{\s*void call\.then\(/);
  assert.match(fn, /if \(!late\?\.data\?\.session \|\| mine !== signInAttempt\) return;\s*markIntentionalSignOut\(\);\s*void signOutThisDevice\(\);/);
  assert.match(fn, /return orTimeoutError\(e\);/);
  for (const label of ["'signUp'", "'signIn'", "'verifyOtp'"]) assert.ok(api.includes(label), label);
});

test('a password update that already landed is not reported as a failure on the retry', () => {
  const fn = body(api, 'export async function updatePassword', '\n}\n');
  // Night pass 3: only once an earlier attempt went unanswered.
  assert.match(fn, /updateUnanswered &&\s*\(code === 'same_password' \|\| \/different from the old password\/i\.test\(error\?\.message \?\? ''\)\)\s*\) \{\s*updateUnanswered = false;\s*return null;/);
});

test('takeover Cancel and recovery Cancel sign out bounded and for sure, holding the form until done', () => {
  const cancel = auth.slice(auth.indexOf('onCancel: () => {'), auth.indexOf('onCancel: () => {') + 1400);
  assert.match(cancel, /markIntentionalSignOut\(\);[\s\S]*?void signOutThisDevice\(\)\.finally\(end\);[\s\S]*?hold\(\);/);
  assert.doesNotMatch(cancel, /supabase\.auth\.signOut\(/);
  const rec = body(auth, 'const cancelRecovery = () => {', "setMode('main');\n    setError(null);");
  assert.match(rec, /void signOutThisDevice\(\)\.finally\(end\);[\s\S]*?hold\(\);/);
  assert.doesNotMatch(rec, /supabase\.auth\.signOut\(/);
  // signOutThisDevice itself never hangs: every step is softDeadline-bounded.
  const sotd = body(api, 'export async function signOutThisDevice', 'export async function signOutLocalRefusing');
  // (Night pass 3: three — the server revoke, the local removal, and the
  // public-signOut fallback for a client without the private local half.)
  assert.equal((sotd.match(/softDeadline/g) ?? []).length, 3);
});

test('Guest Mode sign-out is bounded, and a stall refuses without the lock-queued session check', () => {
  const guest = body(auth, 'const enterGuest = async', 'await runAfterAccountSync(');
  // Night pass 3: through signOutLocalRefusing (bounded, nothing left in flight).
  assert.match(guest, /await signOutLocalRefusing\(\d+\);/);
  const stall = guest.indexOf('/signOut timeout/.test(');
  assert.ok(stall > 0);
  assert.ok(stall < guest.indexOf('safeSession(supabase.auth.getSession()'));
});

test('an offline recovery-code check does not blame the code', () => {
  const fn = body(auth, 'const onSubmitNewPassword = async', 'const cancelRecovery');
  assert.match(fn, /\/offline\/i\.test\(verifyErr\) \? verifyErr : 'That code is incorrect or expired/);
});

test('the form is held through the post-redeem claim, and cannot be left mid-request', () => {
  assert.match(auth, /hold\(\);\s*void claimAndProceed\(toHome\)\.finally\(end\);/);
  assert.match(auth, /navigation\.canGoBack\(\) && mode !== 'recovery' && !busy \? \(/);
  assert.match(auth, /if \(!busy\) return;\s*const sub = BackHandler\.addEventListener\('hardwareBackPress', \(\) => true\);/);
});

test('Log out: the queue flush and the sign-out are both bounded', () => {
  assert.match(settings, /softDeadline\(\s*async \(\) => \{\s*await Promise\.allSettled\(\[replayQueue\(\), replayQuizSubmissions\(\), flushScenarioQueue\(\)\]\);/);
  assert.match(settings, /'logout\/flush',\s*15000,/);
});

test('the account wipe sweeps again after the SQLite clear, closing the re-persist window', () => {
  const fn = body(wipe, 'export async function clearLocalAccountData', 'async function sweepApeKeys');
  const first = fn.indexOf('await sweepApeKeys(opts);');
  const sqlite = fn.indexOf('await clearStoredMeasurements();');
  const second = fn.lastIndexOf('await sweepApeKeys(opts);');
  assert.ok(first >= 0 && sqlite > first && second > sqlite);
  // The sweep itself keeps every rule (KEEP list, onboarding flags, exam drafts).
  const sweep = wipe.slice(wipe.indexOf('async function sweepApeKeys'), wipe.indexOf('export function resetAllLocalStores'));
  assert.match(sweep, /KEEP\.has\(k\)/);
  assert.match(sweep, /isOnboardingFlag\(k\)/);
  assert.match(sweep, /ape:attemptDraft:/);
});
