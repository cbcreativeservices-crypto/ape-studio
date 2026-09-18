# Bug hunt — Pass 2, agent D: honesty, and accessibility

**Date:** 2026-09-18 · **Branch:** audio-tools-engine · **HEAD:** 6d59781c
**Axis:** what the app SAYS versus what it DOES, and whether it can be used by everyone.
**Method:** source reading only. No dev server, no build, no `eas` command, no git write.
No file was edited except this one.

Honesty findings first, then accessibility, each most-severe-first. Coverage at the end.

---
---

# PART 1 — HONESTY

---

## "Reconnect and it will submit" — nothing in the Final Exam screen can ever submit again

**Severity:** blocker
**Where:** `src/screens/exam/FinalExamScreen.tsx:168` (the copy), `:121–122` (the latch),
`:340–343` (the back handler)

**The exact string shown to the learner:**

> "You are offline and this device could not store your answers. Stay on this screen and keep
> the app open — reconnect and it will submit. Do not close the app."

**What the user does:** finishes a Final Exam (the graded capstone that awards the credential)
while offline, on a device where the queue write fails — storage full, or a queue that could not
be read and so is refused rather than clobbered (`enqueueExamSubmission` → `writeQueue`,
`src/features/finalExam/api.ts:275–290`, returns `false`).

**What happens:** they read the dialog, obey it, and sit on the screen. Nothing submits. Ever.

**Why I believe it:** the code path, traced end to end.

