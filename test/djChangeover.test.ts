/**
 * DJ Systems Lab, Stage 2b — performer changeovers (screen 23): which
 * disconnection would stop the music, the ground loop and its SAFE cures
 * (the mains earth is never lifted), laptops on two USB paths with a backup
 * player, and changeover continuity (model/djChangeover, model/djEvent,
 * engine/djEventRender, model/djCapstone.transitionStepBy).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { builtBooth, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { EARTH_LIFT_REFUSAL, freshEvent, lapPlay, laptopHum, withLap } from '../src/screens/lab/dj/model/djEvent.ts';
import { CHANGE_ITEMS, gradePrediction, onAir, programOn, sourceOf, wouldStop } from '../src/screens/lab/dj/model/djChangeover.ts';
import { TRANSITION_FRESH, transitionStepBy } from '../src/screens/lab/dj/model/djCapstone.ts';
import { renderEvent } from '../src/screens/lab/dj/engine/djEventRender.ts';
import { trueGrid } from '../src/screens/lab/dj/engine/djMusic.ts';
import { beatAt } from '../src/screens/lab/dj/model/djTime.ts';
import { deckPos } from '../src/screens/lab/dj/model/djModel.ts';

/** DJ 1 on air from laptop 1 (USB 1 → CH 1); DJ 2's laptop not yet in;
 *  deck B holds the backup on CH 2's LINE. */
function scene(): Booth {
  let b: Booth = { ...builtBooth(), ev: freshEvent() };
  b = { ...b, decks: { A: { ...b.decks.A, track: null }, B: { ...b.decks.B } }, ch: { 1: { ...b.ch[1], input: 'USB', fader: 0.85 }, 2: { ...b.ch[2], input: 'LINE', fader: 0 } } };
  b = withLap(b, 1, { usb: true, charger: 'STRIP' });
  b = lapPlay(b, 0, 1, true);
  return withLap(b, 2, { usb: false, charger: 'WALL' });
}

describe('what would stop the music', () => {
  it('only what the crowd’s music passes through right now', () => {
    const b = scene();
    assert.equal(programOn(b), true);
    const stops = CHANGE_ITEMS.filter((it) => wouldStop(b, it));
    assert.deepEqual(stops.sort(), ['lap1.usb', 'master', 'mixer.power'].sort());
  });
  it('a charger is not a source; an idle player and the booth feed are not on air', () => {
    const b = scene();
    for (const it of ['lap1.charger', 'lap2.usb', 'deckA.stick', 'deckB.stick', 'booth'] as const) assert.equal(wouldStop(b, it), false, it);
  });
  it('mid-changeover, with both laptops on air, pulling one USB no longer stops the music', () => {
    let b = withLap(scene(), 2, { usb: true, charger: 'STRIP' });
    b = lapPlay(b, 1, 2, true, 1);
    b = { ...b, ch: { ...b.ch, 2: { ...b.ch[2], input: 'USB', fader: 0.85 } } };
    assert.equal(onAir(b, 1) && onAir(b, 2), true);
    assert.equal(wouldStop(b, 'lap1.usb'), false);
    assert.equal(wouldStop(b, 'lap2.usb'), false);
  });
  it('the prediction is graded item by item', () => {
    const b = scene();
    assert.equal(gradePrediction(b, new Set(['lap1.usb', 'master', 'mixer.power'])).right, true);
    const g = gradePrediction(b, new Set(['lap1.usb', 'lap1.charger']));
    assert.equal(g.right, false);
    assert.equal(g.perItem['lap1.charger'], false);
    assert.equal(g.perItem['lap1.usb'], true);
  });
});

describe('the ground loop', () => {
  it('a charger earthed in another circuit plus the USB lead hums on CH 2', () => {
    const b = withLap(scene(), 2, { usb: true });
    assert.equal(laptopHum(b.ev!.lap2), true);
    const r = renderEvent({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], input: 'USB' } } }, 0, 1, null);
    assert.equal(r.ext.hum.ch2, true);
    assert.ok(r.rmsDb.ch2 > -60, 'the hum is in the channel');
  });
  it('the safe cures break it: battery, the booth strip, or an isolator in the USB', () => {
    const b = withLap(scene(), 2, { usb: true });
    for (const patch of [{ charger: 'NONE' as const }, { charger: 'STRIP' as const }, { isolator: true }]) assert.equal(laptopHum(withLap(b, 2, patch).ev!.lap2), false, JSON.stringify(patch));
  });
  it('lifting the mains earth is refused — there is no such state to set', () => {
    assert.match(EARTH_LIFT_REFUSAL, /^Refused/);
    assert.ok(!('earthLifted' in freshEvent().lap2));
  });
});

