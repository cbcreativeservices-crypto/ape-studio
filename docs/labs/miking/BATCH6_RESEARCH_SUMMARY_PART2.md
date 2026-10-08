# Miking Labs, Lab 6 Foley, Field & Scientific — part 2 research summary (F09–F16, 8 lessons)

Date: 2026-10-07. Researcher: Claude (preparation pass; NO app code, no sub-agents). Owner: "prepare, but do not
start the build." Model: `BATCH5_RESEARCH_SUMMARY.md`. Survey for F09–F12: `survey/lab6.md` (F13–F16 were missing
then; their text is now in `source_text/`, extracted 2026-10-07 with the same method, byte-identical on F09–F12).

Folders (SOURCES.md + GEOMETRY_PROPOSAL.md each): `location_speech/ (F09) spatial_field/ (F10) measurement_mics/
(F11) sound_level/ (F12) room_acoustics/ (F13) loudspeaker_measurement/ (F14) machinery_sound/ (F15)
scientific_arrays/ (F16)`. **Register**: Lab 6 part 2 source keys and status words → `measurement_mics/SOURCES.md` §0;
measurement family (frame M) → `measurement_mics/GEOMETRY_PROPOSAL.md`.

Character of these lessons: F11–F16 are **measurement** lessons — the "mic position" question is real (receiver
points, heights, orientation, keep-outs) but much of the teaching is the chain, the label of the result and the
limits of a claim. They need a non-placement page type (the **chain rack**) alongside the usual journey. All eight
are honest and almost free of physics errors; most numbers they lack are genuinely method-specific.

New sourced data not in the lessons: OSHA "at least 10 feet" from overhead power lines; NWS "get inside a safe place
immediately" + "30 minutes after the last lightning or thunder"; FHWA facade positions (10 ft / 6.6 ft / against the
facade) and interior mic ≥ 5 ft above floor, ≥ 3 ft from walls; Meyer listener mic heights 1.2 m seated / 1.7 m
standing; Rational Acoustics T20/T30/EDT ranges and 35/45 dB range requirement (confirms F13 exactly); ISO 3744:2025
(ed. 4, Dec 2025) confirmed; ISO 3382-1 revision found at Committee Draft stage with a new title; intensity-probe
spacers 12/25/50 mm ≈ 100 Hz–10 kHz; water/air references 1 µPa / 20 µPa = 26 dB of a 61.5 dB total difference;
λ/2 spacing (MathWorks); Shure lav "above the sternum"; AMBEO four identical preamps with matched/linked gain.

## 1. Readiness per lesson

| Pri | Lesson | Readiness | Blocked on / owner decisions |
|---|---|---|---|
| 1 | F11 Measurement mics & calibration (defines frame M + chain rack) | **READY** | Chain rack as a page type (D-6B-1); keep-away radius default. 94/114 dB at 1 kHz, 1/4-in adapter CONFIRMED. |
| 2 | F12 Sound level & environmental noise | **READY with defaults** | FHWA 1.5 m + facade numbers, NPS 5 m/s CONFIRMED; background-subtraction refusal limit (D-6B-8); new calculator lands on `audio-tools-engine`; synthetic history allowed (D-6B-2). |
| 3 | F13 Room acoustics & reverberation | **READY** | T20/T30/EDT + 35/45 dB CONFIRMED; ISO 3382-1 revision wording fixed; model decay curve allowed (D-6B-2). |
| 4 | F14 Loudspeaker & system measurement | **READY with defaults** | Seat heights 1.2/1.7 m CONFIRMED; "beginning/middle/end" not found at Meyer → practice wording; radius/angle grid defaults. |
| 5 | F15 Machinery & product sound | **READY with defaults** | Guarded desk fan only; exclusion-zone default; ISO 3744:2025 CONFIRMED. |
| 6 | F16 Scientific arrays & sensors | **READY with defaults** | λ/2, Nyquist, 1 µPa/20 µPa CONFIRMED; how far to draw specialist kit (D-6B-4). |
| 7 | F09 Location speech & practical sounds | **READY with defaults** | Needs people art (D-6B-5) and the Lab 7 boom/lav overlap call (D-6B-6); power-line 3 m keep-out added. |
| 8 | F10 Spatial & specialist field pickup | **READY with defaults** | No spacings for 5.0 / IRT / Hamasaki / Double M/S (drawn as "example layout", D-6B-7); hydrophone/contact scope (D-6B-4). |

