/**
 * Cable Dressing & Installation Lab — ROUTE EVALUATOR (spec §48).
 *
 * Routes are STRUCTURED DATA, not painted lines: a route is a sequence of
 * pathway segments plus flagged conditions, so one evaluator scores every
 * scene (plan / wall / ceiling / floor) identically — no per-scene forks.
 * The lesson "shortest ≠ best" is structural: length is one small input among
 * six scored dimensions. Pure functions, zero React.
 */
import type { CiDim, CiDimScores } from './score';
import { clamp100 } from './score';

/** A hazard/quality condition attached to a route by the scenario author. */
export type CiRouteFlag = {
  /** Rule that explains this flag (WHY + sources render from it). */
  ruleId: string;
  /** Which score dimension it hits. */
  dim: CiDim;
  /** 0..1 how badly it hurts that dimension. */
  cost: number;
  /** One-line, learner-facing observation ("passes through the HVAC bay"). */
  note: string;
  /** Positive flags praise instead of costing (cost is treated as a bonus). */
  positive?: boolean;
};

export type CiRouteOption = {
  id: string;
  name: string;
  /** Learner-facing description of where it goes. */
  path: string;
  /** Relative length vs the shortest option (1 = shortest). */
  relLength: number;
  flags: CiRouteFlag[];
};

export type CiRouteVerdict = {
  dims: CiDimScores;
  overallNotes: string[];
  /** Rules to surface in feedback (deduped, order = impact). */
  ruleIds: string[];
};

const ROUTE_DIMS: CiDim[] = ['safety', 'protection', 'routing', 'signal', 'serviceability', 'workmanship'];

/** Score one authored route option. Every dimension starts at 100 and pays
 *  for its flags; length only nudges workmanship (a longer route is cable
 *  cost, not a defect). */
export function evaluateRoute(option: CiRouteOption): CiRouteVerdict {
  const dims: CiDimScores = {};
  for (const d of ROUTE_DIMS) dims[d] = 100;
  const notes: string[] = [];
  const ruleIds: string[] = [];

  for (const f of option.flags) {
    const cur = dims[f.dim] ?? 100;
    if (f.positive) {
      dims[f.dim] = clamp100(cur + f.cost * 10); // small praise, capped at 100
    } else {
      dims[f.dim] = clamp100(cur - f.cost * 100);
    }
    notes.push(f.note);
    if (!ruleIds.includes(f.ruleId)) ruleIds.push(f.ruleId);
  }

  // Length: mild workmanship cost only past 1.5× the shortest option.
  const over = Math.max(0, option.relLength - 1.5);
  if (over > 0) {
    dims.workmanship = clamp100((dims.workmanship ?? 100) - over * 20);
    notes.push('Longer than needed — extra cable is cost and congestion, though not a defect by itself.');
  }

  return { dims, overallNotes: notes, ruleIds };
}

/** Rank options for the reveal (teaching order: best first). */
export function rankRoutes(options: CiRouteOption[]): { option: CiRouteOption; verdict: CiRouteVerdict; overall: number }[] {
  return options
    .map((option) => {
      const verdict = evaluateRoute(option);
      let sum = 0;
      let n = 0;
      for (const d of ROUTE_DIMS) {
        const v = verdict.dims[d];
        if (v != null) {
          sum += v;
          n++;
        }
      }
      return { option, verdict, overall: n ? Math.round(sum / n) : 0 };
    })
    .sort((a, b) => b.overall - a.overall);
}
