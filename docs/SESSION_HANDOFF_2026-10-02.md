# Session handoff — 2026-10-02 (ccode, Claude Code desktop)

Read this first. Then read the memory index and docs/CROSS_SESSION_HANDOFF.md (newest entries at the top).

## 1. State right now
- Branch `audio-tools-engine`. Everything is committed and pushed.
- Tests 3780/3780; tsc clean.
- **PUBLISHED (OTA)** to `production` and `preview` for the runtimes of **iOS 33 (e8e3455b)** and **Android 16 (22976b0e)**. Update ids: iOS 01a0fd10-05fc-7e0a…, Android 01a0fd10-05fc-70c5….
- **Testers still run iOS 32 / Android 15 and get nothing until Computer A submits 33/16.** The commands are in CROSS_SESSION_HANDOFF.md. The owner was given the paste text for A.
- **Refund → certificates:** A deployed store-notifications v5 (now committed, 3fdbebec). The `submit_final_exam` fix and the service_role grants are a paste file the OWNER must run: `Downloads\2026-10-02_REFUND_CERT_FIX\10_APPLY_certificate_access_fix.sql`. Until it is pasted, v5 logs "revoke skipped". A also flags other award writers with no access gate (credential_awards has 0 rows today).
- Files that are NOT ours (never commit them): `.claude/launch.json`, `docs/APE_ACCESS_CODES_2026_08_21.sql`, `docs/APE_COMP_CODES_GUIDE_2026_09_07.md`, `supabase/functions/validate-purchase/index.ts`, untracked art and assets.

## 2. Done in this session (2026-10-01 → 02)
- **Drum Tuning Lab:**
  - built on Fable, then audio + cognitive + design reviews, a standards pass and 3 toddler passes;
  - moved to Pitch & Tuning.
- **Mastering and Room Design:** standards pass + 3 toddler passes.
- **Guest same-session carry:** owner ruling; the shared ledger is `src/features/lab/sessionCarry.ts`.
- **Full-app bug run 1** (33 fixes) and **run 2** (45 + 4 corrections).
- **Drum recording add-on:** `Downloads\2026-10-01_APE_RECORDING_BRIEF_ADDON_DRUM_TUNING.html`. Not sent; it has open questions.
- **Reports in Downloads:**
  - 2026-10-01_DRUM_LAB_AND_THREE_LAB_PASSES.md
  - 2026-10-02_FULL_APP_BUG_RUNS_AND_PUBLISH.md

## 3. IN PROGRESS when the session restarted: the pattern-based bug hunt (owner 2026-10-02)
The owner wants a change of strategy. Instead of fixing bugs one at a time, find the PATTERNS in all the bugs fixed so far. Then sweep the WHOLE app, pattern by pattern, checking every place each pattern could occur.
- **Phase 1** (a Fable agent; it was running at the restart and probably did NOT finish): write `docs/bughunt/PATTERN_CATALOG_2026_10_02.md` plus a Downloads copy, `2026-10-02_BUG_PATTERN_CATALOG.md`.
  - Mine the test titles, commits, BRIEF and the Downloads bug reports.
  - For each pattern: symptom, root cause, examples, the house idiom/helper, grep detection signatures with candidate counts, a correct-vs-buggy checklist, and a risk ranking.
  - Flag architectural fixes (one shared fix closing a class) and guard tests that prevent a class.
  - **If the file is missing or incomplete, relaunch phase 1.**
- **Phase 2:** one sweep agent per pattern across all of src/, with receipts (R2). Prefer shared helpers and guard tests. Show the owner the catalog and the plan first.
- **Known recurring classes from this session:**
  - a failed READ treated as empty, then overwritten;
  - a write before hydration;
  - missing generation fences on account switch;
  - an async start racing leave/mute (getSoundStopEpoch);
  - "Saved"/credit shown when the write failed;
  - network calls with no deadline (softDeadline / withDeadline);
  - guest/preview/identity gating;
  - double taps;
  - uncleared timers;
  - stale copy;
  - calculator edge input.
- **Commit and push only. Do not publish unless the owner says so.**

## 4. Owner decisions still open
1. A submits 33/16; the owner pastes the refund SQL.
2. Recording add-on questions (seat-mic taps, kick lug taps, the 12" tom's lug count). Then the owner sends it.
3. Optional: a licence/degree chip on collapsed career rows.
4. Phone checks after installing 33/16. The list is in the 2026-10-02 report §6.

## 5. Rules that mattered this session
- **Full screen ALWAYS opens at 1×** (owner 2026-09-26). I broke it once and reverted.
- **Refund = membership ends the same day; cancel = ends at the end of the paid cycle.**
- **Agents must not launch sub-agents.**
  - R2 proof: copy files aside and restore them; never git stash/checkout while others work.
  - Agents edit only their own area; shared-file bugs come to the lead.
- **Every commit gets a sync stub** in CROSS_SESSION_HANDOFF.md. The post-commit hook adds it; fill it with Python `newline=''`.
- **Publish:** check the channel, the fingerprint (`npx expo-updates fingerprint:generate --platform ios|android`) and rollbacks (`eas update:list`). Publish both branches with `--environment production` / `preview`.
