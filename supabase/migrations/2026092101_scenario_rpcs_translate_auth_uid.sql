-- Scenario RPCs mixed the two user id spaces, so no scenario round could ever
-- complete — on any topic, for anybody. APPLIED TO PRODUCTION 2026-09-21.
--
-- ⛔ TWO ID SPACES. `auth.uid()` is the JWT subject; `public.users.id` is the
-- surrogate key every progress table's FK points at. They are different
-- values, bridged by `users.auth_id` — 0 of 10 accounts have them equal.
--
-- `complete_scenario_round` inserted auth.uid() into
-- student_method_progress.user_id, which has FOREIGN KEY -> users(id). The
-- insert violated the key; the whole function is one transaction, so the
-- scenario_homework update rolled back with it and the learner's answers went
-- nowhere.
--
-- `start_scenario_cycle` had the same mistake inside an UPDATE ... WHERE, so
-- it raised nothing at all and simply matched zero rows: restarting a cycle
-- silently failed to reset the scenarios percentage.
--
-- MEASURED BEFORE THIS MIGRATION (2026-09-21):
--   scenario_homework rows ......................... 2
--     keyed by auth.uid() .......................... 2
--     keyed by users.id ............................ 0
--   max(rounds_completed) across the whole table ... 0   <-- never once
--
-- The mismatch is invisible on scenario_homework (no FK to catch it) and fatal
-- on student_method_progress (an FK that does). That is why it looked
-- intermittent rather than total.
--
-- ⚠️ scenario_homework KEEPS `v_auth`. Its rows are keyed by the auth uid and
-- it has no FK, so it is self-consistent; only the student_method_progress
-- writes are translated. Repointing that FK at auth.users instead would make
-- the inconsistency permanent — every other progress table keys on users.id.
--
-- ⛔ WHY THIS FILE EXISTS AT ALL. The bug was diagnosed on 2026-09-20 and the
-- client mitigation shipped the same day (scenarioQueue.ts drops the poison
-- item so the queue is not frozen forever, and its comment names this exact
-- bug). The server half never shipped, because these functions had no source
-- anywhere in the repo — there was nothing to fix in the codebase and nothing
-- to review. Keeping them here is the actual fix for that.

create or replace function public.complete_scenario_round(
  p_achievement_id uuid,
  p_round integer
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_auth uuid := auth.uid();   -- scenario_homework is keyed by this
  v_user uuid;                 -- student_method_progress.user_id FK -> users(id)
  v_rc   int;
begin
  if v_auth is null then return 0; end if;

  select id into v_user from public.users where auth_id = v_auth;
  -- No users row yet (cold start before register_commercial_user). Do nothing
  -- rather than half-write: the client retries, and a partial write is exactly
  -- what the FK was protecting against.
  if v_user is null then return 0; end if;

  update public.scenario_homework
  set rounds_completed = greatest(rounds_completed, p_round),
      current_round    = least(3, greatest(current_round, p_round + 1)),
      updated_at       = now()
  where user_id = v_auth
    and achievement_id = p_achievement_id
  returning rounds_completed into v_rc;

  if v_rc is null then return 0; end if;

  insert into public.student_method_progress(
    user_id, achievement_id, method_key, completion_pct, is_applicable, last_updated)
  values (v_user, p_achievement_id, 'scenarios', round(v_rc * 100.0 / 3)::int, true, now())
  on conflict (user_id, achievement_id, method_key)
  do update set completion_pct = excluded.completion_pct,
                is_applicable  = true,
                last_updated   = now();

  return v_rc;
end;
$function$;

create or replace function public.start_scenario_cycle(p_achievement_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_auth uuid := auth.uid();
  v_user uuid;
begin
  if v_auth is null then return jsonb_build_object('error', 'no_auth'); end if;

  select id into v_user from public.users where auth_id = v_auth;

  update public.scenario_homework
  set assignment       = public._scenario_build_assignment(p_achievement_id),
      answers          = '{}'::jsonb,
      current_round    = 1,
      rounds_completed = 0,
      cycle            = cycle + 1,
      updated_at       = now()
  where user_id = v_auth
    and achievement_id = p_achievement_id;

  if v_user is not null then
    update public.student_method_progress
    set completion_pct = 0, last_updated = now()
    where user_id = v_user
      and achievement_id = p_achievement_id
      and method_key = 'scenarios';
  end if;

  return public.get_scenario_homework(p_achievement_id);
end;
$function$;
