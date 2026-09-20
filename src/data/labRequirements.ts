/**
 * labRequirements — which MEMBER (Training Lab) labs each certificate and
 * program genuinely requires, keyed by credential slug.
 *
 * ── The product rule ──────────────────────────────────────────────────────
 * Every AUDIO FUNDAMENTALS lab (the `af_*` keys in
 * src/features/lab/labCompletion.ts) is a UNIVERSAL prerequisite — required for
 * every credential, no exceptions. Those are deliberately NOT listed here: the
 * UI adds them separately, and repeating them on 160 rows would duplicate every
 * line. This file holds ONLY the variable part: the `section: 'training'` labs
 * in src/screens/lab/labCatalog.ts.
 *
 * A credential ABSENT from this map requires the fundamentals and nothing else.
 * That is a real and expected answer for well over half the catalog — a great
 * many credentials (archival, standards, networking, acoustics science,
 * DAW-specific) have no member lab that teaches a core competency of theirs.
 *
 * ── labKey ────────────────────────────────────────────────────────────────
 * Training-lab leaves in labCatalog.ts carry no `key` field (only the `af_*`
 * fundamentals leaves do), so the stable identifier for a member lab is its
 * ROUTE name — the `route` on the leaf, which is also its key in
 * RootStackParamList. Every labKey below is one of those routes, verified
 * against src/navigation/types.ts.
 *
 * ⚠️ INTEGRATION NOTE for whoever consumes this: `leafByKey()` in
 * src/features/lab/labRequirementList.ts resolves a requirement by matching
 * `leaf.key`, and NO training leaf has a `key` — only the 15 `af_*`
 * fundamentals leaves do. Until that lookup also matches `leaf.route`, every
 * member requirement in this file is silently dropped (the function drops
 * unresolved keys on purpose). One-line fix there; nothing to change here.
 *
 * Note on EQ: the Equalization category holds two leaves, the older `EqLab`
 * and the full `EqLabHome` (the EQ Lab with its own home, LEARN / EXPLORE /
 * TRAIN / CHALLENGE). Requirements point at `EqLabHome` throughout — it is the
 * complete lab and the one a learner would be sent to.
 *
 * ── Provenance / how to regenerate ────────────────────────────────────────
 * Derived 2026-09-20 from the LIVE database (Supabase yjgolswjggmlpeowvtxr,
 * read-only): `certificates` (124 active) and `programs` (36 active) joined
 * through `certificate_topics` / `program_topics` to `achievements`, so every
 * credential was judged on its actual TOPIC LIST rather than on its title.
 * Corroborated against src/data/credentialCopy.ts (description, where-applies,
 * careers) and against the lab blurbs in labCatalog.ts.
 *
 * The bar applied to every row: "could a learner do this job without having
 * done this lab?" If yes, it is not required. A merely thematic link is worse
 * than no requirement — it inflates the work and the learner stops believing
 * the list.
 *
 * To regenerate: re-run the topic join, re-read the lab blurbs, and redo the
 * call per credential. This is an editorial map, not a computed one — there is
 * no script that reproduces it.
 *
 * COUNTS: 124 certificates + 36 programs = 160 credentials. Not 128.
 */

/** One member-lab requirement on a credential. `why` is shown to the learner. */
export type LabRequirement = { labKey: string; why: string };

/**
 * Member labs required per credential slug, ON TOP OF the universal Audio
 * Fundamentals labs. Slugs with no member-lab requirement are omitted.
 */
