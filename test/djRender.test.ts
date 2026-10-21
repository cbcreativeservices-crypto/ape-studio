/**
 * DJ Systems Lab — the shared booth's model and signal path
 * (src/screens/lab/dj/model/djModel.ts + engine/djRender.ts + engine/djDsp.ts).
 *
 * Pins the stated model: routing through cables and input selectors, the
 * phono/line level mistakes, the tapers and crossfader curves, the isolator's
 * ranges and its exact unity, the cue tap (pre-fader) and split cue, the
 * listening perspectives, CLIP BEFORE OUTPUT (a clipped mix bus stays
 * clipped when the master is lowered), the +6.02 dB coherent / +3.01 dB
 * uncorrelated summing demonstration, the protective limiter and the meter
 * ballistics.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SR, ISO_HIGH_HZ, ISO_LOW_HZ, filterMag, filterOf, isolatorInPlace, isolatorMag, isoState, linToDb, RIAA_PLAYBACK, RIAA_RECORDING, biquadMag } from '../src/screens/lab/dj/engine/djDsp.ts';
import {
  EQ_KILL_BELOW,
  TRIM_UNITY,
  builtBooth,
  channelRoute,
  connect,
  eqDb,
  faderGain,
  levelKnobGain,
  speakerFeed,
  systemBuilt,
  trimDb,
  trimPos,
  unbuiltBooth,
  xfGainFor,
  xfGains,
  type Booth,
} from '../src/screens/lab/dj/model/djModel.ts';
import { renderBooth, ballistics, METER_FALL_DB_PER_S, clearDeckCache } from '../src/screens/lab/dj/engine/djRender.ts';
import { load, playPause, setPlaying } from '../src/screens/lab/dj/model/djDeck.ts';

const db = (x: number) => 20 * Math.log10(x);
const near = (a: number, b: number, eps: number, msg?: string) => assert.ok(Math.abs(a - b) <= eps, msg ?? `${a} ≉ ${b} (±${eps})`);

/** A playing booth: deck A at bar 17 (the main groove), fader up, crowd perspective. */
function playingA(): Booth {
  let b = builtBooth();
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: 0.12 + 16 * (240 / 122) } } };
  b = setPlaying(b, 0, 'A', true);
  b = { ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 1 } } };
  return b;
}

describe('tapers and curves (stated in MODEL.md)', () => {
  it('trim −20 … +12 dB, 0 dB at the 12 o’clock centre detent, linear in dB each side', () => {
    assert.equal(trimDb(0), -20);
    assert.equal(trimDb(1), 12);
    assert.equal(TRIM_UNITY, 0.5);
    near(trimDb(TRIM_UNITY), 0, 1e-12);
    near(trimPos(6), 0.75, 1e-12);
    near(trimPos(-10), 0.25, 1e-12);
    for (const d of [-20, -7.5, 0, 3, 12]) near(trimDb(trimPos(d)), d, 1e-9);
  });
  it('isolator knob: +6 dB … −26 dB, then a kill at the end stop', () => {
    assert.equal(eqDb(0.5), 0);
    assert.equal(eqDb(1), 6);
    near(eqDb(EQ_KILL_BELOW + 1e-9), -26, 1e-6);
    assert.equal(eqDb(0), -Infinity);
  });
  it('channel fader is square law: half way is −12.04 dB', () => {
    near(db(faderGain(0.5)), -12.0412, 1e-3);
    assert.equal(faderGain(1), 1);
    assert.equal(faderGain(0), 0);
  });
  it('level knobs reach unity at three-quarters and +5.0 dB at the stop', () => {
    near(levelKnobGain(0.75), 1, 1e-12);
    near(db(levelKnobGain(1)), 40 * Math.log10(4 / 3), 1e-9);
  });
  it('crossfader: BLEND −3.01 dB, DIP −6.02 dB, CUT 0 dB at centre; THRU ignores it', () => {
    near(db(xfGains(0.5, 'BLEND').a), -3.0103, 1e-3);
    near(db(xfGains(0.5, 'DIP').b), -6.0206, 1e-3);
    assert.equal(xfGains(0.5, 'CUT').a, 1);
    assert.equal(xfGains(0, 'BLEND').b, 0);
    near(xfGains(0, 'BLEND').a, 1, 1e-12);
    // CUT opens fully within 5 % of travel
    assert.equal(xfGains(0.05, 'CUT').b, 1);
    near(xfGains(0.025, 'CUT').b, 0.5, 1e-12);
    assert.equal(xfGainFor('THRU', 0, 'CUT'), 1);
    assert.equal(xfGainFor('B', 0, 'BLEND'), 0);
  });
  it('BLEND keeps constant power: a² + b² = 1 everywhere', () => {
    for (let x = 0; x <= 1; x += 0.05) {
      const g = xfGains(x, 'BLEND');
      near(g.a * g.a + g.b * g.b, 1, 1e-12);
    }
  });
});

