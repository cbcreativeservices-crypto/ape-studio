-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 00_PRECHECK · READ ONLY.
-- Changes nothing. Run the whole file and read every row before anything else.
-- Any row that says FAIL = stop and re-review.
--
-- SPLIT: 17 CONVERT / 34 RETIRE / 0 BLOCKED.
-- Owner ruling 2026-09-03: the five that were previously held back
-- (gs 1, 9, 17, 19, 21) are to be REMOVED. They are RETIRE like the other 29.
--
-- Stable keys used throughout this package:
--   v1 curriculum  c689c0c4-1d93-4a92-9159-2af019745c49  (version_label 'v1', archived)
--   v3 curriculum  a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72  (version_label 'v3-locked-172', active)
-- Topics are addressed by (curriculum_version_id, global_sequence). Never by name.

-- ------------------------------------------------------------------ 1. the set
select 'set' as section, k, v from (values
  ('achievements_total',            (select count(*)::text from public.achievements)),
  ('v1_rows_total',                 (select count(*)::text from public.achievements where curriculum_version_id='c689c0c4-1d93-4a92-9159-2af019745c49')),
  ('v1_rows_with_course_id',        (select count(*)::text from public.achievements where course_id is not null)),
  ('non_v1_rows_with_course_id (expect 0)',
                                    (select count(*)::text from public.achievements
                                     where course_id is not null
                                       and curriculum_version_id <> 'c689c0c4-1d93-4a92-9159-2af019745c49')),
  ('v1_rows_WITHOUT_course_id (expect 1 - gs51 Foundations of Sound, OUT OF SCOPE)',
                                    (select count(*)::text from public.achievements
                                     where curriculum_version_id='c689c0c4-1d93-4a92-9159-2af019745c49'
                                       and course_id is null)),
  ('v3_rows_total',                 (select count(*)::text from public.achievements where curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72')),
  ('v2draft_rows_total',            (select count(*)::text from public.achievements where curriculum_version_id='51c1d5db-1d05-4d43-8853-5fa1503fb751'))
) t(k,v);

-- ------------------------------------------------ 2. the split, computed live
-- CONVERT = the 17 explicit gs pairs below AND the names still match.
-- RETIRE  = everything else among the 51. There is no third bucket any more.
with pairs(v1_gs, v3_gs) as (values
  (0,3060),(2,3070),(4,3030),(8,3340),(12,3180),(14,3560),(15,3570),(16,3600),(22,3770),
  (32,3300),(35,3190),(37,4040),(41,4360),(46,4380),(47,4370),(49,4390),(50,4400)),
j as (
  select v1.global_sequence v1_gs, v1.is_active v1_active, v3.global_sequence v3_gs
  from public.achievements v1
  left join pairs p on p.v1_gs = v1.global_sequence
  left join public.achievements v3
         on v3.curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
        and v3.global_sequence = p.v3_gs
  where v1.course_id is not null)
select 'split' as section,
       case when v3_gs is not null then 'CONVERT' else 'RETIRE' end as class,
       count(*) as topics,
       count(*) filter (where v1_active) as currently_active
from j group by 1,2 order by 2;
-- EXPECT: CONVERT 17 topics / 9 active   ·   RETIRE 34 topics / 5 active

-- --------------------------------------------------- 3. the 17 CONVERT pairs
-- name_ok MUST be true on all 17. A false here means the taxonomy moved under
-- this package and the pair list is stale: STOP.
with pairs(v1_gs, v3_gs) as (values
  (0,3060),(2,3070),(4,3030),(8,3340),(12,3180),(14,3560),(15,3570),(16,3600),(22,3770),
  (32,3300),(35,3190),(37,4040),(41,4360),(46,4380),(47,4370),(49,4390),(50,4400))
select 'convert_pairs' as section,
       v1.global_sequence v1_gs, v1.name v1_name, v1.is_active v1_active,
       v3.global_sequence v3_gs, v3.name v3_name, v3.is_active v3_active,
       (lower(btrim(v3.name)) = lower(btrim(v1.name))) as name_ok,
       (select count(*) from public.glossary_topics g where g.achievement_id = v1.id) as terms_to_fold
from pairs p
join public.achievements v1 on v1.curriculum_version_id='c689c0c4-1d93-4a92-9159-2af019745c49' and v1.global_sequence = p.v1_gs
left join public.achievements v3 on v3.curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and v3.global_sequence = p.v3_gs
order by v1.global_sequence;

-- ------------------------------ 4. the five the owner ruled REMOVED 2026-09-03
-- Sound & Acoustics, Dynamics Processing, Assisted Listening Systems,
-- Corporate AV, Distributed Audio Systems. Active, no v3 twin, removed anyway.
-- The point of this section is the zeros: nothing content-bearing is attached,
-- so nothing has to be folded anywhere before they go.
select 'ruled_removed' as section, a.global_sequence gs, a.name, a.is_active,
       (select count(*) from public.glossary_topics x where x.achievement_id=a.id) glossary_links,
       (select count(*) from public.quiz_questions  x where x.achievement_id=a.id) quiz_questions,
       (select count(*) from public.quiz_attempts   x where x.achievement_id=a.id) quiz_attempts,
       (select count(*) from public.badges          x where x.trigger_achievement_id=a.id) badges,
       (select count(*) from public.student_achievement_progress x where x.achievement_id=a.id) sap,
       (select count(*) from public.student_method_progress      x where x.achievement_id=a.id) smp
from public.achievements a
where a.curriculum_version_id='c689c0c4-1d93-4a92-9159-2af019745c49'
  and a.global_sequence in (1,9,17,19,21)
order by a.global_sequence;
-- EXPECT: glossary_links 0, quiz_questions 0, quiz_attempts 0 on ALL FIVE.
-- One badge (PA Certified) hangs off gs17; see section 7.

-- ------------------------------------------------- 5. THE FOLD RULE, PROVEN
-- Owner's general rule: "terms should fold into other existing."
-- A term folds when its topic link moves onto a live v3 topic. A term is lost
-- when its only topic is deleted. These four numbers prove nothing is lost.
select 'fold_rule' as section, k, v from (values
  ('glossary_topics links on the 34 RETIRE topics (MUST BE 0 - nothing removed carries a term)',
     (select count(*)::text from public.glossary_topics g
      join public.achievements a on a.id=g.achievement_id
      where a.course_id is not null and a.global_sequence not in (0,2,4,8,12,14,15,16,22,32,35,37,41,46,47,49,50))),
  ('quiz_questions on the 34 RETIRE topics (MUST BE 0)',
     (select count(*)::text from public.quiz_questions q
      join public.achievements a on a.id=q.achievement_id
      where a.course_id is not null and a.global_sequence not in (0,2,4,8,12,14,15,16,22,32,35,37,41,46,47,49,50))),
  ('glossary_topics links on the 17 CONVERT topics (all fold to a v3 twin in Stage 10)',
     (select count(*)::text from public.glossary_topics g
      join public.achievements a on a.id=g.achievement_id
      where a.course_id is not null and a.global_sequence in (0,2,4,8,12,14,15,16,22,32,35,37,41,46,47,49,50))),
  ('distinct CONVERT topics carrying at least one term',
     (select count(distinct g.achievement_id)::text from public.glossary_topics g
      join public.achievements a on a.id=g.achievement_id
      where a.course_id is not null and a.global_sequence in (0,2,4,8,12,14,15,16,22,32,35,37,41,46,47,49,50))),
  ('glossary.achievement_id rows on any of the 51 (MUST BE 0)',
     (select count(*)::text from public.glossary g
      join public.achievements a on a.id=g.achievement_id where a.course_id is not null))
) t(k,v);

-- ----------------------------------------------- 6. the full reference graph
-- Every table that can hold an achievement id, re-derived from pg_constraint
-- rather than a hand-written list.
select 'fk_children' as section, c.conrelid::regclass::text as child_table,
       a.attname as child_col, pg_get_constraintdef(c.oid) as def
from pg_constraint c
join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
where c.contype='f' and c.confrelid='public.achievements'::regclass
order by 2;

with cls as (
  select a.id,
         case when a.global_sequence in (0,2,4,8,12,14,15,16,22,32,35,37,41,46,47,49,50)
              then 'CONVERT' else 'RETIRE' end k
  from public.achievements a where a.course_id is not null)
select 'refs' as section, t.tbl,
       count(*) filter (where c.k='CONVERT') convert_rows,
       count(*) filter (where c.k='RETIRE')  retire_rows,
       count(*) total
from (
  select achievement_id aid, 'award_standing_requirements' tbl from public.award_standing_requirements
  union all select trigger_achievement_id, 'badges'                       from public.badges
  union all select achievement_id,         'certificate_topics'           from public.certificate_topics
  union all select achievement_id,         'glossary'                     from public.glossary
  union all select achievement_id,         'glossary_topics'              from public.glossary_topics
  union all select achievement_id,         'program_topics'               from public.program_topics
  union all select achievement_id,         'public_course_topics'         from public.public_course_topics
  union all select achievement_id,         'quiz_attempts'                from public.quiz_attempts
  union all select achievement_id,         'quiz_questions'               from public.quiz_questions
  union all select achievement_id,         'scenario_homework'            from public.scenario_homework
  union all select achievement_id,         'student_achievement_progress' from public.student_achievement_progress
  union all select achievement_id,         'student_method_progress'      from public.student_method_progress
  union all select achievement_id,         'user_topic_enrollments'       from public.user_topic_enrollments
) t
join cls c on c.id = t.aid
group by t.tbl order by t.tbl;
-- EXPECT today: glossary_topics 1978/0 · quiz_questions 50/0 · quiz_attempts 6/0
--               sap 21/43 · smp 37/54 · badges 0/4 · public_course_topics 20/34
--
-- NOTE: public_course_topics may already be gone. If the query errors on it,
-- REMOVE_V1_REMNANTS Stage 60 has run - the expected end state. Re-run without
-- that one UNION ALL line.

-- --------------------------------------------------- 7. collisions on convert
-- A repoint must not violate a unique key. Where the twin already has a row for
-- the same (user/term), the v3 row WINS and the v1 row is DELETED, not merged.
with pairs(v1_gs, v3_gs) as (values
  (0,3060),(2,3070),(4,3030),(8,3340),(12,3180),(14,3560),(15,3570),(16,3600),(22,3770),
  (32,3300),(35,3190),(37,4040),(41,4360),(46,4380),(47,4370),(49,4390),(50,4400)),
m as (select v1.id v1id, v3.id v3id
      from pairs p
      join public.achievements v1 on v1.curriculum_version_id='c689c0c4-1d93-4a92-9159-2af019745c49' and v1.global_sequence=p.v1_gs
      join public.achievements v3 on v3.curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and v3.global_sequence=p.v3_gs)
select 'collisions' as section, k, v from (values
  ('glossary_topics · rows to fold',
     (select count(*) from public.glossary_topics s join m on m.v1id=s.achievement_id)::text),
  ('glossary_topics · COLLIDE (term already on the twin) -> delete v1 row',
     (select count(*) from public.glossary_topics s join m on m.v1id=s.achievement_id
       join public.glossary_topics t on t.glossary_id=s.glossary_id and t.achievement_id=m.v3id)::text),
  ('glossary_topics · is_primary among them (expect 0 - no primary-home moves)',
     (select count(*) from public.glossary_topics s join m on m.v1id=s.achievement_id where s.is_primary)::text),
  ('glossary_topics · v1 has difficulty the v3 twin lacks (expect 0 - no curation lost)',
     (select count(*) from public.glossary_topics s join m on m.v1id=s.achievement_id
       join public.glossary_topics t on t.glossary_id=s.glossary_id and t.achievement_id=m.v3id
      where s.difficulty is not null and t.difficulty is null)::text),
  ('student_achievement_progress · rows to handle',
     (select count(*) from public.student_achievement_progress s join m on m.v1id=s.achievement_id)::text),
  ('student_achievement_progress · COLLIDE -> delete v1 row',
     (select count(*) from public.student_achievement_progress s join m on m.v1id=s.achievement_id
       join public.student_achievement_progress t on t.user_id=s.user_id and t.achievement_id=m.v3id)::text),
  ('student_method_progress · rows to handle',
     (select count(*) from public.student_method_progress s join m on m.v1id=s.achievement_id)::text),
  ('student_method_progress · COLLIDE -> delete v1 row',
     (select count(*) from public.student_method_progress s join m on m.v1id=s.achievement_id
       join public.student_method_progress t on t.user_id=s.user_id and t.achievement_id=m.v3id and t.method_key=s.method_key)::text),
  ('quiz_attempts on v1 topics (NOT repointed - purged in Stage 20)',
     (select count(*) from public.quiz_attempts s join m on m.v1id=s.achievement_id)::text),
  ('quiz_attempts still in_progress (expect 0)',
     (select count(*) from public.quiz_attempts s join m on m.v1id=s.achievement_id where s.attempt_status='in_progress')::text)
) t(k,v);

-- ------------------------------------ 8. the two content sets NOT being moved
-- Deliberate. See README "What convert does NOT move". Both are owner rulings
-- still outstanding, and both are why Stage 40 refuses to run.
select 'not_moved' as section, 'quiz_questions on v1 topics' as what,
       a.global_sequence gs, a.name, count(*) v1_questions,
       (select count(*) from public.quiz_questions q3 join public.achievements a3 on a3.id=q3.achievement_id
         where a3.curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
           and lower(btrim(a3.name))=lower(btrim(a.name))) as questions_already_on_v3_twin
from public.quiz_questions q join public.achievements a on a.id=q.achievement_id
where a.course_id is not null group by 3,4 order by 3;

select 'not_moved' as section, 'badges triggered by v1 topics' as what,
       b.name badge, b.curriculum_version_id::text badge_cv, a.global_sequence gs, a.name topic, a.is_active
from public.badges b join public.achievements a on a.id=b.trigger_achievement_id
where a.course_id is not null order by a.global_sequence;

-- ----------------------------------------------------- 9. sequencing blockers
select 'sequencing' as section, item, state from (values
  ('REMOVE_COLLEGE_COURSES_2026_09_03 (row delete in public_course_topics) - not required here',
     case when to_regclass('public.public_course_topics') is null then 'table already dropped - fine'
          else (select count(*)::text || ' public_course_topics rows still point at the 51'
                from public.public_course_topics x join public.achievements a on a.id=x.achievement_id
                where a.course_id is not null) end),
  ('REMOVE_V1_REMNANTS Stage 60 (DROP public_course_topics) - REQUIRED before Stage 40 only',
     case when to_regclass('public.public_course_topics') is null then 'DONE' else 'NOT RUN' end),
  ('REMOVE_V1_REMNANTS Stage 30 (quiz function rewrite) - recommended before Stage 20',
     case when exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                       where n.nspname='public' and p.proname='submit_quiz' and p.prosrc ~* 'public_course_topics')
          then 'NOT RUN' else 'DONE' end),
  ('RETIRE_INSTITUTIONAL_PATH (drops achievements.course_id) - MUST come AFTER 05_BACKUP here',
     case when exists (select 1 from information_schema.columns
                       where table_schema='public' and table_name='achievements' and column_name='course_id')
          then 'course_id still present - safe to run this package' else 'COLUMN GONE - the map can no longer be built' end),
  ('glossary_study_v still gates common_mistakes on global_sequence 0/36 (v1-only values)',
     case when exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
                       where n.nspname='public' and c.relname='glossary_study_v'
                         and pg_get_viewdef(c.oid) ~ 'ARRAY\[0, 36\]')
          then 'PRESENT - becomes fully dead after Stage 10. See NOTES.' else 'already changed' end)
) t(item, state);

