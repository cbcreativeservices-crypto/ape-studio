# Lab 1 Membranophones: source survey

Inputs: 14 lesson .txt files plus Miking-Labs-Master-Plan.txt. I read every file in full.
Conventions used below: [n] = the lesson's own reference number. "UNSPECIFIED" = the lesson implies the item but gives no detail. All numbers are copied verbatim.

---

## 1. COVERAGE

| Scope ID | Plan scope | File(s) |
|---|---|---|
| M01 | Kick / bass drum | Kick-Drum-Miking-Technique-Research.txt |
| M02 | Snare drum | Snare-Drum-Miking-Technique-Research.txt |
| M03 | Rack + floor toms | Rack-and-Floor-Tom-Miking-Technique-Research.txt |
| M04 | Congas, bongos, timbales | Congas-…, Bongos-…, Timbales-… (3 separate lessons) |
| M05 | Djembe | Djembe-Miking-Technique-Research.txt |
| M06 | Timpani | Timpani-Miking-Technique-Research.txt |
| M07 | Concert bass drum + concert snare | Concert-Bass-Drum-…, Concert-Snare-… (2 lessons) |
| M08 | Headed tambourine | Headed-Tambourine-Miking-Technique-Research.txt |
| M09 | Drum overheads incl. Glyn Johns | Drum-Overheads-Miking-Technique-Research.txt |
| M10 | Drum room microphones | **NO DOCUMENT** |
| M11 | Complete drum-kit setups (minimal/extensive, OH/close balance, cymbal cross-links) | **NO DOCUMENT**. It is partly touched by Overheads (kick/snare spots, Glyn Johns 3- and 4-mic forms) and by the Lab 5 Rhythm-Sections doc (E09), but no lesson covers it. |
| M12 | Tonbak | Tonbak-Miking-Technique.txt |
| M13 | Tabla (dayan + bayan) | Tabla-Miking-Lesson.txt |
| Support module | Speaker-cabinet miking incl. organ through a Leslie | **NO DOCUMENT**. Amp/cabinet content exists only in other labs' docs (Electric-Guitar-Amplifier, Electric-Bass-Amplifier, Rhodes, Wurlitzer, Harmonica). "Leslie" appears only in the master plan and the Pipe-Organ doc, where it is used for separation. |

- Every Lab 1 file maps to a plan ID. None of them is outside the plan.
- Kick, Snare and Toms cite the Drum Tuning Lab as a "separate" lab. That lab already exists in the app, so these are real cross-links.
- Only Tonbak and Tabla carry their scope ID in the header.

Header formats are inconsistent:
- Kick, Snare and Toms: "Research checkpoint 1/2/3 | October 3 2026".
- Overheads: "Drum Kit Cross Reference | Research checkpoint 5", with no date.
- The eight hand/concert-percussion lessons (Congas through Headed Tambourine): "Lab: 1 … Sequence: …", with no date and no checkpoint.
- Tonbak and Tabla: "M12/M13 • October 4 2026".
- Checkpoint 4 is missing from the sequence.

---

## 2. PER LESSON

### M01 Kick Drum Miking Technique
**Header:** Pro Audio Training Academy | Membranophones Lab | Research checkpoint 1 | October 3 2026.

**Anatomy to draw**
- Batter head, resonant (front) head and air cavity.
- Shell.
- Internal damping (pillow or cushion).
- Port, an opening in the resonant head, with its port edge. The port is optional: the drum may be "intact or already ported".
- Beater and beater path; pedal action.
- Drummer.
- Stand or approved mount; cable and connector route.
- Rest of the kit and band (spill).
- UNSPECIFIED: drum diameter and depth, port size and location, damping shape, beater material, pedal type.
- The lesson forbids implying a port must be cut.

**Microphones**
| Model | Type / pattern as stated | Source |
|---|---|---|
| Shure Beta 52A | "modified supercardioid" dynamic; must be kept off the head and damping | [2] |
| Sennheiser e 902 | cardioid dynamic | [3] |
| AKG D112 MkII | cardioid dynamic | [7] |
| Shure Beta 91A | boundary condenser, contour switch, on a pillow/cushion (pattern NOT stated) | [4] |
| DPA high-SPL condenser | flatter response; no model named | [1] |

**Positions**
- Beta 52A inside, "5 to 7.5 cm from that head [batter], slightly off the beater line" [2].
- Beta 52A inside, "20 to 30 cm from that head if the drum and mic physically allow it" [2].
- e 902 at the resonant-head/port area: no number [3].
- Outside an intact resonant head: no number [1] (DPA).
- Beta 91A internal, "25 to 152 mm from the batter head on cushioning" [4].
- Aiming tip: turn the e 902 away from the beater strike for less attack [3].
- Height, distance and angle are separate variables. The acoustic centre is not the grille tip, so placement is never "millimeter-accurate".

**Safety**
- NIOSH: 85 dBA over 8 h; each +3 dBA halves the time [8]. This limit is separate from a mic's max SPL.
- Stop the drummer before moving anything.
- Keep the mic clear of both heads, the beater, the port edge, damping and the pedal.
- Inspect the whole assembly when a mic goes through the port.
- Phantom/cabling procedure per the console manual; Yamaha ZG01 is the example [9].
- Set gain on the strongest strokes; a fader does not undo clipping.
- Never create feedback deliberately.

**Multi-mic**
- Shure two-mic blend: Beta 91A inside for attack plus Beta 52A near the port for low-frequency weight [5].
- Check the pair in mono and compare both polarity states.
- Polarity is not delay.
- 3:1 helps spill only; it does not guarantee coherence for an inside/outside pair [6, 12].
- Keep an untreated comparison if time-alignment is introduced.

**Proposed app presentation**
- Illustrated drum with an intact/ported toggle.
- Show both heads, the beater path, permitted mic regions, the cable route and collision zones.
- The learner picks a mic by properties, not brand.
- One-variable controls: position along the drum, aim, polar pattern, 1 vs 2 channels.
- Studio/live switch.
- Tonal changes labelled as tendencies.
- Cautions:
  - Validate diagrams against real orientation and geometry.
  - Do not show a directional mic's rear as a universal rejection zone.
  - No simulated frequency curve presented as data.

**Audio:** Never mentioned. This is the only Lab 1 lesson with no "no audio examples" statement.

