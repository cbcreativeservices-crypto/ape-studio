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

/** A titled block of policy prose. */
export type AwardPolicy = { title: string; paragraphs: string[] };

/** One award tier within a category (a Level block). */
export type AwardTier = {
  /** e.g. "Level 1" — small eyebrow above the tier title. */
  level?: string;
  title: string;
  /** Prerequisite courses — shown as their own category ABOVE requirements. */
  prerequisite?: string[];
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
};

export type AwardPage = {
  key: AwardCategory;
  /** Matches the hero button label. */
  label: string;
  headline: string;
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
  intro: 'Earn an Academy Specialization Certificate by mastering a single topic.',
  accent: '#ffc64d', // gold — single-topic award
  tiers: [
    {
      level: 'Level 1',
      title: 'Academy Specialization Certificate',
      prerequisite: ['Pro Audio Safety', 'Workplace Skills'],
      requirements: ['One topic'],
      programs: [
        'Recording Arts Specialization Certificate',
        'Music Production Specialization Certificate',
        'Live Sound Specialization Certificate',
        'AV Systems Specialization Certificate',
        'Broadcast Audio Specialization Certificate',
        'DJ Certificate',
        'House of Worship Certificate',
        'Acoustics Certificate',
        'ALS Certificate',
        'Architectural Audio Certificate',
        'Vehicle Audio Certificate',
        'HiFi Certificate',
        'Music Theater Certificate',
        'Career and Business',
        'Road Crew Certificate',
      ],
    },
  ],
};

// Level 2 — full multi-topic course. Purple, matching the course card accent.
const PROGRAM: AwardPage = {
  key: 'program',
  label: 'Program',
  headline: 'PROFESSIONAL CERTIFICATE PROGRAM',
  intro: 'Earn a Professional Certificate Program by completing a full multi-topic course.',
  accent: '#c4a2ff', // academy purple — multi-topic award
  tiers: [
    {
      level: 'Level 2',
      title: 'Professional Certificate Program',
      prerequisite: ['Pro Audio Safety', 'Workplace Skills'],
      requirements: ['All topics in the program', 'Program assessment'],
      programs: [
        'Intro to Audio',
        'Recording Arts',
        'Music Production',
        'Sound Reinforcement Systems',
        'Audio System Design and Maintenance',
        'Career and Business',
      ],
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
