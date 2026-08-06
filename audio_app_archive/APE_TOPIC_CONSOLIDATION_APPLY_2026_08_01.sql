-- CANDIDATE — duplicate-topic consolidation. Review before running. Nothing auto-run.
-- Rule: keep the ACTIVE (course-linked) row as canonical; migrate the draft duplicate's
-- glossary links + denormalized glossary.achievement_id onto it; then retire the draft row.
-- Run inside ONE transaction; VERIFY block at the end.

BEGIN;
-- Amplifiers: keep active d3228341-9d1e-484b-b7f6-659c6b341c54 (was 36), merge draft eb10acd3-609a-47a9-9d4e-43d05db56d63 (was 111)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='d3228341-9d1e-484b-b7f6-659c6b341c54' AND d.achievement_id='eb10acd3-609a-47a9-9d4e-43d05db56d63' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='d3228341-9d1e-484b-b7f6-659c6b341c54' WHERE gt.achievement_id='eb10acd3-609a-47a9-9d4e-43d05db56d63' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='d3228341-9d1e-484b-b7f6-659c6b341c54');
DELETE FROM glossary_topics WHERE achievement_id='eb10acd3-609a-47a9-9d4e-43d05db56d63';
UPDATE glossary SET achievement_id='d3228341-9d1e-484b-b7f6-659c6b341c54' WHERE achievement_id='eb10acd3-609a-47a9-9d4e-43d05db56d63';
UPDATE achievements SET is_active=false WHERE id='eb10acd3-609a-47a9-9d4e-43d05db56d63';

-- Analog Live Sound: keep active 518a11dc-e2e9-472d-8ed5-a9fa1c1c51b9 (was 66), merge draft fa3fa679-cafb-4478-9175-6beb06f9cb61 (was 13)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='518a11dc-e2e9-472d-8ed5-a9fa1c1c51b9' AND d.achievement_id='fa3fa679-cafb-4478-9175-6beb06f9cb61' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='518a11dc-e2e9-472d-8ed5-a9fa1c1c51b9' WHERE gt.achievement_id='fa3fa679-cafb-4478-9175-6beb06f9cb61' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='518a11dc-e2e9-472d-8ed5-a9fa1c1c51b9');
DELETE FROM glossary_topics WHERE achievement_id='fa3fa679-cafb-4478-9175-6beb06f9cb61';
UPDATE glossary SET achievement_id='518a11dc-e2e9-472d-8ed5-a9fa1c1c51b9' WHERE achievement_id='fa3fa679-cafb-4478-9175-6beb06f9cb61';
UPDATE achievements SET is_active=false WHERE id='fa3fa679-cafb-4478-9175-6beb06f9cb61';

-- Assisted Listening Systems: keep active 762d01b3-8198-4c13-8e20-46df0ed5cd89 (was 51), merge draft 75ed360a-ffcf-4288-9a00-49f7d283503c (was 5)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='762d01b3-8198-4c13-8e20-46df0ed5cd89' AND d.achievement_id='75ed360a-ffcf-4288-9a00-49f7d283503c' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='762d01b3-8198-4c13-8e20-46df0ed5cd89' WHERE gt.achievement_id='75ed360a-ffcf-4288-9a00-49f7d283503c' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='762d01b3-8198-4c13-8e20-46df0ed5cd89');
DELETE FROM glossary_topics WHERE achievement_id='75ed360a-ffcf-4288-9a00-49f7d283503c';
UPDATE glossary SET achievement_id='762d01b3-8198-4c13-8e20-46df0ed5cd89' WHERE achievement_id='75ed360a-ffcf-4288-9a00-49f7d283503c';
UPDATE achievements SET is_active=false WHERE id='75ed360a-ffcf-4288-9a00-49f7d283503c';

-- Audio Career Exploration: keep active 30d1f510-06e4-42cb-9e8d-af5f52e490d5 (was 134), merge draft f482144c-0f68-43c2-b62d-63c945a431bb (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='30d1f510-06e4-42cb-9e8d-af5f52e490d5' AND d.achievement_id='f482144c-0f68-43c2-b62d-63c945a431bb' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='30d1f510-06e4-42cb-9e8d-af5f52e490d5' WHERE gt.achievement_id='f482144c-0f68-43c2-b62d-63c945a431bb' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='30d1f510-06e4-42cb-9e8d-af5f52e490d5');
DELETE FROM glossary_topics WHERE achievement_id='f482144c-0f68-43c2-b62d-63c945a431bb';
UPDATE glossary SET achievement_id='30d1f510-06e4-42cb-9e8d-af5f52e490d5' WHERE achievement_id='f482144c-0f68-43c2-b62d-63c945a431bb';
UPDATE achievements SET is_active=false WHERE id='f482144c-0f68-43c2-b62d-63c945a431bb';

