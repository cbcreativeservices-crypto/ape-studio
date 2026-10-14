/**
 * TODDLER PASS — accounts, auth & profile (2026-10-13).
 *
 * 1. Password recovery: verify a code (live recovery session), have the new
 *    password refused, tap RESEND CODE, then Cancel. RESEND cleared
 *    `verifiedFor`, which was Cancel's only sign of a live session, so Cancel
 *    left the person signed in behind the sign-in screen (RETURN or a relaunch
 *    walked into the account with no new password and no device claim).
 *
 * 2. Settings › Log out: confirm, then tap Log out again while the sign-out is
 *    still out (up to 4 s + 15 s, nothing on screen). A second flush, a second
 *    dialog and a second signOut ran; the intentional marker could also lapse
 *    before the sign-out answered.
 *
 * 3. Delete account: once the server erased the account, a local step that
 *    threw said "Could not delete account" — the retry could never succeed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const auth = read('src/screens/auth/AuthScreen.tsx');
const settings = read('src/screens/settings/SettingsScreen.tsx');
const del = read('src/features/settings/DeleteAccountButton.tsx');

const body = (src: string, start: string, end: string) => {
  const a = src.indexOf(start);
  assert.ok(a >= 0, `missing ${start}`);
  const b = src.indexOf(end, a + start.length);
  assert.ok(b > a, `missing ${end} after ${start}`);
  return src.slice(a, b);
};

describe('toddler accounts 2026-10-13', () => {
  it('recovery: a verified code marks a live session that RESEND does not clear, and Cancel signs it out', () => {
    const submit = body(auth, 'const onSubmitNewPassword', 'const cancelRecovery');
    assert.match(submit, /verifiedFor\.current = addr;\s*recoverySession\.current = true;/);
    const resend = body(auth, 'const onResetPassword', 'const onSubmitNewPassword');
    assert.match(resend, /verifiedFor\.current = null/);
    assert.doesNotMatch(resend, /recoverySession\.current = false/);
    const cancel = body(auth, 'const cancelRecovery', 'const onRecoveryBack');
    assert.match(cancel, /if \(verifiedFor\.current !== null \|\| recoverySession\.current\) \{/);
    assert.match(cancel, /signOutThisDevice\(\)/);
  });

  it('recovery: a successful update going in clears the flag before the claim', () => {
    const submit = body(auth, 'const onSubmitNewPassword', 'const cancelRecovery');
    const clear = submit.indexOf('recoverySession.current = false');
    const claim = submit.indexOf('await claimAndProceed(toMain)');
    assert.ok(clear > 0 && claim > clear);
  });

  it('log out: one sign-out at a time, latched from YES until it answers', () => {
    const fn = body(settings, 'const confirmLogout', '}, [navigation]);');
    assert.match(fn, /if \(logoutRunning\.current\) return;\s*if \(logoutPending\.current\) return;/);
    assert.match(fn, /if \(logoutRunning\.current\) return;\s*logoutRunning\.current = true;/);
    assert.match(fn, /finally \{\s*logoutRunning\.current = false;/);
  });

  it('log out: the intentional marker is renewed right before the signOut call', () => {
    const fn = body(settings, 'const confirmLogout', '}, [navigation]);');
    const release = fn.indexOf("'logout/releaseDevice'");
    const remark = fn.indexOf('markIntentionalSignOut();', release);
    const signOut = fn.indexOf('supabase.auth.signOut', release);
    assert.ok(release > 0 && remark > release && signOut > remark);
  });

  it('delete: after the server erased the account, a local failure still leaves the device', () => {
    const fn = body(del, 'const runDelete', 'const fillWidth');
    const erased = fn.indexOf('erased = true;');
    assert.ok(erased > fn.indexOf("if (error) throw error;"));
    assert.match(fn, /catch \{\s*if \(erased\) \{\s*onDeleted\(\);\s*return;\s*\}/);
  });
});