- `doSubmit` sets `submitted.current = true` at line 122 and — on this branch alone,
  deliberately — never releases it (the comment at `:164–166` says so: *"Do NOT release the
  latch and do NOT leave the screen"*). Every later call to `doSubmit` early-returns at line 121.
- There is no connectivity listener anywhere in the file. `grep` for `NetInfo` returns nothing;
  the only `AppState.addEventListener` (`:210`) is the focus-void watchdog, and its non-first
  branch calls `doSubmit()` — which early-returns.
- The countdown effect (`:196–205`) calls `clearInterval(t)` immediately before its own
  `doSubmit`, so on the timeout path the clock is dead too.
- Tapping the answer/Finish button again reaches `advance()` → `:242` → `doSubmit()` →
  early-return. The button looks alive and does nothing.
- `BackHandler` at `:341` reads `if (submitted.current) return false;` — so once the latch is
  set, hardware BACK is *not* intercepted, the screen pops with no confirm, and the answers in
  `answers.current` go with it.

**What should happen:** either the copy tells the truth ("this device could not save your exam;
your answers are only in memory and will be lost if you leave"), or the screen grows a manual
RETRY that releases the latch. As written the app tells a learner their capstone is recoverable
when it is not, which is the failure mode pass 1 fixed one line above (`:157–160`) and then
recreated in the `else`.

**Confidence:** high on the code path. Moderate on how often the queue write fails — it needs a
storage failure or an unreadable queue, which is rare but is exactly the case this branch exists
to handle.

---

## The quiz twin still promises the attempt is queued without checking — and can lose it with no dialog at all

**Severity:** blocker
**Where:** `src/screens/quiz/QuizScreen.tsx:199` and `:205–212`;
`src/features/quiz/api.ts:201–219`; `src/features/quiz/submissionQueueStorage.native.ts:32`

**The exact string:**

> "Offline — please reconnect to submit."
> (web: "…Keep this tab open until you reconnect; your finished attempt is held in this browser
> session only.")

**What the user does:** finishes a topic quiz — the thing that unlocks the credential — offline.

**What happens (two distinct failures):**

1. `enqueueSubmission({ ...args, achievementId })` at `:199` is called with **no `await` and no
   return check**. It is `void`-typed (`api.ts:201`, `): void`), so the dialog at `:205` claims
   the attempt is safely queued without anything having verified that it was.
2. Worse: `upsertQueuedSubmission` is a bare `db.runSync(...)`
   (`submissionQueueStorage.native.ts:32–44`) with no try/catch, and SQLite `runSync` **throws**
   on a disk-full / locked-database / schema-mismatch failure. That throw is raised *inside* the
   `catch (e)` block at `:198`, so it propagates straight past the `notify(...)` at `:205`, runs
   the `finally`, and escapes `doSubmit`. Every call site is `void doSubmit()` (`:245`, `:271`,
   `:286`) — so it becomes an unhandled rejection. **The learner sees no dialog at all.** The
   spinner clears, the screen sits there, `submitted.current` stays `true` (`:130`), and the
   finished attempt is gone.

**What should happen:** the exact fix pass 1 applied to the exam twin — make the enqueue return
a boolean, `await` it, and branch the copy on it. `src/features/finalExam/api.ts:293–299` is the
model; its own comment says *"The boolean is the point: the caller must not tell the learner
their exam is safely queued when it is not."* That reasoning applies verbatim here and was not
carried across.

**Why I believe it:** the two files sit side by side and diverge exactly at this line. The exam
path returns `Promise<boolean>` and the screen checks it; the quiz path returns `void` and the
screen does not.

**Confidence:** high that the claim is unchecked (that is plainly visible in the types). High
that a `runSync` throw escapes the catch — that is ordinary JS control flow. Moderate on how
often SQLite throws in the field.

---

## The Career Finder results screen names licensed professions with no disclosure at all

**Severity:** major — breaks the standing required-education rule
**Where:** `src/screens/careerfinder/CareerFinderResultsScreen.tsx:83–85`; the data it prints is
`src/features/careerfinder/families.ts:57`, `:59`, `:99`, `:109`, `:53`

**What the user does:** takes the Career Finder and reads their results.

**What happens:** each family card prints a line reading

> **FOR EXAMPLE**  Audiologist · Hearing Instrument Specialist · Psychoacoustician

and, depending on the answers,

> **FOR EXAMPLE**  Music Therapist · Speech-Language Pathologist · Clinical Voice Specialist
> **FOR EXAMPLE**  Diagnostic Medical Sonographer · Ultrasound Transducer Engineer · …
> **FOR EXAMPLE**  Sonar Technician · Acoustic Intelligence Analyst · …
> **FOR EXAMPLE**  Acoustical Consultant · Noise-Control Engineer · Vibration Consultant

An Audiologist needs a clinical doctorate plus state licensure. An SLP needs a master's plus
licensure. A sonographer needs an accredited program plus certification. **Nowhere on the entry
screen, the quiz, the results screen or the shared kit does the word "licence", "credential",
"degree", "regulated" or "qualify" appear** — I grepped all four files case-insensitively and
got zero hits. The surrounding page is an Academy results page whose "WHAT TO DO NEXT" card
(`:150–159`) tells the reader to open the family and add its first topic to their study list.

**What should happen:** the same disclosure the app already knows how to make. The app's own
data flags these titles: `src/data/careerIndex.json` marks 94 titles `reg: 1`, including every
Audiologist variant, and `CareerFamilyScreen.tsx:105–110` renders a correct amber card for them
— *one screen deeper*, only after the user taps EXPLORE FAMILY. The results screen is where most
people stop.

**Why I believe it:** `f.examples` at `:84` is printed raw with no per-title lookup;
`FamilyCard` has no access to the regulated flag at all.

**Confidence:** high.

---

## "Rigger" is listed as a career a certificate can lead to, with no required-education label — while the same app flags it as licensed

**Severity:** major — breaks the standing required-education rule, on a safety-critical trade
**Where:** `src/data/credentialCopy.ts:46`; `src/data/topicCopy.ts:120`, `:177`, `:99`

**The exact rows:**

```
"cert-stagecraft-and-rigging-v3": { … careers: [{ name: "Stagehand" }, { name: "Rigger" },
  { name: "Deck Carpenter" }, { name: "Fly Operator" }, { name: "Stage Technician" }] }
```
```
3690: { … roles: [{ name: "Rigger" }, { name: "fly system operator" }, { name: "stagehand" }] }
3580: { … roles: [{ name: "Systems tech" }, { name: "rigger" }, { name: "PA tech" }] }
3080: { … roles: [{ name: "Production electrician" }, { name: "power distribution tech" }, … ] }
```

**What the user does:** opens the Stagecraft & Rigging certificate from the Certificates screen,
or opens topic gs3690 / gs3580 / gs3080 from Explore.

**What happens:** `CredentialDetailModal.tsx:217` prints the heading **"CAREERS THIS CAN LEAD
TO"** and `:228–229` renders each career; a career with no `requires` code gets no label. So
"Rigger" appears as a career this certificate leads to, full stop. `TopicDetailModal.tsx:160`
does the same under "WHERE THESE SKILLS APPLY".

**What should happen:** these need a `requires` code. The app contradicts itself three ways:

- `src/data/careerIndex.json` flags **Entertainment Rigger, Arena Rigger, Theatre Rigger,
  Touring Rigger, Entertainment Electrician and Touring Electrician** all as `reg: 1`, and
  `CareerFamilyScreen.tsx:215` shows them a warning that *"Academy study does not lead to that
  licence or credential"*.
- `src/components/AccuracyNote.tsx:63` (PRACTICE_BODY, an owner-set app standard) says in so many
  words: *"Rigging, electrical distribution and structural loading must be designed and approved
  by people licensed or certified for that work. Studying here does not qualify you to do it."*
- The credential and topic copy say the opposite by omission.

The bare titles "Rigger" / "rigger" / "Production electrician" are why the automated cross-check
misses this: the index uses the qualified forms.

**Why I believe it:** I cross-matched every `{ name: … }` in `credentialCopy.ts` and
`topicCopy.ts` against the `reg` flag in `careerIndex.json`. On exact title match only one row
contradicts (`'Sonar Systems Technician'`, `credentialCopy.ts`, index `reg: 1`). The rigging and
electrician rows are the same contradiction hiding behind an unqualified title.

**Confidence:** high that the app contradicts itself. The exact `RequireKind` to assign
(`CERT` for ETCP-style rigging certification, `LICENSE` for electrical) is an owner call.

---

## "The first free topics are open to everyone" is printed on 41 of 42 career families where none of the listed topics is free

**Severity:** major — a paid feature presented as free
**Where:** `src/screens/careerfinder/CareerFamilyScreen.tsx:117`;
`src/features/enrollment/enrollmentStore.ts:43`

**The exact string:**

> "These Academy topics lead into this family. Tap one to add it to your study list — free to
> add, and the first free topics are open to everyone."

**What the user does:** a non-member opens any career family, reads that line, and taps one of
the three START HERE topics under it.

**What happens:** the topic is added to their study list, and then the study methods are locked
behind the membership sheet. Exactly **two** topics in the whole app are free:
`FREE_ENROLL_GS = [3060, 3970]` (`enrollmentStore.ts:43`), gated by
`studyMethodLocked` (`src/features/commercial/studyGate.ts:33–45`).

Counting `careerFamilies.json`: of 42 families, **exactly one**
(`music-creation-daws-synthesis-and-sonic-art`) lists a free topic in its `topicGs` (3970).
The other 41 print the sentence over a list where nothing is free.

**What should happen:** the line should be conditional — show the free-topic promise only when
`fam.topicGs` actually intersects `FREE_ENROLL_GS`, and otherwise say plainly that adding is
free and studying needs membership.

**Why I believe it:** line 117 is inside the unconditional `fam.topicGs.length ? (…)` branch;
nothing in the file reads `FREE_ENROLL_GS` or the entitlement.

**Confidence:** high.

---

## The Certificates and Programs walls say "COMING SOON — No certificates available yet" when the catalog read fails

**Severity:** major — wrong information shown as fact; the launch-audit fix it claims is
only half-applied
**Where:** `src/screens/achievements/CredentialWall.tsx:69–76` and `:267–275`;
`src/features/achievements/api.ts:212` and `:216`; `src/data/v3Curriculum.ts:203`

**The exact string:** `COMING SOON` / `No certificates available yet.` (and `No programs
available yet.`)

**What the user does:** a paying member opens Trophy Case → Certificates on a flaky connection,
or on an account the RLS policy denies (the failure mode from the v3 credential RLS incident).

**What happens:** they are told the Academy has no certificates.

**Why I believe it — the trace:**

- `CredentialWall.tsx:73–74` is the guard: `fetchNearestCredential(kind).then(setNearest)
  .catch(() => setFailed(true))`. The comment above it at `:69–71` says this exists precisely so
  a failure is not *"reporting 'you're offline' as 'these don't exist'"*.
- But `fetchNearestCredential` (`api.ts:208`) reads the catalog with
  `type === 'certificate' ? fetchV3Certs() : fetchV3Programs()` — the **LENIENT** wrappers.
  `v3Curriculum.ts:203`: `return fetchV3CertsStrict().catch(() => []);`
- So an RLS denial or a dropped connection resolves to `[]`, and `api.ts:216`
  (`if (catalog.length === 0) return { kind: 'none_published' };`) **resolves successfully**.
  The `.catch` never fires, `failed` stays `false`, and `:267–275` renders the COMING SOON row.

**What should happen:** use `fetchV3CertsStrict` / `fetchV3ProgramsStrict` here, exactly as
`EnrollmentScreen.loadBrowse` (`:264–279`) and `CurriculumScreen.loadCurriculum` (`:153–165`)
already do. `AwardsScreen.tsx:869` gets this right too — its empty copy reads *"Specialization
certificates aren't available right now… check your connection."* CredentialWall is the odd one
out.

**Confidence:** high on the code path. The RLS-denial case is a live risk given the recorded
v3 credential RLS incident; the offline case needs no special conditions at all.

---

## Seven paged labs, and six more, carry no `<AccuracyNote/>`

**Severity:** major (standing product rule: *"Every lab/tool must carry `<AccuracyNote/>` — learn
here, measure with a calibrated instrument"*)
**Where:** `src/screens/lab/kit/PagedLab.tsx` — no import, no render

**What happens:** `LabShell.tsx:332` renders `<AccuracyNote compact />` for every lab built on
the shared shell, and `LabCategoryScreen.tsx` carries one at the category level. `PagedLab`, the
*other* shared lab shell, does not. Its own header comment (`:5–8`) names its consumers:

> "CONSUMERS (checked 2026-09-11) — SEVEN labs, not the original three: Sound Envelope · Speech &
> Voice · Smart Processors (De-Esser) · Connector Select · Patchbay · Beginning Mixing ·
> Advanced Mixing."

All seven are registered routes (`RootNavigator.tsx:244–271`). Six further lab screens use
neither shell and carry no note either:

| Screen | Route |
| --- | --- |
| `src/screens/lab/tuning/TuningLabScreen.tsx` | `TuningLab` |
| `src/screens/lab/eartraining/EarTrainingLabScreen.tsx` + `EarModuleScreen.tsx` | `EarTrainingLab` |
| `src/screens/lab/amp/AmpLabHomeScreen.tsx` + `AmpModuleScreen.tsx` | `AmpLab` |
| `src/screens/lab/micselect/MicSelectLabScreen.tsx` | `MicSelectLab` |
| `src/screens/lab/cable/CableLabScreen.tsx` | `CableLab` |
| `src/screens/lab/EarLabScreen.tsx` | `EarLab` |

**Why this one matters most:** the **Tuning & Temperament Lab** reads live pitch through the
phone's uncalibrated microphone (`features/tuning/tuningAudio.ts`, `CenterLockTuner`), and the
two **Mixing** labs teach balance decisions through whatever headphones the learner owns. Those
are the two clearest "your reading is relative, not absolute" cases in the app, and they are the
two with no note. Note also the sibling inconsistency: `CableInstallLabScreen.tsx` has the note;
`CableLabScreen.tsx` does not.

**What should happen:** one `<AccuracyNote compact />` in `PagedLab`'s header covers seven labs
in a single edit; the other six need it individually.

**Confidence:** high (grep over every lab/tool screen for `AccuracyNote|LabShell`; the list above
is what had neither).

---

## Settings promises the phone's text-size setting applies "throughout this app"; 55 files of diagram and meter labels are outside it

**Severity:** minor as copy, but it is the justification for having removed the in-app control
**Where:** `src/screens/settings/SettingsScreen.tsx:517–521`, and the removal rationale at
`:505–515`

**The exact string:**

> "These follow your phone's own accessibility settings and **already apply throughout this app**
> — text here grows with your system text size."

**What happens:** it is true for React Native `<Text>` — `allowFontScaling` is disabled nowhere
(0 hits repo-wide), which is what the comment relies on. It is **not** true for:

1. **Text drawn inside SVG.** 55 files render labels with `react-native-svg`'s `<Text>` — every
   meter axis, frequency scale, waveform annotation, amp/cable-install/patchbay/connector
   diagram. `react-native-svg@15.15.4` has **no** font-scale handling anywhere: grepping its
   `src/`, `lib/module/` and `android/src/main/java/com/horcrux/svg/` for `allowFontScaling`,
   `fontScale` or `getFontScale` returns nothing. SVG `fontSize` is a user-space unit; it is
   fixed. A learner on the largest system text size gets full-size body copy above a diagram
   whose labels are unchanged.
2. **`adjustsFontSizeToFit`** — 28 call sites (Awards, Course Selection, Dashboard, Curriculum,
   Flashcards, ToolsHub, gain viz, RackUnit, CenterLockTuner, SPL). These actively *shrink* text
   back to fit a fixed box, several down to `minimumFontScale={0.6}`. That is the correct fix for
   a fixed-height chip, but it means the promise does not hold there either.

**What should happen:** the copy should be narrowed — "text grows with your system text size;
labels drawn inside diagrams and meters are fixed" — or the rationale for removing the control
re-examined. The rest of that comment block is exemplary about not making promises the app
cannot keep (it says exactly that about the colour-blind remap); this one slipped through.

**Confidence:** high on the SVG mechanics (verified against the installed package, not from
memory). The user-visible severity depends on how much of a lab's meaning lives in its SVG
labels, which varies by lab.

---
---

# PART 2 — ACCESSIBILITY

Context first, because it changes how the findings below should be read: **this codebase is
unusually good at accessibility.** Of 1,111 `Pressable`/`Touchable` elements, only 64 have
neither an `accessibilityRole` nor an `accessibilityLabel`, and most of those 64 are scrims,
backdrops, or wrappers around already-readable text. 61 of 70 `<Modal>`s set
`accessibilityViewIsModal`. `allowFontScaling` is disabled nowhere. The findings below are the
remainder, not a pattern.

---

## Every modal in the Community Directory fails to trap the screen reader

**Severity:** major (for a screen-reader user; the flow cannot be completed reliably)
**Where:** `src/screens/directory/AudioCommunityDirectoryScreen.tsx:150`, `:309`, `:367`;
`src/screens/directory/MyProfileView.tsx:664`, `:732`;
`src/screens/directory/RequestsView.tsx:303`, `:401`;
`src/screens/profile/ProfileScreen.tsx:1031`

**What the user does:** opens any directory sheet with VoiceOver or TalkBack running — a member
profile, the SPECIALTIES picker, the filters, a connection request.

**What happens:** all eight are `<Modal visible transparent animationType="slide">` with **no
`accessibilityViewIsModal`** and no `importantForAccessibility="no-hide-descendants"` on the
content behind. The screen reader's swipe-next walks straight out of the sheet and into the
screen underneath, which is still mounted and still focusable — so the user is reading a list
they cannot see while a sheet they cannot leave sits on top.

**What should happen:** `accessibilityViewIsModal` on the sheet container, exactly as the other
61 modals in the app do — e.g. `TopicDetailModal.tsx:180` sets it on both the `Modal` and the
card.

**Why I believe it:** I parsed every `<Modal` opening tag in `src/` with brace-aware tag
extraction and checked the tag and the following 2,500 characters for the prop. These eight (plus
one dev-only screen, `features/dev/DevVisualIndex.tsx:270`, which does not matter) are the
misses, and they are all in one feature — which reads like the directory was built after the
convention was established elsewhere.

**Confidence:** high.

---

## Eighteen controls are under the 44 pt minimum touch target, even counting `hitSlop`

**Severity:** minor
**Where:** the full list, with the effective size (style height + 2 × hitSlop):

| Effective | File:line | Style |
| --- | --- | --- |
| 32 pt | `src/screens/careerfinder/CareerFamilyScreen.tsx:123` | `topicRow` (the "+ add to study list" row — a primary conversion action) |
| 32 pt | `src/screens/lab/cymatics/ExperimentWell.tsx:71` | `step` |
| 34 pt | `src/screens/curriculum/CurriculumScreen.tsx:334` | `membershipCta` |
| 34 pt | `src/screens/curriculum/CurriculumScreen.tsx:359` | `finderContainer` |
| 36 pt | `src/screens/lab/cymatics/modules/modMyth.tsx:42` | `pick` |
| 38 pt | `src/screens/lab/calc/CalcWorkflowsScreen.tsx:146`, `:158` | `orderBtn` (▲ / ▼ reorder) |
| 38 pt | `src/components/tooldemos/RtaDemo.tsx:221` | `innerChip` |
| 40 pt | `src/screens/lab/cymatics/GalleryArt.tsx:139`, `:177` | `swatch` |
| 40 pt | `src/screens/lab/cymatics/GalleryScreen.tsx:238` | `go` |
| 42 pt | `src/screens/lab/calc/CalcProjectsScreen.tsx:274` | `removeBtn` (✕ remove a value) |
| 42 pt | `src/screens/lab/calc/CalcWorkflowEditScreen.tsx:257` | `stepBtn` |
| 42 pt | `src/screens/tools/MultiMeterScreen.tsx:367`, `RtaScreen.tsx:279`, `SpectrogramScreen.tsx:178` | `chip` |
| 42 pt | `src/features/help/ScreenHelpSheet.tsx:105` | `dot` |
| 42 pt | `src/features/settings/NotifyScheduleModal.tsx:130` | `dayChip` |

**What should happen:** `hitSlop` where the visual size must stay (the three tool `chip` rows
already use `hitSlop={6}`; raising to 8 clears 44). The two worth doing properly are the
CareerFamily `topicRow` — a 32 pt row with no `hitSlop` at all, carrying the "add this topic"
tap — and the Calc Workflows ▲/▼ reorder buttons, which are 30 pt icon-only targets that a user
has to hit repeatedly to move an item.

**Caveat, stated plainly:** `minHeight` rows grow with their content, so the four `minHeight`
entries are floors, not necessarily the rendered height. The `height:` entries are exact.

**Confidence:** high on the numbers; moderate on which of them a real thumb actually misses.

---

## Ten readouts in the Multi-Meter carry an `accessibilityHint` with no role and no label

**Severity:** minor
**Where:** `src/screens/tools/MultiMeterScreen.tsx:1088`, `:1094`, `:1321`, `:1333`, `:1397`,
`:1414`, `:1421`, `:1430`, `:1537`, and the mode cell at `:1076`

**What happens:** each is `<Pressable accessibilityHint="Press and hold for an explanation."
onLongPress={…}>` wrapping a label and a value. The values themselves are read (the child `Text`
nodes are exposed), so no information is lost — but with no `accessibilityRole="button"` the
element is not announced as actionable, and both VoiceOver and TalkBack drop or de-emphasise a
hint on a non-actionable element. The long-press explainers for PEAK, RMS, SPECTROGRAM,
OSCILLOSCOPE, SMOOTH, DOMINANT, NOTE, COUNTER and SMART DETECTION are therefore undiscoverable
to a screen-reader user.

**What should happen:** add `accessibilityRole="button"` and an `accessibilityLabel` naming the
readout. Compare `CenterLockTuner.tsx:929–957`, which does this properly.

**Confidence:** high on the missing props; moderate on exactly how each platform's screen reader
treats a hint without a role (this is the one finding I would settle on a real device).

---

## The Sound-Safety warning area is announced twice

**Severity:** polish
**Where:** `src/screens/tools/SplMeterScreen.tsx:409–416` and `:422`

**What happens:** the effect at `:409` calls `AccessibilityInfo.announceForAccessibility(said)`
for each new warning, and the container at `:422` is *also*
`accessibilityLiveRegion="assertive"`. On Android a screen-reader user gets the hearing-safety
warning read twice, assertively, interrupting whatever they were listening to.

**Why this is polish and not a bug:** the comment at `:405–408` says the live region is there
deliberately, "for anything we miss". Double-announcing a hearing-safety warning is the right
direction to err. Flagging it only so it is a decision rather than an accident. The strobe
itself is correct — `useNativeDriver: true` (`:397–398`), so it does not re-render the live
region on every frame, and it is gated on `animationsAllowed()`.

**Confidence:** high.

---
---

# Checked and found nothing — useful negatives

These were searched properly and came back clean. Listing them so the next pass does not repeat
the work.

- **Information carried by colour alone.** I expected this to be the richest seam, given how many
  meters and status chips the app has. It is not. Every case I traced pairs colour with a word or
  a number: the exposure dose bar (`ExposureMonitorScreen.tsx:167` — *"labeled, never
  color-only"*), the dashboard rack's powered-off panels (`DashboardScreen.tsx:428` announces
  `"powered off"`), the tuner (`magnitudeColor` encodes error *size* only; direction is carried
  by position and by `directionText`, and the meter exposes `aria-valuetext`
  `"12 cents sharp"`), Waveform's CLIP OVERRUNS numeric readout, Multi-Meter's SMART DETECTION
  text chips, `CareerFamilyScreen`'s LICENSED badge (also in the row's `accessibilityLabel` at
  `:200`). The nearest thing to a miss is the red clip-tick lane in Multi-Meter's oscilloscope
  pane (`:1365`), and the SMART DETECTION chip covers it in words.
- **Live-updating values announced every frame.** 44 `accessibilityLiveRegion` sites, all
  checked. None is frame-rate. The two live-tool ones are bucketed: `directionText`
  (`features/tools/tuner/centerLock.ts:620`) has six possible outputs, and the SPL warn area is
  driven by a latched warning set, not by the level.
- **`allowFontScaling`** is disabled nowhere in `src/` (0 hits). Credit where due — that is the
  single most common RN accessibility failure and this app does not have it.
- **The exposure-monitor privacy claim.** *"Exposure history is personal usage data, stored only
  on this device. It is never shared with instructors, institutions or profiles."*
  (`ExposureMonitorScreen.tsx:405`) — holds. The store is AsyncStorage-only
  (`exposureMonitor.ts:298–313`), the "Save exposure history" toggle is genuinely honoured
  (`:299`, `if (!day || !settings.saveHistory) return;`), and `src/features/telemetry/` emits no
  exposure event of any kind.
- **"Pro Audio Safety is a free topic in this app"** (`soundSafetyText.ts:58`) — true.
  gs3060 is one of the two `FREE_ENROLL_GS`.
- **The shake-to-mute fix from pass 1** — verified landed and complete.
  `panicMuteAudio` calls `stopAllFilePlayers()` first and synchronously
  (`features/audio/panicMute.ts:21`), and registration is fused to `applyCeiling`
  (`outputCeiling.ts:77`) so no player-creation site can forget it. All three creation sites
  (`AudioPlayer.tsx:52`, `earPlayer.ts:135`, `LabAudioPlayer.ts`) route through it.
- **Enrollment browse, Curriculum, Awards and the Glossary** all distinguish a failed load from a
  real empty, with a retry. Only `CredentialWall` does not (finding above).
- **The offline exam queue's account hygiene** — `QUEUE_KEY` is `ape:`-prefixed, so
  `clearLocalAccountData` sweeps it; the SQLite quiz queue and the study batch queue are cleared
  by name in `resetAllLocalStores` (`clearLocalAccountData.ts:147–148`). A departing user's
  queued work cannot replay under the next account.
- **The `requires` data itself.** I cross-matched all 517 unique career titles in
  `credentialCopy.ts` and all 233 in `topicCopy.ts` against the 94 `reg: 1` titles in
  `careerIndex.json`. On exact match, exactly one contradiction: `'Sonar Systems Technician'` in
  `credentialCopy.ts` carries no `requires` while the index flags it regulated. That one is
  cosmetic beside the rigging finding above, but it is the same fix. The wider audit is in good
  shape — Clinical Audiologist, Audiologist, the NDT inspector and every engineering title I
  sampled are correctly coded.

---

# What I could NOT check

- **Anything server-side.** `community_profile_publish` / `_delete` are RPCs; whether unpublishing
  really takes the page offline "immediately" (`MyProfileView.tsx:259`) is a backend question.
  Same for `start_final_exam`'s tenure rule and the `get_scenario_items` RPC.
- **Real screen-reader behaviour on a device.** Two findings name a detail that a device pass
  would settle: whether an `accessibilityHint` without a role is spoken (Multi-Meter), and
  whether the directory sheets actually leak focus on both platforms (they should, by the prop's
  definition, but I did not see it).
- **Rendered touch-target heights** for the four `minHeight` entries — they grow with content.
- **Whether the queue-write failure paths ever fire in practice.** Both blocker findings are
  about copy that is wrong the moment that branch is taken; how often it is taken needs field
  data.
- I ran neither `npx tsc --noEmit` nor `npm test`, having changed no source.
- The Sound Safety Warning itself, the audio gate, the output ceiling and the exposure dose
  arithmetic — pass 1 covered those in `pass1-audio-safety.md` and I did not re-tread them beyond
  verifying the shake-to-mute fix.

---

# Findings by severity

| # | Severity | Finding |
| --- | --- | --- |
| 1 | blocker | "Reconnect and it will submit" — the Final Exam screen can never submit again |
| 2 | blocker | The quiz twin claims the attempt is queued without checking, and can lose it with no dialog |
| 3 | major | Career Finder results name licensed professions with no disclosure |
| 4 | major | "Rigger" / "Production electrician" presented as careers the Academy leads to |
| 5 | major | "The first free topics are open to everyone" on 41 of 42 career families |
| 6 | major | Certificates/Programs wall reports a failed catalog read as "COMING SOON" |
| 7 | major | Thirteen labs carry no `<AccuracyNote/>` (seven of them via `PagedLab`) |
| 8 | minor | Settings' system-text-size promise does not hold for SVG labels |
| 9 | major (a11y) | Eight Community Directory modals do not set `accessibilityViewIsModal` |
| 10 | minor | Eighteen controls under 44 pt |
| 11 | minor | Ten Multi-Meter readouts: `accessibilityHint` with no role |
| 12 | polish | SPL hearing-safety warning announced twice |
