/**
 * useAcademyStats — the six DB-derived counts for the Explore "Academy at a
 * Glance" hero (glossary terms, topics, subjects, certificates, programs,
 * questions), precomputed nightly server-side (public.academy_stats, refreshed
 * by the refresh_academy_stats cron) and read through the anon-callable
 * get_academy_stats() RPC (owner 2026-09-15).
 *
 * INSTANT LOAD: the last successful values are cached in AsyncStorage and
 * returned synchronously-after-mount, so the hero shows real numbers with ZERO
 * spinner on every launch after the first; a background RPC then refreshes the
 * cache for the next day. The other three hero figures (calculators, labs,
 * tools) are app-side constants and are already instant, so they are not here.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export type AcademyStats = {
  terms: number | null;
  topics: number | null;
  subjects: number | null;
  certificates: number | null;
  programs: number | null;
  questions: number | null;
};

const EMPTY: AcademyStats = { terms: null, topics: null, subjects: null, certificates: null, programs: null, questions: null };
const CACHE_KEY = 'ape:academyStats:v1';

function coerce(row: Record<string, unknown> | null | undefined): AcademyStats | null {
  if (!row) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return {
    terms: num(row.terms),
    topics: num(row.topics),
    subjects: num(row.subjects),
    certificates: num(row.certificates),
    programs: num(row.programs),
    questions: num(row.questions),
  };
}

export function useAcademyStats(): AcademyStats {
  const [stats, setStats] = useState<AcademyStats>(EMPTY);
  useEffect(() => {
    let alive = true;
    // 1) Instant paint from cache.
    void AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const cached = coerce(JSON.parse(raw));
          if (cached) setStats(cached);
        } catch {
          /* ignore corrupt cache */
        }
      })
      // READ failed (wave 2, 2026-10-02, confirmed): no instant paint, the RPC
      // below still fills the hero. The cache is only ever REPLACED WHOLE by a
      // fresh server row, never merged into, so a failed read cannot lead to
      // anything stored being written over with less.
      .catch(() => {});
    // 2) Background refresh from the daily precomputed row.
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('get_academy_stats');
        if (!alive || error || !data) return;
        const row = Array.isArray(data) ? data[0] : data;
        const fresh = coerce(row as Record<string, unknown>);
        if (fresh) {
          setStats(fresh);
          // Silent on purpose: an instant-paint cache of a server row, refetched every open.
          void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
        }
      } catch {
        /* offline / RPC error — keep cached values */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return stats;
}
