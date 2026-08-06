# GOVERNANCE RECONCILIATION — 2026-07-15 BACKEND/GOVERNANCE HANDOFF

> **STATUS: CANDIDATE — PENDING PROF. BOOTH APPROVAL.** Nothing in this file is applied to governance or the DB. It is a **draft** of the coordinated bump (STATE r32 / TRACKER r31 / INDEX v34) plus the DB-verified status of the handoff's action items. No schema/RPC writes were made this session — all findings are **read-only verified** against live prod `yjgolswjggmlpeowvtxr` on 2026-07-15.
>
> Prepared by: backend/governance chat. Source: `APE_BACKEND_HANDOFF_2026_07_15.txt` + live-DB verification.

---

## 0) EXECUTIVE SUMMARY

Two things happened that governance never captured:

1. **The client build session (2026-07-15) filed a handoff** with 5 new backend items (A–E) and 4 carryover items (F–I). It made **no backend changes**.
2. **A prior backend session (2026-07-11 evening → 2026-07-12) applied 5 migrations that were never folded into governance.** These deployed item-D, item-E, and the Option-B commercial progression. **The live DB is ahead of STATE r31.** This is the recurring "applied-but-not-recorded" drift the INDEX warns about.

**Net effect on the handoff's carryover list:** two of the four carryover items (**F and G**) are **already resolved on the live DB** — the handoff was written from pre-v2.13-completion knowledge.

---

## 1) VERIFICATION FINDINGS — LIVE DB GROUND TRUTH (read-only, 2026-07-15)

### 1a) Undocumented migrations applied AFTER the r31 snapshot

| Migration (version) | Name | Effect | Governance status |
|---|---|---|---|
| 20260711190836 | `v213_itemD_deploy_glossary_full_v_view` | Deployed `glossary_full_v` masking view | **NOT in STATE r31** (r31 said item-D HELD) |
| 20260711194447 | `v213_itemD_close_common_mistakes_leak` | Closed a common_mistakes leak path | NOT recorded |
| 20260712012238 | `v213_fix_grant_execute_has_academy_access` | (Re-)granted EXECUTE on `has_academy_access` to anon + authenticated | NOT recorded |
| 20260712012736 | `v213_itemE_glossary_study_v_free_topic_exception` | Created `glossary_study_v` (free-topic exception) | NOT recorded |
| 20260712020524 | `v213_optionb_commercial_progression` | Deployed "Option B" commercial progression | NOT recorded (r31 said start_quiz_attempt v3 BLOCKED) |

### 1b) Object-level verification

