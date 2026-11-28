# Lab fix round 1: the report (2026-11-14)

**What you asked for (2026-11-14):**
- "Begin fixing all bugs found and do obvious (my decision is not required) fixes as you suggestted in the report."
- Then you approved the report's suggested order 1–9: the shared frame first, then every quick win.
- On Sound Safety you chose **"Once per session"**.

**Where it stands:**
- Committed and pushed on `ota-after-approval-39-23`.
- **Nothing is published.** Phones get it with the next update (OTA), and only on your word.
- No app store build is needed: these are app-code changes only.

---

## 1. What changed for every lab (the shared frame)

| Area | Now |
|---|---|
| Arrival | One card when a lab opens; the lab term sits inside the intro card. Popups come one at a time, ignore taps for their first 0.35 s, and never open over an open tray. A tap is no longer "swallowed". |
| Sound Safety | Asked once per session; KEEP SOUND OFF is honored until the app is closed. Both buttons are always on screen. A tap on the dim area does nothing. New footnote: "This warning appears once each time you open the app, until you enable sound." Profile › AUDIO OUTPUT can still turn sound on later. |
| Sound off | A "Sound off?" line in each lab's own words. NEEDS SOUND tags on steps that can only be heard (11 guided steps, Ear Training drills, Drum Tuning credit lines). Readouts show stored or model values with sound off, and listening steps get a "can't listen now" path. |
| Checks | Every wrong answer has its own one-line reason; the full explanation only comes after a second, different miss. Right answers are no longer the obvious longest option (a test enforces at most 1.4× the next one). This covers the 117 shared questions plus every lab's own check cards. |
| FINISH | "FINISH · SEE WHAT'S LEFT" appears after every passed check. |
| End screen | "What you learned" recap and a next-lab card for all 65 menu labs. Each unfinished row says what is missing. The counting rule is said once. WHERE TO START follows the learner. |
| Header | HELP in words, ± for the accuracy note, ABOUT for concept labs (your D37 rule). At 320 wide, a long title moves the keys to a second row instead of breaking a word. |
| Readouts | Plain-word captions on the first visit (for example RT60 "decay time", LOSS/BNC "per bounce"), and a "Hz? dB?" explainer chip. "dBFS dBFS" is fixed. |
| Trays | They no longer grey out or block the lesson. A tap on the lesson closes them, and NEXT can always be scrolled into view. A tray never hides the whole lesson on tall displays such as DJ. Reset needs two taps. |
| Sliders | − / + at the ends move one step per tap; holding jumps to the end. |
| Reading | On a phone, the display folds to a slim strip while you read a long lesson. |
| CONTENTS | A centered popup instead of a pull-down (your popups-not-pulldowns rule). |
| Labs menu | START HERE on "Understanding Level & Amplitude". Microphone Selection is first in its group. No tile text is cut at 320, 375 or 390. ✓ DONE shows on finished labs. |

## 2. Lab highlights (every report section 7 bug was checked in the code first)

| Lab | Fixed (a sample; full lists are in the group reports) |
|---|---|
| EQ Lab | **The microphone no longer starts on arrival** (modules 1 and 11 opened it, and on a phone that raised the permission prompt). It now starts only on a tap. |
| Sound Systems | Capstone 2 can be completed. Wrong links get △ and a reason instead of a green ✓. No free ticks on an empty venue. FAULT waits for a probe. The FAULT tray closes each case. "<MODE> COMPLETE" replaces "LAB COMPLETE". TROUBLESHOOT setting lines no longer give the cause away. |
| DJ | Screen 6 needs 8 s of clean sound. "dBFS dBFS" is gone. Screen 24 has 44-pt power switches. Screen 14 gives no free tick. Screen 11's tray no longer states the answer. |
| Game Audio | Page 17 shows its sum. Page 19 FIX opens neutral, and every fault needs a re-test. Pages 10, 11 and 21 have the right key words. Each page says when it counts. |
| Stage Plot | PLACE ON THE STAGE places the item. New objects no longer stack. "Who plays" defaults to the performer. GUIDED TASK is open on a blank stage (quick win 13). |
| Mixing / Mastering | Every page can be finished with sound off. Mastering true peak is never below the sample peak. + CONNECT no longer builds the chain. All 43 practice cards have reasons and balanced options. "1 required decision". New projects show grey. |
| Miking (128 lessons) | The Contents → Module 1 jump is fixed. Zone picks count (58 picks in 25 lessons had been taken over). Every lesson has a reachable ZONE jump. One counting rule and one wording everywhere. "a euphonium", "..", "center". "module" everywhere. |
| Wave / Foundations / Room / Mic | Module 11's numbers were right; the words now explain them. Module 16 DEPTH drags. Name tags are on every room picture. DISTANCE runs the same way in modules 3 and 4. The reflection counts agree. "slide" replaces "ride/lane". |
| Signal / Electronics | Patchbay page 7 no longer locks you out. Digital "FS" has one meaning. Cable Dressing's close-ups no longer give the answer. Meter readouts agree with the pictures. |
| Calculator Lab | Answers print dBV, dBu or dBFS as named. Gauge refusals are in words and say 14 AWG. Empty boxes are named ("Still needed: …"). The 654.5-samples result explains itself. |
| Synth / Pitch / Voice | "FRET FRET" is gone. Harmonics labels follow the sound. Drum Tuning REVEAL KEY waits. Tuning chapters 0, 7 and 11 count. The Cymatics HOME opens and its check shows. Ear Training's pill no longer says "last 20" after one answer. |

