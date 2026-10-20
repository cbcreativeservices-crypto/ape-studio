<!-- Phase 0 inventory (read-only agent report, 2026-10-20). Findings are claims to verify, not decisions. -->
# Wiring inventory — Signal Chain, Gain, Sound Systems, Production

# Wiring and signal-flow audit inventory: ape-studio, branch `dj-lab`

This was read-only; nothing was edited. Several labs keep their truth outside the folders you named (`src/features/soundsystems/*`, `src/features/production/*`, `src/features/lab/guidedLessons/content.ts`, `modules/ape-dsp`), so those files are covered too.

**Most important findings:**
- **A1 – the "amp is the last stage to clip" target is wrong at the model's defaults.** At its default settings the gain model makes the amplifier the *first* stage to clip, while the "ok" verdict says it is the last.
- **A2 – Sound Systems Build cannot see console routing.** A build can pass with the console bypassed, because links carry no bus or output identity.
- **A6 – the insert-point order is taught as universal** when it varies by console.
- **A5 and A7 – the app contradicts itself** on whether pre-fader sends follow the mute, and on where the troubleshooting walk starts.
- **Signal Chain lab – stale and mixed-message lesson text.** The lesson calls the comp-before-gate order "the canonical studio order" while its own mistakes list says the gate usually goes first.

---

## 1. Signal Chain Builder: `src/screens/lab/SignalChainLabScreen.tsx`, `src/screens/lab/chainRack.tsx`

### 1.1 What it draws or describes
- **Single page instrument (`labId="chain"`).** The stage draws `ChainRack`: nine half-rack units, three per row, joined by one patch cable from SRC through every unit to OUT (`chainRack.tsx:144-189`).
  - Bypassed units stay in place, dimmed.
  - Jacks are drawn on the panel sides (`chainRack.tsx:224-234`).
  - Dynamics units show GR LEDs (`chainRack.tsx:100-104`).
- **Five scenarios** (`SignalChainLabScreen.tsx:139-162`): `bass_comp`, `delay_reverb`, `gate_click`, `squash`, `full`.
- **Three check questions** (`SignalChainLabScreen.tsx:173-210`).
- **Lesson text** in `src/features/lab/guidedLessons/content.ts:609-649`: `whatItIs`, `controls` (`display`, `module_toggle`, `chain_order`, `gain_staging`, `gain_reduction`), `commonMistakes`, `formula`.

### 1.2 Where the truth lives (data a test could target)
- **`MODULES: ChainUnit[]`** (`SignalChainLabScreen.tsx:74-84`). Fields: `id` (FX id), `label`, `setting`, `knobs[]` (0..1), `gr?` (`'comp'|'gate'|'limiter'`), `grMax?`.
- **Chain order** is the array order. It must match:
  - `FX` in `modules/ape-dsp/index.ts:569-579` (eq 0 … limiter 8);
  - `fx::Id` in `modules/ape-dsp/ios/core/Effects.hpp:29-39`;
  - the processing order in `EffectChain::processStereo` (`Effects.hpp` ~732-743). I checked: they agree.
- **`DEFAULTS: Record<fxId, {fx,param,value}[]>`** (`SignalChainLabScreen.tsx:90-133`). The knob positions in `MODULES.knobs` are derived by hand from these values. They are consistent today; no test checks this.
- **`SCENARIOS`** (`SignalChainLabScreen.tsx:139-162`). Fields: `key`, `enable[]`, `sourceIdx`, `hot[]`, `lesson`.
  - `hot[i]` means "the cable INTO `MODULES[i]`"; `units.length` means "the cable into OUT" (`chainRack.tsx:124`).
  - Current values: `bass_comp` hot `[1]` (EQ→COMP), `delay_reverb` `[6]` (DELAY→REVERB), `gate_click` `[2]` (COMP→GATE), `squash` `[1,8]` (EQ→COMP and STEREO→LIMIT).
- **`CHAIN_CHECKS`** (`SignalChainLabScreen.tsx:173-210`): `question`, `options`, `correctIdx`. Answers are 1 (GR rises), 2 (limiter last), 1 (delay→reverb differs).

