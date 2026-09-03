-- CONVERT / RETIRE THE 51 LEGACY v1 TOPICS · 90_VERIFY · READ ONLY.
-- Safe to run after any stage. Stages not yet run read NOT RUN.
-- Split: 17 CONVERT / 34 RETIRE / 0 held back.

select 'stage_state' as section, k, v from (values
  ('05_BACKUP',  case when to_regclass('public.cr_v1topics_map_20260903') is null then 'NOT RUN'
                      else 'DONE - ' || (select count(*)::text from public.cr_v1topics_map_20260903) || ' topics mapped ('
                        || (select count(*)::text from public.cr_v1topics_map_20260903 where class='CONVERT') || ' convert / '
                        || (select count(*)::text from public.cr_v1topics_map_20260903 where class='RETIRE')  || ' retire)' end),
  ('10_APPLY',   case when to_regclass('public.cr_v1topics_map_20260903') is null then 'NOT RUN'
                      when exists (select 1 from public.glossary_topics g
                                   join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id and m.class='CONVERT')
                        then 'NOT RUN' else 'DONE' end),
  ('20_APPLY',   case when to_regclass('public.cr_v1topics_map_20260903') is null then 'NOT RUN'
                      when exists (select 1 from public.quiz_attempts q
                                   join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id)
                        then 'NOT RUN' else 'DONE' end),
  ('30_APPLY',   case when to_regclass('public.cr_v1topics_ledger_20260903') is null then 'NOT RUN'
                      else (select count(*)::text from public.cr_v1topics_ledger_20260903) || ' ledger rows (expect 51)' end),
  ('40_APPLY (optional)',
                 case when to_regclass('public.cr_v1topics_map_20260903') is null then 'NOT RUN'
                      when exists (select 1 from public.achievements a
                                   join public.cr_v1topics_map_20260903 m on m.v1_id=a.id)
                        then 'NOT RUN (rows still present - this is the expected default)'
                      else 'DONE - all 51 rows are gone' end)
) t(k,v);

-- --------------------------------------------------------------- must be 0
select 'must_be_zero' as section, k, v from (values
  ('glossary_topics on ANY of the 51 (after Stage 10)',
     (select count(*)::text from public.glossary_topics g
      join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id)),
  ('sap on ANY of the 51 (after Stages 10 and 20)',
     (select count(*)::text from public.student_achievement_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id)),
  ('smp on ANY of the 51 (after Stages 10 and 20)',
     (select count(*)::text from public.student_method_progress s
      join public.cr_v1topics_map_20260903 m on m.v1_id=s.achievement_id)),
  ('quiz_attempts on ANY of the 51 (after Stage 20)',
     (select count(*)::text from public.quiz_attempts q
      join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id)),
  ('still-ACTIVE topics among the 51 (after Stage 30)',
     (select count(*)::text from public.achievements a
      join public.cr_v1topics_map_20260903 m on m.v1_id=a.id where a.is_active)),
  ('always_free still set among the 51 (after Stage 30)',
     (select count(*)::text from public.achievements a
      join public.cr_v1topics_map_20260903 m on m.v1_id=a.id where a.always_free)),
  ('is_prerequisite still set among the 51 (after Stage 30)',
     (select count(*)::text from public.achievements a
      join public.cr_v1topics_map_20260903 m on m.v1_id=a.id where a.is_prerequisite))
) t(k,v);

-- ---------------------------------------- the five the owner ruled removed
-- After Stage 30 all five must read is_active = false and carry a ledger row.
select 'ruled_removed' as section, m.v1_gs, m.v1_name,
       a.is_active as still_active_must_be_false,
       (l.v1_id is not null) as has_ledger_row,
       (select count(*) from public.student_achievement_progress x where x.achievement_id=m.v1_id) sap_left,
       (select count(*) from public.student_method_progress      x where x.achievement_id=m.v1_id) smp_left,
       (select count(*) from public.glossary_topics              x where x.achievement_id=m.v1_id) terms_left,
       (select count(*) from public.badges                       x where x.trigger_achievement_id=m.v1_id) badges_left
from public.cr_v1topics_map_20260903 m
left join public.achievements a on a.id = m.v1_id
left join public.cr_v1topics_ledger_20260903 l on l.v1_id = m.v1_id
where m.v1_gs in (1,9,17,19,21)
order by m.v1_gs;

-- ------------------------------------------------------- THE FOLD RULE, met
select 'fold_rule' as section, k, v from (values
  ('terms that were on a CONVERT topic and are now on its v3 twin (expect 354 repointed + 1624 already present = 1978 accounted for)',
     (select count(*)::text from public.cr_v1topics_glossary_topics_20260903)),
  ('terms left stranded on any v1 topic (MUST BE 0)',
     (select count(*)::text from public.glossary_topics g
      join public.cr_v1topics_map_20260903 m on m.v1_id=g.achievement_id)),
  ('glossary terms whose every topic link is now gone (MUST BE 0 - no orphaned term)',
     (select count(*)::text from public.glossary g
      where not exists (select 1 from public.glossary_topics gt where gt.glossary_id = g.id))),
  ('glossary row count (MUST be unchanged - this package never touches glossary)',
     (select count(*)::text from public.glossary))
) t(k,v);

-- ------------------------------------------------------- must be UNCHANGED
select 'must_be_unchanged' as section, k, v from (values
  ('quiz_questions on v1 topics - NOT moved by this package (expect 50)',
     (select count(*)::text from public.quiz_questions q
      join public.cr_v1topics_map_20260903 m on m.v1_id=q.achievement_id)),
  ('badges on v1 topics - NOT moved by this package (expect 4)',
     (select count(*)::text from public.badges b
      join public.cr_v1topics_map_20260903 m on m.v1_id=b.trigger_achievement_id)),
  ('v3 curriculum active topic count (expect 166, unchanged)',
     (select count(*)::text from public.achievements
      where curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72' and is_active)),
  ('v3 curriculum total rows (expect 175, unchanged)',
     (select count(*)::text from public.achievements
      where curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72')),
  ('v2-draft rows (expect 241, untouched by this package)',
     (select count(*)::text from public.achievements
      where curriculum_version_id='51c1d5db-1d05-4d43-8853-5fa1503fb751'))
) t(k,v);

-- ------------------------------- where the folded rows landed (spot check)
select 'landed' as section, m.v1_gs, m.v1_name, m.v3_gs,
       (select count(*) from public.glossary_topics g where g.achievement_id=m.v3_id) terms_on_twin,
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
