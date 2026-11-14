# Lab fix round 2: independent checker brief (2026-11-14)

Same rules as `CHECKER_BRIEF.md` (read it first):
- read-only, except your own report `CHECK2_<ID>_REPORT.md`;
- one tab of the built-in pane;
- KEEP SOUND OFF; never PRINT, SHARE or DOWNLOAD;
- never ask the user.

Then read `PHASE3_BRIEF.md` (the owner's 8 decisions) and the "Phase 3" section of each group report you check.

**Almost none of round 2 was seen on screen by the fixers**, because the preview was too slow while 12 agents edited at once. The preview server has been restarted and now loads in about 10 s. You are the first eyes on round 2.

## For every lab you check, test the owner's decisions

1. **Done = work done.**
   - Open a module or page: it must NOT turn ✓ just from opening.
   - Do its goal or check: it must turn ✓.
   - Its WHAT'S LEFT row must say what is still to do.
   - The words must never say "opening counts".
2. **No "N of total" progress counters**: no strip "MODULE 3 / 12" and no "CASE 5 OF 5". Counts of what is left are fine, and so are values such as slider positions.
3. **Shared extras:**
   - On a first visit, a rack lab opens on LEARN. To see a first visit, clear its `ape:intro:labLearnFirst` entry on your tab, and note what you cleared.
   - Each model note is one plain sentence, not ALL-CAPS "NOT A MEASUREMENT". List any all-caps disclaimer still on screen, with its file if you can find it.
   - "drawing…" shows instead of an empty black box.
   - An open tray shows ⓘ, and tapping it opens the help.
   - A step's intro is a popup only on the first step of a visit; later steps show it inline above the dock.
   - Each lab uses one unit word everywhere: strip, CONTENTS, end screen, guides.
4. **Ear Training:** answers stay locked until the clips have played. With sound off it says it needs sound and offers a way out.
5. **Long pages:** the beginner part comes first and the depth sits under GO DEEPER ▾ (or PART 2 / MORE). Nothing is missing. Split pages (Game Audio 4 → 4+5, 10 → 11+12; Amp module 7 step 2) appear in the right order.
6. **Foundations module 10:** the line is still red, with the words "CANCELED — SILENT".
7. **Sound Systems fault titles:** "Hum through the system", "Sound cuts in and out", "Vocals coming out of the subwoofer".

Also note regressions near each change:
- cut text at 390;
- dead taps;
- popups over trays;
- odd English;
- "free" shown to members.

Report format: as in CHECKER_BRIEF (summary line; table Lab | Item | Steps | Seen | Result; FAIL list with repro and suspected file:line).
