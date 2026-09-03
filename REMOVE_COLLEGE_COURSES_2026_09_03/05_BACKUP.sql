-- 05_BACKUP — creates the only copy of the rows 10_APPLY removes.
-- Safe to re-run: it refuses to clobber an existing backup.

DO $$
BEGIN
  IF to_regclass('public.public_courses_backup_20260903') IS NOT NULL THEN
    RAISE NOTICE 'backup already exists — leaving it untouched';
  ELSE
    CREATE TABLE public.public_courses_backup_20260903 AS
      SELECT * FROM public.public_courses;
    RAISE NOTICE 'backed up public_courses';
  END IF;

  IF to_regclass('public.public_course_topics_backup_20260903') IS NOT NULL THEN
    RAISE NOTICE 'topic backup already exists — leaving it untouched';
  ELSE
    CREATE TABLE public.public_course_topics_backup_20260903 AS
      SELECT * FROM public.public_course_topics;
    RAISE NOTICE 'backed up public_course_topics';
  END IF;
END $$;

SELECT (SELECT count(*) FROM public.public_courses_backup_20260903)       AS courses_backed_up,
       (SELECT count(*) FROM public.public_course_topics_backup_20260903) AS topic_rows_backed_up;
