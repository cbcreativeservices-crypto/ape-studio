/**
 * DJ Systems Lab — STAGE 2 engine and models (screens 13–18).
 *
 * Pins, against the real render (engine/djRender + engine/djStage2):
 *   EFFECTS   echo timing in beats and its feedback; the dry/wet law; a
 *             channel insert after the fader (an echo-out rings on, the cue
 *             stays dry); MASTER takes both decks; SEND leaves the dry
 *             untouched; FX OFF lets the tail ring out; a re-render inside a
 *             chunk continues the tail exactly; a RETURN LOOP builds but is
 *             held safe (the unit's ceiling, the quieter listen level).
 *   KEY       12·log2(rate) semitones; key lock keeps the pitch (a real
 *             WSOLA stretch: a sine keeps its frequency, beeps keep the new
 *             tempo); key shift; the speed plan's tempo = stretch × pitch.
 *   STEMS     the original stems sum to the track; the simulated separation
 *             still sums to it; the leakage columns sum to 1; a muted melody
 *             is gone from the original and leaves a ghost in the separation.
 *   LAPTOP    buffer, latency, the workload model's stable buffer; dropouts
 *             are deterministic, fall with the buffer, and are real gaps in
 *             the USB audio; device selection and output assignment route it.
 *   VINYL     balance → zero → set; anti-skate and the groove walls; the
 *             ground hum; the acoustic loop's gain and its safe howl.
 *   DVS       the control tone, its quality and lock; ABSOLUTE / RELATIVE /
 *             INTERNAL follow; the tone on a speaker (and its safety trim).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SR, linToDb } from '../src/screens/lab/dj/engine/djDsp.ts';
import { anchorAt, builtBooth, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { carryAt, renderBooth, clearDeckCache } from '../src/screens/lab/dj/engine/djRender.ts';
import { setPlaying } from '../src/screens/lab/dj/model/djDeck.ts';
import { trackWindow, TRACKS, assembleRaw, STEM_IDS } from '../src/screens/lab/dj/engine/djMusic.ts';
import { dryWet, freshFx, fxTimeSec, FX_TIMES, LOOP_SAFE_CEILING, LOOP_SAFETY_DB, type FxState } from '../src/screens/lab/dj/model/djEffects.ts';
import { freshFxCarry, fxProcess } from '../src/screens/lab/dj/engine/djFx.ts';
import { keyRelation, keyWords, playedSemis, speedPlan } from '../src/screens/lab/dj/model/djKey.ts';
import { speedChain } from '../src/screens/lab/dj/engine/djStretch.ts';
import { ALL_STEMS, LEAK_HIGH, LEAK_LOW, matrixAt, melodyGhostDb, separateAll, stemWindow } from '../src/screens/lab/dj/engine/djStems.ts';
import { bufferMs, dropoutsIn, dropoutsPerMin, freshLaptop, outputLatencyMs, stableBuffer, BUFFERS } from '../src/screens/lab/dj/model/djLaptop.ts';
import { BALANCE_AT, dialReads, feedbackLoopGain, freshVinyl, isBalanced, setVinyl, trueForce, wallForce, zeroDial } from '../src/screens/lab/dj/model/djVinyl.ts';
import { dvsFollow, dvsLock, dvsQuality, freshDvs, toneOnChannel } from '../src/screens/lab/dj/model/djDvs.ts';
import { controlScope } from '../src/screens/lab/dj/engine/djStage2.ts';

const near = (a: number, b: number, eps: number, msg?: string) => assert.ok(Math.abs(a - b) <= eps, msg ?? `${a} ≉ ${b} (±${eps})`);
const rmsDb = (x: Float32Array, a = 0, b = x.length) => {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return linToDb(Math.sqrt(s / Math.max(1, b - a)));
};
const BAR17_A = 0.12 + 16 * (240 / 122);
const BAR17_B = 0.38 + 16 * (240 / 126);

/** Deck A playing at bar 17 into CH1 (fader up), crowd perspective. */
function playingA(extra?: Partial<Booth>): Booth {
  let b = builtBooth();
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: BAR17_A } } };
  b = setPlaying(b, 0, 'A', true);
  b = { ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 1 } }, ...extra };
  return b;
}
const withFx = (b: Booth, f: Partial<FxState>): Booth => ({ ...b, fx: { ...freshFx(), ...f } });