No lesson needs owner input before its build can start; the D-items set defaults the builder can apply and the owner
can change later.

## 2. Corrections found in the owner's documents (16)

Safety-critical first.
1. **F09 L30/L42 — no power-line clearance.** OSHA: "Stay at least 10 feet away from overhead power lines." App: keep
   the pole and mic at least 3 m (10 ft) away, farther if unsure; if you cannot be sure, do not raise it.
2. **Lightning wording (F09 L42, F10 L44, F12 L41).** NWS: get inside a safe place immediately when thunder is heard;
   wait 30 minutes after the last **lightning or thunder** (F10/F12 say "last thunder"; F09 omits the 30 minutes).
3. **F13 L78 / ref [7]** — "ISO/DIS 3382-1 … 2026 revision draft": the revision is at Committee Draft (ISO/CD 3382-1
   ed. 2, retitled "Spaces for music, speech and communication"); app says "a revision is being drafted; the 2009
   edition is current", no stage letters. OWNER: check the ref URL (85647 vs 85701).
4. **F14 L24** — attributes "beginning, middle and end of coverage … extra points for deep areas" to the MAPP 3D guide;
   not on that page (it gives 1.2 m / 1.7 m mic heights and front-to-back order). App: practice wording, no attribution.
5. **F14 refs [1] = [12]** — same URL, two titles (and the page has no ground-plane text).
6. **F12 refs [4] = [6]** — same FHWA URL, two titles (survey flag, still open).
7. **F16 L102** — cross-link "F10 water and hydrophone": F10 has no hydrophone content → link F16's own step and F04.
8. **F10 scope** — the plan's hydrophone/contact comparison is still absent from F10 (now covered by F16 + F04).
9. **F16 L36 enrichment** — 1 µPa vs 20 µPa: the references explain only 26 dB of a 61.5 dB difference for equal
   intensity; the app must never teach "subtract 26 dB" (the lesson does not, but a quiz could).
10. **F11 L45** — "instructor supervision" → "someone qualified on the equipment".
11. **F16 L26** — "qualified instructor" → "a qualified operator".
12. **Lab-name headers** — F09/F10 "Foley Field and Acoustical Lab", F11/F12 "Scientific and Acoustical Lab", F13
    "Foley, Field and Acoustical Lab", F14–F16 "Foley Field and Acoustical Lab"; app uses the registry name
    "Miking Lab 6: Foley, Field & Scientific".
13. **"Pro Audio Training Academy"** on every header → stripped.
14. **"Student / classroom / class exercise / course / Guided teaching exercise"** (all 8) → "you", "Practice
    exercise", "Observation sheet / Field sheet / Measurement sheet".
15. **F13 L89** — vague cross-link "F14 subsequent acoustical topic" → name the lesson.
16. **F11 L32 nuance** — OSHA Appendix G calls pre/post calibration "good professional practice"; the inspection
    *requirement* is in the Technical Manual (not re-read). Keep both statements, attributed internally only.

No physics errors found (checked: T20/T30/EDT, energy averaging, dB subtraction, Nyquist, λ/2, intensity cos θ,
reference pressures, A-format/FuMa/ambiX, ".1" = LFE, 94 dB ≈ 1 Pa, window length vs resolution).

## 3. Shared families and tools to build once

1. **Scene frame F** (ground plane, metres, scene front, plan + section, rounding that scales) — shared with Lab 6
   part 1. Whichever group builds first owns `lessons/shared/field/sceneFrame.ts`; the other imports it.
2. **Measurement family, frame M** (`lessons/shared/measure/`): measurement mic (free-field / pressure / random-
   incidence, 1/2 and 1/4 in, grid), preamp, power paths, calibrator + coupler + adapter, SLM on tripod, windscreen,
   operator keep-away ring; "relative / calibrated" result label logic. Used by F11–F16 (and F06/F07 measurement notes).
3. **Chain rack** (new page type, no mic dragging): build-the-chain with refusals, field picker, calibrator pre/post
   with drift, reference-tap and delay (F14), A-format channel drill (F10; also Lab 7 broadcast).
