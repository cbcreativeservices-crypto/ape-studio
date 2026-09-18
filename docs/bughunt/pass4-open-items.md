# Pass 4 — agent G — the still-open list, confirmed and extended

Read-only pass over `BRIEF.md` § **STILL OPEN after pass 3**. Every line number
below was re-read today (2026-09-18) against the working tree, not copied from
the pass-3 reports.

> **Live-edit warning.** Eight agents are running. While I was working,
> another agent landed fixes inside `clearLocalAccountData.ts`,
> `timeTrial.ts` and `permissionStore.ts`. Item 1's verdicts below are split
> into *fixed while I watched* and *still open*, and I say which is which. If
> you read this more than an hour after it was written, re-check item 1 first.

---

## Verdict table

| # | Brief's open item | Verdict | Severity as it really is |
|---|---|---|---|
| 1a | Time trial survives sign-out, credits the arriving user | **ALREADY FIXED** (landed during this pass) | was MAJOR |
| 1b | `cancelTimeTrial` has no callers | **CONFIRMED** — still zero callers, but now harmless dead code | MINOR |
| 1c | Permission ask-modes survive an account switch | **ALREADY FIXED** (landed during this pass) | was MAJOR |
| 1d | Low-Light mode survives an account switch | **CONFIRMED** — still unreset | MAJOR |
| 1e | Audio cap unlock survives an account switch | **CONFIRMED** — `resetGenCapSession` still has zero callers | MAJOR (safety gate) |
| 1f | Registry drift (the sweep) | **CONFIRMED** — 7 of pass-3's 9 still open, **+3 new**, and **no test guards it** | see §1 |
| 2a | Budget maths reads "12,000" as zero into a client PDF | **DIFFERENT THAN REPORTED** — real, but it is the *table cell*, not the budget field, and it hits 10 columns | MAJOR |
| 2b | Production dates go through `Date.parse`; rules fail open | **CONFIRMED** | MAJOR |
| 2c | *(new)* `NumberField` deletes the European decimal comma — "1,5" becomes 15 | **NEW** | MAJOR |
| 3 | "Reduce animations" ignored by 11/17 `withRepeat`, 10/16 `Animated.loop` | **CONFIRMED with a correction** — loop count exact; `withRepeat` is 12/17, and the OS claim is **half wrong** | MAJOR |
| 4a | "Manage My Learning" has a permanently disabled TAKE FINAL EXAM | **CONFIRMED** — and there are **two** of them | MAJOR |
| 4b | Final Exam membership wall offers only Back | **ALREADY FIXED** (pass 3, verified) | — |
| 4c | Credential celebration's SHARE does nothing while burning the celebration | **CONFIRMED** | MAJOR |
| 5a | No audio focus request anywhere on Android | **CONFIRMED** | MAJOR |
| 5b | Oboe OUTPUT stream has no error callback or watchdog | **CONFIRMED, and worse** — *neither* stream has an Oboe error callback | MAJOR |
| 6 | Study-tab row download / Explore serial paging / Awards 5-page mount / 33 MB TOPICS | **ALL FOUR CONFIRMED**, unchanged | MAJOR ×1, MINOR ×3 |

---

# 1. State that survives an account switch

Registry: `src/features/account/clearLocalAccountData.ts`. Entry points that
call it — `accountLocalSync.ts:45-46`, `SingleDeviceGuard.tsx:57-58`,
`DeleteAccountButton.tsx:82-83`, `AuthScreen.tsx:169-170` (guest, `total`).

## 1a / 1c — fixed underneath me. Verified good.

`resetTimeTrials()` now exists at `src/features/study/timeTrial.ts:307-315` and
is imported and called at `clearLocalAccountData.ts:42` / `:183`. It clears the
intervals **first** (`for (const method of [...timers.keys()]) clearTimer(method)`),
which is the part that mattered — the free-running `setInterval` armed at
`timeTrial.ts:240` was what reached `recordTimeTrialPass` → `supabase.rpc('credit_time_trial')`
under the arriving session. Correct fix; it iterates a copy of the key list
before mutating, so no iterator invalidation.

`resetAskModeCache()` at `src/features/permissions/permissionStore.ts:60-62`,
called at `clearLocalAccountData.ts:187`. Correct.

`resetPopupSuppression()` was also added (`popupSuppressStore.ts:57-61`). Note
for whoever landed it: `ape:devSuppressPopups` is on the **KEEP** allowlist, so
the key survives while the mirror is cleared. That is fine **only because** the
reset also clears `hydrated`/`hydrating`, so the next `arePopupsSuppressed()`
re-reads the kept key. Leave those two lines in.