/* ── effects ──────────────────────────────────────────────────────────── */

describe('Stage 2 — effects (model/djEffects + engine/djFx)', () => {
  it('ECHO repeats after its beat time, and FEEDBACK sets how fast the repeats fade', () => {
    const fx: FxState = { ...freshFx(), type: 'ECHO', time: FX_TIMES.ECHO.indexOf(0.5), feedback: 0.5, on: true };
    const T = fxTimeSec(fx, 120);
    near(T, 0.25, 1e-12, 'half a beat at 120 BPM is 250 ms');
    const n = SR;
    const x = new Float32Array(n);
    x[0] = 1;
    const y = fxProcess({ fx, bpm: 120, beat0: 0, feed: true, loopGain: 0 }, x, x, freshFxCarry());
    const D = Math.round(T * SR);
    assert.ok(Math.abs(y.l[D]) > 0.99, 'the first repeat lands exactly one delay later');
    for (let i = 0; i < D; i++) assert.equal(y.l[i], 0);
    // the second repeat: the feedback × the loop's gentle low-pass (energy over the smear)
    let e2 = 0;
    for (let i = 2 * D - 4; i < 2 * D + 40; i++) e2 += y.l[i];
    near(e2, 0.5 * 0.92, 0.05, `second repeat ${e2}`);
    const none = fxProcess({ fx: { ...fx, feedback: 0 }, bpm: 120, beat0: 0, feed: true, loopGain: 0 }, x, x, freshFxCarry());
    let tail = 0;
    for (let i = D + 100; i < n; i++) tail += Math.abs(none.l[i]);
    near(tail, 0, 1e-6, 'feedback 0 = one repeat (a plain delay)');
  });
  it('dry/wet: dry only at 0, both at full in the middle, wet only at 1', () => {
    assert.deepEqual(dryWet(0), { dry: 1, wet: 0 });
    assert.deepEqual(dryWet(0.5), { dry: 1, wet: 1 });
    assert.deepEqual(dryWet(1), { dry: 0, wet: 1 });
  });
  it('a channel INSERT sits after the fader: pull the fader and the echo rings on (an echo out); the cue stays dry', () => {
    clearDeckCache();
    const on = withFx(playingA({ ch: { ...builtBooth().ch, 1: { ...builtBooth().ch[1], fader: 1, cue: true } } }), { on: true, route: 'CH1', type: 'ECHO', time: 1, feedback: 0.7, wet: 0.5 });
    const r1 = renderBooth(on, 0, 3);
    const dry = renderBooth(playingA({ ch: { ...builtBooth().ch, 1: { ...builtBooth().ch[1], fader: 1, cue: true } } }), 0, 3);
    near(r1.rmsDb.cue, dry.rmsDb.cue, 1e-6, 'the cue tap is before the fader and the insert');
    // the fader comes down at t = 3; the next chunk continues the effect
    const down: Booth = { ...on, ch: { ...on.ch, 1: { ...on.ch[1], fader: 0 } } };
    const r2 = renderBooth(down, 3, 2, r1.carry);
    const bus = r2.meter.bus;
    assert.ok(bus[20] > -40, `echoes still ringing just after the fader closed (${bus[20].toFixed(1)} dBFS)`);
    const noFx = renderBooth({ ...down, fx: undefined }, 3, 2, r1.carry);
    assert.ok(noFx.rmsDb.bus < -100, 'without the effect a closed fader is silence');
  });
  it('FX OFF lets the tail ring out (trails) and then stops feeding', () => {
    clearDeckCache();
    const on = withFx(playingA(), { on: true, route: 'CH1', type: 'ECHO', time: 1, feedback: 0.6, wet: 0.5 });
    const r1 = renderBooth(on, 0, 3);
    const off = withFx({ ...on, decks: { ...on.decks, A: { ...on.decks.A, playing: false } } }, { ...on.fx!, on: false });
    const r2 = renderBooth(off, 3, 4, r1.carry);
    assert.ok(r2.meter.bus[10] > -45, 'the tail is still there');
    assert.ok(r2.meter.bus[r2.meter.bus.length - 1] < r2.meter.bus[10] - 20, 'and it dies away');
  });
  it('MASTER takes every channel; a CH1 insert leaves channel 2 alone', () => {
    clearDeckCache();
    let b = playingA();
    b = { ...b, decks: { ...b.decks, B: { ...b.decks.B, posSec: BAR17_B } } };
    b = setPlaying(b, 0, 'B', true);
    b = { ...b, ch: { 1: { ...b.ch[1], fader: 0 }, 2: { ...b.ch[2], fader: 1 } } };
    const base = renderBooth(b, 0, 2);
    const ins = renderBooth(withFx(b, { on: true, route: 'CH1', type: 'REVERB', wet: 0.8 }), 0, 2);
    const mst = renderBooth(withFx(b, { on: true, route: 'MASTER', type: 'REVERB', wet: 0.8 }), 0, 2);
    near(ins.rmsDb.bus, base.rmsDb.bus, 1e-6, 'a CH1 insert does not touch deck B');
    assert.ok(Math.abs(mst.rmsDb.bus - base.rmsDb.bus) > 0.3, 'the MASTER effect changes what the crowd hears of deck B');
  });
  it('SEND / RETURN: the dry sound never changes; the return adds the wet only', () => {
    clearDeckCache();
    const b = playingA();
    const base = renderBooth(b, 0, 2);
    const zeroRet = renderBooth(withFx(b, { on: true, route: 'SEND', type: 'REVERB', wet: 0, send: { 1: 1, 2: 0 } }), 0, 2);
    for (let i = 0; i < base.playback.l.length; i += 997) assert.equal(zeroRet.playback.l[i], base.playback.l[i]);
    const ret = renderBooth(withFx(b, { on: true, route: 'SEND', type: 'REVERB', wet: 1, send: { 1: 1, 2: 0 } }), 0, 2);
    assert.ok(ret.rmsDb.bus > base.rmsDb.bus + 0.2, 'the return adds the reverb to the dry');
    assert.ok(ret.rmsDb.ch1 === base.rmsDb.ch1, 'the channel itself is untouched');
  });
  it('a re-render inside a chunk carries the effect on exactly (the tail never resets)', () => {
    clearDeckCache();
    const b = withFx(playingA({ listen: 0.2 }), { on: true, route: 'CH1', type: 'ECHO', time: 2, feedback: 0.6, wet: 0.5 });
    const whole = renderBooth(b, 0, 3);
    const c = carryAt(whole, 1.5);
    assert.ok(c?.s2?.fx, 'the carry has the effect state');
    const part = renderBooth(anchorAt(b, 1.5), 1.5, 1.5, c);
    const k0 = Math.round(1.5 * SR);
    let maxd = 0;
    for (let i = 0; i < part.playback.l.length - 10; i += 7) maxd = Math.max(maxd, Math.abs(part.playback.l[i] - whole.playback.l[k0 + i]));
    assert.ok(maxd < 1e-4, `continuation differs by ${maxd}`);
  });
  it('a RETURN LOOP (the return on CH2 while CH2 feeds the send) builds up — held under the safe ceiling and played quieter', () => {
    clearDeckCache();
    let b = playingA();
    b = { ...b, ch: { 1: { ...b.ch[1], fader: 0.8 }, 2: { ...b.ch[2], fader: 1, trim: 0.5 } } };
    b = withFx(b, { on: true, route: 'SEND', type: 'ECHO', time: 0, feedback: 0.4, wet: 1, send: { 1: 0.05, 2: 1 }, returnTo: 'CH2' });
    const r = renderBooth(b, 0, 8);
    assert.ok(r.s2!.loopGain >= 1, `loop gain ${r.s2!.loopGain}`);
    assert.equal(r.s2!.safetyDb, LOOP_SAFETY_DB);
    const out = r.s2!.fxOut!;
    const early = Math.max(...Array.from(out.slice(15, 25)));
    const late = Math.max(...Array.from(out.slice(out.length - 100)));
    assert.ok(late > early + 3, `the loop builds (${early.toFixed(1)} → ${late.toFixed(1)} dBFS)`);
    assert.ok(late <= linToDb(LOOP_SAFE_CEILING) + 0.01, `held under the ceiling (${late.toFixed(2)} dBFS)`);
    let pk = 0;
    for (const v of r.playback.l) pk = Math.max(pk, Math.abs(v));
    assert.ok(pk <= Math.pow(10, -1 / 20) + 1e-6, 'and the listener limiter still caps it');
    const fixed = renderBooth({ ...b, fx: { ...b.fx!, returnTo: 'BUS' } }, 0, 2);
    assert.equal(fixed.s2!.loopGain, 0);
    assert.equal(fixed.s2!.safetyDb, 0);
  });
});

