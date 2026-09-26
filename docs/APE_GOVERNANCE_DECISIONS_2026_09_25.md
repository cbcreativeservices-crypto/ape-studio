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

## D30 · A Computer C image brief is built FROM THE APP, one photo per finding

**Owner:** *"your image prompt for comp c is 100% inaccurate and incomplete. it design is
nothing like the app needs. make a much more clear and with example handoff for comp c."*
Then: *"deliver the entire comp c package as a zip to downloads. do not make me compile."*

**Ruled:**
- The brief starts from the card the photo lands on: a real screenshot, the caption the app
  prints, the lesson text the photo sits under, the exact slot and size. A prompt list
  without that is not a brief.
- Final Inspection photographs are ONE PER FINDING, matching the finding label and zone (the
  cable named, the place named, the fault named). Only the fifteen findings have a slot; the
  rack issues and the ceiling walk are drawings only.
- Stage 5 sort photographs show the SAME object the pictogram shows: in use for approved
  hardware, bare for the never-items. Object shots stay on white (D 2026-09-21).
- 1200 × 896 exactly; anything else is cropped by the frame.
- The handoff is ONE zip in Downloads with every prompt written out; the reader assembles
  nothing. `docs/art/APE_LAB_PHOTO_BRIEF_v2_2026_09_25.md` is the record; the 09-25 prompt
  package is SUPERSEDED.

## D31 · The glossary weekly meter counts per DEVICE as well as per identity

**Owner:** *"i exceeded the weekly glossary limit and it locked - good. but then i logged in on
a free guest account and it was completely unlocked fresh again"* → *"go - fix the glossary
limit per device"*.

**Ruled:** the fourteen-a-week free allowance belongs to the phone as much as to the sign-in.
The server keeps a row per install id beside the row per identity; a lookup needs room in
both. Guest → free account, free → guest and a re-minted guest key on the same phone share
one fourteen. A second phone is its own fourteen (the accepted floor). Migration
`2026092502_glossary_meter_per_device.sql`, applied live 2026-09-25.

## D32 · Lab display text is never under 9 pt on a phone; drawings get FULL SCREEN

**Owner:** *"the new lab has several screens with text too small to read… these displays may
need to be enlarged so the user can see them and make use of them"* → *"do both - 9 pt minimum"*.

**Ruled:** every word drawn on a lab's display renders at 9 pt or more on a 375- and 390-wide
phone (authored size × the scale the drawing is drawn at — measured, not estimated). Drawing
displays also get a FULL SCREEN view (zoom steps, pan, any orientation, still interactive).
Short phones are covered by full screen. Shipped for Sound Systems (`987cf20e`, `54e48aee`);
eleven more labs are briefed in `docs/LAB_FULLSCREEN_AND_9PT_HANDOFF_2026_09_25.md`.

## D33 · There are only codes — no discount codes; people type the dashes

**Owner:** *"be sure to state they need to include the dashes"* → *"there are no discount codes.
just codes. do not mention from event, sponsor, academy"* → *"remove it from the app and leave A a
note"*.

**Ruled:** code entry says to type the code exactly as given, dashes included, and nothing else
(no discount wording, no list of where codes come from). The client has no discount message; A
is asked to drop the `discount` kind server-side (CROSS_SESSION_HANDOFF, 2026-09-25 night).

## D34 · One working session: the 2026-09-25 ccode chat is RETIRED

**Owner (2026-09-25, 23:48 PDT):** *"commit this to the gov docs - i am going to work now only in
the new session - this session is now retired"*.

**Ruled:** the ccode session that ran 2026-09-25 (Sound Systems FULL SCREEN + 9 pt, codes copy,
flashcard fixes, TestFlight review, the lab-legibility and 25D handoffs) is retired. The NEW
session — the one already working the lab-legibility brief
(`docs/LAB_FULLSCREEN_AND_9PT_HANDOFF_2026_09_25.md`; its first commit `f3be3797` "Rack: FULL
SCREEN shared by every lab") — is the only session that works this repo from now on. It owns the
working tree, pushes, publishing (on the owner's word only) and `docs/CROSS_SESSION_HANDOFF.md`.

**State the retired session left** (read `docs/SESSION_HANDOFF_2026-09-25D.md` §9 for detail):
- Last publish **23:40 PDT**, both channels, from a CLEAN WORKTREE at `6de27879` (the new session's
  half-finished file move was deliberately kept out): iOS `01a0dc73-5eee-74f2-be41-9c8d935f9b92`,
  Android `01a0dc73-5eee-747a-a279-9af555342082` (Pixel on it; preview `01a0dc76-…`). It carries
  `ddf3118d` — the flashcard definition now scrolls on iPhone (the tap moved inside the scroller).
- This D34 commit is **local, NOT pushed**: pushing it would also push the new session's
  unpushed `f3be3797`. The new session pushes both when it is ready.
- The new session's uncommitted edit to `docs/CROSS_SESSION_HANDOFF.md` was left untouched.
