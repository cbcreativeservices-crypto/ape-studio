# Error/Empty/Loading Triad Audit — night 2026-09-13

**House rule under audit:** loading, error+Retry, and genuinely-empty are THREE DIFFERENT STATES and must render distinctly. A failed fetch must never render as "0 items"; an error must offer Retry; neither may strand the user.

**Scope:** every screen under `src/screens/**` changed since 2026-09-10, plus enrollment (BROWSE & ADD), awards/certificates/programs, careerfinder, help hub, study method screens, notifications — and a fail-open vs fail-closed pass over new code since 2026-09-10.

**The four questions per fetch:** Q1 does failure render distinctly from empty? · Q2 is there a Retry? · Q3 any `.then()` without `.catch()` risking an unhandled rejection? · Q4 offline: spinner forever, silent blank, or honest message?

**Calibration exemplars, re-verified and still holding:** AchievementsHomeScreen (error card + Retry, loading placeholders), GlossaryScreen corpus load (loading / offline-card+Retry / "No results" all distinct), directory EmptyState + RequestsView three-state machine, TubeCardScreen (spinner / reasoned failure copy / RETRY), CurriculumScreen M15 state machine.

---

## Systemic root cause

`src/data/v3Curriculum.ts:61,87-89,136-138,165-167` — `fetchV3Curriculum` / `fetchV3Programs` / `fetchV3Certs` swallow every error and return `[]`. The docblock even blesses it ("callers render an honest empty state") — which is exactly the dishonest-state the house rule forbids. CurriculumScreen (M15 machine) and AwardsScreen (`v3Loaded` flag) each built local compensation; EnrollmentScreen consumed it raw with none. **Fix at the source:** have the helpers throw or return a tagged result, or mandate the M15 pattern at every consumer.

A second load-bearing repeat offender: `refreshEntitlement()` (src/features/commercial/EntitlementProvider.tsx:360) awaits `supabase.auth.getSession()` un-guarded and can reject — three findings below (Paywall :51, Paywall :126, Settings :107) trace to callers assuming it never does. One internal try/catch there closes all three.

---

## Case list

### Stranding (5)

- src/screens/commercial/PaywallScreen.tsx:51 — Q3+Q4 — `void refreshEntitlement().then(...)` in the purchase-success path has no `.catch`; a `getSession()` rejection AFTER a successful, charged purchase leaves `busy` spinning forever with no welcome and no navigation — add a catch that clears busy and still confirms the purchase — severity: stranding
- src/screens/enrollment/EnrollmentScreen.tsx:204,230-231 (render 1583-1657) — Q1+Q2+Q4 — BROWSE & ADD has no loading/error/retry state at all; the v3 helpers return `[]` on failure, so on a dead connection every browse tab (Certificates/Programs/Subjects/Fields/Topics) is a silent blank with no message and no Retry for as long as the screen stays mounted — port the CurriculumScreen M15 `loading`/`ready`/`error`+RETRY machine — severity: stranding
- src/screens/tools/EngineGate.tsx:38-41 — Q2 — the CAPTURE ERROR card says "Try again" but renders no Retry control, and on 'error' both hosts hide their START affordance (SplMeterScreen.tsx:1359, FrequencyCounterScreen.tsx:594-596), so recovery requires leaving and re-entering the screen — add an `onRetry` prop rendering a RETRY button — severity: stranding
- src/screens/achievements/CredentialWall.tsx:71,105,206 — Q4 — the two fetches share one `failed` flag but the error card renders only when `rows` is empty, so `fetchNearestCredential` failing while earned rows loaded leaves the WaitingSlot on "Finding your next certificate…" permanently with no error and no retry — track the nearest-slot failure separately — severity: stranding
- src/screens/awards/AwardProgressScreen.tsx:146-162 — Q2 — the failed state's copy promises "Pull to retry" (line 154) but that branch is a plain `View` with no ScrollView/RefreshControl and no Retry button (RefreshControl exists only in the success branch, line 177); only Back + re-enter recovers — add a Retry button or wrap the error view in a refreshable ScrollView — severity: stranding

