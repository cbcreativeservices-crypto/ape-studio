-- 00_PRECHECK — read only. Run first. Changes nothing.
-- Confirms exactly which rows 10_APPLY will delete.
--
-- Written as ONE query on purpose. The Supabase SQL editor returns only the
-- last result set, so several separate SELECTs would show you only the last
-- one. No psql meta-commands (\echo and friends) — the editor sends raw SQL
-- to the server and the backslash forms are a client feature it does not have.

SELECT section, item, detail
FROM (
  -- The eight college courses that 10_APPLY removes.
  SELECT 1 AS ord,
         'WILL BE DELETED' AS section,
         'order ' || c.sort_order || ' · ' || c.display_name AS item,
         count(t.achievement_id)::text || ' topic rows' AS detail
  FROM public.public_courses c
  LEFT JOIN public.public_course_topics t ON t.public_course_id = c.id
  WHERE c.sort_order BETWEEN 2 AND 9
  GROUP BY c.sort_order, c.display_name

  UNION ALL
  -- Everything else. Expect exactly one row: order 1, the free taster.
  SELECT 2,
         'WILL BE KEPT',
         'order ' || c.sort_order || ' · ' || c.display_name,
         count(t.achievement_id)::text || ' topic rows'
  FROM public.public_courses c
  LEFT JOIN public.public_course_topics t ON t.public_course_id = c.id
  WHERE c.sort_order NOT BETWEEN 2 AND 9
  GROUP BY c.sort_order, c.display_name

  UNION ALL
  SELECT 3, 'TOTALS BEFORE', 'public_courses rows (expect 9)',
         (SELECT count(*)::text FROM public.public_courses)
  UNION ALL
  SELECT 3, 'TOTALS BEFORE', 'public_course_topics rows (expect 54)',
         (SELECT count(*)::text FROM public.public_course_topics)

  UNION ALL
  -- Nothing outside these two tables should point at them. Expect only the
  -- child table's own two foreign keys.
  SELECT 4, 'FOREIGN KEYS INTO THEM', con.conname,
         cl.relname || ' → ' || confrel.relname
  FROM pg_constraint con
  JOIN pg_class cl      ON cl.oid = con.conrelid
  JOIN pg_class confrel ON confrel.oid = con.confrelid
  WHERE con.contype = 'f'
    AND confrel.relname IN ('public_courses', 'public_course_topics')

  UNION ALL
  -- Whether this package has already run.
  SELECT 5, 'ALREADY RUN?', 'backup tables present',
         CASE WHEN to_regclass('public.public_courses_backup_20260903') IS NOT NULL
              THEN 'yes — 05_BACKUP has been run'
              ELSE 'no — 05_BACKUP has not been run yet' END
) v
ORDER BY ord, item;