-- Audio System Design: keep active 38f5d4d9-8710-486f-aaa9-94ca447e5185 (was 53), merge draft 7294afe5-9178-4413-be55-e74aa9f84942 (was 52)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='38f5d4d9-8710-486f-aaa9-94ca447e5185' AND d.achievement_id='7294afe5-9178-4413-be55-e74aa9f84942' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='38f5d4d9-8710-486f-aaa9-94ca447e5185' WHERE gt.achievement_id='7294afe5-9178-4413-be55-e74aa9f84942' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='38f5d4d9-8710-486f-aaa9-94ca447e5185');
DELETE FROM glossary_topics WHERE achievement_id='7294afe5-9178-4413-be55-e74aa9f84942';
UPDATE glossary SET achievement_id='38f5d4d9-8710-486f-aaa9-94ca447e5185' WHERE achievement_id='7294afe5-9178-4413-be55-e74aa9f84942';
UPDATE achievements SET is_active=false WHERE id='7294afe5-9178-4413-be55-e74aa9f84942';

-- Copyright, Publishing & Licensing: keep active ca29aaa4-c6b7-4761-9579-e6d4b6c1cb46 (was 56), merge draft cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='ca29aaa4-c6b7-4761-9579-e6d4b6c1cb46' AND d.achievement_id='cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='ca29aaa4-c6b7-4761-9579-e6d4b6c1cb46' WHERE gt.achievement_id='cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='ca29aaa4-c6b7-4761-9579-e6d4b6c1cb46');
DELETE FROM glossary_topics WHERE achievement_id='cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551';
UPDATE glossary SET achievement_id='ca29aaa4-c6b7-4761-9579-e6d4b6c1cb46' WHERE achievement_id='cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551';
UPDATE achievements SET is_active=false WHERE id='cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551';

-- Corporate AV: keep active cdb5ba27-eec0-43ee-aaa6-76970e89c9bf (was 45), merge draft 7d098dac-6bc4-4eb6-8942-e45c9e834150 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='cdb5ba27-eec0-43ee-aaa6-76970e89c9bf' AND d.achievement_id='7d098dac-6bc4-4eb6-8942-e45c9e834150' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='cdb5ba27-eec0-43ee-aaa6-76970e89c9bf' WHERE gt.achievement_id='7d098dac-6bc4-4eb6-8942-e45c9e834150' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='cdb5ba27-eec0-43ee-aaa6-76970e89c9bf');
DELETE FROM glossary_topics WHERE achievement_id='7d098dac-6bc4-4eb6-8942-e45c9e834150';
UPDATE glossary SET achievement_id='cdb5ba27-eec0-43ee-aaa6-76970e89c9bf' WHERE achievement_id='7d098dac-6bc4-4eb6-8942-e45c9e834150';
UPDATE achievements SET is_active=false WHERE id='7d098dac-6bc4-4eb6-8942-e45c9e834150';

-- Digital Live Sound: keep active aaf2939d-d761-4abd-b296-4eb575dec5b3 (was 10), merge draft 8db281ce-61c5-4c0f-b9e2-c83fa779792b (was 64)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='aaf2939d-d761-4abd-b296-4eb575dec5b3' AND d.achievement_id='8db281ce-61c5-4c0f-b9e2-c83fa779792b' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='aaf2939d-d761-4abd-b296-4eb575dec5b3' WHERE gt.achievement_id='8db281ce-61c5-4c0f-b9e2-c83fa779792b' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='aaf2939d-d761-4abd-b296-4eb575dec5b3');
DELETE FROM glossary_topics WHERE achievement_id='8db281ce-61c5-4c0f-b9e2-c83fa779792b';
UPDATE glossary SET achievement_id='aaf2939d-d761-4abd-b296-4eb575dec5b3' WHERE achievement_id='8db281ce-61c5-4c0f-b9e2-c83fa779792b';
UPDATE achievements SET is_active=false WHERE id='8db281ce-61c5-4c0f-b9e2-c83fa779792b';

