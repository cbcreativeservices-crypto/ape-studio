# Miking Labs: CORRECTIONS LOG

Owner decision (MIKING_LABS_PLAN_2026_10_04.md §6): Claude fixes source errors in the APP
text and logs each one here (what, why, source) so the owner can update the documents.
Nothing in `docs/labs/miking/source_text/` is edited; those files stay as the owner wrote
them.

Columns: **id** · lesson + line in the source .txt · what the lesson says · what the app says
instead · why · source for the fix · status.

Status: **APPLIED** = the app text already carries the fix (file named) · **OWNER** = needs
the owner's decision or an edit outside this branch.

---

## M01 Kick Drum (`source_text/Kick-Drum-Miking-Technique-Research.txt`)

### From the engine rulings (ENGINE_BLUEPRINT.md §16.14)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| K-01 | L27 | Beta 52A "20 to 30 cm from that head if the drum and mic physically allow it" | "20 to 30 cm (8 to 12 in) from the beater head, **on-axis with the beater**" — the "if the drum and mic physically allow it" caveat is kept as the lab's own safety note, not quoted as Shure's | The guide's row includes "on-axis with beater"; the lesson dropped it, and the zone's geometry depends on it (on the beater line, unlike the 5–7.5 cm row). | S-B52-UG p.3: "20 to 30 cm (8 to 12 in.) from beater head, on-axis with beater." | APPLIED (`lessons/m01Kick/model.ts` zone `b52.far`, `lesson.ts`) |
| K-02 | L29-30 | Row "At the resonant-head or port area": "The e 902 manual describes a more resonant result there" | "At the level of the resonant head" — no "port" | The manual's Position B is "at the level of the resonant head"; it never mentions a port. | SN-902-2019 p.4 (archived), SN-902-DOC (04/2026) | APPLIED (`lesson.ts`, zone `e902.reso`) |
| K-03 | L50 | "Sennheiser specifically recommends turning its e 902 away from the beater strike when less attack is wanted" | Kept as a **labelled trial experiment** ("an aiming experiment to try, checked on the real drum"); it is NOT attributed to Sennheiser's current manual. The 2019 archived PDF is listed in the sources with a note that the current manual dropped the sentence. | The sentence is in the 2019 PDF only; the live manual (v1.3, 04/2026) does not have it, and the lesson's link [3] is dead (404). | SN-902-2019 (Internet Archive 2024-05-30), SN-902-DOC | APPLIED (`lesson.ts` page 3 + page 8) |
| K-04 | L101 / ref [3] | Reference [3] URL `…40681-en-e902_manual_01_2019_en.pdf` | Sources page lists the archived copy and the current online manual | The lesson URL returns 404. | kick/SOURCES.md §f | APPLIED (`lesson.ts` sources) · OWNER: replace the link in the document |
| K-05 | L106 / ref [7] | AKG D112 MkII product page | Facts taken from the AKG cutsheet (same specs) | The product page returns 403 from this machine (bot protection). | AKG-CUT | APPLIED · OWNER: open akg.com/D112MkII.html in a browser to confirm it still resolves |

