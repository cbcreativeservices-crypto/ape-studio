/**
 * TODDLER BUG HUNT — account HOLD items 7–10, owner-approved (2026-10-14).
 *
 *  7. Half-created account: sign-up's second step (register_commercial_user)
 *     failed and the device kept the auth session — RETURN, LOGIN or a
 *     relaunch walked into an account with no record. Now signed out with
 *     "Account setup didn't finish — please try again." Launch and LOGIN do
 *     the same on a DEFINITIVE "no record" only (the cold-start race).
 *  8. A valid reset code, app closed before the new password → the next open
 *     went straight in. A persisted flag now makes that launch sign out.
 *  9. Delete that timed out on the client but succeeded on the server left
 *     the device signed in. A timeout now asks the auth server.
 * 10. (a) user name limited to 60; (b) "123 456" reset code accepted;
 *     (c) the delete wipe runs on the same queue as the other wipes.
 *
 * Behaviour where the module loads under Node, source-reading where it needs
 * React Native.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ACCOUNT_SETUP_UNFINISHED,
  checkAccountRecord,
  classifyUserLookup,
  normalizeResetCode,
  type RowRead,
  type SessionRead,
} from '../src/features/auth/authErrorCopy.ts';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const body = (src: string, start: string, end: string) => {
  const a = src.indexOf(start);
  assert.ok(a >= 0, `missing ${start}`);
  const b = src.indexOf(end, a + start.length);
  assert.ok(b > a, `missing ${end} after ${start}`);
  return src.slice(a, b);
};

/* ---- the passwordResetPending store, on a fake AsyncStorage ---------------- */
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__TAH_AS__ = AS;
g.__TAH_FAIL_READS__ = false;
g.__TAH_QUEUED__ = 0;
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__TAH_AS__;
     export default {
       async getItem(k) {
         if (globalThis.__TAH_FAIL_READS__) throw new Error('storage read failed');
         return s.has(k) ? s.get(k) : null;
       },
       async setItem(k, v) { s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
       async multiRemove(ks) { for (const k of ks) s.delete(k); },
     };`,
  );
const FAKE_SYNC =
  'data:text/javascript,' +
  encodeURIComponent(
    `export function runAfterAccountSync(fn) { globalThis.__TAH_QUEUED__++; return Promise.resolve().then(fn); }`,
  );
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier === '../account/accountLocalSync' && context.parentURL?.includes('features/auth/')) {
      return { url: FAKE_SYNC, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

/* ---- #7: the record check ------------------------------------------------- */
const member: SessionRead = { uid: 'u1', real: true };
function harness(sessions: SessionRead[], rows: (RowRead | 'throw')[]) {
  let s = 0;
  let r = 0;
  const calls = { session: 0, row: 0 };
  return {
    calls,
    deps: {
      readSession: async () => {
        calls.session++;
        return sessions[Math.min(s++, sessions.length - 1)];
      },
      readRow: async () => {
        calls.row++;
        const next = rows[Math.min(r++, rows.length - 1)];
        if (next === 'throw') throw new Error('users row check timeout after 10000ms');
        return next;
      },
    },
  };
}

describe('#7 half-created account: checkAccountRecord', () => {
  it('a row → present, one read', async () => {
    const h = harness([member], [{ found: true }]);
    assert.equal(await checkAccountRecord(h.deps), 'present');
    assert.equal(h.calls.row, 1);
  });

  it('missing ONLY after two empty answers with the same account confirmed between them', async () => {
    const h = harness([member, member], [{ found: false }, { found: false }]);
    assert.equal(await checkAccountRecord(h.deps), 'missing');
    assert.equal(h.calls.session, 2, 'getSession() is re-asked before the second read (the cold-start race)');
    assert.equal(h.calls.row, 2);
  });

  it('the cold-start race: an empty or anon-denied first read, then the row → present', async () => {
    assert.equal(await checkAccountRecord(harness([member], [{ found: false }, { found: true }]).deps), 'present');
    const denied = { error: { code: '42501', message: 'permission denied for table users' } };
    assert.equal(await checkAccountRecord(harness([member], [denied, { found: true }]).deps), 'present');
  });

  it('a member is NEVER "missing" on a network error, a stall or a second denial', async () => {
    const offline = { error: { message: 'TypeError: Network request failed' } };
    const denied = { error: { code: '42501', message: 'permission denied' } };
    assert.equal(await checkAccountRecord(harness([member], [offline]).deps), 'unknown');
    assert.equal(await checkAccountRecord(harness([member], ['throw']).deps), 'unknown');
    assert.equal(await checkAccountRecord(harness([member], [{ found: false }, offline]).deps), 'unknown');
    assert.equal(await checkAccountRecord(harness([member], [{ found: false }, 'throw']).deps), 'unknown');
    assert.equal(await checkAccountRecord(harness([member], [denied, denied]).deps), 'unknown');
  });

  it('no account to judge (guest, device key, unreadable or changed session) → unknown, no row read', async () => {
    const guest = harness([{ uid: null, real: false }], [{ found: false }]);
    assert.equal(await checkAccountRecord(guest.deps), 'unknown');
    assert.equal(guest.calls.row, 0);
    assert.equal(await checkAccountRecord(harness([{ uid: 'anon', real: false }], [{ found: false }]).deps), 'unknown');
    assert.equal(await checkAccountRecord(harness(['unknown'], [{ found: false }]).deps), 'unknown');
    const switched = harness([member, 'unknown'], [{ found: false }, { found: false }]);
    assert.equal(await checkAccountRecord(switched.deps), 'unknown', 'session unreadable on the re-check');
    const other = harness([member, { uid: 'u2', real: true }], [{ found: false }, { found: false }]);
    assert.equal(await checkAccountRecord(other.deps), 'unknown', 'a different account by the re-check');
  });

  it('sign-up: a failed or unanswered second step signs the device out with the owner wording', () => {
    const ca = read('src/features/commercial/commercialAuth.ts');
    assert.equal(ACCOUNT_SETUP_UNFINISHED, 'Account setup didn’t finish — please try again.');
    const fn = body(ca, 'export async function registerCommercialUser', '\n}\n');
    // The stall is caught here, not thrown past the sign-out.
    assert.match(fn, /try \{\s*\(\{ data, error \} = await withDeadline\(/);
    assert.match(fn, /if \(status === 'ok' \|\| status === 'already_registered'\) return \{ success: true, created: status === 'ok' \};/);
    const success = fn.indexOf("return { success: true }");
    const out = fn.indexOf('await signOutHalfCreatedAccount();');
    assert.ok(out > success, 'every non-success after the session exists signs out');
    assert.match(fn.slice(out), /return \{ success: false, error: ACCOUNT_SETUP_UNFINISHED \};/);
  });

  it('signOutHalfCreatedAccount marks the sign-out intentional and uses the bounded local sign-out', () => {
    const api = read('src/features/auth/api.ts');
    const fn = body(api, 'export async function signOutHalfCreatedAccount', '\n}\n');
    assert.match(fn, /markIntentionalSignOut\(\);\s*await signOutThisDevice\(\);/);
    const live = read('src/features/auth/api.ts');
    const chk = body(live, 'export async function checkMyAccountRecord', '\n}\n');
    assert.match(chk, /safeSessionResult\(supabase\.auth\.getSession\(\)/);
    assert.match(chk, /if \(timedOut\) return 'unknown';/);
    assert.match(chk, /readRow: readUsersRowPresence/);
  });

  it('LOGIN, recovery and launch: only a definitive "missing" signs out', () => {
    const auth = read('src/screens/auth/AuthScreen.tsx');
    const login = body(auth, 'const onLogin', 'const onResetPassword');
    const chk = login.indexOf("if ((await checkMyAccountRecord()) === 'missing') {");
    assert.ok(chk > 0 && chk < login.indexOf('await claimAndProceed(toMain)'), 'checked before going in');
    assert.match(login, /await signOutHalfCreatedAccount\(\);\s*setError\(ACCOUNT_SETUP_UNFINISHED_SIGN_IN\);\s*return;/);
    const submit = body(auth, 'const onSubmitNewPassword', 'const cancelRecovery');
    const rchk = submit.indexOf("if ((await checkMyAccountRecord()) === 'missing') {");
    assert.ok(rchk > 0 && rchk < submit.indexOf('await claimAndProceed(toMain)'));

    const splash = read('src/screens/SplashScreen.tsx');
    assert.match(splash, /return \(await checkMyAccountRecord\(\)\) === 'missing' \? 'setupUnfinished' : 'proceed';/);
    assert.match(splash, /\.catch\(\(\): LaunchVerdict => 'proceed'\)/, 'a failed check goes in');
    assert.match(splash, /softDeadline\(\(\) => launchVerdict, 'proceed' as LaunchVerdict/, 'an unanswered check goes in');
    assert.match(splash, /if \(verdict !== 'proceed'\) \{\s*\/\/[^\n]*\n\s*await signOutHalfCreatedAccount\(\);/);
    assert.match(splash, /if \(notice\) notify\('Signed out', notice\);/);
  });

  it('the users read behind the check returns its error instead of swallowing it, scoped and bounded', () => {
    const row = read('src/features/auth/api.ts');
    const fn = body(row, 'async function readUsersRowPresence', '\n}\n');
    assert.match(fn, /withDeadline\(/);
    assert.match(fn, /\.eq\('auth_id', uid\)\.maybeSingle\(\)/);
    assert.match(fn, /if \(error\) return \{ error \};/);
  });
});

/* ---- #8: password reset in progress -------------------------------------- */
describe('#8 an unfinished password reset', () => {
  it('the flag round-trips on disk, and an UNREADABLE flag never signs anyone out', async () => {
    const m = await import('../src/features/auth/passwordResetPending.ts');
    AS.clear();
    assert.equal(await m.isPasswordResetPending(), false);
    const before = g.__TAH_QUEUED__ as number;
    await m.markPasswordResetPending();
    assert.equal(AS.get(m.PASSWORD_RESET_PENDING_KEY), 'true');
    assert.equal(await m.isPasswordResetPending(), true);
    await m.clearPasswordResetPending();
    assert.equal(AS.has(m.PASSWORD_RESET_PENDING_KEY), false, 'nothing pending = nothing stored');
    assert.equal(await m.isPasswordResetPending(), false);
    assert.equal((g.__TAH_QUEUED__ as number) - before, 2, 'both writes run on the identity-wipe queue');

    // Set on disk, but the read FAILS at launch: never treated as pending.
    const reg = await import('../src/features/storage/localStoreRegistry.ts');
    await m.markPasswordResetPending();
    reg.resetRegisteredLocalStores(); // a fresh launch's memory
    g.__TAH_FAIL_READS__ = true;
    try {
      assert.equal(await m.isPasswordResetPending(), false);
    } finally {
      g.__TAH_FAIL_READS__ = false;
    }
    assert.equal(await m.isPasswordResetPending(), true, 'read again once readable');
  });

  it('the flag survives the identity wipes (KEEP and GUEST_KEEP)', () => {
    const wipe = read('src/features/account/clearLocalAccountData.ts');
    const keep = wipe.match(/const KEEP[^=]*= new Set<string>\(\[([\s\S]*?)\]\);/);
    const guest = wipe.match(/const GUEST_KEEP[^=]*= new Set<string>\(\[([\s\S]*?)\]\);/);
    assert.ok(keep && guest);
    assert.ok(keep[1].includes("'ape:passwordResetPending'"));
    assert.ok(guest[1].includes("'ape:passwordResetPending'"));
  });

  it('AuthScreen: set BEFORE the code is checked; cleared on success, on Cancel (after the sign-out) and on a failed verify', () => {
    const auth = read('src/screens/auth/AuthScreen.tsx');
    const submit = body(auth, 'const onSubmitNewPassword', 'const cancelRecovery');
    const mark = submit.indexOf('await markPasswordResetPending();');
    const verify = submit.indexOf('await verifyRecoveryOtp(');
    assert.ok(mark > 0 && verify > mark);
    assert.match(submit, /if \(!recoverySession\.current\) void clearPasswordResetPending\(\);/);
    const update = submit.indexOf('await updatePassword(newPassword)');
    const cleared = submit.indexOf('await clearPasswordResetPending();');
    assert.ok(cleared > update && cleared < submit.indexOf('await claimAndProceed(toMain)'));
    const cancel = body(auth, 'const cancelRecovery', 'const onRecoveryBack');
    assert.match(cancel, /signOutThisDevice\(\)\s*\.then\(\(\) => clearPasswordResetPending\(\)\)/);
    assert.match(cancel, /\} else \{\s*void clearPasswordResetPending\(\);\s*\}/);
  });

  it('Splash: a pending reset with a signed-in session signs out and clears; without one, the flag is just dropped', () => {
    const splash = read('src/screens/SplashScreen.tsx');
    assert.match(splash, /if \(splashBase\(read\) !== 'Main'\) \{[\s\S]*?if \(pending\) void clearPasswordResetPending\(\);\s*return 'proceed';/);
    assert.match(splash, /if \(pending\) return 'resetUnfinished';/);
    assert.match(splash, /if \(verdict === 'resetUnfinished'\) await clearPasswordResetPending\(\);/);
  });
});

/* ---- #9: delete that timed out ------------------------------------------- */
describe('#9 delete account after a client timeout', () => {
  it('classifyUserLookup: only "this user does not exist" is gone', () => {
    assert.equal(
      classifyUserLookup({ data: { user: null }, error: { status: 403, code: 'user_not_found', message: 'User from sub claim in JWT does not exist' } }),
      'gone',
    );
    assert.equal(classifyUserLookup({ data: { user: null }, error: { status: 404, message: 'User not found' } }), 'gone');
    assert.equal(classifyUserLookup({ data: { user: { id: 'u1' } }, error: null }), 'present');
    assert.equal(classifyUserLookup({ data: { user: null }, error: { name: 'AuthRetryableFetchError', status: 0, message: 'Failed to fetch' } }), 'unknown');
    assert.equal(classifyUserLookup({ data: { user: null }, error: { status: 500, message: 'Internal error' } }), 'unknown');
    assert.equal(classifyUserLookup({ data: { user: null }, error: { status: 403, message: 'invalid JWT' } }), 'unknown');
    assert.equal(classifyUserLookup(null), 'unknown');
  });

  it('a thrown (timed-out / unanswered) delete re-checks, and only "gone" goes on to the sign-out + wipe', () => {
    const del = read('src/features/settings/DeleteAccountButton.tsx');
    const fn = body(del, 'const runDelete', 'const fillWidth');
    assert.match(fn, /\} catch \(unanswered\) \{[\s\S]*?if \(\(await lookUpDeletedAccount\(\)\) !== 'gone'\) throw unanswered;\s*\}/);
    const recheck = fn.indexOf('lookUpDeletedAccount()');
    assert.ok(recheck < fn.indexOf('erased = true;'));
    assert.ok(fn.indexOf('await signOutThisDevice();') > fn.indexOf('erased = true;'));
    const live = read('src/features/auth/api.ts');
    const look = body(live,'export async function lookUpDeletedAccount', '\n}\n');
    assert.match(look, /withDeadline\(async \(\) => await supabase\.auth\.getUser\(\)/);
    assert.match(look, /catch \{\s*return 'unknown';/);
  });
});

/* ---- #10 ------------------------------------------------------------------ */
describe('#10 small ones', () => {
  it('(a) the user name is held to 60: input maxLength and a clamp on save', () => {
    const pp = read('src/features/profile/publicProfile.ts');
    assert.match(pp, /export const USER_NAME_MAX = 60;/);
    const save = body(pp, 'export async function savePublicProfile', '\n}\n');
    assert.match(save, /^export async function savePublicProfile\(input: PublicProfile[^\n]*\n\s*const p = clampUserName\(input\);/);
    assert.match(pp, /p\.name\.length > USER_NAME_MAX \? \{ \.\.\.p, name: p\.name\.slice\(0, USER_NAME_MAX\) \} : p/);
    const profile = read('src/screens/profile/ProfileScreen.tsx');
    const field = body(profile, 'ref={nameRef}', '/>');
    assert.match(field, /maxLength=\{USER_NAME_MAX\}/);
  });

  it('(b) a code pasted as "123 456" is the code', () => {
    assert.equal(normalizeResetCode('123 456'), '123456');
    assert.equal(normalizeResetCode(' 12 34 56\n'), '123456');
    assert.equal(normalizeResetCode('123\t456'), '123456');
    const auth = read('src/screens/auth/AuthScreen.tsx');
    const submit = body(auth, 'const onSubmitNewPassword', 'const cancelRecovery');
    assert.match(submit, /const code = normalizeResetCode\(resetCode\);\s*if \(!\/\^\\d\{6\}\$\/\.test\(code\)\) \{/);
    assert.match(submit, /verifyRecoveryOtp\(email\.trim\(\), code\)/);
    assert.match(read('src/features/auth/api.ts'), /token: normalizeResetCode\(token\), type: 'recovery'/);
  });

  it('(c) the delete wipe runs on the account-sync queue, after the sign-out', () => {
    const del = read('src/features/settings/DeleteAccountButton.tsx');
    const fn = body(del, 'const runDelete', 'const fillWidth');
    assert.match(fn, /await runAfterAccountSync\(async \(\) => \{\s*await clearLocalAccountData\(\);\s*resetAllLocalStores\(\);\s*\}\);/);
    assert.ok(fn.indexOf('runAfterAccountSync(') > fn.indexOf('await signOutThisDevice();'));
  });
});