-- Distributed Audio Systems: keep active b692402f-ebe0-4c7e-af97-da980f5bfc3e (was 9), merge draft 873348dd-c90c-4525-aeb8-81c51488044c (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='b692402f-ebe0-4c7e-af97-da980f5bfc3e' AND d.achievement_id='873348dd-c90c-4525-aeb8-81c51488044c' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='b692402f-ebe0-4c7e-af97-da980f5bfc3e' WHERE gt.achievement_id='873348dd-c90c-4525-aeb8-81c51488044c' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='b692402f-ebe0-4c7e-af97-da980f5bfc3e');
DELETE FROM glossary_topics WHERE achievement_id='873348dd-c90c-4525-aeb8-81c51488044c';
UPDATE glossary SET achievement_id='b692402f-ebe0-4c7e-af97-da980f5bfc3e' WHERE achievement_id='873348dd-c90c-4525-aeb8-81c51488044c';
UPDATE achievements SET is_active=false WHERE id='873348dd-c90c-4525-aeb8-81c51488044c';

-- Documentation & Diagrams: keep active 2e0ad475-3ef9-49bd-b35f-cc72fbdb7569 (was 8), merge draft ff5f3513-2fb7-4c13-9d2b-18e4374169a6 (was 61)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='2e0ad475-3ef9-49bd-b35f-cc72fbdb7569' AND d.achievement_id='ff5f3513-2fb7-4c13-9d2b-18e4374169a6' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='2e0ad475-3ef9-49bd-b35f-cc72fbdb7569' WHERE gt.achievement_id='ff5f3513-2fb7-4c13-9d2b-18e4374169a6' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='2e0ad475-3ef9-49bd-b35f-cc72fbdb7569');
DELETE FROM glossary_topics WHERE achievement_id='ff5f3513-2fb7-4c13-9d2b-18e4374169a6';
UPDATE glossary SET achievement_id='2e0ad475-3ef9-49bd-b35f-cc72fbdb7569' WHERE achievement_id='ff5f3513-2fb7-4c13-9d2b-18e4374169a6';
UPDATE achievements SET is_active=false WHERE id='ff5f3513-2fb7-4c13-9d2b-18e4374169a6';

-- Dynamics Processing: keep active fd3b3424-5f3f-4251-8a22-844ac8f52b18 (was 58), merge draft d42dcf1d-a730-488c-9633-28e1218563a4 (was 234)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='fd3b3424-5f3f-4251-8a22-844ac8f52b18' AND d.achievement_id='d42dcf1d-a730-488c-9633-28e1218563a4' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='fd3b3424-5f3f-4251-8a22-844ac8f52b18' WHERE gt.achievement_id='d42dcf1d-a730-488c-9633-28e1218563a4' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='fd3b3424-5f3f-4251-8a22-844ac8f52b18');
DELETE FROM glossary_topics WHERE achievement_id='d42dcf1d-a730-488c-9633-28e1218563a4';
UPDATE glossary SET achievement_id='fd3b3424-5f3f-4251-8a22-844ac8f52b18' WHERE achievement_id='d42dcf1d-a730-488c-9633-28e1218563a4';
UPDATE achievements SET is_active=false WHERE id='d42dcf1d-a730-488c-9633-28e1218563a4';

-- Ear Training: keep active 6b5b715c-adc7-4cd6-a133-25f5bc41e9b3 (was 8), merge draft eba54a3f-0ecc-4acf-a18d-2df0353a50f9 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='6b5b715c-adc7-4cd6-a133-25f5bc41e9b3' AND d.achievement_id='eba54a3f-0ecc-4acf-a18d-2df0353a50f9' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='6b5b715c-adc7-4cd6-a133-25f5bc41e9b3' WHERE gt.achievement_id='eba54a3f-0ecc-4acf-a18d-2df0353a50f9' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='6b5b715c-adc7-4cd6-a133-25f5bc41e9b3');
DELETE FROM glossary_topics WHERE achievement_id='eba54a3f-0ecc-4acf-a18d-2df0353a50f9';
UPDATE glossary SET achievement_id='6b5b715c-adc7-4cd6-a133-25f5bc41e9b3' WHERE achievement_id='eba54a3f-0ecc-4acf-a18d-2df0353a50f9';
UPDATE achievements SET is_active=false WHERE id='eba54a3f-0ecc-4acf-a18d-2df0353a50f9';

