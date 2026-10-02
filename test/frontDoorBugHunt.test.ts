/**
 * Front-door / account bug hunt, 2026-09-29 — source guards.
 *
 * Each fix below is a line or two that looks removable in isolation (a guard
 * ref, a request id, a different onRequestClose), and each one's regression is
 * invisible until somebody double-taps on a real phone. These tests pin the
 * shape of every fix so a tidy-up cannot quietly undo it. The WHY for each is
 * in the comment beside the code it checks.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

describe('auth (F1, F2, F12, F15)', () => {
  const api = read('src/features/auth/api.ts');
  const auth = read('src/screens/auth/AuthScreen.tsx');

  it('ensureSession only resumes a real session for the SAME email; otherwise signs out first', () => {
    const body = api.slice(api.indexOf('export async function ensureSession'), api.indexOf('supabase.auth.signUp('));
    assert.match(body, /sessionEmail\s*===\s*email\.trim\(\)\.toLowerCase\(\)\)\s*return null/);
    // Local scope since bug pass 2 (2026-09-30) — never the account's other sessions.
    // Night pass 3 (2026-10-01): through signOutThisDevice — bounded, no late removal.
    assert.match(body, /markIntentionalSignOut\(\);[\s\S]*?await signOutThisDevice\(\);/);
    assert.doesNotMatch(body, /if \(isRealAccount\([^)]*\)\) return null;/);
  });

  it('recovery skips re-verifying a code that already verified', () => {
    assert.match(auth, /if \(verifiedFor\.current !== addr\) \{\s*\n\s*const verifyErr = await verifyRecoveryOtp/);
    assert.match(auth, /verifiedFor\.current = addr;/);
  });

  it('Resend Code keeps the typed new password', () => {
    assert.match(auth, /if \(mode !== 'recovery'\) setNewPassword\(''\);/);
  });

  it('hardware BACK during recovery cancels it', () => {
    assert.match(
      auth,
      // (bug pass 2, 2026-09-30: …except mid-request, when BACK is swallowed.)
      // (pattern hunt P13, 2026-10-02: through the focus-scoped hook, registered only in recovery.)
      /const onRecoveryBack = useCallback\(\(\) => \{[\s\S]{0,400}?if \(inFlight\.current\) return true;\s*\n\s*cancelRecovery\(\);\s*\n\s*return true;/,
    );
    assert.match(auth, /useBackWhileFocused\(mode === 'recovery', onRecoveryBack\);/);
  });
});

describe('AppDialog queue (F3)', () => {
  const dlg = read('src/components/AppDialog.tsx');

  it('drops a request identical to the one showing or queued', () => {
    assert.match(dlg, /a\.title === b\.title && a\.body === b\.body/);
    // (night pass 3, 2026-10-01: the queue is checked with no dialog up too.)
    assert.match(dlg, /if \(\(current && sameDialog\(current, req\)\) \|\| queue\.some\(\(q\) => sameDialog\(q, req\)\)\) return;/);
  });

  it('ignores an answer that lands within the guard window of a dialog appearing', () => {
    assert.match(dlg, /export const ANSWER_GUARD_MS = 300;/);
    assert.match(dlg, /if \(current && Date\.now\(\) - shownAt < ANSWER_GUARD_MS\) return;/);
  });

  it('forced sign-outs clear stale dialogs before resetting the navigator', () => {
    assert.match(dlg, /export function clearAppDialogs\(\): void/);
    for (const f of ['src/features/account/SingleDeviceGuard.tsx', 'src/features/account/SessionExpiryGuard.tsx']) {
      const src = read(f);
      const clear = src.indexOf('clearAppDialogs();');
      const reset = src.indexOf('navigationRef.reset(');
      assert.ok(clear > 0 && reset > clear, `${f}: clearAppDialogs() must run before navigationRef.reset`);
    }
  });

  it('trigger-level in-flight guards are in place', () => {
    assert.match(read('src/screens/settings/SettingsScreen.tsx'), /if \(logoutPending\.current\) return;/);
    assert.match(read('src/screens/admin/EmployerAdminScreen.tsx'), /if \(inFlight\.current\) return;/);
    assert.match(read('src/screens/directory/MyProfileView.tsx'), /if \(publishing\.current\) return;/);
  });
});

describe('directory sends (F4, F5, F6)', () => {
  const bits = read('src/screens/directory/directoryBits.tsx');
  const req = read('src/screens/directory/RequestsView.tsx');
  const dir = read('src/screens/directory/AudioCommunityDirectoryScreen.tsx');

  it('useSending guards on a ref, not only on state', () => {
    assert.match(bits, /if \(inFlight\.current\) return;/);
  });

  it('every send goes through useSending', () => {
    // Per-thread lock since night pass 3 (2026-10-01) — still one send at a time per thread.
    assert.match(req, /runSendIn\(thread\.id, \(\) =>\s*\n\s*sendThreadMessage\(/);
    assert.match(req, /runReport\(\(\) => reportMember\(/);
    assert.match(req, /runAct\(\(\) =>\s*\n\s*respondToRequest\(/);
    assert.match(dir, /runSend\(\(\) => onSend\(purpose/);
    assert.match(dir, /runSend\(\(\) => onSend\(reason, detail\)\)/);
    assert.doesNotMatch(dir, /void reportMember\(/);
  });

  it('member-sheet BLOCK confirms first and a report is acknowledged', () => {
    assert.match(dir, /onPress=\{\(\) => setConfirmBlock\(true\)\}/);
    assert.match(dir, /setReported\(true\)/);
    assert.doesNotMatch(dir, /onPress=\{\(\) =>\s*\n\s*void blockMember\(/);
  });
});

describe('stale / racing writes (F7, F8, F9, F10, F13, F14)', () => {
  it('weekly-concept switch is busy until its writes settle', () => {
    const s = read('src/screens/settings/SettingsScreen.tsx');
    assert.match(s, /if \(!prefs \|\| weeklyBusyRef\.current\) return;/);
    assert.match(s, /disabled=\{!prefs \|\| groupLocked \|\| weeklyBusy\}/);
    assert.match(s, /catSaveChain\.current = catSaveChain\.current\s*\n\s*\.then\(\(\) => saveCategorySchedule\(/);
  });

  it('Explore drops superseded searches', () => {
    const s = read('src/screens/directory/ExploreView.tsx');
    assert.match(s, /if \(id === reqId\.current\) setBusy\(false\);/);
    assert.match(s, /if \(id !== reqId\.current\) return; \/\/ superseded/);
  });

  it('profile saves are serialised and only the latest may roll back; unmount flushes', () => {
    const s = read('src/screens/directory/MyProfileView.tsx');
    assert.match(s, /const run = saveChain\.current\.then\(/);
    assert.match(s, /if \(seq !== saveSeq\.current\) return res\.ok;/);
    assert.match(s, /if \(hydrated\.current && pRef\.current !== lastSent\.current\)/);
    const e = read('src/screens/profile/EmployerSection.tsx');
    assert.match(e, /if \(mine !== seq\.current\[kind\]\) return;/);
  });

  it('PDF export disables every row while one is preparing', () => {
    assert.match(read('src/screens/profile/ProfileScreen.tsx'), /disabled=\{exportingId !== null\}/);
  });

  it('only the last-opened report thread may land', () => {
    assert.match(read('src/screens/admin/ReportsAdminScreen.tsx'), /if \(id === threadReq\.current\) setThread\(/);
  });
});

describe('Low-Light notice (F11)', () => {
  it('Android BACK declines (turns the mode off) rather than proceeding', () => {
    const s = read('src/features/settings/LowLightLayer.tsx');
    assert.match(s, /statusBarTranslucent onRequestClose=\{\(\) => setLowLight\(false\)\}/);
  });
});
