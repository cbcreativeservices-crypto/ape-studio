# Pass 5 · Agent B — the server surface the client depends on

**Date:** 2026-09-18 · **Branch:** `audio-tools-engine` · **Read-only.** No file
outside this one was touched. No `eas`/`git`/billed command was run. **I did not
query the live database** — everything below is derived from the repo, and every
claim that can only be settled against production is marked and has a query in
§8.

**Axis:** every assumption the client makes about the backend — RPCs, tables,
RLS/grants, migrations, edge functions, the credential award path, and
client/server contract drift.

---

## 0 · The structural fact that frames everything else

`supabase/migrations/` contains **exactly one file**, and that file's own header
says it has never been applied.

Across **all 161 `.sql` files in the whole repo** (`docs/`, `audio_app_archive/`,
`CONVERT_RETIRE_*`, `DROP_V1_*`, `REMOVE_V1_*`, `machineA_ingest/`), there are
**24 distinct function definitions** and **71 `create table` statements** — and
most are archived candidates, one-shot ingests, or v1 teardown scripts.

Measured against what the app actually calls:

| | count | defined somewhere in this repo | not defined anywhere |
|---|---|---|---|
| RPCs called by `src/` + `supabase/functions/` | **52** | 12 | **40** |
| Tables/views the client reads or writes directly | **31** | 6 (one of them an archived *candidate*) | **25** |

This is a deliberate arrangement — the backend is frozen and owner-applied, the
repo is the client — but it has a cost that is now material: **the repo cannot
tell anyone whether the server is right.** Every "is this deployed?", "does that
column exist?", "will this write pass the CHECK?" question in this report is
unanswerable from here, and several of them decide whether money works.

That is also why the two most dangerous findings below (§2.1, §2.2) are
*conditional*: the repo contains **two documents that contradict each other**
about the same table, and the code was written against the wrong one.

---

## 1 · The table: every RPC, every table, verdict

### 1a · RPCs (52)

`D` = a definition exists in this repo. Source column is the *first* call site.

| RPC | D | Called from | Verdict |
|---|---|---|---|
| `admin_mint_access_code` | ✅ | `functions/admin-codes:135` | Repo copy is **STALE — mints 30-day months; live is 35**. See §4.3 |
| `award_required_topics` | ❌ | `features/awards/api.ts:62` | Shape documented in-file, verified live 2026-08-28; audit confirms `anon ✗ / authenticated ✓ / stable`. OK |
| `calc_consume` | ✅ | `features/lab/calcUsage.ts:54` | Return shape matches `(used, lim, window_start, allowed)`. OK |
| `calc_usage_status` | ✅ | `features/lab/calcUsage.ts:70` | Matches `(used, lim, window_start)`. OK |
| `claim_device` | ✅ | `features/account/singleDevice.ts:20` | Arg matches `p_device_id text`. OK |
| `community_profile_delete` | ❌ | `features/directory/api.ts:248` | Live-only |
| `community_profile_mine` | ❌ | `features/directory/api.ts:146` | Live-only |
| `community_profile_public` | ❌ | `features/directory/api.ts:353` | Live-only; anon-callable by design (QR registry) |
| `community_profile_public_credentials` | ❌ | `features/directory/api.ts:354` | Live-only |
| `community_profile_publish` | ❌ | `features/directory/api.ts:217` | Live-only |
| `community_profile_save` | ❌ | `features/directory/api.ts:184` | Live-only |
| `community_profile_set_contact` | ❌ | `features/directory/api.ts:239` | Live-only |
| `community_profile_set_credentials` | ❌ | `features/directory/api.ts:205` | Live-only |
| `community_profile_set_discoverable` | ❌ | `features/directory/api.ts:230` | Live-only |
| `complete_scenario_round` | ❌ | `features/study/scenarioHomework.ts:157` | Live-only |
| `contact_block` | ❌ | `features/directory/api.ts:491` | Live-only |
| `contact_message_send` | ❌ | `features/directory/api.ts:479` | Live-only |
| `contact_report` | ❌ | `features/directory/api.ts:507` | Live-only |
| `contact_request_respond` | ❌ | `features/directory/api.ts:470` | Live-only |
| `contact_request_send` | ❌ | `features/directory/api.ts:454` | Live-only |
| `contact_thread_messages` | ❌ | `features/directory/api.ts:434` | Live-only |
| `contact_threads` | ❌ | `features/directory/api.ts:410` | Live-only |
| `credit_time_trial` | ✅ | `features/study/timeTrial.ts:364` | Args match `(p_achievement_id uuid, p_method_key text)`. OK |
| `delete_my_account` | ✅ | `features/settings/DeleteAccountButton.tsx:74` | No args both sides. OK |
| `directory_search` | ❌ | `features/directory/api.ts:290` | Live-only; only `docs/APE_DIRECTORY_TESTS.sql` mentions it |
| `get_academy_stats` | ❌ | `features/curriculum/academyStats.ts:62` | Live-only. Client keeps its cache on error. OK |
| `get_active_device` | ✅ | `features/account/singleDevice.ts:36` | OK |
| `get_due_concept_subscriptions` | ❌ | `functions/on-weekly-concept:125` | Live-only. **Window arithmetic unverifiable — see §5.2** |
| `get_glossary_definition` | ❌ | `features/glossary/glossaryGateway.ts:108` | Live-only |
| `get_glossary_term_count` | ❌ | `features/curriculum/curriculumStats.ts:29` (+3 more) | Live-only; anon-callable by design |
| `get_next_concept` | ❌ | `functions/on-weekly-concept:199` | Live-only |
| `get_pace_records` | ❌ | `features/study/paceRecords.ts:45` | Live-only. Correctly via RPC — `study_pace_records` is deny-all |
| `get_question_count` | ❌ | `features/curriculum/curriculumStats.ts:41` | Live-only |
| `get_scenario_homework` | ❌ | `features/study/scenarioHomework.ts:122` | Live-only. Correctly via RPC — `scenario_homework` is deny-all |
| `get_scenario_items` | ❌ | `features/study/mediaTypes.ts:34` | Live-only. Error → `[]`, indistinguishable from "no content" (§6.4) |
| `glossary_consume` | ❌ | `features/glossary/glossaryCap.ts:75` | Live-only. Fails OPEN on error — correct per the brief's rule |
| `glossary_usage_status` | ❌ | `features/glossary/glossaryCap.ts:95` | Live-only. Fails OPEN. OK |
| `mark_lab_complete` | ❌ | `features/lab/labCompletion.ts:270` | Live-only (seeded by 4 `docs/APE_*_SEED_*.sql`). Retries on failure. OK |
| `my_identity` | ❌ | `features/profile/api.ts:75`, `:155`, `SettingsScreen:146` | Live-only. Called with `.single()` — see §6.3 |
| `record_pace_session` | ❌ | `features/study/paceRecords.ts:30` | Live-only |
| `record_scenario_answer` | ❌ | `features/study/scenarioHomework.ts:141` | Live-only |
| `record_study_progress` | ✅ | `features/study/sync.ts:87` | 5 args, exact name match. OK |
| `record_tool_usage` | ❌ | `features/tools/telemetry.ts:44` | Live-only. Fire-and-forget. OK |
| `redeem_access_code` | ✅ | `features/commercial/accessCode.ts:83` | **Repo copy is the UNAPPLIED rewrite.** Still overwrites `store_ref`/`source` — §4.2 |
| `register_commercial_user` | ✅ | `features/commercial/commercialAuth.ts:53` | Definition exists only in v1-teardown scripts. Verify live |
| `set_registry_listing` | ❌ | `features/profile/api.ts:269` | Live-only |
| `start_final_exam` | ❌ | `features/finalExam/api.ts:169` | **Live-only, and the migration's gate for it is a COMMENT, not SQL — §3.2** |
| `start_quiz_attempt` | ✅ | `features/quiz/api.ts:151` | Live body = 2-arg. A 3-arg overload exists in an archived candidate — §6.2 |
| `start_scenario_cycle` | ❌ | `features/study/scenarioHomework.ts:172` | Live-only |
| `submit_final_exam` | ❌ | `features/finalExam/api.ts:205` | **Live-only. Client has NO error vocabulary for it — §3.3** |
| `submit_quiz` | ✅ | `features/quiz/api.ts:185` | 6 args, exact match. Sets `status='complete'` — the trigger's input (§7) |
| `sync_my_enrollments` | ❌ | `features/enrollment/enrollmentStore.ts:182` | Live-only. Push-side hardened in pass 4; verified still correct (§6.1) |