### 1.3 Claims made
- "EQ before compression changes what the compressor reacts to" (`:142`, `:175-183`, `content.ts:625`).
- Limiter: "Last — the final safety ceiling before the output" (`:191-195`). Also "a brickwall limiter anywhere but the end voids the true-ceiling guarantee" (`content.ts:631`).
- "Reverb→delay would echo the WASH instead: order is a creative choice" (`:146`, `:199-207`).
- "this engine's fixed order runs COMP before GATE, while on a real console you would usually gate FIRST" (`:508-510`). The same point appears in `content.ts:626`.
- "reverb/delay usually go after dynamics (or on sends)" (`content.ts:627`).
- The fixed order is called "the canonical studio order" (`content.ts:620`, `module_toggle`).

### 1.4 Wrong or questionable
- **The lesson contradicts itself.**
  - `content.ts:620` says a bypassed module occupies "the canonical studio order", and `content.ts:621` calls it "The fixed, canonical order".
  - But the order puts COMP before GATE, which the screen (`:508`) and the mistakes list (`content.ts:626`) both say is *not* the usual practice.
  - "Canonical" is also used for EQ-first and modulation-before-time-effects, which are guitar-pedal and plugin conventions, not universal ones.
- **The `display` definition is stale** (`content.ts:619`). It says "Each pill is a module you can toggle… the GR meters below". The display is now drawn rack units, the toggles are in the dock, and the GR is shown on each unit.
- **"true-ceiling guarantee"** (`content.ts:631`). A sample-peak brickwall limiter does not guarantee a true-peak ceiling; that needs oversampling. The wording overstates it.
- **The limiter teaching default "ceiling −25 dB"** (`:83`, `:130`) is an odd value for a "ceiling" because the generator plays at −20 dB (`:47`). It makes the limiter work on almost anything. That works for teaching, but it is not a realistic setting.
- **Rack drawing:** the patch jacks are drawn on the front-panel sides (`chainRack.tsx:224-234`). Outboard gear is patched at the rear. This is stylised, not a factual error.

### 1.5 Automated checks
- **Tests that touch these files only check plumbing:**
  - `test/labEndsAndBanner_20261014.test.ts:79` (ReviewLabEnd);
  - `test/perfLabsA_20261003.test.ts:84`;
  - `test/patternP10b_20261002.test.ts:251`;
  - `test/labsGroupBBugPass3_20260930.test.ts:38`;
  - `test/labsGroupBBugHunt20260930.test.ts:78`;
  - `test/labSoundAudit20260929.test.ts:66`;
  - `test/perfStartTrim_20261004.test.ts:437`.
- **Not checked:**
  - `MODULES` order against `FX` or against the native processing order;
  - `DEFAULTS` against the knob positions;
  - `hot[]` indices pointing at the cables the lesson text names;
  - the `CHAIN_CHECKS` answers;
  - the lesson text against what the engine actually does (for example comp before gate).

---

## 2. Gain Staging Lab: `src/screens/lab/gain/`

### 2.1 What it draws or describes
- **Module registry** (`gain/modules/registry.ts:29-38`): `intro`, `input`, `follow`, `lowhigh`, `fadervsgain` (LEARN, in `modLearn.tsx`); `multistage`, `freeplay`, `troubleshoot` (in `modExplore.tsx`).
- **The chain is drawn as channel-strip sections** in `gainGear.tsx` (header `:1-31`):
  - mic → preamp (with 48V and Ø buttons) → EQ → COMP → channel fader → group fader → master fader → nearfield monitor;
  - the mic→preamp hop is drawn as an XLR cable; the rest is a printed flow line (`gainGear.tsx:192-195`, `StageLink`).
- **`ChainStage` columns** are the live layout (`gainViz.tsx:~330-440`), drawn INPUT ▸ … ▸ OUTPUT.
- **Dead code:** `DeviceCard`/`DeviceCable` (`gainViz.tsx:476-551`) draw TRS patch cables between rack devices, but nothing uses them. The header (`gainViz.tsx:10-16`) still says modules 6–8 use them.

### 2.2 Where the truth lives
- **`gainEngine.ts`.**
  - Constants: `CLIP_CEIL=0`, `HOT_EDGE=-6`, `LOW_EDGE=-24` (`:15-19`); `SOURCE_NOISE=-52`, `STAGE_SELF_NOISE=-48` (`:23-24`).
  - `Stage{key,name,kind,gain,min,max,adjustable}` (`:57-66`).
  - `computeChain(sourceLevel, stages) → ChainNode{key,kind,level,region,stageClipped,distorted,noise,gain,gainMin,gainMax}` (`:99-135`). Distortion latches downstream.
  - `regionFor` (`:37`), `verdictFor` (`:138`), `chainIsHealthy` (`:157`), `snrFor`/`snrLossDb` (`:172-182`), `symptomFor` (`:205-263`), `latchAdvance`, `computeTake`, `takeSymptom`, `SOUNDCHECK_TAKE` (`:265-381`).
