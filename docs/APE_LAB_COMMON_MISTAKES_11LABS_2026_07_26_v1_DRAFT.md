# AP&E STUDIO — AUTHORED LAB CONTENT: COMMON MISTAKES (REMAINING 11 LABS)
## Companion 2 — completes Common-Mistakes coverage for all 16 audio labs
**Date:** 2026-07-26 · **Version:** v1 · **Status:** 🟠 DRAFT / CANDIDATE — PENDING PROF. BOOTH APPROVAL
**Feeds:** `APE_LEARNING_LAB_ECOSYSTEM_ARCHITECTURE_2026_07_26_v3_DRAFT.md` §7 — Labs **1 EQ · 2 Delay · 3 Reverb · 4 Chorus · 7 Compression · 10 Distortion · 11 Noise · 12 Phase · 13 Harmonic · 14 Oscillator · 16 Harmonograph.**
**Pairs with:** `APE_LAB_CONTROLS_AND_COMMON_MISTAKES_5LABS_2026_07_26_v1_DRAFT.md` (Flanger · Phaser · Gate · Limiter · Stereo Imaging). Together these two docs give **Common Mistakes for all 16 labs.**

> **Format:** each lab lists its controls (already fixed in main spec §7 — restated for context), then **Common Mistakes** (the mandatory Guided-Lesson element), **Pro Tips**, and a **Formula/Concept** note. Standard signal-processing fundamentals (high confidence); opinionated calls marked **[opinion]**. Nothing invented — this authors the Common-Mistakes content you flagged as crucial.

---

## LAB 1 — EQUALIZER
*Controls: Graphic · Parametric · Shelving · High-pass · Low-pass · Band-pass · Notch · Tilt · Dynamic EQ.*

### Common Mistakes
- **Boost-sweep to *find*, then forgetting to *cut*.** The find-a-resonance trick (narrow boost + sweep) is diagnostic only — often the fix is a **cut**, not the boost you left in.
- **Boosting when you should cut.** Additive EQ piles up gain and phase problems; **subtractive** EQ (remove the mud/resonance) is usually cleaner and preserves headroom.
- **Narrow Q for tonal shaping.** Surgical Q is for notches/hum; broad, musical moves need **wide Q**. Narrow Q used for "warmth" rings and sounds artificial.
- **Forgetting minimum-phase EQ shifts phase.** Every bell boost/cut rotates phase around the band; heavy EQ on multi-mic sources → comb filtering. (The *phase shift* outcome; linear-phase avoids it but adds pre-ring.)
- **Not high-passing non-bass sources.** Subsonic rumble eats headroom and muddies the mix.
- **EQ'ing in solo.** A track shaped to sound great alone often clashes or vanishes in the mix — judge **in context.**
- **Chasing a flat analyzer.** "Flat spectrum" is not the goal; the analyzer informs, ears decide. (Honest-metrics: the meter is a guide, not the target.)
- **Static cut for sibilance.** A fixed high cut dulls everything; sibilance is dynamic → use a **de-esser**. (The *reduce sibilance* challenge.)
- **One wide cut for hum.** Hum is 50/60 Hz **plus harmonics** (120, 180…); notch the **harmonic series**, not one band. (The *remove 60 Hz hum* challenge.)
- **Recipe EQ.** "3 kHz presence / 250 Hz mud" by rote without listening — every source differs.

### Pro Tips
- Cut first to clean up, then boost sparingly to flatter. Level-match before/after — boosts trick the ear into "better."
- Teach Q with pink noise: same +6 dB boost at Q=0.7 vs Q=8 — hear "tone" vs "ring."

### Formula / Concept
**Q ≈ Fc / bandwidth**; a bell's bandwidth in octaves relates to Q; filter **slope** is 6/12/18/24 dB per octave (1/2/3/4-pole). Shelf vs bell vs pass = which part of the band is affected.

---

## LAB 2 — DELAY
*Controls: Delay time · Feedback · Wet/Dry · Ping-pong · Stereo width · Filtering · Modulation · Sync BPM.*