### Dishonest-state (11)

- src/features/tools/measure/measurementStore.ts:176-177 — Q1 — hydrate()'s catch sets `list = []` and `hydrated = true`, so a failed/corrupt SQLite read reaches MeasurementLibraryScreen (:713-722) as the "NO SAVED MEASUREMENTS YET" empty card — add a `loadFailed` flag in the store and a distinct error card + Retry in the screen — severity: dishonest-state
- src/screens/lab/calc/workflowStore.ts:47-54 — Q1 — an unreadable blob is quarantined under `:damaged` and the collection loads as `[]`, but nothing ever reads `:damaged` back, so CalcWorkflowsScreen.tsx:223-227, CalcResultsScreen.tsx:85-87 and CalcProjectsScreen.tsx:184 render a corrupted store as "Nothing saved yet" — surface a "some saved items couldn't be read" notice when the damaged key exists — severity: dishonest-state
- src/screens/enrollment/EnrollmentScreen.tsx:750-752 — Q1+Q2 — `openCustomList`'s `catch { setCustomListRows([]) }` makes a failed `fetchGlossaryItemsByIds` render the genuine-empty copy "No terms yet — star terms in the Glossary…" (:1832) plus "· 0" (:1816) to a user who HAS starred terms — track the error separately and offer Retry — severity: dishonest-state
- src/features/enrollment/enrollmentProgress.ts:7-8,100-101 (consumed by EnrollmentScreen.tsx:544, HomeSetupSheet.tsx:114) — Q1 — any fetch error resolves to an empty map, so every LED meter, "Continue Learning" pick, and done/not-started filter reads a member's real progress as 0% with no error signal — return a tagged failure and let the consumers show a stale/unknown marker — severity: dishonest-state
- src/screens/achievements/GalleryScreen.tsx:50 — Q1+Q2 — `.catch(() => setEntries([]))` renders a failed fetch as "Earn your first trophy to see it here" with no Retry — add an error state + Retry like AchievementsHomeScreen — severity: dishonest-state
- src/screens/profile/ProfileScreen.tsx:205 — Q1 — `fetchMyCredentials().then(setCredentials, () => {})` leaves `credentials` at `[]` on failure, and the earned-credentials section hides entirely when empty (:978), so an offline member's earned credentials silently vanish from Profile — track the failure and say so — severity: dishonest-state
- src/screens/directory/MyProfileView.tsx:155 — Q1 — `fetchMyCredentials().catch(() => [])` makes a failed read hide the FEATURED CREDENTIALS section (`creds.length ?` at :528) exactly as if the member had earned none — severity: dishonest-state
- src/screens/glossary/GlossaryScreen.tsx:1762-1778 — Q1 — the topics fetch destructures `{ data: topicRows }` and ignores `error`, so a failed read renders the Topic picker as an empty A–Z list, indistinguishable from "no topics exist" (the corpus read beside it throws correctly) — check the error and surface it — severity: dishonest-state
- src/screens/commercial/PaywallScreen.tsx:120-123 — Q1 — `restorePurchases()` returns false both for "no prior purchase" and for a thrown/network failure (src/features/commercial/purchase.ts:220-223), and the screen then asserts "No previous Academy purchase was found for this store account" — distinguish failure ("couldn't reach the store — try again") from genuinely nothing — severity: dishonest-state
- src/screens/lab/cable/lessons/connectorCard.tsx:97-103 — Q1+Q4 — the remote Supabase-bucket connector photo `<Image>` has no `onError`, no loading indicator, no fallback: offline, the identification card shows a silent blank frame identical to an unmapped connector — add onError → honest "photo unavailable" fallback — severity: dishonest-state
- src/screens/lab/calc/CalcWorkspaceScreen.tsx:164-167 (with src/features/lab/calcUsage.ts:43-49) — Q4 — the weekly cap fails OPEN on any RPC error/offline: the answer reveals silently and the "#/5" counter is simply hidden (:153-154), so the user is never told the cap wasn't checked or counted — show a subtle "usage not counted — offline" note and log the unavailable path — severity: dishonest-state