- **The full chain's order and ranges** (`modExplore.tsx:42-56`, `fullChain`, `STAGE_RANGES`): Preamp 0..40 → EQ ±12 → Comp ±12 → Channel Fader −30..+10 → Bus ±12 → Master −30..+6.
- **Troubleshoot faults** (`modExplore.tsx:336-360`, `FAULT_KEYS`, `makeFault`): base preamp +20, so −10 at every point. One stage is pushed to clip: pre 34–40, eq/comp/bus +12, fader +10.
- **LEARN scenarios** (`modLearn.tsx:330-334`): `low{pre:2,out:24}`, `high{pre:36,out:-16}`, `bal{pre:18,out:0}`.

### 2.3 Claims made
- "A fader sets LEVEL, not quality… Fix clipping where it occurs — at the input gain" (`modLearn.tsx:450-454`).
- "Every dB of gain lifts the noise a stage was handed… Set a healthy level EARLY" (`modLearn.tsx:316-318`).
- "no magic −18 rule is taught" (`gainEngine.ts:11`). Also "There's no magic number to hit" (`modLearn.tsx:197-199`).
- "CHANNEL FADER TOO HOT — pushed so far up it overloads right at the fader" (`modExplore.tsx:343`).
- "BUS OVERLOADED — the sum tips over the ceiling at the bus" (`modExplore.tsx:344`).
- The console strip is the chain "top to bottom: GAIN, EQ, dynamics, channel fader, group fader, master — then the monitors" (`gainGear.tsx:6-9`).
- "48V (off: a dynamic mic needs none)" (`gainGear.tsx:~185`).
- Cap colour "console convention: grey = channel, blue = group, red = master" (`gainGear.tsx:~73-75`).

### 2.4 Wrong or questionable
- **One ceiling for every stage.** Every stage clips at the same relative 0 (`gainEngine.ts:15`). Faders and buses "overload" (`modExplore.tsx:343-344`).
  - A passive analog fader cannot clip, and an internal fader or bus on a floating-point digital console effectively never clips.
  - "A fader that overloads is still an overload" (`gainEngine.ts:224-226`) is true only for some architectures, but it is taught generally.
- **"Bus … the sum tips over"** (`modExplore.tsx:344`). The model has one channel, so no sum exists; the bus is just another gain stage.
- **`symptomFor` blames the converter** (`gainEngine.ts:217-221`) whenever the clipping stage is the last node ("that is the converter… digital clipping"), whatever its `kind`.
- **Dynamics placed after EQ is presented as "the chain"** (`gainGear.tsx:6-9`, `modExplore.tsx:42`). Many consoles switch dynamics before or after EQ. The fader cap colours vary by maker. The output ends at a studio nearfield monitor, which fits a studio chain, not live sound.
- **"A real channel is a rack of separate devices"** (`modExplore.tsx:188`) contradicts the drawing, which shows sections of one channel strip.
- **The `gainViz.tsx:10-16` header** describes TRS-cabled DeviceCards that no screen renders.

### 2.5 Automated checks
- **`test/gainEngine.test.ts`** covers regions and boundaries, `meterFill`, `computeChain` propagation and the clip latch, the noise model (gain early beats gain late), `verdictFor` and `chainIsHealthy`.
- **`test/gainEmulatorPass_20261014.test.ts`** covers layout and units only.
- **Not checked:**
  - `symptomFor`, `snrLossDb`, `latchAdvance`, `computeTake`, `takeSymptom`, `SOUNDCHECK_TAKE`. None of these are tested or called from any screen; they are dead code.
  - That `makeFault` always clips the master.
  - The `fullChain` order.
  - That the drawn gear matches the stage kind.

---

## 3. Sound Systems Lab: `src/screens/lab/soundsystems/`, truth in `src/features/soundsystems/`

### 3.1 Pages and scenes that draw or describe routing
Page counts come from `units.ts:18-24`: LEARN 22, BUILD 11, ROUTE 8, OPERATE 5, TROUBLESHOOT 6.