describe('the isolator and the filter (defined slopes and ranges)', () => {
  it('every band at 0 dB returns the input exactly (no colour at 12 o’clock)', () => {
    const x = new Float32Array(4800).map((_, i) => Math.sin(i * 0.05) * 0.5 + Math.sin(i * 0.7) * 0.2);
    const y = x.slice();
    isolatorInPlace(y, { lo: 1, mid: 1, hi: 1 }, isoState());
    for (let i = 0; i < x.length; i++) assert.equal(y[i], x[i]);
    for (const f of [30, 250, 1000, 2500, 12000]) near(isolatorMag({ lo: 1, mid: 1, hi: 1 }, f), 1, 1e-9);
  });
  it('the three bands sum flat (an all-pass) at unity and a hair off it', () => {
    for (const f of [20, 100, 250, 700, 2500, 6000, 16000]) near(isolatorMag({ lo: 1, mid: 1, hi: 1 }, f), 1, 1e-9);
    for (const f of [50, 400, 5000]) near(linToDb(isolatorMag({ lo: 1, mid: 0.9999999, hi: 1 }, f)), 0, 0.01);
  });
  it('a LOW kill removes the bass (≥ 30 dB down at 50 Hz) and leaves the highs', () => {
    const g = { lo: 0, mid: 1, hi: 1 };
    assert.ok(linToDb(isolatorMag(g, 50)) < -30, `${linToDb(isolatorMag(g, 50))}`);
    near(linToDb(isolatorMag(g, 8000)), 0, 0.5);
    assert.equal(ISO_LOW_HZ, 250);
    assert.equal(ISO_HIGH_HZ, 2500);
  });
  it('a HIGH kill removes the treble (≥ 24 dB down at 12 kHz)', () => {
    assert.ok(linToDb(isolatorMag({ lo: 1, mid: 1, hi: 0 }, 12000)) < -24);
  });
  it('the filter is a true bypass at centre and a 12 dB/oct sweep either side', () => {
    assert.equal(filterOf(0).kind, 'off');
    assert.equal(filterOf(0.02).kind, 'off');
    const lp = filterOf(-1);
    assert.equal(lp.kind, 'lp');
    near((lp as { hz: number }).hz, 200, 1e-6);
    const hp = filterOf(1);
    near((hp as { hz: number }).hz, 6000, 1e-6);
    // 12 dB/oct: two octaves above a 200 Hz low-pass ≈ −24 dB
    near(linToDb(filterMag({ kind: 'lp', hz: 200, q: 0.7071 }, 800)), -24, 1.5);
  });
  it('RIAA playback is 0 dB at 1 kHz, about +19 dB at 20 Hz and −14 dB at 10 kHz; recording is its inverse', () => {
    near(linToDb(biquadMag(RIAA_PLAYBACK, 1000)), 0, 1e-6);
    near(linToDb(biquadMag(RIAA_PLAYBACK, 20)), 19.3, 0.5);
    near(linToDb(biquadMag(RIAA_PLAYBACK, 20000)), -19.6, 3);
    near(linToDb(biquadMag(RIAA_PLAYBACK, 10000)), -13.7, 1);
    for (const f of [20, 100, 1000, 5000]) near(linToDb(biquadMag(RIAA_PLAYBACK, f) * biquadMag(RIAA_RECORDING, f)), 0, 0.3);
  });
});

describe('routing (what reaches where)', () => {
  it('a built booth: CH1 ← deck A, CH2 ← deck B, PA ← MASTER, booth monitors ← BOOTH', () => {
    const b = builtBooth();
    assert.ok(systemBuilt(b));
    assert.deepEqual(channelRoute(b, 1).L, { source: 'A', side: 'L' });
    assert.deepEqual(channelRoute(b, 2).R, { source: 'B', side: 'R' });
    assert.deepEqual(speakerFeed(b, 'paR'), { out: 'MASTER', side: 'R' });
    assert.deepEqual(speakerFeed(b, 'boothL'), { out: 'BOOTH', side: 'L' });
  });
  it('an unbuilt booth reaches nothing', () => {
    const b = unbuiltBooth();
    assert.equal(channelRoute(b, 1).L, null);
    assert.equal(speakerFeed(b, 'paL'), null);
    assert.equal(systemBuilt(b), false);
  });
  it('a plug refuses a jack it does not fit, and one jack takes one plug', () => {
    const b = builtBooth();
    assert.equal(connect(b, 'mst.xlrL', 'ch1.line.L'), null);
    const c = connect(b, 'B.rcaL', 'ch1.line.L')!;
    assert.equal(c.plugs['A.rcaL'], null);
    assert.equal(c.plugs['B.rcaL'], 'ch1.line.L');
  });
  it('the wrong input selector hears nothing; a line player in PHONO is too hot', () => {
    const b = builtBooth();
    b.ch[1] = { ...b.ch[1], input: 'PHONO' };
    assert.equal(channelRoute(b, 1).L, null);
    const c = connect(connect(b, 'A.rcaL', 'ch1.phono.L')!, 'A.rcaR', 'ch1.phono.R')!;
    assert.equal(channelRoute(c, 1).tooHot, true);
  });
});

