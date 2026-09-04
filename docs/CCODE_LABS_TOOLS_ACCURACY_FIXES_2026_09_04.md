# CCODE HANDOFF — Labs & Tools accuracy fixes (2026-09-04)

**From:** Computer A (Cowork)  **To:** Claude Code (ccode), in `C:\Users\profe\dev\ape-studio`  **Type:** app code/content fixes — **NOT database.**

## 1. Read-this-first / DO-NOT manifest

- **This is a FIX list, not an audit.** The accuracy audit is already done (Computer A re-ran it read-only across all 308 Labs/Tools source files). **Do not re-audit, do not re-derive the whole corpus, do not open files not named below.**
- **DO NOT touch the database, Supabase, migrations, RLS, or any `.sql`.** Every fix here is a string or small logic edit inside `src/`.
- **DO NOT restyle, refactor, rename, or 'improve' anything not listed.** Change only the exact text/logic each item names; preserve the surrounding copy, voice, and formatting.
- **Scope = 29 findings** (0 critical, 8 major, 21 minor) in these areas only: `src/screens/lab/`, `src/features/lab/`, `src/features/tools/learn/`, `src/components/tooldemos/`.
- Machine-readable companion (same 29 items, one JSON object each, with `file`/`quote`/`suggested_fix`): **`docs/labs_tools_audit_findings.jsonl`** (dropped next to this file). Booth-readable version: `AUDIO APP\2026-09-04_LABS_TOOLS_ACCURACY_AUDIT\labs_tools_audit_report.html`.

## 2. How to apply

1. Each item is tagged **[COPY]** (edit the user-facing string only) or **[LOGIC]** (a small code change is required — a formula, threshold, label constant, or a check that references a non-existent control).
2. Match the **Current text/code** snippet in the named file, make the **Change**, keep everything else identical.
3. After all edits: **`cd C:\Users\profe\dev\ape-studio` then `npx tsc --noEmit`** must stay clean, and the touched lab screens must still render.
4. **F02 and F16 are the SAME binaural error in two files** — fix both (`features/lab/guidedLessons/content.ts` *and* `screens/lab/BinauralLabScreen.tsx`).
5. Commit grouped by area with a clear message; do not merge unrelated changes. These are content/logic only — no app behavior beyond the corrected readouts should change.

## 3. The 8 MAJORS — fix first

These plant a wrong idea or make a learner misread a tool. None is a safety error (the safety areas audited clean).

### F01 — [MAJOR] [COPY] `src/features/lab/guidedLessons/content.ts`
- **Where:** LAB 21 · Binaural Panner — commonMistakes
- **Current text/code:** `Testing with a low sine and hearing nothing move — ITD phase cues get ambiguous and ILD nearly vanishes at low frequencies; use noise or a higher tone to hear the effect clearly.`
- **Problem:** Per duplex theory, ITD (interaural phase) is the RELIABLE localization cue at LOW frequencies and becomes AMBIGUOUS (phase wraps once the interaural delay exceeds half a period) at HIGH frequencies — the opposite of what is stated. ILD vanishing at low frequency is correct; the ITD clause is inverted. It also directly contradicts this same lab's tone_freq control, which correctly says 'LOW tones are located mainly by ITD.' A learner would internalize a backwards mental model of how low-frequency sounds are localized.
- **Change to make:** Rewrite to: 'ITD produces only a tiny interaural phase difference and ILD nearly vanishes at low frequencies, so a low pure tone gives weak cues; use noise or a higher tone.' Reserve the word 'ambiguous' for the high-frequency (phase-wrap) case.

