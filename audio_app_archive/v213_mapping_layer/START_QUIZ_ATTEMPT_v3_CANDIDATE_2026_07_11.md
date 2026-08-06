<!--
CANONICAL FILE: START_QUIZ_ATTEMPT_v3_CANDIDATE_2026_07_11.md
STATUS: CANDIDATE — Phase 2 design. NOT deployable as-is. Integrity-critical: quiz draw /
        gating / progression are server-authoritative and must never regress. Resolve the
        OPEN DESIGN QUESTIONS (§4) before authoring deployable SQL. NOTHING DEPLOYED.
DECISION LOGGED (Booth, 2026-07-11): audience scoping uses an OPTIONAL new param
        p_public_course_id (backward-compatible; institutional callers omit it).
-->

# start_quiz_attempt v3 — Audience-Scoped Gating (CANDIDATE)
**Pro Audio Training Academy · 2026-07-11**

## 1. Goal
Extend the deployed `start_quiz_attempt` v2 to serve **commercial** users without changing the
institutional path or the serve/draw/integrity logic. Per PATH_B §4:
- Institutional: precondition-0 (Safety) + enrollment gate **unchanged**.
- Commercial: Safety precondition applies to all topics **except** Achv0 (gs0) and gs36 (the free
  topics are startable pre-Safety; Safety itself always startable); **+ entitlement precondition**
  (non-free topic requires `has_academy_access`); **+ clamp/eligibility scoped to
  `public_course_topics.seq`** of the quiz's public-course context.
- Serve-set draw, materialization, `build_attempt_payload` — **untouched**.

## 2. Contract change (RULED)
```
start_quiz_attempt(
  p_achievement_id   uuid,
  p_client_attempt_id uuid,
  p_public_course_id uuid DEFAULT NULL   -- NEW, optional. Institutional omits (path unchanged).
)                                        -- Commercial passes the active public course for clamp scoping.
```
Backward-compatible: existing 2-arg calls resolve to the same signature via the default, so the
institutional client needs **no** change (honors "do not change RPC call contracts" for institutional).

## 3. Surgical deltas against the deployed v2 body
The v2 body is reproduced verbatim in §5 as the baseline. v3 inserts an audience branch; everything
not called out is byte-identical.

- **After** `SELECT id INTO v_user ...`: also load `v_audience := users.audience`.
- **Safety precondition block** (`IF v_is_prereq IS NOT TRUE THEN ... safety_prerequisite_incomplete`):
  wrap so that for `v_audience='commercial'` it is **skipped when the target is a free topic**
  (achievement is gs0 or gs36 — resolve via `achievements.global_sequence IN (0,36)` or
  `public_course_topics.is_free`). Institutional unchanged.
- **Enrollment block** (`SELECT e.curriculum_version_id ... not_enrolled` / `version_mismatch`):
  **institutional only.** For commercial, REPLACE with:
  - entitlement precondition: if the topic is **not** free, require `has_academy_access(auth.uid())`
    else RAISE `academy_required`;
  - course-context resolution: the target achievement must exist in `public_course_topics` for
    `p_public_course_id` (RAISE `topic_not_in_course` otherwise).
- **Progression/clamp block** (`SELECT status, lockout_until, best_genuine_score ... topic_locked`):
  for commercial, the unlock decision must be computed from the **commercial clamp over
  `public_course_topics.seq`** rather than a pre-seeded `student_achievement_progress.status`
  (see OPEN QUESTION 4.1). Lockout + best_genuine_score handling identical once a progress row exists.
- **Pool / study-gate / draw / insert:** unchanged for both audiences.

## 4. OPEN DESIGN QUESTIONS (must resolve before deployable SQL)
**4.1 Commercial progression rows.** v2 reads `student_achievement_progress` (status/lockout/
best_genuine_score), which for institutional users is seeded via enrollment/curriculum. Commercial
users have **no enrollment**, so these rows don't exist. Options:
  (a) `register_commercial_user` (or first course-open) seeds `student_achievement_progress` rows for
      all 51 achievements at `status='locked'`, with the free topics + Safety set to unlocked;
  (b) compute unlock **on the fly** from the clamp (no seeded status rows; derive from
      best_genuine_score of the preceding `seq` topic), writing a progress row lazily on first attempt.
  → **Recommendation: (b)** to keep a single completion model and avoid a 51-row seed per signup;
     needs a clamp helper `commercial_topic_unlocked(v_user, p_public_course_id, p_achievement_id)`.

