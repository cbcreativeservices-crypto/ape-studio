-- 99_ROLLBACK — ONLY if 90_VERIFY says FAIL or something breaks. Restores the exact function saved by 05_BACKUP.
-- Paste, Run. Expected: NOTICE "Restored ..." then "Success. No rows returned".

do $$
declare v_def text;
begin
  select def into v_def from public._ape_function_backup where fn_name = 'public_verify_credentials_2026_10_25';
  if v_def is null then
    raise exception 'STOP: no backup found (05_BACKUP never ran). Do not guess; tell ccode.';
  end if;
  execute v_def;
  raise notice 'Restored public_verify_credentials to its 2026-10-25 version (md5 %).',
    (select md5(prosrc) from pg_proc where oid = 'public.public_verify_credentials'::regproc);
end $$;

drop index if exists public.users_qr_token_printed_code_idx;