## 1b — `cancelTimeTrial` still has no callers. CONFIRMED, MINOR.

`src/features/study/timeTrial.ts:288-290`. Zero call sites outside the file.
`isTimeTrialLive` (`:318`) likewise. Now that `resetTimeTrials` exists these are
dead code rather than a missing abort path, but they still read as wired.

## 1d — Low-Light Production Mode. CONFIRMED. MAJOR.

`src/features/settings/lowLight.ts:25-27` — `on`, `touchedAt`, `hydrated`.
`settings/store.resetLocal` (`store.ts:218-222`) covers haptics, mic-release and
`resetA11y()` only. `ape:lowLight` / `ape:lowLightAt` are swept by the `ape:*`
rule, but `hydrated` stays `true` so the cleared keys are never re-read.

Result: the next user's screen is 50% black (`LOW_LIGHT_DIM = 0.5`, `:19`) with a
red line across every screen and **no visible explanation**. The documented
escape is the six-fast-taps gesture (`:124`). Inverse: the first
`setLowLight()`/`touchLowLight()` (`:66`, `:83`) re-persists the departing user's
state under the new account.

This is not a cosmetic carry-over. Low-Light also suppresses auto-appearing
overlays by product rule — the arriving user is handed a silenced app they never
switched on.

## 1e — the generator output-cap unlock. CONFIRMED. MAJOR (safety gate).

`src/features/tools/genCapSession.ts:15` `unlockedThisSession`.
`resetGenCapSession` (`:24-26`) exists, its docstring says *"e.g. on explicit
sign-out"*, and it has **zero call sites in `src/` or `test/`** — I checked by
name across the whole tree. The next person on the handset opens the Tone/Noise
Generator with the Q4 output cap already lifted and is never shown the confirm
prompt. Exactly the class the registry itself calls *"the safety gate; it is the
one entry here that must never be missed"* about `soundSafetyAck`.

## 1f — the sweep, and what would stop the drift

I re-ran the whole audit: every module-level `let` under `src/features/**`
(159 of them), plus the mutated module-level `Map`/`Set`/object cases the `let`
grep misses, checked in both directions (state not reset; and key swept but a
surviving cache writes the old value back).

### Pass-3's nine: 2 fixed, 7 still present today

| Pass-3 id | Location today | Status |
|---|---|---|
| 6.1 | `study/timeTrial.ts:120-123` | **FIXED** (`resetTimeTrials`) |
| 6.2 | `onboarding/attractStore.ts:28-30` | still open — `resetLocal()` at `:164`, still not imported |
| 6.3 | `settings/lowLight.ts:25-27` | still open |
| 6.4 | `permissions/permissionStore.ts:28` | **FIXED** (`resetAskModeCache`) |
| 6.5 | `tools/genCapSession.ts:15` | still open |
| 6.6 | `review/reviewPrompt.ts:39-40` | still open |
| 6.7 | `intro/onboardingFlow.ts:41-44` | still open |
| 6.8 | `screens/lab/mixing/kit.tsx:43,79` | still open |
| 6.9 | `screens/lab/deesser/DeEsserLabScreen.tsx:31` | still open |

Pass-3's completeness signal still holds and is now sharper: **17 modules export
`resetLocal`; the registry imports 16.** The odd one out is still
`onboarding/attractStore.ts:164`.

### NEW instances pass 3 did not file

**N1 — `notifications/localSchedule.ts:176` `syncTimer` is an armed timer that
nothing cancels.** MINOR, but it is a *named* precedent violation.
`requestLocalNotifSync` (`:200-208`) captures the departing user's
`LocalSettings` object and fires 1200 ms later; nothing clears it on sign-out.
`enrollmentStore.resetLocal` (`enrollmentStore.ts:329-341`) cancels its own
`syncTimer` and the comment explains in detail why — *"the debounced callback
reads module-level state at FIRE time and uses whatever session is current"*.
`publicProfile.resetLocal` (`:238-248`) cancels both of its timers for the same
reason. `localSchedule` is the one that does not. Impact is bounded — it
schedules generic local reminders, not server writes — so MINOR, not MAJOR. Pass
3 flagged `lastSlice`/`lastFullSyncAt` in this file but not the live timer.

