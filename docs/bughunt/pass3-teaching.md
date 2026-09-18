# Bug hunt — PASS 3, agent C: IS THE TEACHING CORRECT?

Repo `C:\Users\profe\dev\ape-studio`, branch `audio-tools-engine`, 2026-09-18.
Read-only on source. No file edited except this one. No build, no EAS, no update,
no dev server, no network call.

**Axis:** the audio engineering itself — not whether the code runs, but whether
what it says is true. Every claim below was checked against the underlying
physics/standard, not against another part of the app.

---

## Headline

**The domain content in this app is unusually good.** I went looking for
confidently-wrong teaching and found very little. The numbers that matter are
right, the standards are named, the approximations are labelled as
approximations, and the anti-misconception charter in the Digital lab holds
everywhere I could check it — including in labs that had every opportunity to
break it.

Spot-verified correct (a sample, all recomputed by hand):

- dBu/dBV: 0.775 V and 1 V references, +4 dBu = 1.228 V, −10 dBV = 0.316 V,
  the pro/consumer gap 11.8 dB (**not** 14) — `levels.ts:34-46`.
- dBFS explicitly declared un-convertible to dBu/dBV without an alignment
  reference — `levels.ts:52-55`. This is the single most commonly botched fact
  in audio education and the app gets it right.
- NIOSH 85 dBA / 3 dB exchange / 8 h and OSHA 90 dBA / 5 dB / 8 h, both named,
  both with worked doses that recompute exactly (97 dBA × 4 h = 800%) —
  `splSafety.ts:371-448`.
- Speed of sound `331.3·√(1+T/273.15)` (343.2 m/s at 20 °C) — `calcUnits.ts:161`.
- Sabine `0.161·V/A`, Eyring `0.161·V/(−S·ln(1−ā))`, Millington–Sette named,
  ISO 3382 named as the measured method. The worked example (0.40 s → 0.34 s,
  "about 16% shorter") recomputes to 15.9% — `roomsAdvanced.ts:46-57`.
- BS.1770-5: K-weighting (+4 dB shelf ~1.68 kHz then HPF), 400 ms momentary,
  3 s short-term, 100 ms blocks at 75% overlap, gating named. Platform table
  −14/−16/−23/−24 LUFS with −1/−1/−1/−2 dBTP ceilings — all correct, including
  ATSC A/85's −2 — `loudness.ts:70-76,133-137`, `mixing/engine/advanced.ts:90`.
- Butterworth `|H|² = r^2n/(1+r^2n)`, −3 dB at the corner, `Q ↔ BW` via
  `1/Q = 2·sinh(ln2/2·BW)` (1 oct → 1.414, ⅓ oct → 4.319) — `eqMath.ts`.
- Membrane mode ratios 1 : 1.594 : 2.136 : 2.296 : 2.653 (the J_n zeros, exact),
  plate law `f = λ²/2πa²·√(D/ρh)`, `D = Eh³/12(1−ν²)`, `ka = πfD/c`, cone
  excursion ∝ 1/f² — `membrane.ts`, `plateModes.ts`.
- Peterson & Barney formants for all five vowels, to the hertz —
  `speechModel.ts:99-103`.
- Equal-tempered fifth 700 ¢ vs pure 701.955 ¢; ET third 400 ¢ vs just 386.31 ¢
  ("13.69 ¢ wider") — `tuning/chapters/ch10Equal.tsx`, `ch11Systems.tsx:140`.
- Woodworth ITD `(a/c)(θ+sinθ)`, a = 8.75 cm, max 0.66 ms — `BinauralLabScreen.tsx:438`.
- Supercardioid null at 127°; omni/cardioid/super (a,b) = (1,0)/(.5,.5)/(.37,.63);
  ORTF 17 cm at 110°; proximity effect correctly attributed to the pressure
  gradient and correctly absent on omnis — `MicPrinciplesLabScreen.tsx`.
- Bridging = double the voltage → ×4 power *if* each channel can drive half the
  load; Class D ≠ digital; damping factor `DF = Zload/Zout` with the
  cable-resistance caveat — `ampContent.ts`, `mod7RealWorld.tsx:413`.
