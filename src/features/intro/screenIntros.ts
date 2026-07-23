/**
 * Screen intro/tutorial registry (Booth 2026-07-18).
 *
 * PLACEHOLDERS: the real intro/tutorial experiences have not been designed
 * yet. Each entry renders as a simple full-screen overlay (ScreenIntroOverlay)
 * on entry to its screen so the first-time experience can be felt and tweaked
 * screen by screen. Replace `title`/`body` (or the whole overlay) with the real
 * tutorial when each one is designed.
 *
 * Show rules:
 *  - DEV BYPASS `alwaysShowIntros` ON → shows on EVERY entry (new-user feel
 *    each visit, per Booth 2026-07-18), nothing persisted.
 *  - Otherwise → shows once, then a per-screen AsyncStorage key retires it.
 */
export type IntroKey =
  | 'appWelcome' // app welcome after load-in (Home / Course Select)
  | 'commitment' // "Our Commitment to You" — shown right after appWelcome
  | 'firstUserWelcome' // first-user welcome tutorial (first entry into the app)
  | 'dashboard' // method cards screen
  | 'flashcards' // T1 — on first Flashcards entry
  | 'flashcardsCustomize' // T2 — after ~5 card views/swipes
  | 'flashcardsPower' // T3 — first category long-press, or ~45s in
  | 'glossary'
  | 'awards';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const INTRO_STORAGE_PREFIX = 'ape:intro:';

/** Clear every "seen" screen-intro flag so all intros (incl. the app Welcome)
 *  show again — called by Settings → "Reset onboarding hints" (user request
 *  2026-07-23). */
export async function resetScreenIntros(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const introKeys = keys.filter((k) => k.startsWith(INTRO_STORAGE_PREFIX));
  if (introKeys.length) await AsyncStorage.multiRemove(introKeys);
}

/** `placeholder` (default true) tags an entry whose copy is not final — the
 *  overlay shows a PLACEHOLDER badge for those. Finalized copy sets it false.
 *  `button` overrides the dismiss affordance label. */
export const SCREEN_INTROS: Record<
  IntroKey,
  { title: string; body: string; placeholder?: boolean; button?: string }
> = {
  appWelcome: {
    // Final welcome copy (user-provided 2026-07-18).
    placeholder: false,
    title: 'Welcome to Pro Audio Training Academy',
    body:
      'Audio is everywhere—but learning it has always been scattered across books, manuals, videos, forums, and years of experience.\n\n' +
      'We built this platform to bring it together.\n\n' +
      'Browse our professional audio glossary immediately—no account required—or create a free account to save progress and begin your learning journey.\n\n' +
      'Whether you’re a student, musician, engineer, technician, educator, volunteer, or simply curious about audio, we hope this becomes a resource you’ll return to often.\n\n' +
      'Welcome to Pro Audio Training Academy.\n\n' +
      'Let’s get started.',
  },
  commitment: {
    // Final "Our Commitment to You" copy (user-provided 2026-07-18) — shown as
    // the 2nd popup right after the app welcome.
    placeholder: false,
    title: 'Our Commitment to You',
    body:
      'We built this academy to be a trusted place to learn.\n\n' +
      'Our glossary, lessons, and quizzes are created for education—not advertising. Companies cannot pay to influence our definitions, recommendations, or learning content.\n\n' +
      'You’ll never have to deal with intrusive ads or annoying pop-ups interrupting your learning. Our focus is simple: provide clear, unbiased, and technically accurate audio education that puts students first.\n\n' +
      'Thank you for learning with us.',
  },
  firstUserWelcome: {
    title: 'First-Time Walkthrough',
    body:
      'PLACEHOLDER — first-user welcome tutorial. This will become the guided first-run tour for brand-new users: creating your profile, picking a course, and how studying earns awards. Tap anywhere to continue.',
  },
  dashboard: {
    title: 'Method Cards',
    body:
      'PLACEHOLDER — method cards intro. This will teach the study loop: pick a topic, work the methods (flashcards, fill-in, matching…), then take the topic quiz to bank it toward your certificate. Tap anywhere to continue.',
  },
  // T1 — first Flashcards entry (final copy, user-provided 2026-07-18).
  flashcards: {
    placeholder: false,
    title: 'Flashcards',
    body:
      'Learn one term at a time with an interactive deck designed to build long-term mastery.\n\n' +
      '•  Swipe left or right to move through the deck.\n\n' +
      '•  Tap a card to reveal additional learning levels, including definitions, explanations, examples, and related information.\n\n' +
      '•  Show All displays both the term and definition together on the same card, while Full Screen provides a distraction-free study experience.',
    button: 'Tap anywhere to continue',
  },
  // T2 — after ~5 card views/swipes (final copy, user-provided 2026-07-18).
  flashcardsCustomize: {
    placeholder: false,
    title: 'Customize Your Deck',
    body:
      'Study exactly what you want.\n\n' +
      'Use Filters to show or hide different definitions, learning status, bookmarks, favorites, or your own ' +
      'custom categories. Build a flashcard deck that’s tailored to your learning goals.',
    button: 'Got It',
  },
  // T3 — first category long-press, or ~45s in (final copy, user-provided
  // 2026-07-18; "Flagged" → "Bookmarks" to match the app).
  flashcardsPower: {
    placeholder: false,
    title: 'Power Features',
    body:
      'Unlock additional ways to organize and study.\n\n' +
      'Press and hold any category button—such as Beginner, Intermediate, Advanced, Known, Bookmarks, or ' +
      'Custom—to view everything inside that category. From there, you can review terms, edit custom lists, and ' +
      'reassign terms between categories.\n\n' +
      'Mark terms as Known as you master them, and use Bookmarks or Custom categories to create personalized ' +
      'study collections.',
    button: 'Start Studying',
  },
  glossary: {
    // Final glossary welcome copy (user-provided 2026-07-18).
    placeholder: false,
    title: 'Welcome to the Pro Audio Training Academy Glossary',
    body:
      'Professional audio terminology is spread across countless books, manuals, manufacturers, websites, and years of real-world experience. Our goal is to bring that knowledge together into one organized, accurate, and easy-to-use reference.\n\n' +
      'Whether you’re just beginning or already working in the industry, this glossary is designed to help you better understand the language of professional audio.\n\n' +
      'Our content is continually reviewed, expanded, and updated as new technologies, standards, and terminology evolve.\n\n' +
      'Thank you for using the Pro Audio Training Academy Glossary. We hope it becomes a trusted resource throughout your audio journey.',
  },
  awards: {
    title: 'Awards',
    body:
      'PLACEHOLDER — awards intro. This will explain trophies, certificates, and how topic quizzes count toward completion. Tap anywhere to continue.',
  },
};
