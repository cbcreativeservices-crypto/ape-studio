# Wave A — Entitlement + RLS / secrets analysis (release-readiness QA, 2026-09-10)

Scope: Supabase RLS posture, authorization model, credential/progress integrity at
the DB level, client secret exposure, client-side trust. **Analysis only** — per
owner guardrails (backend frozen, security-workstream on hold) nothing in the DB
was changed; all findings are FILED for owner decision. DB facts pulled live via
read-only SQL; client facts via a read-only code scan (verified, file:line).

Method note honored from the plan: the Supabase MCP runs as the **service role**,
which bypasses RLS, so this is **policy analysis**, not live per-user probing.
Findings below are derived from policy/trigger/function definitions + the client
code's actual usage, which is conclusive for the issues raised.

---

## ✅ UPDATE 2026-09-10 — A-1 + A-2 RESOLVED
The owner applied `docs/APE_RLS_PROGRESS_WRITE_LOCKDOWN_2026_09_10.SQL`. Verified
live: `own_achievement_progress`, `own_method_progress`, `own_badges`,
`own_quiz_attempts` are now **`FOR SELECT`** (was `ALL`). Direct-write forge vector
closed; writes flow only through the SECURITY-DEFINER RPCs. Remaining to fully
close: a device re-verify that the legit study→quiz→credential journey still awards
normally (owner-side). The findings below are retained for the record.

## Headline

One **CRITICAL** release-blocker: an authenticated user can **forge any
certificate or program credential** by writing their own progress rows directly
through the REST API, bypassing the app and its gated RPCs. Root cause is a
write-exposed RLS policy family on the per-user progress tables; the same root
cause yields related HIGH integrity issues. The client itself is well-hardened
(no secrets, RPC-only writes, fails closed) — the gap is purely in the RLS write
policies, which the app does not even use.

---

## CRITICAL

### A-1 [CRITICAL][security/integrity] A student can forge certificates & programs via direct progress writes
**Chain (all verified live):**
1. `student_achievement_progress` has policy `own_achievement_progress` with
   **`cmd=ALL`**, `USING (user_id = <caller's users.id>)`, `WITH CHECK` null
   (so USING doubles as the insert/update check). It constrains **only
   `user_id`**, never `status`. → an authenticated caller may **INSERT/UPDATE
   their own rows with `status='complete'` for any `achievement_id`.**
2. Trigger `student_progress_award AFTER INSERT OR UPDATE OF status ON
   student_achievement_progress` fires `trg_eval_credentials()` →
   `evaluate_user_credentials(user)`.
