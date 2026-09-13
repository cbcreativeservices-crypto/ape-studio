-- =====================================================================
-- GLOSSARY GATEWAY — THE REMAINING SERVER WORK, IN ORDER
-- Pro Audio Training Academy · project yjgolswjggmlpeowvtxr · 2026-09-13
-- =====================================================================
--
-- The client half is already shipped and is INERT until STEP 2 below runs.
-- Nothing in this file is applied yet.
--
-- HOW TO RUN IT: Supabase dashboard → SQL Editor → paste ONE step at a time,
-- in order, and read the verification block that follows each one. Do NOT paste
-- the whole file in one go — STEP 5 must not run until the client build with
-- the gateway is actually on phones.
--
-- STATUS 2026-09-13 — THE GATEWAY IS LIVE. Steps 0-4 are done.
--   STEP 0  Enable anonymous sign-ins   ✅ owner, confirmed by probe: signup
--                                          returns 200 with is_anonymous=true
--   STEP 1  Ground truth                ✅ PASSED (all four)
--   STEP 2  Create the browse view      ✅ APPLIED — the feature is now live
--   STEP 3  Counting gateway RPC        ✅ APPLIED + verified on all four paths
--   STEP 4  7-day purge                 ✅ APPLIED (cron jobid 3) + cascade proven
--   STEP 5  The revokes                 ✅ APPLIED 2026-09-13 (owner go)
--   STEP 6  Prove the revokes took      ✅ read back + proven over real HTTP
--
-- ✅ IT IS NOW A BOUNDARY. Proven over real HTTP after the revokes:
--     anon key alone      -> glossary / glossary_full_v / glossary_study_v  401
--     WITH a device key   -> glossary 403, glossary_full_v 403
--                            glossary_browse_v 200 (120-char teaser)
--                            get_glossary_definition -> used 1 of 14, full text
--
-- ✅ THE 413-ROW RESIDUAL IS CLOSED (owner go, migrations
-- `glossary_teaser_fraction_cap` + `glossary_teaser_ellipsis`).
--
-- `left(definition, 120)` could not truncate a definition already shorter than
-- 120 characters, so 413 terms outside the free topics were shown in FULL. A
-- constant cap leaks everything below it; a proportional one cannot. Both views
-- now use
--     left(g.definition, least(120, length(g.definition) / 2)) || '…'
-- The shortest definition in the corpus is 31 characters, so the shortest
-- teaser is 15 (+1 for the ellipsis) — never empty.
--
-- PROVEN by asking whether the shown text EQUALS the real text, not by a length
-- threshold (a length test is what produced a false alarm the first time —
-- em dashes make Postgres `left()` and Python `len()` disagree):
--     glossary_browse_v  0 full-text rows / 26,855 true prefixes / all ellipsed
--     glossary_study_v   0 full-text rows outside the free topics
--                        (the 390 free-study rows stay full, correctly unellipsed)
--     members            unchanged, avg definition 331 chars, all fields
--
-- COST, measured: 5,598 rows (20.85%) — everything under 240 characters — now
-- show a shorter preview. Rows at or above 240 are unchanged at 120. There is
-- no formula that both fully previews a short definition and withholds it.
--
-- The ellipsis is not decoration: the shorter teaser FITS inside the row's
-- 2-line clamp, so the client never adds its own "…" and the text just stopped
-- mid-word, which reads as a rendering fault. Device-checked before and after.
--
-- Full reasoning: docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md
-- Already applied, separately: the glossary_study_v content mask
--   (docs/APE_GLOSSARY_STUDY_V_MASK_2026_09_13.SQL)
--
-- =====================================================================


-- =====================================================================
-- STEP 0 — ENABLE ANONYMOUS SIGN-INS  (dashboard, ~20 seconds, NOT SQL)
-- =====================================================================
--
-- This is the ONE part that has no SQL and no API — it is a project setting.
--
--   Supabase dashboard → Authentication → Sign In / Providers
--   → find "Allow anonymous sign-ins" → turn it ON → Save
--
-- It is OFF by default. Without it `supabase.auth.signInAnonymously()` fails at
-- runtime with a 422, and the client FAILS OPEN — the glossary keeps working,
-- unmetered, and nobody is ever asked for consent. So the symptom of skipping
-- this step is SILENCE, not breakage. Check the toggle rather than assume it.
--
-- Do this BEFORE step 2, or the first guests to open the glossary after the
-- view appears will silently fall through to the old unmetered path.


