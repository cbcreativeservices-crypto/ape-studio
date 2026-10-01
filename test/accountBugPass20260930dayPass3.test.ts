/**
 * Account / membership "toddler + cat" pass 3 of 3 (2026-09-30, day).
 * Source-reading regressions for the fixes made in that pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const gate = read('src/features/commercial/MembershipGate.tsx');
const api = read('src/features/auth/api.ts');
const del = read('src/features/settings/DeleteAccountButton.tsx');
const guard = read('src/features/account/SingleDeviceGuard.tsx');
const provider = read('src/features/commercial/EntitlementProvider.tsx');
const access = read('src/features/commercial/accessCode.ts');
const purchase = read('src/features/commercial/purchase.ts');
const paywall = read('src/screens/commercial/PaywallScreen.tsx');
const auth = read('src/screens/auth/AuthScreen.tsx');
const settings = read('src/screens/settings/SettingsScreen.tsx');
const profile = read('src/screens/profile/ProfileScreen.tsx');

test('a hosted GET MEMBERSHIP is tied to the tapping host, short-lived, and fires once', () => {
  // A newer gate supersedes a waiting request (its NOT NOW is the answer).
  const open = gate.slice(gate.indexOf('export function openMembershipGate'), gate.indexOf('export function closeMembershipGate'));
  assert.match(open, /paywallPending = null;/);
  const effect = gate.slice(gate.indexOf('const pending = useSyncExternalStore'), gate.indexOf('const card ='));
  // Only the host that took the tap acts on it; leaving that screen drops it.
  assert.match(effect, /if \(!pending \|\| pending\.host !== hostId\) return;/);
  assert.match(effect, /if \(!focused\) return setPaywallPending\(null\);/);
  // Never a Paywall out of nowhere, long after the tap.
  assert.match(effect, /Date\.now\(\) - pending\.at > PAYWALL_PENDING_TTL_MS\) return setPaywallPending\(null\);/);
  // The timer re-checks it is still THE request — two hosts cannot both navigate.
  assert.match(effect, /if \(paywallPending !== pending\) return;/);
  // Unmounting the host that owns it drops it.
  assert.match(effect, /if \(paywallPending\?\.host === hostId\) setPaywallPending\(null\);/);
});

test('delete + displacement sign THIS device out even offline', () => {
  const fn = api.slice(api.indexOf('export async function signOutThisDevice'), api.indexOf('export async function signIn('));
  assert.match(fn, /signOut\(\{ scope: 'local' \}\)\)\.error \?\? null/);
  assert.match(fn, /_removeSession\?\.\(\)/);
  assert.match(del, /await signOutThisDevice\(\);\s*\/\/ Backend is gone/);
  assert.doesNotMatch(del, /supabase\.auth\.signOut\(/);
  assert.match(guard, /await signOutThisDevice\(\);\s*await clearLocalAccountData\(\);/);
});

test('the entitlement read is bounded on both paths', () => {
  assert.match(provider, /function readAcademyRows\(\)[\s\S]*?withDeadline\(/);
  assert.equal(provider.match(/await readAcademyRows\(\);/g)?.length, 2);
  assert.equal(provider.match(/\.from\('entitlements'\)/g)?.length, 1); // only inside the bounded reader
});

test('redeem and purchase verification are bounded; a stalled redeem does not claim the code is unused', () => {
  assert.match(access, /withDeadline\(\s*async \(\) => await supabase\.rpc\('redeem_access_code'/);
  assert.match(access, /\/redeem_access_code timeout\/\.test\(message\) \? 'error' : 'unavailable'/);
  assert.match(purchase, /withDeadline\(\s*\(\) =>\s*supabase\.functions\.invoke\('validate-purchase'/);
});

test('a restore linked to another account says so, not "check your connection"', () => {
  assert.match(purchase, /if \(validationFailed && linkedOnly\) return 'linked';/);
  assert.match(paywall, /case 'linked':\s*\/\/[^\n]*\n\s*notify\('Restore didn’t finish', LINKED_MESSAGE\);/);
});

test('the sign-in form stays busy while a takeover cancel / recovery cancel sign-out is in flight', () => {
  const cancel = auth.slice(auth.indexOf('onCancel: () => {'), auth.indexOf('onCancel: () => {') + 1400);
  assert.match(cancel, /signOutThisDevice\(\)\.finally\(end\);[\s\S]*?hold\(\);/);
  assert.match(auth, /hold\(\);\s*\/\/[^\n]*\n[^\n]*\n\s*void claimThisDevice\(\)\.then\(proceed, proceed\)\.finally\(end\);/);
  const rec = auth.slice(auth.indexOf('const cancelRecovery = () => {'), auth.indexOf("setMode('main');\n    setError(null);"));
  assert.match(rec, /\.finally\(end\);[\s\S]*?hold\(\);/);
});

test('guest entry writes the Career Finder record back BEFORE resetting the stores', () => {
  const guest = auth.slice(auth.indexOf('const enterGuest = async'), auth.indexOf('resetAmplitudeOrientation();'));
  assert.ok(guest.indexOf("AsyncStorage.setItem('ape:careerfinder:v1', finderRecord)") < guest.indexOf('resetAllLocalStores();'));
});

test('notification switch optimism is an updater, not a stale spread', () => {
  assert.match(settings, /setPrefs\(\(p\) => \(p \? \{ \.\.\.p, \[key\]: value \} : p\)\);/);
  assert.doesNotMatch(settings, /setPrefs\(\{ \.\.\.prefs, \[key\]: value \}\)/);
});

test('the full-screen ID is a DimModal host; BRIGHTEN lifts its wash', () => {
  assert.match(profile, /import \{ Modal \} from '\.\.\/\.\.\/components\/DimModal';/);
  assert.match(profile, /lowLightDim=\{!brightId\}/);
  assert.doesNotMatch(profile, /<LowLightDim \/>/);
});
