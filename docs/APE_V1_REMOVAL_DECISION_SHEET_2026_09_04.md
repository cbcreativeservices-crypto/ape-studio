# v1 Removal — Decision Sheet (2026-09-04)

> ✅ **RATIFIED 2026-09-04 (Cháno): "Go — use the safe defaults."** All twelve
> functions run as authored: the 7 rewrites + 5 drops as recommended,
> `lookup_student_by_qr` **rewritten** (kept), the hidden `total_study_sessions`
> counter set to **active-day count** (nothing in the app displays it), and the
> **optional stage 30 badge-rows deletion IS run** (4 dead v1 rows, 0 earned).
> The two "separate" items (241 v2-draft rows; 51 legacy v1 rows) are NOT part
> of this run. **Next:** Computer A sanity-checks the rewrites/drops, then Cháno
> runs the package file-by-file in the Supabase editor. No app change needed.

The last v1 package — [`DROP_V1_SCAFFOLDING_2026_09_03`](../DROP_V1_SCAFFOLDING_2026_09_03)
— is authored, guarded, idempotent and fully reversible, but **nothing has been
run**. It is parked on **twelve database functions** that block the five drops.
This sheet is the decision-maker's summary: mark each, and the package runs.

- **ccode** authored the SQL (read-only against `yjgolswjggmlpeowvtxr`).
- **Cháno** runs every file himself in the Supabase SQL editor.
- **Computer A** owns the DB layer — please review the rewrites/drops below.

Full engineering detail lives in the package's `README_DROP_V1_SCAFFOLDING.md`
and `NOTES_BLOCKERS.md`; this sheet does not replace them, it decides them.

---

## Status at a glance

| Side | State (2026-09-04) |
|---|---|
| **App** | ✅ **FULLY UNBLOCKED.** Both hard blockers are resolved (see below) — **no app change is required before any stage, including 50 and 80.** |
| **DB** | ⏳ Package authored + guarded + reversible; **not run.** Awaiting the twelve decisions here, then Cháno's run. |

**The two app blockers the package was written around — both now cleared:**

1. `src/features/profile/api.ts` — the `courses!inner(code, sequence, color_hex)`
   embeds in `fetchAchievements`/`fetchGallery`. **Resolved** by the Achievements
   v3 redesign (2026-09-04): those two functions were deleted and replaced by v3
   reads in `src/features/achievements/api.ts` (no `courses` join).
2. `src/features/dashboard/api.ts` — the `course_id` select/map/type. **Resolved**
   — the live query (`api.ts:229`) selects no `course_id`, the `Topic` type no
   longer carries it; only a stale history comment remains.

Verified 2026-09-04: no app query hits `courses` / `enrollment` / `session_logs`
/ `course_sections` / `instructor_sections`, and no app code calls any
dropped/rewritten function in a breaking way (the rewritten RPCs keep their
signatures + JSON payload shapes). Two remaining `course_id` string mentions
(`GlossaryScreen` local `TopicRef` `''` literal, an `auth/api.ts` type) are
client-only — not Supabase selects — so they do not break at stage 50.

---

## Decide: the twelve functions

ccode's recommendation is what the authored SQL does — **"Agree" = run as
written.** Mark **Agree / Change it / Ask me** on each.

### Rewrite & keep — 7 (package stage 10)

