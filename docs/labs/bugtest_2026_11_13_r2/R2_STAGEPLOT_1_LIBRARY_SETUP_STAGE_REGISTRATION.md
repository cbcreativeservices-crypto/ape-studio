# Bug test round 2, SP1: Stage Plot (Library, Setup, Stage) and the registration of both labs

Tester: R2-SP1, 2026-11-13.
- **Where:** preview `http://localhost:8142/#labpreview/StagePlotLab` and Home → OPEN LABS, in my own tab (tab-51, now closed).
- **Sizes:** 390 x 844, 375 x 667 and 320 x 640.
- **Evidence:** `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\r2_sp1\` (file names below).
- **Code read:** workbench HEAD `365f5b40`, which includes `2a78624c` (held items) and `2fc3f7cd` (registration).
- **Changed nothing:** no source file, git, storage or eas change. Sound stayed off.
- **Never pressed:** DOWNLOAD PDF, SHARE, PRINT, sign-in, purchase, SEE MEMBERSHIP PLANS.

How I drove it:
- I pressed controls by their accessibility labels and typed by setting the field value and sending focusin, input and focusout events.
  - The pane's document never has focus, so a plain `blur()` does not reach React. Only the 1.5-second idle commit then fires, which first looked like a riser-size bug. Every field result below was checked again with focusout.
- `window.confirm` and `window.alert` were recorded in my tab, and `confirm` answered "yes" only for the delete test. The pane blocks native dialogs.
- I read results from the page text, the SVG text boxes (overlaps measured pairwise) and the a11y labels. Screenshots were enlarged by cloning the stage SVG at 3x.

**Counts of new bugs: S1 1 · S2 3 · S3 6.** Round 1: 18 FIXED, 3 PARTLY FIXED, 0 STILL BROKEN, 0 broken differently.

---

## 1. Round 1 re-check

| R1 ID | Result | Evidence (steps from round 1, repeated) |
|---|---|---|
| S1-01 stage a strip at 375 x 667 | **PARTLY FIXED** | Salsa at 375 x 667: stage SVG 139 px (was 87), deck about 95 px. The key is capped at 91 px and scrolls inside itself (59 px window, 109 px content). Four-piece is the same: 139 / 91. The names still pile up at 375 and 320: see R2-SP1-02. (02, 03, 04) |
| S2-02 removed instrument leaves inputs unasked | FIXED | Four-piece, Drums › REMOVE FROM THE STAGE › YES: the tab reads "Stage. One review question.", with NOT ON THE STAGE YET and PLACE DRUM KIT ON THE STAGE. UNDO clears both. |
| S2-03 "Marisol M6" | FIXED at 390 | Salsa 390 x 844: all 12 performers are drawn with their own code ("Marisol M1", "Chino M6", "Beto M3" …), gap 6–8 px, 0 text overlaps. (01) |
| S2-04 Snap / Grid start a revision | FIXED | Solo, Ready, then Snap off/on and Grid off/on: still "Revision 1 · Ready", UNDO stays disabled. Grid, Names and Numbers each change the drawing (paths 26→25, texts 16→8, 16→12). |
| S2-05 bad email answers the contact question | FIXED (email) | "ana-at-example" keeps "Setup. 3 review questions." plus "This does not look like an email address"; "ana@example.com" gives 2. The phone has the same hole: R2-SP1-07. |
| S2-06 step 2 Done with an empty performer | FIXED | Salsa + ADD A PERFORMER: step 2 reads "To do. In Inputs, add what each performer plays or sings…". |
| S2-07 duplicate keeps the linked name | FIXED | It is named "Wedge 1 (copy)", with the question "…is drawn on the stage but is not in the monitor plan". It lands at depth 86 %, on the stage. |
| S2-08 Name on the plot differs from Monitors | FIXED | Wedge 1 → "Front wedge": Monitors reads "Devices on this mix: Front wedge." |
| S2-09 riser wider than the stage | FIXED | Width 500 → field 100, riser 305 px = the deck. Note: "A platform cannot be larger than the stage, so it was set to 100 %…". 0 → "A size must be above 0, so nothing changed." abc → "Not read as a size…". |
| S2-10 full screen opens at 1.9x | FIXED | Four-piece FULL SCREEN opens at "1.0× · the whole stage" with all four performers in view. (10) The held part is unchanged: DISPLAY 3× magnifies the key's corner while the dock still says "1.0× · the whole stage". (11) |
| S2-11 any month prefix read | FIXED | "Junk 5 2026" and "Mayday 1 2026" are refused. "Sept 9 2026", "Dec. 5 2026" and "12 Dec 2026" are read. The same holds in the gig-copy sheet, where 5/12/2026 is refused with an alert. |
| S2-12 VIEW covers the stage | FIXED | VIEW is a tray under the drawing, both in the editor and in full screen. (07, 12) |
| S2-13 long name reflows the dock | FIXED | OBJECT reads "GÜIRO MAN W…" (70 px). The dock stays one row at y 782, and the stage stays 280 px. |
| S3-01 times taken silently | FIXED | "25:99 PM", "soon" and "13:00 PM" each get "Not read as a time: … It is printed as typed." "7:30 PM", "19:30" and "7pm" are quiet. |
| S3-02 stage size wording | FIXED | 1001 → "A stage size above 1000 is not taken". Width only → "Until both the width and the depth are set…". The field is still wiped on refusal: R2-SP1-08. |
| S3-03 typed position silent | FIXED | 150 → 125 with "An object can stand at most a quarter of the stage off it…". abc → "Not read as a number". 45.5 is kept. |
| S3-04 "(example)" note says "in Setup" | FIXED | "Change it or clear it above." |
| S3-05 copies look alike | FIXED | The header reads "The Renamed Band · copy" or "· gig copy". The rows and MORE labels say "(copy)" and "(gig copy)". |
| S3-06 new objects on the front lip | FIXED | ADD Equipment rack lands at depth 66.7 %. |
| S3-07 screen state resets | PARTLY FIXED | Names, Numbers and the guided steps now survive leaving the area. ZOOM still resets: 2.0× → Setup → Stage gives 1.0×. |
| S3-08 refused date wipes the text | FIXED | "5/12/2026" stays in the field with the note "(it is still December 5, 2026)". |
| S3-09 LOCATE then Setup reopens the row | FIXED | The row stays closed and Maya stays selected on Stage. |

---

## 2. New bugs

### R2-SP1-01 · Setup guided task / credit · S1. Marking a plot READY marks "Make the packet" done and earns `tr_stage_plot` with no packet made

**Steps from a clean open:**
1. START Solo performer.
2. In Setup, set Band "Test Band", Title "Club set" and Phone "+1 555 0100". The tabs show no marks.
3. Press SHOW THE STEPS: steps 1–4 show ✓, step 5 shows "○ Make the packet · To do. In Export, print or share the packet."
4. Press Status: Ready to advance.

**Expected:** step 5 stays To do until a PDF, a print or a share is made. That is the step's own text, the handoff's credit rule and the new sentence "All five done on one stage plot complete this lab."

**What happened:**
- Step 5 shows "✓ Make the packet · Done." The bar reads "Revision 2 · Ready". Export was never opened.
- The credit effect uses the same expression (`ed.exported && spGuidedSteps(...).every(done)`), so `reportTrainingComplete('tr_stage_plot')` fires. From an example, the certificate credit takes three typed fields and one tap.
- Going back to Draft keeps step 5 at Done: `spMarkDraft` keeps `frozenRevision`.

**Evidence:** `06_solo_ready_marks_make_the_packet_done_no_packet_made.jpg`.

**Cause:**
- `spContext.tsx:253`: `exported: exportedRev === project.revision || project.frozenRevision >= project.revision`.
- `spMarkReady` (`spModel.ts:236-241`) sets `frozenRevision = revision`, the same field an export sets.
- That value is read at `StagePlotLabScreen.tsx:218` and `spReview.ts:353`.

**Smallest fix:** keep the packet apart from Ready. For example, store `packetRevision` on the project, set only by `spAfterExport` from `ExportArea.finish(snap, true)`, and make `exported = packetRevision >= revision` (it still survives a restart). Or drop the `frozenRevision` clause and accept that the packet must be remade after a restart.

**Checked and correct:**
- The report happens once at the sink: `markLabUnit` → `withHeldUnit` dedupes, and the preview earns nothing.
- An undo after the credit takes nothing back (by design). Deleting the plot takes nothing back.
- DUPLICATE and gig copies reset `frozenRevision` to 0 (`spModel.ts:1039`), so a copy is not pre-credited.
- A packet made before the last question is answered does not count: the edit moves the revision on.

### R2-SP1-02 · Stage, Salsa at 375 x 667 and 320 x 640 · S2. Names pile on top of each other and are covered by badges, while the note says every performer is named

**Steps:** START Salsa band, open STAGE, and set the viewport to 375 x 667, then to 320 x 640.

**Expected:** names and codes apart (or dropped and said so); every performer's name readable.

**What happened at 375 x 667** (stage SVG 139 px, deck about 95 px):
- 9 text boxes overlap: "Nelson" × "Luisito" (26 × 1 px), "Yolanda" × "Ana", "1–2" × "Tito" (7 × 6), "M2" × "14" × "M6", and "Chino" and "Papo" × the word UPSTAGE.
- Labels stand far from their figures, some with leaders. "Yolanda" is drawn up beside the trombones; "Marisol" and "Beto M3" sit in the bottom-right corner.
- The note: "10 performers are named without their mix codes at this size."

**What happened at 320 x 640** (SVG 111 px, deck about 75 px):
- 18 overlaps.
- "Marisol" is covered by the channel badge "13" (10 × 10 px), so it reads "…isol". "Nelson" is under "M2", "Rafa" under "15", and "Tito" under "14". "8–9" and "3–5" are under "15".
- The note still says "…and every performer is named. 11 performers are named without their mix codes…".

**At 390 x 844 it is correct** (01): the re-spacing works there only.

**Evidence:** `02_salsa_375x667_phone.jpg`, `03_salsa_375x667_enlarged_labels_overlap.jpg`, `04_salsa_320x640_phone_stage_strip.jpg`, `05_salsa_320_enlarged_names_covered_by_badges.jpg`.

**Cause:**
- `stageGeom.ts:747` (a performer's name alone falls back to `leastBad`) and `:764` (an equipment badge falls back to `leastBad(it, [onIt, ...numSpots])`). On a 75–95 px deck both land on top of names: rule 3 is broken and nothing reports it.
- `StageArea.tsx:387` then claims "every performer is named".

**Smallest fix:**
1. In the last fallback, never place an equipment badge on a performer's label. Print it on its own symbol even over art, or leave it out and count it.
2. Count names that are covered, and do not say "every performer is named" while one is.
3. Give the stage a minimum deck height (about 140 px) on short phones: the 120 px editor bar at 320 is part of this (R2-SP1-06).

### R2-SP1-03 · Setup, review "Go to it" · S2. Band name and title questions do not lead to their field while the guided steps are open

**Steps:**
1. START Salsa band (or open one where SHOW THE STEPS was pressed; the steps now stay open across visits, which is the S3-07 fix).
2. Open Export and press "Go to it: The packet has no band or artist name on it."
3. Then press "Go to it: The title still says '(example)'…".

**Expected:** Setup opens with that field and its note in view.

**What happened:**
- Setup opens at scrollTop 0, on the guided steps.
- At 390 x 844 the band field is at y 818 (26 of its 48 px show, and its note is off-screen).
- At 375 x 667 the band field is at y 834 and the title at y 994, both off the screen.
- The contact question does scroll (field at y 390).

**Evidence:** `08_375x667_goto_title_lands_on_guided_steps_field_offscreen.jpg`.

**Cause:** `SetupArea.tsx:121-136`. The comment says "The band name and the title are on the first screen", so only 'contact' and 'performers' are scrolled to. The open steps (about 450 px) push them down.

**Smallest fix:** scroll to the BAND block, using `onLayout` like contact, for the `band` and `title` fields too.

### R2-SP1-04 · Library / credit · S2. Every example arrives with guided steps 1–3 already done

**Steps:** START Solo performer, Acoustic duo, Four-piece band or Salsa band, then SHOW THE STEPS.

**What happened:**
- Steps 1–3 show ✓ before the learner has done anything.
- With the credit rule, an example needs only a few typed fields and the packet (or, today, Ready: R2-SP1-01).
- The task's own hint says "Five steps from an empty stage to a packet", and the sentence added in round 2 says "All five done on one stage plot complete this lab."

**Expected:** an owner decision. Either the credit counts only on a plot started from Blank, or the hint says that the examples start with steps 1–3 done.

**Cause:** `spGuidedSteps` judges the project as it stands. `spTemplates` content satisfies `placed`, `sources` and `monitors`.

**Smallest fix:** record `startedFrom` (it exists for the "Started from:" line) and report the credit only when it is 'blank'. Or reword the sentence.

### R2-SP1-05 · Stage key · S3. The "▼ MORE" tag never goes away

**Steps:** 375 x 667, Four-piece, STAGE. Scroll the key to its end, where "END OF THE KEY" is shown.

**What happened:** "▼ MORE" stays at y 375 on the corner of the key.

**Cause:** `StageKey.tsx:99-101`. The tag is static (`pointerEvents="none"`, no scroll state).

**Fix:** hide it once the scroll reaches the end, or drop it, since END OF THE KEY already says so.

### R2-SP1-06 · Editor bar at 320 wide · S3. The status wraps to six lines and takes about 120 px from the stage

**Steps:** 320 x 640, any plot.

**What happened:**
- The bar is 121 px tall: "Revision 1 / · Draft / Not saved: / kept only / until you / close the app". "· Draft" is orphaned on its own line.
- The page title also wraps to two lines.
- With the OBJECT tray open the stage deck is about 75 px.

**Evidence:** `13_320x640_playback_header_bar_6_lines_stage_75px_object_tray.jpg`.

**Cause:** `StagePlotLabScreen.tsx:276-281` and `SAVE_WORDS['session-only']`.

**Fix:**
- Below 360 wide, use "Not saved" (the full sentence is in the library note and in the a11y label).
- Keep "Revision 1 · Draft" on one line with `numberOfLines`, or shrink the letter spacing.

### R2-SP1-07 · Setup contact · S3. A phone with no digits answers the "no technical contact" question

**Steps:** Solo. Clear the email, then type Phone "abc".

**What happened:** the Setup mark goes from 3 to 2 and the question is cleared, with no note under the field.

**Cause:** `spReview.ts:137`, `hasText(c.phone)`.

**Fix:** require at least 5 digits (`/\d.*\d.*\d.*\d.*\d/`), and give the same "does not look like a phone number" note the email has.

### R2-SP1-08 · Setup stage size · S3. A refused size wipes the typed text

**Steps:** Setup › Width "1001", then "0", "-5" and "abc".

**What happened:**
- The note is right ("A stage size above 1000 is not taken…"), but the field is emptied each time.
- The date field keeps refused text since the S3-08 fix; this field does not.
- "-5" is answered "not understood… Type a number", though −5 is a number.

**Cause:** `SetupArea.tsx` stage-size commit together with the `useDraft` resync (`spForm.tsx:92-94`) to a `null` value.

**Fix:** keep the refused text with the note, as the date does, and say "must be more than 0" for a negative number.

### R2-SP1-09 · Setup, REMOVE a performer · S3. The sheet says "in both choices" when it shows one

**Steps:** Salsa, ADD A PERFORMER, PLACE ON THE STAGE, then EDIT › REMOVE.

**What happened:** "• The object that stands for them on the stage. It is removed with them in both choices." Only one remove button and CANCEL are shown.

**Evidence:** `09_remove_sheet_says_both_choices_with_one_choice.jpg`.

**Cause:** `SetupArea.tsx:461`, shown whenever `!hasOwn` as well.

**Fix:** "It is removed with them." when `!hasOwn`.

### R2-SP1-10 · Stage · S3. ZOOM still resets on leaving the area (the rest of round-1 S3-07)

**Steps:** STAGE, ZOOM IN twice (2.0×), SETUP, STAGE.

**What happened:** "1.0× · the whole stage". Names, Numbers, Grid and Snap are kept.

**Fix:** keep the zoom and pan in the editor state, like the Names switch. Or close this as by design.

---

## 3. Control table: what round 1 did not test, or tested differently

| Screen | Control | Purpose | Result | Seen |
|---|---|---|---|---|
| Library | START, double tap | One plot per press | PASS | Two presses gave one "Untitled stage plot". |
| Library | MORE › DUPLICATE FOR A GIG with an unread date | Refuse in words | PASS | Alert: "Date not understood…". The sheet stays open. |
| Library | DELETE (confirm no / yes) | Delete after asking | PASS | "…This cannot be undone. The gig copies made from it are kept." The gig row then reads "its master is no longer on this device". |
| Library | Acoustic duo, Band with playback starts | Open and draw | PASS | 390: 0 label overlaps (only two-line labels touching their own lines). |
| Editor | Browser BACK in the preview | Not lose work | PASS (preview only) | The URL goes to "/", and the editor and plot stay. The real-route BACK cannot be reached as a guest (the lab is locked). |
| Setup | Blank › Ready | Refuse while empty | PASS | Alert plus "1 thing must be corrected… There is nothing to send yet." |
| Setup | Feet/Meters, Estimated/Confirmed | Unit and confidence | PASS | Stage reads "24 × 16 m · CONFIRMED". |
| Setup | Guided steps after Ready | Truthful steps | **FAIL** | R2-SP1-01. |
| Setup | Undo after a page change | Undo across areas | PASS | Remove performer in Setup, UNDO from Stage: performer back on both. |
| Stage | TURN ↻15° ×2, FACE UPSTAGE, UNDO | Turn | PASS | "…turned toward stage right" (correct: clockwise from facing the audience); the dock reads "TURN: 30° · audience, toward stage right". |
| Stage | Full screen DISPLAY 1× 1.5× 2× 3× | Magnify | HELD (unchanged) | It is a display magnifier. The dock ZOOM still says "1.0× · the whole stage" at 3×. |
| Stage | Trays at 320 | Title never cut | PASS | "VIEW" and "OBJECT · stays open", with no "…" and no cut text. Dock keys 56 × 53, text ≥ 10 px, one row. |
| Stage | Key under the stage at 375 x 667 | Show the kinds; keep the stage | PARTLY | Capped at 91 px and scrolls. R2-SP1-05. |
| Registration | Home → OPEN LABS → PREVIEW ADVANCED LABS | Find both labs | PASS | "Game Audio · 1 Lab" (alphabetical, between Equalization and Instruments & Recording), tile `tr-64-game-audio-lab.webp`, 🔒 MEMBERS. "Live Sound Reinforcement · 3 Labs": Sound Systems, DJ Systems, Stage Plot (tile `tr-65-…webp`, 🔒 MEMBERS). The a11y says "Academy members only — opens the preview." (14, 15) |
| Registration | Tap Game Audio Lab, tap Stage Plot as a guest | House locked-preview sheet | PASS | The lab shows behind the house "ACADEMY MEMBERSHIP · Unlock the whole Academy" sheet. Its text is identical to the DJ Systems Lab sheet. (16, 17) |
| Registration | NOT NOW | Return | PASS | Returns to ADVANCED TRAINING LABS for both. |
| Registration | Credit code (`labCatalog.ts`, `trainingLabKeys.ts`, `StagePlotLabScreen.tsx`, `GuidedTask.tsx`) | `tr_stage_plot` once, only after five steps on one plot | **FAIL** | Once at the sink: yes. Only after the packet: no (R2-SP1-01). Examples pre-satisfy 3 steps (R2-SP1-04). Key `tr_stage_plot`, completion 'project', route StagePlotLab, `member: true`, MemberGated route: all present. |
| All | Console | | PASS for this lab | Only `navigator.vibrate` blocked (my synthetic presses) and two app-wide React DOM-prop warnings (`accessibilityElementsHidden`, `importantForAccessibility`), which are not from Stage Plot. |

---

## 4. Not tested, and why

- **First-visit intro card per area, and the intro card waiting while a tray is open:**
  - Every Stage Plot intro card is already marked seen in the shared browser storage (`ape:intro:screenIntroCards`).
  - Resetting it would edit storage, which the brief forbids.
- **The packet path, PDF table header and page breaks:** pressing DOWNLOAD / PRINT / SHARE is excluded, and the PDF is SP2's node test.
  - The credit after a REAL packet was read in code only (`ExportArea.finish` → `markExported`).
- **ZOOM and TURN fader drags, and finger drags of objects:** I used the nudge buttons and the typed fields instead.
- **A member's view of the registered labs, sign-in carry of a guest's credit, and the server rows:** I am a guest, and the server rows are Comp A's.
- **Real browser BACK out of the registered route:** the lab is locked for a guest, so it only opens in preview behind the sheet.
- **Reduce motion:** Stage Plot has no decorative motion (round 1 checked this; unchanged).
