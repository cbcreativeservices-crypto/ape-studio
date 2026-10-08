/**
 * Flashcard pure rules (tester Terry, 2026-10-08) — kept free of React so the
 * tests can run them directly.
 *
 * 1. RELATED TERMS lists TERMS only. The card used to append the term's
 *    CATEGORY, so a category name ("Recording, Mixing & Troubleshooting
 *    Concepts") read as if it were a related term.
 *
 * 2. FULL SCREEN swipes. Before: a vertical drag anywhere stepped to the next
 *    section (so a long section could not scroll), a horizontal swipe jumped to
 *    another TERM, and a stray tap advanced the section. Now:
 *      - on the TERM face: swipe left/right changes term; swipe up/down
 *        reveals the first/last section (same as the in-card view);
 *      - on a SECTION face: only a clear horizontal swipe moves between the
 *        sections of THIS term (right from the first section returns to the
 *        term face; left at the last section stays put); vertical drags are
 *        never claimed, so the text scrolls; a tap does nothing;
 *      - the study sheet (every section at once): horizontal changes term.
 */

export type RelatedSource = { related_terms?: string[] | null; category?: string | null };

export const NO_RELATED_TERMS = '(No related terms are listed for this term yet.)';

export function relatedTermList(item: RelatedSource): string[] {
  const cat = (item.category ?? '').trim().toLowerCase();
  return (item.related_terms ?? [])
    .map((s) => (s ?? '').trim())
    .filter((s) => s.length > 0 && s.toLowerCase() !== cat);
}

export function relatedTermsText(item: RelatedSource): string {
  const list = relatedTermList(item);
  return list.length ? list.map((s) => `• ${s}`).join('\n') : NO_RELATED_TERMS;
}

export type FsGesture = { dx: number; dy: number; vx: number };
export type FsFace = { level: number; studyMode: boolean };
export type FsSwipe = 'none' | 'nextSection' | 'prevSection' | 'nextCard' | 'prevCard' | 'revealFirst' | 'revealLast';

/** A horizontal move only counts when it clearly dominates the vertical one. */
const clearlyHorizontal = (dx: number, dy: number) => Math.abs(dx) > 1.5 * Math.abs(dy);

/** Should the full-screen responder take this drag from the ScrollView? */
export function fsShouldClaim(g: { dx: number; dy: number }, f: FsFace): boolean {
  if (Math.abs(g.dx) > 14 && clearlyHorizontal(g.dx, g.dy)) return true;
  // Vertical belongs to the text everywhere except the bare term face.
  return !f.studyMode && f.level === 0 && Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx);
}

export function fsSwipeAction(g: FsGesture, f: FsFace): FsSwipe {
  const horizontal =
    clearlyHorizontal(g.dx, g.dy) && (Math.abs(g.dx) >= 40 || (Math.abs(g.dx) >= 16 && Math.abs(g.vx) >= 0.35));
  if (horizontal) {
    if (f.studyMode || f.level === 0) return g.dx < 0 ? 'nextCard' : 'prevCard';
    return g.dx < 0 ? 'nextSection' : 'prevSection';
  }
  if (!f.studyMode && f.level === 0 && Math.abs(g.dy) > Math.abs(g.dx)) {
    if (g.dy <= -24) return 'revealFirst';
    if (g.dy >= 24) return 'revealLast';
  }
  return 'none';
}

/** Step within [term, ...sections] WITHOUT wrapping. Returns the new level. */
export function stepSectionLevel(level: number, enabledLevels: number[], dir: 1 | -1): number {
  const seq = [0, ...enabledLevels];
  const cur = Math.max(0, seq.indexOf(level));
  return seq[Math.min(seq.length - 1, Math.max(0, cur + dir))];
}
