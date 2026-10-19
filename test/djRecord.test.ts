/**
 * DJ Systems Lab, Stage 2b — recording (screen 21): the record taps, the
 * recorder's own gain and clip, the mic in the take, loopback, and the take
 * store that holds what really sounded (engine/djEventRender, model/djEvent,
 * booth/takeStore's pure half).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { builtBooth, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { freshEvent, micGainPos, recGainPos, withMic, withRec, type RecTap } from '../src/screens/lab/dj/model/djEvent.ts';
import { renderEvent } from '../src/screens/lab/dj/engine/djEventRender.ts';

function recBooth(tap: RecTap, gainDb = 0): Booth {
  let b: Booth = { ...builtBooth(), ev: freshEvent() };
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, playing: true, at: 0, posSec: 40 } }, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0.85 } } };
  b = withMic(b, { input: 'MIC1', on: true, gain1: micGainPos(44), toRec: false });
  return withRec(b, { tap, gain: recGainPos(gainDb), armedAt: 0 });
}
const withMaster = (b: Booth, m: number): Booth => ({ ...b, mixer: { ...b.mixer, master: m } });
const withBoothKnob = (b: Booth, m: number): Booth => ({ ...b, mixer: { ...b.mixer, booth: m } });

describe('record taps', () => {
  it('REC OUT is taken before the MASTER knob: MASTER moves never ride the take', () => {
    const lo = renderEvent(withMaster(recBooth('REC_OUT'), 0.3), 0, 2, null);
    const hi = renderEvent(withMaster(recBooth('REC_OUT'), 0.9), 0, 2, null);
    assert.ok(Math.abs(lo.ext.feedRms.rec - hi.ext.feedRms.rec) < 0.01, `${lo.ext.feedRms.rec} vs ${hi.ext.feedRms.rec}`);
    assert.ok(hi.ext.feedRms.master - lo.ext.feedRms.master > 10, 'while the room changes');
  });
  it('BOOTH OUT follows the BOOTH knob', () => {
    const lo = renderEvent(withBoothKnob(recBooth('BOOTH'), 0.3), 0, 2, null);
    const hi = renderEvent(withBoothKnob(recBooth('BOOTH'), 0.75), 0, 2, null);
    assert.ok(hi.ext.feedRms.rec - lo.ext.feedRms.rec > 6);
  });
  it('LOOPBACK hears only the computer: here, nothing at all', () => {
    const r = renderEvent(recBooth('LOOPBACK'), 0, 2, null);
    assert.ok(r.ext.feedRms.rec < -90, `${r.ext.feedRms.rec}`);
  });
  it('the mic is in the take only with MIC → REC (or a feed that carries it)', () => {
    const say = (b: Booth) => withMic(b, { says: [{ at: 0.2 }] });
    assert.ok(renderEvent(say(recBooth('REC_OUT')), 0, 2.5, null).ext.micIn.rec < -50);
    assert.ok(renderEvent(say(withMic(recBooth('REC_OUT'), { toRec: true })), 0, 2.5, null).ext.micIn.rec > -50);
    assert.ok(renderEvent(say(withMic(recBooth('BOOTH'), { toBooth: true })), 0, 2.5, null).ext.micIn.rec > -50);
  });
});

describe('the recorder’s own level', () => {
  it('its input gain moves its meters dB for dB', () => {
    const a = renderEvent(recBooth('REC_OUT', 0), 0, 2, null);
    const b = renderEvent(recBooth('REC_OUT', 6), 0, 2, null);
    assert.ok(Math.abs(b.ext.feedRms.rec - a.ext.feedRms.rec - 6) < 0.05);
  });
  it('it clips by itself while the MASTER is clean (the screen’s fault)', () => {
    const r = renderEvent(recBooth('REC_OUT', 18), 0, 2, null);
    assert.ok(r.ext.clipped.rec > 0, 'the recorder clips');
    assert.equal(r.clipped.master, 0, 'the room does not');
  });
  it('the take is what the recorder captured — after its clip, never louder than full scale', () => {
    const r = renderEvent(recBooth('REC_OUT', 18), 0, 2, null);
    assert.ok(r.ext.take);
    let pk = 0;
    for (const x of r.ext.take!.l) pk = Math.max(pk, Math.abs(x));
    assert.ok(pk <= 1 + 1e-9);
  });
  it('no take when nothing records', () => {
    assert.equal(renderEvent(withRec(recBooth('REC_OUT'), { armedAt: null }), 0, 1, null).ext.take, null);
    assert.equal(renderEvent(recBooth('NONE'), 0, 1, null).ext.take, null);
  });
});
