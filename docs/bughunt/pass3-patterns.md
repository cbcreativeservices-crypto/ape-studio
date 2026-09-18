# Pass 3 — Agent H: the same bug, somewhere else

Sweep of the whole repo for **other instances of each bug class** found in passes 1
and 2. Read-only on source; nothing outside this file was edited.

Scope: `src/**` (843 `.ts`/`.tsx`), plus `App.tsx`, `index.ts`, `test/**`,
`supabase/functions/**`, `admin-console/**`. `dist/`, `web/.next/` and
`node_modules/` excluded as build output.

---

## Counts per class

| # | Class | REAL | BENIGN / checked-and-cleared | Worst severity |
|---|---|---|---|---|
| 1 | Failed read presented as an empty result | 2 | 14 | MINOR |
| 2 | Narrow transient-error regex | 2 | 4 | MINOR |
| 3 | A promise the code does not keep | 4 | 5 | MAJOR |
| 4 | Hook below an early return / conditional hook | **0** | 4 technical, 1,098 scopes swept | — |
| 5 | Latch set before the action it guards | 1 | 7 | MINOR |
| 6 | In-memory module cache not in the reset registry | 9 | ~90 | MAJOR |
| 7 | A wrapper that looks like a gate and is not | 3 | 24 pairs | **BLOCKER** |
| 8 | Hardcoded constant where the real value is available | 2 | 6 | MINOR |
| 9 | `parseFloat` / `Number()` / `Date.parse` on user text | 6 | ~180 | MAJOR |
| 10 | Value written and never read (or read and never written) | 7 | 117 dead exports triaged | MAJOR |

**Totals: 36 REAL, ~340 instances checked and cleared.**

The headline is **class 7, instance 7.1** — a BLOCKER. The `Gated` /
`MemberGated` fix from pass 2 is **inert on 8 routes**, including 5 that a
non-member can reach with a bare URL and no parameters, on both flagship paid
labs. It is the same bug, one layer down, and the repo's own comment asserts it
is fixed.

---

# Class 1 — A failed read presented as an empty result

**2 REAL · 14 BENIGN.** Method: every `catch { return [] }` / `catch { return {} }`,
every `.catch(() => [])` / `.catch(() => null)`, every `if (error || !data) return []`
in `src/`, then the call site of each to see what the UI does with the empty.

The repo has largely learned this one: `src/data/v3Curriculum.ts:31-46` now carries a
written ERROR MODEL and a strict/lenient split, and `CurriculumScreen` compensates
deliberately. The two survivors are both places where the compensation is missing.

### REAL

**1.1 — `src/screens/courses/StudyAreaExplore.tsx:44` — a partial catalog failure is cached for the session.** MINOR.
```ts
catalogPromise = Promise.all([fetchV3Certs(), fetchV3Programs(), fetchV3Curriculum()])
```
All three are the LENIENT wrappers (`Strict().catch(() => [])`). The guard on the
next line only un-caches the **total** failure (`certs.length === 0 && programs.length === 0`).
If certs and programs succeed but the curriculum read fails — one RLS hiccup, one
dropped request of three — the `names` map is empty, topic names vanish from the
credential cards, and the bad result is memoised in `catalogPromise` for the rest
of the session. No error, no retry. Confidence: high (traced); the mixed-failure
window is narrow, hence MINOR.

**1.2 — `src/screens/curriculum/CurriculumScreen.tsx:157` — the M15 state machine reads through the lenient twin.** MINOR (latent).
The comment at :149 names this screen as the one that must distinguish a failed
load from a real empty, and the docblock in `v3Curriculum.ts:36-38` names it as a
screen that "must use the Strict variants". It calls `fetchV3Curriculum()`, the
lenient one. It is **correct today** only because of the compensation on :163
(`flat.length > 0 ? 'ready' : 'error'`) and the assumption that a live 171-topic
curriculum is never legitimately empty. It is a rule stated and not followed, and
the day the curriculum can legitimately be empty for a user it silently becomes
"nothing here". Confidence: high on the code; "latent" is the honest severity.

### BENIGN — checked, with why

- `src/data/v3Curriculum.ts:77,169,203` — the lenient wrappers themselves. Deliberate,
  documented, and every remaining caller is on the docblock's exemption list
  (AwardsScreen compensates via `v3Loaded`; `achievements/api.ts:76`, `CareerFamilyScreen:51`,
  `CourseSelectionScreen:1049`, `HomeSetupSheet:84`, `ProfileScreen:266` use the data as
  non-fatal name enrichment). `EnrollmentScreen:268-270` and `achievements/api.ts:221`
  correctly use Strict.
- `src/screens/curriculum/CurriculumScreen.tsx:171` — `credCounts` from a lenient
  programs/certs read. I expected "0 certificates" shown as fact; it is not:
  :285/:295 render `academy.certificates ?? (credCounts.certs || null)`, and `0 || null`
  is `null`, which renders the loading state. Correct by accident of `||`, but correct.
- `src/features/study/api.ts:251,270` (`fetchTermTopicNames`, glossary media map) —
  both are decoration on a row that has already rendered; an empty map hides an icon,
  it does not say "nothing here".
- `src/features/study/localProgress.ts:82`, `src/features/tools/measure/measurementsBackend.ts:34`,
  `src/features/tools/measure/deviceProfile.ts:238`, `src/screens/lab/calc/workflowStore.ts:139,155`
  — local AsyncStorage reads. `[]` is the honest answer for "absent", and each
  validates shape rather than trusting it.
- `src/features/tools/measure/measurementStore.ts:172` — drops one corrupt row, keeps
  the library. Explicitly the right call, and commented as such.
- `src/features/cymatics/patternStore.ts:243`, `src/features/production/projectStore.ts:141`,
  `src/screens/lab/calc/workflowStore.ts:54` — quarantine-then-empty. These write the
  unreadable blob to `<key>:damaged` before clearing, so nothing is destroyed. One
  sharp edge worth an owner's eye but **not** reported as a bug: `workflowStore.ts:47-54`
  reaches its catch on a `JSON.parse` throw *or* on an `AsyncStorage.getItem` throw, and
  the SQLITE_FULL incident of 2026-09-11 proves the latter happens. On that path the
  re-read at :50 also throws, the inner `catch {}` swallows, and **nothing is removed** —
  so it degrades correctly. Verified, not a finding.
- `src/features/commercial/commercialAuth.ts:32` — a corrupt anonymous glossary blob
  yields `[]` on the signup path, deliberately, so account creation is never blocked.
- `src/features/commercial/purchase.ts:178-183` (`loadStoreProducts`) — returns `[]`
  on failure, but its only caller is `purchase.ts:146` `void loadStoreProducts()`, a
  warm-up whose result is discarded. No UI reads it. (See 10.4 — it is dead, not wrong.)
- `src/features/celebration/celebrationSeen.ts:46` — `.catch(() => new Set())` on the
  seen-set. Failing to read "seen" means a celebration may repeat, not that progress
  is lost. Fails in the user's favour.
- `src/features/review/reviewPrompt.ts:47` — `.catch(() => EMPTY_REVIEW_STATE)`; a
  failed read means the store-review prompt is not shown. Fails safe.

---

# Class 2 — A narrow transient-error regex

**2 REAL · 4 BENIGN.** The widened shared pattern
(`/network|fetch failed|failed to fetch|fetch|timeout|timed out|abort|socket|econn|offline/i`)
is in place in `finalExam/api.ts:378`, `quiz/api.ts:269`, `study/sync.ts:38`,
`FinalExamScreen.tsx:175` and `QuizScreen.tsx:221`. Four narrower classifiers remain.
**None of them decides whether to keep or destroy user data** — I checked each
consumer specifically for that, because that was the dangerous half of the class.

### REAL

**2.1 — `src/features/quiz/api.ts:113` and `src/features/finalExam/api.ts:133` — `parseStartError` still tests bare `/network|fetch/`.** MINOR.
These two are the *start* classifiers, and they were not widened when their `submit`
siblings 150 lines below were. A start attempt that dies on a **timeout**, an
**abort**, or a **socket** error falls to `'unknown'` → "Could not start the Final
Exam. Try again." instead of `'offline'` → "Starting the Final Exam requires a
connection. Reconnect and try again." The learner is told to retry the thing that
cannot work until they reconnect. Copy only — no queue is dropped, no latch consumed
(both `intentKey` writes are independently try/caught). Confidence: high.

**2.2 — `src/features/directory/rules.ts:198-208` — the friendly-error map misses timeout/abort, so raw developer text reaches the user.** MINOR.
The comment at :195-200 records that this exists because the Explore banner once read
`"TypeError: Failed to fetch"`. The list covers `failed to fetch`, `fetch failed`,
`load failed`, `network request failed`, `network error` — and the fallthrough at :209
is `return message ?? 'Something went wrong. Please try again.'`, i.e. **the raw error
string**. A timeout (`"Aborted"`, `"signal timed out"`, `"socket hang up"`) still
prints developer text into the Community Directory banner. Same bug, same file, one
error class over. Confidence: high.

### BENIGN

- `src/features/glossary/deviceKeyState.ts:96` (`classifyMintError`) — narrow
  (`network|fetch|timeout` only, no abort/socket/econn), **but the distinction is
  inert**: at `GlossaryScreen.tsx:1128` and `:1163` all three of `'disabled'`,
  `'network'` and `'unknown'` take the identical branch (`console.warn` then
  `setKeyFailedOpen(true)`, which fails OPEN). Nothing is destroyed and nothing
  branches. Reported instead as dead data — see 10.5.
