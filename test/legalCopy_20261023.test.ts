/**
 * Owner legal rulings 2026-10-23 (L4 assent, L12 not accredited, L15 Lifetime):
 * the approved words, and where they show — the paywall's buy and Lifetime
 * spots and footer, and access-code redemption in Settings.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { LEGAL_ASSENT_REDEEM, LEGAL_ASSENT_SUBSCRIBE, LEGAL_LIFETIME, LEGAL_NOT_ACCREDITED } from '../src/features/commercial/legalCopy.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('the approved wording, word for word', () => {
  assert.equal(LEGAL_ASSENT_SUBSCRIBE, 'By subscribing, you agree to the Terms of Service and acknowledge the Privacy Policy.');
  assert.equal(LEGAL_LIFETIME, 'One payment. Access for as long as we run the Academy app. It never renews.');
  assert.match(LEGAL_NOT_ACCREDITED, /^Pro Audio Training Academy is not a college or university and is not accredited\./);
  assert.match(LEGAL_ASSENT_REDEEM, /you agree to the Terms of Service and acknowledge the Privacy Policy\.$/);
});

test('the paywall shows assent by the buy button, the Lifetime line and the footer', () => {
  const pw = read('src/screens/commercial/PaywallScreen.tsx');
  assert.match(pw, /\{LEGAL_ASSENT_SUBSCRIBE\}<\/Text>\s*\{busy \? \(/);
  assert.match(pw, /p\.id === 'lifetime' \? <Text style=\{styles\.lifetimeNote\}>\{LEGAL_LIFETIME\}<\/Text>/);
  assert.match(pw, /\{LEGAL_NOT_ACCREDITED\}<\/Text>\s*<\/ScrollView>/);
});

test('access-code redemption shows the assent line', () => {
  assert.match(read('src/screens/settings/SettingsScreen.tsx'), /\{LEGAL_ASSENT_REDEEM\}<\/Text>/);
});
