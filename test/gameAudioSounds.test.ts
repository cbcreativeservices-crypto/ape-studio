/**
 * Game Audio lab — the original sounds (src/screens/lab/gameaudio/sounds/).
 * They are synthesized, so "what each sound is" can be pinned: its length,
 * its level, that a loop really loops, that four footstep takes really
 * differ, that the three music layers share one clock, and that the
 * unprepared wind really has the fault the lesson plays.
 *
 * Audit 2 (2026-11-12) found this file rewarded a fault: "wood is the darkest"
 * passed for a footstep that was a 100 Hz thump with no click. It now pins
 * what each changed sound must BE, by measurement: a wood step has a heel
 * click and board modes, a crate has its own wood, a fountain is droplets
 * over a soft bed, the courtyard bed has two gusts and no birds, the birds
 * are one-shots, a closing door thuds before it latches, the hum reaches
 * 2 kHz, and the stinger's hit is exactly half a beat in with no third.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BIRD_CALLS,
  FOOTSTEP_TAKES,
  FOUNTAIN_S,
  GA_SURFACES,
  GEN_HUM_PARTIALS,
  MUSIC_BAR_S,
  MUSIC_BEAT_S,
  MUSIC_LAYERS,
  MUSIC_LOOP_S,
  MUSIC_STINGER_LEAD_S,
  MUSIC_STINGER_S,
  ROOM_RT60_S,
  SR,
  SR_BED,
  YARD_GUSTS,
  footstep,
  musicLayer,
  roomImpulse,
  type GaSound,
} from '../src/screens/lab/gameaudio/sounds/gaSynth.ts';
import { applyBiquad, rbj } from '../src/features/ear/earDsp.ts';
import { GA_ASSETS, footstepId, gaAsset, gaSound, gaSoundBytes, gaSoundSeconds, releaseGaSounds } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';

const peakOf = (x: Float32Array) => x.reduce((p, v) => Math.max(p, Math.abs(v)), 0);
const rmsOf = (x: Float32Array, a = 0, b = x.length) => {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, b - a));
};
const db = (x: number) => 20 * Math.log10(Math.max(x, 1e-12));
const energy = (x: Float32Array) => x.reduce((e, v) => e + v * v, 0);
/** A 24 dB/octave band (two biquads each side); earDsp's filters are designed
 *  for 48 kHz, so the corner is scaled for another rate. */
function band(x: Float32Array, sr: number, lo: number, hi: number): Float32Array {
  let y = x;
  const at = (hz: number) => Math.min((hz * SR) / sr, SR * 0.45);
  if (lo > 0) for (let k = 0; k < 2; k++) y = applyBiquad(y, rbj(at(lo), 0.707, 0, 'highpass'));
  if (hi > 0) for (let k = 0; k < 2; k++) y = applyBiquad(y, rbj(at(hi), 0.707, 0, 'lowpass'));
  return y;
}
/** Share of a sound's energy inside a band, in dB (0 = all of it). */
const share = (x: Float32Array, sr: number, lo: number, hi: number) => 10 * Math.log10(energy(band(x, sr, lo, hi)) / energy(x) + 1e-20);
/** What a small speaker keeps: everything above about 400 Hz. */
const smallSpeakerLoss = (s: GaSound) => share(s.ch[0], s.sr, 400, 0);
/** Level of each block of `seconds`, in dBFS. */
function blocks(x: Float32Array, sr: number, seconds: number): number[] {
  const w = Math.round(seconds * sr);
  const out: number[] = [];
  for (let a = 0; a + w <= x.length; a += w) out.push(db(rmsOf(x, a, a + w)));
  return out;
}
/** Loudest 400 ms, K-weighted (the loudness-meter weighting): how loud a
 *  short sound is taken to be. */
