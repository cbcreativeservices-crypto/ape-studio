<!-- Phase 0 inventory (read-only agent report, 2026-10-20). Findings are claims to verify, not decisions. -->
# Wiring inventory — remaining labs (modular, digital, mastering, de-esser, amp, calc, FX, tube, meter, foundations…)

# Wiring and signal-flow inventory: in-scope labs (branch dj-lab, read-only)

All paths below are under `/home/user/ape-studio/`. Lab files are in `src/screens/lab/` and tests are in `test/`.

**Most important findings:**
- `checkMonitorPath` accepts a power amp placed before the D/A converter.
- The mastering chain art draws USB straight from the DAW into any device.
- The Gate lab's catalog blurb promises "sidechain", but the Gate lab has none.
- The Digital lab's simplified chain drops the preamp, and its gain model has the preamp clip before the converter.

## Step 1: Classification

| Lab | Class | Reason |
|---|---|---|
| `ModularLabScreen.tsx` + `modular/` | **a** | Draws a Eurorack case with live patch cables, separating audio from CV/gate |
| `digital/` | **a** | Draws the ADC chain blocks (MIC→PREAMP→AA→S&H→QUANT→ENC→PCM), a gain-staging model and the mic lead |
| `mastering/` | **a** | Monitoring-path builder (DAW→DAC→controller→amp→speakers) with drawn USB/line/speaker cables; mastering chain order in the engine |
| `deesser/` | **a** | Main path vs side-chain diagram, with an audio copy and a dashed control line |
| `amp/` | **a** | Supply→device→load diagram, transformer, gain chain SOURCE→MIXER→AMP→OUT→SPK, bridging, speaker-cable rack scenarios |
| `foundations/` | a (minor) | A drawn cable from the room mic to the scope input (`viz.tsx:1917-1926`) |
| `FxLabScreen.tsx` / `fxLabConfigs.tsx` / `fxAnim.tsx` | **b** | Text only: "source → effect → output"; detector model; wet/dry and parallel mix |
| `calc/` (workspaces) | **b** | Text and math only, no diagrams (no SVG anywhere in `calc/`). Covers 70 V taps, speaker loads, cable loss, transformer, pads, mic→preamp gain |
| `tube/` | **b** | Tube families say "front of the chain" and "into the output transformer"; otherwise device physics |
| `meter/` | **b** | "Meters read the point where they are inserted"; 0 VU vs dBFS; converter clipping |
| `labCatalog.ts` | **b** | Blurbs (Modular "signal flow and patching", Gate "sidechain") |
| `roomdesign/` | c | Speaker placement only; the monitor rear leads are decorative (`studioPlanArt.tsx:34-38,95-97`) |
| `eq/` | c | Filter curves only, no routing |
| `envelope/` | c | ADSR, transients and dynamic range |
| `speech/` | c | Vocal physiology and mic distance |
| `wave/` | c | Wave propagation |
| `amplitude/` | c | Amplitude orientation |
| `cymatics/` | c | Mechanical exciter and plate; no electrical chain |
| `drumtuning/` | c | "signal" means the waveform; "wires" means snare wires |
| `tuning/` | c | Temperament |
| `eartraining/`, `EarLabScreen.tsx` | c | Listening drills |
| `kit/` | c | Navigation and lab-end infrastructure |
| `FmLabScreen.tsx` | c | Carrier/modulator synthesis maths, no patching |
| `OscillatorLabScreen.tsx`, `NoiseLabScreen.tsx`, `BassLabScreen.tsx` | c | Tone and noise sources |
| `AutotuneLabScreen.tsx`, `BinauralLabScreen.tsx` | c | Pitch correction; binaural "bus" text only |
| `Harmonograph*`, `Harmonic*`, `AudioLearningScreen.tsx`, `LabCategoryScreen.tsx`, `LabShell.tsx` | c | Visuals, hubs and shell |

## Step 2: Details for the (a) and (b) labs

### Modular Synth (`ModularLabScreen.tsx`)
- **Where the data lives:**
  - `Patch` type and `DEFAULT_PATCH`: `:109-135`
  - `PATCH_IDEAS` presets: `:138-170`
  - `RACK` module specs (`jacks[]` with `id/x/row/out/label`, `knobs[]`): `:808-921`
  - Cable routing logic `add(key, from, to, color)`: `:1041-1056`
  - Knob positions `knobPos`: `:928-962`
  - Lesson text: `src/features/lab/guidedLessons/content.ts:795-814`
