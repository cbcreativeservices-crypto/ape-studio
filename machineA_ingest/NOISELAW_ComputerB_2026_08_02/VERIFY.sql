-- Run APPLY_00 then APPLY_01. Expect glossary +208 -> 21,173; 5 topics; 208 primary links.
SELECT (SELECT count(*) FROM glossary) AS glossary_total;
SELECT a.name, count(*) terms FROM glossary_topics gt JOIN achievements a ON a.id=gt.achievement_id WHERE gt.is_primary AND a.id IN ('2082cf46-6898-40aa-bdb6-03373c9444a2','16a88917-e3bb-4bc7-ae40-8f8075c7f04c','f31111e1-7660-420a-a3b8-4f55780f8148','fe939357-1f13-4421-b331-61ce91d66150','285671a7-e448-4b2c-931f-1e5a43271820') GROUP BY a.name ORDER BY terms DESC;
SELECT count(*) multi_primary FROM (SELECT glossary_id FROM glossary_topics WHERE is_primary GROUP BY glossary_id HAVING count(*)>1) x;
