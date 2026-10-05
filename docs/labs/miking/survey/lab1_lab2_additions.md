# Lab 1 and Lab 2 additions: source survey (M10, M11, Speaker/Leslie module, I04)

Surveyed 2026-10-04. Read in full: the four new lesson files, the master plan, and the existing surveys lab1.md and lab2.md. For agreement checks I also read the Electric-Guitar-Amplifier and Electric-Bass-Amplifier lessons in full, and searched the Kick, Snare, Toms, Drum-Overheads, Headed-Tambourine, Maracas, Harmonica, Rhodes, Wurlitzer, Pipe-Organ and Clavinet lessons for the relevant passages.

Conventions (same as lab1.md / lab2.md):
- [n] = the lesson's own reference number.
- "UNSPECIFIED" = the lesson implies the item but gives no detail.
- Numbers are copied verbatim, units as written.
- "9-part" = the master plan's required structure: 1 Source/task · 2 Mic selection · 3 Core positions · 4 Alternatives · 5 Studio/live · 6 Multi-mic · 7 Troubleshooting + safe setup · 8 Teaching exercise (repeatable comparison + observation sheet + criteria) · 9 Evidence audit.
- "TRIAL" = a position the lesson itself labels as a classroom proposal or practical trial, not a published value.

---

## 1. COVERAGE

| Scope ID | Plan scope | File | Status |
|---|---|---|---|
| M10 | Drum room microphones; room contribution; studio vs live usefulness | M10-Drum-Room-Microphones-Miking-Technique.txt | Covered. Closes lab1.md gap "M10 NO DOCUMENT". |
| M11 | Complete drum-kit setups: minimal/extensive, OH/close balance, cymbal cross-links | M11-Complete-Drum-Kit-Setups-Miking-Technique.txt | Covered. Closes lab1.md gap "M11 NO DOCUMENT". |
| (no ID) | Amplified-source support module: speaker cabinets incl. organ through a Leslie | Speaker-Cabinet-and-Leslie-Miking-Module.txt | Covered. Closes lab1.md gap "Support module NO DOCUMENT". The plan gives it no scope ID, and the header carries none. |
| I04 | Headless tambourine and tambourine jingles; cross-link headed tambourine | I04-Headless-Tambourine-and-Jingles-Miking-Technique.txt | Covered. Closes lab2.md "I04 MISSING" and repairs M08's broken cross-link. |

Format of the new batch (consistent with each other, different from the earlier lessons):
- Header: "Pro Audio Training Academy • <Lab> • <ID> • Studio and live applications" (M10, M11, Speaker) or "• Studio and live sound" (I04, same wording as Gong).
- No date in any header. The only date is in the Sources line: "checked October 4, 2026".
- All four have a guided exercise, a pass criterion and a blank observation sheet. This is the strongest part 8 in Labs 1 and 2 (lab1.md and lab2.md found an observation sheet only in Tonbak, Tabla and Gong).
- All four have a "Critical evidence audit" with Agreement / Differences / Contradictions / Gaps.
- **None of the four has a "Proposed app presentation" section.** The proposals below are this survey's own.
- References give bare URLs in angle brackets, without the "Read source" label used by the October 3 lessons.

---

## 2. PER LESSON

### M10 Drum Room Microphones Miking Technique
**Header:** "Pro Audio Training Academy • Membranophones Lab • M10 • Studio and live applications". No date in the header (Sources: "checked October 4, 2026").

**ANATOMY / STAGING TO DRAW**
- The whole kit as one source. Lesson parts named: kick, snare, toms, open/closed cymbals. Kit orientation must be marked.
- The room at full scale: walls, ceiling, doors, traffic routes, "air handling", "places dominated by flutter, excessive low-frequency buildup". Listening at "more than one height".
- Room corners (UA example only).
- Other performers, vocals, amplifiers, PA loudspeakers and monitor wedges (shared-room and live cases).
- Floor stands, long boom with "suitable base and counterweight", cables, rolling cases, exits.
- Forbidden mounting: wall, ceiling, overhead grid or venue structure without venue approval and qualified installation.
- A "boundary-adjacent trial" is mentioned under safety, but no boundary placement is described anywhere in the lesson.
- UNSPECIFIED: room dimensions, ceiling height, kit layout and handedness, mic heights for every position, XY angle, AB spacing, stand types.

**MICROPHONES**
| Model / type | Pattern as stated | Source |
|---|---|---|
| Shure SM4 | Not stated. Cited as a model-specific user-guide example, not a recommendation | [4] |
| "stereo pair of omnis" (DPA kick article) | omni; no model named | [3] |
| Generic choice table | one omni or directional mic; coincident XY cardioids; spaced omni pair; Mid/Side (forward Mid + sideways figure-eight Side) | [5, 6] |
| Condenser "common but not compulsory"; ribbon or dynamic as a deliberate tonal option | no models | none |

Verification list in the lesson: "maximum SPL, pad, self-noise, polar pattern, physical orientation and powering".

**POSITIONS** (verbatim)
| Approach | Position as stated | Reference point | Source |
|---|---|---|---|
| Low front kit pair | "a stereo pair of omnis approximately 1 m in front of the kit, low and in front of the kick" | the front of the kit | DPA [3] |
| One mic in front | "3–6 ft (about 1–2 m) in front of drums for its SM4"; "in front for more kick" | the drums | Shure SM4 guide [4] |
| One mic over the kit | "over the kit for more cymbals". No number | | [4] |
| Front mono room TRIAL | "from a safe position beyond the immediate kit, aim a single mic at the kit's approximate center; compare two marked positions at least a useful stride apart. No universal metre value is implied." | kit centre | none ("Classroom proposal") |
| Distant stereo room | "a near stereo pair and a room pair about 15 ft away in room corners". "one production example, not a prescription to use corners" | the kit (implied) | Universal Audio [7] |
| Generic | "A mic roughly one metre in front of the kit can be a low, integrated kit perspective" | | [3] |