- **Claims:**
  - The audio path is always patched VCO→VCF→VCA→OUT (`:1044-1046`).
  - "The envelope always opens the VCA" (env OUT→VCA CV1, `:1048`).
  - Env→cutoff goes through VCF CV1, an attenuverter whose centre means none (`:784,952`).
  - LFO goes to VCO "PITCH", described as exponential, "not linear FM" (`:863-866`), or to VCF CV2, or to VCA CV2.
  - SEQ CV goes to V/OCT and SEQ GATE goes to ENV GATE (`:785-786,1054-1055`).
  - "Each control cable … carries control voltage (CV) — it … makes no sound itself" (`:610-611`).
- **Questionable:**
  - The VCA is described as "a DUAL VCA, channel 1 normalled into channel 2" (`:897-900`, caption `:619-620`), but only one IN and one OUT are drawn. A real dual VCA has an IN and OUT per channel.
  - `content.ts:814` says "Pitch → cutoff → amp are the three places one control signal can go." That is over-general; in modular, CV can patch anywhere (PW, resonance, rates). It is only true of this lab's engine.
  - The "Raw Drone" lesson says "wide-open VCF" (`content.ts:810`), but the preset cutoff is 8 kHz (`:143`). That is the fader maximum, but the FREQ knob draws at about 0.89 of the engine's 60 Hz–14 kHz range (`:948`). Minor.
- **Tests:** `test/modularCase_20261016.test.ts:30-43` pins the cable endpoints: env outA/outF, seq cv→voct and gate→env gate, and no input jack taking two cables. There is no test that each `PATCH_IDEAS` preset yields the expected cable set.

### Digital Audio (`digital/`)
- **Where the data lives:**
  - `FULL_STAGES` (MIC, PREAMP, AA FILT, S & H, QUANT, ENCODE, PCM): `vizChain.tsx:132-140`
  - `SIMPLE_STAGES` (MIC, FILTER, CONVERTER, DATA): `vizChain.tsx:142-147`
  - `BLOCK_INFO` (purpose/io/failure for each block): `modules/modChain.tsx:49-104`
  - `GAIN_MODEL` (railDb 3, analogClipDb 0.5, digitalOverDb 1.9): `vizChain.tsx:778-788`, mirrored in `modChain.tsx:106-122`
  - Home banner `PATH` and chain text: `DigitalLabHomeScreen.tsx:28,93-95`
- **Claims:**
  - The preamp "Raises mic level to line level. THE gain decision" (`modChain.tsx:58`).
  - Analog clipping at the preamp "happens first in the chain" (`:60`).
  - The anti-aliasing filter must come before sampling (`modAnalog.tsx:404-415`).
  - S&H is "a CONVERTER operation — not what the DAC outputs" (`:70`).
  - Float headroom does not undo ADC clipping (`:487`).
  - Oversampling moves the first image to N×48 kHz (`modDac.tsx:192`).
- **Questionable:**
  - **The gain model has the preamp clip about 1.4 dB before ADC full scale, taught as a rule** ("happens first", `modChain.tsx:60`; ADC_CHECK `:124-135`). On most interfaces the ADC hits 0 dBFS before the analog stage clips, so this depends on the design and should be framed that way.
  - **The SIMPLIFIED chain drops PREAMP** (`vizChain.tsx:142-147`: mic → filter directly), and so does the home text (`DigitalLabHomeScreen.tsx:93`, "microphone → analog voltage → anti-aliasing filter"). Both are inconsistent with `FULL_STAGES`.
  - The analog anti-aliasing filter is shown as a discrete block before S&H, which is the classic Nyquist-rate model. Modern ΔΣ converters do most anti-aliasing digitally (oversample, then decimate), and this is never mentioned.
  - The home `PATH` ends "RECONSTRUCTION › SOUND" with no amplifier or loudspeaker. Minor.
- **Tests:** `fullScreenDigitalGain20260930.test.ts` and `bugPassLabsGroupA20260930b.test.ts` reference the chain files for layout only. Neither test pins stage order or GAIN_MODEL.

