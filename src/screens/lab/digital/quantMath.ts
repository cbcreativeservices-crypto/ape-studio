/**
 * digital/quantMath — the ONE quantizer of Module 3 (Quantization & Bit Depth),
 * shared by the picture (vizQuant), the readouts (modQuant) and the tests.
 * Pure TypeScript: no React Native, no Skia.
 *
 * Owner, iPhone 2026-11-22: "In Quant and Bit Depth: adjusting level and bits
 * looks the same. bits should be showing vertical resolution changes but it
 * doesnt." The picture now draws exactly what is computed here:
 *  • the vertical axis is FULL SCALE (−1 … +1) and never moves;
 *  • the level lines ARE the quantizer: 2^bits codes, k / 2^(bits−1) for
 *    k = −2^(bits−1) … 2^(bits−1) − 1 (mid-tread, two's complement — so the
 *    top code sits one step below +full scale, the bottom one ON −full scale);
 *  • each stored sample is its sampled value rounded to the nearest level and
 *    HELD until the next sample (a staircase on the level lines);
 *  • LEVEL only changes the sine's height against that grid; BITS only changes
 *    how many levels the grid has.
 */

/** Mid-tread two's-complement code of x (−1 … +1) at `bits`. */
export function quantCode(x: number, bits: number): number {
  const half = Math.pow(2, bits - 1);
  const c = Math.max(-half, Math.min(half - 1, Math.round(x * half)));
  return c === 0 ? 0 : c; // never −0 (Math.round(−0.3) is −0)
}

/** The level x is stored as: its code over 2^(bits−1). Δ = 1 / 2^(bits−1). */
export function quantizeNorm(x: number, bits: number): number {
  return quantCode(x, bits) / Math.pow(2, bits - 1);
}

/** 2^bits levels. */
export function quantLevelCount(bits: number): number {
  return Math.pow(2, bits);
}

/** One step, in units of full-scale PEAK (the readout's "1/N FS"). */
export function quantStep(bits: number): number {
  return 1 / Math.pow(2, bits - 1);
}

/** Every level, bottom to top (only ever asked for when the lines are drawn). */
export function quantLevelValues(bits: number): number[] {
  const half = Math.pow(2, bits - 1);
  const out: number[] = [];
  for (let k = -half; k <= half - 1; k++) out.push(k / half);
  return out;
}

/** Below this spacing (screen px) single level lines would blur into a moiré,
 *  so the levels are shown as one honest shaded band instead. */
export const QUANT_MIN_LINE_PX = 3;

/** On screen, one step is (full-scale span in px) / 2^bits. */
export function quantStepPx(bits: number, fullScaleSpanPx: number): number {
  return fullScaleSpanPx / quantLevelCount(bits);
}

export type QuantGridMode = 'lines' | 'band';

/** 'lines' when every level can be drawn as its own line, else 'band'. */
export function quantGridMode(bits: number, fullScaleSpanPx: number): QuantGridMode {
  return quantStepPx(bits, fullScaleSpanPx) >= QUANT_MIN_LINE_PX ? 'lines' : 'band';
}

/** The test tone: two cycles of a sine across the glass. */
export const QUANT_CYCLES = 2;
/** Sample instants across the glass: 16 per cycle (the blue dots). */
export const QUANT_SAMPLES = 32;

export function levelDbToAmp(levelDb: number): number {
  return Math.pow(10, levelDb / 20);
}

/** The continuous original at t (0 … 1 across the glass). */
export function quantSine(t: number, levelDb: number): number {
  return levelDbToAmp(levelDb) * Math.sin(2 * Math.PI * QUANT_CYCLES * t);
}

export type QuantSample = {
  /** Sample instant, 0 … 1 across the glass. */
  t: number;
  /** The sampled (exact) value. */
  v: number;
  /** Its code. */
  code: number;
  /** The stored value: the nearest level. */
  q: number;
};

/** The samples the picture draws: blue dot v, its stored level q (which lies
 *  on the green trace), red v − q. */
export function quantSamples(bits: number, levelDb: number): QuantSample[] {
  const half = Math.pow(2, bits - 1);
  const out: QuantSample[] = [];
  for (let i = 0; i < QUANT_SAMPLES; i++) {
    const t = i / QUANT_SAMPLES;
    const v = quantSine(t, levelDb);
    const code = quantCode(v, bits);
    out.push({ t, v, code, q: code / half });
  }
  return out;
}

/** Above this many threshold crossings the green trace is drawn densely
 *  instead of riser by riser (the steps are then far below a pixel). */