/* ── key lock, key shift ──────────────────────────────────────────────── */

const sineBuf = (hz: number, sec: number, beepEvery = 0) => {
  const n = Math.round(sec * SR);
  const l = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = beepEvery ? ((t % beepEvery) < 0.06 ? 1 : 0) : 1;
    l[i] = 0.5 * Math.sin(2 * Math.PI * hz * t) * env;
  }
  return { l, r: l.slice() };
};
const zeroCrossHz = (x: Float32Array, a: number, b: number) => {
  let c = 0;
  for (let i = a + 1; i < b; i++) if (x[i - 1] < 0 && x[i] >= 0) c++;
  return (c * SR) / (b - a);
};

describe('Stage 2 — speed, pitch and key (model/djKey + engine/djStretch)', () => {
  it('speed changes pitch by 12·log2(rate); key lock keeps it; a key shift moves it alone', () => {
    near(playedSemis({ pitch: -3.1746, keyLock: false }), -0.5585, 1e-3);
    near(playedSemis({ pitch: 8, keyLock: false }), 1.3324, 1e-3);
    assert.equal(playedSemis({ pitch: -3.17, keyLock: true }), 0);
    assert.equal(playedSemis({ pitch: 5, keyLock: true, keyShift: -2 }), -2);
    for (const d of [{ pitch: 4, keyLock: true, keyShift: 1 }, { pitch: -6, keyLock: false, keyShift: 2 }, { pitch: 0, keyLock: true }]) {
      const p = speedPlan(d);
      near(p.stretch * p.pitch, p.rate, 1e-12, 'tempo = stretch × pitch');
    }
  });
  it('key words and relations: B at A’s tempo without key lock is out of tune; with it, neighbour keys', () => {
    const b = builtBooth();
    const A = b.decks.A;
    const B = { ...b.decks.B, pitch: (122 / 126 - 1) * 100 };
    assert.equal(keyWords(B), 'D minor −0.56 st');
    assert.equal(keyRelation(A, B), 'OUT OF TUNE');
    assert.equal(keyWords({ ...B, keyLock: true }), 'D minor');
    assert.equal(keyRelation(A, { ...B, keyLock: true }), 'NEIGHBOURS');
  });
  it('the WSOLA stretch keeps a sine’s frequency at a new tempo, and the beeps arrive at the new tempo', () => {
    const src = sineBuf(440, 12, 0.5);
    const read = (start: number, len: number) => {
      const a = Math.round(start * SR);
      const out = { l: new Float32Array(len), r: new Float32Array(len) };
      for (let i = 0; i < len; i++) {
        const k = a + i;
        if (k >= 0 && k < src.l.length) {
          out.l[i] = src.l[k];
          out.r[i] = src.r[k];
        }
      }
      return out;
    };
    const rate = 0.85;
    const y = speedChain(read, 1, { stretch: rate, pitch: 1 }, Math.round(4 * SR));
    // inside a beep: the frequency is still 440 Hz
    let best = 0;
    let at = 0;
    for (let i = 0; i < y.l.length - 1200; i += 600) {
      const e = rmsDb(y.l, i, i + 1200);
      if (e > best || at === 0) {
        best = e;
        at = i;
      }
    }
    near(zeroCrossHz(y.l, at, at + 1200), 440, 440 * 0.03, 'pitch kept');
    // beep onsets every 0.5 s of track time = 0.5 / 0.85 s of output
    const onsets: number[] = [];
    for (let i = 1; i < y.l.length; i += 48) {
      const e = rmsDb(y.l, i, i + 240);
      const p = rmsDb(y.l, Math.max(0, i - 480), i);
      if (e > -12 && p < -30) onsets.push(i / SR);
    }
    assert.ok(onsets.length >= 4, `onsets ${onsets}`);
    const gaps = onsets.slice(1).map((t, i) => t - onsets[i]).filter((g) => g > 0.3);
    for (const g of gaps) near(g, 0.5 / rate, 0.03, `gap ${g}`);
  });
  it('without key lock the same speed change moves the pitch (a plain resample)', () => {
    const src = sineBuf(440, 4);
    const read = (start: number, len: number) => ({ l: src.l.slice(Math.round(start * SR), Math.round(start * SR) + len), r: src.r.slice(Math.round(start * SR), Math.round(start * SR) + len) });
    const y = speedChain(read, 0.5, { stretch: 1, pitch: 1.08 }, SR);
    near(zeroCrossHz(y.l, 1000, 40000), 440 * 1.08, 4);
  });
  it('a key-locked deck in the booth plays at about the same level as unlocked', () => {
    clearDeckCache();
    let b = builtBooth();
    b = { ...b, decks: { ...b.decks, B: { ...b.decks.B, posSec: BAR17_B, pitch: -3.17 } } };
    b = setPlaying(b, 0, 'B', true);
    b = { ...b, ch: { ...b.ch, 2: { ...b.ch[2], fader: 1 } } };
    const plain = renderBooth(b, 0, 3);
    const locked = renderBooth({ ...b, decks: { ...b.decks, B: { ...b.decks.B, keyLock: true } } }, 0, 3);
    near(locked.rmsDb.ch2, plain.rmsDb.ch2, 1.5);
  });
});

