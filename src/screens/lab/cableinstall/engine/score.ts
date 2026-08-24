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

/** Merge module dimension results (running average per dimension). */
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

/** The weakest exercised dimension → "Recommended review" target. */
export function weakestDim(dims: CiDimScores): CiDim | null {
  let worst: CiDim | null = null;
  let worstV = 101;
  for (const d of CI_DIMS) {
    const v = dims[d];
    if (v != null && v < worstV) {
      worst = d;
      worstV = v;
    }
  }
  return worst;
}
