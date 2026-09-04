-- REMOVE V1 REMNANTS · STAGE 10 · rewrite the glossary importer + validator
--
-- THIS IS THE HIGHEST-RISK FILE IN THE PACKAGE. Read the README section
-- "Stage 10 - why this one first and why it is dangerous" before running.
--
-- What was wrong
--   Both functions resolved a topic as:
--       courses.code = <input>.course_code   ->   achievements.course_id = that
--   Only 51 rows in `achievements` have a course_id and all 51 are v1. So the
--   importer could NEVER tag a v3 topic; it silently wrote achievement_id = NULL
--   and course_id = NULL, and its ON CONFLICT (term) DO UPDATE overwrote every
--   column of the matching curated row. One bad payload could blank the topic
--   tag on any of 26,847 rows.
--
-- What this rewrite changes
--   1. Topics resolve by v3 identity: achievements.global_sequence, scoped to
--      curriculum_version_id = a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72.
--      Input key: "global_sequence" (integer). "achievement_name" is still
--      accepted as a secondary check but is no longer the resolver.
--   2. `course_code` in a payload is now a hard ERROR, not a silent mis-map.
--      Old v1 payloads fail loudly instead of quietly blanking rows.
--   3. An unresolvable global_sequence is a hard ERROR. The old code carried on
--      with NULL.
--   4. glossary.course_id is no longer written (Stage 50 drops the column).
--   5. ON CONFLICT DO UPDATE is now COALESCE-guarded: a key absent from the
--      payload leaves the curated value alone instead of nulling it, and
--      achievement_id is never overwritten with NULL.
--      >>> This is a deliberate behaviour change. It is the mitigation for the
--          "silently rewrites 26,847 curated rows" hazard. <<<
--   6. Admin gate, media handling, extra_definitions rejection and the return
--      shape are unchanged.
--
-- Idempotent: CREATE OR REPLACE. Re-running is a no-op.

BEGIN;

DO $guard$
BEGIN
  IF to_regclass('public.v1remnants_func_backup_20260903') IS NULL THEN
    RAISE EXCEPTION 'refusing to run: 05_BACKUP has not been run';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.v1remnants_func_backup_20260903
                 WHERE proname = 'bulk_import_glossary') THEN
    RAISE EXCEPTION 'refusing to run: bulk_import_glossary source is not in the backup';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.v1remnants_func_backup_20260903
                 WHERE proname = 'validate_glossary') THEN
    RAISE EXCEPTION 'refusing to run: validate_glossary source is not in the backup';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.curriculum_versions
                 WHERE id = 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72') THEN
    RAISE EXCEPTION 'refusing to run: the v3 curriculum version row is missing';
  END IF;
END $guard$;