**Quality flags**
- Part 8 is weak: only an "assessment" final task, with no observation sheet or repeatable comparison sheet.
- The Beta 91A polar pattern is not stated (it is half-cardioid). A pickup-lobe illustration needs it.
- "Modified supercardioid" for the Beta 52A: verify against Shure's wording.
- Units are mixed (cm and mm).
- Audit tension (handled in the lesson): DPA says pressure outside the port is sometimes greater than inside, while Shure calls near-batter the highest-SPL position.
- Overlap with Snare and Toms: the NIOSH, ZG01 and polarity boilerplate is near-identical across all kit lessons.

---

### M02 Snare Drum Miking Technique
**Header:** Pro Audio Training Academy · Membranophones Lab · Research checkpoint 2 · October 3 2026.

**Anatomy to draw**
- Batter head (struck from above) and lower resonant head.
- Snare wires, strainer, rim/hoop and shell; damping.
- Stand.
- Stick paths: rimshot, cross-stick, brushes.
- Hi-hat and rack tom beside it (assessment scene).
- Rim clamp.
- Drummer's hands, legs and pedals.
- UNSPECIFIED: diameter and depth, throw-off design, wire count.

**Microphones**
| Model | Type / pattern as stated | Source |
|---|---|---|
| Shure SM57 | cardioid dynamic; the windscreen "was not designed to be struck" | [3, 6] |
| Audix i5 | cardioid dynamic | [7] |
| Sennheiser e 904 | compact cardioid dynamic with a rim clamp | [4] |
| DPA 2011 F | condenser, "specified there at 140 dB SPL", used top and bottom (pattern not stated) | [8] |

**Positions**
- SM57: "2.5–7.5 cm (1–3 in.) above the rim of the top head" [6].
- Audix i5: "about 2 in. above the rim, aimed toward the center" [7].
- SM57 article: "about 4 in. away" (from "the drum"; reference surface vague) [3].
- e 904: "3–5 cm over the drumhead" with the approved rim clamp; angle "30–60 degrees" (reference axis UNSPECIFIED) [4].
- Bottom mic: no distance given by any source [1, 4].
- No-snare-mic, kit-first option [1, 2].
- Aim the rejection region toward the hi-hat [10].

**Safety**
- NIOSH 85 dBA / 8 h / 3 dBA [9].
- The full stick, rimshot, cross-stick and brush path, plus hi-hat and tom travel, must stay clear.
- Rim clamp must fit the hoop; no improvised clamps.
- Phantom/mute per the manuals [5].
- A pad after an overloaded capsule does not help.

**Multi-mic**
- Top/bottom pair may show opposite polarity. Shure and Sennheiser invert the bottom channel in their examples.
- Teach the check, not a law; polarity is not delay [2, 4, 11, 12].
- Check top+bottom in mono, then add the overheads.

**Proposed app presentation**
- Labelled top head, lower head, wires, rim, stick/rimshot travel, hi-hat, stand and pickup direction.
- Collision zone shown before exploring height, rim location, aim, pattern and the lower-mic choice.
- Studio/live switch.
- For two mics: show signal paths and the polarity switch separately from acoustic arrival time.
- Tendencies only, no curves, no audio.

**Audio:** "Do not include audio examples in the lab."

**Quality flags**
- Part 8 is an assessment scenario only, with no observation sheet.
- e 904 30–60° has no stated reference.
- "4 in." has no metric value and no reference surface.
- "DPA 2011 F": model suffix looks wrong (DPA lists 2011A/2011C); verify the 140 dB figure.
- Audit notes a Shure self-contradiction: "two snare mics most common" (2022) vs "top miking most common" (2026).
- Overlaps:
  - Concert Snare reuses the same SM57 geometry.
  - The kit-first option overlaps Overheads.

---

### M03 Rack and Floor Tom Miking Technique
**Header:** Pro Audio Training Academy · Membranophones Lab · Research checkpoint 3 · October 3 2026.

**Anatomy to draw**
- Top batter head and lower resonant head; no snare wires.
- Rim/hoop, tuning hardware, mounts.
- Rack toms "above the kick"; floor toms "beside the drummer" with the player's leg nearby.
- Crash/ride cymbals over the rack toms; a lower cymbal near the floor tom.
- Stick arcs, pedal, stands.
- Clamps: Sennheiser MZH 604, Earthworks RM1.
- Assessment kit: "two rack toms and one floor tom".
- UNSPECIFIED: diameters and depths, count beyond the assessment, mount type, floor-tom legs.

**Microphones**
| Model | Type / pattern as stated | Source |
|---|---|---|
| Shure Beta 56A | supercardioid dynamic; maximum rejection "around 120 degrees toward the rear" | [6] |
| Sennheiser e 904 | compact cardioid dynamic + MZH 604 clamp | [4] |
| DPA 4099 | condenser on drum clip/gooseneck (pattern not stated) | [7] |
| Earthworks DM20 | condenser on RM1 mount, top or bottom (pattern not stated) | [5] |
| Audix D2 | "for rack toms" (pattern not stated) | [8] |
| Audix D4 | hypercardioid, "larger rack or floor toms" | [8] |
| DPA wide-cardioid or omni between toms | no model named | [7] |

**Positions**
- Beta 56A: "2.5–7.5 cm (1–3 in.) above tom heads, aimed at the top heads" [6].
- e 904: "3–5 cm over the drumhead", "30–60 degrees" [4].
- DM20: "1.5–3 in. above the head"; the head must be "angled rather than parallel to the head" [5].
- One mic shared between two toms: no number [3, 6, 7].
- Overhead-led option, no close tom mics [2, 3].
- DM20 bottom mount [5].
- Beta 56A inside after bottom-head removal: this alters the instrument [6].
- Rim vs centre aim changes attack vs body (DPA) [1].

**Safety**
- NIOSH [9].
- Full stick path across every tom and cymbal; drum swing; the leg near the floor tom.
- Approved clamps only; never alter or remove a head without the player's agreement.
- ZG01 phantom example [10].

**Multi-mic**
- Bring channels in one at a time; check mono, then the stereo/PA layout.
- The "phase" button inverts polarity only.
- Do not auto-invert bottom tom mics or auto-align [3, 12].
- A tom bottom mic is not equivalent to a snare-bottom mic.