**N2 — `lab/labCompletion.ts:332-336` leaves `hydrated`/`hydrating` latched.**
Pass 3 put this under "worth a look"; I am filing it, because it is the *only*
store in the registry that breaks the pattern, and the file two doors down
(`exposureMonitor.ts:257`) carries the comment `hydrated = false; // hydrate() is
latched — must clear or the re-seed no-ops`. It is harmless *only* while
`clearLocalAccountData()` is awaited before `resetAllLocalStores()`. Every caller
does that today. It becomes a silent leak of lab-completion state the day
anyone reorders those two lines — and two of the four call sites are one line
apart, so that reorder is a plausible edit.

**N3 — a keyspace result, offered as a negative finding.** I checked whether any
user data is persisted *outside* the `ape:` namespace, which the sweep cannot
see at all. It is not: all 61 literal storage keys and all 9 key-builder
functions produce `ape:…`. `SecureStore` holds only the Supabase session
(`lib/authStorage.native.ts`), and the only `FileSystem` writes are
`ear/earPlayer.ts:72` (a scratch WAV) and `lab/cymatics/galleryExport.ts:97` (an
export the user asked for). SQLite is covered by name
(`clearStoredMeasurements()`). **The sweep's coverage of the keyspace is sound.**
The drift is entirely in the in-memory mirror list.

### What would stop the drift

There is **no test anywhere** that touches `clearLocalAccountData` or
`resetAllLocalStores` — I grepped all 66 files in `test/`. That is the answer.
Two fixes in pass 2, nine in pass 3, three more here: the list is maintained by
eye and eyes keep missing it, because nothing fails when a module is left out.

The cheap guard that would actually hold, in order of effort:

1. **A structural test.** `17 modules export resetLocal; the registry imports 16`
   is a machine-checkable invariant. A test that globs `src/**` for
   `export function resetLocal`/`export function reset*Local*` and asserts each
   is imported by `clearLocalAccountData.ts` would have caught 6.2 and N1, and
   catches the next one free. This is the single highest-value item in this
   report, because it converts a recurring class into a build failure.
2. **An ESLint rule or a naming convention with teeth** — any exported symbol
   matching `/^reset[A-Z]/` in `src/features/**` must appear in the registry, or
   be explicitly listed in a `NOT_ACCOUNT_STATE` allowlist *in the registry file*
   with a one-line reason. The allowlist is the deliverable: it turns pass-3's
   excellent "BENIGN — the shapes checked and cleared" prose into something the
   next author has to update.
3. **A behavioural test** that fakes a switch (write a value into each store,
   run the registry, assert every store reads its default). Best coverage,
   most work, and it cannot be written until (1) tells you what the set is.

Without (1), assume this list regrows.

---

# 2. Free-text parsing

## 2a — the budget. CONFIRMED, but not where the brief says. MAJOR.

The brief says the *budget maths* reads "12,000" as zero. It does — but the
scalar budget field is fine and the **table cell** is the hole.

* `budget_total` is `kind: "currency"` (`preprod/stage4.data.ts:343-348`) →
  rendered by `NumberField` (`FieldRow.tsx:437-484`), which strips every
  non-`[0-9.\-]` character and uses `keyboardType="decimal-pad"`. Typing
  "12,000" there yields 12000. **Safe.**
* `bl_amount` is `kind: "currency"` **inside a table** (`stage4.data.ts:428-430`).
  Table cells fall through `Cell()` to the bare `TextInput` at
  `FieldRow.tsx:341-356`, which does `onChangeText={onChange}` — the raw string
  is stored verbatim — and sets `keyboardType="numeric"`, which on iOS is
  `UIKeyboardTypeNumbersAndPunctuation`, i.e. **the comma is on the keypad**.

Then `cellNum` (`features/production/rules.ts:133-141`) does `Number("12,000")`
→ `NaN` → returns `null`, and every consumer spells `?? 0`:

* `preprod/logic.ts:509-515` `schedule-budget-exceeded` —
  `sum = lines.reduce((t, l) => t + (cellNum(l, 'bl_amount') ?? 0), 0)`. The
  12,000 line contributes **zero**, so `sum > total` is false and the
  over-budget advisory **never fires**. Fails OPEN.
* `preprod/logic.ts:850-859` gate `budget-balances` — a contingency typed
  "1,000" reads 0, so `(cellNum(...) ?? 0) <= 0` fails the gate. Fails CLOSED.
* `preprod/logic.ts:499-506` `schedule-no-contingency` — fires *"no
  contingency"* at a user who typed one.

So the same typo simultaneously hides a real overspend and invents a missing
contingency, and the readiness verdict and the line items both ride into the
exported packet (`features/production/packet.ts`). Client-facing.

