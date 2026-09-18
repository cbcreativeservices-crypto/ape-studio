# Pass 1 — Navigation and routing

Date: 2026-09-17. Branch `audio-tools-engine`. Read-only pass: nothing was
edited, staged or committed.

## Scope and method

- **Swept:** all 841 `.ts`/`.tsx` files under `src/`, plus `App.tsx` and
  `app.json`, by grep for `navigate` / `replace` / `push` / `reset` / `popTo` /
  `popToTop` / `goBack` / `dispatch`. 289 files contain at least one such call.
- **Read in full or in substantial part:** ~55 files — the whole of
  `src/navigation/` (9 files), `App.tsx`'s container wiring, `labCatalog.ts`,
  `labMembership.ts`, and every screen that owns a non-trivial navigation call.
- **Diffed three complete lists**: 118 routes declared in `RootStackParamList`,
  118 screens registered in `RootNavigator`, and every literal
  `navigate`/`replace`/`popTo` target in `src/`.
- Also read the React Navigation 7.6.0 router source in `node_modules` to
  confirm the runtime semantics of `NAVIGATE`, `POP_TO` and `RESET` rather than
  relying on memory.
- `npx tsc --noEmit` — **clean (exit 0)**. `npm test` — **1429 pass, 0 fail**.

## What I could not check

- **No device or simulator run.** Everything below is from reading code; the
  stack-shape claims are derived from the RN 7.6.0 router source, not observed.
- **No dev server / browser preview** (another process owns 8091, per the brief).
- **iOS universal links end-to-end** — the website half (AASA / assetlinks) is
  not built, per `docs/discoverability/URL_ROUTE_CONTRACT.md` §7.
- **Restored navigation state after an OS kill.** The app does not set
  `NavigationContainer`'s persistence props, so I believe state restore is off,
  but a native-level restore on iOS could still produce a stack shape I did not
  model.
- **Concurrent edits.** `src/navigation/types.ts`, `src/screens/quiz/QuizScreen.tsx`
  and `src/screens/results/CelebrationScreen.tsx` were changed by another session
  while this pass ran. Two real bugs I had confirmed in the quiz → Celebration
  hand-off — a raw score count being rendered into `FINAL QUIZ: {score}%`, and a
  `perfect-score` test of `score >= 100` that could never fire — were **already
  fixed on disk** by that session before I wrote this, so they are not listed as
  open. Everything below was re-verified against the files as they stood at the
  end of the pass.

---

## Seven deep links in `linking.ts` are rejected by the app's own link filter

**Severity:** serious
**Where:** `src/navigation/linking.ts:83-93` vs `src/navigation/linkPaths.ts:141-144`

**What happens:** Tapping any of these links does nothing useful. On Android the
`/labs` intent filter matches, so the app *opens* — and then lands on Home/Auth
with the requested screen never shown, and the browser never gets a chance to
serve the website page either. On the custom scheme (`proaudio://…`, the only
form that works today) the URL is silently dropped.

Affected paths, all declared as routes but all rejected:

| Declared path | Route |
|---|---|
| `labs/production/:lab/:projectId/:stageId` | `ProductionStage` |
| `labs/production/:lab/exercise/:activityId/:pathway` | `ProductionActivity` |
| `labs/cymatics/plate` | `CymaticsPlateStudio` |
| `labs/cymatics/liquid` | `CymaticsLiquidStudio` |
| `labs/cymatics/membrane` | `CymaticsMembraneStudio` |
| `labs/cymatics/gallery` | `CymaticsGallery` |
| `labs/cymatics/module/:id` | `CymaticsModule` |

**Why:** `linking.filter = isAcceptedLink`, and `isClaimedPath` handles `labs`
with `return more.length === 0` — i.e. it accepts `labs` and `labs/<one-slug>`
and nothing deeper. I confirmed this by running the exact function body over
every path in `linking.config.screens`: the twelve two-segment lab paths pass,
these seven fail. The filter runs *before* React Navigation ever resolves the
path, so the route table entries are unreachable.

This is also a contract break: `docs/discoverability/URL_ROUTE_CONTRACT.md` §1
says the three path lists (`isClaimedPath`, `app.json` intent filters, the
website AASA) "move together", and its table claims only `/labs/{lab-slug}`.
The Cymatics Phase 3/4 and Production Labs work added these paths to
`linking.ts` alone.

