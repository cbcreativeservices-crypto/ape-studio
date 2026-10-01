/**
 * Night bug pass 2 of 3 (2026-10-01) — Home / Awards / Explore / Enrollments.
 * Source-reading regressions (RN screens do not load under node:test).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(p, 'utf8');

test('STUDY NOW focuses the first NON-core topic (never the lab proxy / a co-requisite)', () => {
  const awards = src('src/screens/awards/AwardsScreen.tsx');
  const body = awards.slice(awards.indexOf('const studyFromDetail'), awards.indexOf('const enrollmentsFromDetail'));
  assert.match(body, /const first = c\.topics\.find\(\(gs\) => !COREQ_TOPIC_GS\.includes\(gs\)\);/);
  assert.doesNotMatch(body, /c\.topics\[0\]/);

  const home = src('src/screens/courses/CourseSelectionScreen.tsx');
  assert.match(home, /import \{ COREQ_TOPIC_GS \} from '\.\.\/awards\/awardsData';/);
  const onStudy = home.slice(home.indexOf('onStudy={(c) => {'), home.indexOf('onEnrollments={() =>'));
  assert.match(onStudy, /const first = c\.topics\.find\(\(gs\) => !COREQ_TOPIC_GS\.includes\(gs\)\);/);
  assert.doesNotMatch(onStudy, /c\.topics\[0\]/);
});

test('Award progress: a failed focus reload keeps the loaded checklist; signing out still clears it', () => {
  const s = src('src/screens/awards/AwardProgressScreen.tsx');
  const body = s.slice(s.indexOf('const load = useCallback'), s.indexOf('const exportingRef'));
  assert.match(body, /if \(!signedOut && haveProgress\.current\) return;/);
  assert.match(body, /haveProgress\.current = false;/);
  assert.match(body, /haveProgress\.current = true;/);
});
