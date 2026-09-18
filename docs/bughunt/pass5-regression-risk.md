# Pass 5 · Agent H — What has all this changing done to the app?

Axis: the **cumulative** effect of the bug-hunt batch, not any one fix.
Range read: `a12e7395..695caf8d` (20 commits, 09-17 23:30 → 09-18 01:17).
Shape: **101 source files, +3601/−449**; 9 test files, +1095; 34 docs, +19852.
`npx tsc --noEmit` clean. `npm test` — **1488 pass, 0 fail**, 223 suites.

---

## Verdict

**The branch is in better shape than it was a day ago, but it is not in a
shippable shape tonight, and the reason is not the bugs — it is two of the
fixes.** The batch removed a genuinely frightening class of defect: silent data
loss (the exam queue, the measurement library, the production packet), inert
entitlement gates on flagship paid labs, audio that could not be silenced, and a
long tail of copy that told paying customers to contact a professor. Almost all
of it is well-judged, the tests added are real tests, and the whole thing
type-checks and passes. But three changes landed in the last 65 minutes with no
verification pass behind them, and two of those carry a regression worse than
what they replaced: **the enrollment store now refuses to push a new user's
enrollment list to the server at all, which — given that `start_quiz_attempt`,
`record_study_progress` and `credit_time_trial` all raise `not_enrolled` without
a row in `user_topic_enrollments` — appears to lock every brand-new and every
free-tier account out of the two free topics**; and **the production lab's new
comma handling turns `12,000`, typed one character at a time, into `12`** in a
money field that rides into a client-facing packet. Both are the inverse of the
bug they were fixing. Neither is caught by any test. Everything else in the
batch I would ship.

---

## 1. Behavioural deltas, combined

### The delta list (what now behaves differently)

| Area | Delta | Commit |
|---|---|---|
| Audio | Backgrounding the app calls `panicMuteAudio()` and **re-locks the gate** | `cab7f29d`, corrected `0407b131` |
| Audio | `disableAudioOutput()` now pauses every registered file player | `0e8503b6` |
| Audio | `stopAllFilePlayers()` pauses only — no longer zeroes volume | `0e8503b6` |
| Audio | Shake yields to the mute in Flashcards + StudyFsOverlay when output is ON | `695caf8d` |
| Audio | The daily dose warning holds its latch while overlays are suppressed | `6b335c22` |
| Entitlement | First-attempt reads are generation-checked after the await | `695caf8d` |
| Entitlement | `tierKnown` exported; Settings asserts identity from it | `020912e1`, `70ed9ef1` |
| Gating | 31 + 7 + 8 + 8 routes wrapped/declared members-only | `70694099`…`70ed9ef1` |
| Gating | `GateHold` renders a spinner, a line of text and a GO BACK after 4 s | `020912e1` |
| Enrollment | Pull-before-push added; **push refused when unconfirmed + pristine** | `0407b131`, `70ed9ef1` |
| Storage | `projectStore.mutate`/`upsert` serialized per lab | `70ed9ef1` |
| Storage | Exam queue read-modify-writes serialized | `695caf8d` |
| Storage | `saveMeasurement` returns a boolean and raises a dialog on failure | `020912e1` |
| Storage | Quiz/exam answers drafted to AsyncStorage on every answer | `cab7f29d` |
| Reads | `fetchMyCredentials` / `fetchNearestCredential` now **reject** | `6b335c22` |
| Wipe | 5 more stores reset on account change, + a test asserting the registry | `70ed9ef1` |
| Celebration | Dashboard checks for a new credential on **every focus** | `3fe39f82` |
| Input | Production number fields reinterpret a comma | `70ed9ef1` |
| Copy | ~12 error strings rewritten from institutional to commercial | `70ed9ef1`, `695caf8d` |

### Interaction A — audio: can it still be restarted? **Yes. This one is clean.**

Traced end to end. `panicMuteAudio()` → `stopAllFilePlayers()` (pause only,
volume untouched — the pass-1 self-inflicted bug is genuinely gone) →
`disableAudioOutput()` → `stopAllFilePlayers()` again (harmless double call) →
gate locked. Recovery is `requestAudioOutput()` → explain → 5-second hold →
`enableAudioOutput()`. Nothing latches. `useShake`'s new `yieldToMute` reads
`isAudioOutputEnabled()`, which is **false by default on every JS launch**, so
the flashcard shortcut still works in the common case and only defers when there
is sound to mute — which is the right rule.

