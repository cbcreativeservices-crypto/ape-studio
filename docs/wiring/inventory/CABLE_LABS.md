<!-- Phase 0 inventory (read-only agent report, 2026-10-20). Findings are claims to verify, not decisions. -->
# Wiring inventory — Cable, Cable Install, Connector Select, Patchbay

# Wiring and signal-flow accuracy audit: cable labs (branch `dj-lab`)

This was a read-only pass; I edited nothing.

**Short answer:** most of the wiring data is correct and carefully hedged. I found five claims I'd treat as wrong or misleading:
- **"TRRS can't carry two balanced channels"** (`connectorselect/data/jobs.ts:180`). 2.5 mm TRRS balanced headphone leads do exactly this.
- **"AES OUT" on a female XLR** (`connectorselect/pagesB.tsx:176`, `connectorselect/data/assessment.ts:125`). This contradicts the lab's own "outputs are male" rule.
- **Two patchbay feeds into one input called "parallel" or "mixing"** (`patchbay/pagesD.tsx:58`, `patchbay/engine/scenarios.ts:109`). Electrically it is two outputs tied together, which the connector-selection lab calls a hazard.
- **A speakON-to-XLR choice graded as "plugs in"** (`connectorselect/data/scenarios.ts:159`). The two can't mate, so it should be "does not fit".
- **"Shielding intercepts field coupling"** (`cableinstall/scenes/EmiScene.tsx:72`). A shield does little against low-frequency magnetic fields from feeders and transformers.

**Coverage gap:** neither validator script runs under `npm test`, and no automated check looks at what a pin actually does.

Paths are relative to `/home/user/ape-studio/src/screens/lab/` unless they start with `scripts/` or `test/`.

---

## 1. `cable/` — Cable & Connector Fundamentals

### 1.1 Lessons that draw or describe wiring
Lesson list: `cable/data/lessons.ts`. Screens: `cable/lessons/lesson01.tsx` to `lesson12.tsx`. Each pairs with `cable/data/lessonNN.ts` (no data file for lessons 1-to-10 tester beyond `testerCables.ts`).

| Lesson | Data file | What it covers |
|---|---|---|
| `l01_what_travels` | `data/lesson01.ts` | What travels on each link: mic, instrument, line, headphone, speaker, digital, power. The connection pairs list is `CARRY_PAIRS` (`:100+`). |
| `l02_anatomy` | `data/lesson02.ts` | Tip/ring/sleeve zones, cable cross-sections, characteristic impedance (`:240`). |
| `l03_analog` | `data/lesson03.ts` | Analog connectors and checks. The balanced-vs-unbalanced drawing comes from `art/wiring.tsx`. |
| `l04_same_plug` | `data/lesson04.ts` | Ten look-alike comparisons (`PLUG_COMPARISONS`). Cross-section art map is in `lessons/lesson04.tsx:184-192`. |
| `l05_loudspeaker` | `data/lesson05.ts` | Signal routing: mixer to powered speaker, mixer to amp, amp to passive, bi-amp, mains (`ROUTING_SCENARIOS`, `:154+`). |
| `l06_digital` | `data/lesson06.ts` | BNC 50 vs 75 ohm, word clock, TOSLINK. |
| `l07_power` | `data/lesson07.ts` | Mains and DC power. |
| `l08_selection` | `data/lesson08.ts` | Pick-the-cable steps. |
| `l09_handling` | `data/lesson09.ts` | Handling and inspection. |
| `l10_tester` | `data/testerCables.ts` | Continuity maps. The drawn wires inside each cable are built from these maps by `WiringTrace` in `art/wiring.tsx`. |
| `l11_challenge` | `data/lesson11.ts` | Show A and Studio B: full system patching (`ChallengeDef`). |
| `l12_final` | `data/lesson12.ts` | Final check, including the XLR pin question (`:170-174`) and seven safety units. |

**Art that draws contacts:**
- `art/plugs.tsx:12-19, 276-288`: XLR faces. Male is 1-left / 2-right, female is 2-left / 1-right, both seen from the mating face; this matches common reference diagrams. `ComboFace` uses the female layout.
- `art/plugs.tsx:16-19`: NEMA 5-15 plug face (narrow blade is line, on the left).
- `art/sections.tsx:48`: T568B pair colours.
- `art/wiring.tsx:1-10, 108, 128-129`: the balanced drawing labels pin 2 as + and pin 3 as −.