**Career Finder** (separate report: Downloads/2026-11-14_CAREER_FINDER_TEXT_FIXES_REPORT):
- 51 of Comp A's 57 findings applied, and none skipped.
- Required education now says "required".
- One licensing warning everywhere.
- The build script reproduces the data files exactly.

## 3. Checked by independent checkers, on screen

| Checker | Checked | Pass | Fail | Not seeable in the browser |
|---|---|---|---|---|
| C1 popups, Sound Safety, frame, Sound Systems, DJ | 63 | 47 | 3 | 13 |
| C2 checks, end screens, mixing, Game Audio, Stage Plot, Career Finder | 51 | 44 | 4 | 3 |
| C3 sound and acoustics, signal labs, Calculator | 87 | 77 | 4 (+2 found) | 1 |
| C4 effects, synth, Miking | 59 | 48 | 7 | 4 |

- **Every FAIL was sent back and fixed.** The fixers saw most fixes on screen; a few are covered by tests only (listed in each group report).
- **One serious fail was caught by the checkers:** the new − / + slider keys jumped to the end. They now move one step.
- **The ⚡ button** on two pages comes from the browser pane, not the app.

**Tests:** the full gate is GREEN at each commit: 22,628 tests at the first (cb52560c) and 22,668 at the final one (b2fb526e), with 0 failures. tsc: 0 errors. Both are pushed.

## 4. HELD: your decisions (nothing was built for these)

1. **One meaning of "done".** Some labs give credit for walking past (Foundations, Microphone Principles, Wave, Vacuum Tube, Digital, Gain, Mixing Guides' NEXT = read); others need the work.
2. **Existing "N of total" counters**, for example "MODULE n / N", "CASE 5 OF 5", "Capstone 3 of 10". None was added this round (checked in the code).
3. **Section 3 rows 11–17** beyond the quick wins:
   - rack labs opening on LEARN;
   - the disclaimer badge;
   - the "drawing…" placeholder;
   - visible help instead of long-press;
   - intro popups on the first step only;
   - one name per unit of progress.
4. **Ear Training:** require a play before an answer?
5. **Lesson rewrites and splits:** pattern 7, and Game Audio pages 4 and 10 (two lessons per page).
6. **Foundations module 10:** the silent, cancelled line is red per your 2026-08-05 ruling. It now also says "CANCELED — SILENT". Keep it red?
7. **Sound Systems TROUBLESHOOT titles** that name their own answer ("Ground loop", "Intermittent cable or connector", "Subwoofer receives vocals unintentionally"). They come from your fault list.
8. **Career Finder:**
   - 4 OWNER TEXT items;
   - 28 family example titles that are not titles in the index;
   - "Sound-System" spelling (one matches your example);
   - 2 family mappings.

   All are listed in the Career Finder report.

## 5. HELD: phone checks (they need a phone and the update, on your word)

- EQ Lab: a tap starts the mic, and nothing else does.
- Sound Safety: Android BACK on the sheet, and the 0.35 s tap window.
- Miking: no first-frame flash on steps 2.1 and 3.1.
- The 320-wide header and the tile wrap on a real phone (font rendering).
- DJ and Sound Systems drag strips with a finger.
- Mixing labs' bars and PEAK/RMS numbers with sound off: still drawn only after audio renders. Changing that touches the playback safeguards, so it needs a phone check first.

## 6. For Comp A (server text, nothing run)

`Downloads/2026-11-14_FOR_COMP_A_LAB_FIX_SERVER_EDITS.zip`: the glossary rows "Connector" and "Cable dressing" reworded to agree with their labs, and lab name "Miking: Bass clarinet" → "Bass Clarinet". The old text was confirmed live.

## 7. Found in passing, not part of this round

- "+ this topic" can still show on other screens when topic names fail to load (the Career Finder page is fixed). A small app-wide change.
- Eight effect labs have no web-preview route (Delay, Reverb, Chorus, Flanger, Phaser, Limiter, Distortion, Phase), so checkers verified them in code. This is dev-only.

## Reports

- Every group's full report is in `docs/labs/novice_audit_2026_11_14/fixes/` (S1–S4, F2–F9, CHECK_C1–C4), with copies in Downloads named `2026-11-14_<NAME>`.
- The preview's saved data is restored as it was before the round (25 of 25 values).
