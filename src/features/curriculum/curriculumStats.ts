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

export type CurriculumStats = { totalTerms: number | null; termsByGs: Map<number, number> };

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

/** Per-topic term counts for the given topic gs list (owner 2026-08-06: driven by
 *  the LIVE v3 curriculum, not the retired v2 matrix). */
export function useCurriculumStats(gsList: number[]): CurriculumStats {
  const [stats, setStats] = useState<CurriculumStats>({ totalTerms: null, termsByGs: new Map() });
  const gsKey = gsList.join(',');
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const allGs = gsList;
        if (allGs.length === 0) {
          const c0 = await totalGlossaryTerms();
          if (alive) setStats({ totalTerms: c0, termsByGs: new Map() });
          return;
        }
        // Total distinct glossary terms (one cheap definer RPC).
        const count = await totalGlossaryTerms();

        // gs → achievement id, then count glossary_topics rows per achievement.
        const { data: ach } = await supabase
          .from('achievements')
          .select('id, global_sequence')
          .in('global_sequence', allGs);
        const gsById = new Map<string, number>(
          ((ach ?? []) as { id: string; global_sequence: number }[]).map((a) => [a.id, a.global_sequence]),
        );
        const ids = [...gsById.keys()];

        const termsByGs = new Map<number, number>();
        if (ids.length) {
          for (let from = 0; ; from += PAGE) {
            const { data, error } = await supabase
              .from('glossary_topics')
              .select('achievement_id')
              .in('achievement_id', ids)
              .range(from, from + PAGE - 1);
            if (error || !data || data.length === 0) break;
            for (const r of data as { achievement_id: string }[]) {
              const gs = gsById.get(r.achievement_id);
              if (gs != null) termsByGs.set(gs, (termsByGs.get(gs) ?? 0) + 1);
            }
            if (data.length < PAGE) break;
          }
        }
        if (alive) setStats({ totalTerms: count ?? null, termsByGs });
      } catch {
        if (alive) setStats({ totalTerms: null, termsByGs: new Map() });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gsKey]);
  return stats;
}