### 1.2 Where the wiring truth lives
**Connector records** are gathered in `data/registry.ts:25-31` (`CONNECTORS`, `getConnector`). The validator expects exactly 48 records. Source files:
- `data/connectors.analog.ts`
- `data/connectors.speaker.ts`
- `data/connectors.digital.ts`
- `data/connectors.power.ts`
- `data/connectors.recognition.ts`

**Record shape** (`cableTypes.ts:192-240`):
- `ConnectorRecord` has `id`, `carried: CarriedType[]`, `pinouts: PinoutVariant[]`, `balanced` (`balanced | unbalanced | either | n/a`), `channels`, `locking`, `directionality`, `hotPlug {policy, rationale}`, `notInterchangeableWith: ConfusionRisk[] {otherId?, otherName, why, consequence}`, `basicTest`, `safety {level, qualifiedPersonOnly?, cautions}` and `sourceNotes`.
- `PinoutVariant` (`:130-139`) has `id`, `application`, `carried`, `contacts: PinDef[]`, `confidence` (`standard | convention | equipment-dependent`) and `verifyAgainst?`.
- `PinDef` (`:111-120`) has `label`, `role`, `ink`, `note?`.
- `ink` values are semantic colour keys: `signalPos`, `signalNeg`, `shield`, `speakerPos`, `speakerNeg`, `dataA`, `dataB`, `dcPos`, `dcNeg`, `clock`, `optical`, `insulator` (`connectorInks.ts:22-54`). A test could require, for example, that any role starting "Signal −" uses `signalNeg`.

**Tester truth** (`data/testerCables.ts:37-61`):
- `TesterCable` has `expectedMap` and `actualMap` (rows of `{path, value}`; values are CLOSED, OPEN, PAIRED, SPLIT, STEADY or DROPS ON FLEX), plus `faultId`, `faultOptions`, `disposition`.
- The file claims two things nothing enforces: the expected map is "derived from the record pinouts" (`:5-9`), and expected/actual rows line up one-for-one with identical `path` strings (`:16-18`).

**Challenge truth** (`data/lesson11.ts:33-92`): `ChallengeOption {id, label, verdict, consequence}`, `ConnectionPick {from, to, q1, q2}`, `OrderItem {phase: 1|2}`, `PatchRow`.

**Lesson 5 routing**: `ROUTING_SCENARIOS {options, correct, accept}` in `data/lesson05.ts:154`.

### 1.3 Technical claims, with source lines
**3-pin XLR** (`connectors.analog.ts`)
- Pin 1 is shield/reference, pin 2 is + ("hot"), pin 3 is − ("cold") (`:49-51`). The AES3 digital variant uses the same pins as a data pair (`:60-62`).
- Outputs are male and inputs female; phantom flows the opposite way (`:74`).
- +48 V phantom sits on pins 2 and 3 relative to pin 1 (`:122`, `:130`).
- AES3 calls for 110-ohm cable (`:100`). DMX512 calls for 120-ohm cable, and phantom can damage DMX electronics (`:106-108`).
- A cable with 2 and 3 swapped still passes audio but inverts polarity (`:118`).

**1/4-inch TS**
- Tip is signal, sleeve is return/shield (`:165-166`).
- Instrument cable is a single shielded conductor; speaker cable is two heavier unshielded conductors (`:158`, `:203`).
- A TS plug in a TRS jack shorts ring to sleeve; into a stereo jack that shorts one channel (`:210-212`).
- A tube amp without a load can be damaged; this source note is marked "EXPERT REVIEW PENDING" (`:226`, `:236`).

**1/4-inch TRS**
- Balanced: tip +, ring −, sleeve shield (`:267-269`).
- Stereo: tip left, ring right, sleeve common (`:278-280`). This source note is still marked VERIFY (`:365`).
- Insert: tip send / ring return is "common, not universal" and marked equipment-dependent (`:289-295`).
- A stereo source into a balanced mono input gives L−R, so centre content cancels (`:341-344`).
- A grounded inverting leg can stress some outputs (`:330-332`).

**3.5 mm TRS**
- Stereo wiring: tip L, ring R, sleeve common (`:398-400`; source note still VERIFY at `:478`).
- Balanced mono on some gear, marked equipment-dependent (`:405-415`).

