-- ============================================================================
-- APE STUDIO · STAGE 1 — the pieces the tenure migration does NOT cover.
-- 2026-09-18 · Supabase SQL editor, as owner. Project yjgolswjggmlpeowvtxr.
--
-- ⚠️ READ THIS BEFORE ANYTHING ELSE
--
-- This file is a COMPANION to `2026091801_paid_month_before_credential.sql`,
-- not a replacement for it. That migration is the source of truth for
-- member_since, refunded_at, member_month_complete() and the redeem_access_code
-- integration, and it is better researched than anything I would write from
-- scratch. It has simply never been applied.
--
-- RUN THAT ONE FIRST. Then this one.
--
-- An earlier draft of this file duplicated it and got one thing WRONG in the
-- process: it defined member_month_complete against `auth.uid()`, but
-- `entitlements.user_id` is `public.users.id`, resolved from `auth_id`
-- (validate-purchase/index.ts:213). The comparison would never have matched and
-- every member would have read as not-yet-qualified, silently and forever. The
-- existing migration joins correctly. That duplicate is gone.
--
-- What is left here is the three things that migration does not do.
--
-- Changes NO behaviour. Runs in one transaction. Idempotent.
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- 1 · THE REFUND STATUS  ⛔ a live bug, and a correction to the other file
--
-- `2026091801_paid_month_before_credential.sql:46` says:
--
--     "`status` is free text with no check constraint, so this widens rather
--      than breaks."
--
-- That is FALSE. Q1, run against production 2026-09-18, returned:
--
--     entitlements_status_check
--       CHECK (status = ANY (ARRAY['active','lapsed','revoked']))
--
-- So `store-notifications` writing status='refunded' is REJECTED by the
-- database — and the webhook returns 200 regardless, so Apple and Google never
-- retry. Every refund silently does nothing, and the tenure rule's refund half
-- can never fire because refunded_at is only set on the same write.
--
-- Exact precedent, in the owner's own SQL: the neighbouring `source` constraint
-- did this to access codes — "EVERY code redemption was rejected by the
-- database" (docs/APE_OWNER_SQL_2026_09_07.sql). That one was widened when it
-- was found. This one was never checked.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.entitlements
  drop constraint if exists entitlements_status_check;

alter table public.entitlements
  add constraint entitlements_status_check
  check (status in ('active', 'lapsed', 'revoked', 'refunded'));


-- ─────────────────────────────────────────────────────────────────────────
-- 2 · WHERE ELIGIBILITY WILL LIVE — `credential_eligibility`
--
-- Today `evaluate_user_credentials` INSERTs straight into `credential_awards`
-- the moment every topic is complete (confirmed from its live source, Q10,
-- 2026-09-18). Under the owner's policy that is too early: finishing the topics
-- earns congratulations, not a certificate. The certificate comes after the
-- Final Exam, and after one complete paid month.
--
-- So the topic check needs somewhere to record "this person has finished the
-- work" without that being an award. This is it.
--
-- Creating it changes nothing: nothing writes it until Stage 2 is installed AND
-- its flag is flipped. It exists now so that Stage 2 is a function swap rather
-- than a schema change on the day you cut over.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.credential_eligibility (
  user_id            uuid        not null,
  credential_type    text        not null check (credential_type in ('certificate','program')),
  credential_id      uuid        not null,
  became_eligible_at timestamptz not null default now(),
  primary key (user_id, credential_type, credential_id)
);

-- NOTE ON THE KEY: user_id here is `public.users.id`, matching
-- `credential_awards.user_id` and `student_achievement_progress.user_id` — NOT
-- the auth id. No FK, because credential_awards does not have one either and a
-- mismatched assumption is worse than a missing constraint.

comment on table public.credential_eligibility is
  'The learner has completed every topic this credential requires. NOT an award: the award needs a passed Final Exam and one complete paid month. Written by evaluate_user_credentials when app_flags.certificate_requires_exam is true.';

alter table public.credential_eligibility enable row level security;

-- Readable only by its owner, and only through the users table, matching how
-- member_month_complete resolves identity.
drop policy if exists own_credential_eligibility on public.credential_eligibility;
create policy own_credential_eligibility
  on public.credential_eligibility
  for select
  using (user_id in (select u.id from public.users u where u.auth_id = auth.uid()));

grant select on public.credential_eligibility to authenticated;
-- No insert/update/delete grant: writes come from security-definer functions.


-- ─────────────────────────────────────────────────────────────────────────
-- 3 · THE CUTOVER SWITCH — `app_flags`
--
-- Stage 2 changes who awards a certificate. That is the highest-stakes
-- behaviour in the product and it is landing in launch week, so it has to be
-- reversible in one statement, by you, at 2am, without a deploy.
--
-- `certificate_requires_exam`:
--   false (default, set here) — TODAY'S BEHAVIOUR. Topics complete → award.
--   true                      — the policy. Topics complete → eligibility only;
--                               the Final Exam and the paid month award it.
--
-- Stage 2 installs a function that honours BOTH branches and reads this flag to
-- choose. Installing it therefore changes nothing. Flipping this is the
-- cutover; flipping it back is the rollback.
--
-- ⚠️ Do not set it true until something else can award. If nothing can, nobody
--    gets a certificate at all.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.app_flags (
  key        text        primary key,
  enabled    boolean     not null default false,
  note       text,
  updated_at timestamptz not null default now()
);

comment on table public.app_flags is
  'Server-side switches that must be reversible without a deploy. Read by security-definer functions only; deliberately not client-readable.';

insert into public.app_flags (key, enabled, note)
values (
  'certificate_requires_exam',
  false,
  'false = topics complete awards the certificate (behaviour as of 2026-09-18). true = topics complete records eligibility only; the Final Exam and one complete paid month award it.'
)
on conflict (key) do nothing;

alter table public.app_flags enable row level security;
-- No policy at all: RLS on with zero policies means no client can read or write
-- it. Security-definer functions bypass RLS and are the only intended readers.

commit;


-- ============================================================================
-- VERIFY — after this commits
-- ============================================================================

select conname, pg_get_constraintdef(oid) as definition
  from pg_constraint
 where conrelid = 'public.entitlements'::regclass and contype = 'c';
-- EXPECT: entitlements_status_check now lists 'refunded'.

select column_name from information_schema.columns
 where table_schema='public' and table_name='entitlements'
   and column_name in ('member_since','refunded_at');
-- EXPECT: two rows. If zero, you have not run
-- 2026091801_paid_month_before_credential.sql yet — do that FIRST.

select proname, pg_get_function_identity_arguments(oid) as args
  from pg_proc where proname = 'member_month_complete';
-- EXPECT: member_month_complete(p_uid uuid) — takes the AUTH id, not users.id.
-- The client passes it explicitly (src/features/finalExam/tenure.ts).

select key, enabled from public.app_flags;
-- EXPECT: certificate_requires_exam, false.

select count(*) as awards_total from public.credential_awards;
-- EXPECT: unchanged. Nothing here awards or revokes anything.
-- ============================================================================
