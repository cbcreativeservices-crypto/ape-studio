# Lab design + learning pass — 2026-09-02 (the five overnight labs)

**Pro Audio Training Academy** · owner-commissioned unattended night run, second
pass of the pair used on 2026-08-31 (`docs/APE_LAB_DESIGN_PASS_2026_08_31.md`).

## THE BRIEF (owner, going back to bed)

"Send our design agent and cognitive learning agents and have them do their design
pass together like we did before. Have them review, correct, fix and improve all of
the 5 new labs."

Same rules as the first pass: implement what the agents recommend, one commit per
lab, push as I go, never weaken an honesty/accuracy disclaimer, never reverse an
owner-ruled visual (amplitude colour standard, no fake meters), all copy remains
NEW/unratified.

## HOW IT RAN

Six dual-hat agents (design + learning in one brief, the pair's rubric from the
first pass) ran in parallel, one per lab (Speech and Envelope separate; the Envelope
agent also owned the shared `PagedLab` shell; the Tuning agent owned the shared
`primitives` / `UnderstandingCheck` components with a backward-compatibility rule).
Agents edited code, ran `npx tsc --noEmit` and their lab's node tests, and reported.
The orchestrator then re-gated (tsc + full `npm test`), verified each lab visually on
the web preview (single shared browser, sequential), and committed per lab.

## STATUS

Legend: `pending` · `reviewed` (agent report in) · `verified` (web pass by the
orchestrator) · `pushed` · `blocked: reason`

| # | Lab | Agent report | State |
|---|---|---|---|
| 1 | Ear Training Lab | in | pushed |
| 2 | Amplifier Principles Lab | in | pushed |
| 3 | Tuning & Temperament Lab | in | pushed |
| 4 | Sound Envelope & Transients Lab (+ PagedLab shell) | in | pushed (300408c) |
| 5 | Speech & Voice Lab | in | pushed |
| 6 | Smart Processors V1 · De-Esser | in | pushed (b6d888b) |

## RESULT

All six passes reported, were re-gated by the orchestrator (`npx tsc --noEmit` clean;
`npm test` **179 / 179**; ear harnesses 28 / 28 and 53 / 53), looked at on the web
preview, and pushed one commit per lab. Grades before → after (agent-assigned):

| Lab | Design | Learning | Commit |
|---|---|---|---|
| Ear Training | B− → A− | B → A− | c521014 |
| Amplifier Principles | B− → A− | C+ → A− | 924dd11 |
| Tuning & Temperament | B− → A− | C+ → A− | 3c92611 |
| Sound Envelope (+ PagedLab) | C+ → A− | C+ → A− | 300408c |
| Speech & Voice | C− → A− | C+ → A− | (this commit) |
| De-Esser (Smart Processors V1) | B− → A− | C+ → A− | b6d888b |

Fleet-wide patterns the pass established for these labs: every check shuffles by
presentation and judges by original index (the shared `UnderstandingCheck` now does
this for all three visual labs; amp `CheckCard` and the speech/de-esser local cards do
it too); no correct answer is the longest option; a "what to notice" prompt sits under
every drawing; every SvgText carries a font and sits ≥ 8.5 in its viewBox; tap targets
≥ 44 pt; red appears only for clipping / faults / wrong answers; every conceptual
chart says so.

## PER-LAB ENTRIES

### 5 · Speech & Voice — Design C− → A−, Learning C+ → A−

**Fixed:** the head cross-section was an unreadable blob with numbered discs sitting on
the structures → rebuilt as a leftward mid-sagittal profile (air / bone / muscle /
mucosa palette, turbinates, palate, uvula, tongue, incisors, lips, mandible,
epiglottis, folds, cartilages, trachea rings, bronchi, lungs, diaphragm) with leader-
line numbering off the structures and ≥ 44 pt hit circles enforced by a spacing test;
anatomy card said "lips → lungs" while the data ran lungs → lips; chips read "5 Soft" /
"7 Hard" → `short` names; "cut less treble" (reads as the opposite) and "a tenor speaks
above many women" (singing, not speaking) corrected; production auto-play looped
SPEECH → BREATH forever → plays once, ends disable, reduced-motion note; all four
checks had the correct answer as the single longest option, never at 0/3, no shuffle →
nine checks authored in the model with a no-length-cue test and mount shuffle; vowel
trapezoid wrong shape → IPA quadrilateral + hinged jaw gauge + lip ring; trace mid line
off-standard → `MIDLINE_BLUE` + ramp gradient (the bare plosive reads hot because it is
near full scale); "muffled" / "off-axis" highlighted a *missing* band like an excess →
`bandKind: 'loss'`; distance chart had no axis and clipped +54/+58 → ticks, flipped
labels; RangeBars labels off the panel; 8 pt fonts; a11y states, live-region counter.
Tests 13 → 17.
**Added:** ◦ notice cue under every drawing, page-2 taps jump to the stage using that
structure, laryngoscope-view folds, mouth → mesh → capsule diagram, two in-page checks +
seven interleaved on the final page (`PASS_MARK = 5`).
**Left (OWNER):** conceptual spectra stay categorical cyan/orange (matching the
de-esser) — say if any drawn amplitude must wear the ramp; the TYPICAL, NOT FIXED card
uses the red `warn` border (chrome, not amplitude); vowel "O" is /ɔ/ "AW as in law";
the chest is a face-on schematic under a sagittal head (captioned not to scale);
device pass for the low-opacity SVG hit circles on iOS/Android.

