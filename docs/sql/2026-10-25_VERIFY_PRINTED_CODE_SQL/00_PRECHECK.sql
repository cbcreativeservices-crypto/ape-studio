-- 00_PRECHECK — "Verify by code" accepts the code printed on certificates (2026-10-25)
-- Read-only. Stops with an error if anything differs from what the fix was written against.
-- Paste, Run. Expected: "Success. No rows returned" (or a NOTICE that it already ran).

do $$
declare
  v_md5 text;
  v_dups int;
  v_overlap int;
begin
  select md5(prosrc) into v_md5 from pg_proc where oid = 'public.public_verify_credentials'::regproc;

  if v_md5 = 'a00f08e48cdb6cfd95dea30bc874dd33' then
    raise notice 'OK: public_verify_credentials is the version this fix was written against.';
  elsif exists (select 1 from pg_proc where oid = 'public.public_verify_credentials'::regproc
                and prosrc like '%printed certificate code%') then
    raise notice 'ALREADY APPLIED: 10_APPLY has run before. Skip to 90_VERIFY.';
  else
    raise exception 'STOP: public_verify_credentials changed since 2026-10-25 (md5 %). Do not apply; tell ccode.', v_md5;
  end if;

  -- The printed code is the first 8 characters of users.qr_token. It must point at ONE member.
  select count(*) into v_dups from (
    select upper(left(qr_token::text, 8)) from public.users
    where qr_token is not null group by 1 having count(*) > 1) d;
  if v_dups > 0 then
    raise notice 'NOTE: % printed codes are shared by more than one member; the fix returns nothing for those (by design).', v_dups;
  end if;

  -- A printed code must never be mistaken for another member's verify_code.
  select count(*) into v_overlap from public.users u
    join public.users v on upper(left(u.qr_token::text, 8)) = v.verify_code;
  if v_overlap > 0 then
    raise notice 'NOTE: % printed codes equal someone''s verify_code; verify_code wins (by design).', v_overlap;
  end if;
end $$;
