-- =====================================================================
-- SCHEMA_v213_ITEMD_close_common_mistakes_CANDIDATE.sql
-- HELD migration — deploy ONLY alongside the client release that switches
-- glossary common_mistakes reads to public.glossary_full_v.
-- STATUS: CANDIDATE — NOT deployed with the 2026-07-11 additive layer (intentionally held).
--
-- WHY HELD: revoking common_mistakes from `authenticated` also removes it from
-- INSTITUTIONAL students. Until the client reads common_mistakes from glossary_full_v,
-- deploying this will 403 the institutional app on that column. Ship together.
--
-- KNOWN TRADEOFF: glossary_full_v is a SECURITY DEFINER view (required to mask a column
-- the caller no longer has direct grant on). Supabase's linter flags this as
-- `security_definer_view` (ERROR-level, lint 0010). This is BY DESIGN — access is
-- controlled: the view returns common_mistakes only when has_academy_access(auth.uid())
-- is true, NULL otherwise; glossary rows are public catalog. Accept + document, OR
-- switch to a SECURITY DEFINER RPC `glossary_common_mistakes(id)` (WARN not ERROR, but
-- changes the client read contract). DECISION OWED at client-coordination time.
-- =====================================================================

-- 1. Remove common_mistakes from the authenticated base-table grant.
REVOKE SELECT ON public.glossary FROM authenticated;
GRANT SELECT (
  id, term, definition, plain_english, achievement_id, course_id,
  related_terms, category, difficulty, scenario_contexts,
  purpose_function, practical_application
) ON public.glossary TO authenticated;

-- 2. Academy-gated masking view (common_mistakes -> NULL for non-academy callers).
--    The definer view can read the base column and mask per-caller; auth.uid()
--    reflects the CALLER's JWT even inside a definer view.
CREATE OR REPLACE VIEW public.glossary_full_v AS
SELECT
  g.id, g.term, g.definition, g.plain_english, g.achievement_id, g.course_id,
  g.related_terms, g.category, g.difficulty, g.scenario_contexts,
  g.purpose_function, g.practical_application,
  CASE WHEN public.has_academy_access(auth.uid())
       THEN g.common_mistakes ELSE NULL END AS common_mistakes
FROM public.glossary g;
GRANT SELECT ON public.glossary_full_v TO anon, authenticated;

-- Post-deploy: verify as anon/free -> common_mistakes NULL; as academy/institutional -> present.
-- Rollback: DROP VIEW glossary_full_v; GRANT SELECT ON public.glossary TO authenticated;
-- =====================================================================
