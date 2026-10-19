/**
 * DJ Systems Lab, Stage 2b — the event rig's microphone and the room
 * (src/screens/lab/dj/model/djEvent.ts, model/djRoom.ts,
 * engine/djEventRender.ts, geometry/eventGeometry.ts).
 *
 * Pins: phantom power belongs to the INPUT; a line-level receiver overloads
 * the mic input before the gain knob; the mic reaches each feed only by its
 * send (MASTER always, BOOTH and REC by switch); talkover dips the music
 * while the mic speaks and comes back; the FEEDBACK model's geometry and its
 * SAFETY (the ring the lab plays is capped, whatever the gain); coverage is
 * real (−6 dB at the nominal half-angle, steep outside, subs near-omni);
 * the placements' numbers; the venue's crossover sums flat; turntable
 * feedback; and the extra rear sockets sit on the panel clear of Stage 1's.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { builtBooth, connect, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import {
  EDGE_DB,
  MIC_INPUTS,
  feedbackOf,
  freshEvent,
  micAlive,
  micGainPos,
  micInputOverload,
  micPeakDb,
  phantomPop,
  turntableMarginDb,
  venueHandoffOk,
  venueSwapped,
  withMic,
  withVenue,
  freshVenue,
  type MicState,
} from '../src/screens/lab/dj/model/djEvent.ts';
import { PLACEMENTS, ROOM, cardioidDb, relLevelDb, subDirectivityDb, topDirectivityDb, topsDbaAt, monitorsDbaAt } from '../src/screens/lab/dj/model/djRoom.ts';
import { RING_CAP_DBFS, renderEvent, xoverResp } from '../src/screens/lab/dj/engine/djEventRender.ts';
import { voiceSeconds } from '../src/screens/lab/dj/engine/djVoice.ts';
import { MIXER_REAR_EXTRA } from '../src/screens/lab/dj/geometry/eventGeometry.ts';
import { MIXER_REAR as REAR, MIXER_REAR_JACKS } from '../src/screens/lab/dj/geometry/boothGeometry.ts';

/** A booth playing deck A on air, with a dynamic mic in MIC 1 at +44 dB. */
function eventBooth(mic: Partial<MicState> = {}): Booth {
  let b: Booth = { ...builtBooth(), ev: freshEvent() };
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, playing: true, at: 0, posSec: 40 } }, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0.85 } } };
  return withMic(b, { input: 'MIC1', on: true, gain1: micGainPos(44), ...mic });
}
const say = (b: Booth, at = 0.3): Booth => withMic(b, { says: [{ at }] });

describe('the microphone — phantom belongs to the input', () => {
  it('only MIC 1 has +48 V on this mixer', () => {
    assert.equal(MIC_INPUTS.MIC1.phantom, true);
    assert.equal(MIC_INPUTS.MIC2.phantom, false);
  });
  it('a condenser makes no signal without phantom from its input', () => {
    const m = eventBooth({ device: 'CONDENSER' }).ev!.mic;
    assert.equal(micAlive({ ...m, input: 'MIC1', phantom: false }), false);
    assert.equal(micAlive({ ...m, input: 'MIC2', phantom: true }), false, 'MIC 2 has no phantom to give');
    assert.equal(micAlive({ ...m, input: 'MIC1', phantom: true }), true);
  });
  it('a dynamic mic needs none, and is silent unplugged', () => {
    const m = eventBooth().ev!.mic;
    assert.equal(micAlive({ ...m, input: 'MIC2', phantom: false }), true);
    assert.equal(micAlive({ ...m, input: 'NONE' }), false);
  });
  it('switching phantom with the channel on and up is flagged as a pop', () => {
    const m = eventBooth().ev!.mic;
    assert.equal(phantomPop(m), true);
    assert.equal(phantomPop({ ...m, on: false }), false);
  });
  it('a condenser is hotter: the same gain puts speech 12 dB higher', () => {
    const d = micPeakDb(eventBooth().ev!.mic)!;
    const c = micPeakDb({ ...eventBooth({ device: 'CONDENSER', phantom: true }).ev!.mic })!;
    assert.ok(Math.abs(c - d - 12) < 1e-9);
    assert.ok(d > -10 && d < -3, `speech peaks at +44 dB: ${d}`);
  });
  it('a LINE-level receiver overloads the mic input before the gain knob', () => {
    const m = eventBooth({ device: 'WIRELESS', rxOut: 'LINE' }).ev!.mic;
    assert.equal(micInputOverload({ ...m, gain1: 0 }), true, 'even at minimum gain');
    assert.equal(micInputOverload({ ...m, rxOut: 'MIC' }), false);
    const r = renderEvent(say({ ...eventBooth({ device: 'WIRELESS', rxOut: 'LINE', gain1: 0 }) }), 0, 2, null);
    assert.ok(r.ext.clipped.micInput > 0, 'the input stage clips');
  });
});