function loudness(s: GaSound): number {
  const fs = s.sr;
  const bq = (x: Float64Array, c: number[]) => {
    const y = new Float64Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = c[0] * x[i] + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  };
  let k = Float64Array.from(s.ch[0]);
  {
    const Q = 0.7071752369554196, K = Math.tan((Math.PI * 1681.974450955533) / fs), Vh = Math.pow(10, 3.999843853973347 / 20), Vb = Math.pow(Vh, 0.4996667741545416);
    const a0 = 1 + K / Q + K * K;
    k = bq(k, [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0]);
  }
  {
    const Q = 0.5003270373238773, K = Math.tan((Math.PI * 38.13547087602444) / fs);
    const a0 = 1 + K / Q + K * K;
    k = bq(k, [1 / a0, -2 / a0, 1 / a0, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0]);
  }
  const W = Math.round(0.4 * fs);
  const acc = new Float64Array(k.length + 1);
  for (let i = 0; i < k.length; i++) acc[i + 1] = acc[i] + k[i] * k[i];
  let best = k.length <= W ? acc[k.length] / W : 0;
  for (let a = 0; a + W <= k.length; a += Math.round(fs / 100)) best = Math.max(best, (acc[a + W] - acc[a]) / W);
  return -0.691 + 10 * Math.log10(best + 1e-20);
}
/** Amplitude of one frequency over a stretch of a sound (a single DFT bin). */
function line(x: Float32Array, sr: number, hz: number, a = 0, b = x.length): number {
  let re = 0;
  let im = 0;
  const w = (2 * Math.PI * hz) / sr;
  for (let i = a; i < b; i++) {
    re += x[i] * Math.cos(w * i);
    im -= x[i] * Math.sin(w * i);
  }
  return (2 * Math.hypot(re, im)) / (b - a);
}
/** Time (s) of the largest sample. */
const peakAt = (x: Float32Array, sr: number) => x.reduce((best, v, i) => (Math.abs(v) > Math.abs(x[best]) ? i : best), 0) / sr;
/** Spectral centroid (Hz) by zero-phase band energies — coarse but honest. */
function centroid(s: GaSound): number {
  const x = s.ch[0];
  let num = 0;
  let den = 0;
  const N = 2048;
  for (let k = 1; k < 200; k++) {
    const hz = (k * s.sr) / N;
    let re = 0;
    let im = 0;
    const w = (2 * Math.PI * k) / N;
    for (let i = 0; i < Math.min(N, x.length); i++) {
      re += x[i] * Math.cos(w * i);
      im -= x[i] * Math.sin(w * i);
    }
    const e = re * re + im * im;
    num += hz * e;
    den += e;
  }
  return num / den;
}

describe('the asset records', () => {
  it('every asset has a unique id, a file name, a plain label, and builds real audio', () => {
    assert.equal(new Set(GA_ASSETS.map((a) => a.id)).size, GA_ASSETS.length);
    assert.equal(new Set(GA_ASSETS.map((a) => a.file)).size, GA_ASSETS.length);
    for (const a of GA_ASSETS) {
      assert.match(a.file, /^[a-zA-Z0-9_]+\.wav$/);
      assert.ok(a.label.length > 3);
      assert.equal(a.made, 'app');
      const s = gaSound(a.id)!;
      assert.ok(s.sr === SR || s.sr === SR_BED, a.id);
      assert.ok(s.ch.length === 1 || s.ch.length === 2, a.id);
      for (const c of s.ch) {
        assert.equal(c.length, s.ch[0].length, `${a.id} channels are the same length`);
        assert.ok(c.every((v) => Number.isFinite(v)), `${a.id} has no NaN`);
        const p = peakOf(c);
        assert.ok(p > 0.05 && p <= 0.95, `${a.id} peak ${p.toFixed(3)} is audible and leaves headroom`);
      }
      assert.ok(Math.abs(c0mean(s)) < 0.02, `${a.id} has no DC offset`);
      assert.equal(gaSoundBytes(a.id), s.ch.length * s.ch[0].length * 4);
    }
  });
  it('an unknown id is null, never a stand-in', () => {
    assert.equal(gaSound('nope'), null);
    assert.equal(gaAsset('nope'), undefined);
    assert.equal(gaSoundSeconds('nope'), 0);
  });
  it('the cache can be released and rebuilds the same samples (deterministic)', () => {
    const a = Float32Array.from(gaSound('door')!.ch[0]);
    releaseGaSounds();
    const b = gaSound('door')!.ch[0];
    assert.deepEqual(Array.from(b.subarray(0, 4000)), Array.from(a.subarray(0, 4000)));
  });
});
const c0mean = (s: GaSound) => s.ch[0].reduce((m, v) => m + v, 0) / s.ch[0].length;

