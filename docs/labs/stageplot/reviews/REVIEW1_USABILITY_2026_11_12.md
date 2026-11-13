# Stage Plot and Channel Designer — REVIEW 1: completeness, ease of use, plain language (2026-11-12)

Reviewer: independent, from the CODE only (branch `ota-after-approval-39-23`). Nothing was run on a phone or in a browser. The seven `test/stagePlot*.test.ts` files were run once, read-only: 283 pass, 0 fail.
Paths are under `src/screens/lab/stageplot/` unless they start with `spXxx.ts` (then `src/features/stageplot/`).
Line format: `[S1|S2|S3] area — what is wrong — file:line — why it matters — the fix`.

---

## 1. Defects: wrong, untrue, or the user's work is lost

- [S1] Review, "to be confirmed" items — every "○ TO BE CONFIRMED" card has only GO TO ›, and GO TO › opens the Inputs area at its top with no row open; for a mix or a monitor device it is also the wrong area — spReview.ts:170 (`area: 'inputs', target: { kind: 'project', id: null }`), spIssueActions.ts:27-39, ExportArea.tsx:372 — handoff §8 "link each issue back to the editable item"; the four-piece example opens with three such cards (Keys L and Keys R phantom power, Keys stereo DI passive or active), so the first three review cards a new user presses lead nowhere — FIX: in spDerive.ts:258-281 build each open item as `{ text, kind: 'input' | 'di' | 'mix' | 'device' | 'extra', id }`; in spReview.ts:169-171 set `area` and `target` from it (input, di, extra → 'inputs'; mix, device → 'monitors'); add `'extra'` to `SpIssue.target.kind` and to `SpSelection`, and open ExtraEditor for it in InputsArea.tsx:120-130.
- [S1] Stage inspector says something the packet does not do — the hint under "Name on the plot" reads "Leave it empty to print no name beside this object." The packet prints the kind name instead ("Chair", "Music stand", "Microphone on a stand"); the editor's own drawing prints nothing — stage/StageInspector.tsx:88; spPacket.ts:311 (`if (!label) label = spPaletteItem(o.kind).name;`); stage/stageLinks.ts:50-56 — the sentence is untrue, and the editor and the packet disagree (handoff: "Edits must stay consistent across them"); twelve music stands print "Music stand" twelve times — FIX: delete spPacket.ts:311 (the device fallback on lines 307-310 stays; `plotText` on line 828 already handles an empty label).
- [S1] Review, click or cue to the audience — the question "… is set to go to the AUDIENCE mix. Keep that only if the audience is meant to hear it." has no answer, only GO TO ›. It can never be closed: it keeps the tab mark, it is printed under "Unresolved", and the guided task's step "Answer every review question" can never be done. The same packet also says the band did it "on purpose" — spReview.ts:123-126 (`actions: ['edit']`), spReview.ts:216, spPacket.ts:750 — handoff §8 "permit deliberate exceptions" — FIX: add `cueAudienceOk: boolean` to `SpInput` (false; set back to false when `audience` or `cue` changes in spUpdateInput); fire the rule only while it is false; add action `'cue-audience-ok'` with the label "The audience is meant to hear it"; add the same as a Switch under the warning note at inputs/InputEditor.tsx:152.
- [S1] Typed text is in the project only after the field is LEFT — a field commits on blur, on the keyboard's "done", or when it is taken off the screen. Multiline fields have no "done". A long "General notes", an email message or a mix note typed and not yet left is lost if the app is closed in the background (the user switches to an email to copy the venue's address, the phone ends the app) — spForm.tsx:69-104, 136-137; spContext.tsx:151-167 (autosave starts only at a commit) — loses the user's work with nothing on screen to warn of it — FIX: in `useDraft` also commit when nothing was typed for 1500 ms (clear that timer on every key and on unmount), and commit on `AppState` change to `inactive` or `background`.

## 2. Defects: unclear, hard to use, or below the house rules

- [S2] Review, a mix with nobody on it — "M5 Sidefill has nobody on it." has no answer, and the tool itself proposes such mixes (a drum fill or sidefill mix with no performer: monitors/monitorPlan.ts:266) — spReview.ts:139-142 — a permanent question, printed as unresolved — FIX: do not fire the rule when `m.delivery` is `'drum-fill'`, `'sidefill'` or `'custom'`.
- [S2] Export forgets what it "keeps" — the kept PDF ("It is kept in this app, so you can share it again"), the edited subject and message, and the packet and paper choices are state of the area; opening any other tab discards them, because the area is unmounted — ExportArea.tsx:113-118, 209, 402-403; StagePlotLabScreen.tsx:192 — handoff §7 "Keep the PDF available if sharing is canceled"; a user who edits the message, goes to Setup to fix the phone number and comes back finds the suggested text again — FIX: hold `kept`, `mail`, `packet`, `paper` in spContext (for the open stage plot). When the kept file is older than the stage plot, say: `Kept PDF: ${fileName}, revision ${file.revision}. Your stage plot is now at revision ${project.revision}.`
- [S2] Stage → ADD → instrument → package gives duplicate names — the source and its inputs get the catalog's names unchanged: a second guitar adds a second source "Guitar", a second input "Guitar cabinet" and a second symbol "Guitar amp". The same package added in Inputs is renamed ("Guitar (Rafa)", "Guitar cabinet (Rafa)") — stage/stageLinks.ts:372-378, stage/StagePalette.tsx:175; compare inputs/AddSheets.tsx:95-101 and inputs/inputsLogic.ts:69-79, 145-183 — two rows with one name in the input list, the needs grid, "Guitar cabinet: who supplies the microphone" and the packet — FIX: in `stageAddWithPackage` take the rows and the source name from `spPackagePreview(p, pkg, ticked, { performerId })` and pass `{ sourceLabel: view.sourceLabel, rows: view.picked }` (move `spUniqueLabel` and `spPackagePreview` to a pure file both areas import).
- [S2] The examples put the sample people's names into mix names and device labels — "M1 Sam", "M3 Maya, in-ear", "Maya’s pack", "Nina’s headphone amplifier". Renaming the performer in Setup changes none of them and no review item says so; the packet then prints "M3 Maya, in-ear" for Carlos — spTemplates.ts:115, 135-136, 179-187, 234-235; spModel.ts:266-270; the same happens to mixes made later (monitors/monitorPlan.ts:263-268, 320-323) — renaming is the first thing a user of an example does — FIX: (a) name the examples' mixes by role: 'Guitar and lead vocal', 'Bass', 'Drums, in-ear', 'Keys, in-ear'; device labels 'Receiver pack', 'Headphone amplifier'; (b) at SetupArea.tsx:294, when the name changes, replace the old name inside every mix name and device label that contains it, in the same edit.
- [S2] "Move the bass player" moves only his figure — the amplifier, the vocal microphone and the wedge are separate objects and no example groups them; the input list's stage location follows the amplifier symbol, not the figure — spTemplates.ts (no `group(` call), spModel.ts:860-880; the test for check 2 moves the microphone, not the performer (test/stagePlotModel.test.ts:212) — handoff §12 check 2 "Move a performer and confirm plot position, source location, and export agree"; the task takes four drags, or seven taps to group first — FIX: in each example group a performer with their own instrument, microphone and wedge; add to the well text at StageArea.tsx:244: "A performer, their instrument, their microphone and their wedge are separate objects. Group them in OBJECT to move them together."
- [S2] A monitor device added in Monitors is never asked onto the stage — "NOT ON THE STAGE YET" lists performers and sources only, and no review rule exists for a device with no symbol — stage/stageLinks.ts:275-283; spReview.ts (no rule) — the packet can go out with a wedge in the tables and not on the plot — FIX: in `stageUnplaced` add devices of type `wedge`, `drum-fill`, `sidefill` that no object points at (`kind: 'device'`); StageArea.tsx:264 already places any kind.
- [S2] Setup, "REMOVE … AND WHAT IS ONLY THEIRS" does not say all it leaves — the sheet says their sources, inputs, the drawings of those sources and a mix that is only theirs are removed. Left behind and not said: a microphone symbol linked to one of their inputs (it becomes an unlinked drawing, and the review asks about it) and the wedge of the removed mix (then "not on any mix") — spModel.ts:299 (objects removed by `sourceId` only), spModel.ts:281 (devices listed by `performerId` only), SetupArea.tsx:351-363 — two new review questions after a removal that named neither — FIX: in `spRemovePerformer` (withSources) also remove objects whose `inputId` is one of the removed inputs; in `spPerformerLinks` add the devices on `soleMixes` and print: `• ${label} plays ${code}. It stays in the monitor plan, with no mix.`
- [S2] The review answer "RENUMBER THIS LIST" renumbers a shared document without the question that the CHANNEL ORDER panel asks for the same act — spIssueActions.ts:131-136, InputsArea.tsx:131-135; compare inputs/OrderPanel.tsx:34-42 — handoff §4 "Do not renumber … silently after the document has been advanced" — FIX: when `spSharedNotice(p)` is not null, ask first with `confirmDialog('Renumber a shared document?', notice, 'Renumber', run)`.
- [S2] The revision is not on screen while editing — the header shows only the name. After a shared revision, the first edit in any area starts the next revision and returns the status to Draft, with no word on screen — StagePlotLabScreen.tsx:149; spModel.ts:216-222 — handoff §4 "Make the changed revision apparent" — FIX: subtitle = `${spProjectName(ed.project)} · Revision ${ed.project.revision} · ${ed.project.status === 'ready' ? 'Ready to advance' : 'Draft'}`.
- [S2] Library, every plot started from an example is "Untitled stage plot" — three examples opened to look at them are three identical rows (MASTER, REVISION 1, DRAFT), and START saves each one at once — spTemplates.ts:336, ProjectLibrary.tsx:219-221 — the user cannot tell them apart — FIX: when band and title are empty and `p.startedFrom` is set, add to the subtitle: `Started from: ${template.name}`.
- [S2] Setup, PERFORMERS is the seventh block — after GUIDED TASK, THE BAND, THE GIG, TECHNICAL CONTACT (four fields, four switches), THE DOCUMENT and STAGE SIZE: about five phone screens of scrolling before a performer can be renamed — SetupArea.tsx:267-311 — FIX: move the PERFORMERS block to directly after THE BAND.
- [S2] No review item for a packet with no band name or no contact — the packet prints "Untitled band", the file is "Band_StagePlot_Rev01.pdf", and the suggested message says "confirm … with us" — spPacket.ts:80, 136, 161; spReview.ts (no rule) — handoff §1 "who should the engineer contact?" — FIX: two `ask` issues with `area: 'setup'`: "Your band has no name yet. The packet prints “Untitled band”." and "No technical contact is shown in the packet. Who should the venue ask?"
- [S2] Event date read month first, in silence — "5/12/2026" is accepted and stored as May 12; a musician who writes the day first gets the wrong date in the packet and in the file name — spStore.ts:149; SetupArea.tsx:131-135, 195-196; ProjectLibrary.tsx:136-139 — FIX: accept numbers only with the year first (remove the branch on line 149); under the field show `Read as ${spDateWords(p.eventDate)}.`
- [S2] "ADD A MONITOR MIX" (the answer to "X has no monitor") adds a mix only — no wedge or pack is proposed and "Who creates this mix" stays "To be confirmed"; the "Add a mix" button proposes the usual devices first — spIssueActions.ts:137-149 vs monitors/MixSheets.tsx:85-141 — the answer does less than the button with the same name, and the performer still has no device — FIX: make the answer a jump: go to Monitors and open the "Add a mix" popup with `recipients: [id]` (MonitorsArea.tsx:79 already takes them).
- [S2] A refused save is not tried again when the user leaves — `dirty` is cleared before the write; after `'failed'` nothing sets it again, so closing the editor does not retry. The Setup note says saving "is tried again with your next change", and the file header says both ways out "save first" — spContext.tsx:143-148, 193-200 — the changes since the last good save are dropped — FIX: in the `.then`, `if (result === 'failed') dirty.current = true;`
- [S2] "LOCATE ON STAGE" is shown for things that are not on the stage — the Inputs buttons keep that label when nothing is placed (only the screen-reader label changes); the review answer for an unplaced source is also "Locate on stage" — inputs/InputEditor.tsx:186, inputs/SourceEditor.tsx:152, spIssueActions.ts:45 — the words promise to show something that is not there — FIX: label `object ? 'LOCATE ON THE STAGE' : 'PLACE ON THE STAGE'` in both editors; in spIssueActions.ts:45 return 'Place on the stage' for `source-unplaced` too (see the names table, row 16).