**LEARN, chapters 1–7 (`pagesLearnA.tsx:538-544`)**
- SYSTEM: `chapterOneMap` in `art/SystemMap.tsx:472-521`. Stage sources go into a stagebox or snake, then to the console; the house side is either processor → amps → passive tops/subs, or powered tops plus a "SUB OUT"; AUX 1 · PRE goes to a monitor amp and wedge; AUX 2 · STEREO goes to the IEM transmitter.
- TRACE: the nine stations, `benchMap` (`SystemMap.tsx:525-548`).
- TYPES, MATCH, OUTPUTS, CHOOSE, ROUTING (`ROUTING_TOOLS`).

**LEARN, chapters 8–15 (`pagesLearnB.tsx:853-860`)**
- SUB FEED (`SUB_FEEDS :40-68`, `SubFeedRouter` in `diagrams.tsx:393`).
- SUB PLACE.
- MONITORS (`MONITOR_KINDS :273-278`).
- SPLITS (`SplitDiagram` in `diagrams.tsx:332`).
- WIRING (`LEVELS :450-456`, `PAIRS :458-465`).
- LOADS, POWER, DEPLOY.

**LEARN, chapters 16–22 (`pagesLearnC.tsx:628-634`)**
- GAIN (`ChainMeterStage`, `operate.ts` model), COVER, ALIGN, TUNE (`PROC_BLOCKS :346-356`), FEEDBACK, METHOD, WRAP.

**ROUTE (`pagesRoute.tsx`)**
- Channel anatomy: `STATIONS :48-57` and the `ChannelStrip` drawing (`diagrams.tsx:103-166`).
- Pre/post sends; which-tool; four wedge mixes; subgroups and DCA; mute groups with PFL/AFL; matrices; the output patch (`DESTINATIONS :620-627`).

**BUILD (`pagesBuild.tsx`)**
- The venue plot (`art/VenueView.tsx`; cable colours `LEVEL_COLOR :102`).
- Ten capstones, graded live.

**OPERATE (`pagesOperate.tsx`)**
- Power sequence, line check, gain structure, ring-out, shutdown.

**TROUBLESHOOT (`pagesTroubleshoot.tsx`)**
- 22 faults walked station by station.

### 3.2 Where the truth lives
- **`types.ts`.**
  - `SignalLevel` (`:16`).
  - `GearKind` (`:18-37`).
  - `SlotRole`/`SlotId` (`:42-77`).
  - `Placed{id,kind,slot}`, `Link{from,to,level}`, `SoundSystem{placed,links}` (`:79-96`).
  - `STATION_ORDER` (`:111-121`).
- **`gear.ts:171-402`, `GEAR: GearSpec{kind,accepts[],emits[],roles[],many,source,radiates,blurb,from,to}`.** These are the port-level rules. Key rows:
  - DI accepts instrument/line, emits mic (`:196-208`).
  - Snake accepts and emits mic/line (`:233-242`).
  - Stagebox accepts mic/line/digital, emits digital/line (`:243-253`).
  - Console accepts mic/line/digital, emits line/digital (`:254-264`).
  - Processor accepts and emits line only (`:265-275`).
  - Amp accepts line, emits speaker (`:276-287`).
  - Powered speaker accepts line, emits line (LINK) (`:288-300`).
  - Passive speaker, passive sub and wedge accept speaker (`:301-352`).
  - IEM transmitter accepts line, emits wireless (`:366-377`).
- **`system.ts`.**
  - `SLOTS` with plot x/y (`:37-71`).
  - `LEVEL_PRIORITY` (`:93`).
  - `inputCapacity` (`:97-123`): amp 2, processor 4, IEM transmitter 2, speakers 1.
  - `canConnect` (`:136-178`): refuses speaker level into anything but a speaker input as `unsafe`; uses snake pass-through levels; allows the console↔stagebox/snake return path.
  - `mismatchReason` (`:191-210`), `trace` (`:271-289`), `chainTo` (`:301-311`, follows the first upstream feed only), `feedsThrough` (`:338`).
