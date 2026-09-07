-- ============================================================================
-- Owner-run SQL — 2026-09-07  (run in the Supabase SQL editor, project
-- yjgolswjggmlpeowvtxr, as the owner/postgres). Frozen backend: Claude drafts,
-- the owner runs. Read each section header before running.
--
-- Three independent sections; you can run all three at once:
--   1) FIX  — let comp codes and the reviewer account actually grant access
--   2) NEW  — a code generator so you can mint month / year / lifetime codes
--   3) TIDY — close the last anon-callable helper before launch (security item 8)
-- ============================================================================


-- ── 1) FIX: widen entitlements.source so access-code grants are accepted ─────
-- The redeem_access_code() function writes source='access_code', but the table
-- CHECK constraint only allowed app_store/play_store/admin_grant/institutional,
-- so EVERY code redemption (and the reviewer comp) was rejected by the database
-- and the app reported "redemption isn't available yet". Add 'access_code'.
-- (Existing rows are all 'admin_grant', so this widening breaks nothing.)
alter table public.entitlements drop constraint if exists entitlements_source_check;
alter table public.entitlements add constraint entitlements_source_check
  check (source = any (array['app_store','play_store','admin_grant','institutional','access_code']));


-- ── 2) NEW: mint access codes (month / year / lifetime) ──────────────────────
-- One admin function. Call it from THIS SQL editor only — it is revoked from
-- the app roles, so no client can mint. It returns the code(s) it created.
--
--   p_plan          'month' (30 days) | 'year' (365 days) | 'lifetime' (never expires)
--   p_count         how many DISTINCT codes to mint (e.g. 50 influencer codes)   default 1
--   p_max_uses      redemptions allowed PER code — a bulk/employer deal is ONE
--                   code with p_max_uses = seats (until the full institutional
--                   layer lands)                                                  default 1
--   p_note          a label you'll recognise later ("AES booth", "Acme 25 seats")
--   p_code_expires_days  optional: the code itself stops working after N days
--                   (distinct from the ACCESS length above). NULL = code never
--                   expires as a code.                                            default NULL
--
-- The code alphabet omits look-alikes (no O/0/I/1); format PA-XXXX-XXXX.
create or replace function public.admin_mint_access_code(
  p_plan text,
  p_count int default 1,
  p_max_uses int default 1,
  p_note text default null,
  p_code_expires_days int default null
) returns table(code text, plan text, grant_days int, max_uses int, note text)
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_days    int;
  v_alpha   text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code    text;
  v_expires timestamptz;
  i int; n int;
begin
  if lower(p_plan) not in ('month','year','lifetime') then
    raise exception 'p_plan must be month, year or lifetime (got %)', p_plan;
  end if;
  v_days := case lower(p_plan) when 'month' then 30 when 'year' then 365 else null end;
  if p_count < 1 or p_count > 500 then raise exception 'p_count must be 1..500'; end if;
  if p_max_uses < 1 then raise exception 'p_max_uses must be >= 1'; end if;
  v_expires := case when p_code_expires_days is null then null
                    else now() + make_interval(days => p_code_expires_days) end;

  for i in 1..p_count loop
    loop  -- generate until unique
      v_code := 'PA-';
      for n in 1..4 loop v_code := v_code || substr(v_alpha, floor(random()*length(v_alpha))::int + 1, 1); end loop;
      v_code := v_code || '-';
      for n in 1..4 loop v_code := v_code || substr(v_alpha, floor(random()*length(v_alpha))::int + 1, 1); end loop;
      exit when not exists (select 1 from public.access_codes c where c.code = v_code);
    end loop;

    insert into public.access_codes
      (code, kind, grant_product, grant_days, max_uses, used_count, active, expires_at, note, created_at)
    values
      (v_code, 'grant', 'academy', v_days, p_max_uses, 0, true, v_expires, p_note, now());

    code := v_code; plan := lower(p_plan); grant_days := v_days; max_uses := p_max_uses; note := p_note;
    return next;
  end loop;
end;
$fn$;

-- Owner-only: no client role may mint.
revoke all on function public.admin_mint_access_code(text,int,int,text,int) from public;
revoke all on function public.admin_mint_access_code(text,int,int,text,int) from anon, authenticated;
grant execute on function public.admin_mint_access_code(text,int,int,text,int) to service_role;

-- Examples (run any of these AFTER the function is created):
--   select * from public.admin_mint_access_code('month');                         -- one 1-month trial code
--   select * from public.admin_mint_access_code('year',  10, 1, 'Fall promo');     -- ten single-use 1-year codes
--   select * from public.admin_mint_access_code('lifetime', 1, 1, 'Jane Doe comp');-- one lifetime code
--   select * from public.admin_mint_access_code('year', 1, 25, 'Acme Corp 25 seats'); -- one code, 25 employer seats
--
-- See your codes and how many times each was used:
--   select code, note,
--          case when grant_days is null then 'lifetime' when grant_days=365 then 'year'
--               when grant_days=30 then 'month' else grant_days||'d' end as plan,
--          used_count, max_uses, active, expires_at as code_expires, created_at
--     from public.access_codes order by created_at desc;
--
-- Turn a code off early:      update public.access_codes set active=false where code='PA-XXXX-XXXX';


-- ── 3) TIDY: close the last anon-callable helper (launch security item 8) ────
-- award_required_topics() is SECURITY DEFINER and currently executable by anon
-- via PUBLIC. It only returns curriculum structure (no user data, no writes),
-- and the app calls it only for signed-in users, so this is low-risk cleanup.
-- Grant authenticated FIRST, then remove PUBLIC/anon (the 2026-08-28 gotcha).
grant execute on function public.award_required_topics(text, uuid) to authenticated, service_role;
revoke execute on function public.award_required_topics(text, uuid) from public, anon;

-- Verify (expect: anon false, authenticated true):
select has_function_privilege('anon','public.award_required_topics(text, uuid)','EXECUTE')          as anon_should_be_false,
       has_function_privilege('authenticated','public.award_required_topics(text, uuid)','EXECUTE')  as authenticated_should_be_true;
