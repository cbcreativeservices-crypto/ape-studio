-- 2026-09-19 · employer accounts: three fixes from the end-to-end audit
--
-- APPLIED TO PRODUCTION 2026-09-19 (mcp apply_migration), in two statements:
-- `employer_application_for_finalize` and then these two. All latent only
-- because the feature has never run once — every employer table is empty.
--
-- ═══ 1 · THE FINALIZE FUNCTION COULD NOT READ THE APPLICATION ══════════════
--     (migration 2026091901 fixed the FUNCTION acls and missed the TABLE grants)
--
-- The edge function did two direct table reads before reaching the RPCs:
--     from("employer_applications")   from("users")
-- service_role has SELECT on 5 of 129 public tables here and neither is one
-- of them. PostgREST switches to the service_role DB role, so the GRANT is
-- checked before RLS or BYPASSRLS matters. Both reads failed → 500
-- lookup_failed → employer_apply_remote_checks and employer_decide NEVER RAN.
--
-- The user-visible shape is the worst kind: employer_apply already succeeded,
-- so the row exists and the form says "Application received", while the
-- application sits pending forever and nobody is notified.
--
-- Fixed with a SECURITY DEFINER RPC granted to service_role ONLY, which also
-- folds the ownership check into its WHERE so the edge function cannot get
-- the join wrong. Preferred over `grant select on users to service_role`,
-- which would hand the whole user table over to answer one id lookup.
-- (Shipped in its own migration: employer_application_for_finalize.)
--
-- ═══ 2 · fetchMyEmployerInterests RETURNED EVERY EMPLOYER'S INTERESTS ══════
--
-- The client selected employer_profile_interests with NO user filter. The RLS
-- policy there deliberately exposes all rows for any non-revoked employer (it
-- backs the public profile). With one employer this looks correct; with two,
-- employer B opens their profile, sees A's chips lit, toggles one, and
-- employer_set_interests rewrites B's rows from the MERGED list — B's real
-- selections destroyed, silently.
--
-- Client-side filtering is not available: the client holds an auth uid, not
-- public.users.id, and conflating those is a documented trap in this codebase.

create or replace function public.employer_my_interests()
returns table (kind text, slug text)
language sql
security definer
stable
set search_path to 'public'
as $$
  select i.kind, i.slug
    from public.employer_profile_interests i
   where i.user_id = public.directory_me();
$$;

revoke execute on function public.employer_my_interests() from public, anon;
grant  execute on function public.employer_my_interests() to authenticated;

-- ═══ 3 · RE-APPLYING SHOWED A RAW POSTGRES ERROR ═══════════════════════════
--
-- employer_apply had no guard against an existing live application, so the
-- partial unique index employer_applications_one_live raised 23505 and the
-- web form rendered the driver text verbatim:
--   duplicate key value violates unique constraint "employer_applications_one_live"
-- Anyone who double-taps submit, or applies again while pending, saw that.
-- The guard is added at the top; everything else is byte-identical to the
-- previous body. The WHOLE function is reproduced because a migration that
-- only describes its change cannot be replayed.

create or replace function public.employer_apply(
  p_company_name text,
  p_company_website text,
  p_work_email text,
  p_role_title text,
  p_hiring_for text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me uuid := public.directory_me();
  site_domain text;
  mail_domain text;
  v_checks jsonb;
  new_id uuid;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if not public.directory_email_verified() then
    raise exception 'verify your account email before applying' using errcode = '42501';
  end if;

  -- Say what actually happened, in the applicant's terms, before the unique
  -- index says it in Postgres's terms.
  if exists (select 1 from public.employer_applications
              where user_id = me and status in ('pending', 'approved')) then
    raise exception 'you already have an employer application in progress' using errcode = '22023';
  end if;

  if coalesce(trim(p_company_name), '') = '' then
    raise exception 'a company name is required' using errcode = '22023';
  end if;

  site_domain := public.employer_domain_of(p_company_website);
  mail_domain := public.employer_domain_of(p_work_email);

  if site_domain is null then
    raise exception 'enter your company website, e.g. acme.com' using errcode = '22023';
  end if;
  if mail_domain is null or position('@' in p_work_email) = 0 then
    raise exception 'enter a work email address' using errcode = '22023';
  end if;

  -- The evidence, derived here so it cannot be forged.
  v_checks := jsonb_build_object(
    'site_domain',        site_domain,
    'mail_domain',        mail_domain,
    'email_matches_site', (mail_domain = site_domain or mail_domain like ('%.' || site_domain)),
    'free_mail',          public.employer_is_free_mail(mail_domain),
    'computed_at',        now()
  );

  insert into public.employer_applications
    (user_id, company_name, company_website, work_email, role_title, hiring_for, checks)
  values (me, trim(p_company_name), trim(p_company_website), trim(p_work_email),
          trim(coalesce(p_role_title, '')), nullif(trim(coalesce(p_hiring_for, '')), ''), v_checks)
  returning id into new_id;
  return new_id;
end;
$function$;

notify pgrst, 'reload schema';
