# APE Launch Triage — 2026-08-21

Owner-requested sort: **engine gates** (a tester hits a wall, gets wedged, or
loses progress) vs. **assets/polish** (top priority but not blocking the app
getting into people's hands). Findings from a full three-track code sweep
(access gating / core logic paths / backend dependencies); every item is
traced to file:line, not comments — the codebase has zero TODO markers.

Distinction used throughout: **TEST launch** = app in testers' hands now.
**COMMERCIAL launch** = public, money changes hands.

---

## STATUS (2026-08-21, code pass)

Code column DONE + typechecks clean (`tsc --noEmit` exit 0):
- ✅ **E3** fixed — `resolveItemCounts()` name-union added to both dashboard
  paths in [dashboard/api.ts](src/features/dashboard/api.ts).
- ✅ **E4** fixed — new [scenarioExempt.ts](src/features/study/scenarioExempt.ts)
  store; Scenarios screen marks confirmed-empty topics + distinguishes load
  errors; Dashboard honors the exemption in the quiz gate.
- ✅ **E5** fixed — [sync.ts](src/features/study/sync.ts) now enqueues on
  non-network rejection (durable retry, no silent loss); error checks added to
  `record_scenario_answer` + `credit_time_trial`.
- ✅ **E6** fixed — Matching / Fill-in-Blank / Quiz now show an exit instead of
  an endless spinner on empty content.
- ✅ **E2** fixed (in-app OTP recovery) — [auth/api.ts](src/features/auth/api.ts)
  + [AuthScreen.tsx](src/screens/auth/AuthScreen.tsx). **Owner step DONE
  2026-08-21:** Reset Password email template now includes `{{ .Token }}`.

**OWNER SQL / CONFIG — ALL RUN 2026-08-21:** EAS env vars added (E1); reset email
`{{ .Token }}` added (E2); `APE_LABS_CATALOG_SEED_2026_08_12.sql` run;
`APE_ACCESS_CODES_2026_08_21.sql` run + test code `TESTCOMP` created. Remaining
owner task: the device pass (below).
- ✅ **E1 DONE (2026-08-21)** — EAS had ZERO env vars (would boot-crash any cloud
  build). Added `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` to
  development/preview/production on project @cbcreativeservices/ape-studio via
  `eas env:create`. Verified present in all three.

### Gating-idiom + cosmetic pass (2026-08-21) — typecheck clean

- ✅ **Gating idioms unified (deliberate split preserved).** ToolLockUi documents
  that member-perk gates use real `entitlement === 'academy'` on purpose, so the
  dev caps-bypass doesn't hide them while testing the free experience. The two
  idioms are correct; the problem was ad-hoc recomputation at ~11 sites. Added a
  single documented `isMember` to EntitlementProvider (real standing, NOT
  bypass-aware) and routed every perk gate through it (tools, glossary, EarLab,
  AudioLearning, ColorWheel, Tube ref, Enrollment, Calc workflows, ToolInfo,
  programStub). Status displays stay on raw entitlement. Behavior-neutral.
- ✅ **Scenarios meter cosmetic fixed** — one `smoothPct` helper treats a
  confirmed-empty topic as 100% for scenarios everywhere it's displayed (rack
  tile, overall %, jog preview), so the meter matches the unlocked quiz.
- ✅ **Awards empty-state added** — specialization/program pickers now show a
  loading vs. honest "unavailable right now" message instead of a bare banner
  over blank (added a `v3Loaded` flag).

## STATUS (2026-08-21, logic-leak + honesty pass) — all typecheck clean

- ✅ **Stay-logged-in** inert checkbox removed (session always persists).
- ✅ **CONTINUE LEARNING** gate bypass closed — only academy members deep-resume
  into a method; others route through the gated Dashboard
  ([EnrollmentScreen.tsx](src/screens/enrollment/EnrollmentScreen.tsx)).
- ✅ **AI-stub course card** no longer upsells existing members — shows COMING
  SOON to academy ([CourseSelectionScreen.tsx](src/screens/courses/CourseSelectionScreen.tsx)).
