# CHECK2 K2 report: lab fix round 2 (phase 3) independent check (2026-11-14)

**Summary: 49 checked · 43 PASS · 3 FAIL · 3 NOT SEEABLE** (plus minor wording notes, not counted).

Checker K2. Scope:
- F3 phase 3: Game Audio, Stage Plot.
- F4 phase 3: Mixing Guides, Advanced Mixing, Mastering, Pre-Production.
- Career Finder owner decisions, round 4 (`docs/careerfinder_text_review_2026_11_14/FIXES_REPORT.md`, "Round 4").

How I checked:
- Preview http://localhost:8142, built-in pane, one tab (tab-1), 390x844, sound OFF. I never pressed ENABLE / I UNDERSTAND, PRINT, SHARE or DOWNLOAD.
- Read-only: this file is the only one I wrote.
- **The pane was hidden for the whole run.** `requestAnimationFrame` ran 0 frames per second. So I read the screen as page text and the accessibility tree, and pressed controls by their refs. Where it mattered, I checked with `document.elementFromPoint` that the control I pressed was on top.
- Nothing in `ape:*` storage was removed by me. The app's own guest-launch wipe cleared saved marks on each reload, as F4 described.
- Preview data changed by normal taps:
  - Game Audio pages 5, 11 and 12 done.
  - Two Stage Plot plots: a blank one with venue "Test Hall", and a Solo performer example.
  - Mixing Guides Pop marked read.
  - Mastering module 7 has one checklist line ticked.
  - A Pre-Production "Music recording" project with client "self".
  - Career Finder: all 28 questions answered.

## FAIL list

### FAIL 1: the inline step intro covers the well and blocks taps on the well's last controls (shared S1, regression)

Seen at 390x844 on two labs. The note is S1's phase-3 "later steps show the intro inline above the dock".

**Mastering, module 1:**
1. Open `#labpreview/MasteringLab` and close the first card with GOT IT.
2. Tap the foot "NEXT: LEARN · …" to go to step 2. The "WHERE TO START ✕" note appears at the bottom.
3. Scroll the step to its end. The foot "NEXT: LISTEN · LOUDER IS NOT BETTER ›" sits at y 754-802.
   - The note spans y 637-836.
   - `elementFromPoint` at the button's centre returns the note's text.
   - The page cannot scroll further.
   - Tapping NEXT does nothing.
4. Tap ✕, then NEXT, to reach step 3. A new note appears and covers y 554-771 of a well that spans y 503-779: about 80 % of the well.
   - The well is already scrolled to its end (scrollTop 301 of 301).
   - "HOW THIS COMPARISON WORKS · GO DEEPER ▾" (y 657) and the foot NEXT are under the note.
   - Tapping GO DEEPER does nothing.
   - It works after ✕.

**Game Audio:** go from page 2 to page 3 with the strip's NEXT ›.
- The note spans y 453-670.
- The whole well is y 488-678.
- At the well's end, the foot "NEXT: KINDS OF GAMES ›" is under the note (`elementFromPoint` returns "WHERE TO START ✕ …").

What the learner sees: the step's own content and its last buttons are hidden, and a tap on them does nothing until ✕. The way out (✕, or the strip's NEXT ›) is there, so nothing is locked. On Game Audio, the note also goes when a tray opens.

Suspected cause:
- `src/features/lab/screenGuide/ScreenGuide.tsx:872-893` (`ScreenIntroInline`): an absolute overlay placed by `placeGuideStep('strip', …)` with no matching bottom inset in the well. With two text lines plus the header and ⓘ, the "compact strip" is 217 px tall, taller than a phone's well.
- On a read step with no dock (Mastering M1 S2), it sits over the page itself.

### FAIL 2: Pre-Production, FOLD THE OPTIONAL QUESTIONS does nothing once an optional question is answered (dead tap)