-- Equalization (EQ): keep active f88ae2dc-8d94-4242-9f3a-afad42f03fe8 (was 68), merge draft 07df90cd-38fa-4737-8b35-b63864c78de1 (was 76)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='f88ae2dc-8d94-4242-9f3a-afad42f03fe8' AND d.achievement_id='07df90cd-38fa-4737-8b35-b63864c78de1' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='f88ae2dc-8d94-4242-9f3a-afad42f03fe8' WHERE gt.achievement_id='07df90cd-38fa-4737-8b35-b63864c78de1' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='f88ae2dc-8d94-4242-9f3a-afad42f03fe8');
DELETE FROM glossary_topics WHERE achievement_id='07df90cd-38fa-4737-8b35-b63864c78de1';
UPDATE glossary SET achievement_id='f88ae2dc-8d94-4242-9f3a-afad42f03fe8' WHERE achievement_id='07df90cd-38fa-4737-8b35-b63864c78de1';
UPDATE achievements SET is_active=false WHERE id='07df90cd-38fa-4737-8b35-b63864c78de1';

-- Grounding & Electrical: keep active d392b133-d929-46cb-8c9b-bc95d94a2254 (was 73), merge draft 041c8d66-5280-40b9-abdc-7b18202b684a (was 3)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='d392b133-d929-46cb-8c9b-bc95d94a2254' AND d.achievement_id='041c8d66-5280-40b9-abdc-7b18202b684a' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='d392b133-d929-46cb-8c9b-bc95d94a2254' WHERE gt.achievement_id='041c8d66-5280-40b9-abdc-7b18202b684a' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='d392b133-d929-46cb-8c9b-bc95d94a2254');
DELETE FROM glossary_topics WHERE achievement_id='041c8d66-5280-40b9-abdc-7b18202b684a';
UPDATE glossary SET achievement_id='d392b133-d929-46cb-8c9b-bc95d94a2254' WHERE achievement_id='041c8d66-5280-40b9-abdc-7b18202b684a';
UPDATE achievements SET is_active=false WHERE id='041c8d66-5280-40b9-abdc-7b18202b684a';

-- Industry Foundations: keep active 5d104354-94a6-4f2b-bc2c-e49fe2b39da4 (was 46), merge draft 681cb58c-4a8b-470d-b37c-f9d1ca124c01 (was 23)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='5d104354-94a6-4f2b-bc2c-e49fe2b39da4' AND d.achievement_id='681cb58c-4a8b-470d-b37c-f9d1ca124c01' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='5d104354-94a6-4f2b-bc2c-e49fe2b39da4' WHERE gt.achievement_id='681cb58c-4a8b-470d-b37c-f9d1ca124c01' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='5d104354-94a6-4f2b-bc2c-e49fe2b39da4');
DELETE FROM glossary_topics WHERE achievement_id='681cb58c-4a8b-470d-b37c-f9d1ca124c01';
UPDATE glossary SET achievement_id='5d104354-94a6-4f2b-bc2c-e49fe2b39da4' WHERE achievement_id='681cb58c-4a8b-470d-b37c-f9d1ca124c01';
UPDATE achievements SET is_active=false WHERE id='681cb58c-4a8b-470d-b37c-f9d1ca124c01';

-- MIDI: keep active e9807c40-c86f-47e9-b15f-4f5acb609f55 (was 58), merge draft 575d5f16-29f9-49fe-bd09-20d7a7253e5c (was 73)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='e9807c40-c86f-47e9-b15f-4f5acb609f55' AND d.achievement_id='575d5f16-29f9-49fe-bd09-20d7a7253e5c' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='e9807c40-c86f-47e9-b15f-4f5acb609f55' WHERE gt.achievement_id='575d5f16-29f9-49fe-bd09-20d7a7253e5c' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='e9807c40-c86f-47e9-b15f-4f5acb609f55');
DELETE FROM glossary_topics WHERE achievement_id='575d5f16-29f9-49fe-bd09-20d7a7253e5c';
UPDATE glossary SET achievement_id='e9807c40-c86f-47e9-b15f-4f5acb609f55' WHERE achievement_id='575d5f16-29f9-49fe-bd09-20d7a7253e5c';
UPDATE achievements SET is_active=false WHERE id='575d5f16-29f9-49fe-bd09-20d7a7253e5c';

