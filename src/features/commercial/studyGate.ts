/**
 * The two study membership gates on the Dashboard, as pure predicates
 * (owner 2026-09-13: "gate it").
 *
 * Import-free on purpose, so node:test can read it without the React Native
 * module graph — same reason as `realAccount.ts` and `profileRead.ts`.
 *
 * ⚠️ THERE ARE TWO OF THESE AND THEY ARE NOT INTERCHANGEABLE. That is the whole
 * point of this file. `studyMethodLocked` reads the DISPLAYED topic, because the
 * method blocks and the quiz must act on whatever the carousel is showing — a
 * gate on the committed topic once opened DAW's flashcards from an Astronomical
 * Acoustics card (user bug 2026-08-13). The ★ Custom List panel is the mirror
 * image: it renders on the COMMITTED topic, so reading the displayed one would
 * leave its Study button open whenever the carousel happened to be previewing a
 * free topic. It is never free for a non-member whatever the carousel shows, so
 * it gets a gate that does not look at the carousel at all.
 */

/** Tier values these gates care about; anything else is treated as not-academy. */
export type GateTier = string;

/**
 * A study method or the quiz, for the topic currently DISPLAYED.
 *
 * `resolved` comes first deliberately: the entitlement provider boots at
 * 'anonymous' and only learns the real tier after a server read, so before it
 * lands this would say "not a member" about EVERYONE — and a member tapping a
 * method inside that window was shown the upgrade sheet for the membership they
 * already pay for. Hold the member-favouring state until the tier is known; the
 * study screens still gate on the server, so this can only delay a lock, never
 * grant access.
 */
export function studyMethodLocked(input: {
  resolved: boolean;
  entitlement: GateTier;
  /** `global_sequence` of the DISPLAYED topic; null for a pseudo-topic. */
  displayedGs: number | null | undefined;
  /** The auto-enrolled free topics (FREE_ENROLL_GS: gs3060, gs3970). */
  freeGs: readonly number[];
}): boolean {
  const { resolved, entitlement, displayedGs, freeGs } = input;
  if (!resolved) return false;
  if (entitlement === 'academy') return false;
  // Fails CLOSED when there is no gs — a pseudo-topic is not a free topic.
  return !(displayedGs != null && freeGs.includes(displayedGs));
}

/**
 * The ★ Custom List.
 *
 * ⚠️ WHY IT IS GATED AT ALL (it was exempt until 2026-09-13). A free user can
 * star any glossary term and study it here, so the exemption was an unmetered
 * path to all 26,855 definitions — around both the 14-a-week allowance and the
 * server gateway built to meter it. Masking `glossary_study_v` closed the data
 * side; without this gate the cards would render 120-character teasers as
 * though they were definitions, which reads as broken rather than gated.
 */
export function customListLocked(input: { resolved: boolean; entitlement: GateTier }): boolean {
  return input.resolved && input.entitlement !== 'academy';
}
