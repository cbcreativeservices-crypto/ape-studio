/**
 * Audio Career Finder — the 14 activity-interest dimensions (owner brief
 * 2026-09-03, from the measurement model in the design chat). They describe
 * ACTIVITIES, never industries, so a person who enjoys investigation can
 * surface acoustical research, forensics, QA and sonar alike.
 *
 * Pure data: no React, no React Native — imported by the scoring tests.
 */
export const DIMENSION_CODES = ['CP', 'RC', 'ER', 'MS', 'LO', 'SD', 'BM', 'DA', 'AR', 'HC', 'TE', 'BO', 'PC', 'GS'] as const;
export type DimensionCode = (typeof DIMENSION_CODES)[number];

export type Dimension = {
  code: DimensionCode;
  label: string;
  /** What the dimension measures — shown on the profile and the methodology page. */
  measures: string;
  /** Lower-case phrase for generated sentences: "…interest in {phrase} activities". */
  phrase: string;
};

export const DIMENSIONS: Record<DimensionCode, Dimension> = {
  CP: { code: 'CP', label: 'Create & Perform', measures: 'Composing, performing, improvising and artistic expression.', phrase: 'creating and performing' },
  RC: { code: 'RC', label: 'Record & Capture', measures: 'Microphones, sessions, location sound and capturing a source well.', phrase: 'recording and capturing sound' },
  ER: { code: 'ER', label: 'Edit & Refine', measures: 'Editing, mixing, mastering, restoration and detailed improvement.', phrase: 'editing and refining' },
  MS: { code: 'MS', label: 'Media & Storytelling', measures: 'Sound that serves stories, pictures, games, speech and experiences.', phrase: 'sound for media and storytelling' },
  LO: { code: 'LO', label: 'Live Operation', measures: 'Running shows, reacting quickly and working under real-time pressure.', phrase: 'live operation' },
  SD: { code: 'SD', label: 'Systems & Deployment', measures: 'Designing, connecting, installing, networking and tuning systems.', phrase: 'systems and deployment' },
  BM: { code: 'BM', label: 'Build & Maintain', measures: 'Manufacturing, soldering, repair, construction and physical equipment.', phrase: 'building and maintaining equipment' },
  DA: { code: 'DA', label: 'Digital, Software & AI', measures: 'Programming, DSP, automation, software and machine learning.', phrase: 'software and digital audio' },
  AR: { code: 'AR', label: 'Analyze & Research', measures: 'Measurement, experimentation, acoustical analysis and investigation.', phrase: 'analysis and research' },
  HC: { code: 'HC', label: 'Help, Clinical & Access', measures: 'Improving hearing, communication, health and accessibility.', phrase: 'helping people hear and communicate' },
  TE: { code: 'TE', label: 'Teach & Explain', measures: 'Instruction, coaching, documentation and technical communication.', phrase: 'teaching and explaining' },
  BO: { code: 'BO', label: 'Business & Leadership', measures: 'Selling, managing, entrepreneurship, products and operations.', phrase: 'business and leadership' },
  PC: { code: 'PC', label: 'Preserve & Curate', measures: 'Archiving, collecting, restoring, documenting and selecting material.', phrase: 'preserving and curating' },
  GS: { code: 'GS', label: 'Govern, Protect & Verify', measures: 'Standards, compliance, rights, forensics, safety and intelligence.', phrase: 'standards, verification and protection' },
};

export const dimensionLabel = (code: DimensionCode): string => DIMENSIONS[code].label;
