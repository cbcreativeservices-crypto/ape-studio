-- Expect glossary total 19,575 -> 19,648 (+73). 5 new topics. 73 primary links.
SELECT (SELECT count(*) FROM glossary) AS glossary_total;
SELECT a.name, count(*) AS terms
FROM glossary_topics gt JOIN achievements a ON a.id=gt.achievement_id
WHERE gt.is_primary AND a.id IN (
 'f851bfc8-f928-46ff-912c-826a7e7c675c','9573ac8c-5821-4749-8bfd-d3b39cf3657c',
 'a4f67192-6af2-411b-8f26-4df4044a3a07','5df6f5ec-e98f-4003-a412-a16c0201c661',
 'd880b947-0203-4f04-916c-49045fe3c09d')
GROUP BY a.name ORDER BY terms DESC;
SELECT count(*) AS multi_primary FROM (SELECT glossary_id FROM glossary_topics WHERE is_primary GROUP BY glossary_id HAVING count(*)>1) x;