describe('the microphone — which feeds carry it', () => {
  const VOICE = -50;
  it('MASTER always; BOOTH and REC only by their switches', () => {
    const base = { ...eventBooth({ toBooth: false, toRec: false }) };
    const b = { ...base, ev: { ...base.ev!, rec: { tap: 'REC_OUT' as const, gain: 0.5, armedAt: 0 } } };
    const off = renderEvent(say(b), 0, 2.5, null);
    assert.ok(off.ext.micIn.master > VOICE, `master ${off.ext.micIn.master}`);
    assert.ok(off.ext.micIn.crowd > VOICE, 'and so the crowd');
    assert.ok(off.ext.micIn.booth < VOICE, `booth ${off.ext.micIn.booth}`);
    assert.ok(off.ext.micIn.rec < VOICE, `rec ${off.ext.micIn.rec}`);
    const on = renderEvent(say(withMic(b, { toBooth: true, toRec: true })), 0, 2.5, null);
    assert.ok(on.ext.micIn.booth > VOICE);
    assert.ok(on.ext.micIn.rec > VOICE);
  });
  it('a muted mic reaches nothing', () => {
    const r = renderEvent(say(eventBooth({ on: false, toBooth: true, toRec: true })), 0, 2, null);
    assert.ok(r.ext.micIn.master < -60 && r.ext.micIn.booth < -60);
  });
});

describe('talkover — a voice-keyed dip', () => {
  it('dips the music by its depth while the mic speaks, and comes back after', () => {
    const b = say(eventBooth({ talkover: true, depth: 1 / 3 }), 0.2);
    const r = renderEvent(b, 0, voiceSeconds() + 2.2, null);
    assert.ok(r.ext.duckMinDb <= -11.5 && r.ext.duckMinDb >= -12.5, `dip ${r.ext.duckMinDb}`);
    const lastBlock = r.ext.duckDb[r.ext.duckDb.length - 1];
    assert.ok(lastBlock > -1, `recovered: ${lastBlock}`);
  });
  it('off, or with the mic silent, nothing dips', () => {
    assert.ok(renderEvent(say(eventBooth({ talkover: false })), 0, 2, null).ext.duckMinDb > -0.5);
    assert.ok(renderEvent(eventBooth({ talkover: true }), 0, 2, null).ext.duckMinDb > -0.5);
  });
});

describe('feedback — the model', () => {
  const fb = (m: Partial<MicState>, b?: (x: Booth) => Booth) => feedbackOf((b ?? ((x) => x))(eventBooth(m)));
  it('the mic at the decks, its rear to the room, is safe; pointed at a monitor or on the floor it rings', () => {
    assert.equal(fb({ pos: 'DECKS' }).state, 'SAFE');
    assert.ok(fb({ pos: 'DECKS' }).marginDb >= 6);
    assert.ok(fb({ pos: 'MONITOR', toBooth: true }).marginDb <= 0);
    assert.equal(fb({ pos: 'FLOOR' }).state, 'RINGING');
  });
  it('sending the mic to the booth monitors costs margin; turning the booth down wins it back', () => {
    const a = fb({ toBooth: false }).marginDb;
    const b = fb({ toBooth: true }).marginDb;
    assert.ok(b < a);
    const lower = feedbackOf({ ...eventBooth({ toBooth: true }), mixer: { ...eventBooth().mixer, booth: 0.2 } }).marginDb;
    assert.ok(lower > b);
  });
  it('less gain, more margin — dB for dB', () => {
    const a = fb({ gain1: micGainPos(44) }).marginDb;
    const b = fb({ gain1: micGainPos(38) }).marginDb;
    assert.ok(Math.abs(b - a - 6) < 1e-6);
  });
  it('a mic that is off or unplugged cannot feed back', () => {
    assert.equal(fb({ on: false }).marginDb, Infinity);
    assert.equal(fb({ input: 'NONE' }).marginDb, Infinity);
  });
  it('EDGE sits between SAFE and RINGING', () => {
    assert.ok(EDGE_DB > 0);
  });
});

