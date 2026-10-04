# Miking Labs: build plan (stage 1, Labs 1–5)

Draft for the owner, 2026-10-04. Nothing is built until the owner says go.
Standing rules: `docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md`. Branch: `final-lab`.
Surveys of every lesson: `docs/labs/miking/survey/lab1.md` … `lab5.md`.
Text copies of the owner's lessons: `docs/labs/miking/source_text/`.

## 1. What the documents give us

| Lab | Lessons | Scope covered | Missing |
|---|---|---|---|
| 1 Drums (membranophones) | 14 | M01–M09, M12, M13 | **M10** room mics, **M11** complete kit setups, **speaker-cabinet / Leslie module** |
| 2 Cymbals & percussion (idiophones) | 23 | I01–I03, I05–I12 | **I04** headless tambourine and jingles |
| 3 Winds (aerophones) | 20 | A01–A12 | (none) |
| 4 Strings & pianos (chordophones) | 20 | C01–C15 | (none) |
| 5 Ensembles & voice | 16 | E01–E16 | (none) |
| 6 Foley, field, scientific | 0 | (none yet) | owner is writing |
| 7 Sports & broadcast | 0 | (none yet) | owner is writing |

93 lessons are ready now. The writing is careful and honest: tendencies are not
presented as facts, and most numbers have a source. Every lesson says **no
audio examples** and forbids invented frequency curves.

What the lessons do NOT give:
- **App design:** only 25 of 93 lessons include a "proposed app presentation";
  the rest leave it open. Where it is given, it agrees everywhere: a drawn
  instrument, safe mic zones, change one thing at a time, tendencies in words,
  no fake curves.
- **Safe-clearance numbers:** none, though the design blocks unsafe positions.
- **Instrument dimensions:** almost none. These must come from manufacturer
  spec sheets, or be marked UNKNOWN.
