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
  assert.match(s, /import \{ HOST_DISMISS_MS, Modal \} from '..\/..\/components\/DimModal';/);
  const at = s.indexOf('primaryLabel="EXPLORE MEMBERSHIP?"');
  assert.ok(at > 0);
  const block = s.slice(at, at + 900);
  assert.match(block, /if \(payHandoff\.current\) return;/);
  assert.match(block, /payHandoff\.current = setTimeout\(\(\) => \{\s*\n\s*payHandoff\.current = null;\s*\n\s*navigation\.navigate\('Paywall'\);\s*\n\s*\}, HOST_DISMISS_MS\);/);
  assert.doesNotMatch(block, /setPayPrompt\(false\);\s*\n\s*navigation\.navigate\('Paywall'\);/);
  // …and the pending hand-off is dropped if the screen unmounts.
  assert.match(s, /if \(payHandoff\.current\) clearTimeout\(payHandoff\.current\);/);
});

test('Home: RENEW on the expired-membership dialog waits out the dialog Modal, once', () => {
  const s = src('src/screens/courses/CourseSelectionScreen.tsx');
  assert.match(s, /import \{ HOST_DISMISS_MS \} from '..\/..\/components\/DimModal';/);
  const at = s.indexOf("'Membership Expired'");
  const block = s.slice(at, at + 700);
  assert.match(block, /if \(renewHandoff\.current\) return;/);
  assert.match(block, /\}, HOST_DISMISS_MS\);/);
  assert.doesNotMatch(block, /\(\) => \(navigation as any\)\.navigate\('Paywall'\),/);
  assert.match(s, /if \(renewHandoff\.current\) clearTimeout\(renewHandoff\.current\);/);
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
  assert.match(glance, /const anim = animationsAllowed\(\) && !suppressed;/);
  for (const [f, s] of [['CourseSelectionScreen', home], ['AwardsScreen', awards], ['InsideStats', glance]] as const) {
    assert.match(s, /import \{ useOverlaysSuppressed \} from '..\/..\/features\/dev\/popupSuppressStore';/, f);
  }
});
