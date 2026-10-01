/**
 * Night bug pass 3 of 3 (2026-10-01) — Home / Awards / Explore / Enrollments.
 * Source-reading regressions (RN screens do not load under node:test).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(p, 'utf8');

test('LabScopeSweep stops off screen and never freezes mid-card', () => {
  const s = src('src/screens/enrollment/LabScopeSweep.tsx');
  assert.match(s, /live = true,/);
  assert.match(s, /if \(w <= 0 \|\| !live \|\| suppressed \|\| !animationsAllowed\(\)\) return;/);
  assert.match(s, /\}, \[w, windowW, live, suppressed, x\]\);/);
  // Cleanup parks the trace where its opacity ramp is 0.
  assert.match(s, /x\.stopAnimation\(\);\s*\/\/[^\n]*\n(?:\s*\/\/[^\n]*\n)*\s*x\.setValue\(0\);/);

  const e = src('src/screens/enrollment/EnrollmentScreen.tsx');
  assert.match(e, /import \{ useIsFocused, useNavigation \} from '@react-navigation\/native';/);
  assert.match(e, /onScreen = true,/);
  assert.match(e, /const sweepLive = onScreen && isFocused;/);
  assert.match(e, /<LabScopeSweep color=\{colors\.blue\} live=\{sweepLive\} \/>/);

  const a = src('src/screens/awards/AwardsScreen.tsx');
  assert.match(a, /<EnrollmentView[\s\S]{0,120}onScreen=\{currentKey === 'enrollment'\}/);
});