- `src/features/auth/api.ts:21` — wide (`network request failed|failed to fetch|network
  error|timed out|timeout|unable to resolve|unable to connect|offline|enotfound|econnrefused|socket hang`).
  Missing only `abort`. Sign-in copy only.
- `src/features/account/singleDevice.ts:47` — fails OPEN on any error by design, so it
  never needs to classify. Correct shape: no regex at all.
- `src/features/commercial/EntitlementProvider.tsx:251,405` — does not regex-match at
  all; it checks `{ error }` presence and refuses to downgrade on a failed read. This
  is the pattern the others should copy.

---

# Class 3 — A promise the code does not keep

**4 REAL · 5 BENIGN.** Method: grepped user-facing copy for assertive verbs
("saved", "will", "automatically", "instantly", "never", "nothing is stored",
"applies throughout") and traced each to the mechanism behind it.

### REAL

**3.1 — `src/navigation/linkPaths.ts:142-144` — a safety claim in a comment that is false, and 7 URLs were opened on the strength of it.** BLOCKER (the entitlement consequence is filed as 7.1).
> "Claiming them was only safe once those seven routes checked membership, which they
> now do (`MemberGated` in RootNavigator, pinned by membershipGating.test)."

They do not. Full trace in 7.1. Listed here too because the *shape* is the class:
a stated guarantee with nothing behind it, and a second decision (claiming the
deep links) taken because of it.

**3.2 — `src/features/celebration/catalog.ts:328` — "Progress will sync when you reconnect." There is no reconnect listener in the app.** MAJOR if shown; see 10.1.
`grep -rn "NetInfo|isInternetReachable|addEventListener('online'"` over `src/`,
`App.tsx` and `index.ts` returns **zero hits**. Nothing in the app observes
connectivity. `replayQueue()` (`study/sync.ts:117`) has exactly one caller —
`flushOnce()` at :236 — which runs only when a study session flushes. So queued
progress drains on the user's *next study action*, not on reconnect. A user who
reconnects and does nothing else syncs nothing.
**Mitigating, and why this is filed under 10 as well:** the string lives in
`CONFIRMATIONS`, which has **no caller in the app at all**, so today no user ever
reads it. It is a false promise that is currently unshipped. Fix the mechanism
before wiring the copy, not after.

