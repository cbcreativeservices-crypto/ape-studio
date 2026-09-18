# Bug-hunt pass 3 — agent A: adversarial verification of every pass-1 / pass-2 fix

Read-only pass. Nothing outside this file was edited.

**Build state:** `npx tsc --noEmit` → clean (exit 0, no diagnostics).
`npm test` → **1478 pass / 0 fail**, 221 suites, 8.0 s.

**Method:** every fix below was traced in the current working tree, not in its
commit message. For each I asked two questions: does the stated bug actually go
away on the real code path, and what else touched the thing that changed.

Bottom line: **three of the pass-2 fixes are broken or leave the bug half-fixed,
and one of those three makes a paying customer's successful purchase report
itself as a failure.** Everything else holds, most of it cleanly.

---

## Verdict table

| # | Fix | Verdict |
|---|-----|---------|
| **Pass 2** | | |
| 1 | Google refund path verified before revoking (`store-notifications`) | HOLDS WITH CAVEATS |
| 2 | Quiz replay no longer drops a row on a timeout (`quiz/api.ts`) | HOLDS |
| 3 | `enqueueSubmission` returns whether it stored | HOLDS |
| 4 | `study/sync` drops only on a positive permanent rejection | HOLDS WITH CAVEATS |
| 5 | Signing out no longer sweeps `ape:finalExamQueue` | HOLDS |
| 6 | `stopAllFilePlayers()` pauses only, no longer zeroes volume | HOLDS |
| 7 | FinalExamScreen retry loop after a failed queue write | **NEW BUG INTRODUCED** |
| 8 | Paywall blocks a purchase with no account | HOLDS WITH CAVEATS |
| 9 | Paywall "access is active" requires the academy tier | **NEW BUG INTRODUCED** |
| 10 | Anonymous device key no longer reads as a user change | HOLDS |
| 11 | `soundSafetyAck` + `celebrationSeen` mirrors reset on account wipe | HOLDS |
| 12 | Scenarios audio goes through the safety gate | HOLDS |
| 13 | Backgrounding the app silences lab tones | HOLDS WITH CAVEATS — too aggressive |
| 14 | `attemptDraft.ts` — answers survive a crash | HOLDS WITH CAVEATS |
| 15 | Quiz score no longer printed out of a hardcoded 30 | HOLDS |
| 16 | `parseQuantity` replaces `parseFloat` in the calculators | **BROKEN — the wrong-number path is still open** |
| 17 | Production labs: a decimal point can be typed | HOLDS |
| 18 | Production labs: a blank table row is not an answer | HOLDS |
| 19 | 7 flagship-lab child routes gated; 7 deep links claimed | HOLDS |
| 20 | Signed-out deep link no longer lands above `Auth` | HOLDS WITH CAVEATS |
| 21 | Required-education disclosure on Career Finder results / 3 roles | HOLDS (spot-checked, not exhaustively re-audited) |
| 22 | Low-Light no longer burns the hearing-dose warning | HOLDS |
| 23 | `fetchMyCredentials` throws instead of returning `[]` | HOLDS WITH CAVEATS |
| 24 | Credential celebrations now have a caller | **NEW BUG INTRODUCED** |
| **Pass 1** | | |
| 25 | 31 members-only lab routes wrapped in `withMembershipPreview` | HOLDS |
| 26 | Shake-to-mute / auto-mute can reach file playback | HOLDS |
| 27 | `AudioPlayer.tsx` output ceiling | HOLDS |
| 28 | Offline exam queue no longer self-clears; screen tells the truth | HOLDS |
| 29 | Quiz score shown as a percentage in the celebration | HOLDS |
| 30 | Dashboard `useMemo` hoisted above the early return | HOLDS |
| 31 | `add-without-erasing` passable on the music pathway | NOT RE-VERIFIED |

---

## The three that are not clean

### 16 — `parseQuantity` — BROKEN: the exact wrong-number path is still open

`src/screens/lab/calc/calcUnits.ts:190` `parseQuantity` is correct in itself, and
`buildValues` (`calcPanel.tsx:44`) uses it. But **two other call sites in the same
feature still use `parseFloat`, and one of them persists the wrong number.**

