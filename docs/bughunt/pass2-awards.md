# Pass 2, agent C — Progress, awards and credentials: is the math right?

**Date:** 2026-09-18 · **Branch:** audio-tools-engine
**Axis:** everything that counts, gates, or awards — completion %, the study
gates, certificate/program issuance, quiz & exam scoring, trophies.

---

## What I read

Client, in full: `src/features/awards/api.ts`, `src/features/credentials/api.ts`,
`src/features/achievements/api.ts`, `src/features/finalExam/api.ts`,
`src/features/dashboard/topicPct.ts`, `src/features/enrollment/enrollmentProgress.ts`,
`src/features/enrollment/enrolledBundlesStore.ts`, `src/features/lab/labCompletion.ts`,
`src/features/celebration/{celebrationQueue,celebrationSeen,useMethodCelebration,catalog}.ts`,
`src/features/profile/{api,topicTrophies}.ts`, `src/features/curriculum/academyStats.ts`,
`src/data/v3Curriculum.ts` (credential fetches), `src/screens/awards/{AwardProgressScreen,awardsData,CredentialDetailModal}.tsx`,
`src/screens/achievements/{CredentialWall,AchievementsHomeScreen,TopicsScreen}.tsx`,
`src/screens/exam/{FinalExamScreen,FinalExamResultScreen}.tsx`,
`src/screens/results/ResultsScreen.tsx`, the score/gate/quiz blocks of
`src/screens/dashboard/DashboardScreen.tsx` and `src/screens/profile/ProfileScreen.tsx`,
and `src/features/study/api.ts` (`studyDisplayPct`).

Server truth, in full: `REMOVE_V1_REMNANTS_2026_09_03/30_APPLY_quiz_functions.sql`
(`start_quiz_attempt` + `submit_quiz` — the real bodies),
`supabase/migrations/2026091801_paid_month_before_credential.sql`,
`supabase/functions/store-notifications/index.ts`.

Prior work read so I would not repeat it: `docs/bughunt/pass1-study-flow.md`,
`docs/bughunt/pass1-entitlement.md`, `docs/audit/waveA_entitlement-rls.md`,
`docs/audit/waveB_data-integrity-calc.md`, `docs/audit/waveF_release-readiness-verdict.md`,
`docs/APE_MEMBER_TENURE_FOR_COMP_A.md`, `docs/APE_REFUND_WEBHOOK_DEPLOY.md`.

I did not query the live database and did not run the app. Where that matters I
say so, per finding, and say what would settle it.

---

## A certificate is issued by a database trigger on topic completion — the Final Exam and the paid-month rule are both off that path

**Severity:** BLOCKER
**Confidence:** high on the mechanism, medium-high that it is live today (three
independent repo documents describe it as live; one live `\df+` would settle it)
**Where:** `docs/audit/waveA_entitlement-rls.md:45-53`,
`docs/audit/waveB_data-integrity-calc.md:89-93`,
`supabase/migrations/2026091801_paid_month_before_credential.sql:213-228`,
`src/screens/awards/AwardProgressScreen.tsx:245-278`,
`src/features/finalExam/api.ts:79-84`

**What the user does:** completes the last required topic of a certificate —
normally, honestly, by passing its topic quiz.

**What happens:** `submit_quiz` sets `student_achievement_progress.status =
'complete'` (`30_APPLY_quiz_functions.sql:262`). The AFTER trigger
`student_progress_award` fires `trg_eval_credentials()` →
`evaluate_user_credentials(user)`, which awards a certificate/program **purely by
counting `status='complete'` rows** and `INSERT`s into `credential_awards` with
`source='auto'`. The user now holds the credential. `AwardProgressScreen` reads
`credential != null` and renders the **EARNED** panel; the *"Take Final Exam"*
button is not rendered at all (`:245`, `:181`). If they somehow reach the exam,
`start_final_exam` answers `already_earned`.

**What should happen:** per every user-facing statement in the app, a credential
is earned by completing the topics **and passing the Final Exam**, and is granted
only **after one complete month of paid membership** (`AwardsScreen.tsx:417`,
`AwardProgressScreen.tsx:277`, `finalExam/api.ts:102`).

**Why I believe it:**

- `waveA` A-1 traces the chain explicitly and names the award as
  `credential_awards (source='auto')`; `waveF` repeats it as release blocker #1.
- `waveB` B-7 describes the normal, non-exploit consequence in passing: *"right
  after the action that completes a cert's last topic, the cert appears once the
  server awards it"* — i.e. awarding is a consequence of topic completion, not of
  an exam.