/* ── stems ────────────────────────────────────────────────────────────── */

describe('Stage 2 — stems (engine/djStems)', () => {
  const t0 = BAR17_A + 24 * (240 / 122); // the drop: every part playing
  const n = Math.round(2 * SR);
  it('the ORIGINAL stems at full level ARE the track (Night Ferry, sample for sample)', () => {
    const mix = trackWindow('nightFerry', t0, n).mix;
    const st = stemWindow('nightFerry', t0, n, ALL_STEMS, 'ORIGINAL');
    let d = 0;
    for (let i = 0; i < n; i++) d = Math.max(d, Math.abs(st.l[i] - mix.l[i]), Math.abs(st.r[i] - mix.r[i]));
    assert.ok(d < 1e-5, `max difference ${d}`);
  });
  it('every leakage column sums to 1 (also with the wobble), so the SEPARATED stems still add up to the track', () => {
    for (const M of [LEAK_LOW, LEAK_HIGH, matrixAt(1234, 'low'), matrixAt(77, 'high')]) for (let j = 0; j < 4; j++) near(M.reduce((a, r) => a + r[j], 0), 1, 1e-12);
    const mix = trackWindow('nightFerry', t0, n).mix;
    const sep = stemWindow('nightFerry', t0, n, ALL_STEMS, 'SEPARATED');
    let d = 0;
    for (let i = 0; i < n; i++) d = Math.max(d, Math.abs(sep.l[i] - mix.l[i]));
    assert.ok(d < 1e-4, `separated sum differs by ${d}`);
  });
  it('muting the melody: gone from the ORIGINAL stems, a ghost left in the SEPARATED ones', () => {
    const raw = assembleRaw('nightFerry', t0, n, true).stems!;
    const noLead = { ...ALL_STEMS, lead: 0 };
    const mix = trackWindow('nightFerry', t0, n).mix;
    const lin = trackWindow('nightFerry', t0, n, true).stems!.lead; // the melody at the master's (linear) gain
    const orig = stemWindow('nightFerry', t0, n, noLead, 'ORIGINAL');
    const sep = stemWindow('nightFerry', t0, n, noLead, 'SEPARATED');
    let d = 0;
    for (let i = 0; i < n; i++) d = Math.max(d, Math.abs(orig.l[i] - (mix.l[i] - lin.l[i])));
    assert.ok(d < 1e-5, `original = the track minus exactly the melody (${d})`);
    // what the separation leaves of the melody: its projection on the melody
    let xy = 0;
    let yy = 0;
    for (let i = 0; i < n; i++) {
      const res = sep.l[i] - orig.l[i];
      xy += res * raw.lead.l[i];
      yy += raw.lead.l[i] * raw.lead.l[i];
    }
    assert.ok(xy / yy > 0.03, `separated keeps a ghost of the melody (${(xy / yy).toFixed(3)})`);
    const g = melodyGhostDb(noLead, t0, n);
    assert.ok(g > -24 && g < -12, `ghost ${g.toFixed(1)} dB`);
    void STEM_IDS;
    void separateAll;
  });
});

