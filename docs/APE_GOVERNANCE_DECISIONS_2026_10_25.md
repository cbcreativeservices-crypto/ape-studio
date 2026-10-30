# Governance decisions, 2026-10-24 (late) → 2026-10-26 (D91–D101)

Continues `APE_GOVERNANCE_DECISIONS_2026_10_24.md` (D85–D90). Everything below is on the post-approval OTA branch `ota-after-approval-39-23`, unless it says website or server. The open items live in ONE place: `docs/APE_LAUNCH_MUST_DO.md` (D101).

## D91 · No shortcut to the quiz: the Time Trial is removed (owner 2026-10-24)

"We need to remove the time trial easy bypass for the quiz in flashcards — open pace settings. There should be no way for a person to pass without doing the work."

- **App, 99ab8484:**
  - no TIME TRIAL panel in OPEN PACE SETTINGS, no trial HUD or scoring;
  - `timeTrial.ts` deleted;
  - the gate formula no longer counts `trial_passed`;
  - a ratchet test guards it.
- **Server (Comp A, owner's go):**
  - `start_quiz_attempt` / `build_study_snapshot` stop honouring `trial_passed`;
  - `credit_time_trial` revoked;
  - existing passes reset.
- **Brief:** `docs/2026-10-24_CCODE_TO_COMP_A_REMOVE_TIME_TRIAL_SERVER.md`.

## D92 · One branch for the post-approval update (owner 2026-10-24)

Every change meant for the update after both stores approve goes on `ota-after-approval-39-23`, committed and pushed as it lands. JS/content only (fingerprint). This is PROTOCOL rule 18.

## D93 · The registry "verify" line is a real link to the member's OWN page (owner 2026-10-25)

"That link must match the user's unique qr code to open the same ID'd page so they can show some one their phone either way to prove their credential."

- It opens `registryUrl(qrToken)`, the same URL the QR encodes, which is already public on the website.
- Text: "Scan or tap to open your verification page". Commit a8cf616a.

## D94 · Sample certificates are visibly not printable (owner 2026-10-25)

- **Option B:** a charcoal "SAMPLE · NOT FOR PRINT" sash from lower-left through the lower middle and the seal.
- The seal is softened at 33% of the mock's level, then **+13%** (owner).
- The sample QR **stays sharp**: it opens the default page (owner).
- Baked into the image, rendered at 3× from the vector PDF.
- Commits 6d29a85c, 102879cc.

## D95 · Certificate signatory (owner 2026-10-25)

**Channing “Cháno” Booth · FOUNDER & CURRICULUM DIRECTOR**
- No "Professor" on the signature line; it stays on the website bio.
- The Academy name is not repeated after "Founder": it is printed beside the signature and in the header.
- Commit 0bbfde4b.

## D96 · A downloaded certificate has a readable file name (owner 2026-10-25)

`<Holder> - <Credential> Certificate - Pro Audio Training Academy.pdf`:
- accents folded;
- unsafe characters dropped;
- the holder part is left out when no name is set.

It falls back to the original file if the copy fails. Commit 931a0ff7.

## D97 · iPhone back-swipe (owner 2026-10-25)

**Owner's instruction:** "Be careful… dont blanket apply."

- **Profile and Progress tab roots:** an iOS left-edge swipe retraces the tabs to Home, matching Android BACK. Commit 1e272c8f.
- **The Explore pager stays as it is:** on Explore, a back swipe goes to the top of the long page; Home is the top button.
- **Study** (dashboard, methods, quiz, exam): no swipe, on purpose.
- **Audit of ~100 pushed screens:**
  - Groups A+B are ON: 25 screens with no sliders or drags, or guarded by a "discard changes?" check. Commit 1e914db5.
  - Group C (calculator workspace, production activity, RT60, spectrogram) stays off.
  - The 73 slider/drag screens stay off (2026-08-11 ruling).
  - Audit: Downloads `2026-10-25_IPHONE_SWIPE_BACK_AUDIT`.
- **Ratchet:** the "may only shrink" iOS swipe ratchet was grown by this ruling only. It shrinks only from here. `test/iosSwipeBackSet_20261025` pins the set.

## D98 · Purchase events to analytics move to 1.0.1 (owner 2026-10-26)

Purchase history is declared to Apple and Google for App functionality only. Adding analytics needs the "Analytics" purpose in both forms. It ships with the Meta SDK update, which changes those forms anyway.

## D99 · Launch audit, Task A (Comp A list 2026-10-25; owner 2026-10-26)

| Item | Ruling |
|---|---|
| 2 · Crash reports name the build's channel (preview ≠ production) | OTA, fcdab163 |
| 3 · TEMP lab probe | dev builds only (OTA, fcdab163) |
| 4 · Queued study time sent before a single-device forced sign-out | bounded 5 s (OTA, fcdab163) |
| 5 · "Save time-trial passes" | **VOID** (D91) |
| 6 · Paywall close button on a real device | ccode tests it on the Pixel over USB |
| 7 · "Onboarding tour once per account" | the tour = **the onboarding intro video**, once per ACCOUNT (today it's per device). The intro video itself is already the corrected cut (owner 2026-10-26) |

## D100 · Credential verification works from the printed code (owner 2026-10-25)

- **Website:** `/verify` and `/verify/<code>` are public on the gated site (exact match plus one segment, no cookie). audio-tools-engine 9ce8282d. Checked live: 200; `/about` and `/verify/a/b` still 401.
- **Server:** `public_verify_credentials` also accepts the 8-character code PRINTED on certificates (first 8 of `qr_token`). Before this, every printed code answered "No match". **Owner approved running it.** Comp A runs `docs/sql/2026-10-25_VERIFY_PRINTED_CODE_SQL/`. The dry run on live with a forced rollback = PASS.

## D101 · One launch must-do list (owner 2026-10-26)

"Let's not again forget things."

- `docs/APE_LAUNCH_MUST_DO.md` is THE list of everything owed after approval, on launch day and in 1.0.1.
- Add to it the moment something is deferred; remove only when it is done and verified.
- It is mirrored in memory (`launch-must-do-list.md`) and Downloads.
- PROTOCOL rule 19: read it before any "what's next".
- **First reconcile (2026-10-26) found one forgotten item:** 40 newer topic tiles never uploaded (must-do A3).
- **Second reconcile, same day: the root cause.** Claude Code keeps one memory folder per working folder.
  - Home-folder sessions saved to `.claude/projects/C--Users-profe/memory`.
  - ape-studio sessions saved to `.claude/projects/C--Users-profe-dev-ape-studio/memory`, so each saw only half.
  - The protocol hook is project-level, so home-folder sessions never got it.
  - The worktrees carry an old 11-rule protocol file.
- **Folded in from the other store:**
  - 32 newer certificate-card images never uploaded (A3b);
  - the labs-required switch, still OFF (A6);
  - the toddler-hunt server brief and the Terms zero-tolerance clause (section C).
- **Fixes:**
  - each memory index now points at the other;
  - PROTOCOL rule 20;
  - a user-level hook so every folder gets the one protocol (owner's go).

> **Numbering note (2026-10-26):** Comp A's own record uses D102–D109 (`claude/APE_GOVERNANCE_DECISIONS_2026-10-25.md`), so ccode continues at D110.

## D110 · The owner's change list, Progress + Flashcards + Glossary (owner 2026-10-26)

All on `ota-after-approval-39-23` (2e4cf973, 6578217a); they reach phones only with the post-approval OTA.

- **Progress:** order = Share your achievements, Certificates, Programs, Topics. Share is not a button: certificate + QR + /registry link (the website for a guest). Small certificates show the learner's REAL certificate (the PDF's HTML, drawn once); each opens that certificate. The Certificates wall row, popup and full screen show the real certificate too.
- **Popups with text scroll as one page** (the iPhone topic popup was stubborn).
- **Flashcards:** the ALL list opens with a tap; the red eye shows "FULL VIEW: Term + Definition Together"; DAW "Don't See a Term?" note, once ever (ALL list open 7 s, or the 30th card), naming the live topics (Equalization (EQ); Dynamics — Compression, Limiting & Gating (Core)).
- **Bookmarks list icon turns purple 0.4 s** on add/remove, in Flashcards and the Glossary.
- **"Research and learn more" / "View images" use the owner's browser-window icon** (WebLinkIcon), traced from the owner's art, approved in gray. A first globe version was rejected.

## D111 · Intro video once per ACCOUNT (owner 2026-10-26; D99 item 7)

- App half on the OTA branch (8403954e): Home asks the account before the video; no answer = the old per-device rule.
- Server half APPLIED by Comp A on the owner's GO (`users.intro_video_seen_at`, `my_intro_video_seen()`, `mark_intro_video_seen()`), verified by ccode read-only.
- The owner confirmed the iPhone (build 39) plays the correct new video.

## D112 · Instructor view scope (owner 2026-10-26, after a browser preview)

- A teacher sees the student's ENROLLED topics plus EVERY topic they completed, including before sharing (no date cut-off).
- Labs = the labs required by the CERTIFICATES of the enrolled topics, plus the `af_*` Audio Fundamentals labs (not programs, not all 227). Labs done outside that set show as "Other labs completed".
- Server change APPLIED by Comp A on the owner's GO via `private.student_scoped_labs`; verified Pro1 = 59 / 4 / 1.
- The instructor server side was decided and live since 2026-10-04 (what a teacher sees, student opt-in by code), so 1.0.1 = app UI only.
- Website `/instructor` page built locally on `web-launch-day` (34bd8929); the real-data check waits for Comp A's test instructor.

## D113 · Launch-day website (owner 2026-10-26)

- Gate-off for launch = ccode's 3dbb211b on `web-launch-day`; Comp A's 93a60ff is dropped.
- Legal pages = the live 10-24/25 texts plus what 10-22/23 added (merge 2549d94a): the 10-22/23 Terms rewrite with the D89 prices in all three places; a contradicting "handled through the stores" sentence now carries D89's own sentence.
- Terms 20.16 zero tolerance (owner-approved 2026-10-15) is in (bfb52ba0). Its "Our filter" paragraph is a hidden HOLD until Comp A confirms the live filter.
- The registry page says "Academy member" once (D6, 1e605767).
- All LOCAL; push = the owner's launch-day go.

## D114 · The recording engineer's uploads (owner 2026-10-26)

- "Comp A did not do audio engineer upload … you need to make that happen."
- The existing `/lab-upload` was reopened rather than building a new page. `lab_upload_config` was switched ON and the code ROTATED (the new code went to the owner in chat only, never stored).
- `/lab-upload` skips the site key (a3d805b2, pushed on the owner's GO); the upload code still protects it.
- Turn it OFF again when the engineer is done.

## D115 · The test Pixel runs build 23 (owner 2026-10-26)

- Build 20 was uninstalled (owner OK: a different signing key). Build 23 was sideloaded from the EAS AAB, signed with the debug key.
- D1: the paywall close button PASSES on it (✕, BACK, near-miss tap).

## D116 · The 1.0.1 plan (D4, 2026-10-26)

Downloads `2026-10-26_APE_1.0.1_PLAN`: Meta SDK + ATT, purchase events with the Analytics purpose first, the instructor view (UI only), location tag back, Fill-in/Matching review screens, camera `required=false`, the tuner phase-2 bench. The owner's decisions are marked inside.

## D117 · My Progress: LABS tile, no totals, matched tab titles (owner 2026-10-29/30)
- **LABS tile** beside TOPICS. "A lab" = a credit lab: the af_* Audio Fundamentals labs + the whole Training labs (tr_*). Miking / Mixing / Ear Training are credited lesson by lesson and are not rows. Data = the existing lab-credit store (`labCompletion`, `isLabDone`); nothing new is stored. Pure list: `src/features/lab/creditLabs.ts`; hook with the three faces: `completedLabs.ts`.
- **No "out of" totals on Progress.** Owner: "not everyone is enrolled in all or intends to do all so then the 'out of' sound intimidating and defeating". LABS and TOPICS read "N COMPLETED"; tapping LABS opens only the learner's completed labs (`LabsProgressScreen`) plus BROWSE LABS.
- **Layout = 2×2:** TOPICS | LABS, CERTIFICATES | PROGRAMS, then a smaller share card (supersedes the 2026-10-26 order "share, certificates, programs, topics"). Fits one 375×812 screen. Tablet: four in a row (TabletGrid).
- **"Trophy Case" retired:** the screen is **My Progress**, renamed everywhere a learner reads it (popup buttons SEE/VIEW IN MY PROGRESS, popup lines, help, intro, exam briefing). Tagline and intro kept.
- **Tab titles match:** Study, Progress and Profile all use `AppHeader` (40 pt icon tile + 22 pt "Word **Accent**"); `TabIconTile` puts the tab's own bottom-bar icon in the tile.
- Open: D32 (the tile reads only this phone's lab record; the server's `student_lab_progress` is never read back).
