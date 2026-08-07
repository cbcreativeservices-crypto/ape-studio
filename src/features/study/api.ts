/**
 * Study-methods data layer.
 * Reads: topic glossary items (the item universe = glossary_topics rows) and
 * the student's own method row (item_states seed for deck ordering).
 * Writes: ONLY via the record_study_progress RPC (WM ruling: no table grants).
 */
import { supabase } from '../../lib/supabase';
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

export async function fetchTopicItems(achievementId: string): Promise<GlossaryItem[]> {
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

  // 2) Base display fields (NOT common_mistakes) — a top-level select of the
  //    granted columns from base `glossary` works fine under the column-level
  //    grants. We do NOT embed and we do NOT read common_mistakes here.
  const { data, error } = await supabase
    .from('glossary')
    .select(
      'id, term, definition, plain_english, purpose_function, practical_application, scenario_contexts, related_terms, category, difficulty',
    )
    .in('id', ids);
  if (error) throw error;
  const items: GlossaryItem[] = (data ?? []).map((g: any) => ({
    ...g,
    common_mistakes: null,
    formula_symbolic: null,
    formula_words: null,
  }));
  const byId = new Map<string, GlossaryItem>(items.map((it) => [it.id, it]));

  // 3) common_mistakes from the academy-gated view — NON-FATAL. The view's mask
  //    calls has_academy_access(), which anon/free roles cannot EXECUTE yet
  //    (backend grant pending), so this query 403s for them. That must NOT break
  //    study loading — on any failure common_mistakes stays null (falls back to
  //    the definition), exactly what non-academy users see anyway (Booth 2026-07-11).
  try {
    const { data: masked, error: mErr } = await supabase
      .from('glossary_full_v')
      .select('id, common_mistakes')
      .in('id', ids);
    if (mErr) {
      console.warn('[study] common_mistakes unavailable:', mErr.message);
    } else {
      for (const m of (masked ?? []) as any[]) {
        const it = byId.get(m.id);
        if (it) it.common_mistakes = m.common_mistakes ?? null;
      }
    }
  } catch (e) {
    console.warn('[study] common_mistakes fetch threw:', (e as Error).message);
  }

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
  const { data, error } = await supabase
    .from('glossary')
    .select(
      'id, term, definition, plain_english, purpose_function, practical_application, scenario_contexts, related_terms, category, difficulty',
    )
    .in('id', ids);
  if (error) throw error;
  const items: GlossaryItem[] = (data ?? []).map((g: any) => ({
    ...g,
    common_mistakes: null,
    formula_symbolic: null,
    formula_words: null,
  }));
  const byId = new Map<string, GlossaryItem>(items.map((it) => [it.id, it]));
  try {
    const { data: masked } = await supabase
      .from('glossary_full_v')
      .select('id, common_mistakes')
      .in('id', ids);
    for (const m of (masked ?? []) as any[]) {
      const it = byId.get(m.id);
      if (it) it.common_mistakes = m.common_mistakes ?? null;
    }
  } catch {
    // non-fatal — same rule as fetchTopicItems
  }
  return items.sort((a, b) => a.term.localeCompare(b.term));
}

/**
 * Term images (glossary_media, Booth 2026-07-16): first image per term for
 * the flashcard TERM view. The table is academy/institutional-only
 * (authenticated SELECT), so any error/empty just returns {} — cards without
 * an image render exactly as before. URLs resolve into the public
 * glossary-images bucket.
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

/**
 * Smooth display progress (Booth 2026-07-07: LEDs must creep, never leap).
 * completion_pct only moves when an item reaches ALL required passes, so a
 * full first pass reads 0% then jumps. This grants partial credit per pass:
 *   flashcards — known = full credit, else views/2 (capped)
 *   fill/matching — attempts/required_passes (capped)
 * Derived from the SAME item_states grammar the server stores — display
 * only; every gate still reads the server's completion/time/accuracy fields.
 */
