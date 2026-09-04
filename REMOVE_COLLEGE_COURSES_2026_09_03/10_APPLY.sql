-- 10_APPLY — deletes the eight college courses. Idempotent, backup-guarded.
-- Owner ruling 2026-09-03: catalog orders 2-9 were courses at Booth's college
-- and have no relation to this app. Order 1 (Pro Audio Safety) is KEPT.

BEGIN;

DO $$
DECLARE
  v_courses_gone int;
  v_topics_gone  int;
  v_left         int;
BEGIN
  -- Guard 1: the backup must exist and be complete.
  IF to_regclass('public.public_courses_backup_20260903') IS NULL
     OR to_regclass('public.public_course_topics_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been run';
  END IF;
  IF (SELECT count(*) FROM public.public_courses_backup_20260903) = 0 THEN
    RAISE EXCEPTION 'refusing to run: the course backup is empty';
  END IF;

  -- Guard 2: never touch order 1.
  IF EXISTS (SELECT 1 FROM public.public_courses
             WHERE sort_order = 1 AND sort_order BETWEEN 2 AND 9) THEN
    RAISE EXCEPTION 'refusing to run: order 1 falls inside the delete range';
  END IF;

  -- Topics first (they carry the FK into public_courses).
  DELETE FROM public.public_course_topics t
  USING public.public_courses c
  WHERE t.public_course_id = c.id
    AND c.sort_order BETWEEN 2 AND 9;
  GET DIAGNOSTICS v_topics_gone = ROW_COUNT;

  DELETE FROM public.public_courses
  WHERE sort_order BETWEEN 2 AND 9;
  GET DIAGNOSTICS v_courses_gone = ROW_COUNT;

  -- Guard 3: something must survive.
  SELECT count(*) INTO v_left FROM public.public_courses;
  IF v_left = 0 THEN
    RAISE EXCEPTION 'refusing to commit: that would empty public_courses';
  END IF;

  RAISE NOTICE 'removed % course rows and % topic rows; % course(s) remain',
    v_courses_gone, v_topics_gone, v_left;
END $$;

COMMIT;

-- Report. The RAISE NOTICE above is invisible in the Supabase SQL editor, so
-- the outcome is re-derived here as a result set you can actually read. These
-- are post-state facts, which is the thing worth confirming anyway.
SELECT item, value
FROM (
  SELECT 1 AS ord, 'courses remaining (expect 1)' AS item,
         (SELECT count(*)::text FROM public.public_courses) AS value
  UNION ALL
  SELECT 2, 'topic rows remaining (expect 1)',
         (SELECT count(*)::text FROM public.public_course_topics)
  UNION ALL
  SELECT 3, 'college courses left (expect 0)',
         (SELECT count(*)::text FROM public.public_courses
           WHERE sort_order BETWEEN 2 AND 9)
  UNION ALL
  SELECT 4, 'what survived',
         (SELECT string_agg('order ' || c.sort_order || ' · ' || c.display_name, ' | '
                            ORDER BY c.sort_order)
            FROM public.public_courses c)
  UNION ALL
  -- Presence only, never a row count: a count would name a table that may not
  -- exist, and a clear guard message beats a name-resolution error.
  SELECT 5, 'backup still present (rollback is possible)',
         CASE WHEN to_regclass('public.public_courses_backup_20260903') IS NOT NULL
               AND to_regclass('public.public_course_topics_backup_20260903') IS NOT NULL
              THEN 'yes' ELSE 'NO — do not proceed' END
) v
ORDER BY ord;
