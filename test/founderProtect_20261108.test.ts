/**
 * Owner 2026-11-08: members cannot block or report the Academy founder's
 * account. The server refuses (Comp A package FOUNDER_PROTECT, code
 * "academy account" from contact_block / contact_report / contact_block_thread);
 * the directory shows that refusal in plain words, never as a server error.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ACADEMY_ACCOUNT_PROTECTED, readableError } from '../src/features/directory/rules.ts';

describe('the Academy account cannot be blocked or reported', () => {
  it('the server refusal reads plainly', () => {
    assert.equal(readableError('academy account'), ACADEMY_ACCOUNT_PROTECTED);
    assert.equal(readableError('ERROR: academy account'), ACADEMY_ACCOUNT_PROTECTED);
    assert.equal(ACADEMY_ACCOUNT_PROTECTED, 'The Academy account can’t be blocked or reported.');
  });
  it('other errors are untouched', () => {
    assert.notEqual(readableError('no such member'), ACADEMY_ACCOUNT_PROTECTED);
  });
});
