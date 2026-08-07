# AP&E — EQ Lab Spec of Record (2026-08-07)

Owner spec, ingested 2026-08-07. The EQ Lab is much more than an EQ simulator:
it teaches users to **see, hear, manipulate, and diagnose** frequency content
using the phone microphone plus generated/example signals. One lab, several
focused modules that progressively build on each other.

Educational progression: **SEE → MANIPULATE → HEAR → IDENTIFY → CORRECT**.

Companion docs: `APE_VISUAL_STANDARDS_2026_07_29.md` (illustrated-real-objects
rule), Learning Lab v4 master (3-pillar ecosystem), `APE_AUDIO_TOOLS_SPEC_2026_07_23.md`
(mic capture / ape-dsp).

---

## Mobile IA (keep the visible structure simple — not 15 disconnected tools)

```
EQ LAB
  LEARN      Frequency & Spectrum · EQ Parameters · Filter Types ·
             Slope & Bandwidth · Graphic vs. Parametric
  EXPLORE    Live Spectrum + EQ · Parametric EQ · Graphic EQ
  TRAIN      Find the Frequency · Match the Curve · Fix the Signal
  CHALLENGE  EQ Challenges
```

## Lesson order (final, owner-approved 15-step progression)

Each lesson introduces only what the next one needs.

1. **Seeing Frequency — Live Spectrum Analyzer.** Phone mic + live RTA. Users
   see real environmental frequency content — including LF energy they barely
   notice — BEFORE touching any EQ.
2. **Why We Use EQ.** EQ = changing the balance of frequency content. Boost,
   cut/attenuation, targeting frequency ranges.
3. **Low-Cut / HPF — The Room Experiment.** Live mic spectrum, examine the low
   end of the user's own room. HPF on/off, move cutoff 20→40→60→80→100→120→160 Hz,
   overlay the theoretical filter curve on the live spectrum.
4. **The Camera Analogy — Fixed → Fully Parametric** (see below).
5. **Parametric EQ Controls.** Formally teach Frequency — Gain — Q/Bandwidth;
   one band, live response graph.
6. **Understanding Q & Bandwidth.** Wide vs narrow; HIGH Q = NARROW / LOW Q =
   WIDE; show BOTH readouts (e.g. `Q: 2.0   Bandwidth: 0.70 octaves`).
7. **EQ Filter Shapes.** Bell/Peak, Low Shelf, High Shelf, HPF/Low-Cut,
   LPF/High-Cut, Notch — one at a time, user manipulates each (own interactive
   section, never buried in text).
8. **Filter Slopes.** dB/octave: 6 | 12 | 18 | 24 | 36 | 48. Fixed cutoff
   (e.g. HPF @ 80 Hz), change ONLY slope, overlay the curves, frequency markers
   on the graph so 12 dB/oct is seen geometrically.
9. **Multi-Band Parametric EQ.** HPF | LOW | LMF | HMF | HIGH | LPF (~4
   parametric bands + filters). Add/remove bands, drag nodes, per-band bypass,
   whole-EQ bypass, solo/audition a band (if audio supports), reset. KEY VISUAL:
   individual band curves PLUS the resulting combined curve — filters interact.
10. **Graphic EQ.** Switch: 1-Octave | 1/3-Octave. Mobile-first 1-octave
    (31 | 63 | 125 | 250 | 500 | 1k | 2k | 4k | 8k | 16k); 1/3-octave via
    horizontal scroll or landscape. Teach graphic (fixed freq, fixed/defined
    bandwidth, adjustable gain) vs parametric (all three adjustable).
