# BUG TEST — Stage Plot and Channel Designer, slice 2: INPUTS, MONITORS, EXPORT (+ the PDF in node)

Tester: SP2 · 2026-11-13 · web preview `http://localhost:8142/#labpreview/StagePlotLab`, my own tab, 390 × 844 (some checks at 320 × 740), guest. No source file, storage, git or server touched. DOWNLOAD PDF, SHARE, PRINT and the "copy, then download" email button were never pressed. COPY TECHNICAL SUMMARY was pressed (text only).

Evidence folder: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\bugtest_sp2\`
- 30 PDFs: `<template>_<letter|a4>_<full|compact|plot>.pdf`; every page as PNG in `png\`
- `pdfcheck.py` / `pdfcheck_out.txt`: font size of every span, text near the page edge, overlapping text, the last lines of each page
- `docdump.mjs` + `doccheck.py` / `doccheck_out.txt`: every string of the lab's own document model (cells, notes, labels, badges, key, legend) looked up in the PDF text
- `stress.mjs`, `stress\`: a four-piece with 44 inputs, 12 mixes, a 59-character band name, an unbroken 90-character equipment name, very long notes (Letter/A4, full/compact)
- `zoom_*.png`: enlarged details used below

Counts: **S1: 1 · S2: 10 · S3: 7**

---

## 1. Controls: what each is for, what I saw

### INPUTS (Four-piece, then 50 inputs; Blank; Salsa)

| Control | Purpose | Result | What I saw |
|---|---|---|---|
| ADD A SOURCE › A ready-made package (17 packages) | Add the usual rows for one source, shown first | PASS | Each of the 17 shows its assumption and every row before adding. Every ADD n INPUTS added exactly n rows (17/17). New rows join at the end with the next free number (reserved 40 skipped) |
| Package row ticks | Leave a row out | PASS | Untick "Kick out" → ADD 7; untick one side of a pair → both sides untick |
| Package "Who plays or sings it" | Link the new source to a performer | PASS | Preview labels update (Snare (Maya)…); source name shown |
| Name collisions in a package | Keep names unique | PASS | Snare 2, Overhead 2 L, Floor tom (Maya) |
| ADD A SOURCE › One input | Add one row to an existing or new source | PASS | New source, Horns, Nina, wireless → 1 row, editor opens on it |
| ADD A SOURCE › No sound system connection | A source with no input | NOT TESTED | Out of time |
| Row ▲ / ▼ | Move one row (a pair as one block) | PASS | ▲ on the first and ▼ on the last row disabled; the overhead pair moves as one; slot numbers stay (a typed gap survives) |
| Editor: Name | Rename | PASS | 108-character name wraps on the row, no clip; an empty name is refused |
| Editor: Channel number | Propose a number | PASS | 20 → gap; duplicate 3 → "Channel 3 is also given to Rack tom" + Inputs tab "One thing must be corrected" |
| Editor: How it is captured | Mic / DI / line / wireless / custom | PASS | Field label switches Microphone ↔ Equipment; DI shows the device chooser; back to Mic drops the device cleanly, back to DI does not re-attach it |
| Editor: Stand / Who brings it / Who hears it | | PASS | Summary follows (Clamp counted, "1 × Dynamic instrument microphone" moves to THE BAND BRINGS, 49 → 48 for audience + "1 to be confirmed") |
| Editor: DI device (More details) | Put the DI channel on a device | PASS | Mono device asked to carry 2 → warning on the device, in DI DEVICES and an Inputs question; supplier line "Band, with its DI device" + OPEN THE DI DEVICE |
| Editor: Phantom | Record what the band knows | PASS | "phantom power required" printed in the preview row |
| Editor: Where it goes | House / band rig / both / custom | PASS | "Both" adds the "Input list for: Band monitor rig (1)" chooser and a second number field |
| Editor: Click, cue or talkback | Make it monitor only | PASS | Turns monitor only; set back to Audience → question + "The audience is meant to hear it" switch answers it |
| Editor: MAKE IT MONO | Stereo → one input | **FAIL** | Bug 4 (duplicate name) |
| Editor: REMOVE THIS INPUT / REMOVE BOTH SIDES | Remove | PASS | The question names the partner; the review then offers PUT THE OTHER SIDE BACK / MAKE IT A MONO REQUEST |
| Review: PUT THE OTHER SIDE BACK | Restore a pair | **FAIL** | Bug 7 (numbers 53 / 43) |
| SORT IN THE USUAL ORDER | Group order | PASS | Groups right, the click sits with playback; present order kept inside a group (Snare stays before Kick if the user moved them — as the code says) |
| RENUMBER | 1, 2, 3 in order | PASS | Keep free ON → 1, 3, 4, 10…20; OFF → 1…14 |
| Keep reserved channels free | Skip reserved numbers | PASS / S3 | Works; comes back ON after visiting another area (Bug 16) |
| Reserved channels field | Numbers kept free | **FAIL** | Parses "2, 5-6, 40, abc, 0, 9-7" → "2, 5–9, 40" + "Not read: abc, 0" correctly, but see Bug 1 |
| DI DEVICES: ADD MONO / STEREO, device sheet | Devices apart from channels; shared / unshared | PASS | Stereo device: tick Keys 2 L and R, then a third → "has 2 channels and is asked to carry 3"; untick clears; supplier flows to its channels; "Take it off" on make-mono removes an unused device |
| EQUIPMENT AND WHO BRINGS IT | Counted summary | PASS | Re-counted by hand at 50 inputs: 36 mics, 9 DI channels, groups Drums 23 / Percussion 3 / Bass 4 / Guitars 3 / Keys 7 / Horns 1 / Playback 4 / Vocals 5, stands by type and supplier — all right |
| DETAILS STILL TO BE CONFIRMED / review questions | Open questions, tap to open | PASS | Each line opens its row; GO TO opens the right popup (but Bug 6) |
| ADD: STAGE BOX / SPLIT / … | Extras | PASS / S3 | Split sheet fine; "How many" 0 silently becomes 1 |
| Empty state (Blank) | | PASS | "No inputs yet…", every summary heading "Nothing listed" |

### MONITORS (Four-piece grown to 10 mixes; Blank; Salsa)

| Control | Purpose | Result | What I saw |
|---|---|---|---|
| ADD A MIX: wedge (Sam + Leo, house) | | PASS | 1 mix, 1 device; house 5 mixes / 7 channels |
| ADD A MIX: wireless in-ear (Nina, band console) | | PASS | Transmitter + pack proposed; counted apart ("2 audio channels in 1 mix that your band creates…"); "What the venue provides" chooser shown |
| ADD A MIX: drum fill / sidefill / wired in-ear on a personal mixer / custom (TBC) | | PASS | Sidefill proposes 2 devices on 1 mix; custom proposes none; each group counted apart; devices by type right (12 → 14 after two ADD A DEVICE) |
| Who hears this mix chips | Link performers | PASS | Taking Tito off M2 → "Tito has no monitor. Is that intended?" |
| ADD A DEVICE / The mix it is on | Device apart from mix | PASS | A wedge on M3 → mixes and channels unchanged; a personal mixer with no mix → question |
| EDIT MIX: delivery change, ADD THE DEVICES MARKED | | PASS | Custom → Wedge proposes "Wedge 5"; a double tap adds one |
| REMOVE THIS MIX | | PASS | Its wedges become "not on any mix", its performers "no monitor" questions |
| The three counts | mixes · channels asked of the house console · devices by type | PASS | Recomputed by hand after each add; Blank reads 0 / "No mixes yet" / "No monitor devices yet" |
| Requested from the house console vs band monitor rig | | PASS on screen / **FAIL in packet** | Bug 5 |
| WHAT EACH MIX NEEDS TO HEAR (Primary / Supporting / Not needed / Must exclude) | Four words per input | PASS | Pressing a word twice clears it; the line "Primary: 1 · Must exclude: 3 · No preference yet: 46" follows |
| "No click" vs click Primary | Contradiction check | PASS | Flagged on the card and in review |
| "Own vocal prominent" vs own vocal Must exclude | Contradiction check | **FAIL** | Bug 9 |
| UNDO / REDO after ADD A MIX | | PASS | 1 → 0 → 1 mix, devices follow |
| Supplier wording | | S3 | Bug 17 |

### EXPORT

| Control | Purpose | Result | What I saw |
|---|---|---|---|
| Packet: Full / Stage plot only / Compact | Which packet | PASS | Plot only drops every section after the plot; compact drops Performers and Notes |
| Paper: US Letter / A4 | Paper size | **FAIL (nothing visible)** | Bug 8 |
| Preview at window width, key under the drawing | | PASS | Plot keeps 520 px and scrolls sideways (said on screen); the key re-flows to 334 px (264 px at 320 wide); every SVG text ≥ 9 px; no page-wide horizontal scroll |
| Formatted / Text only | | PASS | Text only gives the whole packet, the drawing in words |
| Review list + GO TO | Jump to the field | **FAIL** | Bug 6: right popup, field not in view |
| COPY TECHNICAL SUMMARY | Copy text | PASS (copy) / FAIL (text) | Clipboard API refused in the test browser; the app fell back to `execCommand('copy')` and said "copied". The text carries Bug 5 |
| Email Subject | grows, never loops | PASS | 244 characters incl. a 90-character unbroken address → 64 → 154 px, scrollHeight = height; Return becomes a space |
| Email Message | grows, never loops | PASS | 719 characters + 3 blank lines → 506 px, nothing hidden, no console error; text kept after visiting Monitors |
| DRAFT / READY stamp | | PASS | Draft → DRAFT in the preview and the Export note; Ready → no stamp and the note says why; Ready refused while a duplicate channel exists ("1 thing must be corrected…"); first edit after Ready → "Revision 2 · Draft" |
| Text size / clipping on Inputs, Monitors, Export (390 px) | | PASS | No text under 12 px, no clipped element |

### The PDF (node, offline)

| Check | Result | What I saw |
|---|---|---|
| Page counts vs the handoff table | PASS | All 15 combinations match |
| Every string of the document model printed | PASS | 30 PDFs, 0 strings missing (`doccheck_out.txt`) — so the PDF prints exactly what the Export preview holds; the Inputs and Monitors screens match it for Salsa and Four-piece (rows, numbers, totals) |
| Table text 10 pt or more | PASS | All table text 10 pt; plot labels, running head and footer 9 pt |
| Text leaving the page | PASS | None, also in the stress packets (long words break at hyphens inside their column) |
| Text overlapping text | PASS | Only the boxes of a wrapped title line touch; no visible overlap |
| Footer, "Page N of M", DRAFT on every page | PASS | Every page |
| Numbers / names / counts: plot ↔ input list ↔ monitor plan | **FAIL** | Bugs 2, 3, 10 |
| Header at a page foot | S3 | Bug 13 (held item + one new place) |
| Empty last page | **FAIL** | Bug 11 |

---

## 2. Bugs (most serious first)

### 1 · Inputs / Export / PDF · S1 — the packet says channels are "kept free on purpose" while inputs sit on them
Steps: Four-piece → INPUTS → Reserved channels: type `2, 5-6, 40`, Tab. (Or: type the reservation, turn "Keep reserved channels free" OFF, press RENUMBER.)
Expected: a question or warning that inputs use reserved channels; the packet never calls a used channel free.
Happened: no warning anywhere (no Inputs question, tab unmarked). The Export preview and the PDF print **"House system: channels kept free on purpose: 2, 5, 6, 7, 8, 9, 40."** while ch 2 = Kick, 5 = Overhead R, 6 = Floor tom, 7 = Bass DI, 8 = Guitar cabinet, 9 = Keys L. A row's own channel number can also be typed onto a reserved number with no message.
Evidence: Export preview text in the session; `stress\stress_letter_full.pdf` page 2 (reserved 2, 5, 6, 7, 40 printed; Overhead L on 5).
Cause: `src\features\stageplot\spReview.ts` has no rule for a number in `patch.reserved`; `spPacket.ts:1223` prints the list as typed.
Fix: a review rule ("Channel 5 is reserved and given to Overhead R"), and print only reserved numbers no input uses.

### 2 · PDF / Export · S2 — Band with playback: "The venue provides: an input split" beside "Input split: who supplies it"
Steps: render `playback` (any paper, full or compact), or Band with playback › EXPORT.
Happened: Monitor plan M1–M4: **"Band monitor console. The venue provides: an input split"**; the same packet's Equipment table: "Input split for the band monitor rig … To be confirmed"; Unresolved: "Input split for the band monitor rig: who supplies it." The packet both states and asks, and states as fact what the template says is only *asked* of the venue ("The venue is asked for an input split").
Evidence: `png\playback_letter_full_p3.png`, `_p4.png`, `_p5.png`.
Cause: `spTemplates.ts:268` (split extra `tbc`) vs `:271` (`venueFeed = 'split'`); wording `spPacket.ts:966` and `:984` ("The venue provides:").
Fix: word it as a request ("Asked of the venue: an input split"), or derive it from the split extra's supplier.

### 3 · PDF / Export plot · S2 — Salsa plot: the timbales channels "3–5" are printed beside Chino, not Papo
Steps: render `salsa` (any), page 1.
Happened: the badge **3–5** (Timbales high / low / bell — Papo, per the input list) sits right next to Chino's head (Chino plays congas 1–2). Papo's timbales, further right, carry no number. An engineer reading the plot puts the timbales mics on the conga player.
Evidence: `zoom_salsa_plot.png`, `png\salsa_letter_full_p1.png` (same in the Export preview, same document).
Fix: place a badge against its own symbol, or draw its leader line, never nearer another performer.

### 4 · Inputs · S2 — MAKE IT MONO gives an input the name another input already has
Steps: Four-piece → ADD A SOURCE › package "Mono keyboard" (adds "Keys") → open Keys L → MAKE IT MONO → keep Keys L, "Take it off this input" → MAKE IT MONO.
Happened: two inputs are both **"Keys"** (ch 9 and ch 41); the editor even offers "Keys L (it becomes Keys)". No question is raised. A DI device sheet then lists "Keys" twice with no way to tell them apart; the review prints "Keys: which DI device." and "Keys: who supplies the DI; …" as two lines about different inputs.
Cause: `spModel.ts:491` `keep.label = stripSide(keep.label)` with no uniqueness (packages and single inputs use `spUniqueLabel`).
Fix: pass the new label through the same unique-name helper (and the preview line in the editor).

### 5 · Export / packet / technical summary · S2 — a personal-mixer mix is reported as made "in the band monitor rig"
Steps: Four-piece → MONITORS → ADD A MIX: Sam, wired in-ear, Personal mixer system; ADD A MIX: Nina, wireless in-ear, Band monitor console → EXPORT.
Happened: MONITORS says "Your band creates 1 mix in the band monitor rig" and, apart, "1 mix is made on a personal mixer system… not one house console output for each performer". EXPORT's summary, the preview, the PDF text and the copied technical summary all say **"Created in the band monitor rig, and not requested from the house console: 2 mixes (4 audio channels inside that rig)."** A venue may own the personal mixer system.
Cause: `spDerive.ts:226-231` adds `personal-mixer` into `bandOwned`; `spDerive.ts:419` and the packet word it as the band monitor rig.
Fix: print the personal mixer system on its own line, as MONITORS does.

### 6 · Export review › GO TO · S2 — the jump opens the right popup but not the field
Steps: any example with open items → EXPORT → GO TO on "Kick in: who supplies the microphone…", "Wedge 3: who supplies it.", "M8 Sidefill: how its 2 sidefills are fed…", "Keys: which DI device.".
Expected: the field that answers the question is on screen.
Happened: every popup opens at its top (scrollTop 0 in a 648-px sheet whose bottom is at y ≈ 744). The answer sits below: Kick in "Who brings it" at y = 866; Wedge 3 at y = 1193; M8 "Requested output channels or sockets" at y = 1464 (MORE DETAILS was opened, the field not scrolled to); "Keys: which DI device" lives inside a closed MORE DETAILS. Only Setup scrolls to its field (`SetupArea.tsx:132-137`).
Fix: pass the field with the target and scroll the sheet to it, opening MORE DETAILS when needed.

### 7 · Inputs · S2 — PUT THE OTHER SIDE BACK numbers the pair 53 / 43
Steps: a stereo pair on 42/43 (package "Stereo keyboard": Keys 2 L/R) → open Keys 2 L → REMOVE THIS INPUT → YES → in the review press PUT THE OTHER SIDE BACK.
Happened: Keys 2 L returns as **channel 53**, listed above Keys 2 R on **43**; channel 42 stays empty; nothing says so. The packet prints L = 53, R = 43.
Cause: `spModel.ts:466-477` pushes a new input; `syncPatches` gives it the next free number at the end.
Fix: give the restored side the number next to its partner (or the one it had) when free.

### 8 · Export · S2 — choosing US Letter or A4 changes nothing the learner can see
Steps: EXPORT → Paper: US Letter ↔ A4.
Happened: the preview is identical (one sentence changes: "(Full packet, A4)"); the preview never shows page breaks or a page count. The choice does change the PDF (Salsa compact: 4 pages Letter / 3 A4; Playback full: 5 / 4; the Four-piece title wraps on A4), but nothing on screen shows it. The handoff calls it "a preview of the pages the PDF has".
Fix: show the page count for the chosen paper and packet ("4 pages on US Letter"), or page breaks in the preview.

### 9 · Monitors · S2 — "Own vocal prominent" with the singer's own vocal on Must exclude: no question
Steps: Four-piece → MONITORS → needs, mix M1 Lead vocal → Lead vocal (12): Must exclude.
Happened: no warning. The packet prints for M1 "Asked to hear: Own vocal prominent; Some guitar · Must exclude: … Lead vocal (12)". The parallel case ("No click" + the click Primary) is caught (`spReview.ts:207`, `monitorPlan.ts:712`).
Fix: the same check for "Own vocal / Own instrument prominent" against Must exclude / Not needed on the recipients' own inputs.

### 10 · PDF / plot key · S2 — the key draws "IEM" as a rounded box, the plot as a square box
Steps: render `four-piece`, page 1.
Happened: the key's "In-ear monitor equipment" is a pill-shaped box — the shape the legend reserves for mix codes ("A code in a rounded box, such as M1, is a monitor mix"). The two IEM symbols on the plot are square-cornered.
Evidence: `zoom_key_iem.png`, `zoom_plot_iem.png`.
Cause: `spSymbols.ts:122` `box(0.5, 0.3, { r: 0.14 })` — the corner radius is drawn relative to the symbol, so the larger key cell rounds it into a pill.
Fix: draw the key symbol with the plot's absolute radius, or r: 0.

### 11 · PDF · S2 — Salsa compact on Letter: page 4 of 4 holds two lines
Steps: `node sp_render.mjs salsa letter compact out.pdf`.
Happened: page 4 holds only "This packet records what the band is requesting…" and "Made November 12, 2026, 12:00 PM." (plus header and footer). A whole sheet for the closing note, in the *compact* packet.
Evidence: `png\salsa_letter_compact_p3.png`, `png\salsa_letter_compact_p4.png`.
Fix: keep the closing note with the last section (or let it use the remaining space on page 3).

### 12 · Inputs · S3 — a ▲ / ▼ move on a "Ready" revision has no notice
Steps: Setup › Ready to advance → INPUTS → ▼ on any row.
Happened: two channel numbers change and the bar silently becomes "Revision 2 · Draft". RENUMBER and SORT ask first ("Renumber a stage plot that may have been sent?"); a row move does not.

### 13 · PDF · S3 — a table's header with one row at a page foot (held item, one new place)
Salsa Letter full p1: Performers heading + header + Marisol (held in the handoff). New: Salsa **A4 compact p2**: "Monitor plan" heading, its summary, the table header and only M1 at the foot (`png\salsa_a4_compact_p2.png`). Four-piece compact (Letter p2, A4 p2): header + 1–2 mix rows at the foot.

### 14 · PDF · S3 — Backline row: Qty "–" and Band "1"
Every template's Equipment table: "Backline: drum kit, bass amplifier, guitar amplifier, keyboard — Qty – · Band 1". The two columns disagree (`png\four-piece_letter_full_p4.png`).

### 15 · PDF · S3 — one person, two position words
Playback: Performers "Jo · Stage left", input list "Jo · Downstage left"; Solo: "Alex · Center stage" vs "Alex · Downstage center". Each describes a different symbol, but reads as a contradiction.

### 16 · Inputs · S3 — "Keep reserved channels free" forgets OFF
Set it OFF, open EXPORT, come back: it reads ON again (`OrderPanel.tsx:25`, local state).

### 17 · Monitors · S3 — wording
"The venue brings all 2." / "Who brings them: to be confirmed for all 2." / "Who brings them: the venue 2 and 1 to be confirmed." Mix auto-name "M5 Guitar and lead vocal and Bass and vocal".

### 18 · Inputs / Monitors · S3 — small things
"How many" 0 on an extra silently becomes 1. A DI device asked to carry 3 on 2 channels is a QUESTION, not MUST BE CORRECTED. The reserved-field warning "Not read as a channel number: abc, 0" stays while the field no longer shows those words. A performer may sit on three mixes with no note (Sam on M1, M5, M9 → "Monitor mix: M1, M5, M9") — fine if intended. A wedge put on a stereo wireless in-ear mix raises nothing.

---

## 3. Not tested, and why
- DOWNLOAD PDF, SHARE, PRINT, the print view and "Copy the message, then download the PDF": not allowed. The PDF was tested in node with the lab's own code instead.
- Whether the clipboard really received the summary: the test browser refused `navigator.clipboard.writeText`; the app fell back to `execCommand('copy')` and reported success. I could not read the clipboard back.
- Browser BACK: my tab had no history (it opened on the lab URL). Android BACK: not available.
- The "No sound system connection needed" source, CHOOSE ITS MIX, the Source editor: not exercised.
- Phone, screen reader, Larger Text: not available. This slice has no motion.
- Two native web dialogs were suppressed by the test browser (console): the guest "You’re not signed in" confirm (it returned false) and "Not ready to advance yet". Neither was in a flow I judged.