Two small consequences worth knowing:

- **A second shake now marks a flashcard known.** Shake 1 mutes (audio was on →
  the flashcard consumer yields). Audio is now off. Shake 2, 1.2 s later, no
  longer yields → it toggles the card. A user shaking twice "to be sure" writes
  study credit. MINOR; confidence high; the debounce makes it easy to hit.
- **`src/lib/useShake.ts` now imports `src/features/audio/audioOutputStore`** — a
  generic lib hook depending on a feature store. It compiles and there is no
  cycle, but the layering is now inverted. Cosmetic.

### Interaction B — the account wipe + the enrollment refusal: **can a legitimate new user end up with nothing? Yes.** ⛔ BLOCKER

This is the one. `src/features/enrollment/enrollmentStore.ts:153-208`.

1. A fresh install hydrates, seeds the two free topics (`FREE_ENROLL_GS =
   [3060, 3970]`), and calls `scheduleServerSync()` (line 259).
2. `scheduleServerSync` calls `reconcileFromServer()`. That select returns zero
   rows — either because RLS denies it silently (the file's own comment says
   exactly this) or because a brand-new user genuinely **has** no rows. Line 134:
   `if (rows.length === 0) return false;` → `confirmed === false`.
3. Line 174: `if (!confirmed && isPristineSeed(list)) return;` — **no push.**
4. `user_topic_enrollments` therefore stays empty for this user, forever, unless
   they manually add or reorder a topic (any edit makes the list non-pristine and
   the push proceeds with the whole list, free topics included).

And the server gates on exactly that table:

- `start_quiz_attempt` (`REMOVE_V1_REMNANTS_2026_09_03/30_APPLY_quiz_functions.sql:109`)
  — `if not exists (select 1 from user_topic_enrollments …) then raise exception
  'not_enrolled'`. Note this check sits **outside** the `always_free` branch, so
  it applies to free topics too.
- `record_study_progress` and `credit_time_trial`
  (`DROP_V1_SCAFFOLDING_2026_09_03/10_APPLY_rewrite_live_functions.sql:256, 377`)
  — same check.

I grepped every `.sql` in the repo: there is **no** `INSERT INTO
user_topic_enrollments` anywhere, and `seed_commercial_free_topics` was
deliberately rewritten to seed the (empty) `always_free` set instead. The only
writer is `sync_my_enrollments`, called from this one file. So the user-visible
result for a new account that just uses the two free topics:

> "You are not enrolled in this course." (`QUIZ_START_ERROR_COPY.not_enrolled`)
> on a topic the Dashboard is showing them as enrolled in.

Before `70ed9ef1` the seed was pushed and this worked. This is the acquisition
funnel, days from launch. **BLOCKER. Confidence: high on the client path and on
the three SQL gates; medium overall** — I cannot see the body of
`sync_my_enrollments` or query the live DB, so there is a residual chance the
server seeds rows by a trigger I cannot see. That is a ten-minute check and it is
the first thing I would do.

The fix is small and does not undo the pass-4 reasoning: refusing to overwrite an
**unconfirmed** list is correct; refusing to **create** one is not. Distinguish
"the server said nothing" from "the server has nothing" — e.g. push when the
local list is the pristine seed *and this device has never pushed before* (a
`ape:enrollmentPushedOnce` marker), or push additively via an upsert that never
deletes, or gate the refusal on the reinstall case it was written for.

### Interaction C — the background mute vs. the owner's own popup copy ⚠️ MAJOR (copy)

`src/features/audio/AudioOutputGate.tsx:318-322` still tells the user, in the
enable-audio dialog:

> "It stays on while you're using the app, **including if you switch away and
> come back**, and mutes itself after 20 minutes untouched."

The comment above it (lines 313-317) defends that clause explicitly: *"leaving
the app does NOT mute it inside the window."* As of `cab7f29d` that is no longer
true — `state === 'background'` calls `panicMuteAudio()` unconditionally. Two
individually-correct changes now contradict each other, and the losing side is a
sentence the owner personally dictated on 2026-09-13. A user who takes a phone
call mid-lab comes back to silence, two modals and another five-second hold,
having just been told that would not happen. Fix the sentence (or, if the
re-lock on background is too aggressive, mute without re-locking).

### Interaction D — the wipe registry now resets five more stores