**Fix:** decide per §1 of the contract whether the app handles these *well*.
If yes, extend `isClaimedPath`'s `labs` case to accept the specific deeper
shapes (e.g. `second === 'cymatics'` with a known third segment, and
`second === 'production'`), add the matching rows to the contract table, and —
because `pathPrefix: "/labs"` in `app.json` already covers them — nothing else
on Android. If no, delete the seven entries from `linking.ts` so the route table
stops advertising links the app refuses. **Do not** widen the `labs` case to
`return true`: that would claim `/labs/anything/at/all` and hand every unknown
website lab URL to the app.

---

## "View on Profile" after the Final Exam pushes a second tab shell

**Severity:** serious
**Where:** `src/screens/exam/FinalExamResultScreen.tsx:124`

**What happens:** A user passes a Final Exam, taps **View on Profile**, and gets
the Profile tab — but a whole second copy of the app's tab shell is now mounted
on top of the exam stack. Back (Android hardware back, or any `goBack`) does not
leave Profile for Home; it drops back onto the Final Exam result screen, then
`AwardProgress`, then finally the original shell. Two `MainTabs` are alive at
once, so Home and the Dashboard mount twice with their own fetches and timers.

**Why:**

```ts
onPress={() => (navigation as any).navigate('Main', { screen: 'Profile' })}
```

Under React Navigation 7 (`StackRouter.js:196-270`) `NAVIGATE` reuses an
existing route **only when it is the current route**; otherwise it pushes. At
this point the stack is `[Main, …, AwardProgress, FinalExamResult]`, so `Main`
is pushed a second time. This is the exact failure five other screens already
document and guard against — `ToolsHubScreen.tsx:1010`, `AwardsScreen.tsx:711`,
`EnrollmentScreen.tsx:754`, `CareerFamilyScreen.tsx:69`, `StudyHeader.tsx:41`
all carry a comment saying "navigate('Main') PUSHES a second tab shell … popTo
returns to the existing one". `FinalExamResultScreen` was missed. The `as any`
is what let it through the type checker.

**Fix:** use the same call the other five use:

```ts
onPress={() => navigation.popTo('Main', { screen: 'Profile' })}
```

`popTo` is typed on a native-stack navigation prop, so the `as any` can go too.

---

## Career Finder's "try a lab" next step opens members-only labs unlocked

**Severity:** serious
**Where:** `src/screens/careerfinder/CareerFinderResultsScreen.tsx:155`,
table in `src/features/careerfinder/labsForDimension.ts:16-31`

**What happens:** The Career Finder is free to everyone with no account. Its
results page offers "Try a lab that uses <dimension>". Eight of the fourteen
labs it can offer are members-only, and tapping the row opens them **live and
fully interactive** — no lock, no preview scrim, audio running: `MicSelectLab`,
`EqLabHome`, `EnvelopeLab`, `SignalChainLab`, `CableLab`, `MeterLab`,
`EarTrainingLab`, `GainLabHome`. (The other six are either free or happen to be
wrapped: `OscillatorLab`, `CableInstallLab`, `DigitalLab` are wrapped;
`FoundationsCourse`, `CalcLab` are free; `TubeReference` gates itself.)

**Why:** two independent gates exist and neither covers this path.
`EarLabScreen.openLeaf` (`:85-89`) calls `startLabPreview(...)` *before*
navigating, which is what arms `LabPreviewOverlay`. `withMembershipPreview` is
the screen-level backstop — but `RootNavigator`'s `MemberGated` registry
(`:212-228`) wraps only 15 routes, and its own comment scopes the invariant
narrowly: "any lab given a deep-link path in linkPaths.ts that is members-only
per labCatalog MUST be wrapped here too". These eight have no deep-link path,
so they were never wrapped. `CareerFinderResultsScreen` calls
`navigation.navigate(lab.route as never)` with no `startLabPreview`, so nothing
arms. The header comment in `labsForDimension.ts:6-7` asserts the opposite —
"member-only labs preview rather than block (LabPreviewOverlay), so every link
is safe to follow" — which is simply not true for these eight.

