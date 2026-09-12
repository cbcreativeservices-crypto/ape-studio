# CCODE HANDOFF — App Navigation & Readout Fixes (2026-09-07)

> ## ✅ CLOSED 2026-09-11 — do not re-work the majors
> Every item in §3 and §4 (**C1 + M1–M20**) was verified against live code by a
> three-agent pass on 2026-09-11 and is **already applied** — mostly by commits
> `84f7fd4` and `c72fd5a`. Two corrections to this document:
> - **M9 / M20 are NOT open.** `attachWeeklyConceptPush` IS called — from
>   `App.tsx` at the repo ROOT (line ~147), with the cold-start drain in
>   `NavigationContainer onReady`. The finding came from a `src/`-only grep that
>   never saw `App.tsx`. (The same mistake was repeated on 2026-09-11 before the
>   verification pass caught it.)
> - **M10's premise does not hold.** `GlossaryScreen` does not render
>   `StudyHeader`, so the described no-op path is unreachable; the `onBack` prop
>   prescribed by the fix exists regardless.
>
> **Residual work that came OUT of the verification** (fixed 2026-09-11, see
> commits `3173533`, `a29c138`): M3 had an uncovered half — a matching payload
> with empty/short arrays passed the "answerable" guard and stranded the
> learner; and the cold-start LOCAL reminder tap was silently dropped (the
> weekly path had a queue/flush pair, the local path did not).
>
> §5's 57 **minors** were worked separately on 2026-09-11 — see the night's
> report for their disposition. Fix C of M7 (deleting retired v1 catalog files)
> is **refused**: `src/data/courseTopicMatrix.ts` and
> `src/data/course_topic_matrix_v2.json` still have live importers
> (`AwardsScreen`, `HomeSetupSheet`).

**From:** Computer A · **Scope:** app-code only (screens / features / navigation). **No database, no SQL, no migrations.**

## 1. DO-NOT manifest (read first)
- **No DB / SQL / RLS / migration work.** Every fix here is React Native app code.
- **Touch only the file named in each item.** Don't refactor broadly or rename shared things.
- **Line numbers are from the 2026-09-05 audit and have drifted — RE-LOCATE each by the described code pattern, not the line number.**
- The **critical + 20 majors** below were **re-verified present in the repo on 2026-09-07** by Computer A. One earlier finding (FillInBlank `randomSentence`) was already fixed by your 2026-09-05 study-text work and is **excluded**.
- The **57 minors** are in `docs/app_nav_findings_2026_09_07.jsonl` (same `{area,screen,file,issue_type,severity,what,why,suggested_fix}` schema, paths corrected). Apply them **after** the majors; a few may already be addressed — skip those.
- **Done-when** is at the bottom (§6).

## 2. Why
This is the non-lab **navigation & readout** audit — the "finish the logic / complete the nav paths" pass before launch QA. The theme across most items: a fetch error is rendered as a loading or empty state (no retry), a promised control is dead code, or a back/next path is missing. Fixing them makes the app behave predictably for a real user on a flaky connection.

## 3. CRITICAL — fix first

### C1 · Quiz options are keyed by value, so duplicate labels collapse
**File:** `src/screens/quiz/QuizScreen.tsx` · type: crash_risk
**Defect:** selection + render are keyed by the raw option **value** string — `answers.current[String(slot)] = value`, `key={opt}`, `multiSel.has(opt)`, and the matching pair tuples. If a question's served options contain **duplicate display strings** (legitimate in matching, possible in multi-select), the duplicates collapse into one selectable unit and emit duplicate React keys; selecting one dims both, so the learner physically cannot complete the pairs and is force-timed-out / misscored.
**Fix:** key options by a **slot-local index or a stable option id** for the render key, the selection set, and the pair tuples. Keep submitting the **value** per the F4 contract, but track selection **by identity** so repeated labels stay independent.

## 4. MAJOR — 20 items (grouped by area)