Ordering is correct at all four call sites (`clearLocalAccountData()` **then**
`resetAllLocalStores()`), so nothing re-hydrates from uncleared storage. The new
entries are right. One is a no-op — see §5.

One flow-level consequence: `resetLowLight()` fires on **log out**, not just an
account switch. A technician who signs out during a show has the dim wash and the
red line removed from a phone in a dark room. Arguably correct (it is now
per-person), arguably a bad moment for it. Worth an owner decision, not a bug.

---

## 2. Anything now MORE fragile

**The reads that now reject are, on inspection, all caught.** I traced every
caller of `fetchMyCredentials` / `fetchNearestCredential` /
`fetchEarnedCredentialsByType` / `fetchAchievementsHub`:
`AchievementsHomeScreen:66` (`.catch(setError)` with a retry card),
`CredentialWall:76-77` (`.catch(setFailed)` with a retry card),
`ProfileScreen:205` (`.then(x, () => {})`), `MyProfileView:155`
(`.catch(() => [])`), `useCredentialCelebration:104` (inside a try). **No
uncaught rejection. No screen that now shows an error where it used to show
something usable** — the Certificates wall will show its error card on an outage
where it used to show "COMING SOON", which is the point of the change.

What *is* more fragile:

- **The exam queue lock can block indefinitely.** `finalExam/api.ts:325-330`
  chains every queue operation. `replayExamSubmissionsLocked` awaits
  `submitFinalExam` per row and **there is no timeout anywhere** in
  `finalExam/api.ts` or `lib/supabase.ts` (grepped for `timeout`, `AbortSignal`,
  `Promise.race` — nothing). A connection that accepts and never answers holds
  the chain, and a concurrent `enqueueExamSubmission` never resolves — so
  `FinalExamScreen` waits forever for the boolean it needs to say "your exam is
  saved". Narrow (the replay only runs from `DashboardScreen:767`, so the two
  rarely overlap), but this is the one collection where the cost is a graded
  capstone. MINOR-MAJOR. A `Promise.race` with a 20 s bound on the lock wait
  would close it.
- **`queueReadable` never recovers.** `finalExam/api.ts:288` latches false on a
  single failed AsyncStorage read and nothing ever sets it back, so
  `writeQueue` refuses for the rest of the session. The refusal is the right
  direction (better than clobbering), and the screen is now honest about it —
  but a transient read failure disables the offline exam safety net until
  relaunch. MINOR. Reset the latch on the next successful read.
- **`saveMeasurement` is called as `void saveMeasurement(...)` at all 8 sites.**
  Safe today only because `hydrate()` cannot reject (its body is wrapped in
  try/catch, `measurementStore.ts:156-181`). One future `throw` above that
  catch becomes 8 unhandled rejections. Worth a `.catch(() => {})`.
- **The failure dialog goes through `notify` → `showAppDialog`, which queues.** A
  full disk plus a user re-taking a measurement produces a dialog per attempt.
  MINOR.

---

## 3. Anything now SLOWER

Roughly, worst first:

1. **`projectStore` writes are now serialized, one AsyncStorage round trip per
   keystroke.** This is the big one and it has a visible symptom — see §6.
   `mutate` reads and rewrites the *whole* project list; on a production project
   with 45 fields plus tables, that is a JSON parse + stringify of the entire
   list per character. Previously these overlapped (and corrupted); now they
   queue, so latency compounds under fast typing.
2. **`fetchMyCredentials()` on every Dashboard focus** (`DashboardScreen:712-725`)
   = 1 `users` select + 1 `credential_awards` select + up to 2 name lookups, so
   **2–4 network round trips every time the Study tab comes forward**. It runs in
   its own `useFocusEffect`, so it does not block content, but it is pure
   overhead on the app's most-visited screen and it will answer "nothing new"
   essentially every time. Cheapest fix: only check after a submit, or throttle
   to once per foreground.
3. **Two queue replays now run serially before the Dashboard fetches anything**
   (`replayQuizSubmissions` then `await replayExamSubmissions`, lines 756-770).
   With empty queues that is two AsyncStorage/SQLite reads — negligible — but
   they are sequential and they are ahead of the content query, so a slow
   `getItem` delays first paint.
4. **`attemptDraft` writes on every answer.** Fire-and-forget, one `setItem` of a
   few KB. Negligible; correctly not awaited.
5. **`currentUserId()` per enqueue** — only when `row.userId` is absent. Negligible.

