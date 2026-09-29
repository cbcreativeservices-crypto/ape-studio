/**
 * labPreloadPlan — which recorded clips a grid-shaped lab loads first (owner
 * 2026-09-29: "load in audio clip starts (as many as possible with still good
 * function) in each screen so we can minimize delays when the user is
 * switching between audio sample sounds").
 *
 * The Bass lab is a grid: strings × frets (or strings × harmonic nodes). The
 * learner's next pick is almost always near the current one, so the order is
 *   1. the current cell (the first ▶ plays from memory),
 *   2. the rest of the current ROW (the whole string), nearest first,
 *   3. the current COLUMN on the other rows (this fret on every string),
 *   4. then everything else, nearest first (|Δcol| + |Δrow|),
 * cut at `max` so the plan never exceeds the player pool and evicts itself.
 *
 * Pure (tested in Node).
 */
export function gridPreloadOrder(rows: number, cols: number, row: number, col: number, max: number): [number, number][] {
  const out: [number, number][] = [];
  const seen = new Set<string>();
  const add = (r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const k = `${r},${c}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push([r, c]);
  };
  add(row, col);
  for (let d = 1; d < cols; d++) {
    add(row, col - d);
    add(row, col + d);
  }
  for (let d = 1; d < rows; d++) {
    add(row - d, col);
    add(row + d, col);
  }
  const rest: [number, number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rest.push([r, c, Math.abs(c - col) + Math.abs(r - row)]);
  rest.sort((a, b) => a[2] - b[2]);
  for (const [r, c] of rest) add(r, c);
  return out.slice(0, Math.max(0, max));
}
