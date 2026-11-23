/**
 * digital/timeBase — ONE time base for every moving trace in the Digital Audio
 * Sampling & Conversion Lab. Pure, worklet-safe TypeScript (no React Native,
 * no Skia), so the node tests reach the very functions the UI thread runs.
 *
 * Owner, iPhone 2026-11-22: "in digital processing and analog to digital (and
 * maybe others?) the wave form transforms after the present moment which look
 * odd. Once a wave form has happend, it should not become some other waveform
 * later in time...."
 *
 * The cause was the same everywhere: a trace drawn as y = f(u, phase) whose
 * terms did not move together — a second partial riding `phase × 1.4` (or
 * × 1.5, × 1.6) while the first rode `phase`, sample instants pinned to the
 * glass while the wave slid under them, or noise re-seeded every few frames.
 *
 * The rule now: a trace is ONE signal s(θ) of signal time θ (radians of its
 * fundamental). The clock (the lab's usePhaseClock) is the signal time at the
 * "now" edge of the glass; position u ∈ [0, 1] maps to θ through
 * thetaAtU(). The value drawn for a given θ is s(θ) on every frame until it
 * leaves the glass. Sampled things (held steps, sample dots, clock ticks, bit
 * cells, noise) sit on a FIXED signal-time grid θ_k = k·dθ and are indexed by
 * k, so they travel with the wave instead of being re-measured.
 *
 * A control (drive, gain, trim) may re-process the whole visible window — the
 * picture is "what this stage does to this signal" — but time alone never
 * changes a drawn stretch.
 */

/** Signal time at window position u.
 *  dir = +1: the NEWEST signal is at the RIGHT edge (u = 1) and the trace
 *            travels left (a chart recorder / scrolling scope).
 *  dir = −1: the newest signal is at the LEFT edge (u = 0) and the trace
 *            travels right (a wave leaving the source on the left). */
export function thetaAtU(u: number, clock: number, span: number, dir: number): number {
  'worklet';
  return dir > 0 ? clock - (1 - u) * span : clock - u * span;
}

/** Inverse of thetaAtU: where signal time θ sits on the glass at this clock. */
export function uAtTheta(theta: number, clock: number, span: number, dir: number): number {
  'worklet';
  return dir > 0 ? 1 - (clock - theta) / span : (clock - theta) / span;
}

/**
 * A rigid trace: vertices on the fixed grid θ_j = j·dθ inside the window,
 * plus the two glass edges, each interpolated on the grid segment that crosses
 * it (so the edge point is the drawn line's own value there). Returns a flat
 * [u0, v0, u1, v1, …] ordered by u ascending. The value at vertex j is f(j, θ_j)
 * — the same on every frame.
 */
export function rigidTrace(
  clock: number,
  span: number,
  dir: number,
  dTheta: number,
  f: (j: number, theta: number) => number,
): number[] {
  'worklet';
  const lo = clock - span;
  const hi = clock;
  const j0 = Math.ceil(lo / dTheta - 1e-9);
  const j1 = Math.floor(hi / dTheta + 1e-9);
  const th: number[] = [];
  const vs: number[] = [];
  // Old edge (interpolated between j0 − 1 and j0).
  if (j0 * dTheta > lo + 1e-12) {
    const a = f(j0 - 1, (j0 - 1) * dTheta);
    const b = f(j0, j0 * dTheta);
    const fr = (lo - (j0 - 1) * dTheta) / dTheta;
    th.push(lo);
    vs.push(a + (b - a) * fr);
  }
  for (let j = j0; j <= j1; j++) {
    th.push(j * dTheta);
    vs.push(f(j, j * dTheta));
  }
  // Now edge (interpolated between j1 and j1 + 1).
  if (j1 * dTheta < hi - 1e-12) {
    const a = f(j1, j1 * dTheta);
    const b = f(j1 + 1, (j1 + 1) * dTheta);
    const fr = (hi - j1 * dTheta) / dTheta;
    th.push(hi);
    vs.push(a + (b - a) * fr);
  }
  const out: number[] = [];
  const n = th.length;
  for (let i = 0; i < n; i++) {
    const k = dir > 0 ? i : n - 1 - i;
    out.push(uAtTheta(th[k], clock, span, dir), vs[k]);
  }
  return out;
}