/* ── laptop, buffer, latency, dropouts ────────────────────────────────── */

describe('Stage 2 — laptop and audio interface (model/djLaptop)', () => {
  it('a buffer of 256 at 48 kHz lasts 5.33 ms; the output latency adds the converter', () => {
    near(bufferMs(256, 48000), 5.3333, 1e-3);
    near(outputLatencyMs(256, 48000), 6.3333, 1e-3);
  });
  it('the heavier the workload, the bigger the smallest stable buffer (and the latency)', () => {
    assert.equal(stableBuffer('TWO DECKS', 48000), 256);
    assert.equal(stableBuffer('FOUR + FX', 48000), 512);
    assert.equal(stableBuffer('STEMS LIVE', 48000), 1024);
    assert.ok(stableBuffer('TWO DECKS', 96000) > 256, 'a higher rate needs more samples for the same time');
    let last = Infinity;
    for (const buf of BUFFERS) {
      const d = dropoutsPerMin({ buffer: buf, rate: 48000, workload: 'FOUR + FX' });
      assert.ok(d <= last, 'dropouts fall as the buffer grows');
      last = d;
    }
  });
  it('dropouts are deterministic, about the expected rate, and none at the stable buffer', () => {
    const l = { ...freshLaptop(), buffer: 128, workload: 'TWO DECKS' as const };
    const a = dropoutsIn(l, 10, 60);
    assert.deepEqual(dropoutsIn(l, 10, 60), a);
    const want = dropoutsPerMin(l);
    assert.ok(a.length > want * 0.5 && a.length < want * 1.6, `${a.length} vs ${want.toFixed(1)}`);
    assert.equal(dropoutsIn({ ...l, buffer: 256 }, 10, 60).length, 0);
  });
  it('the software’s decks reach the mixer over USB only on the right device and pair', () => {
    clearDeckCache();
    let b = playingA({ laptop: freshLaptop() });
    b = { ...b, ch: { 1: { ...b.ch[1], input: 'USB', fader: 1 }, 2: { ...b.ch[2], input: 'USB', fader: 1 } } };
    const ok = renderBooth(b, 0, 1);
    assert.ok(ok.rmsDb.ch1 > -40 && ok.rmsDb.ch2 < -100, 'deck 1 on USB 1/2 → channel 1');
    const builtin = renderBooth({ ...b, laptop: { ...b.laptop!, device: 'BUILT-IN' } }, 0, 1);
    assert.ok(builtin.rmsDb.ch1 < -100, 'BUILT-IN: nothing reaches the mixer');
    const wrong = renderBooth({ ...b, laptop: { ...b.laptop!, assign: { A: 'USB 3/4', B: 'USB 3/4' } } }, 0, 1);
    assert.ok(wrong.rmsDb.ch1 < -100 && wrong.rmsDb.ch2 > -40, 'deck 1 sent to USB 3/4 arrives on channel 2');
    const stage1 = renderBooth({ ...b, laptop: undefined }, 0, 1);
    assert.ok(stage1.rmsDb.ch1 < -100, 'with no laptop USB stays silent (Stage 1)');
  });
  it('a dropout is a real gap in the USB audio', () => {
    clearDeckCache();
    let b = playingA({ laptop: { ...freshLaptop(), buffer: 64, workload: 'STEMS LIVE' } });
    b = { ...b, ch: { ...b.ch, 1: { ...b.ch[1], input: 'USB', fader: 1 } } };
    const r = renderBooth(b, 0, 2);
    assert.ok(r.s2!.dropouts.length > 10, `${r.s2!.dropouts.length} dropouts`);
    let runs = 0;
    let z = 0;
    for (const v of r.playback.l) {
      if (v === 0) z++;
      else {
        if (z >= 60) runs++;
        z = 0;
      }
    }
    assert.ok(runs >= 5, `${runs} silent gaps`);
  });
});

