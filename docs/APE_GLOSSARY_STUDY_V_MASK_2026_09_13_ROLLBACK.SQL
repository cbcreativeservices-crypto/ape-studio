-- =====================================================================
-- ROLLBACK for APE_GLOSSARY_STUDY_V_MASK_2026_09_13.SQL
-- =====================================================================
-- This is `glossary_study_v` EXACTLY as it stood before the mask was applied
-- on 2026-09-13, captured with pg_get_viewdef() immediately beforehand.
--
-- ⚠️ Running this puts every definition, plain_english, purpose_function,
-- practical_application and scenario_contexts for all 26,855 terms back within
-- reach of any signed-in caller — including a guest holding the glossary's
-- temporary device key. Only run it to un-break something, and read
-- docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md first.
-- =====================================================================

create or replace view public.glossary_study_v as
 SELECT g.id AS glossary_id,
    gt.achievement_id,
    a.global_sequence,
    gt.is_primary,
    gt.difficulty,
    g.term,
    g.definition,
    g.plain_english,
    g.related_terms,
    g.category,
    g.scenario_contexts,
    g.purpose_function,
    g.practical_application,
        CASE
            WHEN has_academy_access(auth.uid()) OR auth.uid() IS NOT NULL AND (a.global_sequence = ANY (ARRAY[3060, 3970])) THEN g.common_mistakes
            ELSE NULL::text[]
        END AS common_mistakes
   FROM glossary g
     JOIN glossary_topics gt ON gt.glossary_id = g.id
     JOIN achievements a ON a.id = gt.achievement_id;
