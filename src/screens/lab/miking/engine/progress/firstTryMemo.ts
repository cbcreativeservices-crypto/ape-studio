/**
 * firstTryMemo — remembers, for this app session, the Miking checks whose
 * FIRST try already went wrong (owner ruling 2026-10-14, #19).
 *
 * The cards (MikingScenarioCard, OrderTaskCard, SetupTaskCard) kept "the
 * first pick was wrong" in a ref, which a page change unmounts. A learner who
 * picked wrong, went back a page and came back was graded on a fresh card —
 * the right pick then reported "first try right" and the what's-left hint
 * ("First try: 3 of 3 right") was wrong. A miss is now remembered here until
 * the item is answered (its first-try result is then on the progress record)
 * or the lesson starts a fresh practice run (START OVER clears it).
 *
 * Item ids are lesson-prefixed ('k.snd.1', …), so one flat set is enough.
 * Pure module state — no React, no storage (test/mikingFirstTry_20261014).
 */
const missed = new Set<string>();

/** A wrong first try on `id` (idempotent). */
export function noteFirstMiss(id: string): void {
  if (id) missed.add(id);
}

/** Was `id`'s first try already missed in this session's run? */
export function firstTryMissed(id: string): boolean {
  return missed.has(id);
}

/** A fresh practice run: every remembered miss goes (the answers went too). */
export function forgetFirstMisses(): void {
  missed.clear();
}
