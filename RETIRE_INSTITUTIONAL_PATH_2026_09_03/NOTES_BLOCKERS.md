# Blockers between here and dropping `courses` / `enrollment` / `course_sections` / `session_logs` / `achievements.course_id`

Verified read-only against `yjgolswjggmlpeowvtxr` on 2026-09-03. Nothing was run.

## The correction to the original picture

The brief described this as five foreign keys into `courses`, with
`course_sections` and `session_logs` as "0 rows, no code, no function refs —
trivially safe". That is not what is in the database.

**Postgres does not dependency-check function bodies.** A `DROP TABLE` succeeds
and the functions that read it break silently, at runtime, on the next call.
Eleven functions and three views read these objects.

## Function blockers

| Function | Reads | SECURITY DEFINER | Live? |
|---|---|---|---|
| `register_student(text,text)` | `courses`, `enrollment` | yes | **Institutional registration.** Inserts the `SAFE` enrollment and returns the enrolled-course payload. Dropping `courses` breaks it entirely. |
| `refresh_student_metrics(uuid)` | `session_logs` | yes | **LIVE ON EVERY QUIZ.** `submit_quiz` ends with `perform public.refresh_student_metrics(v_user)`. It counts `session_logs` rows for `total_study_sessions` and uses them in the streak calculation. Dropping `session_logs` breaks every quiz submission. This is the single most dangerous item on the list, and it flatly contradicts "no function refs". |
| `delete_my_account()` | `enrollment`, `session_logs` | yes | Live. GDPR/account deletion. Deletes from both tables. |
| `record_study_progress(...)` | `enrollment`, `course_id` | yes | Live. Its non-v3, non-free arm does the enrollment lookup. |
| `credit_time_trial(uuid,text)` | `enrollment`, `course_id` | yes | Live. Requires an enrollment row unconditionally — it has no v3 arm at all. |
| `unlock_after_safety(uuid,uuid)` | `enrollment`, `course_id` | yes | Called by `submit_quiz` when `is_prerequisite` is true. |
| `recompute_reachability(uuid,uuid,uuid)` | `course_id` | yes | Called by `submit_quiz` on the non-v3 arm. |
| `is_instructor_for_user(uuid)` | `enrollment` | yes | Used by RLS policies on `enrollment` and `session_logs`. |
| `seed_first_topic_on_enrollment()` | `course_id` | no | Trigger fn on `enrollment`. Goes with the table. |
| `start_quiz_attempt(uuid,uuid)` | `enrollment`, `course_id` | yes | Its `else` arm. (After REMOVE_V1_REMNANTS Stage 30 this arm is unreachable but still *present in the body*, so it still blocks a drop.) |
| `submit_quiz(...)` | `enrollment`, `course_id` | yes | Same — the `else` arm survives Stage 30. |

## View blockers

Views ARE dependency-checked, so these make a drop fail loudly rather than
silently. All three must go or be rewritten first.

| View | Reads | Handled by |
|---|---|---|
| `v_student_progress` | `enrollment`, `achievements.course_id` | **Stage 10 of this package** |
| `v_section_cohort_stats` | `enrollment`, `course_sections` | **Stage 10 of this package** |
| `glossary_full_v` | `glossary.course_id` | REMOVE_V1_REMNANTS Stage 50 |

## Other structural blockers

- `instructor_sections.section_id → course_sections(id)` — an FK the brief did
  not list. `course_sections` cannot be dropped while `instructor_sections`
  exists (0 rows, but the constraint is real).
- RLS policies `instr_read_course_sections`, `instr_write_enrollment` and
  `instr_read_session_logs` are written in terms of `instructor_sections` /
  `is_instructor_for_user`. They drop with their tables, but
  `is_instructor_for_user` outlives them and would then read a missing table.
- Index `idx_glossary_course` and FK `glossary_course_id_fkey` drop
  automatically with `glossary.course_id`.

## App blockers

- `src/features/dashboard/api.ts` lines ~230 and ~238 still select and map
  `achievements.course_id`. Must ship removed before the column drop. (The same
  file already carries a comment saying `fetchDashboard()` was removed on
  2026-09-03 "so the enrollment table and achievements.course_id can be
  dropped" — confirm that change actually landed.)
- `src/screens/glossary/GlossaryScreen.tsx` blocks `glossary.course_id` — see
  the other package's README.

## The decisions I could not make for you

Each of these is a product ruling, not a mechanical rewrite, so I did not author
SQL for any of them:

1. **`register_student` / institutional registration.** Does it get deleted
   outright, or rewritten to stop enrolling? Deleting it removes the only path
   by which an institutional student can claim an account. There are 4
   institutional users. Your memory says institutional mode is retired, but
   "retired" and "the RPC is gone" are different states and only you can say
   which one you want.
2. **`refresh_student_metrics` and `session_logs`.** `total_study_sessions`,
   `current_streak_days` and `longest_streak_days` are all partly or wholly
   derived from `session_logs`. The table has 0 rows today, so those numbers are
   already degraded. Do you want streaks re-derived from `quiz_attempts` alone
   (they partly are), from study-method activity, or dropped from the profile?
   Whatever you choose, `refresh_student_metrics` has to be rewritten in the
   same transaction as the table drop, because `submit_quiz` calls it.
3. **`credit_time_trial`.** It requires an enrollment row and has no v3 arm, so
   on v3 it can only ever raise `not_enrolled`. Is the time-trial feature meant
   to work on v3? If yes this is a live bug to fix, not a line to delete.
4. **`is_instructor_for_user` and the instructor surface.** Does the whole
   instructor role go (`instructor_sections`, the `instr_*` policies, the
   `role = 'instructor'` branch), or does it stay dormant?
5. **`delete_my_account`.** Mechanical — just remove the two DELETE lines — but
   it is the account-deletion path and I am not editing it on my own initiative.

Give me rulings on those five and I will write the sequenced apply/rollback
files the same way as the other package.

## Correct order, once those are decided

```
1. REMOVE_V1_REMNANTS (all stages)          — clears public_course*, glossary.course_id
2. This package, Stage 10                   — clears v_student_progress, v_section_cohort_stats
3. Ship the app change removing achievements.course_id from dashboard/api.ts
4. Rewrite the 11 functions above           — NOT YET AUTHORED
5. DROP TABLE session_logs                  — needs (4) first: refresh_student_metrics
6. ALTER TABLE achievements DROP COLUMN course_id
7. DROP TABLE enrollment                    — takes trig_seed_first_topic +
                                              seed_first_topic_on_enrollment with it
8. DROP TABLE course_sections               — needs instructor_sections resolved
9. DROP TABLE courses                       — LAST, once all five FKs are gone
```

`courses` genuinely does go last. That part of the sketch was right.
