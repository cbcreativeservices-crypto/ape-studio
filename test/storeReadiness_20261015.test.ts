/**
 * App Store readiness, 2026-10-15.
 *
 *  1. Paywall prices are the STORE's localized strings once loaded (Apple
 *     3.1.2); USD copy is only the fallback, and no USD figure sits beside a
 *     non-USD store price.
 *  2. The delete-account confirm says a store subscription is NOT cancelled by
 *     deleting, and where to cancel it.
 *  3. CREATE ACCOUNT carries a Terms of Use / Privacy Policy agreement line
 *     with real, accessible links (Apple 1.2).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localizePlans as localize, type PlanCopy } from '../src/features/commercial/storePrices.ts';
import { PLANS as IAP_PLANS } from '../src/features/commercial/iapProducts.ts';

const localizePlans = (f: PlanCopy[], products: unknown[]) => localize(f, products, IAP_PLANS);

const FALLBACK: PlanCopy[] = [
  { id: 'lifetime', name: 'Lifetime Access', price: '$99.99', sub: 'One-time payment', badge: 'BEST VALUE' },
  { id: 'annual', name: 'Annual', price: '$59.99 / yr', sub: 'About $5/mo', badge: 'SAVE 50%' },
  { id: 'monthly', name: 'Monthly', price: '$9.99 / mo', sub: 'Cancel anytime' },
];

const eur = [
  { id: 'academy_monthly', displayPrice: '10,99 €', price: 10.99, currency: 'EUR' },
  { id: 'academy_annual', displayPrice: '64,99 €', price: 64.99, currency: 'EUR' },
  { id: 'academy_lifetime', displayPrice: '109,99 €', price: 109.99, currency: 'EUR' },
];

test('a failed or empty store fetch keeps the fallback copy exactly', () => {
  assert.deepEqual(localizePlans(FALLBACK, []), FALLBACK);
  assert.deepEqual(localizePlans(FALLBACK, [null, {}, { id: 'academy_annual' }]), FALLBACK);
});

test('store prices replace the USD copy, with the period, and no $ figure survives', () => {
  const out = localizePlans(FALLBACK, eur);
  const by = Object.fromEntries(out.map((p) => [p.id, p]));
  assert.equal(by.lifetime.price, '109,99 €');
  assert.equal(by.annual.price, '64,99 € / yr');
  assert.equal(by.monthly.price, '10,99 € / mo');
  // 64.99 / (10.99 × 12) → 51% saved, derived from the store's own numbers.
  assert.equal(by.annual.badge, 'SAVE 51%');
  assert.equal(by.annual.sub, 'Billed yearly');
  for (const p of out) assert.ok(!`${p.price} ${p.sub} ${p.badge ?? ''}`.includes('$'), JSON.stringify(p));
});

test('the saving badge is dropped when it cannot be derived from the store', () => {
  const noNumbers = eur.map(({ id, displayPrice }) => ({ id, displayPrice }));
  const annual = localizePlans(FALLBACK, noNumbers).find((p) => p.id === 'annual')!;
  assert.equal(annual.badge, undefined);
  assert.equal(annual.sub, 'Billed yearly');
  const onlyAnnual = localizePlans(FALLBACK, [eur[1]]);
  assert.equal(onlyAnnual.find((p) => p.id === 'annual')!.badge, undefined);
  // A plan the store did not return keeps its fallback text.
  assert.equal(onlyAnnual.find((p) => p.id === 'monthly')!.price, '$9.99 / mo');
});

test('the paywall renders the localized plans and keeps the renewal disclosure above CONTINUE', () => {
  const src = readFileSync('src/screens/commercial/PaywallScreen.tsx', 'utf8');
  assert.match(src, /setPlans\(localizePlans\(PLANS, products, IAP_PLANS\)\)/);
  assert.match(src, /\{plans\.map\(\(p\) =>/);
  assert.ok(!/\{PLANS\.map\(/.test(src));
  assert.ok(src.indexOf('Subscriptions renew automatically') < src.indexOf('label="CONTINUE"'));
});

test('the delete-account confirm says the store subscription is not cancelled', () => {
  const src = readFileSync('src/features/settings/DeleteAccountButton.tsx', 'utf8');
  assert.match(src, /does not cancel a subscription bought through the App Store — cancel it first/);
  assert.match(src, /does not cancel a subscription bought through Google Play — cancel it first/);
  const confirm = src.slice(src.indexOf('const askFinalConfirm'), src.indexOf('const runDelete'));
  assert.match(confirm, /STORE_BILLING_NOTE/);
});

test('create account carries the Terms / Privacy agreement with accessible links', () => {
  const src = readFileSync('src/screens/auth/AuthScreen.tsx', 'utf8');
  assert.match(src, /By creating an account you agree to the /);
  assert.match(src, /proaudiotrainingacademy\.com\/\$\{path\}/);
  assert.match(src, /accessibilityRole="link"\s*accessibilityLabel="Terms of Use"/);
  assert.match(src, /accessibilityRole="link"\s*accessibilityLabel="Privacy Policy"/);
  // Main (create/login) branch only — after the recovery branch's ternary.
  assert.ok(src.indexOf('By creating an account') > src.indexOf('<StudioButton label="Cancel"'));
  const size = /termsText: \{[^}]*fontSize: ([\d.]+)/.exec(src);
  assert.ok(size && Number(size[1]) >= 9);
});
