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
  | 'firstUserWelcome' // first-user welcome tutorial (first entry into the app)
  | 'dashboard' // method cards screen
  | 'flashcards'
  | 'glossary'
  | 'awards';

export const INTRO_STORAGE_PREFIX = 'ape:intro:';

/** `placeholder` (default true) tags an entry whose copy is not final — the
 *  overlay shows a PLACEHOLDER badge for those. Finalized copy sets it false. */
export const SCREEN_INTROS: Record<IntroKey, { title: string; body: string; placeholder?: boolean }> = {
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
  flashcards: {
    title: 'Flashcards',
    body:
      'PLACEHOLDER — flashcards intro. This will teach the card anatomy (term → reveal levels), swiping, marking KNOWN, and flagging terms to build your own study list. Tap anywhere to continue.',
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
