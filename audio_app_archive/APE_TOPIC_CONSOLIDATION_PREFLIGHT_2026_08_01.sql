-- PRE-FLIGHT before any hard DELETE of the 28 retired draft achievements.
-- Lists every table.column FK that references achievements.id, so we know what else points at them.
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name
WHERE tc.constraint_type='FOREIGN KEY' AND ccu.table_name='achievements' AND ccu.column_name='id';

-- Then check whether any retired draft id is still referenced anywhere before deleting:
-- (run per referencing table found above) e.g.
-- SELECT count(*) FROM student_achievement_progress WHERE achievement_id IN ('eb10acd3-609a-47a9-9d4e-43d05db56d63','fa3fa679-cafb-4478-9175-6beb06f9cb61','75ed360a-ffcf-4288-9a00-49f7d283503c','f482144c-0f68-43c2-b62d-63c945a431bb','7294afe5-9178-4413-be55-e74aa9f84942','cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551','7d098dac-6bc4-4eb6-8942-e45c9e834150','8db281ce-61c5-4c0f-b9e2-c83fa779792b','873348dd-c90c-4525-aeb8-81c51488044c','ff5f3513-2fb7-4c13-9d2b-18e4374169a6','d42dcf1d-a730-488c-9633-28e1218563a4','eba54a3f-0ecc-4acf-a18d-2df0353a50f9','07df90cd-38fa-4737-8b35-b63864c78de1','041c8d66-5280-40b9-abdc-7b18202b684a','681cb58c-4a8b-470d-b37c-f9d1ca124c01','575d5f16-29f9-49fe-bd09-20d7a7253e5c','ecf9ca06-dd0c-4417-b8b3-4b0015839729','13e902c2-dcd5-4a12-84f7-0ee8873df936','130626bc-c5e5-46c6-8d12-d32a73bd55f8','e5451add-87f8-47f0-ba06-9a53d70bebe9','7106239e-6942-4d98-b7f9-847d6c533d08','173a5d7e-a84d-4b90-9038-81d5ad73f08a','544770a6-1d5b-4777-8772-ac562c0d3539','cf8ef23a-a16a-4291-82ce-756e9ae1bd36','e2979cc0-a917-44e7-8fea-c223a9eb30e9','3283d1e2-3e1b-4d00-9f52-5df84039ca7f','f7a42023-78ba-476f-93ad-9a87d4e42ff4','89bd470d-e7fb-464b-874c-753f1d1db912');