### Common Mistakes
- **Feedback too high → runaway/self-oscillation.** Builds into a howl. Finding that threshold *is* the lesson — approach, don't trip it by accident.
- **Delay time fighting the tempo.** Un-synced repeats smear the groove; sync to note values or tap tempo. (The *tempo sync* outcome.)
- **"Slapback" set too long.** True slapback ≈ **60–150 ms, single repeat, low feedback**; longer becomes a distinct echo. (The *create slapback* challenge.)
- **Wet too loud on a lead vocal.** Buries intelligibility; delays usually sit *behind* the dry.
- **Unfiltered repeats.** Full-range feedback stacks harsh, cluttered echoes; roll off highs (and often lows) so repeats **recede** (tape/analog behavior).
- **Wide/ping-pong delay that cancels in mono.** Always mono-check.
- **Confusing delay with reverb.** Discrete repeats vs a diffuse wash — different tools, different purpose.

### Pro Tips
- Start 1/8-dotted synced, feedback ~25%, wet low, highs rolled off — instantly musical.
- Use Freeze/Peak-Hold to let students *predict the next echo* before it lands.

### Formula / Concept
**Delay for a note (ms) = (60000 / BPM) × note-fraction.** Quarter-note ms = 60000/BPM. This powers *identify BPM from delay* and *match delay time* directly.

---

## LAB 3 — REVERB
*Controls: Room size · Pre-delay · Decay · Diffusion · Early/Late reflections · HF/LF damping · Density · Mix.*

### Common Mistakes
- **Too much reverb.** Washes the mix, pushes sources back, kills clarity. Less is usually more.
- **No pre-delay → source glued to the tail.** A little pre-delay (~10–40 ms) separates the dry transient from the wash, keeping vocals upfront. (The *find pre-delay* exercise.)
- **Muddy tail (no HPF / LF damping).** Low-end buildup in the tail muddies everything → **high-pass the reverb return** and add LF damping. (The *remove muddy reverb* exercise.)
- **Confusing room size with decay time.** A large room can decay quickly (absorptive) and a small room slowly — **separate controls.** Classic conceptual error. (Room-size vs RT60 outcomes.)
- **Decay fighting the tempo/space.** Long tails on fast/busy material turn to mush.
- **One reverb on everything.** Kills depth; varied pre-delay/decay build front-to-back layering.
- **Reverb before fixing source problems.** It *amplifies* sibilance/boxiness already present.
- **Sending sub/bass to reverb.** Rumbly, unstable tail — high-pass the send.

### Pro Tips
- Compare **hall vs plate** on the same vocal to hear diffusion/density differences (the built-in exercise).
- Automate/duck reverb under the dry vocal phrase, bloom in the gaps.

### Formula / Concept
**RT60** = time to decay 60 dB. **Sabine:** RT60 = 0.161·V / A (V = room volume m³, A = total absorption in sabins) — links directly to the Wave-Physics **Absorption** module and *guess RT60*.

---

## LAB 4 — CHORUS
*Controls: Depth · Rate · Delay · Voices · Stereo width · Feedback · Mix.*

### Common Mistakes
- **Rate/Depth too high → seasick, out-of-tune warble.** Excess modulation reads as detuning, not lushness.
- **Confusing chorus with flanger/vibrato.** Chorus = **longer delay (~15–35 ms)**, multiple detuned voices, little/no feedback → thickening. Short delay + feedback drifts to **flanger**; 100% wet with no dry = **vibrato**.
- **100% wet kills the effect.** Chorus needs the **dry voice** to beat against the detuned copies; full-wet just gives pitch-modulated signal.
- **Wide stereo chorus that thins/cancels in mono.** Mono-check.
- **Using it purely as a width tool.** Widens but adds phasey comb filtering — verify mono compatibility.
- **Chorusing the bass.** Modulated pitch/comb on lows is unstable and muddy — keep bass dry/mono.

### Pro Tips
- 2–3 voices, gentle depth, delay ~20 ms, mix ~30–40% = classic lush without detune artifacts.
- Show the **Lissajous** while widening so students *see* the stereo decorrelation.

### Formula / Concept
Chorus = dry + LFO-modulated, slightly pitch-shifted delayed copies (~15–35 ms). **Beating** between detuned voices = the "wide/thick" perception; summing exposes **comb filtering** (worst in mono).

---

## LAB 7 — COMPRESSION
*Controls: Threshold · Ratio · Attack · Release · Knee · Lookahead · Makeup gain · Sidechain.*

