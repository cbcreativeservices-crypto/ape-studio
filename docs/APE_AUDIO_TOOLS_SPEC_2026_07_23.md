# Audio Measurement Tools Module — Developer Handoff Report (SPEC OF RECORD)

- **Project:** Pro Audio Training Academy
- **Date filed:** 2026-07-23
- **Source:** Product owner (delivered verbatim in the Claude Code dev session; formatting normalized to markdown, content unchanged)
- **Binding overlays:** `MEASUREMENT_TOOLS_RULINGS_Q1_Q5_2026_07_09_v1.md` (no fake meters / honest gray-out, generator caps −20 dBFS default & −12 dBFS hard cap + confirm, A13 device class, FFT ≤ 16384, telemetry T-1 posture) and `APE_GOVERNANCE_DECISIONS_2026_07_18.md` (backend frozen; client-only work).

---

## 1. Project Intent

The app will include a set of audio measurement tools, but the tools should not be presented as raw utilities that students are expected to understand without guidance.

The module must function as:

**Audio Measurement Tools + Guided Measurement Training**

The goal is to help students learn what each tool measures, what it does not measure, how to interpret the display, what mistakes are common, and when a measurement should not be trusted.

This module is not intended to replace Smaart or a certified professional acoustic measurement platform. It should introduce and reinforce professional measurement thinking in a student-safe, clearly explained, integrity-focused way.

---

## 2. Final Tool Set

The dashboard remains limited to these tools:

1. SPL Reference Meter
2. Spectrum Analyzer / RTA
3. Waveform Viewer
4. Spectrogram
5. RT60 / Reverb Decay Estimator
6. Tone / Noise Generator
7. Tuner
8. Frequency Counter

No additional top-level dashboard tools should be added at this stage.

The new functionality is integrated into these tools as deeper views, guided tutorials, compare functions, saved measurements, warnings, and measurement-quality indicators.

*(See Tool 7 below: the recommendation is to combine Frequency Counter + Tuner into one dashboard tool, "Frequency Counter & Tuner", since they share ~80–90% of the same signal-processing engine.)*

---

## 3. Removed from Current Scope

The following Smaart-style features are removed from current development scope:

- Magnitude Response
- Transfer-Function Magnitude
- Delay Finder
- Reference Delay
- Dual-channel transfer-function measurement
- Live coherence as an active measurement tool
- Requirement for reference input channel
- Requirement for a full transfer-function engine

These may be referenced in tutorial content as advanced professional concepts, but they should not be implemented as live tools in this phase.

---

## 4. Global Module Architecture

Each tool should support some or all of the following modes:

| Mode | Purpose |
|---|---|
| Measure / Live | Real-time or file-based measurement view |
| Learn | Explains the tool, what it measures, what it does not measure, and common mistakes |
| Demo | Uses sample data or controlled animations to show correct and incorrect use |
| Compare | Allows saved/live or before/after comparison when technically appropriate |
| Settings | Shows measurement settings that affect interpretation |
| Warnings / Quality | Displays calibration, clipping, noise, reliability, and validity issues |

The tutorial/demo layer must be able to function even before all live measurement engines are fully implemented.

For several demos and tutorial data (sounds) — the same included Tone/Noise Generator can supply and be the source in the background. It should also have the sound used in any of the other tools included within it (the noise generator).

---

## 5. Non-Negotiable Measurement Integrity Rules

These rules apply across all tools.

### Do not show fake live values

Simulated values may be used only in a clearly labeled tutorial or demo mode.

Required label:

> **Training Demo — Not a Live Measurement**

### Do not imply certified accuracy

Unless the app uses calibrated external hardware and proper measurement standards, the app must not imply legal, certified, or professional reference accuracy.

Required language where applicable:

> **Approximate unless calibrated.**

### Always disclose measurement context

Any saved or compared measurement should store and show:

- tool type
- date/time
- input device
- calibration status
- sample rate, where relevant
- weighting, where relevant
- response setting, where relevant
- smoothing/averaging, where relevant
- FFT/window setting, where relevant
- mic position note, where available
- quality warnings
- measurement status: valid, caution, or invalid

### Do not allow misleading comparisons

Compare mode must warn when measurements were taken with incompatible settings.

Examples:

- different weighting
- different smoothing
- different FFT size
- different mic position
- calibrated vs uncalibrated
- different input device
- different sample rate
- one measurement has warning/invalid status

