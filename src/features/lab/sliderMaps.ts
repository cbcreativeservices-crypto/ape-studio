/**
 * Pure slider → picture mappings (slider pass Part 3, 2026-10-14). Owner rule:
 * every bottom-dock slider visibly does something, progresses smoothly and
 * evenly, and never pauses. These are the mappings that were stepping, dead
 * or flat; they live here (no React / RN imports) so node tests pin them.
 */

/* ── Signal generator scope (S1) ──────────────────────────────────────── */

/** Representative on-screen cycle count for a frequency (log scale, 1–12). */
export const scopeCyclesFor = (hz: number): number =>
  Math.max(1, Math.min(12, 1 + Math.log10(Math.max(20, hz) / 20) * 2.2));

/** Cycles drawn for the sine / burst scope — CONTINUOUS in frequency (the old
 *  Math.round gave the whole FREQ sweep about six visual states). */
export const sineScopeCycles = (hz: number): number => scopeCyclesFor(hz) * 1.2;

/* ── Envelope lab log-time sliders (S2) ───────────────────────────────── */

/** Slider position (log10 ms) → ms. Position 0 IS 0 ms (an honest zero);
 *  below 10 ms the value keeps 0.1 ms resolution so the low end of the lane
 *  is not a staircase of whole milliseconds. */
export const envLogMs = (v: number): number => {
  if (v <= 0) return 0;
  const p = Math.pow(10, v);
  return p < 10 ? Math.round(p * 10) / 10 : Math.round(p);
};

/** ms → slider position. A non-zero time never maps to position 0 (which
 *  reads 0 ms): it sits at least one step (0.02) up the lane. */
export const envToLog = (m: number): number => (m <= 0 ? 0 : Math.max(0.02, Math.log10(m)));

/** Envelope time readout: a fractional time below 10 ms keeps its one
 *  decimal (the lane's 0.1 ms steps), whole ms to 1 s, then seconds. */
export const fmtEnvMs = (v: number): string =>
  v >= 1000
    ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} s`
    : v > 0 && v < 10 && !Number.isInteger(v)
      ? `${v.toFixed(1)} ms`
      : `${Math.round(v)} ms`;

/* ── Delay echo pictures (E1) ─────────────────────────────────────────── */

/** FIXED time window of the delay pictures (= 6.5 × the 500 ms lane top). A
 *  window that followed TIME (max(time × 6.5, 500)) kept the echo spacing
 *  constant for every TIME ≥ 77 ms — the lane did nothing visible. */
export const ECHO_SPAN_MS = 3250;

/** Echo spacing as a fraction of the window — grows with TIME. */
export const echoSpacingFrac = (timeMs: number): number => timeMs / ECHO_SPAN_MS;

/* ── Two-significant-figure snap (E6) ─────────────────────────────────── */

/** Snap that keeps ≥ 2 significant figures: hundredths below 1, tenths above
 *  (a 0.1 step below 1 is a 25 % jump at 0.4 — the lane stepped visibly). */
export const snap2sig = (v: number): number => (v < 1 ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10);
/** Matching readout: two decimals below 1, one above. */
export const fmt2sig = (v: number): string => (v < 1 ? v.toFixed(2) : v.toFixed(1));

/* ── EQ Q lane (E7) ───────────────────────────────────────────────────── */

export const Q_LANE_MAX = 12;
/** The lane's bottom Q: the notch is drawn with Q ≥ 1, so its lane starts at
 *  1 (a 0.3 floor left the bottom third of the lane dead). */
export const qLaneMin = (notch: boolean): number => (notch ? 1 : 0.3);
export const qFromLane = (t: number, qMin: number): number =>
  qMin * Math.pow(Q_LANE_MAX / qMin, Math.max(0, Math.min(1, t)));
export const laneFromQ = (q: number, qMin: number): number =>
  Math.max(0, Math.min(1, Math.log(Math.max(qMin, q) / qMin) / Math.log(Q_LANE_MAX / qMin)));

/* ── De-esser gain-reduction scale (E8) ───────────────────────────────── */

/** The GR panel's FIXED full scale: Range is drawn as a cap line on it, so
 *  raising Range never shrinks the bars. */
export const DEESSER_GR_SCALE_DB = 24;
/** 0..1 depth of a gain reduction on the fixed scale. */
export const grDepthFrac = (grDb: number): number => Math.max(0, Math.min(DEESSER_GR_SCALE_DB, grDb)) / DEESSER_GR_SCALE_DB;

/* ── EQ gain lanes (E10) ──────────────────────────────────────────────── */

/** The ±range dB gain lane: 0.5-dB steps, symmetric, so the lane centre IS
 *  0 dB — its double-tap home. */
export const eqGainFromLane = (t: number, rangeDb: number): number => Math.round((t * 2 * rangeDb - rangeDb) * 2) / 2 || 0;
export const EQ_GAIN_HOME = 0.5;

/* ── Response-curve sampling (E5) ─────────────────────────────────────── */

/** Default point count along the 20 Hz–20 kHz log axis (was 96 — a narrow
 *  notch fell between samples and drew shallow). */
export const RESPONSE_SAMPLES = 384;

/** The sample frequencies: `n + 1` log-spaced points, plus every `focusHz`
 *  inside the axis (a band centre), so a notch draws its full depth. */
export function responseSampleFreqs(n: number = RESPONSE_SAMPLES, focusHz?: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(20 * Math.pow(1000, i / n));
  if (focusHz && focusHz.length) {
    for (const f of focusHz) if (f > 20 && f < 20000 && Number.isFinite(f)) out.push(f);
    out.sort((a, b) => a - b);
  }
  return out;
}

/** −3 dB bandwidth in octaves of a peaking band of quality Q (RBJ). */
export const bandwidthOctFromQ = (q: number): number => (2 / Math.LN2) * Math.asinh(1 / (2 * Math.max(1e-3, q)));
