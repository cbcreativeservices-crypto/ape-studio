/**
 * PP-06 (owner 2026-11-15: "build waves 1 thru 3", D62 adoption plan): on a
 * barely started project the packet's WHAT'S LEFT opened with about 83 rows
 * before the document began. A stage nobody has touched yet now shows ONE
 * line ("17 things still open · SHOW THEM ▾") that opens to its full rows in
 * place. A stage with any answer (or any "not applicable" reason) keeps every
 * row, so owner ruling 2 (2026-10-04, "the actual items, not counts") still
 * holds wherever work has begun, and every item is one tap away elsewhere.
 * Pure: the packet screen and test/labWaves_20261115_F4 share it.
 */
import { isAnswered, type ProductionProject } from '../../../features/production/types.ts';

/** True when no question of this stage is answered or marked not applicable. */
export function stageUntouched(project: Pick<ProductionProject, 'values' | 'na'>, stageId: string): boolean {
  const prefix = `${stageId}.`;
  for (const [k, v] of Object.entries(project.values ?? {})) if (k.startsWith(prefix) && isAnswered(v)) return false;
  for (const [k, r] of Object.entries(project.na ?? {})) if (k.startsWith(prefix) && typeof r === 'string' && r.trim()) return false;
  return true;
}

/** A stage's WHAT'S LEFT rows fold to one line when it is untouched and has
 *  more than one row. A BLOCKER is never folded away: a stage holding one
 *  keeps every row in view. */
export function foldsToOneLine(project: Pick<ProductionProject, 'values' | 'na'>, stageId: string, items: readonly { kind: string }[]): boolean {
  return items.length > 1 && !items.some((it) => it.kind === 'blocker') && stageUntouched(project, stageId);
}

/** The one line's words. A count of what is LEFT (never "n of total"). */
export function oneLineText(rows: number): string {
  return `${rows} things still open · SHOW THEM ▾`;
}
