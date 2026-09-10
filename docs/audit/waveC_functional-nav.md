# Wave C — Functional + navigation delta (release-readiness QA, 2026-09-10)

Scope: verify the 6 changes made this session didn't regress, + functional/nav/
dup-submit/empty-state/form-validation sweep of the real screens. Code review
(web preview can't populate session-gated screens). One MED fixed; rest LOW/filed.

## Regression check on this session's 6 changes — ALL SOUND
- **GalleryScreen** FlatList: keyExtractor unique (`spacer-${i}` vs achievementId),
  spacer is a plain non-interactive View (can't be tapped/navigated),
  ListEmptyComponent shows only on resolved-empty. Correct.
- **Offline cards** (Glossary/AchievementsHome/CredentialWall): flags reset to false
  on each `load()`, error shown only when there's no data, Retry re-runs load — no
  stuck state. Correct.
- **resolved-gate**: ToolsHub + AudioLearning degrade gracefully if `resolved`
  never flips; CourseSelection did NOT (see C-1, fixed). 
- **FinalExam** index→value resolution correct (pickSingle/confirmMulti/pickMatch);
  skip-unanswerable records '' and advances; `replace('FinalExamResult')` leaves
  AwardProgress beneath; double-submit guarded by `submitted.current`; hardware-back
  via confirmExit. Correct.
- **Directory removal**: no dangling `navigate('Directory')`; `DirectoryView` still
  rendered in the Awards pager. Clean.
- **subjectMeta gate**: returns empty while unratified; CurriculumScreen null-guards
  both description + careers → nothing renders broken. Clean.

## FIXED this wave
### C-1 [MED→FIXED] CourseSelection (Home) could hang on infinite spinner
CourseSelection gates first paint on `if (!cards || !resolved)`
(`src/screens/courses/CourseSelectionScreen.tsx:1363`), but `resolved` was flipped
only inside `EntitlementProvider`'s `getSession().then()` with **no `.catch`** —
a getSession rejection (secure-store read error) or a throw in the callback would
leave `resolved` false forever → Home stuck with no retry. **Fix (commit 6f46d8f):**
moved `setResolved(true)` to `.finally()` so first paint always proceeds.

## FILED — LOW
### C-2 [LOW] Gallery initial fetch shows header + blank body (no spinner/skeleton)
`GalleryScreen.tsx:42-50,122` — while `entries===null` (loading) the body is blank;
sibling screens show a loading state. Cosmetic.
### C-3 [LOW] Enrollment "Browse & Add" fetches have no `.catch`
`src/screens/enrollment/EnrollmentScreen.tsx:176-209` — the v3 curriculum/programs/
certs fetches `.then` without `.catch`; on failure the Browse list is silently empty
with no error/retry (the enrolled list from the local store still renders, so not a
hang). Add a visible error state for the browse section.
### C-4 [LOW] MyProfileView `persist()` no early-return while saving
`src/screens/directory/MyProfileView.tsx:121` — sets a `saving` flag but doesn't
early-return if already saving; realistically low risk (triggered behind a publish
confirm, not a raw submit button).

## Verified GOOD
- **Timed/guarded screens** (Quiz, FinalExam): hardware-back → confirmExit;
  `popToTop()` guarded by `canGoBack()`; force-submit/void/offline all guarded by
  `submitted.current`; no strand (empty-questions + start-error both offer Back).
- **Root-stack-over-tab nav** uses `popTo('Main', …)` (ToolsHub, Enrollment) to
  avoid the RN7 second-tab-shell bug. No reset-to-Splash strand (FinalExam's
  `replace` was the fix for the old one).
- **Double-submit guards** present on every network/financial mutation: Auth
  (busy→spinner replaces buttons), Quiz/FinalExam (`submitted.current`), Calc
  consume (`consuming`+ref+sig dedup), CareerFinder finish (`replace`+`canFinish`).
  Enrollment edits are idempotent local-store toggles.
- **Empty/error states**: Dashboard has a full error branch + Retry + Back-to-Login;
  CourseSelection self-heals to the bundled public catalog on fetch failure.
- **Form validation**: Auth (EMAIL_RE + passwordIssue + 6-digit OTP regex),
  access-code (trimmed, never blocks signup, explanatory alert), calculator
  (`!values` early-return, no NaN/crash) — all graceful.

## Filed items → owner
| ID | Sev | Action |
| --- | --- | --- |
| C-1 | MED | ✅ FIXED (6f46d8f) |
| C-2 | LOW | (optional) add a loading state to GalleryScreen |
| C-3 | LOW | Add a visible error/retry for Enrollment "Browse & Add" fetch failure |
| C-4 | LOW | (optional) early-return in MyProfileView.persist while saving |