describe('feedback — the lab never plays a howl', () => {
  it('the ring it plays is capped, even at full gain on the dance floor', () => {
    const b = eventBooth({ pos: 'FLOOR', gain1: 1, level: 1, toBooth: true });
    let r = renderEvent(b, 0, 3, null);
    for (let i = 0; i < 3; i++) r = renderEvent(b, r.carry.t1, 3, r);
    assert.ok(r.ext.ringDb <= RING_CAP_DBFS + 0.01, `ring ${r.ext.ringDb}`);
    assert.ok(r.ext.ringDb > -60, 'it is there to be heard');
  });
  it('a safe mic plays no ring at all', () => {
    const r = renderEvent(eventBooth({ pos: 'DECKS' }), 0, 2, null);
    assert.equal(r.ext.ringDb, -Infinity);
  });
  it('the phone never gets more than the protective ceiling', () => {
    const b = { ...eventBooth({ pos: 'FLOOR', gain1: 1, level: 1 }), listen: 1 };
    const r = renderEvent(b, 0, 2, null);
    let pk = 0;
    for (const x of r.playback.l) pk = Math.max(pk, Math.abs(x));
    assert.ok(pk <= Math.pow(10, -1 / 20) + 1e-6);
  });
});

describe('coverage — real physics, stated simply', () => {
  it('a 90° top is −6 dB at 45° off axis, −24 dB at 90°, and lower behind', () => {
    assert.ok(Math.abs(topDirectivityDb(45, 90) + 6) < 1e-9);
    assert.ok(Math.abs(topDirectivityDb(90, 90) + 24) < 1e-9);
    assert.ok(topDirectivityDb(180, 90) < -24);
    assert.ok(topDirectivityDb(60, 90) < -6, 'falls steeply outside the nominal angle');
  });
  it('a sub is near-omni: about −6 dB straight behind', () => {
    assert.ok(Math.abs(subDirectivityDb(0)) < 1e-9);
    assert.ok(Math.abs(subDirectivityDb(180) + 6.02) < 0.05);
  });
  it('inverse square: twice the distance, 6 dB less', () => {
    const s = PLACEMENTS.CORNERS.tops.L;
    const a = relLevelDb(s, { x: s.at.x + (s.aim.x - s.at.x) * 0.25, y: s.at.y + (s.aim.y - s.at.y) * 0.25 });
    const b = relLevelDb(s, { x: s.at.x + (s.aim.x - s.at.x) * 0.5, y: s.at.y + (s.aim.y - s.at.y) * 0.5 });
    assert.ok(Math.abs(a - b - 6.02) < 0.05);
  });
  it('a cardioid: 0 dB in front, −6 dB at the side, its rear null floored', () => {
    assert.ok(Math.abs(cardioidDb(0)) < 1e-9);
    assert.ok(Math.abs(cardioidDb(90) + 6.02) < 0.05);
    assert.equal(cardioidDb(180), -25);
  });
  it('the placements: corners aimed in — no hole, decks ≥ 8 dB below the floor; straight leaves a hole; behind the DJ is the loudest seat', () => {
    const at = (p: keyof typeof PLACEMENTS, v: { x: number; y: number }) => topsDbaAt(v, p, -20);
    const front = { x: 0, y: 4.2 };
    assert.ok(at('CORNERS', front) - at('CORNERS', ROOM.floorCentre) >= -6);
    assert.ok(at('CORNERS', ROOM.dj) - at('CORNERS', ROOM.floorCentre) <= -8);
    assert.ok(at('STRAIGHT', front) - at('STRAIGHT', ROOM.floorCentre) < -6, 'a hole in front');
    assert.ok(at('BEHIND', ROOM.dj) > at('BEHIND', ROOM.floorCentre), 'the DJ in the beam');
  });
  it('the booth monitors are aimed at the DJ', () => {
    assert.ok(monitorsDbaAt(ROOM.dj, -20) > monitorsDbaAt({ x: 0, y: 3 }, -20) + 6);
  });
});

