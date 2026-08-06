# Backend → ccode note: pin progress writes to the v2/draft curriculum
_From Machine A (backend) · 2026-08-01_

## Why this matters
The backend now has certificates (68), programs (15), their topic membership, and an
auto-issue engine (`credential_awards` + `evaluate_user_credentials()` + the
`student_progress_award` trigger). **Completion is detected against the v2/draft
curriculum achievements** (`curriculum_version_id = 51c1d5db-1d05-4d43-8853-5fa1503fb751`)
— the same rows your `gs` values resolve to. A certificate is earned when its 3 topics
+ the 3 core coreqs (gs100 Safety / gs120 Grounding / gs1590 Workplace) + the
Foundations lab (`7387db19-…`) are all `status='complete'` in `student_achievement_progress`.

## The risk
`src/features/dashboard/api.ts` resolves gs → achievement with:
```
.select('… global_sequence')
.in('global_sequence', gsList)
```
There is **no `curriculum_version_id` filter**, and the loop keeps the *first* row per
gs (`if (byGs.has(gs)) continue`). Today this happens to work because every cert/coreq
gs exists **only** in the draft cv (verified: 0 collisions with active-cv gs). But it is
order-dependent and fragile: if an active-cv row ever shares a gs, progress could be
written against the wrong achievement id and a completion would **not** count toward the
credential.

## Ask
When resolving gs → achievement for anything that writes `student_achievement_progress`
(study/quiz completion), **filter to the v2 curriculum explicitly**:
```
.eq('curriculum_version_id', '51c1d5db-1d05-4d43-8853-5fa1503fb751')
.in('global_sequence', gsList)
```
so progress always lands on the draft/v2 achievement ids the credential engine checks.

## Note on the Anorak test account
`APE-GOD-0001` (nickname Anorak) has been seeded complete on all 203 v2 topics + the
Foundations lab, so it now holds **all 68 certificates + 15 programs** (auto-issued).
Use it to verify the credentials UI. Its older 52 completions were on legacy active-cv
course topics (disjoint gs) and are harmless.

## Backend objects ccode can read
- `certificates`, `programs`, `certificate_topics`, `program_topics`, `products`
- `credential_awards` (read a user's earned certs/programs)
- Enrollment (sync-ready, currently empty): `user_topic_enrollments`,
  `user_bundle_enrollments`, `user_home_cards`, `user_enrollment_state`
