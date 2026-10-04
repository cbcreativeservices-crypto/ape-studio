/**
 * HUNT 10 — Area 9 (community + careers + awards), 2026-10-03.
 * Each block is a receipt that FAILS on d5ade47c.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { readableError } from '../src/features/directory/rules.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('H10-1 searchDirectory: its own 10 s deadline is the offline case', () => {
  const src = read('src/features/directory/api.ts');
  const start = src.indexOf('export async function searchDirectory(');
  const end = src.indexOf('/* ── A member', start);
  const fn = src.slice(start, end);

  it('the search is wrapped in withDeadline, which REJECTS on a stall', () => {
    assert.match(fn, /withDeadline\(/);
  });

  it('the catch routes a "timeout after" rejection through readableError', () => {
    const catchAt = fn.lastIndexOf('} catch');
    assert.ok(catchAt > 0, 'searchDirectory has a catch arm');
    const arm = fn.slice(catchAt);
    // The catch must look at the error, not swallow it as "on our side".
    assert.match(arm, /^\} catch \(\w+\)/);
    assert.match(arm, /timeout after/);
    assert.match(arm, /readableError\(/);
  });

  it('readableError names the withDeadline message "No connection"', () => {
    assert.equal(readableError('directory_search timeout after 10000ms'), 'No connection. Try again.');
  });
});