### 1 · Ear Training — Design B− → A−, Learning B → A−

**Fixed (DSP truth):** `reverb()` RT60 was a function of comb delay (a "1.2 s"
medium hall rang ~3.2 s) → takes `rt60Sec`, feedback solved per comb, harness
measures 0.51 / 1.25 / 2.62 s vs 0.5 / 1.2 / 2.5 claimed; RF interference pulsed at
46 Hz → 217 Hz GSM frame with idle gap; 8 ms tone fade (click at 63 Hz) → 20 ms.
**Fixed (learning):** ladder ping-pong after a step-down (`levelChangedAt`); M2/M7/M8
magnitude fixed per level (chips carried no information) → drawn from the unlocked
set; near-credit at wrong levels (M9, M10, M14); no session shape → 10-trial rounds;
no no-repeat rule; wrong answers got only the truth → "You picked 500 Hz — 2 steps
too low"; no listening objective → LISTEN FOR on every module; copy untrue of the
render (RT60s, "pre-delay", "≈8 kHz damping", "one echo", "cancel almost completely",
"notches up high") rewritten. **Fixed (screen/See-It):** band labels never drawn;
"count the ruler" with no ruler; goniometer mirrored; level bars solid (ramp ruling)
→ base→tip gradient honest to real RMS; envelopes off-ramp → ramp lanes; serif SVG
text, 8 pt axes, empty gutter → dB ticks; single-frame periodogram → Welch; ■ chip
restarted instead of stopping; audio gate bypassed after first play; NEXT double-tap
load race; sub-bass toggle left a stale trial; chips truncated "(emulation)"; a11y
states/labels. Harnesses 25 → 28 DSP, 31 → 53 modules (now plain-Node runnable).
**Left (OWNER):** spectrum overlay traces stay identity-coloured (relative-dB
comparison cannot wear the ramp) — ratify the exception; level bar = relative-dB
height + real-dBFS colour (two encodings); V2 items (GR overlay M10, Schroeder decay
M9, piano strip M11); M6 "Centered (mono)" as one chip; device pass WITH sound.

### 3 · Tuning & Temperament — Design B− → A−, Learning C+ → A−

**Fixed:** EquationStage reset to step 1 on every audio tick (effect keyed on an
inline literal); RailMarkerGlyph remounted every render (animated component created
in render); dragRail PanResponder captured first-render callbacks + ch2 solve closure
stale; step buttons never snapped (701.955 ¢ unreachable); ch2 "2:NaN" on the octave
tile; ch0 uncleared timer restarted audio after STOP; MarkOnce called parent setState
during render → `useMarkWhen`; ch7 key-dependence demo factually wrong (mis-spelled
B♭/F♯/C♯, wrong verdicts, "every relationship exact" in C) → rewritten and replayed in
Node; ch7 arc captions/buttons; ch6 spiral B♯ clipped; ch8 dead JUST E button; ch9 track
labels off their ticks; ch11 bestPair bracket meaningless (6 %) → ≤ 2 % with honest
empty state; ch11 legend described glyphs never drawn; ch13 challenge answers on the
diagonal; `UnderstandingCheck` never shuffled and a wrong pick revealed the answer
(every check in every lab was `correct=1`) → shuffle by presentation / judge by
original index + optional per-distractor `wrong[]`; length-cued options; red used for
legitimate tunings ≥ 8–10 ¢ from ET → new `ROLE.far` orange, red only for comma/wolf/
B♯/wrong; serif SVG text in four displays; sub-44 pt shell controls; RatioTile double
a11y node; octaveElevator restarted on identity; `mixVoices([])` threw. Tests 49/49,
27 spec assertions intact.
**Added:** chapter objectives ("IN THIS CHAPTER") ×14; BASIC | MATH segmented toggle;
7 new checks (13 total) with authored wrong-feedback; ch12 requires ≥ 3 cards; ch9
NEXT-part buttons; font floors.
**Shared components (envelope / speech / de-esser consume them, all additive):**
`primitives.tsx` new `useMarkWhen`, `useStableShuffle`, `ROLE.far`, `Btn.selected`;
`check.tsx` new optional `wrong`, `eyebrow` + shuffle — other labs' checks gain the
shuffle with byte-identical wrong-pick text.
**Left (OWNER):** kicker "CHAPTER n OF 13" (zero-indexed spec) vs dots "n/14"; ch7
D→A = 40/27 line and ch12 ≥ 3-card gate are new policy — ratify or relax; ch11
REFERENCE re-roots the whole lab (spec); rail markers not individually reachable by
screen readers (button equivalents exist).

