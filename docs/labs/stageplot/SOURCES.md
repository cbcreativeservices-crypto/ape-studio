# Stage Plot and Channel Designer — sources, decisions and known limits

Must-do row D60. Owner GO 2026-11-12 (answers: "Use recommended" to seven questions). Specification: the owner's handoff, `Stage-Plot-and-Channel-Designer-Claude-Code-Handoff.pdf` (16 pages, prepared 2026-11-11).

## 1. What it is

A working tool (not a lesson): a band draws its stage from above, lists what reaches the sound system, plans its monitors, and prints or shares one PDF packet for a venue's sound engineer. Five work areas, in any order: Setup, Stage, Inputs, Monitors, Export.

Not listed in the Labs menu yet. Reachable only in the web preview: `#labpreview/StagePlotLab`.

## 2. Where the code is

| Part | Path |
|---|---|
| The one project model, every edit, totals, review rules, example bands, print symbols, packet, PDF writer, saving | `src/features/stageplot/` |
| Screens | `src/screens/lab/stageplot/` |
| Tests | `test/stagePlot*.test.ts` |
| Review reports (round 1) | `docs/labs/stageplot/reviews/` |

## 3. Decisions (owner's answers and the lead's)

| Decision | Source |
|---|---|
| Labs menu under Live Sound Reinforcement; members only; a guest can try it and nothing is saved | Owner, question 1 |
| A tool with an optional guided task; the guided task earns the lab's credit; a certificate requirement is decided at listing | Owner, question 2 |
| No mail composer now (it needs a package the app lacks = a store build). Share PDF opens the share sheet; the suggested message is copied | Owner, question 3 |
| On screen: the app's existing top-view art. In print: black-line symbols drawn in code. No image file touched | Owner, question 4 |
| Example bands: solo, duo, four-piece (the handoff's worked example), band with playback, salsa band | Owner, question 5 |
| Feet first, meters optional; US Letter first, A4 optional | Owner, question 6 |
| One independent review round, one fix round, gate, commit, push, handoff; not listed, nothing published | Owner, question 7 |
| Saved on the device only (no account sync: no server table exists for it) | Lead; the handoff says "use existing account synchronization if available" |
| A PDF writer of our own (`spPdf.ts`), no new package | Lead: the app had no way to make a PDF file in a browser, and the handoff requires a web download |
| Phones make the SAME PDF with that writer (file → share sheet; print from the file) | Lead, after review: the phone's page-to-PDF converter is not expected to print page footers or repeat table headers on iPhone. NOT verified on a phone |
| When a stage has no dimensions the drawing assumes a stage size by band size (7.2 × 4.5 m up to five performers, 9.2 × 5.75 m up to eight, 11.2 × 7 m for more), and always prints "Not to scale" | Lead: a twelve-piece band was drawn as people standing on each other |

## 4. Rules the model keeps (whichever screen edits)

- One input = one physical audio channel at a mixer. A stereo source is two inputs, paired.
- An icon never adds an input. A DI icon that illustrates an existing path points at that path.
- A mix is not a device. Distinct mixes, monitor feed audio channels and equipment counts are three separate numbers. What the house console is asked to create is counted apart from what the band creates in its own rig.
- "To be confirmed" is a value: kept, printed, never guessed. Nothing infers phantom power, a DI's type or a supplier.
- A click or cue is monitor only and excluded from every mix until someone asks for it. Sending it to the audience is a question the band can answer once; a change of routing asks again.
- One answer to "who supplies it": a DI channel on a DI device is supplied by whoever supplies the device.
- The venue is not asked about its own equipment in the unresolved list.
- No broken links: removing something detaches what pointed at it, in the open. A mix others share is never erased with one performer.
- A shared revision is frozen: the first edit after an export, or after "Ready to advance", moves the revision on and returns to Draft.
- A gig copy has new ids everywhere and never changes its master.
- Positions are fractions of the stage, never pixels. Stage right is the viewer's left.

## 5. What the tool deliberately does not do (handoff §13)

No console control. No radio frequency coordination (it records "coordination required" only). No electrical design: a power drop is a requested location, never a statement about a circuit. No gain, EQ, phantom switching or polarity settings for the venue. It never calls a gig "production ready": **Ready to advance** means the band's document is prepared for discussion, and "venue confirmed" is a separate mark the user sets.

## 6. Simplifications a user should know (and where the tool says so)

| Simplification | Told |
|---|---|
| Symbols are drawings of a kind of thing, not the footprint of anybody's equipment | On the Stage (badge under the picture) and in the packet's legend |
| A plot with no dimensions is not to scale | "NOT TO SCALE" on the Stage and on the plot page |
| The conventional channel order is a convenience, not a house standard | Inputs (CHANNEL ORDER) and above the printed input list |
| Mix needs (Primary, Supporting, Not needed, Must exclude) are advance preferences, not fader values | Monitors, on the needs panel |
| The packet is not a tagged or standards-compliant accessible PDF; the "Text only" view is the accessible form | Export |

## 7. Open proofs (nothing here has been checked on a phone)

| Item | State |
|---|---|
| Dragging on the stage with a finger; FULL SCREEN drags | NOT CHECKED on a phone (mouse only, in the web preview) |
| Print on a phone | NOT CHECKED |
| Share sheet on a phone, and Mail attaching the PDF | NOT CHECKED |
| The PDF opened in Acrobat, Apple Preview or a browser's viewer; printed on paper (Letter and A4, grayscale) | NOT CHECKED (opened cleanly by two PDF libraries; pages read as images) |
| Restore after an app restart for a member | NOT CHECKED on a device (tested against the store's logic) |
| Screen reader, keyboard, Larger Text | NOT CHECKED on a device (roles, labels and states are set in code) |

## 8. Review round 1 (2026-11-12)

Three independent reviewers: live sound (accuracy; the printed packet read page by page), usability and plain language (the specification line by line; the first ten minutes tap by tap), visual and function (in the browser at phone size). Reports in `reviews/`. One fix round followed. What it changed is listed in the handoff in Downloads (`2026-11-12_STAGE_PLOT_LAB_HANDOFF`).