describe('the venue — handoff, crossover, summing', () => {
  it('a balanced, labelled L / R handoff; a swap is caught', () => {
    assert.equal(venueHandoffOk({ ...freshVenue(), djL: 'MST_L', djR: 'MST_R', cable: 'XLR' }), true);
    assert.equal(venueHandoffOk({ ...freshVenue(), djL: 'MST_L', djR: 'MST_R', cable: 'UNBAL' }), false);
    assert.equal(venueSwapped({ ...freshVenue(), djL: 'MST_R', djR: 'MST_L' }), true);
  });
  it('the crossover (LR4, 100 Hz) sums flat; without it the roll-offs overlap', () => {
    for (const f of [40, 70, 100, 150, 300, 1000]) assert.ok(Math.abs(xoverResp(f, true, true).sum) < 0.15, `${f} Hz`);
    const off = Math.max(...[60, 80, 100, 130, 160].map((f) => xoverResp(f, false, true).sum));
    assert.ok(off > 1, `bulge ${off}`);
    assert.ok(xoverResp(100, true, true).tops < -5.9 && xoverResp(100, true, true).tops > -6.1, 'each side −6 dB at the crossover');
  });
  it('in the render, the room hears the venue system only once DJ L and DJ R are fed, and an unbalanced run hums', () => {
    let b = eventBooth({ on: false });
    b = connect(connect(b, 'mst.xlrL', null)!, 'mst.xlrR', null)!;
    b = withVenue(b, { on: true });
    assert.ok(renderEvent(b, 0, 1.5, null).rmsDb.crowd < -80, 'nothing patched');
    const fed = withVenue(b, { djL: 'MST_L', djR: 'MST_R' });
    const r = renderEvent(fed, 0, 1.5, null);
    assert.ok(r.rmsDb.crowd > -40, `fed ${r.rmsDb.crowd}`);
    assert.equal(r.ext.hum.crowd, false);
    assert.equal(renderEvent(withVenue(fed, { cable: 'UNBAL' }), 0, 1.5, null).ext.hum.crowd, true);
  });
  it('the engineer’s gain moves the room, not the MASTER meters', () => {
    let b = eventBooth({ on: false });
    b = withVenue(connect(connect(b, 'mst.xlrL', null)!, 'mst.xlrR', null)!, { on: true, djL: 'MST_L', djR: 'MST_R' });
    const a = renderEvent(b, 0, 1.5, null);
    const c = renderEvent(withVenue(b, { gainDb: 6 }), 0, 1.5, null);
    assert.ok(Math.abs(c.ext.feedRms.venue - a.ext.feedRms.venue - 6) < 0.3);
    assert.ok(Math.abs(c.rmsDb.masterL - a.rmsDb.masterL) < 0.01);
  });
});

describe('turntable acoustic feedback (a different loop)', () => {
  it('subs under the tops leave margin; under the booth it howls; isolation feet rescue it', () => {
    const v = freshVenue();
    assert.ok(turntableMarginDb({ ...v, subPos: 'TOPS' }) >= 5);
    assert.ok(turntableMarginDb({ ...v, subPos: 'BOOTH' }) < 0);
    assert.ok(turntableMarginDb({ ...v, subPos: 'BOOTH', ttIso: true }) >= 6);
    assert.equal(turntableMarginDb({ ...v, subs: false }), Infinity);
  });
});

describe('the mixer rear’s extra sockets', () => {
  it('sit on the panel and clear every Stage 1 socket', () => {
    const pts = Object.values(MIXER_REAR_EXTRA).map((e) => ({ x: e.x, y: e.y }));
    for (const p of pts) assert.ok(p.x > 0 && p.x < REAR.w && p.y > 0 && p.y < REAR.h, JSON.stringify(p));
    for (const p of pts) for (const j of Object.values(MIXER_REAR_JACKS)) assert.ok(Math.hypot(p.x - j.x, p.y - j.y) >= 12, `${JSON.stringify(p)} vs ${JSON.stringify(j)}`);
  });
});
