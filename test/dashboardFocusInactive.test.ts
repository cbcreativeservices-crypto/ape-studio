/**
 * GUARD — STUDY NOW must land on the certificate's topic, even when that topic
 * was enrolled switched OFF.
 *
 * TESTER REPORTS (TestFlight): build 30, 2026-09-25 — "I enrolled in microphone
 * course and it locked on the flash card screen for electrical connections a
 * different course"; build 32, 2026-09-27 — "App sent me to wrong study page
 * from drumset micing course … data wheel is froze".
 *
 * Certificates enrol their topics INACTIVE; the Dashboard deck carries only
 * active topics, so a `focusGs` for an inactive topic was never found and the
 * learner sat on a shared core topic. The Dashboard now switches it on.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = readFileSync(join(process.cwd(), 'src', 'screens', 'dashboard', 'DashboardScreen.tsx'), 'utf8');

test('a focused topic that is inactive OR not enrolled at all is brought onto the deck', () => {
  // 2026-09-30: the inactive-only switch missed a topic the bundle outlived
  // (studyFocusEnroll.test.ts). ensureStudyTopic covers both.
  assert.match(
    src,
    /if \(typeof focusGs === 'number'\) void ensureStudyTopic\(focusGs\);/,
    'STUDY NOW on a switched-off or un-enrolled credential topic would again land on the wrong topic',
  );
});

test('a missed numeric focus stays armed until the deck catches up', () => {
  // Only a slug that never resolves is cleared on a miss.
  assert.match(src, /if \(topicSlug\) navigation\.setParams\(\{ focusGs: undefined, topicSlug: undefined \}\);/);
});

// ── Dashboard deep-clean (2026-09-27) ────────────────────────────────────────
test('the last topic is saved by id and the carousel follows the topic across re-sorts', () => {
  assert.match(src, /setLastTopic\(data\.currentCourse\.id, topics\[next\]\.id\)/);
  assert.match(src, /const j = want \? topics\.findIndex\(\(t\) => t\.id === want\) : -1;/);
  assert.doesNotMatch(src, /setLastTopicIndex/);
});

test('only the newest load may land, and the cache is written after the stale check', () => {
  assert.match(src, /const ticket = \+\+loadTicketRef\.current;/);
  const staleAt = src.indexOf('if (stale()) return;\n      setDashboardCache(d, idx);');
  assert.ok(staleAt > 0, 'setDashboardCache must come AFTER the stale/unmounted check (sign-out cache leak)');
});

test('a self-opening celebration waits until the Dashboard is in front and nothing else is open', () => {
  assert.match(src, /isFocused && !termsOpen && !trophyOpen && !deckOpen && !upgradeOpen && !jogActive && pendingCelebration/);
});

test('STUDY NOW for a topic removed from the deck restores it', () => {
  assert.match(src, /if \(want && deckPrefs\.removed\.includes\(want\)\) restoreToDeck\(want\);/);
});

test('an all-removed deck shows its topics instead of the sign-out dead end', () => {
  assert.match(src, /if \(ordered\.length === 0 && members\.length > 0\)/);
});

test('Android back and blur close the big wheel / upgrade sheet', () => {
  assert.match(src, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.match(src, /navigation\.addListener\('blur', closeJog\)/);
  assert.match(src, /onClose=\{closeJog\}/);
});
