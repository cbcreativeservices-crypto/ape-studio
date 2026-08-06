-- Run in the Supabase SQL editor, then "Download CSV".
-- Produces the fill-empty worklist for Computer C: 657 existing rows that have a
-- definition but are missing some/all of the other 7 fields.
-- Save the CSV as ComputerC_FILLEMPTY_terms.csv into the handoff folder.
SELECT
  g.id,
  g.term,
  a.name                              AS primary_topic,
  g.difficulty,
  array_to_string(ARRAY_REMOVE(ARRAY[
    CASE WHEN g.plain_english        IS NULL OR btrim(g.plain_english)=''        THEN 'plain_english' END,
    CASE WHEN g.purpose_function      IS NULL OR btrim(g.purpose_function)=''      THEN 'purpose_function' END,
    CASE WHEN g.practical_application IS NULL OR btrim(g.practical_application)='' THEN 'practical_application' END,
    CASE WHEN g.category              IS NULL OR btrim(g.category)=''              THEN 'category' END,
    CASE WHEN g.related_terms         IS NULL OR cardinality(g.related_terms)=0    THEN 'related_terms' END,
    CASE WHEN g.common_mistakes       IS NULL OR cardinality(g.common_mistakes)=0  THEN 'common_mistakes' END,
    CASE WHEN g.scenario_contexts     IS NULL OR cardinality(g.scenario_contexts)=0 THEN 'scenario_contexts' END
  ], NULL), ';')                      AS empty_fields,
  g.definition                        AS existing_definition
FROM glossary g
LEFT JOIN glossary_topics gt ON gt.glossary_id=g.id AND gt.is_primary
LEFT JOIN achievements a     ON a.id = gt.achievement_id
WHERE (g.plain_english        IS NULL OR btrim(g.plain_english)='')
   OR (g.purpose_function      IS NULL OR btrim(g.purpose_function)='')
   OR (g.practical_application IS NULL OR btrim(g.practical_application)='')
   OR (g.category              IS NULL OR btrim(g.category)='')
   OR (g.related_terms         IS NULL OR cardinality(g.related_terms)=0)
   OR (g.common_mistakes       IS NULL OR cardinality(g.common_mistakes)=0)
   OR (g.scenario_contexts     IS NULL OR cardinality(g.scenario_contexts)=0)
ORDER BY a.name, g.term;
