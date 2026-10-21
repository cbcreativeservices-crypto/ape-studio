/**
 * DJ Systems Lab — the musical clock (src/screens/lab/dj/model/djTime.ts) and
 * the players' transport (model/djDeck.ts): BPM / beat / bar / phrase math,
 * tempo, drift versus offset, quantize, loops, beat jump, the analysed grid
 * (a late first beat, a half-BPM reading) and SYNC.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BEATS_PER_PHRASE,
  advance,
  barInPhrase,
  barOf,
  beatAt,
  beatInBar,
  beatJump,
  beatsToNextPhrase,
  driftBeatsPerSec,
  formatBarBeat,
  loopRealSec,
  loopTrackSec,
  phaseOffset,
  phraseOf,
  pitchFor,
  playedBpm,
  quantizeBeat,
  rateOf,
  secondsToQuarterBeat,
  semitonesOf,
  syncPhaseTime,
  syncPitch,
  timeOfBeat,
} from '../src/screens/lab/dj/model/djTime.ts';
import { TRACKS, trueGrid } from '../src/screens/lab/dj/engine/djMusic.ts';
import { builtBooth } from '../src/screens/lab/dj/model/djModel.ts';
import { analysedGrid, beatJump as deckJump, cue, gridCorrect, hotCue, load, loopExit, loopIn, playPause, setGrid, setPitch, shownBeat, sync, trueBeat } from '../src/screens/lab/dj/model/djDeck.ts';

const near = (a: number, b: number, eps = 1e-9, msg?: string) => assert.ok(Math.abs(a - b) <= eps, msg ?? `${a} ≉ ${b}`);

describe('beats, bars, phrases', () => {
  const g = { bpm: 120, firstBeatSec: 0.5 };
  it('a beat at 120 BPM is half a second, from the first beat', () => {
    near(beatAt(g, 0.5), 0);
    near(beatAt(g, 1.0), 1);
    near(timeOfBeat(g, 8), 4.5);
  });
  it('counts 4/4 bars and 8-bar phrases', () => {
    assert.equal(barOf(0), 1);
    assert.equal(beatInBar(0), 1);
    assert.equal(beatInBar(3.9), 4);
    assert.equal(barOf(4), 2);
    assert.equal(BEATS_PER_PHRASE, 32);
    assert.equal(phraseOf(31.9), 1);
    assert.equal(phraseOf(32), 2);
    assert.equal(barInPhrase(28), 8);
    assert.equal(formatBarBeat(66), '17.3');
    assert.equal(beatsToNextPhrase(28), 4);
    assert.equal(beatsToNextPhrase(32), 0);
  });
});

describe('tempo', () => {
  it('rate = 1 + pitch/100 and the BPM follows', () => {
    near(rateOf(3), 1.03);
    near(playedBpm(122, 3.2786885245901), 126, 1e-6);
    near(pitchFor(122, 126), 3.278688524590164, 1e-9);
  });
  it('without key lock, +5.95 % is about one semitone', () => {
    near(semitonesOf(5.946309), 1, 1e-5);
  });
  it('drift versus offset: matched tempos have no drift but can still be a beat-fraction apart', () => {
    near(driftBeatsPerSec(122, 0, 122, 0), 0);
    assert.equal(secondsToQuarterBeat(122, 0, 122, 0), Infinity);
    // 0.5 BPM apart drifts a quarter beat in 30 s.
    near(secondsToQuarterBeat(122.5, 0, 122, 0), 30, 1e-9);
    near(phaseOffset(10.1, 10), 0.1, 1e-9);
    near(phaseOffset(10.9, 10), -0.1, 1e-9);
  });
});

describe('quantize, loops, beat jump', () => {
  const g = { bpm: 122, firstBeatSec: 0.12 };
  it('quantize snaps to the nearest beat', () => {
    assert.equal(quantizeBeat(7.4), 7);
    assert.equal(quantizeBeat(7.6), 8);
    assert.equal(quantizeBeat(7.6, 4), 8);
  });
  it('a 4-beat loop at 122 BPM is 1.967 s of track and shorter at +4 %', () => {
    near(loopTrackSec(g, 4), (4 * 60) / 122);
    near(loopRealSec(g, 4, 4), (4 * 60) / 122 / 1.04);
  });
  it('a loop wraps the position; a position after the loop runs on', () => {
    const loop = { startSec: 10, lengthSec: 2 };
    near(advance(10, 1.5, 0, loop), 11.5);
    near(advance(10, 2.5, 0, loop), 10.5);
    near(advance(10, 6.25, 0, loop), 10.25);
    near(advance(13, 1, 0, loop), 14);
  });
  it('beat jump moves by whole beats of the grid', () => {
    near(beatJump(g, 5, 16), 5 + (16 * 60) / 122);
  });
});

describe('the analysed grid and sync', () => {
  it('a late-by-half-a-beat grid and a half-BPM reading are wrong; the fixes make them right', () => {
    let b = builtBooth();
    b = setGrid(b, 0, 'B', { gridMode: 'LATE_HALF' });
    assert.equal(gridCorrect(b.decks.B), false);
    const late = analysedGrid(b.decks.B)!;
    near(late.firstBeatSec - TRACKS.glassHarbour.leadInSec, 0.5 * (60 / 126), 1e-12);
    b = setGrid(b, 0, 'B', { gridShiftBeats: -0.5 });
    assert.equal(gridCorrect(b.decks.B), true);
    b = setGrid(b, 0, 'B', { gridMode: 'HALF_BPM', gridShiftBeats: 0 });
    assert.equal(analysedGrid(b.decks.B)!.bpm, 63);
    assert.equal(gridCorrect(b.decks.B), false);
    b = setGrid(b, 0, 'B', { bpmFix: 2 });
    assert.equal(gridCorrect(b.decks.B), true);
  });
  it('SYNC matches the played tempo inside ±8 %, or refuses when no multiple fits', () => {
    near(syncPitch(122, 0, 126)!, pitchFor(126, 122), 1e-12);
    // 100 BPM cannot follow 122 inside ±8 % (it would need +22 %), nor at ×2 / ×½.
    assert.equal(syncPitch(122, 0, 100), null);
    // A half-BPM reading (63) is matched at ×2.
    near(syncPitch(122, 0, 63)!, pitchFor(126, 122), 1e-12);
  });
  it('SYNC aligns the ANALYSED beat phase — a wrong grid makes the real beats flam', () => {
    let b = builtBooth();
    b = playPause(b, 0, 'A');
    b = playPause(b, 0, 'B');
    b = sync(b, 0, 'B')!;
    const pa = trueBeat(b, 'A', 0)!;
    const pb = trueBeat(b, 'B', 0)!;
    near(phaseOffset(pb, pa), 0, 1e-9);
    // Now the follower's grid is half a beat late: sync lines up the GRIDS…
    b = setGrid(b, 0, 'B', { gridMode: 'LATE_HALF' });
    b = sync(b, 0, 'B')!;
    near(phaseOffset(shownBeat(b, 'B', 0)!, shownBeat(b, 'A', 0)!), 0, 1e-9);
    // …and the real beats land half a beat apart.
    near(Math.abs(phaseOffset(trueBeat(b, 'B', 0)!, trueBeat(b, 'A', 0)!)), 0.5, 1e-9);
    const t = syncPhaseTime(trueGrid('nightFerry'), 5, trueGrid('nightFerry'), 5.1);
    near(t, 5 + Math.round(((5.1 - 5) * 122) / 60) * (60 / 122), 1e-9);
  });
});

describe('transport', () => {
  it('LOAD cues at the first beat; CUE while playing returns and pauses; CUE while paused sets the point (quantized)', () => {
    let b = load(builtBooth(), 0, 'A', 'nightFerry');
    near(b.decks.A.posSec, TRACKS.nightFerry.leadInSec);
    b = playPause(b, 0, 'A');
    b = cue(b, 3, 'A');
    assert.equal(b.decks.A.playing, false);
    near(b.decks.A.posSec, TRACKS.nightFerry.leadInSec);
    b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: 10.003 } } };
    b = cue(b, 3, 'A');
    const g = trueGrid('nightFerry');
    near(beatAt(g, b.decks.A.cueSec), Math.round(beatAt(g, 10.003)), 1e-9);
  });
  it('a hot cue stores, then jumps and plays; a loop holds the position; EXIT lets it run on', () => {
    let b = builtBooth();
    b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: 20 } } };
    b = hotCue(b, 0, 'A', 0);
    assert.ok(b.decks.A.hotCues[0] != null);
    b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: 40 } } };
    b = hotCue(b, 0, 'A', 0);
    assert.equal(b.decks.A.playing, true);
    near(b.decks.A.posSec, b.decks.A.hotCues[0]!);
    b = loopIn(b, 0, 'A', 4);
    const L = b.decks.A.loop!;
    near(L.lengthSec, (4 * 60) / 122);
    const pos = (t: number) => trueBeat(b, 'A', t)!;
    // 10 s later the deck is still inside its loop.
    const inside = pos(10);
    const start = beatAt(trueGrid('nightFerry'), L.startSec);
    assert.ok(inside >= start - 1e-9 && inside < start + 4 + 1e-9, `${inside} not in [${start}, ${start + 4})`);
    b = loopExit(b, 10, 'A');
    assert.equal(b.decks.A.loop, null);
  });
  it('beat jump and pitch keep the position continuous at the moment of change', () => {
    let b = playPause(builtBooth(), 0, 'A');
    const before = trueBeat(b, 'A', 5)!;
    b = setPitch(b, 5, 'A', 4);
    near(trueBeat(b, 'A', 5)!, before, 1e-9);
    near(trueBeat(b, 'A', 6)! - before, (122 * 1.04) / 60, 1e-9);
    b = deckJump(b, 6, 'A', 8);
    near(trueBeat(b, 'A', 6)! - before, (122 * 1.04) / 60 + 8, 1e-9);
  });
});