## 3. Defects: polish

- [S3] "To be confirmed" is said twice on every card and every packet line — heading "○ TO BE CONFIRMED", then "To be confirmed — Keys L: phantom power."; the packet repeats it under "Unresolved: to be confirmed" — spReview.ts:170, spForm.tsx:404, spPacket.ts:775-776 — FIX: `text: \`${text}.\`` (inputs/inputsLogic.ts:628 keeps working).
- [S3] An internal key can be printed — a listed item with an empty name gives "stage-box: who supplies it" — spDerive.ts:281 (`e.label || e.kind`) — FIX: move `SP_EXTRA_WORD` to spCatalog.ts and use `e.label.trim() || SP_EXTRA_WORD[e.kind]`.
- [S3] The same new device gets two names by the door used — Stage: "In-ear receiver pack 1", "Wireless in-ear transmitter 1" (count + 1, which can repeat a label after a removal); Monitors: "Receiver pack", "In-ear transmitter" — stage/stageLinks.ts:382-386 vs monitors/monitorPlan.ts:286-312 — FIX: `stageAddWithDevice` uses `spmNewDeviceLabel(p, f.type)`.
- [S3] Guided task, step 5 returns to "To do" each time the stage plot is opened — `exported` lives in the editor only — spContext.tsx:116, 244 — FIX: `exported: exportedRev === project.revision || project.frozenRevision >= project.revision`.
- [S3] Export, the PREVIEW is the last block, under the buttons and EMAIL — a user shares before seeing the pages — ExportArea.tsx:439 — FIX: move PREVIEW above "PRINT, SHARE AND SAVE".
- [S3] Export starts at "US Letter" on every visit, also for a stage measured in meters — ExportArea.tsx:114 — FIX: start at `project.stage.unit === 'm' ? 'a4' : 'letter'`, and keep the choice (see the Export defect above).
- [S3] Export does not say which contact details will print — the switches are in Setup only — ExportArea.tsx:342-346 — handoff §7 "Let users choose which contact information appears before exporting" — FIX: a Note in WHAT TO MAKE: `Contact shown in the packet: ${shown.join(', ') || 'none'}. Change it in Setup.`
- [S3] A ✓ under a channel number means "last opened or added" — inputs/InputRow.tsx:35 — it reads as "done" or "confirmed" — FIX: use "▸", as RowCard does (spForm.tsx:265).
- [S3] "Change" on a "No monitor, by choice" row removes the answer and brings the review question back — MonitorsArea.tsx:378 — the word does not say that — FIX: label "ASK AGAIN".
- [S3] The answer "It belongs to a source" is a jump, and for a microphone symbol the thing to link is an input — spIssueActions.ts:56-57, 90-94; stage/StageInspector.tsx:194 — FIX: label "Link it to something in your lists".
- [S3] Two "back" controls with two results inside an open stage plot — the header ‹ leaves the lab; "‹ ALL PLOTS" and Android BACK go to the list — StagePlotLabScreen.tsx:101, 149, 152 — FIX: none in this lab's files; say it in the Setup guide: "The ‹ at the top leaves the lab. ALL PLOTS returns to your list."
- [S3] The example states "phantom power required" for "Condenser microphone", a broad category — spTemplates.ts:104, 150 — handoff §4 "Do not infer phantom power from … a broad microphone category"; an unedited example prints it — FIX: `VENUE_CONDENSER.phantom = 'unknown'`.
- [S3] Three ways to confirm a removal in one tool — Inputs asks in place (two presses), Monitors opens a popup, Setup opens a sheet, Stage removes at once — inputs/bits.tsx:73-84, monitors/MixSheets.tsx:172, monitors/DeviceSheets.tsx:73, stage/StageInspector.tsx:257-264 — FIX: use the in-place `RemoveStep` in the Monitors popups too.
- [S3] Abbreviations the app never explains are printed on the plot — tags "IEM" and "AC", default label "IEM" — spSymbols.ts:106, 119; spCatalog.ts:157 — FIX: label 'In-ear'; add a legend line in spPacket.ts:446: "DI = direct box. IEM = in-ear monitor. AC = power."
- [S3] Text that can be cut with "…" — (a) the placeholder "A model, or a kind such as dynamic vocal microphone" (51 characters in a field about 294 pt wide) — inputs/InputEditor.tsx:172 — FIX: placeholder "Model or kind of microphone", hint "For example: dynamic vocal microphone. What you type is a preference unless you mark it Required under More details."; (b) a typed "…" in "Band leader, sound engineer…" — SetupArea.tsx:51 — FIX: "Band leader or sound engineer"; (c) the stage plot's name in the header is given to a two-line cropped text — StagePlotLabScreen.tsx:149, kit/LabNavBar.tsx:132 — FIX: pass the band name only, and show the title in Setup.

