# Interactive Harmonic Visualizer and 3-D Waterfall Decay Learning Lab — Spec of Record

> Provenance: owner-authored specification, delivered 2026-07-25 (cowork session).
> Verbatim below; formatting only. Companion to APE_AUDIO_TOOLS_SPEC_2026_07_23.md.
> Status at receipt: HarmonicsView v1 (analytic + live) built in the Ear Training &
> Critical Listening Lab; RX-style upgrade (log axis, piano gutter, note labels,
> RX colormap, high-res) in flight. Waterfall tool PARKED until the harmonic
> visualizer is complete (owner directive).

---

These should be developed as two distinct but connected tools:

1. Harmonic Visualizer — teaches how a fundamental frequency, harmonics, waveform shape, phase, amplitude, distortion, and timbre relate.
2. 3-D Waterfall Decay Analyzer — teaches how sound energy decays across frequency and time, including resonances, reverberation, ringing, damping, and room-treatment effects.

The Harmonic Visualizer explains what frequencies make up a sound. The Waterfall Analyzer explains how long those frequencies remain after excitation stops.

---

## Tool 1: Interactive Harmonic Visualizer

### 1. Primary learning purpose

The student should be able to generate a sound, hear it, inspect its harmonic structure, manipulate individual components, and observe how those changes affect:

* The perceived timbre
* The waveform
* The frequency spectrum
* Harmonic distortion
* Crest factor and peak level
* Phase relationships
* Symmetry and polarity
* The relationship between a fundamental and its overtones

A harmonic visualizer should not merely resemble a spectrum analyzer. It should explicitly identify the fundamental, number each harmonic, show its mathematical relationship to the fundamental, and let the student manipulate those harmonics directly.

For a fundamental frequency f_0, the harmonic frequencies occur at integer multiples:

f_n = n × f_0

Therefore, a 100 Hz fundamental produces harmonics at 200 Hz, 300 Hz, 400 Hz, and so forth. Harmonic distortion is the addition of frequency components harmonically related to the original signal.

### 2. What an instructor would point out on the display

#### A. Fundamental frequency

Visually identify the first and usually strongest component as:

Fundamental — H1

Display:

* Frequency in hertz
* Musical note, when applicable
* Level in dBFS, dBu, dBV, or relative dB
* Phase in degrees
* Period in milliseconds
* Wavelength, when a temperature or speed-of-sound assumption is supplied

Example:

H1 — Fundamental
100 Hz · –12 dBFS · 0° phase · 10 ms period

The student should understand that the fundamental generally establishes the perceived pitch, although missing-fundamental perception and complex signals require additional explanation.

#### B. Numbered harmonics

Each harmonic peak should be labeled directly:

* H1 — 100 Hz
* H2 — 200 Hz
* H3 — 300 Hz
* H4 — 400 Hz
* H5 — 500 Hz

When the student touches a harmonic, the app should show:

* Harmonic number
* Exact frequency
* Frequency ratio relative to the fundamental
* Level relative to the fundamental
* Phase
* Whether it is odd or even
* Its contribution to total harmonic distortion
* A plain-language description of its likely audible effect

Example:

H3 — Third Harmonic
300 Hz · 3× fundamental · –24 dBc
Odd-order harmonic
Adds edge, buzz, and waveform asymmetry depending on its level and phase.

#### C. Harmonic spacing

A teaching overlay should connect the harmonic peaks and state:

Harmonics are evenly spaced in frequency by the value of the fundamental.

For a 250 Hz fundamental, the spacing is always 250 Hz.

This is important because students frequently mistake any regularly visible peaks for harmonics. The tool should help distinguish:

* True integer harmonics
* Interharmonics
* Sidebands
* Broadband noise
* Unrelated tones
* Aliasing products
* Power-line components
* Modulation products

#### D. Odd versus even harmonics

Odd harmonics:

* H3, H5, H7, H9

Even harmonics:

* H2, H4, H6, H8

The visualizer should offer an Odd/Even Highlight control that temporarily colors or outlines the two groups differently.

The student should be shown that:

* A symmetrical square wave contains primarily odd harmonics.
* A sawtooth wave contains both odd and even harmonics.
* A triangle wave contains primarily odd harmonics whose amplitudes decrease faster than those of a square wave.
* Asymmetrical nonlinearities can generate stronger even-order content.
* Symmetrical clipping commonly emphasizes odd-order components.

