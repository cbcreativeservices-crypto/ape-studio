/**
 * djStretch — KEY LOCK and KEY SHIFT for real (Stage 2, Screen 14): a
 * time-stretch by WSOLA (waveform-similarity overlap-add) followed by a
 * resample. Pure TypeScript; pinned by test/djStage2Engine.test.ts.
 *
 * WSOLA, the textbook method (Verhelst & Roelands): the output is built from
 * 42.7 ms Hann-windowed grains overlapping by half (they sum to exactly 1).
 * Each grain is read from the input near where the tempo says it should be,
 * but shifted up to ±10.7 ms to wherever the waveform best continues the
 * previous grain (the largest normalised cross-correlation over the overlap,
 * searched on a 4× decimated copy and then refined sample by sample). So the
 * pitch never changes while the tempo does.
 *
 * It is a SIMPLE stretch, and an honest one: at small changes it is clean;
 * past about ±10 % (or with a key shift of a few semitones) it smears drum
 * hits and sounds phasey or doubled — the artifacts every stretch has to
 * some degree. Better commercial algorithms hide them further; none removes
 * them. (The lab says this in words; it never claims studio quality.)
 *
 * The full chain for a deck: time-stretch by STRETCH, then resample by PITCH
 * (model/djKey.speedPlan): tempo = STRETCH × PITCH, sounding pitch = PITCH.
 */
import { SR, resampleLinear } from './djDsp.ts';
import type { StereoBuf } from './djMusic.ts';

export const WSOLA_N = 2048;
export const WSOLA_HOP = WSOLA_N / 2;
export const WSOLA_SEARCH = 512;
const DEC = 4;

const HANN = (() => {
  const w = new Float32Array(WSOLA_N);
  for (let i = 0; i < WSOLA_N; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / WSOLA_N));
  return w;
})();

/** Input samples (at the native rate) needed BEFORE the start time and in
 *  total, to stretch `m` output samples by `alpha`. */
export function wsolaInputPlan(m: number, alpha: number): { pre: number; total: number } {
  const pre = Math.ceil(WSOLA_HOP * alpha) + WSOLA_SEARCH + 2;
  const frames = Math.ceil((m + WSOLA_HOP) / WSOLA_HOP) + 1;
  return { pre, total: pre + Math.ceil(frames * WSOLA_HOP * alpha) + WSOLA_SEARCH + WSOLA_N + 4 };
}

/**
 * Time-stretch `x` (whose index `pre` is the start time) into `m` output
 * samples, `alpha` input samples per output sample, the pitch unchanged.
 */
export function wsola(x: StereoBuf, pre: number, alpha: number, m: number): StereoBuf {
  const N = WSOLA_N;
  const H = WSOLA_HOP;
  const D = WSOLA_SEARCH;
  const len = x.l.length;
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) mono[i] = (x.l[i] + x.r[i]) * 0.5;
  // the decimated copy for the coarse search (a box average: enough to find the lag)
  const dl = Math.floor(len / DEC);
  const dec = new Float32Array(dl);
  for (let i = 0; i < dl; i++) {
    let s = 0;
    for (let k = 0; k < DEC; k++) s += mono[i * DEC + k];
    dec[i] = s / DEC;
  }
  const outL = new Float32Array(m + H + N);
  const outR = new Float32Array(m + H + N);
  const frames = Math.ceil((m + H) / H) + 1;
  // frame 0 sits one hop BEFORE the start, so the output starts at full level
  let prev = -1;
  const ov = N - H;
  for (let k = 0; k < frames; k++) {
    const nominal = Math.round(pre - H * alpha + k * H * alpha);
    let pos = nominal;
    if (prev >= 0) {
      const nat = prev + H; // where the previous grain naturally carries on
      // coarse: decimated normalised correlation over the overlap
      const tl = Math.floor(ov / DEC);
      const n0 = Math.floor(nat / DEC);
      let best = -Infinity;
      let bestC = nominal;
      for (let c = Math.max(0, Math.floor((nominal - D) / DEC)); c <= Math.floor((nominal + D) / DEC); c++) {
        if (c + tl >= dl || n0 + tl >= dl) break;
        let xy = 0;
        let yy = 1e-9;
        for (let i = 0; i < tl; i++) {
          const a = dec[n0 + i];
          const b = dec[c + i];
          xy += a * b;
          yy += b * b;
        }
        const score = xy / Math.sqrt(yy);
        if (score > best) {
          best = score;
          bestC = c * DEC;
        }
      }
      // fine: ±DEC around the coarse lag, full resolution
      let fine = bestC;
      let fb = -Infinity;
      for (let c = Math.max(0, bestC - DEC); c <= bestC + DEC; c++) {
        if (c + ov >= len || nat + ov >= len) break;
        let xy = 0;
        let yy = 1e-9;
        for (let i = 0; i < ov; i += 2) {
          const a = mono[nat + i];
          const b = mono[c + i];
          xy += a * b;
          yy += b * b;
        }
        const score = xy / Math.sqrt(yy);
        if (score > fb) {
          fb = score;
          fine = c;
        }
      }
      pos = fine;
    }
    pos = Math.max(0, Math.min(len - N, pos));
    const o = k * H;
    for (let i = 0; i < N && o + i < outL.length; i++) {
      const w = HANN[i];
      outL[o + i] += x.l[pos + i] * w;
      outR[o + i] += x.r[pos + i] * w;
    }
    prev = pos;
  }
  return { l: outL.slice(H, H + m), r: outR.slice(H, H + m) };
}

/**
 * The deck's output through the full speed chain: `read(start, len)` gives
 * native-rate audio from track time `start`; returns `n` samples that play
 * at tempo STRETCH × PITCH and sound PITCH times higher.
 */
export function speedChain(read: (startSec: number, len: number) => StereoBuf, startSec: number, plan: { stretch: number; pitch: number }, n: number): StereoBuf {
  const { stretch, pitch } = plan;
  if (Math.abs(stretch - 1) < 1e-6) {
    // no stretch: a plain resample (speed and pitch together)
    const need = Math.ceil(n * pitch) + 2;
    const w = read(startSec, need);
    return Math.abs(pitch - 1) < 1e-9 ? { l: w.l.slice(0, n), r: w.r.slice(0, n) } : { l: resampleLinear(w.l, pitch, n), r: resampleLinear(w.r, pitch, n) };
  }
  const m = Math.ceil(n * pitch) + 2;
  const plan2 = wsolaInputPlan(m, stretch);
  const w = read(startSec - plan2.pre / SR, plan2.total);
  const st = wsola(w, plan2.pre, stretch, m);
  if (Math.abs(pitch - 1) < 1e-9) return { l: st.l.slice(0, n), r: st.r.slice(0, n) };
  return { l: resampleLinear(st.l, pitch, n), r: resampleLinear(st.r, pitch, n) };
}