## 4. Language: defects with the exact replacement

- [S2] "key" means a button in eleven strings, in a tool where "Keys" is an instrument ("Keys", "Some keys", "Keys L") — FIX, each line:
  - guides/inputs.ts:22 → "The ▲ and ▼ buttons move a row up or down. A stereo pair moves as one."
  - guides/setup.ts:16 → "The line between ALL PLOTS and UNDO says whether your work is saved on this device."
  - guides/setup.ts:19 → "A field keeps what you typed when you leave it. UNDO and REDO step back and forward through your changes, in every area."
  - guides/setup.ts:23 → "The guided task is optional. Each step has a GO button that opens the area where that step is done."
  - guides/stage.ts:40 → "Choose an object in the list under the drawing and press a position button. The object moves one step, with no drag."
  - inputs/OrderPanel.tsx:52 → `For the ${patch.name} list. Use the ▲ and ▼ buttons on a row to move one input. The buttons below change the whole list.`
  - SetupArea.tsx:369 → "If you change your mind afterward, UNDO reverses it."
  - stage/StageInspector.tsx:100 → "A position button moves one grid step." / "A position button moves one hundredth of the stage."
  - stage/StageObjectList.tsx:28 → "Nothing is on the stage yet. Tap ADD in the row of buttons at the bottom to open the palette."
  - stage/StageObjectList.tsx:48 → "Selected: its position buttons and details are under this row. Press to deselect it."
  - StageArea.tsx:283 → "Every object, from upstage to downstage. Choose a row to move it with buttons or typed numbers: nothing here needs a drag."
- [S2] Words used before, or without, an explanation on that screen. The audio wording of each gloss should be confirmed by the audio review; the need for a gloss is the finding.
  - "phantom power" (inputs/InputEditor.tsx:261-266, inputs/AddSheets.tsx:143, inputs/DiPanel.tsx:44) → hint: "Phantom power is electricity that the mixer sends through the microphone cable. Some microphones and DIs need it. Say what this device needs, if you know. The tool never decides it from the connector or from the word DI. To be confirmed is printed as a question."
  - "house" (spCatalog.ts:58, 75; monitors/monitorPlan.ts:208) → add to the hint at monitors/MixSheets.tsx:116 and 197: "House console: the venue’s mixer. Band monitor console: a mixer your band brings for its monitors. Personal mixer system: a small mixer for each performer."
  - "wedge", "in-ear", "drum fill", "sidefill" (spCatalog.ts:80-87) → hint at monitors/MixSheets.tsx:115 and 200: "Wedge: a loudspeaker on the floor, aimed at the performer. In-ear: earphones. Drum fill: a loudspeaker for the drummer. Sidefill: loudspeakers at the sides of the stage."
  - "An input split", "Feeds from the house console", "Returns to the house console" (spCatalog.ts:89-95) → no words explain them; add one line for each to `BAND_RIG_HINT` (monitors/MixSheets.tsx:54).
  - "DI" is in the example text on the first screen (spTemplates.ts:38-41) and in the first choice of every input; its explanation is far down the Inputs area (inputs/DiPanel.tsx:42-45) → move that HelpTip beside the two at InputsArea.tsx:215-222; in spTemplates.ts:40 write "bass through a DI box".
  - "click", "cue", "talkback" (inputs/InputEditor.tsx:284; MonitorsArea.tsx:350) → hint: "A click is a metronome sound for the performers. A cue or talkback is a voice that only the performers hear."
  - "Stage box", "Split", "Backline" (inputs/inputsLogic.ts:40-47; inputs/SummaryPanel.tsx:86) → section hint: "Stage box: the box on the stage where the cables plug in. Split: equipment that sends each input to two mixers. Backline: instruments and amplifiers that are supplied for you."
  - "Coordination required" (monitors/monitorPlan.ts:411, 415) → "Wireless: the venue must check that its radio equipment and yours do not disturb each other. This tool records that. It does not choose radio frequencies."
  - "rig" (spCatalog.ts:59; monitors/monitorPlan.ts:161, 173, 213; monitors/DeviceSheets.tsx:90-91; spPacket.ts:585, 683) → say once, at monitors/MixSheets.tsx:54: "Your band’s own rig is the monitor equipment your band brings and mixes itself."
  - "advance preference" (monitors/monitorPlan.ts:76; monitors/MixSheets.tsx:246; spPacket.ts:755) → "A preference you give before the show, not a fader value. The engineer builds the real mix at soundcheck."
  - "footprint" (StageArea.tsx:135, 291-292; guides/stage.ts:35) → badge: "NOT TO SCALE · SYMBOLS ARE DRAWINGS, NOT THE REAL SIZE OF THE EQUIPMENT".
  - "print engine" (ExportArea.tsx:84) → "This version of the app cannot print or make a PDF on this device. COPY TECHNICAL SUMMARY and the text view still work."
  - "share sheet" (ExportArea.tsx:218-221, 397-403, 418; guides/export.ts:21, 34) → "your phone’s share menu".
  - "clipboard" (guides/export.ts:23) → "The subject and the message are yours to change. COPY THE MESSAGE copies them, so you can paste them into your email."
  - "chips" (guides/setup.ts:21) → "Under Status, choose Draft or Ready to advance. Ready is refused while something must be corrected."
  - "patch" as a verb (inputs/OrderPanel.tsx:56) → "This is a convenience, not a house standard: a venue may use another order."
  - "session" (StagePlotLabScreen.tsx:81; ProjectLibrary.tsx:64-68) → "Not saved: kept only until you close the app".
- [S3] Idioms and unclear phrases:
  - "LET GO OF IT" (stage/StageInspector.tsx:266) → "DESELECT".
  - "with no input behind it" (spReview.ts:161) → `${name} is drawn on the stage and is not linked to an input. Is it only a drawing (acoustic, or self-contained), or does it belong to a source?`
  - "With it go an input list (…) and a monitor plan (…)." (ProjectLibrary.tsx:189) → "It comes with two lists. The input list has every sound that reaches the sound system. The monitor plan says what each performer needs to hear."
  - "so the stage can be ready when you arrive" (ProjectLibrary.tsx:189, an outcome the tool cannot promise) → "so they can prepare the stage before you arrive."
  - "freezes your project" (guides/export.ts:27) → "Each button takes a copy of your stage plot at that moment and makes every page from that copy."
  - "After a packet goes out" (guides/export.ts:28) → "After you print or share a packet, your next edit moves the revision number forward."
  - "by hand" (ExportArea.tsx:291, 300, 440) → "You can select the text below and copy it yourself."
  - "drawings of a kind of thing" (StageArea.tsx:291-292) → see the next item.
  - "Who brings the listed equipment. Band: 9. Venue: 20. To be confirmed: 2." (ExportArea.tsx:363) → `Items the band brings: ${split.band}. Items asked of the venue: ${split.venue}. Items to be confirmed: ${split.tbc}.`
  - "Sign in before you close the app and they are saved." (ProjectLibrary.tsx:67) → "If you sign in before you close the app, they are saved."
  - "Each button makes Full packet, US Letter from your project as it is at that moment." (ExportArea.tsx:376) → `Each button makes the packet you chose above (${what}) from your stage plot as it is at that moment. A line under the button says what happened.`
- [S3] Sentences over about 22 words (count in brackets):
  - StageArea.tsx:300 [31] → "When you add a symbol, you choose what it stands for. It can be something already in your lists. It can be a package of inputs, which you see before it is added. Or it can be only a drawing."
  - guides/stage.ts:10 [29] → "A stage plot shows who stands where. It is a view from the audience, with a symbol for each person and each piece of equipment. Names and numbers stand beside the symbols."
  - monitors/monitorPlan.ts:161 [28] → `Your band creates ${count(b.mixes, 'mix', 'mixes')} in its own rig (${spmFormatWords(b)}): ${parts.join(', ')}. That is ${count(b.channels, 'audio channel', 'audio channels')} that the house console is not asked to create.`
  - guides/stage.ts:33 [27] → "A stage plot is drawn as the audience sees the stage. The engineer at the mixing position sees the stage the same way."
  - guides/inputs.ts:15 [26] → "Each card is one input. It shows the channel number, the name, who plays it, where it is on the stage, how it is captured, and its stand."
  - inputs/InputEditor.tsx:211 [26] → "If you take it off and nothing else uses it, the device leaves the list. The DI channel then says its device is to be confirmed."
  - guides/monitors.ts:22 [25] → "ADD A DEVICE adds one piece of monitor equipment, such as a wedge or a receiver pack. You choose the mix it is on."
  - StageArea.tsx:291 [24] → `The stage is drawn to scale: ${size}. The symbols are not. They show what kind of thing stands there, not the real size of your equipment. The plot does not prove that anything fits.`
  - stage/StagePalette.tsx:114 [23] → "Tap what you want on the stage. A symbol never adds an input by itself. For an instrument, a microphone or a monitor, you first choose what the symbol stands for."
  - SetupArea.tsx:220 [23] → `Revision ${p.revision} has been shared or marked ready. Your next change starts revision ${p.revision + 1} as a draft. A changed document never carries the number of the one you already sent.`
  - StageArea.tsx:296, last sentence [23] → "The picture always looks from the audience and cannot be flipped. A printed plot is never a mirror image of the stage."
  - guides/library.ts:10 [23] → "A stage plot is for a venue’s sound engineer. It says who plays where, what reaches the sound system, and what each performer needs to hear."
  - inputs/AddSheets.tsx:143 [22, and two ideas] → "New rows join the end of the input list with the next free numbers. Who brings each item starts as “To be confirmed”, and so does phantom power. You answer them; the tool does not."
