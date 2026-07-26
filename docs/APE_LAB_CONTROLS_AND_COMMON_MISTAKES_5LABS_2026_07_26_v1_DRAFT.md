# AP&E STUDIO — AUTHORED LAB CONTENT: CONTROL SETS + COMMON MISTAKES (5 LABS)
## Companion to the Learning-Lab Architecture (fills the `[not enumerated]` labs)
**Date:** 2026-07-26 · **Version:** v1 · **Status:** 🟠 DRAFT / CANDIDATE — PENDING PROF. BOOTH APPROVAL
**Feeds:** `APE_LEARNING_LAB_ECOSYSTEM_ARCHITECTURE_2026_07_26_v3_DRAFT.md` §7 — Labs **5 (Flanger), 6 (Phaser), 8 (Gate), 9 (Limiter), 15 (Stereo Imaging)**. On approval, these replace the `[not enumerated — to author]` placeholders in the main spec.

> **How to read this.** For each lab: **Controls** (definition · *conventional* range/default · practical use), then **Common Mistakes** (the mandatory Guided-Lesson element — kept front-and-center), then **Pro Tips** and a **Formula/Concept** note where it teaches something. Ranges/defaults are **industry-conventional proposals**, not locked house style — confirm or override. Displays/learning-outcomes for these labs are already fixed in the main spec §7 and are not repeated here.
>
> **Accuracy note:** content is standard signal-processing fundamentals (high confidence). Genuinely opinionated calls are marked **[opinion]**. Nothing here is invented requirement — it authors the controls you asked for.

---

## LAB 5 — FLANGER

**What it is:** a **short, modulated delay** (roughly 0.1–10 ms) summed with the dry signal, producing a series of **evenly-spaced (harmonic) comb-filter notches** that *sweep* as an LFO modulates the delay time. Feedback deepens the notches. This is the defining contrast with the phaser (unevenly-spaced notches) and the chorus (longer delay, no sweep-comb).

### Controls
1. **Rate (LFO speed)** — *0.05–10 Hz, default ~0.2 Hz.* Speed the notches sweep up/down the spectrum. Slow = classic jet sweep.
2. **Depth (sweep range / LFO amount)** — *0–100%, default ~50%.* How far the delay time is modulated → how far the notches travel.
3. **Manual / Delay time (center)** — *0.1–10 ms, default ~2 ms.* The base delay the LFO modulates around; **sets notch spacing** (spacing = 1/delay).
4. **Feedback / Regeneration** — *−95% … +95%, default ~40%.* Feeds output back to input; increases notch depth/resonance. **Negative feedback** shifts the notch pattern (emphasizes different harmonics) and gives the hollow "through-a-tube" tone.
5. **Mix (Wet/Dry)** — *0–100%, default 50%.* Comb notches are **deepest at 50%** (equal dry+wet).
6. **LFO Waveform** — *Triangle (default) / Sine / Log.* Shape of the sweep motion.
7. **Stereo width / LFO phase offset** — *0–180°, default 90°.* Offsets the L vs R LFO for a stereo sweep.
8. **Through-Zero (TZF) toggle** *[advanced]* — *on/off, default off.* Uses a second delay line so the notch can pass **through 0 ms** for the dramatic "reverse jet" flange. **[opinion]** worth including as the visual payoff, but mark advanced.

### Common Mistakes
- **Calling it a flanger when it's really a chorus.** Delay set too long (>~10–15 ms) with little feedback stops making a sweeping comb and starts pitch-thickening — that's chorus. Keep the delay short and add feedback to hear/see the moving notches.
- **Running 100% wet.** With a single delay line, full-wet removes the dry reference the comb needs; the notches largely vanish. Classic flange lives near **50%**.
- **Too much feedback.** High regeneration rings metallically, masks the source, and fatigues fast. Back it off until the sweep is musical, not screaming.
- **Rate too fast.** A fast LFO turns the sweep into a warble/vibrato-like wobble; the *educational* "moving notches" are clearest **slow**.
- **Testing on a pure sine.** A sine has energy at one frequency, so there's nothing for the comb to reveal. Use **pink noise or a rich source** to *see* the notches march.
- **Ignoring mono.** Heavy stereo flanging can partially cancel when summed to mono — check the mono-fold.

### Pro Tips
- Start **dry=wet, feedback ~40%, rate slow**, then sweep Manual to hear notch spacing change.
- Negative feedback + short delay = the hollow, resonant "jet"; positive feedback = brighter, more present comb.