4. **Measurement models** (pure, tested, silent): `decay.ts` (T20/T30/EDT fits + range refusal), `levelHistory.ts`
   (seeded synthetic history → LAeq, Lmax, Ln via calc `leq`), background energy subtraction (NEW calculator on
   `audio-tools-engine`), line-array λ/2 helper, window → Δf.
5. **Venue seat plan** (`shared/measure/venue.ts`): mains/sub/fill, seat mics at 1.2/1.7 m; reuses
   `shared/speakers/` art.
6. **Location kit** (`shared/field/location.ts`): camera-frame keep-out, boom / body / plant mount kinds, overhead
   power-line keep-out (3 m) — shared with Lab 7 B04/B05.
7. **Spatial presets** added to `shared/ensemble/stereoArray.ts`: binaural head, Double M/S, 5.0, IRT, Hamasaki,
   FOA (unsourced dims = drawing defaults).
8. **Claim ladder** item type + **exclusion-zone** keep-out + contact sensor (F15/F16; part 1 F04 may share).
9. **Field/measurement log sheet**: typed fields only, `createLocalStore`, no GPS / no location permission.

## 4. Builder grouping (3 groups; branches `lab6-g4` … see `BUILD_PROMPTS_lab6b.md`)

1. **G-A "Measurement core"** — F11 (first; builds frame M + chain rack), F12, F13. Needs scene frame F (build it if
   part 1 has not). Branch `lab6-g4`.
2. **G-B "Systems, products & sensors"** — F14, F15, F16. Depends on G-A's frame M, chain rack and models (start
   after G-A merges, or stub-import the agreed paths). Branch `lab6-g5`.
3. **G-C "Location & spatial"** — F09, F10. Depends on frame V (exists), stereoArray (exists), scene frame F, and
   part 1's moving-source path if available. Can run in parallel with G-A. Branch `lab6-g6`.
   (Group numbers continue after Lab 6 part 1's groups g1–g3; rename if part 1 uses a different count.)

## 5. Owner decisions needed

- **D-6B-1** Chain rack as a new Miking page type for the measurement lessons (the journey's eight pages stay; the
  chain rack sits inside MICROPHONES / PLACEMENT / ADVANCED). Default: yes.
- **D-6B-2** Synthetic level histories (F12), model decay curves (F13) and example traces (F14), each labelled "a
  made-up example, not a measurement". Default: yes.
- **D-6B-3** Naming standards (ISO 1996, ISO 3382, ISO 3744, IEC 61672, ISO 9614) in learner text. They are method
  names, not brands; but the starting-points ruling bans citations. Default: name the TYPE of method only ("the
  room-acoustics method you were given"), standards kept internal.
- **D-6B-4** Specialist kit depth (hydrophone, ultrasonic, acoustic camera, intensity probe): drawn as objects with
  "qualified operator" framing, no hands-on placement beyond the two-mic baseline. Hydrophone/contact stays in
  F16/F04, not F10. Default: yes.
- **D-6B-5** People in art (talkers, boom operator, wearer of a lav / in-ear mics) in the Lab 5 line-art style.
- **D-6B-6** Lab 7 overlap: F09 boom/lav and B04/B05 share one location kit; separate lessons. Default: yes.
- **D-6B-7** Arrays with no sourced spacing (5.0, IRT, Hamasaki, Double M/S) drawn as "an example layout", never a
  number on screen. Default: yes.
- **D-6B-8** Background subtraction refusal threshold: a default (3 dB) labelled "your method sets this", plus a new
  calculator workspace on `audio-tools-engine` (calculator source-of-truth rule). Approve the calculator.
- **D-6B-9** Safety numbers on screen exactly: 3 m (10 ft) from power lines; 30 minutes after the last lightning or
  thunder; calibrator never at an ear. Default: yes (safety stays, in plain words).
- Brand rule: nothing in F09–F16 needs the brand exception (the owner's "Hammond" exception does not arise here).

## 6. Sources not reachable today (403 / not re-read)

iso.org pages (1996-1/-2, 3382-1/-2, 3744, 11200–11202, 9614-1/-2/-3; 3744:2025 confirmed via national-body
listings), IEC webstore, RØDE help, HBK intensity article, OSHA Technical Manual, NIST abstract, GRAS powering/FAQ,
Klippel pages, RA delay/coherence pages, DPA immersive/5100 pages, NOAA PDF, USGS NABat. None drives a CONFIRMED
geometry value.