**Proposed app presentation**
- Labelled rack/floor kit plus an overhead perspective.
- The learner first decides whether the toms need mics.
- Mics may only be placed in regions clear of sticks, cymbals, mounts and legs.
- Controls: position, aim, pattern, number of channels.
- Written conditional consequences; no invented curves.
- Studio/live switch.
- The bottom-head option must state whether the head is installed and whether the player approved.

**Audio:** "No audio examples are included." (twice)

**Quality flags**
- Part 8 is assessment scenarios only, with no observation sheet.
- Audit flags a DPA marketing claim ("any DPA mic within one centimeter") as non-transferable.
- Overlaps:
  - Snare: e 904 numbers are identical; boilerplate.
  - Overheads: overhead-led kit.

---

### M04a Congas Miking Technique Research
**Header:** "Lab: 1. Membranophones…; Place in sequence: After rack and floor toms; before bongos and timbales". **No date, no checkpoint.**

**Anatomy to draw**
- Headed hand drums, a pair or several. Names "quinto, conga/segundo, and tumba" vary with tradition.
- Upper head; open bottom (lower shell).
- Shell hardware; stand or floor; "raised setup".
- Player hands, wrists and knees.
- UNSPECIFIED: head diameters, shell height, stave construction, tuning lugs/rim type, stand type, player standing or seated.

**Microphones**
- Generic only: dynamic cardioid and small-diaphragm condenser.
- Touring case: "separate miniature clip-on mics for high and low congas", the DPA 4099 ("4099-on-each-conga") [3].
- Shure's shared-mic placement names no model [1].

**Positions**
- Shared mic: "just above the heads between a pair", aimed down [1]. No number; "'Just above' is not a universal clearance."
- One per drum, quiet studio: "roughly 6 in–2 ft (15–60 cm) from each head" (Ferguson) [2].
- Close stage: near the far-side rim, aimed across the playing area. No number [2, 3, 5].
- Near-coincident stereo pair [2, 4].
- Lower opening: "near—not blocking". No number [2].
- Room mic: no number.

**Safety**
- Hand, wrist and knee clearance.
- Player consent before clipping.
- Never route a cable into the bottom opening.
- Phantom per manual [6].
- "Monitor hearing exposure" [7], with no NIOSH numbers.
- Placement safety is marked "instructional inference".

**Multi-mic**
- Mono check across all strokes; polarity as a diagnostic only.
- "Avoid claiming a fixed 'three-to-one' spacing rule solves every shared-source pair" [4].
- Mono-compatibility check for stereo.

**Proposed app presentation**
- Top and side diagram: two congas, head, open lower shell, hand paths, stand/floor, one shared mic, optional two-mic positions.
- Choose quiet studio / shared stage / loud live; move the mic; text prompts.
- A clearance check and a mono check are required before completion.
- Qualitative only, no spectra, no audio.

**Audio:** "No audio examples." (3 mentions)

**Quality flags**
- Header has no date or checkpoint.
- **The curriculum-links section contradicts the plan.** It says Glyn Johns is "taught in Ensembles and Voice under rhythm sections and complete bands". The plan, Overheads, Bongos and every other lesson put it in Drum Overheads (Lab 1).
- Stale note: "The ride cymbal research draft is deferred…"
- The 15–60 cm conversion is rounded (2 ft = 60.96 cm).
- The same Jonas Brothers DPA case is cited via svconline.com, whereas Bongos, Timbales and Tambourine cite dpamicrophones.com.
- Part 7 safety is thinner than the kit lessons (no NIOSH figures).

---

### M04b Bongos Miking Technique Research
**Header:** "Lab: 1 …; Sequence: After congas; before timbales." **No date, no checkpoint.**

**Anatomy to draw**
- A connected pair of small open-bottom headed drums: smaller **macho** (higher) and larger **hembra** (lower).
- Membranes; open shell ends; centre block.
- Player hands and knees/legs, or a stand/tripod.
- Hands may approach from front, rear or either side.
- UNSPECIFIED in the text: head sizes. The ref URL implies LP "7-1/4 & 8-5/8" but the body never states it. Also unspecified: rims and tuning lugs.

**Microphones**
- Shure Beta 181 article: bidirectional (figure-8) capsule between the heads, or X/Y [4].
- DPA 4099 used on bongos on an arena tour [5].
- Generic SDC, compact side-address condenser, dynamic.

**Positions**
- Shared directional mic "just above the heads", aimed down between them [3]. No number.
- Figure-8 between the drums: lobes toward the sources; check side nulls and the rear lobe [4].
- Two spots "at a safe, comparable distance" or compact X/Y centred above [4]. No numbers.
- Compact clip/stand mic [5].
- **No numeric position anywhere in the lesson.**

**Safety**
- Stop the player.
- No clamp to rim or centre block unless compatible and the owner agrees.
- Stand stability, trip-free cables, phantom per manual [9], NIOSH [10].
- Mechanical steps are marked inference.

**Multi-mic**
- A shared single mic avoids interaction between channels.
- With two mics: check each solo, then the mono sum; polarity is diagnostic only.
- Include percussion overheads and vocal mics in the check.
- X/Y minimises arrival differences within the pair only.
- Prefer a mono image for mono PAs.

**Proposed app presentation**
- Annotated top and side view: macho, hembra, membranes, open ends, centre block, hands, knees/stand, shared mic, optional two spots, movable monitor.
- Three settings: quiet studio, band session, loud stage.
- Mic moves among documented regions.
- Full-motion clearance check; mono check for two mics.
- No curves, no audio.

**Audio:** "No audio examples." (3 mentions)

**Quality flags**
- No date or checkpoint.
- No numbers at all, so the app has nothing quantitative to show.
- The bottom-mic tonal prediction is honestly marked as inference.
- The Shure table is cited as "Microphone Techniques for Drums"; Timbales cites "…for Recording" for the same table.

---

### M04c Timbales Miking Technique Research
**Header:** "Lab: 1 …; Sequence: After congas and bongos; before djembe." **No date, no checkpoint.**

**Anatomy to draw**
- A pair of shallow single-headed drums on a stand.
- Heads, rims, and metal shells (the **cáscara** contact zones).
- Tension hardware; a bell bracket with cowbell(s) and/or block(s); possibly a cymbal.
- Sticks and their arcs.
- UNSPECIFIED in the text: sizes (refs name LP "14/15" and "13/14"), open bottom (implied only by "under-rim" mics), stand height.

