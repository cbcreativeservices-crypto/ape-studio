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
| S-01 | (plan) | Stages one mic → extensive | The stages are shown as functional examples, never a fixed order to add mics; the counters describe a plan and never grade it. | The lesson's own caution; the stepper could read as a ladder. | M11 lesson | APPLIED (`m11Kit/copy.ts` `PLAN_WORDS`) |
| S-02 | (drawing) | Hi-hat and ride spot mics | Drawn on booms (a floor stand straight under them passes through the cymbal); the floor-tom spot sits over the rim away from the rack tom's stand. | Collision check: the first drawing put stands through hardware. | kit plan; test `mikingModelM11` | APPLIED (`m11Kit/plan.ts`) |
## M06 Timpani, M07a Concert bass drum, M07b Concert snare, M08 Headed tambourine (branch miking-w4, 2026-10-05)

| id | Line | Lesson says | App says | Why | Source | Status |
|---|---|---|---|---|---|---|
| T-01 | L18 / ref [6] | "A documented classical-recording approach … about 1 m above the heads" (cites ebrary) | "about 1 m (3 ft 3 in) above the heads, between the two drums" — the book's own "(3'4")" kept in the record; no source named on screen | The batch research: cite the book (*Classical Recording*), not the ebrary mirror; 1 m = 3 ft 3.4 in | timpani/SOURCES.md DECCA | APPLIED (`m06Timpani/model.ts`) · OWNER: replace ref [6] with the book |
| T-02 | ref [9] | Neumann MCM newsroom case | Not used | The URL returns 404 | timpani/SOURCES.md | APPLIED · OWNER: find the current URL |
| T-03 | L20 | "Arrange according to the player's real drum order rather than assuming a fixed left-to-right pitch map" | Kept, and the lab draws the international order with the German order named as its mirror | Yamaha's placement page gives both orders | YMH-TIMP-PLACE | APPLIED (`m06Timpani/copy.ts`) |
| B-01 | ref [1] | cites the ebrary mirror | The book is the record | as T-01 | concert_bass_drum/SOURCES.md DECCA | OWNER: replace the link |
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
