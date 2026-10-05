# Lab 6 survey: Foley, Field Recording, and Scientific/Acoustical Recording (F01–F16)

Source folder: `docs/labs/miking/source_text/`. Read in full: the master plan (Lab 6 sections, research framework, scientific teaching requirements, 9-part structure) and all 12 Lab 6 lesson files (F01–F12). Skimmed for context: `ENGINE_BLUEPRINT.md` §0–§4, §6, §12 "How the other lessons plug in", §16, and `survey/lab5.md`.
Citation key: `[n]` is the lesson's own reference number. "no #" means the lesson names a source in prose but gives no bracket number at that point. "L:nn" is the line number in the .txt file.
Survey date 2026-10-04. Read-only: no lesson, engine or calculator file was changed. No web page was opened; every URL and standard number below is checked against the lesson text and my own knowledge only (see §3(f) NOT VERIFIED).

---

## 1. COVERAGE

| ID | Scope (plan) | File |
|---|---|---|
| F01 | Footsteps and surfaces | Foley-Footsteps-and-Surfaces-Miking-Technique.txt (**no `F01-` prefix**, unlike F02–F12) |
| F02 | Clothing and body movement | F02-Clothing-and-Body-Movement-Miking-Technique.txt |
| F03 | Props and object handling | F03-Props-and-Object-Handling-Miking-Technique.txt |
| F04 | Impacts, liquids and textures | F04-Impacts-Liquids-and-Textures-Miking-Technique.txt |
| F05 | Foley perspective and multiple mics | F05-Foley-Perspective-and-Multiple-Microphones-Miking-Technique.txt |
| F06 | Natural and urban ambience | F06-Natural-and-Urban-Ambience-Miking-Technique.txt |
| F07 | Wildlife and distant sources | F07-Wildlife-and-Distant-Sources-Miking-Technique.txt |
| F08 | Moving sources and pass-bys | F08-Moving-Sources-and-Pass-bys-Miking-Technique.txt |
| F09 | Location speech and practical sounds | F09-Location-Speech-and-Practical-Sounds-Miking-Technique.txt |
| F10 | Spatial and specialist field pickup | F10-Spatial-and-Specialist-Field-Pickup-Miking-Technique.txt |
| F11 | Measurement microphones and calibration | F11-Measurement-Microphones-and-Calibration-Miking-Technique.txt |
| F12 | Sound level and environmental noise | F12-Sound-Level-and-Environmental-Noise-Miking-Technique.txt |
| F13 | Room acoustics and reverberation | **MISSING** (expected) |
| F14 | Loudspeaker and sound system measurement | **MISSING** (expected) |
| F15 | Machinery and product sound | **MISSING** (expected) |
| F16 | Scientific arrays and specialized sensors | **MISSING** (expected) |

- **12 of 16 delivered.** F13–F16 have no file. F11 (L:36, L:89) and F12 (L:85) already cross-link to F13–F16 as if they exist.
- **Lab 6 documents not in the plan:** none.
- **Scope gap inside a delivered lesson:** the plan's F10 asks for "optional hydrophone and contact-sensor comparisons with medium, mounting and signal paths identified". **F10 has no hydrophone or contact-sensor content at all** (grep: 0 hits). The only hydrophone material is one paragraph in F04 (L:28) and one exercise step (F04 L:55). Contact sensors get one sentence (F04 L:28).
- **The 9-part structure is followed far better than in Lab 5.** Every lesson has a guided exercise, a pass criterion, **an observation/field/measurement sheet** (Lab 5 had one, E16) and a four-part evidence audit (agreement, differing methods, contradictions, gaps). Gaps are listed per lesson below; the common one is that F06, F07, F08, F09, F10 and F12 have no symptom-to-check troubleshooting table (they have safety sections only).
- **App presentation:** no lesson says how the app should present it (grep for app/interactive/screen/simulation/diagram: only "figure-eight", "on-screen" and "interactive playback" hits). Every "PROPOSED APP PRESENTATION" below is therefore **my proposal**, marked as such.
- **Audio:** every lesson says no audio examples are included (36 statements across 12 files). This matches the plan and the owner's "fully silent" ruling (blueprint header rule 4). Lessons also note that "linked pages may contain media".
- **Lab name is inconsistent in the headers:** F01 "Foley Field and Scientific Lab"; F02–F10 "Foley Field and Acoustical Lab"; F11–F12 "Scientific and Acoustical Lab". Every header starts "Pro Audio Training Academy". No header carries a date; every sources block says "checked October 4, 2026".

---

## 2. PER LESSON

### F01 Footsteps and Surfaces
- **Header:** "Pro Audio Training Academy • Foley Field and Scientific Lab • F01 • Studio and live applications".
- **ANATOMY / SCENES TO DRAW:**
  - Foley pit/stage with a bounded step area; surfaces: dry hard floor/tile, wood or hollow panel, gravel, leaves, concrete, carpet over wood or tile ("layered floors"), soft ground. Underlying base floor with possible cavity/suspended-floor resonance [3].
  - Performer walking a cue: landing area, heel/toe travel, scuffs, pivots, arm and body envelope, exit path.
  - Directional mic on a stand to one side or in front, aimed "across or down toward the contact zone". Optional second "room or wider" mic at an approved location.
  - Live theatre variant: footstep station, PA and monitors, system operator.
  - UNSPECIFIED: stand height, aim angle in degrees, pit dimensions, room size, second-mic position, monitor geometry.
- **MICROPHONES:** Neumann **KMR 81** and RØDE **NTG 2** appear only in ref [5]'s title (Foley First shotgun comparison). Types: short shotgun, cardioid, supercardioid "without an interference tube", large-diaphragm condenser (NoiseFloor [2]). Shotgun off-axis coloration and frequency-dependent directivity [6].
- **POSITIONS (reference: "capsule to the central active footfall area", L:12):**
  - "Classroom trial: ... roughly 0.8–1.0 m from the center of a bounded step area" (self-declared trial, "not a published rule").
  - Foley First "two shotguns from about 1.5–2 m" on concrete, hardwood, leaves and gravel [5].
  - Foley First "a 3.5 m position worked in context after a 1.5 m position did not" (one gravel fight scene) [7].
  - Hensley: "tight footstep pickup to avoid pants noise, then backing off" (no number) [4].