/* ── vinyl setup ──────────────────────────────────────────────────────── */

describe('Stage 2 — turntable setup (model/djVinyl)', () => {
  it('as found the dial reads 4.0 g while the arm really tracks at 2.5 g; balance → zero → set fixes it', () => {
    const v = freshVinyl();
    near(dialReads(v), 4.0, 1e-9);
    near(trueForce(v), 2.5, 1e-9);
    let w = { ...v, weight: BALANCE_AT };
    assert.ok(isBalanced(w));
    w = zeroDial(w);
    w = { ...w, weight: w.weight + 4 };
    near(dialReads(w), 4, 1e-9);
    near(trueForce(w), 4, 1e-9);
  });
  it('anti-skate: none leans on the inner wall (left) and lifts the right; matched, both walls equal', () => {
    const v = { ...setVinyl(), antiSkate: 0 };
    const f = wallForce(v);
    assert.ok(f.R < f.L);
    const m = wallForce(setVinyl());
    near(m.L, m.R, 1e-9);
  });
  it('no ground wire: a 50 Hz buzz on the phono channel, even with the record stopped', () => {
    clearDeckCache();
    let b = builtBooth();
    b = { ...b, ttPreamp: 'PHONO', plugs: { ...b.plugs, 'tt.rcaL': 'ch1.phono.L', 'tt.rcaR': 'ch1.phono.R' }, ch: { ...b.ch, 1: { ...b.ch[1], input: 'PHONO', fader: 1 } }, vinyl: { ...setVinyl(), gnd: false } };
    b = setPlaying(b, 0, 'B', true); // keep the booth running
    b = { ...b, ch: { ...b.ch, 2: { ...b.ch[2], fader: 0 } } };
    const hum = renderBooth(b, 0, 1);
    const quiet = renderBooth({ ...b, vinyl: setVinyl() }, 0, 1);
    assert.ok(hum.rmsDb.ch1 > -50 && hum.rmsDb.ch1 < -15, `hum ${hum.rmsDb.ch1.toFixed(1)} dBFS`);
    assert.ok(quiet.rmsDb.ch1 < -100);
  });
  it('the acoustic loop: up loud with the monitor near and no feet it howls (held safe); feet or distance stop it', () => {
    let b = playingA();
    b = { ...b, tt: { ...b.tt, playing: true, posSec: 40, at: 0 }, mixer: { ...b.mixer, booth: 0.75 }, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0.85 } } };
    const v = { ...setVinyl(), feet: false, monitorNear: true };
    assert.ok(feedbackLoopGain(b, v) >= 1);
    assert.ok(feedbackLoopGain(b, { ...v, feet: true }) < 0.35);
    assert.ok(feedbackLoopGain(b, { ...v, monitorNear: false }) < 0.5);
    b = { ...b, ttPreamp: 'LINE', plugs: { ...b.plugs, 'tt.rcaL': 'ch1.line.L', 'tt.rcaR': 'ch1.line.R', 'A.rcaL': null, 'A.rcaR': null }, vinyl: v };
    const r = renderBooth(b, 0, 4);
    assert.ok(r.s2!.howlDb > -40, `howl ${r.s2!.howlDb.toFixed(1)}`);
    assert.ok(r.s2!.howlDb < linToDb(0.3), 'held under its safe ceiling');
    assert.equal(r.s2!.safetyDb, -9);
  });
});