describe('the signal path, rendered', () => {
  clearDeckCache();
  it('deck A reaches the crowd; the channel meter reads before the fader', () => {
    const b = playingA();
    const r = renderBooth(b, 0, 1);
    assert.ok(r.rmsDb.crowd > -40, `crowd ${r.rmsDb.crowd}`);
    const closed = renderBooth({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0 } } }, 0, 1);
    near(closed.rmsDb.ch1, r.rmsDb.ch1, 1e-6);
    assert.ok(closed.rmsDb.crowd < -100);
  });
  it('one RCA plug out: that side of the channel is silent', () => {
    const b = playingA();
    const c = connect(b, 'A.rcaR', null)!;
    const r = renderBooth(c, 0, 1);
    assert.ok(r.rmsDb.masterR < -100, `R ${r.rmsDb.masterR}`);
    assert.ok(r.rmsDb.masterL > -40);
  });
  it('a line player into PHONO overloads the phono stage; trim cannot fix it', () => {
    let b = playingA();
    b = connect(connect(b, 'A.rcaL', 'ch1.phono.L')!, 'A.rcaR', 'ch1.phono.R')!;
    b = { ...b, ch: { ...b.ch, 1: { ...b.ch[1], input: 'PHONO', trim: 0 } } };
    const r = renderBooth(b, 0, 1);
    assert.ok(r.clipped.phono1 > SR * 0.2, `phono clipped ${r.clipped.phono1}`);
  });
  it('a raw cartridge into LINE is about 36 dB quiet; into PHONO it is restored', () => {
    let b = builtBooth();
    b = { ...b, ttPreamp: 'PHONO', tt: { ...b.tt, playing: true }, ch: { ...b.ch, 1: { ...b.ch[1], fader: 1 } } };
    b = connect(connect(b, 'tt.rcaL', 'ch1.line.L')!, 'tt.rcaR', 'ch1.line.R')!;
    const quiet = renderBooth(b, 0, 1).rmsDb.ch1;
    let c = connect(connect(b, 'tt.rcaL', 'ch1.phono.L')!, 'tt.rcaR', 'ch1.phono.R')!;
    c = { ...c, ch: { ...c.ch, 1: { ...c.ch[1], input: 'PHONO' } } };
    const ok = renderBooth(c, 0, 1).rmsDb.ch1;
    assert.ok(ok - quiet > 25, `quiet ${quiet} ok ${ok}`);
  });
  it('CLIP BEFORE OUTPUT: the bus overloads with clean channels, and a lower MASTER keeps the distortion', () => {
    let b = playingA();
    b = setPlaying({ ...b, decks: { ...b.decks, B: { ...b.decks.B, posSec: 0.38 + 16 * (240 / 126) } } }, 0, 'B', true);
    b = { ...b, ch: { 1: { ...b.ch[1], fader: 1, trim: trimPos(5) }, 2: { ...b.ch[2], fader: 1, trim: trimPos(0) } } };
    const hot = renderBooth(b, 0, 1);
    assert.equal(hot.clipped.ch1, 0, 'channel 1 clean');
    assert.equal(hot.clipped.ch2, 0, 'channel 2 clean');
    assert.ok(hot.clipped.bus > 0, 'the bus clips');
    const low = renderBooth({ ...b, mixer: { ...b.mixer, master: 0.3 } }, 0, 1);
    assert.ok(low.clipped.bus > 0, 'still clipped at the bus');
    assert.equal(low.clipped.master, 0);
    // The crowd's waveform is the SAME distorted waveform, only quieter.
    const ratio = Math.pow(0.3 / 0.6, 2);
    near(low.rmsDb.masterL - hot.rmsDb.masterL, db(ratio), 0.05);
  });
  it('summing: two aligned copies add +6.02 dB; two unrelated equal-level tracks add about +3.01 dB', () => {
    let b = playingA();
    b = { ...b, decks: { ...b.decks, B: { ...b.decks.A } }, ch: { 1: { ...b.ch[1], fader: 1, trim: trimPos(-10) }, 2: { ...b.ch[2], fader: 1, trim: trimPos(-10) } } };
    b = load(b, 0, 'B', 'nightFerry');
    b = { ...b, decks: { ...b.decks, B: { ...b.decks.A } } };
    const one = renderBooth({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], fader: 0 } } }, 0, 1);
    const both = renderBooth(b, 0, 1);
    near(both.rmsDb.bus - one.rmsDb.bus, 6.0206, 0.01);
    // Unrelated: deck B 8 bars later (different notes and hits).
    let u = { ...b, decks: { ...b.decks, B: { ...b.decks.A, posSec: b.decks.A.posSec + 8 * (240 / 122) + 0.31 } } };
    const a = renderBooth({ ...u, ch: { ...u.ch, 2: { ...u.ch[2], fader: 0 } } }, 0, 4).rmsDb.bus;
    const bb = renderBooth({ ...u, ch: { ...u.ch, 1: { ...u.ch[1], fader: 0 } } }, 0, 4).rmsDb.bus;
    const sum = renderBooth(u, 0, 4).rmsDb.bus;
    const powerSum = 10 * Math.log10(10 ** (a / 10) + 10 ** (bb / 10));
    near(sum, powerSum, 1.0, `sum ${sum} vs power sum ${powerSum}`);
    u = u;
  });
  it('the cue tap is pre-fader; SPLIT puts cue in the left ear and master in the right', () => {
    let b = playingA();
    b = setPlaying({ ...b, decks: { ...b.decks, B: { ...b.decks.B, posSec: 30 } } }, 0, 'B', true);
    b = { ...b, ch: { 1: { ...b.ch[1], fader: 1, cue: false }, 2: { ...b.ch[2], fader: 0, cue: true } }, perspective: 'PHONES', mixer: { ...b.mixer, splitCue: true } };
    const r = renderBooth(b, 0, 1);
    assert.ok(r.rmsDb.cue > -40, 'deck B is in the cue with its fader closed');
    assert.ok(r.rmsDb.phonesL > -50 && r.rmsDb.phonesR > -50);
    const onlyCue = renderBooth({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0 } } }, 0, 1);
    assert.ok(onlyCue.rmsDb.phonesR < -100, 'right ear = master, silent with no fader up');
    assert.ok(onlyCue.rmsDb.phonesL > -50, 'left ear = cue');
  });
  it('BOOTH follows the booth knob, not the master; PHONES are silent unplugged', () => {
    const b = playingA();
    const r0 = renderBooth(b, 0, 1);
    const r1 = renderBooth({ ...b, mixer: { ...b.mixer, master: 0.2 } }, 0, 1);
    near(r1.rmsDb.booth, r0.rmsDb.booth, 1e-6);
    const unplugged = renderBooth({ ...connect(b, 'phones', null)!, perspective: 'PHONES', ch: { ...b.ch, 1: { ...b.ch[1], cue: true } } }, 0, 1);
    let p = 0;
    for (let i = 0; i < unplugged.playback.l.length; i++) p = Math.max(p, Math.abs(unplugged.playback.l[i]));
    assert.equal(p, 0);
  });
  it('the listener is protected: nothing plays above −1 dBFS however hot the booth', () => {
    let b = playingA();
    b = { ...b, listen: 1, ch: { ...b.ch, 1: { ...b.ch[1], trim: 1, fader: 1 } }, mixer: { ...b.mixer, master: 1 } };
    const r = renderBooth(b, 0, 1);
    let p = 0;
    for (let i = 0; i < r.playback.l.length; i++) p = Math.max(p, Math.abs(r.playback.l[i]), Math.abs(r.playback.r[i]));
    assert.ok(db(p) <= -1 + 1e-4, `peak ${db(p)}`);
    assert.ok(r.clipped.ch1 > 0, 'the modelled overload is still there');
  });
  it('a stopped deck is silent and the meters rest at the floor', () => {
    let b = playingA();
    b = playPause(b, 0, 'A');
    const r = renderBooth(b, 0, 0.5);
    assert.ok(r.meter.ch1.every((v) => v <= -59.9));
  });
});

describe('meter ballistics', () => {
  it('instant rise, falls 20 dB in 1.5 s, the hold waits 1.5 s', () => {
    const raw = new Float32Array(400);
    raw[0] = 1;
    const { meter, hold } = ballistics(raw);
    assert.equal(meter[0], 0);
    near(meter[150], -20, 0.05);
    assert.equal(hold[100], 0);
    assert.ok(hold[200] < 0);
    near(METER_FALL_DB_PER_S, 13.333, 0.001);
  });
});