**16a — Saved Projects still turns `10,000` into `10`, and then feeds it to the
calculators. `src/screens/lab/calc/CalcProjectsScreen.tsx:130`:**

```ts
const base = units[v.unitIdx % units.length].toBase(parseFloat(v.raw));
if (!label || !Number.isFinite(base)) continue; // skip incomplete rows honestly
```

User path: Calculator Lab → Saved Projects → New → label "Sanctuary main run",
kind Impedance, type `10,000` → Save. `parseFloat("10,000")` is `10`, so the
project stores `baseValue: 10`. Then `CalcWorkflowRunScreen.tsx:320`
(`importFromProject`) writes `fmt(u.fromBase(v.baseValue), 6)` into the field —
`"10"` — and the workflow computes with 10 Ω. The number is now wrong in a saved,
named, reusable record that the user will trust across many runs, and nothing
anywhere says so. This is the same 1000× error the fix was written to kill, one
screen over, and it is *worse* than the original because it is persisted.
Severity **MAJOR**, confidence high (traced end to end).

**16b — the feasibility warning still reads the old parser.
`src/screens/lab/calc/calcPanel.tsx:126`:**

```ts
const baseVal = isList ? NaN : unit.toBase(parseFloat(raw));
const warn = field.warn && Number.isFinite(baseVal) && field.warn.test(baseVal) ? ... : null;
```

So for `"10,000"` the result panel shows nothing (strict parse → null) while the
warn line is evaluated against `10`. The 143 `warn` definitions are almost all
sign tests (`x <= 0`), so this rarely fires a *false* warning — but it means the
one line of safety feedback on the screen is computed from a number the
calculator has just refused to use. Severity **MINOR**, but it should move to
`parseQuantity` with the rest.

**16c — the honesty caveat the fix did not close.** When `parseQuantity` returns
null the panel renders `CalcWorkspaceScreen.tsx:280`:

> "Your answer appears here. Fill in the values below to calculate."

…to a user who *has* filled in every value. Inputs that used to produce a right
answer and now produce this message, with no explanation:

- `47uF`, `8 ohms`, `1k` — typing the unit into the box next to the unit chip.
  `parseFloat` read these correctly; `parseQuantity` rejects them.
- `10,5` — a decimal comma on a European keyboard. (Previously wrong — `10`;
  now silent. Refusing is right; saying nothing is not.)
- `12k` — engineering shorthand, in an app whose own help text writes `10 kΩ`.

Refusing to guess is the correct call and I am not asking for it to be reverted.
But "no result at all beats a confident wrong one" only holds if the screen says
*why* there is no result. Right now the app's response to `47uF` is to tell the
learner to do the thing they just did. One line — "This value could not be read
— enter digits only and pick the unit at the right" — closes it.

**Things I checked and cleared:** sliders (there are none in the calc feature);
unit switching (writes nothing into the field — `buildValues` re-converts the
same text); chain `SEND →` and workflow import (both write `fmt(x, 6)`, whose
output — including the `1.364e4` exponent form — matches `parseQuantity`'s
regex); in-progress typing (`"7."`, `".5"`, `"-3"` all parse); `parseList`
all-or-nothing (a trailing comma or double space produces empty tokens which are
filtered before parsing, so `"8, 8, 4,"` is still valid).

### 9 — Paywall "access is active" — NEW BUG: a successful purchase reports as a failure

`src/screens/commercial/PaywallScreen.tsx:45` and `:87`:

```ts
const tierRef = useRef(entitlement);
tierRef.current = entitlement;          // updated during RENDER
...
refreshEntitlement().catch(() => false).then((ok) => {
  if (ok && tierRef.current === 'academy') { welcome(); return; }
  Alert.alert('Purchase complete', 'Your payment went through … We couldn’t
    refresh your access on this device yet — check your connection and retry.');
});
```

