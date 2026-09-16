/**
 * Telemetry scrubbers — the privacy contract, pinned.
 *
 * Everything that leaves the app for Sentry / Aptabase passes through
 * src/features/telemetry/scrub.ts. These tests are the guard on the promise
 * Computer A files on the Apple App-Privacy / Google Data-Safety forms
 * (docs/TELEMETRY_DATA_INVENTORY_2026_09_16.md): no free text, no emails, no
 * query strings, no IP, no console output. If one of these starts failing,
 * the form is now wrong — fix the code, not the test.
 *
 * scrub.ts is import-free by design so this file needs no module stubs.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  MAX_PROPS,
  MAX_STRING,
  isSafeString,
  sanitizeProps,
  scrubBreadcrumb,
  scrubEvent,
  scrubUrl,
} from '../src/features/telemetry/scrub.ts';

test('sanitizeProps keeps enum-shaped values only', () => {
  const out = sanitizeProps({
    screen: 'Glossary',
    outcome: 'full_pass',
    practice: true,
    gs: 3060,
    award: 'certificate',
  });
  assert.deepEqual(out, { screen: 'Glossary', outcome: 'full_pass', practice: true, gs: 3060, award: 'certificate' });
});

test('sanitizeProps refuses anything that could be text or an identifier', () => {
  const out = sanitizeProps({
    email: 'someone@example.com',
    note: 'my name is Pat, call me',
    url: 'https://x.y/z?uid=1',
    path: 'a/b',
    quoted: "it's",
    nan: Number.NaN,
    inf: Number.POSITIVE_INFINITY,
    obj: { nested: 1 },
    arr: [1, 2],
    nil: null,
    undef: undefined,
    'Bad-Key': 'ok',
    ok: 'kept',
  });
  assert.deepEqual(out, { ok: 'kept' });
});

test('sanitizeProps returns undefined when nothing survives', () => {
  assert.equal(sanitizeProps(undefined), undefined);
  assert.equal(sanitizeProps({}), undefined);
  assert.equal(sanitizeProps({ email: 'a@b.c' }), undefined);
});

test('sanitizeProps caps the prop count and string length', () => {
  const many: Record<string, number> = {};
  for (let i = 0; i < MAX_PROPS + 5; i++) many[`k${i}`] = i;
  assert.equal(Object.keys(sanitizeProps(many) ?? {}).length, MAX_PROPS);
  assert.equal(isSafeString('x'.repeat(MAX_STRING)), true);
  assert.equal(isSafeString('x'.repeat(MAX_STRING + 1)), false);
  assert.equal(isSafeString(''), false);
});

test('scrubUrl strips the query string and fragment', () => {
  assert.equal(scrubUrl('https://h.supabase.co/rest/v1/users?id=eq.123&select=*'), 'https://h.supabase.co/rest/v1/users');
  assert.equal(scrubUrl('https://h/x#frag'), 'https://h/x');
  assert.equal(scrubUrl('https://h/plain'), 'https://h/plain');
});

test('scrubBreadcrumb drops console lines and de-queries http URLs', () => {
  assert.equal(scrubBreadcrumb({ category: 'console', message: 'user typed pat@example.com' }), null);
  const http = scrubBreadcrumb({
    category: 'fetch',
    data: { url: 'https://h/rest/v1/t?email=eq.pat%40example.com', method: 'GET', status_code: 200 },
  });
  assert.deepEqual(http, { category: 'fetch', data: { url: 'https://h/rest/v1/t', method: 'GET', status_code: 200 } });
  const nav = { category: 'navigation', message: 'Glossary' };
  assert.deepEqual(scrubBreadcrumb(nav), nav);
});

test('scrubEvent removes the user object entirely (signed-in) and the request context', () => {
  const out = scrubEvent({
    user: { id: 'uuid-1', email: 'pat@example.com', username: 'pat', ip_address: '1.2.3.4' },
    request: { url: 'https://h/?token=abc', headers: { cookie: 'x' } },
    breadcrumbs: [
      { category: 'console', message: 'secret' },
      { category: 'xhr', data: { url: 'https://h/a?b=1' } },
    ],
    message: 'boom',
  });
  assert.equal('user' in out, false);
  assert.equal('request' in out, false);
  assert.deepEqual(out.breadcrumbs, [{ category: 'xhr', data: { url: 'https://h/a' } }]);
  assert.equal(out.message, 'boom');
});

test('scrubEvent removes the user object entirely (guest / no id)', () => {
  const out = scrubEvent({ user: { email: 'pat@example.com', ip_address: '1.2.3.4' } });
  assert.equal('user' in out, false);
  assert.equal(out.user, undefined);
});

// Sentry is FULLY ANONYMOUS (owner ruling 2026-09-16, "Option B"): the
// telemetry module must never bind an identity. A behavioural test cannot see
// this without stubbing the whole SDK, so pin the source: no setUser call and
// no auth import may exist in telemetry.ts. If this fails, the privacy form
// Computer A filed ("not linked to you") is now wrong.
test('telemetry.ts never calls Sentry.setUser and never reads the auth session', () => {
  const src = readFileSync(new URL('../src/features/telemetry/telemetry.ts', import.meta.url), 'utf8');
  assert.equal(/setUser/.test(src), false, 'Sentry.setUser must not appear');
  assert.equal(/lib\/supabase/.test(src), false, 'must not import the Supabase client');
  assert.equal(/onAuthStateChange|getSession/.test(src), false, 'must not observe auth state');
});
