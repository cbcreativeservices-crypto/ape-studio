# Pass 3 · Agent D — What the user sees when something goes wrong

Axis: every **error**, **empty**, **loading**, **partial**, **too-much** and **dead-end**
state in the app, screen by screen. Plus controls that do nothing.

Read-only. No source file was touched.

## Coverage

134 routes are registered across `RootNavigator` / `MainTabs` / `StudyStack` /
`AchievementsStack`, resolving to ~110 distinct screen components. **Every one is
accounted for in the table below.** Work was split four ways: I took navigation
chrome, awards/credentials, exam, paywall, directory, career finder and the
cross-cutting overlays; three parallel read-only agents took labs+tools,
study+quiz+glossary, and enrollment+curriculum+dashboard+profile+settings.

**I independently re-read and confirmed the source for every BLOCKER and MAJOR
below before including it.** Findings I could not confirm to that standard are
marked with their confidence and with what would settle them.

---

## Verdict table

### Navigation chrome & cross-cutting overlays
| Screen / component | Verdict |
|---|---|
| `RootNavigator` (gestureEnabled:false app-wide) | GAP — see B2 |
| `ScreenErrorBoundary` / `RootErrorBoundary` | CLEAN |
| `AppDialogHost` + `lib/confirm.ts` | CLEAN |
| `MembershipGateHost` | CLEAN (the model the Final Exam wall should copy) |
| `withMembershipPreview` → `GateHold` | **BROKEN** — B2 |
| `LabPreviewOverlay` | GAP (defensive only) — M22 |
| `EngineGate` | **BROKEN** — B3 |

### Entry, account, money
| Screen | Verdict |
|---|---|
| `SplashScreen` | CLEAN |
| `AuthScreen` | CLEAN |
| `PaywallScreen` | CLEAN |
| `SettingsScreen` | GAP — M18 |
| `ProfileScreen` | GAP — M9, m10, m11 |
| `ProfilePreview` / `SettingsPreview` / `HelpPreview` | CLEAN (dev harness, unrouted) |

### Study core
| Screen | Verdict |
|---|---|
| `DashboardScreen` (STUDY tab) | **BROKEN** — M7, M8, M13 |
| `CourseSelectionScreen` (HOME tab) | GAP — M10, m12 |
| `TopicDeckSheet` | GAP — M13 contributor, m13 |
| `FlashcardsScreen` | GAP — M8, m5 |
| `FillInBlankScreen` | GAP — M8 only |
| `MatchingScreen` | GAP — M8 only |
| `ScenariosScreen` | GAP — M19, m6 |
| `QuizScreen` | GAP — M6, M16, m7 |
| `ResultsScreen` | GAP — M15 |
| `TrophyScreen` | CLEAN |
| `CelebrationScreen` | **BROKEN** — B4 |
| `StudyHeader` | CLEAN |

### Glossary
| Screen | Verdict |
|---|---|
| `GlossaryScreen` | GAP — M11, M12, M20, m8 |
| `PublicGlossaryScreen` | GAP — M20 |
| `GlossaryDictation` | CLEAN |

### Curriculum, enrolment, awards
| Screen | Verdict |
|---|---|
| `EnrollmentScreen` ("Manage My Learning") | **BROKEN** — B5, M8, M10, M17 |
| `HomeSetupSheet` | GAP — M10, m14 |
| `CurriculumScreen` | GAP — M14 |
| `InsideStats` / `TopicDetailModal` | CLEAN |
| `StudyAreaExplore` | GAP — M21 |
| `AwardsScreen` | GAP — M4, M10 |
| `CredentialDetailModal` | GAP — M10 |
| `AwardProgressScreen` | GAP — M5 |
| `AchievementsHomeScreen` | CLEAN (the model the rest should copy) |
| `TopicsScreen` | CLEAN |
| `GalleryScreen` (achievements) | CLEAN |
| `CertificatesScreen` / `ProgramsScreen` → `CredentialWall` | GAP — m1 |

### Exam
| Screen | Verdict |
|---|---|
| `FinalExamScreen` | GAP — B6, M14 |
| `FinalExamResultScreen` | CLEAN |

### Directory / registry
| Screen | Verdict |
|---|---|
| `AudioCommunityDirectoryScreen` | CLEAN |
| `ExploreView` | CLEAN |
| `RequestsView` | CLEAN |
| `MyProfileView` | CLEAN (three honest states + Retry; the best in the app) |
| `DirectoryScreen` / `DirectoryView` | CLEAN |

### Career finder
| Screen | Verdict |
|---|---|
| `CareerFinderScreen` / `CareerFinderAboutScreen` / `CareerFamilyListScreen` | CLEAN |
| `CareerFinderQuizScreen` | GAP — m2 |
| `CareerFinderResultsScreen` | CLEAN |
| `CareerFamilyScreen` | GAP — M10 |

### Info
| Screen | Verdict |
|---|---|
| `AboutScreen` | GAP — m9 |
| `AboutHomeSheet` / `HelpScreen` / `WeeklyConceptScreen` | CLEAN (WeeklyConcept is the best error model in its slice) |
| `InstitutionalScreen` | CLEAN — unreachable in release (`__DEV__`-gated); see "Verified negatives" |

### Production labs (flagship)
| Screen | Verdict |
|---|---|
| `ProductionStageScreen` | **BROKEN** — B1 |
| `ProductionLabScreen` | **BROKEN** — B1 |
| `ProductionActivityScreen` | **BROKEN** — B1 |
| `AcceptConditionSheet` / `FieldRow` / `ReadinessMeter` | GAP (downstream of B1) |

### Measurement tools
| Screen | Verdict |
|---|---|
| `SplMeterScreen`, `RtaScreen`, `WaveformScreen`, `SpectrogramScreen`, `Rt60Screen`, `SignalGenScreen`, `FrequencyCounterScreen`, `MultiMeterScreen`, `ExposureMonitorScreen` | GAP — B3 (all nine). Their *internal* loading/empty paths were swept by pattern, not read line by line — see "Depth caveats". |
| `MeasurementLibraryScreen` | GAP — M8 |
| `ToolsHubScreen`, `ToolInfoScreen`, `ToolLearnScreen`, `ToolDemoScreen`, `ConceptModuleScreen`, `DspDebugScreen` | CLEAN |
| `CenterLockTuner` (full-screen takeover) | CLEAN |

