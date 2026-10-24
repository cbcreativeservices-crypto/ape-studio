/**
 * store-notifications (audit 2026-10-24, high): the endpoint is public and
 * treats every body as a rumour. The Apple branch must match entitlement rows
 * ONLY on ids Apple itself confirmed — never on the body's originalTransactionId.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const src = readFileSync(new URL('../supabase/functions/store-notifications/index.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const apple = src.slice(src.indexOf('async function handleApple'), src.indexOf('async function handleGoogle'));

test('Apple refs come only from the request transaction id (verified) and Apple\'s own answer', () => {
  assert.match(apple, /const refs = \[transactionId, truth\.originalTransactionId \?\? ''\];/);
  assert.doesNotMatch(apple, /tx\?\.originalTransactionId/, 'the body\'s original id is never read');
  assert.doesNotMatch(apple, /\|\| originalId/);
});

test('the exit-flow server half is in the repo (live v10 captured)', () => {
  assert.match(src, /async function setRenewal\(/);
  assert.match(src, /async function appleAutoRenew\(/);
});
