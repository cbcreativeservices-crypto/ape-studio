-- ⛔ SUPERSEDED — DO NOT APPLY (Comp A, 2026-10-20).
-- The Pro Audio Safety term moves are LIVE from Comp A's own package (VERIFY: pas_terms 122,
-- pas_questions 675, log_rows 111; all_terms_at_destination, questions_followed,
-- safety_study_rows_clean, no_safety_regression, topic_totals all true).
-- This draft was wrong in two ways Comp A found:
--   1. it also moved the 2 legacy option-less questions on eebac0e9 (SAFE-R2-18, SAFE-R2-22),
--      which the graded-question trigger rejects — the whole transaction would have failed;
--   2. it left the moved terms' study progress on Pro Audio Safety, which would have blocked
--      completion. Comp A's package moved 557 questions and carried or removed those keys.
-- Kept for the record only. The guard below makes an accidental run stop before it changes anything.
do $$ begin raise exception 'SUPERSEDED: 2026102001 must not be applied (Comp A applied its own package 2026-10-20)'; end $$;

-- DRAFT — NOT APPLIED. Comp A applies it only after checking it (owner approved the moves 2026-10-20).
--
-- Pro Audio Safety (global_sequence 3060, free for everyone) keeps the safety every learner needs;
-- its 111 specialist terms move to the topic where they apply. Owner decisions, 2026-10-20:
--   1. the keep/move split: approved      2. every destination: approved
--   3. near-duplicates: NOT merged         4. free users losing the moved terms: accepted
-- Review page: https://claude.ai/artifact/JUfie28uWSPhte9L53ziZu
-- Brief: docs/COMP_A_PRO_AUDIO_SAFETY_TERM_MOVES_2026_10_20.md
--
-- What moves, per term: its one glossary_topics row, glossary.achievement_id, and its quiz_questions'
-- achievement_id (559 questions). Nothing is deleted; definitions and questions are unchanged.
-- Every moved term today has exactly ONE glossary_topics row (Pro Audio Safety) and none of the
-- destinations has a term of the same name (checked 2026-10-20, read-only).
-- 47 of Pro Audio Safety's questions carry the duplicate achievement row 'eebac0e9-c48a-49c5-8c71-6e43d9bee2ee' (same name);
-- the question update covers both ids.

begin;

