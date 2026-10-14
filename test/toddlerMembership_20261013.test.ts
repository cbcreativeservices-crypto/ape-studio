/**
 * Toddler pass — Area 2: membership, purchases, restore, entitlement gates
 * (2026-10-13). One block per fix.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

const purchase = code('src/features/commercial/purchase.ts');
const paywall = code('src/screens/commercial/PaywallScreen.tsx');

describe('Ask to Buy / already-owned are told in words, not raw store errors', () => {
  test('storeErrorMessage maps cancel → silent, deferred/pending → PENDING_MESSAGE, already-owned → Restore', () => {
    const fn = purchase.slice(purchase.indexOf('export function storeErrorMessage'));
    assert.match(fn, /isCancel\(err\?\.code\) \|\| isCancel\(err\?\.message\)\) return null/);
    assert.match(fn, /isDeferred\(err\?\.code\)\) return PENDING_MESSAGE/);
    assert.match(fn, /isAlreadyOwned\(err\?\.code\)\) return ALREADY_OWNED_MESSAGE/);
    assert.match(purchase, /c\.includes\('deferred'\) \|\| c === 'pending'/);
    assert.match(read('src/features/commercial/purchase.ts'), /Tap Restore purchases to apply it to your account/);
  });

  test('the error listener and the Paywall rejection path share it', () => {
    assert.match(purchase, /purchaseErrorListener\(\(err\) => \{\s*handlers\?\.onError\(storeErrorMessage\(err\)\);/);
    const cont = paywall.slice(paywall.indexOf('buyPlan(selected'), paywall.indexOf('const onRestore'));
    assert.match(cont, /const message = storeErrorMessage\(err\);\s*if \(message\) notify\('Purchase', message\);/);
    assert.doesNotMatch(cont, /err\?\.message \?\? 'The purchase could not be started\.'/);
  });
});

describe('Restore: a still-pending purchase is "pending", not "store unreachable"', () => {
  const restore = purchase.slice(purchase.indexOf('export async function restorePurchases'));
  test('pending purchases are skipped before validation and reported', () => {
    const skip = restore.indexOf("p.purchaseState === 'pending'");
    assert.ok(skip > 0 && skip < restore.indexOf('await validateWithServer(p)'));
    assert.match(restore, /if \(pendingSeen && !validationFailed\) return 'pending';/);
    assert.match(purchase, /\| 'linked' \| 'pending';/);
  });
  test('the Paywall states it with the pending copy', () => {
    assert.match(paywall, /case 'pending':\s*notify\('Purchase', PENDING_MESSAGE\);/);
  });
});

describe('validate-purchase: one retry on a 401 when the device IS signed in (cold-start race)', () => {
  const fn = purchase.slice(
    purchase.indexOf('async function validateWithServer'),
    purchase.indexOf('async function validateRequest'),
  );
  test('retries once, only on 401, only for a real account', () => {
    assert.match(fn, /first\.status !== 401\) return first\.result/);
    assert.match(fn, /if \(!isRealAccount\(data\.session\)\) return first\.result/);
    assert.equal((fn.match(/validateRequest\(p\)/g) ?? []).length, 2);
  });
  test('the HTTP status is carried out of the invoke error', () => {
    assert.match(purchase, /return \{ status: invokeStatus\(error\), result: \{ ok: false, reason: null \} \}/);
  });
});

describe('a member is never left looking at an open upsell', () => {
  test('MembershipGateHost closes the card on the change to open', () => {
    const gate = code('src/features/commercial/MembershipGate.tsx');
    assert.match(gate, /if \(was !== 'open' && memberGate === 'open'\) closeMembershipGate\(\);/);
  });
  test('StudyAccessSheet closes itself on the change to open', () => {
    const sheet = code('src/features/commercial/StudyAccessSheet.tsx');
    assert.match(sheet, /if \(visible && was !== 'open' && memberGate === 'open'\) closeRef\.current\(\);/);
  });
});