`refreshEntitlement` (`EntitlementProvider.tsx:384–410`) calls
`setEntitlementState(tier)` and then `return true` on the very next line. That
`setState` is dispatched from inside a promise continuation, so React 18 gives it
DefaultLane and schedules the render through the Scheduler (a MessageChannel
**macro**task). The caller's `.then` runs as a **micro**task — i.e. before React
re-renders `PaywallScreen`, so `tierRef.current` is still the *pre-purchase*
tier.

Result: a `free` user completes a real, verified purchase and the first thing
they see is *"We couldn't refresh your access on this device yet — check your
connection and retry."* Tapping **Retry** calls `reflectPurchase()` again, by
which time the render has committed and `tierRef` says `academy`, so the welcome
finally appears. It self-heals in one tap — but the tap is preceded by an error
dialog on the single screen in the app where confidence matters most, and a
customer who taps **Later** leaves believing something went wrong.

The old code (`if (ok)`) was wrong for the reason the commit gives. The fix needs
the tier to come *back from* the refresh rather than be read from React state:
have `refreshEntitlement` resolve the applied tier (or `'ok' | 'failed'` plus the
tier) and branch on that value.

Severity **MAJOR** — money, and a false failure message. Confidence: high on the
code path and on React 18's scheduling; what would settle it beyond doubt is one
run on a device (or a `console.log(tierRef.current)` in that `.then` during a
sandbox purchase).

### 24 — `useCredentialCelebration` — NEW BUG: the celebration can be consumed without ever being shown

`src/features/celebration/useCredentialCelebration.ts:108` records the new
credential id set **before** returning the celebration:

```ts
await writeKnown({ ids, certificates, programs });   // recorded
...
return { event, values };                            // …then handed to the caller
```

and the only caller, `DashboardScreen.tsx:712`, drops it if the screen lost focus
while the network read was in flight:

```ts
let alive = true;
void checkCredentials().then((c) => {
  if (!alive || !c) return;          // ← celebration discarded, already recorded
  navigation.navigate('Celebration', …);
});
return () => { alive = false; };
```

Path: learner passes the Final Exam → lands on the Dashboard → `check()` fires a
`credential_awards` read → within that read's round-trip they tap a topic card
(entirely normal; the Dashboard is a launcher) → `alive` is false → the
celebration is thrown away, and `writeKnown` has already recorded the credential
as celebrated. **It never fires again, on any device, ever** — the record is
written, not the screen.

This is the identical shape as the bug commit `6b335c22` fixed two commits
earlier ("THE DAILY HEARING-DOSE WARNING WAS BURNED, NOT SHOWN … set its
once-per-day flag BEFORE emitting"), reintroduced in a different file. The
docblock's own reasoning for recording first (a kill mid-screen must not repeat
it) is sound; the error is recording before the consumer has *accepted* it. Move
`writeKnown` to the point where the Celebration route is actually entered, or
have `check()` return a `commit()` the caller calls after `navigate`.

Severity **MAJOR** — the paid-for moment, silently lost. Confidence high.

Two smaller things in the same file:

- **The `running` ref does not do what its comment says.** It is per *hook
  instance*: "Two screens can regain focus together, and without this both would
  … celebrate it twice" is false — two screens would each own a separate
  `running` ref and both would celebrate. Harmless today (only the Dashboard
  calls it), a trap the moment the Trophy Case is wired as the docblock intends.
  Make it a module-level flag.
- **Account switch has a small race.** `KNOWN_KEY` (`ape:celebratedCredentials`)
  is an `ape:*` key, so `clearLocalAccountData` does sweep it (verified: it is
  not in `KEEP` and does not match the `ape:intro:`/`ape:coach:` family). But the
  wipe and the Dashboard's focus check are not ordered, so if B's Dashboard
  checks before A's wipe lands, B is congratulated for credentials they earned
  months ago. Cosmetic, low probability, worth a note only.

### 7 — the exam retry loop — NEW BUG: an un-dismissable dialog storm