-- =====================================================================
-- STEP 1 — GROUND TRUTH  (read-only; all four were verified 2026-09-13)
-- =====================================================================
-- Re-run it to confirm nothing drifted. Expected:
--   pg_cron 1.6.4 · usage_fk_ondelete 'c' (CASCADE) · consume_returns as shown
--   · anon_users_today 0

select
  (select extversion from pg_extension where extname = 'pg_cron')            as pg_cron,
  (select confdeltype from pg_constraint c
     join pg_class t on t.oid = c.conrelid
     join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'glossary_usage'
      and c.contype = 'f' limit 1)                                           as usage_fk_ondelete,
  (select pg_get_function_result(p.oid) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'glossary_consume')           as consume_returns,
  (select count(*) from auth.users where is_anonymous = true)                as anon_users_today;

-- `usage_fk_ondelete = 'c'` is what makes the consent copy TRUE: deleting the
-- anonymous user in step 4 deletes their definition count with it, with no
-- extra code. If that ever reads anything but 'c', the dialog's promise
-- ("deleted automatically after 7 days, along with your definition count") is
-- no longer accurate and the copy must change before this ships.
--
-- ⚠️ ALREADY APPLIED 2026-09-13, and you should know it happened:
-- migration `fix_glossary_consume_ambiguous_used_column`.
--
-- glossary_consume() returns TABLE(used int, ...), which makes `used` an OUT
-- PARAMETER as well as a column of glossary_usage. Its increment read
--     set used = used + 1
-- unqualified — ambiguous, SQLSTATE 42702 — so EVERY glossary lookup after the
-- first one in a rolling window threw. The client fails open on a consume
-- error, so nothing looked broken: the count never passed 1, the "7 left"
-- warning never fired, the lock never triggered. **The server-side 14/week cap
-- had never capped anyone since it went live on 2026-09-10.**
--
-- Found because the RPC in step 3 calls glossary_consume(), so the gateway
-- would have inherited the same silence and metered nothing at all.
--
-- Fixed by aliasing the table (`set used = u.used + 1`). Verified live through
-- a full cycle: 1..14 allowed, the 15th refused without incrementing, and a
-- window aged past 7 days re-anchors to 1. Rollback:
-- docs/APE_GLOSSARY_CONSUME_FIX_2026_09_13.SQL

-- Re-run this to confirm the cap is really counting (expects 1 then 2):
begin;
  insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, updated_at)
  values ('00000000-0000-0000-0000-0000000000aa','00000000-0000-0000-0000-000000000000',
          'authenticated','authenticated', true, now(), now());
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}';
  select used, lim, allowed from public.glossary_consume();
  select used, lim, allowed from public.glossary_consume();
rollback;


-- =====================================================================
-- STEP 2 — THE BROWSE VIEW   ⚠️ THE FEATURE GOES LIVE THE MOMENT THIS RUNS
-- =====================================================================
--
-- ✅ APPLIED 2026-09-13, migration `glossary_gateway_browse_view`, after the
-- owner enabled anonymous sign-ins and a probe confirmed it (signup -> 200,
-- is_anonymous true). Verified end to end over REAL HTTP with the shipped anon
-- key and a real anonymous session, not by SQL impersonation:
--
--   no key   -> GET glossary_browse_v          401 / 42501 permission denied
--               (the exact signal probeGateway() reads as "gateway is live")
--   no key   -> POST rpc/get_glossary_definition  401 / 42501
--   key      -> corpus rows: definition exactly 120 chars, plain_english null
--   key      -> rpc open 1: used 1 of 14, full definition, mistakes null
--   key      -> rpc open 2: used 2 of 14
--   member   -> 26,449 full definitions, all plain_english, all mistakes
--
-- Side effect worth knowing: the view also exposes formula_symbolic /
-- formula_words, which NO client role holds a column grant on. The Equations &
-- Formulas filter has therefore always shown nothing; through this view it now
-- resolves 1,973 terms.
--
-- ⚠️ `sign_in_required` inside the RPC is effectively UNREACHABLE from a
-- client: `anon` has no EXECUTE grant, so PostgREST refuses with 42501 before
-- the function body runs. The client maps that to 'denied' and fails open,
-- which is harmless because it never calls the RPC without a key (the corpus
-- does not load until one exists). Defence in depth, not a defect — but do not
-- write docs claiming the client distinguishes the two.
--
-- Every phone already running the shipped build probes for this view once per
-- app session. Until now the probe answers "absent" and nothing changes for
-- anyone. From the second this executes, guests opening the glossary get the
-- consent dialog. Treat this as the launch, not as plumbing.
--
-- Granted to `authenticated` ONLY. A guest with no device key gets 42501 on it,
-- and the client reads that denial as "the gateway is live, go get a key" —
-- that is the designed signal, not a failure.
--
-- The 120-character teaser is deliberate: it keeps the browsable list readable
-- as a list rather than a wall of bare words, and it is what makes the 2-line
-- collapsed preview meaningful. If even that is too much, drop the column and
-- accept a terms-only list — the client renders either.