- Checked, nothing found: British spelling (none in any string); "production ready" (not in any string); "N of M" progress (none; "Page N of M" is the footer of a printed page); payment, tier or "free" wording (none); a promise of skill (none).

## 5. One name per thing

Names in use, with one place each (more exist), and the one to keep.

| # | The thing | Names in use (file:line) | Keep |
|---|---|---|---|
| 1 | One audio channel that reaches a mixer | "input" InputsArea.tsx:214 · "input channel" inputs/AddSheets.tsx:68 · "row" inputs/AddSheets.tsx:109 · "channel" inputs/AddSheets.tsx:39, inputs/InputEditor.tsx:241 | "input"; "channel number" for its number; "row" only for the card on screen. Change AddSheets.tsx:39 to "A single input, on a source you already have or on a new one." and InputEditor.tsx:241 to "DI device for this input" |
| 2 | The list of inputs | "INPUT LIST" InputsArea.tsx:214 · "Channel list" InputsArea.tsx:226 · "channel list" inputs/AddSheets.tsx:143 · "CHANNEL ORDER" inputs/OrderPanel.tsx:52 · "Input list" spPacket.ts:727 | "input list". InputsArea.tsx:226 → "Input list for"; OrderPanel.tsx:52 → "ORDER OF THE INPUT LIST" |
| 3 | What a performer hears | "mix" MonitorsArea.tsx:295 · "monitor mix" ExportArea.tsx:354 · "distinct mix" MonitorsArea.tsx:254 · "audio program" MonitorsArea.tsx:82, guides/monitors.ts:32 | "mix" in Monitors, "monitor mix" elsewhere; drop "audio program" |
| 4 | Who makes a mix | "Who creates this mix" monitors/MixSheets.tsx:116 · "provider" monitors/monitorPlan.ts:172-173, 216 · "Created by" spPacket.ts:553 · "creator" spPacket.ts:738 | "who creates the mix". monitorPlan.ts:216 → "WHO CREATES IT: TO BE CONFIRMED"; :172 → "For 1 mix, who creates it is to be confirmed. It is not counted for the house console or for your band’s own rig." |
| 5 | Monitor hardware | "device" MonitorsArea.tsx:326 · "monitor device" monitors/monitorPlan.ts:129 · "monitor equipment" ExportArea.tsx:362, spPacket.ts:743, 756, inputs/SummaryPanel.tsx:72 | "monitor device" |
| 6 | DI hardware and its channels | "DI device" inputs/DiPanel.tsx:41 · "boxes" inputs/DiPanel.tsx:41 · "DI audio channel" inputs/DiPanel.tsx:47, spDerive.ts:145 · "DI channel" inputs/DiPanel.tsx:97, spDerive.ts:147 | "DI device", "DI channel" |
| 7 | What makes the sound | "source" InputsArea.tsx:223 · "instrument" InputsArea.tsx:217 · "instrument or voice" inputs/AddSheets.tsx:185 | "source"; add to the hint at InputsArea.tsx:214: "A source is one instrument or one voice." |
| 8 | A person in the band | "performer" SetupArea.tsx:276 · "band member" GuidedTask.tsx:19, guides/setup.ts:11, 22, stage/StageInspector.tsx:192, stage/StagePalette.tsx:234 · "players" spTemplates.ts:42 · "musician" monitors/monitorPlan.ts:165 · with no name: "Unnamed performer" stage/stageLinks.ts:190, "Performer with no name" SetupArea.tsx:280, "A performer" spReview.ts:148 | "performer"; "Unnamed performer" |
| 9 | The saved thing | "stage plot" ProjectLibrary.tsx:193 · "plot" StagePlotLabScreen.tsx:153, guides/library.ts:16 · "project" ProjectLibrary.tsx:250, SetupArea.tsx:182, ExportArea.tsx:82-83, 212, 245, 342, 376, spReview.ts:77, inputs/SourceEditor.tsx:52, guides/export.ts:27 · "document" SetupArea.tsx:213, InputsArea.tsx:209, inputs/inputsLogic.ts:391 · "setup" ProjectLibrary.tsx:242 | "stage plot". "Project title" → "Title of this stage plot"; "your project" → "your stage plot"; "document" only in the sentence that defines Ready to advance |
| 10 | What leaves the app | "packet" ExportArea.tsx:343 · "gig packet" guides/export.ts:11 · "technical packet" spPacket.ts:799 · "PDF" ExportArea.tsx:397 · "export" ExportArea.tsx:342 | "packet" (the document), "PDF" (its file), "Export" (the area's name only). ExportArea.tsx:342 → "These two choices are for the packet you make now. They are not saved in your stage plot." |
| 11 | Who brings an item | "Who brings it" inputs/InputEditor.tsx:177 · "Who supplies it" monitors/DeviceSheets.tsx:93 · "Supplied by:" monitors/monitorPlan.ts:403-406 · "who supplies" spDerive.ts:260-281 · "Supplied by" spPacket.ts:512 | "brings" in the app, "Supplied by" on paper. DeviceSheets.tsx:93 → "Who brings it"; monitorPlan.ts:403-406 → "Band brings it" / "Venue brings it" / "Other provider brings it" / "To be confirmed who brings it" (the words Inputs already uses, inputsLogic.ts:272) |
| 12 | The venue's system | "House system" spCatalog.ts:58 · "house console" spCatalog.ts:75 · "sound system" InputsArea.tsx:193 · "mixer" InputsArea.tsx:214 · "console" InputsArea.tsx:221 · "the venue’s monitor system" monitors/DeviceSheets.tsx:90 | "house system" (all of it) and "house console" (its mixer), explained once; at InputsArea.tsx:217 write "a mixer (also called a console)" |
| 13 | The band's own monitor system | "Band monitor rig" spCatalog.ts:59 · "your band’s own rig" monitors/monitorPlan.ts:161 · "Own rig" spPacket.ts:585 · "self-contained" spIssueActions.ts:65, stage/StageInspector.tsx:171, stage/stageLinks.ts:264 | "your band’s own rig", explained once. The same switch has two names: "Part of your band’s own rig" (monitors/DeviceSheets.tsx:90) and "It is self-contained" (spIssueActions.ts:65) → keep the first |
| 14 | A thing on the stage | "object" StageArea.tsx:281 · "symbol" stage/StagePalette.tsx:114, StageArea.tsx:249, 261 · "figure" stage/StagePalette.tsx:234 · "item" export/PlotView.tsx:62 | "object" for the thing; "symbol" only for its picture; "only a drawing" for an object linked to nothing. StageArea.tsx:249 → "… and it is not on the stage yet." |
| 15 | The stage view | "the picture" StageArea.tsx:149, stage/StageInspector.tsx:100, guides/stage.ts:14 · "the drawing" SetupArea.tsx:263, guides/setup.ts:31, spPacket.ts:443 · "stage drawing" guides/inputs.ts:24 | "the drawing". The stage-directions HelpTip exists twice with two wordings (SetupArea.tsx:262-263 "LEFT of the drawing", StageArea.tsx:295-296 "LEFT of this picture") → one text |
| 16 | The jump to the stage | "LOCATE ON STAGE" inputs/InputEditor.tsx:186 · "PLACE ON THE STAGE" SetupArea.tsx:298 · "Go to Stage" MonitorsArea.tsx:122, monitors/DeviceSheets.tsx:98 · "PLACE IT ON THE STAGE" StageArea.tsx:250 · "Locate on stage" / "Place on the stage" spIssueActions.ts:45 | on the stage: "LOCATE ON THE STAGE"; not yet: "PLACE ON THE STAGE" |
| 17 | The monitor-only label | "MONITOR ONLY · kept out of the audience mix" inputs/InputRow.tsx:51 · "MONITOR ONLY — kept out …" monitors/monitorPlan.ts:428 · "MONITOR ONLY: kept out …" stage/StagePalette.tsx:162, spPacket.ts:524 · "MONITOR ONLY, kept out …" spPacket.ts:750 | "MONITOR ONLY: kept out of the audience mix" |
| 18 | A value nobody knows yet | "To be confirmed" spCatalog.ts:34 · "Unknown" spCatalog.ts:55 · "Not known" inputs/inputsLogic.ts:39 · "Arrangement to confirm" inputs/InputEditor.tsx:243 · "to confirm" spDerive.ts:148-149 · "Not answered yet" inputs/AddSheets.tsx:204 | "To be confirmed" (the build brief's rule); "device arrangement to be confirmed" |
| 19 | A thing you press | "key" (eleven strings, section 4) · "button" ExportArea.tsx:376 | "button" |
| 20 | No connection | "No sound system connection needed" inputs/AddSheets.tsx:41 · "No sound-system connection needed." stage/StageInspector.tsx:159 · "no sound-system connection" stage/stageLinks.ts:224 | no hyphen |
| 21 | The performer of a source | "Who plays it" inputs/AddSheets.tsx:139, 189, 228, inputs/SourceEditor.tsx:97 · "Who plays or sings it" stage/StagePalette.tsx:168 | "Who plays or sings it" |

## 6. Capitals: one rule, and every string it changes

What is true in the code: the kit's `Button` sets capitals itself (spForm.tsx:505), so every button is in capitals on screen whatever was typed. The Monitors and Export builders typed sentence case, the others typed capitals. The visible differences are (a) the sentences that NAME a button, (b) the badges on a row, (c) the small headings inside a popup.

THE RULE. CAPITALS: tab names, buttons, section titles, group headings, sub-headings, badges, tags. Sentence case: chips, switches, field labels, row titles, popup titles, hints, notes, messages. A sentence that names a button or a section writes it in CAPITALS with no quotation marks, exactly as on the screen. A sentence that names a chip or a field keeps sentence case in quotation marks.

Strings that must change:
1. Button labels typed in sentence case (type them in capitals, so the source, the tests and the guides agree with the screen): MonitorsArea.tsx:104 "Edit mix", :105 "What it needs to hear", :121 "Edit device", :122 "Locate on stage" / "Go to Stage", :297 "Add a mix", :320 "Renumber the mix labels", :328 "Add a device", :357 "Go to this input", :363 "Go to Inputs", :378 "Change"; monitors/MixSheets.tsx:76 "Go to Setup", :136 "Add this mix", :137 "Cancel", :212 "Add a device to this mix", :220 "What this mix needs to hear", :252 "Done", :253 "Remove this mix"; monitors/DeviceSheets.tsx:53 "Add this device", :54 "Cancel", :98 "Locate on stage" / "Go to Stage", :109 "Done", :110 "Remove this device"; monitors/NeedsPanel.tsx:87 "Go to Inputs"; ExportArea.tsx:380 "Print", :391 "Download PDF", :397 "Share PDF", :403 "Share the same PDF again", :409 "Copy technical summary", :423 "Use the suggested text again", :424 "Copy the message", :426 "Copy the message and download the PDF" / "Copy the message and share the PDF".
2. Sentences that name a button in sentence case and quotation marks: ExportArea.tsx:84 “Copy technical summary” → COPY TECHNICAL SUMMARY; :220 “Print” → PRINT; :221 “Share the same PDF again” → SHARE THE SAME PDF AGAIN; :252, :253 “Download PDF” → DOWNLOAD PDF; :391 “Print” → PRINT. (“Save as PDF” is the browser's own label: keep. “Text only” at :440 is a chip: keep.)
3. guides/monitors.ts:12 “Add a mix” → ADD A MIX; :21 “Add a mix”, “Edit mix” → ADD A MIX, EDIT MIX; :22 “Add a device” → ADD A DEVICE; :23 and :40 “What each mix needs to hear” → WHAT EACH MIX NEEDS TO HEAR; :24 “Locate on stage”, “Go to this input” → LOCATE ON THE STAGE, GO TO THIS INPUT; :39 “Edit mix” → EDIT MIX.
4. guides/export.ts:12 “Share PDF”, “Print” → SHARE PDF, PRINT; :21 “Print”, “Share PDF”, “Download PDF” → PRINT, SHARE PDF, DOWNLOAD PDF; :22 “Copy technical summary” → COPY TECHNICAL SUMMARY; :23 “Copy the message” → COPY THE MESSAGE. (“Packet”, “Paper”, “Show the packet as” at :20 and :24 are field labels: keep.)
5. Row badges: spForm.tsx:497 add `textTransform: 'uppercase'` to `badgeText`. That brings into line MonitorsArea.tsx:92 ("Mono: 1 audio channel", "Wedge", "Band monitor console"), :116 ("Supplied by: Venue", "Wireless: coordination required") and inputs/AddSheets.tsx:68 ("6 input channels") with ProjectLibrary.tsx:223-226 ("GIG COPY") and InputsArea.tsx:264 ("NEEDS AN ANSWER").
6. Sub-headings inside popups: Inputs draws them in capitals (inputs/bits.tsx:99), Monitors in sentence case (`FieldLabel`, monitors/bits.tsx:85). The same heading has two looks: "ON THE STAGE" (inputs/InputEditor.tsx:181) and "On the stage" (monitors/DeviceSheets.tsx:96). Add `textTransform: 'uppercase'` to `fieldLabel`; it changes monitors/MixSheets.tsx:61, :121, :203, :231 and monitors/DeviceSheets.tsx:96.

## 7. Guest and member behavior (from the code)

- What a signed-out guest can do: everything. Start from any example, edit all five areas, print, share and download. Nothing is gated; `useMemberGate` is not used; no string mentions payment, a tier or "free". Sound.
- What is saved: a real account writes to the device (`'write'`); a guest and an account still being checked are kept for the app session and held for a sign-in in the same session (`'hold'`); a preview is kept for the session and held for nobody (`'drop'`) — StagePlotLabScreen.tsx:91, spStore.ts:261-278. The cap of 24 also counts session work.
- Every message about it is calm, and true as far as the code shows: header "Not saved: kept for this session only" (StagePlotLabScreen.tsx:81); library badge "THIS SESSION ONLY" (ProjectLibrary.tsx:226); the Note on the library and in Setup (ProjectLibrary.tsx:62-69, SetupArea.tsx:117). "Not signed in" is said only to a known guest; an account being checked gets "Still checking your account. Until it is confirmed, …". Not verified at run time: that a sign-in in the same session writes the held stage plots.
- [S3] guest — the popup on the library speaks of "progress" ("Your progress in this session won’t be saved unless you sign in"), and this tool makes documents — StagePlotLabScreen.tsx:113 (`kind="progress"`), src/features/lab/guestReminderRules.ts:50-51 — the Note under it already says the right thing — FIX: remove the popup here, or give the reminder a kind whose words are "Your stage plots".
- [S3] guest — the screen-reader label of "‹ ALL PLOTS" is "All stage plots. Your work is saved first." For a guest it is not saved — StagePlotLabScreen.tsx:152 — FIX: "Back to all stage plots."
- [S3] guest — the delete question says "will be removed from this device" for a stage plot that was never on the device — ProjectLibrary.tsx:170 — FIX: for a session-only row: "will be removed. This cannot be undone."

## 8. Accessibility of meaning (from the code)

- Roles, labels, selected states: every Pressable in the lab's own files has a role and a label that says what it does; chosen chips, rows, tabs and ticks set `selected` or `checked`; MORE DETAILS sets `expanded`; disabled buttons say why. Sound.
- Every drag has another way: move (four position buttons and typed numbers, stage/StageInspector.tsx:97-105), turn (stage/StageInspector.tsx:120-123 and the TURN lane's buttons), size of a platform (typed, stage/StageInspector.tsx:133-134), order of inputs (▲ ▼, inputs/InputRow.tsx:73-92).
- [S3] zoom and pan — ZOOM has FIT STAGE and CENTER ON OBJECT only; any other zoom needs the fader drag, and sliding a zoomed picture needs a drag (choosing an object in the list re-centers it, StageArea.tsx:87-91) — StageArea.tsx:152-155 — FIX: add two nudges, "ZOOM OUT" and "ZOOM IN" (0.5 a press).
- Color alone: none found. The tab mark is "?" or "!" with a number; the save state is words; a channel number sits in a square box and a mix code in a round one; "OFF STAGE", "STEREO PAIR", "MONITOR ONLY" are words; the selection is a dashed ring with corner marks; a chosen chip shows ✓.
- [S3] glyphs read aloud — "‹ BACK TO THE PACKAGES" has no screen-reader label (inputs/AddSheets.tsx:90, 155) → `a11yLabel="Back to the packages. Nothing is added."`; the "◆" of the monitor-only label is read as a symbol (monitors/bits.tsx:49-54) → put `accessible accessibilityLabel={text}` on the View.
- Text that could be cut with "…": no `numberOfLines` in the lab's own files; the three cases are in section 3 (two placeholders, the header subtitle).

---

## Appendix A. The specification, line by line

met = found in the code; partly = see the note; not = missing. "Not run" items were read, not executed.

| § | Requirement | Status | Where, or what is missing |
|---|---|---|---|
| 2 | Five areas, not a forced sequence | met | StagePlotLabScreen.tsx:166-192 |
| 2 | Blank stage or an editable example; assumptions visible | met | spTemplates.ts:36-43; ProjectLibrary.tsx:199; SetupArea.tsx:183-187 |
| 2 | An instrument never commits the band to a microphone package | met | stage/StagePalette.tsx:256-284; stage/stageLinks.ts:346-378 |
| 2 | Band name, project title | met | SetupArea.tsx:181-182 |
| 2 | Venue, date, load-in, soundcheck, performance | met | SetupArea.tsx:194-200 |
| 2 | Contact name, role, email, phone; the user chooses what prints | met | SetupArea.tsx:204-210; spPacket.ts:140-148 |
| 2 | Revision, last modified, status Draft / Ready to advance | met | SetupArea.tsx:213-245 |
| 2 | Stage width, depth, feet or meters, Confirmed / Estimated | met | SetupArea.tsx:248-255 |
| 2 | General notes, access and setup notes | met | SetupArea.tsx:313-322 |
| 2 | Reusable master and "Duplicate for gig"; the copy never changes the master | met | ProjectLibrary.tsx:133-157, 261, 281; spModel.ts:887-957 |
| 2 | Autosave | partly | spContext.tsx:63, 151-167. A field is saved only after it is left (section 1) |
| 2 | Existing account synchronization, if available | not | spStore.ts:30-31, marked deferred [MD:D60]: on this device only |
| 2 | Restore after a restart | met, not run | spStore.ts:186-197; every load through spMigrate (spStore.ts:69-98) |
| 2 | Rename, duplicate, delete with safeguards | met | ProjectLibrary.tsx:110-131, 133-157, 159-176 (delete asks first) |
| 2 | Stage: place objects; select one to edit details and links | met | StageArea.tsx; stage/StageInspector.tsx:141-204 |
| 2 | Input and monitor tables can locate their stage objects | met | inputs/InputEditor.tsx:186; inputs/SourceEditor.tsx:152; MonitorsArea.tsx:122 |
| 2 | Inputs: capture, equipment, order; venue patch apart from the band's order | met | inputs/InputEditor.tsx; inputs/OrderPanel.tsx; InputEditor.tsx:289-298 |
| 2 | Monitors: mixes, devices, mono or stereo, house mix apart from band mix | met | MonitorsArea.tsx:294-342; monitors/monitorPlan.ts:204-218 |
| 2 | Export: preview, requirements summary, list of what is missing | met | ExportArea.tsx:348-374, 439-450 |
| 3 | Audience at the bottom; Upstage top; stage right on the viewer's left; fixed | met | stage/StagePlanView.tsx:404-421; no flip anywhere |
| 3 | L and R never inferred from the drawing | met | said at InputsArea.tsx:221, inputs/InputEditor.tsx:196 |
| 3 | A note for the viewpoint of overhead labels | met | SetupArea.tsx:316-322; StageArea.tsx:288; spPacket.ts:455 |
| 3 | Add | met | stage/StagePalette.tsx |
| 3 | Move | met | stage/StagePlanView.tsx:274-279; spModel.ts:782-800 |
| 3 | Rotate | met | StageArea.tsx:157-178; stage/StageInspector.tsx:118-124 |
| 3 | Duplicate | met | stage/StageInspector.tsx:244-256 (the copy is only a drawing) |
| 3 | Label | partly | stage/StageInspector.tsx:88; an empty name still prints in the packet (section 1) |
| 3 | Resize when appropriate | met | stage/StagePlanView.tsx:233-239; stage/StageInspector.tsx:127-138 |
| 3 | Group | met | stage/StageInspector.tsx:207-235 |
| 3 | Delete | met | stage/StageInspector.tsx:257-265 (no question; UNDO) |
| 3 | Pan | met | stage/StagePlanView.tsx:251-254, 284-285 (drag only) |
| 3 | Zoom | met | StageArea.tsx:143-156 (a fader; no pinch) |
| 3 | Fit stage | met | StageArea.tsx:153, 224 |
| 3 | Undo, redo | met | StagePlotLabScreen.tsx:158-163; StageArea.tsx:225-226 |
| 3 | Optional grid, optional snap | met | StageArea.tsx:219-220 |
| 3 | Inspector with large targets and editable position values | met | stage/StageInspector.tsx:97-105 |
| 3 | List alternative to dragging | met | stage/StageObjectList.tsx; StageArea.tsx:279-285 |
| 3 | Rectangular stage; risers with dimensions and a height note | met | spCatalog.ts:165; stage/StageInspector.tsx:133-136 |
| 3 | Performer names, channel badges, mix labels | met | stage/StagePlanView.tsx:189-199, 369-394 |
| 3 | Annotation for power drops and stage box positions | met | spCatalog.ts:161-162; note at stage/StageInspector.tsx:238-240 |
| 3 | "Not to scale" when there are no dimensions; artwork is not a footprint | met | StageArea.tsx:135, 289-293; spPacket.ts:440, 447-451 |
| 3 | Palette kinds, and a generic labeled object | met | spCatalog.ts:139-167 |
| 3 | Visual only / reference an input / offer a package; a DI icon adds no input | met | stage/StagePalette.tsx:204-284 |
| 3 | Cable paths optional and schematic | not built | no cable paths; nothing wrong is drawn |
| 4 | Several sources for a performer; several capture paths for an instrument | met | spTypes.ts:59-109 |
| 4 | The named packages; rows shown before adding; any row removable | met | spCatalog.ts:201-364; inputs/AddSheets.tsx:80-158 |
| 4 | "No sound system connection needed" | met | inputs/AddSheets.tsx:207-234; inputs/SourceEditor.tsx:104-134 |
| 4 | Field: Proposed channel | met | inputs/InputEditor.tsx:155-166 |
| 4 | Field: Source label | met | inputs/InputEditor.tsx:154 |
| 4 | Field: Performer | met | on the source: inputs/SourceEditor.tsx:96-102 |
| 4 | Field: Stage location, derived, with a note | met | inputs/InputEditor.tsx:182-185, 299-306 |
| 4 | Field: Capture method (five values) | met | inputs/InputEditor.tsx:167 |
| 4 | Field: Equipment choice and alternatives | met | inputs/InputEditor.tsx:168-174, 237 |
| 4 | Field: Priority | met | inputs/InputEditor.tsx:236 |
| 4 | Field: Connector, signal level, adapter note | met | inputs/InputEditor.tsx:251-255 |
| 4 | Field: Stand or mount (six values) | met | inputs/InputEditor.tsx:175-176 |
| 4 | Field: Phantom (four values), tied to the device | met | inputs/InputEditor.tsx:260-266 |
| 4 | Field: Supplied by; stands and DIs may differ | met | inputs/InputEditor.tsx:177, 256-258; inputs/DiPanel.tsx:93 |
| 4 | Field: Destination, with the split | met | inputs/InputEditor.tsx:267-282 |
| 4 | Field: Audience routing | met | inputs/InputEditor.tsx:178 |
| 4 | Field: Notes | met | inputs/InputEditor.tsx:307 |
| 4 | Simple first; the rest under More details | met | inputs/InputEditor.tsx:235-308 |
| 4 | Usual-order preset, said to be a convenience | met | inputs/OrderPanel.tsx:55-56; spModel.ts:586-610 |
| 4 | Stable ids; a number is a label | met | spTypes.ts:126-138 |
| 4 | Renumber all; keep reserved channels | met | inputs/OrderPanel.tsx:59-76 |
| 4 | Stereo rows paired, L and R; moving or deleting one side defined | met | spModel.ts:427-479, 554-581; inputs/InputEditor.tsx:190-233, 317 |
| 4 | Source identity apart from the venue's channel or socket | met | inputs/InputEditor.tsx:289-298; spModel.ts:544-550 |
| 4 | No silent renumbering after the document was advanced; revision apparent | partly | asked in OrderPanel.tsx:34-42; not asked for the review answer (section 2); revision not in the header (section 2) |
| 4 | Duplicates inside one patch; the same number in two patches is fine | met | spReview.ts:86-97 |
| 4 | Rows not yet positioned are allowed and flagged | met | spReview.ts:111-113 |
| 4 | A model is a preference unless Required; no phantom inferred; no gain or EQ | met | spModel.ts:308-332; no such field exists. The example data is the one exception (section 3) |
| 5 | Mix count, device count and audio channels shown apart | met | MonitorsArea.tsx:250-286 |
| 5 | Mix ID and name | met | monitors/MixSheets.tsx:186-187 |
| 5 | Performer or group | met | monitors/MixSheets.tsx:57-81 |
| 5 | Mono or stereo | met | monitors/MixSheets.tsx:196 |
| 5 | Provider (four values) | met | monitors/MixSheets.tsx:197 |
| 5 | Delivery (six values) | met | monitors/MixSheets.tsx:200 |
| 5 | Linked devices, their positions or users | met | monitors/MixSheets.tsx:202-213; monitors/DeviceSheets.tsx:92, 95-99 |
| 5 | Requested outputs or sockets, apart from mix IDs | met | monitors/MixSheets.tsx:223-229 |
| 5 | Equipment supplier and unresolved details | met | monitors/DeviceSheets.tsx:93; spDerive.ts:280 |
| 5 | Source priorities and special requirements | met | monitors/NeedsPanel.tsx; monitors/MixSheets.tsx:230-248 |
| 5 | Several wedges or packs on one mix | met | monitors/monitorPlan.ts:253-260 |
| 5 | Self-contained rig: what the venue provides; not counted against the house | met | monitors/MixSheets.tsx:117, 198; monitors/monitorPlan.ts:139-189 |
| 5 | A personal mixer system is not one house output for each musician | met | monitors/monitorPlan.ts:165 |
| 5 | Simple instructions; four-word grid; advance preferences | met | spCatalog.ts:124; monitors/NeedsPanel.tsx; monitors/monitorPlan.ts:76 |
| 5 | Click, cue, talkback monitor only by default, labeled; exclusions in the export | met | spModel.ts:343-349, 419-424; spPacket.ts:524, 746-752 |
| 5 | Wireless: model, supplier, quantities, "Coordination required"; no frequencies | met | monitors/DeviceSheets.tsx:102-104; monitors/monitorPlan.ts:411-417 |
| 6 | Channels by destination and category | met | inputs/inputsLogic.ts:481-514 |
| 6 | Microphones by model or category; required marked | met | inputs/inputsLogic.ts:516-520; spPacket.ts:605-616 |
| 6 | Stands and mounts | met | inputs/inputsLogic.ts:536-540 |
| 6 | DI channels and DI devices apart; "arrangement to confirm" | met | spDerive.ts:134-152 |
| 6 | Mono and stereo mixes by provider; feed channels; outputs only where known | met | monitors/monitorPlan.ts:139-162 |
| 6 | Wedges, transmitters, packs, headphone amplifiers counted apart | met | monitors/monitorPlan.ts:113-131 |
| 6 | Stage box, split, riser, backline, power notes | met | inputs/SummaryPanel.tsx:77-133 |
| 6 | Band, Venue, To be confirmed apart | met | inputs/inputsLogic.ts:559-597; spPacket.ts:597-637 |
| 6 | No double counting; substitutes not added; duplicates keep their own ids | met | spDerive.ts:102-118; inputs/inputsLogic.ts:581-584 |
| 6 | Band split: provider, legs, connection, who handles phantom | partly | one free-text note with a hint (inputs/inputsLogic.ts:52) and a note on each input (InputEditor.tsx:274-282); no separate fields |
| 6 | Power: locations and notes; no capacity inferred | met | inputs/SummaryPanel.tsx:120 |
| 7 | Plot page with band, venue, date, directions, names, references, legend, contact, revision | met | spPacket.ts:651-691, 442-455 |
| 7 | Input list page | met | spPacket.ts:503-534 |
| 7 | Monitor plan, equipment, notes, unresolved | met | spPacket.ts:730-781 |
| 7 | Compact single-page option | partly | "Compact packet" removes the forced page breaks (spPacket.ts:795); one page is not made or promised |
| 7 | US Letter and A4 | met, pages not inspected | ExportArea.tsx:73-76 |
| 7 | A structured text view | met | spPacket.ts:837-853; ExportArea.tsx:440-449 |
| 7 | One immutable snapshot; an edit during export goes to the next revision | met | spPacket.ts:94-112; ExportArea.tsx:162-195 |
| 7 | "Save the latest edit before capturing that snapshot" | met in effect | the snapshot is taken from the editor's present state (ExportArea.tsx:163); the save follows within 450 ms |
| 7 | Full packet; stage plot only | met | ExportArea.tsx:68-72 |
| 7 | Share PDF; Print; Copy technical summary | met, not run | ExportArea.tsx:224-292; spExport.ts |
| 7 | Email PDF | known | agreed first release: share menu and a copied message |
| 7 | File name; no date part when there is no date | met | spPacket.ts:134-137 |
| 7 | The user chooses contact information before exporting | partly | chosen in Setup; Export does not show it (section 3) |
| 7 | Editable suggested message | met until the user leaves the tab | ExportArea.tsx:421-423 (section 2) |
| 7 | Never "sent"; the PDF stays available if sharing is canceled | partly | words are careful (ExportArea.tsx:85, 218); the kept PDF is lost on a tab change (section 2) |
| 7 | Web: download, print view, "attach it yourself"; no mailto | met, not run | ExportArea.tsx:389-394; export/WebPrintView.tsx |
| 8 | Duplicate channel in one patch: must be corrected before Ready; a marked draft allowed | met | spReview.ts:86-97, 184; SetupArea.tsx:119-129; spPacket.ts:172-174 |
| 8 | Source without a stage location: Locate, or mark off the stage | met | spReview.ts:111-113; spIssueActions.ts:104-106 |
| 8 | Visual instrument without an input: ask before treating it as missing | met | spReview.ts:160-162 |
| 8 | Stereo pair missing one side: restore or make mono | met | spReview.ts:117-120 |
| 8 | Monitor device without a mix: assign or mark self-contained | met | spReview.ts:135-138 |
| 8 | Performer without a monitor: ask if it is intended | met | spReview.ts:143-149 (the answer adds a mix only, section 2) |
| 8 | Click or cue to the audience: explicit review; deliberate exceptions | partly | flagged (spReview.ts:123-126); the exception cannot be recorded (section 1) |
| 8 | Unknown detail: keep "To be confirmed" and print it | met | spDerive.ts:258-281; spPacket.ts:774-777 |
| 8 | Object outside the stage: flag; allow on purpose, with a note | met | spReview.ts:157-159; stage/StageInspector.tsx:107-112, 238-240 |
| 8 | Capacity exceeded, only when a capacity was entered | partly | DI devices only (spReview.ts:129-132); no capacity can be entered for a stage box, a split or the venue's channels |
| 8 | Broken references or failed export: no complete export; explain recovery | met | spReview.ts:71-82, 188; ExportArea.tsx:82-83, 164-174 |
| 8 | "Link each issue back to the editable item" | partly | not for the "to be confirmed" items (section 1) |
| 8 | Never "production ready"; venue confirmation is separate | met | SetupArea.tsx:228, 238-245; spPacket.ts:779 |
| 9 | Explanations: stage directions | met | SetupArea.tsx:261-264; StageArea.tsx:294-297 |
| 9 | Explanations: an input and an instrument | met | InputsArea.tsx:215-218 |
| 9 | Explanations: microphones and DIs | met, late | inputs/DiPanel.tsx:42-45 (section 4) |
| 9 | Explanations: mono and stereo | met | InputsArea.tsx:219-222 |
| 9 | Explanations: mixes and devices | met | MonitorsArea.tsx:81-85, 285 |
| 9 | Explanations: band supplied and venue supplied | met | inputs/SummaryPanel.tsx:40-43 |
| 9 | Glossary links | known | not wired |
| 9 | One editable example band | met | five examples |
| 9 | Optional guided task; a real gig can skip it | met | GuidedTask.tsx; spReview.ts:211-224 (two flaws: sections 1 and 3) |
| 12.1 | The worked example and its totals | met | test/stagePlotModel.test.ts:68-158, run |
| 12.2 | Move a performer: plot, source location and export agree | partly | moving the figure does not move the source location (section 2) |
| 12.3 | Reorder and renumber: every link stays on its source | met | test/stagePlotModel.test.ts:294-325, run |
| 12.4 | Second patch: same numbers accepted; duplicates in one patch flagged | met | test/stagePlotModel.test.ts:327, run |
| 12.5 | Duplicate for a venue, edit, restart | met, restart not run | test/stagePlotModel.test.ts:443-489 |
| 12.6 | Stereo source, shared mono feed, self-contained IEM rig | met | test/stagePlotModel.test.ts:191, 356-441 |
| 12.7 | Delete or duplicate a grouped performer | met | test/stagePlotModel.test.ts:245-290 |
| 12.8-12.10 | Pages, paper sizes, platform paths | not checked | not this review |
| 12.11 | Keyboard and screen reader access, large text, visible focus | read only | section 8 |

## Appendix B. The first ten minutes, tap by tap

Taps are counted without typing, scrolling or drags. "Words" are words the screen uses there and has not explained by then.

1. START FROM THE FOUR-PIECE EXAMPLE — library: scroll to "Four-piece band", START. 1 tap (a guest also meets the "You’re not signed in" popup: 1 more). The stage plot is saved at once and opens in Setup. Words: DI, click, wedges, in-ear, house console (all in the example's sentence); MASTER (explained under the list).
2. RENAME A PERFORMER — scroll past six blocks to PERFORMERS (about five screens); tap the row; tap Name; type; leave the field. 3 taps. The figure on the stage follows. "M3 Maya, in-ear" and "Maya’s pack" keep the old name. Words: sources, inputs, monitors (the section hint).
3. MOVE THE BASS PLAYER — STAGE tab; drag Leo. 1 tap, 1 drag. His amplifier, his microphone and his wedge stay where they were: 3 more drags, or OBJECT → GROUP IT WITH OTHER OBJECTS → three switches (two objects in the list are both called "Vocal") → GROUP THESE 4 OBJECTS, 7 taps, then 1 drag. The input list still says where the amplifier is. Words: TURN, VIEW, snap, grid step, palette.
4. ADD A SECOND GUITAR WITH ITS AMPLIFIER MICROPHONE — ADD → PERFORMER → Name, type → ADD THIS PERFORMER → GUITAR AMPLIFIER → GUITAR CABINET MICROPHONE › → the performer's chip → ADD THE SYMBOL AND 1 INPUT. 8 taps, then 2 drags. Result: a second source "Guitar", a second input "Guitar cabinet" at channel 15 (after Click), a second "Guitar amp". Three new details to be confirmed, and the line that names them cannot say which "Guitar cabinet". The other route (INPUTS → ADD A SOURCE → A ready-made package → Guitar cabinet microphone → performer → ADD 1 INPUT, 6 taps) names them "Guitar (Name)" and "Guitar cabinet (Name)" and puts no amplifier on the stage. Words: package, source, symbol, boom.
5. GIVE THAT GUITARIST A WEDGE ON A NEW MIX — MONITORS tab → Add a mix → the performer's chip → House console → Add this mix. 5 taps; "Wedge 3" comes with it. "Who supplies it" is To be confirmed: Edit device → Venue → Done, 3 more. The wedge is not on the stage and nothing asks: Go to Stage → PLACE IT ON THE STAGE, 2 more, and 1 drag. The other door, the answer "ADD A MONITOR MIX" under "… has no monitor", adds the mix with no wedge and with "Who creates this mix" still open. Words: wedge, delivered, House console, Band monitor console, Personal mixer system, Wired in-ear, Drum fill, Sidefill.
6. ANSWER THE REVIEW QUESTIONS — EXPORT tab, scroll to REVIEW. On this path every card is "○ TO BE CONFIRMED" (three from the example, three or more from steps 4 and 5). Each has one button, GO TO ›, which opens Inputs at the top with nothing open. For "Keys L: phantom power": GO TO › → find row 9 and tap it → scroll → MORE DETAILS → a choice among Required, Not required, Do not apply, Unknown → close → EXPORT tab. 6 taps for one item, and the user must already know what phantom power is. The card says "To be confirmed"; the choice that means the same is called "Unknown".
7. REACH A PACKET — in Export, scroll past WHAT TO MAKE, REQUIREMENTS SUMMARY and REVIEW to PRINT, SHARE AND SAVE; Share PDF (phone) or Download PDF (browser). 1 tap. The preview is under the buttons and the EMAIL block. The packet is stamped DRAFT; to change that: SETUP tab → scroll to THE DOCUMENT → Ready to advance → EXPORT tab, 3 taps.

Total on the shortest path: about 30 taps, 5 drags and one long scroll, before any "to be confirmed" item is answered; about 6 taps for each of those.

Where work can be lost on this path: text in a field that was not left (section 1); the edited message, the kept PDF and the paper choice when the tab changes (section 2); a refused save when the user leaves (section 2). Sound: switching tabs with a field still open commits it (spForm.tsx:77-83); closing a popup commits its fields; going back to the library saves first (spContext.tsx:194-200); a guest's stage plots stay for the app session and the screen says so in three places.

---

## Handoff requirements NOT met

- §8 "link each issue back to the editable item": not for any "to be confirmed" item (GO TO › opens Inputs with nothing selected).
- §8 "Click or private cue intended for the audience mix … permit deliberate exceptions": the exception cannot be recorded; the question stays open for good.
- §2 "use existing account synchronization if available": not used; saved on this device only (marked deferred in spStore.ts:30-31).
- §12 check 2 "Move a performer and confirm plot position, source location, and export agree": the source location follows the instrument's symbol, and no example groups a performer with it.
- §7 "Keep the PDF available if sharing is canceled": only until the user opens another tab.
- §4 "Do not renumber … silently after the document has been advanced. Make the changed revision apparent": the review answer renumbers without asking; the revision is not shown while editing.
- §8 "Declared resource capacity exceeded": a capacity exists for a DI device only.
- §6 band split "provider, destination legs, connection presentation, and who handles phantom power": one free-text note, no fields.
- §7 "compact single page option": the compact packet only removes forced page breaks.
- §7 "Let users choose which contact information appears before exporting": chosen in Setup; not shown or offered in Export.
- §3 "cable paths optional and schematic": none (optional).

## Checked and found sound

- Every edit goes through `apply` with spModel functions; no area stores a count.
- No broken link can be made by an edit (`scrub`); duplication re-points every link.
- A symbol never adds an input; every package shows its rows first; half a stereo pair is never added.
- Mix count, monitor feed audio channels and devices by type are three separate numbers with three sentences; mixes the band creates are never counted against the house.
- "Ready to advance" is refused while something must be corrected, is defined where it is chosen, and is kept apart from "The venue has confirmed this revision".
- Export words never say "sent"; each operation has its own line; nothing here prescribes gain, EQ, polarity or a radio frequency.
- No payment, tier or "free" wording; "not signed in" only for a known guest.
- No British spelling; no "production ready"; no "N of M" progress; nothing told by color alone.
- Every Pressable in the lab's files has a role and a label; every drag has a button or typed alternative except zoom steps and panning.
- The six screen guides describe controls that exist, and their "try this" results match the model (reserved channel 7, wedges 2 to 3, M3 stereo to mono 6 to 5, stereo keys to mono).
- Tests: seven `test/stagePlot*.test.ts` files, 283 pass, 0 fail (run once, read-only).

## Could not check

- Anything on a screen: layout at 390 pt, text that is cut or overlaps, the Rack Unit's badge and bezel readouts with a long name, whether the "place it on the stage" note is in view when the Stage area opens from another area.
- The Rack Unit's own accessibility (fader actions, dock tabs) and the header's guide button: house components outside this lab.
- Whether a first-open guide card adds a tap to the first minute.
- The PDF pages, the HTML print sheet, native print and share, the browser download.
- Restore after a restart, the 24-plot cap on a real device, a refused write, and the guest sign-in carry: read, not run.
- The audio correctness of any explanation, including the glosses proposed in section 4.
- The words of `MEMBERSHIP_NOT_CONFIRMED` (a house constant used when an account is not confirmed).

## Summary

1. The review's "to be confirmed" cards lead nowhere: GO TO › opens Inputs with nothing selected, also for mixes and monitor devices (handoff §8). These are the first cards a new user presses.
2. Work can be lost without a word: typed text is in the project only after the field is left, and Export drops its kept PDF, the edited message and the paper choice when the tab changes.
3. Two things on screen are not true or cannot be closed: an empty object name still prints in the packet, and a click sent to the audience on purpose stays an open question for good (as does a fill mix with nobody on it).
4. Ease of use: names from the example stay in mix and device names after a rename; the Stage route adds a second "Guitar cabinet"; moving a performer moves nothing else; a new wedge is never asked onto the stage; "key" means button in a tool where Keys is an instrument.
5. Not checked: anything on a real screen or phone, the PDF pages, print and share, restore after a restart, and the audio wording of the explanations.
