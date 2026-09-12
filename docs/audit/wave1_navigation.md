# Wave 1 — Navigation launch-readiness audit

Scope: `src/navigation/**` + `src/screens/**`. Read-only. Focus: dead-ends /
stranding, back & gesture behavior, deep-link map correctness, nav races /
param bugs, route-registry hygiene. Every finding is grounded in a file:line
that was read.

Date: 2026-09-09 · Branch: audio-tools-engine

## Top 5

1. **[High] Final Exam has no Android hardware-back guard** — a hardware BACK
   during the capstone drops the learner out of a live timed attempt with no
   confirm. QuizScreen fixed exactly this on 2026-09-07; FinalExam (a
   "deliberate port" of it) was not given the same guard.
   `src/screens/exam/FinalExamScreen.tsx` (no `BackHandler`) vs
   `src/screens/quiz/QuizScreen.tsx:234-243`.
2. **[Low-Med] `FinalExamResult` (and the exam error/empty states) can strand on
   a re-inited Splash** — `navigation.popToTop()` on the ROOT stack pops back to
   `Splash`, then pushes the result on top; Android hardware-back then lands on
   Splash which re-runs its session hand-off. `src/screens/exam/FinalExamScreen.tsx:124-125`.
3. **[Low] Dead route: `Directory`** — registered and typed, but nothing
   navigates to it and the `directory` deep link resolves to
   `AudioCommunityDirectory`. Unreachable in production.
   `src/navigation/RootNavigator.tsx:248`, `src/navigation/types.ts:131`.
4. **[Low] Modal-over-modal: Settings → About / Paywall** — Settings is a modal
   and opens two more modals; the codebase explicitly calls modal-in-modal "the
   black-screen trap this codebase has hit before". Needs a device check.
   `src/screens/settings/SettingsScreen.tsx:300,602`; `RootNavigator.tsx:239,243,374`.
5. **[Low] Deep-link `labs/eq` is ambiguous** — it maps to the *audible effect*
   `EqLab`, not the newer `EqLabHome` EQ Lab (owner spec 2026-08-07); several
   flagship labs (`EqLabHome`, `CableLab`, `GainLabHome`, `MeterLab`) are not
   deep-linkable at all while `CableInstallLab` is. `src/navigation/linking.ts:71`.

Counts: High 1 · Med 0 · Low-Med 1 · Low 3 — total 5. Auto-fixable: 2 (findings 1 and 2).

---

## Findings

### [High] Final Exam is not protected from the Android hardware BACK button
- **Where:** `src/screens/exam/FinalExamScreen.tsx` — the screen registers an
  on-screen `‹` that routes through `confirmExit` (lines 252-263, 322-324) and
  an `AppState` focus-void guard (161-184), but it registers **no**
  `BackHandler` for `hardwareBackPress`. Registered in
  `src/navigation/RootNavigator.tsx:236` with `{ gestureEnabled: false }`.
- **Contrast / proof it is intended behavior:** `src/screens/quiz/QuizScreen.tsx:231-243`
  added this exact guard (comment: *"gestureEnabled:false only blocks the iOS
  swipe and hardware-back drops the learner out of a live timed attempt with no
  confirm"*). FinalExam's own header comment says it is *"A deliberate port of
  screens/quiz/QuizScreen.tsx"* — the port predates the Quiz fix and never got it.
- **What breaks / how a user hits it:** On Android, during a Final Exam the
  learner presses the system back button (reflex, or trying to dismiss the
  keyboard). `gestureEnabled:false` does nothing for the hardware button, so the
  native stack pops the screen immediately — bypassing the "answers will be
  wiped" confirm, leaving `answers.current` un-wiped, and abandoning a
  one-sitting capstone attempt that is now counting against the 15-minute
  re-entry window. This is a capstone/credential path, so the blast radius is high.
- **Fix:** Port the QuizScreen effect verbatim — register a
  `BackHandler.addEventListener('hardwareBackPress', …)` that returns `false`
  when `submitted.current`, otherwise calls `confirmExit()` and returns `true`;
  gate it on `payload && !submitting` and remove the listener on cleanup.
- `auto_fixable: yes`

### [Low-Med] Final Exam submit / error paths pop to Splash on the root stack
- **Where:** `src/screens/exam/FinalExamScreen.tsx:124` —
  `if (navigation.canGoBack()) navigation.popToTop();` then `navigate('FinalExamResult', …)`.
- **Why it differs from Quiz:** In QuizScreen the same `popToTop()`
  (`QuizScreen.tsx:136`) runs on the **nested Study stack**, so it lands on
  `Dashboard` — clean. FinalExam and FinalExamResult live on the **root** stack
  (`RootNavigator.tsx:236-237`), whose first route is `Splash`
  (`RootNavigator.tsx:228`, `initialRouteName="Splash"`). `popToTop()` there
  pops the whole root to Splash, then pushes FinalExamResult above it, so the
  stack becomes `[Splash, FinalExamResult]`.
- **What breaks:** From FinalExamResult, an Android hardware back (this screen
  also has no BackHandler and `gestureEnabled:false`) lands on `Splash`, which
  re-runs its session check / 2.5s hand-off — a jarring "app restarted" moment
  instead of returning to AwardProgress / Profile where the exam was launched.
- **Fix:** Prefer an explicit `reset` to a sensible home (e.g. root →
  `Main`/`Profile` or the originating `AwardProgress`) instead of
  `popToTop()`+`navigate`, or drop the `popToTop()` so AwardProgress stays
  underneath. Also give FinalExamResult a BackHandler that routes to the same home.
- `auto_fixable: yes`

### [Low] `Directory` is a registered, typed, but unreachable route
- **Where:** `src/navigation/RootNavigator.tsx:248`
  (`<Stack.Screen name="Directory" … presentation:'modal' />`) and
  `src/navigation/types.ts:131`. The only other references are the screen's own
  `Props` type (`src/screens/directory/DirectoryScreen.tsx:30`).
- **What breaks:** Nothing user-facing — it is dead weight. A repo-wide search
  for `navigate('Directory')` returns zero call sites. Every internal entry and
  the `directory` deep link go to `AudioCommunityDirectory`
  (`linking.ts:86`, `ProfileScreen.tsx:743`, `DirectoryScreen.tsx:208`). The
  types.ts comment (lines 132-134) says `Directory` is *"kept as a route ALIAS
  so every existing internal link and deep link still resolves"*, but no link
  targets it anymore.
- **Fix:** Either delete the route + screen registration, or if it is meant to
  stay as a compatibility alias, document that it is intentionally orphaned.
  (Leaving it is harmless; flagged for registry hygiene only.)
- `auto_fixable: no` (product/contract decision)

### [Low] Modal presented over a modal (Settings → About / Paywall)
- **Where:** `SettingsScreen` is `presentation:'modal'`
  (`RootNavigator.tsx:239`). From it the user opens `About`
  (`SettingsScreen.tsx:602`, also `presentation:'modal'`, `RootNavigator.tsx:243`)
  and `Paywall` (`SettingsScreen.tsx:300`, `presentation:'modal'`,
  `RootNavigator.tsx:374`).
- **What breaks:** Stacked native modals are usually fine on iOS/react-native-
  screens, but this codebase explicitly warns modal-in-modal is *"the
  black-screen trap this codebase has hit before"* (`RootNavigator.tsx:249-252`,
  which is why `AudioCommunityDirectory` was made a full screen). Worth a device
  pass on both platforms (open Settings → About, Settings → See plans, then back
  out) to confirm no black screen / stuck sheet.