**3.5 mm TRRS**
- CTIA: tip L, ring 1 R, ring 2 ground, sleeve mic (`:507-510`).
- OMTP swaps mic and ground (`:521-524`). Both are marked `convention`.
- The mic contact carries a DC bias, equipment-dependent (`:510`).

**RCA**
- Centre is signal, shell is return (`:624-625`, `convention`).
- Red is right, white or black is left (`:629`).
- Coaxial S/PDIF needs 75-ohm cable (`:617`, `:633`).
- Phono output is millivolt-level with RIAA equalisation (`:679`).
- The centre pin touches before the shell, so live connection buzzes (`:651`).

**XLR/TRS combo**
- XLR path is 1 / 2+ / 3− (`:734-736`); TRS path is tip +, ring −, sleeve (`:747-749`).
- Phantom is conventionally on the XLR pins only (`:783`, `:822`).
- A speaker output into a combo input can damage it (`:796-798`).

**speakON NL2 and NL4** (`connectors.speaker.ts`)
- Amp + goes to 1+, amp − to 1− (`:63-68`).
- On bridged or floating outputs the − terminal is also driven (`:68`, source note pending at `:147`).
- NL4 full-range uses 1+/1−; 2± are unused or pass-through (`:177-192`).
- NL4 bi-amp: circuit 1 is "often LF — verify", circuit 2 "often HF — verify", marked equipment-dependent (`:202-214`).
- Cable connectors mate only with chassis connectors (`:226-227`).
- The "NOT FOR INTERRUPTING CURRENT" warning is quoted (`:232`).

**Other loudspeaker terminals**
- Binding posts: red + / black −, `convention` (`:324-331`).
- 1/4-inch TS speaker use: tip + / sleeve − (`:636-637`).

**USB A, B, Micro-B** (`connectors.digital.ts`)
- Pin 1 VBUS 5 V, pin 2 D−, pin 3 D+, pin 4 GND (`:54-57`, `:159-162`).
- Micro-B: pin 4 is ID, pin 5 is GND (`:254-263`).

**8P8C T568B** (`:492-508`, `:616-627`)
- Pins 1/2 are white-orange/orange (pair 2), 3/6 green (pair 3), 4/5 blue/white-blue (pair 1), 7/8 brown (pair 4). These are correct.
- T568A is "equally valid" (`:495`).
- 10/100 links use pairs 2 and 3; gigabit uses all four (`:501`).

**BNC**
- Centre is signal, shield is return; word clock is "one pulse per sample period" (`:723-734`).
- 50 vs 75 ohm (`data/lesson04.ts:230-241`).

**TOSLINK**: one-way, one fiber; carries S/PDIF or ADAT (`connectors.digital.ts:842-853`, `data/lesson04.ts:283-294`).

**MIDI DIN-5** (`connectors.digital.ts:1067-1102`)
- Pin 4 is the current source (+5 V through a resistor), pin 5 is the data/sink line, pin 2 is shield grounded at the transmitter, pins 1 and 3 unused.
- Receivers are opto-isolated; signal always runs OUT to IN.

**TT/bantam and 1/4-inch patch plugs** (`connectors.recognition.ts`)
- Tip +, ring −, sleeve shield, `convention` (`:51-57`, `:141-147`).
- Inserting a plug momentarily shorts contacts, so turn phantom off and let it drain before repatching (`:69`, `:111`).
- Normalling (full, half, open) belongs to the bay, not the plug (`:206`).
- Euroblock: + / − / S, equipment-dependent (`:441-445`).

**Tester bench** (`data/testerCables.ts`)
- Cable A, XLR straight through (`:101-114`).
- Cable B, pins 2 and 3 swapped (`:138-151`).
- Cable C, pin 3 open.
- Cable D, TS intermittent under flex.
- Cable E, TRS tip and ring crossed (`:250-263`).
- Cable F, speakON + and − swapped (`:290-301`).
- Cable G, split pairs on 3/6 and 4/5 (`:327-354`). Correct for the classic 1-2 / 3-4 / 5-6 / 7-8 mistake.
- Cable H, NEMA 5-15 to C13 with an open earth (narrow blade line, wide blade neutral, round pin earth, `:384-397`).

