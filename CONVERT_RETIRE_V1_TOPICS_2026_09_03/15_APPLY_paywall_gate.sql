-- 15_APPLY_paywall_gate — point the Common Mistakes paywall at the v3 free topics.
--
-- Owner instruction 2026-09-03: "fix the paywall gate to the v3 free topics."
--
-- SELF-CONTAINED. This stage takes its own backup and has its own rollback
-- (`15_ROLLBACK_paywall_gate.sql`). It does not depend on 05_BACKUP, which
-- covers table rows only and does not capture view definitions. Run it on its
-- own if that is all you want today.
--
-- WHAT IT DOES
-- `glossary_study_v` decides who may see `common_mistakes`. Academy members
-- always may. Signed-in non-members may only for the free tasters, and the
-- view names those tasters by global_sequence. Today that list is ARRAY[0, 36],
-- the v1 pair. This changes it to ARRAY[3060, 3970], the v3 pair the app
-- actually presents as free.
--
-- THIS CHANGES WHAT FREE USERS SEE. It is not a like-for-like repair. Measured
-- on live data at authoring time:
--
--     gs    topic                                     terms with common_mistakes
--     0     Pro Audio Safety            (v1)                 119
--     36    DAW Skills                  (v1, inactive)         0
--     3060  Pro Audio Safety            (v3)                 162
--     3970  DAW Fundamentals & Session… (v3)                 228
--
-- A signed-in non-member goes from 119 terms to 390. The rise is real content,
-- not duplication: the v3 topics carry more glossary coverage, and gs36 carries
-- none at all, so half the present gate already grants nothing. If 390 is more
-- than you meant to give away, edit the ARRAY below before running this.
--
-- WHY IT IS ALSO A CORRECTNESS FIX
-- gs0 and gs36 are v1 rows. Stage 10 converts gs0 to its v3 twin 3060 and
-- stage 30 deactivates gs36. After those, the old gate matches nothing and
-- every signed-in non-member silently loses Common Mistakes everywhere.
--
-- ORDERING: safe at any time, including first. 3060 and 3970 are live v3
-- topics today. Run it BEFORE stage 10 to leave no window where the gate
-- is wrong.

BEGIN;

-- 1. Back the current definition up, once. Never overwrite an existing backup:
--    a second run must not capture the already-changed view as the "original".
CREATE TABLE IF NOT EXISTS public.paywall_gate_viewdef_backup_20260903 (
  view_name   text PRIMARY KEY,
  definition  text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.paywall_gate_viewdef_backup_20260903 (view_name, definition)
SELECT 'glossary_study_v', pg_get_viewdef('public.glossary_study_v'::regclass, true)
ON CONFLICT (view_name) DO NOTHING;

DO $$
DECLARE v_backup text;
BEGIN
  SELECT definition INTO v_backup
  FROM public.paywall_gate_viewdef_backup_20260903
  WHERE view_name = 'glossary_study_v';

  IF v_backup IS NULL THEN
    RAISE EXCEPTION 'refusing to run: the view definition was not backed up';
  END IF;

  -- Idempotency: if the backup already shows the new gate, an earlier run
  -- captured a changed view. Stop rather than enshrine the wrong "original".
  IF v_backup LIKE '%ARRAY[3060, 3970]%' THEN
    RAISE EXCEPTION
      'refusing to run: the stored backup already contains the new gate — '
      'the original definition was not captured, so rollback would be wrong';
  END IF;

  -- Both v3 tasters must exist, be active, and be v3. If the curriculum moved,
  -- stop rather than gate on topics that are not there.
  IF (SELECT count(*) FROM public.achievements
       WHERE global_sequence IN (3060, 3970)
         AND is_active
         AND curriculum_version_id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72') <> 2 THEN
    RAISE EXCEPTION 'refusing to run: gs 3060 and 3970 are not both active v3 topics';
  END IF;
END $$;

-- 2. Recreated verbatim apart from the one ARRAY on the CASE line.
CREATE OR REPLACE VIEW public.glossary_study_v AS
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

-- 3. Prove the swap landed and nothing else drifted.
DO $$
DECLARE v_new text; v_old text;
BEGIN
  v_new := pg_get_viewdef('public.glossary_study_v'::regclass, true);
  SELECT definition INTO v_old
  FROM public.paywall_gate_viewdef_backup_20260903 WHERE view_name = 'glossary_study_v';

  IF v_new NOT LIKE '%ARRAY[3060, 3970]%' THEN
    RAISE EXCEPTION 'refusing to commit: the new gate is not in the view definition';
  END IF;
  IF v_new LIKE '%ARRAY[0, 36]%' THEN
    RAISE EXCEPTION 'refusing to commit: the old v1 gate is still present';
  END IF;
  -- The ONLY difference must be the array. Normalise it out and compare.
  IF replace(v_new, 'ARRAY[3060, 3970]', 'ARRAY[0, 36]') IS DISTINCT FROM v_old THEN
    RAISE EXCEPTION
      'refusing to commit: the view differs from the original by more than the gate';
  END IF;
  RAISE NOTICE 'paywall gate now names the v3 free topics (3060, 3970); nothing else changed';
END $$;

COMMIT;

-- Read-back: what each side of the gate exposes now.
SELECT a.global_sequence AS gs,
       a.name,
       count(*) FILTER (WHERE g.common_mistakes IS NOT NULL) AS terms_with_common_mistakes
FROM public.achievements a
JOIN public.glossary_topics gt ON gt.achievement_id = a.id
JOIN public.glossary g ON g.id = gt.glossary_id
WHERE a.global_sequence IN (0, 36, 3060, 3970)
GROUP BY a.global_sequence, a.name
ORDER BY a.global_sequence;
