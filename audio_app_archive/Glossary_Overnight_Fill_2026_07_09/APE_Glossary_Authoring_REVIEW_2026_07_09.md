# AP&E Glossary — Overnight Authoring Review (2026_07_09, QA-corrected)

**Scope:** MUSI 190 + AUDI 201 · **164 terms** with incomplete fields · **1,149 fields authored** · **0 flagged.**

Process: approved `APE_Glossary_Authoring_AGENT_PROMPT` — fill EMPTY fields only, existing content never altered; ≥2 authoritative sources per fact (≥3 for safety). Independent QA + safety audit run; 3 defects found and fixed (STI/CIS metric in Mass Notification System; two source citations). `[kept — unchanged]` = pre-existing content shown for context.


## AUDI201 — Amplifiers
*7 terms*

### Class G
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An amplifier that keeps two (or more) battery-like voltage levels on hand and jumps up to the higher one only when the music gets loud, so it wastes less power the rest of the time.
- **purpose_function** *(NEW)*: Uses discrete, stepped supply rails and switches to a higher rail only on signal peaks, cutting the wasted heat of a fixed high-rail Class AB design while keeping its clean linear output. It exists to deliver high peak power efficiently in amplifiers that spend most of their time at low average levels.
- **practical_application** *(NEW)*: A live-sound or install tech encounters Class G in mid-to-high-power touring and installed amps that run cooler and draw less current than comparable Class AB units, meaning smaller heatsinks, less rack heat, and reduced current draw at idle.
- **category** *(NEW)*: Amplifier Design
- **related_terms** *(NEW)*: Class H; Rail Voltage; Quiescent Current; Crossover Distortion; Switch-Mode Power Supply (SMPS)
- **common_mistakes** *(NEW)*: Confusing Class G (discrete, stepped rail switching) with Class H (continuously modulated rail) — they are related but distinct topologies.; Assuming Class G is a switching output stage like Class D; the audio output stage is still linear (Class AB), only the supply rails switch.; Believing rail switching audibly degrades sound; in a competent design the transition is designed to be inaudible.
- **scenario_contexts** *(NEW)*: Specifying a touring power amp where reduced heat and current draw matter for rack cooling and generator load.; Servicing an amplifier and finding two pairs of supply rails feeding one output stage.; Explaining to a student why a modern high-power amp runs cooler than an older fixed-rail Class AB design.
- _sources: ProSoundWeb, 'Riding The (Moving) Rails: Detailing Class-G And Class-H Amplifier Topologies'; Handbook for Sound Engineers (Ballou), power amplifier chapter; Nottingham HiFi, 'Amplifier Classes Explained: A/B, D, H & More'_

### Class H
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Like Class G, but instead of jumping between fixed voltage steps it smoothly slides its supply voltage up and down to stay just above the music, wasting even less energy.
- **purpose_function** *(NEW)*: Continuously modulates (tracks) the supply rail so it sits only a few volts above the instantaneous output signal, minimizing the voltage dropped across the output devices and therefore the heat they dissipate. It exists to maximize efficiency in high-power amplifiers while retaining a linear output stage.
- **practical_application** *(NEW)*: A tech sees Class H in many modern professional power amplifiers where it allows high continuous and peak power with modest heatsinking and lower mains draw, making it common in touring and installed loudspeaker systems.
- **category** *(NEW)*: Amplifier Design
- **related_terms** *(NEW)*: Class G; Rail Voltage; Quiescent Current; Switch-Mode Power Supply (SMPS); Crossover Distortion
- **common_mistakes** *(NEW)*: Using 'Class G' and 'Class H' interchangeably — Class H modulates the rail continuously, Class G switches between discrete rails.; Thinking Class H is a switching (Class D) amplifier; the output stage is still linear and the rail modulation is what changes.; Assuming Class H needs an SMPS; rail tracking can also be done with a multi-tap linear supply.
- **scenario_contexts** *(NEW)*: Choosing between amplifier topologies for a system where efficiency and weight are priorities.; Reading an amplifier spec sheet that lists 'Class H' and understanding why it runs efficiently at high output.; Troubleshooting a modern power amp and recognizing the rail-tracking circuitry around the output stage.
- _sources: ProSoundWeb, 'Riding The (Moving) Rails: Detailing Class-G And Class-H Amplifier Topologies'; Handbook for Sound Engineers (Ballou), power amplifier chapter; SoundBridge, 'Class G/H Amplifier'_

### Crossover Distortion
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A little glitch in the sound that happens right as the signal passes through zero, when one half of the amplifier hands off to the other half and neither is quite doing its job for an instant.
- **purpose_function** *(NEW)*: It is not a feature but an artifact: it identifies the nonlinearity that appears at the zero-crossing when an under-biased push-pull output stage transitions between its positive and negative devices. Understanding it explains why output stages are biased into Class AB rather than pure Class B.
- **practical_application** *(NEW)*: A tech recognizes crossover distortion as a raspy, buzzy quality most audible at low signal levels, and corrects it by setting the output-stage bias (quiescent current) to the manufacturer's specification during service.
- **category** *(NEW)*: Amplifier Design
- **related_terms** *(NEW)*: Quiescent Current; Class G; Class H; Rail Voltage; Toroidal Transformer
- **common_mistakes** *(NEW)*: Assuming distortion always worsens with level — crossover distortion is proportionally worst at LOW output levels because the notch is a fixed fraction of a small signal.; Trying to fix it by adding gain rather than by correctly biasing the output stage.; Confusing crossover distortion (an output-stage zero-crossing artifact) with the audio crossover network that splits frequencies to drivers.
- **scenario_contexts** *(NEW)*: Biasing an amplifier's output stage during a service and confirming the notch has disappeared.; Diagnosing a raspy, harsh quality on quiet passages that gets proportionally cleaner as level rises.; Explaining to a student why pure Class B is rarely used and Class AB adds idle bias.
- _sources: Electronics Tutorials, 'Crossover Distortion in Class-B Push-pull Power Amplifiers'; Aiken Amplification, 'What is Crossover Distortion?'; Handbook for Sound Engineers (Ballou), amplifier distortion section_

### Quiescent Current
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The small trickle of current an amplifier's output transistors draw even when no sound is playing, set so the two halves of the output overlap smoothly instead of glitching.
- **purpose_function** *(NEW)*: Set by the bias circuit, it holds the output devices slightly conducting at idle so the handoff between positive and negative halves is smooth, trading a small amount of standing heat for the elimination of crossover distortion. It exists to make Class AB output stages both linear and reasonably efficient.
- **practical_application** *(NEW)*: A tech measures and adjusts quiescent (bias) current to the manufacturer's spec during amplifier service — too low reintroduces crossover distortion, too high wastes power and overheats the output devices.
- **category** *(NEW)*: Amplifier Design
- **related_terms** *(NEW)*: Crossover Distortion; Rail Voltage; Class G; Class H; Toroidal Transformer
- **common_mistakes** *(NEW)*: Setting bias higher than spec to 'sound better' — this overheats output transistors and shortens their life without audible benefit.; Setting it too low and reintroducing audible crossover distortion at low levels.; Measuring bias on a cold amp; it should be set after the unit has thermally stabilized per the service manual.
- **scenario_contexts** *(NEW)*: Following a service manual to set output-stage bias with the amp warmed up.; Investigating an amp that runs unusually hot at idle and finding bias set too high.; Explaining why an under-biased amp sounds gritty on quiet material.
- _sources: Electronics Tutorials, 'Class AB Amplifier Design and Class AB Biasing'; Aiken Amplification, 'What is Crossover Distortion?'; Handbook for Sound Engineers (Ballou), output-stage biasing section_

### Rail Voltage
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The plus and minus DC supply voltages inside an amplifier that act like the ceiling and floor for how big the output signal can get before it runs out of room and clips.
- **purpose_function** *(NEW)*: The DC supply rails feed the output stage and set the theoretical maximum output voltage swing; higher rails allow greater output power into a given load. They exist because the output devices can only swing the signal up to (in practice, a little short of) the rail voltages.
- **practical_application** *(NEW)*: A tech uses rail voltage to reason about maximum output before clipping: the peak output can approach but never fully reach the rail, so an amp clips when the demanded swing exceeds the available rail minus device losses.
- **category** *(NEW)*: Amplifier Design
- **related_terms** *(NEW)*: Quiescent Current; Class G; Class H; Switch-Mode Power Supply (SMPS); Toroidal Transformer
- **common_mistakes** *(NEW)*: Assuming output can swing all the way to the rail — real output stages lose a few volts (device saturation and I×R drop), so usable swing is always less than the rail.; Thinking a sagging rail under load has no effect; supply sag reduces available power and can cause early clipping on peaks.; Confusing rail voltage (the DC supply level) with output signal voltage (what actually reaches the speaker).
- **scenario_contexts** *(NEW)*: Estimating an amplifier's clipping point from its measured supply rails.; Diagnosing premature clipping traced to rail voltage sagging under heavy load.; Explaining why Class G/H switch or track these rails to save power.
- _sources: Analog Devices / analogictips.com, 'Amplifiers: what do rail-to-rail and single supply mean?'; Apex Analog, AN48 'Increasing Output Swing in Power Operational Amplifiers'; Handbook for Sound Engineers (Ballou), power supply and output-swing section_

### Switch-Mode Power Supply (SMPS)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A power supply that chops the incoming AC at very high speed instead of using a big heavy mains transformer, letting modern amps be light and powerful.
- **purpose_function** *(NEW)*: Switches DC through a small transformer at high frequency (typically tens to ~150 kHz) and regulates the output, delivering high power from a small, light, efficient package. It exists to replace the bulky low-frequency transformer and give modern amplifiers their weight, efficiency, and often better power-factor performance.
- **practical_application** *(NEW)*: A tech benefits from SMPS every time they lift a modern touring amp that weighs a fraction of an older linear-supply unit of equal power, and notes its wider mains-voltage tolerance and lower current draw.
- **category** *(NEW)*: Amplifier Design
- **related_terms** *(NEW)*: Toroidal Transformer; Rail Voltage; Class G; Class H; Quiescent Current
- **common_mistakes** *(NEW)*: Assuming an SMPS is inherently noisy for audio — its high-frequency switching noise is above the audio band and is filtered; good implementation matters more than supply type.; Thinking SMPS and linear supplies are interchangeable to service; SMPS boards store dangerous energy and require the manufacturer's service procedure.; Believing a heavier (toroidal/linear) amp is automatically 'better' — implementation quality determines performance, not supply topology alone.
- **scenario_contexts** *(NEW)*: Choosing lightweight touring amplifiers where rack weight and truck load matter.; Explaining why two amps of equal rated power differ greatly in weight.; Understanding why a modern amp tolerates a wide range of mains voltages worldwide.
- _sources: Handbook for Sound Engineers (Ballou), power supply chapter; QSC / Crown power amplifier technical documentation on switch-mode supplies; diyAudio and industry technical discussion, 'linear vs switching power supply for amplifiers'_

### Toroidal Transformer
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A donut-shaped mains transformer whose round core keeps its magnetic field contained, so it hums less and leaks less interference into the delicate audio circuits nearby.
- **purpose_function** *(NEW)*: Its continuous ring core confines the magnetic field in a closed loop with very low leakage, producing a much smaller stray field and less mechanical hum than an EI (laminated) transformer of similar rating. It exists to keep mains-frequency magnetic fields from inducing hum into sensitive low-level audio stages while offering high efficiency in a compact, light package.
- **practical_application** *(NEW)*: A tech finds toroidals in quality amplifiers and prefers them where a quiet noise floor matters, orienting and positioning them away from input circuitry to minimize induced hum.
- **category** *(NEW)*: Amplifier Design
- **related_terms** *(NEW)*: Switch-Mode Power Supply (SMPS); Rail Voltage; Quiescent Current; Class G; Class H
- **common_mistakes** *(NEW)*: Assuming a toroidal has zero external field — it is much lower than an EI type but not nil, so placement relative to input stages still matters.; Ignoring inrush current — toroidals draw a large turn-on surge that can trip breakers or need soft-start circuitry.; Believing a toroidal automatically means better sound; it reduces hum and stray field but overall performance depends on the whole design.
- **scenario_contexts** *(NEW)*: Diagnosing induced hum and finding a transformer mounted too close to input wiring.; Specifying a low-noise amplifier or preamp where a quiet background is critical.; Understanding why a large toroidal amp needs a soft-start or trips a breaker on power-up.
- _sources: Audioengine, 'What Are Toroidal Transformers and Why Do They Matter for Quality Sound?'; Handbook for Sound Engineers (Ballou), transformer and power supply section; nretec, 'Toroidal Transformers: Are They Really Better?' (stray-field / EMI comparison)_


## AUDI201 — Analog Live Sound
*12 terms*

### Backline
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: All the instrument gear that sits behind the band on stage — guitar and bass amps, keyboards, and the drum kit — whether the band brought it or the venue supplied it.
- **purpose_function** *(NEW)*: It provides the onstage instrument amplification and rhythm-section gear the performers actually play, and standardizing or renting it lets festivals swap acts quickly without re-hauling and re-soundchecking every band's equipment.
- **practical_application** *(NEW)*: A tech reads the backline list on the tech rider, sets up the amps, keys, and drum kit at their marked positions, then mics or DIs each source into the stage box before soundcheck.
- **category** *(NEW)*: Stage Setup
- **related_terms** *(NEW)*: Tech Rider; Stage Left / Stage Right; Monitor World; Load-In; Spike Mark
- **common_mistakes** *(NEW)*: Confusing backline (the instrument amplification and drums) with the PA or 'frontline' that faces the audience.; Assuming the venue-provided backline matches the rider exactly — always confirm makes, models, and condition during the advance.; Forgetting that a shared festival drum kit still needs each act's own breakables (snare, cymbals, pedals) unless the rider says otherwise.
- **scenario_contexts** *(NEW)*: A touring act flies overseas and rents backline locally rather than shipping heavy amps and drums through customs.; A multi-band festival supplies a common backline so stagehands can changeover acts in minutes.; A house tech stages the rented guitar amp, bass rig, keyboard, and drum kit before the band's load-in.
- _sources: Backline (stage) — Wikipedia; Sweetwater InSync — Backline; Careers in Music — Backline in Music_

### Cable Management
*difficulty: intermediate · confidence: High*

- **definition** *(NEW)*: The practice of routing, bundling, dressing, and securing audio, power, and data cables on and around a stage so signal runs stay organized, undamaged, and free of trip and safety hazards.
- **plain_english** *(NEW)*: Keeping all the cables neat and taped down so nobody trips, signals stay clean, and you can find and coil each cable fast at the end of the night.
- **purpose_function** *(NEW)*: Good cable management protects gear and signal integrity, speeds teardown, and — most importantly — removes trip hazards in performer and audience pathways.
- **practical_application** *(NEW)*: A tech runs cables in neat parallel or perpendicular lines along walls or stage edges, tacks and tapes them down with gaffer tape, and uses cable ramps or mats wherever a run crosses a walkway.
- **category** *(NEW)*: Stage Setup
- **related_terms** *(NEW)*: Load-In; Backline; Stage Left / Stage Right; Monitor World; Spike Mark
- **common_mistakes** *(NEW)*: UNSAFE: Leaving cables loose across a walkway, doorway, or audience path — an untamed run is a fall/trip hazard; cross-traffic cables must be taped with gaffer tape or covered with a rated cable ramp or mat.; UNSAFE: Running audio cables bundled tightly alongside AC power cables, which invites hum/interference and mixes signal with mains — keep power and signal separated and cross at 90 degrees when they must meet.; Coiling cable against its natural lay (not using an over-under coil), which kinks conductors and shortens cable life.; Using duct tape instead of gaffer tape, leaving adhesive residue on cables and floors.
- **scenario_contexts** *(NEW)*: A tech dresses and tapes down mic and monitor cables across the downstage edge before doors open.; A crew lays a cable ramp where the snake crosses a backstage doorway used by performers.; During load-out, neatly labeled and over-under coiled cables let the crew pack quickly and correctly.
- _sources: ProSoundWeb — Wired In: Common Sense Cabling Practices For The Live Stage; Recording Arts Canada — Cable Management for Beginners; Sweetwater InSync — How to Organize Cables & Gear Onstage_

### Downstage
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The front of the stage, closest to the audience.
- **purpose_function** *(NEW)*: It gives everyone a shared, unambiguous word for the area nearest the audience so directors, techs, and performers can place gear and people without confusion.
- **practical_application** *(NEW)*: A tech told to move a wedge or vocal mic 'downstage' brings it toward the front edge, closer to the crowd.
- **category** *(NEW)*: Stage Directions
- **related_terms** *(NEW)*: Upstage; Stage Left / Stage Right; Spike Mark; Monitor World; Backline
- **common_mistakes** *(NEW)*: Reversing upstage and downstage — downstage is toward the audience, not the back wall.; Forgetting the term comes from raked stages that sloped down toward the audience, so 'down' means the front even on a flat modern stage.; Reading the direction from the audience's point of view rather than the performer's facing-the-audience frame.
- **scenario_contexts** *(NEW)*: A monitor engineer moves a floor wedge downstage so the lead singer at the front edge can hear it.; A stage plot marks the vocal mic downstage-center for the main act.; A director asks a performer to step downstage into a tighter, closer-to-audience position.
- _sources: Backstage — Understanding Theater Stage Positions; Humanities LibreTexts — Parts of the Stage_

### Load-In
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The start-of-day process of getting all the gear off the truck and into the venue to set up for the show.
- **purpose_function** *(NEW)*: It is the scheduled window in which crews move, position, and begin assembling sound, lighting, backline, and staging so the show can be built on time.
- **practical_application** *(NEW)*: A tech arrives at the load-in call time, helps roll cases from the truck to the stage, and starts placing and cabling the PA, monitors, and backline.
- **category** *(NEW)*: Production Logistics
- **related_terms** *(NEW)*: Load-Out; Strike; Production Advance; Tech Rider; Backline
- **common_mistakes** *(NEW)*: Confusing load-in (moving gear in and setting up) with soundcheck, which comes after the system is built.; Ignoring the advanced load-in schedule and access details (dock, door sizes, union/house rules), causing delays.; Under-staffing the call so the large amount of work in a short window runs late.
- **scenario_contexts** *(NEW)*: A crew meets the truck at the loading dock at the 8 a.m. load-in call to begin building the stage.; A house tech coordinates load-in order so the PA goes up before backline and monitors are placed.; A festival stagger the load-in of multiple acts to share limited dock and stage access.
- _sources: AudioDramaProduction.com — Live Sound Engineering Glossary: Load In; SoundGirls.org — Let's Load In!; MI.edu — How to Plan a Live Concert_

### Load-Out
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The end-of-night process of tearing down all the gear and packing it back onto the truck after the show.
- **purpose_function** *(NEW)*: It is the reverse of load-in — breaking down, packing, and removing production equipment so the venue is cleared and gear is ready to travel to the next date.
- **practical_application** *(NEW)*: After the show a tech coils cables over-under, cases the mics and stands, and rolls the PA and backline out to the truck in a planned pack order.
- **category** *(NEW)*: Production Logistics
- **related_terms** *(NEW)*: Load-In; Strike; Cable Management; Tech Rider; Backline
- **common_mistakes** *(NEW)*: Rushing teardown before signal is muted/powered down safely, risking loud pops or damage.; Packing cables and cases out of their labeled order, slowing the next day's load-in.; Treating load-out as optional overtime — it is part of the crew call and often the most time-pressured, fatigue-prone phase.
- **scenario_contexts** *(NEW)*: The crew strikes the stage and loads the truck immediately after the headliner to meet a venue curfew.; A tech labels and coils each cable during load-out so re-patching is fast at the next venue.; Extra stagehands are called for load-out to clear a shared festival stage before the next act.
- _sources: Crescat — Load-In and Load-Out Crew; MI.edu — How to Plan a Live Concert: Load-Out; StageNotes — Load In / Load-Out_

### Monitor World
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The side-of-stage mixing spot where a dedicated engineer builds the sound the performers hear onstage, separate from the mix the audience hears.
- **purpose_function** *(NEW)*: It is the position and console domain where the monitor engineer creates individual on-stage mixes (wedges and in-ears) so each performer can hear themselves and the band clearly.
- **practical_application** *(NEW)*: A monitor engineer works from monitor world with a clear sightline to the band, taking hand cues and building a separate mix per performer during soundcheck and the show.
- **category** *(NEW)*: Stage Setup
- **related_terms** *(NEW)*: Backline; Stage Left / Stage Right; Tech Rider; Load-In; Cable Management
- **common_mistakes** *(NEW)*: Assuming monitor world and front-of-house are the same job — monitors serve the performers, FOH serves the audience.; Placing the monitor console where the engineer can't see the performers, losing the visual cues monitor mixing depends on.; Treating each monitor send as identical instead of a customized mix per performer's needs.
- **scenario_contexts** *(NEW)*: The monitor engineer at stage-left monitor world dials in the drummer's wedge and the singer's in-ear mix during soundcheck.; Mid-show a guitarist signals for 'more me,' and monitor world raises that channel in the player's mix.; On a larger tour, monitor world runs a separate console from FOH, fed by a split of the same stage inputs.
- _sources: Stage monitor system — Wikipedia; Sound on Sound — Stage Monitoring & Monitor Mixing; SoundGirls.org — Monitor Engineer_

### Production Advance
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The pre-show phone calls and emails where the touring crew and the venue sort out every technical and logistical detail before the day of the show.
- **purpose_function** *(NEW)*: It confirms and reconciles the tech rider against what the venue can actually provide — PA, monitors, power, backline, schedule, crew, and access — so problems are solved on paper, not at soundcheck.
- **practical_application** *(NEW)*: A production or house tech 'advances the show' by reviewing the rider and stage plot with the venue days ahead, flagging gaps and locking load-in times, power, and gear.
- **category** *(NEW)*: Production Logistics
- **related_terms** *(NEW)*: Tech Rider; Load-In; Backline; Monitor World; Stage Left / Stage Right
- **common_mistakes** *(NEW)*: Skipping or rushing the advance, so rider mismatches surface on show day when there's no time to fix them.; Advancing only the input list and forgetting logistics like dock access, power, curfew, and crew calls.; Assuming the venue read the rider — confirm each key item explicitly rather than presuming agreement.
- **scenario_contexts** *(NEW)*: A tour manager emails the venue a week out to confirm the console, monitor count, and power distro in the rider.; During the advance, the house engineer flags that the requested line-array model isn't available and proposes an equivalent.; Load-in times, parking, and stagehand counts are locked during the advance so the show-day timeline holds.
- _sources: Off Trail Studios — Guide to Tech Riders and Stage Plots; MI.edu — Show Advance, Stage Plots, and Load-Out; Improvised Music Company — What is a Technical Rider_

### Spike Mark
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A small piece of tape on the stage floor that shows exactly where a stand, instrument, monitor, or performer is supposed to go.
- **purpose_function** *(NEW)*: It records the correct position of movable items so gear and performers can be reset to the same spot quickly and consistently across soundcheck, changeovers, and multiple shows.
- **practical_application** *(NEW)*: A tech lays thin spike tape (often an L or cross) at a wedge, mic stand, or amp position so it can be struck for another act and put back precisely.
- **category** *(NEW)*: Stage Setup
- **related_terms** *(NEW)*: Stage Left / Stage Right; Downstage; Backline; Monitor World; Strike
- **common_mistakes** *(NEW)*: Using thick duct tape instead of thin spike/gaffer tape, leaving residue and a visible, hard-to-remove mark.; Placing spikes where they're visible to the audience instead of on the upstage side of the item.; Failing to color-code or label spikes on a busy stage, so multiple acts' positions get confused.
- **scenario_contexts** *(NEW)*: A monitor tech spikes each wedge position so a shared stage can be reset per act during changeovers.; Glow (phosphorescent) spike tape marks positions for safe placement during a blackout scene change.; A stage manager color-codes spikes to distinguish the positions of different bands at a festival.
- _sources: Spike (stagecraft) — Wikipedia; AACT — Spike or Spike Mark; Glossaria.net — Technical Theatre: Spike_