### Calculator lab
| Screen | Verdict |
|---|---|
| `CalcWorkspaceScreen` | GAP — m3 |
| `CalcProjectsScreen`, `CalcWorkflowsScreen`, `CalcResultsScreen` | GAP — M8, m4 |
| `CalcWorkflowEditScreen`, `CalcWorkflowRunScreen` | GAP — m15 |
| `CalcLabScreen`, `CalcSymbolsKeyScreen` | CLEAN |

### Cymatics lab
| Screen | Verdict |
|---|---|
| `PlateStudioScreen`, `LiquidStudioScreen`, `MembraneStudioScreen` | GAP — B3, m16 |
| `GalleryScreen` (cymatics) | GAP — M8 |
| `CymaticsHomeScreen`, `CymaticsModuleScreen` | CLEAN |

### Remaining labs
| Screen | Verdict |
|---|---|
| `LiveSpectrumEq`, `SeeingFrequency`, `HarmonicsView` (mic modules) | GAP — B3, m17 |
| `TubeCardScreen` | CLEAN (**the model to copy** — real RETRY, auth-vs-network distinguished) |
| All other lab home/module screens (amp, cable, cableinstall, connectorselect, deesser, digital, eartraining, envelope, eq, foundations, gain, meter, micselect, micspeaker, mixing, patchbay, speech, tube, tuning, wave, harmonograph, oscillator, noise, fx-family, modular, bass, autotune, fm, binaural, signalchain, amplitude, audiolearning, earlab, labcategory) | CLEAN on this axis |

### Depth caveats
- `GlossaryScreen` (3,823 lines): every fetch, catch, loading/empty/error branch and
  modal was read; the row/detail renderers were not.
- `DashboardScreen` (2,911) and `CourseSelectionScreen` (1,898): state/load/error/
  render/modal regions read in full; the remainder swept by pattern.
- The nine measurement-tool screens: error-state and busy-flag surfaces checked
  app-wide; their internal loading/empty/too-much paths were not exhaustively read.
  **This is the one area I would want another pass on.**

---

# BLOCKER

## B1 — Production labs: every failed write is silent, and the learner keeps working on data that no longer exists

**Files**
- `C:\Users\profe\dev\ape-studio\src\screens\lab\production\ProductionStageScreen.tsx:55-73`
- `C:\Users\profe\dev\ape-studio\src\screens\lab\production\ProductionLabScreen.tsx:93-105`
- `C:\Users\profe\dev\ape-studio\src\screens\lab\production\ProductionActivityScreen.tsx:52-83`
- store: `C:\Users\profe\dev\ape-studio\src\features\production\projectStore.ts:175-202`

`projectStore().mutate()` returns `null` when the underlying write fails
(`write()` → `saveList` catch → `false`). Every call site discards that:

```ts
// ProductionStageScreen.tsx:59-61
setProject((cur) => (cur ? { ...cur, values: { ...cur.values, [valueKey(stageId, fieldId)]: v } } : cur));
const saved = await projectStore().setValue(lab, project.id, stageId, fieldId, v);
if (saved) setProject(saved);      // ← a failed write just falls through
```

- **What the user does.** Works through a production checklist, filling in fields.
- **What happens.** The optimistic value from line 59 stays on screen, so every
  answer looks saved. The readiness meter and the exported packet are computed
  from a project that never reached disk. Leaving and returning loses the lot.
- `grep -c "Alert\|notify\|confirmDialog\|failed\|error"` over all 248 lines of
  `ProductionStageScreen.tsx` returns **0**. There is no failure surface in the file.
- `setNa` (`:66-73`) is worse — it does not even set optimistically, so a failed
  N/A makes the control appear simply not to work.
- `ProductionLabScreen.tsx:102-103` calls `setAccepting(null)` **before** checking
  the result, so the accept-condition sheet closes silently on a failed write.
  That sheet records *who carries a safety decision and why*
  (`AcceptConditionSheet.tsx:64-66`) — silent loss is the wrong failure mode there.
- `ProductionActivityScreen.tsx:60` and `:81` discard `upsert()`'s boolean, and
  `restart` (`:78-81`) does `remove()` **then** `upsert()` — if the remove
  succeeds and the upsert fails, the learner's project is deleted from disk and
  survives only in memory, with no message.

**Why this is a blocker.** Silent data loss on the flagship paid feature, on
exactly the storage failure the codebase has already been bitten by:
`measurementStore`'s `guard()` (`src\features\tools\measure\measurementStore.ts:56-64`)
exists specifically because AsyncStorage hit `SQLITE_FULL` on a real Android device.
That is precisely when `saveList` returns false here.

**Should:** surface the failure and stop pretending the value is stored; at minimum
roll the optimistic value back and show a retry.

**Confidence: high** (path traced end to end).

---

# MAJOR

## B2 — ~40 members-only lab routes can render a completely blank screen with no back control

**File:** `C:\Users\profe\dev\ape-studio\src\features\lab\withMembershipPreview.tsx:44-47, 78-79`

```ts
function GateHold() {
  return <View style={{ flex: 1, backgroundColor: colors.screenBg }} />;   // :46
}
...
if (memberOnly && !resolved) return <GateHold />;                          // :78
```

`GateHold` is an empty dark view: no spinner, no text, no back control. And
`RootNavigator.tsx:323` sets `headerShown: false, gestureEnabled: false` as the
app-wide default, so there is **no header back button and no swipe-back** either.
55 routes are wrapped in `MemberGated`; every one whose `isMemberOnlyLabRoute` is
true renders this while `resolved` is false.

- **What the user does.** Opens a members-only lab (row tap, deep link, or
  pendingLink resume) on a bad connection — the venue basement.
- **What happens.** `EntitlementProvider` flips `resolved` in a `.finally()`
  (`EntitlementProvider.tsx:343-345`) after the first attempt, and that attempt is
  `await supabase.from('entitlements').select(...)` (`:216-219`) with **no
  timeout and no AbortController** (`src/lib/supabase.ts:19-27`). RN's `fetch`
  has no default timeout either, so `resolved` stays false for as long as the
  platform networking stack takes to give up — on iOS, up to ~60 s.
- For that whole window the user stares at a black rectangle with nothing on it.
  There is no way out but force-quitting. This hits **paying members too** —
  `memberOnly && !resolved` does not care who you are.

