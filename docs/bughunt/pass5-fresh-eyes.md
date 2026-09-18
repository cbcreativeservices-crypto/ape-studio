# Pass 5 — agent G, fresh eyes (second method)

Three findings: one MAJOR, two MINOR. Plus three notes below the threshold and
an honest "looked here, it was clean" section, which after five passes is half
the value of the report.

I did not reuse pass 4's method (it picked files no report had cited). I picked
**methods** instead and let them choose the files:

1. **Invert the tests.** Every test file in `test/` opens with a docblock that
   states exactly what it guards. I read that as a statement of what is
   *deliberately* unguarded, then checked the unguarded neighbour by hand.
2. **Count the numbers the app tells the user.** Traced displayed percentages,
   counts and countdowns back to the expression that produces them.
3. **Read one long-lived thing as a state machine.** I picked the one nobody
   has enumerated: the **guest identity** — no account → device key granted →
   metered → capped → locked → re-enters Guest Mode → *new identity*. That
   walk produced G-1.

---

## G-1 — **MAJOR**: the glossary's 14-a-week cap resets every time a guest re-enters Guest Mode, on BOTH the pre-gateway and post-gateway paths

**Confidence: high.** Every step is in the repo and read end to end; the only
thing I cannot see from here is the SQL, and the code's own docblocks state the
part of the server contract the conclusion rests on.

**Files**
- `src/features/glossary/glossaryCap.ts:108` — `const LOCAL_KEY = 'ape:glossaryUsageLocal'`
- `src/features/account/clearLocalAccountData.ts:56–75` (the `KEEP` allowlist)
  and `:110–121` (the `ape:*` sweep)
- `src/screens/auth/AuthScreen.tsx:169` — `await clearLocalAccountData({ total: true })`
- `src/features/glossary/deviceKey.ts:19–32, 66` — the consent record, and the
  docblock that already records "a guest who re-enters Guest Mode … gets a NEW key"
- `src/screens/glossary/GlossaryScreen.tsx:1213` (`capMode`), `:1259–1263` (the lock)
- The rule it defeats: `src/features/glossary/deviceKey.ts:4–10`, and the
  `test/studyGate.test.ts` docblock, which calls an unmetered path to the
  26,855 definitions the reason that gate exists.

**What the user does.** A guest reads 14 definitions. The glossary hard-locks
(`GlossaryLockView`: "You've used this week's lookups", with a countdown). They
tap **Exit to menu**, tap any **Sign in** entry point (Home, Dashboard, the
Paywall — `DashboardScreen.tsx:1219, 1498, 1717` among others), and on the Auth
screen tap **GUEST MODE (FREE)** instead of signing in.

**What happens.** They are back in the glossary with 14 fresh lookups. Repeat
for as long as they like.

Both meters are destroyed by the same wipe, so it does not matter which one is
live:

- **Before the gateway is deployed** (`capMode === 'local'`, `GlossaryScreen:1213`)
  the count lives at `ape:glossaryUsageLocal`. That key is under `ape:`, is not
  in `KEEP`, and is not an onboarding flag, so the filter at
  `clearLocalAccountData.ts:110–121` removes it. `consumeLocal`
  (`glossaryCap.ts:132–139`) then sees no window and restarts at `used: 1`.