### From the lesson survey (survey/lab1.md, M01 quality flags) and the kick sources pass

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| K-06 | L15 | Beta 52A "has a modified supercardioid pattern" | The pattern field reads **"supercardioid"** (Shure's spec field). "Modified supercardioid" is quoted on the Sources page as Shure's description. The drawn lobe is the IDEAL supercardioid, captioned "ideal model". | Ruling §16.13 D1. Shure uses both words; the spec field is the formal one. | S-B52-UG p.1, p.3, p.5; S-B52-WEB | APPLIED (`data/micTypes.ts`, `lesson.ts`) |
| K-07 | L68 | "a supercardioid has a rear pickup lobe and maximum rejection off the rear axis" (no angle) | Generic supercardioid null "≈ 125° (ideal)"; wherever the Beta 52A is named, the guide's own "120° toward the rear" | Ruling §16.13 D2. Three Shure numbers exist (120°, 125°, 126°); the ideal equation gives 125.26°. | S-B52-UG p.4; S-LIVE p.9; SOURCES_SHARED.md §3 | APPLIED (`physics/polar.ts`, `lesson.ts`) |
| K-08 | L17, L35-36 | Beta 91A: pattern not stated | "Half-cardioid (cardioid in the hemisphere above the mounting surface); keep sound sources within a 60° range above this surface" — and the app draws **no** lobe for it (a half-cardioid is not a first-order free-field pattern; the engine's `unstated`/no-lobe path is used) | The lesson omits the pattern; the survey flagged it; Shure states it. Drawing a full cardioid for a boundary mic would be wrong. | S-B91-UG p.3, p.4, p.6 | APPLIED (`data/micTypes.ts`) |
| K-09 | L23-24 | Row heading "Inside near the batter head" | "Near the batter head (the guide's 5–7.5 cm row)" with the guide's words "slightly off-center from beater" | The Shure guide never says "inside"; "inside" is the lesson's framing. On a ported or intact drum the position is inside the shell only because 5–7.5 cm from the batter head is inside the shell — the app shows that from the geometry instead of asserting it. | kick/SOURCES.md §e (L24) | APPLIED (`lesson.ts`) |
| K-10 | whole lesson | Units mixed (cm in L24/L27, mm in L17/L36) | Dual units everywhere, the source's own unit first: "5 to 7.5 cm (2 to 3 in)", "25 to 152 mm (1 to 6 in)" | Survey flag "Units are mixed"; ruling §16.5. | S-B52-UG p.3 and S-B91-UG p.4 print both units | APPLIED (`engine/model/units.ts`, `lesson.ts`) |
| K-11 | L16 | "DPA recommends its flatter-response condenser approach" (no model) | The cited example is named as provenance only: DPA 4055 ("Open Cardioid", P48), from the article the lesson cites | The lesson leaves the model unnamed; the cited DPA article names it. No brand is drawn. | DPA-KICK; DPA-4055 | APPLIED (`data/micTypes.ts` examples) |
| K-12 | L93 | "DPA's categorical assertion that dynamic mics cannot capture the true natural sound…" | Kept, attributed to DPA as a manufacturer judgement, never taught as fact (as the lesson itself says) | — (no change; recorded so the wording is not "fixed" later by mistake) | DPA-KICK | APPLIED (no change) |
| K-13 | whole lesson | No "no audio examples" statement (the only Lab 1 lesson without one) | The lab is fully silent (owner ruling); the accuracy note says so | Owner decision 2026-10-04 "FULLY SILENT". | plan §6 | APPLIED (`lesson.ts` accuracyDetail) |
| K-14 | L89 | Final task only; no observation sheet | Page 7 adds an OPTIONAL observation sheet (drum, front head, mic type, pattern, zone, distance, aim, notes), kept on the device; it never gates credit | Survey flag "Part 8 is weak". This is an addition, not a correction of a fact. | survey/lab1.md | APPLIED (`pages/PPractice.tsx`) |
| K-15 | L30 / L35 table | e 902 Position A "a few centimeters from the batter head" and Position C "in the middle between the batter head and the resonant head" are not in the lesson's table | Not added as zones in v1; Position B (resonant head) is. A and C are named in words on page 3. | The lesson's table carries only the resonant-head row from the e 902 manual; adding A/C as zones would extend the lesson beyond its own text. | SN-902-2019 p.4 | APPLIED 2026-10-04 (the words were missing until the review fix, audio m7; now in `PPlacement.tsx` for the cardioid kick dynamic) · CLOSED: e 902 positions A and C: not added, owner 2026-10-04 |

### From the audio-expert and cognitive reviews (2026-10-04, `kick/REVIEW_AUDIO_EXPERT.md`, `kick/REVIEW_COGNITIVE.md`)

Content where the app now departs from, or adds to, the owner's lesson text. Learner-facing
versions of these lines are on the Sources page ("Where this lab differs from the original
lesson, and why"); the ids stay here and in code only (review M6: no codes on screen).

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| K-16 | L7 | "The resonant head, air cavity, shell, tuning, and any internal damping influence the result." | Page 1 and its takeaway: "Both heads, the air inside and the shell resonate together; the front head and the port are where much of that resonance leaves the drum." The shell region no longer says the shell is "tuned": "The shell, the heads' tuning and any damping shape how long the drum rings." | A kick's low note is a coupled system including the batter head; shells are not tuned, heads are (audio review m1, m2). | Acoustics of coupled two-head drums (standard texts); review m1/m2 | APPLIED (`lesson.ts`, `geometry.ts`, `PInstrument.tsx`) |
| K-17 | L27, L39; S-LIVE Position D | Positions are given as distances; "height, distance and angle are separate variables" | A zone whose source row names an orientation (the Beta 52A guide's "on-axis with beater") counts only while the mic's front axis is within **±30°** of the head it is measured from. The lab applies the same test to the 5–7.5 cm row, Shure's live-guide Position D and DPA's "just outside, on the edge" position, where the source implies but does not state the aim. The ±30° is the lab's tolerance, ILLUSTRATIVE, disclosed on the zone card. | A mic pointed at the floor 6 cm from the batter head was "in the Beta 52A zone" (audio review M6). | S-B52-UG p.3 | APPLIED (`model.ts` `aim`, `zones.ts`) · OWNER: approve ±30°, and its use on the three rows that only imply the aim |
| K-18 | L42-L49 with L12-L13 | Seven-step procedure; the power rule (mute outputs, lower monitoring, then phantom) sits in the safety section | The Practice page orders seven steps and places the power rule inside step 4: "Mute the outputs and lower monitoring; then switch phantom if it is needed", before "Set input gain on typical AND strongest strokes, with headroom". | Practice grades "correct power and level checks" (L89), so the procedure is practised as a sequence (reviews C2/M1). | L12, L13, L45 | APPLIED (`lesson.ts` `orderTasks`) |
| K-19 | L55-L69, L96 | "A studio/live switch changes the scenario questions…"; "aim nulls according to the actual pattern" | Page 4: the monitors stay at ILLUSTRATIVE stage positions — a floor wedge for another player downstage of the drums (facing upstage), and the drummer's own fill beside the throne. The learner aims the MIC (left–right ±45°, up–down ±30°) and picks an ideal pattern. The mic is outside the front head (DPA's "just outside"). The drummer's fill is shown as the case no null reaches; the readout says "SHIELDED · drum in path" when the shell or a head lies between mic and monitor. STUDIO shows a decision card. | Moving the wedge round a fixed mic taught the opposite of the real move, and put the "correct" wedge where none goes (audio M2, cognitive M7). | L68; S-LIVE | APPLIED (`PContext.tsx`, `lesson.ts` `live.wedges`) · OWNER: approve both monitor positions |
| K-20 | L68 | "a supercardioid has a rear pickup lobe and maximum rejection off the rear axis" | Added: an ideal null is infinitely deep only on paper; real nulls are shallower and shallowest at low frequencies. Below −25 dB the app prints "deep null (ideal)", never a number. | "−52.4 dB" taught that a null removes the monitor (audio M3, cognitive M8). | Polar-pattern physics (SOURCES_SHARED §3) | APPLIED (`units.ts` `fmtIdealPickup`, pages 2 and 4) |
| K-21 | L10, L15 | NIOSH guidance; "maximum usable source level where specified" | Added under the mic cards: max-SPL figures are the MIC's distortion limits under each maker's own test conditions (1 % THD for the Beta 52A figure, 0.5 % for the D112 MkII), so they do not compare one-to-one, and none is a listening level. The D112 row now carries its "0.5 % THD" condition. | Kick mics rated near 160–174 dB with no hearing statement invite "max SPL as hearing limit" (audio C1, m4). | S-B52-UG; AKG-CUT; NIOSH | APPLIED (`PMicrophone.tsx`, `micTypes.ts`) |
| K-22 | L72 | Polarity vs delay; 3:1 limits | Added on page 5: notch POSITIONS follow from Δt; notch DEPTHS depend on the two levels, which the model takes from distance alone (1/r) — that does not hold a few centimetres from a 56 cm head, so depths are illustrative only. The page shows no 3:1 readout (both mics hear ONE source). | The near-field disclosure was promised in SOURCES_SHARED and missing (audio M9); a "3:1 · 0.8 : 1" cell invited "fixing" the pair (audio M7, cognitive M11). | SOURCES_SHARED §4; L72 | APPLIED (`PTwoMic.tsx`, `levels.ts` `threeToOneReading`) |
| K-23 | L72 | "Polarity inversion reverses the signal's sign." | Added: an ideal supercardioid's rear lobe is polarity-inverted, so a source in a mic's rear lobe puts the comb on the inverted notch set even with the switch at "+". | The comb used the switch alone and contradicted page 2's "inverted lobe" (audio M8). | Polar-pattern physics | APPLIED (`twoMic.ts` `effectivePolarity`, `CombPanel.tsx`, `PTwoMic.tsx`) |
| K-24 | L89 | "choose a one-microphone setup … describe an alternative … justify a second channel … more than one acceptable tonal solution" | Practice: two briefs (ported, loud club, attack, phantom available; intact head, studio, NO phantom), each with five setups of which two or three pass, and six reasons (three required, one optional, two wrong: brand, bass). The check grades the reasoning, never one fixed position. Plus the second-channel card and a three-card mixed review. | The final task had become three single-answer items where only the Beta 52A row could pass (cognitive C1, M12). | L89 | APPLIED (`lesson.ts` `setupTasks`, `setupGrade.ts`, `PReadPages.tsx`) |
| K-25 | L16 | "A suitable high-SPL condenser" | The condenser type is labelled "High-SPL condenser (kick)" (was "Small-capsule condenser"). | The cited DPA 4055 is a 57 mm-body kick condenser; the lesson's own words fit (audio m17). | DPA-4055 | APPLIED (`micTypes.ts`) |
| K-26 | L40 | "proximity effect can also change low frequencies as the mic approaches a radiating surface" | Added hedge: how much depends on the source's size and the mic; close to a large head it is usually less than a point-source chart suggests. The Beta 52A near row's "maximum bass" is explained as proximity effect, not a rule that inward means more bass (refutation item k.place.3). | Proximity effect follows wavefront curvature (audio m3); the "inward = more bass" misconception was invited and never resolved (cognitive M9). | Standard texts; S-B52-UG | APPLIED (`PPlacement.tsx`, `model.ts`, `lesson.ts`) |
| K-27 | (drawing) | Yamaha RBB-2218 "No. of Tuning Bolts 10" (per head or per drum not stated) | 10 tension rods per head: owner-confirmed 2026-10-04. The kick's label reads "10 RODS PER HEAD" (was "· TO CONFIRM"). | The owner confirmed the count. | YMH-RC; owner ruling 2026-10-04 | APPLIED (`art.tsx`, `model.ts`, `lesson.ts` unknowns, `kick/SOURCES.md`) |
| K-28 | (drawing) | Pillow size UNKNOWN (placeholder 300 × 360 × 100 mm, ILLUSTRATIVE) | A standard kick pillow: DW's 18 in pillow, 459.7 × 401.3 × 121.9 mm (18.1 × 15.8 × 4.8 in, from the retailer listing; DW's page gives no size), resting on the shell bottom against the batter head and drawn pressed between the heads (its 18.1 in exceeds the 18 in inside depth). Label: "DW 18 in; size from a retailer listing". | Owner ruling 2026-10-04: "use a standard kick pillow". It sets the boundary mic's height, so review finding m16 can now be computed. | DW-PILLOW (maker + retailer); KICKPRO cross-check | APPLIED (`model.ts` `pillowLen/H/HalfW`, `PILLOW_X1`; `geometry.ts`; `lesson.ts` sources, unknowns, accuracy note) |

## M02 Snare Drum (`source_text/Snare-Drum-Miking-Technique-Research.txt`)

From the snare sources pass (`snare/SOURCES.md` §e, BATCH1_RESEARCH_SUMMARY.md §2) and the build.
Learner text names no maker or model (owner ruling 2026-10-04); the source stays in code.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| S-01 | L31, L48 | "Neither source supplies a universal bottom distance" | Bottom zones: "Start just below the bottom rim — about 3–8 cm (1–3 in) below the snare-side head". The position is the guide's; the 3–8 cm is the lab's drawing, disclosed in the unknowns. | The lesson's own ref [6] gives a bottom POSITION ("just below rim of bottom head"), not a number. | S-SM57-UG p.3 | APPLIED (`lessons/m02Snare/model.ts` zones `bottom`, `bottom.clip`) · OWNER: approve 3–8 cm |
| S-02 | L22 | Audix i5 "about 2 in. above the rim, aimed toward the center" | Not given its own zone: it sits inside the 2.5–7.5 cm "over the rim, close" starting point. | The archived DP Elite 8 sheet says "above the rim", the current i5 sheet "above the head" (D-S1). | AX-DPE8 (archived); AX-I5 | APPLIED (no separate zone) · OWNER: keep folded, or add a head-referenced row |
| S-03 | L25, L87 | Shure "about 4 in. away" | "Start about 10–15 cm (4–6 in) above the rim, over the edge, angled toward the centre." | Shure's words are "a good 4 inches away from the snare" (at least about 10 cm), from "the snare", not a named surface; the lab reads it from the rim and draws 10–15 cm. | S-SM57-ART; S-REC1 | APPLIED (`model.ts` zone `top.far`) · OWNER: approve the 15 cm upper edge |
| S-04 | L28, L38 | e 904 angle "30–60 degrees" (no reference axis) | "angled 30–60° from straight down" — measured from the head's straight-on line; the zone checks it. | Sennheiser's p.4 figure draws the arc between the head normal and the mic axis. | SN-904-2019 p.4; SN-904-DOC | APPLIED (`model.ts` zone `top.clip` `aim`) |
| S-05 | L49, L88 | Shure: inversion "usually" helps; Sennheiser: the lower mic "must" be phase-reversed | Top and bottom "usually start out of step" because they face opposite heads; flipping one is a check made at matched levels in mono, not a law; polarity never removes a delay. | Shure's whole sentence is "invariably out of phase … will usually produce a better result"; the concert-snare lesson quotes the other half. Teaching the reason (opposite heads) makes both makers' wording agree. | S-SM57-ART; SN-904-2019 p.4; S-REC | APPLIED (`lesson.ts` `sn.two.*`, `copy.ts` twoMic, `physics/twoMic.ts` `oppositeSign`) |
| S-06 | L15 | DPA "2011 F … 140 dB SPL" | No model named; the condenser card reads by properties (a rated maximum level, phantom power, a rim mount). | No current "2011F" product page; brands are off the learner's screen. | DPA-KIT | APPLIED (`data/micTypes.ts`) |
| S-07 | refs [4], [7] | Sennheiser e 904 PDF; Audix DP Elite 8 sheet | — | Both URLs return 404. Current e 904 manual v1.3 04/2026 has the same text; the DP Elite 8 sheet survives only archived. | snare/SOURCES.md | OWNER: replace the two links in the document |
| S-08 | — (geometry) | Snare proposal: strainer at the drummer's left (270°) | The strainer is drawn on the player's side (180°), so the side cut-away shows the wires full length. | No source gives the side; both are drawing defaults. | snare/GEOMETRY_PROPOSAL.md §9.3 | APPLIED (`shared/drums/drumSpec.ts` `strainerDeg`) · OWNER: approve |
| S-09 | L7 | The wires sit under the drum and add buzz | Added (silent, drawn): as the snare-side head swings away, the wires lose contact and slap back against it; released wires hang clear and the buzz stops. | The lesson names the wires but not how they buzz; the sound page shows it. | Standard drum acoustics; DPA-KIT ("tightly strung across the resonator head") | APPLIED (`lesson.ts` sound stages, `shared/drums/UprightSound.tsx`) |

## M03 Rack and Floor Toms (`source_text/Rack-and-Floor-Tom-Miking-Technique-Research.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| T-01 | L27 | DPA: "more low-frequency body and level toward the center" | "Toward the centre tends to bring more low end" — no "level". | DPA says "a low end, more boomy sound", not more level. | DPA-TOMS | APPLIED (`lessons/m03Toms/lesson.ts`, `model.ts`, `copy.ts`) |
| T-02 | L16 | Audix D2 "for rack toms", D4 "for larger rack or floor toms" | No model named; the small cardioid dynamic's card reads by properties for rack and floor toms. | Audix lists the D2 for "Rack tom, floor tom congas". | AX-D2 | APPLIED (`data/micTypes.ts`) |
| T-03 | ref [4] | Sennheiser e 904 PDF | — | 404 (as S-07). | toms/SOURCES.md | OWNER: replace the link |
| T-04 | L52 | DM20 may be bottom-mounted with the RM1 (no distance) | Floor-tom bottom zone: "about 3–8 cm below the bottom head", the lab's drawing, measured from the resonant head; offered only with both heads on. | No source gives a bottom distance or a polarity setting for a tom pair; the app says so and grades no setting. | EW-DM20; L52 | APPLIED (`model.ts` zone `floor.bottom`, `lesson.ts` `tm.two.3`) · OWNER: approve 3–8 cm |
| T-05 | L23–L24 | "between each pair of toms, 2.5 to 7.5 cm above drum heads" (no aim for the shared mic) | The shared-mic zone sits over the gap between the two rack toms, aimed down within 60° of the heads' straight-on line, on a boom from the audience side (its stand lands in front of the kick). The cymbal exercise uses the 16 in crash over the 10 in tom (the 12 in tom's starting point already had the 18 in crash in its null). | Illustrative lab tolerances; no source gives the aim or the cymbal positions. | S-B56A-UG p.4; kit/GEOMETRY_PROPOSAL.md §2 | APPLIED (`model.ts` zone `rack.shared`, `copy.ts` context) · OWNER: approve 60° |

## C01 Acoustic Guitar (`source_text/Acoustic-Guitar-Miking-Technique.txt`)

From acoustic_guitar/SOURCES.md and BATCH4_RESEARCH_SUMMARY.md §2. Decision: ONE lesson with a BODY selector (steel 6 / 12-string / nylon): the research gives the three bodies the same starting points (S-PGA27's one 6–12 in band near the 12th fret or the sound hole); they differ in tendencies and in where the neck meets the body, which the selector shows. Learner text names no maker or model.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| AG-01 | L18, L28 | "closer to the sound hole for fullness" | "Near the sound hole" — the same 15–30 cm (6–12 in) band as the 12th fret, read from the hole | Shure gives the sound hole the SAME 6–12 in ("Place near the sound hole for a full sound"); "closer" reads as a shorter distance. | S-PGA27 p.3–4 | APPLIED (`lessons/c01Guitar/model.ts` zone `hole`) |
| AG-02 | L18 | "the 12th fret and the body joint are not the same point on every guitar" | Shown per body: on the 14-fret steel and twelve-string bodies the 12th fret is 35.3 / 34.5 mm out on the neck; on the 12-fret nylon body the 12th fret IS the joint, and its zone is read from the joint | DPA-MOUNT's "where the fretboard meets the body, typically above the 12th fret" is true for 12-fret bodies only (D-AG1). | MAR-HD12; ELD-C5; DPA-MOUNT | APPLIED (`model.ts`, `copy.ts`, check `ag.place.3`, quick-check `q.1`) |
| AG-03 | whole lesson | no hearing note | Plain hearing line on the setting page and in the checks: about 85 dBA averaged over 8 hours, halve the time per 3 dBA; a mic's max SPL is not a hearing limit | The survey flagged C01 as the Lab 4 lesson with no hearing note. | OSHA (internal; not named on screen) | APPLIED (`shared/guitars/StagePlan.tsx` STRINGS_HEARING, `ag.set.1`, `q.6`) |
| AG-04 | L10–L16 (map) | "Move toward bridge or lower bout" (no number) | A "Toward the bridge" starting point: 10–20 cm (4–8 in) out from the bridge; the 3 in-from-the-hole booklet row is kept in WORDS as an example of too close (boomy), not as a zone | The booklet gives the bridge a number; its 3 in row pairs with "very bassy, boomy" (Medium pairing). | S-REC p.9, S-LIVE p.22 | APPLIED (`model.ts` zone `bridge`, zone `hole` tendency) · OWNER: keep the bridge row as a zone? |
| AG-05 | — (addition) | — | A fourth starting point: the treble side of the upper bout, about 30 cm (12 in), drawn as 25–36 cm | An engineer's documented start, adjacent to the lesson's; "approximately 12 inches" is drawn as a ±5 cm band (lab reading). | TAY-REC | APPLIED (`model.ts` zone `upper`) · OWNER: approve |
| AG-06 | L6, L31 | names Shure, DPA, Yamaha, Martin; "Yamaha describes its generally softer, rounder character" | Plain tendencies ("nylon strings, on a lighter classical body, rounder and softer"); no maker on screen | Owner ruling 2026-10-04 (starting-points voice). | — | APPLIED (`lesson.ts`) |
| AG-07 | L34 | the side-address condenser note ("the address axis … must face the intended region") | The mic types are drawn end-address (small condenser, instrument dynamic, clip mini); the side-address point is not a placeable type | The engine places end-address bodies along the aim; a side-address large-diaphragm body would be drawn wrongly. | S-PGA27 | OWNER: add a side-address type later if wanted |
| AG-08 | L44 | DPA stage option: a clip under the fingerboard, pointed up, away from the monitor | In words on the Studio-or-live page (not a zone) | It needs a reference surface facing down the guitar's side; kept as an idea to try. | DPA-AG | APPLIED (`copy.ts` context points) |

## C03 Resonator Guitar (`source_text/Resonator-Guitar-Dobro-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| RS-01 | whole lesson | no fixed geometry beyond "20–45 cm" | Two postures drawn: square-neck lap style (face up, a boom from the side) and round-neck upright; the steel dreadnought outline stands in for the body | Resonator bodies are not sourced; the cone (9.5 in) is. | NAT-TECH, BEARD | APPLIED (`lessons/c03Resonator/model.ts`) · OWNER: check the lap posture on the phone |
| RS-02 | L13 | "Shure's … flat-top guitar sound-hole illustration should not be transferred literally" | Kept — and a closer start added: about 20 cm (8 in) from the coverplate's centre, saying the guide groups the resonator with its guitar rows (TRIAL: the sound hole read as the cone's centre) | Shure itself lists the resonator under the guitar rows; the lesson's caution stays in the words. | S-REC, S-LIVE | APPLIED (zone `close`) · OWNER: keep this row? |
| RS-03 | L9, L41 | names Jerry Douglas, KSM32/KSM44A, Fishman, DPA 4099G | Generic words ("one touring engineer", "an imaging pedal", "a clip made for this body") | Owner ruling 2026-10-04. | S-BLUEGRASS, FISH-AURA, DPA-MOUNT | APPLIED |
| RS-04 | title, L5 | "Dobro" | "Resonator guitar" / "square-neck resonator" | "Dobro" is a maker's trademark; brand names stay off the learner's screen. | — | APPLIED · OWNER: approve the title |
| RS-05 | L60 | OSHA line | Plain hearing line (85 dBA / 8 h, 3 dB), no agency named | Starting-points voice. | OSHA | APPLIED (`StagePlan.tsx`, `rs.set.1`, `q.6`) |

## C05a Banjo (`source_text/Banjo-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| BJ-01 | L9 | "Shure's live-sound guide describes about 1 ft (30 cm) from the bridge" | "Start about 7.5 cm (3 in) out from the centre of the head" and "… from the edge of the head" (two zones); the mini mic "clipped by the tailpiece, aimed at the bridge" | Not in the booklet: 1 ft from the bridge is the CELLO row. The banjo rows are 3 in from the head's centre / edge and a miniature clipped to the tailpiece aiming at the bridge. | S-LIVE p.22, S-REC p.9 | APPLIED (`lessons/c05aBanjo/model.ts` zones `centre`, `edge`, `clip`) |
| BJ-02 | L9, L23 | DPA's "two omnis at 30–40 cm … distance" used as a one-mic distance | Kept as the lesson's trial at the neck junction; the internal record notes "distance" may mean the pair's spacing | The quote is ambiguous. | DPA-BANJO | APPLIED (zone `joint` bandProv) · OWNER: confirm the reading |
| BJ-03 | L39 | "Shure reports an engineer using a figure-eight ribbon" (unnamed model) | In words, unnamed ("one engineer … a figure-8 ribbon"); the model (KSM313) stays internal | Owner ruling; the research found the model named. | S-BLUEGRASS | APPLIED (`copy.ts` context points, `bj.mic.1`) |
| BJ-04 | L37 | "a miniature mic attached near the strings between bridge and tailpiece" | "clipped by the tailpiece, aimed at the bridge" — never on a string | The booklet's banjo row; the "near the strings" wording is its all-strings row. | S-LIVE | APPLIED |
| BJ-05 | L5 | "cross-link its head behaviour with the Membranophones Lab" | The sound page shows the head's own ideal-membrane shapes, driven off-centre at the bridge (the drum pages' Bessel tables) | Real physics already in the app; the bridge offset (95 mm) is the proposal's drawing default. | banjo/GEOMETRY_PROPOSAL.md | APPLIED (`StringSound.tsx` membrane step) |