- **`console.ts`.**
  - `Channel{faderDb,mute,toMain,subgroup,sends{aux:{db,tap}},dca,muteGroups}` (`:32-46`), plus `Aux`, `Subgroup`, `Dca`, `Matrix{inputs}`.
  - `sendContribution` (`:139-147`): pre-fader follows the mute; pre ignores the fader and DCA level.
  - `mainContribution` (`:119-128`): double routing reads +6 dB.
  - `matrixBus` (`:176-194`).
  - `ROUTING_TOOLS` (`:261-328`) with booleans `carriesAudio`, `sumsChannels`, `isCopy`, `remoteControl`, `mixesBuses`.
  - `WHICH_TOOL` (`:345-422`), `bandConsole()` (`:426-482`).
- **`configs.ts`.**
  - `FEEDS` (`:22-36`).
  - `OUTPUT_CONFIGS` (`:69-175`): 13 configurations; `layout{slot,feed,kind,aimDeg,coverDeg,delayMs}`.
  - `SYSTEM_TYPES` (`:200-305`) with `chain[]` gear in signal order.
  - `VENUE_CASES` (`:316-325`).
- **`capstones.ts:139-310`.** `Requirement{id,kind:'build'|'route',test(s,cs)}`; predicates at `:50-133`.
- **`faults.ts`.**
  - `FaultCase{reads: Record<Station,Reading>, faultAt, startAt, options, correct}` (`:36-63`).
  - `OK` readings (`:65-75`).
  - `FAULTS` (`:88-~720`).
- **`operate.ts`.**
  - `SETUP_SEQUENCE` (`:16-37`), `POWER_UP`/`POWER_DOWN` (`:44-59`).
  - `GAIN_STAGES{clipDbu,noiseDbu,unity,min,max}` (`:96-113`).
  - `computeGainChain` (`:141-173`), `gainVerdict` (`:185-191`).
- **Other model files.** `loads.ts` (`parallelLoad`, `loadVerdict`, `ampMatch`, `wattsIntoLoad`, `delayMs`), `coverage.ts`, `faderTaper.ts` (`CONSOLE_TAPER :25-33`), `check.ts` (`SOUND_SYSTEMS_CHECK :190-289`).
- **Wiring page truths are computed by the engine** (`pagesLearnB.tsx:467-484`). The six `PAIRS` give OK / refuse / refuse / OK / refuse / OK.

### 3.3 Claims made (representative)
- **Levels.**
  - Mic "a few millivolts (−60 to −40 dBu)" over balanced XLR; instrument "tenths of a volt, high impedance, unbalanced" on TS, "short runs only, then a DI"; line "about a volt (+4 dBu nominal)" on balanced XLR or TRS; speaker "tens of volts… Speaker cable with speakON — never a signal cable" (`pagesLearnB.tsx:451-454`).
  - "+4 dBu sits at about −18 dBFS" (`pagesLearnC.tsx:71`).
- **Amps and passive speakers.** Amp output "must only ever meet a passive loudspeaker… Passive loudspeakers over speaker cable. Never a line input" (`gear.ts:283-285`). Speaker level into a line input is refused as UNSAFE, "damages the input" (`system.ts:153-158`, `check.ts:199-204`).
- **Processor and subs.**
  - The processor sits between console and amps and holds the crossover, system EQ, delay, polarity and limiters (`gear.ts:272`).
  - Passive sub: "The crossover must be done upstream — in the processor" (`gear.ts:334`).
  - Crossover at 80–120 Hz (`pagesLearnC.tsx:350`, `faults.ts` crossover fix).
- **Sends and console tools.**
  - Pre-fader aux for monitors; post-fader for effects and aux-fed subs (`console.ts:281`, `pagesRoute.tsx:129-130`, `:53`).
  - A DCA carries no audio; pre-fader sends ignore it; a DCA mute silences (`console.ts:296-305`).
  - A matrix mixes whole buses after their masters (`console.ts:175`, `:307-316`).
- **Channel strip order:** input/preamp → HPF → EQ → INSERT → fader/pan/mute → sends → assign → direct out (`pagesRoute.tsx:48-57`, `diagrams.tsx:111-118`).
- **Double routing** (direct plus subgroup) is "the double-routing fault… about 6 dB louder, bypassing the group's insert" (`console.ts:19-21`). The strip text says "one or the other, never both" (`pagesRoute.tsx:55`).
- **Power and gain.**
  - Power up: sources and console first, amps last; power down is the mirror (`operate.ts:44-59`, `check.ts:248-253`).
  - Amp sensitivity "full output at about +4 dBu in… attenuator sits around −12… the amplifier must be the LAST stage to clip" (`operate.ts:108-111`).