create or replace view public.glossary_browse_v as
select
  g.id,
  g.term,
  g.category,
  g.difficulty,
  g.achievement_id,
  -- No client role holds a column grant on these two today, so the direct
  -- select 403s for everyone and the Equations & Formulas filter has always
  -- shown nothing. Reading them through this view fixes that for free.
  g.formula_symbolic,
  g.formula_words,
  case when public.has_academy_access(auth.uid())
       then g.definition else left(g.definition, 120) end as definition,
  case when public.has_academy_access(auth.uid())
       then g.plain_english else null::text end as plain_english,
  case when public.has_academy_access(auth.uid())
       then g.common_mistakes else null::text[] end as common_mistakes
from public.glossary g;

grant select on public.glossary_browse_v to authenticated;   -- NOT anon

-- VERIFY: expect anon=false, authenticated=true.
select has_table_privilege('anon', 'public.glossary_browse_v', 'SELECT')          as anon_select,
       has_table_privilege('authenticated', 'public.glossary_browse_v', 'SELECT') as auth_select;


-- =====================================================================
-- STEP 3 — THE COUNTING GATEWAY      ✅ APPLIED 2026-09-13
-- =====================================================================
-- migration `glossary_gateway_get_glossary_definition`. Privileges read back
-- anon=false / authenticated=true. Verified in a rolled-back transaction on
-- every path the client classifies:
--     signed out          -> sign_in_required
--     guest open 1, 2     -> used 1, 2 of 14, full definition, mistakes masked
--     guest open 15       -> weekly_limit_reached
--     academy member      -> not metered, full row INCLUDING common_mistakes
-- It is inert until step 2 exists: the client only calls it once the browse
-- view answers the probe.
--
-- ⚠️ The column list is WIDER than "the definition". Once step 5 revokes
-- `glossary`, this RPC is the only way ANY of the detail fields can be read —
-- by members too. A narrower RPC empties the expanded term for everyone,
-- silently, and the cause looks nothing like the glossary.
--
-- `used` / `lim` / `window_start` ride along so the halfway heads-up and the
-- lock countdown cost no extra round trip. Verified 2026-09-13:
-- glossary_consume() returns (used int, lim int, window_start timestamptz,
-- allowed boolean) — `select * into _u` below matches that exactly.
--
-- ⚠️ The two exception MESSAGES are a contract with the client, which matches
-- on the text, not the SQLSTATE (how errcode 'PGRST' surfaces through PostgREST
-- is an implementation detail; the message is ours). Keep 'sign_in_required'
-- and 'weekly_limit_reached' spelled exactly as they are, or
-- test/glossaryGatewayFault.test.ts is describing an app that does not exist.