## C05b Mandolin (`source_text/Mandolin-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| MD-01 | L13 | DPA's two-omni "30–40 cm … distance" as a one-mic trial | Kept, aimed at the neck junction; the ambiguity (distance or spacing) noted internally | As BJ-02. | DPA-MANDO | APPLIED |
| MD-02 | — (addition) | — | A second start: about 20 cm (8 in) toward the opening — the recording guide lists the mandolin under its guitar rows (TRIAL) | Gives the placement page two stand zones; the lesson's own "slightly toward an opening" row carries no number. | S-REC p.8 | APPLIED · OWNER: approve |
| MD-03 | L30 | names KSM137, AKG C535 | Generic ("field examples") — not shown | Owner ruling. | S-BLUEGRASS | APPLIED |
| MD-04 | — | no hearing number | Plain hearing line | Parity. | OSHA | APPLIED |

## C05c Ukulele (`source_text/Ukulele-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| UK-01 | L9 | upper-body / neck-joint aim | Kept, and the app says it is borrowed from the guitar (the ukulele guide does not locate the sweet spot) | DPA-UKE: "a good blend of strings and fingers" with no location. | DPA-UKE | APPLIED (`c05cUkulele/model.ts`, `uk.place.1`) |
| UK-02 | L33 | clip fit 35–55 / 35–122 mm | The fit rule in words; the app does NOT say which clip fits the drawn soprano (its 60 mm depth is a drawing default) | The fit rule is sourced; the depth is not. | DPA-UKE; ukulele/GEOMETRY_PROPOSAL.md | APPLIED |
| UK-03 | — | four sizes | Only the soprano is drawn; the others are named | Only a museum soprano is sourced; the retailer sizes were a snippet (never drawn). | MET-UKE; ADO-KALA (Low) | APPLIED · OWNER: draw other sizes later? |

