-- 90_VERIFY — CHECK FILE. Read-only. Paste, Run.
-- EXPECTED: exactly one row:   result = PASS | printed = 5 | printed_lower = 5 | real_code = 5 | wrong = 0 | short = 0 | all_members_ok = true
-- (printed/real_code use the test account pro1@proaudiotrainingacademy.com, which holds 5 test certificates.)

with pro1 as (
  select upper(left(qr_token::text, 8)) as printed, verify_code
  from public.users where id = 'dcf6e17f-2676-4085-be41-ff4e1c0ced2c'
),
counts as (
  select
    (select count(*) from public.public_verify_credentials((select printed from pro1)))         as printed,
    (select count(*) from public.public_verify_credentials(lower((select printed from pro1))))  as printed_lower,
    (select count(*) from public.public_verify_credentials((select verify_code from pro1)))     as real_code,
    (select count(*) from public.public_verify_credentials('ZZZZZZZZ'))                          as wrong,
    (select count(*) from public.public_verify_credentials(left((select printed from pro1), 7))) as short,
    -- every member with a credential: printed code and verify_code return the same number of rows
    (select bool_and(
        (select count(*) from public.public_verify_credentials(upper(left(u.qr_token::text, 8))))
      = (select count(*) from public.public_verify_credentials(u.verify_code)))
     from public.users u
     where u.verify_code is not null and u.qr_token is not null
       and exists (select 1 from public.credential_awards a where a.user_id = u.id and a.revoked_at is null)) as all_members_ok
)
select case when printed = 5 and printed_lower = 5 and real_code = 5 and wrong = 0 and short = 0 and all_members_ok
            then 'PASS' else 'FAIL' end as result, *
from counts;
