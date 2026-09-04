-- DROP V1 SCAFFOLDING · STAGE 80 · DROP TABLE courses. LAST.
--
-- REQUIRES: every stage above, plus REMOVE_V1_REMNANTS stage 50 (which drops
--           glossary.course_id and with it glossary_course_id_fkey).
--
-- There were five FKs into this table. Each one is cleared by a specific stage:
--     session_logs_course_id_fkey      -> stage 40 (table dropped)
--     achievements_course_id_fkey      -> stage 50 (column dropped)
--     enrollment_course_id_fkey        -> stage 60 (table dropped)
--     course_sections_course_id_fkey   -> stage 70 (table dropped)
--     glossary_course_id_fkey          -> REMOVE_V1_REMNANTS stage 50
-- The guard below enumerates whatever is actually left rather than trusting
-- that list, and names it in the error.
--
-- =============================================================================
-- ONE APP CHANGE MUST SHIP BEFORE YOU RUN THIS
-- =============================================================================
-- src/features/profile/api.ts embeds `courses!inner(...)` in two live queries:
--     fetchAchievements (~line 218)  - called by AchievementsScreen.tsx
--     fetchGallery      (~line 260)  - called by GalleryScreen.tsx
-- Both use the embedded course code and color_hex to label and colour every
-- trophy tile. With `courses` gone, PostgREST rejects the embed and BOTH
-- SCREENS THROW. Stage 50 already breaks them (it drops the FK the embed
-- resolves through), so in practice this change ships before stage 50 - it is
-- restated here because this is the point of no return.
-- See NOTES_BLOCKERS for what the replacement has to supply.
-- =============================================================================
--
-- 9 rows. Content, not user data - but v1 content, retired, and fully backed up.
--
-- IRREVERSIBILITY WARNING. 99_ROLLBACK recreates this table with its exact
-- columns, defaults, keys and policies and restores all 9 rows, so the table
-- itself comes back. What can NEVER come back after this point is
-- glossary_course_id_fkey: REMOVE_V1_REMNANTS' own rollback recreates that
-- constraint pointing at public.courses, and once you have dropped and
-- recreated this table the original constraint identity is gone. If you might
-- want that package's rollback to be complete, take a Supabase snapshot before
-- running this file.
--
-- Idempotent: IF EXISTS.

BEGIN;

DO $guard$
DECLARE v_n int; v_left text;
BEGIN
  IF to_regclass('public.courses') IS NULL THEN
    RAISE NOTICE 'courses already dropped - nothing to do';
    RETURN;
  END IF;
  IF to_regclass('public.v1scaffold_courses_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been taken';
  END IF;

  SELECT count(*) INTO v_n FROM public.courses c
   WHERE NOT EXISTS (SELECT 1 FROM public.v1scaffold_courses_backup_20260903 k WHERE k.id = c.id);
  IF v_n > 0 THEN
    RAISE EXCEPTION 'refusing to run: % courses rows are not in the backup. Re-take 05_BACKUP.', v_n;
  END IF;

  -- Every FK in, named.
  SELECT string_agg(c.conrelid::regclass::text||'.'||c.conname, ', ' ORDER BY 1) INTO v_left
  FROM pg_constraint c WHERE c.contype='f' AND c.confrelid='public.courses'::regclass;
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: foreign keys still point at courses: %', v_left;
  END IF;

  -- No function may still read it.
  SELECT string_agg(p.proname, ', ' ORDER BY p.proname) INTO v_left
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
  WHERE n.nspname='public' AND l.lanname IN ('plpgsql','sql') AND p.prosrc ~* '\mcourses\M';
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: these functions still read courses: %. Run stages 10 and 20, and REMOVE_V1_REMNANTS stage 10, first.', v_left;
  END IF;

  -- No view/matview either (these ARE dependency-checked, but name it clearly).
  SELECT string_agg(DISTINCT dep.relname, ', ') INTO v_left
  FROM pg_depend d JOIN pg_rewrite r ON r.oid=d.objid
  JOIN pg_class dep ON dep.oid=r.ev_class
  JOIN pg_class src ON src.oid=d.refobjid JOIN pg_namespace ns ON ns.oid=src.relnamespace
  WHERE ns.nspname='public' AND src.relname='courses' AND dep.relname <> 'courses';
  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'refusing to run: these views still read courses: %', v_left;
  END IF;
END $guard$;

DROP TABLE IF EXISTS public.courses;

COMMIT;

-- Read-back. The five targets should now all be gone.
SELECT 'courses dropped' AS check,
       CASE WHEN to_regclass('public.courses') IS NULL THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL SELECT 'enrollment dropped',       CASE WHEN to_regclass('public.enrollment') IS NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'course_sections dropped',  CASE WHEN to_regclass('public.course_sections') IS NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'session_logs dropped',     CASE WHEN to_regclass('public.session_logs') IS NULL THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'achievements.course_id dropped',
  CASE WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema='public' AND table_name='achievements' AND column_name='course_id')
       THEN 'PASS' ELSE 'FAIL' END
UNION ALL SELECT 'CONTENT INTACT - glossary rows',        (SELECT count(*)::text FROM public.glossary)
UNION ALL SELECT 'CONTENT INTACT - glossary_topics links', (SELECT count(*)::text FROM public.glossary_topics)
UNION ALL SELECT 'CONTENT INTACT - quiz_questions',        (SELECT count(*)::text FROM public.quiz_questions)
UNION ALL SELECT 'CONTENT INTACT - achievements',          (SELECT count(*)::text FROM public.achievements);