These should be presented as instructional tendencies rather than absolute descriptions of every physical device.

#### E. Harmonic amplitude envelope

An overlay line should trace the changing harmonic amplitudes.

Students should learn to recognize:

* Rapid harmonic roll-off
* Slow harmonic roll-off
* A single dominant overtone
* Alternating harmonic patterns
* Missing harmonics
* High-frequency extension
* Noise between harmonics

Touching the envelope could display:

Harmonic energy decreases approximately ___ dB per octave.

This helps connect spectral slope with perceived brightness.

#### F. Harmonics versus noise

Discrete tones and broadband noise should be visually distinguished.

An FFT spectrum is normally scaled appropriately for discrete sine-wave components, but broadband noise must be interpreted using spectral-density concepts and the analyzer's bin width and window. Consequently, the app should not let students assume that a noise-bin level is directly comparable with a discrete-tone peak without explanation.

The display should separately identify:

* Harmonic peaks
* Noise floor
* Hum components
* Spurious tones
* Modulation sidebands
* Aliasing products

#### G. Relationship to the waveform

The most important educational feature is a synchronized waveform display below the spectrum.

Every time the student changes a harmonic:

* The waveform updates.
* The sound updates.
* The harmonic spectrum updates.
* Meter values update.

This makes the tool a practical additive-synthesis laboratory.

The student should see that a spectrum describes the frequency components, while the waveform shows their combined instantaneous amplitude over time.

#### H. Phase relationships

Two sounds may contain the same harmonic frequencies and amplitudes yet have different waveform shapes because their harmonic phases differ.

The student should be able to alter the phase of one harmonic and observe:

* Changes in waveform shape
* Changes in peak amplitude
* Changes in crest factor
* Potentially little or no obvious change in steady-state timbre under some listening conditions

This is a particularly valuable advanced lesson because students often assume that a harmonic spectrum completely defines every visible waveform characteristic without considering phase.

#### I. THD and THD+N

The tool should show both:

* THD: contribution from measured harmonic components
* THD+N: distortion harmonics plus residual noise within the selected measurement bandwidth

THD and THD+N should not be presented as interchangeable. THD+N removes or excludes the fundamental and measures the remaining distortion and noise within the analysis bandwidth, while FFT-based analysis can identify individual harmonic products.

The readout should include:

* THD %
* THD dB
* THD+N %
* THD+N dB
* Highest measured harmonic
* Measurement bandwidth
* Fundamental level
* Residual noise level

The student should be able to touch the THD value and reveal the actual calculation components.

### 3. Required harmonic visualizer controls

#### Signal-source controls

Generator type

* Pure sine
* Square wave
* Triangle wave
* Sawtooth wave
* Pulse wave
* White noise
* Pink noise
* Custom additive waveform
* Microphone input
* Imported audio file
* App-generated training sound
* Device playback-loopback input, where technically supported

Fundamental frequency

Controls:

* Frequency slider
* Fine-adjust wheel
* Direct numerical entry
* Musical keyboard
* Note selector
* Octave up/down
* Semitone up/down
* Cent adjustment
* Sweep mode

Recommended range:

* 20 Hz–20 kHz for audible generation
* A wider analysis range where the hardware sample rate supports it

Output level

* Large level slider
* Mute
* Play/stop
* Fade-in/fade-out
* Maximum safe-output limiter
* Calibration state indicator
* Level units
* Left/right/both channel selection

A mandatory warning should appear before high-level headphone playback.

#### Harmonic manipulation controls

Each harmonic should have a draggable vertical stem or handle.

For every harmonic:

* Enable/disable
* Solo
* Mute
* Amplitude
* Phase
* Frequency lock
* Frequency offset
* Pan, when using stereo
* Polarity
* Reset
* Copy settings
* Contribution to THD

Recommended direct gesture:

* Drag vertically to change level.
* Drag horizontally only when frequency unlocking is enabled.
* Tap to select.
* Double-tap to reset.
* Long-press to open detailed parameters.
* Two-finger vertical gesture adjusts all selected harmonics.
* Pinch adjusts frequency-axis zoom.

