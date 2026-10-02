/**
 * The two server reads the glossary corpus needs, in one place.
 *
 * Extracted from GlossaryScreen (2026-09-22) so the background prefetch and the
 * screen cannot drift apart. They ran the same queries; a second copy would
 * have been the kind of duplication where one side later gains a filter and
 * nobody notices the other did not.
 *
 * ⛔ TERMS ONLY in the corpus select. `definition` is 3.8 MB of the 5.4 MB
 * across 31,858 rows, and `plain_english` is NULL for every one of them.
 * Pulling either for the whole corpus is what froze the app on open; see the
 * note in GlossaryScreen's loadAllEntries.
 */
import { supabase } from '../../lib/supabase';
import { withDeadline } from '../../lib/boundedCall';

export type CorpusTable = 'glossary' | 'glossary_browse_v';
export type CorpusTerm = { id: string; term: string; achievement_id: string | null };

/**
 * ⛔ EVERY PAGE IS BOUNDED (full-app run 2, 2026-10-01). These reads REJECT on
 * failure so the callers can forget what they asked for and retry — but a
 * STALLED request (a socket that stops answering; Android's RN fetch has no
 * timeout of its own) neither resolved nor rejected, so none of those retry
 * paths ever ran: on-screen rows stayed blank for the rest of the visit (their
 * ids stuck in the "already requested" set), a stalled corpus page held the
 * session-cached load — and with it every later Glossary visit — on the
 * spinner, and SAVE ALL sat on "SAVING — TAP TO STOP" with STOP unable to end
 * it. `withDeadline` (reject, not fallback) because a rejection is exactly
 * what every caller already handles; a fallback would read as "no rows".
 */
const PAGE_DEADLINE_MS = 20000;

/** Hand the JS thread back for a turn — 32 pages is too many to hold it for. */
export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Page the whole term list. Rejects on any failed page. */
export async function fetchCorpusTerms(table: CorpusTable): Promise<CorpusTerm[]> {
  const all: CorpusTerm[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await withDeadline(
      // `async () =>`: the Supabase builder is a thenable, not a Promise.
      async () =>
        await supabase
          .from(table)
          .select('id, term, achievement_id')
          .order('term')
          .range(from, from + PAGE - 1),
      'glossary corpus page',
      PAGE_DEADLINE_MS,
    );
    if (error) throw error;
    for (const r of (data ?? []) as CorpusTerm[]) {
      all.push({ id: r.id, term: r.term, achievement_id: r.achievement_id });
    }
    if (!data || data.length < PAGE) break;
    await yieldToUi();
  }
  return all;
}

/**
 * Definitions for a set of ids, in ONE request.
 *
 * Rejects on failure so the caller can forget the ids and retry — a swallowed
 * error would leave a row blank with nothing to trigger another attempt.
 */
export async function fetchDefinitionsFor(
  table: CorpusTable,
  ids: string[],
): Promise<{ id: string; definition: string | null }[]> {
  if (!ids.length) return [];
  const { data, error } = await withDeadline(
    async () => await supabase.from(table).select('id, definition').in('id', ids),
    'glossary definitions batch',
    PAGE_DEADLINE_MS,
  );
  if (error) throw error;
  return (data ?? []) as { id: string; definition: string | null }[];
}
