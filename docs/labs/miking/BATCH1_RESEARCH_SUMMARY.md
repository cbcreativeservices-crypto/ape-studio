# Miking Labs, Lab 1 — Batch 1 research summary (after M01 Kick)

Date: 2026-10-04. Researcher: Claude (technical-reference pass; no app code, no sub-agents).
Model followed: `kick/SOURCES.md` + `kick/GEOMETRY_PROPOSAL.md` (owner-approved standard).
Owner ruling applied (`feedback_miking_suggestive_not_sourced`): the app will show only
"recommended starting points" with no citations; these docs stay exact and sourced.

New in this batch: every GEOMETRY_PROPOSAL gives a **drawing default, not a published figure** for
each UNKNOWN the picture needs (flagged `placeholder: true`), so the build is not blocked.
One shared frame: the KIT frame K = the kick frame (origin kick batter centre, +x audience, +y down,
+z drummer's right, floor y = 290.4), and one shared 5-piece plan in `kit/GEOMETRY_PROPOSAL.md`.
Off-kit instruments share the hand-drum frame H (`congas/GEOMETRY_PROPOSAL.md`).

## 1. Readiness per lesson

| # | Lesson (folder) | Readiness | Blocked on / owner decisions |
|---|---|---|---|
| 1 | M02 Snare (`snare/`) | **READY to build** | Every lesson number verified. Owner: snare height/tilt (default 640 mm, flat), stick envelope (illustrative sector), bottom-mic distance (default 30–80 mm). |
| 2 | M03 Toms (`toms/`) | **READY to build** | Owner: adopt the 5-piece plan (adds a 10-in tom and moves M01's 12-in tom from (140, −150) to (150, 40)); rack-tom heights 850 mm / 15°; rack rod count (6, Yamaha table unusable). |
| 3 | M09 Overheads incl. Glyn Johns (`overheads/`) | **READY to build** | All geometries computed (GJ main 1016 over the snare; side mic 152.4 above the floor-tom rim lands 92 mm beyond the floor tom at equal 1016 distance; Recorderman 812.8 from snare centre; ORTF 170 mm/110°; X/Y 90°; A/B 1219.2 from the snare). Owner: drummer head/shoulder defaults. |
| 4 | M10 Room (`room/`) | **READY to build** | Owner: the room (one studio room proposed: 6.50 × 5.40 × 3.00 m, sized so UA's "15 feet … in the corners" is literal). One claim Medium (Shure "poor room → close pickup" wording). |
| 5 | M11 Complete kit (`kit/`) | **READY to build** | Sizes all from catalogues; layout/heights illustrative. Owner: heights, ride 20 in (22 in not verified today), channel-plan builder + routing matrix in scope? |
| 6 | Speaker cabinet + Leslie (`speaker_leslie/`) | **Conventional cabinet READY; Leslie READY with owner choices** | Rotor speeds now sourced (Leslie 122H: horn 44/402 rpm, rise 1.8 s/fall 2.4 s; low 42/372 rpm, 7 s/5.5 s; crossover 800 Hz). Owner: draw the 122H; rotation directions UNKNOWN (default CCW); louver layout and rotor sizes are drawing defaults from Hammond's schematic; slowed animation allowed with true rpm shown? |
| 7 | M04a Congas | READY | Text fixes only. |
| 8 | M04b Bongos | READY (regions only; no source gives a number) | Posture default. |
| 9 | M04c Timbales | READY | Optional: add SOS Krys "three to three-and-a-half feet above". |
| 10 | M05 Djembe | READY | Duvel's 40–60° reference axis is UNKNOWN (default: from the head normal). |
| 11 | M06 Timpani | READY | Head height default; cite the Decca book, not ebrary. |
| 12 | M07a Concert bass drum | READY | Size default 36 × 16 in (Yamaha CB 636); 45° elevation default. |
| 13 | M07b Concert snare | READY | No concert-specific number exists (correct in the lesson). |
| 14 | M08 Headed tambourine | READY | Reference point for 15–30 cm (default: nearest frame point). |
| 15 | M12 Tonbak | **Buildable with defaults; blocked for sign-off** on a player's check of posture/head orientation | All positions are the lesson's own trials. |
| 16 | M13 Tabla | **Buildable with defaults; blocked for sign-off** on head diameters, supports and side convention (player check) | Met gives object extents only. |

## 2. Corrections needed in the lesson texts

Snare (M02)
- L31/L48 "Neither source supplies a universal bottom distance": its own ref [6] (SM57 guide) says
  "If desired, place a second mic just below rim of bottom head." Say "no source gives a distance".
- L22 Audix: the archived DP Elite 8 sheet says "2 inches above the rim"; the current i5 sheet says
  "about 2 inches above the head". Keep "about 2 in (5 cm)" and drop the surface, or note both.
- L25/L87 "about 4 in": Shure's words are "a good 4 inches away from the snare" (add ≈ 10 cm).
- L28/L38 e 904 "30–60 degrees": Sennheiser's figure measures it from the head normal; say so.
- L49/L88: quote Shure's whole sentence ("invariably out of phase … will usually produce a better
  result"); the concert-snare lesson quotes the other half. Both lessons then agree.
- L15 "2011 F": DPA's own 2020 article writes "2011 F (140dB SPL)"; no current "2011F" product page
  found (A/C/ER exist). Keep it as "a DPA condenser specified at 140 dB SPL in DPA's article".
- Ref [4] (Sennheiser e 904 PDF) is dead (404): replace with the online manual v1.3 04/2026 (same text).
  Ref [7] (Audix DP Elite 8 sheet) is dead (404): archived copy, or cite the i5 sheet.

Toms (M03)
- L27 DPA "…and level toward the center": DPA says "a low end, more boomy sound", not "level".
- L16 Audix D2 "for rack toms": Audix lists D2 for "Rack tom, floor tom congas".
- Ref [4] dead (as above).

Overheads (M09)
- L36 Recorderman: define the figure: "32 in (about 81 cm) from the centre of the snare to each mic".
- L45 Glyn Johns: Recording magazine says "directly over the snare drum, at a height of about 40"";
  MusicTech says "around 4 feet (122cm) above the kit". Say both are accounts.
- L117 "describes … as guaranteed": Shure says "ensures mono compatibility" / "avoiding any risk of
  comb-filtering". Use Shure's words.
- Ref [14] (B&H) unreachable (403): drop or replace; [12] and [13] carry every number used.
- Header: add a date and "Membranophones Lab • M09" like M10/M11.

Room (M10)
- Add that Shure's SM4 is a side-address cardioid (the lesson cannot draw its lobe otherwise).
- "3–6 ft (about 1–2 m)": Shure prints "(1–2 m)"; drop "about". Add ≈ 4.6 m to "15 ft".
- "M11 will cover complete kit channel plans" → present tense. Remove or teach the orphan
  "boundary-adjacent trial". Add the NIOSH figure (parity with M01–M03).

Complete kit (M11)
- "this report" → "this lesson". Add NIOSH figure. Clarify the Glyn Johns 3-mic form omits the snare.

Speaker/Leslie
- L40 "near-coincident XY" → "coincident X/Y" (M09/M10 usage; the module's L49 already says it).
- L55 "Hammond's Heritage manual" = ref [6] (Leslie Heritage Series 122H/142H manual): name it.
- L27 3300: the 3300 text says "Refer all servicing to qualified service personnel"; the "do not open"
  wording ("NE PAS OUVRIR") is in the 122H manual.
- L8 Mills says "duller" (not "mellower") at the edge; Shure's SM57 guide states the opposite
  direction (edge "higher frequency sound") — log it as a disagreement, keep the majority tendency.
- Add rotor speeds and ramp times (122H), the open-back rear mic (Mills, the module's own ref [4],
  with the polarity swap), the bass lesson's 10–45 cm cross-link, ≈ 7.6 cm for "3 in", a hearing
  figure, and a cross-link list (Guitar, Bass, Harmonica, Rhodes, Wurlitzer).

Hand and concert drums
- Congas: the Glyn Johns cross-link must point to M09; remove the stale "ride cymbal … deferred"
  note; 2 ft = 61 cm (not 60). Use the DPA host for the Jonas Brothers case.
- Djembe: Coppinger's bottom mic is "8 inches (20cm) from the bottom rim" (say "bottom").
- Timpani and concert bass drum: cite *Classical Recording: A Practical Guide in the Decca
  Tradition* itself, not the ebrary.net mirror. Timpani ref [9] (Neumann newsroom) is dead (404).
- Concert snare: "about 10 cm (4 in)" → Shure's "a good 4 inches"; the audit's "invariably" is right.
- Headed tambourine: remove "last named instrument"; Yamaha's 8 in is "have the player stand about
  eight inches from the mic" (player-to-mic); all three Shure booklets carry the 6–12 in row.
- Tonbak and Tabla: add a hearing figure and an app-presentation section (survey items).
- All batch lessons: strip institutional words (house rule): "Pro Audio Training Academy",
  "Student …", "classroom".

## 3. Shared drawing assets (build once, reuse)

1. **Drum shell family** (one parametric component): shell cylinder (Ø, depth, wall), heads (batter,
   resonant; optional port), hoops (height, gauge), tension rods (count, phase), lugs, plus variants:
   kick (spurs, pedal — M01), snare (wires, strainer/butt, stand), rack tom (mount arm), floor tom
   (legs), timbales (single head, stand, bell bracket), concert snare, concert bass drum (tilting
   stand, casters, pivot), timpani (kettle, suspension ring, pedal).
2. **Hand-drum family**: goblet profile (conga, djembe, tonbak — parametric head/waist/foot), bongo
   pair with centre block, tabla pair (dayan cylinder + bayan kettle, syahi, support rings), headed
   tambourine (frame, double-row jingles).
3. **Cymbal family**: disc + bell profile (Ø 14/16/18/20 in), hi-hat pair with open gap, swing and
   air-burst envelopes; **stands**: straight, boom with counterweight, hi-hat stand + pedal, snare
   stand, short kick stand, rim clamp (e 904 MZH 604 type), gooseneck rim mount (DM20 RM1 type), drum
   clip, stereo bar (X/Y, ORTF), tripod floor stand.
4. **Mic family** (sourced outlines): SM57 type (157 / Ø32 / Ø23), i5 (141.5 / Ø37.5 / Ø23), e 904
   (Ø41 × 63), D2/D4 (100 / Ø39 / Ø21.5), DM20 (282.44 × Ø22 + gooseneck 120.65 × Ø9.53), Beta 52A,
   e 902, D112, DPA 4055, Beta 91A boundary (M01), SM4 side-address (product data 118.008 × 80.01 ×
   254.991), pencil SDC (length 104 from Audix SCX1; Ø drawing default), figure-8 (= LDC outline),
   Beta 56A (outline UNKNOWN → drawing default). Each with mic.ref and axis, first-order polar lobe
   from `SOURCES_SHARED.md` §3.
5. **Kit plan** (`kitPlanModel.ts` extended to the 5-piece + 4 cymbals) and **drummer envelope**
   (throne, body capsule, head, shoulder, stick sectors) — all ILLUSTRATIVE.
6. **Room box** (walls, ceiling, door, route) and **live stage** (wedges, PA) for M10/M11.
7. **Speaker family**: 12-in speaker front view (Celestion V30 sizes; dust cap drawing default),
   cabinets 1×12 (MX112), 4×12 (1960A), 4×10 + horn (SVT-410HLF), open-back flag; **Leslie**
   exterior (122H box 742 × 524 × 1043) + labelled schematic interior + rotor motion model.
8. **Shared readouts**: grille-front distance/height, aim angle from the head normal, rear-null angle
   to a named spill source, path difference → Δt (calculator speed of sound), snare-distance aid,
   mono/polarity panel (polarity drawn apart from delay), channel/stand/input counter, routing matrix.

## 4. Sources that could not be reached today

Sennheiser e 904 PDF (404, archived copy read), Audix DP Elite 8 sheet (404, archived copy read),
B&H Explora Glyn Johns guide (403), Fender '65 Deluxe Reverb page (403), Neumann MCM newsroom (404),
Met web pages (429; the Met Collection API was used instead), NIOSH (403 to curl today; read in the
kick pass). No fact in the geometry depends on an unreachable page.

## Rulings by the lead (2026-10-05), under the owner's starting-points ruling

- Adopt the 5-piece kit plan for every drum lesson. M01's kit plan moves its rack tom to match.
- Draw the Leslie as a 122. Rotation direction: a drawing default only, never taught as a fact.
- Room size and drum heights: use the "drawing default" values from the geometry files.
- Tonbak and tabla: build with the defaults. The OWNER checks posture and supports on the phone.
