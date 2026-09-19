/**
 * Cable Dressing & Installation Lab — SCORE ENGINE (spec §22, §43).
 *
 * Professional scorecard, not correct/incorrect: seven dimensions with the
 * spec's weights, where critical safety/fire violations cost far more than
 * cosmetic issues. Pure functions + pure data — zero React (house rule).
 */
import type { CiSeverity } from '../data/rules';

export type CiDim =
  | 'safety'
  | 'protection'
  | 'routing'
  | 'signal'
  | 'serviceability'
  | 'documentation'
  | 'workmanship';

export const CI_DIM_META: Record<CiDim, { label: string; weight: number }> = {
  safety: { label: 'Safety', weight: 0.25 },
  protection: { label: 'Cable Protection', weight: 0.15 },
  routing: { label: 'Routing & Support', weight: 0.2 },
  signal: { label: 'Signal / Performance', weight: 0.1 },
  serviceability: { label: 'Serviceability', weight: 0.15 },
  documentation: { label: 'Identification / Documentation', weight: 0.1 },
  workmanship: { label: 'Workmanship', weight: 0.05 },
};

export const CI_DIMS = Object.keys(CI_DIM_META) as CiDim[];

/** Severity → score cost multiplier (critical ≫ cosmetic, spec §22). */
export const SEVERITY_COST: Record<CiSeverity, number> = {
  info: 0,
  minor: 1,
  major: 2.5,
  critical: 5,
};

/** 0..100 per dimension. */
export type CiDimScores = Partial<Record<CiDim, number>>;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const clamp100 = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Weighted overall 0..100 from per-dimension scores (missing dims skipped,
 *  weights renormalized so a module that only exercises 3 dims still reads
 *  honestly). */
export function overallScore(dims: CiDimScores): number {
  let acc = 0;
  let wsum = 0;
  for (const d of CI_DIMS) {
    const v = dims[d];
    if (v == null) continue;
    acc += v * CI_DIM_META[d].weight;
    wsum += CI_DIM_META[d].weight;
  }
  return wsum > 0 ? clamp100(acc / wsum) : 0;
}

/**
 * Merge module dimension results — an EXPONENTIAL BLEND, not a running average.
 *
 * ── THE DOCSTRING USED TO SAY "running average" AND IT IS NOT ONE ───────────
 * (2026-09-18, pass 4 · H-2a — corrected here as WORDING; the behaviour is
 * deliberately left alone pending an owner ruling.)
 *
 * With the default weight of 1 this is `(prev + v) / 2`. There is no sample
 * count, so the LAST module to touch a dimension owns half of its final score,
 * the one before it a quarter, and so on. Eleven scenes feed dimensions and
 * they overlap heavily — `routing` is written by six of them.
 *
 * Concretely: score 100 on routing in stages 2–10 and 0 in stage 11 and the
 * scorecard reads 50, where the true mean is 83.
 *
 * ⚠ This is NOT obviously a bug, which is why it was not "fixed":
 *   - As a MEAN, one early bad stage follows a learner through the whole lab.
 *   - As a BLEND, recent work counts most — "you improved, and the score shows
 *     it", which is defensible pedagogy for a teaching lab.
 * The number also drives `masteryBlocks` and `weakestDim` → the "Recommended
 * review" line, so changing it changes the advice the lab gives.
 *
 * Choosing between them is an owner call about what the score MEANS, not a
 * defect fix. Until then the name says what the code does.
 */
export function mergeDims(into: CiDimScores, add: CiDimScores, weight = 1): CiDimScores {
  const out: CiDimScores = { ...into };
  for (const d of CI_DIMS) {
    const v = add[d];
    if (v == null) continue;
    const prev = out[d];
    out[d] = prev == null ? v : Math.round((prev + v * weight) / (1 + weight));
  }
  return out;
}

/** Inspection scoring: found vs missed vs miscategorized defects. */
export function inspectionDimScores(results: {
  dim: CiDim;
  severity: CiSeverity;
  found: boolean;
  categorizedRight: boolean;
}[]): CiDimScores {
  const byDim: Partial<Record<CiDim, { earned: number; possible: number }>> = {};
  for (const r of results) {
    const cost = Math.max(1, SEVERITY_COST[r.severity]);
    const slot = (byDim[r.dim] ??= { earned: 0, possible: 0 });
    slot.possible += cost;
    if (r.found) slot.earned += cost * (r.categorizedRight ? 1 : 0.6);
  }
  const out: CiDimScores = {};
  for (const d of CI_DIMS) {
    const s = byDim[d];
    if (s && s.possible > 0) out[d] = clamp100((s.earned / s.possible) * 100);
  }
  return out;
}

/** 0..5 mastery blocks for the completion profile (spec §43). */
export function masteryBlocks(score0to100: number): number {
  return Math.max(0, Math.min(5, Math.round(score0to100 / 20)));
}

/** The weakest exercised dimension → "Recommended review" target.
 *  Only speaks below 80 (learning pass 2026-08-31): it used to ALWAYS name a
 *  target, so a 94-overall run was told to review its 92/100 dimension —
 *  advice that trains learners to ignore the advice. */
export function weakestDim(dims: CiDimScores): CiDim | null {
  let worst: CiDim | null = null;
  let worstV = 80;
  for (const d of CI_DIMS) {
    const v = dims[d];
    if (v != null && v < worstV) {
      worst = d;
      worstV = v;
    }
  }
  return worst;
}
