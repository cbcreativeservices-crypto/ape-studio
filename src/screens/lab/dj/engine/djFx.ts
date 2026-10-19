/**
 * djFx — the effects unit's DSP (Stage 2, Screen 13). Pure TypeScript on
 * Float32Array, no React Native; the model (routes, times, the dry/wet law)
 * is model/djEffects.ts. Pinned by test/djStage2Fx.test.ts.
 *
 * Every effect returns its WET signal only; the caller mixes it (insert /
 * MASTER: the dry/wet law; SEND: wet × RETURN). Each keeps its state in an
 * FxCarry that the booth's next contiguous chunk continues, and that a
 * re-render inside a chunk REBUILDS by replaying the chunk's own input
 * (fxReplay) — so an echo keeps ringing when a fader moves.
 *
 *   ECHO     a stereo delay line, the delay set in beats at the source deck's
 *            played tempo; FEEDBACK sends the output back in (one repeat at 0,
 *            fading repeats above), through a 6 kHz one-pole low-pass so each
 *            repeat is a little darker (as most digital echoes do).
 *   REVERB   a Schroeder–Moorer network (eight damped combs in parallel, four
 *            all-passes in series, the right channel's lines a little longer),
 *            each comb's feedback set from the decay time:
 *            g = 10^(−3·delay / RT60).
 *   FILTER   a resonant low-pass (state-variable, Q 3) whose cutoff sweeps
 *            200 Hz ↔ 8 kHz on a triangle, one sweep per TIME, locked to the
 *            deck's beat.
 *   FLANGER  a short modulated delay (0.6 – 5.6 ms) on a beat-locked triangle,
 *            FEEDBACK sharpening the comb.
 *
 * A RETURN LOOP (the return brought back in on a channel that also feeds the
 * send) is a second, outer feedback path with its own gain and a 10 ms delay
 * (the mixer's own path); while it is in, the unit's output is held under
 * LOOP_SAFE_CEILING by a soft limiter — a real loop climbs until something
 * clips at full scale. The lab never plays that.
 */
import { SR } from './djDsp.ts';
import { FX_MAX_DELAY_S, LOOP_SAFE_CEILING, fbGain, fxTimeSec, type FxState } from '../model/djEffects.ts';

/* ── state ────────────────────────────────────────────────────────────── */

const LINE_N = Math.ceil(FX_MAX_DELAY_S * SR) + 4;
const LOOP_N = Math.round(0.01 * SR);
const COMB_44 = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const AP_44 = [556, 441, 341, 225];
const SPREAD = 23;
const scale48 = (n: number) => Math.round((n * SR) / 44100);
const COMB = COMB_44.map(scale48);
const AP = AP_44.map(scale48);

type Comb = { buf: Float32Array; i: number; lp: number };
type Ap = { buf: Float32Array; i: number };
type Side = { line: Float32Array; lp: number; combs: Comb[]; aps: Ap[]; ic1: number; ic2: number; loop: Float32Array };

export type FxCarry = { w: number; li: number; L: Side; R: Side };

function side(extra: number): Side {
  return {
    line: new Float32Array(LINE_N),
    lp: 0,
    combs: COMB.map((n) => ({ buf: new Float32Array(n + extra), i: 0, lp: 0 })),
    aps: AP.map((n) => ({ buf: new Float32Array(n + extra), i: 0 })),
    ic1: 0,
    ic2: 0,
    loop: new Float32Array(LOOP_N),
  };
}

export const freshFxCarry = (): FxCarry => ({ w: 0, li: 0, L: side(0), R: side(SPREAD) });

const cloneSide = (s: Side): Side => ({
  line: s.line.slice(),
  lp: s.lp,
  combs: s.combs.map((c) => ({ buf: c.buf.slice(), i: c.i, lp: c.lp })),
  aps: s.aps.map((a) => ({ buf: a.buf.slice(), i: a.i })),
  ic1: s.ic1,
  ic2: s.ic2,
  loop: s.loop.slice(),
});
export const cloneFxCarry = (c: FxCarry): FxCarry => ({ w: c.w, li: c.li, L: cloneSide(c.L), R: cloneSide(c.R) });