describe('footsteps: three surfaces, four takes each', () => {
  it('twelve one-shots, each short, each starting and ending in silence', () => {
    for (const s of GA_SURFACES) {
      for (let t = 0; t < FOOTSTEP_TAKES; t++) {
        const f = gaSound(footstepId(s, t))!;
        const x = f.ch[0];
        assert.ok(x.length / f.sr <= 0.4);
        assert.ok(Math.abs(x[0]) < 1e-3 && Math.abs(x[x.length - 1]) < 1e-3);
      }
    }
  });
  it('the four takes of a surface are different sounds, not one sound at four levels', () => {
    for (const s of GA_SURFACES) {
      for (let a = 0; a < FOOTSTEP_TAKES; a++) {
        for (let b = a + 1; b < FOOTSTEP_TAKES; b++) {
          const x = footstep(s, a).ch[0];
          const y = footstep(s, b).ch[0];
          // normalized correlation well below 1: the waveform itself differs
          let xy = 0;
          let xx = 0;
          let yy = 0;
          for (let i = 0; i < x.length; i++) {
            xy += x[i] * y[i];
            xx += x[i] * x[i];
            yy += y[i] * y[i];
          }
          assert.ok(Math.abs(xy / Math.sqrt(xx * yy)) < 0.9, `${s} take ${a + 1} vs ${b + 1}`);
        }
      }
    }
  });
  it('the surface is audible in the spectrum: wood is the darkest, gravel and stone brighter', () => {
    const c = (s: (typeof GA_SURFACES)[number]) => [0, 1, 2, 3].map((t) => centroid(footstep(s, t))).reduce((m, v) => m + v, 0) / 4;
    const wood = c('wood');
    const stone = c('stone');
    const gravel = c('gravel');
    assert.ok(stone > wood && gravel > wood, `centroid to 4.6 kHz: wood ${wood.toFixed(0)}, stone ${stone.toFixed(0)}, gravel ${gravel.toFixed(0)} Hz`);
    // and the most of its energy under 400 Hz (the board): it is the dark one
    const low = (s: (typeof GA_SURFACES)[number]) => [0, 1, 2, 3].map((t) => share(footstep(s, t).ch[0], SR, 0, 400)).reduce((m, v) => m + v, 0) / 4;
    assert.ok(low('wood') > low('stone') + 0.5 && low('wood') > low('gravel') + 0.5, `under 400 Hz: wood ${low('wood').toFixed(1)}, stone ${low('stone').toFixed(1)}, gravel ${low('gravel').toFixed(1)} dB`);
  });
  it('on a small speaker the wood step is no longer the one that vanishes (check E, problem 11)', () => {
    const loss = (s: (typeof GA_SURFACES)[number]) => [0, 1, 2, 3].map((t) => smallSpeakerLoss(footstep(s, t))).reduce((m, v) => m + v, 0) / 4;
    const wood = loss('wood');
    const stone = loss('stone');
    // it lost about 6 dB more than stone after the first fix (22 dB before it)
    assert.ok(stone - wood < 4, `wood loses ${(-wood).toFixed(1)} dB, stone ${(-stone).toFixed(1)} dB`);
    // and its heel click is a real part of it: within 12 dB of the total
    for (let t = 0; t < FOOTSTEP_TAKES; t++) {
      const x = footstep('wood', t).ch[0];
      assert.ok(share(x, SR, 1500, 4000) > -16, `take ${t + 1}: the 1.5 to 4 kHz click holds ${share(x, SR, 1500, 4000).toFixed(1)} dB of the energy`);
    }
  });
  it('a WOOD step is a heel click on board modes, not a low thump (audit 2, F10)', () => {
    for (let t = 0; t < FOOTSTEP_TAKES; t++) {
      const f = footstep('wood', t);
      const x = f.ch[0];
      const low = share(x, SR, 60, 125);
      const click = share(x, SR, 1500, 0);
      const lost = smallSpeakerLoss(f);
      // it was 75 to 83 % of the energy between 60 and 125 Hz, nothing above
      // 1.5 kHz but 4 ms of noise, and a small speaker lost 22 dB of it
      assert.ok(low < -5, `take ${t + 1}: ${low.toFixed(1)} dB of the energy is the 60-125 Hz thump (under a third)`);
      assert.ok(click > -23, `take ${t + 1}: the heel click above 1.5 kHz holds ${click.toFixed(1)} dB of the energy`);
      assert.ok(lost > -12, `take ${t + 1}: a small speaker keeps it (${lost.toFixed(1)} dB)`);
      // the board: energy between the thump and the click
      const board = share(x, SR, 300, 1400);
      assert.ok(board > -10, `take ${t + 1}: board modes 300 Hz to 1.4 kHz hold ${board.toFixed(1)} dB of the energy`);
    }
  });
  it('the three surfaces sit together in loudness: none is the quiet one', () => {
    const lu = (s: (typeof GA_SURFACES)[number]) => [0, 1, 2, 3].map((t) => loudness(footstep(s, t))).reduce((m, v) => m + v, 0) / 4;
    const all = GA_SURFACES.map(lu);
    // stone measured 8 LU under wood before the fix
    assert.ok(Math.max(...all) - Math.min(...all) < 3.5, GA_SURFACES.map((s, i) => `${s} ${all[i].toFixed(1)}`).join(', '));
  });
});

