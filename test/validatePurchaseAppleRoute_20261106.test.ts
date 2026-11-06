/**
 * First real iPhone purchase, 2026-11-06: charged, then refused. expo-iap sends
 * no `platform`, and on iOS purchaseToken is Apple's JWS, so the receipt went to
 * Google ("Invalid Value"). The server now reads the token's shape.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const fn = read('supabase/functions/validate-purchase/index.ts');
const client = read('src/features/commercial/purchase.ts');

const piece = (name: string) => {
  const m = fn.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}\\n`));
  assert.ok(m, name);
  return stripTypeScriptTypes(m[0]);
};
const appleJwsPayload = new Function(`${piece('b64urlToBytes')}\n${piece('appleJwsPayload')}\nreturn appleJwsPayload;`)() as (
  t?: string | null,
) => { transactionId?: string } | null;

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jws = (header: unknown, payload: unknown) => `${b64(header)}.${b64(payload)}.c2lnbmF0dXJl`;

test('a StoreKit signed transaction is recognised and gives its id', () => {
  const t = jws({ alg: 'ES256', x5c: ['a', 'b', 'c'] }, { transactionId: '2000001', productId: 'academy_monthly' });
  assert.equal(appleJwsPayload(t)?.transactionId, '2000001');
});

test('Google tokens and junk are not Apple', () => {
  assert.equal(appleJwsPayload(null), null);
  assert.equal(appleJwsPayload(''), null);
  assert.equal(appleJwsPayload('abcdefghijklmnop.AO-J1OxyzExample'), null);
  assert.equal(appleJwsPayload('one.two.three'), null);
  assert.equal(appleJwsPayload(jws({ alg: 'RS256' }, { transactionId: '1' })), null);
  assert.equal(appleJwsPayload(jws({ alg: 'ES256' }, { transactionId: '1' })), null, 'no certificate chain');
});

test('the shape routes to Apple, and Apple is still asked', () => {
  assert.match(fn, /const isApple = plat\.includes\('ios'\) \|\| !!applePayload/);
  assert.match(fn, /await verifyApple\(appleTransactionId, sku, kind\)/);
  assert.match(fn, /\? appleTransactionId \|\| body\.purchaseToken \|\| sku/);
});

test('the app names its platform itself', () => {
  assert.ok(client.includes("platform: p.platform ?? (p.store === 'apple' ? 'ios' : p.store ?? null),"));
});