- **Delay.** 30 m ≈ 87 ms; "arrives together with the mains" (`check.ts:262-267`, `configs.ts:161-164`, `faults.ts` delay-time).
- **Loads.**
  - Bridging "DOUBLES the minimum impedance (typically 8 Ω)" (`pagesLearnB.tsx` Loads Body).
  - An 8 Ω box "dips to 5–6 Ω" (`loads.ts:80`).
- **Coverage.** Two mains "add about 3 dB there, not 6" (power sum) (`coverage.ts:21-22`).

### 3.4 Wrong, questionable, or inconsistent

**A1. The default gain chain contradicts "amp is the last stage to clip"** (`operate.ts:108-112`, `:203`, `:33`).
- At defaults (preamp 40, everything else at unity, amp −12), a −30 dBu peak gives:
  - console stages at +10 dBu, so the preamp has 10 dB headroom (+20 clip) and the faders 12 dB (+22);
  - the amp input at −2 dBu against its +4 clip, so only **6 dB** headroom.
- The amplifier is therefore the *first* stage to clip, yet `gainVerdictCopy('ok')` says "the amplifier attenuated so it is the last thing to clip".
- The comment's own numbers also fail: a +20 console peak minus 12 is +8 > +4.
- `test/soundSystemsEngine.test.ts:609-612` passes "amp last to clip" only by setting `amp: -16`. The "professional target" test at `:596-599` uses the defaults and checks only `'ok'` and no clipping.

**A2. Build links carry no bus or output identity, so console routing is never verified at graph level.** (No connector or cable type is modelled either: a `Link` holds only `level`.)
- A console→amp link cannot say Main versus Aux 1, so "wedge fed from an aux" is never checked in BUILD.
- `stagebox` emits `line` unconditionally. So mic → stagebox → processor/amp/powered speaker is "live" even with the console unconnected.
- Capstone requirements check `count(console)===1` and `live`, but never that sinks are reached *through* the console (`capstones.ts:61`, `:181`, `:265-271`). Capstone 4 (`stereo-subs`) and capstone 9 (`outdoor`) can pass with the console bypassed.
- An empty snake defaults to emitting `mic` (`system.ts:182-185`).
- Stereo is not modelled. The reference build drives L and R tops from one amp fed by one processor link (`test/soundSystemsEngine.test.ts` `stereo-subs` reference).

**A3. Delay alignment with no precedence (Haas) offset.**
- "arrives together with the mains" and `delayMs: 87` (`configs.ts:161-164`, `check.ts:262-267`, `faults.ts` delay-time) are pure distance/c.
- Common practice adds roughly 5–15 ms so the mains stay the perceived source. This is taught as the whole answer.

**A4. "+4 dBu ≈ −18 dBFS"** (`pagesLearnC.tsx:71`).
- EBU R68 puts 0 dBu at −18 dBFS; SMPTE RP155 puts +4 dBu at −20 dBFS. Consoles differ (for example 0 dBFS = +24 dBu gives +4 at −20 dBFS).
- Taught as a single universal fact. The healthy-reading text "around −18 dBFS, peaks near −8" (`faults.ts:69`) is also a convention.

**A5. Pre-fader send versus mute: the app contradicts itself.**
- `console.ts:12-17` says pre-fader sends follow the mute "the consoles technicians actually meet — analog and digital".
- `pagesRoute.tsx:54` and `:216` say "the classic analog rule left them running".
- The `ChannelStrip` drawing puts the PRE tap point (y=124) *above* the FADER · PAN · MUTE block (y=138), i.e. visually pre-mute, which disagrees with the engine (`diagrams.tsx:120-150`). The drawing also shows the direct out leaving only from POST (`:146-149`), while the text says pre or post "by setting" (`pagesRoute.tsx:57`).

**A6. Insert point taught as post-EQ** (`pagesRoute.tsx:51-52`, `diagrams.tsx:115`).
- Many analog consoles insert post-preamp/HPF and *pre-EQ* (most compact analog desks). Digital desks are configurable.
- Presented as universal signal order.

**A7. The troubleshooting prose disagrees with the fault data.**
- `pagesTroubleshoot.tsx:284`: "'nothing anywhere, but every channel meter is dancing' starts at the console output".
- But `faults.ts:91` (`nothing`) has `startAt: 'consoleIn'`.

