/**
 * deckOrder — which items a study deck serves FIRST.
 *
 * ── THE BUG THIS EXISTS TO KILL ─────────────────────────────────────────────
 *
 * Both Fill-in-the-Blank and Matching ordered their decks by ATTEMPTS:
 *
 *     notDone = attempts < 2      done = attempts >= 2
 *
 * But completion is not measured in attempts. `studyDisplayPct` (api.ts) and
 * `record_study_progress` both credit an item on CORRECT ONCE. The two rules
 * disagree in exactly one case, and it is the worst possible one: an item you
 * attempted twice and got WRONG both times counts as "done" for ordering and
 * is sorted to the BACK of the deck — behind every item you have already
 * answered correctly.
 *
 * So the single item standing between a learner and 100% is deliberately
 * placed last. Owner, 2026-09-19, on Pro Audio Safety: "i worked on fill in
 * the blank at 99% for about 4 min did 15+ cards - and never got to 100%."
 * The server confirms it — 162 of 162 items served, 161 credited, and the one
 * left ("Assembly Area", 2 attempts, 0 correct) sitting at the end of a
 * 162-card queue. The autonomous device run before it answered 344 questions
 * across two full passes and hit the same wall.
 *
 * ⛔ ORDER BY THE RULE THAT DECIDES COMPLETION, NOT A PROXY FOR IT. Anything
 * uncredited comes first, hardest-hit first, so the last 1% costs the same as
 * the first 1% instead of more.
 */

/** The per-item state both screens keep (a subset of the synced shape). */
export type ItemState = { attempts?: number; correct?: number };

/** Credit = correct at least once. Matches api.ts studyDisplayPct and the
 *  server's record_study_progress. This is the ONLY definition of "done". */
export function hasCredit(st: ItemState | undefined): boolean {
  return (st?.correct ?? 0) >= 1;
}

/**
 * Split a deck into what still needs credit and what does not, preserving the
 * caller's incoming order within each group.
 *
 * Uncredited items are ordered by attempts DESCENDING — the item you have
 * fought with most comes up first. That is the one blocking the gate, and it
 * is also the one most likely to need a different explanation rather than
 * another shuffle.
 */
export function orderByCredit<T extends { id: string }>(
  items: T[],
  states: Record<string, ItemState | undefined>,
): T[] {
  const needed: T[] = [];
  const credited: T[] = [];
  for (const it of items) (hasCredit(states[it.id]) ? credited : needed).push(it);
  needed.sort((a, b) => (states[b.id]?.attempts ?? 0) - (states[a.id]?.attempts ?? 0));
  return [...needed, ...credited];
}

/** How many items still have no credit — what the learner actually has left. */
export function remainingCount(
  items: { id: string }[],
  states: Record<string, ItemState | undefined>,
): number {
  return items.reduce((n, it) => n + (hasCredit(states[it.id]) ? 0 : 1), 0);
}