- **SAFETY / ETHICS:** Walk the cue silently first; mark foot/arm/body envelope including pivots and missed steps. Secure the surface against sliding or tipping. Stands, housings and cables out of landing and exit paths. Stop action before moving hardware. Check wet or loose surfaces for slipping; no risky jumps. Comfortable monitoring; "Manage reproduced sound level for both performers and students". Mute before changing connections or phantom. Never provoke feedback.
- **MEASUREMENT RIGOR:** Not a measurement lesson. "Change one variable at a time"; log capsule direction, pit area faced, stand position, distance; compare at similar listening levels ("Do not interpret louder playback alone as better tone").
- **MULTI-MIC:** Close + farther channel: different arrival and off-axis response. Primary alone, then add secondary; mono and intended width over heel, toe and scuff events. Polarity is a diagnostic, "not a general cure for time differences" [8]. Keep separate tracks.
- **PROPOSED APP PRESENTATION (mine):** Side + top view of a pit with a surface variant picker (tile, wood panel, gravel, carpet-over-wood) and a hatched motion envelope; the mic is blocked from entering it (existing SDF envelopes). Three documented zones: TRIAL 0.8–1.0 m, SOURCED 1.5–2 m [5], SOURCED 3.5 m scene example [7]. Two-mic page reuses `twoMic` with a "close + room" framing.
- **AUDIO:** "No audio examples are included." / "No audio examples are provided." / "Text and exercises contain no audio examples."
- **QUALITY FLAGS:**
  - Institutional words: "Academy", "Classroom trial", "Students", "student observation sheet", "Pass criterion: the student".
  - The plan asks to "control floor and stand vibration"; F01 covers floor/pit resonance [3] but never mentions a shock mount or stand isolation (F02 and F03 do, via Rycote).
  - Ref [4] Shure link is the **nl-NL** locale page; ref [9] Shure live guide is a PDF on content-files.shure.com.
  - Cross-links name ".docx" files (Djembe, Percussion Ensembles) and say "B04 Boom Pickup [is a] later lesson".
  - File name lacks the `F01-` prefix.

