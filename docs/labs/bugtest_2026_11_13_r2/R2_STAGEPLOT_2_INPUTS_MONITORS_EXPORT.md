# BUG TEST ROUND 2 — Stage Plot and Channel Designer, slice 2: INPUTS, MONITORS, EXPORT (+ the PDF in node)

Tester: R2-SP2 · 2026-11-13 · web preview `http://localhost:8142/#labpreview/StagePlotLab`, my own tab (tab-50), guest, fronted while timing anything. 390 × 844 unless said; 375 × 667 and 320 × 640 checked on Inputs, Monitors, Export. No source file, storage, git or server touched. DOWNLOAD PDF, SHARE, PRINT and the email buttons were never pressed. COPY TECHNICAL SUMMARY was pressed (text only; the copied text was read back through a page-side hook on `navigator.clipboard.writeText`). I did NOT set a fully-answered plot to Ready in the browser, so that no training credit was reported into the shared browser storage (see R2-SP2-01: proven in node and in the code instead).

Evidence folder: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\r2_sp2\`
- `pdf\` the 30 PDFs (`<template>_<letter|a4>_<full|compact|plot>.pdf`), `png\` every page as an image
- `breakcheck.py`, `breakcheck_out.txt`: every table piece on every page (rows under its header), the last line of each page, text sizes, text at the edges, overlaps, footer and DRAFT
- `lastlines.py`: how each page ends and how the next one begins
- `notes_sweep\` 480 PDFs with short realistic Notes / Access notes (`sweep.mjs`), `hcheck.py` finds a page that ends with a heading (R2-SP2-02)
- `stress\` round 1's stress packet re-rendered (long names, 44 inputs, 12 mixes) + `breakcheck_stress.txt`
- `consist.mjs`: plot badges vs input list vs monitor plan (5 templates: no mismatch)
- `plotprobe.mjs`: every plot label, its distance to its own symbol and to the nearest other one
- `probe1.mjs`, `probe2.mjs`, `credit.mjs`: model probes (reserved channels, pairs, restore, own-clash, devices, the guided-task credit)
- `zoom_salsa_nelson_chino.png`, `app_export_salsa_plot_nelson_over_chino.jpg`, `app_320_monitors_wireless_chip_cut.jpg`, `notes_sweep\salsa_letter_compact_g1_a1_p3.png` / `_p4.png`, `stress\stress_letter_compact_p7.png`

Counts (new bugs): **S1: 1 · S2: 5 · S3: 9** · Round-1 items: 14 fixed, 1 fixed differently, 3 still open (all S3).

---

## 1. Round 1 re-check

| R1 | Sev | Result | Evidence |
|---|---|---|---|
| 1 Reserved channel used, packet says "kept free" | S1 | **FIXED** | Four-piece › Reserved `2, 5-6, 40` → Inputs tab "! 3", three MUST BE CORRECTED cards ("House system: channel 2 is kept free on purpose, and Snare is on it…"), each with GO TO / RENUMBER THIS LIST / STOP KEEPING THIS CHANNEL FREE. STOP on ch 5 → field "2, 6, 40", 2 cards left. Typing 40 into Kick's channel → a new card. Keep-free OFF + RENUMBER → 1…16 and 2 cards; RENUMBER THIS LIST → 1, 3, 4, 5, 7, 8… and 0 cards. Export preview: "To correct before this document is ready" lists them; no "kept free" line while every reserved number is used. Band-rig patch: same (probe1 §4). See R2-SP2-06 / -07 / -08 for three small gaps. |
| 2 Playback "The venue provides: an input split" | S2 | **FIXED** | `pdf\playback_letter_full.pdf` p3: M1–M4 "Band monitor console. Requested from the venue: an input split"; "venue provides" appears nowhere. |
| 3 Salsa "3–5" beside Chino | S2 | **FIXED** (that badge) | "3–5" sits right of the timbales (`zoom_salsa_nelson_chino.png`). A different name now sits on Chino: R2-SP2-03. |
| 4 MAKE IT MONO duplicates a name | S2 | **FIXED, BROKEN DIFFERENTLY** | Four-piece + package "Mono keyboard" (input "Keys", source "Keys 2") → Keys L › MAKE IT MONO → "Keys L (it becomes Keys 2)"; inputs Keys 2 (ch 9) and Keys (ch 41): unique. But the new name is the other source's name: R2-SP2-05. |
| 5 Personal mixer called "band monitor rig" | S2 | **FIXED** | MONITORS: "Apart, and not added to that number: 1 audio channel in 1 mix on a personal mixer system". EXPORT summary: "Requested from the house console: 5 mixes, 8 audio channels. 1 mix is made on a personal mixer system, not on the house console." Copied text: "Made on a personal mixer system, and not mixed on the house console: 1 mix." |
| 6 GO TO opens the popup, not the field | S2 | **FIXED** | Snare (reserved) → editor, channel number field highlighted at the top; Drum riser → sheet scrolled to "Who brings it"; M5 Sidefill feed → "Requested output channels or sockets" at the top of MORE DETAILS (typing "Linked from one output" removed the question); Salsa Piano L → scrolled to "Who brings it". |
| 7 PUT THE OTHER SIDE BACK numbers 53 / 43 | S2 | **FIXED** | Stereo keyboard on 42/43 → remove L → PUT THE OTHER SIDE BACK → "42 Keys L, 43 Keys R". R side and "number taken meanwhile" also right (probe1 §5, §6). Small leftover: R2-SP2-11. |
| 8 Letter / A4 shows nothing | S2 | **FIXED** | "The PDF has 6 pages on US Letter" → A4 "5 pages"; Plot only "1 page"; Compact "4 pages". The line under PRINT, SHARE AND SAVE names the choice ("Full packet, A4"). |
| 9 "Own vocal prominent" with own vocal excluded | S2 | **FIXED** | probe1 §7: "Own instrument prominent" with Keys L/R "Not needed" → question; one excluded + one Primary → none. |
| 10 IEM key drawn as a pill | S2 | **FIXED** | `png\four-piece_letter_full_p1.png`: key IEM square like the plot. |
| 11 Salsa compact Letter, a sheet for two lines | S2 | **FIXED** for the example (3 pages) | Comes back as soon as any Notes are typed: R2-SP2-02. |
| 12 Row move on a Ready revision, no notice | S3 | **FIXED** | ▼ on Kick at "Revision 1 · Ready" → confirm "Move a row in a stage plot that may have been sent?…" (console: test browser answered "no"); the row did not move. |
| 13 Table header + 1 row at a page foot | S3 | **FIXED** (tables) | `breakcheck_out.txt`: 30 PDFs, every table that goes on overleaf starts with ≥ 3 rows (fewest: four-piece A4 full, devices, 3 + 2); no continued piece of 1 row; no page ends on a heading in the 30 example PDFs. Stress packets: same. But a SECTION heading can still end a page: R2-SP2-02. |
| 14 Backline Qty "–", Band "1" | S3 | **FIXED differently** | PDF row now "– · Yes". (The Inputs summary still says "1 × Backline"; acceptable.) |
| 15 One person, two position words | S3 | **STILL (partly)** | Instrument rows now say "Alex · at the acoustic instrument, center stage"; vocal rows still "Alex · Downstage center" beside Performers "Alex · Center stage" (`pdf\solo_letter_full.pdf`); Playback "Jo · Stage left" vs "Jo · Downstage left". |
| 16 Keep reserved free forgets OFF | S3 | **FIXED, but leaks** | OFF survives a visit to Monitors. It now also follows into every other stage plot: R2-SP2-07. |
| 17 Wording | S3 | **FIXED** | "2 WEDGES / The venue brings both."; "The venue brings all 9." |
| 18 Small things | S3 | **STILL** | "How many" 0 on the riser still silently becomes 1. DI device asked to carry 3 on 2 channels still a QUESTION, not MUST BE CORRECTED. A wedge on the wireless in-ear mix M3 still raises nothing (probe2 A). |
| R1 not tested: "No sound system connection" source | — | **PASS** | Percussion, Leo, "To be confirmed" → source sheet opens; input count stays 14; summary "1 source on the stage needs no sound system connection, and is not counted as an input." |
| R1 not tested: what the clipboard got | — | **PASS** | Copied text read back (9 lines, matches the Export summary). |

---

## 2. New bugs (most serious first)

### R2-SP2-01 · Guided task / credit · S1 — "Make the packet" and the tr_stage_plot credit latch with no packet made
Steps (from a clean open): Solo performer → SETUP: type a band name, clear the title, contact name + phone → every review question answered (only "to be confirmed" items remain) → Status: **Ready to advance**. (Or, instead of Ready: EXPORT › COPY TECHNICAL SUMMARY.)
Expected: step 5 "Make the packet" stays open until a packet (PDF, print, share) is made; no credit.
Happened: Ready (and copying the summary) freezes the revision (`spMarkReady` / `spAfterExport` set `frozenRevision = revision`), and the editor's flag is `exported: exportedRev === project.revision || project.frozenRevision >= project.revision`. So `exported` turns true with no packet, all five steps read done, and `StagePlotLabScreen.tsx:218-221` reports `tr_stage_plot`. Node, with the screen's own rule (`credit.mjs`): before Ready `export:false`; after Ready "performers:true sources:true monitors:true review:true **export:true**". The COPY path was confirmed in code: `ExportArea.tsx:316` `finish(b.snap, false)` → `spAfterExport` → `spFreeze`; the `packetMade=false` guard only skips `markExported`, not the frozen test.
Not run in the browser on purpose (it would write a credit into the shared browser storage).
Cause: `src\screens\lab\stageplot\spContext.tsx:253`.
Smallest fix: `exported: exportedRev === project.revision` only (keep a per-project "packet made for revision N" that survives reopening, set only by `markExported`), never `frozenRevision`.

### R2-SP2-02 · PDF (compact) · S2 — "Notes and unresolved questions" ends a page as soon as any Notes are typed
Steps: Salsa band → SETUP › General notes: one sentence; Access and setup notes: one sentence → EXPORT › Compact packet, US Letter. (Node: `notes_sweep\salsa_letter_compact_g1_a1.pdf`.)
Expected: a heading never ends a page.
Happened: page 3 ends with the section heading "Notes and unresolved questions" and **179 pt of empty page under it**; page 4 starts with "Notes". The packet grows from 3 to 4 pages for two sentences. Sweep of 480 realistic packets (5 templates × 2 papers × full/compact × notes of 1–8 sentences × access of 0–4): **84 compact packets** end a page on that heading (duo, four-piece A4, salsa); the full packets did not. Stress packet: `stress\stress_letter_compact_p7.png`, same.
Evidence: `notes_sweep\salsa_letter_compact_g1_a1_p3.png`, `_p4.png`; `notes_sweep\hcheck.py` output.
Cause: `src\features\stageplot\spPdf.ts:1127-1128` — in `keepAfter`, the `list` (and `facts`) branch returns the whole height of every block read so far (`h + 2 * BODY_LEAD`), uncapped, while the fall-through returns `min(h, 3 * BODY_LEAD)`. The section heading looks 4 blocks ahead, stops before the list and asks for 37.5 pt; the "Notes" sub-heading looks one block further, reaches the "Unresolved" list and asks for both notes, both sub-headings and the list start (≈ 104 pt with one sentence each), so it moves to the next page and leaves the section heading alone.
Smallest fix: cap the `list` / `facts` returns like the fall-through (`Math.min(h, 3 * BODY_LEAD) + …`), or let a heading's check include the next heading's own requirement.

### R2-SP2-03 · Export preview + PDF plot (Salsa) · S2 — "Nelson (M5)" is printed on Chino's head
Steps: Salsa band → EXPORT (preview, 390 wide), or `node sp_render.mjs salsa letter full …` page 1.
Expected: every performer's name is next to their own symbol (round 2 re-spacing goal).
Happened: the label "Nelson (M5)" sits directly above the circle that is Chino (congas, M6); Nelson's own circle (beside Wedge 7, M5) has no name near it. Everywhere else on this plot a performer's name is printed ABOVE the head (Luisito, Papo, Tito, Marisol, Beto, Ana, Carmen, Iván), so the eye reads the circle under "Nelson" as Nelson. Chino's own name is at lower left with a thin gray leader line, so that one circle now has two names. `plotprobe.mjs`: Nelson's label is 0.89 from Nelson and 0.94 from the next symbol; "M6" (Wedge 8) is nearer Nelson (0.73) than its wedge (0.84).
Evidence: `zoom_salsa_nelson_chino.png` (PDF), `app_export_salsa_plot_nelson_over_chino.jpg` (app preview).
Cause: the salsa layout in `spTemplates.ts` (re-spaced in 2a78624c) / the label placer in `spPacket.ts` (~lines 640-690).
Smallest fix: give Nelson's name a place above his own head (move Nelson or Wedge 7 slightly), or a leader line; add the "nearer another performer" test of R1 bug 3 for names, not only channel badges.

### R2-SP2-04 · Monitors · S2 — at 320 wide a device chip runs off the card and the screen
Steps: Four-piece → MONITORS at 320 × 640 → MONITOR DEVICES › In-ear transmitter.
Expected: the chip wraps inside its card (as the Inputs tags do).
Happened: "WIRELESS: AGREE RADIO FREQUENCIES WITH THE VENUE" is one line 305 px wide, right edge at 340 px on a 320-px screen; the card itself ends at 328. The area's scroll view becomes 348 px wide (`scrollWidth 348 > clientWidth 320`), so the page slides sideways and "VENUE" is cut. Fine at 375 and 390.
Evidence: `app_320_monitors_wireless_chip_cut.jpg`.
Cause: `src\screens\lab\stageplot\monitors\bits.tsx:128` — `fact` has no `flexShrink: 1, maxWidth: '100%'` (the Inputs `tag` style at `inputs\bits.tsx:106` has both, with the comment "A long tag WRAPS inside its card").
Fix: add `flexShrink: 1, maxWidth: '100%'` to `fact` and `flexShrink: 1` to `factText`.

### R2-SP2-05 · Review (Export, Stage) · S2 — "Keys 2 is in the input list but not on the stage" is false
Steps: Four-piece → INPUTS › ADD A SOURCE › package "Mono keyboard" (its source is called "Keys 2", its row "Keys") → Keys L › MAKE IT MONO (row becomes "Keys 2") → EXPORT › REVIEW.
Expected: the question names the row that is not on the stage.
Happened: "Keys 2 is in the input list but not on the stage." The row called Keys 2 (channel 9/11, Nina's keyboard) IS on the stage; the one that is not is the row "Keys" of the source "Keys 2". Same with any package: "Keys 3 is in the input list but not on the stage." although no row is called Keys 3 (its rows are Keys L and Keys R). The sentence names a SOURCE but says "input list"; R1 bug 4's fix chooses a row name that avoids other rows, not sources, so the two now collide.
Cause: `src\features\stageplot\spReview.ts:190` (rule `source-unplaced`); `spMonoLabel` in `spModel.ts:457`.
Fix: word it from the source with its rows: "The source Keys 3 (Keys L, Keys R) is not on the stage."; let `spMonoLabel` also avoid source names.

### R2-SP2-06 · Monitors · S2 — a personal-mixer mix is given a "headphone amplifier", never a personal mixer
Steps: Four-piece → MONITORS › ADD A MIX: Sam, Wired in-ear, Personal mixer system.
Expected: the proposed device is the performer's personal mixer (the type exists: `personal-mixer`, "Personal mixer"), which drives the earphones.
Happened: "DEVICES TO ADD WITH THIS MIX: ✓ Headphone amplifier for Sam". After adding: "2 wired headphone amplifiers" in the counts, the packet's equipment table and the copied summary; no personal mixer is listed anywhere, and no question asks for one. A learner is taught that a personal-mixer mix needs a separate headphone amplifier.
Cause: `src\screens\lab\stageplot\monitors\monitorPlan.ts:451-452` (`wired-iem` → `personal('hp-amp')` whatever the provider).
Fix: when `provider === 'personal-mixer'`, propose one `personal-mixer` device per performer instead.

### R2-SP2-07 · Inputs · S3 — "Keep reserved channels free: OFF" follows you into every other stage plot
Steps: Four-piece → INPUTS → Keep reserved channels free OFF → ‹ ALL PLOTS → open (or start) Salsa → INPUTS.
Happened: Salsa, never touched, reads "Keep reserved channels free: off". Cause: `inputs\OrderPanel.tsx:24` keys the choice by patch id ('house' / 'band') only. Fix: key it by project id + patch id.

### R2-SP2-08 · Inputs · S3 — RENUMBER splits a stereo pair across a reserved channel, silently
Reserved 6, keep free ON, RENUMBER → Overhead L 5, Overhead R 7 (probe1 §1). No note. A pair is usually wanted on neighboring channels; at least say so, or move the pair to the next free two.

### R2-SP2-09 · Inputs editor · S3 — typing a reserved number in a row's channel field says nothing there
Kick › Channel number 40 (reserved) → the sheet shows nothing; only the tab badge changes behind the sheet. A duplicate gets an inline line ("Channel 3 is also given to…", `InputEditor.tsx:217`). Add the same for a reserved number.

### R2-SP2-10 · Export / PDF · S3 — the outputs sentence follows the personal-mixer sentence
"Requested from the house console: 5 mixes, 8 audio channels. Made on a personal mixer system, and not mixed on the house console: 1 mix (1 audio channel). If each audio channel is carried on its own analog console output, that is 8 outputs." The "8 outputs" sentence reads as part of the personal-mixer line. Put it right after the house-console sentence.

### R2-SP2-11 · Review / PDF · S3 — after PUT THE OTHER SIDE BACK the review lists R before L
"Keys R: who supplies the DI…" then "Keys L: …" (the restored side is added at the end of the inputs). Order the review by the patch.

### R2-SP2-12 · Export (Blank) · S3 — "The key under it stays in view." with no key
Blank stage → EXPORT preview: the sentence is printed although an empty plot has no key.

### R2-SP2-13 · Inputs (empty) · S3 — reserved channels cannot be set before the first input
The ORDER OF THE INPUT LIST panel (with "Reserved channels") is hidden until a row exists (`OrderPanel.tsx:36`). A band that knows "keep 1–2 free" must add an input first.

### R2-SP2-14 · All areas at 320 wide · S3 — the status bar takes 40 % of the screen
At 320 × 640, "Revision 1 · Ready / Not saved: kept only until you close the app" wraps into six lines between ALL PLOTS and UNDO ("Revision 1 / · Ready" split); content starts at about y = 255 of 640 on Inputs, Monitors and Export. (Shared header; may also be in SP1's report.)

### R2-SP2-15 · Monitors · S3 — "Linked from one output" on a STEREO sidefill mix raises nothing
A stereo mix is 2 audio channels; one linked output cannot carry it. The typed answer silently settles the question. (Free text, so at most a hint.)

---

## 3. Controls tested that round 1 did not (or tested differently)

| Screen | Control | Purpose | Result | What I saw |
|---|---|---|---|---|
| Inputs | Review card STOP KEEPING THIS CHANNEL FREE | Unreserve one number | PASS | 5 removed from "2, 5–6, 40"; field and hint follow |
| Inputs | Review card RENUMBER THIS LIST | Renumber keeping reserved free | PASS | 1, 3, 4, 5, 7, 8 … 18; questions gone |
| Inputs | Channel number typed onto a reserved number | — | PASS / S3 | Question raised; no inline line (R2-SP2-09) |
| Inputs | ADD A SOURCE › No sound system connection | Acoustic / self-contained source | PASS | No input added; summary line; source sheet opens to name it |
| Inputs | Source editor (name, kind, who, connection) | Edit a source | PASS | Fields shown; name prefilled "New source" |
| Inputs | RENUMBER with keep-free OFF | Ignore reservations | PASS | 1…16 and two MUST BE CORRECTED |
| Inputs | Keep-free switch across plots | Per-plot choice | FAIL S3 | R2-SP2-07 |
| Monitors | ADD A MIX sidefill stereo house | 1 mix, 2 devices | PASS | 5 mixes (2 mono, 3 stereo), 8 channels, 7 devices; feed question raised |
| Monitors | Click required / No click chips | Contradiction | PASS | Mutually exclusive; "Click required" + click Must exclude → question on card and in review |
| Monitors | ADD A MIX personal mixer | Counted apart | PASS (counts) / FAIL S2 (device) | R2-SP2-06 |
| Monitors | Zero counts (Blank) | Empty state | PASS | "0 mixes … No monitor devices yet", click section points to INPUTS |
| Export | Packet × Paper × page count | Choices seen | PASS | Full 6 / Plot 1 / Compact 4 pages (Letter); A4 full 5 |
| Export | COPY TECHNICAL SUMMARY (text read back) | Copy | PASS | Text = summary; "The technical summary was copied." |
| Export | Subject / Message growth (tab fronted) | Grows, never loops | PASS | Message 486 → 530 px within 100 ms of typing, stable 2 s; subject 66 → 156 px, Return removed (in a background tab the growth waits ~1 s for throttled timers: not a bug) |
| Export | Ready → no DRAFT; review list | Stamp | PASS | "It is not stamped DRAFT."; preview has no DRAFT |
| Export | GO TO on a Stage question ("Keys 2 … not on the stage") | Jump | PASS | Opens STAGE (nothing to select: not placed) |
| Export | 320 / 375 widths | Fit | PASS | No cut text, no sideways page; plot scrolls inside its own box (520 px) |
| PDF | 30 PDFs page counts | Handoff numbers | PASS | Four-piece Letter 5 full / 4 compact; Playback A4 full 5; Salsa Letter compact 3 |
| PDF | Table keeps header + ≥ 3 rows or moves whole | Rule | PASS | 0 violations (30 + 4 stress) |
| PDF | A heading never ends a page | Rule | PASS on the 30 examples / **FAIL** with notes | R2-SP2-02 |
| PDF | Table text ≥ 10 pt; footer; "Page N of M"; DRAFT | — | PASS | 79 pages: tables 10 pt, running head / plot 9–9.5 pt; every page numbered and stamped |
| PDF | Plot ↔ input list ↔ monitor plan | Consistency | PASS | `consist.mjs`: every channel on the plot, every performer's and wedge's mix code = the plan |
| PDF | Text off the page / overlapping | — | PASS | Only the wrapped title line's boxes touch (A4, as in round 1) |
| Console | Errors | — | PASS | No errors; only the known deprecation warnings and two suppressed native confirms |

---

## 4. Not tested, and why
- DOWNLOAD PDF, SHARE, PRINT, the print view, the email buttons: not allowed (the PDF was tested in node with the lab's own code).
- Setting a fully answered plot to Ready (or copying its summary) in the browser: it would report `tr_stage_plot` into the shared guest storage; R2-SP2-01 is proven in node and in the code.
- The Labs-menu registration and the guest locked-preview sheet (Home › OPEN LABS): outside this slice; the credit code was read (above).
- The per-area first-visit intro cards: none appeared in my tab (the shared browser storage already has them seen); not judged.
- Browser BACK: my tab opened on the lab URL (no history). Phone, screen reader, Larger Text: not available.
- CHOOSE ITS MIX on a device and the DI device sheet were only touched through GO TO, not walked control by control in this round.
