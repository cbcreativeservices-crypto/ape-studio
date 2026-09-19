/**
 * Moving through the Enrollments deck.
 *
 * ⛔ ALL / PROGRAMS / CERTIFICATES ARE A JUMP-TO, NOT A FILTER
 * (owner 2026-09-19: "programs and certificates is a: jump to, not a filter…
 * the ‹ › should always work no matter all, program or cert").
 *
 * They used to rebuild the deck as only that kind, which produced the
 * confusion the owner reported: under Programs the deck might hold a single
 * card, so BOTH arrows greyed out and the control looked broken — and the
 * position readout restarted at 1/1, so there was no way to tell where you
 * were in what you actually had. Two controls that each changed what the
 * other meant.
 *
 * Now there is one deck, always whole and always in the same order, and the
 * two controls do different jobs on it: the chips jump to the first card of a
 * kind, the arrows step one at a time. Neither can empty the deck, so the
 * arrows always have somewhere to go.
 *
 * The lit chip is therefore a READOUT, not a setting — it says what you are
 * looking at now. Stepping ‹ › from the last program to the first certificate
 * moves the highlight with you, because nothing was ever "selected".
 */

/**
 * The kinds a deck card can be. `topics` is the ALL TOPICS card at index 0.
 *
 * ⚠️ `subject` is a real kind here and is deliberately NOT a chip: it belongs
 * under All with everything else, and inventing a fourth chip for it would
 * push the ‹ › off the row on a phone. It answers 'all', like the ghost.
 */
export type DeckCardKind = 'topics' | 'program' | 'cert' | 'subject' | 'placeholder';
/** The three jump targets, in the order the chips are drawn. */
export type DeckChip = 'all' | 'program' | 'cert';

/**
 * Where a chip jumps to, or -1 when the deck holds nothing of that kind.
 *
 * -1 means the chip has nowhere to go and should be disabled — NOT that it
 * should do nothing when pressed. A chip that looks live and moves nothing is
 * how the filter version read as broken.
 */
export function firstIndexOfKind(kinds: readonly DeckCardKind[], chip: DeckChip): number {
  // "All" means the ALL TOPICS card, which is index 0 whenever it exists.
  if (chip === 'all') return kinds.indexOf('topics');
  return kinds.indexOf(chip);
}

/**
 * Which chip should read as current for the card you are sitting on.
 *
 * Everything that is not a program or a certificate answers 'all'. The
 * placeholder in particular: it stands in for credentials you do not have
 * yet, so lighting Programs or Certificates over it would claim one exists.
 */
export function chipForKind(kind: DeckCardKind | undefined): DeckChip {
  return kind === 'program' || kind === 'cert' ? kind : 'all';
}

/**
 * One step through the deck, clamped at both ends.
 *
 * ⛔ NEVER WRAPS (owner: "should not scroll past their end last point"). A
 * list that jumps from last back to first loses any sense of where you are,
 * and with the position readout beside it, wrapping would make the numbers
 * appear to lie.
 */
export function stepDeck(index: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, index + delta));
}
