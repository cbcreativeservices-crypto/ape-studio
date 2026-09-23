-- Let a signed-in user READ THEIR OWN enrolment rows.
--
-- WHY THIS IS NEEDED
-- `public.user_topic_enrollments` has RLS ENABLED and **zero policies**, and no
-- grant to `authenticated` — i.e. deny-all to every client. `sync_my_enrollments`
-- (SECURITY DEFINER) is the only writer in the entire repo and nothing can ever
-- read the list back. That is why the WEBSITE dashboard was still reading the
-- retired v1 `enrollment` + `courses` model: there was no readable v3 source.
--
-- The v1 model is now dead data — `achievements.course_id` is NULL on all 166
-- live v3 topics — so the website's progress panel reported "you're not enrolled
-- in any topics yet / 0 of 0 / 0%" to 100% of signed-in members while their
-- credentials rendered correctly beside it.
--
-- WHAT THIS GRANTS
-- SELECT only, own rows only. It exposes nothing the user does not already hold
-- on their own device (the device list is the source of truth; this table is the
-- server mirror of it).
--
-- ⛔ `user_id` HERE IS `public.users.id`, NOT `auth.uid()`.
-- Verified against live data before writing this: 91 of 91 rows join on
-- `users.id` and 0 on `users.auth_id`. The qual therefore resolves through
-- `users`, copying the idiom from the existing `own_achievement_progress`
-- policy character for character.
--
-- ⛔ BOTH HALVES ARE REQUIRED, AND THE GRANT IS THE HALF THAT GETS FORGOTTEN.
-- A policy WITHOUT a grant returns **zero rows rather than an error**, so the
-- page would look like it worked and quietly show everybody nothing. This
-- project has already shipped that exact failure once (the v3 cert/program
-- catalog, and again on the glossary view for guests).

begin;

grant select on public.user_topic_enrollments to authenticated;

drop policy if exists own_topic_enrollments on public.user_topic_enrollments;
create policy own_topic_enrollments
  on public.user_topic_enrollments
  for select
  using (
    user_id = (select users.id from public.users where users.auth_id = (select auth.uid()))
  );

commit;

-- VERIFY (expect: one 'authenticated'/'SELECT' grant row, and one policy row)
--
--   select grantee, privilege_type
--     from information_schema.role_table_grants
--    where table_schema='public' and table_name='user_topic_enrollments'
--      and grantee='authenticated';
--
--   select policyname, cmd, qual
--     from pg_policies
--    where schemaname='public' and tablename='user_topic_enrollments';
--
-- Then, signed in as an ordinary member in the browser, this must return that
-- member's OWN rows and nobody else's:
--
--   select gs, active, position from public.user_topic_enrollments order by position;

-- ROLLBACK
--
--   drop policy if exists own_topic_enrollments on public.user_topic_enrollments;
--   revoke select on public.user_topic_enrollments from authenticated;