3. `evaluate_user_credentials` decides awards **purely by counting
   `student_achievement_progress` rows with `status='complete'`** (core-requisite
   check + "all certificate_topics complete" + "all non-elective program_topics
   complete"). It does **not** recompute from server-graded `quiz_attempts` or any
   source the student cannot write. On satisfaction it `INSERT`s rows into
   `credential_awards` (`source='auto'`).
4. `credential_awards` `own_credential_awards` SELECT lets the user read them; the
   public verification RPCs (`public_verify_credentials`, `public_verify_by_token`)
   then verify the forged credential as genuine.

**Exploit (no special tooling):** a logged-in user, using the app's own shipped
anon key + their JWT, issues REST `PATCH`/`POST` to
`/rest/v1/student_achievement_progress` setting `status='complete'` for a
credential's required `achievement_id`s. The trigger awards the certificate/
program. A **free** account can forge **academy-only** credentials. The UI and the
gated `record_study_progress` RPC (entitlement checks, real method/quiz
completion) are all bypassed because the **table itself** is writable by the row
owner.

**Why the fix is safe (client-confirmed):** the client NEVER writes these tables
directly — every mutation of `student_achievement_progress`,
`student_method_progress`, `student_badges`, `quiz_attempts`, `credential_awards`,
`entitlements` goes through SECURITY-DEFINER RPCs (`record_study_progress`,
`submit_quiz`, `start/submit_final_exam`, …); the app only `.select()`s them. So
the write grant in the `own_*` policies has **no legitimate client use** — it is
pure attack surface.

**Recommended fix (owner-approved RLS change; backend frozen → needs go):**
restrict the owner policy on the progress/credential/badge tables to **`FOR
SELECT`** (reads), leaving all writes to the definer RPCs (which bypass RLS).
Mirror the already-correct `final_exam_attempts` / `final_exam_attempt_items`
(no client write policy at all). Specifically change `own_achievement_progress`
from ALL → SELECT (and A-2's siblings). Optionally also add a `WITH CHECK` that
forbids client-set `status`, but SELECT-only is the clean, complete fix.

**Verify-after:** re-run a full study→quiz→credential journey on device to confirm
the definer RPCs still award credentials normally (they run as definer, unaffected
by the policy change).

---

## HIGH

### A-2 [HIGH][integrity] Same root cause — method progress, badges, quiz attempts are owner-writable
All via `cmd=ALL` owner policies constraining only `user_id`, client uses RPCs
only, so all are non-breaking to lock to SELECT:
- `student_method_progress` `own_method_progress` (ALL) → forge method completion
  (display; no rollup trigger, so it does not by itself escalate to a credential —
  but it falsifies the user's own progress record).
- `student_badges` `own_badges` (ALL) → **self-grant badges / achievement
  records** (spec T239: "achievement cannot be manually unlocked").
- `quiz_attempts` `own_quiz_attempts` (ALL) + `quiz_attempt_items` is already
  SELECT-only → a user can write/alter their own `quiz_attempts` rows (forge
  attempt status/score display). Not read by `evaluate_user_credentials`, so no
  credential escalation, but it corrupts the attempt record the app trusts for
  history/results.
**Fix:** same — ALL → SELECT on each owner policy; writes stay with the definer
RPCs. Bundle with A-1 as one RLS patch.

---

## MEDIUM

### A-3 [MED][content-exposure] `get_scenario_items` is anon-executable
`get_scenario_items(p_achievement_id uuid)` is SECURITY DEFINER and granted
EXECUTE to `anon`, so a non-authenticated caller can fetch scenario-homework items
for any topic id. If scenario content is intended members-only, this leaks paid
study content to anonymous callers. **Action:** confirm scenarios are intended
free/preview; if not, revoke anon EXECUTE (owner/backend). (Several other
anon-executable functions are **by design**: the registry token/code-gated
verification RPCs `community_profile_public*`, `public_profile_by_token`,
`public_verify_*`, and the authorization predicates `is_admin` / `has_academy_access`
/ `is_instructor_for_user` / `is_ta_or_admin`, plus `get_glossary_term_count`.)

---

## LOW / INFO

### A-4 [LOW][dead-model] Institutional-model RLS remnants
`is_admin()`, `is_instructor_for_user()`, `is_ta_or_admin()` + the `admin_all_*`,
`instr_read_*`, `instr_write_enrollment`, `ta_read_student_badges` policies and the
`enrollment` / `instructor_sections` / `course_sections` tables are leftovers from
the **retired institutional model** (governance R1). They grant nothing today (no
admin/instructor/TA users exist), but they are latent authority and dead
complexity. Consider removing them when the backend reopens. Note: `admin_all`
policies rely on `is_admin()` returning true for some account — confirm no account
can set that.

### A-5 [LOW][housekeeping] ~250 `_backup` / `_bkp` / staging tables in `public`
A large number of dated backup/staging tables (`_backup_*`, `_bkp_*`, `cr_*`,
`inst_*`, `stage*`, `glossary_backup_*`, `qq_*_backup`, …) sit in the `public`
schema. All have **RLS enabled with 0 policies = deny-all** to clients, so they
are **not a leak** — but they clutter the schema and bloat the project. Recommend
dropping/relocating them post-launch (owner/backend).

---

## Verified GOOD (not defects)

- **RLS enabled on every table** in `public` (including all backups). No
  RLS-disabled table exists.
- **Every live per-user policy scopes to `auth.uid()`** correctly
  (`auth_id = auth.uid()` on `users`, `user_id = (select users.id where
  auth_id = auth.uid())` elsewhere). No `USING (true)` on a user-data table.
- **`final_exam_attempts` / `final_exam_attempt_items`**: RLS on, **no client
  write policy** → writes only via definer RPCs. This is the correct model A-1/A-2
  should mirror.
- **Notification subscriber-list leak (security-review 2026-08-28) is RESOLVED**:
  the `notification_*` RPCs are no longer anon-executable.
- **Client secrets: CLEAN** — only the `sb_publishable_` anon key + project URL
  reach the client, and `.env` is git-ignored/untracked; all `service_role` usage
  is server/tooling only (edge functions via `Deno.env`, scripts via shell env).
- **Client fails closed**: `EntitlementProvider` derives tier from a server
  `entitlements` read, never downgrades a member on a read error, defaults
  `anonymous`; `devBypass()` is `__DEV__`-only (compiled out of release); client
  gates are UI affordances with server RPCs as the authority.
- **Logging: CLEAN** — no token/session/PII/key printed.

---

## Filed items → owner (backend frozen; no DB change made here)

| ID | Sev | Action owner must approve |
| --- | --- | --- |
| A-1 | CRITICAL | RLS patch: `own_achievement_progress` ALL→SELECT (+ re-verify credential award journey) — **release blocker** |
| A-2 | HIGH | RLS patch (same batch): `own_method_progress`, `own_badges`, `own_quiz_attempts` ALL→SELECT |
| A-3 | MED | Decide if `get_scenario_items` should stay anon; revoke if members-only |
| A-4 | LOW | Remove institutional RLS remnants + confirm `is_admin()` can't be set by a user (post-launch) |
| A-5 | LOW | Drop/relocate ~250 backup/staging tables (post-launch) |

Since the backend is frozen and the security workstream is on hold, I did not
write the RLS patch. When the owner greenlights, the A-1/A-2 fix is a single small
migration (four policies ALL→SELECT) that the client is already compatible with.
