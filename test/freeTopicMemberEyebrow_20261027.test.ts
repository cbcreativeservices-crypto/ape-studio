/**
 * Home: the two always-on topic cards tell MEMBERS why they are there (owner
 * 2026-10-27: "otherwise they are oddly there if a user was always a member").
 * Non-members keep FREE TOPIC; members never see "free" wording (2026-09-29).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const home = readFileSync(new URL('../src/screens/courses/CourseSelectionScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('members see the reason, non-members keep FREE TOPIC', () => {
  assert.match(home, /\? upsell\s*\? 'FREE TOPIC'/);
  assert.match(home, /free\.gs === 3060\s*\? 'REQUIRED FOR EVERY CERTIFICATE'/);
  assert.match(home, /free\.gs === 3970\s*\? 'WHERE MOST LEARNERS START'/);
});