### Quiz flow — `src/screens/quiz/QuizScreen.tsx`
- **M1 · No back-between-questions.** `advance()` only increments `qIdx`; tap auto-advances after a 350 ms highlight, so an earlier answer can't be reviewed or changed. **Fix:** add a Previous control (or a review step before submit) that decrements `qIdx` and rehydrates `picked/multiSel/pairs` from `answers.current[String(slot)]` — or explicitly state in the UI that answers are final-on-tap.
- **M2 · Android hardware-back bypasses the exit guard.** `StudyStack gestureEnabled:false` only blocks the iOS swipe; no `BackHandler` is registered, so Android hardware-back drops the learner out of a live timed attempt with no confirm. **Fix:** register a `BackHandler` (or nav `beforeRemove`) while the attempt is live and route hardware-back through `confirmExit()`.
- **M3 · No skip for an unanswerable question.** A malformed options payload renders zero controls and no next button → the learner is stuck on that slot until the 10-minute force-submit. **Fix:** when no answerable control renders, show a **Skip / Next** that records an empty answer for the slot and calls `advance()`.

### Auth / Onboarding
- **M4 · `AuthScreen.tsx` — Guest Mode can hang forever.** `enterGuest()` awaits AsyncStorage/store resets **unguarded**; if any throws, `setBusy(false)` never runs and `toHome()` is never reached — permanent spinner, no error, on the primary no-account entry point. **Fix:** wrap the body in try/catch/finally (`setBusy(false)` in finally, `setError` in catch), matching the other auth handlers.
- **M5 · `src/features/intro/AppWelcomeOverlay.tsx` — 9 s dead wait.** The first-run modal enforces a 9 s delay before the button renders, but the defined `styles.wait` ("PLEASE WAIT") is never rendered and Android back no-ops silently — it reads as a frozen screen. **Fix:** render `styles.wait` (or a countdown / disabled button) while `!canContinue`.
- **M6 · `src/features/commercial/EntitlementProvider.tsx` — guest flash on every launch.** `entitlement` defaults to `'anonymous'` until the async session/entitlements read resolves, so the first paint shows the guest state to signed-in members (Settings "GUEST — NO ACCOUNT", Profile "REFERENCE MODE" + upgrade CTA). **Fix:** add a `'loading'` tier (or gate entitlement-dependent UI on a resolved flag) so first paint is neutral, not the anonymous rung.

