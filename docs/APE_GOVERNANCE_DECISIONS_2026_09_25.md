# AP&E — governance decisions, 2026-09-25

Continues `APE_GOVERNANCE_DECISIONS_2026_09_19.md` (D10–D22). Numbering carries
on at D23. Engineering lessons from the same day live in
`APE_ENGINEERING_LESSONS.md`; this file is what was DECIDED, not what was
learned.

---

## D23 · Lab photographs sit ALONGSIDE the drawings, never instead of them

**Owner:** *"alongside, 2-06 is power, go"* — then *"add the reveal cards for
groups 1 and 5."*

The vector drawing carries the layer labels and the tap zones; the photograph
is the real thing the technician will meet on the bench or above the ceiling.
Neither replaces the other.

**Ruled:**
- Cable Install Stage 2 and Connector Select Stations 1 and 4: the photograph
  sits with the drawing (22 shipped, `assets/lab-art/`, `kit/LabPhoto`).
- Stage 5 THE SORT: the photograph is a **reveal** — it lands with the verdict,
  after the learner has answered. The pictogram asks the question.
- Final Inspection: opening a numbered finding reveals the defect **as found**,
  and it stays up through CLASSIFY and CORRECT so the learner judges the
  picture, not the label.
- `assets/exports/group-2-06 "ac-mains portable cord"` is the `power` type.
- Image prompts must state the KEY ELEMENT and the CONTEXT, not just the object
  (owner: *"the prompts lacked context and description so the image generator
  struggles to be accurate"*). The package is
  `docs/art/APE_LAB_PHOTO_PROMPTS_2026_09_25.md`.
- Handoffs to Computer C are ONE self-contained archive with the brief, the
  approved references and the rejected drafts (owner: *"i dont want to hunt and
  collect"*).

## D24 · Every lab page with a live display follows the Rack Unit

**Owner:** *"it does not follow the other labs standard 'Rack' system layout
where controls are on the bottom, the display above, data in between that
scrolls. many screens need adjustment."*

The Rack Unit (`APE_LAB_UX_PROPOSAL_2026_08_23.md`, `src/screens/lab/rack/`)
is not one lab's style; it is the standard: STAGE pinned above, WELL the only
scroller between, DOCK with the controls at the bottom. *Reading may scroll;
operating may not.*

**Ruled:** any lab page that has a live display and controls that change it
uses the Rack Unit, including every new lab from its first draft. Document
layout is for prose and static-diagram pages only. The Sound Systems Lab was
built as document pages and is being brought into line (background design
pass, report `APE_SOUND_SYSTEMS_RACK_PASS_2026_09_25.md`).

## D25 · The topic split is PARKED

**Owner:** *"park this - comp a has delivered incomplete changes - until it
sorts things out - we are wasting our time trying to do what its asking. Pause
this then."*

**Ruled:** no client work on the split (topicCopy / topicAbout / topicImages /
credential touch-ups) until the owner un-parks it. What was already committed
stands (career families, EXPLORE menus). Computer A's round-2 entry (171
topics) is seen and not acted on. `project_topic_split` memory carries the
detail.

## D26 · Card pages get the 760 card column on tablets

**Owner (iPad):** *"profile still gets narrow squeezed view."*

The 560 reading column is right for a paragraph and wrong for a page of cards
sitting in 230 pt of black either side of a landscape iPad.

**Ruled:** prose keeps `readingColumn` (560); card/row pages use `cardColumn`
(`CARD_MAX_W = 760`, `src/theme/readingColumn.ts`). The Profile is the first.
Never raise `READING_MAX_W` to fix a card page.

## D27 · Meters share ONE absolute scale (restated, enforced)

**Owner:** *"level is consistent through all and not relative individual to
each meter. (the tops should not always be red.....)"*

**Ruled:** every level drawing keys its colour ramp to the absolute scale
(SVG gradients `userSpaceOnUse` pinned to the scale, never per-bar object
bounds). A bar that never reaches the top is never red at its top. The Sound
Systems chain meter and console bus meters were corrected.

## D28 · Leaked-password protection stays ON; the app explains the rejection

From the 24-hour usage review: most failed sign-ups were breached-password
rejections the app never explained.

**Ruled:** the server check is not loosened. The sign-up form carries a hint
before submit ("choose a password you don't use anywhere else … passwords
found in known data breaches are rejected"), and the rejection message is
shown.

## D29 · "Update the phones" means the owner sees it running on both phones

**Owner:** *"update the phones so i can check it on the ipad."*

**Ruled (restated):** publish to BOTH channels after checking the fingerprints
against both installed runtimes, prove the Pixel is running it (launch 1
downloads, launch 2 "No update available"), confirm what the update server
serves an iPhone, and give the iPad/iPhone relaunch steps. Only the owner's own
words trigger a publish; nothing else does.
