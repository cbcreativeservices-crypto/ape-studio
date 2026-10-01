/**
 * Account / auth / settings / employer — NIGHT bug pass 3 of 3 (2026-10-01).
 * Source-reading regressions for the fixes made in that pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const api = read('src/features/auth/api.ts');
const copy = read('src/features/auth/authErrorCopy.ts');
const auth = read('src/screens/auth/AuthScreen.tsx');
const sync = read('src/features/account/accountLocalSync.ts');
const wipe = read('src/features/account/clearLocalAccountData.ts');
const employer = read('src/features/employer/api.ts');

const body = (src: string, start: string, end: string) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));

test('signOutThisDevice never leaves a signOut() in flight, and spares a newer sign-in', () => {
  const fn = body(api, 'export async function signOutThisDevice', 'export async function signOutLocalRefusing');
  // Server half = the token revoke; local half run here, after the bounded wait.
  assert.match(fn, /supabase\.auth\.admin\.signOut\(token, 'local'\)/);
  assert.match(fn, /const gen = signInAttempt;/);
  assert.match(fn, /if \(gen !== signInAttempt\) \{[\s\S]*?if \(now !== token\) return;\s*\}/);
  assert.ok(fn.indexOf('if (gen !== signInAttempt)') < fn.indexOf('auth._removeSession?.()'));
  // The public signOut() appears only as the fallback for a client with no local half.
  assert.equal((fn.match(/supabase\.auth\.signOut\(/g) ?? []).length, 1);
  assert.match(fn, /typeof auth\._removeSession === 'function'/);
});

test('ensureSession drops a different account through signOutThisDevice (bounded)', () => {
  const fn = body(api, 'export async function ensureSession', 'supabase.auth.signUp(');
  assert.match(fn, /markIntentionalSignOut\(\);[\s\S]*?await signOutThisDevice\(\);/);
  assert.doesNotMatch(fn, /supabase\.auth\.signOut\(/);
});

test('Guest Mode signs out with nothing left in flight, and a refusal changes nothing', () => {
  const fn = body(api, 'export async function signOutLocalRefusing', 'export async function signIn(');
  // A stalled session read refuses rather than reading as "no session".
  assert.doesNotMatch(fn, /safeSession\(/);
  assert.match(fn, /withDeadline\(\(\) => supabase\.auth\.getSession\(\), 'signOut', ms\)/);
  assert.match(fn, /withDeadline\(async \(\) => \(await supabase\.auth\.admin\.signOut\(token, 'local'\)\)\.error, 'signOut', ms\)/);
  assert.ok(fn.indexOf('markIntentionalSignOut();') < fn.indexOf('auth._removeSession?.()'));
  const guest = body(auth, 'const enterGuest = async', 'await runAfterAccountSync(');
  assert.match(guest, /await signOutLocalRefusing\(10000\);/);
  assert.match(guest, /\/signOut timeout\/\.test\(outError\.message \?\? ''\)\) \{\s*consumeIntentionalSignOut\(\);/);
  assert.doesNotMatch(guest, /supabase\.auth\.signOut\(/);
});

test('Account -> Guest: the Finder record is read before the sign-out, and the guest wipe waits for the sync', () => {
  const guest = body(auth, 'const enterGuest = async', 'const onCreateAccount');
  const read1 = guest.indexOf("const finderRecord = await AsyncStorage.getItem('ape:careerfinder:v1');");
  assert.ok(read1 > 0 && read1 < guest.indexOf('await signOutLocalRefusing('));
  const queued = guest.slice(guest.indexOf('await runAfterAccountSync(async () => {'));
  assert.match(queued, /await clearLocalAccountData\(\{ total: true \}\);\s*[\s\S]*?if \(finderRecord\) await AsyncStorage\.setItem\('ape:careerfinder:v1', finderRecord\);[\s\S]*?resetAllLocalStores\(\);[\s\S]*?await AsyncStorage\.setItem\('ape:localUserId', ''\);\s*\}\);/);
  // One module-level queue shared by the auth-event syncs and Guest Mode.
  assert.match(sync, /^let chain: Promise<void> = Promise\.resolve\(\);/m);
  assert.match(sync, /export function runAfterAccountSync<T>/);
  assert.match(sync, /softDeadline\(\(\) => prev, undefined, 'accountSync\/wait', waitMs\)\.then\(fn\)/);
  assert.match(sync, /chain = chain\.then\(\(\) => syncLocalToIdentity\(identity\)\)\.catch\(\(\) => \{\}\);/);
  assert.equal((sync.match(/let chain/g) ?? []).length, 1);
});

test('same_password counts as done only after an earlier update went unanswered', () => {
  const fn = body(api, 'export async function updatePassword', '\n}\n');
  assert.match(fn, /updateUnanswered &&/);
  assert.match(fn, /else if \(\/timeout\|network\|fetch\/i\.test\(error\.message \?\? ''\)\) updateUnanswered = true;/);
  assert.match(copy, /different from the old password\/i\.test\(m\)\) \{\s*return 'That is already this account’s password — choose a different one\.';/);
});

test('employer admin writes and queue reads are bounded, with honest timeout wording', () => {
  for (const rpc of ['employer_review', 'employer_revoke', 'employer_pending_list', 'employer_active_list']) {
    assert.match(employer, new RegExp(`withDeadline\\(\\s*async \\(\\) => await supabase\\.rpc\\('${rpc}'`), rpc);
  }
  assert.match(employer, /const ADMIN_TIMEOUT_COPY = 'Couldn’t confirm — check the list after reconnecting\.';/);
  assert.equal((employer.match(/if \(isTimeout\(e\)\) return \{ ok: false, error: ADMIN_TIMEOUT_COPY \};/g) ?? []).length, 2);
});

test('the calculator workflow store is reset on an account wipe', () => {
  assert.match(wipe, /import \{ resetCalcWorkflowStore \} from '\.\.\/\.\.\/screens\/lab\/calc\/workflowStore';/);
  assert.match(body(wipe, 'export function resetAllLocalStores', '\n}\n'), /resetCalcWorkflowStore\(\);/);
});
