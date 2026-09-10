/**
 * subjectMeta — per-subject one-sentence description + career applications for
 * the Curriculum tree (user request 2026-07-22).
 *
 * RE-KEYED to the LIVE v3 subject names 2026-09-10 (pulled from the active
 * curriculum `achievements.subject`): 50 subjects across 18 fields. The old map
 * was keyed to the retired v2 subject names and mostly didn't match v3.
 *
 * PLACEHOLDER COPY — reasonable first-pass descriptions and career mappings,
 * NOT yet owner-ratified. `SUBJECT_META_RATIFIED` is still false, so none of
 * this renders until the owner reviews/replaces the copy and flips the flag
 * (ratified-copy rule). Keys MUST match the v3 `subject` strings exactly.
 */
export type SubjectMeta = { description: string; careers: string };

export const SUBJECT_META: Record<string, SubjectMeta> = {
  // ── Acoustics & Measurement ──────────────────────────────────────────────
  'Acoustics & Room Behavior': {
    description: 'How sound behaves inside a space — reflections, room modes, reverberation, and absorption — and why the same system sounds different room to room.',
    careers: 'Acoustician, system tech, studio designer, install/AV designer.',
  },
  'Measurement & Analysis': {
    description: 'Measuring and analyzing sound and systems — SPL, frequency response, impulse/RT60, and tuning with real instruments.',
    careers: 'System engineer, acoustician, QC/test technician, install tuner.',
  },

  // ── Acoustics Science & Applied Research ─────────────────────────────────
  'Forensic & Investigative': {
    description: 'Applying acoustics to evidence and investigation — audio authentication, enhancement, and gunshot or voice analysis.',
    careers: 'Forensic audio analyst, expert witness, law-enforcement lab tech.',
  },
  'Human & Heritage Acoustics': {
    description: 'Acoustics of people and places — speech, performance-space sound, archaeoacoustics, and heritage-site preservation.',
    careers: 'Research acoustician, heritage consultant, academic, museum/AV specialist.',
  },
  'Life, Earth & Space Acoustics': {
    description: 'Sound in the natural and physical world — bioacoustics, underwater and seismic sound, and atmospheric or space acoustics.',
    careers: 'Bioacoustics researcher, environmental scientist, sonar/defense, academia.',
  },
  'Physical & Advanced Acoustics': {
    description: 'The physics underneath it all — wave behavior, nonlinear acoustics, ultrasonics, and advanced modeling.',
    careers: 'Research scientist, acoustic engineer, transducer/R&D, academia.',
  },
  'Sound Visualization & Imaging': {
    description: 'Seeing sound — beamforming, acoustic cameras, holography, and spatial sound-field imaging.',
    careers: 'Acoustic-imaging engineer, NVH specialist, R&D, test & measurement.',
  },

  // ── AI Audio ─────────────────────────────────────────────────────────────
  'AI Audio': {
    description: 'AI foundations for audio — generative music and sound, voice and speech models, and machine listening.',
    careers: 'AI-audio developer, researcher, producer, emerging-tech specialist.',
  },

  // ── Audio Equipment & Signal Chain ───────────────────────────────────────
  'Audio Networking': {
    description: 'Moving audio over IP and digital links — Dante, AES67/AVB, clocking, and network design for reliable transport.',
    careers: 'Audio-network engineer, system integrator, broadcast/IT, install tech.',
  },
  'Cabling, Connectors & Infrastructure': {
    description: 'Signal paths and the physical plant — connectors, cabling, patching, grounding, and the I/O that ties a system together.',
    careers: 'Live/install technician, stagehand, system tech, service technician.',
  },
  'Consoles & Control': {
    description: 'Analog and digital mixing consoles and control surfaces — routing, channels, buses, and scene recall.',
    careers: 'FOH/monitor engineer, studio engineer, broadcast operator.',
  },
  'Loudspeakers & Amplification': {
    description: 'How loudspeakers and amplifiers reproduce sound — drivers, enclosures, power, and matching for clean output.',
    careers: 'System engineer, live sound engineer, installer, pro-audio sales.',
  },
  Microphones: {
    description: 'How microphones capture sound — transducer types, polar patterns, placement, and matching the mic to the source.',
    careers: 'Recording/live engineer, broadcast tech, pro-audio sales.',
  },
  'Recording Hardware & Media': {
    description: 'The systems that capture and store audio — interfaces, converters, recorders, and storage and format management.',
    careers: 'Studio engineer, location recordist, broadcast operator.',
  },

  // ── Broadcast, Podcast & Streaming ───────────────────────────────────────
  'Broadcast & Air Chain': {
    description: 'Getting audio to air — broadcast signal flow, processing, loudness compliance, and the transmission chain.',
    careers: 'Broadcast engineer, air-chain operator, station technician.',
  },
  Podcast: {
    description: 'Producing spoken-word audio — recording, editing, leveling, and publishing a podcast that sounds professional.',
    careers: 'Podcast producer, editor, audio engineer, content creator.',
  },

  // ── Career, Business & Industry ──────────────────────────────────────────
  'Professional Practice': {
    description: 'The business of audio — careers, contracts, rates, client work, and how the professional industry operates.',
    careers: 'Freelancer, studio owner, entrepreneur, production manager.',
  },

  // ── Electronic Music, DAWs & Synthesis ───────────────────────────────────
  'DAWs & MIDI': {
    description: 'Computer-based production — DAW workflows, MIDI, editing, and session management across platforms.',
    careers: 'Producer, composer, DAW specialist, audio educator.',
  },
  'Sampling & Beat-Making': {
    description: 'Building tracks from samples and rhythm — chopping, sequencing, and groove in modern production.',
    careers: 'Producer, beatmaker, electronic musician, sound designer.',
  },
  'Synthesis & Sound Design': {
    description: 'Creating sound from scratch — synthesis methods, modulation, and designing original tones and effects.',
    careers: 'Sound designer, synthesist, producer, game/film audio.',
  },

  // ── Electronics, Engineering & Manufacturing ─────────────────────────────
  'Build & Manufacturing': {
    description: 'Turning audio designs into products — assembly, testing, QC, and manufacturing workflows.',
    careers: 'Manufacturing engineer, QC technician, hardware builder, R&D.',
  },
  'Components & Circuits': {
    description: 'The electronics behind audio gear — components, circuits, and how signal moves through real hardware.',
    careers: 'Hardware/electronics engineer, repair tech, R&D, manufacturing.',
  },

  // ── Foundations & Safety ─────────────────────────────────────────────────
  'Foundations of Sound & Signal': {
    description: 'The bedrock — what sound is, how we measure it in decibels, and how signal moves through a system.',
    careers: 'Every audio role — live, studio, install, and broadcast.',
  },
  'Safety & Electrical': {
    description: 'Working safely with power and gear — electrical fundamentals, grounding, rigging safety, and on-the-job practice.',
    careers: 'Every audio role; live and install especially.',
  },

  // ── Hearing, Perception & Listening ──────────────────────────────────────
  'Critical Listening & Ear Training': {
    description: 'Training the ear — identifying frequencies, processing, instruments, and problems by listening alone.',
    careers: 'Mix/mastering engineer, producer, QC listener, educator.',
  },
  'Hearing & Psychoacoustics': {
    description: 'How we hear — the ear, perception, masking, loudness, and protecting hearing health.',
    careers: 'Every audio role; audiology-adjacent and research work.',
  },

  // ── Installed & Commercial Audio ─────────────────────────────────────────
  'Consumer & Vehicle Audio': {
    description: 'Residential, consumer, and vehicle sound — home theater, car audio, and the systems people live with.',
    careers: 'Custom-install tech, car-audio installer, retail/sales, home-theater specialist.',
  },
  'System Design & Install': {
    description: 'Designing and installing fixed audio — distributed systems, commercial AV, and corporate integration.',
    careers: 'AV integrator, system designer, install technician.',
  },

  // ── Live Sound & Production ──────────────────────────────────────────────
  'DJ Performance': {
    description: 'DJ craft — equipment and software, beatmatching, mixing, and reading a room live.',
    careers: 'DJ, club/venue technician, electronic music performer.',
  },
  'Live Mixing & Crew': {
    description: 'Mixing live events and running the crew — FOH and monitors, gain structure, and show-day workflow.',
    careers: 'FOH/monitor engineer, crew chief, touring and event crew.',
  },
  'Live Systems & Deployment': {
    description: 'Deploying sound reinforcement — system engineering, rigging, alignment, and festival-scale logistics.',
    careers: 'System engineer, crew chief, touring and festival production.',
  },

  // ── Mixing & Mastering ───────────────────────────────────────────────────
  Mastering: {
    description: 'The final stage — loudness, tonal balance, sequencing, and delivery preparation for release.',
    careers: 'Mastering engineer, post/broadcast delivery, streaming prep.',
  },
  Mixing: {
    description: 'Balancing and shaping multitrack music into a finished stereo image — levels, processing, and space.',
    careers: 'Mix engineer, producer, studio engineer.',
  },

  // ── Preservation & Archival ──────────────────────────────────────────────
  'Analog Formats & Machines': {
    description: 'Legacy audio formats and the machines that play them — tape, vinyl, and analog transport maintenance.',
    careers: 'Archive/transfer engineer, tape-machine tech, restoration specialist.',
  },
  'Preservation & Restoration': {
    description: 'Saving and repairing recordings — digitization, noise and damage repair, and long-term archival.',
    careers: 'Preservation/restoration engineer, archivist, library/museum audio.',
  },

  // ── Signal Processing & Effects ──────────────────────────────────────────
  'Dynamics & EQ': {
    description: 'Controlling level and tone — compressors, limiters, gates, and equalization, and what their settings actually do.',
    careers: 'Mix/mastering engineer, live sound engineer, sound designer.',
  },
  'Plugins & Processing Platforms': {
    description: 'The platforms that host processing — plugin formats, DSP and host systems, and signal-chain management.',
    careers: 'Mix engineer, system/DSP tech, audio software user, educator.',
  },
  'Time-Based & Creative FX': {
    description: 'Space and character — reverb, delay, modulation, and creative effects that shape a sound’s dimension.',
    careers: 'Mix engineer, sound designer, producer, live FX operator.',
  },

  // ── Sound for Picture & Media ────────────────────────────────────────────
  Immersive: {
    description: 'Beyond stereo — immersive and spatial audio formats, object-based mixing, and 3D sound delivery.',
    careers: 'Immersive/spatial engineer, post-production mixer, game-audio designer.',
  },
  'Localization & Game': {
    description: 'Interactive and localized sound — game-audio implementation, middleware, and multi-language delivery.',
    careers: 'Game-audio designer, implementer, localization engineer.',
  },
  'Post Production': {
    description: 'Sound for screen — dialogue, ADR, Foley, effects, and the post mix for film and television.',
    careers: 'Post-production engineer, dialogue/Foley editor, re-recording mixer.',
  },
  Scoring: {
    description: 'Music for media — composing, orchestrating, and recording scores to picture.',
    careers: 'Composer, orchestrator, scoring engineer, music editor.',
  },

  // ── Standards & Sound Law ────────────────────────────────────────────────
  'Sound Law & Compliance': {
    description: 'The rules around sound — copyright, licensing, noise regulation, and compliance in audio work.',
    careers: 'Rights/licensing specialist, compliance officer, consultant, manager.',
  },
  'Technical Standards': {
    description: 'The standards that make audio interoperate — formats, levels, metering, and interconnection specs.',
    careers: 'Standards/QC engineer, broadcast/technical operations, integrator.',
  },

  // ── Studio Recording ─────────────────────────────────────────────────────
  'Recording Craft': {
    description: 'Capturing a performance — session setup, signal flow, tracking, and studio production technique.',
    careers: 'Recording engineer, producer, studio assistant.',
  },

  // ── Troubleshooting, Maintenance & Repair ────────────────────────────────
  'Maintenance & Repair': {
    description: 'Keeping gear working — preventive maintenance, diagnostics, and repairing audio equipment.',
    careers: 'Service/repair technician, maintenance engineer, bench tech.',
  },
  'System Troubleshooting': {
    description: 'Diagnosing and fixing system faults — noise, hums, dropouts, and failures across a signal chain.',
    careers: 'Audio technician, system engineer, live crew, service tech.',
  },

  // ── Venue, Stagecraft & Entertainment Systems ────────────────────────────
  'Show Control & Cueing': {
    description: 'Running the show — cue systems, show control, timecode, and coordinating audio with the production.',
    careers: 'Show-control operator, stage-manager’s audio, systems programmer.',
  },
  'Stage & Venue': {
    description: 'Stagecraft and venue operations — stage layout, rigging, power, and the vocabulary of live production.',
    careers: 'Stagehand, rigger, production manager, venue crew.',
  },
  'Theatrical & Worship': {
    description: 'Sound for theatre and worship — wireless mic wrangling, intelligibility, and fixed-venue production.',
    careers: 'Theatrical/worship A1, wireless tech, install engineer.',
  },
};

const EMPTY: SubjectMeta = { description: '', careers: '' };

/**
 * Ratification gate (owner 2026-09-09). The copy in SUBJECT_META is first-pass
 * PLACEHOLDER text — re-keyed to the live v3 subject names 2026-09-10 but NOT
 * yet owner-ratified, so it must not be shown to users (ratified-copy rule).
 * While this is false, `subjectMeta()` returns empty strings and the Curriculum
 * tree — which already null-guards both rows — shows no description/careers.
 *
 * To turn it on: review/replace the copy above, confirm every key still matches
 * the live v3 `subject` string, then set this to true.
 */
export const SUBJECT_META_RATIFIED = false;

export function subjectMeta(name: string): SubjectMeta {
  if (!SUBJECT_META_RATIFIED) return EMPTY;
  return SUBJECT_META[name] ?? EMPTY;
}
