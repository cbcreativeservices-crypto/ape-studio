-- APPLIED to production 2026-10-11 (via MCP, migration weekly_concept_default_off).
--
-- notify_weekly_concept defaulted to TRUE, so every new account showed Weekly
-- concept ON with zero category subscriptions -- a state that can never send
-- (get_due_concept_subscriptions reads only the subscriptions table). New
-- accounts now start OFF; turning it on in Settings writes the rows first
-- (SettingsScreen setWeeklyOn, 2026-09-18).
alter table public.notification_preferences alter column notify_weekly_concept set default false;

-- Existing accounts in that state: switch OFF to match what they actually
-- receive (nothing). No account with an active subscription is touched.
update public.notification_preferences p
   set notify_weekly_concept = false
  from public.users u
 where u.id = p.user_id
   and p.notify_weekly_concept
   and not exists (select 1 from public.notification_concept_subscriptions s
                    where s.user_id = u.auth_id and s.active);

-- REVERSAL: the 29 notification_preferences.user_id values switched off on
-- 2026-10-11 (public.users.id). To restore:
--   update public.notification_preferences set notify_weekly_concept = true
--    where user_id in ( ...list below... );
-- 0612b3ed-3898-4246-add9-d9343f6dffdd, 0ed917b1-f5cc-4918-b0f2-acd48ea86b9d,
-- 18d2eaa3-5857-4031-8eab-940c6a9668ca, 1feb9c05-c188-460a-81ef-e14c73582739,
-- 22b934c4-9314-400c-8969-15acf4c9fb55, 2ea1c3e1-d5f2-49ea-a406-d05b7b0e5697,
-- 2fc0a77a-afdc-4d79-8c2b-6eec126a50d7, 3085497d-2675-4dbe-b127-04c9b4a1227e,
-- 3c28aa70-5761-44ab-9fca-ec2da598ba1a, 502aa599-b00f-4efb-943c-beab955861e4,
-- 51004308-f205-4606-9bb7-8fc1b4238a26, 55a7df53-bcc0-4434-830f-12250ddd8bf9,
-- 574c9ede-4950-4b44-99a8-bf432dba5d1e, 619e1295-6457-4f35-82cc-541b35c9a8b2,
-- 6682c43a-9ce7-42f3-9326-5f87bb8749cd, 66d4276c-273f-4ec1-929c-fe9be4c15761,
-- 6867e591-c380-42b4-88fc-b6ffa5fad433, 74a52363-080c-4ed7-99c6-83b23a3810bc,
-- 786b56d0-a709-4f2e-97ce-e1a22d42889e, 7e57e57e-0000-4000-8000-000000000001,
-- b18cc4c7-f4b6-469f-aabe-0f7c00b05e6f, b26399a5-b208-440b-9584-802160176234,
-- b9ce8ec3-87fc-4113-85db-9a9a15c722e8, bee52745-c1f1-4883-b147-3250a9ec23f3,
-- c15f78f4-0a1c-476c-9884-a21585b969a2, c25625ef-7144-4297-b026-21aba76f1985,
-- c7593a8b-d7fd-4f2b-8ea2-ae24af83cf4d, c916432b-2323-4383-8dd6-da8af9977f18,
-- ceee98b7-de7e-491f-bc0e-8c6182c2d477
