# Wiring & Signal-Flow Findings Register — 2026-10-20

From the Phase 0 inventory: five read-only reports, in `docs/wiring/inventory/`. Every finding cites a rule in `WIRING_RULEBOOK_DRAFT_2026_10_20.md`. **Nothing here is fixed yet.** Fixes wait for the owner's yes.

**Severity**
- **S1 — wrong or contradictory.** A professional would catch it; it teaches something false, or two screens disagree.
- **S2 — a convention taught as universal.** True on much gear; needs "most" or "this lab's mixer", or the exception named.
- **S3 — minor.** Stale text, loose wording, an internal comment, or a missing test.

**Check**
- ✅ verified by ccode in the code.
- ◻ reported by the inventory and not yet re-checked (each is re-checked when it is fixed).
- ✗ rejected after checking.
- 🔧 fixed (owner go 2026-10-20), each pinned in a `test/wiringRules_*` or `test/wiringFix_*_20261020` test.
- 👤 waits for an owner decision (see the end of this file).

---

## Cable-focused labs (first priority)

| ID | Lab | Sev | Check | Rule | Finding | Proposed fix |
|---|---|---|---|---|---|---|
| CS-01 | Connector Select | S1 | 🔧 fixed 10-20 | C3 | "Even the four-contact TRRS cannot carry two balanced channels" (`connectorselect/data/jobs.ts:180`). 2.5 mm TRRS and 4-pin XLR balanced headphone leads do exactly that. | Reword: balanced stereo needs four signal contacts; a 3-contact TRS cannot, and a 4-contact TRRS can (balanced headphone leads). |
| CS-02 | Connector Select | S1 | 🔧 fixed 10-20 | C2 | A wall jack labelled **"AES OUT" is described as a female XLR** (`pagesB.tsx:176`, `data/assessment.ts:125`). The Cable lab teaches that outputs are male. | Make it "AES IN" on the processor side, or say the wall plate is a male output. Pinned as a known finding in the new test. |
| CS-03 | Connector Select | — | ✗ | C13 | The inventory said the speakON-to-XLR tray choice "can't mate". **Rejected:** it is a cable with a speakON on one end and an XLR on the other, so both ends fit. "Plugs in, never do it" is the correct lesson. | None. |
| CS-04 | Connector Select | S2 | 🔧 fixed 10-20 | — | The balanced definition is "two copies of ONE signal" (`data/practice.ts:172`, and the Cable lab's `art/wiring.tsx`). The true definition is equal impedance to ground; impedance-balanced outputs (one leg carries no signal) are common. | Add one line: "many outputs drive both legs; the defining feature is equal impedance". |
| CS-05 | Connector Select | S3 | 🔧 fixed 10-20 | L5 | The tester's open-shield fault says only "hum" (`engine/tester.ts:340`). With pin 1 open, phantom has no return, so a condenser goes silent. | Add the phantom consequence. |
| CS-06 | Connector Select | S3 | 🔧 fixed 10-20 | — | "The one connection in this lab that can destroy equipment" (`pagesC.tsx:111`), while other choices are also marked unsafe. | Say "the connection most likely to destroy equipment". |
| CB-01 | Cable | S2 | 🔧 fixed 10-20 | L1 | Instrument level is stated flatly as "between mic and line" (`data/lesson01.ts:26`, `lesson11.ts:191,197`). Active pickups reach line level. | "usually between…; active pickups can reach line level". |
| CB-02 | Cable | S3 | 🔧 fixed 10-20 | — | Headphone level is defined by voltage (`lesson01.ts:36`). The real difference is current drive into a low impedance. | Reword. |
| CB-03 | Cable | S3 | 🔧 fixed 10-20 | — | `trs_35` construction is tagged `balanced_shielded` (`connectors.analog.ts:389`), while its note and Connector Select model it as stereo-common. | Align the tag. |
| CB-04 | Cable | S3 | 👤 owner list | — | Ten source notes are still marked "VERIFY", plus four "EXPERT REVIEW PENDING" (`registry.ts:12-14`). | Owner or expert sign-off list. |
| CB-05 | Cable | S3 | 🔧 fixed 10-20 | — | The comparison "Digital-snake or office LAN port (e.g. AES50)" (`lesson04.ts:271`) mixes a proprietary snake protocol with office Ethernet. | Split the example. |
| CI-01 | Cable Install | S1 | 🔧 fixed 10-20 | R2 | "Shield plus correct termination intercepts field coupling" (`scenes/EmiScene.tsx:72`). Shields do little against low-frequency **magnetic** fields from feeders and transformers; twisting and distance do. | Say which field: shield for electric, twist and distance for magnetic. |
| CI-02 | Cable Install | S3 | 🔧 fixed 10-20 | — | "Dimmer runs" are called control cable (`data/cableTypes.ts:161`). They are power. | Reword. |
| PB-01 | Patchbay | S1 | 🔧 fixed 10-20 | P2–P4 | On a top-breaking bay, two outputs feed one input, and the lab calls this "two feeds… parallel / mixing" (`engine/patchbay.ts:64-67,118`; `pagesD.tsx:58`; `engine/scenarios.ts:109`). Electrically it ties two outputs together, which Connector Select calls a hazard. | Say "two outputs tied together, not a mix — avoid it". |
| PB-02 | Patchbay | S2 | 🔧 fixed 10-20 | P1 | "The processor only ever joins a chain deliberately, by cable — never by default" (`engine/scenariosB.ts:442`). Many studios normal outboard gear into console inserts on purpose. | Scope it to the processor's own out-to-in pair. |
| PB-03 | Patchbay | S2 | 🔧 fixed 10-20 | L6 | Phantom advice differs from the Cable lab ("where a design requires it" vs "turn phantom off before repatching mic-level points"). | Use one rule (rule book L6). |
| PB-04 | Patchbay | S3 | 🔧 fixed 10-20 | — | Vocabulary is merged: "tap · mult · split · monitor · parallel feed" (`pagesB.tsx:86`). A mult is a dedicated bussed group. | Separate the terms. |
| PB-05 | Patchbay | S3 | 🔧 fixed 10-20 | — | "This bay breaks on top" is used as the wrong-answer text for a full-normal bay (`engine/scenariosB.ts:532`). | Fix the wording. |

## Sound Systems, Signal Chain, Gain, Production

| ID | Lab | Sev | Check | Rule | Finding | Proposed fix |
|---|---|---|---|---|---|---|
| SS-01 | Sound Systems | S1 | 🔧 fixed 10-20 | F6 | **At the default settings the amplifier clips first,** yet the lesson says it is "the LAST stage to clip". Amp attenuator −12 with a −30 dBu peak gives 6 dB of amp headroom, against 10 dB at the preamp and processor (`features/soundsystems/operate.ts:108-112`). The comment's own sum fails too (+20 − 12 = +8 > +4). The test passes only by setting −16. | Default amp attenuator about −18 to −20 (it clips only after the console and processor). Fix the comment. Pin it in a test. |
| SS-02 | Sound Systems | S1 | 🔧 part (bus identity: owner) | S1, S3 | BUILD links carry no bus or output, so a build passes with the console bypassed (a stagebox emits line). "Wedge fed from an aux" is never checked. Stereo is not modelled. | Add an output/bus identity to links, and require sinks to be reached through the console. |
| SS-03 | Sound Systems | S1 | 🔧 text (strip drawing: owner) | F4 | The app contradicts itself on mute vs pre-fader sends. The engine says the pre send follows the mute; the Route text says the classic analog rule left it running; the strip drawing places PRE above the mute. | Teach it as console-dependent; make the drawing, engine and text agree. |
| SS-04 | Sound Systems | S2 | 🔧 fixed 10-20 | F1 | The insert is taught as post-EQ (`pagesRoute.tsx:51-52`, `diagrams.tsx:115`). Most compact analog desks insert pre-EQ; digital desks are configurable. | "On this console…"; name the alternative. |
| SS-05 | Sound Systems | S1 | 🔧 fixed 10-20 | — | The troubleshooting prose says the walk starts at the console output (`pagesTroubleshoot.tsx:284`); the fault data starts it at the console input (`faults.ts:91`). | Make them agree. |
| SS-06 | Sound Systems | S2 | 🔧 fixed 10-20 | S6 | "+4 dBu ≈ −18 dBFS" is taught as universal (`pagesLearnC.tsx:71`). EBU R68 and SMPTE RP155 differ, and so do consoles. | "on many consoles (EBU: 0 dBu = −18 dBFS)". |
| SS-07 | Sound Systems | S2 | 🔧 fixed 10-20 | — | Delay speakers "arrive together with the mains" (pure distance). Common practice adds about 5–15 ms (precedence). | Add the precedence offset. |
| SS-08 | Sound Systems | S2 | 🔧 fixed 10-20 | — | Two mains summed as +3 dB (uncorrelated). The same mono signal is correlated: about +6 dB on the aligned line, combing off it. | Fix the model and its text. |
| SS-09 | Sound Systems | S2 | 🔧 fixed 10-20 | — | Double routing is "one or the other, never both". Deliberate parallel routing is a standard technique. | "usually one; parallel on purpose". |
| SS-10 | Sound Systems | S3 | 🔧 fixed 10-20 | — | Smaller inconsistencies: 40–50 vs 40–60 dB; "five" levels vs 7; "three reasons" for refusal; the floor-tom sub aux; the 2.1 config with "one output" but L and R; the toe-in geometry claim; the cardioid-only wedge-null wording; the polarity fault station vs its fix. | Fix each. |
| SC-01 | Signal Chain | S1 | 🔧 fixed 10-20 | F1 | The engine's fixed order (COMP before GATE) is called "the canonical studio order" (`guidedLessons/content.ts:620-621`), while the same lab says you usually gate first. | Call it "this rack's fixed order". |
| SC-02 | Signal Chain | S2 | 🔧 fixed 10-20 | — | A brickwall limiter "guarantees" a true ceiling (`content.ts:631`). Only with true-peak detection or oversampling. | Reword. |
| SC-03 | Signal Chain | S3 | 🔧 fixed 10-20 | — | The display text is stale ("pills", "GR meters below"). | Update it. |
| GN-01 | Gain | S2 | 🔧 fixed 10-20 | F6 | Every stage, including faders and buses, "overloads" at the same 0 (`gainEngine.ts:15`). Passive faders don't clip, and floating-point buses effectively don't. | Say which architecture; or treat fader/bus as "the next stage clips". |
| GN-02 | Gain | S3 | 🔧 fixed 10-20 | — | "The sum tips over at the bus" with a one-channel model; `symptomFor` blames "the converter" for any last-stage clip. There is dead DeviceCard code and a stale header. | Fix the wording; remove the dead code with the owner's OK. |
| PR-01 | Production | S2 | 🔧 fixed 10-20 | L6 | The phantom rule flags **any** ribbon with phantom on (`preprod/logic2.ts:126`). Active ribbons need phantom. | Allow "active ribbon". |
| PR-02 | Production | S3 | 🔧 fixed 10-20 | — | Two rules' "learn more" link to the FX Signal Chain lab rather than Sound Systems or the Cable labs. | Re-point. |

## DJ Systems Lab

| ID | Sev | Check | Rule | Finding | Proposed fix |
|---|---|---|---|---|---|
| DJ-01 | S1 | 🔧 fixed 10-20 | — | **PA L is on opposite sides of the room.** Screen 4 (map seen from behind the booth) puts PA R on the DJ's right, which is house left. Screen 20 and its own glossary entry put PA L at house left. | Make screen 4 follow house-left = PA L (mirror the speakers on the map). Add a cross-screen test. |
| DJ-02 | S1 | 👤 owner (routes) | C13 | The plug "fits" table is not physical fit. The booth TRS plug can't be tried in the phones jack, nor the phones plug in a speaker's TRS input, though both fit on real gear and screen 3 teaches exactly this mistake. | Allow the physical fit; flag it as the wrong job. |
| DJ-03 | S1 | 👤 owner (art) | — | The drawn powered speaker has **no MIC/LINE input switch**, but a capstone fault (`PA_INPUT_MIC`) depends on it. | Draw the switch on the speaker's rear and plate. |
| DJ-04 | S1 | 🔧 fixed 10-20 | — | "USB 1/2" means two things: a channel pair on screens 16/18, two physical ports on screen 23. | Rename: "USB channels 1–2 / 3–4" vs "USB port A / B". |
| DJ-05 | S1 | 🔧 fixed 10-20 | — | The unbalanced 20 m run rolls off at 9 kHz. A mixer's low-impedance output into 20 m does not; the hum part is right. | Remove the roll-off (keep the hum). |
| DJ-06 | S2 | 🔧 fixed 10-20 | G3 | The capstone PA_HUM: a ground loop "through its audio cable" on a balanced XLR line, which screens 3, 4 and 20 teach cancels hum. | Name the mechanism (pin-1 problem or poor CMRR), or use an unbalanced feed. |
| DJ-07 | S2 | 🔧 fixed 10-20 | — | MIDI clock reads the deck, not the channel's audio, so CLOCK = CH 2 reports deck B even when the drum machine is on CH 2. | Read the channel's source. |
| DJ-08 | S2 | 🔧 fixed 10-20 | L5 | "Phantom on line gear on a combo jack" (`p19Mic.tsx:71`). Phantom is on the combo's XLR pins only. | Reword. |
| DJ-09 | S2 | 🔧 fixed 10-20 | — | The connector screens (3, 4, 16, 20, 23) state this mixer's connectors as universal (BOOTH = balanced TRS; USB mapping; stage-box channels 13/14). | Add "on this lab's mixer". |
| DJ-10 | S3 | 👤 owner (art) | — | A TRS plug face is drawn on XLR sockets for the unbalanced run (`p20Pa.tsx:110`). | Draw the right plug (or an XLR-to-jack lead). |
| DJ-11 | S3 | 🔧 fixed 10-20 | — | Stale comments and tests: "50 Hz" vs 60, "60 Hz" vs 80, the stage-box location, five test files cited in comments that don't exist, and two phones jacks but one JackId. | Fix. |

## Miking, Mixing, Mixing Guides, Mic Select

| ID | Lab | Sev | Check | Rule | Finding | Proposed fix |
|---|---|---|---|---|---|---|
| MK-01 | Miking | S1 | 🔧 text (drawing: owner) | — | The DI box behind the combo is cabled to "the amp's back panel" (an instrument cable to the cab). On many combos that jack is the speaker output, which this lab forbids into a DI. No guitar→DI or DI→stage-box cable is drawn. | Label the jack "LINE / DI OUT" or put the DI before the amp; draw the full path. |
| MK-02 | Miking | S2 | 🔧 fixed 10-20 | L5 | "Plain phantom power is not a measurement mic's supply" (`measure/chains.ts:82,93`). Many system-tuning measurement mics run on 48 V phantom. | Scope it to the lab-grade capsules modelled. |
| MK-03 | Miking | S2 | 🔧 fixed 10-20 | S3 | Absolutes: "choir mics never go into the singers' monitor mix"; "Real studios monitor through headphones, not wedges". | Hedge. |
| MK-04 | Miking | S3 | 🔧 fixed 10-20 | — | Broadcast `routeProblems`: own voice into IFB is not flagged; the `'pa'` speakerLoop is never checked. | Fix the model. |
| MK-05 | Miking | S3 | 🔧 fixed 10-20 | — | Code cites "D69" for the cable-lane rule; governance numbers it D70. | Correct the comments. |
| MK-06 | Miking | S3 | 🔧 fixed 10-20 | L5 | Setup choices: "vocal dynamic" setups carry `power: 'phantom'` (e.g. `e07SingerInstrument/lesson.ts:489-490`). Phantom is harmless but not needed; there is no app-wide check. | Add a check: dynamic → none. |
| MX-01 | Mixing | S2 | 🔧 fixed 10-20 | F4 | "Mute follows the console convention: pre-fader keeps feeding the send" is hard-coded (`engine/routing.ts:226`). It is console-dependent, and Sound Systems teaches the opposite (SS-03). | One app-wide statement: "depends on the console". |
| MX-02 | Mixing | S3 | 🔧 fixed 10-20 | — | `CHANNEL_PATH` has no input trim stage and a strict order check; the bus `sumsChannels:false`. | Note it as the DAW model. |
| MG-01 | Mixing Guides | S1 | 🔧 fixed 10-20 | F8 | Polarity flips taught as rules: timbales under-mic, darbuka port, snare bottom "polarity-flipped" as given, and "Align pickup and mic (polarity flip, 0.5–2 ms delay)". The Miking lab teaches "check, never a rule". | Reword to "check polarity". These files are hand-edited (AGENTS.md); edit by hand only. |
| MS-01 | Mic Select | S3 | 🔧 fixed 10-20 | — | Tube condensers need their own PSU and multipin cable; only implied. | Add one line. |

## Other labs

| ID | Lab | Sev | Check | Rule | Finding | Proposed fix |
|---|---|---|---|---|---|---|
| MA-01 | Mastering | S1 | 🔧 fixed 10-20 | S1 | The monitoring-path check accepts a **power amp before the D/A converter** (`masteringEngine.ts` `checkMonitorPath`). | Require DAC before amp. |
| MA-02 | Mastering | S1 | 🔧 fixed 10-20 | C11 | The cable art draws **USB from the DAW into any device**, including a power amp or an analog active monitor (`mastArt.tsx:427-431`). | USB only into the interface/DAC; line after it. |
| DG-01 | Digital | S1 | 🔧 fixed 10-20 | — | The simplified chain drops the preamp (mic → filter), unlike the full chain. | Keep the preamp in both. |
| DG-02 | Digital | S2 | 🔧 fixed 10-20 | — | The preamp clipping before the ADC is taught as a rule ("happens first"). On most interfaces the ADC reaches 0 dBFS first. | "depends on the design". |
| DG-03 | Digital | S2 | 🔧 fixed 10-20 | — | A discrete analog anti-alias block is shown without noting that modern ΔΣ converters do most of it digitally. | Add a note. |
| FX-01 | FX / catalog | S1 | 🔧 fixed 10-20 | — | The Gate lab's catalog blurb promises "sidechain"; the lab has none. | Fix the blurb, or add a key input. |
| FX-02 | FX | S2 | 🔧 fixed 10-20 | F3 | "100% WET" reverb/delay is offered with no send/return context; insert vs send is not taught. | One line on send/return. |
| MD-01 | Modular | S2 | 🔧 fixed 10-20 | — | A "dual VCA, ch1 normalled into ch2" is drawn with one IN/OUT. "Three places one control signal can go" is over-general. | Fix the caption and wording. |
| MT-01 | Meter | S2 | 🔧 fixed 10-20 | — | Pink noise is "a straight downward slope" — only on a constant-bandwidth FFT; it is flat on a 1/3-octave RTA. | Name the display. |
| AM-01 | Amp | S3 | 🔧 part (bridge pins: owner) | — | Rack 7: "CLIP flickers on peaks" called normal; the bridged Speakon pin convention is not mentioned. | Hedge, and add the note. |

---

## Totals
- **S1:** 25.
- **S2:** 27.
- **S3:** 21.
- **Rejected:** 1.

Verified so far by ccode: CS-02, SS-01 and DJ-01 (plus the rejection CS-03). The rest are verified as each is fixed.

## Questions for the owner (easy answers)
1. **S1 fixes:** should I fix the S1 findings as proposed, cable labs first, with a test per fix? **Yes / No / Show me each first**
2. **S2 findings:** fix them all with "most / this lab's / depends on the console" wording, as proposed? **Yes / No**
3. **Mixing Guides (MG-01):** they are hand-edited. May I edit the five polarity lines by hand? **Yes / No**
4. **Dead code** (Gain lab DeviceCards; unused gain functions): remove it? **Yes / No**
5. **DJ-01 (PA L):** follow screen 20 (house left) and change screen 4's map? **Yes / No**

## Owner answers (2026-10-20)
1. S1 findings: **fix them**, cable labs first, a test per fix.
2. S2 findings: **fix with "most / depends on the console" wording.**
3. Mixing Guides MG-01: **hand-edit the five polarity lines** (never regenerate).
4. Dead code in the Gain lab: **remove.**
5. DJ-01: **screen 20 is right** (PA L at house left); mirror screen 4's speakers.
6. SS-01: **default amp attenuator about −18 dB**, so the amp clips last; fix the comment and hint text.

## Status after the fix pass (2026-10-20, evening)
Every finding is fixed except those marked 👤 or "part". Waiting for the owner:
- **SS-02:** add a bus/output identity to BUILD links (wedge from an aux, mains from main L/R, stereo). The console-bypass part is fixed.
- **SS-03 strip drawing:** the PRE tap is drawn above the MUTE block; this console mutes pre sends. The text is fixed.
- **MK-01 drawing:** the stage plan draws no guitar→amp cord and no DI→stage-box XLR.
- **DJ-02:** physical-fit moves (booth TRS into the phones jack, headphones into a speaker input) need new screen-4 routes.
- **DJ-03:** draw a MIC/LINE switch on the powered speaker's rear and plate.
- **DJ-10:** the unbalanced 20 m run draws TRS plug faces on XLR sockets.
- **AM-01:** the bridged speakON pin note (amplifiers differ).
- **CB-04:** 10 VERIFY notes and 9 EXPERT REVIEW claims for owner or expert sign-off.
- **Gain lab:** more unused display code (ChainColumns, StageColumn, ColumnControl, StageIcon). Remove?
- **Mute vs pre-fader:** Sound Systems' console mutes pre sends; the Mixing lab's mixer keeps them feeding. Both now say it depends on the console. Keep, or make both the same?

## Owner instructions for the overnight pass (2026-10-20, late)
"keep fixing and grading until all labs are improved enough … finish the upgrades for me overnight."
1. Art changes: **commit them**, each in its own commit, with a before/after page for the morning (easy to undo).
2. New problems found by re-grading: **fix them** on the same rules (verify first, hedge conventions, a test per fix). Anything uncertain or design-level goes on the morning list.
3. **Push dj-lab when done** (Vercel preview only; no eas, no OTA, never audio-tools-engine).

## Overnight result (2026-10-21 morning)
- **Round 1:** 62 findings fixed; the art fixes (SS-03 strip, DJ-02/03/10, MK-01) drawn and committed.
- **New:** Sound Systems BUILD cables carry which console output (plan + 8 owner decisions).
- **Round 2 (fresh graders):** grades before the round-2 fixes — A: Mastering, Digital, Modular, Meter, Cable Install; B/B+: Cable, Connector Select, Patchbay, DJ, Signal Chain, Gain, FX, Amp, Production, Calc, De-Esser; C: Sound Systems (new outputs feature). Round-2 findings fixed: DJ 16, cable labs 16, Sound Systems 17, other labs 22 (+ Meter dBTP line). Each in `test/wiringFix_r2_*_20261020`.
- Full suite 12,898 / 12,898; tsc clean. Before/after images: rendered with `scripts/artshot`.
- **Not done:** DE-R2-01 (de-esser split-band drawing); round-3 grading (to confirm the round-2 fixes reach A); Miking/Mixing/Mic Select round-2 grading.

### Waiting for the owner (morning list)
1. SS-R2-08: 2.1 tops on MONO (LEARN draws mono; BUILD accepts mono only for Speech and Groups/FX).
2. DJ-R2-03: keep "booth TRS into PHONES" (two outputs on the same mixer), or model the monitor's lead into PHONES (it plays the phones feed)?
3. DJ-R2-02: the unbalanced run: keep XLR ends + honest name, or draw a jack/RCA lead with an XLR adaptor?
4. MK-01: stage XLR upstage "TO STAGE BOX" (as drawn) / side wing / toward FOH; studio "TO WALL PANEL" / "TO CONTROL ROOM".
5. Patchbay cutaway contact opens at 87 % insertion (was 60 %): keep?
6. Art layout picks: DJ screen 3 CH legends under the inputs; screen 4 MASTER OUT words moved 8 mm; Sound Systems wedge tags "AUX1"; Gain XLR socket top-left of the preamp; transformer wave capped at 2×; Cable Install hidden-line dashes; SS-03 MUTE as a small box.
7. Stereo in-ears: also allow two cables between the same pair of devices (bigger change)?
8. Remaining small clashes noticed: SS stage-left wall runs over the BARRIER label; DJ freed MASTER L hangs across deck A's leads; DJ screen 4 red RCA leads over their LINE legends.

## Owner answers to the morning list (2026-10-21)
1. 2.1: **accept mono into both tops** ("often mono is used anyway…"). Done (8941dbc7).
2. DJ booth into PHONES: ccode's recommendation — model the booth monitor fed from the PHONES jack (it plays the headphone cue, not the booth mix). In progress.
3. DJ unbalanced run: **draw the adapter** (a jack lead with an XLR adapter). In progress.
4. MK-01 XLR destinations: ccode's recommendation — keep as drawn (stage: upstage "TO STAGE BOX"; studio: "TO WALL PANEL").
5. Patchbay contact at 87 %: **keep**.
6. The seven layout picks (DJ screen 3 CH legends under the inputs; screen 4 MASTER OUT words 8 mm right; SS wedge tags "AUX1"; Gain XLR socket top-left; transformer wave capped at 2×; Cable Install hidden-line dashes; SS MUTE small box): **approved as drawn** ("approved with your recommendations").

## Comp B batch-1 report (received 2026-10-21) — `docs/wiring/comp_b/COMP_B_WIRING_BATCH1_REPORT_2026_10_20.md`
Comp B graded the pre-fix zip (all four cable labs B). ccode re-checked each row against today's code:
- **Already fixed overnight:** B-CB-03 (USB-C roles, CB-R2-05), register CS-01/02/04, CI-01, PB-01/02/05, the cutaway mechanism note (PB-R2-04), coax key (CI-R2-01), PoE (CI-R2-03), TS adapter case (CS-R2-04).
- **Fixed now (text):** B-CB-01 combo geometry (¼-inch in the centre, XLR contacts around it — 4 places); B-CB-02 "the amplifier's speaker output"; B-CB-04 XLR/RCA channels 'varies' (AES3 / S/PDIF are 2-ch); B-CB-05 shield stops electric-field noise, twist + balanced input reject magnetic hum (lesson 2); B-CS-01 combo "Locks: latch (on some models)"; B-CS-02 "2×TS-to-TRS Y lead"; B-PB-02 row convention hedged; B-PB-03 both bottom plugs broke their normals; B-PB-04 "1U ¼-inch bay holds 24 pairs"; B-CI-03 no speaker cable in the mic/line bundle.
- **Drawings, fixed 2026-10-21 (owner go):** B-PB-01 ¼-inch TRS patch plugs (contact opens at 85 %); B-CI-01 line-level feeds into POWERED wedges with their own mains (linked wedge to wedge); B-CI-02 drum sub-snake fans out into 4 inputs (snake head 9 inputs); B-CI-04 analog run reaches the rack; B-CI-05 spare line coiled and capped. Owner choices open: wedge power linked vs a second quad box; 4 vs 3 drum tails.
- **Rule book notes 1–9:** to add when the owner signs the rule book off (TT vs ¼-inch, never tie two outputs, cable classes in bundles, C7 bi-amp = C, AES3id, wedge case under L3, half-normal break side, combo geometry, D70 cite).

## Owner answers (2026-10-21, local session)
1. **Phone checks:** on hold until Apple approves the store build. Then the owner checks on a phone, then the OTA update.
2. **Cable Install wedge power:** show each wedge's power **individually** (more common, better learning). No wedge-to-wedge link.
3. **Drum fan-out:** ccode's recommendation, **4 tails** (kick, snare, two overheads), as drawn.
4. **DJ unbalanced lead:** keep **MASTER OUT + adapter**, as drawn.
5. **PHONES-fed booth monitor sound:** ccode's choice for learning, the **real result**. A stereo phones jack into a balanced mono input plays L−R: centre content cancels and it sounds thin. The wrong-job text explains why.
6. **Go:** round-3 grading of all labs; round 2 for Miking, Mixing, Mixing Guides and Mic Select; the de-esser split-band drawing (DE-R2-01); the DJ clashes (and the Sound Systems BARRIER clash).
7. **Rule book:** shown again to the owner, with Comp B's 9 additions marked HOLD for sign-off.
8. **Comp B:** the batch-1 report is in and applied. The 22-claim fact-check reply has not arrived on this computer.
9. **Merge:** when optimal, merge `dj-lab` into the store branch, then pause.

## Closed (owner, 2026-10-21, after round 8)
Rounds 5–8: round 5 graded 40 findings → round 6 fixed all; round 7 graded 91 → round 8 fixed all (each pinned in `test/wiringFix_r6_*` / `test/wiringFix_r8_*`). Final suite 13,545 / 13,545 on `next-store-build`. The owner closed the wiring grading rounds; further factual checking goes through Comp B's full-app fact audit. Reports: `Downloads\2026-10-21_WIRING_ROUND{5,7}_*`, `ROUND6_FIXES`, `ROUND8_FIXES_FINAL`.
