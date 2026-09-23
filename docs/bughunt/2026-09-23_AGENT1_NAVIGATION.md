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
