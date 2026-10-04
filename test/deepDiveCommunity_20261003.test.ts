/**
 * DEEP DIVE B — community profile, networking and connections, members and
 * employers (2026-10-03). Each block is a receipt that FAILS on cf0b9c7e.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { readableError } from '../src/features/directory/rules.ts';

const src = (p: string) =>
  readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('B1 readableError: specific server refusals are not swallowed by the generic ones', () => {
  it('a profile held for review is not told to ADD a display name', () => {
    const out = readableError(
      'your public display name or About text needs review before it can be published',
    );
    assert.notEqual(out, 'Add a public display name before publishing.');
    assert.match(out, /needs review/);
  });

  it('the discoverable refusal reaches its own sentence', () => {
    assert.equal(
      readableError('review your public display name before appearing in search'),
      'Review your public display name before appearing in search.',
    );
  });

  it('a blocked word in the name/About is named, not "add a display name"', () => {
    const out = readableError(
      'Your display name or About text contains language that is not allowed. Please revise it.',
    );
    assert.notEqual(out, 'Add a public display name before publishing.');
    assert.match(out, /not allowed/);
  });

  it('a request for a reason the member does not offer says so', () => {
    assert.equal(
      readableError('that is not something this member is open to'),
      'This member is not open to that. Pick another reason.',
    );
  });

  it('the unchanged generic cases still map', () => {
    assert.equal(readableError('a public display name is required'), 'Add a public display name before publishing.');
    assert.equal(
      readableError('choose at least one Open To selection first'),
      'Choose at least one “Open To” option first.',
    );
  });

  it('a guest with the anonymous session is told to sign in, not that the server broke', () => {
    assert.equal(
      readableError('sign in to browse the directory'),
      'Sign in to use the Audio Community Directory.',
    );
    assert.equal(readableError('no account'), 'Sign in to use the Audio Community Directory.');
  });

  it('a second request while one is pending is not "something went wrong, try again"', () => {
    const out = readableError(
      'duplicate key value violates unique constraint "contact_requests_one_pending"',
    );
    assert.doesNotMatch(out, /Something went wrong/);
    assert.match(out, /already sent this member a request/);
  });
});

describe('B2 MyProfileView: a failed credentials read is not "no credentials"', () => {
  const s = src('src/screens/directory/MyProfileView.tsx');
  it('does not turn the rejection into an empty list', () => {
    assert.doesNotMatch(s, /fetchMyCredentials\(\)\.catch\(\(\) => \[\]\)/);
  });
  it('remembers the failure and draws it in the section and the preview', () => {
    assert.match(s, /setCredsFailed\(c\.failed\)/);
    assert.match(s, /credsFailed \? \(\s*<Section title="FEATURED CREDENTIALS"/);
    assert.match(s, /credsFailed=\{credsFailed\}/);
  });
});

describe('B4 ProfileScreen: one Professional Registry listing write at a time', () => {
  const s = src('src/screens/profile/ProfileScreen.tsx');
  it('a toggle while a write is out is refused', () => {
    assert.match(s, /const registryLatch = useInFlightLatch\(\);/);
    assert.match(s, /\(v: boolean\) => \{\s*if \(registryLatch\.busy\(\)\) return;/);
  });
  it('the write and its rollback run inside the latch', () => {
    assert.match(
      s,
      /void registryLatch\.run\(async \(\) => \{\s*setPubKey\('showInRegistry', v\);\s*const ok = await setRegistryVisible\(/,
    );
  });
});

describe('B3 EmployerSection: "reopen this screen" re-asks after a failed read', () => {
  const s = src('src/screens/profile/EmployerSection.tsx');
  it('re-loads on focus when the last load failed', () => {
    assert.match(s, /useFocusEffect\(/);
    assert.match(s, /if \(failedRef\.current\) void load\(\)/);
  });
  it('a failed verified-check or application read marks the load failed', () => {
    assert.match(s, /failedRef\.current = isVerified === null \|\| state\.state === 'error'/);
    assert.match(s, /if \(!t \|\| !mine\) failedRef\.current = true/);
  });
  it('newest load wins', () => {
    assert.match(s, /if \(ticket !== loadTicket\.current\) return;/);
  });
});