| # | Function | Recommendation | Why (one line) | Your call |
|---|---|---|---|---|
| 1 | `refresh_student_metrics(uuid)` | **REWRITE — never drop** 🔴 | On the quiz hot path (`submit_quiz` calls it every submission); read the now-empty `session_logs`. Rewritten off it — **see judgment call A.** | ☐ Agree ☐ Change ☐ Ask |
| 2 | `delete_my_account()` | **REWRITE** | Account deletion must keep working; only 3 dead `DELETE`s removed; all 33 FKs into `users` verified to still resolve. | ☐ Agree ☐ Change ☐ Ask |
| 3 | `record_study_progress(…)` | **REWRITE** | `always_free` + v3 arms byte-for-byte unchanged; only the unreachable institutional `else` arm becomes a `retired_content` error. | ☐ Agree ☐ Change ☐ Ask |
| 4 | `credit_time_trial(uuid,text)` | **REWRITE — live bug fix** | Had **no v3 arm** → silently never credited a cleared time trial (caller swallows the error). Now mirrors `record_study_progress`. | ☐ Agree ☐ Change ☐ Ask |
| 5 | `start_quiz_attempt(uuid,uuid)` | **REWRITE** | `else` → `retired_content`; drops the `course_id`/`v_course` reads. v3 lockout/pool/gate/draw logic untouched. | ☐ Agree ☐ Change ☐ Ask |
| 6 | `submit_quiz(…)` | **REWRITE** | `else` → `retired_content`; removes 3 proven-dead calls (incl. the badge write). **JSON payload shape unchanged** (`badge_earned` stays constant `false` as it already was on v3), so the app needs no change. | ☐ Agree ☐ Change ☐ Ask |
| 7 | `lookup_student_by_qr(uuid)` | **REWRITE** | Blocks the drop indirectly (calls `is_instructor_for_user`). Loses that disjunct; access narrows to `is_ta_or_admin()`. No app caller — this is the TA/admin QR scanner path (not institutional mode). **Or drop it — see optional decisions.** | ☐ Agree ☐ Change ☐ Ask |

### Drop — 5 (package stage 20)

| # | Function | Recommendation | Why (one line) | Your call |
|---|---|---|---|---|
| 8 | `register_student(text,text)` | **DROP** | Institutional class-code registration — the only writer of `enrollment`. Wrapper deleted 2026-09-03, no caller in `src/` or `web/`, no v3 equivalent. Signup uses `register_commercial_user` (untouched). | ☐ Agree ☐ Change ☐ Ask |
| 9 | `seed_first_topic_on_enrollment()` + `trig_seed_first_topic` | **DROP** | Trigger on `enrollment`, keyed on `course_id` — meaningless without the table. v3 inserts the progress row on demand in `start_quiz_attempt` / `record_study_progress`. | ☐ Agree ☐ Change ☐ Ask |
| 10 | `unlock_after_safety(uuid,uuid)` | **DROP** | Proven no-op on v3 (zero v3 `is_prerequisite` rows → loop never ran). Only caller was `submit_quiz`. | ☐ Agree ☐ Change ☐ Ask |
| 11 | `recompute_reachability(uuid,uuid,uuid)` | **DROP** | Course-ordered progression by `sequence_in_course` within a `course_id` (the column stage 50 drops). v3 has no ordered progression; callers dead. | ☐ Agree ☐ Change ☐ Ask |
| 12 | `is_instructor_for_user(uuid)` | **DROP** (+ 8 dependent RLS policies first) | Retired instructor path. The 8 `instr_read_*` policies are **permissive** grants — dropping them removes an instructor's read access, never grants anything. Every surviving table keeps its `own_*` + `admin_*` policies (asserted by precheck + verify). | ☐ Agree ☐ Change ☐ Ask |

---

## The two that deserve real attention 🔴

**A. `refresh_student_metrics` — what replaces `total_study_sessions`?**
`session_logs` was never written by the app (0 rows, always), so this number was
a permanent `0` and the streaks already came from real quiz attempts.
- **ccode's choice (recommended):** count **distinct activity days**
  (America/Los_Angeles) across `student_method_progress.last_updated` + genuine
  `quiz_attempts.started_at` — the same day-set the streaks use, so all three
  numbers become mutually consistent. It is a **day** count, not a session count;
  the body + a `COMMENT ON FUNCTION` say so. **Nothing in `src/` or `web/` reads
  `total_study_sessions` today**, so this is low-risk.
- **Alternatives:** hard-code `0` · count engaged topic×method units · drop the
  column entirely (ccode writes the `ALTER TABLE` as its own stage).
- **Your call:** ☐ day-count (recommended) ☐ hard `0` ☐ unit-count ☐ drop column ☐ Ask

