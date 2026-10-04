/**
 * HUNT 9 — Area 9 (community + careers + awards), 2026-10-03.
 * Each block is a receipt that FAILS on 3131eae3.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readableError } from '../src/features/directory/rules.ts';

const SERVER_FAULT = /on our side/;

describe('H9-1 readableError: the bounded client deadline is the offline case', () => {
  it('a postgrest AbortError timeout says "No connection", not "on our side"', () => {
    const out = readableError(
      'AbortError: supabase /rest/v1/rpc/contact_request_send timeout after 30000ms',
    );
    assert.equal(out, 'No connection. Try again.');
    assert.doesNotMatch(out, SERVER_FAULT);
  });

  it('a timed-out profile read is the offline case too', () => {
    assert.equal(
      readableError('AbortError: supabase /rest/v1/community_profiles timeout after 30000ms'),
      'No connection. Try again.',
    );
  });
});

describe('H9-2 readableError: a member deleted under an open sheet', () => {
  it('"no such member" (block/report) is named, never a server fault to retry', () => {
    const out = readableError('no such member');
    assert.doesNotMatch(out, SERVER_FAULT);
    assert.match(out, /no longer available/);
  });

  it('existing mappings are unchanged', () => {
    assert.equal(readableError('no account'), 'Sign in to use the Audio Community Directory.');
    assert.equal(readableError('that is your own profile'), 'That is your own profile.');
    assert.equal(readableError('Network request failed'), 'No connection. Try again.');
  });
});
