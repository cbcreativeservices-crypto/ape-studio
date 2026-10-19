/**
 * DJ Systems Lab — second learning review 2026-10-18, 24 #1 (BLOCKER): a
 * screen's goals must not latch on its FIRST render, which still sees the
 * booth the previous screen left. booth/setup.useScreenSetup marks its setup
 * PENDING until its layout effect has applied it; bits.useVisitGoals latches
 * nothing while one is pending (booth/goalStore.latchGoals / setupPending).
 * Also the second audio review #1: a pre-matched blend plays with KEY LOCK on.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PENDING_LAPSE_MS, clearSetupPending, latchGoals, markSetupPending, setupPending } from '../src/screens/lab/dj/booth/goalStore.ts';
import { preMatchedBooth } from '../src/screens/lab/dj/model/djMatch.ts';
import { builtBooth } from '../src/screens/lab/dj/model/djModel.ts';
import { playedSemis } from '../src/screens/lab/dj/model/djKey.ts';
import { playedBpm } from '../src/screens/lab/dj/model/djTime.ts';
import { TRACKS } from '../src/screens/lab/dj/engine/djMusic.ts';

const ROOT = join(import.meta.dirname, '..');

describe('goals latch nothing before the screen is ready', () => {
  it('a hit on a not-ready render does not latch; a hit once ready does; credit never unlatches', () => {
    let seen = latchGoals([false, false], [true, false], false);
    assert.deepEqual(seen, [false, false], 'the leftover booth cannot tick a goal');
    seen = latchGoals(seen, [true, false], true);
    assert.deepEqual(seen, [true, false]);
    seen = latchGoals(seen, [false, false], true);
    assert.deepEqual(seen, [true, false], 'latched stays latched');
    assert.deepEqual(latchGoals([true], [false, true], true), [true, true], 'a goal list that grows keeps what it had');
  });
  it('a pending setup blocks latching until it is applied, and a mark that never commits lapses', () => {
    const k = {};
    markSetupPending(k, 1000);
    assert.equal(setupPending(1000 + 10), true);
    clearSetupPending(k);
    assert.equal(setupPending(1000 + 10), false);
    markSetupPending(k, 1000);
    assert.equal(setupPending(1000 + PENDING_LAPSE_MS + 1), false, 'a discarded render cannot block goals forever');
  });
  it('the hooks are wired: useScreenSetup marks and clears, useVisitGoals asks, p24 needs a power event this visit', () => {
    const setup = readFileSync(join(ROOT, 'src/screens/lab/dj/booth/setup.ts'), 'utf8');
    assert.match(setup, /markSetupPending\(key\)/);
    assert.match(setup, /clearSetupPending\(key\)/);
    assert.match(setup, /ready: boolean/);
    const bits = readFileSync(join(ROOT, 'src/screens/lab/dj/bits.tsx'), 'utf8');
    assert.match(bits, /latchGoals\(seen\.current, goals\.map\(\(g\) => g\.hit\), ready && !setupPending\(\)\)/);
    const p24 = readFileSync(join(ROOT, 'src/screens/lab/dj/pages/p24Capstone.tsx'), 'utf8');
    assert.match(p24, /lastPower != null/, 'the power goal needs a power event this visit');
    assert.match(p24, /useVisitGoals\(ctx, goals, 'EVENT', ready\)/);
  });
});

describe('a pre-matched blend is in tune', () => {
  it('deck B at deck A’s tempo, with key lock on: 0 semitones', () => {
    const b0 = builtBooth();
    const b = { ...b0, decks: { A: { ...b0.decks.A, track: 'nightFerry' as const, pitch: 0 }, B: { ...b0.decks.B, track: 'glassHarbour' as const, pitch: 0 } } };
    const m = preMatchedBooth(b);
    assert.equal(m.decks.B.keyLock, true);
    assert.ok(Math.abs(playedBpm(TRACKS.glassHarbour.bpm, m.decks.B.pitch) - playedBpm(TRACKS.nightFerry.bpm, 0)) < 0.05, 'tempo matched');
    assert.ok(Math.abs(playedSemis(m.decks.B)) < 1e-9, 'in tune');
    const off = preMatchedBooth(b, false);
    assert.ok(Math.abs(playedSemis(off.decks.B)) > 0.4, 'without key lock it would be about half a semitone out');
  });
});
