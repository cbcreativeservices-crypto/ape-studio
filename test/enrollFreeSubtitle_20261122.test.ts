// Owner 2026-11-22: the two free enrollment topics (Pro Audio Safety, DAW Fundamentals &
// Session Management) say under their title that they are included and already loaded.
// Members never see "free" (no-marketing-to-members rule).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const s = readFileSync('src/screens/enrollment/EnrollmentScreen.tsx', 'utf8').replace(/\r\n/g, '\n');

describe('Enrollments: free topics say they are included', () => {
  it('the line, with and without "free"', () => {
    assert.match(s, /member \? 'Included · already loaded into your enrollments' : 'Included free · already loaded into your enrollments'/);
  });
  it('shown under the title of a FREE topic on the expanded card, member-aware', () => {
    assert.match(s, /\{free \? <Text style=\{\[styles\.freeIncluded, styles\.freeIncludedCard\]\}>\{freeIncludedLine\(paid\)\}<\/Text> : null\}/);
  });
  it('the two free topics open EXPANDED the first time; everything else still opens collapsed', () => {
    assert.match(s, /const toClose = fresh\.filter\(\(k\) => !isFreeEnrollGs\(Number\(k\.slice\(2\)\)\)\);/);
    assert.match(s, /enrollUi\.collapseSeeded = \[\.\.\.seen, \.\.\.fresh\];/);
  });
});