| Object | Finding |
|---|---|
| `glossary_full_v` | **EXISTS.** Masks `common_mistakes` via `CASE WHEN has_academy_access(auth.uid()) THEN common_mistakes ELSE NULL::text[] END`. anon + authenticated both have SELECT. This is the **masked-NULL veil/tease behavior item F asked for.** |
| `glossary_study_v` | **EXISTS.** anon has SELECT. Free-topic exception view (item-E). |
| `has_academy_access(p_uid uuid)` | SECURITY DEFINER. **anon EXECUTE = TRUE, authenticated EXECUTE = TRUE**, service_role = false. (Grant is present, not missing.) |
| `register_commercial_user(p_nickname text, p_favorites jsonb)` | **DEPLOYED.** SECURITY DEFINER, authenticated EXECUTE. |
| `start_quiz_attempt` | Signature = `(p_achievement_id uuid, p_client_attempt_id uuid)` — **the `p_public_course_id` v3 param was NOT added.** Option-B progression was deployed by a separate migration; the exact mechanism needs source review to document. ⚠️ **[CONFIRM]** |
| `record_study_progress` | Present, signature `(p_achievement_id, p_method_key, p_batch_id, p_active_seconds, p_events)` — unchanged (item D's contract claim holds). |
| `study_methods` | flashcards / fill_in_blank / matching `min_engagement_seconds = **200**`; ear_training = 300; scenarios = 600. flashcards `required_passes = **2**`. |
| `glossary` columns | id, term, definition, plain_english, achievement_id, course_id, related_terms, category, difficulty, common_mistakes, scenario_contexts, purpose_function, practical_application. **No hazard-flag column; no (R)/(TM) column.** |
| Awards tables | **None exist** (searched award/hall/certif/diploma/fulfil/shipping). |
| Pricing SSoT | **No pricing/product table exists.** Price is client static text only. |
| "Professional Networking" | Achievement gs47, course MUSI205B, `is_active = false` (deferred). |
| "Music Entrepreneurship" | Achievement gs49, course MUSI108, `is_active = false` (deferred). |

### 1c) Live counts (2026-07-15)

glossary **3,660** / assignments **4,677** / pending **1,053** · quiz_questions **1,148** · active achievements **24** · users **4** (was 3 in r31 — **+1 = Anorak `APE-GOD-0001` demo account** per project memory) · commercial users **0** · public_courses **9** · public_course_topics **54** · entitlements **1**.

### 1d) Security advisors (2026-07-15) — CHANGED vs r31

- **2 × ERROR `security_definer_view`** — `glossary_full_v` and `glossary_study_v`. **BY DESIGN** (both use `has_academy_access` / masking). **r31's "get_advisors clean — no new ERROR" is now superseded.** Decision owed (accept the ERRORs as by-design, or refactor to SECURITY INVOKER + explicit grants).
- WARN set: anon/authenticated-executable SECURITY DEFINER functions (includes `has_academy_access`, `register_commercial_user`, and the existing student RPCs) — accepted definer pattern.
- 2 × INFO `rls_enabled_no_policy` — `glossary_backup_corrections_20260710`, `glossary_backup_prefill_20260710` (leftover 07-10 backup tables; droppable on Booth's go-ahead).

---

## 2) HANDOFF ACTION ITEMS — VERIFIED STATUS

| # | Item | Handoff said | Live-DB truth | Disposition |
|---|---|---|---|---|
| A | Awards model (eligibility, earned records, fulfillment, Hall-of-Fame 3-mo rule) | Server will eventually own | No awards objects exist | **OPEN — future / deferred.** Draft requirements reference "Professional Networking" per tier (see B). |
| B | Rename "Professional Networking" → "Workplace Professionalism"; move networking → "Music Entrepreneurship" | Planned, Booth-ratified 07-15 | Both targets exist, both `is_active=false` (deferred) | **OPEN — not applied. Non-launch-critical** (both deferred to Spring 2027). Landing coordination: client `awardsData.ts` + backend topic seed/name + dependent gating. |
| C | Pricing $99.99 lifetime thru EOY 2026 needs server SSoT | Client copy is static text today | No pricing table | **OPEN — future.** Store products + entitlement issuance pending products ruling. |
| D | Client mirrors item_states locally (display-only); gates read server | Informational, no action | `record_study_progress` contract unchanged (verified) | **NO ACTION.** ✓ |
| E | Swipe-browse doesn't call touch() | Informational, no action | Event shape unchanged | **NO ACTION.** ✓ |
| F | `has_academy_access` EXECUTE grant missing → 403 on common_mistakes; wants masked NULL | Still open | Grant PRESENT (anon+auth); `glossary_full_v` returns masked NULL | **✅ RESOLVED on live DB (07-11/07-12).** Handoff claim is stale. **Client action:** read common_mistakes via `glossary_full_v` (gets NULL when no academy access, not 403). |
| G | `register_commercial_user` RPC not deployed | Still open | **DEPLOYED** | **✅ RESOLVED (07-11).** Handoff claim is stale. |
| H | Per-term hazard flag (shock/chemical/burn/injury) + (R)/(TM) marks | Requested | No such columns | **OPEN.** Client still uses `src/lib/hazard.ts` keyword heuristic. Needs schema + data authoring. |
| I | Set flashcard required views = 1 server-side (so display 100% == gate) | Requested | flashcards `required_passes = 2` | **OPEN — decision + 1 config change.** Not applied. |

### Carryover blocker still open (not in the A–I list but tracked)
- **B-1 study gate NOT restored:** flashcards/fill_in_blank/matching `min_engagement_seconds = 200` (test value; spec = **600**). **Top pre-provisioning blocker before any real student.**
- 5 in-scope active achievements with `icon_url = NULL` (gs3, gs6, gs18, gs20, gs22) — **[CONFIRM — not re-verified this session]**.

---

## 3) PROPOSED TRACKER ENTRY (r31) — draft, ready to paste at top of PROGRESS_TRACKER

> **🗓️ 2026-07-15 — GOVERNANCE RECONCILIATION: v2.13 ITEM-D/E + OPTION-B COMMERCIAL PROGRESSION FOLDED IN (applied 07-11 PM→07-12, previously unrecorded) + 2026-07-15 CLIENT HANDOFF INTAKE → TRACKER r31.** *(CANDIDATE — pending Booth confirmation; coordinated bump STATE r32 / INDEX v34.)*
> **DRIFT CLOSED:** five migrations applied after the r31 snapshot were never folded into governance — `v213_itemD_deploy_glossary_full_v_view` (07-11 190836), `v213_itemD_close_common_mistakes_leak` (07-11 194447), `v213_fix_grant_execute_has_academy_access` (07-12 012238), `v213_itemE_glossary_study_v_free_topic_exception` (07-12 012736), `v213_optionb_commercial_progression` (07-12 020524). **The live DB is AHEAD of r31.** Verified read-only 2026-07-15.
> **NOW LIVE (verified):** `glossary_full_v` masks `common_mistakes`→NULL when `NOT has_academy_access(auth.uid())` (else returns the array); `glossary_study_v` free-topic exception; `has_academy_access` EXECUTE granted to anon+authenticated; `register_commercial_user` deployed. **This resolves handoff carryover F (masked-NULL veil/tease is live, no more 403) and G (RPC deployed).** ⚠️ `start_quiz_attempt` signature is still `(p_achievement_id, p_client_attempt_id)` — the v3 `p_public_course_id` param was NOT added; Option-B progression uses a separate mechanism — **[CONFIRM — document exact behavior from `v213_optionb_commercial_progression`].**
> **ADVISORS CHANGED:** now **2 ERROR `security_definer_view`** (`glossary_full_v` + `glossary_study_v`, BY DESIGN) — supersedes r31's "no new ERROR"; **decision owed** (accept vs refactor to SECURITY INVOKER). Plus accepted WARN set + 2 INFO (07-10 backup tables).
> **2026-07-15 CLIENT HANDOFF INTAKE (`APE_BACKEND_HANDOFF_2026_07_15.txt`; client made NO backend changes):** New EAS iOS dev build 76e2f5ee (shake gestures, Cinzel/Yellowtail fonts — client-only). New backend items: **(A)** Awards model — server to own eligibility/earned-records/fulfillment/Hall-of-Fame 3-mo rule (no objects yet; future). **(B)** Curriculum rename "Professional Networking"→"Workplace Professionalism" + move networking→"Music Entrepreneurship" (Booth-ratified 07-15; both targets `is_active=false` deferred → non-launch-critical). **(C)** Pricing $99.99 lifetime thru EOY-2026 needs server SSoT (static client text today; no table). **(D/E)** item_states local mirror (display-only) + swipe-bypass no-touch() — informational, `record_study_progress` contract unchanged, NO backend action. **(H)** per-term hazard flag + (R)/(TM) marks requested (no columns yet; client uses `src/lib/hazard.ts`). **(I)** set flashcard `required_passes` 2→1 requested (not applied). **Still open:** B-1 gate = 200 (spec 600) — top pre-provisioning blocker. **Note:** handoff cites `docs/APE_PLANNING_NOTES_2026_07_15.txt` — **file NOT present in workspace [CONFIRM]**. Live counts unchanged (3,660/4,677/1,053; 1,148 Q; 24 active); users 3→**4** (Anorak `APE-GOD-0001`). Backend remains CANDIDATE.

---

## 4) PROPOSED STATE r32 — draft delta to the CURRENT block

Replace the "HELD / CANDIDATE(blocked)" lines in the 2026-07-11 v2.13 CURRENT block with:

- **item-D — NOW DEPLOYED (07-11):** `glossary_full_v` live; `common_mistakes` masked→NULL for non-academy (anon/free) instead of 403; leak closed. Client reads common_mistakes via the view.
- **item-E — NOW DEPLOYED (07-12):** `glossary_study_v` free-topic exception view (anon SELECT).
- **`has_academy_access` — EXECUTE granted to anon + authenticated (07-12).**
- **Option-B commercial progression — DEPLOYED (07-12)** via `v213_optionb_commercial_progression`. `start_quiz_attempt` param signature UNCHANGED (no `p_public_course_id`) — **[CONFIRM mechanism].**
- **Advisors:** 2 ERROR `security_definer_view` by design (glossary_full_v + glossary_study_v) — **decision owed**; supersedes the "no new ERROR" note.
- **Users:** 3 → 4 (Anorak `APE-GOD-0001`); entitlements = 1.

Pre-provisioning gate unchanged: **B-1 still 200** (restore to 600); 5 NULL trophy icons [CONFIRM].

---

## 5) PROPOSED INDEX v34 — draft note

- Log the 5 reconciled migrations under the v2.13 deliverables section.
- Add `APE_BACKEND_HANDOFF_2026_07_15.txt` to the artifact registry.
- Open-items register (§4): add **item H** (hazard-flag schema + authoring), **item I** (flashcard required_passes decision), **item A** (awards model design), **item B** (curriculum rename coordination), **item C** (pricing SSoT), and the **security_definer_view ERROR decision**.
- Flag missing `docs/APE_PLANNING_NOTES_2026_07_15.txt`.

---

## 6) DECISIONS OWED / [CONFIRM] ITEMS

1. **security_definer_view ERRORs** — accept as by-design, or refactor `glossary_full_v` / `glossary_study_v` to SECURITY INVOKER + explicit grants?
2. **Option-B progression mechanism** — document exactly what `v213_optionb_commercial_progression` changed (start_quiz_attempt signature is unchanged). [CONFIRM]
3. **Item I** — set flashcards `required_passes` 2→1? (Changes the study gate.)
4. **Item B rename** — apply now (deferred topics) or defer with the Spring-2027 content?
5. **B-1** — restore min_engagement_seconds to 600 (top pre-provisioning blocker).
6. **Missing planning-notes file** — `docs/APE_PLANNING_NOTES_2026_07_15.txt` cited by the handoff is not in the workspace.
7. **07-10 backup tables** — drop `glossary_backup_corrections_20260710` + `glossary_backup_prefill_20260710`?

---

*Reconciliation draft — 2026-07-15. Read-only verification only. No governance file or DB object was modified.*
