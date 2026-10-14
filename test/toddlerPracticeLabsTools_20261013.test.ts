/**
 * Toddler bug hunt, area 6 (practice / FX / synth labs, EQ, specialty labs,
 * measurement tools, calculators) — 2026-10-13.
 *
 * 1. LabShell re-asked a PASSED understanding check on every cold start: it
 *    read `useLabDone(labId)`, but a LabShell labId ('compression',
 *    'cymatics', …) has no static unit list (registered only inside onPassed)
 *    and is never "sent", so it answered false after every relaunch. It now
 *    reads the banked UNDERSTANDING unit, as LabUnderstandingBlock does.
 * 2. NO SOUND card → TRY AGAIN re-adopted the same digitally-silent stream
 *    (it is alive, so micSession adopts it) and the card came back 4 s later.
 *    The card now arms a one-shot forceRestart for the next start().
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('LabShell: a passed check reads the banked unit, never useLabDone (cold start re-ask)', () => {
  const src = read('src/screens/lab/LabShell.tsx');
  assert.match(src, /const alreadyPassed = useLabClearedUnits\(labId\)\.has\(UNDERSTANDING_UNIT\)/);
  assert.doesNotMatch(src, /useLabDone\(labId\)/);
});

test('the banked unit is readable without registration (what LabShell now relies on)', () => {
  const src = read('src/features/lab/labCompletion.ts');
  // useLabClearedUnits reads `cleared[labKey]` directly — no unitsFor() gate.
  assert.match(src, /export function useLabClearedUnits[\s\S]{0,200}cleared\[labKey\]/);
});

test('NO SOUND → TRY AGAIN forces a fresh capture instead of re-adopting the silent stream', () => {
  const src = read('src/features/tools/engine/useDspEngine.ts');
  assert.match(src, /const forceFresh = freshStartRef\.current \|\| retryFreshRef\.current;\s*retryFreshRef\.current = false;\s*const acquiring = acquireMic\(configRef\.current, forceFresh\)/);
  // Captured at start() entry, BEFORE setState('starting') clears the card.
  assert.match(src, /retryFreshRef\.current = noSignalRef\.current;\s*const gen = \+\+genRef\.current;[\s\S]{0,300}setState\('starting'\)/);
  // The mirror is the card's own condition (EngineGate: running && noSignal).
  assert.match(src, /noSignalRef\.current = state === 'running' && noSignal;/);
});