The tool should initially lock harmonics to exact integer multiples. An advanced control can unlock a component to demonstrate that it has become an inharmonic partial rather than a harmonic.

#### Harmonic-group controls

* Add harmonic
* Remove harmonic
* Number of displayed harmonics
* Odd harmonics only
* Even harmonics only
* Solo odd
* Solo even
* Mute odd
* Mute even
* Randomize amplitudes
* Randomize phases
* Normalize output
* Harmonic tilt or spectral slope
* Low-pass harmonic limit
* High-pass harmonic limit
* Harmonic level decay
* Restore canonical waveform

Canonical presets:

* Sine
* Square
* Triangle
* Sawtooth
* Pulse
* Symmetrical clipping
* Asymmetrical clipping
* Soft saturation
* Hard clipping
* Tube-like demonstration
* Transformer-like demonstration
* Speaker nonlinear-distortion demonstration

The product should avoid claiming that a simple harmonic recipe perfectly reproduces a real tube, transformer, loudspeaker, or tape machine. These presets should be labeled as simplified instructional models.

#### Analyzer controls

FFT size or frequency resolution

Offer student-friendly options:

* Fast
* Balanced
* Detailed
* Advanced/manual

Advanced display:

* FFT size
* Bin width
* Sample rate
* Time-record length

FFT analysis converts a signal into individual spectral components. Frequency resolution depends partly on the captured time length and FFT configuration, while faster updates require shorter records or additional compromises.

Window selection

Include:

* Rectangular
* Hann
* Hamming
* Blackman-Harris
* Flat Top

Each should have an information panel describing:

* Spectral leakage
* Amplitude accuracy
* Main-lobe width
* Frequency separation
* Appropriate instructional use

Recommended default: Hann, with simplified settings presented to beginners.

Averaging

* None
* Exponential
* Linear
* Peak hold
* Maximum hold
* Slow averaging
* Fast averaging
* Number of averages

Smoothing

* None
* 1/48 octave
* 1/24 octave
* 1/12 octave
* 1/6 octave
* 1/3 octave

For the harmonic laboratory, smoothing should default to off, because excessive smoothing can conceal discrete harmonics.

Axis controls

Frequency:

* Linear
* Logarithmic
* Musical-note view
* Harmonic-number view

Level:

* dBFS
* dBc relative to fundamental
* Percentage
* Linear amplitude
* Calibrated SPL when available

Range:

* Auto
* Manual
* Zoom to harmonics
* Zoom to selected component

Measurement controls

* Fundamental auto-detect
* Fundamental manual entry
* Harmonic count
* Highest-order harmonic
* Detection threshold
* Noise-floor threshold
* Analysis bandwidth
* THD standard/method information
* Exclude DC
* Include/exclude selected components
* Freeze
* Capture
* Compare
* A/B overlay
* Save snapshot

### 4. Essential harmonic visualizer learning modes

Guided Identify Mode

The app asks the student to touch:

* The fundamental
* The third harmonic
* The strongest even harmonic
* The noise floor
* A nonharmonic spur
* A sideband
* The highest visible harmonic

Build the Waveform

The student receives a target waveform and must recreate it by adding harmonics.

Exercises:

* Build a square wave.
* Build a triangle wave.
* Build a sawtooth wave.
* Make the waveform brighter without changing the fundamental.
* Reduce high-frequency content without changing pitch.
* Create asymmetry using even harmonics.
* Change crest factor using phase without changing harmonic levels.

Hear the Harmonic

The app highlights one harmonic and alternates:

* Full signal
* Full signal minus that harmonic
* That harmonic soloed

The student identifies what changed.

Distortion Recognition

Generate:

* Clean sine
* Soft clipping
* Hard clipping
* Symmetrical clipping
* Asymmetrical clipping
* Crossover distortion
* Hum contamination
* Buzz contamination
* Aliasing
* Intermodulation products

The student must identify the visual and audible pattern.

Harmonic Matching

Display a target spectrum. The student adjusts harmonic levels until the generated spectrum matches.

Hidden Spectrum Test

Play a complex harmonic signal with the graph concealed. The student estimates:

* Bright or dark
* Odd- or even-dominant
* Clean or distorted
* Approximate harmonic order
* Strongest overtone

Then the display is revealed.

---

