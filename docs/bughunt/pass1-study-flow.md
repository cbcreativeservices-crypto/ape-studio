# Pass 1 — Study / Learning flow bug hunt

**Date:** 2026-09-17 · **Branch:** audio-tools-engine · **Scope:** Dashboard → Flashcards → Matching → Fill-in-the-blank → Scenarios → Quiz → Results / Celebration / Trophy

---

## What I examined

Read in full:

- `src/screens/dashboard/DashboardScreen.tsx` (gate block 1214–1400, rack rows 1660–1830, quiz block 1820–1920, load path 700–1000)
- `src/screens/quiz/QuizScreen.tsx` (all 629 lines)
- `src/screens/results/ResultsScreen.tsx`, `CelebrationScreen.tsx`, `TrophyScreen.tsx` (all)
- `src/features/quiz/api.ts`, `submissionQueueStorage.ts`, `submissionQueueStorage.native.ts` (all)
- `src/features/celebration/` — `types.ts`, `catalog.ts`, `celebrationQueue.ts`, `celebrationSeen.ts`, `useMethodCelebration.ts`, `Celebration.tsx` (all)
- `src/features/dashboard/topicPct.ts`, `src/features/dashboard/api.ts` (`resolveItemCounts`, `fetchEnrollmentDashboard`)
- `src/features/study/` — `scenarioExempt.ts`, `localProgress.ts`, `sync.ts`, `studyQueueStorage.ts`, `api.ts` (`studyDisplayPct`, `fetchTopicItems`, `fetchMethodState`)
- `src/features/commercial/studyGate.ts`, `src/features/enrollment/enrollmentStore.ts`, `src/config/devMode.ts`, `src/lib/confirm.ts`, `src/components/AppDialog.tsx`, `src/navigation/RootNavigator.tsx`, `src/navigation/types.ts`
- Study screens: `FlashcardsScreen.tsx`, `MatchingScreen.tsx`, `FillInBlankScreen.tsx`, `ScenariosScreen.tsx` (load paths, empty-state branches, credit/answer paths)
- **Server truth:** `REMOVE_V1_REMNANTS_2026_09_03/30_APPLY_quiz_functions.sql` — the repo's most recent definition of `start_quiz_attempt` and `submit_quiz`. This is where several findings below were confirmed.
- `git show 6ee9d250~1:src/screens/quiz/QuizScreen.tsx` — the pre-celebration routing, to confirm what the new wiring dropped.

Ran: `npx tsc --noEmit` → **clean, exit 0**. `npm test` → **1429 pass / 0 fail / 210 suites**.

## What I could NOT check

- **The live database.** I did not query Supabase. So I cannot say *which* topics today have zero glossary items, which list `scenarios` in `applicable_methods` while having no scenario questions, or what `study_methods.min_engagement_seconds` / `accuracy_threshold` / `requires_accuracy` are set to. Those values decide whether **#2** and **#3** fire for real users right now, or only in principle. Every mechanism below is verified in code; the *incidence* is not.
- **No device / simulator / browser run** (dev server is owned by another process).
- **`glossary_study_v`'s definition** is not in the repo. It is the numerator's source while `glossary_topics` is the denominator's source (see #3, note), so a row-level difference between them would be another permanent sub-100% gate. I could not rule that out.

---

## Passing the quiz reports the wrong score, as a percentage

**Severity:** blocker
**Where:** `src/screens/quiz/QuizScreen.tsx:164` and `:167`; `src/features/celebration/catalog.ts:144`

**What happens:** A learner passes the topic quiz with 28 correct out of 30. The celebration screen reads:

> **TOPIC COMPLETE**
> *Professional Audio Safety*
> **FINAL QUIZ: 28%**

They are told they scored 28 percent on the quiz they just passed. A perfect 30/30 reads "FINAL QUIZ: 30%".

**Why:** `SubmitResult.score` is a **raw count of correct answers**, not a percentage. Confirmed on both ends:

- Server: `30_APPLY_quiz_functions.sql:247` — `if v_ok then v_score := v_score + 1;` and the payload is built with `'score', v_score`.
- Client: `ResultsScreen.tsx:133-134` renders `<Text>{result.score}</Text><Text>/ {QUIZ_SIZE}</Text>` — i.e. "28 / 30".

QuizScreen passes that count straight into the celebration values:

```ts
values: { topic_name: topicName, score: Math.round(result.score) },
```

and the catalog template is `stat: 'FINAL QUIZ: {score}%'`. Nothing converts. The same defect is latent in `'quiz-not-passed'` (`stat: 'YOUR SCORE: {score}%'`, catalog.ts:103) and `'score-improved'` (`{new_score}%` / `{previous_score}%`, catalog.ts:118-121) — those two are not raised yet, but they will be wrong the day they are.

