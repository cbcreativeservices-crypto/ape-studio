# AP&E STUDIO — AUDIO LEARNING LAB & GLOSSARY LEARNING ECOSYSTEM
## MASTER Build-Ready Architecture Spec (self-contained)
**Date:** 2026-07-26 · **Version:** v4 (MASTER) · **Status:** 🟠 DRAFT / CANDIDATE — PENDING PROF. BOOTH APPROVAL
**Supersedes:** v1, v2, v3, and the two content companions (`…CONTROLS_AND_COMMON_MISTAKES_5LABS…`, `…COMMON_MISTAKES_11LABS…`) — all now **folded in** here (retired; kept for provenance).
**Author of record:** Prof. Channing Booth (vision) · drafted this session in Analysis Mode.

> **THIS IS THE SINGLE SOURCE OF TRUTH.** It consolidates everything authored this session: the 3-pillar architecture, the Glossary Learning Ecosystem, all 16 audio labs (full controls · displays · learning outcomes · challenges · **Common Mistakes** · Pro Tips · Formula), the Signal Chain Builder (+ inter-module mistakes), the Wave Physics Lab (15 modules + **Common Mistakes** + layers + measurement + Room Builder), the native/`ape-dsp` feasibility map, and the Wave-Physics engine feasibility numbers. All `[not enumerated]` placeholders are retired.
>
> **SCOPE POSTURE:** Commercial product. Academic course scope (MUSI 190 / AUDI 201) is **not** a factor. **Nothing is deferred** — the full suite is launch scope. §16 build order is engineering sequencing, not a cut list.
>
> **DECISIONS FOLDED IN (Prof. Booth, 2026-07-26):** (1) The **"Ear Training" study method is REMOVED** (plan/Dashboard/per-topic); Ear Training is now a **HOME-page card → Audio Learning Lab landing menu**, fully decoupled from graded progression (§13). (2) **Wave Physics GREEN-LIT on the 2D-hybrid path** (§11), scoped to teaching need.
>
> **HONEST-METRICS RULE (everywhere):** no fake/decorative meters; `EngineGate` grays a surface out when the native engine is absent — never a simulated needle. Overlays/difference views must not imply precision the engine didn't compute.
>
> **CONTENT NOTE:** control ranges/defaults and the mistakes/tips are **industry-conventional proposals** (high-confidence signal-processing fundamentals); opinionated calls are marked **[opinion]**. Nothing is invented requirement.

---

## TABLE OF CONTENTS
0. Executive summary
1. North star & requirement restatement
2. Acceptance criteria
3. Assumptions
4. The Unified Lab Shell
5. Cross-Lab Educational Features
6. Pillar A — Glossary Learning Ecosystem (anchor)
7. Pillar B — the 16 Audio Learning Labs (controls · displays · learning · challenges · **Common Mistakes** · tips · formula)
8. Pillar B capstone — Signal Chain Builder (+ inter-module Common Mistakes)
9. Pillar C — Wave Physics Laboratory (15 modules + **Common Mistakes**) + Room Builder
10. Wave Physics visual layers & measurement integration
11. Wave Physics engine — feasibility, RAM, processing, load, install
12. Native engine / `ape-dsp` feasibility map
13. Placement & navigation — Ear Training HOME card (study method REMOVED)
14. Decisions — made + owed
15. (reserved)
16. Build sequencing · Risks · Traceability

---

## 0. EXECUTIVE SUMMARY

The app becomes one continuous flow — **Learn It. Hear It. See It.** — with the **glossary term as the navigation hub** into every interactive capability. From a term the student can hear it, manipulate it in a lab, watch every analyzer respond, learn the theory (including **common mistakes** and pro tips), and prove mastery — without leaving the concept they started on.

Three pillars, all launch scope:
- **A — Glossary Learning Ecosystem (anchor):** per-term **Learning Profiles** + action row (**Hear It · Experiment · Watch It · Learn the Theory · Quiz · Related · 🚀 Launch Lab**). One tap configures generator + processor + analyzers + guided tutorial.
- **B — 16 Audio Learning Labs + Signal Chain Builder:** real-time DSP on played/generated/mic audio; shared Lab Shell; all analyzers live. The chain builder is the signature capstone.
- **C — Wave Physics Laboratory:** spatial acoustics simulation, 15 modules, all presets of one **Room Builder** engine.

**Placement:** Ear Training is a **HOME-page card** (sibling to Audio Tools) → the **Audio Learning Lab landing menu** → all labs. From a glossary term, Launch Lab / Hear It / Experiment / Watch It deep-link straight into a configured lab. Labs do not touch the graded progression system (§13).

**Engine:** native, extending the `ape-dsp` C++ core (iOS + Android/Oboe). Audio DSP is well-bounded (§12). **Wave Physics is green-lit on the 2D-hybrid path** (interactive 2D band-limited FDTD + geometric acoustics, §11), scoped to teaching need; an on-device spike validates sustained-GPU thermals + RAM (a checkpoint, not a go/no-go).

---

## 1. NORTH STAR & REQUIREMENT RESTATEMENT

**North star:** *Learn It. Hear It. See It.* The glossary is the primary navigation hub, not a reference book. Students move: read a concept → hear it → manipulate it → measure it → demonstrate mastery, all from the page where they met the term.

**The chain every lab reinforces:** hearing → visualization → physical understanding → measurement. Very few platforms let a student hear a change, instantly see it across multiple analyzers, and manipulate it. That triad is the differentiator.

---

## 2. ACCEPTANCE CRITERIA

**Per-lab "shippable" criteria (every lab & module):**
1. Runs the 7-step workflow (§4.1) end-to-end on-device, zero setup.
2. Audio path honest (no fake meters; `EngineGate` gray-out).
3. ≥1 guided challenge grades correctly.
4. Launchable from ≥1 glossary term with zero manual setup.
5. Analyzer readouts match a golden reference within tolerance (the `ape-dsp` golden-vector discipline).
6. **Guided Lessons present for every control, including a Common Mistakes entry** (non-optional).

---

## 3. ASSUMPTIONS (challenge any)
- **A1.** Full suite is launch scope; nothing deferred. §16 is engineering order only.
- **A2.** Audio DSP + analyzers extend `modules/ape-dsp/` (header-only C++17, shared iOS/Android-Oboe). Wave Physics is a separate native compute module.
- **A3.** Learning Profiles begin as bundled client config (no schema change); graduate to DB later.
- **A4.** Term-launched quizzes reuse the existing graded `quiz_questions` + `submit_quiz`; not a new grading engine.
- **A5.** Control ranges/defaults and mistakes/tips are conventional proposals to confirm; `[opinion]` marks the opinionated ones.
- **A6.** Visual rendering may use GPU (Metal/Vulkan/GLES compute) + Skia/GL; "native" constrains the compute (DSP + physics), not the render layer.

---

## 4. THE UNIFIED LAB SHELL (shared by every lab)

### 4.1 The 7-step workflow
1. Generate/load a sound (or place sources, for Wave Physics) → 2. Choose an effect/processor/environment → 3. Adjust parameters → 4. Watch every analyzer respond in real time → 5. Listen → 6. Answer guided challenges → 7. Compare before vs after.