-- -------------------------------------------- 10. trigger / constraint hazards
select 'hazards' as section, k, v from (values
  ('achievements BEFORE UPDATE trig_validate_applicable_methods rejects a bad method key on ANY update',
     (select count(*)::text || ' of the 51 carry a non-canonical method key (must be 0)'
      from public.achievements a
      where a.course_id is not null and a.applicable_methods is not null
        and exists (select 1 from unnest(a.applicable_methods) mm
                    where not exists (select 1 from public.study_methods s where s.key=mm)))),
  ('achievements BEFORE UPDATE trig_validate_quiz_question_count only fires on ACTIVATION',
     'Stage 30 only ever sets is_active=false, so it cannot fire - including on the five active rows the owner ruled removed. Safe.'),
  ('student_achievement_progress AFTER trigger student_progress_award fires on INSERT or UPDATE OF status',
     'Stage 10 updates achievement_id only, so it does NOT fire. Stage 10 therefore calls evaluate_user_credentials() explicitly for every affected user. Stage 20 only DELETEs, which never fires it.'),
  ('glossary_topics FK is ON DELETE CASCADE',
     (select count(*)::text || ' glossary_topics rows would be destroyed by a hard DELETE of the 51 - all of them on CONVERT topics, and all of them folded onto a v3 twin by Stage 10 before anything is deleted.'
      from public.glossary_topics x join public.achievements a on a.id=x.achievement_id where a.course_id is not null))
) t(k,v);
