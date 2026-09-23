/**
 * useCurriculumStats — total glossary term count + per-topic (gs) term counts,
 * for the Curriculum overview and per-subject "total terms" (user request
 * 2026-07-22).
 *
 * Reads only. NON-BLOCKING: returns nulls/empty until it resolves, and stays
 * empty on any error (e.g. anon RLS) so the tree just shows "—".
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export type CurriculumStats = { totalTerms: number | null; totalQuestions: number | null; termsByGs: Map<number, number> };

const PAGE = 1000;

/**
 * Total glossary terms, through the anon-callable definer RPC.
 *
 * ⚠️ This used to be `from('glossary').select('id', { count: 'exact', head: true })`
 * — twice. The glossary gateway's revokes
 * (docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md) take the client's
 * SELECT on `glossary` away, and a head count is a SELECT: both would have come
 * back 42501 and the curriculum's term totals would simply have stopped
 * appearing, with nothing on screen to connect that to the glossary. The build
 * plan asserted this file was already on `get_glossary_term_count()`; it was
 * not. Now it is.
 */
async function totalGlossaryTerms(): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_glossary_term_count');
  if (error) {
    console.warn('[curriculum] term count unavailable:', error.message);
    return null;
  }
  const n = Number(data);
  return Number.isFinite(n) ? n : null;
}

/** Total approved practice questions, through the anon-callable definer RPC
 *  (quiz_questions is admin-only, so a head count would 42501). */
async function totalQuestions(): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_question_count');
  if (error) {
    console.warn('[curriculum] question count unavailable:', error.message);
    return null;
  }
  const n = Number(data);
  return Number.isFinite(n) ? n : null;
}

/** Per-topic term counts for the given topic gs list (owner 2026-08-06: driven by
 *  the LIVE v3 curriculum, not the retired v2 matrix). */
export function useCurriculumStats(gsList: number[]): CurriculumStats {
  const [stats, setStats] = useState<CurriculumStats>({ totalTerms: null, totalQuestions: null, termsByGs: new Map() });
  const gsKey = gsList.join(',');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const allGs = gsList;
        if (allGs.length === 0) {
          const [c0, q0] = await Promise.all([totalGlossaryTerms(), totalQuestions()]);
          if (alive) setStats({ totalTerms: c0, totalQuestions: q0, termsByGs: new Map() });
          return;
        }
        // Total distinct glossary terms + approved question bank (definer RPCs).
        const [count, qCount] = await Promise.all([totalGlossaryTerms(), totalQuestions()]);

        // gs → achievement id, then count glossary_topics rows per achievement.
        const { data: ach } = await supabase
          .from('achievements')
          .select('id, global_sequence')
          .in('global_sequence', allGs);
        const gsById = new Map<string, number>(
          ((ach ?? []) as { id: string; global_sequence: number }[]).map((a) => [a.id, a.global_sequence]),
        );
        const ids = [...gsById.keys()];

        // ── ONE REQUEST, NOT TWENTY-SEVEN (2026-09-18) ────────────────────
        //
        // This used to PAGE THE ENTIRE glossary→topic join table, a thousand
        // rows at a time, in a SERIAL loop — 26,855+ rows means ~27 HTTP round
        // trips awaited one after another, ~37 KB each, 5–10 seconds of
        // continuous network on 4G. It started the instant Explore mounted,
        // competing with the curriculum fetch, the certificate fetch and the
        // topic tile images.
        //
        // All of it to fill ONE LINE — "{n} topics · {terms} terms" — inside a
        // SUBJECTS accordion that is collapsed when the screen opens.
        //
        // `topic_term_counts` does the grouping in Postgres and returns one
        // small row per topic. The paged walk is kept as a fallback so a client
        // reaching a server without the function still shows real numbers
        // rather than blanks.
        const termsByGs = new Map<number, number>();
        let counted = false;
        if (ids.length) {
          const agg = await supabase.rpc('topic_term_counts', { p_ids: ids });
          if (!agg.error && Array.isArray(agg.data)) {
            for (const r of agg.data as { achievement_id: string; n: number }[]) {
              if (typeof r?.n !== 'number' || !Number.isFinite(r.n)) {
                counted = false;
                termsByGs.clear();
                break;
              }
              const gs = gsById.get(r.achievement_id);
              if (gs != null) termsByGs.set(gs, r.n);
              counted = true;
            }
          }
        }
        if (ids.length && !counted) {
          for (let from = 0; ; from += PAGE) {
            const { data, error } = await supabase
              .from('glossary_topics')
              .select('achievement_id')
              .in('achievement_id', ids)
              // ⛔ ORDER BEFORE RANGE. PostgREST does not guarantee a stable row
              // order without one, so unordered pages can repeat or skip rows —
              // and this tally is what the per-subject "N terms" line reports.
              // `fetchCorpusTerms` already orders before ranging; this did not.
              // (overnight hunt 2026-09-23)
              .order('achievement_id')
              .range(from, from + PAGE - 1);
            if (error || !data || data.length === 0) break;
            for (const r of data as { achievement_id: string }[]) {
              const gs = gsById.get(r.achievement_id);
              if (gs != null) termsByGs.set(gs, (termsByGs.get(gs) ?? 0) + 1);
            }
            if (data.length < PAGE) break;
          }
        }
        if (alive) setStats({ totalTerms: count ?? null, totalQuestions: qCount ?? null, termsByGs });
      } catch {
        if (alive) setStats({ totalTerms: null, totalQuestions: null, termsByGs: new Map() });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gsKey]);
  return stats;
}
