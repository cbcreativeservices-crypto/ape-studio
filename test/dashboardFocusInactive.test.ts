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

test('a focused topic that is enrolled but inactive is switched on', () => {
  assert.match(
    src,
    /typeof focusGs === 'number' && inactiveGs\.current\.has\(focusGs\)\) setActiveMany\(\[focusGs\], true\)/,
    'STUDY NOW on a switched-off certificate topic would again land on the wrong topic',
  );
});

test('a missed numeric focus stays armed until the deck catches up', () => {
  // Only a slug that never resolves is cleared on a miss.
  assert.match(src, /if \(topicSlug\) navigation\.setParams\(\{ focusGs: undefined, topicSlug: undefined \}\);/);
});
