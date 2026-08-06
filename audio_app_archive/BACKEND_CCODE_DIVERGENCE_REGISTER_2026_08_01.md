# Backend ↔ ccode Divergence Register (STANDING)
_Owner: Machine A · started 2026-08-01 · one row per system built client-side that the backend must reconcile_

Purpose: track everything ccode built/changed that isn't reflected in the database, until each is reconciled. Update when ccode hands off a change or when a new gap is found.

**EXPORTS RECEIVED 2026-08-01** — ccode delivered complete exports in its repo at `C:\Users\profe\dev\ape-studio\docs\ccode_exports\` (programs.json 15, certificates.json 68, cert_topic_membership.json 204, topic_matrix_v2.json 203, ENROLLMENT_MODEL.md, CHANGE_HISTORY.md). **Join key = `gs` = `achievements.global_sequence` in the DRAFT curriculum `51c1d5db` (the v2 matrix, 203 topics, Booth-locked 2026-07-18).** All 193 referenced gs resolve there, 0 dangling (verified).

> ⚠ **CORRECTION to the earlier duplicate-topic consolidation plan:** the **draft-cv rows are the current source of truth** (the v2 matrix ccode joins to), NOT the active-cv rows. The 2026-08-01 consolidation plan proposed keeping the *active* row and retiring the *draft* — that is **backwards** and would break every cert/program join. DO NOT run `APE_TOPIC_CONSOLIDATION_APPLY_2026_08_01.sql` as written. Re-do consolidation to keep the draft/v2-matrix rows if consolidating at all.

| # | System | Built in | Backend state | Gap | Status | Reconciles via |
|---|---|---|---|---|---|---|
| 1 | **Certificates (68, L1, 3 topics each)** | ccode CONFIG (`awardsData.ts`) | no table | need load, join gs→id (draft cv) | EXPORT RECEIVED ✅ | `certificates` + `certificate_topics` (revise) |
| 2 | **Programs (15, L2 topic-paths)** | ccode CONFIG | no table | programs are TOPIC PATHS w/ electives+coreqs, NOT cert compositions | EXPORT RECEIVED ✅ | `programs` + `program_topics` (+ elective/coreq); drop `program_certificates` |
| 3 | **Enrollment** | ccode LOCAL (AsyncStorage) | `enrollment` table UNUSED | all state device-local; key on user_id+gs (topics) & user_id+bundle_key (bundles); free seed gs100+gs1240 | SPEC RECEIVED ✅ | `user_topic_enrollments` + `user_bundle_enrollments` (revise) |
| 4 | **Pricing** | ccode CONFIG literals | `entitlements` (access only) | $99.99 lifetime / $59.99 yr / $9.99 mo hardcoded; needs DB home | OPEN | `pricing`/`products` table |
| 5 | **Cert/program COMPLETION + issuance** | nowhere | not persisted at all | **biggest gap** — earning a cert has no record | OPEN | new issuance table + rules |
| 6 | **Free-topic set** | ccode CONFIG (`FREE_ENROLL_GS`) | achievements.always_free partial | gs100 + gs1240 | OPEN | align always_free |

## Process rule (agreed 2026-08-01)
ccode sends Machine A a short handoff for **every** change touching data model, certificates, programs, enrollment, pricing, awards, or topic structure. Machine A logs it here and lands it in the DB (single source of truth). Kickoff request: `CCODE_RECONCILIATION_REQUEST_2026_08_01.md`. Candidate schema: `BACKEND_SCHEMA_PROPOSAL_certs_programs_enrollment_2026_08_01.sql`.
