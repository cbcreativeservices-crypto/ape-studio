/**
 * Study-methods data layer.
 * Reads: topic glossary items (the item universe = glossary_topics rows) and
 * the student's own method row (item_states seed for deck ordering).
 * Writes: ONLY via the record_study_progress RPC (WM ruling: no table grants).
 */
import { supabase } from '../../lib/supabase';
import { withSessionRetry } from './sessionRetry';
import { SUPABASE_URL } from '../../lib/env';

export type GlossaryItem = {
  id: string;
  term: string;
  definition: string;
  plain_english: string | null;
  purpose_function: string | null;
  practical_application: string | null;
  scenario_contexts: string[] | null;
  common_mistakes: string[] | null;
  related_terms: string[] | null;
  category: string | null;
  difficulty: string | null;
  /** Equation/formula fields (glossary.formula_symbolic / formula_words). A term
   *  is an "equation/formula" when formula_symbolic is non-empty. NOT selected in
   *  the study fetches below: as of 2026-07-26 no client role (anon/authenticated)
   *  holds a SELECT grant on these two columns, so adding them to the study SELECT
   *  would 403 the whole fetch. Populated null here until the backend grants them;
   *  the Glossary "Equations & Formulas" filter reads them via its own isolated,
   *  non-fatal query (see GlossaryScreen.loadAllGlossaryFormulas). */
  formula_symbolic: string | null;
  formula_words: string | null;
};

export type ItemState = { views?: number; known?: boolean; attempts?: number; correct?: number };
export type ItemStates = Record<string, ItemState>;

/** §4 snapshot returned by record_study_progress (server truth for LED + gates). */
export type StudySnapshot = {
  method_key: string;
  completion_pct: number;
  done_count: number;
  total_items: number;
  engagement_seconds: number;
  answered_count: number;
  correct_count: number;
  gates: { completion: boolean; time: boolean; accuracy: boolean };
  gate_pass: boolean;
  duplicate_batch: boolean;
};

/** True once the client has hydrated a persisted session — see sessionRetry. */
const hasSession = async () => !!(await supabase.auth.getSession()).data.session;

export async function fetchTopicItems(achievementId: string): Promise<GlossaryItem[]> {
  return withSessionRetry(() => fetchTopicItemsOnce(achievementId), hasSession);
}

async function fetchTopicItemsOnce(achievementId: string): Promise<GlossaryItem[]> {
  // v2.13 (backend handoff 2026-07-16): study fetch goes through the
  // `glossary_study_v` view — one query keyed by achievement_id, with the
  // free-topic exception (anon/free can study gs0/gs36) and common_mistakes
  // masked per entitlement server-side. Any error or empty result falls back
  // to the legacy base-table path below, so institutional study never breaks.
  try {
    const { data, error } = await supabase
      .from('glossary_study_v')
      .select(
        'glossary_id, term, definition, plain_english, purpose_function, practical_application, scenario_contexts, related_terms, category, difficulty, common_mistakes',
      )
      .eq('achievement_id', achievementId)
      .order('term');
    if (!error && data && data.length > 0) {
      return (data as any[]).map((g) => ({
        id: g.glossary_id,
        term: g.term,
        definition: g.definition,
        plain_english: g.plain_english ?? null,
        purpose_function: g.purpose_function ?? null,
        practical_application: g.practical_application ?? null,
        scenario_contexts: g.scenario_contexts ?? null,
        common_mistakes: g.common_mistakes ?? null,
        related_terms: g.related_terms ?? null,
        category: g.category ?? null,
        difficulty: g.difficulty ?? null,
        formula_symbolic: g.formula_symbolic ?? null,
        formula_words: g.formula_words ?? null,
      }));
    }
    if (error) console.warn('[study] glossary_study_v unavailable, falling back:', error.message);
  } catch (e) {
    console.warn('[study] glossary_study_v threw, falling back:', (e as Error).message);
  }

  // ---- DUPLICATE-ACHIEVEMENT fallback (owner 2026-08-06) ----
  // The v3 launch left several achievement rows sharing one topic NAME, with the
  // glossary terms mapped to only ONE of those ids. If the id we were handed has
  // no terms (e.g. Professional Audio Safety), union across every achievement_id
  // that shares this id's name — the same dedup-by-name the glossary screen uses.
  // Still goes through glossary_study_v, so entitlement gating is preserved.
  try {
    const { data: self } = await supabase
      .from('achievements')
      .select('name')
      .eq('id', achievementId)
      .maybeSingle();
    const nm = (self as any)?.name as string | undefined;
    if (nm) {
      const { data: sibs } = await supabase.from('achievements').select('id').eq('name', nm);
      const sibIds = ((sibs ?? []) as any[]).map((r) => r.id).filter((id: string) => id && id !== achievementId);
      if (sibIds.length > 0) {
        const { data: udata, error: uErr } = await supabase
          .from('glossary_study_v')
          .select(
            'glossary_id, term, definition, plain_english, purpose_function, practical_application, scenario_contexts, related_terms, category, difficulty, common_mistakes',
          )
          .in('achievement_id', sibIds)
          .order('term');
        if (!uErr && udata && udata.length > 0) {
          const seen = new Set<string>();
          const out: GlossaryItem[] = [];
          for (const g of udata as any[]) {
            if (seen.has(g.glossary_id)) continue;
            seen.add(g.glossary_id);
            out.push({
              id: g.glossary_id,
              term: g.term,
              definition: g.definition,
              plain_english: g.plain_english ?? null,
              purpose_function: g.purpose_function ?? null,
              practical_application: g.practical_application ?? null,
              scenario_contexts: g.scenario_contexts ?? null,
              common_mistakes: g.common_mistakes ?? null,
              related_terms: g.related_terms ?? null,
              category: g.category ?? null,
              difficulty: g.difficulty ?? null,
              formula_symbolic: null,
              formula_words: null,
            });
          }
          if (out.length > 0) return out;
        }
      }
    }
  } catch (e) {
    console.warn('[study] name-union fallback threw:', (e as Error).message);
  }

  // ---- Legacy path (pre-v2.13) ----
  // 1) Which glossary terms belong to this topic (base mapping table).
  const { data: links, error: lErr } = await supabase
    .from('glossary_topics')
    .select('glossary_id')
    .eq('achievement_id', achievementId);
  if (lErr) throw lErr;
  const ids = (links ?? []).map((r: any) => r.glossary_id).filter(Boolean) as string[];
  if (ids.length === 0) return [];

  // 2) Display fields, INCLUDING the masked common_mistakes, in ONE read of
  //    `glossary_study_v` (2026-09-13). This used to be two queries: base
  //    columns from `glossary` plus common_mistakes from `glossary_full_v`.
  //    Both of those relations lose their client SELECT grant when the glossary
  //    gateway's revokes run, and the study view already carries every column
  //    with the same academy mask applied — so this is one query instead of
  //    two AND the only one that survives.
  //    Verified on the live schema 2026-09-13: 0 of 26,855 glossary rows are
  //    unlinked from `glossary_topics`, so the view's inner join loses nothing.
  const byId = await fetchStudyRowsByIds(ids);

  // Preserve the topic's link order.
  return ids.map((id) => byId.get(id)).filter(Boolean) as GlossaryItem[];
}

