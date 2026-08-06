# AP&E Glossary — Independent 3-Expert Committee Review
*Report date: 2026-07-10 · Scope: the 164 just-uploaded MUSI 190 + AUDI 201 terms (edited fields only)*

## Committee
A fresh, independent panel — separate from the authoring team and from the prior committee that approved the older terms. Each expert reviewed only the newly-edited fields (plain-English, purpose/function, practical application, category, related terms, common mistakes, scenario contexts; definitions were reviewed only where newly authored).

- **Audio Technical Expert** — factual/technical accuracy, standards, and safety correctness (web-verified where in doubt).
- **Learning / Cognition Expert** — difficulty fit, cognitive load, scaffolding, misconception handling, retention.
- **Language / Communications Expert** — clarity, grammar, concision, consistency, plain-language quality.

## Executive summary

- **164** terms reviewed · **112 passed clean (no changes suggested)** · **52 received at least one suggestion**.
- **77 suggestions total** — **1 High**, **26 Medium**, **50 Low**.
- Suggestions by lens: Audio Technical 23 · Learning/Cognition 23 · Language/Communications 31.
- **17 terms** were flagged by two or more experts (higher-confidence signals).

**Nothing in the database was changed by this review. These are recommendations for your approval.** The one High-severity item is a factual correction and is the committee's top priority.

## ⚠️ High-priority correction (factual)

**Dipole Antenna** — AUDI201 / RF Wireless Systems (intermediate) · field: `common_mistakes`  
- *Issue (Audio Technical):* Factual error. The third mistake states 'a half-wave dipole is about 2.15 dB below isotropic reference.' This is reversed: a half-wave dipole has ~2.15 dBi of gain, i.e. it is 2.15 dB ABOVE isotropic (the relationship is dBi = dBd + 2.15). Stating it as 'below isotropic' teaches the dBi/dBd relationship backwards, the exact confusion this bullet is meant to warn against.  
- *Suggested fix:* Correct to: 'Confusing dBi and dBd references, since a half-wave dipole has about 2.15 dB of gain relative to isotropic (2.15 dBi = 0 dBd).'

---

## Per-term suggestions
*Ordered by severity. Terms not listed here passed the committee with no changes suggested.*

### High

#### Dipole Antenna
*AUDI201 / RF Wireless Systems · intermediate · flagged by 1 expert(s)*

- **[High] Audio Technical — `common_mistakes`:** Factual error. The third mistake states 'a half-wave dipole is about 2.15 dB below isotropic reference.' This is reversed: a half-wave dipole has ~2.15 dBi of gain, i.e. it is 2.15 dB ABOVE isotropic (the relationship is dBi = dBd + 2.15). Stating it as 'below isotropic' teaches the dBi/dBd relationship backwards, the exact confusion this bullet is meant to warn against.  
  → *Suggestion:* Correct to: 'Confusing dBi and dBd references, since a half-wave dipole has about 2.15 dB of gain relative to isotropic (2.15 dBi = 0 dBd).'

### Medium (top severity for the term)

#### Digital Wireless System
*AUDI201 / RF Wireless Systems · beginner · flagged by 3 expert(s)*

- **[Medium] Learning/Cognition — `related_terms`:** The related_terms list includes the term itself, 'Digital Wireless System'. A self-referencing entry adds nothing to the learner's knowledge map and reads as an error, undermining trust in the cross-links.  
  → *Suggestion:* Replace the self-reference with a genuinely adjacent concept that aids contrast/transfer, e.g. 'Analog Wireless System' (to reinforce the compander comparison the definition draws) or 'In-Ear Monitor (IEM)' (the latency-sensitive use case already named in the fields).
- **[Medium] Language/Communications — `related_terms`:** The related_terms list includes "Digital Wireless System" itself — a self-reference, which is a clear editing error and clutters the cross-reference list.  
  → *Suggestion:* Remove the self-referential "Digital Wireless System" entry; the remaining terms (Companding, Latency, Frequency Coordination, RF Interference) are the correct set. Consider adding "Analog Wireless System" if one exists, since the definition contrasts against analog FM.
- **[Low] Audio Technical — `related_terms`:** related_terms includes 'Digital Wireless System' — the term links to itself, which is a data error and provides no navigational value.  
  → *Suggestion:* Remove the self-reference and replace it with a relevant term such as 'Analog Wireless System', 'Encryption', or 'Antenna Distribution'.

#### Subsonic Filter
*AUDI201 / Vehicle Audio · advanced · flagged by 3 expert(s)*

- **[Medium] Audio Technical — `practical_application`:** The stated numbers are internally inconsistent. A half-octave below 30 Hz is 30/1.414 = ~21 Hz, and '80%' of 30 Hz is 24 Hz, but the worked example gives 25-28 Hz (roughly 83-93% of tuning). 'Half-octave (about 80%)' contradicts both the arithmetic and the example. In real practice the subsonic filter is usually set at or a few Hz below port tuning (which is what 25-28 Hz for a 30 Hz box represents), not a full half-octave down.  
  → *Suggestion:* Drop the 'half-octave (about 80%)' characterization and describe it as setting the subsonic filter at or slightly below (a few Hz under) the enclosure tuning frequency, e.g., 'near 25-28 Hz for a box tuned to 30 Hz,' so the descriptor matches the example.
- **[Medium] Learning/Cognition — `practical_application`:** The setting guidance gives three cues that do not agree, creating a learning trap: 'half-octave' below 30 Hz is roughly 21 Hz, '(about 80%)' of 30 Hz is 24 Hz, yet the worked example lands at 25-28 Hz (only ~7-17% below). A learner who applies the stated 'half-octave' rule will compute a number well below the example and conclude they did it wrong.  
  → *Suggestion:* Make the rule of thumb and the example consistent. Either pick one framing (e.g., 'set it 10-20% below tuning — near 25-28 Hz for a 30 Hz box') and drop the conflicting 'half-octave'/'80%' cues, or fix the example so it matches whichever rule is intended.
- **[Low] Language/Communications — `practical_application`:** The phrase 'roughly a half-octave (about 80%) below the enclosure tuning frequency' gives the learner two different, non-matching characterizations of the same offset (a half-octave down is closer to 71 percent of the tuning frequency, not 80 percent). The mixed framing is confusing regardless of which figure is intended. Flagging as a clarity/consistency note; the technical reviewer should confirm the intended number.  
  → *Suggestion:* Pick one characterization and drop the other, e.g. 'somewhat below the enclosure tuning frequency — for example, near 25–28 Hz for a box tuned to 30 Hz', or keep a single consistent fraction/octave figure.

#### Closed Captioning
*AUDI201 / Assisted Listening Systems · beginner · flagged by 2 expert(s)*

