-- Programs earn their credential the same way certificates do.
-- OWNER RULING 2026-09-22: "Yes — same rule as certificates."
--
-- ⛔ WHAT THIS PREVENTS. `evaluate_user_credentials` inserted **program**
-- credentials straight into `credential_awards` in BOTH branches of the
-- `certificate_requires_exam` flag. The comment explained why — the ruling had
-- been about certificates, and extending it to programs would change a second
-- thing nobody asked for. Reasonable in isolation, and it combined badly with
-- the other half of the flag.
--
-- The flag-false branch gates on four topic ids from a DRAFT/ARCHIVED
-- curriculum that nothing in the database has ever completed, so the whole
-- function returns early today and nothing is ever awarded. Flip the flag —
-- which is the launch plan — and that gate switches to the ACTIVE curriculum,
-- becomes satisfiable, and the program insert underneath starts firing.
--
-- Measured on production 2026-09-22 by running the function's own program
-- query as a SELECT: **7 program credentials to 1 account on the first status
-- write after the flip**, with no exam and no paid month. `credential_awards`
-- held 0 rows at the time. And because `start_final_exam` raises
-- `already_earned` when a credential_awards row exists, each of those learners
-- would then be locked out of the Final Exam for that program permanently.
--
-- THE FIX IS PARITY, NOT A NEW RULE. Certificates already branch
-- TRUE → credential_eligibility (sit the exam, then one paid month)
-- FALSE → credential_awards  (legacy behaviour, reproduced byte-for-byte)
-- Programs now do exactly the same. Nothing else changes.
--
-- The rest of the pipeline is already type-agnostic, so no other function
-- needs touching — verified before writing this:
--   • `start_final_exam` accepts 'certificate' AND 'program', gates on
--     `award_complete`, and never consults credential_eligibility
--   • `submit_final_exam` awards when the paid month is complete, else holds
--   • `release_pending_credentials` writes `r.award_type` straight through, so
--     a held PROGRAM paper releases on tenure exactly like a certificate
--
-- Net effect after the flip: finishing a program's topics makes you eligible.
-- The Final Exam and one complete paid month turn that into the award.

CREATE OR REPLACE FUNCTION public.evaluate_user_credentials(p_user uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_core boolean;
  v_requires_exam boolean;
BEGIN
  -- Which policy is live. Defaults FALSE: if the flag row or the whole table is
  -- missing for any reason, behave exactly as the app did before this change.
  SELECT coalesce((SELECT enabled FROM public.app_flags
                    WHERE key = 'certificate_requires_exam'), false)
    INTO v_requires_exam;

  IF v_requires_exam THEN
    -- THE CO-REQUISITES, READ FROM THE ACTIVE CURRICULUM (2026-09-18).
    --
    -- The hardcoded list below belongs to a DRAFT/ARCHIVED curriculum and can
    -- never be satisfied by a v3 learner. This asks the same question
    -- `award_required_topics` already asks, so it follows the curriculum
    -- instead of needing an edit every time one is published.
    --
    -- The lab proxy is included and MUST be: it is a standing requirement with
    -- no study methods, completed by mark_lab_complete, and it is how "required
    -- labs" enters the rule at all.
    SELECT NOT EXISTS (
      SELECT 1
        FROM award_standing_requirements asr
        JOIN curriculum_versions cv ON cv.id = asr.curriculum_version_id AND cv.status = 'active'
        LEFT JOIN student_achievement_progress sap
               ON sap.user_id = p_user AND sap.achievement_id = asr.achievement_id
       WHERE COALESCE(sap.status,'') <> 'complete'
    ) INTO v_core;
  ELSE
    -- requisites: Safety + Grounding + Workplace (draft) + Foundations lab (active) all complete
    -- UNCHANGED, and deliberately still the stale ids: this branch exists to
    -- reproduce today's behaviour exactly, including the fact that it does not
    -- fire for v3 users.
    SELECT (SELECT count(*) FROM student_achievement_progress p
            WHERE p.user_id=p_user AND p.status='complete'
              AND p.achievement_id IN (
                'e5451add-87f8-47f0-ba06-9a53d70bebe9',
                '041c8d66-5280-40b9-abdc-7b18202b684a',
                '89bd470d-e7fb-464b-874c-753f1d1db912',
                '7387db19-2fa5-4536-af25-25a5f725a484')) = 4
    INTO v_core;
  END IF;

  IF NOT v_core THEN RETURN; END IF;

  IF v_requires_exam THEN
    -- Finishing the topics makes you ELIGIBLE. The Final Exam and one complete
    -- paid month turn eligibility into an award.
    INSERT INTO credential_eligibility (user_id, credential_type, credential_id)
    SELECT p_user, 'certificate', c.id
    FROM certificates c
    WHERE c.is_active
      AND NOT EXISTS (SELECT 1 FROM certificate_topics ct WHERE ct.certificate_id=c.id
          AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                          WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=ct.achievement_id))
    ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;

    -- PROGRAMS, SAME RULE (owner ruling 2026-09-22). Eligibility only — the
    -- exam and the paid month award it, via submit_final_exam /
    -- release_pending_credentials, which already carry award_type through.
    INSERT INTO credential_eligibility (user_id, credential_type, credential_id)
    SELECT p_user, 'program', pr.id
    FROM programs pr
    WHERE pr.is_active
      AND NOT EXISTS (SELECT 1 FROM program_topics pt WHERE pt.program_id=pr.id AND pt.is_elective=false
          AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                          WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=pt.achievement_id))
      AND (NOT EXISTS (SELECT 1 FROM program_topics pt WHERE pt.program_id=pr.id AND pt.is_elective)
           OR EXISTS (SELECT 1 FROM program_topics pt JOIN student_achievement_progress p ON p.achievement_id=pt.achievement_id
                      WHERE pt.program_id=pr.id AND pt.is_elective AND p.user_id=p_user AND p.status='complete'))
    ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
  ELSE
    -- Current behaviour, byte-for-byte.
    INSERT INTO credential_awards (user_id, credential_type, credential_id, source)
    SELECT p_user, 'certificate', c.id, 'auto'
    FROM certificates c
    WHERE c.is_active
      AND NOT EXISTS (SELECT 1 FROM certificate_topics ct WHERE ct.certificate_id=c.id
          AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                          WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=ct.achievement_id))
    ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;

    INSERT INTO credential_awards (user_id, credential_type, credential_id, source)
    SELECT p_user, 'program', pr.id, 'auto'
    FROM programs pr
    WHERE pr.is_active
      AND NOT EXISTS (SELECT 1 FROM program_topics pt WHERE pt.program_id=pr.id AND pt.is_elective=false
          AND NOT EXISTS (SELECT 1 FROM student_achievement_progress p
                          WHERE p.user_id=p_user AND p.status='complete' AND p.achievement_id=pt.achievement_id))
      AND (NOT EXISTS (SELECT 1 FROM program_topics pt WHERE pt.program_id=pr.id AND pt.is_elective)
           OR EXISTS (SELECT 1 FROM program_topics pt JOIN student_achievement_progress p ON p.achievement_id=pt.achievement_id
                      WHERE pt.program_id=pr.id AND pt.is_elective AND p.user_id=p_user AND p.status='complete'))
    ON CONFLICT (user_id,credential_type,credential_id) DO NOTHING;
  END IF;
END
$function$;