export const LAB_REQUIREMENTS_BY_SLUG: Record<string, readonly LabRequirement[]> = {
  // ── Certificates ────────────────────────────────────────────────────────
  'cert-adr-and-voice-recording-v3': [
    { labKey: 'SpeechLab', why: 'ADR is judged on whether the replaced line still sounds like speech, so you need to know how the voice makes its sounds.' },
    { labKey: 'SmartProcessorsLab', why: 'Close-miked replacement dialogue needs de-essing before anyone will accept it.' },
  ],
  'cert-ai-voice-and-speech-synthesis-v3': [
    { labKey: 'SpeechLab', why: 'You cannot judge synthetic speech without knowing how real voicing, vowels and formants behave.' },
  ],
  'cert-amplifier-technology-v3': [
    { labKey: 'AmpLab', why: 'Amplifier classes, the load the amp sees and where the power comes from are the subject of this certificate.' },
  ],
  'cert-analog-electronics-for-audio-v3': [
    { labKey: 'AmpLab', why: 'Transistors, transformers and amplifier topologies are where these components actually get used.' },
  ],
  'cert-assisted-listening-and-accessibility-v3': [
    { labKey: 'SpeechLab', why: 'Assisted listening is measured in speech intelligibility, which starts with how speech is produced and heard.' },
  ],
  'cert-audio-career-and-business-v3': [
    { labKey: 'PreProdLab', why: 'Scoping a job and costing it out — people, schedule, budget — is the business side of audio in practice.' },
  ],
  'cert-audio-troubleshooting-specialist-v3': [
    { labKey: 'AmpLab', why: 'Fault-finding inside analog gear means knowing what the circuit was supposed to be doing.' },
  ],
  'cert-band-tracking-specialist-v3': [
    { labKey: 'MicSelectLab', why: 'Tracking a band is a run of microphone choices, each one defensible for its source.' },
    { labKey: 'PreProdLab', why: 'A tracking session runs on the plan made before the band arrives.' },
  ],
  'cert-broadcast-engineer-v3': [
    { labKey: 'CompressionLab', why: 'The air chain is compression — threshold, ratio and release decide how the station sounds.' },
    { labKey: 'LimiterLab', why: 'Broadcast is delivered to a hard ceiling and a loudness target.' },
  ],
  'cert-car-audio-installation-v3': [
    { labKey: 'AmpLab', why: 'Matching amplifiers to speaker loads without damaging either is the core of a vehicle install.' },
  ],
  'cert-compression-and-dynamics-v3': [
    { labKey: 'CompressionLab', why: 'This certificate is compression — threshold, ratio, attack, release and the envelope they produce.' },
    { labKey: 'GateLab', why: 'Gating and downward expansion are the other half of dynamics control.' },
    { labKey: 'LimiterLab', why: 'Limiting, true-peak and loudness are where a dynamics chain ends up.' },
  ],
  'cert-corporate-and-event-production-v3': [
    { labKey: 'PreProdLab', why: 'An event lives or dies on the scope, crew and schedule agreed before load-in.' },
  ],
  'cert-critical-listening-and-ear-training-v3': [
    { labKey: 'EarTrainingLab', why: 'Critical listening is a trained skill — this is where you drill it and get scored honestly.' },
    { labKey: 'EnvelopeLab', why: 'Attack, decay and resonance are the descriptors this certificate is tested on.' },
    { labKey: 'SpeechLab', why: 'Voice is the source you will be asked to describe most often.' },
  ],
  'cert-dialogue-editor-v3': [
    { labKey: 'SpeechLab', why: 'Dialogue editing is cutting around plosives, sibilance and breaths — you need to know what makes them.' },
    { labKey: 'PostProdLab', why: 'Dialogue is edited inside a post workflow with a spotting session and a delivery at the end.' },
  ],
  'cert-distributed-and-paging-systems-v3': [
    { labKey: 'AmpLab', why: 'A distributed system is an amplifier loading problem before it is anything else.' },
  ],
  'cert-drum-mixing-v3': [
    { labKey: 'EqLabHome', why: 'Separating a kit is frequency work before it is anything else.' },
    { labKey: 'CompressionLab', why: 'Drum dynamics are controlled with compression without losing the groove.' },
    { labKey: 'EnvelopeLab', why: 'Transient shaping only makes sense once you can see attack and decay.' },
  ],
  'cert-drum-recording-and-mixing-v3': [
    { labKey: 'MicSelectLab', why: 'A kit is a set of microphone choices, one per source.' },
    { labKey: 'PhaseLab', why: 'Several microphones on one kit is the classic phase problem — get it wrong and nothing else helps.' },
    { labKey: 'CompressionLab', why: 'Kit balance is held together with compression.' },
  ],
  'cert-effects-and-pedal-design-v3': [
    { labKey: 'DistortionLab', why: 'A pedal is a distortion circuit — you need to hear what clipping and saturation actually do.' },
    { labKey: 'AmpLab', why: 'Pedals are designed around the amplifier stage they feed.' },
  ],
  'cert-electronics-repair-technician-v3': [
    { labKey: 'AmpLab', why: 'Most audio repair is amplifier repair, and you need the working circuit in your head first.' },
  ],
  'cert-eq-and-tonal-shaping-v3': [
    { labKey: 'EqLabHome', why: 'This certificate is equalization — see it, hear it, and diagnose it.' },
    { labKey: 'EarTrainingLab', why: 'Tonal shaping is worthless if you cannot hear which band moved.' },
  ],
  'cert-field-and-location-recording-v3': [
    { labKey: 'MicSelectLab', why: 'On location the microphone choice is made once and cannot be undone.' },
  ],
  'cert-foh-engineering-v3': [
    { labKey: 'EqLabHome', why: 'Front of house is frequency decisions made fast, on a live console.' },
    { labKey: 'CompressionLab', why: 'Holding a live vocal and a live kit in place is compression work.' },
  ],
  'cert-foley-performance-and-recording-v3': [
    { labKey: 'PostProdLab', why: 'Foley is recorded to picture and delivered into a post session to a specification.' },
  ],
  'cert-forensic-audio-v3': [
    { labKey: 'SpeechLab', why: 'Forensic work is almost always about recovering speech, so speech production is the subject.' },
    { labKey: 'EqLabHome', why: 'Enhancement is filtering — and knowing when a filter is removing evidence along with the noise.' },
  ],
  'cert-game-audio-v3': [
    { labKey: 'BinauralLab', why: 'Game audio places sound objects around the player, and that is how they are heard on headphones.' },
  ],
  'cert-guitar-tone-and-recording-v3': [
    { labKey: 'MicSelectLab', why: 'Guitar tone on a record is largely the microphone in front of the cabinet.' },
    { labKey: 'DistortionLab', why: 'The tone itself is harmonic distortion — you should be able to hear which kind.' },
  ],
  'cert-home-studio-starter-v3': [
    { labKey: 'MicSelectLab', why: 'The first real decision in a home studio is which microphone, and why.' },
  ],
  'cert-immersive-audio-production-v3': [
    { labKey: 'StereoLab', why: 'An immersive mix still has to hold up folded down to stereo and mono.' },
    { labKey: 'BinauralLab', why: 'Most listeners will hear your immersive mix binaurally, on headphones.' },
  ],
  'cert-instrument-recognition-percussion-v3': [
    { labKey: 'EnvelopeLab', why: 'Percussion is identified by its attack and decay far more than by its pitch.' },
    { labKey: 'EarTrainingLab', why: 'Recognition is a drilled skill, and this is where it is drilled and scored.' },
  ],
  'cert-instrument-recognition-winds-and-brass-v3': [
    { labKey: 'EnvelopeLab', why: 'Wind and brass articulation lives in the attack and in how the note is released.' },
    { labKey: 'HarmonicLab', why: 'What separates an oboe from a trumpet is its harmonic spectrum.' },
  ],
  'cert-instrument-sound-identification-v3': [
    { labKey: 'HarmonicLab', why: 'Timbre is harmonic content, and this is where you see it.' },
    { labKey: 'EnvelopeLab', why: 'Two instruments with a similar spectrum are still told apart by their envelopes.' },
  ],
  'cert-live-mixing-specialist-v3': [
    { labKey: 'EqLabHome', why: 'Live mixing is frequency decisions made in real time.' },
    { labKey: 'CompressionLab', why: 'Live sources are held in place with compression, not with the fader alone.' },
  ],
  'cert-live-sound-system-engineer-v3': [
    { labKey: 'PhaseLab', why: 'Aligning subs to tops and the deck to the delays is phase work.' },
    { labKey: 'EqLabHome', why: 'Tuning a deployed system is filtering it to the room.' },
  ],
  'cert-localization-and-dubbing-v3': [
    { labKey: 'SpeechLab', why: 'Sync and adaptation are judged against how speech is actually articulated.' },
    { labKey: 'PostProdLab', why: 'A dub is a delivery to a specification, assembled in a post workflow.' },
  ],
  'cert-loudness-and-delivery-specialist-v3': [
    { labKey: 'LimiterLab', why: 'Delivery to a loudness target and a true-peak ceiling is exactly what this lab teaches.' },
  ],
  'cert-loudspeaker-systems-and-measurement-v3': [
    { labKey: 'AmpLab', why: 'Matching amplifier power and damping to a driver safely is part of specifying the system.' },
  ],
  'cert-mastering-engineer-v3': [
    { labKey: 'EqLabHome', why: 'Mastering EQ moves are small and have to be heard exactly.' },
    { labKey: 'CompressionLab', why: 'Mastering dynamics work starts with knowing what a compressor does to the envelope.' },
    { labKey: 'LimiterLab', why: 'The last stage of a master is a ceiling and a loudness target.' },
  ],
  'cert-microphone-technology-specialist-v3': [
    { labKey: 'MicSelectLab', why: 'Reading the specification sheet and choosing on it is the whole certificate.' },
  ],
  'cert-mix-bus-and-automation-v3': [
    { labKey: 'AdvancedMixingLab', why: 'Parallel paths, bus routing and stems are what this certificate is about.' },
    { labKey: 'CompressionLab', why: 'Bus processing is compression applied to a whole group at once.' },
    { labKey: 'LimiterLab', why: 'Mix-bus loudness decisions need the ceiling understood.' },
  ],
  'cert-mixing-engineer-v3': [
    { labKey: 'BeginningMixingLab', why: 'A repeatable process from session prep to a balanced mix is the base of the job.' },
    { labKey: 'AdvancedMixingLab', why: 'Routing, parallel paths, translation and delivery are what separate a mix engineer from a hobbyist.' },
    { labKey: 'EqLabHome', why: 'Fitting instruments together is frequency work.' },
  ],
  'cert-monitor-engineering-iem-and-wedges-v3': [
    { labKey: 'EqLabHome', why: 'Ringing out a wedge is narrow, fast, deliberate filtering.' },
  ],
  'cert-music-business-and-industry-v3': [
    { labKey: 'PreProdLab', why: 'Quoting and running a project — scope, people, schedule, budget — is the business skill this certificate names.' },
  ],
  'cert-orchestral-recording-and-mixing-v3': [
    { labKey: 'MicSelectLab', why: 'An ensemble session is decided by which microphones go up.' },
    { labKey: 'StereoLab', why: 'Ensemble recording is a stereo image you have to build and then check.' },
    { labKey: 'ReverbLab', why: 'The hall is part of the sound, whether it is real or added.' },
  ],
  'cert-pa-loudspeaker-systems-v3': [
    { labKey: 'PhaseLab', why: 'Boxes that overlap in coverage combine by phase, not by wishful thinking.' },
    { labKey: 'EqLabHome', why: 'System tuning is filtering the rig to the room.' },
  ],
  'cert-plugin-and-processing-power-user-v3': [
    { labKey: 'AdvancedMixingLab', why: 'Parallel and bus processing is where plugin chains are actually decided.' },
  ],
  'cert-podcast-production-v3': [
    { labKey: 'SpeechLab', why: 'A podcast is speech, and intelligibility is the product.' },
    { labKey: 'CompressionLab', why: 'Spoken word is held at a consistent level with compression.' },
    { labKey: 'LimiterLab', why: 'Podcasts are delivered to a platform loudness target.' },
  ],
  'cert-preamp-and-converter-design-v3': [
    { labKey: 'AmpLab', why: 'A preamp is a gain stage — the same devices, topologies and loading.' },
  ],
  'cert-psychoacoustics-and-listening-v3': [
    { labKey: 'SpeechLab', why: 'Speech perception is one of the three topics this certificate is built on.' },
    { labKey: 'EarTrainingLab', why: 'Psychoacoustics is easier to trust once you have tested your own hearing against a measurement.' },
  ],
  'cert-re-recording-mixer-v3': [
    { labKey: 'PostProdLab', why: 'The final mix is the last stage of a post workflow with a defined deliverable.' },
    { labKey: 'AdvancedMixingLab', why: 'Stems, routing and translation are the mechanics of a re-recording stage.' },
  ],
  'cert-session-editing-and-comping-v3': [
    { labKey: 'PostProdLab', why: 'Editing and comping sit inside a session workflow that has to survive handoff.' },
  ],
  'cert-sound-design-and-sfx-v3': [
    { labKey: 'ReverbLab', why: 'Placing an effect in a space is most of what makes it believable.' },
    { labKey: 'DelayLab', why: 'Time-based manipulation is the sound designer’s first tool.' },
    { labKey: 'PostProdLab', why: 'Effects are cut to picture and delivered into a post session.' },
  ],
  'cert-sound-design-with-synthesis-v3': [
    { labKey: 'OscillatorLab', why: 'Synthesis starts with what the oscillator is actually producing.' },
    { labKey: 'ModularLab', why: 'VCO, VCF, VCA, LFO and envelope is the signal flow behind every synthesiser.' },
    { labKey: 'FmLab', why: 'FM is the technique most often used and least often understood.' },
  ],
  'cert-speech-and-voice-science-v3': [
    { labKey: 'SpeechLab', why: 'Anatomy, voicing, vowels and formants are the subject of this certificate.' },
  ],
  'cert-streaming-mastering-and-loudness-v3': [
    { labKey: 'LimiterLab', why: 'Streaming delivery is a true-peak ceiling and a loudness target.' },
    { labKey: 'CompressionLab', why: 'Hitting that target without crushing the music is a compression decision.' },
  ],
  'cert-studio-miking-specialist-v3': [
    { labKey: 'MicSelectLab', why: 'Choosing the microphone for the source is the certificate.' },
    { labKey: 'PhaseLab', why: 'Close-miking several sources at once is a phase problem you have to be able to hear.' },
  ],
  'cert-studio-recording-engineer-v3': [
    { labKey: 'MicSelectLab', why: 'The recording is decided at the microphone, before any processing.' },
    { labKey: 'PreProdLab', why: 'A session that was not planned costs the client money.' },
  ],
  'cert-system-tuning-and-alignment-v3': [
    { labKey: 'PhaseLab', why: 'Alignment is phase — this is where you see what happens when two sources combine.' },
    { labKey: 'EqLabHome', why: 'Tuning a system is filtering it, with a measurement to justify each move.' },
  ],
  'cert-time-based-and-creative-fx-v3': [
    { labKey: 'ReverbLab', why: 'Reverb is one of the two named topics of this certificate.' },
    { labKey: 'DelayLab', why: 'Delay is the other, and the effects below are all built from it.' },
    { labKey: 'ChorusLab', why: 'Chorus is a modulated delay — the first of the three comb-filter effects.' },
    { labKey: 'FlangerLab', why: 'Flanging is the same idea at a shorter delay, and it sounds nothing like chorus.' },
    { labKey: 'PhaserLab', why: 'Phasing uses all-pass stages instead of delay, and the difference matters in a mix.' },
  ],
  'cert-tube-amp-building-v3': [
    { labKey: 'TubeLab', why: 'How a tube amplifies by controlling electron flow is the thing you are building.' },
    { labKey: 'AmpLab', why: 'The amplifier around the tube — classes, loading, transformers — has to be understood too.' },
  ],
  'cert-tube-audio-equipment-specialist-v3': [
    { labKey: 'TubeLab', why: 'Tube behaviour is the specialism.' },
    { labKey: 'AmpLab', why: 'Servicing tube gear means knowing the amplifier stage the tube sits in.' },
  ],
  'cert-vinyl-and-disc-mastering-v3': [
    { labKey: 'EqLabHome', why: 'Cutting a lacquer is a set of frequency constraints applied with filters.' },
    { labKey: 'PhaseLab', why: 'Out-of-phase bass will not cut — mono compatibility is a physical limit here, not a preference.' },
  ],
  'cert-vocal-mixing-specialist-v3': [
    { labKey: 'SmartProcessorsLab', why: 'De-essing is the one process every vocal mix needs and most people set wrong.' },
    { labKey: 'CompressionLab', why: 'A vocal sits in a mix because of what the compressor is doing to its envelope.' },
    { labKey: 'ReverbLab', why: 'Where the vocal sits in space is a reverb decision.' },
  ],
  'cert-vocal-recording-and-production-v3': [
    { labKey: 'MicSelectLab', why: 'The vocal microphone choice shapes everything downstream.' },
    { labKey: 'SmartProcessorsLab', why: 'Sibilance is created at the microphone and dealt with here.' },
    { labKey: 'AutotuneLab', why: 'Tuning a vocal is an expected deliverable, and it has to be done on purpose.' },
  ],
  'cert-vr-ar-spatial-sound-v3': [
    { labKey: 'BinauralLab', why: 'VR and AR audio is binaural — moving sound objects around the listener’s head.' },
  ],
  'cert-worship-audio-v3': [
    { labKey: 'EqLabHome', why: 'A worship room is mixed with frequency decisions made live.' },
    { labKey: 'CompressionLab', why: 'Speech and band in the same service need dynamics control.' },
  ],

  // ── Programs ────────────────────────────────────────────────────────────
  'prog-acoustics-and-psychoacoustics-research-v3': [
    { labKey: 'SpeechLab', why: 'Speech perception is one of this program’s named topics and needs the production side first.' },
  ],
  'prog-ai-audio-production-v3': [
    { labKey: 'OscillatorLab', why: 'Generated audio is judged against what an oscillator actually produces.' },
    { labKey: 'SpeechLab', why: 'Voice is the output AI audio is most often asked for, and the hardest to judge.' },
  ],
  'prog-analog-and-vintage-audio-engineering-v3': [
    { labKey: 'TubeLab', why: 'Vintage audio is tube audio — start with how the tube amplifies.' },
    { labKey: 'AmpLab', why: 'Classes, loading and transformers are the rest of the analog signal path.' },
  ],
  'prog-audio-acoustics-and-system-optimization-v3': [
    { labKey: 'PhaseLab', why: 'Optimization is combining sources correctly, which is a phase question.' },
    { labKey: 'EqLabHome', why: 'System EQ is the tool the measurement is feeding.' },
  ],
  'prog-audio-dsp-and-machine-learning-v3': [
    { labKey: 'OscillatorLab', why: 'Band-limiting and aliasing should be heard here before they are coded.' },
    { labKey: 'SpeechLab', why: 'Speech is the signal most audio machine learning is pointed at.' },
  ],
  'prog-audio-electronics-service-and-repair-v3': [
    { labKey: 'AmpLab', why: 'Most of the gear on the bench is an amplifier of some kind.' },
    { labKey: 'TubeLab', why: 'Tube equipment is a routine part of a repair bench and behaves differently.' },
  ],
  'prog-audio-preservation-restoration-and-archival-science-v3': [
    { labKey: 'EqLabHome', why: 'Restoration is filtering, and knowing when a filter is destroying the record.' },
    { labKey: 'CompressionLab', why: 'Level restoration uses dynamics processing that has to be applied conservatively.' },
  ],
  'prog-audio-systems-engineering-v3': [
    { labKey: 'AmpLab', why: 'Specifying amplification to a loudspeaker load is core to system design.' },
    { labKey: 'PhaseLab', why: 'Systems that overlap in coverage combine by phase.' },
  ],
  'prog-broadcast-podcast-and-streaming-audio-v3': [
    { labKey: 'SpeechLab', why: 'Everything in this program is carried by the voice.' },
    { labKey: 'EqLabHome', why: 'Broadcast tonal shaping is filtering with a house sound to hit.' },
    { labKey: 'CompressionLab', why: 'The air chain is compression.' },
    { labKey: 'LimiterLab', why: 'Every one of these outputs is delivered to a loudness target.' },
  ],
  'prog-commercial-audio-and-av-systems-v3': [
    { labKey: 'AmpLab', why: 'Install work is an amplifier and loading problem before it is anything else.' },
    { labKey: 'PhaseLab', why: 'Distributed loudspeakers overlap, and overlap is phase.' },
  ],
  'prog-concert-and-festival-production-v3': [
    { labKey: 'EqLabHome', why: 'Tuning a rig to a venue is filtering it.' },
    { labKey: 'PhaseLab', why: 'Sub-to-top alignment decides whether the low end works at all.' },
  ],
  'prog-dj-and-club-audio-v3': [
    { labKey: 'EqLabHome', why: 'Club mixing and club system tuning are both frequency work.' },
  ],
  'prog-electronic-music-production-and-synthesis-v3': [
    { labKey: 'OscillatorLab', why: 'Every sound in this program starts at an oscillator.' },
    { labKey: 'ModularLab', why: 'VCO, VCF, VCA, LFO and envelope is the patch behind every synthesiser you will use.' },
    { labKey: 'EqLabHome', why: 'Synthesised parts are fitted together with frequency decisions.' },
    { labKey: 'CompressionLab', why: 'Electronic music is built on deliberate dynamics control.' },
  ],
  'prog-film-scoring-and-music-production-v3': [
    { labKey: 'StereoLab', why: 'Orchestral and ensemble work is a stereo image you build on purpose.' },
    { labKey: 'ReverbLab', why: 'A score lives in a space, real or added.' },
    { labKey: 'PostProdLab', why: 'The score is delivered into a picture workflow to a specification.' },
  ],
  'prog-forensic-and-investigative-audio-v3': [
    { labKey: 'SpeechLab', why: 'The evidence is nearly always speech.' },
    { labKey: 'EqLabHome', why: 'Enhancement is filtering, and it has to be justifiable.' },
  ],
  'prog-game-and-interactive-audio-v3': [
    { labKey: 'BinauralLab', why: 'Interactive audio places objects around the player’s head.' },
    { labKey: 'ReverbLab', why: 'Game spaces are sold to the player with reverb.' },
    { labKey: 'PostProdLab', why: 'Assets are still delivered to a specification with an archive behind them.' },
  ],
  'prog-hearing-science-and-psychoacoustics-v3': [
    { labKey: 'SpeechLab', why: 'Speech perception is central to this program.' },
    { labKey: 'EnvelopeLab', why: 'Attack, decay and resonance identification is one of its named topics.' },
    { labKey: 'EarTrainingLab', why: 'The claims in this program are more convincing once you have tested them on your own ears.' },
  ],
  'prog-immersive-and-spatial-audio-v3': [
    { labKey: 'BinauralLab', why: 'Most immersive listening happens on headphones, binaurally.' },
    { labKey: 'StereoLab', why: 'Immersive mixes are still checked folded to stereo and mono.' },
    { labKey: 'ReverbLab', why: 'Spatial audio is largely a reverb and early-reflection problem.' },
  ],
  'prog-live-sound-engineering-v3': [
    { labKey: 'EqLabHome', why: 'Live sound is frequency decisions made under time pressure.' },
    { labKey: 'CompressionLab', why: 'Live sources are held in place with dynamics control.' },
    { labKey: 'PhaseLab', why: 'System alignment and multi-microphone sources are both phase problems.' },
  ],
  'prog-medical-and-clinical-acoustics-v3': [
    { labKey: 'SpeechLab', why: 'Clinical audio work is dominated by speech and the voice.' },
  ],
  'prog-mixing-and-mastering-engineering-v3': [
    { labKey: 'BeginningMixingLab', why: 'A repeatable mix process is the foundation of the whole program.' },
    { labKey: 'AdvancedMixingLab', why: 'Routing, parallel paths, translation and stems are the professional half of mixing.' },
    { labKey: 'EqLabHome', why: 'Both mixing and mastering are carried by frequency decisions.' },
    { labKey: 'CompressionLab', why: 'Dynamics control runs from the first channel to the master bus.' },
    { labKey: 'LimiterLab', why: 'Mastering ends at a ceiling and a loudness target.' },
  ],
  'prog-music-production-v3': [
    { labKey: 'BeginningMixingLab', why: 'Producing a record means being able to mix it to a listenable state.' },
    { labKey: 'EqLabHome', why: 'Arranging parts so they coexist is frequency work.' },
    { labKey: 'CompressionLab', why: 'Dynamics control is used on nearly every element.' },
    { labKey: 'OscillatorLab', why: 'Synthesis is one of this program’s named topics and starts at the oscillator.' },
  ],
  'prog-post-production-audio-v3': [
    { labKey: 'PostProdLab', why: 'This program is the post workflow, from ingest to an accepted delivery.' },
    { labKey: 'SpeechLab', why: 'Dialogue, ADR and dubbing all rest on how speech is produced.' },
    { labKey: 'AdvancedMixingLab', why: 'Stems, routing and translation are how a final mix is actually delivered.' },
  ],
  'prog-studio-recording-engineering-v3': [
    { labKey: 'MicSelectLab', why: 'The record is decided at the microphone.' },
    { labKey: 'PhaseLab', why: 'Multiple microphones on one source is the recurring problem of studio recording.' },
    { labKey: 'PreProdLab', why: 'Sessions that were not planned run over and lose the client.' },
  ],
  'prog-theater-venue-and-entertainment-audio-v3': [
    { labKey: 'EqLabHome', why: 'Venue systems and body-microphone channels are both tuned with filters.' },
  ],
  'prog-transducer-and-audio-hardware-engineering-v3': [
    { labKey: 'AmpLab', why: 'Driving a transducer is an amplifier and loading problem.' },
  ],
  'prog-vehicle-and-consumer-audio-systems-v3': [
    { labKey: 'AmpLab', why: 'Consumer and vehicle systems are specified around the amplifier and the load it sees.' },
  ],
  'prog-worship-audio-production-v3': [
    { labKey: 'EqLabHome', why: 'A worship room is tuned and mixed with frequency decisions.' },
    { labKey: 'CompressionLab', why: 'Speech and music in the same service need dynamics control.' },
    { labKey: 'MicSelectLab', why: 'Choosing microphones for speakers, singers and an ensemble is a weekly decision here.' },
  ],
};

const EMPTY: readonly LabRequirement[] = [];

/**
 * The member labs a credential requires beyond the universal Audio Fundamentals
 * labs. Returns an empty array for a credential with no member-lab requirement
 * (the common case) and for an unknown slug.
 */
export function labRequirementsFor(slug: string): readonly LabRequirement[] {
  return LAB_REQUIREMENTS_BY_SLUG[slug] ?? EMPTY;
}