**Microphones**
- Audix D2 "right between the timbale shells" (Ozomatli FOH) [4].
- DPA 4099 per timbale plus DPA 4011 percussion overheads [5].
- "Under-rim dynamics with an X/Y overhead pair" (SOS Latin engineers) [6].
- Shure SM57 guide, cited for "maximum input context" [9].

**Positions**
- Shared mic "aiming down between the two top heads, just above them" [3]. No number.
- D2 between the shells: no distance or direction published [4].
- One compact mic per drum outside the stick/rim path [5]. No number.
- Optional overhead or accessory spot [5, 6].
- "Avoid a microphone immediately above a common rimshot target."
- **No numeric position anywhere.**

**Safety**
- Widest head/rim/shell/accessory strikes.
- Nothing may drop onto the player.
- A clip-on is "not automatically safer".
- Gain set on the strongest rimshot and bell; phantom per manual [9]; NIOSH [10].
- Rigging steps are marked inference.

**Multi-mic**
- Spot pair plus accessory/overhead: add one at a time, check mono.
- "No fixed 'correct' polarity."
- Don't hard-pan by habit; mono PA consideration [11, 8].

**Proposed app presentation**
- Accurate top and side view: two shallow single-headed drums on a stand, head, rim, shell-contact zones, actual accessory positions, sticks and arcs.
- Choose: shared top, shell-oriented, individual spots, or percussion overhead.
- Explicit clearance, full-phrase balance and mono checks.
- Live mode shows monitor/PA and gain-before-feedback as an empirical outcome, not a number.

**Audio:** "No audio examples." (3 mentions)

**Quality flags**
- No date or checkpoint.
- No numbers.
- Accessories (cowbell/block/cymbal) belong to Lab 2 but must be drawn here.
- Citation inconsistency with Congas/Bongos (see M04b).

---

### M05 Djembe Miking Technique Research
**Header:** "Lab: 1 …; Sequence: After timbales; before timpani." **No date, no checkpoint.**

**Anatomy to draw**
- Single-headed goblet-shaped hand drum; head; open lower end (bottom opening).
- Player posture: stand, sit with the drum between the legs, hold/tilt it, or use a stand.
- Hands, wrists, knees, legs, feet; floor; stand.
- UNSPECIFIED: rope/lug tuning system (never mentioned), size, carving, rim.

**Microphones**
- Shure KSM137 (top) in the Duvel example [2]. Pattern not stated; the second (lower) mic model is unnamed.
- AKG C-451 EB as the upper mic, Coppinger comparison [3]. Pattern not stated.
- Audix D4, described as "a compact low-frequency-oriented dynamic" for djembe [7].

**Positions**
- Upper mic "about 16 in (41 cm) from center" [3]. Reference ambiguous: horizontal, slant, or from the head centre.
- KSM137 "about 2–4 in (5–10 cm) above the head at a 40–60° angle" [2]. Angle reference UNSPECIFIED.
- Lower mic "aimed at the lower opening about 2 in (5 cm) above the floor" [2].
- Bottom mic "about 8 in (20 cm) from the rim" [3]. Which rim: UNSPECIFIED.
- More-distant front perspective: no number [4, 6].
- Rule: "do not place a mic underneath a drum resting on the floor."

**Safety**
- Full hand/wrist/knee/leg/drum-motion envelope.
- Lower mic and cable out of foot traffic.
- Stand load rating.
- Never make the performer sit or stand unnaturally.
- Phantom per manual [9]; NIOSH [10].
- Rigging is marked inference.

**Multi-mic**
- Upper alone first, then add the lower; check in mono across bass, tone and slap.
- Do not permanently reverse a channel just because it is below the drum [11].
- A room mic is also checked in mono.

**Proposed app presentation**
- Top and side diagram: head, open lower end, hands/knees/feet, tilt, stand/floor, safe regions.
- One upper/front mic first; the optional lower channel only when the opening and support allow.
- Aim and distance controls with qualitative predictions.
- Studio/live switch; clearance and mono checks required.

**Audio:** "No audio examples." (3 mentions)

**Quality flags**
- No date or checkpoint.
- Angle and distance references are undefined (see Positions).
- The lesson presents the djembe top-only bass disagreement fairly (Huff vs Coppinger).
- The Duvel source is shared with Tabla.
- The plan says "review existing coverage rather than create a duplicate". This doc is the existing coverage.

---

### M06 Timpani Miking Technique Research
**Header:** "Lab: 1 …; Sequence: After djembe; before concert bass drum and concert snare." **No date, no checkpoint.**

**Anatomy to draw**
- Pitched single-headed kettledrums: kettle/bowl, head, rim.
- Foot pedal, pedal linkage, tension.
- Mallets; strike region "toward the player and near the rim" (Yamaha).
- Sets of 2 and 4 drums. Player order varies: "German and international drum order may differ".
- Conductor sightline, main array, adjacent brass/percussion.
- UNSPECIFIED: drum diameters, strut/base design, tuning gauge.

**Microphones**
- Cardioid condenser spot (generic).
- Schoeps "Mozart" Orchestra Set: one cardioid timpani channel; Colette is named only in the URL [7].
- Two DPA cardioids, the 4011 (ref title) [8].
- Neumann MCM clip-microphone system [9].

**Positions**
- "One mic between two timpani, about 1 m above the heads" [6].
- Four drums: "one spot per *pair*" [6].
- Schoeps support-tube lengths are hardware, "not capsule-to-head distance" [7].
- Main array alone [5].

**Safety**
- Mark the mallet sweep, body path, pedal travel and conductor sightline.
- Nothing may touch head, rim, pedal or linkage.
- Mute before adjusting; omit a spot if a stand cannot be placed safely.
- Max SPL is not human exposure [11, 13].

**Multi-mic**
- Main array first, then add the spot.
- Stereo and mono checks; polarity is not time correction.
- Delay: "measure and listen", no single numeric offset.
- Two spots: don't hard-pan automatically [5, 12].

**Proposed app presentation**
- Two- and four-drum layouts with editable player order.
- Mallet/arm arcs, pedal zones, conductor sightline, main-array direction, one vs two shared spots.
- Qualitative blend, articulation, spill and access.
- All distances are adjustable examples; no audio.

**Audio:** "No audio examples." (4 mentions)