1. Go to `http://localhost:8142/` › OPEN LABS › EXPLORE ADVANCED LABS › Audio Pre-Production › Music recording › stage 1 "Define the Project".
2. Tap "2 MORE QUESTIONS · OPTIONAL · GO DEEPER ▾" under Project Brief.
3. Type anything in "Client or organization" and leave the field. The stage line reads "1 question answered".
4. Tap "FOLD THE OPTIONAL QUESTIONS ▴". Nothing happens. Tap it again: still nothing.

Suspected cause: `src/screens/lab/production/ProductionStageScreen.tsx:496` and `:503`.
- `moreOpen = openMore.has(id) || optional.some(f => f.fieldId === focus || touched(f.fieldId))`.
- The press only removes the id from `openMore`, so once a question is answered (or marked not applicable) the fold is forced open and its key can never close it.
- The same holds when the stage was opened with `focus` on an optional question.

The two ways to fix it:
- the forced-open rule should only set the starting state; or
- the key should be hidden or relabelled while the fold cannot close.

### FAIL 3: Career Finder: family example titles that are not in that family's list

As asked, I checked that each family example is a real title in that family's list. I checked five family pages on screen and all 42 families against the index data with a script.

Seen on screen: the example rows under EXAMPLE TITLES are plain text, not links.

