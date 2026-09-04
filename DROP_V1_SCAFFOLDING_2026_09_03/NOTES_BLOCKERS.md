# What is still blocked, and what would have to change first

Verified read-only against `yjgolswjggmlpeowvtxr` on 2026-09-03. Nothing was run.

The short version: **all five drops are authored and none of them is blocked in
the database.** Two of them are blocked in the **app**, and one of those two was
not on any previous list.

---

## 1. HARD BLOCKER — `src/features/profile/api.ts` (NEW; not previously listed)

Two live queries embed the `courses` table through the very foreign key stage 50
drops:

`C:\Users\profe\dev\ape-studio\src\features\profile\api.ts`

- **`fetchAchievements()`, ~line 218**
  ```ts
  .select('id, name, sequence_in_course, global_sequence, icon_url, courses!inner(code, sequence, color_hex)')
  ```
  and then, ~lines 226–235, it **sorts by `a.courses.sequence`** and reads
  `r.courses.code` and `r.courses.color_hex` for every trophy tile.

- **`fetchGallery()`, ~line 260**
  ```ts
  .select('achievement_id, date_earned, achievements!inner(name, icon_url, courses!inner(code, color_hex))')
  ```
  and reads `r.achievements.courses.code` / `.color_hex` at ~lines 268–271.

Both are **live**:

| Caller | File |
|---|---|
| `fetchAchievements()` | `C:\Users\profe\dev\ape-studio\src\screens\achievements\AchievementsScreen.tsx` (~line 47) |
| `fetchGallery()` | `C:\Users\profe\dev\ape-studio\src\screens\achievements\GalleryScreen.tsx` (~line 43) |

**Why this breaks at stage 50, not just stage 80.** PostgREST resolves
`achievements → courses!inner` through `achievements_course_id_fkey`. Stage 50
drops that constraint along with the column, so the embed stops resolving there.
Stage 80 then removes the table. **Both screens throw** — `!inner` means there is
no partial result to fall back on.

**What the replacement has to supply.** These two functions use `courses` for
three things only:

1. `courses.sequence` — the grid ordering. v3 already has a better key:
   `achievements.global_sequence` (unique per curriculum version, and
   `fetchAchievements` already orders by it before re-sorting). Drop the re-sort.
2. `courses.code` — the `courseCode` badge on each tile.
3. `courses.color_hex` — the tile colour, already falling back to
   `FALLBACK_CYCLE` when null.

For v3 there is no course, so (2) and (3) need either a v3 source (subject /
field from the curriculum matrix, if you want a label) or simply dropping the
`courseCode` field and letting `FALLBACK_CYCLE` own the colour. **That is a
product/design call, not a mechanical rewrite, so I did not author it.** Tell me
which and I will write the change.

Until it ships, **do not run stage 50.**

---

## 2. HARD BLOCKER — `src/features/dashboard/api.ts` (already known)

`C:\Users\profe\dev\ape-studio\src\features\dashboard\api.ts`

- **~line 230** — `.select('id, course_id, sequence_in_course, name, applicable_methods, is_prerequisite, icon_url, global_sequence')`
- **~line 238** — `course_id: a.course_id,`
- and the `Topic` type at ~line 26 declares `course_id: string`.

PostgREST errors on an unknown column, so the Dashboard's topic resolve breaks
the moment stage 50 runs. `C:\Users\profe\dev\ape-studio\src\screens\dashboard\DashboardScreen.tsx`
~line 887 also constructs a `Topic` with `course_id: ''`, so the field goes from
the type too.

**Confirmed:** the comment at the bottom of that file claiming `fetchDashboard()`
was removed on 2026-09-03 "so the enrollment table and achievements.course_id
can be dropped" **is accurate** — the function really is gone, and nothing else
in the file reads `enrollment`. Only the `course_id` select/map above remains.

Until it ships, **do not run stage 50.**

---

## 3. NOT a blocker, contrary to the earlier note — `GlossaryScreen.tsx`

`src/screens/glossary/GlossaryScreen.tsx` ~line 113 still selects
`glossary.course_id`. That is `REMOVE_V1_REMNANTS` stage 50's blocker, not this
package's, and `00_PRECHECK` asserts that stage has already run before any of
this begins. Listed here only so it is not mistaken for an open item of mine.

