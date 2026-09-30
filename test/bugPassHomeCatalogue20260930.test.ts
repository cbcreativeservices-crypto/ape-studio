/**
 * Bug pass 1 of 3 (2026-09-30 day) — HOME & CATALOGUE area ("toddler + cat").
 * Source-reading regressions: RN screens do not load under node:test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(p, 'utf8');

test('Topic popup: a FREE topic is never said to need membership', () => {
  const s = src('src/screens/curriculum/TopicDetailModal.tsx');
  assert.match(s, /import \{ isFreeEnrollGs \} from '..\/..\/features\/enrollment\/enrollmentStore'/);
  assert.match(s, /needsMembership && !isFreeEnrollGs\(topic\.gs\)/);
});

test('Credential popup: a double tap on ENROLL does not enrol-then-unenrol', () => {
  const s = src('src/screens/awards/CredentialDetailModal.tsx');
  assert.match(s, /const ENROLL_REPEAT_MS = \d+;/);
  assert.match(s, /if \(now - lastEnrollAt\.current < ENROLL_REPEAT_MS\) return;/);
  // The guard sits in front of the one onEnroll call.
  const i = s.indexOf('lastEnrollAt.current = now;');
  const j = s.indexOf('onEnroll(credential);');
  assert.ok(i > 0 && j > i, 'onEnroll must run after the repeat guard');
});

test('Home Setup: a prompt left from the last visit is cleared on open', () => {
  const s = src('src/screens/enrollment/HomeSetupSheet.tsx');
  const open = s.slice(s.indexOf('if (!visible) return;\n    tapCount.current = 0;'));
  assert.ok(open.length > 0, 'the open effect resets the tap count');
  assert.match(open.slice(0, 600), /setPayOpen\(false\);\s*\n\s*setWarn\(false\);/);
});

test('Enrollments: un-enrolled requirement rows are not dead controls', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(s, /const toggleDeck = \(\) => \(isEnrolled \? toggleActive\(e\.gs\) : void addTopics\(\[e\.gs\]\)\);/);
  assert.equal((s.match(/unlessLifted\(toggleDeck\)/g) ?? []).length, 2, 'both LOAD pills use toggleDeck');
  assert.doesNotMatch(s, /unlessLifted\(\(\) => toggleActive\(e\.gs\)\)/);
  assert.match(s, /\{!coreLocked && isEnrolled \? \(\s*\n\s*<HoldToRemove/);
});

test('Enrollments: ADD ALL / REMOVE ALL ignore a double tap', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(s, /const BULK_REPEAT_MS = \d+;/);
  assert.equal((s.match(/onPress=\{\(\) => bulkOnce\(\(\) => \(added \?/g) ?? []).length, 4);
  assert.doesNotMatch(s, /onPress=\{\(\) => \(added \? remove/);
});

test('Enrollments: the paid-month rule is gated on the real server flag', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(s, /import \{ CERTIFICATE_REQUIRES_EXAM \} from '..\/..\/features\/finalExam\/tenure'/);
  const at = s.indexOf('one complete paid month of membership');
  assert.ok(at > 0);
  assert.match(s.slice(at - 200, at), /CERTIFICATE_REQUIRES_EXAM\s*\n?\s*\?/);
});

test('Enrollments: STUDY ALL on a credential loads its topics before opening study', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(
    s,
    /if \(centredBundle\) setBundleLoad\(centredBundle, true\);\s*\n\s*goStudy\(centredBundle\?\.topics\.find/,
  );
});
