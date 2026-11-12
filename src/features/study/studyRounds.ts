/**
 * End-of-round review for Fill-in-the-Blank and Matching (next-build list
 * item 2, must-do E4; owner 2026-10-24, built 2026-11-07).
 *
 * Why it exists: on those two methods the term is on screen for under a
 * second (Fill-in's answer flashes green and the screen moves on; a Matching
 * pair fades out), so there was nowhere for "Research and learn more · View
 * images" to sit. A round is ROUND_TERMS distinct terms (or the whole deck
 * when it is smaller); at its end the screen shows those terms, each with the
 * links, then carries on exactly where it was. Practice after 100% is not
 * locked (72ef3829): the review is just a pause between rounds.
 *
 * Pure logic, no React, so the node tests run it directly.
 */

/** Terms per round. One constant for both methods. */
export const ROUND_TERMS = 10;

export type RoundEntry = {
  id: string;
  term: string;
  definition: string;
  wikipediaUrl: string | null;
  searchQuery: string | null;
  /** Answered right at least once this round. */
  gotRight: boolean;
  /** Missed at least once this round. A miss stays marked. */
  missed: boolean;
  /** Fill-in only: the last wrong answer picked, for "Your answer". */
  lastWrong: string | null;
};

export type RoundItem = {
  id: string;
  term: string;
  definition: string;
  wikipedia_url?: string | null;
  search_query?: string | null;
};

/** How many distinct terms close a round on a deck of this size. */
export function roundTarget(deckSize: number): number {
  const n = Math.floor(Number.isFinite(deckSize) ? deckSize : 0);
  return Math.max(1, Math.min(ROUND_TERMS, n));
}

/**
 * Record one answer. One entry per term, in the order first seen; answering a
 * term again (swiping back to it) updates its entry instead of adding one.
 */
export function noteAnswer(
  round: readonly RoundEntry[],
  item: RoundItem,
  correct: boolean,
  picked?: string | null,
): RoundEntry[] {
  const i = round.findIndex((e) => e.id === item.id);
  const prev = i >= 0 ? round[i] : null;
  const entry: RoundEntry = {
    id: item.id,
    term: item.term,
    definition: item.definition,
    wikipediaUrl: item.wikipedia_url ?? null,
    searchQuery: item.search_query ?? null,
    gotRight: (prev?.gotRight ?? false) || correct,
    missed: (prev?.missed ?? false) || !correct,
    lastWrong: correct ? (prev?.lastWrong ?? null) : (picked ?? prev?.lastWrong ?? null),
  };
  if (!prev) return [...round, entry];
  const next = round.slice();
  next[i] = entry;
  return next;
}

/** True once this round holds enough distinct terms to be reviewed. */
export function roundDue(round: readonly RoundEntry[], deckSize: number): boolean {
  return round.length > 0 && round.length >= roundTarget(deckSize);
}