This is a graded surface. The repo already has the precedent: `[46] 2026-09-11` removed a stale "24+" from ResultsScreen specifically so "the copy can never misstate the requirement on a graded surface again."

**Fix:** Convert at the call site in `QuizScreen.doSubmit`, where the denominator is known:

```ts
const total = payload.questions.length;
const pctScore = total > 0 ? Math.round((result.score / total) * 100) : 0;
const perfect = result.score >= total;   // see finding #5
(navigation as any).navigate('Celebration', {
  id: perfect ? 'perfect-score' : 'topic-complete',
  values: { topic_name: topicName, score: pctScore },
  ...
});
```

Add a comment at `CelebrationValues.score` (types.ts:96) stating the unit is **percent, 0–100**, since three catalog rows already assume it.

---

## The client quiz gate and the server quiz gate are two different computations

**Severity:** blocker
**Where:** `src/screens/dashboard/DashboardScreen.tsx:1255-1266` vs `REMOVE_V1_REMNANTS_2026_09_03/30_APPLY_quiz_functions.sql:133-137`; error copy at `src/features/quiz/api.ts:88`

**What happens:** The Dashboard quiz panel lights green and reads **`READY` / `ALL GATES MET`**. The learner taps Start. The quiz screen says:

> Study requirements are not yet met for this topic. **See the quiz block for what remains.**

…and offers only **Back**. They go back to the quiz block, which says *ALL GATES MET*. There is nothing to do and nothing to retry. The topic can never be passed.

**Why:** The two gates share no code and check different things.

Client (`allMethodsComplete`, DashboardScreen:1255-1266):

```ts
const flashcardsSeenAll    = methodPct('flashcards')   >= 100;
const coreHomeworkComplete = methodPct('fill_in_blank') >= 100 && methodPct('matching') >= 100;
const scenariosComplete    = methodPct('scenarios')     >= 100;   // 100 if device-local exemption
const allMethodsComplete   = flashcardsSeenAll && coreHomeworkComplete && scenariosComplete;
```

`methodPct` → `smoothMethodPct` → `studyDisplayPct`, which counts credited entries in `item_states` over `itemCountByTopic`. It knows nothing about time or accuracy.

Server (`start_quiz_attempt`):

```sql
select count(*) into v_gate_fail from (
  select m as method_key from achievements a,
    unnest(coalesce(a.applicable_methods, array[]::text[])) as m where a.id = p_achievement_id) req
left join study_methods sm on sm.key = req.method_key
left join student_method_progress smp on ... and smp.is_applicable = true
where smp.id is null or sm.id is null
   or (not coalesce(smp.trial_passed,false) and (
        smp.completion_pct < 100
     or smp.engagement_seconds < sm.min_engagement_seconds
     or (sm.requires_accuracy and smp.answered_count = 0)
     or (sm.requires_accuracy and smp.answered_count > 0
         and (smp.correct_count::numeric / smp.answered_count) * 100 < sm.accuracy_threshold)));
if v_gate_fail > 0 then raise exception 'study_gate_unmet'; end if;
```

Four independent ways for the client to say READY while the server refuses:

1. **The scenarios exemption is device-local only.** `scenarioExempt.ts` writes `ape:scenariosExempt` to AsyncStorage; `smoothMethodPct` (topicPct.ts:53) returns 100 for an exempt topic. The server has no idea. If a topic lists `scenarios` in `applicable_methods` but has no scenario questions, the client unlocks and the server refuses — and the Scenarios screen has nothing for the learner to complete. **Permanently unpassable.**
2. **`engagement_seconds < sm.min_engagement_seconds` is a time gate the client does not model at all.** The v3 rule of record is "flashcards seen-once / others correct-once / **NO timer**", and the Dashboard implements exactly that. The SQL still enforces the timer. A fast learner is refused.
3. **`requires_accuracy` / `accuracy_threshold` are likewise unmodelled client-side.** 100% completion with poor accuracy → READY, then refused.
4. **`applicable_methods` is the server's list of required methods, and the client explicitly declares it untrustworthy** — DashboardScreen:1225-1227: *"The backend `applicable_methods` column is incomplete/legacy (e.g. DAW gs3970 omits scenarios), so it is NOT authoritative here."* Whichever side is right, they disagree, and only one of them is the one that actually blocks the attempt.

Compounding it: `study_gate_unmet` is deliberately excluded from the retry path (`QuizScreen.tsx:395`, `canRetryStart` is only `offline | unknown`), which is correct in principle — a retry would just re-fail — but it means the only exit is Back, into a screen asserting the opposite.

**Fix:** Two parts, and the first is cheap enough to land before launch on its own.