### Stage Left / Stage Right
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Left and right from the performer's point of view while facing the audience — so stage right is the audience's left, and stage left is the audience's right.
- **purpose_function** *(NEW)*: It fixes one shared reference frame (the performer's) so directions never flip depending on who's talking, preventing confusion between crew, performers, and directors.
- **practical_application** *(NEW)*: A tech told to place the bass rig 'stage right' positions it to the performers' right, which is on the audience's left as they look at the stage.
- **category** *(NEW)*: Stage Directions
- **related_terms** *(NEW)*: Upstage; Downstage; Spike Mark; Monitor World; Backline
- **common_mistakes** *(NEW)*: Giving directions from the audience's perspective, flipping left and right and causing setup errors.; Forgetting that FOH and audience see the mirror image, so 'stage right' looks like the left side from the mix position.; Mixing 'house left/right' (audience frame) and 'stage left/right' (performer frame) in the same conversation without saying which.
- **scenario_contexts** *(NEW)*: A stage plot labels the drum riser stage-left and the keyboards stage-right for consistent load-in.; The monitor engineer calls 'more guitar in the stage-right wedge' and everyone knows which side.; A lighting cue references stage right, meaning the performers' right regardless of where the operator sits.
- _sources: Backstage — Understanding Theater Stage Positions; StagePlotGuru — A Guide To Common Stage Positioning Terms_

### Strike
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: To take something down and remove it from the stage — either a single item or the whole show after it's done.
- **purpose_function** *(NEW)*: It clears the stage of set, gear, and cabling so the space is returned to a blank slate for the next act, changeover, or the end of a run.
- **practical_application** *(NEW)*: A tech told to 'strike the wedge' removes that monitor; at end of night the crew strikes the entire production during load-out.
- **category** *(NEW)*: Production Logistics
- **related_terms** *(NEW)*: Load-Out; Load-In; Spike Mark; Cable Management; Backline
- **common_mistakes** *(NEW)*: Thinking strike always means the whole set — it can also mean removing a single item from the stage.; Striking gear while it's still powered or live, risking pops, damage, or signal to a running PA.; Confusing 'strike' with 'load-out'; striking is the teardown, load-out is moving the struck gear out of the venue.
- **scenario_contexts** *(NEW)*: Between acts the crew strikes the opener's backline to reset the stage for the headliner.; A stagehand is told to strike an unused mic stand so it's off the performance area.; After the final show of a run, the whole production is struck and packed out.
- _sources: AACT — Strike; Alley Theatre — Theatre Vocab 101; Playbill — 32 Theatre Terms Everyone Should Know_

### Tech Rider
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The document a band gives the venue that lists everything they need technically — what to plug in, what backline and PA to provide, how many monitors, and where everyone stands.
- **purpose_function** *(NEW)*: As a contractual addendum, it tells the venue exactly what equipment and technical services the act requires so the show can be built correctly and soundcheck time isn't wasted.
- **practical_application** *(NEW)*: A house tech works from the tech rider's input/channel list, stage plot, and backline and monitor requirements to patch and set up the stage before the band arrives.
- **category** *(NEW)*: Production Logistics
- **related_terms** *(NEW)*: Production Advance; Backline; Monitor World; Load-In; Stage Left / Stage Right
- **common_mistakes** *(NEW)*: Writing a vague rider that omits the channel list, stage plot, or monitor count, forcing guesswork at soundcheck.; Treating the rider as fixed law rather than a starting point to reconcile with the venue during the advance.; Confusing the technical rider (gear and setup) with the hospitality rider (food, greenroom, transport).
- **scenario_contexts** *(NEW)*: A venue receives a band's tech rider and pre-patches the console from its channel list before load-in.; The stage plot in the rider tells the crew where to place amps, drums, and monitors.; During the advance, the house engineer negotiates rider items the venue can't fully meet.
- _sources: Improvised Music Company — What is a Technical Rider; Off Trail Studios — Guide to Tech Riders and Stage Plots; Sonicbids — 7 Elements of a Good Live Sound Tech Rider_

### Upstage
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The back of the stage, farthest from the audience.
- **purpose_function** *(NEW)*: It gives a shared, unambiguous word for the area toward the back wall so gear and performers can be positioned without confusion.
- **practical_application** *(NEW)*: A tech told to move the drum riser or an amp 'upstage' positions it toward the back of the stage, away from the audience.
- **category** *(NEW)*: Stage Directions
- **related_terms** *(NEW)*: Downstage; Stage Left / Stage Right; Spike Mark; Backline; Monitor World
- **common_mistakes** *(NEW)*: Reversing upstage and downstage — upstage is toward the back wall, away from the audience.; Forgetting the term comes from raked stages that sloped up toward the back, so 'up' means the rear even on a flat modern stage.; Reading the direction from the audience's view rather than the performer's facing-the-audience frame.
- **scenario_contexts** *(NEW)*: The drum riser and backline amps are placed upstage so the vocalists work downstage in front.; A stage plot marks the keyboard rig upstage-right, toward the back wall.; A director asks a performer to move upstage, stepping back and away from the audience.
- _sources: Backstage — Understanding Theater Stage Positions; Humanities LibreTexts — Parts of the Stage_


## AUDI201 — Assisted Listening Systems
*5 terms*

### Auracast
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: It works like a radio station for sound: a venue creates a labeled audio broadcast and anyone with compatible earbuds, hearing aids, or a phone can tune in and hear it straight in their ears.
- **purpose_function** *(NEW)*: It uses Bluetooth LE Audio to send one program stream to an unlimited number of nearby listeners at once, bypassing room acoustics and background noise so audio arrives clearly. It exists to give hearing-aid, cochlear-implant, and mainstream earbud users a single shared assistive-listening path without proprietary receivers.
- **practical_application** *(NEW)*: A tech feeds a venue mix into an Auracast transmitter and publishes named broadcasts (e.g. 'Main Auditorium' or 'Language: Spanish') that patrons select from their phone or hearing aids; QR codes or on-screen prompts help users join public or password-protected streams.
- **category** *(NEW)*: Assistive Listening
- **related_terms** *(NEW)*: Bluetooth LE Audio; Telecoil; Wi-Fi Assistive Streaming; Induction Loop; Infrared Assistive Listening
- **common_mistakes** *(NEW)*: Assuming any Bluetooth device works. Auracast requires Bluetooth LE Audio (5.2+) hardware; Classic Bluetooth cannot receive broadcasts.; Treating it like one-to-one pairing. Auracast is one-to-many broadcast, so listeners join a stream rather than 'connecting' the way earbuds pair to a phone.; Forgetting it does not replace the ADA assistive-listening obligation on its own until compatible receivers are provided for patrons who lack their own devices.; Leaving broadcasts unencrypted when privacy is needed. Sensitive audio should use a passphrase-protected stream.
- **scenario_contexts** *(NEW)*: A theater broadcasts the stage mix so hearing-aid users receive dialogue directly instead of relying on the house PA.; An airport gate publishes an Auracast stream so travelers hear boarding announcements clearly over ambient noise.; A gym lets patrons tune each TV's audio into their own earbuds via labeled broadcasts.; A house of worship offers multi-language Auracast channels for simultaneous interpretation.
- _sources: Bluetooth SIG - Auracast Broadcast Audio / Assistive Listening (bluetooth.com/auracast); Listen Technologies - The Power of Auracast in Assistive Listening (listentech.com); HearingTracker - Auracast in Hearing Aids and Hearables (hearingtracker.com/auracast)_

### Closed Captioning
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: It is the on-screen text of what is being said and heard in a video, which the viewer can switch on or off. Unlike 'open' captions, closed captions are hidden until the user turns them on.
- **purpose_function** *(NEW)*: It presents dialogue, speaker identity, and relevant non-speech sounds as synchronized text so people who are deaf or hard of hearing can follow program content. It complements assistive-audio systems by covering the information that amplified sound alone cannot convey.
- **practical_application** *(NEW)*: An AV tech enables a decoder, caption channel, or caption encoder in the signal chain and verifies captions are accurate, synchronized, complete, and correctly placed; in live events this often means routing a CART/captioner feed to displays or a caption bar.
- **category** *(NEW)*: Assistive Listening
- **related_terms** *(NEW)*: Assistive Listening System; Auracast; Wi-Fi Assistive Streaming; Telecoil; Induction Loop
- **common_mistakes** *(NEW)*: Confusing closed captions with subtitles. Subtitles assume the viewer can hear and only translate dialogue, while closed captions also convey speaker IDs and non-speech sounds for deaf/HOH viewers.; Confusing closed with open captions. Open (burned-in) captions cannot be turned off; closed captions are user-toggleable.; Assuming captions satisfy accessibility on their own. The ADA requires an assistive-listening (audio) system in most assembly areas in addition to visual access.; Neglecting synchronization and accuracy, which FCC quality rules require captions to be accurate, synchronous, complete, and properly placed.
- **scenario_contexts** *(NEW)*: A stadium enables captions on video boards so announcements reach deaf and hard-of-hearing fans.; A lecture hall displays live CART captions alongside an audio assistive-listening feed.; A broadcast facility inserts a caption channel into the program stream to meet FCC television requirements.; A museum exhibit video provides closed captions viewers toggle at a kiosk.
- _sources: FCC - Closed Captioning on Television (fcc.gov/consumers/guides/closed-captioning-television); ADA / Section 508 video accessibility guidance (3playmedia.com/blog/us-laws-video-accessibility); U.S. ADA 2010 Standards for Accessible Design - assembly area assistive listening (ada.gov)_

### Field Strength Meter
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: It is a handheld tester that measures how strong and even the magnetic signal from a hearing loop is, so you can prove the loop actually works for hearing-aid users. Think of it as a level meter for the invisible magnetic field a loop produces.
- **purpose_function** *(NEW)*: It measures induction-loop magnetic field strength (referenced to 400 mA/m = 0 dB), frequency response, and background magnetic noise so a system can be verified against IEC 60118-4. It exists because a loop's performance is invisible and inaudible without a calibrated instrument, and telecoil users depend on correct, uniform field levels.
- **practical_application** *(NEW)*: During commissioning and maintenance a tech feeds a 1 kHz reference tone, then walks the listening area taking readings at the center and several positions, adjusting loop-amplifier gain and metal-loss compensation until the field is 400 mA/m within +/-3 dB and response is flat 100 Hz-5 kHz.
- **category** *(NEW)*: Assistive Listening
- **related_terms** *(NEW)*: IEC 60118-4; Induction Loop; Telecoil; Loop Amplifier; Assistive Listening System
- **common_mistakes** *(NEW)*: Judging a loop by ear or by hearing-aid reception instead of a calibrated meter, which cannot confirm the 400 mA/m level or uniformity.; Measuring at only one spot. IEC 60118-4 requires checking multiple listening positions because field strength must stay within +/-3 dB across the area.; Ignoring background magnetic noise, which must be low enough (typically no worse than -32 dB, ideally -47 dB(A)) or intelligibility suffers.; Forgetting to set/verify the 1 kHz reference tone before reading, giving meaningless field-strength numbers.
- **scenario_contexts** *(NEW)*: An installer certifies a new theater hearing loop to IEC 60118-4 before handover.; A maintenance tech investigates a complaint that a loop is too quiet and finds the amplifier gain drifted below 400 mA/m.; A commissioning engineer maps field uniformity across a large looped auditorium to locate dead zones.; A tech surveys a room for existing magnetic noise (from dimmers or transformers) before installing a loop.
- _sources: Ampetronic - FSM Field Strength Meter / commissioning to IEC 60118-4 (ampetronic.com); Williams AV - ProLoop FSM Plus and Loop Certification per IEC 60118-4 (williamsav.com); IEC 60118-4:2014 Electroacoustics - Hearing aid induction-loop systems (iec.ch / iteh.ai)_

### IEC 60118-4
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: It is the international rulebook that says how strong, how clear, and how quiet a hearing loop's signal must be to count as 'good enough' for hearing-aid users. If a loop passes IEC 60118-4, a telecoil user should hear it well anywhere in the looped area.
- **purpose_function** *(NEW)*: It specifies the required magnetic field strength (0 dB = 400 mA/m), the minimum frequency response for intelligibility, and acceptable background magnetic-noise limits for audio-frequency induction-loop systems feeding hearing-aid telecoils. It exists to give a measurable, verifiable performance benchmark so loops deliver adequate signal-to-noise without overloading the hearing aid.
- **practical_application** *(NEW)*: Installers commission and certify loops against this standard using a field strength meter, verifying the field reaches 400 mA/m (+/-3 dB) at 1 kHz, response stays within +/-3 dB from 100 Hz to 5 kHz, and background noise is within limits at multiple listening positions.
- **category** *(NEW)*: Assistive Listening
- **related_terms** *(NEW)*: Field Strength Meter; Induction Loop; Telecoil; Loop Amplifier; Assistive Listening System
- **common_mistakes** *(NEW)*: Assuming a loop is compliant just because it is installed. Compliance requires measured verification against the standard's field-strength, response, and noise limits.; Reading 400 mA/m as the peak. It is the long-term reference level (0 dB), with peaks allowed above it, and the design target is +/-3 dB at 1 kHz.; Checking only field strength and skipping frequency response (100 Hz-5 kHz within +/-3 dB) and background-noise requirements.; Confusing IEC 60118-4 (loop performance) with ADA rules, which mandate that assistive listening be provided but reference this standard for loop quality.
- **scenario_contexts** *(NEW)*: An engineer certifies a ticket-counter or auditorium loop to IEC 60118-4 for handover documentation.; A consultant writes the standard into an AV specification so bidders must deliver a compliant loop.; A tech troubleshoots poor telecoil reception by re-testing the loop against the standard's noise and response limits.; An inspector confirms an assembly-area loop meets the referenced performance standard for accessibility compliance.
- _sources: IEC 60118-4:2014 Electroacoustics - Hearing aid induction-loop system requirements (webstore.iec.ch); Univox / Ampetronic technical guides to IEC 60118-4 performance (field strength, response, noise); Williams AV Loop Certification per BS EN / IEC 60118-4 (williamsav.com)_

### Wi-Fi Assistive Streaming
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: It sends the venue's audio over Wi-Fi to a free app on the listener's own phone, so people use their own device and earbuds to hear clearly. No special receiver hardware is handed out because the phone is the receiver.
- **purpose_function** *(NEW)*: A server on the venue network encodes one or more program channels and streams low-latency audio to patrons' smartphones over Wi-Fi, letting listeners choose channels (e.g. program, interpretation) and hear directly. It exists to provide assistive listening and language interpretation using devices patrons already own, lowering per-receiver cost.
- **practical_application** *(NEW)*: A tech connects program audio to the streaming server, joins it to the house Wi-Fi with adequate access-point coverage, configures channels, and tests latency for lip-sync; because patrons use their own phones, the venue still stocks loaner receivers and neck loops plus signage to meet ADA counts.
- **category** *(NEW)*: Assistive Listening
- **related_terms** *(NEW)*: Auracast; Assistive Listening System; Neck Loop; Telecoil; Closed Captioning
- **common_mistakes** *(NEW)*: Assuming the app alone satisfies the ADA. Compliance requires the correct number of receivers/loaner devices, neck loops, and signage in addition to the streaming system.; Underprovisioning Wi-Fi. Insufficient access-point coverage or bandwidth causes dropouts and defeats the assistive purpose.; Ignoring latency, which excessive lag breaks lip-sync between the streamed audio and the live/stage source.; Assuming telecoil users are served automatically. Hearing-aid users need a neck loop paired to the phone to reach their telecoil.
- **scenario_contexts** *(NEW)*: A house of worship streams the sermon and a Spanish interpretation channel to congregants' phones.; A sports bar sends each TV's audio to patrons who select the game they want in the app.; A lecture hall provides the instructor's mic feed to students' phones for clearer speech.; A museum offers multi-language tour audio over Wi-Fi without distributing dedicated players.
- _sources: Listen Technologies - ListenWIFI / Listen EVERYWHERE ADA-compliant Wi-Fi assistive listening (listentech.com); Listen Technologies press - ADA Compliant Wi-Fi Assistive Listening Systems (listentech.com/news); AudioFetch - Audio over Wi-Fi assistive listening (audiofetch.com)_


## AUDI201 — Audio Measurement & Optimization
*5 terms*

### Exponential Sine Sweep
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A test tone that slides smoothly from a low pitch up to a high one; because it rises in this exact way, the math used afterward can peel a system's clean response apart from its distortion.
- **purpose_function** *(NEW)*: It excites a system across the full audio band with high signal-to-noise ratio, and when the recording is deconvolved with the original sweep, the harmonic-distortion products land at separate (negative) times so the linear impulse response can be isolated from distortion.
- **practical_application** *(NEW)*: It is the default stimulus in tools like REW, ARTA, and Smaart for capturing a loudspeaker or room impulse response and, in the same pass, reading off the harmonic distortion of the device under test.
- **category** *(NEW)*: Acoustic Measurement
- **related_terms** *(NEW)*: Impulse Response; Maximum Length Sequence (MLS); Quasi-Anechoic Measurement; Transfer Function; Total Harmonic Distortion; Waterfall Plot (CSD)
- **common_mistakes** *(NEW)*: Using too short a sweep, which starves the low frequencies of energy and degrades low-frequency SNR; Allowing the level, mic position, or environment to change during the sweep, which corrupts the deconvolution; Not leaving enough silent tail after the sweep, so harmonic-distortion products wrap around and contaminate the linear impulse response; Assuming results are valid on strongly time-variant or non-linear systems (wind, moving sources, hard clipping)
- **scenario_contexts** *(NEW)*: Measuring a loudspeaker's frequency response and harmonic distortion in a single capture; Capturing a room impulse response to derive reverberation time and clarity metrics; Recording an impulse response of a hall or hardware unit for convolution reverb; Verifying DSP crossover, delay, and EQ settings on an installed system
- _sources: Farina, A. (2000). Simultaneous Measurement of Impulse Response and Distortion With a Swept-Sine Technique, AES Convention 108; Muller & Massarani (2001), Transfer-Function Measurement with Sweeps, JAES; Rational Acoustics Smaart measurement documentation_

### Ground-Plane Measurement
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: You place the loudspeaker and the microphone directly on a large, hard, flat surface so the floor bounce arrives at exactly the same instant as the direct sound and simply reinforces it, instead of arriving late and carving dips into the response.
- **purpose_function** *(NEW)*: It removes the single destructive floor reflection by merging it in-phase with the direct sound, yielding a clean half-space (2-pi) far-field response without needing a tall stand, an elevated flying point, or an anechoic chamber.
- **practical_application** *(NEW)*: A technician lays the microphone flat on a large reflective surface (a parking lot or gym floor) at a measured distance from a ground-mounted loudspeaker, obtaining repeatable far-field data that reads about 6 dB higher than a true free-field measurement.
- **category** *(NEW)*: Acoustic Measurement
- **related_terms** *(NEW)*: Quasi-Anechoic Measurement; Free-Field; Comb Filtering; Boundary Interference; Far-Field; Impulse Response
- **common_mistakes** *(NEW)*: Forgetting the roughly +6 dB level gain contributed by the in-phase reflection when comparing to free-field data; Using a soft or absorptive surface (grass, carpet) that does not fully reflect, so the reflection is not truly coincident and in-phase; Raising the microphone capsule off the plane, which reintroduces a delayed reflection and comb filtering; Measuring too close, which puts the microphone in the near field and gives inaccurate far-field response
- **scenario_contexts** *(NEW)*: Outdoor far-field frequency-response and polar measurement of a subwoofer or full-range loudspeaker; Comparing line-array or point-source systems on a large open lot before a show; Characterizing a system when no anechoic chamber is available; Field verification of a loudspeaker's sensitivity and response after transport
- _sources: McCarthy, B. Sound Systems: Design and Optimization (measurement microphone placement); Ballou, G. Handbook for Sound Engineers (loudspeaker measurement); Prosoundtraining.com / Pat Brown, Ground Plane Measurements_

### Maximum Length Sequence (MLS)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A special random-sounding string of on/off pulses; because of its unique mathematical structure, comparing exactly what was sent against what the microphone heard reveals how the room or loudspeaker responds, and it holds up well even when background noise is present.
- **purpose_function** *(NEW)*: It provides a deterministic, spectrally flat stimulus whose circular cross-correlation with the captured response yields the system's impulse response, giving high noise immunity and processing gain for a linear, time-invariant system.
- **practical_application** *(NEW)*: It was the core stimulus of analyzers such as MLSSA and older PC measurement systems: the periodic sequence is played, the recorded output is cross-correlated with the sequence to recover the impulse response, though for most work it has been superseded by swept-sine methods that handle distortion better.
- **category** *(NEW)*: Acoustic Measurement
- **related_terms** *(NEW)*: Impulse Response; Exponential Sine Sweep; Transfer Function; Signal-to-Noise Ratio; Quasi-Anechoic Measurement; Cross-Correlation
- **common_mistakes** *(NEW)*: Assuming distortion is rejected: any non-linearity smears as noise across the whole impulse response, unlike a swept-sine that isolates it in time; Running MLS on a time-variant system (temperature drift, wind, moving sources), which breaks the cross-correlation and corrupts the result; Not capturing an integer number of full periods, which introduces errors in the circular cross-correlation; Confusing MLS with ordinary random white noise; MLS is deterministic and periodic
- **scenario_contexts** *(NEW)*: Legacy MLSSA-based loudspeaker frequency-response and impulse-response testing; Room impulse-response capture where high signal-to-noise ratio is needed; Measurement in noisy environments where synchronous averaging improves SNR; Comparing older MLS datasets against modern swept-sine measurements
- _sources: Rife, D. & Vanderkooy, J. (1989). Transfer-Function Measurement with Maximum-Length Sequences, JAES; Liberty Instruments (MLSSA) MLS-based measurement technical notes; Ballou, G. Handbook for Sound Engineers_

### Quasi-Anechoic Measurement
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: You measure a loudspeaker in an ordinary room, then trim away the part of the recorded response that arrives after the first wall or floor bounce, leaving only the direct sound, effectively faking an anechoic chamber.
- **purpose_function** *(NEW)*: It produces a reflection-free frequency response without a chamber by time-windowing (gating) the impulse response before the first reflection arrives, so room boundaries are excluded, with the window length setting how low in frequency the result stays valid.
- **practical_application** *(NEW)*: A technician measures a loudspeaker on a stand away from boundaries, gates the impulse response at the arrival time of the first reflection, and often splices in a near-field measurement to recover the low-frequency content lost to the short window.
- **category** *(NEW)*: Acoustic Measurement
- **related_terms** *(NEW)*: Impulse Response; Ground-Plane Measurement; Free-Field; Near-Field Measurement; Exponential Sine Sweep; Comb Filtering
- **common_mistakes** *(NEW)*: Setting the window too long, which lets reflections back in and adds ripple to the response; Setting the window too short, which destroys low-frequency resolution (usable resolution is roughly 1 over the window length); Forgetting that in a normal-sized room the result is typically invalid below about 200 to 300 Hz; Failing to splice a near-field bass measurement to extend the low-frequency response
- **scenario_contexts** *(NEW)*: Measuring a loudspeaker's on-axis mid/high response in an ordinary untreated room; Quality control of drivers or finished speakers without an anechoic chamber; Verifying crossover behavior in-room during a build or repair; Combining gated far-field with near-field data to build a full-range response curve
- _sources: Ballou, G. Handbook for Sound Engineers (quasi-anechoic / gated measurement); AES E-Library: Extending Quasi-Anechoic Measurements to Low Frequencies; Audio Precision, Loudspeaker Acoustic Measurements in Ordinary Rooms_

### Waterfall Plot (CSD)
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A pseudo-3D graph that shows how each frequency fades away over time after the sound stops; ridges that linger instead of dropping quickly mean the loudspeaker or room is ringing at those frequencies.
- **purpose_function** *(NEW)*: It exposes stored energy, resonances, and ringing (decay behavior) that a flat frequency-response curve cannot show, by plotting a succession of spectra taken from progressively later time slices of the impulse response.
- **practical_application** *(NEW)*: In tools like REW or ARTA a technician views the cumulative spectral decay to locate driver breakup, cabinet or panel resonances, and room modes, aiming for rapid and uniform decay across all frequencies.
- **category** *(NEW)*: Acoustic Measurement
- **related_terms** *(NEW)*: Impulse Response; Resonance; Room Modes; Reverberation Time (RT60); Frequency Response; Exponential Sine Sweep
- **common_mistakes** *(NEW)*: Reading lingering low-frequency ridges as loudspeaker resonance when they are actually room modes or windowing artifacts; Over-interpreting the absolute decay time, which is distorted by the rising analysis window at high frequencies; Ignoring the limited frequency resolution of the display, especially at low frequencies; Confusing a peak in amplitude response with a resonance, which only the decay behavior reveals
- **scenario_contexts** *(NEW)*: Diagnosing loudspeaker cabinet or panel resonances during design or repair; Identifying ringing room modes to guide acoustic treatment placement; Evaluating headphone or driver decay in quality-control testing; Confirming that a resonance heard subjectively corresponds to slow decay in the data
- _sources: Shorter, D.E.L. (BBC) cumulative spectral decay method; JAES literature on CSD; Stereophile / John Atkinson, Measuring Loudspeakers (waterfall/CSD interpretation); Audio Precision APx CSD Utility documentation_


## AUDI201 — Commercial Audio Systems
*5 terms*

### Ambient Noise Sensor
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A microphone that listens to how loud a room is and lets the system automatically turn paging and music up when the space gets noisy and back down when it quiets, so announcements stay audible without blasting during slow periods.
- **purpose_function** *(NEW)*: Feeds a continuous measurement of background noise to the system's DSP so output level tracks changing conditions, keeping pages and background music intelligible over crowd and HVAC noise. It exists because a fixed volume is either too quiet when a space is busy or too loud when it is empty.
- **practical_application** *(NEW)*: An integrator mounts sensing mics in noisy zones and configures the ambient-compensation processor (for example Biamp Vocia ANC-1 or the QSC Q-SYS ambient compensator) with minimum and maximum gain limits and a response ratio so pages ride above measured noise, then verifies the loop does not run away or feed back.
- **category** *(NEW)*: Commercial Audio Systems
- **related_terms** *(NEW)*: Background Music (BGM); Paging System; DSP; Automatic Gain Control; Signal-to-Noise Ratio; Zone Paging
- **common_mistakes** *(NEW)*: Placing the sensing mic where it picks up the loudspeakers it controls, creating a runaway loop where the system keeps raising its own level.; Setting no maximum-gain limit, so a passing truck or night-time HVAC drives the system to full output.; Confusing ambient noise compensation with feedback suppression or input AGC, which solve different problems.; Setting the averaging/response time too fast, causing audible level pumping.
- **scenario_contexts** *(NEW)*: A shopping mall paging system that raises page and music level during busy hours and lowers it after closing.; An airport concourse where announcements must stay intelligible over fluctuating crowd noise.; A restaurant or bar where background music tracks changing patron noise through the evening.; A factory floor PA where machinery cycling on and off changes the noise floor.
- _sources: Biamp Vocia ANC-1 Ambient Noise Compensation Device data sheet and setup guide (biamp.com); QSC Q-SYS Continuous Ambient Compensator, Q-SYS Help and QuickStarts (qsc.com); Biamp Cornerstone design library, Retail paging with BGM and ambient noise compensation (support.biamp.com)_

### End-of-Line Resistor
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A resistor placed at the very end of a speaker or alarm wiring run so the panel can push a tiny test current all the way down the wire and back; if a wire breaks or shorts, that current changes and the panel reports a trouble before a real alarm ever needs the line.
- **purpose_function** *(NEW)*: It terminates a supervised (Class B) circuit with a known resistance so the panel's supervisory current sits in a normal window; any open or short moves the current out of that window and lets the panel annunciate a wiring fault. It exists so faults are caught during normal standby rather than discovered when the system fails to sound.
- **practical_application** *(NEW)*: The installer lands the correct-value resistor across the last device on the run, not at the panel, matching the panel manufacturer's listed specification; a missing, wrong-value, or mislocated resistor produces a supervisory trouble that the technician must resolve during commissioning and periodic testing.
- **category** *(NEW)*: Commercial Audio Systems
- **related_terms** *(NEW)*: Mass Notification System; Notification Appliance Circuit (NAC); Class A / Class B Wiring; Circuit Supervision; 70V/100V Line; Fire Alarm Control Panel
- **common_mistakes** *(NEW)*: Installing the resistor at the panel instead of the far end of the last device, which defeats supervision of the entire run.; Using the wrong resistor value or wattage for the panel, causing false troubles or masking real faults.; UNSAFE: Removing or jumpering out an end-of-line resistor to clear a nuisance trouble, which disables fault supervision on a life-safety circuit and can hide a broken wire that leaves occupants unwarned.; Assuming any resistor will do; value and wattage must match the panel manufacturer's listed specification.
- **scenario_contexts** *(NEW)*: A fire alarm notification appliance circuit feeding horn/strobes where the panel must detect a cut wire.; A voice evacuation or mass notification speaker circuit supervised for continuity.; Commissioning where deliberately opening the loop must produce a trouble signal to prove supervision works.; Troubleshooting a persistent NAC open trouble traced to a missing or failed end-of-line resistor.
- _sources: NFPA 72 National Fire Alarm and Signaling Code, circuits and pathways / Class B supervision (National Training Center summary of NFPA 72); Digitize Inc., EOLRs Are Needed for Fire Alarm System Reliability and Compliance (digitize-inc.com); NFPA 72 circuits and pathways overview, Safe & Secure magazine (issuu.com)_

### Mass Notification System
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A building- or campus-wide system that broadcasts clear spoken instructions, plus visual messages, during emergencies such as fire, an active threat, severe weather, or a chemical release, so people know what to do instead of only knowing that something is wrong.
- **purpose_function** *(NEW)*: It delivers prioritized, intelligible live or pre-recorded voice messages together with visible notification across a facility to direct occupant response for both fire and non-fire emergencies, as covered by NFPA 72 Chapter 24. It exists because a simple alarm tone tells people to leave but not which hazard applies or what action to take.
- **practical_application** *(NEW)*: Integrators lay out speakers and tune DSP for intelligibility (an STI target near 0.50 (≈0.70 CIS)), install a UL 2572-listed control unit with backup power and supervised circuits, and set message priority so emergency notification overrides paging and background music; commissioning includes intelligibility (STI/CIS) verification at occupant locations.
- **category** *(NEW)*: Commercial Audio Systems
- **related_terms** *(NEW)*: End-of-Line Resistor; Speech Intelligibility (STI); Autonomous Control Unit (ACU); Notification Appliance Circuit (NAC); Voice Evacuation; Paging System
- **common_mistakes** *(NEW)*: Designing for loudness (SPL) instead of intelligibility (STI/CIS), so messages are loud but not understandable.; Assuming a standard paging or background-music system qualifies; a code-compliant MNS requires a UL 2572-listed control unit, circuit supervision, and backup power.; UNSAFE: Wiring emergency notification without message priority, so a page or music source can override or block a life-safety announcement.; Overlooking visible notification for high-noise areas and hearing-impaired occupants.
- **scenario_contexts** *(NEW)*: A university campus broadcasting shelter-in-place instructions during an active-threat event.; An office tower directing phased evacuation for a fire on a specific floor.; A stadium delivering severe-weather instructions to crowds.; An industrial plant announcing a chemical-release response over the PA.
- _sources: NFPA 72 National Fire Alarm and Signaling Code, Chapter 24 Emergency Communications Systems (up.codes viewer; IFMA Central Ohio Chapter 24 summary); UL 2572 Standard for Mass Notification Systems, as referenced by NFPA 72 for control unit listing (Accu-Tech, Basics of MNS, NFPA, UL and Code Compliance); Alertus Technologies, NFPA 72 Mass Notification Requirements Guide (alertus.com); Honeywell/Notifier white paper, Chapter 24 Emergency Communication Systems of NFPA 72_

### Music-on-Hold (MOH)
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The music or message a caller hears while waiting on hold; the phone system plays it from a stored file or an audio feed so callers know they are still connected instead of sitting in silence.
- **purpose_function** *(NEW)*: It supplies audio to callers placed on hold through the phone system's MOH input, reassuring them that the call is still active and reducing hang-ups, and it can also deliver marketing or informational content. It exists to fill hold silence with reassuring, licensed audio.
- **practical_application** *(NEW)*: A technician connects a licensed audio source (an on-hold player, a DSP output, or an uploaded file) to the PBX or VoIP system's MOH port, or uploads a properly formatted file (commonly 8 kHz mono WAV or mu-law), and must use royalty-free or properly licensed audio rather than a broadcast radio feed.
- **category** *(NEW)*: Commercial Audio Systems
- **related_terms** *(NEW)*: Background Music (BGM); Paging System; PBX; Audio Distribution; Zone Paging; DSP
- **common_mistakes** *(NEW)*: Feeding a broadcast radio station into the MOH input; re-broadcasting copyrighted radio as hold music is a licensing violation.; Using a full-bandwidth hi-fi source without accounting for the phone system's narrowband path (roughly 300 Hz to 3.4 kHz, 8 kHz sample rate), so audio sounds harsh or distorted.; Mismatched levels that make the hold audio far louder or quieter than the agents' voices.; Assuming royalty-free and free are the same; copyrighted tracks still need proper licensing (sync plus master, or a covering license).
- **scenario_contexts** *(NEW)*: A call center feeding branded messages and licensed music to queued callers.; A small office sharing its background-music feed into the PBX MOH input.; A VoIP system where an uploaded WAV file plays to held callers.; Replacing an unlicensed radio-fed hold source with a compliant on-hold player during an install.
- _sources: Easy on Hold Knowledgebase, On-Premise PBX MOH Hold Music (learn.easyonhold.com); Nextiva VoIP Features, Hold Music (nextiva.com); TunePocket, On Hold Music: How To Choose, License, And Format Audio (tunepocket.com)_

### Speech Privacy
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The idea that you protect a conversation not by making it silent but by making it hard to make out the words, usually by adding a steady background sound so someone nearby cannot understand what is being said.
- **purpose_function** *(NEW)*: It is the design goal of a sound-masking system: raise the background noise floor with speech-shaped sound so nearby talk drops below intelligibility, protecting confidentiality without silencing the space. It exists because open-plan and adjacent spaces leak understandable speech that masking renders unintelligible.
- **practical_application** *(NEW)*: An integrator tunes ceiling masking emitters to a target spectrum and level (commonly around 42 to 48 dBA) and verifies performance with a privacy metric such as the Articulation Index per ASTM E1130, so overheard speech falls into the confidential or normal privacy range.
- **category** *(NEW)*: Commercial Audio Systems
- **related_terms** *(NEW)*: Sound Masking; Articulation Index; Signal-to-Noise Ratio; Ambient Noise Sensor; Speech Intelligibility (STI); Background Music (BGM)
- **common_mistakes** *(NEW)*: Confusing masking with noise cancellation; masking adds engineered sound, it does not remove or cancel sound.; Setting the masking level too high (above roughly 48 dBA), which becomes annoying and can undermine the comfort it is meant to provide.; Expecting masking to make speech inaudible rather than unintelligible; the goal is loss of intelligibility, not silence.; Uneven emitter tuning or coverage that leaves hot spots where speech is still intelligible.
- **scenario_contexts** *(NEW)*: An open-plan office keeping adjacent-workstation conversations from being understood.; A medical clinic meeting confidentiality goals at reception and exam rooms.; A bank or HR office protecting private financial and personnel discussions.; A secure facility requiring confidential speech-privacy levels.
- _sources: ASTM E1130, Standard Test Method for Objective Measurement of Speech Privacy in Open Plan Spaces Using Articulation Index (referenced via Lone Star Acoustics Sound Masking Reference Guide); Lencore, What is Speech Privacy and Why is it Important? (lencore.com); Cambridge Sound Management, Sound Masking Studies and References (cambridgesound.com)_


## AUDI201 — Consumer Audio Systems
*9 terms*

### Anti-Skate
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A small outward tug the turntable applies to the arm so the needle doesn't get dragged toward the middle of the record.
- **purpose_function** *(NEW)*: It counteracts the inward skating force created by the tonearm's offset angle and groove friction, keeping the stylus centered in the groove for even left/right channel balance and reduced distortion and wear.
- **practical_application** *(NEW)*: During cartridge setup a tech dials the anti-skate control to roughly match the tracking force in grams as a starting point, then fine-tunes by ear or with a test record.
- **category** *(NEW)*: Turntables
- **related_terms** *(NEW)*: Tracking Force; Tonearm; Platter; Direct Drive; Belt Drive
- **common_mistakes** *(NEW)*: Assuming anti-skate is optional or purely cosmetic when it directly affects channel balance and record wear.; Setting anti-skate wildly higher or lower than the tracking force instead of starting near a 1:1 match.; Confusing skating force (an inward pull) with tracking force (downward stylus weight).
- **scenario_contexts** *(NEW)*: Setting up a new cartridge and tonearm on a hi-fi turntable.; Diagnosing a record that mistracks or distorts more in one channel than the other.; Troubleshooting a tonearm that drifts inward across a stationary record.
- _sources: Audio-Technica: Audio Solutions Question of the Week — What Does the Anti-Skate Feature On My Turntable Do?; Elusive Disc: Turntable Setup Guide — Tracking Force, Anti-Skate & More; Crutchfield: Troubleshooting turntable tonearm sway_

### Bass Shaker (Tactile Transducer)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A gadget bolted to a seat or floor that shakes you with deep bass instead of making sound you hear.
- **purpose_function** *(NEW)*: It uses a voice-coil-driven weight to turn low-frequency audio into physical vibration you feel through your body, adding a tactile 'rumble' layer to home theater, gaming, and simulator setups without adding audible sound.
- **practical_application** *(NEW)*: A tech mounts the transducer solidly to the seat frame or platform and drives it from a dedicated amplifier fed a low-frequency (roughly 20-80 Hz) signal, often tapped from the LFE/subwoofer channel.
- **category** *(NEW)*: Home Theater
- **related_terms** *(NEW)*: Subwoofer; LFE Channel; Crossover; Amplifier; Network Streamer
- **common_mistakes** *(NEW)*: Treating a bass shaker as a replacement for a subwoofer rather than a tactile supplement to one.; Attaching it to a soft or flimsy surface that absorbs the vibration instead of a rigid seat frame.; Driving it full-range instead of feeding it only low frequencies, which wastes power and can overheat the unit.
- **scenario_contexts** *(NEW)*: Adding physical impact to explosions and engine rumble in a home theater seat.; Building a racing or flight simulator rig that transmits road and engine feel.; Enhancing a gaming chair so low-end effects are felt as well as heard.
- _sources: Wikipedia: Tactile transducer (voice-coil driven weight, amplifier-driven low-frequency operation); TheaterSeatStore / SeatUp: Bass Shakers for Home Theater (mounting, 25-50W amplification); Valencia Theater Seating: Beginner's Guide to Bass Shakers (LFE-derived tactile range)_

### Belt Drive
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A turntable where a stretchy rubber belt links the motor to the platter, so the motor's buzz doesn't reach the record.
- **purpose_function** *(NEW)*: The elastic belt mechanically decouples the motor from the platter, absorbing motor vibration and noise so it doesn't reach the stylus, which favors low-rumble, smooth playback in home hi-fi decks.
- **practical_application** *(NEW)*: A tech loops the belt around the motor pulley and platter sub-platter during assembly, and periodically replaces a stretched or slipping belt that causes slow speed or wow and flutter.
- **category** *(NEW)*: Turntables
- **related_terms** *(NEW)*: Direct Drive; Platter; Tonearm; Tracking Force; Anti-Skate
- **common_mistakes** *(NEW)*: Expecting DJ-style instant startup and high torque from a belt drive, which spins up slowly.; Ignoring a stretched or aged belt that causes speed drift, wow, and flutter.; Assuming belt drive is always sonically superior rather than a design trade-off against direct drive.
- **scenario_contexts** *(NEW)*: Choosing a home hi-fi turntable prioritizing low rumble and quiet playback.; Replacing a worn drive belt that has caused the platter to run slow.; Comparing turntable designs for a casual listening system versus DJ use.
- _sources: The Sound Organisation: Belt Drive and Direct Drive Turntables — Everything You Need To Know; House of Marley: Direct Drive vs Belt Drive Turntable; Audio Exchange: Direct-Drive vs Belt-Drive Turntables_

### Direct Drive
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A turntable where the platter sits right on the motor, giving instant start-up and strong grip — the kind DJs use.
- **purpose_function** *(NEW)*: Placing the platter directly on the motor shaft delivers high torque, near-instant start-up, and stable speed with no belt to stretch, which is why it is the standard for DJ and scratch use.
- **practical_application** *(NEW)*: A tech relies on its instant torque for cueing, back-cueing, and scratching, and can use its speed stability and quartz-lock pitch control for reliable playback and mixing.
- **category** *(NEW)*: Turntables
- **related_terms** *(NEW)*: Belt Drive; Platter; Tonearm; Tracking Force; Anti-Skate
- **common_mistakes** *(NEW)*: Assuming direct drive is only for DJs when it is also valued for speed accuracy in hi-fi.; Believing direct-drive motor vibration always ruins sound quality; modern designs isolate it well.; Forgetting that its high torque makes it suited to hand manipulation like scratching and back-cueing.
- **scenario_contexts** *(NEW)*: Selecting turntables for a DJ booth requiring instant start and scratching.; Choosing a deck where precise, stable speed and quick spin-up matter.; Comparing drive types when speed stability is prioritized over belt isolation.
- _sources: The Sound Organisation: Belt Drive and Direct Drive Turntables — Everything You Need To Know; House of Marley: Direct Drive vs Belt Drive Turntable; Audio Exchange: Direct-Drive vs Belt-Drive Turntables_

### MQA
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A proprietary streaming format that squeezes hi-res music into a smaller file and claims to restore studio quality, but its lossless claims were widely disputed.
- **purpose_function** *(NEW)*: Master Quality Authenticated, launched by Meridian in 2014, applies proprietary processing and lossy compression to 'fold' high-frequency data into a FLAC container for smaller hi-res streams, plus an authentication step meant to certify the master; critics showed the process is not truly lossless.
- **practical_application** *(NEW)*: A tech encounters MQA when a service or file needs an MQA-capable DAC or decoder to 'unfold' it, and should note that major support has been withdrawn — Tidal dropped MQA in favor of standard FLAC in 2024.
- **category** *(NEW)*: Digital Audio
- **related_terms** *(NEW)*: Network Streamer; FLAC; DAC; Sample Rate; Lossy Compression
- **common_mistakes** *(NEW)*: Believing MQA is fully lossless; independent testing found it introduces noise and artifacts.; Assuming MQA is an open standard rather than a proprietary, licensed format.; Expecting the full 'unfolded' resolution without MQA-compatible decoding hardware or software.
- **scenario_contexts** *(NEW)*: Encountering MQA-flagged tracks on a streaming service and needing a compatible decoder.; Evaluating a DAC's feature list and finding MQA rendering support.; Advising a listener on format choices as services migrate from MQA back to standard FLAC.
- _sources: Wikipedia: Master Quality Authenticated (Meridian 2014, lossy folding, authentication, Lenbrook acquisition); Digital Trends: What is MQA? The controversial digital audio format fully explained; TechHive: End of an era — Tidal to drop last remaining MQA tracks_

### Network Streamer
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A hi-fi box that pulls music off the internet or your home network and feeds it into your stereo.
- **purpose_function** *(NEW)*: It connects to the home network to access streaming services (Spotify, Tidal, Qobuz) and local libraries on a NAS via protocols like UPnP, Roon Ready, and AirPlay, delivering that audio to a hi-fi system through digital or analog outputs.
- **practical_application** *(NEW)*: A tech wires the streamer to the router (or Wi-Fi), points it at streaming accounts and NAS shares, and connects its output either to an outboard DAC/amplifier or, if it has a built-in DAC, straight to an amp or receiver.
- **category** *(NEW)*: Digital Streaming
- **related_terms** *(NEW)*: DAC; MQA; Amplifier; NAS; Bass Shaker (Tactile Transducer)
- **common_mistakes** *(NEW)*: Confusing a bare network streamer (transport) with a streaming DAC that has analog outputs built in.; Overlooking the need for a stable network connection to the router and NAS for reliable playback.; Assuming all streamers support the same services and protocols (Roon Ready, UPnP, Tidal Connect) without checking.
- **scenario_contexts** *(NEW)*: Adding streaming and NAS library playback to a traditional hi-fi system.; Feeding a high-quality outboard DAC from a dedicated network transport.; Building a multi-room setup with networked endpoints controlled from an app.
- _sources: What Hi-Fi?: Best music streamers — top network audio players tested; Upscale Audio: How to Set Up a Digital Audio System; NAD Electronics: CS1 Endpoint Network Streamer product documentation_

### Platter
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The heavy spinning plate on a turntable that the record sits on.
- **purpose_function** *(NEW)*: It supports and spins the record at a constant speed; its mass acts as a flywheel to smooth out speed variations, while a precise bearing keeps rotation stable and quiet.
- **practical_application** *(NEW)*: A tech checks that the platter spins true and level, often adds a mat between platter and record, and relies on its mass and bearing quality for consistent speed with low wow and flutter.
- **category** *(NEW)*: Turntables
- **related_terms** *(NEW)*: Belt Drive; Direct Drive; Tonearm; Tracking Force; Anti-Skate
- **common_mistakes** *(NEW)*: Assuming a heavier platter is always better regardless of the motor and bearing designed for it.; Placing a record directly on a bare platter when a mat is intended to protect it and manage resonance.; Ignoring a worn or dry platter bearing that adds rumble and speed instability.
- **scenario_contexts** *(NEW)*: Assembling a turntable and seating the platter on its bearing.; Diagnosing rumble or speed instability traced to the platter bearing.; Selecting or swapping a platter mat to tune resonance and grip.
- _sources: Elusive Disc: Turntable Setup Guide — Tracking Force, Anti-Skate & More; The Sound Organisation: Belt Drive and Direct Drive Turntables — Everything You Need To Know; Audio-Technica: Setting up the tonearm on a turntable_

### Tonearm
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The pivoting arm that holds the needle and lets it swing smoothly across the record.
- **purpose_function** *(NEW)*: It carries the cartridge and stylus across the record with controlled geometry, applying the correct tracking force while allowing free movement so the stylus can follow the groove accurately.
- **practical_application** *(NEW)*: A tech mounts and aligns the cartridge on the headshell, sets the counterweight for tracking force and the anti-skate, and checks arm height (VTA) so the stylus sits correctly in the groove.
- **category** *(NEW)*: Turntables
- **related_terms** *(NEW)*: Tracking Force; Anti-Skate; Platter; Belt Drive; Direct Drive
- **common_mistakes** *(NEW)*: Misaligning the cartridge in the headshell, causing tracking distortion across the record.; Setting the counterweight without zero-balancing the arm first, giving an inaccurate tracking force.; Neglecting arm height (VTA) and anti-skate, which affect tracking and channel balance.
- **scenario_contexts** *(NEW)*: Installing and aligning a new cartridge on a turntable.; Balancing the arm and dialing in tracking force and anti-skate during setup.; Adjusting tonearm height to correct tracking geometry for a taller or shorter cartridge.
- _sources: Audio-Technica: Setting up the tonearm on a turntable; Elusive Disc: Turntable Setup Guide — Tracking Force, Anti-Skate & More; Crutchfield: Troubleshooting turntable tonearm sway_

### Tracking Force
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: How hard the needle presses down into the record groove, set in grams.
- **purpose_function** *(NEW)*: It sets the downward stylus weight so the stylus stays properly seated in the groove; too little causes mistracking and skipping, too much increases groove and stylus wear, so it is set to the cartridge maker's specified value.
- **practical_application** *(NEW)*: A tech zero-balances the tonearm, then sets the counterweight (or uses a stylus gauge) to the cartridge's recommended figure, commonly around 1.5-2.5 g, verifying with a digital scale.
- **category** *(NEW)*: Turntables
- **related_terms** *(NEW)*: Anti-Skate; Tonearm; Platter; Belt Drive; Direct Drive
- **common_mistakes** *(NEW)*: Setting tracking force below the cartridge's spec, causing mistracking, chatter, and skips that can gouge the groove.; Setting it too high, which increases wear on both stylus and record.; Guessing the value instead of using the cartridge manufacturer's specified range and a stylus scale.
- **scenario_contexts** *(NEW)*: Setting downforce during cartridge installation using the counterweight and a stylus scale.; Diagnosing skipping or mistracking traced to insufficient tracking force.; Following a cartridge manufacturer's spec sheet to dial in the recommended weight.
- _sources: Sumiko: What is Tracking Force — What to Know Before Playing Records; Elusive Disc: Cartridge Brand Stylus Tracking Force Chart; Fluance: Why Tracking Force is Important for Turntables_


## AUDI201 — Corporate AV
*8 terms*

### Breakout Room
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A smaller side room where part of the conference audience goes for a focused session while the main event is happening elsewhere.
- **purpose_function** *(NEW)*: It hosts smaller, topic-specific sessions running in parallel with (or after) the general session, so attendees can split into targeted groups for training, workshops, and discussion. It exists because a single big room cannot serve many simultaneous specialized tracks.
- **practical_application** *(NEW)*: A tech deploys a scaled-down AV kit here, typically a projector or flat panel, a couple of wireless mics, small speakers, and a laptop input, and supports faster content changes and more live Q&A than the main stage.
- **category** *(NEW)*: Event Production
- **related_terms** *(NEW)*: General Session; Lectern; Push-To-Talk Microphone; Throwable Microphone; Speaker Timer
- **common_mistakes** *(NEW)*: Under-provisioning audio so a talky, Q&A-heavy room ends up without enough working microphones; Assuming breakout gear needs the same scale as the general session and over-ordering, or ignoring that rapid presenter/laptop swaps need reliable switching; Forgetting that multiple breakouts running at once can share wireless RF space and cause interference if frequencies are not coordinated
- **scenario_contexts** *(NEW)*: After a morning general session, attendees disperse into 8 concurrent breakout rooms for track-specific workshops; A corporate training day runs three parallel breakouts, each needing a laptop, screen, and a lav or handheld mic; A conference books breakout rooms for sponsor demos requiring quick source switching between presenter laptops
- _sources: Corporate Audio Visual Services — Conferences Part 2: Breakouts (corporate-av.com); ON Services — AV for Meetings, Breakouts, and Corporate Events (onservices.com)_

### General Session
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The big main-stage part of a conference where everyone gathers at once, and the room with the most demanding audiovisual setup.
- **purpose_function** *(NEW)*: It is the plenary gathering that assembles the entire audience for keynotes, main presentations, and high-visibility content, which is why it carries the largest and highest-stakes AV production of the event. It exists to deliver the shared, marquee moments that set the tone for the whole program.
- **practical_application** *(NEW)*: A tech supports it with a large stage, LED wall or large-format projection, multiple microphones, confidence monitors, live cameras, playback, and lighting, and treats redundancy and cueing as critical because a failure here is the most visible.
- **category** *(NEW)*: Event Production
- **related_terms** *(NEW)*: Breakout Room; Green Room; Lectern; Speaker Timer; Throwable Microphone
- **common_mistakes** *(NEW)*: Running the main stage without backup for critical signal paths, so a single failure interrupts the highest-profile room; Neglecting confidence monitors and speaker timing, leaving presenters unable to see their slides or remaining time; Underestimating the RF and cabling coordination needed for many mics, cameras, and playback sources on one stage
- **scenario_contexts** *(NEW)*: A conference opens with a keynote in the general session for all 1,500 attendees before splitting into breakouts; A product launch stages a large general session with LED wall, live cameras, and IMAG for the audience; An annual company meeting holds its awards presentation in the general session room
- _sources: Corporate Optics — General Session & Breakout AV Support blog (corporateoptics.com); T. Allen — Live Event Production: Conferences and General Sessions (tallen-inc.com)_

### Green Room
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A backstage lounge where speakers and talent wait, get their microphones fitted, and receive last-minute briefing before going on stage.
- **purpose_function** *(NEW)*: It provides an offstage holding and preparation space so presenters can relax, get mic'd, review notes, and be cued without interfering with the live show. It exists to keep talent organized, camera-ready, and on schedule.
- **practical_application** *(NEW)*: A tech often fits and checks a presenter's wireless mic here, runs a quick mic-technique briefing, and uses a video monitor and intercom so the green room can watch the program feed and receive stage calls.
- **category** *(NEW)*: Event Production
- **related_terms** *(NEW)*: General Session; Lectern; Push-To-Talk Microphone; Speaker Timer; Breakout Room
- **common_mistakes** *(NEW)*: Fitting and powering a wireless mic in the green room but forgetting to mute or check it, so private conversations are broadcast when the transmitter is live; Not providing a program monitor or intercom, leaving talent unaware of timing and stage calls; Assuming the green room needs no AV, then scrambling when a presenter needs to preview slides or rehearse
- **scenario_contexts** *(NEW)*: A keynote speaker waits in the green room where a tech fits and tests their lav mic before stage call; Panelists gather in the green room to watch the program feed on a monitor while awaiting their cue; A last-minute running-order change is relayed to talent in the green room via intercom
- _sources: LASSO/Shoflo — What Is a Green Room (shoflo.tv); Daysheets — Green Room glossary (daysheets.com)_

### Lectern
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The slanted stand a speaker stands behind to hold their notes, usually fitted with a microphone and a small light. People often call it a podium, but a podium is really the platform you stand on.
- **purpose_function** *(NEW)*: It supports a speaker's notes, script, or laptop at a comfortable reading height and typically houses the presenter's microphone, task light, and cable management. It exists to give a fixed, equipped speaking position at the front of the room.
- **practical_application** *(NEW)*: A tech mounts and tests the gooseneck or podium mic, dresses the cabling, and may add a monitor lift or confidence display, and selects an ADA height-adjustable model when accessibility is required.
- **category** *(NEW)*: Event Production
- **related_terms** *(NEW)*: General Session; Push-To-Talk Microphone; Speaker Timer; Green Room; Breakout Room
- **common_mistakes** *(NEW)*: Calling it a podium when ordering gear, which can cause the wrong item to be delivered or set up; Positioning a fixed lectern mic too far from the speaker's mouth, producing weak or inconsistent level; Ignoring ADA height requirements so shorter speakers or wheelchair users cannot use it comfortably
- **scenario_contexts** *(NEW)*: A conference lectern is fitted with a gooseneck mic and reading light for a series of speakers; A press briefing attaches an adjustable mic to the front of the lectern for the spokesperson; An accessible event orders a height-adjustable lectern to meet ADA needs
- _sources: AVFI — Podiums vs. Lecterns: When to Use Them (avfi.com); Grammarly — Podium vs. Lectern (grammarly.com)_

### Mult Box
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A distribution box that takes one clean program audio feed and splits it into many identical outputs so lots of reporters, cameras, and recorders can each get the same sound.
- **purpose_function** *(NEW)*: It takes a single official program feed and creates multiple isolated outputs so many media outlets can capture the same clean audio without crowding the stage with individual mics. It exists to provide one authoritative, interference-free press feed to a large media pool.
- **practical_application** *(NEW)*: A tech feeds the console's program output into the mult box and lets each journalist patch into an isolated XLR output, using the isolation to prevent one device from loading down or injecting noise into the others.
- **category** *(NEW)*: Event Production
- **related_terms** *(NEW)*: Push-To-Talk Microphone; Lectern; General Session; Green Room
- **common_mistakes** *(NEW)*: Confusing a passive mult with a truly isolated distro, so connecting many devices causes level loss, hum, or crosstalk; Sending the wrong level (line vs. mic) to press outputs and overloading or under-driving their recorders; UNSAFE: creating a ground loop or hum path between press devices by not using the box's transformer isolation, and attempting to 'fix' it by lifting a safety ground on mains-powered gear
- **scenario_contexts** *(NEW)*: A press conference feeds a mult box so dozens of reporters each get an isolated recording of the podium mic; A sports post-game interview room provides press outputs via a mult box; A corporate announcement offers a broadcast pool feed through a mult box to camera crews
- _sources: Wikipedia — Mult box (en.wikipedia.org/wiki/Mult_box); AudioPressBox — Mult box and Microphone Splitter (audiopressbox.com)_

### Push-To-Talk Microphone
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A microphone that is only live while you hold down its talk button, so it stays off until someone actually wants to speak. It is standard on panel and delegate desks.
- **purpose_function** *(NEW)*: It uses a momentary talk switch so a mic is open only while pressed, which reduces overlapping speech, open-mic noise, and feedback in multi-participant discussions. It exists to give structured, one-at-a-time speaking in panels, boardrooms, and delegate systems.
- **practical_application** *(NEW)*: A tech deploys these on panel or delegate desks, often with a chairperson unit that limits how many mics can be open at once, so only active speakers are live and the room stays clean.
- **category** *(NEW)*: Event Production
- **related_terms** *(NEW)*: Lectern; Mult Box; Throwable Microphone; General Session; Breakout Room
- **common_mistakes** *(NEW)*: Assuming the mic latches on, so a speaker releases the button mid-sentence and is not heard; Leaving too many delegate mics open at once, inviting feedback and muddiness instead of using the chairperson limit; Forgetting that PTT is half-duplex/one-at-a-time and expecting simultaneous cross-talk to be captured cleanly
- **scenario_contexts** *(NEW)*: A boardroom fits each seat with a push-to-talk delegate mic so members speak in turn; A panel discussion uses PTT desk mics with a chairperson unit capping open mics; A city-council or government hearing runs a delegate discussion system with press-to-talk units
- _sources: Wikipedia — Push-to-talk (en.wikipedia.org/wiki/Push-to-talk); Conference Rental — Switch to Push-to-Talk Conference Microphones (conferencerental.com)_

### Speaker Timer
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A countdown display that shows presenters how much time they have left, usually using traffic-light colors: green means you are fine, yellow means wrap up, red means stop.
- **purpose_function** *(NEW)*: It shows presenters their remaining time, commonly with green/yellow/red traffic-light warnings, so sessions stay on schedule. It exists to keep speakers on time without a stagehand having to interrupt them.
- **practical_application** *(NEW)*: A tech places it as a wedge confidence monitor on the stage floor, on the lectern, or at the back of the room, programs the segment length and warning points, and confirms the speaker can see the color change without turning away from the audience.
- **category** *(NEW)*: Event Production
- **related_terms** *(NEW)*: Lectern; General Session; Green Room; Breakout Room; Push-To-Talk Microphone
- **common_mistakes** *(NEW)*: Placing the display where the speaker cannot see it, or making it visible to the audience when it should be private; Not briefing the presenter on what the colors mean, so the red warning is ignored; Setting the wrong segment length or warning thresholds and cutting a speaker off early or late
- **scenario_contexts** *(NEW)*: A conference puts a wedge speaker timer on the stage floor so keynote presenters can glance at remaining time; A panel session sets short segment timers to keep each speaker on schedule; A city-council meeting uses a public-facing red-yellow-green timer to limit each commenter's speaking time
- _sources: Stagetimer — Conference and Speaker Timer use case (stagetimer.io); TimeMachines Inc. — Presentation and Meeting Timers (timemachinescorp.com)_

### Throwable Microphone
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A soft foam cube or ball with a wireless mic inside that you can toss to audience members so they can ask questions without a runner carrying a mic around.
- **purpose_function** *(NEW)*: It is a soft, lightweight wireless mic in a padded cube or ball that can be safely tossed between audience members, making Q&A faster and less intimidating. It exists to speed up audience participation without a staffer running a handheld mic to each person.
- **practical_application** *(NEW)*: A tech drops the wireless transmitter into the padded cover and manages it like any wireless channel, relying on its auto-mute (which cuts the mic while it is thrown, caught, or dropped) to avoid thumps and handling noise.
- **category** *(NEW)*: Event Production
- **related_terms** *(NEW)*: Push-To-Talk Microphone; General Session; Breakout Room; Lectern; Speaker Timer
- **common_mistakes** *(NEW)*: Treating it as unbreakable and ignoring RF coordination, so it drops out like any other wireless mic when frequencies are not managed; Assuming it stays live in the air and expecting clean audio during the throw, instead of relying on its auto-mute; Forgetting battery management for a full event when the unit is passed around continuously
- **scenario_contexts** *(NEW)*: A large general session tosses a throwable mic into the audience for open Q&A; A workshop uses a soft cube mic so attendees can pass questions quickly without a mic runner; A town-hall-style corporate meeting throws the mic to employees asking questions from the floor
- _sources: Catchbox — Cube Throwable Mic product page (catchbox.com); Catchbox Knowledge Base — What is the Cube Audience Mic (help.catchbox.com)_


## AUDI201 — Digital Live Sound
*5 terms*

### Digital Snake
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Instead of a thick, heavy cable with dozens of separate wires, one thin network cable carries all the stage's audio to the mixer as digital data.
- **purpose_function** *(NEW)*: It replaces bulky multicore analog copper with a lightweight Cat5e/Cat6 or fiber link so many channels of audio can travel long distances with less weight, less signal loss, and less setup labor. It exists to move high channel counts between stage and mix position efficiently and reliably.
- **practical_application** *(NEW)*: A tech plugs mics and DIs into a stage rack on stage, runs a single Ethernet or fiber line to the console at front of house, and gets all inputs and returns without pulling a heavy analog snake.
- **category** *(NEW)*: Digital Console Systems
- **related_terms** *(NEW)*: Stagebox; Dante; MADI; Remote Head Amp; Expansion Card; Digital Console
- **common_mistakes** *(NEW)*: Assuming any Ethernet cable works: unshielded or damaged patch cables and non-locking connectors cause dropouts, so use shielded, ruggedized locking (etherCON) cable rated for the network in use; Confusing the audio transport (Dante, AVB, MADI) with the physical cable, and assuming snakes from different systems interoperate; Forgetting the copper distance limit (about 100 m per Ethernet hop) and needing fiber or a switch for longer runs; Running a single cable with no backup and having no redundant path for a critical show
- **scenario_contexts** *(NEW)*: Touring band setup where a fiber or Cat line replaces a 150-foot analog multicore between stage and FOH; A house of worship permanently installing a stage rack feeding a Dante network to the booth; Festival changeovers where two consoles share one stage rack over the same digital link; Corporate AV event where a lightweight snake speeds load-in and reduces cable weight
- _sources: Audinate/Harman, Dante Digital Snake Application Guide; Sound on Sound, 'Can I send mic signals over Cat5 cable for live sound?'; Front of House Magazine, Cat5 Digital Snake Stage Boxes buyers guide_

### Expansion Card
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A plug-in card that slots into the back of a digital mixer to give it extra ways to send and receive audio, like adding a new port to a computer.
- **purpose_function** *(NEW)*: It lets one console support different audio networking and I/O formats (Dante, MADI, Waves SoundGrid, analog, and others) by populating a manufacturer option slot, so the same desk can adapt to different venues and systems without being replaced.
- **practical_application** *(NEW)*: A tech fits a Dante or MADI card into the console's option slot to connect it to a stage rack, a broadcast truck, or a recording rig, then patches the added channels in the console's routing.
- **category** *(NEW)*: Digital Console Systems
- **related_terms** *(NEW)*: Digital Console; Dante; MADI; Digital Snake; Remote Head Amp; Offline Editor
- **common_mistakes** *(NEW)*: Buying a card in the wrong physical or electrical format for the console's slot (for example a DiGiCo DMI card versus a Yamaha mini-YGDAI card are not interchangeable); Assuming the card automatically routes audio: channels still have to be patched and, for networked cards, configured in the network controller software; Overlooking sample-rate and channel-count limits (many cards do 64x64 at 48 kHz but half that or different behavior at 96 kHz); Hot-swapping a card with the console powered when the manufacturer requires power-down, risking damage
- **scenario_contexts** *(NEW)*: Adding a Dante card so a console can join a venue's existing audio network; Fitting a MADI card to feed a multitrack recorder or broadcast split; Installing a Waves SoundGrid card to run plugin processing on the live desk; Upgrading a rental console's connectivity to match a client's stage rack format
- _sources: DiGiCo, DMI Cards product documentation (digico.biz); ProSoundWeb, 'Recent Digital Console Interconnect & Routing Options'; DiGiCo SD12 console documentation (dual DMI slot specification)_

### Gain Compensation
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: When two mixers share the same stage preamps, this feature automatically undoes level jumps on your desk when the other engineer changes the shared gain, so your mix stays put.
- **purpose_function** *(NEW)*: It exists to solve the shared-preamp problem in a FOH/monitor split: when one console owns the analog preamp gain, the other desk's channel level would shift every time that gain moves, so gain compensation applies an equal, opposite digital trim to hold the receiving console's level constant.
- **practical_application** *(NEW)*: On a split show, the monitor engineer sets analog preamp gain on the stage rack while the FOH engineer enables gain compensation (also called gain tracking) so FOH levels do not jump when monitors adjust a preamp mid-set.
- **category** *(NEW)*: Digital Console Systems
- **related_terms** *(NEW)*: Remote Head Amp; Digital Snake; Stagebox; Trim; Gain Structure; Digital Console
- **common_mistakes** *(NEW)*: Confusing analog preamp gain with the digital trim that compensation adjusts: only one console truly controls the head amp, the other is trimming after conversion; Assuming both consoles keep full independent analog gain control; on many systems only the preamp owner has real gain and the other relies on trim/compensation; Turning compensation on but pushing the analog preamp so hard it clips the converter, which no digital trim can undo; Enabling it and then wondering why nudging the preamp no longer changes level on the compensated desk
- **scenario_contexts** *(NEW)*: FOH and monitor consoles sharing one stage rack where monitors own the preamps; A guest engineer's console taking a digital split without disturbing the house desk's levels; Broadcast plus PA split where the broadcast mixer must stay unaffected by stage gain changes; Two linked consoles of the same brand set so one controls gain and the other tracks it
- _sources: Front of House Magazine, 'Gain Sharing and Gain Compensation, Explained'; DiGiCo SD-series gain tracking documentation; Allen & Heath Digital Community, monitor/FOH split gain compensation guidance_

### Offline Editor
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Free software from the console maker that runs on a laptop so you can build and tweak your whole show file at home, without the actual mixer in front of you.
- **purpose_function** *(NEW)*: It lets an engineer prepare a show file (channel names, patching, buses, DCAs, mutes, EQ, colors, and processing) away from the desk, so setup time on site is shorter and the console is ready to load the file at soundcheck.
- **practical_application** *(NEW)*: A tech builds the session on a plane or at home in the manufacturer editor, saves the show file to a USB stick or transfers it over the network, then loads it into the console when they arrive to fine-tune during soundcheck.
- **category** *(NEW)*: Digital Console Systems
- **related_terms** *(NEW)*: Show File; Scene; Digital Console; Virtual Soundcheck; Expansion Card; DCA
- **common_mistakes** *(NEW)*: Building a file in an editor version that does not match the console's firmware, so the show file will not load or loads with errors; Assuming everything transfers: some hardware-dependent or I/O-specific settings still need setting or confirming on the desk; Forgetting to verify actual input patch and physical I/O once on site, trusting the offline layout blindly; Not backing up the show file before editing and losing prior work
- **scenario_contexts** *(NEW)*: Prepping channel names, patch, and DCAs for a festival before load-in; A touring engineer editing tomorrow's file on the tour bus; Checking and cleaning a guest engineer's show file before it hits the house console; Teaching or rehearsing console layout on a laptop without hardware access
- _sources: Front of House Magazine, 'Taking Advantage of Offline Console Editors'; DiGiCo, SD Offline Software documentation (support.digico.biz); Allen & Heath, dLive Director offline editor documentation_

### Remote Head Amp
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The mic preamp lives in the stage box out on stage, but you turn its gain up and down from the mixing console far away, as if it were right in front of you.
- **purpose_function** *(NEW)*: It exists so that in a digital system the preamp and A/D conversion can sit close to the source on stage (avoiding long analog runs and their noise and loading) while the engineer still adjusts gain, phantom power, and pad from the mix position over the control network.
- **practical_application** *(NEW)*: A tech sets and rides input gain, +48V phantom, and highpass from the console surface, and the commands travel down the digital link to the stage rack preamp, often adjustable in 1 dB steps.
- **category** *(NEW)*: Digital Console Systems
- **related_terms** *(NEW)*: Stagebox; Digital Snake; Gain Compensation; Phantom Power; Preamp; Digital Console
- **common_mistakes** *(NEW)*: Not realizing that in a shared split only one console controls the actual head amp; changing it affects every desk fed by that preamp; Toggling phantom power remotely on a live channel and popping the PA or damaging a ribbon mic that cannot take +48V; Assuming remote gain is digital trim: it moves the real analog preamp, so overdriving it clips the converter for everyone; Losing track of which console owns the preamp on a FOH/monitor split and fighting over gain
- **scenario_contexts** *(NEW)*: FOH engineer setting stage-rack input gain from the console 150 feet away; Monitor engineer owning preamp control on a split while FOH uses trim; Recording a live show where preamp settings on the stage rack are recalled with the show file; Adjusting phantom power for condenser mics remotely during line check
- _sources: Yamaha AD8HR Head Amp Remote-Control documentation; ProSoundWeb, 'Real World Gear: Remote Control Microphone Preamps'; Mix Magazine, 'Remote Microphone Preamps'_


## AUDI201 — Distributed Audio Systems  ⚠️ SAFETY-CRITICAL
*4 terms*

### AVB (Audio Video Bridging)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: AVB is a set of Ethernet rules that reserve a guaranteed 'lane' and share a common clock so audio arrives on time without dropouts, unlike ordinary best-effort network traffic.
- **purpose_function** *(NEW)*: It exists to give professional audio and video streams deterministic, low-latency, time-synchronized delivery over standard Ethernet by reserving bandwidth end-to-end and tightly synchronizing device clocks, so media plays glitch-free even when the network carries other traffic.
- **practical_application** *(NEW)*: A tech patches AVB-capable endpoints (consoles, amplifiers, stage boxes) through AVB/TSN-capable switches and verifies that stream reservations are established and gPTP clock sync is locked before relying on the link for a show.
- **category** *(NEW)*: Audio Networking
- **related_terms** *(NEW)*: Milan; Dante; AES67; PTP (Precision Time Protocol); TSN (Time-Sensitive Networking); RTP (Real-time Transport Protocol)
- **common_mistakes** *(NEW)*: Assuming any Ethernet switch works: AVB requires AVB/TSN-capable switches supporting gPTP (802.1AS), stream reservation (SRP/MSRP, 802.1Qat), and credit-based shaping (802.1Qav); Confusing AVB with Dante or AES67; they are distinct transport technologies with different discovery, clocking, and switch requirements; Forgetting that an AVB stream will not start until bandwidth reservation succeeds along the entire path; Overlooking that gPTP clock synchronization must be established and stable for glitch-free audio
- **scenario_contexts** *(NEW)*: A theater installs Biamp Tesira processors and Lab.gruppen amplifiers on an AVB backbone for zoned distributed audio; A live-sound rig uses AVB-capable switches to carry redundant multichannel audio between stage and front-of-house; An AV integrator specifies AVB/TSN switches so audio streams receive guaranteed bandwidth alongside control and video data
- _sources: IEEE SA 802.1BA / 802.1AS / 802.1Qav / 802.1Qat standards (standards.ieee.org); Avnu Alliance FAQ and technical resources (avnu.org); Aruba/HPE AOS-CX AVB technical documentation (arubanetworking.hpe.com); Cisco Audio Video Bridging for AVoIP white paper (cisco.com)_

### Milan
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Milan is a certification layer on top of AVB that guarantees gear from different brands connects and works together reliably, like a stricter shared rulebook so everyone's equipment speaks the same dialect.
- **purpose_function** *(NEW)*: It exists to remove interoperability guesswork from AVB by adding mandatory agreements on media formats, media clocking, redundancy, and device control (AVDECC), all enforced through certification testing, so certified devices from different manufacturers are effectively plug-and-play.
- **practical_application** *(NEW)*: A tech building a multi-brand pro-audio network selects Milan-certified devices so consoles, processors, and amplifiers interoperate with predictable user-set latency and seamless network redundancy.
- **category** *(NEW)*: Audio Networking
- **related_terms** *(NEW)*: AVB (Audio Video Bridging); TSN (Time-Sensitive Networking); Dante; AES67; PTP (Precision Time Protocol); RTP (Real-time Transport Protocol)
- **common_mistakes** *(NEW)*: Thinking Milan is a separate network from AVB; it is a certified profile built on top of AVB/TSN open standards; Assuming all AVB devices are automatically Milan-compatible; only certified devices carry the interoperability guarantee; Expecting Milan to interoperate directly with Dante without a bridge or gateway; Ignoring the configurable presentation-time offset (0.25 ms to 2 ms) that sets and guarantees stream latency
- **scenario_contexts** *(NEW)*: A touring PA system uses Milan-certified amplifiers and consoles for guaranteed latency and redundant network paths; A stadium installs Milan devices from multiple vendors (e.g., d&b, Meyer Sound, L-Acoustics) to ensure cross-brand interoperability; A live show relies on Milan seamless redundancy so a single cable or switch failure does not drop audio
- _sources: Avnu Alliance Milan Baseline Interoperability Specification 2.0a and Milan white paper (avnu.org); Meyer Sound Milan technical overview (meyersound.com); d&b audiotechnik Milan / signal distribution documentation (dbaudio.com); Sound & Communications, 'An Introduction to Milan' (soundandcommunications.com)_

### Ravenna
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Ravenna is a way to send many channels of studio-quality audio over ordinary IP networks with very low delay, widely used in broadcast; it works with the AES67 standard so it can talk to other audio-over-IP gear.
- **purpose_function** *(NEW)*: It exists to move high-channel-count, low-latency, sample-accurate audio across standard IP infrastructure (LAN and WAN) for broadcast and installation use, relying on PTP for synchronization and standard IP protocols (RTP, SDP, RTSP) to remain open and AES67-interoperable.
- **practical_application** *(NEW)*: A broadcast engineer uses Ravenna to link consoles, stage boxes, and studios (e.g., Lawo, Merging, DirectOut), managing stream connections via SDP/RTSP and locking all devices to a common PTP grandmaster.
- **category** *(NEW)*: Audio Networking
- **related_terms** *(NEW)*: AES67; RTP (Real-time Transport Protocol); Dante; PTP (Precision Time Protocol); AVB (Audio Video Bridging); SMPTE ST 2110
- **common_mistakes** *(NEW)*: Assuming Ravenna and AES67 are identical; Ravenna is a full ecosystem that is AES67-compatible, whereas AES67 is an interoperability profile/subset; Forgetting that a correctly configured PTP (IEEE 1588) grandmaster is required for synchronization; Expecting plug-and-play with Dante; bridging requires correct AES67 setup and manual SDP handling; Neglecting network QoS/DiffServ and IGMP multicast configuration, which causes dropouts and flooding
- **scenario_contexts** *(NEW)*: A broadcast facility distributes audio between studios and OB vans over a Ravenna/AES67 IP backbone; An outside-broadcast truck carries multichannel audio on Ravenna synchronized by PTP; A radio station integrates Lawo consoles and Merging interfaces via Ravenna for all-IP audio routing
- _sources: Ravenna (networking) overview and ALC NetworX/Lawo documentation (ravenna-network.com); AES67 standard, Audio Engineering Society (published Sept 2013); The Broadcast Bridge, 'Your Practical Guide to AES67' (thebroadcastbridge.com); Merging Technologies 'Configure Merging and AES67 Devices' (merging.com)_

### RTP (Real-time Transport Protocol)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: RTP is the packet format that actually carries the audio (or video) across an IP network, adding timestamps and sequence numbers so the receiver can reassemble the samples in the right order and play them on time.
- **purpose_function** *(NEW)*: It exists to provide end-to-end real-time media delivery over IP by adding payload-type identification, sequence numbering, and timestamps on top of UDP, letting receivers detect lost or out-of-order packets and reconstruct correct playout timing; it is the transport layer underneath AES67, Ravenna, and most audio-over-IP.
- **practical_application** *(NEW)*: A tech rarely configures RTP directly but relies on it inside AoIP systems; when troubleshooting, they inspect RTP streams for packet loss, sequence-number gaps, or timestamp/jitter problems to diagnose audio dropouts.
- **category** *(NEW)*: Audio Networking
- **related_terms** *(NEW)*: AES67; Ravenna; PTP (Precision Time Protocol); RTP Control Protocol (RTCP); AVB (Audio Video Bridging); Dante
- **common_mistakes** *(NEW)*: Treating RTP as a reliable protocol; it runs over UDP and does not guarantee delivery, and lost packets are generally not retransmitted; Overlooking RTCP, the companion control protocol used to monitor stream quality and timing; Assuming RTP alone provides synchronization; accurate playout in AoIP depends on PTP-referenced timestamps; Configuring an undersized jitter buffer, causing audible dropouts on networks with timing variation
- **scenario_contexts** *(NEW)*: An engineer uses a packet analyzer to spot RTP sequence-number gaps while diagnosing dropouts on an AES67 link; An AoIP stream carries L24 PCM audio as RTP payload over multicast UDP; A studio's Ravenna/AES67 devices exchange audio as RTP streams synchronized to a common PTP clock
- _sources: IETF RFC 3550 (RTP) and RFC 3551 (RTP A/V Profile), rfc-editor.org / datatracker.ietf.org; AES67 standard, Audio Engineering Society (uses RTP over UDP/IP); AIMS Alliance 'AES67-101: the basics of AES67' (aimsalliance.org); Real-time Transport Protocol reference overview (en.wikipedia.org / RFC citations)_


## AUDI201 — Loudspeaker System Deployment  ⚠️ SAFETY-CRITICAL
*10 terms*

### Array Bumper
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The load-rated metal frame that hangs at the very top of a flown speaker stack; the cabinets bolt onto it and it is the part the hoist actually lifts.
- **purpose_function** *(NEW)*: Provides a single rated structural interface between the loudspeaker cabinets and the hoist/rigging points, letting a whole array hang from one or two pick points while its pick-point selection sets the array's overall trim angle.
- **practical_application** *(NEW)*: A tech attaches the bumper (fly bar/grid) to the top cabinet, connects the chain hoist to a rated pick-point hole, and chooses that hole to dial in the array's up/down aiming angle before lifting.
- **category** *(NEW)*: Rigging Hardware
- **related_terms** *(NEW)*: Chain Hoist; Shackle; Splay Angle; Inclinometer; Round Sling; Bridle
- **common_mistakes** *(NEW)*: UNSAFE: Flying more cabinets or a longer array than the bumper's manufacturer-rated capacity and approved configuration allow.; UNSAFE: Rigging from a hole or point not designated as load-rated, or mixing bumpers and cabinets from different series/manufacturers.; Forgetting that changing the pick point changes the array's overall aiming angle, not just its front/back balance.; Skipping the manufacturer's safety pins/capture hardware between the bumper and the top cabinet.
- **scenario_contexts** *(NEW)*: Flying a line array from a single motor at an arena, suspended from the bumper's pick points.; Setting front array angle by selecting the correct pick-point hole on the bumper before the lift.; Ground-stacking where the bumper serves as the top frame and handling point of the stacked array.
- _sources: ANSI/ESTA E1.6 series (Entertainment Technology - Powered Hoist / Rigging); Adaptive Technologies Group loudspeaker rigging documentation; Polar Focus line array rigging documentation; ProSoundWeb - Center of Gravity in Line Array Design & Deployment_

### Bridle
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A two-legged sling arrangement that creates a hang point out in the open space between two beams instead of directly under one.
- **purpose_function** *(NEW)*: Positions a load's pick point where no structural steel exists directly overhead by splitting the load between two beams, so a motor or array can hang exactly where the design requires.
- **practical_application** *(NEW)*: A rigger calculates the two leg lengths and the resulting leg tensions with trigonometry, connects each leg to a rated beam point, and joins them at an apex shackle that carries the hoist.
- **category** *(NEW)*: Rigging Hardware
- **related_terms** *(NEW)*: Shackle; Round Sling; Chain Hoist; Array Bumper
- **common_mistakes** *(NEW)*: UNSAFE: Letting the included angle at the apex grow toward or past 90-120 degrees, which multiplies each leg's tension far above the shared load and can overload slings and truss chords.; UNSAFE: Guessing leg lengths and tensions instead of calculating them, or exceeding a beam point's or sling's WLL because sling-angle load multipliers were ignored.; Forgetting that a wider apex angle raises the tension in each leg for the same suspended load.; UNSAFE: Attaching bridle legs to non-structural or unverified points.
- **scenario_contexts** *(NEW)*: Hanging a line array motor between two roof beams where no steel sits directly above the desired array position.; Bridling across two grid beams in a theatre to land a pick point over an offstage location.; Adjusting bridle leg lengths to move an apex point horizontally without relocating the beams.
- _sources: ASME B30.9 - Slings (sling angle / load factor); OSHA 29 CFR 1926.251 (rigging equipment for material handling); ESTA/PLASA entertainment rigging practice (bridle apex angle limits); Entertainment rigging reference (bridle leg tension and trigonometry)_

### Chain Hoist
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An electric motor that hauls a chain to lift and then hold heavy loads like speaker arrays and trusses up in the air.
- **purpose_function** *(NEW)*: Provides controlled powered lifting and static holding of overhead loads so arrays and trusses can be raised to trim height and held there for the duration of an event.
- **practical_application** *(NEW)*: A tech rigs the hoist to a rated overhead point, connects the load's rigging to the hoist hook, and raises the array to trim, choosing a duty class (e.g., D8, D8+, C1) appropriate to whether people will be beneath the load.
- **category** *(NEW)*: Rigging Hardware
- **related_terms** *(NEW)*: Array Bumper; Shackle; Round Sling; Bridle
- **common_mistakes** *(NEW)*: UNSAFE: Holding a load over people with a standard D8 hoist and no independent secondary safety; only D8+ (static hold over people) or C1 (moving over people) rated systems are built for loads above personnel.; UNSAFE: Exceeding the hoist's rated capacity, or side-/angle-loading the chain instead of a straight vertical pull.; UNSAFE: Treating the hoist as a structural member without verifying the attachment point and full load path are rated.; Neglecting pre-use inspection of the load chain, hook latch, and limit switches.
- **scenario_contexts** *(NEW)*: Flying a line array to trim height in an arena.; Raising a PA or lighting truss with several synchronized motors.; Statically holding an array over an audience using a D8+ rated motor with the correct duty class.
- _sources: ANSI/ESTA E1.6-2 - Design, Inspection, and Maintenance of Electric Chain Hoists for the Entertainment Industry; ANSI E1.6-1 - Powered Hoist Systems (Sapsis Rigging archive); Columbus McKinnon / CM entertainment hoist documentation and SQP2:2018; GIS AG entertainment electric chain hoist D8/D8+/C1 documentation_

### Front Fill
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Small speakers spread along the front edge of the stage to cover the first few rows that the big main speakers are aimed over.
- **purpose_function** *(NEW)*: Covers the near-stage seats the mains miss and restores sound localization to the stage/performer for the closest listeners.
- **practical_application** *(NEW)*: A tech spaces low-profile cabinets along the stage lip and time-aligns (delays) them slightly late so the audience still localizes to the stage rather than to the fill boxes.
- **category** *(NEW)*: Coverage & Fills
- **related_terms** *(NEW)*: Side Fill; Splay Angle; Prediction Software
- **common_mistakes** *(NEW)*: Not delaying front fills to the mains/stage, so nearby listeners localize sound to the fill boxes instead of the performers.; Mounting fills so low that their vertical coverage dies after only a row or two.; Running fills too loud, drawing attention to the stage lip and unbalancing the mix for close seats.; Assuming the mains already cover the front rows when they are actually aimed over them.
- **scenario_contexts** *(NEW)*: Covering the first two or three rows in a theatre where the flown mains begin their coverage several rows back.; Restoring stage/center localization for pit seats directly in front of the stage.; Adding low-profile lip fills so front-row patrons are not left in a coverage hole.
- _sources: Yamaha Sound Reinforcement Handbook (Davis & Jones); ProSoundWeb - Filling The Gap: Approaches & Variables With Front Fills; Front of House Magazine - Using Front-Fill and Delay Speakers; McCarthy, Sound Systems: Design and Optimization_

### Inclinometer
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A tool, often with a built-in laser, that measures an angle so you can check a flown array is hanging at exactly the tilt the design called for.
- **purpose_function** *(NEW)*: Verifies the array frame's actual site/trim angle against the modeled prediction so the real-world hang matches the intended coverage.
- **practical_application** *(NEW)*: After flying the array, a tech reads the inclinometer mounted on the bumper or top cabinet (and its laser aim point) and compares it to the target angle from the prediction software.
- **category** *(NEW)*: Alignment Tools
- **related_terms** *(NEW)*: Array Bumper; Splay Angle; Prediction Software; Chain Hoist
- **common_mistakes** *(NEW)*: Assuming the array is aimed correctly without measuring, so the real hang differs from the modeled angle.; Referencing the device to the wrong surface, giving a reading that does not represent the array's actual acoustic aim.; Not accounting for any offset between the frame/mounting angle and the true box aiming angle.; Ignoring where the laser aim point lands relative to the intended top-of-coverage target.
- **scenario_contexts** *(NEW)*: Confirming a flown array's top-box angle matches the ArrayCalc/Soundvision model before doors.; Using the laser to check where the top of the array is pointed relative to the last row.; Documenting hang angles for a repeatable install or touring rig.
- _sources: Wikipedia - Line array (inclinometer on top frame, laser aiming point); TEQSAS LAP-TEQ PLUS inclinometer product documentation; L-Acoustics laser/inclinometer mount documentation (K1-LASERMOUNT); ProSoundWeb - Field Testing The Alignarray Laser Inclinometer Platform_

### Prediction Software
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Manufacturer computer programs that simulate how loud and how evenly a speaker array will cover a venue before it is ever hung.
- **purpose_function** *(NEW)*: Lets designers model array geometry, splay angles, and SPL coverage in a virtual venue so problems are solved on the computer rather than on site.
- **practical_application** *(NEW)*: A system tech builds the venue and array in the software, sets element count and splay angles, checks the SPL/coverage maps, and exports the resulting angles and settings to program the physical rig.
- **category** *(NEW)*: System Design Tools
- **related_terms** *(NEW)*: Splay Angle; Inclinometer; Array Bumper; Front Fill
- **common_mistakes** *(NEW)*: Treating the prediction as exact reality and skipping on-site measurement, ignoring the room reflections and acoustics the model simplifies.; Entering wrong venue dimensions, rigging height, or audience-plane data, producing a confident but useless prediction.; Failing to transfer the software's calculated splay angles accurately to the physical array.; Using generic settings instead of the specific cabinet model and its directivity data.
- **scenario_contexts** *(NEW)*: Modeling coverage and required box count for a festival mains hang before load-in.; Comparing SPL maps of different splay schemes to even out front-to-back level.; Exporting inter-cabinet angles from ArrayCalc/Soundvision to set the array on site.
- _sources: L-Acoustics Soundvision product documentation; Meyer Sound MAPP 3D product documentation; d&b audiotechnik ArrayCalc documentation; ProSoundWeb - Array/Room Modeling & Sound System Optimization Tools_

### Round Sling
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A soft, continuous loop of synthetic fiber inside a protective cover, wrapped around a beam or truss to hang rigging from it.
- **purpose_function** *(NEW)*: Provides a rated, flexible attachment that spreads load and grips structure, typically in a choker or basket hitch, to connect rigging hardware to beams and truss.
- **practical_application** *(NEW)*: A rigger wraps the sling around a beam, chooses vertical, choker, or basket hitch (each with a different rated capacity), protects it from edges, and connects it to a shackle or hoist.
- **category** *(NEW)*: Rigging Hardware
- **related_terms** *(NEW)*: Shackle; Chain Hoist; Bridle; Array Bumper
- **common_mistakes** *(NEW)*: UNSAFE: Continuing to use a sling with cuts, cover damage exposing core fibers, heat/chemical damage, or a missing/illegible capacity tag; it must be removed from service immediately.; UNSAFE: Running the sling over a sharp edge or corner without edge protection, which can cut it under load.; UNSAFE: Applying the vertical WLL to a choker hitch or otherwise ignoring the reduced capacity of the hitch and sling angle.; Exceeding the tag's working load limit or shock-loading the sling.
- **scenario_contexts** *(NEW)*: Basketing a round sling over a roof beam to hang a chain hoist for a line array.; Choking a sling around a truss chord to attach a shackle and pick point.; Inspecting and tagging slings during pre-show rigging checks.
- _sources: ASME B30.9 - Slings (synthetic roundslings, hitch ratings, edge protection, removal criteria); OSHA 29 CFR 1926.251 (synthetic web/round sling use and inspection); Mazzella - How to Inspect a Synthetic Roundsling to ASME B30.9; Holloway Houston - Round Sling Edge Protection & Capacity Ratings_

### Shackle
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A U-shaped metal link closed by a removable pin; it is the basic connector that joins rigging pieces together.
- **purpose_function** *(NEW)*: Provides a rated, removable connection point between slings, hoists, bumpers, and structure, forming the fundamental link in a rigging assembly.
- **practical_application** *(NEW)*: A tech reads the WLL stamped on the bow, selects the right type (screw-pin or bolt/safety type), fully seats the pin, and connects the sling to the pick point, keeping the load in line with the bow.
- **category** *(NEW)*: Rigging Hardware
- **related_terms** *(NEW)*: Round Sling; Chain Hoist; Bridle; Array Bumper
- **common_mistakes** *(NEW)*: UNSAFE: Side-loading a shackle (pulling at an angle across the bow/pin), which can cut capacity drastically - roughly 50% at 90 degrees - and bend the bow.; UNSAFE: Judging capacity by size instead of the WLL marking stamped on the body, or using an unmarked/unrated shackle.; UNSAFE: Using a screw-pin shackle where motion can back the pin out, without mousing it or using a bolt-type (safety) shackle.; Loading the shackle so the sling bears on the pin instead of the bow, or not fully seating the pin.
- **scenario_contexts** *(NEW)*: Connecting a round sling to a chain hoist hook or to an array bumper pick point.; Building the apex connection of a bridle.; Joining rated rigging components in an overhead array assembly.
- _sources: ASME B30.26 - Rigging Hardware (shackle marking, WLL, side-load reduction); OSHA 29 CFR 1926.251 (shackles and rigging hardware); Mazzella - ASME B30.26 Shackle Inspection & Best Practices; Holloway Houston - Understanding Shackle Capacity Charts and Load Angles_

### Side Fill
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Larger monitor speakers placed at the sides of the stage that give the whole band a broad general mix on top of their individual floor wedges.
- **purpose_function** *(NEW)*: Provides broad, full-range on-stage monitoring across the performance area so performers hear a balanced overall band mix, complementing individual wedge mixes.
- **practical_application** *(NEW)*: A monitor tech places full-range stacks (often a top plus a sub) at stage left and right, feeds them a rough band mix, and balances their level against the wedges and overall stage volume.
- **category** *(NEW)*: Stage Monitoring
- **related_terms** *(NEW)*: Front Fill; Splay Angle; Prediction Software
- **common_mistakes** *(NEW)*: Turning side fills up so loud they raise overall stage volume, invite feedback, and make FOH harder to mix.; UNSAFE: Exposing performers to excessive on-stage SPL from side fills without hearing-conservation awareness.; Confusing side fills (a broad band mix for everyone) with individual wedges (personal per-performer mixes).; Placing side fills where they spill straight into vocal mics or wash into the audience.
- **scenario_contexts** *(NEW)*: Giving a five-piece band an enveloping overall mix alongside individual wedges.; Filling stage sound for performers who move away from their own wedge.; A festival stage using side-fill stacks as a common reference mix across changing acts.
- _sources: Sound on Sound - Stage Monitoring & Monitor Mixing; Wikipedia - Stage monitor system; Sweetwater InSync - Sidefill; ProSoundWeb - Stage Monitoring 101_

### Splay Angle
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The angle between two neighbouring boxes in a line array; usually tight at the top for far throw and progressively wider toward the bottom for near coverage.
- **purpose_function** *(NEW)*: Shapes the array's vertical coverage by controlling how much adjacent cabinets overlap or spread, trading long-throw focus against near-field spread.
- **practical_application** *(NEW)*: A tech sets each inter-cabinet angle (often only a few degrees, tighter up top and progressively wider down the array) per the prediction software to cover front to back evenly.
- **category** *(NEW)*: Array Configuration
- **related_terms** *(NEW)*: Prediction Software; Inclinometer; Array Bumper; Front Fill
- **common_mistakes** *(NEW)*: Using splay angles too wide near the top (e.g., beyond roughly 4-5 degrees), causing low-frequency phase/comb issues and lost long-throw energy.; Applying a uniform splay when a progressive scheme (tight top to wide bottom) is needed for even coverage.; Ignoring the prediction software's calculated angles and eyeballing the array instead.; Confusing splay (angle between cabinets) with the overall array/site angle set at the bumper.
- **scenario_contexts** *(NEW)*: Setting progressive splay angles down a flown array to cover a raked seating bowl evenly.; Tightening top-box splay to reach the back of a deep arena.; Adjusting splay in prediction software to smooth front-to-back SPL before load-in.
- _sources: McCarthy, Sound Systems: Design and Optimization (line array splay and coverage); ProSoundWeb - Real World Gear: Medium-Format Line Arrays; L-Acoustics / d&b line array configuration and prediction documentation; audiomeasurements.com - To Splay Or Not To Splay_


## AUDI201 — RF Wireless Systems
*6 terms*

### Antenna Gain (dBi)
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A number that tells you how much an antenna focuses radio energy in a direction compared to a theoretical antenna that radiates equally everywhere. More dBi means a tighter, longer-reaching beam rather than a wide but shallow pickup.
- **purpose_function** *(NEW)*: It quantifies how an antenna concentrates RF energy so you can predict its reach and coverage angle. It exists because directivity, not raw power, is what extends usable range and improves reception in a given direction.
- **practical_application** *(NEW)*: A tech picks a higher-dBi directional (paddle/log-periodic) antenna to reach a distant stage, but only sets receiver antenna gain to offset measured coaxial cable loss so the system nets near 0 dB rather than overloading the front end.
- **category** *(NEW)*: RF Wireless
- **related_terms** *(NEW)*: Dipole Antenna; Yagi Antenna; Antenna Distribution; Coaxial Cable Loss; RF Signal Strength
- **common_mistakes** *(NEW)*: Assuming more gain always means better performance, when excess gain narrows coverage and can reduce usable range and channel count; Confusing dBi (referenced to an isotropic radiator) with dBd (referenced to a dipole), which differ by about 2.15 dB; Adding antenna gain beyond what cable loss requires, overloading the receiver front end and raising the noise floor; Aiming a high-gain directional antenna carelessly, since narrow beamwidth demands precise pointing
- **scenario_contexts** *(NEW)*: Choosing a 7 dBi log-periodic paddle antenna to cover a 120-degree stage area from front-of-house; Calculating whether antenna gain offsets a long coaxial run to a remote antenna position; Troubleshooting dropouts caused by a high-gain antenna aimed slightly off the performance area; Comparing an omnidirectional half-wave (roughly 0 dBd) against a directional antenna for a large venue
- _sources: Shure, Wireless Systems Guide For Antenna Setup; Shure USA, Wireless Systems and Antenna Placement; Shure Publications, UA874 Active Directional Antenna User Guide_

### Backup Frequency
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A clean spare radio channel you have coordinated in advance so that if your live channel gets hit by interference, you can jump to the spare immediately. It is your escape route when a frequency goes bad mid-show.
- **purpose_function** *(NEW)*: It provides a pre-verified, intermod-free alternative channel so a compromised link can be restored quickly without re-coordinating on the fly. It exists because RF conditions change and even coordinated channels can be disrupted during an event.
- **practical_application** *(NEW)*: A tech uses coordination software to generate compatible backup frequencies alongside the primary set, loads them into the receiver, and switches to a spare the moment a channel shows interference or dropouts.
- **category** *(NEW)*: RF Wireless
- **related_terms** *(NEW)*: Frequency Coordination; Frequency Scan; Intermodulation; RF Interference; Group and Channel
- **common_mistakes** *(NEW)*: Picking a backup frequency without checking it is intermod-compatible with the rest of the active system; Failing to re-scan and re-verify backups after moving to a new location or when the RF environment changes; Assuming a single backup covers many transmitters, when each channel needs its own coordinated spare; Storing backups but never programming them into the transmitter/receiver so switchover is not actually fast
- **scenario_contexts** *(NEW)*: A vocalist's channel starts dropping out during a concert and the tech switches to a pre-loaded backup frequency; Coordinating a multichannel show and reserving several intermod-free spares in Wireless Workbench before doors; A broadcast crew arrives at a new venue and re-scans to validate that stored backups are still clean; Nearby TV transmission or another production activates on a coordinated channel, forcing a jump to the backup
- _sources: Shure USA, Wireless Frequency Finder and Wireless Workbench frequency coordination; Sennheiser, Why is Frequency Coordination Important; ProSoundWeb, Frequency Coordination With Shure Wireless Workbench_

### Digital Wireless System
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A wireless mic or in-ear system that turns the audio into digital data before sending it over the air, instead of using old-style FM. Because it does not squeeze and re-expand the sound like analog does, it can sound cleaner and more like a wired mic, but it adds a tiny delay.
- **purpose_function** *(NEW)*: It transmits encoded digital audio so the received signal preserves the original's dynamic range and character without a compander. It exists to eliminate companding artifacts and improve audio quality, spectral efficiency, and encryption options versus analog FM.
- **practical_application** *(NEW)*: A tech deploys digital systems (for example ULX-D or Axient Digital) to fit more channels in tight spectrum and get natural, full-range audio, while budgeting a few milliseconds of latency when combining with wired sources or in-ear monitors.
- **category** *(NEW)*: RF Wireless
- **related_terms** *(NEW)*: Companding; Latency; Frequency Coordination; Digital Wireless System; RF Interference
- **common_mistakes** *(NEW)*: Assuming digital means zero latency, when systems typically add a few milliseconds that can matter with IEMs or mixed wired sources; Believing digital wireless is immune to RF interference and dropouts, when coordination and antennas still matter; Thinking all digital systems sound identical, ignoring codec, sample rate, and mode differences; Confusing the absence of a compander with the absence of any processing
- **scenario_contexts** *(NEW)*: Choosing a digital system to pack more channels into congested UHF spectrum at a corporate event; Comparing latency specs when a presenter also monitors on in-ear monitors; Selecting encrypted digital transmission for a confidential presentation or broadcast; Explaining to a client why a digital lav sounds closer to the wired capsule than an older analog unit
- _sources: Shure USA, An Overview of Digital Wireless Microphone Systems; Shure, The Advantage of Digital Wireless Systems; Shure Service, Axient Digital vs ULX-D (latency specifications)_

### Dipole Antenna
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The simple straight antenna, about a half-wavelength long, that ships with most wireless systems. It picks up fairly evenly from all around its side (like a donut-shaped pattern) rather than off its tip, and it is the baseline other antennas are compared against.
- **purpose_function** *(NEW)*: It provides efficient, roughly omnidirectional reception at a half-wavelength resonant length, serving as the standard reference antenna for gain comparisons (dBd). It exists as the simple, predictable default for line-of-sight coverage near the receiver.
- **practical_application** *(NEW)*: A tech uses the bundled half-wave dipole (such as a Shure UA8) for close, in-room coverage, orienting it vertically and away from metal, and switches to directional antennas only when distance or interference rejection demands it.
- **category** *(NEW)*: RF Wireless
- **related_terms** *(NEW)*: Antenna Gain (dBi); Yagi Antenna; Antenna Distribution; Line of Sight; RF Signal Strength
- **common_mistakes** *(NEW)*: Believing a dipole is perfectly omnidirectional, when its pattern is a torus that is weakest off the ends of the elements; Mounting the antenna flat or against metal, distorting the pattern and hurting reception; Confusing dBi and dBd references, since a half-wave dipole is about 2.15 dB below isotropic reference; Using a bundled dipole for long-throw coverage where a directional antenna is required
- **scenario_contexts** *(NEW)*: Setting the two whip/dipole antennas on a receiver in a V for in-room coverage; Explaining why holding a transmitter so its antenna points straight at the receiver weakens the signal; Using a half-wave dipole as the reference when reading a directional antenna's gain spec; Repositioning a rack-mounted receiver's dipoles to the front panel to restore line of sight
- _sources: Shure USA, UA8 1/2 Wave Dipole Antenna product page; Sennheiser, Half-Wave Dipole Antenna Rod; TC Furlong, Wireless Blog Series Part Seven: Antenna Varieties & Applications_

### Part 74 License
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A U.S. FCC license for eligible professional wireless-mic users that lets them register and operate on protected spectrum, so their channels can be shielded from other users. It is a legal step, not a piece of gear, and only certain organizations qualify.
- **purpose_function** *(NEW)*: It authorizes eligible entities to operate low power auxiliary stations (LPAS) on a secondary basis and to register events for interference protection. It exists so high-stakes productions can gain recognized, coordinated access to scarce wireless-mic spectrum.
- **practical_application** *(NEW)*: A broadcaster or large production files for a Part 74 LPAS license so it can register shows in the FCC/coordination databases and gain protected status, while unlicensed users remain limited to designated unlicensed bands.
- **category** *(NEW)*: RF Wireless
- **related_terms** *(NEW)*: Frequency Coordination; Backup Frequency; RF Interference; UHF Band; TV White Space
- **common_mistakes** *(NEW)*: Assuming any wireless-mic user qualifies, when eligibility is limited (for example professional sound companies and large-venue operators generally must routinely use 50 or more LPAS devices); Thinking a Part 74 license grants exclusive, primary spectrum, when LPAS operation is secondary and must protect primary TV services and accept interference; Confusing holding a license with automatic protection, since events still must be registered and coordinated; Believing a license removes the need for on-site frequency coordination and scanning
- **scenario_contexts** *(NEW)*: A television network files for Part 74 licensing to protect wireless mics during a live broadcast; A large venue operator using dozens of channels seeks eligibility for LPAS licensing; A touring production registers show dates in the coordination database to claim interference protection; Comparing licensed Part 74 operation against unlicensed operation in the designated Part 15 bands
- _sources: FCC, Wireless Microphones (Broadband Division); FCC, Operation of Wireless Microphones consumer guide; Federal Register, Spectrum Access for Wireless Microphone Operations (2014)_

### Yagi Antenna
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A directional antenna with several parallel rod elements on a boom that focuses reception strongly in one direction for long reach. It has high gain but only over a narrow band of frequencies, so in pro audio the similar log-periodic paddle is usually chosen instead.
- **purpose_function** *(NEW)*: Its driven element plus director and reflector elements produce high forward gain and front-to-back rejection along one axis. It exists to extend range and reject off-axis interference, though its narrow bandwidth limits wireless-mic use compared to log-periodic antennas.
- **practical_application** *(NEW)*: A tech reaches for a directional antenna to cover a distant stage or reject interference from one direction, but for multichannel UHF work typically uses a wideband log-periodic paddle rather than a narrowband Yagi, keeping at least the recommended distance from transmitters.
- **category** *(NEW)*: RF Wireless
- **related_terms** *(NEW)*: Antenna Gain (dBi); Dipole Antenna; Antenna Distribution; RF Interference; Coaxial Cable Loss
- **common_mistakes** *(NEW)*: Using a Yagi across a wide wireless-mic frequency range when its bandwidth is often only about one 6 MHz TV channel; Assuming high gain fixes all range problems, ignoring that narrow beamwidth requires careful aiming; Placing a directional antenna too close to transmitters instead of the recommended minimum distance (about 50 feet / roughly 3 meters minimum); Confusing a Yagi with a log-periodic array, which offers similar directivity over much wider bandwidth for audio use
- **scenario_contexts** *(NEW)*: Evaluating a directional antenna to reach a bodypack far downstage in a large arena; Explaining why a wideband log-periodic paddle is preferred over a Yagi for multichannel UHF systems; Aiming a directional antenna to null out interference coming from one side of a venue; Planning a long coaxial run and offsetting the loss with a directional antenna's forward gain
- _sources: Shure USA, Wireless Systems and Antenna Placement; Front of House Magazine, Antennas for Wireless Systems: A Practical Guide; Drew Brashler, RF Coordination Training - Antennas for Wireless Audio_


## AUDI201 — Troubleshooting
*6 terms*

### Bathtub Curve
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A graph shaped like a bathtub: gear fails a lot when brand new, rarely during its middle life, then more and more as it wears out with age.
- **purpose_function** *(NEW)*: It models how failure rate changes over a product's lifetime so teams can plan burn-in of new units and proactive replacement of aging ones instead of waiting for random breakdowns.
- **practical_application** *(NEW)*: A shop uses it to justify burning-in or road-testing new amplifiers and wireless packs before deploying them, and to retire capacitors, fans, and lamps once gear enters its wear-out years rather than trusting old stock on a critical show.
- **category** *(NEW)*: Fault Diagnosis
- **related_terms** *(NEW)*: Failure Mode; Latent Defect; Mean Time Between Failures (MTBF); Burn-In; Preventive Maintenance; Thermal Drift
- **common_mistakes** *(NEW)*: Assuming a low failure rate during the 'useful life' region means no maintenance is ever needed, ignoring that random failures still occur.; Treating brand-new equipment as automatically reliable, forgetting that infant-mortality failures are highest right out of the box.; Applying the curve to a single unit as if it were a schedule, when it actually describes failure rates across a population of components.
- **scenario_contexts** *(NEW)*: Deciding to burn in a batch of new in-ear monitor packs for several hours before a tour to weed out early (infant-mortality) failures.; Scheduling replacement of electrolytic capacitors and cooling fans in aging power amplifiers as they enter the wear-out phase.; Explaining to a client why a fleet of loudspeakers that ran flawlessly for years is now failing more often as components age.
- _sources: Wikipedia, 'Bathtub curve' (reliability engineering) — https://en.wikipedia.org/wiki/Bathtub_curve; ScienceDirect Topics, 'Bathtub Curve' overview — https://www.sciencedirect.com/topics/engineering/bathtub-curve; Accendo Reliability, 'The Bathtub Curve Explained' — https://accendoreliability.com/the-bath-tub-curve-explained/_

### Chopstick Test
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Gently poking or tapping parts, wires, and solder joints with a wooden stick while the gear is running, so you can find the loose or cracked connection that makes the sound cut out.
- **purpose_function** *(NEW)*: It provides a safe, non-conductive way to physically disturb suspect points one at a time so an intermittent fault can be provoked and pinpointed while the equipment is powered and the symptom is present.
- **practical_application** *(NEW)*: When a channel or amp crackles or drops out only sometimes, a tech powers it up and lightly taps around connectors, tube sockets, and solder joints with a chopstick until the noise responds, revealing the failing joint or component.
- **category** *(NEW)*: Fault Diagnosis
- **related_terms** *(NEW)*: Intermittent Fault; Cold Solder Joint; Latent Defect; Thermal Drift; Failure Mode; Signal Flow
- **common_mistakes** *(NEW)*: UNSAFE: Using a metal tool or bare fingers instead of a non-conductive stick to probe a live chassis, risking shorts and, in tube/valve or mains gear, lethal shock or burns.; UNSAFE: Reaching into equipment that stores high voltage (tube amps, power supplies with large capacitors) without knowing those points remain dangerous even after power-off unless properly discharged.; Tapping too hard and creating new intermittent faults or cracking solder joints rather than gently revealing the existing one.; Stopping at the first reactive point instead of confirming it, so a nearby joint or a thermal issue gets misdiagnosed.
- **scenario_contexts** *(NEW)*: Locating a crackling, intermittent tube-amp fault by lightly tapping tubes and their sockets while the amp is on.; Finding a cold or cracked solder joint on a mixing console channel strip that only drops out when the chassis is bumped.; Diagnosing a mic input that cuts in and out by gently flexing connectors and cable strain reliefs while monitoring the signal.
- _sources: Tubes and Transistors, 'Using the Chopstick Test to Diagnose Tube Amp Issues' — https://www.tubesandtransistors.com/chopstick-test/; Jim Roal, 'Electrical and Electronic Intermittent Troubleshooting Strategy' — http://jimroal.com/ts.htm_

### Failure Mode
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The specific way a part breaks — not just 'it died,' but exactly how it died, like a capacitor drying out, a jack going intermittent, or a driver's voice coil burning open.
- **purpose_function** *(NEW)*: Naming the specific mode of failure lets technicians target the real cause and lets designers anticipate and prevent recurring problems, which is the basis of Failure Mode and Effects Analysis (FMEA).
- **practical_application** *(NEW)*: A tech logs how each unit failed (open voice coil, leaky filter cap, corroded connector) so recurring modes can be spotted, spares stocked, and root causes fixed rather than just swapping parts blindly.
- **category** *(NEW)*: Fault Diagnosis
- **related_terms** *(NEW)*: Bathtub Curve; Latent Defect; Root Cause Analysis; Shotgunning; Thermal Drift; Preventive Maintenance
- **common_mistakes** *(NEW)*: Confusing the failure mode (how it failed) with the root cause (why it failed) and stopping the investigation too early.; Recording only that a unit 'stopped working' without noting the specific mode, losing the pattern data that prevents repeats.; Assuming one symptom always maps to one mode, when the same symptom can come from several different failure modes.
- **scenario_contexts** *(NEW)*: Cataloging that several loudspeakers failed by open voice coil after being overdriven, pointing to a limiter/gain-structure problem upstream.; Running an FMEA on a new stage-monitor design to identify likely failure modes before it ships.; Distinguishing whether a dead amp channel failed by blown output transistors versus a tripped protection relay before ordering parts.
- _sources: Quality-One, 'FMEA | Failure Mode and Effects Analysis' — https://quality-one.com/fmea/; PTC, 'What is Failure Mode and Effects Analysis?' — https://www.ptc.com/en/technologies/plm/failure-mode-effects-analysis; ScienceDirect Topics, 'Failure Modes and Effects Analysis' overview — https://www.sciencedirect.com/topics/engineering/failure-modes-and-effects-analysis_

### Latent Defect
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A hidden flaw that passes every test when new but weakens the part so it fails later, often after heat, vibration, or time have taken their toll.
- **purpose_function** *(NEW)*: The concept explains why gear that tested perfectly can still fail in the field, driving practices like ESD control, burn-in, and stress testing that surface or prevent these hidden weaknesses.
- **practical_application** *(NEW)*: A tech treats a device that passed bench tests but died in service as a possible latent defect (for example, prior ESD damage or a marginal solder joint), and enforces anti-static handling and burn-in to catch such units before a show.
- **category** *(NEW)*: Fault Diagnosis
- **related_terms** *(NEW)*: Bathtub Curve; Failure Mode; Intermittent Fault; Thermal Drift; Burn-In; Root Cause Analysis
- **common_mistakes** *(NEW)*: Assuming that passing a functional test proves a unit is sound, when latent damage (e.g. ESD) can outnumber immediate failures roughly ten to one.; UNSAFE: Handling ICs, wireless packs, and circuit boards without ESD grounding, since a low-voltage discharge you never feel can create a latent defect.; Blaming the last person to touch the gear when the true cause was a weakness introduced weeks or months earlier.
- **scenario_contexts** *(NEW)*: A wireless receiver that passed rental-return testing fails mid-show weeks later due to earlier, unnoticed ESD damage.; Burning in and heat-soaking new amplifiers to force marginal, latent-defective components to fail on the bench rather than on stage.; Investigating a run of premature loudspeaker driver failures traced to a manufacturing flaw not detectable at initial inspection.
- _sources: EOS/ESD Association, 'ESD Fundamentals Part 1' — https://www.esda.org/esd-overview/esd-fundamentals/part-1-an-introduction-to-esd/; DESCO, 'Types of ESD Device Damage' — https://desco.blog/2017/01/13/types-of-esd-device-damage/; Bondline, 'What Is Latent ESD Damage? Hidden Electronics Failures Explained' — https://bondline.co.uk/blog/latent-esd-damage_

### Shotgunning
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Swapping out a bunch of suspected parts all at once hoping one of them fixes the problem, instead of tracking down which part is actually bad.
- **purpose_function** *(NEW)*: It exists as a quick, brute-force tactic that can restore service fast, but it is discouraged because it wastes money, discards good parts, and never teaches you what actually failed.
- **practical_application** *(NEW)*: Under show-time pressure a tech might swap a whole signal chain (cable, DI, and channel) at once to get audio back, then diagnose properly afterward to learn the true fault rather than making shotgunning the standard method.
- **category** *(NEW)*: Fault Diagnosis
- **related_terms** *(NEW)*: Failure Mode; Root Cause Analysis; Signal Flow; Half-Split Method; Substitution Test; Intermittent Fault
- **common_mistakes** *(NEW)*: Treating shotgunning as normal practice, which drives up parts cost and destroys the diagnostic knowledge that prevents repeat faults.; Changing several things at once and losing track of which change fixed the problem, so the root cause stays unknown.; Installing 'known-good' spares that are actually faulty, adding new problems on top of the original one.
- **scenario_contexts** *(NEW)*: During a live show a tech swaps cable, DI box, and console channel together to restore a dead input fast, then diagnoses properly after the set.; A maintenance team replacing every board in a rack unit instead of isolating the failed stage, inflating repair costs.; A contrast used in training to teach systematic, half-split troubleshooting instead of firing the 'parts cannon.'
- _sources: Steve Litt, Troubleshooting Professional Magazine, 'Shotgunning' — https://www.troubleshooters.com/tpromag/200510/200510.htm; Dorman Shop Press, 'Fire the parts cannon! Is shotgun diag ever acceptable?' — https://shoppress.dormanproducts.com/shotgun-diagnostics/_

### Thermal Drift
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: As gear heats up during use, its parts change slightly, so a fault can appear only when it's warm — or clear up once it cools down.
- **purpose_function** *(NEW)*: Understanding thermal drift explains temperature-dependent faults and guides warm-up periods, heat-soak testing, and adequate cooling so equipment stays within spec during a full performance.
- **practical_application** *(NEW)*: When a device works fine cold but fails after an hour under lights, a tech heat-soaks it (or uses a heat gun / freeze spray on suspect parts) to reproduce the fault and identify the drifting or failing component.
- **category** *(NEW)*: Fault Diagnosis
- **related_terms** *(NEW)*: Intermittent Fault; Chopstick Test; Latent Defect; Failure Mode; Cold Solder Joint; Bathtub Curve
- **common_mistakes** *(NEW)*: Declaring a unit fixed after a quick cold bench test, when the fault only appears once the equipment reaches operating temperature.; Ignoring ventilation and letting amps or racks overheat, which pushes components out of spec and creates avoidable temperature-related faults.; Confusing a genuine thermal-drift fault with a mechanical intermittent, when freeze spray and heat testing would tell them apart.
- **scenario_contexts** *(NEW)*: An amplifier channel that plays clean when cold but distorts or cuts out after an hour under hot stage lighting.; Using freeze spray to cool a suspect component and momentarily restore normal operation, confirming a heat-sensitive part.; Allowing analog outboard gear or a tube preamp to warm up before soundcheck so its parameters settle before the show.
- _sources: GIAI Photonics, 'What is temperature drift and what effects does it have?' — https://www.giaiphotonics.com/what-is-temperature-drift-and-what-effects-does-it-have/; INCB Technologies, 'How they Work – Thermal Drift (ART287E)' — https://www.incbtech.com/articles/16-how-they-work/1909-how-they-work-thermal-drift-art287e.html; MEAN WELL Direct glossary, 'What is Warm-Up Drift?' — https://www.meanwelldirect.co.uk/glossary/what-is-warm-up-drift/_


## AUDI201 — Vehicle Audio
*7 terms*

### Auxiliary Battery
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A second car battery added just for the stereo, so big bass hits don't starve the amps or dim your headlights.
- **purpose_function** *(NEW)*: It adds reserve current capacity close to the amplifiers, stabilizing system voltage during high-demand bass transients and extending engine-off listening time without draining the starting battery below the level needed to crank the engine.
- **practical_application** *(NEW)*: An installer mounts an auxiliary battery near the amp rack, ties it to the charging system through heavy cable (often after a Big 3 upgrade), and fuses its positive lead close to the terminal; an isolator or relay may be used so the audio load can't discharge the starting battery when the engine is off.
- **category** *(NEW)*: Vehicle Audio
- **related_terms** *(NEW)*: Big 3 Upgrade; Battery Isolator; Alternator; Voltage Drop; Capacitor; Ground
- **common_mistakes** *(NEW)*: UNSAFE: Running an unfused or improperly fused high-current battery cable — the positive lead must be fused as close as possible to each battery terminal so a shorted cable cannot start a fire.; Mixing battery chemistries or ages (e.g., an old flooded starter battery paired with a new AGM/lithium aux battery), which causes uneven charging and shortened life.; Adding a second battery without upgrading the alternator or charging wiring, so the system still sags because the alternator can't keep both batteries charged under load.; UNSAFE: Mounting a non-sealed (flooded) battery inside the passenger cabin, allowing hydrogen gas and acid vapor to vent into the occupied space instead of using a sealed AGM/lithium type.
- **scenario_contexts** *(NEW)*: A competition or daily SPL build where large amplifiers pull heavy current on bass peaks and a single battery can't hold voltage.; A show or tailgate setup where the audio system runs for extended periods with the engine off.; Diagnosing headlight dimming and amp protect-mode cutouts caused by voltage sag under heavy bass.; A trunk-mounted amp rack where an installer places reserve capacity close to the amps to minimize voltage drop over long power runs.
- _sources: Audio Sellerz — Step-by-Step Car Audio Electrical Upgrades (Big 3, Alternator, Battery); WattCycle — How to Add a Second Battery for Car Audio; Evolution Lithium — Wiring Two Batteries for Car Audio Setup Guide_

### CAN Bus
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The car's internal messaging network that lets modules talk to each other over just two wires; an aftermarket stereo has to work with it instead of fighting it.
- **purpose_function** *(NEW)*: It is a differential two-wire serial network that lets a vehicle's electronic control units share data and control signals without dedicated point-to-point wiring; the audio system must coexist with it, so integration modules translate CAN messages into signals an aftermarket head unit or amplifier can use.
- **practical_application** *(NEW)*: When replacing a factory radio on a CAN-equipped vehicle, an installer adds a CAN-bus interface module (from brands like iDatalink, PAC, Axxess, or Metra) to keep steering-wheel controls, chimes, displays, and factory-amp signals working and to prevent warning lights or lost accessory power.
- **category** *(NEW)*: Vehicle Audio
- **related_terms** *(NEW)*: Integration Module; Steering Wheel Control Interface; Head Unit; Factory Amplifier; Vehicle Speed Signal (VSS)
- **common_mistakes** *(NEW)*: Assuming a simple wiring harness alone will work — on many CAN vehicles, removing the factory radio without an interface module kills accessory power, chimes, or steering-wheel controls.; Cutting into or splicing the CAN data (CAN-H/CAN-L) wires, which can corrupt the network and trigger faults across unrelated vehicle systems.; Not updating or correctly programming/flashing the integration module for the specific vehicle, causing missing or erratic features.; Expecting every factory feature to transfer automatically when some require a vehicle-specific module or firmware.
- **scenario_contexts** *(NEW)*: Replacing a factory head unit in a modern vehicle where the radio is integrated into the data network.; Retaining steering-wheel controls, backup camera, and chimes after an aftermarket stereo install.; Adding an amplifier while keeping a factory amplified/premium sound system that communicates over the bus.; Troubleshooting warning lights or dead accessory power that appeared after an aftermarket radio swap.
- _sources: Best Car Audio — Upgrading Car Audio Systems with Data Bus Interfaces; PAC Audio — CAN-Bus Interface Module product documentation; XAutoStereo — What Does a CANBUS Box Do for a Car Stereo_

### High-Level Input
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An amp input that takes the speaker wires straight from a factory radio, so you don't need RCA jacks or a separate converter.
- **purpose_function** *(NEW)*: It lets an amplifier accept a speaker-level (high-voltage) signal directly, internally attenuating it to line level, so a system can be built around a factory head unit that has no RCA/preamp outputs.
- **practical_application** *(NEW)*: On a factory-radio upgrade, the installer taps the head unit's speaker outputs into the amp's high-level input terminals; many such amps also include signal-sensing turn-on, eliminating the need for a switched remote wire.
- **category** *(NEW)*: Vehicle Audio
- **related_terms** *(NEW)*: Line Output Converter (LOC); Signal-Sensing Turn-On; Head Unit; Speaker-Level Signal; Line Level
- **common_mistakes** *(NEW)*: Confusing high-level (speaker-level) inputs with line-level RCA inputs and feeding the wrong signal type into the wrong terminals.; Tapping the speaker wires after a factory amplifier or processor, capturing an already-EQ'd/limited signal instead of a clean full-range one.; Setting amp gain using the high-level input as if it were a low-level source, causing clipping because the input voltage is much higher.; Leaving factory speakers connected in parallel on the same tapped wires when the amp expects a bridged/high-impedance sense signal, causing turn-on or load issues.
- **scenario_contexts** *(NEW)*: Adding an amplifier to a factory head unit that has no RCA preamp outputs.; Installing a powered subwoofer that only offers speaker-wire inputs.; A budget upgrade where the customer keeps the factory radio but wants more power.; Wiring an amp behind a factory system where a remote turn-on lead isn't readily available.
- _sources: BoomSpeaker — How to Wire the High-Level Input on an Amp (No RCA Needed); Best Car Audio — Exploring the Two Types of Automatic Amplifier Remote Turn-On Circuits_

### Signal-Sensing Turn-On
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The amp powers itself on automatically when it detects music on the speaker wires, so you don't have to run a separate turn-on wire from the radio.
- **purpose_function** *(NEW)*: It lets an amplifier switch on without a dedicated remote/switched lead by detecting either the AC audio signal or a small DC offset voltage on the speaker wires, which is essential when integrating with factory head units that provide no remote turn-on output.
- **practical_application** *(NEW)*: Used with high-level inputs on factory-radio installs: the installer connects speaker-level signal and lets the amp's sense circuit power it up when audio starts; the amp typically turns on within a second and shuts off 10–30 seconds after audio stops.
- **category** *(NEW)*: Vehicle Audio
- **related_terms** *(NEW)*: High-Level Input; Remote Turn-On Wire; DC Offset; Head Unit; Line Output Converter (LOC)
- **common_mistakes** *(NEW)*: Playing audio at very low volume, so the sense circuit never sees enough voltage swing and the amp fails to turn on or cycles off.; Expecting instant, click-free operation — signal-sense adds a short turn-on delay and can produce a pop, and it drops out on silent passages if using AC-signal detection rather than DC-offset detection.; Using signal sensing when a clean switched 12V source is available, adding unnecessary turn-on lag and reliability issues.; Tapping the sense signal from wires that are muted or powered down by the factory system in certain modes, causing the amp not to wake.
- **scenario_contexts** *(NEW)*: Integrating an aftermarket amp with a factory head unit that has no remote turn-on lead.; Installing a compact powered subwoofer using only speaker-level connections.; A clean, minimal-wiring install where the installer avoids running a remote wire to the dash.; Troubleshooting an amp that won't power on or randomly shuts off between songs on a factory system.
- _sources: Best Car Audio — Exploring the Two Types of Automatic Car Audio Amplifier Remote Turn-On Circuits; BoomSpeaker — How to Wire the High-Level Input on an Amp (No RCA Needed)_

### SPL Competition
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Contests to see whose car stereo can hit the loudest measured sound level inside the vehicle.
- **purpose_function** *(NEW)*: These organized events measure maximum in-car sound pressure level with a calibrated meter and rank vehicles by class, providing the competitive culture that drives extreme high-current, high-output system builds.
- **practical_application** *(NEW)*: Competitors build and tune vehicles to a sanctioning body's rules (dB Drag Racing, MECA, IASCA, USACi), then run in a class where a meter such as the Term-LAB records peak dB from a mic placed in the cabin per the rulebook.
- **category** *(NEW)*: Vehicle Audio
- **related_terms** *(NEW)*: Sound Pressure Level (SPL); Subwoofer; Auxiliary Battery; Big 3 Upgrade; Enclosure Tuning; Alternator
- **common_mistakes** *(NEW)*: Confusing SPL (maximum loudness) competition with sound-quality (SQ) competition, which judges accuracy and staging instead of volume.; UNSAFE: Chasing peak numbers with prolonged exposure to extreme SPL without hearing protection, risking permanent hearing damage.; Assuming everyday listening levels resemble competition levels, which are far beyond safe or musical listening.; Ignoring the sanctioning body's specific rules for mic placement, class limits, and electrical requirements, leading to disqualification.
- **scenario_contexts** *(NEW)*: A sanctioned sound-off event where cars run one at a time for a peak dB score.; A dB Drag Racing head-to-head lane matchup decided by a lighted tree.; A shop-sponsored demo vehicle built to showcase maximum output.; Class-based competition where builds are grouped by power, number of subs, or vehicle type.
- _sources: IASCA Worldwide — official organization site; MECA — 2020 SPL Rule Book; TermPro — Term-LAB Magnum SPL Competition Meter product page_

### Steering Wheel Control Interface
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A small adapter that lets the buttons on your steering wheel keep controlling the stereo after you swap in an aftermarket radio.
- **purpose_function** *(NEW)*: It translates the vehicle's factory steering-wheel control signals into commands the aftermarket head unit understands, preserving safe hands-on-wheel operation of volume, track, and source functions after a radio upgrade.
- **practical_application** *(NEW)*: The installer wires an interface such as the Axxess ASWC-1, PAC SWI-RC, or iDatalink Maestro to the vehicle harness and the radio's SWC input, then uses auto-detect or manual/flash programming to map each wheel button to a radio function.
- **category** *(NEW)*: Vehicle Audio
- **related_terms** *(NEW)*: Head Unit; CAN Bus; Integration Module; Wiring Harness Adapter; Factory Integration
- **common_mistakes** *(NEW)*: Assuming the aftermarket radio must have a dedicated wire-type SWC input — some vehicles communicate wheel controls over the data bus and require a CAN-capable interface instead.; Skipping or mis-running the auto-detect/programming step, so buttons are unmapped or mapped to the wrong functions.; Buying a universal interface without confirming vehicle and radio compatibility for that specific application.; Splicing into the wrong control or data wire, causing non-working buttons or bus faults.
- **scenario_contexts** *(NEW)*: Installing an aftermarket head unit while retaining factory steering-wheel audio buttons.; A late-model vehicle where wheel controls run over the data network and need a CAN interface.; Programming/flashing an interface to a specific vehicle when auto-detect doesn't fully map the buttons.; A customer who wants modern radio features but insists on keeping familiar wheel controls for safe driving.
- _sources: Crutchfield — Guide to Steering Wheel Audio Control Adapters; Axxess Integrate — ASWC-1 product documentation_

### Subsonic Filter
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A filter that cuts the ultra-low notes a ported box can't handle, so the sub cone doesn't flop around and tear itself apart.
- **purpose_function** *(NEW)*: It is a high-pass filter set below the enclosure's tuning frequency that removes frequencies the box can't support with air-spring resistance, protecting a ported/vented subwoofer from mechanical over-excursion and freeing amplifier power for usable bass.
- **practical_application** *(NEW)*: On a ported build, the installer sets the amp's subsonic filter roughly a half-octave (about 80%) below the enclosure tuning frequency — for example, near 25–28 Hz for a box tuned to 30 Hz — to keep the cone under control near and below tuning.
- **category** *(NEW)*: Vehicle Audio
- **related_terms** *(NEW)*: Enclosure Tuning; Ported Enclosure; High-Pass Filter; Over-Excursion; Xmax; Subwoofer
- **common_mistakes** *(NEW)*: Leaving the subsonic filter off (or set too low) on a ported box, letting infrasonic content drive the cone past its mechanical limits and destroy the sub.; Setting the filter too high, which needlessly cuts audible low bass and reduces output.; Applying aggressive subsonic filtering to a sealed enclosure as if it were ported — sealed boxes provide their own air-spring control and need far less.; Confusing the subsonic (infrasonic) filter with the low-pass crossover; they cut opposite ends of the subwoofer's passband.
- **scenario_contexts** *(NEW)*: Tuning an amplifier for a ported subwoofer enclosure to prevent over-excursion near and below tuning.; Protecting subs during low-frequency-heavy content or test tones that contain infrasonic energy.; Setting up an SPL or daily bass system where the box is tuned low for maximum output.; Diagnosing a subwoofer that visibly over-excurses or bottoms out on deep notes.
- _sources: Stinger — How to Set Your Subsonic Filter for Ported and Sealed Subwoofers; MTX — Car Amplifier Tuning and Features; Advanced Car Audio Solutions — How to Adjust Subsonic Filters_


## MUSI190 — Amps & Loudspeakers
*8 terms*

### Alnico Magnet
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An older type of speaker magnet made from aluminum, nickel, and cobalt that gives up a little of its magnetism when driven hard, producing a smooth, softly compressed sound prized in vintage drivers.
- **purpose_function** *(NEW)*: It supplies the fixed magnetic field for the driver's motor; because alnico partially demagnetizes under heavy drive, it adds a gentle dynamic compression valued in guitar and classic hi-fi drivers.
- **practical_application** *(NEW)*: A tech encounters alnico in vintage guitar speakers, classic compression drivers, and boutique reissues, and handles and stores them carefully because alnico can be partially demagnetized by physical shock, heat, or sustained overdrive.
- **category** *(NEW)*: Loudspeaker Design
- **related_terms** *(NEW)*: Neodymium Magnet; Ferrofluid; Voice Coil; Compression Driver; Power Compression
- **common_mistakes** *(NEW)*: Believing alnico is inherently 'better' than ceramic or neodymium; it simply has a different, softer-compressing behavior.; Assuming alnico magnets never weaken, when they can be partially demagnetized by heavy overdrive, physical shock, or excess heat.; Confusing alnico's musical, motor-level compression with electronic dynamic-range compression in the signal chain.
- **scenario_contexts** *(NEW)*: Restoring a vintage guitar amp and identifying whether the original speaker uses an alnico magnet.; Choosing an alnico compression driver for a warmer, more compressed top end in a horn-loaded system.; Diagnosing reduced output from an old alnico speaker that may have lost magnetic strength.
- _sources: Ballou, Handbook for Sound Engineers (loudspeaker driver motor structures chapter); Premier Guitar, 'Speaker Geeks: Alnico or Ceramic ... What Gives?'; Thomas & Skinner, 'Alnico Magnets in Loudspeakers'_

### Beaming
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: As a speaker plays higher notes, the sound stops spreading out and instead shoots forward in a narrow beam, like a flashlight, so listeners off to the sides hear much less treble.
- **purpose_function** *(NEW)*: Beaming is a physical behavior rather than a feature; understanding it lets designers set crossover points and choose driver sizes so coverage stays even across the frequency range.
- **practical_application** *(NEW)*: A tech uses the onset of beaming to decide where to cross over to a smaller driver or add a horn or waveguide so off-axis audience members still receive high frequencies.
- **category** *(NEW)*: Loudspeaker Design
- **related_terms** *(NEW)*: Dispersion; Crossover; Horn; Waveguide; Folded Horn
- **common_mistakes** *(NEW)*: Thinking beaming is a defect rather than a natural result of the wavelength becoming small relative to the cone diameter.; Running a large woofer too high in frequency, causing severe off-axis high-frequency loss.; Trusting on-axis measurements alone while beaming has already narrowed the usable coverage angle.
- **scenario_contexts** *(NEW)*: Setting a crossover so a 12-inch or 15-inch driver hands off before it begins to beam.; Explaining why listeners at the sides of a room hear dull treble from a single full-range driver.; Selecting driver size and horn coverage to achieve even audience coverage in a live venue.
- _sources: ProSoundWeb, 'Size Matters: Observations On Loudspeaker Directivity'; Ballou, Handbook for Sound Engineers (directivity and dispersion); Yamaha Sound Reinforcement Handbook (Davis & Jones)_

### Doppler Distortion
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: When one cone tries to play deep bass and high notes at the same time, its large back-and-forth bass movement slightly bends the pitch of the high notes, similar to how a passing siren changes tone.
- **purpose_function** *(NEW)*: It is an unwanted distortion, not a function; recognizing it justifies multi-way designs that keep large low-frequency excursions and high frequencies on separate drivers.
- **practical_application** *(NEW)*: A tech minimizes audible Doppler and related intermodulation distortion by using multi-way systems or subwoofers so a single cone is not reproducing heavy bass and delicate highs simultaneously.
- **category** *(NEW)*: Loudspeaker Design
- **related_terms** *(NEW)*: Intermodulation Distortion; Cone Excursion; Full-Range Driver; Crossover; Beaming
- **common_mistakes** *(NEW)*: Confusing Doppler distortion with harmonic distortion, when it is a form of frequency/phase modulation that produces intermodulation sidebands.; Assuming it affects all drivers equally, when it is worst in full-range drivers with large excursion and a wide frequency spread.; Believing more power fixes it, when reducing excursion, for example by offloading bass to a subwoofer, is the real remedy.
- **scenario_contexts** *(NEW)*: Deciding to add a subwoofer so a full-range driver is not modulating the highs with bass excursion.; Evaluating single-driver full-range loudspeakers for critical listening.; Explaining audible smearing of high frequencies during heavy bass passages.
- _sources: Elliott Sound Products (sound-au.com), 'Doppler Distortion in Loudspeakers - Real or Imaginary?'; Stereophile, 'Red Shift: Doppler Distortion in Loudspeakers'; Ballou, Handbook for Sound Engineers (loudspeaker distortion mechanisms)_

### Ferrofluid
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A special magnetic oil placed in the tiny gap around a tweeter's voice coil; it pulls heat away and calms unwanted ringing, letting the tweeter play louder and cleaner.
- **purpose_function** *(NEW)*: Held in place by the magnet in the voice-coil gap, it conducts heat from the coil to the magnet structure, raising power handling, and damps the driver's resonance peak.
- **practical_application** *(NEW)*: A tech may refill or replace dried-out ferrofluid in aging tweeters to restore output and smooth the response, and recognizes that fluid loss can cause weak or distorted highs.
- **category** *(NEW)*: Loudspeaker Design
- **related_terms** *(NEW)*: Voice Coil; Tweeter; Power Compression; Alnico Magnet; Neodymium Magnet
- **common_mistakes** *(NEW)*: Assuming all tweeters use ferrofluid; many do not, and adding the wrong type or amount changes the response.; Ignoring that ferrofluid can dry out or thicken with age, reducing output and increasing distortion.; Overheating a tweeter and expecting ferrofluid to prevent damage; it raises but does not remove thermal limits.
- **scenario_contexts** *(NEW)*: Servicing vintage tweeters with degraded ferrofluid to restore high-frequency output.; Choosing tweeters with ferrofluid for higher power handling in PA use.; Diagnosing a tweeter with reduced or distorted highs caused by dried-out fluid.
- _sources: HUMAN Speakers technical essay, 'Ferrofluid'; Ballou, Handbook for Sound Engineers (voice-coil cooling and damping); Speaker Repair Shop, 'Information about ferrofluid-cooled tweeters'_

### Folded Horn
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A horn speaker whose long flare is bent back and forth inside the cabinet, giving the power and efficiency of a large horn in a box small enough to move.
- **purpose_function** *(NEW)*: It folds a long horn path into a practical enclosure to horn-load a driver, boosting low-frequency efficiency and sensitivity while reducing driver excursion.
- **practical_application** *(NEW)*: A tech deploys folded-horn subwoofers for high-output, efficient low end in large venues, accounting for their size, weight, and directional low-frequency behavior.
- **category** *(NEW)*: Loudspeaker Design
- **related_terms** *(NEW)*: Horn; Bass Reflex; Infinite Baffle; Isobaric Loading; Beaming
- **common_mistakes** *(NEW)*: Expecting deep, flat extension from a small folded horn, when true low-frequency horn loading requires a large mouth and a long path.; Ignoring that sharp internal folds create response irregularities and pipe resonances.; Assuming higher efficiency means the cabinet can be undersized, when horn dimensions are set by wavelength.
- **scenario_contexts** *(NEW)*: Choosing folded-horn subs for maximum SPL and efficiency in a large concert system.; Comparing folded-horn versus bass-reflex subs for a tour with weight and space limits.; Explaining why a compact horn sub rolls off higher than a full-size horn.
- _sources: Ballou, Handbook for Sound Engineers (horn loudspeaker loading); Yamaha Sound Reinforcement Handbook (Davis & Jones); AudioJudgement, 'Folded Horn Speaker Design'_

### Infinite Baffle
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Mounting a woofer on a large surface such as a wall or a car trunk so the air behind it is effectively unlimited, letting the driver move as if it were in the open with no box to color the sound.
- **purpose_function** *(NEW)*: It presents the driver with an effectively infinite rear volume so the enclosure adds no resonance or stiffness, letting the driver's own free-air characteristics dominate.
- **practical_application** *(NEW)*: A tech uses infinite-baffle mounting in a wall, ceiling, or car trunk for smooth, natural low end with no box coloration, at the cost of needing a very large sealed space.
- **category** *(NEW)*: Loudspeaker Design
- **related_terms** *(NEW)*: Sealed Enclosure; Bass Reflex; Folded Horn; Isobaric Loading; Free-Air Resonance
- **common_mistakes** *(NEW)*: Confusing a true infinite baffle with a small sealed box; the rear volume must be far larger than the driver's Vas.; Failing to seal the baffle so that front and rear waves cancel, killing bass output.; Expecting the same output-per-space efficiency as a tuned or ported enclosure.
- **scenario_contexts** *(NEW)*: Installing car subwoofers firing into a sealed trunk as an infinite-baffle load.; Building in-wall speakers that use the wall cavity as an effectively infinite baffle.; Choosing an infinite-baffle approach for smooth, uncolored bass in a dedicated listening room.
- _sources: Electronics Notes, 'Infinite Baffle Speaker: Loudspeaker Cabinet'; Ballou, Handbook for Sound Engineers (enclosure design); Kicker technical paper, 'Infinite Baffle Guidelines'_

### Isobaric Loading
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Stacking two identical woofers so they work as a team on the same trapped air, letting a subwoofer fit in about half the box size it would otherwise need.
- **purpose_function** *(NEW)*: It couples two drivers through a shared enclosed air volume so the pair behaves like a single driver that needs only half the enclosure volume for the same low-frequency response.
- **practical_application** *(NEW)*: A tech uses isobaric pairs where cabinet size is tightly limited, accepting the extra driver cost and weight, and no gain in efficiency, in exchange for a smaller box.
- **category** *(NEW)*: Loudspeaker Design
- **related_terms** *(NEW)*: Sealed Enclosure; Infinite Baffle; Folded Horn; Cone Excursion; Bass Reflex
- **common_mistakes** *(NEW)*: Believing isobaric loading increases output or efficiency, when it trades a second driver for half the box volume, not more SPL.; Wiring the two drivers with incorrect polarity for the chosen face-to-face or tandem arrangement.; Forgetting that added driver mass, weight, and cost accompany the space savings.
- **scenario_contexts** *(NEW)*: Designing a compact subwoofer that must fit a small space while keeping deep extension.; Explaining why a small dual-driver sub can match the low end of a larger single-driver box.; Wiring face-to-face isobaric drivers out of electrical phase so their motion combines correctly.
- _sources: Wikipedia, 'Isobaric loudspeaker' (aggregating Linn/Isobarik and compound-loading references); Ballou, Handbook for Sound Engineers (compound/isobaric enclosures); AudioJudgement, 'Isobaric Subwoofer Box Design'_

### Neodymium Magnet
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A very strong, lightweight magnet made of neodymium, iron, and boron that lets speakers be much smaller and lighter while still playing loud, which is ideal for gear that has to be carried and flown.
- **purpose_function** *(NEW)*: It provides a strong magnetic field in far less mass than ceramic, enabling lightweight, high-sensitivity drivers for portable and flown loudspeaker systems.
- **practical_application** *(NEW)*: A tech values neodymium drivers in line arrays and portable PA for large weight savings in rigging and transport, while watching heat, because neodymium loses magnetism at high temperatures.
- **category** *(NEW)*: Loudspeaker Design
- **related_terms** *(NEW)*: Alnico Magnet; Ferrofluid; Voice Coil; Compression Driver; Line Array
- **common_mistakes** *(NEW)*: Assuming neodymium magnets are immune to heat; they demagnetize at lower temperatures than ceramic, so voice-coil heat can weaken them.; Thinking neodymium automatically sounds better, when it mainly enables lighter and more efficient drivers.; Overlooking the higher cost and corrosion sensitivity of neodymium, which requires protective plating.
- **scenario_contexts** *(NEW)*: Speccing neodymium line-array boxes to cut flown weight and reduce rigging load.; Choosing lightweight neodymium drivers for portable or battery-powered PA and touring.; Managing amplifier and thermal limits to avoid demagnetizing neodymium motors during long, high-power shows.
- _sources: Stanford Magnetics, 'Neodymium Magnet Loudspeakers'; AIRPULSE, 'Neodymium Drivers: What You Need to Know'; Ballou, Handbook for Sound Engineers (magnet materials for drivers)_


## MUSI190 — Connectors & I/O Connections
*11 terms*

### DisplayPort
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A computer video plug that also carries sound down the same cable, so one connector can drive a monitor's picture and its built-in speakers.
- **purpose_function** *(NEW)*: Developed by VESA to send high-bandwidth digital video plus optional audio and data from a computer or graphics card to a display over a single cable. It exists to give PCs a royalty-free, high-refresh alternative to HDMI with features like daisy-chaining monitors.
- **practical_application** *(NEW)*: A tech patches a playback or edit machine to a stage monitor, projector, or confidence display via DisplayPort, and remembers that the audio may travel embedded in the same cable rather than out a separate jack.
- **category** *(NEW)*: Digital I/O Connectors
- **related_terms** *(NEW)*: HDMI; USB-B; Lightning Connector; Thunderbolt; SFP Module
- **common_mistakes** *(NEW)*: Assuming DisplayPort and HDMI plugs are interchangeable without an active adapter; the two standards are electrically different.; Forgetting that DisplayPort can carry embedded audio, then hunting for a separate audio feed that is actually inside the video cable.; Yanking a full-size DisplayPort cable without releasing the latch, which can damage the connector or port.
- **scenario_contexts** *(NEW)*: Connecting a video-playback computer to a large-format display or projector at a live event.; Driving multiple monitors from one GPU output using Multi-Stream Transport daisy-chaining in an edit or mastering suite.; Routing a computer's picture and its system audio to a display's speakers over a single cable during a presentation.
- _sources: VESA, 'About DisplayPort' / 'HDMI vs. DisplayPort' (vesa.org); DisplayPort, Wikipedia (technical overview)_

### EDAC / Elco Connector
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A big rectangular block connector that carries dozens of audio channels through one plug, so a whole console or wall panel connects in a single push instead of plugging in many separate cables.
- **purpose_function** *(NEW)*: A multi-pin rectangular connector family (common counts include 20, 38, 56, 90, and 120 pins) that consolidates many audio pairs into one shell for fast, repeatable mass connection. It exists so large consoles, patchbays, and studio wall panels can be wired once and connected or disconnected as a single unit.
- **practical_application** *(NEW)*: A tech mates a console loom or studio-wall tie line to a stagebox or patchbay through a single EDAC/Elco block, securing it with the actuating screw and lock nut so the multi-pin contacts stay aligned and seated.
- **category** *(NEW)*: Multipin Connectors
- **related_terms** *(NEW)*: Multipin Connector; Patchbay; XLR; DB25 (D-sub); Snake
- **common_mistakes** *(NEW)*: Assuming EDAC and Elco pinouts or shells always match; ranges and wiring conventions vary and must be verified before mating.; Mating or unmating without using the locking screw, which lets pins misalign and bend.; Confusing the many pin-count variants (20/38/56/90/120) and ordering the wrong shell for a given loom.
- **scenario_contexts** *(NEW)*: Wiring a large-format recording console to a machine room or patchbay via a 90-pin loom.; Building a studio wall panel that consolidates many tie lines into one connector for fast reconfiguration.; Fabricating a multichannel analog snake terminated in an EDAC/Elco block instead of individual XLRs.
- _sources: Redco Audio, 'EDAC/ELCO Connectors' (redco.com); Sweetwater InSync, 'Elco (or Edac)' (sweetwater.com); EDAC/ELCO 516-series datasheet listings (Markertek)_

### GPIO
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Simple on/off electrical contacts that let one piece of gear tell another to do something, like flipping an on-air light or starting a player when a fader moves.
- **purpose_function** *(NEW)*: General-purpose input/output ports provide logic-level or contact-closure (dry-contact) connections so audio devices can send and receive simple triggers, tallies, and status signals. They exist to integrate audio systems with external control such as on-air/tally lamps, fader-start, mute triggers, and automation.
- **practical_application** *(NEW)*: A tech wires a console or network I/O unit's GPIO to a red on-air light, a record-start trigger, or a mute relay, mapping each input or output to the desired logic event in the device's control software.
- **category** *(NEW)*: Control I/O
- **related_terms** *(NEW)*: Contact Closure; Dante; Tally; Fader Start; Logic Control
- **common_mistakes** *(NEW)*: Confusing GPIO inputs with outputs, or wiring a dry contact where a voltage-driven logic level is expected (or vice versa).; Assuming a GPIO output can directly switch mains-powered devices; a proper relay or interface rated for that load is required.; Forgetting to map the GPIO pin to a function in software, then expecting the physical contact to work by itself.
- **scenario_contexts** *(NEW)*: Triggering an on-air or recording tally lamp from a broadcast console.; Using fader-start logic so opening a channel launches a playback device.; Sending a contact closure over a Dante or AoIP network to mute a zone or fire an EVAC override.
- _sources: Allen & Heath, 'GPIO' product documentation (allen-heath.com); Solid State Logic, 'A16.D16, A32, D64 and GPIO 32 Network I/O User Guide'; Tieline, 'Jake's Take on GPIOs' (tieline.com)_

### Hirose Connector
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A tiny locking plug used to attach a lavalier or headset mic to a wireless bodypack, small enough to hide but secure enough not to fall off mid-show.
- **purpose_function** *(NEW)*: A family of miniature locking connectors (the 4-pin HRS type is common on wireless bodypacks) that terminates lavalier and headworn microphones to transmitter inputs. It exists to provide a small, secure, keyed connection that carries the mic signal and bias voltage in a rugged, repeatable way.
- **practical_application** *(NEW)*: A tech chooses a lav or headset mic terminated with the correct Hirose plug for a given transmitter brand, or uses an adapter, since pinout and connector type differ between manufacturers such as Audio-Technica, Sennheiser, and Shure.
- **category** *(NEW)*: Microphone Connectors
- **related_terms** *(NEW)*: MicroDot Connector; Lavalier Microphone; Bodypack Transmitter; TA4F (mini-XLR); Wireless Microphone
- **common_mistakes** *(NEW)*: Assuming all bodypack mic connectors are interchangeable; a 4-pin Hirose is not wired the same as a TA4F or a Lemo and can damage gear if forced.; Matching only the connector shape while ignoring the transmitter-specific pinout and bias scheme.; Forcing the plug without seating the locking mechanism, leading to intermittent audio during movement.
- **scenario_contexts** *(NEW)*: Fitting a talent with a concealed lavalier mic on an Audio-Technica bodypack transmitter.; Swapping a headset mic between wireless systems using a manufacturer-specific Hirose-terminated cable or adapter.; Troubleshooting dropouts by reseating a bodypack's locking Hirose connection.
- _sources: Senal, 'UTM-86-HRS / OLM-2 Lavalier with 4-Pin Hirose Connector' compatibility docs (senalsound.com); B&H Photo product documentation for 4-pin Hirose (HRS) lavalier microphones (bhphotovideo.com)_

### LC Connector
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A small snap-in fiber-optic plug, about half the size of the older square type, that clicks in like a phone jack and is the most common fiber connector in use today.
- **purpose_function** *(NEW)*: A small-form-factor (SFF) fiber connector using a 1.25 mm ferrule and a latch-style push-pull retention. It exists to terminate optical fiber at high port density with low insertion loss, and is the dominant modern fiber termination for data, telecom, and audio-over-fiber links.
- **practical_application** *(NEW)*: A tech plugs LC-terminated fiber patch cords into switches, SFP modules, and stageboxes for long-run digital audio transport, keeping the ferrule end caps on and the connector clean until the moment it is mated.
- **category** *(NEW)*: Fiber Optic Connectors
- **related_terms** *(NEW)*: SC Connector; SFP Module; Fiber Optic Cable; Optical Transceiver; Single-mode Fiber
- **common_mistakes** *(NEW)*: Touching or failing to clean the fiber ferrule end-face, which contaminates the link and raises insertion loss.; Mixing single-mode and multimode fiber or transceivers because the LC connector looks identical on both.; Forcing the latch or bending the fiber past its minimum radius, damaging the glass.
- **scenario_contexts** *(NEW)*: Patching a fiber run between a stagebox SFP and a console SFP for digital audio transport.; Connecting network switches in a high-density rack where LC's small size doubles available ports versus SC.; Running a long fiber link front-of-house to stage to avoid copper distance limits and ground issues.
- _sources: Optcore, 'LC vs SC vs MU Connectors' (optcore.net); ShowMeCables, 'Types of Fiber Optic Connectors' (showmecables.com)_

### Lightning Connector
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Apple's small reversible plug used on older iPhones and iPads; you often need an adapter to connect it to a real audio interface or DAC.
- **purpose_function** *(NEW)*: Apple's proprietary 8-pin reversible mobile connector, introduced in 2012, used to connect iOS devices to power and peripherals including audio interfaces and adapters. It exists as a compact, orientation-agnostic replacement for the 30-pin dock connector and gates accessories through an authentication chip.
- **practical_application** *(NEW)*: A tech interfaces an iPhone or iPad to a USB audio device using Apple's Lightning-to-USB Camera Adapter, and plans for charging separately since the single port must handle both power and data.
- **category** *(NEW)*: Digital I/O Connectors
- **related_terms** *(NEW)*: USB-B; DisplayPort; USB-C; DAC; Camera Connection Kit
- **common_mistakes** *(NEW)*: Assuming any USB device plugs straight into Lightning; a Camera Adapter (and sometimes external power) is required.; Relying on uncertified third-party Lightning cables that fail authentication and stop working after an iOS update.; Forgetting Lightning cannot both charge and carry USB audio without the powered version of the adapter.
- **scenario_contexts** *(NEW)*: Connecting an external USB audio interface or DAC to an iPad for mobile recording.; Feeding audio from an iPhone into a system via a Lightning adapter during playback.; Bridging an older iOS device into a USB-based accessory chain that otherwise expects USB-C.
- _sources: Lightning (connector), Wikipedia (specification and history); Crutchfield / Apple Lightning to USB Camera Adapter product documentation (crutchfield.com)_

### MicroDot Connector
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A tiny screw-on coaxial plug used on very small lav and measurement mics, designed to work with a whole family of adapters so one mic can fit many wireless systems.
- **purpose_function** *(NEW)*: A miniature coaxial threaded termination (popularized by DPA) used on subminiature lavalier, headset, and measurement microphones. It exists to provide a very small, standardized mic end that connects to many different wireless transmitters and inputs through interchangeable MicroDot adapters.
- **practical_application** *(NEW)*: A tech pairs a MicroDot-terminated DPA mic with the correct adapter for the transmitter or phantom-power input in use, swapping only the inexpensive adapter rather than buying a new mic when systems change.
- **category** *(NEW)*: Microphone Connectors
- **related_terms** *(NEW)*: Hirose Connector; Lavalier Microphone; Measurement Microphone; Phantom Power; TA5F (Lemo)
- **common_mistakes** *(NEW)*: Using the wrong MicroDot adapter for a given transmitter, which mismatches the pinout and bias voltage.; Over-tightening or cross-threading the small coaxial connector and damaging the delicate contact.; Assuming the mic itself is system-specific when it is actually the adapter that determines compatibility.
- **scenario_contexts** *(NEW)*: Adapting a DPA lavalier from one wireless brand to another by swapping only the MicroDot adapter.; Connecting a MicroDot-terminated mic to a phantom-powered input via a MicroDot-to-XLR adapter.; Fitting a subminiature measurement or headset mic where a full-size connector would be too bulky.
- _sources: DPA Microphones, 'Adapters' / MicroDot adapter system documentation (dpamicrophones.com); Trew Audio, 'DPA MicroDot Adaptors' catalog (trewaudio.com)_

### Multipin Connector
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A general term for any big connector that packs lots of channels into one shell, so you can plug in many signals at once instead of one cable at a time.
- **purpose_function** *(NEW)*: A generic category of high-count circular or rectangular connectors that carry many channels or circuits through a single shell. They exist to speed mass connection and reduce clutter for consoles, snakes, stageboxes, and distribution where individual cables would be slow and bulky.
- **practical_application** *(NEW)*: A tech mates a multichannel loom to a stagebox or console through one multipin shell, always confirming the specific pinout and pin count before connecting since 'multipin' spans many incompatible families.
- **category** *(NEW)*: Multipin Connectors
- **related_terms** *(NEW)*: EDAC / Elco Connector; DB25 (D-sub); Snake; Patchbay; XLR
- **common_mistakes** *(NEW)*: Treating 'multipin' as one standard; it is a category, and pinouts differ between EDAC, Socapex, D-sub, and others.; Mating connectors that fit physically but are wired to different pinouts, causing miswired or damaged signals.; UNSAFE: Assuming an audio-style multipin loom is safe to carry power; power-distribution multipins (e.g., Socapex) carry mains voltage and must never be confused with signal looms.
- **scenario_contexts** *(NEW)*: Connecting a large console to a stagebox or machine room through a single multichannel loom.; Deploying a touring rig where many audio circuits break out from one rugged multipin connector.; Standardizing studio wall panels so entire subsystems connect and disconnect as one unit.
- _sources: Redco Audio, 'EDAC/ELCO Connectors' (redco.com); Whirlwind, '19 Pin Socapex Standard Multipin Connectors' (whirlwindusa.com); Phase 3 Connectors, 'What are Socapex Connectors?' (p3connectors.com)_

### SC Connector
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A square, push-pull fiber plug that clicks in and out; it is larger and older than the LC type and shows up mostly on legacy and telecom fiber gear.
- **purpose_function** *(NEW)*: A fiber connector using a 2.5 mm ferrule and a square push-pull housing with a locking-tab retention, standardized in early telecom specifications. It exists to provide a robust, easy-to-mate fiber termination and is common on legacy and telecom-grade infrastructure.
- **practical_application** *(NEW)*: A tech encounters SC on older patch panels, media converters, and telecom-grade links, and uses SC-to-LC patch cords or the correct SFP interface when integrating that equipment with modern LC-based gear.
- **category** *(NEW)*: Fiber Optic Connectors
- **related_terms** *(NEW)*: LC Connector; SFP Module; Fiber Optic Cable; Optical Transceiver; Multimode Fiber
- **common_mistakes** *(NEW)*: Contaminating the larger 2.5 mm ferrule end-face by leaving it uncapped or touching it.; Mixing single-mode and multimode SC connectors, which look alike but must be matched to the fiber and optics.; Forcing an SC where an LC is required instead of using the correct adapter or patch cord.
- **scenario_contexts** *(NEW)*: Interfacing legacy telecom or building fiber that terminates in SC with newer LC-based audio network gear.; Patching older media converters or fiber panels in an installed AV system.; Documenting and adapting an existing SC fiber backbone during a system upgrade.
- _sources: Optcore, 'LC vs SC vs MU Connectors' (optcore.net); ShowMeCables, 'Types of Fiber Optic Connectors' (showmecables.com)_

### SFP Module
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A small snap-in adapter that slots into a switch or stagebox so the same port can use fiber or copper just by swapping the module, and it can be changed while the gear is powered.
- **purpose_function** *(NEW)*: A small-form-factor pluggable (SFP) is a compact, hot-swappable transceiver, defined by a multi-source agreement (MSA) rather than a single standards body, that plugs into a switch or device slot to convert electrical signals to a chosen media. It exists so one piece of networking or audio hardware can support different fiber or copper media by changing only the module.
- **practical_application** *(NEW)*: A tech selects matching SFP transceivers (media type, wavelength, and distance rating) for both ends of a link and hot-inserts them into console, switch, or stagebox cages, accepting a brief loss of that port's connectivity during the swap.
- **category** *(NEW)*: Network Hardware
- **related_terms** *(NEW)*: LC Connector; SC Connector; Optical Transceiver; Dante; Fiber Optic Cable
- **common_mistakes** *(NEW)*: Mismatching SFPs between link ends (fiber type, wavelength, or reach), so the connection will not establish.; Assuming a switch accepts any brand; some enforce vendor coding despite the MSA form factor.; UNSAFE: Staring into an SFP's optical port or fiber end; active transceivers can emit invisible laser light that harms the eye.
- **scenario_contexts** *(NEW)*: Fitting fiber SFPs into a Dante or AVB switch and stagebox to run a long optical audio link.; Choosing a copper (RJ45) SFP to bridge a short run where fiber is unnecessary.; Hot-swapping a failed transceiver in a live rig while the rest of the network keeps running.
- _sources: Small Form-factor Pluggable, Wikipedia (MSA, hot-swap definition); Cisco, 'SFP Transceiver Module Installation Notes' (cisco.com); Perle, 'SFP Optical Transceiver' documentation (perle.com)_

### USB-B
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The squarish 'printer-style' USB plug found on the back of many audio interfaces and controllers; it goes into the device while the flat USB-A or USB-C end goes to the computer.
- **purpose_function** *(NEW)*: A near-square USB connector that serves as the upstream (device-side) port in a host-to-peripheral USB link, with a keyed shape that prevents backwards insertion. It exists to provide a rugged, standardized peripheral-side connector still widely used on audio interfaces, mixers, and controllers.
- **practical_application** *(NEW)*: A tech connects an audio interface or MIDI controller to a computer with a USB-B-to-A (or -C) cable, seating the squarish end firmly in the device since a loose or worn USB-B port is a common cause of dropouts.
- **category** *(NEW)*: Digital I/O Connectors
- **related_terms** *(NEW)*: USB-C; Lightning Connector; DisplayPort; MIDI; Audio Interface
- **common_mistakes** *(NEW)*: Confusing the taller USB 3.0 Type-B shell with the standard USB 2.0 Type-B and forcing the wrong cable.; Assuming USB-B is upstream/host-capable; it is the device-side port and connects to a host such as USB-A or USB-C.; Using a marginal or damaged USB-B cable and blaming the interface for intermittent audio dropouts.
- **scenario_contexts** *(NEW)*: Connecting a desktop audio interface to a laptop for recording.; Hooking a MIDI keyboard or control surface to a DAW computer.; Replacing a worn cable when an interface's squarish USB-B port develops an intermittent connection.
- _sources: Sweetwater InSync, 'USB Type B Connection' (sweetwater.com); USB hardware, Wikipedia (Type-B connector, upstream port role)_


## MUSI190 — Dynamics Processing
*6 terms*

### Dual-Mono Processing
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Each side of a stereo signal gets its own compressor that reacts on its own, so the left and right can be squeezed by different amounts.
- **purpose_function** *(NEW)*: It exists to give maximum independent control over each channel and can add perceived stereo width, at the cost of allowing the stereo image to wander when the two sides are compressed unequally.
- **practical_application** *(NEW)*: A mix engineer might run drum overheads or a stereo pair in dual-mono to widen the image, while avoiding it on tightly centered material where image shift would be distracting.
- **category** *(NEW)*: Dynamics Processing
- **related_terms** *(NEW)*: Stereo Link; Compression; Sidechain; Gain Reduction; Threshold
- **common_mistakes** *(NEW)*: Assuming dual-mono always sounds 'wider and better' without noticing the center image drifting when a loud transient hits only one side; Using dual-mono on a mix bus where a strong one-sided event pulls center-panned vocals or kick off-center; Confusing dual-mono processing with mid/side processing, which are different splits of the signal
- **scenario_contexts** *(NEW)*: Widening a stereo drum overhead pair by letting each side breathe independently; Mastering a stereo file where independent per-channel control is wanted despite image risk; Processing a stereo synth pad to emphasize left/right movement
- _sources: Sound on Sound - Compressor and stereo processing articles; Nail The Mix - How To Unlink Compressor Channels For Wider Mixes; LedgerNote - How Do Analog Stereo Compressors Work_

### Feed-Forward Detection
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The compressor listens to the signal coming in, before it does any squeezing, so its controls behave predictably no matter how hard it is working.
- **purpose_function** *(NEW)*: By reading the uncompressed input, the detector can act quickly and consistently, giving punchy, accurate control where a set attack time means what it says regardless of how much gain reduction is applied.
- **practical_application** *(NEW)*: A tech reaches for a feed-forward compressor like an SSL bus compressor when they want tight, predictable transient control on drums or a mix bus.
- **category** *(NEW)*: Dynamics Processing
- **related_terms** *(NEW)*: Feedback Detection; VCA; Attack Time; Detector; Compression
- **common_mistakes** *(NEW)*: Assuming feed-forward is simply 'better' than feedback, rather than a different, more precise character; Not realizing that feed-forward designs need separate threshold, attack, and release circuitry to shape the response; Expecting the smooth, self-limiting feel of a vintage feedback unit from a fast feed-forward VCA compressor
- **scenario_contexts** *(NEW)*: Choosing a modern VCA compressor for punchy drum-bus control; Setting a precise attack time on a feed-forward limiter and trusting it holds across gain-reduction amounts; Comparing an SSL-style bus compressor against a vintage feedback design
- _sources: Sound on Sound - Compressor Topology; MyNewMicrophone - Feedback Vs Feed-Forward Dynamic Range Compressors; SonicScoop - Feedback Vs Feed-Forward Compression_

### Feedback Detection
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The compressor listens to its own output after squeezing, which makes it correct itself gently and sound smooth and forgiving.
- **purpose_function** *(NEW)*: Reading the already-compressed output makes the detector react to a signal that has mostly settled, producing self-smoothing, 'musical' gain reduction that resists over-compression, a hallmark of many vintage designs.
- **practical_application** *(NEW)*: An engineer chooses a feedback-style compressor like an 1176 or LA-2A when they want smooth, glue-like leveling on vocals or a bus rather than surgical transient control.
- **category** *(NEW)*: Dynamics Processing
- **related_terms** *(NEW)*: Feed-Forward Detection; Detector; Compression; Program-Dependent Release; Attack Time
- **common_mistakes** *(NEW)*: Expecting a set attack time to stay constant, when in a feedback design the effective attack slows as gain reduction increases because the detector reads a quieter signal; Assuming vintage 'feedback' units are inaccurate rather than intentionally smooth; Trying to use a feedback compressor for precise brickwall peak control it isn't designed for
- **scenario_contexts** *(NEW)*: Smoothing a lead vocal with a vintage-style feedback compressor; Applying gentle glue to a mix bus with a forgiving, self-smoothing unit; Comparing the reaction character of a classic opto/FET unit against a modern VCA design
- _sources: Sound on Sound - Compressor Topology; MyNewMicrophone - Feedback Vs Feed-Forward Dynamic Range Compressors; SonicScoop - Feedback Vs Feed-Forward Compression_

### Overshoot
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A quick blip of level that sneaks past the limiter's ceiling because the limiter can't clamp down truly instantly.
- **purpose_function** *(NEW)*: Overshoot describes the unavoidable brief excursion above the set ceiling that occurs before gain reduction fully engages, which is why look-ahead, oversampling, and true-peak detection exist to minimize it.
- **practical_application** *(NEW)*: A mastering engineer lowers the ceiling and enables look-ahead and true-peak limiting to keep fast transients from overshooting and causing inter-sample clipping on the final file.
- **category** *(NEW)*: Dynamics Processing
- **related_terms** *(NEW)*: Limiter; Attack Time; True Peak; Ceiling; Look-Ahead
- **common_mistakes** *(NEW)*: Assuming a limiter set to 0 dBFS guarantees nothing exceeds it, ignoring overshoot and inter-sample peaks; Setting attack too slow (or lookahead too short) and letting transients punch past the ceiling; Forgetting that D/A conversion can reveal inter-sample peaks even when sample values look under the ceiling
- **scenario_contexts** *(NEW)*: Catching stray transient overs on a mastered track before delivery; Setting a -1.0 dBFS ceiling with true-peak limiting to prevent inter-sample overshoot; Diagnosing distortion after export caused by peaks that overshot the limiter
- _sources: iZotope - An Introduction to Limiters; FabFilter Pro-L 2 Help - Advanced Settings; Sage Audio - Limiter Masterclass_

### Program-Dependent Release
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The compressor automatically changes how fast it lets go depending on the music, releasing quickly after short peaks and slowly after sustained loud passages.
- **purpose_function** *(NEW)*: By adapting the release time to the signal's level and content, it blends fast and slow recovery to reduce artifacts like pumping and distortion while keeping the leveling natural.
- **practical_application** *(NEW)*: An engineer relies on program-dependent (auto) release on complex material like a full mix or dynamic vocal so the compressor tracks the performance without manual release tweaking.
- **category** *(NEW)*: Dynamics Processing
- **related_terms** *(NEW)*: Release Time; Compression; Feedback Detection; Pumping; Time Constant
- **common_mistakes** *(NEW)*: Assuming auto/program-dependent release removes the need to understand release entirely, when it still has a characteristic range; Expecting identical behavior across units, since implementations use different time-constant blends; Blaming a program-dependent compressor for pumping that actually comes from another stage in the chain
- **scenario_contexts** *(NEW)*: Compressing a full mix bus where signal content varies moment to moment; Leveling a dynamic vocal without chasing manual release settings; Using a classic unit like an LA-2A whose opto cell gives inherent program-dependent recovery
- _sources: Sweetwater InSync - Program-dependent Release; Sound on Sound - What does a compressor's auto-release control do; Korneff Audio - Understanding Compressor Release Time_

### Stereo Link
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The compressor squeezes the left and right channels by the exact same amount at the same time, so the stereo picture stays put instead of sliding side to side.
- **purpose_function** *(NEW)*: It exists to preserve the stereo image by driving both channels from one common detector, usually the louder channel or the sum, so a loud event on one side doesn't pull the image off-center.
- **practical_application** *(NEW)*: An engineer engages stereo link (or 'couples' two mono units) on a stereo bus or mastering compressor so gain reduction stays balanced and the center image is stable.
- **category** *(NEW)*: Dynamics Processing
- **related_terms** *(NEW)*: Dual-Mono Processing; Compression; Sidechain; Gain Reduction; Stereo Bus
- **common_mistakes** *(NEW)*: Leaving a stereo compressor unlinked (dual-mono) on the mix bus and letting center-panned elements wander; Assuming stereo link never affects width, when it deliberately trades some width for a stable image; Not high-pass filtering the link/sidechain, so heavy low end on one side clamps both channels too hard
- **scenario_contexts** *(NEW)*: Compressing the stereo master bus while keeping the image locked; Coupling two mono compressors for stereo program material; Using a variable link percentage (e.g., API 2500) to balance width against image stability
- _sources: Nail The Mix - How To Unlink Compressor Channels For Wider Mixes; LedgerNote - How Do Analog Stereo Compressors Work; Sound on Sound - Compression and stereo linking articles_


## MUSI190 — Equalization (EQ)
*5 terms*

### Band Solo
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: It lets you listen to only the slice of sound one EQ band is working on, so you can hear the problem frequency by itself before deciding to cut or boost it.
- **purpose_function** *(NEW)*: It isolates the frequency range covered by a single EQ band so an engineer can pinpoint resonances, sibilance, or muddiness quickly and accurately instead of sweeping blindly.
- **practical_application** *(NEW)*: An engineer holds the band's solo/listen button and drags it across the spectrum until the offending ring or harshness stands out, then places a cut exactly there.
- **category** *(NEW)*: Equalization
- **related_terms** *(NEW)*: Parametric EQ; Q (Bandwidth); Bell Filter; Resonance Suppressor; Sweepable EQ; Notch Filter
- **common_mistakes** *(NEW)*: Confusing band solo (which auditions only the frequency range affected by that band) with soloing the whole channel; Using boost-and-sweep to find a frequency and then leaving an unnecessary boost in place; Assuming anything that sounds bad in solo must be cut, ignoring how it actually sits in the full mix; Forgetting to disengage solo before printing or bouncing
- **scenario_contexts** *(NEW)*: Hunting a ringing resonance on a snare drum; Finding the exact sibilant band on a lead vocal; Isolating a feedback or room-mode frequency in live sound; Locating muddy build-up around 200-400 Hz on an acoustic guitar
- _sources: FabFilter Pro-Q 4 Help - Solo (fabfilter.com); FabFilter Pro-Q 3 Manual (fabfilter.com)_

### Cramped EQ (Frequency Cramping)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: In some digital EQs, boosts near the top of the audible range get squashed and harsher-sounding, because the math forces the curve to unity gain at the sampling limit, so the bell can no longer stay symmetrical.
- **purpose_function** *(NEW)*: The term names an artifact rather than a tool: it describes how a standard bilinear-transform digital filter warps high-frequency bell and shelf shapes as they approach Nyquist, which designers counter with oversampling or analog-matched (decramped) filter designs.
- **practical_application** *(NEW)*: An engineer who hears a high bell or shelf turning harsh and asymmetric on a 44.1 kHz session switches to an oversampled or analog-matched EQ mode, or works at a higher sample rate, to restore a smoother, more symmetrical curve.
- **category** *(NEW)*: Equalization
- **related_terms** *(NEW)*: Bilinear Transform; Nyquist Frequency; Oversampling; Bell Filter; High-Shelf Filter; Parametric EQ
- **common_mistakes** *(NEW)*: Believing all digital EQs cramp equally, when analog-matched or oversampled designs largely avoid it; Blaming the source or converters for harshness that is actually filter cramping near Nyquist; Assuming oversampling also fixes the phase warping, when it primarily corrects the magnitude response; Thinking cramping affects low and mid bands, when it only appears as a band's center approaches Nyquist
- **scenario_contexts** *(NEW)*: Boosting air/presence around 12-16 kHz at 44.1 kHz and hearing an unexpectedly narrow, harsh peak; A/B comparing a native digital EQ against an analog-matched version on the same high shelf; Deciding whether to enable oversampling on a mastering EQ; Working at 88.2 or 96 kHz to push cramping artifacts well above the audio band
- _sources: Production Expert - What Is EQ Cramping And Should You Care? (production-expert.com); vladg/sound - A classification of digital equalizers (vladgsound.wordpress.com)_

### Fixed-Frequency EQ
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An EQ where each band boosts or cuts at a frequency the designer already chose; you decide how much, but not where.
- **purpose_function** *(NEW)*: It offers fast, repeatable tone-shaping at musically useful preset points, which is why it appears on vintage consoles, channel strips, and simple tone controls where speed and consistency matter more than surgical targeting.
- **practical_application** *(NEW)*: On a vintage console channel a tech simply turns a fixed high or low band up or down; on classic units such as a Pultec, the center frequency is chosen from a stepped selector rather than swept continuously.
- **category** *(NEW)*: Equalization
- **related_terms** *(NEW)*: Semi-Parametric EQ; Parametric EQ; Graphic EQ; Shelving Filter; Baxandall EQ; Channel Strip
- **common_mistakes** *(NEW)*: Expecting to sweep the center frequency, when fixed-frequency bands only change gain (or select from stepped presets); Confusing fixed-frequency EQ with a graphic EQ; Assuming the preset frequencies are wrong when a small move at a nearby band solves the problem; Using large boosts to compensate for not being able to target the exact frequency
- **scenario_contexts** *(NEW)*: Quick tone tweaks on a vintage or budget console channel; Adding air or trimming low end with a two-knob channel tone section; Using a Pultec-style unit with stepped frequency selection; Live-sound input strips with fixed HF/LF bands for fast setup
- _sources: Sweetwater InSync - Sweepable EQ (sweetwater.com); Behind The Mixer - Do You Really Know Your Channel EQ Controls? (behindthemixer.com)_

### Resonance Suppressor
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An automatic tool that constantly watches the sound and clamps down on any narrow frequency that starts ringing or sticking out, only for as long as it is a problem, then lets go.
- **purpose_function** *(NEW)*: It exists to tame harsh or resonant peaks such as fizz, sibilance, or boxy ring transparently, applying gain reduction only when and where a resonance appears so it avoids the static tone loss of a permanent cut.
- **practical_application** *(NEW)*: An engineer inserts one on a vocal, acoustic guitar, or drum overheads and sets a depth/sensitivity so it automatically pulls down harsh resonances without dulling the whole track, often replacing manual notching and de-essing.
- **category** *(NEW)*: Equalization
- **related_terms** *(NEW)*: Dynamic EQ; Band Solo; Notch Filter; De-Esser; Parametric EQ; Q (Bandwidth)
- **common_mistakes** *(NEW)*: Setting the depth too aggressively so the source sounds dull and lifeless; Treating it as a substitute for fixing tone at the source with mic choice and placement; Confusing it with a static multi-band EQ, when it only acts while a resonance is ringing; Leaving it working hard across a whole mix instead of targeting specific problem tracks
- **scenario_contexts** *(NEW)*: Taming harsh vocal resonances and sibilance without a separate de-esser; Controlling a ringy snare or cymbal fizz on drum overheads; Smoothing harsh overtones on distorted or acoustic guitar; De-harshing a bright mix or master
- _sources: oeksound soothe2 - dynamic resonance suppressor product documentation (oeksound.com); MixingGPT - Soothe 3 vs FabFilter Pro-Q 4: Dynamic Resonance Suppression vs Dynamic EQ (mixinggpt.com)_

### Semi-Parametric EQ
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An EQ band where you choose the frequency and how much to boost or cut, but the width of the affected area is fixed for you.
- **purpose_function** *(NEW)*: It gives more targeting than a fixed tone control by letting you sweep the center frequency, while staying simpler and faster than full parametric, which is why it is the standard mid band on many live and budget consoles.
- **practical_application** *(NEW)*: On a console mid band an engineer sweeps to find the frequency, often boosting first to locate a problem and then cutting, and sets the amount while accepting the preset bandwidth.
- **category** *(NEW)*: Equalization
- **related_terms** *(NEW)*: Parametric EQ; Fixed-Frequency EQ; Q (Bandwidth); Sweepable EQ; Bell Filter; Channel Strip
- **common_mistakes** *(NEW)*: Expecting a Q/bandwidth control, when semi-parametric fixes the width for you; Leaving a boost in place after boost-sweeping to find a problem frequency; Calling any sweepable EQ fully parametric; Trying to make a surgical narrow notch when the fixed Q is too broad for it
- **scenario_contexts** *(NEW)*: Dialing the swept mid on a live console input channel; Carving boxiness on a bass amp's semi-parametric mid; Quick tone-shaping on a budget studio channel strip; Ringing out a problem midrange frequency during soundcheck
- _sources: Sweetwater InSync - Sweepable EQ (sweetwater.com); Behind The Mixer - Do You Really Know Your Channel EQ Controls? (behindthemixer.com)_


## MUSI190 — Grounding & Electrical  ⚠️ SAFETY-CRITICAL
*13 terms*

### Ampacity
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: How much electric current a wire can carry continuously without overheating. Thicker wire and better insulation carry more; a hot environment or bundling many cables together carries less.
- **purpose_function** *(NEW)*: Ampacity sets the safe continuous-current limit for a conductor so heat from its resistance never degrades insulation or starts a fire, and it is the basis for matching wire size to its overcurrent device.
- **practical_application** *(NEW)*: A tech uses ampacity ratings to pick the correct gauge of extension or feeder cable for an amp rack or lighting run and to confirm a circuit's breaker or fuse matches the wire it protects.
- **category** *(NEW)*: Electrical Fundamentals
- **related_terms** *(NEW)*: Feeder Cable; Fuse; Breaker Panel (Service Panel); Dedicated Circuit; Power Distro
- **common_mistakes** *(NEW)*: Assuming ampacity is fixed by wire gauge alone, ignoring derating for high ambient temperature or for bundling many current-carrying conductors together.; UNSAFE: Running a cable at or near its rated load while it is tightly coiled on a reel or covered by a rug, trapping heat so insulation overheats or ignites.; Confusing a conductor's insulation temperature rating (e.g., 90C wire) with usable ampacity, which per NEC 110.14(C) is limited by the lowest-rated termination, often 60C or 75C.; UNSAFE: Protecting an undersized conductor with an oversized breaker, so the wire can overheat before the device trips.
- **scenario_contexts** *(NEW)*: Selecting 12 AWG versus 14 AWG for a 20 A stage-power drop.; Derating feeder ampacity when several sets run bundled through a hot cable trough outdoors in summer.; Verifying that a 4/0 feeder is adequate for a distro's rated service before a tie-in.
- _sources: NFPA 70 (NEC) Article 310, Table 310.16 ampacity of insulated conductors; NFPA 70 (NEC) 110.14(C) termination temperature-limitation rule; Handbook for Sound Engineers (Ballou) — power and grounding chapter_

### Breaker Panel (Service Panel)
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The metal box where the building's power comes in and gets split into individual circuits, each with its own breaker switch that shuts off if that circuit is overloaded or faults.
- **purpose_function** *(NEW)*: It divides incoming service power into protected branch circuits and provides a single place to de-energize or reset each circuit, protecting the wiring from overcurrent.
- **practical_application** *(NEW)*: A tech uses the panel to find and label the breaker feeding a stage or studio circuit, to reset a tripped breaker, and to confirm spare circuits are available before adding load.
- **category** *(NEW)*: Power Distribution
- **related_terms** *(NEW)*: Fuse; Dedicated Circuit; Ampacity; Power Distro; Ground Rod
- **common_mistakes** *(NEW)*: UNSAFE: Opening or working inside a live panel without lockout/tagout, NFPA 70E-rated PPE, and de-energizing; the line side of the main stays energized even with the main breaker off.; Repeatedly resetting a breaker that keeps tripping instead of finding the overload or fault causing it.; UNSAFE: Replacing a nuisance-tripping breaker with a higher-amperage one, which defeats the overcurrent protection the branch wiring depends on.; Assuming that turning off one branch breaker makes the whole panel safe to touch.
- **scenario_contexts** *(NEW)*: Finding and resetting the breaker after a stage circuit trips during a show.; Labeling panel circuits during a studio install so audio outlets are identifiable.; Confirming a spare 20 A circuit is available before plugging in a new amp rack.
- _sources: NFPA 70 (NEC) Article 408 switchboards and panelboards; Article 240 overcurrent protection; NFPA 70E Standard for Electrical Safety in the Workplace (lockout/tagout, PPE, energized-work rules); OSHA 29 CFR 1910.333 selection and use of work practices (de-energizing, LOTO)_

### Camlock
*difficulty: advanced · confidence: Medium*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A heavy-duty single-wire twist-lock connector used to hook up big touring power cables one conductor at a time, color-coded so ground, neutral, and each hot leg get matched correctly.
- **purpose_function** *(NEW)*: Camlocks let high-amperage feeder conductors be connected individually and securely between a power source, company switch, and distro, using insulated locking contacts rated for hundreds of amps.
- **practical_application** *(NEW)*: During a tie-in a tech makes and breaks camlocks dead and in a strict order, matching colors to legs, and energizes the distro only after every connection is seated and verified.
- **category** *(NEW)*: Power Distribution
- **related_terms** *(NEW)*: Feeder Cable; Power Distro; Phase Rotation; Ampacity; Portable Generator (Genset)
- **common_mistakes** *(NEW)*: UNSAFE: Connecting or disconnecting camlocks under load or with the source live; make/break must be done dead, connecting ground first, then neutral, then hots, and disconnecting hots first.; UNSAFE: Intermixing connector series or brands (e.g., Series 15 with Series 16) or using worn/pitted contacts, which can arc, overheat, or separate under load.; Assuming the color code is legally mandated; green ground, white neutral, and black/red/blue hots are an industry convention, not an NEC-guaranteed standard, so legs must still be verified.; UNSAFE: Leaving connected contacts partially seated or exposed where they can be touched or shorted instead of fully engaging the insulated shrouds.
- **scenario_contexts** *(NEW)*: Tying a touring distro into a venue's company switch.; Connecting 4/0 feeder from a generator to a distro at an outdoor festival.; Inspecting camlock ends for pitting or heat damage before a tour load-in.
- _sources: Eaton Crouse-Hinds Cam-Lok single-pole connector catalog and application data; Larson Electronics / Lex Products entertainment feeder and single-pole connector documentation; UL 1691 (single-pole locking-type connectors); NEC Art. 400 & 520 (portable power / theatrical)_

### Dedicated Circuit
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An outlet or set of outlets fed by its own breaker and used by only one system, so other equipment can't dump electrical noise onto it or trip its breaker.
- **purpose_function** *(NEW)*: It isolates a sensitive load such as an audio rack on its own branch circuit so it receives clean, reliable power free of noise and nuisance trips from unrelated equipment.
- **practical_application** *(NEW)*: A studio or FOH tech requests dedicated circuits for audio gear to avoid hum and to keep lighting, HVAC, or motors from tripping the audio power or coupling noise into it.
- **category** *(NEW)*: Power Distribution
- **related_terms** *(NEW)*: Breaker Panel (Service Panel); Ampacity; Ground Rod; Power Distro; Outlet Tester
- **common_mistakes** *(NEW)*: Believing a dedicated circuit means a separate or isolated safety ground; it still bonds to the same system ground, and the equipment grounding conductor must never be lifted.; UNSAFE: Lifting the safety ground with a cheater adapter or clipped pin to kill hum instead of fixing the grounding scheme, creating a shock and hot-chassis hazard.; Overloading a single dedicated circuit with more gear than its ampacity allows.; Assuming several receptacles on one power strip are 'dedicated' when they actually share a single branch breaker.
- **scenario_contexts** *(NEW)*: Speccing dedicated 20 A circuits for a control room's audio racks during a studio build.; Requesting a dedicated audio circuit at a venue so lighting dimmers don't inject noise.; Diagnosing a buzz that appears only when HVAC or lighting shares the audio circuit.
- _sources: NFPA 70 (NEC) Article 210 branch circuits; 250.6 objectionable current; 406 receptacles; Rane technical note 'Sound System Interconnection' (grounding and noise); Yamaha Sound Reinforcement Handbook — power and grounding_

### Direct Current (DC)
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Electricity that flows steadily in one direction, like from a battery, as opposed to the back-and-forth alternating current from a wall outlet.
- **purpose_function** *(NEW)*: DC provides the constant, stable low voltages that electronic circuits, phantom power, and portable or battery-powered gear need to operate.
- **practical_application** *(NEW)*: Techs meet DC in pedal and wireless power supplies, 48V phantom power for condenser mics, battery-powered gear, and the internal supply rails of mixers and amplifiers.
- **category** *(NEW)*: Electrical Fundamentals
- **related_terms** *(NEW)*: Alternating Current (AC); Phantom Power; Fuse; Relay; Ampacity
- **common_mistakes** *(NEW)*: Confusing a DC supply's voltage rating (e.g., 9V, 12V, 48V) with AC line voltage or assuming DC supplies are interchangeable by voltage alone.; Ignoring DC polarity; reversing plus and minus on a pedal or device (center-positive vs center-negative) can destroy it.; UNSAFE: Assuming DC is always harmless; high-current DC from large battery banks or amplifier rails can arc, burn, and cause dangerous shorts.; Thinking phantom power is AC when it is 48V DC delivered over the balanced mic line.
- **scenario_contexts** *(NEW)*: Powering a stompbox with a center-negative 9V DC supply.; Supplying 48V DC phantom power to a condenser microphone.; Running a wireless rack or mixer from a DC battery system for remote recording.
- _sources: Handbook for Sound Engineers (Ballou) — electrical fundamentals; IEC 61938 / AES phantom power (48V DC) specifications; Yamaha Sound Reinforcement Handbook — electricity basics_

### Feeder Cable
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The big, thick cables that carry a lot of power from the source or company switch to a distribution box, usually one heavy single-conductor cable per leg.
- **purpose_function** *(NEW)*: Feeder carries full service current from the power source to the distro using conductors large enough to handle the load safely over distance with acceptable voltage drop.
- **practical_application** *(NEW)*: Techs run and connect single-conductor feeder (commonly 2 AWG to 4/0 Type W or SC cable with camlock ends) between a company switch or generator and the distro, matching colors to legs.
- **category** *(NEW)*: Power Distribution
- **related_terms** *(NEW)*: Camlock; Power Distro; Ampacity; Portable Generator (Genset); Phase Rotation
- **common_mistakes** *(NEW)*: UNSAFE: Running or handling feeder while it is energized; connections must be made and broken dead.; UNSAFE: Leaving feeder coiled on a reel under heavy load, trapping heat and reducing ampacity until insulation is damaged.; Undersizing feeder for the load and run length, causing excessive voltage drop and overheating.; UNSAFE: Failing to protect feeder runs from foot and vehicle traffic and water with cable ramps and proper routing, risking crushed insulation and shock.
- **scenario_contexts** *(NEW)*: Pulling 4/0 feeder from the company switch to FOH and stage distros at a concert.; Connecting generator output to a distro via banded feeder sets at an outdoor event.; Calculating conductor size for a long feeder run to keep voltage drop acceptable.
- _sources: NFPA 70 (NEC) Article 400 flexible cords and cables (Type W, Type SC); Article 520 theatrical/portable power; Lex Products 'Specification of Feeder Cables' technical documentation; NFPA 70 (NEC) Table 310.16 / 400.5 ampacity for portable cable_

### Fuse
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A small sacrificial link that melts and cuts the power when too much current flows, protecting the equipment and wiring from damage or fire.
- **purpose_function** *(NEW)*: A fuse opens a circuit on overcurrent by melting its element, stopping current before excess heat can damage conductors or equipment.
- **practical_application** *(NEW)*: Techs replace a blown fuse in a mains inlet, amplifier, or power supply with the exact same rating and type, and treat a repeatedly blowing fuse as a fault to investigate rather than defeat.
- **category** *(NEW)*: Circuit Protection
- **related_terms** *(NEW)*: Breaker Panel (Service Panel); Ampacity; Relay; Direct Current (DC); Power Distro
- **common_mistakes** *(NEW)*: UNSAFE: Replacing a fuse with a higher-rated one or bridging it with foil or wire to stop it blowing, which removes overcurrent protection and risks fire.; Using the wrong type (fast-blo vs slow-blo/anti-surge, or wrong voltage rating) even when the amperage matches.; UNSAFE: Changing a fuse without first unplugging the equipment from mains.; Repeatedly replacing a blowing fuse instead of finding the underlying fault.
- **scenario_contexts** *(NEW)*: Replacing the mains fuse in the IEC inlet of a powered speaker.; Troubleshooting an amplifier that blows its rail fuse on power-up.; Checking a tube amp's HT fuse rating against the manufacturer's schematic.
- _sources: IEC 60127 miniature fuses / UL 248 low-voltage fuses standards; NFPA 70 (NEC) Article 240 overcurrent protection; Handbook for Sound Engineers (Ballou) — equipment power protection_

### Ground Rod
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A metal rod driven deep into the earth and connected to the electrical system so the system shares earth's electrical reference, mainly for lightning and surge safety.
- **purpose_function** *(NEW)*: It bonds the electrical system to earth to stabilize voltage relative to ground and give lightning and high-voltage surges a path to earth; it does not by itself clear ordinary circuit faults.
- **practical_application** *(NEW)*: Techs may drive or connect a ground rod for a generator or temporary service per code, but they rely on the equipment grounding conductor, not the earth, to clear faults and trip breakers.
- **category** *(NEW)*: Grounding & Bonding
- **related_terms** *(NEW)*: Portable Generator (Genset); Dedicated Circuit; Breaker Panel (Service Panel); Outlet Tester; Phase Rotation
- **common_mistakes** *(NEW)*: UNSAFE: Believing a ground rod alone clears faults or protects people; fault current returns through the bonded equipment grounding conductor, and earth is far too high in resistance to trip a breaker.; UNSAFE: Using a ground rod as a substitute for bonding the grounded (neutral) conductor, or lifting the safety ground because 'the rod grounds it.'; Assuming any rod meets code; NEC requires a minimum 8 ft in contact with earth, and a single rod must be supplemented by a second electrode unless its resistance to earth is 25 ohms or less.; Confusing earthing (the ground rod) with equipment bonding; they serve different safety purposes.
- **scenario_contexts** *(NEW)*: Driving a ground rod for a portable generator supplying a separately derived system per NEC 250.; Grounding a temporary service or tent power distribution at an outdoor event.; Explaining why a ground rod does not fix audio hum or replace the equipment safety ground.
- _sources: NFPA 70 (NEC) 250.52/250.53 grounding electrodes (8 ft in contact, 25-ohm single-rod supplement rule); NFPA 70 (NEC) 250.4 general requirements (earthing vs bonding; fault-current path); IEEE Std 142 (Green Book) Grounding of Industrial and Commercial Power Systems_

### Outlet Tester
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A plug-in gadget with lights that quickly shows whether an outlet's hot, neutral, and ground wires are present and in the right places.
- **purpose_function** *(NEW)*: It gives a fast go/no-go check of receptacle wiring (open ground, open neutral, reversed hot-neutral, etc.) before you plug gear in.
- **practical_application** *(NEW)*: A tech plugs one into stage and studio outlets during setup to catch miswired or ungrounded receptacles before connecting expensive or safety-critical equipment.
- **category** *(NEW)*: Test & Measurement
- **related_terms** *(NEW)*: Dedicated Circuit; Ground Rod; Breaker Panel (Service Panel); Fuse; Power Distro
- **common_mistakes** *(NEW)*: UNSAFE: Trusting a three-light tester as proof an outlet is safe; it cannot detect a reverse-polarity bootleg ground, which reads 'correct' yet can energize equipment chassis with a lethal hot-skin voltage.; Assuming the tester confirms ground quality or impedance; it only checks presence and arrangement, not connection integrity or a true earth reference.; Believing the tester's GFCI test button replaces a receptacle's own GFCI protection or a proper trip test.; Reading only the single indicated fault when multiple wiring faults can exist but only one is displayed.
- **scenario_contexts** *(NEW)*: Checking every stage receptacle at load-in before connecting a backline.; Verifying studio outlets after an electrician's work.; Catching an open ground on a venue outlet before plugging in a mixing console.
- _sources: EC&M / IAEI technical articles on three-light receptacle tester limitations and reverse-polarity bootleg grounds; NFPA 70 (NEC) 406.4/210.7 receptacle grounding and wiring requirements; UL 1436 outlet circuit testers and GFCI test instruments_

### Phase Rotation
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The order in which the three hot legs of a three-phase supply reach their peaks (A-B-C or reversed). Getting it backwards makes three-phase motors spin the wrong way.
- **purpose_function** *(NEW)*: Correct phase rotation ensures three-phase motorized equipment runs in the intended direction; verifying it before energizing prevents equipment damage and unsafe motor operation.
- **practical_application** *(NEW)*: Before energizing loads after a three-phase tie-in, a tech checks rotation with a phase-sequence meter and, if reversed, de-energizes and swaps two legs to correct it.
- **category** *(NEW)*: Power Distribution
- **related_terms** *(NEW)*: Camlock; Feeder Cable; Power Distro; Portable Generator (Genset); Ampacity
- **common_mistakes** *(NEW)*: UNSAFE: Swapping phase legs to correct rotation while the system is energized; de-energize before changing any connection.; Never verifying rotation on a new tie-in or generator, then damaging motors, chain hoists, or HVAC that run backward.; Confusing phase rotation (the sequence of the three phases) with polarity or with single-phase hot/neutral orientation.; Assuming two sources or distros share the same rotation without checking before paralleling or cross-patching them.
- **scenario_contexts** *(NEW)*: Checking rotation with a sequence meter after tying into a venue's three-phase company switch.; Verifying a generator's rotation before connecting motorized rigging or chain hoists.; Correcting reversed rotation that makes a three-phase HVAC unit or motor run backward.
- _sources: NFPA 70 (NEC) 445.18 / 409 and Article 520 (order of connection and phase arrangement); IEEE Std 141 (Red Book) Electric Power Distribution for Industrial Plants (phase sequence); Amprobe/Megger phase-sequence indicator application and manufacturer documentation_

### Portable Generator (Genset)
*difficulty: intermediate · confidence: Medium*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An engine-driven machine that makes its own electricity for events where there's no building power, needing careful grounding, fueling, and exhaust handling.
- **purpose_function** *(NEW)*: It supplies temporary AC power for events, requiring correct bonding/grounding, balanced loading, and safe fuel and exhaust management to power gear reliably and safely.
- **practical_application** *(NEW)*: Techs size the genset to the load, connect feeder and distro via camlocks, ground and bond it per NEC 250.34, and keep it outdoors clear of intakes with refueling done only when off and cool.
- **category** *(NEW)*: Power Distribution
- **related_terms** *(NEW)*: Feeder Cable; Camlock; Power Distro; Ground Rod; Phase Rotation
- **common_mistakes** *(NEW)*: UNSAFE: Running a generator indoors, in a tent, or near doors and air intakes; engine-exhaust carbon monoxide is a leading cause of non-fire CO deaths.; UNSAFE: Refueling while the generator is running or hot, risking fire from fuel spilled on hot surfaces.; Getting the neutral bonding wrong; a portable genset feeding cord-and-plug loads is typically neutral-bonded to its frame, but as a separately derived system feeding a distro/transfer the bonding and grounding must follow NEC 250.34/250.30 so GFCIs and breakers work.; Overloading the genset or leaving legs badly unbalanced, causing voltage sag, overheating, and dropouts.
- **scenario_contexts** *(NEW)*: Powering an outdoor festival stage where no house power exists.; Providing backup or remote power for a location recording shoot.; Grounding and bonding a genset per NEC 250.34 before energizing a distro.
- _sources: NFPA 70 (NEC) 250.34 portable and vehicle-mounted generators; 250.30 separately derived systems; OSHA 29 CFR 1926.404 / OSHA portable-generator grounding guidance and CPSC carbon-monoxide hazard data; Manufacturer safety documentation (e.g., Honda/Generac) — refueling, ventilation, and grounding_

### Power Distro
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A portable box that takes in big feeder power and splits it into many normal breakered outlets for audio, lighting, and video at a show.
- **purpose_function** *(NEW)*: A distro breaks incoming feeder or service power into individually protected branch circuits and the connector types a crew needs, centralizing overcurrent protection and metering for temporary power.
- **practical_application** *(NEW)*: Techs feed the distro from a company switch or genset via camlocks, then patch audio and lighting circuits from its Edison, L21-30, or Socapex outputs while watching meters to balance the legs.
- **category** *(NEW)*: Power Distribution
- **related_terms** *(NEW)*: Feeder Cable; Camlock; Breaker Panel (Service Panel); Phase Rotation; Dedicated Circuit
- **common_mistakes** *(NEW)*: UNSAFE: Making or breaking the feeder/camlock connection to the distro while it is energized instead of dead.; Badly unbalancing the three legs so one phase overloads while the others sit nearly idle.; UNSAFE: Operating a distro without verified grounding/bonding and correct phase rotation, or bypassing its breakers or GFCI protection.; Exceeding a branch circuit's or the distro's total ampacity by patching too much load onto one output.
- **scenario_contexts** *(NEW)*: Distributing camlock feeder into Edison and Socapex circuits for a concert stage.; Balancing audio on one leg and lighting on the others to keep phases even.; Providing GFCI-protected outdoor circuits from a distro at a festival.
- _sources: NFPA 70 (NEC) Article 520 theaters/portable stage power; Article 525 carnivals and events; Lex Products / Motion Labs portable power distribution technical documentation; NFPA 70 (NEC) Article 240 overcurrent protection; 210.8 GFCI requirements_

### Relay
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An electrically controlled switch: a small signal energizes a coil that flips a set of contacts to turn a bigger circuit on or off.
- **purpose_function** *(NEW)*: A relay lets a low-power control signal safely switch a higher-power or electrically isolated circuit, providing isolation and remote or automatic switching.
- **practical_application** *(NEW)*: Techs meet relays in amplifier output-mute and turn-on-delay circuits, power sequencers, standby switching, and control systems that power gear on and off.
- **category** *(NEW)*: Electrical Fundamentals
- **related_terms** *(NEW)*: Direct Current (DC); Fuse; Power Distro; Dedicated Circuit; Ampacity
- **common_mistakes** *(NEW)*: Exceeding the relay contacts' voltage or current rating, causing the contacts to weld or arc.; Ignoring inductive kickback; switching coils or motors without a flyback diode or snubber can destroy contacts and driving electronics.; Confusing the low-voltage control (coil) side with the switched load side and their separate ratings.; UNSAFE: Assuming a de-energized relay isolates a load for servicing; a relay is a switch, not a lockout, and its contacts can weld closed.
- **scenario_contexts** *(NEW)*: A power sequencer using relays to switch amp racks on in stages to limit inrush.; An amplifier's output relay muting the speakers during turn-on and turn-off transients.; An AV control-system relay switching a projector or motorized-screen circuit.
- _sources: Handbook for Sound Engineers (Ballou) — switching, control, and amplifier protection circuits; The Art of Electronics (Horowitz & Hill) — relays, contact ratings, and inductive-load protection; UL 508 industrial control equipment / manufacturer relay datasheets (contact ratings, coil drive)_


## MUSI190 — Microphones
*5 terms*

### Ambisonic Microphone
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A microphone with several capsules clustered like the faces of a pyramid that captures sound from every direction at once, so the 'listening direction' can be steered afterward. It is the go-to tool for 360 video and VR audio.
- **purpose_function** *(NEW)*: It captures a full-sphere sound field, encoded after conversion as four-channel B-format (a W omnidirectional channel plus X, Y and Z figure-8 channels), so that direction can be rotated and decoded to any speaker or headphone layout in post. It exists to produce immersive audio that stays locked to picture as a listener turns their head.
- **practical_application** *(NEW)*: A tech records the raw four-capsule A-format, runs it through the manufacturer's A-to-B format converter, then decodes to binaural or surround; on set they keep the mic's marked reference axis pointed to picture-front and log its orientation so rotation is accurate later.
- **category** *(NEW)*: Microphone Types
- **related_terms** *(NEW)*: Condenser Microphone; Polar Pattern; Binaural Recording; Stereo Microphone Techniques; Phantom Power; Surround Sound
- **common_mistakes** *(NEW)*: Confusing A-format (the raw capsule output) with B-format (W/X/Y/Z) and feeding un-converted A-format into a decoder.; Failing to log the mic's physical orientation on set, which makes aligning and rotating the soundfield to picture guesswork.; Treating the four capsules as independent stereo mics rather than a matched, calibrated tetrahedral set.; UNSAFE (gear/signal): it is a phantom-powered condenser array requiring 48V on all four channels, so patching phantom to only some channels or hot-plugging with phantom live yields corrupt/missing channels and loud transients that can damage monitors or hearing.
- **scenario_contexts** *(NEW)*: Capturing 360-degree ambience for a VR film or 360 video.; Recording an immersive soundfield of a concert or room for headphone/binaural playback.; Gathering field ambience for game audio that responds to head-tracking.; Documentary work needing a rotatable, decode-anywhere immersive bed.
- _sources: Sennheiser AMBEO VR Mic Instruction Manual (docs.cloud.sennheiser.com); Sennheiser AMBEO VR Mic product page and specifications (sennheiser.com)_

### Crystal Microphone
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An old-style microphone that makes electricity directly from a vibrating crystal, so it needs no power and puts out a strong signal, but it is fragile and lo-fi. You mostly meet them in vintage gear today.
- **purpose_function** *(NEW)*: It uses the piezoelectric effect of a Rochelle-salt (later ceramic) crystal to convert sound pressure directly into a voltage without any external power, and historically it delivered high output cheaply for public address, telephony, two-way radio and home recorders.
- **practical_application** *(NEW)*: A tech encounters them in vintage or deliberately lo-fi contexts (old PA mics, harmonica 'bullet' tones, amateur radio) and must feed them into a very high-impedance input to preserve their level and low end.
- **category** *(NEW)*: Microphone Types
- **related_terms** *(NEW)*: Dynamic Microphone; Condenser Microphone; Ribbon Microphone; Ceramic Microphone; Impedance; Frequency Response
- **common_mistakes** *(NEW)*: Loading a crystal mic into a low-impedance input (a few hundred ohms to a couple of kilohms), which collapses its low end and output; it needs megohm-range loading.; UNSAFE (gear): assuming it needs power and routing 48V phantom into a vintage high-impedance/unbalanced crystal element, which is incompatible with balanced phantom circuits and can damage the crystal; it is passive and generates its own voltage.; Storing or using it in heat or humidity, which degrades the Rochelle salt element and destroys the mic.; Expecting studio-grade fidelity from its narrow, uneven response (roughly 100 Hz to 5 kHz).
- **scenario_contexts** *(NEW)*: Restoring or servicing vintage PA and broadcast equipment.; Deliberately creating a lo-fi or harmonica 'bullet' mic tone.; Amateur (ham) radio and early two-way communication gear.; Museum, archive, or historical audio demonstrations.
- _sources: Shure - 'The History of Crystal Microphones and Artifacts from the Shure Archives' (shure.com); ScienceDirect - Rochelle Salt overview (sciencedirect.com)_

### Microphone Modeling
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Software that makes one neutral microphone sound like a range of famous vintage mics by reshaping its tone, so you can effectively 'swap' mic sounds even after recording.
- **purpose_function** *(NEW)*: It uses the known response of a reference capsule and applies DSP filters and transforms to emulate the frequency, polar, and often proximity/off-axis behavior of classic microphones, giving access to many mic voices from one capsule and letting the choice be revisited in the mix.
- **practical_application** *(NEW)*: An engineer records through the system's reference mic (often a dual-capsule condenser), then auditions models such as a U47 or C12 in the plugin, sometimes changing polar pattern or model after tracking; they must keep clean, uncolored gain staging on the reference signal for the models to track correctly.
- **category** *(NEW)*: Microphone Technology
- **related_terms** *(NEW)*: Condenser Microphone; Large-Diaphragm Condenser; Polar Pattern; Proximity Effect; Frequency Response; Preamp
- **common_mistakes** *(NEW)*: Coloring the reference-mic signal with EQ or a heavily voiced preamp before modeling, which breaks the model's calibration.; Assuming every 'modeling mic' does the processing onboard; most systems (e.g., Slate VMS, Townsend Sphere, Antelope Edge) model in software, so you must record the clean reference signal.; Expecting a model to be acoustically identical to the original mic; it emulates response, not the exact physical capsule/room interaction.; Printing the modeled tone destructively when the whole point is to keep the choice flexible in post.
- **scenario_contexts** *(NEW)*: A home or project studio wanting many vintage mic sounds without owning the originals.; Deciding a vocal's mic character after the session rather than committing on the day.; Matching the tone of a classic mic the engineer does not have on hand.; Keeping a consistent mic voice across different rooms or sessions.
- _sources: Slate Digital VMS (Virtual Microphone System) product documentation (slatedigital.com); Antelope Audio Edge series product documentation (en.antelopeaudio.com); Townsend Labs Sphere product documentation (townsendlabs.com)_

### Noise-Canceling Microphone
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A close-up microphone built to hear only the voice right in front of it and ignore the loud room around it, like the mics on aviation and intercom headsets.
- **purpose_function** *(NEW)*: It is a differential (noise-cancelling) design that senses sound at two ports so distant far-field noise, which arrives nearly equally at both, cancels while close-up near-field speech does not, greatly improving the speech-to-background ratio in loud environments.
- **practical_application** *(NEW)*: A tech positions it right at the lips (a few millimeters away) on a headset boom or handheld; because it only rejects noise when used close, placement and mic technique are critical, and it is common on comms, aviation, and stage talkback.
- **category** *(NEW)*: Microphone Types
- **related_terms** *(NEW)*: Dynamic Microphone; Cardioid Polar Pattern; Proximity Effect; Headset Microphone; Intercom; Gain Before Feedback
- **common_mistakes** *(NEW)*: Using it at a distance from the mouth, where it loses both level and its noise-rejecting benefit; it is designed for near-lip use.; Confusing an acoustic differential (noise-cancelling) mic with DSP-based active/ENC noise cancellation, which are different mechanisms.; Expecting full-range, hi-fi response; the differential design deliberately shapes the response to favor close-speech intelligibility.; Blaming the mic for room bleed on loud stages when the real fix is closer, consistent placement.
- **scenario_contexts** *(NEW)*: Pilot, motorsport, or military communication headsets in high-noise cabins.; Broadcast and live-production intercom and talkback.; Loud-stage lead vocals or announcer mics needing strong ambient rejection.; Factory-floor or emergency two-way radio communication.
- _sources: Shure 562 Close-Talk Noise-Canceling Dynamic Microphone documentation (shure.com); Shure BRH440M / BRH441M Intercom Headset documentation (shure.com)_

### Parabolic Microphone
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A microphone sitting at the focus of a dish that acts like a 'sound telescope,' concentrating far-away sound from one direction so it can be captured clearly from a distance.
- **purpose_function** *(NEW)*: A parabolic reflector collects sound arriving along its axis and focuses it onto a mic at the focal point, providing passive acoustic gain and very high directivity so distant on-axis sources are captured over off-axis noise, all without adding electronic noise.
- **practical_application** *(NEW)*: A tech aims the dish precisely at the target (a sideline play, a distant bird) and monitors on headphones to 'find' the focus; they must accept limited low-frequency response on smaller dishes and keep the aim steady on a moving subject.
- **category** *(NEW)*: Microphone Types
- **related_terms** *(NEW)*: Shotgun Microphone; Polar Pattern; Directivity; Off-Axis Rejection; Condenser Microphone; Frequency Response
- **common_mistakes** *(NEW)*: Expecting flat, extended low-frequency response; portable dishes have poor bass because low-frequency wavelengths exceed the dish diameter.; Aiming imprecisely; even small angular errors move the source off the focal point and lose the target.; Thinking the dish amplifies electronically; the gain is passive geometry, and off-axis sound is attenuated rather than electronically filtered.; Confusing it with a shotgun mic; parabolics give more gain and a narrower pickup at long range but are bulkier and more bass-limited.
- **scenario_contexts** *(NEW)*: Capturing on-field sound from the sidelines of a sporting event.; Recording birdsong and wildlife in the field from a distance.; Long-range surveillance or security audio pickup.; Nature and documentary production needing isolated distant sources.
- _sources: Klover Products - 'What Is a Parabolic Mic and How Does It Work?' (kloverproducts.com); EDN - 'A quick primer demystifies parabolic microphones' (edn.com)_


## MUSI190 — Mixers & Recorders
*6 terms*

### In-Line Console
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A mixing desk where each channel strip does double duty, giving you two faders in one strip: one to send sound to the recorder and one to listen to what's coming back.
- **purpose_function** *(NEW)*: By folding the channel (record) path and the monitor (return) path into a single strip, an in-line console packs far more I/O into a compact frame and keeps recording and monitoring controls in one place for the engineer. It exists to give large multitrack studios high channel counts without an enormous footprint.
- **practical_application** *(NEW)*: During tracking, a session engineer sets the top fader to feed a track to the multitrack recorder while using the smaller monitor fader on the same strip to balance the playback the musicians hear, all without moving to a separate monitor panel.
- **category** *(NEW)*: Mixing Consoles
- **related_terms** *(NEW)*: Split Console; Master Section; Monitor Section; Channel Path; Bus
- **common_mistakes** *(NEW)*: Confusing the channel (record) fader with the monitor fader and adjusting the wrong one, so the tracked level or the monitor balance changes unexpectedly; Assuming an in-line strip is truly two independent channels rather than one strip sharing preamp, EQ, and routing resources between two paths; Forgetting to flip EQ or dynamics assignment between the channel path and monitor path, then wondering why processing isn't landing where expected
- **scenario_contexts** *(NEW)*: A commercial studio tracking a full band on a 48-input SSL or Neve in-line desk, recording and monitoring 24+ tracks from one operating position; An engineer flipping the console into 'mix mode' so both faders feed the mix bus, doubling available inputs at mixdown; Teaching students signal flow by tracing a mic through the channel path to tape and back through the monitor path on the same strip
- _sources: Sound On Sound - mixing console signal flow and channel vs monitor path articles; AudioMasterClass - 'An inline mixing console. What's that?'; Ballou, Handbook for Sound Engineers - console architecture_

### Master Section
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The middle 'command center' of a mixing desk, where the main output faders, the meters, the talkback mic, and the control-room listening controls all live.
- **purpose_function** *(NEW)*: It gathers the console's shared output and monitoring functions - main and subgroup buses, metering, talkback, and control-room feeds - into one central area so the engineer manages the whole mix's final level and monitoring from one spot. It exists as the point where all summed signals converge before leaving the console.
- **practical_application** *(NEW)*: An engineer rides the main stereo fader, watches the master meters for clipping, and taps the talkback button here to speak to performers in the live room without disturbing the recording.
- **category** *(NEW)*: Mixing Consoles
- **related_terms** *(NEW)*: Monitor Section; Bus; Talkback; Main Mix Fader; Metering
- **common_mistakes** *(NEW)*: Confusing control-room monitor level (what you hear) with the master output fader (what actually goes to the recorder or PA), then setting record or send levels by ear alone; Leaving talkback engaged, which dumps the talkback mic into cue or monitor feeds and can cause feedback or unwanted noise; Assuming the master meters show individual channel levels rather than the summed bus output
- **scenario_contexts** *(NEW)*: Setting overall mix level and checking for clipping on the master bus meters before printing a mix; Using the talkback mic to cue a vocalist between takes; Selecting main vs. subgroup bus outputs and matrix routing from the center section on a large-format desk
- _sources: Wikipedia - Mixing console (master/center section, metering, talkback); Sound On Sound - Control Room and console technique articles; Ballou, Handbook for Sound Engineers_

### Monitor Section
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The part of the desk that decides what comes out of the control-room speakers and how loud - letting you pick a source, switch speaker sets, drop the level with DIM, or check the mix in mono.
- **purpose_function** *(NEW)*: It controls control-room listening independently of the actual mix output, so the engineer can choose what to hear, at what level, and on which speakers without changing the signal being recorded or sent to the PA. It exists to give a trustworthy, flexible reference for critical listening.
- **practical_application** *(NEW)*: An engineer uses it to A/B between main and small reference monitors, hit DIM to take a phone call, or sum to mono to check the mix's mono compatibility - all without touching the recorded mix level.
- **category** *(NEW)*: Mixing Consoles
- **related_terms** *(NEW)*: Master Section; Control Room; DIM; Mono Sum; Monitor Controller
- **common_mistakes** *(NEW)*: Mistaking the monitor/control-room level control for the master output fader, so a quiet monitor level is misread as a low recorded level (or vice versa); Forgetting DIM or MONO is still engaged and making mix decisions on an attenuated or mono signal; Judging a mix on only one speaker set instead of cross-referencing multiple monitors
- **scenario_contexts** *(NEW)*: Switching between main monitors and NS-10-style reference speakers to check translation; Engaging MONO to verify mono compatibility for broadcast or club playback; Using DIM to quickly lower control-room volume for a conversation without losing the set listening level
- _sources: Sound On Sound - Control Room monitoring article; TheAudioPod / manufacturer monitor-section documentation (Lawo mc56, UA Monitor Column); Ballou, Handbook for Sound Engineers - monitoring_

### Scribble Strip
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The label space just above (or below) each fader where you write or display the channel's name - 'kick', 'bass', 'lead vox' - so you know what each fader controls. On digital desks it's a little LCD instead of tape and a marker.
- **purpose_function** *(NEW)*: It gives each channel a clear, at-a-glance identity so the engineer instantly knows what each fader and strip controls, which is essential on high-channel-count desks. On digital consoles the electronic scribble strip stores names and colors with the show file so they recall with each scene.
- **practical_application** *(NEW)*: A live engineer names and color-codes every input on the digital scribble strips during setup so that mid-show they can grab the right channel instantly without counting faders.
- **category** *(NEW)*: Mixing Consoles
- **related_terms** *(NEW)*: Channel Strip; Fader; Master Section; Scene Recall; Layers
- **common_mistakes** *(NEW)*: On layered digital desks, forgetting the scribble strip name follows the assigned layer/bank, so the same physical fader shows different names on different layers; Not updating names after re-patching inputs, leaving misleading labels that cause the wrong channel to be adjusted; On analog desks, writing directly on the console surface instead of on removable tape, leaving permanent marks
- **scenario_contexts** *(NEW)*: Labeling and color-coding inputs during line check on an X32, SD-series, or Yamaha CL/QL desk; Recalling a saved show file so all channel names and colors reappear automatically; Applying fresh console tape and marker labels to an analog desk before a session
- _sources: Sweetwater InSync - 'Scribble Strip' glossary; Sound On Sound - Behringer X32 and Digidesign Icon reviews (LCD scribble strips); Soundcraft / Yamaha console documentation_

### Solo In Place (SIP)
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A solo mode that silences every other channel by muting them on the main output, so only the soloed channel is heard - great in the studio, but on a live PA it can kill the whole show's sound.
- **purpose_function** *(NEW)*: SIP lets an engineer hear a single channel exactly as it sits in the mix - with its pan, fader, and effects intact - by muting all other channels on the main bus. It exists for detailed, in-context checking during mixing, which is why it is called 'destructive' solo monitoring.
- **practical_application** *(NEW)*: In a studio mixdown an engineer taps SIP to isolate a reverb-drenched vocal in its panned, processed position; in live sound they avoid SIP entirely and use PFL/AFL, since SIP would mute the entire audience mix.
- **category** *(NEW)*: Mixing Consoles
- **related_terms** *(NEW)*: PFL; AFL; Solo; Mute; Master Section
- **common_mistakes** *(NEW)*: UNSAFE (to the show): Pressing SIP on a live console, which mutes every other channel on the main output and silences the entire PA in front of an audience; Confusing SIP with PFL/AFL, which only feed the monitor/solo bus and leave the main mix untouched; Leaving SIP latched on and then wondering why the rest of the mix has disappeared from the outputs
- **scenario_contexts** *(NEW)*: Studio mixdown, isolating one channel in its true panned and processed context to check a detail; A live engineer deliberately choosing PFL or AFL instead of SIP to protect the front-of-house mix; A digital desk (e.g. DiGiCo) requiring a deliberate press-and-hold and flashing warning to prevent accidental SIP engagement during a service or show
- _sources: Sound On Sound - 'Q. What do Solo, PFL and AFL do?' and Solo glossary; Sweetwater SweetCare - 'What are PFL, AFL and SIP?'; Yamaha Pro Audio - 'Using Solo During Live Mixing'_

### Split Console
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A mixing desk laid out in clearly separate zones - input channels on one side, a dedicated monitor-mix section on the other, and the master in between - so recording and monitoring controls never overlap.
- **purpose_function** *(NEW)*: By keeping the recording (channel) path and the monitor path in physically separate sections, a split console makes signal flow obvious and easy to follow, which is why it is common on teaching and smaller-format desks. It exists to keep tracking and monitoring workflows distinct and easy to understand.
- **practical_application** *(NEW)*: An engineer runs mics through the input channels on one side while building a separate headphone/monitor balance on the dedicated monitor section, always knowing which set of controls does what.
- **category** *(NEW)*: Mixing Consoles
- **related_terms** *(NEW)*: In-Line Console; Master Section; Monitor Section; Channel Path; Bus
- **common_mistakes** *(NEW)*: Assuming the separate monitor section changes what is recorded - it only affects monitoring, not the level going to the recorder; Running out of physical channels because, unlike an in-line desk, each input and each monitor return needs its own strip, enlarging the footprint; Confusing the split (separate-section) layout with an in-line desk's dual-fader strips
- **scenario_contexts** *(NEW)*: A project or educational studio using a split desk so students can clearly trace input, monitor, and master sections; Tracking a band while maintaining an independent monitor mix on the dedicated monitor side; Comparing split vs. in-line architectures when specifying a console for a given room size and channel count
- _sources: AudioMasterClass and Sound On Sound - split vs in-line console architecture; Puremix - 'Andrew Scheps: Inline & Split Line Consoles'; Ballou, Handbook for Sound Engineers - console types_


## MUSI190 — Reverb & Delay
*4 terms*

### Feedback Delay Network (FDN)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A reverb 'engine' built from several echo lines whose outputs are mixed together and fed back into each other, so a handful of echoes quickly multiply into a thick, smooth wash of sound.
- **purpose_function** *(NEW)*: It generates dense, natural-sounding reverberation efficiently by recirculating a small set of delay lines through a mixing (feedback) matrix, letting the designer control decay time and frequency response independently. It exists because directly modeling every reflection in a room is far too costly, while an FDN builds convincing density from just a few delays.
- **practical_application** *(NEW)*: Engineers encounter FDNs as the core of most modern algorithmic reverb plugins and hardware units, where the 'size,' 'decay/RT60,' 'density,' and 'damping/high-frequency decay' controls map onto the network's delay lengths, feedback matrix, and in-loop filters.
- **category** *(NEW)*: Reverb Algorithm
- **related_terms** *(NEW)*: Schroeder Reverberator; Comb Filter; All-Pass Filter; Algorithmic Reverb; Convolution Reverb; RT60 (Reverberation Time)
- **common_mistakes** *(NEW)*: Assuming an FDN reverb models a real room the way convolution does; it is a synthetic recirculating structure, not an impulse-response capture.; Confusing the FDN's internal 'density' with decay time; more delay lines and higher echo density make the tail smoother, while the feedback gain sets how long it rings.; Setting feedback so high that the network becomes unstable or metallic, instead of relying on the lossless (unitary/orthogonal) feedback matrix plus in-loop damping to shape a musical decay.; Treating all algorithmic reverbs as identical; FDN topology and matrix choice strongly affect echo buildup, modal density, and coloration.
- **scenario_contexts** *(NEW)*: Dialing in a plate- or hall-style algorithmic reverb plugin whose engine is an FDN when mixing vocals or drums.; Choosing an FDN-based reverb over convolution when low CPU load and real-time tweakability matter, such as live performance or gaming/VR audio.; Adjusting damping and decay independently across frequency bands to make a bright hall sound warmer without shortening the tail.; A developer or advanced sound designer building or programming a custom reverb using a network of delay lines and a unitary feedback matrix.
- _sources: Julius O. Smith III, 'Physical Audio Signal Processing' (CCRMA, Stanford / DSPRelated.com), FDN Reverberation and Schroeder Reverberators chapters; J.-M. Jot and A. Chaigne, 'Digital Delay Networks for Designing Artificial Reverberators,' AES 90th Convention (1991); Stautner & Puckette, 'Designing Multichannel Reverberators,' Computer Music Journal (1982)_

### Oil-Can Delay
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A quirky 1960s echo box that stored your sound as static electricity on an oil-coated spinning disc, giving back a dark, watery, wobbling echo rather than a clean repeat.
- **purpose_function** *(NEW)*: It produced an electromechanical echo/vibrato effect before tape and digital delays were practical for compact units, storing the audio as an electrostatic charge on a rotating oil-coated disc and reading it back with a pickup. Today it exists mainly as a sought-after 'lo-fi,' warbly delay character emulated in pedals and plugins.
- **practical_application** *(NEW)*: A tech encounters oil-can delays in vintage Tel-Ray/Morley units (and OEM circuits inside gear like the Fender Dimension IV or Gibson GA-4RE) and in modern emulations, reaching for them when a dark, seasick, pitch-modulated echo is wanted rather than a clean, accurate one.
- **category** *(NEW)*: Delay Hardware
- **related_terms** *(NEW)*: Tape Delay; Bucket-Brigade Delay (BBD); Wow and Flutter; Spring Reverb; Modulation (Chorus/Vibrato); Analog Delay
- **common_mistakes** *(NEW)*: Expecting clean, repeatable echoes; the format is inherently murky, warbly, and unstable, which is the point of its charm.; Confusing an oil-can (electrostatic disc) delay with a bucket-brigade (BBD chip) analog delay or with tape echo; the storage mechanisms are entirely different.; Believing the 'oil' is what stores the sound as a liquid; the oil holds an electrostatic charge on the disc, and the fluid's condition mainly affects reliability and tone.; Assuming vintage units are plug-and-play; aging motors, drive belts, dried or leaking oil, and worn discs commonly cause erratic behavior.
- **scenario_contexts** *(NEW)*: A guitarist or producer chasing a vintage, dark, seasick slapback for a psychedelic or surf-era tone.; A studio tech servicing or restoring a Tel-Ray/Morley oil-can unit and dealing with belt, motor, or oil issues.; A sound designer selecting an oil-can emulation plugin/pedal to add lo-fi wobble to a synth or vocal.; Recognizing the oil-can circuit embedded inside older combo-amp echo/reverb features when repairing vintage amplifiers.
- _sources: Effectrode, 'History of Delay' technical knowledge base; Catalinbread, 'Tel-Ray Ad-N-Echo' history article; Equipboard, 'Oil Can Delay Explained' and Strymon TimeLine 'Oil Can Delay' documentation_

### Schroeder Reverberator
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The original recipe for fake reverb: chain together echo-building 'comb' filters and smearing 'all-pass' filters until a few echoes turn into a smooth, room-like tail.
- **purpose_function** *(NEW)*: It provides the foundational architecture for artificial reverberation by combining parallel comb filters (to build echo density and decay) with series all-pass filters (to increase echo density without coloring the timbre). It exists as the first practical, controllable way to synthesize natural-sounding reverb from delay elements rather than physical rooms.
- **practical_application** *(NEW)*: Engineers rarely dial up a 'Schroeder' preset by name, but its comb-plus-all-pass structure underlies countless classic algorithmic reverbs, so understanding it explains why reverb controls behave as they do and informs anyone building or studying reverb DSP.
- **category** *(NEW)*: Reverb Algorithm
- **related_terms** *(NEW)*: Comb Filter; All-Pass Filter; Feedback Delay Network (FDN); Algorithmic Reverb; RT60 (Reverberation Time); Echo Density
- **common_mistakes** *(NEW)*: Thinking Schroeder reverb models a specific real room; it is a synthetic algorithm designed to sound natural, not an impulse-response capture.; Confusing the roles of the two building blocks: comb filters create the discrete echoes and decay, while all-pass filters thicken density without altering the frequency response.; Assuming all-pass filters are inaudible because they are 'flat'; their phase/time smearing is exactly what increases echo density and can add metallic coloration if misused.; Believing it is obsolete; comb and all-pass sections still form the basis of many modern reverberators and FDNs.
- **scenario_contexts** *(NEW)*: A DSP or audio-programming student implementing a basic reverb from comb and all-pass sections.; Explaining why an algorithmic reverb sounds metallic or 'ringy' by tracing it to comb/all-pass tuning.; Comparing early Schroeder-style algorithms to later FDN designs when evaluating reverb plugins.; Understanding the lineage of classic hardware reverbs (e.g., Lexicon, Alesis) whose designs build on Schroeder's nested all-pass-in-feedback idea.
- _sources: M. R. Schroeder, 'Natural Sounding Artificial Reverberation,' Journal of the Audio Engineering Society (1962); Julius O. Smith III, 'Physical Audio Signal Processing' (CCRMA, Stanford / DSPRelated.com), Schroeder Reverberators and Schroeder Allpass Sections chapters; Valhalla DSP, 'Schroeder Reverbs: the forgotten algorithm'_

### Wow and Flutter
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The slow 'wow' and fast 'flutter' pitch wobble you hear when a tape or record player can't hold a perfectly steady speed; in plugins it is added on purpose for vintage warmth.
- **purpose_function** *(NEW)*: As a fault, it describes the frequency-modulation distortion caused by speed variations in mechanical transports (capstan, motors, belts, rollers), with wow being slow fluctuations and flutter being faster ones. As a creative control in tape emulations, it exists to reintroduce that gentle pitch/time instability to make digital sources sound warmer and more analog.
- **practical_application** *(NEW)*: A tech measures wow and flutter (traditionally via a 3,150 Hz test tone per DIN/IEC weighting) when servicing or aligning tape machines and turntables, and separately dials a 'wow & flutter' amount in tape/delay emulation plugins to add vintage character.
- **category** *(NEW)*: Tape Characteristic
- **related_terms** *(NEW)*: Tape Delay; Oil-Can Delay; Modulation (Chorus/Vibrato); Capstan; Tape Saturation; Pitch/Frequency Modulation
- **common_mistakes** *(NEW)*: Swapping the definitions: wow is the slow (roughly 0.5-6 Hz) pitch drift, while flutter is the faster (roughly 6-100 Hz) variation.; Assuming any speed wobble is always undesirable; in mixing it is often added intentionally for analog vibe, even though on a real machine it signals a mechanical problem.; Confusing wow and flutter (a speed/pitch instability) with tape saturation or hiss, which are level/noise phenomena, not timing.; Overlooking scrape flutter (high-frequency roughness above ~100 Hz from tape vibrating at the head), which is a distinct issue addressed with damping rollers.
- **scenario_contexts** *(NEW)*: Aligning and troubleshooting an analog tape machine or turntable and finding excessive wobble traced to a worn belt, capstan, or pinch roller.; Adding subtle wow & flutter in a tape-emulation plugin to give a stiff digital mix or synth a warmer, more organic feel.; Diagnosing a warbly, unstable pitch on a vintage tape delay and deciding whether it is a fault to repair or a character to keep.; Evaluating a deck's specifications, where lower wow-and-flutter percentages indicate a more speed-stable, higher-fidelity transport.
- _sources: Wikipedia, 'Wow and flutter measurement' (citing DIN 45507 / IEC 60386 standards and 3,150 Hz test tone); Lindos Electronics, 'Wow and Flutter Measurement' technical article; Encyclopaedia Britannica, 'Flutter and wow'_


## MUSI190 — Signal Path & Levels
*6 terms*

### Consumer Level (−10 dBV)
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The quieter level standard used by home and prosumer gear (CD/media players, cassette decks, computer outputs), roughly 12 dB softer than the professional standard, so pro and consumer devices do not level-match directly.
- **purpose_function** *(NEW)*: It defines the nominal signal voltage consumer equipment expects—about 0.316 VRMS referenced to 1 VRMS = 0 dBV—which lets simpler, cheaper unbalanced circuitry work reliably within the consumer domain.
- **practical_application** *(NEW)*: A tech spots −10 dBV I/O (often unbalanced RCA or TS jacks) and inserts a level-matching stage or interface when patching it to +4 dBu pro gear, because the two standards differ by about 11.8 dB.
- **category** *(NEW)*: Signal Levels
- **related_terms** *(NEW)*: Professional Level (+4 dBu); dBV; dBu; Impedance Bridging; Line Driver; Gain Staging
- **common_mistakes** *(NEW)*: Confusing the dBV reference (1 VRMS) with the dBu reference (0.7746 VRMS), and treating the two levels as interchangeable; Assuming −10 dBV and +4 dBu differ by 14 dB instead of the actual ~11.8 dB; Feeding a hot +4 dBu pro output straight into a −10 consumer input and driving it into clipping; Reading the minus sign as meaning the signal is inverted or negative rather than simply a level below the reference
- **scenario_contexts** *(NEW)*: Patching a consumer CD or media player into a professional console; Interfacing a laptop line/headphone output with a pro audio interface; Setting a −10/+4 level switch on a piece of outboard gear; Troubleshooting weak level when a consumer source feeds a pro input
- _sources: Wikipedia, "Line level" (nominal levels, dBV/dBu references, voltage equivalents); Audio University, "Consumer vs Professional Audio Levels: -10 dBV vs +4 dBu"; Biamp Cornerstone, "Gain structure: input and output levels"_

### Impedance Bridging
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Connecting a low-impedance output into a much higher-impedance input so the receiver reads the source's voltage without loading it down; nearly every modern line-level connection works this way.
- **purpose_function** *(NEW)*: By making the load impedance roughly ten times (or more) the source impedance, almost all of the source voltage appears across the input while very little current is drawn, maximizing voltage transfer and preserving level and frequency response.
- **practical_application** *(NEW)*: A tech relies on bridging when fanning a line output out to several inputs, checking that the source's output impedance stays at least about 10x below the combined input impedance so level and tone do not sag.
- **category** *(NEW)*: Signal Levels
- **related_terms** *(NEW)*: Impedance Matching; Output Impedance; Input Impedance; Line Driver; Line Level; Gain Staging
- **common_mistakes** *(NEW)*: Confusing bridging with impedance matching, which pairs equal source and load impedances for maximum power transfer; Believing modern line-level audio needs matched impedances for best sound, rather than a high load-to-source ratio; Fanning one output to too many inputs so the combined load drops below ~10x and the source is loaded down; Applying line-level bridging logic to loudspeaker/amplifier connections, where impedance behaves differently
- **scenario_contexts** *(NEW)*: Splitting one line output to feed several destinations at once; Connecting a ~150 Ω microphone to a preamp input of ~1.5–3 kΩ; Interfacing a DI or line driver to a long cable run; Deciding whether a passive splitter will load down the source
- _sources: Wikipedia, "Impedance bridging" (load impedance >> source impedance; factor-of-10 rule); ProSoundWeb, "Answers to Frequently Asked Questions About Impedance & Impedance Matching in Sound Systems"; sengpielaudio, "Voltage Bridging" / impedance bridging interface calculations_

### Line Driver
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An active booster/buffer that strengthens a line signal and gives it a strong low-impedance push so it survives long cable runs without losing level or high-frequency detail.
- **purpose_function** *(NEW)*: It presents a high input impedance and a low output impedance with enough current capability to drive cable capacitance, letting a signal travel long distances—often as a balanced feed—without treble loss, noise pickup, or level drop.
- **practical_application** *(NEW)*: A tech inserts a line driver (or an active DI/balancing stage) when sending audio across a stage, between rooms, or down a long snake, frequently to turn a weak unbalanced source into a robust balanced signal.
- **category** *(NEW)*: Signal Flow
- **related_terms** *(NEW)*: Impedance Bridging; Balanced Audio; DI Box; Output Impedance; Buffer; Line Level
- **common_mistakes** *(NEW)*: Confusing a line driver with a power amplifier—it drives line inputs, not loudspeakers; Assuming any line output can drive very long cables equally well; Forgetting that cable capacitance rolls off high frequencies on long unbalanced runs; Adding drive gain without checking level and overdriving the downstream input
- **scenario_contexts** *(NEW)*: Running audio hundreds of feet to a remote amplifier rack; Converting an unbalanced keyboard or laptop output to balanced for a long run; Distributing one source to multiple distant destinations; Overcoming high-frequency loss on a long cable
- _sources: Wikipedia, "Balanced audio" (long cable runs, differential drive, HF preservation); Rane, Note 126, "Practical Line-Driving Current Requirements"; Analog Devices, SSM2142 Balanced Line Driver data sheet_

### Meter Ballistics
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: How fast a meter's needle or bar jumps up and falls back, which determines whether it is showing average loudness (VU) or brief peaks (PPM or digital peak).
- **purpose_function** *(NEW)*: The defined attack (integration) and return (decay) times set what a reading represents—a VU meter's ~300 ms rise and fall tracks perceived average level, while a PPM's fast 5–10 ms rise with a slow decay catches peaks—so the operator can interpret the display correctly.
- **practical_application** *(NEW)*: A tech interprets levels knowing a VU under-reads fast transients while a peak/PPM meter reveals them, and sets appropriate headroom for whichever meter type is in front of them.
- **category** *(NEW)*: Metering
- **related_terms** *(NEW)*: VU Meter; Peak Program Meter (PPM); Peak Hold; Headroom; dBFS; Gain Staging
- **common_mistakes** *(NEW)*: Treating a VU reading as if it shows true peak level; Assuming all meters respond to the signal identically; Ignoring that a VU misses short transients that can still clip a digital converter; Confusing integration (attack) time with the meter's decay/fallback time
- **scenario_contexts** *(NEW)*: Comparing a VU meter and a digital peak meter on the same source; Setting broadcast levels with a PPM; Gain-staging analog gear by VU while watching converter peaks; Explaining why a 0 VU analog signal is not the same as 0 dBFS
- _sources: AES, "Learn More: Peak Metering" (Loudness Project); av-info.eu, "Audio Level Meters" (VU ~300 ms integration; PPM Type I/II integration and fallback times); ESE / Elliott Sound Products (sound-au.com), "VU and PPM Audio Metering"_

### Peak Hold
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A meter feature that freezes the highest level it just saw for a moment so you do not miss a quick spike you would otherwise blink past.
- **purpose_function** *(NEW)*: It captures and briefly—or indefinitely—retains the maximum peak value, so transients too fast to see on a falling meter stay visible, helping catch clipping and set headroom.
- **practical_application** *(NEW)*: A tech turns on peak hold while gain-staging or tracking to see the true maximum a source reached, then clears it after adjusting levels.
- **category** *(NEW)*: Metering
- **related_terms** *(NEW)*: Peak Meter; Meter Ballistics; dBFS; Headroom; Clipping; Over Indicator
- **common_mistakes** *(NEW)*: Confusing the held peak marker with the live, moving level; Forgetting to reset the held value, so a stale old peak misleads later readings; Assuming peak hold prevents clipping, when it only displays it; Ignoring a held over on a very fast transient that already caused distortion
- **scenario_contexts** *(NEW)*: Checking the loudest transient of a snare hit while tracking; Verifying a mix never exceeded 0 dBFS over a full pass; Setting input gain with safe headroom margin; Catching an occasional over on a long take
- _sources: The Broadcast Bridge, "Audio For Broadcast: Metering" (peak-hold on bargraph meters); Bjorn Roche, "Peak Meters, dBFS and Headroom"; B&H eXplora, "Audio Metering 101"_

### Signal Present Indicator
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A small LED (usually green) that lights when a channel is actually receiving audio, making it the first thing to check when tracing where signal is or is not.
- **purpose_function** *(NEW)*: It confirms that signal above a low threshold (commonly around −20 dB) has reached that point in the chain, giving a quick indication of signal flow without needing a full meter, which speeds setup and troubleshooting.
- **practical_application** *(NEW)*: When a channel is silent, a tech works down the signal path checking each signal-present LED to find the first stage where the light goes dark and isolate the fault.
- **category** *(NEW)*: Metering
- **related_terms** *(NEW)*: Peak/Clip Indicator; Gain Staging; Signal Flow; Meter Ballistics; Preamp; Peak Hold
- **common_mistakes** *(NEW)*: Assuming a lit signal-present LED means the level is correct, when it only means some signal exists; Confusing the signal-present LED with the peak/clip (overload) LED; Expecting it to light for very quiet sources that fall below its threshold; Reading no light as always meaning a dead channel rather than simply a low-level signal
- **scenario_contexts** *(NEW)*: Tracing a dead channel from source to output; Confirming a mic or DI is passing audio during line check; Verifying a patch is actually connected; A quick input check before soundcheck
- _sources: Fibos, "How Do I Add An Audio Signal Indicator To My Mixer?" (green = signal present, red = overload; ~−20 dB threshold); Wikipedia, "Mixing console" (channel indicators / signal flow); AstralSound, "PA System Fault-Finding and Problem-Solving" (signal-present LEDs in troubleshooting)_


## MUSI190 — Sound & Acoustics
*11 terms*

### Antinode
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: In a standing wave, an antinode is the spot where the sound pressure swings back and forth the most — the point of maximum pressure change, the opposite of a dead spot (node).
- **purpose_function** *(NEW)*: Antinodes mark where a standing wave concentrates its pressure energy, which explains why certain positions in a room or points in a pipe show an exaggerated response at particular frequencies.
- **practical_application** *(NEW)*: Techs meet pressure antinodes at room boundaries and corners where low-frequency modes pile up, so they choose sub, mic, and listening positions — and place bass traps — with modal antinodes and nodes in mind.
- **category** *(NEW)*: Wave Physics
- **related_terms** *(NEW)*: Node; Standing Wave; Room Modes; Superposition; Wavelength; Resonance
- **common_mistakes** *(NEW)*: Confusing an antinode (maximum) with a node (minimum); Assuming a pressure antinode coincides with a velocity antinode — for sound, pressure maxima line up with velocity minima; Thinking antinodes exist only in instruments and pipes, not in rooms — room modes create pressure antinodes at boundaries
- **scenario_contexts** *(NEW)*: Finding a bass 'boom spot' where a room mode places a pressure antinode at the mix position; Explaining why low end builds up in room corners, which are pressure antinodes for several modes at once; Coupling a subwoofer into a room mode by placing it at that mode's pressure antinode
- _sources: F. Alton Everest & Ken Pohlmann, Master Handbook of Acoustics; Glen Ballou (ed.), Handbook for Sound Engineers_

### Cocktail Party Effect
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: Your ability to lock onto one person's voice in a noisy, crowded room and tune out all the competing talkers.
- **purpose_function** *(NEW)*: It describes how the brain uses two-ear (binaural) cues plus spectral and linguistic context to separate one talker from many, which is why intelligibility — not just loudness — determines whether a system actually communicates.
- **practical_application** *(NEW)*: Because a live listener can do this but a single microphone cannot, techs protect intelligibility with directional mics, adequate gain-before-feedback, good coverage design, and control of reverberation and background noise.
- **category** *(NEW)*: Psychoacoustics
- **related_terms** *(NEW)*: Sound Localization; Interaural Time Difference (ITD); Interaural Level Difference (ILD); Speech Intelligibility; Signal-to-Noise Ratio; Reverberation
- **common_mistakes** *(NEW)*: Assuming a microphone hears the way a person does — a mic cannot perform the brain's source separation; Thinking louder always means clearer; excess level and reverberation can actually reduce intelligibility; Believing binaural separation survives a mono PA — a single loudspeaker collapses the spatial cues listeners rely on
- **scenario_contexts** *(NEW)*: Explaining why a recording of a noisy party is far harder to follow than being there in person; Designing a restaurant or lobby system where patrons must follow paging or speech over background chatter; Choosing directional microphones and taming reverberation to preserve intelligibility in a busy venue
- _sources: E. Colin Cherry (1953), 'Some Experiments on the Recognition of Speech, with One and with Two Ears', JASA 25(5); Albert Bregman, Auditory Scene Analysis (MIT Press); Barry Arons, 'A Review of the Cocktail Party Effect', MIT Media Lab_

### Concert Pitch (A440)
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: The agreed 'master tuning note' — the A above middle C set to 440 vibrations per second — that ensembles tune to so everyone plays in tune together.
- **purpose_function** *(NEW)*: It gives musicians and equipment a common reference frequency so instruments match each other and so tuners, tone generators, and calibration gear share one standard.
- **practical_application** *(NEW)*: Techs set tuners, keyboards, and reference-tone generators to A=440 Hz (bumping to 442 or 443 Hz when an orchestra requests it) and use it to check pitch and calibrate gear.
- **category** *(NEW)*: Pitch & Tuning
- **related_terms** *(NEW)*: Frequency; Fundamental Frequency; Octave; Hertz; Equal Temperament; Missing Fundamental
- **common_mistakes** *(NEW)*: Assuming every ensemble tunes to exactly 440 Hz — many European orchestras use 442 or 443 Hz; Confusing A440 (A4) with A in another octave, such as A5 at 880 Hz; Thinking A440 defines the whole scale by itself — it is only the reference from which other pitches are derived through a temperament
- **scenario_contexts** *(NEW)*: Setting a stage tuner or synth master tune before a performance; Calibrating a signal generator or verifying a reference oscillator against 440 Hz; Matching a click track or backing track to an orchestra tuning to 442 Hz
- _sources: ISO 16:1975, Acoustics — Standard tuning frequency (Standard musical pitch); 1939 London International Conference on pitch standardization (A=440 Hz)_

### Interaural Level Difference (ILD)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A sound off to one side reaches the near ear louder than the far ear because your head blocks (shadows) part of it, and your brain uses that loudness gap to judge direction — mainly for higher-pitched sounds.
- **purpose_function** *(NEW)*: The head-shadow level difference gives the brain the dominant left/right cue at high frequencies, complementing the timing cues (ITD) that dominate at low frequencies — together the duplex theory of localization.
- **practical_application** *(NEW)*: Techs rely on ILD when panning by level in a mix and when spacing or aiming mics, since inter-channel level differences translate to perceived horizontal position on playback.
- **category** *(NEW)*: Psychoacoustics
- **related_terms** *(NEW)*: Interaural Time Difference (ITD); Sound Localization; Head Shadow; Panning; Binaural; Cocktail Party Effect
- **common_mistakes** *(NEW)*: Thinking ILD works equally at all frequencies — head shadowing is weak below roughly 1500 Hz, where long wavelengths bend around the head; Confusing ILD (a level difference) with ITD (a timing difference); Assuming level panning alone recreates natural localization — real cues combine level and time differences
- **scenario_contexts** *(NEW)*: Panning a hi-hat or tambourine by level to place it left or right in a stereo image; Explaining why high-frequency sources are easier to pinpoint than deep bass; Designing binaural or HRTF processing that reproduces head-shadow level cues
- _sources: Lord Rayleigh, duplex theory of sound localization; Brian C. J. Moore, An Introduction to the Psychology of Hearing; Wikipedia/Sound localization (ILD, ~1500 Hz boundary), cross-checked against JASA_

### Interaural Time Difference (ITD)
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A sound from your left reaches your left ear a fraction of a millisecond sooner than your right ear, and your brain uses that tiny timing gap to locate it — mostly for lower-pitched sounds.
- **purpose_function** *(NEW)*: The arrival-time difference between the ears (up to roughly 0.6–0.7 ms across a human head) is the brain's dominant direction cue below about 1500 Hz, forming half of the duplex theory of localization.
- **practical_application** *(NEW)*: Techs shape ITD-type timing cues through mic spacing (e.g., spaced-pair stereo) and watch inter-channel delay carefully, since small time offsets shift or smear the stereo image and cause comb filtering when summed.
- **category** *(NEW)*: Psychoacoustics
- **related_terms** *(NEW)*: Interaural Level Difference (ILD); Sound Localization; Precedence Effect; Comb Filtering; Binaural; Phase
- **common_mistakes** *(NEW)*: Confusing ITD (timing) with ILD (level); Assuming ITD dominates at all frequencies — above about 1500 Hz the wavelength is shorter than the head width and the phase timing becomes ambiguous; Ignoring that summing time-offset signals to mono can cause comb filtering and image collapse
- **scenario_contexts** *(NEW)*: Setting the spacing of a spaced-pair (A/B) stereo microphone array; Diagnosing image shift or comb filtering caused by misaligned delay between channels; Modeling binaural localization for immersive or headphone mixes
- _sources: Lord Rayleigh, duplex theory of sound localization; Brian C. J. Moore, An Introduction to the Psychology of Hearing; Wikipedia/Interaural time difference (max ~660 us; ~1500 Hz boundary), cross-checked against JASA_

### Missing Fundamental
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: If you play only the overtones of a low note but leave out the low note itself, your brain still 'hears' the low pitch — which is how a tiny speaker can seem to produce deep bass.
- **purpose_function** *(NEW)*: It shows the ear derives pitch from the spacing and periodicity of the upper harmonics rather than needing the fundamental to be present, a fact exploited to imply bass on systems that cannot reproduce it.
- **practical_application** *(NEW)*: Techs use psychoacoustic bass enhancers (harmonic-synthesis processors) to add higher harmonics of a low note so small drivers or earbuds convey bass the driver cannot physically radiate.
- **category** *(NEW)*: Psychoacoustics
- **related_terms** *(NEW)*: Fundamental Frequency; Harmonics; Overtone; Concert Pitch (A440); Timbre; Frequency
- **common_mistakes** *(NEW)*: Believing the low frequency is physically present — it is perceptually reconstructed, so a spectrum analyzer shows no energy there; Assuming a harmonic bass enhancer replaces a real subwoofer for level and physical impact; Confusing the perceived (virtual) pitch with the actual lowest partial present in the signal
- **scenario_contexts** *(NEW)*: Using a psychoacoustic bass processor so a phone or laptop speaker conveys a bass line; Explaining why a telephone (roughly 300 Hz–3.4 kHz) still conveys a male voice's low pitch; Designing small-format speakers that imply low end without deep-tuned drivers
- _sources: J. F. Schouten, residue-pitch experiments (1940); Brian C. J. Moore, An Introduction to the Psychology of Hearing; acousticslab.org Introduction to Psychoacoustics (Module 05)_

### Plane Wave
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A sound wave whose ripples have flattened into straight, parallel sheets instead of expanding spheres — roughly what you get far from a source or right in front of a tall line array.
- **purpose_function** *(NEW)*: It is an idealized model in which the wavefronts are flat and level falls off slowly, used to analyze propagation in tubes, in the far field, and in the near field of line arrays.
- **practical_application** *(NEW)*: Techs invoke plane-wave behavior to understand why a well-designed line array's cylindrical/near-plane wavefront loses only about 3 dB per doubling of distance in its near field, instead of the 6 dB of a point source.
- **category** *(NEW)*: Wave Physics
- **related_terms** *(NEW)*: Wavefront; Spherical Wave; Line Array; Inverse Square Law; Near Field; Wavelength
- **common_mistakes** *(NEW)*: Treating a plane wave as physically exact rather than an idealization valid only over a limited region or distance; Assuming plane-wave (line-array near-field) attenuation follows the 6 dB-per-doubling inverse-square law — it is closer to 3 dB; Confusing a plane wave (flat fronts) with a spherical wave (expanding fronts)
- **scenario_contexts** *(NEW)*: Predicting throw and level loss in a line array's near field; Analyzing sound propagation inside a duct or impedance (standing-wave) tube; Approximating a distant point source as locally plane at the listening position
- _sources: Lawrence Kinsler et al., Fundamentals of Acoustics; David McCarthy, Sound Systems: Design and Optimization_

### Sound Localization
*difficulty: beginner · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: How your hearing works out where a sound is coming from — its direction and roughly how far away it is.
- **purpose_function** *(NEW)*: It lets listeners place sources in space using two-ear timing and level differences plus spectral (pinna) cues, which is the basis of stereo and surround imaging as well as everyday situational awareness.
- **practical_application** *(NEW)*: Techs exploit localization when panning, when time-aligning a system, and when using the precedence (Haas) effect so a delayed fill loudspeaker doesn't pull the image away from the stage.
- **category** *(NEW)*: Psychoacoustics
- **related_terms** *(NEW)*: Interaural Time Difference (ITD); Interaural Level Difference (ILD); Precedence Effect; Panning; Binaural; Cocktail Party Effect
- **common_mistakes** *(NEW)*: Assuming localization uses only one cue — it combines ITD, ILD, and spectral pinna cues across frequency; Forgetting the precedence effect: the first arrival dominates perceived direction even when a later arrival is louder; Believing left/right panning conveys front/back or height, which actually require spectral cues
- **scenario_contexts** *(NEW)*: Setting delay on a fill or delay loudspeaker so listeners still localize to the stage (Haas effect); Panning instruments to build a coherent stereo image; Designing surround or immersive playback that reproduces directional cues
- _sources: Jens Blauert, Spatial Hearing (MIT Press); Brian C. J. Moore, An Introduction to the Psychology of Hearing_

### Superposition
*difficulty: advanced · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: When two sound waves overlap they simply add together point by point — crests reinforcing to get louder, or a crest meeting a trough to cancel out.
- **purpose_function** *(NEW)*: This linear-addition principle explains interference, standing waves, comb filtering, and beats, and it underlies how multiple sources combine at a listener's position.
- **practical_application** *(NEW)*: Techs use superposition to predict constructive and destructive summation between loudspeakers, between direct and reflected sound, or between two mics — the cause of power alley, comb filtering, and coverage lobing they must align out.
- **category** *(NEW)*: Wave Physics
- **related_terms** *(NEW)*: Interference; Comb Filtering; Standing Wave; Phase; Antinode; Wavefront
- **common_mistakes** *(NEW)*: Thinking overlapping sounds always get louder — they cancel where they are out of phase; Assuming acoustic summation is always +6 dB — the result depends on phase relationship and correlation; Forgetting that reflections superpose with the direct sound to create comb filtering
- **scenario_contexts** *(NEW)*: Diagnosing comb filtering where direct and reflected (or two-mic) signals sum; Predicting the 'power alley' buildup between two spaced subwoofers; Time-aligning loudspeakers so overlapping arrivals sum constructively across the coverage area
- _sources: Lawrence Kinsler et al., Fundamentals of Acoustics; David McCarthy, Sound Systems: Design and Optimization_

### Transverse Wave
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: A wave that wiggles sideways relative to the way it travels — like a shaken rope or a vibrating guitar string — unlike sound in air, which pushes back and forth along its path.
- **purpose_function** *(NEW)*: The concept distinguishes string, membrane, and surface vibrations (transverse) from sound propagation in air (longitudinal), clarifying how a source vibrates versus how airborne sound actually moves.
- **practical_application** *(NEW)*: Techs meet transverse motion in vibrating strings, speaker-cone surrounds, and structure-borne vibration, while remembering the radiated airborne sound itself is longitudinal.
- **category** *(NEW)*: Wave Physics
- **related_terms** *(NEW)*: Longitudinal Wave; Wavelength; Frequency; Standing Wave; Wavefront; Resonance
- **common_mistakes** *(NEW)*: Believing sound in air is transverse — airborne sound is longitudinal, made of compressions and rarefactions along the direction of travel; Confusing the transverse motion of a string with the longitudinal sound it radiates; Assuming all waves are transverse because rope and water waves are the usual classroom examples
- **scenario_contexts** *(NEW)*: Explaining how a plucked string vibrates versus how its sound reaches the ear; Understanding structure-borne (bending/transverse) vibration transmitted through a stage or floor; Teaching the difference between string motion and air-pressure waves in an acoustics class
- _sources: Lawrence Kinsler et al., Fundamentals of Acoustics; Thomas Rossing, The Science of Sound_

### Wavefront
*difficulty: intermediate · confidence: High*

- definition: [kept — unchanged]
- **plain_english** *(NEW)*: An imaginary surface connecting all the points of a sound wave that are 'in step' (same phase) as it spreads out — its shape can be a flat sheet or an expanding bubble.
- **purpose_function** *(NEW)*: Wavefront shape (plane versus spherical) governs how sound spreads and how quickly level drops, which is central to array design and coverage prediction.
- **practical_application** *(NEW)*: Techs shape and combine wavefronts in line arrays and steerable columns (via splay and DSP beam steering) to control coverage and keep arrivals coherent across a listening area.
- **category** *(NEW)*: Wave Physics
- **related_terms** *(NEW)*: Plane Wave; Spherical Wave; Line Array; Phase; Superposition; Wavelength
- **common_mistakes** *(NEW)*: Confusing a wavefront (a surface of equal phase) with a single ray or with the direction of travel; Assuming all wavefronts are spherical — near a large or line source they approximate plane fronts; Thinking a curved-array grid automatically produces one coherent wavefront without correct splay and processing
- **scenario_contexts** *(NEW)*: Designing line-array splay so element outputs merge into a coherent wavefront; Explaining spherical spreading and the 6 dB-per-doubling loss from a point source; Using DSP beam steering to shape the radiated wavefront of a column loudspeaker
- _sources: Lawrence Kinsler et al., Fundamentals of Acoustics; David McCarthy, Sound Systems: Design and Optimization_