export const QUANT_MAX_RISERS = 2048;

/** One flat run of the green trace: from t0 to t1 the original rounds to `code`. */
export type QuantRun = { t0: number; t1: number; code: number; q: number };

/**
 * The GREEN trace: the original rounded to the levels at EVERY instant,
 * green(t) = quantize(amber(t)), so it shows amplitude rounding only, never a
 * hold in time. Flat runs sit on the level lines; each riser is placed (by
 * bisection) exactly where the original crosses a decision threshold, and is
 * exactly one level tall. At 3 bits a few big steps; from about 8 bits the
 * steps are smaller than a pixel and green lies on the original.
 *
 * Coordinator, after seeing it in the app (2026-11-22): the first version held
 * each of 32 samples, so its steps came from TIME and 8- to 24-bit still looked
 * coarsely stepped — "bits should be showing vertical resolution changes".
 */
export function quantStaircase(bits: number, levelDb: number): QuantRun[] {
  const half = Math.pow(2, bits - 1);
  const f = (t: number) => quantSine(t, levelDb);
  const cAt = (t: number) => quantCode(f(t), bits);
  const M = 2048;
  // A sine crosses about 4·amp·2^(N−1) thresholds per cycle. Past
  // QUANT_MAX_RISERS (from about 12 bits at full scale) every step is far
  // below a pixel, so the trace is the rounding evaluated densely: M runs,
  // each centred on its point — still exact levels, still green(t) =
  // quantize(amber(t)) at every point, and within a third of a pixel of the
  // original on a phone glass. (Drawing every riser at 24 bits would mean
  // millions of path points.)
  const crossings = 4 * levelDbToAmp(levelDb) * half * QUANT_CYCLES;
  if (crossings > QUANT_MAX_RISERS) {
    const dense: QuantRun[] = [];
    for (let i = 0; i <= M; i++) {
      const code = cAt(i / M);
      const t0 = Math.max(0, (i - 0.5) / M);
      const t1 = Math.min(1, (i + 0.5) / M);
      const last = dense[dense.length - 1];
      if (last && last.code === code) last.t1 = t1;
      else dense.push({ t0, t1, code, q: code / half });
    }
    return dense;
  }
  const edges: { t: number; code: number }[] = [];
  /** Find every threshold crossing in (ta, tb], where the code goes ca → cb. */
  const refine = (ta: number, tb: number, ca: number, cb: number, depth: number) => {
    if (ca === cb) return;
    if (Math.abs(cb - ca) > 1 && depth < 30) {
      const tm = (ta + tb) / 2;
      const cm = cAt(tm);
      refine(ta, tm, ca, cm, depth + 1);
      refine(tm, tb, cm, cb, depth + 1);
      return;
    }
    // One threshold between ca and cb: bisect to it.
    let lo = ta;
    let hi = tb;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (cAt(mid) === ca) lo = mid;
      else hi = mid;
    }
    edges.push({ t: hi, code: cb });
  };
  let prevT = 0;
  let prevC = cAt(0);
  const first = prevC;
  for (let i = 1; i <= M; i++) {
    const t = i / M;
    const c = cAt(t);
    refine(prevT, t, prevC, c, 0);
    prevT = t;
    prevC = c;
  }
  const runs: QuantRun[] = [];
  let t0 = 0;
  let code = first;
  for (const e of edges) {
    if (e.t > t0) runs.push({ t0, t1: e.t, code, q: code / half });
    t0 = e.t;
    code = e.code;
  }
  runs.push({ t0, t1: 1, code, q: code / half });
  return runs;
}

/** How many levels the sine spans, lowest code to highest: the steps a quiet
 *  wave actually gets to use ("quantization bites hardest on quiet signals"). */
export function quantLevelsUsed(bits: number, levelDb: number): number {
  const amp = levelDbToAmp(levelDb);
  return quantCode(amp, bits) - quantCode(-amp, bits) + 1;
}

/** RMS of the rounding error of the sine at `amp` peak through N bits, dBFS. */
export function quantErrorRmsDb(bits: number, amp: number): number {
  let acc = 0;
  const M = 512;
  for (let i = 0; i < M; i++) {
    const x = amp * Math.sin((2 * Math.PI * i) / M);
    const e = x - quantizeNorm(x, bits);
    acc += e * e;
  }
  const rms = Math.sqrt(acc / M);
  return rms > 0 ? 20 * Math.log10(rms) : Number.NEGATIVE_INFINITY;
}