**The correction that matters for the fix:** this is not one field. Ten table
columns are numeric and every one of them is this same raw `TextInput` —
`stage2.data.ts:134` `item_count`, `stage4.data.ts:428` `bl_amount`, `:598`
`res_needed`, `:603` `res_available`, `stage5.data.ts:303` `in_num`,
`stage6.data.ts:336` `eq_qty`, `postprod/stage2.data.ts:167` `mi_channels`,
`stage3.data.ts:184` `tl_count`, `stage6.data.ts:420` `pr_channels`,
`stage8.data.ts:205` `dl_channels`. For the counts, the failure is "3 mics" or
"2 ea" → 0, which feeds the channel-capacity and storage rules.

The one-line shape of the fix: make `Cell()` route `number`/`currency` through
`NumberField`'s cleaning (or at minimum through `parseQuantity`), the same way
the 2026-09-17 fix taught `Cell()` to honour `options`.

## 2b — dates. CONFIRMED. MAJOR.

`when()` — `features/production/rules.ts:102-110`. Only a bare `YYYY-MM-DD`
matches the explicit branch; everything else goes to `Date.parse`. The field is
free text with a `"YYYY-MM-DD"` placeholder and **no validation, no rejection and
no feedback** (`FieldRow.tsx:142-154` for scalars, `:349` for the 11 date
columns).

* `"01/04/2026"` — a JS engine that accepts US `M/D/Y` returns **4 January**
  where a UK user meant 1 April. Silently wrong, not silently absent.
* `"15/03/2026"` — month 15; `NaN` → `null`.

On `null`, every date rule short-circuits and says nothing:
`schedule-dates-do-not-fit` (`preprod/logic.ts:576-582`) tests
`target !== null && production !== null && …`; `define-deadline-past` (`:75-80`)
returns `t !== null && …`; the milestone loop (`:598`) `continue`s on null.
**Fails open, every time.** A plan whose delivery is before its production date
passes clean.

*Uncertainty, stated:* which of the two failures you get depends on the JS
engine. Hermes' `Date.parse` is far stricter than V8's, so the device build most
likely gets `null` (silent) while the `ape-web` browser preview gets
4 January (wrong). That means **this bug does not reproduce the same way in the
preview as on the phone** — worth knowing before someone tries to repro it. What
would settle it: type `01/04/2026` into a production date on a real build and
see whether a date rule fires at all. Either answer is a bug; they need
different fixes (reject-and-explain vs. reject-and-explain *plus* the engine
difference).

## 2c — NEW. `NumberField` silently deletes a European decimal comma. MAJOR.

`FieldRow.tsx:459` — `let cleaned = t.replace(/[^0-9.\-]/g, '')`.

A user who types **"1,5"** meaning 1.5 gets `"15"`, published as the number 15,
and the field re-renders showing `15`. A **ten-fold** error, committed on the
keystroke, with the field agreeing on screen. `"1250,50"` becomes 125050.

This is the exact class of the 2026-09-17 decimal-point bug whose fix is
documented in that function's own header (`:416-436`) — same field, one comma
over. It affects all 45 scalar numeric fields across both production labs, and
it lands in the exported packet where nobody can see it was a typo.

The app already owns the correct parser: `parseQuantity`
(`screens/lab/calc/calcUnits.ts:205-236`) handles decimal comma, decimal point,
thousands grouping, and the ambiguous cases — that is precisely why it was
written for the calculators in pass 2. The production labs never adopted it.
**Both 2a and 2c are the same missed adoption.**

## Sweep — every other place user text becomes a number or a date

I walked all 20 files containing `onChangeText`, all `parseFloat`/`parseInt`
call sites, and every `new Date(` / `Date.parse`.

**Clean.** The result is narrow and worth stating plainly:

* **The only user-entered dates in the entire app are in the two Production
  labs.** No other screen turns typed text into a date. `Date.parse` elsewhere
  (`achievements/api.ts:133`, `credentials/api.ts:101`,
  `commercial/entitlementExpiry.ts:40`, `glossary/glossaryCap.ts:69`) reads
  server ISO-8601 only, and `entitlementExpiry` already guards with
  `Number.isFinite(Date.parse(...))` by name.
* **The only other place user text becomes a number is the Calculator Lab**,
  which uses the hardened `parseQuantity` at all three sites
  (`calcPanel.tsx:44`, `:127`, `CalcProjectsScreen.tsx:130`).