---

## 6. Global Measurement Quality System

The app needs a shared **Measurement Quality Engine** used by all tools.

### Quality states

| State | Meaning |
|---|---|
| Valid | Measurement conditions appear acceptable |
| Caution | Measurement can be viewed, but interpretation is limited |
| Invalid | Measurement should not be trusted |

### Common warning flags

| Warning | Applies to |
|---|---|
| Microphone permission missing | all live tools |
| Input clipping detected | SPL, waveform, RTA, spectrogram |
| Uncalibrated input | SPL, logging, RT60 |
| High noise floor | SPL, spectrogram, RT60 |
| Unstable measurement | SPL, RTA, RT60 |
| Insufficient signal level | RTA, spectrogram, RT60 |
| Insufficient decay range | RT60 |
| Settings mismatch | compare mode |
| Unsupported input device | all live tools |
| File format unsupported | waveform, spectrogram, RT60 if file-based |
| Audio engine inactive | all live tools |

### Required user-facing behavior

Warnings must not be hidden in developer logs. They need to appear in the measurement screen in plain language.

Example:

> Input clipping detected. Reading may be inaccurate. Lower input gain or move the microphone farther from the source.

---

## 7. Saved Measurement Library

The module should include a shared saved-measurement system.

### Saved object types

| Object | Used by |
|---|---|
| MeasurementSession | all tools |
| SPLLog | SPL tool |
| SpectrumTrace | RTA |
| WaveformSnapshot | Waveform Viewer |
| SpectrogramSnapshot | Spectrogram |
| ImpulseResponseMeasurement | RT60 / Reverb Decay |
| QualityReport | all tools |
| CompareCompatibilityReport | compare mode |

### Required saved metadata

Every saved measurement should store:

```
id
tool_type
created_at
title
notes
input_device
calibration_status
sample_rate
measurement_settings
quality_state
warning_flags
data_payload
display_snapshot_optional
```

The exact database schema can be refined later, but the data model must be planned before compare mode is built.

---

## 8. Compare Mode

Compare mode should be available where it provides meaningful learning value.

### Compare types

| Compare type | Description |
|---|---|
| Saved vs Live | Current measurement compared with a saved reference |
| Before vs After | Compare changes after adjustment, treatment, EQ, or setup change |
| A/B Measurement | Compare two saved measurements |
| Overlay | Multiple traces on one display |
| Split View | Two measurements side by side |
| Difference View | Shows difference between compatible measurements |

### Compare mode by tool

| Tool | Compare priority | Main use |
|---|---|---|
| SPL Reference Meter | High | compare logs, peak/average behavior, position changes |
| Spectrum Analyzer / RTA | High | compare before/after EQ, mic positions, source changes |
| Waveform Viewer | Moderate | compare clipping, transients, stereo differences |
| Spectrogram | Moderate | compare feedback, noise, speech/music patterns |
| RT60 / Reverb Decay | Very High | compare room positions, treatment changes, decay behavior |

### Compare compatibility rules

The app should show a warning when comparison conditions differ.

Examples:

> Warning: These RTA traces use different smoothing settings. Comparison may be misleading.

> Warning: One SPL log is calibrated and the other is uncalibrated. Values may not be directly comparable.

> Warning: These RT60 measurements were taken from different mic positions. Room position affects decay results.

---

## 9. Tool 1 — SPL Reference Meter

### Functional purpose

The SPL Reference Meter measures acoustic sound pressure level at the microphone position. It also displays Peak and RMS-related level information and supports short-term or session-based logging.

### Core learning outcome

Students must understand that:

- dB SPL is acoustic level
- dBFS is digital signal level
- Peak and RMS are different
- A/C/Z weighting changes the reading
- Fast/Slow response changes meter behavior
- phone microphones are approximate unless calibrated
- mic position changes the result

### Required views

**View 1 — Live Meter** displays:

- current SPL value
- Peak value
- RMS or equivalent average value
- weighting mode: A, C, or Z
- response mode: Fast or Slow
- calibration status
- input clipping warning
- microphone/input device status

**View 2 — Logging** displays:

- current SPL
- session duration
- timeline/history graph
- peak over session
- average over selected time window
- event markers, optional
- saved log button

**View 3 — Compare Logs** allows:

- compare two saved SPL sessions
- compare peak vs average
- compare mic positions
- compare A-weighted vs C-weighted examples in tutorial mode
- compare before/after level adjustment

**View 4 — Learn** teaches:

- dB SPL vs dBFS
- Peak vs RMS
- A/C/Z weighting
- Fast vs Slow response
- calibration
- phone mic limitations
- hearing safety context
- common mistakes

### Required controls

- start/stop meter
- weighting: A / C / Z
- response: Fast / Slow
- reset peak
- start/stop logging
- save log
- calibration status or calibration workflow
- input device selector, if supported
- help/tutorial button

### Required warnings

- "Measurement may be approximate unless calibrated."
- "Input clipping detected. SPL reading may be inaccurate."
- "Phone microphone readings may vary by device."
- "SPL is measured at the microphone position only."
- "Do not treat this as a certified legal sound-level meter unless approved calibrated hardware is used."

### Development notes

SPL logging should store numerical data, not raw audio, unless a later feature explicitly needs audio capture. This keeps storage low.

---

## 10. Tool 2 — Spectrum Analyzer / RTA

### Functional purpose

The Spectrum Analyzer / RTA displays sound energy by frequency band.

### Core learning outcome

Students must understand that:

- RTA shows frequency energy, not automatic EQ advice
- mic position affects the result
- room, source, loudspeaker, and measurement method all affect the display
- smoothing and averaging change how the graph looks
- auto-scaling can mislead interpretation
- RTA is not the same as transfer-function magnitude response

### Required views

**View 1 — Live RTA** displays:

- frequency bands left to right
- level vertically in dB
- octave or 1/3-octave view
- smoothing setting
- averaging setting
- peak hold, optional
- scale lock
- quality status

**View 2 — Trace / Snapshot** allows:

- freeze current RTA
- save trace
- name trace
- store settings with trace

**View 3 — Compare** allows:

- before/after EQ comparison
- mic position A/B comparison
- live vs saved trace
- two saved traces
- compatibility warning for different settings

**View 4 — Learn** teaches:

- RTA vs EQ
- RTA vs magnitude response
- frequency regions
- smoothing
- averaging
- scale lock
- mic position
- pink noise vs music

### Required controls

- start/stop
- octave / 1/3-octave / higher-resolution mode if supported
- smoothing
- averaging
- peak hold
- reset peak hold
- scale lock
- frequency range
- save trace
- compare trace

### Required warnings

- "This display shows frequency energy, not automatic EQ advice."
- "Microphone position strongly affects the result."
- "Auto-scale can exaggerate small changes."
- "Do not compare traces with different smoothing or scale settings without caution."
- "Room response and source material both affect this display."

### Development notes

Beginner default should be stable and readable. A 1/3-octave style display is better for students than a dense FFT display.

---

## 11. Tool 3 — Waveform Viewer

### Functional purpose

The Waveform Viewer shows amplitude over time. It should look and behave more like an oscilloscope-style tool than a decorative digital waveform drawing.

### Core learning outcome

Students must understand that:

- waveform shows amplitude over time
- waveform height is not the same as perceived loudness
- vertical zoom is not gain
- clipping has visible waveform symptoms
- waveform is not frequency analysis
- zero line matters
- stereo channels may behave differently

### Required views

**View 1 — Oscilloscope-Style Waveform** displays:

- centered waveform
- clear zero line
- time axis
- amplitude axis
- positive and negative signal movement
- grid or scope-style reference lines
- clipping markers
- channel view: mono, stereo, L/R if supported

**View 2 — File / Snapshot View** allows:

- load or capture waveform segment
- freeze waveform
- zoom horizontally
- zoom vertically
- scrub or inspect

**View 3 — Compare** allows:

- clipped vs clean waveform comparison
- transient vs sustained sound comparison
- stereo left/right comparison
- vertical zoom demonstration in tutorial mode

**View 4 — Learn** teaches:

- amplitude over time
- zero line
- clipping
- vertical zoom vs gain
- waveform vs loudness
- waveform vs spectrum
- stereo waveform interpretation

### Required controls

- start/stop live input or load file
- time zoom
- vertical zoom
- channel selection
- freeze
- reset view
- clipping marker toggle
- save snapshot

### Required warnings

