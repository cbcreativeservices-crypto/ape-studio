/**
 * Mastering Lab — timing guards (night bug pass 1, 2026-10-01).
 *
 *  • STOP during a render cancels the queued play (the dock's ■ is stopAll).
 *  • The settle-then-replay timer is cancelled by STOP, by a ▶ press, by a
 *    mute/leave/close (stopAll), and stays quiet if every sound was stopped
 *    while it waited (the sound-stop epoch).
 *  • ▶ on the version already sounding re-zeroes the playhead.
 *  • FIRST ANSWER WINS: a re-pick after the PRACTICE step remounted never
 *    overwrites the recorded answer (state and store).
 *  • The step clamp uses the static per-module counts, not last module's
 *    reported titles.
 *  • Module 8 tells the host OUTSIDE its state updaters.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) =>
  readFileSync(join(process.cwd(), p), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
const DIR = 'src/screens/lab/mastering';

describe('useMasterPlayback timing', () => {
  const s = read(`${DIR}/useMasterPlayback.ts`);
  it('the dock STOP is stopAll (cancels a pending play)', () => {
    assert.match(s, /stop: stopAll/);
    const stopAll = s.slice(s.indexOf('const stopAll'), s.indexOf('useStopWhenSilenced('));
    assert.match(stopAll, /cancelReplay\(\)/);
    assert.match(stopAll, /pendingRef\.current = null/);
  });
  it('the replay timer is tracked, cancelled by play, and fenced by the sound-stop epoch', () => {
    assert.match(s, /replayTimerRef\.current = t;/);
    const play = s.slice(s.indexOf('const play = useCallback'), s.indexOf('const stop = useCallback'));
    assert.match(play, /cancelReplay\(\);\s*\n\s*void \(async/, 'cancelled synchronously, before the gate await');
    assert.match(s, /const armedEpoch = getSoundStopEpoch\(\)/);
    assert.match(s, /if \(getSoundStopEpoch\(\) !== armedEpoch\) return;/);
  });
  it('a replay press re-zeroes the playhead', () => {
    const play = s.slice(s.indexOf('const play = useCallback'), s.indexOf('const stop = useCallback'));
    assert.match(play, /playerRef\.current\.play\(i\);\s*\n\s*startedAt\.value = 0;\s*\n\s*progress\.value = 0;/);
  });
});

describe('MasteringLabScreen', () => {
  const s = read(`${DIR}/MasteringLabScreen.tsx`);
  it('first answer wins in state and in the store', () => {
    assert.match(s, /setAnswers\(\(prev\) => \(scenarioId in prev \? prev : \{ \.\.\.prev, \[scenarioId\]: correct \}\)\)/);
    assert.match(s, /if \(scenarioId in m\.answers\) return;/);
  });
  it('the step clamp uses the static counts', () => {
    assert.match(s, /const stepCount = MASTERING_STEP_COUNTS\[mod\.id\]/);
  });
});

describe('Module 8 checklists', () => {
  const s = read(`${DIR}/modules/mod8Project.tsx`);
  it('no host callback inside a state updater', () => {
    assert.doesNotMatch(s, /set(Checks|Qc)\(\(c\) =>/);
    assert.match(s, /const checksRef = useRef\(checks\)/);
    assert.match(s, /const qcRef = useRef\(qc\)/);
  });
});
