-- =====================================================================
-- SCHEMA_v213_ROLLBACK_CANDIDATE.sql
-- Single-step reverse of the Path B mapping layer. Restores v2.12 baseline.
-- STATUS: CANDIDATE. Institutional system is provably unaffected either direction.
-- Run order: policies/grants -> view -> RPCs/helper -> tables/trigger -> column.
-- =====================================================================

-- 1. Restore glossary grants (undo item-D gating).
DROP VIEW IF EXISTS public.glossary_full_v;

REVOKE SELECT (
  id, term, definition, plain_english, achievement_id, course_id,
  related_terms, category, difficulty, scenario_contexts,
  purpose_function, practical_application
) ON public.glossary FROM authenticated;
GRANT SELECT ON public.glossary TO authenticated;   -- back to table-level (all cols)

-- 2. Revoke anon catalog grants + drop anon policies.
REVOKE SELECT ON public.glossary             FROM anon;
REVOKE SELECT ON public.glossary_topics      FROM anon;
REVOKE SELECT ON public.achievements         FROM anon;
DROP POLICY IF EXISTS anon_read_glossary          ON public.glossary;
DROP POLICY IF EXISTS anon_read_glossary_topics   ON public.glossary_topics;
DROP POLICY IF EXISTS anon_read_achievements      ON public.achievements;

-- 3. Drop RPCs + helper.
DROP FUNCTION IF EXISTS public.register_commercial_user(text, jsonb);
DROP FUNCTION IF EXISTS public.has_academy_access(uuid);

-- 4. Drop new tables (cascade removes trigger, policies, grants, FKs).
DROP TABLE IF EXISTS public.public_course_topics;   -- cascades trg_single_primary_home
DROP TABLE IF EXISTS public.public_courses;
DROP TABLE IF EXISTS public.entitlements;
DROP FUNCTION IF EXISTS public.validate_single_primary_home();

-- 5. users.audience — default-safe. Drop it, OR leave inert (recommended: leave inert
--    to avoid churn if any commercial rows already exist). Uncomment to fully remove:
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_audience_chk;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS audience;

-- =====================================================================
-- END ROLLBACK.
-- =====================================================================