- "Vertical zoom changes display size, not audio level."
- "Waveform height is not the same as perceived loudness."
- "This view shows amplitude over time, not frequency balance."
- "Clipping detected."
- "Auto-normalized views can make different levels appear similar."

### Development notes

This tool should not be presented as an SPL or loudness tool. It is primarily a time-domain signal inspection tool.

---

## 12. Tool 4 — Spectrogram

### Functional purpose

The Spectrogram shows frequency content over time. It corresponds to the Smaart-style spectrograph concept but remains within the existing tool structure.

### Core learning outcome

Students must understand that:

- time is horizontal
- frequency is vertical
- color/intensity represents signal level
- color is relative to the selected scale
- FFT/window settings affect detail
- better frequency resolution can reduce time resolution
- better time resolution can reduce frequency resolution
- spectrogram is not the same as RTA

### Required views

**View 1 — Live Spectrogram** displays:

- scrolling spectrogram
- time axis
- frequency axis
- color/intensity scale
- dynamic range setting
- FFT/window preset
- freeze button
- quality status

**View 2 — Snapshot** allows:

- freeze display
- save snapshot
- inspect time/frequency regions
- add note/title

**View 3 — Compare** allows:

- before/after noise comparison
- feedback/ringing comparison
- speech vs music comparison
- HVAC/noise before/after
- untreated vs treated room examples

**View 4 — Learn** teaches:

- frequency over time
- color/intensity interpretation
- FFT/window tradeoff
- noise floor
- feedback identification
- speech/music patterns
- difference between RTA and spectrogram

### Required controls

- start/stop
- freeze
- save snapshot
- frequency range
- time history length
- dynamic range
- beginner presets: Speech · Music · Low Frequency · Transient · Feedback/Ringing
- advanced FFT/window controls, optional later

### Required warnings

- "Color intensity is relative to the selected scale."
- "FFT/window settings affect time and frequency detail."
- "Noise floor may appear as low-level background energy."
- "Do not compare spectrograms with different dynamic range settings without caution."
- "This view shows frequency over time, not waveform amplitude."

### Development notes

This is more CPU-intensive than text/glossary features but manageable if update rate, history length, and rendering are controlled.

---

## 13. Tool 5 — RT60 / Reverb Decay Estimator

### Functional purpose

The RT60 / Reverb Decay Estimator analyzes room decay behavior. It should also contain the impulse-response-related features that were added from the Smaart concept list.

This tool becomes the main room-acoustics analysis tool.

### Suggested internal naming

Dashboard label may remain: **RT60 / Reverb Decay Estimator**

Inside the tool, use tabs/views such as: Decay · Impulse · Bands · Learn · Compare

A later rename could be: **RT60 / Impulse Response**

But do not add an extra dashboard tool unless needed later.

### Core learning outcome

Students must understand that:

- RT60 is an estimate of decay time
- RT60 varies by frequency
- T20/T30 may be extrapolated
- background noise can invalidate results
- one clap is not always reliable
- mic/source position matters
- impulse response reveals direct sound, reflections, and decay
- small rooms may not behave like ideal diffuse spaces

### Required views

**View 1 — Decay View** displays:

- decay curve over time
- RT60 estimate
- T20/T30/EDT where supported
- fitted slope line
- noise floor
- frequency band
- quality/confidence status

**View 2 — Impulse Response View** displays:

- time-domain impulse response
- direct sound marker
- early reflection peaks
- late decay region
- noise floor
- time axis in milliseconds/seconds
- marker/cursor tools

**View 3 — Frequency Bands** displays:

- RT/decay values by frequency band
- octave or 1/3-octave bands if supported
- warning if low-frequency or high-frequency result is unreliable

**View 4 — Compare** allows:

- untreated vs treated room
- mic position A/B
- door open vs closed
- empty room vs occupied room
- before/after acoustic treatment
- low-frequency decay vs high-frequency decay
- classroom vs studio vs live room examples

**View 5 — Learn** teaches:

- impulse response basics
- direct sound
- early reflections
- late decay
- RT60 definition
- T20/T30 extrapolation
- EDT
- noise floor
- measurement position
- why RT60 varies by frequency

### Required controls

- start capture
- stop capture
- measurement method label
- frequency-band selector
- save measurement
- compare measurement
- marker/cursor
- time zoom
- quality details
- repeat measurement
- average measurements, future/pro mode

