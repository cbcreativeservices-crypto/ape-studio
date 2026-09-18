-- ============================================================================
-- APE STUDIO · STAGE 1 — the foundations. SAFE TO RUN TODAY.
-- 2026-09-18 · Supabase SQL editor, as owner. Project yjgolswjggmlpeowvtxr.
--
-- ⚠️ READ THIS FIRST
--
-- This stage changes NO BEHAVIOUR. It adds two columns, widens one constraint,
-- adds one function and one table. Nothing that exists today starts acting
-- differently. Certificates keep being awarded exactly as they are now.
--
-- It is written this way on purpose: it is the prerequisite for everything
-- else, it can go in before you have decided anything, and if you stop here the
-- app is strictly better off than it is now (refunds start working).
--
-- Runs in one transaction. If any statement fails, nothing is applied.
-- Idempotent: running it twice is harmless.
--
-- AFTER RUNNING IT, run the verification block at the bottom. Then, and only
-- then, deploy the edge functions — migration first, functions second. Deploy a
-- function before this and a real purchase charges the customer and returns
-- grant_failed, because it reads columns that do not exist yet.
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- 1 · THE REFUND STATUS  ⛔ this is a live bug
--
-- Q1 (2026-09-18) returned:
--   entitlements_status_check  CHECK (status = ANY (ARRAY['active','lapsed','revoked']))
--
-- `store-notifications` writes status='refunded'. That write is REJECTED by
-- this constraint, and the webhook returns 200 anyway — so Apple and Google
-- never retry and every refund silently does nothing.
--
-- Precedent: the neighbouring `source` constraint did exactly this to access
-- codes ("EVERY code redemption was rejected by the database",
-- docs/APE_OWNER_SQL_2026_09_07.sql). That one was widened. This one was not.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.entitlements
  drop constraint if exists entitlements_status_check;

alter table public.entitlements
  add constraint entitlements_status_check
  check (status in ('active', 'lapsed', 'revoked', 'refunded'));


-- ─────────────────────────────────────────────────────────────────────────
-- 2 · THE TENURE COLUMNS  ⛔ both edge functions read these
--
-- Q2 (2026-09-18) returned nine columns and neither of these was among them.
--
--   member_since — the first day of the CURRENT unbroken paid run. Not the
--                  first day they ever paid: a lapse resets it, which is the
--                  owner's rule ("lapses reset it").
--   refunded_at  — set when money goes back. The owner's rule is absolute:
--                  "no certificates if they refund and I never get paid
--                  anything." A refunded run earns nothing, whatever its dates.
--
-- Both nullable. A row that predates this migration has no member_since, and
-- that is correct — see the backfill note in section 5.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.entitlements
  add column if not exists member_since timestamptz,
  add column if not exists refunded_at  timestamptz;

comment on column public.entitlements.member_since is
  'First day of the CURRENT unbroken paid run. Reset by a lapse beyond the grace window, by a refund, and on a first grant. Null means tenure is unknown, never zero.';
comment on column public.entitlements.refunded_at is
  'Set when money was returned. A refunded run earns no credential, whatever its dates.';

-- Tenure is read on every exam start. One index, partial, tiny.
create index if not exists entitlements_tenure_idx
  on public.entitlements (user_id, member_since)
  where refunded_at is null;


-- ─────────────────────────────────────────────────────────────────────────
-- 3 · THE TENURE TEST — `member_month_complete()`
--
-- The rule (owner, 2026-09-17 / 2026-09-18):
--   • one COMPLETE paid month before a certificate is issued
--   • the clock starts on the first paid day
--   • a lapse resets it
--   • an admin grant counts as paid
--   • a refund earns nothing
--
-- WHY `interval '1 month'` AND NOT 30 DAYS. In a 31-day month,
-- `now() - interval '1 month'` is 31 days ago. A grant of exactly 30 days would
-- therefore expire before it ever qualified — which is precisely why the month
-- access-code tier was changed to 35 days in production. Keep them consistent:
-- if you ever change this interval, check the code tier with it.
--
-- WHY IT DOES NOT REQUIRE status='active'. Someone who paid for two months and
-- then stopped has earned their month. The disqualifier is a REFUND, not a
-- lapse — "no certificates if they refund and I never get paid anything".
--
-- Defaults to auth.uid() so the client can call it with no arguments, which is
-- what `src/features/finalExam/tenure.ts` does.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.member_month_complete(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.entitlements e
     where e.user_id      = p_user
       and e.product      = 'academy'
       and e.refunded_at  is null
       and e.member_since is not null
       and e.member_since <= now() - interval '1 month'
  );
$$;

revoke all on function public.member_month_complete(uuid) from public;
grant execute on function public.member_month_complete(uuid) to authenticated;

comment on function public.member_month_complete(uuid) is
  'True when the user has held one complete, unrefunded paid month. Read by the Final Exam briefing and by the credential release path.';


