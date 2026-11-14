# CHECK2 K1 report (lab fix round 2, phase 3) · 2026-11-14

Checker K1 (independent). Scope: S1, S2, S3, F2, F7 phase-3 work. Built-in pane, own tab, 390x844, KEEP SOUND OFF only.

**Summary: 57 checked · 53 PASS · 3 FAIL · 1 NOT SEEABLE.** One more item was listed but is outside my scope: the Envelope all-caps chart line.

FAILS:
- F-1: De-Esser WHAT'S LEFT rows have no "still to do".
- F-2: Sound Systems hub WHAT IS LEFT shows "0/22"-style counters.
- F-3: Sound Systems capstone CONSOLE tray shows "ON THE CONSOLE · 0 OF 2".

Status: DONE. Tab closed and viewport reset.

## Keys cleared
- `ape:intro:screenIntroCards`: twice set back to the 4 Drum Tuning ids (`ikjo1rm`, `i13zmeey`, `i1x2l3fs`, `i2xr8n6`) to see a clean Envelope visit. Afterwards I merged back the ids I had removed (`i1iilghn`, `i16e3bjg`, `isp9o7p`, `i1y9fln6`, `i12xg9b7`, `ijr22bp`, `i476dkr`, `iqmyl51`, `i1d6rmu8`, `i5yg0u1`, `idniy9c`) so nobody else's cards come back.

Note: the pane was hidden most of the run, so screenshots time out; most checks are read from the page text (get_page_text / innerText) and DOM clicks.

## Results