### Mastering (`mastering/`)
- **Where the data lives:**
  - `renderVersion` chain "tilt → width → drive → limiter → trim → (safety ceiling)": `masteringEngine.ts:171-195`
  - `PATH_DEVICE_NAMES` and `checkMonitorPath`: `masteringEngine.ts:560-620`
  - Cable art `cableFor` and `ChainArt`: `mastArt.tsx:426-489`
  - The UI adds devices in tap order, up to 5 slots: `modules/mod3Room.tsx:39-55`
  - Content: `masteringContent.ts` ("There is no required chain" `:41`; m4 "playback → conversion → level → amplification → air" `:126`; dither last `:199,226`)
- **Bugs and questionable items:**
  - **`checkMonitorPath` has no rule ordering the DAC against the power amp.** `['daw','amp','dac','passive']` returns ok and grade minimal. Trace: no controller, so only a soft note; amp before passive; speakers last. A power amp ahead of the D/A converter passes.
  - **`cableFor` (`mastArt.tsx:427-431`) returns `'usb'` for every DAW→X link.** It draws USB from the DAW into a power amp or directly into monitors. `['daw','active']` is accepted as "works" (test `masteringLabEngine.test.ts:126-127`) and drawn as a USB cable into an analog active monitor.
  - Every other link is drawn as "line", including DAC→passive, though that chain fails validation anyway.
- **Correct:** dither applied once and last; SRC before word-length reduction; Red Book 16-bit/44.1 kHz; active monitors plus an external amp flagged as wrong.
- **Tests:** `masteringLabEngine.test.ts:118-150` covers many orders. It has no amp-before-DAC case and no DAW→amp case. `cableFor` is untested.

### De-Esser (`deesser/`, model in `src/features/deesser/deEsserModel.ts`)
- **Where the data lives:**
  - `PATH_MAIN` (in, gain, out): `deEsserModel.ts:189-193`
  - `PATH_SIDECHAIN` (bpf, det, thr, gc): `deEsserModel.ts:195-201`
  - `CONNECTIONS`: `deEsserModel.ts:207-213`
  - Diagram: `deEsserViz.tsx:340-390`
  - Quiz on where the band-pass sits: `DeEsserLabScreen.tsx:236-240`
- **Claims:** the band-pass is "NOT in the signal path"; it only shapes what the detector hears. The side-chain tap is an audio copy (solid line); the control line is dashed.
- **Questionable:** split-band mode is shown only as the gain-box label "gain · hiss band" (`deEsserViz.tsx:371`). No crossover or band split is drawn in the main path. This is a simplification.
- **Tests:** `deEsserModel.test.ts:89-91` pins the side-chain order and the main-path gain element.

### Amplifiers (`amp/`, model and content in `src/features/amp/`)
- **Where the data lives:**
  - Transformer function: `ampModel.ts:153-176` (Zp/Zs = (Np/Ns)², verified)
  - `bridge` (Vload = vA − vB, per-channel Z/2): `ampModel.ts:199-203`
  - `evaluateGainStructure`: `ampModel.ts:576-584`
  - Rack scenarios: `ampContent.ts:440-505`
  - Misconceptions `common-ground` and `bridge-4x`: `ampContent.ts:163-176`
  - 70 V quiz: `ampContent.ts:253-257`
  - Diagrams: `modules/mod2Devices.tsx:59-134` (supply→device→load, transformer), `mod5ClassD.tsx:36,65-120` (AUDIO IN→MODULATION→SWITCHING→OUTPUT FILTER→SPEAKER, half-bridge drawn as a closed circuit), `mod7RealWorld.tsx:44-77` (GainChain), `:292-336` (bridging)
- **Claims, all checked correct:**
  - The 70 V transformer "taps down".
  - Bridged output "each channel sees ≈ Z ÷ 2".
  - Never assume output negatives are common.
  - Instrument cable is wrong as speaker cable.
  - Upstream clipping leaves the amp's CLIP light dark.
- **Debatable:**
  - Rack 7 (`ampContent.ts:502`) answers "CLIP flickers on the loudest peaks only" as "normal". Many engineers would trim it back.
  - Rack 2 says bridge "wired to CH1+ and CH2+". That is right for binding posts; the Speakon bridged convention (pins 1+/2+ on the CH1 connector) is not mentioned.
- **Tests:** `ampModel.test.ts` covers impedance, transformer and bridge maths. The rack scenarios are not tested.

