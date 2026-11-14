# Lab fix round 2 (phase 3): the owner's decisions (2026-11-14)

All rules from 00_FIX_BRIEF.md and PHASE2_BRIEF.md still apply:
- own files only;
- no commits;
- verify before changing;
- tests in your existing `test/labFixes_20261114_<GROUP>.test.ts`;
- NO `npx tsc`; parse-check each file and curl 8142 after each .tsx edit;
- one browser tab, closed after each look;
- save your report as you go (add a "Phase 3" section).

## The owner's decisions (quick-pick answers, 2026-11-14)

1. **"Done" = work done.** A page, module or lesson counts when its own goal or check is met, not when it is opened.
   - **Credit already earned is never removed.** Stored progress and credit stay exactly as they are. Only NEW credit follows the new rule.
   - Where a lab says "opening counts" (home guide, end screen, HOW IT COUNTS), change those words too.
   - Labs known to credit on opening:
     - Foundations, Microphone Principles, Wave (F5);
     - Vacuum Tube, Digital, Gain (F6);
     - Mixing Guides, where NEXT marks a guide read (F4).

     Check the others.
2. **"N of total" progress counters: remove them.** Replace with plain names: "MODULE 3", "Case: Hum through the system", "Capstone: Corporate keynote".
   - Value readouts that are not progress stay, for example VOICES 0/16, TREATED 0/14, or a slider position such as FRET 3 of 12.
   - Examples seen:
     - "MODULE n / N" (shared strip: S2);
     - CASE 5 OF 5 and Capstone 3 of 10 (F2);
     - Mixing guide 1 of 50 (F4);
     - Reasoning: 1/3 and SETUP: 1 of 6 (F9);
     - 0 OF 6 CORRECT and Trial 1 of 10 (F8);
     - "16 pages still to finish before this lab counts" (F6).
   - A count of what is LEFT ("3 modules not done yet") is not N of total and stays.
3. **Shared-frame extras: build all of them** ("do your recommendations for these"):
   - Rack labs open on the LEARN tab on a learner's first visit (S3).
   - A plain one-line disclaimer badge instead of all-caps "NOT A MEASUREMENT" lines (S3 builds; labs adopt).
   - A "drawing…" placeholder instead of an empty black box (S3 builds; labs adopt where they draw their own).
   - A visible ⓘ in an open tray instead of long-press-only help (S3).
   - Step intro popups on the first step only, then the same text inline (S1 builds; Drum Tuning, Envelope, Tuning and Speech are the known cases).
   - One name per unit of progress in each lab (module / lesson / chapter / step), used everywhere in that lab: strip, end screen, guides, buttons.
4. **Ear Training: play first.** Answers unlock after the sound has played once. With sound off, the drill says it needs sound (F8).
5. **Long pages: beginner core first.** Keep ALL content. Put the beginner part first and fold the depth under "Go deeper ▾". Split a page that holds two lessons into two pages.
   - **Splitting changes page numbers.** Before you split, find how stored progress and credit are keyed (by index or by id). Map old keys so nothing earned is lost, and test it.
   - Known pages:
     - Game Audio pages 4 and 10; Stage Plot SETUP's 25 fields (F3);
     - Advanced Mixing pages 7, 8, 10, 11 and 13; Mastering module 1 step 3; Pre-Production stage 1's 33 questions (F4);
     - Digital modules 2, 3, 7 and 8; the Cable lesson 3 connector record; Amp module 7 step 2 (F6);
     - Miking E16 step 3.3 (1,073 words) (F9);
     - the Sound Systems capstone 6 popup with ~160 targets (F2).
6. **Foundations module 10: keep red.** No change.
7. **Sound Systems fault titles: rename** (F2):
   - "Ground loop" → "Hum through the system"
   - "Intermittent cable or connector" → "Sound cuts in and out"
   - "Subwoofer receives vocals unintentionally" → "Vocals coming out of the subwoofer"
8. **Career Finder OWNER TEXT:** the owner is ticking a list. Not part of this round.

## Shared agents first

S1, S2 and S3 write their new API to SHARED_API.md (a "Phase 3" section) as soon as it is settled. Lab agents do their lab-local items now and adopt the shared ones when the API is written.

Final reply: counts, the report path, and every SHARED NEED.