### 1b · Tables and views read/written directly (31)

`DDL` = a `create table` for it exists anywhere in this repo. `Deny-all` = named
in `docs/APE_SECURITY_REVIEW_2026_08_28.md` F3 as RLS-on-with-no-policy.

| Table / view | DDL | Client op | Verdict |
|---|---|---|---|
| `users` | ❌ | select ×13, **update** (`profile/api.ts:291`) | Live-verified: RLS on, anon ✗, 4 policies, column-scoped UPDATE on `registry_name`. OK |
| `achievements` | ❌ | select ×14 | anon SELECT ✓ per the 2026-09-13 audit. OK |
| `entitlements` | ⚠️ *candidate only* | select ×3 (client + 2 edge fns), **service-role write** | **The DDL in this repo contradicts the code that writes it — §2.1, §2.2** |
| `student_achievement_progress` | ❌ | select ×5 | Write lockdown drafted (`APE_RLS_PROGRESS_WRITE_LOCKDOWN_2026_09_10.SQL`), **no applied-marker anywhere** — §3.4 |
| `student_method_progress` | ❌ | select ×2 | Same lockdown file. Read-only from the client. OK |
| `student_badges` | ❌ | select ×1 | Same lockdown file. OK |
| `credential_awards` | ❌ | select ×2 | Client reads it as authoritative and never writes. §7 |
| `certificates` / `certificate_topics` | ✅ | select | Needed BOTH policy + GRANT (fixed 2026-08-10). OK |
| `programs` / `program_topics` | ✅ | select | Same. OK |
| `glossary`, `glossary_topics`, `glossary_media` | ❌ | select | Column-level grants live; `common_mistakes` correctly 42501 for anon |
| `glossary_full_v`, `glossary_study_v`, `glossary_browse_v` | ❌ | select | SECURITY DEFINER views by design (audit §4). OK |
| `notification_preferences` | ❌ | select ×4, **update ×2** | Keys on `public.users.id`. Client honours that. OK |
| `notification_concept_subscriptions` | ❌ | select, **upsert ×2, update** | Keys on `auth.uid()`. Client honours that. OK |
| `notification_concept_deliveries` | ❌ | select ×2, insert/update (edge fn) | Idempotency is thin — §5.2 |
| `notification_concepts` | ❌ | select | OK |
| `study_methods` | ❌ | select | OK |
| `tubes` | ❌ | select (edge fn only) | OK |
| `mic_calibration_contributions` | ✅ `docs/MIC_CATALOG_2026_08_21.sql` | **upsert (ignore-duplicates)** | Grant is INSERT-only; `ON CONFLICT DO NOTHING` needs no UPDATE. Enum and range both satisfied. **Checked, clean** |
| `access_codes` | ✅ | service-role only (edge fn) | Deny-all, and no client touches it. Correct |
| `user_topic_enrollments` | ❌ | **select** (`enrollmentStore.ts:116`) | **Deny-all set.** Pass-4 fix verified correct — §6.1 |
| `directory_areas`, `directory_specialties`, `directory_specialty_areas`, `directory_roles`, `directory_open_to` | ❌ | select ×5 | **Zero mentions in any `.sql` or `.md` in the repo. Unknown RLS/grant, and the client caches an empty result — §4.4** |

---

## 2 · BLOCKERS

### 2.1 · `status='refunded'` is very likely refused by a CHECK constraint, so the entire refund path is a silent no-op

**Severity:** BLOCKER · **Confidence:** medium-high on the mechanism, and the
identical failure is *already documented as having happened once* on the sibling
column. One query settles it.

**Where:** `supabase/functions/store-notifications/index.ts:294`;
`audio_app_archive/v213_mapping_layer/SCHEMA_v213_MAPPING_LAYER_DDL_CANDIDATE.sql:97`;
`supabase/migrations/2026091801_paid_month_before_credential.sql:47`;
`docs/APE_OWNER_SQL_2026_09_07.sql:19-21`.

**What happens:** Apple or Google report a refund. `store-notifications` verifies
it correctly against the store, then writes:

```ts
.update({ status: 'refunded', refunded_at: …, member_since: null, … })
```

The only `entitlements` DDL in this repo declares:

```sql
status text NOT NULL CHECK (status IN ('active','lapsed','revoked'))
```

`'refunded'` is not in that set. If that constraint is live, every refund write
raises `23514`, `markRefunded` logs it and returns `0`, the function returns
`200 OK` with `{rows: 0}`, and **the store never retries**. The refunded member
keeps `status='active'`, keeps access, and keeps their tenure toward a
certificate — which is the precise thing the owner's rule exists to prevent
(*"no certificates if they refund and I never get paid anything"*).

**Why I believe it.** Three independent pieces of repo evidence:

1. The DDL above is the only `entitlements` schema in the repo and it enumerates
   `status`.
