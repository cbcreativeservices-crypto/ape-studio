/**
 * labRequirements — which TRAINING labs and lessons each certificate and
 * program genuinely requires, keyed by credential slug.
 *
 * ── STATUS ────────────────────────────────────────────────────────────────
 * Proposed 2026-10-13 and APPROVED by the owner the same day (d2d37511). Owner summary:
 * Downloads\2026-10-13_LAB_CERT_REQUIREMENTS_MAP.md. Backend seed (generated
 * FROM this file — never hand-edit it): docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql,
 * regenerate with `node scripts/gen-lab-cert-seed.mjs`; the ratchet
 * test/labCertRequirements_20261013.test.ts fails if the two drift.
 *
 * ── The product rule ──────────────────────────────────────────────────────
 * Every AUDIO FUNDAMENTALS lab (the `af_*` keys) is a UNIVERSAL prerequisite —
 * required for every credential, no exceptions. Those are deliberately NOT
 * listed here: the UI adds them separately. This file holds ONLY the variable
 * part. Required labs UNLOCK THE FINAL EXAM (owner 2026-10-13, server-checked
 * like topics), so every row below costs a learner real work.
 *
 * THE BAR, applied to every row: "could a learner do this job without having
 * done this lab / lesson? If yes, it is not required." A merely thematic link
 * is worse than no requirement — it inflates the work and the learner stops
 * believing the list. A credential ABSENT from this map requires the
 * fundamentals and nothing else — a real and common answer (archival,
 * standards, networking, acoustics science, DAW-specific credentials).
 *
 * ── key ───────────────────────────────────────────────────────────────────
 * `key` is the PERMANENT SERVER KEY from src/features/lab/trainingLabKeys.ts
 * (one row in the server `labs` table):
 *   tr_<lab>        a whole training lab (TRAINING_LABS)
 *   mk_<lessonId>   ONE Miking lesson (id exactly as the miking registry spells it)
 *   mxb_/mxa_<page> ONE Beginning / Advanced Mixing page (the page's short label,
 *                   lowercased, spaces → underscores: 'ADV EQ' → mxa_adv_eq)
 *   ear_<module>    ONE Ear Training module (EarModuleId)
 * Owner rulings 2026-10-13: Miking and Mixing are required LESSON BY LESSON —
 * only the lessons that credential's job uses. Ear Training lists only the
 * modules a credential needs. Mixing Guides and the Calculator Lab are never
 * required (a written reference and a tool, not lessons). Programs carry what
 * the job genuinely needs — roughly the union of their certificates' real
 * needs, never the sum of everything.
 *
 * The key → name/route lookup for the UI is src/data/labKeyCatalog.ts.
 *
 * ── Provenance ────────────────────────────────────────────────────────────
 * Derived 2026-10-13 from the LIVE database topic join (certificates 124 +
 * programs 36 = 160 active credentials, each joined through
 * certificate_topics / program_topics to its topic names), exported to
 * credentials_topics.tsv and embedded as the slug fixture in the ratchet test.
 * Every credential was judged on its actual TOPIC LIST, corroborated against
 * src/data/credentialCopy.ts and the lab/lesson blurbs. Started from the
 * 2026-09-20 route-keyed map: every row kept unless clearly wrong, converted
 * to server keys, tightened where noted in the owner summary, and widened
 * with the Miking / Mixing / Ear / Mastering / Drum Tuning / Sound Systems
 * lessons and labs that did not exist (or were not keyed) then.
 *
 * This is an editorial map, not a computed one. To change it: edit here, run
 * the generator, run the ratchet test.
 */

/** One requirement on a credential. `why` is shown to the learner. */
export type LabRequirement = { key: string; why: string };

// ── Shared lesson reasons ─────────────────────────────────────────────────
// A Miking lesson means the same thing to every credential that needs it, so
// its reason is written once here. Whole labs, Mixing pages and Ear modules
// carry a reason written for the credential they sit on.
const LESSON_WHY: Record<string, string> = {
  // Drum kit
  mk_M01: 'The kick is the foundation of a recorded kit, and where its microphone sits decides how much punch and how much boom you get.',
  mk_M02: 'The snare sits right beside the hi-hat, so placing its microphone is a balance between the drum and what leaks in.',
  mk_M03: 'Toms ring under the cymbals, and their microphones have to catch the drum without filling up with crash.',
  mk_M09: 'In many mixes, the overheads are the picture of the whole kit that the close microphones are added to.',
  mk_M10: 'Room microphones decide how big the kit sounds, and how much of the room comes with it.',
  mk_M11: 'A full kit is a plan — how many microphones, where the bleed goes, and whether it all holds up in mono.',
  // Cymbals
  mk_I01a: 'The hi-hat leaks into the snare microphone, so its own microphone is placed with that in mind.',
  mk_I01b: 'The ride carries the time on many songs and can vanish or swamp the overheads depending on placement.',
  mk_I01c: 'Crashes are caught first by the overheads; knowing when one needs its own microphone keeps a kit from getting crowded.',
  mk_I01d: 'A splash is a short accent among loud neighbours, and it is easy either to lose or to over-mic.',
  mk_I01e: 'A china is harsh and loud, and where its microphone sits decides whether it cuts through or hurts.',
  // Guitars, bass, keys, strings
  mk_C01: 'Acoustic guitar is one of the most-recorded sources there is, and small moves along the body change it completely.',
  mk_C02: 'Most electric guitar on a record is the amplifier’s speaker as the microphone hears it.',
  mk_C08: 'Electric bass is usually captured with a microphone and a direct signal together, and the two have to agree.',
  mk_SPK: 'Guitar and bass cabinets and the rotating speaker cabinet are miked from outside, with rules of their own.',
  mk_C11: 'Piano is a large source with many workable answers, and the lid, the strings and the soundboard all change what you get.',
  mk_C06a: 'Upright bass is quiet, low and easily swamped by bleed, so its microphone position matters more than most.',
  mk_C09a: 'Violin radiates upward and changes sharply with distance, so close and far placements sound like different instruments.',
  mk_C09c: 'Cello needs enough distance to hear the whole body without losing the bow’s detail.',
  // Winds and brass
  mk_A01: 'Trumpet is loud and directional, so a little off the bell’s axis is the difference between bright and painful.',
  mk_A02: 'Trombone has a moving slide in front of it, and the microphone has to stay out of its path.',
  mk_A05b: 'Alto saxophone sounds from its keys as well as its bell, so aiming only at the bell misses half the instrument.',
  mk_A05c: 'Tenor saxophone needs the same balance between bell and keys over a lower, bigger body.',
  mk_A06: 'Flute sounds mostly from the hole the player blows across and the open finger holes, and from the far end only on its lowest notes; breath noise comes with a close microphone.',
  mk_A08a: 'Clarinet sounds mostly from its finger holes, not its bell. Aiming only at the bell is the most common miking mistake on it.',
  // Voice and ensembles
  mk_E01: 'The lead vocal is the most important microphone in most sessions and shows, and distance from the lips decides its sound.',
  mk_E02: 'Background and harmony vocals are balanced by distance and spacing, and the wrong spacing turns them into phase trouble.',
  mk_E03: 'Rap and rhythmic vocals have fast consonants and sudden peaks that need a steady, close distance.',
  mk_E05: 'A choir is miked as areas, not people — the fewest microphones, spaced so they do not fight each other.',
  mk_E08: 'Acoustic duos and small groups are best served by one well-placed pair, with spot microphones only for a reason.',
  mk_E09: 'A band starts as a stage plot — the fewest microphones that do the job, with every open microphone counted.',
  mk_E11: 'String quartets and sections are captured by a pair in front first, and close support only where something is missing.',
  mk_E13: 'Mixed classical ensembles are built on one main array, with support microphones only for a named need.',
  mk_E14: 'A full orchestra is a main pair or tree over the podium first — everything else is added to that picture.',
  // Foley, field and measurement
  mk_F01: 'Footsteps are the backbone of a Foley track, and their microphone distance sets the perspective for everything else.',
  mk_F02: 'Clothing and movement passes are quiet and constant, and the microphone has to stay outside the whole gesture.',
  mk_F03: 'Props and object handling are recorded from outside the travel first, then closer on the part that sounds.',
  mk_F04: 'Impacts, liquids and textures need the attack captured cleanly without the microphone in the splash or the swing.',
  mk_F05: 'Foley perspective — near and far, one microphone or several — is what makes a sound sit in the picture.',
  mk_F06: 'Ambience is chosen by ear at a listening point off every path, protected from wind and checked in mono.',
  mk_F07: 'Wildlife and distant sources are recorded from a permitted point, with the microphone aimed at the call rather than the noise.',
  mk_F08: 'A moving source has to be captured across its whole pass, with the microphone outside the path and headroom for the closest moment.',
  mk_F09: 'Location speech is a boom just outside the frame and a body microphone, each on its own channel — the material everyone after you works from.',
  mk_F10: 'Binaural heads, Ambisonic microphones and multi-channel arrays capture space, and the channel map is what keeps them right.',
  mk_F11: 'A measurement is only as good as its microphone and its calibration, checked before and after.',
  mk_F12: 'Sound level and environmental noise are measured at set heights and positions, and the conclusion must be no bigger than the evidence.',
  mk_F13: "Room acoustics are measured from several seats, and each seat's reverb figure is kept on its own rather than averaged away.",
  mk_F14: 'Loudspeaker and system measurement depends on naming the measurement point and the delay before trusting any reading.',
  mk_F15: 'Machinery and product sound is measured over whole operating cycles from repeatable positions, from a safe boundary.',
  mk_F16: 'Scientific arrays depend on a marked origin, one shared clock and the right spacing, or they report positions that are not real.',
  // Broadcast and speech
  mk_B01: 'Hosts on a desk microphone, each on their own channel, are the heart of most radio and podcast studios.',
  mk_B05: 'Lavaliers and headsets are fitted, hidden and positioned on the wearer, and a few centimetres change the voice completely.',
  mk_B06: 'Panels, lecterns and press conferences need every voice heard with the fewest open microphones.',
  mk_B07: 'Voiceover and narration are recorded close and controlled, and a guest’s return feed must never contain their own voice.',
};