The same shape applies to the Glossary's "Launch Lab" action
(`GlossaryScreen.tsx:1574`, table `learningProfiles.ts:26-53`), which can open
`MeterLab`, `FmLab`, `ModularLab`, `BinauralLab`, `BassLab` and `AutotuneLab`
the same way.

**Fix:** stop relying on each caller remembering. Widen `MemberGated` in
`RootNavigator.tsx` to wrap **every** route for which
`isMemberOnlyLabRoute(route)` is true, not just the deep-linkable ones, and
change the invariant comment to say so. `withMembershipPreview` already no-ops
for free routes and for members, so over-wrapping is safe. Then delete the false
claim in `labsForDimension.ts`'s header.

**Related:** the entitlement pass filed the `proaudio://labs/<category>` route
into this same hole as a blocker
(`docs/bughunt/pass1-entitlement.md` — "`proaudio://labs/<category>` opens 28
members-only labs live, unlocked"), and the Cymatics/Production variant as
serious. One fix in `MemberGated` closes all of them; I have not duplicated
those findings here.

---

## Cymatics "ALL 17 / back to the list of all experiments" pushes instead of popping

**Severity:** serious
**Where:** `src/screens/lab/cymatics/ExperimentWell.tsx:100`

**What happens:** While running a guided Cymatics experiment the learner taps
**ALL 17** — labelled to a screen reader as "Back to the list of all
experiments". Instead of going back, a *new* copy of the experiments module is
pushed on top, and the studio stays mounted underneath with its simulation and
audio still running. Pressing ‹ from the new list returns to the studio, not to
the Cymatics Lab home, so the learner cannot get out the way the control
promised. Bouncing list → studio → list grows the stack without bound, each
level holding another live studio.

**Why:** `navigation.navigate('CymaticsModule', { id: 'experiments' })`. Per the
RN 7 router (above), `CymaticsModule` is not the current route, so `NAVIGATE`
pushes. The same file's PREV/NEXT get this right — they use
`StackActions.replace` (`:46`) precisely so "the studio stays a single screen in
the stack" — so the intent is clear and only this one control missed it.

**Fix:** `navigation.popTo('CymaticsModule', { id: 'experiments' })`. RN 7's
`POP_TO` pops back to the existing module when it is in the stack and, when it
is not (the learner entered the studio from the Cymatics home), replaces the
current route rather than stacking — which is the right behaviour in both cases.

**Same pattern, lower stakes, same fix:** the forward chips between the studios
and the gallery also push duplicates when the learner arrived from the other
side — `PlateStudioScreen.tsx:559,620-622`,
`LiquidStudioScreen.tsx:521,583-585`, `MembraneStudioScreen.tsx:474,545-547`,
`GalleryScreen.tsx:179,256-258`. A studio → gallery → studio round trip leaves
two heavy simulation screens mounted. These read as forward links so pushing is
defensible, but `popTo` would collapse the loop.

---

## Help's "Open Settings" stacks a second Settings modal

**Severity:** minor
**Where:** `src/features/help/helpContent.ts:89` and `:100`, dispatched at
`src/screens/help/HelpScreen.tsx:108`

**What happens:** The normal route into Help is Settings → "Help & FAQ"
(`SettingsScreen.tsx:591`). From there, two FAQ answers offer "Open Settings".
Tapping one leaves the stack at `[…, Settings, Help, Settings]` — two Settings
modals with a Help modal sandwiched between them. The ✕ takes three taps to get
back out, and each tap looks like it did nothing because the screen behind is
the same screen.

**Why:** both are `presentation: 'modal'` root routes
(`RootNavigator.tsx:322-323`), and `onJump` is a bare
`navigation.navigate(route, params)`. RN 7 pushes because `Settings` is not the
current route. Both screens exit with `navigation.goBack()`
(`SettingsScreen.tsx:280`, `HelpScreen.tsx:55`), so nothing collapses the
duplicate.

**Fix:** in `HelpScreen.tsx:108`, close Help before jumping, so the jump lands
on the screen the user actually wanted:

```tsx
onJump={(route, params) => { navigation.goBack(); navigation.navigate(route, params); }}
```

That also fixes the `Paywall` jump (`helpContent.ts:83`), which currently opens
the paywall modal over the Help modal.

---

## `ProductionLab` is registered and declared but nothing can reach it

**Severity:** minor
**Where:** `src/navigation/RootNavigator.tsx:434`, `src/navigation/types.ts:289`

**What happens:** Nothing, today — it is dead weight. But it is a trap: the
route exists, is typed, and renders the production lab, so a future caller will
reasonably `navigate('ProductionLab', { lab })` and silently skip whatever
`PreProdLab`/`PostProdLab` are meant to fix.

**Why:** the two labs are reached through the named entries `PreProdLab` and
`PostProdLab`, which carry `initialParams` (`:424-433`) and are what
`labCatalog.ts:220-221` and `linking.ts:81-82` point at. I grepped every string
occurrence of `ProductionLab'` in `src/`: the only hit outside the navigator and
the param list is the screen's own `RouteProp<…, 'ProductionLab'>` type alias.
No `navigate`, no deep link, no catalog row.

**Fix:** delete the `ProductionLab` `Stack.Screen` and its `RootStackParamList`
entry, and retype `ProductionLabScreen`'s route prop to
`RouteProp<RootStackParamList, 'PreProdLab' | 'PostProdLab'>`. (The entitlement
pass separately notes that `MemberGated.ProductionLab`'s wrapper is a no-op on
this route name.)

---

## `LabCategory` has no in-app entry point — the second IA level is orphaned

**Severity:** minor
**Where:** `src/screens/lab/LabCategoryScreen.tsx`, registered
`RootNavigator.tsx:376`, only reachable via `linking.ts:95` (`labs/:id`)

**What happens:** The "category → labs in that category" screen can only be
reached by a deep link. Every in-app path into the labs now renders the full
category list inline, so a user cannot get to this screen by tapping.

**Why:** `EarLabScreen` was restructured into an accordion
(`EarLabScreen.tsx:143-170`): a `kind: 'hub'` category header opens `openHub`
(which goes to the hub's own route, i.e. `CalcLab`), and a `kind: 'list'`
category renders a plain `CategoryLabel` with **no** `onPress` plus its rows
inline. Nothing calls `navigate('LabCategory', …)` anywhere in `src/` — I
checked every literal and every dynamic route source.

That matters beyond tidiness because this orphaned screen is the ungated door
the entitlement pass filed as a blocker: it has no `leafLocked`, no 🔒 and no
`startLabPreview`, unlike `EarLabScreen`.

**Fix:** decide which it is. Either give it an entry point (make a `list`
category's `CategoryLabel` tappable again) **and** port `EarLabScreen`'s
`leafLocked`/`startLabPreview` logic into it; or retire it — drop the screen,
the `LabCategory` route and the `labs/:id` linking entry, and let
`isClaimedPath` stop claiming unknown `labs/<slug>` paths so the website keeps
them. It should not stay as-is: a screen no one maintains, reachable only by
URL, with the locks missing.

---

## iOS has no `associatedDomains`, so every https prefix in `linking.ts` is inert there

**Severity:** minor
**Where:** `app.json` → `expo.ios` (no `associatedDomains` key);
`src/navigation/linking.ts:5-8` and `:42`

**What happens:** On iOS, `https://proaudiotrainingacademy.com/glossary/...`
never opens the app — iOS has no entitlement telling it to. Only
`proaudio://…` works. Android is configured (`android.intentFilters`, nine path
prefixes × two hosts, `autoVerify: true`).

**Why:** `linking.prefixes` includes both https hosts and `linking.ts`'s header
comment says the handshake is completed by "app.json `ios.associatedDomains` /
`android.intentFilters`" — but the iOS half was never added. The `ios` block
contains only `supportsTablet`, `bundleIdentifier` and `infoPlist`.
`docs/discoverability/URL_ROUTE_CONTRACT.md` §7 acknowledges "the https forms
stay inert until the website hosts the two association files", so this is
consistent with a known gap — but the *app-side* entitlement is missing too, and
that is the half that cannot be fixed later over the air.

**Fix:** if universal links are wanted at launch, add
`"associatedDomains": ["applinks:proaudiotrainingacademy.com", "applinks:www.proaudiotrainingacademy.com"]`
to `expo.ios` **before the next native build** — it is an entitlement, so
`eas update` cannot deliver it. If they are not wanted at launch, correct the
comment in `linking.ts` so the next reader does not assume it is wired.

---

## The glossary's `LabRoute` union duplicates the route list by hand

**Severity:** polish
**Where:** `src/features/glossary/learningProfiles.ts:26-53`

**What happens:** Nothing today — I checked all 28 members of the union against
the registered screens and every one is real.

**Why:** it is a hand-written copy of part of `RootStackParamList`, with a
comment saying "Extend as labs ship". A renamed route would compile here and
fail at runtime with an unhandled-action warning.

**Fix:** `export type LabRoute = Extract<keyof RootStackParamList, \`${string}Lab\` | 'FoundationsCourse'>`
is one option; simplest is
`type LabRoute = keyof RootStackParamList` narrowed by a `satisfies` on the
table, so a rename breaks the build instead of the app.

---

## Checked and found nothing

Each of these was examined specifically, against the code, and is correct:

- **Routes referenced by a `navigate()` that are not declared, or declared but
  not registered: none.** The three lists match exactly — 118 keys in
  `RootStackParamList`, 118 `Stack.Screen` registrations, zero in either
  direction. Every screen is registered unconditionally (nothing behind
  `__DEV__` or a feature flag), and every literal `navigate`/`replace`/`popTo`
  target across `src/` resolves to a declared route in its own navigator or a
  parent (`StudyStack`, `AchievementsStack`, `MainTabs` and the root stack all
  cross-checked). No tap goes nowhere.
- **`labCatalog.ts` route fields: no dead links.** `LabLeaf.route` and the hub
  `route` are typed `keyof RootStackParamList`, so `tsc` enforces them, and all
  resolve to registered screens. The two rows carrying `params` are correct too:
  `MeterModule { id: 'detective' }` is a real id in
  `screens/lab/meter/modules/registry.ts:22`, and `PreProdLab`/`PostProdLab`'s
  `{ lab: 'preprod' | 'postprod' }` match both the `LabKind` param type and the
  navigator's `initialParams`. No leaf carries `status: 'development'`, so no
  placeholder rows render — consistent with the standing "no placeholder rows"
  rule. (One exception worth knowing about, outside the catalog:
  `SmartProcessorsLabScreen.tsx:17-24` renders five hard-coded routeless rows
  labelled with `DEV_NOTE` — "Coming Soon". They are correctly non-tappable and
  `accessibilityState.disabled`, so they are not dead *links*, but they are
  placeholder rows.)
- **Every `(navigation as any)` / `as never` / `as unknown as {…}` navigation
  cast — all 55 of them, checked individually.** The only one hiding a real
  defect is `FinalExamResultScreen.tsx:124`, reported above. The rest are either
  (a) a child navigator legitimately addressing a parent's route, where the
  action correctly bubbles — `CourseSelectionScreen`'s 19 casts,
  `DashboardScreen`'s 8, `GalleryScreen.tsx:82`, `AchievementsHomeScreen.tsx:85`,
  `ProfileScreen`'s 6 — or (b) a loose `(route: string, params?: object)` cast
  over data that is itself typed (`EarLabScreen.tsx:69`,
  `LabCategoryScreen.tsx:38`). I verified the params of each cast call against
  the declared param type; `Trophy`, `Celebration`, `Results`, `AwardProgress`,
  `FinalExam`, `Awards`, `Achievements` and `Study` all match.
- **Dynamic route strings (`navigate(x.route)`) — every source table checked.**
  `deEsserModel.CONNECTIONS` (5 routes), `LAB_FOR_DIMENSION` (14),
  `learningProfiles.LabRoute` (28), `FoundationsCourseScreen.ToolRoute` (7),
  `lastStudyLocation.StudyMethodRoute` (4), `DashboardScreen.STUDY_ROUTES` (4),
  `helpContent` jumps (3), `cymatics/presets.experimentRoute` (3),
  `SmartProcessorsLabScreen.FAMILY` (1), `OpenLabLink` call sites in
  `connectorselect/pagesD.tsx` and `mixing/pagesAdvA.tsx`/`pagesC.tsx`,
  `CurriculumScreen`'s `finder.route` (3). Every value is a registered screen.
- **`navigation.reset()` targets:** all 16 reset sites dispatch shapes the
  receiving navigator can build — `SplashScreen.tsx:82` (carries pushed routes
  over the new base, and filters `Main` out when signed out),
  `AuthScreen.tsx:88,92`, `CelebrationScreen.tsx:79,99,115`,
  `ResultsScreen.tsx:73,85`, `TrophyScreen.tsx:51`, `SettingsScreen.tsx:190,687,749`,
  `SessionExpiryGuard.tsx:50`, `SingleDeviceGuard.tsx:60`. The two nested shapes
  (`Main → Study → Dashboard`, `Main → Achievements → AchievementsHome`) match
  the registered navigators. `GlossaryScreen.tsx:2286` resets to `Splash` from
  inside `StudyStack`: `BaseRouter`'s `RESET` returns `null` when a route name is
  unknown to that navigator, so the action correctly bubbles through the tab
  router to the root stack. `MainTabs.tsx:46` and `TabBar.tsx:62` both target the
  nested stack's live key and are guarded against firing at an already-root
  stack.
- **`goBack()` with no history:** 136 call sites. The two that genuinely can be
  entry routes already carry explicit fallbacks — `TrophyScreen.tsx:46-58`
  (`canGoBack()` else reset to the Trophy Case) and
  `PublicGlossaryScreen.tsx:32-36` (`canGoBack()` else `navigate('Main')`). For
  every other deep-linkable screen, `SplashScreen` guarantees a base route
  (`Main` or `Auth`) underneath before it hands off, and on a warm start
  `navigateToPath` deliberately navigates rather than resets
  (`linking.ts:128-135`), so `goBack()` always has somewhere to land. No
  unguarded dead end found.
- **Deep-link path params vs route param types:** every claimed path's params
  are handled. `topics/:topicSlug` → `DashboardScreen.tsx:975-994` resolves the
  slug against loaded topic names and clears the param afterwards.
  `glossary/:query` → `PublicGlossaryScreen.tsx:23` runs it through
  `slugToQuery` before handing it to the glossary, so `phantom-power` searches
  "phantom power". `awards/:category` and `tools/:toolKey` are constrained to
  known values by `AWARD_PAGES` / `TOOL_INFO_KEYS` in the filter.
  `labs/:id` → `LabCategoryScreen.tsx:29-36` renders an honest "This category is
  not available" for an unknown id.
- **Deep-link route ranking:** `labs/:id` cannot shadow the twelve static
  `labs/<name>` paths — RN's `getStateFromPath` scores static segments above
  parameterised ones — and the two `labs/production/…` patterns have different
  segment counts, so they cannot collide with each other.
- **`popTo` targets:** all 10 sites name a route that belongs to the navigator
  they are dispatched on, and RN 7's `POP_TO` replaces the current route when the
  target is absent (verified in `StackRouter.js:394-422`), so the cold-start
  deep-link case — where `Main` may not be in the stack — degrades to a replace
  rather than failing.
- **`pendingLink` resume:** stores only a path that passed `isAcceptedLink`,
  in memory, single-use; `AuthScreen` resets first and resumes second, so a
  failed resume still leaves the user somewhere valid. `SplashScreen.tsx:74`
  clears it when a real account is already signed in.
- **Link-security hardening** (`parseLink`): re-read and it holds — userinfo,
  foreign schemes, backslashes, `%2F`/`%5C`, traversal and over-long input are
  all rejected before the host allowlist. Covered by `test/linkPaths.test.ts`.
  The gap reported at the top is a *claimed-path* gap, not a parsing one.

---

## Suggested order

1. `FinalExamResultScreen.tsx:124` → `popTo`. One line, graded capstone path.
2. Widen `MemberGated` to every members-only lab route — closes the Career
   Finder and Glossary holes here **and** the entitlement pass's `labs/<category>`
   blocker in one change.
3. `ExperimentWell.tsx:100` → `popTo`, before the Cymatics Phase 4 device pass.
4. Decide the seven `labs/*` deep links: claim them properly in `isClaimedPath`
   + the contract table, or remove them from `linking.ts`.
5. Decide `ios.associatedDomains` **before** the next native build — it cannot
   ship over the air afterwards.
6. Tidy: `HelpScreen` jump, `ProductionLab` route, `LabCategory`'s fate,
   `LabRoute` union.
