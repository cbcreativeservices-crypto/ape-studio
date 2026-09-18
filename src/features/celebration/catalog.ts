/**
 * Every celebration in the app, as data.
 *
 * Owner's copy, 2026-09-17, kept as written. Where I have changed anything it
 * is noted inline with the reason — and the changes are all structural (which
 * tier a thing belongs to), not editorial, except the one case flagged under
 * `quiz-not-passed` where the copy promised something it did not deliver.
 *
 * ADDING A CELEBRATION is a row here plus an id in types.ts. There is no screen
 * to write, which is the point.
 */
import type { CelebrationDef, CelebrationId } from './types';

const VIEW_TROPHY = { label: 'VIEW IN TROPHY CASE', kind: 'trophy-case' } as const;
const DONE = { label: 'DONE', kind: 'dismiss' } as const;
const SHARE = { label: 'SHARE', kind: 'share' } as const;

export const CELEBRATIONS: Record<CelebrationId, CelebrationDef> = {
  // ── step · an activity inside a topic ──────────────────────────────────────
  // These three are the reason the tier system exists. As full screens they
  // would be ~500 dismissals across the curriculum; as inline notices they are
  // a pat on the back that costs the user nothing.
  'flashcards-complete': {
    id: 'flashcards-complete',
    tier: 'step',
    kicker: 'NICE WORK!',
    title: 'FLASHCARD DECK COMPLETE',
    subject: '{topic_name}',
    body: [
      'You made it through the entire deck. Those important terms and concepts are becoming part of your professional audio vocabulary.',
    ],
    actions: [{ label: 'KEEP GOING', kind: 'dismiss', primary: true }],
  },

  'matching-complete': {
    id: 'matching-complete',
    tier: 'step',
    kicker: 'EVERYTHING CONNECTED!',
    title: 'MATCHING COMPLETE',
    subject: '{topic_name}',
    body: [
      'You found every correct match and completed the activity. Nicely done—your understanding of the key terms is coming together.',
    ],
    actions: [{ label: 'CONTINUE', kind: 'dismiss', primary: true }],
  },

  'fill-blank-complete': {
    id: 'fill-blank-complete',
    tier: 'step',
    kicker: 'NO BLANKS LEFT!',
    title: 'FILL IN THE BLANK COMPLETE',
    subject: '{topic_name}',
    body: [
      'You completed every answer and put the language and concepts of professional audio to work in context.',
    ],
    actions: [{ label: 'GREAT WORK—CONTINUE', kind: 'dismiss', primary: true }],
  },

  // ── stage · a gate opened, or a score moved ───────────────────────────────
  'scenarios-complete': {
    id: 'scenarios-complete',
    tier: 'stage',
    kicker: 'KNOWLEDGE IN ACTION',
    title: 'SCENARIOS COMPLETE',
    subject: '{topic_name}',
    body: [
      'You worked through every scenario and applied what you learned to realistic audio situations.',
      'Excellent work. The final quiz is next.',
    ],
    actions: [{ label: 'TAKE THE FINAL QUIZ', kind: 'start-quiz', primary: true }],
  },

  'final-quiz-unlocked': {
    id: 'final-quiz-unlocked',
    tier: 'stage',
    kicker: 'YOU’RE READY!',
    title: 'FINAL QUIZ UNLOCKED',
    subject: '{topic_name}',
    body: [
      'You completed every learning activity for this topic. You reviewed the terminology, connected the concepts, and applied your knowledge.',
      'Now it’s time to show what you know.',
    ],
    actions: [{ label: 'START FINAL QUIZ', kind: 'start-quiz', primary: true }],
  },

  /**
   * The most important celebration in this file, and the one the draft served
   * worst. This is the screen that decides whether somebody carries on or quits.
   *
   * CHANGED FROM THE DRAFT, deliberately: it said "now you know exactly which
   * concepts need another look" and then did not show them. Naming the weak
   * areas here turns a defeat into a task, and it is the difference between
   * "you failed" and "here is what to do". The host passes them in; when it has
   * none the sentence simply does not appear (see `fill`).
   */
  'quiz-not-passed': {
    id: 'quiz-not-passed',
    tier: 'stage',
    encouragement: true,
    kicker: 'KEEP GOING',
    title: 'QUIZ COMPLETE',
    subject: '{topic_name}',
    stat: 'YOUR SCORE: {score}%',
    body: [
      'You completed the quiz but have not reached the passing score yet. Now you know exactly which concepts need another look.',
      'Review your results, strengthen those areas, and give it another try when you’re ready.',
    ],
    actions: [
      { label: 'REVIEW RESULTS', kind: 'view-results', primary: true },
      { label: 'TRY AGAIN', kind: 'retry-quiz' },
    ],
  },

  'score-improved': {
    id: 'score-improved',
    tier: 'stage',
    kicker: 'SCORE IMPROVED!',
    title: '{new_score}%',
    subject: 'Previous score: {previous_score}%',
    body: [
      'Your review paid off. You improved your score by {improvement} percentage points.',
    ],
    actions: [{ label: 'KEEP GOING', kind: 'dismiss', primary: true }],
  },

  'daily-practice': {
    id: 'daily-practice',
    tier: 'stage',
    title: 'TODAY’S PRACTICE COMPLETE',
    body: [
      'Nice work. You set aside time to strengthen your professional audio knowledge today.',
      'Focused practice adds up.',
    ],
    actions: [DONE],
  },

  // ── milestone · a topic, a lab or a subject finished ──────────────────────
  'topic-complete': {
    id: 'topic-complete',
    tier: 'milestone',
    kicker: 'YOU DID IT!',
    title: 'TOPIC COMPLETE',
    subject: '{topic_name}',
    stat: 'FINAL QUIZ: {score}%',
    body: [
      'You passed the final quiz and completed the entire topic. Your work paid off, and this achievement now has a place in your Trophy Case.',
      'That’s one more area of professional audio you can confidently add to your record.',
    ],
    actions: [
      { label: 'VIEW RESULTS', kind: 'view-results', primary: true },
      { label: 'SEE IN TROPHY CASE', kind: 'trophy-case' },
    ],
  },

  'perfect-score': {
    id: 'perfect-score',
    tier: 'milestone',
    kicker: 'PERFECT SCORE!',
    title: '100% CORRECT',
    subject: '{topic_name}',
    body: [
      'Outstanding work. You answered every question correctly and completed the topic with a perfect score.',
      'Your achievement is now displayed in your Trophy Case.',
    ],
    actions: [
      { label: 'VIEW RESULTS', kind: 'view-results', primary: true },
      { label: 'SEE IN TROPHY CASE', kind: 'trophy-case' },
    ],
  },

  'lab-complete': {
    id: 'lab-complete',
    tier: 'milestone',
    title: 'LAB COMPLETE',
    subject: '{lab_name}',
    body: [
      'Nicely done. You explored the concepts, worked through the activities, and completed the entire lab.',
      'Your lab progress has been recorded.',
    ],
    actions: [DONE],
  },

  'subject-complete': {
    id: 'subject-complete',
    tier: 'milestone',
    title: 'SUBJECT COMPLETE',
    subject: '{subject_name}',
    body: [
      'Impressive work. You completed every topic in this subject—an entire area of professional audio study.',
      'Take a moment to appreciate how much you have accomplished.',
    ],
    actions: [{ label: 'VIEW SUMMARY', kind: 'view-summary', primary: true }, DONE],
  },

  /**
   * The best idea in the owner's draft and the most under-used: it is the one
   * celebration that TEACHES the credential structure, by showing a learner
   * that one piece of work counted towards several things at once.
   */
  'requirement-complete': {
    id: 'requirement-complete',
    tier: 'milestone',
    title: 'REQUIREMENT COMPLETE',
    subject: '{requirement_name}',
    body: [
      'Excellent work. This standing requirement is now complete and has been applied to every certificate and professional program that requires it.',
    ],
    actions: [
      { label: 'VIEW WHERE IT APPLIES', kind: 'view-requirement', primary: true },
      DONE,
    ],
  },

  // ── credential · the strongest, and the rarest ────────────────────────────
  'first-certificate': {
    id: 'first-certificate',
    tier: 'credential',
    kicker: 'YOUR FIRST CERTIFICATE',
    title: '{certificate_name}',
    body: [
      'Congratulations—you have earned your first Pro Audio Training Academy certificate.',
      'This credential recognizes your focused achievement in a specialized area of professional audio. It has been added to your permanent credential record and can be viewed, shared, and independently verified.',
    ],
    actions: [{ label: 'VIEW CERTIFICATE', kind: 'view-credential', primary: true }, SHARE],
  },

  'certificate-earned': {
    id: 'certificate-earned',
    tier: 'credential',
    kicker: 'CERTIFICATE EARNED',
    title: '{certificate_name}',
    body: [
      'Excellent work. You have added another specialization certificate to your professional record.',
      'Your new credential is now displayed in your Trophy Case and is available to view, share, and verify.',
    ],
    actions: [{ label: 'VIEW CERTIFICATE', kind: 'view-credential', primary: true }, SHARE],
  },

  'first-program': {
    id: 'first-program',
    tier: 'credential',
    kicker: 'PROFESSIONAL PROGRAM COMPLETED',
    title: '{program_name}',
    body: [
      'This is a major achievement.',
      'You have completed a comprehensive program of study and earned your first professional program credential from Pro Audio Training Academy.',
      'Your credential has been added to your permanent record and can be viewed, shared, and independently verified.',
    ],
    actions: [{ label: 'VIEW CREDENTIAL', kind: 'view-credential', primary: true }, SHARE],
  },

  'program-complete': {
    id: 'program-complete',
    tier: 'credential',
    kicker: 'ANOTHER PROFESSIONAL PROGRAM COMPLETED',
    title: '{program_name}',
    body: [
      'Congratulations on another significant achievement.',
      'You have added a comprehensive professional program credential to your record. Your Trophy Case now reflects achievement across multiple areas of professional audio.',
      'Your new credential is ready to view, share, and verify.',
    ],
    actions: [{ label: 'VIEW CREDENTIAL', kind: 'view-credential', primary: true }, SHARE],
  },

  /**
   * SUPPRESSES the individual credential celebrations — see `raise()` in
   * CelebrationHost. Without that, finishing a capstone that satisfies three
   * credentials at once would stack three full screens, and the third would be
   * dismissed unread.
   */
  'multiple-credentials': {
    id: 'multiple-credentials',
    tier: 'credential',
    kicker: 'MULTIPLE CREDENTIALS EARNED!',
    title: '{credential_count} CREDENTIALS',
    body: [
      'Your completed work fulfilled the requirements for {credential_count} credentials.',
      'Each new credential has been added to your Trophy Case and permanent credential record.',
    ],
    actions: [{ label: 'VIEW CREDENTIALS', kind: 'view-credential', primary: true }, SHARE],
  },
};