- The exam's own error vocabulary contains `already_earned` with the copy *"You
  have already earned this credential"* (`finalExam/api.ts:80`, `:104`). That
  state can only be reached if something other than the exam issued it.
- The tenure migration's §4 only proposes a gate inside `start_final_exam` /
  `submit_final_exam`. **Nothing in the repo proposes a gate on
  `evaluate_user_credentials`**, and nothing in the tenure work mentions it.

**Two separate consequences, both bad:**

1. The paid-month promise cannot be kept by gating the Final Exam, because the
   Final Exam is not the issuing path. A member on a 35-day comp code who
   finishes the topics on day 3 holds the certificate on day 3.
2. The Final Exam — a built, paid capstone with a 10-minute clock, focus-void
   handling, an offline queue and a result screen — is unreachable for anyone who
   completes their topics in the normal order, because the credential is already
   theirs before they can sit it.

**What would settle it:** on the live DB, `select prosrc from pg_proc where
proname='evaluate_user_credentials'` and
`select source, count(*) from credential_awards group by 1`. If `source='auto'`
rows exist for users with no `final_exam_attempts` row, it is confirmed.

**Fix (needs the owner, backend frozen):** decide which is the issuing rule. If
the Final Exam is the gate, `evaluate_user_credentials` must stop inserting into
`credential_awards` and instead record *eligibility* (e.g. a `credential_eligible`
row the AwardProgress screen reads to light the exam button), with the actual
`credential_awards` insert made only by `submit_final_exam` — behind
`member_month_complete`. If auto-issue stays, then `member_month_complete` has to
be checked **inside `evaluate_user_credentials`**, and the exam's role and the
three copy lines need rewriting. Either way the A-1 RLS lock (`ALL → SELECT`) is a
precondition, because whatever counts `status='complete'` is only as trustworthy
as the table it counts.

---

## The one-month-of-paid-membership rule is stated in three places and enforced in none

**Severity:** BLOCKER
**Confidence:** high
**Where:** `supabase/migrations/2026091801_paid_month_before_credential.sql:23-25`
and `:213-228`; `docs/APE_MEMBER_TENURE_FOR_COMP_A.md`;
`docs/APE_REFUND_WEBHOOK_DEPLOY.md:104-117`; copy at
`src/screens/awards/AwardsScreen.tsx:417`,
`src/screens/awards/AwardProgressScreen.tsx:277`,
`src/features/finalExam/api.ts:102`

**What the user does:** reads *"A minimum of 1 complete month of paid membership
is required before a certificate can be granted"* and believes it.

**What happens:** nothing checks it. The migration that would add
`entitlements.member_since`, `entitlements.refunded_at` and
`member_month_complete(uuid)` carries its own banner:

```
-- NOT YET APPLIED — see docs/APE_MEMBER_TENURE_FOR_COMP_A.md.
```

and `supabase/migrations/` contains this one file and nothing else. The gate
itself is not even code — §4 is a comment instructing a human to hand-edit the
live body of `start_final_exam`:

```
--     IF NOT public.has_academy_access(auth.uid()) THEN RAISE EXCEPTION 'academy_required'; END IF;
--   + IF NOT public.member_month_complete(auth.uid()) THEN RAISE EXCEPTION 'paid_tenure_required'; END IF;
```

So today: a one-day member who completes the work gets the certificate. The
client-side half is fully shipped and looks finished — `paid_tenure_required` is a
declared `ExamStartError` with polished copy — which is exactly what makes this
easy to mistake for done.

**What should happen:** the predicate exists and is correct (I checked its shape
against the owner's rule: `status='active'`, `refunded_at is null`, unexpired,
`member_since <= now() - interval '1 month'`, comps included — all right). It
simply is not applied, and is not wired to the path that actually issues.

**Three further gaps in the rule as designed**, each worth naming separately:

1. **The submit side is an instruction, not code.** Both the migration (`:225-228`)
   and the deploy doc say `submit_final_exam` *"wants the same guard"*. There is no
   SQL for it anywhere. A refund landing between start and submit still awards.
2. **It cannot bind the real issuing path** — see the finding above. Gating
   `start_final_exam` gates a door the credential does not come through.
3. **`redeem_access_code` is patched inside this same unapplied file** (`:105-207`),
   including the concurrency `select … for update` that a code comment dates to
   2026-09-11. `pass1-entitlement` already flagged that the hardening may never
   have been applied. If this file is applied, both land together; if it is not,
   neither has.

