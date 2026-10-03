/**
 * STUDY area, toddler hunt 5 (2026-10-03).
 *
 * Each test below FAILED against the file before its fix (R2: the fixed file
 * was copied aside, the HEAD one written back, this file run, the fix put
 * back and checked with cmp).
 *
 *   1. enrollment/EnrollmentScreen.tsx — `paid = !entResolved || isMember`.
 *      The provider's `resolved` also flips on a FAILED membership read, so a
 *      signed-in member with no remembered tier saw every Enrollments row as
 *      locked, "· Free" marketing on the free topics, and the PrePaywallPrompt
 *      pay sheet on every LOAD / Home toggle / Home Setup write — sold the
 *      membership they hold. The tier sweep (1e9f0f9d) missed this screen.
 *      Now `paid` is "not a KNOWN non-member" (useMemberGate() !== 'locked');
 *      a known guest / free / remembered-free account is still 'locked'.
 *
 *   2. curriculum/TopicDetailModal.tsx — `needsMembership = resolved &&
 *      entitlement !== 'academy'`. Its own comment names the failed-read
 *      member as the case it holds for, but `resolved` is true there, so that
 *      member ticking a topic read "studying this topic needs Academy
 *      membership". Now only a KNOWN non-member (gate 'locked') is told so.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { memberGateOf, tierOf } from '../src/features/commercial/tier.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('the member gate: a failed read is not "locked", a known non-member still is', () => {
  // signed-in member, membership read failed, no remembered tier
  assert.notEqual(memberGateOf(tierOf('anonymous', true), false, true), 'locked');
  // ... and while it is still retrying
  assert.notEqual(memberGateOf(tierOf('anonymous', true), false, false), 'locked');
  // a KNOWN guest and a known / remembered free account keep the lock
  assert.equal(memberGateOf(tierOf('anonymous', true), true, false), 'locked');
  assert.equal(memberGateOf(tierOf('free', true), false, false), 'locked');
  assert.equal(memberGateOf(tierOf('academy', true), true, false), 'open');
});

test('EnrollmentScreen: `paid` is "not a known non-member", never `resolved`-based', () => {
  const s = code('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(s, /const paid = useMemberGate\(\) !== 'locked';/);
  assert.doesNotMatch(s, /!entResolved \|\| paidResolved/);
  // the Dashboard-bypass resume still uses the STRICT standing
  assert.match(s, /lastLoc\?\.kind === 'method' && paidResolved/);
  assert.match(s, /const \{ isMember: paidResolved \} = useEntitlement\(\);/);
});

test('TopicDetailModal: "needs Academy membership" only for a known non-member', () => {
  const s = code('src/screens/curriculum/TopicDetailModal.tsx');
  assert.match(s, /const needsMembership = useMemberGate\(\) === 'locked';/);
  assert.doesNotMatch(s, /resolved && entitlement !== 'academy'/);
});