-- ─────────────────────────────────────────────────────────────────────────
-- 4 · WHERE ELIGIBILITY WILL LIVE — `credential_eligibility`
--
-- Today `evaluate_user_credentials` INSERTS straight into `credential_awards`
-- the moment the topics are complete. Under the owner's policy that is too
-- early: finishing the topics earns congratulations, not a certificate. The
-- certificate comes after the Final Exam, and after the paid month.
--
-- So the topic check needs somewhere to record "this person has finished the
-- work for this credential" WITHOUT it being an award. That is this table.
--
-- Creating it now changes nothing — nothing writes to it until Stage 2, and
-- nothing reads it until the exam path is ready. It is here so Stage 2 is a
-- function swap rather than a schema change.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.credential_eligibility (
  user_id          uuid        not null references auth.users(id) on delete cascade,
  credential_type  text        not null check (credential_type in ('certificate','program')),
  credential_id    uuid        not null,
  became_eligible_at timestamptz not null default now(),
  primary key (user_id, credential_type, credential_id)
);

comment on table public.credential_eligibility is
  'The learner has completed every topic this credential requires. NOT an award — the award needs the Final Exam and one complete paid month. Written by evaluate_user_credentials.';

alter table public.credential_eligibility enable row level security;

-- Read-only to the owner of the row. Nothing client-side may write it: writes
-- come from evaluate_user_credentials, which is security definer.
drop policy if exists own_credential_eligibility on public.credential_eligibility;
create policy own_credential_eligibility
  on public.credential_eligibility
  for select
  using (user_id = auth.uid());

grant select on public.credential_eligibility to authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 5 · THE CUTOVER SWITCH — `app_flags`
--
-- Stage 2 changes who awards a certificate. That is the highest-stakes change
-- in the product and it lands in launch week, so it must be reversible in one
-- statement, by you, at 2am, without a deploy.
--
-- `certificate_requires_exam`:
--   false (default, set here) — TODAY'S BEHAVIOUR. Topics complete → award.
--   true                      — the new policy. Topics complete → eligibility
--                               only; the award comes from the exam path.
--
-- Stage 2 installs a function that reads this flag and honours both branches.
-- Running Stage 2 therefore changes NOTHING on its own. Flipping this flag is
-- the actual cutover, and flipping it back is the actual rollback.
--
-- ⚠️ Do not set it true until the exam path can award. If nothing can award,
--    nobody gets a certificate at all.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.app_flags (
  key        text        primary key,
  enabled    boolean     not null default false,
  note       text,
  updated_at timestamptz not null default now()
);

comment on table public.app_flags is
  'Server-side switches that must be reversible without a deploy. Read by security-definer functions only; not client-readable.';

insert into public.app_flags (key, enabled, note)
values (
  'certificate_requires_exam',
  false,
  'false = topics complete awards the certificate (behaviour as of 2026-09-18). true = topics complete records eligibility only; the Final Exam and one complete paid month award it.'
)
on conflict (key) do nothing;

alter table public.app_flags enable row level security;
-- No policy: RLS on with zero policies means no client can read or write it.
-- Security-definer functions bypass RLS and are the only intended readers.

commit;


-- ============================================================================
-- VERIFY — run this after the transaction commits
-- ============================================================================

-- 1 · the refund status is now allowed
select conname, pg_get_constraintdef(oid) as definition
  from pg_constraint
 where conrelid = 'public.entitlements'::regclass and contype = 'c';
-- EXPECT: entitlements_status_check now lists 'refunded'.

-- 2 · both columns exist
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entitlements'
   and column_name in ('member_since','refunded_at');
-- EXPECT: two rows, both YES (nullable).

-- 3 · the tenure function answers
select public.member_month_complete('00000000-0000-0000-0000-000000000000'::uuid) as unknown_user;
-- EXPECT: false. (Not an error — a user with no row has no tenure.)

-- 4 · the flag is present and OFF
select key, enabled, note from public.app_flags;
-- EXPECT: certificate_requires_exam, false.

-- 5 · nothing has changed for anyone
select count(*) as awards_total from public.credential_awards;
-- EXPECT: the same number as before you ran this.


-- ============================================================================
-- BACKFILL — decide, then run ONE of these. Not part of the transaction.
-- ============================================================================
--
-- Every existing entitlement now has member_since = NULL, which
-- member_month_complete reads as "no tenure". So until you backfill, EVERY
-- existing member reads as not-yet-qualified.
--
-- That matters less than it sounds like, because nothing enforces tenure until
-- you flip the Stage 2 flag. But if you flip that flag without backfilling,
-- your existing paying members are the ones who get told their results are
-- held. Choose deliberately.
--
-- OPTION A — credit existing members from when their row was created.
-- Honest for anyone who has been paying continuously. Slightly generous to
-- someone who lapsed and came back, because created_at does not know about it.
--
--   update public.entitlements
--      set member_since = created_at
--    where product = 'academy'
--      and member_since is null
--      and refunded_at is null
--      and status in ('active','lapsed');
--
-- OPTION B — credit only CURRENT members, from their row's creation.
-- Stricter. Someone lapsed today starts a fresh clock if they come back.
--
--   update public.entitlements
--      set member_since = created_at
--    where product = 'academy'
--      and member_since is null
--      and refunded_at is null
--      and status = 'active';
--
-- OPTION C — backfill nothing. Everyone's clock starts at their next payment,
-- which validate-purchase sets. Cleanest rule, harshest on day one: a member
-- of a year is told to wait a month.
--
-- Look before you leap:
--   select status, count(*), min(created_at), max(created_at)
--     from public.entitlements where product = 'academy' group by status;
-- ============================================================================