-- Music Entrepreneurship: keep active 14eb6897-783c-4429-97d5-e288b47c01aa (was 82), merge draft ecf9ca06-dd0c-4417-b8b3-4b0015839729 (was 68)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='14eb6897-783c-4429-97d5-e288b47c01aa' AND d.achievement_id='ecf9ca06-dd0c-4417-b8b3-4b0015839729' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='14eb6897-783c-4429-97d5-e288b47c01aa' WHERE gt.achievement_id='ecf9ca06-dd0c-4417-b8b3-4b0015839729' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='14eb6897-783c-4429-97d5-e288b47c01aa');
DELETE FROM glossary_topics WHERE achievement_id='ecf9ca06-dd0c-4417-b8b3-4b0015839729';
UPDATE glossary SET achievement_id='14eb6897-783c-4429-97d5-e288b47c01aa' WHERE achievement_id='ecf9ca06-dd0c-4417-b8b3-4b0015839729';
UPDATE achievements SET is_active=false WHERE id='ecf9ca06-dd0c-4417-b8b3-4b0015839729';

-- Plugins & Virtual Instruments: keep active af40f73e-7316-43ea-a1e2-faa8c7cadbfb (was 300), merge draft 13e902c2-dcd5-4a12-84f7-0ee8873df936 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='af40f73e-7316-43ea-a1e2-faa8c7cadbfb' AND d.achievement_id='13e902c2-dcd5-4a12-84f7-0ee8873df936' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='af40f73e-7316-43ea-a1e2-faa8c7cadbfb' WHERE gt.achievement_id='13e902c2-dcd5-4a12-84f7-0ee8873df936' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='af40f73e-7316-43ea-a1e2-faa8c7cadbfb');
DELETE FROM glossary_topics WHERE achievement_id='13e902c2-dcd5-4a12-84f7-0ee8873df936';
UPDATE glossary SET achievement_id='af40f73e-7316-43ea-a1e2-faa8c7cadbfb' WHERE achievement_id='13e902c2-dcd5-4a12-84f7-0ee8873df936';
UPDATE achievements SET is_active=false WHERE id='13e902c2-dcd5-4a12-84f7-0ee8873df936';

-- Portfolio Development: keep active 2e29b1bc-bb30-4663-ab70-179da90800a5 (was 44), merge draft 130626bc-c5e5-46c6-8d12-d32a73bd55f8 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='2e29b1bc-bb30-4663-ab70-179da90800a5' AND d.achievement_id='130626bc-c5e5-46c6-8d12-d32a73bd55f8' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='2e29b1bc-bb30-4663-ab70-179da90800a5' WHERE gt.achievement_id='130626bc-c5e5-46c6-8d12-d32a73bd55f8' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='2e29b1bc-bb30-4663-ab70-179da90800a5');
DELETE FROM glossary_topics WHERE achievement_id='130626bc-c5e5-46c6-8d12-d32a73bd55f8';
UPDATE glossary SET achievement_id='2e29b1bc-bb30-4663-ab70-179da90800a5' WHERE achievement_id='130626bc-c5e5-46c6-8d12-d32a73bd55f8';
UPDATE achievements SET is_active=false WHERE id='130626bc-c5e5-46c6-8d12-d32a73bd55f8';

-- Professional Audio Safety: keep active eebac0e9-c48a-49c5-8c71-6e43d9bee2ee (was 96), merge draft e5451add-87f8-47f0-ba06-9a53d70bebe9 (was 24)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='eebac0e9-c48a-49c5-8c71-6e43d9bee2ee' AND d.achievement_id='e5451add-87f8-47f0-ba06-9a53d70bebe9' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='eebac0e9-c48a-49c5-8c71-6e43d9bee2ee' WHERE gt.achievement_id='e5451add-87f8-47f0-ba06-9a53d70bebe9' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='eebac0e9-c48a-49c5-8c71-6e43d9bee2ee');
DELETE FROM glossary_topics WHERE achievement_id='e5451add-87f8-47f0-ba06-9a53d70bebe9';
UPDATE glossary SET achievement_id='eebac0e9-c48a-49c5-8c71-6e43d9bee2ee' WHERE achievement_id='e5451add-87f8-47f0-ba06-9a53d70bebe9';
UPDATE achievements SET is_active=false WHERE id='e5451add-87f8-47f0-ba06-9a53d70bebe9';