create temp table pas_moves(term text not null, dest text not null) on commit drop;
insert into pas_moves(term, dest) values
  ('Confined Space', 'Commercial/Install AV & Assisted Listening'),
  ('Peak protection', 'Crossover & System Engineering'),
  ('Absence of Voltage Test', 'Electrical Power, Distribution & Safety'),
  ('Arc Flash Awareness', 'Electrical Power, Distribution & Safety'),
  ('Arc flash boundary', 'Electrical Power, Distribution & Safety'),
  ('Arc Flash PPE Category', 'Electrical Power, Distribution & Safety'),
  ('Arc Flash Risk Assessment', 'Electrical Power, Distribution & Safety'),
  ('Arc rating', 'Electrical Power, Distribution & Safety'),
  ('Body Impedance', 'Electrical Power, Distribution & Safety'),
  ('Electrical Arc', 'Electrical Power, Distribution & Safety'),
  ('Electrically Safe Work Condition', 'Electrical Power, Distribution & Safety'),
  ('Energized Electrical Work Permit', 'Electrical Power, Distribution & Safety'),
  ('Hazardous Energy', 'Electrical Power, Distribution & Safety'),
  ('Incident energy', 'Electrical Power, Distribution & Safety'),
  ('Insulated Tools', 'Electrical Power, Distribution & Safety'),
  ('Let-go Current', 'Electrical Power, Distribution & Safety'),
  ('Limited Approach Boundary', 'Electrical Power, Distribution & Safety'),
  ('Live-dead-live test', 'Electrical Power, Distribution & Safety'),
  ('Lockout/tagout area', 'Electrical Power, Distribution & Safety'),
  ('Lockout/Tagout Awareness', 'Electrical Power, Distribution & Safety'),
  ('NFPA 70E', 'Electrical Power, Distribution & Safety'),
  ('Restricted Approach Boundary', 'Electrical Power, Distribution & Safety'),
  ('Shock Hazard Analysis', 'Electrical Power, Distribution & Safety'),
  ('Touch Voltage', 'Electrical Power, Distribution & Safety'),
  ('Ventricular Fibrillation Threshold', 'Electrical Power, Distribution & Safety'),
  ('Voltage-Rated Gloves', 'Electrical Power, Distribution & Safety'),
  ('Ground lifting and electrical safety', 'Grounding & Electrical'),
  ('Grounding safety', 'Grounding & Electrical'),
  ('Bone-conduction limits of hearing protection', 'Hearing Anatomy, Health & Disorders'),
  ('Canal Cap', 'Hearing Anatomy, Health & Disorders'),
  ('Dual hearing protection', 'Hearing Anatomy, Health & Disorders'),
  ('Hearing Handicap', 'Hearing Anatomy, Health & Disorders'),
  ('Hidden hearing damage', 'Hearing Anatomy, Health & Disorders'),
  ('Hidden Hearing Loss', 'Hearing Anatomy, Health & Disorders'),
  ('Hyperacusis', 'Hearing Anatomy, Health & Disorders'),
  ('Individual susceptibility', 'Hearing Anatomy, Health & Disorders'),
  ('Level-dependent hearing protector', 'Hearing Anatomy, Health & Disorders'),
  ('Noise susceptibility', 'Hearing Anatomy, Health & Disorders'),
  ('Occlusion', 'Hearing Anatomy, Health & Disorders'),
  ('Occlusion effect', 'Hearing Anatomy, Health & Disorders'),
  ('Ototoxic exposure', 'Hearing Anatomy, Health & Disorders'),
  ('Overprotection (hearing protection)', 'Hearing Anatomy, Health & Disorders'),
  ('Recruitment', 'Hearing Anatomy, Health & Disorders'),
  ('In-ear-monitor exposure', 'Live Sound - Monitor Engineering'),
  ('Monitor limiter', 'Live Sound - Monitor Engineering'),
  ('Pack limiter', 'Live Sound - Monitor Engineering'),
  ('Occupational Hearing Conservationist', 'Medical, Hearing & Clinical Acoustics'),
  ('Job Hazard Analysis (JHA)', 'Project Management'),
  ('Risk Assessment and Method Statement (RAMS)', 'Project Management'),
  ('Risk Matrix', 'Project Management'),
  ('Non-Ionizing Radiation', 'RF Wireless Systems'),
  ('Arcing', 'Repair'),
  ('Fall Arrest System', 'Rigging Hardware, Loads & Motorized Flying'),
  ('Cold Stress', 'Road Crew'),
  ('Dynamic Risk Assessment', 'Road Crew'),
  ('Heat Index', 'Road Crew'),
  ('Lightning', 'Road Crew'),
  ('NIOSH Lifting Equation', 'Road Crew'),
  ('Wet Bulb Globe Temperature', 'Road Crew'),
  ('Noise Risk Assessment', 'Sound Law - Assessment, Mapping & Mitigation'),
  ('Noise survey', 'Sound Law - Assessment, Mapping & Mitigation'),
  ('Control of Vibration at Work Regulations', 'Sound Law - Framework, Metrics & Compliance'),
  ('Daily Vibration Exposure', 'Sound Law - Framework, Metrics & Compliance'),
  ('Dose calculation', 'Sound Law - Framework, Metrics & Compliance'),
  ('EPA Noise Labeling Rule', 'Sound Law - Framework, Metrics & Compliance'),
  ('hand-arm vibration', 'Sound Law - Framework, Metrics & Compliance'),
  ('Hand-Arm Vibration Syndrome', 'Sound Law - Framework, Metrics & Compliance'),
  ('Health Surveillance', 'Sound Law - Framework, Metrics & Compliance'),
  ('OSHA Dose from TWA', 'Sound Law - Framework, Metrics & Compliance'),
  ('OSHA recordable hearing loss', 'Sound Law - Framework, Metrics & Compliance'),
  ('OSHA TWA from Dose', 'Sound Law - Framework, Metrics & Compliance'),
  ('Pascal-squared Hour', 'Sound Law - Framework, Metrics & Compliance'),
  ('Sound Advice (HSG260)', 'Sound Law - Framework, Metrics & Compliance'),
  ('Weekly Noise Exposure', 'Sound Law - Framework, Metrics & Compliance'),
  ('whole-body vibration', 'Sound Law - Framework, Metrics & Compliance'),
  ('Edge protection', 'Stage Geography & Backstage'),
  ('Ghost light', 'Stage Geography & Backstage'),
  ('Safety curtain', 'Stage Geography & Backstage'),
  ('Assumed Protection Value', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Fit testing', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Impulse Peak Insertion Loss', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Material Hearing Impairment', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Microphone-in-real-ear (MIRE)', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Noise Reduction Statistic', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Octave-band Method', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Personal Attenuation Rating', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Real-ear attenuation at threshold', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Subject-fit Method', 'Standards - Psychoacoustics, Hearing & Audiology'),
  ('Competent Person', 'System Deployment & Rigging'),
  ('Mobile Elevating Work Platform', 'System Deployment & Rigging'),
  ('Scissor Lift', 'System Deployment & Rigging'),
  ('Wind Hazard', 'System Deployment & Rigging'),
  ('Laser and optical-audio-system hazards', 'Theatrical Sound'),
  ('Theatrical fog', 'Theatrical Sound'),
  ('Ultrasonic exposure considerations', 'Ultrasonics, NDT & Industrial Inspection'),
  ('Emergency Action Plan', 'Venue Architecture & Spaces'),
  ('Emergency lighting', 'Venue Architecture & Spaces'),
  ('Fire door', 'Venue Architecture & Spaces'),
  ('Fire lane', 'Venue Architecture & Spaces'),
  ('Fire Watch', 'Venue Architecture & Spaces'),
  ('First aid station', 'Venue Architecture & Spaces'),
  ('House lights', 'Venue Architecture & Spaces'),
  ('Bloodborne Pathogens', 'Workplace Skills'),
  ('Control of Substances Hazardous to Health', 'Workplace Skills'),
  ('Hazard Communication Standard', 'Workplace Skills'),
  ('Hot Work Permit', 'Workplace Skills'),
  ('Incident Investigation', 'Workplace Skills'),
  ('OSHA 300 Log', 'Workplace Skills'),
  ('Permit to Work', 'Workplace Skills'),
  ('PPE Hazard Assessment', 'Workplace Skills'),
  ('Recordable Injury', 'Workplace Skills');

-- destination = the achievement row of that name holding the most primary terms (some names have
-- duplicate rows, as Pro Audio Safety does)
create temp table pas_resolved on commit drop as
with d as (
  select distinct on (a.name) a.name, a.id
  from achievements a
  left join glossary_topics gt on gt.achievement_id = a.id and gt.is_primary
  group by a.name, a.id
  order by a.name, count(gt.*) desc
)
select m.term, g.id as glossary_id, m.dest, d.id as dest_id
from pas_moves m
join glossary g on g.term = m.term
join glossary_topics gt on gt.glossary_id = g.id and gt.achievement_id = '32129be7-4248-5c40-9d69-207b9c89878c'
join d on d.name = m.dest;

-- pre-flight: exactly 111 distinct terms, each resolved to a destination, none already linked there
do $$
declare n int; nd int; clash int;
begin
  select count(*), count(distinct glossary_id) into n, nd from pas_resolved;
  if n <> 111 or nd <> 111 or exists (select 1 from pas_resolved where dest_id is null) then
    raise exception 'pas moves: expected 111 resolved terms, got % (% distinct)', n, nd;
  end if;
  select count(*) into clash from pas_resolved r join glossary_topics gt on gt.glossary_id = r.glossary_id and gt.achievement_id = r.dest_id;
  if clash > 0 then raise exception 'pas moves: % terms already linked to their destination', clash; end if;
end $$;

insert into term_reassignment_log (glossary_id, term, from_topic_gs, from_topic, proposed_topic, reason, status, raised_by)
select r.glossary_id, r.term, 3060, 'Pro Audio Safety', r.dest,
       'Owner 2026-10-20: Pro Audio Safety kept general for every learner; specialist term moved to the topic where it applies',
       'applied', 'owner (via ccode cloud session 2026-10-20)'
from pas_resolved r;

update glossary_topics gt set achievement_id = r.dest_id
from pas_resolved r
where gt.glossary_id = r.glossary_id and gt.achievement_id = '32129be7-4248-5c40-9d69-207b9c89878c';

update glossary g set achievement_id = r.dest_id
from pas_resolved r
where g.id = r.glossary_id and g.achievement_id = '32129be7-4248-5c40-9d69-207b9c89878c';

update quiz_questions qq set achievement_id = r.dest_id
from pas_resolved r
where qq.glossary_id = r.glossary_id and qq.achievement_id in ('32129be7-4248-5c40-9d69-207b9c89878c', 'eebac0e9-c48a-49c5-8c71-6e43d9bee2ee');

-- VERIFY (inside the transaction; roll back if any number is off)
--   Pro Audio Safety terms                     expect 122
--   its quiz questions (both ids)              expect 675  (1234 − 559)
--   log rows written                           expect 111
select
  (select count(*) from glossary_topics where achievement_id = '32129be7-4248-5c40-9d69-207b9c89878c') as pas_terms_122,
  (select count(*) from quiz_questions q join glossary_topics gt on gt.glossary_id = q.glossary_id and gt.achievement_id = '32129be7-4248-5c40-9d69-207b9c89878c') as pas_questions_675,
  (select count(*) from term_reassignment_log where raised_by = 'owner (via ccode cloud session 2026-10-20)') as log_rows_111;

commit;