/* ── one block ────────────────────────────────────────────────────────── */

export type FxRun = {
  fx: FxState;
  /** The tempo the TIME follows (played BPM of the source deck). */
  bpm: number;
  /** The source deck's beat count at the block's first sample (beat-locked
   *  sweeps). */
  beat0: number;
  /** Feed the effect (FX ON); off, it only rings out. */
  feed: boolean;
  /** An outer RETURN LOOP's gain (0 = none). */
  loopGain: number;
};

const tri = (ph: number) => {
  const f = ph - Math.floor(ph);
  return f < 0.5 ? f * 2 : 2 - f * 2;
};

/**
 * Run the effect over `inL/inR` (n samples), mutating `st`; returns the WET
 * signal. A deterministic function of (st, run, input), which is what lets a
 * re-render rebuild the state at any moment (fxReplay).
 */
export function fxProcess(run: FxRun, inL: Float32Array, inR: Float32Array, st: FxCarry): { l: Float32Array; r: Float32Array } {
  const n = inL.length;
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  const { fx, bpm, beat0, feed, loopGain } = run;
  const fb = fbGain(fx);
  const T = fxTimeSec(fx, bpm);
  const lg = Math.max(0, loopGain);
  const limit = lg > 0;
  const C = LOOP_SAFE_CEILING;
  const beatsPerSample = bpm / 60 / SR;
  let w = st.w;
  let li = st.li;
  const sides: [Side, Float32Array, Float32Array][] = [
    [st.L, inL, outL],
    [st.R, inR, outR],
  ];
  if (fx.type === 'ECHO') {
    const D = Math.max(1, Math.min(LINE_N - 2, Math.round(T * SR)));
    const a = 1 - Math.exp((-2 * Math.PI * 6000) / SR);
    for (let i = 0; i < n; i++) {
      const rd = (w - D + LINE_N) % LINE_N;
      for (const [s, x, o] of sides) {
        let y = s.line[rd];
        if (limit) y = C * Math.tanh(y / C);
        s.lp += a * (y - s.lp);
        const back = lg > 0 ? lg * s.loop[li] : 0;
        s.line[w] = (feed ? x[i] : 0) + back + fb * s.lp;
        if (lg > 0) s.loop[li] = y;
        o[i] = y;
      }
      w = (w + 1) % LINE_N;
      li = (li + 1) % LOOP_N;
    }
  } else if (fx.type === 'REVERB') {
    const rt = Math.max(0.2, T);
    const damp = 0.28;
    const gIn = 0.055;
    for (const [s, x, o] of sides) {
      const g = s.combs.map((c) => Math.pow(10, (-3 * c.buf.length) / (rt * SR)));
      let lii = li;
      for (let i = 0; i < n; i++) {
        const back = lg > 0 ? lg * s.loop[lii] : 0;
        const xin = ((feed ? x[i] : 0) + back) * gIn;
        let acc = 0;
        for (let k = 0; k < s.combs.length; k++) {
          const c = s.combs[k];
          const y = c.buf[c.i];
          c.lp = y * (1 - damp) + c.lp * damp;
          c.buf[c.i] = xin + c.lp * g[k];
          c.i = c.i + 1 === c.buf.length ? 0 : c.i + 1;
          acc += y;
        }
        for (const ap of s.aps) {
          const b = ap.buf[ap.i];
          const y = -acc + b;
          ap.buf[ap.i] = acc + b * 0.5;
          ap.i = ap.i + 1 === ap.buf.length ? 0 : ap.i + 1;
          acc = y;
        }
        let y = acc;
        if (limit) y = C * Math.tanh(y / C);
        if (lg > 0) s.loop[lii] = y;
        o[i] = y;
        lii = (lii + 1) % LOOP_N;
      }
    }
    li = (li + n) % LOOP_N;
  } else if (fx.type === 'FILTER') {
    const q = 3;
    const k = 1 / q;
    for (const [s, x, o] of sides) {
      let a1 = 0;
      let a2 = 0;
      let a3 = 0;
      let lii = li;
      for (let i = 0; i < n; i++) {
        if (i % 16 === 0) {
          const ph = (beat0 + i * beatsPerSample) / Math.max(0.25, periodBeats(fx));
          const fc = 200 * Math.pow(8000 / 200, tri(ph));
          const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
          a1 = 1 / (1 + g * (g + k));
          a2 = g * a1;
          a3 = g * a2;
        }
        const back = lg > 0 ? lg * s.loop[lii] : 0;
        const xin = (feed ? x[i] : 0) + back;
        const v3 = xin - s.ic2;
        const v1 = a1 * s.ic1 + a2 * v3;
        const v2 = s.ic2 + a2 * s.ic1 + a3 * v3;
        s.ic1 = 2 * v1 - s.ic1;
        s.ic2 = 2 * v2 - s.ic2;
        let y = v2;
        if (limit) y = C * Math.tanh(y / C);
        if (lg > 0) s.loop[lii] = y;
        o[i] = y;
        lii = (lii + 1) % LOOP_N;
      }
    }
    li = (li + n) % LOOP_N;
  } else {
    // FLANGER: a fractional read 0.6 … 5.6 ms behind the write head
    for (let i = 0; i < n; i++) {
      const ph = (beat0 + i * beatsPerSample) / Math.max(0.25, periodBeats(fx));
      const dS = (0.0006 + 0.005 * tri(ph)) * SR;
      const rp = w - dS;
      const r0 = Math.floor(rp);
      const fr = rp - r0;
      const i0 = (r0 + LINE_N) % LINE_N;
      const i1 = (i0 + 1) % LINE_N;
      for (const [s, x, o] of sides) {
        let y = s.line[i0] * (1 - fr) + s.line[i1] * fr;
        if (limit) y = C * Math.tanh(y / C);
        const back = lg > 0 ? lg * s.loop[li] : 0;
        s.line[w] = (feed ? x[i] : 0) + back + fb * 0.9 * y;
        if (lg > 0) s.loop[li] = y;
        o[i] = y;
      }
      w = (w + 1) % LINE_N;
      li = (li + 1) % LOOP_N;
    }
  }
  st.w = w;
  st.li = li;
  return { l: outL, r: outR };
}

