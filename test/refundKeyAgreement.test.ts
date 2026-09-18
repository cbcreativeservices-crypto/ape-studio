/**
 * The id a purchase is STORED under must be the id its refund ARRIVES under.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * Two edge functions have to agree on one string, and nothing else checks that
 * they do:
 *
 *   validate-purchase    WRITES entitlements.store_ref
 *   store-notifications  MATCHES a refund with .in('store_ref', [...])
 *
 * They are separate Deno functions, deployed separately, with no shared type
 * and no runtime that ever exercises both. The only thing binding them is that
 * both authors picked the same identifier — and for Google, they did not.
 *
 * Apple refund notifications carry TRANSACTION IDS. Google's
 * purchases/voidedpurchases feed and SUBSCRIPTION_REVOKED carry the PURCHASE
 * TOKEN. The old write used `transactionId || purchaseToken` for BOTH
 * platforms, and react-native-iap populates both fields on Android — where
 * `transactionId` is the Google ORDER ID. So the order id won and every Android
 * row was keyed on an id that appears in no refund feed.
 *
 * The failure was invisible in every direction: `.in('store_ref', [token])`
 * matched zero rows, `markRefunded` returned 0 rather than throwing, the
 * function still returned 200 so Google never retried, and the refunded member
 * kept paid access AND kept accruing tenure toward a certificate they had been
 * refunded for. No log line, no error, no alert. It could only ever have been
 * found by reading both files at once.
 *
 * ⛔ AND IT HAS A TEMPTING WRONG FIX. Matching on the order id in
 *    store-notifications would also make refunds "work", and would reopen a
 *    hole closed on 2026-09-17: that endpoint is public, the order id is
 *    attacker-controlled, and store_ref is not a namespace —
 *    `redeem_access_code` writes THE CODE ITSELF there, so one forged
 *    notification naming a known code would mark every user who ever redeemed
 *    it as refunded and clear their tenure. The last describe block guards that
 *    door specifically.
 *
 * Source-scanned because these are Deno functions outside the app bundle, and
 * the invariant is an agreement BETWEEN two files rather than behaviour within
 * either one.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const VALIDATE = readFileSync(
  new URL('../supabase/functions/validate-purchase/index.ts', import.meta.url),
  'utf8',
);
const NOTIFY = readFileSync(
  new URL('../supabase/functions/store-notifications/index.ts', import.meta.url),
  'utf8',
);

/** The store_ref assignment, without its comment block. */
function storeRefExpression(): string {
  const i = VALIDATE.indexOf('const store_ref =');
  assert.ok(i >= 0, 'could not find the store_ref assignment');
  return VALIDATE.slice(i, VALIDATE.indexOf(';', i));
}

describe('both files were actually read', () => {
  it('found the code it is asserting about', () => {
    // Without this, a renamed file or a broken slice makes everything below
    // pass vacuously — which is worse than the bug, because it looks green.
    assert.ok(VALIDATE.length > 2000, 'validate-purchase looks empty');
    assert.ok(NOTIFY.length > 2000, 'store-notifications looks empty');
    assert.ok(NOTIFY.includes('markRefunded'), 'sanity: markRefunded should exist');
    assert.ok(storeRefExpression().length > 10, 'store_ref expression looks empty');
  });
});

describe('validate-purchase keys each row on the id that store will refund it by', () => {
  const expr = storeRefExpression();

  it('branches on platform at all', () => {
    assert.match(
      expr,
      /isApple/,
      'store_ref must depend on the platform — Apple refunds name transaction ids, ' +
        'Google refunds name purchase tokens, and one expression cannot serve both',
    );
  });

  it('Google rows are keyed on the PURCHASE TOKEN, not the order id', () => {
    // The Google arm is everything after the `:` of the ternary.
    const googleArm = expr.slice(expr.indexOf(':') + 1);
    const token = googleArm.indexOf('purchaseToken');
    const txn = googleArm.indexOf('transactionId');
    assert.ok(token >= 0, 'the Google arm must reference purchaseToken');
    assert.ok(
      txn < 0 || token < txn,
      'purchaseToken must be preferred over transactionId for Google. On Android ' +
        'transactionId is the ORDER ID, which appears in no refund feed — every ' +
        'Android refund would silently match zero rows, forever.',
    );
  });

  it('Apple rows are keyed on the TRANSACTION ID', () => {
    const appleArm = expr.slice(expr.indexOf('?') + 1, expr.indexOf(':'));
    const txn = appleArm.indexOf('transactionId');
    const token = appleArm.indexOf('purchaseToken');
    assert.ok(txn >= 0, 'the Apple arm must reference transactionId');
    assert.ok(token < 0 || txn < token, 'transactionId must be preferred over purchaseToken for Apple');
  });
});

describe('store-notifications matches Google refunds on the purchase token', () => {
  it('every Google markRefunded call passes a purchaseToken', () => {
    const calls = [...NOTIFY.matchAll(/markRefunded\(\s*admin,\s*\[([^\]]*)\]/g)].map((m) => m[1]);
    assert.ok(calls.length >= 2, `expected the Google refund calls, found ${calls.length}`);
    const google = calls.filter((args) => args.includes('purchaseToken'));
    assert.ok(
      google.length >= 2,
      'both Google branches (voided purchase and SUBSCRIPTION_REVOKED) must match on purchaseToken',
    );
  });
});

describe('the order id is NOT a match key — this door stays shut', () => {
  it('no markRefunded call matches on an order id', () => {
    // Closed 2026-09-17. The endpoint is public, the order id is
    // attacker-controlled, and store_ref also holds ACCESS CODES — so matching
    // on it lets one forged notification refund every redeemer of a known code.
    const calls = [...NOTIFY.matchAll(/markRefunded\(\s*admin,\s*\[([^\]]*)\]/g)].map((m) => m[1]);
    for (const args of calls) {
      assert.ok(
        !/orderId/i.test(args),
        `markRefunded must never be handed an order id — found: [${args}]. ` +
          'If Google refunds appear broken, fix the WRITE key in validate-purchase, ' +
          'not the match key here.',
      );
    }
  });

  it('refund writes stay scoped to store purchases', () => {
    // The other half of the same defence: a comp or an access code is the
    // owner's gift and no store notification may revoke it.
    assert.match(
      NOTIFY,
      /\.in\('source',\s*\['app_store',\s*'play_store'\]\)/,
      'markRefunded/markReinstated must stay scoped to app_store/play_store rows',
    );
  });
});