Placement procedure for a pair: "Shift the whole pair before altering spacing"; for XY "keep capsules near coincident"; for AB "choose spacing with the source angle and desired width in mind" (no numbers).

Units: 1 m and 1–2 m are metric; "3–6 ft" is converted ("about 1–2 m"; 3–6 ft is 0.91–1.83 m); "15 ft" has no metric value (≈ 4.6 m).

**SAFETY**
- Floor stands and cables clear of the drummer, exits, rolling cases and other performers.
- Long booms: suitable base and counterweight.
- No attachment to a wall, ceiling, grid or venue structure without venue approval and qualified installation.
- Stop the performance before moving hardware. Keep stands out of cymbal, stick and drummer reach.
- Gain set on "the loudest full-kit passage, including crashes and rimshots"; "a recorder meter alone may not reveal capsule overload".
- Phantom power and cabling checked against the mic manual before connecting or switching.
- Hearing: only "Keep headphone and PA listening at safe, comfortable levels." **No NIOSH figure** (the kit lessons M01–M03 quote 85 dBA / 8 h / 3 dBA).
- "Do not intentionally provoke feedback as a demonstration."

**MULTI-MIC**
- Order: overheads alone, then with kick and snare, then add one room channel at its real level; listen in stereo and mono.
- Polarity is a diagnostic only: "Different source-to-mic distances create arrival differences that a polarity switch cannot generally correct."
- Room-mic timing: "Do not automatically time-align a distant room track to the close snare or kick." Alignment is "a creative option only after comparing the complete kit and recording the original position."
- XY: "relatively stable mono summation"; "not a cure for close-versus-room arrival differences".
- Spaced omni: "Spacing and position alter center image and mono cancellation."
- M/S: "Correct polarity, duplicate Side routing and level are required; mono downmix of a correct decode leaves Mid, but Mid versus close mics still needs checking."
- Live: a distant room mic "usually has substantial PA and monitor pickup and may consume gain before feedback". If needed for record/broadcast, a separate feed that may stay out of the PA and monitor sends.
- 3:1 is not mentioned. No delay figures (ms) are given.

**PROPOSED APP PRESENTATION** (section absent in lesson; survey proposal)
- Room-scale top view plus side view: kit (reuse the M09 kit art), walls, ceiling height, doors, traffic routes, other players and PA/wedges as toggles.
- Target first (step 1 of the exercise): "intimate kit, natural room, wide ambience, or a separate live/broadcast environment feed". "Use no room mic" is a valid answer.
- Position badges:
  - "Published: DPA, omni pair ≈1 m, low, in front of the kick"
  - "Published: Shure SM4 guide, 1–2 m in front" (model-specific)
  - "Production example: UA, pair ≈15 ft in corners"
  - "Trial: two marked positions, no fixed distance"
- One-variable comparator: position A vs B at matched level.
- Stereo-array tool (shared with M09): mono / XY / spaced omni / M/S, with an M/S decode panel and a mono-sum button.
- Arrival-time readout derived from drawn geometry (speed of sound), labelled "calculated from the drawing", with the lesson's rule shown next to it: do not auto-align.
- Live mode: routing matrix (PA, monitors, record, broadcast) with the room feed off the PA by default and an "operator check" step.
- Readouts qualitative only (kick/snare body, cymbals, early reflections, decay, spill).

**AUDIO:** "No audio examples are included." (line 3); "No audio examples." (pass criterion); "this lesson supplies no audio examples" (Sources). 3 mentions.

**QUALITY FLAGS**
- 9-part: all nine present. Part 2 is a real table. Part 7 has a symptom table plus a safety section. Part 8 has a 6-step exercise, a pass criterion and a two-position sheet. This is a strong lesson.
- Missing "Proposed app presentation" section.
- Hearing safety is thinner than M01–M03 (no NIOSH figure).
- Orphan mention: "A boundary-adjacent trial must also respect access and acoustic treatment." No boundary trial is taught.
- Stale forward reference: "M11 will cover complete kit channel plans". M11 now exists.
- Odd source fit: the 15 ft corner-pair anecdote is attributed to UA "Mixing in Stereo" [7], a mixing article, while the M/S article is [6]. Verify that [7] contains the anecdote.
- Shure SM4: the pattern is not stated, so a pickup lobe cannot be drawn from the text. Verify from [4].
- ORTF is absent (M09 teaches it with 17 cm / 110°). This is acceptable, but the app's stereo tool will show it, so the M10 text should not imply that XY/AB/M-S is the full list.
- "15 ft" has no metric value; "3 in" style issue does not apply here.
- Institutional words: "Pro Audio Training Academy"; "Classroom proposal" (×2: line 36 and the audit); "the student logs" (pass criterion); sheet header "Name ____".
- The UNSOURCED number check passes: every number is attributed, and the trial is explicitly numberless.
- Overlap: Overheads M09 (height adds room; XY/AB/M-S mono behaviour), Kick M01 (the same DPA kick article [3]; M01 used it only for "outside pickup", with no number), Snare/Toms ("overhead or room perspective may be the main picture"), E09.
- No expert-level errors found. The M/S statements are correct (L+R of a correct decode cancels Side and leaves Mid).

---

### M11 Complete Drum Kit Setups Miking Technique
**Header:** "Pro Audio Training Academy • Membranophones Lab • M11 • Studio and live applications". No date in the header (Sources: "checked October 4, 2026").

**ANATOMY / STAGING TO DRAW**
- Full kit: kick (batter, resonant head, port: "actual head/port"), snare top and optional bottom, rack/floor toms, hi-hat (incl. "hi-hat foot"), ride, "each crash", splash, China.
- Drummer envelope: "entire stick, cymbal, pedal, leg and drummer reach"; "a safe resting cymbal position is not the whole motion envelope".
- Hardware: stands, counterweights, rim-mounted clips ("check ... for fit and drum hardware stress"), cables away from pedals, feet, walkways and cases.
- System: stage box, console channel labels, PA, wedges, recording and broadcast paths, the audience/control-room listening position.
- Four target scenes in the "setup families" table: natural acoustic kit/small jazz group; studio pop/rock; small live stage; large live or broadcast production.
- UNSPECIFIED: kit configuration (tom count, cymbal count, handedness), all distances and heights, stand positions, pan widths.