-- Project Management: keep active ca3d3ca8-9538-46a5-b360-3149c4c09e83 (was 90), merge draft 7106239e-6942-4d98-b7f9-847d6c533d08 (was 45)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='ca3d3ca8-9538-46a5-b360-3149c4c09e83' AND d.achievement_id='7106239e-6942-4d98-b7f9-847d6c533d08' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='ca3d3ca8-9538-46a5-b360-3149c4c09e83' WHERE gt.achievement_id='7106239e-6942-4d98-b7f9-847d6c533d08' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='ca3d3ca8-9538-46a5-b360-3149c4c09e83');
DELETE FROM glossary_topics WHERE achievement_id='7106239e-6942-4d98-b7f9-847d6c533d08';
UPDATE glossary SET achievement_id='ca3d3ca8-9538-46a5-b360-3149c4c09e83' WHERE achievement_id='7106239e-6942-4d98-b7f9-847d6c533d08';
UPDATE achievements SET is_active=false WHERE id='7106239e-6942-4d98-b7f9-847d6c533d08';

-- RF Wireless Systems: keep active 53fae3ee-1dad-4d80-a355-9d126cad2720 (was 53), merge draft 173a5d7e-a84d-4b90-9038-81d5ad73f08a (was 104)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='53fae3ee-1dad-4d80-a355-9d126cad2720' AND d.achievement_id='173a5d7e-a84d-4b90-9038-81d5ad73f08a' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='53fae3ee-1dad-4d80-a355-9d126cad2720' WHERE gt.achievement_id='173a5d7e-a84d-4b90-9038-81d5ad73f08a' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='53fae3ee-1dad-4d80-a355-9d126cad2720');
DELETE FROM glossary_topics WHERE achievement_id='173a5d7e-a84d-4b90-9038-81d5ad73f08a';
UPDATE glossary SET achievement_id='53fae3ee-1dad-4d80-a355-9d126cad2720' WHERE achievement_id='173a5d7e-a84d-4b90-9038-81d5ad73f08a';
UPDATE achievements SET is_active=false WHERE id='173a5d7e-a84d-4b90-9038-81d5ad73f08a';

-- Signal Path & Levels: keep active 0377f51c-fec2-4053-8a9e-1ef6349a1136 (was 96), merge draft 544770a6-1d5b-4777-8772-ac562c0d3539 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='0377f51c-fec2-4053-8a9e-1ef6349a1136' AND d.achievement_id='544770a6-1d5b-4777-8772-ac562c0d3539' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='0377f51c-fec2-4053-8a9e-1ef6349a1136' WHERE gt.achievement_id='544770a6-1d5b-4777-8772-ac562c0d3539' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='0377f51c-fec2-4053-8a9e-1ef6349a1136');
DELETE FROM glossary_topics WHERE achievement_id='544770a6-1d5b-4777-8772-ac562c0d3539';
UPDATE glossary SET achievement_id='0377f51c-fec2-4053-8a9e-1ef6349a1136' WHERE achievement_id='544770a6-1d5b-4777-8772-ac562c0d3539';
UPDATE achievements SET is_active=false WHERE id='544770a6-1d5b-4777-8772-ac562c0d3539';

-- Sound & Acoustics: keep active 595c0857-5afa-4b6a-a0bb-fdea84ae2a8c (was 203), merge draft cf8ef23a-a16a-4291-82ce-756e9ae1bd36 (was 24)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='595c0857-5afa-4b6a-a0bb-fdea84ae2a8c' AND d.achievement_id='cf8ef23a-a16a-4291-82ce-756e9ae1bd36' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='595c0857-5afa-4b6a-a0bb-fdea84ae2a8c' WHERE gt.achievement_id='cf8ef23a-a16a-4291-82ce-756e9ae1bd36' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='595c0857-5afa-4b6a-a0bb-fdea84ae2a8c');
DELETE FROM glossary_topics WHERE achievement_id='cf8ef23a-a16a-4291-82ce-756e9ae1bd36';
UPDATE glossary SET achievement_id='595c0857-5afa-4b6a-a0bb-fdea84ae2a8c' WHERE achievement_id='cf8ef23a-a16a-4291-82ce-756e9ae1bd36';
UPDATE achievements SET is_active=false WHERE id='cf8ef23a-a16a-4291-82ce-756e9ae1bd36';