`FinalExamScreen.tsx:196–216` + `:227–234`. The retry itself is correct on the
questions asked: it **cannot double-submit** (`submitted.current` is taken at the
top of `doSubmit` and every entry point goes through it), and it **cannot fire
after unmount** (the effect's cleanup clears the interval).

What it does do is call `notify(...)` on *every* failed attempt, every 15
seconds, and `showAppDialog` (`src/components/AppDialog.tsx:64`) **queues**
rather than replaces:

```ts
export function showAppDialog(req: AppDialogRequest): void {
  if (current) { queue.push(req); return; }
  ...
}
```

So in the branch this fix created — offline *and* the queue write failed (disk
full; the SQLITE_FULL incident of 2026-09-11 is the precedent) — the learner is
handed "Could not save your exam", dismisses it, and the next queued copy appears
immediately, forever, four per minute, faster than they can tap. The only escape
is leaving the screen, which is precisely what the dialog tells them not to do —
and leaving loses the answers, which is the thing the retry exists to prevent.

Fix: notify once when `retryFinishMs` transitions from null, and let subsequent
failures update an inline banner instead. Severity **MAJOR** (rare trigger,
unusable once triggered), confidence high.

One further caveat on the same path: a retry whose `submitFinalExam` is still in
flight when the learner backs out will call `navigation.replace('FinalExamResult',
…)` on an unmounted route. `mountedRef` guards only the `setSubmitting` in the
`finally`. Worth extending it to the success branch.

---

## Detail on the "holds with caveats" rows

### 13 — backgrounding silences audio — say it plainly: `inactive` is too aggressive

`AudioOutputGate.tsx:168`:

```ts
if (state === 'background' || state === 'inactive') {
  if (isAudioOutputEnabled()) panicMuteAudio();
  return;
}
```

`background` is right and the bug it fixes is real. **`inactive` is not.** On iOS
`inactive` fires for events where the user has not left the app at all:

- pulling down **Control Centre** — which in an audio-training app is the single
  most likely thing a user does mid-tone, to reach the hardware volume slider;
- the **app switcher** peek, and Notification Centre;
- an **incoming call** banner or any system alert;
- **a permission dialog** — including the microphone prompt that the SPL meter,
  the tuner and the Harmonic Lab LIVE mode raise. The lab asks for the mic, iOS
  goes `inactive`, the app silences itself and re-locks the gate, and the user
  returns to a dead lab having done nothing but tap "Allow".

And because it is `panicMuteAudio()` and not a pause, it also **re-locks the
gate** — so coming back needs the deliberate 5-second hold again. Silencing on a
transient system overlay is defensible (fail-safe on hearing); re-locking is not,
it is a punishment for opening Control Centre.

Recommendation: `background` → `panicMuteAudio()` as now; `inactive` → stop the
voices *without* `disableAudioOutput()`, or ignore `inactive` entirely and let
`background` do the work. This is a judgement call and belongs to the owner, but
it should be made deliberately rather than inherited from an `||`.

Verified clean on the rest: `enabled` starts `false` every launch, so nothing
fires `panicMuteAudio` during the launch `inactive → active` transition; the
`SIGNED_IN` handler's `disableAudioOutput()` hits an empty player registry at
boot; `disableAudioOutput` has exactly five call sites (mute button, idle timer,
sign-in, foreground-after-idle, panic) and none of them stops anything a user
expects to keep playing; the mic interlock does not call it.

### 14 — `attemptDraft`

Correct on every question asked:

- **Wrong attempt?** No. The key is `ape:attemptDraft:<server attempt_id>`, and
  the restore is guarded by `p.attempt_id` from the freshly-started attempt.
- **Survive a submit?** No. `clearAttemptDraft` is awaited before the navigate on
  both screens.
- **Restored after finalisation?** No — a finalised attempt yields a new
  `attempt_id`, which has no draft.
- **Breaks "no pause or save"?** No. The deadline is still
  `started_at + time_limit`, computed server-side; a relaunch buys nothing, and
  "Leave & wipe" clears the draft explicitly.
- **Wrong account?** No. Both `ape:attemptDraft:*` and `ape:finalExamIntent:*` are
  ordinary `ape:*` keys and are swept by `clearLocalAccountData`.

Caveats:

- **The draft is not cleared on the offline-queued path.** `FinalExamScreen.tsx:186`
  queues, notifies, and goes back without `clearAttemptDraft` or
  `clearExamIntent`. Re-entering that exam resumes the same attempt with the
  answers restored, and the learner can submit a second time; the queued row then
  replays against a finalised attempt and is answered with the frozen result, so
  nothing is *lost* — but the answers also sit on disk after the sitting is over,
  and every abandoned attempt leaves a `ape:attemptDraft:*` key that nothing ever
  collects.
- **`qIdx` is the question just answered, not the next one**, so a restore lands
  on a question whose answer cell renders unselected. Harmless (re-answering
  overwrites the same slot) but it will read as "it lost one".

### 20 — signed-out deep link

`SplashScreen.tsx:93` — `above = signedIn ? pushed.filter(...) : []` — is right.
Signed-in is unchanged (`baseRoute` is the pushed `Main`, everything above it is
kept, so a signed-in deep link still lands on its destination). Signed-out drops
everything above `Auth`, and the URL survives in `pendingLink`, which
`attachLinkCapture` populates for *every* accepted incoming URL (not just
paywall ones) and `AuthScreen.resume()` consumes after any entry — including
**Guest Mode**, so free content is still reachable without an account.

Caveat: it is now one extra step, and the guest route to it (`enterGuest`)
performs `clearLocalAccountData({ total: true })`. Someone whose session merely
expired, who taps a glossary link and picks "Guest Mode" to read it, wipes their
device-local record on the way. Pre-existing behaviour, but this change steers
more people down that path.

### 19 — the newly claimed `labs/` deep links

`isClaimedPath` (`linkPaths.ts:171`) no longer falls through to the
`glossary`/`topics` case, the four `LAB_DEEP_PATHS` regexes are anchored, and all
seven target routes resolve through `MemberGated.*` in `RootNavigator.tsx:503–510`
(pinned by `membershipGating.test.ts`, which passes). A crafted URL reaches a
membership check, not content.

Two soft edges, both cosmetic: `labs/production/x/<bogus>/<bogus>` leaves
`ProductionStageScreen` on "Opening the project…" indefinitely with no error
(`ProductionStageScreen.tsx:97–100`), and `labs/cymatics/module/<bogus>` silently
lands on module 1 (`CymaticsModuleScreen.tsx:58`, `?? CYMATICS_MODULES[0]`).

### 18 — `isAnswered`

The fix is real and nothing else depended on the old meaning. Specifically
checked:

- A row appended by "+ ADD ROW" is `Object.fromEntries(cols.map(c => [c.columnId, '']))`
  (`FieldRow.tsx:405`) — **no `id` field**, so `Object.values(row).some(scalarAnswered)`
  is genuinely false. (Had rows carried a generated id, the fix would have been a
  no-op; they do not.)
- The `na` path is evaluated *before* `isAnswered` in both `readiness.decided`
  and `rules.unansweredRequired`, so justified skips are untouched.
- The packet export reads `report.answeredRequired / totalRequired`, which now
  count honestly — the export gets strictly better, not different.
- Multi-choice arrays are arrays of plain strings and go down `scalarAnswered`.
  `['', '  ']` now reads false; that is correct, and no choice option in the
  schema has an empty `value`.
- The pathway rules (`postprod/logic2.ts` etc.) do not use `isAnswered` at all —
  they read cells directly — so `add-without-erasing` and its siblings are
  unaffected.

### 17 — the production number field

`NumberField` (`FieldRow.tsx:424`) is the standard draft-string pattern and is
correct. One latent edge: `draft` is component state and `FieldRow` is keyed by
`field.fieldId` (`ProductionStageScreen.tsx:138`), so if a stage change is ever
done by `setParams` rather than a push, a field with the same id in the next
stage could inherit the previous draft. Not reachable today.

### 23 — `fetchMyCredentials` throwing

Every caller, including the transitive ones, handles the rejection — no unhandled
rejection:

| Caller | Handling |
|---|---|
| `CredentialWall.tsx:76` → `fetchEarnedCredentialsByType` → `fetchMyCredentials` | `.catch(() => setFailed(true))` |
| `CredentialWall.tsx:77` → `fetchNearestCredential` | `.catch(() => setFailed(true))` |
| `AchievementsHomeScreen.tsx:66` → `fetchAchievementsHub` | `.catch(() => setError(true))` |
| `ProfileScreen.tsx:205` | `.then(setCredentials, () => {})` |
| `MyProfileView.tsx:155` | `.catch(() => [])` |
| `useCredentialCelebration.ts:93` | wrapped in `try/catch` → returns null |

Caveat: `fetchAchievementsHub` runs `Promise.all([fetchTopicAchievements(),
fetchMyCredentials()])`, so a credentials-only failure now blanks the **topic**
strip too, where it used to render. More honest, slightly less useful; flagging
it only so it is a decision rather than a surprise.

### 1 — the Google refund verification

Fails closed, correctly: if neither `googleWasVoided` (voided-purchases feed) nor
`googleTruthAnySku` confirms, `markRefunded` is not called and `member_since` is
not nulled. Two notes:

- Both helpers need `googleAccessToken()`; with the service-account secrets
  unset (per the standing "verify the 7 edge-function secrets before selling"
  item) *every* refund silently fails to revoke. That is the safe direction for
  the user and the wrong one for the business, and it will look like the function
  working.
- `googleWasVoided` can issue up to five sequential paged calls inside the
  webhook. RTDN acks are time-sensitive; a slow feed means Pub/Sub retries.

### 4 — `study/sync` drop rule

Inverting to "drop only on a positive permanent rejection" is right. The cost is
that an *unrecognised* server error now keeps the batch forever and retries it
every loop, and the loop `continue`s rather than stopping — so a persistently
poisoned batch with a message nobody anticipated becomes permanent storage and
permanent traffic. Acceptable against losing study time, but it wants a retry
counter eventually.

---

## What I checked and found nothing wrong with

- `filePlayers.ts` — pause-only is correct, each call individually guarded, a
  handle that throws is dropped from the set rather than retried. (Trivial: the
  `stopped` counter increments even when `pause` is undefined, so the diagnostic
  number can over-report. Not worth a change.)
- `soundSafetyAck` / `celebrationSeen` — `resetSoundSafetyAck()` and
  `resetCelebrationsSeen()` are both imported and called by
  `clearLocalAccountData.ts:176,180`. Wired, not just written.
- `EntitlementProvider.identityOf` — an anonymous session now maps to `null`, so
  accepting the device key no longer trips `clearLocalOnUserChange`. The
  guest-launch wipe (`!uidSeeded && uid === null`) still fires once at boot,
  which is the stated policy, and a real sign-in/sign-out still wipes correctly.
- `AudioPlayer` through the gate — `requestAudioOutput()` resolves true
  immediately when output is already on, denies a stacked second request, and the
  pause branch is untouched.
- `exposureMonitor` — the latch is now held rather than spent; the check is
  `settings.criticalWarnings && !areOverlaysSuppressed()` *before* the flag is
  set, so the warning waits for Low-Light to end instead of being burned.
- `ResultsScreen` — `servedCount` / `passMark` derive from the `questions` array
  QuizScreen actually passes, with the 30-question shape only as the
  restored-navigation fallback.
- `enqueueSubmission` — now `try`/`catch` around the synchronous SQLite write and
  returns a boolean the caller branches on.
- `ape:finalExamQueue` and `ape:finalExamQueue:damaged` are both in
  `clearLocalAccountData`'s `KEEP` set, and only a `{ total: true }` wipe removes
  them.
- Membership gating for the 31 pass-1 routes plus the 7 flagship children —
  `test/membershipGating.test.ts` derives from the navigator and passes.

## Not re-verified

- **31 — `add-without-erasing` on the music pathway.** I read the current rule
  set (`postprod/logic2.ts:679`) and it is coherent, but I did not reconstruct
  the failing pathway state that pass 1 reported, so I cannot say the specific
  bug is gone. Someone should walk it in the app.
- **21 — required-education disclosure** was spot-checked in
  `careerIndex.ts` / `CareerFinderResultsScreen.tsx` / `credentialCopy.ts`, not
  re-audited across all 42 families. The standing rule deserves its own sweep.