**MICROPHONES**
- **No models and no patterns named.** The lesson defers explicitly: "Specific distances, mounts and polar patterns belong to the actual kick, snare, tom, overhead and cymbal lessons and each microphone's manual."
- Pattern words appear only for overhead geometry: XY vs spaced A/B [2, 3, 5].
- Phantom and ribbon compatibility "vary"; check maximum SPL "by actual model".

**POSITIONS**
No numbers anywhere. The lesson says: "These positions are directional descriptions, not universal centimetre specifications."

Channel-plan stages (verbatim roles):
| Stage | Plan | Source |
|---|---|---|
| One mic | "One safe whole-kit position above, slightly behind or in front, aimed for the required kick/snare/tom/cymbal balance." | [1, 4] |
| Two mics | "One whole-kit mic plus kick is a common low-channel option; alternatively, choose a documented two-mic whole-kit geometry" | [4, 5] |
| Three or four | "Add snare top if it needs independent presence; a fourth channel may be a second overhead or a side mic in a Glyn Johns family setup. Two overheads plus kick and snare is another four-channel plan." | [2, 5] |
| Expanded | "Overhead pair, kick, snare top and selected tom spots; add hi-hat, ride, snare bottom, second kick or room only when each gives a distinct useful control." | [1–3, 6] |

Close-mic roles (directional only):
- Kick: "Inside toward the batter for attack, outside or near the resonant head for more body"; two mics optional [1, 2].
- Snare: "From outside stick travel, aim across/top head"; bottom optional [1, 2].
- Toms: "One mic per tom or a strategically shared mic" [1, 6].
- Hi-hat/ride: optional spot [1, 7]. Crash/splash/China: "Usually assess overhead coverage first" [1, 7].
- Room/ambience: "usually a recording/broadcast choice rather than an automatic PA feed" [2, 8].
- Overhead image: Mike Major aligns it "to the acoustic line through kick and snare rather than simply the physical midpoint of the kit" [3].
- Low-count options documented by Shure [4]: "one overhead, kick plus overhead, and kick/snare/overhead".

**SAFETY**
- Stop playing before moving hardware; full motion envelope (see anatomy).
- Suitable stands and counterweights; cable protection; rim clips checked for drum-hardware stress.
- No suspension from venue structures without approval and qualified installation. "Secure all gear before the full-volume pass."
- Gain and pad set for "loudest anticipated hits, including rimshots and crashes"; "A clear meter reading does not prove the microphone capsule is free of overload."
- Mute outputs before connection changes; phantom and ribbon per manual.
- Hearing: "Limit unnecessary high-level repetitions and maintain comfortable monitoring." **No NIOSH figure.**
- Feedback: "Do not deliberately induce feedback or solve feedback merely by lowering a fader after the signal has already overloaded an earlier input stage."

**MULTI-MIC**
- Build the whole-kit picture first; add kick, snare and toms one at a time at plausible mix levels; compare each addition in mono.
- "A polarity switch only changes sign; it does not generally remove time-of-arrival differences. Check several strokes, not a single transient."
- "Equal snare distance does not make the whole kit 'in phase.'"
- XY "compact, relatively stable mono sum"; spaced A/B "requires more careful mono evaluation".
- Panning: choose drummer or audience perspective; pan tom/hat spots consistently with the whole-kit image; "Center kick and usually snare ... but do not force one pan recipe".
- Double kick/snare mics and snare bottom: assess alone and together.
- Overheads low end: "Do not automatically discard the overheads' low frequencies".
- Live: a smaller channel set may feed the PA while an extensive patch feeds record/broadcast; "test every routing path".
- 3:1 is not mentioned.

**PROPOSED APP PRESENTATION** (section absent in lesson; survey proposal)
- A "channel-plan builder" on the shared kit scene. The learner states a target first (jazz image, dry pop kit, live definition, stereo-with-room).
- Stage stepper (1 → 2 → 3/4 → expanded). Each added mic must name its purpose from a short list; an unjustified channel is flagged ("An optional channel is not automatically an improvement").
- Mic placement for each source opens the source lesson's own scene (M01, M02, M03, M09, I01): one placement engine, many entry points. M11 holds no geometry of its own.
- Mono check after each addition (qualitative readout); polarity switch drawn separately from arrival time.
- Pan view: drummer vs audience perspective toggle.
- Routing matrix: channels × PA / monitors / record / broadcast, for the "large live or broadcast" scene.
- Counter: channels, stands, inputs, open mics.

**AUDIO:** "No audio examples are included." (line 3); "No audio examples." (pass criterion); "this report contains no audio examples" (Sources). 3 mentions.

**QUALITY FLAGS**
- 9-part: part 2 (mic selection) is effectively absent by design; part 3 gives directions only, no numbers. Parts 5, 6, 7 and 9 are thorough. Part 8 is strong (6 steps, pass criterion, sheet).
- Missing "Proposed app presentation" section.
- Hearing safety thinner than M01–M03.
- Glyn Johns framing (minor, see Disagreement 4): the stage table reaches Glyn Johns at four channels ("a fourth channel may be ... a side mic"), which can read as if the snare spot is required. M09 says the three-mic variant omits the snare.
- Self-description as a "report" in the Sources line ("this report contains no audio examples").
- Ref [3] (Mike Major) uses the en-ASIA locale URL; M09 cites the same article at en-US. Same content, different host path.
- Institutional words: "Pro Audio Training Academy", "student exercise", "Student observation sheet", "Student ____", "teaching examples", "curriculum".
- Overlap: heavy and intentional. It is a synthesis of M01, M02, M03, M09, M10, I01 and E09 (stated in the curriculum line). The only new content is the staging logic, the target-to-plan table and the routing split.
- No expert-level errors found.

---

