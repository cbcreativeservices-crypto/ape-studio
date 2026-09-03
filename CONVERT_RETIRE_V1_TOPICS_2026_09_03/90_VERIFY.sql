-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 90_VERIFY · READ ONLY.
-- Safe to run after any stage. Stages not yet run read NOT RUN.

select 'stage_state' as section, k, v from (values
  ('05_BACKUP',  case when to_regclass('public.cr_v1topics_map_20260903') is null then 'NOT RUN'
                      else 'DONE - ' || (select count(*)::text from public.cr_v1topics_map_20260903) || ' topics mapped' end),
  ('10_APPLY',   case when to_regclass('public.cr_v1topics_map_20260903') is null then 'NOT RUN'
                      when exists (select 1 from public.glossary_topics g
                                   join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id and m.class='CONVERT')
                        then 'NOT RUN' else 'DONE' end),
  ('20_APPLY',   case when to_regclass('public.cr_v1topics_map_20260903') is null then 'NOT RUN'
                      when exists (select 1 from public.quiz_attempts q
                                   join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id)
                        then 'NOT RUN' else 'DONE' end),
  ('30_APPLY',   case when to_regclass('public.cr_v1topics_ledger_20260903') is null then 'NOT RUN'
                      else (select count(*)::text from public.cr_v1topics_ledger_20260903) || ' ledger rows (expect 46)' end),
  ('40_APPLY (optional)',
                 case when to_regclass('public.cr_v1topics_map_20260903') is null then 'NOT RUN'
                      when exists (select 1 from public.achievements a
                                   join public.cr_v1topics_map_20260903 m on m.v1_id=a.id where m.class in ('CONVERT','RETIRE'))
                        then 'NOT RUN (rows still present - this is the expected default)'
                      else 'DONE - the 46 rows are gone' end)
) t(k,v);

-- --------------------------------------------------------------- must be 0
select 'must_be_zero' as section, k, v from (values
  ('glossary_topics on a CONVERT topic',
     (select count(*)::text from public.glossary_topics g
      join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id and m.class='CONVERT')),
  ('sap on a CONVERT topic',
     (select count(*)::text from public.student_achievement_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT')),
  ('smp on a CONVERT topic',
     (select count(*)::text from public.student_method_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='CONVERT')),
  ('sap on a RETIRE topic',
     (select count(*)::text from public.student_achievement_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='RETIRE')),
  ('smp on a RETIRE topic',
     (select count(*)::text from public.student_method_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='RETIRE')),
  ('quiz_attempts on any of the 51',
     (select count(*)::text from public.quiz_attempts q
      join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id)),
  ('still-active topics among the 46',
     (select count(*)::text from public.achievements a
      join public.cr_v1topics_map_20260903 m on m.v1_id=a.id
      where m.class in ('CONVERT','RETIRE') and a.is_active)),
  ('always_free still set among the 46',
     (select count(*)::text from public.achievements a
      join public.cr_v1topics_map_20260903 m on m.v1_id=a.id
      where m.class in ('CONVERT','RETIRE') and a.always_free))
) t(k,v);

-- ------------------------------------------------------- must be UNCHANGED
select 'must_be_unchanged' as section, k, v from (values
  ('BLOCKED topics still present and active (expect 5)',
     (select count(*)::text from public.achievements a
      join public.cr_v1topics_map_20260903 m on m.v1_id=a.id where m.class='BLOCKED' and a.is_active)),
  ('sap still on BLOCKED topics (expect 7)',
     (select count(*)::text from public.student_achievement_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='BLOCKED')),
  ('smp still on BLOCKED topics (expect 21)',
     (select count(*)::text from public.student_method_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id and m.class='BLOCKED')),
  ('quiz_questions on v1 topics - NOT moved by this package (expect 50)',
     (select count(*)::text from public.quiz_questions q
      join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id)),
  ('badges on v1 topics - NOT moved by this package (expect 4)',
     (select count(*)::text from public.badges b
      join public.cr_v1topics_map_20260903 m on m.v1_id=b.trigger_achievement_id)),
  ('v3 curriculum active topic count (expect 166, unchanged)',
     (select count(*)::text from public.achievements
      where curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and is_active)),
  ('glossary rows (expect unchanged - this package never touches glossary)',
     (select count(*)::text from public.glossary))
) t(k,v);

-- ------------------------------- where the repointed rows landed (spot check)
select 'landed' as section, m.v1_gs, m.v1_name, m.v3_gs,
       (select count(*) from public.glossary_topics g where g.achievement_id=m.v3_id) glossary_links_on_twin,
       (select count(*) from public.student_achievement_progress s where s.achievement_id=m.v3_id) sap_on_twin,
       (select count(*) from public.student_method_progress s where s.achievement_id=m.v3_id) smp_on_twin
from public.cr_v1topics_map_20260903 m where m.class='CONVERT' order by m.v1_gs;

-- -------------------------------------------------- orphan / integrity sweep
select 'integrity' as section, k, v from (values
  ('glossary_topics pointing at a missing achievement (expect 0)',
     (select count(*)::text from public.glossary_topics g
      where not exists (select 1 from public.achievements a where a.id=g.achievement_id))),
  ('sap pointing at a missing achievement (expect 0)',
     (select count(*)::text from public.student_achievement_progress s
      where not exists (select 1 from public.achievements a where a.id=s.achievement_id))),
  ('smp pointing at a missing achievement (expect 0)',
     (select count(*)::text from public.student_method_progress s
      where not exists (select 1 from public.achievements a where a.id=s.achievement_id))),
  ('duplicate (user, achievement) in sap (expect 0)',
     (select count(*)::text from (select user_id, achievement_id from public.student_achievement_progress
                                  group by 1,2 having count(*)>1) d)),
  ('duplicate (glossary, achievement) in glossary_topics (expect 0)',
     (select count(*)::text from (select glossary_id, achievement_id from public.glossary_topics
                                  group by 1,2 having count(*)>1) d))
) t(k,v);

select stage, k, v, at from public.cr_v1topics_report_20260903 order by at, stage, k;