/**
 * Items for the user's own "Flagged" pseudo-topic (Booth 2026-07-18): fetch
 * glossary rows straight by id (the shared flagged list from flaggedStore).
 * Same shape as fetchTopicItems; common_mistakes filled non-fatally from the
 * academy-gated view, exactly like the legacy path above.
 */
export async function fetchGlossaryItemsByIds(idList: string[]): Promise<GlossaryItem[]> {
  const ids = idList.filter(Boolean);
  if (ids.length === 0) return [];
  // Same cold-start race as fetchTopicItems — it reaches the same view.
  const byId = await withSessionRetry(() => fetchStudyRowsByIds(ids), hasSession);
  return [...byId.values()].sort((a, b) => a.term.localeCompare(b.term));
}

/**
 * The one read shared by both paths above: glossary ids -> study items, from
 * `glossary_study_v`.
 *
 * ⚠️ WHY NOT `glossary`. The glossary gateway
 * (docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md) revokes the client's
 * SELECT on `glossary` and `glossary_full_v`; study would have gone dark for
 * members with no hint that the glossary was the cause. This view carries every
 * column study needs and applies the same academy mask to common_mistakes.
 *
 * ⚠️ The view is an inner join through `glossary_topics`, so a term is returned
 * ONCE PER TOPIC it belongs to. Deduplicate by id, preferring the row that
 * actually carries common_mistakes — the mask lets those through only for
 * members, and for everyone on the two free topics (gs3060 / gs3970), so the
 * first row for a term is not always the most complete one.
 */
async function fetchStudyRowsByIds(ids: string[]): Promise<Map<string, GlossaryItem>> {
  const { data, error } = await supabase
    .from('glossary_study_v')
    .select(
      'glossary_id, term, definition, plain_english, purpose_function, practical_application, scenario_contexts, related_terms, category, difficulty, common_mistakes',
    )
    .in('glossary_id', ids);
  if (error) throw error;
  const byId = new Map<string, GlossaryItem>();
  for (const g of (data ?? []) as any[]) {
    const existing = byId.get(g.glossary_id);
    if (existing && !(g.common_mistakes?.length && !existing.common_mistakes?.length)) continue;
    byId.set(g.glossary_id, {
      id: g.glossary_id,
      term: g.term,
      definition: g.definition,
      plain_english: g.plain_english ?? null,
      purpose_function: g.purpose_function ?? null,
      practical_application: g.practical_application ?? null,
      scenario_contexts: g.scenario_contexts ?? null,
      common_mistakes: g.common_mistakes ?? null,
      related_terms: g.related_terms ?? null,
      category: g.category ?? null,
      difficulty: g.difficulty ?? null,
      formula_symbolic: null,
      formula_words: null,
    });
  }
  return byId;
}