### Hygiene (18)

- src/screens/awards/AwardsScreen.tsx:375,378 — Q3 — two bare `AsyncStorage.getItem(...).then(...)` with no `.catch`; a storage read CAN reject (the Android CursorWindow class measurementStore documents; FlashcardsScreen:1140-1146 already fixed its own) — add `.catch(() => {})` — severity: hygiene
- src/screens/awards/AwardsScreen.tsx:657-662,773-778 — Q1(partial)+Q2 — the pickers' "aren't available right now… check your connection" copy is shown for both error and (theoretical) true empty, and there is no Retry control (recovery = close and reopen) — add a RETRY button to the `v3Loaded && length===0` branch — severity: hygiene
- src/screens/help/HelpScreen.tsx:159-161 — Q3 — `Promise.all([resetCoachMarks(), …]).then(notify)` with no `.catch`; `resetCoachMarks` is a bare `AsyncStorage.multiRemove` (src/lib/coachMark.ts:38-40) that can reject → unhandled rejection and no confirmation — severity: hygiene
- src/screens/settings/SettingsScreen.tsx:712,726 — Q3 — the same reset chains (`Promise.all([resetCoachMarks(), …]).then`, `resetAskModes().then`) with no `.catch` — severity: hygiene
- src/screens/settings/SettingsScreen.tsx:105-113 — Q3 — `submitRedeem` has try/finally but no catch; `await refreshEntitlement()` (:107) can reject (getSession), leaving the redeem dialog open with no feedback — severity: hygiene
- src/screens/settings/SettingsScreen.tsx:203-210 — Q1 — a failed `updateNotificationPref` write silently snaps the toggle back with no notice — say the save failed — severity: hygiene
- src/screens/settings/SettingsScreen.tsx:134-136 — Q1 — `fetchWeeklySubscriptions().catch(() => {})` leaves the 7 category schedules at defaults on a failed read, presented as the user's real settings — severity: hygiene
- src/screens/study/FlashcardsScreen.tsx:1172-1181 — Q2 — the "Could not load this topic" error state offers only Back, no Retry (the load effect re-runs only on remount) — severity: hygiene
- src/screens/study/FillInBlankScreen.tsx:329-341 — Q2 — same pattern: error state has Back but no Retry — severity: hygiene
- src/screens/study/MatchingScreen.tsx:400-411 — Q2 — same pattern: error state has Back but no Retry — severity: hygiene
- src/screens/study/ScenariosScreen.tsx:365-379 — Q2 — the 'error' view correctly refuses to mark the exemption but offers no in-place Retry, only "go back and open Scenarios again" prose — severity: hygiene
- src/screens/achievements/TopicsScreen.tsx:100-106 — Q2 — the load-error copy says "try again" but offers no Retry control (reload only on re-focus) — severity: hygiene
- src/screens/achievements/TopicsScreen.tsx:87-89 — Q1 (loading vs loaded) — while `fields === null` the header asserts "0 / 0" earned over a silently blank body; show "— / —" placeholders like AchievementsHome — severity: hygiene
- src/screens/commercial/PaywallScreen.tsx:126 — Q2+Q4 — restore's `.catch(() => setBusy(false))` swallows the error with no message: the button just stops spinning — severity: hygiene
- src/screens/careerfinder/CareerFamilyScreen.tsx:51 — Q1 (mild) — on a failed `fetchV3Curriculum` the START LEARNING topics render as the `officialTopicName` last-resort literal with no loading/error distinction (helper swallows, so no rejection risk) — severity: hygiene
- src/screens/enrollment/HomeSetupSheet.tsx:86-95 — Q1 (mild) — v3 name-resolution failure silently falls back to the retired v2 matrix then "this topic", indistinguishable from loaded — severity: hygiene
- src/screens/glossary/GlossaryScreen.tsx:2153 — Q3 — `void listBookmarkContexts().then(setBmContexts)` has no `.catch`, and `AsyncStorage.getAllKeys()` sits OUTSIDE the helper's try (src/features/flags/flaggedStore.ts:222) → possible unhandled rejection, switcher silently empty — severity: hygiene
- src/screens/glossary/GlossaryScreen.tsx:2370-2378 — Q4 — `onExpired`: when `getGlossaryStatus` returns `unavailable` (offline) the elapsed lock stays up with no message and no retry — the one cap path that fails closed silently — severity: hygiene
- src/screens/tools/MeasurementLibraryScreen.tsx:713 — Q1 (loading vs empty) — `useMeasurements` returns `[]` before hydration resolves, so the empty card flashes as the first paint on every open; gate on a `hydrated` boolean — severity: hygiene
- src/screens/lab/foundations/FoundationsCourseScreen.tsx:171-173 (also 236-238, 272-274) — Q1 borderline — `ApeDsp.genStart()` failure is swallowed with only `playing=false`; the press is a silent no-op with no engine-failed message — severity: hygiene

