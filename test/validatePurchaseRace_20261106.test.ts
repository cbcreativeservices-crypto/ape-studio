/**
 * Found 2026-11-06 in the live logs, on the first real sale: Android checks a new
 * purchase twice at the same moment (the purchase listener, and the re-check on
 * returning from the Play sheet). Both read "no row", one inserted, and the other
 * hit UNIQUE (user_id, product) and answered grant_failed, for a purchase that
 * was verified and already saved. If that was the call the paywall was waiting
 * on, the buyer read "We couldn't verify that purchase".
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const src = readFileSync(new URL('../supabase/functions/validate-purchase/index.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const start = src.indexOf('const write = leaveRowAlone');
const writeBlock = src.slice(start, src.indexOf('if (write.error)', start));

test('the write block was actually found', () => {
  assert.ok(start > 0);
  assert.match(writeBlock, /upsert/);
});

test('a new row can never fail on the same purchase landing first', () => {
  assert.doesNotMatch(writeBlock, /\.insert\(/);
  assert.match(writeBlock, /onConflict: 'user_id,product'/);
});

test('the row that won the race is kept, and an unread prior row is still overwritten', () => {
  assert.match(writeBlock, /ignoreDuplicates: !priorUnknown/);
});

test('an existing row is still updated, and a longer gift is still left alone', () => {
  assert.match(writeBlock, /leaveRowAlone\s*\n?\s*\? \{ error: null \}/);
  assert.match(writeBlock, /\.update\(row\)\.eq\('id', prior!\.id\)/);
});

test('a failed write still refuses, so a paid grant is never reported as done', () => {
  assert.match(src, /if \(write\.error\)[\s\S]{0,160}grant_failed/);
});