**Fix:** apply the migration, then decide the issuing path (finding 1) and put
`member_month_complete` on *that*. Until it is enforced, the three copy lines are
a promise the product does not keep; if the rule is going to slip past launch, the
copy should come out rather than stay as a claim.

---

## The quiz score is shown out of 30 and the pass mark as 28, but v3 quizzes are variable-size

**Severity:** MAJOR (wrong information shown as fact, on a graded surface)
**Confidence:** high on the client defect; the incidence depends on how many live
v3 topics have fewer than 30 quizzable terms — one `count(*)` settles it, and the
server was deliberately changed to allow it
**Where:** `src/screens/results/ResultsScreen.tsx:134`;
`src/screens/dashboard/DashboardScreen.tsx:1859`, `:1869`, `:1870`, `:726`;
constant at `src/features/quiz/api.ts:83-84`

**What the user does:** takes the topic quiz on a topic with fewer than 30
approved quizzable terms — say 18.

**What happens:** the quiz header counts honestly, **"QUESTION 1 OF 18"**
(`QuizScreen.tsx:492`). They answer 18 questions and get 16 right — a pass, because
the server's pass mark is `size - 2` = 16. Then:

- Results reads **"16 / 30"** (`ResultsScreen.tsx:134`).
- The Dashboard quiz panel reads **"16/30 · PASSED 16/30"** (`:1859`, `:1869`),
  permanently.
- Had they scored 15, the panel would read **"RETRY FOR 28+"** (`:1870`) — a
  target that does not exist on an 18-question quiz. The learner is told to reach
  a score the quiz cannot produce.
- An offline pass replayed later notifies **"Score 16/30 — full pass"** (`:726`).

**What should happen:** the denominator is the number of questions actually
served, and the pass mark is `served - 2`.

**Why:** `QUIZ_SIZE = 30` / `QUIZ_PASS = 28` are hardcoded constants
(`quiz/api.ts:83-84`) documented as *"the ratified quiz shape"*. The live server
disagrees for v3. From `30_APPLY_quiz_functions.sql`:

```sql
-- v3 accepts any nonzero size (variable-size quizzes); archived path is retired above.
if v_materialized = 0 then raise exception 'pool_too_small'; end if;
if v_ach_cvid <> c_v3 and v_materialized <> 30 then raise exception 'pool_too_small'; end if;
```

and in `submit_quiz`:

```sql
select count(*) into v_n from quiz_attempt_items where attempt_id = p_attempt_id;
if v_n < 1 or v_n > 30 then raise exception 'bad_serve_set'; end if;
v_pass_mark := greatest(1, v_n - 2);
```

The draw itself caps at the term count: `fill` is limited to
`greatest(0, least(30, (select count(*) from terms)) - (select count(*) from ia))`,
so a topic with 18 quizzable terms serves 18 items. The `<> 30` guard is applied
to the *non*-v3 path only — that exclusion was written on purpose, which is the
strongest evidence that short v3 quizzes are expected.

**Which of the two numbers is right:** the server's. And the correct denominator
is already in the client's hands on every screen that gets it wrong —
`QuizScreen.doSubmit` computes `const total = questions.length` (`:173`) for the
celebration percentage and passes the same `questions` array to both Results and
Celebration (`:153`, `:183`, `:193`). `ResultsScreen` receives it
(`route.params.questions`, `:63`) and then ignores it in favour of the constant.

This is the third time this exact class has been fixed here — `[46]` removed a
stale "24+" from ResultsScreen and `[46b]` removed its twin from the Dashboard
(`DashboardScreen.tsx:1607-1612`), both with the reasoning *"interpolate so the
copy can never drift from the ratified pass mark"*. The remaining problem is that
the pass mark is no longer a single ratified number.

**Fix:** carry the size. Cheapest correct version: use `questions.length` in
`ResultsScreen` (`{result.score} / {questions.length}`, pass mark
`Math.max(1, questions.length - 2)`), and add `size` to the persisted quiz row and
to `student_achievement_progress` reads so the Dashboard panel can render
`best/size` instead of `best/30`. If the Dashboard cannot know the size without a
new column, show the bare score (`PASSED · 16`) rather than a denominator that is
wrong. Keep `QUIZ_SIZE` only as the maximum.

---

## A failed read of your trophies or your credentials is rendered as "you have earned nothing"

**Severity:** MAJOR
**Confidence:** high
**Where:** `src/features/achievements/api.ts:75-84`; `src/features/credentials/api.ts:46`;
`src/features/profile/api.ts:94-111`; consumers at
`src/screens/achievements/AchievementsHomeScreen.tsx:114-163`,
`src/screens/achievements/TopicsScreen.tsx:88`,
`src/screens/achievements/CredentialWall.tsx:75-77`, `:105`

