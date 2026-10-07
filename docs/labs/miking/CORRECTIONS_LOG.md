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
## M09 Drum Overheads (`source_text/Drum-Overheads-Miking-Technique-Research.txt`)

Research: `overheads/SOURCES.md` §d and its disagreements log (D-O1 to D-O5). On screen the
methods carry descriptive names (owner ruling 2026-10-04: no people named): the two-mic
method over the snare and beside the floor tom is the **floor-tom method**; the two-mic
method with a mic by the drummer's shoulder is the **shoulder method**.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| O-01 | L35-36 | Shoulder method: "its cited 32-inch dimension" (undefined) | Defined: 32 in (about 81 cm) from the centre of the snare to EACH mic, and both mics the same distance from the kick. | The measurement was never stated; the drawing and the arrival readouts need it. | overheads/SOURCES.md §b | APPLIED (`m09Overheads/model.ts` `RM_A`, `RM_B`; `copyPairs.ts`) |
| O-02 | L45 | Floor-tom method: "Roughly 40 in (about 1 m) from the snare is an example in one account" | Two starting points: 40 in (about 1 m) above the snare's centre, or about 4 ft above the kit — both as places to begin, not a rule. | The two accounts differ (D-O3); the lesson gave one. | RM-GJ; MT-GJ | APPLIED (`model.ts` `GJ_MAIN`, `GJ_MAIN_HIGH`; zone `oh.gj.main`) |
| O-03 | L48 | Side mic "about 6 in (15 cm) above the floor-tom rim" | 6 in above the floor-tom rim AND the same 40 in from the snare's centre: a point just beyond the floor tom, on the line from the snare through the floor tom (−347.5, −492.0, 675.1 in the kit frame). | The two accounts place it differently (D-O4); the equal-distance rule both give fixes one point. | RM-GJ; MT-GJ; overheads/GEOMETRY_PROPOSAL.md §2.7 | APPLIED (`model.ts` `GJ_SIDE`; zone `oh.gj.side`) |
| O-04 | L117 | "Shure's new article describes X/Y and Mid-Side mono compatibility as guaranteed" | The app never says "guaranteed": a coincident pair or a decoded mid-side pair keeps a steadier mono sum; equal snare distance is not a whole-kit guarantee. | Shure writes "ensures mono compatibility" (M-S) and "avoiding any risk of comb-filtering" (X/Y), not "guaranteed". | S-5TECH | APPLIED (`lesson.ts`, `copyPairs.ts`) · OWNER: the document's L117 should quote "ensures" |
| O-05 | L23 | ORTF "about 17 cm apart and 110° apart" | 170 mm apart, 110° included angle (each capsule 55° off the centre line). | Confirmed; DPA's "±110°" reads as 220° and is an error on that page (D-O1). | S-5TECH; DPA-STEREO | APPLIED (`pairs.ts`; test `mikingModelM09`) |
| O-06 | (drawing) | X/Y and ORTF centred over the snare at the mono-overhead height (proposal §2.2-2.3) | Drawn at the floor-tom method's main height (1016 mm above the snare's centre) instead. | At the proposal's height (1.6 m off the floor) the pair sits about 7 mm inside the drawing's sticks' reach; the reach itself is a drawing default. | overheads/GEOMETRY_PROPOSAL.md §2 | OWNER: confirm the pair height or the reach envelope |
| O-07 | (drawing) | Shoulder method's second mic "by the drummer's shoulder" | Drawn where the two distance rules put it; in this drawing it lands about 20 cm from the right shoulder, inside the sticks' reach — the page says so and asks for a check on the real kit. | The method's own rule places it there for this kit. | overheads/GEOMETRY_PROPOSAL.md §2.6 | APPLIED (page note) · OWNER: keep or move the method to "read only" |

## M10 Drum Room Microphones (`source_text/M10-Drum-Room-Microphones-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| R-01 | L33 | Large condenser in front of the kit (no address stated) | Drawn as a SIDE-address cardioid, its front the logo face, on a stand. | The guide says "side-address cardioid" and "the logo on the front of the mic faces your sound source"; the lesson never said which way it faces. | S-SM4-UG p.3, p.7-8 | APPLIED (`data/micTypesKit.ts` `roomLdc`, `ohLdc`; `micDrawings.tsx` `SideLdcMic`) |
| R-02 | L6, L33 | "3–6 ft (about 1–2 m) in front of drums" | "1–2 m in front of the kit" — no "about". | The guide prints "(1–2 m)" itself. | S-SM4-UG | APPLIED (`m10Room/lesson.ts`) |
| R-03 | L39 | "a room pair about 15 ft away in room corners" | "about 4.6 m (15 ft)"; the drawing's room is sized so the corner pair, 300 mm in from two walls, is exactly 15 ft from the kit's centre in plan. | Metric value added; the room is a drawing default built around the one published distance. | UA-STEREO; room/GEOMETRY_PROPOSAL.md §1 | APPLIED (`m10Room/model.ts` `ROOM`, `CORNER_*`; test `mikingModelM10`) |

## M11 Complete Drum-Kit Setups (`source_text/M11-Complete-Drum-Kit-Setups-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| K11-01 | (plan) | Stages one mic → extensive | The stages are shown as functional examples, never a fixed order to add mics; the counters describe a plan and never grade it. | The lesson's own caution; the stepper could read as a ladder. | M11 lesson | APPLIED (`m11Kit/copy.ts` `PLAN_WORDS`) |
| K11-02 | (drawing) | Hi-hat and ride spot mics | Drawn on booms (a floor stand straight under them passes through the cymbal); the floor-tom spot sits over the rim away from the rack tom's stand. | Collision check: the first drawing put stands through hardware. | kit plan; test `mikingModelM11` | APPLIED (`m11Kit/plan.ts`) |
## M06 Timpani, M07a Concert bass drum, M07b Concert snare, M08 Headed tambourine (branch miking-w4, 2026-10-05)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| TP-01 | L18 / ref [6] | "A documented classical-recording approach … about 1 m above the heads" (cites ebrary) | "about 1 m (3 ft 3 in) above the heads, between the two drums" — the book's own "(3'4")" kept in the record; no source named on screen | The batch research: cite the book (*Classical Recording*), not the ebrary mirror; 1 m = 3 ft 3.4 in | timpani/SOURCES.md DECCA | APPLIED (`m06Timpani/model.ts`) · OWNER: replace ref [6] with the book |
| TP-02 | ref [9] | Neumann MCM newsroom case | Not used | The URL returns 404 | timpani/SOURCES.md | APPLIED · OWNER: find the current URL |
| TP-03 | L20 | "Arrange according to the player's real drum order rather than assuming a fixed left-to-right pitch map" | Kept, and the lab draws the international order with the German order named as its mirror | Yamaha's placement page gives both orders | YMH-TIMP-PLACE | APPLIED (`m06Timpani/copy.ts`) |
| B-01 | ref [1] | cites the ebrary mirror | The book is the record | as TP-01 | concert_bass_drum/SOURCES.md DECCA | OWNER: replace the link |
| B-02 | L18 | "just above … looking diagonally downwards … about 45 cm" | "above the playing head, about 45 cm from it, looking diagonally down at it" — the drawing puts the mic 450 mm from the head centre at 45° (a drawing default), which is not literally above the rim | At 45 cm from the head centre no position is above a 36 in drum's rim; "about 45 cm" is read from the head centre (proposal) and the elevation is the owner's call | concert_bass_drum/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve the 45° and the reading of "just above" |
| B-03 | L26 | "The source's possible suggestion of rotating the drum" | Said as a real suggestion the source makes — and a decision for the player and crew under the stand's manual, never the engineer's | The Decca text does say it ("you could consider turning the drum sideways") | DECCA | APPLIED (`m07aConcertBassDrum/lesson.ts` cbd.ctx.studio) |
| CS-01 | L24 | Shure tutorial "about 10 cm (4 in)" | "about 10 cm (4 in) or a little more" (the zone starts at 4 in exactly) | Shure's words are "a good 4 inches" (at least about 4 in) | S-SM57-ART | APPLIED (`m07bConcertSnare/model.ts` csn.whole) |
| CS-02 | L55, L98 | top and bottom "invariably out of phase … usually produce a better result" | "engineers try the polarity switch on a bottom mic. Try it; never assume it" — opposite-head motion shown on the two-mic page | Both halves of Shure's sentence are kept in the record; the app teaches the check | S-SM57-ART | APPLIED (`m07bConcertSnare/copy.ts` twoMic.opposite) |
| TB-01 | header | "last named instrument in the Membranophones list" | Not said | M09–M13 follow in the plan | headed_tambourine/SOURCES.md | APPLIED · OWNER: fix the header |
| TB-02 | L15 | "Yamaha suggests about 8 in (20 cm) for hand percussion" (as an instrument distance) | Not shown as a tambourine distance; the starting point is 15–30 cm from the instrument | Yamaha's words are player-to-mic ("have the player stand about eight inches from the mic") | YMH-HUB-REC3 | APPLIED (`m08HeadedTambourine/copy.ts`) · OWNER: reword L15 |
| TB-03 | L15 | Shure "6–12 in (15–30 cm)" | Kept; all three Shure booklets carry the row | — (recorded so it is not "fixed" later) | S-DRUMS, S-REC, S-LIVE | APPLIED (no change) |

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

## Lab 4 bowed strings — C09a Violin, C09b Viola, C09c Cello, C06a/C06b Upright Bass (`source_text/Violin-*`, `Viola-*`, `Cello-*`, `Upright-Bass-Plucked-*`, `Upright-Bass-Bowed-*`)