1. **Stop the copy lying.** `QUIZ_START_ERROR_COPY.study_gate_unmet` must not say "See the quiz block for what remains", because in this failure mode the block says nothing remains. Replace with something that admits the disagreement and gives an action, e.g. *"The server hasn't recorded every study requirement for this topic yet. Open each study method once more — if this keeps happening, contact support."*
2. **Make the client gate mirror the server's, or make the server tell the client why.** The real fix is for `start_quiz_attempt` to return the failing `method_key`s in the exception detail (or a companion `quiz_gate_status(achievement_id)` RPC) so the Dashboard can render *"Scenarios: 0% recorded on the server"*. Short of touching the frozen backend, the Dashboard should at minimum stop reporting `ALL GATES MET` when the scenarios exemption is what satisfied the gate — that is precisely the case it cannot vouch for.

---

## A topic with zero glossary items locks its entire rack forever, with no message

**Severity:** blocker
**Where:** `src/features/study/api.ts:287`; `src/features/dashboard/api.ts:130-181`; `src/screens/dashboard/DashboardScreen.tsx:1241,1255-1266`

**What happens:** The learner opens a topic. Flashcards reads 0% and the switch says **Start**. They tap it and get *"This topic has no flashcards yet."* + Back. Every other panel in the rack is a dead unlit cap, and the quiz reads **LOCKED / GATES UNMET**. There is no button anywhere that can change that. The topic sits in their deck permanently at 0%, dragging down the enrollment progress readout, and nothing on screen explains that the topic is empty rather than that they have not started it.

**Why:** the denominator is zero and the formula floors instead of exempting.

```ts
// src/features/study/api.ts:281-299
export function studyDisplayPct(states, totalItems, methodKey, _requiredPasses = 1): number {
  if (totalItems <= 0) return 0;      // ← a topic with no items reads 0%, forever
  ...
}
```

`rackItemCount` is `data.itemCountByTopic.get(topic.id) ?? 0` (DashboardScreen:1241). `resolveItemCounts` sets no entry when a topic has neither direct `glossary_topics` rows nor a same-named sibling with rows, so the map lookup falls through to `0`.

From there the staged unlock is a chain of impossibilities: `flashcardsSeenAll` is false → `homeworkPowered` false → `scenariosPowered` false → the learner can never *reach* the Scenarios screen, which is the only thing that can call `markScenariosExempt` → `allMethodsComplete` false → quiz locked.

The asymmetry is the giveaway. All four study screens detect the empty case and offer an exit (`FlashcardsScreen.tsx:1192`, `MatchingScreen.tsx:413`, `FillInBlankScreen.tsx:341`, `ScenariosScreen.tsx:233`), but **only Scenarios records it**:

```ts
// ScenariosScreen.tsx:233-241
if (!hw.rounds.some((r) => r.length > 0)) {
  void markScenariosExempt(achievementId).then(() => emitStudyProgress());
```

The exemption mechanism that exists precisely to stop "its quiz is locked FOREVER" (scenarioExempt.ts:8-9) was never extended to the other three methods.

Note on a related, unconfirmed variant: the **denominator** comes from `glossary_topics` (`resolveItemCounts`, unmasked) while the **numerator's item universe** comes from `glossary_study_v` (`fetchTopicItems`, entitlement-masked, api.ts:54). If the view can ever return fewer rows than the table for the same `achievement_id`, that method caps below 100% and produces the same permanent lock without even looking empty. I could not read the view definition to rule this out — worth a single SQL check before launch.

**Fix:** Make an empty item set satisfy the gate rather than fail it, in the one shared place:

```ts
// src/features/dashboard/topicPct.ts — smoothMethodPct
if (key !== 'scenarios' && itemCount <= 0) return 100;   // nothing to study = nothing outstanding
```

