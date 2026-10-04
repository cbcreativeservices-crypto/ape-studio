# Session handoff, 2026-10-04 B (end of day): READ FIRST next session

This replaces SESSION_HANDOFF_2026-10-04.md (the overnight handoff), which is still valid for history.

## 1. State
- **Branch:** `audio-tools-engine`, pushed. **Everything is PUBLISHED.**
- **The last OTA, published 2026-10-04 evening, on the owner's go:**
  - production: iOS group 89ad7d3d, Android group be8ca990;
  - preview: iOS 8b73f1b7, Android 1f2c5525;
  - runtimes: iOS e8e3455b, Android 22976b0e (builds 33/16);
  - u.expo.dev serves update ids 01a10836-e80a-756e… (iOS) and …-7674… (Android).
- **Earlier today, also published** (d0449070):
  - hunts 11–13;
  - the RN pass;
  - the wrap-up;
  - the D55 rulings.
- **Tests:** 5679/5679. tsc is clean.
- **The owner starts a NEW, LARGE, MULTI-PART project in a fresh session:** "the new and final (yes true final) pre-launch lab project". Wait for the owner's spec and explicit go. It runs on **Opus 5.5 at HIGH effort**. The `~/.claude/agents/opus-high.md` agent definition (model opus, effort high) loads in a new session, so use `subagent_type: "opus-high"` for helper agents.

## 2. What landed today (governance D55–D57)
- **Calculators:**
  - full accuracy audit;
  - new Conductor Ampacity calculator (NEC 2023);
  - loudness targets with sources;
  - "OVER CEILING BY".
- **Production labs:**
  - `showWhen` (learning-moment audit);
  - progress signal;
  - Packet screen with WHAT'S LEFT items;
  - revision number;
  - duplicate clears accepted conditions;
  - power sign-off shown.
- **Start Here:**
  - Glossary is the first landing;
  - movable card (dormant while Home Setup is hidden);
  - Lesson 3 renamed;
  - +2 bonus (needs a server change, below).
- **Community:** badges and opt-in alerts (need a server change, below).
- **Guests:**
  - ephemeral (only meters, device id and intro flags survive);
  - "not saved" reminders;
  - lab credit leak closed;
  - only gs3060 and gs3970 are open to guests.
- **Career Finder** is on createLocalStore.
- **Small fixes:**
  - `releaseSessionWork`;
  - Flashcards notices;
  - intro, welcome and tutorial sequencing.
- **Exposure:** counts lab clips while they play. The clipping flag is per tool. A glossary cross-link warns before it uses a credit.

## 3. Waiting on Comp A (needs owner approval first)
`docs/COMP_A_SERVER_WAVE_2026_10_04.md` lists these DRAFT migrations. None is applied.
- 2026100401: community notifications, plus edge function draft `docs/drafts/community-push/`.
- 2026100407: Start Here +2 bonus.
- 2026100410: Start Here glossary terms. **When it is live, ccode re-links Start Here's words** (see `docs/GLOSSARY_STARTHERE_TERMS_2026_10_04.md` §5b) and publishes.
- 2026100420: glossary formula accuracy.
- 2026100430: YouTube loudness glossary wording.

Also with Comp A:
- the store-build prep (`docs/COMP_A_STORE_BUILD_PREP_2026_10_04.md`): the IAP sandbox test and release notes;
- the `notification_preferences` rows: only 7 of 32 users have one.

## 4. Next native build (on the owner's go only)
See memory `project_next_build_queue`:
- SignalGen unplug, and the iPad mic-stop crash;
- package bumps: Reanimated 4.5.5 / Worklets 0.10.4, expo-iap 5.8, expo-speech-recognition 57, supabase-js 2.117;
- **deep links:** app.json `ios.associatedDomains` (www ONLY), and drop the 9 apex intentFilters. The web `.well-known` files are committed (13941277).

## 5. Small open owner items
- Is the guest wipe right to keep the mic calibration (`ape:splCalOffset`) and an account's unsent offline exam (`ape:finalExamQueue`, `ape:attemptDraft:*`)?
- Three display preferences are now wiped for guests.
- A practice quiz for guests would need a server change.
- Ampacity: check against a printed 2023 NEC. The values were verified against 2020 reproductions; "unchanged in 2023" rests on knowledge.

## 6. Process notes
- **Hunt process:** `known_issue_catalog` K1–K12 (copied into docs/bughunt/ if needed). Rules: receipts that fail on HEAD; R2 proof; ratchets only shrink.
- **Python on this machine defaults to cp1252:** always open files with `encoding='utf-8', newline=''`.
- **Publish recipe:**
  1. fingerprint check (it must match e8e3455b / 22976b0e);
  2. update:list (look for a rollback);
  3. `eas update --branch production`, then `--branch preview`, with `--environment preview --platform all --non-interactive`;
  4. curl u.expo.dev to confirm the new ids are served.