**Should:** `GateHold` should carry a spinner, a line of copy and a back control.
It is a one-component fix that covers every route at once.

**Confidence: high** on the code path (verified: blank `View`, no back, gesture
disabled). **Medium** on the exact duration — that depends on the platform fetch
timeout. Measuring it, or simply adding the back control, settles it.

## B3 — `EngineGate`'s recovery controls are dead code at all 29 call sites

**File:** `C:\Users\profe\dev\ape-studio\src\screens\tools\EngineGate.tsx:46, 75-92`

`onRetry` is an optional prop. A grep of `src` for `onRetry` returns **only the
definition inside `EngineGate.tsx`** (plus an unrelated `onRetrySort` in
`cableinstall/scenes/SupportsScene.tsx:702`). **None of the 29 `<EngineGate …/>`
call sites passes it.** Two consequences, both invisible on a reading of the
component because the component itself is correct:

- `state === 'error'` → the TRY AGAIN key at `:83-84` is gated on `onRetry` and
  **never renders**. The copy falls to the `:76` fallback: *"Go back and re-open
  this tool to try again."*
- `state === 'denied'` on Android → `canReRequest = Platform.OS === 'android' && !!onRetry`
  (`:46`) is **always false**, so ALLOW MICROPHONE at `:90` never renders. Every
  Android user whose mic is off is sent on a multi-step trip into system Settings,
  when a plain re-request would have re-shown the OS dialog.

Worst case verified end to end on SPL: `SplMeterScreen.tsx:756` is
`const showMeter = running || micPaused` — on error/denied both are false, so
`SplMeterScreen.tsx:1357-1364` renders the gate card and **nothing else**. The
tool's entire recovery path is a sentence telling the user to leave and come back.

The docblock at `EngineGate.tsx:8-15` bills this as the *store-review fix
2026-09-13 (error_triad.md)*. The component shipped; the wiring never did.

**Should:** `onRetry={onStart}` at each call site. Affects all nine measurement
tools plus the three cymatics studios and the three mic lab modules.

**Confidence: high** (grep is conclusive).

## B4 — "SHARE" on a credential celebration does nothing and burns the celebration for good

**Files:** `C:\Users\profe\dev\ape-studio\src\screens\results\CelebrationScreen.tsx:135-147`;
`src\features\celebration\catalog.ts:16, 224, 236, 249, 262, 280`

Five credential celebrations render `VIEW CERTIFICATE` + **`SHARE`**. In the
action handler, `case 'share':` falls through to `case 'dismiss':` → `toStudy()`
→ `navigation.reset(...)` to the Study Dashboard.

- **What the user does.** Earns a certificate. The full-screen celebration appears
  (from `DashboardScreen.tsx:716-726`). They tap SHARE.
- **What happens.** Nothing is shared, no message is shown, and they are thrown to
  the Dashboard. `useCredentialCelebration` celebrates each credential **exactly
  once** and records the id in AsyncStorage, so the celebration never returns.
- The body copy on those same cards says the credential *"can be viewed, shared,
  and independently verified."*

The code comment at `:136-140` argues the fall-through is "honest behaviour"
because nothing pretends to have shared. But the **button** pretends — and it
costs the user their one-time moment.

**Should:** don't render the action until it exists.

**Confidence: high.**

## B5 — "Manage My Learning": TAKE FINAL EXAM is permanently dead, with no visible reason and no route to the real exam

**File:** `C:\Users\profe\dev\ape-studio\src\screens\enrollment\EnrollmentScreen.tsx:1117-1129`, `:1216-1218`

```tsx
// :1123-1126 — the comment says it outright
// The button is a placeholder that never enables (not even at 100%),
// so the label must not promise it unlocks on completion (2026-09-11).
accessibilityLabel="Take Final Exam — not available yet"
```

- **What the user does.** A paying member completes every topic in a certificate.
  The card on "Manage My Learning" shows **COMPLETED ✓** and, directly beneath it,
  a grey **TAKE FINAL EXAM** button.
- **What happens.** Nothing, forever. The only explanation is the
  `accessibilityLabel` — invisible to a sighted user. There is no adjacent note.
- Meanwhile the app **has** a working Final Exam (`FinalExamScreen`), reachable
  from `AwardProgressScreen` once `allComplete`. `grep AwardProgress` over
  `EnrollmentScreen.tsx` returns **zero hits** — this screen has no route to it.
  The only doors are `AwardsScreen.tsx:680` and `CredentialWall`'s waiting slot.

So the screen literally named "Manage My Learning" is where a member will look for
their exam, and it is the one place that cannot open it.

**Should:** link the card to `AwardProgress`, or at minimum put the reason on screen.

**Confidence: high** (the intent is stated in the source comment).

*Correction to pass 2:* pass 2 reported this same button on the **Award Progress**
screen. There it is fine — `AwardProgressScreen.tsx:245-262` enables it when
`allComplete` and shows "Complete every required topic to unlock the Final Exam."
when it doesn't. The permanently-dead one is on Enrollments.

## B6 — The Final Exam's membership wall is a dead end, and two of its errors tell a paying customer to see their professor

**Files:** `C:\Users\profe\dev\ape-studio\src\features\finalExam\api.ts:96-113`;
rendered at `src\screens\exam\FinalExamScreen.tsx:408-432`.
Twin: `src\features\quiz\api.ts:86-97` → `src\screens\quiz\QuizScreen.tsx:443-467`.
Also `src\features\auth\api.ts:67, 101`.

`canRetryStart` is true only for `offline` and `unknown`, so every other code
renders the message plus a single **Back**. That is correct for a lockout or an
already-earned credential. It is wrong for these:

- `academy_required: 'Academy membership is required to take a Final Exam.'`
  → the user is told they need a membership and given **no way to buy one**. The
  app already has the right pattern: `MembershipGateHost`
  (`src\features\commercial\MembershipGate.tsx:80-90`) offers GET MEMBERSHIP →
  Paywall. The capstone gate doesn't use it.
- `pool_too_small: '… report this to your professor.'`
- `user_not_found: 'Account not linked to a student record — report this to your professor.'`
  …and the same two strings in the topic quiz, plus
  `'ID or code not found. Check with your professor.'` at `auth/api.ts:67` and
  `'Report this to your professor.'` at `auth/api.ts:101`.

