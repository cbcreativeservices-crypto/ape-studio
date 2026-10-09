# SESSION HANDOFF — 2026-10-08 (night) · read this first

Owner: Cháno (profechano@yahoo.com). Repo `C:\Users\profe\dev\ape-studio`, integration branch **`final-lab`** (head **f1838df5**, 10,109/10,109 tests at the last full run). Integrate in the clean worktree **`C:\Users\profe\dev\ape-build-snap`**. The main checkout is full of line-ending noise; don't commit from it. Website = branch `audio-tools-engine` (a push PUBLISHES it).

## Rules in force (owner) — see AGENTS.md, docs/APE_GOVERNANCE_DECISIONS_2026_10_08.md (D58–D66)
- **Opus 5.5 MEDIUM** for all agents until **Wed 2026-10-14** (subagent_type `opus-medium`).
- **Token efficiency:**
  - agents run targeted tests while working and the FULL suite ONCE at the end;
  - the lead batches merges (one full suite per batch) and fast-forwards when a branch already contains final-lab and passed;
  - at most about 6 captures;
  - short updates.
- **Large audits go to Comp B** as a brief plus exported files in Downloads. Comp B has NO app/DB access. DB/glossary text is Comp A's lane; never run SQL against production from ccode.
- **No Pixel update unless the owner asks for that update.** No `eas build/submit` until the owner says build. Never publish to testers/stores unasked.
- **Next build = THE STORE BUILD (iOS 35 / Android 17).** No build until the onboarding video is ready AND the owner says build.
- **Line endings:** normalise TEXT files only; never `git commit -a`; never change shared git config. New guard hook rules 4–5 in .claude/hooks/guard-blocks.cjs enforce this.
- **Figures (D60):** head ICONS only for a lone head; bodies use FigureHead; anatomy + decency ratchet.
- **Miking/Mixing copy (D58):** "suggested starting points"; "suggest"; no build notes; no brands except "Hammond".
- **Files for the owner go to Downloads** as one dated file, no folder for a single file.

## State
- **Labs:** 62 labs + 166 calculators.
  - Store-visible: 54. Hidden until owner approval: Miking Labs 1–7 (129 lessons) and Mixing Guides (`MIKING_PUBLIC` / `MIXING_PUBLIC` = false).
  - Labs 6 & 7 are built, expert/learning reviewed (docs/labs/miking/REVIEW_LAB6/7A/7B_2026_10_08.md), and all owner decisions are applied.
- **Pixel 7 Pro (USB, `adb`):** preview build runtime **eb43669e**, last OTA **01a11e59** = final-lab f1838df5. To update:
  1. In ape-build-snap at final-lab, copy the main tree's `.gitignore` and `modules/ape-*/android` bytes.
  2. Confirm `npx expo-updates fingerprint:generate --platform android` = eb43669e….
  3. Run `EXPO_PUBLIC_MIKING_PREVIEW=1 npx eas update --branch preview --environment preview --platform android --non-interactive`.
  4. Restore the copied files.
  5. Prove it with `adb logcat` (DownloadComplete → CheckCompleteUnavailable).
- **iOS build 34:** in Apple review (lacks the Apple-review freeze fix + iPad crash fix).
- **Website:** live with the new headline, two-line subline, "Tuesday, October 13" and the lowered panel.

## Waiting on the OWNER
1. **Store-build decisions C1–C13:** `Downloads\2026-10-08_STORE_BUILD_DECISIONS.html` (tap-to-answer page).
2. **Onboarding video:** owner is producing it.
   - Converted so far: `Downloads\2026-10-08_ONBOARDING_VIDEOS_OPTIMIZED\` (glossary + labs at 1080p30 and 720p30, fast-start, silent track removed, posters). ffmpeg is at `C:\Users\profe\tools\ffmpeg\bin\ffmpeg.exe`.
   - Notes given: overlay text over busy screens needs a dark band (the labs list still collides); both videos are silent; specs = 1080×1920 H.264, −16 LUFS / −1 dBTP if audio, .vtt captions.
3. The owner said **"Wait"** on starting store-build prep. When he says go:
   - merge into final-lab the 4 changes live on users but missing from final-lab (quiet hours 7b604c30, glossary 24 h re-ask 4e62b588, Start Here re-links e536792e, notification function sources 1cb73901);
   - put native work on a separate `next-store-build` branch: expo-video + first-run onboarding screen, native-ios-fixes (edd4c332, iPad stopCapture), SignalGen unplug native fix, deep links (needs the owner at the keyboard), and the package bumps per C4.
   - Full list: `Downloads\2026-10-08_NEXT_STORE_BUILD_CHECKLIST.md`.
4. **Realistic figure redo (later):** proposed hybrid (Comp C illustrations + artist agent). The owner dismissed the approach question; ask again when he's ready (memory project_figure_realism_redo).
5. **Unpushed:** testflight-fixes worktree branch (worktree-agent-a78c7b9a18180fc77, b1dd63c5/0ce03ea8). Push only with the owner's OK (decision C2).

## Waiting on Comp A / Comp B (see CROSS_SESSION_HANDOFF.md top entry)
- **Comp A:**
  - safety flashcard fixes: `Downloads\2026-10-08_COMP_A_SAFETY_FLASHCARD_FIXES.md`;
  - glossary text export for Comp B;
  - the store items (IAP products/subscription group, store-notifications deploy, privacy/data safety);
  - STORE_NOTIFY_SLUG.
- **Comp B:** house-style audit (`Downloads\2026-10-08_COMP_B_STYLE_AUDIT_BRIEF.md` + `…_COMP_B_APP_TEXT_EXPORT.csv`). It returns a findings CSV; ccode applies the app-text rows, Comp A the glossary rows.

## Open small items for the owner's Pixel check
- B10 faint reporter (hard to see; label works).
- B10 "PA"/"CAMERA" edge labels.
- Lab full-screen landscape (not testable on web).
- Map press-hold and taps.
- New voice cutaway.

## Today's notable incident
A line-ending script corrupted 1,716 images, which were pushed in 814988e0. They were restored byte-exact in a7817653. The website and phones were unaffected. Lesson: docs/APE_ENGINEERING_LESSONS.md (2026-10-07/08).