-- System Maintenance: keep active 3822d771-c2cb-4924-a69f-626dec465694 (was 45), merge draft e2979cc0-a917-44e7-8fea-c223a9eb30e9 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='3822d771-c2cb-4924-a69f-626dec465694' AND d.achievement_id='e2979cc0-a917-44e7-8fea-c223a9eb30e9' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='3822d771-c2cb-4924-a69f-626dec465694' WHERE gt.achievement_id='e2979cc0-a917-44e7-8fea-c223a9eb30e9' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='3822d771-c2cb-4924-a69f-626dec465694');
DELETE FROM glossary_topics WHERE achievement_id='e2979cc0-a917-44e7-8fea-c223a9eb30e9';
UPDATE glossary SET achievement_id='3822d771-c2cb-4924-a69f-626dec465694' WHERE achievement_id='e2979cc0-a917-44e7-8fea-c223a9eb30e9';
UPDATE achievements SET is_active=false WHERE id='e2979cc0-a917-44e7-8fea-c223a9eb30e9';

-- Vacuum Tubes: keep active e7fe45bf-6112-4976-8ad0-7870e935e510 (was 85), merge draft 3283d1e2-3e1b-4d00-9f52-5df84039ca7f (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='e7fe45bf-6112-4976-8ad0-7870e935e510' AND d.achievement_id='3283d1e2-3e1b-4d00-9f52-5df84039ca7f' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='e7fe45bf-6112-4976-8ad0-7870e935e510' WHERE gt.achievement_id='3283d1e2-3e1b-4d00-9f52-5df84039ca7f' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='e7fe45bf-6112-4976-8ad0-7870e935e510');
DELETE FROM glossary_topics WHERE achievement_id='3283d1e2-3e1b-4d00-9f52-5df84039ca7f';
UPDATE glossary SET achievement_id='e7fe45bf-6112-4976-8ad0-7870e935e510' WHERE achievement_id='3283d1e2-3e1b-4d00-9f52-5df84039ca7f';
UPDATE achievements SET is_active=false WHERE id='3283d1e2-3e1b-4d00-9f52-5df84039ca7f';

-- Vehicle Audio: keep active 27e990bb-b59a-452c-b34e-71ea9b0931a8 (was 78), merge draft f7a42023-78ba-476f-93ad-9a87d4e42ff4 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='27e990bb-b59a-452c-b34e-71ea9b0931a8' AND d.achievement_id='f7a42023-78ba-476f-93ad-9a87d4e42ff4' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='27e990bb-b59a-452c-b34e-71ea9b0931a8' WHERE gt.achievement_id='f7a42023-78ba-476f-93ad-9a87d4e42ff4' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='27e990bb-b59a-452c-b34e-71ea9b0931a8');
DELETE FROM glossary_topics WHERE achievement_id='f7a42023-78ba-476f-93ad-9a87d4e42ff4';
UPDATE glossary SET achievement_id='27e990bb-b59a-452c-b34e-71ea9b0931a8' WHERE achievement_id='f7a42023-78ba-476f-93ad-9a87d4e42ff4';
UPDATE achievements SET is_active=false WHERE id='f7a42023-78ba-476f-93ad-9a87d4e42ff4';

-- Workplace Skills: keep active 036e7ed0-94de-4228-9b97-4842a9f7fe95 (was 51), merge draft 89bd470d-e7fb-464b-874c-753f1d1db912 (was 0)
UPDATE glossary_topics a SET is_primary=true FROM glossary_topics d WHERE a.achievement_id='036e7ed0-94de-4228-9b97-4842a9f7fe95' AND d.achievement_id='89bd470d-e7fb-464b-874c-753f1d1db912' AND a.glossary_id=d.glossary_id AND d.is_primary;
UPDATE glossary_topics gt SET achievement_id='036e7ed0-94de-4228-9b97-4842a9f7fe95' WHERE gt.achievement_id='89bd470d-e7fb-464b-874c-753f1d1db912' AND NOT EXISTS (SELECT 1 FROM glossary_topics x WHERE x.glossary_id=gt.glossary_id AND x.achievement_id='036e7ed0-94de-4228-9b97-4842a9f7fe95');
DELETE FROM glossary_topics WHERE achievement_id='89bd470d-e7fb-464b-874c-753f1d1db912';
UPDATE glossary SET achievement_id='036e7ed0-94de-4228-9b97-4842a9f7fe95' WHERE achievement_id='89bd470d-e7fb-464b-874c-753f1d1db912';
UPDATE achievements SET is_active=false WHERE id='89bd470d-e7fb-464b-874c-753f1d1db912';

