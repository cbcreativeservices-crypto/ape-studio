-- 2026-09-19 · employer accounts: let the finalize function actually decide
--
-- APPLIED TO PRODUCTION 2026-09-19 (mcp apply_migration).
--
-- ── WHAT WAS BROKEN ────────────────────────────────────────────────────────
--
-- `employer-apply-finalize` (Edge Function) runs with the SERVICE ROLE and
-- calls two functions to finish an application:
--
--     employer_apply_remote_checks(uuid, jsonb)   -- record DNS/HTTP evidence
--     employer_decide(uuid)                       -- approve, or queue w/ reasons
--
-- Both were created owned by `postgres` with ACL `{postgres=X/postgres}` —
-- nobody else, including service_role. And service_role does NOT inherit from
-- postgres in Supabase (verified: pg_has_role('service_role','postgres','USAGE')
-- is false).
--
-- So every call would have failed with "permission denied for function", and
-- the failure mode is the nasty kind: `employer_apply` succeeds, the applicant
-- sees their application submitted, and it then sits pending forever because
-- the step that decides it can never run. Nothing errors in the user's face.
--
-- Found by reading the ACLs rather than by a failing request — there were zero
-- applications in the table, so nothing had ever exercised the path.
--
-- ── WHY service_role AND NOTHING ELSE ──────────────────────────────────────
--
-- Deciding an application grants the verified-employer badge, which is what
-- lets an account contact members without publishing a community profile
-- (see contact_request_send). An end user must never be able to call it —
-- that is precisely why the user-facing half is the separate `employer_apply`,
-- which only records evidence it derives itself and cannot approve anything.
--
-- The REVOKEs are belt and braces, and they name PUBLIC explicitly: revoking
-- from `anon` alone is a no-op while PUBLIC holds EXECUTE, which already
-- produced one false "revoked" this week.

grant execute on function public.employer_apply_remote_checks(uuid, jsonb) to service_role;
grant execute on function public.employer_decide(uuid) to service_role;

revoke execute on function public.employer_apply_remote_checks(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.employer_decide(uuid) from public, anon, authenticated;

-- Verified after applying:
--   employer_apply_remote_checks   anon=f  authenticated=f  service_role=t
--   employer_decide                anon=f  authenticated=f  service_role=t
--   employer_apply                 anon=f  authenticated=t  service_role=f   (user-facing)
--   employer_review                anon=f  authenticated=t  service_role=f   (self-guards on is_admin())