**Levels** (`data/lesson01.ts` and `data/lesson11.ts`)
- Instrument level is "stronger than mic level, weaker than line level" (`lesson01.ts:26`; repeated at `lesson11.ts:191, 197`).
- Headphone level is "More than line level demands, far less than a loudspeaker needs" (`lesson01.ts:36`).
- A mic is "thousandths of a volt" (`lesson01.ts:111`).
- A passive DI's XLR output is mic level (`lesson11.ts:240-251`).
- Powered speakers take line level (`lesson05.ts:186`).

### 1.4 Wrong, questionable or ambiguous
1. **3.5 mm consumer cable tagged as a balanced shielded pair.** `connectors.analog.ts:389` sets `trs_35` construction to `'balanced_shielded'`. The construction note at `:391` describes two conductors plus a common return, and the connector-selection lab models this as `stereo_common` (`connectorselect/data/practice.ts:50-54`). The two labs disagree on the construction label.
2. **Balanced drawn as a mirrored signal, presented as universal.** `art/wiring.tsx:1-10` says pin 3 carries −signal and the input gets 2 × signal; the records call pin 3 "inverting" everywhere. Impedance-balanced outputs, where one leg carries no signal, are common, and the definition of "balanced" is equal impedance to ground. The same shortcut appears in `connectorselect/data/practice.ts:172` ("two copies of ONE signal").
3. **Instrument level "between mic and line".** `lesson01.ts:26` and `lesson11.ts:191, 197` state this flatly. Active and high-output pickups can reach line level; it is a rule of thumb, not a fact.
4. **Headphone level defined as more than line level.** `lesson01.ts:36` frames it by voltage. The real difference is mostly current drive into low impedances.
5. **Ten source notes still marked "— VERIFY"**, listed at `registry.ts:12-14`. They include TRS and 3.5 mm stereo wiring (`connectors.analog.ts:365, 478`), Ethernet category limits (`connectors.digital.ts:579`) and speaker conductor sizing (`connectors.speaker.ts:602`). Several more are marked "EXPERT REVIEW PENDING": tube amp without load, bridged-output −, speakON vs powerCON non-mating, and bi-amp HF risk (`connectors.speaker.ts:141, 145, 147`; `connectors.analog.ts:236`).
6. **Socapex pin 19.** The source note at `connectors.recognition.ts:1153` says pin 19 is "alignment/pilot". Pin 19 is commonly unused or ground depending on the system. It is an internal note and not shown to learners.
7. **Mislabelled comparison.** `data/lesson04.ts:271-273` has `bLabel: 'Digital-snake or office LAN port (e.g. AES50)'`, which mixes a proprietary snake protocol and office Ethernet under one example.
8. **XLR face numbering.** `art/plugs.tsx:279-288` matches common diagrams, but no test pins it and it doesn't cite a datasheet.

### 1.5 Automated checks and their gaps
**`scripts/validateCableLab.ts`** checks:
- 48 unique connector ids and non-empty required fields.
- Every ink key exists.
- Non-`standard` pinouts have `verifyAgainst`.
- `otherId` and `relatedLessons` resolve.
- Completion-unit set and lesson 12 safety units.
- Generic `correct ∈ options`.
- Tester `faultId` is among the options and dispositions are valid.

**It is not run by `npm test`.** `package.json:73` runs only `test/**/*.test.ts`, and no test imports the script.

**Tests:** `test/cableLabsBugHunt.test.ts` covers navigation and unit state only. No test touches pinouts.

**Not checked anywhere:**
- What each pin does: XLR 2 = +, TRS tip/ring roles, polarity agreeing across `xlr3`, `combo_xlr_trs`, `trs_quarter`, `tt_bantam`, `quarter_patch`.
- Ink matching role (for example "Signal −" must use `signalNeg`).
- T568B colour order, MIDI pin roles, USB pin numbers.
- That `testerCables.expectedMap` actually comes from the pinouts.
- That expected and actual maps line up row for row (the invariant at `testerCables.ts:16-18`).
- Drawing geometry (XLR faces, NEMA blades).
- Agreement between lesson prose and records.

---

## 2. `cableinstall/` — Cable Dressing & Installation

### 2.1 Scenes that describe routing or signal
Module list: `cableinstall/registry.ts:42-135` (13 stages). Scenes are in `scenes/*.tsx`.