### F02 — [MAJOR] [COPY] `src/screens/lab/BinauralLabScreen.tsx`
- **Where:** SOURCE TYPE tray blurb, sine & freq ≤ 440
- **Current text/code:** `A smooth low tone is the HARDEST thing to localize — the ITD is ambiguous and the head barely shadows it.`
- **Problem:** This inverts duplex theory. At low frequencies the interaural TIME/phase difference is the RELIABLE, unambiguous cue (wavelength >> head; max ITD ~660 µs is far below a half-period at 250/440 Hz). ITD ambiguity actually appears at HIGH frequencies (~>800 Hz), where ILD/head-shadow takes over — the opposite of what the blurb states. 'Head barely shadows it' is correct, but 'the ITD is ambiguous' at low frequency is backwards.
- **Change to make:** Reword: a low pure tone is hard mainly because the head casts almost no shadow (no ILD) and there are no broadband/onset cues — while the ITD it does provide is unambiguous but, alone, gives only a weak sense of place. Do not claim low-frequency ITD is 'ambiguous'.

### F03 — [MAJOR] [LOGIC] `src/screens/lab/FmLabScreen.tsx`
- **Where:** WHAT YOU'RE SEEING caption (isInt branch), triggered when RATIO = 0.5
- **Current text/code:** `Non-integer ratio — sidebands fall BETWEEN harmonics (inharmonic: the bell/metallic family). ✳ on a RATIO marks the inharmonic ones.`
- **Problem:** isInt = |ratio − round(ratio)| < 1e-9, so ratio 0.5 (round→1) is classed non-integer and the caption calls it inharmonic bell/metallic. But c:m = 1:0.5 = 2:1 is a simple fraction: it yields a fully HARMONIC (pitched) spectrum with the fundamental an octave down. The ratio's own tray blurb says 'a sub-octave, still perfectly pitched', and 0.5 carries no ✳ — so the caption contradicts both the truth and the ✳ scheme it cites.
- **Change to make:** Classify harmonicity by whether the ratio is a simple rational (e.g. small-integer p/q) rather than integer-only; treat 0.5 (and other simple fractions) as pitched. Reserve the 'inharmonic' caption for the ✳ (irrational) ratios.