- **[Medium] Language/Communications — `common_mistakes`:** The fourth item is ungrammatical: 'Neglecting synchronization and accuracy, which FCC quality rules require captions to be accurate, synchronous, complete, and properly placed.' The relative clause 'which... require captions to be' does not connect to the preceding phrase, producing a run-on/dangling construction.  
  → *Suggestion:* Rewrite as two clean clauses, e.g. 'Neglecting synchronization and accuracy — FCC quality rules require captions to be accurate, synchronous, complete, and properly placed.'
- **[Low] Learning/Cognition — `practical_application`:** The acronym 'CART' is introduced in practical_application and reused in scenario_contexts with no expansion. For a beginner-tagged term this is an unglossed acronym doing real work (it names the live-captioning workflow), which forces the learner to either guess or look it up mid-explanation.  
  → *Suggestion:* Expand on first use: 'a CART (Communication Access Realtime Translation) feed'. Small change that removes the comprehension gap without adding load.
- **[Low] Learning/Cognition — `common_mistakes`:** Depth is uneven for a 'beginner' tag: the plain_english is well-pitched, but common_mistakes and purpose_function lean on FCC quality rules and ADA assembly-area obligations without framing them, so the term jumps from beginner to regulatory detail. The fourth bullet is also garbled ('...synchronization and accuracy, which FCC quality rules require captions to be...'), which hurts readability of an already dense point.  
  → *Suggestion:* Repair the fourth bullet to a clean sentence, e.g. 'Neglecting synchronization and accuracy - FCC quality rules require captions to be accurate, synchronous, complete, and properly placed.' Consider a five-word lead-in that frames why the ADA/FCC references appear, so a beginner sees them as 'rules that govern this' rather than unexplained jargon.

#### Load-In
*AUDI201 / Analog Live Sound · beginner · flagged by 2 expert(s)*

- **[Medium] Language/Communications — `scenario_contexts`:** Subject-verb agreement error: 'A festival stagger the load-in of multiple acts...' should be singular 'staggers'.  
  → *Suggestion:* Change to 'A festival staggers the load-in of multiple acts to share limited dock and stage access.'
- **[Low] Learning/Cognition — `common_mistakes`:** The phrase 'the advanced load-in schedule' risks conflating two ideas for a beginner: 'advance' is itself a sibling glossary term (Production Advance), and 'advanced' reads as a difficulty/complexity descriptor rather than 'provided ahead of time.' Small wording, but it muddies the connection to the related term the map is trying to build.  
  → *Suggestion:* Reword to 'Ignoring the load-in schedule and access details confirmed during the advance (dock, door sizes, union/house rules)...' so the tie to Production Advance is explicit and the beginner isn't left parsing 'advanced.'
- **[Low] Language/Communications — `common_mistakes`:** 'Ignoring the advanced load-in schedule and access details' uses 'advanced' where the intended meaning is the schedule agreed during the production advance. 'Advanced' reads as 'high-level/complex' and is ambiguous, and it is inconsistent with the noun 'advance' used elsewhere in this group.  
  → *Suggestion:* Reword to 'Ignoring the advance (pre-agreed) load-in schedule and access details (dock, door sizes, union/house rules), causing delays.'

#### Portable Generator (Genset)
*MUSI190 / Grounding & Electrical · intermediate · ⚠ safety-critical topic · flagged by 2 expert(s)*

- **[Medium] Learning/Cognition — `common_mistakes`:** The neutral-bonding bullet is a single run-on sentence that packs two distinct configurations (cord-and-plug neutral-bonded-to-frame vs. separately derived system feeding a distro/transfer) plus two code citations into one clause. For an intermediate learner this is the hardest idea in the entry and the compression makes it hard to parse and retain; the reader has to hold both cases and the code refs at once.  
  → *Suggestion:* Split into two short sentences that name each case first, then the consequence, e.g.: 'The right neutral bonding depends on how the genset is used. Feeding cord-and-plug tools, it is typically neutral-bonded to its frame. Feeding a distro or transfer switch as a separately derived system, the bonding/grounding must follow NEC 250.34/250.30 so GFCIs and breakers still trip.' Same content, lower cognitive load.
- **[Low] Language/Communications — `practical_application`:** The trailing clause 'keep it outdoors clear of intakes with refueling done only when off and cool' reads as a dangling modifier and jams two distinct rules together.  
  → *Suggestion:* Rewrite as: '...keep it outdoors and clear of air intakes, and refuel only when it is off and cool.'
- **[Low] Language/Communications — `common_mistakes`:** The third bullet ('Getting the neutral bonding wrong; ...') is a long, comma-spliced run-on that packs three ideas into one sentence, making it hard to parse for a learner.  
  → *Suggestion:* Split into two sentences, e.g.: 'Getting the neutral bonding wrong. A portable genset feeding cord-and-plug loads is typically neutral-bonded to its frame; but when it acts as a separately derived system feeding a distro or transfer switch, bonding and grounding must follow NEC 250.34/250.30 so GFCIs and breakers work.'

#### Cramped EQ (Frequency Cramping)
*MUSI190 / Equalization (EQ) · advanced · flagged by 2 expert(s)*

- **[Medium] Audio Technical — `common_mistakes`:** The bullet 'Assuming oversampling also fixes the phase warping, when it primarily corrects the magnitude response' is technically backwards. Oversampling raises the internal Nyquist far above the audio band, so within the audio band it reduces BOTH magnitude and phase cramping toward the analog prototype. The 'corrects magnitude but not phase' behavior actually describes analog-matched/decramped (e.g., Orfanidis-corrected) minimum-phase designs, not oversampling.  
  → *Suggestion:* Either move this caveat to describe analog-matched filters ('analog-matched EQs may correct the magnitude curve while their phase still differs from the analog original'), or replace with an accurate oversampling note ('oversampling reduces both magnitude and phase cramping in the audio band but costs CPU'). The plain_english claim that a bell is forced toward unity gain at Nyquist is fine (bilinear maps analog f->inf, where a bell is 0 dB, onto Nyquist).
- **[Low] Language/Communications — `plain_english`:** Single long, comma-spliced sentence chaining 'because...so...' is hard to follow; also 'get squashed and harsher-sounding' mixes a passive verb with an adjective (non-parallel).  
  → *Suggestion:* Split and parallelize, e.g. 'In some digital EQs, boosts near the top of the audible range get squashed and sound harsher. This happens because the math forces the curve to unity gain at the sampling limit, so the bell can no longer stay symmetrical.'

#### High-Level Input
*AUDI201 / Vehicle Audio · intermediate · flagged by 2 expert(s)*

