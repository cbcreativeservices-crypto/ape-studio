# Check of fix round 2: Stage Plot and Channel Designer (2026-11-13)

Checker: independent R2 checker. Repo `C:\Users\profe\dev\ape-workbench`, branch `ota-after-approval-39-23`, uncommitted tree.

What I did and did not do:
- No git writes, no eas, no server started or stopped, no package.json change.
- The only source edits were the temporary mutations below. Each was restored from the saved bytes and checked by SHA-256. At the end, `git diff -- src/features/stageplot src/screens/lab/stageplot` was byte-identical to the diff saved before the first mutation (`cmp` equal).
- Browser: my own tab (tab-56), now closed. DOWNLOAD PDF, SHARE, PRINT and sign-in were never pressed. No storage was written (only START, which keeps a guest plot in memory). Sound was off. Console: no errors.

Evidence folder: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\chk_r2\`
- `credit_fake.mjs`: the credit and packet fakes (output in section 2)
- `ready_pdf.mjs`: Ready, then a PDF, through the UNDO history
- `long_sweep.mjs` and `long\`: 120 packets with long notes, many paragraphs and long open questions
- `pdf\`: the 30 example PDFs
- `pages.py`, `h2check.py`, `realviol.py`, `breakcheck_pdf.txt`, `breakcheck_long.txt`: page and break checks
- `names_probe.mjs`, `crowd2.mjs`: the performer-name rules on the printed plot
- `capstats.mjs`, `capmut.py`: the effect of the list and facts caps
- `mutate.py`, `mutate_out.txt`: the mutation run
- `png\`: the page images I read

---

## 1. Ranked problems

Nothing found breaks the owner's rule ("Blank stage only") or the packet rule through any path a learner can reach in the app. What I found:
- one hole that needs a corrupted saved row,
- test gaps where a fix can be undone with every test still passing,
- two owner questions,
- one small PDF point.

### P1 · S3 · `spMigrate` trusts an impossible packet record or revision, so a corrupted saved row earns the credit with no packet
- **Steps:** `node credit_fake.mjs` in the evidence folder. A saved row with `startedBlank: true` and every step answered goes through `spMigrate`, as the store does on every read:

| Saved row | exported | CREDIT |
|---|---|---|
| `packetRevision: 999` (revision 1) | true | **true** |
| `packetRevision: 1`, `frozenRevision: 0` | true | **true** |
| `packetRevision: 1.5` | true | **true** |
| `revision: 0` | true | **true** |
| `revision: null` | true | **true** (`0 >= null` is true in JS) |
| `revision: -3` | true | **true** |
| `packetRevision` as `"5"`, `-1` or NaN; `startedBlank` as `"true"` or `1`; either field missing | false | false (correct) |

- **Where:** `src\features\stageplot\spModel.ts:1087` (the new check), in `spMigrate`.
  - The check only refuses a non-number or a negative number. It does not bound `packetRevision` by `frozenRevision` or `revision`.
  - `revision` itself is never checked: a pre-existing gap, which now feeds the credit through `spContext.tsx:255`.
- **Reach:** only a hand-edited or damaged device row. No app path writes one. Low.
- **Smallest fix:** after line 1087 in `spMigrate`:
  ```ts
  if (!Number.isInteger(q.revision) || q.revision < 1) q.revision = 1;
  if (!Number.isInteger(q.frozenRevision) || q.frozenRevision < 0) q.frozenRevision = 0;
  q.frozenRevision = Math.min(q.frozenRevision, q.revision);
  q.packetRevision = Number.isInteger(q.packetRevision) ? Math.min(Math.max(0, q.packetRevision), q.frozenRevision) : 0;
  ```
  Then add these rows to the test "an older saved plot (no packetRevision) reads cleanly".

### P2 · Test gap on the main real path: Ready, then DOWNLOAD PDF (mutation M13)
- **The change:** delete `&& next.packetRevision === h.present.packetRevision` from `spHistoryApply` (`src\features\stageplot\spHistory.ts:83`). All 615 tests still pass.
- **What the user would see:** after Ready the revision is already frozen, so a PDF changes only `packetRevision`. Under this mutation the history drops that change, and the packet is never recorded in the project.
  - The in-memory `exportedRev` hides this until the app is closed.
  - After a restart, step 5 reads To do again.
- Ready then PDF is the most common order a band uses.
- **Code today is correct:** `ready_pdf.mjs` gives "history changed true, packetRevision 1".
- **Smallest fix (a test):**
  ```ts
  h = spHistoryApply(spHistoryApply(h, spMarkReady(h.present)), spAfterExport(h.present, snap, true));
  assert.equal(h.present.packetRevision, h.present.revision);
  ```

### P3 · Test gap: the R2-SP2-02 list and facts caps (mutations M16, M17)
- **The change:** removing either cap in `src\features\stageplot\spPdf.ts:1130-1131` passes every test. The heading-under-heading recursion (M18) is what the tests catch.
- **Measured over the 480-packet notes sweep (`capmut.py`):**

| | Pages with more than 150 pt empty at the foot | Total pages | Pages ending on a heading |
|---|---|---|---|
| With the caps | 240 | 1818 | 0 |
| Without them | 319 | 1818 (same) | 0 |

- So the caps do real work (less blank paper), and nothing guards them.
- **Smallest fix (a test):** salsa, compact, Letter, one sentence of each note. Page 3's last body line is the Notes sentence, not the "Notes and unresolved questions" heading area; or assert a foot gap of at most N pt.

### P4 · Test gaps in screen code: the fix is there, but no test fails without it
Each of these was undone alone and all 615 tests passed. The tests pin the words or the constants, not the condition that shows them.

| Mutation | Fix | File:line | What to pin |
|---|---|---|---|
| M39 | R2-SP1-06: bar goes narrow below 360 | `StagePlotLabScreen.tsx:273` (`const narrow = …`) | the comparison `win.width < SP_BAR_NARROW` |
| M40 | R2-SP1-06: short save words | `StagePlotLabScreen.tsx:274` | `win.width < SP_BAR_SHORT_W \|\| win.height < SP_BAR_SHORT_H` |
| M41 | R2-SP1-05: "▼ MORE" fades | `stage/StageKey.tsx:110` (`outputRange: [1, 0]`) | the output range ends at 0 |
| M45 | R2-SP2-09: reserved note beside the field | `inputs/InputEditor.tsx:221` | the condition `patch?.reserved.includes(n)` |
| M48 | R2-SP1-07: phone note under the field | `SetupArea.tsx:382` | `!spLooksLikePhone(p.contact.phone)` in the condition |
| M49 | R2-SP1-08: refused size kept in the field | `SetupArea.tsx:204` (`sizeShown`) | `sizeRefused[key] ??` |
| M51 | round-1 18a: clamp note | `spForm.tsx:231` (`setMoved(n === typed ? …`) | the `n === typed` test |

- I checked M39 and M40 in the browser: at 320 x 640, "Revision 1 · Draft" (y 133) and "Not saved" (y 134) sit on one line under ‹ ALL PLOTS / UNDO / REDO (y 96).
- The others I did not re-drive in the browser. The fixer's report says they were seen working.

### P5 · Owner questions (not bugs by the brief)
- **(a) A "Plot only" PDF counts as "Make the packet".**
  - `ExportArea.tsx:220` (`makePdf` → `finish(b.snap, true)`) passes `packetMade = true` for every packet choice.
  - So a one-page drawing, with no input list or monitor plan, completes step 5 and, on a blank-started plot, earns `tr_stage_plot`.
  - Steps 1–4 are still judged on the whole project, so the work was done; but the packet is not the packet.
  - Smallest fix if the owner wants it: `finish(b.snap, packet !== 'plot')`.
- **(b) The web print counts when the dialog opens, even if it is canceled.**
  - Web PRINT THIS VIEW counts as soon as the browser's print dialog was asked for (`onFramePrinted('opened')`, `ExportArea.tsx:275`), even if the learner then presses Cancel there.
  - Native print 'opened' (`ExportArea.tsx:259`) does the same.
  - The app cannot tell, and the screen says so. I list it only because it is the cheapest way to the credit.

### P6 · S3 · PDF: a list sub-heading can stand at a page foot with one short item
- **Where:** `long\playback_letter_full_qs_g9.pdf` (four questions added).
  - Page 6 ends with "Unresolved: to be confirmed" and one bullet: "No technical contact is listed for this band."
  - The next five bullets (each 2 lines) are on page 7.
  - Images: `png\pb_qs9_p6.png`, `png\pb_qs9_p7.png`.
- **Not a heading alone:** the brief's rule holds. This comes from the pre-existing "keep 2 lines of a list" rule, because list items are kept whole.
- **Cause:** `spPdf.ts:1131` asks for `2 * BODY_LEAD`, not for the first two ITEMS.
- **Smallest fix:** for a list, ask for the height of its first two items (capped at 3 lines plus one item).

### Equivalent mutant (no action)
- M15: removing `packetRevision` from `sameContent` in `spPacket.ts:110` cannot be seen.
- The snapshot is taken from the current project, so the two always carry the same `packetRevision`, and the latch allows one output at a time.

---

## 2. Focus 1: the credit and packet rule

`credit_fake.mjs` uses the screen's own rule:
- `exported = packetRevision >= revision` (`spContext.tsx:255`; `exportedRev` holds the same number in memory)
- `credit = exported && startedBlank && every step done` (`StagePlotLabScreen.tsx:235`)

A fully answered solo plot, with `startedBlank` set as a blank plot would have it:

| Case | rev / frozen / packet | exported | step 5 | CREDIT |
|---|---|---|---|---|
| A0 nothing made | 1 / 0 / 0 | false | false | false |
| A1 Ready | 1 / 1 / 0 | false | false | false |
| A2 COPY TECHNICAL SUMMARY | 1 / 1 / 0 | false | false | false |
| A3 Ready, then COPY | 1 / 1 / 0 | false | false | false |
| A4 PDF | 1 / 1 / 1 | true | true | **true** (correct) |
| B1 UNDO after the PDF | 2 / 1 / 1 | false | false | false |
| B2 REDO (back to the packet's content) | 1 / 1 / 1 | true | true | true (correct: the same content) |
| B3 edit after the PDF | 2 / 1 / 1 | false | false | false |
| B4 then Ready | 2 / 2 / 1 | false | false | false |
| B5 UNDO back to the packet's content (after Ready on rev 2) | 3 / 2 / 1 | false | false | false |
| B7 type the packet's content back by hand | 3 / 2 / 1 | false | false | false |
| C0 PDF with one question open | 1 / 1 / 1 | true | false | false |
| C1 question answered after the PDF | 2 / 1 / 1 | false | false | false |
| C2 then Ready | 2 / 2 / 1 | false | false | false |
| D0 duplicate of an example (after its PDF) | 1 / 0 / 0, blank false | false | false | false |
| D1, D2 gig copy of an example, then its PDF | blank false | true | true | false (practice) |
| D3 duplicate of a blank-started plot | blank true, packet 0 | false | false | false |
| D4 example renamed "Blank stage" / "Untitled", then PDF | blank false | true | true | false |
| E0 old row, neither field | blank false, packet 0 | false | false | false |

I also checked these, in code:
- **Every path to an edit:** every `ed.apply` site goes through `spEdit` or a model function that does. So no content change keeps the revision of a packet.
  - The two `clone` sites outside `spEdit` are Snap/Grid (`spSetStageView`) and `spDuplicateProject`.
  - The review reads no status, no view switches and no clock.
- **How a plot starts:** the only ways to make a project are `spFromTemplate` (Library START), `spDuplicateProject` (DUPLICATE, gig copy) and `spMigrate` (store read). `startedFrom` is never written after creation, so an example cannot be made to look blank.
- **Once only:** `tr_stage_plot` is reported from one effect, never taken back (no remove, unmark or clear call exists). The sink dedupes.
- **The editor is keyed** by `project.id:at` (`StagePlotLabScreen.tsx:202`), so `exportedRev` never carries into another plot.

Browser check (390 x 844):
- Salsa's hint reads "This plot started from an example band, so it is for practice. A plot started from a blank stage completes this lab."
- Blank's hint reads "All five steps on a plot started from a blank stage complete this lab."
- Step 5 reads "To do. In Export, download, print or share the packet. Marking it Ready or copying the summary does not make a packet."

## 3. Focus 2: the PDF `keepAfter` change

**Page counts** of the 30 examples (`pages.py pdf ..\r2_sp2\pdf`): all 30 equal the tester's.
- Four-piece Letter: full 5, compact 4.
- Playback A4 full: 5.
- Salsa compact Letter: 3.

**A heading ending a page:**
- The 30 examples: 0 of 30 files (`fix_r2\hcheck.py`).
- My 120 long packets: 0 of 120. They have notes of 12, 20 and 40 sentences, 10 short paragraphs, 8 access sentences, and long open questions.

**A heading with fewer than 2 lines under it at a page foot (`h2check.py`):** 25 pages. I read them:
- 24 are "On the stage, with no sound system connection" plus its whole one-line section, and the next section starts overleaf. That is correct.
- 1 is P6 above.

**Table header with fewer than 3 rows:**
- `realviol.py` matches a START piece of fewer than 3 rows to a CONT piece of the same table on the next page: **0** in 150 files.
- The tester's `breakcheck.py` prints 9 "VIOLATION" lines on the examples (50 on the long set). Its own output had the same 9.
  - These are false positives: a complete one- or two-row table, such as Performers on Solo page 1, whose next page begins with another table.
  - Checked by eye: `png\solo_lf_p1.png`, `png\solo_lf_p2.png`.
- No continued piece of only 1 row.

**The tester's case** (`fix_r2\sweep\salsa_letter_compact_g1_a1.pdf`, page 3, `png\fixsweep_salsa_g1a1_p3.png`):
- Page 3 ends with the Notes sentence under both headings.
- "Access and setup" plus the Unresolved list go to page 4 (about 54 pt left; the access heading asks for about 60).
- So the packet is still 4 pages with notes typed, but with no lone heading and no 179 pt hole.

## 4. Focus 3: the salsa label rule

**Printed plot** (`names_probe.mjs`, the test's own geometry, at the printed scale):

| Plots | Name over another head | Name closer than 6 pt to another label | Performer names on a leader |
|---|---|---|---|
| 5 examples, usual and roomy | 0 | 0 | salsa 1 (Nelson), others 0 |
| 120 jittered stages (four-piece, salsa, duo; ±0.06 and ±0.15) | 0 | 0 | not counted |
| Duo with one performer straight above the other (4 distances) | 0 | 0 | 0 |
| Salsa and four-piece squeezed to 0.7, 0.5, 0.35 and 0.25 of the stage | 0 | 0 | many (expected on a squeezed stage) |

- **Note:** the last-resort fallback (`spPacket.ts:715-729`, "nowhere at all keeps the rules") ignores both new rules, and `placed = false` is reported nowhere. My squeezes never reached it.

**App preview** (Export, Salsa, 390 wide, zoomed screenshot):
- "Chino (M6)" is above Chino's head.
- "Nelson (M5)" is upper left, above Wedge 7, joined to Nelson's head by a leader.
- Every other name is above its own head.
- It matches the PDF.

## 5. Focus 4: mutation table

52 mutations, each alone, against `node --test --test-timeout=120000 test/stagePlot*.test.ts test/labRegistration_20261113.test.ts`. Full log: `mutate_out.txt`. Every file was restored byte-identical (SHA-256), and the git diff is unchanged.

| ID | Fix undone | Result |
|---|---|---|
| M01 | R2-SP1-01 `exported` reads `frozenRevision` again (spContext) | CAUGHT (1) |
| M02 | COPY passes `packetMade = true` (ExportArea) | CAUGHT (2) |
| M03 | `spAfterExport` ignores `packetMade` | CAUGHT (2) |
| M04 | packet after a meanwhile edit not recorded | CAUGHT (1) |
| M05 | credit without `startedBlank` (screen) | CAUGHT (2) |
| M06 | blank template not marked `startedBlank` | CAUGHT (1) |
| M07 | every new project `startedBlank: true` | CAUGHT (4) |
| M08 | migrate: missing `startedBlank` reads true | CAUGHT (1) |
| M09 | migrate `packetRevision` check removed | CAUGHT (1) |
| M10 | duplicate keeps the packet record | CAUGHT (1) |
| M11 | duplicate drops `startedBlank` | CAUGHT (1) |
| M12 | UNDO forgets the packet (`spCarryShared`) | CAUGHT (1) |
| **M13** | **packet-only change dropped by `spHistoryApply`** | **NOT CAUGHT (P2)** |
| M14 | `contentKey` counts `packetRevision` as content | CAUGHT (1) |
| M15 | `sameContent` counts `packetRevision` | not caught: equivalent mutant |
| **M16** | **keepAfter facts cap removed** | **NOT CAUGHT (P3)** |
| **M17** | **keepAfter list cap removed** | **NOT CAUGHT (P3)** |
| M18 | heading-under-heading recursion off | CAUGHT (1) |
| M19 | name over another head allowed (beside) | CAUGHT (2) |
| M20 | name over another head allowed (leader) | CAUGHT (3) |
| M21 | 6 pt `PERSON_CLEAR` off | CAUGHT (1) |
| M22 | mono label ignores source names | CAUGHT (1) |
| M23 | unplaced wording back to the short sentence | CAUGHT (2) |
| M24 | phone: any text answers the review | CAUGHT (1) |
| M25 | DI capacity back to 'ask' | CAUGHT (1) |
| M26 | "-5" read as unread | CAUGHT (1) |
| M27 | RENUMBER splits pairs | CAUGHT (1) |
| M28 | restored side appended at the end | CAUGHT (1) |
| M29 | outputs sentence after the personal-mixer line | CAUGHT (1) |
| M30 | mic at its singer uses its own position | CAUGHT (1) |
| M31 | personal mixer back to a headphone amplifier | CAUGHT (1) |
| M32 | number badge may cover a name (stageGeom) | CAUGHT (2) |
| M33 | `crowded` never counted | CAUGHT (2) |
| M34 | "Every performer is named" always | CAUGHT (2) |
| M35 | guided hint static | CAUGHT (1) |
| M36 | unknown plot reads as example | CAUGHT (1) |
| M37 | step-5 how-to old wording | CAUGHT (1) |
| M38 | Setup guide line old | CAUGHT (1) |
| **M39** | **bar never narrow** | **NOT CAUGHT (P4)** |
| **M40** | **never short save words** | **NOT CAUGHT (P4)** |
| **M41** | **"▼ MORE" never fades** | **NOT CAUGHT (P4)** |
| M42 | fact chip does not shrink | CAUGHT (1) |
| M43 | keep-free keyed by list only | CAUGHT (1) |
| M44 | empty list hides reserved channels | CAUGHT (1) |
| **M45** | **reserved note off in InputEditor** | **NOT CAUGHT (P4)** |
| M46 | key sentence always | CAUGHT (1) |
| M47 | band/title not scrolled to | CAUGHT (1) |
| **M48** | **phone note off in Setup** | **NOT CAUGHT (P4)** |
| **M49** | **refused size not kept** | **NOT CAUGHT (P4)** |
| M50 | "in both choices" always | CAUGHT (1) |
| **M51** | **NumberField clamp note never said** | **NOT CAUGHT (P4)** |
| M52 | zoom not remembered | CAUGHT (1) |

Totals: 41 caught, 11 not caught. Of the 11, M15 is an equivalent mutant and 10 are real test gaps. Every credit and packet fix except M13 is guarded.

## 6. Focus 5: tests

| Run | Result |
|---|---|
| `node --test --test-timeout=120000 test/stagePlot*.test.ts test/labRegistration_20261113.test.ts` | 615 tests, 615 pass, 0 fail (`chk_r2_main.txt`) |
| Other tests that read Stage Plot files: `gestureExclusionBudget20261004`, `labTermIntro_20261019`, `mikingLab5Bands`, `perfStartTrim_20261004`, `noRawAlert*`, `ratchetCrlfReads_20261022`, `screenGuideOn_20261108`, `screenGuide_20261031` | 332 tests, 332 pass, 0 fail (`chk_r2_other.txt`) |

- The first four come from `grep -il stageplot test/*.ts`. The case-sensitive `grep -l stageplot` names the same four, outside the stagePlot files.
- The last four are the fixer's extra ratchet and guide files.
- Both logs are in the scratchpad root.