/** Miking lessons, reason from LESSON_WHY. */
const mk = (...ids: string[]): LabRequirement[] =>
  ids.map((id) => {
    const key = `mk_${id}`;
    const why = LESSON_WHY[key];
    if (!why) throw new Error(`labRequirements: no reason written for ${key}`);
    return { key, why };
  });

/** The drum kit with its cymbals — the owner's own example (2026-10-13). */
const KIT_AND_CYMBALS = mk('M01', 'M02', 'M03', 'M09', 'M10', 'M11', 'I01a', 'I01b', 'I01c', 'I01d', 'I01e');

/** Every Beginning Mixing page, in lab order. */
const BEGINNING_MIXING_ALL: LabRequirement[] = [
  { key: 'mxb_mix', why: 'Knowing what a mix is for — and what it cannot fix — comes before any fader moves.' },
  { key: 'mxb_prep', why: 'A prepared session is named, cleaned, phase-checked and saved before a single decision is made.' },
  { key: 'mxb_flow', why: 'Every routing decision later depends on knowing where the signal goes inside the session.' },
  { key: 'mxb_gain', why: 'Gain staging inside the mix keeps every processor working where it was designed to.' },
  { key: 'mxb_static', why: 'A static balance with faders and pan alone is the foundation every later move is judged against.' },
  { key: 'mxb_subtract', why: 'Most mixes improve by taking away, and knowing what to cut is a skill of its own.' },
  { key: 'mxb_pan', why: 'Panning is where each part lives left to right, and it decides how crowded the centre gets.' },
  { key: 'mxb_eq', why: 'EQ in context — on the track while the band plays — is how parts are fitted together.' },
  { key: 'mxb_comp', why: 'Compression holds a part steady in the mix without draining its life.' },
  { key: 'mxb_space', why: 'Reverb and delay give the mix its depth, and too much drowns it.' },
  { key: 'mxb_terms', why: 'Inserts, sends, returns, buses, groups and auxes are the six words every routing conversation uses.' },
  { key: 'mxb_sends', why: 'Pre- and post-fader sends decide whether an effect follows the fader — and whether a route sends the same sound twice by mistake.' },
  { key: 'mxb_auto', why: 'Automation is how a mix changes with the song instead of sitting still.' },
  { key: 'mxb_finish', why: 'Checking on other speakers and at matched level is how a mix is known to be finished.' },
  { key: 'mxb_export', why: 'A mix that is exported wrongly has not been delivered.' },
  { key: 'mxb_final', why: 'The final mix puts every step together on one song, start to finish.' },
];

