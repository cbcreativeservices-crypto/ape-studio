/**
 * Account / membership "toddler + cat" pass 1 of 3 (2026-09-30, day).
 * Source-reading regressions for the fixes made in that pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const provider = read('src/features/commercial/EntitlementProvider.tsx');
const guard = read('src/features/account/SingleDeviceGuard.tsx');
const auth = read('src/screens/auth/AuthScreen.tsx');
const deviceId = read('src/features/account/deviceIdentity.ts');
const settings = read('src/screens/settings/SettingsScreen.tsx');
const profile = read('src/screens/profile/ProfileScreen.tsx');

test('an identity change forgets the previous identity’s known tier', () => {
  const handler = provider.slice(provider.indexOf('supabase.auth.onAuthStateChange'));
  const reset = handler.indexOf('if (uidSeeded.current && identity !== lastUid.current) {');
  assert.ok(reset > 0);
  const block = handler.slice(reset, handler.indexOf('clearLocalOnUserChange(identity);'));
  assert.match(block, /setTierKnown\(false\)/);
  assert.match(block, /serverTierApplied\.current = false/);
  // account → account: the previous account's tier is not carried over.
  assert.match(block, /if \(lastUid\.current !== null && !devOverrode\.current\) setEntitlementState\('anonymous'\)/);
  // …and the reset happens BEFORE the new read starts.
  assert.ok(reset < handler.indexOf('void deriveWithRetry(isRealAccount(session));'));
});

test('the boot cache never overwrites a server answer or outlives a sign-out', () => {
  const boot = provider.slice(provider.indexOf("const bootIdentity = identityOf(data.session);"));
  const apply = boot.slice(0, boot.indexOf('setEntitlementState(remembered);'));
  assert.match(apply, /!serverTierApplied\.current/);
  assert.match(apply, /lastUid\.current === bootIdentity/);
  assert.match(boot, /if \(lastUid\.current !== bootIdentity\) return;\s*await deriveWithRetry/);
  // Both read paths mark the answer as the server's.
  assert.equal(provider.match(/serverTierApplied\.current = true;/g)?.length, 2);
});

test('single-device sign-outs are LOCAL — never the default global revoke', () => {
  // Pass 3: via signOutThisDevice (local scope + a forced local removal offline).
  assert.match(guard, /await signOutThisDevice\(\);/);
  assert.doesNotMatch(guard, /supabase\.auth\.signOut\(\)/);
  assert.match(read('src/features/auth/api.ts'), /supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
  const cancel = auth.slice(auth.indexOf('onCancel: () => {'), auth.indexOf('onCancel: () => {') + 500);
  assert.match(cancel, /supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
});

test('the install id is minted once even when first asked for twice at once', () => {
  assert.match(deviceId, /let pending: Promise<string> \| null = null;/);
  assert.match(deviceId, /pending \?\?= readOrCreate\(\)/);
});

test('Manage membership is offered only to a KNOWN member (the Paywall’s own gate)', () => {
  assert.match(settings, /\{tierKnown && isMember \? \(\s*<Pressable[\s\S]{0,200}navigate\('Paywall'\)/);
  assert.match(read('src/screens/commercial/PaywallScreen.tsx'), /if \(tierKnown && isMember\) \{/);
});

test('Profile asserts status and upsells only once the tier is KNOWN', () => {
  assert.match(profile, /const statusLabel = !tierKnown/);
  assert.match(profile, /\{tierKnown && !academy && \(/);
  assert.doesNotMatch(profile, /\{resolved && !academy && \(/);
});

test('notification prefs read names the caller’s row (admins can read every row)', () => {
  const store = read('src/features/settings/store.ts');
  const fetch = store.slice(store.indexOf('export async function fetchNotificationPrefs'), store.indexOf('export async function updateNotificationPref'));
  assert.match(fetch, /\.eq\('user_id', me\.id\)\s*\.maybeSingle\(\)/);
  assert.doesNotMatch(store, /matched no row for user', user\.id/);
});