## C07 Acoustic Bass Guitar (`source_text/Acoustic-Bass-Guitar-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| AB-01 | L33 | Taylor's engineer: "a microphone near the upper bout, about 12 inches away" | "The treble side of the upper bout (the cutaway), about 30 cm (12 in)", said to be a guitar start used by analogy | The quote names the treble side and the cutaway; metric added. | TAY-REC | APPLIED (`c07AcousticBass/model.ts` zone `upper`) |
| AB-02 | L6 | "Martin's … onboard E1 electronics with volume, tone and phase controls" | No model or electronics named; "a pickup … its own path" | Brand rule; the phase-control wording was not re-verified on the page. | MAR-BC16E | APPLIED |
| AB-03 | — | lowest note | "about 41 Hz" (open low E), in words | Derived (E1 = 41.20 Hz); avoids the "E1" name clash with the electronics. | PHYS-ET | APPLIED |

## Lab 4 shared (the guitar family)

| id | Where | Says | Correction | Why | Status |
|---|---|---|---|---|---|
| L4-01 | all Lab 4 lessons | "Pro Audio Training Academy" header | Removed | House rule (as Batch 1). | APPLIED |
| L4-02 | test/mikingLearnerText.test.ts | BRAND_NAMES | Added Taylor, Martin, Cordoba, Gibson, National, Beard, Fishman, Deering, Kala, Eastman, Dobro, KSM…, PGA27, OSHA | The Lab 4 research met them. | APPLIED |
| L4-03 | engine | a mic facing a guitar points along −z | `InstrumentModel.aimHome` (the AIM lane and the plan-view drag turn about it) | The guitar's front and from-above views need the mic to face the top. | APPLIED |

