# AP&E Glossary — Full-Corpus Committee Corrections Changelog (2026_07_16)

Applied to production `yjgolswjggmlpeowvtxr`. Backup: `glossary_backup_committee2_20260716` (140 rows). Verified: **140/140 corrected rows match intended values (md5), 0 mismatches**; corrections did not empty any field.

Scope: **140 terms · 150 fields** revised from the full-corpus committee (all suggestions in the 8 content fields applied; every technical fix web-verified by the editor). Only the fields below changed; all other fields and all non-flagged terms are unchanged.

### Active Speaker  *(AUDI201 / Consumer Audio Systems)*
**`common_mistakes`**
- Before:
    - Confusing 'active' (per-driver amps after an active crossover) loosely with 'powered'; technically all active speakers are powered but not all powered speakers use active crossovers
    - Trying to drive an active speaker from an amplifier's speaker-level output instead of a line-level source
    - UNSAFE: ignoring that each active speaker needs its own grounded AC mains connection; using damaged cords or defeating the ground pin risks shock
- After:
    - Confusing active/powered (amp built in) with passive (needs a separate amp)
    - Trying to drive an active speaker from an amplifier's speaker-level output instead of a line-level source
    - UNSAFE: ignoring that each active speaker needs its own grounded AC mains connection; using damaged cords or defeating the ground pin risks shock
- *Editor notes:* common_mistakes: simplified the first item to the beginner-relevant active/powered vs passive distinction, deferring the active-crossover nuance; kept the other two items unchanged including the UNSAFE prefix.

### Amplitude scale  *(AUDI201 / Audio Measurement & Optimization)*
**`scenario_contexts`**
- Before:
    - Reading a DAW meter and realizing the marks crowd together near 0 because the scale is in dB, not evenly spaced
    - Switching a spectrum analyzer from linear to dB display so quiet detail becomes visible
    - Explaining to a student why -6 dB is not 'half' the height on a linear waveform view
- After:
    - Reading a DAW meter and realizing the marks crowd together near 0 because the scale is in dB, not evenly spaced
    - Switching a spectrum analyzer from linear to dB display so quiet detail becomes visible
    - Explaining to a student that -6 dB is about half the height on a linear waveform view, while on a dB meter the marks crowd near 0 because the scale is logarithmic
- *Editor notes:* scenario_contexts: corrected the third item, which was factually backwards. Verified 20*log10(0.5) = -6.02 dB, so -6 dBFS IS about half the height on a LINEAR (amplitude/voltage) waveform view; reworded to state this correctly while keeping the log-scale teaching point. First two items unchanged.

### Audyssey / Auto Room Calibration  *(AUDI201 / Audio Measurement & Optimization)*
**`category`**
- Before:
    Acoustic Treatment
- After:
    Room Correction
**`common_mistakes`**
- Before:
    - Not placing microphone in actual listening positions
    - using calibration once and expecting permanent optimization (recalibrate if furniture changes), not trusting system adjustments.
- After:
    - Not placing microphone in actual listening positions
    - Running calibration once and expecting it to stay optimal - re-run it if speakers or furniture move
    - Distrusting the automatic adjustments and manually overriding them without a measurement to justify the change.
- *Editor notes:* category: changed 'Acoustic Treatment' to 'Room Correction' - Audyssey is electronic/DSP EQ-and-delay room correction, not physical absorption/diffusion, and this matches the sibling 'Audyssey' entry. · common_mistakes: split the run-on second item into two clean items (calibrate-once misconception; and distrusting/overriding auto adjustments without a measurement); first item unchanged.

### Aux-fed subwoofer  *(AUDI201 / Loudspeaker System Deployment)*
**`plain_english`**
- Before:
    There are two ways to feed a subwoofer. With a full-range hookup, the sub gets the whole signal and uses its own crossover to keep only the low notes. With an aux-fed setup, the receiver's dedicated subwoofer output sends just the bass it has already filtered out for the sub. Because the receiver does the filtering, it can line the sub up with the main speakers more precisely. This tighter teamwork is why aux-fed subs usually blend better.
- After:
    Instead of letting the subs pull lows from the full main mix, the engineer feeds them from a dedicated aux send and chooses exactly which low-frequency channels go to it — typically kick, bass, floor toms, and low synths. Vocals, guitars, and cymbals never reach the subs, so the low end stays tight and uncluttered, and the engineer controls sub content channel by channel. That source-by-source control is why aux-fed subs usually give a cleaner, punchier low end.
**`purpose_function`**
- Before:
    Enables integrated bass management with receiver, allows receiver-controlled crossover and phase adjustment, simplifies subwoofer configuration.
- After:
    Gives the engineer source-by-source control over what reaches the subwoofers, keeping low-frequency muddiness out of the mains, reducing the number of sources contributing sub energy, and allowing sub level to be managed independently of the main L/R mix.
**`practical_application`**
- Before:
    Home theater systems typically use aux-fed subwoofers for integrated bass management. Receivers with dedicated sub outputs optimize for aux-fed configuration. Integrated systems use aux-fed for seamless operation.
- After:
    At the console the engineer creates a dedicated aux (usually post-fader) as the sub feed, dials only low-frequency channels into that aux, and drives the subs from it; because the sub aux master stays up when the L/R master is pulled down, the subs must be muted or managed separately.
**`scenario_contexts`**
- Before:
    - Wiring a home-theater sub from the AVR's dedicated LFE/sub output instead of the speaker terminals
    - Setting the receiver's crossover and phase so the sub blends with the mains
    - Troubleshooting boomy 'double bass' when the sub is fed both aux and full-range
- After:
    - Sending only kick, bass, and floor toms to the sub aux at FOH so vocals and guitars stay out of the subs
    - Muting the sub aux master when muting the main mix, since pulling the L/R fader does not silence aux-fed subs
    - Troubleshooting boomy 'double bass' when the sub is fed both aux and full-range
- *Editor notes:* plain_english: rewritten to the correct live-sound sense (console aux send fed only by selected LF channels); removed all AV-receiver/home-theater framing. Verified via ProSoundWeb and Fulcrum Acoustic. · purpose_function: replaced home-theater 'integrated bass management with receiver' with the live-sound purpose of source-selective LF control at the console. Verified. · practical_application: replaced the home-theater/AVR description with live-sound FOH practice (dedicated post-fader sub aux, LF channels only, separate muting of the sub aux). Verified. · scenario_contexts: replaced the two home-theater AVR scenarios with live-sound ones; kept the valid 'double bass' scenario.

### Base  *(AUDI201 / Distributed Audio Systems)*
**`related_terms`**
- Before:
    - Clean Feed
- After:
    - Clean Feed
    - Personal Receiver
    - Assistive Listening System
    - Induction Loop
- *Editor notes:* related_terms: added 'Personal Receiver', 'Assistive Listening System', and 'Induction Loop' so the map connects the transmitter (Base) to the receiver side and system context; kept 'Clean Feed'.

### Bodypack Transmitter  *(AUDI201 / Analog Live Sound)*
**`related_terms`**
- Before:
    - Diversity Receiver
    - Wireless Microphone Management
    - Frequency Coordination
    - Frequency Coordination
    - Microphone Plot
    - Actor
- After:
    - Diversity Receiver
    - Wireless Microphone Management
    - Frequency Coordination
    - Microphone Plot
    - Actor
- *Editor notes:* related_terms: removed the duplicate 'Frequency Coordination' so it appears once; retained the remaining distinct terms (five total).

### Bottom-up troubleshooting  *(AUDI201 / Troubleshooting)*
**`definition`**
- Before:
    Starting diagnosis at the source end of a signal path and working forward toward the output, useful when the source or input stage is suspect.
- After:
    Starting diagnosis at the output/lowest (physical/electrical) level of a signal path — e.g. the amplifier and speakers, or the cabling — and working back toward the source, verifying each foundational stage before higher-level causes; useful when the output or physical layer is suspect.
**`plain_english`**
- Before:
    Bottom-up troubleshooting starts at the source, such as the microphone or input, and works forward through the chain toward the output. It is the natural choice when you suspect the source or the front end, or when that is the easiest point to inject and check a signal. It is the mirror image of top-down troubleshooting. You choose whichever direction reaches the fault faster. Often the half-split method beats either pure direction on a long chain.
- After:
    Bottom-up troubleshooting starts at the output/physical end of the system, such as the speakers and amps, or the cabling, and works back toward the source and higher-level settings. It is the natural choice when you suspect the output stage or the physical layer, or when that is the easiest place to begin verifying a solid foundation. It is the mirror image of top-down troubleshooting. You choose whichever direction reaches the fault faster. Often the half-split method beats either pure direction on a long chain.
- *Editor notes:* definition: rewrote to the standard, web-verified direction — bottom-up begins at the output/physical (lowest) end and works UP toward the source — removing the contradictory 'starts at the source and works toward the output' wording (that describes top-down). · plain_english: rewrote to match: starts at the output/physical end (speakers/amps or cabling) and works back toward the source, consistent with purpose_function, practical_application, and the scenario_contexts. · purpose_function: flagged by the Language expert but, on verification, it already states the correct output-to-source direction and agrees with practical_application/scenarios, so it is kept unchanged; the flagged fields to fix were definition and plain_english.

### Bridle  *(AUDI201 / Loudspeaker System Deployment)*
**`common_mistakes`**
- Before:
    - UNSAFE: Letting the apex angle widen too far—the wider the included angle, the higher the tension in each leg for the same suspended load. At about a 120-degree included angle each leg's tension already equals the full suspended load, and it climbs steeply beyond that (roughly twice the load near 150 degrees); keep the included angle well under 90 degrees and always calculate leg tensions from the sling-angle factor.
    - UNSAFE: Guessing leg lengths and tensions instead of calculating them, or exceeding a beam point's or sling's WLL because sling-angle load multipliers were ignored.
    - Forgetting that a wider apex angle raises the tension in each leg for the same suspended load.
    - UNSAFE: Attaching bridle legs to non-structural or unverified points.
- After:
    - UNSAFE: Letting the apex angle widen too far—the wider the included angle, the higher the tension in each leg for the same suspended load. At about a 120-degree included angle each leg's tension already equals the full suspended load, and it climbs steeply beyond that (roughly twice the load near 150 degrees); keep the included angle well under 90 degrees and always calculate leg tensions from the sling-angle factor.
    - UNSAFE: Guessing leg lengths and tensions instead of calculating them, or exceeding a beam point's or sling's WLL because sling-angle load multipliers were ignored.
    - UNSAFE: Attaching bridle legs to non-structural or unverified points.
- *Editor notes:* common_mistakes: deleted the redundant bullet 'Forgetting that a wider apex angle raises the tension in each leg...' since the first bullet already covers apex-angle/tension in detail; kept the three UNSAFE items intact.

### Butterworth filter / crossover  *(AUDI201 / Loudspeaker System Deployment)*
**`purpose_function`**
- Before:
    Provides maximally flat passband response, ensures smooth frequency transition, minimizes phase shift artifacts, ideal for speaker crossovers and general audio applications.
- After:
    Provides a maximally flat passband magnitude with a smooth, monotonic roll-off and no passband ripple, ideal for speaker crossovers and general audio applications; note that its phase/group delay is not linear (a Bessel is preferred where transient/phase linearity matters).
- *Editor notes:* purpose_function: removed the incorrect 'minimizes phase shift artifacts' claim. Web-verified: the Butterworth is optimized for maximally flat MAGNITUDE and has non-linear phase/group delay; the Bessel is the maximally linear-phase / constant-group-delay design. Reworded to 'maximally flat passband magnitude, smooth monotonic roll-off, no passband ripple' and noted phase/group delay is not linear.

### C-weighted (dBC)  *(AUDI201 / Audio Measurement & Optimization)*
**`practical_application`**
- Before:
    Measuring concert peak SPL in dBC; capturing low-frequency level dBA underreads.
- After:
    Measuring concert peak SPL in dBC; capturing low-frequency level that dBA under-reads.
- *Editor notes:* practical_application: fixed the garbled clause by inserting the dropped relative pronoun ('level that dBA under-reads') and hyphenating 'under-reads'; meaning and length preserved.

### Channel delay  *(AUDI201 / Audio Measurement & Optimization)*
**`plain_english`**
- Before:
    Channel delay is a small, deliberate time delay (in milliseconds) added to one channel or speaker. It is used because sound takes time to travel. Speakers at different distances reach the audience at slightly different moments. By holding back the closer speaker just enough, you line everything up. The sound then arrives together instead of smearing or cancelling. Audio processors let you set this delay precisely for each speaker or zone. Getting it right keeps the sound clear and even across a whole venue.
- After:
    Channel delay is a small, deliberate time delay (in milliseconds) added to one input channel. It is used because the same source reaches different microphones at slightly different moments. Picture a snare drum caught by a close mic and, a fraction later, by a room mic. Summed together, those offset copies smear or partly cancel, giving a hollow, comb-filtered sound. By holding back the earlier close-mic channel just enough, you line the two up so they arrive together and reinforce instead of fighting. Audio processors let you set this delay precisely for each channel. Getting it right keeps that source clear and full. Note this affects only that one channel, not the whole system.