## Tool 2: 3-D Waterfall Reverb and Decay Analyzer

### 1. What the waterfall represents

A waterfall graph shows how spectral energy changes over time. It can be generated by taking successive windows through an impulse response or captured audio and plotting the spectrum of each time slice.

The three principal axes should be:

* X-axis: frequency
* Y-axis: time after excitation
* Z-axis: level or amplitude

Color can provide a second representation of level, but the tool must not depend on color alone because of accessibility requirements.

The graph should answer:

At which frequencies does energy remain, and how long does it take to decay?

### 2. What an instructor would point out

#### A. Initial response

The front ridge represents the sound's initial spectral energy.

Students should distinguish:

* A strong initial frequency from
* A frequency that remains for an unusually long time

A tall ridge is not necessarily a long decay. A lower ridge may persist longer.

#### B. Decay slope

The downward slope shows how rapidly energy decreases.

Explain:

* Steep slope = rapid decay
* Shallow slope = slow decay
* Extended ridge = persistent resonance or ringing
* Smooth, consistent decay = relatively uniform decay behavior
* Irregular bumps = reflections, noise, modulation, or measurement artifacts

#### C. Frequency-dependent decay

Reverberation does not necessarily decay equally at all frequencies.

Students should inspect:

* Low-frequency modal ringing
* Mid-frequency decay
* High-frequency damping
* Frequency regions with unusually long tails
* Frequency regions absorbed too quickly

The waterfall must therefore not present one RT60 number as a complete characterization of the room.

ISO 3382 addresses measurement of reverberation time and related room-acoustical parameters, including methods for ordinary rooms and performance spaces.

#### D. Resonant ridges

A narrow frequency ridge extending backward in time generally indicates a resonance.

The student should learn:

* Frequency of resonance
* Peak level
* Decay duration
* Bandwidth
* Approximate Q
* Whether the ridge is isolated or part of a broader decay region

The app should allow the student to tap a ridge and receive:

Resonance detected
Center: 63 Hz
Bandwidth: 7 Hz
Approximate Q: 9
Decay to –30 dB: 480 ms

The term "room mode" should only be applied when the measurement context supports that conclusion. A resonance could also originate from a loudspeaker, cabinet, enclosure, object, microphone placement, or processing system.

#### E. Early reflections

Early reflections may appear as secondary structures near the front of the display.

Students should understand that:

* A waterfall is useful for broad decay behavior.
* An impulse-response or energy-time-curve display is usually clearer for precisely identifying individual reflection arrival times.
* The waterfall can reveal spectral coloration associated with the reflections.

The app should link directly to the Impulse Response or ETC view where available.

#### F. Noise floor

A decay cannot be meaningfully interpreted once it enters the measurement noise floor.

The display should visibly mark:

* Estimated noise-floor surface
* Reliable decay region
* Unreliable region
* Available decay range
* Clipping or overload
* Insufficient excitation

The student should not be allowed to interpret a flattened noise floor as reverberation continuing indefinitely.

#### G. RT20, RT30, and estimated RT60

Show:

* EDT
* T20
* T30
* Estimated RT60
* Decay confidence or fit quality
* Available dynamic range

The student must learn that RT60 may be extrapolated from a shorter measured decay rather than always observing a complete 60 dB decay directly.

The app should include this plain-language explanation:

RT60 estimates how long the sound would take to fall by 60 dB. Depending on the measurement method and available decay range, the value may be calculated from a shorter portion of the measured decay.

#### H. Damping

Use "damping," not "dampening," as the primary technical term.

Students should observe that increasing damping typically:

* Reduces resonance amplitude
* Shortens decay time
* Broadens or changes resonant behavior depending on the system
* Reduces persistent ringing
* Does not necessarily produce a flat frequency response

The key learning distinction is:

Amplitude correction and decay correction are not the same thing.

An EQ filter can reduce the measured level of a resonance at one position, but it cannot necessarily remove the underlying stored acoustic energy throughout the room.

### 3. Required waterfall controls

#### Sound-generation controls

Excitation type

* Logarithmic sine sweep
* Linear sine sweep
* Stepped sine
* Impulse
* Maximum-length sequence, where implemented
* Pink-noise burst
* White-noise burst
* Tone burst
* Single-frequency burst
* Band-limited noise
* Percussive test signal
* Imported sound
* Microphone capture
* Simulated room response

