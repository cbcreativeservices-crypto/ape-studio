/**
 * awardsData — content model for the Awards pages reached from the Course
 * Selection screen and the Curriculum view.
 *
 * STRUCTURE (user request 2026-07-18): awards go up to TWO levels only — there
 * is NO diploma and NO master. The two levels mirror the course-card
 * categories:
 *   Level 1 — Academy Specialization Certificate  (a single topic)
 *   Level 2 — Professional Certificate Program     (a full multi-topic course)
 * Both require the two pre-requisites: "Pro Audio Safety" and "Workplace
 * Skills". Copy comes straight from the Awards draft; extend the arrays as new
 * copy lands — the screen renders whatever is here.
 */
export type AwardCategory = 'specialization' | 'program';

/**
 * Co-requisite topics auto-included in every award — Professional Audio Safety
 * (gs100) + Grounding & Electrical (gs120) + Workplace Skills (gs1590). In the
 * builders they show ALWAYS-checked, locked (can't be unchecked), and do NOT
 * count toward the chosen topics (user request 2026-07-18).
 */
export const COREQ_TOPIC_GS: number[] = [100, 120, 1590];

/** The 4th required requisite for EVERY certificate/program (owner 2026-07-30):
 *  the "Foundations in Audio" lab (in the Ear Training & Audio Lab). Unlike the
 *  three COREQ topics it is a LAB, not a Dashboard course — so it is surfaced as
 *  its own green lab-link container in "My Enrollments" (never a Dashboard card),
 *  and listed by name in the requisite banner. Route: the 'FoundationsCourse'
 *  screen. Its progress is remembered by the lab itself. */
export const FOUNDATIONS_REQ_NAME = 'Foundations in Audio';
export const FOUNDATIONS_LAB_ROUTE = 'FoundationsCourse';

/** A titled block of policy prose. */
export type AwardPolicy = { title: string; paragraphs: string[] };

/** One award tier within a category (a Level block). */
export type AwardTier = {
  /** e.g. "Level 1" — small eyebrow above the tier title. */
  level?: string;
  title: string;
  /** CO-requisite courses (taken alongside, not before) — shown as their own
   *  category ABOVE requirements (user request 2026-07-18: these are co-reqs). */
  corequisite?: string[];
  /** What the learner must complete to earn awards in this tier. */
  requirements?: string[];
  /** Named programs/certificates offered in this tier. */
  programs?: string[];
  /** Physical/digital items graduates receive (bulleted). */
  perks?: string[];
  /** Free-form note under the tier. */
  note?: string;
  /** Long-form policy section rendered at the bottom of the tier. */
  policy?: AwardPolicy;
  /** Interactive builder shown in this tier (user request 2026-07-18):
   *  'specializations' = pick 1 of the 68 Specialized Certificates;
   *  'programs' = pick 1 of the 15 Academy Program Certificates. */
  builder?: 'specializations' | 'programs';
};

export type AwardPage = {
  key: AwardCategory;
  /** Matches the hero button label. */
  label: string;
  headline: string;
  /** Bold heading above the intro body. */
  introTitle?: string;
  /** Intro body — paragraphs separated by a blank line (\n\n). */
  intro: string;
  /** Category accent color (frame + section heads). */
  accent: string;
  tiers: AwardTier[];
  /** Shows the "working draft" banner while copy is still being finalized. */
  draft?: boolean;
};

// Level 1 — single-topic certificate. Gold, matching the single-topic course
// card accent.
const SPECIALIZATION: AwardPage = {
  key: 'specialization',
  label: 'Specialization',
  headline: 'SPECIALIZATION CERTIFICATE',
  introTitle: 'Build Your Academy Credentials',
  // The three required cores are BULLETED (user request 2026-07-22), and the
  // old 3rd paragraph was dropped.
  intro:
    'Begin by completing the three required core courses (required only once):\n' +
    '      •  Professional Audio Safety\n' +
    '      •  Grounding & Electrical\n' +
    '      •  Workplace Skills\n\n' +
    'Then choose a specialization, complete its three required topics, and pass the final assessment to earn ' +
    'your certificate.',
  accent: '#ffc64d', // gold — single-topic award
  tiers: [
    {
      level: 'Level 1',
      title: 'Academy Specialization Certificate',
      corequisite: ['Pro Audio Safety', 'Grounding & Electrical', 'Workplace Skills'],
      requirements: ['Complete the 3 specialization topics', 'Sound Fundamentals Lab'],
      // Catalog of the 68 predefined Specialized Certificates (choose one).
      builder: 'specializations',
    },
  ],
};

