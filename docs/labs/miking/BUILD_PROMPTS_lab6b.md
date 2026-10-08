# Lab 6 part 2 (F09–F16) — ready-to-paste builder prompts

Prepared 2026-10-07 (preparation only — NOT started; the owner gives the go). One prompt per group from
`BATCH6_RESEARCH_SUMMARY_PART2.md` §4. Run on Opus 5.5 at HIGH effort (D56). Order: G-A and G-C may run in parallel;
G-B after G-A merges (or with stub imports of G-A's agreed paths). Group/branch numbers follow Lab 6 part 1's
g1–g3; rename if part 1 used other numbers.

---

## Common block (paste at the top of every group prompt)

```
Repo C:\Users\profe\dev\ape-studio. Work in your own git worktree created from origin/final-lab:
  git fetch origin; git worktree add <path> -b lab6-gN origin/final-lab   (use -c core.autocrlf=false for git)
No sub-agents. No eas / build / submit / update / publish / deploy / SQL. Never push to final-lab or
audio-tools-engine; push ONLY your backup branch lab6-gN at the end. No new native dependencies; never edit
package.json scripts. Owner rules: fully silent (no audio, ever); suggested starting points voice; no brand, model,
standard-number citations or evidence badges in learner text (test/mikingLearnerText.test.ts); safety stays exact
in plain words; no institutional words (student, classroom, instructor, course, Academy); members-only with the
grayed preview; credit only grows; labs never block navigation; Rack Unit; ≥ 9 pt after fitValue; full screen
zooms everything; real objects, never primitives.

READ FIRST, in order:
  AGENTS.md (house helpers, ratchets)
  docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md (esp. §12)
  docs/labs/miking/BUILDER_BRIEF.md
  docs/labs/miking/LESSON_JOURNEY.md (8-page journey, §0 restructure, STARTING SETUPS, §12 voice)
  docs/labs/miking/MIKING_LABS_PLAN_2026_10_04.md §6
  docs/labs/miking/SOURCES_SHARED.md, docs/labs/miking/CORRECTIONS_LOG.md
  docs/labs/miking/BATCH6_RESEARCH_SUMMARY_PART2.md (your group's lessons, §2 corrections, §3 shared tools, §5 D-items)
  docs/labs/miking/measurement_mics/SOURCES.md §0 (Lab 6b source register) and each of your lessons'
    SOURCES.md + GEOMETRY_PROPOSAL.md; the owner's text in docs/labs/miking/source_text/F1x-*.txt
  Kick (M01) code as the quality standard: src/screens/lab/miking/lessons/m01Kick/*, pages/*, engine/*
  A Lab 5 lesson for a scene-scale example: lessons/e14FullOrchestra, shared/ensemble/*, shared/voice/*

REUSE, never duplicate: engine physics (polar, twoMic, levels), shared/ensemble/stereoArray.ts, shared/voice (frame V),
shared/speakers, calculators (call, never copy constants: leq, combine, rt60/eyring/drr, sensitivity, speedOfSoundAir).
A shared asset another group owns → stub-import from the agreed path and note it in your hand-off.
Apply the D-item DEFAULTS in BATCH6_RESEARCH_SUMMARY_PART2.md §5 unless the owner has ruled otherwise.
Never invent a dimension: use SOURCED values or the GEOMETRY_PROPOSAL drawing defaults (placeholder: true).

PER LESSON: model.ts, geometry.ts, art.tsx, lesson.ts in lessons/<id>/; registry entry under lab 'field';
diagnostic (6 items, ≥ 1 critical safety item); a model test (real relationships: anchors, keep-outs, zones clear,
Δt/levels parity with the calculators). Log every correction you apply in CORRECTIONS_LOG.md under one heading
"Lab 6 · group N · <name> (branch lab6-gN, <date>)"; add new source keys to SOURCES_SHARED.md in one block.

MERGE HYGIENE: your lessons go in ONE contiguous block in the registry (data/registry.ts), in lesson-number order,
marked with a comment naming the group; no hard-coded lesson totals anywhere (counts are derived); stage only your
own files; commits in logical chunks, each ending with a blank line and
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

VERIFY: npx tsc --noEmit clean; node --test --test-timeout=120000 "test/**/*.test.ts" — FULL suite passes;
inspect every stage of every lesson at 390×844 via the preview harness (#labpreview/MikingLesson/<ID>?page=…&step=…
&setup=…&unlock=1) on your own preview server; look at each capture and refine twice; run your own audio-expert +
learning self-review against docs/labs/miking/kick/REVIEW_*.md and fix findings. Save screenshots under
docs/labs/miking/<lesson>/shots/ (small PNGs) or report their paths.
FINISH: git push origin HEAD:lab6-gN (backup branch only). Final answer: lessons built, shared files created,
corrections applied, tests count, screenshots, open owner items.
```

---

## G-A — Measurement core: F11, F12, F13 (branch `lab6-g4`)

```
<common block, N = 4>
Your lessons: F11 Measurement Microphones and Calibration (id f11MeasurementMics, build FIRST),
F12 Sound Level and Environmental Noise (f12SoundLevel), F13 Room Acoustics and Reverberation (f13RoomAcoustics).
Folders: measurement_mics/, sound_level/, room_acoustics/.
You OWN and build once:
 - lessons/shared/measure/ — frame M objects (measurement mic ×3 responses, 1/2 + 1/4 in, grid, preamp, power paths,
   calibrator + coupler + 1/4-in adapter, SLM on tripod, windscreen, operator keep-away), the "relative / calibrated"
   label logic, the log-sheet fields (typed only, createLocalStore, no location permission).
 - the CHAIN RACK page type (engine-level, generic): chain builder with refusals, field picker, calibrator pre/post
   with unadjusted post value and drift.
 - pure models with tests: decay.ts (T20 −5…−25 ×3, T30 −5…−35 ×2, EDT 0…−10 ×6; refuse T30 < 45 dB range, T20 <
   35 dB), levelHistory.ts (seeded synthetic history → LAeq via calc leq, LAFmax, L10/L50/L90; labelled "a made-up
   example"), background energy subtraction (refusal below the method's limit, default 3 dB labelled "your method sets
   this") — the CALCULATOR for it belongs on audio-tools-engine: do NOT add it there; stub a local pure function
   with a TODO naming the calculator and list it in your hand-off.
 - scene frame F (lessons/shared/field/sceneFrame.ts) IF Lab 6 part 1 has not merged one; otherwise import it.
Corrections to apply: summary §2 items 2, 3, 6, 10, 12, 13, 14, 15, 16.
Safety exact: calibrator never at an ear; 3 m from power lines in F12's site; lightning 30 min after the last
lightning or thunder; never feed a measurement mic to the PA; never raise level to make a meter respond.
```

## G-B — Systems, products and sensors: F14, F15, F16 (branch `lab6-g5`)

```
<common block, N = 5>
Start after lab6-g4 is merged into final-lab (fetch and check); if it is not, stub-import lessons/shared/measure/*
and the chain rack from the paths G-A owns and note it.
Your lessons: F14 Loudspeaker and Sound System Measurement (f14SystemMeasurement), F15 Machinery and Product Sound
(f15Machinery), F16 Scientific Arrays and Specialized Sensors (f16ScientificArrays).
Folders: loudspeaker_measurement/, machinery_sound/, scientific_arrays/.
You build once: shared/measure/venue.ts (mains/sub/fill, seat mics at 1.2 m seated / 1.7 m standing, reuse
shared/speakers art), the reference-tap + delay chain-rack step, window → Δf = 1/T, the exclusion-zone keep-out
(guard + airflow cone), contact-sensor object, the CLAIM LADDER item type (shared F15/F16), the line-array λ/2
helper (f_max = c/(2d) via speedOfSoundAir), the intensity-probe object (spacer presets 12/25/50 mm, cos θ reading),
the hydrophone side view, the air/water units card (1 µPa vs 20 µPa — never "subtract 26 dB").
F15 draws ONLY a guarded desk fan for placement; industrial machines appear only as no-go examples. Guards stay on;
never reach through a guard; no sensor on an operating machine; lockout is for authorized people.
Corrections to apply: summary §2 items 4, 5, 7, 9, 11, 12, 13, 14.
```

## G-C — Location and spatial: F09, F10 (branch `lab6-g6`)

```
<common block, N = 6>
Can run in parallel with G-A. Your lessons: F09 Location Speech and Practical Sounds (f09LocationSpeech),
F10 Spatial and Specialist Field Pickup (f10SpatialField). Folders: location_speech/, spatial_field/.
Reuse frame V (shared/voice) for every mic-to-mouth readout and the Lab 5 gain-margin panel; reuse stereoArray and
add presets binaural, dms (positive Side lobe marked), surround50, irt, hamasaki, foa — unsourced spacings are drawing
defaults shown as "an example layout", never a number. Reuse Lab 6 part 1's moving-source path and scene frame F if
merged; otherwise stub-import the agreed paths (lessons/shared/field/).
You build once (shared with Lab 7 B04/B05): lessons/shared/field/location.ts — camera-frame keep-out, mount kinds
boom / body (follows the torso, not the head) / plant, overhead power-line keep-out radius 3 m (10 ft); the A-format
channel drill (order, FuMa vs ambiX, swapped channel, full-range channel into LFE, matched/linked gains) in the chain
rack (stub-import G-A's rack if it has not merged).
People: line-art talkers and boom operator in the Lab 5 style (D-6B-5 default). Consent, privacy and "concealed is
not authorized" stay in plain words.
Corrections to apply: summary §2 items 1, 2, 7 (cross-link wording), 8, 12, 13, 14.
```
