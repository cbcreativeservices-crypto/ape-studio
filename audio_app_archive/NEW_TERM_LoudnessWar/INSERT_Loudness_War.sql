-- AP&E glossary — NEW TERM: Loudness War. Paste into Supabase SQL editor and Run.
-- Inserts 1 glossary row + 3 topic assignments (primary Mastering Fundamentals & Chain).
-- Idempotent: ON CONFLICT guards prevent duplicates if re-run.
BEGIN;
INSERT INTO glossary (id, term, definition, plain_english, purpose_function, practical_application, category, related_terms, common_mistakes, scenario_contexts, difficulty, achievement_id)
VALUES (
 'e7fae1f3-44f4-4396-82e1-d844f9c5bc3d',
 $def$Loudness War$def$,
 $def$The Loudness War is the decades-long trend of mastering recorded music to progressively higher average loudness, chiefly by aggressive peak limiting, clipping and hypercompression that raise level while reducing dynamic range and crest factor, often introducing audible distortion. It was driven by the belief that a louder master sounds more impactful on radio and consumer playback; loudness-normalized streaming and broadcast delivery, which plays all programme back toward a common target measured per ITU-R BS.1770, has since removed that playback advantage and blunted the trend.$def$,
 $def$The loudness war is a long trend of making mastered music louder and louder. Engineers used heavy compression and limiting to push up the average level. But squashing a song this way shrinks its dynamics and can add distortion. Today, streaming apps turn loud songs down to a set level, so extra loudness no longer wins.$def$,
 $def$It describes and names the competitive push toward ever-louder masters so engineers can recognise, measure and avoid its side effects. Understanding it explains why modern mastering now targets a controlled loudness and preserved dynamic range rather than maximum level.$def$,
 $def$A mastering engineer checks integrated loudness (LUFS) and true peak against the destination's target and weighs added limiting against lost dynamic range, knowing an over-loud master will simply be turned down by a normalized platform and may sound flat or distorted next to a more dynamic one.$def$,
 $def$Mastering Concept$def$,
 ARRAY['LUFS', 'Dynamic Range', 'Crest Factor', 'Limiter', 'Loudness Normalization', 'True Peak']::text[],
 ARRAY['Believing a louder master always wins, when loudness-normalized streaming and broadcast turn every track toward a common target and erase that edge.', 'Pushing a brickwall limiter or clipper so hard that transients, punch and dynamic range are destroyed and distortion becomes audible.', 'Confusing peak level with loudness: a master can peak at 0 dBFS yet be quiet, while loudness is an average measured in LUFS per ITU-R BS.1770.', 'Mastering far above a platform target (around -14 LUFS for many streaming services) expecting more volume, when the service only turns the track back down.']::text[],
 ARRAY['Comparing two masters of the same song where the louder, more compressed version reveals reduced dynamic range and distortion on close listening.', 'Preparing a master for a streaming service that loudness-normalizes playback toward roughly -14 LUFS, so extra limiting yields no loudness gain.', 'Delivering audio for broadcast under EBU R128 (-23 LUFS) or ATSC A/85 (-24 LKFS), where a hyper-loud master must be re-levelled to meet the standard.', 'Reissuing or remastering older recordings and deciding how much dynamic range to restore versus match the loudness of competing releases.']::text[],
 'intermediate',
 '59ad0dd1-d2da-4067-ba31-93c84eaf69db'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO glossary_topics (glossary_id, achievement_id, is_primary, difficulty) VALUES ('e7fae1f3-44f4-4396-82e1-d844f9c5bc3d','59ad0dd1-d2da-4067-ba31-93c84eaf69db',true,'intermediate') ON CONFLICT DO NOTHING;
INSERT INTO glossary_topics (glossary_id, achievement_id, is_primary, difficulty) VALUES ('e7fae1f3-44f4-4396-82e1-d844f9c5bc3d','477dcca2-e9e1-4962-b820-d9d80c2fdcf7',false,'intermediate') ON CONFLICT DO NOTHING;  -- Loudness, Dynamics & QC
INSERT INTO glossary_topics (glossary_id, achievement_id, is_primary, difficulty) VALUES ('e7fae1f3-44f4-4396-82e1-d844f9c5bc3d','e6248e00-52b1-4f93-994d-57305e66e9af',false,'intermediate') ON CONFLICT DO NOTHING;  -- Broadcast Loudness & Compliance
COMMIT;

-- VERIFY (run after): expect term row + 3 topic rows, no placeholder.
SELECT g.term, g.difficulty, (SELECT count(*) FROM glossary_topics gt WHERE gt.glossary_id=g.id) AS topic_links, left(g.definition,60) AS def FROM glossary g WHERE g.id='e7fae1f3-44f4-4396-82e1-d844f9c5bc3d';