------------------------------------------------------------------ validate_glossary
CREATE OR REPLACE FUNCTION public.validate_glossary(p_rows jsonb)
 RETURNS TABLE(row_index integer, term text, severity text, message text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r jsonb; i int := 0; v_gs int; v_ach uuid; v_name text;
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_only'; END IF;
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    i := i + 1;

    IF COALESCE(r->>'term','') = ''       THEN RETURN QUERY SELECT i, r->>'term','error','missing term'; END IF;
    IF COALESCE(r->>'definition','') = '' THEN RETURN QUERY SELECT i, r->>'term','error','missing definition'; END IF;

    -- v1 payload shape is retired.
    IF r ? 'course_code' THEN
      RETURN QUERY SELECT i, r->>'term','error',
        'course_code is retired (v1). Use global_sequence to name the v3 topic.';
    END IF;

    IF r ? 'global_sequence' THEN
      IF jsonb_typeof(r->'global_sequence') <> 'number' THEN
        RETURN QUERY SELECT i, r->>'term','error','global_sequence must be a number';
      ELSE
        v_gs := (r->>'global_sequence')::int;
        SELECT a.id, a.name INTO v_ach, v_name
        FROM public.achievements a
        WHERE a.curriculum_version_id = c_v3 AND a.global_sequence = v_gs
        LIMIT 1;
        IF v_ach IS NULL THEN
          RETURN QUERY SELECT i, r->>'term','error',
            format('unknown v3 global_sequence %s', v_gs);
        ELSIF (r ? 'achievement_name')
              AND lower(btrim(r->>'achievement_name')) <> lower(btrim(v_name)) THEN
          RETURN QUERY SELECT i, r->>'term','warning',
            format('achievement_name "%s" does not match gs%s ("%s") - gs wins',
                   r->>'achievement_name', v_gs, v_name);
        END IF;
      END IF;
    ELSIF r ? 'achievement_name' THEN
      RETURN QUERY SELECT i, r->>'term','error',
        'achievement_name given without global_sequence - topics resolve by global_sequence only';
    END IF;

    IF (r ? 'difficulty') AND (r->>'difficulty') NOT IN ('beginner','intermediate','advanced') THEN
      RETURN QUERY SELECT i, r->>'term','warning','difficulty not in enum';
    END IF;
  END LOOP;
END; $function$;

--------------------------------------------------------------- bulk_import_glossary
CREATE OR REPLACE FUNCTION public.bulk_import_glossary(p_rows jsonb)
 RETURNS TABLE(terms_upserted integer, definitions_added integer, media_added integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r jsonb; v_gid uuid; v_ach uuid; v_gs int; m jsonb;
  c_terms int := 0; c_defs int := 0; c_media int := 0;
  c_v3 constant uuid := 'a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72';
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_only'; END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    IF jsonb_array_length(COALESCE(r->'extra_definitions','[]'::jsonb)) > 0 THEN
      RAISE EXCEPTION 'extra_definitions is no longer supported (the alternate-definitions table was removed 2026-08-30); term=%', r->>'term';
    END IF;

    -- Fail loudly on the retired v1 shape rather than silently mis-tagging.
    IF r ? 'course_code' THEN
      RAISE EXCEPTION 'course_code is retired (v1 curriculum). Use global_sequence; term=%', r->>'term';
    END IF;

    v_ach := NULL;
    IF r ? 'global_sequence' THEN
      IF jsonb_typeof(r->'global_sequence') <> 'number' THEN
        RAISE EXCEPTION 'global_sequence must be a number; term=%', r->>'term';
      END IF;
      v_gs := (r->>'global_sequence')::int;
      SELECT a.id INTO v_ach
      FROM public.achievements a
      WHERE a.curriculum_version_id = c_v3 AND a.global_sequence = v_gs
      LIMIT 1;
      IF v_ach IS NULL THEN
        RAISE EXCEPTION 'unknown v3 global_sequence %; term=%', v_gs, r->>'term';
      END IF;
    ELSIF r ? 'achievement_name' THEN
      RAISE EXCEPTION 'achievement_name without global_sequence is not a resolver; term=%', r->>'term';
    END IF;

    INSERT INTO public.glossary
      (term, definition, plain_english, achievement_id, purpose_function,
       practical_application, category, difficulty, related_terms, common_mistakes, scenario_contexts)
    VALUES (
      r->>'term', r->>'definition', r->>'plain_english', v_ach,
      r->>'purpose_function', r->>'practical_application', r->>'category', r->>'difficulty',
      CASE WHEN r ? 'related_terms'     THEN ARRAY(SELECT jsonb_array_elements_text(r->'related_terms'))     END,
      CASE WHEN r ? 'common_mistakes'   THEN ARRAY(SELECT jsonb_array_elements_text(r->'common_mistakes'))   END,
      CASE WHEN r ? 'scenario_contexts' THEN ARRAY(SELECT jsonb_array_elements_text(r->'scenario_contexts')) END)
    ON CONFLICT (term) DO UPDATE SET
      -- COALESCE guard: an absent key never blanks a curated value.
      definition            = COALESCE(EXCLUDED.definition,            glossary.definition),
      plain_english         = COALESCE(EXCLUDED.plain_english,         glossary.plain_english),
      achievement_id        = COALESCE(EXCLUDED.achievement_id,        glossary.achievement_id),
      purpose_function      = COALESCE(EXCLUDED.purpose_function,      glossary.purpose_function),
      practical_application = COALESCE(EXCLUDED.practical_application, glossary.practical_application),
      category              = COALESCE(EXCLUDED.category,              glossary.category),
      difficulty            = COALESCE(EXCLUDED.difficulty,            glossary.difficulty),
      related_terms         = COALESCE(EXCLUDED.related_terms,         glossary.related_terms),
      common_mistakes       = COALESCE(EXCLUDED.common_mistakes,       glossary.common_mistakes),
      scenario_contexts     = COALESCE(EXCLUDED.scenario_contexts,     glossary.scenario_contexts)
    RETURNING id INTO v_gid;
    c_terms := c_terms + 1;

    FOR m IN SELECT * FROM jsonb_array_elements(COALESCE(r->'media','[]'::jsonb)) LOOP
      INSERT INTO public.glossary_media (glossary_id, media_type, url, caption)
      VALUES (v_gid, m->>'media_type', m->>'url', m->>'caption');
      c_media := c_media + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT c_terms, c_defs, c_media;
END; $function$;

COMMIT;

-- Read-back: neither function should mention `courses` any more.
SELECT p.proname,
       CASE WHEN regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* '\mcourses\M' OR regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'), '--[^\n]*', '', 'g') ~* 'course_code'
            THEN 'FAIL - still v1' ELSE 'PASS' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('bulk_import_glossary','validate_glossary')
ORDER BY p.proname;
