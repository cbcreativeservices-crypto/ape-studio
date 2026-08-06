# AP&E Glossary — Correction Changelog (committee suggestions applied)
*Applied 2026-07-10 to production `yjgolswjggmlpeowvtxr`. Backup: `glossary_backup_corrections_20260710` (52 rows). Verified: 52/52 corrected rows match intended values (md5); all 1,838 in-scope terms remain complete.*

Scope: **52 terms · 61 fields** revised from the independent 3-expert committee review. Only the fields below changed; every other field (and the 112 clean terms) is unchanged. Two terms (Noise-Canceling Microphone, In-Line Console) had a consistency suggestion whose stated scope covered a second list field, so both named fields were corrected.


## AUDI201 — Amplifiers

### Class G  *(advanced)*
**`practical_application`**
- Before:
    A live-sound or install tech encounters Class G in mid-to-high-power touring and installed amps that run cooler and draw less current than comparable Class AB units, meaning smaller heatsinks, less rack heat, and reduced current draw at idle.
- After:
    A live-sound or install tech encounters Class G in mid-to-high-power touring and installed amps that run cooler and draw less current than comparable Class AB units, so they need smaller heatsinks, add less rack heat, and pull less current at idle.
- *Editor notes:* practical_application: trimmed the redundant closing 'reduced current draw at idle' into a single non-repeating list per the suggestion; meaning and length preserved.

### Class H  *(advanced)*
**`common_mistakes`**
- Before:
    - Using 'Class G' and 'Class H' interchangeably — Class H modulates the rail continuously, Class G switches between discrete rails.
    - Thinking Class H is a switching (Class D) amplifier; the output stage is still linear and the rail modulation is what changes.
    - Assuming Class H needs an SMPS; rail tracking can also be done with a multi-tap linear supply.
- After:
    - Using 'Class G' and 'Class H' interchangeably — Class H modulates the rail continuously, Class G switches between discrete rails.
    - Thinking Class H is a switching (Class D) amplifier; the output stage is still linear and the rail modulation is what changes.
    - Assuming Class H must use an SMPS — the rail-modulator/tracking supply can be fed from a linear supply too; the defining feature is that the rail is varied continuously, not the supply type.