A stepped-frequency sweep is useful for certain frequency-response and distortion measurements, although it is slower than chirp-based methods.

Excitation frequency range

* Start frequency
* Stop frequency
* Full range
* Subwoofer range
* Low-frequency room mode range
* Speech range
* User-defined range

Burst controls

* Center frequency
* Bandwidth
* Burst duration
* Number of cycles
* Envelope shape
* Repetition interval
* Level
* Silence before burst
* Silence after burst

Sweep controls

* Start frequency
* End frequency
* Sweep duration
* Level
* Fade
* Number of repetitions
* Pre-roll
* Post-roll

#### Simulated acoustic controls

This is where the learning laboratory becomes especially powerful.

Reverb time

* Global RT60
* Low-band RT60
* Mid-band RT60
* High-band RT60
* Frequency-dependent decay curve

Room presets

* Anechoic
* Vocal booth
* Control room
* Recording studio
* Classroom
* Office
* Living room
* Auditorium
* Concert hall
* Gymnasium
* Church or worship space
* Warehouse
* Outdoor environment
* Highly reflective empty room

These should be labeled as educational simulations unless they derive from actual measured impulse responses.

Room dimensions

* Length
* Width
* Height
* Temperature
* Speed of sound
* Source position
* Listener/microphone position

The app can calculate and display predicted axial modal frequencies, then allow the student to compare them with simulated or measured waterfall ridges.

Surface controls

For each surface:

* Absorption amount
* Frequency-dependent absorption
* Reflection strength
* Diffusion
* Scattering
* Surface area
* Material preset

Material examples:

* Concrete
* Glass
* Gypsum board
* Carpet
* Heavy curtain
* Acoustic panel
* Mineral wool
* Wood
* Upholstered seating
* Occupied versus unoccupied seating

The app should state that generic material coefficients are estimates and do not replace manufacturer test data or an in-room measurement.

Resonance controls

Create one or more artificial resonances:

* Center frequency
* Gain
* Q
* Decay time
* Start delay
* Harmonic coupling
* Enable/disable

This lets the student deliberately create a 63 Hz or 125 Hz ringing ridge and then attempt to reduce it.

#### Treatment and damping controls

* Add broadband absorber
* Add bass trap
* Add tuned absorber
* Add resonant membrane absorber
* Add ceiling cloud
* Add rear-wall absorption
* Add side-wall absorption
* Add diffusion
* Change treatment thickness
* Change air gap
* Change coverage area
* Adjust low-frequency effectiveness
* Bypass all treatment
* Before/after comparison

The student should be able to drag an absorber onto a simplified room diagram and observe the simulated waterfall change.

#### Display controls

View mode

* 3-D Waterfall
* Top-down spectrogram
* Side decay view
* Front frequency-response view
* RT decay by frequency
* Split before/after
* Overlay before/after
* Difference view

A spectrogram can be considered a top-down representation of waterfall-type time-frequency data, with level indicated by color.

3-D navigation

* One-finger rotate
* Two-finger pan
* Pinch zoom
* Double-tap reset view
* Axis-lock button
* Front view
* Side view
* Top view
* Isometric view
* Auto-rotate demonstration
* Perspective/orthographic toggle

Frequency axis

* Linear
* Logarithmic
* Octave
* 1/3 octave
* 1/6 octave
* 1/12 octave
* Narrowband
* Musical-note labels

Time axis

* 50 ms
* 100 ms
* 200 ms
* 500 ms
* 1 second
* 2 seconds
* 5 seconds
* 10 seconds
* User-defined

Level axis

* dBFS
* Relative dB
* Calibrated SPL
* Automatic range
* Manual top and bottom
* 30 dB, 45 dB, 60 dB, or 90 dB decay span

Slice settings

* Number of slices
* Slice interval
* Window length
* Window type
* Overlap
* Time smoothing
* Frequency smoothing

REW's waterfall implementation uses windowed sections of the impulse response and provides controls affecting the generated decay view.

Color and accessibility

* Color palette selector
* Grayscale
* High contrast
* Contour lines
* Surface mesh
* Texture patterns
* Color scale legend
* Level labels
* Color-blind-safe palettes
* Do not rely solely on red/green distinctions