**3.3 — `src/features/settings/LowLightLayer.tsx:122-125` — "no pop-ups will appear anywhere in the app… nothing flashes during a show", and three modals bypass the wash.** MAJOR.
`src/components/DimModal.tsx` exists precisely so this cannot be forgotten
("Twenty-six others had not — which is the real problem: remembering is not a
mechanism"). Three files still import `Modal` from `'react-native'` and mount no
`<LowLightDim/>` of their own — verified by reading all 21 files that import RN's
`Modal`:
- `src/features/commercial/MembershipGate.tsx:17,73` — the app-wide "Academy
  membership required" popup, raised by any locked control.
- `src/features/glossary/GlossaryDeviceKeyView.tsx:16,59` — the guest consent dialog.
- `src/screens/tools/MeasurementLibraryScreen.tsx:24,733` — the full-screen saved
  measurement view. **This is the one most likely to be opened mid-show**, which is
  exactly the scenario Low-Light exists for.
Confidence: high (`grep -c LowLightDim` returns 0 for all three; every other modal
in the app either uses `DimModal` or hand-mounts the wash).

**3.4 — `src/lib/copy.ts:57-61` — "deleted automatically after 7 days" for the anonymous device key.** Needs an owner/DB check before it can be called REAL or BENIGN, and I am flagging it rather than asserting it.
The client-side copy promises an automatic purge; the mechanism named in the comment
is a nightly `pg_cron` job. The BRIEF already records that "the tenure migration and
both edge functions are not deployed", so deployment state on this project is not
something the client can assume. **What would settle it:** `SELECT * FROM cron.job;`
on the live DB, checking for the anonymous-user purge. If it is not scheduled, this
is a privacy promise in shipped copy with nothing behind it, and it is the kind that
matters at store review.

### BENIGN

- `src/features/audio/soundSafetyText.ts:55` — "Shake the phone at any time to mute
  instantly." **I nearly filed this as a BLOCKER.** `grep "<ShakeToMute" src/` returns
  nothing — but the component is mounted at **`App.tsx:502`**, at the app root, inside
  `AudioOutputGate`. (Caution for later passes: `src/`-scoped greps do not see
  `App.tsx`.) The listener arms whenever `useAudioOutputEnabled()` is true, which is
  the only window in which audio can sound. Promise kept.
- `src/features/audio/AudioOutputRow.tsx:65` — "auto-mutes after {IDLE_MIN} min idle
  or on reopen". `IDLE_MIN` is read from the same constant the idle timer uses.
- `src/features/permissions/PermissionPrompt.tsx:41,57` — "never shared automatically" /
  "never uploaded automatically". The measurement store is local (SQLite, `measurementsBackend`),
  and the only upload path (`deviceProfile` calibration contribution) is behind an
  explicit opt-in prompt. Kept.
- `src/screens/careerfinder/CareerFinderResultsScreen.tsx:233` — "Saved on this device…
  Nothing is sent until you send it." `setCareerFinderFeedback` persists locally;
  `mailFeedback` opens a `mailto:`. Kept, and carefully worded.
- `src/features/help/helpContent.ts:225` — "Audio from the tools is never uploaded, and
  saved measurements stay on the device." Consistent with the SQLite-local store.

---

# Class 4 — A hook below an early return, or a conditional hook

**0 REAL.** This one is clean, and I want to be specific about why that is a
trustworthy negative rather than a shallow grep.

Method: every `.ts`/`.tsx` under `src/` plus `App.tsx` parsed with the **TypeScript
compiler API** (`typescript@6.0.3` from `node_modules`), not regex. For every
function whose name is capitalised or `use*` — plus anonymous and JSX-returning
functions, so `memo()` / `forwardRef()` wrappers are covered — collected (a) every
`ReturnStatement` *excluding* those inside nested function-likes, and (b) every
`use[A-Z]*(` call including the `ns.useX()` property form, tagged with its wrapper
chain (`if` / ternary / `&&`-`||`-`??` / loop / `try` / `catch` / `switch` / nested-fn).

Detector validated against 7 synthetic positives (hook in `if`, in a ternary, behind
`&&`, in `try`, in a `for`, in a `.map()` callback, after an early return in both a
component and a custom hook) and 1 synthetic negative (a `return` inside a
`useEffect` callback). **0 parse diagnostics across all 843 files**, so nothing was
silently skipped.

Coverage: **1,098 hook scopes · 6,141 hook calls · 988 scopes with early returns ·
83 scopes containing both.** In all 83, the last hook precedes the first early
return.

Also checked and clean: module-scope hook calls (none); aliased hook imports that
would evade `use[A-Z]` detection (none); `.js`/`.jsx` under `src/` (none exist).

**The two known bugs verified fixed:**
- `src/screens/dashboard/DashboardScreen.tsx` — last hook `useMemo` at **L1181**, first
  early return at **L1192**. All ~70 hooks, including `useMethodCelebration` (L563) and
  `useCredentialCelebration` (L573), now run above every return.
- `src/features/dev/popupSuppressStore.ts:86` — `useOverlaysSuppressed` now calls
  `usePopupsSuppressed()` (L93) and `useLowLight()` (L94) unconditionally and returns
  `popupsSuppressed || lowLight` (L95). The short-circuit that white-screened is gone.

**4 technical-but-safe conditional hooks** (all `eslint-disable`-annotated, all
provably fixed-count, none can change hook count between renders):
`src/screens/lab/wave/vizWave.tsx:788` (`useDerivedValue` in a `for` over the module
constant `NODE_BUCKETS = 24`); `src/screens/lab/foundations/viz.tsx:1437,1453` (helper
`makeSide` invoked exactly twice, unconditionally);
`src/screens/lab/digital/vizChain.tsx:362` (helper `buildStrip` invoked exactly 3×).
The `vizWave` one is the only latent risk: if `NODE_BUCKETS` ever becomes
prop-derived, the Wave lab crashes mid-animation with "Rendered more hooks than
during the previous render."

**One thing the owner should know:** `eslint-plugin-react-hooks` is **not installed**
in this repo (`node_modules/eslint*` is absent), so those four `// eslint-disable-next-line
react-hooks/rules-of-hooks` comments suppress a linter that never runs, and **nothing
in CI enforces this rule**. The class is clean today by care, not by mechanism — the
same distinction `DimModal.tsx` makes about itself.

---

# Class 5 — A latch set before the action it guards

**1 REAL · 7 BENIGN.** Swept all 107 `*.current = true` sites plus every
`markSeen`/`markDone`/`markShown`/`recordShown` family function and its call sites,
keeping only latches that guard a *consequential* action (submit, charge, credit,
celebrate, warn-once, mark-complete).

### REAL

**5.1 — `src/features/celebration/useCredentialCelebration.ts:114` — the credential is recorded as "known" before the code decides whether it can be celebrated at all.** MINOR.
```ts
await writeKnown({ ids, certificates, programs });   // :114 — records it
const event = credentialCelebration({...});          // :116
if (!event) return null;                             // :122 — …and may then bail
```
The "record BEFORE showing" ordering is **deliberate and correct** for the dismiss /
app-kill case, and the comment says so. The bug is narrower: the write also precedes
the `event === null` branch. If `credentialCelebration()` returns null for a freshly
earned credential — no matching catalog entry for that certificate/program
combination — the credential is permanently marked known and **the learner never gets
celebrated for it, ever, on any launch**. For a paid capstone award that is a real
loss of the moment. Moving `writeKnown` below :122 costs nothing the comment cares
about (an uncelebratable credential cannot be re-shown anyway).
Confidence: high on the ordering; medium on reachability, since it depends on whether
`credentialCelebration` can return null for a real award. **What would settle it:**
read `credentialCelebration` in `catalog.ts` and check whether every
`(freshCerts, freshProgs, priorCerts, priorProgs)` tuple a real award produces maps
to an event.

### BENIGN

- `src/screens/exam/FinalExamScreen.tsx:145` `submitted.current = true` — the pass-2 fix.
  Verified: the latch is now released on the retry path, and `clearExamIntent`
  (`finalExam/api.ts:395`) is independently try/caught so a storage throw can no
  longer re-arm it.
- `src/features/audio/exposureMonitor.ts:648` — the once-a-day dose warning, the other
  pass-2 fix. Verified: the day key is now removed/written around the *shown* warning,
  not before it, and the Low-Light suppression path no longer burns it.
- `src/screens/glossary/GlossaryScreen.tsx:1241` `gateOpeningRef` — reset in a
  `finally`, with a comment recording exactly this failure mode ("if it ever threw,
  this flag stayed true and EVERY later tap returned false").
- `src/screens/lab/calc/CalcWorkspaceScreen.tsx:159` `consumingRef` — reset immediately
  after the await, and the reveal (`setConsumedSig`) happens strictly **after**
  `consumeCalc()` returns allowed. Charge-then-reveal, in the right order.
- `src/features/study/PaceTimerBar.tsx:97` `recordedRef` — set inside the same
  synchronous block as `recordPaceSession`, and re-armed on the next ON toggle.
- `src/features/celebration/useMethodCelebration.ts:120` `markSeen` — called from
  `dismiss()`, i.e. after the user has seen and closed it. Correct order.
- `src/components/ContributeCalibrationPrompt.tsx:61` `sendingRef.current = true; // before the first await`
  — a busy/double-tap guard, not a consumed one-shot; reset on both outcomes.
- `src/features/glossary/deviceKey.ts` `mintOnce` / `GlossaryScreen.tsx:1115` `mintingRef`
  — set before the await *on purpose*, documented by the "two device keys 67
  microseconds apart" incident. Both clear on settle, so a failure re-opens the path.

---

# Class 6 — An in-memory module cache not in the account reset registry

**9 REAL · ~90 BENIGN.** The registry is
`src/features/account/clearLocalAccountData.ts`: `clearLocalAccountData()` sweeps
`ape:*` AsyncStorage keys minus a KEEP allowlist, and `resetAllLocalStores()` (:134)
resets 21 in-memory module caches. Swept every module-level `let`/`var` and every
mutated module-level `Map`/`Set`/array/object in `src/`, and checked both directions:
*(a)* per-user state not reset, and *(b)* the inverse — the key is swept but the
surviving cache writes the departing user's value straight back.

The two pass-2 fixes verified present and complete: `resetSoundSafetyAck`
(`soundSafetyAck.ts:71-72`) and `resetCelebrationsSeen` (`celebrationSeen.ts:23-24`),
both imported and called (:176, :180).

A useful completeness signal: **17 modules export `resetLocal`; the registry imports
16.** The odd one out is `attractStore` (6.2).

### REAL

**6.1 — `src/features/study/timeTrial.ts:120-123` — `states` / `snapshots` / `timers`, no reset anywhere, and a free-running interval that credits the server.** MAJOR. *The worst of the set — verified by hand.*
There is **no** reset function in the file and nothing registered. `startTimeTrial`
(:226) arms a 1-second `setInterval` that is tied to no React lifecycle. If a 15-minute
trial is live when the user signs out or switches account, the interval keeps ticking,
`finalize()` (:195) fires, and on a pass `recordTimeTrialPass` (:328) calls
`supabase.rpc('credit_time_trial', { p_achievement_id: st.topicId, p_method_key })`
**under whatever session is now current**. `credit_time_trial` sets the server-side
`trial_passed` flag, which is what marks the method complete for the quiz unlock. So
the departing user's trial can credit the arriving user's topic. The errors are
swallowed by design (:334), so a server-side guard rejecting it is silent — and if
both accounts are enrolled in that topic (free topics make this easy) nothing rejects
it. The new user also inherits a live countdown HUD and someone else's correct-answer
count. This is the exact failure the registry already names for
`enrollmentStore.syncTimer`. Note also that `cancelTimeTrial` and `isTimeTrialLive`
exist and are called from nowhere (see 10.3) — the abort mechanism was written and
never wired.

**6.2 — `src/features/onboarding/attractStore.ts:28-30` — `state`/`hydrated`/`hydrating`; `resetLocal()` exists at :164 and is never imported.** MINOR, two-sided.
Its docstring reads "Account wipe / user switch — clear all cues
(clearLocalAccountData)". The key `ape:homeAttract2` **is** swept. So: a brand-new
account on that device gets **no** first-run "start here" cues (Explore and About
never breathe, `enrolledOnce` already true) and inherits the previous user's
`firstSeenAt` for the 7-day About window. Inverse case too — `hydrated` stays `true`,
so the cleared key is never re-read, and the next `persist()` writes the departing
user's state back under the new account.

**6.3 — `src/features/settings/lowLight.ts:25-27` — `on` / `touchedAt` / `hydrated`.** MAJOR (usability, and it is a production-safety mode).
`ape:lowLight` and `ape:lowLightAt` are swept; `settings/store.resetLocal` covers only
haptics / mic-release / a11y. If the previous user left Low-Light Production Mode on,
the next user's screen stays at 50% black **with no visible explanation** — the escape
is the undocumented 6-fast-taps gesture. Inverse: `touchLowLight()` (:83) and
`setLowLight()` (:66) immediately re-write both keys under the new account.

**6.4 — `src/features/permissions/permissionStore.ts:28` — `cache`.** MAJOR (privacy).
`ape:perm:camera|location|photo|mic` are swept, but `getAskMode` (:30) short-circuits
on the module cache. So the next user inherits the departing user's "always allow" /
"never ask again" pre-permission choices for **camera, location, photos and mic**,
with the stored consent record that justified them already deleted. `resetAskModes()`
(:53) exists for the Settings control and would fix it; the registry does not call it.

**6.5 — `src/features/tools/genCapSession.ts:15` — `unlockedThisSession`.** MAJOR (safety gate). *Verified by hand: `resetGenCapSession` has zero call sites outside its own definition.*
Its docstring says "clears the session unlock (e.g. **on explicit sign-out**)". The
next person on the phone, within the same app process, opens the Tone/Noise Generator
with the Q4 output-cap unlock already granted and is never shown the confirm prompt.
Same category as `soundSafetyAck`, which the registry calls "the safety gate; it is the
one entry here that must never be missed."

**6.6 — `src/features/review/reviewPrompt.ts:39-40` — `state`/`loading`.** MINOR, pure inverse case.
`ape:review:v1` is swept, but `load()` (:42) returns the cached `state`, and the next
`recordAppSession()` / `noteHighValueEvent()` calls `save()` (:56), writing the
departing user's session count, active-day count and `lastRequestedVersion` back under
the new account. The sweep of that key is a no-op, and the new user is granted or
denied the store-review prompt on someone else's counters.

**6.7 — `src/features/intro/onboardingFlow.ts:41-43` — `complete`/`visited`/`hydrated`, swept AND not reset.** MINOR, two-sided. *Verified: `isOnboardingFlag` (`clearLocalAccountData.ts:83`) matches only `ape:intro:`, `ape:coach:` and `*FsGuide`.*
`ape:onboarding:complete` / `ape:onboarding:visited` match none of those, so they are
deleted on every account switch — yet nothing calls `resetOnboarding()` (:108). Result:
**this** session the new user does not get the first-run sampler loop (memory says
`complete === true`), and after the next **cold launch** they get the entire first-run
loop replayed. That is precisely the bug the 2026-08-13 onboarding-flag exception
exists to prevent, arriving a launch late. `markChoiceVisited` (:100) also re-persists
the departing user's `visited` array. Contrast `amplitudeOrientation.ts`, identical
shape, explicitly handled at `AuthScreen.tsx:177`.

**6.8 — `src/screens/lab/mixing/kit.tsx:43,79` — `focalCurrent` / `prioritiesCurrent`.** MINOR.
Per-learner commitments at `ape:mixing:focal` / `ape:mixing:priorities`; both keys are
swept, neither module var is reset, no reset function exists. The import-time
`AsyncStorage.getItem` (:48, :81) runs once per process and cannot re-hydrate. The next
user opening the Mixing lab finds the departing user's declared focal instrument and
three mix priorities pre-selected — and the final page echoes them back as *"your
commitment"*. Inverse: `set`/`toggle` (:68, :106) re-persist them under the new account.

**6.9 — `src/screens/lab/deesser/DeEsserLabScreen.tsx:31` — `rack`.** MINOR.
In-memory-only lab working state (`{...DEFAULTS}`), never reset. The next person
entering the De-Esser lab starts on the departing user's threshold / frequency / ratio.
Same class as `chainStore.current` and `modMeterC.solvedCache`, which the registry
*does* reset under B-154 — so the precedent says this one belongs there too.

### Worth a look, not filed as bugs

- `src/features/lab/labCompletion.ts:127-128` — `resetLocal` (:332) clears
  `cleared`/`sent`/`afComplete` but leaves `hydrated`/`hydrating` latched. Harmless
  *today* only because storage is already empty when the reset runs. It is the one
  latched-hydration store in the registry that breaks the pattern
  `exposureMonitor.ts:257` calls out by name ("hydrate() is latched — must clear or the
  re-seed no-ops"). It becomes a silent leak the day clear/reset ordering is inverted.
- `src/features/notifications/localSchedule.ts:177-178` — `lastSlice` / `lastFullSyncAt`.
  Mostly covered because `memberStanding()` is part of the slice and
  `EntitlementProvider.tsx:448` re-syncs on every standing resolution. Narrow edge: two
  members with byte-identical notification settings → `requestLocalNotifSync`
  early-returns (:203) and the previous user's booked OS reminders are never rebuilt.
  Generic content, so scheduling-only.
- `src/features/study/sync.ts` `StudySession` instance fields — instance state, not
  module-level, so outside this class; but a session buffering events at sign-out
  flushes or enqueues under whatever session is current. `clearQueuedBatches()` only
  covers rows already written.

### BENIGN — the shapes checked and cleared

*Content / asset / lazy-module caches, no per-user field:* `v3Curriculum.ts:52`
`curriculumPromise`; `StudyAreaExplore.tsx:41` `catalogPromise`;
`GlossaryScreen.tsx:117-124` (the `ENTRIES_TABLE` mismatch at :192-194 explicitly
invalidates `ENTRIES_CACHE`, which covers the guest→member teaser transition);
`directory/api.ts:34` `taxonomyCache`; `careerIndex.ts:64` `decoded`;
`topicTrophies.ts:23-24` (public achievement art); `glossaryGateway.ts:28` `PROBE`;
`modalLibrary.ts:197`, `figure.ts:64`, `jogRaster.ts:367,369`, `GalleryScreen.tsx:51`
`geomCache`, `mixAudio.ts:262` `stemsCache`, `earDsp.ts:114` `sineTab`. Plus ~20 lazy
native-module handles (`certificateHtml`, `certificatePdf`, `packet`, `location`,
`photo`, `shareCopy`, `screenOrientationSafe`, `useShake`, `authStorage.native`,
`CredentialQr`, `keyboardControllerSafe`, `push`, `purchase`, `FxLabScreen`, `skiaGate`).

*Reset elsewhere or on auth state change:* `memberStanding.ts:20` (rewritten by
`EntitlementProvider.tsx:447` on every tier resolution); `amplitudeOrientation.ts:25`
(key is `ape:intro:*`, deliberately kept; reset on the guest path at `AuthScreen.tsx:177`);
`calibrationStore.ts:22` (`ape:splCalOffset` is on KEEP — governance R1 hardware
calibration, so the surviving mirror is *correct*); `deviceIdentity.ts:13`
(`ape:deviceId` on KEEP); `popupSuppressStore.ts:18` (dev-only, on KEEP).

*Holds no user data:* `patternStore.ts:324` / `projectStore.ts:271` `defaultStore`
(stateless AsyncStorage adapters — every read hits storage); `ampProgress.ts:65`
`writeQueue` (promise chain only); `deviceKey.ts` (no cache; consent read per call);
`localProgress.ts`, `pagedProgress.ts`, `tuningProgress.ts` (storage-only);
`studyQueueStorage.ts:17` `nextId` (monotonic id); `finalExam/api.ts:290` `queueReadable`
(storage-health latch); `measurementsBackend.native.ts:41` `handle` (SQLite connection —
contents wiped by `clearStoredMeasurements()`); `publicProfile.ts:141` `registryStateKnown`.

*Transient UI / session / device state:* `AppDialog.tsx:47-50`, `MembershipGate.tsx:28`,
`footnote.ts:12`, `pendingLink.ts:23`, `devPreview.ts:6`, `push.ts:64,83`,
`onboardingSampling.ts:20`, `labPreviewStore.ts:13`, `intentionalSignOut.ts:15-16`,
`audioOutputStore.ts:26-43`, `micSession.ts:36-50`, `exposureMonitor.ts:546` `booted`
(correctly *not* reset — resetting would double-register the AppState listener),
`telemetry.ts:39-42` (no user identity is ever set), `devTiming.ts`,
`tunerFrameStore.ts:30`, `hubPreviewEngine.ts:80,112,113,150`, `NavIcon.tsx:95-96`,
`SpeakButton.tsx:17`, `earPlayer.ts:56`, `PatternFigure.tsx:30`,
`EnvelopeLabScreen.tsx:30`, `InsideStats.tsx:82`, `ScreenIntroOverlay.tsx:25`,
`CourseSelectionScreen.tsx:149,150,347`, `EnrollmentScreen.tsx:221`,
`cableinstall/bits.tsx:348`, `MicSelectLabScreen.tsx:81`, `a11y.ts:60`,
`settings/store.ts:253`.

---

# Class 7 — A wrapper that looks like a gate and is not

**3 REAL · 24 pairs read and cleared.** Method: enumerated exported symbols that come
in near-duplicate name pairs across `src/`, read **both** members of each pair, then
grepped every call site to see whether anyone picked the weaker one where the stronger
was required.

### REAL

## 7.1 — `MemberGated.X` is INERT on 8 routes, including both flagship paid labs. **BLOCKER.**

*I verified every link of this chain myself rather than relying on the sweep, because
it is a large claim.*

`withMembershipPreview` (`src/features/lab/withMembershipPreview.tsx:56`) gates on:
```ts
const memberOnly = isMemberOnlyLabRoute(route.name);
```
`isMemberOnlyLabRoute` (`src/screens/lab/labCatalog.ts:534-536`) is:
```ts
return LAB_ROUTE_MEMBERSHIP.get(route)?.memberOnly ?? false;
```
`LAB_ROUTE_MEMBERSHIP = computeLabRouteMembership(LAB_CATEGORIES)` (:529) — a map built
**only from route names that appear in `labCatalog.ts`**. **A route name absent from
the catalog returns `false`, and the wrapper renders the live screen unconditionally.**

Eight route names registered with `MemberGated.*` in `RootNavigator.tsx:245-251`
appear **nowhere** in `labCatalog.ts` (I diffed every `route:` in that file):

| Route (`RootNavigator.tsx`) | In `labCatalog`? | Deep-link path (`linking.ts`) | Needs params? |
|---|---|---|---|
| `CymaticsPlateStudio` :246 | **no** | `labs/cymatics/plate` :88 | **no** |
| `CymaticsLiquidStudio` :247 | **no** | `labs/cymatics/liquid` :89 | **no** |
| `CymaticsMembraneStudio` :248 | **no** | `labs/cymatics/membrane` :90 | **no** |
| `CymaticsGallery` :249 | **no** | `labs/cymatics/gallery` :92 | **no** |
| `CymaticsModule` :245 | **no** | `labs/cymatics/module/:id` :93 | guessable id |
| `ProductionStage` :250 | **no** | `labs/production/:lab/:projectId/:stageId` :83 | yes |
| `ProductionActivity` :251 | **no** | `labs/production/:lab/exercise/:activityId/:pathway` :84 | yes |
| `ProductionLab` :228 | **no** (catalog has `PreProdLab` / `PostProdLab`) | none | — |

The parent routes are genuinely paid — I confirmed the categories:
`labCatalog.ts:352-363` (Sound Visualization) is `section: 'training'`, and
`labCatalog.ts:213-222` (Production Workflow) is `section: 'training'` with
`member: true` on both leaves. `PreProdLab` and `PostProdLab` are registered at
`RootNavigator.tsx:494,499` under **their own catalog route names**, so those two gate
correctly — it is only the children that are open.

**What the user does, and what happens.** A signed-out guest or a resolved non-member
opens `proaudio://labs/cymatics/plate` (or the https equivalent — `app.json` claims
`/labs` with `autoVerify`, and `linkPaths.ts:148-155` now explicitly admits these
paths through `isClaimedPath`). React Navigation resolves straight to
`MemberGated.CymaticsPlateStudio`. `memberOnly` is `false`, so:
- the `GateHold` never renders,
- `startLabPreview` is never called → `preview.active` is false → `LabPreviewOverlay`
  (`LabPreviewOverlay.tsx:17`) draws nothing, so **no grayed UpgradeSheet**,
- the `AudioOutputGate` is not held muted,
- `labCompletion` does not refuse credit.
They get the live Chladni Plate Studio — a members-only lab — with full audio, and
their progress counts. Five of the eight need no parameters at all.

**What should happen:** the same treatment `CymaticsLab` gets — hold, arm the preview,
mount the lab behind the scrim.

**Why the test does not catch it.** `test/membershipGating.test.ts` is purely textual:
assertion 3 checks `reg.get(route)` matches `/MemberGated\./`, assertion 4 checks each
map value matches `/withMembershipPreview\(/`. Neither asserts
`isMemberOnlyLabRoute(routeName) === true`, which is the condition that makes the
wrapper *do* anything. The test comment at :111-113 even records that these routes were
"safe today only because `isClaimedPath` happens to reject `labs/` URLs of more than
two segments" — **and `LAB_DEEP_PATHS` removed that accident.** The one protection was
retired on the strength of a gate that does not exist.

**Suggested shape of the fix** (not applied — read-only pass): make the wrapper fail
closed for a route it does not recognise, or give `labMembership` an explicit
child-route → parent-route map so `CymaticsPlateStudio` inherits `CymaticsLab`. Then
add a test assertion on `isMemberOnlyLabRoute(name)`, not on the source text.

Confidence: **very high.** Every step read directly (`withMembershipPreview.tsx:56`,
`labCatalog.ts:529-536`, `labMembership.ts:33-52`, `labCatalog.ts:213-222,352-363`,
`RootNavigator.tsx:245-251,489-509`, `linking.ts:83-93`, `linkPaths.ts:148-181`). The
only thing I did not do is run the app.

**7.2 — `Modal` from `components/DimModal` vs `Modal` from `react-native` — 3 un-washed modals.** MAJOR. Detailed under 3.3. This is the same class: a drop-in replacement whose whole purpose is that the weak twin is easy to import by accident, and three files did.

**7.3 — `confirmDialog`/`notify` (`src/lib/confirm.ts`) vs raw `Alert.alert` — 32 call sites.** MAJOR on web, MINOR on native.
`lib/confirm.ts:6-8` states that RN-web ships `Alert.alert` as a literal **no-op**, and
that this is why the shim exists. Web is a live target (`package.json` `"web"`,
`app.json` has a `web` block, `DEV_BYPASS.webPreviewAutoGuest` drives a browser
preview, and the fast-dev-loop uses `ape-web` at localhost:8091). Remaining raw sites:

`PaywallScreen.tsx` **16** · `ProfileScreen.tsx` 3 · `CourseSelectionScreen.tsx` 2 ·
`MyProfileView.tsx` 2 · `CareerFinderScreen.tsx` 1 · `RequestsView.tsx` 1 ·
`EnrollmentScreen.tsx` 1 · `GlossaryDictation.tsx` 1 · `GlossaryScreen.tsx` 1 ·
`cymatics/GalleryScreen.tsx` 1 · `lab/kit/PagedLab.tsx` 1 ·
`production/ProductionLabScreen.tsx` 1 · `tuning/TuningLabScreen.tsx` 1.

Worst is **`PaywallScreen`**: every purchase-failure, restore-result and "still
checking your membership" message is **invisible on web**, so a failed purchase looks
like a dead button. `CareerFinderScreen.tsx:39` is a two-button *confirm* — on web the
destructive reset is unreachable rather than mis-fired, so it fails safe but is a dead
control. On native these are cosmetic (grey OS card instead of the themed dialog —
the exact complaint that produced `AppDialog`).

### Latent divergence worth an owner's eye (not currently reachable)

`EarLabScreen.leafLocked` vs `labMembership.computeLabRouteMembership`.
`labMembership.ts:12-17` says its rule "mirrors EarLabScreen's `leafLocked`". It does
not, in one respect: `labMembership` subtracts `cat.alwaysFree` for leaves (:43), while
`EarLabScreen.tsx:79-80` is `(sec === 'training' || !!leaf.member) && !isMember` with
**no `alwaysFree` check** — even though `openHub` two lines down (:94) does check it.
Today the only `alwaysFree` category (Audio Calculator Laboratory,
`labCatalog.ts:448`) is `kind: 'hub'` with no leaf labs, so `leafLocked` never sees an
`alwaysFree` leaf. The day a leaf is added under it, the Ear Lab row draws a padlock
and `openLeaf` arms a preview scrim over a lab the membership map says is **free** — a
user denied a lab they are entitled to. Two files both claim to be the single source of
truth for one rule. This is exactly how 7.1 happened.

### BENIGN — pairs read, no caller picked the weaker one

`arePopupsSuppressed`/`usePopupsSuppressed` (dev flag only) vs
`areOverlaysSuppressed`/`useOverlaysSuppressed` (dev flag **or** Low-Light) — every
auto-appearing overlay uses the combined form (`ExposureCheckin`,
`exposureMonitor:493`, `Celebration`, `LearningIntroSheet`, `ScreenIntroOverlay`,
`TopicWelcomeSheet`, `lib/coachMark`, `AmplitudeOrientation`); the weak form's one
caller is `DevVisualIndex.tsx:232`, the dev toggle showing its own state · `applyCeiling`
(sets −12 dBFS **and** registers for shake-to-mute) vs `playbackVolume()` (number only)
— all four expo-audio creation sites call `applyCeiling` · `requestAudioOutput()`
(gate + sound-safety + 5 s hold) vs `isAudioOutputEnabled()`/`useAudioOutputEnabled()`
(read-only) — the read-only form is used only by indicators and by
`exposureMonitor:541` to arm its poller; the one apparent bypass, `mixing/kit.tsx:349`,
is reached only after `play()` already passed the gate · `playWithHearingWarning` vs
plain play — used at exactly the three level-command screens its docblock scopes it to ·
`useLowLight()` vs `useLowLightDim()` · `noteAudioActivity` vs `touchAudioActivity` ·
`releaseMic()` (debounced) vs `releaseMicNow()` (hard stop) — `useDspEngine:318`,
`MultiMeterScreen:738`, `ToolInfoScreen:100` all correctly take the hard form on the
background path; the debounced one there would be a hot-mic bug and nobody made it ·
`syncLocalNotifications`/`…Throttled`/`requestLocalNotifSync` (all funnel through the
same members-only gate at :233) · `devBypass('flag')` vs raw `DEV_BYPASS.flag` (all 16
consumers use the `__DEV__`-guarded accessor) · `isRealAccount` vs raw `!!session` —
the one raw check, `GlossaryScreen.tsx:1084`, genuinely means "does a device key exist,
including the anonymous one" · `studyMethodLocked` vs `customListLocked` ·
`caps.*` (dev-bypassable) vs `isMember` (real standing) — every tool/lab lock goes
through `useToolsLocked()` → `isMember` · `useToolsLocked`/`useSaveGate`/`useFullScreenGate`
(the last is a deliberate always-open policy seam with a ⚠️ not to "tidy" it) ·
`clearLocalAccountData()` vs `{ total: true }` — all four callers pair it with
`resetAllLocalStores()`, and `AuthScreen.tsx:169` correctly takes `total` on the guest
path · `AccuracyNote` variants `tool`/`calc`/`practice` — **all 45 usages checked**: the
five Calc screens pass `variant="calc"`, the three Production screens pass
`variant="practice"`, and the shells injecting the default (`PagedLab.tsx:209`,
`LabShell.tsx:332`) host only technical labs. A calc screen defaulting to `tool` would
be a real bug — it would tell a field pro to distrust math the repo calls a source of
truth — but none does · `AccuracyNote` vs `CautionBadge` (different jobs) ·
`track()` (a mixing-lab track lookup, `mixModel.ts:67`) vs `trackEvent()` (telemetry) —
name collision only; all four `track(` call sites are lookups, and
`trackEvent`/`trackScreen`/`captureError` all route through `sanitizeProps` ·
`ensureSession` vs `signIn` · `memberStanding()` vs `useEntitlement().isMember` ·
`RootErrorBoundary` vs `ScreenErrorBoundary` (complementary; `ScreenErrorBoundary` is
attached via `screenLayout` in all four navigators) · `lib/screenOrientationSafe` vs
direct `expo-screen-orientation` (zero direct imports) · `panicMuteAudio()` vs
`disableAudioOutput()` (both stop file players) · `fetchV3X` vs `fetchV3XStrict`
(see class 1).

---

# Class 8 — A hardcoded constant where the real value is available

**2 REAL · 6 BENIGN.** Method: every `const [A-Z_]*(COUNT|SIZE|TOTAL|LIMIT|NUM|LENGTH)`
in `src/`, then every render site, checking whether a live value was in scope and
discarded.

### REAL

**8.1 — `src/features/glossary/GlossaryLockView.tsx:114` — the lock screen prints the client constant while the server's number sits unused at the call site.** MINOR (wrong information shown as fact).
```tsx
You've used all {GLOSSARY_WEEKLY_LIMIT} of your free glossary lookups this week.
```
`GLOSSARY_WEEKLY_LIMIT = 14` is the **client fallback**;
`glossaryCap.ts:83,98` show the server is authoritative (`row.lim ?? GLOSSARY_WEEKLY_LIMIT`).
At the call site — `GlossaryScreen.tsx:1259-1264` — `u.limit` is in hand and used for
`setResetAt`, but only `resetAt` is passed to `GlossaryLockView`; `u.limit` is
dropped. If the server's `lim` is ever not 14, the lock screen states a number the
server did not enforce. Structurally identical to the `QUIZ_SIZE`-over-a-variable-quiz
bug. Confidence: high on the code path; medium on whether the server `lim` differs
today. **What would settle it:** the current value in the glossary cap RPC
(docs/APE_GLOSSARY_WEEKLY_LIMIT_14_2026_09_10.SQL).

**8.2 — `src/lib/copy.ts:26` and `src/screens/about/AboutHomeSheet.tsx:21` — "14" written as a literal in copy.** MINOR.
Both carry a comment saying it mirrors `GLOSSARY_WEEKLY_LIMIT` and must be changed
together. A comment is not a mechanism (the repo's own `DimModal` argument). Lower
priority than 8.1 because static copy genuinely has no live value in scope — but
importing the constant costs nothing and removes the drift.

### BENIGN

- `src/features/quiz/api.ts:83` `QUIZ_SIZE = 30` — the pass-2 fix verified. Its only
  render site, `ResultsScreen.tsx:139`, is now
  `questions.length > 0 ? questions.length : QUIZ_SIZE`, i.e. the served count with the
  constant only as a restored-navigation-state fallback, with a comment saying so.
  `QuizScreen.tsx:5` confirms the counter renders payload length.
- `src/features/lab/calcUsage.ts:22` `CALC_WEEKLY_LIMIT = 5` — every user-facing print
  uses the server value: `CalcWorkspaceScreen.tsx:294` is `usage?.limit ?? CALC_WEEKLY_LIMIT`,
  and the three dialogs at :172-197 all print `u.limit`. The halfway nudge at :184 is
  even derived (`Math.ceil(u.limit / 2)`) with a comment explaining that a hardcoded 5
  would have collided with the last-one dialog. This is the pattern 8.1 should copy.
- `src/screens/curriculum/CurriculumScreen.tsx:61-66` — `CALC_COUNT`, `LAB_COUNT`,
  `TOOL_COUNT` are all **derived** from the registries (`WORKSPACES.reduce`,
  `totalLabCount()`, `TOOLS.filter`), not typed in.
- `src/features/careerfinder/{careerIndex,families,questions}.ts` — `CAREER_COUNT`,
  `FAMILY_COUNT`, `QUESTION_COUNT` are all `.length` of the data they describe. The
  `CurriculumScreen.tsx:140-142` blurb that prints them is therefore truthful.
- `src/features/study/timeTrial.ts:45` `TIME_TRIAL_NEEDED` — derived from
  `TIME_TRIAL_TARGET_QPM × (TIME_TRIAL_SECONDS / 60)`, itself derived from
  `SEC_PER_Q.quiz`, with a comment saying "NOT hardcoded 20/3 (per product decision)".
- `src/screens/lab/amp/modules/mod8Apply.tsx:28` `FINAL_ITEMS = 12` — internal to a
  fixed-length static item list in the same file.

---

# Class 9 — `parseFloat` / `Number()` / `parseInt` / `Date.parse` on user text

**6 REAL · ~180 BENIGN.** Reference for "correct" is
`src/screens/lab/calc/calcUnits.ts:205` `parseQuantity`, which normalises grouping
separators (`,` `.` space `_` NBSP `'`), resolves the decimal separator by last
occurrence, and — the part that matters — **returns `null` rather than guessing**
(`10,5` → null, `12abc` → null, `''` → null).

### REAL

**9.1 — `src/features/production/rules.ts:100-110` `when()` — production dates. MAJOR.** The BRIEF lists this as known; here is the trace it asked for.
Every date is a bare `TextInput`, no mask, no validation, no picker
(`FieldRow.tsx:142-154` for fields, `:342-356` for table columns; placeholder
`"YYYY-MM-DD"` is the only hint). Fields: pre-prod `define.target_date` (**required**),
`schedule.production_date` (**required**), `schedule.backup_date`,
`schedule.final_delivery_date` (**required**), and table columns `ms_date`, `item_due`,
`spec_deadline`, `rev_deadline`; post-prod `brief.deadline` (**required**), `mr_when`,
`mm_by`. Consumers: `preprod/logic.ts:76,125,288-302,577-614,726-730`,
`preprod/logic2.ts:87,323`, `postprod/logic.ts:94`.

*(a) Free text makes the plan score BETTER than leaving it blank.* `"next Tuesday"`,
`"April"`, `"TBC"`, `"week of the 12th"` → `Date.parse` NaN → `when()` returns `null`
→ every rule reading it early-returns `false`. But `isAnswered` (`types.ts:213`) counts
any non-empty string, so `readiness.ts:106` counts the required date as a **decision
made**, `FieldRow` paints the dot green, the score rises, and the verdict can reach
`ready`. One word silences: `define-deadline-past` (**blocker**),
`schedule-dates-do-not-fit`, `deliver-deadline-order`, the calendar half of
`define-scope-outruns-resources`, `readiness-permission-pending`, and post-prod
`brief-material-still-changing`. This is precisely the failure `readiness.ts:1-17` says
the feature exists to prevent.

*(b) `"03/04/2026"` is engine-dependent and wrong on every engine.* Not ISO, so it
falls to `Date.parse` (:108). On V8/JSC that is the **US** reading — 4 March, a month
early for a UK/EU user. On Hermes (the RN release engine) non-ISO forms commonly return
NaN → silent. The same typed project therefore behaves differently in the browser
preview and on the phone. Worked example: `production_date = "10/04/2026"` (10 April)
with `final_delivery_date = "2026-04-20"` → parsed as 4 Oct → `delivery < production`
at `logic.ts:582` → the amber **"The dates do not fit, or are out of order"** fires on a
correctly ordered schedule. Invert the two and a real April conflict is missed.

*(c) Roll-over typos are accepted as valid dates.* `"2026-13-04"` and `"2026-02-30"`
**match** the `dateOnly` regex (:103) and go through
`new Date(Number(y), Number(m) - 1, Number(d))` (:106), which rolls over silently to
4 Jan **2027** and 2 Mar 2026. No warning. `define-deadline-past` then clears against a
fabricated date, and both countdown windows (`CLOSE_TO_DATE_DAYS`,
`DEADLINE_SOON_DAYS = 42`) count down to a day the user never entered.

*(d) The UTC/local fix at :103-106 is bypassed by its own fallback.* `"2026"` and
`"2026-04"` are *valid* ISO for `Date.parse` and are read as **UTC midnight** — the exact
bug the comment at :92-98 says it fixed for `YYYY-MM-DD`. West of Greenwich they land
on the previous local day, shifting the `define-deadline-past` **blocker** and every
`daysBetween` by one.

*(e) The exported packet hides all of it.* `packet.ts:245` → `renderValue` (:64-88)
falls through to `String(raw)`, so the client-facing PDF prints
**"Production date: 03/04/2026"** verbatim. The document shows the date the user meant;
the readiness verdict printed on the same page was computed from a different day, or
from nothing. Nothing marks the difference.

*Contrast:* `clockMinutes` (`rules.ts:154-167`) — same feature, same free text — validates
with a regex and refuses. The date path is the only one in the file that guesses.

**9.2 — `src/features/production/rules.ts:136-143` `cellNum()` — unsanitised numeric table cells. MAJOR. Not previously reported.**
`FieldRow.tsx:341-356`: for numeric **table columns**, `numeric` only sets
`keyboardType`. There is **no cleaning** — unlike `NumberField` (:455-476). The cell
keeps exactly what was typed or pasted, and :141 does a bare `Number(s)`, so
`"12,000"`, `"12 000"`, `"£12,000"`, `"90 min"`, `"1,5"`, `"2 ch"` all → NaN → `null`.
- **Budget silently becomes zero.** `preprod/logic.ts:513` sums
  `cellNum(l,'bl_amount') ?? 0` over lines that are `kind: "currency"`. Budget 10,000
  with lines `"12,000"`, `"3,500"`, `"800"` → sum **800** → "The lines add up to more
  than the budget" never fires, while the packet prints all three lines as typed. **The
  PDF shows a 16,300 plan against a 10,000 budget, marked healthy.**
- **False positive, same cause.** `logic.ts:505` — a contingency line typed `"5,000"` →
  `null` → "there is no contingency" fires at a user who provided one.
- **Day schedule under-counts.** `logic.ts:464,563,826` sum `blk_duration`
  (label "Duration (minutes)") with `?? 0`; `"1,5"` or `"90 mins"` → 0 → a day that
  busts the call-time→hard-out span reports as fitting.
- **Channel counts under-count by the fallback's design.** `logic2.ts:65,454` use `?? 1`,
  so an unreadable channel count is charged as **one** channel and
  `technical-inputs-exceed-capacity` compares a too-small total against
  `available_channels`. `"2 ch"` for a stereo pair counts as 1.
- **Equality rules go permanently quiet.** `logic2.ts:106` (`=== 2`),
  `postprod/logic2.ts:415,906` — `null` never equals, so the stereo-on-one-channel and
  deliverable-mismatch rules cannot fire on a row typed with any separator.
- Also reachable: `"0x10"` → **16**; `"1e3"` → 1000.

**9.3 — `src/screens/lab/production/FieldRow.tsx:458-475` `NumberField` guesses instead of refusing. MAJOR.**
The cleaner strips everything but `[0-9.-]`, so `"12,000"` → `12000` (right by
accident) but `"12.000"` — dot as thousands separator, normal in DE/IT/ES/BR — → **12**
for `schedule.budget_total`, which feeds `logic.ts:511` and makes every budget
comparison meaningless. `"5-3"` → `"53"` (signs stripped and re-prefixed at :459). No
refusal, no message; the field simply shows the guessed number. This is the one numeric
entry point that already had a bug-hunt fix applied (the decimal-point bug, :416-437)
and still does not use the `parseQuantity` contract.

**9.4 — `src/screens/lab/calc/calcPanel.tsx:126` — the calculator's answer and its safety warning now use different parsers on the same string. MAJOR.** *Calculator residual — the `parseQuantity` fix landed in `buildValues` (:47) only.*
```ts
const baseVal = isList ? NaN : unit.toBase(parseFloat(raw));
```
This feeds the feasibility **warning** on :127 — the safety line under the input.
- `"8,192"` in BUFFER SIZE (warn threshold `x > 4096`, `workspaces/timePhase.ts:613`) →
  `parseFloat` = **8** → the "Unusually large buffer" warning is **suppressed**, while
  the result panel computes correctly with 8192.
- `"10,5"` → `parseQuantity` returns null so **no result renders at all**, but
  `parseFloat` gives 10.5, so the warning that might have explained the silence is
  evaluated against a number the calculator refused. The user sees an empty result, no
  warning, and no reason.
Given the standing rule that calculators are a field source of truth, a suppressed
safety warning is the sharp end of this one.

**9.5 — `src/screens/lab/calc/CalcProjectsScreen.tsx:130` — the original `10,000 → 10` bug, still live, and now persisted. MAJOR.**
```ts
const base = units[v.unitIdx % units.length].toBase(parseFloat(v.raw));
```
`v.raw` is a free `TextInput` (:253-261, `keyboardType="numbers-and-punctuation"` —
commas and spaces are on that keyboard), and this is the **save** path
(`workflowStore.saveProject`, :144), so the wrong number is written into a stored
`Project` record and later re-used as a source value by the calculators.
`"10,000"` → stored `baseValue` **10**. `"10,5"` → stored 10.5 instead of refused.
`""` / `"abc"` → NaN → `continue` at :131 **silently drops a labelled row**; the
comment calls this "honestly", but nothing is shown, and the user returns to a project
with a row missing.

**9.6 — `supabase/functions/admin-codes/index.ts:380-381` — admin code minting. MINOR (low blast radius, internal).**
Shipped copies identical at `admin-console/pro-audio-access-codes.html:210-211` and
`admin-console/7q4me8hkyuxsdj3phyo1ev15.html:210-211`.
```js
count:   Math.max(1, parseInt($("count").value || "1", 10)),
maxUses: Math.max(1, parseInt($("seats").value || "1", 10)),
```
Inputs are `<input type="number" min="1" max="500">`. Browsers accept exponent notation
in a number input, so an admin typing **`1e3`** yields `.value === "1e3"` → `parseInt`
→ **1**: they ask for 1000 codes and mint 1. Anything the browser rejects (a pasted
`"10,000"`) yields `""` → `|| "1"` → 1 code, silently. `max="500"` is client-side
decoration that this parse does not enforce. Radix 10 is given, so no octal hazard.

### Borderline — flagged, not filed

- `rules.ts:77-84` `num()` — bare `Number(v)` on a field value, but guarded by
  `Number.isFinite`, so `"10,000"` → `null`. Not *wrong*, but the same **silent miss**
  shape: the rule says nothing rather than "I couldn't read that".
- `rules.ts:154-167` `clockMinutes` — refuses properly (`"9.30"`, `"noon"`, `"16h"`,
  `"4 p.m."` → null), and `logic.ts:565-573` then stays quiet on a day schedule that
  overruns. Correct by the file's own stated contract ("every caller treats null as
  *say nothing*"); noted only because the user gets no indication their time was unread.

### BENIGN — the families checked and cleared

*Hex colour parsing (`parseInt(..., 16)` on theme constants, explicit radix) — ~30
sites:* `CredentialDetailModal.tsx:66-68`, `InsideStats.tsx:58-68`,
`hubPreviewShared.tsx:49`, `Spl3dGauge.tsx:159`, `vizWave.tsx:239-241,703`,
`SpectrumColorPicker.tsx:33-35`, `HoldToActivate.tsx:103-105`,
`FirstRunSampler.tsx:285-287`, `levelColor.ts:64`, `figure.ts:143`,
`certificateHtml.ts:157,166`, `spectrogramRaster.ts:62`, `vizPlate.tsx:716`,
`vizMembrane.tsx:70`, `vizLiquid.tsx:91`, `vizSignal.tsx:58-60`, `vizDac.tsx:60-62`,
`vizChain.tsx:72-74`, `foundations/viz.tsx:118-120`, `vizSpectral.tsx:69-71,807`,
`vizMeters.tsx:118-120`, `micspeaker/viz.tsx:130-132`,
`HarmonographMachine.tsx:278-279`, `AmplitudeOrientation.tsx:133`, `cableArt.tsx:84`.

*`Number(id)` in option pickers — the id is an index/enum the app itself emitted:*
`RtaScreen:1052`, `SignalGenScreen:644`, `FxLabScreen:449,468`, `FmLabScreen:247`,
`OscillatorLabScreen:289`, `ModularLabScreen:389`, `modWaveB:316,1023`, `GalleryArt:212`,
`modChange:106-107`, `modQuant:181`, `FoundationsCourseScreen:437,849,987,1212`,
`FindFrequency:207`, `FilterSlopes:94`, `FixSignal:158`, `MultiBand:126,205,290`,
`MicPrinciplesLabScreen:812`.

*AsyncStorage counters / resume positions the app wrote, all guarded by
`Number.isFinite`/`Number.isInteger`/`|| 0`:* `coachMark:71`, `StudyFsOverlay:50`,
`FlashcardsScreen:1145`, `homeCardsStore:57`, `lowLight:56`, `SplMeterScreen:639`,
`FoundationsCourseScreen:2041`, `MicSelectLabScreen:976`, `CableLabScreen:62`,
`CableInstallLabScreen:115`, `localSchedule:153,337,339`,
`useCredentialCelebration:52-53`.

*Server / RPC values:* `curriculumStats:34,46`, `directory/api:305,314,422`,
`scenarioHomework:110-112,163`, `weeklyConcept:91,254`, `dashboard/api:91`.

*Server ISO timestamps → `Date`:* `achievements/api:133-134`, `credentials/api:101-102`,
`glossaryCap:69`, `entitlementExpiry:40` and `EntitlementProvider:114-121` (already
hardened with `Number.isFinite(Date.parse(...))`), `QuizScreen:140,149`,
`FinalExamScreen:129,147,203`, `ResultsScreen:44,49`, and the display-only formatters
in `TopicsScreen`, `GalleryScreen`, `CredentialWall`, `AwardProgressScreen`,
`ProfileScreen`, `FinalExamResultScreen`, `MeasurementLibraryScreen`, `calcReport`,
`CalcResultsScreen`, `packet.ts:106`. Also `validate-purchase/index.ts:233-234,266`.

*Reminder / notification times — **no text entry exists**:* `settings/store:104`,
`NotifyScheduleModal:17`, `localSchedule:106`. The `"HH:MM"` string is produced by
`to24()` from ± steppers; radix 10, `Number.isFinite` guarded, `'08:00'` fallback.

*Tuner reference level — not free text:* `centerLock:79,323` parse note names from
instrument tuning constants; A4 is constrained to `A4_CHOICES` at `CenterLockTuner:154`;
`FrequencyCounterScreen:396` hardcodes 440.

*Search / filter / free-text boxes — never coerced, stay strings:* `GlossaryScreen:2390`,
`HelpScreen:73`, `ExploreView:141,223`, `MyProfileView:375,480,498,509,678`,
`RequestsView:321,436`, `AudioCommunityDirectoryScreen:327,382`, `TubeReferenceScreen:70`,
`connectorselect/pagesA:115`, `CareerFinderResultsScreen:224`,
`ProfileScreen:740,770,794,818`, `MultiMeterScreen:1622`, `AcceptConditionSheet:71,85`,
and every production `longText`/`text`/`na-reason` input.

*Auth / promo codes are strings end to end:* `AuthScreen:425-430` (6-digit reset code,
`number-pad` but never numerically coerced; :233 only `.trim()`s),
`SettingsScreen:766` (promo code).

*Other:* `previewWidth:56` (dev-only URL hash, allowlist-checked at :57),
`authStorage.native:58,72` (chunk count from a marker the app wrote),
`ResultsScreen:67,70` (slot keys from the server result), `NotifySchedulePreview:33`.

*Also confirmed absent:* **no `.valueAsNumber` anywhere in the repo**; **no unary-`+`
string coercion** (every `+x` hit is `+someNumber.toFixed(n)`); `web/app`,
`web/components`, `web/lib` contain **zero** `parseFloat`/`parseInt`/`Date.parse` call
sites (`web/.next/**` hits are build output).

---

# Class 10 — A value written and never read, or read and never written

**7 REAL · 117 unreferenced exports triaged.** Method: a script (`/tmp/dead2.js`)
tokenised every `.ts`/`.tsx` in `src/` + `App.tsx` + `index.ts`, counted every
identifier occurrence, and listed every `export const|let|function|class|type|interface|enum`
whose name occurs exactly once in the app (its own definition), then cross-counted
against `test/` to separate test-only exports. Result: **84 unreferenced in app *and*
tests, 40 used only by tests.** Each of the 84 was then read to decide whether it is a
feature that silently does nothing or a harmless unused helper.

Caveat on method: identifier-counting is conservative in the safe direction — a
same-named local elsewhere inflates the count and hides a dead export, so the list may
be *incomplete*, but everything on it really is unreferenced.

### REAL

**10.1 — `src/features/celebration/CONFIRMATIONS` (`catalog.ts:320`) — an entire receipt catalog with no caller in the app.** MAJOR.
Eleven confirmations are defined, tested (`test/celebration.test.ts:82`), and shown to
nobody: `progressSaved` "Progress saved." · `trophyUpdated` · `credentialAdded` ·
`shareCopied` · `certificateDownloaded` · `credentialShared` · `credentialVerified` ·
`savedOffline` "Saved on this device. Progress will sync when you reconnect." ·
`synced` · `oneRequirementLeft` · `allRequirementsComplete`.
The docblock at :313-318 says it is "exported as data so nobody writes a slightly
different 'Progress saved.' in three places, and so the distinction the owner drew
(banner, not celebration) survives contact with the codebase". It did not survive: the
distinction exists only in this file. **This is the exact sibling of the pass-2 finding
"credential celebrations had no caller at all"** — same folder, same shape, still open.
User impact: a learner who downloads a certificate, shares a credential, or saves
progress offline gets **no receipt**. Note the interaction with 3.2: `savedOffline`
promises a reconnect sync that does not exist, so wiring this catalog up without
building the connectivity listener would ship a false promise.

**10.2 — `src/features/study/timeTrial.ts:288,293` — `cancelTimeTrial` and `isTimeTrialLive` have no callers.** MAJOR (this is the missing half of 6.1).
"Abort an in-progress trial with no result (e.g. an explicit cancel)" and "True when a
method has a trial running OR a result still on screen." Both written, neither wired.
So there is **no way for any code path — sign-out, account switch, navigation away,
app teardown — to stop a running 15-minute trial**, which is why 6.1's interval
survives into the next user's session and fires `credit_time_trial` under their token.
The mechanism to fix 6.1 already exists in the file; it was just never called.

**10.3 — `src/features/tools/genCapSession.ts:24` `resetGenCapSession` — zero callers.** MAJOR (safety). *Verified by hand.*
Same symbol as 6.5, stated here as the write-never-read half: the reset for the Q4
audio output-cap unlock was written with the docstring "(e.g. on explicit sign-out)"
and is called from nowhere in `src/`, `App.tsx` or `index.ts`.

**10.4 — `src/features/commercial/purchase.ts:173` `loadStoreProducts` — the result is discarded.** MINOR, and worth an owner's eye before launch.
Its only caller is `purchase.ts:146` `void loadStoreProducts();`. Nothing reads the
returned array, so **no screen displays store-localised prices**. That may be
deliberate (prices hardcoded in `PLANS`), but on a paid app days from launch, "we fetch
localised prices and throw them away" is worth confirming rather than assuming — a
mismatch between a hardcoded price and the store's localised price is a review issue.
**What would settle it:** whether `PaywallScreen` is supposed to show a store price.

**10.5 — `src/features/glossary/deviceKey.ts:100` `MintResult.reason` — computed, logged, never branched on.** MINOR.
`classifyMintError` carefully distinguishes `'disabled'` (permanent — anonymous
sign-ins are off in the Supabase dashboard, a runtime 422) from `'network'`
(transient), and the docblock at :105-108 says the distinction exists "so the screen
can fail open rather than look broken". But at both call sites —
`GlossaryScreen.tsx:1128` and `:1163` — all three values take the identical branch:
`console.warn(...)` then `setKeyFailedOpen(true)`. The permanent-vs-transient
distinction reaches no user and changes no behaviour. Either drop the classifier or
give `'disabled'` its own copy (a permanently-misconfigured backend and a dropped
connection deserve different sentences).

**10.6 — `src/config/devMode.ts:64` `DEV_BYPASS_ACTIVE` — the dev-bypass banner has no reader.** MINOR, but it is on the launch checklist.
"True only in dev builds AND when at least one bypass is on" — clearly written to
drive a visible warning. Nothing reads it. The per-flag accessor `devBypass()` is used
by all 16 consumers, so the bypasses themselves work; what is missing is the thing that
would have *told* someone they are on. The standing launch reminder is "review / turn
OFF devMode.ts DEV_BYPASS flags", and the one affordance built to surface that is
inert. (`__DEV__` gates the behaviour, so this is not a release-build risk — it is a
missing dev warning.)

**10.7 — `src/features/audio/speakerSafety.ts:137` `isGuardEngaged` — "used to decide whether to flag the disclosure", and nothing calls it.** MINOR.
The 150 Hz speaker-protection high-pass is applied (`guardToneLevelForEngine`,
`guardNoiseLevelForEngine` are both wired), and a shared disclosure string exists at
:161-165. What is missing is the **conditional** flagging this helper was written for:
nothing asks "is the filter meaningfully engaged at this frequency?" before showing or
hiding the note. So the disclosure is either always shown or always absent, never
matched to whether the guard is actually altering what the user hears. Given the
standing honesty rule, worth one owner decision rather than a silent helper.

### BENIGN — the other 77, grouped

*Dead but deliberately superseded:*
- `src/features/finalExam/api.ts:396` `clearExamQueue` — docstring: "Drop the queue on
  account switch so one user's exam never replays as another's." Never called — **and
  that is now correct**: pass 2 put `ape:finalExamQueue` on the KEEP allowlist
  (`clearLocalAccountData.ts:52-65`) precisely so a signed-out learner does not lose a
  graded capstone, and made `replayExamSubmissions` submit only the current session's
  rows. **The function is safe to delete, but its docstring now contradicts the KEEP
  comment**, which is a maintenance trap for whoever reads it next.
- `src/screens/lab/eq/modules/registry.ts:148` `EQ_PLANNED` — an **empty array**, kept
  as a wired mechanism with the placeholder rows removed. Exactly what the
  no-placeholder-rows rule asks for.
- `src/screens/lab/cymatics/galleryExport.ts:53` `isSvgFileAvailable` — unused, and
  correctly so: `ExportPanel.tsx:11` documents SVG as "always enabled" because it falls
  back to sharing the source as text (`galleryExport.ts:92`), so there is nothing to
  gate on.

*Redundant accessors alongside a live hook (the hook is used; the imperative twin is not):*
`onboardingFlow.ts:80,94` (`useOnboardingFlow` is used by `FirstRunCoordinator`) ·
`homeCardsStore.ts:86,138` · `enrolledBundlesStore.ts:74,109` · `flaggedStore.ts:112,191,287` ·
`deckOrderStore.ts:58` · `chainStore.ts:30` · `amplitudeOrientation.ts:55` ·
`onboardingSampling.ts:28` · `micSession.ts:162` · `labCompletion.ts:209` ·
`directory/api.ts:81` · `careerfinder/store.ts:173` · `glossary/deviceKey.ts:92`.

*Unused pure helpers / lookups (no user-visible feature behind them):*
`careerIndex.ts:164` `searchCareers` (no career search UI exists — every careerfinder
`TextInput` I checked is the feedback note at `CareerFinderResultsScreen:224`) ·
`questions.ts:66` `questionById` · `dimensions.ts:38` `dimensionLabel` ·
`ampContent.ts:192` `misconceptionById` · `dashboard/gates.ts:24` `gateReadout` ·
`production/schema.ts:218,423`, `activities.ts:107`, `projectStore.ts:289`
`useProductionProjects` · `connectorselect/engine/tester.ts:193` ·
`cable/data/registry.ts:40`, `cableinstall/data/mistakes.ts:63` ·
`calcGlossaryLinks.ts:57`, `calcPanel.tsx:89`, `workflowStore.ts:166` ·
`mixModel.ts:90`, `tube/tubeRefs.ts:130,152`, `tuningMath.ts:58` ·
`micDrawings.tsx:96,233`, `speechModel.ts` helpers · `cableinstall/motion.tsx:401`
`useOnCross`.

*Unused presentational components / style objects:* `gainViz.tsx:337,430`
(`DeviceLeds`, `DeviceMeter`) · `tube/viz.tsx:1736` `TubeGlyph` ·
`tuning/components/primitives.tsx:420` `PlayStop` · `vizPlate.tsx:730` `vizStyles` ·
`directoryBits.tsx:273` `directoryStyles` · `micspeaker/viz.tsx:142` `POLAR_PATTERNS` ·
`wave/vizWave.tsx:125` `modalColor` · `ScreenIntroOverlay.tsx:171` `ScreenIntroSequence` ·
`TrophyImage.tsx:55` `prefetchImages`.

*Unused constants / data / types:* `topicImages.ts:194` `TOPIC_IMAGE_FILES` ·
`glossaryShare.ts:61,62` `WEBSITE`/`GLOSSARY_TAGLINE` · `learningProfiles.ts:283`
`PLANNED_TERMS` · `cable/data/glossaryVerified.ts:19,95` · `mediaTypes.ts:69`
`DEV_SCENARIO_ITEMS` · `profile/api.ts:16` `ALBUM_DENOMINATOR` ·
`celebration/catalog.ts:300` `TROPHY_CASE_EMPTY` · `iapProducts.ts:27` `ALL_SKUS` ·
`EntitlementProvider.tsx:29` `ENTITLEMENTS`, :493 `useCommercialMode` ·
`auth/api.ts:49,66,139` (`RegisterStudentResult`, `REGISTER_ERROR_COPY`, `resetPassword`
— `AuthScreen` drives the reset flow through `supabase.auth` directly) ·
`navigation/linking.ts:108,156` `glossaryTermUrl`/`topicUrl` (the canonical share URLs
the website will host — written ahead of the website, per their own docstrings) ·
`lib/authStorage.native.ts:44`, `lib/useShake.ts:20`, `config/flags.ts:15`,
`detailSwipe.tsx:60`, `production/postprod/index.ts:64`.

*Test-only exports (40) — all legitimate:* the `__reset*ForTests` family
(`filePlayers`, `soundSafetyAck`, `celebrationSeen`, `useCredentialCelebration`) and
pure-function surfaces that node:test covers directly (`ampModel` gain functions,
`celebrationQueue.resolveCelebrations`, `directory/rules.aboutProblem`,
`production/{rules,readiness,schema,labs,types}`, `speechModel`, `sentences`,
`mixing/engine/*`, `patchbay`, `harmonicModel`, `tuningMath`, `pendingLink`,
`connectorselect/evaluate`, `measurementStore.updateMeasurement`, `cymatics`
geometry). Exporting for testability is correct, not dead.

---

## What I would fix first

1. **7.1** — `MemberGated` inert on 8 routes. Both flagship paid labs open free on a
   bare URL, and the deep links that make it reachable were opened *because* the gate
   was believed to work. BLOCKER, and the test that should catch it asserts on source
   text rather than behaviour.
2. **6.1 + 10.2** — the time-trial interval outliving sign-out and crediting the next
   account. The abort function already exists in the file.
3. **6.4 / 6.3 / 6.5** — permission ask-modes, Low-Light, and the audio output-cap
   unlock crossing an account switch. Privacy, usability, and a safety gate.
4. **9.2 / 9.3** — production budget maths silently reading 12,000 as zero (or as 12)
   and printing a healthy verdict over it into a client-facing PDF.
5. **9.4** — the suppressed calculator safety warning, given the source-of-truth rule.
6. **3.3 / 7.2** — the three modals that flash full brightness in Low-Light Production
   Mode, against copy that promises they cannot.

## What is genuinely clean

**Class 4 is clean** — 1,098 hook scopes and 6,141 hook calls swept with the TypeScript
compiler API, zero parse errors, zero violations, both known bugs verified fixed. The
one caveat is that `eslint-plugin-react-hooks` is not installed, so nothing enforces it
going forward.