**Quality flags**
- No date or checkpoint.
- The key source [6] is a Decca-tradition book excerpt hosted on **ebrary.net**, an unofficial mirror. Cite the book itself.
- Overlaps Full Orchestra (E14) and Percussion Ensembles (E12) on main-array practice.

---

### M07a Concert Bass Drum Miking Technique Research
**Header:** "Lab: 1 …; Sequence: After timpani; before concert snare." **No date, no checkpoint.**

**Anatomy to draw**
- Suspended two-headed gran cassa: playing head and opposite (resonant) head.
- Wheeled, tilting stand with "four caster brakes", pivot holders and "two wing bolts" (Yamaha CB-9000).
- Mallets and their arc; damping hand reaching both heads.
- Drum faces sideways into the ensemble; conductor; main array.
- UNSPECIFIED: diameter, head material, stand height.

**Microphones**
- No models named.
- A cardioid spot is adequate with an omni main array; an omni spot changes the image more.
- "Bass-drum-branded" kick mics may be shaped.
- Ribbon caution: the Decca guide warns against a close ribbon [1].

**Positions**
- One spot "just above the concert bass drum, aimed diagonally down at the playing head, about 45 cm (18 in) away" [1].
- Opposite-head spot: explicitly an experiment, with no source distance.
- More distant side/front: trial inference.
- The 1 m figure is for timpani and must not be swapped in.

**Safety**
- Never unlock, tilt, rotate or lift the drum.
- CB-9000: "lock four caster brakes and use at least two people when mounting… loosen the two wing bolts before angle adjustment" [3].
- "A falling concert bass drum can cause severe injury."
- No mic in the mallet arc or the damping reach. NIOSH [7].
- Pad may be needed at 45 cm.

**Multi-mic**
- Main array alone, then add the spot.
- Mono/stereo checks with hits, rolls and decay.
- No automatic far-head polarity reversal.
- Time alignment only by listening [4, 8].

**Proposed app presentation**
- Diagram: suspended drum, stand pivot and caster locks, mallet arc, both-head damping reach, the diagonal playing-side spot, main array.
- Live/studio selector.
- Player-clearance and stand-safety checks required before accepting a position.

**Audio:** "No audio examples." (4 mentions)

**Quality flags**
- No date or checkpoint.
- Uses the same ebrary.net source.
- "The source's *possible* suggestion of rotating the drum…" is a hedged claim about what the source says. Verify it.
- No microphone models, which the plan's part 2 asks for.

---

### M07b Concert Snare Drum Miking Technique Research
**Header:** "Lab: 1 …; Sequence: After concert bass drum; before headed tambourine." **No date, no checkpoint.**

**Anatomy to draw**
- Batter head and snare-side head.
- Snares: wire, cable or gut types (Yamaha).
- Shell; muffling; throw-off/snare controls.
- Stand; sticks; full stick arc; adjacent percussion; main pickup.
- UNSPECIFIED: size, strainer design.

**Microphones**
- Only the SM57 (kit context) [5, 6].
- Generic dynamic and condenser.

**Positions**
- No concert-specific number.
- Borrowed from kit snare: SM57 "roughly 2.5–7.5 cm (1–3 in) above the rim"; Shure tutorial "about 10 cm (4 in)" [5, 6].
- Broad spot "above and to one side… aiming across the batter head": no number (inference) [4–6].
- Lower mic, room/main pair: no numbers.
- Boston Pops: no dedicated spot at all (Colby) [3].

**Safety**
- Highest and widest stick motion, roll/grip, throw-off changes.
- Mute while moving; no clamp without approval; NIOSH [7].

**Multi-mic**
- Top/bottom compare in mono; polarity not mandatory.
- Spot against the main/section mics; mono matters for a summed PA or broadcast [5, 6, 9].

**Proposed app presentation**
- Concert snare on its stand: batter head, underside snares, stick arc, snare controls, optional upper and underside mics, ensemble main pickup.
- Branches first on "Is a spot needed?"
- Clearance and live feedback checks; no audio.

**Audio:** "No audio examples." (4 mentions)

**Quality flags**
- No date or checkpoint.
- All numbers are kit-snare borrowings, so the lesson cannot give the app a concert-specific position.
- Its audit says "Shure's kit-oriented guidance says top and bottom microphones are invariably out of phase". The kit-snare lesson quotes the same Shure 2026 article as "usually". This is an inconsistent characterization.
- Duplicates M02's geometry.

---

### M08 Headed Tambourine Miking Technique Research
**Header:** "Lab: 1 …; Sequence: After concert snare; last named instrument in the Membranophones list." **No date, no checkpoint.**

**Anatomy to draw**
- Headed frame/shell with a membrane (e.g. goat skin).
- Metal jingle pairs in rows; pins.
- Rim/jingle region.
- Played by hand, stick, shake, thumb/finger roll, knee/fist.
- Mounted variant on a stand.
- Player arm, wrist and hand swing.
- Held at "a roughly 45-degree playing angle" (PAS). This is the player's hold, explicitly NOT a mic angle.
- UNSPECIFIED: diameter, number of jingle rows.

**Microphones**
- No models named.
- Condenser, dynamic or ribbon (Yamaha). A ribbon must never sit in the swing or an air blast.
- Live tour used "one cardioid" shared for shakers and tambourine, plus percussion overheads [6].

**Positions**
- Shure: "6–12 in (15–30 cm)" generic tambourine [4].
- Yamaha: "about 8 in (20 cm)" for hand percussion [5].
- Head-forward and jingle-forward aims: tonal prediction marked inference.
- Sideways motion relative to the mic gives steadier level: a player choice, not a requirement.

**Safety**
- Full motion envelope.
- Do not modify loose jingles or pins.
- Peak metering, because a VU meter under-reads [5].
- NIOSH [9]; no deliberate feedback.

**Multi-mic**
- Spot plus percussion overhead/ensemble checked in mono; polarity is diagnostic [8].
- More open mics live means more risk.

**Proposed app presentation**
- Headed frame, membrane, jingle pairs, hand/stick and shake paths, a stand at a safe location, a broad pickup region.
- Move the mic (not the player).
- Studio/live/ensemble modes; qualitative head/jingle balance.
- Motion-path clearance and a peak-meter check.

**Audio:** "No audio examples." (4 mentions)

