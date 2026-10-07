/**
 * STORED CREDIT ACROSS THE 2026-10-06 RESTRUCTURE (pure; tested).
 *
 * Owner rule (2026-09-29): credit is never removed; labs can always be redone
 * for practice. A learner's record may still carry the three pages the
 * nine-page journey had (instrument, sound, setting). They are never erased
 * from the record; they are READ as the journey page built from them:
 *
 *   instrument or sound  → MEET IT (one page now holds what both held)
 *   setting              → STARTING SETUPS (the page that took its place in
 *                          the journey, with its checks)
 *   every other page     → itself
 *
 * So no page is credited unless the learner banked a page whose content (or
 * whose place in the journey) it now holds, the credited count never goes UP
 * from the mapping (each journey page draws on its own source pages only),
 * and a lesson that was complete is still complete. The count drops by one
 * only where two banked pages became one (instrument + sound → MEET IT): the
 * lesson now has eight pages, not nine.
 */
import { LEGACY_PAGE_IDS, PAGE_IDS, type PageId, type SourcePageId } from '../model/types.ts';
import { journeyPageOf } from '../journey.ts';

/** Every page id a stored record may carry. */
export const STORED_PAGE_IDS: readonly SourcePageId[] = [...PAGE_IDS, ...LEGACY_PAGE_IDS];

export const isStoredPage = (x: unknown): x is SourcePageId => typeof x === 'string' && (STORED_PAGE_IDS as readonly string[]).includes(x);

/** The journey pages a stored `done` list credits. */
export function creditedPages(done: readonly SourcePageId[]): Set<PageId> {
  const out = new Set<PageId>();
  for (const id of done) out.add(journeyPageOf(id));
  return out;
}

/** "n of 8": the journey pages credited, in journey order. */
export function creditedCount(done: readonly SourcePageId[]): number {
  const c = creditedPages(done);
  return PAGE_IDS.filter((p) => c.has(p)).length;
}