**Six places** tell a commercial customer to escalate to a person who does not
exist, with Back as the only control. This is also the only user-visible remnant
of institutional framing in the shipping app.

**Should:** route `academy_required` to the Paywall; replace the professor copy
with commercial wording plus `sendFeedback` (already used in Help).

**Confidence: high.**

## M7 — One dropped read makes a completed topic read 0% and powers off the study rack

**File:** `C:\Users\profe\dev\ape-studio\src\features\dashboard\api.ts:139-142`
(also `:157`, `:163`); consumed at `DashboardScreen.tsx:1285-1298`, `:1727-1731`

```ts
const { data: direct } = await supabase        // ← `error` is never destructured
  .from('glossary_topics')
  .select('achievement_id')
  .in('achievement_id', topicIds);
```

A failed, denied or truncated read yields an empty count map. `studyDisplayPct`
(`src/features/study/api.ts:287`) returns `0` when `totalItems <= 0`, so every
method meter renders **0%** for a user who has finished the topic, and
`flashcardsSeenAll` / `coreHomeworkComplete` / `scenariosComplete` all go false —
so the homework, scenarios and quiz panels render **powered off**. There is no
error state for this; it is indistinguishable from "you have done nothing", and
it is written into the dashboard cache (`:873`).

Same query, **too-much-state** risk: `glossary_topics` returns one row per term
per topic. ~200 enrolled topics × ~150 terms will hit PostgREST's max-rows cap,
and the truncated tail silently gets count 0. There is no `.range()`, no count
check and no limit guard in `resolveItemCounts`.

**Confidence: high** on the dropped error; **medium** on the row cap — settled by
reading the project's `db-max-rows` setting.

## M8 — Failed reads rendered as "you have nothing" (the documented class, six more sites)

The repo has fixed this repeatedly. These remain:

1. **Enrollments · My Custom List** — `EnrollmentScreen.tsx:805-813`
   `catch { setCustomListRows([]) }` → `"No terms yet — star terms in the Glossary
   to build this list."` (`:1973`) and a header reading `MY CUSTOM LIST · 0`
   (`:1957`), while the code is holding `starred` (`:799`) and knows better.
   The identical handler on the Dashboard **was** fixed
   (`DashboardScreen.tsx:1099-1121` → error + Retry at `:2005-2016`, with the
   comment *"Was `setTermList([])`, which rendered a failed fetch as '0 terms'"*).
   Enrollments was left behind. **High.**
2. **Glossary · topic filter** — `GlossaryScreen.tsx:1665-1681`. The
   `achievements` query's `error` is never destructured; supabase-js resolves
   with `{error}` rather than throwing, so an RLS denial or a curriculum-version
   mismatch produces `topics = []` with **no error, no log, no retry** —
   `loadError` stays false because the corpus load below still succeeds. The user
   taps the Topic chip and gets a picker containing only the Equations row.
   **High.**
3. **Profile · credentials** — `ProfileScreen.tsx:205`
   `fetchMyCredentials().then(setCredentials, () => {})`. The whole CREDENTIALS
   section is then hidden (`:993`), the public-page manifest asserts
   **"0 certificates you have earned"** (`:922`), and the ID card drops its
   "N verified credentials" line. Only the ID card admits failure (`:545-555`).
   **High.**
4. **Study items** — `src\features\study\api.ts:56-84`, `92-138`, `140-162`.
   `fetchTopicItems` treats a result as usable only when `!error && data.length > 0`.
   A **200 with zero rows** — which `glossary_study_v` produces when it filters by
   entitlement, per its own comment at `:51-55` — falls through every fallback to
   `return []`, and the screens print "This topic has no flashcards yet."
   (`FlashcardsScreen.tsx:1192-1201`, `FillInBlankScreen.tsx:341-350`,
   `MatchingScreen.tsx:413-422`). A lapsed or free user opening a members topic is
   told the content does not exist rather than that their access lapsed.
   A *network* failure is handled correctly (the legacy path throws at `:145`).
   **Medium** — turns on whether the view row-filters or errors. Settled by
   querying `glossary_study_v` as a free user against a members topic.
5. **All four local stores quarantine corrupt data and then deny it exists** —
   `calc\workflowStore.ts:33-56`, `features\cymatics\patternStore.ts:219-243`,
   `features\production\projectStore.ts:120-143`,
   `features\tools\measure\measurementStore.ts:69-88`. Each sets a damaged blob
   aside under a `:damaged` key. `workflowStore.ts:12` says this exists *"so the
   UI can offer repair/replacement"* — **grepping `src/screens` and `src/components`
   for `damaged` returns zero hits.** The data sits on disk and the user is shown
   an onboarding empty state: `CalcProjectsScreen.tsx:184-188`,
   `CalcWorkflowsScreen.tsx:227`, `CalcResultsScreen.tsx:87`,
   `cymatics\GalleryScreen.tsx:253`, `MeasurementLibraryScreen.tsx:719`. **High.**
6. **Enrollments · browse** — `EnrollmentScreen.tsx:1722`, `:1751`. The Strict
   fetchers correctly reject on `error`, but a **missing RLS policy returns zero
   rows with no error**, so `fetchV3CertsStrict` returns `[]`
   (`v3Curriculum.ts:182`) and the tab prints *"No certificates are published
   yet."* — an authoritative claim the client never verified. This is exactly the
   v3 credential-RLS history (policy **and** GRANT both needed; the GRANT path
   errors, the policy path goes silently empty). **Medium-high.**

## M9 — Awards: the credential catalog is fetched once, failure reads as an empty catalog, and the advice is unfollowable

**File:** `C:\Users\profe\dev\ape-studio\src\screens\awards\AwardsScreen.tsx:482-497`, `:867-873`, `:938-944`

`useEffect(..., [])` calls the **lenient** `fetchV3Programs()` / `fetchV3Certs()`,
which resolve `[]` on any failure (`v3Curriculum.ts:167-170`, `:200-203`).
`v3Loaded` flips true regardless, so:

- The chooser header prints `0 certificates` (`count={v3Loaded ? specCertsAZ.length : null}`).
- The body prints *"Specialization certificates aren't available right now.
  **Pull up again in a moment**, or check your connection."*
- There is **no `RefreshControl` anywhere in the file** and no retry control, so
  "pull up again" names a gesture that does not exist.