**Manufacturing, Quality, Calibration & Repair (53 titles):**
- Shows "Audio Test Engineer" (the owner's pick, CF-A0435).
- In `src/data/careerIndex.json` that title is only in *Audio Hardware, Transducers & Electronics Engineering*.
- A learner who browses the family's 53 titles will not find it.
- FIXES_REPORT round 4 discloses this ("For the owner, one item").

**Music Retail, Rental & Instrument Services:**
- "Pro Audio Retail Specialist" is in *Audio Business, Product, Sales & Operations*.
- "Backline Technician" is in *Stagecraft, Rigging, Power & Production Support*.
- Both are older examples, not changed this round.

All 42 families, from `src/features/careerfinder/families.ts` against `careerIndex.json`: 11 cross-family examples (FIXES_REPORT's "Audio Test Engineer" plus "ten older").

| Family showing it | Example | Family it is in |
|---|---|---|
| Manufacturing, Quality, Calibration & Repair | Audio Test Engineer | Audio Hardware, Transducers & Electronics Engineering |
| Audio Business, Product, Sales & Operations | Studio Manager | Recording Studios & Music Production |
| Sonic Branding, UX, Exhibits & Experience Design | Exhibit Audio Designer | Installed AV, Integration & Institutional Systems |
| Music for Picture, Scoring & Editorial | Orchestrator | Music Creation, DAWs, Synthesis & Sonic Art |
| Session Performance, Voice & Musical Direction | Vocal Producer | Recording Studios & Music Production |
| Telecom, Voice Quality & Communications Audio | Telecommunications Audio Engineer | Consumer, Home, Vehicle & Personal Audio |
| Music Curation, Repertoire, Libraries & Editorial | Music Supervisor | Audio Business, Product, Sales & Operations |
| Defense, Sonar & Acoustic Intelligence | Underwater Acoustics Engineer | Scientific, Environmental & Applied Acoustics |
| Accessible Media & Audio Description | Audio Description Narrator | Podcast, Audiobook, Voice & Spoken-Word Production |
| Music Retail, Rental & Instrument Services | Pro Audio Retail Specialist | Audio Business, Product, Sales & Operations |
| Music Retail, Rental & Instrument Services | Backline Technician | Stagecraft, Rigging, Power & Production Support |

Not in the index at all: "Audio Instructor" (Education…) and "Consumer Audio Product Specialist" (Consumer…). The owner chose to keep both ("keep mine"), so they are a note, not part of this FAIL.

This needs an owner decision, not a code fix. There are two ways:
- move the title into that family through the overrides; or
- pick an example that is in the family.

## Game Audio (F3 phase 3)

| Lab | Item | Steps | Seen | Result |
|---|---|---|---|---|
| Game Audio | Strip says PAGE, no total | Opened `#labpreview/GameAudioLab` | "PAGE 1 ▾", screen-reader label "Page 1. Opens the contents"; later "PAGE 5 ▾", "PAGE 11 ▾", "PAGE 12 ▾". No "n / N" | PASS |
| Game Audio | CONTENTS: 24 rows, names, split pages in order | Tapped the strip | 01 Welcome and safe listening … 04 Kinds of games, 05 Whose ears: the listener, 06 Kinds of game sound … 11 Ambience and zones, 12 Loops and their joins, 13 Emitters and distance … 24 Capstone and free play | PASS |
| Game Audio | Page 5: goals and check (F3 did not see them) | 1. LISTENER tray: GENERATOR 1 on (GEN PAN "R 55%"), then OVERHEAD CAMERA. 2. FACING +1 step (90°→95°): GEN PAN stayed R 55% with the camera listening. 3. LISTENER: YOUR EARS. 4. Check: "Direction is measured from the listener, and it has moved" | Each chip ticked when its action happened, then "✓ Every goal here is done, so this page is counted."; the foot read "NEXT: KINDS OF GAME SOUND ›". CONTENTS then read "Page 5, Whose ears: the listener, done". Page 1 (opened, nothing done) stayed not done; page 6 read "current", not done | PASS |
| Game Audio | Page 11: doorway goal (F3 did not see it) | 1. SOUNDS: SCENE on, OPEN DOOR, close the tray. 2. STEP ×7 facing 90°: ZONE COURTYARD → WORKSHOP, log "ZONE: the listener entered the workshop. ONE crossfade…". 3. Dragged FACING to 280°. 4. STEP ×5: ZONE back to COURTYARD | "✓ Cross the doorway twice with the scene running"; BEDS stayed 2 | PASS |
| Game Audio | Page 11: check (F3 did not see it) | Wrong pick "One for every step you take", then "One: it started once, with the scene" | Wrong: "A step is a trigger for a footstep, not for the bed." Right: the explanation, "✓ Pass the check", "✓ Every goal here is done, so this page is counted."; the foot read "NEXT: LOOPS AND THEIR JOINS ›" | PASS |
| Game Audio | Page 12: goals and check (F3 did not see the check) | SCENE on; WIND → RAW CUT; waited 14 s; ■ STOP; check "It stays, because the join inside the file is unchanged" | WIND readout "RAW CUT", the strip "JUMPS 1", first goal ✓. ■ STOP ticked the second goal; the check ✓; "this page is counted"; the foot read "NEXT: EMITTERS AND DISTANCE ›" | PASS |
| Game Audio | "drawing…" on scene pages | Watched the page for changes, then NEXT 5→6, CONTENTS → 11, NEXT 11→12 | "drawing…" was on the glass when pages 6, 11 and 12 opened (the page text read "PAGE 6 ▾ NEXT › drawing…"), and gone 2.5 s later | PASS |
| Game Audio | Step intro: popup first, inline after | Page 1 (first of the visit), then pages 5, 11, 12 | Page 1: a popup card with GOT IT. Later pages: a "WHERE TO START ✕" note, no popup. But see FAIL 1: the note covers the well | PASS (behaviour); placement is FAIL 1 |
| Game Audio | First tap after a popup closed | After a CONTENTS row (or a tray) closed its popup, the next tap on the strip or on LISTENER did nothing; the second tap opened it | Animations never finish in this hidden pane (0 frames), so a popup's closing never completes here. It is the same preview-only effect F3 recorded for SP-4 | NOT SEEABLE (hidden pane); not counted as a dead tap |
| Game Audio | End screen rows | CONTENTS → WHAT'S LEFT › | Top: "21 pages not done yet." (24 − 3), and "HOW A PAGE COUNTS" said once. Rows 01-04, 06-10 and 13-21 each read "Still to do: …" with that page's goals; 05, 11 and 12 are not listed. 22: "Counts once its six checks are done…"; 23: "…its two checks…"; 24: "…its seven goals are done in one visit. Its check is optional…". Foot: "✓ 3 DONE". The word is "page" throughout; nothing says opening counts | PASS |

## Stage Plot (F3 phase 3)

| Lab | Item | Steps | Seen | Result |
|---|---|---|---|---|
| Stage Plot | SETUP order and folded rows on a new blank plot | START on Blank stage | From the top:<br>1. GUIDED TASK (open).<br>2. THE BAND.<br>3. PERFORMERS ("No performers yet.").<br>4. "Five more parts of the packet. All are optional: open one when you need it."<br>5. Five rows, each with GO DEEPER ▾ and its summary:<br>• THE GIG: "The venue, the date and the times. Nothing typed yet."<br>• TECHNICAL CONTACT: "The person the venue’s engineer should ask. Nobody yet."<br>• REVISION AND STATUS: "Revision 1 · Draft"<br>• STAGE SIZE: "Rectangle · no size yet (not to scale)"<br>• NOTES: "Nothing written yet." | PASS |
| Stage Plot | Open each of the five rows myself | Pressed TECHNICAL CONTACT, REVISION AND STATUS, STAGE SIZE, NOTES, then THE GIG | Each opened in place, with HIDE ▴ and its fields:<br>• Contact: name, role, email, phone, each with "Show … in the packet ✓ ON".<br>• Revision: "1 revision, printed on every page", Status Draft / Ready to advance, the advancing note, GO TO THE REVIEW.<br>• Stage size: Rectangle / Thrust / In the round, Wings, Width, Depth, Feet / Meters, Estimated / Confirmed, three ⓘ notes.<br>• Notes: General notes, Access and setup notes, Viewpoint note.<br>• The gig: Venue, Event date, Load-in, Soundcheck, Performance.<br>All five could be open at once. Compared with `SetupArea.tsx:444-560`: nothing missing | PASS |
| Stage Plot | A closed row shows its value once filled in | Typed "Test Hall" in Venue, then HIDE ▴ | Closed row: "THE GIG / Test Hall / GO DEEPER ▾" | PASS |
| Stage Plot | Review question on the closed contact row | START on Solo performer | Closed TECHNICAL CONTACT row: "? The packet shows no technical contact with a phone number or an email. The venue’s engineer has nobody to ask." | PASS |
| Stage Plot | The review's "Go to it" for the contact (F3 did not press it) | EXPORT › REVIEW › GO TO › on the contact question | The Setup tab was selected and TECHNICAL CONTACT was open, with its warning inside. The view did not scroll to it here (scrollTop stayed 0; the row was at y 1263 of an 844 view) | Opening: PASS. Scroll: NOT SEEABLE |
| Stage Plot | Export's GO TO SETUP | Folded the contact again; EXPORT › "Contact shown in the packet: none. Change it in SETUP." › GO TO SETUP | The Setup tab, with TECHNICAL CONTACT open. Again no scroll here | Opening: PASS. Scroll: NOT SEEABLE |
| Stage Plot | Screen-reader label of two closed rows | Read the row buttons' labels | "REVISION AND STATUS. Revision 1 · Draft Show this part." and "STAGE SIZE. Rectangle · no size yet (not to scale) Show this part." have no full stop before "Show this part" (the other three summaries end in "."). Source: `src/features/stageplot/spSetupFolds.ts:61,66` | Minor wording |

About the scroll:
- It waits for the contact block's `onLayout` (`SetupArea.tsx:457-463`).
- On the web, `onLayout` needs a rendered frame, and this pane rendered 0 frames per second all session.
- F3 saw the scroll work after the fix (P3-7).
- It needs one look with the pane in front, or on a phone.

## Mixing Guides and Advanced Mixing (F4 phase 3)

| Lab | Item | Steps | Seen | Result |
|---|---|---|---|---|
| Mixing Guides | Header and strip | `#labpreview/MixingGuide/pop` | Subtitle "Mixing guide" (no "1 of 50"); strip "GUIDE / POP ▾" | PASS |
| Mixing Guides | NEXT › must NOT count | Pop: GOT IT, then the foot "NEXT: HIP-HOP / RAP ›"; opened CONTENTS | "Guide 1, Pop" (not done), "Guide 2, Hip-Hop / Rap, current" | PASS |
| Mixing Guides | MARK AS READ counts | CONTENTS › Pop › MARK AS READ | The subtitle became "Mixing guide · read" and the button "✓ READ"; CONTENTS read "Guide 1, Pop, done, current" | PASS |
| Mixing Guides | End screen | WHAT'S LEFT › | "49 guides not done yet."; "HOW A GUIDE COUNTS: A guide counts as read when you reach its end and tap MARK AS READ. Opening it, or moving on with NEXT ›, ‹ PREV or the list, does not count."; Pop not listed | PASS |
| Advanced Mixing | Strip unit | `#advmixingpreview` | "PAGE 1 ▾" … "PAGE 13 ▾"; CONTENTS has 20 rows, "Page n, title" | PASS |
| Advanced Mixing | Page 7: fold, toolkit goal still required | Opened THE ADVANCED TOOLKIT, then the four tools | Order: the lead, the ▶ rows and curves, then the closed fold, the check, and the goals. After opening the four tools: "✓ Open all four tools". The page stayed not done (other goals still open) | PASS |
| Advanced Mixing | Page 8 | NEXT from page 7 | The ▶ rows and the kick drawing, then "THE ADVANCED TOOLKIT / GO DEEPER ▾", the check, and the goal "○ Open all five tools" | PASS |
| Advanced Mixing | Page 10 | CONTENTS › 10 | The ▶ rows and the decay plot, then "THE SET-DESIGN TOOLKIT / GO DEEPER ▾", the check, "○ Open all four tools" | PASS |
| Advanced Mixing | Page 11 | CONTENTS › 11 | The ▶ rows and the harmonics drawing, then "THE TOOLKIT / GO DEEPER ▾", the check, "○ Open all four cards" | PASS |
| Advanced Mixing | Page 13 | CONTENTS › 13 | The ▶ rows and the automation lanes, then "THE MOVES / GO DEEPER ▾", the check, "○ Open all four moves" | PASS |
| Advanced Mixing | Page 2 counter | CONTENTS › 2 | "3 more to choose — a priority list longer than three is a wish list." | PASS |

Notes for the owner (not counted):
- **The fold's close word differs between labs:** the mixing labs say "FOLD ▴" and Stage Plot says "HIDE ▴". Both open with "GO DEEPER ▾".
- **Page 8's check depends on folded text:** it asks about serial compression, which is explained only inside the closed fold. The toolkit goal makes the learner open the fold, so the answer can be reached.

## Mastering (F4 phase 3)

| Lab | Item | Steps | Seen | Result |
|---|---|---|---|---|
| Mastering | Strip | `#labpreview/MasteringLab` | "MODULE 1 · STEP 1 ▾" … "MODULE 8 · STEP 5 ▾", no total. STAGE "4 / 5" on the bezel is a slider position, which the owner's rule keeps | PASS |
| Mastering | Module 1, step 3: order | GOT IT, then NEXT twice | 1. "What to listen for at matched level".<br>2. "Play THE MIX, then LOUDER…".<br>3. "Before you switch MATCH off".<br>4. "HOW THIS COMPARISON WORKS / GO DEEPER ▾", closed.<br>Opened (after ✕ on the note): the 8 dB text, the measured LUFS and PLR line, the TRUE PK note, the faceplate and the honesty note. All of `mod1What.tsx:134-158` is there | PASS |
| Mastering | Plain model note | Module 1, step 3 | "Measured offline: estimated meters, a simple limiter, your phone’s uncalibrated output." One plain line, no all-caps badge | PASS. Note: it says "phone" in a browser and on a tablet too |
| Mastering | Module 7 counter | Module 7, step 2; ticked one line in the CONFIRM tray | "CONFIRMED 6 LEFT", "CONFIRM: 6 LEFT", sheet "6 LEFT"; after the tick, all read "5 LEFT" | PASS |
| Mastering | Module 8 counters | Steps 3 and 5 | Step 3: "Ready?". Step 5: "9 lines left to check". "N lines to look at again" appears only after the reveal (checked in code, `mod8Project.tsx:112`) | PASS |
| Mastering | End screen | FINISH · SEE WHAT’S LEFT | "8 modules not done yet." (walking through the steps counted nothing). HOW A MODULE COUNTS is said once. Each row says what is left, e.g. "8 decisions still to answer on its PRACTICE step." | PASS |

## Pre-Production (F4 phase 3), through the full app

There is no `#labpreview` route. Path: `http://localhost:8142/` › OPEN LABS › EXPLORE ADVANCED LABS › Audio Pre-Production › Music recording.

| Lab | Item | Steps | Seen | Result |
|---|---|---|---|---|
| Pre-Production | Stage 1 shows the 17 required questions first | Stage 1 "Define the Project" | Brief: 10 required, then "2 MORE QUESTIONS · OPTIONAL · GO DEEPER ▾". Scope: 5, then "6 MORE…". Creative Direction: 2, then "8 MORE…". That is 17 shown and 16 folded: 33 in all | PASS |
| Pre-Production | A fold opens and keeps every question | Tapped "2 MORE QUESTIONS…" | "Client or organization" and "What limitations already exist?" appeared, each with its hint and "Not applicable" | PASS |
| Pre-Production | Stage rows' words | Project home | "Not started · 0 required decided · 0 answered"; "0 required decisions made" | PASS |
| Pre-Production | FOLD after an answer | See FAIL 2 | Nothing happens | **FAIL 2** |
| Pre-Production | Field labels | — | "Project name ·  required": two spaces after the middle dot on every required label | Minor wording |

## Career Finder, round 4 (`#careerfinderpreview`)

I answered all 28 questions with varied ratings to reach a result.

| Item | Seen | Result |
|---|---|---|
| Results title | "Your audio career results", under the kicker "AUDIO CAREER FINDER · RESULTS" | PASS |
| Results lead (CF-A0072) | "These five audio career families draw most on what you said you would enjoy. Start with the top one." | PASS |
| Results note (CF-A0073) | "These are possibilities to explore, not limits on what you can pursue. Interests change with experience, so your results may change too." | PASS |
| Feedback question (CF-A0136) | "Did these results give you at least one career family you would explore?" with YES / SOMEWHAT / NO | PASS |
| Feedback screen-reader label (CF-A0137) | Radiogroup label: "Did these results give you at least one career family you would explore" | PASS |
| Sound System spelling | The index has AC-0479, AC-1079, AC-1189, AC-1190 as "Sound System …". The Audio Measurement family page shows the example "▸ Sound System Alignment Engineer" and lists "Sound System Measurement Technician" and "Sound System Alignment Engineer". No "Sound-System" remains in `src/` except one code comment (`miking/lessons/f14SystemMeasurement/lesson.ts:5`) | PASS |
| Examples on Mixing & Mastering | Mix Engineer · Mastering Engineer · Assistant Mixing Engineer: all three are in the family | PASS |
| Examples on Audio Measurement, System Tuning & Instrumentation | Sound System Alignment Engineer · Electroacoustic Measurement Engineer · Audio Measurement Technician: all three are in the family | PASS |
| Examples on Manufacturing and on Music Retail | See FAIL 3 | **FAIL 3** |
| Examples on Education, Research, Training & Technical Communication | Audio Instructor · Curriculum Developer — Audio · Audio Technical Writer. "Audio Instructor" is not an index title; the owner chose to keep it | Note (owner decision) |

Note, outside this round's scope: the quiz shows "Question 1 of 28", an N-of-total counter. It was not added in this round. The owner's rule (D117) says progress never shows N of total; the Career Finder quiz may need the same decision.

## Not checked, and why

- Anything that needs a visible pane:
  - the Stage Plot scroll into view after GO TO;
  - colours, and text cut at 390 (I could not take screenshots);
  - 320 wide.
- Sound: never switched on.
- Game Audio's saved-mark move (old 22 pages to the new 24): it needs a phone that holds a record saved before the change (F3's held item). The preview runs as a guest, so it saves nothing.
- Post-Production: not in my list.