- **After the gateway is deployed** the guest is metered on the SERVER against
  the uid of their anonymous device key — and the total wipe removes
  `ape:glossaryDeviceKeyConsent` too, so a new anonymous user is minted. A new
  uid has no usage row. `deviceKey.ts:19–32` already documents the new key ("a
  second key appears in auth.users") and explicitly rules out keeping the
  consent record; nobody followed that through to what it does to the *meter*.
  The same docblock (`:38–42`) confirms usage rows are keyed on the uid with a
  foreign key to `auth.users`, which is what makes the new uid a clean slate.

A plain sign-out does the same thing to the local counter: `SIGNED_OUT` →
`syncLocalToIdentity('')` → `clearLocalAccountData()`
(`accountLocalSync.ts:45`), no `total` needed.

**What should happen.** The cap is the *only* free-tier limit on the glossary
and the whole point of the counting gateway. It has to be keyed to something a
guest cannot mint a new copy of by tapping a button. `ape:deviceId` already
exists for exactly this shape of problem and is already on the `KEEP` allowlist
(`clearLocalAccountData.ts:70`) precisely so it survives a wipe — pass the
device id into `glossary_consume` for anonymous callers and count against it,
or keep the server window on the device id rather than the anon uid. Do **not**
add the consent record or `ape:glossaryUsageLocal` to `KEEP`: the owner's
2026-09-01 "a guest is remembered in NO way" ruling forbids it, and
`deviceKey.ts:24–27` says so in as many words. The device id is not memory
about a person; it is the install.

**Why I believe it.** I followed the key from where it is written
(`writeLocal`) to the filter that deletes it, and the filter is a plain
`k.startsWith('ape:')` with two exception sets that do not contain it. The
server half rests on the file's own statement that a fresh anonymous user is
minted; if the owner can confirm `glossary_usage` is keyed on `auth.uid()`,
that half is settled too, and the client docblock says it is.

---

## G-2 — **MINOR**: the store-review prompt is the one auto-appearing surface in the app with no Low-Light / overlay-suppression gate

**Confidence: high on the code; the severity depends on how strictly the owner
reads the Low-Light rule, which is why I am calling it MINOR rather than MAJOR.**

**Files**
- `src/features/review/reviewPrompt.ts:78–81` — `currentBlockers()`
- `src/features/review/reviewEligibility.ts:70–77` — the `ReviewBlocker` union
- Callers: `src/screens/quiz/QuizScreen.tsx:175` (quiz passed),
  `src/features/lab/labCompletion.ts:320` (lab completed),
  `src/screens/exam/FinalExamResultScreen.tsx:69` (certificate earned)
- The rule: `src/features/dev/popupSuppressStore.ts:88–97` — *"Overlays/popups
  must NOT auto-appear when EITHER the dev kill-switch is on OR Low-Light
  Production Mode is engaged (in production mode nothing may flash on screen)"*

**What the user does.** Engages Low-Light Production Mode — they are at a show,
in a dark room, phone on a console. They finish a topic quiz on their break and
pass it.

**What happens.** `noteHighValueEvent('quiz_passed')` runs, the eligibility
counters are satisfied, and `lib.requestReview()` puts the OS rating sheet —
a bright, full-width, five-star modal the app cannot style or suppress — on
screen unbidden. `currentBlockers()` adds exactly one blocker, `'measuring'`,
and nothing in the file imports `areOverlaysSuppressed`.

Every other auto-appearing surface in the app is gated: the exposure check-in
(`ExposureCheckin.tsx:101`), the hearing-dose warning
(`exposureMonitor.ts:493`), celebrations (`Celebration.tsx:52`), all three intro
sheets, coach marks (`coachMark.ts:53`), the amplitude orientation gate. The
review prompt was added later (owner 2026-09-06) and missed the pattern — the
same drift the `ReviewBlocker` union anticipates but `currentBlockers()` never
computes: of its six declared blockers, only `'measuring'` is ever produced.

**What should happen.** One line in `currentBlockers()`:
`if (areOverlaysSuppressed()) b.push('after_error')` — or better, a
`'suppressed'` member on the union so the reason is honest. The cost of getting
it wrong is asymmetric: the OS quota for the prompt is spent whether or not the
user was in a position to answer it, and `recordRequested` is written *before*
`requestReview()` (`reviewPrompt.ts:99`), so a prompt fired into a dark room
burns the once-per-version allowance for good.

**Not a finding, recorded so nobody re-chases it:** `recordAppSession` *is*
wired (`App.tsx:210`), so the counters do accumulate and the feature is live,
not dead.

---

## G-3 — **MINOR**: the in-app Help describes an award progress meter the app does not have, and a completion rule the app does not use

**Confidence: high.** Both halves traced to the expression that renders the
number.

**File:** `src/features/help/helpContent.ts:149–152`, entry `enroll-progress`:

> *"Each enrolled topic's meter is your study progress in that topic; an award
> card's meter averages the topics it requires. 100% marks the topic complete."*

**Half one — "averages the topics it requires" is false.** Every place an
award's progress is drawn, it is the fraction of required topics whose *server
status is already `complete`*, never an average of their meters:

- `src/features/awards/api.ts:120, 132, 139` — `complete: status === 'complete'`,
  then `completeCount = topics.filter(t => t.complete).length`
- `src/screens/awards/AwardProgressScreen.tsx:169` —
  `pct = Math.round((completeCount / totalCount) * 100)`, rendered at `:215`
- `src/screens/achievements/CredentialWall.tsx:232, 240, 247` — the same ratio
  as a `ProgressRing` and as "`N` of `M` topics complete"

The topic meters really are an average (`enrollmentProgress.ts:86–95` →
`topicOverallPct`, "the mean of all four methods"), which is why the sentence
reads plausibly — but the award figure is a step function over whole topics.

**What the user experiences.** A learner who is 90% through all five topics of
a certificate has been told the award meter averages them. They open Award
Progress and it reads **0%**, `0 of 5`. The one number that is supposed to show
them how close they are to the credential they are paying for shows nothing
moving until a topic flips whole, and the Help they check to make sense of it
confirms the wrong model.

**Half two — "100% marks the topic complete" is also not how it works.** The
topic meter is the mean of the four *study methods* (`STUDY_METHOD_KEYS`); the
topic's `status` becomes `'complete'` server-side, and the status enum carries
a distinct `'passed_incomplete'` for a partial pass (`dashboard/api.ts:7, 20`).
So a topic can sit at a 100% meter and still not be `complete` — it is the quiz
that completes it, which is the app's own documented power sequence. Read
together, the two sentences tell a learner that five topics at 100% should show
a 100% award meter, when the app will show 0%.

**What should happen.** Say what the number is: *"An award's meter counts the
required topics you have finished outright — a topic counts once its quiz is
passed, not when its study meters reach 100%."* This is the third correction to
this file (`:225`, `:244` carry the pass-3 ones) and the same class as those:
an answer that was true of an earlier design.

---

# Below the threshold, but worth a line each

- **`CurriculumScreen.tsx:141`** — the visible blurb clamps the Career Finder's
  resume position (`Math.min(QUESTION_COUNT, finderRec.index + 1)`) but the
  `a11yLabel` on the same line does not, so a screen-reader user can hear
  "Continue at question 29 of 28". The clamp on the visible string is evidence
  that `index` really can run past the last question.
- **`GlossaryScreen.tsx:1880–1893`** (`resolveShareTerms` → `buildShareTerm` →
  `getDetail`) — sharing a *list* of bookmarked terms charges one weekly lookup
  per term that was not opened this session. The docblock at `:1822–1830`
  reasons about a single term and calls it "the honest reading of the rule"; it
  does not note that a 10-term list share spends 10 of the 14 in one tap,
  pops the "7 left" notice mid-share, and can hard-lock the glossary while the
  share sheet is still open. At minimum the sheet should say what it will cost.
- **`localSchedule.ts:212`** — `if (syncing) return;` *drops* a rebuild request
  rather than deferring it, and `lastSlice` is only advanced inside a run that
  actually happens. A sign-out landing while a boot/foreground sync is in
  flight therefore leaves the previous member's seven days of booked reminders
  on the device with nothing scheduled to re-check. Narrow (the two syncs have
  to overlap) but the fix is a one-line "re-run once when the current run
  finishes".

---

# Where I looked and found nothing

- **`reviewEligibility.ts` / `reviewPrompt.ts` (beyond G-2).** The decision is
  correct and the test is one of the best in the repo — it even asserts the
  *shape* cannot carry the user's rating. `recordRequested` before
  `requestReview()` is deliberate and right. No pre-screening, no five-star ask,
  no route away from the store.
- **The local notification scheduler** (`localSchedule.ts`, `weeklyConcept.ts`,
  `curatedTermLists.ts`). I went in expecting a wrong weekday or an unprompted
  permission ask. Neither: `dayNameToDow('Monday') + 1 = 2` matches Expo's
  `1 = Sunday` weekly trigger; all nine reminder toggles default **off**
  (`settings/store.ts:59–68`), so `anyOn` is false on a fresh install and
  `requestPermissionsAsync` is never reached unprompted; the sweep cancels only
  its own `ape.notif.` prefix; the term/definition queues use disjoint slices of
  the batch (offsets 0 and 7 over 14 rows) so the answer never spoils the
  question; `nextFirstOfMonth` handles "today is the 1st" correctly; and the
  monthly new-terms count accumulates rather than overwriting. Only the
  `syncing` drop above is worth anything.
- **`glossaryCap.ts` arithmetic (as distinct from G-1's key lifetime).** The
  rolling window, the "already at the cap → block, do not increment" branch, the
  `used === 7` heads-up and the `GlossaryLockView` countdown formatting
  (`formatCountdown` / `formatCountdownLong`, including the `Math.max(1, m)`
  floor and the singular/plural spoken form) are all correct, and the gateway
  path calls `warnUsage` too (`GlossaryScreen.tsx:1401`), so the heads-up is not
  lost when the server meters.
- **Career Finder scoring** (`scoring.ts`, and the copy that quotes it). The
  0.50/0.30/0.20 weights, the 25% "I don't know" share and the 0.375 spread in
  `CLARITY_RULES` are all rendered from the constants themselves in
  `CareerFinderAboutScreen.tsx:58–59`, so the About page cannot drift from the
  maths. `null` is excluded from the average rather than zeroed, ties break on
  family id, and `band()` treats exactly 0.5 as neutral so the app never
  misquotes a neutral answer back as "some interest". Required-education
  disclosure is carried by `regulated` → the LICENSED chip on the collapsed row
  *and* the expanded warning (`CareerFamilyScreen.tsx:212, 224–225`), so the
  disclosure survives without expanding the row.
- **`directory/rules.ts`.** Caps, `aboutIsSafe`'s four patterns, `slugify` and
  `readableError` are all internally consistent and the file is explicit that
  the database is the enforcement and this is the pre-check.
- **`production/readiness.ts`.** The score does what its docblock promises:
  required decisions over required fields, an attention penalty capped at 0.2,
  and a blocker that cannot be outscored. `isAccepted` refuses an acceptance
  with no named person and no reason, so no screen can route around it. An
  N/A'd required field counting as "decided" is documented, not accidental.
- **`InsideStats.tsx` / Academy at a Glance.** Every figure is sourced from a
  registry, an RPC or screen state; `null` renders a dimmed dash rather than an
  invented number; the count-up is once per session and gated on
  `animationsAllowed()`; the a11y label says "Count unavailable" rather than
  reading the dash.
- **`harmoExport.ts` / the save-and-print chain.** Every path returns an honest
  `'unavailable' | 'denied' | 'failed'` through `optionalModule`, and Photos is
  requested write-only, matching the purpose string in `app.json`.

## What I could not check

`glossary_consume` / `glossary_usage_status` / the `glossary_usage` table are
not in `supabase/migrations/`, so the server half of G-1 is reasoned from the
client's own docblocks rather than read. What would settle it: whether the usage
row is keyed on `auth.uid()` (in which case a fresh anonymous key is a fresh
allowance, as I claim) or on something stable. The local half needs no such
check — it is entirely in this repo.
