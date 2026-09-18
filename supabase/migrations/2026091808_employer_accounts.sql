-- ============================================================================
-- APE STUDIO · 2026-09-18 · APPLIED TO PRODUCTION
--   migrations: employer_accounts_schema
--               employer_domain_helper (+ _fix_at_spoof)
--               employer_accounts_rpcs
--               contact_request_send_allows_verified_employer
--               contact_threads_shows_employer_identity
--
-- EMPLOYER ACCOUNTS — owner ruling 2026-09-18 (D9, revised): ships WITH launch.
--
-- THE GAP. There is no EMPLOYER in this product. A graduate can send their
-- verified record to a hiring manager and that manager has no way to reply —
-- the app deliberately never hands out contact details. The conversation ends
-- at "yes, this credential is real".
--
-- THE MODEL (owner-chosen): automated signals, HUMAN decision. Before approval
-- an employer may browse and view, but NOT contact.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1 · SCHEMA
--
-- An employer is its own TYPE, not a flag on a member. A member profile is a
-- PERSON advertising for work; an employer profile is an ORGANISATION looking
-- for people. They share almost no fields, are discovered differently, and only
-- one of them is verified by us. An `is_employer` boolean on community_profiles
-- would make every future query ask "which kind is this?" and would put an
-- unverified company name in the same table as a graduate's real name.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.employer_applications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  company_name    text not null,
  company_website text not null,
  work_email      text not null,
  role_title      text not null,
  hiring_for      text,
  -- The EVIDENCE, so a reviewer sees what was found rather than a pass/fail
  -- somebody else's code decided.
  checks          jsonb not null default '{}'::jsonb,
  status          text not null default 'pending'
                    check (status in ('pending','approved','rejected','withdrawn')),
  review_note     text,
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One LIVE application per account. Partial, so a rejected or withdrawn one
-- never blocks a genuine re-apply.
create unique index if not exists employer_applications_one_live
  on public.employer_applications (user_id) where status in ('pending','approved');
create index if not exists employer_applications_pending
  on public.employer_applications (created_at) where status = 'pending';