- Phantom P48 cited to IEC 61938; AES3 110 Ω; S/PDIF coax 75 Ω; PoE 44–57 V;
  analog phone 48 V DC / ~90 V AC ringing — `cable/data/*`, each with a
  VERIFIED-2026-08-15 source line.
- Voltage drop: 30 m of 16 AWG at 3 A → 0.79 Ω round trip — `powerElec.ts:219`.
- Comb notches `(2k−1)/2τ`, peaks `k/τ`; "move a mic 34 cm = 1 ms" —
  `mixing/engine/advanced.ts:30-38`, `pagesAdvB.tsx:251`.
- Compressor `out = thr + (in−thr)/ratio`, GR `= (in−thr)(1−1/ratio)`, with the
  hard-knee limitation stated explicitly — `dynamics.ts`, `content.ts:273`.

**The anti-misconception charter holds.** `grep -ri "staircase|stair.step|
connect.the.dots"` across `src/` returns only places that *deny* the myth. The
one place a staircase is drawn (`modChain.tsx:255`) labels it "a CONVERTER
operation — it is NOT what a DAC's analog output looks like", and Module 7's
stage badge says "ZOH DRAWN AS THE INTERMEDIATE STAGE IT IS". The
inter-sample-peak math in `modDac.tsx:78-91` is exact for a sine, and I verified
it algebraically.

Four real defects follow. One is a MAJOR (a formula rendered as false
arithmetic). The rest are MINOR. Nothing I found would fail a learner an exam or
put them in danger.

---

# ERRORS

## 1. MAJOR — A calculator prints a formula that is false arithmetic

**Where:** `src/screens/lab/calc/workspaces/levels.ts:160`
(also `:476`, `:504`)

**Exact text (rendered verbatim to the learner):**

```
formula: 'dBV = dBu − 2.218 · dBu = dBV + 2.218'
```

`CalcWorkspaceScreen.tsx:486` prints `FORMULA   {fn.formula}` with no
transformation, and `FormulaKeyPopup.tsx:81` prints it again.

**What is wrong:** this string is two equations with ` · ` used as a separator.
But `symbolsKey.ts:95` tells the learner, in the app's own symbol key:

> `{ symbol: '×  ·', name: 'multiply', meaning: 'Multiply. A raised dot (·) means the same as ×.' }`

and this very function declares `keySymbols: ['−', '·']` (line 165), so tapping
the formula key surfaces "· means multiply" *against this formula*. Read that
way — the only way the app has taught — the line says

> dBV = dBu − 2.218 × dBu

which is false. The correct relation is `dBV = dBu − 2.218` and
`dBu = dBV + 2.218` (two separate equations). The `plainFormula` on line 161 and
the `compute` on line 167 are both correct; only the headline formula is broken.

Two more instances read as false the same way:

- `:476` `'Vpeak = Vrms · √2 · Vpp = 2 · Vpeak'` → reads as
  `Vpeak = Vrms·√2·Vpp`.
- `:504` `'Vrms = Vpeak / √2 · Vpp = 2 · Vpeak'` → same shape.

**Scope:** the ` · `-as-separator convention appears in 45 formula strings across
`calc/workspaces/`. Most are unambiguous because the second `=` disambiguates
(`'R = ρ·2L/A · Vdrop = I·R · loss = I²·R'`). The three above are the ones where
a multiplication reading is grammatical and wrong — and line 160 is the worst,
because "2.218 · dBu" is exactly the shape of a real coefficient.

**Correct statement:** use a separator that is not also an operator the app
defines as multiply — `;` or ` — ` or a line break. E.g.
`'dBV = dBu − 2.218 ; dBu = dBV + 2.218'`.

**Confidence:** high on the defect (the strings and the symbol-key entry are
both verbatim above); medium on the severity, since a learner who reads the
`plainFormula` one line down is immediately corrected.

**Not a duplicate of pass 1.** `pass1-labs-content.md:372` reported a different
bug in the same workspace — the `steps()` text quoting `0.775` where the code
uses `√0.6`. That is the arithmetic; this is the formula line.

---

## 2. MINOR — The flagship MYTH panel misattributes the 144 vs 146 dB gap, and contradicts the app's own calculator

