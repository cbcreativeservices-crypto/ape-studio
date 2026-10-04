# Session handoff, 2026-10-04 (after the overnight run)

Read this first next session. Owner report: `Downloads/2026-10-04_OVERNIGHT_HUNTS_11-13_AND_RN_REVIEW.md`.

## State
- Branch `audio-tools-engine`, pushed. Remember that a push also updates the gated website.
- **NOT PUBLISHED since a2b39a68.** That covers:
  - the start-up trim 7d26ca02;
  - hunt 11: 1c5a74c4 + c0debb14;
  - hunt 12: b5b323ce + 642fb8a2;
  - hunt 13: 9255719b;
  - the RN pass db1ca27b;
  - the wrap-up f7fa7e1f.
- Publish only when the owner says "publish". The OTA runtimes are iOS e8e3455b… and Android 22976b0e… (builds 33/16).
- Tests: 5078/5078; tsc clean.
- Hunt counts: 11 → 18 + 2 corrections, 12 → 27 + 1, 13 → 32 + 1; wrap-up 3.

## New house rules (AGENTS.md)
- `runSoon()` (src/lib/afterInteractions.ts) replaces InteractionManager, enforced by a ratchet in test/rnResearch_20261004.test.ts.
- No module-scope SQLite open.
- Lessons were appended to docs/APE_ENGINEERING_LESSONS.md (2026-10-04).

## Process assets (scratchpad; copy them if needed)
- The known-issue catalog K1–K12, and the hunt rules with per-hunt lead notes.
- The RN research report with its sources. Its B and C lists are copied into the owner report §3.

## Open: owner questions (report §5)
- Lab clips and exposure: count them at an assumed level, or leave them out?
- The input-clipping flag: should it cover this tool's run or the whole mic session?
- Calc "- 5": refused?
- Loudness negative-margin wording.
- The cross-link opening note.
- Still open from before: request notifications and unread counts; the module-open save notice; Career Finder store migration.

## Open: candidates (not done)
- Shared fix: a removal-applies option in `holdSessionWork` guestOnly, to replace the per-store deleted-id sets. The Cymatics ExperimentWell untick has the same class.
- `meterWarningFlags` per-tool clip baseline (owner call above).
- patternStore wipe-generation fence; modMeterC `solvedRef` across a wipe (narrow).
- TopicWelcomeSheet `hold` prop for the first Flashcards visit.
- Flashcards `openTermFromList` silent failure: add a notify.
- AudioOutputGate `acceptSafety` userId from the local session.
- The RN B list goes with the next native build: Reanimated 4.5.5 / Worklets 0.10.4, expo-speech-recognition 57, expo-iap 5.8, supabase-js 2.117, the 16 KB check.
- The RN C list is the owner's call: React Compiler, FlashList v2 for the Glossary, OTA code signing, SDK 58 timing.