2. **This exact failure already happened on the neighbouring column.**
   `docs/APE_OWNER_SQL_2026_09_07.sql:14-18` records it verbatim: *"The
   `redeem_access_code()` function writes `source='access_code'`, but the table
   CHECK constraint only allowed app_store/play_store/admin_grant/institutional,
   so EVERY code redemption (and the reviewer comp) was rejected by the database
   and the app reported 'redemption isn't available yet'."* The fix widened
   `source`. **Nobody widened `status`.**
3. The tenure migration assumes the opposite and says so in writing
   (`:47`): *"`status` is free text with no check constraint, so this widens
   rather than breaks."* Two files in the same repo, written by the same effort,
   disagree about the same column. One of them is wrong, and the one that is
   wrong is the one the refund code was written against.

**What should happen:** a confirmed refund ends access and clears tenure.

**Fix:** widen the constraint before `store-notifications` ships, in the same
shape as the 2026-09-07 fix:

```sql
alter table public.entitlements drop constraint if exists entitlements_status_check;
alter table public.entitlements add constraint entitlements_status_check
  check (status = any (array['active','lapsed','revoked','refunded']));
```

Separately, `markRefunded` should treat a non-zero `error` as a **failure**, not
as zero rows: returning `200 OK` to Apple on a write that errored throws away the
store's retry, which is the only recovery mechanism there is. Return a 5xx (or
enqueue) when the write itself failed, as distinct from when nothing matched.

**Settles it:** §8 query 1.

---

### 2.2 · Both edge functions write two columns that do not exist yet — deploy them first and every purchase takes the money and grants nothing

**Severity:** BLOCKER (ordering hazard) · **Confidence:** high

**Where:** `supabase/functions/validate-purchase/index.ts:225` (select),
`:269-285` (write); `supabase/functions/store-notifications/index.ts:294-297`,
`:329-332`; `supabase/migrations/2026091801_paid_month_before_credential.sql:22`
(*"NOT YET APPLIED"*) and `:38-49` (the two `add column` statements).

**What happens:** `member_since` and `refunded_at` are added by the unapplied
migration. Both edge functions read and write them unconditionally.

Deploy `validate-purchase` **before** the migration and a real purchase goes:

1. `.select('id, expires_at, member_since, refunded_at')` → `42703 column does
   not exist`. **The error is discarded** (`const { data: existing } = …`, no
   `error` binding at `:223`), so `prior` becomes `null`.
2. That sends it down the `insert` branch with `member_since` in the row.
3. The insert fails → `write.error` → `return json({ ok:false, error:'grant_failed' })`.
4. The client (`purchase.ts:88-96`) sees `ok !== true`, does **not**
   `finishTransaction`, and shows *"We couldn't verify that purchase. If you
   were charged, use Restore Purchases."*

The customer has been charged by Apple/Google and has nothing, and Restore hits
the same wall every time. The function fails safe in the "grants nothing"
direction — which is correct — but it fails safe **for every single paying
customer**, silently, with a generic message.

`store-notifications` has the mirror-image problem: the refund write errors,
returns `{rows: 0}` with `200 OK`, and the store never retries.

**What should happen:** the migration is applied *before* either function is
deployed, or the functions degrade to writing only the columns that exist.

**Fix:** this is a sequencing instruction, not a code change:
**apply `2026091801` first, verify the two columns, then deploy.** Given the
brief already records that neither function is deployed, the whole risk is in the
order of the next two actions. Also: bind and log the `error` at
`validate-purchase:223` — an ignored error on the read is what converts a
recoverable schema problem into an unconditional insert.

**Settles it:** §8 queries 2 and 3.

---

### 2.3 · The two correct fixes to the Google refund path have, together, made it match zero rows — permanently

**Severity:** BLOCKER · **Confidence:** high (both halves are in the current
source; this is not a guess about the live DB)

**Where:** `supabase/functions/validate-purchase/index.ts:220`;
`supabase/functions/store-notifications/index.ts:436-439` and `:462`;
`supabase/migrations/2026091801_paid_month_before_credential.sql:182`.

This is **not** a re-report of pass 1's *"Refunds are matched by `store_ref`, and
`store_ref` drifts"* — that finding is verified still open below. It is what has
happened to it since, which nobody has recorded.

**Pass 1 proposed two one-line mitigations.** One was *"include
`sub.orderId`/`voided.orderId` in the Google `refs`"*. The other was to stop a
forged notification revoking every holder of an access code.

**The second was implemented. It forecloses the first.** The 2026-09-17 rewrite
now carries, at `:436-438`:

> `// The ORDER ID IS NOT USED as a match key. It is attacker-controlled on a`
> `// public endpoint and shares a namespace with access codes; only the`
> `// purchase token identifies a real purchase.`

That reasoning is **right**. But `validate-purchase:220` still writes:

```ts
const store_ref = body.transactionId || body.purchaseToken || sku;
```

and `purchase.ts:85-89` sends **both** fields from the expo-iap purchase object.
On Android, OpenIAP supplies a `transactionId` (the Google order id,
`GPA.xxxx-xxxx-xxxx-xxxxx`) *and* a `purchaseToken`. The `||` takes the order id.

So: `entitlements.store_ref` holds the **order id**, and both Google refund paths
(`:439` voided purchase, `:462` `SUBSCRIPTION_REVOKED`) search **only** the
**purchase token**. The one field that could join them has been deliberately and
correctly banned from the match. **Every Android refund matches zero rows,
forever**, and does so while logging a cheerful *"google: voided purchase
confirmed by the store"* with `rows: 0`.

**What should happen:** a confirmed Google refund ends that member's access.

**Why the obvious fix is wrong:** flipping `:220` to prefer `purchaseToken`
breaks Apple, whose notifications key on transaction ids, and breaks the existing
rows. Putting the order id back into `refs` re-opens the forgery hole pass 1
found. The only fix that satisfies both is the one pass 1 already named and no
migration in this repo adds:

```sql
alter table public.entitlements add column if not exists store_original_ref text;
-- Apple: originalTransactionId.  Google: purchaseToken.
-- Written ONCE on first activation by validate-purchase, never overwritten —
-- not by a renewal, and not by redeem_access_code.
create index on public.entitlements (store_original_ref);
```

…with `markRefunded`/`markReinstated` matching on `store_original_ref` and
keeping the existing `.in('source', ['app_store','play_store'])` scope. That
single column closes this, the Apple renewal-id drift, and the access-code
overwrite at migration `:182` in one move.

**Note the sharp edge:** `store_ref` is the one thing standing between a real
refund and a member keeping paid access, and it is currently the *only* field
carrying that meaning while simultaneously being overwritten by
`redeem_access_code` with a coupon code. Until `store_original_ref` exists, a
subscriber who redeems any promo code becomes permanently unrefundable.

