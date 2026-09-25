# Sound Systems Lab — Rack Unit layout pass (2026-09-25)

Owner (2026-09-25, verbatim): *"adjust the new sound systems lab - it does not follow the other
labs standard 'Rack' system layout where controls are on the bottom, the display above, data in
between that scrolls. many screens need adjustment."*

Done. Every page of the five modes that has a live display and controls that change it is now a
Rack Unit page — the display pinned on the glass at the top, its readouts on the bezel, the honesty
badge silk-screened under it, the reading in the one scroll well between, and the controls in the
dock at the bottom with the shared lane pre-bound to the page's teaching parameter. Pages that are
reading or a set of checks keep the paged document layout, the way the Cymatics host keeps its
prose-only modules. Nothing in the engine changed; nothing was published, built or submitted.

Result: **43 rack pages, 9 document pages** across the 52 pages of the lab (plus the appended
understanding check, which the host still appends exactly as before).

## What changed (files)

| File | Change |
|---|---|
| `src/screens/lab/rack/RackUnit.tsx` | **The one frame generalisation** (additive, 4 lines): optional `bottomInset?: number`. A host that mounts its own footer under the rack (this lab's paged host) passes 0 so the safe-area is not padded twice and the tray sits on the footer. Every other host leaves it undefined and gets the safe-area inset exactly as before. |
| `src/screens/lab/soundsystems/rackLayout.tsx` | **NEW** — `SoundSystemsRackLayout` (the CymaticsRackLayout pattern: stage / bezel / badge / params / initialParam; well = optional `wellTop` slot + first-move caption OUTSIDE the disclosure, everything else inside LAB NOTES), `StageFit` (fits a width-driven SVG instrument to the glass at its own aspect, sized at mount — never resized under a drag), `StageBox`, `lanePos`/`laneVal`, and `flipFader` (one key that is both a chooser and a slider — the owner's 2026-08-30 rule — for pages whose teaching choice is a collection). |
| `src/screens/lab/soundsystems/SsPagedLab.tsx` | **NEW host** — kit/PagedLab's shell (header, dots + page list, BACK/CONTINUE, the appended understanding check, `ape:<labId>:v1` progress) plus a `rack` branch: a rack page gets the full height and NO ScrollView of its own (the EQ/Cymatics host idiom) and wears the compact `AccuracyNote` on the header. **Why local:** `kit/PagedLab.tsx` is shared by 30-odd labs under an additive-only contract and was outside this pass's scope, so the branch lives here; folding it upstream is a `rack?: boolean` on `PageDef` and one conditional. Storage keys, the check page and the footer are identical, so saved places survive. |
| `src/screens/lab/soundsystems/modeScreens.tsx` | The five mode screens use `SsPagedLab`. |
| `src/screens/lab/soundsystems/gainDock.tsx` | **NEW** — the gain chain's STAGE key (chooser-then-slider over the six adjustable stages, each in its own range with unity as the double-tap home) and its four bezel cells; shared by LEARN 16 and OPERATE 3. |
| `src/screens/lab/soundsystems/consoleDock.tsx` | **NEW** — `dbFader`: a dB fader on the lane with the console engine's OFF floor and a 1 dB snap; shared by ROUTE and OPERATE. |
| `src/screens/lab/soundsystems/art/ChainMeter.tsx` | Split (no redraw): `ChainMeterStage` (equipment, meters, labels, readouts — sized by the glass; the adjusted stage wears an amber underline) + `ChainMeterKey`; `ChainMeter` (the document form with steppers) kept. |
| `src/screens/lab/soundsystems/art/ConsolePanel.tsx` | `BusMeter` exported with a `height`; **`BusBank`** added — the console's meter bridge for the glass: one column per bus, scribble-strip title, tall bus meter, who hears it with a level bar each (the same arithmetic `BusHears` prints). |
| `src/screens/lab/soundsystems/art/diagrams.tsx` | Wiring only: `SplitDiagram` takes `gainDb` (the dock fader's value prints on the diagram instead of a fixed 6); `StageboxStrip` takes `selectedId` (a cyan frame on the line under the LINE fader). |
| `pagesLearnA/B/C.tsx`, `pagesBuild.tsx`, `pagesRoute.tsx`, `pagesOperate.tsx`, `pagesTroubleshoot.tsx` | The conversions. All copy kept verbatim. |

Untouched: `src/features/soundsystems/**` (the accuracy-reviewed engine), `VenueView`, `SystemMap`,
`planArt`, `gearArt`, `motion`, `plot`, `bits`, `units`, the hub, tests, images, config.

## Page inventory — (a) rack / (b) document

### LEARN (22 + check)
| # | Page | Layout | Stage | Lane binds | Dock keys | Bezel |
|---|---|---|---|---|---|---|
| 1 | The complete system | **(a)** | SystemMap (chapter-one map, tap to inspect) · L | STATION — flip-through of the map's stations; riding highlights each and opens its card | STATION ▪, STAGE IN ▸ (snake/stagebox, sticky), HOUSE ▸ (passive/powered, sticky) | STAGE IN · HOUSE · STATION · SEEN |
| 2 | Trace the signal | **(a)** | SystemMap (bench stations) · L | — (discrete: the order is the exercise; a lane would give it away) | NEXT ▸ sticky (shuffled stations; picking lights the map, ✓ on lit, verdict as the blurb), RESET | LIT n/9 · LAST · THREAD |
| 3 | Ten kinds of system | **(a)** | VenueView plan · L | TYPE — flip-through of the 10 types (plan redraws) | TYPE ▪ (sticky chooser) | TYPE · SCALE · BOXES · SEEN |
| 4 | Match the venue | (b) | — eight checks, no live display | | | |
| 5 | Output configurations | **(a)** | VenueView plan · L | CONFIG — flip-through of the 13 configurations | CONFIG ▪ | CONFIG · POSITIONS · FEEDS · SUBS |
| 6 | Choose the configuration | (b) | — six checks | | | |
| 7 | The routing map | (b) | — six open-to-read tools, no display | | | |
| 8 | Subwoofer feeds | **(a)** | SubFeedRouter · M | — (a feed is a discrete switch; nothing continuous to draw) | FEED ▸ sticky, VOCAL → SUB toggle (aux feed only) | FEED · REACHES · CONTROL · VOCAL |
| 9 | Subwoofer placement and arrays | **(a)** | VenueView plan · L | LAYOUT — flip-through of 5 arrangements | LAYOUT ▪ | LAYOUT · SUBS · PATTERN · RIG |
| 10 | Stage monitors | **(a)** | VenueView (performers, tap a monitor) · L | MONITOR — flip-through of the 4 monitors (highlight + card) | MONITOR ▪ | MONITOR · STANDS AT · FED BY · SEEN |
| 11 | Monitor console, splits and talkback | **(a)** | SplitDiagram · M | MON GAIN 0…+12 dB (the monitor engineer's gain move; prints on the diagram; FOH readout answers) | MON GAIN ▪, SPLIT ▸ sticky | SPLIT · MON PREAMP · FOH HEARS · CHECKS |
| 12 | Wiring and connections | (b) | — six may-they-connect cards | | | |
| 13 | Amplifier loads | **(a)** | LoadRig (amp + cabinets) · M | CABINETS 1…4 in parallel (wire goes gold/red) | CABINETS ▪, CABINET ▸ (16/8/4 Ω, sticky), BRIDGED toggle | TOTAL LOAD · AMP MIN · INTO LOAD · VERDICT |
| 14 | Power and headroom | **(a)** | PowerBand (amp glyph → power band → cabinet glyph) · S | AMP 100…1600 W (mark rides the band) | AMP ▪, LISTENER ▸ (2/10/30 m, sticky) | MATCH · CONTINUOUS · PROGRAM · SPL @ d |
| 15 | The deployment sequence | (b) | — sixteen steps to open | | | |
| 16 | Gain structure | **(a)** | ChainMeterStage · L | STAGE — chooser-then-slider: PREAMP on mount, then FADER/MAIN/PROC IN/PROC OUT/AMP, each in its range, unity = home | STAGE ▪ | AT SPEAKER · ABOVE NOISE · HEADROOM · VERDICT |
| 17 | Coverage and aim | **(a)** | VenueView (two mains, field, seam) · L | COVERAGE 60…120° (sectors and floor redraw live) | COVERAGE ▪, AIM ▪ (0…35°), FLOWN toggle, FILLS toggle | COVERAGE · AIM · RIG · FILLS |
| 18 | Delay and alignment | **(a)** | VenueView + timing ring overlay · L (ArrivalTimeline in the well-top) | DELAY 0…300 ms (the ring reaches the towers; the timeline fuses) | DELAY ▪, DISTANCE ▸ sticky, AIR ▸ sticky | NEEDED · SET · ERROR · SOUND |
| 19 | Processing and tuning | (b) | — nine blocks to open | | | |
| 20 | Feedback control | **(a)** | FeedbackLoop · M (gain-before-feedback bar in the well-top) | SEND −30…+10 dB, level lane (the loop rings past the limit) | SEND ▪, WEDGE ▸ sticky (live/null), NOTCH toggle | SEND · LOOP LIMIT · MARGIN · LOOP |
| 21 | The source-forward method | **(a)** | SystemMap (readings appear) · L | WALK 0…6 stations (ride forward one probe at a time; RUN animates it) | WALK ▪, RUN action | START · READ · LAST · FAULT |
| 22 | What you can now do | (b) | — the wrap | | | |
| 23 | Check your understanding | (b) | — appended by the host, unchanged | | | |

### BUILD (11) — all **(a)**
| Page | Stage | Lane binds | Dock keys | Bezel | Well-top |
|---|---|---|---|---|---|
| 1 The empty venue | VenueView, live: tap a highlighted position to place, tap device → device to cable, tap a cable to remove · L | PART — one key that is both the parts list (blurbs = what it is + where it stands) and a lane; riding flips the part in hand and the plot shows where it may stand | PART ▪, REMOVE (only when a device is selected), CLEAR (only when something is placed) | PLACED · CABLES · LIVE · SILENT | in-hand card · last verdict · selected device's card (FED BY / FEEDS / live) |
| 2–11 Capstones 1–10 | same | same, from the capstone's own bin | PART ▪, **CONSOLE ▸** (capstones 6, 7, 8, 10 — the desk, strips, buses and the console requirements in a tray while the plot stays live), REMOVE, CLEAR | PLACED · CABLES · LIVE · REQS n/m (PASS) | the live requirements checklist above the same cards |

### ROUTE (8)
| # | Page | Layout | Stage | Lane binds | Dock keys | Bezel |
|---|---|---|---|---|---|---|
| 1 | Anatomy of a channel | **(a)** | ChannelStrip · L | STATION — flip-through of the 8 blocks in signal order | STATION ▪ | STATION · AUDIO (through / a copy / the path) · SEEN |
| 2 | Pre-fader and post-fader | **(a)** | BusBank: Aux 1 wedge · Aux 5 reverb · Main · M | VOX FADER −60…+10 dB (unity home, level lane) | VOX FADER ▪, WEDGE TAP ▸ (pre/post), FX TAP ▸, CONSOLE ▸ (the channel's desk) | FADER · WEDGE HEARS · REVERB HEARS · MAIN |
| 3 | Subgroup, aux, matrix or DCA? | (b) | — eight checks | | | |
| 4 | Four monitor mixes | **(a)** | BusBank: the four wedges · L | SEND −60…+6 dB for CHANNEL → chosen wedge (the key's chooser picks the wedge) | CHANNEL ▸ sticky, SEND ▪, PRE toggle, CONSOLE ▸ (the whole desk incl. ALL PRE) | CHANNEL · SEND · TAP · WEDGES ≥2 |
| 5 | Subgroups and DCAs | **(a)** | BusBank: Drums subgroup · Main · Aux 4 wedge · L | BAND DCA −60…+10 dB (main drops, the pre-fader wedge does not) | BAND DCA ▪, CONSOLE ▸ (assignments, subgroup and DCA strips) | KICK → MAIN · KICK → WEDGE · BAND DCA · DRUMS GRP |
| 6 | Mute groups, solo and direct outs | **(a)** | BusBank: main mix — who is still live · M | — (a mute group is one button) | BAND MUTE toggle, ALL MICS toggle | BAND MUTE · MAIN HEARS · STILL LIVE · CHECK |
| 7 | Matrix outputs | **(a)** | BusBank: MX 2 fills · MX 3 lobby · MX 4 recording · L | MC → AUX 7 −60…+6 dB (the announce mic's lobby route) | MC → AUX 7 ▪, MATRICES ▸ (crosspoints), CONSOLE ▸ | FILLS TAKE · LOBBY TAKES · REC TAKES · MC → AUX 7 |
| 8 | Output patching | **(a)** | PatchPanel · M | SOCKET — flip-through of the seven outputs (or tap one) | SOCKET ▪, BUS ▸ (pick-and-go patches the socket) | SOCKET · FED FROM · PATCHED |

### OPERATE (5) — all **(a)**
| # | Page | Stage | Lane binds | Dock keys | Bezel |
|---|---|---|---|---|---|
| 1 | Power-up sequence | PowerRack — the five devices light in order · S | — (an order is discrete) | STEP ▸ sticky (shuffled steps; picking appends; the why is the blurb), RESET | STEPS · LAST · ORDER · LIT |
| 2 | Line check | Two StageboxStrips (outputs over inputs), the probed line framed · L | LINE — flip-through of the 14 lines | LINE ▪, PROBE (until probed), MARK OK / MARK FAULT (until marked right) — nothing dead on the dock | LINE · STAGEBOX LED · CH METER · MARKED |
| 3 | Establish gain structure | ChainMeterStage · L | STAGE — as LEARN 16 (PREAMP first) | STAGE ▪ | AT SPEAKER · ABOVE NOISE · HEADROOM · VERDICT |
| 4 | Ring-out and soundcheck | FeedbackLoop of the chosen wedge · M | SEND −30…+6 dB for the chosen wedge (level lane) | WEDGE ▸ sticky, SEND ▪, POSITION ▸ sticky, NOTCH toggle | W1 · W2 · W3 · W4 (send, "!" when ringing) |
| 5 | Shutdown and documentation | PowerRack — devices go dark in order · S | — | STEP ▸ sticky, RESET, DOCUMENT ▸ (the five-line checklist) | STEPS · LAST · ORDER · DARK |

### TROUBLESHOOT (6)
| # | Page | Layout | Stage | Dock keys | Bezel |
|---|---|---|---|---|---|
| 1 | How the bench works | (b) | — a worked example, not a live instrument | | |
| 2–6 | The five fault groups | **(a)** | SystemMap of the bench (readings appear as you probe) · L | CASE ▸ (the group's faults, ✓/✓✓ marked, symptom as blurb); once a case is open: PROBE ▸ sticky (the nine stations — the reading is the blurb, so the walk never leaves the glass), FAULT ▸ sticky (name it; the grade is the blurb), RESET, BENCH | CASE · PROBED · READS · GRADE |

## Decisions made without the owner (stated here)

- **Host.** `kit/PagedLab` is out of scope, so the rack branch is a local copy (`SsPagedLab`). Same look, same storage, same check page. Folding it upstream is a two-line additive change if wanted.
- **Fader-less rack pages** (LEARN 2, 8; ROUTE 6; OPERATE 1, 5; TROUBLESHOOT 2–6; nine in all). Their controls are honestly discrete — a step order, a probe, a mute button, a feed switch — and inventing a lane for them would be a lie. The frame supports it silently (the Cymatics "Change one thing" precedent, owner-approved 2026-09-17): `initialParam` names the first key and the dock renders the key strip without a lane.
- **Flip-through faders.** Where the teaching choice is a collection (system types, configurations, monitors, channel-strip blocks, sockets, line-check lines, the builder's parts), one key is both the chooser and the slider, so riding the lane steps the picture through the collection. Cause → effect on every one, verified.
- **The console pages** put the BUSES on the glass (a meter bridge, `BusBank`) and the desk in a CONSOLE tray over the well, with the teaching control on the lane. The display is what the exercise asks you to watch; the desk stays under your fingers while you watch it.
- **Stage sizes.** Plots and maps are 'L' (250 px glass → the 360×330 plan draws at 257×236 on a 375-wide phone); the diagrams 'M'; the power band and the power rack 'S'. On short phones the frame drops one size and HIDE DISPLAY gives the lesson the screen, per the 2026-09-23 ruling.
- **Honesty.** Every stage keeps its badge (CONCEPTUAL COVERAGE — ILLUSTRATIVE MODEL on every plot; BUS METERS — COMPUTED; GAIN CHAIN — ILLUSTRATIVE MODEL; etc.), the compact AccuracyNote rides the header of every rack page, and the illustrative-model cards stay in the notes.

## Verification

- `npx tsc --noEmit -p tsconfig.json` — clean (exit 0), before and after the fix pass.
- `node --test "test/**/*.test.ts"` — **1,986 pass, 0 fail** (the same 1,986 as before the pass; no tests touched).
- Browser: `ape-web` preview at `localhost:8091`, `#soundsystemspreview`, built-in browser tools, viewport 375×812 then 768×1024, reset to desktop at the end. A DOM scan on every page (leaf text with `scrollWidth > clientWidth`, or a rect outside the viewport) found **zero overflows on all 52 pages** at phone width and on the tablet samples. Readouts are from the DOM (`aria-valuetext` on the lane, the bezel cells' labels), not from screenshots:

| Page | Proof (phone) |
|---|---|
| LEARN 1 | STATION ride → lane "Amps", bezel STATION AMPS, SEEN 0→5; inspect card appears; tray and glass both live |
| LEARN 2 | NEXT tray: Source, Cable → LIT 2/9 · LAST CABLE · THREAD OK; map lit; tray stays open |
| LEARN 3 | TYPE ride → 10 plans, BOXES 2→6, SEEN 3/10 |
| LEARN 5 | CONFIG ride → "Stereo mains with mono subwoofers", POSITIONS 4 · FEEDS 3 · SUBS MONO |
| LEARN 8 | FEED → Aux-fed reveals VOCAL → SUB; toggle → VOCAL: IN SUBS, warning card |
| LEARN 9 | LAYOUT ride → END-FIRE ARRAY, PATTERN END-FIRE |
| LEARN 10 | MONITOR ride → IN-EAR MONITORS, STANDS AT CENTRE STAGE, FED BY STEREO AUX · TX |
| LEARN 11 | MON GAIN ride → +6 dB, FOH HEARS UNCHANGED (analog) |
| LEARN 13 | CABINETS 1→4: TOTAL LOAD 8 Ω→2 Ω, VERDICT SAFE→UNSAFE; page marked done |
| LEARN 14 | AMP 500→1500 W: MATCH IN BAND→OVER, SPL 98.0→102.8 dB |
| LEARN 16 | PREAMP +5→+41 dB: AT SPEAKER −7→+4 dBu, NOISY→CLIPPING; the preamp meter underlined |
| LEARN 17 | COVERAGE 90→115°; FLOWN, FILLS → RIG FLOWN, FILLS ON |
| LEARN 18 | DELAY 0→96 ms: ERROR −87.4→+8.6 ms |
| LEARN 20 | SEND −12→+7 dB: LOOP RINGING, MARGIN 19 dB OVER |
| LEARN 21 | WALK 0→3: LAST PROCESSOR, FAULT FOUND; page marked done |
| LEARN 4, 6, 7, 12, 15, 19, 22, 23 | document layout, footer present, no overflow |
| BUILD 1 | PART tray → mic at Centre stage, console at Front of house, powered loudspeaker at Main · house left; cabled mic → console → loudspeaker: **PLACED 3 · CABLES 2 · LIVE 1 · SILENT 0**, the box's coverage lit; REMOVE/CLEAR appear only when they can act |
| BUILD 2–11 | all load as racks, REQS on the bezel; CONSOLE key on 7, 8, 9, 11 only; its tray opens the desk (8 send steppers, 4 PRE switches) with the plot still on the glass |
| ROUTE 2 | VOX FADER 0→−39 dB: WEDGE HEARS follows (−39) until WEDGE TAP → PRE, then WEDGE HEARS 0 dB with the fader still at −39 |
| ROUTE 4 | SEND ride → W1 · SINGER: Lead vocal at −5 dB; PRE lit; CONSOLE tray with ALL PRE ×4 |
| ROUTE 5 | BAND DCA ride → −33 dB |
| ROUTE 7 | MC → AUX 7 → −3 dB; MATRICES crosspoints → FILLS TAKE MAIN · LOBBY TAKES MAIN + AUX 7 · REC TAKES MAIN; page marked done |
| ROUTE 8 | SOCKET ride → OUT 3 · Wedge 1 amplifier; BUS → Aux 1: FED FROM Aux 1, PATCHED 1/7 |
| ROUTE 1, 3, 6 | 1: STATION lane at the bottom (a stray reading came from the read-only console's own slider inside the well, not the dock); 3: document; 6: BAND MUTE / ALL MICS keys, MAIN HEARS 10 CH |
| OPERATE 1 | STEP tray in the right order → STEPS 6/6 · ORDER CORRECT · LIT 5/5; page marked done |
| OPERATE 2 | LINE ride → Subwoofers; PROBE → LED LIT · METER MOVING; MARK OK → MARKED 1/14; the mark keys vanish |
| OPERATE 3 | PREAMP +60→+32 dB: CLIPPING→QUIET |
| OPERATE 4 | SEND → +3 dB: W1 SINGER +3 dB ! (ringing); POSITION → In the null |
| OPERATE 5 | DOCUMENT tray → 5/5 |
| TROUBLESHOOT 2 | CASE → "Intermittent cable or connector"; PROBE Source (OK), Cable (OK · INTERMITTENT); FAULT → correct: **GRADE ✓✓**, "2 probes; a disciplined walk from Source needs 2" |
| TROUBLESHOOT 1, 3–6 | 1 document; 3–6 rack with CASE key, n/m SOLVED on the bezel |
| Tablet 768×1024 | TROUBLESHOOT 2, LEARN 1 and 17, ROUTE 4, OPERATE 3: rack fills the height, lane at y=846 over the footer at y=972, no overflow |

Fix pass after the walk (re-verified on a fresh bundle): the flip-through lane prints the short name when the full one is long (the full name stays on the bezel and in the tray); a flip-through with nothing selected reads its empty state ("ride to inspect a station", "nothing in hand — tap to pick a part") instead of the first item; the two sub-feed bezel values that ellipsized were shortened; the system-type suffix moved from the lane into the tray blurb.

## Left as is, on purpose

- **Builds are not persisted between pages** (BUILD): stepping away and back remounts the builder. Pre-existing, listed in the lab's design doc as a known limit; unchanged by this pass.
- **A powered loudspeaker's link output may feed a console input.** The engine allows it (it is a real line-level link) and refuses the return cable as a loop. Found while testing by cabling in the wrong order; the engine is right and untouched.
- **Capstone 6 reads REQS 1/5 on an empty venue** — one requirement holds vacuously. Pre-existing engine grading, untouched.
- `kit/PagedLab.tsx` — not edited (scope). The `rack` branch lives in `SsPagedLab.tsx`.
- Not device-tested (no device reachable from here); nothing published.

## Commits

Recorded in `docs/CROSS_SESSION_HANDOFF.md` (the post-commit stub) and in the Downloads copy of this
report (`C:\Users\profe\Downloads\2026-09-25_SOUND_SYSTEMS_RACK_PASS.md`).
