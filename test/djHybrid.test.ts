/**
 * DJ Systems Lab, Stage 2b — the hybrid rig (screen 22): CLOCK is not AUDIO.
 * A clock lead makes the drum machine play the leader's tempo and carries no
 * sound; its audio reaches the room only through a channel; TRS-MIDI must be
 * the right type and two USB devices need a host; clock sets the tempo, the
 * START sets the bar; on INTERNAL it drifts (engine/djDrumMachine,
 * model/djEvent, engine/djEventRender).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_PLUGS, builtBooth, connect, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { CLOCK_CABLES, clockArrives, counterBpm, dmBpm, freshEvent, withDm, type DrumMachine } from '../src/screens/lab/dj/model/djEvent.ts';
import { dmHits, dmPhase, leaderBeat, nextLeaderBar } from '../src/screens/lab/dj/engine/djDrumMachine.ts';
import { renderEvent } from '../src/screens/lab/dj/engine/djEventRender.ts';
import { TRACKS } from '../src/screens/lab/dj/engine/djMusic.ts';

function rig(dm: Partial<DrumMachine>, playA = true): Booth {
  let b: Booth = { ...builtBooth(), ev: freshEvent() };
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, playing: playA, at: 0, posSec: TRACKS.nightFerry.leadInSec + 40 } }, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0.85 }, 2: { ...b.ch[2], fader: 0.7, input: 'LINE' } } };
  return withDm(b, dm);
}
const audioPatched = (b: Booth): Booth => connect(connect(withDm(b, { audio: true }), 'B.rcaL', null)!, 'B.rcaR', null)!;

describe('clock arrives — or does not', () => {
  it('5-pin MIDI and the right TRS-MIDI type carry it; the wrong type and USB-to-USB do not', () => {
    assert.equal(CLOCK_CABLES.DIN.works, true);
    assert.equal(CLOCK_CABLES.TRS_A.works, true);
    assert.equal(CLOCK_CABLES.TRS_B.works, false);
    assert.equal(CLOCK_CABLES.USB.works, false);
    assert.equal(clockArrives(rig({ clockSrc: 1, cable: 'DIN' })), true);
    assert.equal(clockArrives(rig({ clockSrc: 1, cable: 'TRS_B' })), false);
    assert.equal(clockArrives(rig({ clockSrc: 'OFF', cable: 'DIN' })), false, 'the mixer must send it');
  });
  it('on EXT it plays the leader’s tempo, tick for tick; with no clock it waits', () => {
    const b = rig({ clockSrc: 1, cable: 'DIN', sync: 'EXT' });
    assert.equal(dmBpm(b), counterBpm(b, 1));
    assert.ok(Math.abs(dmBpm(b)! - 122) < 1e-9);
    const moved = { ...b, decks: { ...b.decks, A: { ...b.decks.A, pitch: 2 } } };
    assert.ok(Math.abs(dmBpm(moved)! - 122 * 1.02) < 1e-9, 'it follows the tempo fader');
    assert.equal(dmBpm(rig({ clockSrc: 1, cable: 'TRS_B', sync: 'EXT' })), null);
  });
});

describe('a clock lead carries no sound', () => {
  it('following the clock, but with no audio lead, CH 2 is silent', () => {
    const b = rig({ clockSrc: 1, cable: 'DIN', sync: 'EXT', startedAt: 0 });
    const r = renderEvent(b, 0.5, 2, null);
    assert.ok(dmHits(b, 0.5, 2.5).length > 10, 'it is playing');
    assert.ok(r.rmsDb.ch2 < -80, `ch2 ${r.rmsDb.ch2}`);
  });
  it('with OUT L / R in CH 2’s LINE inputs it is in the channel (and the room)', () => {
    const b = audioPatched(rig({ clockSrc: 1, cable: 'DIN', sync: 'EXT', startedAt: 0 }));
    const r = renderEvent(b, 0.5, 2, null);
    assert.ok(r.rmsDb.ch2 > -40, `ch2 ${r.rmsDb.ch2}`);
  });
  it('putting deck B back gives CH 2 back to deck B', () => {
    const b = audioPatched(rig({}));
    const back = connect(connect(withDm(b, { audio: false }), 'B.rcaL', BUILT_PLUGS['B.rcaL'])!, 'B.rcaR', BUILT_PLUGS['B.rcaR'])!;
    assert.equal(back.plugs['B.rcaL'], 'ch2.line.L');
  });
});

describe('clock sets the tempo; the START sets the bar', () => {
  it('started off the beat it is in tempo but out of phase; an armed start lands on the one', () => {
    const b0 = rig({ clockSrc: 1, cable: 'DIN', sync: 'EXT' });
    const lb = leaderBeat(b0, 3)!;
    const offT = 3 + ((Math.ceil(lb) + 0.5 - lb) * 60) / 122; // half a beat after a beat
    const off = dmPhase(withDm(b0, { startedAt: offT }))!;
    assert.ok(Math.abs(Math.abs(off.beat) - 0.5) < 0.02, `beat ${off.beat}`);
    const armedAt = nextLeaderBar(b0, 3)!;
    const on = dmPhase(withDm(b0, { startedAt: armedAt }))!;
    assert.ok(Math.abs(on.barBeats) < 1e-6, `bar ${on.barBeats}`);
  });
  it('its hits fall exactly on the leader’s sixteenths while it follows', () => {
    const b = rig({ clockSrc: 1, cable: 'DIN', sync: 'EXT' });
    const ts = nextLeaderBar(b, 2)!;
    const c = withDm(b, { startedAt: ts });
    for (const h of dmHits(c, ts, ts + 2)) {
      const q = leaderBeat(c, h.t)! * 4;
      assert.ok(Math.abs(q - Math.round(q)) < 1e-6);
    }
  });
  it('on INTERNAL a few tenths of a BPM off, it drifts', () => {
    const b = rig({ sync: 'INT', intBpm: 121.5, startedAt: 0 });
    const hits = dmHits(b, 0, 40).filter((h) => h.step === 0);
    const firstOff = leaderBeat(b, hits[0].t)! - Math.round(leaderBeat(b, hits[0].t)!);
    const lastOff = leaderBeat(b, hits[hits.length - 1].t)! - leaderBeat(b, hits[0].t)!;
    const beats = (hits[hits.length - 1].t - hits[0].t) * (121.5 / 60);
    assert.ok(Math.abs(lastOff - beats) > 0.1, `drift ${lastOff - beats}`);
    void firstOff;
  });
  it('no clock, no hits on EXT; a stopped leader stops it', () => {
    assert.equal(dmHits(rig({ clockSrc: 1, cable: 'TRS_B', sync: 'EXT', startedAt: 0 }), 0, 4).length, 0);
    assert.equal(dmHits(rig({ clockSrc: 1, cable: 'DIN', sync: 'EXT', startedAt: 0 }, false), 0, 4).length, 0);
  });
});