---

## 3 · The credential path — what the repo proves, and what it does not

The award-by-trigger finding is already open (pass 2, brief §"STILL OPEN"). I am
**not** re-reporting it. What follows is the narrower question I was asked:
*what does this repo actually show?*

### 3.1 · Proven by the repo

- **`submit_quiz` is what sets the trigger's input.** `REMOVE_V1_REMNANTS_2026_09_03/30_APPLY_quiz_functions.sql:262` —
  `if v_score >= v_pass_mark then v_new_status := 'complete';` followed by
  `update student_achievement_progress set status = v_new_status …`. That file
  *is* in the repo and *is* an APPLY script with a read-back check. This half is
  solid.
- **The trigger and its function are named, consistently, in five places** and
  nowhere defined: `trg_eval_credentials` (the trigger function),
  `student_progress_award` (the trigger), `evaluate_user_credentials` (the body).
  `docs/APE_SECURITY_AUDIT_2026_09_13.md:73` lists `trg_eval_credentials` as
  live with `anon ✗ / authenticated ✗ / volatile`;
  `docs/APE_STORE_SUBMISSION_PACK_2026_09_07.md:173` marks it `closed (trigger)`;
  `docs/APE_SECURITY_REVIEW_2026_08_28.md:127` flags
  `evaluate_user_credentials` and `trg_eval_credentials` for a mutable
  `search_path`. **The repo proves these objects exist in production.** It does
  *not* contain a single line of either body.
- **`credential_awards` has no DDL anywhere in the repo.** Three files reference
  the table; none creates it. The only structural facts recorded are
  `UNIQUE (user_id, credential_type, credential_id)` and a `revoked_at` column
  (`docs/audit/waveB_data-integrity-calc.md:16`).
- **No path in the client inserts into `credential_awards`.** Both readers
  (`features/awards/api.ts:87`, `features/credentials/api.ts:42`) are `select`
  with `.is('revoked_at', null)`. Confirmed by grep. So whatever writes that
  table is server-side only, and the only two candidates the repo names are
  `evaluate_user_credentials` (trigger) and `submit_final_exam`.

### 3.2 · NEW — applying the migration does not apply the gate

**Severity:** BLOCKER for the rule · **Confidence:** high — this is plainly
visible in the file.

`supabase/migrations/2026091801_paid_month_before_credential.sql` §4 (`:209-228`)
is **not SQL**. It is a comment block instructing a human to hand-edit the live
function body:

```
-- APPLY BY EDITING THE LIVE BODY AT THAT ONE LINE. start_final_exam is long and
-- this file deliberately does not carry a copy of it…
--     IF NOT public.has_academy_access(auth.uid()) THEN RAISE 'academy_required'; END IF;
--   + IF NOT public.member_month_complete(auth.uid()) THEN RAISE 'paid_tenure_required'; END IF;
```

The reasoning is sound (a stale paste would drop the D4 activation floor). The
**consequence is not documented anywhere**, and it is the kind of thing that gets
missed on a launch checklist: running this migration file adds two columns and
one predicate function and **enforces nothing**. `member_month_complete` would
exist, be granted to `authenticated`, and have **zero callers**.

Anyone reading `supabase/migrations/` and seeing a clean apply will reasonably
believe the paid-month rule is live. It will not be. The same is true of the
`submit_final_exam` guard described at `:226-228`, which is also prose.

**Fix:** either ship §4 as real SQL (fetch `prosrc`, splice, verify with a
read-back like `30_APPLY_quiz_functions.sql` already does at its foot), or add a
loud terminal banner to the file and a line to the launch runlist. A migration
whose most important clause is a comment needs to say so at the top, not at line
215.

### 3.3 · NEW — the moment the gate lands, a paying learner will see the raw string `paid_tenure_required` after finishing their capstone

**Severity:** MAJOR · **Confidence:** high

**Where:** `src/features/finalExam/api.ts:204-217` and
`src/screens/exam/FinalExamScreen.tsx:225-230`.

`startFinalExam` has a full error vocabulary — `ExamStartError`, ten codes,
`EXAM_START_ERROR_COPY`, `parseStartError` with a longest-first match so
`award_incomplete` cannot shadow `award_content_incomplete`. It is careful work.

`submitFinalExam` has **none**:

```ts
if (error) throw new Error(error.message);   // api.ts:213
```

and the screen's catch, for anything not matching its network regex:

```ts
notify('Submit failed', (e as Error).message, () => navigation.goBack());  // :229
```

So today, a learner who trips `not_owner`, `attempt_not_open`, `bad_serve_set`
or `user_not_found` gets a dialog whose body is that identifier, verbatim, and is
sent back.