- ✅ **ToolInfo → SignalGen fallthrough** replaced with an explicit route map
  ([ToolInfoScreen.tsx](src/screens/tools/ToolInfoScreen.tsx)).
- ✅ **Dev guest-latch** cleared on SIGNED_IN (dev-only; fixes owner QA where
  Guest-then-login stayed gated).
- ✅ **Fabricated credentials made honest** — Directory Registry ID/URL/date and
  the Profile Student-ID QR now show a "pending issuance" state, no fake
  verifiable-looking data ([DirectoryScreen.tsx](src/screens/directory/DirectoryScreen.tsx),
  [ProfileScreen.tsx](src/screens/profile/ProfileScreen.tsx)).
- ✅ **KT88 p1File alias** — SKIPPED per owner; promo tube gets deleted before
  launch (still tracked in memory).

## PROMO / ACCESS CODES (owner: launch feature — comps, bulk, event discounts)

Owner clarified the code field is NOT vestigial — it comps influencer/free
accounts, bulk seats, and event discounts, and must ship at launch.

- ✅ Client BUILT + typecheck clean: [accessCode.ts](src/features/commercial/accessCode.ts)
  (redeem RPC wrapper, fails open), redemption wired into Create Account
  ([AuthScreen.tsx](src/screens/auth/AuthScreen.tsx)) AND Settings → MEMBERSHIP →
  Redeem code for existing users ([SettingsScreen.tsx](src/screens/settings/SettingsScreen.tsx)).
  New `refreshEntitlement()` on the provider re-reads server truth after redeem.
- ✅ Backend migration DRAFTED (owner-run): [APE_ACCESS_CODES_2026_08_21.sql](docs/APE_ACCESS_CODES_2026_08_21.sql)
  — `access_codes` + `access_code_redemptions` tables + `redeem_access_code()`
  SECURITY DEFINER RPC, verified against live schema. Narrow frozen-backend
  amendment (mic-catalog pattern). Includes admin seed examples.
- **Launch scope:** GRANT codes (comp academy) are functional. DISCOUNT codes
  return `discount_pending` — they need the IAP/checkout flow (not built), so
  they can be seeded now but only apply once purchasing ships.
- ⏳ OWNER: run the SQL; create codes; device-test one comp code end-to-end.

## IAP — NEXT SESSION (turnkey notes; not started, nothing half-built)

The backend is already purchase-ready: `entitlements(user_id, product, status,
source, expires_at, store_ref)` + a `products(code, price_cents, interval, source
default 'ccode')` table. So NO RevenueCat needed — direct store purchase → server
validate → write entitlements fits the existing schema.

Plan for next session:
1. Add `react-native-iap` (Expo config plugin) → requires a new dev build.
2. Products: 3 plans in PaywallScreen — lifetime $99.99, annual $59.99, monthly
   $9.99 ([PaywallScreen.tsx:21-26](src/screens/commercial/PaywallScreen.tsx)).
   Create matching App Store / Play product IDs; seed the `products` table.
3. Client `purchase.ts`: buy → get receipt → call a Supabase edge function.
4. Edge function `validate-purchase`: verify receipt with Apple/Google, then
   INSERT/UPDATE entitlements (source 'appstore'/'playstore', store_ref =
   transaction id, expires_at per plan) — mirrors the access-code RPC's write.
5. Wire PaywallScreen CONTINUE (`onPress={undefined}` at :87) → purchase.ts;
   call refreshEntitlement() on success (already exists on the provider).
6. Restore-purchases button (App Store requirement).
Testing is NOT blocked on this — comp codes already grant academy.

## 🔴 ENGINE GATES — must fix before testers

### E1. Boot: EAS builds may crash on missing env vars
- `.env` is in `.easignore` (line 24) and no EAS profile in `eas.json` has an
  `env` block. `src\lib\env.ts:10-19` falls back to `''`, and
  `src\lib\supabase.ts:14` calls `createClient('')` at module import →
  **hard crash at boot** in any cloud build unless the EAS dashboard
  Environment Variables supply `EXPO_PUBLIC_SUPABASE_URL/KEY`.