### F04 — [MAJOR] [LOGIC] `src/screens/lab/fxLabConfigs.tsx`
- **Where:** distConfig checks[1] question + wrongHint
- **Current text/code:** `DRIVE and OUTPUT both change loudness. Why have both? ... Raise DRIVE, lower OUTPUT — the loudness holds, the character doesn’t.`
- **Problem:** The Distortion lab exposes only DRIVE, TYPE, OVERSAMPLING and MIX — there is no OUTPUT (make-up/level) control here. The retrieval check and its wrongHint instruct the learner to 'lower OUTPUT', a control that does not exist in this lab, so the instruction is unfollowable and references a phantom knob (the compressor lab's MAKEUP, not distortion).
- **Change to make:** Either add an OUTPUT/level param to the distortion config, or rewrite the check to use a control the lab actually has (DRIVE vs MIX for parallel level), removing the OUTPUT reference.

### F05 — [MAJOR] [LOGIC] `src/screens/lab/calc/workspaces/speakers.ts`
- **Where:** WS_CABLE › loss function — 'POWER LOST IN THE CABLE' / 'WATTS HEATING THE CABLE' / steps
- **Current text/code:** `const lostPct = (1 - frac * frac) * 100;  … { label: 'WATTS HEATING THE CABLE', value: (p * lostPct) / 100 } … `Power lost = 1 − ${fmt(frac)}² = ${fmt((1 - frac * frac) * 100, 3)}% of the amplifier’s output, spent heating copper.``
- **Problem:** The power actually dissipated as heat in the cable is Rloop/(Z+Rloop) of the delivered power, but the code uses 1−frac² = 1−(Z/(Z+Rloop))², which is the insertion power loss relative to a lossless cable (the reduction in speaker power at constant amp voltage) — a different, larger quantity. For the default example (30 m, 16 AWG, 8 Ω, Rloop≈0.79 Ω) it yields 17.2% instead of the true ~9.0% cable heat, ~1.9× too high, and 'WATTS HEATING THE CABLE' = p×17.2% overstates the real I²R heat by the same factor. It even contradicts this workspace's own worked example, which correctly states '≈10% of the amplifier’s power is dissipated in the cable.' The same wrong figure appears in the recgauge table's 'Power lost' column.
- **Change to make:** Compute cable dissipation as Rloop/(Z+Rloop) (i.e. 1−frac). For the example that gives ~9%, matching the '~10%' worked example. If the intent is insertion loss (speaker-power reduction), relabel it — do not call 1−frac² 'watts heating the cable' / 'spent heating copper'.

### F06 — [MAJOR] [COPY] `src/screens/lab/meter/meterEngine.ts`
- **Where:** SIGNAL_BLURBS.pinknoise
- **Current text/code:** `Equal energy per OCTAVE — the calibration reference. As steady as white noise but darker, and it reads flat on a log-frequency display.`
- **Problem:** Pink noise reads FLAT only on a constant-percentage-bandwidth (fractional-octave/RTA) analyzer. On a fixed-bandwidth FFT analyzer with a log frequency axis — which is exactly the display this lab draws — pink noise slopes DOWN at -3 dB/octave. The lab's own Spectrum module (modMeterB SPECTRUM_CAPTIONS/BLURBS.pinknoise, and meterEngine.spectrumDb 'case pinknoise': return -10*(lg-log10(20))) draws and describes pink as 'a straight downward slope'/'-3 dB/octave RAMP' on its log display. So this blurb directly contradicts the spectrum module and is wrong for the analyzer type shown; a learner told pink 'reads flat' will think the analyzer is miscalibrated when it correctly shows the tilt.
- **Change to make:** Change to something like: 'reads as a gentle -3 dB/octave downward slope on this FFT/log-frequency analyzer (and flat on a constant-Q / fractional-octave RTA)' — matching what the Spectrum module actually draws.

### F07 — [MAJOR] [COPY] `src/screens/lab/wave/modules/modWaveB.tsx`
- **Where:** Module 13 Beam Steering — STEER_CHECK correct answer option
- **Current text/code:** `Progressive per-box delays — a few hundred microseconds each`
- **Problem:** This module uses STEER_SPACING = 2.0 m between subs. For the 20 deg steer named in the question, the per-box delay is d*sin(theta)/c = 2*sin(20)/343 = 1.99 ms ~= 1994 microseconds — about two milliseconds, not 'a few hundred'. That is also exactly what the module's own Delta t/BOX bezel prints (Math.round(|dtPerBoxMs|*1000) => ~1994 us), so the graded 'correct' answer directly contradicts the on-screen readout. 'A few hundred microseconds' would only be true for a ~5 deg steer, not the 20 deg asked.
- **Change to make:** Change the answer text to a magnitude consistent with the module's 2 m spacing at the asked angle, e.g. 'Progressive per-box delays — on the order of a couple of milliseconds each here' (or drop the numeric qualifier), so it matches the Delta t/BOX readout.

### F08 — [MAJOR] [LOGIC] `src/components/tooldemos/HzCounterDemo.tsx`
- **Where:** Scene 3 FREQUENCY vs PITCH — tuner header vs cents needle
- **Current text/code:** `440.0 Hz`
- **Problem:** The header reads a fixed '440.0 Hz' (with 'REF A4 = 440 Hz'), and the caption calls it 'the measured frequency' whose needle 'shows deviation from the reference in cents.' But the scripted needle tours CENTS_STEPS = [12,-8,4,0,-3,0]. A source measured at exactly 440.0 Hz against a 440 Hz reference is 0 cents by definition; +12 cents would be 443.06 Hz. So the static 440.0 Hz readout directly contradicts the moving cents needle in the same panel — a learner sees an 'in-tune' 440.0 Hz that is simultaneously 12 cents sharp.
- **Change to make:** Either drive the Hz readout from the current cents value (e.g. 440*2^(cents/1200), so it reads ~443.1 Hz at +12¢), or freeze the needle at 0¢ whenever the header shows 440.0 Hz. Keep the two readouts consistent.

## 4. The 21 MINORS — imprecisions & internal inconsistencies

Lower stakes (rounding, wording, two modules disagreeing). Fix in the same pass.

### F09 — [MINOR] [COPY] `src/features/lab/guidedLessons/content.ts`
- **Where:** LAB 10 · Distortion — formula
- **Current text/code:** `THD = harmonic energy ÷ fundamental energy.`
- **Problem:** Total Harmonic Distortion is conventionally the ratio of RMS AMPLITUDES: THD = √(ΣV_n²)/V₁. 'Harmonic energy ÷ fundamental energy' is a power (energy) ratio = ΣV_n²/V₁², which equals THD² — it omits the square root, so the stated formula gives THD-squared, not THD.
- **Change to make:** Write 'THD = √(sum of harmonic powers) ÷ fundamental amplitude' (or 'RMS of the harmonics ÷ RMS of the fundamental'), i.e. an amplitude ratio, not an energy ratio.

### F10 — [MINOR] [COPY] `src/features/lab/guidedLessons/content.ts`
- **Where:** LAB 20 · FM Synth — proTips
- **Current text/code:** `A/B ratio 2 vs ratio 1.41 at the same index: same bandwidth, harmonic vs bell — placement, not amount, decides the character.`
- **Problem:** Carson bandwidth ≈ 2·fm·(I+1) and fm = ratio×carrier, so at a fixed carrier and index, ratio 2 vs 1.41 do NOT have the same bandwidth in Hz (they differ by the 2/1.41 ≈ 1.42 ratio). What is actually equal is the number of significant sideband pairs (≈ I+1); the occupied Hz bandwidth scales with the ratio. The 'same bandwidth' wording is technically wrong.
- **Change to make:** Say 'same number of significant sidebands (same index)' or 'same spectral richness' rather than 'same bandwidth,' since the Hz bandwidth changes with the ratio.

### F11 — [MINOR] [COPY] `src/screens/lab/FmLabScreen.tsx`
- **Where:** CheckQuestion #1 option text and reveal
- **Current text/code:** `An irrational ratio like 1.41 or 3.5`
- **Problem:** 3.5 = 7/2 is a rational number, not irrational (only 1.41≈√2 is irrational). The reveal repeats it: 'Irrational ratios (√2, 3.5)'. A rational FM ratio produces a periodic/harmonic spectrum (low fundamental), so labeling 3.5 'irrational' is mathematically false; the intended teaching category is 'non-integer'.
- **Change to make:** Say 'a non-integer ratio like 1.41 or 3.5' (and in the reveal 'non-integer ratios (√2, 3.5)'), reserving 'irrational' for √2.

### F12 — [MINOR] [COPY] `src/screens/lab/HarmonicCard.tsx`
- **Where:** tendencyFor(n), case 3 (H3)
- **Current text/code:** `Odd-order. Adds edge, buzz, and waveform asymmetry depending on its level and phase.`
- **Problem:** A single ODD harmonic (the 3rd) preserves half-wave symmetry: any sum of only odd harmonics satisfies f(t) = -f(t+T/2), so the positive and negative half-cycles stay mirror images regardless of level or phase — i.e. no top/bottom waveform asymmetry. Waveform asymmetry is produced by EVEN harmonics. This contradicts the lab's own framing, where SYM CLIP (symmetric) = odd-only and ASYM CLIP (broken symmetry) = 'adds EVEN harmonics too'.
- **Change to make:** Drop 'waveform asymmetry' from the H3 line (odd harmonics keep the wave half-wave symmetric); reserve asymmetry language for the even-order harmonics, consistent with the sym/asym clip presets.

### F13 — [MINOR] [COPY] `src/screens/lab/HarmonicsView.tsx`
- **Where:** AXIS option 'LOG' blurb in the dock params
- **Current text/code:** `Musical spacing: every octave gets equal width, the way pitch actually works. Harmonics crowd together to the right.`
- **Problem:** On this display frequency is the VERTICAL axis (per the component doc: 'spectrogram — frequency vertical, time horizontal', markers placed by y, piano-key gutter running top-to-bottom). Octaves therefore get equal HEIGHT and harmonics crowd toward the TOP, not equal 'width' crowding 'to the right'. 'To the right' is actually the TIME axis of the spectrogram, so a learner following the blurb looks in the wrong place.
- **Change to make:** Reword to the display's orientation, e.g. 'every octave gets equal height... harmonics crowd together toward the top', or make the axis description orientation-neutral.

### F14 — [MINOR] [COPY] `src/screens/lab/amp/modules/mod4Classes.tsx`
- **Where:** CLASS_FACTS.AB.efficiency
- **Current text/code:** `Below Class B's theoretical max; roughly 50–70% at full output, far less at low levels`
- **Problem:** At FULL output a Class AB stage approaches Class B's ~78.5% theoretical maximum, because the quiescent bias becomes negligible relative to the signal current — it is well above 70% at full output. '50–70% at full output' understates the full-output figure; the 50–70% range is really a typical/practical average across levels, not the full-output value. The row is labeled a tendency and the section carries an honesty badge, so impact is small, but as written it conflicts with Class B's stated 78.5% for the same full-output condition.
- **Change to make:** Reword to e.g. 'Approaches Class B's ~78.5% at full output; markedly lower in practice and far less at low levels' — or drop the '50–70% at full output' phrasing so it doesn't imply AB is capped below 70% at full drive.

### F15 — [MINOR] [COPY] `src/screens/lab/calc/workspaces/powerElec.ts`
- **Where:** VDROP workspace › example prose
- **Current text/code:** `A 30 m run of 16 AWG carrying 3 A from a 48 V supply: round-trip resistance ≈ 0.81 Ω, so the drop ≈ 2.4 V (≈ 5%) and ≈ 7.3 W is lost as heat in the cable.`
- **Problem:** The tool's own geometric AWG model (awgAreaM2 with ρ=1.724e-8) gives 16 AWG ≈ 1.309 mm², so Rloop = ρ·2·30/A ≈ 0.790 Ω, drop = 3×0.790 = 2.37 V (4.9%), power = I²R = 7.11 W. The example prose quotes 0.81 Ω and 7.3 W — about 2.5% high and inconsistent with what the calculator computes (the parallel Speaker Cable Loss tool correctly states 0.79 Ω for the same run).
- **Change to make:** Change the example to ≈0.79 Ω and ≈7.1 W (drop ≈2.4 V, ≈5% are fine) to match the tool's output.

### F16 — [MINOR] [LOGIC] `src/screens/lab/calc/workspaces/roomsAdvanced.ts`
- **Where:** EYRING workspace › eyring function — 'SABINE OVER-ESTIMATE' output vs steps/example
- **Current text/code:** `{ label: 'SABINE OVER-ESTIMATE', value: ((sabine - eyring) / eyring) * 100 } … steps: `… = ${fmt(((sabine - eyring) / sabine) * 100)}% shorter than Sabine.``
- **Problem:** The result row 'SABINE OVER-ESTIMATE' divides by eyring (≈18.9% for the default 120 m³/160 m²/ā=0.30 case) while the worked steps and the intro example divide by sabine and say '≈15% shorter'. Both bases are individually defensible, but a learner sees 18.9% in the results and 15.9% in the steps for what reads as the same Sabine-vs-Eyring gap.
- **Change to make:** Use one consistent reference base (and label it): either report the over-estimate as (sabine−eyring)/eyring in both places, or switch the result row to (sabine−eyring)/sabine to match the steps and the example's '15% shorter'.

### F17 — [MINOR] [COPY] `src/screens/lab/digital/modules/modDac.tsx`
- **Where:** MYTHS charter panel, Module 8 (24-bit dynamic range myth)
- **Current text/code:** `144 dB is the theoretical ceiling. Analog noise, converter linearity and clocking set the real usable range (ENOB) well below theory — excellent converters manage roughly 115–120 dB.`
- **Problem:** modQuant's ENOB block states 'even excellent 24-bit converters deliver roughly 20–21 effective bits (~120–125 dB)'. Module 8 here says excellent converters 'manage roughly 115–120 dB'. The two modules give different real-world figures for the same thing (best 24-bit converter dynamic range), and the ranges only touch at 120 dB.
- **Change to make:** Use one consistent figure across both modules — e.g. '~120 dB' (real top ADCs measure roughly 120–123 dB(A)) — in both the ENOB block and the Module 8 myth reality.

### F18 — [MINOR] [COPY] `src/screens/lab/digital/modules/modDac.tsx`
- **Where:** MYTHS charter panel, Module 8 (24-bit dynamic range myth)
- **Current text/code:** `144 dB is the theoretical ceiling.`
- **Problem:** The lab presents 6.02·N + 1.76 dB as THE formula for theoretical dynamic range, and modQuant's 'TH. DR' bezel computes it (24-bit → 6.02×24 + 1.76 = 146.2 dB, shown as '≈146.2 dB'). Calling 144 dB 'the theoretical ceiling' uses the 6 dB/bit rounding and is ~2 dB below the formula the same lab teaches and displays.
- **Change to make:** Say '~146 dB is the theoretical ceiling (6.02·24 + 1.76)' or explicitly note 144 dB as the 6 dB/bit approximation, so it matches the formula and the 24-bit bezel readout.

### F19 — [MINOR] [COPY] `src/screens/lab/digital/modules/modQuant.tsx`
- **Where:** BIT_BLURBS (bit-depth tray blurbs, Module 3 Quantization)
- **Current text/code:** `Sixty-five thousand levels — the CD standard: ~96 dB of range, error below audibility in normal listening.`
- **Problem:** The bit-depth tray blurbs quote dynamic range with the 6 dB/bit rule of thumb (8-bit '~48 dB', 16-bit '~96 dB', 24-bit '~144 dB'), but the SAME screen's bezel 'TH. DR' cell and CHECK_BITDEPTH use the exact 6.02·N + 1.76 formula it teaches (8-bit 49.9 dB, 16-bit 98.1 dB, 24-bit 146.2 dB). A learner toggling to 16-bit sees the bezel read ≈98.1 dB while the tray says '~96 dB'. Internal inconsistency between the blurb and the module's own computed readout.
- **Change to make:** Either state the blurbs as '~98 dB'/'~146 dB' (matching 6.02N+1.76 the module displays) or add '(6 dB/bit rule of thumb)' so the round figures don't read as contradicting the bezel.

### F20 — [MINOR] [LOGIC] `src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx`
- **Where:** PolarSection stage bezel — PICKUP cell
- **Current text/code:** `v: !dims ? '—' : g < 0.05 ? 'NULL ≤−30 dB' : `${fmtDb1(20 * Math.log10(g))} dB``
- **Problem:** The label 'NULL ≤−30 dB' is shown whenever linear gain g<0.05, but 20·log10(0.05) = −26.0 dB, not −30 dB. So any pickup value between −30 dB and −26 dB (0.0316 ≤ g < 0.05) is displayed as '≤−30 dB', overstating the rejection by up to ~4 dB. The threshold and the quoted number disagree.
- **Change to make:** Either lower the trigger to g<0.0316 (true −30 dB) or change the label to '≤−26 dB' so the displayed floor matches the 0.05 threshold.

### F21 — [MINOR] [COPY] `src/screens/lab/speech/speechPagesA.tsx`
- **Where:** PageVoicing, closing paragraph ('Why it matters at the microphone')
- **Current text/code:** `unvoiced sounds are pure noise with no pitch — S, SH and F are where sibilance lives`
- **Problem:** Sibilants are the strident fricatives /s, ʃ, z, ʒ/. /f/ is a labiodental (non-sibilant) fricative — its energy is broadband and lower, not the concentrated 4–10 kHz hiss the lab itself (Sibilance module) attributes to sibilance. Naming F as a home of sibilance teaches a definitional imprecision, and it is internally inconsistent with the Sibilance page, which scopes sibilance to the S/SH channel only.
- **Change to make:** Drop F from the sibilance list: 'S and SH are where sibilance lives' (F/TH are unvoiced fricatives but not sibilants).

### F22 — [MINOR] [LOGIC] `src/screens/lab/tuning/TuningLabScreen.tsx`
- **Where:** Header kicker vs progress-dots counter
- **Current text/code:** `TUNING & TEMPERAMENT LAB · CHAPTER {chapter} OF {CHAPTER_COUNT - 1}`
- **Problem:** The header shows the total as CHAPTER_COUNT-1 (13) while the progress dots and their accessibility label use CHAPTER_COUNT (14): '{completed}/{CHAPTER_COUNT}'. There are 14 chapters (indices 0–13). A learner therefore sees two different denominators at once — e.g. 'CHAPTER 5 OF 13' in the header but '3/14' on the dot strip — and 'CHAPTER 0 OF 13' reads oddly for a 14-chapter lab.
- **Change to make:** Use one convention: either label chapters 1..14 of 14 (increment the displayed number and use CHAPTER_COUNT in both places), or keep 0-indexing but make the dot counter and header agree on the same total.

### F23 — [MINOR] [COPY] `src/screens/lab/wave/modules/modWaveA.tsx`
- **Where:** Module 5 Diffraction — explain card 'LOWS WRAP, HIGHS SHADOW'
- **Current text/code:** `at 8 kHz (λ ≈ 4 cm) the same detour is hundreds of wavelengths and the shadow gets deep`
- **Problem:** The passage defines 'the detour' as delta (the extra over-the-top path), stating at 80 Hz it is 'a tiny fraction of a wavelength'. For the 4 m barrier referenced, delta = 2*hypot(10, 4-1.5) - 20 = 0.62 m. At 8 kHz (lambda ~= 4.3 cm) that is delta/lambda ~= 14 wavelengths (Fresnel N = 2*delta/lambda ~= 29), not 'hundreds'. Even at the max 8 m barrier it is ~90 wavelengths. The qualitative point (deep HF shadow) holds, but the stated magnitude is off by ~10-20x and is inconsistent with the same sentence's own use of 'the detour'.
- **Change to make:** Replace 'hundreds of wavelengths' with 'tens of wavelengths' (or 'many wavelengths') so it matches the geometry and the module's Fresnel N readout.

### F24 — [MINOR] [LOGIC] `src/components/tooldemos/RtaDemo.tsx`
- **Where:** Scene 1 PINK VS WHITE — freq axis labels vs bar count
- **Current text/code:** `['31 Hz', '250', '2k', '16k']`
- **Problem:** The demo shows BAR_COUNT = 15 bars described/captioned as a 'third-octave RTA', but the axis is labelled 31 Hz to 16 kHz — a span of ~9 octaves. Third-octave resolution over 31 Hz–16 kHz needs ~28 bands; 15 bars over that span is ~0.6 octave/bar, not 1/3-octave. Fifteen genuine third-octave bands starting at ~31 Hz would only reach ~1 kHz, so the '16k' right-edge label overstates the range by roughly four octaves.
- **Change to make:** Either label the axis to match 15 third-octave bands (≈31 Hz to ≈1 kHz), or raise the bar count to a true third-octave set for the 31 Hz–16 kHz span, or relabel the bars as coarser (per-octave) bands.

### F25 — [MINOR] [LOGIC] `src/components/tooldemos/WaveformDemo.tsx`
- **Where:** Scene 1 CLEAN vs CLIPPED — caption
- **Current text/code:** `A clean wave fits under the converter ceiling.`
- **Problem:** The clean trace peaks at CLEAN_MAX ≈ 0.9 (comment on line 407) while the 'converter ceiling' is CLIP_LIMIT = 0.8. The clean wave's peaks (0.9) therefore sit ABOVE the ceiling line (0.8) that is shown at CEIL_Y_TOP/BOTTOM in the hot view, so the drawn clean signal does not actually fit under the stated ceiling. Not clipped on screen (ceiling only drawn in hot mode, clean not clamped), but the numeric claim is false for the drawn data.
- **Change to make:** Lower the clean amplitude (scale sineMix so its peak is < CLIP_LIMIT, e.g. ~0.7) so the clean wave genuinely sits under the 0.8 ceiling, or raise CLIP_LIMIT above the clean peak.

### F26 — [MINOR] [LOGIC] `src/components/tooldemos/WaveformDemo.tsx`
- **Where:** Scene 1 CLEAN vs CLIPPED — HOT button label vs applied gain
- **Current text/code:** `+12 dB — TOO HOT`
- **Problem:** The button is labelled '+12 dB' but the code drives the wave with DRIVE_GAIN = 2.1×, which is +6.4 dB, not +12 dB (+12 dB would be a 3.98× multiplier). The stated number does not match the gain the demo actually applies. Purely illustrative, but a learner reading '+12 dB' cannot reconcile it with the drawn amount of drive.
- **Change to make:** Either set DRIVE_GAIN ≈ 4.0 to match a '+12 dB' label, or relabel the button to the level actually applied (~'+6 dB — TOO HOT').

### F27 — [MINOR] [LOGIC] `src/components/tooldemos/WaveformDemo.tsx`
- **Where:** Scene 2 TRANSIENT vs SUSTAINED — caption vs drawn peaks
- **Current text/code:** `Similar peaks can carry very different energy.`
- **Problem:** The lesson (equal peak height, very different total energy) is best shown with matched peaks, but the drawn transient peaks at ≈0.92 (TRANSIENT_VALUES env×0.92) while the pad peaks at ≈0.60 (env 0.55±0.05). The drum spike is visibly TALLER than the pad, so a learner may read 'taller = more energy' — the opposite of the intended point that the shorter-looking sustained pad carries more energy.
- **Change to make:** Scale the two waves so their visible peaks are roughly equal (e.g. bring the pad amplitude up near the transient peak), so the 'similar peaks, different energy' contrast is actually visible.

### F28 — [MINOR] [COPY] `src/features/tools/learn/hzcounter.ts`
- **Where:** misconceptions -> '440 Hz is the only tuning.' truth
- **Current text/code:** `Many orchestras tune to 441–443 Hz, period ensembles use references such as 415 or 432 Hz`
- **Problem:** 432 Hz is not a period/historical-performance reference. Period ensembles use A=415 Hz (baroque) and A=430 Hz (classical); the 1859 diapason normal was 435 Hz. 432 Hz is a modern alternative/'Verdi' tuning, not a historically-informed-performance pitch, so grouping it with period ensembles is inaccurate.
- **Change to make:** Cite period-ensemble references as 415 or 430 Hz (e.g. 'period ensembles use references such as 415 or 430 Hz'), and keep 432 Hz in the separate 'alternative reference' category.

### F29 — [MINOR] [COPY] `src/features/tools/learn/spl.ts`
- **Where:** section 'WEIGHTING AND RESPONSE'
- **Current text/code:** `A-weighting filters the signal to roughly match how the ear hears at moderate levels, strongly discounting low frequencies`
- **Problem:** A-weighting is derived from the ~40-phon equal-loudness contour, i.e. relatively LOW sound levels (about 40 dB SPL at 1 kHz), not moderate ones. C-weighting corresponds to high levels (~100 phon). Describing A-weighting as matching hearing 'at moderate levels' misstates which loudness region it approximates.
- **Change to make:** Change to 'roughly match how the ear hears at low listening levels (the ~40-phon contour)' — the strong low-frequency discounting is exactly the low-level behavior.

## 5. Done when
- All 29 items applied in the named files, nothing else touched.
- `npx tsc --noEmit` clean.
- The [LOGIC] items verified by eye on the running screen (HzCounter readout, Waveform ceiling, RTA axis, FM ratio labels, Distortion check, Mic null label, Tuning chapter count, calc speaker-loss %).
- Report back the list of files changed. No DB work, no schema, no `.sql` — if any item seems to need a DB change, STOP and flag it (it shouldn't).