describe('the sounds the second audit sent back', () => {
  it('the crate has its own wood: the knock is no longer 15 dB under the thud (F10)', () => {
    const s = gaSound('impact')!;
    const x = s.ch[0];
    const thud = share(x, SR, 0, 125);
    const knock = share(x, SR, 350, 1400);
    assert.ok(thud < -3, `under half the energy is below 125 Hz (${thud.toFixed(1)} dB; it was 94 %)`);
    assert.ok(knock > -9, `the box's knock modes hold ${knock.toFixed(1)} dB of it`);
    assert.ok(smallSpeakerLoss(s) > -8, `a small speaker keeps it (${smallSpeakerLoss(s).toFixed(1)} dB; it lost 14)`);
    // it settles: a second, lighter knock about 90 ms after the first
    const e = blocks(x, SR, 0.01);
    assert.ok(e[9] > e[8] + 2 && e[9] < e[0] - 5, `10 ms levels around the settle: ${e.slice(7, 11).map((v) => v.toFixed(1)).join(' ')}`);
  });
  it('a closing door thuds FIRST and latches after; the opening door latches first (F13)', () => {
    const order = (id: string) => {
      const s = gaSound(id)!;
      return { thud: peakAt(band(s.ch[0], SR, 0, 300), SR), latch: peakAt(band(s.ch[0], SR, 2000, 0), SR), s };
    };
    const close = order('door_close');
    const open = order('door');
    assert.ok(close.latch - close.thud > 0.03 && close.latch - close.thud < 0.12, `thud ${(close.thud * 1000).toFixed(0)} ms, latch ${(close.latch * 1000).toFixed(0)} ms`);
    assert.ok(open.latch < open.thud, 'the opening take is unchanged: latch, hinge, thud');
    assert.equal(gaAsset('door')!.file, 'door_open.wav');
    assert.equal(gaAsset('door_close')!.role, 'one-shot');
    const x = close.s.ch[0];
    assert.ok(x.length / SR < 0.7 && Math.abs(x[0]) < 1e-3 && Math.abs(x[x.length - 1]) < 1e-3);
    assert.ok(smallSpeakerLoss(close.s) > -12, 'the frame knock is there for a small speaker');
  });
  it('the fountain is droplets over a soft bed, not a steady hiss (F11)', () => {
    const s = gaSound('fountain')!;
    const x = s.ch[0];
    assert.equal(FOUNTAIN_S, 8);
    assert.equal(s.sr, SR_BED);
    assert.equal(x.length, 8 * SR_BED);
    // 5 ms blocks: with a steady hiss none rose 8 dB over the median
    const e5 = blocks(x, s.sr, 0.005).sort((a, b) => a - b);
    const median = e5[e5.length >> 1];
    const hot = e5.filter((v) => v > median + 8).length / e5.length;
    assert.ok(hot > 0.04, `${(hot * 100).toFixed(1)} % of the 5 ms blocks stand 8 dB over the bed`);
    // and the texture is restless where the fan beside it is steady
    const spread = (id: string) => {
      const g = gaSound(id)!;
      const e = blocks(g.ch[0], g.sr, 0.05).sort((a, b) => a - b);
      return e[Math.floor(e.length * 0.95)] - e[Math.floor(e.length * 0.05)];
    };
    assert.ok(spread('fountain') > 6, `fountain ${spread('fountain').toFixed(1)} dB`);
    assert.ok(spread('gen_air') < 3, `fan ${spread('gen_air').toFixed(1)} dB`);
    // the drops are written into the ring: no half second of the loop is
    // empty of them or crowded with them
    const sec = blocks(x, s.sr, 0.5);
    assert.ok(Math.max(...sec) - Math.min(...sec) < 8, sec.map((v) => v.toFixed(1)).join(' '));
  });
  it('the courtyard bed has two gusts of different size in a pass, and no birds in it (F14)', () => {
    assert.equal(YARD_GUSTS.length, 2);
    const s = gaSound('amb_yard')!;
    for (const x of s.ch) {
      const half = blocks(x, s.sr, 0.5);
      const at = (t: number) => half[Math.floor(t / 0.5)];
      const big = Math.max(at(YARD_GUSTS[0][0] - 0.25), at(YARD_GUSTS[0][0] + 0.25));
      const small = Math.max(at(YARD_GUSTS[1][0] - 0.25), at(YARD_GUSTS[1][0] + 0.25));
      const lullBetween = Math.min(...half.slice(10, 12));
      const lullAtJoin = Math.max(half[0], half[half.length - 1]);
      assert.ok(big - small > 3 && big - small < 9, `the gusts differ in size: ${big.toFixed(1)} and ${small.toFixed(1)} dBFS`);
      assert.ok(small - lullBetween > 5, `a lull between them (${lullBetween.toFixed(1)} dBFS)`);
      assert.ok(small - lullAtJoin > 5, `and a lull at the join (${lullAtJoin.toFixed(1)} dBFS)`);
      // a bird call stood 7 to 13 dB over the wind in this band for a tenth
      // of a second; wind alone never jumps like that
      const birdBand = blocks(band(x, s.sr, 2500, 5000), s.sr, 0.1);
      let jump = 0;
      for (let i = 1; i < birdBand.length; i++) jump = Math.max(jump, Math.abs(birdBand[i] - birdBand[i - 1]));
      assert.ok(jump < 5, `largest step between tenths of a second, 2.5 to 5 kHz: ${jump.toFixed(1)} dB`);
    }
    assert.ok(!/bird/i.test(gaAsset('amb_yard')!.label), 'the record no longer promises birds');
  });
  it('the birds are three different one-shots, quiet enough to sit under speech (F14)', () => {
    assert.equal(BIRD_CALLS, 3);
    const calls = [1, 2, 3].map((k) => gaSound(`bird_${k}`)!);
    const speech = loudness(gaSound('vo_greeting')!);
    calls.forEach((c, i) => {
      const x = c.ch[0];
      assert.equal(gaAsset(`bird_${i + 1}`)!.role, 'one-shot');
      assert.equal(c.ch.length, 1);
      assert.ok(x.length / c.sr <= 0.6, `bird_${i + 1} is short`);
      assert.ok(x[0] === 0 && x[x.length - 1] === 0, 'starts and ends in silence');
      assert.ok(peakOf(x) <= 0.13, `authored quiet (peak ${peakOf(x).toFixed(3)})`);
      assert.ok(speech - loudness(c) > 8, `bird_${i + 1} is ${(speech - loudness(c)).toFixed(1)} LU under the greeting`);
      const inBand = share(x, c.sr, 2000, 6000);
      assert.ok(inBand > -2, `a whistle between 2 and 6 kHz (${inBand.toFixed(1)} dB of its energy)`);
    });
    for (let a = 0; a < 3; a++) {
      for (let b = a + 1; b < 3; b++) {
        const x = calls[a].ch[0];
        const y = calls[b].ch[0];
        const n = Math.min(x.length, y.length);
        let xy = 0;
        for (let i = 0; i < n; i++) xy += x[i] * y[i];
        assert.ok(Math.abs(xy / Math.sqrt(energy(x) * energy(y))) < 0.4, `bird_${a + 1} and bird_${b + 1} are different calls`);
      }
    }
    // the trill is a run of separate chirps; the whistles are two and three notes
    const notes = (c: GaSound) => {
      const e = blocks(c.ch[0], c.sr, 0.004);
      const top = Math.max(...e);
      let n = 0;
      for (let i = 1; i < e.length; i++) if (e[i] > top - 12 && e[i - 1] <= top - 12) n++;
      return n + (e[0] > top - 12 ? 1 : 0);
    };
    assert.deepEqual(calls.map(notes).slice(0, 2), [2, 3]);
    assert.ok(notes(calls[2]) >= 6, `the trill has ${notes(calls[2])} chirps`);
  });
  it('the generator hum reaches 2 kHz, so a phone speaker has something to play (F6c)', () => {
    const s = gaSound('gen_hum')!;
    const x = s.ch[0];
    assert.equal(GEN_HUM_PARTIALS, 40);
    const first = line(x, SR, 50);
    assert.ok(db(line(x, SR, 2000) / first) > -34, `the 2 kHz partial is ${db(line(x, SR, 2000) / first).toFixed(1)} dB re 50 Hz`);
    assert.ok(db(line(x, SR, 2050) / first) < -70, 'and it is the last one');
    // it was -16.6 dB: nearly all of it under a small speaker's reach
    assert.ok(smallSpeakerLoss(s) > -12.5, `${smallSpeakerLoss(s).toFixed(1)} dB`);
    assert.ok(share(x, SR, 0, 60) < -3, 'under half the energy is below 60 Hz (it was 73 %)');
  });
  it('the stinger: a half-beat swell with no pitch, then an open-fifth hit exactly on its lead (F9)', () => {
    const s = gaSound('mu_stinger')!;
    const x = s.ch[0];
    assert.equal(x.length, Math.round(MUSIC_STINGER_S * SR));
    assert.equal(MUSIC_STINGER_LEAD_S, 0.3125);
    const hit = Math.round(MUSIC_STINGER_LEAD_S * SR);
    const ms = (v: number) => Math.round((v / 1000) * SR);
    // the hit: the level steps up at the lead, not 420 ms in
    const before = db(rmsOf(x, hit - ms(60), hit - ms(8)));
    const after = db(rmsOf(x, hit, hit + ms(30)));
    assert.ok(after - before > 6, `the 30 ms after the line are ${(after - before).toFixed(1)} dB over the pickup's last 50 ms`);
    const later = db(rmsOf(x, hit + ms(108), hit + ms(138)));
    assert.ok(later < after + 3, 'and nothing later is louder: the accent IS at the lead');
    // the pickup is audible but well under the hit, and it has no pitch: no
    // energy where a chord would be (it was an E major chord, G sharp and all)
    const pickup = x.subarray(0, hit - ms(8));
    assert.ok(after - db(rmsOf(x, hit - ms(100), hit - ms(8))) < 18, 'the swell can be heard coming');
    assert.ok(share(pickup, SR, 0, 1000) < -25, `pickup energy below 1 kHz: ${share(pickup, SR, 0, 1000).toFixed(1)} dB`);
    // the hit is A and E only: no C (which would fight the G bar's B) and no G sharp
    const a = hit + ms(50);
    const b = hit + ms(750);
    const ref = line(x, SR, 220, a, b);
    for (const [name, hz] of [['E3', 164.81], ['E4', 329.63], ['A4', 440]] as const) assert.ok(db(line(x, SR, hz, a, b) / ref) > -8, `${name} is in the hit`);
    for (const [name, hz] of [['C4', 261.63], ['C5', 523.25], ['G#3', 207.65], ['G#4', 415.3], ['B3', 246.94]] as const) {
      assert.ok(db(line(x, SR, hz, a, b) / ref) < -20, `${name} is not (${db(line(x, SR, hz, a, b) / ref).toFixed(1)} dB re A3)`);
    }
  });
});

