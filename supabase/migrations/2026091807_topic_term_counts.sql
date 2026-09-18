-- ============================================================================
-- APE STUDIO · 2026-09-18 · APPLIED TO PRODUCTION
--   migration: topic_term_counts_rpc
--
-- topic_term_counts — count a topic's glossary terms WITHOUT shipping the rows.
--
-- The Dashboard used to fetch every (achievement_id, glossary_id) mapping row
-- for every enrolled topic and tally them in a JS loop: 100 KB to 1.5 MB of
-- uuids whose only purpose was to be counted. It runs on every focus of the
-- Study tab AND after every study write, so a member on mobile data paid for it
-- again and again to learn a handful of integers.
--
-- PostgREST can group-and-count natively, but `db-aggregates-enabled` is not set
-- on the authenticator role (checked 2026-09-18), so that path is unavailable.
--
-- ── SECURITY INVOKER, DELIBERATELY ──────────────────────────────────────────
--
-- No SECURITY DEFINER. The client already reads glossary_topics directly, so the
-- caller's own RLS is exactly the right visibility — and a definer here would be
-- a new way to probe the mapping table for ids the caller cannot otherwise see.
-- It answers with counts only, for ids the caller names.
--
-- VERIFIED after applying, against real ids: rpc counts == row counts
-- (291/291, 149/149, 139/139, 110/110, 77/77).
--
-- The client keeps the old row-download as a fallback (features/dashboard/api.ts)
-- so a build reaching a server without this function still draws a correct
-- dashboard rather than a silent 0%.
create or replace function public.topic_term_counts(p_ids uuid[])
returns table (achievement_id uuid, n integer)
language sql
stable
set search_path = public
as $$
  select gt.achievement_id, count(*)::integer
    from glossary_topics gt
   where gt.achievement_id = any(p_ids)
   group by gt.achievement_id;
$$;

revoke all on function public.topic_term_counts(uuid[]) from public;
grant execute on function public.topic_term_counts(uuid[]) to authenticated;

comment on function public.topic_term_counts(uuid[]) is
  'Per-topic glossary term counts for the Dashboard. Replaces downloading every mapping row to count it client-side.';