### Required warnings

- "RT60 varies by frequency band."
- "Result may be extrapolated from T20 or T30."
- "Insufficient decay range detected."
- "High background noise may invalidate result."
- "Repeat measurements from multiple positions."
- "A hand clap may not provide reliable measurement conditions."
- "Visible late energy may include noise."

### Development notes

This is the most technically complex tool in the current set. It should be built in stages:

1. tutorial/demo first
2. decay examples
3. saved impulse-response examples
4. simple live decay estimator
5. more complete IR/RT analysis later

---

## 14. Coherence Treatment

Coherence is not part of the current live toolset because Magnitude Response and Delay Finder have been removed.

### Current scope

Coherence should be included only as a tutorial concept under Smaart/professional measurement learning.

### Do not implement

- live coherence graph
- coherence meter
- coherence overlay
- coherence-based EQ decision logic

### Teach conceptually

Tutorial should explain:

- coherence is a trust indicator in dual-channel transfer-function measurement
- low coherence can mean noise, reflections, wrong delay, unrelated sound, or poor signal-to-noise ratio
- students should not trust transfer-function data where coherence is low

This supports later professional learning without creating an orphaned feature in the current tool design.

---

## 15. Smaart Concept Tutorial Modules

These should be included as educational modules, not necessarily as live measurement tools.

### Module 1 — RTA vs Magnitude Response

Teach why RTA is not the same as transfer-function magnitude response: RTA is single-channel; magnitude response requires reference comparison; RTA shows energy at the mic; transfer function shows system change; RTA alone does not equal system tuning.

### Module 2 — What Coherence Means

Teach measurement trustworthiness in professional dual-channel analysis: coherence is not volume; coherence is not frequency response; coherence helps decide whether data is trustworthy; noisy or unstable conditions lower reliability.

### Module 3 — Why Delay Matters

Teach why professional analysis often needs time alignment between reference and measurement: sound travel time matters; mic distance changes arrival time; reference and measurement signals must be aligned; wrong delay can corrupt interpretation. Stays tutorial-only because Delay Finder was removed from live scope.

### Module 4 — Impulse Response Basics

Support RT60 / Reverb Decay learning: direct sound; early reflections; late decay; noise floor; time-domain room response.

### Module 5 — RT60, T20, T30, and EDT

Support correct room-acoustic interpretation: RT60 is often estimated; T20/T30 are extrapolated ranges; EDT describes early decay; decay varies by frequency; background noise can invalidate results.

### Module 6 — Spectrogram Interpretation

Support correct use of spectrogram: time horizontal; frequency vertical; color/intensity is relative; FFT/window settings matter; spectrogram is not RTA; noise floor can appear visually.

### Module 7 — SPL Logging vs Instant SPL

Support correct use of SPL meter/logging: instant SPL is not event history; peak and average differ; weighting matters; response time matters; logging is not legal compliance unless hardware/calibration supports it.

### Module 8 — Measurement Integrity

Teach cross-tool measurement discipline: calibration matters; mic position matters; clipping invalidates data; noise floor matters; settings must match for comparisons; fake live meters are not acceptable.

---

## 16. Recommended Development Phases

### Phase 1 — Educational Foundation

Build:

- Learn mode for all tools
- Demo mode using sample data
- common mistakes sections
- warnings explanations
- Smaart concept tutorial modules
- measurement integrity module

This can be built before live measurement engines are complete.

### Phase 2 — Data Model and Quality System

Build:

- saved measurement schema
- quality state system
- warning flag system
- compare compatibility logic
- calibration status fields
- input device metadata

This should happen before complex live measurement tools.

### Phase 3 — SPL and Waveform

Build first live tools:

- SPL current reading
- Peak/RMS
- SPL logging
- oscilloscope-style waveform viewer
- clipping detection
- save/compare basic snapshots/logs

These are the most practical early live tools.

### Phase 4 — RTA and Spectrogram

Build:

- FFT engine
- RTA bars
- smoothing/averaging
- spectrogram rendering
- freeze/snapshot
- saved traces/snapshots
- compare mode

### Phase 5 — RT60 / Impulse Response

Build:

- guided capture
- impulse response view
- decay curve
- noise-floor warnings
- T20/T30/RT60 estimate
- frequency-band view
- compare mode

This should be the last major live tool because it carries the highest risk of misleading students if measurement quality is poor.