describe('two computer paths and a backup', () => {
  it('each laptop feeds only its own channel’s USB input', () => {
    const b = withLap(scene(), 2, { usb: true });
    assert.deepEqual(sourceOf(b, 1), { kind: 'lap', k: 1 });
    assert.deepEqual(sourceOf(b, 2), { kind: 'deck', d: 'B' }, 'CH 2 still on LINE');
    assert.deepEqual(sourceOf({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], input: 'USB' } } }, 2), { kind: 'lap', k: 2 });
  });
  it('a laptop started while the other plays starts in phase with it', () => {
    let b = withLap(scene(), 2, { usb: true });
    b = lapPlay(b, 3, 2, true, 1);
    const l1 = b.ev!.lap1.deck;
    const l2 = b.ev!.lap2.deck;
    const f = (x: number) => x - Math.floor(x);
    assert.ok(Math.abs(f(beatAt(trueGrid(l1.track!), deckPos(l1, 3))) - f(beatAt(trueGrid(l2.track!), deckPos(l2, 3)))) < 1e-6);
  });
  it('a frozen laptop stops its channel; the outgoing laptop, still playing, carries the room again', () => {
    let b = withLap(scene(), 2, { usb: true, charger: 'STRIP' });
    b = lapPlay(b, 0, 2, true, 1);
    b = { ...b, ch: { 1: { ...b.ch[1], fader: 0 }, 2: { ...b.ch[2], input: 'USB', fader: 0.85 } } };
    assert.equal(programOn(b), true);
    const frozen = withLap(b, 2, { alive: false });
    assert.equal(programOn(frozen), false);
    assert.ok(renderEvent(frozen, 0, 1, null).rmsDb.crowd < -80, 'the room is silent');
    const recovered = { ...frozen, ch: { ...frozen.ch, 1: { ...frozen.ch[1], fader: 0.85 } } };
    assert.equal(programOn(recovered), true);
  });
});

describe('changeover continuity', () => {
  const ok = { crowdMinDb: -20, clipped: false };
  it('done when the new source is up and the old one down, with the room never quiet', () => {
    let s = transitionStepBy(TRANSITION_FRESH, true, false, 0, ok);
    assert.equal(s.started, false);
    s = transitionStepBy(s, true, true, 0.4, ok);
    assert.equal(s.started, true);
    s = transitionStepBy(s, false, true, 0.85, ok);
    assert.equal(s.done, true);
    assert.equal(s.failed, null);
  });
  it('a gap or a clip during the change is caught', () => {
    const s = transitionStepBy({ started: true, done: false, failed: null }, true, true, 0.5, { crowdMinDb: -60, clipped: false });
    assert.ok(s.failed);
    const c = transitionStepBy({ started: true, done: false, failed: null }, true, true, 0.5, { crowdMinDb: -20, clipped: true });
    assert.ok(c.failed);
  });
  it('a gap then a finished change is NOT done: it stays failed until re-armed (learning review 2026-10-18, 23 #1)', () => {
    let s = transitionStepBy(TRANSITION_FRESH, true, true, 0.4, ok);
    s = transitionStepBy(s, true, true, 0.5, { crowdMinDb: -60, clipped: false });
    assert.ok(s.failed, 'the gap is caught');
    s = transitionStepBy(s, false, true, 0.85, ok);
    assert.equal(s.done, false, 'a clean chunk after the gap does not pass it');
    assert.ok(s.failed, 'the reason is kept to be shown');
    s = transitionStepBy(s, false, true, 0.85, ok);
    assert.equal(s.done, false);
    // re-armed only from the start state: old up, new down
    s = transitionStepBy(s, true, false, 0, ok);
    assert.deepEqual(s, TRANSITION_FRESH);
    s = transitionStepBy(s, true, true, 0.4, ok);
    s = transitionStepBy(s, false, true, 0.85, ok);
    assert.equal(s.done, true);
    assert.equal(s.failed, null);
  });
});