- Reopening the picker does not refetch — it is a `<Modal>` inside `AwardsScreen`,
  and the effect's deps are `[]`. Only leaving the Awards screen entirely and
  returning re-runs it.

This is the screen where a paying member chooses the credential they will work
toward. **Confidence: high.**

## M10 — Topic names collapse to the literal string "this topic"

**File:** `C:\Users\profe\dev\ape-studio\src\data\officialTopicNames.ts:33`
`return OFFICIAL_TOPIC_NAMES[gs] ?? 'this topic';` — only **five** gs values are
codified (3060, 3070, 3081, 3970, 4370). Names otherwise come only from the live
catalog fetch, and `enrollmentStore` persists gs + flags, no names.

The fallback reads acceptably in prose ("complete this topic first"). It is
rendered as a **list-item label and card title** in at least seven places:

| Site | What the user sees |
|---|---|
| `awards\CredentialDetailModal.tsx:184`, `:193` | `SPECIALIZATION TOPICS` → a column of identical "this topic" bullets |
| `careerfinder\CareerFamilyScreen.tsx:121` | tappable rows all reading "this topic"; the a11y label is "Add this topic to your study list" for every one — the user cannot tell which topic they are adding |
| `enrollment\EnrollmentScreen.tsx:641` → `:1378`, `:1486`, `:1544` | twelve identical cards titled "this topic", plus a banner "Resume this topic" |
| `enrollment\HomeSetupSheet.tsx:94` → `:321`, `:372` | same |
| `courses\CourseSelectionScreen.tsx:1189` | the HOME carousel, with a blank subject line from `:1190` |
| `courses\StudyAreaExplore.tsx:111` | same |
| `dashboard\DashboardScreen.tsx:1182-1187` | free-topic offer rows |

Bundle cards are unaffected (names are persisted in `enrolledBundlesStore`), which
makes the topic rows look like a bug rather than an outage. Two triggers: a failed
catalog read (the lenient fetchers return `[]` with no error state at
`AwardsScreen.tsx:490` and `CareerFamilyScreen.tsx:51`), **and** simply tapping
before the ~3–4 s catalog fetch lands (the latency is noted in
`v3Curriculum.ts:48-51`).

**Should:** cache the gs→name map alongside the enrollment list, or render a
loading state rather than a name-shaped placeholder.

**Confidence: high** (verified `CareerFamilyScreen` and `CredentialDetailModal`
myself; the other five sites confirmed by line).

## M11 — "Equations & Formulas" is a permanently empty feature whose empty state gives impossible advice

**File:** `GlossaryScreen.tsx:3012-3020`, `:1777-1785`, `:2574-2593`, `:247-257`;
`src\features\study\api.ts:22-28`

By the code's own comments, **no client role holds a SELECT grant on
`formula_symbolic`/`formula_words`, and 0 of 14,246 rows carry one** (verified
2026-07-26). So `formulaById` is `{}` for every user, the row's count renders `0`,
and selecting it yields: *"No results for Equations & Formulas. Try a shorter word
or a different spelling."* There is no search term to respell.

**Should:** hide the row while the count is 0, or say the reference is not
available yet. **Confidence: high.**

## M12 — Dashboard deck can strand the STUDY tab with no way back in

**Files:** `DashboardScreen.tsx:973-996`, `:1199-1244`, `:2141-2157`;
`src\features\dashboard\deckOrderStore.ts:75-78`, `:92-94`

`deckPrefs.removed` is persisted and **never pruned against the current member
set**. `orderDeckIds` filters removed ids unconditionally, so `topics` can be `[]`
while the user genuinely has enrollments; `topic` is then undefined and the screen
falls into the error branch.

- The user removes topics A and B from the deck sheet (allowed — C remains, so the
  last-topic guard at `TopicDeckSheet.tsx:114` passes). Later they remove C on the
  **Enrollments** screen, which knows nothing about `deckPrefs`.
- The Study tab now shows "Nothing to show yet." with **Back to Login** and
  **Retry**. The deck sheet lives only in the normal render path (`:2141`), so
  there is no way to restore A or B. It survives restarts (AsyncStorage).

**Should:** prune `removed` against the current member set, or fall back to
showing all members when `kept.length === 0`.
**Confidence: high** on the code path, **medium** on how often a user walks it.

## M13 — A successful-but-empty read is shown as an error whose primary button signs the user out

**Files:** `src\features\dashboard\api.ts:262-264`; `DashboardScreen.tsx:1199-1244`

`fetchEnrollmentDashboard` resolves `empty` (no error) when the `achievements`
rows come back as zero — the documented RLS silent-empty shape. `error` stays
null, so the branch at `:1199` shows `Nothing to show yet.` with **Back to Login**
rendered as the **primary** button (`:1226-1238`; `variant` is primary whenever
`errorCode !== 'user_not_found'`). Signing out cannot fix a catalog-side empty,
and it destroys the session of someone who did nothing wrong.

**Confidence: high** on code, medium on trigger likelihood.

## M14 — Error copy naming a gesture that does not exist, or a cause the code cannot know

| Site | Copy | Reality |
|---|---|---|
| `AwardProgressScreen.tsx:154` | *"Pull to retry, or check your connection."* | The failed branch (`:146-162`) is a plain `View` — **no ScrollView, no RefreshControl**. The only control is **Back**. The user's only listed recovery is impossible. |
| `AwardsScreen.tsx:870`, `:941` | *"Pull up again in a moment"* | No RefreshControl, no retry control, and reopening the modal does not refetch (M9). |
| `DashboardScreen.tsx:888` | *"Check your connection and pull to retry."* | No RefreshControl in all 2,911 lines. There **is** a Retry button at `:1240`, so this is misleading rather than blocking. |
| `CurriculumScreen.tsx:427` | *"Couldn't load the curriculum — check your connection."* | This branch also fires on a **successful but empty** result (`:163` maps empty → `'error'`) — an RLS/curriculum-version problem, where the connection is fine. |
| `EnrollmentScreen.tsx:1707` | same wording | same catch-all (`:277-279` catches every throw class). |
| `FinalExamScreen.tsx:440` loading state | bare `<ActivityIndicator/>` | `startFinalExam` has no timeout (`finalExam\api.ts:169`), the route is a root push with `gestureEnabled:false` and `headerShown:false`, and the spinner branch renders **no back control**. On iOS there is no hardware back either, so a stalled RPC leaves the learner on a buttonless spinner on the capstone screen until the platform fetch timeout. Bounded, not infinite. |

