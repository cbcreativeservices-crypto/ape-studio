/**
 * Entitlement expiry parsing (owner ruling 2026-09-11): an `expires_at` that is
 * PRESENT but UNPARSEABLE must fail OPEN — the member keeps access — because
 * `NaN > now` is false and the old comparison-only guard silently reported
 * "expired" for anything it merely failed to read, dropping a paying member to
 * 'lapsed'. A REAL expiry must still expire normally, and a genuinely
 * absent/null expiry must keep its old meaning (no end date).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyExpiry,
  verdictKeepsAccess,
  type ExpiryVerdict,
} from '../src/features/commercial/entitlementExpiry.ts';

const NOW = Date.UTC(2026, 8, 11, 12, 0, 0); // 2026-09-11T12:00:00Z

/** Assert both the verdict and, with it, which way the door swings. */
function expect(raw: unknown, verdict: ExpiryVerdict, keepsAccess: boolean, label: string) {
  const got = classifyExpiry(raw, NOW);
  assert.equal(got, verdict, `${label}: verdict`);
  assert.equal(verdictKeepsAccess(got), keepsAccess, `${label}: keeps access`);
}

test('absent expiry keeps its existing meaning (no end date ⇒ access)', () => {
  expect(null, 'none', true, 'null');
  expect(undefined, 'none', true, 'undefined');
});

test('a valid FUTURE expiry is current ⇒ access', () => {
  expect('2027-01-01T00:00:00Z', 'current', true, 'ISO future');
  expect(new Date(NOW + 1000).toISOString(), 'current', true, 'one second out');
});

test('a valid PAST expiry still expires normally ⇒ NO access', () => {
  expect('2025-01-01T00:00:00Z', 'expired', false, 'ISO past');
  expect(new Date(NOW - 1000).toISOString(), 'expired', false, 'one second ago');
  expect(new Date(NOW).toISOString(), 'expired', false, 'exactly now is not still current');
});

test('empty string follows the pre-existing falsy/absent path ⇒ access', () => {
  expect('', 'none', true, 'empty string');
});

test('garbage string is UNREADABLE ⇒ fails OPEN, access kept', () => {
  expect('not a date', 'unreadable', true, 'prose');
  expect('null', 'unreadable', true, 'the literal word null');
  expect('  ', 'unreadable', true, 'whitespace');
});

test('a number is UNREADABLE ⇒ fails OPEN, access kept', () => {
  expect(1767225600000, 'unreadable', true, 'epoch ms');
  expect(0, 'unreadable', true, 'zero');
  expect(Number.NaN, 'unreadable', true, 'NaN');
});

test('a date-SHAPED but invalid string is UNREADABLE ⇒ fails OPEN, access kept', () => {
  expect('2026-13-45', 'unreadable', true, 'month 13 / day 45');
  expect('2026-02-30T99:99:99Z', 'unreadable', true, 'impossible clock');
});

test('NaN is never allowed to masquerade as an expiry via comparison', () => {
  // The defect in one line: the old guard asked `NaN > now`, which is false,
  // so an unreadable value looked exactly like a lapsed one.
  assert.equal(Number.isNaN(Date.parse('2026-13-45')), true);
  assert.equal(Date.parse('2026-13-45') > NOW, false);
  assert.equal(verdictKeepsAccess(classifyExpiry('2026-13-45', NOW)), true);
});
