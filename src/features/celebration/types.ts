/**
 * The celebration engine — vocabulary.
 *
 * Owner spec 2026-09-17. ONE component renders every celebration in the app,
 * driven by the table in `catalog.ts`. The lesson is the production labs':
 * twenty screens drift, one component and twenty rows of data cannot.
 *
 * ── THE TIER IS THE WHOLE DESIGN ─────────────────────────────────────────────
 *
 * The owner's spec says the celebration should grow with the accomplishment,
 * and that is right — but it listed a full screen for every activity, and the
 * arithmetic of that is brutal: six per topic across 171 topics is roughly a
 * thousand screens to dismiss. At that rate a full screen stops meaning
 * anything, and the certificate screens that genuinely matter are devalued by
 * the flashcard ones that do not.
 *
 * So the tier decides the PRESENTATION, not merely the wording:
 *
 *   step        an activity inside a topic        →  inline notice, no dismissal
 *   stage       a gate opened or a score moved    →  inline notice + an action
 *   milestone   a topic, lab or subject finished  →  full screen
 *   credential  a certificate or a programme      →  full screen, strongest
 *
 * Changing any celebration between forms is one field in the catalog.
 */

/** How much of the screen a celebration is entitled to. */
export type CelebrationTier = 'step' | 'stage' | 'milestone' | 'credential';

/** What the tier resolves to at render time. */
export type CelebrationForm = 'notice' | 'screen';

/** Every celebration the app can raise. Stable ids — they are analytics keys. */
export type CelebrationId =
  // step
  | 'flashcards-complete'
  | 'matching-complete'
  | 'fill-blank-complete'
  // stage
  | 'scenarios-complete'
  | 'final-quiz-unlocked'
  | 'quiz-not-passed'
  | 'score-improved'
  | 'daily-practice'
  // milestone
  | 'topic-complete'
  | 'perfect-score'
  | 'lab-complete'
  | 'subject-complete'
  | 'requirement-complete'
  // credential
  | 'first-certificate'
  | 'certificate-earned'
  | 'first-program'
  | 'program-complete'
  | 'multiple-credentials';

/**
 * One action offered by a celebration.
 *
 * `kind` is what the host maps to a real navigation or share call — the catalog
 * stays pure data and knows nothing about the navigator, which is what lets it
 * be tested without one.
 */
export type CelebrationActionKind =
  | 'dismiss'
  | 'trophy-case'
  | 'view-results'
  | 'view-credential'
  | 'share'
  | 'retry-quiz'
  | 'start-quiz'
  | 'view-summary'
  | 'view-requirement';

export type CelebrationAction = {
  label: string;
  kind: CelebrationActionKind;
  /** The visually dominant action. At most one per celebration. */
  primary?: boolean;
};

/**
 * The values a celebration interpolates. Every field is optional because the
 * catalog decides which it uses, and a missing one must render as nothing
 * rather than as the literal `{topic_name}`.
 */
export type CelebrationValues = {
  topic_name?: string;
  subject_name?: string;
  lab_name?: string;
  certificate_name?: string;
  program_name?: string;
  achievement_name?: string;
  requirement_name?: string;
  score?: number;
  previous_score?: number;
  new_score?: number;
  improvement?: number;
  credential_count?: number;
};

export type CelebrationDef = {
  id: CelebrationId;
  tier: CelebrationTier;
  /** Small all-caps line above the title, e.g. "NICE WORK!". Optional. */
  kicker?: string;
  /** The headline, e.g. "FLASHCARD DECK COMPLETE". */
  title: string;
  /** The name of the thing achieved — a template over CelebrationValues. */
  subject?: string;
  /** A prominent figure, e.g. "FINAL QUIZ: {score}%". */
  stat?: string;
  /** Body paragraphs, in order. Templates. */
  body: readonly string[];
  actions: readonly CelebrationAction[];
  /**
   * True when this celebration reports something that did NOT go well (a quiz
   * not passed). It is still a celebration in the engine's sense — it is the
   * same moment, on the same event — but it must never read as congratulation
   * and must not fire a success haptic.
   */
  encouragement?: boolean;
};

/** A raised celebration: the definition plus the values to fill it with. */
export type CelebrationEvent = {
  id: CelebrationId;
  values: CelebrationValues;
};

/**
 * Resolve the tier to a form.
 *
 * Kept as a function rather than a field on the tier so the low-light rule can
 * be applied in ONE place: in Low-Light Production Mode nothing may
 * auto-appear, so every tier collapses to the quiet inline notice and no modal
 * ever opens. See the Celebration component.
 *
 * ── EVERY TIER IS A POPUP NOW (owner, 2026-09-20) ───────────────────────────
 *
 * `step` and `stage` used to render as the inline notice — a card that opens
 * at the top of the Dashboard and pushes the whole rack down the screen. The
 * owner's ruling, after seeing MATCHING COMPLETE do exactly that:
 *
 *   "i prefer popups to pulldowns — pull downs move the screen up or down,
 *    which i do not like. popups work better as it focuses user then they go
 *    right back and there is no reorientation of the page."
 *
 * That is a reading about ATTENTION, and it is right: a banner that reflows
 * the page makes the learner re-find where they were, while a popup takes the
 * focus and hands it straight back. So every celebration is a modal.
 *
 * ⛔ THE LOW-LIGHT BRANCH STAYS, AND STAYS FIRST. It is the absolute standing
 *    rule — in that mode nothing may auto-appear or flash, and this app is
 *    used in dark control rooms during shows. Suppressed still collapses to
 *    the quiet inline notice with no modal and no haptic. The owner's
 *    preference governs how a celebration interrupts; it does not govern
 *    whether it may interrupt at all.
 */
export function formFor(tier: CelebrationTier, suppressed: boolean): CelebrationForm {
  if (suppressed) return 'notice';
  return 'screen';
}

/**
 * Fill a template against the values.
 *
 * An absent value renders as an EMPTY STRING, never as the placeholder. A user
 * who sees "{topic_name}" has been shown a bug; a user who sees a slightly
 * shorter sentence has not.
 */
export function fill(template: string, values: CelebrationValues): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = (values as Record<string, unknown>)[key];
    return v === undefined || v === null ? '' : String(v);
  });
}