**What the user does:** a member with 40 trophies and 2 certificates opens the
Trophy Case after a network blip, an expired token, or an RLS change.

**What happens:** the hub reads **"0 / 166"**, **"0 EARNED"**, **"0 EARNED"**, and
*"Nothing earned yet — tap to explore."* The Topics grid shows every trophy
greyed. No error, no retry. It is indistinguishable from a brand-new account.

**What should happen:** a failed read must present as a failure with a retry, not
as an authoritative zero. The repo already knows this — `fetchGalleryV3` in the
same file does it right:

```ts
// Surface a read failure rather than swallowing it as an empty gallery …
if (error) throw error;
```
(`achievements/api.ts:157-160`)

**Why:** three sibling readers swallow the error object:

- `fetchTopicAchievements` destructures `const { data: prog } = await supabase…`
  (`:75`) and never looks at `error`. An empty `statusById` makes every topic
  `'locked'`, so `earnedTotal` is 0 and `recentEarned` is empty.
- `fetchMyCredentials` collapses failure and emptiness into one branch:
  `if (error || !awards?.length) return [];` (`credentials/api.ts:46`), and the
  whole function is additionally wrapped in `catch { return []; }`.
- `fetchProfile` takes `completeRes.count` without checking `completeRes.error`
  (`profile/api.ts:110`), so a failed count renders *"Not started yet"* and 0%.

**The error UI that exists cannot fire.** `CredentialWall` has a proper
error card with a Retry button, guarded by
`fetchEarnedCredentialsByType(kind).then(setRows).catch(() => setFailed(true))`
(`CredentialWall.tsx:76`). `fetchEarnedCredentialsByType` calls
`fetchMyCredentials`, which never rejects — so that `.catch` is dead code and the
card is unreachable via that path.

**A second-order effect on the same root cause:** `fetchNearestCredential`
(`achievements/api.ts:206-247`) builds `earnedIds` from the same swallowed read.
When it returns `[]` by failure, every credential looks unearned, so the **NEXT
UP** slot can advertise a credential the member already holds, and tapping through
to the Final Exam ends at `already_earned`.

This is the same shape as the project's own `v3 cert/program RLS fix` note
(*"fetchV3* swallow errors → [] so denial was silent"*) and as pass-1's
`resolveItemCounts` finding. It has simply not been applied to the awards layer.

**Fix:** make the three readers distinguish failure from emptiness. The
lowest-risk version, matching `fetchGalleryV3`: check `error` and `throw` (or
return `null`) from `fetchTopicAchievements`, `fetchMyCredentials` and the profile
counts; the Trophy Case hub, TopicsScreen and CredentialWall then render their
existing failure states instead of a zero.

---

## Profile and Award Progress give two different "X of Y topics" for the same credential, one tap apart

**Severity:** MAJOR
**Confidence:** high (both formulas read directly; the only unknown is the exact
size of the gap, which is the co-req count, 4)
**Where:** `src/screens/profile/ProfileScreen.tsx:251-254`, `:658`, `:663` vs
`src/features/awards/api.ts:136-143` rendered at
`src/screens/awards/AwardProgressScreen.tsx:169`, `:211-215`

**What the user does:** opens Profile → *YOUR CERTIFICATES & PROGRAMS*, sees
**"Mastering — 3 of 3 topics complete"**, taps the row.

**What happens:** the row navigates to `AwardProgress` for that same certificate,
which reads **"3 / 7 · 42%"** and *"Complete every required topic to unlock the
Final Exam."*

**What should happen:** one number, and it should be the server's.

**Why:** two different denominators.

- Profile counts `b.topics` from the device-local bundle store. `addBundle` is
  always called with the credential's **own** topic list
  (`AwardsScreen.tsx:668` → `c.topics`; `:615` → `gsList`;
  `EnrollmentScreen.tsx:660`), and the four standing co-requisites are added
  *separately* through `addTopics([...COREQ_TOPIC_GS])` — they never enter
  `bundle.topics`. So Profile's Y is the specialization topics only.
- `AwardProgress` counts the rows returned by the server's
  `award_required_topics`, which — per the contract docblock at
  `features/awards/api.ts:5-9` — already UNIONs the four standing requirements
  (Safety 3060, Grounding 3070, Audio Fundamentals Lab 3081, Workplace 4370). So
  its Y is specialization + 4.

The server's is right: it is the same set the award gate is decided from.