### Formula / Concept
Comb notches fall at **f = (2k−1) / (2·τ)**, k = 1,2,3…, where τ = delay time; **notch spacing = 1/τ**. As τ modulates, every notch sweeps together — hence the evenly-spaced, harmonically-related moving notches (the visual signature vs the phaser).

---

## LAB 6 — PHASER

**What it is:** a cascade of **all-pass filter stages** (each shifts phase without changing magnitude) summed with the dry signal. Cancellation notches appear where the phase hits 180°. Unlike the flanger, the notches are **unevenly spaced and fewer** (≈ one notch per two stages), set by all-pass corner frequencies rather than a fixed delay time. That difference *is* the lesson.

### Controls
1. **Rate (LFO speed)** — *0.05–10 Hz, default ~0.3 Hz.* Sweeps the all-pass corner frequencies (moves the notches).
2. **Depth** — *0–100%, default ~60%.* Modulation range of the sweep.
3. **Stages / Poles** — *2 / 4 / 6 / 8 / 12, default 4.* More stages = more notches = thicker. **Notch count ≈ stages ÷ 2.**
4. **Feedback / Resonance / Emphasis** — *0–95%, default ~30%.* Sharpens and deepens the notches.
5. **Center Frequency / Manual** — *~100 Hz–8 kHz, default ~1 kHz.* Base frequency the sweep centers on.
6. **Mix (Wet/Dry)** — *0–100%, default 50%.* Notches deepest near 50%.
7. **LFO Waveform** — *Sine (default) / Triangle.*
8. **Stereo spread / LFO phase offset** — *0–180°, default 90°.* L/R offset for stereo motion.

### Common Mistakes
- **Expecting flanger-style even notches.** Phaser notches are **unevenly spaced and fewer** — that's the defining difference. Students who can't tell phaser from flanger should A/B the two on pink noise and watch the FFT: **even harmonic comb (flanger) vs. sparse, uneven notches (phaser).** This is the core teaching moment.
- **Too many stages on a busy source.** 8–12 stages on a full mix smears into mud; fewer stages read as more musical.
- **100% wet.** Same trap as flanger — kills the dry reference the notches depend on.
- **Cranking resonance.** Excess feedback whistles/rings and fatigues.
- **Thinking a phaser is a delay.** All-pass stages change **phase, not time** — there is no echo. Notch positions come from phase relationships. This conceptual error is common and worth calling out explicitly.
- **Testing on a sine.** Needs broadband material to reveal the notches.

### Pro Tips
- 4 stages = subtle vintage vibe; 8+ = lush, obvious sweep.
- Sweep **Manual with the LFO off** first, so students see notches as a *position* before adding motion.

### Formula / Concept
A first-order all-pass has **|H(f)| = 1** at every frequency but a frequency-dependent phase from 0° to −180°. Two cascaded stages create **one 180° cancellation notch** when summed with dry. Notch count ≈ **stages ÷ 2**; notch frequencies are set by the all-pass corner frequencies (not harmonically related → uneven spacing).

---

## LAB 8 — GATE (Noise Gate / Downward Expander)

**What it is:** a dynamics processor that **attenuates signal below a threshold** and passes signal above it — for removing bleed/noise between notes, tightening drums, and controlling ambience.