| Lab | Item | Steps | Seen | Result |
|---|---|---|---|---|
| Drum Tuning | S1 · first step popup | Open `#labpreview/DrumTuningLab` | Step 1 card is a popup: "LEARN · THE DRUM AS A SYSTEM … EXPLAIN THIS SCREEN / GOT IT". Strip "CHAPTER 1 · STEP 1 ▾", no total | PASS |
| Drum Tuning | S1 · later step inline | GOT IT, NEXT | Step 2: no popup; a note just above the dock: "WHERE TO START ✕ / Why more tension raises a drum's pitch… / Tap ▶ STRIKE and read PITCH 233 Hz… / ⓘ EXPLAIN THIS SCREEN". Nothing dimmed | PASS |
| Drum Tuning | S1 · fader stays live | Drag TENSION fader left on step 2 with the note up | TENSION MEDIUM 233 Hz → VERY LOW 159 Hz, display redrew. The note closed when the drag began (by design: `working` clears it, ScreenGuide.tsx:651) | PASS |
| Drum Tuning | S1 · ⓘ EXPLAIN THIS SCREEN | Step 3 note → tap ⓘ EXPLAIN THIS SCREEN | Full card opened: "LEARN · THE SHELL AND BEARING EDGE / WHAT YOU'RE LEARNING … / WHERE TO START … / GOT IT" | PASS |
| Drum Tuning | S1 · ✕ | Step 4 note → ✕ | Note gone, page text has no WHERE TO START | PASS |
| Drum Tuning | model note | look | "This drum is a model drawn to explain the idea, not a measurement." (plain) | PASS |
| Envelope | S1 · popup only on first step | Clean visit (cards reset as above): module 1 popup, GOT IT, NEXT ×6 with 3 s between | m1 POPUP; m2…m7 each INLINE with its own words ("Sounds fall into families…", "The transient is…", "Sounds last from…", "Peak level follows…", "A sound's envelope belongs…", "A review of six ideas…") | PASS |
| Envelope | S1 · fast GOT IT + NEXT | GOT IT, NEXT after 150 ms, NEXT after 2 s, polled every 250 ms | m2 and m3 notes each carry their own words from the first 250 ms | PASS (see NOTE 1: an earlier stale note, not reproduced) |
| Envelope | S2 · strip | look | "MODULE / 1 ▾", no "/ 7" | PASS |
| Envelope | S2 · manualDone not credited on NEXT | NEXT through modules 1-5 doing nothing, open CONTENTS | 01-05 all "○" | PASS |
| Envelope | S2 · reading page counts on NEXT | CONTENTS → 06 Envelope vs Propagation → NEXT → CONTENTS | 06 "✓", the rest "○" | PASS |
| Envelope | S2 · goal credits | CONTENTS → 02 (○) → tap "Kick drum" → CONTENTS | 02 "✓" | PASS |
| Envelope | S2 · WHAT'S LEFT | CONTENTS → WHAT'S LEFT | "7 modules plus the check not done yet." Rows "Still to do: move any slider, or switch a curve." etc. HOW A MODULE COUNTS: "A reading module counts once you press NEXT… Jumping to it from CONTENTS does not count it. A module with its own goal or check counts once that goal or check is met; NEXT moves on without counting it." No "opening counts" | PASS |
| DJ Systems | S2/F2 · unit word "screen" | Open `#labpreview/DJSystemsLab`, CONTENTS, WHAT'S LEFT | Strip "SCREEN / 1 ▾"; "21 screens not done yet."; "HOW A SCREEN COUNTS / A screen counts once its practice goals, its check and its troubleshooting exercise are done; NEXT moves on without counting it."; rows "Left: Start deck A · … + 4 more" | PASS |
| DJ Systems | F2 · no totals | CONTENTS → screens 2, 3, 4, 24; regex for "n / N", "n OF N" | None as progress. Screen 2 "(4 jobs left — FIND…"; screen 4 "9 LEFT", "0 ON"; screen 24 only "FADERS 0/85" (fader values, kept) | PASS |
| Game Audio | S2 · unit word "page" | Open `#labpreview/GameAudioLab`, CONTENTS, WHAT'S LEFT | Strip "PAGE / 1 ▾"; "24 pages not done yet."; "HOW A PAGE COUNTS / A page counts once its practice goals and its check are done in one visit; NEXT moves on without counting it."; rows "Still to do: set LEVEL to 40% or lower…" | PASS |
| Beginning Mixing | S2 · unit word "page" | `#mixinglabpreview`, CONTENTS, WHAT'S LEFT | Strip "PAGE / 1 ▾"; "16 pages still to finish before this lab counts toward your credit."; "HOW A PAGE COUNTS"; rows "Goals: open all five dimensions · …" | PASS |
| Advanced Mixing | S2 · unit word "page" | `#advmixingpreview`, CONTENTS, WHAT'S LEFT | Strip "PAGE / 1 ▾"; "20 pages still to finish…"; "HOW A PAGE COUNTS" | PASS |
| De-Esser | S2/F7 · unit word "page" | `#labpreview/DeEsserLab` | Strip "PAGE / 1 ▾"; WHAT'S LEFT "7 pages plus the check not done yet."; "HOW A PAGE COUNTS / A reading page counts once you press NEXT… A page with its own goal or check counts once that goal or check is met; NEXT moves on without counting it." | PASS |
| De-Esser | F7 · reading page counts on NEXT | GOT IT, NEXT on p1 (What Sibilance Is) | CONTENTS "✓ 01 What Sibilance Is" | PASS |
| De-Esser | F7 · check page not counted on NEXT | NEXT on p2 (Why EQ Is Not Enough) without answering | CONTENTS "○ 02 Why EQ Is Not Enough" | PASS |
| De-Esser | F7 · check page counts on right answer | CONTENTS → p2 → tap "It is on all the time, so the vowels lose brightness too" | "✓ The cut never switches off…"; CONTENTS "✓ 02"; end screen "✓ 2 DONE" | PASS |
| De-Esser | Decision 1 · WHAT'S LEFT row says what is still to do | CONTENTS → WHAT'S LEFT | Rows 03-09 show only the title and "›" ("03 / The Detection Path / ›" …). No "Still to do: …" line, unlike Envelope, DJ, Game Audio and Mixing | **FAIL** (F-1) |
| Mixing Guides | S2 · unit word "guide", name not number | `#labpreview/MixingGuide/pop` → "POP ▾" → WHAT'S LEFT | Strip "GUIDE / POP ▾" (a name, no "1 of 50"); "50 guides not done yet."; "HOW A GUIDE COUNTS / A guide counts as read when you reach its end and tap MARK AS READ. Opening it, or moving on with NEXT ›, ‹ PREV or the list, does not count." | PASS |
| Tuning | S2 · unit word "chapter" | `#labpreview/TuningLab` → "1 ▾" → WHAT'S LEFT | Strip "CHAPTER / 1 ▾"; "14 chapters not done yet."; "HOW A CHAPTER COUNTS / A chapter counts once its own task is done, not when it is opened…"; rows "Still to do: answer its UNDERSTANDING CHECK correctly." | PASS |
| Harmonograph | S3 · LEARN first | Removed `ape:intro:labLearnFirst` (it read `null` already), reload | Opened on LEARN ("What this lab teaches…", LEARN card popup). Flag then read `["harmonograph", …]` | PASS |
| Harmonograph | S3 · LEARN → EXPLORE draws | GOT IT → EXPLORE, polled 3 s | No "drawing…"; the 368x248 glass holds a 24,576-char SVG path; RATIO 3:2 · PERFECT 5TH | PASS |
| Harmonograph | S3 · plain model note | look | "The machine is drawn from the pendulum equations, not filmed." | PASS |
| Harmonograph | S3 · tray ⓘ | KEEP SOUND OFF, open TUNE, tap the tray ⓘ ("What TUNE does") | Tray head "TUNE · stays open — compare while you watch ⓘ ✕"; sheet "TUNE / Harmonograph · what this does / RATIO chips, from 1:1 UNISON…" | PASS |
| Harmonograph | S3 · second visit | reload | Opens on EXPLORE (THE DRAWING), no LEARN text | PASS |
| Gate | S3 · LEARN first | `gate` not in the flag; open | Opened on LEARN with the LEARN card | PASS |
| Gate | S3 · LEARN → EXPLORE draws | GOT IT → EXPLORE (screenshot) | IN ▸ GATE ▸ OUT drawing with the hit shapes; inline WHERE TO START above the dock (S1) | PASS |
| Gate | S3/F7 · model note + curve note | look, LAB NOTES | Stage: "This picture is a model of the gate, from the audio's math. GR is measured live." LAB NOTES: "DESIGNED RESPONSE / This curve is worked out from your settings; the GR meter above measures the live audio." Full screen shows the same plain note | PASS |
| Gate | S3 · tray ⓘ | open RANGE, tap ⓘ (screenshot) | Tray "RANGE · stays open — compare while you watch ⓘ ✕"; sheet "RANGE / Gate · what this does / How far the gate turns the sound down…" | PASS |
| Stereo | S3 · LEARN first + draws | first visit (not in flag) → GOT IT → EXPLORE (screenshot) | Opened on LEARN with the card; EXPLORE draws L/R waves through M/S WIDTH | PASS |
| Stereo | F7 · notes | look | "This picture is a model of the stereo image, from the audio's math, not a meter." / "The scope and CORRELATION are worked out from a 440 Hz stereo test tone, not measured." | PASS |
| Compression | S3 · "drawing…" then drawn | first visit → EXPLORE with a MutationObserver | "drawing…" appeared once, then gone; display drawn. Notes: "This picture is a model of the compressor, from the audio's math. GR is measured live." / "This curve is worked out from your settings; the GR meter above measures the live audio." | PASS |
| Delay, Reverb, Chorus, Flanger, Phaser, Limiter, Distortion, Phase | F7 · model + curve notes | no `#labpreview` route for these 8 (webPreviews.tsx:170-260); read `fxLabConfigs.tsx` | Each config has a plain `modelNote` and `curveNote` (lines 429-430, 566-567, 729-730, 875-876, 1059-1060, 1507-1508, 1658-1659, 1796-1797); FxLabScreen.tsx:817 passes `modelNote`, :903 draws `curveNote` in place of the caps badge | NOT SEEABLE (no preview route); code PASS |
| EQ Lab | F7 1a · opening does not count | `#labpreview/EqModule/shapes` → GOT IT → "6 ▾" | Strip "MODULE / 6 ▾" (no "/ 15"); CONTENTS "○ 06 Filter Shapes" after opening | PASS |
| EQ Lab | F7 1a · the goal counts | Filter Shapes CHECK YOURSELF → "High-pass (low-cut)" | "✓ A HIGH-PASS filter PASSES the highs…"; CONTENTS "✓ 06 Filter Shapes" | PASS |
| EQ Lab | F7 1a · WHAT'S LEFT | CONTENTS → WHAT'S LEFT | "14 modules plus the check not done yet."; "HOW A MODULE COUNTS / A module counts when its own goal is met, not when you open it."; rows "Still to do: answer its CHECK YOURSELF on the amber curve." etc.; 06 no longer listed | PASS |
| EQ Lab | F7 1a · Fix the Signal goal | `EqModule/fixSignal`: CONTENTS "○ 14"; FREQ − ×2 (500 → 354 → 251 Hz), GAIN − ×4 (−8.0 dB), CHECK | "RESULT FIXED", "✓ FIXED — the problem was a boost around 250 Hz."; CONTENTS "✓ 14 Fix the Signal" | PASS |
| EQ Lab | F7 2 · "SCENARIO 2" wording | SCENARIO tray → "2 · HARSH VOCAL" (screenshot) | Bezel "SCENARIO / 2", key "SCENARIO ▸ #2"; no "2/5". The tray lists "1 · BOOMY KICK … 5 · SIBILANT VOCAL" (names, not a counter) | PASS |
| EQ Lab | F7 3b · module notes | Fix the Signal; Live Spectrum + EQ (screenshots) | "Bold is the signal, dim is the reference: a made-up spectrum, not a recording." / "Levels from an uncalibrated phone mic: compare them, don't read them as true levels." No caps disclaimer | PASS |
| Sound Systems | F2 2 · hub mode cards | `#labpreview/SoundSystemsLab` | Cards "LEARN 22 LEFT", "BUILD 10 LEFT", "ROUTE 8 LEFT", "OPERATE 5 LEFT", "TROUBLESHOOT 22 LEFT" | PASS |
| Sound Systems | F2 2 · hub WHAT IS LEFT | same screen, scroll | "0/22", "0/10", "0/8", "0/5", "0/22" | **FAIL** (F-2) |
| Sound Systems | S2/F2 · strip + noun | TROUBLESHOOT, BUILD, LEARN | "MODULE / 1 ▾" etc., no total; WHAT'S LEFT "6 modules not done yet."; "HOW A MODULE COUNTS / A module counts once every goal chip in it is met (a capstone, once its checklist passes); opening it does not count it." | PASS |
| Sound Systems | F2 1 · "How the bench works" not counted on NEXT | TROUBLESHOOT → GOT IT → NEXT → CONTENTS | "○ 01 How the bench works"; WHAT'S LEFT row "Left: Find where the example walk stopped." | PASS |
| Sound Systems | F2 1 · bench goal | CONTENTS → 01; tap AMPLIFIER, then PROCESSOR (screenshot, real taps) | Wrong: "✕ Not that one. Start where the walk started, the console input, and stop at the first reading that is not healthy." Right: "✓ Yes: the processor. Two healthy readings, then NO SIGNAL…"; chip "✓ Find where…"; CONTENTS "✓ 01" | PASS |
| Sound Systems | F2 1 · "What you can now do" goal | LEARN → CONTENTS → 22 (chip "○ Open all four practice modes") → tap BUILD, ROUTE, OPERATE, TROUBLESHOOT | Chip "✓ Open all four practice modes"; CONTENTS "✓ 22" | PASS (see NOTE 3 on the word "Open") |
| Sound Systems | F2 7 · fault titles | TROUBLESHOOT modules 2, 3, 4 | "○ Sound cuts in and out" (Dead signal), "○ Hum through the system" (Level, noise and distortion), "○ Vocals coming out of the subwoofer" (Routing; also in the CASE tray list) | PASS |
| Sound Systems | F2 2 · CASE number, title on bench | CASE → "Vocals coming out of the subwoofer" | Bench heading "VOCALS COMING OUT OF THE SUBWOOFER"; bezel "CASE 5", key "CASE ▸ 5" (no "5 OF 5") | PASS |
| Sound Systems | F2 3 · model note | bench, capstone 6 | "A teaching model: the readings come from sample faults." / "A teaching picture of coverage, not a measurement of a real room." | PASS |
| Sound Systems | F2 2 · capstone names | BUILD CONTENTS | "Capstone 6 · Band with four monitor mixes" (no "of 10"); REQS "8 LEFT"; CONSOLE key "2 LEFT" | PASS |
| Sound Systems | F2 5 · capstone 6 CONSOLE fold | Capstone 6 → CONSOLE → MORE CHANNELS ▾ | Five channels (Kick, Bass DI, Guitar, Keys, Lead vocal) with "Start with WEDGE 1 · SINGER: tap ▲ on Lead vocal…"; "MORE CHANNELS ▾ · snare, overheads, backing vox, announce, playback" opens Snare, Overheads, Backing vox, Announce, Playback, each with 4 sends; label turns "MORE CHANNELS ▴" | PASS |
| Sound Systems | F2 2 · CONSOLE tray heading | same tray | "ON THE CONSOLE · 0 OF 2" | **FAIL** (F-3) |
| Envelope | all-caps disclaimer still on screen | look at modules 1-3 | "ILLUSTRATIVE MODEL — DRAWN FROM THE SETTINGS, NOT A MEASUREMENT · vertical = relative level…" under every chart. `src/screens/lab/envelope/EnvelopeChart.tsx:52` `CHART_HONESTY`. (Envelope is F8's lab, outside my five reports: listed per CHECKER2 item 3) | LISTED (not in my scope) |

## FAIL list

### F-2 · Sound Systems hub WHAT IS LEFT still prints "N of total" counters (decision 2, F2)
- Repro: `#labpreview/SoundSystemsLab` at 390, scroll to WHAT IS LEFT. Rows read "LEARN · chapter pages … 0/22", "BUILD · capstones passed … 0/10", "ROUTE · exercises … 0/8", "OPERATE · exercises … 0/5", "TROUBLESHOOT · faults solved … 0/22".
- The mode cards just above were converted ("22 LEFT", "10 LEFT", "8 LEFT", "5 LEFT", "22 LEFT"), so the same screen now says the same thing two ways.
- Suspected: `src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx:229-231`, `<Text style={styles.leftCount}>{r.done}/{r.total}</Text>`. It needs the same `leftWord(r.done, r.total, …)` the cards use at :181.
- Not changed by this fix: the screen-reader label at :173 says "`${row.done} complete.`": that is a done count, not N of total, so it is fine.

### F-3 · Sound Systems capstone CONSOLE tray still says "ON THE CONSOLE · 0 OF 2" (decision 2, F2)
- Repro: `#labpreview/SoundSystemsBuild` → GOT IT → "1 ▾" → "Capstone 6 · Band with four monitor mixes" → tap the CONSOLE key (it reads "2 LEFT") → the tray's checklist heading reads "ON THE CONSOLE · 0 OF 2".
- The key that opened it says "2 LEFT", and the page's own list says "REQUIREMENTS · 8 LEFT". So the tray is the one place on the page still counting N of total.
- Suspected: `src/screens/lab/soundsystems/pagesBuild.tsx:565`, `<Eyebrow>ON THE CONSOLE · {routeMet} OF {routeReqs.length}</Eyebrow>`. It should use `leftWord(routeMet, routeReqs.length, …)` from `soundsystems/fixHelpers.ts`, like the REQUIREMENTS header. Every capstone with console requirements shows it (capstones 6-10).

### F-1 · De-Esser WHAT'S LEFT rows do not say what is still to do (decision 1, F7)
- Repro: `#labpreview/DeEsserLab` at 390 → GOT IT → MODULE/PAGE "1 ▾" → WHAT'S LEFT ›. Rows 03 The Detection Path … 09 Connections & Check read only "<nn> / <title> / ›".
- Now that 7 of the 9 pages count only on their check's right answer, a learner who pressed NEXT through them sees no reason they are not done.
- Suspected: `src/screens/lab/deesser/DeEsserLabScreen.tsx:606-623`. `<PagedLab>` gets no `pageDetail`. It is the only PagedLab lab without one: Envelope (`EnvelopeLabScreen.tsx:542`, `ENVELOPE_STILL_TO_DO`), Speech, DJ, Game Audio, both Mixing, Patchbay and Connector Selection all pass it. Something like "Still to do: answer this page's check right." for pages 2-5 and 7-9 would close it.

## NOTES (not FAILs)

1. **S1 · a stale inline note, seen once, not reproduced.** In my first Envelope visit I tapped GOT IT on module 1 and NEXT at once. Module 2 showed no note for about 1-2 s. When I pressed NEXT again, module 3 showed module 2's words ("Sounds fall into families… Tap Snare drum, then Trumpet…"), and they changed to module 3's words within 3 s. In the same pre-reset visit, module 5 later came up as a POPUP instead of inline. Two clean visits did not reproduce either: I reset the seen list, then tapped GOT IT and NEXT at 150 ms, and polled every 250 ms. Shared storage was being changed by other tabs at the time: `ape:intro:labTerms` grew from 3 to 4 entries mid-run, and the `screenIntroCards` list I started with was small. So I am not calling it a FAIL. If it recurs, look at `ScreenGuide.tsx:659-677`: an offer from the page just left can still present after `resetKey` changed.
2. **S1 · inline note heading.** The inline note shows one heading, "WHERE TO START", above both lines. The first line is the WHAT YOU'RE LEARNING text (`ScreenGuide.tsx:877-886`). A reader sees "Where to start: How the bearing edge… decides how much head touches shell" before the actual instruction. Consider a second small label, or no heading on the learning line.
3. **F2 · "Open all four practice modes".** On LEARN 22 the chip says "Open", but the instruction says "Tap each one to read what it practices". Tapping expands a line in place; it does not open the mode. "Tap all four practice modes" would match what happens.
4. **F2 · Sound Systems TROUBLESHOOT WHAT'S LEFT.** Rows 03-06 have no "Left: …" line until opened, by design: "Rows you opened this session name what is still missing." This is honest, but it is weaker than decision 1's "its WHAT'S LEFT row must say what is still to do".
5. **Kept as values (not flagged):**
   - Sound Systems "CONFIG n OF 13" / "TYPE n OF 10" (list positions, F2's call; `pagesLearnA.tsx:414`).
   - DJ "FADERS 0/85" (fader values).
   - EQ "4 still to get right" (count left).
   - Mixing Guides end rows have no per-row line, but HOW A GUIDE COUNTS states one rule for all ("tap MARK AS READ").
6. **Display delay.** EQ Filter Shapes showed "drawing…" for about 3 s on first load, then drew. Compression showed it once on LEARN → EXPLORE, then drew. No black boxes seen.
7. **Pre-existing comment.** `FixSignal.tsx:11` still says "SCENARIO n/5" in a code comment. It is not on screen.