COMMIT;

-- VERIFY (expect 0 for both):
SELECT count(*) AS draft_links_remaining FROM glossary_topics WHERE achievement_id IN ('eb10acd3-609a-47a9-9d4e-43d05db56d63','fa3fa679-cafb-4478-9175-6beb06f9cb61','75ed360a-ffcf-4288-9a00-49f7d283503c','f482144c-0f68-43c2-b62d-63c945a431bb','7294afe5-9178-4413-be55-e74aa9f84942','cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551','7d098dac-6bc4-4eb6-8942-e45c9e834150','8db281ce-61c5-4c0f-b9e2-c83fa779792b','873348dd-c90c-4525-aeb8-81c51488044c','ff5f3513-2fb7-4c13-9d2b-18e4374169a6','d42dcf1d-a730-488c-9633-28e1218563a4','eba54a3f-0ecc-4acf-a18d-2df0353a50f9','07df90cd-38fa-4737-8b35-b63864c78de1','041c8d66-5280-40b9-abdc-7b18202b684a','681cb58c-4a8b-470d-b37c-f9d1ca124c01','575d5f16-29f9-49fe-bd09-20d7a7253e5c','ecf9ca06-dd0c-4417-b8b3-4b0015839729','13e902c2-dcd5-4a12-84f7-0ee8873df936','130626bc-c5e5-46c6-8d12-d32a73bd55f8','e5451add-87f8-47f0-ba06-9a53d70bebe9','7106239e-6942-4d98-b7f9-847d6c533d08','173a5d7e-a84d-4b90-9038-81d5ad73f08a','544770a6-1d5b-4777-8772-ac562c0d3539','cf8ef23a-a16a-4291-82ce-756e9ae1bd36','e2979cc0-a917-44e7-8fea-c223a9eb30e9','3283d1e2-3e1b-4d00-9f52-5df84039ca7f','f7a42023-78ba-476f-93ad-9a87d4e42ff4','89bd470d-e7fb-464b-874c-753f1d1db912');
SELECT count(*) AS draft_glossary_refs_remaining FROM glossary WHERE achievement_id IN ('eb10acd3-609a-47a9-9d4e-43d05db56d63','fa3fa679-cafb-4478-9175-6beb06f9cb61','75ed360a-ffcf-4288-9a00-49f7d283503c','f482144c-0f68-43c2-b62d-63c945a431bb','7294afe5-9178-4413-be55-e74aa9f84942','cd81ec36-a20d-42a1-9e2d-fc6a8ff6a551','7d098dac-6bc4-4eb6-8942-e45c9e834150','8db281ce-61c5-4c0f-b9e2-c83fa779792b','873348dd-c90c-4525-aeb8-81c51488044c','ff5f3513-2fb7-4c13-9d2b-18e4374169a6','d42dcf1d-a730-488c-9633-28e1218563a4','eba54a3f-0ecc-4acf-a18d-2df0353a50f9','07df90cd-38fa-4737-8b35-b63864c78de1','041c8d66-5280-40b9-abdc-7b18202b684a','681cb58c-4a8b-470d-b37c-f9d1ca124c01','575d5f16-29f9-49fe-bd09-20d7a7253e5c','ecf9ca06-dd0c-4417-b8b3-4b0015839729','13e902c2-dcd5-4a12-84f7-0ee8873df936','130626bc-c5e5-46c6-8d12-d32a73bd55f8','e5451add-87f8-47f0-ba06-9a53d70bebe9','7106239e-6942-4d98-b7f9-847d6c533d08','173a5d7e-a84d-4b90-9038-81d5ad73f08a','544770a6-1d5b-4777-8772-ac562c0d3539','cf8ef23a-a16a-4291-82ce-756e9ae1bd36','e2979cc0-a917-44e7-8fea-c223a9eb30e9','3283d1e2-3e1b-4d00-9f52-5df84039ca7f','f7a42023-78ba-476f-93ad-9a87d4e42ff4','89bd470d-e7fb-464b-874c-753f1d1db912');