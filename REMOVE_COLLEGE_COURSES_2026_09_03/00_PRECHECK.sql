-- 00_PRECHECK — read only. Run first. Changes nothing.
-- Confirms exactly which rows 10_APPLY will delete.

\echo '--- courses that WILL BE DELETED (expect 8: sort_order 2..9) ---'
SELECT c.sort_order, c.display_name, c.is_active,
       count(t.achievement_id) AS topic_rows
FROM public.public_courses c
LEFT JOIN public.public_course_topics t ON t.public_course_id = c.id
WHERE c.sort_order BETWEEN 2 AND 9
GROUP BY c.sort_order, c.display_name, c.is_active
ORDER BY c.sort_order;

\echo '--- courses that WILL BE KEPT (expect exactly 1: sort_order 1) ---'
SELECT c.sort_order, c.display_name, count(t.achievement_id) AS topic_rows
FROM public.public_courses c
LEFT JOIN public.public_course_topics t ON t.public_course_id = c.id
WHERE c.sort_order NOT BETWEEN 2 AND 9
GROUP BY c.sort_order, c.display_name
ORDER BY c.sort_order;

\echo '--- totals before (expect 9 courses, 54 topic rows) ---'
SELECT (SELECT count(*) FROM public.public_courses)       AS courses_now,
       (SELECT count(*) FROM public.public_course_topics) AS topic_rows_now;

\echo '--- sanity: nothing outside these two tables points at them ---'
SELECT con.conname, cl.relname AS from_table, confrel.relname AS to_table
FROM pg_constraint con
JOIN pg_class cl      ON cl.oid = con.conrelid
JOIN pg_class confrel ON confrel.oid = con.confrelid
WHERE con.contype = 'f'
  AND confrel.relname IN ('public_courses','public_course_topics');