/** Every Advanced Mixing page, in lab order. */
const ADVANCED_MIXING_ALL: LabRequirement[] = [
  { key: 'mxa_gate', why: 'The advanced lab starts by checking the beginning process is solid.' },
  { key: 'mxa_plan', why: 'A complex mix is planned before it is touched — what matters, what is broken, what is delivered.' },
  { key: 'mxa_session', why: 'Large sessions stay workable only with deliberate organisation.' },
  { key: 'mxa_groups', why: 'Groups, subgroups and VCAs are how a large mix is controlled with a few faders.' },
  { key: 'mxa_aux', why: 'Advanced auxiliary routing feeds effects and parallel paths without tangling the session.' },
  { key: 'mxa_parallel', why: 'Parallel and multibus processing adds weight and control without crushing the original.' },
  { key: 'mxa_adv_eq', why: 'Masking is two parts fighting for the same frequencies, and fixing it is advanced EQ.' },
  { key: 'mxa_adv_dyn', why: 'Advanced dynamics — sidechains, multiband and ducking — solve problems a single compressor cannot.' },
  { key: 'mxa_phase', why: 'Several microphones on one source have to be aligned in polarity and time before anything else helps.' },
  { key: 'mxa_depth', why: 'Front-to-back depth is built with level, tone and space together.' },
  { key: 'mxa_drive', why: 'Harmonic processing adds density and presence, and too much is easy to miss until it is too late.' },
  { key: 'mxa_width', why: 'Stereo width has to be built so the mix still holds up in mono.' },
  { key: 'mxa_motion', why: 'Advanced automation shapes a whole arrangement, not just a level ride.' },
  { key: 'mxa_bus', why: 'Mix-bus processing changes everything at once, so it has to be done on purpose.' },
  { key: 'mxa_qc', why: 'Translation and quality control are how a mix is proven to work away from your own speakers.' },
  { key: 'mxa_stems', why: 'Stems and alternate mixes are routine deliverables that have to match the main mix.' },
  { key: 'mxa_null', why: 'Stems should add back up to the mix, and the null test shows how close they come.' },
  { key: 'mxa_deliver', why: 'Professional delivery means the right files, names, levels and documentation, every time.' },
  { key: 'mxa_diagnose', why: 'Diagnosing a mix you did not make — what is wrong and why — is daily work.' },
  { key: 'mxa_final', why: 'The final repair puts the advanced process together on one real mix.' },
];

const pages = (from: readonly LabRequirement[], ...keys: string[]): LabRequirement[] =>
  keys.map((k) => {
    const r = from.find((x) => x.key === k);
    if (!r) throw new Error(`labRequirements: unknown mixing page ${k}`);
    return r;
  });
const beg = (...keys: string[]) => pages(BEGINNING_MIXING_ALL, ...keys);
const adv = (...keys: string[]) => pages(ADVANCED_MIXING_ALL, ...keys);

/**
 * Training labs and lessons required per credential slug, ON TOP OF the
 * universal Audio Fundamentals labs. Slugs with no requirement are omitted.
 */
