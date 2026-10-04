/**
 * Account / membership / settings — NIGHT bug pass 1 of 3 (2026-10-01).
 * Source-reading regressions for the fixes made in that pass.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const api = read('src/features/auth/api.ts');
const commercialAuth = read('src/features/commercial/commercialAuth.ts');
const singleDevice = read('src/features/account/singleDevice.ts');
const purchase = read('src/features/commercial/purchase.ts');
const paywall = read('src/screens/commercial/PaywallScreen.tsx');
const gate = read('src/features/commercial/MembershipGate.tsx');
const provider = read('src/features/commercial/EntitlementProvider.tsx');
const store = read('src/features/settings/store.ts');
const wipe = read('src/features/account/clearLocalAccountData.ts');

const body = (src: string, start: string, end: string) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));

test('every auth WRITE is bounded and a stall reads as the offline error', () => {
  // Night pass 2: the calls that ESTABLISH a session go through boundedSignIn
  // (the same deadline, plus signing a late success back out).
  for (const call of ['supabase.auth.signUp(', 'supabase.auth.signInWithPassword(', 'supabase.auth.verifyOtp(']) {
    for (let i = api.indexOf(call); i !== -1; i = api.indexOf(call, i + 1)) {
      assert.match(api.slice(Math.max(0, i - 80), i), /boundedSignIn\(\s*\(\) =>\s*$/, `${call} at ${i} is not inside boundedSignIn`);
    }
  }
  assert.match(api, /return await withDeadline\(\(\) => call, label, AUTH_CALL_MS\);/);
  for (const call of ['supabase.auth.resetPasswordForEmail(', 'supabase.auth.updateUser(']) {
    for (let i = api.indexOf(call); i !== -1; i = api.indexOf(call, i + 1)) {
      const before = api.slice(Math.max(0, i - 80), i);
      assert.match(before, /withDeadline\(\s*\(\) =>\s*$/, `${call} at ${i} is not inside withDeadline`);
      const after = api.slice(i, i + 260);
      assert.match(after, /AUTH_CALL_MS,\s*\)\.catch\(orTimeoutError\)/, `${call} at ${i} does not map a timeout to an error`);
    }
  }
  // The registration RPC after signUp, too — its rejection reaches AuthScreen's catch.
  assert.match(commercialAuth, /withDeadline\(\s*async \(\) =>\s*await supabase\.rpc\('register_commercial_user'/);
});

test('the device claim that gates sign-in is bounded and fails open', () => {
  const fn = body(singleDevice, 'export async function claimThisDevice', 'export async function getActiveDeviceId');
  assert.match(fn, /withDeadline\(\s*async \(\) => await supabase\.rpc\('claim_device'/);
  assert.match(fn, /catch \(e\) \{[\s\S]*?return \{ ok: false, tookOver: false \};/);
});

test('restore and finishTransaction cannot hold the paywall spinner forever', () => {
  assert.match(purchase, /withDeadline\(\s*\(\) => iap\.getAvailablePurchases\(\),/);
  assert.equal((purchase.match(/withDeadline\(\s*\(\) => iap\.finishTransaction\(/g) ?? []).length, 2);
});

test('a restore that finishes after the paywall closed does not pop another screen', () => {
  assert.match(paywall, /const mounted = useRef\(true\);/);
  const restored = body(paywall, "case 'restored':", "case 'none':");
  assert.match(restored, /if \(mounted\.current\) safeGoBack\(navigation\);/);
});

test('GET MEMBERSHIP from the un-hosted card also waits for its own Modal to close', () => {
  const cta = body(gate, 'closeMembershipGate();\n', 'accessibilityLabel="Get Academy membership"');
  assert.match(cta, /setPaywallPending\(\{ host: hostId, at: Date\.now\(\) \}\);/);
  assert.doesNotMatch(cta, /navigationRef\.navigate\('Paywall'\)/);
});

test('a stalled getSession never asserts "guest" for a signed-in member', () => {
  // Boot: a stall decides nothing; INITIAL_SESSION carries the real answer.
  // (Safe-session sweep 2026-10-03: the elapsed-time test became `timedOut`,
  // which also covers a rejected read and an offline token refresh.)
  const boot = body(provider, "safeSessionResult(supabase.auth.getSession(), 'EntitlementProvider/boot')", '.finally(() => {');
  assert.match(boot, /if \(timedOut\) return;/);
  assert.ok(boot.indexOf('if (timedOut) return;') < boot.indexOf('clearLocalOnUserChange(identityOf(data.session));'));
  // refreshEntitlement: no session while the provider knows an account → read failed, tier kept.
  const refresh = body(provider, 'const refreshEntitlement = useCallback', 'const setCommercialMode');
  assert.match(refresh, /if \(!isRealAccount\(sess\.session\)\) \{[\s\S]*?if \(lastUid\.current !== null\) return false;\s*setEntitlementState\('anonymous'\);/);
});

test('a settings load overtaken by a save or a reset applies nothing stale', () => {
  const load = body(store, 'export async function loadLocalSettings', 'export async function saveLocalSettings');
  assert.match(load, /const gen = settingsGen;/);
  assert.match(load, /if \(gen !== settingsGen\) return lastWritten \?\? DEFAULT_LOCAL_SETTINGS;/);
  // The fence sits BEFORE the mirrors are written.
  assert.ok(load.indexOf('if (gen !== settingsGen)') < load.indexOf('setMuteOnLeave(merged.muteAudioOnLeave)'));
  const save = body(store, 'export async function saveLocalSettings', 'export function resetLocal');
  assert.match(save, /settingsGen \+= 1;\s*lastWritten = s;/);
  const reset = body(store, 'export function resetLocal', 'export type NotificationPrefs');
  assert.match(reset, /settingsGen \+= 1;\s*lastWritten = null;/);
});

test('the offline calculator meter survives sign-out like the glossary meter', () => {
  const keep = body(wipe, 'const KEEP', ']);');
  assert.match(keep, /'ape:calc:usageLocal',/);
  assert.match(keep, /'ape:glossaryUsageLocal',/);
});