/** FILTER / FLANGER: beats per sweep. */
function periodBeats(fx: FxState): number {
  const t = fxTimeSec(fx, 60); // at 60 BPM, seconds = beats
  return t;
}

/* ── replay: the state at any moment inside a rendered chunk ──────────── */

export type FxTrace = { start: FxCarry; run: FxRun; inL: Float32Array; inR: Float32Array };

/** The unit's state `k` samples into a traced block (a re-render that starts
 *  inside a chunk continues the effect's tail from exactly there). */
export function fxReplay(tr: FxTrace, k: number): FxCarry {
  const st = cloneFxCarry(tr.start);
  const m = Math.max(0, Math.min(tr.inL.length, Math.round(k)));
  if (m > 0) fxProcess(tr.run, tr.inL.subarray(0, m), tr.inR.subarray(0, m), st);
  return st;
}

/** Is there anything left ringing in the unit (worth processing)? */
export function fxRinging(st: FxCarry): boolean {
  for (const s of [st.L, st.R]) {
    for (let i = 0; i < s.line.length; i += 97) if (Math.abs(s.line[i]) > 1e-5) return true;
    for (const c of s.combs) for (let i = 0; i < c.buf.length; i += 13) if (Math.abs(c.buf[i]) > 1e-5) return true;
    if (Math.abs(s.ic1) > 1e-6 || Math.abs(s.ic2) > 1e-6) return true;
  }
  return false;
}
