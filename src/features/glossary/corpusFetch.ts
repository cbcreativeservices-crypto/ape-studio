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

export type CorpusTable = 'glossary' | 'glossary_browse_v';
export type CorpusTerm = { id: string; term: string; achievement_id: string | null };

/** Hand the JS thread back for a turn — 32 pages is too many to hold it for. */
export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Page the whole term list. Rejects on any failed page. */
export async function fetchCorpusTerms(table: CorpusTable): Promise<CorpusTerm[]> {
  const all: CorpusTerm[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('id, term, achievement_id')
      .order('term')
      .range(from, from + PAGE - 1);
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
  const { data, error } = await supabase.from(table).select('id, definition').in('id', ids);
  if (error) throw error;
  return (data ?? []) as { id: string; definition: string | null }[];
}
