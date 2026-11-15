# Beginner waves 1-3: built and checked (2026-11-15)

**You asked:** "build waves 1 thru 3. after we will discuss wave 4 at what goes and doesnt for that wave"

## The short answer

- **Built:** 226 changes from the beginner audit, across every lab. The rule for each was "take something away, fix a wrong turn, or add one short line where a beginner gets stuck".
- **Checked:** twelve independent checkers, who had built nothing, opened the labs at phone size (390 wide) and tried each change.
  - They passed 267 items and failed 21.
  - Every one of the 21 has since been fixed. Most fixes were confirmed by tests, not seen again on screen.
- **Tests:** the full test gate is green: 23,446 tests, 0 failed. The type check is clean.
- **Saved:** committed and pushed on the one branch: 499fd2e5 (the build) and f246b8a8 (the checker fixes).
- **Store build:** none needed. No native, package or app.json file changed.
- **Not on any phone yet.** Next is your Pixel test, then an OTA, and only on your word.

## What you will notice in the app

- **Calmer first screens:** in many labs the first thing is now a plain sentence and something to do. Formulas and pro details fold under GO DEEPER.
- **One word for each thing:**
  - Hz, dB, RT60, ms and cents now have one plain definition each, shared by every lab.
  - Controls keep one name across the card, the dock and the readout.
- **Check cards are shorter:** "Get one wrong? Try again. Nothing is lost and there is no score." Labs no longer repeat that line in their own guides.
- **Readouts open their lesson on a tap.** Before, only a long-press did. The strip under the display looks the same and is still read-only.
- **No more flat LOCKED for "not yet":** a key that only waits for something now says what it waits for ("2 notes", "all 8", "UNUSED", "with sound"). A tap explains why.
- **Rack labs end LEARN on "Done here? Try CHECK ›".** The caption that only repeated the section heads is gone.
- **Lab by lab:**
  - **Labs menu:** "New to audio? Start with the first tile". Each subject shows its one-line description.
  - **Miking:** each hub opens with your "suggested starting points" note and one start line. The zone label reads "TENDS TO HEAR". All modules stay open.
  - **Calculator Lab:** opens with "Pick a job, get a number you can use", then "browse all 166 calculators". Sample rates are asked in kHz, with the same results (checked on 66 runs: 0 differences).
  - **DJ:** the gain target now shows on the average readout (green with a ✓), not as a band on a peak meter. Wait lines appear only when the move is really done. On the final event the music can no longer run out mid-transition.
  - **Sound Systems:** the whole chain is shown on the home page, and each fault ends "Fixed. <the rule>". The parallel-load sentence is now correct: more cabinets mean a heavier load.
  - **Gate:** with sound off, HOLD, RELEASE and RANGE are dimmed and read "with sound". RANGE also points to PINK NOISE, where it shows.
  - **Harmonics:** opens on a plain sine with the harmonic bars first. The measurements sit behind MEASURE.
  - **Autotune:** a key on the display says how to read the marks: gray is the note as sung, the gridline is the right note.
  - **Microphone Principles:** opens on pickup patterns. **Room Design:** opens on "Create the room". Credit earned stays where it was.
  - **Mixing family:** the "Bring in a pro" note no longer pops up by itself; its link stays on page 1. **Mixing Guides:** the wording is untouched; only tags and layout moved.
  - **Production labs:** gaps are asked as questions ("…Is that intended?"). Every hearing and safety notice stays open.

## Phone checks only you (or the Pixel test) can do

| Where | What to look at |
|---|---|
| Delay, Reverb, Chorus, Flanger, Phaser, Distortion, Phase | These seven labs cannot open in the web preview, so they were checked in code only. Look at the new labels on each display (list: `CHECK_F7b_REPORT.md` section 3). |
| Production labs, Understanding Level & Amplitude, the color primer | No web preview either. Do a quick walk of each. |
| Calculator Lab home | The three job buttons, on the iPhone and the Pixel. |
| Harmonics, Patchbay, Stage Plot | Finger drags. |
| Tray ⓘ | On Android, the larger tap area around the small ⓘ. |
| Microphone Selection | The automatic scroll to the card that changed. |
| Tuning chapter 8 | The keys "2 notes" and "all 8": seen whole in the preview; worth one look on a phone. |

## For you to decide (with wave 4)

These were left for you on purpose. Nothing below was built.

1. **Wave 4:** 46 new-feature items, all off, in `Downloads/2026-11-15_D62_ADOPTION_PLAN.html`.
2. **The 22 items left off by default:** they change grading, credit, timing windows, safety wording or your artwork. Same file.
3. **Advanced Mixing page 6 teaches the opposite of what it plays.** The page says the insert compressor flattens the drums. Measured, that version is spikier than the dry drums (crest 29.8 dB against 22.6) and peaks at +5.6 dBFS. Beginning Mixing page 4 MIX B also peaks at +2.0 dBFS. Your call: fix the sound, or change the lesson line.
4. **Chorus picture:** the suggestion asked for two or three copies adding up. The engine plays one delayed copy per side, so that picture would show something the sound doesn't do. The Chorus card was reworded to match the existing picture instead.
5. **Glossary rows for four rewritten lab cards** (Phaser, Distortion, Phase, Chorus): a builder drafted matching glossary SQL. It was NOT run. You decide: leave the glossary as it is, or match it.
6. **Tuning meantone chapter:** it now says "deeper chapter", not "optional", because it still counts toward finishing the lab.
7. **Foundations room ruler "left to right":** not done, because it would break your 2026-08-27 design (the two rulers line up tick for tick).
8. **Readout captions on every visit** for Room Design and Foundations: the 11-14 round made them first-visit-only on purpose.
9. **Speaker safety notice** says "Toggle PHONE SPEAKER OUTPUT", but the key is now SPKR. This is hearing-safety wording, so it was not touched.
10. **Miking module card** "Put the mic up, listen … your ears and the room decide": your approved wording. On the start screen it sits right above "Nothing here makes a sound".
11. **Meter lab quiz** says the feedback spike is at 1.7 kHz; the screen now reads 1.75 kHz (the peak was fixed). Quizzes were outside this round. It is a one-word change.
12. **Small leftovers:**
    - Room Design's "axial (1,0,0)" key.
    - Foundations module 7's frost corners cover the top labels (this was there before).
    - Equalizer and EQ Lab share one seen-flag for their first card.
    - Slang left in the dynamics labs: PUNCH, mix-bus, SQUASH.
    - "1 of 8" (Tuning NOTES) and "11 of 12" (Bass FRET) look like N-of-total counters; both were there before this round.
13. **Limiter now opens on drum hits,** so the flattening can be seen. With sound off, its GR readout shows "— dB" until SINE is picked; the sound-off line says so.

**One thing to know:** to copy the glossary row "Audio levels" word for word into the Cable & Connector Fundamentals card, one builder read that single row from the live database. The brief said no database. It was read-only; nothing on the server changed.

## Next steps

| Where | What |
|---|---|
| You | Read this report and the wave 4 list; tell me what goes into wave 4. |
| Pixel (ccode, on your word) | Test this branch inside the real app (the side-by-side test build, as on 11-14). |
| OTA (only on your word) | Publish waves 1-3 to phones, one platform at a time, after the fingerprint checks. |

## Where everything is

- Each builder's report and each checker's report: `C:\Users\profe\dev\ape-workbench\docs\labs\beginner_waves_2026_11_15\` (`<GROUP>_REPORT.md` and `CHECK_<GROUP>_REPORT.md`).
- The plan and the wave 4 list: `C:\Users\profe\Downloads\2026-11-15_D62_ADOPTION_PLAN.html`.
