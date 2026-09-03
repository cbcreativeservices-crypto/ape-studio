-- 15_ROLLBACK_paywall_gate — put the Common Mistakes gate back exactly as it was.
--
-- Restores `glossary_study_v` verbatim from the definition captured by
-- 15_APPLY_paywall_gate.sql. Views hold no data, so this loses nothing.
--
-- Use it if the widened free tier is not what you wanted: after this runs,
-- signed-in non-members are back to Common Mistakes on gs 0 and 36 only,
-- which is 119 terms.
--
-- WARNING ON ORDERING. If you have already run 10_APPLY_convert_repoint (which
-- converts gs0 to 3060) or 30_APPLY_retire_mark (which deactivates gs36), then
-- restoring the old gate leaves it naming topics that no longer carry the
-- content, and non-members lose Common Mistakes ENTIRELY. In that case do not
-- roll back — edit the ARRAY in 15_APPLY to whatever you do want and re-run it.
-- This file warns about that but does not refuse, because only you can say
-- which behaviour you want.

BEGIN;

DO $$
DECLARE v_def text; v_converted boolean; v_retired boolean;
BEGIN
  SELECT definition INTO v_def
  FROM public.paywall_gate_viewdef_backup_20260903
  WHERE view_name = 'glossary_study_v';

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'cannot roll back: no captured definition for glossary_study_v';
  END IF;

  -- Warn if the topics the restored gate names are no longer the live ones.
  SELECT NOT EXISTS (SELECT 1 FROM public.achievements
                      WHERE global_sequence = 0 AND is_active)
    INTO v_converted;
  SELECT NOT EXISTS (SELECT 1 FROM public.achievements
                      WHERE global_sequence = 36 AND is_active)
    INTO v_retired;

  IF v_converted THEN
    RAISE WARNING 'gs0 is no longer an active topic — the restored gate will not match it';
  END IF;
  IF v_retired THEN
    RAISE WARNING 'gs36 is not an active topic — the restored gate will not match it';
  END IF;

  EXECUTE 'CREATE OR REPLACE VIEW public.glossary_study_v AS ' || v_def;
  RAISE NOTICE 'glossary_study_v restored from the 2026-09-03 backup';
END $$;

COMMIT;

SELECT pg_get_viewdef('public.glossary_study_v'::regclass, true) AS restored_definition;