**Confidence: high** (copy verbatim; the pull-to-retry mismatches are structural).

## M15 — Voided quiz prints a "0:00" lockout it cannot know, then offers a retake that will be refused

**File:** `C:\Users\profe\dev\ape-studio\src\screens\results\ResultsScreen.tsx:42-56`, `:100-120`

`lockout_until` is optional (`features\quiz\api.ts:65`). When the server omits it,
`useLockoutCountdown` returns `msLeft = 0` and `clock = "0:00"`, so the card
displays **"LOCKOUT / 0:00 / UNTIL YOU CAN RETRY"** and `msLeft <= 0` then shows
**"Retake Quiz"**. The server-side 15-minute lockout is still running, so the
retake fails into `under_lockout` — which, per B6, offers Back only.

**Should:** when `lockout_until` is absent, omit the clock and the retake.
**Confidence: medium-high.**

## M16 — Quiz submit: an unbounded spinner with the exits removed, and a raw database error shown to the learner

**File:** `C:\Users\profe\dev\ape-studio\src\screens\quiz\QuizScreen.tsx:484-491`, `:332-341`, `:256`; `features\quiz\api.ts:185-197`

- `supabase.rpc` has no AbortController or timeout. On a stalled connection
  `submitQuiz` never settles: no rejection, so neither the offline queue nor the
  error dialog runs. The screen is a spinner, `gestureEnabled:false`, the ‹ control
  is unmounted and the Android hardware-back listener has been **removed** while
  `submitting`. The only escape is the bottom tab bar (which does survive —
  `MainTabs.tsx:69`), and the countdown keeps running underneath.
- `:256` — `notify('Submit failed', (e as Error).message, …)` shows the **raw**
  error string. That is a Postgres exception text on a graded surface.

**Confidence: high** on both; medium on how often the stall bites.

## M17 — Scenarios: "Start a fresh set" silently does nothing on failure

**Files:** `ScenariosScreen.tsx:333-350`; `features\study\scenarioHomework.ts:170-179`

`startScenarioCycle` returns `null` on any RPC error or throw. `if (!fresh) return;`
— the `finally` resets `busy`, the label flips back from "Shuffling…" to
"Start a fresh set", and the user is told nothing. **Confidence: high.**

## M18 — Settings: the redeem sheet can trap on iOS, and Redeem can silently do nothing

**Files:** `SettingsScreen.tsx:101-114`, `:759`, `:773-782`; `features\commercial\accessCode.ts:79`

While `redeemBusy`, both buttons are replaced by a spinner **and** the scrim tap is
disabled (`:759`). On iOS there is no hardware back, so a stalled RPC leaves the
user in a modal spinner with no exit. Separately, `redeemAccessCode` calls
`supabase.auth.getSession()` **outside** its try/catch; if that rejects,
`submitRedeem`'s `finally` clears the flag but no `notify` runs and no `catch`
exists at the call site — the user taps Redeem and nothing happens, ever.

Same file `:186-192`: `await supabase.auth.signOut()` is unguarded — if it rejects
or hangs, `navigation.reset` never runs and **Log out appears dead**.
`DashboardScreen.tsx:1232-1235` already does `.catch(() => {}).then(...)` for
exactly this. **Confidence: medium** on the trap, high on the unguarded signOut.

## M19 — Glossary lock: a non-dismissible modal whose only exit can be a no-op

**Files:** `GlossaryScreen.tsx:2256`, `:2290`;
`landing\PublicGlossaryScreen.tsx:24-45`; `features\glossary\GlossaryLockView.tsx:95-150`

`GlossaryLockView` is a full-screen `Modal` whose backdrop **captures all touches**
and whose `onRequestClose` is the same handler as EXIT TO MENU. Its only two exits
are GET ACADEMY MEMBERSHIP → Paywall, and `onExit={() => navigation.goBack()}`.

`PublicGlossaryScreen`'s nav proxy intercepts **only `navigate`**, not `goBack`, so
that call reaches the raw root navigation. The file's own comment at `:32` states
that PublicGlossary can be the entry route with no back history, in which case
`goBack()` is a no-op — and then a free user who has used their weekly lookups is
in a modal with no working exit on any platform. Same shape for the device-key card.

**Confidence: medium.** I traced the reachability and the Splash carry-over
(`SplashScreen.tsx:93-98`) appears to prevent the no-history case on device: a
signed-out cold-boot deep link drops everything above `Auth`, and a signed-in one
keeps `Main` underneath. I could not construct a reachable path — but the file
documents the hazard, the consequence is a force-quit, and the fix is routing both
`onExit` calls through the proxy's Dashboard intent. Worth doing regardless.

## M20 — StudyAreaExplore: EXPLORE has no loading state and silently redirects on failure

**File:** `courses\StudyAreaExplore.tsx:42-51`, `:79-85`, `:98-104`, `:145`

`visible = !!area && list.length > 0` — while the catalog loads, `list` is `[]`, so
the modal does not render and **nothing at all happens**. The fetch takes 3–4 s
(noted in `v3Curriculum.ts:48-51`). On a failed read the lenient fetchers return
`[]`, so `onFallback()` fires (`:102`) and the user is navigated to the generic
curriculum browser. The button reads as broken, then teleports them somewhere they
did not ask for. **Confidence: high.**

## M21 — Three mic lab modules get the weakest gate copy, aimed at the wrong action

**Files:** `lab\eq\modules\LiveSpectrumEq.tsx:420`, `lab\eq\modules\SeeingFrequency.tsx:367`, `lab\HarmonicsView.tsx:1917`

Beyond B3: the fallback copy tells the user to *"Go back and re-open this **tool**"*
— but these are module pages inside a lesson, and going back exits the lesson.
`start` is destructured a few lines up in each file (`:265` / `:288` / `:972`), so
the fix is available in place. **Confidence: high.**

## M22 — `LabPreviewOverlay` can tear the scrim off a live members-only lab

**File:** `features\lab\LabPreviewOverlay.tsx:24-28`

```ts
beginLabPreviewLeave();
if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
setTimeout(endLabPreview, 350);
```

