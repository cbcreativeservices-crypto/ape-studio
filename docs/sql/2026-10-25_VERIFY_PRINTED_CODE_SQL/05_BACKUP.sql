-- 05_BACKUP — keep an exact copy of the current function so 99_ROLLBACK can restore it byte for byte.
-- Safe to run twice (keeps the FIRST copy only). Paste, Run. Expected: "Success. No rows returned".

create table if not exists public._ape_function_backup (
  fn_name  text primary key,
  saved_at timestamptz not null default now(),
  def      text not null
);
-- Private: no API access to this table.
alter table public._ape_function_backup enable row level security;
revoke all on public._ape_function_backup from anon, authenticated, public;

insert into public._ape_function_backup (fn_name, def)
select 'public_verify_credentials_2026_10_25', pg_get_functiondef('public.public_verify_credentials'::regproc)
where (select md5(prosrc) from pg_proc where oid = 'public.public_verify_credentials'::regproc) = 'a00f08e48cdb6cfd95dea30bc874dd33'
on conflict (fn_name) do nothing;