## Shared (all lessons)

| id | Where | Says | Correction | Why | Source | Status |
|---|---|---|---|---|---|---|
| C-CALC-1 | Calculator STEREOMIC "3:1 rule minimum spacing" explanation (src/screens/lab/calc/workspaces/micsRf.ts, `threeToOne.explain`, and `mistakes[1]`) | "quiet enough that summing the mics stays clean instead of comb-filtering" / "or bleed combs the mix" | Should say the bleed is about 9.5 dB down, which reduces (does not remove) comb filtering; 3:1 does not guarantee phase coherence | The Kick lesson (L72) and the DPA/Shure references limit the rule; −9.54 dB bleed still combs (dips ≈ −3.5 dB, peaks ≈ +2.5 dB relative to the main mic alone). The Miking Labs never import the calculator's sentence. | Kick L72; lesson ref [12]; SOURCES_SHARED.md §4 | OWNER: ruling §16.10 says fix on `audio-tools-engine` with Comp A's queued items — **not done in this run** (branch rule) |
| C-POL-1 | micspeaker/viz.tsx (0.37/0.63) vs micselect/micSelectData.ts (0.366/0.634) | Two supercardioid coefficient sets | One exact set in the Miking engine; the old labs left alone | Blueprint R10 | SOURCES_SHARED.md §3 | OWNER: separate fix pass |