export function studyDisplayPct(
  states: ItemStates,
  totalItems: number,
  methodKey: string,
  requiredPasses = 2,
): number {
  if (totalItems <= 0) return 0;
  let credit = 0;
  for (const key of Object.keys(states)) {
    if (key.startsWith('_')) continue; // reserved keys (e.g. _batches)
    const v = states[key];
    if (methodKey === 'flashcards') {
      // Booth 2026-07-09: flashcards is a view-based method — a single reveal
      // (or "known") counts a card fully studied for the display %, so one
      // thorough pass reaches 100%. (The SERVER gate still uses views≥2 OR
      // known; if the backend wants display==gate, set flashcard required
      // views to 1 — flagged in the backend hand-off.)
      credit += v.known || (v.views ?? 0) >= 1 ? 1 : 0;
    } else {
      credit += Math.min(v.attempts ?? 0, requiredPasses) / requiredPasses;
    }
  }
  return Math.min(100, (credit / totalItems) * 100);
}

/**
 * Sentence tools (Booth 2026-07-08): practice methods (fill-in-blank,
 * matching) present ONE randomly-chosen sentence of a definition per showing,
 * so students learn to spot meaning anywhere in a definition instead of
 * pattern-matching the first sentence. Flashcards still show everything.
 * (Quiz stems are server-authored and rendered verbatim — single-sentence
 * stems there are a question-bank change, flagged for the backend session.)
 */
export function splitSentences(text: string): string[] {
  const parts = text
    // Split on ender+space, AND on a missing space before a new capitalized
    // sentence ("...ends.Next...") — those were slipping 2+ sentences into one
    // matching cell (Booth 2026-07-16).
    .split(/(?<=[.!?])\s+|(?<=[.!?])(?=[A-Z0-9("'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : [text];
}

export function randomSentence(text: string): string {
  const parts = splitSentences(text);
  return parts[Math.floor(Math.random() * parts.length)];
}

/** Regexes that detect the term leaking into its own definition text: the base
 *  name (parenthetical stripped, space/hyphen tolerant, optional plural) and
 *  any parenthetical abbreviation (e.g. "(XLR)"). */
function termLeakPatterns(term: string): RegExp[] {
  const out: RegExp[] = [];
  const add = (phrase: string) => {
    const p = phrase.trim();
    if (p.length < 2) return;
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[\s-]+/g, '[\\s-]+');
    out.push(new RegExp(`\\b${esc}(s|es)?\\b`, 'gi'));
  };
  add(term.replace(/\s*\([^)]*\)\s*$/, '')); // base name
  const paren = term.match(/\(([^)]+)\)\s*$/);
  if (paren) add(paren[1]); // abbreviation
  return out;
}

/**
 * Sentence choice for MATCHING (Booth 2026-07-16): exactly ONE sentence, and
 * it must NOT contain the term it pairs with — same word, abbreviation, or
 * spelling (a leaked term made boards trivially solvable). Preference:
 * a random non-leaking sentence; if every sentence leaks, the shortest one is
 * used with the term masked out as "___".
 */
export function matchingSentence(term: string, definition: string): string {
  const parts = splitSentences(definition);
  const pats = termLeakPatterns(term);
  const clean = parts.filter((p) => !pats.some((re) => (re.lastIndex = 0) || re.test(p)));
  if (clean.length > 0) return clean[Math.floor(Math.random() * clean.length)];
  const shortest = [...parts].sort((a, b) => a.length - b.length)[0] ?? definition;
  return pats.reduce((s, re) => ((re.lastIndex = 0), s.replace(re, '___')), shortest);
}

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
  if (error) throw error;
  if (!data) return null;
  const states: ItemStates = {};
  const raw = (data.item_states ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith('_')) states[k] = v as ItemState;
  }
  return { itemStates: states, completionPct: data.completion_pct ?? 0 };
}
