-- 99_ROLLBACK — restores both tables from the 2026-09-03 backups.
-- Only needed if 90_VERIFY looked wrong. Requires the backup tables.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.public_courses_backup_20260903') IS NULL
     OR to_regclass('public.public_course_topics_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'cannot roll back: the backup tables are gone';
  END IF;
END $$;

-- Children first, then parents, then refill in the same order.
DELETE FROM public.public_course_topics;
DELETE FROM public.public_courses;

INSERT INTO public.public_courses
  SELECT * FROM public.public_courses_backup_20260903;
INSERT INTO public.public_course_topics
  SELECT * FROM public.public_course_topics_backup_20260903;

COMMIT;

SELECT (SELECT count(*) FROM public.public_courses)       AS courses_restored,
       (SELECT count(*) FROM public.public_course_topics) AS topic_rows_restored;