- Action: verify EAS dashboard env vars exist for all profiles (owner,
  dashboard) — or add an `env` block / build-time check.
- Note: the 2026-08-21 dev builds compiled and ran, so the dashboard vars
  likely exist — but VERIFY, don't assume, before the first tester build.

### E2. Password reset is a black hole
- `src\features\auth\api.ts:92` calls `resetPasswordForEmail(email)` with no
  `redirectTo`; `app.json` has **no URL scheme**; `detectSessionInUrl: false`;
  no set-new-password screen exists. The UI says "email sent" — the link can
  never return to the app. **A locked-out tester is locked out forever.**
- Fix: add `scheme` to app.json + deep-link handling + a NewPassword screen,
  or interim: an in-app "reset via emailed 6-digit OTP" (supabase
  `verifyOtp type:'recovery'`) which needs no deep link.

### E3. First-topic wedge: duplicate-achievement item count = 0%
- Dashboard denominators (`src\features\dashboard\api.ts:188-194`, `:284-294`)
  count glossary terms by single `achievement_id`. The study fetch
  (`src\features\study\api.ts:86-138`) documents that several v3 achievement
  rows share one topic NAME with terms mapped to only one id — **explicitly
  naming Professional Audio Safety (gs3060), the auto-enrolled free topic**.
  Affected topic: flashcards load fine but Dashboard % stays 0 forever →
  fill-in-blank/matching/scenarios/quiz never unlock. First thing a new
  tester touches.
- Fix: apply the same sibling-name union in dashboard/api.ts that study/api.ts
  already implements.

### E4. Scenarios wedge: topics with no scenario content can never complete
- `DashboardScreen.tsx:1125-1192`: `scenariosComplete >= 100` is an
  unconditional term of quiz unlock; scenarios % reads server
  `completion_pct` only (`:231-233`). `ScenariosScreen.tsx:192-195` renders
  "This topic doesn't include scenario drills" when the RPC returns empty —
  but the topic is then **permanently un-completable, quiz locked forever**.
  Any `get_scenario_homework` error (incl. guest 403) hits the same wall.
- Fix: when the server confirms zero scenario rounds for a topic, treat
  scenarios as satisfied (or exempt from `allMethodsComplete`) — and
  distinguish "RPC failed" from "no content."

### E5. Silent study-progress loss on non-network errors
- `src\features\study\sync.ts:189` drains the event buffer BEFORE the RPC;
  `:198-205` re-queues only network errors — an RLS denial, missing function,
  or guard rejection discards the batch with a console.warn. No screen wires
  `onRejected` (all pass `() => {}`). Same dead-catch pattern:
  `record_scenario_answer` (`scenarioHomework.ts:138-143`, no error check),
  `credit_time_trial` (`timeTrial.ts:332-336`, no error check) — supabase-js
  RETURNS errors, it doesn't throw, so those try/catches are dead code.
- Fix: enqueue unknown errors as retryable (splice back / re-queue), add
  error checks to the two naked RPCs, optionally surface onRejected.

### E6. Spinner traps: empty study screens with no exit
- StudyStack has `headerShown:false, gestureEnabled:false`
  (`src\navigation\StudyStack.tsx:32`). `MatchingScreen.tsx:293-299`,
  `FillInBlankScreen.tsx:265-272`, `QuizScreen.tsx:297-304` render a bare
  spinner forever when items are empty — no StudyHeader, no back. Only
  escape is the bottom tab bar.
- Fix: give the three screens the same nocontent-with-header state
  Flashcards/Scenarios already have.

---

## 🟠 THE BIG ONE — no purchase path (commercial launch only)

- `PaywallScreen.tsx:87`: CONTINUE `onPress={undefined}` — intentionally
  inert ("UI ONLY" per header). **No IAP SDK is installed at all** (no
  react-native-iap / RevenueCat / Stripe anywhere). The ONLY ways to become
  `academy`: __DEV__ long-press toggle, or a hand-inserted row in the
  Supabase `entitlements` table.
- **TEST launch: NOT blocking** — grant testers membership by inserting
  `entitlements` rows (product 'academy', status 'active') by hand.