create table if not exists public.employer_profiles (
  user_id         uuid primary key references public.users(id) on delete cascade,
  company_name    text not null,
  company_website text not null,
  about           text,
  public_token    uuid not null default gen_random_uuid() unique,
  verified_at     timestamptz not null default now(),
  -- Revocable: a company that misbehaves loses the badge without losing the
  -- account and its history.
  revoked_at      timestamptz,
  contact_enabled boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Unlocked BY approval. Reuses the directory taxonomy members already pick
-- from, so an employer's interests and a member's areas are one vocabulary and
-- can actually be matched later.
create table if not exists public.employer_profile_interests (
  user_id uuid not null references public.employer_profiles(user_id) on delete cascade,
  kind    text not null check (kind in ('area','specialty','role','open_to')),
  slug    text not null,
  primary key (user_id, kind, slug)
);

alter table public.employer_applications      enable row level security;
alter table public.employer_profiles          enable row level security;
alter table public.employer_profile_interests enable row level security;

-- Applicants read their OWN row only. Every write is a definer RPC — no client
-- may set its own `status`.
create policy own_employer_application on public.employer_applications
  for select using (user_id = public.directory_me());
create policy admin_employer_applications on public.employer_applications
  for all using (public.is_admin()) with check (public.is_admin());

-- A verified, non-revoked employer is PUBLIC: a member deciding whether to
-- accept has to see who is asking.
create policy public_employer_profiles on public.employer_profiles
  for select using (revoked_at is null);
create policy admin_employer_profiles on public.employer_profiles
  for all using (public.is_admin()) with check (public.is_admin());
create policy public_employer_interests on public.employer_profile_interests
  for select using (exists (select 1 from public.employer_profiles p
                             where p.user_id = employer_profile_interests.user_id
                               and p.revoked_at is null));
create policy admin_employer_interests on public.employer_profile_interests
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.employer_applications      to authenticated;
grant select on public.employer_profiles          to authenticated, anon;
grant select on public.employer_profile_interests to authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────
-- 2 · employer_domain_of — and the spoof that nearly shipped
--
-- ⚠️ ORDER MATTERS. The first version checked for `@` BEFORE stripping the
-- path, so `https://evil.example/@acme.com` returned `acme.com` — the
-- attacker's site reported as the victim's domain. Not cosmetic: this feeds
-- `email_matches_site`, the strongest signal a reviewer sees, so a forged
-- application would have arrived wearing a green tick. Same spoof
-- navigation/linking.ts already guards, pointing the other way.
--
-- Verified against 10 cases including both spoof directions.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.employer_domain_of(p text)
returns text language plpgsql immutable as $fn$
declare t text;
begin
  t := lower(trim(coalesce(p, '')));
  if t = '' then return null; end if;
  if position('://' in t) > 0 then t := split_part(t, '://', 2); end if;
  -- path/query/fragment BEFORE any @ handling
  t := split_part(t, '/', 1);
  t := split_part(t, '?', 1);
  t := split_part(t, '#', 1);
  -- only now is a remaining @ userinfo or an email local part; take the LAST
  -- one so 'a@b@acme.com' cannot smuggle a host through an earlier one.
  if position('@' in t) > 0 then t := reverse(split_part(reverse(t), '@', 1)); end if;
  t := split_part(t, ':', 1);
  t := regexp_replace(t, '^www\.', '');
  t := regexp_replace(t, '\s', '', 'g');
  if t !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' then
    return null;
  end if;
  return t;
end;
$fn$;

-- Not disqualifying — plenty of real studios use Gmail — but the reviewer must
-- SEE it, because it removes the strongest cheap signal we have.
create or replace function public.employer_is_free_mail(p_domain text)
returns boolean language sql immutable as $fn$
  select coalesce(lower(p_domain) = any (array[
    'gmail.com','googlemail.com','outlook.com','hotmail.com','live.com','msn.com',
    'yahoo.com','yahoo.co.uk','ymail.com','icloud.com','me.com','mac.com',
    'aol.com','proton.me','protonmail.com','gmx.com','gmx.net','mail.com',
    'yandex.com','fastmail.com','hey.com','tutanota.com'
  ]), false);
$fn$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3 · RPCs — see the applied migration `employer_accounts_rpcs` for the full
--     bodies (employer_apply, employer_apply_remote_checks,
--     employer_application_mine, employer_review, is_verified_employer,
--     employer_profile_public, employer_set_interests).
--
-- ⚠️ THE CHECKS ARE COMPUTED IN employer_apply, NOT ACCEPTED FROM THE CLIENT.
-- If a client could post its own `checks`, a forged application would reach the
-- reviewer already wearing green ticks, and the human step — the only thing
-- making the badge worth anything — would be reviewing a lie. Network facts the
-- database cannot gather go under a separate `remote` key, added by the website
-- through a service-role-only function, so a reviewer can always tell the two
-- apart.
-- ─────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────
-- 4 · contact_request_send — verified employers may start a conversation
--
-- The sender had to be a published, adult-attested MEMBER. An employer has no
-- community profile and never will, so the one party a graduate most wants to
-- hear from was the one party the function refused.
--
-- ⚠️ UNVERIFIED EMPLOYERS STILL CANNOT CONTACT — enforced here, not in the UI.
-- Everything else is untouched: recipient published + contact-enabled, purpose
-- must be something THEY listed, blocks, content filter, link strip, rate limit.
-- Verified after splicing: all six safeguards still present.
-- ─────────────────────────────────────────────────────────────────────────
--   if not (
--     exists (select 1 from public.community_profiles
--              where user_id = me and published and adult_confirmed_at is not null)
--     or public.is_verified_employer(me)
--   ) then raise exception 'publish your own profile before contacting members' ...

-- ─────────────────────────────────────────────────────────────────────────
-- 5 · contact_threads — the graduate must SEE it is an employer
--
-- It joined community_profiles only, so an employer (who by design has none)
-- reached the graduate rendered as a generic "Member" with a null token. That
-- would have defeated the feature it belongs to: an anonymous stranger asking
-- about a job, now implicitly vouched for by the app, is WORSE than before.
--
-- Added additively: other_kind ('member'|'employer'), other_verified,
-- other_website. Every existing column keeps its name and meaning, and
-- supabase-js maps by name, so the current client is unaffected.
-- ─────────────────────────────────────────────────────────────────────────