Related but distinct, and already filed: `waveB` B-5 (nearest-credential *ranking*
ignores the co-reqs) and B-2 (electives). This one is a user-visible contradiction
between two screens joined by a single tap, which neither covers.

**Fix:** have the Profile row show the same source. Either call
`fetchAwardProgress` for each enrolled bundle (it is already imported in
`achievements/api.ts` for exactly this purpose), or — cheaper — render only the
credential name on Profile and let AwardProgress own the count. Do not "fix" it by
adding 4 client-side: `award_required_topics` is the only thing that knows which
co-reqs apply to a given award.

---

## A device clock a few minutes fast makes every quiz and every Final Exam impossible to pass

**Severity:** MAJOR
**Confidence:** high on the mechanism (every line traced, both surfaces); I cannot
estimate how many real phones have a skewed clock
**Where:** `src/screens/exam/FinalExamScreen.tsx:111-117`, `:124`, `:195-203`;
identical at `src/screens/quiz/QuizScreen.tsx:122-123`, `:132`, `:239-245`;
server test at `30_APPLY_quiz_functions.sql:230`

**What the user does:** sits the Final Exam on a phone whose clock is, say, 12
minutes ahead of real time (manual time set, or a device that has not synced).

**What happens:** the screen opens, the timer shows **00:00** immediately and the
exam force-submits with zero answers. The result screen reads **TIME EXPIRED — The
exam was submitted past the ten-minute limit**. Retake does the same thing, every
time. The capstone is permanently unsittable, and nothing on screen suggests the
cause.

With a smaller skew — 5 to 30 seconds fast — the subtler version: the learner
finishes in good time, and the server marks the attempt `timed_out`, which records
nothing at all (`v_attempt_status='timed_out'` skips the whole
`if v_attempt_status = 'submitted'` block, so `best_genuine_score`, `status`,
`date_earned` and `quiz_attempts` are all left untouched).

**What should happen:** the deadline and the submitted-at instant should be
measured against the same clock the server measures against.

**Why:** the deadline mixes two clocks.

```ts
const deadline = new Date(payload.started_at).getTime() + payload.time_limit_seconds * 1000;
…
setMsLeft(deadline - Date.now());
```

`payload.started_at` is the **server's** `now()`. `Date.now()` is the **device's**.
The difference between them is pure clock skew, and it is subtracted straight from
the learner's time. Then `doSubmit` sends `new Date(Date.now()).toISOString()` as
`p_submitted_at`, and the server tests

```sql
v_timed_out := (p_submitted_at - v_att.started_at) > interval '602 seconds';
```

— device time minus server time, compared to a 602-second budget whose 2-second
grace is the only slack in the system.

The one place this is handled correctly is the force-submit: `doSubmit(deadline)`
sends the deadline itself, which is derived from `started_at`, so the timeout path
is skew-free. The normal finish-early path is not.

**Fix:** measure elapsed time locally and derive the timestamps from the server's
epoch. At payload time, record `const skew = Date.now() - Date.parse(payload.started_at) - <round-trip estimate>`; render the countdown from a monotonic elapsed counter seeded at mount rather than from `deadline - Date.now()`; and send
`p_submitted_at = new Date(Date.parse(payload.started_at) + elapsedMs).toISOString()`.
Server-side, the durable fix is one line: clamp with
`least(p_submitted_at, now())` and floor it at `v_att.started_at`, so a client
clock can never shorten *or* lengthen the sitting. (That the client is trusted to
report its own finish time is also, separately, a way to never time out — worth the
owner knowing, though an honest client cannot exploit it.)

---

## "PASSED — it has been added to your record" is printed even when the server says no credential was awarded

**Severity:** MINOR today; becomes MAJOR the moment the submit-side tenure guard
lands, because that guard produces exactly this state
**Confidence:** high on the code, low on today's incidence
**Where:** `src/screens/exam/FinalExamResultScreen.tsx:23-27`, `:56`, `:97-104`

**What happens:** `COPY.pass.body` is unconditional — *"You have met the standard
for this credential. It has been added to your record."* — and is rendered for any
`result.outcome === 'pass'`. The **CREDENTIAL ISSUED** panel beneath it is
conditional on a *different* value, `result.credential_awarded` (`:97`). When the
server returns `pass` with `credential_awarded: false`, the learner is told in
prose that the credential is on their record while the panel that would confirm it
is absent.

**What should happen:** the prose should key on the same flag the panel does.

