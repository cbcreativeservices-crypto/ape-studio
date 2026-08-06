BEGIN;
-- Absorb "Commercial 70/100V Systems" + "Distributed Audio Systems" (16 terms) into best-fit topics (2026-08-03)
-- Sources: a2a064a0 (Commercial 70/100V), 873348dd (Distributed Audio). Backup first.
CREATE TABLE IF NOT EXISTS _backup_commdist_glossary AS
  SELECT g.* FROM glossary g JOIN glossary_topics gt ON gt.glossary_id=g.id
  WHERE gt.achievement_id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c');
CREATE TABLE IF NOT EXISTS _backup_commdist_links AS
  SELECT gt.* FROM glossary_topics gt
  WHERE gt.achievement_id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c');

-- helper: move by term from either source topic to target
-- TARGET = Audio System Design (7294afe5)
UPDATE glossary g SET achievement_id='7294afe5-9178-4413-be55-e74aa9f84942', category='Audio System Design'
 WHERE g.term IN ('Approximate Line Current','Loudspeaker Tap Impedance','Parallel Loudspeaker Impedance Approximation','Recommended Amplifier Capacity with Design Headroom','Series Loudspeaker Impedance Approximation','Tap Power from Line Voltage and Impedance','Total Distributed-System Tap Power','constant-voltage (70V / 100V) distribution','Zone / Multi-Zone Audio','Music Bed','Base')
   AND g.achievement_id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c');
UPDATE glossary_topics gt SET achievement_id='7294afe5-9178-4413-be55-e74aa9f84942'
 FROM glossary g WHERE g.id=gt.glossary_id AND gt.achievement_id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c')
   AND g.term IN ('Approximate Line Current','Loudspeaker Tap Impedance','Parallel Loudspeaker Impedance Approximation','Recommended Amplifier Capacity with Design Headroom','Series Loudspeaker Impedance Approximation','Tap Power from Line Voltage and Impedance','Total Distributed-System Tap Power','constant-voltage (70V / 100V) distribution','Zone / Multi-Zone Audio','Music Bed','Base');

-- TARGET = Clocking, Redundancy & Network Management (979cbad6)
UPDATE glossary g SET achievement_id='979cbad6-bdb7-4504-a978-245950a62fed', category='Clocking, Redundancy & Network Management'
 WHERE g.term IN ('AVB (Audio Video Bridging)','Milan','Ravenna','RTP (Real-time Transport Protocol)')
   AND g.achievement_id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c');
UPDATE glossary_topics gt SET achievement_id='979cbad6-bdb7-4504-a978-245950a62fed'
 FROM glossary g WHERE g.id=gt.glossary_id AND gt.achievement_id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c')
   AND g.term IN ('AVB (Audio Video Bridging)','Milan','Ravenna','RTP (Real-time Transport Protocol)');

-- TARGET = Connectors & Plugs (7600990b)
UPDATE glossary g SET achievement_id='7600990b-2532-4e38-a488-1dbfd0350539', category='Connectors & Plugs'
 WHERE g.term='HDMI (High-Definition Multimedia Interface)'
   AND g.achievement_id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c');
UPDATE glossary_topics gt SET achievement_id='7600990b-2532-4e38-a488-1dbfd0350539'
 FROM glossary g WHERE g.id=gt.glossary_id AND gt.achievement_id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c')
   AND g.term='HDMI (High-Definition Multimedia Interface)';

-- retire the two now-empty source topics
UPDATE achievements SET is_active=false WHERE id IN ('a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c','873348dd-c90c-4525-aeb8-81c51488044c');

-- VERIFY
SELECT
 (SELECT count(*) FROM glossary_topics WHERE achievement_id='a2a064a0-fbd3-4dd8-8cd3-7f0b819b9d3c') AS comm_left,
 (SELECT count(*) FROM glossary_topics WHERE achievement_id='873348dd-c90c-4525-aeb8-81c51488044c') AS dist_left,
 (SELECT count(*) FROM glossary_topics gt JOIN glossary g ON g.id=gt.glossary_id WHERE gt.achievement_id='7294afe5-9178-4413-be55-e74aa9f84942' AND g.term IN ('Music Bed','Base','Zone / Multi-Zone Audio')) AS asd_check,
 (SELECT count(*) FROM glossary_topics WHERE achievement_id='979cbad6-bdb7-4504-a978-245950a62fed') AS net_topic_total;
COMMIT;
