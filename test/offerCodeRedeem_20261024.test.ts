/**
 * Build 39 (owner 2026-10-24): "Redeem an offer code" opens the STORE's own
 * screen (Apple Offer Codes sheet / Google Play redeem page) — never our own
 * unlock — on the Paywall and in Settings › MEMBERSHIP, for signed-in people.
 * Plus: the "store isn't responding" line names the phone's own store (Android
 * said "The App Store").
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { storeNotResponding } from '../src/features/commercial/paywallCopy.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('the not-responding line names each phone’s own store', () => {
  assert.equal(storeNotResponding('ios'), 'The App Store isn’t responding right now. Please try again in a moment.');
  assert.equal(storeNotResponding('android'), 'Google Play isn’t responding right now. Please try again in a moment.');
  const paywall = read('src/screens/commercial/PaywallScreen.tsx');
  assert.doesNotMatch(paywall, /'The App Store isn’t responding/);
});

test('offer codes go through the store’s own redemption call, bounded', () => {
  const p = read('src/features/commercial/purchase.ts');
  assert.match(p, /export async function openStoreOfferCode\(\)/);
  assert.match(p, /withDeadline\(\(\) => iap\.openRedeemOfferCode!\(\), 'iap\/openRedeemOfferCode'/);
});

test('both surfaces offer it, latched, and the Paywall hides it from a known guest', () => {
  const paywall = read('src/screens/commercial/PaywallScreen.tsx');
  assert.match(paywall, /useLatchedPress\(onOfferCode\)/);
  assert.match(paywall, /\{!guestBuyer && \(\s*<Pressable onPress=\{busy \? undefined : onOfferCodePress\}/);
  const settings = read('src/screens/settings/SettingsScreen.tsx');
  assert.match(settings, /const onOfferCodePress = useLatchedPress\(/);
  assert.match(settings, /tierKnown && isGuest \? null : \(\s*<Pressable\s+style=\{styles\.row\}\s+onPress=\{onOfferCodePress\}/);
  assert.match(settings, /<Text style=\{styles\.rowLabel\}>Redeem an offer code<\/Text>/);
});