*(20 hygiene rows listed; the two "(mild)" name-fallback cases are judgment calls a reviewer may waive.)*

---

## Fail-open vs fail-closed — new code since 2026-09-10

Flagged (decide or add the missing test):

- **src/features/lab/calcUsage.ts:43-49,58-64,72-75 — calc weekly cap fails OPEN** on any RPC error, missing function, or offline (`OPEN = { allowed: true, unavailable: true }`). Deliberate — but this is exactly the class that hid the dead glossary cap for 3 days, and there is **no happy-path test**: `test/` has no calcUsage/cap test (only calcDegenerate math tests), so a dead `calc_consume` RPC would again be invisible. Add a test that asserts the cap actually blocks at 5 when the RPC answers.
- **src/screens/lab/calc/CalcWorkspaceScreen.tsx:164-167** — the UI half of the same fail-open: silent, no "not counted" notice (filed above as dishonest-state).
- **src/features/commercial/accessCode.ts:85 — misleading "fail open" comment**: the behavior is actually fail-CLOSED-safe (returns `unavailable`, grants nothing); reword the comment so a future editor doesn't "fix" it into a real fail-open — hygiene.

Reviewed and accepted as deliberate (documented in-source, no action):

- src/features/commercial/entitlementExpiry.ts:119-137 — unparseable `expires_at` fails OPEN by explicit owner ruling 2026-09-11, with a count-only observability log; parse-failure ≠ expiry.
- src/features/commercial/EntitlementProvider.tsx:245-255,289 — transient read failure never downgrades tier; bounded retry; `resolved` flips in a finally. (Its un-guarded `getSession()` at :360 is the rejection source filed above.)
- src/features/commercial/studyGate.ts:42-46 — `!resolved` reads as unlocked (member-favouring) but the study screens still gate on the server, so it can only delay a lock, never grant; the free-topic check fails CLOSED on missing gs.
- src/features/glossary/glossaryGateway.ts:52-67 — probe network failure is NOT cached and reads 'absent' (never 'deployed'), so offline users get the honest corpus error card, not a consent dialog they can't act on; metered reads return typed faults.
- src/features/glossary/glossaryCap.ts:28,51,107-128 — device-local mirror fails open by design; the LIVE count is now server-side (the gateway), so this is display-only.
- src/features/glossary/deviceKey.ts:100-131 — mint failure returns typed reasons and the screen fails open for guests rather than looking broken; two anti-duplicate-key guards verified.
- src/features/account/SingleDeviceGuard.tsx:9 / SessionExpiryGuard.tsx — any error → no action (never a spurious logout); enforcement deferred, availability protected.
- web/lib/gate.ts:22,44-53 — the site gate fails CLOSED on missing env secrets (random unguessable key) and logs loudly; same-value paste-error also detected. Correct direction.
- src/features/finalExam/api.ts:139-158,170-227 — storage hiccups can no longer refuse an exam start or mislabel a submitted capstone; offline submits queue.
- web/app/connect + web/components/connect/ConnectForm.tsx — no network calls at all (mailto composition); validation errors render with `role="alert"`.

---

## Checked and clean

Cleared with reasons (file — why it passes):