| Scene | What it covers |
|---|---|
| `KnowScene` | Cable classes. Line 81: "Mic level is the most vulnerable signal in the building." |
| `RouteScene` | Route judging, scored by `engine/routeEval.ts`. |
| `RackScene` | Rack dressing: signal on the left manager, AC and speaker on the right. |
| `EmiScene` | Interference field, balanced on/off toggle, crossing geometry. |
| `FloorScene` | Power crossing audio at 90° (`:523`). |
| `MechScene` | Bend radius exercises. |
| `LabelScene` | Labels at both ends. |
| `FireScene` | Plenum and rated spaces. |
| `InspectScene` | Final inspection. |

### 2.2 Where the truth lives
- `data/cableTypes.ts:31-40, 79-196`: `CiCableType {id, name, tint, signal, use, useNote, concerns[]}`.
- `data/rules.ts:24-53`: `CiRule {id, category, authorityClass, jurisdiction?, severity, studentText, whyText, sourceRefs, numericValueIsScenarioSpecific?}`.
- `data/scenarios.ts`:
  - `CI_BEND_EXERCISES` (`:199-203`, `minRadiusDia`).
  - `CI_EMI_CHOICES` (`:438-443`, `{id, ok, ruleId}`).
  - `CI_RACK_GROUPS` and `CI_RACK_ZONES` (`:283-299`).
  - `CI_FIRE_SPACES` (`:446+`).
  - `CI_MYTHS` (`:548+`, `{statement, answer}`).
  - `CI_QUIZ_BANK`.
- `scenes/EmiScene.tsx:77-108`: `EMI_SOURCES`, `EMI_LEVERS`, and a qualitative coupling formula (balanced × 0.4).
- `data/mistakes.ts`, `data/sources.ts`.

### 2.3 Claims
- Unbalanced: "No common-mode rejection"; "Shield is the return — damage = hum" (`data/cableTypes.ts:103-104`).
- Network cable is balanced twisted-pair data and carries Dante/AVB/AES67 (`:127`). Fiber is immune to interference (`:143`).
- Interference depends on level, balancing, shielding, current, distance, geometry and grounding; there is no universal separation distance (`data/rules.ts:454-458`; myth at `data/scenarios.ts:555`).
- Crossing near perpendicular is professional practice, not code (`data/rules.ts:466-469`; `scenes/EmiScene.tsx:781`).
- Healthy balanced lines with correct shielding reject most induced noise (`data/rules.ts:477-479`).
- Dimmer racks are "the classic offender"; network cable is a "quiet neighbor" (`scenes/EmiScene.tsx:81-84`).
- The NEC plenum rule: CMP for communications cable, CL2P/CL3P for Class 2/3 (`data/scenarios.ts:462`).
- Simulated bend radii: mic 6×, UTP 4× installed, coax 10×, fiber 15×. Each is labelled "SIMULATED SPEC" (`data/scenarios.ts:200-203`).

### 2.4 Questionable or ambiguous
1. **Shielding and magnetic fields.** `scenes/EmiScene.tsx:72` ("Shield plus correct termination intercepts field coupling") is too broad. Foil or braid does little against low-frequency magnetic fields from feeders and transformers (two of the sources offered at `:79-80`); twisting the pair is what helps there.
2. **"Dimmer runs" described as control cable.** `data/cableTypes.ts:161` says "Some control (e.g. dimmer runs) is a NOISE SOURCE". Dimmed load feeds are power, not control; DMX control lines are not the noise source.
3. **Coax shown in the control colour.** `data/cableTypes.ts:150` gives coax the control tint, while the class key at `:76-77` has no coax entry.
4. **PoE marked permanent only** (`data/cableTypes.ts:136`). PoE patch cords are temporary too. Minor.

### 2.5 Automated checks and their gaps
**`scripts/validateCableInstallLab.ts`** checks:
- Rule and source references resolve; mistake, scenario and quiz references resolve.
- `correctIdx` is in range.
- Inspection zones are valid.
- A heuristic flags digits in student text unless the rule is marked scenario-specific.

It is also **not in `npm test`**.

**Tests:** `test/routeEval.test.ts` covers scoring weights and route ranking. `test/cableInstallComplete.test.ts`, `test/cableInstallArt.test.ts` and `test/cableLabsBugHunt.test.ts` cover UI and state.

**Not checked:** any technical content — cable-type statements, EMI wording, rack power/signal zone logic, bend values against simulated specs.

---

## 3. `connectorselect/` — Audio Connectors & Cable Selection

