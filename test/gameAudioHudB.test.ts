/**
 * Game Audio lab — the instrument strips of hudB (output, wall, music,
 * lines): the pure selectors behind them (scene/hud/bModel.ts), proven on
 * states built with the model's own reducer. What a strip draws is one of
 * these numbers, so a strip that moved without the model would fail here.
 *
 *   output  left and right from the model's pan; the mono fold; ahead = behind
 *   wall    the true second-order low-pass; the model's own corner and send;
 *           the tail is the real impulse
 *   music   the play line from the clock; a marker on the boundary it lands on
 *   lines   a bar as long as the file; the cut, the refusal
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GA_LINES } from '../src/screens/lab/gameaudio/model/gaDefs.ts';
import { gaInitial, gaMusicWait, gaOutputLR, gaReduce, gaVoiceOut, listenerOf, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { OBSTRUCTED, gainDb, panGains, stereoPan } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { GA_LISTENING } from '../src/screens/lab/gameaudio/pages/data/gaPlatforms.ts';
import { gaSound, gaSoundSeconds } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';
import { MUSIC_BAR_S, MUSIC_BEAT_S, MUSIC_LOOP_S } from '../src/screens/lab/gameaudio/sounds/gaSynth.ts';
import {
  B_BEATS,
  B_CURVE_BOTTOM_DB,
  B_CURVE_TOP_DB,
  B_F_TICKS,
  B_LISTENING,
  bApplied,
  bBeatStep01,
  bChange,
  bCurveY,
  bDbWord,
  bEars,
  bFill01,
  bFreqAt,
  bFreqX,
  bGhostAt,
  bIrEnvelope,
  bLand01,
  bLandAt,
  bLanes,
  bLineRows,
  bLinesAxisS,
  bListening,
  bLowpassDb,
  bOutputWords,
  bPlay01,
  bRampsUntil,
  bReverbWord,
  bStingers,
  bTrack,
  bTrackInit,
  bTreatment,
  bTreatmentDb,
  type BMemo,
} from '../src/screens/lab/gameaudio/scene/hud/bModel.ts';

/** Run actions at given scene times; the tracker sees every change, as the
 *  store feeds it. */