### 4.2 Universal control bar (all ten, every lab)
**Reset · A/B Compare · Freeze Display · Overlay Original · Overlay Modified · Slow Motion · Peak Hold · Loop Playback · Solo Difference · Export Screenshot.**

### 4.3 Shared signal-source bank (every audio lab)
Pure sine · Dual sine · Pink noise · White noise · Speech · Male voice · Female voice · Kick · Snare · Hi-hat · Bass guitar · Electric guitar · Acoustic guitar · Piano · Strings · Full music · **Microphone input (live)**.

### 4.4 Standard analyzer set (labs pick their subset)
Spectrum · Waveform/Oscilloscope · Spectrogram · Waterfall · Harmonic · FFT · Energy Histogram · Peak · RMS · LUFS · Gain-Reduction · True-Peak · Phase Scope/Lissajous · Correlation · Vectorscope · Mid/Side · Stereo Image · Impulse Response · ETC · EDC · RT60 · Polar/Coverage · Pan meter.

---

## 5. CROSS-LAB EDUCATIONAL FEATURES (every lab)
- **"What Changed?"** — after a move: what changed visually? audibly?
- **Prediction Mode** — predict before the move, then compare to reality.
- **Hidden Controls** — the app secretly sets a value; student identifies it: Frequency · Gain · Delay · Ratio · Decay. (Graded challenge type.)
- **Overlay Mode** — Original / Current / Target simultaneously.
- **Guided Lessons (REQUIRED per control):** Definition · Animation · Formula · Practical uses · **Common mistakes** · Professional tips. The **Common mistakes** element is mandatory for every control.
- **Real-World Examples** — one tap reproduces a familiar sound to reverse-engineer: Telephone · AM Radio · Stadium PA · Church · Concert Hall · Podcast · Underwater · Car Interior.

---

## 6. PILLAR A — GLOSSARY LEARNING ECOSYSTEM (ANCHOR)

### 6.1 Term page = launch hub
Action row under each definition. Example — **Parametric Equalizer**:
`▶ Hear It · 🧪 Experiment · 📈 Watch It · 🎓 Learn the Theory · ❓ Quiz · 🔗 Related · 🚀 Launch Lab`

### 6.2 Action semantics (worked example — Parametric EQ)
- **Hear It** — listen-compare mode: Flat · +6 dB at 2 kHz · Narrow notch · Wide cut · High shelf · Low shelf.
- **Experiment** — opens the EQ Lab with the definition's exact parameter loaded (e.g. Pink noise · Notch · 1 kHz · Q = 20). No setup.
- **Watch It** — Spectrum overlaying Before/After/Difference; the notch appears.
- **Learn the Theory** — Animations · Common mistakes · Pro tips · Formulas · Math · Signal flow · History · Applications.
- **Quiz Yourself** — five concept-scoped questions.
- **Related Terms** — Graphic EQ · High-pass · Low-pass · Band-pass · Q · Bandwidth · Octave · Phase Shift · Comb Filter.

### 6.3 Other worked term examples
**Delay** — Hear: short/long/slapback/ping-pong/feedback · Experiment: time/feedback/mix/filtering · Visualize: waveform/echo-spacing/waterfall/spectrogram.
**Compressor** — Hear: none/2:1/4:1/10:1/limiter · Experiment: attack/release/threshold/ratio · Visualize: gain-reduction/waveform/envelope/loudness.
**Feedback** — Hear: slow/ringing/runaway · Experiment: move mic/move speaker/increase gain · Visualize: spectrum/peak-history/frequency-marker.
**Comb Filtering** — Hear: moving mic/speaker interaction · Experiment: move one source/delay one channel · Visualize: moving notches/FFT/phase.

### 6.4 Per-term Learning Profile (data model)
Only relevant actions light up. Examples: **Reverb** → Hear/Build/Measure/Visualize/Practice/Quiz/Compare/Troubleshoot/Animation/Common-Mistakes · **XLR Connector** → See/Identify/Inspect-Pinout · **Comb Filtering** → Hear/Experiment/Visualize.

```json
{
  "glossary_id": "<uuid>", "term": "Parametric Equalizer", "type_template": "filter",
  "actions": {
    "hear_it":     { "lab": "eq", "presets": ["flat","+6dB@2k","narrow_notch","wide_cut","high_shelf","low_shelf"] },
    "experiment":  { "lab": "eq", "load": { "source":"pink_noise","filter":"notch","freq_hz":1000,"q":20 } },
    "watch_it":    { "analyzers": ["spectrum"], "overlay": ["before","after","difference"] },
    "learn_theory":{ "assets":["animation","formula","math","signal_flow","history","applications"], "common_mistakes": true, "pro_tips": true },
    "quiz":        { "concept_scope": true, "count": 5 },
    "related":     ["Graphic EQ","High-pass","Low-pass","Band-pass","Q","Bandwidth","Octave","Phase Shift","Comb Filter"],
    "launch_lab":  { "generator":"1kHz","processor":"parametric_eq","analyzers":["spectrum","oscilloscope","harmonic"],"preset":"parametric_intro","tutorial":"eq_intro" }
  }
}
```

### 6.5 🚀 Launch Lab (one tap)
Reading *Parametric Equalizer* → Launch Lab → generator at 1 kHz · Parametric EQ enabled · Spectrum + Oscilloscope + Harmonic open · preset loaded · guided tutorial begins. Zero configuration.

### 6.6 Coverage strategy
Actions are **term-type-driven** via a `type_template` (`filter`, `time_fx`, `dynamics`, `modulation`, `distortion`, `stereo_phase`, `acoustics_wave`, `connector`, `measurement`, `concept`, `interval_ratio`, …). High-value terms get hand-authored presets/mistakes; the long tail inherits templates. This makes "every term is a hub" tractable across the whole glossary.

### 6.7 The interconnected ecosystem
`Glossary → Hear It → Experiment → Watch the Measurement → Learn the Theory → Practice → Quiz → Certificate Progress`. Glossary, Ear Training, Audio Tools, Tutorials, Labs, Quizzes, Certificates become one continuous experience.

---

## 7. PILLAR B — THE 16 AUDIO LEARNING LABS

> Each lab uses the Lab Shell (§4) + Cross-Lab Features (§5). Every control gets a Guided Lesson **including Common Mistakes** (inlined below). Feasibility tier per §12: **T1** primitives exist · **T2** standard net-new DSP · **T3** substantial subsystem.

### LAB 1 — EQUALIZER *(largest lab)* — T1–T2
**Signal sources:** Pure sine · Dual sine · Pink · White · Speech · Male/Female voice · Kick · Snare · Hi-hat · Bass · Electric/Acoustic guitar · Piano · Strings · Full music · Mic input.
**Manipulate:** Graphic · Parametric · Shelving · High-pass · Low-pass · Band-pass · Notch · Tilt · Dynamic EQ.
**Displays:** Spectrum · Waveform · Spectrogram · Waterfall · Harmonic · FFT · Energy Histogram · Peak · LUFS.
**Learning objectives:** Frequency · Bandwidth (Q) · Boost · Cut · Resonance · Slope · Octave width · Phase shift · Combining filters.
**Challenges:** Find 1 kHz · Remove 60 Hz hum · Reduce sibilance · Increase vocal presence · Remove muddiness · Match target response · Identify hidden EQ moves.
**Common Mistakes:** boost-sweep to *find* then forget to *cut* · boosting when a cut is cleaner (headroom/phase) · narrow Q for tonal shaping (rings) · forgetting minimum-phase EQ shifts phase (comb on multi-mic) · not high-passing non-bass rumble · EQ'ing in solo instead of in context · chasing a "flat" analyzer (ears decide) · static cut for sibilance (use a de-esser) · one wide cut for hum (notch the 50/60 Hz **harmonic series**) · recipe EQ without listening.
**Pro Tips:** cut to clean, boost sparingly to flatter, level-match A/B. Teach Q with pink noise (Q=0.7 vs 8).
**Formula:** Q ≈ Fc/bandwidth; slope 6/12/18/24 dB/oct (1–4 pole); shelf vs bell vs pass.