### Controls
1. **Threshold** — *−80 … 0 dB, default ~−40 dB.* Level the signal must exceed to **open** the gate.
2. **Attack** — *0.01–100 ms, default ~1 ms.* Time to open once threshold is crossed. Fast preserves transients.
3. **Hold** — *0–500 ms, default ~10 ms.* Minimum time the gate stays open after the signal drops below threshold, **before** release begins — the primary anti-chatter control.
4. **Release** — *5 ms–2 s, default ~100 ms.* Time to close after the signal falls below threshold. Too fast = chatter; too slow = bleed.
5. **Range / Depth (Floor)** — *−∞ … −6 dB, default ~−40 dB.* How much attenuation when "closed." Partial range = gentler, more natural (behaves like an expander).
6. **Hysteresis** — *0–25 dB, default ~3 dB.* Separate open vs close thresholds (e.g., open −40, close −43) to stop chatter near the threshold.
7. **Lookahead** *[optional]* — *0–5 ms, default 0.* Delays the audio so the gate can open *before* a transient, preserving the attack.
8. **Sidechain / Key input** — external trigger source (e.g., gate a pad from the kick).
9. **Key filter (HPF/LPF on the detector)** — band-limits the *detector* so only the intended band opens the gate (e.g., only the tom's fundamental).
10. **Sidechain Listen/Monitor** — audition the (filtered) detector signal.

### Common Mistakes
- **Threshold too high.** Chops off note tails, word endings, cymbal/reverb decays → choppy, unnatural. 
- **Threshold too low.** Bleed and noise sail through; the gate does nothing useful.
- **Release too fast → chatter/stutter.** The gate flickers open/closed on sustained or decaying material near threshold. Fix with **Hold**, a slower **Release**, or **Hysteresis** — this is exactly the *Chatter / False triggering* lesson.
- **Attack too slow on percussion.** Opens *after* the transient has passed → soft, dull, "clicky-then-late" drum hits. Use a **fast attack** (or lookahead).
- **Range at −∞.** Full silence between hits is abrupt and exposes the gating; a moderate floor (e.g., −20 to −40 dB) is usually more natural. **[opinion]**
- **No key filter → false triggering.** Gating a tom off the whole kit lets snare/hat bleed open it. **Filter the sidechain** to the tom's fundamental and use Sidechain Listen to tune it.
- **Gating the life out of a source.** Over-gating strips natural room/ambience and sustain.

### Pro Tips
- Set **Threshold** first with a fast Release exaggerated so you can hear it working, then dial Hold/Release/Hysteresis to remove chatter, then relax the Range for naturalness.
- On toms/snare, a fast attack + short hold + medium release + key-filtered sidechain is the reliable starting point.

### Formula / Concept
A gate is **downward expansion** below threshold: for input below the threshold, gain is reduced toward the **Range** floor; above threshold, gain = 0 dB (open). The attack/hold/release smooth the gain envelope so the transition isn't a hard switch.

---

## LAB 9 — LIMITER (Brickwall / Peak Limiter)

**What it is:** effectively a **compressor with an infinite ratio and a fixed ceiling** — output never exceeds the set ceiling. Used at the **end** of a chain for peak control and loudness. A true-peak (brickwall) limiter guarantees the ceiling even against inter-sample peaks.

### Controls
1. **Ceiling (Output ceiling)** — *−12 … 0 dB(TP), default −1.0 dBTP.* Absolute maximum output. **[opinion]** default −1.0 dBTP for streaming/lossy safety.
2. **Threshold / Input Gain (Drive)** — *0 … +24 dB of drive, default 0.* How hard you push into the limiter → how much gain reduction/loudness. (Some designs expose "Threshold," others "Input gain" — functionally the same push.)
3. **Release** — *1 ms–1 s, default ~100 ms (or Auto).* Recovery time. Too fast → distortion/pumping (esp. bass); too slow → dulls dynamics, loses loudness.
4. **Attack** *[some designs]* — *0–5 ms, default near-instant.* A hair of attack lets transient "punch" through before catching it.
5. **Lookahead** — *0–5 ms, default ~1.5 ms.* Delays audio so peaks are caught *before* they occur → no overshoot without audible distortion.
6. **True-Peak / ISP mode** — *on/off, default on.* Oversampled detection to catch **inter-sample peaks** that exceed the ceiling after D/A reconstruction or lossy encode.
7. **Character / Style** *[optional]* — *Transparent … Aggressive.* Algorithm flavor.
8. **Dither** *[final-stage only]* — *off / TPDF / shaped, default off unless exporting to lower bit depth.* Apply when the limiter is the last step before bit-depth reduction.

### Common Mistakes
- **Pushing for loudness → squashing.** Too much gain reduction flattens dynamics, kills punch, adds distortion and fatigue (the "loudness war" trap). Watch the **GR meter** — a few dB is usually plenty.
- **Ignoring inter-sample peaks.** Limiting to 0 dBFS *looks* safe on the sample meter but **clips on D/A and after MP3/AAC**. Set the ceiling to ~**−1.0 dBTP** and enable **True-Peak** — this is the *Inter-sample peaks* learning outcome.
- **Release too fast.** Causes distortion and **pumping**, most audibly on bass-heavy material (the limiter modulates the low end).
- **No lookahead.** Fast transients overshoot and clip.
- **Using the limiter as a compressor.** A limiter catches peaks/sets a ceiling; a **compressor** shapes dynamics/glue. Reaching for the limiter to "compress" over-squashes. Teach the distinction directly.
- **Limiting too early in the chain.** A brickwall limiter belongs at/near the **end** of the master chain, not as a mid-chain dynamics tool.
- **Forgetting dither** on the final 24→16-bit export step.

### Pro Tips
- Gain-stage *into* the limiter with the input/drive; leave the ceiling fixed at −1.0 dBTP and judge by GR + ears, not by the number.
- Compare **Attack 0 vs a hair of attack** to hear transient punch return.

### Formula / Concept
Limiter ≈ compressor with **ratio → ∞** and knee/attack tuned for peak-catching. **True-peak** estimation requires **≥4× oversampling** to reconstruct inter-sample peaks the sample-domain meter can't see. Ceiling is a hard output cap: `out ≤ ceiling` always.

---

## LAB 15 — STEREO IMAGING

**What it is:** tools that place and shape sound in the stereo field — pan, width, and Mid/Side balance — with a constant eye on **mono compatibility** (what survives when the two channels sum).

### Controls
1. **Pan / Balance** — *L100 … C … R100, default C.* Places the source (or shifts the center) left/right.
2. **Width** — *0% (mono) … 100% (as-is) … 200% (widened), default 100%.* Narrows or widens the field, typically by scaling the **Side** component vs the **Mid**.
3. **Mid gain (M)** — *±12 dB, default 0.* Level of the center/mono component (vocals, kick, snare, bass usually live here).
4. **Side gain (S)** — *±12 dB, default 0.* Level of the difference/stereo component. Raising S widens.
5. **Mono-fold / Mono button** — *momentary/toggle.* Sums to mono to check compatibility (the single most important check in this lab).
6. **Bass-Mono / Mono-maker (crossover freq)** — *off … 300 Hz, default ~120 Hz.* Collapses everything **below** the crossover to mono (vinyl/PA/phase safety).
7. **Frequency-dependent (multiband) width** *[advanced]* — *per-band width.* Keep lows mono, widen highs.
8. **Rotation / Image balance** *[optional]* — rotates the stereo image.
9. **Haas / L-R micro-delay** *[optional, with warning]* — *0–30 ms.* Widens via arrival-time difference — powerful but the biggest mono-compatibility risk.

### Common Mistakes
- **Over-widening → phase cancellation / mono collapse.** Pushing Width or Side too far sounds huge on headphones but goes **hollow or silent in mono** (phones, clubs, mono PA). Always check the **mono-fold + correlation meter** — the *Mono compatibility / Correlation* outcomes.
- **Widening the bass.** Wide lows are phasey and unstable. Keep everything **below ~100–150 Hz mono** (Bass-Mono). Forgetting this is a top mastering error.
- **Confusing "louder" with "wider."** Boosting Side raises level, which the ear reads as "better." **Level-match** before judging width.
- **Haas/delay widening abuse.** Large L/R delays widen but **comb-filter in mono** and smear localization. Use tiny amounts, and always mono-check.
- **Ignoring the correlation meter.** Sustained **negative correlation** = out-of-phase content that will cancel. Read the meter; don't trust headphones alone.
- **No center anchor.** Panning everything wide loses the **phantom center** — lead vocal, kick, snare, bass usually belong centered.
- **Using width to "fix" a dull or cluttered mix.** Width doesn't fix arrangement or EQ problems; it just moves energy to the sides.

### Pro Tips
- Workflow: set **Bass-Mono** first, then Width, then **mono-check** and read correlation, then level-match A/B.
- Teach with pink noise + a centered vocal: widen and watch the vocal stay put while the sides balloon, then hit mono and hear the sides fold.

### Formula / Concept
**M/S encode:** `M = (L + R)/√2`, `S = (L − R)/√2`. **Decode:** `L = (M + S)/√2`, `R = (M − S)/√2`. **Width** = scaling S relative to M (S↑ = wider; S=0 = mono). **Correlation** = normalized cross-correlation of L and R: **+1** = mono/in-phase, **0** = uncorrelated (wide), **−1** = anti-phase (cancels in mono).

---

## SUMMARY — WHAT TO CONFIRM

| Lab | Controls authored | Opinionated defaults to confirm |
|---|---|---|
| 5 Flanger | 8 (incl. Through-Zero advanced) | delay 2 ms center, feedback 40%, include TZF? |
| 6 Phaser | 8 | 4 stages default, sine LFO |
| 8 Gate | 10 (incl. sidechain + key filter) | Range floor −40 dB (vs −∞), hysteresis 3 dB |
| 9 Limiter | 8 (incl. true-peak, dither) | ceiling −1.0 dBTP default, true-peak on |
| 15 Stereo | 9 (incl. bass-mono, Haas) | bass-mono ~120 Hz, include Haas with warning? |

**Every control above gets the full Guided-Lesson stack in-app** (Definition · Animation · Formula · Practical uses · **Common mistakes** · Pro tips). This doc supplies the Definition / Formula / Practical-use / **Common-mistakes** / Pro-tip text; Animation is a build/asset task.

*End of DRAFT v1 — pending Prof. Booth approval. On approval, splice the Controls blocks into the main spec §7 (Labs 5/6/8/9/15) and retire their `[not enumerated]` placeholders.*
