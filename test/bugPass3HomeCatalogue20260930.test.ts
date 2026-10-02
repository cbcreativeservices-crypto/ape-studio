/**
 * Bug pass 3 of 3 (2026-09-30 day) — HOME & CATALOGUE area ("toddler + cat").
 * Source-reading regressions: RN screens do not load under node:test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(p, 'utf8');

test('Enrollments: EXPLORE MEMBERSHIP waits out the prompt Modal before the Paywall, once', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  // Pattern P5 (2026-10-02): the wait, the once-only and the drop-on-unmount
  // now live in the shared useModalHandoff (behaviour: test/patternP5_20261002).
  assert.match(s, /const payHandoff = useModalHandoff\(\);/);
  const at = s.indexOf('primaryLabel="EXPLORE MEMBERSHIP?"');
  assert.ok(at > 0);
  const block = s.slice(at, at + 900);
  assert.match(block, /setPayPrompt\(false\);\s*\n\s*payHandoff\(\(\) => navigation\.navigate\('Paywall'\)\);/);
  assert.doesNotMatch(block, /setPayPrompt\(false\);\s*\n\s*navigation\.navigate\('Paywall'\);/);
});

test('Home: RENEW on the expired-membership dialog waits out the dialog Modal, once', () => {
  const s = src('src/screens/courses/CourseSelectionScreen.tsx');
  // Pattern P5 (2026-10-02): through the shared useModalHandoff (waits
  // HOST_DISMISS_MS, once, dropped on unmount — test/patternP5_20261002).
  assert.match(s, /const renewHandoff = useModalHandoff\(\);/);
  const at = s.indexOf("'Membership Expired'");
  const block = s.slice(at, at + 700);
  assert.match(block, /\(\) => renewHandoff\(\(\) => \(navigation as any\)\.navigate\('Paywall'\)\),/);
  assert.doesNotMatch(block, /\(\) => \(navigation as any\)\.navigate\('Paywall'\),/);
});

test('Enrollments: CLEAR LIST also drops every certificate / program / subject', () => {
  const s = src('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(s, /resetEnrollment\(\);[\s\S]{0,500}getBundles\(\)\.forEach\(\(b\) => removeBundleEntry\(b\.key\)\);/);
});

test('Low-Light / reduced motion: the Home shimmer, the chooser BACK sweep and the glance hub hold still', () => {
  const home = src('src/screens/courses/CourseSelectionScreen.tsx');
  assert.match(home, /const off = reduceMotion \|\| suppressed;/);
  assert.match(home, /if \(!active \|\| off\) return null;/);
  assert.doesNotMatch(home, /if \(!active \|\| reduceMotion\)/);

  const awards = src('src/screens/awards/AwardsScreen.tsx');
  assert.match(awards, /if \(w <= 0 \|\| suppressed \|\| !animationsAllowed\(\)\) \{/);
  assert.match(awards, /\}, \[w, x, suppressed\]\);/);

  const glance = src('src/screens/curriculum/InsideStats.tsx');
  // Pattern hunt P10 (2026-10-02): the motion read is now the SUBSCRIBED hook,
  // so the toggle reaches a mounted hub; the Low-Light half is unchanged.
  assert.match(glance, /const allowed = useAnimationsAllowed\(\);[^\n]*\n\s*const anim = allowed && !suppressed;/);
  for (const [f, s] of [['CourseSelectionScreen', home], ['AwardsScreen', awards], ['InsideStats', glance]] as const) {
    assert.match(s, /import \{ useOverlaysSuppressed \} from '..\/..\/features\/dev\/popupSuppressStore';/, f);
  }
});
