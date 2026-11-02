/**
 * Feedback email tags (Comp A handoff 2026-11-02): every in-app feedback email
 * carries `[APE-<CODE>]` + `(ref APE-XXXXXX)` in the subject and one
 * `APE-DATA v1 | ref=…` line, so Gmail filters and the inbox sweep can read it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FEEDBACK_CODE,
  REF_PATTERN,
  DATA_LINE_MAX,
  makeFeedbackRef,
  buildFeedbackSubject,
  buildDataLine,
  setFeedbackIdentity,
  getFeedbackIdentity,
  clearFeedbackIdentity,
} from '../src/lib/feedbackTags.ts';

const src = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

test('codes are the fixed filter tags', () => {
  assert.deepEqual(FEEDBACK_CODE, {
    bug: 'BUG', term: 'TERM', definition: 'DEF', suggestion: 'IDEA', correction: 'FIX', question: 'HELP',
  });
});

test('ref format: APE- + 6 from the no-lookalike alphabet, at both random extremes', () => {
  for (let i = 0; i < 500; i++) assert.match(makeFeedbackRef(), REF_PATTERN);
  assert.equal(makeFeedbackRef(() => 0), 'APE-AAAAAA');
  assert.equal(makeFeedbackRef(() => 0.9999999), 'APE-999999');
  assert.equal(makeFeedbackRef(() => 1), 'APE-999999'); // never out of range
});

test('subject: tag first, existing phrase kept, ref last', () => {
  assert.equal(buildFeedbackSubject('bug', 'Bug report', 'APE-7K3Q2M'), '[APE-BUG] Bug report (ref APE-7K3Q2M)');
  assert.equal(
    buildFeedbackSubject('correction', 'Suggest a correction', 'APE-7K3Q2M', 'Phase'),
    '[APE-FIX] Suggest a correction — Phase (ref APE-7K3Q2M)',
  );
});

test('data line: escaping, key cleanup, empty fields dropped, first key wins', () => {
  const line = buildDataLine([
    ['ref', 'APE-7K3Q2M'],
    ['kind', 'bug'],
    ['tier', undefined],
    ['sid', ''],
    ['role', null],
    ['Card Front', 'a|b\nc'],
    ['kind', 'shadow'],
    ['count', 3],
  ]);
  assert.equal(line, 'APE-DATA v1 | ref=APE-7K3Q2M | kind=bug | card_front=a/b/c | count=3');
  assert.ok(!line.includes('undefined') && !line.includes('null'));
});

test('data line is cut at the cap', () => {
  const line = buildDataLine([['ref', 'APE-AAAAAA'], ['blob', 'x'.repeat(5000)]]);
  assert.equal(line.length, DATA_LINE_MAX);
  assert.ok(line.startsWith('APE-DATA v1 | ref=APE-AAAAAA | blob='));
});

test('identity merges, clears a field on empty, and clears fully on sign-out', () => {
  clearFeedbackIdentity();
  setFeedbackIdentity({ tier: 'academy' });
  setFeedbackIdentity({ studentId: 'APE-123', role: 'employer' });
  assert.deepEqual(getFeedbackIdentity(), { tier: 'academy', studentId: 'APE-123', role: 'employer' });
  setFeedbackIdentity({ role: undefined });
  assert.deepEqual(getFeedbackIdentity(), { tier: 'academy', studentId: 'APE-123' });
  clearFeedbackIdentity();
  assert.deepEqual(getFeedbackIdentity(), {});
});

test('wiring: sendFeedback uses the builders; the data line is the LAST details line', () => {
  const f = src('src/lib/feedback.ts');
  assert.match(f, /buildFeedbackSubject\(kind, SUBJECT\[kind\], ref, tag\)/);
  assert.match(f, /detailLines\.push\(buildDataLine\(dataFields\)\);\n\s+const details =/);
  assert.match(f, /\['tier', identity\.tier \?\? reportedTier\(\)\]/); // signed out → no tier=
  assert.match(f, /SUPPORT_EMAIL = 'info@proaudiotrainingacademy\.com'/);
  assert.match(src('src/lib/feedback.ts'), /registerLocalStoreReset\(clearFeedbackIdentity\);/); // sign-out clears it
  assert.match(src('src/features/commercial/EntitlementProvider.tsx'), /setReportedTier\(persistAllowed\(tierOf\(entitlement, tierKnown\)\) \? entitlement : undefined\)/);
  assert.match(src('src/screens/settings/SettingsScreen.tsx'), /setFeedbackIdentity\(\{ studentId: id \|\| undefined \}\)/);
  assert.match(src('src/screens/profile/EmployerSection.tsx'), /setFeedbackIdentity\(\{ role:/);
});
