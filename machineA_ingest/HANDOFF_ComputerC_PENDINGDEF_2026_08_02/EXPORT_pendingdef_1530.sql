-- Run in the Supabase SQL editor, then "Download CSV".
-- Save as ComputerC_PENDINGDEF_terms.csv into the handoff folder (feeds build_packets.py).
-- Scope = the 1,530 rows whose definition is still the "(pending)" placeholder but whose
-- other 7 content fields are already authored. Excludes the 152 fill-empty holds
-- (those also have empty other-fields, so the AND-clauses below drop them).
SELECT
  g.id,
  g.term,
  a.name                         AS primary_topic,
  'PENDINGDEF_2026_08_02'        AS source_batch,
  'definition'                   AS authored_fields,   -- author ONLY the definition
  g.difficulty,
  g.plain_english                AS existing_plain_english,     -- anchor: write the definition consistent with these
  g.purpose_function             AS existing_purpose_function,
  g.practical_application        AS existing_practical_application,
  g.category                     AS existing_category,
  array_to_string(g.related_terms,     ' | ') AS existing_related_terms,
  array_to_string(g.common_mistakes,   ' | ') AS existing_common_mistakes,
  array_to_string(g.scenario_contexts, ' | ') AS existing_scenario_contexts,
  g.plain_english                AS concept_hint       -- packet pointer (build_packets carries this)
FROM glossary g
LEFT JOIN glossary_topics gt ON gt.glossary_id=g.id AND gt.is_primary
LEFT JOIN achievements a     ON a.id = gt.achievement_id
WHERE g.definition = '(pending)'
  AND g.plain_english        IS NOT NULL AND btrim(g.plain_english)<>''
  AND g.purpose_function     IS NOT NULL AND btrim(g.purpose_function)<>''
  AND g.practical_application IS NOT NULL AND btrim(g.practical_application)<>''
  AND g.category             IS NOT NULL AND btrim(g.category)<>''
  AND g.related_terms        IS NOT NULL AND cardinality(g.related_terms)>0
  AND g.common_mistakes      IS NOT NULL AND cardinality(g.common_mistakes)>0
  AND g.scenario_contexts    IS NOT NULL AND cardinality(g.scenario_contexts)>0
ORDER BY a.name, g.term;