/** Ids that are about a credential, for the suppression rule above. */
export const CREDENTIAL_IDS: readonly CelebrationId[] = [
  'first-certificate',
  'certificate-earned',
  'first-program',
  'program-complete',
];

export function celebration(id: CelebrationId): CelebrationDef {
  return CELEBRATIONS[id];
}

/** Every definition, for tests and the dev index. */
export const ALL_CELEBRATIONS: CelebrationDef[] = Object.values(CELEBRATIONS);

// Kept exported so the Trophy Case empty-state copy and these stay in step.
export const TROPHY_CASE_EMPTY = {
  title: 'TROPHY CASE',
  tagline: 'YOUR WORK, RECOGNIZED.',
  intro:
    'Everything you accomplish across Pro Audio Training Academy is collected here—creating a lasting record of your progress, knowledge, and earned credentials.',
  topics: 'Your completed topics will appear here.',
  certificates: 'Your earned specialization certificates will appear here.',
  programs: 'Your completed professional program credentials will appear here.',
  featured: 'Your first achievement will take center stage here.',
  featuredHint:
    'As your Trophy Case grows, you can select an accomplishment to feature and share.',
} as const;

/**
 * The short confirmations that are NOT celebrations — they are receipts.
 *
 * Exported as data so nobody writes a slightly different "Progress saved." in
 * three places, and so the distinction the owner drew (banner, not celebration)
 * survives contact with the codebase.
 */
export const CONFIRMATIONS = {
  progressSaved: 'Progress saved.',
  trophyUpdated: 'Trophy Case updated.',
  credentialAdded: 'Credential added to your record.',
  shareCopied: 'Share link copied.',
  certificateDownloaded: 'Certificate downloaded.',
  credentialShared: 'Credential successfully shared.',
  credentialVerified: 'Credential successfully verified.',
  savedOffline: 'Saved on this device. Progress will sync when you reconnect.',
  synced: 'Progress synced across your devices.',
  oneRequirementLeft: 'One requirement remains.',
  allRequirementsComplete: 'All requirements complete.',
} as const;