**4.2 Clamp definition for commercial.** Confirm the one-ahead contiguous clamp evaluates over
`public_course_topics.seq` within `p_public_course_id`, treating cross-listed completions as complete
everywhere (shared `student_achievement_progress` row per achievement). Free topics are always
startable. Safety (gs0) excluded from the /50 denominator (existing rule).

**4.3 curriculum_version_id for commercial.** v2 ties enrollment + achievement by `curriculum_version_id`.
Commercial has no enrollment cvid. Decide the pinned curriculum_version for commercial attempts
(likely the current active version) so `student_achievement_progress` + `quiz_attempts` rows are
consistent and `submit_quiz` (unchanged) scores correctly.

**4.4 submit_quiz completion hook.** PATH_B says submit_quiz is unchanged and "audience-agnostic."
Verify its completion/clamp-advance path works when the progress row was created lazily (4.1b) and
when there is no enrollment row — before enabling commercial quizzes end-to-end.

## 5. Deployed v2 baseline (verbatim — do not edit here; diff target)
```sql
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_achievement_id uuid, p_client_attempt_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp' SET statement_timeout TO '30s'
AS $function$
DECLARE
  v_user uuid; v_attempt_id uuid; v_existing uuid;
  v_course uuid; v_ach_cvid uuid; v_enr_cvid uuid;
  v_status text; v_lockout timestamptz; v_best int; v_is_active boolean; v_is_prereq boolean;
  v_pool int; v_is_practice boolean; v_attempt_number int; v_gate_fail int;
  v_materialized int;
BEGIN
  SELECT id INTO v_user FROM users WHERE auth_id = auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  SELECT id INTO v_existing FROM quiz_attempts WHERE client_attempt_id = p_client_attempt_id AND user_id = v_user;
  IF v_existing IS NOT NULL THEN RETURN build_attempt_payload(v_existing); END IF;
  SELECT id INTO v_existing FROM quiz_attempts WHERE user_id = v_user AND achievement_id = p_achievement_id AND attempt_status = 'in_progress' LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN build_attempt_payload(v_existing); END IF;
  SELECT a.course_id, a.curriculum_version_id, a.is_active, a.is_prerequisite INTO v_course, v_ach_cvid, v_is_active, v_is_prereq FROM achievements a WHERE a.id = p_achievement_id;
  IF v_course IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
  IF v_is_prereq IS NOT TRUE THEN
    IF NOT EXISTS (SELECT 1 FROM student_achievement_progress sap JOIN achievements a0 ON a0.id = sap.achievement_id WHERE sap.user_id = v_user AND a0.is_prerequisite = true AND a0.curriculum_version_id = v_ach_cvid AND sap.status = 'complete') THEN
      RAISE EXCEPTION 'safety_prerequisite_incomplete';
    END IF;
  END IF;
  SELECT e.curriculum_version_id INTO v_enr_cvid FROM enrollment e WHERE e.user_id = v_user AND e.course_id = v_course;
  IF v_enr_cvid IS NULL THEN RAISE EXCEPTION 'not_enrolled'; END IF;
  IF v_enr_cvid IS DISTINCT FROM v_ach_cvid THEN RAISE EXCEPTION 'version_mismatch'; END IF;
  SELECT status, lockout_until, best_genuine_score INTO v_status, v_lockout, v_best FROM student_achievement_progress WHERE user_id = v_user AND achievement_id = p_achievement_id;
  IF v_status IS NULL OR v_status = 'locked' THEN RAISE EXCEPTION 'topic_locked'; END IF;
  IF v_lockout IS NOT NULL AND v_lockout >= now() THEN RAISE EXCEPTION 'under_lockout'; END IF;
  SELECT count(*) INTO v_pool FROM quiz_questions WHERE achievement_id = p_achievement_id AND usage = 'graded_quiz' AND review_status = 'approved';
  IF v_is_active IS NOT TRUE OR v_pool < 25 THEN RAISE EXCEPTION 'pool_too_small'; END IF;
  SELECT count(*) INTO v_gate_fail FROM (SELECT m AS method_key FROM achievements a, unnest(COALESCE(a.applicable_methods, ARRAY[]::text[])) AS m WHERE a.id = p_achievement_id) req
  LEFT JOIN study_methods sm ON sm.key = req.method_key
  LEFT JOIN student_method_progress smp ON smp.user_id = v_user AND smp.achievement_id = p_achievement_id AND smp.method_key = req.method_key AND smp.is_applicable = true
  WHERE smp.id IS NULL OR sm.id IS NULL OR smp.completion_pct < 100 OR smp.engagement_seconds < sm.min_engagement_seconds
     OR (sm.requires_accuracy AND smp.answered_count = 0) OR (sm.requires_accuracy AND smp.answered_count > 0 AND (smp.correct_count::numeric / smp.answered_count) * 100 < sm.accuracy_threshold);
  IF v_gate_fail > 0 THEN RAISE EXCEPTION 'study_gate_unmet'; END IF;
  v_is_practice := (COALESCE(v_best,0) >= 24);
  SELECT COALESCE(MAX(attempt_number) FILTER (WHERE NOT is_practice), 0) + 1 INTO v_attempt_number FROM quiz_attempts WHERE user_id = v_user AND achievement_id = p_achievement_id;
  BEGIN
    INSERT INTO quiz_attempts (id, user_id, achievement_id, attempt_number, score, is_practice, started_at, submitted_at, attempt_status, client_attempt_id)
    VALUES (gen_random_uuid(), v_user, p_achievement_id, v_attempt_number, 0, v_is_practice, now(), NULL, 'in_progress', p_client_attempt_id) RETURNING id INTO v_attempt_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_existing FROM quiz_attempts WHERE client_attempt_id = p_client_attempt_id AND user_id = v_user;
    IF v_existing IS NULL THEN SELECT id INTO v_existing FROM quiz_attempts WHERE user_id = v_user AND achievement_id = p_achievement_id AND attempt_status = 'in_progress' LIMIT 1; END IF;
    RETURN build_attempt_payload(v_existing);
  END;
  WITH prev AS (SELECT qai.question_id FROM quiz_attempt_items qai JOIN quiz_attempts pa ON pa.id = qai.attempt_id WHERE pa.user_id = v_user AND pa.achievement_id = p_achievement_id AND pa.id <> v_attempt_id AND pa.started_at = (SELECT MAX(p2.started_at) FROM quiz_attempts p2 WHERE p2.user_id = v_user AND p2.achievement_id = p_achievement_id AND p2.id <> v_attempt_id)),
  pool AS MATERIALIZED (SELECT q.id, q.question_type, gt.difficulty AS diff, (q.id IN (SELECT question_id FROM prev)) AS was_prev FROM quiz_questions q JOIN glossary_topics gt ON gt.glossary_id = q.glossary_id AND gt.achievement_id = q.achievement_id WHERE q.achievement_id = p_achievement_id AND q.usage = 'graded_quiz' AND q.review_status = 'approved'),
  ia AS MATERIALIZED (SELECT id FROM pool WHERE diff IN ('intermediate','advanced') ORDER BY was_prev ASC, random() LIMIT 18),
  fill AS MATERIALIZED (SELECT id FROM pool WHERE id NOT IN (SELECT id FROM ia) ORDER BY was_prev ASC, random() LIMIT (25 - (SELECT count(*) FROM ia))),
  drawn AS (SELECT id FROM ia UNION ALL SELECT id FROM fill),
  ordered AS (SELECT id, (row_number() OVER (ORDER BY random()))::smallint AS slot_index FROM drawn)
  INSERT INTO quiz_attempt_items (attempt_id, slot_index, question_id, is_repeat, definition_id, served_question_type, served_options, served_correct_answers)
  SELECT v_attempt_id, o.slot_index, o.id, false, NULL, m.served_question_type, m.served_options, m.served_correct_answers FROM ordered o CROSS JOIN LATERAL public.materialize_pooled_slot(o.id) m;
  GET DIAGNOSTICS v_materialized = ROW_COUNT;
  IF v_materialized <> 25 THEN RAISE EXCEPTION 'pool_too_small'; END IF;
  RETURN build_attempt_payload(v_attempt_id);
END; $function$
```

## 6. Recommendation
Resolve §4.1–4.4 (a short design ruling) → then author v3 as a surgical `CREATE OR REPLACE` diff of §5
→ dev-verify the **institutional regression** (must be byte-identical behavior) + a commercial matrix
(anon/free/academy/lapsed × free/paid × pre/post-Safety) → Booth PROD go-ahead. Until then the live
v2 is untouched and commercial quiz start is not enabled.

*End — CANDIDATE. Awaiting the §4 design ruling.*