If `canGoBack()` is false the `goBack()` is skipped but `endLabPreview()` still
fires 350 ms later — removing the upgrade scrim and revealing the **live paid lab**
to a non-member, with NOT NOW appearing to do nothing.

**Confidence: low that it is reachable.** I traced it: `linking.ts:49` sets
`initialRouteName: 'Splash'` and `SplashScreen.tsx:93-98` drops everything above
`Auth` when signed out, so a lab route should always sit above something. Reported
because the consequence is a free paid feature and the guard is one line
(`else navigationRef.navigate('EarLab')`).

---

# MINOR

- **m1 · `CredentialWall` — a stuck "Finding your next certificate…"**
  `achievements\CredentialWall.tsx:74-78`, `:111`, `:217-228`. Two independent
  promises both set `failed`, but the error card is gated on
  `failed && (!rows || rows.length === 0)`. If `fetchNearestCredential` fails while
  the earned list succeeds with ≥1 row, no error shows and `WaitingSlot` renders its
  **loading** placeholder permanently. Self-heals on the next focus. *High.*
- **m2 · Career Finder — a dead SEE MY RESULTS with the reason only in the a11y label**
  `careerfinder\CareerFinderQuizScreen.tsx:115`. `canFinish = last && allAnswered(rec)`.
  The only explanation is `accessibilityLabel="See my results — answer every question first"`.
  A sighted user on question 28 of 28 gets a grey button and nothing else, and the
  only way to find the gap is tapping ‹ BACK up to 27 times. Reachable when
  `cleanResponses` (`features\careerfinder\store.ts:62-70`) drops the last stored
  answer while the persisted `index` survives (`:79`). *Medium on reachability,
  high on the missing explanation.*
- **m3 · Calculator CALCULATE can hang with no timeout and no cancel**
  `calc\CalcWorkspaceScreen.tsx:157-164`, button `:287-291`. `consumeCalc` fails
  open so the flag cannot stick permanently, but "CALCULATING…" can sit disabled
  for the whole platform fetch timeout. Capped (free/anonymous) users only. *High.*
- **m4 · Saved-list screens paint a false empty state before their read lands**
  `CalcResultsScreen.tsx:43` and `CalcWorkflowsScreen.tsx:37` initialise to `[]`
  with no loading discriminator. First paint always reads "Nothing saved yet".
  `cymatics\GalleryScreen.tsx:249` does it correctly (`patterns === null` →
  "Loading…"). Looks like data loss to a user returning to their work. *High.*
- **m5 · Flagged/Custom list reports the wrong diagnosis**
  `FlashcardsScreen.tsx:1192-1201` — the Custom-list pseudo-topic with nothing
  starred says "This topic has no flashcards yet." It is not a topic and the fix
  is "star some terms". *High.*
- **m6 · `ScenariosScreen.tsx:476`** — `if (!item) return <View style={styles.center} />`
  renders a completely blank screen with no StudyHeader and no RETURN, unlike every
  other branch in the file. Escapable via the tab bar. *High on code, low on reachability.*
- **m7 · Question figures have no `onError`** — `QuizScreen.tsx:545-553` and
  `ScenariosScreen.tsx:521-529`. A 404 leaves a blank 4:3 box under a question that
  refers to it. `FlashcardsScreen.tsx:1701-1708` already solves this with `badImages`. *High.*
- **m8 · Glossary popup can hide the filter chip row** — `GlossaryScreen.tsx:1523-1531`,
  `:1705-1718`, `:2418`. `openPopupRoot` doesn't check the id against the loaded
  corpus; a missing id renders `null` while `popupTrail.length !== 0` hides the whole
  chip row. Self-heals once the corpus loads; permanent if the id isn't in it. *Medium.*
- **m9 · About advertises a retired study method** — `about\AboutScreen.tsx:44`
  lists "ear training" among the study methods. S12 was retired
  (`ScenariosScreen.tsx:14-15`). The Ear Training **Lab** is a different, paid thing. *High.*
- **m10 · Profile full-screen ID: an unbounded name pushes the QR off screen**
  `ProfileScreen.tsx:736-746`, `:765-776`, `:1044-1046`, `:1355-1361`. `bio` is
  capped at 160 (`:822`); `name` and `registryName` are not. The full-screen ID
  renders the name unclamped in a centred, non-scrolling flex container, so a pasted
  long name pushes `CredentialQr` and the ID number out of the viewport — the one
  thing that screen exists to show. Not a dead end (tap anywhere closes). *Medium.*
- **m11 · Profile "My Progress" rows silently stop responding** — `ProfileScreen.tsx:670-683`;
  when the lenient `fetchV3Certs/Programs` fail (`:266-272`) each row degrades from
  a Pressable to a plain View with no chevron and no explanation. *Low.*
- **m12 · HOME first paint is a bare amber spinner** — `CourseSelectionScreen.tsx:1389-1395`,
  gated on `!cards || !resolved`: no copy, no timeout, no retry. Bounded by the HTTP
  timeout rather than infinite, but that can be tens of seconds on the launch surface. *Low-medium.*
- **m13 · `TopicDeckSheet.tsx:111-117`** — the last topic's ✕ is `disabled` with the
  reason in a code comment (`:108-110`), not on screen; the a11y label still says
  "Remove … from the deck". *Low.*
- **m14 · `HomeSetupSheet.tsx:74-76`, `:163-170`, `:414-416`** — for a non-member
  `guard()` is a **silent** no-op, unlike `EnrollmentScreen.tsx:644-647` which raises
  the pay sheet. The paywall appears only on the *second* tap, so the first tap on
  SAVE & RETURN / RESET / a Home toggle does literally nothing. *Low.*
- **m15 · Uncapped names in the calculator lab** — no `maxLength` on
  `CalcProjectsScreen.tsx:209` or `CalcWorkflowEditScreen.tsx:156`, and the run
  screen renders the name with no `numberOfLines` at `CalcWorkflowRunScreen.tsx:430`
  and `:450` inside a row header (`:728`). A long pasted name wraps indefinitely.
  The rest of the app caps correctly (cymatics 80/600, MultiMeter 280). *High on code.*
- **m16 · Cymatics studios print a raw native error string** —
  `PlateStudioScreen.tsx:554` (and Liquid/Membrane). `tone.error` is `e.message`
  straight from `ApeDsp.genStart()` (`useDriveTone.ts:110`), so a customer sees an
  `AVAudioSession` error code as bare on-screen text. Cleared only by a later
  *successful* start, so it lingers after `stop()`. *High.*