### LAB 2 — DELAY — T2
**Controls:** Delay time · Feedback · Wet/Dry · Ping-pong · Stereo width · Filtering · Modulation · Sync BPM.
**Displays:** Waveform · Impulse response · Spectrogram · Echo spacing · Stereo image · Waterfall · Phase.
**Learn:** Milliseconds · Tempo sync · Echo density · Slapback · Long delay · Multi-tap · Feedback runaway.
**Challenges:** Match delay time · Create slapback · Identify BPM from delay · Predict next echo · Find feedback threshold.
**Common Mistakes:** feedback too high → runaway/self-oscillation · delay fighting the tempo (sync/tap) · "slapback" set too long (true slapback ≈ 60–150 ms, one repeat, low feedback) · wet too loud on lead vocal · unfiltered repeats clutter (roll off highs/lows on repeats) · wide/ping-pong cancels in mono · confusing delay (discrete repeats) with reverb (diffuse wash).
**Pro Tips:** 1/8-dotted sync, ~25% feedback, wet low, highs rolled off. Use Freeze/Peak-Hold to predict the next echo.
**Formula:** delay ms = (60000 / BPM) × note-fraction; quarter-note ms = 60000/BPM.

### LAB 3 — REVERB *(incredible visually)* — T3
**Generate:** Impulse · Clap · Speech · Music · Drums · Noise burst.
**Controls:** Room size · Pre-delay · Decay · Diffusion · Early/Late reflections · HF/LF damping · Density · Mix.
**Displays:** 3D Waterfall · RT60 · Decay curve · Spectrogram · Impulse response · EDC · Room impulse.
**Learn:** Early/Late reflections · Reverberation time · Room size · Absorption · Reflection density · Flutter echo · Tail shape.
**Exercises:** Match a room · Guess RT60 · Find pre-delay · Remove muddy reverb · Compare hall vs plate.
**Common Mistakes:** too much reverb (washes/pushes back) · no pre-delay glues the source to the tail (use ~10–40 ms) · muddy tail (HPF the return + LF damping) · confusing room size with decay time (separate controls) · decay fighting tempo/space · one reverb on everything (kills depth) · reverb before fixing source problems (amplifies sibilance/boxiness) · sending sub/bass to the reverb.
**Pro Tips:** compare hall vs plate on one vocal; duck reverb under the phrase, bloom in gaps.
**Formula:** RT60 = 60 dB decay time; Sabine RT60 = 0.161·V/A (V m³, A sabins) — links to the Wave-Physics Absorption module.

### LAB 4 — CHORUS *(why chorus sounds "wide")* — T2
**Controls:** Depth · Rate · Delay · Voices · Stereo width · Feedback · Mix.
**Displays:** Waveform · Phase · Lissajous · Stereo field · FFT · Spectrogram.
**Concepts:** Modulation · Pitch variation · Time variation · Stereo widening · Comb filtering.
**Common Mistakes:** rate/depth too high → seasick, out-of-tune warble · confusing chorus (long delay ~15–35 ms, detuned voices) with flanger (short delay + feedback) or vibrato (100% wet) · 100% wet turns chorus into vibrato (needs dry to beat against) · wide stereo chorus thins/cancels in mono · using it purely as a width tool (phasey mono) · chorusing the bass (unstable/muddy).
**Pro Tips:** 2–3 voices, gentle depth, ~20 ms delay, ~30–40% mix. Show the Lissajous while widening.
**Formula:** dry + LFO-modulated, slightly pitch-shifted delayed copies; beating between detuned voices = "wide"; comb filtering on sum (worst in mono).