// Level 2 — full multi-topic course. Purple, matching the course card accent.
const PROGRAM: AwardPage = {
  key: 'program',
  label: 'Program',
  headline: 'PROFESSIONAL CERTIFICATE',
  introTitle: 'Master a Professional Audio Specialty',
  intro:
    'Academy Program Professional Certificates recognize completion of an extensive subject specialization and learning pathway.\n\n' +
    'Each program combines multiple related topics to develop comprehensive knowledge and achieve terminology mastery within an entire ' +
    'professional audio discipline.',
  accent: '#c4a2ff', // academy purple — multi-topic award
  tiers: [
    {
      level: 'Level 2',
      title: 'Professional Certificate Program',
      corequisite: ['Pro Audio Safety', 'Grounding & Electrical', 'Workplace Skills'],
      requirements: ["Complete a program's topic path", 'Sound Fundamentals Lab'],
      // Interactive: pick from the established program paths.
      builder: 'programs',
      note:
        'Academy graduates represent the Pro Audio Training Academy professionally in the field, worldwide. ' +
        "The Academy's programs are rigorous by design — their graduates emerge among the most knowledgeable " +
        'audio professionals in the world.',
    },
  ],
};

const PAGES: Record<AwardCategory, AwardPage> = {
  specialization: SPECIALIZATION,
  program: PROGRAM,
};

export function awardPage(category: AwardCategory): AwardPage {
  return PAGES[category];
}

/** Ordered category keys for the pager / links (Level 1 → Level 2). */
export const AWARD_ORDER: AwardCategory[] = ['specialization', 'program'];

/**
 * Academy Program Certificates — the 15 full-program certificates (CCODE
 * handoff 2026-07-18, curriculum v2). Each certificate = the 3 shared core
 * pre-reqs (COREQ_TOPIC_GS: gs100 / gs120 / gs1590, surfaced separately so they
 * are never double-added) + its required topics + an optional "choose one"
 * elective group. Topics are referenced by gs (the achievement's
 * global_sequence) and resolved to names against the v2 matrix at render.
 */
export type ProgramPath = {
  name: string;
  /** Required topic gs for this certificate (core pre-reqs NOT repeated here). */
  requiredTopics: number[];
  /** Elective group — the learner chooses ONE (omitted when the award has none). */
  electiveChooseOne?: number[];
};

/** The 6 DAW electives shared by the Music Production & Electronic Music certs. */
const DAW_ELECTIVES = [1270, 1280, 1290, 1300, 1310, 1320];

export const PROGRAM_PATHS: ProgramPath[] = [
  {
    name: 'Live Sound Production',
    requiredTopics: [
      150, 160, 170, 190, 240, 270, 290, 300, 310, 630, 640, 650, 660, 1930, 1940, 1950, 1960, 1970, 1980,
      1990, 2000, 2020, 2030,
    ],
  },
  {
    name: 'Studio Recording',
    requiredTopics: [
      150, 160, 190, 200, 220, 290, 330, 340, 990, 1000, 1010, 1012, 1020, 1022, 1024, 1030, 1040, 1050, 1060,
      1070, 212, 210, 1240, 1250,
    ],
  },
  {
    name: 'Mixing and Mastering',
    requiredTopics: [
      150, 290, 300, 310, 460, 470, 480, 490, 1080, 1090, 1100, 1110, 1120, 1130, 1140, 1150, 1160, 1170, 1180,
      1500, 1510, 1530,
    ],
  },
  {
    name: 'Music Production',
    requiredTopics: [
      150, 190, 460, 470, 480, 490, 1240, 1250, 1260, 1330, 1340, 1350, 1360, 1370, 1380, 990, 1000, 1070, 1080,
      1130, 1140, 1180,
    ],
    electiveChooseOne: DAW_ELECTIVES,
  },
  {
    name: 'Commercial Audio and AV Systems',
    requiredTopics: [
      130, 150, 160, 170, 180, 240, 250, 260, 270, 370, 400, 410, 420, 440, 810, 820, 830, 840, 850, 1460, 580,
      610,
    ],
  },
  {
    name: 'Audio Acoustics and System Optimization',
    requiredTopics: [
      110, 500, 510, 520, 530, 540, 550, 560, 570, 240, 250, 260, 650, 860, 1760, 1770, 1440, 1450, 1460, 1470,
      1530,
    ],
  },
  {
    name: 'Theater, Venue and Entertainment Audio',
    requiredTopics: [
      710, 720, 730, 740, 750, 760, 770, 780, 790, 630, 640, 660, 1960, 1980, 2020, 2030, 1700, 1710, 1730,
      1732, 1750,
    ],
  },
  {
    name: 'Broadcast, Podcast and Streaming Audio',
    requiredTopics: [
      190, 200, 990, 1000, 1070, 1110, 1190, 1200, 1210, 1220, 1180, 1240, 1250, 1260, 1460, 1490, 1530, 1620,
    ],
  },
  {
    name: 'Sound for Film, Television and Interactive Media',
    requiredTopics: [
      1230, 1232, 1234, 1690, 1700, 1710, 1720, 1730, 1732, 1740, 1650, 1660, 1670, 340, 360, 1240, 1250, 1180,
    ],
  },
  {
    name: 'Audio Electronics, Service and Repair',
    requiredTopics: [130, 170, 270, 280, 880, 882, 890, 900, 910, 970, 980, 560, 580, 610, 920, 1810, 1820, 930],
  },
  {
    name: 'Immersive Audio',
    requiredTopics: [1650, 1660, 1670, 1680, 500, 540, 550, 570, 1440, 1450, 1530, 1080, 1130, 1140, 1180, 1234],
  },
  {
    name: 'AI Audio and Emerging Production',
    requiredTopics: [
      1850, 1860, 1870, 1880, 1890, 1900, 1910, 1920, 1240, 1250, 1340, 1360, 1830, 1840, 1620,
    ],
  },
  {
    name: 'Electronic Music & Synthesis',
    requiredTopics: [1380, 1390, 1400, 1350, 1360, 1370, 1340, 1330, 1240, 1250, 1260, 1080, 1130, 1140],
    electiveChooseOne: DAW_ELECTIVES,
  },
  {
    name: 'Audio Networking & Infrastructure',
    requiredTopics: [
      150, 160, 170, 180, 370, 380, 390, 400, 410, 420, 430, 440, 450, 130, 140, 580, 600, 610, 810, 840,
    ],
  },
  {
    name: 'Worship Audio',
    requiredTopics: [
      800, 620, 630, 650, 660, 290, 300, 310, 320, 1460, 1530, 1930, 1970, 1980, 1990, 2020, 2030, 240, 260,
      270,
    ],
  },
];