**B. The 4 badge rows — optional stage 30.**
Deleting the 4 v1 `badges` rows clears `badges.trigger_achievement_id →
achievements(id)`, which is a blocker for `CONVERT_RETIRE_V1_TOPICS` stage 40's
**optional** hard-delete of the 51 legacy v1 achievements. `student_badges` has
**0 rows**, so nothing earned is lost, and the `submit_quiz` badge write is
removed either way (dead code). The `badges`/`student_badges` **tables stay**
(still read by `fetchProfile`'s MIC/REC/MIX/PA cert flags + two views) — dropping
them is a separate decision.
- **Your call:** ☐ delete the 4 rows (run stage 30) ☐ skip stage 30

---

## Optional / separate (not required to finish this package)

- **`lookup_student_by_qr`:** rewrite (recommended — keeps the TA/admin QR path)
  vs **drop** (no app caller anywhere). ☐ rewrite ☐ drop
- **241 `v2-draft` achievement rows:** an abandoned draft curriculum, wholly
  inert, nothing points at it (Cháno confirmed abandoned). Delete? ☐ delete ☐ keep
- **51 legacy v1 achievement rows:** `CONVERT_RETIRE_V1_TOPICS` stage 40's
  optional hard-delete — separate package; still has other blockers
  (`quiz_questions`, `glossary`, `certificate_topics`, `program_topics`, …).

---

## Run order — Cháno, Supabase SQL editor (one file at a time; run `90_VERIFY.sql` after each)

| Step | Where 📍 | File | What |
|---|---|---|---|
| 1 | Supabase SQL editor | `00_PRECHECK.sql` | Read-only; re-derives the blocker list from `pg_catalog`. |
| 2 | Supabase SQL editor | `05_BACKUP.sql` | Backs up all 12 function sources, the trigger, policies, grants, all 5 tables' rows, the 51 `course_id` values, the 4 badge rows. |
| 3 | Supabase SQL editor | `10_APPLY_rewrite_live_functions.sql` | Rewrites the 7 survivors. **The most important file.** |
| 4 | Supabase SQL editor | `20_APPLY_drop_institutional_functions.sql` | Drops the 5 functions + trigger + 8 RLS policies. |
| 5 | Supabase SQL editor | `30_APPLY_clear_badge_rows.sql` | **OPTIONAL** (decision B) — deletes the 4 badge rows. |
| — | your editor + build | app changes | **NONE required** — both blockers already shipped (see status). |
| 6 | Supabase SQL editor | `40_APPLY_drop_session_logs.sql` | `DROP TABLE session_logs` + live smoke test of `refresh_student_metrics`. |
| 7 | Supabase SQL editor | `50_APPLY_drop_achievements_course_id.sql` | `ALTER TABLE achievements DROP COLUMN course_id`. |
| 8 | Supabase SQL editor | `60_APPLY_drop_enrollment.sql` | `DROP TABLE enrollment`. |
| 9 | Supabase SQL editor | `70_APPLY_drop_course_sections.sql` | `DROP TABLE instructor_sections`, then `course_sections`. |
| 10 | Supabase SQL editor | `80_APPLY_drop_courses.sql` | `DROP TABLE courses`. **LAST.** |
| — | Supabase SQL editor | `99_ROLLBACK.sql` | Reverses every stage run, 80 → 10. Safe to run twice. |

**Irreversibility note:** fully reversible **while the backup tables are kept**,
with one exception — `glossary_course_id_fkey`. Once stage 80 drops `courses`,
`REMOVE_V1_REMNANTS`'s own rollback can restore the `glossary.course_id` column +
values but **not** that constraint. **Take a Supabase snapshot before stage 80**
if you might ever want that earlier package's rollback to be complete.

---

## Sign-off

- **Cháno (decisions):** ratified the twelve above on __________ ; ran through
  stage ____ on __________.
- **Computer A (DB review):** reviewed the rewrites + drops on __________ —
  ☐ concur ☐ changes noted above.