### 3.1 Pages
- `pagesA.tsx`: the TRS "one plug, two jobs" demo (`:192-223`).
- `pagesB.tsx`: the jobs matrix, and "declare the signal" cards (`:174-212`: AES wall jack, coaxial digital, insert jack).
- `pagesC.tsx`: building the system (`SCENARIOS`) and the cable tester (`FAULTS`).
- `pagesD.tsx`: safety and misconceptions, final assessment.
- `art.tsx`: cross-section drawings.

### 3.2 Where the truth lives
- **Connector facts:** the lab writes none of its own. It reads cable-lab records through `getConnector` (`data/roster.ts:12-18`). `ROSTER` and `BENCH_GROUPS` are at `:41-63`.
- **`JOB_MATRIX`** (`data/jobs.ts:117-239`): `JobRow {id, can, backs?: CarriedType[], basis?, explain}`.
- **`SCENARIOS`** (`data/scenarios.ts:39-65`): `CableChoice {a: ConnectorId, b: ConnectorId, verdict: 'correct' | ProblemKind, rowsOverride?}`.
- **`FAULTS`** (`engine/tester.ts:282-302`): `FaultCase {kind, links: (number|null)[], shorts?, flickerLinks?, needsReseat?}`. `CABLE_CONTACTS` is at `:256-260`. `lampFor` and `expectedLink` are the tester logic.
- **Practice and assessment:** `CROSS_SECTIONS`, `SAFETY_RULES`, `MISCONCEPTIONS` (`data/practice.ts`); `ASSESSMENT_BANK` (`data/assessment.ts`).
- **Validator:** `engine/evaluate.ts` `validateSelectionData`.

### 3.3 Claims
- XLR tester contacts: 1 shield, 2 hot +, 3 cold − (`engine/tester.ts:257`).
- TRS balanced is tip +, ring −, sleeve shield; stereo is tip L, ring R (`data/jobs.ts:163-164`). Insert send/return is equipment-defined (`:165`).
- A balanced connection is mono; three contacts can't carry balanced stereo (`data/jobs.ts:166`; `data/practice.ts:172`).
- RCA: red right, white left; can't be balanced; can't carry phantom (`data/jobs.ts:188-192`).
- Phantom rides the two signal pins and needs the shield return intact (`data/scenarios.ts:89, 94`).
- A TS plug grounds the inverting leg (`data/scenarios.ts:131`).
- Stereo into a balanced input gives L−R (`data/scenarios.ts:118`).
- Two outputs are never joined passively (`data/scenarios.ts:117, 121`; `data/practice.ts:141-143`).
- A speaker output into an input can damage it (`data/scenarios.ts:159`).
- Turn amps on last and off first (`data/practice.ts:116-118`).
- A TS plug in a TRS test fixture joins ring and sleeve (`engine/tester.ts:387-395`).

### 3.4 Wrong, questionable or ambiguous
1. **"Even the four-contact TRRS cannot carry two balanced channels"** (`data/jobs.ts:180`). This is wrong as an absolute: 2.5 mm TRRS balanced headphone leads carry L+, L−, R+ and R− on four contacts (no shared return), and 4-pin XLR headphone leads do the same. Balanced stereo needs four signal conductors, not two separate connectors.
2. **"AES OUT" on a female XLR** (`pagesB.tsx:176`; also `data/assessment.ts:125`, three female jacks including "AES OUT"). This conflicts with the lab's own rule that outputs are male (`cable/data/connectors.analog.ts:74`). It works only if the wall plate is labelled from the far end; either rename it or say so.
3. **A connection that can't mate graded as "plugs in".** `data/scenarios.ts:159` uses `a: 'speakon_nl4', b: 'xlr3'` with verdict `speaker_into_input`. A speakON plug doesn't mate with an XLR input, and `evaluateChoice` marks it as fitting (only `no_fit` sets fit false, `engine/evaluate.ts:35-44`). Either it should be `no_fit`, or the label should name an adapter.
4. **TS adapter case explained only from the input side.** `data/scenarios.ts:131` says the TS plug grounds the input's inverting leg. At the interface end the TS plug also grounds the output's cold leg, which is the case the record warns about (`cable/data/connectors.analog.ts:332, 368`).
5. **"Two copies of ONE signal"** (`data/practice.ts:172`): the same balanced-definition shortcut as §1.4 item 2.
6. **"The one connection in this lab that can destroy equipment"** (`pagesC.tsx:111`). Other choices are also marked unsafe: instrument or mic cable on amp duty (`data/scenarios.ts:157-158`, `safe:false`), and the Y-cable (`outputs_combined` sets `safe:false`).
7. **Open shield described as only adding hum** (`engine/tester.ts:340`). With pin 1 open, phantom has no return path, so a condenser mic goes silent. That isn't mentioned.

