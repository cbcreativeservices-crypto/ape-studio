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
 * Co-requisite topics auto-included in every award. Owner 2026-08-30: Audio
 * Fundamentals Lab (gs3081) replaced Electrical Power (gs3080). The four are
 * Safety (gs3060), Grounding & Electrical (gs3070), Audio Fundamentals Lab
 * (gs3081), Workplace Skills (gs4370). ("Grounding & Shielding" here was a
 * stale pre-2026-09-03 variant; officialTopicNames.ts codifies gs3070 as
 * "Grounding & Electrical" and explicitly supersedes it — comment corrected
 * 2026-09-11, the rendered copy was already right.) Completing every audio_fundamentals
 * lab marks gs3081 complete. Foundations of Sound (`FoundationsCourse`) is one
 * of those labs, not a fifth standing requirement. In the builders these show
 * ALWAYS-checked, locked, and do NOT count toward the chosen topics
 * (user request 2026-07-18).
 */
export const COREQ_TOPIC_GS: number[] = [3060, 3070, 3081, 4370];

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
   *  'specializations' = pick 1 Specialization Certificate;
   *  'programs' = pick 1 Academy Program Certificate (both lists come from
   *  the live v3 fetch). */
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
  // Cores + the training lab named inline (owner 2026-08-01).
  intro:
    'Begin by completing the three required core topics and one training lab (required only once): ' +
    'Pro Audio Safety, Grounding & Electrical, Workplace Skills, and the Audio Fundamentals lab.\n\n' +
    'Then choose a specialization, complete its three required topics, and pass the Final Exam to earn ' +
    'your certificate.',
  accent: '#ffc64d', // gold — single-topic award
  tiers: [
    {
      level: 'Level 1',
      title: 'Academy Specialization Certificate',
      corequisite: ['Pro Audio Safety', 'Grounding & Electrical', 'Workplace Skills'],
      requirements: ['Complete the 3 specialization topics', 'Audio Fundamentals'],
      // Catalog of the 68 predefined Specialization Certificates (choose one).
      builder: 'specializations',
    },
  ],
};

// Level 2 — full multi-topic course. Purple, matching the course card accent.
const PROGRAM: AwardPage = {
  key: 'program',
  label: 'Program',
  headline: 'PROFESSIONAL CERTIFICATE PROGRAM',
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
      requirements: ["Complete a program's topic path", 'Audio Fundamentals'],
      // Interactive: pick from the established program paths.
      builder: 'programs',
      note:
        'Academy graduates represent the Pro Audio Training Academy professionally throughout the world. ' +
        "The Academy's programs are rigorous by design, and graduates emerge among the most knowledgeable " +
        'in their chosen field of professional audio.',
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