**A8. "One or the other, never both"** (`pagesRoute.tsx:55`) and the double-routing "fault" (`console.ts:19-21`). Deliberate parallel routing (for example drums direct plus a crushed group) is a standard technique. A strong default is presented as a rule.

**A9. Speaker cable "with speakON — never a signal cable"** (`pagesLearnB.tsx:454`). This presents speakON as universal. Binding posts, banana plugs and ¼-inch TS speaker cables exist. The core point, that speaker cable is not an instrument cable, is correct.

**A10. Coverage power sum versus combing.**
- `coverage.ts:21-22` (pinned by `test/soundSystemsEngine.test.ts:582`) sums two mains as uncorrelated power (+3 dB).
- Two mains carrying the same mono signal are correlated, giving about +6 dB on the time-aligned centre line and combing off it.
- `configs.ts:84` ("the comb-filter zone down the middle") is also loose: on the exact centre line the arrivals are aligned; combing grows off-centre.

**A11. Stereo toe-in geometry** (`configs.ts:92`): "toed in about 18° so each one's inner −6 dB edge meets the centre line two-thirds back".
- With `mainL` at (44,122), aim +18° and 90° coverage (`TOP_L :64`), the inner edge is 63° off the audience axis and crosses x=180 at y≈191.
- On the 330-unit plot that is about one third of the way back, not two thirds. Worth verifying against the intended scale.

**A12. 2.1 configuration** (`configs.ts:106`): "One console output" while the layout feeds the tops `L` and `R` (stereo). Stereo through a sub's high-pass outputs needs two outputs.

**A13. Smaller inconsistencies.**
- Mic-to-line shortfall: "40–50 dB" (`pagesLearnB.tsx:534`) versus "40–60 dB" (`system.ts:195`).
- "Five signal levels" (`pagesLearnB.tsx:534`); the type has 7.
- "Every refusal in BUILD mode is one of these three sentences" (`pagesLearnB.tsx:534`) and "refuses a link for one of three reasons" (`pagesBuild.tsx:264`). The engine has more refusal reasons: self-link, into a source, duplicate, no output, wireless-only.
- The sub aux lists "kick, bass, floor tom, keys" (`console.ts:388`, `pagesLearnB.tsx:53`), but `bandConsole` has no floor-tom channel and `subAuxLowOnly` allows only kick/bass/keys (`capstones.ts:130`).
- "Aux-fed and matrix-fed subs get what you choose" (`pagesLearnB.tsx` sub-feed KeyFact). A matrix taking MAIN (as capstone 8 requires) sends the whole mix.
- Wedge "sits in the microphone's null, directly behind it" (`pagesLearnB.tsx:274`) is cardioid-only. The fault text correctly gives 110–125° for super/hypercardioid.
- The polarity fault is placed at the `speaker` station (`faults.ts:510`) but the fix is "re-terminate the cable" (`:525`).

**A14. Debatable conventions stated as fact.**
- "an underpowered amplifier… kills more high-frequency drivers" (`loads.ts:114`, `check.ts:241-246`, `pagesLearnB.tsx` POWER KeyFact). This is widely repeated and contested.
- `loadVerdict` calls a load exactly at the amp's rated minimum "marginal" (`loads.ts:69`).
- "8 Ω box dips to 5–6 Ω" (`loads.ts:80`). IEC 60268-5 allows a minimum of 80% of nominal (6.4 Ω).
- The speaker stage `clipDbu: 4` (`operate.ts:112`) mixes speaker level into a dBu chain.

### 3.5 Automated checks (`test/soundSystemsEngine.test.ts`)
- **Covered:**
  - the gear catalogue;
  - `canConnect` cases (mic→console OK; amp→powered speaker unsafe; console→passive names the amp; mic→amp names the preamp; capacity, loop, duplicate);
  - `trace`;
  - console truths (pre/post with mute; double routing +6 dB; dead-end subgroup; DCA; matrix);
  - load and delay calculators;
  - the fault library (healthy before the fault station, not healthy at it; forward walk);
  - capstones (10, empty venue fails, a reference build passes each);
  - configs and system types matching slot roles;
  - coverage (−6 dB edge, 6 dB per doubling, +3 dB overlap);
  - the operate gain chain and sequences;
  - the understanding check's shape.