- **[Medium] Audio Technical — `common_mistakes`:** The bullet 'Leaving factory speakers connected in parallel on the same tapped wires ... causing turn-on or load issues' is technically muddled and largely inverted. High-level inputs are high-impedance and do not load the tapped signal, so leaving factory speakers connected in parallel is normal practice and is often required (some factory head units and signal-sense circuits actually need the speaker load present). Framing it as a mistake caused by the amp expecting a 'bridged/high-impedance sense signal' misleads the student.  
  → *Suggestion:* Remove this bullet or reframe it accurately, e.g., 'Some factory head units require the original speaker load to remain connected to function correctly or to sustain signal-sense turn-on; disconnecting the factory speakers when tapping high-level inputs can cause the source or amp not to behave as expected.'
- **[Medium] Learning/Cognition — `common_mistakes`:** The fourth mistake ('Leaving factory speakers connected in parallel... when the amp expects a bridged/high-impedance sense signal') collapses two distinct ideas (bridging vs. a high-impedance sense signal) into one clause. At the intermediate level a learner cannot tell what the actual misconception or the correct behavior is, so the item does not correct a graspable error.  
  → *Suggestion:* Split or reword to name one clear misconception, e.g.: 'Assuming you must disconnect the factory speakers when tapping their wires for a high-level input. In most designs the amp's high-level input is high-impedance and simply senses the signal, so the factory speakers can stay connected; forcing the wrong wiring can cause load or turn-on problems.' Keep bridging out of it unless a full sentence explains why it matters.

#### Network Streamer
*AUDI201 / Consumer Audio Systems · intermediate · flagged by 2 expert(s)*

- **[Medium] Learning/Cognition — `related_terms`:** 'Bass Shaker (Tactile Transducer)' sits oddly in this list. A learner building a mental map of network streaming has no conceptual bridge from a networked source component to a seat-mounted vibration device; it dilutes an otherwise coherent cluster (DAC, MQA, Amplifier, NAS) and can send the novice down an unrelated branch.  
  → *Suggestion:* Replace Bass Shaker with a term that reinforces the streaming knowledge map, e.g. 'Streaming Service', 'AirPlay/UPnP', or 'Roon' -- and consider dropping the reciprocal Network Streamer link from the Bass Shaker term for the same reason.
- **[Low] Audio Technical — `related_terms`:** 'Bass Shaker (Tactile Transducer)' is not technically related to a network streamer and reads as a reciprocal stray cross-link. The other four (DAC, MQA, Amplifier, NAS) are apt.  
  → *Suggestion:* Replace 'Bass Shaker (Tactile Transducer)' with a relevant term such as 'Roon', 'UPnP/DLNA', 'AirPlay', or 'Streaming Service'.

#### Splay Angle
*AUDI201 / Loudspeaker System Deployment · intermediate · ⚠ safety-critical topic · flagged by 2 expert(s)*

- **[Medium] Audio Technical — `common_mistakes`:** The first mistake attributes too-wide top splay to 'low-frequency phase/comb issues.' This mis-states the mechanism: low frequencies couple across the array almost regardless of splay (LF coupling is generally desirable), and comb filtering is predominantly a high-frequency overlap phenomenon, not an LF one. The genuinely correct consequence of over-wide top splay is loss of high-frequency coupling/long-throw energy and potential coverage gaps to the far rows.  
  → *Suggestion:* Reword to drop the 'low-frequency phase/comb' claim, e.g. 'Using splay angles too wide near the top of the array, which reduces high-frequency coupling and long-throw energy and can leave coverage gaps in the back rows.' Keep the top-tight/bottom-wide guidance intact.
- **[Low] Language/Communications — `plain_english`:** British spelling "neighbouring" is inconsistent with American spelling used elsewhere across these entries (e.g., "localize", "center", "neighboring boxes" concept).  
  → *Suggestion:* Change "neighbouring" to "neighboring" for spelling consistency.

#### USB-B
*MUSI190 / Connectors & I/O Connections · beginner · flagged by 2 expert(s)*

- **[Medium] Audio Technical — `common_mistakes`:** The bullet 'Assuming USB-B is upstream/host-capable; it is the device-side port' misuses USB terminology and contradicts purpose_function, which correctly calls USB-B the 'upstream (device-side) port.' In the USB spec the Type-B connector mates to the Upstream-Facing Port (UFP) on a peripheral, so USB-B IS the upstream port. The real misconception being targeted is that USB-B is a host/downstream port.  
  → *Suggestion:* Reword to 'Assuming USB-B is a host or downstream port; it is the upstream (device-side) port and always connects toward a host such as USB-A or USB-C.' Remove 'upstream' from the list of mistaken assumptions.
- **[Medium] Learning/Cognition — `common_mistakes`:** purpose_function uses 'upstream' to mean the device side ('serves as the upstream (device-side) port'), but common_mistakes #2 pairs 'upstream' with 'host-capable' as the WRONG assumption ('Assuming USB-B is upstream/host-capable; it is the device-side port'). Within one beginner term, 'upstream' is used to mean device-side in one field and host-side in another. A beginner will come away unsure what 'upstream' actually points to, and may learn the wrong association.  
  → *Suggestion:* Drop the ambiguous 'upstream' from the mistake and state the misconception plainly, e.g. 'Thinking USB-B is the computer/host end; it is actually the device end and plugs into the peripheral, while the flat USB-A or USB-C end goes to the host.' Reserve the term 'upstream' for one consistent meaning (or define it once) so the two fields agree.

#### Wi-Fi Assistive Streaming
*AUDI201 / Assisted Listening Systems · intermediate · flagged by 2 expert(s)*

- **[Medium] Language/Communications — `common_mistakes`:** Item 3 is ungrammatical: 'Ignoring latency, which excessive lag breaks lip-sync between the streamed audio and the live/stage source.' The clause 'which excessive lag breaks lip-sync' is garbled and does not parse.  
  → *Suggestion:* Split into two clauses, e.g. 'Ignoring latency; excessive lag breaks lip-sync between the streamed audio and the live or stage source.'
- **[Low] Learning/Cognition — `common_mistakes`:** The latency bullet is a garbled sentence ('Ignoring latency, which excessive lag breaks lip-sync between the streamed audio and the live/stage source'). The broken syntax forces the learner to re-parse it, adding needless cognitive friction on an otherwise clear list.  
  → *Suggestion:* Rewrite as a clean cause-effect sentence, e.g. 'Ignoring latency: excessive lag breaks lip-sync between the streamed audio and the live source on stage, so listeners hear words out of step with what they see.'

#### Yagi Antenna
*AUDI201 / RF Wireless Systems · advanced · flagged by 2 expert(s)*

