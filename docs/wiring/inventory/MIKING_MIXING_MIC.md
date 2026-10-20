<!-- Phase 0 inventory (read-only agent report, 2026-10-20). Findings are claims to verify, not decisions. -->
# Wiring inventory — Miking, Mixing, Mixing Guides, Mic/Speaker, Mic Select

# Wiring / signal-flow inventory: ape-studio `dj-lab` (read-only, nothing edited)

**Summary:** Most of the wiring and signal-flow truth lives in a few pure data and model modules, and most of those have tests. The main exception is the cable-dressing rule in `docs/APE_GOVERNANCE_DECISIONS_2026_10_10.md:35-44` (D70): the Miking stage plans draw almost no cables, so nothing in Miking exercises it. In the code, "D69" is used for the cable rule, but the governance doc numbers it D70 (see 1.4f).

---

## 1. MIKING (`src/screens/lab/miking/`)

### 1.1 What draws or describes wiring

| Where | What |
|---|---|
| `lessons/shared/speakers/DiPath.tsx` (used by `electric/ampPages.tsx`, `keys/keysPages.tsx`) | Amp and keys signal path. The air lane (instrument→pedals→amp→speaker cable→cab→air→mic→desk) is drawn separately from the DI-box lane and the amp-direct lane. `badPatch` draws "SPEAKER OUT → DESK: NEVER". |
| `lessons/shared/speakers/StagePlan.tsx:306-340` `SignalChain`/`CHAIN` (SPK lesson, `spk/pages.tsx:589,607`) | Player→amp→cab→air→mic, plus a "di" lane that drops from the amp, i.e. the amp's direct out to the desk. |
| `lessons/shared/speakers/StagePlan.tsx:206-212` | Plan view: a DI box on the floor behind the combo, with one cable to "the amp's back panel". |
| `lessons/shared/guitars/StagePlan.tsx:109-125` `DiPlan` | Guitar tail jack → DI box cable. |
| `lessons/shared/speakers/BacklinePlan.tsx:249-305` | Pedalboard patch cables; `PlanDiBox` (XLR out at one end, in/thru jacks, ground-lift switch). |
| `lessons/shared/speakers/chainIcons.tsx:12-45,409-510,979-1021` | Icons: passive DI (XLR male + ground lift), amp rear-panel direct out (XLR line out, lift, ¼"), mic with its XLR plug, instrument cable. |
| `lessons/shared/monitoring/cueMix.ts` + `CueMixPlan.tsx` (every STUDIO plan) | One personal headphone mixer per station, each with its own feed cable in its own lane to a "CONTROL ROOM" distribution box, plus phones cords. |
| `lessons/shared/broadcast/RoutingPanel.tsx` + `routing.ts`, `feeds.ts` (B01–B17) | Broadcast routing matrix: sources × destinations (PA, monitor, phones, program, stream, recorder, IFB, talkback, press box, remote return). Feed states: mic key, mix-minus, IFB, crowd, official's mic, private circuit. |
| `engine/scene/LavLead.tsx`, `f09LocationSpeech/lavRun.tsx`, `broadcast/bodyWorn.ts:198-245`, `BodyWornArt.tsx` | Lav cable: broadcast loop at the clip, secondary taped loop, dashed run under clothing to the bodypack input. |
| `engine/scene/PlacementScene.tsx:640,902,1069-1201` | Cable taped along a boom pole; cable clipped under a desk arm. Stand-mounted mics draw no cable. |
| `engine/chain/ChainRack.tsx` + `measure/chains.ts`, `measure/chainsSystems.ts` (F11–F16) | Measurement chains: capsule/preamp → power → input → record. Refusal rules cover polarization, constant-current and phantom. |
| Text-only, many lessons | Phantom (≈1,900 hits), polarity (≈2,300), stage box, monitor sends. Examples: `e10HornSection/lesson.ts:231-237,569` (digital stagebox gain sharing); `e10HornSection/art.tsx:52`; `e09CompleteBand/lesson.ts:222,516,586`; `m11Kit/lesson.ts:224-561`. |

**Not equipment (avoid false hits):** `EnsembleStage.tsx:143 stageBox()`, `ensembleModel.ts:71` and `micselect/MicSelectLabScreen.tsx:1161 styles.stageBox` are layout and viewbox names.

### 1.2 Where the truth lives as data (testable)

- **Air vs electrical path:** `lessons/shared/speakers/signalChain.ts`
  - `ChainSpec {pedals, rig, diBox, ampDirect, icons}` (`:22-35`)
  - `buildChain()` gives `nodes{id,kind,lane:'air'|'di'|'amp',col}` and `links{from,to,kind:'instrument'|'speaker'|'air'|'mic'|'balanced'|'line'}` (`:38-62`)
  - `patchVerdict(Out, In)` returns `'ok'|'check'|'stop'`, with `OUTS`/`INS` (`:68-78`)
- **Measurement chains:** `engine/chain/chainModel.ts` has `ChainSpec{slots,rules,briefs}`, `checkChain`, `validateChain`, `passable`. Data:
  - `measure/chains.ts:21 MEAS_CHAIN` (rules `:66-72`), `:100 FIELD_MATCH`, `:165 METER_CHAIN`, `:277 ROOM_CHAIN`
  - `measure/chainsSystems.ts:19 SYSTEM_CHAIN` (rule `:61` "never return meas mic to PA"), `:93 PRODUCT_CHAIN`, `:176 ARRAY_CHAIN`
- **Broadcast routing:** `broadcast/routing.ts`
  - `DESTINATIONS` (`:42-53`), `RouteSource{kind, level:'mic'|'line', talker}`, `RoutingPlan{sources,dests,sends,openMics,needs}`
  - `routeProblems()` (`:85-115`), with codes echo, speakerLoop, missing, ambienceInPa, talkbackOnAir, doubleMic
  - Press box `connect()` (line in, isolated mic outs)
- **Sport feeds:** `broadcast/feeds.ts`: `FeedState{key,ret,crowd,official,priv}`, `FEED_HOME`, `ON_AIR`, `feedPlan()`.
- **Plan cables:** `lessons/shared/planFoot.ts:27 PlanCable{id,kind,pts,from,to}`
  - `cueMix.ts`: `cueLayout` / `cueFeeds` / `cueCables` / `cuePhones`, constants `CUE_LANE{gap:80,first:110}`, `CUE_HUB`, `CUE_MIXER`. Cable kinds are `'cueFeed'` and `'phones'`.
  - `speakers/stagePlanModel.ts:87 DI_CABLE` (`kind:'instrumentCable'`, from `'dibox'` to `'cab'`)
  - `guitars/stagePlanModel.ts:195 diCable()`, `:226 guitarPlanCables()`
  - Aggregated per plan in `lessons/shared/planCases/*.ts` (`cables:` field). Every **stage** case is `cables: []` except the guitars DI cable; spk has `DI_CABLE` in both scenes.
- **Body cable:** `bodyWorn.ts:211 LOOPS`, `:221 cablePull()`, `:243 lavLead()`; `engine/model/types.ts:364-370 Rim.lead`.
- **Mic state and power:**
  - `engine/model/types.ts:343 MicState.polarity: 1|-1`
  - `:494 SetupPairData.B.polarity`
  - `:611 SetupChoice.power: 'none'|'phantom'|'pack'` (≈1,227 setup choices)
  - `engine/physics/twoMic.ts` (`effectivePolarity`, `oppositeSign`, `deltaTms`, `notchesHz`)
  - Shared items in `engine/model/sharedItems.ts` (`noPhantom`, `polarityKeepsDelay`, `OPPOSITE_SIDES_POLARITY`, `POWER_REASON`…)

### 1.3 Technical claims (quoted)

- **Speaker output:**
  - `signalChain.ts:12-16`: "a SPEAKER output goes to a speaker cabinet ONLY, by a speaker cable — never to a mic input, a line input or an ordinary DI".
  - `ampPages.tsx:679`, `keysPages.tsx:691`: "Never patch a speaker output into a mic input, a line input or an ordinary DI".
  - `i11bWurlitzer/lesson.ts:138`: "A specially rated load device can take it, but fitting one is technician work".
- **DI and amp direct:**
  - `ampPages.tsx:677`: "A DI or the amp's direct output is an electrical copy taken earlier in the chain: its own source, not a copy of the mic."
  - `signalChain.ts:8-10`: DI "THRU on to the amp, its balanced output to the desk". `patchVerdict('diOut','micIn')='ok'`.
- **Ground lift:** `ampPages.tsx:756`: "a DI's ground-lift switch, which lifts only the audio ground at its XLR, is a different, normal control". `c02GuitarAmp/lesson.ts:416-424`: swap cables, then the DI's ground lift; never pull the mains earth.
- **Polarity** (consistent everywhere):
  - "Polarity flips the sign; it does not remove a delay".
  - "there is no fixed 'correct' polarity for every rig" (`m04cTimbales/lesson.ts:58`).
  - Snare top/bottom "start opposite… flipping one is a common first thing to try, never a rule" (`m02Snare/lesson.ts:61`).
  - Open-back cab: "the back of the cone sounds out behind, opposite in polarity" (`ampPages.tsx:491`).
- **Phantom:**
  - "Mute the outputs and lower monitoring before connecting, disconnecting or switching it".
  - "a dynamic needs none".
  - Miniature condenser "needs phantom power through its adapter".
  - Ribbons: "follow the model's own manual" (`a03Horn/lesson.ts:175`, `i11aRhodes/lesson.ts:188`, `e16BigBand/lesson.ts:162`).
  - Bodyworn: "no bodypack lav straight into 48 V phantom except through its specified adapter" (`bodyWorn.ts:41-43`).
- **Measurement:** "Phantom power is not a polarization supply"; a constant-current preamp "is not automatically compatible with ordinary 48 V phantom" (`chains.ts:69-70`).
- **Stagebox and split:** "A digital stagebox may share headamp gain and pads across every feed: agree who sets them, and take an unprocessed feed for the recording… never lift a protective mains earth" (`e10HornSection/lesson.ts:234,569`).
- **Monitor feeds:**
  - Keep room and audience mics "out of the monitor sends" (`e09CompleteBand/lesson.ts:222,516`; `m10Room/copy.ts:94`).
  - "decide monitor feeds with the system operator" (`m04cTimbales/lesson.ts:251-253`).
- **Broadcast:**
  - Remote return = "program MINUS their own voice (mix-minus)".
  - Talkback "kept off the air".
  - Press box "takes one line-level mix and gives each reporter an isolated mic-level output" (`routing.ts:42-53`).
  - "line into a mic input overloads; mic into a line input is too quiet" (`routing.ts:31-34`).
- **Studio monitoring:** "Real studios monitor through headphones, not wedges" (`cueMix.ts:4`). Each mixer is fed "by its own cable (a network or snake line)".

### 1.4 Wrong or questionable

- **a. `speakers/StagePlan.tsx:206-212` + `stagePlanModel.ts:13,34-35,85-87`.** The DI box behind the combo is cabled to "the amp's back panel". The cable is typed `kind:'instrumentCable'` and goes `to:'cab'`.
  - It is ambiguous which back-panel jack this is. The SPK item `spk/lesson.ts:689` calls it "a direct (DI) output from inside the amp". On many combos the back-panel jack is the speaker or extension-speaker output, which this same lab says must never feed a DI.
  - No cable is drawn from the guitar into the chain or from the DI's XLR out to a stage box.
  - Professionals would want the jack labelled (line/direct out), or the DI placed before the amp (guitar → DI in, thru → amp front input).
- **b. `measure/chains.ts:82,93` ("Plain phantom power is not a measurement mic's supply").** This is stated universally and is wrong in general: many measurement mics (XLR electret types used for system tuning) run on standard 48 V phantom. It is only true for the lab-grade prepolarized (CCP/IEPE) and externally polarized capsules this chain models. Suggest scoping it, e.g. "not this chain's supply".
- **c. Speaker-level sources.** `signalChain.ts:69` `patchVerdict('speakerOut', anything but cabinet)='stop'`, and the model has no speaker-rated DI or load-box input. Text elsewhere qualifies it ("ordinary DI", "rated load device… technician work", `i11bWurlitzer/lesson.ts:138,618`). Calling a rated load box or speaker-level DI "technician work" is conservative but not wrong.
- **d. Monitor-mix absolutes.**
  - `ensemble/voiceGroupItems.ts:12` "choir and group mics never go into the singers' own monitor mix" (explain at `:69`) is stated as an absolute. Some choir mic in wedges, at low level and with care, or in IEMs, is common practice.
  - `cueMix.ts:4` "Real studios monitor through headphones, not wedges" is a convention presented as universal: control-room tracking and speaker playback exist.
- **e. `broadcast/routing.ts`.**
  - `routeProblems` flags `echo` only for `remoteReturn`. A remote talker's own voice sent to `ifb` is not flagged, although IFB words (`:48`) say "the program".
  - `speakerLoop` is typed `'monitor'|'pa'` (`:81`) but only `'monitor'` is ever checked.
- **f. Decision-number mismatch.** The governance doc has D69 = "Controls at the bottom" and D70 = "Cable drawings are traceable". Code comments cite **D69** for cable lanes:
  - `cueMix.ts:16`, `CueMixPlan.tsx:14`
  - DJ: `dj/art/cables.tsx:3`, `dj/geometry/mapGeometry.ts:16`, `dj/art/vinylArt.tsx:379`, `dj/art/parts.tsx:568`
  - `PStagePlan.tsx:22` / `pstagePlanModel.ts:13` cite D70 for wedges.
  - `AGENTS.md:29` lumps D67–D70 together.
- **g. D70's own rule** (doc `:42`), "Monitor sends leave from the SAME side as the snake / stage box, with a MON → snake return lane", is a site-layout convention written as universal. No Miking art implements a snake, stage box or monitor-send line, so there is nothing to check it against.

### 1.5 Existing checks and gaps

| Test | What it checks | Gap |
|---|---|---|
| `test/mikingLab4Amps.test.ts:171-185` | `patchVerdict` matrix (speakerOut only to cabinet; nothing else into cabinet; diOut→micIn ok); `buildChain` air order; speaker links only to cab; DI nodes off the air lane | Does not check the plan art (`DI_CABLE` endpoints / jack identity) |
| `test/mikingPlanCollisions_20261015.test.ts:100-155,180` | One `cueFeed` per mixer; one phones cord per seat; no cable through a footprint; cue feeds never cross or come within `CUE_LANE.gap/2` (40 mm); labels clear of cue cables | D70's "concentric corners", square turns, tie intervals, service loops, power ⟂ signal are untested. Stage plans carry `cables: []`, so no mic/snake/monitor-send cables exist to test |
| `test/mikingLab6Measure.test.ts:153-179`, `mikingLab6Systems.test.ts:341` | `validateChain` on every chain; the 5 refusal rules; phantom refusals carry the pinout safety line | — |
| `test/mikingLab7Broadcast.test.ts:175-188` | Each `routeProblems` code | No test for echo via `ifb` |
| `test/mikingLab7bSpeech.test.ts:93-126` | `feedPlan` states; private circuit never on air | — |
| `test/mikingLab7BodyCamera.test.ts:201-210,248-249` | `cablePull`, phantom safety wording, doubleMic | — |
| Power in setup briefs: `mikingLab1Drums:132`, `mikingLab2Cymbals:279`, `mikingLab4Guitars:153`, `mikingLab4Keys:105`, `mikingReviewFixes:101-105`, `mikingOwnerDecisionsL_20261008:139-145` | "NO phantom" brief ⇒ phantom setups not ok; bodypack = `'pack'` | Per-lab only. Nothing app-wide checks `SetupChoice.power` against the mic types in the label (e.g. "vocal dynamic" setups at `e07SingerInstrument/lesson.ts:489-490` carry `power:'phantom'`) |
| — | — | No test of `MicState.polarity` copy vs `twoMic` physics beyond physics tests (`mikingPhysics.test.ts`). No grep ratchet for universal phrasing ("never", "always") in monitor/phantom copy |

---

## 2. MIXING (`src/screens/lab/mixing/`)

### 2.1 What draws or describes routing

- `begArt.tsx`:
  - `FlowArt` (`:541`): the 8 stations as gear, cabled in signal order once solved.
  - `SpaceArt`: post-fader sends into one plate return.
  - `TermsArt`.
  - `PrePostArt` (`:998`): IN → EQ → COMP → PRE tap → fader → POST tap → mix.
  - `DoubleRouteArt` (`:1071`).
- `advArt.tsx:2-21,104-131,220-271`: channel strips (inserts at top, sends above the pan pot), and wires drawn "its own stroke with square turns… parallel lanes, never merged".
- `advFigures.tsx` `ParallelArt`.
- Pages:
  - `pagesC.tsx:242-388`: auxes and subgroups, pre/post, the double-route detective.
  - `pagesAdvA.tsx:52-83`: post-send, subgroup vs VCA.
  - `pagesAdvB.tsx:21-80` (parallel, multibus), `:209` (sidechain), `:240` (phase/polarity).

### 2.2 Data

- `engine/routing.ts`:
  - `CHANNEL_PATH` (`:25-34`): source, clipgain, inserts, fader, sends, bus, mixbus, output.
  - `STATION_ORDER`, `isChannelOrderCorrect`, `firstOrderMistake`.
  - `PATH_TRUTHS` (`:86-147`) with fields `carriesAudio`, `sumsChannels`, `remoteGainControl`, `isCopy`, `isRenderedFile`.
  - Console graph `Channel{faderDb,mute,out,sends{levelDb,tap},vca}`, `Subgroup`, `AuxReturn`, `Vca`.
  - Functions `mainPathGain`, `sendPathGain` (`:228`), `pathsToMix`, `vcaSilences` (`:257`).
- `engine/advanced.ts`: `combNotchesHz` = (2k+1)/(2Δt), `combPeaksHz`, correlation, `nullsWhenSummed`.
- `pagesC.tsx:246` `CUE_CONSOLE` (lead: verb post −8, cue pre −4).

### 2.3 Claims

- "A send is an adjustable COPY: the dry track keeps playing" (`pagesC.tsx:228`).
- "Audio flows THROUGH a subgroup… A VCA is remote control for the channel gains" (`pagesC.tsx:294`, `pagesAdvA.tsx:81`).
- "cue mixes are usually pre and effects are usually post (convention)" (`pagesC.tsx:350`). This one is correctly hedged.
- "Parallel means dry PLUS wet — real summed energy" (`pagesAdvB.tsx:75`).
- "Drawn here as a split inside the insert… just as often a send to a bus… or the compressor's MIX knob" (`pagesAdvB.tsx:65`).

### 2.4 Questionable

- **a. `routing.ts:226`: "mute follows the console convention: pre-fader keeps feeding the send".** No single convention exists. On many consoles (most digital desks, e.g. X32-class) and in several DAWs, channel mute also kills pre-fader sends; some analog desks leave pre sends live. `sendPathGain` hard-codes one behaviour and `test/mixingEngine.test.ts:102` pins it. It should be labelled console-dependent.
- **b. `CHANNEL_PATH`.**
  - It is DAW-centric: there is no input trim/preamp stage, and "SENDS" is a single post-fader station.
  - The order check is strict-exact, so a learner who places a pre-fader send before the fader is marked wrong. The blurb does hedge ("the pre-fader exception comes later").
  - Pan sits before sends; whether post sends follow pan is DAW-dependent.
- **c. `PATH_TRUTHS` bus has `sumsChannels:false` (`:88-96`).** A bus routinely sums; the "subgroup vs bus" distinction is a teaching simplification.

### 2.5 Checks

- `test/mixingEngine.test.ts:37-131`: six terms, channel order, pre/post/mute/VCA, double route. `:177` covers polarity cancelling a doubled track.
- `test/mixingAdvanced.test.ts`: the advanced engine.
- `test/begMixingArt_20261016.test.ts`.
- **Gaps:**
  - No traceable-cable or lane check on `advArt` / `begArt` wires, despite the comment claiming the rule.
  - No check that `FlowArt` draws exactly `STATION_ORDER`.

---

## 3. MIXING GUIDES (`src/screens/lab/mixingGuides/data/guides/*.ts`, hand-edited per `AGENTS.md:34`)

### 3.1 Content

Text only: DI, polarity and monitoring lines inside the per-source table fields (`source`, `notes`, `live`, `studio`) and in bullet `text`. There are no diagrams.

### 3.2 Data

Fields `notes`, `live`, `studio`, `text` per guide. Index at `data/index.ts`.

### 3.3 Claims

- Bass "DI and amp mic blended" (`g03-rock.ts:36,100`; `g23-hard-rock.ts:36,100,306`).
- "Always get a DI from the guitar even if the player wants only a mic" (`g34-folk-singer-songwriter.ts:327`).
- "often DI only in wedges" (`g34-folk-singer-songwriter.ts:304`).
- "Motown's custom DI" (`g22-soul.ts:39`).
- "Check polarity between the two dhol mics; they face opposite directions" (`g30-punjabi-pop-bhangra.ts:316`).

### 3.4 Questionable: conflicts with the Miking lab's "no fixed correct polarity" rule

- `g47-bluegrass-americana.ts:330`: "Align pickup and mic (polarity flip, 0.5–2 ms delay)". This bundles a polarity flip into time alignment, which the Miking lab explicitly teaches against.
- `g38-salsa.ts:126`: Timbales (under) "Flip polarity against top mics". Timbales are single-headed with an open bottom, so an under mic is not a second membrane and inversion is not implied.
- `g42-turkish-pop.ts:107`: Darbuka bottom/port mic "Flip polarity and check alignment". The port is not an opposing membrane.
- `g23-hard-rock.ts:82` and `g27-punk-pop-punk.ts:80`: snare bottom "polarity-flipped" as a given. Miking says "a common first thing to try, never a rule".

### 3.5 Checks

`test/mixingGuides*.test.ts` and `mixingProNote_20261008.test.ts` contain no routing, polarity or DI assertions. **Gap:** a polarity-wording ratchet ("flip" must be paired with "check") across the guides.

---

## 4. MIC/SPEAKER (`src/screens/lab/micspeaker/`)

- Practically no wiring content.
  - `viz.tsx:1943`: an "XLR stub" on the capsule art.
  - `MicPrinciplesLabScreen.tsx:1147`: "cable tugs… travel THROUGH solids into the capsule" (handling noise).
  - `SpeakerCoverageLabScreen.tsx:153,662`: delay speakers "time-aligned to the mains", labelled "CONCEPTUAL MODEL".
- No phantom, preamp or routing claims.
- No wiring tests apply. `test/fullScreenMicSpeakerTube.test.ts` is UI only.

## 5. MIC SELECT (`src/screens/lab/micselect/`)

- **Screen:** `MicSelectLabScreen.tsx:474-504` `PowerStep`, a mic → cable → "PREAMP" box with a "48 V" badge lit per case.
- **Data:** `micSelectData.ts:584-616`, `POWER_CASES{key,name,kind,powered,lines}` and `POWER_NUANCE`; also `:58,73,79,89,109,307-310`.
- **Claims:**
  - Passive moving-coil: "No powering required… Plug in anywhere with a mic input."
  - Passive ribbon: none, with the caveat that active ribbons need power.
  - Condenser: "most commonly 48 V phantom", with the nuance that some use batteries, lower-voltage phantom, plug-in power or proprietary supplies.
  - Ribbon limitation: "mis-wired phantom can damage the ribbon" (`:109`).
- **Art:** `micArt.tsx` draws an XLR tail on the stick mics and cables on the lav, headworn and boundary mics.
- **Questionable:** minor only. Tube condensers need their own PSU and multipin cable; this is only implied by "proprietary powering". Otherwise accurate.
- **Checks:** none found for `POWER_CASES`. **Gap:** a node test pinning powered/unpowered per kind.

---

## 6. Highest-value test targets

1. Make `SetupChoice.power` agree with the mic kinds named in each setup label, across all lessons, not per lab.
2. Assert the SPK `DI_CABLE` endpoint is a labelled direct/line out, never the speaker output (via `patchVerdict`).
3. Make `routeProblems` flag own-voice into `ifb`, and implement or remove the `'pa'` speakerLoop case.
4. Apply a lane, corner and no-merge check to `advArt` / `begArt` wires and to any future Miking stage cables.
5. Add a polarity-wording ratchet across `mixingGuides`.
6. Scope the "Plain phantom power is not a measurement mic's supply" sentence.
7. Mark the pre-fader-send mute behaviour as console-dependent in the model and its test (`routing.ts:226`, `test/mixingEngine.test.ts:102`).
8. Reconcile the D69/D70 citations in comments.