and give the three non-scenario screens the same `markMethodExempt(achievementId, key)` call Scenarios already makes, under the identical rule (a *successful* load that returned zero items — never an error/offline load). Then have the rack label an exempt method "No content" rather than showing a green ✓ for work that was never done. Note this only unsticks the *client*; the server gate (#2) must agree or the quiz will still refuse.

---

## Two server errors have no copy and get an infinite "Try again" button

**Severity:** blocker
**Where:** `src/features/quiz/api.ts:99-115`; `src/screens/quiz/QuizScreen.tsx:395-411`; `src/features/commercial/studyGate.ts:42`

**What happens:** A non-member taps a paid topic's quiz. They see:

> Could not start the quiz. Try again.
> **[ Try again ]  [ Back ]**

Try again re-fails. It will always re-fail. There is no upgrade prompt, no explanation, and no indication that the answer is "buy a membership".

**Why:** `start_quiz_attempt` raises `academy_required` (SQL:108) and `archived_quiz_retired` (SQL:104). Neither is in the client's routing table:

```ts
// api.ts:99-108
const KNOWN_ERRORS: QuizStartError[] = [
  'safety_prerequisite_incomplete', 'study_gate_unmet', 'under_lockout', 'topic_locked',
  'not_enrolled', 'version_mismatch', 'pool_too_small', 'user_not_found',
];
```

`parseStartError` finds no match, the message contains neither "network" nor "fetch", so it returns `'unknown'` → *"Could not start the quiz. Try again."* And `'unknown'` is on the retry list:

```ts
const canRetryStart = startErrorCode === 'offline' || startErrorCode === 'unknown';
```

so the screen offers a button that cannot ever succeed.

The Dashboard *does* try to catch this earlier with `actMembershipLocked` → `setUpgradeOpen(true)` (DashboardScreen:1901-1904), but that gate fails **open** while entitlement is resolving, by design:

```ts
// studyGate.ts:42
if (!resolved) return false;   // member-favouring until the server read lands
```

So on a cold start, tapping the quiz inside that window sends a non-member straight to `academy_required`. The two sides also define "free" differently — the client hardcodes `FREE_ENROLL_GS = [3060, 3970]` (`enrollmentStore.ts:43`) while the server reads `achievements.always_free` (SQL:99). Any drift there routes a legitimately-free topic into the same dead end.

Separately, `'safety_prerequisite_incomplete'` is in `KNOWN_ERRORS` but is never raised by this version of the function — harmless, but it means the table has not been reconciled against the SQL in a while.

**Fix:**

```ts
export type QuizStartError = ... | 'academy_required' | 'archived_quiz_retired';

const KNOWN_ERRORS: QuizStartError[] = [..., 'academy_required', 'archived_quiz_retired'];

QUIZ_START_ERROR_COPY.academy_required =
  'This topic is part of the Academy membership.';
QUIZ_START_ERROR_COPY.archived_quiz_retired =
  'This quiz has been retired. Return to the Dashboard.';
```

In `QuizScreen`, give `academy_required` an **Upgrade** action that opens the same `StudyAccessSheet` the Dashboard uses, and remove `'unknown'` from `canRetryStart` (or cap it at one retry) so no unrecoverable error ever ships an infinite retry button.

---

## The perfect-score celebration can never fire

**Severity:** serious
**Where:** `src/screens/quiz/QuizScreen.tsx:164`

**What happens:** Nobody ever sees the `perfect-score` celebration. A 30/30 learner gets the ordinary `topic-complete` screen (reading "FINAL QUIZ: 30%", per #1).

**Why:** Same root cause as #1 — `result.score` is a count, capped at `QUIZ_SIZE = 30`:

```ts
const perfect = result.score >= 100;   // max possible value is 30
```

The whole `'perfect-score'` catalog row (catalog.ts:155-169) is dead code.

**Fix:** `const perfect = result.score >= payload.questions.length;` (use the served count, not `QUIZ_SIZE` — the SQL accepts variable-size v3 quizzes: `v_pass_mark := greatest(1, v_n - 2)`).

---

## The badge earned on a quiz pass is silently dropped

**Severity:** serious
**Where:** `src/screens/quiz/QuizScreen.tsx:165-173` vs `git show 6ee9d250~1:src/screens/quiz/QuizScreen.tsx`

**What happens:** A learner passes a quiz that grants a badge. The server inserts the badge row and returns `badge_earned: true`. The app never mentions it. The badge appears in the Trophy Case with no explanation of when or how it was earned.

**Why:** The old routing carried it into a screen that rendered it. The new routing does not read it at all.

Before (verified via git):

```ts
(navigation as any).navigate('Trophy', {
  topicName, achievementId,
  badgeEarned: result.badge_earned,      // ← consumed by TrophyScreen
  entrySource: 'quiz_win',
});
```

`TrophyScreen.tsx:112-118` renders that as *"You earned **&lt;BADGE&gt;** — View on Profile"*, fetching the name from `achievements.badge_trigger`.

After, `result.badge_earned` is never referenced. The server still grants it (`30_APPLY_quiz_functions.sql:268-273`, `v_badge_earned := true`), and `SubmitResult.badge_earned` is still in the type (api.ts:61) — it just goes nowhere. The trophy *image* is gone from the win path too; the celebration is text-only and "SEE IN TROPHY CASE" lands on `AchievementsHome` rather than the trophy just earned.

**Fix:** Add a `badge_name` value to `CelebrationValues` and a conditional body line to the `topic-complete` / `perfect-score` catalog rows (the `fill()` contract already renders an absent value as nothing, types.ts:152-157, so the line self-hides when no badge was earned). Pass `context.trophy = { topicName, achievementId, badgeEarned }` and point `trophy-case` at `navigation.replace('Trophy', context.trophy)` when it is present, so the button reaches the trophy that was actually earned.

---

## A failed item-count query silently zeroes every meter and locks every rack

**Severity:** serious
**Where:** `src/features/dashboard/api.ts:139-142`, `:157`, `:163-166`

**What happens:** A learner with a fully-completed topic opens the Dashboard after a network blip or an RLS change. Every meter reads **0%**, every homework panel is dark, every quiz reads **LOCKED / GATES UNMET**, and the enrollment progress readout drops to 0. There is no error, no banner, no retry — it looks exactly like a learner who has done nothing. Pull-to-retry appears to "work" and changes nothing.

**Why:** `resolveItemCounts` destructures only `data` and throws the error away, three times:

```ts
const { data: direct } = await supabase.from('glossary_topics')
  .select('achievement_id').in('achievement_id', topicIds);
for (const r of (direct ?? []) as {...}[]) { ... }   // error → direct is null → empty map
```

The returned map is empty, so every `itemCountByTopic.get(id) ?? 0` yields `0`, and `studyDisplayPct` returns `0` for `totalItems <= 0` — the same floor as #3, but now applied to the whole deck at once.

This is the one failure in the flow with *no* user-visible signal. `load()`'s own catch is bypassed entirely (nothing throws), and the silent-refresh guard at DashboardScreen:846 would suppress an error screen anyway once content is on display. Contrast `fetchMethodState` (study/api.ts:323-326), which at least `console.warn`s and returns `null` so the caller can fall back — `resolveItemCounts` does neither.

This is the precise shape of the `v3 cert/program RLS fix` already in the project memory: *"fetchV3* swallow errors→[] so denial was silent."* Same bug, different table.

**Fix:** Check the error on all three queries. On failure, either throw (so `load()`'s catch shows the real error state on a cold load) or return `null` and have the Dashboard render an explicit "Progress unavailable — retry" state. Never let a failed count read as a zeroed count, because zero is indistinguishable from "you haven't started" and it silently closes every gate.

---

## An offline quiz pass replayed later gets an alert instead of the celebration

**Severity:** serious
**Where:** `src/screens/dashboard/DashboardScreen.tsx:721-727`; `src/features/quiz/api.ts:226-253`

**What happens:** A learner finishes a quiz with no signal. The attempt queues. Hours later they open the app and get a plain modal:

> **Offline quiz submitted**
> Score 28/30 — full pass.

That is all. No `topic-complete` celebration, no trophy, no results review, no badge notice, no wrong-answer list. The identical attempt taken online produces a full-screen celebration with two actions. The learner who happened to be on a plane is quietly given the lesser experience for the more impressive achievement.

**Why:** the replay path was written before the celebration engine and never rejoined it:

```ts
const replayed = await replayQuizSubmissions().catch(() => []);
for (const { result } of replayed) {
  notify('Offline quiz submitted', `Score ${result.score}/${QUIZ_SIZE} — ${result.outcome.replace(/_/g, ' ')}.`);
}
```

`replayQuizSubmissions` returns `{ achievementId, result }[]` — everything needed (`result.outcome`, `result.score`, `result.badge_earned`) is right there and unused beyond the string. There is no topic *name* in the queue row, which is presumably why it was left as a notice; the row schema (`submissionQueueStorage.ts:8-15`) has `achievement_id` but no `topic_name`.

Two smaller points on the same path, both fine as they stand:

- Double-counting is **not** possible. `submit_quiz` short-circuits on a finalized attempt (`if v_att.result_payload is not null then return v_att.result_payload`), the queue row is deleted only after a successful call, and a hard reject drops the row (api.ts:244-250). Two concurrent `load()` calls could show the notice twice, but cannot record the attempt twice.
- This notice *is* the one place the score is stated correctly (`28/30`), which is what makes #1 stand out.

**Fix:** Add `topic_name` to the queued row, and in the replay loop route a non-practice `full_pass` through the same `navigation.navigate('Celebration', ...)` the online path uses (the Dashboard is already on a navigator that can reach the root stack). Everything else keeps the notice. At minimum, mention the badge when `result.badge_earned` is true.

---

## A guest or record-less account that reaches quiz READY dead-ends on "report this to your professor"

**Severity:** serious
**Where:** `src/features/quiz/api.ts:94`; `src/screens/dashboard/DashboardScreen.tsx:1362-1376`

**What happens:** A signed-out guest (or a signed-in account with no student record — the `strandedSession` self-heal path) studies a free topic to completion on the device-local mirror. The quiz panel lights up **READY / ALL GATES MET**. They tap Start and get:

> Account not linked to a student record — **report this to your professor.**
> **[ Back ]**

No retry, no sign-up prompt, and a line about a professor in a consumer app.

**Why:** Nothing gates the quiz switch on having an account. `rawQuizState` (DashboardScreen:1362-1371) derives only from `status` and `allMethodsComplete`; for a guest, `progressByTopic` is empty (`fetchEnrollmentDashboard` skips the progress queries when `userId === 'local'`, dashboard/api.ts:272) so `status` is `'locked'`, which falls through to the `allMethodsComplete ? 'ready' : 'locked'` branch. A guest's method rows come from `loadAllLocalMethodStates()` merged in at DashboardScreen:795-815, so all four methods can genuinely read 100% locally.

`startQuizAttempt` then hits `select id into v_user from users where auth_id = auth.uid(); if v_user is null then raise exception 'user_not_found'`. That code *is* routed, but to institutional copy, and `canRetryStart` excludes it so the only control is Back.

The red "Progress isn't saved without an account" notice (DashboardScreen:1669-1682) is shown to guests, but it is a banner above the rack, not an explanation at the point of refusal.

**Fix:** Gate the quiz switch on having a real account — when `guest || strandedSession`, the Start press should open the sign-in prompt rather than launching the attempt. And rewrite the `user_not_found` copy for the commercial app: *"Create a free account to take the quiz and save your progress."* with a **Sign in** action. There is no professor in this product.

---

## Scenarios is the one method whose gate still rounds up

**Severity:** minor
**Where:** `src/features/dashboard/topicPct.ts:35`

**What happens:** If `student_method_progress.completion_pct` for scenarios is ever `99.5` or above, the scenarios gate reads 100, the quiz unlocks, and the LED shows the green ✓ with a round still outstanding.

**Why:** The un-rounding is deliberate and documented everywhere else — DashboardScreen:1249-1252, *"Math.round turned 99.5% into 100, so a method with one unstudied item showed the green ✓ and unlocked the next stage early"*, and `topicPct.ts:19-20` repeats it. Then the scenarios branch does exactly that:

```ts
if (key === 'scenarios') {
  return Math.round(row?.completion_pct ?? 0);   // the one rounded gate
}
```

With three rounds the server value should land on 100 exactly, so this is latent rather than live — but scenarios is the **last** gate before the quiz, which makes it the worst one to leave rounded.

**Fix:** `return row?.completion_pct ?? 0;` — display rounding already happens separately at the call site (`const pct = Math.round(rawPct)`, DashboardScreen:1693).

---

## `required_passes` is a dead parameter that three comments claim is live

**Severity:** minor
**Where:** `src/features/study/api.ts:281-299`; `src/screens/dashboard/DashboardScreen.tsx:1289`, `:1689`; `src/features/dashboard/topicPct.ts:59-60`

**What happens:** Nothing, today — but anyone reading the Dashboard will believe the gate honours `study_methods.required_passes` when it does not. A future change to that column will silently do nothing.

**Why:** The parameter is threaded through four call sites and then ignored:

```ts
export function studyDisplayPct(states, totalItems, methodKey, _requiredPasses = 1): number {
  ...
  credit += (v.correct ?? 0) >= 1 ? 1 : 0;   // "Correct once = fully studied"
```

The underscore says the author knew. But DashboardScreen:1289 says *"smoothPct handles the required_passes fallback"*, :1689 repeats it, and topicPct.ts:59-60 says *"`rpFor` is the caller's required_passes lookup (falls back to 2 when study_methods is unavailable for a guest)"* — a fallback that cannot matter, since the value is discarded. Note that the study screens' deck ordering *does* use a 2-attempt notion (`MatchingScreen.tsx:152`, `FillInBlankScreen.tsx:239`), so the two ideas are live side by side.

**Fix:** Either honour it (`credit += (v.correct ?? 0) >= requiredPasses ? 1 : 0`) or delete the parameter and the `rpFor` plumbing entirely, and correct the three comments. Do not leave a dead knob that the comments describe as connected.

---

## A topic with no scenarios is congratulated for "working through every scenario"

**Severity:** minor
**Where:** `src/features/dashboard/topicPct.ts:53`; `src/features/celebration/useMethodCelebration.ts:51`; `src/features/celebration/catalog.ts:60-71`

**What happens:** A learner opens Scenarios on a topic with no scenario content, sees "no content", goes back to the Dashboard, and is told:

> **KNOWLEDGE IN ACTION** — SCENARIOS COMPLETE
> *You worked through every scenario and applied what you learned to realistic audio situations.*

They worked through nothing. The app is congratulating them for content that does not exist.

**Why:** `smoothMethodPct` returns a literal `100` for an exempt topic, which is right for the *gate* but is then read as an *achievement*:

```ts
pct: { ..., scenarios: methodPct('scenarios') },    // 100 via exemption
...
for (const key of METHOD_ORDER) {
  if (!id || (pct[key] ?? 0) < 100) continue;      // exemption is indistinguishable from work
```

The exemption and the completion collapse into one number with no way to tell them apart downstream.

**Fix:** Pass the exemption through separately — `pick()` should skip `scenarios-complete` when `isScenariosExempt(topicId)` is what produced the 100. The gate keeps its value; the congratulation does not fire.

---

## "FINAL QUIZ UNLOCKED — now it's time to show what you know" fires on a topic already passed

**Severity:** minor
**Where:** `src/features/celebration/useMethodCelebration.ts:114`; `src/screens/dashboard/DashboardScreen.tsx:1270-1281`

**What happens:** A learner who has already passed a topic's quiz — the panel reads `PASSED 29/30` — can be shown a notice announcing that the final quiz has just unlocked and inviting them to take it.

**Why:** `pick()` is handed `allMethodsComplete` and nothing else. It never sees `status` or `quizState`:

```ts
return allMethodsComplete ? offer('final-quiz-unlocked') : null;
```

The Dashboard builds `celebrationProgress` (1270-1280) without the topic's status, even though `status` is computed at line 995 and `quizState` at 1375. The reachable route in: any topic whose methods reach 100% *after* the quiz was passed — e.g. a scenarios exemption recorded later, or a device where the local mirror catches up after the pass.

Combined with #14 (below) it becomes the common case, not the rare one.

**Fix:** Add `quizPassed: status === 'complete'` to `MethodProgress` and skip the `final-quiz-unlocked` offer when it is true.

---

## Every celebration re-fires after a reinstall, a new device, or an account switch

**Severity:** minor
**Where:** `src/features/celebration/celebrationSeen.ts:21`

**What happens:** A learner signs in on a second device, or reinstalls, or switches accounts. Their server progress restores correctly — and the Dashboard then congratulates them, one dismissal at a time, for the flashcards / fill-in-blank / matching / scenarios / quiz-unlock of work they finished weeks ago.

**Why:** `ape:celebrationsSeen:v1` is AsyncStorage only. The hook's `hasLoaded()` guard (useMethodCelebration.ts:83-94) prevents acting on an *unloaded* record, which is the right guard for a cold start, but it cannot help when the record is genuinely absent. And the key matches the `ape:*` sweep that `clearLocalAccountData` runs on account switch (the same sweep `scenarioExempt.ts:86-92` documents), so switching accounts re-arms every celebration for the *new* account's already-completed topics.

**Fix:** Either scope the key per user id and accept the re-fire on a genuinely new device, or — better — suppress step/stage notices for any topic whose `status` is already `'complete'` on the server, which fixes this and #13 with one condition.

---

## The scenarios exemption does not survive a reinstall, re-locking a passed topic's rack

**Severity:** minor
**Where:** `src/features/study/scenarioExempt.ts:28`

**What happens:** On a new device, a topic that had no scenario content reverts to scenarios 0%. Its overall progress drops from 100% to 75% on both the Dashboard and the Enrollments readout, and the quiz re-locks unless the topic was already passed. The learner recovers by opening Scenarios once — but nothing tells them that, and the number they see is simply wrong until they do.

**Why:** `ape:scenariosExempt` is device-local by design (the docblock cites the frozen backend). Nothing re-derives it from the server, and `topicOverallPct` feeds the same value into `useEnrollmentProgress` (enrollmentProgress.ts:26,90), so the regression is visible in three places at once.

**Fix:** Re-derive it: when the Dashboard loads a topic whose `status` is `'complete'` but whose scenarios row is missing or 0%, mark it exempt. A passed quiz is proof the gate was satisfied. Failing that, have the Scenarios screen re-confirm in the background rather than requiring a visit.

---

## Raw Postgres error strings are shown to the learner on a failed submit

**Severity:** minor
**Where:** `src/screens/quiz/QuizScreen.tsx:207`

**What happens:** A submit that fails for a non-network reason shows:

> **Submit failed**
> attempt_not_open

**Why:** `notify('Submit failed', (e as Error).message, ...)` passes the raw RPC message through. `submit_quiz` can raise `attempt_not_found`, `not_owner`, `attempt_not_open`, `bad_serve_set`, `topic_locked`, `not_enrolled`, `version_mismatch` and `user_not_found` — none of which have client copy (the `QUIZ_START_ERROR_COPY` table covers *start*, not *submit*).

The surrounding handling is otherwise right: the latch is released (`submitted.current = false`) so a transient failure is recoverable, and the offline branch correctly keeps its latch.

**Fix:** Give the submit path its own copy table, defaulting to *"Your answers could not be submitted. Reopen the quiz to try again — your attempt is still open."* — which is true for every one of those codes except `attempt_not_open`.

---

## Two near-identical notices in a row after finishing scenarios

**Severity:** polish
**Where:** `src/features/celebration/useMethodCelebration.ts:107-114`; `src/features/celebration/catalog.ts:60-84`

The learner finishes scenarios, returns to the Dashboard, and reads *"SCENARIOS COMPLETE … Excellent work. The final quiz is next."* with **TAKE THE FINAL QUIZ**. They dismiss it; the component re-renders and immediately offers *"FINAL QUIZ UNLOCKED … Now it's time to show what you know."* with **START FINAL QUIZ**. Both buttons do the same thing (`scrollToEnd`). Two dismissals, one message.

The `pick()` loop returns the first unseen celebration, so the two are guaranteed to arrive back-to-back for the last method completed. Consider suppressing `scenarios-complete` when `allMethodsComplete` is true on the same pass — the stronger message already contains it.

---

## Web offline study batches are lost on reload, without the warning the quiz queue got

**Severity:** polish
**Where:** `src/features/study/studyQueueStorage.ts`

`submissionQueueStorage.ts` (quiz) is session-scoped and in-memory on web, and QuizScreen says so explicitly — *"Keep this tab open until you reconnect"* (QuizScreen.tsx:196). `studyQueueStorage.ts` has the identical limitation and says nothing: a browser reload while offline discards queued study progress silently. Phones use the SQLite siblings, so this is a browser-preview-only issue, but the asymmetry is worth closing while the fix is one `notify`.

---

## Checked and found nothing

These were traced deliberately and are, as far as I can tell by reading, correct:

- **Dev bypasses leaking into production.** `src/config/devMode.ts` — every flag is read through `devBypass()`, which is `__DEV__ && DEV_BYPASS[flag]`, so a release build is inert regardless of the values. `bypassQuizLocks` and `bypassMethodLocks` are both `false` anyway. The two consumers in the study flow (DashboardScreen:1254, :1376) are both correctly wrapped. No leak.
- **Quiz double-submit.** The `submitted.current` latch (QuizScreen:129-130) covers the timer, the focus-void and the last-question paths. `advanceTimer` is cleared before each reset and on unmount (:97-98). Per-question synchronous refs prevent same-tick multi-taps (`pickedRef` in FillInBlank:288, `answeredItemRef` in Scenarios:97). The latch is released only on a non-network failure (:206), which is the correct asymmetry. And the server is idempotent regardless (`if v_att.result_payload is not null then return v_att.result_payload`). I could not construct a double-count.
- **Offline replay double-counting.** `replayQuizSubmissions` deletes the queue row only after a successful RPC, breaks on a network error to preserve the queue, and drops a hard-rejected row rather than wedging. Two concurrent `load()` calls would show the notice twice but cannot record twice.
- **Focus-loss voiding.** The 2-second grace (QuizScreen:248) handles the iOS `inactive → background → inactive → active` sequence correctly (`blurStartedAt` is set on the first non-active and not reset by the second). `focusLossCount >= 2` matches the server's `v_focus_void := (coalesce(p_focus_loss_count,0) >= 2)`. ResultsScreen renders a live lockout countdown and withholds Retake until it reaches zero (:116).
- **Every exit from the Celebration screen.** All nine `CelebrationActionKind` values resolve to a valid destination. `view-results` uses the handed-through result (no re-fetch) and degrades to the Dashboard without context; `trophy-case` and `view-credential` reset to Achievements; `retry-quiz` / `start-quiz` deliberately return to the Dashboard rather than launching an attempt past its gating; the three unbuilt kinds fall through to the same exit as DONE with an explicit `no-fallthrough` disable. `Celebration` is registered on the root stack (`RootNavigator.tsx:316`) and `onRequestClose` maps to `dismiss`. No dead end.
- **Low-Light Production Mode and celebrations.** `formFor(tier, suppressed)` collapses every tier to the inline notice, no `Modal` is mounted, and the success haptic is skipped (Celebration.tsx:51-55). `CelebrationScreen`'s root style draws its own background for exactly that case (:129-133).
- **Flashcards "mark known" hiding a card.** Hiding is only reachable through `toggleKnown`, which also emits `{ kind: 'known', value: true }` and updates local state (FlashcardsScreen:1057-1060), so a hidden card is always a *credited* card. Hiding cannot strand the 100% gate. Unhiding never emits `known:false`, so progress cannot regress.
- **Fill-in-the-blank unanswerable items.** `fibSentence` always returns options; `hasBlank: false` still renders the four choices (`blankOut`, FillInBlankScreen:73-74). No item can be impossible to credit.
- **`applicable_methods` on the client.** Deliberately ignored — `const applicable = new Set(isCustom ? [] : METHOD_ORDER.map(m => m.key))` (DashboardScreen:1228). It cannot create a client-side stuck gate. (It creates a *server*-side one — see #2.)
- **Study progress persistence across backgrounding and relaunch.** `StudySession` flushes on `AppState !== 'active'` and again on `stop()`, serializes concurrent flushes so events recorded during a slow RPC are not dropped, persists to a durable SQLite queue on *any* failure rather than only network ones, coalesces per (achievement, method) on replay, chunks at 500 events, and drops only genuinely poisoned batches. `stop()` has a `finally` that queues anything left if the final flush threw. The device-local mirror (`localProgress.ts`) is merged over the server rows with a never-regressing `mergeItemStates`. This is the most carefully built part of the flow and I found nothing wrong with it.
- **Multiple stacked dialogs.** `showAppDialog` queues rather than dropping (`AppDialog.tsx:48-82`), so the replay loop's repeated `notify()` calls all appear.
- **`npx tsc --noEmit`** → clean. **`npm test`** → 1429 pass, 0 fail.