- **m17 · "Starting the analyzer…" forever** — `LiveSpectrumEq.tsx:421-423`,
  `SeeingFrequency.tsx:368`. After `useToolAutoStart` exhausts `MAX_REARMS`
  (`engine\useDspEngine.ts:240, 257`) the state sits at `idle` permanently.
  `EngineGate` returns `null` for `idle` (`:40`), so the line reads "Starting…"
  forever with no error card. A start control does exist, so it is misleading
  rather than a dead end. *High.*
- **m18 · `TubeCardScreen.tsx:335-337`** — the `.catch` doesn't reset `failReason`,
  so a network throw after a prior auth failure reuses the sign-in copy. *Low.*
- **m19 · Unengravable name → unfixable retry** — `ProfileScreen.tsx:219-225`
  produces "Could not prepare the certificate. Try again." for a name the fitter
  rejects (`certificatePdf.ts:94`) — retrying can never fix it. Mitigated by the
  inline warning at `:777-781`. *Low.*
- **m20 · Career Finder feedback note is uncapped** —
  `CareerFinderResultsScreen.tsx:222` has no `maxLength`, and the text is embedded
  in a `mailto:` URL (`lib\feedback.ts:57`). A very long note overflows the URL;
  `Linking.openURL` then fails into the honest fallback at `:60-62`, so the user is
  told how to reach support but loses what they typed. *Low.*

---

# Verified negatives (checked, nothing to fix)

These are real results, not omissions.

- **Android hardware back.** A parser sweep of every `<Modal>` in `src` found
  **zero** without `onRequestClose`. Every modal in the app is escapable with the
  Android back button.
- **Bare-spinner early returns are all escapable.** The five screens that return a
  naked `<ActivityIndicator/>` (`CourseSelectionScreen:1390`, `DashboardScreen:1192`,
  `FillInBlankScreen:352`, `FlashcardsScreen:1184`, `MatchingScreen:424`) are all
  tab scenes or inside `StudyStack`, so the bottom tab bar survives and the user can
  leave. `GateHold` (B2) is the only blank screen on a root push with no tab bar.
- **Back affordances on lab routes.** All 68 lab route registrations resolve to a
  visible back control — via `PagedLab.tsx:160`, `LabShell.tsx:321`, or their own
  header — including every conditional/early-return branch. The three cymatics
  studios are covered by `LabShell` despite having no `goBack` of their own.
- **`ScreenErrorBoundary`** is sound: it renders TRY AGAIN, plus GO BACK when
  `canGoBack()`, is a sibling of `LowLightDim`/`AppDialogHost` so those survive a
  crash, and clears on blur so a tab scene retries fresh.
- **`lib/confirm.ts` fallback** is correct — the themed host is used only when
  `isAppDialogHostMounted()`, otherwise the platform dialog.
- **`PaywallScreen`** is the most hardened screen in the app on this axis: the
  store-cancel path routes to `onError(null)` (`purchase.ts:78, 138`) so `busy`
  always clears; every restore outcome has distinct honest copy; the guest-purchase
  and not-resolved guards fail safe.
- **Certificate PDF escaping** — `features\credentials\certificateHtml.ts:60-62`
  escapes every interpolation. No injection or layout break from a credential name.
- **Division / NaN / Infinity** — every denominator found is guarded
  (`EnrollmentScreen.tsx:1048-1050`, `:1182-1184`; `topicPct.ts:68`;
  `study\api.ts:287`). `InsideStats.tsx:108` renders `—` for null rather than an
  invented number.
- **Skia gates** — all seven are sound and their call sites render honest fallback
  cards. `FxLabScreen.tsx:90` returning `null` is a correct fall-through to the
  static heroes.
- **Export/share plumbing** — `shareImage.ts`, `galleryExport.ts`, `harmoExport`
  all catch internally and return honest statuses; `ExportPanel.tsx:117-150` maps
  every one to specific copy; `MeasurementLibraryScreen.tsx:505-518` falls back to a
  text share and does not claim the image was sent.
- **`InstitutionalScreen`** is registered (`RootNavigator.tsx:394`) and names the
  parked academic/institutional mode, but the Profile row that used to open it is
  gone and the only remaining entry is `DevVisualIndex`, mounted behind `__DEV__`
  (`ProfileScreen.tsx:629`). **Not reachable in a release build** — no hard-rule
  violation. Worth deleting the route so it cannot come back.
- **Empty `onPress={() => {}}` bodies** — all 13 are the standard
  backdrop-tap-swallow pattern with `accessible={false}`. The only genuinely dead
  control found by that sweep was `AwardProgressScreen.tsx:257`, which is correct
  (see the B5 correction).

---

# Corrections to earlier passes

1. **"Manage My Learning has a permanently disabled TAKE FINAL EXAM button"** —
   correct, but pass 2 attributed it to the wrong screen. On
   `AwardProgressScreen.tsx:245-262` the button is conditional and carries a visible
   explanation; that screen is fine. The permanently dead one is
   `EnrollmentScreen.tsx:1117` / `:1216` — see **B5**.
2. **"The Final Exam's membership wall offers only Back"** — confirmed, and it is
   one of five codes in `EXAM_START_ERROR_COPY` that dead-end. See **B6**.
3. **`fetchMyCredentials` "you have earned nothing"** — fixed in the function, but
   two call sites still swallow it: `ProfileScreen.tsx:205` (M8.3) and
   `MyProfileView.tsx:155` (`.catch(() => [])`, cosmetic there — the profile itself
   loads correctly).
4. **`AudioCommunityDirectoryScreen.tsx:133-138`** has a `.then` with no `.catch`
   that looks like a stuck-spinner bug. It is not: `fetchPublicProfile`
   (`directory\api.ts:351-385`) wraps everything in try/catch and cannot reject.
   Defensive only.

---

# If only five things get fixed

1. **B1** — production labs lose the learner's work silently. Data loss, flagship feature.
2. **B3** — one prop per call site restores the recovery control on every mic tool and lab.
3. **B2** — `GateHold` needs a spinner and a back control. One component, ~40 routes.
4. **B6** — route `academy_required` to the Paywall and delete the six "your professor" strings.
5. **B5** — link the Enrollments card to `AwardProgress`, or say why the button is dead.
