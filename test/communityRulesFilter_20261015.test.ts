/**
 * Community-rules filter (Apple Guideline 1.2, 2026-10-15).
 *
 * The server (Comp A brief 2026-10-15_COMP_A_CHAT_CONTENT_FILTER_BRIEF.md)
 * will raise `message = 'community_rules', detail = <category>` from
 * contact_message_send, contact_request_send and community_profile_save.
 * Every one of those call sites shows `readableError(error.message)` inline,
 * so the mapping lives in one place. Until the server filter is applied
 * nothing raises the code, so every existing message must read as before.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COMMUNITY_RULES_MESSAGE, readableError } from '../src/features/directory/rules.ts';

test('the community_rules code reads as the rephrase message', () => {
  assert.equal(readableError('community_rules'), COMMUNITY_RULES_MESSAGE);
  assert.equal(readableError('COMMUNITY_RULES'), COMMUNITY_RULES_MESSAGE);
  assert.match(COMMUNITY_RULES_MESSAGE, /community rules/);
  assert.match(COMMUNITY_RULES_MESSAGE, /rephrase/i);
});

test('the category (error.detail) is never what is shown', () => {
  assert.ok(!/slur|sexual|threat|harass/i.test(COMMUNITY_RULES_MESSAGE));
});

test('existing server messages are unchanged (no filter on the server yet)', () => {
  assert.equal(
    readableError('Your display name or About text contains language that is not allowed. Please revise it.'),
    'Your display name or About text contains language that is not allowed. Please revise it.',
  );
  assert.equal(readableError('message is longer than 1000 characters'),
    'That message is longer than 1,000 characters. Shorten it and send again.');
  assert.equal(readableError('sign in first'), 'Your session has ended. Sign in again to continue.');
  assert.match(readableError('some unknown failure'), /^Something went wrong on our side/);
  assert.match(readableError(''), /^Something went wrong on our side/);
});

test('every member-text send path routes its error through readableError', () => {
  const api = readFileSync(new URL('../src/features/directory/api.ts', import.meta.url), 'utf8');
  for (const rpc of ['contact_message_send', 'contact_request_send', 'community_profile_save']) {
    const at = api.indexOf(`rpc('${rpc}'`);
    assert.ok(at > 0, `${rpc} call not found`);
    const body = api.slice(at, at + 900);
    assert.match(body, /readableError\(error\.message\)/, `${rpc} must map its error`);
  }
});
