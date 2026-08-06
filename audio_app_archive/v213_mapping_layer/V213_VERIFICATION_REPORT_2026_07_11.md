<!--
CANONICAL FILE: V213_VERIFICATION_REPORT_2026_07_11.md
STATUS: PARTIALLY DEPLOYED TO PROD 2026-07-11 (additive client-safe layer, item-D HELD).
        Booth authorized "direct to prod, item-D split". Governance docs (INDEX/STATE/TRACKER)
        owe a bump to register SCHEMA v2.13.
REGISTER INTO: PROJECT_FILE_INDEX §1 + §5 at next governance bump.
-->

# Path B Mapping Layer (v2.13) — Deployment & Verification Report
**Pro Audio Training Academy · 2026-07-11 · v2.13 additive layer DEPLOYED (item-D held)**

## Executive summary
Authored the full additive DDL/seed/RPC package for the commercial mapping layer per the
design-approved `PATH_B_MAPPING_LAYER_SCHEMA_2026_07_11_v1`, then — on Booth's go-ahead
("direct to prod, item-D split") — **deployed the additive, client-safe layer to production**
`yjgolswjggmlpeowvtxr` as 4 tracked migrations. Seed integrity was proven read-only against prod
first, then re-verified post-write. The **item-D `common_mistakes` revoke is HELD** for a coordinated
client release. `start_quiz_attempt` v3 remains a CANDIDATE spec (open design questions). A Supabase
native dev branch was attempted but is unusable for this project (see Blocker) and was deleted.

## PRODUCTION DEPLOYMENT RECORD (2026-07-11)
Applied via `apply_migration` (tracked), each read-back verified:
| Migration | Contents |
|---|---|
| `v213_core_ddl_mapping_layer` | `users.audience` (+chk, backfilled 3 users→institutional) · `public_courses` · `public_course_topics` + `trg_single_primary_home` · `entitlements` +RLS self-read · `has_academy_access()` · `register_commercial_user` v1 |
| `v213_anon_catalog_grants_and_glossary_view` | anon SELECT (glossary 12 cols ex common_mistakes; glossary_topics; achievements; public_courses/topics) + anon RLS policies |
| `v213_seed_public_courses_and_topics` | 9 courses + 54 topic rows (fail-closed gate passed) |
| `v213_advisor_cleanup_defer_glossary_view` | dropped glossary_full_v (deferred to held item-D) · revoked has_academy_access EXECUTE from anon/authenticated · pinned trigger search_path |

**Post-deploy verification (executed on prod):**
- Counts: 9 courses / 54 topics / 51 primary / 3 cross-list / 2 free ✅
- Single-primary invariant: 0 duplicate primaries, 0 achievements without a primary ✅
- Free topics = gs0 (Professional Audio Safety) + gs36 (DAW Skills) ✅
- Trigger negative test: duplicate-primary insert **rejected** with expected error, no side effect ✅
- `get_advisors(security)`: **no new ERROR**; only new WARN is `register_commercial_user`
  (authenticated SECURITY DEFINER — same accepted, necessary pattern as `register_student`).
  Pre-existing INFO/WARN entries unchanged. ✅

**NOT deployed (held/deferred):** item-D revoke + glossary_full_v view
(`SCHEMA_v213_ITEMD_close_common_mistakes_CANDIDATE.sql`) → ships with the client release that reads
common_mistakes from the view. Original single-file DDL (`SCHEMA_v213_MAPPING_LAYER_DDL_CANDIDATE.sql`)
retained as the consolidated reference; the applied form was the 4-migration split above.

## What was produced (deliverables in `v213_mapping_layer/`)
| File | Purpose |
|---|---|
| `SCHEMA_v213_MAPPING_LAYER_DDL_CANDIDATE.sql` | 3 tables + `users.audience` + single-primary trigger + `has_academy_access()` + item-D `common_mistakes` gating + anon catalog grants + `register_commercial_user` v1 |
| `SCHEMA_v213_SEED_CANDIDATE.sql` | 9 courses + 54 topic rows from D-1 placement SSoT (gs→UUID at runtime), with a fail-closed gate-verify block |
| `SCHEMA_v213_ROLLBACK_CANDIDATE.sql` | Single-step reverse migration |
| `SCHEMA_v213_VERIFICATION_HARNESS.sql` | H1–H10 post-apply checks |
| `V213_VERIFICATION_REPORT_2026_07_11.md` | This report |

## Blocker encountered (and resolution)
**Supabase native branching is defeated by this project's migration history.** The branch
`commercial-v213` replayed only **12 of 56** migrations before `MIGRATIONS_FAILED`, freezing at
`20260618193300` (June 18). Result: 50 achievements (gs 1–50, **no Safety gs0**), missing the entire
curriculum restructure + Safety + v2.12 — an unfaithful replica that would prove nothing about prod.
Root cause: the glossary/curriculum data was loaded via DML/Studio, not migrations, so the historical
chain isn't cleanly replayable on a fresh DB.