#### Analysis-mode controls

Fourier Waterfall

Best for observing decay over actual elapsed time.

Burst Decay

Useful for comparing resonances by decay expressed in periods rather than only milliseconds. This can make resonances with similar Q easier to compare across different frequencies.

Spectral Decay

Shows changing spectral content across sequential time slices.

RT60 Decay

Shows decay estimates across frequency bands.

Compare Mode

* Current versus previous
* Untreated versus treated
* Dry versus reverberant
* EQ off versus EQ on
* Position A versus Position B
* Source A versus Source B

Cursor measurement

Touch any point and show:

* Frequency
* Time
* Level
* Relative decay
* Local decay slope
* Approximate resonance bandwidth
* Approximate Q
* Confidence
* Slice number

Ridge tracking

Automatically trace resonances through time.

Controls:

* Detection threshold
* Minimum duration
* Minimum prominence
* Maximum number of ridges
* Show/hide labels

### 4. Waterfall learning laboratories

Lab 1: Frequency, level, and time

The student touches the three axes and identifies:

* Which axis represents frequency
* Which represents elapsed time
* Which represents level
* What the front edge means
* What the back of the display means

Required outcome:
The student can correctly explain a waterfall plot in one sentence.

Lab 2: Peak versus decay

Present two resonances:

* Resonance A is taller but decays quickly.
* Resonance B is lower but rings longer.

Ask:

Which resonance has the greater initial amplitude?
Which has the longer decay?
Which is more likely to cause sustained ringing?

Required outcome:
The student no longer equates peak height with decay duration.

Lab 3: Add damping

The student increases simulated absorption while the graph updates continuously.

They must identify:

* Which frequency bands changed
* Whether the initial response changed
* Whether the decay changed
* Whether the treatment affected low frequencies
* Whether the treatment was broadband or frequency-selective

Lab 4: Bass trapping

Generate low-frequency ridges at several room modes.

The student adds bass trapping and compares:

* Peak level
* Decay time
* Ridge width
* Consistency across listening positions

Lab 5: High-frequency absorption

The student adds curtains or thin absorption.

Expected result:

* High-frequency decay becomes shorter.
* Low-frequency modal decay changes very little.

This demonstrates that thin absorbers do not automatically solve bass ringing.

Lab 6: Change room dimensions

The student changes room length, width, or height and watches predicted modal frequencies move.

Required lesson:

Room-mode frequencies are related to room dimensions; changing a dimension changes the corresponding modal pattern.

Lab 7: Move the microphone

The student moves the virtual microphone.

Observe:

* Peak levels change.
* Nulls change.
* Some decay estimates change.
* The room itself has not physically changed.

Required lesson:

One measurement position does not completely characterize an entire room.

Lab 8: EQ versus acoustic treatment

Provide two buttons:

* Apply EQ
* Add acoustic damping

The student observes that EQ may reduce a frequency-response peak at the measurement point, while treatment can change stored-energy decay behavior more broadly.

Required outcome:

The student can distinguish frequency-response correction from acoustic-decay correction.

Lab 9: Identify the noise floor

Reduce the excitation level until the decay enters the noise floor early.

Ask the student to mark the trustworthy portion of the decay.

Required outcome:

The student recognizes that reliable decay measurement requires adequate signal-to-noise ratio.

Lab 10: Find the resonance

The app hides all labels. The student must:

1. Rotate the waterfall.
2. Locate the longest ridge.
3. Touch its center.
4. Record its frequency.
5. Estimate its decay.
6. Select an appropriate corrective strategy.

Lab 11: Reverb character comparison

Use the same dry sound through:

* Small room
* Plate
* Chamber
* Hall
* Spring
* Highly damped room

Show that reverb types can differ in:

* Decay time
* Frequency-dependent damping
* Density
* Early reflection pattern
* Modal behavior
* High-frequency roll-off

Lab 12: Listening-first identification

The student hears a processed burst but cannot initially see the waterfall.

They estimate:

* Short or long decay
* Bright or dark decay
* Low-frequency ringing
* Narrow resonance
* Excessive high-frequency damping

The plot is then revealed.

### 5. Required student touch interactions

Every interactive object should teach something.

