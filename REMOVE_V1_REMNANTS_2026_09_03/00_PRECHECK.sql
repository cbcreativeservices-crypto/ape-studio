-- REMOVE V1 REMNANTS · 00_PRECHECK · READ ONLY. Changes nothing.
-- Run this whole file first and read every row. Any FAIL/BLOCKED = stop.

-- ---------------------------------------------------------------- 1. row counts
select 'counts' as section, k, v from (values
  ('glossary_rows',              (select count(*)::text from public.glossary)),
  ('glossary_course_id_notnull', (select count(*)::text from public.glossary where course_id is not null)),
  ('glossary_achievement_null',  (select count(*)::text from public.glossary where achievement_id is null)),
  ('achievements_total',         (select count(*)::text from public.achievements)),
  ('achievements_course_id_nn',  (select count(*)::text from public.achievements where course_id is not null)),
  ('public_courses',             (select count(*)::text from public.public_courses)),
  ('public_course_topics',       (select count(*)::text from public.public_course_topics))
) t(k,v);

-- ------------------------------------------------- 2. objects this package touches
select 'objects' as section, name, case when present then 'present' else 'ABSENT (already done?)' end as state
from (values
  ('fn bulk_import_glossary',              (to_regprocedure('public.bulk_import_glossary(jsonb)') is not null)),
  ('fn validate_glossary',                 (to_regprocedure('public.validate_glossary(jsonb)') is not null)),
  ('fn seed_commercial_free_topics',       (to_regprocedure('public.seed_commercial_free_topics(uuid)') is not null)),
  ('fn start_quiz_attempt',                (to_regprocedure('public.start_quiz_attempt(uuid,uuid)') is not null)),
  ('fn submit_quiz',                       (to_regprocedure('public.submit_quiz(uuid,jsonb,timestamptz,boolean,integer,integer)') is not null)),
  ('fn commercial_topic_unlocked',         (to_regprocedure('public.commercial_topic_unlocked(uuid,uuid,uuid)') is not null)),
  ('fn recompute_reachability_commercial', (to_regprocedure('public.recompute_reachability_commercial(uuid,uuid)') is not null)),
  ('fn validate_single_primary_home',      (to_regprocedure('public.validate_single_primary_home()') is not null)),
  ('fn register_commercial_user (DO NOT TOUCH)', (to_regprocedure('public.register_commercial_user(text,jsonb)') is not null)),
  ('tbl public_courses',                   (to_regclass('public.public_courses') is not null)),
  ('tbl public_course_topics',             (to_regclass('public.public_course_topics') is not null)),
  ('view glossary_full_v',                 (to_regclass('public.glossary_full_v') is not null)),
  ('col glossary.course_id',               exists (select 1 from information_schema.columns
                                                    where table_schema='public' and table_name='glossary' and column_name='course_id')),
  ('trg trg_single_primary_home',          exists (select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid
                                                    where c.relname='public_course_topics' and t.tgname='trg_single_primary_home')),
  ('pol pc_read',                          exists (select 1 from pg_policies where schemaname='public' and tablename='public_courses'       and policyname='pc_read')),
  ('pol pct_read',                         exists (select 1 from pg_policies where schemaname='public' and tablename='public_course_topics' and policyname='pct_read'))
) t(name, present);

-- --------------------------------- 3. the branches Stage 30 removes are truly dead
-- Every achievements row that carries a course_id must be v1. If this is not
-- zero, the "commercial" branch of start_quiz_attempt is reachable and Stage 30
-- is NOT a no-op. STOP and re-review.
select 'deadcode' as section,
       'non-v1 achievements carrying a course_id (expect 0)' as check,
       (select count(*) from public.achievements
        where course_id is not null
          and curriculum_version_id <> 'c689c0c4-1d93-4a92-9159-2af019745c49'::uuid)::text as value;

-- Every public_course_topics row must point at a v1 achievement, otherwise the
-- v3 path really does read that table and Stage 60 would change behaviour.
select 'deadcode' as section,
       'public_course_topics rows pointing at a NON-v1 achievement (expect 0)' as check,
       (select count(*) from public.public_course_topics pct
        join public.achievements a on a.id = pct.achievement_id
        where a.curriculum_version_id <> 'c689c0c4-1d93-4a92-9159-2af019745c49'::uuid)::text as value;

-- ------------------------------------------- 4. free-topic set Stage 20 will seed
-- Stage 20 rewrites seed_commercial_free_topics to seed the v3 always_free set.
-- Today that set is EMPTY, which is the point: the current function seeds two v1
-- rows (gs 0 and gs 36, the latter is_active=false) on every commercial signup.
select 'freetopics' as section, curriculum_version_id::text as cv,
       global_sequence, name, is_active, always_free
from public.achievements where always_free is true
order by curriculum_version_id, global_sequence;

-- ----------------------------------------------------- 5. app-side ship blockers
-- These are code facts, not SQL. Confirm by eye before running Stage 50.
select 'blockers' as section, item from (values
  ('Stage 50 requires: src/screens/glossary/GlossaryScreen.tsx no longer selects glossary.course_id (line ~113) and no longer filters/labels by it (lines ~1443, ~2313).'),
  ('Stage 60 requires: REMOVE_COLLEGE_COURSES_2026_09_03 has been run (or is abandoned) — this package DROPS both of those tables.'),
  ('NOT in this package: achievements.course_id, courses, enrollment, course_sections, session_logs. See RETIRE_INSTITUTIONAL_PATH_2026_09_03.')
) t(item);

-- --------------------------------------- 6. live dependency sweep (informational)
-- Anything listed here still reads an object this package removes.
select 'still_referencing' as section, p.proname as object,
       case when regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* 'public_course' then 'public_course*' else '' end ||
       case when regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mglossary\M' and regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourse_id\M' then ' glossary.course_id?' else '' end as what
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* 'public_course'
order by p.proname;