/**
 * Sample-and-hold segments on the fixed sample grid θ_k = k·dθ: sample k holds
 * f(k, θ_k) from θ_k + startFrac·dθ until θ_{k+1}, clipped to the window (never
 * past "now"). Returns a flat [uA, uB, v, k, …] ordered by uA ascending.
 * startFrac > 0 models a value released a little after its sample instant.
 */
export function heldSegments(
  clock: number,
  span: number,
  dir: number,
  dTheta: number,
  f: (k: number, theta: number) => number,
  startFrac: number,
): number[] {
  'worklet';
  const lo = clock - span;
  const hi = clock;
  const k0 = Math.floor(lo / dTheta - 1e-9);
  const k1 = Math.floor(hi / dTheta + 1e-9);
  const segs: number[][] = [];
  for (let k = k0; k <= k1; k++) {
    const a = Math.max(lo, k * dTheta + startFrac * dTheta);
    const b = Math.min(hi, (k + 1) * dTheta);
    if (b <= a) continue;
    const ua = uAtTheta(a, clock, span, dir);
    const ub = uAtTheta(b, clock, span, dir);
    segs.push([Math.min(ua, ub), Math.max(ua, ub), f(k, k * dTheta), k]);
  }
  if (dir < 0) segs.reverse();
  const out: number[] = [];
  for (const s of segs) out.push(s[0], s[1], s[2], s[3]);
  return out;
}

/** Sample instants θ_k = k·dθ on the glass: a flat [u, θ_k, k, …], u ascending. */
export function sampleInstants(clock: number, span: number, dir: number, dTheta: number): number[] {
  'worklet';
  const lo = clock - span;
  const hi = clock;
  const k0 = Math.ceil(lo / dTheta - 1e-9);
  const k1 = Math.floor(hi / dTheta + 1e-9);
  const out: number[] = [];
  if (dir > 0) {
    for (let k = k0; k <= k1; k++) out.push(uAtTheta(k * dTheta, clock, span, dir), k * dTheta, k);
  } else {
    for (let k = k1; k >= k0; k--) out.push(uAtTheta(k * dTheta, clock, span, dir), k * dTheta, k);
  }
  return out;
}