### Common Mistakes
- **Attack too fast → transients killed.** Clamps the initial hit; drums lose punch. To **preserve transients**, *slow* the attack so the transient passes before gain reduction engages. (The *preserve transients* challenge.)
- **Release too fast → distortion/pumping** (worst on bass); too slow → never recovers, over-compresses. (The *compress without pumping* challenge.)
- **Ratio/GR too high.** Squashes the life out. 2–4:1 for glue; higher only for control.
- **Makeup-gain "louder = better" bias.** Compression + makeup raises level, which *feels* better. **Level-match** bypass vs active to judge honestly.
- **Watching the GR meter instead of listening.** A big number isn't the goal.
- **Ignoring the knee.** Hard knee = obvious/controlling; soft knee = transparent. Skipping it causes abrupt onset.
- **No sidechain HPF on the bus → bass pumps the whole mix.** Filter the detector so kick/bass don't trigger full-band ducking.
- **Stacking compressor → limiter to death.** Multiple squashers destroy dynamics.

### Pro Tips
- Dial threshold for ~3–6 dB GR on peaks, then set attack for punch and release for the groove; makeup last, then A/B level-matched.
- Fast attack + slow release "glues"; slow attack + fast release "punches."

### Formula / Concept
Above threshold, **gain reduction = (input − threshold) × (1 − 1/ratio)**. Attack/Release = the envelope-detector time constants; Knee softens the ratio around the threshold.

---

## LAB 10 — DISTORTION
*Controls: Tube · Tape · Hard clip · Soft clip · Saturation · Bit crush · Sample reduction.*

### Common Mistakes
- **No oversampling → aliasing.** Nonlinearity creates harmonics above Nyquist that **fold back** as inharmonic harshness. Oversample — **but** aliasing is *also* a teaching target here, so make oversampling a **toggle** (hear it on/off). (R5 anti-alias note.)
- **Confusing loudness with distortion.** Drive raises level; **level-match** to judge character, not "more."
- **Too much drive.** A touch adds harmonics/glue; excess buries clarity and intelligibility.
- **Not distinguishing odd vs even harmonics.** Symmetric clip (hard) → **odd** harmonics (hollow/harsh); asymmetric (tube-like) → **even** harmonics (warm). Students should *see* this on the harmonic analyzer — the core lesson.
- **Bit-crush vs sample-reduction confusion.** Bit reduction = **quantization noise** (gritty floor); sample-rate reduction = **aliasing/downsampling** artifacts. Different mechanisms, different sound.
- **Distorting the full range.** Often better to band-limit (drive the mids, keep lows/highs clean) to avoid fizz/mud.
- **DC offset from asymmetric shaping.** Builds up → click/headroom loss; HPF after the shaper.

### Pro Tips
- A/B hard-clip vs tube on a sine and read the FFT: odd-only vs odd+even harmonic stacks.
- Push a high sine with oversampling OFF to *show* aliasing (inharmonic partials), then ON to remove it.

### Formula / Concept
A nonlinearity y = f(x) expands a sine into a **harmonic series**; symmetric f → odd harmonics, asymmetric f → even too. Any harmonic above **fs/2** aliases to **fs − f**. **THD** = harmonic energy ÷ fundamental energy.

---

## LAB 11 — NOISE
*Sources: White · Pink · Brown · Blue · Violet · Grey · Speech · HVAC · Traffic · Wind · Hum · Buzz · RF · Crackle · Static · Ground loop.*

### Common Mistakes
- **Expecting white noise to sound "neutral/flat."** White has equal energy **per Hz**, so it sounds **bright/hissy** (each higher octave holds twice the bandwidth). **Pink** (equal energy per octave) sounds balanced. This surprise is the core color lesson.
- **Mixing up the colors.** White (flat), pink (−3 dB/oct), brown/red (−6 dB/oct, rumbly), blue (+3), violet (+6). The spectrum display settles it.
- **Judging level across colors by loudness.** Equal-RMS noises of different colors *sound* very different — don't set levels by number alone.
- **Not reasoning about the noise floor / SNR.** Calling a signal "clean" without checking how far it sits above the floor.
- **Misreading hum vs buzz vs ground loop.** Hum = tonal 50/60 Hz + low harmonics; buzz = richer/spikier harmonics (dimmers/SCR); ground loop = 50/60 Hz hum from a wiring loop. The **spectrogram** distinguishes them — a great diagnostic lesson.
- **Forgetting masking.** A noise can be inaudible when masked by louder nearby-frequency content; SNR alone doesn't predict audibility.

### Pro Tips
- Put white and pink side-by-side on the spectrum + let students hear both — the "why does white sound brighter?" moment.
- Use the spectrogram to identify a mystery noise (hum vs buzz vs RF) as a challenge.

