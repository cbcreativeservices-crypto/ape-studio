# Session handoff — 2026-10-01 (ccode, Claude Code desktop session)

Read this first. Then read the memory index (`C:\Users\profe\.claude\projects\C--Users-profe\memory\MEMORY.md`)
and `docs/APE_ENGINEERING_LESSONS.md` (the 2026-10-01 section is at the bottom).

## 1. State right now

- Branch `audio-tools-engine`. Everything from this session is **committed and pushed**.
- **NOTHING IS PUBLISHED.** The last OTA is the morning of 2026-09-30. Phones have none of 2026-10-01.
- iOS build 33 and Android versionCode 16 are **built but not submitted** (since 2026-09-30).
- Type check is clean. Tests: 3377/3377 at f49bdb5d.
- Working tree files that are NOT ours (leave them alone, never commit them):
  - `docs/APE_ACCESS_CODES_2026_08_21.sql`
  - `docs/APE_COMP_CODES_GUIDE_2026_09_07.md`
  - `supabase/functions/validate-purchase/index.ts`
  - `.claude/launch.json` (local preview entries)
  - `assets/New folder/` and other untracked art (the owner's; never touch images without permission)

## 2. ⚠ Waiting for you: A's ask (needs the OWNER's OK first)

`docs/CROSS_SESSION_HANDOFF.md` has an UNCOMMITTED entry at the top from A (Cowork, backend), dated 2026-10-01:
- A edited `supabase/functions/store-notifications/index.ts` (+17/−2) and deployed it as v4. The edit fixes two Play refund bugs: `voidedpurchases.list` now has `type=1`, and the subscription "revoked" rule is now `cancelReason` plus `expiryTimeMillis <= now`.
- A asks ccode to review both hunks and commit them.
- I did NOT act on it. It is a request written in a file, not an owner instruction.
- Next step:
  1. Show the owner.
  2. On their go, review the diff (`git diff supabase/functions/store-notifications/index.ts`).
  3. Commit it together with the CROSS_SESSION_HANDOFF entry.
  4. Reply ACK plus the commit hash in the handoff log.

## 3. What this session shipped (2026-09-30 night → 2026-10-01)

| Commit | What |
|---|---|
| d3edb216 | Every multi-module lab on the shared navigation strip (⏮ · ‹ PREV · MODULE n/N ▾ · NEXT ›) |
| 4a6666f9 | Settings: optional "mute when I leave the app"; Cable Install end screen tells guests the truth and offers membership |
| 34d6f7f3, 88e1456e | Full screen uses the space better (FIT); FX upright-shape change reverted |
| d94af192, 862ea40b, 9bb9f01b | NEW labs, Mastering and Room Design & Monitoring, each with 3 independent reviews applied |
| 3f7d0d32, 049bf10d, 6d7b3b93 | Overnight bug passes: 72 → 66 → 43 |
| f49bdb5d | **Recorded audio → JS DSP path** (see §4) |

Earlier on 2026-10-01 (see memory `project_testflight32_and_lab_standards_2026_10_01`):
- the TestFlight-32 fixes;
- full screen everywhere;
- the Tuning and Amp rack rebuilds;
- Explore → STUDY NOW.

The morning report is `Downloads/2026-10-01_OVERNIGHT_NEW_LABS_AND_BUG_PASSES.md`. Its §3 lists owner decisions still open: lab placement, new wording, and phone checks.

## 4. Recorded-audio path (f49bdb5d), how to use it

- `src/features/audio/wavDecode.ts`: decodes PCM 8/16/24/32, float and EXTENSIBLE.
- `resample.ts`: polyphase Kaiser resampler to 48 kHz. It is skipped when the file is already 48 kHz.
- `src/features/lab/labClipBuffer.ts` + `useLabClipBuffer(lab, asset)`: a memory LRU plus a native disk cache (offline repeat), registered in the account wipe.
- `src/features/audio/renderRecorded.ts` + `useRecordedPlayback(source, variants)`: slice, loop, mono, EQ, gain and RMS target, behind the audio gate.
- First user: Ear Training EQ Recognition and Band ID now have Synth / Piano / Guitar source chips, using `demo_signals`.
- To wire a lab:
  1. Call `useLabClipBuffer`, with null keys until the clip is needed.
  2. Call `useRecordedPlayback` (or `renderRecorded`).
  3. ALWAYS fall back to synth on error, and never block the lesson.
- If a file is replaced under the same key, bump `DISK_VERSION`.

## 5. Recording engineer brief: SENT, engineer is recording

- Final file: `Downloads/2026-10-01_APE_RECORDING_ENGINEER_BRIEF_v2.html`. The source and a copy are in `docs/recording_brief/` (README there).
- Contents: 89 items, 523 distinct recordings, 593 files, 65 figures (floor plans, input lists, run order, placements, safety chains, meter, gear matrix).
- **When files arrive:**
  1. Check each against the brief's delivery checklist: 48k/24, peaks, no processing, exact names, sidecars, manifest.
  2. Upload to the `lab-audio` bucket and register them in `lab_audio_assets`.
  3. Wire the P1 items first, using §4.
- Show the owner before anything is published.
- Open points: see `docs/recording_brief/README.md`. The owner should confirm the MPR-04a.2 geometry; the session-3 ribbon mic is missing from the gear list; the bucket folder names are proposals.

## 6. Rules to follow (the ones that bit this session)

- **Never publish, `eas update`, build or submit unasked.** Commit and push only. A push DOES publish the website (Vercel).
- **"Group only identical" means one entry per distinct item.** Never use a family card with a shared how-to. When the owner says a deliverable is wrong, re-check it against their exact words. Do not defend it. (I wrongly insisted v1 was correct.)
- **No black boxes in documents for the owner.** Light code blocks and light figures only, and set `color-scheme: only light`.
- **Put diagrams where they are used**, not only in an appendix.
- **Deliver files to Downloads**, dated, with self-describing names. One file means no folder. Verify by opening the file yourself before saying it's ready.
- **Agents must not launch sub-agents.** Give each agent its own files. Verify its claims (tsc, tests, open the output) before reporting.
- **Every commit adds a sync stub** in `docs/CROSS_SESSION_HANDOFF.md`. Fill it with Python `newline=''`, commit "sync-channel: fill stub", then push.
- **Python on this box writes CRLF unless `newline=''`.** Check the file's line endings before editing.