/** Deterministic 0 … 1 hash of an integer index (noise, bit cells, jitter). */
export function hashIndex(n: number): number {
  'worklet';
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

const TAU = 2 * Math.PI;

function peakAbs(f: (th: number) => number, period: number): number {
  let m = 0;
  for (let i = 0; i < 4096; i++) m = Math.max(m, Math.abs(f((i / 4096) * period)));
  return m > 0 ? m : 1;
}

// ── Module 5 · GAIN STAGING ─────────────────────────────────────────────────
// One periodic program signal (fundamental + its 3rd partial), normalized so
// its true peak is EXACTLY 1: the PEAK / DIG / ANLG readouts, which assume a
// unit peak, are then the peak of the drawn wave (the old two-speed sum
// wandered between ≈0.8 and 1.0 of what the meters claimed).
export const GAIN_CYCLES = 2.2;
export const GAIN_SPAN = TAU * GAIN_CYCLES;
function gainRaw(th: number): number {
  'worklet';
  return 0.72 * Math.sin(th) + 0.28 * Math.sin(3 * th + 1.1);
}
export const GAIN_NORM = peakAbs(gainRaw, TAU);
export function gainSignal(th: number): number {
  'worklet';
  return gainRaw(th) / GAIN_NORM;
}
/** The recorded value: analog saturation at the rail (tanh), then the digital
 *  clamp at full scale. g = linear drive, rail = linear analog rail. */
export function gainRecorded(s: number, g: number, rail: number): number {
  'worklet';
  const ya = rail * Math.tanh((g * s) / rail);
  return Math.max(-1, Math.min(1, ya));
}
/** The analog stage's own output (before the converter's clamp). */
export function gainAnalog(s: number, g: number, rail: number): number {
  'worklet';
  return rail * Math.tanh((g * s) / rail);
}
/** Noise-floor fuzz, one value per grid index (drawn exaggerated). */
export const GAIN_NOISE_STEPS = 90;
export function gainNoise(j: number): number {
  'worklet';
  return hashIndex(j * 1.7 + 0.31) * 2 - 1;
}

// ── Module 6 · FLOAT vs FIXED (one bus, two panes) ─────────────────────────
// Fundamental + 2nd partial, normalized to a true |peak| of exactly 1, so the
// bus is −6 dBFS + GAIN as the FLOAT BUS readout says.
export const HEADROOM_CYCLES = 1.8;
export const HEADROOM_SPAN = TAU * HEADROOM_CYCLES;
function headroomRaw(th: number): number {
  'worklet';
  return 0.62 * Math.sin(th) + 0.38 * Math.sin(2 * th + 2.1);
}
export const HEADROOM_NORM = peakAbs(headroomRaw, TAU);
export function headroomSignal(th: number): number {
  'worklet';
  return headroomRaw(th) / HEADROOM_NORM;
}
/** Both panes at one signal time: the float bus (gain, then trim), and the
 *  fixed render (clamped at full scale FIRST, then trimmed). gLin = bus gain,
 *  tLin = downstream trim. `over` is true where the fixed render flat-tops. */
export function headroomAt(th: number, gLin: number, tLin: number): { float: number; fixed: number; over: boolean } {
  'worklet';
  const raw = 0.5 * headroomSignal(th) * gLin;
  return { float: raw * tLin, fixed: Math.max(-1, Math.min(1, raw)) * tLin, over: Math.abs(raw) > 1 };
}

// ── Module 5 · THE CONVERSION CHAIN strip (one window per tile) ────────────
export const CHAIN_CYCLES = 2.1;
export const CHAIN_SPAN = TAU * CHAIN_CYCLES;
/** The mic's raw signal: two partials that keep their ratio (5.3 : 2.1). */
export function chainRaw(th: number): number {
  'worklet';
  return 0.55 * (0.62 * Math.sin(th) + 0.28 * Math.sin((5.3 / 2.1) * th + 1.3));
}
export function chainAmped(th: number): number {
  'worklet';
  return Math.tanh(1.5 * (chainRaw(th) / 0.55));
}
/** After the anti-aliasing filter: the upper partial removed. */
export function chainSmooth(th: number): number {
  'worklet';
  return 0.85 * Math.sin(th);
}
/** Seven samples across a tile's window. */
export const CHAIN_SAMPLE_DT = CHAIN_SPAN / 7;
/** The quantizer's coarse levels in the glyph: half-steps of full scale. */
export function chainSnap(v: number): number {
  'worklet';
  return Math.round(v * 2) / 2;
}

// ── Module 5 · SAMPLE & HOLD ────────────────────────────────────────────────
export const SH_CYCLES = 1.45;
export const SH_SPAN = TAU * SH_CYCLES;
export const SH_TICKS = 9;
export const SH_DT = SH_SPAN / SH_TICKS;
/** The released code: rounded to 8 levels. */
export function shCode(v: number): number {
  'worklet';
  return Math.round(v * 3.5) / 3.5;
}
/** The code is released this fraction of a tick after its sample instant. */
export const SH_RELEASE = 0.3;

// ── Module 8 · JITTER ───────────────────────────────────────────────────────
/** The k-th sample's timing error, −1 … +1 (times the drawn amount): random
 *  per sample, or a periodic wobble — a property of THAT sample, so it travels
 *  with it. */
export function jitterOf(k: number, periodic: boolean): number {
  'worklet';
  return periodic ? Math.sin((k / 13) * Math.PI * 5) : hashIndex(k * 127.3 + 7.7) * 2 - 1;
}
