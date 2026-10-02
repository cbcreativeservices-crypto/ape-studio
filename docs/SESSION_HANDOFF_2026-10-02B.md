# Session handoff — 2026-10-02 (evening, ccode)

Read this first. Then read the memory index, AGENTS.md ("HOUSE HELPERS") and docs/APE_GOVERNANCE_DECISIONS_2026_10_02.md (D44–D49).

## 1. State right now
- Branch `audio-tools-engine`. Everything is committed and pushed. Tests 4088/4088; tsc clean.
- **PUBLISHED:** only the OTA of 2026-10-02 morning, for the runtimes of iOS 33 / Android 16. **Everything since then is NOT published:** the pattern hunt waves 1–4, the Amp hub, and the governance and lessons docs.
- **Builds:** iOS 33 / Android 16 are built. The owner said at the end of the day: *"i sent in my documents for them to review"*. Ask whether that means build 33 was submitted to Apple (or some other review), and what is still to do. The submit commands are in CROSS_SESSION_HANDOFF.md and in the 2026-10-02 report.
- **The refund SQL** (Downloads/2026-10-02_REFUND_CERT_FIX) must be pasted by the owner. Confirm it was.
- **Another ccode session** was active in this repo on 2026-10-02 (it built a web launch page, b7005fdf). Check `git log origin/audio-tools-engine` before pushing.

## 2. Done on 2026-10-02
- **Full-app bug runs 1–2**, then the **pattern-based hunt:**
  - the catalog (`docs/bughunt/PATTERN_CATALOG_2026_10_02.md`);
  - Option A shared fixes in 4 waves, each with ratchet guard tests (governance D47).
- **Owner rulings** "favor consistency and learning outcomes" (D48): decorative motion stops under Reduce animations and Low-Light; SEE WHAT'S LEFT on all 7 module-lab hubs; the exposure note; career chips; the calculator corrections.
- **Reports in Downloads:**
  - 2026-10-02_FULL_APP_BUG_RUNS_AND_PUBLISH.md
  - 2026-10-02_BUG_PATTERN_CATALOG.md
  - 2026-10-02_PATTERN_BUG_HUNT_SUMMARY.md

## 3. Rules and hooks added today
- AGENTS.md: the **HOUSE HELPERS** section (use them; ratchet tests enforce them).
- `.claude/PROTOCOL_CHECK.md` (shown on every prompt): items 8 (house helpers) and 9 (never publish unasked; another session may be active).
- `.claude/hooks/guard-blocks.cjs`: **`eas update` now asks first** (the PUBLISH RULE), like `eas build/submit`. `update:list` and `update:view` are unaffected.
- docs/APE_ENGINEERING_LESSONS.md: the 2026-10-02 section.
- The post-commit sync hook (scripts/hooks/post-commit) is unchanged. Fill your own stub with Python `newline=''`.

## 4. Open owner items
1. **Apple / Google:** confirm the submit state of 33/16. When testers are on 33/16 and the owner says "publish", OTA the post-morning work (check the fingerprint and channel first).
2. **The recording add-on** (Downloads/2026-10-01_APE_RECORDING_BRIEF_ADDON_DRUM_TUNING.html): answer its questions, then send it.
3. **Optional:** the lesson displays that stay still under Reduce animations (speech folds, de-esser step-through, a connector lamp, cable lessons 10/11). They were kept still for accessibility.
4. **Phone checks after installing 33/16:**
   - Drum Tuning sound;
   - Mastering A/B;
   - Room Design drags;
   - the guest → sign-in carry;
   - a headphone unplug;
   - a double Back;
   - Reduce animations and Low-Light stopping the decorative motion.