---

## 17. Development Complexity Ranking

| Feature | Complexity | Notes |
|---|---|---|
| Learn screens | Low | Content/UI |
| Demo mode | Low–Moderate | Uses controlled sample data |
| Quality indicators | Moderate | Requires rules/thresholds |
| Saved measurements | Moderate | Requires schema/storage |
| Compare mode | Moderate | Requires compatibility logic |
| SPL Meter | Moderate–High | Requires mic + calibration logic |
| SPL Logging | Moderate | Easy after SPL engine exists |
| Waveform Viewer | Moderate | Real-time display + clipping |
| RTA | High | FFT, smoothing, rendering |
| Spectrogram | High | FFT history + rendering |
| RT60 / IR | Very High | Capture, decay analysis, validity logic |

---

## 18. App Size, CPU, and Memory Considerations

### Low impact

tutorial text · glossary links · help screens · SVG diagrams · sample metadata · saved numerical logs

### Moderate impact

demo animations · saved screenshots · stored sample measurement files · Lottie-style educational animation · compare mode with saved traces

### Higher impact

live FFT processing · live spectrogram rendering · long spectrogram history buffers · real-time waveform display · continuous SPL logging over long sessions · impulse-response analysis

### Avoid

- embedding many HD tutorial videos
- storing raw audio by default
- running DSP when screen is closed
- continuously logging without explicit user start
- keeping long spectrogram buffers in memory
- pretending simulated values are live

---

## 19. Critical Learning Outcomes by Tool

| Tool | Critical learning outcome |
|---|---|
| SPL Reference Meter | dB SPL, Peak, RMS, weighting, response, calibration, mic position |
| Spectrum Analyzer / RTA | frequency energy display, not automatic EQ advice |
| Waveform Viewer | amplitude over time, not loudness or frequency balance |
| Spectrogram | frequency over time; color/intensity depends on scale |
| RT60 / Reverb Decay | room decay varies by frequency and depends on measurement quality |
| Global Quality System | measurements are only useful when conditions and settings are known |
| Compare Mode | comparisons are valid only when settings/conditions are compatible |
| Smaart Concepts | professional tools require disciplined interpretation, not blind graph reading |

---

## 20. Final Developer Instruction Summary

Build the module as a tool measurement and training system:

1. **SPL Reference Meter** — add Peak/RMS; logging; calibration warnings; compare logs; SPL learning module
2. **Spectrum Analyzer / RTA** — add smoothing/averaging/peak hold; saved traces; compare mode; RTA interpretation training
3. **Waveform Viewer** — make it oscilloscope-style; add zero line, time/amplitude reference, clipping markers; zoom controls; waveform interpretation training
4. **Spectrogram** — add live/freeze/snapshot; dynamic range and presets; compare snapshots; spectrogram interpretation training
5. **RT60 / Reverb Decay Estimator** — add impulse-response view inside the tool; decay curve, T20/T30/EDT education; frequency-band view; noise-floor/quality warnings; compare measurements
6. *(Etc — same treatment for the remaining tools.)*

Add globally:

- Learn mode
- Demo mode
- Compare mode
- Measurement Quality Indicators
- Saved Measurement Library
- Calibration/Input Device metadata
- Warning and integrity system
- Smaart concept tutorials

Do not add new dashboard tools for Magnitude Response, Delay Finder, or Coherence. Keep coherence as a tutorial concept only. Keep impulse response inside the RT60/Reverb Decay tool unless the feature later grows large enough to justify a separate tool.

---

## Tool 6 — Tone & Noise Generator

### Functional purpose

The Tone & Noise Generator produces calibrated or reference audio signals for education, equipment testing, troubleshooting, loudspeaker setup, room analysis, gain staging, signal tracing, and hearing demonstrations.

The generator is not intended to replace professional laboratory equipment but should produce technically correct signals with clearly documented limitations.

Students should understand that different test signals exist because each one is designed for a different measurement purpose.

### Core learning outcomes

Students must understand:

- Different signals serve different purposes.
- Pink noise is not white noise.
- Sine waves are not suitable for every test.
- Test signals should be generated at safe listening levels.
- Generator output level matters.
- Test signals should never be confused with musical content.
- Some measurements require specific excitation signals.
- Test signals can damage loudspeakers if misused.