### 3.5 Automated checks and their gaps
**`test/connectorSelect.test.ts`** runs in `npm test`:
- `validateSelectionData` passes clean.
- Roster counts are pinned at 22.
- Every `can:true` job is backed by the record's `carried` types.
- Exactly one correct choice per scenario, and every problem kind is used.
- Tester logic for each fault.
- Misconceptions are all false.
- Assessment draw and pass rules.

**Not checked:**
- Whether a scenario's two connector ids can physically mate, compared with its verdict (item 3 above would fail such a check).
- Whether `CABLE_CONTACTS` labels match registry pinouts.
- Whether `can:false` claims are actually false (item 1 above).
- Port gender against direction (item 2 above).

---

## 4. `patchbay/` — Patchbay Signal Flow & Normalling

### 4.1 Pages and drawings
- `pagesA.tsx`: top row = outputs, bottom row = inputs (`:42-46`); normals (`:171-194`); jack switching contact (page 5, `:204-247`); full-normal states (`:266-271`); half-normal tap (`:340-364`).
- `pagesB.tsx`: half-normal "scoreboard" (`:24-44`); tap/mult/split vocabulary (`:86`).
- `pagesC.tsx`: 8-pair studio bay (`:178-202`); normal vs overpatch (`:227-241`); insert send/return using a half-normal pair (`:327-362`).
- `pagesD.tsx`: top-break variant (`:24-70`); tip/ring/sleeve reveal (`:108-119`); phantom safety (`:140-166`).
- Art: `art/PatchPairView.tsx`, `art/StudioBayView.tsx`, `art/JackCutaway.tsx` (`:1-24`).

### 4.2 Where the truth lives
**`engine/patchbay.ts`:**
- `NormalConfig = 'full' | 'half' | 'thru'`, `BreakSide = 'top' | 'bottom'`, `COMMON_HALF_BREAK = 'bottom'` (`:24-31`).
- `PairState {config, breakSide?, topPlugged, bottomPlugged}` (`:36-44`).
- `normalSurvives` (`:77-88`): thru never; full only when neither jack is plugged; half until the break-side jack is plugged.
- `resolvePair` returns `PairFlow {hasNormal, normalActive, normalBroken, topFeedsPatch, bottomFeedsDestination, isSplit, isMerge, destinationHears, sourceReaches}` (`:51-72`).
- `CONTACT_OPEN_AT = 0.6` (`:133`), a teaching constant. `consistentConfigs` is the detective deducer (`:169`).

**`engine/scenarios.ts`:** `PREDICT_SCENARIOS` with machine-checked `expected` facts; `DETECTIVE_CASES` with `probes` and `answer`.

**`engine/scenariosB.ts`:**
- `STUDIO_PAIRS` (`:258-267`): pairs 1-6 are half-normal, bottom break; pairs 7-8 (compressor and EQ, OUT on top, IN on bottom) are thru.
- `WRONG_PATCH_CASES`, `DESIGN_ROWS` (`verdicts: Record<PairKind, {ok, note}>`), `ASSESSMENT_ITEMS`.

### 4.3 Claims
- Top row is source/output, bottom row is destination/input; "signal falls downhill" (`engine/patchbay.ts:33-35`; `pagesA.tsx:42-46`; `engine/scenariosB.ts:333`).
- Full-normal: plugging either front jack breaks the normal; a top plug silences the destination (`engine/scenarios.ts:82`, `engine/scenariosB.ts:361`).
- Half-normal (common bay): plugging the top does not break it (a tap or split); plugging the bottom breaks it and replaces the source (`engine/scenarios.ts:57, 107`; `pagesB.tsx:29`).
- Half-normal can also break on top, so verify the bay (`engine/patchbay.ts:15-18`; `pagesD.tsx:49-67`). On a top-breaking bay, plugging the bottom gives "two feeds" at once (`engine/patchbay.ts:64-67`; `pagesD.tsx:58`).
- Thru has no internal connection (`engine/scenarios.ts:132`).
- Normalling a processor's output to its own input creates a feedback loop, so processor pairs are wired thru (`engine/scenariosB.ts:311, 440-442, 645`).
- Pulling the return cord on a half-normal insert silently falls back to the dry signal (`pagesC.tsx:358`).
- A meter or tuner is a high-impedance destination and sends nothing back (`engine/scenariosB.ts:364`).
- Normal contacts are a spring the plug lifts (`pagesA.tsx:240-244`; `art/JackCutaway.tsx:9-18`).
- One drawn line stands for a full tip/ring/sleeve balanced circuit (`pagesD.tsx:110-118`).
- Phantom: "where the design calls for it, kill the phantom" (`pagesD.tsx:140-166`).

