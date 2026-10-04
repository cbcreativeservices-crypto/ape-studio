-- ════════════════════════════════════════════════════════════════════════════
-- 2026100401 — Notifications between members + unread counts   ⛔ DRAFT
--
-- NOT APPLIED. Drafted 2026-10-04 for Comp A (owner decision 2026-10-04:
-- "user should be able to turn on and use notifications between each other").
-- Plain-English walkthrough + deploy order:
--   docs/APE_COMMUNITY_NOTIFICATIONS_SERVER_DRAFT_2026_10_04.md
-- Edge function draft (supabase/functions is not ours to edit):
--   docs/drafts/community-push/index.ts
--
-- The app already shipped by OTA works with or WITHOUT this migration:
--   · without it: the badges count pending contact requests only (from
--     contact_threads), and Settings does not offer the alert switch;
--   · with it: unread messages are counted too, and the switch appears.
--
-- Identity: every user id below is public.users.id (directory_me()), the same
-- space as contact_requests / contact_messages / contact_blocks.
--
-- Contents
--   1. Read state            contact_thread_reads + contact_thread_mark_read()
--   2. Counts                contact_inbox_counts()
--   3. Choices               community_notify_prefs + _get() / _set()
--   4. Phones                push_devices + push_device_register() / _release()
--   5. Outbox + rate limit   community_push_queue, community_push_log, triggers
--   6. Sender helper         community_push_due()  (service role only)
--   7. Cron                  every minute → edge function `community-push`
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. READ STATE ───────────────────────────────────────────────────────────
-- One row per (person, conversation): everything from the other side created
-- after last_read_at is unread. RPC-only, like every other directory table.
create table if not exists public.contact_thread_reads (
  user_id      uuid not null references public.users(id) on delete cascade,
  request_id   uuid not null references public.contact_requests(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
alter table public.contact_thread_reads enable row level security;
revoke all on public.contact_thread_reads from public, anon, authenticated;
-- (no policies on purpose: reached only through the SECURITY DEFINER RPCs)

-- Seed: everything that exists TODAY counts as read, so the first badge after
-- this migration is not every old message ever sent.
insert into public.contact_thread_reads (user_id, request_id, last_read_at)
select p.uid, r.id, now()
  from public.contact_requests r
  cross join lateral (values (r.from_user), (r.to_user)) as p(uid)
on conflict do nothing;

create index if not exists contact_messages_request_created_idx
  on public.contact_messages (request_id, created_at);
create index if not exists contact_requests_to_pending_idx
  on public.contact_requests (to_user) where status = 'pending';

create or replace function public.contact_thread_mark_read(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare me uuid := public.directory_me(); r public.contact_requests%rowtype;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  select * into r from public.contact_requests where id = p_request_id;
  if not found or me not in (r.from_user, r.to_user) then
    raise exception 'not your conversation' using errcode = '42501';
  end if;
  insert into public.contact_thread_reads (user_id, request_id, last_read_at)
  values (me, p_request_id, now())
  on conflict (user_id, request_id)
  do update set last_read_at = greatest(public.contact_thread_reads.last_read_at, excluded.last_read_at);
  return true;
end $$;

-- ── 2. COUNTS ───────────────────────────────────────────────────────────────
-- One row for an account, ZERO rows when there is no account behind the
-- session (the app shows no badge for that). Blocked pairs and restricted
-- senders are left out, so a badge never points at someone you cannot see.
create or replace function public.contact_inbox_counts()
returns table(pending_requests int, unread_messages int, unread_by_thread jsonb)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with me as (select public.directory_me() as id),
  pend as (
    select count(*)::int as n
      from public.contact_requests r, me
     where r.to_user = me.id
       and r.status = 'pending'
       and not public.account_restricted(r.from_user)
       and not exists (select 1 from public.contact_blocks b
                        where (b.blocker_user = r.from_user and b.blocked_user = r.to_user)
                           or (b.blocker_user = r.to_user and b.blocked_user = r.from_user))
  ),
  unread as (
    select m.request_id, count(*)::int as n
      from public.contact_messages m
      join public.contact_requests r on r.id = m.request_id
      cross join me
      left join public.contact_thread_reads tr
             on tr.user_id = me.id and tr.request_id = r.id
     where me.id in (r.from_user, r.to_user)
       and r.status = 'accepted'
       and m.sender_user <> me.id
       and m.created_at > coalesce(tr.last_read_at, '-infinity'::timestamptz)
       and not public.account_restricted(m.sender_user)
       and not exists (select 1 from public.contact_blocks b
                        where (b.blocker_user = r.from_user and b.blocked_user = r.to_user)
                           or (b.blocker_user = r.to_user and b.blocked_user = r.from_user))
     group by m.request_id
  )
  select (select n from pend),
         coalesce((select sum(n) from unread), 0)::int,
         coalesce((select jsonb_object_agg(request_id::text, n) from unread), '{}'::jsonb)
   where (select id from me) is not null;
$$;

-- ── 3. CHOICES ──────────────────────────────────────────────────────────────
-- Opt-in: push_enabled is FALSE until the person turns it on. A missing row
-- reads as the defaults (so no backfill is needed). show_preview FALSE = the
-- alert never carries message text.
create table if not exists public.community_notify_prefs (
  user_id         uuid primary key references public.users(id) on delete cascade,
  push_enabled    boolean not null default false,
  notify_messages boolean not null default true,
  notify_requests boolean not null default true,
  show_preview    boolean not null default false,
  updated_at      timestamptz not null default now()
);
alter table public.community_notify_prefs enable row level security;
revoke all on public.community_notify_prefs from public, anon, authenticated;

create or replace function public.community_notify_prefs_get()
returns table(push_enabled boolean, notify_messages boolean, notify_requests boolean, show_preview boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with me as (select public.directory_me() as id)
  select coalesce(p.push_enabled, false),
         coalesce(p.notify_messages, true),
         coalesce(p.notify_requests, true),
         coalesce(p.show_preview, false)
    from me
    left join public.community_notify_prefs p on p.user_id = me.id
   where me.id is not null;
$$;

-- NULL argument = leave that choice as it is. Returns what is now stored.
create or replace function public.community_notify_prefs_set(
  p_push_enabled boolean default null,
  p_messages     boolean default null,
  p_requests     boolean default null,
  p_show_preview boolean default null
)
returns table(push_enabled boolean, notify_messages boolean, notify_requests boolean, show_preview boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $
#variable_conflict use_column
declare me uuid := public.directory_me();
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  insert into public.community_notify_prefs as p (user_id, push_enabled, notify_messages, notify_requests, show_preview)
  values (me, coalesce(p_push_enabled, false), coalesce(p_messages, true),
          coalesce(p_requests, true), coalesce(p_show_preview, false))
  on conflict (user_id) do update set
    push_enabled    = coalesce(p_push_enabled, p.push_enabled),
    notify_messages = coalesce(p_messages,     p.notify_messages),
    notify_requests = coalesce(p_requests,     p.notify_requests),
    show_preview    = coalesce(p_show_preview, p.show_preview),
    updated_at      = now();
  return query
    select p.push_enabled, p.notify_messages, p.notify_requests, p.show_preview
      from public.community_notify_prefs p where p.user_id = me;
end $$;

-- ── 4. PHONES ───────────────────────────────────────────────────────────────
-- One row per INSTALL (the app's stable `ape:deviceId`). Registering MOVES the
-- row to whoever is signed in now; releasing deletes it. So an account switch
-- on a shared phone stops the departing account's alerts there (the app
-- releases on Log out, and releases/takes over on the next account's launch).
create table if not exists public.push_devices (
  device_id  text primary key check (length(device_id) between 8 and 100),
  user_id    uuid not null references public.users(id) on delete cascade,
  expo_token text not null unique
             check (expo_token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,}\]$'),
  platform   text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_devices_user_idx on public.push_devices (user_id);
alter table public.push_devices enable row level security;
revoke all on public.push_devices from public, anon, authenticated;

create or replace function public.push_device_register(p_device_id text, p_token text, p_platform text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare me uuid := public.directory_me();
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  -- The same push address under another install id (reinstall) is the same
  -- phone: drop the old row so one phone never gets an alert twice.
  delete from public.push_devices where expo_token = p_token and device_id <> p_device_id;
  insert into public.push_devices (device_id, user_id, expo_token, platform)
  values (p_device_id, me, p_token, p_platform)
  on conflict (device_id) do update set
    user_id = excluded.user_id, expo_token = excluded.expo_token,
    platform = excluded.platform, updated_at = now();
  -- At most 10 phones per account: the least recently seen go first.
  delete from public.push_devices d
   where d.user_id = me
     and d.device_id in (select device_id from public.push_devices
                          where user_id = me order by updated_at desc offset 10);
  return true;
end $$;

-- Any signed-in account may release THIS install id (it is a random per-install
-- value the phone itself holds); it is how a new account on a shared phone
-- stops the previous account's alerts.
create or replace function public.push_device_release(p_device_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.directory_me() is null then raise exception 'sign in first' using errcode = '42501'; end if;
  delete from public.push_devices where device_id = p_device_id;
  return true;
end $$;

-- ── 5. OUTBOX + RATE LIMIT ──────────────────────────────────────────────────
-- Inserts only ids (never message text) into an outbox the sender drains each
-- minute. Batching: everything one person sent one recipient in that minute
-- becomes ONE alert ("sent you 3 messages"). Rate limit (in the sender): at
-- most one alert per conversation per 2 minutes and 20 per recipient per hour.
create table if not exists public.community_push_queue (
  id          bigint generated always as identity primary key,
  recipient   uuid not null references public.users(id) on delete cascade,
  sender      uuid not null references public.users(id) on delete cascade,
  request_id  uuid not null references public.contact_requests(id) on delete cascade,
  kind        text not null check (kind in ('message', 'request')),
  message_id  uuid references public.contact_messages(id) on delete cascade,
  created_at  timestamptz not null default now(),
  claimed_at  timestamptz
);
create index if not exists community_push_queue_open_idx
  on public.community_push_queue (created_at) where claimed_at is null;
alter table public.community_push_queue enable row level security;
revoke all on public.community_push_queue from public, anon, authenticated;

create table if not exists public.community_push_log (
  id          bigint generated always as identity primary key,
  recipient   uuid not null references public.users(id) on delete cascade,
  request_id  uuid not null,
  kind        text not null,
  devices     int not null default 0,
  sent_at     timestamptz not null default now()
);
create index if not exists community_push_log_recipient_idx on public.community_push_log (recipient, sent_at desc);
alter table public.community_push_log enable row level security;
revoke all on public.community_push_log from public, anon, authenticated;

create or replace function public.community_push_enqueue_message()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare r public.contact_requests%rowtype; other uuid;
begin
  select * into r from public.contact_requests where id = new.request_id;
  if not found then return new; end if;
  other := case when new.sender_user = r.from_user then r.to_user else r.from_user end;
  insert into public.community_push_queue (recipient, sender, request_id, kind, message_id)
  values (other, new.sender_user, new.request_id, 'message', new.id);
  return new;
exception when others then
  -- An alert must never cost the message itself.
  return new;
end $$;

create or replace function public.community_push_enqueue_request()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.community_push_queue (recipient, sender, request_id, kind)
  values (new.to_user, new.from_user, new.id, 'request');
  return new;
exception when others then
  return new;
end $$;

drop trigger if exists community_push_on_message on public.contact_messages;
create trigger community_push_on_message
  after insert on public.contact_messages
  for each row execute function public.community_push_enqueue_message();

drop trigger if exists community_push_on_request on public.contact_requests;
create trigger community_push_on_request
  after insert on public.contact_requests
  for each row execute function public.community_push_enqueue_request();

-- ── 6. SENDER HELPER (service role only) ────────────────────────────────────
-- Claims the open outbox and returns ONE row per (recipient, conversation,
-- kind) that is still allowed to alert, with every check done HERE so the
-- edge function cannot forget one:
--   · the recipient switched alerts on, and this kind on;
--   · neither side has blocked the other;
--   · neither account is restricted (account_restricted: banned, removed,
--     suspended) — a restricted sender never triggers an alert;
--   · a message only for a conversation still 'accepted'; a request only
--     while still 'pending';
--   · rate limit: not alerted for this conversation in the last 2 minutes,
--     and fewer than 20 alerts to this recipient in the last hour.
-- Rows that fail a check are claimed and dropped (never retried).
create or replace function public.community_push_due()
returns table(
  recipient uuid, request_id uuid, kind text, sender_name text, n int,
  preview text, show_preview boolean, tokens text[]
)
language plpgsql
security definer
set search_path = public, pg_temp
as $
#variable_conflict use_column
begin
  return query
  with claimed as (
    update public.community_push_queue q set claimed_at = now()
     where q.claimed_at is null and q.created_at < now() - interval '5 seconds'
    returning q.*
  ),
  grouped as (
    select c.recipient, c.request_id, c.kind, c.sender, count(*)::int as n,
           (array_agg(c.message_id order by c.created_at desc))[1] as last_message
      from claimed c
     group by c.recipient, c.request_id, c.kind, c.sender
  )
  select g.recipient, g.request_id, g.kind,
         coalesce(ep.company_name, cp.display_name, 'A member'),
         g.n,
         case when coalesce(pr.show_preview, false) and g.kind = 'message'
              then left(regexp_replace(m.body, '\s+', ' ', 'g'), 120) end,
         coalesce(pr.show_preview, false),
         array(select d.expo_token from public.push_devices d where d.user_id = g.recipient)
    from grouped g
    join public.contact_requests r on r.id = g.request_id
    left join public.community_notify_prefs pr on pr.user_id = g.recipient
    left join public.community_profiles cp on cp.user_id = g.sender
    left join public.employer_profiles ep on ep.user_id = g.sender
    left join public.contact_messages m on m.id = g.last_message
   where coalesce(pr.push_enabled, false)
     and (case g.kind when 'message' then coalesce(pr.notify_messages, true)
                      else coalesce(pr.notify_requests, true) end)
     and (case g.kind when 'message' then r.status = 'accepted' else r.status = 'pending' end)
     and not public.account_restricted(g.sender)
     and not public.account_restricted(g.recipient)
     and not exists (select 1 from public.contact_blocks b
                      where (b.blocker_user = g.recipient and b.blocked_user = g.sender)
                         or (b.blocker_user = g.sender and b.blocked_user = g.recipient))
     and not exists (select 1 from public.community_push_log l
                      where l.recipient = g.recipient and l.request_id = g.request_id
                        and l.sent_at > now() - interval '2 minutes')
     and (select count(*) from public.community_push_log l
           where l.recipient = g.recipient and l.sent_at > now() - interval '1 hour') < 20
     and exists (select 1 from public.push_devices d where d.user_id = g.recipient);

  -- Housekeeping: claimed rows older than a day, and the log after 30 days.
  delete from public.community_push_queue where claimed_at < now() - interval '1 day';
  delete from public.community_push_log where sent_at < now() - interval '30 days';
end $$;

-- The sender records what it sent (rate limit) and forgets dead addresses.
create or replace function public.community_push_record(p_recipient uuid, p_request_id uuid, p_kind text, p_devices int)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.community_push_log (recipient, request_id, kind, devices)
  values (p_recipient, p_request_id, p_kind, p_devices);
$$;

create or replace function public.push_device_forget_token(p_token text)
returns void language sql security definer set search_path = public, pg_temp as $$
  delete from public.push_devices where expo_token = p_token;
$$;

-- ── GRANTS ──────────────────────────────────────────────────────────────────
-- (Postgres grants EXECUTE to PUBLIC by default — revoke first; anon gets
-- nothing; service_role does not inherit, so it is granted explicitly.)
revoke all on function public.contact_thread_mark_read(uuid)             from public, anon;
revoke all on function public.contact_inbox_counts()                     from public, anon;
revoke all on function public.community_notify_prefs_get()               from public, anon;
revoke all on function public.community_notify_prefs_set(boolean, boolean, boolean, boolean) from public, anon;
revoke all on function public.push_device_register(text, text, text)     from public, anon;
revoke all on function public.push_device_release(text)                  from public, anon;
grant execute on function public.contact_thread_mark_read(uuid)          to authenticated;
grant execute on function public.contact_inbox_counts()                  to authenticated;
grant execute on function public.community_notify_prefs_get()            to authenticated;
grant execute on function public.community_notify_prefs_set(boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.push_device_register(text, text, text)  to authenticated;
grant execute on function public.push_device_release(text)               to authenticated;

revoke all on function public.community_push_due()                       from public, anon, authenticated;
revoke all on function public.community_push_record(uuid, uuid, text, int) from public, anon, authenticated;
revoke all on function public.push_device_forget_token(text)             from public, anon, authenticated;
revoke all on function public.community_push_enqueue_message()           from public, anon, authenticated;
revoke all on function public.community_push_enqueue_request()           from public, anon, authenticated;
grant execute on function public.community_push_due()                    to service_role;
grant execute on function public.community_push_record(uuid, uuid, text, int) to service_role;
grant execute on function public.push_device_forget_token(text)          to service_role;

commit;

-- ── 7. CRON (run SEPARATELY, after the edge function is deployed) ───────────
-- Same pattern as on-weekly-concept: pg_cron + pg_net with the service-role
-- bearer from Vault. Comp A: store the key once as a Vault secret named
-- 'service_role_key' if it is not there already, then:
--
-- select cron.schedule(
--   'community-push-every-minute',
--   '* * * * *',
--   $cron$
--     select net.http_post(
--       url     := 'https://yjgolswjggmlpeowvtxr.supabase.co/functions/v1/community-push',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
--                                         where name = 'service_role_key')),
--       body    := '{}'::jsonb
--     );
--   $cron$
-- );
--
-- To stop all member alerts at once:  select cron.unschedule('community-push-every-minute');