### Speaker Cabinet and Leslie Miking Module (no scope ID)
**Header:** "Pro Audio Training Academy • Membranophones Lab support module • Studio and live applications". No date in the header (Sources: "checked October 4, 2026").

**ANATOMY / STAGING TO DRAW**

*Conventional cabinet*
- The actual speaker behind the grille. A multi-speaker cabinet "may not have identical drivers or equal output".
- Dust cap / inner-cone region, the dust-cap/cone boundary, the outer cone. The lesson asks the learner to mark these "from outside the grille without removing it".
- Bass cabinets: "a separate horn/tweeter or multiple cone sizes".
- Signal sources feeding the cabinet: guitar, bass, amplified harmonica, Rhodes, Wurlitzer.
- "an internal crossover or external powered sub".
- A DI or instrument output as a separate electrical path.
- **Open-back vs closed-back is not mentioned** (the Guitar-amp lesson teaches the open-back rear mic).

*Leslie (traditional 122A/147A per Hammond [1, 2])*
- "a rotating high-frequency horn" (upper) and "a lower woofer radiating through a rotating bass drum/rotor".
- External features: "upper horn louvers", "lower-rotor openings", "a rear opening", "side louvers" (one interviewee's preference), ventilation, power cord.
- Internal items named but not to be accessed: motor, belt, back panel, grille, protective cover.
- Connection: organ-to-Leslie multipin cable; "122 and 147 interfaces can differ despite similar looking connectors"; "impedance selector".
- Other models: Leslie 3300 [5], 122H/142H [6]. "do not assume all rotary-speaker products have the same internal arrangement".
- Speeds: "Slow chorale, fast tremolo and the transition between them". **No rotor speeds (rpm), no acceleration or deceleration times.**
- Also UNSPECIFIED in the lesson:
  - horn construction (bell count, any counterweight or dummy bell)
  - woofer size and facing direction
  - rotation directions of horn and drum
  - drum shape (scoop/baffle)
  - crossover frequency
  - cabinet dimensions
  - louver count and positions per face
  - which face is the "front"
  - mic heights
- The radiation mechanism (Doppler pitch shift, amplitude modulation, moving directivity and room reflections) is never explained. The lesson only says the speeds "alter the moving sound".

*Staging*
- Stands outside the enclosure; cables away from vents, organ pedals, doorways, traffic.
- Risk of the heavy cabinet or a stand tipping.
- Live: PA, wedges, in-ear monitors, recording; a "mono PA".

**MICROPHONES**
| Model / type | Pattern as stated | Source |
|---|---|---|
| Shure PGA27 | not stated; cited only for its amp-placement range | [3] |
| "one compatible microphone" on a cabinet | not stated | [3, 4] |
| Leslie upper: one mic, or an XY pair, or two separated side mics | "directional capsules" for XY | [7] |
| Leslie lower: one mic | not stated | [7] |
| "A low-frequency capable mic" for bass cabinets | response and headroom to be checked | none |

No Leslie microphone model is named. The interviewee mic choices in [7] are not carried into the lesson.

**POSITIONS** (verbatim)
| Target | Position as stated | Reference | Source |
|---|---|---|---|
| Guitar/bass speaker | "1–6 in (2–15 cm) as a model-specific starting range" | capsule to grille (implied) | Shure PGA27 [3] |
| Guitar speaker, lateral | "dust-cap/cone boundary"; "more center often brighter and more edge often mellower" | the active speaker | John Mills [4] |
| One-variable trial | "Keep capsule-to-grille distance and level constant; move from inner cone toward outer cone" | capsule to grille | [3, 4] |
| Farther cabinet | "Move the mic farther back to a safe position". No number | | [3] |
| Leslie upper, one mic | "Aim a secure mic toward a reachable upper louver from outside". No number | upper louver | none |
| Leslie lower | "a lower mic roughly 3 in from a rear opening on his particular Leslie" (one organist; no metric value; ≈ 7.5 cm) | rear opening | Shure interview [7] |
| Leslie upper pair | "near-coincident XY pair outside the upper louvers" or "two separated upper-side mics" | upper louvers | [7] |
| Leslie distant | "a pair a couple of metres away in a good room" | the cabinet | [7] |

The bass-specific range from the Electric-Bass lesson ("10–45 cm (4–18 in)", Shure bass article) is not mentioned.

**SAFETY**
- Rotating parts and access: "Never push a capsule, cable, fingers or a tool through a louver." "Do not remove a back panel, grille or protective cover for this teaching setup." "do not reach toward the cabinet during operation." Cables must not "enter a rotating path" or "block air flow".
- Mains and electrical:
  - The 3300 manual warns not to open the unit; servicing goes to qualified people [5].
  - The 122H/142H manual "warns of hazardous voltage at legacy connector pins and different, incompatible 122/147 wiring" [6].
  - "Treat the organ-to-Leslie connection as installed equipment, not a microphone jack."
  - "Do not defeat a grounding connection, alter the organ-to-Leslie cable, change an impedance selector, or operate with a damaged cord. Do not touch exposed connector pins."
  - "Do not join a microphone input to an organ/Leslie multipin connector."
- Procedure: plan stands with the cabinet off; Leslie step 3 places mics "with power off".
- Mechanical: "Prevent a heavy cabinet or stand from tipping." Keep clear of organ pedals and vents.
- Airflow: no windscreen inside the cabinet; covers are never removed to cure buffeting.
- Gain: set on "the loudest cabinet passage and fastest rotor transition"; check mic and preamp overload independently. Mute console outputs before phantom changes.
- Hearing: only "Keep rehearsal and monitoring levels comfortable." **No OSHA or NIOSH figure** (the Guitar and Bass amp lessons quote OSHA 85 dBA; Rhodes and Wurlitzer cite NIOSH "Turn It Down").
- "Never demonstrate feedback deliberately."

**MULTI-MIC**
- Conventional: listen to each speaker first; two mics recorded separately and summed in mono, listening for "time arrival, loss of body or comb filtering".
- Leslie order: each mic alone → add lower to upper → optional upper XY → stereo and mono.
- XY upper pair: "as close to coincident as their mounts safely allow without touching"; "more stable upper-pair mono sum".
- Spaced upper pair: "a larger or more variable stereo picture as the horn rotates; time differences and room pickup can color a mono sum".
- "Listen across a full rotation and speed transition."
- Lower channel "commonly centered".
- Polarity: "a diagnostic, not a general repair for differing arrival times".
- Direct output: label it as an electrical source; it "may omit actual cabinet, room and moving air behavior, or it may already contain a rotary simulation".
- Live: a mono PA can use one upper and one lower channel; distant room mics "may hear PA return"; "reinforce only what the audience needs".
- 3:1 is not mentioned.

**PROPOSED APP PRESENTATION** (section absent in lesson; survey proposal)
- Two scenes in one module, with a signal-path tracer at the top: source → (DI tap) → amp → speaker/rotor → air → mic. "Air" and "electrical" paths are coloured differently.
- Conventional cabinet: front view of a speaker behind a see-through grille. Lateral slider (centre → boundary → edge) at a fixed distance; separate distance and angle controls; badge "Published: Shure PGA27 guide 2–15 cm". The same scene is entered from the Guitar, Bass, Harmonica, Rhodes and Wurlitzer lessons, each with its own sourced number (bass 10–45 cm, harmonica 2–5 cm, Wurlitzer 2.5 cm).
- Leslie: an exterior top view and front view. Mics may be placed only outside the cabinet; the louvers and openings are hard "no-entry" zones; a "power off while placing" step comes first.
- Rotor state selector: stop / chorale / tremolo / transition. The horn and drum rotate in the drawing only if sourced speeds are supplied. The mic that the horn mouth faces is highlighted. This is the new rotating-speaker model (see section 3).
- Stage stepper: one upper → upper + lower → XY upper + lower or spaced sides + lower → distant pair. Mono button after each.
- Qualitative readouts only. No simulated Leslie audio unless the owner overrides the "no audio" rule.

**AUDIO:** "No audio examples are included." (line 3); "No audio examples." (pass criterion); "this lesson has no audio examples" (Sources). 3 mentions.

**QUALITY FLAGS**
- 9-part:
  - Part 2 (mic selection) is weak. There is no selection section or table; "compatible microphone" is the main guidance.
  - Part 7 has a symptom table for the conventional cabinet only. Leslie troubleshooting is prose (buffeting, motor/belt noise).
  - Parts 5, 6, 8 and 9 are complete.
- Part 1 physics gap: the rotary mechanism (Doppler, amplitude modulation, moving directivity) is not explained, and no speeds or geometry are given. A rotating-speaker model cannot be built from this text alone.
- Terminology error: "near-coincident XY pair" (line 40). XY is a coincident technique; "near-coincident" denotes ORTF/NOS. Line 49 then says "as close to coincident as their mounts safely allow". This is the same defect lab2.md flagged in Marimba and Xylophone.
- The open-back cabinet and rear mic are omitted, although the Guitar lesson teaches them. This is a gap for a hub module.
- The bass-specific 10–45 cm range is omitted (see Disagreement 6).
- Hearing safety has no figure, unlike the four amp-related lessons it should anchor.
- Reference naming: line 55 cites "Hammond's Heritage manual", but no reference carries that title ([5] is "Leslie 3300 Owners Manual", [6] is "Leslie 122H 142H Owners Manual"). Verify which document is meant.
- "3 in" has no metric value.
- No curriculum cross-link list, unlike M11 and I04. Guitar, bass, harmonica, Rhodes and Wurlitzer are named once in prose only; the plan asks for cross-links.
- The plan asks to "Distinguish this instructional placement from the acoustic classification of the original instrument." The module only says the instrument "may be electronic, electric or acoustic before amplification", and the header says "Membranophones Lab support module" with no explanation of why a drum lab hosts it.
- Pipe-Organ says "Electronic organs and Leslie speakers are covered in their separate lesson". This module covers the Leslie but not the electronic organ itself (only its direct output).
- Institutional words: "Pro Audio Training Academy", "Students compare tone", "this teaching setup", "Guided teaching lab", "a safe classroom instruction", "Student observation sheet", "Student ____", "curriculum".
- Unsourced numbers: none. Every number is attributed.
- Overlap: dust-cap/boundary/edge guidance now appears in 6 places (this module, Guitar, Bass, Harmonica, Rhodes, Wurlitzer).
- Links: all Hammond URLs are under hammondorganco.com/wp-content/uploads/2022/09/. No obviously dead or odd links.

---

### I04 Headless Tambourine and Jingles Miking Technique
**Header:** "Pro Audio Training Academy • Idiophones Lab I04 • Studio and live sound". No date in the header (Sources: "checked October 4, 2026").

**ANATOMY / STAGING TO DRAW**
- Headless frame: "ring or crescent" (both shapes), loose metal jingles, "no vibrating drumhead".
- Jingle count and rows vary: "single- and double-row versions"; metals "brass, bronze and plated steel" (Meinl [3]).
- Playing methods: "shaken, struck into the hand, or mounted and struck"; sustained shake or roll; loudest accent; changes between hands.
- The arc of motion "rather than marking only its position at rest". Two motion directions relative to the mic: "toward and away" vs "side to side" (Yamaha [4]).
- Player location and facing direction (marked for repeat takes).
- Context: vocal mic (a singing player), hi-hat (layering), shakers and other percussion (shared area), wedges, side-fills.
- Mounted variant on a stand.
- UNSPECIFIED: diameter, crescent dimensions, jingle count and size, pins, handle/grip, mount hardware. Kit-mounted jingle forms (jingle ring on a hi-hat, jingle stick) are not covered, although the plan says "tambourine jingles".

**MICROPHONES**
- **No models named.**
- Small- or large-diaphragm condenser for "jingle detail and short attacks".
- Yamaha: "trying a dynamic or ribbon microphone when the result is too cutting" [4].
- Moving-coil dynamic as "a practical stage choice".
- Ribbon "an optional studio comparison only when safely supported".
- Directional mic for loud stages; rejection pointed at competing sources or wedges [2, 6].
- DPA tour: "a dedicated cardioid condenser plus open percussion mics" [7] (model not named here; Maracas names it as a 4011A).

**POSITIONS** (verbatim)
| Setup | Position as stated | Reference | Source |
|---|---|---|---|
| Shure recording | "6–12 in (15–30 cm) from tambourine"; change distance or angle if too bright | "the instrument's normal playing zone" | [1] |
| Shure live | "the same starting range" | as above | [2] |
| Yamaha | "roughly 8 in (20 cm) as a starting point for hand percussion" | not stated | [4] |
| Focused mono | "slightly above or to the side of the normal playing zone ... initially 6–12 in from the nearest expected stroke" (inches only) | **nearest expected stroke** | [1, 2] |
| Exercise step 2 | "about 6–12 in from the nearest normal movement" | **nearest normal movement** | |
| Softer studio | "farther into a useful room or rotate its aim away from the most direct jingle impact". No number | | [1, 5] |
| Loud stage | "near a predictable zone, keeping adequate physical clearance". No number | | [2, 6] |
| Shared area | "one overhead or area mic ... height for the complete performance area". No number | | [7] |

**SAFETY**
- Inspect jingles, frame and loose parts for unintended rattles; inspect stands.
- Clearance: "leave clearance for the complete stroke"; "Do not ask a player to swing toward an exposed capsule to increase level"; "No source specifies a universally safe minimum stroke clearance". The sheet logs "Loudest stroke clearance".
- Gain: peak indication, since "slow VU meters may miss brief peaks" [4]; check mic and input overload; "reducing a later fader cannot repair an overloaded earlier stage".
- Stand vibration and footsteps: secure and isolate the stand; high-pass only after checking.
- Live: start with the channel muted while positioning; bring up at a controlled soundcheck level.
- Ribbon: per manufacturer handling.
- **No hearing-safety statement at all** (M08 cites NIOSH [9]). **No phantom-power or electrical statement.** No feedback-demonstration prohibition (it is present in M08 and every kit lesson).

**MULTI-MIC**
- One mono channel first.
- Two mics on the same moving instrument: "compare each alone and their sum in mono through actual playing; moving arrival times can produce changing coloration" [6, 8].
- Singer plus tambourine: existing vocal mic vs dedicated mic vs both; "Dedicated microphones can increase spill into vocal or drum channels."
- Stereo "optional" for a small moving source.
- Hi-hat layering: "listen to the arrangement rather than using a prescribed pan or fixed high-pass setting".
- Live: "choose the fewest open channels". Polarity and 3:1 are not mentioned.

**PROPOSED APP PRESENTATION** (section absent in lesson; survey proposal)
- Reuse the M08 headed-tambourine scene with a "head / no head" switch, plus a ring vs crescent shape switch. The head-tone readouts disappear when headless.
- Motion layer: shake arc, hand-strike accent, mounted strike. A motion-direction toggle (toward/away vs side-to-side) shows level variation as a qualitative readout.
- Distance comparator with badges "Published: Shure 15–30 cm" and "Published: Yamaha ≈20 cm" (hand percussion), measured from the playing zone. The reference point must be fixed first (see flag).
- A peak vs VU meter demo is the natural place for the house meter components (levelColor, peak-red). It must be driven by a real or recorded signal, never a stylized one.
- Studio / live / shared-area selector; open-channel counter.
- Closing question: "Why is this an idiophone?" (exercise step 6).

**AUDIO:** "No audio examples are included." (line 3); "No audio examples." (pass criterion); "this lesson contains no audio examples" (Sources). 3 mentions.

**QUALITY FLAGS**
- 9-part:
  - Part 2 is a paragraph, not a section.
  - Part 6 is short.
  - Part 7: troubleshooting is good ("Gain, brightness and unwanted sound") but safety is thin (no hearing, no phantom, no feedback rule).
  - Part 8 is strong (6 steps, pass criterion, 4-trial sheet).
- The distance reference point is inconsistent: "normal playing zone" (line 8) vs "nearest expected stroke" (table) vs "nearest normal movement" (exercise). These differ by the stroke radius, so the app cannot place the 15–30 cm marker until one reference is chosen.
- The table gives "6–12 in" without metric (metric appears only in the prose above it).
- The same Shure 6–12 in figure is attributed to three Shure documents across lessons (see Disagreement 7).
- DPA tour wording drifts across lessons (see Disagreement 8).
- Meinl [3] is a single product page (Artisan Edition wood tambourine), cited for the range-wide claim "single- and double-row versions and brass, bronze and plated steel variants". Verify that one page supports a range-wide statement.
- Weak source: Waves [5] "8 Handy Microphone Techniques" is a blog list. The lesson uses it only for a "creative studio option", which is appropriate.
- DPA [8] "10 Things Digital Gizmos Cannot Correct" is cited for "a tambourine as a revealing test of microphone intermodulation distortion". Plausible; verify the wording.
- The live-guide URL [2] uses the content-files.shure.com/dievision/archive host; M10 and M11 use the damfiles host for the same PDF (the same split lab2.md flagged for Gong).
- Scope gap: "tambourine jingles" on a kit (hi-hat jingle ring, jingle stick) is not addressed.
- Institutional words: "Pro Audio Training Academy", "Students will establish", "Guided teaching exercise", "Student observation sheet", "Student ____".
- Overlap with M08 is large: Shure 6–12 in, Yamaha 8 in, VU vs peak, side-to-side motion, DPA tour. Both lessons are consistent apart from the DPA wording. The shared content argues for one tambourine scene with a head switch.
- Headed-vs-headless honesty is good: "The cited sources generally discuss 'tambourine' without a controlled headed-versus-headless comparison."

---

## 3. CROSS-LESSON

### (a) How these fit the existing engine

Three engine parts are assumed from lab1.md and lab2.md: one placement engine (MicPlacementScene), a stereo-array tool, and a stage/room plan.

| Lesson | Placement engine | Stereo-array tool | Stage/room plan | New need |
|---|---|---|---|---|
| M10 | Light. The kit is one source; mics sit outside the kit envelope | **Heavy**: mono, XY, spaced omni, M/S decode, low front pair | **Heavy**: room-scale plan with walls, ceiling, doors, traffic, corners, other players, PA | Room-scale arrival-time aid (geometry → ms), with "do not auto-align" beside it |
| M11 | Delegates every source to M01–M03, M09, I01 scenes | Overhead pair (from M09) | Stage box, console labels, audience vs control-room listening point | **Channel-plan builder** + **routing matrix** (PA / monitors / record / broadcast) + channel/stand counter |
| Speaker (conventional) | Fits directly: lateral cone slider, distance, angle, multi-driver choice | Two-mic sum only | Wedge/PA geometry (live) | **Shared speaker scene** entered from 5 lessons, each with its own sourced number; **signal-path tracer** (air vs electrical), already proposed in lab2.md for Rhodes and Wurlitzer |
| Speaker (Leslie) | Fits only with an "outside-only" constraint: the whole enclosure plus louvers become no-entry zones | Upper XY vs spaced sides; lower centred | Mono PA vs stereo; room pair "a couple of metres" | **Rotating-speaker model** (below) |
| I04 | Fits directly: hand-percussion motion envelope + distance comparator; reuse the M08 scene with a head switch | Optional only | Shared percussion area, wedges | Motion-direction toggle (toward/away vs sideways) as a placement variable |

**Rotating-speaker model (new; needed only for the Leslie).**
- Required state: rotor mode (stop / chorale / tremolo / transition); horn angle and drum angle over time; which external opening currently radiates toward each mic.
- Required data that is **not in the lesson**: horn and drum speeds for each mode, ramp-up/ramp-down times, rotation directions, horn and drum geometry, louver positions, crossover.
- These must come from Hammond's primary documents ([1] Traditional Leslie Specifications, [2] 122A/122XB/147A manual) and be cited. Nothing should be guessed.
- House rules apply if it animates:
  - Rack Unit layout for a live display.
  - ≥ 9 pt text.
  - "never stylized audio": any moving-air or level display must stay in time with the drawn rotors.
- The lessons' "no fabricated numeric response curves" constraint still holds. The model shows geometry and timing, not a frequency response.

### (b) New illustration needs (honest difficulty, accurate vector art)

| Object | Difficulty | Why |
|---|---|---|
| Kit inside a room, top + side, room scale (walls, ceiling, door, corners, traffic routes, PA, other players) | medium | Kit art reused from M09; the room is simple, but two scales (kit detail vs room) must coexist legibly on a phone |
| Room-mic stands: floor stand, long boom with counterweight, low front pair at kick height | simple | |
| Channel-plan overlays on the kit (1 / 2 / 3–4 / expanded), incl. second kick, snare bottom, hat, ride, room | medium | Many mic glyphs on one kit; needs the shared mic family from lab1.md |
| Routing matrix (channels × PA / monitors / record / broadcast) | simple | Diagram, not art |
| Speaker behind grille: dust cap, inner cone, boundary, outer cone, surround; see-through grille state | medium | Shared with Guitar, Bass, Harmonica, Rhodes, Wurlitzer |
| Cabinets: 1×12 combo, 2×12, 4×12 (open and closed back), bass cab with mixed drivers + horn | medium | Open-back is needed by Guitar even though this module omits it |
| Leslie 122/147 exterior: upper louvers, lower openings, rear opening, side louvers, power cord, multipin cable | **hard** | Louver count and placement are UNSPECIFIED; it must match one real named model |
| Leslie cutaway: horn rotor, drum rotor, woofer, motors and belts, amp, crossover | **hard** | Internal layout not in the lesson; must be sourced; must be labelled "inside view; never open the cabinet" so it does not contradict the safety rule |
| Organ console + Leslie connection + DI/direct-out path | medium–hard | Model-specific connectors (122 vs 147) |
| Headless tambourine: ring and crescent, single/double row, mounted variant; shake, strike-into-hand and mounted-strike arcs; toward/away vs sideways motion | simple–medium | The hands and arcs are the hard part; the frame is simple |

### (c) Disagreements with the earlier lessons (quoted)

1. **Hearing-safety depth (all four new lessons vs earlier lessons).**
   - Kick M01: "NIOSH recommends an occupational exposure limit of 85 dBA averaged over eight hours; under that recommendation, each 3 dBA increase halves the permitted duration."
   - M10: "Keep headphone and PA listening at safe, comfortable levels." M11: "maintain comfortable monitoring." Speaker: "Keep rehearsal and monitoring levels comfortable." I04: no hearing statement.
   - The amp lessons use a different standard. Guitar Amp: "OSHA's 85 dBA eight-hour time-weighted average is a hearing-conservation action level". The kit lessons use NIOSH (3 dB exchange). OSHA uses a 5 dB exchange, so the two cannot be shown interchangeably.
2. **XY terminology.**
   - Speaker: "Try a near-coincident XY pair outside the upper louvers".
   - M10: "Coincident XY cardioids". M09 Overheads: X/Y "capsules as coincident as possible, not touching" (per lab1.md).
3. **Stale cross-reference.** M10: "M11 will cover complete kit channel plans." M11 now exists and covers them.
4. **Glyn Johns channel count framing.**
   - M09: "Sources variously describe three mics (overhead, side, kick) or four (add snare)".
   - M11 stage table: "Add snare top if it needs independent presence; a fourth channel may be a second overhead or a side mic in a Glyn Johns family setup."
   - Not a contradiction, but M11's staging implies the snare comes before the Glyn Johns side mic. M11 does correctly defer: "The Glyn Johns overhead-and-floor-tom-side method, including its three- and four-mic variants, is taught in M09".
5. **Same DPA kick article, different content extracted.**
   - Kick M01 cites DPA [1] only for: "DPA documents outside pickup for unported drums." (no number).
   - M10 cites the same URL [3] for: "a stereo pair of omnis approximately 1 m in front of the kit, low and in front of the kick".
   - Compatible, but M01 should cross-link to M10 for the 1 m front pair.
6. **Speaker distances (module vs the five source lessons).**
   - Module: "Shure's PGA27 guide gives 1–6 in (2–15 cm) as a model-specific starting range", and it applies this to bass cabinets too ("not a universal frequency response for every bass cabinet").
   - Electric Bass: "Its bass-specific article suggests 10–45 cm (4–18 in) as a distance range often worth trying for more breathing room, whereas a general amplifier guide gives 2–15 cm (1–6 in)".
   - Harmonica: "about 2–5 cm from the grille cloth". Wurlitzer: "roughly 2.5 cm (1 in) away, off center and slightly angled". Guitar: "1–6 inches (2–15 cm)". Rhodes: "about 2–15 cm (1–6 in)".
   - The module, as the hub, misses the bass-specific range. Otherwise all are consistent.
7. **Open-back rear mic.**
   - Guitar Amp: "An open-back cabinet can be sampled from behind ... Shure's cited engineer uses a rear mic and polarity reversal with a front mic".
   - Module: no mention of open-back cabinets or rear pickup.
8. **Source title for Shure's tambourine 6–12 in.**
   - M08 Headed Tambourine [4]: "Shure, *Microphone Techniques for Drums*, tambourine one-mic 6–12-in example".
   - I04: "Shure's recording guide gives one microphone 6–12 in (15–30 cm) ... Its live guide gives the same starting range" ([1] Microphone Techniques for Recording; [2] Live Sound Reinforcement).
   - Possibly all three documents say it; verify before showing a single "Published: Shure" badge with a citation.
9. **DPA Jonas Brothers tour wording.**
   - M08: "A live-tour case used one cardioid as a direct source for shakers/tambourine plus broader percussion overheads."
   - Maracas: "used one 4011A as a direct source for shakers and tambourine".
   - I04: "DPA documents a touring setup with separate direct pickup for shakers and tambourine plus area percussion microphones."
   - I04's "separate" can be read as separate mics for each, which conflicts with "one" shared mic.
10. **Shure generic percussion distance vs tambourine.**
    - Lab 2 hand-percussion lessons anchor on Shure "at least 30 cm".
    - I04 starts at "6–12 in (15–30 cm)" from Shure's tambourine example.
    - Already noted in lab2.md (d)1; I04 reinforces the closer figure.
11. **Leslie and electronic organ scope.**
    - Pipe Organ: "Electronic organs and Leslie speakers are covered in their separate lesson."
    - The module covers the Leslie and a direct output, but not electronic-organ pickup in general.
12. **Agreements worth keeping.** All four agree with the earlier lessons on:
    - polarity is a diagnostic, never a fix for arrival time
    - no deliberate feedback (except I04, which omits the statement)
    - mono check after every addition
    - max SPL is not hearing exposure (implicit)
    - room/overhead-led kits are legitimate
    - no audio examples

### (d) Open questions for the owner

1. **Where does the Speaker/Leslie module live in the app?** The plan and header put it in Lab 1 ("Membranophones Lab support module"), but it serves Lab 2 (Rhodes, Wurlitzer), Lab 3 (Harmonica) and Lab 4 (Guitar, Bass). One shared speaker scene reached from all five lessons, plus a standalone Leslie page?
2. **Rotating-speaker model: build it?** If yes:
   - Which model is drawn (122, 147 or 3300)?
   - Can rotor speeds and geometry be taken from Hammond's own spec page [1]? The lesson has none.
   - Is an inside (cutaway) view acceptable, clearly labelled "never open the cabinet"?
3. **Leslie audio.** The lessons say "No audio examples"; house practice is real-time sound. Text and animation only, or a recorded Leslie from the recordings brief?
4. **Hearing-safety parity.** Add a figure to M10, M11, Speaker and I04? Which standard does the app show: NIOSH 85 dBA with 3 dB exchange (kit lessons) or OSHA 85 dBA action level (amp lessons)? Showing both needs an explanation of why they differ.
5. **M11 channel-plan builder + routing matrix.** Is this in scope for Lab 1 v1? It is the only genuinely new interaction in M11.
6. **M10 room scale.** Which room(s) to draw: a studio live room, a small club, a large stage? The lesson's examples span ≈1 m to ≈15 ft.
7. **I04 reference point.** Measure 15–30 cm from the "normal playing zone" or from the "nearest expected stroke"? The app marker depends on it.
8. **I04 scope.** Do "tambourine jingles" include kit-mounted jingle rings and jingle sticks (not covered), or only hand tambourines?
9. **One tambourine scene?** Merge M08 and I04 into one scene with a head/no-head switch, keeping two lesson pages?
10. **Text fixes before build:**
    - Speaker "near-coincident XY" → "coincident XY"
    - M10 "M11 will cover" → present tense
    - Speaker: add the open-back rear mic, the bass 10–45 cm range and an explicit cross-link list
    - Speaker "Heritage manual" → the actual reference title
    - I04: unify the distance reference; add the hearing, phantom and no-feedback lines
    - I04 DPA wording → "one shared cardioid"
    - M10: remove or teach the "boundary-adjacent trial"
    - M11 "this report" → "this lesson"
11. **Institutional wording.** All four carry "Pro Audio Training Academy", "Student observation sheet", "Student ____", and M10/Speaker say "classroom". App copy must strip these (house rule: no institutional/academic mode). "Classroom proposal" should become something like "Trial position".
12. **Verify before publishing:**
    - UA "Mixing in Stereo" [7] contains the 15 ft corner-pair anecdote
    - Shure SM4 polar pattern
    - Shure tambourine 6–12 in source title(s)
    - DPA tambourine IMD claim
    - Meinl single product page supporting range-wide row/metal variants
    - Hammond manual titles
