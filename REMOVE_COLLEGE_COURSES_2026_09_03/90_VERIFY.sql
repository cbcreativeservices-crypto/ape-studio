-- 90_VERIFY — read only. Run after 10_APPLY. Every line should read PASS.

SELECT 'only order 1 remains' AS check,
       CASE WHEN (SELECT count(*) FROM public.public_courses) = 1
             AND (SELECT min(sort_order) FROM public.public_courses) = 1
            THEN 'PASS' ELSE 'FAIL' END AS result
UNION ALL
SELECT 'no college course rows left',
       CASE WHEN NOT EXISTS (SELECT 1 FROM public.public_courses
                             WHERE sort_order BETWEEN 2 AND 9)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'one topic row remains',
       CASE WHEN (SELECT count(*) FROM public.public_course_topics) = 1
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'no orphaned topic rows',
       CASE WHEN NOT EXISTS (
              SELECT 1 FROM public.public_course_topics t
              LEFT JOIN public.public_courses c ON c.id = t.public_course_id
              WHERE c.id IS NULL)
            THEN 'PASS' ELSE 'FAIL' END
UNION ALL
SELECT 'backups retained',
       CASE WHEN (SELECT count(*) FROM public.public_courses_backup_20260903) = 9
             AND (SELECT count(*) FROM public.public_course_topics_backup_20260903) = 54
            THEN 'PASS' ELSE 'FAIL' END;

\echo '--- what is left ---'
SELECT c.sort_order, c.display_name, count(t.achievement_id) AS topic_rows
FROM public.public_courses c
LEFT JOIN public.public_course_topics t ON t.public_course_id = c.id
GROUP BY c.sort_order, c.display_name
ORDER BY c.sort_order;