- **[Medium] Audio Technical — `common_mistakes`:** Unit-conversion error. The third mistake reads 'the recommended minimum distance (about 50 feet / roughly 3 meters minimum).' 50 feet is approximately 15 meters, not 3 meters. The 50 ft figure itself matches Shure's guidance for directional/unidirectional receive antennas, so the number is fine but the metric conversion is wrong by ~5x, which will mislead a student working in metric.  
  → *Suggestion:* Fix the conversion to 'about 50 feet / roughly 15 meters.' (If the intent was the general ~10 ft omni-antenna spacing, change to 'about 10 feet / 3 meters' instead — but the 50 ft directional-antenna figure is the correct one to keep here.)
- **[Medium] Language/Communications — `common_mistakes`:** Internal unit-conversion inconsistency: "(about 50 feet / roughly 3 meters minimum)" — 50 feet is roughly 15 meters, not 3 meters, so the two figures contradict each other. As written it will confuse students on the recommended minimum distance. (Flag for technical reviewer to confirm the intended value.)  
  → *Suggestion:* Make the two units agree — e.g., "(about 10 feet / roughly 3 meters minimum)" or "(about 50 feet / roughly 15 meters minimum)", whichever distance is technically correct.

#### Shackle
*AUDI201 / Loudspeaker System Deployment · beginner · ⚠ safety-critical topic · flagged by 1 expert(s)*

- **[Medium] Learning/Cognition — `common_mistakes`:** This is tagged a BEGINNER term, but the third common mistake uses 'mousing it' with no gloss. A beginner reading 'without mousing it or using a bolt-type (safety) shackle' will hit an unexplained term and lose the point of the mistake (which is exactly the safety takeaway they most need to retain).  
  → *Suggestion:* Briefly define the term inline, e.g. '...without mousing it (securing the screw pin with wire or a zip tie so vibration cannot back it out) or using a bolt-type (safety) shackle.'
- **[Low] Learning/Cognition — `practical_application`:** For a beginner term, the acronym 'WLL' is used ('reads the WLL stamped on the bow') before it is spelled out anywhere in the edited fields, adding a small comprehension gap on a safety-critical number.  
  → *Suggestion:* Spell it out on first use: 'reads the Working Load Limit (WLL) stamped on the bow.'

#### Class H
*AUDI201 / Amplifiers · advanced · flagged by 1 expert(s)*