/**
 * Term images (glossary_media, Booth 2026-07-16): first image per term for
 * the flashcard TERM view. Readable by EVERY role incl. anon (owner ruling
 * 2026-08-17: images carry no separate gate — access control lives at the
 * topic gate). Any error/empty just returns {} — cards without an image
 * render exactly as before. URLs resolve into the public glossary-images
 * bucket.
 */
export async function fetchTopicMedia(glossaryIds: string[]): Promise<Record<string, string>> {
  if (glossaryIds.length === 0) return {};
  try {
    const { data, error } = await supabase
      .from('glossary_media')
      .select('glossary_id, media_type, url, sort_order')
      .in('glossary_id', glossaryIds)
      .order('sort_order');
    if (error || !data) return {};
    const out: Record<string, string> = {};
    for (const m of data as { glossary_id: string; media_type: string | null; url: string | null }[]) {
      if (!m.url || (m.media_type && m.media_type !== 'image')) continue;
      if (!out[m.glossary_id]) {
        out[m.glossary_id] = `${SUPABASE_URL}/storage/v1/object/public/${m.url}`;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Topic name(s) a glossary term belongs to (owner 2026-08-06) — for the
 *  Flashcards linked-term overlay, which shows the external term's topic. Dedups
 *  by NAME so the v3 duplicate achievements (same name, different ids) collapse
 *  to one topic label. Non-fatal: returns [] on any error. */
export async function fetchTermTopicNames(glossaryId: string): Promise<string[]> {
  try {
    const { data: links } = await supabase
      .from('glossary_topics')
      .select('achievement_id')
      .eq('glossary_id', glossaryId);
    const ids = [...new Set(((links ?? []) as any[]).map((r) => r.achievement_id).filter(Boolean))];
    if (ids.length === 0) return [];
    const { data: achs } = await supabase.from('achievements').select('id, name').in('id', ids);
    return [...new Set(((achs ?? []) as any[]).map((a) => a.name).filter(Boolean))] as string[];
  } catch {
    return [];
  }
}

/**
 * Smooth display progress (Booth 2026-07-07: LEDs must creep, never leap).
 * Mirrors the SERVER completion rule exactly (owner 2026-08-06 gate change):
 *   flashcards — each card SEEN once (views>=1 OR known) = full credit
 *   other      — each question answered CORRECTLY once (correct>=1) = full credit
 * Derived from the SAME item_states grammar the server stores. No timer gate.
 */
export function studyDisplayPct(
  states: ItemStates,
  totalItems: number,
  methodKey: string,
  _requiredPasses = 1,
): number {
  if (totalItems <= 0) return 0;
  let credit = 0;
  for (const key of Object.keys(states)) {
    if (key.startsWith('_')) continue; // reserved keys (e.g. _batches)
    const v = states[key];
    if (methodKey === 'flashcards') {
      credit += v.known || (v.views ?? 0) >= 1 ? 1 : 0;
    } else {
      // Correct once = fully studied (matches record_study_progress step 9).
      credit += (v.correct ?? 0) >= 1 ? 1 : 0;
    }
  }
  return Math.min(100, (credit / totalItems) * 100);
}

// Sentence tools moved to `./sentences` (dependency-free, shared with the Node
// audit harness + tests — study-method text audit 2026-09-05). Re-exported so
// existing importers keep working.
export { splitSentences, randomSentence, matchingSentence } from './sentences';

/** Seed local mirrors from the server row (missing row = fresh method). */
export async function fetchMethodState(
  achievementId: string,
  methodKey: string,
): Promise<{ itemStates: ItemStates; completionPct: number } | null> {
  const { data, error } = await supabase
    .from('student_method_progress')
    .select('item_states, completion_pct')
    .eq('achievement_id', achievementId)
    .eq('method_key', methodKey)
    .maybeSingle();
  // NON-FATAL (user bug 2026-08-13): student_method_progress is user-scoped, so a
  // GUEST (anon role) has no grant and this read 403s. That must NOT fail the whole
  // study-screen load — the free topics are studyable signed-out, with progress on
  // the device-local mirror. Return null and let the screen render with local state
  // (same resilience the Dashboard already uses for guests).
  if (error) {
    console.warn('[study] method state unavailable (guest?):', error.message);
    return null;
  }
  if (!data) return null;
  const states: ItemStates = {};
  const raw = (data.item_states ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith('_')) states[k] = v as ItemState;
  }
  return { itemStates: states, completionPct: data.completion_pct ?? 0 };
}