---

## 4. Things that are NOT blocked, and were feared to be

| Feared blocker | Resolution |
|---|---|
| `refresh_student_metrics` on the quiz hot path | **Cleared.** Rewritten in stage 10; stage 40 runs a live smoke test that executes it after the drop. |
| `delete_my_account` | **Cleared.** Three lines removed. Every remaining FK into `public.users` is either explicitly deleted or `ON DELETE CASCADE` — I enumerated all 33 of them — so the final `DELETE FROM users` still succeeds. |
| `register_student` / institutional registration | **Cleared by decision.** Dropped. No caller anywhere in `src/` or `web/`; its client wrapper was already deleted. |
| `credit_time_trial` had no v3 arm | **Cleared, and fixed.** It was a live bug: on v3 the RPC could only ever raise `not_enrolled`, silently, because the caller swallows the error. Now mirrors `record_study_progress`. |
| `is_instructor_for_user` used by RLS on surviving tables | **Cleared.** Stage 20 drops the 8 dependent policies first. Every affected surviving table keeps its `own_*` and `admin_*` policies; guards assert it. |
| `instructor_sections → course_sections` FK | **Cleared.** `instructor_sections` is dropped with `course_sections` in stage 70. 0 rows, no readers left after stage 20. |
| `badges` FK into `achievements` | **Cleared, optionally.** Stage 30 deletes the 4 rows. See the README's badge section for exactly what that does and does not unblock. |
| `v_student_progress`, `v_section_cohort_stats` | Handled by `RETIRE_INSTITUTIONAL_PATH` stage 10, which `00_PRECHECK` requires. |
| `glossary_full_v`, `glossary.course_id` | Handled by `REMOVE_V1_REMNANTS` stage 50, which `00_PRECHECK` requires. |

---

## 5. Deliberately left standing, with reasons

These could have been swept up but should not be, and are not required by any of
the five drops.

- **`badges` and `student_badges` tables.** Still read by the view
  `v_badge_roster`, the materialized view `mv_program_kpis`, and
  `src/features/profile/api.ts` `fetchProfile()` (which derives the four
  MIC/REC/MIX/PA certificate flags from `student_badges.badge_name_snapshot`).
  Dropping them is a separate decision with an app change attached.
- **`achievements.badge_trigger`.** A text column, 4 non-null rows, all v1. After
  stage 10 the only reader is
  `src/screens/results/TrophyScreen.tsx` ~line 43, and it only reads it when
  `badge_earned` is true — which is now a constant `false`. Harmless; dropping it
  would need that screen edited first for no gain.
- **The 51 legacy v1 `achievements` rows.** That is
  `CONVERT_RETIRE_V1_TOPICS_2026_09_03` stage 40's optional hard-delete, not
  mine. Stage 30 here removes one of its blockers (the badge FK); several
  remain.
- **The `role = 'instructor'` value on `public.users`.** Four institutional test
  users carry it. Nothing reads it after stage 20. Left as inert data rather than
  rewriting rows.

---

## 6. Corrected run order, end to end

```
1.  REMOVE_COLLEGE_COURSES                       (all)
2.  REMOVE_V1_REMNANTS                           (all 8 stages)
3.  CONVERT_RETIRE_V1_TOPICS                     (all; stage 40 optional)
4.  RETIRE_INSTITUTIONAL_PATH, stage 10          (the two institutional views)
5.  THIS PACKAGE, 00_PRECHECK + 05_BACKUP
6.  THIS PACKAGE, stage 10                       rewrite the 7 survivors
7.  THIS PACKAGE, stage 20                       drop the 5 retired functions + 8 policies
8.  THIS PACKAGE, stage 30                       OPTIONAL - clear the 4 badge rows
9.  SHIP THE APP CHANGES                         dashboard/api.ts AND profile/api.ts
10. THIS PACKAGE, stage 40                       DROP TABLE session_logs
11. THIS PACKAGE, stage 50                       DROP COLUMN achievements.course_id
12. THIS PACKAGE, stage 60                       DROP TABLE enrollment
13. THIS PACKAGE, stage 70                       DROP TABLE instructor_sections, course_sections
14. THIS PACKAGE, stage 80                       DROP TABLE courses            <- LAST
```

`courses` genuinely does go last. That part of every earlier sketch was right.
