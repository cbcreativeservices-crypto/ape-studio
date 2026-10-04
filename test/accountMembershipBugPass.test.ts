/**
 * Account / membership "toddler + cat" pass (2026-09-30). Source-reading
 * regressions for the fixes made in that pass — see each test's name.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const provider = read('src/features/commercial/EntitlementProvider.tsx');
const localSync = read('src/features/account/accountLocalSync.ts');
const purchase = read('src/features/commercial/purchase.ts');
const paywall = read('src/screens/commercial/PaywallScreen.tsx');
const auth = read('src/screens/auth/AuthScreen.tsx');
const settings = read('src/screens/settings/SettingsScreen.tsx');

test('a password-recovery sign-in re-reads the tier (verifyOtp emits PASSWORD_RECOVERY, not SIGNED_IN)', () => {
  assert.match(provider, /if \(event === 'PASSWORD_RECOVERY'\) event = 'SIGNED_IN';/);
  // …and it is mapped BEFORE the event filter reads it.
  assert.ok(
    provider.indexOf("event === 'PASSWORD_RECOVERY'") <
      provider.indexOf("if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION')"),
  );
});

test('a password-recovery sign-in runs the account-switch wipe', () => {
  assert.match(localSync, /event === 'PASSWORD_RECOVERY'/);
});

test('account-switch syncs run one at a time', () => {
  // (guestEphemeral 2026-10-04: a confirmed-guest launch runs the guest wipe
  // in the sync's place, on the same queue.)
  assert.match(localSync, /chain = chain\.then\(\(\) => \(guestLaunch \? wipeGuestLaunch\(\) : syncLocalToIdentity\(identity\)\)\)\.catch\(\(\) => \{\}\)/);
  assert.doesNotMatch(localSync, /void syncLocalToIdentity\(/);
});

test('a successful refreshEntitlement marks the tier known and caches it', () => {
  const body = provider.slice(provider.indexOf('const refreshEntitlement = useCallback'));
  const end = body.indexOf('const setCommercialMode');
  const refresh = body.slice(0, end);
  assert.match(refresh, /setTierKnown\(true\)/);
  assert.match(refresh, /saveLastTier\(uidAtStart, tier\)/);
});

test('a pending store purchase is reported as pending, never validated or finished', () => {
  const listener = purchase.slice(purchase.indexOf('iap.purchaseUpdatedListener'));
  const pending = listener.indexOf("purchase?.purchaseState === 'pending'");
  assert.ok(pending > 0);
  assert.ok(pending < listener.indexOf('await validateWithServer(purchase)'));
  assert.match(listener, /handlers\?\.onError\(PENDING_MESSAGE\);\s*return;/);
});

test('paywall: CONTINUE and Restore are guarded by a synchronous in-flight ref', () => {
  assert.match(paywall, /const inFlight = useRef\(false\)/);
  const cont = paywall.slice(paywall.indexOf('const onContinue'), paywall.indexOf('const onRestore'));
  assert.ok(cont.indexOf('if (inFlight.current) return;') < cont.indexOf('buyPlan('));
  const restore = paywall.slice(paywall.indexOf('const onRestore'), paywall.indexOf('const onManage'));
  assert.ok(restore.indexOf('if (inFlight.current) return;') < restore.indexOf('restorePurchases()'));
});

test('paywall: a cancelled or already-reported buyPlan rejection shows no second dialog', () => {
  const cont = paywall.slice(paywall.indexOf('const onContinue'), paywall.indexOf('const onRestore'));
  assert.match(cont, /if \(!wasInFlight \|\| isCancel\(err\?\.code\) \|\| isCancel\(err\?\.message\)\) return;/);
});

test('auth: every account action goes through the in-flight guard', () => {
  for (const fn of ['enterGuest', 'onCreateAccount', 'onLogin', 'onResetPassword', 'onSubmitNewPassword']) {
    const at = auth.indexOf(`const ${fn} = async`);
    assert.ok(at > 0, fn);
    const head = auth.slice(at, at + 900);
    assert.match(head, /if \(!begin\(\)\) return;/, fn);
  }
  // The only remaining `setBusy(true)` is the one inside begin().
  assert.equal(auth.match(/setBusy\(true\)/g)?.length, 1);
});

test('settings: redeem is guarded by a ref, not by the state it sets', () => {
  assert.match(settings, /if \(!code \|\| redeemBusyRef\.current\) return;/);
});

test('settings: Log out checks signOut’s result before leaving the screen', () => {
  const at = settings.indexOf('markIntentionalSignOut();');
  const block = settings.slice(at, at + 2600);
  assert.ok(block.indexOf('if (error)') > 0);
  assert.ok(block.indexOf('if (error)') < block.indexOf("navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })"));
});