**Quality flags**
- No date or checkpoint.
- Says it is the "last named instrument" and "closes the named Membranophones instruments". This is false given M09–M13 in the plan.
- No mic models.
- The 6–12 in Shure figure is generic tambourine, not headed (the lesson admits this).

---

### M09 Drum Overhead Miking Technique
**Header:** "Pro Audio Training Academy | Drum Kit Cross Reference | Research checkpoint 5". **No date.** Not labelled Membranophones.

**Anatomy to draw**
- The whole kit: kick, snare (off-centre in the assessment), toms incl. floor tom, hi-hat (left side in the assessment), ride, crashes (asymmetric).
- Drummer envelope: head, right shoulder (Recorderman), sticks, raised cymbal edge.
- Stands, booms, stereo bars, counterweights/ballast.
- Ceiling and lights; room; PA/wedges; audience.
- Top and side views required.
- UNSPECIFIED: kit configuration beyond the assessment; handedness (implied right-handed: hi-hat left, floor tom on the side).

**Microphones**
- **No models named.**
- Directional pairs, cardioids, figure-8 (M-S), omni, wide cardioid.
- Dynamic "can serve as an overhead".

**Positions**
| Technique | Position as stated | Source |
|---|---|---|
| Mono overhead | "about 1 ft above the drummer's head" (Shure live guide) | [4] |
| X/Y | capsules as coincident as possible, not touching; "A 90° cardioid arrangement is one common example" | [5, 6] |
| ORTF | "about 17 cm apart and 110° apart" | [6] |
| A/B | spaced across the kit; no number | [2, 5, 6] |
| Glyn Johns main overhead | above the snare; "Roughly 40 in (about 1 m) from the snare" | [12] |
| Glyn Johns side mic | beside/just beyond the floor tom aimed across to snare/hi-hat; "about 6 in (15 cm) above the floor-tom rim" | [12–14] |
| Glyn Johns distance check | equal acoustic-centre-to-snare distance for both mics | |
| Glyn Johns spots | kick plus optional snare: 3 or 4 mics total | |
| Recorderman | one cardioid above the snare, one "by the drummer's right shoulder", equidistant from snare and kick; "Its cited 32-inch dimension" (what is measured is UNSPECIFIED) | [6] |
| Mid-Side | Mid forward plus side-facing figure-8 at nearly the same point; L = M+S, R = M−S; S cancels in mono | [6, 7] |

- Placement controls: height, front/back (front favours cymbals and rack tom; rear favours snare, floor tom and hi-hat [1]), aim/pattern, pair width/centre.
- Audio centre through kick and snare [1].

**Safety**
- No precarious boom over the player.
- No suspension from the building except by qualified personnel.
- X/Y mics must not touch (mechanical noise) [5].
- NIOSH [10]; ZG01 [11]. Gain on the strongest playing.

**Multi-mic**
- The fullest treatment in the lab. X/Y mono reliability; A/B comb filtering.
- Equal snare distance ≠ whole-kit coherence.
- Add close mics one at a time; polarity ≠ delay; HPF trade-off.
- DPA ("A/B generally not suitable for mono") vs Shure (allowed after checks) is reconciled in the lesson.

**Proposed app presentation**
- Top and side views: kit, player envelope, stands, room.
- Start with mono vs stereo and the overhead role.
- Choose X/Y, ORTF, A/B or Glyn Johns; M-S and Recorderman as explanations.
- Glyn Johns branch: position OH and side mic, a snare-distance aid ("reports geometry without promising perfect phase"), optional kick/snare, modest adjustable panning, mono check.
- Mark unsafe side-mic and boom locations. Do not show "an arbitrary fixed 40-inch or 6-inch location as universally safe".
- Live mode adds PA, monitors and feedback.

**Audio:** "No audio examples are included." (2 mentions)

**Quality flags**
- No date; header says "Drum Kit Cross Reference".
- No mic models (plan part 2).
- The Recorderman 32-inch figure is undefined.
- It is the de facto home of M11 content but does not cover minimal/extensive full-kit arrangements or room mics (M10).
- Part 8 is an assessment scenario only.

---

### M12 Tonbak Miking Technique
**Header:** Pro Audio Training Academy • Membranophones Lab • M12 • October 4 2026.

**Anatomy to draw**
- Single-headed Iranian goblet drum; wood and skin. Variant: brass and parchment (Met 89.4.332).
- Head (centre vs edge/rim strokes); open lower end; shell, possibly decorated.
- Player posture, body support, hand paths, legs.
- UNSPECIFIED: playing orientation. Tonbak is normally held horizontally across the lap, but the lesson only says "note the head orientation". Also unspecified: dimensions.

**Microphones**
- Option table (no models):
  - cardioid SDC
  - cardioid moving-coil dynamic
  - pressure omni
  - super/hypercardioid
- Shure BETA27: supercardioid, rejection toward the rear sides; used only as a wedge-placement example [9].
- DPA 4099 appears only as a mounting-guide reference title [5].

**Positions** (all explicitly "instructor-designed trials", capsule to target; angles "relative to the local head normal")
| Trial | Position |
|---|---|
| A | cardioid "roughly 25–40 cm from the head", audience side; axis "roughly 30–45 degrees from the head normal", aimed between centre and rim |
| B | "approximately 10–20 cm from the chosen head area" |
| C | "60–100 cm from the instrument" (quiet studio); optional omni |
| D | second mic "15–30 cm outside the lower opening" on an independent support |
| E | room mic "approximately 1–2 m away"; optional coincident pair |

**Safety**
- Hand clearance governs.
- No clamps on a delicate rim, skin or decorated shell.
- Check the miniature-mic adapter/powering.
- Sends down; no sustained feedback.
- **No hearing-exposure (NIOSH) content at all.**

**Multi-mic**
- Five-step mono procedure: polarity, delay only for a measured problem.
- "The 3 to 1 rule is a spill-management guideline, not a guarantee" (attributed to Shure [8]).

**Proposed app presentation**
- **Section absent.**

**Audio:** "No supplied audio examples are required." (1 mention)

**Quality flags**
- Missing app-presentation section.
- Missing hearing safety.
- All numbers are unsourced trials, though honestly labelled. Confidence is self-rated "moderate".
- **Best part 8 in the lab:** 45–60 min exercise, 7 steps, pass criterion, explicit position-log fields.
- No tonbak-specific miking source exists (admitted).

---

