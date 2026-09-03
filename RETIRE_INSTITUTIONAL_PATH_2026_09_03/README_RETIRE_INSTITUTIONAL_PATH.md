# Retire the institutional path — guarded SQL package (2026-09-03)

**Status: PARTIAL BY DESIGN, PENDING YOUR APPROVAL AND FIVE RULINGS.**
Nothing here has been run against production.

This is the second half of the v1 cleanup. It covers `courses`, `enrollment`,
`course_sections`, `session_logs` and `achievements.course_id` — the five
objects that turned out to be far more entangled than the brief expected.

**Run `REMOVE_V1_REMNANTS_2026_09_03` first, in full.** This package assumes it.

## Run order

| # | File | What it does | Reversible? |
|---|---|---|---|
| 1 | `00_PRECHECK.sql` | Read-only. Prints the live blocker list — functions, views, policies, FKs, app files. | n/a |
| 2 | `05_BACKUP.sql` | Backs up 11 function sources, 3 view definitions, 11 RLS policies, all four tables in full, and the 51 `achievements.course_id` values. | n/a |
| 3 | `10_APPLY_drop_institutional_views.sql` | Drops `v_student_progress` and `v_section_cohort_stats`. | **Yes**, verbatim |
| — | `90_VERIFY.sql` | Read-only. Confirms Stage 10 and re-prints the remaining blockers. | n/a |
| — | `99_ROLLBACK.sql` | Recreates both views from the backup. | n/a |
| — | `NOTES_BLOCKERS.md` | **Read this.** The full blocker inventory and the five decisions I need from you. | n/a |

## What is irreversible

Nothing in this package, as shipped. Stage 10 drops two unused reporting views
and `99_ROLLBACK` puts them back verbatim. The irreversible work — the table
drops and the column drop — is **not authored**, on purpose.

## Why the table drops are not in here

The brief described five FKs into `courses`, with `course_sections` and
`session_logs` as "0 rows, no code, no function refs — trivially safe".

The database says otherwise. **Eleven functions and three views read these
objects**, and because Postgres does not dependency-check function bodies, a
`DROP TABLE` would succeed and break them silently at runtime. The two that
matter most:

- **`refresh_student_metrics` reads `session_logs`, and `submit_quiz` calls
  `refresh_student_metrics` on every single quiz submission.** Dropping
  `session_logs` breaks quiz submission for the whole app. `session_logs` is
  the opposite of trivially safe.
- **`register_student` reads `courses` and writes `enrollment`.** It is the
  institutional registration RPC. Dropping `courses` removes the only path by
  which an institutional student can claim an account.

There are also blockers the FK list did not include: an
`instructor_sections → course_sections` foreign key, and three RLS policies
written in terms of `is_instructor_for_user` (which itself reads `enrollment`).

I am not going to rewrite eleven live `SECURITY DEFINER` functions — including
your registration and metrics paths — on my own initiative. `NOTES_BLOCKERS.md`
lists the five product rulings I need. Give me those and I will author the
sequenced apply/rollback files in the same style as the other package.

## The one app change that must ship before the column drop

`src/features/dashboard/api.ts` lines ~230 and ~238 still select and map
`achievements.course_id`:

```ts
.select('id, course_id, sequence_in_course, name, applicable_methods, is_prerequisite, icon_url, global_sequence')
...
course_id: a.course_id,
```

That has to ship removed before `ALTER TABLE achievements DROP COLUMN course_id`
can run. The same file already carries a comment saying `fetchDashboard()` was
removed on 2026-09-03 for exactly this reason — confirm that landed and is
deployed to every client you care about.

## Safety design

Same as the other package: guarded `DO` blocks that refuse on unmet
preconditions, `IF EXISTS` everywhere, no `\echo` so it pastes into the Supabase
SQL editor, and a full verbatim backup of every function and view source before
anything is touched.

## After a successful run

Keep the backups. They are the working material for the rest of the job, not
just a rollback. Do not drop them until the table drops are finished:

```sql
drop table public.inst_func_backup_20260903;
drop table public.inst_view_backup_20260903;
drop table public.inst_policy_backup_20260903;
drop table public.inst_courses_backup_20260903;
drop table public.inst_enrollment_backup_20260903;
drop table public.inst_course_sections_backup_20260903;
drop table public.inst_session_logs_backup_20260903;
drop table public.achievements_course_id_backup_20260903;
```
