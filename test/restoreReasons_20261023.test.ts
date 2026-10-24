/**
 * Comp A #6 (validate-purchase v18, live 2026-10-23): a failed verification
 * carries a `reason`. Restore now says "expired" / "refunded" when every
 * failure says so, instead of "check your connection and try again".
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

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

test('the paywall states both new outcomes', () => {
  assert.match(paywall, /case 'expired':\s*\/\/[^\n]*\n\s*notify\('Your membership has ended'/);
  assert.match(paywall, /case 'refunded':\s*\/\/[^\n]*\n\s*notify\('Purchase was refunded'/);
});