**Resolution (approved pivot):** deleted the branch (billing stopped, ~$0.01/hr, minutes of exposure)
and verified seed integrity **read-only against production** instead — higher fidelity, zero writes.

## Verification results
**PASS — seed integrity dry-run (read-only against PROD achievements):**

| Check | Expected | Actual |
|---|---|---|
| Total topic rows | 54 | 54 ✅ |
| Courses | 9 | 9 ✅ |
| Primary rows | 51 | 51 ✅ |
| Cross-list rows | 3 | 3 ✅ |
| Free rows (is_free) | 2 | 2 ✅ |
| Unresolved gs (no achievement) | 0 | 0 ✅ |
| Distinct primary gs | 51 | 51 ✅ |
| Achievements total | 51 | 51 ✅ |

51 primary rows = 51 distinct primary gs = 51 achievements → **clean bijection** (every achievement
has exactly one primary home; every SSoT gs resolves to a real prod record).

**PASS — additive-only precondition (read-only):** target tables `public_courses` /
`public_course_topics` / `entitlements` do not yet exist; `users.audience` absent. Existing RPC
signatures confirmed unchanged (`start_quiz_attempt(p_achievement_id, p_client_attempt_id)`,
`submit_quiz` v8.3, `register_student`, `verify_registration`, `record_study_progress`).

**PASS — naming/data checks (read-only):** gs0 = "Professional Audio Safety" (prereq, active);
gs36 = "DAW Skills" (correct name — not "DAW Fundamentals").

**DEFERRED to post-apply (need the objects to exist):** H2 single-primary trigger negative test,
H5 anon column-grant probe, H6 `common_mistakes` masking, H7 `has_academy_access` matrix,
H10 `get_advisors` security pass. All scripted in the harness.

## Known limitations / risks
1. **gs36 "DAW Skills" is `is_active=false` on prod.** It's a free topic per D-1, so free users can
   *browse* it, but *cannot complete* it until Booth activates the content (≥ graded questions +
   applicable_methods). Seeding `is_free=true` is correct; the play-through gap is content, not schema.
   Safety (gs0) is active and playable.
2. **`common_mistakes` gating requires a coordinated client release.** Revoking the column from
   `authenticated` also removes it from *institutional* students unless the client reads
   `common_mistakes` from `public.glossary_full_v` (not the base table). Deploy to PROD **only**
   alongside the client change, or the institutional app 403s on that column.
3. **Favorites-migration payload has no server destination.** No favorites table exists;
   `register_commercial_user` accepts `p_favorites` for forward-compat but does not persist it.
4. **Verification fidelity:** trigger/grant/RPC behavior is scripted but not yet executed against a
   live copy (branch unusable). It will be validated post-apply with rollback ready.

## Deployment path — DONE (direct-to-prod, item-D split)
Chosen and executed 2026-07-11: additive client-safe layer applied directly to prod as tracked
migrations (see Deployment Record), with the `common_mistakes` revoke held for the client release.
Native branching was not usable for this DB. Remaining prod steps are the held item-D migration
(with the client) and Phase 2/3 (below).

## Open decisions before / alongside deploy
1. **Deploy approach:** direct-to-prod (recommended, item-D split) vs. throwaway-project rehearsal.
2. **Item-D sequencing:** confirm the client will switch `common_mistakes` reads to `glossary_full_v`;
   pick "hold item-D" vs "deploy together".
3. **Favorites destination:** create a server favorites table (new mini-spec) or keep device-local.
4. **`public_courses.description` copy:** Booth-authored (currently seeds NULL).

## NOT in this package (separate work)
- **`start_quiz_attempt` v3** (audience-scoped gating + commercial clamp) — Phase 2, integrity-critical.
  Open decision: add optional `p_public_course_id` param (backward-compatible; institutional omits it)
  vs. server-derive course context. Held pending your call; the current v2 signature is untouched here.
- **RevenueCat edge-function receiver** → `entitlements` sync — Phase 3, inert until Booth creates the
  RevenueCat account + App Store Connect monthly/annual products.
- Item C new topics ("Commercial 70/100V Systems", "DJ") — need new achievements/glossary first.
- Daily Term (item A) + Public Profile/employer directory (item B) — separate NEW specs.

## Confidence
Requirements understanding — **High.** Additive DDL/seed design — **High** (seed proven against prod).
Live trigger/RLS/RPC behavior — **Medium** (scripted, not yet executed; branch unusable).

*End — CANDIDATE. Awaiting: deploy approach + item-D sequencing decision.*