**Why it matters more than it looks:** the whole point of the guard the tenure
work asks for — *"`submit_final_exam` wants the same guard immediately before it
writes the `credential_awards` row"* — is to return a graded pass while refusing
the award. That is `pass` + `credential_awarded: false` by construction. The screen
is not ready for the state the roadmap is about to create.

**Fix:** split the copy — one body for `pass && credential_awarded`, one for
`pass && !credential_awarded` that says plainly why (tenure not yet met / the
membership was refunded) and what happens next.

---

## The Final Exam header and its pass mark are counted from two different numbers

**Severity:** MINOR
**Confidence:** high on the code; whether `payload.size` can differ from
`payload.items.length` is a server question I could not check
**Where:** `src/screens/exam/FinalExamScreen.tsx:432-433` vs `:442-444`

The sub-bar reads `PASS {passMark}/{examSize}` where
`examSize = payload.size > 0 ? payload.size : payload.items.length`, while the
header reads `{qIdx + 1} OF {payload.items.length}`. `[33]` deliberately moved the
pass mark onto `payload.size` so it could not drift from the result screen — and
in doing so left the two figures on the same screen reading from different
sources. If a payload is ever served short, the learner sees *"1 OF 28"* beside
*"PASS 28/30"*, and is in fact graded out of 30 with 28 questions available: a pass
would require a perfect score.

**Fix:** derive both from `examSize`, and if `payload.size !== payload.items.length`
treat it as a malformed payload (the screen already has a
`payload.items.length === 0` refusal state at `:376`) rather than grading the
learner against questions they were never shown.

---

## Study credit is counted from `item_states` keys that may no longer belong to the topic

**Severity:** MINOR (latent; becomes real the first time a term is swapped out of a
topic)
**Confidence:** high on the formula, unknown on content churn
**Where:** `src/features/study/api.ts:281-299`

```ts
for (const key of Object.keys(states)) {
  if (key.startsWith('_')) continue;
  …
  credit += (v.correct ?? 0) >= 1 ? 1 : 0;
}
return Math.min(100, (credit / totalItems) * 100);
```

`credit` is counted over whatever keys the user's stored `item_states` happens to
contain; `totalItems` is today's item count for the topic. The two are never
intersected. Remove five terms from a topic and add five others and the learner is
credited for the five they will never see: `credit` stays at 20, `totalItems` stays
at 20, the method reads 100%, the gate opens, the quiz unlocks. `Math.min(100, …)`
guarantees the arithmetic never looks wrong.

Adding items without removing any is safe (the percentage drops, the gate closes —
the correct direction). Only removal, or removal-and-replacement, is affected.

**Fix:** pass the topic's current item id list into `studyDisplayPct` and count
credit only for keys in it. That also makes the clamp unnecessary, which is worth
having: a clamp on a ratio is where a counting error hides.

---

## Certificate topic lists ignore `is_required`, while program lists honour `is_elective`

**Severity:** MINOR
**Confidence:** medium — the asymmetry is certain, the effect depends on whether
any `certificate_topics` row has `is_required = false`
**Where:** `src/data/v3Curriculum.ts:186-198` vs `:143-164`

`fetchV3ProgramsStrict` selects `is_elective` and splits the rows into
`topicsGs` / `electivesGs`. `fetchV3CertsStrict` selects `is_required` in the same
breath and then never reads it — every row goes into `topicsGs`. If any
certificate has an optional topic, every client-side certificate denominator
(the detail modal's `coreCount + c.topics.length`, the enrolled-bundle count on
Profile, the nearest-credential ranking) counts it as required and under-reports
progress.

**What would settle it:** `select count(*) from certificate_topics where
is_required = false;`. If it is zero, this is latent and should be left with a
comment saying so — the same disposition `waveB` gave B-2 for program electives.

---

## The credential celebrations cannot fire — nothing calls them

**Severity:** MINOR
**Confidence:** high
**Where:** `src/features/celebration/celebrationQueue.ts:39`, `:72`;
`src/features/celebration/catalog.ts:215-285`

`credentialCelebration()` and `resolveCelebrations()` have no caller anywhere in
`src/` — the only references outside the module are in `test/celebration.test.ts`.
So the six credential-tier celebrations (`first-certificate`, `certificate-earned`,
`first-program`, `program-complete`, `multiple-credentials`, and the combined
screen the docblock calls *"the owner's spec"*) are unreachable. Earning a
certificate produces the Final Exam result screen and nothing else; earning one by
the auto-issue path (finding 1) produces no notice at all.

Only the method/stage picks in `useMethodCelebration` are wired (via
`pickCelebration` on the Dashboard and the direct `navigate('Celebration', …)` in
`QuizScreen.tsx:176`).

