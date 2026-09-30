/**
 * Home header in SHORT windows (owner 2026-09-29: "shrink the header"): split
 * screen / small desktop windows drop the logo, eyebrow and "Start Learning";
 * a phone running full screen never does.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardDimsFor, isCompactHeader } from '../src/screens/courses/cardDims.ts';

test('no full-screen phone gets the compact header', () => {
  for (const [w, h, sw, sh] of [
    [375, 667, 375, 667],
    [375, 619, 375, 667],
    [390, 844, 390, 844],
    [360, 760, 360, 800],
    [430, 932, 430, 932],
  ]) assert.equal(isCompactHeader(w, h, sw, sh), false, `${w}x${h} on ${sw}x${sh}`);
});

test('a short window is compact and its card fits (card + compact chrome ≤ window)', () => {
  for (const [w, h, sw, sh] of [
    [390, 560, 390, 844],
    [400, 600, 1366, 768],
    [412, 480, 412, 915],
  ]) {
    assert.equal(isCompactHeader(w, h, sw, sh), true, `${w}x${h}`);
    const d = cardDimsFor(w, h, sw, sh);
    assert.ok(d.h + (394 - 120) <= h || d.h === 200, `${w}x${h}: card ${d.h}`);
  }
});