### Required modes

- **Sine Wave** — frequency response testing; oscillator demonstrations; distortion testing; crossover verification; resonance identification; hearing demonstrations
- **White Noise** — broadband noise demonstration; electronics testing; comparison with pink noise. *Teach: white noise contains equal energy per Hz.*
- **Pink Noise** — loudspeaker tuning; room measurements; RTA demonstrations; equalization education. *Teach: pink noise contains equal energy per octave.*
- **Brown (Brownian/Red) Noise** — low-frequency demonstrations; acoustics education
- **Blue Noise** — educational mode only; teach how spectral balance changes
- **Violet Noise** — educational mode only
- **Linear Sweep** — resonance demonstrations
- **Logarithmic Sweep** — loudspeaker testing; impulse-response measurement; room analysis
- **Impulse** — impulse-response demonstrations; timing demonstrations
- **Click Track** — configurable BPM; synchronization; delay demonstrations
- **Tone Burst** — transient demonstrations; loudspeaker testing
- **Multi-tone (Future)** — educational expansion

### Required controls

- **Generator:** Start · Stop · Pause
- **Signal selection:** Sine · White · Pink · Brown · Blue · Violet · Sweep · Click · Burst
- **Frequency:** adjustable 20 Hz–20 kHz, with ISO 1/3-octave preset buttons: 31.5 · 40 · 50 · 63 · 80 · 100 · 125 · 160 · 200 · 250 · 315 · 400 · 500 · 630 · 800 · 1k · 1.25k · 1.6k · 2k · 2.5k · 3.15k · 4k · 5k · 6.3k · 8k · 10k · 12.5k · 16k · 20k
- **Level:** output level, safe default *(ruling of record: −20 dBFS default, −12 dBFS hard cap, tap-through confirm to unlock above cap for the session)*
- **Sweep controls:** start frequency · end frequency · duration · direction · repeat
- **Noise color selection:** simple selector

### Required views

- **Generator** — large controls; large frequency display; output level; waveform preview
- **Presets** — common educational presets
- **Learn** — explains every signal
- **Compare** — hear Pink vs White; hear sine vs square (future); hear sweep vs fixed tone

### Common student misunderstandings (each addressed in Learn)

- "Pink noise equals white noise." — False. White noise sounds brighter; pink noise has equal energy per octave.
- "Turning the generator louder makes measurements better." — False.
- "Sine waves represent music." — False.
- "Noise is random therefore unusable." — False.
- "Sweeps measure rooms automatically." — False.

### Required warnings

- Very low frequencies can damage speakers.
- High frequencies can damage hearing.
- Start at low volume.
- Never connect directly to power amplifiers without understanding gain structure.
- Generator output is not a calibrated laboratory reference.

### Development notes

- Generator should use native audio synthesis rather than pre-recorded files.
- Use a floating-point oscillator.
- Avoid clicks when starting/stopping — apply fade-in/fade-out.
- Support sample rates.
- Future support: THD measurements · dual oscillator · phase control · stereo routing · channel selection.

---

## Tool 7 — Frequency Counter & Tuner

**Naming recommendation:** use one combined dashboard tool, **"Frequency Counter & Tuner"** — they share ~80–90% of the same signal-processing engine (both estimate frequency, detect stable pitch, require confidence filtering, need input selection, can use the microphone, display frequency numerically). The difference is primarily interpretation and input source. Build one integrated tool with multiple operating modes.

### Functional purpose

Measure periodic frequency using one of three input methods — **Acoustic**, **Vibration**, **Optical** — and interpret the measured frequency as either a numerical frequency or a musical pitch.

### Core learning outcomes

Students must understand:

- Frequency is not pitch.
- Pitch is human perception.
- Musical tuning is based on frequency.
- Not all sounds have one stable frequency.
- Background noise reduces measurement accuracy.
- Confidence matters.

### Required modes

- **Acoustic Mode** — microphone input. Detect: fundamental frequency · confidence · stability · harmonics · signal level.
- **Vibration Mode** — accelerometer when practical or external sensor if supported. Useful for motors, machinery, fans, turntables, speaker cabinets, vibration demonstrations. Educational only unless supported by hardware.
- **Optical Mode** — camera-based; uses brightness variation. Ideal for LED flashes, rotating machinery with reflective markers, strobes, fans, motors, belt drives, projectors. Requires a high-contrast target and adequate lighting. Frame-rate limits clearly disclosed.
- **Tuner Mode** — displays: detected note · octave · frequency · deviation · reference tuning · confidence.
- **Frequency Counter Mode** — displays: frequency in Hz · stability · confidence · minimum · maximum · average.