- *Editor notes:* plain_english: replaced the distributed-speaker/zone example (which is system/output delay per this entry's own common_mistakes and scenario_contexts) with a per-input close-mic vs room-mic time-alignment example, matching the rest of the entry; no factual claims requiring numeric verification.

### Charging Station  *(AUDI201 / Assisted Listening Systems)*
**`scenario_contexts`**
- Before:
    - Storing and recharging a fleet of theater receivers overnight
    - Setting up a charging cabinet at a usher station for daily checkout and return
- After:
    - Storing and recharging a fleet of theater receivers overnight
    - Setting up a charging cabinet at an usher station for daily checkout and return
- *Editor notes:* scenario_contexts: corrected the indefinite article to 'an usher station' (usher begins with a vowel sound); other item unchanged.

### constant directivity (CD) horn  *(AUDI201 / Loudspeaker System Deployment)*
**`related_terms`**
- Before:
    - Crossover Frequency
    - Coverage map
- After:
    - Crossover Frequency
    - Coverage map
    - Directivity
    - Coverage Angle
    - Waveguide
    - Horn-Loaded
- *Editor notes:* related_terms: kept the two existing links and added the core neighboring concepts Directivity, Coverage Angle, Waveguide, and Horn-Loaded, giving a 6-link map in line with sibling loudspeaker entries.

### Correlation Meter  *(AUDI201 / Audio Measurement & Optimization)*
**`related_terms`**
- Before:
    - Goniometer
    - Goniometer
    - Phase Meter
    - Phase Checker
    - Polarity Tester
- After:
    - Goniometer
    - Phase Meter
    - Phase Checker
    - Polarity Tester
- *Editor notes:* related_terms: removed the duplicate 'Goniometer' entry, leaving a single instance; other items unchanged.

### Daisy Chain  *(AUDI201 / Commercial Audio Systems)*
**`definition`**
- Before:
    Wiring devices in series, looping from one to the next, rather than running each back to a central point. Common for 70/100-volt speaker lines and some control connections.
- After:
    Running one cable device-to-device in a chained (looped) path rather than a home run to each device. Common for 70/100-volt speaker lines and some control connections. Note that a chained cable path does not mean the loads are wired electrically in series: on a 70V/100V line the speaker taps sit electrically in parallel across the shared pair.
- *Editor notes:* definition: web-verified that 70V/100V distributed lines are parallel circuits (series is not supported by manufacturers). Separated cabling topology (chained/looped path) from electrical connection (taps in parallel) and dropped the bare 'series' wording so the entry no longer contradicts its own practical_application and common_mistakes.

### dBFS  *(AUDI201 / Digital Live Sound)*
**`plain_english`**
- Before:
    In digital audio, the ceiling is 0 dBFS, and you cannot go above it without clipping. Levels are measured downward from that ceiling, so -12 dBFS leaves 12 dB of headroom. Because the top is a fixed point, it is an absolute scale. That is different from analog scales like dBu, which are relative.
- After:
    In digital audio, the ceiling is 0 dBFS, and you cannot go above it without clipping. Levels are measured downward from that ceiling, so -12 dBFS leaves 12 dB of headroom. Because 0 dBFS is a fixed ceiling you cannot exceed, meters read downward from it. Unlike dBFS, an analog reference such as dBu has no fixed maximum — its 0 point is just a reference voltage, not a ceiling.
- *Editor notes:* plain_english: reworded per suggestion; removed the mischaracterization of dBu as 'relative'. Verified: dBu is an absolute unit referenced to 0.775 V RMS (a fixed reference voltage, not a ceiling), whereas dBFS's reference IS its maximum, bounded at 0.

### dBu  *(AUDI201 / Analog Live Sound)*
**`plain_english`**
- Before:
    dBu measures analog signal voltage against a reference of 0.775 volts. Professional gear typically runs around +4 dBu as its nominal level. It is a relative voltage scale. That keeps it separate from the digital dBFS scale.
- After:
    dBu measures analog signal voltage against a reference of 0.775 volts. Professional gear typically runs around +4 dBu as its nominal level. Like dBFS, dBu is an absolute unit tied to a fixed reference (0.775 V); the difference is that dBu's reference is not a maximum, so signals routinely run above 0 dBu.
- *Editor notes:* plain_english: corrected the factual error 'It is a relative voltage scale.' Verified: dBu is an absolute unit fixed to 0.775 V RMS, whereas dBFS is referenced to full scale (a ceiling); dBu's reference is not a maximum, so signals routinely run above 0 dBu.

### De-esser  *(AUDI201 / Audio Measurement & Optimization)*
**`related_terms`**
- Before:
    - Sibilance
    - Compression / Compressor
    - Compression / Compressor
    - High-Pass Filter (HPF / Low-Cut Filter)
    - Frequency Response
- After:
    - Sibilance
    - Compression / Compressor
    - Dynamic EQ
    - High-Pass Filter (HPF / Low-Cut Filter)
    - Frequency Response
- *Editor notes:* related_terms: removed the duplicate 'Compression / Compressor' and used the freed slot for the distinct term 'Dynamic EQ', which plain_english already references.

### Device options  *(AUDI201 / Audio Measurement & Optimization)*
**`plain_english`**
- Before:
    Device options is the part of the measurement software where you set up your audio hardware before measuring. Here you pick which audio interface to use, and set its inputs, outputs, sample rate, and calibration. Getting these right makes sure the software reads the hardware correctly.
- After:
    Device options are the settings in the measurement software where you set up your audio hardware before measuring. Here you pick which audio interface to use, and set its inputs, outputs, sample rate, and calibration. Getting these right makes sure the software reads the hardware correctly.
- *Editor notes:* plain_english: fixed the subject-verb number mismatch ('Device options is' -> 'Device options are the settings...'); rest of the field unchanged.

### Distortion measurements  *(AUDI201 / Audio Measurement & Optimization)*
**`plain_english`**
- Before:
    Distortion measurements show how much unwanted extra content a piece of gear, like an amp or speaker, adds to the signal. The standard metric is THD, or Total Harmonic Distortion, given as a percentage. Good gear keeps distortion below 1%. Cheap gear may go over 10%.
- After:
    Distortion measurements show how much unwanted extra content a piece of gear, like an amp or speaker, adds to the signal. The standard metric is THD, or Total Harmonic Distortion, given as a percentage. Lower percentages mean cleaner reproduction, but a meaningful THD figure must state the level, frequency, and bandwidth it was measured at, and acceptable values differ by device type.
- *Editor notes:* plain_english: removed the misleading '1%/10%' benchmarks. Verified: good amplifiers sit well under 0.1% THD and ~1% is audibly poor (near the practical clipping limit), so the old figures were wrong for amplifiers; replaced with the comparative rule that lower is cleaner and a THD figure is only meaningful with stated level/frequency/bandwidth, and thresholds differ by device type.

### Diversity Receiver  *(AUDI201 / Analog Live Sound)*
**`related_terms`**
- Before:
    - Bodypack Transmitter
    - Wireless Microphone Management
    - Frequency Coordination
    - Frequency Coordination
    - Microphone Plot
- After:
    - Bodypack Transmitter
    - Wireless Microphone Management
    - Frequency Coordination
    - Microphone Plot
    - Multipath
- *Editor notes:* related_terms: removed the duplicate 'Frequency Coordination' and added the distinct, highly relevant term 'Multipath' (the phenomenon diversity reception counters) to keep five useful links.

### DJ Feed  *(AUDI201 / Analog Live Sound)*
**`definition`**
- Before:
    A DJ feed is the line-level audio output sent from the DJ's mixer or controller into a larger sound system or another operator — for example, the master output routed to a venue's PA or to a front-of-house engineer's console. It is the DJ's mix delivered as a source to the main system.
- After:
    A DJ feed is the line-level audio output sent from the DJ's mixer or controller into a larger sound system, or to another operator — for example, the master output routed to a venue's PA or to a front-of-house engineer's console. It is the DJ's mix delivered as a source to the main system.
- *Editor notes:* definition: fixed the mixed preposition so audio goes 'into a larger sound system, or to another operator', matching the preposition to each destination type.

### Earphone  *(AUDI201 / Assisted Listening Systems)*
**`plain_english`**
- Before:
    An earphone is the little earpiece a listener wears. It plugs into the receiver, to hear the audio.
- After:
    An earphone is the little earpiece a listener wears. It plugs into the receiver so the listener can hear the audio.
- *Editor notes:* plain_english: rewrote the dangling-infinitive clause to 'It plugs into the receiver so the listener can hear the audio.', removing the weak comma splice; meaning and length preserved.

### Feedback frequency  *(AUDI201 / Loudspeaker System Deployment)*
**`common_mistakes`**
- Before:
    - Notching ring after ring instead of addressing the underlying gain or placement
    - assuming the feedback frequency is fixed when it shifts as the mic, speaker, or room changes
    - mistaking the feedback frequency for a room mode exactly — related but not identical.
- After:
    - Notching ring after ring instead of addressing the underlying gain or placement
    - assuming the feedback frequency is fixed when it shifts as the mic, speaker, or room changes
    - Assuming the feedback frequency is exactly a room mode — the two are related but not identical.
- *Editor notes:* common_mistakes: reworded the third item to fix the dangling adverb 'exactly'; now reads 'Assuming the feedback frequency is exactly a room mode — the two are related but not identical.' First two items unchanged.

### Ground loop  *(AUDI201 / Troubleshooting)*
**`plain_english`**
- Before:
    A ground loop happens when your gear is connected to ground by more than one path at slightly different voltages, so a small current circulates through the cables. At the AC mains frequency (50 Hz in Europe, 60 Hz in the US) you hear that current as a steady hum. It's one of the most common audio problems. Don't fix it by lifting a device's safety ground — that's dangerous (see Lifted Ground Hazard). Safe fixes keep the ground intact, using balanced connections, an isolation transformer, or single-point (star) grounding.
- After:
    A ground loop happens when your gear is connected to ground by more than one path at slightly different voltages, so a small current circulates through the cables. At the AC mains frequency (50 Hz in Europe, 60 Hz in the US) you hear that current as a steady hum. It's one of the most common audio problems. Don't fix it by lifting a device's safety ground — that's dangerous (see Ground lift). Safe fixes keep the ground intact, using balanced connections, an isolation transformer, or single-point (star) grounding.
- *Editor notes:* plain_english: retargeted the dead-end cross-reference from '(see Lifted Ground Hazard)' to the reachable concept '(see Ground lift)', which aligns with the ground-lift switch already described in practical_application. Per Rule 2 I changed only the flagged field (plain_english); the suggestion also proposed adding 'Ground lift' to related_terms, but related_terms was not a flagged field for this term, so it was left untouched — reviewer may add 'Ground lift' there separately to complete the cross-link.

### Half-split method  *(AUDI201 / Troubleshooting)*
**`related_terms`**
- Before:
    - Signal tracing
    - Divide and conquer
    - Signal tracing
    - Bypass test
    - Component isolation
- After:
    - Signal tracing
    - Divide and conquer
    - Bypass test
    - Component isolation
- *Editor notes:* related_terms: removed the duplicate 'Signal tracing' (all three experts flagged it), leaving four distinct terms. Optional fifth term not added to keep the change minimal and avoid introducing an unvetted link.

### Hearing Loop  *(AUDI201 / Assisted Listening Systems)*
**`practical_application`**
- Before:
    A technician installs the loop wire to plan, drives it with a loop amplifier set to IEC 60118-4 field levels, and verifies the field with a meter so telecoil users hear consistent audio across the area.
- After:
    A technician installs the loop wire according to a layout plan, drives it with a loop amplifier set to IEC 60118-4 field levels, and verifies the field with a meter so telecoil users hear consistent audio across the area.
- *Editor notes:* practical_application: fixed the garbled 'installs the loop wire to plan' to 'installs the loop wire according to a layout plan'; rest of sentence unchanged. Verified IEC 60118-4 governs induction/hearing-loop performance (target average field 100 mA/m), so the existing IEC reference is correct.

### Impulse response  *(AUDI201 / Audio Measurement & Optimization)*
**`common_mistakes`**
- Before:
    - Capturing an IR with low SNR
    - windowing the IR incorrectly
    - assuming one IR represents all positions
- After:
    - Thinking you need a literal instantaneous impulse — in practice a sine sweep (or balloon pop) stands in for the impossible ideal impulse
    - Assuming an IR only reveals echoes and reverb, when a single IR actually captures the full frequency and phase response too
    - Capturing an IR with low SNR
    - windowing the IR incorrectly
    - assuming one IR represents all positions
- *Editor notes:* common_mistakes: added two beginner-level conceptual misconceptions and kept the three intermediate technique errors. Verified: a swept sine (deconvolved) or a balloon pop is the practical stand-in for the unachievable ideal impulse, and a single IR captures full frequency and phase response, not just echoes/reverb.

### Insulation Tester  *(AUDI201 / Audio Measurement & Optimization)*
**`related_terms`**
- Before:
    - Impedance Meter
    - Time-Domain Reflectometer (TDR)
    - Network Analyzer
    - Audio Test Set
    - Audio Analyzer
- After:
    - Impedance Meter
    - Time-Domain Reflectometer (TDR)
    - Insulation resistance
    - Continuity test
    - Multimeter
- *Editor notes:* related_terms: replaced the off-topic audio/RF instruments ('Network Analyzer', 'Audio Analyzer', 'Audio Test Set') with insulation/continuity-family cross-references ('Insulation resistance', 'Continuity test', 'Multimeter'); kept 'Time-Domain Reflectometer (TDR)' and 'Impedance Meter' as electrically relevant.

### Inventory Management  *(AUDI201 / Assisted Listening Systems)*
**`plain_english`**
- Before:
    Inventory management is keeping count of all the receivers and accessories. You track which ones work. You note which work with hearing aids. And you know where they are.
- After:
    Inventory management here means keeping count of a venue's assistive-listening receivers and accessories. You track which ones work. You note which work with hearing aids. And you know where they are.
- *Editor notes:* plain_english: opened by naming the domain ('a venue's assistive-listening receivers and accessories') so the context is set before the details; remaining sentences preserved.

### K-weighted (LUFS)  *(AUDI201 / Audio Measurement & Optimization)*
**`practical_application`**
- Before:
    Use a K-weighted LUFS meter to set program loudness to a platform target (about -14 LUFS for Spotify, -13 for YouTube, -16 for many podcasts) instead of trusting peak meters, because LUFS weights frequencies the way human hearing does and predicts how loud the listener will actually perceive the track.
- After:
    Use a K-weighted LUFS meter to set program loudness to a platform target (about -14 LUFS for Spotify, -14 LUFS for YouTube, -16 for many podcasts) instead of trusting peak meters, because LUFS weights frequencies the way human hearing does and predicts how loud the listener will actually perceive the track.
- *Editor notes:* practical_application: Web-verified YouTube loudness normalization target is -14 LUFS (with -1 dBTP), not -13. Changed '-13 for YouTube' to '-14 LUFS for YouTube', consistent with the term's plain_english.

### Limiter  *(AUDI201 / Amplifiers)*
**`definition`**
- Before:
    A dynamics processor with infinite ratio and fast attack, acting as a brick wall preventing signal from exceeding a threshold. Protects against clipping but can sound limiting if used heavily.
- After:
    A dynamics processor with infinite ratio and fast attack, acting as a brick wall preventing signal from exceeding a threshold. Protects against clipping but can sound squashed or lifeless if used heavily.
- *Editor notes:* definition: reworded the circular closing clause 'can sound limiting' to 'can sound squashed or lifeless' to clearly convey audible over-compression without echoing the term name.

### Lithium-Ion Battery Handling  *(AUDI201 / RF Wireless Systems)*
**`common_mistakes`**
- Before:
    - Continuing to use or charge a swollen, hot, or damaged lithium pack
    - UNSAFE: puncturing, crushing, or shorting a Li-ion cell, or charging it unattended on/near combustibles
    - UNSAFE: a venting/smoking/burning pack is an emergency — evacuate, call 911, and treat it as a fire (an ordinary extinguisher may not stop reignition
    - copious water cools Li-ion, and damaged cells can reignite)
    - throwing Li-ion in general trash/recycling improperly
- After:
    - Continuing to use or charge a swollen, hot, or damaged lithium pack
    - UNSAFE: puncturing, crushing, or shorting a Li-ion cell, or charging it unattended on/near combustibles
    - UNSAFE: a venting/smoking/burning pack is an emergency — evacuate, call 911, and treat it as a fire (an ordinary extinguisher may not stop reignition; copious water cools Li-ion, and damaged cells can reignite).
    - throwing Li-ion in general trash/recycling improperly
- *Editor notes:* common_mistakes: merged the two fragments (items 3 and 4) that split one parenthetical across separate bullets into a single, correctly closed item; UNSAFE prefix kept, technical content unchanged. List reduced from 5 to 4 items.

### MADI (Multichannel Audio Digital Interface)  *(AUDI201 / Distributed Audio Systems)*
**`purpose_function`**
- Before:
    Professional audio interface standard enabling transmission of 64 channels of audio over fiber optic cable. Essential for studio and live sound interconnection.
- After:
    Professional audio interface standard enabling transmission of up to 64 channels of audio over a single 75-ohm coaxial (BNC) or fiber-optic cable. Essential for studio and live sound interconnection.
- *Editor notes:* purpose_function: removed the fiber-only claim to match the definition. Verified (AES10 / Wikipedia / RME): MADI runs over 75-ohm coaxial (BNC, ~50-100 m) or fiber-optic (SC, up to ~2 km); coax is the original/most common medium.

### Maximum Length Sequence (MLS)  *(AUDI201 / Audio Measurement & Optimization)*
**`plain_english`**
- Before:
    A special random-sounding string of on/off pulses; because of its unique mathematical structure, comparing exactly what was sent against what the microphone heard reveals how the room or loudspeaker responds, and it holds up well even when background noise is present.
- After:
    A special random-sounding string of on/off pulses. Because of its unique mathematical structure, comparing exactly what was sent against what the microphone heard reveals how the room or loudspeaker responds, and it holds up well even when background noise is present.
- *Editor notes:* plain_english: Fixed semicolon splice by splitting into two sentences; content unchanged.

### monitor mixer  *(AUDI201 / Loudspeaker System Deployment)*
**`purpose_function`**
- Before:
    Separate mixing console or section dedicated to creating performer monitor mixes. Allows independent monitor sound from main audience sound.
- After:
    Separate mixing console or section dedicated to creating performer monitor mixes. Allows the performers' monitor sound to be controlled independently of the main audience mix.
- *Editor notes:* purpose_function: replaced the awkward 'Allows independent monitor sound from main audience sound' with 'Allows the performers' monitor sound to be controlled independently of the main audience mix.'

### Monoblock Amplifier  *(AUDI201 / Vehicle Audio)*
**`definition`**
- Before:
    A monoblock amplifier is a single-channel car amplifier, almost always Class D, designed to drive subwoofers at low impedances. Its single high-power channel is typically stable at 2 ohms or 1 ohm to deliver maximum bass output.
- After:
    A monoblock amplifier is a single-channel power amplifier housed in its own chassis, typically used one per loudspeaker, so a stereo pair needs two. In hi-fi it is often Class A/AB; in car audio, monoblocks are almost always Class D and optimized to drive subwoofers at low impedances (1-2 ohms) for maximum bass output.
- *Editor notes:* definition: broadened to lead with the general sense (single-channel power amp, one per loudspeaker) before the car-audio specialization, and moved 'almost always Class D' into the car-audio subset. Verified via AV.com and mynewmicrophone: a monoblock is generically a one-channel amp used one-per-speaker, mainstream in hi-fi where it is commonly Class A/AB, not definitionally a car/sub amp.

### Multichannel Amplifier  *(AUDI201 / Vehicle Audio)*
**`plain_english`**
- Before:
    It is an amp with several channels in one box, so it can drive multiple speakers (and sometimes a sub) at once. A 4-channel amp, for example, can power all four door speakers.
- After:
    It is an amp with several channels in one box, so it can drive multiple speakers (and sometimes a sub) at once. In a car, a 4-channel amp can power all four door speakers; in pro audio, a single rack unit might drive several monitor wedges or a set of zoned install speakers.
- *Editor notes:* plain_english: kept the car example but added a pro-audio example (a rack amp driving monitor wedges or zoned install speakers) so learners certifying for studio/live-sound work recognize where they meet the term, closing the transfer gap.

### Multimeter  *(AUDI201 / Troubleshooting)*
**`practical_application`**
- Before:
    A technician uses it to verify supply voltages, check continuity of cables, measure resistance/impedance of loads, and confirm circuits are de-energized before working on them.
- After:
    A technician uses it to verify supply voltages, check continuity of cables, measure DC resistance (DCR) of loads, and confirm circuits are de-energized before working on them.
- *Editor notes:* practical_application: changed 'measure resistance/impedance of loads' to 'measure DC resistance (DCR) of loads'. Web-verified: a standard DMM reads only static DC resistance, not frequency-dependent AC impedance; a nominal 8-ohm speaker typically measures ~6 ohm DCR (roughly 75-85% of rated impedance).

### Multipath Interference  *(AUDI201 / Assisted Listening Systems)*
**`purpose_function`**
- Before:
    Understanding multipath exists so technicians can explain and fix position-dependent dropouts. It guides antenna/emitter placement and the use of techniques like diversity reception to reduce nulls.
- After:
    Understanding multipath lets technicians explain and fix position-dependent dropouts. It guides antenna/emitter placement and the use of techniques like diversity reception to reduce nulls.
- *Editor notes:* purpose_function: reworded the garbled opening ('Understanding multipath exists so...') to a clean sentence 'Understanding multipath lets technicians explain and fix position-dependent dropouts.'; second sentence unchanged.

### Off-axis coloration  *(AUDI201 / Audio Measurement & Optimization)*
**`category`**
- Before:
    Acoustic Measurement
- After:
    Polar Patterns
- *Editor notes:* category: Changed from 'Acoustic Measurement' to 'Polar Patterns' to match sibling directional-response entries (Off-Axis, On-axis); off-axis coloration is a mic/loudspeaker directivity concept, not a measurement topic.

### Orchestra Mixing  *(AUDI201 / Analog Live Sound)*
**`practical_application`**
- Before:
    An engineer mic's sections and soloists, controls inter-instrument spill, and balances the orchestra under the vocals while following the musical director's intended dynamics.
- After:
    An engineer mics sections and soloists, controls inter-instrument spill, and balances the orchestra under the vocals while following the musical director's intended dynamics.
- *Editor notes:* practical_application: corrected the erroneous possessive apostrophe 'mic's' to the plural verb 'mics'.

### Phase Meter  *(AUDI201 / Audio Measurement & Optimization)*
**`related_terms`**
- Before:
    - Correlation Meter
    - Goniometer
    - Goniometer
    - Phase Checker
    - Polarity Tester
- After:
    - Correlation Meter
    - Goniometer
    - Phase Checker
    - Polarity Tester
- *Editor notes:* related_terms: Removed the duplicate 'Goniometer' entry (flagged by three experts).

### Phase popper  *(AUDI201 / Troubleshooting)*
**`purpose_function`**
- Before:
    A phase popper (phase checker / polarity tester) is a two-part test device that sends a pulse from a transmitter and a receiver indicates whether a cable or loudspeaker preserves correct polarity. It exists to quickly verify that cables and drivers are wired in correct polarity across a system.
- After:
    A phase popper (phase checker / polarity tester) is a two-part test device: a transmitter sends a pulse and a receiver indicates whether a cable or loudspeaker preserves correct polarity. It exists to quickly verify that cables and drivers are wired in correct polarity across a system.
- *Editor notes:* purpose_function: fixed the broken parallel construction by recasting the relative clause as a colon list ('a transmitter sends a pulse and a receiver indicates...'); retained the original closing sentence unchanged.

### PPM (peak program meter)  *(AUDI201 / Audio Measurement & Optimization)*
**`plain_english`**
- Before:
    A PPM reacts quickly to peaks and falls back slowly. So you can read the true maximums. It is the broadcast world's choice for keeping signals under the limit, unlike the slow-averaging VU.
- After:
    A PPM reacts quickly to peaks and falls back slowly. So you can read sustained peaks far more reliably than a VU meter (though a quasi-peak PPM still slightly under-reads the very fastest transients). It is the broadcast world's choice for keeping signals under the limit, unlike the slow-averaging VU.
**`scenario_contexts`**
- Before:
    - Setting broadcast levels off a PPM so a sharp transient peak doesn't sneak past and over-modulate
    - Explaining to a student why the VU meter reads 'fine' while the PPM shows the same signal clipping
    - Reading a PPM's slow fall-back correctly instead of waiting for it to drop like a peak-hold
- After:
    - Setting broadcast levels off a PPM so sustained programme peaks are controlled - while remembering a quasi-peak PPM under-reads very short transients, which is why a true-peak (dBTP) meter is used to guard against inter-sample peaks and over-modulation on sharp peaks
    - Explaining to a student why the VU meter reads 'fine' while the PPM shows the same signal clipping
    - Reading a PPM's slow fall-back correctly instead of waiting for it to drop like a peak-hold
- *Editor notes:* scenario_contexts: Web-verified via IEC 60268-10 that a quasi-peak PPM (Type I 5 ms, Type II 10 ms integration) deliberately under-reads brief transients (~4 dB on tone bursts, 6-8 dB on real signals). Reworded the first scenario so it no longer implies a PPM catches sharp transients; kept the other two items unchanged. · plain_english: Corrected 'So you can read the true maximums' (overstated) to reflect that a quasi-peak PPM reads sustained peaks reliably but under-reads the fastest transients.

### Pre-Wire  *(AUDI201 / Consumer Audio Systems)*
**`plain_english`**
- Before:
    Pre-wire means pulling the cables while a home is being built or remodeled, before the drywall goes up. You run speaker, network, and AV wiring to every spot now, label it, and leave it ready. So finishing the system later is easy and clean. It is far cheaper and tidier than fishing wires through finished walls. A good pre-wire plan plans ahead for where audio and video gear will go.
- After:
    Pre-wire means pulling the cables while a home is being built or remodeled, before the drywall goes up. You run speaker, network, and AV wiring to every spot now, label it, and leave it ready. So finishing the system later is easy and clean. It is far cheaper and tidier than fishing wires through finished walls. A good pre-wire anticipates where audio and video gear will go.
- *Editor notes:* plain_english: reworded the redundant closing sentence 'A good pre-wire plan plans ahead for where audio and video gear will go' to 'A good pre-wire anticipates where audio and video gear will go.'

### Reception Audio  *(AUDI201 / Analog Live Sound)*
**`common_mistakes`**
- Before:
    - Running dance-level volume during dinner so guests cannot talk
    - no microphone plan for toasts
    - not following the event timeline
    - UNSAFE: pushing dance-floor SPL to hearing-damaging levels for hours without managing level and exposure
- After:
    - Running dance-level volume during dinner so guests cannot talk
    - Having no microphone plan for toasts
    - not following the event timeline
    - UNSAFE: pushing dance-floor SPL to hearing-damaging levels for hours without managing level and exposure
- *Editor notes:* common_mistakes: rephrased the bare noun phrase 'no microphone plan for toasts' to the parallel verb phrase 'Having no microphone plan for toasts'; other items and the UNSAFE prefix preserved.

### Reference channel  *(AUDI201 / Audio Measurement & Optimization)*
**`related_terms`**
- Before:
    - Reference signal
    - Measurement channel
    - Transfer Function measurement
    - Coherence
    - Device options
- After:
    - Reference signal
    - Measurement channel
    - Transfer Function measurement
    - Coherence
    - Impulse response
- *Editor notes:* related_terms: Replaced the software-menu label 'Device options' with the conceptual neighbor 'Impulse response'.

### Remote Volume Control  *(AUDI201 / Commercial Audio Systems)*
**`definition`**
- Before:
    A remote volume control is a wall-mounted attenuator or control that lets staff adjust the level of a zone from within the space rather than at the rack. It may be a passive 70V L-pad attenuator or a low-voltage/digital controller that commands the amplifier or DSP.
- After:
    A remote volume control is a wall-mounted attenuator or control that lets staff adjust the level of a zone from within the space rather than at the rack. It may be a passive 70V autotransformer (autoformer) attenuator or a low-voltage/digital controller that commands the amplifier or DSP.
- *Editor notes:* definition: web-verified (AtlasIED/Parts-Express) that passive 70V distributed-line volume controls are autotransformer (autoformer) types; a resistive L-pad is for low-impedance speaker lines and cannot sit directly on a 70V line. Changed 'L-pad attenuator' to 'autotransformer (autoformer) attenuator'.

### Reverberation time (RT60)  *(AUDI201 / Audio Measurement & Optimization)*
**`related_terms`**
- Before:
    - RT60
    - RT60 table
    - Absorption
    - Reverberant field
    - Reverberation / Reverb
- After:
    - Decay rate
    - RT60 table
    - Absorption
    - Reverberant field
    - Reverberation / Reverb
- *Editor notes:* related_terms: Replaced the self-referential 'RT60' (abbreviation of the headword) with the adjacent concept 'Decay rate'; kept Absorption, Reverberant field, Reverberation / Reverb and the unflagged 'RT60 table'.

### Reversed-polarity cable  *(AUDI201 / Troubleshooting)*
**`purpose_function`**
- Before:
    A reversed-polarity cable is one wired so the signal polarity is inverted end to end (e.g., hot and cold swapped on a balanced cable, or +/- swapped on a speaker cable), causing cancellation when combined with correct-polarity signals. Finding it explains thin sound and cancellation that no device is faulty to cause.
- After:
    A reversed-polarity cable is one wired so the signal polarity is inverted end to end (e.g., hot and cold swapped on a balanced cable, or +/- swapped on a speaker cable), causing cancellation when combined with correct-polarity signals. Finding it explains thin sound and cancellation that no faulty device could account for.
- *Editor notes:* purpose_function: replaced the garbled clause 'cancellation that no device is faulty to cause' with the grammatical 'cancellation that no faulty device could account for'; rest of the field unchanged.

### RF Exposure Limits  *(AUDI201 / RF Wireless Systems)*
**`related_terms`**
- Before:
    - Antenna Placement
    - Tower Safety Awareness
    - Transmitter RF Power
    - Battery Safety
    - Tripod Stability
    - Hazard
- After:
    - Antenna Placement
    - Tower Safety Awareness
    - Transmitter RF Power
    - Battery Safety
    - MPE (Maximum Permissible Exposure)
    - Hazard
- *Editor notes:* related_terms: replaced the off-topic 'Tripod Stability' (a mechanical-stand topic) with the RF-relevant 'MPE (Maximum Permissible Exposure)'; all other links kept.

### Rigging point  *(AUDI201 / Loudspeaker System Deployment)*
**`related_terms`**
- Before:
    - Safety Standards
    - Coverage map
    - Boom Operator
    - Industry Standards
    - Code of Conduct
- After:
    - Safety Standards
    - Industry Standards
    - Rigging Inspection
    - Working Load Limit
    - Safety Cable / Secondary Safety
    - Flown Loudspeaker Safety
    - Never Stand Beneath Suspended Loads
- *Editor notes:* related_terms: removed the off-topic links 'Coverage map', 'Boom Operator', and 'Code of Conduct'; kept the relevant 'Safety Standards' and 'Industry Standards'; added rigging-relevant neighbors requested by both experts: Rigging Inspection, Working Load Limit, Safety Cable / Secondary Safety, Flown Loudspeaker Safety, and Never Stand Beneath Suspended Loads.

### RTA (Real-Time Analyzer)  *(AUDI201 / Audio Measurement & Optimization)*
**`definition`**
- Before:
    Audio measurement tool displaying frequency response in real-time with resolution from broadband to narrow FFT. Essential tool for acoustic diagnosis and system commissioning.
- After:
    Audio measurement tool displaying frequency spectrum in real-time with resolution from broadband to narrow FFT. Essential tool for acoustic diagnosis and system commissioning.
- *Editor notes:* definition: Changed 'frequency response' to 'frequency spectrum' since an RTA shows a signal's output spectrum, not the system's input-vs-output transfer function; resolves internal inconsistency with the entry's own practical_application. Only the flagged 'definition' field was changed (purpose_function not flagged, left untouched).

### Sampling (Nyquist) Theorem  *(AUDI201 / Digital Live Sound)*
**`plain_english`**
- Before:
    The Nyquist theorem sets the rule for digitizing: sample faster than double the highest frequency you want to keep. That's why 44.1 kHz captures up to ~20 kHz hearing range.
- After:
    The Nyquist theorem sets the rule for digitizing: sample faster than double the highest frequency you want to keep. That's why 44.1 kHz captures the audible range up to ~20 kHz.
- *Editor notes:* plain_english: fixed the garbled/article-missing final clause to 'captures the audible range up to ~20 kHz'.

### Signal injection  *(AUDI201 / Troubleshooting)*
**`related_terms`**
- Before:
    - Tone generator test
    - Signal tracing
    - Signal tracing
    - Half-split method
    - Loopback test
- After:
    - Tone generator test
    - Signal tracing
    - Half-split method
    - Loopback test
- *Editor notes:* related_terms: removed the duplicate 'Signal tracing' (all three experts flagged it), leaving four distinct terms. Optional fifth term not added to keep the change minimal.

### Solder Joint Inspection  *(AUDI201 / Troubleshooting)*
**`definition`**
- Before:
    Solder joint inspection is the visual (and sometimes mechanical) examination of solder connections to identify defects such as cold, cracked, bridged, or insufficiently wetted joints. A good joint looks shiny, smooth, and concave; defects appear dull, grainy, cracked, or blobby.
- After:
    Solder joint inspection is the visual (and sometimes mechanical) examination of solder connections to identify defects such as cold, cracked, bridged, or insufficiently wetted joints. On leaded (Sn/Pb) solder a good joint looks shiny, smooth, and concave, while defects appear cracked or blobby; note that lead-free (SAC) joints are naturally duller and grainier, so judge them by good wetting, a smooth concave fillet, and the absence of cracks or voids rather than by shine.
- *Editor notes:* definition: qualified the shiny=good/dull=defect rule. Web-verified (I-Connect007, Stellar Technical Products): matte/dull/grainy lead-free (SAC) joints are normal — 'an effect, not a defect' — so the shine criterion applies to leaded solder only; lead-free joints must be judged by wetting, fillet shape, and absence of cracks/voids.

### SPL Mode  *(AUDI201 / Audio Measurement & Optimization)*
**`related_terms`**
- Before:
    - SPL (sound pressure level)
    - SPL history plot
    - SPL history plot
    - Calibration
- After:
    - SPL (sound pressure level)
    - SPL history plot
    - Calibration
    - A-weighting
- *Editor notes:* related_terms: removed the duplicate 'SPL history plot' and filled the freed slot with a distinct relevant term, 'A-weighting', reconciling all three experts (all flagged the duplicate; two asked for a distinct replacement).

### Strip-down test  *(AUDI201 / Troubleshooting)*
**`purpose_function`**
- Before:
    A strip-down test removes elements from a faulty system one at a time until the fault disappears, identifying the last-removed component as the likely cause. It is the inverse of the build-up method and useful when a system is already assembled and failing.
- After:
    Reduces a faulty system to its simplest working configuration to confirm the core is clean, then progressively re-adds components until the fault returns, identifying the last-added element as the trigger. It is useful when a system is already assembled and failing.
- *Editor notes:* purpose_function: reconciled to the strip-to-minimum-then-rebuild procedure described in definition/plain_english (was previously a contradictory 'remove until fault disappears, blame last-removed part'). Dropped the trailing 'inverse of the build-up method' clause because the reconciled method now incorporates a build-up (re-adding) phase, so calling it the inverse would create a new contradiction; retained the 'useful when a system is already assembled and failing' note.

### Subwoofer  *(AUDI201 / Commercial Audio Systems)*
**`plain_english`**
- Before:
    A subwoofer is a speaker built only for the lowest frequencies, usually around 20 to 200 Hz. It uses a large, heavy cone to move enough air to make deep bass that smaller speakers cannot. To blend in well, its volume, timing, and crossover (where it takes over from the mains) must be set with care. Subwoofers let a system give full, powerful low end without straining the other speakers.
- After:
    A subwoofer is a speaker built only for the lowest frequencies, usually around 20 to 100 Hz. It uses a large, heavy cone to move enough air to make deep bass that smaller speakers cannot. To blend in well, its volume, timing, and crossover (where it takes over from the mains) must be set with care. Subwoofers let a system give full, powerful low end without straining the other speakers.
**`related_terms`**
- Before:
    - Loudspeaker (Speaker)
    - Crossover Frequency
    - Sub-main alignment
    - LFE (Low-Frequency Effects)
    - Power tube
- After:
    - Loudspeaker (Speaker)
    - Crossover Frequency
    - Sub-main alignment
    - LFE (Low-Frequency Effects)
    - Bass Management
- *Editor notes:* plain_english: changed 'usually around 20 to 200 Hz' to 'usually around 20 to 100 Hz' to match the definition's stated range and resolve the internal inconsistency flagged by three experts. · related_terms: removed 'Power tube' (a valve-amp output device, irrelevant to a subwoofer) and replaced it with the relevant term 'Bass Management'.

### Technical Rehearsal  *(AUDI201 / Corporate AV)*
**`related_terms`**
- Before:
    - Rehearsal
    - Cue Sheet
    - Run of Show
    - Show Caller
    - Roll-In Video
- After:
    - Rehearsal
    - Cue Sheet
    - Run of Show
    - Show Caller
    - Roll-In Video
    - Tech Rehearsal
- *Editor notes:* related_terms: added 'Tech Rehearsal' so learners see the two near-identical entries (live-sound/theater vs corporate AV senses) are the same practice in different verticals.

### Time Alignment  *(AUDI201 / Vehicle Audio)*
**`scenario_contexts`**
- Before:
    - Tuning a DSP to center the soundstage for the driver
    - Entering per-speaker delay based on measured distances
    - Refining imaging in a sound-quality competition vehicle
- After:
    - Tuning a DSP to center the soundstage for the driver
    - Entering per-speaker delay based on measured distances
    - Refining imaging in a sound-quality competition vehicle
    - Delaying the main PA to time-align it with front-fill or delay-tower speakers so arrivals match at the audience
- *Editor notes:* scenario_contexts: kept the three original car-audio scenarios and added a live-sound/PA scenario (aligning mains to front-fill/delay-tower speakers) so this broadly-applicable concept generalizes to the live-sound domain the app certifies.

### Tone generator test  *(AUDI201 / Troubleshooting)*
**`related_terms`**
- Before:
    - Signal tracing
    - Signal injection
    - Signal tracing
    - sine wave
    - Half-split method
- After:
    - Signal tracing
    - Signal injection
    - sine wave
    - Half-split method
    - Continuity test
- *Editor notes:* related_terms: removed the duplicate 'Signal tracing' (was at positions 1 and 3) and, per all three experts' option to keep a fifth distinct link, filled the freed slot with 'Continuity test' (suggested by two reviewers) as a relevant troubleshooting term.

### Top-down troubleshooting  *(AUDI201 / Troubleshooting)*
**`definition`**
- Before:
    Starting diagnosis at the system or output level and working back toward the source, useful when the symptom is observed at the end of the chain.
- After:
    Starting diagnosis at the highest level - the source, the overall system, or its configuration - and working down stage by stage toward the output, useful when isolating a fault from the big picture inward.
- *Editor notes:* definition: resolved the direction contradiction by correcting the definition, not purpose_function. Verified against the standard top-down convention (OSI-style network troubleshooting): top-down begins at the highest/application level and works DOWN to the physical/output layer. The original definition wrongly ran output->source; rewritten to source/high-level->output so it now agrees with purpose_function, practical_application, and all scenario_contexts. · purpose_function: DECLINED the Learning/Language suggestion to reword it to output->source. purpose_function is already technically correct (highest level -> output) and matches the majority of the entry; changing it would have introduced the error rather than fixed it. Both experts explicitly permitted the alternative of rewriting the definition instead, which I did. Residual note: plain_english (not a flagged field, so left untouched) still describes output->source and remains inconsistent.

### Transfer Function measurement  *(AUDI201 / Audio Measurement & Optimization)*
**`definition`**
- Before:
    Transfer function measurement: a technique that captures a system's full frequency and phase response (using swept tones or impulse responses) to show how it changes a signal.
- After:
    Transfer function measurement: a dual-channel FFT technique that compares a reference (input) signal to the measured (output) signal to capture a system's full frequency (magnitude) and phase response, showing how the system changes a signal. It is typically driven by broadband noise (pink) or program material and is equally derivable from a swept-sine or impulse-response measurement.
- *Editor notes:* definition: web-verified (Rational Acoustics/Smaart) that a transfer function measurement is a dual-channel FFT comparison of a reference input to the measured output; any stimulus works but random/pseudorandom (pink) noise or program material is most common, not specifically swept tones/IR. Revised the method clause to match the rest of the entry and the standard live-sound technique while keeping swept-sine/IR as an equally valid alternative.

### Upstage  *(AUDI201 / Analog Live Sound)*
**`common_mistakes`**
- Before:
    - Reversing upstage and downstage — upstage is toward the back wall, away from the audience.
    - Forgetting the term comes from raked stages that sloped up toward the back, so 'up' means the rear even on a flat modern stage.
    - Reading the direction from the audience's view rather than the performer's facing-the-audience frame.
- After:
    - Reversing upstage and downstage — upstage is toward the back wall, away from the audience.
    - Forgetting the term comes from raked stages that sloped up toward the back, so 'up' means the rear even on a flat modern stage.
    - Thinking upstage means physically higher or elevated, rather than simply farther from the audience.
- *Editor notes:* common_mistakes: replaced the third mistake, which wrongly imported viewpoint-dependence onto the upstage/downstage axis. Verified: upstage/downstage is the same for audience and performer (only stage left/right flips with viewpoint), so the reframed mistake about mistaking 'up' for elevation is accurate.

### VCA (voltage-controlled amplifier)  *(AUDI201 / Digital Live Sound)*
**`related_terms`**
- Before:
    - Compression / Compressor
    - Dynamic Range
    - Gain
    - Fader
    - Buffer Size
- After:
    - Compression / Compressor
    - Dynamic Range
    - Gain
    - Fader
    - VCA Group
- *Editor notes:* related_terms: replaced out-of-scope 'Buffer Size' (a DAW/digital latency parameter) with 'VCA Group', an on-topic anchor endorsed by both experts.

### Wireless Microphone Management  *(AUDI201 / Analog Live Sound)*
**`related_terms`**
- Before:
    - Frequency Coordination
    - Frequency Coordination
    - Bodypack Transmitter
    - Diversity Receiver
    - Microphone Plot
    - Cast
- After:
    - Frequency Coordination
    - Antenna Distribution
    - Bodypack Transmitter
    - Diversity Receiver
    - Microphone Plot
    - Cast
- *Editor notes:* related_terms: removed the duplicate 'Frequency Coordination' (kept a single entry) and filled the freed slot with the distinct, complementary term 'Antenna Distribution', which is already referenced in the definition; reconciles all three experts (single Frequency Coordination + a useful distinct term).

### Zone / Multi-Zone Audio  *(AUDI201 / Distributed Audio Systems)*
**`related_terms`**
- Before:
    - Coverage map
    - Optimization
    - System baseline
    - Speech intelligibility
    - Walk test
- After:
    - Zoning
    - Source Selection
    - Paging System
    - Remote Volume Control
- *Editor notes:* related_terms: swapped the measurement/tuning terms for architecture-adjacent anchors (Zoning, Source Selection, Paging System, Remote Volume Control) that reflect how zones are built and controlled.

### Absorber / Absorbers  *(MUSI190 / Sound & Acoustics)*
**`definition`**
- Before:
    Materials and devices designed to absorb sound energy by converting it to heat through friction and material resistance. Include foam, fiberglass, rockwool, and custom resonant absorbers.
- After:
    Materials and devices designed to absorb sound energy by converting it to heat through friction and material resistance. Examples include foam, fiberglass, rockwool, and custom resonant absorbers.
- *Editor notes:* definition: gave the second sentence a subject, changing the fragment 'Include foam, fiberglass, ...' to 'Examples include foam, fiberglass, ...'; technical content unchanged.

### Acoustic overload  *(MUSI190 / Signal Path & Levels)*
**`category`**
- Before:
    Acoustic Treatment
- After:
    Signal Levels
**`common_mistakes`**
- Before:
    - Not protecting systems from overload (equipment damage results)
    - setting levels without understanding overload points
    - not using protective devices.
- After:
    - Confusing acoustic overload at the mic capsule (source SPL exceeding the mic's max SPL) with electrical clipping downstream in the preamp or converter - they occur at different points and are fixed differently (an inline pad at the mic vs. lowering downstream gain)
    - Believing a pad raises the diaphragm's own SPL handling - a pad protects the mic electronics and preamp input, but the capsule's acoustic overload point is fixed by the diaphragm
    - setting levels without understanding overload points
- *Editor notes:* Recategorized from 'Acoustic Treatment' to 'Signal Levels' to match the entry's topic (Signal Path & Levels) and sibling level terms; the entry concerns SPL/signal levels exceeding device handling, not room treatment. · Replaced two generic restatements with real learner misconceptions (capsule acoustic overload vs. downstream electrical clipping; what a pad actually protects), keeping one original item; complete corrected list returned.

### Ambience  *(MUSI190 / Reverb & Delay)*
**`plain_english`**
- Before:
    Ambience is the gentle 'air' of a room. It is the short reflections and low-level background that tell your ear what kind of space you are in. It is short of obvious reverb.
- After:
    Ambience is the gentle 'air' of a room. It is the short reflections and low-level background that tell your ear what kind of space you are in. It is subtler than obvious reverb - you sense the space more than you hear a distinct tail.
- *Editor notes:* Replaced the ambiguous closing sentence 'It is short of obvious reverb.' with clearer phrasing, reconciling both experts' requests; rest of the passage unchanged.

### Bandpass Filter  *(MUSI190 / Equalization (EQ))*
**`common_mistakes`**
- Before:
    - Confusing bandpass with high-pass and low-pass (bandpass is narrow, others are broad)
    - not understanding Q factor affects bandwidth
    - applying bandpass where notch filter is better
- After:
    - Confusing bandpass with high-pass/low-pass — a bandpass attenuates both below and above its band, whereas HPF/LPF pass everything on one side of a single cutoff (bandwidth can be wide or narrow either way)
    - not understanding Q factor affects bandwidth
    - applying bandpass where notch filter is better
- *Editor notes:* common_mistakes: reworded item 1. Verified fact — a bandpass filter is defined by attenuating BOTH below and above its passband (two cutoffs), not by being narrow; bandwidth can be wide or narrow at any Q. Removes the internal contradiction with practical_application. Items 2-3 unchanged.

### Bidirectional Microphone (Figure-8)  *(MUSI190 / Microphones)*
**`purpose_function`**
- Before:
    Enables dual-source microphone placement without side rejection inefficiency, ideal for stereo interview and two-point source recording, provides maximum side rejection.
- After:
    Captures front and rear sources equally while strongly rejecting sound arriving from the sides, making it ideal for two people or two instruments facing each other, for stereo interviews, and for the side component of mid-side recording.
- *Editor notes:* purpose_function: rewrote the garbled, self-contradictory clause ('without side rejection inefficiency ... provides maximum side rejection') into one clear statement satisfying both experts; figure-8 captures front/rear equally and strongly rejects the sides.

### Binaural Mic  *(MUSI190 / Microphones)*
**`practical_application`**
- Before:
    Technicians use binaural rigs for ambisonic and immersive field recording, ASMR, nature and soundscape capture, and VR/360 audio, monitoring the result on headphones rather than loudspeakers.
- After:
    Technicians use binaural rigs for immersive field recording, ASMR, nature and soundscape capture, and VR/360 audio, monitoring the result on headphones rather than loudspeakers.
- *Editor notes:* practical_application: dropped 'ambisonic'. Web-verified (decibelpeak.com, en.wikipedia.org/wiki/Ambisonics): a binaural rig uses two ear-spaced capsules/dummy head to capture interaural time and level cues, whereas ambisonics uses a coincident tetrahedral capsule array encoded to B-format; a binaural rig does not produce an ambisonic recording.

### Broken Connector  *(MUSI190 / Connectors & I/O Connections)*
**`common_mistakes`**
- Before:
    - Forcing or wiggling a broken connector to "get it working"
    - UNSAFE: using a power connector with a broken ground pin or exposed conductors (shock/arc/fire)
    - continuing to use a connector that arcs or is hot
    - a re-terminated connector with the conductors (not jacket) taking the strain
- After:
    - Forcing or wiggling a broken connector to "get it working"
    - UNSAFE: using a power connector with a broken ground pin or exposed conductors (shock/arc/fire)
    - continuing to use a connector that arcs or is hot
    - Re-terminating a connector so the conductors (not the jacket) take the strain, instead of using proper strain relief
- *Editor notes:* Rewrote the trailing fragment into a verb-led statement of the mistake; kept other bullets and the UNSAFE prefix intact.

### Capacitor  *(MUSI190 / Grounding & Electrical)*
**`common_mistakes`**
- Before:
    - Ignoring voltage rating in HV circuits
    - assuming all cap types sound the same
    - wrong value for the role
- After:
    - Thinking a capacitor stores signal like a battery stores power
    - assuming a disconnected device is safe to touch because the power is off
    - assuming all cap types sound the same
- *Editor notes:* common_mistakes: replaced the two intermediate items ('Ignoring voltage rating in HV circuits', 'wrong value for the role') with beginner-level misconceptions that match the difficulty tag and the definition/plain_english depth; kept 'assuming all cap types sound the same'. The 'safe to touch' item reinforces the entry's stored-charge safety point.

### CDJ  *(MUSI190 / Signal Path & Levels)*
**`definition`**
- Before:
    CDJ is Pioneer DJ's line of professional DJ media players (the brand is now AlphaTheta) that became the de facto club standard. Originally CD-based, modern CDJs (e.g., the CDJ-3000) play rekordbox-analyzed files from USB/SD media or a network link and provide a jog wheel, tempo control, looping, hot cues, and beat features. The name is often used generically for a professional media player.
- After:
    CDJ is Pioneer DJ's line of professional DJ media players (Pioneer DJ's parent company is AlphaTheta Corporation, which since 2024 also releases newer gear under the AlphaTheta brand) that became the de facto club standard. Originally CD-based, modern CDJs (e.g., the CDJ-3000) play rekordbox-analyzed files from USB/SD media or a network link and provide a jog wheel, tempo control, looping, hot cues, and beat features. The name is often used generically for a professional media player.
- *Editor notes:* Verified via MusicRadar (NAMM 2024) and AlphaTheta: AlphaTheta is the parent company (adopted 2020) and, since Jan 2024, a separate NEW-product brand; the CDJ-3000 is still Pioneer DJ-branded. Reworded to remove the implication that CDJs are now called AlphaTheta.

### Center-terminated capsule  *(MUSI190 / Microphones)*
**`plain_english`**
- Before:
    Inside a mic capsule, the spot the design treats as where sound 'arrives' can sit at the capsule's center. That is a center-terminated capsule. Where that reference point sits changes how the capsule handles timing (phase) and how its pickup pattern behaves. Center-terminated designs tend to hold a steadier pickup pattern across frequencies than edge-referenced ones. The trade-off shows up elsewhere, like frequency response and how hard the capsule is to build. Designers pick center or edge termination based on the result they want.
- After:
    In a center-terminated capsule, the diaphragm's signal connection is taken from its center rather than from its outer edge. Where that connection sits changes how the diaphragm behaves at high frequencies, shaping its phase response and its pickup pattern. The central connection helps break up standing waves across the diaphragm, so center-terminated designs tend to hold a steadier pickup pattern across frequencies than edge-referenced ones. The trade-off shows up elsewhere, like frequency response and how hard the capsule is to build. Designers pick center or edge termination based on the result they want.
- *Editor notes:* plain_english: reframed from the acoustic 'where sound arrives' model to the electrical/mechanical termination model used in practical_application, so both fields describe the same thing. Web-verified (mynewmicrophone.com, mixingnmastering.com): 'center-terminated' means the diaphragm's electrical lead is taken from the center of the diaphragm/backplate; the central connection breaks up standing waves, giving steadier pattern and phase across frequencies than edge termination.

### Chorus Effect  *(MUSI190 / Reverb & Delay)*
**`practical_application`**
- Before:
    Apply chorus to pads and sustained sounds (less effective on percussive material); use moderate settings (100-300ms delay, 5-15% feedback) unless seeking obvious effect; sync chorus rate to song BPM for musicality; chorus works well on vocals (adds dimension without sounding effected if used subtly); combine with reverb for expansive effect
- After:
    Apply chorus to pads and sustained sounds (less effective on percussive material); use moderate settings (15-40 ms delay, 5-15% feedback) unless seeking obvious effect; sync chorus rate to song BPM for musicality; chorus works well on vocals (adds dimension without sounding effected if used subtly); combine with reverb for expansive effect
- *Editor notes:* Verified via Sweetwater/RecordingBlogs that chorus delay times are ~15-40 ms (typically 15-35 ms); the original '100-300 ms' is echo/slapback territory. Changed only the flagged practical_application field; plain_english's 'a few milliseconds' was not a flagged field and was left untouched per the change-only-flagged-fields rule.

### Clipper  *(MUSI190 / Dynamics Processing)*
**`related_terms`**
- Before:
    - Hard Clipping
    - Soft Clipping
    - Soft Clipping
    - True Peak Limiter
    - Look-Ahead Limiter
- After:
    - Hard Clipping
    - Soft Clipping
    - True Peak Limiter
    - Look-Ahead Limiter
- *Editor notes:* related_terms: removed the consecutive duplicate 'Soft Clipping' (flagged by all three experts). Left the optional extra term unadded to avoid over-editing beyond the flagged fix.

### Cocktail Party Effect  *(MUSI190 / Sound & Acoustics)*
**`definition`**
- Before:
    The ability to attend to one voice among many competing sources — and why intelligibility matters for systems.
- After:
    The ability of a listener to focus on one voice among many competing sources; because a live listener can do this but a single microphone cannot, it is intelligibility rather than loudness that determines whether a system communicates.
- *Editor notes:* definition: rewrote the noun-phrase-plus-dangling-clause fragment as a complete sentence, preserving the original meaning (source separation; intelligibility over loudness).

### Column Speaker  *(MUSI190 / Amps & Loudspeakers)*
**`practical_application`**
- Before:
    A technician deploys column speakers for speech-focused systems in churches, houses of worship, and reverberant halls where intelligibility matters more than high SPL.
- After:
    A technician deploys column speakers for speech-focused systems in houses of worship and other reverberant halls where intelligibility matters more than high SPL.
- *Editor notes:* practical_application: collapsed the redundant 'churches, houses of worship, and reverberant halls' to 'houses of worship and other reverberant halls', since churches are a subset of houses of worship.

### Condenser Microphone  *(MUSI190 / Microphones)*
**`purpose_function`**
- Before:
    Record vocals with condenser mics, mic acoustic instruments, use large-diaphragm for vocals/bass, use small-diaphragm for bright sources, apply phantom power correctly
- After:
    A condenser mic uses a capacitor capsule (a charged diaphragm and backplate) whose motion varies capacitance to produce the signal. Its low-mass diaphragm gives high sensitivity and extended, detailed high-frequency response, making it the studio standard for vocals and acoustic instruments; large-diaphragm models suit vocals and fuller sources, small-diaphragm models suit bright or detailed sources, and the active circuitry requires phantom power.
- *Editor notes:* purpose_function: replaced the comma-spliced imperative workflow list with a descriptive purpose/function statement in the same voice as other entries, satisfying both experts and removing the overlap with practical_application.

### Continuity Testing  *(MUSI190 / Grounding & Electrical)*
**`common_mistakes`**
- Before:
    - Running a continuity/resistance test on a live circuit
    - UNSAFE: measuring resistance/continuity on an energized circuit, which gives false readings and can damage the meter or injure the user
    - forgetting stored charge in capacitors before testing
    - trusting a continuity beep without confirming it is the intended path
- After:
    - UNSAFE: measuring continuity/resistance on an energized circuit — gives false readings and can damage the meter or injure the user
    - forgetting stored charge in capacitors before testing
    - trusting a continuity beep without confirming it is the intended path
- *Editor notes:* common_mistakes: merged the two duplicate live-circuit items into one, keeping the fuller UNSAFE-tagged wording with consequences; the two distinct mistakes (stored capacitor charge; trusting a beep) are preserved. UNSAFE: prefix retained.

### Current  *(MUSI190 / Grounding & Electrical)*
**`definition`**
- Before:
    The flow of electric charge through a conductor, measured in amperes (A). Current is what does work — and what injures: it is the amount of current through the body, along its path, and for how long that determines the severity of an electric shock, not voltage alone.
- After:
    The flow of electric charge through a conductor, measured in amperes (A). Current is what does work — and what injures: how much current passes through the body, the path it takes, and how long it lasts determine the severity of an electric shock, not voltage alone.
- *Editor notes:* definition: rewrote the non-parallel clause into three parallel noun clauses with plural 'determine', preserving the technically correct point that current magnitude, path, and duration — not voltage alone — govern shock severity.

### Diaphragm  *(MUSI190 / Amps & Loudspeakers)*
**`plain_english`**
- Before:
    A microphone diaphragm is a thin piece of material, such as metal foil or polymer film, that vibrates when sound waves hit it. The microphone turns that vibration into an electrical signal. Large diaphragms (around 1 inch) capture more low frequencies and are very sensitive. Small diaphragms (0.5 inch or less) are more directional and have a flatter, more even frequency response. The diaphragm's material and thickness also shape the final sound.
- After:
    A microphone diaphragm is a thin piece of material, such as metal foil or polymer film, that vibrates when sound waves hit it. The microphone turns that vibration into an electrical signal. Large diaphragms (around 1 inch) capture more low frequencies and are very sensitive. Small diaphragms (0.5 inch or less) hold a more consistent polar pattern across frequencies and have a flatter, more even off-axis response. The diaphragm's material and thickness also shape the final sound.
- *Editor notes:* plain_english: replaced the incorrect 'more directional' claim with a consistency statement. Verified via Neumann knowledge base (KM 184 vs U 87A) and ProSoundWeb: small-diaphragm mics do not have a tighter pattern; they hold a more consistent polar pattern across frequency and a flatter off-axis high-frequency response, while large-diaphragm mics narrow at highs and widen at lows. Directionality is set by capsule design, not diaphragm size.

### Diffusion  *(MUSI190 / Reverb & Delay)*
**`definition`**
- Before:
    Diffusion: the scattering of sound reflections in many directions, which prevents strong mirror-like reflections and flutter echo. It helps create natural-sounding spaces while breaking up standing waves (fixed loud and quiet zones).
- After:
    Diffusion: the scattering of sound reflections in many directions, which prevents strong mirror-like reflections and flutter echo. It helps create natural-sounding spaces while breaking up strong mid/high-frequency reflections; low-frequency room modes and bass buildup are addressed with absorption or bass trapping, not diffusion.
- *Editor notes:* Reframed the benefit to the frequencies diffusion actually works on (mid/high, where device size approaches wavelength) and corrected the misleading 'standing waves' claim, since low-frequency modes need absorption/bass trapping. Only the flagged definition field was changed; the common_mistakes note in the suggestion was outside the flagged field and not applied.

### DVD-Audio  *(MUSI190 / Connectors & I/O Connections)*
**`definition`**
- Before:
    DVD-Audio: a DVD variant for high-resolution PCM audio - up to 24-bit/192 kHz in 2-channel stereo, or up to 24-bit/96 kHz in 5.1 multichannel (limited by the format's ~9.6 Mbps maximum data rate) - aimed at audiophile playback.
- After:
    DVD-Audio: a DVD variant for high-resolution audio - up to 24-bit/192 kHz in 2-channel stereo, or up to 24-bit/96 kHz in 5.1 multichannel - aimed at audiophile playback. It stores linear PCM, losslessly compressed with MLP (Meridian Lossless Packing) when needed: MLP is mandatory for 24-bit/96 kHz 5.1, whose uncompressed rate (~13.8 Mbps) exceeds the format's ~9.6 Mbps maximum.
- *Editor notes:* Verified: uncompressed six-channel 24-bit/96 kHz is ~13.8 Mbps, above the ~9.6 Mbps DVD ceiling, so MLP lossless packing is mandatory for high-resolution multichannel. Reworded to state PCM+MLP rather than implying plain PCM fits under the limit.

### Dynamics processors  *(MUSI190 / Dynamics Processing)*
**`plain_english`**
- Before:
    Dynamics processors automatically adjust volume based on the incoming signal. A compressor turns down the loud parts. A limiter sets an absolute ceiling, so the signal can never clip. A gate turns off sound below a set level, removing noise in the gaps. An expander does the opposite of a compressor, making loud parts louder and quiet parts quieter to add contrast.
- After:
    Dynamics processors automatically adjust volume based on the incoming signal. A compressor turns down the loud parts. A limiter sets an absolute ceiling, so the signal can never clip. A gate turns off sound below a set level, removing noise in the gaps. An expander does the opposite of a compressor: it turns the quiet parts down even more, widening the gap between soft and loud to add contrast.
- *Editor notes:* plain_english: corrected the expander description. Verified an expander (downward expansion) attenuates signal below threshold - it makes quiet parts quieter, it does not boost loud parts. New wording removes the wrong 'making loud parts louder' mental model and aligns with the common_mistake that not every dynamics processor reduces level.

### Edge-terminated capsule  *(MUSI190 / Microphones)*
**`category`**
- Before:
    Sound Reinforcement
- After:
    Microphone Construction
- *Editor notes:* category: changed 'Sound Reinforcement' to 'Microphone Construction' to match the term's subject (a capsule construction detail) and the corpus's sibling mic-design entries (e.g. Electret = 'Microphone Construction').

### Equipment Ground  *(MUSI190 / Grounding & Electrical)*
**`related_terms`**
- Before:
    - Ground
    - Bonding
    - Neutral
    - Ground Fault
    - GFCI
    - Ground Lift
- After:
    - Ground
    - Bonding
    - Neutral
    - Ground Fault
    - GFCI
    - Ground Lift
    - Equipment Grounding Conductor
- *Editor notes:* related_terms: appended 'Equipment Grounding Conductor' so the two synonymous NEC concepts cross-link; existing items preserved in order.

### Fader  *(MUSI190 / Mixers & Recorders)*
**`plain_english`**
- Before:
    A fader is the sliding volume control on a mixer or in a DAW. Push it up to make a track louder, pull it down to make it quieter. It's called 'linear' because the slider's position maps directly to the level. The master fader sets the overall volume, while channel faders control individual tracks. On-screen faders in a DAW work exactly the same way.
- After:
    A fader is the sliding volume control on a mixer or in a DAW. Push it up to make a track louder, pull it down to make it quieter. It's called 'linear' because the control slides in a straight line (unlike a rotary knob) - not because level tracks position evenly. In fact its calibrated travel follows a logarithmic 'fader law' marked in dB, so equal-looking moves near the bottom change the level far more than moves near the top. The master fader sets the overall volume, while channel faders control individual tracks. On-screen faders in a DAW work exactly the same way.
- *Editor notes:* plain_english: replaced the incorrect claim that a fader is 'linear' because 'position maps directly to level' - attached 'linear' to the straight-line physical travel and stated the taper is a logarithmic fader law in dB, resolving the self-contradiction with the entry's own definition/common_mistakes. Verified via Sound On Sound 'Are all faders created equal?' and lenardaudio: fader law is logarithmic, 'linear' = straight-line travel.

### Flown Array  *(MUSI190 / Amps & Loudspeakers)*
**`common_mistakes`**
- Before:
    - UNSAFE: exceeding rated working load limits or using unrated rigging hardware, which risks catastrophic failure; follow ANSI/ESTA E1.2 and manufacturer rigging specs
    - UNSAFE: omitting secondary safety/retention or working under a suspended load without fall and overhead protection per OSHA 1926
    - Assuming any ceiling point or structure can bear the load without engineering verification
- After:
    - UNSAFE: exceeding rated working load limits or using unrated rigging hardware, which risks catastrophic failure; follow ANSI E1.8 for the loudspeaker enclosure and its suspension hardware plus manufacturer rigging specs
    - UNSAFE: omitting secondary safety/retention or working under a suspended load without fall and overhead protection per OSHA 1926
    - Assuming any ceiling point or structure can bear the load without engineering verification
- *Editor notes:* common_mistakes: corrected the standard cited for loudspeaker enclosure/suspension-hardware working-load limits from ANSI/ESTA E1.2 to ANSI E1.8. Verified via ANSI webstore: E1.8 is 'Loudspeaker Enclosures Intended for Overhead Suspension - Classification, Manufacture and Structural Testing', the correct standard for flown enclosures and their suspension hardware, whereas E1.2 governs aluminum trusses/towers. Other two list items left unchanged.

### Frequency-dependent absorption  *(MUSI190 / Sound & Acoustics)*
**`purpose_function`**
- Before:
    The fact that a material soaks up some frequencies more than others, so its absorption coefficient varies across the spectrum. It matters because the wrong material can deaden highs while leaving low-end problems untouched — matching absorber to the problem band is what makes treatment balanced.
- After:
    Because a material absorbs some frequencies more than others, its absorption coefficient varies across the spectrum. It matters because the wrong material can deaden highs while leaving low-end problems untouched — matching absorber to the problem band is what makes treatment balanced.
- *Editor notes:* purpose_function: rewrote the malformed declarative fragment opening sentence into a complete sentence; kept the second sentence intact.

### Gain Sharing  *(MUSI190 / Mixers & Recorders)*
**`related_terms`**
- Before:
    - Aux Mix
    - Bus Assignment
    - Monitor Mix
    - DCA (Digitally Controlled Amplifier)
    - Master Fader
- After:
    - Automatic Microphone Mixer (Automixer)
    - Gating Automixer
    - NOM (Number of Open Mics)
    - DCA (Digitally Controlled Amplifier)
- *Editor notes:* related_terms: replaced the generic console terms (Aux Mix, Bus Assignment, Monitor Mix, Master Fader) with the automixing concepts the entry actually leans on - Automatic Microphone Mixer, Gating Automixer, NOM - keeping one general term (DCA), reconciling both experts.

### graphic equalizer  *(MUSI190 / Equalization (EQ))*
**`practical_application`**
- Before:
    Live sound systems use 31-band graphic EQs on main outputs to correct venue acoustic issues; car audio installations use 1/3-octave graphic EQs for room correction; nightclubs use graphic EQs to tailor house sound to acoustic environment; recording studios use graphic EQs for real-time monitoring corrections; DJ systems often include 3-band graphic EQs for quick mixing adjustments.
- After:
    Live sound systems use 31-band graphic EQs on main outputs to correct venue acoustic issues; car audio installations use 1/3-octave graphic EQs for room correction; nightclubs use graphic EQs to tailor house sound to acoustic environment; recording studios use graphic EQs for real-time monitoring corrections.
- *Editor notes:* practical_application: removed the DJ '3-band graphic EQ' example. Verified — DJ mixer channel EQs (and isolators) are rotary knob controls, not slider-based graphic EQs; 'graphic' specifically denotes the sliders that graph the response. Remaining valid graphic-EQ examples kept intact.

### Ground Stack  *(MUSI190 / Amps & Loudspeakers)*
**`purpose_function`**
- Before:
    Ground stacking provides a stable, riggingless deployment for smaller venues or where overhead rigging points are unavailable, though it can suffer more audience blockage and uneven coverage.
- After:
    Ground stacking provides a stable, rigging-free deployment for smaller venues or where overhead rigging points are unavailable, though it can suffer more audience blockage and uneven coverage.
- *Editor notes:* Replaced nonstandard coinage 'riggingless' with 'rigging-free'; no other change.

### Hertz (Hz)  *(MUSI190 / Sound & Acoustics)*
**`scenario_contexts`**
- Before:
    - Reading a speaker spec that says '50 Hz-20 kHz' and knowing it won't reproduce deep sub-bass
    - Hearing a 1 kHz test tone and relating it to roughly two octaves above concert A
    - Explaining to a beginner why 100 Hz (a frequency) and -10 dB (a level) describe completely different things
- After:
    - Reading a speaker spec that says '50 Hz-20 kHz' and knowing it won't reproduce deep sub-bass
    - Hearing a 1 kHz test tone and relating it to roughly one octave above concert A
    - Explaining to a beginner why 100 Hz (a frequency) and -10 dB (a level) describe completely different things
- *Editor notes:* scenario_contexts: corrected 'roughly two octaves above concert A' to 'roughly one octave above concert A'. Verified: an octave is a 2:1 ratio, so one octave above A440 = 880 Hz and two octaves = 1760 Hz; log2(1000/440) = 1.19, so 1 kHz is just over one octave above A440.

### High-Pass Filter (HPF / Low-Cut Filter)  *(MUSI190 / Equalization (EQ))*
**`purpose_function`**
- Before:
    Remove rumble and low-frequency noise, improve clarity on all instruments, eliminate sub-bass issues, reduce frequency masking, design mixing approach
- After:
    Remove rumble and low-frequency noise, improve clarity on all instruments, eliminate sub-bass issues, reduce low-frequency masking, and keep the low end clean for kick and bass
**`practical_application`**
- Before:
    Apply high-pass filter at 80-100 Hz to all non-bass/kick tracks (removes rumble, cleans up mud); use gentle slope (12 dB/octave) for subtle removal, steep slope (48 dB/octave) for dramatic removal; listen carefully to verify you're removing only rumble, not wanted tone; understanding that filter slope determines how sharp the cutoff is affects subtle EQ
- After:
    Apply high-pass filter at 80-100 Hz to all non-bass/kick tracks (removes rumble, cleans up mud); use gentle slope (12 dB/octave) for subtle removal, steep slope (48 dB/octave) for dramatic removal; listen carefully to verify you're removing only rumble, not wanted tone; remember that the filter slope sets how sharply the cutoff falls, so gentle vs. steep slopes give very different results — audition the change to confirm you are only removing rumble.
**`related_terms`**
- Before:
    - Low-Pass Filter (LPF / High-Cut Filter)
    - Bandpass Filter
    - Filter
    - Frequency Response
    - EQ (equalizer)
    - EQ (equalizer)
- After:
    - Low-Pass Filter (LPF / High-Cut Filter)
    - Bandpass Filter
    - Filter
    - Frequency Response
    - EQ (equalizer)
- *Editor notes:* purpose_function: closed the keyword list with a real clause and dropped the dangling 'design mixing approach' fragment. · practical_application: rewrote the garbled trailing clause into a complete sentence about filter slope; earlier clauses unchanged. · related_terms: removed the duplicate 'EQ (equalizer)' so it appears once (consolidates the three identical duplicate flags).

### Hypercardioid  *(MUSI190 / Microphones)*
**`plain_english`**
- Before:
    A hypercardioid pattern is very directional: it picks up mostly from the front and rejects the sides, giving the best front-to-rear isolation of the common patterns. The trade-off is a small rear lobe, so a source right behind the mic still leaks in. It is common in headset and close-pickup use.
- After:
    A hypercardioid pattern is very directional: it picks up mostly from the front and rejects the sides, giving the highest directivity (the greatest overall rejection of off-axis and ambient sound) of the common patterns. The trade-off is a rear lobe, so a source directly behind the mic still leaks in; a supercardioid actually rejects sound arriving straight from the rear slightly better because its rear lobe is smaller. It is common in headset and close-pickup use.
- *Editor notes:* plain_english: replaced 'best front-to-rear isolation' with 'highest directivity (greatest overall rejection of off-axis and ambient sound)' and noted the supercardioid rejects direct-rear sound better. Web-verified (gearank.com, mynewmicrophone.com): hypercardioid has the highest first-order directivity index (~6 dB) but a LARGER rear lobe (approx -6 dB at 180 deg) than a supercardioid (approx -11.6 dB), so it does not have the best rear rejection.

### Impedance converter  *(MUSI190 / Connectors & I/O Connections)*
**`plain_english`**
- Before:
    Sometimes two devices do not get along because their impedances do not match. An impedance converter fixes that. It changes the signal's impedance to what the next device wants. The best-known example is a DI box, which turns a high-impedance instrument signal into a low-impedance balanced output for a mixer. Converters use transformers or active buffers. One prevents the weak, dull sound of a bad mismatch.
- After:
    Sometimes two devices do not get along because their impedances do not match. An impedance converter fixes that. It changes the signal's impedance to what the next device wants. The best-known example is a DI box, which turns a high-impedance instrument signal into a low-impedance balanced output for a mixer. Converters use transformers or active buffers. It prevents the weak, dull sound of a bad mismatch.
- *Editor notes:* Changed the dangling pronoun 'One' to 'It' so the final sentence refers to the converter, matching the rest of the field.

### In-Wall Speaker  *(MUSI190 / Amps & Loudspeakers)*
**`related_terms`**
- Before:
    - Enclosure
    - Cabinet
    - PA Speaker
    - Crossover Network
    - Driver
- After:
    - Enclosure
    - Cabinet
    - PA Speaker
    - Crossover Network
    - Driver
    - Infinite Baffle
    - In-Ceiling Speaker
- *Editor notes:* Added 'Infinite Baffle' (the referenced but unexplained concept) and sibling 'In-Ceiling Speaker'; kept existing items and order.

### Inline Pad  *(MUSI190 / Microphones)*
**`purpose_function`**
- Before:
    It attenuates the signal at the preamp input to prevent input-stage clipping when a mic feeds a very loud source. It exists as an external alternative when a mic lacks its own pad switch or more headroom is needed.
- After:
    It attenuates the signal at the preamp input to prevent input-stage clipping when a mic is picking up a very loud source. It exists as an external alternative when a mic lacks its own pad switch or more headroom is needed.
- *Editor notes:* purpose_function: fixed the reversed logic 'when a mic feeds a very loud source' to 'when a mic is picking up a very loud source'; the mic picks up the source, it does not feed it.

### Large-Diaphragm Microphone (LD Mic)  *(MUSI190 / Microphones)*
**`plain_english`**
- Before:
    A large-diaphragm condenser microphone is the studio standard for vocals. The large diaphragm (roughly 1 inch) picks up sound very sensitively and has a presence peak around 4-5 kHz that helps vocals cut through mixes. Large-diaphragm mics also have proximity effect (bass boost at close range). Most classic studio mics (Neumann U87, AKG C414, Shure KSM9) are large-diaphragm.
- After:
    A large-diaphragm condenser microphone is the studio standard for vocals. The large diaphragm (roughly 1 inch) picks up sound very sensitively and has a presence peak around 4-5 kHz that helps vocals cut through mixes. Large-diaphragm mics also have proximity effect (bass boost at close range). Most classic studio mics (Neumann U87, AKG C414, Sony C800G) are large-diaphragm.
- *Editor notes:* plain_english: replaced 'Shure KSM9' with 'Sony C800G'. Web-verified (shure.com KSM9 spec sheet/user guide): the KSM9 uses dual 3/4-inch (19.8 mm) diaphragms, below the entry's own ~1-inch large-diaphragm threshold, and is a handheld LIVE vocal condenser, not a classic large-diaphragm studio mic. Sony C800G is a genuine large-diaphragm studio condenser; U87 and C414 kept.

### Lavalier Microphone (Lapel Mic / Lav)  *(MUSI190 / Microphones)*
**`plain_english`**
- Before:
    A lavalier - 'lav' or lapel mic - is a tiny mic clipped to the chest, collar, or lapel so the talker's hands stay free. Because it sits close to the mouth, it captures the voice clearly with plenty of level. That closeness also adds a bit of proximity effect, giving the voice extra warmth, while a small foam windscreen keeps breath and wind noise down. The lav usually plugs into a wireless bodypack so the wearer can move freely. These traits make lavaliers a standard pick for theater, broadcast, and on-camera video.
- After:
    A lavalier - 'lav' or lapel mic - is a tiny mic clipped to the chest, collar, or lapel so the talker's hands stay free. Because it sits close to the mouth, it captures the voice clearly with plenty of level while picking up less of the room. Most lavs use an omnidirectional capsule, so they show no proximity effect; only the less common directional (cardioid) lav variants add that bit of low-end warmth up close. A small foam windscreen keeps breath and wind noise down. The lav usually plugs into a wireless bodypack so the wearer can move freely. These traits make lavaliers a standard pick for theater, broadcast, and on-camera video.
- *Editor notes:* plain_english: Removed the incorrect proximity-effect claim. Verified (DPA, Neumann, MyNewMicrophone) that pressure/omnidirectional capsules exhibit NO proximity effect; only pressure-gradient (directional) transducers do. Since most lavs are omni, reframed the benefit as strong level and reduced room pickup, noting only directional/cardioid lav variants show proximity warmth.

### Line Level  *(MUSI190 / Signal Path & Levels)*
**`practical_application`**
- Before:
    Know your equipment's line level standard (+4 dBu professional, -10 dBu consumer); match professional and consumer equipment (may need attenuation); line level requires balanced connections for long cable runs; patch through properly to avoid impedance issues
- After:
    Know your equipment's line level standard (+4 dBu professional, -10 dBV consumer); match professional and consumer equipment (may need attenuation); line level requires balanced connections for long cable runs; patch through properly to avoid impedance issues
- *Editor notes:* practical_application: corrected consumer reference from '-10 dBu' to '-10 dBV' to match the definition and the industry standard. Verified: consumer nominal line level = -10 dBV (0.316 V, ref 1 V); professional = +4 dBu (1.228 V, ref 0.775 V); dBV and dBu are different references.

### Maximum SPL  *(MUSI190 / Microphones)*
**`plain_english`**
- Before:
    Maximum SPL is the loudest sound a device can handle cleanly. Push past this limit and the audio distorts. For example, a mic rated at 130 dB SPL can capture sounds up to that level. Anything louder will clip. Maximum SPL matters when you record loud events like concerts or machinery, or when you pick speakers for high output.
- After:
    Maximum SPL is the loudest sound a device can handle cleanly. For a microphone this is the loudest input it can capture without distorting; for a loudspeaker it is the highest output level it can produce cleanly. Push past this limit and the audio distorts. For example, a mic rated at 130 dB SPL can capture sounds up to that level. Anything louder will clip. Maximum SPL matters when you record loud events like concerts or machinery, or when you pick speakers for high output.
- *Editor notes:* plain_english: Added one clause distinguishing the two senses of the spec (microphone max INPUT vs loudspeaker max OUTPUT) to prevent the beginner conflation flagged, matching the definition's mention of both device types.

### Mic cable  *(MUSI190 / Connectors & I/O Connections)*
**`purpose_function`**
- Before:
    Connect microphones properly, select appropriate cable lengths, maintain cable integrity, troubleshoot cable issues
- After:
    Carries a microphone's low-level balanced signal from the mic to a preamp or interface, using twisted conductors and shielding so interference is rejected and the signal stays clean over long runs.
- *Editor notes:* Rewrote the imperative task list into a descriptive statement of the cable's purpose, matching the field's form.

### Mic Level  *(MUSI190 / Microphones)*
**`definition`**
- Before:
    Signal level from a microphone, typically -60 to -40 dBu. Much quieter than line level (-10 to +4 dBu). Requires preamp to boost to line level.
- After:
    Signal level from a microphone, typically -60 to -40 dBu. Much quieter than line level (-10 dBV consumer to +4 dBu professional). Requires preamp to boost to line level.
- *Editor notes:* definition: Corrected the reference-unit mismatch. Verified (Wikipedia Line level, Audio University) that consumer line level is -10 dBV (0 dBV = 1 V) while professional is +4 dBu (0 dBu = 0.775 V); relabeled the -10 figure as dBV.

### Microphone output transformer  *(MUSI190 / Microphones)*
**`definition`**
- Before:
    A transformer in a microphone that impedance-matches the capsule output to the microphone cable and connected preamp. Shapes frequency response and adds coloration.
- After:
    A transformer in a microphone that transforms the high impedance of the capsule/electronics down to a low, balanced output impedance suited to the cable and to a bridging (higher-impedance) preamp input. Shapes frequency response and adds coloration.
- *Editor notes:* definition: Reworded to remove the mic-to-preamp 'impedance-matching' framing, which contradicts the sibling entry teaching that mic-to-preamp connection is bridging (voltage transfer into a higher-Z input), not impedance matching. Now consistent with the glossary's bridging concept.

### Microphone Polar Patterns Summary  *(MUSI190 / Microphones)*
**`definition`**
- Before:
    Overview of microphone directional pickup patterns: omnidirectional (equal all directions), cardioid (front pickup, rear null), supercardioid and hypercardioid (tighter front pickup with a rear lobe and deep side nulls), and bidirectional/figure-8 (equal front and back, side nulls) — all of which become less directional at low frequencies.
- After:
    Overview of microphone directional pickup patterns: omnidirectional (equal all directions), cardioid (front pickup, rear null), supercardioid and hypercardioid (tighter front pickup with a rear lobe and deep side nulls), and bidirectional/figure-8 (equal front and back, side nulls) — with the directional patterns (cardioid, super/hyper-cardioid, figure-8) becoming less directional at low frequencies.
- *Editor notes:* definition: Qualified the low-frequency clause to the directional patterns only. Verified that omnidirectional (pressure) patterns are non-directional at all frequencies and do not 'become less directional' at low frequencies; only the directional patterns widen toward omni in the bass. Aligns with the practical field.

### Noise Gate  *(MUSI190 / Dynamics Processing)*
**`common_mistakes`**
- Before:
    - Threshold into program material
    - chatter from fast release
    - using a gate where an expander is gentler
- After:
    - Setting the threshold too high so it cuts into the quiet parts of the wanted signal
    - Gate chatter (rapid open/close) when the threshold sits right at the signal level - fix with a longer hold or release time
    - Using a hard gate where a gentler expander would sound more natural
- *Editor notes:* common_mistakes: rewrote the cryptic verbless fragments into clear constructive sentences (reconciling both experts). The garbled 'Threshold into program material' is now the explicit threshold-too-high mistake; 'chatter from fast release' expanded to name gate chatter and its fix; the expander item made a full clause.

### opticalCON  *(MUSI190 / Connectors & I/O Connections)*
**`related_terms`**
- Before:
    - etherCON
    - powerCON
    - Format Converter
    - AES50
    - Locking Connector
- After:
    - etherCON
    - powerCON
    - Format Converter
    - Fiber Optic Cable
    - Locking Connector
- *Editor notes:* Verified: AES50 (SuperMAC) is a copper transport over shielded Cat5e with etherCON up to 100m, not fiber, so it is off-point for a fiber connector. Replaced 'AES50' with 'Fiber Optic Cable'; kept other items and order.

### Pad Switch  *(MUSI190 / Microphones)*
**`related_terms`**
- Before:
    - Inline Pad
    - Roll-Off Switch
    - Polar Pattern Switch
    - Mic Sensitivity
    - Mic Output Impedance
- After:
    - Pad
    - Inline Pad
    - Roll-Off Switch
    - Polar Pattern Switch
    - Mic Sensitivity
    - Mic Output Impedance
- *Editor notes:* related_terms: Added 'Pad' so the two names for the same beginner concept cross-reference each other; kept all existing entries unchanged.

### Phantom-Powered Mic  *(MUSI190 / Microphones)*
**`related_terms`**
- Before:
    - Electret Condenser
    - Microphone Element
    - Mic Output Impedance
    - Polar Pattern Switch
    - Dual-diaphragm capsule
- After:
    - Phantom Power (+48V)
    - Condenser Microphone
    - Ribbon Microphone
    - Electret Condenser
    - Microphone Element
    - Dual-diaphragm capsule
- *Editor notes:* related_terms: Added the core neighbors 'Phantom Power (+48V)', 'Condenser Microphone', and 'Ribbon Microphone' (referenced in every common_mistake), and dropped the two most tangential items (Mic Output Impedance, Polar Pattern Switch) to keep the map focused, as suggested.

### phaser  *(MUSI190 / Reverb & Delay)*
**`category`**
- Before:
    Sound Reinforcement
- After:
    Modulation Effects
- *Editor notes:* Recategorized from the mislabeled 'Sound Reinforcement' to 'Modulation Effects', consistent with sibling effect-type categories in the corpus (e.g. Delay Types, Reverb Types).

### Phoenix  *(MUSI190 / Connectors & I/O Connections)*
**`category`**
- Before:
    Audio Networking
- After:
    Connectors
- *Editor notes:* category: changed 'Audio Networking' to 'Connectors' for consistency with sibling connector entries (phono, Pinout); Phoenix/Euroblock screw-terminals are analog connectors, not network audio (RJ45/etherCON).

### Piezo / Piezo Microphone  *(MUSI190 / Microphones)*
**`definition`**
- Before:
    Microphone using piezoelectric element as transducer converting mechanical vibration directly into electrical signal. Typically used for contact and vibration recording.
- After:
    A microphone that uses a piezoelectric element as its transducer, converting mechanical vibration directly into an electrical signal. It is typically used for contact and vibration recording.
- *Editor notes:* definition: Rewrote the clipped fragment into complete sentences with articles and finite verbs, preserving the original meaning and scope.

### Polarity Inversion  *(MUSI190 / Signal Path & Levels)*
**`related_terms`**
- Before:
    - Balanced Signal
    - Differential Signal
    - Common-Mode Rejection (CMRR)
    - Unbalanced Signal
    - Reference Level
- After:
    - Balanced Signal
    - Differential Signal
    - Phase Cancellation
    - Unbalanced Signal
    - Polarity Switch
- *Editor notes:* related_terms: replaced the two least-relevant level/theory links (Common-Mode Rejection (CMRR), Reference Level) with the central conceptual neighbors the entry actually teaches (Phase Cancellation, Polarity Switch); kept the balanced/unbalanced/differential links relevant to the swapped hot/cold cable case.

### psychoacoustics  *(MUSI190 / Sound & Acoustics)*
**`practical_application`**
- Before:
    Codec design uses psychoacoustic principles; hearing aid design applies psychoacoustic principles; mixing decisions based on psychoacoustic understanding; audio specification considers psychoacoustic factors.
- After:
    Lossy codecs use psychoacoustic masking models to discard inaudible data; hearing-aid designs apply them to fit output to a user's perception; mixing and audio-spec decisions weigh perceived loudness and masking, not just measured levels.
- *Editor notes:* practical_application: made the semicolon-separated items grammatically parallel (each now a subject-verb clause) and trimmed the repeated word 'psychoacoustic', preserving the four original ideas (codecs, hearing aids, mixing, audio spec).

### Quantization Noise  *(MUSI190 / Signal Path & Levels)*
**`related_terms`**
- Before:
    - 0 dBFS
    - Reference Level
    - Headroom
    - Nominal Level
    - Alignment Level
- After:
    - Bit Depth
    - dither
    - quantization
    - Dynamic Range
    - Signal-to-Noise Ratio (SNR)
    - PCM (Pulse-Code Modulation)
- *Editor notes:* related_terms: replaced the mis-assigned level-calibration cluster (0 dBFS, Reference Level, Headroom, Nominal Level, Alignment Level) with the on-topic cluster reconciling both experts' suggestions: Bit Depth, dither, quantization, Dynamic Range, SNR, and PCM.

### Reverberation / Reverb  *(MUSI190 / Mixers & Recorders)*
**`plain_english`**
- Before:
    Reverb simulates what happens in a room—your voice bounces around creating layers of echoes that eventually fade. Digital reverbs use mathematical algorithms to create this effect. Reverb provides sense of space and size. Short reverb = small room; long reverb = large space.
- After:
    Reverb simulates what happens in a room—your voice bounces around creating layers of echoes that eventually fade. Digital reverbs use mathematical algorithms to create this effect. Reverb provides a sense of space and size. Short reverb = small room; long reverb = large space.
- *Editor notes:* plain_english: added the missing article - 'Reverb provides a sense of space and size' (Language/Communications). No other text changed.

### RG-59 Cable  *(MUSI190 / Connectors & I/O Connections)*
**`category`**
- Before:
    Digital Cable
- After:
    Coaxial Cable
- *Editor notes:* category: changed 'Digital Cable' to 'Coaxial Cable'; RG-59 is a 75-ohm coax used for analog/composite SD video, so 'Digital Cable' contradicted the term's own definition. 'Coaxial Cable' is already present in related_terms as the appropriate coax bucket.

### Routing Matrix  *(MUSI190 / Mixers & Recorders)*
**`related_terms`**
- Before:
    - Bus Assignment
    - Direct Output
    - Aux Mix
    - Master Fader
    - Digital Console
- After:
    - Bus Assignment
    - Direct Output
    - Aux Mix
    - Master Fader
    - Digital Console
    - router (audio matrix switcher)
- *Editor notes:* Added 'router (audio matrix switcher)' so the learner can connect the console-section matrix to the standalone-device form of the same crosspoint concept; other items unchanged.

### RT60  *(MUSI190 / Sound & Acoustics)*
**`related_terms`**
- Before:
    - Reverberation time (RT60)
    - T20
    - T30
    - EDT
    - Sabin
    - Reverberant field
- After:
    - Sabine equation
    - T20
    - T30
    - EDT
    - Sabin
    - Reverberant field
- *Editor notes:* related_terms: removed the self-referential headword 'Reverberation time (RT60)' (RT60 is this entry) and replaced it with 'Sabine equation', a genuinely distinct neighbor; verified the Sabine equation predicts RT60 from room volume, surface area, and average absorption coefficient, so it is a valid non-circular cross-link. Kept 'Sabin' (the absorption unit) as it is a different concept from the Sabine equation.

### Scribble Strip  *(MUSI190 / Mixers & Recorders)*
**`definition`**
- Before:
    Per-channel display on digital desks showing names and colors above each fader.
- After:
    The per-channel labeling area beside each fader that identifies the channel by name and color - a marker-and-tape strip on analog consoles and an electronic (LCD) strip on digital consoles that recalls with the show file.
- *Editor notes:* Broadened the definition so it is no longer digital-only, removing the internal inconsistency with the entry's analog references; the scribble strip originates as the analog tape/marker label strip.

### sensitivity (dB SPL/mW) / Loudspeaker sensitivity (dB SPL/1W/1m)  *(MUSI190 / Amps & Loudspeakers)*
**`definition`**
- Before:
    A loudspeaker's efficiency rating, stated as the SPL produced at 1 meter for 1 watt input (dB SPL/1W/1m). Higher sensitivity means more level for the same power.
- After:
    A loudspeaker's efficiency rating, stated as the SPL produced at 1 meter for 1 watt input (dB SPL/1W/1m). Higher sensitivity means more level for the same power. For headphones and in-ear monitors, sensitivity is instead stated as the SPL produced for 1 mW of input (dB SPL/mW), reflecting how loud they play for a given drive level - distinct from the loudspeaker dB SPL/1W/1m figure.
- *Editor notes:* Added the dB SPL/mW sense to cover the second half of the disambiguated title. Verified: headphone/IEM sensitivity is referenced to 1 mW of input (dB SPL/mW), whereas loudspeaker sensitivity is referenced to 1 W at 1 m.

### Shielding  *(MUSI190 / Connectors & I/O Connections)*
**`plain_english`**
- Before:
    Shielding wraps the signal wires in a grounded conductive layer. Hum and radio noise hit the shield instead of the audio. But the shield only does its job when it's tied to ground the right way: if shield current is allowed onto the signal ground (the "pin 1 problem"), it can add hum instead of stopping it. Good coverage and correct grounding keep cables quiet.
- After:
    Shielding wraps the signal wires in a grounded conductive layer. Hum and radio noise hit the shield instead of the audio. But the shield only does its job when it's tied to ground the right way - for audio cables that usually means grounding the shield at one end only, so shield current has a drain path without forming a ground loop. And if shield current is allowed onto the signal ground (the "pin 1 problem"), it can add hum instead of stopping it. Good coverage and correct grounding keep cables quiet.
- *Editor notes:* plain_english: stated the missing actionable rule the field only implied - for audio cables, ground the shield at one end only. Verified as standard single-point-grounding best practice (Rane Note 151; single-end termination prevents shield ground-loop currents at audio frequencies). This reconciles the definition's 'must connect to ground' with the both-ends-grounded common mistake.

### Shotgun microphone  *(MUSI190 / Microphones)*
**`practical_application`**
- Before:
    Film production uses shotgun mics for dialogue; video news uses shotgun mics for reporter stand-ups; broadcast uses shotgun mics for news gathering; wildlife recording uses shotgun mics.
- After:
    Shotgun mics are used for film-set dialogue, on-location reporter stand-ups, electronic news gathering, and wildlife recording.
- *Editor notes:* practical_application: rewrote the repetitive four-clause 'uses shotgun mics' list into single prose stating the applications once (Language/Communications).

### side-chain  *(MUSI190 / Dynamics Processing)*
**`related_terms`**
- Before:
    - Ducker
    - Compression / Compressor
    - Leveler
    - Threshold
    - Mix bus
- After:
    - Ducker
    - Compression / Compressor
    - Leveler
    - Threshold
    - Mix bus
    - Sidechain Filter
- *Editor notes:* related_terms: appended 'Sidechain Filter' so the intermediate concept links to its advanced companion; existing items preserved in order.

### Sound Localization  *(MUSI190 / Sound & Acoustics)*
**`purpose_function`**
- Before:
    It lets listeners place sources in space using two-ear timing and level differences plus spectral cues from the outer-ear (pinna) shape, which is the basis of stereo and surround imaging as well as everyday situational awareness.
- After:
    It lets listeners place sources in space: direction is fixed by two-ear timing and level differences plus spectral cues from the outer-ear (pinna) shape, while distance is judged mainly from overall loudness, high-frequency rolloff, and the direct-to-reverberant (early-to-reflected) energy ratio. Together these are the basis of stereo and surround imaging as well as everyday situational awareness.
- *Editor notes:* purpose_function: added a distance clause so the direction-AND-distance promise in definition/plain_english is fulfilled; verified that auditory distance is judged chiefly from loudness/intensity, high-frequency attenuation (air absorption), and the direct-to-reverberant energy ratio, distinct from the ITD/ILD/spectral cues that fix direction.

### Sound Power  *(MUSI190 / Sound & Acoustics)*
**`purpose_function`**
- Before:
    Sound power characterizes a source's intrinsic acoustic output, providing a basis to compare and rate sources independent of room and distance. It is the fundamental quantity from which pressure and intensity at any location can be related.
- After:
    Sound power characterizes a source's intrinsic acoustic output, providing a basis to compare and rate sources independent of room and distance. It is the fundamental quantity to which pressure and intensity at any location can be related.
- *Editor notes:* purpose_function: fixed the non-idiomatic preposition 'from which ... can be related' to 'to which ... can be related' (one relates quantities TO something); no factual content changed.

### Stand adapter  *(MUSI190 / Microphones)*
**`related_terms`**
- Before:
    - Shock mount
    - XLR Connector
    - Microphone Polar Patterns Summary
    - Connectors
    - Mic stand error
- After:
    - Shock mount
    - XLR Connector
    - Mic Clip
    - Connectors
    - Mic stand error
- *Editor notes:* related_terms: removed off-topic 'Microphone Polar Patterns Summary' and replaced with 'Mic Clip', a mechanically relevant anchor satisfying both experts (Audio Technical + Learning/Cognition).

### Supercardioid  *(MUSI190 / Microphones)*
**`purpose_function`**
- Before:
    Microphone pattern narrower than cardioid with slight rear rejection. Extreme forward directivity.
- After:
    Microphone pattern narrower than cardioid, with its deepest rejection at the sides (nulls ~125 degrees off-axis) and a small but LIVE rear pickup lobe - so it is not rejecting straight behind. Extreme forward directivity.
- *Editor notes:* purpose_function: reworded 'slight rear rejection' to reflect the live rear lobe and side nulls, making it consistent with the definition, plain_english, practical_application and common_mistakes. Verified: supercardioid nulls at ~125-127 degrees with a live rear lobe (mynewmicrophone / Shure).

### Touring Cable  *(MUSI190 / Connectors & I/O Connections)*
**`definition`**
- Before:
    Touring cable is heavy-duty cable engineered for the extreme flexing, abrasion, and environmental stress of touring, with reinforced jackets, robust strain relief, and high-reliability connectors. It prioritizes durability and serviceability over many repeated cycles.
- After:
    Touring cable is heavy-duty cable engineered for the extreme flexing, abrasion, and environmental stress of touring, with reinforced jackets, robust strain relief, and high-reliability connectors. It prioritizes durability and serviceability across many repeated setup-and-teardown cycles.
- *Editor notes:* definition: reworded the ambiguous 'over many repeated cycles' to 'across many repeated setup-and-teardown cycles' to remove the misreadable 'prioritize A over B' idiom collision; meaning and length preserved.

### TT/Bantam (Tiny Telephone)  *(MUSI190 / Connectors & I/O Connections)*
**`practical_application`**
- Before:
    Use TT patch cords on a Bantam bay to route signals in a mastering or broadcast rack; keep spares since thin cords wear faster. Wire it balanced (tip/ring/sleeve), not as a mono TS idea.
- After:
    Use TT patch cords on a Bantam bay to route signals in a mastering or broadcast rack; keep spares since thin cords wear faster. Wire it balanced (tip/ring/sleeve), not as if it were a mono TS connection.
- *Editor notes:* practical_application: replaced the awkward 'not as a mono TS idea' with 'not as if it were a mono TS connection' for precision; no other content changed.

### Tube impedance converter  *(MUSI190 / Microphones)*
**`practical_application`**
- Before:
    Understanding the tube stage in a condenser mic as an impedance converter (buffer) that lets the capsule's tiny high-impedance signal drive a cable - not a gain stage - so you service and troubleshoot it correctly.
- After:
    Understanding the tube stage in a condenser mic as the impedance converter that lets the capsule's tiny high-impedance signal drive a cable; note that in many classic tube condensers (e.g., U47, U67) the same tube stage also provides voltage gain, whereas the FET stage in solid-state condensers is typically a unity-gain source-follower - so you service and troubleshoot it correctly.
- *Editor notes:* practical_application: removed the absolute 'not a gain stage' claim and qualified it - the tube always converts the capsule's high impedance, but in classic tube condensers (U47/U67) the tube stage also provides voltage gain; the FET stage in solid-state condensers is the unity-gain source-follower. Verified via the Neumann U47 FET manual (recordinghacks), which labels the FET stage 'impedance converter (not a gain stage).'

### Variable acoustics  *(MUSI190 / Sound & Acoustics)*
**`related_terms`**
- Before:
    - Acoustic Treatment
    - Reverberation time (RT60)
    - Absorption
    - Diffraction
    - Room mode
- After:
    - Acoustic Treatment
    - Reverberation time (RT60)
    - Absorption
    - Diffusion
    - Room mode
- *Editor notes:* related_terms: replaced 'Diffraction' with 'Diffusion' to match the mechanism named in the entry's own definition/purpose_function; verified diffusion is the scattering/redistribution of reflections (the correct counterpart to Absorption), whereas diffraction is the bending of waves around edges and is not the mechanism variable-acoustics elements use.

### Yoke mount  *(MUSI190 / Microphones)*
**`related_terms`**
- Before:
    - Shock mount
    - Stand adapter
    - Body
    - Microphone Grille
- After:
    - Shock mount
    - Stand adapter
    - Microphone Stand
    - Microphone Grille
- *Editor notes:* related_terms: replaced the vague 'Body' with the clearer on-topic anchor 'Microphone Stand' (Learning/Cognition).
