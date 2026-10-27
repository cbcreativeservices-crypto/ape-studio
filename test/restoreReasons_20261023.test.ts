/**
 * Comp A #6 (validate-purchase v18, live 2026-10-23): a failed verification
 * carries a `reason`. Restore now says "expired" / "refunded" when every
 * failure says so, instead of "check your connection and try again".
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { restoreEndedCopy } from '../src/features/commercial/paywallCopy.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const purchase = read('src/features/commercial/purchase.ts');
const paywall = read('src/screens/commercial/PaywallScreen.tsx');

test('validateWithServer keeps the server reason as detail', () => {
  assert.match(purchase, /result: \{ ok: false, reason: body\?\.error \?\? null, detail: body\?\.reason \?\? null \}/);
});

test('restore maps all-expired / all-refunded / all-pending failures', () => {
  assert.match(purchase, /details\.every\(\(d\) => d === 'expired'\)\) return 'expired';/);
  assert.match(purchase, /details\.every\(\(d\) => d === 'refunded'\)\) return 'refunded';/);
  assert.match(purchase, /details\.every\(\(d\) => d === 'pending'\)\) return 'pending';/);
  // linked keeps priority over the new reasons
  assert.ok(purchase.indexOf("return 'linked';") < purchase.indexOf("return 'expired';"));
});

test('the paywall states both new outcomes through restoreEndedCopy', () => {
  assert.match(paywall, /case 'expired':\s*case 'refunded': \{[\s\S]*?restoreEndedCopy\(result, Platform\.OS\);\s*notify\(c\.title, c\.body\);/);
});

// Owner OK 2026-10-26: the phone's own store by name, no "above" (the
// 'checking' Paywall face shows no plans), a refund points at the store.
test('restore wording, verbatim, on both phones', () => {
  assert.deepEqual(restoreEndedCopy('expired', 'ios'), {
    title: 'Your membership has ended',
    body: 'Your last Academy membership through the App Store has ended, so there’s nothing to restore. Choose a plan to join again.',
  });
  assert.deepEqual(restoreEndedCopy('refunded', 'ios'), {
    title: 'This purchase was refunded',
    body: 'The App Store refunded this Academy purchase, so it can’t restore access. Choose a plan to join again, or contact the App Store if you think this is a mistake.',
  });
  assert.deepEqual(restoreEndedCopy('expired', 'android'), {
    title: 'Your membership has ended',
    body: 'Your last Academy membership through Google Play has ended, so there’s nothing to restore. Choose a plan to join again.',
  });
  assert.deepEqual(restoreEndedCopy('refunded', 'android'), {
    title: 'This purchase was refunded',
    body: 'Google Play refunded this Academy purchase, so it can’t restore access. Choose a plan to join again, or contact Google Play if you think this is a mistake.',
  });
  for (const k of ['expired', 'refunded'] as const) {
    for (const os of ['ios', 'android', 'web']) assert.doesNotMatch(restoreEndedCopy(k, os).body, /above|The store says/);
  }
});