export const LAB_REQUIREMENTS_BY_SLUG: Record<string, readonly LabRequirement[]> = {
  // ── Certificates ────────────────────────────────────────────────────────
  'cert-adr-and-voice-recording-v3': [
    { key: 'tr_speech', why: 'ADR is judged on whether the replaced line still sounds like speech, so you need to know how the voice makes its sounds.' },
    { key: 'tr_smart_processors', why: 'Close-miked replacement dialogue often needs de-essing before anyone will accept it.' },
    ...mk('B07', 'F09'),
  ],
  'cert-ai-voice-and-speech-synthesis-v3': [
    { key: 'tr_speech', why: 'You cannot judge synthetic speech without knowing how real voicing, vowels and formants behave.' },
  ],
  'cert-amplifier-technology-v3': [
    { key: 'tr_amp', why: 'Amplifier classes, the load the amp sees and where the power comes from are the subject of this certificate.' },
  ],
  'cert-analog-console-recording-v3': [
    ...beg('mxb_terms', 'mxb_sends'),
  ],
  'cert-analog-electronics-for-audio-v3': [
    { key: 'tr_amp', why: 'Transistors, transformers and amplifier topologies are where these components actually get used.' },
  ],
  'cert-assisted-listening-and-accessibility-v3': [
    { key: 'tr_speech', why: 'Assisted listening is measured in speech intelligibility, which starts with how speech is produced and heard.' },
  ],
  'cert-audio-archival-and-restoration-v3': [
    { key: 'tr_eq', why: 'Restoration is mostly filtering. The skill is knowing when a filter takes out the recording along with the noise.' },
    { key: 'ear_defect', why: 'Hum, hiss, crackle, clicks and dropouts have to be named by ear before they can be removed.' },
  ],
  'cert-audio-career-and-business-v3': [
    { key: 'tr_preprod', why: 'Scoping a job and costing it out — people, schedule, budget — is the business side of audio in practice.' },
  ],
  'cert-audio-measurement-and-analysis-v3': [
    ...mk('F11', 'F13', 'F14'),
  ],
  'cert-audio-troubleshooting-specialist-v3': [
    { key: 'tr_amp', why: 'Fault-finding inside analog gear means knowing what the circuit was supposed to be doing.' },
    { key: 'ear_defect', why: 'Troubleshooting starts by naming the symptom by ear — hum, buzz, crackle or dropout each point somewhere different.' },
  ],
  'cert-band-tracking-specialist-v3': [
    { key: 'tr_mic_select', why: 'Tracking a band is a run of microphone choices, each one defensible for its source.' },
    { key: 'tr_phase', why: 'A band in one room means many microphones hearing the same sources, and phase decides whether they add up.' },
    { key: 'tr_drum_tuning', why: 'The kit sound is decided at the drums before any microphone goes up.' },
    ...KIT_AND_CYMBALS,
    ...mk('C01', 'C02', 'C08', 'SPK', 'C11', 'E01', 'E02', 'E09'),
  ],
  'cert-bioacoustics-and-ecoacoustics-v3': [
    ...mk('F06', 'F07'),
  ],
  'cert-broadcast-engineer-v3': [
    { key: 'tr_compression', why: 'The air chain is built around compression and limiting — threshold, ratio and release shape how the station sounds.' },
    { key: 'tr_limiter', why: 'Broadcast is delivered to a hard ceiling and a loudness target.' },
    ...mk('B01'),
  ],
  'cert-car-audio-installation-v3': [
    { key: 'tr_amp', why: 'Matching amplifiers to speaker loads without damaging either is the core of a vehicle install.' },
  ],
  'cert-compression-and-dynamics-v3': [
    { key: 'tr_compression', why: 'This certificate is compression — threshold, ratio, attack, release and the envelope they produce.' },
    { key: 'tr_gate', why: 'Gating and downward expansion are the other half of dynamics control.' },
    { key: 'tr_limiter', why: 'Limiting, true-peak and loudness are where a dynamics chain ends up.' },
    { key: 'ear_compression', why: 'You have to hear compression — the envelope changing, not just the level — to set it well.' },
    ...adv('mxa_parallel', 'mxa_adv_dyn', 'mxa_bus'),
  ],
  'cert-corporate-and-event-production-v3': [
    { key: 'tr_preprod', why: 'An event lives or dies on the scope, crew and schedule agreed before load-in.' },
    { key: 'tr_sound_systems', why: 'Designing, wiring and tuning the event’s system is one of this certificate’s named topics.' },
    ...mk('B05', 'B06'),
  ],
  'cert-critical-listening-and-ear-training-v3': [
    { key: 'ear_frequency', why: 'Naming a frequency by ear is the bedrock of every tonal descriptor.' },
    { key: 'ear_eq', why: 'Hearing one EQ move — where, which way and how much — is what tonal description is for.' },
    { key: 'ear_band', why: 'The named bands are the vocabulary this certificate is tested in.' },
    { key: 'ear_noise', why: 'Noise colours and basic waveforms are the reference timbres everything else is described against.' },
    { key: 'ear_defect', why: 'Artifact identification is one of this certificate’s named topics.' },
    { key: 'ear_clipping', why: 'Clipping is the artifact most often missed until it is too late.' },
    { key: 'ear_comb', why: 'Comb filtering is the hollow, phasey artifact you will be asked to name and explain.' },
    { key: 'ear_compression', why: 'Over-compression is an artifact of the envelope, and you have to hear it to call it.' },
    { key: 'tr_envelope', why: 'Attack, decay and resonance are the descriptors this certificate is tested on.' },
    { key: 'tr_speech', why: 'Voice is the source you will be asked to describe most often.' },
  ],
  'cert-daw-power-user-v3': [
    ...beg('mxb_prep'),
    ...adv('mxa_session'),
  ],
  'cert-dialogue-editor-v3': [
    { key: 'tr_speech', why: 'Dialogue editing is cutting around plosives, sibilance and breaths — you need to know what makes them.' },
    { key: 'tr_postprod', why: 'Dialogue is edited inside a post workflow with a spotting session and a delivery at the end.' },
  ],
  'cert-distributed-and-paging-systems-v3': [
    { key: 'tr_amp', why: 'A distributed system is an amplifier loading problem before it is anything else.' },
  ],
  'cert-dj-and-club-sound-v3': [
    // DJ Systems Lab (owner 2026-10-18, built 2026-10-27 [MD:R3]): required by
    // both DJ credentials once all 24 screens exist. Server rows: Comp A, in
    // the safe order of Downloads6-10-27_R3_DJ_LAB_SQL_DRAFT.sql.
    { key: 'tr_dj', why: 'Connecting, gain-staging, cueing, mixing and fault-finding a DJ booth is the job this certificate names.' },
    { key: 'ear_band', why: 'DJ mixing moves whole bands in and out, and you have to hear which one you just moved.' },
  ],
  'cert-drum-mixing-v3': [
    { key: 'tr_eq', why: 'Separating a kit is frequency work before it is anything else.' },
    { key: 'tr_compression', why: 'Drum dynamics are controlled with compression without losing the groove.' },
    { key: 'tr_gate', why: 'Gating toms and snare is a standard drum-mix tool, and set badly it chops the performance.' },
    { key: 'tr_envelope', why: 'Transient shaping only makes sense once you can see attack and decay.' },
    ...adv('mxa_parallel', 'mxa_phase'),
  ],
  'cert-drum-recording-and-mixing-v3': [
    { key: 'tr_drum_tuning', why: 'A kit that is not tuned cannot be fixed with microphones or plugins.' },
    { key: 'tr_mic_select', why: 'A kit is a set of microphone choices, one per source.' },
    { key: 'tr_phase', why: 'Several microphones on one kit is the classic phase problem — get it wrong and nothing else helps.' },
    { key: 'ear_polarity', why: 'Hearing a flipped snare-bottom or overhead pair is the drum engineer’s survival skill.' },
    { key: 'tr_compression', why: 'Kit balance is held together with compression.' },
    ...KIT_AND_CYMBALS,
  ],
  'cert-effects-and-pedal-design-v3': [
    { key: 'tr_distortion', why: 'A drive pedal is a distortion circuit — you need to hear what clipping and saturation actually do.' },
    { key: 'tr_amp', why: 'Pedals are designed around the amplifier stage they feed.' },
  ],
  'cert-electronics-repair-technician-v3': [
    { key: 'tr_amp', why: 'Most audio repair is amplifier repair, and you need the working circuit in your head first.' },
    { key: 'ear_defect', why: 'A repair starts with naming the fault by ear — hum, buzz, crackle and dropout point to different causes.' },
  ],
  'cert-eq-and-tonal-shaping-v3': [
    { key: 'tr_eq', why: 'This certificate is equalization — see it, hear it, and diagnose it.' },
    { key: 'ear_frequency', why: 'Tonal shaping starts with knowing a frequency by ear.' },
    { key: 'ear_eq', why: 'Tonal shaping is worthless if you cannot hear which frequency moved, which way, and by how much.' },
    { key: 'ear_band', why: 'The named bands are how tonal shaping is talked about and asked for.' },
    ...adv('mxa_adv_eq'),
  ],
  'cert-field-and-location-recording-v3': [
    { key: 'tr_mic_select', why: 'On location the microphone choice is made once and cannot be undone.' },
    ...mk('F06', 'F08', 'F09'),
  ],
  'cert-foh-engineering-v3': [
    { key: 'tr_eq', why: 'Front of house is frequency decisions made fast, on a live console.' },
    { key: 'tr_compression', why: 'Holding a live vocal and a live kit in place is compression work.' },
    ...beg('mxb_terms', 'mxb_sends'),
  ],
  'cert-foley-performance-and-recording-v3': [
    { key: 'tr_postprod', why: 'Foley is recorded to picture and delivered into a post session to a specification.' },
    ...mk('F01', 'F02', 'F03', 'F04', 'F05'),
  ],
  'cert-forensic-audio-v3': [
    { key: 'tr_speech', why: 'Forensic work is almost always about recovering speech, so speech production is the subject.' },
    { key: 'tr_eq', why: 'Enhancement is filtering. The skill is knowing when a filter takes out evidence along with the noise.' },
    { key: 'ear_defect', why: 'Dropouts, clicks and discontinuities can be signs of an edit, though they have other causes too, and you have to hear them.' },
  ],
  'cert-gain-staging-and-signal-flow-v3': [
    ...beg('mxb_terms', 'mxb_sends'),
    { key: 'ear_clipping', why: 'Clipping is what bad gain staging sounds like, and you have to catch it by ear.' },
  ],
  'cert-game-audio-v3': [
    { key: 'tr_binaural', why: 'Game audio places sound objects around the player. On headphones, they are heard through binaural rendering.' },
  ],
  'cert-guitar-tone-and-recording-v3': [
    { key: 'tr_mic_select', why: 'Guitar tone on a record is largely the microphone in front of the cabinet.' },
    { key: 'tr_distortion', why: 'The tone itself is harmonic distortion — you should be able to hear which kind.' },
    ...mk('C01', 'C02', 'C08', 'SPK'),
  ],
  'cert-home-studio-starter-v3': [
    { key: 'tr_mic_select', why: 'The first real decision in a home studio is which microphone, and why.' },
    ...mk('E01'),
  ],
  'cert-immersive-audio-production-v3': [
    { key: 'tr_stereo', why: 'An immersive mix still has to hold up folded down to stereo and mono.' },
    { key: 'tr_binaural', why: 'For streamed music, most listeners will hear your immersive mix binaurally, on headphones.' },
  ],
  'cert-instrument-recognition-percussion-v3': [
    { key: 'tr_envelope', why: 'Percussion is identified by its attack and decay far more than by its pitch.' },
  ],
  'cert-instrument-recognition-winds-and-brass-v3': [
    { key: 'tr_envelope', why: 'Wind and brass articulation lives in the attack and in how the note is released.' },
    { key: 'tr_harmonic', why: 'Much of what separates an oboe from a trumpet is its harmonic spectrum.' },
  ],
  'cert-instrument-sound-identification-v3': [
    { key: 'tr_harmonic', why: 'Timbre is largely harmonic content, and this is where you see it.' },
    { key: 'tr_envelope', why: 'Two instruments with a similar spectrum are still told apart by their envelopes.' },
  ],
  'cert-live-mixing-specialist-v3': [
    { key: 'tr_eq', why: 'Live mixing is frequency decisions made in real time.' },
    { key: 'tr_compression', why: 'Live sources are held in place with compression, not with the fader alone.' },
    { key: 'ear_frequency', why: 'Finding a feeding-back or ringing frequency by ear, fast, is a live mixer’s daily job.' },
    ...beg('mxb_sends'),
  ],
  'cert-live-sound-system-engineer-v3': [
    { key: 'tr_sound_systems', why: 'Designing, wiring, testing, tuning and fault-finding a live system is this certificate.' },
    { key: 'tr_phase', why: 'Aligning subs to tops and the main speakers to the delay speakers is phase work.' },
    { key: 'tr_eq', why: 'Tuning a deployed system is filtering it to the room.' },
  ],
  'cert-live-wireless-mic-systems-v3': [
    ...mk('B05'),
  ],
  'cert-localization-and-dubbing-v3': [
    { key: 'tr_speech', why: 'Sync and adaptation are judged against how speech is actually articulated.' },
    { key: 'tr_postprod', why: 'A dub is a delivery to a specification, assembled in a post workflow.' },
    ...mk('B07'),
  ],
  'cert-loudness-and-delivery-specialist-v3': [
    { key: 'tr_limiter', why: 'Delivery to a loudness target and a true-peak ceiling is exactly what this lab teaches.' },
    ...adv('mxa_qc', 'mxa_deliver'),
  ],
  'cert-loudspeaker-design-engineer-v3': [
    { key: 'tr_phase', why: 'A crossover only works if the drivers add up in phase where they overlap.' },
  ],
  'cert-loudspeaker-systems-and-measurement-v3': [
    { key: 'tr_amp', why: 'Matching amplifier power and damping to a driver safely is part of specifying the system.' },
    ...mk('F11', 'F14'),
  ],
  'cert-mastering-engineer-v3': [
    { key: 'tr_mastering', why: 'The whole mastering stage — listening, deciding and delivering to the destination’s spec — is this certificate.' },
    { key: 'tr_eq', why: 'Mastering EQ moves are small and have to be heard exactly.' },
    { key: 'tr_compression', why: 'Mastering dynamics work starts with knowing what a compressor does to the envelope.' },
    { key: 'tr_limiter', why: 'The last stage of a master is a ceiling and a loudness target.' },
    { key: 'ear_eq', why: 'A mastering engineer has to hear a one- or two-decibel EQ move and name it.' },
    { key: 'ear_clipping', why: 'Clipping has to be caught before the client — or the listener — hears it.' },
  ],
  'cert-microphone-building-v3': [
    { key: 'tr_mic_select', why: 'Building a microphone means designing to the specifications and patterns this lab teaches you to read.' },
  ],
  'cert-microphone-technology-specialist-v3': [
    { key: 'tr_mic_select', why: 'Reading the specification sheet and choosing on it is the whole certificate.' },
  ],
  'cert-mix-bus-and-automation-v3': [
    { key: 'tr_compression', why: 'Bus processing is most often compression applied to a whole group at once.' },
    { key: 'tr_limiter', why: 'Mix-bus loudness decisions need the ceiling understood.' },
    ...beg('mxb_auto'),
    ...adv('mxa_groups', 'mxa_aux', 'mxa_parallel', 'mxa_bus', 'mxa_motion'),
  ],
  'cert-mixing-console-specialist-v3': [
    ...beg('mxb_terms', 'mxb_sends'),
    ...adv('mxa_groups'),
  ],
  'cert-mixing-engineer-v3': [
    ...BEGINNING_MIXING_ALL,
    ...adv('mxa_groups', 'mxa_parallel', 'mxa_adv_eq', 'mxa_adv_dyn', 'mxa_phase', 'mxa_depth', 'mxa_qc'),
    { key: 'tr_eq', why: 'Fitting instruments together is frequency work.' },
  ],
  'cert-monitor-engineering-iem-and-wedges-v3': [
    { key: 'tr_eq', why: 'Ringing out a wedge is narrow, fast, deliberate filtering.' },
    { key: 'ear_frequency', why: 'Ringing out means naming the feeding-back frequency by ear before the band hears it.' },
    ...beg('mxb_sends'),
  ],
  'cert-nearfield-acoustic-holography-v3': [
    { key: 'tr_cymatics', why: 'Chladni plates and cymatic patterns are the hands-on half of this certificate’s sound-field visualization topic.' },
    ...mk('F11', 'F16'),
  ],
  'cert-noise-control-engineering-v3': [
    ...mk('F11', 'F12', 'F15'),
  ],
  'cert-noise-law-and-compliance-v3': [
    ...mk('F11', 'F12'),
  ],
  'cert-orchestral-recording-and-mixing-v3': [
    { key: 'tr_mic_select', why: 'An ensemble session is decided by which microphones go up.' },
    { key: 'tr_stereo', why: 'Ensemble recording is a stereo image you have to build and then check.' },
    { key: 'tr_reverb', why: 'The hall is part of the sound, whether it is real or added.' },
    ...mk('E11', 'E13', 'E14', 'E05'),
  ],
  'cert-pa-loudspeaker-systems-v3': [
    { key: 'tr_sound_systems', why: 'Deploying, wiring and tuning a PA in a real venue is two of this certificate’s three topics.' },
    { key: 'tr_phase', why: 'Boxes that overlap in coverage combine by phase, not by wishful thinking.' },
    { key: 'tr_eq', why: 'System tuning is largely filtering the rig to the room, once aim and delay are set.' },
  ],
  'cert-plugin-and-processing-power-user-v3': [
    ...adv('mxa_parallel', 'mxa_bus'),
  ],
  'cert-podcast-production-v3': [
    { key: 'tr_speech', why: 'A podcast is speech, and intelligibility is the product.' },
    { key: 'tr_compression', why: 'Spoken word is held at a consistent level with compression.' },
    { key: 'tr_limiter', why: 'Podcasts are delivered to a platform loudness target.' },
    ...mk('B01', 'B07'),
  ],
  'cert-preamp-and-converter-design-v3': [
    { key: 'tr_amp', why: 'A preamp is a gain stage — the same devices, topologies and loading.' },
  ],
  'cert-psychoacoustics-and-listening-v3': [
    { key: 'tr_speech', why: 'Speech perception is one of the three topics this certificate is built on.' },
    { key: 'ear_loudness', why: 'Loudness perception is easier to trust once you have measured how small a level change you can actually hear.' },
  ],
  'cert-re-recording-mixer-v3': [
    { key: 'tr_postprod', why: 'The final mix is the last stage of a post workflow with a defined deliverable.' },
    ...adv('mxa_groups', 'mxa_stems', 'mxa_null', 'mxa_deliver'),
  ],
  'cert-room-acoustics-and-treatment-v3': [
    ...mk('F13'),
  ],
  'cert-seismoacoustics-and-infrasound-v3': [
    ...mk('F16'),
  ],
  'cert-session-editing-and-comping-v3': [
    { key: 'tr_postprod', why: 'Editing and comping sit inside a session workflow that has to survive handoff.' },
    ...adv('mxa_session'),
  ],
  'cert-sound-design-and-sfx-v3': [
    { key: 'tr_reverb', why: 'Placing an effect in a space is most of what makes it believable.' },
    { key: 'tr_delay', why: 'Time-based manipulation is the sound designer’s first tool.' },
    { key: 'tr_postprod', why: 'Effects are cut to picture and delivered into a post session.' },
    ...mk('F03', 'F04', 'F06'),
  ],
  'cert-sound-design-with-synthesis-v3': [
    { key: 'tr_oscillator', why: 'Synthesis starts with what the oscillator is actually producing.' },
    { key: 'tr_modular', why: 'Oscillator, filter and amplifier, shaped by an LFO and an envelope, is the plan behind most synthesisers.' },
    { key: 'tr_fm', why: 'FM is a widely used technique and one of the least understood.' },
  ],
  /**
   * ⛔ OWNER OVERRULE, 2026-09-20, and the glossary backs it: eleven Cymatics /
   * Chladni terms sit in gs 4570 "Acoustic Imaging & Sound-Field
   * Visualization", a required topic here — the topic's own vocabulary.
   */
  'cert-sound-visualization-and-imaging-v3': [
    { key: 'tr_cymatics', why: 'Chladni plates and cymatic patterns are the hands-on half of this credential’s sound-field visualization topic.' },
  ],
  'cert-source-separation-and-restoration-v3': [
    { key: 'ear_defect', why: 'Restoration starts by hearing and naming the defect you are about to remove.' },
  ],
  'cert-speech-and-voice-science-v3': [
    { key: 'tr_speech', why: 'Anatomy, voicing, vowels and formants are the subject of this certificate.' },
  ],
  'cert-streaming-mastering-and-loudness-v3': [
    { key: 'tr_mastering', why: 'Mastering for a streaming destination — loudness at matched level and its current spec — is this certificate.' },
    { key: 'tr_limiter', why: 'Streaming delivery is a true-peak ceiling and a loudness target.' },
    { key: 'tr_compression', why: 'Hitting that target without crushing the music is a compression decision.' },
  ],
  'cert-studio-miking-specialist-v3': [
    { key: 'tr_mic_select', why: 'Choosing the microphone for the source is the certificate.' },
    { key: 'tr_phase', why: 'Close-miking several sources at once is a phase problem you have to be able to hear.' },
    ...KIT_AND_CYMBALS,
    ...mk('C01', 'C02', 'C08', 'SPK', 'C06a', 'C09a', 'C09c', 'C11'),
    ...mk('A01', 'A02', 'A05b', 'A05c', 'A06', 'A08a'),
    ...mk('E01', 'E02'),
  ],
  'cert-studio-recording-engineer-v3': [
    { key: 'tr_mic_select', why: 'The recording is decided at the microphone, before any processing.' },
    { key: 'tr_phase', why: 'Several microphones in one room is the recurring problem of studio recording.' },
    ...mk('M01', 'M02', 'M09', 'M11', 'C01', 'C02', 'C08', 'C11', 'E01'),
  ],
  'cert-system-tuning-and-alignment-v3': [
    { key: 'tr_phase', why: 'Alignment is phase — this is where you see what happens when two sources combine.' },
    { key: 'tr_eq', why: 'Tuning a system is filtering it, with a measurement to justify each move.' },
    ...mk('F11', 'F14'),
  ],
  'cert-tape-restoration-v3': [
    { key: 'ear_defect', why: 'Dropouts, hiss and print-through have to be named by ear before a tape can be restored.' },
  ],
  'cert-test-and-calibration-technician-v3': [
    ...mk('F11'),
  ],
  'cert-theatrical-sound-v3': [
    ...mk('B05'),
  ],
  'cert-time-based-and-creative-fx-v3': [
    { key: 'tr_reverb', why: 'Reverb is one of the two named topics of this certificate.' },
    { key: 'tr_delay', why: 'Delay is the other, and chorus and flanging below are built from it.' },
    { key: 'tr_chorus', why: 'Chorus is a modulated delay — the first of the three sweeping effects, heard as shimmer more than a sweeping notch.' },
    { key: 'tr_flanger', why: 'Flanging is the same idea at a shorter delay, and it sounds clearly different from chorus.' },
    { key: 'tr_phaser', why: 'Phasing uses all-pass stages instead of delay, and the difference matters in a mix.' },
    { key: 'ear_delay', why: 'Setting a delay to the song means hearing its time, not reading it.' },
    { key: 'ear_reverb', why: 'Telling a room from a plate from a hall by ear is what choosing a reverb depends on.' },
  ],
  'cert-tube-amp-building-v3': [
    { key: 'tr_tube', why: 'How a tube amplifies by controlling electron flow is the thing you are building.' },
    { key: 'tr_amp', why: 'The amplifier around the tube — classes, loading, transformers — has to be understood too.' },
  ],
  'cert-tube-audio-equipment-specialist-v3': [
    { key: 'tr_tube', why: 'Tube behaviour is the specialism.' },
    { key: 'tr_amp', why: 'Servicing tube gear means knowing the amplifier stage the tube sits in.' },
  ],
  'cert-vinyl-and-disc-mastering-v3': [
    { key: 'tr_mastering', why: 'Disc mastering starts from the mastering chain this lab teaches.' },
    { key: 'tr_eq', why: 'Cutting a lacquer is a set of frequency constraints applied with filters.' },
    { key: 'tr_phase', why: 'Out-of-phase bass makes the groove depth swing too far to cut or play safely — mono compatibility is a physical limit here, not a preference.' },
  ],
  'cert-vocal-mixing-specialist-v3': [
    { key: 'tr_smart_processors', why: 'De-essing is a process most vocal mixes need and most people set wrong.' },
    { key: 'tr_compression', why: 'A vocal sits in a mix because of what the compressor is doing to its envelope.' },
    { key: 'tr_reverb', why: 'Where the vocal sits in space is a reverb decision.' },
  ],
  'cert-vocal-recording-and-production-v3': [
    { key: 'tr_mic_select', why: 'The vocal microphone choice shapes everything downstream.' },
    { key: 'tr_smart_processors', why: 'Sibilance starts in the mouth, the microphone can make it worse, and it is dealt with here.' },
    { key: 'tr_autotune', why: 'In most pop work, tuning a vocal is an expected deliverable, and it has to be done on purpose.' },
    ...mk('E01', 'E02', 'E03'),
  ],
  'cert-vr-ar-spatial-sound-v3': [
    { key: 'tr_binaural', why: 'VR and AR audio is binaural — moving sound objects around the listener’s head.' },
    ...mk('F10'),
  ],
  'cert-worship-audio-v3': [
    { key: 'tr_eq', why: 'A worship room is mixed with frequency decisions made live.' },
    { key: 'tr_compression', why: 'Speech and band in the same service need dynamics control.' },
    ...mk('E01', 'E05', 'B06'),
  ],

  // ── Programs ────────────────────────────────────────────────────────────
  'prog-acoustics-and-psychoacoustics-research-v3': [
    { key: 'tr_speech', why: 'Speech perception is one of this program’s named topics and needs the production side first.' },
    ...mk('F11', 'F13'),
  ],
  'prog-ai-audio-production-v3': [
    { key: 'tr_oscillator', why: 'Synthesis is one of this program’s topics, and generated audio is judged against what an oscillator really produces.' },
    { key: 'tr_speech', why: 'Voice is the output AI audio is most often asked for, and the hardest to judge.' },
  ],
  'prog-analog-and-vintage-audio-engineering-v3': [
    { key: 'tr_tube', why: 'Much vintage audio is tube audio — start with how the tube amplifies.' },
    { key: 'tr_amp', why: 'Classes, loading and transformers are the rest of the analog signal path.' },
  ],
  'prog-applied-and-physical-acoustics-science-v3': [
    ...mk('F11', 'F16'),
  ],
  'prog-audio-acoustics-and-system-optimization-v3': [
    { key: 'tr_sound_systems', why: 'Deploying and tuning a real system is where this program’s measurements are put to work.' },
    { key: 'tr_phase', why: 'Optimization is combining sources correctly, which is a phase question.' },
    { key: 'tr_eq', why: 'System EQ is the tool the measurement is feeding.' },
    ...mk('F11', 'F13', 'F14'),
  ],
  'prog-audio-dsp-and-machine-learning-v3': [
    { key: 'tr_oscillator', why: 'Synthesis is one of this program’s topics, and band-limited oscillators are where it starts.' },
    { key: 'tr_speech', why: 'Speech is the signal most audio machine learning is pointed at.' },
  ],
  'prog-audio-electronics-service-and-repair-v3': [
    { key: 'tr_amp', why: 'Most of the gear on the bench is an amplifier of some kind.' },
    { key: 'tr_tube', why: 'Tube equipment is a routine part of a repair bench and behaves differently.' },
    { key: 'ear_defect', why: 'A repair starts with naming the fault by ear — hum, buzz, crackle and dropout point to different causes.' },
  ],
  'prog-audio-preservation-restoration-and-archival-science-v3': [
    { key: 'tr_eq', why: 'Restoration is filtering. The skill is knowing when a filter is harming the record.' },
    { key: 'ear_defect', why: 'Hum, hiss, crackle, clicks and dropouts have to be named by ear before they can be removed.' },
  ],
  'prog-audio-standards-and-technical-compliance-v3': [
    ...mk('F11', 'F12'),
  ],
  'prog-audio-systems-engineering-v3': [
    { key: 'tr_sound_systems', why: 'Designing, wiring, testing and tuning a complete system is the core of this program.' },
    { key: 'tr_amp', why: 'Specifying amplification to a loudspeaker load is core to system design.' },
    { key: 'tr_phase', why: 'Systems that overlap in coverage combine by phase.' },
    ...mk('F14'),
  ],
  'prog-bioacoustics-and-ecoacoustics-v3': [
    ...mk('F06', 'F07', 'F16'),
  ],
  'prog-broadcast-podcast-and-streaming-audio-v3': [
    { key: 'tr_speech', why: 'Everything in this program is carried by the voice.' },
    { key: 'tr_eq', why: 'Broadcast tonal shaping is filtering with a house sound to hit.' },
    { key: 'tr_compression', why: 'The air chain is built around compression and limiting.' },
    { key: 'tr_limiter', why: 'Every one of these outputs is delivered to a loudness target.' },
    ...mk('B01', 'B07'),
  ],
  'prog-commercial-audio-and-av-systems-v3': [
    { key: 'tr_sound_systems', why: 'Designing, wiring and tuning a system end to end is what an install is.' },
    { key: 'tr_amp', why: 'Install work is an amplifier and loading problem before it is anything else.' },
    { key: 'tr_phase', why: 'Distributed loudspeakers overlap, and overlap is phase.' },
    ...mk('B06'),
  ],
  'prog-concert-and-festival-production-v3': [
    { key: 'tr_sound_systems', why: 'A concert rig is designed, wired, tuned and fault-found on a deadline.' },
    { key: 'tr_eq', why: 'Tuning a rig to a venue is largely filtering it, once aim and delay are set.' },
    { key: 'tr_phase', why: 'Sub-to-top alignment decides whether the low end works at all.' },
    { key: 'ear_frequency', why: 'Finding a feeding-back frequency by ear, fast, is daily work on a show.' },
    ...beg('mxb_sends'),
    ...mk('E09'),
  ],
  'prog-dj-and-club-audio-v3': [
    { key: 'tr_dj', why: 'Building, running and troubleshooting the DJ booth and its feed to the venue is the core of this program.' },
    { key: 'tr_eq', why: 'Club mixing and club system tuning are both frequency work.' },
    { key: 'ear_band', why: 'DJ mixing moves whole bands in and out, and you have to hear which one you just moved.' },
  ],
  'prog-earth-space-and-seismoacoustics-v3': [
    ...mk('F16'),
  ],
  'prog-electronic-music-production-and-synthesis-v3': [
    { key: 'tr_oscillator', why: 'Every sound in this program starts at an oscillator.' },
    { key: 'tr_modular', why: 'Oscillator, filter, amplifier, LFO and envelope is the patch behind most synthesisers you will use.' },
    { key: 'tr_eq', why: 'Synthesised parts are fitted together with frequency decisions.' },
    { key: 'tr_compression', why: 'Electronic music is built on deliberate dynamics control.' },
    ...beg('mxb_static', 'mxb_pan', 'mxb_eq', 'mxb_comp', 'mxb_space', 'mxb_auto', 'mxb_export'),
  ],
  'prog-environmental-noise-and-regulatory-acoustics-v3': [
    ...mk('F11', 'F12'),
  ],
  'prog-film-scoring-and-music-production-v3': [
    { key: 'tr_stereo', why: 'Orchestral and ensemble work is a stereo image you build on purpose.' },
    { key: 'tr_reverb', why: 'A score lives in a space, real or added.' },
    { key: 'tr_postprod', why: 'The score is delivered into a picture workflow to a specification.' },
    ...mk('E13', 'E14'),
  ],
  'prog-forensic-and-investigative-audio-v3': [
    { key: 'tr_speech', why: 'The evidence is nearly always speech.' },
    { key: 'tr_eq', why: 'Enhancement is filtering, and it has to be justifiable.' },
    { key: 'ear_defect', why: 'Dropouts, clicks and discontinuities can be signs of an edit, though they have other causes too, and you have to hear them.' },
  ],
  'prog-game-and-interactive-audio-v3': [
    { key: 'tr_binaural', why: 'Interactive audio places objects around the player’s head.' },
    { key: 'tr_reverb', why: 'Game spaces are sold to the player with reverb.' },
    { key: 'tr_postprod', why: 'Assets are still delivered to a specification with an archive behind them.' },
  ],
  'prog-hearing-science-and-psychoacoustics-v3': [
    { key: 'tr_speech', why: 'Speech perception is central to this program.' },
    { key: 'tr_envelope', why: 'Attack, decay and resonance identification is one of its named topics.' },
    { key: 'tr_harmonic', why: 'Instrument recognition is one of its topics, and timbre is largely harmonic content.' },
    { key: 'ear_frequency', why: 'Pitch and frequency perception are easier to reason about once you have tested your own ears on them.' },
    { key: 'ear_loudness', why: 'Loudness perception is easier to trust once you have measured how small a level change you can actually hear.' },
  ],
  'prog-immersive-and-spatial-audio-v3': [
    { key: 'tr_binaural', why: 'Most immersive listening happens on headphones, binaurally.' },
    { key: 'tr_stereo', why: 'Immersive mixes are still checked folded to stereo and mono.' },
    { key: 'tr_reverb', why: 'Spatial audio starts with direction cues; reverb and early reflections add the distance and the room.' },
    ...mk('F10'),
  ],
  'prog-live-sound-engineering-v3': [
    { key: 'tr_sound_systems', why: 'Designing, wiring, tuning and fault-finding the system is half of live sound.' },
    { key: 'tr_eq', why: 'Live sound is frequency decisions made under time pressure.' },
    { key: 'tr_compression', why: 'Live sources are held in place with dynamics control.' },
    { key: 'tr_phase', why: 'System alignment and multi-microphone sources are both phase problems.' },
    { key: 'ear_frequency', why: 'Finding a feeding-back frequency by ear, fast, is daily work on a show.' },
    ...beg('mxb_terms', 'mxb_sends'),
    ...mk('E01', 'E09', 'B05'),
  ],
  'prog-medical-and-clinical-acoustics-v3': [
    { key: 'tr_speech', why: 'Clinical audio work is dominated by speech and the voice.' },
  ],
  'prog-mixing-and-mastering-engineering-v3': [
    ...BEGINNING_MIXING_ALL,
    ...ADVANCED_MIXING_ALL,
    { key: 'tr_mastering', why: 'Mastering is half of this program — listening, deciding and delivering to spec.' },
    { key: 'tr_eq', why: 'Both mixing and mastering are carried by frequency decisions.' },
    { key: 'tr_compression', why: 'Dynamics control runs from the first channel to the master bus.' },
    { key: 'tr_limiter', why: 'Mastering ends at a ceiling and a loudness target.' },
    { key: 'ear_eq', why: 'Both jobs depend on hearing one EQ move exactly — where, which way, how much.' },
    { key: 'ear_compression', why: 'You have to hear compression on the envelope to set it, and to catch it overdone.' },
    { key: 'ear_clipping', why: 'Clipping has to be caught before the client — or the listener — hears it.' },
  ],
  'prog-music-production-v3': [
    ...BEGINNING_MIXING_ALL,
    { key: 'tr_eq', why: 'Arranging parts so they coexist is frequency work.' },
    { key: 'tr_compression', why: 'Dynamics control is used on nearly every element.' },
    { key: 'tr_oscillator', why: 'Synthesis is one of this program’s named topics and starts at the oscillator.' },
    ...mk('E01'),
  ],
  'prog-post-production-audio-v3': [
    { key: 'tr_postprod', why: 'This program is the post workflow, from ingest to an accepted delivery.' },
    { key: 'tr_speech', why: 'Dialogue, ADR and dubbing all rest on how speech is produced.' },
    ...adv('mxa_groups', 'mxa_stems', 'mxa_null', 'mxa_deliver'),
    ...mk('F09', 'B07'),
  ],
  /** Same evidence as the certificate above — gs 4570 is a required topic here
   *  too, and eleven of its glossary terms are cymatics vocabulary. */
  'prog-sound-visualization-and-acoustic-imaging-v3': [
    { key: 'tr_cymatics', why: 'Chladni plates and cymatic patterns are the hands-on half of this program’s sound-field visualization topic.' },
    ...mk('F11', 'F16'),
  ],
  'prog-studio-recording-engineering-v3': [
    { key: 'tr_mic_select', why: 'The record is decided at the microphone.' },
    { key: 'tr_phase', why: 'Multiple microphones on one source is the recurring problem of studio recording.' },
    { key: 'tr_preprod', why: 'Sessions that were not planned run over and lose the client.' },
    { key: 'tr_drum_tuning', why: 'The kit sound is decided at the drums before any microphone goes up.' },
    ...KIT_AND_CYMBALS,
    ...mk('C01', 'C02', 'C08', 'SPK', 'C11', 'E01', 'E02', 'E08'),
  ],
  'prog-theater-venue-and-entertainment-audio-v3': [
    { key: 'tr_sound_systems', why: 'A venue system is designed, wired, tuned and kept working show after show.' },
    { key: 'tr_eq', why: 'Venue systems and body-microphone channels are both tuned with filters.' },
    ...mk('B05'),
  ],
  'prog-transducer-and-audio-hardware-engineering-v3': [
    { key: 'tr_amp', why: 'Driving a transducer is an amplifier and loading problem.' },
    { key: 'tr_phase', why: 'A crossover only works if the drivers add up in phase where they overlap.' },
    ...mk('F14'),
  ],
  'prog-ultrasonics-and-industrial-acoustics-v3': [
    ...mk('F11', 'F15'),
  ],
  'prog-vehicle-and-consumer-audio-systems-v3': [
    { key: 'tr_amp', why: 'Consumer and vehicle systems are specified around the amplifier and the load it sees.' },
  ],
  'prog-worship-audio-production-v3': [
    { key: 'tr_eq', why: 'A worship room is tuned and mixed with frequency decisions.' },
    { key: 'tr_compression', why: 'Speech and music in the same service need dynamics control.' },
    { key: 'tr_mic_select', why: 'Choosing microphones for speakers, singers and an ensemble is a weekly decision here.' },
    ...beg('mxb_sends'),
    ...mk('E01', 'E05', 'B06'),
  ],
};

const EMPTY: readonly LabRequirement[] = [];

/**
 * The training labs and lessons a credential requires beyond the universal
 * Audio Fundamentals labs. Returns an empty array for a credential with no
 * requirement (the common case) and for an unknown slug.
 */
export function labRequirementsFor(slug: string): readonly LabRequirement[] {
  return LAB_REQUIREMENTS_BY_SLUG[slug] ?? EMPTY;
}