### Formula / Concept
**Color = spectral slope** (dB/octave); pink ∝ 1/f power. **SNR (dB) = 20·log₁₀(signal/noise)**. Masking threshold rises with masker level within the **critical band**.

---

## LAB 12 — PHASE
*Controls: Delay one channel · Invert polarity · Rotate phase · Stereo width.*

### Common Mistakes
- **Confusing polarity with phase.** **Polarity** = flip the whole waveform (the "Ø" button; 180° at *all* frequencies). **Phase** = a frequency-dependent time/angle shift. They are **not** interchangeable — this is the defining lesson.
- **Assuming a polarity flip always fixes cancellation.** It fixes a simple inversion; **time-delay comb filtering** needs **time alignment**, not a flip.
- **Not checking mono.** Content that's wide/phasey in stereo can cancel in mono — read the correlation meter and mono-fold.
- **Misreading the Lissajous/correlation.** Vertical line = mono/in-phase (**+1**); horizontal line = anti-phase (**−1**, cancels in mono); a ball = wide/decorrelated.
- **Treating any negative correlation as "bad."** Some width uses controlled decorrelation; **sustained −1** on key elements is the real problem.
- **Delaying one channel for width without mono-checking.** Introduces comb filtering.

### Pro Tips
- Demo: sum two identical signals, flip polarity on one → silence (the pure cancellation), then delay one → comb, showing polarity ≠ phase.
- Keep the correlation meter on screen for every width move.

### Formula / Concept
Polarity invert = **× (−1)** (broadband 180°). A time delay τ gives **φ(f) = −2πfτ** (phase grows with frequency → comb notches). **Correlation** = normalized cross-correlation of L/R (+1 / 0 / −1).

---

## LAB 13 — HARMONIC
*Generate: Sine · Square · Sawtooth · Triangle · Pulse · PWM · Complex. Manipulate: Frequency · Amplitude · Duty cycle · Wave shape · Add/Remove harmonics.*