---

## 4. Consistency of the fixes with each other

**The transient-error regex — three copies, two shapes.**
- `study/sync.ts:38` and `quiz/api.ts:269`: `…|fetch|timeout|…`
- `finalExam/api.ts:406`: same minus the bare `fetch` token.

The commit message for the exam one says the goal was to stop the exam having
the *worst* protection. It is now within one token of the others, and since
**all three now default to KEEP on an unrecognised error**, the divergence no
longer costs data — it only decides whether the loop short-circuits. If they are
to be harmonised, harmonise on the **exam's** version: a bare `fetch` substring
is loose (it matches `prefetch`, `fetchMyCredentials read failed`, …) and the
narrower list is the more precise one.

**The queue lock — three queues, three shapes, and that is defensible.** The
exam queue is a JSON blob in AsyncStorage and needed the chain. The quiz and
study queues are SQLite with row-level `INSERT OR REPLACE` / `DELETE … WHERE id`
(`submissionQueueStorage.native.ts:31-55`), so they have no read-modify-write to
lose. Correct as-is. If anything, the exam queue should eventually move to the
same row-per-item storage — it is the highest-stakes collection and the only one
using the weakest shape.

**Honest-failure messages — two shapes.** `measurementStore` raises a dialog from
the *store* through an injected reporter (good: one place, eight callers).
`ProductionStageScreen` raises a persistent *banner* from the *screen* (also
good: the field is optimistic, so a banner that stays is right). Different
mechanisms, both fit their context. No change wanted.

**Reset registration — one shape, now mechanically checked.** Good.

**"Do we know who this is" — two shapes, and one is used once.** See §5.

---

## 5. What is half-done (the likeliest source of the next bug)

