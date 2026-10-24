/**
 * Comp A #3 (live 2026-10-23, validate-purchase v18): every new purchase is
 * tagged with the buyer's auth id — Apple appAccountToken, Google
 * obfuscatedAccountId — so the server can refuse a purchase that belongs to a
 * DIFFERENT existing account. No readable session → no tag → the server's
 * unchanged path (never a blocked purchase).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const src = readFileSync(new URL('../src/features/commercial/purchase.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const buy = src.slice(src.indexOf('export async function buyPlan'), src.indexOf('export type RestoreResult'));

test('buyPlan tags the purchase with the auth id on both stores', () => {
  assert.match(buy, /safeSession\(supabase\.auth\.getSession\(\), 'iap\/buy-tag'\)/);
  assert.match(buy, /apple: \{ sku: plan\.sku, \.\.\.\(tag \? \{ appAccountToken: tag \} : \{\}\) \}/);
  assert.match(buy, /google: \{ skus: \[plan\.sku\], \.\.\.\(tag \? \{ obfuscatedAccountId: tag \} : \{\}\) \}/);
});

test('the tag is only ever a UUID (Apple refuses anything else) and is optional', () => {
  assert.match(buy, /\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$\/i\.test\(uid\) \? uid : undefined/);
});