### F02 Clothing and Body Movement
- **Header:** "Pro Audio Training Academy • Foley Field and Acoustical Lab F02 • Performed and live applications".
- **ANATOMY / SCENES TO DRAW:** Foley artist holding or wearing a garment: sleeve against torso, leather flex, coat flap, bedclothes, small hand gesture, whole jacket. Stand mic or operated boom "over or to the side of the action". Shock mount, cable strain relief. Second "room" mic farther back for interiors. Live theatre performance station with PA/monitors. On-set dialogue lavalier under fabric (the unwanted-rustle contrast). UNSPECIFIED: every height, angle and the close distance.
- **MICROPHONES:** **Schoeps CCM 41** (supercardioid, ref [4] title). Types: shotgun (Foley First's choice [1]), cardioid or supercardioid condenser, low self-noise mic. Interference-tube coloration indoors [3].
- **POSITIONS:**
  - Foley First "1–1.5 m from the cloth action" as its preferred working distance [1] (repeated L:16, L:25, L:53); "sometimes farther for a rain cover".
  - Close detail: "no universal close distance is established here" (record your own).
  - Hecker: farther for long shots, closer for close-ups, plus an optional room mic for interiors [2].
- **SAFETY / ETHICS:** Garment must not brush mic/mount/cable. "Never drape cloth over a hot light, electrical fixture or microphone connector; do not fasten material to a person without their agreement." Qualified personnel for any overhead rigging. Do not provoke feedback. Coordinate with costume and dialogue teams.
- **MEASUREMENT RIGOR:** Record a quiet room baseline before the cue (L:51). Change one variable at a time: source area, aim, distance, then mic type.
- **MULTI-MIC:** Close + room for interiors (Hecker); arrival differences in mono; "movement makes any one time alignment only locally correct". Separate performances/layers are not simultaneous multi-mic capture.
- **PROPOSED APP PRESENTATION (mine):** A gesture-arc envelope (swept arm) around a standing performer; mic zone SOURCED 1–1.5 m [1]; a "two problems" contrast card (Foley cloth pass vs dialogue lav rustle).
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this document has no audio examples."
- **QUALITY FLAGS:** Institutional words ("Students", "classroom applications", "Student observation sheet"). The troubleshooting table has 5 rows with sources on 3. Strong lesson otherwise; the only number is the practitioner 1–1.5 m.

### F03 Props and Object Handling
- **Header:** "... Foley Field and Acoustical Lab F03 • Studio and live applications".
- **ANATOMY / SCENES TO DRAW:** Key ring (jingle, insertion, turn), paper (lift, bend, fold, set-down), door/drawer/latch (handle, latch, hinge, panel, frame, swing and pinch zones), furniture (scrape, wheel, set-down on floor/table). Stand mic outside travel. Live opera Foley booth with prop station (ENO [8]). Location boom outside frame. Up to three Foley "stations" (Mix 1997 [6]).
- **MICROPHONES:** No models. Types: quiet condenser, dynamic (for loud props/spill), short shotgun vs "conventional directional mic", cardioid/supercardioid vs omni [4, 7].
- **POSITIONS:** **None numeric.** The four object rows are "reasoned classroom trials" (aim/compare only). Malcolm and White "deliberately avoid placing mics too close" (no number) [1].
- **SAFETY / ETHICS:** Hands clear of hinges and pinch points; mics, cables and operators outside door/furniture travel; assistant for heavy furniture; "no real sharp weapons, broken glass, unstable stacks or live electrical devices"; do not block exits; no mic fastened to a moving door without an approved plan; "never demonstrate feedback deliberately".
- **MEASUREMENT RIGOR:** "Log actual object dimensions, mic model, pattern, position, level and room." Gain from both the quietest meaningful handling and the loudest slam; locate overload at capsule, preamp or recorder.
- **MULTI-MIC:** Close detail + farther object/room channel, recorded separately, mono-summed over the whole motion; a moving prop changes arrival differences across the cue.
- **PROPOSED APP PRESENTATION (mine):** Top view of a door with a swept swing envelope and pinch zones (the existing `sweep` envelope fits); three aim targets (latch, panel, whole action) as radiating regions with no distance zones (no source numbers).
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this lesson has no audio examples."
- **QUALITY FLAGS:**
  - **Ref [9] "Shure Miking the Rhythm Section" (es-LATAM) is cited for live theatre Foley (L:33)**; it is a band-miking article, so it is weak or irrelevant support.
  - Ref [1] is an Oxford Learning Link "haines-student-resources" page; it may be access-restricted and is a textbook companion, not a primary source.
  - Ref [6] is a 1997 Mix article (old, but cited as historical practice).
  - No numbers at all; institutional words ("classroom trials", "Student").

### F04 Impacts, Liquids and Textures
- **Header:** "... Foley Field and Acoustical Lab F04 • Studio and live applications".
- **ANATOMY / SCENES TO DRAW:** Padded block impact on a surface; small shallow basin/tray of water on a stable surface with a non-slip mat and towel; marked "splash envelope/footprint"; dry brush on coarse fabric; airborne mic "off to the side of the basin"; electronics and connectors away from the wet area. Hydrophone (immersion-rated) vs airborne mic above water; contact transducer on a dry container. Zeppelin windshield struck by splash (the "thunk" anecdote [1]). Rycote rain jacket (between takes only) [5].
- **MICROPHONES:** **Shure SM4** (guide: keep dry; ingress "can cause fire or electric shock") [6]. Types: small- or large-diaphragm condenser, dynamic, directional boom mic, hydrophone, contact transducer.
- **POSITIONS:** **None numeric.** "The positions are explicit experiments"; "no universal ... splash radius".
- **SAFETY / ETHICS (the lab's main water/electrical lesson):** Mark splash with the mic absent; stand outside it. Power supplies, recorder, cables and connectors away from water; dry hands before controls. "Do not treat a foam windscreen or basket as waterproof." Rain jacket is not for use while recording [5]. Stop and follow maker guidance if gear gets wet. "Do not energize wet equipment, improvise electrical waterproofing". No heavy drops, explosives, glass, blades, hot liquid, fine powder or chemicals; never strike a person. Hydrophone only if rated for immersion, "never an ordinary microphone lowered into a basin". On location: never enter a road, unstable bank or active machinery area.
- **MEASUREMENT RIGOR:** "Compare tracks with their sensing medium named" (air / water / structure). Headroom from the loudest planned hit at each stage (mic, preamp, recorder).
- **MULTI-MIC:** Second mic gets a different task (entry vs body/room/drip tail); mono check; water flow makes one alignment imperfect; Elemental mixer chose among mics rather than summing all [7].
- **PROPOSED APP PRESENTATION (mine):** Top view of basin with a hatched ILLUSTRATIVE splash envelope (no source radius) that blocks the mic; a three-path "sensing medium" card (air / water / structure-borne).
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this document has no audio examples."
- **QUALITY FLAGS:**
  - This is where the plan's F10 hydrophone/contact material actually lives, in one paragraph. If F10 is not revised, the app's only hydrophone/contact content is here.
  - "Students", "classroom sources", "classroom materials", "Student observation sheet".
  - Good, specific, well-sourced safety; no numeric positions.

### F05 Foley Perspective and Multiple Microphones
- **Header:** "... Foley Field and Acoustical Lab F05 • Studio and live applications".
- **ANATOMY / SCENES TO DRAW:** Four arrangements: one mono mic; close + room (two distances); coincident XY ("close together without touching"); ORTF or another spaced pair. Mid-Side (forward Mid + side figure-eight). Moving action across a small stage (steps, key ring carried across a marked zone, object sliding). Live: one source-proximate directional mic at a station, PA/monitors.
  - **UNSPECIFIED: XY included angle; ORTF spacing and angle** (F05 says only "ORTF is a near-coincident pair of cardioids with specified spacing and angle" [5] without giving them); AB spacing; heights.
- **MICROPHONES:** No models. Types: directional capsules (XY), cardioids (ORTF), figure-eight (Side), compatible matched pair.
- **POSITIONS:** Mix 2005: one team "often working three to six feet from footsteps in its room" [4] (an example, "not an F05 prescription"). Nothing else numeric.
- **SAFETY / ETHICS:** Floor-level stands unless qualified personnel approve overhead rigging; capsules/booms/cables out of swing, walking, water and debris paths; mute during setup changes; never move a stand into an active cue without rehearsal; no deliberate feedback.
- **MEASUREMENT RIGOR:** Log distance from the active part of the source, angle and room; compare repeated actions.
- **MULTI-MIC (the lab's core multi-mic lesson):**
  - Near/far is not left/right: "Do not hard-pan close and room merely because there are two tracks".
  - M/S: "DPA describes left as Mid plus Side and right as Mid minus Side; summing decoded stereo to mono cancels the Side" [5]. **Correct** (L+R = 2M).
  - Comb filtering from arrival differences changes as the source moves [6]; polarity is a diagnostic only; a fixed delay aligns "one moment or one part of the source" [6, 7].
  - Open mics in live: more room/noise, lower gain before feedback, comb risk [8].
- **PROPOSED APP PRESENTATION (mine):** The stereo-array tool (blueprint §12) with a moving point source dragged along a marked path: XY level-difference image, ORTF time+level image, mono-sum comb readout from `twoMic`. A "near/far vs left/right" sorting scenario.
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this lesson has no audio examples."
- **QUALITY FLAGS:**
  - **ORTF named without its 17 cm / 110° geometry** (only F06 states it); XY angle never given anywhere in Lab 6.
  - "This lesson labels stereo and close-plus-room comparisons as classroom trials" (institutional wording).
  - Ref [6] is a long Shure "damfiles" PDF URL with a hash suffix (fragile link).

### F06 Natural and Urban Ambience
- **Header:** "... Foley Field and Acoustical Lab F06 • Field and live applications".
- **ANATOMY / SCENES TO DRAW:**
  - Natural site: birds, insects, water, foliage, weather, distant human activity, moving water near the array; permitted listening point; second vantage point.
  - Urban site: plaza/streetscape, sidewalk perspective, focused pass-by; vehicle lanes, walking paths, access routes kept clear; nearby wall/reflector; sirens, aircraft, voices.
  - Arrays: mono (directional or omni), XY, ORTF, spaced omni AB, M/S, binaural/immersive. Wind protection layers: foam, fur, basket/blimp, suspension. Recorder and cabling shielded.
  - Thunderstorm capture from "a substantial safe shelter" or a remote plan.
  - **Stated geometry: ORTF "17 cm and 110 degree included-angle geometry" [3, 4]**, and "the angle is the included angle between axes, not 110 degrees to each side".
  - UNSPECIFIED: XY angle, AB spacing ("deliberate, documented spacing"), mic height, distance to sources.
- **MICROPHONES:** **Shure SM63** (outdoor guidance, ref [13]). RØDE Stereo Bar (ref [4], ORTF angle source). Types: omni, cardioid, figure-eight, directional, binaural.
- **POSITIONS:** No source-to-mic distances. "'Several minutes' is a teaching starting point, not a standard duration". "Avoid a fixed 'correct' dBFS or LUFS target for every ambience" [11].
- **SAFETY / ETHICS:**
  - Permissions and privacy for identifiable conversation; local rules vary.
  - Wildlife: "Do not approach or lure animals"; follow local distances [7]; no unmanned stand where it disturbs animals or visitors.
  - Traffic: stands off vehicle lanes and walking paths.
  - Weather: "A windscreen is not waterproofing" [13]; NWS: go indoors when thunder is heard, "wait at least 30 minutes after the last thunder" [14] (correct NWS guidance). Flooding, banks, ledges, surf.
  - Hearing: hearing protection for prolonged loud urban exposure under occupational guidance [15].
- **MEASUREMENT RIGOR:** Clear line between a creative bed and calibrated monitoring: "an arbitrary mic, windshield, filter or recording level does not produce calibrated sound-pressure data"; NPS excludes high-wind intervals and pairs sound with weather data [2, 10]. Full log list (L:40): date, local time and time zone, site, weather/wind, model/pattern, array geometry and orientation, height, wind protection, recorder settings, filters, channel map, take length, events, use restrictions. "Label each take with its actual place and time"; no constructed loop presented as a site record.
- **MULTI-MIC:** Array mono behaviour: XY and decoded M/S keep useful centre; ORTF and AB need low-end/transient audition; "Never assume that simply summing two spaced microphones recreates one omnidirectional mic." Live: mute unused ambience channels, no room mic into nearby reinforcement.
- **PROPOSED APP PRESENTATION (mine):** A plan-view site map (metres) with source icons at bearings, the array at a listening point, and its acceptance angle drawn; picking XY / ORTF / AB / M/S changes the drawn pickup and a mono-compatibility badge. A wind card (foam / fur / basket) with qualitative effect only.
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this lesson contains no audio examples."
- **QUALITY FLAGS:**
  - The plan's own wording ("Compare mono, XY, ORTF, spaced-pair and M/S") is met, but only ORTF has numbers.
  - Section 7 "Troubleshooting" of the 9-part structure has no symptom table (wind and level prose instead).
  - "Student field sheet", "the student explains".
  - Ref [15] uses `cdc.gov/niosh/...` without `www` (F08 uses `www.cdc.gov`); both likely resolve.

### F07 Wildlife and Distant Sources
- **Header:** "... Foley Field and Acoustical Lab F07 • Field and live applications".
- **ANATOMY / SCENES TO DRAW:**
  - Single bird in a canopy; flock across a wide field; low-pitched distant animal; observer at a permitted observation point; nests and sensitive habitat (avoid).
  - Shotgun in windscreen and suspension; **parabolic reflector with the capsule at the focal point**, oriented per maker (Innercore: "capsule aimed back toward its dish at a marked focus" [7]); stereo-parabolic product (Telinga Stereo MK3 [8]); fixed autonomous recorder.
  - Headphones, recorder, cable management. Dish "may rustle or catch gusts".
  - **UNSPECIFIED: dish diameter, focal length, capsule-to-dish geometry, any dish gain figure, any frequency cutoff, any distance to the target, any wildlife setback.**
- **MICROPHONES:** **SCHOEPS Parabolic Dish Set** ("matched dish system ... most directional at medium and high frequencies and requiring correction for tonal balance"; omni capsule) [2]. **Innercore** parabolic [7]. **Telinga Stereo MK3** [8]. Types: shotgun (interference tube), parabolic + capsule, cardioid, omni, autonomous recorder.
- **POSITIONS:** None numeric. "Avoid a universal cutoff or 'range' claim" (L:24).
- **SAFETY / ETHICS:** Respect site-specific distances; no call playback, lures or attractants; do not approach nests; back away if an animal responds [3]. Keep tripods/dishes out of roads and trails; "do not turn a dish into a visual barrier while stepping backward". No climbing unstable ground or entering water. NWS lightning: shelter in "a substantial building or hard-topped vehicle" [10]. Unattended setups only where authorized. Species identification "confirmed, provisional or unknown".
- **MEASUREMENT RIGOR:** For ecological monitoring, standardize model, sensitivity or calibration "as required by the protocol", gain/filter, orientation, location, dates, duty cycle, weather and effort [5, 6]. "A single clear call proves an event was captured; it does not by itself establish abundance, absence elsewhere or exact distance." "Do not infer a universal dB advantage from two uncontrolled takes."
- **MULTI-MIC:** Separate wide habitat bed; stereo-parabolic focused + ambience components are distinct paths needing format and mono documentation [8].
- **PROPOSED APP PRESENTATION (mine):** Top view of an observer, a dish and a moving source; aim the dish with a finger; an on-axis "concentration vs frequency" graph and a beam that narrows with frequency. **Only drawable as ILLUSTRATIVE** unless a sourced dish model is added (see §3(a)).
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this lesson contains no audio examples."
- **QUALITY FLAGS:**
  - **The plan's "Contradictions requiring scrutiny" asks lessons to "Teach that dependence" (dish gain vs wavelength and diameter) and names Klover [7] and Wildtronics [8]. F07 cites neither and never states the relation** (it says only that the dish "emphasizes shorter wavelengths" and that "dish diameter ... all matter"). The physics it does state is correct: low frequencies still reach the capsule directly but get little dish gain; the gain is acoustic concentration, not electrical gain.
  - No troubleshooting table.
  - "Students", "Student field sheet", "the learner".

### F08 Moving Sources and Pass-bys
- **Header:** "... Foley Field and Acoustical Lab F08 • Field and live applications".
- **ANATOMY / SCENES TO DRAW:** A path drawing: approach, closest point, departure; safe permitted mic zone; operator position; listener/camera direction. Walking consenting performer on a traffic-free route (the exercise). Vehicle session on paper only: permitted closed route, driver, safety lead, crew setback, onboard rig vs exterior pass-by. Arrangements: fixed mono, fixed XY or M/S, ORTF or spaced pair, tracked directional mono swivelled from a fixed crew position. UNSPECIFIED: setback, mic angle, array orientation in degrees, speeds.
- **MICROPHONES:** **Sennheiser MKH 416** (interference-tube shotgun, ref [5]). Types: omni, directional, XY, M/S, ORTF, spaced pair, stereo shotgun (Sound Devices accounts [1, 2]).
- **POSITIONS:** None numeric. "The sources provide no universal setback, mic angle, headroom figure, vehicle speed or safe mounting recipe."
- **SAFETY / ETHICS:** Never on an active roadway; "Do not ... encourage a driver to change speed for a microphone". All people and equipment outside the vehicle envelope and the subject's possible deviation/stopping area. "A course exercise cannot create its own traffic control by putting out a stand or cone" (OSHA work zones [3]). No boom over a public street, railway, track or moving vehicle without permissions. Hearing protection that keeps situational awareness [9]. Lightning [10]. "Never have a performer or driver watch or follow the microphone instead of the route." The student exercise does not perform a vehicle pass.
- **MEASUREMENT RIGOR:** Doppler: "approach is higher and recession lower for a stable emitted tone ... It is not created by panning a track. Walking speed may produce little audible shift ... Do not claim a measured Doppler value from an uncontrolled pass" [6] (**correct**; at 1.4 m/s the shift is about ±0.4 %, roughly ±7 cents). Synchronize independent recorders by clock/timecode and a common event [2]. Log direction, speed category, surface, closest permitted position, orientation, channel map, clipping.
- **MULTI-MIC:** Start- and end-position mics are separate perspectives, not stereo, unless planned as an array; comb filtering if combined; time-aligning every spatial mic into one mono can destroy the passing perspective [2, 4].
- **PROPOSED APP PRESENTATION (mine):** Plan view with a draggable source on a path (finger-scrubbed, not looped: D8), a keep-out envelope around the path, and four live readouts: distance, ideal inverse-square level change, the mic's pattern gain at the arrival angle, and the ideal Doppler factor for a chosen speed. A stereo image dot for XY/ORTF. Silent.
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this lesson contains no audio examples."
- **QUALITY FLAGS:** "classroom exercise", "course exercise", "Student". No troubleshooting table. The level/pitch/timbre separation (L:26) is the lab's best physics paragraph and matches OpenStax [6].

### F09 Location Speech and Practical Sounds
- **Header:** "... Foley Field and Acoustical Lab F09 • Location and live applications".
- **ANATOMY / SCENES TO DRAW:** Two speaking marks, one head turn, a practical action (keys on a table); camera frame boundary; boom operator with pole "just outside the frame" (shadows, cable, pole motion); handheld interview (reporter alternates); lav "near the upper chest or another tested costume position" with service loop and strain relief; plant mic in a prop or set element (DPA micro-shotgun on a **sun visor** [12]); camera-mounted mic; overhead power lines and lighting as boom hazards. UNSPECIFIED: boom height/angle, lav distance to mouth, handheld distance.
- **MICROPHONES:** **DPA 4097 CORE micro-shotgun** (as plant mic, ref [12] title). Types: shotgun (shorter/broader patterns indoors), handheld omni vs directional, lavalier/body-worn, plant, on-camera.
- **POSITIONS:** None numeric ("The cited accounts do not specify one distance"). RØDE: move a boom near the subject rather than treating a distant shotgun as proximity [3].
- **SAFETY / ETHICS:** Consent before touching a performer or attaching a mic; costume and hygiene practice; no tape on skin unless agreed. "Do not secretly plant a mic or assume permission to capture private speech." Privacy rules vary by jurisdiction; "A microphone concealed from the camera is not automatically authorized to record people." Boom away from power lines (OSHA [10]); no plant mic on a vehicle or working electrical fixture without authorization. Lightning [14].
- **MEASUREMENT RIGOR:** Not a measurement lesson; channel labels, notes on noise, frame and camera angle.
- **MULTI-MIC:** Boom and lav are alternate or blendable perspectives, not stereo; solo then mono-blend; polarity is a diagnostic only [2]; minimize open mics live [13].
- **PROPOSED APP PRESENTATION (mine):** Side view with a camera frustum line the boom must stay above (a new "frame edge" keep-out), a head that turns (the lav moves with the chest, the boom must re-aim), and a plant mic zone on the table. Readouts: mic-to-mouth distance and off-axis angle for each mic as the head turns.
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this lesson contains no audio examples."
- **QUALITY FLAGS:** No numbers at all, including no lav-to-mouth figure and no overhead-line clearance (OSHA publishes one; the lesson avoids it). No troubleshooting table. "Students", "Student observation sheet". Heavy overlap with planned Lab 7 B04/B05 (boom, lavalier).

### F10 Spatial and Specialist Field Pickup
- **Header:** "... Foley Field and Acoustical Lab F10 • Binaural, surround and Ambisonic capture".
- **ANATOMY / SCENES TO DRAW:**
  - Binaural dummy head (KU 100) at listener height, face = intended front; in-ear mics on a person.
  - Channel-based 5.0 array: front L/C/R + surrounds; compact integrated unit (DPA 5100: "five transducers plus a derived LFE output" [3]).
  - Double M/S: forward cardioid, backward cardioid, shared side figure-eight, positive lobe marked.
  - IRT Cross and Hamasaki Square (rear/diffuse add-ons) [1].
  - First-order Ambisonic tetrahedral mic (Sennheiser AMBEO VR) in a suspension, upright/upside-down/endfire, orientation marker, four A-format tracks.
  - **UNSPECIFIED: dummy-head height, every surround/IRT/Hamasaki spacing, Double M/S spacing, ambisonic mounting height.** (No "true north" unless relevant.)
  - **ABSENT: hydrophone and contact sensor** (in the plan's F10 scope).
- **MICROPHONES:** **Neumann KU 100** [2]; **DPA 5100** [3]; **Sennheiser AMBEO VR Mic** [4, 5, 7]. Types: dummy head, ear-position mics, cardioid, figure-eight, omni spaced array, tetrahedral FOA.
- **POSITIONS:** None numeric. "Avoid a fixed spacing formula for every forest, plaza or concert hall."
- **SAFETY / ETHICS:** Informed consent and hygienic fitting for in-ear rigs, keeping awareness of traffic. Permissions where speech is identifiable. No arrays across public routes, no unattended stands in traffic, no approaching wildlife [9], no vehicle/rigging mounts without authorization. Wind loading, ground stability, moisture limits ("humidity or moisture can damage capsules" [5]). Lightning: 30 minutes after the last thunder [10]. Poles away from electrical lines.
- **MEASUREMENT RIGOR:** "Spatial microphones record a perceptual scene; scientific SPL or acoustic analysis requires a separate defined calibration, instrument specification, site protocol and uncertainty statement." Log capsule order, orientation marker, mounting, front reference, channel numbers, converter output convention (FuMa vs ambiX "different channel order and numeric convention" [5, 7]: **correct**).
- **MULTI-MIC:** A-format tracks need identical preamps at matched, linked gain; never sum, pan, denoise or normalize them individually [4, 5]. Combined arrays: test timing, leakage and downmix. ".1" is an LFE delivery channel, not a sixth mic (**correct**).
- **PROPOSED APP PRESENTATION (mine):** Mostly a signal-chain and channel-map drill, not geometry: drag four A-format capsule tracks into the right order, pick FuMa or ambiX, catch a swapped channel or a "full-range channel sent to LFE" error. A top-view orientation dial for the dummy head and the FOA front marker.
- **AUDIO:** "No audio examples are included." (preamble wording "without audio examples") / "No audio examples." / "this lesson contains no audio examples."
- **QUALITY FLAGS:**
  - **Missing the plan's hydrophone and contact-sensor comparisons entirely.**
  - No numbers; no troubleshooting table; no explicit polarity/timing check for the spaced 5.0 array beyond "summed arrivals can color".
  - Ref [8] is the Rycote homepage (generic, not a guidance page).
  - Heavily brand-specific (KU 100, 5100, AMBEO): the app must decide whether to name them.

### F11 Measurement Microphones and Calibration
- **Header:** "Pro Audio Training Academy • Scientific and Acoustical Lab F11 • Microphone choice and system checks".
- **ANATOMY / SCENES TO DRAW:** Measurement capsule + preamplifier + cable + power/conditioning (external polarization supply vs CCP/IEPE input vs 48 V phantom: "not automatically compatible") + analyzer. Protection grid on/off. Acoustic calibrator with coupler, and the 1/4-inch adapter (NTi [9]). Mic on a sturdy stand at a logged position, operator kept away. Three field cases: free field (source at a defined incidence, "often 0° on axis"), pressure field (coupler or flush boundary), diffuse/random incidence. UNSPECIFIED: stand height, distances, incidence angle for random-incidence use.
- **MICROPHONES / INSTRUMENTS:** No models. GRAS (manufacturer guides [3–6]); NTi Class 1 calibrator [9]. Types: free-field, pressure, random-incidence measurement mics; externally polarized vs prepolarized; acoustic calibrator; sound level meter.
- **POSITIONS:** Calibrator outputs "94 dB at 1 kHz, 114 dB at 1 kHz or another specified combination" [9] (correct typical values; dB SPL re 20 µPa implied). No mic positions.
- **SAFETY / ETHICS:** "A 94 or 114 dB calibration coupler emits a high level inside its chamber; never place it at a person's ear". No loud demonstrations "merely to prove a meter works". Qualified personnel for energized equipment and overhead mounts. De-energize or follow the maker's procedure before swapping specialised preamps; "do not experiment with pinouts or apply power to an unverified sensor".
- **MEASUREMENT RIGOR (standards check):**
  - **IEC 61672-1** "specifies performance of complete sound level meters, not a blanket approval for any microphone plugged into an interface" [2]: **correctly characterised.**
  - **IEC 60942:2017** "specifies sound calibrator classes" [7]: **correct** (classes LS, 1 and 2).
  - **IEC 61672-3** "describes periodic laboratory tests for qualifying sound level meters" [8]: **correct** (periodic tests).
  - **OSHA**: pre- and post-use calibration for its compliance measurements [10, 11]; the lesson correctly limits this to OSHA's workflow (L:75).
  - **NIST** free-field vs pressure vs diffuse sensitivities differ "particularly at high frequencies" [1]: correct.
  - "A single-frequency field check does not establish full system frequency response" (plan wording) is taught explicitly (L:3, L:33, L:47).
  - dBFS vs SPL, linear waveform vs A-weighted average vs peak are distinguished. Uncertainty: "laboratory certificate supplies ... uncertainty"; sheet line "Uncertainty or drift action".
  - Pre/post procedure: record the unadjusted post-run value; never "force the display back"; follow the method's invalidation rule.
  - **Not cited (gaps, not errors):** IEC 61094 (measurement microphone standards), the meter class (Class 1/2) a method may require, the calibrator class to pair with a Class 1 meter, ANSI S1.4 / S1.40 (US counterparts). ISO 3382 belongs to the missing F13.
- **MULTI-MIC:** Each channel has its own sensitivity and correction data; "Do not assume matched response because the capsules share a model name"; absolute multi-point work needs each channel's traceable chain.
- **PROPOSED APP PRESENTATION (mine):** A chain builder (capsule → preamp → power → input) that refuses incompatible joins with the reason; a field-type picker that rotates the capsule to the correct incidence; a calibrator check that logs pre value, post value and drift, and forces a "relative / uncalibrated" label when any link is missing. Reuse the Mic Sensitivity Converter (micsRf.ts:151, "94 dB SPL ≈ 1 Pa").
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this lesson contains no audio examples."
- **QUALITY FLAGS:**
  - **"With compatible equipment and instructor supervision" (L:45)**: the only "instructor" in Lab 6. Also "classroom", "course", "Students".
  - Cross-links to F13–F16, which do not exist.
  - IEC webstore URLs (publication ids 5708, 5710, 30045) were not opened; titles match the standards.

### F12 Sound Level and Environmental Noise
- **Header:** "Pro Audio Training Academy • Scientific and Acoustical Lab F12 • Representative positions and time".
- **ANATOMY / SCENES TO DRAW:** Site sketch with coordinates: source paths, receiver areas, elevations, ground, buildings, walls, vegetation, reflective facades, PA loudspeakers, prevailing wind, safe access. SLM or measurement mic on a tripod with windscreen, operator and tripod kept clear; facade position vs open position [5, 6]; two receivers A and B and an A-repeat (the exercise). Live: audience positions, rigging, sightlines.
  - **Stated height: FHWA "1.5 m height for a defined procedure unless its plan states otherwise" [5]** (correctly flagged as method-specific).
  - UNSPECIFIED: orientation angle (only "specified orientation"), distance from facades, distance to sources.
- **INSTRUMENTS:** No models. Complete sound level meter or response-appropriate measurement mic; windscreen; calibrator; multiple synchronized meters.
- **POSITIONS / NUMBERS:** 1.5 m (FHWA) [5]; NPS excludes wind "over 5 m/s in its own park monitoring protocol" [7]; NWS 30 minutes [8]. Descriptor table: LAeq,T; LAFmax/LASmax; L10/L50/L90; LCpeak.
- **SAFETY / ETHICS:** Authorized positions away from roads, tracks, water edges, moving equipment and electrical hazards; remote placement if a receiver is unsafe. "Do not increase sound level to make a meter 'respond'". Hearing protection for staff. "never feed a measurement microphone to the PA merely to see its reading". Lightning [8]. Qualified practitioner for formal exposure, compliance or health decisions.
- **MEASUREMENT RIGOR (standards and physics check):**
  - **ISO 1996-2** "determination of sound pressure levels for environmental assessment and spatial scenario comparisons" [1]: **matches the standard's scope.** **ISO 1996-1** "basic community-noise quantities and assessment procedures" [2]: **matches its title.** The lesson correctly says the public abstract is not the full method (L:74).
  - LAeq,T as energy average, "not the arithmetic average of dB readouts": **correct.** LAFmax/LASmax: **correct.** Ln as "exceeded for n % of the period": **correct.** "never relabel a fast maximum as a true peak": **correct.** dBFS ≠ SPL: correct.
  - Background: "ordinary dB subtraction is invalid"; FHWA energy subtraction only when source and background are sufficiently separated [6]: **correct in principle** (the FHWA thresholds are not quoted).
  - OSHA area sampling vs personal dosimetry [3]: correct.
  - **Gaps:** no meter class requirement (FHWA and most methods require Class/Type 1 or 2); no explicit mic orientation rule (free-field mic pointed at the source vs random-incidence mic at grazing incidence: F11 teaches the concept but F12 does not apply it); no uncertainty method (ISO 1996-2 has one); LCpeak row has no reference number; ANSI S12.9 / S1.4 not named.
- **MULTI-MIC:** Multiple meters: synchronize time; record each channel's calibration and position.
- **PROPOSED APP PRESENTATION (mine):** A plan-view site with two receivers; the learner sets height, orientation and window; a **synthetic, ILLUSTRATIVE** level time history (labelled not data) from which LAeq,T, LAFmax, L10/L50/L90 are computed; a background-subtraction step that refuses when the levels are too close. Reuse the `leq` and `combine` calculators (splSafety.ts:753, :322); a new subtraction workspace would be needed (none exists).
- **AUDIO:** "No audio examples are included." / "No audio examples." / "this lesson contains no audio examples."
- **QUALITY FLAGS:**
  - **Refs [4] and [6] are the same URL** (FHWA handbook) under two titles.
  - "Those standards do not tell a classroom exercise which local limit applies" (institutional wording); "Students".
  - No troubleshooting table.

---

## 3. CROSS-LESSON

### (a) New engine capabilities Lab 6 needs (beyond ENGINE_BLUEPRINT §0–§6)
The blueprint already plans Labs 6–7 as "Metres-scale `views`; a parabolic dish as a `MicType` whose pattern is `unstated` until sourced" (§12). The lessons show that much more is needed. In rough order of how many lessons depend on it:

1. **A scene frame, not an instrument frame (all 12).** Blueprint §4.1 puts the origin at the batter head with mm units. Lab 6 needs a site/stage origin, a ground plane with "height above ground", a scene-front (or north) bearing, and views spanning about 0.3 m (a prop) to about 100 m (a site plan). Dual units and D10 rounding still apply, but rounding must scale (≈5 mm is meaningless at 50 m). Plan-only scenes (sites, pass-by routes) need `views` without `side` (already allowed for E06).
2. **Stereo and spatial array tool (F05, F06, F08, F10; also Lab 5).** Already planned (§12). Lab 6 adds M/S matrix with a width control (L = M+S, R = M−S, F05), the **binaural head** (two ear points, face direction), **Double M/S**, a **5.0 front/rear layout**, **IRT Cross / Hamasaki Square**, and a **tetrahedral FOA** with an orientation marker. Only ORTF has a Lab 6 number (17 cm / 110°, F06). XY angle, AB spacing and every surround spacing are UNSPECIFIED here, so they need Lab 5's SCHOEPS rows or new sources.
3. **Moving sources on a path (F01, F02, F05, F07, F08).** A source position parameterised along a drawn path, scrubbed by the finger (D8 forbids loops; the lab is silent). Derived readouts: distance, ideal inverse-square level change (`levelDiffDb`), pattern gain at the arrival angle (`polar.ts`), XY/ORTF image position, the mono comb as the source moves (`twoMic`), and the **ideal Doppler factor** f′ = f·c/(c − v·cos θ) for a stated speed (OpenStax [F08-6]). There is no Doppler calculator workspace today.
4. **Moving and ground-plane keep-out envelopes (F01–F04, F08, F09).** Performer motion envelope (footfall area, arm arc), door swing and pinch zone, splash footprint, vehicle envelope plus deviation/stopping area, camera frame edge, wildlife setback. The `sweep` and `box` shapes cover some; large polygon zones on the ground plane are new. **No lesson gives a single clearance number**, so every envelope is ILLUSTRATIVE (same rule as §16.4).
5. **Frequency-dependent directivity (F01–F03, F07, F08, F09).** The blueprint has only ideal first-order patterns (§6.1), which are frequency-independent. Every shotgun claim in Lab 6 ("frequency-dependent rejection", "off-axis coloration") and every dish claim needs a per-band pattern. Honest options: (i) source real maker polar plots per model (MKH 416, CCM 41, a DPA shotgun) as data, or (ii) draw an ILLUSTRATIVE banded lobe with that badge. Option (ii) must never be presented as data (charter rule; F07's own "no universal ... claim").
6. **Parabolic dish model (F07; Lab 7 B12).** Inputs: dish diameter D, focal length, capsule at focus, aim error. Output: on-axis concentration vs frequency (little gain where D is small relative to the wavelength, rising above it) and a beam that narrows with frequency. **Lab 6 supplies no formula or number.** The plan names Wildtronics [8] for the gain–wavelength–diameter relation; it must be read and quoted before any curve is drawn. Until then: pattern `unstated`, curve ILLUSTRATIVE.
7. **Mount kinds for location work (F02, F09; Lab 7).** `boom` (pole from an operator, with a frame line it must stay outside), `body` (lav fixed to the chest, so it moves with the torso while the head turns), `plant` (fixed in a prop), `camera` (on the camera, at camera distance). The blueprint has `stand | surface | clip`.
8. **Room contribution for "close + room" (F01–F05).** `twoMic` is free-field (§6.2 says so). Foley perspective is about direct-to-reverberant balance. A DRR or critical-distance readout could reuse the calculator's room workspaces (a `drr` key exists in the calc workspaces), but room volume and RT would be ILLUSTRATIVE inputs.
9. **Sensor-medium and transducer classes (F04, F10 per plan, F11).** `transducer` today is `dynamic | condenser | ribbon`. Lab 6 needs `measurement` (free-field / pressure / random-incidence, with power type: polarization supply, CCP/IEPE, phantom), `hydrophone` (medium: water), `contact` (medium: structure), `binaural-head`, `ambisonic`. A required "medium" label on every comparison (F04 L:28: "Compare tracks with their sensing medium named").
10. **Measurement-chain builder and calibrator check (F11).** Compatibility rules (capsule, preamp, power, input); field-type selection that sets the correct incidence; calibrator pre/post log with drift and an invalidation decision; automatic "RELATIVE · uncalibrated" labelling when any link is unknown. Reuses the Mic Sensitivity Converter (micsRf.ts:151).
11. **Level-descriptor and logging tool (F12, F06, F07).** LAeq,T (calc `leq`, splSafety.ts:753), Lmax F/S, L10/L50/L90 from a time history, incoherent addition (calc `combine`, splSafety.ts:322) and **background energy subtraction with a refusal when the difference is too small** (no workspace exists: a new calculator would land on `audio-tools-engine` under the calculators-are-source-of-truth rule). Any time history shown must be synthetic and badged ILLUSTRATIVE.
12. **Field/position log sheet (all 12).** The blueprint's practice-page sheet (§7 row 7, `createLocalStore`, device-local) generalises, but needs more field kinds: date + time zone, typed coordinates or site description, height, orientation/bearing, weather and wind, permission status, channel map, pre/post check values. **Typed only: no GPS** (see open question 11).
13. **Signal-chain / channel-map drill (F10, F11).** A non-geometric interaction: order A-format tracks, choose FuMa or ambiX, detect a swapped or LFE-misrouted channel; build the measurement chain. This is a new page type (a "routing" rack), not a placement scene.
14. **Safety gates as content (F04, F06–F10, F12).** Lightning (NWS: shelter at first thunder, 30 minutes after the last), traffic keep-out, water/electrical separation, wildlife setback. These are scenarios and badges, not physics; they need no engine change beyond envelopes.

A "scene editor" (learner-built sites) is **not** required by any lesson; fixed authored scenes per lesson, with variants (surface type, wind level, site), fit the existing lessons-as-data model (D1).

### (b) Illustration needs and honest difficulty (house rule: real objects, never primitives)
| Scene / object | Difficulty | Lessons |
|---|---|---|
| Stereo bars: XY, ORTF, AB, M/S (cardioid + figure-eight) | simple | F05, F06, F08 |
| Double M/S, 5.0 layout, IRT Cross, Hamasaki Square (plan view) | simple (dims unsourced) | F10 |
| Polar patterns incl. ILLUSTRATIVE frequency bands | simple–medium | F01–F09 |
| Short shotgun; shotgun in basket + fur + suspension; foam | medium | F01–F09 |
| Measurement capsule + preamp + cable; 1/4-in adapter; acoustic calibrator on capsule | medium | F11, F12 |
| SLM on tripod with windscreen at 1.5 m; facade vs open position | medium | F12 |
| Site plans: park/stream, street/plaza, highway receiver, pass-by route with keep-out | medium (plan view) / hard (perspective) | F06, F07, F08, F12 |
| Foley pit with surface variants (tile, wood panel, gravel, leaves, carpet over wood) | medium | F01 |
| Shoe/sole close-up on a surface | medium | F01 |
| Props: key ring, paper, door with swing arc, drawer, chair; padded block; brush on fabric | medium | F03, F04 |
| Basin with splash footprint; hydrophone in water; contact sensor on a container | medium–hard (water) | F04 (F10 if revised) |
| Parabolic dish with capsule at focus, held by a recordist with headphones | medium | F07 |
| Performer walking a cue; arm/garment gesture; leather jacket | hard (people, cloth) | F01, F02 |
| Boom operator with pole above a camera frame line; lav on chest; handheld interview; plant mic on a sun visor; on-camera mic | hard (people) | F09 |
| Dummy head (generic, not branded KU 100 art); in-ear binaural on a person | medium / hard | F10 |
| Tetrahedral FOA mic with capsule labels and front marker | medium | F10 |
| Wildlife (bird in canopy, flock, distant animal) | hard (and a species-depiction call) | F07 |
| Vehicle pass-by (plan) | medium | F08 |
| Live theatre Foley booth with PA/monitors | medium–hard | F01–F05 |

New art is mostly people and outdoor places. Very little can be reused from Labs 1–4 except mics, stands and the stereo bars. The memory rule "NEVER touch images without explicit permission" applies to any raster image; vector art authored in code is the existing lab practice.

### (c) Disagreements and tensions
**Inside Lab 6:**
1. **ORTF geometry appears once.** F06 gives 17 cm / 110° (included angle). F05 and F08 name ORTF and insist on "specified geometry" without giving it. XY angle and AB spacing are never given.
2. **Lab naming:** three different lab names across the headers (see §1).
3. **Hydrophone/contact:** the plan puts them in F10; only F04 teaches them.
4. **Foley distances are consistent, not contradictory:** F01 trial 0.8–1.0 m; F01 Foley First 1.5–2 m and a 3.5 m scene; F02 Foley First 1–1.5 m; F05 Mix "three to six feet" (≈0.9–1.8 m). Each lesson labels its number's context; the app must keep them as separate SOURCED/TRIAL zones, never average them.

**With Labs 1–5:**
5. **Headroom figure.** Lab 5 E01/E03 give "approximately 10 dBFS of headroom" (Neumann). F06 says "Avoid a fixed 'correct' dBFS or LUFS target for every ambience" and F07 says "No universal gain or dBFS setting". These differ in context (studio vocal vs field), but a shared "headroom" card would have to state both.
6. **Feedback demonstrations.** Every Lab 6 lesson forbids provoking feedback, matching Lab 5 E10–E16 and contradicting E04 Ex. 4 ("first sign of ringing") and E07's "ring out".
7. **3:1 rule.** Lab 6 never uses it (it relies on mono-sum listening instead). This avoids Lab 5's three conflicting definitions; no conflict to resolve.
8. **ORTF agrees** with Lab 5 E11–E13 (SCHOEPS 17 cm / 110°). **M/S agrees** with the Lab 5 survey's L = M+S, R = M−S.
9. **The blueprint's "IDEAL MODEL ... free field" comb label (§6.2)** is consistent with F11's field-type teaching; F11 gives the vocabulary to explain why.
10. **"Measure sound at the children's ear locations" (Lab 5 E06)** has no metric; F11/F12 now supply the vocabulary (descriptor, weighting, interval, calibrated chain). E06 could cross-link F12.

### (d) Top quality flags (whole lab)
1. **F10 omits the hydrophone and contact-sensor comparisons** that the plan assigns to it.
2. **F07 does not teach the dish gain vs wavelength/diameter dependence** the plan demands, and uses neither of the plan's parabolic sources (Klover, Wildtronics). No dish geometry or gain number exists anywhere in Lab 6.
3. **Stereo geometry gaps:** XY angle, AB spacing and all surround/binaural dimensions are UNSPECIFIED; ORTF numbers appear only in F06.
4. **Institutional copy everywhere:** "Pro Audio Training Academy" on every header; "Student" sheets; "classroom trial/exercise" (F01, F03–F05, F08, F11, F12); "instructor supervision" (F11 L:45); "course exercise" (F08, F11). This conflicts with the no-institutional-talk rule.
5. **References:** F12 [4] = [6] (same URL); F03 [9] is a rhythm-section article cited for live Foley; F03 [1] is a textbook student-resource page; F01 [4] nl-NL and F03 [9] es-LATAM locale links; F10 [8] is a homepage; F01 cross-links .docx files; F11/F12 cross-link the undelivered F13–F16.
6. **Standards are cited correctly but incompletely.** IEC 61672-1/-3, IEC 60942:2017 and ISO 1996-1/-2 are described accurately. Missing: meter class requirements, IEC 61094, ANSI counterparts, an uncertainty method, and an explicit SLM orientation rule in F12.
7. **No physics errors found.** Checked: M/S sum, Doppler direction and walking-speed size, LAeq energy averaging, dB subtraction, Ln definition, fast max ≠ peak, field types and incidence, CCP/IEPE ≠ phantom, 94/114 dB at 1 kHz, A-format ≠ B-format, FuMa vs ambiX, 5.0 vs ".1", ORTF included angle, NWS 30-minute rule, FHWA 1.5 m.
8. **Few numbers.** F03, F04, F07, F08, F09 and F10 have no numeric positions; F11 has only calibrator levels. Most pages will be qualitative scenario pages unless sources are added. This is honest (each audit says so) but thin for a placement engine.
9. **9-part gaps:** no symptom→check troubleshooting table in F06, F07, F08, F09, F10, F12.

### (e) Open questions for the owner
1. **F13–F16 are missing.** Build Lab 6 Part 1 (F01–F10) and F11–F12 now, or wait for the whole lab? One hub for Lab 6, or two (Foley/Field and Scientific/Acoustical)?
2. **F10 hydrophone/contact:** request a revision, or accept F04's paragraph as the coverage?
3. **Parabolic dish:** source the plan's Wildtronics page and draw a sourced gain curve, or keep the dish pattern `unstated` with an ILLUSTRATIVE curve?
4. **XY angle and AB spacing:** borrow Lab 5's sourced rows (SCHOEPS) for Lab 6, or leave them as "documented spacing" with no default?
5. **Moving sources in a silent, loop-free lab (D8):** is a finger-scrubbed path with numeric/graph readouts (level, image, Doppler factor) acceptable?
6. **Synthetic level time histories (F12) and frequency-banded shotgun lobes:** allowed if badged ILLUSTRATIVE?
7. **New calculators** (background energy subtraction, Doppler): they would land on `audio-tools-engine` through the calculator source-of-truth process. Approve?
8. **Copy:** rewrite "Academy / student / classroom / instructor / course" at import (as for Lab 5)?
9. **Brand models** (KU 100, AMBEO VR, DPA 5100, MKH 416, CCM 41, KMR 81, NTG 2, SM4, SM63, DPA 4097, SCHOEPS dish, Innercore, Telinga): name them, or keep the app generic with brands only in sources?
10. **People and animals in art:** performers, a boom operator, a person wearing a lav or in-ear mics, birds/animals. Approve depicting them, and in what style?
11. **Field sheets:** keep them device-local and typed only. Coordinates must **not** add a location permission (memory rule: permissions must match the binary; a native permission would also break OTA). Confirm.
12. **Safety items as hard gates or as scenarios?** (lightning, traffic keep-out, wet electrics, wildlife setback, consent for lavs/planted mics).
13. **Lab 7 overlap:** F09 overlaps B04/B05 (boom, lav), F07 overlaps B12 (parabolic). One shared engine module and cross-links, or separate lessons?
14. **Reference fixes** (§3(d) item 5): fix in the source .docx files, or correct at import and log in CORRECTIONS_LOG.md?

### (f) NOT VERIFIED
- No URL was opened. Standard titles and scopes were checked against my knowledge; the webstore/ISO page ids (IEC 5708, 5710, 30045; ISO 59765, 59766) were not opened.
- NPS's 5 m/s wind exclusion and FHWA's 1.5 m height match my knowledge of those protocols but were not re-read at source.
- The DPA 5100 transducer count and the Neumann KU 100 speaker-compatibility claim are as the lessons state; not checked against the maker pages.
