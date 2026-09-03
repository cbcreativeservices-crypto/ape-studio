-- REMOVE V1 REMNANTS · STAGE 40 · drop the objects that Stage 30 orphaned
--
-- Requires Stage 30. commercial_topic_unlocked was called by start_quiz_attempt
-- and recompute_reachability_commercial by submit_quiz; both callers were
-- rewritten in Stage 30, so these are now unreferenced.
--
-- Also drops:
--   * trigger trg_single_primary_home on public_course_topics and its function
--     validate_single_primary_home() - the trigger only fires on writes to a
--     table nothing writes to any more.
--   * RLS policies pc_read / pct_read (anon+authenticated SELECT on the two
--     public_course* tables). Dropping the policies leaves RLS enabled with no
--     permissive SELECT policy, i.e. the tables read as empty to the app -
--     a useful dry run for Stage 60 before the tables actually go.
--
-- Idempotent: every statement uses IF EXISTS.
-- Reversible: 99_ROLLBACK restores all three functions verbatim from
-- v1remnants_func_backup_20260903 and recreates the trigger and both policies.

BEGIN;

DO $guard$
DECLARE v_have int;
BEGIN
  SELECT count(*) INTO v_have FROM public.v1remnants_func_backup_20260903
   WHERE proname IN ('commercial_topic_unlocked',
                     'recompute_reachability_commercial',
                     'validate_single_primary_home');
  IF v_have <> 3 THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP captured % of the 3 function sources', v_have;
  END IF;

  -- Stage 30 must have landed, or these functions are still live callees.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public'
               AND p.proname IN ('start_quiz_attempt','submit_quiz')
               AND p.prosrc ~* 'commercial_topic_unlocked|recompute_reachability_commercial') THEN
    RAISE EXCEPTION 'refusing to run: start_quiz_attempt/submit_quiz still call these - run Stage 30 first';
  END IF;

  -- Nothing else in the schema may reference them either.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public'
               AND p.proname NOT IN ('commercial_topic_unlocked','recompute_reachability_commercial')
               AND p.prosrc ~* 'commercial_topic_unlocked|recompute_reachability_commercial') THEN
    RAISE EXCEPTION 'refusing to run: some other function still calls one of these';
  END IF;
END $guard$;

DROP TRIGGER  IF EXISTS trg_single_primary_home ON public.public_course_topics;
DROP FUNCTION IF EXISTS public.validate_single_primary_home();

DROP FUNCTION IF EXISTS public.commercial_topic_unlocked(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.recompute_reachability_commercial(uuid, uuid);

DROP POLICY IF EXISTS pc_read  ON public.public_courses;
DROP POLICY IF EXISTS pct_read ON public.public_course_topics;

COMMIT;

SELECT 'commercial_topic_unlocked gone' AS check,
       CASE WHEN to_regprocedure('public.commercial_topic_unlocked(uuid,uuid,uuid)') IS NULL THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'recompute_reachability_commercial gone',
       CASE WHEN to_regprocedure('public.recompute_reachability_commercial(uuid,uuid)') IS NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'validate_single_primary_home gone',
       CASE WHEN to_regprocedure('public.validate_single_primary_home()') IS NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'trg_single_primary_home gone',
       CASE WHEN NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                             WHERE c.relname='public_course_topics' AND t.tgname='trg_single_primary_home')
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'pc_read / pct_read gone',
       CASE WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname IN ('pc_read','pct_read'))
            THEN 'PASS' ELSE 'FAIL' END;