### M13 Tabla Miking Technique (Tabla-Miking-Lesson.txt)
**Header:** Pro Audio Training Academy • Membranophones Lab • M13 • October 4 2026.

**Anatomy to draw**
- **Dayan** (also dahini or tabla): smaller, wooden, cylindrical.
- **Bayan**: larger, clay or metal, kettle-shaped.
- Compound heads with syahi/siyahi: central on the dayan, **off-centre on the bayan**. The bayan pitch is changed by palm pressure.
- Rim; straps; "drum supports".
- Seated or platform player; hands, knees; exit route.
- UNSPECIFIED: support rings/cushions, tuning blocks, braces/lacing detail, dimensions, which side each drum sits ("right" is not always the same viewpoint).

**Microphones**
| Model | Type / pattern as stated | Source |
|---|---|---|
| Shure KSM137 ×2 | cardioid condensers | [4] |
| Audix D1 | on the higher drum; hypercardioid dynamic | [5] |
| Audix D4 | on the lower drum; hypercardioid dynamic | [5] |

Options table: one cardioid condenser, two cardioid condensers, one or two directional dynamics, coincident pair, pressure omni.

**Positions**
| Method | Position | Source |
|---|---|---|
| Sourced close pair | KSM137s "3–4 inches from the drumheads, angled to improve separation" ("approximately 7.6–10.2 cm"); no target or angle | [4] |
| A (trial) | one cardioid "30–50 cm above and in front of the area between the heads" | |
| B (trial) | "15–25 cm from each head", then approach | |
| C (trial) | XY 90° cardioid pair at "50–80 cm from the tabla set" | [7] for XY geometry only |
| D (trial) | room mic "roughly 1–2 m away" | |

**Safety**
- Hand clearance first.
- Low stands that leave seating and the exit free.
- No hoop clips on straps or skin.
- Check the miniature-mic powering adapter.
- Sends down; no sustained feedback.
- **No NIOSH content** (only "comfortable headphone levels").
- Do not wet, heat, tape or alter the heads.

**Multi-mic**
- Five-step mono procedure.
- "No universal requirement to invert one tabla microphone."
- Equal distances, 3:1 and auto-alignment are not proof of a good blend.

**Proposed app presentation**
- **Section absent.**

**Audio:** "No audio examples are included" / "no supplied audio examples are required."

**Quality flags**
- Missing app-presentation section and hearing safety.
- The Audix D1 is historic equipment (acknowledged).
- Met naming contradiction (handled in the lesson).
- Strong part 8 with position-log fields.
- Shares the Duvel source with Djembe: djembe uses 2–4 in at 40–60°, tabla 3–4 in. Consistent.

---

## 3. CROSS-LESSON

### (a) Distinct microphone models (21)
Count = number of Lab 1 lessons naming the model; "ref-only" means it appears only in a reference title or URL.

| Model | Count | Lessons |
|---|---|---|
| DPA 4099 | 5 | Toms, Congas, Bongos, Timbales, Tonbak (ref-only) |
| Shure SM57 | 3 | Snare, Concert Snare, Timbales (ref-only) |
| Audix D4 | 3 | Toms, Djembe, Tabla |
| Sennheiser e 904 | 2 | Snare, Toms |
| Audix D2 | 2 | Toms, Timbales |
| DPA 4011 | 2 | Timbales, Timpani (ref title) |
| Shure KSM137 | 2 | Djembe, Tabla |
| Shure Beta 52A | 1 | Kick |
| Shure Beta 91A | 1 | Kick |
| Sennheiser e 902 | 1 | Kick |
| AKG D112 MkII | 1 | Kick |
| Audix i5 | 1 | Snare |
| DPA 2011 F | 1 | Snare (verify name) |
| Shure Beta 56A | 1 | Toms |
| Earthworks DM20 | 1 | Toms |
| Audix D1 | 1 | Tabla |
| Shure Beta 181 | 1 | Bongos |
| AKG C-451 EB | 1 | Djembe |
| Schoeps Colette "Mozart" set | 1 | Timpani |
| Neumann MCM | 1 | Timpani |
| Shure BETA27 | 1 | Tonbak (as a polar example) |

Mounts named:
- Sennheiser MZH 604 (Toms)
- Earthworks RM1 (Toms)
- DPA drum clip/gooseneck (Toms)
- Stereo bar (Overheads)

Lessons naming **no** model: Drum Overheads, Concert Bass Drum, Headed Tambourine.

Pattern taxonomy the app needs:
- cardioid, supercardioid, hypercardioid
- "modified supercardioid"
- wide cardioid, omni (pressure), figure-8/bidirectional
- boundary (pattern unstated)

### (b) Reusable lab-engine interaction patterns (shared by most or all lessons)
1. **Context selector:** studio/live. Hand drums use 3–4 settings: quiet studio, band in room, loud stage, mobile/seated player.
2. **Anatomy labelling:** tap to identify parts. Every lesson starts with "hear and identify the source first".
3. **"Is a mic needed?" / channel-count branch:**
   - zero (overheads or main array carry it)
   - one shared
   - one per drum
   - top+bottom or head+opening
   - stereo pair
   - room
   This branch is central for timpani, concert BD, concert snare, toms and snare.
4. **Mic chosen by properties** (type, pattern), with brand shown only as provenance for a sourced number.
5. **Drag mic within permitted regions** over top and side views:
   - collision/clearance overlay from player motion arcs (stick, hand, mallet, damping, pedal, leg)
   - a "full-motion clearance check" gate before a position is accepted
   - all 14 lessons demand this
6. **One-variable-at-a-time controls:** distance, height, rim-vs-centre target, aim angle (define the reference: Tonbak uses the head normal), pattern.
7. **Position provenance badges:** sourced manufacturer/practitioner number (with reference surface) vs instructor trial vs no number given.
8. **Two-mic combine panel:**
   - mono sum button, polarity switch drawn separately from the arrival-time difference
   - optional distance aid (snare-distance for Glyn Johns/spaced pairs)
   - written outcomes, never curves
9. **Gain/headroom step:** strongest-stroke check, pad position, peak vs VU meter (tambourine).
10. **Live overlay:**
    - wedges/PA placed against the actual polar pattern (cardioid rear null vs super/hyper rear lobe)
    - open-channel count
    - "never create feedback"
