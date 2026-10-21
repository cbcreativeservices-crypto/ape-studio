/**
 * DJ Systems Lab — toddler bug pass on screens 9–16 (2026-10-19):
 *
 *   - Screen 11: the LOOPS TWICE AS LONG fault reads FIXED only when the grid
 *     is doubled back AND the loop running now is 4 real beats (BPM ×2 alone,
 *     with the fault's 8-beat loop still running, read FIXED);
 *   - Screen 12: PRACTISE AGAIN on THE SAMPLE HIT THE DANCE FLOOR starts a
 *     fresh run (it read FIXED the instant it restarted);
 *   - Screen 16: the "n s CLEAN" run and the DROPOUTS count are measured in
 *     booth time (tapping a chip seven times read 20 s CLEAN after ~5 s);
 *   - Screen 9: RESONANCE locks and the readouts say NO FILTER whenever the
 *     audio's filter is off (its dead zone), not only at exactly 0.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { builtBooth } from '../src/screens/lab/dj/model/djModel.ts';
import { load, loopExit, loopIn, setGrid } from '../src/screens/lab/dj/model/djDeck.ts';
import { filterOf, FILTER_DEAD_ZONE } from '../src/screens/lab/dj/engine/djDsp.ts';
import { halfBpmFaultFixed, loopRealBeats } from '../src/screens/lab/dj/pages/gridFault.ts';
import { freshCleanRun, stepCleanRun } from '../src/screens/lab/dj/pages/laptopCleanRun.ts';

const PAGES = join(import.meta.dirname, '..', 'src', 'screens', 'lab', 'dj', 'pages');
const src = (f: string) => readFileSync(join(PAGES, f), 'utf8');

describe('Screen 11 — the half-BPM fault reads the live loop', () => {
  const faulted = () => {
    let b = load(builtBooth(), 0, 'B', 'nightFerry');
    b = setGrid(b, 0, 'B', { gridMode: 'HALF_BPM', gridShiftBeats: 0, bpmFix: 1 });
    return loopIn(b, 0, 'B', 4);
  };
  it('the fault starts with an 8-real-beat loop', () => {
    assert.ok(Math.abs(loopRealBeats(faulted().decks.B) - 8) < 0.01);
    assert.equal(halfBpmFaultFixed(faulted().decks.B), false);
  });
  it('BPM ×2 alone is not a fix while the old loop runs', () => {
    const b = setGrid(faulted(), 0, 'B', { bpmFix: 2 });
    assert.equal(halfBpmFaultFixed(b.decks.B), false);
  });
  it('BPM ×2 then a NEW 4-beat loop is the fix', () => {
    let b = setGrid(faulted(), 0, 'B', { bpmFix: 2 });
    b = loopIn(loopExit(b, 0, 'B'), 0, 'B', 4);
    assert.ok(Math.abs(loopRealBeats(b.decks.B) - 4) < 0.01);
    assert.equal(halfBpmFaultFixed(b.decks.B), true);
  });
  it('the page no longer latches a "made a real loop" flag', () => {
    const s = src('p11Grid.tsx');
    assert.match(s, /fixed=\{halfBpmFaultFixed\(B\)\}/);
    assert.doesNotMatch(s, /realLoop/);
  });
});

describe('Screen 12 — PRACTISE AGAIN is a fresh run', () => {
  it('starting the fault clears the last run’s fix', () => {
    const s = src('p12Loops.tsx');
    const start = s.slice(s.indexOf('title="THE SAMPLE HIT THE DANCE FLOOR"'));
    const body = start.slice(start.indexOf('start={'), start.indexOf('fixed={'));
    assert.match(body, /setFaultFixed\(false\)/);
  });
});

describe('Screen 16 — the clean run is booth time, not chunk count', () => {
  const KEY = '256:48000:TWO DECKS:MIXER USB:true';
  it('seven re-renders 0.5 s apart do not make 20 s', () => {
    let r = freshCleanRun();
    for (let i = 0; i < 7; i++) r = stepCleanRun(r, { t0: 10 + i * 0.5, seconds: 3, drops: [] }, KEY, true);
    // 3 s of look-ahead plus 3 s of booth time
    assert.ok(Math.abs(r.clean - 6) < 1e-9, `clean ${r.clean}`);
  });
  it('contiguous chunks add up (3 + 8 + 8 + 8)', () => {
    let r = freshCleanRun();
    let t = 0;
    for (const s of [3, 8, 8, 8]) {
      r = stepCleanRun(r, { t0: t, seconds: s, drops: [] }, KEY, true);
      t += s;
    }
    assert.equal(r.clean, 27);
  });
  it('a dropout restarts the run and is counted once across a re-render', () => {
    let r = freshCleanRun();
    r = stepCleanRun(r, { t0: 0, seconds: 8, drops: [5] }, KEY, true);
    assert.equal(r.count, 1);
    assert.equal(r.clean, 3);
    // a change at 1 s re-renders [1.25, 4.25): no dropout in it
    r = stepCleanRun(r, { t0: 1.25, seconds: 3, drops: [] }, KEY, true);
    assert.equal(r.count, 1);
    // the next chunk repeats the dropout at 5 s (fixed per buffer) and adds one at 9 s
    r = stepCleanRun(r, { t0: 4.25, seconds: 8, drops: [5, 9] }, KEY, true);
    assert.equal(r.count, 2);
    assert.ok(Math.abs(r.clean - 3.25) < 1e-9);
  });
  it('new settings start a new run; not feeding the mixer is not clean', () => {
    let r = stepCleanRun(freshCleanRun(), { t0: 0, seconds: 8, drops: [2] }, KEY, true);
    r = stepCleanRun(r, { t0: 8, seconds: 8, drops: [] }, '512:48000:TWO DECKS:MIXER USB:true', true);
    assert.equal(r.count, 0);
    assert.equal(r.clean, 8);
    r = stepCleanRun(r, { t0: 16, seconds: 8, drops: [] }, '512:48000:TWO DECKS:MIXER USB:true', false);
    assert.equal(r.clean, 0);
  });
  it('the page uses the helper', () => {
    assert.match(src('p16Laptop.tsx'), /stepCleanRun\(run\.current/);
  });
});

describe('Screen 9 — resonance locks whenever the audio’s filter is off', () => {
  it('a knob inside the dead zone is OFF to the audio', () => {
    assert.equal(filterOf(FILTER_DEAD_ZONE * 0.8).kind, 'off');
    assert.equal(filterOf(-FILTER_DEAD_ZONE * 0.8).kind, 'off');
  });
  it('the page judges OFF by filterOf, not by exactly 0', () => {
    const s = src('p09Eq.tsx');
    assert.match(s, /filterOf\(booth\.ch\[ch\]\.filter\)\.kind !== 'off'/);
    assert.doesNotMatch(s, /filter === 0 && booth\.ch\[2\]\.filter === 0/);
  });
});

describe('Screens 9–16 — nothing ticks from the previous screen’s booth or a stale render', () => {
  const PAGES9 = ['p09Eq.tsx', 'p11Grid.tsx', 'p13Effects.tsx', 'p14Key.tsx', 'p15Stems.tsx', 'p16Laptop.tsx'];
  it('every render-time goal flag waits for the screen’s own setup (ready)', () => {
    for (const f of PAGES9) {
      const s = src(f);
      assert.match(s, /const \{ ready \} = useScreenSetup\(/, f);
      assert.match(s, /useVisitGoals\(ctx, goals, '[A-Z]+', ready\)/, f);
      const flags = s.split('\n').filter((l) => /^ {2}if \(.*\) (hand|story|hit|h)\.current\.[a-zA-Z]+ = true;/.test(l));
      assert.ok(flags.length > 0, f);
      for (const l of flags) assert.match(l, /^ {2}if \(ready && /, `${f}: ${l.trim().slice(0, 60)}`);
    }
  });
  it('Screen 13’s echo out and Screen 16’s check read a render made after the move', () => {
    assert.match(src('p13Effects.tsx'), /renderedSince\(last, downAt\.current\)/);
    const s16 = src('p16Laptop.tsx');
    assert.match(s16, /renderedSince\(last, checkAt\.current\)/);
    assert.match(s16, /checkAt\.current = boothNow\(\)/);
  });
});
