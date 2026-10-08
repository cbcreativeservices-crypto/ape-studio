/**
 * THE CALCULATORS, CALLED — never copied (owner rule: the calculators are
 * the source of truth; visual charter §4: an equation shared with a
 * calculator calls the calculator's function).
 *
 *   leqOf       the SPL & exposure workspace's "Leq (energy average) from
 *               intervals" (calc/workspaces/splSafety.ts, key 'leq')
 *   combineOf   its "Combine any number of levels" (key 'combine')
 *
 * Imported only by the presentation layer and by tests that register the
 * Miking test loader (the workspace imports its units without an extension,
 * which Metro resolves and plain Node does not). Lesson DATA never imports
 * this file.
 */
import type { CalcFunction } from '../../../../calc/calcTypes';
import { WORKSPACES_SPL } from '../../../../calc/workspaces/splSafety';

function fn(key: string): CalcFunction {
  for (const w of WORKSPACES_SPL) for (const f of w.functions) if (f.key === key) return f;
  throw new Error(`calculator function ${key} not found`);
}

/** The first numeric output of a calculator function, or null when it refuses. */
function valueOf(key: string, v: Record<string, number | number[]>): number | null {
  const out = fn(key).compute(v as never) as { value?: number; refusal?: boolean }[];
  if (out.some((o) => o.refusal)) return null;
  const hit = out.find((o) => typeof o.value === 'number' && Number.isFinite(o.value));
  return hit ? (hit.value as number) : null;
}

/** LAeq over equal-length samples: the calculator's energy average with each
 *  sample `secondsEach` long. null when the calculator refuses (no time). */
export function leqOf(levels: readonly number[], secondsEach: number): number | null {
  if (!levels.length) return null;
  return valueOf('leq', { doseLevels: [...levels], doseMins: levels.map(() => secondsEach / 60) });
}

/** The energy sum of levels (the calculator's 'combine'). */
export function combineOf(levels: readonly number[]): number | null {
  if (!levels.length) return null;
  return valueOf('combine', { levels: [...levels] });
}