11. **Ensemble main-array mode:** main array alone, then add a spot (timpani, concert BD, concert snare, tambourine).
12. **Qualitative outcome text** labelled "tendency", plus a final assessment, position log and pass-criteria checklist.

The engine could be one generic "MicPlacementScene", configured per instrument with:
- part geometry
- motion envelopes
- permitted regions
- sourced positions with provenance
- channel-count options
- context list
- outcome text tables

### (c) Objects to illustrate and difficulty (vector, technically accurate)
| Object | Difficulty | Why |
|---|---|---|
| Full drum kit, top + side, with player envelope (Overheads, Toms, M11) | **hard** | Many parts, overlapping cymbals and stands, handedness, two consistent projections. |
| Kick drum + pedal + beater + reso port + internal pillow (cutaway) | medium | Cutaway; port optional. |
| Kit snare: top/bottom heads, wires, strainer, stand, hi-hat neighbour | medium | |
| Rack/floor toms with mounts, legs, clamps | medium | |
| Congas, 2–3 on stands/floor with open bottoms | medium | Stave shells, lugs; sizes unspecified. |
| Bongos, macho/hembra + centre block | simple | |
| Timbales on stand + bell bracket + cowbell/block/cymbal + cáscara zones | medium | |
| Djembe with posture variants (between legs / tilted / on stand) | medium | Rope tuning, if drawn, pushes it to hard. |
| Timpani, 2- and 4-drum sets: kettles, pedals, linkage, player arcs, editable order | **hard** | |
| Concert bass drum on tilting suspended stand: casters, pivot, wing bolts, two-hand damping | **hard** | |
| Concert snare on stand with throw-off | medium | |
| Headed tambourine: jingle pairs, slots, pins, held/shaken/mounted states | medium | |
| Tonbak with correct lap/horizontal posture and carved shell | medium–hard | Posture unspecified. |
| Tabla pair: off-centre bayan syahi, straps/supports, seated player | **hard** | Cultural accuracy; unspecified support/tuning detail. |
| Mic family | medium | Variants: end-address dynamic, side-address condenser, SDC, boundary, miniature clip + gooseneck, rim clamp, figure-8, X/Y/ORTF stereo bar, boom stand. |
| Motion envelopes (stick/hand/mallet/pedal arcs) | medium–hard | Must be honest "illustrative", since no source supplies them. |
| Room/PA/wedge/conductor/main-array context | simple | |

### (d) Disagreements between lessons
1. **Glyn Johns location:** Congas says it is taught in Ensembles & Voice (rhythm sections). The plan, Overheads, the other 7 lessons and the Lab 5 Rhythm-Sections doc all say Drum Overheads (Lab 1).
2. **Sequence end:** Headed Tambourine claims to be the last Membranophones instrument; Tonbak and Tabla (M12/M13) follow it.
3. **Shure snare polarity:** the kit-snare lesson says the Shure 2026 article says inversion "usually" helps. Concert Snare's audit says Shure kit guidance says top and bottom are "invariably out of phase".
4. **SM57 "about 4 in" reference:** kit snare says "about 4 in. away" (no metric; from "the drum"). Concert snare says "about 10 cm (4 in)" and "about 4 inches from the snare".
5. **Same Shure hand-drum table cited under two titles:** "Microphone Techniques for Drums" (Congas, Bongos, Tambourine) vs "Microphone Techniques for Recording" (Timbales).
6. **Same Jonas Brothers DPA case cited from two hosts:** svconline (Congas) vs dpamicrophones.com (Bongos, Timbales, Tambourine).
7. **Hearing-safety depth varies:**
   - Kit lessons quote NIOSH 85 dBA / 8 h / 3 dBA.
   - Hand and concert lessons cite NIOSH without figures.
   - Tonbak has none; Tabla has only "comfortable headphone levels".
8. **Angle conventions:** only Tonbak defines its angle reference (head normal). The e 904 "30–60 degrees" and djembe "40–60°" are undefined.
9. **Header/format:** three formats; dates present only on 5 of 14; scope IDs only on 2; checkpoint 4 missing.
10. **Proposed app presentation:** present in 12 lessons, absent in Tonbak and Tabla.
11. **Units:** Kick mixes cm and mm. Overheads, Snare and Djembe give inches first with metric in brackets. Tonbak and Tabla are metric-only trials.

The lessons agree on several points, all compatible:
- polarity is diagnostic and never mandatory
- 3:1 is not a guarantee
- no deliberate feedback
- no audio
- max SPL ≠ hearing exposure

### (e) Open questions for the owner
1. **M10, M11 and the speaker-cabinet/Leslie module have no lessons.** Should they be written before the lab is built, folded into Overheads, or dropped from Lab 1 v1?
2. **Fix-ups before build:**
   - correct the Congas Glyn Johns cross-link
   - delete the stale "ride cymbal deferred" note
   - remove Tambourine's "last instrument" wording
   - unify headers, dates and IDs
3. **Tonbak and Tabla have no app-presentation section.** Should they follow the hand-drum pattern (top/side view, safe regions, mono gate)?
4. **Brand vs properties:** lessons say "choose by properties, not brand", yet almost every sourced number is model-specific. Should the app show the model as the number's provenance, or hide it?
5. **Instructor-trial numbers (Tonbak, Tabla) and 0-number lessons (Bongos, Timbales, Concert Snare):** show trial ranges with a distinct badge, or show regions only?
6. **Clearance zones:** no source defines stick, hand or mallet envelopes, so the app must invent illustrative ones. Is that acceptable if labelled?
7. **Verify questionable model facts:**
   - DPA "2011 F" and its 140 dB
   - Beta 52A "modified supercardioid"
   - Beta 91A pattern (needed to draw it)
   - Beta 91A "25 to 152 mm"
   - Recorderman "32-inch" meaning
8. **Replace the ebrary.net citation** (Timpani, Concert BD) with the book itself.
9. **Hearing safety:** add NIOSH figures to Tonbak and Tabla for parity.
10. **Human review sign-off:** several lessons require a drummer plus a qualified practitioner to review physical setups before publishing. Who signs off?
11. **Kit configuration to draw:** handedness, number of toms, cymbal layout. The Overheads assessment implies right-handed: hi-hat left, off-centre snare, asymmetric crashes.
12. **Cultural instruments:** confirm the tonbak posture and tabla support/tuning details with a player before drawing.
