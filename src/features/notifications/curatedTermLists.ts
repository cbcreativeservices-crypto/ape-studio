/**
 * Curated daily-term notification buckets (owner 2026-09-01).
 *
 * Two DAILY notification streams beyond the random "Term of the day":
 *   • MISUNDERSTOOD — commonly misunderstood terms, each body naming the
 *     actual misconception and setting it straight.
 *   • ODD — rare / odd / delightful audio terms most people have never met.
 *
 * The content is CURATED, not sampled: ~1,095 entries per bucket (three years
 * of dailies) selected from the glossary by an overnight analysis pass on
 * Computer B — the brief, qualifiers and filters live in
 * docs/APE_TERM_BUCKETS_BRIEF_2026_09_01.md. Until those lists land, both
 * JSON files are empty and the feature is DORMANT: the Settings rows hide and
 * the scheduler books nothing, so users never see a toggle with no content
 * behind it.
 *
 * Rotation is DATE-KEYED, not random: entry = daysSinceEpoch % list.length,
 * so every device shows the same term on the same day, the sequence survives
 * reinstalls, and a 1,095-entry list runs three years before repeating. The
 * lists are therefore ORDERED for variety by the curation pass — file order
 * is play order.
 *
 * Every `term` string byte-matches a glossary `term` row (validated at
 * curation time) so taps can deep-link to the exact entry later.
 */
// Metro bundles JSON imports natively; these ship in the app bundle so the
// notifications work fully offline.
import misunderstoodRaw from './curated/misunderstoodTerms.json';
import oddRaw from './curated/oddTerms.json';

export type CuratedTermEntry = {
  /** EXACT glossary `term` string (byte-identical — future deep-link key). */
  term: string;
  /** The notification body, ≤160 chars, derived from the glossary definition.
   *  MISUNDERSTOOD bodies name the myth and the truth; ODD bodies tell the
   *  surprising bit. Owner-ratified copy. */
  body: string;
};

const clean = (raw: unknown): readonly CuratedTermEntry[] =>
  Array.isArray(raw)
    ? (raw.filter(
        (e) => e && typeof e.term === 'string' && e.term.length > 0 && typeof e.body === 'string' && e.body.length > 0,
      ) as CuratedTermEntry[])
    : [];

export const MISUNDERSTOOD_TERMS: readonly CuratedTermEntry[] = clean(misunderstoodRaw);
export const ODD_TERMS: readonly CuratedTermEntry[] = clean(oddRaw);

/** Days since the Unix epoch in LOCAL time — the rotation key. Local, so the
 *  term flips at the user's midnight, not at UTC's. */
export function localDayIndex(d: Date): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** The entry a given calendar date shows, or null while a list is empty. */
export function curatedEntryForDate(list: readonly CuratedTermEntry[], d: Date): CuratedTermEntry | null {
  if (list.length === 0) return null;
  return list[((localDayIndex(d) % list.length) + list.length) % list.length];
}