- src/screens/achievements/AchievementsHomeScreen.tsx — exemplar holds: error card + Retry (:98-106), keeps stale hub on refresh failure, loading placeholders distinct from empty.
- src/screens/glossary/GlossaryScreen.tsx (corpus + detail paths) — exemplar holds: loading / offline card + Retry (:2677-2685, `reloadCorpus` :1819) / "No results" all distinct; failed loads never session-cached; detail rows get [72] error + retry (:2952, :3105); media/formula loads deliberately non-fatal and retried next open (B-176). (Its two gaps are filed above.)
- src/screens/curriculum/CurriculumScreen.tsx — M15 state machine: loading / honest error + working RETRY (:137-151, :275-294); empty-curriculum treated as error since a real curriculum is never empty.
- src/screens/dashboard/DashboardScreen.tsx — full three-state compliance incl. session-repair path (:1123-1172) and the terms popup's distinct `termsError` + Retry (:1874-1888).
- src/screens/dashboard/TopicDeckSheet.tsx — local-store data only; empty copy is a true empty.
- src/screens/courses/CourseSelectionScreen.tsx — error + Retry (:1401-1406), loading spinner; the :1095 name-index fetch is documented non-fatal enrichment.
- src/screens/notifications/WeeklyConceptScreen.tsx — exemplary: loading / loadError+Retry / genuinely-unavailable are three distinct renders with a load-bearing `.catch` (:21-46, :62-84).
- src/screens/careerfinder/CareerFinderResultsScreen.tsx — purely local finder store + static career index, no async source.
- src/screens/quiz/QuizScreen.tsx — typed start-error codes, Try-again only where retry helps (:381-397), offline submits queued with honest notice, double-submit latch released on failure.
- src/screens/results/ResultsScreen.tsx — renders route-param payload, no fetches.
- src/screens/help/HelpScreen.tsx (apart from :159) — static manual; search no-results is a true empty; jump targets plain navigation.
- src/features/study/api.ts — `fetchTopicItems` throws on hard failure so the study screens' error states are honest; `[]` only for genuinely unlinked topics; decorative fetches swallow by design.
- src/features/study/scenarioHomework.ts — helpers never reject; null-vs-empty correctly split into 'error' vs 'empty' at the screen (:225-241).
- src/screens/directory/directoryBits.tsx — EmptyState-with-lines exemplar intact.
- src/screens/directory/ExploreView.tsx — search error → banner + RETRY distinct from EmptyState; taxonomy failure has its own banner + RETRY.
- src/screens/directory/RequestsView.tsx — model three-state screen: Loading / error+RETRY pre-first-load / stale-list banner on refresh failure / EmptyState; ThreadSheet surfaces fetch errors.
- src/screens/directory/AudioCommunityDirectoryScreen.tsx — MemberSheet distinguishes loading / failed (banner + Retry) / loaded; contact/block/report all surface `r.error`.
- src/screens/directory/DirectoryScreen.tsx — `qrFailed` separates a dropped QR-token fetch from "still setting up" (:111-127, :213-222).
- src/screens/directory/MyProfileView.tsx (main load) — failed first load is error + RETRY, never the blank editor; saves roll back with a banner. (Creds line filed above.)
- src/features/directory/api.ts — every function returns typed results, nothing rejects; bare `.then`s in the views are safe.
- src/screens/profile/ProfileScreen.tsx (ID card) — guest "none" vs "unavailable" split with retry row (:189, :541-549); registry toggle reverts + warns on failure. (Credentials fetch filed above.)
- src/screens/settings/SettingsScreen.tsx (prefs load) — M12 pattern holds: error + RETRY for members, guest copy only for real guests. (Four smaller items filed above.)
- src/screens/auth/AuthScreen.tsx — every async action caught with honest offline copy; guest entry fully guarded; device claim never throws.
- src/screens/SplashScreen.tsx — cannot strand: getSession rejection caught AND a 5 s hang race both default to the signed-out route.
- src/screens/exam/FinalExamScreen.tsx — code-driven start retry, offline submit queue, latch release on non-network failure, Skip for a malformed question; no path strands the sitting.
- src/screens/about/AboutHomeSheet.tsx — fully static.
- src/screens/tools/MeasurementLibraryScreen.tsx — the empty card itself holds; share/delete caught. (Store-level hydrate fault + first-paint flash filed above.)
- src/screens/lab/tube/TubeCardScreen.tsx — model citizen: spinner / reasoned auth-vs-network failure copy / real RETRY (:476-504); alive-guards on async URL fetch.
- src/screens/lab/tube/tubeRefs.ts — never rejects, distinguishes auth from network; all supabase calls wrapped.
- src/screens/lab/tube/TubeReferenceScreen.tsx — static registry; honest search-empty copy; member-favouring until resolved.
- src/screens/tools/ToolsHubScreen.tsx — no data fetches; live previews rest to static art on engine dropout (honest by design); no permanent blank possible.
- src/screens/tools/ToolInfoScreen.tsx / ToolLockUi.tsx / ToolDemoPreview.tsx — no async data render states.
- src/screens/tools/SplMeterScreen.tsx — engine states routed through EngineGate (the missing Retry is filed against EngineGate); prefs caught; `fetchCommunityProfile` swallows internally (catalogClient.ts:67-84), failure just omits the community offset.
- src/screens/tools/CenterLockTuner.tsx — prefs + keep-awake all caught with sane defaults; gating lives in the host.
- src/screens/tools/FrequencyCounterScreen.tsx — camera mode has honest starting/denied/error text (:351-355); permission requests in try/catch.
- src/screens/lab/cable/CableLabScreen.tsx — step-restore caught, falls back to lesson 0; content bundled. (connectorCard image filed above.)
- src/screens/lab/cableinstall/CableInstallLabScreen.tsx — resume multiGet best-effort in try/catch; no rendered remote source.
- src/screens/lab/calc/calcPrefs.ts / CalcProjectsScreen.tsx / CalcWorkflowsScreen.tsx / CalcResultsScreen.tsx — store calls never reject; empty copy honest for the genuinely-empty case. (Corrupt-store collapse filed against workflowStore; cap fail-open filed above.)
- src/screens/lab/amp/AmpLabHomeScreen.tsx / AmpModuleScreen.tsx / modules/mod8Apply.tsx — ampProgress load/save/reset internally caught, never reject; device-local with sane empty default.
- src/screens/lab/micselect/MicSelectLabScreen.tsx — only the caught step-restore pref.
- src/screens/lab/mixing/kit.tsx / audio/mixAudio.ts — prefs caught (outer `.catch` covers the read itself); stems synthesized locally, no load-failure mode.
- src/screens/lab/foundations/FoundationsCourseScreen.tsx (data side) — step restore caught; no remote sources. (Silent gen-start filed above.)
- src/screens/lab/meter/modules/modMeterC.tsx — `hydrateSolved` catches internally, resolves empty Set; persist caught.
- src/screens/lab/cable/connectorImages.ts — static URL map. (Consumer fault filed against connectorCard.tsx.)
- src/features/glossary/glossaryGateway.ts / glossaryCap.ts / deviceKey.ts — typed results, never reject; guests never locked out by a mint failure.
- src/features/account/singleDevice.ts / src/features/commercial/accessCode.ts — documented never-throw, verified (accessCode's comment wording filed above).
- Remaining changed-since-09-10 screens not named here (tuning chapters, patchbay pages, connectorselect pages, mixing pages, eq/wave/digital modules, rack kit, hub previews, SkinnedTunerVu, MultiMeter/Rta/Rt60/Spectrogram/SignalGen/Waveform/ExposureMonitor screens, ProfilePreview/SettingsPreview/HelpPreview, landing/institutional) — grep-verified to contain no supabase/fetch/AsyncStorage data source that renders a list or detail state; they are engine-driven or fully static and inherit EngineGate/host gating audited above.

---

*Audit method: three parallel read-only file auditors over disjoint sets (enrollment/awards/study · glossary/directory/profile/commercial · tools/labs) plus a direct fail-open pass over all code changed since 2026-09-10; every finding cites source read this session. No source files were modified.*
