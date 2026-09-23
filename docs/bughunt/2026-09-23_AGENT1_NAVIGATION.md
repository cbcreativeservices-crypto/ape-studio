# Agent 1 — navigation & goal paths (2026-09-23, overnight)

Raw agent findings. **Unverified at time of writing** — each is checked against
source below by me before any fix. Agents in this repo have a history of
plausible-but-wrong findings; nothing here is acted on until confirmed.

---

## A1-1 · Final Exam spinner is an inescapable screen on iOS
- `src/screens/exam/FinalExamScreen.tsx:587-594` (guard `:511`), route options
  `src/navigation/RootNavigator.tsx:409`, stack options `:345`
- Path: Award Progress → Take Final Exam → accept briefing. If `startFinalExam`
  (or the final submit) hangs, the screen renders only `<ActivityIndicator/>`.
- `FinalExam` is a ROOT-stack route with `headerShown: false` and
  `gestureEnabled: false`. The Android back interceptor deliberately skips this
  branch (`if (!payload || submitting) return;`), which leaves Android's system
  back working — but iOS has no header, no swipe and no button. Force-quit only.
- `src/features/finalExam/api.ts:515` reportedly states "there is no request
  timeout anywhere in this app".
- Existing pattern to copy: `GateHold` in
  `src/features/lab/withMembershipPreview.tsx:59-90` — after a few seconds, says
  what is happening and offers GO BACK.
- Agent confidence: verified-in-source. Severity: traps the user.

## A1-2 · A zero-term topic locks its study chain and every credential needing it
- `src/features/study/api.ts:298` (`if (totalItems <= 0) return 0;`) via
  `src/features/dashboard/topicPct.ts:53-83` → `DashboardScreen.tsx:1310-1335`
- `resolveItemCounts` (`src/features/dashboard/api.ts:135-177`) fills from
  `topic_term_counts`, which GROUP BYs — a topic with no rows yields no row, so
  `?? 0`. Percentage is then 0 forever: flashcards never "seen all" → homework
  never powers → scenarios never power → quiz never unlocks.
- The scenarios exemption rescues scenarios only, not the other three methods.
- `AwardProgressScreen.tsx:299-302` keeps saying "Complete every required topic
  and lab to unlock the Final Exam" against a requirement that cannot reach 100%.
- Agent confidence: gate arithmetic verified; whether production actually has a
  zero-term topic is INFERRED. **← this is the part to check against the DB**
- Severity: traps the user.

## A1-3 · "Retake the Career Finder" pushes a duplicate instead of returning
- `src/screens/careerfinder/CareerFamilyScreen.tsx:214` and `:217`
- Both call `navigation.navigate('CareerFinder')`. StackRouter NAVIGATE reuses
  only the FOCUSED route, so an existing CareerFinder lower in the stack is
  ignored and a second copy is pushed. Stack becomes
  CareerFinder → CareerFamilyList → CareerFamily → CareerFinder; three backs to
  leave what looks like one screen.
- Correct idiom already used at `AwardsScreen.tsx:738`,
  `CareerFamilyScreen.tsx:74`, `EnrollmentScreen.tsx:872`,
  `FinalExamResultScreen.tsx:164`.
- Agent confidence: verified-in-source. Severity: wastes the user.

---

## Reported clean (agent's own negative results, useful to keep)
- Self-navigation (the 244cc811 class): built a 136-route map, scanned each
  screen + transitive imports to depth 4. **Zero live hits.** Both historical
  cases visibly fixed.
- `popTo` vs `navigate` correct everywhere else checked.
- Error/empty states on AwardProgress, FinalExam, Quiz, Results,
  CalcWorkflowRun, Paywall, Flashcards, Directory and the three admin screens
  all carry an exit; several carry a retry.
- 31 "no exit" hits were labs routing back through `LabShell.tsx:357` — fine.
- Cold deep links: `linking.ts` pins `initialRouteName: 'Splash'` and
  `SplashScreen.tsx:76-96` carries pushed routes over a `Main` base, so there is
  always something beneath.
- `withAmplitudeOrientation` / `withMembershipPreview` gate holds both settle.

---

# VERIFICATION (by me, after the agent returned)

## A1-1 — CONFIRMED, FIXED (`58747788`)
Checked every link of the claim in source:
- root stack really does set `headerShown: false, gestureEnabled: false`
  (`RootNavigator.tsx:345`) and the route re-asserts the gesture (`:409`);
- the waiting branch really renders only an ActivityIndicator;
- the Android back interceptor really skips it (`if (!payload || submitting)`),
  so Android keeps system back and **iOS had nothing**;
- `api.ts` really does say "there is no request timeout anywhere in this app…
  the screen would sit on a spinner" — the codebase already knew.

Fixed in two halves because they carry different risk. The start-hang gets an
escape; the submit-hang gets a 25s bound instead, because an escape there would
abandon a graded sitting (`enqueueExamSubmission` is in the CATCH, which a stall
never reaches). Bounding is safe only because the server is idempotent —
`IF a.result_payload IS NOT NULL THEN RETURN a.result_payload`, read from the
live definition. **My own heuristic query claimed "not idempotent" and was
wrong; the function body settled it.**

## A1-2 — MECHANISM REAL, TRIGGER ABSENT. Not fixed, deliberately.
The gate arithmetic is exactly as described: a topic with no `glossary_topics`
rows produces no row in `topic_term_counts`, `?? 0` makes its percentage 0
forever, and the whole flashcards → homework → scenarios → quiz chain stays
locked, with the award checklist still promising a goal that cannot be reached.

**But it cannot happen on today's data.** Queried live:

```
topics_with_zero_terms : 0
live_topics            : 166
fewest_terms           : 69
```

So this is a LATENT hazard, not a live bug, and "fixing" it would mean changing
correct code against a hypothesis. Recorded instead:

⚠️ **For A / content ops:** if a topic is ever made active BEFORE its terms are
mapped, that topic's credential becomes permanently unreachable with no message
anywhere. Worth a standing check:

```sql
select a.id, a.name
from achievements a
left join glossary_topics gt on gt.achievement_id = a.id
where a.is_active and a.curriculum_version_id='a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72'
group by a.id, a.name having count(gt.glossary_id) = 0;
```

The app-side alternative — treat a confirmed-empty topic as 100%, the same shape
as the existing scenarios exemption — is a real option but it is a RULING about
what completion means, so it is sidelined for the owner rather than assumed.

## A1-3 — CONFIRMED, FIXED
Both call sites used `navigate('CareerFinder')`; the same file already uses
`popTo` for 'Main' fifteen lines earlier, with the RN7 warning written on it.
Checked the functional risk before swapping: the Career Finder keeps answers in
a STORE, not component state, and carries its own RESET & START OVER — so
returning to the existing instance loses nothing and "Retake" still works.

## Agent accuracy this run
3 findings · 2 confirmed and fixed · 1 real mechanism with no live trigger ·
**0 false positives.** Notably the agent's own negative results (136-route
self-navigation sweep, deep-link stranding, gate holds) were thorough and are
worth keeping — they narrow where agents 2 and 3 should look.