create or replace function public.get_glossary_definition(p_id uuid)
returns table (
  definition text,
  plain_english text,
  purpose_function text,
  practical_application text,
  scenario_contexts text[],
  related_terms text[],
  category text,
  difficulty text,
  common_mistakes text[],
  used int,
  lim int,
  window_start timestamptz
)
language plpgsql
security definer
set search_path to ''
as $fn$
declare _u record;
begin
  -- Members are never metered.
  if public.has_academy_access(auth.uid()) then
    return query
      select g.definition, g.plain_english, g.purpose_function,
             g.practical_application, g.scenario_contexts, g.related_terms,
             g.category, g.difficulty, g.common_mistakes,
             null::int, null::int, null::timestamptz
      from public.glossary g where g.id = p_id;
    return;
  end if;

  -- Everyone else must be signed in — which, for a guest, means holding the
  -- temporary device key they consented to.
  if auth.uid() is null then
    raise exception 'sign_in_required' using errcode = 'PGRST';
  end if;

  select * into _u from public.glossary_consume();
  if not coalesce(_u.allowed, false) then
    raise exception 'weekly_limit_reached' using errcode = 'PGRST';
  end if;

  -- common_mistakes stays member-only, exactly as glossary_full_v masks it.
  return query
    select g.definition, g.plain_english, g.purpose_function,
           g.practical_application, g.scenario_contexts, g.related_terms,
           g.category, g.difficulty, null::text[],
           _u.used, _u.lim, _u.window_start
    from public.glossary g where g.id = p_id;
end $fn$;

revoke execute on function public.get_glossary_definition(uuid) from public;
grant  execute on function public.get_glossary_definition(uuid) to authenticated;

-- VERIFY: expect anon_exec=false, auth_exec=true.
select has_function_privilege('anon', 'public.get_glossary_definition(uuid)', 'EXECUTE')          as anon_exec,
       has_function_privilege('authenticated', 'public.get_glossary_definition(uuid)', 'EXECUTE') as auth_exec;

-- VERIFY the metering actually counts, WITHOUT leaving anything behind.
--
-- ⚠️ TWO THINGS THE FIRST DRAFT OF THIS BLOCK GOT WRONG, both found by running
-- it rather than reading it:
--   1. It selected `allowed`. That column belongs to glossary_consume(), NOT to
--      this RPC — this one RAISES instead of returning a false flag. The error
--      the owner hit was `42703: column "allowed" does not exist`.
--   2. It impersonated a uid that does not exist in auth.users. glossary_usage
--      has a foreign key to auth.users, so glossary_consume() cannot write a
--      row for a fabricated user — it fails on the FK. The probe user has to be
--      real, hence the insert below (rolled back with everything else).
--
-- Expect: used=1 then used=2, a full definition, and common_mistakes masked to
-- null for this non-member.

begin;
  insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, updated_at)
  values ('00000000-0000-0000-0000-0000000000ab','00000000-0000-0000-0000-000000000000',
          'authenticated','authenticated', true, now(), now());

  set local role authenticated;
  set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000ab","role":"authenticated"}';

  select used, lim, left(definition, 45) as def_head,
         common_mistakes is null as mistakes_masked
  from public.get_glossary_definition((select id from public.glossary order by term limit 1));

  select used, lim
  from public.get_glossary_definition((select id from public.glossary order by term limit 1 offset 1));
rollback;

-- VERIFY the signed-OUT refusal. Expect: 'sign_in_required'.
begin;
  set local role anon;
  select public.get_glossary_definition((select id from public.glossary order by term limit 1));
rollback;
-- (That one is SUPPOSED to error. Seeing `sign_in_required` is the pass.)


-- =====================================================================
-- STEP 4 — THE 7-DAY PURGE           ✅ APPLIED 2026-09-13 (cron jobid 3)
-- =====================================================================
-- Registered, active, 03:17 daily, clear of the two existing jobs. The exact
-- DELETE was run against probe rows in a rolled-back transaction:
--     8-day-old device key       -> DELETED
--     6-day-old device key       -> kept (not purged early)
--     9-day-old REAL account     -> kept (the is_anonymous guard holds)
--     the deleted key's count    -> CASCADED away
--     other users' counts        -> untouched
-- That fourth line is what makes "along with your definition count" true.
--
-- "deleted automatically after 7 days, along with your definition count."
-- The count goes with it through the CASCADE confirmed in step 1 — no extra
-- code. 03:17 rather than a round hour so it does not pile onto the two jobs
-- already scheduled.

select cron.schedule(
  'purge-anon-devices',
  '17 3 * * *',
  $job$ delete from auth.users
         where is_anonymous = true
           and created_at < now() - interval '7 days' $job$
);