**Fix:** wire `credentialCelebration` where credentials become visible. Given
finding 1, the honest hook is the Achievements/CredentialWall refresh comparing
`fetchMyCredentials()` against the persisted seen-set (`celebrationSeen` already
scopes by credential id — its docblock says so), not the exam screen.

---

## Gain Staging completes on viewing, though the spec says its challenge must be passed

**Severity:** MINOR
**Confidence:** high on the mismatch between the file's own rule and its table;
I did not open the Gain module registry to confirm a troubleshoot module exists
**Where:** `src/features/lab/labCompletion.ts:12-16` vs `:89-96`

The completion rule in the docblock reads: *"the two genuine challenges (Signal
Detective, Gain Troubleshoot) → PASS"*. The table implements that for one of
them only:

```ts
af_signal_detective: [PASS_UNIT],
af_gain_staging:     GAIN_MODULES.map((m) => m.id),   // viewed, not passed
```

`markLabUnit` is called on view for hub modules, so Gain Staging completes by
opening its modules. Because completing every `audio_fundamentals` lab marks
gs3081 — a standing co-requisite of **every** certificate and program — this is a
credential requirement satisfiable without passing the challenge the spec names.

**Fix:** either add a `PASS_UNIT` to `af_gain_staging`'s required set (and mark it
only on a real pass), or correct the docblock so the rule and the table agree. The
first is what the spec says; the second is a one-line honesty fix if the owner has
since changed the rule.

---

## The Academy-at-a-Glance counts can be overwritten by their own cache

**Severity:** MINOR (cosmetic; stale-by-one-day numbers)
**Confidence:** high
**Where:** `src/features/curriculum/academyStats.ts:45-73`

Two independent async paths both call `setStats`: an AsyncStorage read and the
`get_academy_stats` RPC. Neither is sequenced against the other, so if the RPC
resolves first (fast network, cold disk) the cached read lands afterwards and
replaces fresh values with yesterday's. The numbers are small and slow-moving, so
this is a cosmetic ordering bug, not a wrong-number bug.

**Fix:** a `let freshLanded = false;` set in the RPC branch and checked in the
cache branch.

---

## Checked and found correct

Stated because "I found nothing in X" is a result.

- **`topicOverallPct` / `methodDisplayPct` / `smoothMethodPct`**
  (`features/dashboard/topicPct.ts`). Divide-by-zero guarded (`keys.length === 0`
  → 0; `totalItems <= 0` → 0), a single `Math.floor` applied once at the end over
  un-rounded per-method values, and one helper genuinely shared by the Dashboard
  and `useEnrollmentProgress` — I checked both call sites and they pass the same
  arguments, so the B-087 Dashboard-vs-Enrollments drift cannot recur. The one
  rounded gate (`scenarios`, `topicPct.ts:35`) is pass-1's finding, not mine.