- **Fix:** If the trap reproduces, present About/Paywall as full screens when
  the presenter is itself a modal, or dismiss Settings before pushing them.
- `auto_fixable: no` (needs device verification first)

### [Low] Deep-link map: `labs/eq` ambiguity + uneven lab coverage
- **Where:** `src/navigation/linking.ts:71` maps `EqLab: 'labs/eq'`. `EqLab` is
  the *audible effect* lab (`types.ts:202`), gated + behind the amplitude
  orientation; the separate `EqLabHome` "EQ Lab" (owner spec 2026-08-07,
  `types.ts:276-280`) has no path. Similarly `CableInstallLab` is deep-linkable
  (`linking.ts:80`) but `CableLab`, `GainLabHome`, `MeterLab`, `EqLabHome`,
  `AmpLab`, ear/tuning labs are not.
- **What breaks:** A public `…/labs/eq` link opens the effect lab, which is the
  narrower/gated one, not the teaching EQ Lab a marketing link would likely
  intend. `isClaimedPath` (`linkPaths.ts:141-142`) accepts any single-segment
  `labs/<x>`, and unmapped ones fall through to `LabCategory`
  (`linking.ts:81`) which renders its own "not available" state — so an
  advertised `labs/gain` etc. would dead-end on that empty state rather than the
  real lab.
- **Fix:** Decide the canonical target for each advertised `labs/*` slug and add
  the missing entries (and disambiguate `labs/eq` vs an `labs/eq-lab`), keeping
  `app.json` intentFilters + the website AASA paths in sync per
  `linkPaths.ts:6-10`.
- `auto_fixable: no` (product/contract + cross-repo decision)

---

## Checked and found clean (notable)
- **Route registry:** every route in `RootStackParamList`, `StudyStackParamList`
  and `AchievementsStackParamList` (`types.ts`) is registered in its navigator,
  and every `linking.ts` path targets a real registered route. Only `Directory`
  is orphaned (above).
- **`Gallery` reachability:** reachable from `TopicsScreen.tsx:79`
  (`navigate('Gallery')`); not a dead screen.
- **Tab reset-on-blur:** `resetToRootOnBlur` (`MainTabs.tsx:28-52`) is correctly
  guarded — it skips the reset when the blur is a root-stack push over the still-
  selected tab (the A1-01 regression) and only resets a real off-root tab switch.
- **Root-stack push over a tab → Back:** `CareerFamilyScreen.tsx:70-75`,
  `AwardsScreen.tsx:438`, `ToolsHubScreen.tsx:887-913`, `EnrollmentScreen.tsx:616-621`
  all correctly use `popTo('Main', …)` instead of `navigate('Main')` to avoid the
  RN7 "second tab shell pushed on top" bug.
- **Deep-link hardening:** `linkPaths.parseLink` rejects userinfo/host-spoofing,
  control chars, `%2f`/`%5c`, traversal, over-long URLs (`linkPaths.ts:56-113`);
  `pendingLink` only stores `isAcceptedLink` paths and is single-use
  (`pendingLink.ts:30-51`).
- **On-screen back controls:** effectively every root-stack content screen and
  the modals (Settings, WeeklyConcept `WeeklyConceptScreen.tsx:41`, About,
  ExposureMonitor, Paywall) expose a `‹`/`✕`. No stranding equivalent to the
  fixed public-glossary onboarding case was found; `PublicGlossaryScreen`'s
  nav proxy maps the glossary's `Dashboard` intent to `goBack()`
  (`PublicGlossaryScreen.tsx:28-38`), which returns to Splash→session on a cold
  deep-link start.
