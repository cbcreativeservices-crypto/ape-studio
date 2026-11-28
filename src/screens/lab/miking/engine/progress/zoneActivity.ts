/**
 * ONE wording for the Placement Studio's activity (fix round 2026-11-14, F9
 * item 3, G8 Part E4). Three forms were in use for the same thing: "1 so
 * far", "done: 1" and "1 of 2", and the last read "7 of 2" after more zones.
 * No "N of total" form (owner rule): the goal is said in words, and once two
 * different zones are rested in, the line says it is done.
 *
 * Pure (no React Native), so the tests reach it directly.
 */

/** The activity line for "rest it in two different suggested zones".
 *  `labels`: the zones rested in so far (their names, in order);
 *  `what`: what is rested ("the mic", "the array’s center");
 *  `clear`: the clearance words ("clear of every part", "clear of the players"). */
export function zoneActivityLine(labels: readonly string[], what = 'the mic', clear = 'clear of every part'): string {
  const n = labels.length;
  const list = n ? ` (${labels.join('; ')})` : '';
  // One wording whatever the count (checker C4: "two" here, "3" there).
  if (n >= 2) return `Activity: done ✓ — ${what} rested in at least two different zones, ${clear}${list}.`;
  return `Activity: rest ${what} in two different blue zones, ${clear} — ${n === 0 ? 'none yet' : 'one so far'}${list}.`;
}