- **[Medium] Audio Technical — `common_mistakes`:** The mistake 'Assuming Class H needs an SMPS; rail tracking can also be done with a multi-tap linear supply' is internally inconsistent with this entry's own definition. The entry defines Class H as CONTINUOUS rail modulation/tracking, but a multi-tap (tapped-transformer) supply produces DISCRETE stepped rails — which by this glossary's own convention is Class G, not continuous Class H tracking. As written it risks conflating the two topologies the entry is trying to distinguish. (Note the real-world terminology split: many pro-audio makers label stepped multi-rail amps 'Class H', but that contradicts the continuous-tracking definition used here.)  
  → *Suggestion:* Reword to: 'Assuming Class H must use an SMPS — the rail-modulator/tracking supply can be fed from a linear supply too; the defining feature is that the rail is varied continuously, not the supply type.' Drop the 'multi-tap' phrasing, since tap switching yields discrete steps (Class G in this glossary's usage) rather than continuous tracking.

#### Expansion Card
*AUDI201 / Digital Live Sound · beginner · flagged by 1 expert(s)*

- **[Medium] Language/Communications — `common_mistakes`:** Subject-verb agreement error in the first item: the parenthetical 'a DiGiCo DMI card versus a Yamaha mini-YGDAI card are not interchangeable' pairs singular subjects joined by 'versus' with the plural verb 'are', and 'versus' reads awkwardly in a statement of fact.  
  → *Suggestion:* Reword to: '(for example, a DiGiCo DMI card and a Yamaha mini-YGDAI card are not interchangeable)'.

#### Exponential Sine Sweep
*AUDI201 / Audio Measurement & Optimization · advanced · flagged by 1 expert(s)*

- **[Medium] Audio Technical — `practical_application`:** Lists Smaart alongside REW and ARTA as a tool where the sweep is 'the default stimulus' for capturing an IR and 'in the same pass, reading off the harmonic distortion.' Smaart is a dual-channel FFT transfer-function analyzer whose hallmark/default workflow is real-time measurement with broadband (pink) noise or program material; it is signal-independent and does not perform Farina-style ESS deconvolution that separates harmonic distortion products into negative time. REW and ARTA do provide that ESS distortion analysis; Smaart does not.  
  → *Suggestion:* Drop Smaart from this specific claim (or move it to a general note that Smaart also supports sweeps for IR). Keep REW and ARTA as the examples of tools that use log-sweep deconvolution to read off harmonic distortion in the same capture; optionally add Room EQ Wizard-class tools rather than a real-time TF analyzer.

#### Feed-Forward Detection
*MUSI190 / Dynamics Processing · advanced · flagged by 1 expert(s)*

- **[Medium] Audio Technical — `practical_application`:** The SSL bus compressor is used as the canonical feed-forward example (also in scenario_contexts: 'Comparing an SSL-style bus compressor against a vintage feedback design'). The classic SSL 4000 G bus compressor is widely documented as a feedback/hybrid VCA design (sidechain derived after the gain VCA), not a clean feed-forward topology; SSL's own THE BUS+ is described as feedback with a switch to relocate the detector. Presenting SSL as THE feed-forward archetype is misleading given the definition (detector reads the uncompressed input).  
  → *Suggestion:* Use an unambiguous feed-forward example instead, e.g. the dbx 160 series, or an API 2500 switched to feed-forward ('New'), or simply 'a modern VCA compressor.' If SSL is kept, flag it as a hybrid/feedback-derived design rather than a feed-forward reference.

#### Field Strength Meter
*AUDI201 / Assisted Listening Systems · intermediate · flagged by 1 expert(s)*

- **[Medium] Language/Communications — `common_mistakes`:** Item 1 has a misplaced relative clause: 'Judging a loop by ear or by hearing-aid reception instead of a calibrated meter, which cannot confirm the 400 mA/m level or uniformity.' Grammatically 'which cannot confirm' attaches to the nearest noun ('a calibrated meter'), the opposite of the intended meaning (it is judging by ear/reception that cannot confirm).  
  → *Suggestion:* Rewrite to fix the referent, e.g. 'Judging a loop by ear or by hearing-aid reception, neither of which can confirm the 400 mA/m level or field uniformity, instead of using a calibrated meter.'

#### GPIO
*MUSI190 / Connectors & I/O Connections · advanced · flagged by 1 expert(s)*

- **[Medium] Audio Technical — `scenario_contexts`:** 'Sending a contact closure over a Dante or AoIP network to ... fire an EVAC override' presents an unsupervised GPIO-over-AoIP trigger as a normal way to actuate life-safety evacuation. Emergency voice evacuation / mass-notification triggering is life-safety functionality that must use supervised, certified pathways (NFPA 72, UL 2572, EN 54-16); a standard, unmonitored Dante GPIO contact closure is not a compliant life-safety trigger and this could mislead a student designing such a system.  
  → *Suggestion:* Either drop the EVAC example or qualify it, e.g., 'interface with a certified life-safety system (the actual EVAC trigger must originate from a supervised fire-alarm/EN 54 / NFPA 72 pathway, not an unmonitored AoIP GPIO)' to distinguish general zone control from life-safety actuation.

#### IEC 60118-4
*AUDI201 / Assisted Listening Systems · advanced · flagged by 1 expert(s)*

- **[Medium] Audio Technical — `common_mistakes`:** The last bullet states that ADA rules 'reference this standard for loop quality.' The 2010 ADA Standards do not themselves cite IEC 60118-4; they only require that assistive listening be provided (Sec. 219). The requirement that installed hearing loops comply with IEC 60118-4 comes through the building/accessibility code ICC/ANSI A117.1, not the ADA regulation itself.  
  → *Suggestion:* Attribute the loop-performance requirement correctly, e.g. 'Confusing IEC 60118-4 (loop performance) with the ADA, which mandates that assistive listening be provided; the requirement that installed hearing loops meet IEC 60118-4 comes through ICC/ANSI A117.1, not the ADA text itself.'

#### MicroDot Connector
*MUSI190 / Connectors & I/O Connections · advanced · flagged by 1 expert(s)*

- **[Medium] Audio Technical — `related_terms`:** 'TA5F (Lemo)' mislabels the connector. TA5F is a Switchcraft 5-pin mini-XLR (Tini-QG); LEMO is a separate, physically different circular connector brand. The two are distinct connectors, which is exactly why TA5F-to-LEMO adapter cables exist. Equating TA5F with Lemo is a terminology error.  
  → *Suggestion:* Correct the parenthetical to 'TA5F (Switchcraft mini-XLR)', and if a Lemo reference is desired, list Lemo as its own separate related term.

### Low (polish only)

#### Bridle
*AUDI201 / Loudspeaker System Deployment · advanced · ⚠ safety-critical topic · flagged by 3 expert(s)*

- **[Low] Audio Technical — `common_mistakes`:** The first (UNSAFE) mistake says a 90-120 degree included apex angle 'multiplies each leg's tension far above the shared load.' The physics is more specific: at a 120 degree included angle each leg tension already equals the FULL suspended load (leg = (W/2)/cos60 = W), and at 90 degrees it is about 0.71W per leg, i.e. above half-load but not yet 'far above' the load. Tension only climbs steeply BEYOND about 120 degrees (roughly 2x the load near 150 degrees). The warning is directionally safe (conservative) but the numeric characterization is imprecise for teaching load multipliers.  
  → *Suggestion:* Reframe to teach the multiplier accurately, e.g.: 'Letting the included apex angle approach or exceed about 120 degrees, where each leg tension already equals the full suspended load and then rises sharply (roughly 2x the load near 150 degrees); keep included angles well under 90-120 degrees and always calculate leg tensions from the sling-angle factor.'
- **[Low] Learning/Cognition — `common_mistakes`:** Comprehension snag in the first bullet: 'Letting the included angle at the apex grow toward or past 90-120 degrees' presents a range as if it were a single threshold, so a learner cannot tell what the actual danger point is or why a range is given. This blurs the key cause-effect lesson (wider angle = higher leg tension) that the bullet is trying to teach.  
  → *Suggestion:* State the relationship plainly first, then the caution, e.g., 'The wider the apex angle, the higher the tension in each leg for the same load; tension climbs steeply once the included angle exceeds about 90 degrees and becomes dangerous approaching 120 degrees, so keep it narrow.'
- **[Low] Language/Communications — `common_mistakes`:** In the first item, 'grow toward or past 90-120 degrees' is ambiguous: pairing 'toward or past' with a numeric range leaves unclear whether the threshold is 90 or 120 degrees.  
  → *Suggestion:* Name a single threshold and treat the rest as a range, e.g.: 'Letting the included angle at the apex approach or exceed 90 degrees (and certainly 120 degrees), which multiplies each leg's tension far above the shared load...'.

#### SC Connector
*MUSI190 / Connectors & I/O Connections · advanced · flagged by 3 expert(s)*

- **[Low] Audio Technical — `purpose_function`:** SC retention is described as 'locking-tab retention.' SC uses a spring-loaded push-pull coupling housing that snaps/latches on insertion; the 'tab latch' descriptor is the hallmark of LC (RJ-style latch), not SC. Slightly imprecise for a term whose whole identity is 'push-pull.'  
  → *Suggestion:* Reword to '...a square push-pull coupling housing that snaps into a latched position' and drop 'locking-tab,' which invites confusion with LC's latch tab.
- **[Low] Learning/Cognition — `purpose_function`:** plain_english describes SC as a 'push-pull plug that clicks in and out,' but purpose_function describes 'locking-tab retention.' A learner comparing the two fields may be unsure whether the connector latches or simply friction-fits, since 'push-pull' and 'locking-tab' pull in different mental directions.  
  → *Suggestion:* Align the mechanism language across both fields, e.g. describe it consistently as a spring-loaded push-pull latch that clicks and self-retains, so the retention concept reads the same way in plain_english and purpose_function.
- **[Low] Language/Communications — `purpose_function`:** 'a square push-pull housing with a locking-tab retention' reads awkwardly; 'retention' is used as a countable noun.  
  → *Suggestion:* Change to 'a square push-pull housing with locking-tab retention' or '...with a locking-tab retention mechanism.'

#### Cable Management
*AUDI201 / Analog Live Sound · intermediate · flagged by 2 expert(s)*

- **[Low] Learning/Cognition — `common_mistakes`:** The 'over-under coil' technique is invoked as the correct method in both common_mistakes and scenario_contexts but is never explained. An intermediate learner who has not yet met the term is told what NOT to do ('coiling against its natural lay') without being shown what over-under actually is, so the correction does not land as a usable skill.  
  → *Suggestion:* Add a one-clause gloss the first time it appears, e.g. 'an over-under coil (alternating a normal loop with a reversed loop so the cable lies flat and pays out without twist)'. This turns the warning into an actionable technique instead of an unexplained label.
- **[Low] Language/Communications — `common_mistakes`:** Inconsistent list formatting: two items are prefixed 'UNSAFE:' and two are not, which breaks the parallel structure of the list. The safety signaling is useful, but the mixed prefixing reads as an oversight rather than a deliberate two-tier convention.  
  → *Suggestion:* Make the convention consistent — either prefix every safety-critical item and leave the purely-quality items unprefixed as a clear two-tier scheme (fine as-is if intended), or drop the prefixes and fold the safety emphasis into the sentence wording so all four items are formatted the same way. If the two-tier scheme is intentional, no change is needed.

#### Mass Notification System
*AUDI201 / Commercial Audio Systems · intermediate · flagged by 2 expert(s)*

- **[Low] Learning/Cognition — `practical_application`:** The nested parentheses 'an STI target near 0.50 (=0.70 CIS)' bury a second technical unit inside the first, which is hard to read at the intermediate level and briefly stalls comprehension in an otherwise strong sentence.  
  → *Suggestion:* Unpack the dual-metric aside rather than nesting it, e.g. 'tune DSP for intelligibility toward an STI of about 0.50, equivalent to roughly 0.70 on the CIS scale.'
- **[Low] Language/Communications — `purpose_function`:** Nested parentheses read awkwardly: 'tune DSP for intelligibility (an STI target near 0.50 (≈0.70 CIS))'. A parenthetical inside a parenthetical is hard to scan.  
  → *Suggestion:* Flatten to a single set, e.g. 'tune DSP for intelligibility (an STI target near 0.50, ≈0.70 CIS)'.

#### Signal Present Indicator
*MUSI190 / Signal Path & Levels · beginner · flagged by 2 expert(s)*

- **[Low] Audio Technical — `purpose_function`:** "signal above a low threshold (commonly around −20 dB)" states a dB figure with no reference, so it is technically ambiguous (−20 dBu? dBFS? relative to nominal?). Actual factory thresholds also vary widely by manufacturer.  
  → *Suggestion:* Specify the reference and note the variability, e.g. "typically ~20 dB below nominal operating level (often around −20 dBu on analog consoles), though the exact threshold varies by manufacturer."
- **[Low] Language/Communications — `scenario_contexts`:** The list breaks parallel structure: the first three items are gerund phrases ('Tracing...', 'Confirming...', 'Verifying...') but the fourth is a bare noun phrase ('A quick input check before soundcheck').  
  → *Suggestion:* Match the pattern, e.g. 'Running a quick input check before soundcheck.'

#### Ambisonic Microphone
*MUSI190 / Microphones · advanced · flagged by 1 expert(s)*

- **[Low] Learning/Cognition — `plain_english`:** The intro analogy 'capsules clustered like the faces of a pyramid' can mislead: 'pyramid' commonly evokes a square-based, five-faced shape, whereas the array is a four-capsule tetrahedron (which the later fields correctly call 'tetrahedral'). A beginner-to-the-concept reader meets 'pyramid' first and 'tetrahedral' later, creating a small terminology gap.  
  → *Suggestion:* Make the analogy match the later wording, e.g. 'four capsules arranged like the faces of a tetrahedron (a triangular, four-sided pyramid)'. This keeps the intuitive picture while aligning plain_english with the tetrahedral language used in purpose_function and common_mistakes.

#### Ampacity
*MUSI190 / Grounding & Electrical · intermediate · ⚠ safety-critical topic · flagged by 1 expert(s)*

- **[Low] Language/Communications — `common_mistakes`:** Temperature ratings are written without the degree symbol ('90C', '60C', '75C'), which is inconsistent with standard notation and slightly ambiguous for learners.  
  → *Suggestion:* Use the degree symbol: '90°C wire', 'often 60°C or 75°C'.

#### Antinode
*MUSI190 / Sound & Acoustics · intermediate · flagged by 1 expert(s)*

- **[Low] Learning/Cognition — `common_mistakes`:** The bullet 'a pressure antinode coincides with a velocity antinode — for sound, pressure maxima line up with velocity minima' introduces the unexplained concept of a 'velocity antinode' to an intermediate PA learner. Since the rest of the term only ever works in terms of pressure, this adds cognitive load and a new jargon pair with no scaffolding or payoff for the studio/live-sound use cases.  
  → *Suggestion:* Either add a half-clause gloss (e.g., '...where air movement, not pressure, is greatest') or drop this bullet and keep the correction focused on the node/antinode confusion, which is the misconception a room-mode learner will actually hit.

#### Bass Shaker (Tactile Transducer)
*AUDI201 / Consumer Audio Systems · advanced · flagged by 1 expert(s)*

- **[Low] Audio Technical — `related_terms`:** 'Network Streamer' is not technically related to a tactile transducer/bass shaker (a streamer is a source/transport, unrelated to seat-mounted low-frequency vibration). It reads as a stray cross-link.  
  → *Suggestion:* Replace 'Network Streamer' with a genuinely related term such as 'AV Receiver', 'Home Theater Processor', or 'LFE Channel'-adjacent hardware (e.g. a dedicated tactile-transducer amplifier).

#### Breakout Room
*AUDI201 / Corporate AV · intermediate · flagged by 1 expert(s)*

- **[Low] Language/Communications — `common_mistakes`:** The second item bundles two unrelated mistakes (over-ordering vs. inadequate switching) into one entry joined by 'or', breaking the parallel one-idea-per-item structure of the other bullets.  
  → *Suggestion:* Split into two items, e.g.: 'Assuming breakout gear needs the same scale as the general session and over-ordering.' and 'Ignoring that rapid presenter/laptop swaps need reliable source switching.'

#### Camlock
*MUSI190 / Grounding & Electrical · advanced · ⚠ safety-critical topic · flagged by 1 expert(s)*

- **[Low] Audio Technical — `common_mistakes`:** The color-code bullet says green ground, white neutral, and black/red/blue hots are 'an industry convention, not an NEC-guaranteed standard.' That over-generalizes: NEC 250.119 requires green (or green/yellow) for the equipment grounding conductor and 200.6 requires white/gray for the grounded (neutral) conductor, so those two colors are code-driven. Only the ungrounded (hot) leg colors are pure convention.  
  → *Suggestion:* Split the claim: 'Green ground and white neutral colors are required by NEC (250.119, 200.6); the hot-leg colors (commonly black/red/blue for 120/208V) are an industry convention, so legs must still be verified before energizing.' The core safety point (verify legs, don't assume) is correct and should stay.

#### Chain Hoist
*AUDI201 / Loudspeaker System Deployment · beginner · ⚠ safety-critical topic · flagged by 1 expert(s)*

- **[Low] Audio Technical — `practical_application`:** The duty-class framing (D8, D8+, C1) is accurate and correctly applied, but these designations are EU-origin (derived from German BGV D8 / BGV-C1 and codified in IGVW SQ P2). Because this app certifies technicians for North American work, the applicable powered-hoist safety standard is not cited. This is an enhancement, not an error.  
  → *Suggestion:* Add a reference to the applicable North American standard alongside the EU duty classes, e.g. note that ANSI E1.6-1 (Powered Hoist Systems) and ANSI E1.6-2 (Design/Inspection/Maintenance) govern entertainment powered hoists in the US, and that overhead-load-over-people practice should follow ANSI/ESTA E1.6 and OSHA 1926 alongside the D8/D8+/C1 duty framework.

#### Class G
*AUDI201 / Amplifiers · advanced · flagged by 1 expert(s)*

- **[Low] Language/Communications — `practical_application`:** Redundant reference to current draw: '...draw less current than comparable Class AB units, meaning smaller heatsinks, less rack heat, and reduced current draw at idle.' The phrase 'draw less current' and the closing 'reduced current draw at idle' restate the same idea.  
  → *Suggestion:* Trim to a single, non-repeating list, e.g. '...run cooler and draw less current than comparable Class AB units, so they need smaller heatsinks, add less rack heat, and pull less current at idle.'

#### Digital Snake
*AUDI201 / Digital Live Sound · beginner · flagged by 1 expert(s)*

- **[Low] Learning/Cognition — `common_mistakes`:** Depth inconsistency for a beginner-tagged term: the plain_english is pitched perfectly for a novice, but the common_mistakes bullets stack unglossed transport names (Dante, AVB, MADI) and the concept of 'audio transport vs. physical cable' with no on-ramp. A beginner who just learned 'one thin cable carries the audio' can lose the thread when three protocols appear in one line.  
  → *Suggestion:* Add a two-word gloss on first mention, e.g., 'the audio transport (the digital format the data uses, such as Dante, AVB, or MADI) versus the physical cable'. This preserves the important misconception-correction while keeping cognitive load appropriate to the stated difficulty.

#### Direct Drive
*AUDI201 / Consumer Audio Systems · beginner · flagged by 1 expert(s)*

- **[Low] Learning/Cognition — `practical_application`:** For a beginner-tagged term the phrase 'quartz-lock pitch control' is unglossed jargon dropped in without support, so a novice cannot tell what capability it names or why it matters. Every other field on this term is pitched cleanly for a beginner, making this a depth-consistency bump.  
  → *Suggestion:* Add a two-word gloss, e.g. 'quartz-lock pitch control (an electronic speed reference that holds the platter exactly on speed),' or simplify to 'precise, stable speed control.'

#### DisplayPort
*MUSI190 / Connectors & I/O Connections · beginner · flagged by 1 expert(s)*

- **[Low] Audio Technical — `common_mistakes`:** 'Assuming DisplayPort and HDMI plugs are interchangeable without an active adapter' is imprecise. Passive DP-to-HDMI adapters are extremely common and work when the source is Dual-Mode DisplayPort (DP++); an active adapter is only strictly required from a non-dual-mode source, for the HDMI-to-DP direction, or for high resolutions/refresh beyond DP++ limits.  
  → *Suggestion:* Reword to note that a passive adapter works only from a Dual-Mode (DP++) source at limited resolutions, while an active adapter is needed otherwise (and always for HDMI-to-DisplayPort).

#### Front Fill
*AUDI201 / Loudspeaker System Deployment · beginner · ⚠ safety-critical topic · flagged by 1 expert(s)*

- **[Low] Language/Communications — `practical_application`:** "time-aligns (delays) them slightly late" is redundant and awkward — 'delays' and 'slightly late' say the same thing, and the parenthetical interrupts the sentence.  
  → *Suggestion:* Rewrite as: "...and time-aligns them (adding a small delay) so the audience still localizes to the stage rather than to the fill boxes."

#### Fuse
*MUSI190 / Grounding & Electrical · beginner · ⚠ safety-critical topic · flagged by 1 expert(s)*

- **[Low] Language/Communications — `common_mistakes`:** 'fast-blo vs slow-blo/anti-surge' uses an informal/brand-derived spelling ('blo') that is inconsistent with plain glossary style.  
  → *Suggestion:* Use standard spelling: 'the wrong type (fast-blow vs. slow-blow/anti-surge, or wrong voltage rating)'.

#### General Session
*AUDI201 / Corporate AV · intermediate · flagged by 1 expert(s)*

- **[Low] Learning/Cognition — `scenario_contexts`:** The second scenario introduces the acronym 'IMAG' with no gloss. An intermediate learner meeting this term for the first time in a scenario meant to aid transfer may stall on the undefined jargon, breaking the concrete mental picture the scenario is supposed to build.  
  → *Suggestion:* Expand on first use, e.g., 'live cameras and IMAG (image magnification — the presenter shown enlarged on big screens)'.

#### In-Line Console
*MUSI190 / Mixers & Recorders · intermediate · flagged by 1 expert(s)*

- **[Low] Language/Communications — `common_mistakes`:** Terminal-punctuation inconsistency: the common_mistakes and scenario_contexts bullets omit ending periods, whereas the same list fields on the electrical and microphone terms in this group use full stops. (This applies across the Mixers & Recorders entries: Master Section, Monitor Section, Split Console, etc.)  
  → *Suggestion:* For consistency with the rest of the glossary's list fields, add terminal periods to each common_mistakes and scenario_contexts bullet, or confirm a single house style and apply it uniformly across all terms.

#### Isobaric Loading
*MUSI190 / Amps & Loudspeakers · advanced · flagged by 1 expert(s)*

- **[Low] Language/Communications — `practical_application`:** 'accepting the extra driver cost and weight, and no gain in efficiency, in exchange for a smaller box' reads awkwardly, because 'accepting ... no gain in efficiency' pairs the verb 'accepting' with a benefit that isn't being accepted, breaking the list's logic.  
  → *Suggestion:* Set the efficiency point off as its own aside, e.g.: 'accepting the extra driver cost and weight — with no gain in efficiency — in exchange for a smaller box.'

#### Lectern
*AUDI201 / Corporate AV · beginner · flagged by 1 expert(s)*

- **[Low] Language/Communications — `practical_application`:** Two coordinating 'and's in one sentence ('...confidence display, and selects...') make the list read as a run-on and blur where the actions divide.  
  → *Suggestion:* Recast as a clean series, e.g.: 'A tech mounts and tests the gooseneck or podium mic, dresses the cabling, may add a monitor lift or confidence display, and selects an ADA height-adjustable model when accessibility is required.'

#### Noise-Canceling Microphone
*MUSI190 / Microphones · intermediate · flagged by 1 expert(s)*

- **[Low] Language/Communications — `purpose_function`:** Spelling inconsistency: the headword is 'Noise-Canceling' (single-l, American) but the edited fields use British 'noise-cancelling' (double-l) in purpose_function and common_mistakes. Mixed spellings of the defined term within one entry read as an error.  
  → *Suggestion:* Standardize to the headword spelling: change 'noise-cancelling' to 'noise-canceling' in purpose_function ('a differential (noise-canceling) design') and in the second common_mistakes bullet ('an acoustic differential (noise-canceling) mic').

#### Peak Hold
*MUSI190 / Signal Path & Levels · intermediate · flagged by 1 expert(s)*

- **[Low] Language/Communications — `purpose_function`:** The parenthetical interjection splits the verb phrase 'captures and ... retains,' which makes the sentence stumble on first read.  
  → *Suggestion:* Recast so the verb stays together, e.g. 'It captures the maximum peak value and holds it briefly—or indefinitely—so transients too fast to see on a falling meter stay visible, helping catch clipping and set headroom.'

#### Phase Rotation
*MUSI190 / Grounding & Electrical · advanced · ⚠ safety-critical topic · flagged by 1 expert(s)*

- **[Low] Audio Technical — `common_mistakes`:** The point about 'paralleling' two sources having matched rotation is correct as far as it goes, but for an advanced/safety-critical term it could leave the impression that matching rotation is what enables paralleling. Actively paralleling two live three-phase sources requires full synchronization (equal voltage, frequency, and phase angle plus a sync/paralleling method), not merely identical rotation.  
  → *Suggestion:* Add a clause noting that matching rotation is necessary but not sufficient to parallel live sources, which additionally requires voltage/frequency/phase-angle synchronization; matching rotation alone chiefly matters for cross-patching distros fed from a common service.

#### Signal-Sensing Turn-On
*AUDI201 / Vehicle Audio · intermediate · flagged by 1 expert(s)*

- **[Low] Language/Communications — `common_mistakes`:** The second bullet packs three distinct ideas (turn-on delay, possible pop, drop-out on silence) into one comma-spliced run-on, which is harder to parse than the crisp parallel bullets around it.  
  → *Suggestion:* Split into two clauses, e.g.: 'Expecting instant, click-free operation — signal-sensing adds a short turn-on delay and can produce a pop. With AC-signal detection (rather than DC-offset detection), it can also drop out during silent passages.'

#### Sound Localization
*MUSI190 / Sound & Acoustics · beginner · flagged by 1 expert(s)*

- **[Low] Learning/Cognition — `purpose_function`:** This term is tagged 'beginner', but purpose_function and common_mistakes introduce 'spectral (pinna) cues' with no gloss. For a beginner the word 'pinna' and the phrase 'spectral cues' are unexplained prerequisites, so a learner meeting this term first cannot decode why front/back and height differ from left/right.  
  → *Suggestion:* Add a two-word gloss on first use, e.g., 'spectral cues from the outer-ear (pinna) shape', so the beginner can attach meaning before the same terms reappear in common_mistakes.

#### Split Console
*MUSI190 / Mixers & Recorders · intermediate · flagged by 1 expert(s)*

- **[Low] Language/Communications — `purpose_function`:** The two sentences are redundant: 'makes signal flow obvious and easy to follow, which is why it is common on teaching...desks. It exists to keep tracking and monitoring workflows distinct and easy to understand.' Both restate the same 'easy to follow/understand' benefit.  
  → *Suggestion:* Merge or drop the redundancy, e.g.: '...a split console makes signal flow obvious and keeps tracking and monitoring workflows distinct, which is why it is common on teaching and smaller-format desks.'

#### Stereo Link
*MUSI190 / Dynamics Processing · beginner · flagged by 1 expert(s)*

- **[Low] Learning/Cognition — `common_mistakes`:** This term is tagged beginner, but common_mistakes #3 ('Not high-pass filtering the link/sidechain, so heavy low end on one side clamps both channels too hard') assumes the learner already understands sidechain filtering, which is a more advanced concept than the rest of the entry. A beginner may not grasp why HPF-ing the detector path helps, so the caution lands as unexplained jargon.  
  → *Suggestion:* Either add a short clause explaining the idea in-line (e.g. 'filtering low bass out of the compressor's detector/sidechain so a heavy bass note on one side doesn't clamp both channels'), or move this point to a related intermediate term. Keep the Sidechain related_term link so the learner can follow up.

#### Tracking Force
*AUDI201 / Consumer Audio Systems · intermediate · flagged by 1 expert(s)*

- **[Low] Language/Communications — `purpose_function`:** Single long, semicolon-chained sentence packs the setting, both failure modes, and the fix into one breath, which is hard to parse for a learner.  
  → *Suggestion:* Split into two sentences, e.g.: 'It sets the downward stylus weight so the stylus stays properly seated in the groove. Too little causes mistracking and skipping; too much increases groove and stylus wear, so it is set to the cartridge maker's specified value.'

---

## Terms passed with no changes suggested (112)

Alnico Magnet, Ambient Noise Sensor, Antenna Gain (dBi), Anti-Skate, Array Bumper, Auracast, Auxiliary Battery, AVB (Audio Video Bridging), Backline, Backup Frequency, Band Solo, Bathtub Curve, Beaming, Belt Drive, Breaker Panel (Service Panel), CAN Bus, Chopstick Test, Cocktail Party Effect, Concert Pitch (A440), Consumer Level (−10 dBV), Crossover Distortion, Crystal Microphone, Dedicated Circuit, Direct Current (DC), Doppler Distortion, Downstage, Dual-Mono Processing, EDAC / Elco Connector, End-of-Line Resistor, Failure Mode, Feedback Delay Network (FDN), Feedback Detection, Feeder Cable, Ferrofluid, Fixed-Frequency EQ, Folded Horn, Gain Compensation, Green Room, Ground Rod, Ground-Plane Measurement, Hirose Connector, Impedance Bridging, Inclinometer, Infinite Baffle, Interaural Level Difference (ILD), Interaural Time Difference (ITD), Latent Defect, LC Connector, Lightning Connector, Line Driver, Load-Out, Master Section, Maximum Length Sequence (MLS), Meter Ballistics, Microphone Modeling, Milan, Missing Fundamental, Monitor Section, Monitor World, MQA, Mult Box, Multipin Connector, Music-on-Hold (MOH), Neodymium Magnet, Offline Editor, Oil-Can Delay, Outlet Tester, Overshoot, Parabolic Microphone, Part 74 License, Plane Wave, Platter, Power Distro, Prediction Software, Production Advance, Program-Dependent Release, Push-To-Talk Microphone, Quasi-Anechoic Measurement, Quiescent Current, Rail Voltage, Ravenna, Relay, Remote Head Amp, Resonance Suppressor, Round Sling, RTP (Real-time Transport Protocol), Schroeder Reverberator, Scribble Strip, Semi-Parametric EQ, SFP Module, Shotgunning, Side Fill, Solo In Place (SIP), Speaker Timer, Speech Privacy, Spike Mark, SPL Competition, Stage Left / Stage Right, Steering Wheel Control Interface, Strike, Superposition, Switch-Mode Power Supply (SMPS), Tech Rider, Thermal Drift, Throwable Microphone, Tonearm, Toroidal Transformer, Transverse Wave, Upstage, Waterfall Plot (CSD), Wavefront, Wow and Flutter