### Calculator (`calc/workspaces/`)
- **70 V / 100 V lines** (`speakers.ts:692-880`): load = Σtaps; amp ≥ Σtaps·10^(hr/10); I = Σtaps/V; "more speakers" = floor((Prated/10^(hr/10) − Σtaps)/tap). The worked example (`:710-714`) checks out: 120 W, 151 W, 1.7 A, 7 more, 13 to 100%.
  - **Gaps:** no tap-impedance maths (Z = V²/P_tap), no transformer-rating check, and no 70 V line-loss. Yet `speakers.ts:626,642` recommends "switch to a 70 V line", and the cable-loss workspace only models low-impedance runs.
- **Other examples, all verified:**
  - Parallel and series loads (`speakers.ts:271-430`), including the 4 Ω ∥ 8 Ω example where the 4 Ω box gets two-thirds of the power (`:283-286`).
  - Cable loss: 30 m of 16 AWG gives 0.79 Ω and damping factor ≈ 10 (`:476-478`).
  - Transformer: 600→150 Ω is a 2:1 ratio (`powerElec.ts:72-73`).
  - Mic to preamp: −51.7 dBu needs 56 dB of gain (`splSafety.ts:828-830`).
  - T- and Pi-pad formulas (`powerElec.ts:144-236`).
- **Tests:** `calcCheckA_20261003.test.ts` (item A8, the 70 V negative-capacity case) and the many `calc*` bug-pass suites.

### FX labs (`FxLabScreen.tsx`, `fxLabConfigs.tsx`)
- **Claims:**
  - The audio-path caption is `source → effect → output` (`FxLabScreen.tsx:758`).
  - Distortion MIX at 50% is "PARALLEL" (`fxLabConfigs.tsx:1278,1335`).
  - Compression "2:1 GLUE … mix-bus setting" (`:912`).
  - Chorus at 100% wet becomes vibrato (`:565-571`).
- **Gaps and mismatches:**
  - **`labCatalog.ts:350` advertises Gate/Expander as covering "sidechain"**, but the GATE LAB config (`fxLabConfigs.tsx:1020+`) has no key or sidechain input.
  - None of the FX labs teach insert vs aux send. Reverb and delay offer "100% WET" (`:266,398`) with no note that this is the send/return convention. The only nods are `content.ts:124` ("high-pass the send") and `:630`.
- **Tests:** `fxLabFullScreen.test.ts`, `dynamicsFollower.test.ts`, `labArtFix3EqDist_20261016.test.ts` cover UI and DSP, not routing.

### Tubes (`tube/`)
- **Where the data lives:** `tubeRefs.ts:62-65` (family notes), `:80-130` (roles).
- **Claims:** preamp tubes provide "voltage gain at the front of the chain"; power tubes drive "current into the output transformer"; directly heated triodes give "classic single-ended sound"; rectifiers turn "AC → DC for the B+ supply"; 12AT7 is "preamp & phase inverter". All acceptable.
- **Note:** the lab teaches no full guitar or hi-fi amp signal path (preamp → phase inverter → push-pull → output transformer → speaker). That is a gap if the audit expects one.

### Meters (`meter/`)
- **Claims:**
  - 0 VU is a reference (classically +4 dBu), not a ceiling (`modMeterA.tsx:622-632`).
  - True peak and inter-sample peaks, with a −1 dBTP delivery ceiling (`:771,850`).
  - "Meters read the point where they are inserted" (`modMeterC.tsx:625`).
- **Questionable:** "Pink noise … a straight downward slope on this log display" (`modMeterB.tsx:205,221`). That is only true on a constant-bandwidth FFT; pink noise reads flat on a 1/3-octave RTA. The wording should name the display type.

### Foundations (`foundations/`)
- **Claim:** the mic sits directly above its scope input and the cable drops straight down, so the probe is the same x in both graphs (`viz.tsx:1917-1926,2045-2057`). This is consistent.
- **Tests:** none specific to the cable.

## Cross-cutting test gaps
- No test pins the Digital chain order or the preamp placement.
- No test pins mastering amp-vs-DAC order or `cableFor`.
- No test checks the catalog blurbs against lab content (the Gate "sidechain" mismatch).
- No test for 70 V tap impedance.
- No test that each Modular `PATCH_IDEAS` preset produces the expected cables.