* Every remaining `parseInt` is hex-colour parsing, a MIDI note name, or a
  stored `'HH:MM'` from the app's own picker. None takes free text.
* Directory, profile, glossary, tube reference and connector-select inputs are
  text or search only — no numeric or date coercion.

So: **fix `Cell()` and `NumberField`, and free-text parsing is closed.**

---

# 3. "Reduce animations"

Runtime: `src/features/settings/a11y.ts`. `animationsAllowed()` (`:75-77`)
returns `!state.reduceAnimations && !osReduceMotion` — the app toggle OR'd with
the OS setting. Correct as written.

**CONFIRMED — with one correction the brief gets backwards.**

The brief says *"since the OS setting is ORed in, phone-wide reduce-motion is
ignored too."* That holds for the files that consult **nothing**, but there is a
third group the brief misses: files that read `AccessibilityInfo` **directly**
and therefore honour the **OS but not the app toggle**. Someone who turns off
the app's own switch, having left their phone alone, gets no effect from those
files. The failure runs in both directions.

### `withRepeat` — 17 files

**Honour both (5):** `features/lab/attentionPulse.tsx`,
`features/onboarding/AttractCue.tsx`, `screens/curriculum/InsideStats.tsx`,
`screens/tools/CenterLockTuner.tsx`, `screens/tools/SkinnedTunerVu.tsx`.

**Honour the OS only — app toggle ignored (7):** the whole Cable Install lab.
`screens/lab/cableinstall/motion.tsx` `useCiMotion()` (`:98-105`) calls
`AccessibilityInfo.isReduceMotionEnabled()` itself, and its six scenes
(`CeilingScene`, `FireScene`, `InspectScene`, `RackScene`, `WallsScene`,
`WhyScene`) take the result as a prop. The file's own header claims *"REDUCED
MOTION is honored everywhere"* — true of the phone setting, false of the app's.

**Honour nothing (5):** `screens/lab/HarmonographMachine.tsx`,
`screens/lab/OscillatorLabScreen.tsx`, `screens/lab/micspeaker/MicCutaway.tsx`,
`screens/lab/wave/vizWave.tsx`, `screens/tools/Spl3dGauge.tsx`.

So **12 of 17 ignore the app toggle** (the brief said 11) and 5 ignore motion
preference entirely.

### `Animated.loop` — 16 files

**Honour both (6)** — the brief's count is exact.
`screens/dashboard/DashboardScreen.tsx:950`, `screens/enrollment/EnrollmentScreen.tsx:95`,
`screens/lab/amp/AmpRig.tsx:143`, `screens/tools/SplMeterScreen.tsx:389`,
`screens/lab/patchbay/art/PatchPairView.tsx` (via `PagedLab.tsx:91`, which
computes `osReduceMotion || !animationsAllowed()` — the only place in the app
that gets the composition exactly right), and `components/nav/NavIcon.tsx:99-117`
(OS only).

**Honour nothing (10):** `components/SwitchButton.tsx`,
`components/tooldemos/{HzCounter,Rt60,Rta,SignalGen,Spectrogram,Spl,Waveform}Demo.tsx`,
`screens/lab/HarmonicsView.tsx`, `screens/tools/hubPreviewsSim.tsx`.

### Ranked by how visible each is

1. **`components/SwitchButton.tsx:110-121`** — the app's standard switch. An
   unconditional 5.1-second filament-flicker `Animated.loop`, started in a
   `useEffect` on every instance, gated by nothing. The Dashboard renders
   **seven** of them (`DashboardScreen.tsx`) and CourseSelection one. This is
   the single most-seen animation in the product and it is the one that ignores
   the setting most completely. Also a standing battery cost.
2. **`screens/tools/Spl3dGauge.tsx`** — the SPL meter's main dial, with a
   shimmer sweep and three sparkle tiers on `withRepeat`. The sharpest case in
   the list: `SplMeterScreen.tsx:389` **already computes `motionOk`** for its own
   loop and then renders `Spl3dGauge` at `:229` and `:2213` **without passing
   it**. Parent honours, child ignores, on the same screen.
3. **`screens/tools/hubPreviewsSim.tsx` + the 7 `tooldemos`** — the Tools Hub
   tiles. Same shape again: `ToolsHubScreen.tsx:367` gates its power-on stagger
   on `animationsAllowed()` and then leaves every tile mini looping. A dozen
   simultaneous loops on a hub screen is exactly what someone with vestibular
   sensitivity turned the setting on to avoid.
