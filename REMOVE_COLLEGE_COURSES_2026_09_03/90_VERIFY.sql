-- 90_VERIFY — read only. Run after 10_APPLY.
-- Every row in the CHECK section must read PASS.
--
-- One query on purpose: the Supabase editor returns only the last result set.
-- No psql meta-commands. `check` is a reserved word, so it is quoted.

SELECT section, "check", result
FROM (
  SELECT 1 AS ord, 'CHECK' AS section, 'only order 1 remains' AS "check",
         CASE WHEN (SELECT count(*) FROM public.public_courses) = 1
               AND (SELECT min(sort_order) FROM public.public_courses) = 1
              THEN 'PASS' ELSE 'FAIL' END AS result

  UNION ALL SELECT 2, 'CHECK', 'no college course rows left (orders 2-9)',
         CASE WHEN NOT EXISTS (SELECT 1 FROM public.public_courses
                               WHERE sort_order BETWEEN 2 AND 9)
              THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT 3, 'CHECK', 'one topic row remains',
         CASE WHEN (SELECT count(*) FROM public.public_course_topics) = 1
              THEN 'PASS' ELSE 'FAIL' END

  UNION ALL SELECT 4, 'CHECK', 'no orphaned topic rows',
         CASE WHEN NOT EXISTS (
                SELECT 1 FROM public.public_course_topics t
                LEFT JOIN public.public_courses c ON c.id = t.public_course_id
                WHERE c.id IS NULL)
              THEN 'PASS' ELSE 'FAIL' END

  -- Existence only, never a row count: referencing a table that does not exist
  -- would fail the whole statement at parse time, so running this before
  -- 05_BACKUP would error instead of reporting.
  UNION ALL SELECT 5, 'CHECK', 'backup tables retained',
         CASE WHEN to_regclass('public.public_courses_backup_20260903') IS NOT NULL
               AND to_regclass('public.public_course_topics_backup_20260903') IS NOT NULL
              THEN 'PASS' ELSE 'FAIL — 05_BACKUP has not been run' END

  UNION ALL
  SELECT 6, 'WHAT IS LEFT',
         'order ' || c.sort_order || ' · ' || c.display_name,
         (SELECT count(*) FROM public.public_course_topics t
           WHERE t.public_course_id = c.id)::text || ' topic rows'
  FROM public.public_courses c
) v
ORDER BY ord, "check";