| Student action | Immediate result | Learning purpose |
|---|---|---|
| Touch harmonic peak | Opens harmonic identity card | Identifies harmonic order and frequency |
| Drag harmonic upward | Increases component level and changes sound | Connects spectral amplitude with timbre |
| Drag harmonic phase | Changes waveform shape | Connects phase with waveform summation |
| Solo harmonic | Plays only that component | Builds overtone recognition |
| Remove harmonic | A/B playback updates | Reveals contribution to the complete signal |
| Touch waterfall ridge | Shows frequency, time, level and decay | Teaches multidimensional graph reading |
| Drag through time | Auditions or highlights sequential slices | Connects sound decay with visual decay |
| Rotate graph | Reveals hidden ridges and slopes | Develops spatial interpretation |
| Add treatment | Regenerates waterfall | Connects physical treatment with decay |
| Move microphone | Recalculates response | Teaches spatial measurement variability |
| Apply EQ | Alters response comparison | Distinguishes level correction from damping |
| Change Q | Narrows/widens resonance | Teaches bandwidth and resonance |
| Change RT60 | Extends or shortens decay surface | Connects numerical RT with audible persistence |

### 6. Required student outcomes

After completing both tools, the student should be able to:

1. Identify a fundamental and correctly number its harmonics.
2. Calculate harmonic frequencies from a given fundamental.
3. Distinguish odd and even harmonics.
4. Explain how harmonic amplitude affects timbre.
5. Explain how harmonic phase affects waveform shape and peak level.
6. Distinguish harmonics, noise, spurious tones, sidebands, and inharmonic partials.
7. Explain the difference between THD and THD+N.
8. Recognize common spectra produced by sine, square, triangle, sawtooth, clipping, hum, and buzz.
9. Explain the frequency, time, and level axes of a waterfall plot.
10. Locate and characterize a resonant ridge.
11. Distinguish initial amplitude from decay duration.
12. Recognize frequency-dependent reverberation.
13. Explain RT60, EDT, T20, and T30 at an introductory level.
14. Identify when a decay has entered the noise floor.
15. Explain why microphone position affects a room measurement.
16. Distinguish EQ correction from acoustic damping.
17. Predict the general effect of broadband absorption, thin absorption, and bass trapping.
18. Compare before-and-after waterfall measurements without relying only on visual appearance.
19. Select appropriate analysis resolution, frequency range, and time range.
20. Correlate what they hear with what they see.

### 7. Recommended mobile screen architecture

These tools contain too many parameters for one mobile screen. Use progressive disclosure.

Harmonic Visualizer

Main view

* Play/mute
* Fundamental-frequency control
* Output level
* Spectrum
* Waveform
* Harmonic handles
* Selected-harmonic card
* Presets
* Compare
* Learning Lab button

Expandable control drawers

* Signal
* Harmonics
* Analyzer
* Measurements
* Display
* Lessons

Waterfall Analyzer

Main view

* 3-D waterfall
* Play/test button
* Frequency range
* Time range
* Selected-point readout
* Rotate/reset view
* Before/after
* Learning Lab button

Expandable control drawers

* Test Signal
* Room
* Damping
* Analysis
* Display
* Measurements
* Lessons

### 8. Critical implementation cautions

* Do not call every narrow ridge a room mode.
* Do not imply that RT60 is directly observed when it was extrapolated.
* Do not hide the measurement bandwidth or noise-floor limitations.
* Do not apply fractional-octave smoothing by default to harmonic identification.
* Do not let graph rotation obscure axis labels.
* Do not use color as the only indication of level.
* Do not present simulated treatment performance as equivalent to an actual room measurement.
* Do not imply that EQ and absorption perform the same corrective function.
* Do not generate unsafe headphone levels.
* Do not let students change multiple hidden parameters without a visible reset or comparison state.
* Every lesson should retain an A/B Before–After function.
* Every generated state should include Hear It, See It, Explain It, and Test Me actions.

The strongest educational integration is to allow a student to create a harmonic-rich tone in the Harmonic Visualizer, send that same sound into a simulated room, and then inspect its decay in the 3-D Waterfall Analyzer. That creates one continuous learning chain:

Generate the sound → alter its harmonics → hear its timbre → excite the room → modify damping → inspect the frequency-dependent decay.
