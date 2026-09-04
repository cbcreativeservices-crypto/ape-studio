-- DROP V1 SCAFFOLDING · STAGE 50 · ALTER TABLE achievements DROP COLUMN course_id.
--
-- REQUIRES: stage 10 (no surviving function reads the column).
-- REQUIRES: stage 20 (recompute_reachability + seed_first_topic_on_enrollment
--                     were its other two readers).
-- REQUIRES: RETIRE_INSTITUTIONAL stage 10 (v_student_progress selected it and
--                     IS dependency-checked - this ALTER fails loudly otherwise).
--
-- =============================================================================
-- TWO APP CHANGES MUST SHIP BEFORE YOU RUN THIS
-- =============================================================================
-- 1. src/features/dashboard/api.ts (~line 230 and ~line 238)
--       .select('id, course_id, sequence_in_course, ...')
--       course_id: a.course_id,
--    PostgREST errors on an unknown column, so the Dashboard's topic resolve
--    breaks the moment this runs. The Topic type's `course_id` field goes too
--    (DashboardScreen.tsx ~line 887 constructs one with course_id: '').
--
-- 2. src/features/profile/api.ts - fetchAchievements (~line 218) and
--    fetchGallery (~line 260) both embed `courses!inner(code, sequence,
--    color_hex)`. PostgREST resolves that embed THROUGH achievements_course_id_fkey,
--    which this stage drops. Both break here, and again in stage 80 when the
--    table itself goes. They are live: AchievementsScreen.tsx and
--    GalleryScreen.tsx call them.
--    NOTE: this one was not on the earlier blockers list. See NOTES_BLOCKERS.
-- =============================================================================
--
-- 51 non-null values, all v1, all backed up by 05_BACKUP. Dropping the column
-- also drops achievements_course_id_fkey - the second of the five FKs into
-- `courses`.
--
-- Idempotent: detects an already-dropped column and returns.
-- Reversible: 99_ROLLBACK re-adds the column, restores all 51 values, and
-- recreates the FK - but ONLY while `courses` still exists. Once stage 80 has
-- run the constraint can never come back; the rollback restores the column and
-- the values, says so, and skips the constraint.

BEGIN;

DO $guard$
DECLARE v_n int; v_left text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='achievements' AND column_name='course_id') THEN
    RAISE NOTICE 'achievements.course_id already dropped - nothing to do';
    RETURN;
  END IF;
  IF to_regclass('public.v1scaffold_ach_course_id_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been taken';
  END IF;

  -- Backup must cover every non-null value.
  SELECT count(*) INTO v_n FROM public.achievements a
   WHERE a.course_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.v1scaffold_ach_course_id_backup_20260903 k
                     WHERE k.id = a.id AND k.course_id = a.course_id);
  IF v_n > 0 THEN
    RAISE EXCEPTION 'refusing to run: % achievements.course_id values are not in the backup. Re-take 05_BACKUP.', v_n;
  END IF;

  -- No function may still read the column. Postgres will not check this.
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO v_left
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
  WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql') AND p.prosrc ~* '\mcourse_id\M';
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: these functions still reference course_id: %. Run stages 10 and 20 first.', v_left;
  END IF;

  -- Views ARE dependency-checked, so this would fail loudly anyway - but say why.
  IF to_regclass('public.v_student_progress') IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: v_student_progress still selects achievements.course_id. Run RETIRE_INSTITUTIONAL_PATH stage 10 first.';
  END IF;

  -- Content guard: the column may only ever have held v1 rows.
  SELECT count(*) INTO v_n FROM public.achievements
   WHERE course_id IS NOT NULL
     AND curriculum_version_id IS DISTINCT FROM 'c689c0c4-1d93-4a92-9159-2af019745c49'::uuid;
  IF v_n > 0 THEN
    RAISE EXCEPTION 'refusing to run: % non-v1 achievements carry a course_id - re-read the analysis before dropping', v_n;
  END IF;
END $guard$;

ALTER TABLE public.achievements DROP COLUMN IF EXISTS course_id;

COMMIT;

-- Read-back.
SELECT 'achievements.course_id dropped' AS check,
       CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                             WHERE table_schema='public' AND table_name='achievements' AND column_name='course_id')
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'achievements row count unchanged (468)',
  CASE WHEN (SELECT count(*) FROM public.achievements) = 468 THEN 'PASS'
       ELSE 'INVESTIGATE - now ' || (SELECT count(*)::text FROM public.achievements) END
UNION ALL SELECT 'backup still holds 51 values',
  CASE WHEN (SELECT count(*) FROM public.v1scaffold_ach_course_id_backup_20260903) = 51 THEN 'PASS' ELSE 'INVESTIGATE' END
UNION ALL SELECT 'FKs into courses remaining after this stage',
  (SELECT string_agg(c.conrelid::regclass::text||'.'||c.conname, ', ' ORDER BY 1)
   FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.courses'::regclass);