- **Observation sheets** (part 8 of the master plan's structure): only 4 lessons
  have one.

## 2. Problems found in the source lessons (about 40; full lists in the surveys)

Examples of the kinds:
- **Wrong as written:**
  - Clavinet aims the mic's dead spot away from the monitor; it should be
    the reverse.
  - The sax lessons say sound leaves from the "last open holes"; it leaves
    from the first open holes.
  - Four woodwind lessons put the supercardioid's nulls at the sides; they
    are towards the rear.
  - Accordion says "18-inch dynamic mic"; it means 18 in from the grille.
- **Contradictions between lessons:**
  - The 3:1 rule is defined two ways.
  - E04 raises the monitors "to the first sign of ringing", while the other
    ensemble lessons forbid provoking feedback.
  - Congas places the Glyn Johns lesson in the wrong lab.
- **Thin or borrowed numbers:**
  - Many distances are the lessons' own "classroom trials" (unsourced).
  - Oud and veena use identical ranges.
  - Harmonica-amp figures come from a guitar-amp article.
  - Bongos and Timbales give no positions at all.
- **Weak sources:**
  - The oud lesson rests mostly on 2007/2013 forum posts.
  - The sitar link points to a tabla page.
  - Two lessons use an unofficial book mirror.
- **Wording:** "classroom" and "instructor" (no institutional talk). Dates and
  scope IDs are inconsistent, and some cross-links point to lessons that don't
  exist.

## 3. The proposed lab (one engine, every lesson)

**Where it lives:** one **Miking Labs** card leading to five labs (six and
seven slot in later), each holding its lessons. It uses the existing lab kit:
paged lessons, the Rack Unit with the display pinned at the top, full screen,
the "what's left" end screen, and credit that never goes down.

**One lesson, eight pages** (following the master plan's lesson structure):
1. **Meet the instrument:** a large, accurate drawing. Tap a part to name it,
   and see where the sound comes from (heads, port, tone holes, f-holes,
   speaker cone).
2. **Choose the microphone:** by type and pickup pattern, not brand. Named
   models appear only as cited examples.
3. **Placement Studio (the flagship screen):**
   - Drag the mic around the instrument in **side view and top view**.
     Distance, height and angle are separate controls.
   - Documented starting zones are drawn with their source ("Shure Beta 52A
     guide: 5–7.5 cm from the batter head"). Trial numbers are labelled as
     trials.
   - Collision zones (moving heads, beaters, bows, slides, the player's reach)
     block placement.
   - Readouts show distance from the stated reference surface and angle from
     the stated axis, both measured from the drawing's geometry.
   - The tendencies of the chosen position are written in words.
4. **Studio or live:** the same scene with a monitor wedge and PA. Place the
   monitor in the mic's real rejection zone (cardioid: behind; supercardioid:
   off the rear), and read spill and gain-before-feedback reasoning. Feedback
   is never provoked.
5. **Two microphones:** place a second mic, and the app computes, from the
   drawing, the **arrival-time difference** and the **comb-filter notches** it
   causes. This is real math from distance and the speed of sound, labelled
   "ideal model". There is a polarity switch with an honest note:
   *polarity flips the sign; it does not remove delay*. A 3:1 check is drawn
   in the scene.
6. **Troubleshoot:** the lesson's symptom table as tap-through scenarios.
7. **Practice:** the lesson's exercise plus a fillable observation sheet, kept
   on the device (and synced for members if wanted).
8. **Sources:** the lesson's evidence audit, the links, and what is still
   unknown.

**Shared tools:**
- a **stereo-array tool** (XY, ORTF 17 cm/110°, AB, M/S, Decca Tree), used by
  about 15 lessons;
- a **stage-plot builder** for ensembles;
- a **polar-pattern overlay** for any mic, drawn from the standard
  first-order equations and labelled ideal.

**What moves and why (motion that teaches):**
- The mic follows the finger on the UI thread (Gesture Handler).
- The pickup pattern rotates with the mic.
- Path lines from source to capsule show arrival order. They are labelled as
  an overlay, not as sound speed.
- In the two-mic page, the notch graph updates live as the mic moves, driven
  by the same geometry as the drawing.
- Players' motion arcs (stick, bow, slide) animate only as illustrated
  envelopes, labelled as such.

## 4. The drawing workload (the biggest cost)

There are about 85 distinct instruments and scenes. About 45 rate **hard** to
draw accurately: the full kit, timpani, marimba and vibraphone, harp, the
pianos, French horn, the saxophones, bassoon, sitar, veena, pedal steel,
accordion and pipe organ. Most lessons also need the player's posture and
reach. Labs 2–5 reuse a lot from Lab 1; Lab 5 reuses almost everything.

Every drawing follows the charter:
- the technical model first, then geometry from cited dimensions, then the
  look;
- side and top views from ONE model, so they always agree;
- each drawing is checked side by side against references before it ships.

## 5. Order of work (proposed)

1. **Engine + one flagship lesson end to end: Kick Drum (M01).** It is the
   best-sourced lesson, with a full app-presentation section. You review it
   on the Pixel before anything else is drawn.
2. Lab 1: snare, toms, overheads, then the hand drums and concert drums.
3. Lab 2, which reuses the kit context (cymbals and hi-hat first).
4. Lab 4: guitar and amp, piano, bass and voice-adjacent instruments first.
5. Lab 3 (brass, then saxes, then woodwinds).
6. Lab 5, which assembles from Labs 1–4 plus the array and stage-plot tools.
7. Labs 6 and 7 when your documents arrive. The engine already plans for
   field scenes, measurement setups, a parabolic dish, and broadcast sets.

Each lab gets:
- an audio-expert review;
- a learning (cognitive) review;
- a skeptical visual review against the charter;
- tests;
- Pixel frame-rate measurements;
- then hand-over. Nothing is published unless you ask.

**A native build is needed early** (Gesture Handler). The lab can't run on the
Pixel until a build with it is installed. Engine work can start in the web
preview.

## 6. Owner decisions (2026-10-04, in chat)

- **Audio:** FULLY SILENT, always. No sound anywhere in the Miking Labs.
  Computed visuals (arrival time, comb-filter notches, polar patterns) are
  drawings, not sound, and stay in.
- **Drawings:** vector drawings carry the teaching, with a real photo of each
  instrument alongside. Comp C makes the photos in **pencil.dev** from prompts
  Claude writes. The prompts must be complete enough that Comp C gets every
  image right the first time: exact specs, size and format, layout, design
  notes, and full context. Build on the cable-lab brief v2
  (`docs/art/APE_LAB_PHOTO_BRIEF_v2_2026_09_25.md`) and the reasons the
  2026-09-25 package was rejected. Images are touched only on the owner's go,
  folder by folder.
- **Trial numbers:** shown, clearly labelled as trial starting points, and
  drawn apart from sourced zones.
- **Source errors:** Claude fixes them in the app text and logs each one in
  `docs/labs/miking/CORRECTIONS_LOG.md` (what, why, source), so the owner can
  update the documents.
- **Membership:** members only, with the existing grayed live preview for
  non-members.
- **Missing lessons** (M10, M11, the speaker-cabinet/Leslie module, I04):
  the OWNER writes them, as with Labs 6–7. Claude builds them when they
  arrive.
- **Human check:** the OWNER reviews each lab's setups on a phone before it
  is published, after Claude's AI reviews (audio expert, learning, visual).
- **First step after go:** the engine plus Kick Drum (M01) end to end, then
  owner review, then the remaining 92.

## 7. Decided by Claude, with reasons (the owner can overrule)

- **3:1 is drawn one way:** the distance between mics is at least 3× each
  mic's distance to its own source (the DPA/Shure definition). The other
  wording is corrected and logged.
- **E04's ringing exercise and E07's "ring out"** are rewritten to the
  no-provocation standard the other lessons use.
- **Units** follow the app's unit setting. The source's own units stay in the
  citation.
- **Children (E06)** appear only in plan view: no detailed child figures.
- **Brand names** appear only in cited facts. Mics are drawn as generic types,
  never as a brand's likeness.
