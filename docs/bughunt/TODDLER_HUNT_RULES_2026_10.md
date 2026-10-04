# FULL-APP BUG RUN: shared rules for every area agent (2026-10-01 evening)

App: AP&E Studio, a pro-audio training app (Expo SDK 57, React Native, Supabase, Skia, reanimated, TypeScript).
Repo: C:\Users\profe\dev\ape-studio, branch audio-tools-engine.

The owner ordered TWO complete bug runs through the ENTIRE app, one after the other, with every issue fixed. After that the lead PUBLISHES to testers. Anything you break ships to phones, so be careful and prove each fix.

You are one of 10 area agents in one run. Find real bugs and FIX them. The lead commits after each run.

Read docs/APE_BUG_HUNT_STANDARD.md (method: R1 receipts, R2 verify the test, hunt the silent failures) and docs/bughunt/BRIEF.md (the ledger; don't re-report).

## What changed today (re-audit hard; new code has the most bugs)
- NEW Drum Tuning Lab: src/screens/lab/drumtuning/**. It now sits in Pitch & Tuning (labCatalog).
- Mastering (src/screens/lab/mastering/**) and Room Design (src/screens/lab/roomdesign/**, src/features/roomdesign/**). Each had a standards pass and 3 toddler passes today.
- GUEST CARRY ON SIGN-IN (owner ruling 2026-10-01): lab work a guest does in this app session is written to the account they sign in to in the same session. Never to a different identity after a sign-out. Preview earns nothing. A relaunch is a new session. This touched the shared lab kit and stores. Audit it everywhere: the identity checks, a merge never losing credit, sign-out then a different sign-in carrying nothing.
- The shared lab nav strip (kit/LabNavBar, useLabNav), full screen (rack/StageFullScreen; it ALWAYS opens at 1×), and the Tuning/Amp rack rebuilds (earlier today).
- "Mute audio when I leave the app" (src/features/audio/leaveAppMute.ts) and the 20-minute session.
- The store-notifications refund rule (server; read-only for you): refund = membership ends the same day; cancel = ends at the end of the paid cycle. The client entitlement must agree: status 'refunded' is not a member.

## Hunt: "toddler + cat + TIMING"
- Double and triple taps, and mashing.
- Taps while loading, or before the entitlement tier resolves.
- Back or swipe mid-action. Leave and return. Background mid-action.
- Rotation, including during popups and full screen.
- 375×667 phones, iPad, and Larger Text (font scale 1.3).
- Empty data. Network failure or slowness mid-request.
- Guest / free / member / lapsed / refunded accounts.
- Account switch leaking data.

TIMING bugs specifically:
- races between async loads and taps;
- stale closures;
- setState after unmount;
- timers, listeners, intervals and rAF loops not cleared;
- generation fences missing on stores that hydrate;
- unhandled promise rejections;
- debounce/lock windows that swallow legitimate taps or let doubles through;
- animations that outlive their screen;
- audio that keeps playing after leave, mute or background;
- iOS Modal-over-Modal (use `afterDialogCloses` / HOST_DISMISS_MS);
- popups that never appear, or appear twice.

SILENT FAILURES, which the prime directive cares about most: something fails, the failure is caught or simply absent, and the UI reports success. Examples: "Saved" when nothing was written; credit shown but not stored; a store whose failed READ is then overwritten by a write.

## How
- Read carefully; you cannot run a phone. Make the smallest direct fixes, matching the surrounding style.
- Every fix needs a receipt: a node:test regression test in test/ (source-reading or pure-module) that FAILS before the fix (R2: prove it by copying the fixed file aside, restoring the old one, running the test, then restoring; never git stash/checkout), or a precise code-path proof. Without a receipt the item goes on the SUSPECTED list, unfixed.
- Name new test files `<area>FullRun{1|2}_20261001.test.ts`.
- Before finishing, run `npx tsc --noEmit` and `npm test`, and add no failures. Others edit concurrently, so note unrelated failures but don't fix them.
- You MAY use a web preview, but ONLY on your own new `.claude/launch.json` entry (ports 8130–8139, one per area as assigned). Add it to BOTH the repo's `.claude/launch.json` and C:\Users\profe\.claude\launch.json. Never touch 8091/8092. Stop your server at the end. (The repo's .claude/launch.json already has local edits; append your entry only.)

## HARD RULES
- Do NOT launch sub-agents. Do the whole area yourself.
- No git state changes (commit, stash, checkout, reset). No eas. No native code or new packages (a native dependency breaks OTA). No database writes.
- Edit ONLY files in your area. Shared-file bugs go in your report unless your area owns them.
- Use the Edit tool; keep each file's line endings. Python writes CRLF unless newline=''.
- Do not touch: docs/APE_ACCESS_CODES_2026_08_21.sql, docs/APE_COMP_CODES_GUIDE_2026_09_07.md, supabase/functions/validate-purchase/index.ts, docs/CROSS_SESSION_HANDOFF.md, or any image file.
- Owner rules:
  - Never use raw Alert.alert (use confirmDialog/notify). Popups, never pulldowns.
  - Low-Light: nothing auto-appears (useOverlaysSuppressed).
  - Members never see "free" or upsell copy. Never mention institutional/academic mode.
  - Labs never block navigation. Credit is never removed. Every lab ends with the "what's left" screen.
  - Lab display text ≥ 9 pt. A cropped readout drops its label, never its number. Full screen opens at 1×.
  - Levels use levelColor.ts. Never draw stylized audio. Meters use SharedValues, never per-frame React state.
  - The nav strip law (test/labNavLaw.test.ts).
  - Don't change wording unless it is factually wrong. Respect deliberate decisions recorded in comments. No refactors.
- Honest counts only. No padding, no style nits. A low count is fine if it is the truth.

## FINAL REPORT
1. COUNT fixed: new bugs, and separately corrections to earlier fixes.
2. A numbered list: severity | file:line | scenario | fix | receipt.
3. Bugs outside your area that you did not fix (file:line, scenario, proposed diff).
4. The SUSPECTED list.
5. tsc and npm test results.

## RUN 2 additions
- Run 1 is committed as 5691609c.
- FIRST re-audit every run-1 fix in your area for regressions and incompleteness: read your area's *FullRun1_20261001* test file and use `git show 5691609c -- <your paths>`, which is read-only and allowed.
- Then audit the whole area again, deeper: the paths run 1 didn't touch.
- Report corrections separately. This is the final run before publish, so be strict and fix only real bugs.

# ===== OVERRIDES FOR THE EVENING HUNTS (2026-10-02, owner away) =====
These three passes follow the pattern hunt, which closed the major classes centrally. The owner expects SIGNIFICANTLY LOWER counts. Report honestly either way.

## New since the runs above (read first)
- Read AGENTS.md "HOUSE HELPERS" and docs/APE_GOVERNANCE_DECISIONS_2026_10_02.md (D44–D49). Every fix MUST use the house helpers:
  - createLocalStore, startFenced/armFence, safeGoBack, useBackWhileFocused, useModalHandoff/opensModalScreen, useLatchedPress, useTier, useDecorativeMotion, fitValue;
  - calc sign/range classes and snapWhole;
  - the bounded Supabase client.
- The ratchet guard tests (localStoreGuards, startFence, supabaseFetchBounded, patternP5/P6/P8/P9/P9b/P10/P10b/P11/P12/P13/P14/P16/P18/P20, labNavLaw, accountWipeRegistry) must stay green.
  - NEVER widen an allowlist.
  - If one of your fixes removes an allowlisted site, shrink the allowlist.
- Owner rulings D48 decide judgement calls: favor consistency and learning outcomes.
- Run the tests with `node --test --test-timeout=120000 "test/**/*.test.ts"`. Never edit package.json.
- Name test files `<area>Evening{1|2|3}_20261002.test.ts`.
- Another ccode session may also touch this repo (the web/ launch page). Do not touch web/.

## Pass numbering
- Pass 1 base: HEAD after the end-of-day docs (86f4a4d2 or later).
- From pass 2 on, FIRST re-audit the previous pass's fixes in your area (`git show <PREV_SHA> -- <your paths>`), then audit deeper.
- The lead fills in <PREV_SHA>.

## PASS 2 (lead note)
- PREV_SHA for pass 1 is 6c1ee968. Re-audit it with `git show 6c1ee968 -- <your paths>`.
- The G1 guard was then tightened (d6caa5cc). It is now AST-based: comments don't count, multiGet is covered, and each read is judged on its own failure path. A per-site SAFE_ON_FAILED_READ opt-out list was added. Do NOT add opt-outs to dodge a real bug.
- Test files for this pass are named `<area>Evening2_20261002.test.ts`.

## PASS 3 (FINAL) lead note
- PREV_SHA for pass 2 is dcc9057d. FIRST re-audit pass 2's fixes in your area (`git show dcc9057d -- <your paths>`; your *Evening2_20261002* test). Then do a last full audit.
- This is the final hunt. Be strict: report only REAL bugs, with receipts. A very low count is the honest and expected result.
- The lead runs a final fix round afterwards. List any judgement call or cross-area item clearly instead of half-fixing it.
- Test files for this pass are named `<area>Evening3_20261002.test.ts`.

## HUNT 4 (2026-10-03, single pass) lead note
- Since hunt 3: the final rounds A/B (8eec742b), the owner rulings (34d77504: tierReadFailed / NOT CONFIRMED, OSHA warnings, glossary share), the shared failed-save notice (73c310cc: saveFailureNotice.ts; createLocalStore reports by default; reportFailure:false opt-outs ratcheted), and the legacy cleanup (4aba33fb: armSaveFailureReport; a syntax-tree ratchet over every AsyncStorage write). Re-audit these where they touch your area; they are the newest code.
- The owner hopes for FEWER THAN 10 bugs app-wide. Report honestly, and only real bugs with receipts. Zero is a fine answer.
- Test files for this pass are named `<area>Hunt4_20261003.test.ts`.

## HUNT 5 (2026-10-03, single pass) lead note
- Since hunt 4 (10dc1565) these landed; they are the newest code, so re-audit them where they touch your area (`git show <sha> -- <your paths>`):
  - 1e9f0f9d tier sweep: memberGateOf/useMemberGate/guestWordingAllowed/useGuestWording/MEMBERSHIP_NOT_CONFIRMED in tier.ts/useTier.ts, ~20 screens, withMembershipPreview GateUnconfirmed;
  - f88cbb5b: lab in-lab guest wording via accountWhy (labEnd.ts) in Sound Systems/Drum/Room/Cable Install, calc runner SAVE; glossary capped only for a known non-member; READ_UNANSWERED no-re-send of a timed-out term.
  - Check in particular that NOTHING UNLOCKS on a failed membership read (members-only content stays closed), that a real known guest/free user still gets the right lock/upsell, and that no screen is stuck on "checking" forever after tierReadFailed.
- supabase/migrations/2026100301_glossary_term_reads_24h.sql is a DRAFT for Comp A: do not apply or edit it.
- Hunt 4 found 9. Report honestly; only real bugs with receipts. Zero is a fine answer.
- Test files for this pass are named `<area>Hunt5_20261003.test.ts`.

## HUNT 6 (2026-10-03, single pass) lead note
- Since hunt 5 base 29b2ed4c: hunt 5 fixes 38dc0a4a (tier gate gaps, lastTierCache softDeadline, upsellAllowed remembered-free, glossary rolledBack + popup gate, P2 load tickets, calc workflowStore quarantine on the write chain + workflowListUnreadable + SAVED summaryRef, Cymatics OPEN mode states, Tools ToolGatePending) and the tidy 401bb4bf (failed-check buttons/rows, "Checking your account…", Cymatics studio notify, CalcWorkflowEdit load states). These are the newest code: re-audit them in your area first (`git show 38dc0a4a -- <paths>`, `git show 401bb4bf -- <paths>`).
- No app-wide changes landed between hunt 5 and this hunt, so the count should reflect the real remaining bug rate. Report honestly; only REAL bugs with receipts; zero is fine. Do not re-report owner calls: EarLab/LabCategory open before first read; Dashboard study switches on 'unconfirmed'; glossary metering of an unconfirmed reader.
- supabase/migrations/2026100301 is a DRAFT for Comp A: do not touch.
- Test files: `<area>Hunt6_20261003.test.ts`.

## HUNT 7 (2026-10-03, single pass) lead note
- Base HEAD c2864ab1 (PUBLISHED to builds 33/16 at cce28e83 — this code is on testers' phones).
- Newest code since hunt 6 (78f3638d), re-audit in your area FIRST:
  - 8be3c78e final rounds C+D: HomeSetupSheet draftFromReadList; AttractCue focus; LabReviewButton reviewCreditLine; LabPreviewOverlay armEnd; guestWordingOf 'unknown'→checking; StudyFsOverlay copy; Light Pulse checking notice; SignalGen mountedRef; SPL isSplCalibrationUnreadable; CableInstall unreadToldRef; flaggedStore readTermList; safeSessionResult (accessCode, tubeRefs); Profile credsFailed; WeeklyConcept missing vs error; localSchedule advanceSeenCount; glossary limit wording + SESSION_FALLBACK_CHARGED.
  - 00e3869b calc: DBU_REF_V / P_REF_PA / SPL_OF_1_PA; NIOSH 80–140; reflectionShorter; 70 V 1 dB; listProblem / LIST_THOUSANDS; calcPanel list warning; finishRun; loadTicket on Workflows/Results; ~12 workspace edge fixes.
- Governance D50–D54 (docs/APE_GOVERNANCE_DECISIONS_2026_10_03.md) and AGENTS.md HOUSE HELPERS (useMemberGate gating vs useUpsellAllowed/useGuestWording wording; three list faces; calc constants) are binding.
- Do NOT re-report D54 owner calls. Report honestly; only REAL bugs with receipts; zero is fine. Hunt 6 found 15 + 1.
- Test files: `<area>Hunt7_20261003.test.ts`.

## HUNT 8 (2026-10-03, single pass) lead note
- Base HEAD = the commit after dcb9b28f (PUBLISHED to 33/16 — this code is on testers' phones).
- Newest code, re-audit in your area FIRST:
  - 3c9cb22f hunt 7: enrollmentStore sync hydrate guard + useEnrollmentReadState; dashboard api myUserRowOrThrow + safeSessionResult; safeSessionResult AuthRetryableFetchError; Ear/Amp/Tuning/Signal Detective save notices; glossary popup re-probe + cross-link detail; Exposure history / Measurements / calc loading faces; employer amIVerifiedEmployer null; Cymatics tone.error; calc list-comma, divider, comb, pctNoLevel.
  - 215d7f25: calc `refusal?: true` + costsACalculation (refusals cost nothing; free users see only refusal words; workflows treat refused step as not done); lab hubs ProgressUnreadableNote / PROGRESS_UNREADABLE + read-only unreadable queries in Ear/Amp/Tuning/paged/Sound Systems/labCompletion/labVisits.
- Two DEEP-DIVE agents run alongside you (completion/credentials and community/employers). If you find something squarely in their topic, report it in §3 rather than half-fixing it.
- Report honestly; only REAL bugs with receipts; zero is fine. Hunt 7 found 21 + 4.
- Test files: `<area>Hunt8_20261003.test.ts`.

## HUNT 9 (2026-10-03, single pass) lead note
- Base HEAD 3131eae3 (PUBLISHED to 33/16 at 49b00dc6 — on testers' phones).
- Newest code, re-audit in your area FIRST: d44fcee4 (hunt 8 + deep dives):
  - Splash → splashRoute.ts (safeSessionResult; retryable refresh → Main); timeTrial hasAccount + enrollment sync safeSessionResult; exposure monitor today-credit of the held second; calc vdrop refusal split (dropBreaksDownWhy / dropBreaksDownFigures); WeeklyConcept params; Profile load tickets + registry latch; Glossary ShortReadNote; Cable lesson12 + Amp mod8 unreadable faces; LabReviewButton note; Dashboard Custom List readTermList; Topics/Gallery failedRef; Celebration announce key; ExportPanel grammar.
  - Completion: FinalExamResultScreen PASS_NOT_ISSUED; EXAM_PASS_NOT_ISSUED_COPY; fetchNearestCredential myUserRowOrThrow; LabRequirementsSheet CREDENTIAL_LAB_PROGRESS_UNREADABLE.
  - Community: rules.ts readableError ordering + new mappings; MyProfileView credsFailed; EmployerSection focus reload + ticket.
- Server fixes are APPROVED and with Comp A (docs/COMP_A_SERVER_FINDINGS_2026_10_03.md) — do not re-report those; client-side issues only (read-only DB checks allowed, never write).
- Still owner calls / do not re-report: D54 items except the Splash one (now changed); request notifications/unread counts; module-open save notice.
- Report honestly; only REAL bugs with receipts; zero is fine. Hunt 8 found 16 (+ deep dives 8).
- Test files: `<area>Hunt9_20261003.test.ts`.

## HUNT 10 (2026-10-03, single pass) lead note
- Base = the commit after 991dddd1 (PUBLISHED to 33/16 — on testers' phones).
- Newest code, re-audit in your area FIRST: 3ba06aa9 —
  - URGENT sweep: EntitlementProvider boot + INITIAL_SESSION null re-read via safeSessionResult (no guest wipe when timedOut; deriveWithRetry; seeds identity baseline on first real uid); profile api fetchProfile/registry 'unavailable', fetchMyQrTokenOrThrow throws; employer application 'error', amIVerifiedEmployer null; AuthScreen Guest Mode refuses while an account is stored or unknown; CourseSelection sessionUnknown; quiz start retry.
  - Hunt 9: deviceKey mintNow timedOut→network; GlossaryLockView rootModalHoldMs; publicProfile registry OFF cancels sync timer; EmployerSection pickedLoaded; Profile catalogue reload; exposure stale-session gap close; Measurements unreadable header; Drum ch6 heardDistinct; GalleryArt retrySave; tone.error (Harmony/Analog/Foundations/StartHere); calc portLength split, cv70 steps, refused report; rules.ts timeout + "no such member"; share link strict token; LabChecklist unreadable rows; Dashboard sign-out queue flush.
- Do not re-report: approved server items with Comp A; D54 owner calls; request notifications/unread counts; module-open save notice; free-refusal bisection (owner design).
- Report honestly; only REAL bugs with receipts; zero is fine. Hunt 9 found 17 + 2 (+9 sweep).
- Test files: `<area>Hunt10_20261003.test.ts`.

## HUNTS 11–13 (2026-10-04 overnight, owner asleep) lead note
- FIRST read the lead's reassessment: C:\Users\profe\AppData\Local\Temp\claude\C--Users-profe\404f795e-0247-4a3c-9b18-9ebc8937db5d\scratchpad\known_issue_catalog_2026_10_04.md — check EVERY class K1–K12 in your area, and re-audit section B (today's perf/caching/lazy-screen code) FIRST: memo/caching can create stale-UI bugs.
- Owner: "dig deep and look for errors in every corner and under every rug." Report honestly; only REAL bugs with receipts; zero is fine.
- Test files: `<area>Hunt11_20261004.test.ts` (then Hunt12, Hunt13). The lead fills the base HEAD in each prompt.

## HUNT 12 lead note (base c0debb14)
- Hunt 11 (1c5a74c4) found 18 + 2. Newest code to re-audit FIRST in your area: 1c5a74c4 — myUserRowOrThrow throws on AuthRetryableFetchError (check EVERY caller handles a throw honestly: retry face, never "0"/"none"/guest); clip-load `failed`/`clipError` states (Ear, Mixing, Tuning "NO SOUND", Drum, Mastering); exposure advisory Low-Light hold + prune epoch; consent withdraw; profilePrefetch reset; RequestsView onBlocked; Settings savesMade; parseQuantity GROUPED_BY_SPACES (Room Design roomParse + Production cellNum use it too); academyStats freshLanded; StudyAreaExplore dead-catalog; TopicWelcomeSheet; Glossary null INITIAL_SESSION skip.
- Hunt-11 leftovers the lead wants FIXED this round if real (owner rule: consistency + learning outcomes):
  - CALC: micsRf FSPL constant 147.56 → exact for c = 299 792 458 (D53 accuracy; update steps text consistently).
  - LABS A/B: Mixing + Mastering quiet pre-render keeps rendering after blur (sibling push) — cancel on blur, consistent with Drum.
  - LABS B: Cymatics GalleryScreen.loadArt treats an unreadable artwork list as empty (thumbnails silently uncoloured) — honour patternsUnreadable / unreadable stand-in; modMeterC hydrateSolved has no generation check across a wipe.
  - COMMUNITY: achievements/api.ts identityKey hand-rolls getSession (K1 consistency) → safeSessionResult.
  - Do NOT change: GlossaryPrefetchRoot on remembered tier; calc tierPending on remembered 'free' (policy: remembered free = known); Home landing on remembered tier.
- Test files: `<area>Hunt12_20261004.test.ts`.

## HUNT 13 (FINAL overnight) lead note (base 642fb8a2)
- Hunt 12 (b5b323ce) found 27 + 1. Re-audit it FIRST in your area (`git show b5b323ce -- <paths>`): publicProfile remoteRead + listingSig; SessionExpiryGuard + readDeviceAccountMarker; achievements identityKey; finalExam currentUserId/start retry; quiz start 'unknown'; scenario notSentAsLearner; recordUnit gen fence; LabUnderstandingCheck passed effect; patternStore guest carry (carryIn); Mixing/Mastering blur cancel; exposure settleIdle; Dashboard enrollRead/starredUnreadable/claimStudyOpen; Glossary meterKnown heads-up + ENTRIES_CACHE wipe + Recent unreadable; Enrollment pctText; Directory registry name; Career Finder START; micsRf FSPL; roomParse.
- Leftovers the lead wants FIXED this round if real (consistency + learning outcomes):
  - SHARED + LABS A: RackUnit full screen — bezel onPress cells and dock action keys bypass leaveFullThen (Harmonics THD opens a Modal over the full-screen Modal; Tube REF navigates under it). SHARED adds an opt-in `leavesFull?: boolean` on BezelItem and the 'action' DockParam in rackTypes.ts and wraps those in RackUnit with leaveFullThen; LABS A then sets leavesFull: true at HarmonicsView.tsx:1638 and VacuumTubeLabScreen.tsx:127 (coordinate: SHARED lands the type first; LABS A re-reads before editing and waits/retries if the type isn't there yet).
  - ACCOUNT: flaggedStore — add `useTermListUnreadable(kind)` and `useBookmarksUnreadable(ctx)` (useSyncExternalStore on s.subscribe/s.isUnreadable). GLOSSARY then uses them for the Custom (★) and Bookmarks unreadable faces (same wording pattern as Recent). ACCOUNT also: ProfileScreen bundle/catalogue tallies show "0 of N" on unread progress → "—" (same rule as Enrollment pctText).
  - GLOSSARY: GlossaryTermPopup 42501 "allow its temporary device ID" wording for a signed-in reader whose refresh failed → safeSessionResult; timedOut → load error wording.
  - LABS A: Production projectStore guest carry (same pattern as patternStore carryIn: holdSessionWork guestOnly + registerSessionCarry merge by id, newer updatedAt wins, never over unreadable).
  - STUDY: fetchStudyRowsByIds (starred deck) on glossary_study_v can pass the 1000-row page → page it (readAllPages pattern, fixed order).
- Test files: `<area>Hunt13_20261004.test.ts`.