function run(start: GaState, steps: [number, GaAction][], memo?: BMemo): { s: GaState; m: BMemo } {
  let s = start;
  let m = memo ?? bTrackInit(s);
  for (const [t, a] of steps) {
    const next = gaReduce(s, a, t).state;
    m = bTrack(m, s, next);
    s = next;
  }
  return { s, m };
}
const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} is not within ${eps} of ${b}`);

/* ── output ─────────────────────────────────────────────────────────────── */

describe('hudB output: what reaches each ear', () => {
  const fountainOn = (facing: number, more: GaAction[] = []): GaState => run(gaInitial(), [[1, { type: 'scene', on: true }], [2, { type: 'face', who: 'player', facing }], ...more.map((a, i): [number, GaAction] => [3 + i, a])]).s;

  it('nothing positioned playing: no source, both bars empty', () => {
    const e = bEars(gaInitial());
    assert.equal(e.sources.length, 0);
    assert.equal(e.l, 0);
    assert.equal(e.r, 0);
    assert.equal(bOutputWords(e)[1], 'NO POSITIONED SOUND IS PLAYING');
  });

  it('STEREO: the two levels are the model’s pan through the engine’s pan law, as YOU turn', () => {
    let leftSeen = false;
    let rightSeen = false;
    for (let facing = 0; facing < 360; facing += 15) {
      const s = fountainOn(facing);
      const e = bEars(s);
      assert.equal(e.mode, 'stereo');
      assert.equal(e.sources.length, 1);
      const src = e.sources[0];
      assert.equal(src.name, 'FOUNTAIN');
      near(src.pan, stereoPan(listenerOf(s), { x: 3.0, y: 2.1 }), 1e-12);
      const law = panGains(src.pan);
      near(e.l, src.gain * law.l, 1e-9);
      near(e.r, src.gain * law.r, 1e-9);
      // the model's own read-out of that voice, nothing else
      const v = s.voices.find((x) => x.asset === 'fountain');
      assert.ok(v);
      near(e.l, gaVoiceOut(s, v).l, 1e-12);
      near(e.r, gaVoiceOut(s, v).r, 1e-12);
      // the sound slides between the bars: more to the left ear when it is on the left
      if (src.pan < -0.05) {
        assert.ok(e.l > e.r);
        leftSeen = true;
      }
      if (src.pan > 0.05) {
        assert.ok(e.r > e.l);
        rightSeen = true;
      }
    }
    assert.ok(leftSeen && rightSeen);
  });

  it('the bars are the POSITIONED sounds: what they leave out of the whole mix is the same in both ears', () => {
    let spread = 0;
    for (let facing = 0; facing < 360; facing += 15) {
      for (const more of [[], [{ type: 'pan', mode: 'hrtf' }], [{ type: 'mono', on: true }]] as GaAction[][]) {
        const s = fountainOn(facing, more);
        const whole = gaOutputLR(s);
        const e = bEars(s);
        assert.equal(whole.mode, e.mode);
        // whole = positioned + an unpositioned part; that part is equal left and right
        const restL = whole.l ** 2 - e.l ** 2;
        const restR = whole.r ** 2 - e.r ** 2;
        assert.ok(restL >= -1e-12 && restR >= -1e-12);
        near(restL, restR, 1e-12);
        if (!more.length) spread = Math.max(spread, Math.abs(e.lDb - e.rDb));
      }
    }
    // turning moves the fountain between the ears by far more than the whole mix shows
    assert.ok(spread > 12, `the positioned bars differ by only ${spread.toFixed(1)} dB as YOU turn`);
  });

  it('STEREO: a source ahead and the same source behind give the same two levels', () => {
    // the fountain is north-west of the start: find its bearing, then face it and face away
    const s0 = fountainOn(0);
    const toward = (Math.atan2(3.0 - s0.chars.player.x, -(2.1 - s0.chars.player.y)) * 180) / Math.PI;
    const ahead = bEars(fountainOn((toward + 360) % 360));
    const behind = bEars(fountainOn((toward + 180 + 360) % 360));
    near(Math.abs(ahead.sources[0].bearingDeg), 0, 1e-6);
    near(Math.abs(behind.sources[0].bearingDeg), 180, 1e-6);
    near(ahead.l, behind.l, 1e-9);
    near(ahead.r, behind.r, 1e-9);
    near(ahead.l, ahead.r, 1e-9);
    // … and 40 degrees off the nose, front and back, are a mirror pair too
    const a = bEars(fountainOn((toward - 40 + 360) % 360));
    const b = bEars(fountainOn((toward - 140 + 360) % 360));
    near(a.l, b.l, 1e-9);
    near(a.r, b.r, 1e-9);
  });

  it('MONO: left equals right at every facing, and it is the fold of the stereo pair', () => {
    for (let facing = 0; facing < 360; facing += 15) {
      const stereo = bEars(fountainOn(facing));
      const mono = bEars(fountainOn(facing, [{ type: 'mono', on: true }]));
      assert.equal(mono.mode, 'mono');
      assert.equal(mono.l, mono.r);
      near(mono.l, (stereo.l + stereo.r) / 2, 1e-9);
      assert.ok(mono.l > 0);
    }
    // mono over the 3D renderer is still one signal
    for (const facing of [0, 90, 200]) {
      const e = bEars(fountainOn(facing, [{ type: 'pan', mode: 'hrtf' }, { type: 'mono', on: true }]));
      assert.equal(e.l, e.r);
    }
  });

  it('HEADPHONE 3D: ahead and behind are different places; the levels are marked as level only', () => {
    const s0 = fountainOn(0);
    const toward = (Math.atan2(3.0 - s0.chars.player.x, -(2.1 - s0.chars.player.y)) * 180) / Math.PI;
    const ahead = bEars(fountainOn((toward + 360) % 360, [{ type: 'pan', mode: 'hrtf' }]));
    const behind = bEars(fountainOn((toward + 180 + 360) % 360, [{ type: 'pan', mode: 'hrtf' }]));
    assert.equal(ahead.mode, 'hrtf');
    assert.ok(ahead.levelOnly && behind.levelOnly);
    assert.ok(!bEars(fountainOn(0)).levelOnly);
    assert.match(bOutputWords(ahead)[0], /AHEAD$/);
    assert.match(bOutputWords(behind)[0], /BEHIND$/);
    assert.equal(bOutputWords(ahead)[1], 'ESTIMATED: LEVEL IS NOT ALL');
  });

  it('the level is the model’s: distance, the bus and the lab LEVEL all move the bars', () => {
    const base = bEars(fountainOn(90));
    // the lab LEVEL ramps in the model: the bars follow the ramp, and land on it
    const q = fountainOn(90, [{ type: 'master', value: 0.35 }]);
    assert.ok(bRampsUntil(q) > q.t);
    near(bEars(q, bRampsUntil(q) + 0.01).l / base.l, 0.5, 1e-9);
    assert.ok(bEars(q, q.t).l >= bEars(q, bRampsUntil(q) + 0.01).l);
    const bs = fountainOn(90, [{ type: 'bus', bus: 'ambience', db: -6 }]);
    const bus = bEars(bs, Math.max(bs.t, bRampsUntil(bs)) + 0.01);
    near(gainDb(bus.l) - gainDb(base.l), -6, 1e-6);
    const ms = fountainOn(90, [{ type: 'bus', bus: 'ambience', mute: true }]);
    assert.equal(bEars(ms, Math.max(ms.t, bRampsUntil(ms)) + 0.01).sources.length, 0);
    const far = bEars(fountainOn(90, [{ type: 'move', who: 'player', x: 8.4, y: 8.8 }]));
    assert.ok(far.sources.length === 0 || far.l < base.l);
  });

  it('a level reads in words below the window', () => {
    assert.equal(bDbWord(-12.34), '−12.3 dB');
    assert.equal(bDbWord(0), '0.0 dB');
    assert.equal(bDbWord(-120), 'SILENT');
  });

  it('page 3: every listening setup of the data file has a picture, and adds no number', () => {
    for (const l of GA_LISTENING) {
      const b = bListening(l.id);
      assert.ok(b, `no strip for ${l.id}`);
      assert.equal(b.title, l.label);
      assert.doesNotMatch(`${b.lines[0]} ${b.lines[1]}`, /\d/);
    }
    assert.equal(Object.keys(B_LISTENING).length, GA_LISTENING.length);
    assert.equal(bListening(undefined), null);
    assert.equal(bListening('pick'), null);
  });
});

/* ── wall ───────────────────────────────────────────────────────────────── */

describe('hudB wall: the filter, the level, the reverb', () => {
  it('the low-pass is the true second-order magnitude: −3 dB at its corner, 12 dB per octave far above', () => {
    near(bLowpassDb(900, 900), -3.0103, 1e-3);
    near(bLowpassDb(1, 900), 0, 1e-3);
    assert.ok(bLowpassDb(450, 900) > -0.3);
    // far above the corner each octave costs 12 dB (40 dB per decade)
    near(bLowpassDb(7200, 900) - bLowpassDb(14400, 900), 12.04, 0.02);
    near(bLowpassDb(9000, 900), -40, 0.01);
    // it never rises above 0 dB: no peak at the corner
    for (let f = 50; f < 16000; f *= 1.1) assert.ok(bLowpassDb(f, 900) <= 1e-9);
  });

  it('the frequency axis is logarithmic and its ticks are 100 Hz, 1 kHz, 10 kHz', () => {
    assert.deepEqual([...B_F_TICKS], [100, 1000, 10000]);
    near(bFreqX(1000) - bFreqX(100), bFreqX(10000) - bFreqX(1000), 1e-12);
    near(bFreqAt(bFreqX(900)), 900, 1e-6);
    assert.ok(bCurveY(B_CURVE_TOP_DB) === 0 && bCurveY(B_CURVE_BOTTOM_DB) === 1);
  });

  const genOn: [number, GaAction] = [1, { type: 'machine', id: 'generator-1', on: true }];

  it('nothing in the way: flat at 0 dB across the axis', () => {
    const { s } = run(gaInitial(), [genOn, [2, { type: 'door' }]]);
    const t = bTreatment(s);
    assert.ok(t.playing && !t.obstructed);
    assert.equal(t.wallDb, 0);
    for (const f of [100, 1000, 10000]) assert.ok(Math.abs(bTreatmentDb(t, f)) < 0.3, `not flat at ${f} Hz`);
  });

  it('through the closed door: the model’s own level change and corner', () => {
    const { s } = run(gaInitial(), [genOn]);
    const t = bTreatment(s);
    assert.ok(t.playing && t.obstructed);
    near(t.wallDb, gainDb(OBSTRUCTED.gain), 1e-9);
    assert.equal(t.lowpassHz, OBSTRUCTED.lowpassHz);
    // the curve at the corner: the wall's level change and 3 dB more
    near(bTreatmentDb(t, t.lowpassHz), t.wallDb - 3.0103, 1e-3);
    // low down only the level change is left
    near(bTreatmentDb(t, 60), t.wallDb, 0.01);
  });

  it('not playing: the treatment that WOULD apply, marked as such', () => {
    const t = bTreatment(gaInitial());
    assert.equal(t.playing, false);
    assert.ok(t.obstructed);
    assert.equal(t.lowpassHz, OBSTRUCTED.lowpassHz);
    const open = bTreatment(run(gaInitial(), [[1, { type: 'door' }]]).s);
    assert.equal(open.playing, false);
    assert.equal(open.wallDb, 0);
  });

  it('the reverb send is the model’s: off when DRY, stronger from inside the room', () => {
    const outside = bTreatment(run(gaInitial(), [genOn]).s);
    assert.ok(outside.reverbOn && outside.send > 0 && !outside.listenerInside);
    const dry = bTreatment(run(gaInitial(), [genOn, [2, { type: 'option', patch: { reverb: false } }]]).s);
    assert.equal(dry.send, 0);
    assert.equal(dry.reverbOn, false);
    const inside = bTreatment(run(gaInitial(), [genOn, [2, { type: 'door' }], [3, { type: 'move', who: 'player', x: 11, y: 5 }]]).s);
    assert.ok(inside.listenerInside && inside.playing);
    assert.ok(inside.send > outside.send, 'the send is not stronger inside');
    // the same numbers the model sends the engine
    const cmds = gaReduce({ ...run(gaInitial(), [genOn]).s, soundOn: true }, { type: 'face', who: 'player', facing: 91 }).cmds;
    const set = cmds.find((c) => c.t === 'set' && c.rev != null);
    assert.ok(set && set.t === 'set');
    assert.equal(outside.send, set.rev);
    assert.equal(outside.lowpassHz, set.lowpass);
    // not playing: the send it WOULD get is the same number
    const off = bTreatment(gaInitial());
    assert.equal(off.playing, false);
    assert.equal(off.send, outside.send);
    // a source that is not in the room does not feed it
    const fountain = bTreatment(run(gaInitial(), [[1, { type: 'scene', on: true }]]).s, 'fountain');
    assert.equal(fountain.send, 0);
    assert.equal(bReverbWord(fountain), 'NOT IN THE ROOM');
    assert.equal(bReverbWord(dry), 'DRY: NOTHING SENT');
    assert.equal(bReverbWord(outside), null);
    assert.equal(bReverbWord(bTreatment({ ...run(gaInitial(), [genOn]).s, reverbAvailable: false })), 'REVERB NOT AVAILABLE');
  });

  it('the tail is the real impulse: each column holds that column’s lowest and highest sample', () => {
    const ir = gaSound('ir_room');
    assert.ok(ir);
    const cols = 120;
    const env = bIrEnvelope(cols);
    near(env.seconds, ir.ch[0].length / ir.sr, 1e-9);
    const len = ir.ch[0].length;
    let peak = 0;
    for (const c of [0, 1, 7, 33, 60, 119]) {
      const a = Math.floor((c * len) / cols);
      const b = Math.floor(((c + 1) * len) / cols);
      let lo = Infinity;
      let hi = -Infinity;
      for (const ch of ir.ch) for (let i = a; i < b; i++) (lo = Math.min(lo, ch[i])), (hi = Math.max(hi, ch[i]));
      near(env.min[c], lo, 1e-7);
      near(env.max[c], hi, 1e-7);
    }
    for (const ch of ir.ch) for (const x of ch) peak = Math.max(peak, Math.abs(x));
    near(env.peak, peak, 1e-7);
    // it decays: the last tenth is far below the first tenth
    const span = (from: number, to: number) => Math.max(...Array.from(env.max.subarray(from, to)), ...Array.from(env.min.subarray(from, to)).map((x) => -x));
    assert.ok(span(108, 120) < span(0, 12) * 0.1);
  });
});

/* ── music ──────────────────────────────────────────────────────────────── */

describe('hudB music: the play line and the marker', () => {
  const T0 = 100;
  const started = (more: [number, GaAction][] = []) => run(gaInitial(), [[T0, { type: 'musicStart' }], ...more]);

  it('the play line is the model’s clock at the music’s tempo', () => {
    const { s } = started();
    assert.equal(s.music.t0, T0);
    near(bPlay01(s, T0), 0);
    near(bPlay01(s, T0 + MUSIC_BEAT_S), 1 / B_BEATS);
    near(bPlay01(s, T0 + MUSIC_BAR_S), 0.25);
    near(bPlay01(s, T0 + MUSIC_LOOP_S * 0.5), 0.5);
    near(bPlay01(s, T0 + MUSIC_LOOP_S * 3 + 2.5), 0.25);
    assert.equal(bPlay01(gaInitial(), 55), 0);
  });

  it('with motion reduced it steps once per beat', () => {
    near(bBeatStep01(0.26), 4 / B_BEATS);
    near(bBeatStep01(0.3124), 4 / B_BEATS);
    near(bBeatStep01(0.3126), 5 / B_BEATS);
  });

  it('a change lands where the model says it waits until', () => {
    const { s } = started();
    for (const b of ['beat', 'bar', 'phrase'] as const) {
      for (const dt of [0.1, 0.7, 2.4, 2.5, 6.123, 9.99, 13.3]) {
        const at = { ...s, t: T0 + dt };
        near(bLandAt(s, T0 + dt, b), at.t + gaMusicWait(at, b), 1e-9);
      }
    }
    assert.equal(bLandAt(s, T0 + 3.3, 'now'), T0 + 3.3);
    // asked 0.01 s before a beat: too close for the engine, so the NEXT beat (the margin)
    near(bLandAt(s, T0 + 10 * MUSIC_BEAT_S - 0.01, 'beat'), T0 + 11 * MUSIC_BEAT_S, 1e-9);
  });

  it('the marker sits on the next beat, the next bar, the phrase end, or the play line', () => {
    // asked 3.0 s into the phrase (bar 2, between its beats 1 and 2)
    const { s } = started();
    const ask = T0 + 3.0;
    near(bLand01(T0, bLandAt(s, ask, 'beat')), 5 / B_BEATS); // 3.125 s
    near(bLand01(T0, bLandAt(s, ask, 'bar')), 0.5); // 5.0 s: the third bar line
    near(bLand01(T0, bLandAt(s, ask, 'phrase')), 1); // the right edge, never the left
    near(bLand01(T0, bLandAt(s, ask, 'now')), 0.3); // on the play line itself
    // the last bar's change lands on the phrase end: the right edge
    near(bLand01(T0, bLandAt(s, T0 + 8.1, 'bar')), 1);
  });

  it('the marker is the model’s own landing time, never a second copy', () => {
    for (const b of ['beat', 'bar', 'phrase'] as const) {
      for (const dt of [0.3, 2.47, 4.99, 9.95]) {
        const { s } = started([[T0 + 0.1, { type: 'option', patch: { musicBoundary: b } }], [T0 + dt, { type: 'musicLayer', layer: 'pulse', on: true }]]);
        const c = bChange(s, T0 + dt);
        assert.ok(c && s.music.pending);
        assert.equal(c.landAt, s.music.pending.due);
        assert.ok(c.landAt - (T0 + dt) >= 0.06 - 1e-9);
      }
    }
    // a stinger's flag: the model's own wait (the margin and the lead before its hit)
    const st = started([[T0 + 4.9, { type: 'stinger' }]]);
    const flag = bStingers(st.s, T0 + 4.9)[0];
    assert.equal(flag.landAt, st.s.music.stinger!.due);
    near(flag.landAt, T0 + 7.5, 1e-9); // 5.0 s was only 0.1 s away: too close for the lead
  });

  it('a waiting change is on its line, its lane waits, and both clear when the model applies it', () => {
    const { s, m } = started([[T0 + 3, { type: 'musicLayer', layer: 'pulse', on: true }]]);
    const c = bChange(s, T0 + 3.4);
    assert.ok(s.music.pending && c);
    assert.equal(c.boundary, 'bar');
    assert.equal(c.rides, false);
    near(c.landAt, T0 + 5);
    near(bLand01(s.music.t0, c.landAt), 0.5);
    // the lane: asked for, not yet sounding
    assert.deepEqual(bLanes(s).map((l) => [l.layer, l.sounding, l.waiting]), [['calm', true, null], ['pulse', false, 'in'], ['drive', false, null]]);
    assert.equal(bApplied(s).pulse, false);
    // the store reports it applied at the boundary
    const done = run(s, [[T0 + 5, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.pending.req, at: 0 } }]], m);
    assert.equal(bChange(done.s, T0 + 5), null);
    assert.deepEqual(bLanes(done.s).map((l) => [l.sounding, l.waiting]), [[true, null], [true, null], [false, null]]);
    // ... and a layer that waits to go OUT still sounds until its line
    const out = run(done.s, [[T0 + 6, { type: 'musicLayer', layer: 'pulse', on: false }]], done.m);
    assert.deepEqual(bLanes(out.s)[1], { layer: 'pulse', name: 'PULSE', sounding: true, waiting: 'out' });
    near(bChange(out.s, T0 + 6)!.landAt, T0 + 7.5);
  });

  it('CHANGE AT moves where a new marker goes, and where the hollow one stands', () => {
    const phrase = started([[T0 + 1, { type: 'option', patch: { musicBoundary: 'phrase' } }]]);
    near(bLand01(T0, bGhostAt(phrase.s, T0 + 3)), 1);
    const p2 = run(phrase.s, [[T0 + 3, { type: 'musicLayer', layer: 'drive', on: true }]], phrase.m);
    near(bChange(p2.s, T0 + 3)!.landAt, T0 + MUSIC_LOOP_S);
    const beat = started([[T0 + 1, { type: 'option', patch: { musicBoundary: 'beat' } }]]);
    near(bLand01(T0, bGhostAt(beat.s, T0 + 3)), 5 / B_BEATS);
    near(bLand01(T0, bGhostAt(beat.s, T0 + 3.2)), 6 / B_BEATS); // it hops with the beat
    const b2 = run(beat.s, [[T0 + 3, { type: 'musicLayer', layer: 'drive', on: true }]], beat.m);
    near(bChange(b2.s, T0 + 3)!.landAt, T0 + 5 * MUSIC_BEAT_S);
    // NOW, unheard: applied in the same moment, nothing waits
    const now = started([[T0 + 1, { type: 'option', patch: { musicBoundary: 'now' } }], [T0 + 3, { type: 'musicLayer', layer: 'drive', on: true }]]);
    assert.equal(bChange(now.s, T0 + 3), null);
    assert.equal(bApplied(now.s).drive, true);
    near(bGhostAt(now.s, T0 + 4.4), T0 + 4.4); // the hollow marker rides the play line
  });

  it('a change of mind back to what sounds: the first marker is kept as WITHDRAWN, and nothing new waits', () => {
    const { s, m } = started([
      [T0 + 0.5, { type: 'option', patch: { musicBoundary: 'phrase' } }],
      [T0 + 1, { type: 'mood', mood: 'alert' }],
      [T0 + 2, { type: 'option', patch: { musicBoundary: 'bar' } }],
      [T0 + 4, { type: 'mood', mood: 'calm' }],
    ]);
    assert.ok(m.withdrawn);
    near(m.withdrawn.landAt, T0 + MUSIC_LOOP_S); // where the first one WOULD have landed
    near(m.withdrawn.at, T0 + 4);
    // GF1 B-14: CALM is what sounds, so the model queues nothing: no marker on the line
    assert.equal(bChange(s, T0 + 4), null);
    assert.equal(s.music.pending, null);
    // and no lane is dashed
    assert.ok(bLanes(s).every((l) => l.waiting === null));
  });

  it('a stinger is flagged on the line its hit lands on, then on the line it began at', () => {
    const { s, m } = started([[T0 + 3, { type: 'stinger' }]]);
    const w = bStingers(s, T0 + 3.5);
    assert.equal(w.length, 1);
    assert.equal(w[0].sounding, false);
    near(w[0].landAt, T0 + 5);
    const begun = run(s, [[T0 + 5, { type: 'engine', evt: { e: 'music', what: 'applied', req: s.music.stinger!.req, at: 0 } }]], m);
    const b = bStingers(begun.s, T0 + 5.5);
    assert.deepEqual(b.map((x) => [x.sounding, x.landAt]), [[true, T0 + 5]]);
  });

  it('stopping the music clears every mark', () => {
    const { m, s } = started([
      [T0 + 1, { type: 'mood', mood: 'alert' }],
      [T0 + 1.5, { type: 'mood', mood: 'calm' }],
      [T0 + 2, { type: 'stinger' }],
      [T0 + 2.2, { type: 'musicStop' }],
    ]);
    assert.equal(s.music.on, false);
    assert.equal(bChange(s, T0 + 3), null);
    assert.equal(m.withdrawn, null);
    assert.equal(bStingers(s, T0 + 3).length, 0);
    assert.ok(bLanes(s).every((l) => !l.sounding && l.waiting === null));
  });

  it('with sound on the marker and the play line follow the engine’s own answer', () => {
    const on = run(gaInitial(), [[1, { type: 'sound', on: true }], [T0, { type: 'musicStart' }], [T0 + 3, { type: 'musicLayer', layer: 'pulse', on: true }]]);
    assert.ok(on.s.music.pending && on.s.music.pending.inS == null);
    // before the engine answers: the next bar line of the model's clock
    const before = bChange(on.s, T0 + 3.01);
    assert.ok(before);
    near(bLand01(on.s.music.t0, before.landAt), 0.5, 1e-9);
    // the engine answers: 2.1 s to its own bar line
    const ans = run(on.s, [[T0 + 3.02, { type: 'engine', evt: { e: 'music', what: 'queued', req: on.s.music.pending.req, at: 0, inS: 2.1, boundary: 'bar' } }]], on.m);
    const after = bChange(ans.s, T0 + 3.1);
    assert.ok(after);
    near(after.landAt, T0 + 5.12, 1e-9);
    // the marker is still ON a bar line, and the play line meets it there
    near(bLand01(ans.s.music.t0, after.landAt), 0.5, 1e-9);
    near(bPlay01(ans.s, after.landAt), 0.5, 1e-9);
  });
});

/* ── lines ──────────────────────────────────────────────────────────────── */

describe('hudB lines: one line at a time, one file per language', () => {
  const greet: GaAction = { type: 'post', event: 'vo_greeting', owner: 'guide' };
  const warn: GaAction = { type: 'post', event: 'vo_warning', owner: 'guide' };

  it('each row is as long as its file, and a Spanish take’s bar is longer than the English one', () => {
    const en = bLineRows(gaInitial());
    const es = bLineRows(run(gaInitial(), [[1, { type: 'option', patch: { language: 'es' } }]]).s);
    assert.deepEqual(en.map((r) => r.name), ['GREETING', 'WARNING']);
    for (let i = 0; i < en.length; i++) {
      assert.equal(en[i].lang, 'en');
      assert.equal(es[i].lang, 'es');
      near(en[i].seconds, gaSoundSeconds(GA_LINES[en[i].id].en.asset));
      near(es[i].seconds, gaSoundSeconds(GA_LINES[es[i].id].es.asset));
      assert.ok(es[i].seconds > en[i].seconds + 0.2, `${en[i].name}: the Spanish bar is not longer`);
      assert.notEqual(en[i].file, es[i].file);
      assert.ok(bLinesAxisS() >= es[i].seconds);
    }
    // the more important line has the higher number
    assert.ok(en[1].priority > en[0].priority);
  });

  it('the speaking row fills over the take’s real length, from its own start', () => {
    const { s } = run(gaInitial(), [[10, greet]]);
    const row = bLineRows(s)[0];
    assert.equal(row.born, 10);
    near(bFill01(row.born!, row.seconds, 10), 0);
    near(bFill01(row.born!, row.seconds, 10 + row.seconds / 2), 0.5);
    near(bFill01(row.born!, row.seconds, 10 + row.seconds + 3), 1);
    assert.equal(bLineRows(s)[1].born, null);
  });

  it('a line that speaks keeps its own file when LANGUAGE changes under it', () => {
    const { s } = run(gaInitial(), [[10, greet], [10.5, { type: 'option', patch: { language: 'es' } }]]);
    const [g, w] = bLineRows(s);
    assert.equal(g.lang, 'en');
    assert.equal(w.lang, 'es');
  });

  it('an interruption stops the cut line where it was', () => {
    const { s, m } = run(gaInitial(), [[10, greet], [11.2, warn]]);
    assert.ok(m.cut);
    assert.equal(m.cut.id, 'vo_greeting');
    near(m.cut.frac * m.cut.seconds, 1.2, 1e-9);
    const [g, w] = bLineRows(s);
    assert.equal(g.born, null);
    assert.equal(w.born, 11.2);
    // playing the greeting again clears its old mark
    const again = run(s, [[20, { type: 'expire', v: s.voices[0].v }], [21, greet]], m);
    assert.equal(again.m.cut, null);
  });

  it('a refused request and an ignored one are marked on the row that was asked for', () => {
    const refused = run(gaInitial(), [[10, warn], [10.4, greet]]);
    assert.deepEqual(refused.m.refusal, { id: 'vo_greeting', at: 10.4, why: 'refused' });
    assert.equal(bLineRows(refused.s)[0].born, null);
    const ignored = run(gaInitial(), [[10, greet], [10.4, greet]]);
    assert.deepEqual(ignored.m.refusal, { id: 'vo_greeting', at: 10.4, why: 'ignored' });
    assert.equal(bLineRows(ignored.s)[0].born, 10);
  });

  it('a new scene clock starts the tracker clean', () => {
    const { s, m } = run(gaInitial(), [[10, warn], [10.4, greet]]);
    const fresh = bTrack(m, s, gaInitial());
    assert.equal(fresh.refusal, null);
    assert.equal(fresh.cut, null);
  });
});