**5.1 — `tierKnown` landed on 1 of ~29 sites.** ⚠️
`grep` finds `tierKnown` consumed only in `SettingsScreen`. Twenty-eight other
call sites still assert identity from `resolved`, which flips in a `.finally()`
**after a failed read**. The provider's boot default is `'anonymous'` and a
failed read "keeps the current tier" (`EntitlementProvider.tsx:285-291`) — which
at cold boot **is** anonymous. So a paying member who opens the app offline (a
venue with no signal: the target user's normal environment) gets
`resolved === true, isMember === false` and is shown the non-member experience
by `withMembershipPreview` (all ~40 paid lab routes), `EarLabScreen`,
`TubeReferenceScreen`, `CalcWorkspaceScreen`, `GlossaryScreen`,
`EnrollmentScreen` and `customListLocked`. That is failing **closed** on an
**infrastructure** error, which is the inverse of the standing rule in the brief.
Pass 3 named the problem and fixed one screen. MAJOR; pre-existing, but the fix
that exists is applied at 3% of its call sites. Note also that the file now
contains two adjacent docblocks that disagree about whether `tierKnown` is
internal (`:185-201` vs `:219-226`).

**5.2 — 8 routes declared members-only, 0 of them wrapped.** ⚠️
`70ed9ef1` added `DigitalModule, EqModule, GainModule, EarModule, AmpModule,
TubeReference, TubeCard, DeEsserLab` to `MEMBER_ONLY_EXTRA_ROUTES`
(`labCatalog.ts:563-578`). In the navigator, `DigitalModule` (`:488`), `EqModule`
(`:528`) and `GainModule` (`:530`) are registered with `Gated.*` — the
**orientation** wrapper — and `EarModule` (`:513`), `AmpModule` (`:515`),
`TubeReference` (`:477`), `TubeCard` (`:478`) and `DeEsserLab` (`:524`) are
registered bare. **None** goes through `MemberGated.*`. The predicate is only
ever consulted by `withMembershipPreview`, so all eight entries are inert — the
same "the wrapper is not the gate" confusion pass 3 flagged as a blocker, made
again from the other end. `membershipGating.test.ts:126-155` checks both halves,
but only for a **hand-written list of 8 child routes** that was not updated, so
it passes. Not exploitable today (none is deep-linkable), but this is exactly the
"one commit away" gap the change was written to close, and it does not close it.
Either wrap them or add them to the test's `children` array.

**5.3 — `resetPopupSuppression()` is a no-op, and its docblock describes a
different module.** `popupSuppressStore.ts:16` — `STORAGE_KEY =
'ape:devSuppressPopups'`, which is **on the KEEP allowlist**
(`clearLocalAccountData.ts:73`) and therefore deliberately *not* swept. The reset
sets `hydrated = false`, so the next `arePopupsSuppressed()` re-hydrates straight
back from the kept key. Its comment claims it "Re-hydrates from the (now cleared)
storage… which is the correct default of OFF" — false for this key — and the rest
of the comment describes Low-Light Production Mode, which is the *other* module
(`resetLowLight`, which **is** correct: `ape:lowLight` is swept). Low real-world
impact (dev-menu-only flag), but a future reader will trust this comment. MINOR.

**5.4 — `fetchMyCredentials` fixed the second read, not the first.**
`credentials/api.ts:36-39`: `supabase.from('users').select('id').single()` — if
*that* read errors, `data` is null, `userId` is undefined, and the function
`return []`. The exact "a failed read told a member they had earned nothing" bug
survives on the first of the two round trips. Also, the function's own docblock
(`:30-33`) still says "Returns [] for … any error", which the body no longer
does. MINOR-MAJOR; confidence medium (depends on whether supabase-js surfaces the
failure as `{error}` or a throw).

**5.5 — `projectStore`: 6 of 8 writers serialized.** `remove` (`:236-238`) and
`duplicate` (`:239-257`) still do their own `list()` → `write()` outside the
queue. Realistic hit: finish typing an answer, navigate back to the project list,
tap Duplicate before the last keystroke's job drains → the duplicate writes a
pre-keystroke snapshot over the whole list and the answer is lost from both
copies. That is precisely the bug pass 4 fixed, surviving on two paths. MINOR.

**5.6 — the celebration paths differ on Low-Light.** The method celebration
renders `<Celebration/>` inline, which reads `useOverlaysSuppressed()` and
collapses to the quiet form (`Celebration.tsx:52-63`). The new credential
celebration **navigates** to `CelebrationScreen` unconditionally from a focus
effect (`DashboardScreen:712-725`). The card itself is quiet under suppression,
but the screen change is not — an auto-appearing full-screen route in a mode
whose rule is that nothing auto-appears. MINOR; gate the navigate on
`areOverlaysSuppressed()` (and note the celebration is already recorded as seen
before the navigate, so a suppressed one is spent).

**5.7 — the wipe-registry test matches on import basename, not on a call.**
`accountWipeRegistry.test.ts:79-81` builds `imported` from `from '…'` specifiers
and keys on the **last path segment**. `store`, `api` and `kit` are not unique
names; any future `features/x/store.ts` with module state and an `ape:` key would
pass spuriously. It also proves the module is *imported*, never that its reset is
*called*. Still a large net win over nothing — just do not read a pass as proof.

---

## 6. The single riskiest change, and what I would do tonight

Two candidates, and I will name both because they are close.

### The riskiest by blast radius: the enrollment push refusal (§1B)

`enrollmentStore.ts:174`. It silently removes the only mechanism that creates a
server enrollment row, and the server gates study credit, time-trial credit and
quiz start on that row. If I am right, **every new account and every free-tier
user cannot take the free quizzes or earn study credit** — days from launch, on
the funnel. It is silent, it is not covered by any test, and it landed 65 minutes
before the branch was left.

**Tonight:** (1) run one query against the live DB —
`select count(*) from user_topic_enrollments where user_id = <a recently created
test account>` — and try a quiz as `gratis@` on gs3060. Five minutes, and it
either confirms or kills this finding. (2) If confirmed, change the refusal from
"never push a pristine seed" to "never **overwrite** an unconfirmed list": push
when this device has no record of ever having pushed (a one-shot
`ape:enrollmentPushedOnce` marker), and keep the refusal for every later sync.
That preserves the reinstall protection the fix was written for and restores the
first-run creation it accidentally removed.

### The riskiest by "this is definitely broken": the production comma

`FieldRow.tsx:455-476`, `NumberField`. The fix is right for the case it names
(`1,5` → 1.5, which used to be 15) but it rewrites the comma **on the keystroke**
and then stores the rewritten text in `draft`, which is what the input displays.
Typing "twelve thousand" one character at a time:

```
"12"     → "12"
"12,"    → no (,\d{3}) match yet  → replace ',' with '.' → "12."    value 12
"12.0"   → no comma left          → "12.0"                          value 12
"12.00"  →                          "12.00"                         value 12
"12.000" →                          "12.000"                        value 12
```

**`12,000` becomes `12`.** The grouping branch the comment celebrates can only
ever fire on a *paste* of a fully-formed number — never while typing, because the
comma is already gone by the time the three digits arrive. Before this change the
same keystrokes gave 12000 correctly. This is a money field in a members-only
flagship lab that rides into a client-facing packet, and it is the exact inverse
of the bug it fixed.

Caveat, stated honestly: on an iOS US-locale `decimal-pad` there is no comma key
at all, so this cannot be typed there. On Android the decimal pad commonly offers
both separators, and paste is always available. And for comma-decimal locales the
new behaviour is *correct* where the old one was wrong. So this is a real
improvement that trades one population's bug for another's.

**Tonight:** stop interpreting the comma per keystroke. Keep the comma in
`draft` as typed (display it), strip it for the published number exactly as
before, and do the decimal-vs-grouping decision **once, on blur**, when the whole
string is visible — or key it on the device locale's decimal separator rather
than a digit-count heuristic. Either is a few lines and removes the ambiguity
entirely.

### One more from the same file, worth a device check

The serialization in `projectStore` (correct, and it fixed real data loss) is
paired with `ProductionStageScreen`'s `setValue`, which still calls
`setProject(saved)` on **every** completed job. The text fields at
`FieldRow.tsx:128/146/166/234/345` are fully controlled from that snapshot with
no local draft. So while typing "abc", job 1 completes and sets the input back to
"a", job 2 to "ab", job 3 to "abc". The end state is now correct (it was not
before), but each keystroke's write lands one AsyncStorage round trip later than
the optimistic update, and each one rewinds the controlled value — which on iOS
moves the caret. Expect rubber-banding on a long project or a slow device; this
was masked before because the writes raced instead of queuing. MINOR-MAJOR,
confidence medium, **settled by two minutes of typing fast in a stage screen on
the phone**. If it shows, the fix is to drop `setProject(saved)` on success and
only clear the failed flag — the optimistic state is already correct.

### Also on tonight's list, in order

1. `AudioOutputGate.tsx:318-322` — delete "including if you switch away and come
   back". It is false as of yesterday and the owner wrote it. One line.
2. Either wrap the 8 routes from §5.2 in `MemberGated.*`, or add them to
   `membershipGating.test.ts`'s `children` list so the next person is told.
3. Bound the exam queue lock (§2) with a `Promise.race`, and clear
   `queueReadable` on a successful read.
4. Throttle the Dashboard credential check (§3.2).

---

## What is clearly better, and should not be second-guessed

Being even-handed, because most of this batch is good work:

- **`stopAllFilePlayers()` pausing instead of zeroing volume.** The pass-1
  version permanently broke playback after any mute or any 20-minute idle. That
  was the worst bug in the batch and it is properly gone.
- **The exam queue: quarantine-not-delete, an honest boolean from `writeQueue`,
  the widened transient matcher, per-row ownership, and surviving a sign-out via
  the KEEP list.** Four separate holes in the one collection where loss is
  unrecoverable, all closed coherently.
- **`GateHold`.** A blank buttonless screen on ~40 routes with no timeout and no
  back gesture was a force-quit trap for paying members. The 4-second escape is
  exactly the right shape — quiet on the happy path, present when it matters.
- **`EngineGate`'s `onRetry` at all 9 mic tools.** A recovery path that never
  rendered, on the failure most likely in the field.
- **The measurement failure reporter.** Putting it in the store rather than in
  eight screens is the right call and the injected-reporter seam keeps the node
  test loadable.
- **The generation check on the first entitlement read**, and `tierKnown` being
  added to the `useMemo` deps — the second of which is a genuinely nasty
  stale-context bug that only manifested on the one path it was written for.
- **`accountWipeRegistry.test.ts`.** Crude on purpose, and it immediately found a
  leak (the Mixing labs echoing a stranger's answers) that three rounds of human
  looking had missed. Worth more than its own weaknesses cost.
- **`attemptDraft`.** Small, guarded, keyed by attempt id, fire-and-forget. The
  right design for the problem.
- **The commercial copy sweep.** "Report this to your professor" in a paid
  consumer app was indefensible and it is gone.
- **The `·`-as-separator sweep across 43+6 formulas**, against a symbol key that
  teaches the dot as multiply. Tedious, correct, and exactly the class of thing
  a calculator held to a source-of-truth bar must not get wrong.