### 4.4 Questionable or ambiguous
1. **Two feeds into one input described as "parallel" or "mixing".** See `engine/patchbay.ts:64-67` and `:118`, `pagesD.tsx:58` ("two feeds arrive at once") and `engine/scenarios.ts:109` ("Parallel mixing is not what the common bay does"). Electrically, a top-breaking pair with the bottom plugged ties two low-impedance outputs together into one input. That is not a mix, and the connector-selection lab treats joined outputs as a hazard (`connectorselect/data/practice.ts:141-143`). The patchbay lab never says so.
2. **Patchbay vocabulary merged.** `pagesB.tsx:86` lists "tap · mult · split · monitor · parallel feed" as the same move. In patchbay terms a "mult" is usually a dedicated bussed jack group, and "parallel" is often a distinct wiring option from half-normal.
3. **A design choice stated as universal.** `engine/scenariosB.ts:442` says "The processor only ever joins a chain deliberately, by cable — never by default." That holds for the processor's own out-to-in pair, but many studios normal outboard gear into console inserts on purpose (insert send to processor in, processor out to insert return).
4. **Phantom advice differs from the cable lab.** The cable lab says turn phantom off before repatching any mic-level point unless the bay is line-only (`cable/data/connectors.recognition.ts:69, 111, 199`). The patchbay lab says "where a design requires it" (`pagesD.tsx:144, 162`).
5. **Imprecise wrong-answer wording.** `engine/scenariosB.ts:532` says "This bay breaks on top" for a full-normal bay, which breaks on both jacks.
6. **The cutaway shows only one kind of jack.** `art/JackCutaway.tsx` draws a source-side jack, where the plug lifts the source's spring, as on a full-normal top jack. On the common half-normal bay the switch is on the bottom jack, and plugging there connects your cord to the destination's spring. Page 5 presents it generically. Not wrong, but it can mislead.
7. **Not modelled:** ground/sleeve normalling choices, and the load of a half-normal split on the source.

### 4.5 Automated checks and their gaps
**`test/patchbayEngine.test.ts`** runs in `npm test`:
- Full truth table for all configurations, including top-break half-normal.
- Invariants across the whole matrix.
- Every predict, wrong-patch and assessment `expected` fact is resolved through the engine.
- Each detective case narrows to exactly its answer.
- Processor pairs must be thru and the studio defaults are half-normal, bottom break.

**`test/patchbayRack_20261010.test.ts`** covers layout and font size only.

**Gap:** the tests compare the engine with itself. Nothing checks the model against real hardware (for example, that a merge means two outputs tied together), and nothing checks prose wording (items 1, 2, 5 above). The `CONTACT_OPEN_AT` value is arbitrary by design.

---

## 5. Gaps across all four labs, and test ideas
1. **Neither validator script runs under `npm test`.** Running them would mean adding tests that import `scripts/validateCableLab.ts` and `scripts/validateCableInstallLab.ts`, or wiring them into the test command.
2. **Polarity must agree across records.** Every balanced pinout (`xlr3`, `combo_xlr_trs`, `trs_quarter`, `trs_35`, `tt_bantam`, `quarter_patch`, `euroblock`) should put + on pin 2 or tip and − on pin 3 or ring. Roles containing "Signal −" should use `signalNeg`, and "Signal +" `signalPos`.
3. **Tester maps.** Expected rows should be built from `getConnector(...).pinouts[*].contacts` and should line up with actual rows by `path`.
4. **Physical mating in connector-selection scenarios.** If the two connector ids can't mate, the verdict should be `no_fit` (or the label should name an adapter).
5. **Port gender against direction.** A "… OUT" label on a female XLR should be flagged.
6. **Labs should agree with each other:** phantom-during-repatch advice, "joined outputs" vs "parallel merge", and the `trs_35` construction.