- **Other tests:** `test/holdSoundSystems_20261014.test.ts` covers the fader taper and render memoisation; `test/pagedLabNav.test.ts` and others cover navigation and UI.
- **Not checked:**
  - That a live sink's path passes through the console, or which bus feeds which sink (A2).
  - That the default gain chain really makes the amp last to clip (A1).
  - That prose and data agree (A5, A7, A13).
  - The pre-tap position in `ChannelStrip` against `sendContribution`.
  - Insert order.
  - Toe-in geometry against the `configs.ts:92` claim.
  - Haas offset.
  - Correlated summation.
  - That page text quoting numbers ("87 ms", "−18 dBFS", "40–60 dB") matches the engine.

---

## 4. Rack framework: `src/screens/lab/rack/`

It has no routing or signal-flow model; it is UI chrome only (`RackUnit`, `ParamLane`, `DockTray`, `laneFeed.ts`, `stageFitMath.ts`). The only signal references are comments (`RackUnit.tsx:49`, "signal-flow strip"). Nothing to audit for accuracy.

---

## 5. Production Labs: `src/screens/lab/production/`, truth in `src/features/production/`

### 5.1 Screens
- `ProductionLabScreen`, `ProductionStageScreen`, `ProductionActivityScreen`, `ProductionPacketScreen` and `FieldRow` are form, readiness and packet UIs.
- No cable or signal drawings.
- The signal-flow content is all data in `src/features/production/preprod/stage5.data.ts`:
  - input list `:293-450`;
  - the "Signal Flow and Routing" section `:594-700`;
  - rules `:1000-1090`;
  - the "Build the input list" activity `:1236-1456`.

### 5.2 Where the truth lives
- **`technical.input_list` columns:** `in_capture` (dynamic/condenser/ribbon/di/line/wireless/playback/remote_feed), `in_phantom` (on/off/na), `in_channels` (1/2), `in_connection` (xlr/trs/ts/wireless/network/usb), `in_console`, `in_track`.
- **`technical.signal_path` columns:** `sp_from`, `sp_level` (mic/instrument/line/speaker/digital/network), `sp_via`, `sp_to`.
- **`split_method`** (passive/active/console_outputs/network).
- **Rule logic** in `preprod/logic2.ts`:
  - `technical-phantom-mismatch` (`:118-127`);
  - `technical-path-ends-nowhere` (`:137-154`);
  - `technical-level-format-conflict` (`:156-166`).
- **Activity checks** in `logic2.ts:400-450` (`build-the-input-list`: phantom correct; DI on XLR/TRS; stereo uses two channels).

### 5.3 Claims made
- "A stereo source is two rows or two channels, never one" (`stage5.data.ts:299`).
- "Phantom sent to a ribbon microphone, a line output or a playback device can damage some of them" (`:1027`).
- "Put a DI between instrument-level sources and the console" (`:1079`).
- "an unbalanced jack on a long run to the stage box… works badly" (`:1078`).

### 5.4 Questionable
- **The phantom rule fires for *any* ribbon with phantom on** (`logic2.ts:126`). Active ribbons (for example Royer R-122, AEA "A" series) require phantom, so this flags a correct setup. The prose says "check each ribbon's requirement" but the logic does not allow for it.
- **The level-format rule's prose promises more than the logic checks.** It mentions "a line output into a microphone preamp at full gain", but the logic only checks instrument-without-DI and line/playback on TS. Speaker level and mic-into-line rows in `sp_level` are never checked.
- **Two rules send learners to the wrong lab.** `learnMore: { route: "SignalChainLab" }` on path-ends-nowhere (`stage5.data.ts` ~1066) and level-format-conflict (~1084) points at the FX processing-chain lab, which teaches neither system signal paths nor level matching. The Sound Systems wiring page or the Cable/Connector labs would fit.

### 5.5 Automated checks
- **`test/productionEngine.test.ts`.**
  - Phantom rule: condenser off fires, ribbon on fires, di/wireless are quiet, unanswered is quiet (`:1072-1087`).
  - Level-format rule: no DI fires, DI is quiet, unbalanced TS fires (`:1127-1137`).
  - The `build-the-input-list` activity's seeded state fails (`:1512-1513`).
- **Not checked:** active-ribbon exceptions, `sp_level` speaker/mic mismatches, or that `learnMore` routes are topically correct.