### Home / Courses — `src/screens/courses/CourseSelectionScreen.tsx`
- **M7 · Home cards show the literal "this topic" — repoint Home name resolution to live v3, and retire the v1 catalog files.** *(This item is the app-side finish of the v1 `public_courses` removal — the DB tables are already dropped. Anchors below verified by Computer A against the live source 2026-09-10; line numbers will drift, relocate by pattern.)*
  **The defect:** in `src/screens/courses/CourseSelectionScreen.tsx` the paid-member custom deck builds each `homeTopic` card's name/subject from `HOME_TOPIC_INDEX` (built from the **retired v2** `MATRIX_SUBJECTS`, ~line 106) via `officialTopicName(gs, HOME_TOPIC_INDEX.get(gs)?.name)` and `HOME_TOPIC_INDEX.get(gs)?.subject ?? ''` (~line 1166). A v3 `gs` absent from the v2 matrix falls to `officialTopicName(gs, undefined)`, which codifies only 5 ids and otherwise returns `'this topic'` with an empty subject. Violates the no-placeholder-to-user rule.
  **Fix A — name/subject from live v3:** build the `gs → {name, subject}` index from the **live v3 curriculum** — `fetchV3Curriculum()` → `flattenV3()`, keyed by `gs` — loaded into state in `load()` (or its own effect; the screen already imports `fetchV3Certs`/`fetchV3Programs` from `../../data/v3Curriculum`) and consumed by the `displayDeck` memo, keeping `officialTopicName(gs, liveName)` as the final fallback. Never render `'this topic'` or a blank subject.
  **Fix B — cut the dead v1 catalog call:** the v1 `getPublicCatalog()` return is already vestigial — at ~line 1070 `const catalog = await getPublicCatalog()` is fetched only to feed `freeTopicsFrom(catalog)` (~line 1100), and `freeTopicsFrom` **ignores its argument** (it returns the fixed v3 tasters). Build that free-taster card directly from `gs 3060` + `officialTopicName(3060)` (or the exported `FREE_TOPICS`), then delete the `const catalog = await getPublicCatalog()` line and the `getPublicCatalog, freeTopicsFrom` import (~line 49).
  **Fix C — delete the retired files, but grep first:** after A+B, `git grep` for remaining importers of `data/publicCourses`, `data/courseTopicMatrix`, `public_courses_seed.json`, and `course_topic_matrix_v2.json`. **Delete each file only if `CourseSelectionScreen` was its last importer**; if anything else still imports one (e.g. a Curriculum view using `MATRIX_SUBJECTS`, or another caller of `isFreeTopicGs`/`FREE_TOPIC_GS`), leave that file and note in the PR what still uses it. *(Computer A verified CourseSelectionScreen's own usage but could not grep the whole repo from this session — you run the importer check before any delete.)*
- **M8 · Dead "stranded session" recovery banner.** `setStrandedSession` is only ever called with `false`; the "account isn't set up for study yet" banner can never render, so an authed account with no student/enrollment record silently drops into the free catalog with no "Complete Registration" / "Sign Out" recovery. **Fix:** restore a detection path that sets `strandedSession(true)` when an authed session has no student/enrollment — or remove the dead state + banner.

### Navigation
- **M9 · Weekly-concept push is unwired (route unreachable).** `attachWeeklyConceptPush` in `src/features/notifications/push.ts` is **defined but never called** (verified — only the definition exists); `registerAndSavePushToken` only registers the token. So tapping a weekly-concept push cold-opens the app instead of deep-linking, and the `WeeklyConcept` modal route has no live entry point. **Fix:** call `attachWeeklyConceptPush` once at the `NavigationContainer` root — `payload → navigation.navigate('WeeklyConcept', payload)`, `dest 'glossary'/'awards' →` their routes — and call `flushWeeklyConceptNav` on ready to drain a cold-start payload. *(This one fix closes both audit findings for this feature.)*
- **M10 · `src/screens/study/StudyHeader.tsx` — public-glossary back does nothing.** `PublicGlossaryScreen`'s navProxy remaps `navigate('Dashboard') → goBack`, but `StudyHeader` calls `popTo('Dashboard')` via its own `useNavigation()` (never sees the proxy); at the root there is no `Dashboard` route, so `POP_TO` is unhandled and the header back control no-ops. **Fix:** have `StudyHeader` accept an optional `onBack` (defaults to `popTo('Dashboard')`, overridden to `navigation.goBack()` in public mode), or intercept `popTo` in the navProxy.

### Credentials / Dashboard / Settings
- **M11 · `src/screens/achievements/AchievementsHomeScreen.tsx` — error looks like loading.** A `fetchAchievementsHub` rejection sets `hub = null`, the same value as loading, so the Trophy Case sits in a permanent skeleton ("— / —") with no retry. **Fix:** track an explicit error flag distinct from null/loading; render an error line + retry on reject.
- **M12 · `src/screens/settings/SettingsScreen.tsx` — member told they're a guest.** A transient `fetchNotificationPrefs()` null (not just a guest) disables every toggle and shows "Sign in to manage notifications", with no retry, to a paying member. **Fix:** return a discriminated result (null-guest vs null-error); on error show a retry and keep the member wording.

### Exam / Results
- **M13 · `src/screens/exam/FinalExamResultScreen.tsx` — promised retake is unreachable.** On no_pass / timed_out the copy invites a retake, but the only control is `Done → goBack`, and `doSubmit` ran `popToTop` before this screen — so back lands on Main, not a retake entry. **Fix:** add a **Retake Final Exam** button on no_pass/timed_out that goes to `AwardProgress` (or relaunches `FinalExam` with the same awardType/id/name).
- **M14 · `src/features/finalExam/api.ts` — offline capstone result lost on web.** The offline replay surfaces its result only through `Alert.alert` in `DashboardScreen`, which is a no-op on RN-web (the exam screen already switched to `notify()` for this reason). So an offline-submitted Final Exam yields no visible pass/credential message on web. **Fix:** surface replayed results with `notify()` / `confirmDialog` (or route to `FinalExamResult`), not `Alert.alert`.

### Curriculum
- **M15 · `src/screens/curriculum/CurriculumScreen.tsx` — failed load reads as empty.** `fetchV3Curriculum()` swallows errors and returns `[]`, so a failed load renders a blank subject tree + "—" tiles, indistinguishable from real empty, with no retry. **Fix:** return a discriminated loading/error result and render distinct spinner / error+Retry / empty states.

### Study / Glossary — `src/screens/glossary/GlossaryScreen.tsx`
- **M16 · Preselected topic never filters.** `route.params.achievementId` seeds `selTopicId` but `filter` stays `'all'`; the visible memo only narrows when `filter === 'topic'`, so opening the glossary from a Dashboard topic shows all ~3,300 terms with the Topic chip unchecked. **Fix:** when the preset topic is present, initialize `filter` to `'topic'` (or a mount effect that sets it when `selTopicId` is set).
- **M17 · Load failure reads as empty.** A corpus-load failure is caught with `console.warn` only, leaving `entries` empty → "No results for All", "0 Terms", no error/retry. **Fix:** track a load-error state and render "Couldn't load the glossary — check your connection" + a Retry that re-invokes the loader.

### Tools / Directory
- **M18 · `src/screens/directory/DirectoryScreen.tsx` — directory CTA is dead for its audience.** The `SET UP MY PROFILE ›` button's `hasAccount ? navigate('AudioCommunityDirectory') : setAcctNote(true)` sits **inside the `!hasAccount` branch**, so `hasAccount` is always false there and the navigate is dead; registered users get the QR-only branch with no button into the community directory. **Fix:** render a working CTA in the registered (`registryBoxCol`) branch that calls `navigation.navigate('AudioCommunityDirectory')`, and drop the always-false ternary in the guest button.
- **M19 · `src/screens/directory/AudioCommunityDirectoryScreen.tsx` — member sheet spins forever.** `fetchPublicProfile` resolves `null` on error/not-found; the `busy || !p` guard then shows "Loading profile…" permanently with no error/retry. **Fix:** handle the loaded-but-null case → an error/empty state ("This profile could not be loaded" + retry/close).

### Enrollment
- **M20 · WeeklyConcept modal registered but unreachable** — this is the display side of **M9** (route in `RootNavigator` with a full param contract, but the only entry is the unwired push handler). Wiring M9 resolves it; if the feature is being cut instead, remove the dead route + push plumbing.

## 5. Minors (57)
All in `docs/app_nav_findings_2026_09_07.jsonl`. They cluster into the same shapes — missing loading/error/empty states, small readout mismatches, and minor nav polish. Work them after the majors and skip any already handled.

## 6. Done-when
- `npx tsc --noEmit` clean; `npm test` green.
- **Eyeballed on a running screen:** (a) a quiz question with two identical options is completable and scores right [C1]; (b) Android hardware-back in a live quiz asks to confirm [M2]; (c) tapping a weekly-concept push opens `WeeklyConcept` [M9]; (d) the Directory "Set up my profile" reaches `AudioCommunityDirectory` for a **registered** user [M18].
- **(e) [M7]** a paid member's custom Home deck shows every card's real topic name (no `'this topic'`, no blank subject), resolved from the live v3 curriculum; and `git grep` finds no remaining importer of any v1 catalog file you deleted.
- `git diff` touches only `src/` app files (plus deletion of the retired v1 `data/` files per M7) — no DB, no `.sql`.

## 7. After you ship
Tell Cháno. Computer A will re-verify the critical + the four eyeball items and update the launch-readiness board.