-- VERIFY it is registered and active.
select jobid, jobname, schedule, active from cron.job where jobname = 'purge-anon-devices';

-- VERIFY THE CASCADE FIRES, on a throwaway row, rolled back. Expect
-- usage_rows_before = 1 and usage_rows_after = 0. Do not skip this: the
-- consent copy is only true if it passes.
begin;
  insert into auth.users (id, instance_id, aud, role, is_anonymous, created_at, updated_at)
  values ('00000000-0000-0000-0000-0000000000ff', '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated', true, now(), now());
  insert into public.glossary_usage (user_id, used, window_start)
  values ('00000000-0000-0000-0000-0000000000ff', 3, now());
  select count(*) as usage_rows_before from public.glossary_usage
   where user_id = '00000000-0000-0000-0000-0000000000ff';
  delete from auth.users where id = '00000000-0000-0000-0000-0000000000ff';
  select count(*) as usage_rows_after from public.glossary_usage
   where user_id = '00000000-0000-0000-0000-0000000000ff';
rollback;
-- (glossary_usage is (user_id, window_start, used, updated_at); the two columns
-- omitted above both carry defaults, checked 2026-09-13. The point of the test
-- is the DELETE, not the INSERT.)


-- =====================================================================
-- STEP 5 — THE REVOKES.  ⚠️ NOT UNTIL 5a PASSES.
-- =====================================================================
--
-- 5a. STOP. Before running anything below, confirm ALL THREE:
--
--   (1) A build containing the gateway client is installed on the phones you
--       care about — not just committed, INSTALLED. Run it and open the
--       glossary; you should see the consent dialog as a guest.
--   (2) Step 0's toggle is ON, and accepting the dialog actually produces a
--       session (this query returns > 0 after you have tapped AGREE once):
--         select count(*) from auth.users where is_anonymous = true;
--   (3) You accept that a signed-out guest — one who taps NOT NOW, or any
--       older build already on a phone — loses the glossary AND free-topic
--       study, because the third line below takes `anon`'s last read away.
--       That is the deliberate end state, but it is a product change beyond
--       the glossary, so decide it rather than discover it.
--
-- Reversed order kills the glossary in every build already installed,
-- including the ones that will never update. There is no undo for that except
-- re-granting.

revoke select on public.glossary         from anon, authenticated;
revoke select on public.glossary_full_v  from anon, authenticated;
revoke select on public.glossary_study_v from anon;

-- ⚠️ THE 2026-08-28 GOTCHA. A revoke that does not name `public` is a silent
-- NO-OP when the privilege is held by PUBLIC, which anon and authenticated
-- inherit. If step 6 shows anything still true, this is why — run:
--   revoke select on public.glossary        from public;
--   revoke select on public.glossary_full_v from public;


-- =====================================================================
-- STEP 6 — PROVE IT. "No errors" proves nothing.
-- =====================================================================
-- Expected after step 5:
--   glossary            anon=false auth=false
--   glossary_full_v     anon=false auth=false
--   glossary_study_v    anon=false auth=true      (study keeps it, masked)
--   glossary_browse_v   anon=false auth=true
--   glossary_topics     anon=true  auth=true      (term links, no definitions)

select c.relname,
       has_table_privilege('anon', c.oid, 'SELECT')          as anon_select,
       has_table_privilege('authenticated', c.oid, 'SELECT') as auth_select
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('glossary','glossary_full_v','glossary_study_v',
                    'glossary_browse_v','glossary_topics','glossary_media')
order by c.relname;

-- And the real question, asked the way an attacker would: is there ANY
-- client-readable relation left that still carries definition text? Expect
-- only glossary_browse_v (teasers) and glossary_study_v (masked).
select distinct c.relname,
       has_table_privilege('anon', c.oid, 'SELECT')          as anon_select,
       has_table_privilege('authenticated', c.oid, 'SELECT') as auth_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join information_schema.columns col
  on col.table_schema = n.nspname and col.table_name = c.relname
where n.nspname = 'public'
  and c.relkind in ('r','v','m')
  and col.column_name in ('definition','plain_english')
  and (has_table_privilege('anon', c.oid, 'SELECT')
       or has_table_privilege('authenticated', c.oid, 'SELECT'))
order by c.relname;
