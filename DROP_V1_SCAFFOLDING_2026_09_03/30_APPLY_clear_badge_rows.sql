-- DROP V1 SCAFFOLDING · STAGE 30 · delete the 4 badges rows.
--
-- OPTIONAL. This stage is NOT required by any of the five drops. Skipping it
-- costs nothing here. Run it only if you want the knock-on effect described
-- below. It is fully reversible either way.
--
-- REQUIRES: stage 10 (submit_quiz must no longer write student_badges).
--
-- ------------------------------------------------------------------ what this is for
-- You said badges are removed from the app entirely, and gave permission to
-- delete the 4 rows. Here is exactly what that buys and what it costs.
--
-- BUYS: `badges.trigger_achievement_id -> achievements(id)` is one of the FKs
-- that blocked CONVERT_RETIRE_V1_TOPICS stage 40 (the OPTIONAL hard-delete of
-- the 51 legacy v1 achievements rows). All 4 badges are v1 and all 4 point at a
-- v1 achievement. Deleting the rows removes those 4 referencing rows, so that
-- optional stage has one fewer blocker. It does NOT clear the others
-- (quiz_questions, glossary, glossary_topics, certificate_topics,
-- program_topics, award_standing_requirements and the progress tables all still
-- reference achievements) - see that package's own notes.
--
-- COSTS: nothing measurable. student_badges has 0 rows, so no earned record is
-- destroyed. The dead badge write in submit_quiz is already gone (stage 10).
--
-- WHAT THIS DELIBERATELY DOES NOT DO
--   * It does NOT drop the `badges` or `student_badges` TABLES. Three things
--     still read them and would break: the view v_badge_roster, the
--     materialized view mv_program_kpis, and src/features/profile/api.ts
--     (fetchProfile reads student_badges.badge_name_snapshot to derive the four
--     MIC/REC/MIX/PA certificate flags). lookup_student_by_qr also still LEFT
--     JOINs both. Dropping the tables is a separate decision with an app change
--     attached; it is not needed for anything in this package.
--   * It does NOT touch achievements.badge_trigger (a text column, 4 non-null
--     rows, all v1). Nothing reads it after stage 10 except
--     src/screens/results/TrophyScreen.tsx, which only reads it when
--     badge_earned is true - and that is now a constant false.
--
-- Because the tables stay, everything above keeps working: the views return
-- zero rows, fetchProfile finds no badges and shows no certificate flags,
-- lookup_student_by_qr returns its row with NULL badge columns.
--
-- Idempotent: deleting an already-empty table is a no-op.
-- Reversible: 99_ROLLBACK re-inserts all 4 rows verbatim from 05_BACKUP.

BEGIN;

DO $guard$
DECLARE v_n int;
BEGIN
  IF to_regclass('public.v1scaffold_badges_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not captured the badges rows';
  END IF;

  -- The backup must cover every row we are about to delete.
  SELECT count(*) INTO v_n FROM public.badges b
   WHERE NOT EXISTS (SELECT 1 FROM public.v1scaffold_badges_backup_20260903 k WHERE k.id = b.id);
  IF v_n > 0 THEN
    RAISE EXCEPTION 'refusing to run: % badges rows are not in the backup. Re-take 05_BACKUP.', v_n;
  END IF;

  -- Never destroy an earned record.
  SELECT count(*) INTO v_n FROM public.student_badges;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'refusing to run: student_badges has % rows. Someone has earned a badge - this stage would orphan or block it. Stop and re-read the README.', v_n;
  END IF;

  -- Content guard: only v1 badges may be deleted.
  SELECT count(*) INTO v_n FROM public.badges
   WHERE curriculum_version_id IS DISTINCT FROM 'c689c0c4-1d93-4a92-9159-2af019745c49'::uuid;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'refusing to run: % non-v1 badges exist - that is live content, not scaffolding', v_n;
  END IF;

  -- submit_quiz must no longer write student_badges.
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='submit_quiz' AND p.prosrc ~* 'student_badges') THEN
    RAISE EXCEPTION 'refusing to run: submit_quiz still writes student_badges. Run stage 10 first.';
  END IF;
END $guard$;

DELETE FROM public.badges;

COMMIT;

-- Read-back.
SELECT 'badges rows remaining (expect 0)' AS check, count(*)::text AS result FROM public.badges
UNION ALL SELECT 'student_badges rows (expect 0)', count(*)::text FROM public.student_badges
UNION ALL SELECT 'badges backup still holds 4 rows',
  CASE WHEN (SELECT count(*) FROM public.v1scaffold_badges_backup_20260903) = 4 THEN 'PASS' ELSE 'INVESTIGATE' END
UNION ALL SELECT 'badges -> achievements FK rows remaining (expect 0)',
  (SELECT count(*)::text FROM public.badges WHERE trigger_achievement_id IS NOT NULL)
UNION ALL SELECT 'v_badge_roster / mv_program_kpis still present',
  CASE WHEN to_regclass('public.v_badge_roster') IS NOT NULL
        AND to_regclass('public.mv_program_kpis') IS NOT NULL
       THEN 'PASS' ELSE 'INVESTIGATE - a badge view is missing' END;