4. **`components/nav/NavIcon.tsx`** — the tab bar, on screen at all times.
   Honours the phone, ignores the app switch.
5. **Cable Install (7 files)** — OS-honouring, app-ignoring; a whole lab.
6. **`vizWave`, `OscillatorLabScreen`, `HarmonographMachine`, `MicCutaway`,
   `HarmonicsView`** — inside individual labs, reached deliberately. Least
   visible, still wrong.

The structural fix is the same as §1's: the composition at `PagedLab.tsx:91` is
the only correct one in the codebase and it is written inline rather than
exported. `animationsAllowed()` already ORs the OS in — every `AccessibilityInfo`
call site in `motion.tsx` and `NavIcon.tsx` should be deleted in favour of it.

---

# 4. Dead and misleading controls

## 4a — "Manage My Learning". CONFIRMED, and there are two. MAJOR.

`src/screens/enrollment/EnrollmentScreen.tsx` — **two** permanently disabled
TAKE FINAL EXAM buttons:

* `:1114-1128` (award card, certs/programs)
* `:1216-1218` (a second card shape)

Both are hardcoded `disabled`. The comment at `:1124` is explicit: *"The button
is a placeholder that never enables (not even at 100%)"*. The accessibility
label says "not available yet"; the **visible** button says only
`TAKE FINAL EXAM` in gray, so a sighted user gets a dead control with no reason
given at all.

Meanwhile **the Final Exam works**. `screens/awards/AwardProgressScreen.tsx:248-253`
navigates to the live `FinalExam` route (`RootNavigator.tsx:387`) whenever
`allComplete`. So a member at 100% is looking at a gray button on one screen
while the working one sits behind a different tap.

**And AwardProgressScreen shows exactly how this should look.** At `:257-262` it
renders a disabled button *plus* `"Complete every required topic to unlock the
Final Exam."` and *then* the exam terms. That is the pattern; EnrollmentScreen is
the one screen that omits it.

Minimum honest fix: on the Enrollment cards either delete the two buttons, or
give them the AwardProgress treatment — a reason line and, when the award is
complete, a route to `AwardProgress`.

## 4b — the membership wall. ALREADY FIXED. Verified.

`screens/exam/FinalExamScreen.tsx:444-458` now renders a
`"See membership plans"` primary button to `Paywall` on
`startErrorCode === 'academy_required'`, above the Back button, with the pass-3
rationale in the comment. Confirmed present and correct.

(Unrelated but adjacent: `:463-470`, the "no questions available" branch, still
offers only Back. That one is genuinely a dead end with nothing better to
offer, so I am not filing it.)

## 4c — the celebration's SHARE. CONFIRMED. MAJOR.

`src/screens/results/CelebrationScreen.tsx:135-146`:

```ts
case 'view-summary':
case 'view-requirement':
case 'share':
// Share and the two summary destinations are not built yet. Falling
// through to the same exit as DONE is the honest behaviour...
// eslint-disable-next-line no-fallthrough
case 'dismiss':
default:
  toStudy();
```

`toStudy()` (`:78-83`) is `navigation.reset(...)` to the Dashboard. So SHARE
**closes the celebration and goes home.**

The comment argues this is "honest" and that "nothing here pretends to have
shared something". That reasoning does not survive contact with the caller.
`DashboardScreen.tsx:726-727` calls `c.confirmShown()` **before** navigating —
by design, per `useCredentialCelebration.ts:75-85` — so by the time the button
is on screen the celebration is already spent. Tapping SHARE therefore burns a
once-in-the-product moment and returns the user to the Dashboard with no share
sheet, no link, no explanation and no way back. A button labelled SHARE that
dismisses is not honest; it reads as a crash.

It is offered on **five** celebrations — `catalog.ts:224, 236, 249, 262, 280` —
i.e. every credential celebration, the rarest and strongest moments in the app.

Worse, the capability exists: `features/credentials/certificatePdf.ts` already
lazy-loads `expo-print` and `expo-sharing` and shares a certificate. The
celebration simply does not call it. Either wire `share` to that, or remove
`SHARE` from those five catalog entries — the second is a five-line change and
is strictly better than shipping the current behaviour.

## Sweep — other disabled or no-op controls

I read every `disabled` prop under `src/screens/` and `src/components/`, and
every `onPress={() => {}}`.