/* ── DVS ──────────────────────────────────────────────────────────────── */

describe('Stage 2 — digital vinyl (model/djDvs)', () => {
  const dvsBooth = (): Booth => {
    let b = builtBooth();
    b = { ...b, ttPreamp: 'PHONO', plugs: { ...b.plugs, 'tt.rcaL': 'ch1.phono.L', 'tt.rcaR': 'ch1.phono.R' }, laptop: freshLaptop(), vinyl: setVinyl(), dvs: freshDvs() };
    b = { ...b, ch: { ...b.ch, 1: { ...b.ch[1], input: 'USB', fader: 1 } }, tt: { ...b.tt, playing: true, posSec: BAR17_A, at: 0 } };
    return dvsFollow(b);
  };
  it('a clean, calibrated control record locks; each problem lowers the quality', () => {
    const b = dvsBooth();
    assert.equal(dvsQuality(b), 1);
    assert.equal(dvsLock(b), 'LOCKED');
    assert.equal(dvsLock({ ...b, vinyl: { ...b.vinyl!, gnd: false } }), 'UNSTABLE');
    assert.equal(dvsLock({ ...b, dvs: { ...b.dvs!, dirty: true } }), 'UNSTABLE');
    assert.equal(dvsLock({ ...b, ttPreamp: 'LINE', dvs: { ...b.dvs!, dirty: true } }), 'LOST');
    assert.equal(dvsLock({ ...b, dvs: { ...b.dvs!, mode: 'INT', dirty: true } }), 'IGNORED');
  });
  it('ABSOLUTE follows a needle drop; RELATIVE keeps its place; INTERNAL ignores the platter', () => {
    const b = dvsBooth();
    assert.equal(b.decks.A.playing, true);
    const drop = (x: Booth) => dvsFollow({ ...x, tt: { ...x.tt, posSec: x.tt.posSec + 30 } });
    near(drop(b).decks.A.posSec, b.tt.posSec + 30, 1e-9);
    const rel = { ...b, dvs: { ...b.dvs!, mode: 'REL' as const } };
    near(drop(rel).decks.A.posSec, b.decks.A.posSec, 1e-9);
    const int = { ...b, dvs: { ...b.dvs!, mode: 'INT' as const } };
    const stopped = dvsFollow({ ...int, tt: { ...int.tt, playing: false } });
    assert.equal(stopped.decks.A.playing, true, 'INTERNAL plays on when the platter stops');
    const relStop = dvsFollow({ ...rel, tt: { ...rel.tt, playing: false } });
    assert.equal(relStop.decks.A.playing, false);
  });
  it('channel 1 on USB plays the music; on PHONO the crowd hears the control tone (quietly in the lab)', () => {
    clearDeckCache();
    const b = dvsBooth();
    const music = renderBooth(b, 0, 1);
    assert.equal(toneOnChannel(b), false);
    assert.ok(music.rmsDb.ch1 > -40 && music.s2!.safetyDb === 0);
    const tone: Booth = { ...b, ch: { ...b.ch, 1: { ...b.ch[1], input: 'PHONO' } } };
    assert.equal(toneOnChannel(tone), true);
    const r = renderBooth(tone, 0, 1);
    near(r.rmsDb.ch1, -9, 1.5, `the tone at about −9 dBFS RMS on CH1 (${r.rmsDb.ch1.toFixed(1)})`);
    assert.equal(r.s2!.safetyDb, -9);
    const thru = renderBooth({ ...b, dvs: { ...b.dvs!, mode: 'THRU' } }, 0, 1);
    near(thru.rmsDb.ch1, -9, 1.5, 'THRU passes the tone too');
  });
  it('the scope: a clean ring; hum makes it wobble; a hot signal squares it; a stopped platter is a dot', () => {
    const b = dvsBooth();
    const radii = (s: { l: number[]; r: number[] }) => s.l.map((x, i) => Math.hypot(x, s.r[i]));
    const sd = (a: number[]) => {
      const m = a.reduce((x, y) => x + y, 0) / a.length;
      return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
    };
    const clean = radii(controlScope(b, 0));
    assert.ok(sd(clean) < 0.01, `clean ring sd ${sd(clean)}`);
    near(clean[0], 0.5, 0.01);
    const hum = radii(controlScope({ ...b, vinyl: { ...b.vinyl!, gnd: false } }, 0));
    assert.ok(sd(hum) > sd(clean) * 5);
    const hot = controlScope({ ...b, ttPreamp: 'LINE' }, 0);
    assert.ok(Math.max(...hot.l.map(Math.abs)) >= 0.999, 'the phono stage clips a line-level tone');
    const still = radii(controlScope({ ...b, tt: { ...b.tt, playing: false } }, 0));
    assert.ok(Math.max(...still) < 1e-9);
    void TRACKS;
  });
});