/**
 * Specialized Certificates — the 68 three-topic certificates (CCODE handoff
 * 2026-07-18, curriculum v2; Architectural Audio added 2026-07-22). Each = the
 * 3 shared core pre-reqs (COREQ_TOPIC_GS: gs100 / gs120 / gs1590, surfaced
 * separately) + exactly 3 specialization topics that define the certificate.
 * Topics are referenced by gs and resolved to names against the v2 matrix at
 * render.
 *
 * NAMING (user request 2026-07-22): a leading "Audio " is dropped from the
 * certificate name (e.g. "Audio Consoles" → "Consoles") — the picker sorts and
 * displays these A–Z. Names where "Audio" is NOT the first word are unchanged
 * (DJ Audio, Worship Audio, Architectural Audio, Vehicle Audio, AI Audio …).
 */
export type SpecializedCertificate = { name: string; specializationTopics: number[] };

export const SPECIALIZED_CERTIFICATES: SpecializedCertificate[] = [
  { name: 'Microphones, Amplifiers & Loudspeakers', specializationTopics: [190, 240, 270] },
  { name: 'Cables & Connectivity', specializationTopics: [150, 160, 170] },
  { name: 'Consoles', specializationTopics: [290, 300, 310] },
  { name: 'Recording Systems', specializationTopics: [330, 340, 360] },
  { name: 'Infrastructure', specializationTopics: [370, 400, 410] },
  { name: 'Networking', specializationTopics: [420, 430, 440] },
  { name: 'Power Systems', specializationTopics: [130, 140, 400] },
  { name: 'Signal Processing', specializationTopics: [460, 470, 480] },
  { name: 'Acoustics & Measurement', specializationTopics: [500, 540, 550] },
  { name: 'Room Treatment', specializationTopics: [510, 520, 530] },
  { name: 'Troubleshooting', specializationTopics: [580, 600, 610] },
  { name: 'Live Sound Systems', specializationTopics: [620, 630, 650] },
  { name: 'Wireless Audio Systems', specializationTopics: [660, 220, 230] },
  { name: 'DJ Audio', specializationTopics: [670, 680, 690] },
  { name: 'Stagecraft & Venue Operations', specializationTopics: [710, 720, 740] },
  { name: 'Entertainment Rigging Fundamentals', specializationTopics: [640, 750, 760] },
  { name: 'Theatrical Audio', specializationTopics: [780, 790, 770] },
  { name: 'Worship Audio', specializationTopics: [800, 630, 1980] },
  { name: 'Commercial Audio Systems', specializationTopics: [810, 830, 840] },
  // Architectural Audio (user request 2026-07-22): Audio System Design (gs810) +
  // Architectural Audio (gs860) + System Optimization (gs570).
  { name: 'Architectural Audio', specializationTopics: [810, 860, 570] },
  { name: 'Corporate AV Audio', specializationTopics: [820, 810, 850] },
  { name: 'Residential & Consumer Audio', specializationTopics: [940, 950, 840] },
  { name: 'Vehicle Audio', specializationTopics: [960, 170, 270] },
  { name: 'Electronic Music Production', specializationTopics: [1380, 1350, 1370] },
  { name: 'Synthesis & Sound Design', specializationTopics: [1400, 1390, 1380] },
  { name: 'Studio Recording', specializationTopics: [990, 1000, 1010] },
  { name: 'Instrument Recording', specializationTopics: [1020, 1022, 1024] },
  { name: 'Advanced Recording Production', specializationTopics: [1030, 1060, 1070] },
  { name: 'Microphone Techniques', specializationTopics: [1000, 212, 210] },
  { name: 'Music Mixing', specializationTopics: [1080, 1130, 1140] },
  { name: 'Instrument Mixing', specializationTopics: [1090, 1100, 1120] },
  { name: 'Vocal Mixing & Production', specializationTopics: [1070, 1110, 1490] },
  { name: 'Mastering', specializationTopics: [1160, 1170, 1180] },
  { name: 'Broadcast & Streaming Audio', specializationTopics: [1200, 1210, 1220] },
  { name: 'Podcast Production', specializationTopics: [1190, 1110, 1210] },
  { name: 'Production Sound', specializationTopics: [1232, 340, 410] },
  { name: 'DAW Production', specializationTopics: [1240, 1250, 1260] },
  { name: 'Logic Production', specializationTopics: [1240, 1250, 1270] },
  { name: 'Cubase/Nuendo Production', specializationTopics: [1240, 1250, 1280] },
  { name: 'REAPER Production', specializationTopics: [1240, 1250, 1290] },
  { name: 'Ableton Live Production', specializationTopics: [1240, 1330, 1300] },
  { name: 'Studio One Production', specializationTopics: [1240, 1250, 1310] },
  { name: 'Digital Performer/Reason Production', specializationTopics: [1240, 1330, 1320] },
  { name: 'Hearing & Audio Health', specializationTopics: [1410, 1420, 1430] },
  { name: 'Psychoacoustics & Listening', specializationTopics: [1440, 1450, 1470] },
  { name: 'Critical Listening', specializationTopics: [1500, 1510, 1530] },
  { name: 'Instrument Sound Identification', specializationTopics: [1550, 1560, 1570] },
  { name: 'Career Development', specializationTopics: [1600, 1610, 1640] },
  { name: 'Music Business & Entrepreneurship', specializationTopics: [1620, 1630, 1580] },
  { name: 'Immersive Audio Production', specializationTopics: [1650, 1660, 1670] },
  { name: 'Immersive Music Production', specializationTopics: [1650, 1670, 1680] },
  { name: 'Dialogue & Localization', specializationTopics: [1700, 1710, 1720] },
  { name: 'Foley & Sound Effects', specializationTopics: [1730, 1732, 1232] },
  { name: 'Game & Themed-Entertainment Audio', specializationTopics: [1740, 1750, 1732] },
  { name: 'Electronics', specializationTopics: [880, 890, 900] },
  { name: 'Equipment Service', specializationTopics: [970, 980, 920] },
  { name: 'Manufacturing', specializationTopics: [910, 920, 930] },
  { name: 'Hardware Engineering', specializationTopics: [1810, 1820, 900] },
  { name: 'Software & DSP Development', specializationTopics: [1830, 1840, 1910] },
  { name: 'AI Audio Foundations', specializationTopics: [1910, 1900, 1920] },
  { name: 'AI Music & Sound Creation', specializationTopics: [1850, 1890, 1920] },
  { name: 'AI Audio Production', specializationTopics: [1870, 1880, 1920] },
  { name: 'AI Voice & Speech', specializationTopics: [1860, 1900, 1920] },
  { name: 'Live Sound Crew Operations', specializationTopics: [1930, 1940, 1950] },
  { name: 'Live Sound Mixing', specializationTopics: [1960, 1970, 1980] },
  { name: 'Live Sound System Engineering', specializationTopics: [1990, 2000, 2030] },
  { name: 'Festival Audio Production', specializationTopics: [1940, 2010, 2020] },
  { name: 'Road Crew Operations', specializationTopics: [700, 1950, 1930] },
];