11. **What a Graphic EQ Is REALLY Doing** (see below — "THE SLIDERS ARE NOT THE
    RESPONSE").
12. **Live Spectrum + EQ.** Combined screen; toggle `Spectrum Only | EQ Only |
    Combined`. Guided challenges: Find the Low End · Try a Low Cut · Change the
    Slope · Find a Frequency (narrow boost swept across the spectrum).
13. **Parametric Trainer — Find the Frequency.** A source with a deliberately
    altered region; student locates it with Frequency → Q → Gain, then CHECK:
    `Target: 630 Hz · Your selection: 670 Hz · Difference: +6.3%`.
    Levels: 1 find a large boost · 2 find a large cut · 3 find a narrow
    resonance · 4 correct tonal imbalance · 5 multiple EQ problems. Feeds the
    future ear-training curriculum.
14. **Match the EQ Curve.** Target curve in gray; user recreates it; score on
    closeness. Tests frequency+gain+Q+filter-type understanding WITHOUT
    requiring hearing — valuable as an accessible exercise.
15. **Fix the Signal — EQ Challenge.** Practical problems where the learner
    decides what needs changing and how — nobody tells them which control.

Opening sequence rationale (owner): 1 → 3 → 4 → 5. The student first SEES real
frequency content, discovers a practical reason for filtering, gets the camera
model, and only then meets the formal controls — two of the three are already
intuitive by the time Frequency/Gain/Q appear.

---

## The Camera Analogy (lesson 4 — distinctive, preserve)

Three stages, and the analogy STOPS at pan/zoom:

1. **Fixed EQ — camera on a tripod.** Locked on one object; cannot pan or zoom.
   Frequency fixed, Q fixed, only gain adjustable. "You can change how much you
   affect the frequency, but not where you're looking or how wide your view is."
   Graph: bell locked at ~1 kHz, boost/cut only.
2. **Semi-Parametric — camera can pan.** Points anywhere in the room; lens
   cannot zoom. Frequency + gain adjustable, Q fixed. Camera pan maps literally
   to the bell moving left/right on the graph.
3. **Fully Parametric — pan + zoom.** Zoom tight on one object or wide on the
   room. Zoom IN → narrow bell (higher Q); zoom OUT → broad bell (lower Q).
   Animate the camera field-of-view INTO the EQ bandwidth.

```
MOVE THE CAMERA = FREQUENCY
ZOOM THE CAMERA = Q / BANDWIDTH
```

**RULING: do NOT extend the analogy to gain** (no brighten/darken mapping) —
pan/zoom are the clean mappings; gain is introduced separately on the next
screen. Core statement: "Frequency tells us where to look. Q tells us how wide
or narrow an area we're looking at. Gain tells us what we're doing to that
area — boosting or cutting it." Explicitly address the counterintuitive part:
**higher Q = narrower bandwidth; lower Q = wider**.

---

## "THE SLIDERS ARE NOT THE RESPONSE" (lesson 11 — graphic EQ truth screen)

Highly visual interactive screen. 10–15-band graphic EQ; TWO curves at once:
- **Expected / Slider Curve** — the smooth line a beginner imagines by
  connecting slider positions.
- **Actual Filter Response** — the calculated combined response of the
  individual overlapping filters.

Innocent-looking exercise: 125 Hz +3 · 250 Hz +6 · 500 Hz +3 → reveal the real
summed response. Button: **SHOW INDIVIDUAL FILTERS** (every band's response
under the composite — "that's the revelation"). Toggle: **MAGNITUDE | PHASE** —
conventional minimum-phase EQ changes phase around affected regions, not just
amplitude.

Teaching copy (short): "An EQ slider is a control — not a drawing of the
resulting response. Graphic EQ bands are filters with finite bandwidth. Their
responses overlap and combine. Conventional minimum-phase filters also
introduce frequency-dependent phase shift. The actual result can be
considerably different from the smooth shape suggested by the slider positions."

**Technical framing ruling:** do NOT teach that graphic EQs inherently create
"phase cancellation" merely because adjacent bands exist. Correct framing:
minimum-phase filters introduce frequency-dependent phase shift; adjacent
overlapping filters interact; the combined response depends on topology,
bandwidth, boost/cut amount, and adjacent settings.

Follow-up: **Why Parametric?** — direct control over where / how much / how
wide. **Ruling:** never say "professionals don't really use graphic EQs" —
graphic EQ = fast fixed-band control (still professionally used); parametric =
substantially greater precision. Teach why a pro might choose each.

Memorable add-on challenge — **FLAT → SMOOTH → JAGGED**: "Create a smooth +6 dB
rise from 125 Hz to 1 kHz with the graphic EQ" → user makes it look beautiful →
**REVEAL ACTUAL RESPONSE** (magnitude + phase) → then attempt the same target
parametrically.

---

## Boost vs. Cut Trainer (CHALLENGE-side lesson)

Deliberately problematic signal ("reduce the excessive 250 Hz region"); learner
tries +6 elsewhere vs −6 at 250 Hz; compare. Teach: "EQ is fundamentally about
changing spectral balance. Sometimes cutting the unwanted region is more
effective than boosting everything around it — but boosting is not inherently
wrong." **Ruling: do NOT teach the old "always cut, never boost" cliché.**

---

## Signature moment (emphasize heavily, appears very early)

Open the live analyzer → "**Look below 100 Hz.**" Room isn't silent down there
(HVAC, traffic, handling noise, vibration, wind). Turn on an HPF and physically
watch the filter curve cover that region. One 30-second interaction teaches
spectrum analysis, unwanted LF energy, cutoff frequency, high-pass filtering,
slope, attenuation, and why low-cut controls are everywhere.

**Ruling:** never imply low frequencies should be removed just because they're
visible — "Remove unwanted low-frequency energy while preserving useful
content."

**Caveat (state unobtrusively somewhere):** a phone microphone is an
educational measurement source, not a calibrated reference microphone (absent a
proper calibration method).

---

## Vocabulary (taught in place, linked to the glossary — never duplicated)

Frequency · Gain · Q · Bandwidth · Center Frequency · Cutoff Frequency · Corner
Frequency · Boost · Cut/Attenuation · Bell/Peaking Filter · Low Shelf · High
Shelf · High-Pass Filter (HPF) · Low-Cut Filter · Low-Pass Filter (LPF) ·
High-Cut Filter · Notch Filter · Slope · dB/octave · Graphic EQ · Parametric EQ
· Semi-Parametric EQ · Fixed-Frequency EQ · Bypass

Each term links into the existing glossary (the in-place `GlossaryTermPopup`
built 2026-08-07 for the calculator is the intended mechanism — tap term →
definition popup → return to spot).

---

## Implementation notes (repo reality — for when the build is green-lit)

- **Mic capture exists** (ape-dsp spike: iOS capture done; see audio-tools
  spec). **NO playback/signal-generation path exists yet** in the tools module —
  the HEAR-dependent modules (Find the Frequency by ear, band solo/audition,
  example signals) need a native DSP/playback build, same reason the digital
  lab's listening tests were deferred. Visual-first modules (RTA, curves,
  camera analogy, match-the-curve, slider-vs-actual) are buildable without it —
  mirror the digital lab's visual-first + honest-audio launch split.
- **RTA/meters:** live spectrum MUST bypass React state (SharedValues driven
  from native per rAF) per the standing meter-responsiveness rule.
- **Spectrum/heat coloring:** follow the loudness colour standard
  (`levelColor.ts` ramp / `heatColor` navy silence floor) for any amplitude/
  spectrum drawing.
- **Overlays:** any auto-appearing coach/guide overlays must gate on
  `useOverlaysSuppressed` (Low-Light Production Mode rule).
- **Visuals:** per APE visual standards — illustrated real objects (the camera,
  the room scene) — no primitive-shape stand-ins. EQ curves/graphs are the real
  object for response displays.
- **Labs IA:** enters the Audio Fundamentals & Training Lab catalog as a
  `status:'development'` placeholder while under construction; section
  (Fundamentals/Training) to be decided by owner.

## Status

**Spec ingested 2026-08-07. Build NOT started — awaiting owner go** (standing
pattern for major lab builds: design/planning first, no build until scoped and
green-lit).
