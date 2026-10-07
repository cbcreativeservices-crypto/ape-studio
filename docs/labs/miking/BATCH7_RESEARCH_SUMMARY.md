# Miking Labs, Lab 7 Sports & Broadcast (part 1: broadcast speech) — Batch 7a research summary (B01–B08, 8 lessons)

Date: 2026-10-07. Researcher: Claude (preparation pass only; owner: "prepare, but do not start the build"). No app
code changed. Model: `BATCH5_RESEARCH_SUMMARY.md`, `lead_vocal/`. Source texts: `source_text/B01-…B08-….txt`
(extracted from the owner's .docx; the .docx files are untouched).

Folders (SOURCES.md + GEOMETRY_PROPOSAL.md each): `radio_host/ (B01) news_anchor/ (B02) field_reporter/ (B03)
boom_camera/ (B04) lavalier_headset/ (B05) panels_press/ (B06) voiceover_guests/ (B07) audience_ambience/ (B08)`.
**Register**: Lab 7a source keys → `radio_host/SOURCES.md` §0 (Lab 5 keys reused from `lead_vocal/SOURCES.md` §0).

What the documents are like: careful and honest, already written as "starting points, not rules", every lesson
has an exercise, a pass criterion, an observation sheet and an evidence audit; every one says no audio. Unlike Lab 5,
they give **few placement numbers** (they deliberately refuse universal distances) and **no reference URLs**. Most
geometry is therefore DERIVED (frame edge, head turn, inverse square, image-source reflections) rather than sourced.

New sourced numbers found today: SM7B 1–6 in; RØDE dynamic 4–6 in / condenser 6–8 in and multi-person "less than six
inches", mics facing away from each other; RØDE sternum + upside-down clip + broadcast loop; RØDE boom "from above,
or below if absolutely necessary … never from the sides"; RØDE Reporter "around chest height between the
interviewer and the person being interviewed"; Sennheiser ME 2 "25 cm (10")"; ME 3 "2-3 cm (1")"; Shure pastor lav
"5 to 8 inches (12 to 20 cm) below"; Shure church lectern "10"-14" and a little off-center", omni lav "8" below the
mouth in the center", "Don't mic the congregation for sound reinforcement"; Shure podium "7-10 inches", mute one of
two mics; Shure congregation mics "above and somewhat in front … aimed at the faces … away from the main PA";
Shure shotgun "slightly above, below, or to the side", ~30° side rejection; Countryman caps +4/+8 dB at 15 kHz;
PSC Press Train +4 dBm balanced line in → 12 transformer-isolated mic-level outs; NWS lightning "at least 30 minutes
after you hear the last thunder"; four-capsule A→B Ambisonics; 5.1 surround head (3 front, 2 rear).

## 1. Readiness per lesson

| Pri | Lesson | Readiness | Blocked on / owner decisions |
|---|---|---|---|
| 1 | B01 Radio/podcast hosts (defines seated talker + desk + desk-reflection) | **READY with defaults** | All four distances CONFIRMED; seated/desk dimensions drawing defaults; L38 wording fix |
| 2 | B05 Lavalier/headset/concealed (defines body-worn family) | **READY with defaults** | ME 3 and lav numbers CONFIRMED (D-LAV1 union zone); B05-1 re-cite; garment drawing default |
| 3 | B04 Boom and camera (defines camera-frame tool, boom, shotgun) | **needs owner input** (O-SG) | No sourced pattern for an interference tube: approve the "simplified" hypercardioid drawing + words; lens presets |
| 4 | B06 Panels/press (defines lectern, open-mic panel, ROUTING panel) | READY after **B06-1** | Lectern figure WRONG in the doc (corrected to 10–14 in, off-centre); table defaults |
| 5 | B02 News anchors/seated interviews | **READY with defaults** (assembles B01+B04+B05) | Depends on the three families; ME 2 25 cm CONFIRMED |
| 6 | B07 Voiceover/guests | **READY** (Lab 5 voice rows reused) | All four distances CONFIRMED (two from Lab 5) |
| 7 | B03 Field reporters (defines handheld interview + wind kit) | **READY with defaults** | Reporter chest-height CONFIRMED; lightning rule CONFIRMED (exact); talker spacing default |
| 8 | B08 Audience/event space (defines venue plan) | **READY with defaults** | Congregation geometry CONFIRMED (no numbers); venue presets drawing defaults; immersive depth (O-IMM) |

## 2. Corrections found in the owner's documents (6 items; log each in CORRECTIONS_LOG.md when built)

1. **B06-1 (WRONG)** L27: "Shure describes a centered position around eight inches below the mouth for one lectern
   use" — Shure's church article gives the LECTERN as 10–14 in, a little off-centre; the 8 in centred figure is its
   omni LAVALIER. Shure's podium article sets gain at 7–10 in. Text proposed in `panels_press/SOURCES.md`.
2. **B05-1 (mis-cited)** L23: "Shure gives 5–8 in (12–20 cm) below the mouth" is cited [1, 5, 7]; the number is in
   "How to Choose the Best Mic for the Pastor" (B06's [9]); [7] has no number. Re-cite.
3. **B01-1 (wording)** L38: "open channels one at a time … check for feedback" → the no-provocation wording used in
   every other lesson (bring up only to working level; any ring → lower at once, fix the geometry).
4. **B-INST (all 8)**: "Pro Audio Training Academy" headers; "the student" in every pass criterion; "Student
   placement/observation sheet" → "you", "Placement sheet".
5. **B-REF (all 8)**: references are titles only, no URLs; URLs found today are in `radio_host/SOURCES.md` §0 (24
   keys). Owner to add them to the documents.
6. **B-XLINK**: cross-links to lessons not yet built (F13, "later sports sound pickup" = B09–B17) → in-app links only
   once those lessons exist (Lab 5 rule).

Recorded, not corrections: D-HOST1 (two RØDE ranges), D-LAV1 (25 cm vs 5–8 in vs 8 in), D-HS1, D-VO1, **D-SG1**
(a Shure page says a shotgun works at "four to five times" an omni's distance — contradicts the lessons' correct "a
shotgun does not zoom"; never shown). The documents' own audits are accurate (e.g. B03 rightly rejects the
"impervious to wind" marketing line; B01/B06 rightly call 3:1 a heuristic — the app shows 3:1 as a note, never a
pass gate, consistent with Lab 5 §0.2).

## 3. Shared families and tools to build once (`src/screens/lab/miking/lessons/shared/broadcast/`)

1. **Seated talker + desk (frame B)** — `radio_host` §1: seated pose on the voice head (frame V), chair/desk, and the
   **HEAD-TURN control** (yaw/pitch) with r and off-axis readouts. Used by B01, B02, B06, B07 (and B05 seated).
2. **Desk/stand reflection** — image source in a plane → Δt and first notch via `engine/physics/twoMic.ts`. B01, B02,
   B06, B07.
3. **Broadcast mics + mounts** — `broadcastMics.ts`: end-address broadcast dynamic, boom arm, gooseneck, reporter omni
   with flag, short shotgun, compact hyper, camera mic; reuse `vocLdc`, `vocDynCard`, `vocHeadset`, `boundaryHalf`,
   `sdcCard`, `arrCard`, `miniOmni`.
4. **Body-worn family** — `bodyWorn.ts`: mount points (sternum, lapel, collar, tie, neckline, concealed, headset),
   garment layer, clip, broadcast loop + secondary loop, transmitter pack. B02, B05, B06, B07 (later B10/B11).
5. **Camera-frame tool** — `cameraFrame.ts`: generic camera, angle-of-view wedge (side + plan) as a collision
   keep-out, close/wide presets; boom pole + operator (`boomPole.ts`). B02, B03, B04 (later B10–B13).
6. **Handoff path** (two standing talkers, inverse-square level difference) — B03 (later B10).
7. **Wind kit** — grille / foam / fur / basket+fur, wind arrow, words only. B03, B04, B08. **Coordinate with the Lab 6
   builder** (F06–F09 need the same): whoever builds first owns it; the other imports.
8. **Open-mic panel + bleed matrix + ROUTING panel** — NOM (reuse Lab 5 gain-margin), mute decisions, and a
   destinations diagram (PA, monitor, program/stream, recorder, IFB, talkback, press feed, mix-minus return). B01–B08.
9. **Venue/audience plan** — on frame S + seating tokens, PA wedges, exits; reuse `stereoArray.ts`; new surround (5)
   and Ambisonics (4) tokens. B08, B06 (later B13–B17).

Reused unchanged: frame V head and voice rows (`voiceStarts.ts`), frame S, stereo-array tool, twoMic/polar physics,
Lab 5 gain-margin panel, players/ figure. No measurement-mic need in B01–B08.

## 4. Builder grouping (3 groups)

1. **G1 — Desk & studio voice** (first; builds the core): B01 radio host (seated talker, desk, head turn, desk
   reflection, broadcast mics, ROUTING + open-mic panels), B07 voiceover/guests, B06 panels/press (lectern,
   gooseneck, bleed matrix). Branch `lab7-g1`.
2. **G2 — Body-worn & camera** (after G1 merges): B05 lavalier/headset (body-worn family), B04 boom/camera (camera
   frame, boom, shotgun; needs O-SG), B02 news anchor (assembles both + the desk). Branch `lab7-g2`.
3. **G3 — Field & audience** (after G1 merges; parallel with G2): B03 field reporter (handheld, handoff path, wind
   kit, camera token stubbed from G2's agreed path `shared/broadcast/cameraFrame.ts`), B08 audience/event space
   (venue plan, arrays, immersive tokens). Branch `lab7-g3`. Two lessons: B08 is the largest scene in the batch.

## 5. Owner decisions needed

1. **O-SG** shotgun pattern: no first-order equation fits an interference tube; draw a hypercardioid-like lobe called
   "a simplified picture" and say in words that the real pattern narrows and changes with pitch? (blocks B04)
2. **Drawing defaults** for the seated talker, desk, table, lectern, camera lens presets and venue presets (none are
   sourced) — approve as defaults.
3. **3:1 at a desk/table**: show as a note only, never graded (the lessons say it is not a guarantee) — confirm.
4. **Lectern** (O-LEC): show only 10–14 in off-centre, or also the 7–10 in gain-setting range?
5. **Body-worn on a person**: clothing mounts only, consent/adhesive/phantom safety in plain words; omit hairline/wig
   placement — confirm.
6. **Routing depth**: the plan calls routing "supporting"; proposed one ROUTING panel step in STARTING SETUPS ("what
   else the mic feeds") + the press-feed check in B06 — confirm.
7. **Immersive** (O-IMM, B08): tokens + channel map only, no decode — confirm.
8. **Brand list**: add RØDE/Rode, Rycote, Countryman, Professional Sound/PSC, Sound Devices, MixPre, SM ?7B, ME ?2,
   ME ?3, MD ?46, RE ?50, invisiLav, Press Train, Press Bridge, AMBEO, DCA ?901, SCM ?410, BLX4R, MV7, PodMic, National
   Weather Service to `BRAND_NAMES` (the lightning rule stays, unattributed). "Hammond" stays allowed (Leslie lesson).
9. **Lab 7 tile**: blurb and family line written when the first B-lesson goes ready (registry `broadcast`); part 2
   (B09–B17, sports) will be prepared separately — B13–B17 are much larger documents.

## 6. Sources not reachable / not re-read
RØDE help centre (403; bleed figure read as a search extract); RØDE Reporter page (manual read instead); many
qualitative Shure/DPA/RØDE/Rycote/Sound Devices/SCHOEPS pages (list in `radio_host/SOURCES.md` §0 "not re-read") —
none drives a CONFIRMED geometry value. Several maker figures were read as search extracts of the maker's text
(Medium); before shipping, the builder may re-open SN-ME2, SN-ME3, S-PASTOR, S-PODIUM and S-TOP6 to confirm wording.
