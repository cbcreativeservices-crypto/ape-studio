<!--
CANONICAL FILE: OPTIONB_CLONE_REGRESSION_REPORT_2026_07_11.md
STATUS: Verification report for SCHEMA_v213_COMMERCIAL_PROGRESSION_OptionB_CANDIDATE.sql.
        Result: PASS on a hand-built faithful clone. Package remains CANDIDATE — awaiting Booth
        PROD go-ahead for the grader change.
-->

# Option B — Clone Regression Report
**Pro Audio Training Academy · 2026-07-11 · commercial quiz/progression (start_quiz_attempt v3 + submit_quiz v8.4)**

## Result: PASS
Institutional path verified **byte-identical**; commercial path verified end-to-end with **zero
enrollment rows**. No grader-math change; only the audience branches (enrollment guard, partial-pass
scope, reachability call) differ.

## Method
A throwaway Supabase project (`ape-optionb-verify` / `zmlfejuvpvwihvhtnhxl`) was hand-built to match
prod for the quiz flow: 21 tables reproduced from prod's exact columns + PK/UNIQUE/CHECK + in-scope
FKs; the grader-relevant triggers (`seed_first_topic_on_enrollment`, `trg_single_primary_home`);
all runtime functions verbatim from prod (`grade_one`, `materialize_pooled_slot`,
`build_attempt_payload`, `recompute_reachability`, `unlock_after_safety`, `refresh_student_metrics`,
`register_student`, `has_academy_access`) + the Option B package. Authoring-only guardrail triggers
and out-of-scope FKs (auth.users, course_sections, glossary_definitions) were intentionally omitted so
test users/data could be seeded. Seed: Safety (gs0), a 2-topic academic course (gs1→gs2), DAW Skills
(gs36); 25 approved questions/topic; public courses Pro Audio Safety / Intro to Audio (gs0 cross-list,
gs1, gs2) / Music Production (gs36). Users driven via JWT simulation (`request.jwt.claims.sub`).

## Institutional regression (audience='institutional') — PASS (byte-identical)
| Step | Expectation | Result |
|---|---|---|
| I1 start gs1 pre-Safety | blocked | `safety_prerequisite_incomplete` ✅ |
| I2 Safety full (25) | complete + trophy; gs1 auto-unlocks | complete, trophy, gs1=unlocked ✅ |
| I3 gs1 partial (22) | passed_incomplete; one-ahead unlock gs2 | passed_incomplete, clamped, gs2=unlocked ✅ |
| I4 gs2 full (25) | complete + trophy | complete, trophy ✅ |
| I5 gs1 retake full (25) | promote to complete + badge | complete, trophy, badge_earned ✅ |
| final | all complete; 3 trophies; 1 badge | g0/g1/g2 complete, trophies=3, badges=1 ✅ |

## Commercial matrix (audience='commercial', no enrollment) — PASS
| Step | Expectation | Result |
|---|---|---|
| C1 gs36 (free) full, no academy, pre-Safety | complete | complete + trophy ✅ (free + Safety-exempt + no academy) |
| C3 Safety (free) full | complete + trophy | complete + trophy ✅ |
| C4 gs2 before gs1 (academy) | clamp blocks | `topic_locked` ✅ |
| C5 gs1 partial (22) | passed_incomplete; one-ahead unlock gs2 over public seq | passed_incomplete, clamped, gs2=unlocked ✅ |
| C6 gs2 full (25) | complete | complete + trophy ✅ |
| C7 gs1 retake full (25) | promote + badge | complete, trophy, badge_earned ✅ |
| C8 paid topic, Safety done, NO academy | entitlement blocks | `academy_required` ✅ |
| final | all complete; **enrollments = 0** | g0/g1/g2/g36 complete, trophies=4, enrollments=0 ✅ |

Note (behavioral, not a defect): for a commercial user who has neither cleared Safety nor bought
academy, the **Safety** gate is hit before the entitlement gate (C2 returned
`safety_prerequisite_incomplete`). Both correctly block a paid topic; order is Safety→entitlement. If
product prefers "upgrade" messaging first, swap the two precondition blocks in v3 — a one-line reorder,
no integrity impact.

## Helper findings confirmed
- `unlock_after_safety` is a clean no-op for commercial (loops over enrollment rows; commercial has
  none) — verified by Safety completion (C3) raising no error and commercial having 0 enrollments.
- Lazy progress-row creation works: `start_quiz_attempt` v3 pre-creates the sap row so `submit_quiz`'s
  UPDATE lands; commercial completions persisted with no seed migration.

## Not exercised (out of scope / low risk)
Void (focus-loss ≥2) and timeout (>602s) branches were not re-run here — they are untouched by the
audience branch and already covered by the prod smoke set. `get_advisors` on the clone was skipped
(throwaway); on prod deploy, expect new WARN entries only for the added SECURITY DEFINER helpers
(`current_curriculum_version`, `commercial_topic_unlocked`, `recompute_reachability_commercial`,
`seed_commercial_free_topics`) — same accepted pattern as existing functions; no new ERROR expected.

## Fidelity caveat
The clone reproduces prod's exact columns/constraints/grader functions for the quiz flow, but is a
reconstruction, not a byte dump. The institutional path being byte-identical is also guaranteed
structurally (the ELSE branches are the original statements verbatim). Residual risk is limited to
prod objects outside the reproduced set, which the grader does not touch.

## Recommendation
Option B is verified. Deploy to prod as a single tracked migration (functions are CREATE OR REPLACE;
rollback = re-deploy captured v2 `start_quiz_attempt` + v8.3 `submit_quiz` bodies, drop the 4 helpers),
run `get_advisors`, and keep the free-topic commercial flow behind the client's `commercialMode` flag.
**Teardown:** delete project `zmlfejuvpvwihvhtnhxl` from the Supabase dashboard to stop the $10/mo.

*End — awaiting PROD go-ahead for the grader deploy.*