**Where:** `src/screens/lab/digital/modules/modDac.tsx:374-377` — Module 8's
"MYTH vs REALITY" charter panel, which the app introduces with *"If one line of
this lab survives in your memory, make it one of these."*

**Exact text:**

> **myth:** 'A 24-bit recording always has 144 dB of dynamic range.'
> **reality:** '~146 dB is the theoretical ceiling (6.02·24 + 1.76; **the 144 dB
> figure is the 6 dB/bit rounding**). …'

**What is wrong:** the 144 → 146 gap is *not* rounding. `6.02 × 24 = 144.5`, so
rounding 6.02 down to 6 costs half a decibel, not two. The 2 dB comes from the
`+1.76 dB` term, which is the full-scale-**sine** SNR correction
(`10·log10(3/2)` — the sine's 3.01 dB crest factor less the 1.25 dB of the
uniform-noise reference), not from rounding anything.

**It contradicts the app's own Digital Advanced calculator**, which teaches the
distinction explicitly and names this exact conflation as a mistake —
`digitalAdv.ts:529`:

> 'Quoting the SNR without the +1.76 dB — "6 dB per bit" gives the DYNAMIC RANGE
> (6.02·N); the full-scale-sine SNR adds ≈ 1.76 dB on top.'

and `digitalAdv.ts:535-536`: `SNR = 6.02·N + 1.76` for a dithered full-scale
sine; `dynamic range = 6.02·N`. A learner who reads both screens is told the
+1.76 is a rounding artefact in one and a distinct physical term in the other.

