-- ============================================================================
-- APE STUDIO · 2026-09-18 · APPLIED TO PRODUCTION
--   migration name: revoke_public_execute_on_refresh_and_tenure
--
-- Two SECURITY DEFINER functions were still carrying Postgres's DEFAULT
-- EXECUTE grant to PUBLIC. PUBLIC includes `anon`, so both were callable by
-- anyone holding the shipped publishable key.
--
-- Revoking from `anon` alone does nothing while PUBLIC holds the grant. That
-- was tried first (2026091803) and changed nothing — see that file.
-- ============================================================================

-- ── 1 · refresh_academy_stats ───────────────────────────────────────────────
--
-- SECURITY DEFINER. Runs unbounded count(*) over glossary (22,744 rows),
-- achievements, certificates, programs and quiz_questions, then writes
-- academy_stats — all as `postgres`. Callable by anon, that is an
-- unauthenticated load amplifier against the largest tables in the database,
-- at full privilege, billed to the owner, with no rate limit in front of it.
--
-- The sibling function settles that this is an oversight and not a policy:
-- refresh_glossary_stats is the same shape on the same cron pattern and its
-- ACL was already {postgres=X/postgres}. This one never got the revoke.
--
-- SAFE: the only caller is cron job 4, which runs as `postgres` — the function
-- owner, who keeps EXECUTE regardless. VERIFIED EMPIRICALLY after applying:
-- `select public.refresh_academy_stats();` as postgres succeeded and
-- academy_stats.computed_at advanced.
--
-- The client never calls it; it READS the result through get_academy_stats,
-- which is separately and deliberately granted to anon and is untouched.
revoke execute on function public.refresh_academy_stats() from public;

-- ── 2 · member_month_complete ───────────────────────────────────────────────
--
-- Added earlier the same day with the tenure rule. SECURITY DEFINER taking an
-- arbitrary uuid, so the PUBLIC grant let anyone probe "has this user held a
-- complete paid month?" for any auth id they could obtain.
--
-- SAFE: the only client caller (src/features/finalExam/tenure.ts) reads the
-- session first and returns early when there is none, so it is always invoked
-- as `authenticated`. submit_final_exam and release_pending_credentials call it
-- server-side as the definer, where role grants do not apply.
--
-- It also fails safe: a denial lands in tenure.ts's error branch, which
-- resolves to 'unknown' — the briefing states the policy and the exam proceeds.
-- Nobody is blocked from sitting an exam by this.
revoke execute on function public.member_month_complete(uuid) from public;

-- Keep the intended grant explicit rather than inherited.
grant execute on function public.member_month_complete(uuid) to authenticated;

-- ── VERIFIED AFTER ──────────────────────────────────────────────────────────
--   refresh_academy_stats   {postgres=X/postgres}                  anon=false
--   refresh_glossary_stats  {postgres=X/postgres}                  (matches)
--   member_month_complete   {postgres=X/…, authenticated=X/…}      anon=false
--   get_academy_stats       unchanged, still anon-readable by design