- **The staged unlock**, arithmetically. `flashcardsSeenAll` → `homeworkPowered`;
  `flashcardsSeenAll && coreHomeworkComplete` → `scenariosPowered`;
  all four → quiz (`DashboardScreen.tsx:1255-1266`). The comparisons are `>= 100`
  against un-rounded values, so 99.6% cannot open a stage. Note for the record:
  this is *stricter* than the rule in the project memory ("flashcards 100% → the 3
  homework methods"), because scenarios is held behind the two core homeworks; the
  in-code citation is owner 2026-08-13, which post-dates the memory note, so I read
  the code as current and this as a memory-staleness item rather than a bug.
- **Retakes do not overwrite a better score.** `submit_quiz` writes
  `best_genuine_score = greatest(v_prev_best, v_score)` and only `quiz_score` is
  overwritten by the latest attempt. `quiz_score` is never read by the client — I
  grepped: the only consumer is `best_genuine_score` at `DashboardScreen.tsx:1847`.
  A retake after a pass is forced to `is_practice` (`v_is_practice := (v_status =
  'complete')`), and the practice branch touches no progress row, so a bad practice
  run cannot demote a completed topic.
- **Partially-answered submissions** grade correctly: `submit_quiz` iterates
  `quiz_attempt_items`, not the submitted answers, so an unanswered slot yields
  `v_sel = null` → `grade_one` false → counted wrong, and the item still appears in
  `wrong_answers`. No slot can be skipped by omission.
- **Timeout and void score nothing, consistently.** Both skip the
  `attempt_status = 'submitted'` block entirely, so neither can advance
  `best_genuine_score`, `status`, `date_earned` or `quiz_attempts`. The result
  screens render the outcome, not a fabricated score
  (`FinalExamResultScreen.tsx:58` gates the score block on `pass | no_pass`).
- **No double-award.** `credential_awards` carries
  `UNIQUE (user_id, credential_type, credential_id)` (verified live in
  `waveB`), so the auto-issue trigger re-firing cannot produce a second row, and
  `fetchMyCredentials`'s un-deduplicated `.map` is safe in practice.
  `student_badges` has `UNIQUE (user_id, badge_name_snapshot)` and `submit_quiz`
  inserts `on conflict … do nothing`, so a badge cannot be earned twice.
- **The trophy cannot be granted for the wrong topic.** `v_trophy` is set only
  inside `if v_new_status = 'complete' and v_prev_status <> 'complete'`, scoped to
  `v_att.achievement_id`. Celebrations are scoped the same way —
  `celebrationSeen` keys on `${topicId}:${id}` and `pick()` is only ever called
  with the committed topic's own progress.
- **A trophy cannot be shown as earned when it is not.** Every consumer tests
  `status === 'complete'` against the server row — `TopicsScreen.tsx:172`,
  `achievements/api.ts:118`, `awards/api.ts:126`. `'passed_incomplete'` is handled
  as its own state everywhere and never counted as earned.
- **`fetchAwardProgress` fails honestly** — it checks `reqErr` and the combined
  `achErr ?? progErr ?? credErr` and returns `null`, which the screen renders as a
  real failure with a retry. It is the one reader on this axis that gets the
  error-vs-empty distinction right, which is what made findings above visible by
  contrast.
- **`ProgressRing`** clamps `progress` to 0..1 and renders track-only for `null`;
  no NaN path.
- **`labCompletion`'s required-unit table covers all 15 `LabKey` values**, so no
  fundamentals lab is silently unable to complete; `markLabUnit` is correctly
  no-op'd while a membership preview is active (`:308`), so a preview cannot walk
  a paid lab into gs3081 credit.
- **`fmtEarned` / `fmtDate`** handle unparseable timestamps without rendering
  "Invalid Date".

## Deliberately not re-reported

Pass 1 and the wave audits already own these, and I verified rather than
re-filed: the client-vs-server quiz gate divergence and the zero-item topic lock
(`pass1-study-flow` #2, #3); `resolveItemCounts` swallowing its error
(`pass1-study-flow`); the scenarios rounded gate; `required_passes` being inert
(also `waveB` B-4); the `member_since` reset on renewal and the receipt-reuse
issues (`pass1-entitlement`); the A-1/A-2 RLS forge (`waveA`, `waveF` blocker #1)
— except where it is the mechanism behind my finding 1, where I cite it;
nearest-credential ranking ignoring co-reqs (`waveB` B-5); program electives
(`waveB` B-2); Profile `completeCount` not being v3-scoped (`waveB` B-3 — still
present at `profile/api.ts:122`, still masked by the clamp, and still able to make
Profile's "Topics completed" exceed the hub's "X / 166").

I confirmed the pass-1 quiz-percentage fix landed correctly:
`QuizScreen.tsx:173-178` now converts to a percentage against `questions.length`
and makes `perfect-score` reachable. That fix is also the proof that the right
denominator is available on the surfaces that still use `QUIZ_SIZE`.

## What I could not check

- **The live database.** Specifically: the body of `evaluate_user_credentials`
  (finding 1), whether the tenure migration has since been applied, how many v3
  topics serve fewer than 30 quiz items (finding 3), whether `award_required_topics`
  can return a duplicate id, and whether any `certificate_topics` row has
  `is_required = false`.
- **`start_final_exam` / `submit_final_exam` / `build_final_exam_payload`.** No
  copy of their bodies exists in the repo; everything I say about them comes from
  the client's error vocabulary, the migration's instructions and the deploy doc.
  In particular I cannot confirm whether `p_submitted_at` is clamped server-side.
- **No device or simulator run.**

## Suggested order

1. Finding 1 and finding 2 are one decision, not two fixes. Until the owner says
   what issues a credential, neither can be closed — and the A-1 RLS lock is a
   precondition for either answer.
2. Finding 3 (quiz denominator / pass mark) is client-only, self-contained, and
   the numbers it corrects are on a graded surface a customer will dispute.
3. Finding 4 (silent zeros) and finding 5 (two counts for one credential) are both
   small, local client fixes with no server dependency.
4. Finding 6 (clock skew) wants the one-line server clamp; the client half can
   land independently.