### LAB 5 — FLANGER *(perfect visually)* — T2
**Controls:** **Rate** (0.05–10 Hz, def ~0.2) · **Depth** (0–100%, def ~50%) · **Manual/Delay** (0.1–10 ms, def ~2 ms; sets notch spacing) · **Feedback/Regeneration** (−95…+95%, def ~40%; negative shifts the pattern) · **Mix** (0–100%, def 50%; deepest at 50%) · **LFO Waveform** (Triangle def/Sine/Log) · **Stereo/LFO phase offset** (def 90°) · **Through-Zero toggle** *[advanced, opinion]*.
**Displays:** Comb filter animation · Moving notches · FFT · Waveform · Spectrogram.
**See:** Why the notches move · Why sweep speed matters · Why resonance changes.
**Common Mistakes:** calling a long-delay/low-feedback patch a flanger (it's a chorus) · 100% wet removes the dry reference the comb needs (~50%) · too much feedback rings metallically · rate too fast (warble, not sweep) · testing on a sine (use pink noise to see the notches) · heavy stereo flange cancels in mono.
**Pro Tips:** dry=wet, feedback ~40%, slow rate; sweep Manual to hear spacing. Negative feedback = hollow "jet."
**Formula:** notches at f=(2k−1)/(2τ); spacing = 1/τ; as τ modulates, notches sweep together (evenly-spaced comb).

### LAB 6 — PHASER — T2
**Controls:** **Rate** (0.05–10 Hz, def ~0.3) · **Depth** (0–100%, def ~60%) · **Stages/Poles** (2/4/6/8/12, def 4; notches ≈ stages/2) · **Feedback/Resonance** (0–95%, def ~30%) · **Center/Manual** (~100 Hz–8 kHz, def ~1 kHz) · **Mix** (def 50%) · **LFO Waveform** (Sine def/Triangle) · **Stereo/LFO phase offset** (def 90°).
**Displays:** Moving phase cancellation · Phase response · FFT · Waveform.
**Learn:** All-pass filters · Phase shift · Cancellation · Resonance.
**Common Mistakes:** expecting flanger-style evenly-spaced notches (phaser notches are uneven & fewer — the defining difference) · too many stages on a busy source (mud) · 100% wet kills the dry reference · cranking resonance (whistles) · thinking a phaser is a delay (all-pass shifts phase, no echo) · testing on a sine.
**Pro Tips:** 4 stages = vintage, 8+ = lush. Sweep Manual with LFO off first to see notches as positions.
**Formula:** all-pass has |H|=1 at all f but frequency-dependent phase; two stages → one 180° notch on sum; notch count ≈ stages/2 (uneven spacing).

### LAB 7 — COMPRESSION *(most valuable)* — T2–T3
**Controls:** Threshold · Ratio · Attack · Release · Knee · Lookahead · Makeup gain · Sidechain.
**Displays:** Waveform · Gain-reduction meter · Envelope · Histogram · Dynamic range · LUFS · Peak · RMS.
**See:** Transient reduction · Envelope following · Gain riding · Dynamic range shrink.
**Challenges:** Compress without pumping · Catch peaks · Increase loudness · Preserve transients.
**Common Mistakes:** attack too fast → kills transients/punch (slow it to preserve transients) · release too fast → distortion/pumping (esp. bass); too slow → over-compresses · ratio/GR too high (squashed) · makeup-gain "louder = better" bias (level-match A/B) · watching the GR meter instead of listening · ignoring the knee · no sidechain HPF on the bus (bass pumps the whole mix) · stacking comp→limiter to death.
**Pro Tips:** ~3–6 dB GR, then attack for punch, release for groove, makeup last. Fast attack+slow release = glue; slow attack+fast release = punch.
**Formula:** GR (above threshold) = (in − threshold)·(1 − 1/ratio); attack/release = envelope time constants; knee softens the onset.

### LAB 8 — GATE — T2
**Controls:** Threshold (def ~−40 dB) · Attack (def ~1 ms) · Hold (def ~10 ms) · Release (def ~100 ms) · **Range/Floor** (−∞…−6 dB, def ~−40 dB) · **Hysteresis** (def ~3 dB) · **Lookahead** *[opt]* · **Sidechain/Key + Key filter (HPF/LPF)** · **Sidechain Listen**.
**Displays:** Waveform · Envelope · Gain reduction · Threshold crossing.
**Learn:** Attack · Hold · Release · Chatter · False triggering.
**Common Mistakes:** threshold too high (chops tails/decays) · threshold too low (bleed passes) · release too fast → chatter/stutter (fix with Hold/slower Release/Hysteresis) · attack too slow on percussion (clips the transient; use fast attack/lookahead) · full-range −∞ sounds unnatural [opinion: floor ~−20…−40 dB] · no key filter → false triggering (filter the sidechain to the target's fundamental) · gating away natural room/ambience.
**Pro Tips:** set Threshold first, then Hold/Release/Hysteresis to remove chatter, then relax Range. Fast attack + short hold + medium release + key-filtered SC for toms/snare.
**Formula:** gate = downward expansion below threshold toward the Range floor; A/H/R smooth the gain envelope.

### LAB 9 — LIMITER *(watch clipping disappear)* — T3
**Controls:** **Ceiling** (−12…0 dBTP, def −1.0 dBTP [opinion]) · **Threshold/Input-gain (Drive)** · **Release** (def ~100 ms/Auto) · **Attack** *[some designs]* · **Lookahead** (def ~1.5 ms) · **True-Peak/ISP** (def on) · **Character** *[opt]* · **Dither** *[final-stage only]*.
**Displays:** True Peak · Waveform · Gain reduction · Peak history.
**Learn:** Brickwall · Inter-sample peaks · Ceiling · Lookahead.
**Common Mistakes:** pushing for loudness → squashing (watch GR; a few dB is plenty) · ignoring inter-sample peaks (set −1.0 dBTP + True-Peak on) · release too fast → distortion/pumping (bass) · no lookahead → overshoot/clipping · using the limiter as a compressor (over-squash) · limiting too early in the chain (belongs at/near the end) · forgetting dither on the final 24→16-bit step.
**Pro Tips:** gain-stage with input/drive; keep ceiling at −1.0 dBTP; judge by GR + ears. A/B Attack 0 vs a hair of attack for punch.
**Formula:** limiter ≈ compressor with ratio→∞; true-peak needs ≥4× oversampling; out ≤ ceiling always.

### LAB 10 — DISTORTION — T2
**Controls:** Tube · Tape · Hard clip · Soft clip · Saturation · Bit crush · Sample reduction.
**Displays:** Harmonic Analyzer · FFT · Waveform · THD meter · Spectrogram.
**See:** New harmonics · Odd harmonics · Even harmonics · Aliasing.
**Common Mistakes:** no oversampling → aliasing (oversample — **but** aliasing is also a teaching target, so make oversampling a **toggle**) · confusing loudness with distortion (level-match) · too much drive buries the source · not distinguishing odd (symmetric/hard-clip, hollow) vs even (asymmetric/tube, warm) harmonics · bit-crush (quantization noise) vs sample-reduction (aliasing) confusion · distorting the full range (band-limit instead) · DC offset from asymmetric shaping (HPF after).
**Pro Tips:** A/B hard-clip vs tube on a sine, read the FFT (odd-only vs odd+even). Push a high sine with oversampling OFF to show aliasing, then ON.
**Formula:** y=f(x) expands a sine into a harmonic series; symmetric → odd, asymmetric → even; harmonics > fs/2 alias to fs−f; THD = harmonic/fundamental energy.

### LAB 11 — NOISE — T1
**Generate:** White · Pink · Brown · Blue · Violet · Grey · Speech noise · HVAC · Traffic · Wind · Hum · Buzz · RF · Crackle · Static · Ground loop.
**Displays:** Spectrum · Spectrogram · Histogram · Noise floor.
**Learn:** Noise color · Noise floor · SNR · Masking.
**Common Mistakes:** expecting white to sound "neutral" (equal energy per Hz → bright/hissy; pink = equal per octave → balanced) · mixing up colors (white flat, pink −3, brown −6, blue +3, violet +6 dB/oct) · judging level across colors by loudness · not reasoning about noise floor/SNR · misreading hum (tonal 50/60 Hz + low harmonics) vs buzz (richer/spikier) vs ground loop (wiring-loop hum) — the spectrogram distinguishes them · forgetting masking (audibility ≠ SNR alone).
**Pro Tips:** put white vs pink side-by-side on the spectrum + audibly. Identify a mystery noise from its spectrogram as a challenge.
**Formula:** color = spectral slope (dB/oct); pink ∝ 1/f power; SNR(dB)=20·log10(sig/noise); masking rises with masker level in the critical band.

### LAB 12 — PHASE *(a hard concept made intuitive)* — T2
**Controls:** Delay one channel · Invert polarity · Rotate phase · Stereo width.
**Displays:** Lissajous · Correlation meter · Waveforms · FFT · Mid/Side · Stereo image.
**Learn:** Phase · Polarity · Cancellation · Mono compatibility · Correlation.
**Common Mistakes:** confusing polarity (flip the whole waveform, 180° at *all* f — the "Ø" button) with phase (frequency-dependent shift) · assuming a polarity flip always fixes cancellation (time-delay comb needs time alignment) · not checking mono · misreading the Lissajous/correlation (vertical=+1 in-phase, horizontal=−1 cancels, ball=wide) · treating any negative correlation as bad (sustained −1 on key elements is the problem) · delaying one channel for width without a mono check.
**Pro Tips:** sum two identical signals, flip polarity → silence; then delay one → comb (polarity ≠ phase). Keep the correlation meter on screen.
**Formula:** polarity = ×(−1) (broadband 180°); delay τ → φ(f)=−2πfτ; correlation = normalized cross-correlation (+1/0/−1).

### LAB 13 — HARMONIC — T1
**Generate:** Sine · Square · Sawtooth · Triangle · Pulse · PWM · Complex waves.
**Displays:** Harmonic analyzer · FFT · Waterfall · Oscilloscope.
**Manipulate:** Frequency · Amplitude · Duty cycle · Wave shape · Add/Remove harmonics.
**Common Mistakes:** not knowing which wave has which harmonics (sine=fundamental; square=odd 1/n; saw=all 1/n; triangle=odd 1/n²) · reading the oscilloscope for spectrum (harmonics are on the FFT) · expecting duty-cycle to change pitch (it changes timbre/nulls, not the fundamental) · thinking a real square/saw is "perfect" (band-limited/aliases) · amplitude vs harmonic-amplitude confusion · ignoring harmonic phase (same amplitudes/different phase look different, sound similar).
**Pro Tips:** build a square by adding odd harmonics one at a time (Fourier synthesis visible). Sweep PWM duty and watch harmonics null/reappear.
**Formula:** square=Σodd 1/n · saw=Σall 1/n · triangle=Σodd 1/n² · pulse(duty d): amplitude ∝ sin(nπd)/(nπ), nulls where n·d is integer.

### LAB 14 — OSCILLATOR — T1
**Generate:** Sine · Square · Saw · Triangle · Pulse · Noise · FM · AM.
**Displays:** Waveform · FFT · Harmonic · Phase.
**Common Mistakes:** naïve digital saw/square alias (band-limit via wavetable/BLEP) · confusing FM (modulate frequency → sidebands fc±n·fm, rich/bell) with AM (modulate amplitude → fc±fm, tremolo) · AM vs ring mod (ring suppresses the carrier) · expecting FM depth to change pitch (changes timbre; pitch stays at carrier) · fundamental near Nyquist (thin/dull) · DC offset from pulse/asymmetric waves.
**Pro Tips:** sweep a saw upward with band-limiting OFF to hear aliasing descend, then ON. Compare FM vs AM sideband structure on the FFT.
**Formula:** AM: carrier + fc±fm; FM: fc±n·fm with Bessel amplitudes (index β=Δf/fm); aliased f>fs/2 appears at fs−f.

### LAB 15 — STEREO IMAGING — T2
**Controls:** **Pan/Balance** (def C) · **Width** (0/100/200%, def 100%) · **Mid gain** (±12 dB) · **Side gain** (±12 dB) · **Mono-fold/Mono** · **Bass-Mono/Mono-maker** (off…300 Hz, def ~120 Hz) · **Multiband width** *[advanced]* · **Rotation** *[opt]* · **Haas/L-R micro-delay** *[opt, warn]*.
**Displays:** Vectorscope · Correlation · Mid/Side · Stereo width · Pan meter.
**Learn:** Panning · Width · Mono compatibility · Center image · Localization.
**Common Mistakes:** over-widening → phase cancellation/mono collapse (check mono-fold + correlation) · widening the bass (keep <~100–150 Hz mono) · confusing "louder" with "wider" (level-match) · Haas/delay widening abuse (combs in mono) · ignoring the correlation meter (sustained −1 cancels) · no center anchor (lose the phantom center) · using width to "fix" a dull/cluttered mix.
**Pro Tips:** Bass-Mono first, then Width, then mono-check + read correlation, then level-match. Teach with pink noise + centered vocal.
**Formula:** M=(L+R)/√2, S=(L−R)/√2; decode L=(M+S)/√2, R=(M−S)/√2; Width = scale S vs M; correlation +1/0/−1.

### LAB 16 — HARMONOGRAPH *(new visual/audio tool)* — T1 (compute ~zero)
Damped sinusoids drive the pen; lateral + rotary variants.
`x(t)=A₁sin(f₁t+φ₁)e^(−d₁t)+A₂sin(f₂t+φ₂)e^(−d₂t)` (similarly y).
**Controls:** f₁…f₄ · Amplitude (A) · Phase (φ) · Damping/decay (d) · **Ratio-lock** (snap to interval ratios) · Lateral/Rotary · Draw speed · Pen persistence/fade · **Drive-from-oscillators** (link two tones).
**Displays:** Live figure · FFT of the driving tones · Lissajous (2-pendulum case) · Oscilloscope of X & Y.
**Learning outcomes:** Frequency ratio ↔ interval (2:1 octave · 3:2 fifth · 4:3 fourth · 5:4 major third) · Consonance/dissonance · Phase · Beating/precession as tones detune · Damping.
**Audio tie-in:** driven by two oscillators so students **hear the interval while watching the figure**; clean ratios = stable closed figures; detune → precession.
**Glossary hooks (See It):** Interval · Octave · Fifth · Fourth · Major Third · Frequency Ratio · Lissajous · Phase · Consonance · Beating.
**Common Mistakes:** thinking the figure is random art (it's deterministic; simple ratios = stable figures) · expecting complex/irrational ratios to close (only simple integer ratios close; near-misses precess = beating) · confusing amplitude (size) with frequency (pattern) · ignoring phase (rotates the figure) · damping extremes (none = never resolves; too much = dies before drawing) · viewing it silently (drive it from two oscillators).
**Pro Tips:** ratio-lock 2:1/3:2/4:3/5:4 and hear each interval snap to a stable shape; detune slightly to see beats.
**Formula:** ratio f₁:f₂ = interval; undamped 2-pendulum = Lissajous; small detune Δ → figure precesses at rate ∝ Δ.

---

## 8. PILLAR B CAPSTONE — SIGNAL CHAIN BUILDER *(signature feature)* — T3

Students assemble a full chain:
`Generator → EQ → Compressor → Gate → Chorus → Delay → Reverb → Limiter → Output`
**Module ops:** enable · bypass · reorder (where appropriate) · reset · save-preset.
**Analyzers (all live, simultaneous):** Spectrum · Oscilloscope · Spectrogram · Harmonic · Waterfall · Phase Scope · Stereo Image · Loudness · RT60 (where applicable).
**Views:** cumulative **and** per-module effect. Save presets · A/B compare.
**Teaches interaction, not isolated effects:** why EQ-before vs EQ-after compression differs; how delay feeding reverb changes decay. Every Pillar-B lab is also a single node inside the chain (one host, taps for per-module + cumulative analysis).

### Common Mistakes (inter-module — the whole point of the chain)
- **Not understanding EQ→comp vs comp→EQ.** EQ **before** compression changes what the compressor reacts to (boost lows → it pumps on bass); EQ **after** shapes the already-compressed tone. Reordering without knowing this = surprise pumping/tone shifts.
- **Gate placement.** Gate **before** compression is usually right; compressing first **raises the noise floor**, making the gate threshold impossible to set cleanly.
- **Time-based FX before dynamics.** Compressing a reverb/delay tail **pumps** it; reverb/delay usually go **after** dynamics (or on sends).
- **Distortion placement blindness.** Distortion before EQ (shape the new harmonics after) vs after EQ (drive specific bands); before compression it adds harmonics the comp then reacts to.
- **Delay→reverb vs reverb→delay.** Order changes the resulting space/decay character — a deliberate choice, not random.
- **Gain-staging into the limiter.** Running each stage too hot makes the final limiter over-work and squash; watch levels between modules.
- **Stacking dynamics without gain-matching** → cumulative squashing you can't hear because each stage is louder.
- **Limiter not last.** A brickwall limiter anywhere but the end voids the true-ceiling guarantee.
- **Judging by cumulative only.** Not toggling **per-module vs cumulative** analyzers → blaming the wrong module for a problem.
- **Bypass ≠ remove.** Forgetting a bypassed module still occupies the chain order for A/B reasoning.

**Pro Tips:** build the same chain in two orders (EQ→comp and comp→EQ) on identical source and A/B the cumulative spectrum + GR. Use per-module taps to isolate which stage caused a change.

---

## 9. PILLAR C — WAVE PHYSICS LABORATORY (15 modules)

Live 2D (optionally 3D) simulation; students place sources and manipulate the environment; wavefronts/pressure/interference/reflections evolve live. **All 15 modules are presets of one Room Builder engine (§9.16).**

### MODULE 1 — Reflection Visualizer
**Place:** Sound source · Wall(s) · Listener · Microphone. **Adjustable:** Wall angle · Distance · Surface material · Frequency · SPL · Room size. **See:** Incident/Reflected wave · Reflection angle · Time delay · Energy loss · Arrival time. **Outcomes:** Law of reflection · First/Early reflections · Reflection path length · Image-source concept.
**Common Mistakes:** measuring the reflection angle from the surface instead of the **normal** · thinking reflection is lossless (energy is absorbed at each bounce) · treating the **image source** as a real second source rather than a modeling construct · forgetting the path-length difference creates the **time delay** behind comb filtering.

### MODULE 2 — Absorption Laboratory
**Materials:** Concrete · Glass · Drywall · Curtains · Carpet · Acoustic foam · Fiberglass · Wood · Audience seating. **Learn:** Absorption coefficient · Frequency-dependent absorption · RT60 · Energy loss · Why bass is harder to absorb.
**Common Mistakes:** thinking thicker/denser absorbs everything (absorption is **frequency-dependent**; porous absorbers work highs, not lows) · trying to absorb bass with thin foam (lows need thick/tuned membrane/Helmholtz absorbers or distance from the boundary) · confusing **absorption** (reduces reflections inside) with **soundproofing/isolation** (stops transmission) · over-absorbing → dead, unnatural room.

### MODULE 3 — Diffusion Laboratory
**Diffusers:** Skyline · QRD · Poly · Slat. **Controls:** Diffuser depth · Well spacing · Frequency · Distance. **Learn:** Specular vs diffuse reflection · Scattering · Energy preservation · Why diffusion doesn't "remove" sound.
**Common Mistakes:** thinking diffusion **absorbs/removes** energy (it **scatters/preserves** it) · confusing diffusion with absorption (scatter vs remove) · placing diffusers too close to the listener (the scattered field needs distance to form) · expecting a diffuser to work **below** its design frequency (well depth sets the low limit).

### MODULE 4 — Refraction Laboratory
**Conditions:** Hot air · Cold air · Humidity · Wind · Temperature gradient. **Teach:** Refraction · Outdoor concerts · Atmospheric effects · Temperature inversions.
**Common Mistakes:** thinking sound only travels straight (gradients bend it) · confusing refraction (gradual bending through a medium) with reflection/diffraction · not grasping why sound carries far at night/over water (inversion bends it **down**) · assuming wind "blows sound" (it's the **gradient** → upwind/downwind asymmetry).

### MODULE 5 — Diffraction Laboratory
**Obstacles:** Speaker behind wall · Doorway · Pillar · Curtain. **Concepts:** Wavelength · Low-frequency wraparound · Shadow zones · High-frequency blockage.
**Common Mistakes:** thinking a barrier fully blocks sound (lows **wrap around**; only highs are shadowed) · weak wavelength intuition (long wavelengths diffract around objects near/smaller than the wavelength) · expecting a small object to block bass · believing a "shadow zone" is silence (it's attenuation, mostly of highs).

### MODULE 6 — Interference Laboratory
**Second speaker; move:** Distance · Delay · Polarity · Phase · Frequency. **See:** Constructive/Destructive interference · Nulls · Lobes · Interference bands.
**Common Mistakes:** treating constructive/destructive as simply "loud/quiet" regardless of frequency + position · thinking nulls are everywhere (they're **position + frequency** specific) · forgetting that moving the listener changes the pattern · assuming two sources always sum to +6 dB (only in-phase at that point).

### MODULE 7 — Comb Filtering Laboratory
One direct source + one delayed reflection; **move the wall.** **Displays:** Moving FFT · Wavefront animation · Frequency response · Notch movement · Impulse response. **Payoff:** *"move the microphone six inches."*
**Common Mistakes:** thinking comb filtering is a tone problem to **EQ away** (it's position/time-based — fix geometry/timing) · not realizing a tiny movement shifts the notch frequencies drastically · confusing comb filtering (delay+sum) with resonance/room modes · ignoring it when using two mics on one source (the **3:1 rule**).

### MODULE 8 — Standing Wave Laboratory
Rectangular room; move source/listener/frequency. **Displays:** Pressure map · Velocity map · Modal animation. **Learn:** Room modes · Axial · Tangential · Oblique · Modal ringing.
**Common Mistakes:** thinking modes are about absorption (they're about **dimensions/geometry**) · confusing **nodes** (pressure min) with **antinodes** (pressure max) — a mic at a node misses that frequency · believing bass traps "remove" modes (they **damp**, not eliminate) · expecting modes to matter at high frequencies (they dominate the low end, below the Schroeder frequency).

### MODULE 9 — Loudspeaker Coverage Laboratory
Place/rotate a speaker; change horn angle (40/60/90/120°) and frequency. **See:** Highs narrow · Lows spread. **Learn:** Directivity · Beamwidth · Coverage · Off-axis response.
**Common Mistakes:** thinking a speaker radiates evenly (directivity **narrows with frequency**) · confusing on-axis response with off-axis (coverage) response · ignoring that lows are nearly omnidirectional · aiming by the cabinet rather than the **HF pattern**.

### MODULE 10 — Line Array Laboratory
Stack cabinets; adjust Splay · Number of boxes · Height · Delay. **Watch:** Wavefronts combine · Coverage changes · Lobes appear.
**Common Mistakes:** thinking stacking just makes it louder (splay/geometry **shapes coverage**; wrong splay = gaps/lobes) · ignoring frequency dependence (couples at LF, beams at HF) · expecting a short array to control lows (needs length ≥ wavelength) · over/under-splaying → coverage holes.

### MODULE 11 — Delay Alignment Laboratory
Subwoofer + main; move delay. **Watch:** Wavefronts align · Null disappears · Energy increases.
**Common Mistakes:** aligning by tape-measure distance only (ignores processing/acoustic delay) · flipping polarity instead of time-aligning (or vice versa) · aligning at one point/frequency and assuming it holds everywhere · aligning for the mic at the console instead of **the audience**.

### MODULE 12 — Cardioid Subwoofer Laboratory *(impressive)*
Two/three subs; Delay · Polarity · Spacing. **See:** Front energy increases · Rear cancellation.
**Common Mistakes:** wrong delay/polarity/spacing cancels in the **wrong direction** (front null instead of rear) · thinking one sub can be cardioid (needs ≥2 with time/polarity offset) · ignoring the frequency limits set by spacing · expecting perfect rear rejection everywhere (band/geometry-limited).

### MODULE 13 — Beam Steering Laboratory
DSP delays; move/tilt the beam. **See:** Energy redirected without moving the box.
**Common Mistakes:** thinking you must physically tilt the box (DSP delays steer it) · over-steering beyond the array's capability (grating lobes) · confusing steering (redirect) with widening · ignoring frequency dependence of steering.

### MODULE 14 — Echo Laboratory
Canyon · Gymnasium · Church · Warehouse. **Echoes arrive one after another.**
**Common Mistakes:** confusing a **discrete echo** (>~50 ms, heard separately) with **reverberation** (dense, continuous) · thinking any reflection is an echo (needs enough delay + level) · ignoring the ~50 ms **Haas** integration threshold below which reflections fuse with the direct sound.

### MODULE 15 — Reverberation Laboratory
Reflections increase → dense reverberant field: `Direct → First reflections → Early reflections → Late reflections → Diffuse field.`
**Common Mistakes:** thinking reverb is "one thing" rather than the **buildup** from discrete reflections into a diffuse field · confusing **early reflections** (directional spatial cues) with the **late diffuse tail** · believing more reflective surfaces always = better ambience (can go muddy/harsh) · expecting **RT60** to describe everything (tail shape + early energy also matter).

### 9.16 Room Builder mode *(the unifying engine)*
Draw a room; place walls · doors · absorbers · diffusers · loudspeakers · listeners. Every module above is a **preset of this one engine** — one framework, consistent UI + physics, teaching dozens of topics from first reflections to line-array coverage and delay alignment.

---

## 10. WAVE PHYSICS — VISUAL LAYERS & MEASUREMENT INTEGRATION

### 10.1 Visual layers (toggle)
Pressure wavefronts · Particle velocity vectors · Energy density · SPL heat map · Reflection paths · Ray tracing · Wavefront animation · Time-of-arrival markers · Phase map · Frequency coloring (long wavelengths for lows, short for highs).

### 10.2 Measurement integration (live from the sim)
Spectrum · Oscilloscope · Spectrogram · Waterfall · Harmonic · RT60 · Impulse Response · **ETC** · Phase Scope · Correlation · **Polar Response** · SPL · Frequency Response. *(Same physical event, different instruments, different information.)*

### 10.3 Glossary integration (example — Diffusion)
Read (theory/formulas) · See (launch with a QRD configured) · Hear (toggle diffusion on/off, same source) · Measure (ETC/RT60/spectrogram change) · Experiment (depth/spacing/position) · Practice (when is diffusion preferable to absorption?) · Quiz. Same pattern for Reflection · Comb Filtering · Standing Waves · Boundary Interference · Flutter Echo · Diffraction.

---

## 11. WAVE PHYSICS ENGINE — FEASIBILITY, RAM, PROCESSING, LOAD, INSTALL

**Verified by first-principles calculation (PPW=8, single precision, standard FDTD).** Cost ∝ dimensionality × bandwidth. Real-time interactivity is feasible only if both are constrained — and the cheap regime (low frequency, long wavelength) is exactly where wave phenomena are most visible.

**2D FDTD wave core, room ~10×8 m:**

| Band | Grid | RAM (grid) | Real-time compute | Verdict |
|---|---|---|---|---|
| ≤500 Hz | 116×93 | ~0.2 MB | ~1 GFLOP/s | trivial |
| ≤1 kHz | 233×186 | ~0.7 MB | ~7 GFLOP/s | **easy real-time** |
| ≤2 kHz | 466×373 | ~2.8 MB | ~59 GFLOP/s | **GPU-comfortable** |
| ≤4 kHz | 932×746 | ~11 MB | ~473 GFLOP/s | GPU-only, thermal-limited |
| Full 20 kHz | 4664×3731 | ~279 MB | ~59,000 GFLOP/s | **infeasible real-time** |

**3D FDTD, ~10×8×4 m:**

| Band | Cells | RAM | Compute | Verdict |
|---|---|---|---|---|
| ≤500 Hz | 0.5 M | ~10 MB | ~70 GFLOP/s | feasible |
| ≤1 kHz | 4.1 M | ~81 MB | ~1,125 GFLOP/s | marginal (≈ a whole phone GPU) |
| ≤2 kHz | 32 M | ~650 MB | ~18,000 GFLOP/s | infeasible real-time |

*(Phone GPU ≈ 1,000–3,000 GFLOP/s FP32, less sustained; estimates ~±2×.)*

### 11.1 Green-lit architecture — HYBRID
1. **Interactive 2D FDTD, band-limited ~1–2 kHz, GPU compute** → live wavefront/interference/diffraction/mode visualizer.
2. **Geometric acoustics (image-source + ray tracing)** for HF + coverage modules — recompute only on parameter change (~free steady-state).
3. **3D only as low-freq (≤500 Hz) or precomputed "quality" mode** — never the real-time default. Scoped to teaching need (no full-band/high-order realism chase).

### 11.2 The four asks (full working set, lab open)
- **RAM:** grid single-digit MB; screen-res overlay textures (~12 MB each, several layers) + geometric buffers → **~80–150 MB incremental**. Set a device floor + texture budget for older/low-RAM phones + iOS jetsam.
- **Processing:** tens of GFLOP/s sustained (1–2 kHz 2D) → real-time on GPU; decouple sim rate from frame rate (sub-step physics, cap 30–60 fps), idle when params aren't moving.
- **Load times:** **sub-second** (grid init is ms); prefer on-device IR generation over bundling precomputed 3D IRs.
- **Install size:** compute **code ~low single-digit MB**; driver = shared audio-stem library (~30–100 MB, whole suite) + material tables/diffuser presets (KB); **Wave-Physics-specific ≈ 5–20 MB.**

### 11.3 Open item
On-device spike (thermals + RAM) on the target iPhone — the only genuine unknown; a validation checkpoint of the green-lit path, not a go/no-go.

---

## 12. NATIVE ENGINE / `ape-dsp` FEASIBILITY MAP

**Exists today** (shipped 07-23, golden-vectors 61/61): Biquad (A/C/Z + RBJ bandpass) · radix-2 FFT · OctaveBands · Ballistics · YIN pitch · Generator · WaveEnvelope · Rt60 · EngineHub. UIs: Frequency Counter, SPL Meter, RT60.

| Capability | Today | Net-new | Tier |
|---|---|---|---|
| EQ (all types), Dynamic EQ | ✅ Biquad | UI/param, dyn-EQ envelope | T1–T2 |
| Spectrum/FFT/Spectrogram/Waterfall | ✅ FFT | raster/accumulation | T1 |
| Oscillator/Harmonic (waveshapes, harmonic edit) | ✅ Generator | PWM/FM/AM, editor | T1 |
| Waveform/Envelope/overlay-diff | ✅ WaveEnvelope | overlay/diff render | T1 |
| Noise (16 sources) | ✅ Generator | colored/textured sources | T1 |
| RT60/IR/EDC/ETC | ✅ Rt60 | ETC/EDC, IR capture | T1–T2 |
| Peak/RMS/True-Peak/LUFS | ⚠️ partial | BS.1770 LUFS, true-peak oversample | T2 |
| Harmonograph | — | trivial path math | T1 |
| Delay/Echo | ❌ | delay line, feedback, ping-pong, mod, BPM | T2 |
| Chorus/Flanger/Phaser | ❌ | modulated delay + all-pass bank | T2 |
| Distortion/sat/bitcrush | ❌ | waveshapers + oversampling + THD | T2 |
| Compressor/Gate/Limiter | ❌ | detector, gain computer, lookahead, sidechain, true-peak brickwall | T2–T3 |
| Reverb | ❌ | FDN/convolution, ER/LR, damping | T3 |
| Stereo/Phase (vectorscope/corr/M-S) | ❌ | correlation, Lissajous, M-S, vectorscope | T2 |
| Signal Chain Builder | ❌ | module host graph + taps | T3 |
| Wave Physics engine | ❌ | 2D FDTD + image-source + ray + Room Builder | T4 (spike first) |

---

## 13. PLACEMENT & NAVIGATION — EAR TRAINING HOME CARD (study method REMOVED)

**DECIDED (2026-07-26).** The former **"Ear Training" study method (Screen 12) is REMOVED** — from the plan, the Dashboard, and per-topic study. No ear-training gate, tile, or progression role. It becomes a **HOME-page card**, sibling to Audio Tools, opening the **Audio Learning Lab landing menu**.

```
HOME
 ├─ (existing) Audio Tools card ───────────────► Audio Measurement Tools menu (8 tools)
 ├─ (NEW) Ear Training / Audio Learning Lab card ─► AUDIO LEARNING LAB — landing menu
 │        ├─ Pillar B: the 16 Audio Learning Labs
 │        ├─ Pillar B capstone: Signal Chain Builder
 │        └─ Pillar C: Wave Physics Laboratory (Room Builder + 15 modules)
 └─ (existing) other HOME cards …
Glossary term ─(Launch Lab / Hear It / Experiment / Watch It)─► deep-links into the configured lab.
```

**Why cleaner:** Labs are **fully decoupled from the graded system** — no `submit_quiz`, no study-method gate, no `student_method_progress`. Pillar A still deep-links into labs from a term. Labs are exploratory/instructional by default; whether challenges feed certificate progress is a separate optional hook (D-LAB-7).

**Cleanup (data/config — flag before any deploy; backend FROZEN):**
1. Retire the `ear_training` row in `study_methods` (was `min_engagement_seconds`=300) — config/data, not schema.
2. Remove `ear_training` from any achievement's `applicable_methods`.
3. Remove the Dashboard ear-training tile + its gate logic.
4. Unaffected: Flashcards · Fill-in-Blank · Matching · Scenarios.
5. No progression-math change (removing a method changes *which* methods a topic needs, not quiz scoring).

---

## 14. DECISIONS — MADE + OWED

| ID | Decision | Status |
|---|---|---|
| **D-LAB-1** ✅ | Fate of the Screen-12 ear-training method. | **REMOVED**; relocated to HOME card → landing menu (§13). |
| **D-LAB-2** ✅ | Extend vs replace graded interaction. | **Moot** — decoupled; `mc`/`multi_select` retired. |
| **D-LAB-3** | Learning Profiles client-config now, DB later. | Recommend approve (zero backend change). |
| **D-LAB-4** | Concept micro-quiz reuse `quiz_questions` vs new `usage`. | Reuse unless draw rules conflict. |
| **D-LAB-5** ✅ | Wave Physics path. | **GREEN-LIT 2D-hybrid**, scoped to need; on-device spike = checkpoint. |
| **D-LAB-6** ✅ | 3D scope. | **2D interactive default;** 3D only low-freq/precomputed. |
| **D-LAB-7** | Do lab challenges feed certificate/achievement progress? | Owed — affects ecosystem→certificate link. |
| **D-LAB-8** | Backend unfreeze window for saved presets/chains + progress writes. | Batch into one future "R" backend decision. |
| **D-LAB-9** | Device floor + RAM/texture budget for Wave Physics. | Set before Pillar C ships. |
| **D-LAB-10** | Confirm opinionated control defaults (§7): Flanger TZF, Gate floor, Limiter −1 dBTP/True-Peak, Stereo Haas/bass-mono. | Owed — see §7 `[opinion]` marks. |

---

## 16. BUILD SEQUENCING · RISKS · TRACEABILITY

> Engineering order, not a cut list. Everything ships at launch.

**Foundations (parallelizable):** HOME card + Audio Learning Lab landing menu (§13) incl. retiring the ear-training study method · shared Lab Shell (§4) + Cross-Lab Features (§5) · Glossary ecosystem skeleton (action row + Learning-Profile config + type-templates) · Wave Physics on-device spike.

**Audio labs — T1 first:** EQ · Spectrum/Harmonic/Oscillator · Waveform · Noise · Harmonograph · RT60 → **T2:** Delay · Chorus/Flanger/Phaser · Distortion · Stereo/Phase · Compressor/Gate → **T3:** Reverb · Limiter · Signal Chain Builder.

**Wave Physics — after the spike:** Room Builder engine → 15 modules as presets → measurement integration → visual layers.

**Learning Profiles:** flagship terms first (EQ/Delay/Compressor/Reverb/Comb Filtering/Interval); long tail inherits type-templates.

### Risks / gotchas
- **R1 — Backend touches** limited to config cleanup (§13); client-first Learning Profiles keep the anchor backend-free.
- **R2 — Wave Physics feasibility** (top technical risk): on-device spike; hybrid 2D+geometric; device floor + texture budget.
- **R3 — Large program shipping at once:** shared Lab Shell + type-templated profiles + T1-first cut per-lab/per-term cost.
- **R4 — Honest-metrics rule** everywhere.
- **R5 — Anti-aliasing** in Distortion/Oscillator must be deliberate (also a teaching target — toggleable).
- **R6 — Common-Mistakes authoring at scale:** every control across 16 labs + 15 modules + the chain needs mistakes content — a content pipeline (now drafted in §7/§8/§9). Non-droppable.
- **R7 — Audio asset production:** clean source stems + Real-World-Example chains; ties to `EAR_TRAINING_AUDIO_MASTER_LIST_TOP300_DRAFT_v2` (pending review).
- **R8 — Live mic latency:** Oboe Unprocessed on Android; on-device validation item.

### Traceability
- **Vision source:** Prof. Booth brief, this session (Audio Learning Lab; 16 labs incl. Harmonograph; cross-lab features; Signal Chain Builder; Glossary "Learn It/Hear It/See It" ecosystem + Learning Profiles + Launch Lab; Wave Physics 15 modules + layers + measurement + Room Builder). Referenced: *Media Design Guide Feedback.txt*.
- **Content authored this session:** all control sets (incl. the 5 previously `[not enumerated]`) + Common Mistakes for all 16 labs + Signal Chain inter-module mistakes + Common Mistakes for all 15 Wave-Physics modules + Pro Tips + teaching formulas. Standard signal-processing/acoustics fundamentals; `[opinion]` marks opinionated defaults.
- **Locked/authoritative inputs:** ear-training audio schema (`quiz_questions.media_url/media_type`, `usage='ear_training'`, SCHEMA v2.8); `ape-dsp` inventory (PROJECT_STATE r34, 07-23); honest-metrics governance (Tools §1.7); `APE_GOVERNANCE_DECISIONS_2026_07_23`.
- **Feasibility math:** computed this session (2D/3D FDTD, PPW=8, single precision), estimates ±~2×; spike is the confirming step.
- **Superseded/folded in:** v1, v2, v3 architecture drafts + the two Common-Mistakes/control companions.

*End of MASTER DRAFT v4 — pending Prof. Booth approval. On approval, re-issue CANDIDATE→LOCKED and coordinate STATE/TRACKER/INDEX bumps. All prior versions + companions retired (kept for provenance).*