### Required views

- **Live Measurement** — large frequency display; confidence; signal quality
- **Musical Tuner** — large note; needle; cent deviation; frequency; reference frequency
- **Oscilloscope (optional cross-link)** — open waveform
- **Learn** — explain tuning; frequency; confidence; harmonics; aliasing
- **Compare** — 440 Hz vs 442 Hz; different tuning standards; equal temperament; historical tuning

### Required controls

- **Input selection:** Microphone · Camera · Vibration
- **Reference pitch:** 432 · 435 · 438 · 440 · 441 · 442 · 443 · 444 · Custom
- **Display:** Frequency only · Tuner only · Combined
- **Filtering:** Fast · Slow · Stable · Auto
- **Sensitivity:** Low · Medium · High
- **Averaging:** On · Off
- **Peak hold:** optional

### Required displays

Large frequency · large note · needle · cent deviation · confidence meter · signal quality · input status · reference frequency

### Common student misunderstandings (each addressed in Learn)

- "Frequency equals note." — False.
- "440 Hz is the only tuning." — False.
- "Background noise doesn't matter." — False.
- "The strongest harmonic is always the fundamental." — False.
- "Camera can measure every frequency." — False; frame rate limits optical measurements.
- "Accelerometer measures audio." — Usually false; explain limitations.

### Required warnings

Low confidence · no stable pitch · background noise detected · signal clipped · multiple tones detected · frequency outside measurable range · camera frame rate exceeded · lighting inadequate · optical measurement approximate · vibration measurement hardware limited

### Development notes

The DSP engine should provide:

- Autocorrelation and/or YIN-style pitch detection for monophonic signals
- Confidence estimation
- Stability filtering
- Harmonic rejection
- Low-latency updates

The optical mode should use frame-to-frame brightness analysis with clear documentation that the measurable frequency range is constrained by the camera's frame rate and exposure characteristics. It is suitable for slow flashing indicators, rotating machinery with markers, and similar phenomena — not for arbitrary high-frequency acoustic measurements.

The vibration mode should be implemented only within the limits of the available device sensors. Modern phone accelerometers are excellent for demonstrating low-frequency vibration and mechanical oscillation, but they are not substitutes for dedicated vibration analyzers.

---

## Educational Tutorials (Tools 6 & 7)

### Tone & Noise Generator tutorials

1. Pink vs White Noise
2. What is a Sine Wave?
3. Why Audio Engineers Use Pink Noise
4. Linear vs Log Sweeps
5. Safe Signal Levels
6. Test Signals for Loudspeaker Testing
7. Signals Used for Room Measurement
8. How Noise Excites Different Frequencies

### Frequency Counter & Tuner tutorials

1. Frequency vs Pitch
2. How Electronic Tuners Work
3. Understanding Confidence
4. Harmonics and the Fundamental
5. Why Tuners Fail in Noisy Environments
6. Measuring Rotating Machinery
7. Optical Frequency Measurement
8. Vibration-Based Frequency Measurement
9. Reference Pitch Standards (A=440 Hz and Alternatives)
10. Common Frequency Measurement Errors

---

## Integration with Existing Tools

These two tools integrate naturally with the rest of the suite:

- **Tone & Noise Generator** provides the excitation signals used by the Spectrum Analyzer / RTA, Spectrogram, Waveform Viewer, and RT60 / Reverb Decay Estimator.
- **Frequency Counter & Tuner** complements the Waveform Viewer by identifying the dominant frequency, and complements the Spectrum Analyzer by giving a precise numeric estimate of the fundamental frequency.

Cross-links between tools should be built where appropriate. For example, after generating pink noise, the app could offer a one-tap transition to the Spectrum Analyzer or RT60 tool to demonstrate how that signal is used in measurement. Similarly, after identifying a stable 440 Hz tone in the Frequency Counter, the app could offer to open the Waveform Viewer or Spectrum Analyzer to examine that same signal from a different perspective. This reinforces that each tool presents a different view of the same underlying audio event.

*End of spec of record.*
