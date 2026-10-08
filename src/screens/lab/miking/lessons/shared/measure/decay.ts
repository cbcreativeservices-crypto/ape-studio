/**
 * THE DECAY READER's maths (F13 L27–L28; room_acoustics/GEOMETRY_PROPOSAL.md
 * §3). Pure; tested.
 *
 *   T20  the slope fitted from −5 to −25 dB, extrapolated to 60 dB (×3)
 *   T30  the slope fitted from −5 to −35 dB, extrapolated to 60 dB (×2)
 *   EDT  the slope fitted from 0 to −10 dB, extrapolated to 60 dB (×6)
 *   (RA-T, CONFIRMED.) Each is an ESTIMATE of the time for a 60 dB decay,
 *   never a direct observation of 20 or 30 dB of seconds.
 *
 * RANGE: the end of the fitted region must sit at least 10 dB above the
 * noise floor (RA-T) — so T20 needs about 35 dB of usable range and T30
 * about 45 dB. Short of that the reader REFUSES the figure ("not enough
 * range") rather than fitting a line into the floor; the same 10 dB margin
 * is applied to EDT's −10 dB end. Never drive the source louder only to
 * force a result (L27).
 *
 * The curve itself is a MADE-UP EXAMPLE (owner D-6B-2): an energy decay
 * curve built as the energy sum of an early and a late exponential decay
 * (so EDT and T30 can differ, as in a real room) plus a steady noise floor
 * — labelled "a simplified example, not a measurement" wherever it is
 * drawn. The fit is an ordinary least-squares line over the samples inside
 * the evaluation range.
 */

/** The three estimates. */
export type DecayMetric = 'EDT' | 'T20' | 'T30';
/** Evaluation range (dB below the start) and the 60 dB extrapolation factor. */
export const METRIC_RANGE: Readonly<Record<DecayMetric, { from: number; to: number; factor: number }>> = {
  EDT: { from: 0, to: -10, factor: 6 },
  T20: { from: -5, to: -25, factor: 3 },
  T30: { from: -5, to: -35, factor: 2 },
};
/** The end of a fit must sit this far above the noise floor (RA-T). */
export const FLOOR_MARGIN_DB = 10;
/** The usable range each metric needs: |to| + the margin (35 / 45 dB for T20 / T30). */
export function rangeNeeded(m: DecayMetric): number {
  return -METRIC_RANGE[m].to + FLOOR_MARGIN_DB;
}

/** A made-up decay: an early and a late slope (s for 60 dB), the early
 *  part's share of the energy, and the noise floor (dB below the start). */
export type DecayModel = { early: number; late: number; earlyShare: number; floorDb: number };

/** The decay curve's level at t seconds, dB re its start (≤ 0, floored). */
export function decayLevel(m: DecayModel, t: number): number {
  const e = m.earlyShare * Math.pow(10, (-6 * t) / m.early) + (1 - m.earlyShare) * Math.pow(10, (-6 * t) / m.late);
  return 10 * Math.log10(e + Math.pow(10, m.floorDb / 10)) - 10 * Math.log10(1 + Math.pow(10, m.floorDb / 10));
}

/** The curve sampled every `dt` s up to `tMax`. */
export function sampleDecay(m: DecayModel, tMax: number, dt = 0.005): { t: number; db: number }[] {
  const out: { t: number; db: number }[] = [];
  for (let i = 0; i * dt <= tMax + 1e-9; i++) out.push({ t: i * dt, db: decayLevel(m, i * dt) });
  return out;
}

export type DecayFit =
  | { ok: true; metric: DecayMetric; seconds: number; slopeDbPerS: number; intercept: number; t0: number; t1: number }
  | { ok: false; metric: DecayMetric; reason: 'range' | 'samples'; rangeDb: number; needDb: number };

/** The usable range of a curve: from its start down to the floor (dB). */
export function usableRange(floorDb: number): number {
  return -floorDb;
}

/**
 * Fit a metric to a sampled curve whose noise floor is `floorDb`. Refused
 * when the range is short (the fit's end within 10 dB of the floor).
 */
export function fitDecay(samples: readonly { t: number; db: number }[], floorDb: number, metric: DecayMetric): DecayFit {
  const need = rangeNeeded(metric);
  const have = usableRange(floorDb);
  if (have < need - 1e-9) return { ok: false, metric, reason: 'range', rangeDb: have, needDb: need };
  const { from, to } = METRIC_RANGE[metric];
  const pts = samples.filter((s) => s.db <= from + 1e-9 && s.db >= to - 1e-9);
  if (pts.length < 3) return { ok: false, metric, reason: 'samples', rangeDb: have, needDb: need };
  const n = pts.length;
  const mt = pts.reduce((a, p) => a + p.t, 0) / n;
  const md = pts.reduce((a, p) => a + p.db, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of pts) {
    sxy += (p.t - mt) * (p.db - md);
    sxx += (p.t - mt) * (p.t - mt);
  }
  const slope = sxy / sxx;
  const intercept = md - slope * mt;
  // −60 / slope is the same estimate as (time across the range) × factor on a straight line.
  return { ok: true, metric, seconds: -60 / slope, slopeDbPerS: slope, intercept, t0: pts[0].t, t1: pts[n - 1].t };
}

/** Octave bands of the made-up example (125 Hz – 4 kHz), each with its own
 *  early / late decay and floor — drawing defaults chosen so the bands tell
 *  the lesson's story: the lows ring longest and sit nearest the floor. */
export const EXAMPLE_BANDS: readonly { hz: number; label: string; model: DecayModel }[] = [
  { hz: 125, label: '125 Hz', model: { early: 1.3, late: 1.9, earlyShare: 0.5, floorDb: -38 } },
  { hz: 250, label: '250 Hz', model: { early: 1.2, late: 1.6, earlyShare: 0.5, floorDb: -46 } },
  { hz: 500, label: '500 Hz', model: { early: 1.0, late: 1.4, earlyShare: 0.55, floorDb: -52 } },
  { hz: 1000, label: '1 kHz', model: { early: 0.9, late: 1.3, earlyShare: 0.55, floorDb: -55 } },
  { hz: 2000, label: '2 kHz', model: { early: 0.8, late: 1.15, earlyShare: 0.6, floorDb: -55 } },
  { hz: 4000, label: '4 kHz', model: { early: 0.7, late: 0.95, earlyShare: 0.6, floorDb: -52 } },
];
