-- ⛔ NOT APPLIED. FOR A TO REVIEW AND APPLY. Written by ccode 2026-09-20.
--    The owner asked for this to go to A rather than be run from the client
--    session. Rename off the _FOR_A_NOT_APPLIED suffix when it lands.
--
-- ============================================================================
-- The two designated free topics are not marked free, so the free tier
-- records nothing and can never reach its quiz.
-- ============================================================================
--
-- ── WHAT IS WRONG ───────────────────────────────────────────────────────────
--
-- `achievements.always_free` is FALSE on both free topics:
--
--     gs 3060  Pro Audio Safety                    active,  always_free = false
--     gs 3970  DAW Fundamentals & Session Mgmt     active,  always_free = false
--     gs   51  Foundations of Sound (retired v1)  INACTIVE, always_free = TRUE  ← the only true row
--
-- The pair [3060, 3970] is already hard-coded in three other places and they
-- all agree with each other — this column is the one place it was never set:
--
--   • the client's `FREE_ENROLL_GS` (src/features/enrollment/enrollmentStore.ts:43),
--     which AUTO-ENROLLS every user in exactly these two;
--   • the client's study gate (src/features/commercial/studyGate.ts);
--   • `glossary_study_v`'s definition mask —
--     `WHEN has_academy_access(auth.uid()) OR a.global_sequence = ANY (ARRAY[3060, 3970])`.
--
-- ── WHAT IT BREAKS, VERIFIED ────────────────────────────────────────────────
--
-- `always_free` is read by exactly three functions, and all three fail today:
--
--  1. `record_study_progress` — the v3 branch raises `academy_required` unless
--     `always_free` or `has_academy_access()`. So EVERY free account's study
--     write on its own free topics is refused. The client's offline queue
--     keeps them (correctly — see below), so nothing is lost, but nothing is
--     saved either.
--
--  2. `start_quiz_attempt` — `if not v_free and not has_academy_access()
--     then raise 'academy_required'`. A free user cannot sit the quiz on a
--     free topic.
--
--  3. `seed_commercial_free_topics` — selects `always_free IS TRUE AND
--     is_active IS TRUE`, which matches NOTHING. Its own comment already says
--     so: "v3 free topics only. Empty set today -> no rows written." So every
--     new commercial user is seeded no unlocked topic and no method rows.
--
-- ── WHY THE CLIENT NEEDS NO CHANGE ──────────────────────────────────────────
--
-- Refused batches stay in the offline queue by design — `isPermanentRejection`
-- deliberately keeps anything it does not recognise, on the rule that "keeping
-- a bad row costs one retry a minute; deleting a good one costs work the
-- person actually did and cannot get back". `academy_required` is not in that
-- list, so **the moment this migration lands, existing free users' queued
-- study work will land on the next retry** rather than being lost.
--
-- (ccode considered adding `academy_required` to the permanent-drop list and
-- did NOT: that would delete exactly the work this fixes.)
--
-- ── RISK ────────────────────────────────────────────────────────────────────
--
-- Reversible with one statement. It GRANTS access to two topics that every
-- other layer already treats as free, so it cannot open anything the client,
-- the study gate or the glossary mask were not already opening.

begin;

update public.achievements
   set always_free = true
 where global_sequence in (3060, 3970);

-- The retired v1 topic is inactive, so this changes no behaviour today
-- (`seed_commercial_free_topics` filters on is_active, and so do the quiz and
-- study paths). It is cleared so that nothing false is left claiming to be
-- free, and so reactivating that topic later cannot hand it out by accident.
update public.achievements
   set always_free = false
 where global_sequence = 51;

commit;

-- ── VERIFY AFTER APPLYING ───────────────────────────────────────────────────
--
-- 1 · exactly two rows, both active, both the right ones:
--
--   select global_sequence, name, is_active, always_free
--     from achievements where always_free is true order by global_sequence;
--   -- expect: 3060 Pro Audio Safety (t), 3970 DAW Fundamentals (t)
--
-- 2 · the seeding function now has something to seed:
--
--   select count(*) from achievements
--    where curriculum_version_id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
--      and always_free is true and is_active is true;
--   -- expect: 2   (was 0)
--
-- 3 · end to end, with a real free account: open Pro Audio Safety, answer a
--     few flashcards, return to the Dashboard and confirm the meter moves.
--     Before this migration that write is refused and the meter never moves.