- **COMMERCIAL launch: the largest remaining build** — store products +
  IAP/RevenueCat + server-side receipt → entitlements writer. Plan as its
  own phase.
- Related: the entitlement read failure fallback silently downgrades a paying
  member to 'free' (`EntitlementProvider.tsx:151`) — revisit with the IAP work.

---

## 🟡 OWNER-RUN SQL / DECISIONS (no client code needed)

| Script | Effect until run | Verdict |
|---|---|---|
| `docs\APE_LABS_CATALOG_SEED_2026_08_12.sql` | mark_lab_complete → lab_not_found; client retries at boot (self-healing) BUT device-local backlog is wiped on account switch | **Run before testers** |
| `docs\APE_CALC_WEEKLY_LIMIT_2026_08_13.sql` | Calc limit fails OPEN by design — unlimited free calcs, counter hidden | Business call; fine to defer for testing |
| `docs\APE_CABLE_LAB_SEED_2026_08_15.sql` | Intentionally deferred to cable-lab launch (raises bar retroactively) | Hold, per script header |
| `docs\MIC_CATALOG_2026_08_21.sql` | Feature inert, queue preserved | Post-launch, ratified R2 |
| Tester entitlements | Hand-insert `entitlements` rows for testers | Needed for any paid-content testing |

## 🟡 SMALLER LOGIC LEAKS (fix when convenient, pre-commercial)

- **Access/promo code field is decorative** — `AuthScreen.tsx:54,222-232`
  collects it, `:120` never sends it. Hide the field for now (backend frozen).
- **CONTINUE LEARNING bypasses gates** — `EnrollmentScreen.tsx:612-624`
  resumes a lapsed member straight into paid study; no unlock/membership check.
- **Dev guest-latch** (__DEV__ builds only): tapping Guest then logging in
  keeps the dev override latched until SIGNED_OUT
  (`EntitlementProvider.tsx:135,154,199-204`) — confuses owner testing only.
- **Two gating idioms disagree** — `entitlement === 'academy'` call sites vs
  `caps.*`; `bypassAcademyLocks` only moves `caps`. Unify eventually.
- **AI stub course card upsells existing members** —
  `CourseSelectionScreen.tsx:965,512-552`: always-locked, no entitlement check.
- **Enrollment % uses legacy rules** (`enrollmentProgress.ts:67-86`:
  applicable_methods + methodConfigs) → guests see 0%, scenarios % disagrees
  with Dashboard. Display-only.

---

## 🟢 CONFIRMED NOT BLOCKING (assets/polish — your instinct was right)

- Images/photos, intro/tutorial placeholder copy (labeled PLACEHOLDER),
  trophy art, help popups, quiz Alert styling, awards empty-state visuals.
- Fake Registry ID (`DirectoryScreen.tsx:39-42`) + fake QR on Student ID
  (`ProfileScreen.tsx:88-98`) — cosmetic BUT must be real or removed before
  commercial launch (they present as verifiable credentials).
- "Stay logged in" checkbox inert (never read; session always persists).
- KT88 `p1File` alias broken (gated `fetchTubePageUri` posts only
  {stem,page}, `tubeRefs.ts:191-202`; zero readers of p1File) — screenshot
  asset; tube deleted before launch anyway.
- ToolInfo falls through to SignalGen for unknown keys — currently
  unreachable; guard cheaply.
- Stale comments: enrollmentStore.ts:14, awardsData.ts:146,274,
  DashboardScreen.tsx:698 "(M6)" alert.

## ✅ VERIFIED SOUND — no action

- Dev-bypass hygiene: every flag hard-guarded by __DEV__ at accessor AND
  setters; nothing leaks to preview/production builds.
- Guest data wipe: fully implemented incl. guest-relaunch case
  (`clearLocalAccountData.ts`, `EntitlementProvider.tsx:163-170`).
- Auth signup/login/session persistence: real and complete.
- Enrollment store + debounced `sync_my_enrollments` push: works, local-first.
- Labs → certificate chain: wired, self-healing retry (needs seed SQL).
- All 8 tools, all calc workspaces, all lab routes: live, no dead screens.