### Common Mistakes
- **Not knowing which wave has which harmonics.** Sine = fundamental only; **square = odd** harmonics (∝1/n); **saw = all** harmonics (∝1/n); **triangle = odd** (∝1/n²). Confusing these is the central content gap — the harmonic analyzer fixes it.
- **Reading the oscilloscope for spectrum.** The scope shows the **time-domain shape**; harmonic content is on the **FFT/analyzer**. Judging harmonics from the waveform is a classic error.
- **Expecting duty cycle to change pitch.** PWM changes **timbre/harmonic content** (and nulls certain harmonics), **not** the fundamental.
- **Thinking a real square/saw is "perfect."** Ideal versions need infinite harmonics; band-limited/naïve digital ones differ and can alias.
- **Amplitude vs harmonic-amplitude confusion.** Overall level up ≠ "adding harmonics."
- **Ignoring harmonic phase.** Same harmonic amplitudes, different phases → very different **waveform shape** but nearly identical steady-tone sound (the ear's phase-deafness) — a subtle, memorable lesson.

### Pro Tips
- Build a square by **adding odd harmonics one at a time** (1st, 3rd, 5th…) and watch the scope approach a square — Fourier synthesis made visible.
- Sweep PWM duty and watch harmonics **null and reappear** on the analyzer.

### Formula / Concept
**Fourier series:** square = Σ odd n, amplitude 1/n · saw = Σ all n, 1/n · triangle = Σ odd n, 1/n². **Pulse (duty d):** harmonic amplitude ∝ **sin(nπd)/(nπ)** → nulls where n·d is an integer.

---

## LAB 14 — OSCILLATOR
*Generate: Sine · Square · Saw · Triangle · Pulse · Noise · FM · AM. Displays: Waveform · FFT · Harmonic · Phase.*

### Common Mistakes
- **Naïve digital waveforms alias.** Direct-math saw/square generate harmonics above Nyquist that **fold back** (inharmonic, worst at high fundamentals). Band-limited generation (wavetable/BLEP) fixes it — the central lesson (shared with Distortion).
- **Confusing FM and AM.** **FM** modulates *frequency* → sidebands at fc ± n·fm (rich/bell-like timbre). **AM** modulates *amplitude* → sidebands at fc ± fm (tremolo). Students conflate them.
- **AM vs ring modulation.** AM keeps the carrier; **ring mod** (balanced) suppresses the carrier, leaving only sidebands (metallic).
- **Expecting FM depth to change pitch.** Increasing modulation index changes **timbre/richness**; perceived pitch stays at the carrier (audio-rate FM).
- **Fundamental set near Nyquist.** Even band-limited oscillators run out of harmonics up high → thin/dull tone.
- **DC offset from pulse/asymmetric waves.** Clicks/headroom loss — center it or HPF.

### Pro Tips
- Sweep a saw's pitch upward with band-limiting OFF to **hear aliasing** descend against the rising tone, then ON to fix it.
- Compare FM vs AM at the same rate/depth on the FFT to see sideband structure differences.

### Formula / Concept
**AM:** carrier + sidebands at **fc ± fm**. **FM:** components at **fc ± n·fm** with Bessel-function amplitudes (index **β = Δf/fm**). Aliased component of f > fs/2 appears at **fs − f**.

---

## LAB 16 — HARMONOGRAPH
*Controls (authored in Companion 1 / §7): f₁–f₄ · Amplitude · Phase · Damping · Ratio-lock · Lateral/Rotary · Draw speed · Pen persistence · Drive-from-oscillators.*

### Common Mistakes
- **Thinking the figure is random art.** Every figure is **deterministic** — set by frequency ratios, phase, and damping. The lesson: **simple integer ratios draw stable closed figures.**
- **Expecting complex/irrational ratios to close.** Only simple ratios (2:1, 3:2, 4:3) draw clean closed loops; near-but-inexact ratios **drift/precess** — and that drift *is* beating. Students think it's "broken" when it never closes.
- **Confusing amplitude with frequency.** Amplitude changes figure **size**; frequency changes the **pattern.**
- **Ignoring phase.** Same ratio, different phase → a rotated/different figure (line vs ellipse vs circle in the 2-pendulum Lissajous case). Often misattributed to frequency.
- **Damping extremes.** None = it never resolves; too much = it dies before drawing. The **decay envelope** is what creates the spiral look.
- **Viewing it silently.** The payoff is **drive it from two oscillators** — a consonant ratio yields both a stable figure *and* a consonant sound. Miss that and it's just a screensaver.

### Pro Tips
- Ratio-lock to 2:1, 3:2, 4:3, 5:4 and hear each interval as the figure snaps to a stable shape — intervals made visible + audible.
- Detune slightly off a locked ratio and watch the figure slowly precess = *seeing* beats.

### Formula / Concept
`x(t)=A₁sin(f₁t+φ₁)e^(−d₁t)+A₂sin(f₂t+φ₂)e^(−d₂t)`, similarly `y(t)`. Ratio **f₁:f₂ = musical interval**; the undamped 2-pendulum case = a **Lissajous** figure; a small detune Δ makes the figure **precess at a rate ∝ Δ** (visual beating).

---

## COVERAGE CHECK — ALL 16 LABS NOW HAVE COMMON MISTAKES

| # | Lab | Common Mistakes | Source doc |
|---|---|---|---|
| 1 | EQ | ✅ | this doc |
| 2 | Delay | ✅ | this doc |
| 3 | Reverb | ✅ | this doc |
| 4 | Chorus | ✅ | this doc |
| 5 | Flanger | ✅ | Companion 1 (5-labs) |
| 6 | Phaser | ✅ | Companion 1 |
| 7 | Compression | ✅ | this doc |
| 8 | Gate | ✅ | Companion 1 |
| 9 | Limiter | ✅ | Companion 1 |
| 10 | Distortion | ✅ | this doc |
| 11 | Noise | ✅ | this doc |
| 12 | Phase | ✅ | this doc |
| 13 | Harmonic | ✅ | this doc |
| 14 | Oscillator | ✅ | this doc |
| 15 | Stereo Imaging | ✅ | Companion 1 |
| 16 | Harmonograph | ✅ | this doc (controls in Companion 1/§7) |

**Next content layer (not in this pass):** Common Mistakes for the **15 Wave-Physics modules** (Reflection, Absorption, Diffusion, … Reverberation) and the **Signal Chain Builder** inter-module interactions (e.g., EQ→comp vs comp→EQ, gain-staging into the limiter). Flag if you want those authored next.

*End of DRAFT v1 — pending Prof. Booth approval. On approval, these Common-Mistakes blocks attach to each lab's Guided-Lesson content in the main spec §7.*
