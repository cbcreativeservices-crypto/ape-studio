# Bug-hunt pass 2 — agent H — regression review of the last two days

Scope: the commits from `52829501` (Pre-Production stage acceptance) through
`fb6b3101` (the pass-1 fix commit) and `6d59781c`. Four areas, in the order the
brief set them.

Verified before writing: `npx tsc --noEmit` clean, `npm test` exit 0.

| Area | Verdict |
| --- | --- |
| 1. Pass-1 fixes | **broken** — the audio fix silences file playback permanently; the exam fix replaced one false promise with another |
| 2. Celebration engine | **holds with caveats** — what is wired works; 11 of 18 rows are wired to nothing, and the credential rows would render nameless if they were |
| 3. Sound safety gate | **broken** — the Scenarios player still produces sound without ever asking the gate (pass-1 finding, only half-fixed) |
| 4. Post-Production lab | **holds with caveats** — content and rules are structurally clean; an accepted blocker can never be withdrawn |

---

# Area 1 — the pass-1 fixes

**Verdict: broken.**

Two of the five pass-1 fixes held (the 31 route re-points, the exam queue
quarantine). One introduced a worse bug than it fixed. One left its own promise
unkept. One is only half-applied.

---

## 1.1 BLOCKER — after any mute, file playback is silent for the rest of the screen's life

**Confidence: high.** Traced end to end; pass 1 already proved the key premise.

**Where:**
`src/features/audio/filePlayers.ts:75` (the write)
`src/features/audio/outputCeiling.ts:63-82` (`applyCeiling`, the only reader)
`src/features/ear/earPlayer.ts:133` vs `:135` (reuse vs create)
`src/features/lab/LabAudioPlayer.ts:80-87`
`src/components/AudioPlayer.tsx:65-68`

**What the user does:** starts an ear-training clip (or a lab clip, or a
Scenarios clip). Shakes the phone to mute — or leaves the app 20 minutes and
comes back — or toggles audio off and on in Profile. Holds 5 s to re-enable
audio. Presses play again.

**What happens:** the transport runs, the progress bar moves, the pilot lamp
lights, and nothing comes out. Silently, with no error, for as long as that
screen stays mounted. Leaving the module and re-entering it fixes it, which
makes the report "sometimes my phone stops making sound" and almost impossible
to file.

**Why.** `stopAllFilePlayers()` does not only pause — it writes `p.volume = 0`:

```ts
if (typeof p.volume === 'number') p.volume = 0;
p.pause?.();
```

Nothing ever writes `volume` back. The only writer is `applyCeiling`, and every
one of the three player owners calls it on the **create** branch only:

* `earPlayer.load()` — `if (existing) existing.replace({ uri }); else { const p = createAudioPlayer(...); applyCeiling(p); }`
* `LabAudioPlayer.play()` — `if (this.player) this.player.replace({ uri: url }); else { ... applyCeiling(p); }`
* `AudioPlayer.tsx` — `useEffect(() => { applyCeiling(player); ... }, [player])`; the hook's player identity does not change, so the effect does not re-run.

Pass 1 established the missing half of this itself, in "The output ceiling is
not re-applied when a player is reused": it read the expo-audio sources and
confirmed `volume` lives on the shared `AVPlayer` / ExoPlayer instance and
**survives `replace()`**. That was filed as *minor* because at the time the only
value that could survive was the correct one. The pass-1 audio fix then made
`0` a value the safety path writes, which converts that minor note into a
silent, sticky mute.

The triggers are not exotic. `disableAudioOutput()` is the idle auto-mute, the
sign-in re-mute, and the Profile OFF toggle (`AudioOutputRow.tsx:53`);
`panicMuteAudio()` is the shake gesture the Sound Safety Warning advertises. A
learner who uses the advertised emergency mute is punished with a dead ear-
training module.

**What should happen:** re-enabling output should restore the ceiling.

**Fix (smallest correct change):** stop making `stopAllFilePlayers` destructive,
or make the ceiling re-assert itself. Either:

* have `stopAllFilePlayers` remember and not zero `volume` (pause alone is the
  contract the registry's own doc describes), or
* call `applyCeiling` on the **reuse** branches too — `earPlayer.ts:133`,
  `LabAudioPlayer.ts:81` — and in `AudioPlayer.tsx` subscribe to the output
  store so the ceiling is re-applied when `enabled` goes true again. The third
  player has no reuse branch to hang it on, so it needs the subscription.

A test that reproduces it in one line: `applyCeiling(p); stopAllFilePlayers();`
then assert `p.volume === PLAYBACK_CEILING` after whatever the re-enable path
is. `test/filePlayerSafety.test.ts` currently asserts the zeroing and stops
there.

---

## 1.2 BLOCKER — "Could not save your exam" is a dead end, and the instruction it gives is false

**Confidence: high.** No retry path exists; I looked for one.

**Where:** `src/screens/exam/FinalExamScreen.tsx:163-172`, with `:121-122`
(`if (submitted.current) return;` / `submitted.current = true`) and `:341`.

**What the user does:** finishes the Final Exam offline on a device whose
storage write fails (full disk, or a queue `readQueue` could not parse — see
1.3). The submit throws, the queue write returns false, and they get:

> "You are offline and this device could not store your answers. Stay on this
> screen and keep the app open — reconnect and it will submit. Do not close the
> app."

**What happens:** they stay on the screen, reconnect, and nothing submits. Ever.
`submitted.current` is left `true` deliberately ("Do NOT release the latch"), so
every remaining entry point into `doSubmit` — the countdown at `:201`, the
focus-void handler at `:227`, `advance()` at `:242` — returns immediately at
`:121`. There is no connectivity listener, no AppState-resume retry, and no
"try again" control in that state. `setSubmitting(false)` runs in the `finally`,
so the exam UI comes back looking alive while every control is inert.

Worse, the Android hardware-back handler at `:341` reads
`if (submitted.current) return false;` — so back is *not* intercepted in exactly
this state and pops the screen, taking the only copy of the answers with it.

**What should happen:** either a real retry (a button, or a NetInfo/AppState
listener that clears the latch and re-calls `doSubmit`), or honest copy that
does not instruct the learner to wait for something that cannot happen.

**Note on the direction of the fix:** the pass-1 change was right that the old
unconditional "your exam is saved" was a lie. It replaced it with a different
lie. The minimum honest version is a visible RETRY button that clears
`submitted.current` and re-runs the submit, plus the back-handler covering this
state so the answers are not one gesture from gone.

---

## 1.3 MAJOR — one transient storage read failure disables exam queueing for the whole session

**Confidence: high.**

**Where:** `src/features/finalExam/api.ts:244`, `:259`, `:266`, `:276-281`.

`queueReadable` is set `false` on a read failure and **never set back to true**.
Every subsequent `writeQueue` refuses:

```ts
if (!queueReadable) { console.warn('…refusing to overwrite…'); return false; }
```

So a single transient `AsyncStorage.getItem` rejection at any point in the
session — including one that has nothing to do with the exam — means every
later `enqueueExamSubmission` returns false, which routes straight into the dead
end in 1.2. It also means `replayExamSubmissions` cannot write back the
survivors, so a successfully-submitted row stays queued and is replayed on every
Dashboard focus forever (harmless server-side, since the attempt is finalized and
returns its frozen payload, but it never drains).

**Fix:** reset `queueReadable = true` on the next successful `readQueue`, or
scope the flag to a single read/write pair rather than to the module.

Related, same file: `replayExamSubmissions` keeps any row whose error matches
neither pattern, with no attempt counter and no age cap. That is the right
default (the comment argues it well), but a row that fails permanently with an
unrecognised message — a 500, say — is retried on every replay for the life of
the install, and nothing ever tells the user. Consider a retry count that
surfaces the row rather than dropping it.

---

## 1.4 BLOCKER — signing out deletes the offline exam queue the pass-1 fix was written to protect

**Confidence: high.** Traced the key through the sweep.

**Where:** `src/features/finalExam/api.ts:221` (`const QUEUE_KEY = 'ape:finalExamQueue'`),
`src/features/account/clearLocalAccountData.ts:91-95`,
`src/features/account/accountLocalSync.ts:45`.

**What the user does:** finishes the Final Exam offline. Gets the message the
pass-1 fix now only shows when the write really landed — "Your exam is saved and
will be submitted automatically when you reconnect. Your finish time is
preserved." Signs out, or the session drops to guest, before reconnecting.

**What happens:** `syncLocalToIdentity` sees the identity change and calls
`clearLocalAccountData()`, whose sweep removes every `ape:*` key that is not in
`KEEP` and is not an onboarding flag. `ape:finalExamQueue` is neither. The graded
capstone — the one thing in the app that stands between a learner and a
credential — is deleted, having never reached the server, with no warning and no
trace.

**Why I am confident this is an oversight rather than a decision:** the same
function handles the quiz and study queues *explicitly*, by name, with a written
rationale (`clearQueuedBatches()` / `clearQueuedSubmissions()` at `:145-147`,
"queued study batches / quiz submissions would replay under the NEXT user's
session"). The final exam queue is not mentioned anywhere in the file; it is
caught by the generic prefix rule. And the rationale given for dropping the quiz
queue — "their local progress mirror is already wiped on switch, so dropping the
queue is consistent" — does not transfer: a quiz can be retaken, a final exam
attempt is a one-shot capstone with a lockout.

It also directly contradicts the argument the pass-1 fix makes for itself in
`api.ts:226-233`: *"one malformed byte permanently destroyed a graded final exam
that had not reached the server yet … nothing that might still be recoverable is
deleted by a parse error."* The parse error is now handled; a sign-out still
destroys it outright.

**What should happen:** the queued row carries `awardId`/`attemptId` but no user
id, so it cannot simply be kept across an identity change. The minimum is to
refuse the sign-out (or warn hard) while the queue is non-empty, the same way the
exam screen now refuses to lie about a failed write. Better: stamp the row with
the user id at enqueue, keep it across the wipe, and replay it only for the
matching account.

---

## 1.5 — the 31 re-pointed routes: verified, and I found one thing the test cannot see

**Verdict on the re-point itself: holds.** I recomputed the membership set
mechanically against the shipping catalog, using `computeLabRouteMembership`
(the function the app itself uses, which is *not* what the test uses) and diffed
it against the registrations parsed out of `RootNavigator.tsx`:

* 47 routes are members-only per `labMembership.ts`; **0 are ungated**.
* No lost params: `withMembershipPreview` renders `<Screen {...props} />`, so
  `route`/`navigation` pass through untouched.
* No wrong component: every `MemberGated.X = withMembershipPreview(Gated.X)`
  composes membership *outside* the orientation wrapper, which is the correct
  order — a non-member never mounts the orientation screen for a paid lab.
* No double-wrap: nothing is wrapped in `withMembershipPreview` twice.
* One entry is inert: `MemberGated.ProductionLab` is keyed on a route name
  (`ProductionLab`) that is not in the catalog, so the HOC no-ops **for that
  route**. It does not matter, because the two routes that carry the labs —
  `PreProdLab` and `PostProdLab` — resolve as members-only and are gated. Worth
  tidying so the map does not read as protection it is not providing.

### MAJOR (latent) — seven deep-linkable child routes of paid labs are still ungated, and the new test cannot see them

**Confidence: high on the fact, medium on the exploitability today.**

**Where:** `src/navigation/RootNavigator.tsx:195-196`, `:480-481` and the
Cymatics rows at `:483-486`; `src/navigation/linking.ts:83-90`;
`test/membershipGating.test.ts:55-76`.

These seven routes have published deep-link paths and are registered with
`Gated.*` or a bare screen:

| Route | Path | Registered as |
| --- | --- | --- |
| `ProductionStage` | `labs/production/:lab/:projectId/:stageId` | `Gated.ProductionStage` (= the bare screen) |
| `ProductionActivity` | `labs/production/:lab/exercise/:activityId/:pathway` | `Gated.ProductionActivity` (= the bare screen) |
| `CymaticsPlateStudio` | `labs/cymatics/plate` | `Gated.*` (orientation only) |
| `CymaticsLiquidStudio` | `labs/cymatics/liquid` | `Gated.*` |
| `CymaticsMembraneStudio` | `labs/cymatics/membrane` | `Gated.*` |
| `CymaticsGallery` | `labs/cymatics/gallery` | `Gated.*` |
| `CymaticsModule` | `labs/cymatics/module/:id` | `Gated.*` |

Their parents (`PreProdLab`, `PostProdLab`, `CymaticsLab`) are all members-only
and all gated. The children are not in `labCatalog`, so `isMemberOnlyLabRoute`
returns false and `withMembershipPreview` would no-op even if it were applied.
`RootNavigator.tsx:212-213` states the invariant this breaks in as many words:
*"any lab given a deep-link path in linkPaths.ts that is members-only per
labCatalog MUST be wrapped here too."*

**Why it does not bite today, and why that is fragile:** `isClaimedPath`
(`src/navigation/linkPaths.ts:141-144`) returns false for any `labs/…` path with
more than two segments, so every one of these URLs is currently declined at the
door. `pass1-labs-content.md` files that rejection as a bug to be fixed
("Every lab deep link with more than two path segments silently does nothing").
**Fixing that finding without gating these seven routes hands a non-member the
two flagship paid labs and the Cymatics studios, fully live.** The two findings
have to land together.

I also checked the commit message's third vector — "any restored navigation
state." There is no navigation-state persistence in this app (`grep` for
`initialState` / `onStateChange` returns nothing), so that vector does not
exist. The claim is harmless but it is not true.

**Why the new test cannot catch it:** `memberOnlyRoutes()` in
`test/membershipGating.test.ts` derives the set from catalog leaves only. These
seven are not leaves. The test's own framing ("this cannot be maintained by eye")
is right, and its blind spot is exactly the shape of route the pass-1 fix did not
cover. A second assertion — *every route with a deep-link path whose parent lab
is members-only must be wrapped* — would close it.

Minor divergence worth noting while the file is open: the test computes
membership with OR across catalog occurrences, `labMembership.ts` uses AND, and
the test ignores `extraLabs` while `labMembership` includes them. Today no
category has `extraLabs`, so the two agree; the day one does, the test will stop
matching the shipping rule.

---

## 1.6 MINOR — the quiz percentage and the results fraction can disagree

**Confidence: medium.** I could not prove a short quiz is reachable.

**Where:** `src/screens/quiz/QuizScreen.tsx:173-176` vs
`src/screens/results/ResultsScreen.tsx:133-134`.

The celebration percentage is computed against `payload.questions.length`; the
Results screen renders `{result.score} / {QUIZ_SIZE}` against the **constant**
30. If a topic ever serves fewer than 30 questions, a 19/20 pass reads "FINAL
QUIZ: 95%" on the celebration and "19 / 30" on the results, and `perfect =
score >= total` would award "PERFECT SCORE! 100% CORRECT" for 20 of 20 while
Results shows 20/30.

The server has a `pool_too_small` start error, which suggests it enforces 30, and
`QuizScreen`'s own header comment says "the counter renders payload length" —
which implies somebody expected the two to be able to differ. **What would settle
it:** whether `start_quiz` can return fewer than `QUIZ_SIZE` rows. If it cannot,
use `QUIZ_SIZE` in both places for consistency; if it can, `ResultsScreen` is the
one that is wrong.

The pass-1 fix itself (count → percentage, and `perfect` compared against the
count rather than 100) is **correct** and the reasoning in the comment is sound.

---

# Area 2 — the celebration engine

**Verdict: holds with caveats.**

What is wired works. `formFor`, `fill`, the queue rules, the seen record and the
action switch are all sound, and the Low-Light contract is kept properly. The
caveats are about how much of the engine is connected to anything.

### Checks that passed

* **Every id the app navigates to exists.** Only two call sites raise
  celebrations: `QuizScreen.tsx:176` (`'perfect-score'` | `'topic-complete'`) and
  `useMethodCelebration.ts:47-52` (the four method ids plus
  `'final-quiz-unlocked'`). All seven are real `CELEBRATIONS` keys.
* **Every action kind maps to a real destination.** All nine members of
  `CelebrationActionKind` are handled in `CelebrationScreen.onAction`
  (`:85-149`), and the Dashboard's inline handler treats every kind as a dismiss
  plus a scroll for `start-quiz`, which is the honest behaviour on that screen.
* **Low-Light is correct, and it is correct in the right place.**
  `formFor(tier, suppressed)` returns `'notice'` for every tier when suppressed
  (`types.ts:140-143`), so no `Modal` is mounted at all; the haptic effect
  returns early on `suppressed` *and* on `encouragement`
  (`Celebration.tsx:59-63`). The suppression is read once, inside the shared
  component, so no call site can forget it. This is the best-implemented part of
  the feature.
* **Nothing throws on a failed interpolation.** `fill` replaces an absent value
  with `''`, and `CelebrationBody` renders `subject`, `stat` and each body
  paragraph only when the filled string is non-empty (`:126-139`), so a missing
  value costs a line rather than showing `{topic_name}`.
* **Two cannot show at once, and none is lost.** `pick()` returns at most one
  event and marks it seen only on dismiss, so the next one is offered on the
  following render.
* **`celebrationSeen` cannot mark something that was not shown** on the live
  path: `pick()` returns null until `hasLoaded()`, and `dismiss` is only
  reachable from a rendered celebration.

## 2.1 MAJOR — eleven of the eighteen catalog rows are wired to nothing, including every credential

**Confidence: high** (grep across the whole of `src/`).

`credentialCelebration()` and `resolveCelebrations()` have **no callers outside
the celebration folder and its tests**. `catalog.ts:257-259` refers to "`raise()`
in CelebrationHost" — there is no `CelebrationHost` in the repo.

Unreachable today: `quiz-not-passed`, `score-improved`, `daily-practice`,
`lab-complete`, `subject-complete`, `requirement-complete`, `first-certificate`,
`certificate-earned`, `first-program`, `program-complete`,
`multiple-credentials`.

The consequence a paying user sees: **earning a certificate or completing a
professional programme produces no celebration at all** — the strongest tier in
the design, the one the owner's copy calls "the strongest, and the rarest",
never fires. Finishing a lab and finishing a subject are silent too. This is not
a regression (nothing celebrated credentials before), but the engine shipped
described as complete and it is roughly 40% connected.

## 2.2 MAJOR (latent) — the credential celebrations would render with no name

**Confidence: high** — it is visible in the data.

**Where:** `src/features/celebration/celebrationQueue.ts:85-91`.

```ts
if (input.programs === 1) {
  return { id: input.priorPrograms === 0 ? 'first-program' : 'program-complete', values: {} };
}
return { id: input.priorCertificates === 0 ? 'first-certificate' : 'certificate-earned', values: {} };
```

`values: {}`. Those four definitions use `{certificate_name}` / `{program_name}`
as their **title** — the only line that identifies the credential. `fill` turns a
missing value into `''`, and `CelebrationBody` renders `title` unconditionally,
so the screen would show a kicker, an empty headline and a paragraph about "your
new credential" that never says which. Whoever wires 2.1 must pass the name
through; the function signature currently has nowhere to put it.

## 2.3 MINOR — SHARE silently throws the user back to the Study dashboard

**Where:** `src/screens/results/CelebrationScreen.tsx:135-146`.

`share`, `view-summary` and `view-requirement` fall through to `dismiss`, which
is `navigation.reset(...)` to Main → Study → Dashboard. The comment says this is
"the honest behaviour: the button does what it can rather than dead-ending, and
nothing here pretends to have shared something." Tapping SHARE and being reset to
a different tab does not read as honest to a user; it reads as a crash that
landed somewhere. Unreachable today (2.1), but if the credential tier is wired
before share exists, either hide the unimplemented actions or have them dismiss
in place rather than reset the stack.

Same note for `lab-complete`'s `DONE` — dismissing it would eject the user from
the lab to the Study tab.

## 2.4 MINOR — on the update that ships this, every finished topic gets congratulated again

**Confidence: high.**

`celebrationSeen` starts empty for everyone (it is a new AsyncStorage key), and
`useMethodCelebration.pick()` offers a celebration for any method at 100% on the
**currently fronted** topic. A learner with forty completed topics will be
congratulated for flashcards they finished months ago, once per topic, as they
jog through the rack. There is no backfill that marks pre-existing completions as
seen. Consider seeding the set as "seen" for topics already at 100% on first
load.

## 2.5 MINOR — `markSeen` can make `hasLoaded()` lie, and can overwrite the stored record

**Where:** `src/features/celebration/celebrationSeen.ts:86-97` with `:38-53`.

`markSeen` does `const s = seen ?? new Set(); seen = s;` — so calling it before
`loadCelebrationsSeen()` resolves (a) makes `hasLoaded()` return true against an
empty set, which is exactly the state the file's own doc warns about, and (b)
writes a one-element array over the stored history. The in-flight load then
assigns `seen = <loaded set>` and the new mark is dropped in memory.

Not reachable today — `pick()` gates on `hasLoaded()` and `dismiss` is only
reachable after a `pick` — so this is a trap for the next caller, not a live bug.
Guard it: `if (!hasLoaded()) return;`, or queue the mark until the load lands.

## 2.6 — the seen record is not scoped to a user: FIXED while this pass was running

Keys are `${topicId}:${celebrationId}` with no account in them, so on a shared
device the second user would inherit the first user's "already celebrated" set.
I filed this, then `celebrationSeen.ts` changed on disk mid-pass: it now exports
`resetCelebrationsSeen()`, and `clearLocalAccountData.ts:160` calls it from
`resetAllLocalStores()`. The persisted key (`ape:celebrationsSeen:v1`) was
already swept by the `ape:*` sweep. **Re-verified: closed.** Recorded here only
so the next pass does not re-open it.

The same wipe now also calls `resetSoundSafetyAck()` (`:156`), which closes the
matching hole on the safety gate — the stored acknowledgment key was swept but
the module-level mirror was not, so the next person on the phone would have got
sound with no warning. **Re-verified: closed.**

## 2.7 MINOR — two hardening notes

* `celebration(id)` is `CELEBRATIONS[id]` with no fallback
  (`catalog.ts:292-294`). `CelebrationScreen` passes the result straight into
  `Celebration`, which reads `def.tier` — an unknown id is a render-time
  TypeError, not a graceful miss. Unreachable today only because the single
  navigator (`QuizScreen.tsx:176`) uses `navigation as any` with literal ids and
  there is no deep link to the route. One `?? FALLBACK` closes it.
* In the `notice` form the body is not inside a `ScrollView` (the `ScrollView` is
  only on the modal branch, `Celebration.tsx:87`). On the full-screen
  `CelebrationScreen` under Low-Light, a long celebration on a small phone can
  overflow with no way to scroll.

---

# Area 3 — the sound safety gate

**Verdict: broken.** One path produces sound without the gate, and it is the
same path pass 1 reported.

## 3.1 BLOCKER — Scenarios audio plays without the gate, without the safety acknowledgment, and cannot be shake-muted

**Confidence: high.** This is a *verification* finding: pass 1 filed it
(`pass1-audio-safety.md:50-77`) and the pass-1 fix applied only half of the
recommended change.

**Where:** `src/components/AudioPlayer.tsx:76-86` (`toggle`), rendered at
`src/screens/study/ScenariosScreen.tsx:520`.

The fix commit added `applyCeiling(player)` and `unregisterFilePlayer` at
`:65-68`, which closes the level and the registry halves. It did **not** add the
gate. `toggle()` still calls `player.play()` directly, and neither
`AudioPlayer.tsx` nor `ScenariosScreen.tsx` contains `requestAudioOutput` — I
checked every occurrence of that symbol in `src/`.

**What the user does:** opens a scenario with audio media and presses ▶.

**What happens:** sound is produced. On a fresh install this happens **before the
Sound Safety Warning has ever been shown** — the once-ever acknowledgment the
app records as evidence of consent to a hearing-damage warning is skipped
entirely, because it is only raised from inside `requestAudioOutput`
(`AudioOutputGate.tsx:117-122`).

**Why it is a safety-promise failure, not merely a gating gap:** the warning
text the app asks people to accept says, verbatim
(`src/features/audio/soundSafetyText.ts:54`):

> "Sound is off every time you open the app. Nothing plays until you turn it on
> deliberately."

and at `:55`, "Shake the phone at any time to mute instantly." The first is
false on this path. The second is now *partly* true — the pass-1 registration
means a shake will pause it — but `ShakeToMute` tears down its accelerometer
when output is disabled, and this path never enables output, so the gesture is
not listening in the first place.

**Fix:** the same one pass 1 gave. Hold the gate result in state in
`LivePlayer`, make `toggle` `async`, and `if (!(await requestAudioOutput())) return;`
before `player.play()`.

### The rest of the gate: audited and clean

Every other way to produce sound goes through `requestAudioOutput()`:

* **Player creation sites — exactly three in the repo.** `grep` for
  `createAudioPlayer|useAudioPlayer|expo-av|expo-video|Audio.Sound|playAsync`
  across `src/` returns `earPlayer.ts`, `LabAudioPlayer.ts` and
  `AudioPlayer.tsx`. The first two are gated by their screens
  (`EarModuleScreen.tsx:243`, `useLabAudio.ts:61`).
* **`enableAudioOutput()` has exactly one caller** — the 5-second hold at
  `AudioOutputGate.tsx:294`. The Profile toggle (`AudioOutputRow.tsx:88`) was
  the second one and now routes through `requestAudioOutput()`; commit
  `41efaded` holds.
* **Text-to-speech**: `SpeakButton.tsx:59` gates before `Speech.speak` at `:66`.
  The other two `expo-speech` importers are `panicMute.ts` (stop only) and
  `exposureMonitor.ts` (the dose announcement, which is the safety system
  speaking).
* **No import cycle** from the pass-1 wiring: `outputCeiling → filePlayers`,
  `audioOutputStore → filePlayers`, `panicMute → {audioOutputStore, filePlayers}`;
  `filePlayers` imports nothing.
* **`disableAudioOutput()` at boot is harmless** — the registry is empty, and
  the store starts disabled without anyone calling it. The sign-in re-mute is
  correctly narrowed to real accounts (`AudioOutputGate.tsx:147`), so the
  anonymous glossary session does not silence a lab.

The only thing `applyCeiling`-as-registrar gets wrong is the *un*registration
side, and only for `AudioPlayer.tsx` — expo-audio owns that instance's lifetime,
so the effect correctly unregisters without removing. `earPlayer` and
`LabAudioPlayer` both unregister before `remove()`. No leaked handles found, and
`stopAllFilePlayers` drops a throwing handle from the set, so a leak would be
self-healing.

---

# Area 4 — the Post-Production lab

**Verdict: holds with caveats.** I ran the whole content set through the engine
rather than reading it, and the five failure modes the brief named are — for
Post-Production — almost entirely absent. The caveats are in the shared engine
and the screens, not in the content.

## What I checked, mechanically, and what came back clean

I loaded `LABS` under `node` and, for each of the three open pathways
(`music`, `podcast`, `live`):

| Check | postprod | preprod |
| --- | --- | --- |
| Rules whose `watches` name a field that does not exist on that pathway | **0** | 5 (below) |
| Rule logic that *reads* a `stage.field` absent on that pathway | **0** | 5 |
| `stage.field` referenced by logic that exists nowhere at all | **0** | 0 |
| Blocker-severity rules with no logic (would fire on any blank field) | **0** | 0 |
| Blocker rules that fire on a wholly empty project | **0** | 0 |
| `needsLogic` rules with no implementation (`missingLogic`) | **0** | 0 |
| Rule logic that throws on an empty or a fully-filled project | **0** | 0 |
| Choice/status literals compared in logic that are not an option of that field | **0** | 0 |
| Table-cell literals compared in logic that are not an option of that column | **0** | 0 |
| Column ids used in logic that no table field defines | **0** | 0 |
| Activity seed keys with no field on a pathway the exercise is offered on | **0** | 0 |
| Activity criteria reading a field absent on a pathway it is offered on | **0** | 0 |
| Activities with no registered criteria | **0** | 0 |
| Activities that already pass at their seed state | **0** | 0 |
| Rule id collisions between the two labs (shared `RULE_LOGIC` map) | **0** | — |
| Activity id collisions between the two labs (shared `ACTIVITY_CHECKS` map) | **0** | — |

Counts confirmed: postprod is 8 stages / 187 fields / 135 rules / 8 activities,
exactly as briefed. `AccuracyNote variant="practice"` is present on all three
production screens.

**"I found nothing" is the result for the Post-Production content itself.** The
`onlyFor` mechanism on `ActivityDef` does its job — the live-only stage 3
exercise is offered on live only, and nothing else seeds into a field its
pathway does not render. The pass-1 `add-without-erasing` fix holds.

I could not run a meaningful "rule that can never fire" sweep: a fuzzer over
random field values leaves 149 rules unfired across both labs, but that is my
generator failing to produce the specific table-row combinations the rules look
for, not evidence about the rules. The literal-vs-option cross-checks above are
the reliable version of that question and they are clean. **What would settle the
remainder:** a per-rule fixture in the test suite that constructs the state each
rule claims to detect and asserts it fires — 135 small cases, mechanical to write
from `logicIntent`.

## 4.1 MAJOR — an accepted blocker can never be withdrawn, and silently suppresses the same blocker forever

**Confidence: medium-high.** The store method exists; no screen calls it.

**Where:** `src/features/production/projectStore.ts:246-251` (`clearCondition`),
`src/features/production/rules.ts:299`,
`src/screens/lab/production/ProductionLabScreen.tsx:93-99`.

`acceptCondition` is wired to `AcceptConditionSheet`. `clearCondition` has **no
caller anywhere in `src/screens/`**. And `evaluateStage` matches an acceptance to
a finding on `ruleId` alone:

```ts
const accepted = project.acceptedConditions.find((c) => c.ruleId === rule.ruleId);
```

with `readiness.ts:109` filtering `severity === 'blocker' && !isAccepted(f)`.

So: a user accepts a delivery blocker ("files are going out without approval")
with a name and a reason, later fixes it, then later still changes an answer that
re-raises the *same rule for a different reason* — and it is suppressed, with the
old acceptance and the old reason attached. The readiness meter reports a
project that is ready when it is not, which is the one thing `readiness.ts`'s own
doc says must never happen ("a numerical score can NEVER outrank an unresolved
safety, legal, recording or delivery blocker").

Mitigating: the acceptance prints in the packet, so it is visible to a reader of
the document. That is why this is MAJOR and not BLOCKER.

**Fix:** expose `clearCondition` on the finding card (a "withdraw this
acceptance" control), and/or invalidate an acceptance whose `at` predates the
last change to a field the rule watches — the data for both is already on the
project (`acceptedConditions[].at`, `updatedAt`).

## 4.2 — state bleeding between the two labs: checked, and it does not happen

The two labs share three mutable globals — `RULE_LOGIC`, `ACTIVITY_CHECKS` and
the `deliver` stage id — and none of them bleeds:

* Rule ids and activity ids are disjoint across the labs (verified above), so
  neither registry can have one lab's implementation overwrite the other's.
* Projects are stored under separate keys (`projectStore.ts:25-27`:
  `ape:production:preprod:v1` / `ape:production:postprod:v1`), and every screen
  passes `lab` into `load`/`upsert`/`remove`.
* `deliver` is a stage id in both labs, but values are keyed
  `${stageId}.${fieldId}` *within a project*, and a project belongs to one lab,
  so the collision is inert.
* `seedActivityProject(lab, …)` and `stageForActivity(lab, …)` are both
  lab-parameterised.

What does bleed is **between pathways, within one lab** —
`ProductionActivityScreen.load()` still finds an existing exercise project by
`scenarioId` alone, ignoring `pathway`. That is `pass1-labs-content.md`'s second
finding and it is **unfixed** (the pass-1 commit touched only `FieldRow.tsx` and
`stage5.data.ts` in this feature). Flagging it here only because the brief asked
about state bleeding and this is the live instance of it.

## 4.3 MINOR — the new table-cell editor has two rough edges

`FieldRow.tsx`'s new `Cell` component (the +127 lines in the pass-1 commit) is a
genuinely good fix — 74 `choice` columns across the two labs were bare text
boxes, which defeated every rule that compares an exact machine value. Two
things left:

* A `duration` column gets the default text keyboard; only `number` and
  `currency` get `keyboardType="numeric"` (`:365`). `cellNum` will still parse
  the digits, so this is ergonomics, not correctness.
* The multiChoice cell writes `', '`-joined text and the comment says that is
  "exactly what the logic's `cellMany()` reads back". True for Post-Production —
  `cellMany` splits on `/[,;|]/` (`postprod/logic.ts:396-405`). Pre-Production
  has no `cellMany`; its two multiChoice columns (`define.references.ref_aspect`,
  `technical.mic_choices.mc_reason`) are read with an `Array.isArray ? … : cell(…)`
  emptiness test (`preprod/logic.ts:141-142`, `preprod/logic2.ts:132-134`), which
  happens to be correct for both shapes. It is correct by luck rather than by
  contract; hoisting `cellMany` into `rules.ts` would make it correct by
  construction.

## 4.4 MINOR — the shared engine points "take me there" at fields that are not on the page (Pre-Production only)

Five Pre-Production rules watch or read fields their pathway does not render:

```
people/people-overload         → people.monitor_engineer, people.system_tech,
                                 people.stage_manager      (music, podcast)
people/people-hazards-unknown  → people.rigging_required   (music, podcast)
technical/technical-material-not-final → technical.stage_plot (podcast)
readiness/readiness-no-dress-rehearsal → people.remote_participants (live)
```

All are `attention` with logic, so the reads return `undefined` and the rules
stay quiet — but `evaluateStage` copies `rule.watches` into `Finding.fieldIds`
unfiltered (`rules.ts:303-305`), so if one of these ever does fire, the
"take me there" target does not exist on that pathway. Post-Production has none
of these. Fix in one place: filter `fieldIds` against the *resolved* stage's
fields rather than the authored `watches`.

---

# Things I checked and found nothing wrong with

Recording these so the next pass does not re-walk them.

* **The output ceiling arithmetic.** `PLAYBACK_CEILING = 10 ** (-12/20)`,
  `playbackVolume` clamps `[0,1]`, floors negatives to 0 (no phase inversion),
  and falls back to the ceiling on NaN. Correct.
* **`soundSafetyAck`.** Corruption-safe in the house idiom, the record carries
  the verbatim text rather than a boolean, `recordSoundSafetyAck` returns false
  on a failed write and `AudioOutputGate.tsx:184-187` correctly refuses to enable
  sound on that false. The device-local limitation is documented as a known gap.
* **`soundSafetyFullText()`** is assembled from the same constants the screen
  renders, so the stored record cannot describe a screen the user did not see.
* **The celebration queue's two rules** (`multiple-credentials` suppresses the
  singles; one screen, strongest first, ties keep raise order) are correctly
  implemented and correctly tested. `multiple-credentials` is deliberately not in
  `CREDENTIAL_IDS`, which is right — it is the suppressor.
* **`TrophyScreen`** survives as the gallery viewer and keeps `'quiz_win'` in its
  entry-source union for saved navigation state. The hand-off is clean.
* **The `Celebration` route** is registered (`RootNavigator.tsx:361`) with
  `gestureEnabled: false`.
* **`LabAudioPlayer.ts` contains a literal NUL byte** at offset 1677 — it is a
  deliberate separator inside a template literal in `keyOf()`, which is why git
  reports the file as binary and `grep` skips it. Valid JavaScript, harmless, but
  it means the file is invisible to every `grep`/`rg` sweep of this repo,
  including the ones bug-hunt passes run. Worth replacing with a backslash-u
  escape sequence, or a printable separator such as `::`, so the file can be
  searched. (Writing this paragraph put a literal NUL into this report, which is
  how easily it spreads.)
* **`readiness.ts`'s rule 1** (an unresolved blocker outranks any score) is
  implemented as written.
* **The production screens all carry `<AccuracyNote/>`.**
