-- ===========================================================================
-- GLOSSARY: a term opened in the last 24 hours is free to open again
-- (owner 2026-10-03: "opening a term costs 1 lookup ... once opened it is free";
--  "yes send the 24 hour server change to A").
--
-- Problem: get_glossary_definition charges EVERY call (glossary_consume). If a
-- learner's open timed out on a poor connection, the server may already have
-- charged it, and opening the same term again charged a second lookup. The app
-- currently avoids that by NOT re-asking for the term until the app is reopened
-- (the learner sees only the short preview meanwhile).
--
-- Fix: remember which terms each identity has been charged for. A repeat open of
-- the same term by the same identity within 24 hours returns the full text
-- WITHOUT consuming a lookup. Members are unchanged (never metered). A blocked
-- call (limit reached) records nothing.
--
-- Keyed by auth uid only: the per-device row still guards the "sign in to get a
-- fresh allowance" hole, because a new identity has no ledger rows and pays.
-- Compatible with the published app: same signature, same return shape.
-- ===========================================================================

create table if not exists public.glossary_term_reads (
  user_id     uuid        not null,
  glossary_id uuid        not null,
  read_at     timestamptz not null default now(),
  primary key (user_id, glossary_id)
);

alter table public.glossary_term_reads enable row level security;
-- No policies on purpose: only the SECURITY DEFINER function below touches it.
revoke all on table public.glossary_term_reads from anon, authenticated;

create index if not exists glossary_term_reads_read_at_idx
  on public.glossary_term_reads (read_at);

create or replace function public.get_glossary_definition(p_id uuid, p_device_id text default null)
returns table (
  definition text, plain_english text, purpose_function text, practical_application text,
  scenario_contexts text[], related_terms text[], category text, difficulty text,
  common_mistakes text[], used integer, lim integer, window_start timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
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

  if auth.uid() is null then
    raise exception 'sign_in_required' using errcode = 'PGRST';
  end if;

  if exists (
    select 1 from public.glossary_term_reads r
    where r.user_id = auth.uid() and r.glossary_id = p_id
      and r.read_at > now() - interval '24 hours'
  ) then
    -- Already charged for this term in the last 24 hours: report, don't spend.
    select s.used, s.lim, s.window_start into _u
      from public.glossary_usage_status(p_device_id) s;
  else
    select * into _u from public.glossary_consume(p_device_id);
    if not coalesce(_u.allowed, false) then
      raise exception 'weekly_limit_reached' using errcode = 'PGRST';
    end if;
    insert into public.glossary_term_reads (user_id, glossary_id)
      values (auth.uid(), p_id)
      on conflict (user_id, glossary_id) do update set read_at = now();
  end if;

  -- common_mistakes stays member-only, exactly as glossary_full_v masks it.
  return query
    select g.definition, g.plain_english, g.purpose_function,
           g.practical_application, g.scenario_contexts, g.related_terms,
           g.category, g.difficulty, null::text[],
           _u.used, _u.lim, _u.window_start
    from public.glossary g where g.id = p_id;
end;
$$;

revoke all on function public.get_glossary_definition(uuid, text) from public;
grant execute on function public.get_glossary_definition(uuid, text) to authenticated;