### 2 · Amplifier Principles — Design B− → A−, Learning C+ → A−

**Fixed (model):** `evaluateRig` used a different upstream gain than
`evaluateGainStructure` → verdict could say "no clipping" while the rig drew a clip;
overcurrent tripped at the rated 4 Ω load; single-device bias clipped at every bias
but 50 %; Class C "recovered" a sine with zero conduction; Class D / AB efficiencies
contradicted their copy; Module 6 PROTECT was unreachable → `simulateRailLimits`.
**Fixed (data):** Module 8 final wiped its own checks → serialised
`updateAmpProgress`. **Fixed (kit):** ControlSlider stale-closure PanResponder (refs;
termination-request false); CheckCard unshuffled + wrong pick lit the answer + re-picks
overwrote mastery → shuffle by presentation / judge by authored index / first attempt
recorded; LearnMore 32 → 44 pt. **Fixed (rig/modules):** duplicate a11y, 34 pt
transport, nested Svg, seven SvgText without font, 7.5–8 px labels, transformer coil
inside the core, skipped-prediction dead end, dead add-chips, spec decoder false
"every gap", sag identical to clip → nominal rails drawn, indistinguishable diagnoses
scored → `alsoAccept`, decoy meters, challenge passed 6/6 untouched → arrives
misconfigured, final unshuffled, Module 8 checks shown twice, `bridge-4x` myth record
wrong. Tests 46 → 60.
**Left (OWNER):** ratify copy; Module 7 is eight sections in one scroll (split?);
"Tube stage" among classes in the selection round; heat bar red at ≥ 0.8 relative heat
(fault red, not amplitude — keep or restrict); mild length cueing remains in two
checks.

### 6 · Smart Processors V1 · De-Esser — Design B− → A−, Learning C+ → A−

**Fixed:** GR bars were `colors.red` (ramp violation) → orange, labelled reduction;
"range = lisp territory" claim corrected; defaults landed in the lab's own
"Noticeable" stage → now "Controlled" (test-locked); detector readout was hiss ×
band-pass (an SH read 80 %) → band-pass fraction; side-chain tap drawn dashed →
solid audio tap + dashed control return, one rotated arrowhead; threshold copy named
the wrong first crossers; over-de-essing slider was "Dull" across its top half →
`overSettings()` walks all six stages (test); module `rack` survived re-entry → reset
on entry; correct answer was index 1 in 3/4 and longest in 4/4 → rewritten, mount-
shuffled; hidden readout-as-next-button and "PLAY" in a silent lab → ‹ › + AUTO-STEP;
44 pt targets; 7.5 → 8.5 fonts; spectrum axis mismatch; hub planned rows get
`accessibilityState`.
**Added:** `HissDbStrip` (EQ-vs-de-esser proof in dB), selected-frame linkage,
per-page Prompt, seven checks each after its worked example, per-hint disclosure,
directive connections. Tests 10 → 13.
**Left (OWNER):** ratify copy; strip columns ~22 pt (buttons remain the 44 pt path);
seven checks may be more than wanted; spectrum bars categorical (cyan/orange), not
the ramp; threshold label can sit on the last S's fill — one device glance.

### 4 · Sound Envelope & Transients (+ PagedLab) — Design C+ → A−, Learning C+ → A−

**Fixed:** stale-closure data loss in the explorer (ControlSlider keeps its first
`onChange`; functional updates now); waveform one hot orange regardless of level →
ramp gradient with the peak pinned short of red; red "peak" line → white/purple, off
the ramp; duration bands tinted in ramp order → neutral; rise labels on the curve →
dots at the real t10/t90 with backed labels; timeline three-row stagger → numbered
44 pt markers + one callout; snare/kick had a labelled R on the zero line, piano/cymbal
a fake flat plateau → honest release/hold (test-locked); all checks `correct=1` +
longest → rebalanced, six checks, FINISH gated on 6/6; handoff never cleared → consumed
once + "LOADED FROM THE GALLERY" chip; log sliders could not say 0 ms; PagedLab chrome
below 44 pt, one-shot reduce-motion read, `Alert` no-op on web.
**Added:** "▶ SWEEP THE SHAPE" playhead (Reanimated; hidden under reduced motion),
ILLUSTRATIVE MODEL caption on every chart, per-page Prompt, worked examples (rise vs
attack; four level spans), glossary split to first use. PagedLab additive API:
`ctx.goTo?`, `PageDef.manualDone?`. Tests 11 → 15.
**Left (OWNER):** ratify copy; Reanimated sweep on device; `Tag` backing widths are
estimates; Speech/De-Esser check pages could take `manualDone: true` for parity.
**Shared-file note (amp/kit ControlSlider):** PanResponder captures the first
`onChange`; callers must pass stable/functional setters. Fix proposed to the amp
owner: `onChangeRef`.