describe('loops', () => {
  const LOOPS = GA_ASSETS.filter((a) => a.role === 'loop' || a.role === 'music layer');
  it('every loop is exactly its stated length', () => {
    for (const a of LOOPS) {
      const s = gaSound(a.id)!;
      assert.equal(s.ch[0].length, Math.round(a.loopS! * s.sr), a.id);
    }
  });
  it('a prepared loop joins smoothly: the level across the join matches the level inside it', () => {
    for (const a of LOOPS) {
      if (a.id === 'amb_yard_raw' || a.id === 'alarm') continue;
      const s = gaSound(a.id)!;
      const x = s.ch[0];
      const w = Math.round(0.05 * s.sr);
      // the sample-to-sample step across the boundary is no bigger than the
      // steps the sound makes anywhere else
      let inside = 0;
      for (let i = 1; i < x.length; i++) inside = Math.max(inside, Math.abs(x[i] - x[i - 1]));
      assert.ok(Math.abs(x[0] - x[x.length - 1]) <= inside * 1.001, `${a.id} has no step at the join`);
      // a steady texture also keeps its LEVEL across the join; a music layer
      // need not (a bar may end quiet and the next begin on a bass note)
      if (a.role !== 'loop') continue;
      // the fountain is DROPLETS: its 50 ms level is restless everywhere, the
      // join included (they are written into the ring); compare half a second
      const wj = a.id === 'fountain' ? Math.round(0.5 * s.sr) : w;
      const tail = rmsOf(x, x.length - wj);
      const head = rmsOf(x, 0, wj);
      assert.ok(Math.abs(db(tail) - db(head)) < 9, `${a.id} level matches across the join (${db(tail).toFixed(1)} / ${db(head).toFixed(1)} dB)`);
    }
  });
  it('the UNPREPARED wind has the fault the lesson plays: a level jump of more than 10 dB at the join', () => {
    const s = gaSound('amb_yard_raw')!;
    const x = s.ch[0];
    const w = Math.round(0.4 * s.sr);
    const tail = db(rmsOf(x, x.length - w));
    const head = db(rmsOf(x, 0, w));
    assert.ok(tail - head > 10, `tail ${tail.toFixed(1)} dB, head ${head.toFixed(1)} dB`);
    const good = gaSound('amb_yard')!.ch[0];
    assert.ok(Math.abs(db(rmsOf(good, good.length - w)) - db(rmsOf(good, 0, w))) < 6);
  });
  it('the generator hum is periodic in its loop: 50 Hz and its harmonics, whole cycles', () => {
    const s = gaSound('gen_hum')!;
    assert.equal((50 * s.ch[0].length) / s.sr, 100);
  });
});