That is already poor. What makes it a finding **now** is that the migration
explicitly plans to add a *new* raise on this exact path (`:226-228`: *"a refund
can land between starting an exam and finishing it"*). The instant that guard is
applied, a member whose refund landed mid-exam finishes a 10-minute graded
capstone and is shown:

> **Submit failed**
> `paid_tenure_required`

The copy for that code **already exists**, six lines away in the same module
(`EXAM_START_ERROR_COPY.paid_tenure_required`). It is simply not reachable from
the submit path.

**Fix:** give `submitFinalExam` the same treatment as `startFinalExam` — an
`ExamSubmitError` union, a `parseSubmitError`, and a copy map that reuses the
tenure string. Roughly fifteen lines, and it must land **before** §4 is applied,
not after.

### 3.4 · The progress write lockdown has no applied-marker

`docs/APE_RLS_PROGRESS_WRITE_LOCKDOWN_2026_09_10.SQL` converts four `own_*`
policies from `cmd = ALL` to `FOR SELECT`. Its own banner states the stakes: with
`ALL`, an authenticated user can `PATCH /rest/v1/student_achievement_progress`
and set `status='complete'` for any achievement, **and the AFTER trigger then
awards the credential**. That is credential forgery with the shipped anon key.

It sits in `docs/`, not in `supabase/migrations/`, and **no file in the repo
records it as applied** — no `✅ APPLIED` banner, no mention in the 2026-09-13
audit, no entry in `APE_LAUNCH_RUNLIST_2026_09_07.md`. The 2026-09-13 audit's
"Sensitive tables are locked" table covers `users`/`entitlements`/`glossary`/
`achievements` and **does not include `student_achievement_progress`**.

I cannot tell from here whether it ran. Given what it prevents, "probably" is not
good enough. §8 query 4 answers it in one line, and the file is idempotent, so
re-running it is safe either way.

---

## 4 · MAJOR

### 4.1 · `tube-image` reads `entitlements[0]` — the exact bug `EntitlementProvider` was fixed to stop doing

**Severity:** MAJOR (a paid feature locked) · **Confidence:** high on the code;
the impact depends on whether `UNIQUE (user_id, product)` is live (§4.5)

**Where:** `supabase/functions/tube-image/index.ts:75-84`.

```ts
const { data: ents } = await userClient.from("entitlements")
  .select("status, expires_at").eq("product", "academy");
const acad = (ents ?? [])[0] as {...} | undefined;
const entitled = !!acad && acad.status === "active" && (…);
if (!entitled) return json({ error: "forbidden" }, 403);
```

`src/features/commercial/EntitlementProvider.tsx` carries a comment saying, in
as many words, why this is wrong:

> *"A user may hold MULTIPLE academy rows (e.g. an expired one + an active one)
> with NO guaranteed order, so we scan for ANY active, non-expired row rather
> than trusting row `[0]` (owner debug audit — the old `[0]` could classify an
> active member as lapsed)."*

The client was fixed. The edge function was not, and it is the sole gate on the
paid Tube Reference images. A member whose expired admin-grant row sorts first
gets a 403 on every tube card while the app around them correctly says *member*.

Note the second-order symptom: `labAudio.ts` and `tubeRefs.ts` both map a 403 to
`reason: 'auth'`, so the UI will tell a paying member they need a membership.

**Fix:** three lines — `ents.some(r => r.status==='active' && (!r.expires_at || Date.parse(r.expires_at) > Date.now()))`,
ideally by calling the server's own `has_academy_access(auth.uid())` so there is
one definition of membership rather than three (client, `tube-image`, and
whatever `lab-audio` does — which this repo cannot show, §4.6).

**Also here:** `tube-image` does not consider `refunded_at`. Covered today by
`status` flipping to `'refunded'` — which §2.1 says may never happen.

### 4.2 · `docs/APE_OWNER_SQL_2026_09_07.sql` is a live landmine: re-running it silently reverts the 35-day month tier to 30

**Severity:** MAJOR · **Confidence:** high

**Where:** `docs/APE_OWNER_SQL_2026_09_07.sql:60` —
`v_days := case lower(p_plan) when 'month' then 30 when 'year' then 365 else null end;`
inside a `create or replace function public.admin_mint_access_code(…)`.

`docs/APE_MEMBER_TENURE_FOR_COMP_A.md:97-109` establishes that this was changed
**in production** to 35 and explains exactly why 30 can never work:

> *"a `grant_days = 30` code could never earn a credential. In a 31-day month
> `now() - interval '1 month'` is 31 days ago, so the code expired before it
> qualified."*

The repo copy was never updated. It is the **only** copy of
`admin_mint_access_code` in the repo, it is a `create or replace`, and its file
is a three-section owner-run script explicitly labelled *"you can run all three
at once"*. The next person — owner or agent — who opens the repo to find the
minting function, or who re-runs section 1 to re-widen the `source` constraint
(which is exactly what §2.1 recommends doing for `status`), silently reverts the
fix. Nothing in the file warns them.

Pass 1 flagged the stale value. What I am adding is the **mechanism**: it is not
a stale doc, it is an executable regression, co-located with a section someone
has a live reason to re-run this week.

**Fix:** change `30` to `35` in the repo copy and add a one-line banner —
`-- ⚠️ Section 2 is SUPERSEDED in production (month = 35 days). Do not re-run.`

### 4.3 · The Community Directory caches an empty chip vocabulary for the whole app run if five undocumented tables are deny-all

**Severity:** MAJOR if the tables lack a read policy; the caching bug is real
regardless · **Confidence:** high on the code, unknown on the tables

**Where:** `src/features/directory/api.ts:44-77`.

`fetchTaxonomy` is careful about the *error* case and returns `null` rather than
an empty taxonomy — the comment explains why, and it is right. But:

```ts
if (areas.error || specs.error || …) return null;
…
taxonomyCache = { areas: (areas.data ?? []).map(row), … };
return taxonomyCache;
```

A **deny-all** table does not error. `docs/APE_SECURITY_REVIEW_2026_08_28.md:105`
states the failure mode explicitly: *"If any client code ever queries one of
these directly… it will silently return **zero rows** instead of erroring. That
failure mode is invisible in testing."*

So five successful-but-empty selects produce a fully-populated `taxonomyCache`
object containing five empty arrays, cached for the process lifetime (only
cleared on account switch). Every chip row in the profile editor and the filter
panel renders blank — the exact outcome the `null` return was written to prevent,
arriving through the one door it does not cover.

**The tables are entirely absent from this repo.** `directory_areas`,
`directory_specialties`, `directory_specialty_areas`, `directory_roles`,
`directory_open_to` — zero hits across all 161 `.sql` files and all of `docs/`.
No DDL, no policy, no grant, no seed. I cannot say whether they are readable.

**Fix (client, independent of the answer):** treat an all-empty taxonomy as a
failure and do not cache it —
`if (!areas.data?.length || !roles.data?.length) return null;`. The taxonomy is
fixed reference data; zero rows is never a legitimate answer.

**Settles the server half:** §8 query 5.

### 4.4 · `entitlements` uniqueness: the repo asserts it both ways, and `validate-purchase` breaks if the wrong one is true

**Severity:** MAJOR · **Confidence:** medium — deliberately flagged as
conditional, because the repo genuinely contradicts itself

**The contradiction:**

- `SCHEMA_v213_MAPPING_LAYER_DDL_CANDIDATE.sql:103` declares
  `UNIQUE (user_id, product)`, and `validate-purchase:222` relies on it in a
  comment: *"There is a UNIQUE (user_id, product); read the one row if it
  exists."*
- `EntitlementProvider.tsx` says the opposite, and cites an **owner debug
  audit**, i.e. observed live data: *"A user may hold MULTIPLE academy rows…
  the old `[0]` could classify an active member as lapsed."*
- `redeem_access_code` (migration `:172-176`) hedges toward multiplicity:
  `select * into v_existing … order by expires_at desc limit 1`.

**If the constraint is NOT live**, `validate-purchase` misbehaves in a way that
defeats its own most carefully-reasoned code:

1. `:223-228` uses `.maybeSingle()`. With two rows that returns `PGRST116` and
   `data: null`, **and the error is not bound**, so `prior` silently becomes
   `null`.
2. `:269-270` then computes `member_since = nowIso` (because `!prior`).
3. `:283-285` takes the `insert` branch and writes a **third** row.

The file contains ~30 lines of commentary (`:237-271`) explaining that restarting
`member_since` on renewal would mean *"a monthly subscriber's clock restarted on
every restore, so they could NEVER satisfy `member_month_complete` and were
permanently denied every credential… It hit the cheapest plan only, which is the
worst possible group to quietly punish."* An unbound `.maybeSingle()` error
reintroduces exactly that, by a different route, and no amount of grace-window
reasoning downstream can see it.

**Fix regardless of the answer:** bind the error at `:223`. If it is `PGRST116`,
fall back to `.select(…).order('expires_at', {ascending:false}).limit(1)` and
**update** rather than insert. Never insert on a read that failed.

**Settles it:** §8 query 6.

### 4.5 · Four edge functions exist in production with no source in this repo

**Severity:** MAJOR (operational) · **Confidence:** high

`docs/APE_MEMBER_TENURE_FOR_COMP_A.md:70-71` enumerates the deployed functions:

> `tube-image`, `on-weekly-concept`, `validate-purchase`, `admin-codes`,
> **`lab-upload`, `lab-audio`, `lab-source-pull`, `lab-audio-load`**

`supabase/functions/` contains five directories. The four lab functions are not
among them — and **the app calls one of them on a paid path**:
`src/features/lab/labAudio.ts:63` invokes `lab-audio`, mapping 401/403 to
`reason: 'auth'` and rendering a membership wall.

So there is a second, independent implementation of "is this person a member"
that no one in this repo can read or review. Given §4.1 found the *readable* one
wrong, that matters. These four cannot be redeployed, rolled back, or diffed from
here; a `supabase functions download` for each, committed, would fix it.

---

## 5 · Edge functions — secrets, retries, and what they actually verify

| Function | Secrets | Missing secret | Idempotent under retry | Verifies what it claims |
|---|---|---|---|---|
| `validate-purchase` | 5 Apple + 2 Google (+ auto `SUPABASE_*`) | `appleAccessJwt`/`googleAccessToken` → `null` → `{valid:false}` → **grants nothing**. Correct | Yes — upsert-shaped. But see §4.4 | Calls Apple/Google's own APIs. **Does not bind the receipt to the caller** (pass 1, verified still open) |
| `store-notifications` | same 7 + `STORE_NOTIFY_SLUG` | no slug → 404 everything; no `SUPABASE_URL`/service → `200 "not configured"`. Correct | Yes — both writes are set-to-constant | **Yes, and this is now genuinely good.** Every path re-asks the store. The pass-1/2 holes are closed. But §2.3 |
| `admin-codes` | `ADMIN_EMAILS`, `ADMIN_PASSPHRASE`, `ADMIN_URL_SLUG`, `ADMIN_IP_ALLOW`(opt) | Any unset → deny (`ADMIN_EMAILS.length===0` and `PASSPHRASE.length===0` both fail closed). Correct | N/A (interactive) | Five layers, `getUser(token)` server-side, `aal2` claim, constant-time passphrase compare. **Clean** |
| `on-weekly-concept` | `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`(opt), `EMAIL_FROM`, `EMAIL_REPLY_TO`(opt) | no service key → `500 misconfigured`; no Resend key → email path off, push unaffected. Correct | **Weak — §5.2** | Bearer must equal the service key |
| `tube-image` | `PRIVATE_TUBE_BUCKET`(opt, defaults) | falls back to the still-public `tube-diagrams` bucket | Yes | §4.1 — `[0]` |

### 5.1 · `validate-purchase` and `store-notifications` answer no `OPTIONS`

**Severity:** MINOR (MAJOR only if the web build is meant to sell)

`validate-purchase:177` returns `405` for anything that is not `POST`, and sets
no CORS headers at all. `admin-codes` and `tube-image` both handle `OPTIONS` and
send `Access-Control-Allow-*`. A browser calling `supabase.functions.invoke`
preflights, gets a bare 405, and the purchase call never leaves the page.

The `ape-web` preview at localhost:8091 is the team's fast dev loop, and IAP is
native-only there anyway, so this is probably harmless. It is worth knowing
before anyone tries to sell from the web.

### 5.2 · NEW — the weekly-concept window and the cron interval may not tile, and a fixed slice of users would never receive one

**Severity:** MAJOR if confirmed · **Confidence:** low-medium — the arithmetic
depends on `get_due_concept_subscriptions`, which is not in this repo

`supabase/functions/on-weekly-concept/index.ts:5` documents the schedule:
*"Triggered by pg_cron every 15 minutes via net.http_post"*, and `:125-128`
describes the query as *"Subscriptions due in ±7 minutes (user TZ), not yet fired
today"*.

A ±7-minute window is 14 minutes wide. A 15-minute cron therefore covers 14
minutes out of every 15, and the windows do not overlap:

```
run at T    covers [T-7, T+7]
run at T+15 covers [T+8, T+22]
                    ↑ T+7.5 is in neither
```

A user whose chosen `send_time` lands in that ~1-minute gap has a **fixed**
time-of-day, so they fall in the gap **every week, forever**. That is ~1 minute
in 15 — around 6-7% of users — who switch the feature on, see their schedule
saved correctly in Settings, and never receive anything. There is no error, no
log line, and no delivery row: the loop simply never sees them.

Two things make this worth checking rather than dismissing: the send times are
user-chosen at minute granularity (`saveCategorySchedule` writes
`${hhmm}:00`), and the defaults are all `09:00`, which would hide the problem
completely during testing while leaving it live for everyone who customises.

**Fix if confirmed:** make the window ≥ the cron interval — `±8` minutes for a
15-minute cron (a 1-minute overlap, harmlessly absorbed by the "not yet fired
today" filter, which is what makes overlap safe and gaps not).

**Settles it:** §8 query 7.

### 5.3 · Delivery idempotency is thinner than the comment claims

`on-weekly-concept:216-231` labels its pre-send insert *"Pending delivery BEFORE
send (idempotency)"*. It is an unconditional `insert … .select('id').single()`.
Nothing in the repo shows a unique constraint on
`(user_id, concept_id)` or `(user_id, scheduled_at)`, and the real dedupe is the
*"not yet fired today"* clause inside an RPC this repo does not contain.

If the cron double-fires (a `net.http_post` retry, an overlapping run), the
second pass calls `get_next_concept` — which returns the *next undelivered*
concept, because the first is now recorded — and sends a **different** concept
minutes later. The user gets two. Low harm, but the comment asserts a guarantee
the code does not provide. §8 query 8.

### 5.4 · Apple `REVOKE` without a `revocationDate` does nothing

`store-notifications:354` treats `REVOKE` as a refund type, but `:389` only acts
`if (truth.revocationDate)`. Family-sharing revocation (the main producer of
`REVOKE`) removes a user's *access* without necessarily stamping a revocation
date on the transaction. The handler then falls to `:398` — *"apple: store
reports no revocation, nothing changed"* — and the removed family member keeps
Academy until the subscription's own expiry. Small, but it is a paid feature
staying open, and it is the kind of thing sandbox testing will not surface.

---

## 6 · Verification of what earlier passes left open on this axis

| Item | Status now |
|---|---|
| Pass 1 — *one store receipt can entitle unlimited accounts* | **STILL OPEN.** `validate-purchase:205-209` still verifies the receipt with Apple/Google and never checks that the transaction belongs to the caller. No `appAccountToken`, no `obfuscatedAccountId`, and no uniqueness check on `store_ref` |
| Pass 1 — *no subscription renewal ever reaches our server* | **STILL OPEN, and confirmed by grep:** `restorePurchases` has exactly one caller, `PaywallScreen.tsx:208` (the button). `initPurchases` has one, `:111` (paywall mount). No boot sync, no foreground sync. `store-notifications:367` still returns *"not a refund event, ignored"* for `DID_RENEW` and for Google types 2/4 |
| Pass 1 — *refunds matched by `store_ref`, and `store_ref` drifts* | **STILL OPEN and now strictly worse** — see §2.3 |
| Pass 1 — *one forged notification revokes every access-code holder* | **FIXED and verified.** `markRefunded:311` and `markReinstated:341` both carry `.in('source', ['app_store','play_store'])`. The Google voided path at `:418-434` now refuses to write unless the voided-purchases feed or a resolved purchase state confirms it |
| Pass 1 — *Google verification called with the wrong argument* | **FIXED and verified.** `googleTruthAnySku` (`:262-274`) resolves the token against each SKU sold, so a missing `subscriptionId` no longer blocks verification |
| Pass 2 — *Google refund path revoked on the request body alone* | **FIXED and verified** (`googleWasVoided`, `:232-256`, with a bounded 5-page scan and `null`-means-unknown semantics) |
| Pass 4 — *`user_topic_enrollments` is deny-all and the client now selects from it* | **FIXED and verified correct.** `enrollmentStore.ts:135-140` treats zero rows as *not confirmed*, and `:186-190` refuses to push a pristine seed over an unconfirmed list. The reasoning in the comments matches the security review's documented failure mode exactly. The one gap: the select requests a `position` column no repo file defines — if it does not exist the read 400s, which lands in the `error` branch and is handled |
| Brief — *the tenure migration and both edge functions are not deployed* | **Confirmed, and the deploy ORDER is now a blocker — §2.2** |
| Brief — *enrollments pushed but never pulled* | **FIXED** (`reconcileFromServer`, `:110-150`) |
| `admin-codes` labels a 35-day month code as `"35d"` | **STILL OPEN, and slightly worse than "cosmetic".** `planLabel` at `:395` is `d===30?"month"`, and `:418` filters `others` by the same labels — so in category view a month code is not merely mislabelled, it is filed under **`OTHER`** instead of `1 MONTH`. Admin-only. One character: `d===35` |

### 6.1 · Smaller contract-drift notes (MINOR)

**`expires_at` nullability.** The migration (`:165-167`) states *"entitlements.expires_at
is NOT NULL, so a perpetual comp uses a far-future sentinel"*. The only DDL in
the repo declares it nullable (`…CANDIDATE.sql:99`). `academyTierFromRows`'s
handling of *"a genuinely absent/null expiry keeps its old meaning (no end
date)"* is either live behaviour or dead code, and nobody can tell which. Harmless
today; worth pinning. §8 query 9.

**`start_quiz_attempt` overloads.** The live body is 2-arg
(`30_APPLY_quiz_functions.sql`, `CREATE OR REPLACE` with two parameters). A 3-arg
variant with `p_public_course_id uuid DEFAULT NULL` exists in
`audio_app_archive/v213_mapping_layer/SCHEMA_v213_COMMERCIAL_PROGRESSION_OptionB_CANDIDATE.sql`.
If both are somehow live, PostgREST cannot disambiguate a 2-named-arg call and
returns `PGRST203`, which would break every quiz. Almost certainly fine — the
candidate was never applied — but it is a one-line check. §8 query 10.

**`my_identity().single()`.** Called at `profile/api.ts:75`, `:155` and
`SettingsScreen.tsx:146`. `.single()` errors if the function returns zero rows.
All three call sites tolerate the error (two return `null`, one is inside a
`try`), so this is safe — noted only so nobody "fixes" it by removing a guard.

**`get_scenario_items` conflates failure with emptiness.** `mediaTypes.ts:38`
returns `[]` for both an RPC error and a genuinely empty topic, and the screen
renders its no-content state. The comment calls that *"honest"*, but it is honest
about the wrong thing — an outage reads as "this topic has no scenarios".
Low-stakes, and the same shape is handled correctly elsewhere in the codebase
(`fetchTaxonomy` returns `null`; `fetchAwardProgress` returns `null`).

### 6.2 · Checked and found nothing — worth saying

- **`mic_calibration_contributions`** is the cleanest server contract in the repo.
  `docs/MIC_CATALOG_2026_08_21.sql` grants INSERT only; the client uses
  `ignore-duplicates`, which is `ON CONFLICT DO NOTHING` and needs no UPDATE
  privilege; the `WITH CHECK` enum
  `('calibrator','type1_2_meter','consumer_app','eyeballed')` matches
  `ReferenceQuality` at `deviceProfile.ts:43` **exactly**; and the
  `offset_db between 0 and 200` bound comfortably contains the real range
  (`NOMINAL_OFFSET = 100`, `SplMeterScreen.tsx:121`). The aggregate is served
  through a definer view so raw rows are never client-readable. Nothing to fix.
- **The notification identity split** (`notification_concept_subscriptions` keys
  on `auth.uid()`, `notification_preferences` on `public.users.id`) is a
  genuinely nasty trap, and both the client (`weeklyConcept.ts:101-117`) and the
  edge function (`on-weekly-concept:150-172`) handle it correctly, each with a
  comment explaining why. It once silently broke every send; it does not now.
- **`calc_consume` / `calc_usage_status`** return shapes match
  `docs/APE_CALC_WEEKLY_LIMIT_2026_08_13.sql:38` and `:94` column for column.
- **`admin-codes`** — I went looking for a hole in the five-layer gate and did
  not find one. The passphrase compare is constant-time, the JWT is validated
  server-side rather than decoded, `aal2` is read from the token, and every
  unset secret denies. The `count` is clamped to 500.
- **The entitlement read path in the app** (`academyTierFromRows`) scans all
  rows, fails open only on an *unparseable* expiry, logs a count rather than an
  id, and never downgrades on a read error. It is correct, and it is the model
  `tube-image` should copy.

---

## 7 · Summary of what to do, in order

1. **Before deploying either edge function:** apply `2026091801`, then verify the
   two columns exist (§2.2). Wrong order = every purchase charges and grants
   nothing.
2. **Widen the `status` CHECK** to include `'refunded'` (§2.1), or the refund
   rule is unenforceable no matter what else ships.
3. **Add `entitlements.store_original_ref`** and match refunds on it (§2.3).
   Without it, Android refunds match zero rows by construction.
4. **Decide whether §4 of the migration ships as SQL or as a checklist item**
   (§3.2) — and if it ships, give `submitFinalExam` an error vocabulary first
   (§3.3).
5. Confirm the RLS write lockdown is applied (§3.4).
6. `tube-image` `[0]` → `some()` (§4.1); bind the `maybeSingle` error in
   `validate-purchase` (§4.4).
7. Fix the repo's `admin_mint_access_code` to 35 days before someone re-runs it
   (§4.2).
8. Make `fetchTaxonomy` reject an all-empty result (§4.3).

---

## 8 · Exactly what to run against production

Run as owner/`postgres` in the Supabase SQL editor, project
`yjgolswjggmlpeowvtxr`. All ten are read-only.

**1 — Does `status='refunded'` violate a CHECK? (settles §2.1, BLOCKER)**

```sql
select conname, pg_get_constraintdef(oid) as definition
  from pg_constraint
 where conrelid = 'public.entitlements'::regclass
   and contype  = 'c';
-- If any definition enumerates `status` and omits 'refunded',
-- every refund write is silently failing. Widen it before deploying
-- store-notifications.
```

**2 — Do `member_since` and `refunded_at` exist yet? (settles §2.2, BLOCKER)**

```sql
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entitlements'
 order by ordinal_position;
-- Both must be present BEFORE validate-purchase or store-notifications
-- is deployed.
```

**3 — What is actually deployed right now?**

```sql
-- In the Supabase CLI, not SQL:
--   supabase functions list --project-ref yjgolswjggmlpeowvtxr
-- Expect: tube-image, on-weekly-concept, validate-purchase, admin-codes,
--         lab-upload, lab-audio, lab-source-pull, lab-audio-load
-- validate-purchase and store-notifications must NOT be (re)deployed until
-- query 2 returns both columns.
```

**4 — Is the progress write lockdown applied? (settles §3.4)**

```sql
select tablename, policyname, cmd, roles
  from pg_policies
 where schemaname = 'public'
   and tablename in ('student_achievement_progress','student_method_progress',
                     'student_badges','quiz_attempts')
 order by tablename, policyname;
-- Every own_* policy must read cmd = 'SELECT'. Any 'ALL' is a credential
-- forgery vector: a PATCH setting status='complete' fires the award trigger.
```

**5 — Are the directory taxonomy tables readable at all? (settles §4.3)**

```sql
select c.relname,
       c.relrowsecurity                                    as rls_on,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as policies,
       has_table_privilege('authenticated', c.oid, 'SELECT') as auth_select,
       has_table_privilege('anon',          c.oid, 'SELECT') as anon_select
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public'
   and c.relname in ('directory_areas','directory_specialties',
                     'directory_specialty_areas','directory_roles',
                     'directory_open_to');
-- rls_on = true with policies = 0, or auth_select = false, means the
-- Community Directory renders every chip row blank with no error.
-- Follow up as a signed-in user:
--   select count(*) from public.directory_areas;
```

**6 — Is `UNIQUE (user_id, product)` live on entitlements? (settles §4.4)**

```sql
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid='public.entitlements'::regclass and contype in ('u','p');

select user_id, product, count(*)
  from public.entitlements
 group by 1,2 having count(*) > 1;
-- Any row from the second query means validate-purchase's .maybeSingle()
-- errors, `prior` reads null, and a THIRD row is inserted with a restarted
-- member_since — permanently denying that member a credential.
```

**7 — Does the weekly-concept window tile with the cron? (settles §5.2)**

```sql
select jobid, schedule, command
  from cron.job
 where command ilike '%on-weekly-concept%';

select prosrc
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='get_due_concept_subscriptions';
-- Compare the interval in `schedule` with the half-window in prosrc.
-- half_window*2 must be >= the cron interval, or a fixed slice of users
-- never receives a weekly concept.
```

**8 — Is the delivery insert really idempotent? (settles §5.3)**

```sql
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid='public.notification_concept_deliveries'::regclass
   and contype in ('u','p');
```

**9 — `entitlements.expires_at` nullability (settles §6.1)**

```sql
select is_nullable from information_schema.columns
 where table_schema='public' and table_name='entitlements'
   and column_name='expires_at';
```

**10 — Function inventory: what the client calls vs what exists**

```sql
select p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       p.provolatile, p.prosecdef,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec,
       has_function_privilege('anon',          p.oid, 'EXECUTE') as anon_exec
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in (
     'award_required_topics','community_profile_delete','community_profile_mine',
     'community_profile_public','community_profile_public_credentials',
     'community_profile_publish','community_profile_save',
     'community_profile_set_contact','community_profile_set_credentials',
     'community_profile_set_discoverable','complete_scenario_round',
     'contact_block','contact_message_send','contact_report',
     'contact_request_respond','contact_request_send','contact_thread_messages',
     'contact_threads','directory_search','get_academy_stats',
     'get_due_concept_subscriptions','get_glossary_definition',
     'get_glossary_term_count','get_next_concept','get_pace_records',
     'get_question_count','get_scenario_homework','get_scenario_items',
     'glossary_consume','glossary_usage_status','mark_lab_complete',
     'my_identity','record_pace_session','record_scenario_answer',
     'record_tool_usage','register_commercial_user','set_registry_listing',
     'start_final_exam','start_quiz_attempt','submit_final_exam',
     'sync_my_enrollments','member_month_complete','evaluate_user_credentials',
     'trg_eval_credentials','has_academy_access','admin_mint_access_code')
 order by p.proname;
-- Three things to read out of this:
--   (a) any name MISSING is an RPC that fails in production and nowhere else;
--   (b) start_quiz_attempt must return exactly ONE row (two overloads =
--       PGRST203 on every quiz start);
--   (c) member_month_complete present with no caller inside start_final_exam
--       means the migration was applied but the GATE was not (§3.2). Confirm with:
--         select prosrc from pg_proc where proname='start_final_exam';
--         -- grep it for member_month_complete
--   (d) admin_mint_access_code should contain `when 'month' then 35`, not 30.
```

**Bonus — the credential award path (already open; these finish the picture)**

```sql
select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public'
   and p.proname in ('evaluate_user_credentials','trg_eval_credentials');

select tgname, tgrelid::regclass, pg_get_triggerdef(oid)
  from pg_trigger where not tgisinternal
   and tgrelid = 'public.student_achievement_progress'::regclass;

select source, count(*) from public.credential_awards group by 1;
-- source='auto' rows belonging to users with no final_exam_attempts row
-- confirm that certificates are issued by the trigger, not by the exam.
```
