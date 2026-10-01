/**
 * Account / membership "toddler + cat" pass 2 of 3 (2026-09-30, day).
 * Source-reading regressions for the fixes made in that pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const gate = read('src/features/commercial/MembershipGate.tsx');
const auth = read('src/screens/auth/AuthScreen.tsx');
const api = read('src/features/auth/api.ts');
const settings = read('src/screens/settings/SettingsScreen.tsx');
const profile = read('src/screens/profile/ProfileScreen.tsx');

test('GET MEMBERSHIP from a HOSTED gate waits for the host Modal to close', () => {
  const cta = gate.slice(gate.indexOf('closeMembershipGate();\n'), gate.indexOf('accessibilityLabel="Get Academy membership"'));
  // Pass 3 tied the request to the tapping host (see accountBugPass20260930dayPass3).
  // Night pass 1 (2026-10-01): the un-hosted card waits too — its own Modal is
  // the one closing (see accountNightPass120261001.test.ts).
  assert.match(cta, /setPaywallPending\(\{ host: hostId, at: Date\.now\(\) \}\);/);
  assert.doesNotMatch(cta, /navigationRef\.navigate\('Paywall'\)/);
  const effect = gate.slice(gate.indexOf('const pending = useSyncExternalStore'));
  assert.match(effect, /if \(otherModalOpen\) return;/);
  assert.match(effect, /setPaywallPending\(null\);\s*if \(navigationRef\.isReady\(\)\) navigationRef\.navigate\('Paywall'\);\s*\}, rootModalHoldMs\(\)\);/);
  assert.match(effect, /return \(\) => clearTimeout\(t\);\s*\}, \[focused, pending, otherModalOpen, hostId\]\);/);
});

test('deliberate sign-outs are LOCAL — Log out, Guest Mode, ensureSession, recovery cancel', () => {
  assert.match(settings, /\.signOut\(\{ scope: 'local' \}\)\s*\.catch\(\(e: unknown\) => \(\{ error: e as Error \}\)\)/);
  assert.doesNotMatch(settings, /\.signOut\(\)/);
  assert.doesNotMatch(auth, /\.signOut\(\)/);
  const ensure = api.slice(api.indexOf('export async function ensureSession'), api.indexOf('supabase.auth.signUp('));
  assert.match(ensure, /signOut\(\{ scope: 'local' \}\)/);
  assert.doesNotMatch(api, /\.signOut\(\)/);
});

test('Guest Mode refuses to go in while an ACCOUNT session survived a failed sign-out', () => {
  const guest = auth.slice(auth.indexOf('const enterGuest = async'), auth.indexOf('const finderRecord'));
  assert.match(guest, /if \(outError\) \{[\s\S]*?if \(isRealAccount\(still\.session\)\) \{\s*consumeIntentionalSignOut\(\);[\s\S]*?return;/);
});

test('cancelling recovery after a verified code signs that recovery session out', () => {
  const cancel = auth.slice(auth.indexOf('const cancelRecovery = () => {'), auth.indexOf('setMode(\'main\');\n    setError(null);'));
  assert.match(cancel, /if \(verifiedFor\.current !== null\) \{\s*markIntentionalSignOut\(\);\s*void supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
});

test('Settings NOTIFICATIONS never upsells a member whose tier is not known yet', () => {
  assert.match(settings, /if \(!tierKnown && !isMember\) return '…';\s*if \(!isMember\) return 'members';/);
  assert.match(settings, /\{!tierKnown && !isMember \? \(\s*\/\* Pre-resolve/);
  assert.doesNotMatch(settings, /if \(!resolved\) return '…';/);
});

test('certificate PDF export is guarded by a ref against a same-frame double tap', () => {
  assert.match(profile, /if \(exportingRef\.current\) return;\s*exportingRef\.current = true;/);
  assert.match(profile, /exportingRef\.current = false;\s*setExportingId\(null\);/);
});
