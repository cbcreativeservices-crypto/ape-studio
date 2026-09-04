-- REMOVE V1 REMNANTS · STAGE 20 · fix seed_commercial_free_topics
--
-- What was wrong
--   The function seeded student_achievement_progress + student_method_progress
--   rows for `global_sequence IN (0, 36)` with no curriculum scope. Both of
--   those rows are v1 (curriculum c689c0c4-...), and gs36 ("DAW Skills") is
--   is_active = false. So every commercial signup was handed two progress rows
--   pointing at retired content, one of them for an inactive topic.
--
-- The decision, and why
--   Rewritten to seed the v3 always_free set instead of a hard-coded gs list:
--       achievements WHERE curriculum_version_id = <v3> AND always_free AND is_active
--   Today that set is EMPTY, so in practice this is a no-op — which is the
--   correct outcome. I did NOT invent a replacement gs list, because:
--     * v3 free access is not modelled on achievements.always_free at all; it
--       runs through user_topic_enrollments + has_academy_access. There are
--       zero v3 rows with always_free = true.
--     * The two live v3 entry points (start_quiz_attempt and
--       record_study_progress) already INSERT the student_achievement_progress
--       row on demand, so nothing needs pre-seeding for the app to work.
--     * A hard-coded list would be a guess, and a wrong guess writes rows into
--       every new user's progress table.
--   Making it data-driven rather than a bare no-op means it starts working by
--   itself the moment you mark a v3 topic always_free - no SQL change needed.
--
-- Signature is unchanged (uuid -> void), so register_commercial_user's
-- `PERFORM public.seed_commercial_free_topics(v_user_id);` keeps working
-- untouched. register_commercial_user itself is NOT modified by this package.
--
-- Idempotent: CREATE OR REPLACE.

BEGIN;

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.v1remnants_func_backup_20260903
                 WHERE proname = 'seed_commercial_free_topics') THEN
    RAISE EXCEPTION 'refusing to run: seed_commercial_free_topics source is not in the backup (run 05_BACKUP)';
  END IF;
  IF to_regprocedure('public.register_commercial_user(text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: register_commercial_user is missing - something else is wrong';
  END IF;
END $guard$;

CREATE OR REPLACE FUNCTION public.seed_commercial_free_topics(p_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r record; m text;
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;

  -- v3 free topics only. Empty set today -> no rows written. See file header.
  FOR r IN
    SELECT a.id, a.applicable_methods
    FROM public.achievements a
    WHERE a.curriculum_version_id = c_v3
      AND a.always_free IS TRUE
      AND a.is_active   IS TRUE
  LOOP
    INSERT INTO public.student_achievement_progress
      (user_id, achievement_id, status, best_genuine_score, quiz_score, quiz_attempts)
    VALUES (p_user, r.id, 'unlocked', 0, 0, 0)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    IF r.applicable_methods IS NOT NULL THEN
      FOREACH m IN ARRAY r.applicable_methods LOOP
        INSERT INTO public.student_method_progress
          (user_id, achievement_id, method_key, is_applicable,
           completion_pct, engagement_seconds, answered_count, correct_count)
        VALUES (p_user, r.id, m, true, 0, 0, 0, 0)
        ON CONFLICT (user_id, achievement_id, method_key) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END; $function$;

COMMIT;

SELECT 'seed_commercial_free_topics no longer hard-codes gs 0/36' AS check,
       CASE WHEN (SELECT regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname='public' AND p.proname='seed_commercial_free_topics')
                 ~* 'global_sequence'
            THEN 'FAIL' ELSE 'PASS' END AS result;