`modQuant.tsx:122` handles the same numbers correctly ("~144 dB … 6 dB/bit rule
of thumb; 6.02·24 + 1.76 ≈ 146 dB"), so the Digital lab is inconsistent with
itself as well.

**Correct statement:** "144 dB is `6 × 24` — the 6-dB-per-bit rule of thumb for
*dynamic range*. The 146 dB figure is `6.02·24 + 1.76`: the theoretical SNR for
a dithered **full-scale sine**, where the +1.76 dB comes from the sine's crest
factor, not from rounding." The rest of the entry (ENOB, "even excellent
converters manage roughly 120 dB") is correct and should stay.

**Confidence:** high. The arithmetic is checkable in one line and the
contradicting text is quoted above.

---

## 3. MINOR — Binaural lab: the pure-tone localization threshold is stated backwards, and contradicts its own sentence

**Where:**
- `src/features/lab/guidedLessons/content.ts:771` (the `tone_freq` control)
- `src/screens/lab/BinauralLabScreen.tsx:316` (the SOURCE-TYPE tray blurb)
- `src/screens/lab/BinauralLabScreen.tsx:413-419` (the second check's `reveal`)

**Exact text** (content.ts:771):

> 'Localization changes with frequency: LOW tones are located mainly by ITD
> (timing between the ears), HIGH tones by ILD (the head shadows the far ear).
> **Below ~800 Hz a pure tone is hard to place** — switch it to noise to hear the
> difference.'

**What is wrong:** the sentence contradicts itself. It states duplex theory
correctly (ITD carries the low end), then says the low end is where a pure tone
cannot be placed. Under Rayleigh's duplex theory, and in Mills' minimum-audible-
angle data (1958), a frontal pure tone is localized *best* in roughly
250 Hz–1 kHz — MAA around 1° — and *worst* around 1.5–2 kHz, where ITD phase has
become ambiguous and ILD has not yet grown.

~800 Hz is a real and well-known threshold, but it is an **upper** bound, not a
lower one: with a maximum ITD of ~0.66 ms, the interaural phase difference
reaches 180° at `1/(2 × 0.66 ms) ≈ 760 Hz`. *Above* that, a steady pure tone's
ITD becomes phase-ambiguous. The app has flipped the inequality on the right
number.

The two supporting statements overstate in the same direction:

- `BinauralLabScreen.tsx:316` (fires for any sine ≤ 440 Hz): *"A smooth low tone
  is the HARDEST thing to localize … the ITD it does give, on its own, is only a
  weak sense of place."* A 250 Hz tone at 90° azimuth carries ~59° of interaural
  phase, far above the few-degree IPD discrimination threshold.
- The check's `reveal` (line ~418): *"A smooth low tone gives the brain almost
  nothing."*

**The answer keys are still right** — broadband noise *is* the easiest source to
localize, for exactly the reason the app gives (it feeds both cues). Only the
explanations are wrong. This is not a blocker.

**Correct statement:** "Below about 1.5 kHz the head casts almost no shadow, so
ILD is nearly absent and ITD does the work — and it does it well: a low pure
tone lateralizes clearly. Above ~800 Hz the interaural *phase* of a steady tone
becomes ambiguous, and localization of pure tones is at its worst around
1.5–2 kHz, before ILD takes over. What a pure tone lacks is onsets and spectral
detail, so over headphones it lateralizes without externalizing — the image sits
inside your head. Broadband noise feeds timing, shadow and onset cues at once,
which is why it images sharply."

**Confidence:** high that "below ~800 Hz" is the wrong direction (the 760 Hz
phase-ambiguity number is standard and derivable from the lab's own 0.66 ms
max ITD). Medium on how far to soften line 316 — a steady headphone sine really
does image vaguely compared with noise, so the *feel* the copy describes is real;
it is the stated *cause* that is wrong.

---

## 4. MINOR — CROSS-LAB CONTRADICTION: "Lissajous" means two different displays and the app never says so

This is the contradiction the brief asked for: two screens a learner will
certainly meet, saying incompatible things about the same picture.

**Screen A — mono is a VERTICAL line:**
- `content.ts:437` (Phase lab display): "The Lissajous plots left against right…"
- `content.ts:446` (Phase lab mistakes): "vertical line = mono/in-phase (+1);
  horizontal = anti-phase (−1, cancels)"
- `content.ts:545` (Stereo lab display): "The Lissajous plots left against right:
  **a vertical line = mono**, a wide cloud = wide."
- `content.ts:1171` (Meter lab, `goniometer` key): "a vertical line = mono … a
  HORIZONTAL line = pure anti-phase"
- `modMeterC.tsx:230-231` (Meter Module 8, THE DOT CLOUD): "A vertical line is
  mono, a fat ball is wide, and a HORIZONTAL line is pure anti-phase"

**Screen B — mono is a 45° DIAGONAL:**
- `modMeterC.tsx:446-457` (Meter **Module 10 — OSCILLOSCOPE (+ X-Y / Lissajous
  mode)**): *"In X-Y mode the trace collapses to a thin diagonal line at 45° …
  Left drives X, right drives Y. Identical channels mean X always equals Y, so
  every dot lands on the 45° diagonal — mono."*
- `modMeterC.tsx:596` (the same module's tray caption): "a thin 45° line = MONO"

**Which is right: both are, for their own instrument — and the code proves it.**

- `vizMeters.tsx:1511`: `// Goniometer cloud: x = (L−R)/√2, y = (L+R)/√2 (the 45°
  rotation).` A studio goniometer/vectorscope is rotated 45° by convention, so
  mono lands on the vertical. Screen A is correct for that display.
- `vizMeters.tsx:1854`: `// Trace: Y-t sweep, or the X-Y Lissajous figure (X =
  left, Y = right).` A raw oscilloscope X-Y plot is *not* rotated, so mono lands
  on the 45° diagonal. Screen B is correct for that display.

**What is wrong:** nothing tells the learner that the rotation exists. The word
"Lissajous" is used for both, and the Phase and Stereo labs describe the rotated
display with the *unrotated* definition — "plots left against right" — and then
assert "vertical line = mono", which does not follow from it. Two modules apart,
in the same Meter lab, the app says mono is vertical and mono is at 45°. A
careful learner concludes one of them is a bug; a careless one memorizes the
wrong picture and misreads a real vectorscope.

**Correct statement:** one sentence in each place, e.g. "A studio goniometer
rotates the L-vs-R plot 45° so mono stands upright; a plain oscilloscope in X-Y
mode does not, so on a scope mono is the 45° diagonal. Same data, two
conventions." The existing graticule already draws the 45° L/R axes
(`vizMeters.tsx:1529`), so the display is honest — only the words are not.

**Confidence:** high. Both conventions, both code comments and all six copy
strings are quoted above.

---

# JUDGEMENT CALLS — defensible; I am leaving them alone

These are places where I checked something, found a simplification rather than
an error, and concluded the call was already made deliberately. Listed so nobody
re-checks them.

1. **Foundations M4: "moving FASTER changes the PITCH, not the loudness."**
   `FoundationsCourseScreen.tsx:1715`. Strictly, a piston at fixed excursion
   radiates `p ∝ f²`, which the app's own speaker calculator teaches
   (`speakersAdv.ts:275`). But "amplitude is the loudness knob, frequency is the
   pitch knob" is the universal intro framing, M9 immediately adds the ear's
   curve, and the alternative would wreck the module. Correct call.

2. **"FIRST IMAGE AT `os × 48 kHz`"** — `modDac.tsx`, oversampling readout. The
   first image *energy* of a 20 kHz band sits at `os·48 − 20 kHz`, which the very
   next row states correctly as the filter transition. The label means "the first
   mirror is centred at the sample rate", which the prose above it says
   explicitly. Ambiguous, not wrong.

3. **"Any harmonic above fs/2 aliases to fs − f"** — `content.ts:520`
   (Distortion lab formula line). Only valid for `fs/2 < f < fs`; the general
   case is `|f − n·fs|`. The Digital lab teaches the general fold rule twice
   (`modAnalog.tsx:384`, `modDac.tsx:544`), so the learner does meet it. A
   one-line formula summary, not a claim of generality.

4. **`OCT_CENTERS = [31, 63, …]`** — `eqMath.ts`. The ISO nominal is 31.5 Hz;
   consoles print both. Cosmetic.

5. **AmplitudeOrientation level-meter card** — `AmplitudeOrientation.tsx:178-179,
   328-330`. The bars are drawn at fill fractions 0.86 / 0.56 and labelled
   "−3" / "−14", against a printed tick scale of 0 / −12 / −24 / −40 laid out
   `space-between` (`styles.meterTicks:1171`). Read against its own ticks the
   PEAK bar is ~−6 and the RMS bar ~−15, so the labels are ~3 dB and ~1 dB off.
   It is a static orientation illustration whose teaching claim (peak reads
   higher and hotter than RMS; that gap is crest factor) is correct and clearly
   shown. Cosmetic; mentioning only so it is not re-found.

6. **`levels.ts:166` "The offset is exact: 20·log10(0.775 V ÷ 1 V) ≈ −2.218 dB"**
   — "exact" and "≈" in one sentence, and 0.775 is itself the rounded form of the
   true reference `√0.6 = 0.774597`. Pass 1 already filed the underlying
   arithmetic mismatch (`pass1-labs-content.md:372`); not re-reported.

7. **M/S encode written as `(L±R)/√2`** — `content.ts:559`. The `/2` convention
   is more common on consoles; `/√2` is the energy-preserving one. Both are used
   in the field; the app is self-consistent.

---

# Coverage — what I actually read

**Read in full or near-full:**
- `src/features/lab/guidedLessons/content.ts` — all 1,293 lines, all 29 lab
  lessons: EQ, Delay, Reverb, Chorus, Flanger, Phaser, Compression, Gate,
  Limiter, Distortion, Noise, Phase, Harmonic, Oscillator, Stereo, Harmonograph,
  Signal Chain, Bass, Autotune, FM, Binaural, Modular, Foundations, Mic,
  Speaker, Cymatics, Digital, Meter, Gain.
- **Digital lab** (the charter): `modDac.tsx` (both modules, all 8 myths, all
  checks, the ISP math), `modAnalog.tsx` (Modules 1–2 prose + alias checks),
  `modQuant.tsx` (checks), `registry.ts`, `DigitalLabHomeScreen.tsx`.
- **Gain lab**: `gainEngine.ts` in full, `modLearn.tsx` Modules 1–3.
- **EQ lab**: `eqMath.ts` in full, `QBandwidth.tsx`, `FilterSlopes.tsx`.
- **Meter lab**: `modMeterA.tsx` (waveform/peak/VU/loudness checks),
  `modMeterB.tsx` (spectrum/spectrogram/waterfall checks), `modMeterC.tsx`
  (phase/goniometer/MS/scope, in full for §8–§10), `meterEngine.ts` header.
- **Wave Physics lab**: all checks and reveals in `modWaveA.tsx` (absorption,
  diffusion, refraction, diffraction, interference, modes) and `modWaveB.tsx`
  (coverage, line arrays, sub alignment, cardioid subs, precedence, RT60).
- **Foundations course**: Modules 1–14, every `paras`, every check and reveal.
- **Calculator Lab** (the "source of truth" surface): `levels.ts`, `loudness.ts`,
  `splSafety.ts`, `roomsMusic.ts`, `roomsSecond.ts`, `roomsAdvanced.ts`,
  `speakersAdv.ts`, `powerElec.ts`, `micsRf.ts`, `digitalAdv.ts`, `dynamics.ts`,
  `timePhase.ts`, `symbolsKey.ts`, `calcUnits.ts`, `workflowCatalog.ts`.
- **Cymatics**: `plateModes.ts` and `membrane.ts` honesty headers and mode math.
- **Speech lab**: `speechModel.ts` (vowels, consonants, voice ranges, distance),
  `speechPagesA/B.tsx`.
- **Tuning lab**: `ch10Equal.tsx`, `ch11Systems.tsx`, `ch12Tradeoffs.tsx`.
- **Amp lab**: `ampContent.ts` (all 17 misconception cards), `mod7RealWorld.tsx`.
- **Mic & Speaker**: `MicPrinciplesLabScreen.tsx` (patterns, proximity, grip,
  stereo pairs), `micSelectData.ts` (spec glossary, challenge variants).
- **Mixing lab**: `pagesAdvA–D.tsx` prose and checks, `engine/advanced.ts`.
- **Envelope lab**: `EnvelopeLabScreen.tsx` prose + all six checks.
- **Tube lab**: `VacuumTubeLabScreen.tsx` captions and both checks.
- Every `CheckQuestion` in `NoiseLabScreen`, `OscillatorLabScreen`,
  `HarmonicsView`, `FmLabScreen`, `AutotuneLabScreen`, `BassLabScreen`,
  `BinauralLabScreen`.
- **Cable / Connector / Install labs**: the source-citation lines and every
  safety/electrical claim reachable by grep (phantom, AES3, S/PDIF, PoE, USB PD,
  telephone line voltages, GFCI/NEC/OSHA references).
- `src/data/topicCopy.ts` and `credentialCopy.ts` — read; they are scope
  descriptions and role lists, not factual claims. Nothing false found.

**Not covered — and why:**
- **The glossary itself.** Definitions live in Supabase (`glossary` table), not
  in the repo. `glossaryVerified.ts` holds only term *names*. I made no network
  or DB call, so ~22,700 definitions are unchecked by this pass. **This is the
  largest unexamined teaching surface in the product.** Settling it needs a
  read-only export of the `glossary` table.
- **Quiz and exam banks.** Same reason: `quiz_questions` is server-side, read via
  `get_scenario_items` / the v3 RPCs. Every question I checked was a locally
  authored `CheckSpec` in a lab. I found no wrong answer key in any of them.
- **Ear Training lab's DSP-derived claims** (`features/ear/`) — the
  equal-loudness makeup is labelled an approximation in the copy
  (`modules/common.ts:47`, `tone.ts:47`), which is the honest thing, but I did
  not verify the curve numerically.
- **Production (Pre/Post) labs** — workflow and deliverable content, not physics;
  and pass 1 already worked that file set hard.
- **Anything requiring a device.** No visual was confirmed on screen; every claim
  about a drawing here is read off its drawing code.

---

## One-line summary

Four defects: one calculator formula that renders as false arithmetic
(`levels.ts:160`), one misattribution in the Digital lab's flagship myth panel
(`modDac.tsx:376`), one inverted psychoacoustic threshold in the Binaural lab
(`content.ts:771`), and one cross-lab collision over what "Lissajous" means
(five copy strings vs `modMeterC.tsx:446`). Everything else I checked — and I
checked a lot of it against the standard, by hand — is correct, labelled, and
in several places better than the textbooks it is competing with.