- *Editor notes:* common_mistakes: reworded the third bullet to drop the 'multi-tap' phrasing. Verified: Class H is continuous rail tracking, whereas a multi-tap/tapped supply switches between discrete stepped rails (Class G in this glossary's usage), so the original example contradicted the entry's own definition. Corrected to say the tracking supply may be fed from a linear supply, with continuous rail variation as the defining feature.


## AUDI201 — Analog Live Sound

### Cable Management  *(intermediate)*
**`common_mistakes`**
- Before:
    - UNSAFE: Leaving cables loose across a walkway, doorway, or audience path — an untamed run is a fall/trip hazard; cross-traffic cables must be taped with gaffer tape or covered with a rated cable ramp or mat.
    - UNSAFE: Running audio cables bundled tightly alongside AC power cables, which invites hum/interference and mixes signal with mains — keep power and signal separated and cross at 90 degrees when they must meet.
    - Coiling cable against its natural lay (not using an over-under coil), which kinks conductors and shortens cable life.
    - Using duct tape instead of gaffer tape, leaving adhesive residue on cables and floors.
- After:
    - UNSAFE: Leaving cables loose across a walkway, doorway, or audience path — an untamed run is a fall/trip hazard; cross-traffic cables must be taped with gaffer tape or covered with a rated cable ramp or mat.
    - UNSAFE: Running audio cables bundled tightly alongside AC power cables, which invites hum/interference and mixes signal with mains — keep power and signal separated and cross at 90 degrees when they must meet.
    - Coiling cable against its natural lay instead of using an over-under coil (alternating a normal loop with a reversed loop so the cable lies flat and pays out without twist), which kinks conductors and shortens cable life.
    - Using duct tape instead of gaffer tape, leaving adhesive residue on cables and floors.
- *Editor notes:* common_mistakes: added a one-clause gloss defining the over-under coil on its first appearance, turning the warning into an actionable technique. · Declined the second (Low) formatting suggestion to normalize the 'UNSAFE:' prefixes: the mixed prefixing is the deliberate two-tier safety convention (that suggestion itself says no change is needed if intentional), and the brief requires keeping UNSAFE prefixes intact. Prefixes left as-is.

### Load-In  *(beginner)*
**`common_mistakes`**
- Before:
    - Confusing load-in (moving gear in and setting up) with soundcheck, which comes after the system is built.
    - Ignoring the advanced load-in schedule and access details (dock, door sizes, union/house rules), causing delays.
    - Under-staffing the call so the large amount of work in a short window runs late.
- After:
    - Confusing load-in (moving gear in and setting up) with soundcheck, which comes after the system is built.
    - Ignoring the load-in schedule and access details confirmed during the advance (dock, door sizes, union/house rules), causing delays.
    - Under-staffing the call so the large amount of work in a short window runs late.
**`scenario_contexts`**
- Before:
    - A crew meets the truck at the loading dock at the 8 a.m. load-in call to begin building the stage.
    - A house tech coordinates load-in order so the PA goes up before backline and monitors are placed.
    - A festival stagger the load-in of multiple acts to share limited dock and stage access.
- After:
    - A crew meets the truck at the loading dock at the 8 a.m. load-in call to begin building the stage.
    - A house tech coordinates load-in order so the PA goes up before backline and monitors are placed.
    - A festival staggers the load-in of multiple acts to share limited dock and stage access.
- *Editor notes:* common_mistakes: reconciled both Low suggestions — replaced ambiguous 'advanced load-in schedule' with 'load-in schedule and access details confirmed during the advance', making the tie to the Production Advance term explicit while keeping 'causing delays'. · scenario_contexts: fixed subject-verb agreement 'A festival stagger' -> 'A festival staggers'.


## AUDI201 — Assisted Listening Systems

### Closed Captioning  *(beginner)*
**`practical_application`**
- Before:
    An AV tech enables a decoder, caption channel, or caption encoder in the signal chain and verifies captions are accurate, synchronized, complete, and correctly placed; in live events this often means routing a CART/captioner feed to displays or a caption bar.
- After:
    An AV tech enables a decoder, caption channel, or caption encoder in the signal chain and verifies captions are accurate, synchronized, complete, and correctly placed; in live events this often means routing a CART (Communication Access Realtime Translation)/captioner feed to displays or a caption bar.
**`common_mistakes`**
- Before:
    - Confusing closed captions with subtitles. Subtitles assume the viewer can hear and only translate dialogue, while closed captions also convey speaker IDs and non-speech sounds for deaf/HOH viewers.
    - Confusing closed with open captions. Open (burned-in) captions cannot be turned off; closed captions are user-toggleable.
    - Assuming captions satisfy accessibility on their own. The ADA requires an assistive-listening (audio) system in most assembly areas in addition to visual access.
    - Neglecting synchronization and accuracy, which FCC quality rules require captions to be accurate, synchronous, complete, and properly placed.
- After:
    - Confusing closed captions with subtitles. Subtitles assume the viewer can hear and only translate dialogue, while closed captions also convey speaker IDs and non-speech sounds for deaf/HOH viewers.
    - Confusing closed with open captions. Open (burned-in) captions cannot be turned off; closed captions are user-toggleable.
    - Assuming captions satisfy accessibility on their own. The ADA requires an assistive-listening (audio) system in most assembly areas in addition to visual access.
    - Neglecting synchronization and accuracy — FCC quality rules require captions to be accurate, synchronous, complete, and properly placed.
- *Editor notes:* practical_application: expanded 'CART' on first use to 'CART (Communication Access Realtime Translation)'. · common_mistakes: repaired the garbled/dangling fourth bullet into a clean two-clause sentence using an em dash; content (FCC accurate/synchronous/complete/properly placed) unchanged.

### Field Strength Meter  *(intermediate)*
**`common_mistakes`**
- Before:
    - Judging a loop by ear or by hearing-aid reception instead of a calibrated meter, which cannot confirm the 400 mA/m level or uniformity.
    - Measuring at only one spot. IEC 60118-4 requires checking multiple listening positions because field strength must stay within +/-3 dB across the area.
    - Ignoring background magnetic noise, which must be low enough (typically no worse than -32 dB, ideally -47 dB(A)) or intelligibility suffers.
    - Forgetting to set/verify the 1 kHz reference tone before reading, giving meaningless field-strength numbers.
- After:
    - Judging a loop by ear or by hearing-aid reception, neither of which can confirm the 400 mA/m level or field uniformity, instead of using a calibrated meter.
    - Measuring at only one spot. IEC 60118-4 requires checking multiple listening positions because field strength must stay within +/-3 dB across the area.
    - Ignoring background magnetic noise, which must be low enough (typically no worse than -32 dB, ideally -47 dB(A)) or intelligibility suffers.
    - Forgetting to set/verify the 1 kHz reference tone before reading, giving meaningless field-strength numbers.
- *Editor notes:* common_mistakes: fixed the misplaced relative clause in item 1 so 'neither of which can confirm' now correctly refers to judging by ear/hearing-aid reception rather than to the calibrated meter.

### IEC 60118-4  *(advanced)*
**`common_mistakes`**
- Before:
    - Assuming a loop is compliant just because it is installed. Compliance requires measured verification against the standard's field-strength, response, and noise limits.
    - Reading 400 mA/m as the peak. It is the long-term reference level (0 dB), with peaks allowed above it, and the design target is +/-3 dB at 1 kHz.
    - Checking only field strength and skipping frequency response (100 Hz-5 kHz within +/-3 dB) and background-noise requirements.
    - Confusing IEC 60118-4 (loop performance) with ADA rules, which mandate that assistive listening be provided but reference this standard for loop quality.
- After:
    - Assuming a loop is compliant just because it is installed. Compliance requires measured verification against the standard's field-strength, response, and noise limits.
    - Reading 400 mA/m as the peak. It is the long-term reference level (0 dB), with peaks allowed above it, and the design target is +/-3 dB at 1 kHz.
    - Checking only field strength and skipping frequency response (100 Hz-5 kHz within +/-3 dB) and background-noise requirements.
    - Confusing IEC 60118-4 (loop performance) with the ADA, which mandates that assistive listening be provided; the requirement that installed hearing loops meet IEC 60118-4 comes through ICC/ANSI A117.1, not the ADA text itself.
- *Editor notes:* common_mistakes: corrected the last bullet's attribution. Verified: the 2010 ADA Standards require assistive listening be provided but do not cite IEC 60118-4; the requirement that installed hearing loops comply with IEC 60118-4 comes via ICC/ANSI A117.1 (2017, Sec. 106.22).

### Wi-Fi Assistive Streaming  *(intermediate)*
**`common_mistakes`**
- Before:
    - Assuming the app alone satisfies the ADA. Compliance requires the correct number of receivers/loaner devices, neck loops, and signage in addition to the streaming system.
    - Underprovisioning Wi-Fi. Insufficient access-point coverage or bandwidth causes dropouts and defeats the assistive purpose.
    - Ignoring latency, which excessive lag breaks lip-sync between the streamed audio and the live/stage source.
    - Assuming telecoil users are served automatically. Hearing-aid users need a neck loop paired to the phone to reach their telecoil.
- After:
    - Assuming the app alone satisfies the ADA. Compliance requires the correct number of receivers/loaner devices, neck loops, and signage in addition to the streaming system.
    - Underprovisioning Wi-Fi. Insufficient access-point coverage or bandwidth causes dropouts and defeats the assistive purpose.
    - Ignoring latency: excessive lag breaks lip-sync between the streamed audio and the live source on stage, so listeners hear words out of step with what they see.
    - Assuming telecoil users are served automatically. Hearing-aid users need a neck loop paired to the phone to reach their telecoil.
- *Editor notes:* common_mistakes: rewrote the garbled latency bullet (item 3) as a clean cause-effect sentence, satisfying both the Learning/Cognition and Language/Communications flags; other three items unchanged.


## AUDI201 — Audio Measurement & Optimization

### Exponential Sine Sweep  *(advanced)*
**`practical_application`**
- Before:
    It is the default stimulus in tools like REW, ARTA, and Smaart for capturing a loudspeaker or room impulse response and, in the same pass, reading off the harmonic distortion of the device under test.
- After:
    It is the default stimulus in tools like REW and ARTA for capturing a loudspeaker or room impulse response and, in the same pass, reading off the harmonic distortion of the device under test; real-time analyzers such as Smaart can also drive sweeps to capture an IR but do not separate distortion products this way.
- *Editor notes:* practical_application: removed Smaart from the claim that the log sweep is the default stimulus for reading off harmonic distortion in one pass. Verified Smaart is a dual-channel FFT transfer-function analyzer whose default workflow is real-time measurement with pink noise/program material; with log sweeps its distortion products wrap around as pre-arrivals rather than being resolved into separate harmonic orders (Farina ESS deconvolution). REW and ARTA do provide that ESS distortion analysis, so they are kept; Smaart is moved to a note that it also supports sweeps for IR capture.


## AUDI201 — Commercial Audio Systems

### Mass Notification System  *(intermediate)*
**`practical_application`**
- Before:
    Integrators lay out speakers and tune DSP for intelligibility (an STI target near 0.50 (≈0.70 CIS)), install a UL 2572-listed control unit with backup power and supervised circuits, and set message priority so emergency notification overrides paging and background music; commissioning includes intelligibility (STI/CIS) verification at occupant locations.
- After:
    Integrators lay out speakers and tune DSP for intelligibility toward an STI of about 0.50, equivalent to roughly 0.70 on the CIS scale, install a UL 2572-listed control unit with backup power and supervised circuits, and set message priority so emergency notification overrides paging and background music; commissioning includes intelligibility (STI/CIS) verification at occupant locations.
- *Editor notes:* practical_application: unpacked the nested parentheses 'an STI target near 0.50 (=0.70 CIS)' into plain prose. Verified the dual-metric fact: CIS = 1 + log10(STI), so STI 0.50 corresponds to CIS 0.699 (~0.70); numbers preserved as correct. · purpose_function: DECLINED to change. The Language/Communications expert labeled this field but quoted the nested-parentheses phrase 'tune DSP for intelligibility (an STI target near 0.50 (=0.70 CIS))', which actually appears in practical_application; purpose_function contains no such text. Both suggestions concern the same real phrase, so both were applied to practical_application. Altering purpose_function would fabricate content that was never there.


## AUDI201 — Consumer Audio Systems

### Bass Shaker (Tactile Transducer)  *(advanced)*
**`related_terms`**
- Before:
    - Subwoofer
    - LFE Channel
    - Crossover
    - Amplifier
    - Network Streamer
- After:
    - Subwoofer
    - LFE Channel
    - Crossover
    - Amplifier
    - AV Receiver
- *Editor notes:* related_terms: replaced the stray cross-link 'Network Streamer' (a source/transport unrelated to seat-mounted tactile vibration) with 'AV Receiver', a genuinely related home-theater component; other four terms unchanged.

### Direct Drive  *(beginner)*
**`practical_application`**
- Before:
    A tech relies on its instant torque for cueing, back-cueing, and scratching, and can use its speed stability and quartz-lock pitch control for reliable playback and mixing.
- After:
    A tech relies on its instant torque for cueing, back-cueing, and scratching, and can use its speed stability and quartz-lock pitch control (an electronic speed reference that holds the platter exactly on speed) for reliable playback and mixing.
- *Editor notes:* practical_application: added a plain-language gloss for 'quartz-lock pitch control' so the beginner-level term stays depth-consistent; wording otherwise unchanged.

### Network Streamer  *(intermediate)*
**`related_terms`**
- Before:
    - DAC
    - MQA
    - Amplifier
    - NAS
    - Bass Shaker (Tactile Transducer)
- After:
    - DAC
    - MQA
    - Amplifier
    - NAS
    - Streaming Service
- *Editor notes:* related_terms: replaced the reciprocal stray cross-link 'Bass Shaker (Tactile Transducer)' with 'Streaming Service', which reinforces the streaming knowledge map; satisfies both the Audio Technical and Learning/Cognition flags. The reciprocal link was also removed from the Bass Shaker term. Other four terms unchanged.

### Tracking Force  *(intermediate)*
**`purpose_function`**
- Before:
    It sets the downward stylus weight so the stylus stays properly seated in the groove; too little causes mistracking and skipping, too much increases groove and stylus wear, so it is set to the cartridge maker's specified value.
- After:
    It sets the downward stylus weight so the stylus stays properly seated in the groove. Too little causes mistracking and skipping; too much increases groove and stylus wear, so it is set to the cartridge maker's specified value.
- *Editor notes:* purpose_function: split the single semicolon-chained sentence into two for easier parsing; content and meaning unchanged.


## AUDI201 — Corporate AV

### Breakout Room  *(intermediate)*
**`common_mistakes`**
- Before:
    - Under-provisioning audio so a talky, Q&A-heavy room ends up without enough working microphones
    - Assuming breakout gear needs the same scale as the general session and over-ordering, or ignoring that rapid presenter/laptop swaps need reliable switching
    - Forgetting that multiple breakouts running at once can share wireless RF space and cause interference if frequencies are not coordinated
- After:
    - Under-provisioning audio so a talky, Q&A-heavy room ends up without enough working microphones
    - Assuming breakout gear needs the same scale as the general session and over-ordering
    - Ignoring that rapid presenter/laptop swaps need reliable source switching
    - Forgetting that multiple breakouts running at once can share wireless RF space and cause interference if frequencies are not coordinated
- *Editor notes:* common_mistakes: split the combined second bullet into two single-idea items (over-ordering; and needing reliable source switching), restoring the one-idea-per-item parallel structure; other bullets unchanged.

### General Session  *(intermediate)*
**`scenario_contexts`**
- Before:
    - A conference opens with a keynote in the general session for all 1,500 attendees before splitting into breakouts
    - A product launch stages a large general session with LED wall, live cameras, and IMAG for the audience
    - An annual company meeting holds its awards presentation in the general session room
- After:
    - A conference opens with a keynote in the general session for all 1,500 attendees before splitting into breakouts
    - A product launch stages a large general session with LED wall, live cameras, and IMAG (image magnification—the presenter shown enlarged on the big screens) for the audience
    - An annual company meeting holds its awards presentation in the general session room
- *Editor notes:* scenario_contexts: glossed the acronym IMAG on first use as image magnification; other scenarios unchanged.

### Lectern  *(beginner)*
**`practical_application`**
- Before:
    A tech mounts and tests the gooseneck or podium mic, dresses the cabling, and may add a monitor lift or confidence display, and selects an ADA height-adjustable model when accessibility is required.
- After:
    A tech mounts and tests the gooseneck or podium mic, dresses the cabling, may add a monitor lift or confidence display, and selects an ADA height-adjustable model when accessibility is required.
- *Editor notes:* practical_application: recast as a single clean series, removing the second coordinating 'and' so the actions no longer read as a run-on; meaning and length preserved.


## AUDI201 — Digital Live Sound

### Digital Snake  *(beginner)*
**`common_mistakes`**
- Before:
    - Assuming any Ethernet cable works: unshielded or damaged patch cables and non-locking connectors cause dropouts, so use shielded, ruggedized locking (etherCON) cable rated for the network in use
    - Confusing the audio transport (Dante, AVB, MADI) with the physical cable, and assuming snakes from different systems interoperate
    - Forgetting the copper distance limit (about 100 m per Ethernet hop) and needing fiber or a switch for longer runs
    - Running a single cable with no backup and having no redundant path for a critical show
- After:
    - Assuming any Ethernet cable works: unshielded or damaged patch cables and non-locking connectors cause dropouts, so use shielded, ruggedized locking (etherCON) cable rated for the network in use
    - Confusing the audio transport (the digital format the data uses, such as Dante, AVB, or MADI) with the physical cable, and assuming snakes from different systems interoperate
    - Forgetting the copper distance limit (about 100 m per Ethernet hop) and needing fiber or a switch for longer runs
    - Running a single cable with no backup and having no redundant path for a critical show
- *Editor notes:* common_mistakes: added a brief gloss ('the digital format the data uses') on first mention of audio transport so a beginner meets the protocol names with context; misconception-correction and other bullets preserved.

### Expansion Card  *(beginner)*
**`common_mistakes`**
- Before:
    - Buying a card in the wrong physical or electrical format for the console's slot (for example a DiGiCo DMI card versus a Yamaha mini-YGDAI card are not interchangeable)
    - Assuming the card automatically routes audio: channels still have to be patched and, for networked cards, configured in the network controller software
    - Overlooking sample-rate and channel-count limits (many cards do 64x64 at 48 kHz but half that or different behavior at 96 kHz)
    - Hot-swapping a card with the console powered when the manufacturer requires power-down, risking damage
- After:
    - Buying a card in the wrong physical or electrical format for the console's slot (for example, a DiGiCo DMI card and a Yamaha mini-YGDAI card are not interchangeable)
    - Assuming the card automatically routes audio: channels still have to be patched and, for networked cards, configured in the network controller software
    - Overlooking sample-rate and channel-count limits (many cards do 64x64 at 48 kHz but half that or different behavior at 96 kHz)
    - Hot-swapping a card with the console powered when the manufacturer requires power-down, risking damage
- *Editor notes:* common_mistakes: fixed subject-verb agreement in the first item by joining the two singular subjects with 'and' (two cards ... are not interchangeable) and removing the awkward 'versus'; other bullets unchanged.


## AUDI201 — Loudspeaker System Deployment

### Bridle  *(advanced)*
**`common_mistakes`**
- Before:
    - UNSAFE: Letting the included angle at the apex grow toward or past 90-120 degrees, which multiplies each leg's tension far above the shared load and can overload slings and truss chords.
    - UNSAFE: Guessing leg lengths and tensions instead of calculating them, or exceeding a beam point's or sling's WLL because sling-angle load multipliers were ignored.
    - Forgetting that a wider apex angle raises the tension in each leg for the same suspended load.
    - UNSAFE: Attaching bridle legs to non-structural or unverified points.
- After:
    - UNSAFE: Letting the apex angle widen too far—the wider the included angle, the higher the tension in each leg for the same suspended load. At about a 120-degree included angle each leg's tension already equals the full suspended load, and it climbs steeply beyond that (roughly twice the load near 150 degrees); keep the included angle well under 90 degrees and always calculate leg tensions from the sling-angle factor.
    - UNSAFE: Guessing leg lengths and tensions instead of calculating them, or exceeding a beam point's or sling's WLL because sling-angle load multipliers were ignored.
    - Forgetting that a wider apex angle raises the tension in each leg for the same suspended load.
    - UNSAFE: Attaching bridle legs to non-structural or unverified points.
- *Editor notes:* common_mistakes: reconciled three suggestions (Audio Technical, Learning/Cognition, Language/Communications) on the first bullet into one. Verified physics: leg tension = (W/2)/cos(half the included angle), so at 120 deg included each leg = full suspended load (cos60=0.5), ~0.71W at 90 deg, and ~1.93W (~2x) near 150 deg. Bullet now states the angle-tension relationship plainly, gives one clear threshold instead of the ambiguous '90-120' range, uses the accurate multiplier, and keeps the UNSAFE: prefix. Other bullets and their UNSAFE: prefixes unchanged.

### Chain Hoist  *(beginner)*
**`practical_application`**
- Before:
    A tech rigs the hoist to a rated overhead point, connects the load's rigging to the hoist hook, and raises the array to trim, choosing a duty class (e.g., D8, D8+, C1) appropriate to whether people will be beneath the load.
- After:
    A tech rigs the hoist to a rated overhead point, connects the load's rigging to the hoist hook, and raises the array to trim, choosing a duty class (e.g., D8, D8+, C1) appropriate to whether people will be beneath the load; for North American work this follows ANSI/ESTA E1.6—E1.6-1 for powered hoist systems and E1.6-2 for design, inspection, and maintenance of electric chain hoists—together with OSHA 29 CFR 1926, alongside the EU-origin D8/D8+/C1 duty framework.
- *Editor notes:* practical_application: added the applicable North American standards as substantive safety guidance next to the EU duty classes. Verified titles: ANSI E1.6-1 = Powered Hoist Systems; ANSI E1.6-2 = Design, Inspection, and Maintenance of Electric Chain Hoists for the Entertainment Industry; plus OSHA 29 CFR 1926. Duty-class content (D8/D8+/C1) left intact; no field-content citation formatting used, only the named governing standards as technical content.

### Front Fill  *(beginner)*
**`practical_application`**
- Before:
    A tech spaces low-profile cabinets along the stage lip and time-aligns (delays) them slightly late so the audience still localizes to the stage rather than to the fill boxes.
- After:
    A tech spaces low-profile cabinets along the stage lip and time-aligns them (adding a small delay) so the audience still localizes to the stage rather than to the fill boxes.
- *Editor notes:* practical_application: removed the redundant 'delays them slightly late' phrasing per the language suggestion; reworded to 'time-aligns them (adding a small delay)' while preserving meaning and length.

### Shackle  *(beginner)*
**`common_mistakes`**
- Before:
    - UNSAFE: Side-loading a shackle (pulling at an angle across the bow/pin), which can cut capacity drastically - roughly 50% at 90 degrees - and bend the bow.
    - UNSAFE: Judging capacity by size instead of the WLL marking stamped on the body, or using an unmarked/unrated shackle.
    - UNSAFE: Using a screw-pin shackle where motion can back the pin out, without mousing it or using a bolt-type (safety) shackle.
    - Loading the shackle so the sling bears on the pin instead of the bow, or not fully seating the pin.
- After:
    - UNSAFE: Side-loading a shackle (pulling at an angle across the bow/pin), which can cut capacity drastically - roughly 50% at 90 degrees - and bend the bow.
    - UNSAFE: Judging capacity by size instead of the WLL marking stamped on the body, or using an unmarked/unrated shackle.
    - UNSAFE: Using a screw-pin shackle where motion can back the pin out, without mousing it (securing the screw pin with wire or a zip tie so vibration cannot back it out) or using a bolt-type (safety) shackle.
    - Loading the shackle so the sling bears on the pin instead of the bow, or not fully seating the pin.
**`practical_application`**
- Before:
    A tech reads the WLL stamped on the bow, selects the right type (screw-pin or bolt/safety type), fully seats the pin, and connects the sling to the pick point, keeping the load in line with the bow.
- After:
    A tech reads the Working Load Limit (WLL) stamped on the bow, selects the right type (screw-pin or bolt/safety type), fully seats the pin, and connects the sling to the pick point, keeping the load in line with the bow.
- *Editor notes:* common_mistakes: added an inline gloss for 'mousing it' in the third bullet so a beginner grasps the safety takeaway; UNSAFE prefixes and all other bullets unchanged. · practical_application: spelled out 'Working Load Limit (WLL)' on first use for the beginner audience; rest of sentence unchanged.

### Splay Angle  *(intermediate)*
**`common_mistakes`**
- Before:
    - Using splay angles too wide near the top (e.g., beyond roughly 4-5 degrees), causing low-frequency phase/comb issues and lost long-throw energy.
    - Applying a uniform splay when a progressive scheme (tight top to wide bottom) is needed for even coverage.
    - Ignoring the prediction software's calculated angles and eyeballing the array instead.
    - Confusing splay (angle between cabinets) with the overall array/site angle set at the bumper.
- After:
    - Using splay angles too wide near the top of the array, which reduces high-frequency coupling and long-throw energy and can leave coverage gaps in the back rows.
    - Applying a uniform splay when a progressive scheme (tight top to wide bottom) is needed for even coverage.
    - Ignoring the prediction software's calculated angles and eyeballing the array instead.
    - Confusing splay (angle between cabinets) with the overall array/site angle set at the bumper.
**`plain_english`**
- Before:
    The angle between two neighbouring boxes in a line array; usually tight at the top for far throw and progressively wider toward the bottom for near coverage.
- After:
    The angle between two neighboring boxes in a line array; usually tight at the top for far throw and progressively wider toward the bottom for near coverage.
- *Editor notes:* common_mistakes: corrected the mechanism per Audio Technical (verified) - dropped the 'low-frequency phase/comb' claim because LF couples across the array regardless of splay and comb filtering is predominantly a high-frequency phenomenon; now attributes over-wide top splay to lost HF coupling/long-throw energy and back-row gaps. Top-tight/bottom-wide guidance retained; other bullets unchanged. · plain_english: changed British 'neighbouring' to American 'neighboring' for spelling consistency.


## AUDI201 — RF Wireless Systems

### Digital Wireless System  *(beginner)*
**`related_terms`**
- Before:
    - Companding
    - Latency
    - Frequency Coordination
    - Digital Wireless System
    - RF Interference
- After:
    - Companding
    - Latency
    - Frequency Coordination
    - Analog Wireless System
    - RF Interference
- *Editor notes:* related_terms: removed the self-reference 'Digital Wireless System' and replaced it with 'Analog Wireless System', the choice favored by multiple experts because it reinforces the analog-FM/compander contrast the definition draws. Other terms unchanged.

### Dipole Antenna  *(intermediate)*
**`common_mistakes`**
- Before:
    - Believing a dipole is perfectly omnidirectional, when its pattern is a torus that is weakest off the ends of the elements
    - Mounting the antenna flat or against metal, distorting the pattern and hurting reception
    - Confusing dBi and dBd references, since a half-wave dipole is about 2.15 dB below isotropic reference
    - Using a bundled dipole for long-throw coverage where a directional antenna is required
- After:
    - Believing a dipole is perfectly omnidirectional, when its pattern is a torus that is weakest off the ends of the elements
    - Mounting the antenna flat or against metal, distorting the pattern and hurting reception
    - Confusing dBi and dBd references, since a half-wave dipole has about 2.15 dB of gain relative to isotropic (2.15 dBi = 0 dBd)
    - Using a bundled dipole for long-throw coverage where a directional antenna is required
- *Editor notes:* common_mistakes: HIGH-severity factual fix (verified). A half-wave dipole is ~2.15 dBi, i.e. 2.15 dB ABOVE isotropic, and dBi = dBd + 2.15 (2.15 dBi = 0 dBd). Corrected the third bullet from the reversed 'about 2.15 dB below isotropic'. Other bullets unchanged.

### Yagi Antenna  *(advanced)*
**`common_mistakes`**
- Before:
    - Using a Yagi across a wide wireless-mic frequency range when its bandwidth is often only about one 6 MHz TV channel
    - Assuming high gain fixes all range problems, ignoring that narrow beamwidth requires careful aiming
    - Placing a directional antenna too close to transmitters instead of the recommended minimum distance (about 50 feet / roughly 3 meters minimum)
    - Confusing a Yagi with a log-periodic array, which offers similar directivity over much wider bandwidth for audio use
- After:
    - Using a Yagi across a wide wireless-mic frequency range when its bandwidth is often only about one 6 MHz TV channel
    - Assuming high gain fixes all range problems, ignoring that narrow beamwidth requires careful aiming
    - Placing a directional antenna too close to transmitters instead of the recommended minimum distance (about 50 feet / roughly 15 meters minimum)
    - Confusing a Yagi with a log-periodic array, which offers similar directivity over much wider bandwidth for audio use
- *Editor notes:* common_mistakes: fixed the metric conversion in the third bullet - 50 feet is approximately 15 meters (50 x 0.3048 = 15.24 m), not 3 meters. Kept the 50 ft directional-antenna figure, which matches Shure's guidance. Other bullets unchanged.


## AUDI201 — Vehicle Audio

### High-Level Input  *(intermediate)*
**`common_mistakes`**
- Before:
    - Confusing high-level (speaker-level) inputs with line-level RCA inputs and feeding the wrong signal type into the wrong terminals.
    - Tapping the speaker wires after a factory amplifier or processor, capturing an already-EQ'd/limited signal instead of a clean full-range one.
    - Setting amp gain using the high-level input as if it were a low-level source, causing clipping because the input voltage is much higher.
    - Leaving factory speakers connected in parallel on the same tapped wires when the amp expects a bridged/high-impedance sense signal, causing turn-on or load issues.
- After:
    - Confusing high-level (speaker-level) inputs with line-level RCA inputs and feeding the wrong signal type into the wrong terminals.
    - Tapping the speaker wires after a factory amplifier or processor, capturing an already-EQ'd/limited signal instead of a clean full-range one.
    - Setting amp gain using the high-level input as if it were a low-level source, causing clipping because the input voltage is much higher.
    - Assuming you must disconnect the factory speakers when tapping their wires for a high-level input; the input is typically high-impedance and simply senses the signal, so the factory speakers can stay connected, and some factory head units actually need that load to work correctly or to sustain signal-sense turn-on.
- *Editor notes:* common_mistakes: reframed the inverted fourth bullet per both experts. High-level inputs are high-impedance and do not load the tapped signal, so leaving factory speakers connected in parallel is normal (and sometimes required for signal-sense turn-on); the real misconception is thinking you must disconnect them. Removed the muddled 'bridged/high-impedance sense signal' framing. Other bullets unchanged.

### Signal-Sensing Turn-On  *(intermediate)*
**`common_mistakes`**
- Before:
    - Playing audio at very low volume, so the sense circuit never sees enough voltage swing and the amp fails to turn on or cycles off.
    - Expecting instant, click-free operation — signal-sense adds a short turn-on delay and can produce a pop, and it drops out on silent passages if using AC-signal detection rather than DC-offset detection.
    - Using signal sensing when a clean switched 12V source is available, adding unnecessary turn-on lag and reliability issues.
    - Tapping the sense signal from wires that are muted or powered down by the factory system in certain modes, causing the amp not to wake.
- After:
    - Playing audio at very low volume, so the sense circuit never sees enough voltage swing and the amp fails to turn on or cycles off.
    - Expecting instant, click-free operation — signal-sensing adds a short turn-on delay and can produce a pop. With AC-signal detection (rather than DC-offset detection), it can also drop out during silent passages.
    - Using signal sensing when a clean switched 12V source is available, adding unnecessary turn-on lag and reliability issues.
    - Tapping the sense signal from wires that are muted or powered down by the factory system in certain modes, causing the amp not to wake.
- *Editor notes:* common_mistakes: split the second bullet's comma-spliced run-on into two sentences (turn-on delay/pop, then AC-detection dropout) for parallelism with the surrounding bullets; content unchanged.

### Subsonic Filter  *(advanced)*
**`practical_application`**
- Before:
    On a ported build, the installer sets the amp's subsonic filter roughly a half-octave (about 80%) below the enclosure tuning frequency — for example, near 25–28 Hz for a box tuned to 30 Hz — to keep the cone under control near and below tuning.
- After:
    On a ported build, the installer sets the amp's subsonic filter at or slightly below the enclosure tuning frequency — a few Hz under tuning, for example near 25–28 Hz for a box tuned to 30 Hz — to keep the cone under control near and below tuning.
- *Editor notes:* practical_application: removed the internally inconsistent 'half-octave (about 80%)' characterization (a half-octave below 30 Hz is ~21 Hz and 80% is 24 Hz, neither matching the 25–28 Hz example) and described the setting as at or a few Hz below port tuning, which matches the worked example and standard practice.


## MUSI190 — Amps & Loudspeakers

### Isobaric Loading  *(advanced)*
**`practical_application`**
- Before:
    A tech uses isobaric pairs where cabinet size is tightly limited, accepting the extra driver cost and weight, and no gain in efficiency, in exchange for a smaller box.
- After:
    A tech uses isobaric pairs where cabinet size is tightly limited, accepting the extra driver cost and weight — with no gain in efficiency — in exchange for a smaller box.
- *Editor notes:* practical_application: set the efficiency point off as a parenthetical aside so 'accepting' no longer governs 'no gain in efficiency', fixing the broken list logic; meaning unchanged.


## MUSI190 — Connectors & I/O Connections

### DisplayPort  *(beginner)*
**`common_mistakes`**
- Before:
    - Assuming DisplayPort and HDMI plugs are interchangeable without an active adapter; the two standards are electrically different.
    - Forgetting that DisplayPort can carry embedded audio, then hunting for a separate audio feed that is actually inside the video cable.
    - Yanking a full-size DisplayPort cable without releasing the latch, which can damage the connector or port.
- After:
    - Assuming any DisplayPort output drives an HDMI display through a passive adapter; a passive DP-to-HDMI adapter works only from a Dual-Mode (DP++) source at limited resolution and refresh, while an active adapter is required otherwise — and always for the HDMI-to-DisplayPort direction.
    - Forgetting that DisplayPort can carry embedded audio, then hunting for a separate audio feed that is actually inside the video cable.
    - Yanking a full-size DisplayPort cable without releasing the latch, which can damage the connector or port.
- *Editor notes:* common_mistakes: reworded the first bullet to reflect verified adapter behavior — passive DP-to-HDMI adapters work only from a Dual-Mode (DP++) source at limited resolution/refresh; active adapters are needed for non-DP++ sources, higher resolutions, and always for HDMI-to-DisplayPort. Confirmed via VESA DP++ / adapter references.

### GPIO  *(advanced)*
**`scenario_contexts`**
- Before:
    - Triggering an on-air or recording tally lamp from a broadcast console.
    - Using fader-start logic so opening a channel launches a playback device.
    - Sending a contact closure over a Dante or AoIP network to mute a zone or fire an EVAC override.
- After:
    - Triggering an on-air or recording tally lamp from a broadcast console.
    - Using fader-start logic so opening a channel launches a playback device.
    - Sending a contact closure over a Dante or AoIP network to mute a zone or interface with a certified life-safety system — the actual EVAC trigger must originate from a supervised fire-alarm pathway (NFPA 72 / UL 2572 / EN 54-16), not an unmonitored AoIP GPIO.
- *Editor notes:* scenario_contexts: qualified the third bullet so an unsupervised AoIP GPIO contact closure is no longer presented as a valid life-safety EVAC trigger; added the requirement that EVAC actuation use a supervised, certified pathway (NFPA 72 / UL 2572 / EN 54-16).

### MicroDot Connector  *(advanced)*
**`related_terms`**
- Before:
    - Hirose Connector
    - Lavalier Microphone
    - Measurement Microphone
    - Phantom Power
    - TA5F (Lemo)
- After:
    - Hirose Connector
    - Lavalier Microphone
    - Measurement Microphone
    - Phantom Power
    - TA5F (Switchcraft mini-XLR)
- *Editor notes:* related_terms: corrected 'TA5F (Lemo)' to 'TA5F (Switchcraft mini-XLR)'. Verified: TA5F is a Switchcraft Tini-QG 5-pin mini-XLR; LEMO is a separate circular connector brand — the two are physically distinct (hence TA5F-to-LEMO adapter cables). Left Lemo out rather than adding an unflagged item.

### SC Connector  *(advanced)*
**`purpose_function`**
- Before:
    A fiber connector using a 2.5 mm ferrule and a square push-pull housing with a locking-tab retention, standardized in early telecom specifications. It exists to provide a robust, easy-to-mate fiber termination and is common on legacy and telecom-grade infrastructure.
- After:
    A fiber connector using a 2.5 mm ferrule and a square push-pull coupling housing that snaps into a latched position on insertion, standardized in early telecom specifications. It exists to provide a robust, easy-to-mate fiber termination and is common on legacy and telecom-grade infrastructure.
- *Editor notes:* purpose_function: replaced 'square push-pull housing with a locking-tab retention' with 'square push-pull coupling housing that snaps into a latched position on insertion' — removes the LC-style 'locking-tab' descriptor (SC self-retains via spring-loaded push-pull), aligns the mechanism language with plain_english's 'push-pull ... clicks in and out', and fixes the awkward count-noun grammar. Reconciles all three suggestions.

### USB-B  *(beginner)*
**`common_mistakes`**
- Before:
    - Confusing the taller USB 3.0 Type-B shell with the standard USB 2.0 Type-B and forcing the wrong cable.
    - Assuming USB-B is upstream/host-capable; it is the device-side port and connects to a host such as USB-A or USB-C.
    - Using a marginal or damaged USB-B cable and blaming the interface for intermittent audio dropouts.
- After:
    - Confusing the taller USB 3.0 Type-B shell with the standard USB 2.0 Type-B and forcing the wrong cable.
    - Assuming USB-B is the computer/host (downstream) end; it is actually the device-side (upstream-facing) port that plugs into the peripheral, while the flat USB-A or USB-C end goes to the host.
    - Using a marginal or damaged USB-B cable and blaming the interface for intermittent audio dropouts.
- *Editor notes:* common_mistakes #2: reworded to fix the misconception target. Per the USB spec the Type-B connector mates to the Upstream-Facing Port (UFP) on a peripheral, so USB-B IS the upstream (device-side) port; the real error is thinking it is the host/downstream end. Removed the ambiguous 'upstream/host-capable' pairing so 'upstream' now consistently means device-side, matching purpose_function.


## MUSI190 — Dynamics Processing

### Feed-Forward Detection  *(advanced)*
**`practical_application`**
- Before:
    A tech reaches for a feed-forward compressor like an SSL bus compressor when they want tight, predictable transient control on drums or a mix bus.
- After:
    A tech reaches for a feed-forward compressor like the dbx 160 (or a modern VCA compressor) when they want tight, predictable transient control on drums or a mix bus.
- *Editor notes:* practical_application: replaced the SSL bus compressor with the dbx 160 as the feed-forward archetype. Verified: the dbx 160 uses true-RMS sidechain detection driving the VCA from the input (feed-forward), whereas the classic SSL bus compressor derives its sidechain after the gain VCA (feedback/hybrid). Left scenario_contexts unchanged since it was not flagged.

### Stereo Link  *(beginner)*
**`common_mistakes`**
- Before:
    - Leaving a stereo compressor unlinked (dual-mono) on the mix bus and letting center-panned elements wander
    - Assuming stereo link never affects width, when it deliberately trades some width for a stable image
    - Not high-pass filtering the link/sidechain, so heavy low end on one side clamps both channels too hard
- After:
    - Leaving a stereo compressor unlinked (dual-mono) on the mix bus and letting center-panned elements wander
    - Assuming stereo link never affects width, when it deliberately trades some width for a stable image
    - Not high-pass filtering the link/sidechain (the detector signal the compressor listens to), so a heavy bass note on one side clamps both channels too hard
- *Editor notes:* common_mistakes #3: added an inline clause explaining that the link/sidechain is the compressor's detector signal, so the caution no longer lands as unexplained jargon for a beginner. Sidechain related_term link left intact for follow-up.


## MUSI190 — Equalization (EQ)

### Cramped EQ (Frequency Cramping)  *(advanced)*
**`plain_english`**
- Before:
    In some digital EQs, boosts near the top of the audible range get squashed and harsher-sounding, because the math forces the curve to unity gain at the sampling limit, so the bell can no longer stay symmetrical.
- After:
    In some digital EQs, boosts near the top of the audible range get squashed and sound harsher. This happens because the math forces the curve to unity gain at the sampling limit, so the bell can no longer stay symmetrical.
**`common_mistakes`**
- Before:
    - Believing all digital EQs cramp equally, when analog-matched or oversampled designs largely avoid it
    - Blaming the source or converters for harshness that is actually filter cramping near Nyquist
    - Assuming oversampling also fixes the phase warping, when it primarily corrects the magnitude response
    - Thinking cramping affects low and mid bands, when it only appears as a band's center approaches Nyquist
- After:
    - Believing all digital EQs cramp equally, when analog-matched or oversampled designs largely avoid it
    - Blaming the source or converters for harshness that is actually filter cramping near Nyquist
    - Thinking oversampling only fixes the magnitude curve, when it actually reduces both magnitude and phase cramping in the audio band (at the cost of CPU)
    - Thinking cramping affects low and mid bands, when it only appears as a band's center approaches Nyquist
- *Editor notes:* plain_english: split the comma-spliced sentence into two and parallelized 'get squashed and sound harsher'. · common_mistakes #3: corrected the backwards claim. Oversampling raises the internal Nyquist far above the audio band, so within the audio band it reduces BOTH magnitude and phase cramping toward the analog prototype; the 'magnitude-only' behavior belongs to analog-matched/decramped minimum-phase designs, not oversampling. Rewrote the bullet as an accurate oversampling note.


## MUSI190 — Grounding & Electrical

### Ampacity  *(intermediate)*
**`common_mistakes`**
- Before:
    - Assuming ampacity is fixed by wire gauge alone, ignoring derating for high ambient temperature or for bundling many current-carrying conductors together.
    - UNSAFE: Running a cable at or near its rated load while it is tightly coiled on a reel or covered by a rug, trapping heat so insulation overheats or ignites.
    - Confusing a conductor's insulation temperature rating (e.g., 90C wire) with usable ampacity, which per NEC 110.14(C) is limited by the lowest-rated termination, often 60C or 75C.
    - UNSAFE: Protecting an undersized conductor with an oversized breaker, so the wire can overheat before the device trips.
- After:
    - Assuming ampacity is fixed by wire gauge alone, ignoring derating for high ambient temperature or for bundling many current-carrying conductors together.
    - UNSAFE: Running a cable at or near its rated load while it is tightly coiled on a reel or covered by a rug, trapping heat so insulation overheats or ignites.
    - Confusing a conductor's insulation temperature rating (e.g., 90°C wire) with usable ampacity, which per NEC 110.14(C) is limited by the lowest-rated termination, often 60°C or 75°C.
    - UNSAFE: Protecting an undersized conductor with an oversized breaker, so the wire can overheat before the device trips.
- *Editor notes:* common_mistakes #3: added degree symbols (90°C, 60°C, 75°C) for standard notation. UNSAFE prefixes preserved.

### Camlock  *(advanced)*
**`common_mistakes`**
- Before:
    - UNSAFE: Connecting or disconnecting camlocks under load or with the source live; make/break must be done dead, connecting ground first, then neutral, then hots, and disconnecting hots first.
    - UNSAFE: Intermixing connector series or brands (e.g., Series 15 with Series 16) or using worn/pitted contacts, which can arc, overheat, or separate under load.
    - Assuming the color code is legally mandated; green ground, white neutral, and black/red/blue hots are an industry convention, not an NEC-guaranteed standard, so legs must still be verified.
    - UNSAFE: Leaving connected contacts partially seated or exposed where they can be touched or shorted instead of fully engaging the insulated shrouds.
- After:
    - UNSAFE: Connecting or disconnecting camlocks under load or with the source live; make/break must be done dead, connecting ground first, then neutral, then hots, and disconnecting hots first.
    - UNSAFE: Intermixing connector series or brands (e.g., Series 15 with Series 16) or using worn/pitted contacts, which can arc, overheat, or separate under load.
    - Assuming all camlock colors are just convention; green ground and white neutral are required by NEC (250.119, 200.6), while the hot-leg colors (commonly black/red/blue for 120/208V) are an industry convention, so legs must still be verified before energizing.
    - UNSAFE: Leaving connected contacts partially seated or exposed where they can be touched or shorted instead of fully engaging the insulated shrouds.
- *Editor notes:* common_mistakes #3: split the claim per NEC. Green equipment-grounding (250.119) and white/gray grounded-neutral (200.6) colors are code-required; only the ungrounded hot-leg colors are pure convention. Core safety point (verify legs before energizing) retained. UNSAFE prefixes preserved.

### Fuse  *(beginner)*
**`common_mistakes`**
- Before:
    - UNSAFE: Replacing a fuse with a higher-rated one or bridging it with foil or wire to stop it blowing, which removes overcurrent protection and risks fire.
    - Using the wrong type (fast-blo vs slow-blo/anti-surge, or wrong voltage rating) even when the amperage matches.
    - UNSAFE: Changing a fuse without first unplugging the equipment from mains.
    - Repeatedly replacing a blowing fuse instead of finding the underlying fault.
- After:
    - UNSAFE: Replacing a fuse with a higher-rated one or bridging it with foil or wire to stop it blowing, which removes overcurrent protection and risks fire.
    - Using the wrong type (fast-blow vs. slow-blow/anti-surge, or wrong voltage rating) even when the amperage matches.
    - UNSAFE: Changing a fuse without first unplugging the equipment from mains.
    - Repeatedly replacing a blowing fuse instead of finding the underlying fault.
- *Editor notes:* common_mistakes #2: standardized spelling to 'fast-blow vs. slow-blow/anti-surge'. UNSAFE prefixes preserved.

### Phase Rotation  *(advanced)*
**`common_mistakes`**
- Before:
    - UNSAFE: Swapping phase legs to correct rotation while the system is energized; de-energize before changing any connection.
    - Never verifying rotation on a new tie-in or generator, then damaging motors, chain hoists, or HVAC that run backward.
    - Confusing phase rotation (the sequence of the three phases) with polarity or with single-phase hot/neutral orientation.
    - Assuming two sources or distros share the same rotation without checking before paralleling or cross-patching them.
- After:
    - UNSAFE: Swapping phase legs to correct rotation while the system is energized; de-energize before changing any connection.
    - Never verifying rotation on a new tie-in or generator, then damaging motors, chain hoists, or HVAC that run backward.
    - Confusing phase rotation (the sequence of the three phases) with polarity or with single-phase hot/neutral orientation.
    - Assuming two sources or distros share the same rotation without checking before cross-patching them; note that matching rotation is necessary but not sufficient to parallel two live sources, which additionally requires full synchronization of voltage, frequency, and phase angle. Matching rotation alone chiefly matters when cross-patching distros fed from a common service.
- *Editor notes:* common_mistakes: reworked the final bullet to clarify that matched rotation is necessary but not sufficient to parallel live three-phase sources. Verified via WebSearch: paralleling AC sources requires synchronization of voltage magnitude, frequency, phase angle, and phase sequence/rotation; matched rotation alone only supports cross-patching distros fed from a common service. Other three bullets unchanged (UNSAFE prefix preserved).

### Portable Generator (Genset)  *(intermediate)*
**`practical_application`**
- Before:
    Techs size the genset to the load, connect feeder and distro via camlocks, ground and bond it per NEC 250.34, and keep it outdoors clear of intakes with refueling done only when off and cool.
- After:
    Techs size the genset to the load, connect feeder and distro via camlocks, ground and bond it per NEC 250.34, keep it outdoors and clear of air intakes, and refuel only when it is off and cool.
**`common_mistakes`**
- Before:
    - UNSAFE: Running a generator indoors, in a tent, or near doors and air intakes; engine-exhaust carbon monoxide is a leading cause of non-fire CO deaths.
    - UNSAFE: Refueling while the generator is running or hot, risking fire from fuel spilled on hot surfaces.
    - Getting the neutral bonding wrong; a portable genset feeding cord-and-plug loads is typically neutral-bonded to its frame, but as a separately derived system feeding a distro/transfer the bonding and grounding must follow NEC 250.34/250.30 so GFCIs and breakers work.
    - Overloading the genset or leaving legs badly unbalanced, causing voltage sag, overheating, and dropouts.
- After:
    - UNSAFE: Running a generator indoors, in a tent, or near doors and air intakes; engine-exhaust carbon monoxide is a leading cause of non-fire CO deaths.
    - UNSAFE: Refueling while the generator is running or hot, risking fire from fuel spilled on hot surfaces.
    - Getting the neutral bonding wrong. The correct bonding depends on how the genset is used. Feeding cord-and-plug tools, it is typically neutral-bonded to its frame. Feeding a distro or transfer switch as a separately derived system, the bonding and grounding must follow NEC 250.34/250.30 so GFCIs and breakers still trip.
    - Overloading the genset or leaving legs badly unbalanced, causing voltage sag, overheating, and dropouts.
- *Editor notes:* practical_application: fixed the dangling modifier and split the jammed rules per the Language/Communications flag: '...keep it outdoors and clear of air intakes, and refuel only when it is off and cool.' · common_mistakes: reconciled the Learning/Cognition (Medium) and Language/Communications (Low) flags on the neutral-bonding bullet into short sentences that name each case first, then the consequence, keeping both NEC 250.34/250.30 citations. Other three bullets unchanged (UNSAFE prefixes preserved).


## MUSI190 — Microphones

### Ambisonic Microphone  *(advanced)*
**`plain_english`**
- Before:
    A microphone with several capsules clustered like the faces of a pyramid that captures sound from every direction at once, so the 'listening direction' can be steered afterward. It is the go-to tool for 360 video and VR audio.
- After:
    A microphone with four capsules arranged like the faces of a tetrahedron (a triangular, four-sided pyramid) that captures sound from every direction at once, so the 'listening direction' can be steered afterward. It is the go-to tool for 360 video and VR audio.
- *Editor notes:* plain_english: replaced the misleading 'pyramid' analogy with 'tetrahedron (a triangular, four-sided pyramid),' aligning the intro with the 'tetrahedral' language used in purpose_function and common_mistakes. Four-capsule tetrahedral array is correct for A-format ambisonic mics.

### Noise-Canceling Microphone  *(intermediate)*
**`purpose_function`**
- Before:
    It is a differential (noise-cancelling) design that senses sound at two ports so distant far-field noise, which arrives nearly equally at both, cancels while close-up near-field speech does not, greatly improving the speech-to-background ratio in loud environments.
- After:
    It is a differential (noise-canceling) design that senses sound at two ports so distant far-field noise, which arrives nearly equally at both, cancels while close-up near-field speech does not, greatly improving the speech-to-background ratio in loud environments.
**`common_mistakes`**
- Before:
    - Using it at a distance from the mouth, where it loses both level and its noise-rejecting benefit; it is designed for near-lip use.
    - Confusing an acoustic differential (noise-cancelling) mic with DSP-based active/ENC noise cancellation, which are different mechanisms.
    - Expecting full-range, hi-fi response; the differential design deliberately shapes the response to favor close-speech intelligibility.
    - Blaming the mic for room bleed on loud stages when the real fix is closer, consistent placement.
- After:
    - Using it at a distance from the mouth, where it loses both level and its noise-rejecting benefit; it is designed for near-lip use.
    - Confusing an acoustic differential (noise-canceling) mic with DSP-based active/ENC noise cancellation, which are different mechanisms.
    - Expecting full-range, hi-fi response; the differential design deliberately shapes the response to favor close-speech intelligibility.
    - Blaming the mic for room bleed on loud stages when the real fix is closer, consistent placement.
- *Editor notes:* purpose_function and common_mistakes: standardized British 'noise-cancelling' to the headword's American 'noise-canceling' per the Language/Communications flag. The single suggestion explicitly names both the purpose_function phrase and the second common_mistakes bullet, so both were corrected to achieve the entry-wide spelling consistency the flag requires; no other wording changed.


## MUSI190 — Mixers & Recorders

### In-Line Console  *(intermediate)*
**`common_mistakes`**
- Before:
    - Confusing the channel (record) fader with the monitor fader and adjusting the wrong one, so the tracked level or the monitor balance changes unexpectedly
    - Assuming an in-line strip is truly two independent channels rather than one strip sharing preamp, EQ, and routing resources between two paths
    - Forgetting to flip EQ or dynamics assignment between the channel path and monitor path, then wondering why processing isn't landing where expected
- After:
    - Confusing the channel (record) fader with the monitor fader and adjusting the wrong one, so the tracked level or the monitor balance changes unexpectedly.
    - Assuming an in-line strip is truly two independent channels rather than one strip sharing preamp, EQ, and routing resources between two paths.
    - Forgetting to flip EQ or dynamics assignment between the channel path and monitor path, then wondering why processing isn't landing where expected.
**`scenario_contexts`**
- Before:
    - A commercial studio tracking a full band on a 48-input SSL or Neve in-line desk, recording and monitoring 24+ tracks from one operating position
    - An engineer flipping the console into 'mix mode' so both faders feed the mix bus, doubling available inputs at mixdown
    - Teaching students signal flow by tracing a mic through the channel path to tape and back through the monitor path on the same strip
- After:
    - A commercial studio tracking a full band on a 48-input SSL or Neve in-line desk, recording and monitoring 24+ tracks from one operating position.
    - An engineer flipping the console into 'mix mode' so both faders feed the mix bus, doubling available inputs at mixdown.
    - Teaching students signal flow by tracing a mic through the channel path to tape and back through the monitor path on the same strip.
- *Editor notes:* common_mistakes and scenario_contexts: added terminal periods to each bullet for consistency with the glossary's other list fields per the Language/Communications flag. The single suggestion explicitly names both common_mistakes and scenario_contexts, so both were corrected to the house style; wording unchanged.

### Split Console  *(intermediate)*
**`purpose_function`**
- Before:
    By keeping the recording (channel) path and the monitor path in physically separate sections, a split console makes signal flow obvious and easy to follow, which is why it is common on teaching and smaller-format desks. It exists to keep tracking and monitoring workflows distinct and easy to understand.
- After:
    By keeping the recording (channel) path and the monitor path in physically separate sections, a split console makes signal flow obvious and keeps tracking and monitoring workflows distinct, which is why it is common on teaching and smaller-format desks.
- *Editor notes:* purpose_function: merged the two redundant 'easy to follow/understand' sentences into one per the Language/Communications flag, preserving all substantive content (separate sections, obvious signal flow, distinct workflows, common on teaching/smaller-format desks).


## MUSI190 — Signal Path & Levels

### Peak Hold  *(intermediate)*
**`purpose_function`**
- Before:
    It captures and briefly—or indefinitely—retains the maximum peak value, so transients too fast to see on a falling meter stay visible, helping catch clipping and set headroom.
- After:
    It captures the maximum peak value and holds it briefly—or indefinitely—so transients too fast to see on a falling meter stay visible, helping catch clipping and set headroom.
- *Editor notes:* purpose_function: recast so the verb phrase stays together ('captures the maximum peak value and holds it briefly—or indefinitely—'), removing the interjection that split 'captures and ... retains.' Meaning unchanged.

### Signal Present Indicator  *(beginner)*
**`purpose_function`**
- Before:
    It confirms that signal above a low threshold (commonly around −20 dB) has reached that point in the chain, giving a quick indication of signal flow without needing a full meter, which speeds setup and troubleshooting.
- After:
    It confirms that signal above a low threshold — typically around 20 dB below nominal operating level (often about −20 dBu on analog consoles), though the exact threshold varies by manufacturer — has reached that point in the chain, giving a quick indication of signal flow without needing a full meter, which speeds setup and troubleshooting.
**`scenario_contexts`**
- Before:
    - Tracing a dead channel from source to output
    - Confirming a mic or DI is passing audio during line check
    - Verifying a patch is actually connected
    - A quick input check before soundcheck
- After:
    - Tracing a dead channel from source to output
    - Confirming a mic or DI is passing audio during line check
    - Verifying a patch is actually connected
    - Running a quick input check before soundcheck
- *Editor notes:* purpose_function: replaced the unreferenced “around −20 dB” with a referenced, hedged threshold — ~20 dB below nominal operating level (often ~−20 dBu on analog consoles), noting manufacturer variability. Verified: signal-present LEDs are commonly set near −20 dBu, roughly 20 dB below the +4 dBu pro nominal level, with exact thresholds varying by maker. · scenario_contexts: fixed parallel structure by converting the fourth item to a gerund phrase, “Running a quick input check before soundcheck.”; other three items unchanged.


## MUSI190 — Sound & Acoustics

### Antinode  *(intermediate)*
**`common_mistakes`**
- Before:
    - Confusing an antinode (maximum) with a node (minimum)
    - Assuming a pressure antinode coincides with a velocity antinode — for sound, pressure maxima line up with velocity minima
    - Thinking antinodes exist only in instruments and pipes, not in rooms — room modes create pressure antinodes at boundaries
- After:
    - Confusing an antinode (maximum) with a node (minimum)
    - Assuming a pressure antinode coincides with a velocity antinode (the point where air movement, not pressure, is greatest) — for sound, pressure maxima line up with velocity minima
    - Thinking antinodes exist only in instruments and pipes, not in rooms — room modes create pressure antinodes at boundaries
- *Editor notes:* common_mistakes: added a half-clause gloss for “velocity antinode” (“the point where air movement, not pressure, is greatest”) so the intermediate learner can decode the term; kept the pressure-vs-velocity correction intact. Other two bullets unchanged.

### Sound Localization  *(beginner)*
**`purpose_function`**
- Before:
    It lets listeners place sources in space using two-ear timing and level differences plus spectral (pinna) cues, which is the basis of stereo and surround imaging as well as everyday situational awareness.
- After:
    It lets listeners place sources in space using two-ear timing and level differences plus spectral cues from the outer-ear (pinna) shape, which is the basis of stereo and surround imaging as well as everyday situational awareness.
- *Editor notes:* purpose_function: glossed the jargon on first use, changing “spectral (pinna) cues” to “spectral cues from the outer-ear (pinna) shape” so the beginner can attach meaning before the terms reappear in common_mistakes. Only purpose_function was flagged, so common_mistakes left unchanged.
