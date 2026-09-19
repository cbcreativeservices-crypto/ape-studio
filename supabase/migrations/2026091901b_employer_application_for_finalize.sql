-- 2026-09-19 · the finalize function could not READ the application it decides
--
-- APPLIED TO PRODUCTION 2026-09-19 (mcp apply_migration).
--
-- 2026091901 granted EXECUTE on employer_decide / employer_apply_remote_checks
-- to service_role and stopped there. The edge function ALSO does a read before
-- it reaches those RPCs, and service_role holds SELECT on 5 of 129 public
-- tables here — neither employer_applications nor users among them. PostgREST
-- switches to the service_role DB role, so the GRANT is checked before RLS or
-- BYPASSRLS matters. The reads failed, the function returned 500
-- lookup_failed, and NEITHER rpc was ever reached.
--
-- Worst-shaped failure available: employer_apply had already succeeded, so the
-- row existed and the form said "Application received", while the application
-- sat pending forever with nobody notified.
--
-- An RPC rather than `grant select on users to service_role`: the grant works
-- but hands the whole user table over to answer one id lookup. This answers
-- exactly the question asked, and folds the ownership test into its WHERE so
-- the edge function cannot get the join wrong.

create or replace function public.employer_application_for_finalize(
  p_id uuid,
  p_auth_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  status text,
  company_name text,
  company_website text,
  work_email text,
  role_title text,
  hiring_for text,
  checks jsonb
)
language sql
security definer
stable
set search_path to 'public'
as $$
  select a.id, a.user_id, a.status, a.company_name, a.company_website,
         a.work_email, a.role_title, a.hiring_for, a.checks
    from public.employer_applications a
    join public.users u on u.id = a.user_id
   where a.id = p_id
     and u.auth_id = p_auth_id;
$$;

revoke execute on function public.employer_application_for_finalize(uuid, uuid) from public, anon, authenticated;
grant  execute on function public.employer_application_for_finalize(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
