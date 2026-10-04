/**
 * Overnight "toddler + cat" pass 2026-09-30 — Home & catalogue. Source-reading
 * guards for the fixes (the screens import React Native, so they cannot be
 * loaded under node:test).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');
const home = read('src/screens/courses/CourseSelectionScreen.tsx');
const explore = read('src/screens/courses/StudyAreaExplore.tsx');
const detail = read('src/screens/awards/CredentialDetailModal.tsx');
const inside = read('src/screens/curriculum/InsideStats.tsx');
const awards = read('src/screens/awards/AwardsScreen.tsx');

test('Home landing waits for the entitlement read (the deck is not mounted before it)', () => {
  const start = home.indexOf('const glossaryIdx = Math.max(0, deck.findIndex');
  const landed = home.indexOf('sessionLanded = true;');
  const gate = home.indexOf('if (!resolved) return;', start);
  assert.ok(start > 0 && gate > start && gate < landed, 'the resolved gate sits before sessionLanded is spent');
  assert.match(home, /\}, \[cards, defaultHomeGs, resolved\]\);/, 'and re-runs when it resolves');
});

test('leaving Home drops a pending Study Area EXPLORE', () => {
  assert.match(home, /load\(\);[\s\S]{0,400}return \(\) => setExploreArea\(null\);\s*\}, \[load\]\)/);
});

test('StudyAreaExplore never reuses a dead (or half-dead) catalog', () => {
  assert.match(explore, /return c\.certs\.length === 0 \|\| c\.programs\.length === 0;/);
  assert.match(explore, /if \(isDeadCatalog\(r\)\) catalogPromise = null;/);
  assert.match(explore, /setCatalog\(\(c\) => \(c && isDeadCatalog\(c\) \? null : c\)\);/, 'a failed read is forgotten on close');
});

test('credential art failure is remembered per credential, not for the whole modal', () => {
  assert.doesNotMatch(detail, /setArtFailed\(true\)/);
  assert.match(detail, /const artFailed = artFailedSlugs\.has\(c\.slug\);/);
});

test('the one-time count-up is not cancelled by its own first frame', () => {
  assert.match(inside, /const counted = useRef\(countedOnce\.has\(id\)\);/);
  assert.match(inside, /\}, \[id, target\]\);/);
  assert.doesNotMatch(inside, /const done = countedOnce\.has\(id\);/);
});

test('Awards: a slow stored-pick read neither rejects unhandled nor overwrites a newer tap', () => {
  assert.match(awards, /setSpecCert\(\(cur\) => cur \?\? v\)/);
  assert.match(awards, /setProgramPath\(\(cur\) => cur \?\? v\)/);
  const reads = awards.match(/AsyncStorage\.getItem\([A-Z_]+\)[\s\S]{0,160}?\.catch\(\(\) => \{\}\)/g) ?? [];
  assert.equal(reads.length, 2);
});