**Clean, with one precision worth recording.** Every other disabled control is
conditional and explained:
`AwardProgressScreen.tsx:257` (+ reason line), `CareerFinderQuizScreen.tsx:112-117`
(a11y labels state the condition), `DashboardScreen.tsx:1812/1856/1943` (the
power-sequence rack — `a11yLabel="Locked — complete the earlier study methods
first"`), `directoryBits.tsx:53` (*"You have reached the limit for this
section"*), `TopicDeckSheet.tsx:104-114`, `CourseSelectionScreen.tsx:915`.
The `onPress={() => {}}` hits are all modal-card backdrop-swallowers
(`AppDialog`, `AccuracyNote`, `MembershipGate`, etc.), which is correct.

**Precision on 4c:** `view-summary` and `view-requirement` also fall through to
`toStudy()`, and their labels are worse — `'VIEW SUMMARY'` and
`'VIEW WHERE IT APPLIES'`, both marked `primary: true`
(`catalog.ts:192`, `:209`). But I traced the emitters: the `'subject-complete'`
and `'requirement-complete'` celebration ids appear **only** in `catalog.ts` and
in the `CelebrationId` union in `types.ts:49-50`. Nothing in
`celebrationQueue.ts` or any screen ever emits them. **They are unreachable
today**, so they are latent, not live. Fix them with `share`; do not count them
as a second user-facing bug.

---

# 5. The Android audio stream

Native source: `modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp` and
`modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt`.

## 5a — no audio focus. CONFIRMED. MAJOR.

`requestAudioFocus`, `abandonAudioFocusRequest`, `AudioFocusRequest` and
`OnAudioFocusChangeListener` appear **nowhere** in the repo. `ApeDspModule.kt`
touches `AudioManager` five times (`:112`, `:124`, `:152`, `:430`, `:437`,
`:458`) and every one is a *query* — device enumeration and the
`PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED` check. Never a focus request.

The only audio-session calls in the whole app are
`setAudioModeAsync({ playsInSilentMode: true })` at `features/ear/earPlayer.ts:112`
and `features/lab/LabAudioPlayer.ts:69` — and `playsInSilentMode` is an iOS
concept that does nothing for Android focus.

What the user gets: the Tone/Noise Generator and every engine-driven lab tone
plays **over** whatever else is running, does not duck, does not pause for a
phone call, and does not stop when another app takes focus — and symmetrically,
we never learn that we lost focus, so nothing in our UI reflects it. On a
product whose central safety promise is about hearing dose, an unstoppable tone
during a phone call is the worst shape this can take.

**Smallest safe fix.** In `ApeDspModule.kt`: build one
`AudioFocusRequest(AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)` with an
`OnAudioFocusChangeListener`, request it in the existing `genStart`/capture-start
entry points, abandon it in the matching stop, and on `AUDIOFOCUS_LOSS` /
`AUDIOFOCUS_LOSS_TRANSIENT` call the stop path the module already has. Roughly
30 lines, no new dependency, no C++ change.

## 5b — the OUTPUT stream. CONFIRMED, and the brief understates it. MAJOR.

`setErrorCallback` is called on **neither** stream. Builders:

* INPUT — `ApeDspJni.cpp:222-235`: `setDataCallback(&inputCb_)` only.
* OUTPUT — `:272-282`: `setDataCallback(&outputCb_)` only.

So the brief's *"the INPUT stream has both"* is not quite right. What the input
actually has is a **JS-independent stall watchdog on its own analysis thread**
(`:390-404`): if `now - lastWriteAt_ > kStallSeconds` it calls
`reopenInputStream()` (`:305-320`), rate-limited by
`kReopenBackoffSeconds = 1.5` (`:39`), on an owned joinable thread — the design
explicitly avoids a detached recovery thread. It also adapts the buffer on XRuns
(`:380-389`). That is a good, deliberately-built recovery path, and it works
because the analysis thread exists for the input and polls anyway.

**The output has no equivalent and no thread of its own.** Its lifetime is
`openStream` → `requestStart` (`:287-301`) and a deferred close under
`outStreamMu_`. Nothing polls it. When AAudio disconnects the output — headphone
unplug, a Bluetooth handoff, a USB interface removed, a route change the OS makes
on its own — the data callback simply stops. No error is raised to anything, the
JS layer still shows the generator running, and the tone is gone until the user
guesses to press STOP then START.

**Smallest safe fix.** Add an `oboe::AudioStreamErrorCallback` member with
`onErrorAfterClose`, pass it via `->setErrorCallback(&outputErrCb_)` at `:282`,
and have it re-run the existing open-output path under `outStreamMu_`, rate-
limited the same way `reopenInputStream` is. `onErrorAfterClose` (not
`…BeforeClose`) is the one that is safe to reopen from. The input stream should
get the same callback for belt and braces, but its watchdog already covers the
realistic cases, so the output is the one that must land.

## Can either ship without a native rebuild?

**No. Say this plainly to the owner.**

5a is Kotlin, 5b is C++ inside `modules/ape-dsp`. Both compile into the native
binary. `eas update` ships the JS bundle only — publishing an OTA with these
changes in the tree would change nothing on the phones *and* would silently
alter the fingerprint inputs. There is also **no JS-only mitigation available**:
the app's existing interruption handling is the AppState `panicMuteAudio` path,
which was deliberately narrowed to `background` only in pass 3 (an incoming call
surfaces as `inactive` on iOS and does not background the app on Android
either), so focus loss produces no JS-visible signal at all.

These two must ride the next native build. There is no partial version of them.

---

# 6. Performance — all four confirmed, numbers unchanged

**G1 — the Study tab counts by downloading the rows.** CONFIRMED. MAJOR.
`src/features/dashboard/api.ts:132-152`. `resolveItemCounts` does
`.select('achievement_id').in('achievement_id', topicIds)` with **no**
`{ count: 'exact', head: true }` — it pulls one JSON row per
(topic × glossary term) and counts them client-side in a loop, then runs a
**second** name-based sibling union for any topic that came back zero
(`:148-152`). Unpaginated, on every Study-tab focus and after every study write.
100 KB – 1.5 MB per Dashboard load, all day. This is the one to fix first: it is
the most-visited screen and the fix is `head: true` plus a count.

**G2 — Explore pages the whole join table, serially.** CONFIRMED. MINOR-MAJOR.
`src/features/curriculum/curriculumStats.ts:79-93`. A bare
`for (let from = 0; ; from += PAGE)` loop, each iteration `await`ed before the
next — ~27 sequential round trips over ≥26,855 rows on every mount of the
Explore view. The loop is also unbounded except by `data.length < PAGE`.

**G3 — Awards mounts five pages per tap.** CONFIRMED. MINOR.
`src/screens/awards/AwardsScreen.tsx:784-830`. A horizontal paging `FlatList`
over `PAGE_ORDER` with `getItemLayout` and `initialScrollIndex` but **no**
`initialNumToRender` or `windowSize` override — RN's default
`initialNumToRender` is 10, so all five pages build on mount. `CurriculumView`
is one of them, which means **every Awards tap also pays G2's 27 serial round
trips**, plus `fetchV3Curriculum`, `fetchV3Programs`, `fetchV3Certs`,
`useAcademyStats` and `useCareerFinder`. G2 and G3 compound.

**G4 — TOPICS pulls 33 MB.** CONFIRMED. MINOR (data cost), MAJOR on cellular.
`src/screens/curriculum/CurriculumScreen.tsx:441-445` — `allTopics.map(...)`, a
plain unvirtualized `.map` over every topic. Each `TopicRow` renders
`<TrophyImage iconUrl={topicImagePath(gs)} size={34} … />`, and `topicImagePath`
(`src/data/topicImages.ts:187-191`) returns a bare bucket path with **no resize
or transform parameters** — the full 1024×1024 WebP, 166 of them
(`TOPIC_IMAGE_FILES`, `:193-194`), fired concurrently to draw 34 pt thumbnails.
One tap.

---

## If only three things get fixed

1. **§1f(1) — the structural test for the reset registry.** It is the only item
   here that stops a whole class from coming back, and three passes have now
   re-found the same class.
2. **§2a + §2c — route production numeric fields through the existing
   `parseQuantity`.** Wrong money in a client-facing PDF, from two one-line
   parser gaps, in a lab that is the flagship.
3. **§5 — put the Android audio-focus request and the Oboe output error
   callback in the next native build.** They cannot ship any other way, and a
   tone that will not stop for a phone call is a hearing-safety promise broken.

## Confidence

High on §1, §2a, §4, §5b, §6 — all traced end to end in the current tree.
High on §3's file classification (mechanically enumerated) and on the OS-vs-app
correction. **Medium on §2b's exact device behaviour** — the engine difference
between Hermes and the web preview is stated as an open question, not a
conclusion, and §2b is a bug either way. Medium on §5a's blast radius: I
confirmed no focus is requested anywhere, but I did not measure what `expo-audio`
does for its own file players on Android, so the two `LabAudioPlayer` /
`earPlayer` paths may be partially covered by the library. The Oboe engine —
which is what the generator and the labs use — is not.