describe('music: three layers of one phrase', () => {
  it('96 BPM, 4/4, four bars: 0.625 s, 2.5 s, 10 s — and every layer is exactly one phrase', () => {
    assert.equal(MUSIC_BEAT_S, 0.625);
    assert.equal(MUSIC_BAR_S, 2.5);
    assert.equal(MUSIC_LOOP_S, 10);
    for (const l of MUSIC_LAYERS) assert.equal(musicLayer(l).ch[0].length, 10 * SR);
  });
  it('the layers are written to be stacked: together they stay under full scale', () => {
    const N = 10 * SR;
    const sum = new Float32Array(N);
    for (const l of MUSIC_LAYERS) {
      const x = gaSound(`mu_${l}`)!.ch[0];
      for (let i = 0; i < N; i++) sum[i] += x[i];
    }
    assert.ok(peakOf(sum) < 1, `summed peak ${peakOf(sum).toFixed(3)}`);
  });
  it('the drive layer puts its kick on beat 1 of every bar (the layers share the bar lines)', () => {
    const x = gaSound('mu_drive')!.ch[0];
    for (let bar = 0; bar < 4; bar++) {
      const at = Math.round(bar * MUSIC_BAR_S * SR);
      const on = rmsOf(x, at, at + Math.round(0.05 * SR));
      const before = rmsOf(x, at + Math.round(0.4 * SR), at + Math.round(0.45 * SR));
      assert.ok(on > before * 2, `bar ${bar + 1}`);
    }
  });
});

describe('the room impulse', () => {
  it('decays by about 60 dB in its stated time and starts after a short pre-delay', () => {
    const s = roomImpulse();
    const x = s.ch[0];
    assert.ok(peakOf(x.subarray(0, Math.round(0.003 * s.sr))) === 0, 'pre-delay');
    const early = db(rmsOf(x, Math.round(0.05 * s.sr), Math.round(0.15 * s.sr)));
    const late = db(rmsOf(x, Math.round((0.05 + ROOM_RT60_S / 2) * s.sr), Math.round((0.15 + ROOM_RT60_S / 2) * s.sr)));
    assert.ok(Math.abs(early - late - 30) < 6, `${(early - late).toFixed(1)} dB over half the RT60`);
  });
});
