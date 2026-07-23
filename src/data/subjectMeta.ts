/**
 * subjectMeta — per-subject one-sentence description + career applications for
 * the Curriculum tree (user request 2026-07-22). Keyed by the exact subject name
 * in course_topic_matrix_v2.json.
 *
 * PLACEHOLDER COPY — reasonable first-pass text; replace with the Academy's
 * official descriptions and career mappings.
 */
export type SubjectMeta = { description: string; careers: string };

export const SUBJECT_META: Record<string, SubjectMeta> = {
  'Foundations & Safety': {
    description: 'Core electrical, grounding, and on-the-job safety practices every audio professional relies on.',
    careers: 'Every audio role — live, studio, install, and broadcast.',
  },
  'Mics, Amps, & Speakers': {
    description: 'How microphones capture sound and how amplifiers and loudspeakers reproduce it.',
    careers: 'Live sound engineer, recording engineer, system integrator, pro-audio sales.',
  },
  'Cables & Connectivity': {
    description: 'Signal paths, connectors, cabling, and I/O that tie an audio system together.',
    careers: 'Live sound tech, install/AV technician, stagehand, service technician.',
  },
  Consoles: {
    description: 'Analog and digital mixing consoles — routing, channels, buses, and control.',
    careers: 'FOH/monitor engineer, studio engineer, broadcast operator.',
  },
  Recorders: {
    description: 'Recording systems and interfaces used to capture, store, and manage audio.',
    careers: 'Studio engineer, location recordist, broadcast operator.',
  },
  'Racks  & Infrastructure': {
    description: 'Power, patching, networking, and the infrastructure behind large audio systems.',
    careers: 'System engineer, install/AV integrator, live production tech, audio-networking specialist.',
  },
  'Signal Processing': {
    description: 'EQ, dynamics, and effects used to shape and control audio signals.',
    careers: 'Mix engineer, mastering engineer, live sound engineer, sound designer.',
  },
  'Acoustics & Measurement': {
    description: 'Room acoustics, measurement tools, and system tuning and optimization.',
    careers: 'System tech, acoustician, install/AV designer, studio design.',
  },
  Troubleshooting: {
    description: 'Diagnosing and fixing noise, faults, and failures across audio systems.',
    careers: 'Audio technician, system engineer, live sound crew, service and repair.',
  },
  'Live Sound & Deployment': {
    description: 'Deploying and operating sound reinforcement systems for live events.',
    careers: 'FOH/monitor engineer, system tech, touring and event crew.',
  },
  'DJ Audio': {
    description: 'DJ performance, equipment and software, and beatmatching, mixing, and FX.',
    careers: 'DJ, club/venue technician, electronic music performer.',
  },
  'Venue, Stagecraft & Rigging Terminology': {
    description: 'Stagecraft, rigging, and venue-operations vocabulary for live production.',
    careers: 'Stagehand, rigger, production manager, venue crew.',
  },
  'Install, Commercial, & AV': {
    description: 'Commercial audio, distributed systems, and corporate AV integration.',
    careers: 'AV integrator, install technician, commercial system designer.',
  },
  'Consumer, Home & Vehicle': {
    description: 'Residential, consumer, and vehicle audio systems and installation.',
    careers: 'Custom-install tech, retail/sales, car-audio installer, home-theater specialist.',
  },
  'Electronic Music': {
    description: 'Synthesis, sound design, and the fundamentals of electronic music production.',
    careers: 'Producer, sound designer, electronic musician.',
  },
  'Studio Recording': {
    description: 'Session setup, signal flow, tracking, and studio recording production.',
    careers: 'Recording engineer, producer, studio assistant.',
  },
  Mastering: {
    description: 'Final-stage processing, loudness, and delivery preparation for release.',
    careers: 'Mastering engineer, post-production audio, streaming/broadcast delivery.',
  },
  'Studio: Mixing': {
    description: 'Balancing, processing, and mixing multitrack music to a finished stereo image.',
    careers: 'Mix engineer, producer, studio engineer.',
  },
  'Computer & Electronic Music': {
    description: 'DAWs, MIDI, and computer-based music production workflows across platforms.',
    careers: 'Producer, composer, DAW specialist, audio educator.',
  },
  'Hearing, Perception & Listening': {
    description: 'Psychoacoustics, hearing health, and critical-listening fundamentals.',
    careers: 'Every audio role; QC listening, audiology-adjacent work.',
  },
  'Studio: Ear Training & Instrument Sound ID': {
    description: 'Critical listening plus identifying instruments and sonic characteristics by ear.',
    careers: 'Mix/mastering engineer, producer, audio educator.',
  },
  'Career, Business & Industry': {
    description: 'Careers, business skills, and how the professional audio industry works.',
    careers: 'Freelancer, studio owner, entrepreneur, production manager.',
  },
  'Immersive & Screen Sound': {
    description: 'Immersive audio and sound for film, television, games, and interactive media.',
    careers: 'Post-production engineer, game-audio designer, immersive/spatial engineer.',
  },
  'Audio Engineering & Development': {
    description: 'Audio electronics, hardware, DSP, and software development and manufacturing.',
    careers: 'Hardware/DSP engineer, audio software developer, manufacturing, R&D.',
  },
  'AI Audio': {
    description: 'AI foundations plus music/sound generation and voice and speech applications.',
    careers: 'AI-audio developer, producer, research, emerging-technology roles.',
  },
  'Live Sound Production': {
    description: 'Advanced live production — crew operations, system engineering, and festivals.',
    careers: 'System engineer, crew chief, touring and festival production.',
  },
};

export function subjectMeta(name: string): SubjectMeta {
  return SUBJECT_META[name] ?? { description: '', careers: '' };
}