Research: BATCH4_RESEARCH_SUMMARY.md and violin/, viola/, cello/, upright_bass_plucked/, upright_bass_bowed/ (SOURCES.md, GEOMETRY_PROPOSAL.md). Shared family: `lessons/shared/bowed/`.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| V-01 | C09a L9, L75 | Violin stand mic "in front and somewhat above … 0.5–1.2 m" as a recommendation | Kept as a modest place to begin ("try about 0.5–1.2 m (about 1.6–3.9 ft)"), zone kind TRIAL; the published 30 cm–2 m band for strings is the internal record | No source gives 0.5–1.2 m for the violin; the range sits inside the published strings band | S-PGA27 (violin/SOURCES.md) | APPLIED (`lessons/c09aViolin/model.ts` vn.front) |
| V-02 | C09a (absent) | — | A closer start added: about 25–35 cm in front of where the bow meets the strings | A sourced session figure the lesson did not use | GEOS (violin/SOURCES.md) | APPLIED (vn.close) |
| V-03 | C09a | "A few inches from the side" for reinforcement (no part named) | 5–10 cm from the rib at the lower bout, on the side away from the bow | The source gives no number or part; the drawing default keeps it out of the bow's sweep | S-BWS; proposal (drawing default) | APPLIED (vn.side) |
| V-04 | C09a | Clip-on miniature "on the violin" | On the bass-side rib, the capsule over the top aimed at the bridge or an f-hole, away from the head; or a holder on two strings between the tailpiece and the bridge | The mounts the manufacturer documents; the head and the chin rest stay clear | DPA-MOUNT, DPA-MHS | APPLIED (vn.clip, vn.holder) |
| V-05 | C09a | Standing player only | STANDING and SEATED postures; every start is checked clear in both | Orchestral and session violinists sit; the starts must work either way | violin/GEOMETRY_PROPOSAL.md | APPLIED (`c09aViolin/geometry.ts`) |
| V-06 | C09a | Hearing note present | Kept; the 85 dBA line names it a limit for people, not a mic rating | Consistency with the other labs | OSHA (shared) | APPLIED |
| VA-01 | C09b | "1.5–4 ft" for 0.5–1.2 m | "about 1.6–3.9 ft" | Arithmetic: 0.5 m = 1.64 ft, 1.2 m = 3.94 ft | — | APPLIED (`lessons/c09bViola/model.ts` va.front) |
| VA-02 | C09b | A compact cardioid aimed at an area — no distance | 15–40 cm, aimed at the bridge and top (or an f-hole, the fingerboard's end), labelled a drawing default | The manufacturer gives the idea, not a number; the model is not named in learner text | DPA-VLA; viola/GEOMETRY_PROPOSAL.md | APPLIED (va.aimed) |
| VA-03 | C09b | No hearing note | The 85 dBA line added (a limit for people, not a mic rating) | BATCH4 summary: missing hearing note | OSHA (shared) | APPLIED (`c09bViola/lesson.ts`) |
| VA-04 | C09b | Viola treated as a large violin | Its own size (body 388 mm) and lowest note (C3 ≈ 131 Hz); the chin rest and tail drop 20 mm | Sourced instrument size | MET-BANKS | APPLIED (`c09bViola/geometry.ts`) |
| C-01 | C09c | No hearing note | The 85 dBA line added | BATCH4 summary: missing hearing note | OSHA (shared) | APPLIED (`c09cCello/lesson.ts`) |
| C-02 | C09c | "One foot in front of the bridge" | "About 25–35 cm from the bridge" — "in front" is the lesson's reading | Shure says "one foot from the bridge" and gives no direction | S-BWS (cello/SOURCES.md) | APPLIED (vc.front) |
| C-03 | C09c | A farther mic for a solo — no number | 0.6–1.2 m, labelled a drawing default | Inside the proposal's 600–1500 mm range | cello/GEOMETRY_PROPOSAL.md | APPLIED (vc.far) |
| C-04 | C09c | String clip "near the bridge" | On the C and A strings below the bridge, the capsule under the strings; angled to an f-hole for more output | The manufacturer's documented positions | DPA-VC, DPA-MOUNT (cello/SOURCES.md) | APPLIED (vc.clip, vc.fhole) |
| C-05 | C09c | Seated cellist (no lean) | 25° lean back and a 6° side lean; the proposal's 10° turn left out | A simplification of the drawing; the zones and the bow's sweep are tested in this posture | cello/GEOMETRY_PROPOSAL.md (posture) | APPLIED (`shared/bowed/posture.ts` seated) |
| UB-01 | C06a/b L7 | "15–30 cm in front … above the bridge" (ambiguous: on the bridge? higher?) | In FRONT of the strings, at a height a little ABOVE the bridge (6–15 cm up the strings), 15–30 cm out; nothing goes on the bridge | The art read it as "on top of the bridge"; the booklet's wording means a height on the face of the bass | S-BWS; upright_bass_plucked/GEOMETRY_PROPOSAL.md §2 | APPLIED (`shared/bowed/bass.ts` ub.front) |
| UB-02 | C06a/b | The under-bridge spot "between the strings and the top" | Drawn behind the bridge, between the strings and the top, the clip on the two outer strings below the bridge | The manufacturer's clip position | DPA-DB, DPA BC4099 | APPLIED (ub.under) |
| UB-03 | C06a | (lesson forbids foam-wrapped mics against the bass) | Kept: an improvised foam wedge fails a setup brief | One old booklet suggests a foam-wrapped mic behind the bridge; the lesson's rule is safer | S-RHYTHM (old booklet) | APPLIED (`c06aBassPlucked/lesson.ts` brief 1) · OWNER: note the difference in the document |
| UB-04 | C06b | Front mic "outside the bow's complete trajectory" | The front start is checked outside the bow's sweep and the bow hand's path (a test) | The bow plays 4–17 cm up from the bridge — where the front mic looks | upright_bass_bowed/GEOMETRY_PROPOSAL.md | APPLIED (ub.front; `test/mikingLab4Strings.test.ts`) |
| UB-05 | C06b L33 | One manufacturer identifies a large-diaphragm model "as a possible orchestral spot for low strings" | The section spot is taught as a practice (a support for the main pickup), no model named | The wording is not on that manufacturer's page ("mainly designed for home, project, and broadcast studios") | BATCH4_RESEARCH_SUMMARY.md (C06b) | APPLIED (`c06bBassBowed/model.ts` ub.spot) · OWNER: soften or re-source the line in the document |
| B-06 | family | — | The bow's sweep is a two-sided fan ±25° about the bowing point, radius the bow (bass: hair + 20 mm), rounded 25 mm | The proposal's swept volume, simplified so the starts can be tested against it | violin/GEOMETRY_PROPOSAL.md (bow envelope) | APPLIED (`shared/bowed/bowedModel.ts`) |
| B-07 | family | Bass player turned 20° | The turn left out; the bassist is placed from the back of the bass | A simplification of the drawing; the zones and the bow's sweep are tested in this posture | upright_bass_*/GEOMETRY_PROPOSAL.md | APPLIED (`shared/bowed/posture.ts` standing) |

## C11 Piano (`source_text/Acoustic-Piano-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| C11-01 | L31 | DPA "ORTF cardioid pair around 30 cm (12 in) above strings at mid frame, aimed down toward the pianist" (no angle) | The ORTF-over-the-strings zones carry DPA's angle: aimed about 45° down, toward the pianist | DPA gives the angle; the lesson dropped it, and the zone's aim depends on it. | DPA piano guide: "pointed at 45° downwards, towards the pianist" (acoustic_piano/SOURCES.md) | APPLIED (`lessons/c11Piano/model.ts` zones `gp.ortf`, `bg.ortf`) |
| C11-02 | L30–L31 | "ORTF" (no geometry) | ORTF stated as 17 cm between the capsules, 110° included | DPA's own page writes "±110°", a slip for 110° included (±55°). | acoustic_piano/SOURCES.md (DPA ORTF row) | APPLIED (`lessons/c11Piano/model.ts`, `lesson.ts`) |
| C11-03 | — | No hearing line | Hearing note on page 3 with the 85 dBA / 3 dB guideline, and "close to the hammers a piano can pass 130 dB" | Batch 4 summary: every Lab 4 lesson needs the hearing line; DPA gives the 130 dB figure. | OSHA, NIOSH; DPA ("more than 130 dB close to the hammers") | APPLIED (`lessons/c11Piano/pages.tsx` `hearing`, `lesson.ts` q.6) |
| C11-04 | L31, L35, L37 | Shure placements without numbers | The Shure booklets' numbered rows are offered as zones: 12 in above the middle strings and 8 in from the hammers; 8 in above the treble or bass strings; 6 in over the middle strings on the short stick; underneath, aiming up at the soundboard; the upright's open top, 8 in from the back of its soundboard, and at the hammers with the front panel off | Numbers the lesson did not carry; each zone records its source row internally. | acoustic_piano/SOURCES.md (Shure rows) | APPLIED (`lessons/c11Piano/model.ts`) |
| C11-05 | L70 | No attachment without the owner's approval | Kept. Shure's booklet suggests a soundboard clamp; the app does not offer it | The lesson's safety rule is stricter; noted so the owner can decide. | acoustic_piano/SOURCES.md | APPLIED (rule kept) · OWNER: confirm |
| C11-06 | L2 | "Pro Audio Training Academy" | Removed | House rule (as Batch 1). | — | APPLIED |
| C11-07 | L6 | A0 at 27.5 Hz | Kept | Correct (equal temperament, A4 = 440 Hz). | PHYS-ET | APPLIED (no change) |
| C11-D1 | — | One lesson for grand, baby grand and upright | One lesson with a piano selector (grand full stick, short stick, baby grand, upright top-open, upright front panel off) | The techniques share the same reasoning (lid, soundboard, hammers, holes); the selector changes the geometry and the zones offered. | — | APPLIED · OWNER: confirm or ask for a split |
| C11-G1 | — | — | The rim top is drawn 150 mm above the string plane; the lid opens 26° on the full stick and 11° on the short stick | Drawing defaults (no source gives them); named in the lesson's unknowns. | acoustic_piano/GEOMETRY_PROPOSAL.md | OWNER: approve the defaults |
| C11-G2 | — | — | The upright's interior is redrawn: strings and soundboard at the back, the action in front, the front panel removable | The proposal's frame kept, the drawing simplified. | acoustic_piano/GEOMETRY_PROPOSAL.md | OWNER: approve |
| C11-G3 | L70 | "All hardware must clear the grand lid through its entire intended travel" | Read as a keep-out: the lid and the stick are solids at their set position; no zone sits where the lid would close | The lab cannot animate the lid's travel; the lesson's rule is said in words on the setting page. | — | APPLIED |

## C10 Harp (`source_text/Harp-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| C10-01 | — | No hearing line | Hearing note on page 3 (85 dBA / 3 dB, people not mics) and the critical quick-check item | Batch 4 summary: every Lab 4 lesson needs it. | OSHA, NIOSH | APPLIED (`lessons/c10Harp/pages.tsx`, `lesson.ts` q.6) |
| C10-02 | L37 | A miniature "concealed at an existing harp sound hole" | "the second sound hole from the bottom" | DPA names the hole. | DPA-HARP: "try the second sound hole from the bottom" | APPLIED (`lessons/c10Harp/model.ts` zones `hp.hole`, `lv.hole`) |
| C10-03 | L35 | Two cardioids, "the upper spot" favoured (no figure) | "the top mic about twice as loud (roughly 6 dB) — a starting point, not a rule" | DPA's figure. | DPA-HARP: "mixed with the top microphone twice as loud as the lower one" | APPLIED (`lessons/c10Harp/copy.ts` twoMic) |
| C10-04 | L37, L65 | No foam in the sound holes | Kept as "nothing pushed in unless the owner asks for that technique" | DPA suggests partly stuffing holes with foam; the lesson's safety rule wins, with the owner's consent as the exception. | DPA-HARP | APPLIED · OWNER: confirm |
| C10-05 | L16, L31 | "Around 2 m or more" | Kept: a spaced pair about 2 m or more from a full-size harp, toward the room's centre, not too low | Confirmed. | DPA-HARP: "a distance of about 200 cm is recommended as minimum distance" | APPLIED |
| C10-06 | L2 | "Pro Audio Training Academy" | Removed | House rule. | — | APPLIED |
| C10-G1 | — | — | The lever harp is drawn at 0.75 of the pedal harp (about 1.4 m), 34 strings; the soundboard's lean, the box depths, five sound holes and seven pedals are drawing defaults | No source gives them; named in the unknowns. | harp/GEOMETRY_PROPOSAL.md | OWNER: approve the defaults |
| C10-G2 | — | — | A harp wedge in front of a mic that looks DOWN at the board sits about 105° off its axis — near a supercardioid's or hypercardioid's null, nowhere near a cardioid's rear; the context page says so | The geometry, said plainly rather than promising a cardioid null that the drawing cannot show. | — | APPLIED (`lessons/c10Harp/copy.ts` context) |

## C12 Clavinet (`source_text/Clavinet-Miking-Technique.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| C12-01 | L6 | "a hammer presses a string against a pickup-facing surface" | A tangent (a small plunger) presses the string onto an anvil; the string rings between the anvil and the bridge; magnetic pickups at that end make the signal; on release the yarn-wound part of the string mutes it | The leaflet describes a plunger and an anvil, not a hammer. | HOH-D6 p.5: "a plunger underneath touches the string and presses it on to an anvil"; "Magnetic pick-ups are situated at the other end of the string" | APPLIED (`lessons/c12Clavinet/soundArt.tsx`, `lesson.ts` sound stages) |
| C12-02 | L41 | "aim the rejection null away from the loudest monitor" | Aim the null TOWARD the loudest monitor, by the mic's actual pattern | Wrong direction: the null is where the mic hears least, so it must face the monitor. | SN-906-2020 p.5: "postion your monitor loudspeakers in the angle area of the highest cancellation" | APPLIED (`lessons/c12Clavinet/copy.ts` context, `lesson.ts` cv.ctx.1, setup brief 2) |
| C12-03 | — | No hearing line (the only amp lesson without one) | Hearing note on page 3 and the critical quick-check item | Batch 4 summary. | OSHA, NIOSH | APPLIED (`lessons/c12Clavinet/pages.tsx`, `lesson.ts` q.6) |
| C12-04 | L9–L12, L36 | The direct path taught alongside the mic | Kept as the supporting option: the signal path drawn (DI before or after the pedals), "never a mic input or phantom on the clavinet's output" | The leaflet's "Output 100 mV" is an instrument-level output; the no-phantom rule is an electrical precaution (no source says it). | HOH-D6 p.3 | APPLIED (`lessons/c12Clavinet/soundArt.tsx` `ClavinetPath`, `copy.ts`) |
| C12-05 | L14–L34 | Centre, edge, off axis, "a little farther back" (no numbers) | The amp zones carry the guides' numbers: 2–15 cm (centre, edge), the dust-cap line at the grille, about 30° off axis, 15–30 cm back on axis, behind an open back (no source distance) | The lesson has no numbers; clavinet/GEOMETRY_PROPOSAL.md maps its moves onto the amp guides. | S-PGA27, S-MILLS, SN-906-2020, S-SM57-UG | APPLIED (`lessons/c12Clavinet/model.ts`) |
| C12-06 | L2 | "Pro Audio Training Academy" | Removed | House rule. | — | APPLIED |
| C12-G1 | — | — | The amp is drawn generically (an open-backed 1×12 combo and a closed 1×12 cabinet, frame C) inside the lesson, not from the shared speaker family | The shared speaker family is on another branch (miking-w5); same frame and numbers, so it can be swapped in after the merge. | speaker_leslie/GEOMETRY_PROPOSAL.md | OWNER/LEAD: swap after merge |

## Shared (all lessons)

| id | Where | Says | Correction | Why | Source | Status |
|---|---|---|---|---|---|---|
| C-CALC-1 | Calculator STEREOMIC "3:1 rule minimum spacing" explanation (src/screens/lab/calc/workspaces/micsRf.ts, `threeToOne.explain`, and `mistakes[1]`) | "quiet enough that summing the mics stays clean instead of comb-filtering" / "or bleed combs the mix" | Should say the bleed is about 9.5 dB down, which reduces (does not remove) comb filtering; 3:1 does not guarantee phase coherence | The Kick lesson (L72) and the DPA/Shure references limit the rule; −9.54 dB bleed still combs (dips ≈ −3.5 dB, peaks ≈ +2.5 dB relative to the main mic alone). The Miking Labs never import the calculator's sentence. | Kick L72; lesson ref [12]; SOURCES_SHARED.md §4 | OWNER: ruling §16.10 says fix on `audio-tools-engine` with Comp A's queued items — **not done in this run** (branch rule) |
| C-POL-1 | micspeaker/viz.tsx (0.37/0.63) vs micselect/micSelectData.ts (0.366/0.634) | Two supercardioid coefficient sets | One exact set in the Miking engine; the old labs left alone | Blueprint R10 | SOURCES_SHARED.md §3 | OWNER: separate fix pass |

## Speaker cabinet & Leslie module (`source_text/Speaker-Cabinet-and-Leslie-Miking-Module.txt`, lesson id SPK)

Built 2026-10-05 (branch `final-lab`, builder w5). Research: `speaker_leslie/SOURCES.md`, `GEOMETRY_PROPOSAL.md`.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| SPK-01 | L40 | "Try a near-coincident XY pair outside the upper louvers" | "a coincident X/Y pair": capsules as close together as their mounts allow without touching, 90° apart (drawing default) | X/Y is coincident in the M09/M10 usage and in the module's own L49 ("as close to coincident as their mounts safely allow"); the interviewee's words are "xy pair for the horn". | S-LESLIE; DPA-STEREO (overheads/SOURCES.md) | APPLIED (`lessons/shared/speakers/leslieMics.ts`, `spk/lesson.ts`, `spk/pages.tsx`) |
| SPK-02 | L8 | Mills: "more center often brighter and more edge often mellower" | Tendency words follow the majority: centre "brighter, more present", edge "mellower, warmer, darker" — always "a tendency to check". The one guide whose table states the opposite direction (SM57: centre "emphasized bass", edge "higher frequency sound") is logged, not taught. Mills' own word is "duller", not "mellower". | Disagreement D-L2 in the research. | S-PGA27, S-SM4-UG, S-MILLS, AX-I5 vs S-SM57-UG | APPLIED (`spk/model.ts`) · OWNER: confirm the majority wording |
| SPK-03 | (omission) | No open-back cabinet, no rear mic | Added: an open-backed 1×12, the back of the cone radiating opposite in polarity, a rear zone (5–15 cm behind the open back — a DRAWING DEFAULT, no source gives a distance) and the front + rear pair on the Two microphones page with the polarity flip | The module's own reference [4] (Mills) covers the rear mic: "swap the polarity … on the rear mic". | S-MILLS | APPLIED (`spk/model.ts` `rearZone`, `spk/pages.tsx` SpkTwoMic) · OWNER: approve the 5–15 cm drawing default |
| SPK-04 | L8 (table) | SM57 rows "2.5 cm (1 in.) from speaker" | Measured from the GRILLE CLOTH ("about 2–3 cm from the grille, not touching") | With a grille cloth in front, "from speaker" cannot be measured; the lab reads every distance from the cloth, the surface a learner can see. | S-SM57-UG | APPLIED (`spk/model.ts`) |
| SPK-05 | L6, L27, L55 | Rotor speeds not given | Added from the rotary cabinet's own control panel: horn 44 / 402 rpm, 1.8 s up, 2.4 s down; low rotor 42 / 372 rpm, 7 s up, 5.5 s down; crossover 800 Hz. Shown as plain numbers, no model name. Ramps drawn linear (only the times are published). | Survey blocker "no rotor speeds" resolved by the research. | HAM-122H p.5–7 | APPLIED (`lessons/shared/speakers/rotor.ts`) |
| SPK-06 | L55 | "Hammond's Heritage manual" | (internal only) identified as the Leslie Heritage Series 122H/142H owner's manual, ref [6] | Survey flag. No manual name is shown (owner ruling). | HAM-122H | APPLIED (SOURCES only) · OWNER: name it in the document |
| SPK-07 | L27 | "A Hammond 3300 manual warns not to open the unit" | The app says the cabinet stays closed and is serviced only by a qualified technician; it attributes no wording to any manual | The 3300 text says "Refer all servicing to qualified service personnel"; the "do not open" wording ("NE PAS OUVRIR") is in the 122H manual. | HAM-3300 p.1; HAM-122H p.2 | APPLIED · OWNER: correct the attribution in the document |
| SPK-08 | (addition) | — | HOW IT SOUNDS adds two physics pictures: (1) the textbook rigid piston in a wall (beam narrowing with pitch, a = the cut-out radius, the near-field limit from the calculator's own `pistonNearField`); (2) in words, why the centre tends brighter (the cone moves as one at low pitches; higher up it flexes and more of the highs come from the middle). Both said to be simplified pictures. | LESSON_JOURNEY §7 asks for the speaker's physics; (1) reuses the calculator's piston model's limits; (2) is standard loudspeaker physics, kept in words. | Kinsler et al.; Beranek & Mellow ch. 13 (the calculator's own reference) — not re-read today | APPLIED (`shared/speakers/pistonBeam.ts`, `spk/pages.tsx`) · OWNER: audio-expert check of the wording |
| SPK-09 | (drawing) | — | Rotation direction drawn counter-clockwise from above for both rotors; resting angles, rotor sizes, the drum's single scoop opening, the woofer on the lower compartment's top board, the louver layout: all DRAWING DEFAULTS, never taught | Not documented in any source read. | speaker_leslie/SOURCES.md (UNKNOWNs) | APPLIED · OWNER: check on the phone |
| SPK-10 | (whole module) | "Pro Audio Training Academy", "Student", "classroom" | Not used (house rule: no institutional words) | House rule. | — | APPLIED |

## M12 Tonbak (`source_text/Tonbak-Miking-Technique.txt`, lesson id M12)

Built 2026-10-05 (branch `final-lab`, builder w5). Research: `tonbak/SOURCES.md`, `tonbak/GEOMETRY_PROPOSAL.md`.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| TB-01 | (omission) | No hearing-safety figure | The setting page and a CRITICAL quick-check item add the hearing guideline (85 dBA averaged over 8 h, 3 dB exchange) and say a mic's max SPL is not a hearing limit | Parity item flagged in `tonbak/SOURCES.md`; the same figure every lesson uses. | NIOSH row in `kick/SOURCES.md` (never named on screen) | APPLIED |
| TB-02 | Trials A–E | "Instructor trials" (A 25–40 cm, B 10–20 cm, C 60–100 cm, D 15–30 cm outside the opening, E 1–2 m) | Shown as recommended starting points, measured from the head (D from the lower opening), from the audience side; the lesson's own honesty kept in the ⓘ note ("No published tonbak miking standard exists") | Owner ruling 2026-10-04 (starting-points voice); no institutional words. | LESSON-M12 | APPLIED |
| TB-03 | "30–45 degrees from the head normal" | — | Trial A's zone is 30–45° off the head's centre line toward the audience; B "beside the playing envelope" is drawn as 35–70°; C and E as 20–80° / 20–85°, D within 60° of the drum’s axis outside the opening (lab drawings) | The lesson names the reference (head normal) for A only; the other cones are the lab's drawing of "approach from beside / farther back". | LESSON-M12 (trial) | APPLIED · OWNER: check on the phone |
| TB-04 | "note the head orientation" | — | Posture drawn as a DEFAULT: seated, drum across the lap, head toward the player's right, tilted 15° up, head centre 620 mm above the floor; hands, body, thighs and shins as keep-outs | No source gives a posture; the lesson leaves it to the player. Every number is a flagged placeholder. | — | APPLIED · OWNER: check the posture on the phone |
| TB-05 | (shape) | — | Wooden example's length and head (MET 89.4.304); waist and foot scaled from the brass example's head : waist : base ratios (MET 89.4.332); the opening (110 mm) and the bowl's curve are drawing defaults | The wooden record gives only height and diameter. | MET-89.4.304, MET-89.4.332 | APPLIED |
| TB-06 | (addition) | — | HOW IT SOUNDS shows the ideal round head's shapes driven by a stroke in the middle, halfway, or at the edge (the same membrane tables as the kick) | Explains the lesson's "middle deep / edge bright" with the physics; badged "an ideal round head on its own, no air, no bowl". | Kick membrane tables (Cymatics / Drum Tuning) | APPLIED |
| TB-07 | Lesson frame | origin and axes of `congas/GEOMETRY_PROPOSAL.md` frame H | Frame H: floor under the head's centre, +x audience, +y down, +z the player's right | Shared hand-drum frame. | — | APPLIED |
| TB-08 | (whole lesson) | "Pro Audio Training Academy", "students", "instructor", "classroom" | Not used (house rule) | House rule. | — | APPLIED |
| TB-09 | Two mics (L59–L66) | "neither polarity is correct by rule" | Adds the reason: at the lowest pitches the air pushed out of the opening moves opposite to the head's outer face (as behind an open speaker cabinet); above the body's air resonance the relation changes with pitch | Physics of a closed-volume drum with an opening (volume flow out of the opening opposes the head's inward motion), general knowledge, not re-read; kept as a tendency. | — | APPLIED · audio review 2026-10-05 |

## M13 Tabla (`source_text/Tabla-Miking-Lesson.txt`, lesson id M13)

Built 2026-10-05 (branch `final-lab`, builder w5). Research: `tabla/SOURCES.md`, `tabla/GEOMETRY_PROPOSAL.md`.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| TA-01 | L21 | "approximately 7.6–10.2 cm" | The close zones are 76.2–101.6 mm (exactly 3–4 in) from each head — the one sourced tabla distance | Conversion of the source's own inches. | S-DUVEL | APPLIED |
| TA-02 | L14–L15 | syahi central on the dayan, off-centre on the bayan | Drawn and taught that way; the bayan's patch is offset toward the player by 0.28 × the head's radius (a drawing default) | The lesson's own reading of the Met essay; the acoustic paper's "central" generalisation is not transferred to the bayan (lesson L132). | MET-ESSAY (not re-read today) | APPLIED · OWNER: check the offset on the phone |
| TA-03 | (addition) | — | HOW IT SOUNDS says the patch's weight makes the dayan's vibrations "ring nearly in tune with one another — a clear, pitched tone"; NO ideal-membrane shapes are drawn for the tabla | A loaded head does not follow the plain round head's shapes (the classic result on the tabla's harmonic overtones); drawing them would be false. General knowledge, not re-read. | — | APPLIED |
| TA-04 | L60–L63 | "Coincident XY" | A coincident X/Y pair 50–80 cm from the set, centred; "one mic per drum is not XY" taught as a check | Lesson wording kept (it is already coincident). | LESSON-M13, DPA-STEREO | APPLIED |
| TA-05 | (posture) | "normal seating or platform arrangement" | Drawn as a DEFAULT: seated on the floor, right-handed layout (dayan to the player's right), cloth rings 60 mm, tilts 15° / 10° toward the audience; head diameters 145 / 230 mm | No source gives these; the lesson says to name drums by instrument, not "right". Every number is a flagged placeholder. | MET-TABLA (largest extents only) | APPLIED · OWNER: check on the phone |
| TA-06 | Methods A, C, D | Trials 30–50 cm, 50–80 cm, 1–2 m | Shown as recommended starting points measured from the area between the heads; drawn as a half-ring on the audience side (the zone has no azimuth) | Owner ruling (starting-points voice). | LESSON-M13 | APPLIED |
| TA-07 | (omission) | No hearing-safety figure | Setting page + a CRITICAL quick-check item (85 dBA / 8 h, 3 dB exchange; a mic's max SPL is not a hearing limit) | Parity with every lesson. | NIOSH row in `kick/SOURCES.md` | APPLIED |
| TA-08 | (whole lesson) | "Pro Audio Training Academy", "students", "instructor", "classroom" | Not used (house rule) | House rule. | — | APPLIED |
## Lab 1 hand drums: M04a Congas, M04b Bongos, M04c Timbales, M05 Djembe

Builder run 2026-10-05 (branch `final-lab`, worktree miking-w3). Source texts:
`source_text/Congas-…`, `Bongos-…`, `Timbales-…`, `Djembe-…`. Research: `congas/`, `bongos/`,
`timbales/`, `djembe/` (SOURCES.md and GEOMETRY_PROPOSAL.md), `BATCH1_RESEARCH_SUMMARY.md`.
Learner text follows the owner's starting-points ruling (no names, no badges).

### M04a Congas

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| CG-01 | Curriculum links | The Glyn Johns technique is "taught in Ensembles and Voice" | No cross-link in the app; the correct target is M09 Drum Overheads | Research: WRONG cross-link | congas/SOURCES.md | APPLIED (omitted) · OWNER: fix the document |
| CG-02 | Curriculum links | "The ride cymbal research draft is deferred…" | Not carried | Stale note | congas/SOURCES.md | APPLIED (omitted) |
| CG-03 | Decision table | "roughly 6 in–2 ft (15–60 cm)" | "about 15–60 cm (6 in–2 ft)"; the zone uses 152.4–609.6 mm exactly | 2 ft = 61 cm, not 60 (rounding) | RM-CONGA | APPLIED (`m04aCongas/model.ts`) |
| CG-04 | Ref [3] | Cites the svconline copy of the touring case | The internal record uses the DPA host (same text) | Research note | DPA-JB | APPLIED |
| CG-05 | Whole lesson | Strokes are named (open, slap, bass, muted) but not where they are played | HOW IT SOUNDS adds where they land: open tone "four fingers near the rim", muffled tone "four fingers … holding the fingers against the head", bass "full palm, in a slightly cupped position, somewhat off center" — drawn at drawing positions (0.85 R, 0.3 R); the slap's spot is left to the player (no source gives it) | The physics step needs a strike point; the descriptions are sourced, the positions are drawing defaults | WP-CONGA | APPLIED (`m04aCongas/lesson.ts` `hand.strokes`) · OWNER: a player's check |
| CG-06 | (drawing) | — | The plan default puts both drums at x = 0 (z ± 170 mm): in the side view the conga hides behind the tumba; the labels say so and the top view shows both | The geometry file's plan drawing default is kept | congas/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve, or stagger the drums |
| CG-07 | Decision table, "lower-shell" | "experiment with a mic near — not blocking — the bottom opening" | Zone "In front of the tumba's lower opening (raised)": 30 cm ± 5 cm in front of the shell's lower front edge, within 15 cm of the line through it, facing it ±45°. Garza's actual rig is an X/Y pair "in front of the congas and angled towards the rims"; the app teaches one mic, as the geometry file does | The file's `zone.conga.bottom`; the tolerances are illustrative | SOS-LATIN | APPLIED · OWNER: approve |

### M04b Bongos

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| BG-01 | Two mics row | "give each head its own directional mic at a safe, comparable distance" (no number) | Spot zones (a lesson trial): the "just above" drawing-default band, 2–12 cm beyond each rim, aimed at the head ±60° | A zone needs a band; all values illustrative and said as regions | LESSON | APPLIED (`m04bBongos/model.ts`) · OWNER: approve |
| BG-02 | (drawing) | "Do not prescribe the player's orientation" | The macho is drawn on the player's left (a common layout); the unknowns and the setting say players differ | Geometry file drawing default | bongos/GEOMETRY_PROPOSAL.md | APPLIED |
| BG-03 | (addition) | "contrasting registers" | HOW IT SOUNDS adds the physics: at the same tension every shape of a head scales with 1 ÷ diameter, so the macho sits ≈ 1.19 × higher; players tune the pair apart | Ideal-membrane physics (the Cymatics / Drum Tuning tables); sizes from LP-GEN2 | LP-GEN2; MATH | APPLIED |
| BG-04 | Four approaches | A figure-8 between the drums, lobes toward each head | Not a placement zone (the family has no side-address mic drawing); taught in words on Placement, Microphones and Studio-or-live | A figure-8 capsule is side-address: drawing it end-on would be wrong | S-B181 | APPLIED (words) · OWNER: add a side-address type later? |
| BG-05 | Four approaches | A compact X/Y pair centred above the drums | The Two-microphones page's "coincident pair" preset (both capsules at one point, ±40°) | A two-mic idea; Δt ≈ 0 is its lesson | S-B181 | APPLIED |
| BG-06 | Guided lab step 4 | "A live class must use the actual PA…" | "with the system operator" | No institutional words (house rule) | — | APPLIED |
| BG-07 | (drawing) | A seated player | The seated player's legs are solid parts drawn as legs (ghosted in front of the pair in the side view), not a hatched box | Visual standards: real objects | — | APPLIED |

### M04c Timbales

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| TB-01 | (addition) | No numeric positions | Placement LEARN adds one engineer's percussion overhead "about 91–107 cm (3–3½ ft) above the drums" — words only, no zone (it lies far outside the drawn view) | Research: a number the lesson could cite | SOS-LATIN (Krys) | APPLIED (`m04cTimbales/lesson.ts`) |
| TB-02 | Choose a starting arrangement | One mic "right between the timbale shells" | Zone "Between the shells": the shells' sourced depth below the heads as the height band; within the smaller drum's radius of the pair's centre; no aim (none published) | The geometry file's `zone.timb.between` | AX-OZO; LP-257 | APPLIED |
| TB-03 | Choose a starting arrangement | Under-rim dynamics "pointed outwards towards their rims" | Zones under each drum: the "just above" drawing-default band reused below the lower edge (5–15 cm), within the drum's radius, aim within 60° of up | No number in the source; the band is illustrative | SOS-LATIN (Milan) | APPLIED · OWNER: approve |
| TB-04 | (drawing) | — | The head material is not given by the source: a plain film is drawn and the unknowns say so | Never draw an unknown as known | LP-257 | APPLIED |
| TB-05 | (drawing) | A bracket for bells | The cowbell's size and position are drawing defaults; a BELL / NO BELL switch | The bell is optional ("sold separately") | LP-257 | APPLIED |
| TB-06 | Studio and live | "A documented engineer technique does not transfer…" | "One engineer's technique does not transfer…" | Banned wording on screen ("documented") | — | APPLIED |

### M05 Djembe

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| DJ-01 | L21 | "a bottom mic about 8 in (20 cm) from the rim" | "about 20 cm (8 in) from the bottom rim" | Coppinger says "bottom rim" | COPPINGER | APPLIED |
| DJ-02 | L15 (drawing) | Coppinger's top mic "about 16 in (41 cm) from center" | The mic sits over the head's OUTER EDGE, 406.4 mm from the head's centre, pointing across to the centre: the line rises ≈ 67° above the head plane. The geometry file's default (30° elevation) contradicts "near the outer edge" | Derived from the source's own words, not a guess | COPPINGER | APPLIED (`m05Djembe/model.ts` `DIAG_N`) · OWNER: approve |
| DJ-03 | (drawing) | — | The bowl's depth (where the waist sits) is a BUILD default, 330 mm — the geometry file gives the waist's diameter but not its height | The goblet cannot be drawn without it | djembe/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve |
| DJ-04 | (drawing) | Raised support "four pieces of foam", file default 50 mm thick | The raised support is 200 mm (a BUILD default): Coppinger set the drum on foam "to give a bit of clearance for a mic underneath", and his bottom mic sat "under, 8 inches (20cm) from the bottom rim" — 50 mm cannot hold a mic underneath | The source's words over the file's default | COPPINGER | APPLIED · OWNER: approve |
| DJ-05 | L21 | Duvel's "40–60° angle" (reference not stated) | Measured from the head's normal (the file's default); the practice card says the lab measures it from straight down | Research: angle reference UNKNOWN | S-DUVEL | APPLIED |
| DJ-06 | The instrument and the performer | Postures: standing, between the knees, tilted, on a stand | Two setups are drawn: upright on the floor, and raised on foam blocks. The tilted posture is described in words, not drawn | A tilted goblet needs per-setup head planes; kept for a later pass | djembe/GEOMETRY_PROPOSAL.md | OWNER: wanted as a third setup? |
| DJ-07 | (addition) | "deep bass strokes, ringing open tones, and sharply articulated slaps" | HOW IT SOUNDS adds where they are played (bass: palm and flat fingers near the centre; tone and slap closer to the edge, the contact area making the difference) and that the bass note is set by the shell's size and shape, not the skin's tension | Sourced technique and physics | WP-DJEMBE | APPLIED |
| DJ-08 | (drawing) | — | The height (610 mm, the file's default) sits inside the typical "58–63 cm" | Upgraded from UNKNOWN to a checked default | WP-DJEMBE | APPLIED |

### Shared across the four lessons

| id | Where | Says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| HD-01 | Congas, bongos, timbales | Shure's "just above top heads" (no number) | "about 5–15 cm (2–6 in) above them" — the geometry files' drawing-default band, said as a place to begin (the kick's "within about 6 cm" precedent) | A zone needs a band; the voice says it is a starting region | congas/, bongos/, timbales/ GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve |
| HD-02 | Every zone with an aim | — | Aim tolerances (±30° of straight down for "aiming down", ±45–60° "at the head") are the lab's | As the kick's ±30° (K-17) | — | APPLIED · OWNER: approve |
| HD-03 | Clip-on mic | A miniature clip-on condenser on each drum | Drawn on a 140 mm gooseneck clamped to the nearest rim; the reach is enforced (a clip mic farther from a rim is stopped). The capsule's diameter is unknown (drawing default 18 mm) | Retailer listing; DPA's page lists no dimensions | MKT-4099 (SOURCES_SHARED §6) | APPLIED |
| HD-04 | Feedback and supervision lines | "under a qualified supervisor", "a live class" | "with the system operator" | No institutional words (house rule) | — | APPLIED |
| HD-05 | Whole lessons | "No audio examples" | Fully silent (owner ruling) | — | — | APPLIED |
| HD-06 | Mic drawings and the clip mount (on joining the kit-drum engine) | — | The compact dynamics are drawn with the shared small-dynamic drawing and the clip-on with the shared gooseneck drawing; the gooseneck's 140 mm is the rim clamp's reach (the shared clamp arm, red when out of reach). The scene words moved to the lesson's copy | One drawing per kind of mic across Lab 1; one clamp rule | MKT-4099 | APPLIED |

## Lab 4 · the amplified chain: C02 Electric Guitar, C08 Electric Bass, C04 Pedal and Lap Steel

Built 2026-10-05 (branch `miking-c3`, from `miking-w5`). Research: `electric_guitar_amp/`, `electric_bass_amp/`, `pedal_steel/` (SOURCES.md, GEOMETRY_PROPOSAL.md), `BATCH4_RESEARCH_SUMMARY.md`. Shared pieces: `lessons/shared/speakers/ampModel.ts`, `ampZones.ts`, `signalChain.ts`; `lessons/shared/electric/`.

### C02 Electric Guitar (`source_text/Electric-Guitar-Amplifier-Miking-Technique.txt`, lesson id C02)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| EG-01 | L28 | "Some flat side-address mics are designed to hang in front of an amp … [2]" | Dropped. The mic page teaches the maker's own instruction in general form: a side-address mic hears through its marked front side — face that side to the speaker (check `eg.mic.3`) | Not in either e 906 manual; the manual says "The front of the microphone must face the guitar amplifier." | SN-906-2020 (archived), SN-906-DOC | APPLIED · OWNER: drop "designed to hang" or source it (product page not checked) |
| EG-02 | L7, L86 / ref [2] | e 906 manual PDF link | Not linked (no sources on screen); internal record points to the archived copy and the online manual v1.3 04/2026 | The lesson URL returns 404. | SN-906-2020, SN-906-DOC | APPLIED · OWNER: replace the link |
| EG-03 | L7 | e 906 "region between the dome and cone edge" taken as the same start as Shure's dust-cap/cone line | Two adjacent zones: "Close, at the edge of the dust cap" (r = dust-cap radius) and "Close, half-way out across the cone" (r = 89 mm, half-way between dust cap and surround, optional ~30° turn toward the edge) | The e 906's B position is the MIDDLE between dome and edge, not the dust-cap line (D-EG2). | S-MILLS, SN-906 | APPLIED (`ampZones.ts` eg.boundary, eg.midway) |
| EG-04 | L7, L19 | "toward the edge for a smoother sound" | "smoother and darker" — a tendency to check | The engineer says "duller", the guide "mellow", the e 906 "smoother"; the SM57 guide's table says the opposite direction (D-EG1). Majority kept, said as a tendency. | S-MILLS, S-PGA27, SN-906 | APPLIED |
| EG-05 | (survey) | the wider 10–45 cm (4–18 in) band | Used in the BASS lesson only; the guitar keeps its own rows: close ½–2 in, 2–15 cm, 15–30 cm, 60–90 cm | 4–18 in is the bass article's figure; no guitar source gives it. | S-BASSREC vs S-PGA27 / S-SM57-UG | APPLIED |
| EG-06 | L38 | rear mic, no distance | "Try about 15–30 cm (6–12 in) behind the open back … outside the air space the amp needs", polarity flipped; a hatched keep-out of 6 in behind the combo | No rear distance exists in the research; the maker asks for "at least 6 inches (15.25 cm) of unobstructed air space behind the unit". The band is a drawing default that starts outside it. | S-MILLS, FEN-65DR-MAN | APPLIED · OWNER: confirm the 15–30 cm default |
| EG-07 | L47 | the '65 Deluxe Reverb speaker-load rule, by name | Taught generically: "some amps must never run without their speaker connected — read the amp's own manual" | Model-specific (the lesson itself says so) and no model names on screen. | FEN-65DR-MAN | APPLIED |
| EG-08 | L46 | "OSHA … 85 dBA … action level, not a guarantee" | "A widely used guideline: no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA above that — and below it is not a promise of safety"; not named | OSHA's 85 dBA TWA is its hearing-conservation ACTION level (its PEL is 90 dBA with a 5 dB exchange). The app teaches the more protective 85 dBA / 3 dB guideline used in every miking lesson, keeping the lesson's point that it is no guarantee. | OSHA (acoustic_guitar/SOURCES.md §c), NIOSH (kick/SOURCES.md) | APPLIED |
| EG-09 | (whole lesson) | "Pro Audio Training Academy", "learner" | Not used (house rule) | House rule. | — | APPLIED |

### C08 Electric Bass (`source_text/Electric-Bass-Amplifier-Miking-Technique.txt`, lesson id C08)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| BA-01 | L9 | "10–45 cm (4–18 in)" | 101.6–457.2 mm (exactly 4–18 in): "A little farther — room to breathe" | Conversion of the source's own inches. | S-BASSREC | APPLIED |
| BA-02 | L9 | the dust-cap/cone boundary start attributed to the bass article | Kept as the first zone, but the internal record says the boundary is borrowed from the guitar-amp engineer; the bass article names centre ("bite") and edge ("warm") only | The bass article does not name the boundary. | S-BASSREC, S-MILLS | APPLIED · OWNER: re-cite in the document |
| BA-03 | L38 | lowest E "about 41 Hz" only | Adds the five-string low B ≈ 30.9 Hz (and E1 ≈ 41.2 Hz), in the facts, a check and the quick check | Survey flag: the 5-string B is missing; the DI's low-cut matters more for it. | PHYS-ET (440·2^(−46/12)) | APPLIED |
| BA-04 | L44 | "Ampeg states that its tube-output models generally require a speaker load …" | Taught generically: "some heads must never run without their speaker load — read the manual; when unsure, stop and ask a technician" | The FAQ text fetched did not contain the statement (it may sit in a collapsed answer). | AMP-FAQ (unconfirmed) | APPLIED · OWNER: re-check the FAQ in a browser |
| BA-05 | L6 | Venture Pre/Post definition by name | "Which circuits PRE and POST include is in that head's manual" | Model-specific; no model names on screen. | AMP-VEN | APPLIED |
| BA-06 | L36, L38 | J48 by name: phantom, −15 dB pad, −6 dB at 80 Hz low-cut | Generic DI box: "some need 48 V phantom power"; the low-cut "about 6 dB down at 80 Hz" kept as a number, with the 41 / 31 Hz notes beside it | No model names on screen; the numbers are confirmed. | RAD-J48 | APPLIED |
| BA-07 | (geometry) | a 1 × 15 for the 10/15 comparison | Not drawn; the 10-vs-15 point is in words only ("on some mixed-driver cabinets") | No 15 in cabinet sourced (GEOMETRY_PROPOSAL §1 allows "teach in words"). | S-RHYTHM | APPLIED · OWNER: draw a 1 × 15? |
| BA-08 | L45 | OSHA line | As EG-08 | As EG-08. | OSHA, NIOSH | APPLIED |

### C04 Pedal Steel and Lap Steel (`source_text/Pedal-Steel-and-Lap-Steel-Miking-Technique.txt`, lesson id C04)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| PS-01 | L36 | Peavey XLR "microphone-simulated direct interface" | "Some steel amps have an XLR output that imitates a miked speaker … still electrical" | The Peavey manual (ref [4]) is unreachable (404 / moved); keep model-specific wording out until re-sourced. | PV-NASH (UNREACHABLE) | APPLIED · OWNER: re-find the manual |
| PS-02 | L39 | Peavey tilt-foot warning | "A tilted amp must stand firm and cannot tip if bumped — follow its own manual" | As PS-01. | PV-NASH (UNREACHABLE) | APPLIED |
| PS-03 | L44 | speaker-free operation and speaker-cable note, by model | "Some amps allow running without a speaker under stated conditions; others need their load. Only the model's manual says which"; speaker cable for speaker connections | As PS-01. | PV-NASH (UNREACHABLE) | APPLIED |
| PS-04 | L9 | Shure amp starting points "not steel-specific" | Kept and said on screen ("general amp starting points, tested on a steel's amp — not steel-specific coordinates"); the guitar lesson's combo and zones stand in for the steel amp | The proposal reuses the C02 amp unchanged; the steel amp itself is unsourced. | S-MILLS, S-PGA27 | APPLIED |
| PS-05 | (geometry) | pedal-steel layout | Every dimension (body 900 × 300 × 90, top 700, 3 pedals, 4 knee levers hanging 150, seat 550, 24 in scale, keep-clear zone 1000 × 600, ten-string tuning) is a flagged drawing default; only the part NAMES are sourced | No dimension in the research. | SGF-MAP | APPLIED · OWNER: a steel player's look at the drawings |
| PS-06 | L45 | OSHA line | As EG-08 (and a CRITICAL quick-check item) | As EG-08. | OSHA, NIOSH | APPLIED |
| PS-07 | (whole lesson) | "Pro Audio Training Academy" | Not used (house rule) | House rule. | — | APPLIED |
## C13 Oud (`source_text/Oud-Miking-Technique.txt`)

From oud/SOURCES.md, oud/GEOMETRY_PROPOSAL.md and BATCH4_RESEARCH_SUMMARY.md §2. Built on the shared lute family (`lessons/shared/lutes/`). Learner text names no source, maker or model.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| C13-01 | Core positions A, C, D | A 35–60 cm, C 20–35 cm, D 70–120 cm — the same three trials as the veena lesson; A's support (Fletcher "approximately 1–2 ft", "at least about 18 in") is on a page that no longer answers | The oud's OWN reachable figures: the upper face, between the main rose and the neck, 30–45 cm (12–18 in); closer to the face, 15–25 cm (6–10 in); on stage, within about 13 cm (5 in) of the main rose, a little above it and angled slightly down. A farther room view stays in words, with no number. | The ranges were copied word for word between two instruments; the oud's own reachable practitioner figures are "a foot to a foot and half … pointed roughly around the space in between the soundhole and neck", "maybe 8 inches from the face. It could be more or less", "about 5 inches or less from the main rose, and angled slightly downward". | MO-13902; MO-14024; PSW-19243 (UNREACHABLE) | APPLIED (`lessons/c13Oud/model.ts`) · OWNER: approve the ± 5 cm drawn round "maybe 8 inches" and the 6 cm nearest edge at the rose |
| C13-02 | D | "70–120 cm (2–4 ft)" | Not used (no far number) | A loose conversion (70–120 cm is about 2.3–3.9 ft) of a trial no oud source gives. | lesson | APPLIED |
| C13-03 | whole lesson | no hearing note | Plain hearing line on the setting page and in the checks (85 dBA over 8 hours, halve the time per 3 dBA; a mic's max SPL is not a hearing limit) | The survey flagged C13 with no hearing note. | OSHA (internal) | APPLIED (`lutesContent.ts` LUTE_HEARING, `oud.set.1`, `q.6`) |
| C13-04 | Live, refs [8], [9] | a player's account of a named clip-on as "a mic-like solution" | No model named: a small clip-on device a player calls a mic may be a vibration pickup — label the path for what it is and follow its own manual for power (`oud.set.2`) | The maker describes it as a condenser vibration pickup. | AKG-C411 | APPLIED |
| C13-05 | throughout | names Fletcher, M Ozturk, Mike's Oud Forums, ProSoundWeb, AKG, Shure, DPA | none on screen; "one engineer", "players differ" where it matters | Owner ruling 2026-10-04 (starting-points voice). | — | APPLIED |
| C13-06 | — (geometry) | — | Every oud dimension is a drawing default (face 490 × 360, bowl 180, scale 600, pegbox 190 at 60°, rosettes per the proposal); the bowl is drawn deepest where the face is widest (a drawing rule); eleven strings in six courses | No oud dimension was read; only the three rosettes and the fretless neck are sourced. | MFA-NAHAT; oud/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: check the drawing and the seated posture on the phone |

## C14 Sitar (`source_text/Sitar-Miking-Technique.txt`)

From sitar/SOURCES.md, sitar/GEOMETRY_PROPOSAL.md and BATCH4_RESEARCH_SUMMARY.md §2.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| C14-01 | whole lesson | no hearing note | Plain hearing line (as C13-03) | The survey flagged C14 with no hearing note. | OSHA (internal) | APPLIED (`st.set.1`, `q.6`) |
| C14-02 | A, ref [4] | the close omni "about 20 cm … directed diagonally upward toward the jawari" | A starting point below the bridge, about 20 cm from the board (drawn 17–23 cm), angled up 15–65° at the bridge's top — the small condenser with its omni capsule | CONFIRMED from the archived page (the live URL no longer answers); the tabla article does cover the sitar session. | GEOS (archive) | APPLIED (`lessons/c14Sitar/model.ts` zone `jawari`) · OWNER: the internal record should cite the archive URL |
| C14-03 | B | two cardioids 7–8 in (18–20 cm), high toward the neck, low toward the bridge/body | Two starting points, "about 18–20 cm (7–8 in)", drawn 16.5–21.5 cm; begin with the low one alone; the two-mic page pairs them | CONFIRMED ("about 7–8"" → 17.8–20.3 cm). | S-DUVEL | APPLIED (zones `low`, `high`; copy `twoMic`) |
| C14-04 | E, Multiple microphones | the immersive session's "omnidirectional" room capsules | No model and no pattern label from the article on screen; the many-mic session is in words as one production's choice | The article calls a cardioid capsule omni; the maker lists it as cardioid. | IMRSV; SCH-CARD | APPLIED |
| C14-05 | A, C | A 25–45 cm and C 60–100 cm are teaching trials | A kept as a zone (a place to begin); C in words only | Neither is a sitar source's figure; the far view needs the room. | lesson | APPLIED |
| C14-06 | — (geometry) | proposal: neck x ∈ [+160, +1080], upper gourd at +950 | The sourced 124.5 cm wins: the nut at +880, the neck's top end at +1005, the upper gourd at +860; 19 frets as a diatonic run (movable frets: a drawing default); the gourd as a cut ellipsoid whose depth (31 cm) and width (34.3 cm) are the Met's | The proposal's defaults overran the sourced overall length. | MET-ADHIKARI | APPLIED (`lessons/shared/lutes/luteSpec.ts`) · OWNER: check the drawing and the floor posture on the phone |
| C14-07 | L5, troubleshooting | "sympathetic decay … if present"; "confirm the instrument has sympathetic strings and that the player's passage excites them" | A sympathetic-strings step on the sound page: the ideal-string model shows WHICH shapes of a played note line up with a sympathetic string's (same note: all eight; octave: four; fifth or fourth: two; semitone: none) — never a level | The mechanism behind "excites them", from the lab's tested string model (LESSON_JOURNEY §7); no amount is claimed. | stringPhysics / sympathetic.ts (tested) | APPLIED (`lessons/shared/lutes/sympathetic.ts`, `LuteSound.tsx`) |
| C14-08 | L5 | "bridge buzz … the player's intentional jawari character" | In words: the strings graze the broad, gently curved bridge top as they swing — the buzz the player sets, never adjusted for a mic | Consistent with the Met's veena record ("strings vibrating against a flat bridge"); no model is drawn for it. | MET (veena record); lesson | APPLIED |

## C15 Saraswati Veena (`source_text/Saraswati-Veena-Miking-Technique.txt`)

From veena/SOURCES.md, veena/GEOMETRY_PROPOSAL.md and BATCH4_RESEARCH_SUMMARY.md §2.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| C15-01 | Methods A, C, E | A 35–60 cm, C 70–120 cm "(2–4 ft)", E 20–35 cm — the oud lesson's trials, word for word | One band derived from the VEENA: 30–50 cm (12–20 in) from the top plate, out of the plucking hand's reach — aimed at a broad area of the plate between the bridge and the body (A), or turned toward the bridge (B). C and E stay in words. | 30 cm = where a cardioid's ±30° view first takes in the Ø 34 cm plate (170 / tan 30° ≈ 29 cm); 50 cm = a radius at which the plate's radiation was mapped ("R = 0.5 m"). The study gives no best distance — the app says so (`vn.place.3`). | EXT-23505; MET-506151 | APPLIED (`lessons/c15Veena/model.ts`) · OWNER: approve the derivation |
| C15-02 | whole lesson | no hearing note | Plain hearing line (as C13-03) | The survey flagged C15 with no hearing note. | OSHA (internal) | APPLIED (`vn.set.1`, `q.6`) |
| C15-03 | rudra veena, ref [10] | "The Met documents this distinct layout" (a two-gourd rudra veena) | A short note and one check: a two-gourd veena such as the rudra veena is a different instrument — work out its geometry with its player. Not drawn. | The Met titles object 500718 "Ranjanî vînâ"; it is not called a rudra veena without a source. | MET-500718 | APPLIED (`copy` variantNotes, `vn.set.2`) |
| C15-04 | ref [1] | "Saravatī Vīnā" | unchanged | The Met's own spelling (survey flag withdrawn). | MET-505701 | NO CHANGE |
| C15-05 | Choose a microphone | one engineer's windscreen and grille removal | "Keep a mic's protective parts on unless its maker allows it" (`vn.mic.1`); no names | Kept the lesson's own warning; brands off screen. | PIANOBOOK | APPLIED |
| C15-06 | — (geometry) | proposal: neck to +1000, gourd at +900; resonator Ø 340 × 300 | The sourced 121.5 cm wins: the nut at +860, the gourd at +700, the yali to the sourced tip; the resonator drawn round-bellied (its opening, under the plate, narrower than its belly — depth 30 cm, width 34 cm, as the sitar's gourd); posture: the face tilted 20° up toward the player (the proposal; the holding guide's text could not be read), the neck rising 7° so the gourd sits about 13 cm above the floor, on the thigh | The proposal's defaults overran the sourced length; a deep egg-shaped bowl did not read as a veena. | MET-506151; SIV-HOLD (unreadable) | APPLIED · OWNER: check the posture and the yali on the phone |
| C15-07 | Live | "Check the actual loudspeaker and wedge angles against the mic's rejection pattern" | The live page uses a SIDE-FILL on a stand: a mic looking down at the veena has its rear toward the ceiling and the side, where a null can reach; a floor wedge in front sits at its side, beyond any null — the page shows both | Pattern geometry (tested: the side-fill is reachable by aim, the floor wedge is not). | engine polar model | APPLIED (`lutesContent.ts` veenaWedges, `copy.ts` context) · OWNER: approve the side-fill as the stage default |


## Lab 2 · the electric pianos: I11a Rhodes, I11b Wurlitzer

Built 2026-10-05 (branch `miking-i3`, from `final-lab` 4334be8b). Research: `rhodes/`, `wurlitzer/` (SOURCES.md, GEOMETRY_PROPOSAL.md), `BATCH2_RESEARCH_SUMMARY.md`. Shared pieces: `lessons/shared/keys/` (keysSpec.ts with the new `SPEAKER_OVAL_4x8`, wurliModel.ts, rhodesZones.ts, the art, the pages); the speaker family reused (`ampModel.ts`, `ampArt.tsx`, `signalChain.ts` + `DiPath.tsx` gained optional node icons, `electric/ampPages.tsx` gained optional art / dock words / start pose / worked-example words). Line numbers are the source .txt's own lines.

### I11a Rhodes (`source_text/Rhodes-Miking-Technique-Research.txt`, lesson id I11a)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| RH-01 | L4, L88 / ref [2] | the physical tine/tonebar/pickup cited to the "Rhodes V8 Manual … p. 7" | The mechanism is taught from the 1979 service manual ("modified tuning forks … Tone Bar Assemblies … adjacent to an adjustable Pickup"; the tonebar "does vibrate at the same frequency") and the 73-key model's user manual (steel tines and tonebars, wound pickups); no source shown | [2] is the manual of a SOFTWARE plug-in, and the text is on p. 6, not 7 (survey flag). | RH-SM79, RH-MK8-UG (RH-V8 kept as secondary only) | APPLIED (`shared/keys/keysSpec.ts` TINE, `i11aRhodes/lesson.ts`) · OWNER: replace [2] |
| RH-02 | L10 | "trial about 2–15 cm (1–6 in) from the grille" | "about 2.5–15 cm (1–6 in) from the grille" — the zone is exactly 1–6 in (25.4–152.4 mm), measured by the lab from the grille cloth | The figure is the mic maker's general AMPLIFIER row ("1-6 inches (2-15 cm)"), measured from the amp; the grille reference is the lab's convention. 1 in = 2.54 cm. | S-PGA27 | APPLIED (`shared/keys/rhodesZones.ts`) |
| RH-03 | L11 | centre brighter, edge "mellower" | "toward the edge tends to be warmer and rounder — a tendency to check" | Two guides agree (brighter centre; "warmth and bass" / "duller" toward the edge); the SM57 guide states the opposite (D-L2). Said as a tendency. | S-GTR, S-MILLS, S-PGA27 | APPLIED |
| RH-04 | L39 | the 73-key model's "balanced XLR outputs for mic-level inputs" and the passive model's jack, by model name | Taught without names: a passive model has one jack for an amp, DI or preamp; some models have balanced XLR outputs meant for MIC-level inputs — "check the manual; a connector does not tell you the level" | No model names on screen; both facts confirmed. | RH-MK8-UG, RH-S61 | APPLIED |
| RH-05 | L7, L49 | "do not move pickups … [4]" | Kept as an instrument rule ("never move a pickup — a technician's job"); a clanking note is a STOP item (check, symptom) | Confirmed: the maker warns that too-close spacing causes pitch change and a "nasty metallic clank". | RH-MK8-UG p.29 | APPLIED |
| RH-06 | L6, L84 | Suitcase speakers | A text note only: "a suitcase model stands on its own amplifier and speakers, with a stereo panning effect: do not assume how many there are or which way they face" — nothing drawn | The speaker layout is only in retailer listings (Low). | RH-V8 (panning, High as quoted); retailer (Low) | APPLIED · OWNER: a maker source for the suitcase layout? |
| RH-07 | L49 / ref [8] | NIOSH by name | "A widely used guideline: no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA" (critical quick-check item) | House wording for every miking lesson; no named authority on screen. | NIOSH (kick/SOURCES.md) | APPLIED |
| RH-08 | (whole lesson) | "Pro Audio Training Academy", "student" | Not used | House rule. | — | APPLIED |

### I11b Wurlitzer (`source_text/Wurlitzer-Miking-Technique-Research.txt`, lesson id I11b)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| WU-01 | L6 | 200 / 200A by model number; "Vintage Vibe documents …", "Tropical Fish … notes …" | "the earlier model" (speakers on the amplifier's rail) and "the later model" (speakers screwed to the lid, which becomes their baffle, and can rattle) — no model numbers or sources on screen | House rule; the facts are confirmed. | TF-DIFF, VV-200A | APPLIED |
| WU-02 | L10, L12 | "roughly 2.5 cm (1 in) away, off center and slightly angled" | Zone "Close, off-centre, at a slight angle": 2–4 cm band round 1 in, off-centre by half the oval's long semi-axis (50.8 mm ± 15), 5–30° off the grille's normal | The research gives 1 in only; the band, the off-centre amount and the angle range are flagged drawing defaults (GEOMETRY_PROPOSAL). | TF-REC | APPLIED (`shared/keys/wurliModel.ts`) · OWNER: confirm the defaults on a real instrument |
| WU-03 | (geometry) | case and grille positions | Case 1020 × 500 × 230 on legs (keys at 720), grilles at ±260 mm in the lid's front slope tilted 20° up; never shown as numbers; the key count (64, Low) drawn only as a pattern | UNKNOWN in the research (the service manual has no text layer). | WUR-SM (image only) | APPLIED · OWNER: measure a real 200A |
| WU-04 | L50 / ref [1] | high-voltage pickup cited to the service manual | The safety rule is kept, in plain words ("mains power and a high-voltage pickup; unplugging alone does not make it safe to open") | The manual is image-only: the citation cannot be quoted today. The rule is conservative, so it stays. | WUR-SM (not verifiable) | APPLIED · OWNER: read the manual pages as images |
| WU-05 | (survey) | 200A release year | Not stated | Tropical Fish says 1974, Vintage Vibe 1975 (WUR-D1); no date is needed to mic it. | TF-DIFF, VV-200A | APPLIED |
| WU-06 | L8, L89 | "vibrato" | "Its “vibrato” is a tremolo: a pulse in LEVEL, not pitch — and not left-to-right movement"; drawn as a level pulse on the scope | Confirmed (bias-shifting / LDR vibrato; the 200A's tremolo depth pot). | TF-DIFF, VV-200A | APPLIED |
| WU-07 | L41-L42 | aux output on "200-series instruments" | "A usable auxiliary output on many of these instruments; on the later model a small trim sets its level. Confirm the labelled jack with the owner"; a speaker output never to a desk input — a rated load device is technician work | Confirmed; model-specific wording kept generic. | TF-REC | APPLIED |
| WU-08 | L51 / ref [8] | NIOSH by name | The 85 dBA / 3 dB guideline (a setting check) | As RH-07. | NIOSH | APPLIED |
| WU-09 | (whole lesson) | "Pro Audio Training Academy", "students"; "the Aerophones Lab begins with trumpet" | Not used | House rule; the lab order is not learner content. | — | APPLIED |
| WU-10 | (geometry) | room mic "toward the audience side" | "Farther away, for the instrument and the room": 60–90 cm from the BACK of the case (the audience side), about the lid's height — studio only | The speakers face the player, and a room mic on the player's side would sit in the player; the cabinet's 60–90 cm row is borrowed (TRIAL). | S-SM57-UG (cabinet row) | APPLIED · OWNER: confirm |

## Lab 2 · the mallet keyboards: I07 Vibraphone, I08 Marimba, I09 Xylophone, I10 Glockenspiel

Built 2026-10-05 (branch `miking-i2`, from `4334be8b`). Research: `vibraphone/` (SOURCES §0–§1, GEOMETRY_PROPOSAL §A the family), `marimba/`, `xylophone/`, `glockenspiel/`, `BATCH2_RESEARCH_SUMMARY.md`. Shared family: `lessons/shared/mallets/` (malletSpec, malletModel, MalletArt, MalletSound, MSound, MTwoMic, MalletPlan, content, malletMics). Lesson keys `LESSON-VIBE` / `LESSON-MAR` / `LESSON-XYL` / `LESSON-GLK` added to each folder's SOURCES.md.

### Shared across the four lessons

| id | Where | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| I2-F1 | (frame) | frame M: +x toward the audience, +z toward the treble | +x toward the LOW end, +z toward the AUDIENCE (same origin, same numbers) | Both engine views read from the audience side, where the stands are: the side view is the front elevation (low end on the right), the top view the plan with the audience below. A relabel — no dimension changes | vibraphone/GEOMETRY_PROPOSAL.md §A1 | APPLIED · OWNER: confirm the audience-side views |
| I2-F2 | (layout) | row lines at 0.22 × the mean depth | held to at most (Dlow − longest bar) ÷ 2 − 10 mm so the longest bar stays inside the frame (the 3½-octave xylophone's rectangle would otherwise let it overhang by 15 mm) | Drawing default refined | §A3 | APPLIED |
| I2-F3 | (layout) | Helmholtz box 150 × 120 cross-section | 150 mm deep (across the rows) × as wide as the bar pitch allows (≤ 120), down to 150 mm above the floor | A 120 mm box is wider than the 78 mm bar pitch | marimba/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: box size |
| I2-F4 | (mount) | — | Every stand stands on the audience side; its boom runs level over the keyboard whatever the mic's aim (engine `MountRule.fixed`, added) | A coincident mic tilted along the keyboard would otherwise drop its stand into the instrument | — | APPLIED |
| I2-F5 | Shure two-mic row | "about 1 1/2 feet above it, spaced 2 feet apart, or angled 135° apart with grilles touching" | "about 46 cm (1½ ft) … about 61 cm (2 ft)"; the 135° pair is called COINCIDENT and drawn grilles together, each mic 67.5° from straight down | 457.2 / 609.6 mm exact; the guide lists 135° under "Coincident Techniques" | S-LIVE, S-RECBK | APPLIED |
| I2-F6 | (sound) | — | HOW IT SOUNDS shows a PLAIN (uniform) bar's first three shapes (free–free beam: 1 : 2.76 : 5.40, still points at 0.224) and says real bars are tuned by shaping; the resonator as a quarter wave c ÷ 4f at A = 442 Hz, 20 °C | Textbook physics + the makers' tuning pitch; the maker's mode figure (YMH-MG3) was not read | YMH-MG2, YMH-YV2700, CALC-C | APPLIED |
| I2-F7 | Hearing lines | NIOSH-TID "Turn It Down" (no exchange rate in it) | "a widely used guideline: 85 dBA averaged over 8 hours, halving the time for every 3 dBA more" — as every miking lesson | Parity with EG-08 | NIOSH-TID, kick NIOSH | APPLIED |
| I2-F8 | All four | "Pro Audio Training Academy", "No audio examples" | Not used; fully silent | House rule; owner ruling | — | APPLIED |
| I2-F9 | Mic types | — | Two family types: a pencil condenser (cardioid / omni) and a compact cardioid dynamic, with mallet words | "Condenser mics are a common practical option … A suitable dynamic can also work in a difficult live setup" | LESSON-VIBE L13, S-SM57-UG, AX-SCX1 | APPLIED |

### I07 Vibraphone (`source_text/Vibraphone-Miking-Technique-Research.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| I2-V1 | L10 | one mic 45–75 cm "reasoned trial" | zone "One mic above the middle of the keyboard", 450–750 mm, within 30 cm of the middle, aimed within 30° of down | The lesson's own band; tolerances the lab's | LESSON-VIBE | APPLIED |
| I2-V2 | L11 | resonator openings "from underneath" as a deliberate alternative | zone "Under the tubes, aimed up — an alternative", under the high third, 25 cm above the floor to 12 cm below the tube ends | The tube's mouth is at the TOP (closed bottom, YMH-MG2): "underneath" read as under the instrument | LESSON-VIBE, YMH-MG2 | APPLIED · OWNER: keep this zone? |
| I2-V3 | L6 | motor speed | "about 25–150 turns a minute"; fans drawn as one disc per tube on a shaft per row, opening the tube twice a turn (DERIVED); run 8 s, pausable | The maker prints "25-150 rmp" [sic]; fan size UNKNOWN (drawing default 0.9 × tube) | ADAMS-VIBC, YMH-FANS | APPLIED |
| I2-V4 | L4, L6 | "optional or absent motor" | a NO MOTOR setup, drawn without fans | Whether a no-motor model keeps fan shafts is not in the research | YMH-YVRD2700, ADAMS-VIBC | APPLIED · OWNER: confirm |

### I08 Marimba (`source_text/Marimba-Miking-Technique-Research.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| I2-M1 | L7 | hard mallets "especially on thin low-register bars" | "a hard head can damage wooden bars" (no register named) | Not on the maker's mallet page | YMH-MAL | APPLIED |
| I2-M2 | L76 | "a near-coincident pair" | "a coincident pair (grilles together, 135°)" | Survey flag resolved (I2-F5) | S-LIVE | APPLIED |
| I2-M3 | L17 | "60 cm may be too narrow" | a third TWO MICROPHONES setup, "wider spaced pair — to try": 120 cm apart, 70 cm high | Drawing default for the lesson's advice | LESSON-MAR | APPLIED · OWNER: approve |
| I2-M4 | (drawing) | lowest bar 80 mm (one maker) vs 72 mm (another) | 72 mm (the drawn model's) with the other maker's ~620 mm length | MAR-D1 | ADAMS-ALPHA, YMH-MG1 | APPLIED |
| I2-M5 | (drawing) | Helmholtz C2–F2 | boxes C2–F2; F♯2 upward straight pipes (the lowest end ~35 mm above the floor) | The maker's split; arches not drawn ("visible pipe ≠ pitch" said in words) | YMH-YM5100A, YMH-MG2 | APPLIED |

### I09 Xylophone (`source_text/Xylophone-Miking-Technique-Research.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| I2-X1 | L74 | "a near-coincident pair" | "a coincident pair" | I2-F5 | S-LIVE | APPLIED |
| I2-X2 | L7, L46 | plastic mallets "differ in specificity" | "Advice on other materials differs between documents: this instrument's maker and its owner decide" — taught as a disagreement; never metal | One educator PDF: "Plastic mallets damage bars and must be avoided!"; another page: "on rosewood xylophones, use plastic, not metal" (XYL-D2) | YMH-JENKS-ARC, YMH-DECON, YMH-CARE | APPLIED |
| I2-X3 | (pitch) | — | the range is the SOUNDING F4–C8 ("an octave higher than written"); tube lengths use sounding pitch | Jenks: "sound one octave higher than written" | YMH-JENKS-ARC | APPLIED |
| I2-X4 | L10 | "a safe off-axis position" | zone on the audience side, 60–90 cm from the middle, 35–55° from straight up, aimed back | Drawing default for the lesson's words | LESSON-XYL | APPLIED · OWNER: approve |
| I2-X5 | ref [5] | dead link | (no links on screen) internal record points to the archive copy | | YMH-JENKS-ARC | APPLIED |

### I10 Glockenspiel (`source_text/Glockenspiel-Miking-Technique-Research.txt`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| I2-G1 | L9 | Shure "4 - 6 inches above bars" | drawn as a RED band over the played bars, inside the mallets' travel (25 cm drawing default); never a zone; a check and the placement words say "only if the player proves every stroke clears it" | The lesson's own point; the geometry file asks the app to show the conflict | S-LIVE, S-RECBK | APPLIED |
| I2-G2 | L11 | 30–60 cm trial | two zones, "Closer" 30–45 cm and "Higher" 45–60 cm (5–35° from straight up, toward the audience), plus a lateral angle (40–70 cm, 45–65°) on the frame model | L12 "compare a higher, more integrated view with a closer, more immediate view"; L11 "compare with a safe lateral angle"; the case model's open lid blocks the low lateral view | LESSON-GLK | APPLIED · OWNER: approve |
| I2-G3 | L82 | aluminium vs steel | steel bars | GLK-D1: the general article says aluminium; the YG-2500 manual, YG-1210, Adams and the educator PDF say steel | YMH-YG2500-OM | APPLIED |
| I2-G4 | (range) | "4 1/3 octaves" (spec page) | "about three and a third octaves (C5 to E8)" | GLK-D2 | YMH-YG2500 | APPLIED |
| I2-G5 | L16 | near-coincident pair, no dimension | near-coincident 17 cm / 110° and spaced 40 cm, both 45 cm above the bars — drawing defaults, said so on the page | No published glockenspiel pair | LESSON-GLK | APPLIED · OWNER: approve |
| I2-G6 | (drawing) | YG-1210 case | the case on a 760 mm table, 78 mm base + 30 mm lid, the lid open 90° on the audience side (drawn see-through in the front view); the floor moves so the bars keep one plane | Drawing defaults | YMH-YG1210 | APPLIED · OWNER: lid hinge side |

## Lab 2 · suspended metal: I06a Triangle, I06b Finger Cymbals, I06c Bar Chimes, I12 Gong

Research: `triangle/`, `finger_cymbals/`, `bar_chimes/`, `gong/` (SOURCES.md + GEOMETRY_PROPOSAL.md) and
BATCH2_RESEARCH_SUMMARY.md. The app shows starting points only (owner ruling 2026-10-04): the corrections
below are applied to the APP text; nothing in `source_text/` is edited.

### I06a Triangle (`source_text/Triangle-Miking-Technique-Research.txt`, lesson id I06a)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| TRI-01 | L43 | "a failed line can drop a heavy metal instrument" | "a worn line can drop the instrument; the catch line is the backup" (no "heavy") | An 8 in triangle of ½ in steel rod is about 0.6 kg (DERIVED order of magnitude) — "heavy" overstates it; the safety point (a catch line) stays. | triangle/SOURCES.md (DERIVED row), GROVER-TRI | APPLIED (`lessons/i06aTriangle/lesson.ts` tri.set.2, setting) |
| TRI-02 | L6 | Grover "prefers playing handheld at eye level"; PAS mounting "when needed" | Both kept as the player's choice: HELD (in front of the chest, drawn) and MOUNTED variants; eye level in words; no "never" | Grover's primer says it "should never be played when mounted on a music stand"; PAS allows two clips at both closed vertices. The lab teaches neither as dogma. | GROVER-TRI, PAS-1906 | APPLIED · OWNER: TRI-D2 (which hold to draw by default) |
| TRI-03 | L6 | suspension advice credited to PAS [1, 3] | The thin line AND the catch line are taught; internally sourced to Grover's primer as well | The catch-line sentence is in Grover's primer, not only PAS. | GROVER-TRI | APPLIED (internal `prov`) |
| TRI-04 | L11 | "Shure's general beginner advice gives a 30 cm gap for percussion" | The 30 cm floor is every zone's minimum, said as a general starting floor, unbranded; measured from the triangle where it is played | No source names the reference point; "from the instrument" is the source's words. | S-HOME | APPLIED (`geometry.ts` tri.A/B/C) |
| TRI-05 | (physics) | — | HOW IT SOUNDS draws the triangle as the straight bar it was bent from (free–free shapes 1 : 2.76 : 5.40 : 8.93 : 13.34), said once as a simplified picture | The lesson has no physics; the bar model is textbook and the app's own plate model uses the same beam constants. | metalModes.ts | APPLIED |
| TRI-06 | header | "Pro Audio Training Academy", "Students" | Not used | House rule. | — | APPLIED |

### I06b Finger Cymbals (`source_text/Finger-Cymbals-Miking-Technique-Research.txt`, lesson id I06b)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| FC-01 | L7 / ref [2] | PAS Educators' Companion "Volume II" | Internal record cites the extract as read (its page footer reads "Volume I 23") | Citation detail only; no source on screen. | finger_cymbals/SOURCES.md (FC-D1) | APPLIED (internal) · OWNER: fix the reference in the document |
| FC-02 | L4 | "The Metropolitan Museum of Art classifies a pair of tal as an idiophone" | "concussion idiophones" in plain words; the drawn pair is a measured museum pair (5.5 / 4.8 cm, 2.4 cm high), said as "one measured pair, not a standard" | No institution names on screen; modern pairs' sizes are not printed by the makers read. | MET-TAL | APPLIED |
| FC-03 | L8 | thick vs thin pair (one maker's line) | "one maker describes its thin pair as lower-pitched than its thick — compare the real pairs"; a check (fc.mix.1) teaches that it is not a rule across makers | Keeps the lesson's own caution; no brand on screen. | ZIL-FCTHIN, ZIL-FCTHICK | APPLIED |
| FC-04 | L15, L42 | dance: "a wider or overhead position"; "a wearable mic … is not a default" | DANCE variant with its own zones (high and in front, 1.3–1.9 m; farther out, 1.9–2.6 m), all outside a drawn dance envelope and route; wearable mic said as not a default | Envelope and route are drawing defaults (owner to check). | finger_cymbals/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: dance envelope and route |
| FC-05 | header | "Pro Audio Training Academy" | Not used | House rule. | — | APPLIED |

### I06c Bar Chimes (`source_text/Bar-Chimes-Miking-Technique-Research.txt`, lesson id I06c)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| BC-01 | L8 | Grover's Spectrasound "title only" (survey) | The page's construction text is used internally: bars on filaments from a hardwood mantle, an optional damper | The page has the text (filament, damper). | GROVER-MT35 | APPLIED (internal `prov`) |
| BC-02 | L5 / PAS | "any model … between the size of 12" – 16"" | A 38 cm rail, said as "a rail about 30–40 cm long" | Read as the rail's length — an interpretation, recorded in `unknowns`. | PAS-ECV02 | APPLIED · OWNER: confirm the reading |
| BC-03 | (geometry) | — | Bar lengths (300 → 60 mm), Ø 10 mm, filaments 15 mm, rail section, swing ±20° — flagged drawing defaults | No source gives any bar size. | bar_chimes/SOURCES.md | APPLIED · OWNER: bar lengths |
| BC-04 | (physics) | "Different bar lengths can produce different perceived pitches" | Pitch ∝ 1 ÷ length² for bars of one thickness and metal (half the length → four times the pitch), drawn per bar | Textbook free–free bar scaling; the lesson's qualitative line made exact. | metalModes.ts | APPLIED |
| BC-05 | header | "Pro Audio Training Academy" | Not used | House rule. | — | APPLIED |

### I12 Gong (`source_text/Gong-Miking-Technique.txt`, lesson id I12)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| GG-01 | (whole lesson) | no hearing line | A hearing check and a critical quick-check item (85 dBA / 8 h, 3 dB exchange, as plain advice; a mic's max SPL is not a hearing limit) | Survey/research: the gong lesson had none. | NIOSH-TID (shaker/SOURCES.md §0) | APPLIED |
| GG-02 | L5 | "the Met describes a particular tuned Chinese luo" | No institution named; the two kinds the app draws are a 32 in symphonic tam-tam and an 18 in bossed gong | The luo is a particular object; the selector teaches tam-tam vs bossed. | MET-LUO, PAI-GONG, SONVO | APPLIED |
| GG-03 | L30 | the practitioner's claim that a ribbon's pattern avoids phase issues | Taught as a misconception (gg.two.3): spaced mics still hear the gong at different times, whatever their patterns | The lesson already rejects it; the app makes it a check. | SOURCES_SHARED.md §2 | APPLIED |
| GG-04 | L24 | A 60–120 cm and B 30–60 cm "proposed classroom starting ranges" | Recommended starting points, measured from the face at rest; the room mic drawn at 1.8–2.6 m (the proposal's 3000 mm shortened to fit the view) | Unsourced trials (the lesson says so); the room distance is a drawing default. | gong/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: room-mic distance |
| GG-05 | (geometry) | — | Strike point a little off centre (0.25 R) on a tam-tam — a drawing default; the maker's figure was not read as text | Recorded in `unknowns`. | PAI-SUP | APPLIED · OWNER: strike point |
| GG-06 | (physics) | "broad, complex bloom" | The build-up drawn as which free-disc shapes hold the energy at each event (never a time or a level); a centre/boss stroke drives only the ring-shaped shapes (J_n(0) = 0, n ≥ 1) | Shown visually, never played (task brief); qualitative order of events only. | metalModes.ts | APPLIED |
| GG-07 | header | "Pro Audio Training Academy" | Not used | House rule. | — | APPLIED |

## Lab 2 · the cymbals on the shared kit: I01a Hi-Hat, I01b Ride, I01c Crash, I01d Splash, I01e China

Built 2026-10-05 (branch `miking-i1`, from `4334be8b` on `final-lab`). Research: `hihat/`, `ride_cymbal/`, `crash_cymbal/`, `splash_cymbal/`, `china_cymbal/` (SOURCES.md, GEOMETRY_PROPOSAL.md) and `BATCH2_RESEARCH_SUMMARY.md`. Shared: `lessons/shared/cymbals/` — the family files `cymbalSpec.ts`, `CymbalArt.tsx`, `cymbalModes.ts` unchanged; the Lab 2 additions in NEW files beside them (`cymbalFx.ts`, `CymbalFxArt.tsx`, `CymbalKitArt.tsx`, `CymbalStrikeFx.tsx`, `CymbalSound.tsx`, `CymbalSettingPlan.tsx`, `cymbalLesson.ts`, `cymbalItems.ts`, `cymbalCommon.ts`, `cymbalCopy.ts`, `cymbalMics.ts`).

### I01a Hi-Hat (`source_text/Hi-Hat-Miking-Technique-Research.txt`, lesson id I01a)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| HH-01 | L21, L52 | "Shure explicitly describes angling a snare mic somewhat toward the hi-hat", set against LEWITT's rear rejection as if the makers disagree | Both snare-mic strategies are taught as one choice by goal: angle the snare mic a little toward the hats to cover both on one channel, OR aim its rejection at the hats to keep them apart (card `hh.mix.3`, placement LEARN) | The same Shure booklet gives BOTH strategies: "aim the null of the snare mic towards the hi-hat" and "angle snare drum microphone slightly toward hi-hat" (HH-D2). It is not Shure vs LEWITT. | S-LIVE (drum-kit intro; item 5); LW-1MIC | APPLIED (`i01aHiHat/copy.ts`, `lesson.ts`) |
| HH-02 | L36 | Shure article: pencil condenser "roughly 10–15 cm away, pointing down near the far edge away from the snare" | Zone "Over the far edge, away from the snare": 10–15 cm above, directly over the edge on the far side, pointing straight down | Shure's words are "pointing directly down at the edge on the far side, away from the snare". | S-REC1 (Nov 06 2022) | APPLIED (`i01aHiHat/model.ts` `hh.farEdge`) |
| HH-03 | L36, L42 | "away from the snare" and "a few inches over edge away from drummer" read as one position | Two different directions: the lab draws the far side, away from the snare (and from the player); "away from the drummer" is said in words | S-REC1 says away from the snare; S-LIVE says away from the drummer. On the shared kit the 16 in crash hangs over the hats' audience side, so a stand mic there runs into it. | S-REC1; S-LIVE item 5 | APPLIED · OWNER: confirm |
| HH-04 | L36, L39, L42 | Six close starting points | Four zones (above the bow with the snare hidden; over the far edge; a few centimetres over the outer edge; under the bottom cymbal on a clip). "Within four inches" and "just below the cup" are said in words (the closeness limit; the aim idea) | Proposal §7 owner question 3: show the ones that are different places to begin. | S-RECBK; S-RHYTHM; DPA-HH; SN-E914 | APPLIED · OWNER: which to show |
| HH-05 | L42 | "a few centimetres above the outer edge" | "a few centimetres — about 4.5–6.5 cm (2–2.5 in)" | No number is published; the band starts where a small dynamic's body clears the top cymbal and its opening travel. A drawing default. | SN-E914 (archived PDF; online manual same text) | APPLIED (`hh.edgeLow`) · OWNER: approve |
| HH-06 | L28 | Underside mic, no distance | "about 5–8.5 cm under the bottom cymbal, 10–15 cm out from the stand, on the audience side", on a stand clip | No distance is published for the underside (drawing default); the clip on the stand is the maker's own suggestion. | DPA-HH | APPLIED (`hh.under`, `hh.underOpen`) · OWNER: approve |
| HH-07 | L42 / ref [6] | e 914 PDF link | Not linked (no sources on screen); the internal record points to the archived copy and the online manual | The lesson URL returns 404 (HH-D3). | SN-E914, SN-E914-DOC | APPLIED · OWNER: replace the link |
| HH-08 | L10 | NIOSH 85 dBA line | Kept as plain advice, not named: "a widely used guideline: no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more"; a CRITICAL quick-check item (hearing) in every cymbal lesson | The hearing line stays (owner: safety stays, in plain words). | NIOSH | APPLIED (`shared/cymbals/cymbalItems.ts`) |
| HH-09 | (drawing) | — | The family draws the OPEN pair with the bottom cymbal lowered ½ in; the words say the TOP cymbal moves (the pull rod) | The shared family's drawing convention (unchanged); on a real stand the top cymbal rises. The gap is what the lesson uses. | DPA-HH (pair); cymbalSpec.ts | APPLIED · OWNER: redraw the family's open pair? |
| HH-10 | (geometry) | "5–10 cm from the top of the hi-hat cymbal" | Measured square to the top cymbal's EDGE PLANE (the plate's surface is ≤ 8 mm above it over the bow) | The engine measures from a plane; the bow's height above the edge plane is a family drawing default. | DPA-HH; cymbalSpec.ts | APPLIED |
| HH-11 | L2 | "Pro Audio Training Academy", "Student" | Not used | House rule. | — | APPLIED |

### I01b Ride Cymbal (`source_text/Ride-Cymbal-Miking-Technique-Research.txt`, lesson id I01b)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| RD-01 | L23 | Shure: condenser "about 1–2 ft above" the ride | A zone "A foot or two above, for the cymbals", taught as a mic for the ride AND the other cymbals (not a spot), 30.5–61 cm | Shure's sentence: "To pick up the rest of cymbals, place another condenser near the ride cymbal, a foot or two above." | S-AL1568 | APPLIED (`i01bRide/model.ts` `ride.area`) |
| RD-02 | L11 / [6] | "a separate small condenser" (unnamed) | No model on screen; the internal record names it | The interview names the model (RIDE-D1). | S-BEYOND | APPLIED (internal only) |
| RD-03 | L29 / [8] | "4015 tucked underneath every single cymbal" attributed to & Juliet | The under-mic is taught generically ("some engineers mic cymbals from below"); no show named | The quote is about a different show in the same article (RIDE-D2). | DPA-JULIET | APPLIED · OWNER: fix the attribution in the document |
| RD-04 | L26, L29 | Spot over the bow; underneath — no distances | "15–30 cm above the bow"; "8–15 cm under the ride" | Drawing defaults (proposal: "no source gives a spot distance"). | ride_cymbal/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve |
| RD-05 | (sound) | — | "Near the held centre, MOST shapes barely move (a few, with a still ring, do)" | The plate model's (1,1) and (2,1) shapes move near the bell; "all shapes" would be wrong. | cymbalModes.ts (the Cymatics plate model) | APPLIED (`rd.snd.3`, shapes note) |
| RD-06 | L13 | No universal safe clearance | Kept: the swing and the stick's side are the lab's drawn keep-outs, said once | Consistent with the research. | — | APPLIED |

### I01c Crash Cymbal (`source_text/Crash-Cymbal-Miking-Technique-Research.txt`, lesson id I01c)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| CR-01 | (whole lesson) | No published distance for a crash | Said in plain words ("no one number is published for a crash"); above 20–35 cm and under 12–20 cm as places to begin | No source gives a number; the bands are drawing defaults. | crash_cymbal/SOURCES.md | APPLIED · OWNER: approve the bands |
| CR-02 | L8 | Overheads first | "The overheads usually carry the crashes first" — a check to make, not a rule | No maker sentence says it of crashes (Shure's line is about the hi-hat); the lesson's generalisation is kept as a tendency. | S-REC1 | APPLIED |
| CR-03 | L31 / [6] | A touring account: compact directional mics under the cymbals because of wedge spill | STUDIO OR LIVE teaches the reason generically: under a cymbal, aimed up, the mic's rejection faces the floor wedges | The account names the model (internal only). | DPA-KILLERS | APPLIED |
| CR-04 | (geometry) | Glancing blow / "J" stroke | The stick's side reaches 25 cm past the edge and 15 cm down | The proposal's ko.stroke (ILLUSTRATIVE). | ZIL-L11, ZIL-FAQ | APPLIED · OWNER: approve |
| CR-05 | L15 | "the plate can flex downward or rock toward it" | The under band starts below the ± 60 mm swing and the proposal's 80 mm downward flex band | Drawing defaults. | crash_cymbal/GEOMETRY_PROPOSAL.md | APPLIED |

### I01d Splash Cymbal (`source_text/Splash-Cymbal-Miking-Technique-Research.txt`, lesson id I01d)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| SP-01 | (geometry) | Arm splash at (−150, h 1000, −380) | At (−20, h 1050, −200), its arm clamped to the tom holder's post (CY-07) | At the proposal's position a mic 15–25 cm above the splash would sit inside the 16 in crash and its swing. | splash_cymbal/GEOMETRY_PROPOSAL.md; kit plan | APPLIED · OWNER: approve |
| SP-02 | (mounts) | Standalone / piggyback / stack | Arm and piggyback drawn; the stack said in words | The proposal: "the stack is the hardest art in I01 — build mount.arm first". | ZIL-FXS | APPLIED · OWNER: draw the stack? |
| SP-03 | (assessment) | An 8 in splash on an arm | A 10 in on the arm, an 8 in upside down on the 18 in crash (both sizes sourced) | The proposal's default; the 8 in serves the piggyback. | ZIL-ASPL, ZIL-KSPL, ZIL-BARATA | APPLIED |
| SP-04 | (whole lesson) | No published distance | Above 15–25 cm and under 8–13 cm said as places to begin | Drawing defaults. | splash_cymbal/SOURCES.md | APPLIED · OWNER: approve |
| SP-05 | (stack) | "do not loosen a deliberately tensioned stack" | Kept as a setting check (`sp.set.2`) and a quick-check item | Consistent with the maker's tension adjustment. | ZIL-FXS | APPLIED |

### I01e China Cymbal (`source_text/China-Cymbal-Miking-Technique-Research.txt`, lesson id I01e)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| CH-01 | (geometry) | Proposal position 2: a new stand beside the ride at (150, h 1150, 700) | The China takes the 18 in crash's stand, in its place (the proposal's first option) (CY-08) | Position 2 overlaps the 18 in crash in plan and height. | china_cymbal/GEOMETRY_PROPOSAL.md; kit plan | APPLIED · OWNER: approve |
| CH-02 | (geometry) | "inverted (cup down, lip pointing up toward the stick)" | Turned over, the valley becomes a raised ring and the lip turns DOWN (CY-09) | The proposal's own profile, turned over: heights negate, so the valley (−18 mm) becomes +18 mm and the lip slopes down to the rim. The two statements cannot both hold. | china_cymbal/GEOMETRY_PROPOSAL.md profile | APPLIED · OWNER: confirm with a real China |
| CH-03 | [11] | A side-address underhead mic, by model | "a side-address mic can do this job too" — no model; the under zone uses the small condenser | No model names on screen; the side-address body is large for the drawn space. | S-B181 | APPLIED |
| CH-04 | (whole lesson) | A jazz player's upright ride | The shoulder strike "about an inch above the valley" is a strike point on screen; no name | Starting-points voice. | SAB-JH | APPLIED |
| CH-05 | (whole lesson) | No published distance; the profile | Above 20–30 cm and under 8–15 cm (below the lowest point in the mount) as places to begin; the China's shape said to be a drawing | Drawing defaults (the whole profile). | china_cymbal/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve |

### Shared across the five lessons

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| CY-01 | (family) | — | `cymbalSpec.ts`, `CymbalArt.tsx`, `cymbalModes.ts` unchanged; the Lab 2 additions in new files beside them | Builder brief: extend only in new files. | — | APPLIED |
| CY-02 | (mics) | A miniature clip-on under the hi-hat | A new generic type, "Miniature condenser on a stand clip, supercardioid" (`standClip`); its size and reach are drawing defaults | The guitar clip-on's words describe a body edge; a cymbal clip holds a stand. | DPA-HH | APPLIED (`shared/cymbals/cymbalMics.ts`) |
| CY-03 | (two mics) | — | Over and under face opposite sides of the plate: the pair starts in opposite polarity (the toms' "opposite heads" rule) | A plate moving between two mics; said as a simplified picture. | — | APPLIED |
| CY-04 | (studio or live) | — | The exercise uses the under-mic aimed up and the drummer's fill: its rear faces the floor | The research's reason for under-miking on loud stages, taught generically. | DPA-KILLERS | APPLIED |
| CY-05 | (all) | — | The overheads (Lab 1 M09) and complete-kit (M11) lessons are named as places to go next, in words | Cross-links without citations. | — | APPLIED |
| CY-06 | (how it sounds) | — | The shapes are the Cymatics Lab's flat, centre-held disc; for the China the step says the flat disc simplifies its cup and lip | No China mode data exists; the topology is what the picture teaches. | cymbalModes.ts | APPLIED |
| CY-07 | — | — | see SP-01 | | | |
| CY-08 | — | — | see CH-01 | | | |
| CY-09 | — | — | see CH-02 | | | |
| CY-10 | (all) | "Pro Audio Training Academy", "Student" | Not used | House rule. | — | APPLIED |
> **Ids (review Lab 1 minor 9, 2026-10-05).** The M11 kit rows were S-01/S-02 and the timpani rows T-01–T-03, repeating the snare's and toms' ids; they are now K11-01/K11-02 and TP-01–TP-03.
## Lab 4 review fixes (2026-10-05, `REVIEW_LAB4.md`)

| id | Lesson | Was | Now | Why | Status |
|---|---|---|---|---|---|
| L4R-M1 | C01, C03, C05B, C05C, C07, C13, C15; `shared/guitars/stringsCopy.ts`, `c01Guitar/copy.ts` | "every even shape is still there" (meant *motionless*) | "the even shapes stay silent"; the why "a shape with a still point there is not driven at all"; the notes "has a still point under the pick, so it is not set moving" | "Still there" reads as "still present", the opposite. | APPLIED · test `mikingLab4Review` |
| C11-R1 | C11 | `gp.under` / `up.rear`: "Blended with a mic above: check in mono"; twoMic why "Neither mic is inverted here" | Both tendencies: the mic faces the other side of the soundboard from a mic above (or at the hammers), so blended it starts out roughly opposite in polarity in the lows — try its polarity both ways, in mono, at matched levels. New check `pn.two.5`. The why now says both mics face the same side of the board. | A soundboard is a diaphragm: as its top pushes air up its underside pulls air down — the same rule as the snare's two heads and the open-back combo (C02). | APPLIED |
| C11-R2 | C11 `up.front` | "a few centimetres (several inches)" | "about 6–20 cm (2–8 in)" | The words disagreed with each other and with the zone (60–200 mm). | APPLIED |
| C14-R1 | C14 | the shimmer "heard more toward the neck … not right at the bridge"; "answer only the notes that match their tuning" | The shimmer also leaves through the soundboard (the sympathetic strings have their own small bridge there); right at the main bridge the attack and buzz dominate it. Toward the neck it *can stand out more* — a tendency. The strings ring with the notes **or the overtones** that match their tuning. | The art and the model draw the taraf bridge on the tabli; a taraf string also answers a played note's overtone. | APPLIED |
| L4R-M4 | C02, C04, C08; `shared/electric/ampPages.tsx` | no hum symptom; "defeat a safety ground" with no word on a DI's lift switch | New symptom `s.hum`: swap one cable at a time, then the DI's ground lift; never the mains earth pin. The safety card names the ground-lift switch as a different, normal control that lifts only the audio ground at its XLR. The practice sheets carry a hum line. | A ground-loop hum is the commonest bass-channel fault; the lift switch is the standard first remedy and is not the mains safety earth. | APPLIED |
| L4R-m | C02, C04, C08, C09a, C06a/b, C09c, C10, `ampZones.ts`, `micTypes.ts` | minor wording (review minors 1–12, 14–15) | see `REVIEW_LAB4.md` → Resolution | | APPLIED |
| L4R-B | all of Lab 4 | the key was always the first option in the source; "Yes…" was never the key; a few keys ran long | Keys spread over the three places (source and screen); the hearing check reads "Do you still need a limit…? Yes — max SPL is a distortion limit, not a hearing limit"; C04, C08 and C10 each gain a reasoned "Yes" key; long keys and distractors evened out | The answer-balance rule (1.25 × length, yes/no, slots). | APPLIED · test `mikingLab4Review` |

## Lab 2 · hand percussion: I02 Cajón, I03a Shaker, I03b Egg shaker, I03c Maracas, I04 Headless tambourine, I05a Cowbell, I05b Claves, I05c Woodblock, I05d Güiro (branch miking-i4, 2026-10-05)

Research: `docs/labs/miking/<folder>/SOURCES.md` + `GEOMETRY_PROPOSAL.md` and BATCH2_RESEARCH_SUMMARY.md §2.
The family lives in `lessons/shared/smallperc/` (objects, hands, player, states, sound page,
station plan); each lesson in `lessons/i0x…/`.

### Shared (all nine lessons)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| SP-01 | (header) | "Pro Audio Training Academy", "Student …" | Not used | House rule (BATCH2 §2). | — | APPLIED |
| SP-02 | each lesson's start range | distances "from the center of the playing arc / area" vs the maker's "a gap of at least 12” / 30cm" from the instrument | The lessons' own reference is kept for the starting points ("from the middle of the playing area"); the maker's floor is said once, in words, in each Placement summary ("a common minimum for percussion is about 30 cm between mic and instrument"); a separate CLEAR readout gives the distance from the drawn motion envelope ("nearest stroke") | Two references are easy to mix up (BATCH2 §2, I04 flag); one is a starting distance, the other a clearance. | S-HOME (shaker/SOURCES.md §0); proposal §A | APPLIED (`smallperc/geom.ts` clearLine, every lesson's copy) |
| SP-03 | shaker [5], egg [6], maracas [8], tambourine [7] | "a separate direct pickup for shakers and tambourine" / one per instrument | "One dedicated directional mic for the station" — ONE shared mic for shakers and tambourine | The touring account used ONE 4011A "as a direct source for shakers and tambourine". | DPA-JONAS | APPLIED |
| SP-04 | each lesson's safety section | NIOSH cited without its number | The shared hearing check and the critical quick-check item carry "85 dBA averaged over 8 hours, halving the time for every 3 dBA more" — as plain advice, never as a mic limit | Survey: the small-percussion lessons cite the bulletin without the number. | NIOSH-TID (shaker/SOURCES.md §0) | APPLIED (`smallperc/commonItems.ts`) |
| SP-05 | (Yamaha row) | "have the player stand about eight inches from the mic" | Not drawn as a zone | It is measured from the PLAYER; at the lab's drawn posture (chest 250 mm behind the playing area) the point falls inside the motion envelope. | YMH-REC3 | OWNER: show the 8 in point as a "check it against the motion" marker? |
| SP-06 | (Yamaha row) | toward/away vs side-to-side motion | The shaker's two states ARE the motion direction ("each forward stroke comes closer" / "steadier"); the other lessons say it in words | Sourced words, made a variable the learner switches. | YMH-REC3 | APPLIED |
| SP-07 | (build) | — | HOW IT SOUNDS for idiophones has three steps — the event sequence, the lesson's own pair of motions, attack and body — and no membrane step | Idiophones have no drumhead; LESSON_JOURNEY §7 keeps physics to what a model or words can carry. | LESSON_JOURNEY §7 | APPLIED (`smallperc/pages/SSound.tsx`) |
| SP-08 | (build) | — | The motion envelopes, the arms, the playing height (h 1150) and the player's chest plane (250 mm behind) are drawing defaults / ILLUSTRATIVE, listed in each lesson's unknowns | No source gives any stick, hand or motion clearance (BATCH2 §2). | proposal §A | APPLIED · OWNER: envelope sizes, posture |
| SP-09 | (build, engine) | — | A reference line may be FINITE (`RefLine.segment`): the CLEAR readout is the distance to the motion capsule | Additive; infinite lines read exactly as before (tested). | — | APPLIED (`engine/geometry/zones.ts`, `engine/model/types.ts`) |

### I03a Handheld Shaker (`source_text/Shaker-Miking-Technique-Research.txt`, lesson id I03a)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| SH-01 | L9, ref [1] | "Meinl sells softer studio and louder live versions"; [1] "Studio and Live product pages" | "Shakers of different sizes and sounds suit different settings"; no studio/live version is claimed | The pages are Small ("Soft and clear sound") and Large ("Rich and clear sound"), both "Perfect for live and studio playing". | MEINL-SH26S, MEINL-SH26L | APPLIED · OWNER: fix [1] in the document |
| SH-02 | L16 | 30–60 cm "from the center of the playing arc" | Kept as the starting band, said as a starting point, with the maker's 30 cm floor in words (SP-02) | The 30–60 cm is the lesson's own audition range. | LESSON-SHAKER, S-HOME | APPLIED |
| SH-03 | (geometry) | — | Shell Ø 45 × 160 mm, envelope ±150 / ±60 mm, the right-hand grip — drawing defaults | Meinl prints no size. | shaker/GEOMETRY_PROPOSAL.md §B | APPLIED · OWNER: sizes |

### I03b Egg Shaker (`source_text/Egg-Shaker-Miking-Technique-Research.txt`, lesson id I03b)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| EG-01 | L9 | soft / medium / loud / extra-loud eggs | Kept as relative choices, "not calibrated levels" (a check and a quick-check item) | The set's page prints labels and the SET's weight (110 g) only. | MEINL-ES4 | APPLIED |
| EG-02 | (geometry) | — | Egg 58 × 45 mm, hands ±180 mm (close) and ±260 mm (apart), the palm cover — drawing defaults | Egg size UNKNOWN. | egg_shaker/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: egg size |
| EG-03 | L28 | separate spots for widely separated hands (no number) | One spot per hand, "about 30–60 cm from that egg" | The 30–60 cm band is reused for the split (proposal), recorded as a drawing default in the zone's internal record. | proposal | APPLIED |
| EG-04 | L76 | "keep small loose parts away from children" | Kept as a safety line and a THE SETTING check | The lesson's own safety rule. | LESSON-EGG | APPLIED |

### I03c Maracas (`source_text/Maracas-Miking-Technique-Research.txt`, lesson id I03c)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| MR-01 | (geometry) | — | A pair 284.48 mm (11.2 in) long; head 75 × 95 and handle Ø 25 are drawing defaults | Grinnell's measured lengths are the only sizes. | GRIN-MAR | APPLIED · OWNER: head size |
| MR-02 | L9 | up/down strokes, "a meaningful sound on both upward and downward motions" | HOW IT SOUNDS adds a circular wrist (the seeds rolling round the wall: a longer sustain) as the second motion | The performer's article describes the circular motion and its sustain. | RANGEL | APPLIED |
| MR-03 | L26 | a spot per head (no number) | "About 30–60 cm from that head's working area" | Drawing default from the proposal; recorded in the zone. | proposal | APPLIED |
| MR-04 | L42-L44 | the singer: "place the two microphones and performer to reduce unwanted pickup" | A maraca spot "a little higher, angled down to the heads — which puts the singer's mouth farther off the mic's front than a low mic would" | The lab's geometric reading of the lesson's sentence (ILLUSTRATIVE); the vocal mic's own spill is taught as unavoidable. | LESSON-MARACAS | APPLIED · OWNER: a vocal engineer's look |

### I04 Headless Tambourine and Jingles (`source_text/I04-Headless-Tambourine-and-Jingles-Miking-Technique.txt`, lesson id I04)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| HT-01 | L8, table, exercise | three reference points: "normal playing zone", "nearest expected stroke", "nearest normal movement" | Every distance is measured FROM THE INSTRUMENT at its normal playing position (the front point of the ring); the nearest stroke is a separate CLEAR readout (the gap to the motion envelope) | One reference point per lesson; the stroke is a clearance, not a distance origin. | S-RECBK ("from instrument"), proposal | APPLIED |
| HT-02 | L8 | "roughly 8 in (20 cm) as a starting point for hand percussion" | Not used as a mic-to-instrument distance | Yamaha's eight inches is PLAYER-to-mic, not instrument-to-mic. | YMH-REC3 | APPLIED |
| HT-03 | ref [3] | "brass, bronze and plated steel variants" | "Jingles come in different metals and sizes" — no material range claimed from the maker page | The cited page prints "Solid Brass" only. | MEINL-MTA1 | APPLIED · OWNER: source the range or narrow it in the document |
| HT-04 | ref [7] | "separate direct pickup for shakers and tambourine" | "One shared direct mic for shakers and tambourine" | The tour article names one shared cardioid. | DPA-JONAS | APPLIED |
| HT-05 | (geometry) | — | Ring Ø 254, jingle size, crescent shape, shake ±150 / strike 200 mm — drawing defaults; the struck variant's mic sits to the side (above it is the strike path) | Sizes UNKNOWN beyond the 10 in diameter. | proposal | APPLIED · OWNER: sizes |
| HT-06 | — | (absent) | Hearing, phantom and no-feedback lines added (family items) | Survey: the lesson has none. | shaker/SOURCES.md §0 | APPLIED |

### I05a Cowbell (`source_text/Cowbell-Miking-Technique-Research.txt`, lesson id I05a)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| CB-01 | ref [5] | overhead "model not named here" | No model named in learner text (owner ruling); the internal record names it | The article does name the overhead model. | DPA-VET | APPLIED · OWNER: fix the document |
| CB-02 | ref list | "7½-inch" Salsa G | Not used; the drawn bell is the 7 in (177.8 mm) mountable bell | The page text prints no size for that bell; the 7 in is a printed HEIGHT. | MEINL-SMBG, MEINL-SCL70B | APPLIED |
| CB-03 | L20 | 20–40 cm | Kept as the band, with "the near end is under the common 30 cm minimum — only where clearance allows" | The lesson admits 20 cm is under the maker's 30 cm example. | LESSON-COWBELL, S-HOME | APPLIED |
| CB-04 | (geometry) | — | Mouth width/height and the stick's arc — drawing defaults | UNKNOWN. | proposal | APPLIED · OWNER: sizes |
| CB-05 | (context page) | — | The cowbell's spot looks across or down at it: no AIM tilt brings a cardioid's rear to the downstage wedge, so the tighter pattern is the answer here | The lab's own geometry (pinned by the test both ways). | — | APPLIED |

### I05b Claves (`source_text/Claves-Miking-Technique-Research.txt`, lesson id I05b)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| CV-01 | ref | "pp. 21–22 in PDF pagination" | No page reference in learner text; the internal record keys the ECV02 extract | The claves text sits on the page whose footer reads "Volume I 21". | PAS-ECV02 | APPLIED · OWNER: fix the reference |
| CV-02 | L9 | the grip | Drawn as the source says: the striker held like a stick in the fingers; the other clave cradled over curled fingers, the hollow beneath | The grip IS the sound (a check and the sound page's pair). | PAS-ECV02 | APPLIED |
| CV-03 | (sound page) | — | The bending shape drawn is an ideal unclamped bar's lowest mode (nodes at 0.224 L) — a picture of where it moves least, not a sound | Physics of a uniform bar; a real clave differs. | bar.ts | APPLIED |
| CV-04 | (geometry) | — | Clave 200 × Ø 25 mm, solid and hollowed — drawing defaults | Sizes not printed. | MEINL-CL1 / CL3 | APPLIED · OWNER: sizes |

### I05c Woodblock (`source_text/Woodblock-Miking-Technique-Research.txt`, lesson id I05c)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| WB-01 | — | (absent) | The opening faces the audience (+x) by default; the second viewpoint is "toward the opening" | The orientation rule is in the cited percussion source, not in the lesson. | PAS-ECV02 | APPLIED |
| WB-02 | L20 vs exercise | 25–50 cm vs "about 30 and 50 cm" | 25–50 cm kept, "the near end only where clearance allows"; the observation sheet asks for about 30 and 50 cm | Internal mismatch; 25 cm is under the common 30 cm minimum. | LESSON-WOODBLOCK, S-HOME | APPLIED · OWNER: align the document |
| WB-03 | ref [5] | overhead model unnamed | No model in learner text | As CB-01. | DPA-VET | APPLIED |
| WB-04 | (geometry) | — | Block 190 × 65 × 70, slot 140 × 8 × 45, foam 25, table h 900, mallet 350 — drawing defaults | Sizes UNKNOWN. | proposal | APPLIED · OWNER: sizes |

### I05d Güiro (`source_text/Guiro-Miking-Technique-Research.txt`, lesson id I05d)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| GU-01 | L4 | the güira "acknowledged for correct identification" | Kept as a quick-check item: a related but distinct instrument | Confirmed; note one collection lists "guira" among güiro names. | MEINL-WIKI, GRIN-GUIRO | APPLIED |
| GU-02 | L11 | 30–60 cm "from the center of the actual scraped area" | Kept as the band, measured from the middle of the scraped area; two viewpoints (more ridges, more body) | The lesson's own audition range, not a published standard. | LESSON-GUIRO | APPLIED |
| GU-03 | (geometry) | — | Length 381.0 mm (a museum example, 15 in); Ø 90 → 60, ridges over the middle 60 % at 3 mm, holes Ø 22, scraper 180, overshoot 60 — drawing defaults | Only the length is measured. | MET-GUIRO | APPLIED · OWNER: diameter, ridge layout |
| GU-04 | L5, L73 | "Students should…", "The student covers…" | "you" / no institutional words in the app | House wording rule. | — | APPLIED |

### I02 Cajón (`source_text/Cajon-Miking-Technique-Research.txt`, lesson id I02)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| CJ-01 | L11 | one front mic "about 6–7 inches away at a slight angle" | "About 15–18 cm (6–7 in) from the middle of the plate, dead centre, at a slight angle" | The source says "dead center". | S-DUVEL | APPLIED |
| CJ-02 | L12 | a second mic "just inside a rear hole" | A clip-on mic on a padded port clamp at the port's mouth, a little off its axis; never a loose mic inside | The lab models no inside; the lesson's own rule forbids a loose mic in the box, and the clamp is the product made for it. The source also cautions the port puts "a great deal of pressure on the mic". | S-DUVEL, MEINL-MPMCC | APPLIED · OWNER: confirm the drawn mouth position |
| CJ-03 | L12 | White's rear mic "about 20 cm away" | "About 20 cm out from the back, offset to one side by about 45°, pointing toward the port" | The source gives the 45° offset. | SOS-WHITE | APPLIED |
| CJ-04 | L12, L84 | "front-facing port" | "upward-facing front port"; the front-port model is drawn with its playing surface set back above a low ledge, the port facing up | The maker's words. The real surface slants toward the player; the lab draws it vertical (a simplification, in the accuracy note). | MEINL-SLAP | APPLIED · OWNER: ledge and port sizes |
| CJ-05 | refs [5], [8] | two references | One (internal record) | Same URL. | MEINL-BUL | APPLIED · OWNER: merge in the document |
| CJ-06 | L13, L85 | White flips one channel's polarity | "Compare BOTH polarities in mono and move a mic — flipping one is an example, not a rule" | The lesson's own audit. | SOS-WHITE, SOS-PHASE | APPLIED |
| CJ-07 | (geometry) | — | The hands' strike volume drawn out to 130 mm from the plate (the proposal's 400 mm would cover the published close point) | Shown so the published close spot can be seen; the player check decides. | proposal | APPLIED · OWNER: hands volume |
| CJ-08 | (geometry) | — | Rear port at h 300, plate 4 mm, feet 8 mm, the seated posture, the box rocking back (15°), the exit path — drawing defaults / ILLUSTRATIVE | No source gives them. | proposal | APPLIED · OWNER: port height, posture |

## Lab 3 · the brass: A01 Trumpet and Flugelhorn, A02 Trombone and Bass Trombone

Source texts: `source_text/Trumpet-Miking-Technique-Research.txt` (T), `Flugelhorn-…` (F),
`Trombone-…` (TB), `Bass-Trombone-…` (BT). Research: `trumpet/`, `flugelhorn/`, `trombone/`,
`bass_trombone/` SOURCES.md and GEOMETRY_PROPOSAL.md; `BATCH3_RESEARCH_SUMMARY.md` §2.
Built 2026-10-05 (branch miking-a1) as two lessons with the instrument as the variant
(A01: TRUMPET / FLUGELHORN; A02: TENOR / BASS), on the shared brass family
(`lessons/shared/brass/`).

### A01 Trumpet and Flugelhorn

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| A1-01 | T L14 | DPA "proposes a several-meter trial in a sufficiently large room" | "a farther mic about 3 m away" (setting, studio card, two-mic checks) | The number exists on DPA's page; the trombone lessons already say "about 3 m" (survey 3d-1). | DPA-TPT "try to mic the trumpet or trombone from 3 m away" | APPLIED (`a01Trumpet/lesson.ts`) |
| A1-02 | T L7 (ADD) | Shure 1–2 ft and DPA 30–50 cm only | Adds the practice guide's trumpet/flugelhorn row as a starting point: "about 60–120 cm (2–4 ft) in front, off the bell's axis, aimed at the edge of the bell" (zone `tp.far`) | Survey 3d-2: a sourced trumpet row the lesson lacked. | MDAT | APPLIED (`a01Trumpet/model.ts`) · OWNER: approve showing it |
| A1-03 | T L86 | DPA's "close back-of-bell option", no number | A studio "idea to try" zone `tp.back`, 10–22 cm from the rim's centre, behind the rim beside the flare | The source gives no distance: drawn as a drawing default, said as an experiment. | DPA-TPT | APPLIED · OWNER: approve the distance band |
| A1-04 | T L17 (ADD) | Clip aim "between bell center and edge" | Adds the 80 Hz wireless low-cut to the record only (no number on screen); the clip zone tests the aim: 6–50° off the line to the centre AND the axis meeting the opening | DPA-MOUNT's wireless note; the aim rule made testable. | DPA-MOUNT | APPLIED (record) |
| A1-05 | F L21 | Pickup mute "protrudes beyond the bell on specified models" | The record carries Yamaha's "3–4 cm" (`brassSpec.ts` FLUGELHORN.pickupMute); on screen the pickup mute stays a separate product, not taught | Number added to the record; the lesson itself keeps it out of scope. | Y-PM | APPLIED (record) |
| A1-06 | F L20 | One mic for both horns: "mark a usable location for each" | A check (`tp.mic.4`): the trumpet's clip, place and level are rechecked for the flugelhorn — "a trumpet clip may not fit a flugelhorn's wider bell" | Flugelhorn clip fit is UNKNOWN (proposal: "check the clip's range"). | flugelhorn/GEOMETRY_PROPOSAL.md | APPLIED |
| A1-07 | T L4, PL-2010 (ADD) | "The bell strongly affects the directional sound" | HOW IT SOUNDS draws the bell's spread by band — near-even low down, the front winning from ~500 Hz, a beam from ~1 kHz — as a simplified shape, no dB; the flugelhorn uses the brass trend ("no flugelhorn was measured on its own") | The only measured directivity in Lab 3; drawn qualitatively as the summary requires. | PL-2010 §5.2; UNSW-BRASS | APPLIED (`shared/brass/brassSoundMath.ts`) |
| A1-08 | T L2, F L2 | "Pro Audio Training Academy", "Students should…" | Not used | House rule. | — | APPLIED |

### A02 Trombone and Bass Trombone

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| A2-01 | BT L25 | "DPA observes that an undamped clip can pick up bell vibration [10]" | "A mic mounted on an instrument can pick up vibration and contact noise" (symptom `tb.sym.rattle`) | DPA-VIB speaks of clip/holder mounts on instruments generally — no bells, no "undamped". | DPA-VIB | APPLIED (`a02Trombone/lesson.ts`) |
| A2-02 | TB L6 | "seven slide positions, with the seventh the farthest extension" | The slide's travel drawn to scale: 0, 80, 165, 255, 351, 452, 559 mm — DERIVED by equal temperament on the 2.7 m tube, said as approximate ("players find them by ear and feel") | No source gives the travel; the proportions follow from the sourced length. | Y-TBN-MECH; Y-HUB-TBN; trombone/SOURCES.md §c | APPLIED (`shared/brass/brassSpec.ts`) · OWNER: approve showing approximate travel |
| A2-03 | TB L45 | "An apparently reasonable mic directly in front of the bell can intersect the lower slide's path" | The scene proves it: a stand mic on the bell's axis 30–50 cm out is stopped by the slide's path (its 7th-position travel plus a 100 mm buffer); the recommended zone is above or beside the slide, aimed across the bell (TB L11, labelled internally as the lesson's inference) | The proposal's own test (§4). Buffer 100 mm is a drawing default (proposal 150). | trombone/GEOMETRY_PROPOSAL.md §3–§4 | APPLIED · OWNER: approve the 100 mm buffer |
| A2-04 | TB L7 (ADD) | DPA 30–50 cm, Shure 1–2 ft, DPA about 3 m | Adds the practice guide's trombone row "about 60–120 cm (2–4 ft) in front, off the bell's axis" (zone `tb.far`) | Sourced row the lesson lacked. | MDAT | APPLIED · OWNER: approve showing it |
| A2-05 | BT L7 | "a double rotary example with F and G-flat attachments" | Adds Yamaha's "When set to F, the slide is reduced to six positions" on the slide step; the bass trombone's valve loops drawn (positions: drawing defaults) | Sourced words; the geometry is the lab's drawing. | Y-TBN-PLAY3; Y-YBL830 "Key of Bb/F/Gb/D" | APPLIED |
| A2-06 | BT L11 | No universal lowest bass-trombone frequency for a filter | A check (`tb.mic.4`): start unfiltered, add only what the lowest wanted note allows — no preset corner on screen | The lesson's own rule; the DPA table lists no bass trombone. | DPA-TABLE (absent row) | APPLIED |
| A2-07 | TB L2, BT L2 | Headers; date order (bass Oct 3 before tenor Oct 4) | Not used | House rule; the order is the lab's (tenor first). | — | APPLIED |

### Shared (the brass family)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| BR-01 | (all) | Horn sections "belong in Ensembles and Voice" | Plain text, no promise: "Miking a whole horn section … is a topic of its own, with ensembles and voice" | Cross-link as words; owner rule: never promise a lab that is not live. | — | APPLIED |
| BR-02 | (all) | Mutes "change tone, directionality, protrusion" | HOW IT SOUNDS step 4 draws a straight, cup, Harmon and plunger mute in the bell as typical shapes, no sizes; the mutes' path is taught in words and checks, not as a keep-out solid | A clip rides on the bell, so a mute path solid would block every clip; protrusion has no source. | trumpet/GEOMETRY_PROPOSAL.md §2 (drawing defaults) | APPLIED · OWNER: approve |
| BR-03 | (all) | Bell travel "watch how far the bell moves" | Taught in words and in each zone's checks; not a keep-out solid | Same reason as BR-02; proposal ±15°/±10° is ILLUSTRATIVE. | trumpet/GEOMETRY_PROPOSAL.md §3 | APPLIED |
| BR-04 | (all) | NIOSH guidance | The plain hearing line (85 dBA / 8 h, 3 dB exchange), no name | Starting-points voice. | NIOSH | APPLIED |

### Lab 3 low / coiled brass — A03 French Horn, A04a Tuba, A04b Euphonium (`source_text/{French-Horn,Tuba,Euphonium}-Miking-Technique-Research.txt`; research `french_horn/`, `tuba/`, `euphonium/`, Batch 3)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| LB-01 | (horn geometry) | — | The horn's bell is drawn 310 mm across as a DRAWING DEFAULT and never printed as a readout; no horn bell size appears in learner text | The maker prints only a bell-size letter ("M"); no diameter is published. | french_horn/SOURCES.md (Y-YHR567, Y-HORN-CAT) | APPLIED · OWNER: approve the drawn size |
| LB-02 | (geometry) | Proposals: horn rim at W(−180, −700, +220); tuba/euphonium bells on the player's right | Horn rim moved to (−150, −690, +335), axis back, 26° out, 10° down, so the bell clears the hip and torso; tuba/euphonium bells kept on the player's right as proposed | At the proposal's point the bell's flare passed through the seated body. The bell's SIDE on a tuba/euphonium is a drawing default (players differ). | french_horn/, tuba/, euphonium/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: confirm which side your players carry the tuba/euphonium bell |
| LB-03 | L2 (all three) | "Pro Audio Training Academy" header | Not used | House rule (Batches 1–4). | — | APPLIED |
| LB-04 | ¶10 (horn) | Shure's general brass 1–2 ft as a comparison | The rear (bell-side) starting point is 50–100 cm from the bell, a drawing default; the 1–2 ft figure is not taught as a horn number | Shure's horn entry gives no distance; the lesson itself says the brass range is only a comparison. | S-LIVE, S-BWS | APPLIED · OWNER: approve the band |
| LB-05 | ¶9, ¶13 (horn) | Rostrup's main array ~4 m from the piano; front spots | The front MAIN view is taught in words and on the sound page's wall plan; the two front spots (above: figure-8; below: large cardioid) are zones at 40–80 / 40–70 cm (drawing defaults). MDAT's rear, low, off-axis practice is added beside it — both schools shown (D-HN1) | The 4 m belongs to that church and duo; no spot distance is published. | IHS-ROSTRUP, MDAT, S-LIVE | APPLIED |
| LB-06 | ¶6 (tuba) | Bells "up, back or forward" | Kept, with the maker's context: orchestra up, recording studio front, historic military back; the lab draws UP and FRONT, "back" and the sousaphone in words | Survey flag closed with context. | Y-HUB-TUBA | APPLIED |
| LB-07 | ¶8, ¶43 (tuba) | A ribbon on a solo tuba, by model, from the maker's brass page | Dropped; ribbons stay a generic option with the airflow caution | The example is not on the cited page today. | ROY-BRASS (not found) | APPLIED · OWNER: re-source or leave out |
| LB-08 | (tuba, euphonium) | Euphonium: about 2 ft above an upright bell, toward its edge; tuba: "above and to the side … aimed across the opening" | Both lessons: a zone 56–66 cm above an upward bell, aimed at the edge (drawn ±5 cm round 61 cm); the same guide's tuba row added | MDAT gives the identical row for tuba (ADD). | MDAT | APPLIED |
| LB-09 | (euphonium) | — | Directivity drawn as the brass trend (the tuba's measured lobe), said once; the player's path to stand is a keep-out (600 mm box, drawing default) | No euphonium directivity is published. | PL-2010; euphonium/GEOMETRY_PROPOSAL.md | APPLIED |
| LB-10 | (all three) | NIOSH named for hearing | Plain words: 85 dBA averaged over 8 hours, halve the time for each 3 dBA; a mic's max SPL is not a hearing limit | Starting-points voice (no authority names); figures as in Lab 1. | NIOSH (Batch 2) | APPLIED |
| LB-11 | ¶7 (tuba, euphonium) | A maker's range table | The table is context only ("below 40 Hz" for the tuba); the lessons say not to set a filter from the word "tuba"/"euphonium" | The lessons' own caution. | DPA-TABLE | APPLIED |
| LB-12 | (engine) | — | `InstrumentModel.envelopeReveal` (opt-in): a keep-out is drawn only as a mic approaches it, and blocks the mic either way; the three lessons use 220 mm | Lead rule for this lab: clearance envelopes only on approach. | — | APPLIED · LEAD: merge with any parallel implementation |

## Lab 3 · A05a–d Saxophones (`source_text/Soprano-`, `Alto-`, `Tenor-`, `Baritone-Saxophone-Miking-Technique-Research.txt`, lesson ids A05a–A05d)

Research: `alto_sax/SOURCES.md` (the family keys, §1 radiation physics, §2 placement, §3 dimensions) and the
`soprano_sax/`, `tenor_sax/`, `baritone_sax/` folders; `BATCH3_RESEARCH_SUMMARY.md` §2. One shared family
(`lessons/shared/sax/`), four lessons.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| SX-01 | Sop L6, Alto L6, Tenor L6, Bari L6 | high notes radiate from the "lowest or last open holes" / "last open holes" | Most of a note leaves through the **first open tone hole** (the open hole nearest the mouthpiece) and the open holes just past it; with every key closed, through the bell; the first open hole climbs toward the mouthpiece as the pitch rises; the bell carries the high harmonics. Giavaras's words are not quoted on screen (no citations) | The lesson sentences are a paraphrase of a quote; the physics is the first open hole acting as the end of the pipe | UNSW-SAX; PL-2010 §4.2; S-SAX (the quote) | APPLIED (`shared/sax/saxLesson.ts`, `saxSpec.ts`, `SaxSoundPage.tsx`) |
| SX-02 | (all four) | Supercardioid rejection direction (the general Lab 3 fix) | The supercardioid's least-sensitive directions sit about 125° off the front, toward the rear — not at the sides; a small lobe straight behind | Batch 3 §2.2: the woodwind lessons placed the nulls at the sides | S-POLAR, S-HYPER | APPLIED (`saxLesson.ts` ctx.2, mix.2, `saxMics.ts`) |
| SX-03 | Tenor L7, L9, L15; Bari L9 | Dave Martin "8–15 in … about 45 degrees off the bell … lower for tenor"; the seated "elbow" credited to Martin | Martin's figures are NOT offered (unverifiable: live page 403, the 2024 archived copy has no Martin text). The farther start is Sweetwater's own words: 12–24 in from the bell, aimed a third of the way up the horn, not into the bell; seated, about level with the right elbow (zones `ts.third`, `bs.third`) | Only the archived Sweetwater text could be read | SW-SAX (2024 archive) | APPLIED · OWNER: verify the Martin text in a browser; if found, a `martin` zone kind can be added |
| SX-04 | (all four) | "A few inches" (above the bell, into the bell, from the holes) | Drawn 5–10 cm (2–4 in), said as "a few centimetres" with that band | No number is published; a band is needed to draw a zone | S-REC, S-LIVE, S-BWS | APPLIED · OWNER: approve the 5–10 cm band |
| SX-05 | Sop L10 | "as far away from the bell as practical", "aim back toward the upper keys" | Two DPA paragraphs kept apart on screen: the clip far from the bell aimed back at the upper keys (round, warm, `ss.far`) and the clip in front of the bell (bite, `ss.bite`) | The lesson merged two paragraphs of the same page | DPA-MOUNT | APPLIED |
| SX-06 | Sop / Alto (L25-equivalent absent) | The 80 Hz wireless low cut "for tenor and bari" only | The 80 Hz transmitter cut applies to every 4099S system: a check on each lesson compares it with the horn's lowest note (208 / 139 / 104 Hz above it; the baritone's 69 / 65 Hz below it) | DPA lists 4099G, V, S and T | DPA-MOUNT | APPLIED (`mic.4` in each lesson) |
| SX-07 | Bari L25 | the 80 Hz cut "may attenuate wanted low-frequency content" | Kept, with the arithmetic: the lowest fundamentals (69.30 Hz, 65.41 Hz with a low A) sit below 80 Hz | DERIVED (equal temperament) | DPA-TABLE, PHYS-ET | APPLIED (`bs.mic.4`) |
| SX-08 | Sop L58 | "2–5 kHz buildup" (survey: unsourced) | Not shown as a number (no frequency curve in a silent lab); the soprano's bell cut-in near 2.6 kHz is said in words on HOW IT SOUNDS | Sourced after all (Schulze in S-SAX) — kept internal | S-SAX, UNSW-SAX | APPLIED |
| SX-09 | (all four) | MDAT 18–24 in in front, aimed between the bell and the left-hand keys — absent from the lessons | ADDED as a starting point (`as.front`, `ss.front`); the triangle (Hill) ADDED as geometry for the baritone (`bs.triangle`: as far from the top and the bottom as the horn is long, 0.9–1.15 ×) | Research additions | MDAT; S-SAX (DERIVED geometry) | APPLIED · OWNER: approve |
| SX-10 | (all four) | Tone-hole positions, cups, the path of the neck, body, bow and bell, the player's hold | Drawing defaults: the holes follow the semitone rule (air column L0·2^(−k/12)) fitted to the drawn body and bell, never in the bow; a simplified fingering opens every hole from the bell end up to the first open hole | No maker prints dimensions | Y-SAX-MECH3 (3° cone); UNSW-SAX (6 % per semitone) | APPLIED · OWNER: approve the drawn proportions |
| SX-11 | (all four) | "Pro Audio Training Academy", "Student" | Not used | House rule | — | APPLIED |

---

## Lab 3 · the reed instruments and the organ: A10 Harmonica, A11 Accordion, A12 Acoustic Pipe Organ (branch miking-a5, 2026-10-05)

Research: `BATCH3_RESEARCH_SUMMARY.md` §2 and the `harmonica/`, `accordion/`, `pipe_organ/` folders. The
lesson headers ("Pro Audio Training Academy … Studio and Live Sound") are not used anywhere (house rule).

### A10 Harmonica (`source_text/Harmonica-Miking-Technique.txt`, lesson id A10)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| HM-01 | L36 / [7] | "start near the boundary between dust cap and cone, about 2–5 cm from the grille cloth" | The harp amp is the speaker family's combo with the SPEAKER MODULE's starting points, unchanged: the dust cap's edge "about 2.5–5 cm (1–2 in) from the grille", then the centre, the edge, 15–30 cm and 60–90 cm; their words are the harp amp's | The figure is a guitar-amp engineer's 1–2 in (25.4–50.8 mm), measured from the dust-cap/cone line of the SPEAKER; "2–5 cm from the grille cloth" mixed two reference points and rounded 25.4 to 20. The lab reads speaker rows at the cloth (SPK-04), so the module's zone is reused, not re-derived | harmonica/SOURCES.md (S-MILLS row); speaker_leslie/SOURCES.md | APPLIED (`a10Harmonica/geometry.ts`) |
| HM-02 | L25 | "A distance around 15–30 cm is a practical trial, not a published harmonica standard" | Kept as the acoustic starting point, measured from the harmonica (the hole face) at mouth and hand height, just beyond the hands' envelope; said as "a practical starting experiment" | No source gives a number; the lesson labels it honestly | harmonica/SOURCES.md L25 row | APPLIED |
| HM-03 | L25 | "Aim slightly off the breath stream if bursts dominate" | A second zone: the same 15–30 cm, 20–40° off the line straight out (just outside the drawn 20° breath cone), still aimed at the harmonica | The breath cone's 20° is the proposal's drawing default; 40° is the lab's band | harmonica/GEOMETRY_PROPOSAL.md §2 | APPLIED · OWNER: approve the band |
| HM-04 | L30 | The HB52 "is a high-impedance omnidirectional dynamic mic with an XLR connector" | The XLR caution is kept in words ("a connector alone does not prove compatibility"); only the first harp mic's published size (Ø 63 × 82.6 mm) is drawn | The HB52 manual was unreachable (403); retailer snippets are Low confidence | harmonica/SOURCES.md | APPLIED · OWNER: re-read the HB52 manual |
| HM-05 | L32-L33 | Volume down before plugging in; no feedback at the maximum knob position | Kept, and the setting page's patch tracer checks the harp mic's input (amp OK; desk mic input CHECK FIRST — a matching transformer; speaker output STOP) | Confirmed in the harp mic's user guide; the patch rule is the speaker family's | S-520DX; `shared/speakers/signalChain.ts` | APPLIED (`a10Harmonica/paths.tsx`) |
| HM-06 | (geometry) | — | The player stands 1.35 m in front of the amp and 0.75 m to its side (29° off its axis), mouth 1550 mm up; harmonica 26 × 28 mm; hands' envelope 140 × 120 × 120 | All drawing defaults (proposal §1 and the amp's frame C) | harmonica/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve |
| HM-07 | (all) | Hygiene for a shared, mouth-proximate mic | Not said | No source in the lesson or the research | BATCH3 §2 "Hygiene" | OWNER: decide |

### A11 Accordion (`source_text/Accordion-Miking-Technique.txt`, lesson id A11)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| AC-01 | L25 | "an 18-inch dynamic microphone facing the grille" | "A dynamic facing the treble grille: start about 46 cm (18 in) from the centre of the treble grille" — measured to the grille's centre point | The test was "SM57 — About 18" from the center of the grille"; the lesson's own L28 already says it correctly | accordion/SOURCES.md test 4 | APPLIED (`a11Accordion/geometry.ts`) |
| AC-02 | L25, L33 | "about 10–15 cm from a bellows-side view" | Measured from the bass side AT ITS FULLEST OPENING, so the stand stays outside the whole travel; the readouts and the two-mic page show the distance changing over the cycle | The bass side moves; a stand 10–15 cm from it at rest would be struck on a full pull — the lesson's own safety rule (L28 "Keep stands away from … full bellows extension") wins | accordion/SOURCES.md tests 2/3; GEOMETRY_PROPOSAL.md §4 | APPLIED · OWNER: approve the reading |
| AC-03 | L38 | "Do not … tape a grille" | Kept; the research's test that taped a miniature to the grille is not shown | A listening test, not a practice to teach | accordion/SOURCES.md (test 7, ADD) | APPLIED |
| AC-04 | (frame) | Proposal frame A: +z toward the bass side (the player's left) | The engine's convention: +z to the player's right — the same frame mirrored, no size changed | The side view looks from the player's right in every lesson | engine/geometry/frame.ts | APPLIED |
| AC-05 | (geometry) | — | Treble box 480 × 200 × 180, bass box 480 × 140 × 180, grille 300 × 80 with its centre 1150 mm up; bellows closed 100, half open 175/350, fully open 264/600 (a 35° fan) | Drawing defaults; only the 41 keys and 120 buttons are published | accordion/GEOMETRY_PROPOSAL.md §2 | APPLIED · OWNER: approve |

### A12 Acoustic Pipe Organ (`source_text/Acoustic-Pipe-Organ-Miking-Technique.txt`, lesson id A12)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| ORG-01 | L4 | "Electronic organs and Leslie speakers are covered in their separate lesson" | A link to the Amplified speakers & Leslie module (SPK) on the setting page | The lesson named no lesson; the module exists | BATCH3 §2 item 7 | APPLIED (`a12Organ/pages.tsx`) |
| ORG-02 | L28 / [4] | ORTF in the stereo-miking article: "110-degree angle … six inches apart" | "Two cardioids about 17 cm apart, splayed about 110° (some guides round the spacing to 15 cm)" | ORTF is 17 cm; the article rounds | pipe_organ/SOURCES.md D-ORG1 | APPLIED |
| ORG-03 | L27 | "about 35 feet from that particular organ" | A case study with its height added ("about 2.4 m (8 ft) up, midway between the side walls"); the fourth pew is placed 10.7 m from the façade so the drawing agrees | The account gives the pew, the height and the side walls | pipe_organ/SOURCES.md (NEU-ORGAN) | APPLIED |
| ORG-04 | L29 | "another used a very high overhead pair after on-site tests" | Said only in words, as a venue's installation by competent people — no zone | "10- to 15-meters above the organ" is that room's installation; an elevated mic is never dragged in the lab | pipe_organ/SOURCES.md (DPA-PETRUS) | APPLIED |
| ORG-05 | (zones) | Congregation pair / division spot: no distances | Bands are the drawing's own: the pew area at 1.5–3.5 m up; a spot 3–6 m out (one to two of the drawn Great's widths) | No universal distance exists; said on screen | pipe_organ/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve |
| ORG-06 | (room picture) | — | One lengthwise resonance of an ideal 30 m nave (f = n·c/2L) near a 32′/16′/8′ low C, labelled illustrative | The account's "move two feet … no pedal" is the evidence; the picture shows the mechanism, not a prediction | pipe_organ/GEOMETRY_PROPOSAL.md | APPLIED |
| ORG-07 | (layout) | — | A stylised organ (case 8 × 10 m; Great, Swell, Pedal towers, Positive), a 30 × 15 × 14 m nave with two main aisles, side passages and a rear gallery with an antiphonal division | No organ is sourced; the layout is wholly a drawing default | pipe_organ/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve |

### Shared across the three lessons

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| FR-01 | (sound) | "Air moving across free reeds produces the harmonica's sound" | HOW IT SOUNDS steps one reed through its slot (the air pushed through, the reed springing back, puffs) and draws an ideal clamped-free bar's shapes (ratios 1 : 6.27 : 17.55 : 34.39) | Standard beam physics; a real reed is tapered and weighted, said on screen | `shared/freereed/reedModel.ts` | APPLIED |
| FR-02 | (wording) | "free reed" | On screen "reed instrument", "a reed that swings through its slot" | The house wording rule bars the word "free" from all lab copy | test/mikingWiring.test.ts | APPLIED |

## Lab 3 · the woodwinds: A06 Flute, A07 Piccolo, A08a Clarinet, A08b Bass Clarinet, A09a Oboe, A09b Bassoon

Built 2026-10-05 on branch `miking-a4` from `BATCH3_RESEARCH_SUMMARY.md` and the six woodwind research folders. Learner text carries no source, brand or model; the starting points are worded as places to begin.

### A06 Flute, metal and wooden (`source_text/Flute-Miking-Technique-Metal-and-Wooden.txt`, lesson id A06)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| A6-01 | (close zone) | Aim at "the embouchure" | Aim halfway between the lip plate and the left hand, 5–10 cm, angled out of the air jet | DPA says "halfway between the mouthpiece and the left hand", which is the same point. The zone's aim test uses it. | DPA-FLUTE | APPLIED |
| A6-02 | (zones) | Close and a farther front view | Added: behind and a little above the head, aimed at the finger holes; about 1 m in front at head height (MDAT's 2–4 ft drawn as 0.6–1.2 m) | Rows the research confirmed and the lesson left out. | DPA-FLUTE, S-REC, S-LIVE, MDAT | APPLIED |
| A6-03 | (how it sounds) | The sound leaves at the embouchure | The embouchure hole on every note, the first open hole for most of the rest, and the foot only when every hole is closed | Measured radiation and tone-hole physics. | PL-2010, UNSW-FLUTE | APPLIED |
| A6-04 | L80 | "Identify the design first" | The variant is the design: a metal concert flute, a wooden keyed concert flute, or a simple-system wooden flute. ORIENT draws all three. | The lesson's own first step, made into the control. | Lesson | APPLIED |
| A6-05 | (clip) | A clip on the flute | Offered on the keyed designs only. Never over a simple-system flute's open finger holes, and only with the player's (and for wood, the maker's) agreement. | A clip on an open-hole flute covers a hole. | DPA-FLUTE | APPLIED · OWNER: approve |

### A07 Piccolo (`source_text/Piccolo-Miking-Technique.txt`, lesson id A07)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| A7-01 | L38 | "the supercardioid's side nulls" | The nulls sit toward the rear, near 125°, with a rear lobe, not at the sides | The research's correction 2. | S-HYPER | APPLIED |
| A7-02 | L26 | Use the flute's positions | Kept. Every distance is labelled as the flute's figure, carried over, and is not a piccolo optimum (each zone's provenance says so) | The lesson's own caveat, kept visible. | DPA-FLUTE | APPLIED |
| A7-03 | L26 | (no clip claim) | No clip zone. A flute clip is "only if it fits this piccolo", otherwise a stand (`pc.set.3`). | No source gives a piccolo clip fit. | piccolo/SOURCES.md | APPLIED |
| A7-04 | (mic choice) | Vocal mics on the piccolo | A presence peak can turn a piccolo shrill. Compare responses at matched level; this is not a ban on a type of mic. | Shure's words, without the brand. | S-IVV | APPLIED |
| A7-05 | (how it sounds) | — | Added in words: around 2 kHz the piccolo sends a fairly strong share of its sound to the front | Measured directivity (ADD). | PL-2010 §4.1 | APPLIED |
| A7-06 | (hearing) | — | The player's right ear sits centimetres from the instrument. Hearing exposure is a page-3 item, a check card and a recall card. | Lesson's hearing material, made specific to the piccolo. | Lesson | APPLIED |
| A7-07 | (drawing) | — | A wooden body with a silver head joint and keys, 330 mm long (13 in); holes placed by the semitone rule from D5 | Length sourced; the material is a drawing default, and the lesson says the material is not a mic recipe. | Y-HUB-PICC, DPA-TABLE | APPLIED · OWNER: approve |

### A08a B♭ Clarinet (`source_text/Soprano-Clarinet-Miking-Technique.txt`, lesson id A08a)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| A8A-01 | L36 | Supercardioid "side" nulls | Nulls toward the rear, near 125° | Correction 2. | S-HYPER | APPLIED |
| A8A-02 | (zones) | 15–20 cm, a third up from the bell | Kept, measured one third of the instrument's length up from the bell, toward the reed, facing the holes. MDAT's 2–4 ft front position added. | Correction 6 (orientation); MDAT row. | DPA-CL, MDAT | APPLIED |
| A8A-03 | L6 | The bell carries the low notes | Said as physics: with every hole closed the bell leads, and otherwise the first open holes do. Upper partials travel on toward the bell. | Re-cited to tone-hole physics. | UNSW-CL | APPLIED |
| A8A-04 | (how it sounds) | — | The clarinet's registers sit a twelfth apart on the same fingering (a closed cylinder carries odd harmonics) | Physics drawn on page 2 (PIPE step). | UNSW-CL | APPLIED |

### A08b Bass Clarinet (`source_text/Bass-Clarinet-Miking-Technique.txt`, lesson id A08b)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| A8B-01 | L14, L28 | "no sourced bass-clarinet number" | MDAT's 2–4 ft (0.6–1.2 m) in front is the worked starting point | A sourced figure exists. | MDAT | APPLIED |
| A8B-02 | L39 | Supercardioid side nulls | Nulls toward the rear, near 125° | Correction 2. | S-HYPER | APPLIED |
| A8B-03 | L26 | The soprano's 15–20 cm is not transferred | Kept. No close number is borrowed. The blend and bell zones are drawing bands and are labelled that way. | The lesson's own caution. | Lesson | APPLIED |
| A8B-04 | (geometry) | A low-C model "about 120 mm longer" | The low-C extension is drawn 250 mm longer in tube, derived from the semitone rule (three semitones below low E♭ at the same rule) | +120 mm cannot give three semitones on this bore. The figure is derived. | bass_clarinet/GEOMETRY_PROPOSAL.md; semitone rule | APPLIED · OWNER: approve |
| A8B-05 | (clip) | The clip's angle | Kept as an inference to test by ear: aim it between the bell and the lower holes | No source gives the angle. | bass_clarinet/SOURCES.md | APPLIED |
| A8B-06 | (drawing) | — | The floor peg reaches the floor in both models. The bow and the upturned bell are silver-plated; the body is black. | Posture defaults. | bass_clarinet/GEOMETRY_PROPOSAL.md | APPLIED |

### A09a Oboe (`source_text/Oboe-Miking-Technique.txt`, lesson id A09a)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| A9A-01 | (range) | Lowest note C4 (DPA's table) | B♭3 (about 233 Hz); filters are set from the player's part | The modern oboe reaches B♭3. Logged as D-OB1. | DPA-TABLE; Y-OB-MAN2 | APPLIED |
| A9A-02 | (zones) | 15–20 cm, a third up from the bell | Kept, with the same orientation as the clarinet. MDAT's 2–4 ft added. | Corrections 3 and 6. | DPA-OB, MDAT | APPLIED |
| A9A-03 | (parts) | — | The oboe's tone holes are small (the smallest about 2 mm). This is said in the parts and drawn. | Maker's manual. | Y-OB-MAN2 | APPLIED |
| A9A-04 | (how it sounds) | — | A conical bore: it overblows an octave and has all the harmonics. The PIPE step compares a cone with a closed cylinder. | Physics (a conical bore). | — | APPLIED |

### A09b Bassoon (`source_text/Bassoon-Miking-Technique.txt`, lesson id A09b)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| A9B-01 | L13 | "a third of the way down from the bell" | Kept. DPA's "up from the bell" names the same point. Because the bassoon's bell points up, the point sits BELOW the bell top. This is said once, plainly. | Correction 6. A test pins the orientation for every instrument. | DPA-BSN | APPLIED |
| A9B-02 | (clip) | The gooseneck "back toward the upper joint" | DOWN the instrument from the clip on the bell | On a bell-up bassoon, the upper joint lies below the bell. | DPA-BSN | APPLIED |
| A9B-03 | L37 | Supercardioid side nulls | Nulls toward the rear, near 125° | Correction 2. | S-HYPER | APPLIED |
| A9B-04 | (zones) | — | MDAT's 3–4 ft on the player's right, aimed about 45° down, added as the side zone | Sourced row. | MDAT | APPLIED |
| A9B-05 | (drawing) | — | Bocal, wing, boot (with its U-turn) and long joint drawn from the unfolded tube. The seat strap is drawn seated and the harness standing. The ivory bell ring is a drawing default. | Geometry proposal. | bassoon/GEOMETRY_PROPOSAL.md | APPLIED · OWNER: approve |

### Shared across the woodwinds (`lessons/shared/woodwinds/`)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| W-01 | (mics) | A miniature on the instrument; a flute headset | Two new generic types: "Miniature condenser on an instrument clip" (`wwMini`) and "Headset miniature" (`wwHeadset`). Sizes and reach are drawing defaults. | The example rows were added to SOURCES_SHARED (DPA-CLIPS, DPA-FLUTE). | DPA-CLIPS, DPA-FLUTE | APPLIED |
| W-02 | (holes) | — | Tone holes are placed by the semitone rule, sₖ = A·2^(−k/12) + B (DERIVED), with one hole per semitone in a simplified fingering | Real fingerings vent and cross-finger. This is said under each figure. | Physics | APPLIED |
| W-03 | (postures) | — | Seated and standing holds are drawing defaults: flute 10° forward and 8° down; clarinet 35° and oboe 40° from vertical; bass clarinet on its peg; bassoon on a strap or harness | No source gives the holds. | GEOMETRY_PROPOSALs | APPLIED · OWNER: approve |
| W-04 | (how it sounds) | — | Every step is user-started and finite (STEP / PLAY ONCE), and nothing plays. The air column is drawn as an ideal pipe. Cut-off counts are shown only where the cut-off is measured. | House rules (silent, no loops). | — | APPLIED |
| W-05 | (sax wording) | "last open holes" | The woodwinds say "the first open hole" throughout | Correction 1 applies to the whole family. | UNSW-SAX | APPLIED |
| W-06 | (hearing) | — | Each lesson has a hearing line (85 dBA over 8 hours, halved every 3 dBA, a limit for people, not for a mic), a setting check and a critical quick-check item | House rule. | NIOSH | APPLIED |

## R-06 · The 2026-10-06 restructure (all 79 lessons; owner: "the labs need to be about miking")

Engine-level (`engine/restructure.ts`, `engine/setups.ts`); the lessons' own words stay as written.
LESSON_JOURNEY.md §0 is the record of the journey change.

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| R-06-01 | (journey) | Nine pages: orient, how it sounds, where it sits, … | Eight: MEET IT — WHERE THE SOUND COMES FROM (orient + the how-it-sounds steps that say where sound leaves), STARTING SETUPS, then the six | Owner restructure 2026-10-06 | — | APPLIED |
| R-06-02 | (MEET IT) | How-it-sounds steps on vibration shapes, the air column, valves, sympathetic strings, a pickup's string, the pipe mechanics | Left out of MEET IT (`MEET_DROP`); the page's last step (its checks) is always kept | Physics that does not say where a mic hears the sound | — | APPLIED |
| R-06-03 | (checks) | Checks and quick-check items about those steps | Retired from the page and its credit, one by one (`RETIRED`: 44 lessons, e.g. M01 k.snd.2 + q.3, C11 q.4, I12 gg.snd.1/2 + gg.q.4); a retired quick-check item is replaced by one of the lesson's own MEET IT checks (then a STARTING SETUPS one) — six items kept | A check must test what the page shows | — | APPLIED · OWNER: spot-check the list |
| R-06-04 | (setting) | The stage and studio plans; the neighbours as positions | STARTING SETUPS keeps the setting page's "before any mic" step (its checks) and an amplified source's signal-path step; the neighbours are read as WHAT ELSE THE MIC HEARS (spill, keep clear, boom path, monitors) and the stage / studio words as mic decisions; the plans are no longer drawn | "More about stage position than mic position" | — | APPLIED |
| R-06-05 | (setups) | — | STARTING SETUPS built only from the lesson's zones (each mic at the zone's validated `start`, the zone's first allowed type) and its two-mic copy | No invented placements | each zone's own source | APPLIED |
| R-06-06 | (setups data) | Two-mic pairs kept only in a family page's art | `setupPairs` added, each pair = two of the lesson's existing zones: A10 (amp: boundary + far), A11 (treble + bass), A12 (main + division spot), C02 / C04 / I11a (front + open-back rear, polarity switched), I06a (spot + wider), I06b (closer + farther; high + wider), I06c (beyond each end), I12 (front + room) | The pair existed in the lesson's two-mic page but not in its data | the zones' own sources | APPLIED |
| R-06-07 | (setups roles) | — | `SETUP_PICKS`: M01 farther = outside the front head (the lesson's studio words), no close; M07b farther = the higher spot; C10 no farther (the one-mic start is already the room view); C11 farther = outside the curve / behind an upright's soundboard; C12 none (its far mics are the two-mic partners); I01a no farther (the under-mic is a clip) | The lesson's own words choose differently from the distance rule | — | APPLIED |
| R-06-08 | (kick pair) | The second kick mic "near the port" (a pose, no zone) | Measured from the nearest reference surface — the front head (≈ 9 cm), not the batter head | A dimension across the drum read 54.5 cm | — | APPLIED (`setups.nearestSurface`) |
| R-06-09 | C11 (short stick) | Shure: "6 inches over middle strings … with lid on short stick" | The long dynamic now starts at the zone's 15 cm, tilted clear of the lid (aim 40° below level instead of 70°, within the zone's 50° aim tolerance); it was moved down to ≈ 9 cm by the 2026-10-06 fix pass | Owner answer B: restore ~15 cm. `nearestClear` tilts about the mic's front first (≤ 30°), moves only if no tilt clears | S-REC | APPLIED · four zone starts in the app use it, all piano-lid dynamics (C11 gp.bass grand / baby, gp.short, gp.hole) |
| R-06-10 | (credit) | Stored instrument / sound / setting credit | Kept on the record; read as MEET IT (instrument or sound) and STARTING SETUPS (setting) | Owner rule: credit is never removed | — | APPLIED · OWNER: ORIENT-only credit now shows MEET IT credited |

## Lab 5 · Voice I — solo: E01 Lead Vocal, E03 Rap and Rhythmic Vocal, E07 Singer with Guitar or Piano (branch lab5-g1, 2026-10-07)

Research: `BATCH5_RESEARCH_SUMMARY.md` §2, `lead_vocal/`, `rap_vocal/`, `singer_with_instrument/`. The shared voice family
(frame V, the singer, the voice mics, the pop screen) lives in `lessons/shared/voice/` and is reused by groups 2, 4 and 5.

### E01 Lead Vocal (`source_text/Lead-Vocal-Miking-Technique.txt`, lesson id E01)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| E1-01 | L91 | "about 10 cm" on stage | "within 10 cm" (zone 2.5–10 cm, start 6 cm) | Correction 8: DPA's wording | DPA-VOICE | APPLIED |
| E1-02 | L38 | "10 dBFS of headroom" | "about 10 dB of headroom (peaks near −10 dBFS)" | Correction 8: dBFS is a level, not a margin | N-VOC | APPLIED |
| E1-03 | L10 | "Can be angled substantially" (cited to [3]) | Kept as a tendency; re-cited to the DPA studio article ("up to 90°") | Correction 8: re-cite | DPA-VOC-STUDIO | APPLIED |
| E1-04 | (rows) | Shure 10–20 cm, Neumann 20–30 cm | Two zones measured from the lips (close 10–20 cm; farther 20–30 cm). Every distance is from the lip point; the 25 mm mouth reference point is in the spec and is not drawn | Sourced rows | S-VOC-REC, N-VOC, GRAS-44AB | APPLIED |
| E1-05 | (pop) | A pop screen "between the mic and the singer" | The screen is real: it clamps to the mic's stand on a gooseneck, sits 10 cm in front of the capsule and is part of the collision assembly, so a screened condenser cannot come closer than about 12 cm | Real equipment | N-POP | APPLIED |
| E1-06 | (monitor) | "in front of the singer" (E01) vs "behind the microphone" (E07) | One place: the wedge on the floor about 1 m in front of the singer, facing back = behind the mic. For a level stage mic at 6 cm it arrives about 126° off the front: in a supercardioid's null, not a cardioid's | Correction 6 | S-LIVE, S-SM58-UG | APPLIED |
| E1-07 | (institutional words) | "Students", "teaching exercise", the school's name | "you", "practice exercise"; no school name | Correction 7 | — | APPLIED |

### E03 Rap and Rhythmic Vocal (`source_text/Rap-Vocal-Miking-Technique.txt`, lesson id E03)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| E3-01 | L13 (table) | "2–6 in" | Two rows: a dynamic about 4 in (2–6 in) from the lips, and a screened condenser 1–6 in. The screen stops the condenser at about 15 cm, so its start is at the row's far end | Correction 8 | DPA-VOICE, S-SM4-UG | APPLIED |
| E3-02 | L31 | Lower the mic for sibilance, cited to [4] | Kept; re-cited to [1] ([4] discusses the presence peak) | Correction 8 | S-VOC-REC | APPLIED |
| E3-03 | L59 | "Aim between the nose and the mouth" (no source) | Kept; now sourced. The farther starts aim at that point, so the studio readout shows AIM ≈ 3–6° off the lips at 15–33 cm | Research: now sourced | S-REC | APPLIED |
| E3-04 | (working zone) | "Give the rapper a defined working zone" | Drawn as the head's travel round its rest position (a dashed amber outline); the inverse-square swing it causes is computed (doubling the distance ≈ 6 dB) | No size is given | — | APPLIED · OWNER: approve the size |

### E07 Singer with Guitar or Piano (`source_text/Singer-With-Instrument-Miking-Technique.txt`, lesson id E07)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| E7-01 | L14 | A 3:1 example with distances it does not state | Rewritten from the drawing: the vocal mic 15 cm from the lips and the guitar mic 22.5 cm from the 12th fret stand about 49 cm apart — under 3:1 (ratio ≈ 2.2). 3:1 would need 3 × 22.5 = 67.5 cm. The app says so plainly: one performer's two sources are always in both mics, so polarity and timing are checked, not the ratio | Correction 1 (one definition: mic-to-mic ≥ 3 × the larger mic-to-source) | S-LIVE | APPLIED |
| E7-02 | L41 | A "ring out" exercise | No-provocation rule: bring the level up only to the agreed performance level; at any ring, lower that send at once and change the placement, the angle or the pattern. Never create feedback deliberately | Correction 2 | — | APPLIED |
| E7-03 | (hosts) | Guitar or piano | One model, two variants: the guitar family's steel-string guitar (seated) and the C11 grand piano, each with its own singer, mouth and views (`hostMerge.ts`). The piano zones are C11's own, retagged | Reuse, no new instrument geometry | C11 zones' sources | APPLIED |
| E7-04 | (one mic) | One coherent mic for both | A zone 40–70 cm out, aimed between the mouth and the 12th fret (a drawing default; the lesson gives no distance) | No source gives the distance | LESSON | APPLIED · OWNER: approve |
| E7-05 | (null) | "Use the vocal mic's rejection toward the instrument" | Tested: a supercardioid at the vocal start can put the guitar in its null by aim alone (within ±60°) | Physics | S-LIVE | APPLIED |

### OWNER REVIEW (drawing defaults chosen where the research leaves the decision open)

| id | Default | Where |
|---|---|---|
| OR-V1 | The head and the singer are the shared PlayerFigure (FigureHead); the lip point sits on its mouth; head radius 114 mm; a standing singer's lips 1550 mm above the floor | `voiceSpec.ts`, `voicePose.ts` |
| OR-V2 | The worked studio distance is 15 cm (D-LV1: inside Shure's 10–20 cm) | E01 `lv.close` |
| OR-V3 | The pop screen: a 15 cm hoop, 10 cm in front of the capsule (sourced gap), tilted 10°, on a gooseneck clamped to the stand | `voiceMics.ts` `vocLdc`, `PlacementScene.tsx` |
| OR-V4 | The angled starts: slightly lower 30° below, to one side 20°, nose height and above (eye level) 10–16° | `voiceStarts.ts`, E01 / E03 zones |
| OR-V5 | "Around 12 in" drawn as a ±5 cm band (25.5–35.5 cm) | `VOICE_ROWS.loose` |
| OR-V6 | The floor wedge 1 m in front of the singer, its face lifted 250 mm | E01 / E03 `live.wedges` |
| OR-V7 | The headset: 14 mm ahead of the lips, 34 mm to the side, its boom reaching 170 mm from the ear | `VOICE_DIMS.headsetFwd/Side`, `vocHeadset` |
| OR-V8 | The rapper's working zone: 6 cm forward, 8 cm back, 4 cm up and down | `VOICE_DIMS.work*` |
| OR-V9 | E07's seated posture and mouth offset over the guitar (about 40 cm above the strings); the singer at the piano's keys | E07 `geometry.ts` |
| OR-V10 | E07's one-mic distance 40–70 cm | E07 `sg.one` |
| OR-V11 | The mouth reference point (25 mm) is in the spec, not drawn | `VOICE_DIMS.mrp` |
| OR-V12 | STARTING SETUPS on a singer are framed head-and-shoulders (`setupFrameMax`), so the stand runs off the bottom edge | `InstrumentModel.setupFrameMax` |
| OR-V13 | The side-address condenser is drawn with its basket centred on the measured point | `micDrawings.tsx` `VocalLdcMic` |
| OR-V14 | Mic model names never shown; the air jet (P, B) drawn as an illustrative shape | `VoiceSoundArt.tsx` |
| OR-V15 | The farther studio starts aim between the nose and the mouth (S-REC), so their AIM readout is 3–6°, not 0° | `voiceZones.ts` `onNoseMouth` |
