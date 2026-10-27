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
  | 'commitment' // "Our Commitment to You" — currently the FIRST overlay a new
  //                 user meets, because appWelcome is switched off on AuthScreen
  | 'dashboard' // method cards screen
  | 'flashcards' // T1 — on first Flashcards entry
  | 'flashcardsCustomize' // T2 — after ~5 card views/swipes
  | 'flashcardsPower' // T3 — first category long-press, or ~45s in
  | 'flashcardsTopicScope' // DAW (free topic) — ALL list open 7 s, or 30th card (owner 2026-10-26)
  | 'glossary'
  | 'glossaryCustom' // Glossary CUSTOM STUDY LIST filter — first tap (UX review 2026-10-15)
  | 'awards'
  | 'enrollments' // My Enrollments Dashboard — first open (owner 2026-10-15); also from its ? menu
  | 'mixingProNote' // Mixing family (Beginning/Advanced Mixing, Mastering, Mixing Guides) — first open
  | 'introVideo'; // onboarding video, first Academy menu visit (owner 2026-10-09) — never drawn as a sheet

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const INTRO_STORAGE_PREFIX = 'ape:intro:';

/** In-memory intro stores under `ape:intro:*` that must forget what they
 *  hold when the keys are cleared (the lab term popup's seen list). Each
 *  registers itself when its module is first evaluated; a store never loaded
 *  holds nothing to forget. */
const introResetListeners = new Set<() => void>();
export function onScreenIntrosReset(fn: () => void): void {
  introResetListeners.add(fn);
}

/** Clear every "seen" screen-intro flag so all intros (incl. the app Welcome)
 *  show again — called by Settings → "Reset onboarding hints" (user request
 *  2026-07-23). */
export async function resetScreenIntros(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const introKeys = keys.filter((k) => k.startsWith(INTRO_STORAGE_PREFIX));
  if (introKeys.length) await AsyncStorage.multiRemove(introKeys);
  for (const fn of Array.from(introResetListeners)) {
    try {
      fn();
    } catch {
      // one store failing to forget must not stop the others
    }
  }
}

/**
 * ⛔ THE LAB TERM POPUP SHOWS FIRST (owner 2026-10-19: "a popup to appear
 * first … then a continue button and on into the lab").
 *
 * Two module-level signals, kept here because every intro already imports
 * this file (no new module at app start — perf start trim, 2026-10-04):
 *
 *  • OWED — a focused lab's term popup is still to come on this visit
 *    (LabTermIntro publishes it). The lab's own first-open popups hold while
 *    it is: useScreenIntro (ProNote and any screen intro) and
 *    GuestStartReminder. Two root Modals at once are refused on iOS (K10).
 *  • HELD — something owns the lab's screen before the lab itself: the
 *    amplitude orientation page, drawn IN PLACE of a visual lab until it is
 *    completed. The term popup waits for it, so it introduces the lab and not
 *    the orientation.
 *
 * Plain objects, not `let`: neither is user data (they only order popups),
 * and both empty themselves when their screens unmount.
 */
const labTermSignal = { owed: new Set<number>(), holds: new Set<number>(), seq: 0 };
const labTermListeners = new Set<() => void>();
function emitLabTerm(): void {
  for (const l of Array.from(labTermListeners)) l();
}
function subscribeLabTerm(l: () => void): () => void {
  labTermListeners.add(l);
  return () => {
    labTermListeners.delete(l);
  };
}
/** A new owner id for setLabTermIntroOwed / holdLabTermIntro. */
export function labTermSignalId(): number {
  labTermSignal.seq += 1;
  return labTermSignal.seq;
}
export function setLabTermIntroOwed(id: number, owed: boolean): void {
  const had = labTermSignal.owed.has(id);
  if (owed === had) return;
  if (owed) labTermSignal.owed.add(id);
  else labTermSignal.owed.delete(id);
  emitLabTerm();
}
export function isLabTermIntroOwed(): boolean {
  return labTermSignal.owed.size > 0;
}
export function useLabTermIntroOwed(): boolean {
  return useSyncExternalStore(subscribeLabTerm, isLabTermIntroOwed, isLabTermIntroOwed);
}
/** Hold the term popup back while the caller owns the screen; returns the
 *  release (an effect cleanup). */
export function holdLabTermIntro(): () => void {
  const id = labTermSignalId();
  labTermSignal.holds.add(id);
  emitLabTerm();
  return () => {
    if (labTermSignal.holds.delete(id)) emitLabTerm();
  };
}
export function isLabTermIntroHeld(): boolean {
  return labTermSignal.holds.size > 0;
}
export function useLabTermIntroHeld(): boolean {
  return useSyncExternalStore(subscribeLabTerm, isLabTermIntroHeld, isLabTermIntroHeld);
}

/** `placeholder` (default true) tags an entry whose copy is not final — the
 *  overlay shows a PLACEHOLDER badge for those. Finalized copy sets it false.
 *  `button` overrides the dismiss affordance label. */
export const SCREEN_INTROS: Record<
  IntroKey,
  { title: string; body: string; placeholder?: boolean; button?: string }
> = {
  // The onboarding video (owner 2026-10-09). Only its seen-flag is used — the
  // video plays on IntroVideoScreen, never in an IntroSheet.
  introVideo: {
    placeholder: false,
    title: 'Introduction video',
    body:
      'A short tour of the Academy: the professional audio glossary, the labs, the audio tools and calculators, and how to enroll and study. ' +
      'It plays once, on your first visit to the Academy menu. Watch it again any time with Replay intro.',
  },
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
    // Final "Our Commitment to You" copy (user-provided 2026-07-18).
    // Pricing-honesty line added to the trust theme (owner 2026-08-21).
    //
    // The "Welcome to Pro Audio Training Academy." opener was dropped
    // 2026-10-26 (popup review D6): this now shows after the intro video and
    // the Glossary welcome (~4 min into the Glossary), so a second "Welcome"
    // read as a repeat.
    placeholder: false,
    title: 'Our Commitment to You',
    body:
      'We built this academy to be a trusted place to learn.\n\n' +
      'Our glossary, lessons, and quizzes are created for education—not advertising. Companies cannot pay to influence our definitions, recommendations, or learning content.\n\n' +
      'You’ll never have to deal with intrusive ads or sales pop-ups interrupting your learning. Our focus is simple: provide clear, unbiased, and technically accurate audio education that puts students first.\n\n' +
      'Our pricing is just as straightforward. One membership. Not a series of extra charges—what your membership includes stays included, with no add-ons or surprise fees.\n\n' +
      'Thank you for learning with us.',
  },
  dashboard: {
    // Ratified by the owner 2026-09-13 (plan §3; wording corrections applied).
    placeholder: false,
    title: 'Your Study Dashboard',
    body:
      'Every topic here follows the same loop.\n\n' +
      'Work the study methods in order — each one unlocks the next — then take the Topic Quiz. Passing the quiz banks the topic toward its certificate.\n\n' +
      'Swipe the topic card left or right to change topics, or tap the rotary dial to jump straight to any topic in your deck. Tap the topic card to open its expanded view — press and hold to list every term inside it.',
    button: 'Start Studying',
  },
  // T1 — first Flashcards entry (final copy, user-provided 2026-07-18).
  flashcards: {
    placeholder: false,
    title: 'Flashcards',
    body:
      'Learn one term at a time with an interactive deck designed to build long-term mastery.\n\n' +
      '•  Swipe left or right to move through the deck.\n\n' +
      '•  Tap a card to reveal additional learning levels, including definitions, explanations, examples, and related information.\n\n' +
      '•  Tap the eye button to see the term and its definition together (FULL VIEW), or the green full-screen button for distraction-free study.',
    button: 'Tap anywhere to continue',
  },
  // T2 — after ~5 card views/swipes (final copy, user-provided 2026-07-18).
  flashcardsCustomize: {
    placeholder: false,
    title: 'Customize Your Deck',
    body:
      'Study exactly what you want.\n\n' +
      'Use FILTER to choose which parts of each definition appear when you reveal a card. Use the BEG, INT, ADV, ' +
      'KNOWN, Bookmarks and Custom list buttons to choose which cards are in your deck. Build a flashcard deck ' +
      'that’s tailored to your learning goals.',
    button: 'Got It',
  },
  // T3 — first category long-press, or ~45s in (final copy, user-provided
  // 2026-07-18; "Flagged" → "Bookmarks" to match the app).
  flashcardsPower: {
    placeholder: false,
    title: 'Power Features',
    body:
      'Unlock additional ways to organize and study.\n\n' +
      'Press and hold any category button—BEG, INT, ADV, KNOWN, Bookmarks or Custom list—to view everything ' +
      'inside that category. From there, you can review terms and add them to Known, Bookmarks or your Custom ' +
      'list.\n\n' +
      'Mark terms as Known as you master them, and use Bookmarks or Custom categories to create personalized ' +
      'study collections.',
    button: 'Got it',
  },
  // DAW Fundamentals (the free topic) only — see features/intro/topicScopeNote
  // (owner 2026-10-26: "don't see a term? ... you write the text"). Topic
  // names are the live active titles (checked in the DB 2026-10-26).
  flashcardsTopicScope: {
    placeholder: false,
    title: 'Don’t See a Term?',
    body:
      'DAW Fundamentals & Session Management covers the DAW itself: sessions, tracks, routing, editing, plug-ins and keeping projects organized.\n\n' +
      'Many audio terms have a topic of their own, where they’re covered fully:\n\n' +
      '•  EQ → Equalization (EQ)\n' +
      '•  Compression, limiting, gating → Dynamics — Compression, Limiting & Gating (Core)\n' +
      '•  Reverb → Reverb\n' +
      '•  Delay & echo → Delay & Time-Based Effects\n\n' +
      'Every term is grouped into the topic that covers it specifically and completely. You can look up any term in the Glossary.',
    button: 'Got it',
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
  glossaryCustom: {
    // First tap on the Glossary's CUSTOM STUDY LIST filter (owner 2026-10-15,
    // from the UX review: "the concept of custom isn't clear").
    placeholder: false,
    title: 'Your Custom Study List',
    body:
      'This is your own study deck, made from any glossary terms you choose.\n\n' +
      'To add a term, tap the three-card icon beside it; tap it again to take it off. The CUSTOM STUDY LIST button shows only the terms you’ve added. Press and hold it to see and edit the whole list.\n\n' +
      // Popup review 2 D2 (2026-10-27): the list has no unlock order. Since
      // D12 (2026-10-27) it has scenarios and its own practice quiz too
      // (studyGate customListMethods() / customListHasQuiz()).
      'Your deck sits on the Study Dashboard like a topic of its own. You can study it with flashcards, fill-in-the-blank, matching and scenarios, and every method is open from the start. Once it holds 30 terms you can also take a practice quiz on it, not counted toward anything.\n\n' +
      // 2026-10-19: the list is ALWAYS on the Study dashboard now (no LOAD step).
      'It is always on your Study Dashboard: open Study and turn the topic dial to My Custom List.\n\n' +
      'Use it for terms you find difficult, words from a class or a job, or anything you want to practice.',
    button: 'Got it',
  },
  enrollments: {
    // Owner-written copy, 2026-10-15. Shown once, on the first open of My
    // Enrollments Dashboard, and again any time from that page's ? menu.
    placeholder: false,
    title: 'Understand What You’ll Encounter',
    body:
      'To work confidently in audio, you need to recognize what’s in front of you, know what it’s called, and understand how it works.\n\n' +
      'That’s why our learning starts with the glossary.\n\n' +
      'Each topic organizes the language of that field into a foundation of knowledge—from essential concepts and familiar equipment to specialized terms and less common situations.\n\n' +
      'You’ll learn more than definitions. You’ll explore what things do, why and where they’re used, common mistakes, and how related ideas connect. Flashcards, matching, fill-in-the-blank activities, and scenario questions help you practice and strengthen that understanding.\n\n' +
      'The goal is to make your field more familiar, so you can identify equipment, understand conversations, recognize potential problems, and approach hands-on training better prepared.\n\n' +
      'Start with a topic. Build your knowledge. Work toward certificates and program certificates.',
    button: 'Continue',
  },
  awards: {
    // Ratified by the owner 2026-09-13 (plan §3; rewritten for Achievements
    // v3 — three categories, no trophy wall).
    placeholder: false,
    title: 'Your Trophy Case',
    body:
      'Everything you earn lives in three collections.\n\n' +
      'TOPICS — every topic quiz you pass is banked here.\n\n' +
      'CERTIFICATES — complete a certificate’s required topics and labs, then pass its Final Exam to earn it.\n\n' +
      'PROGRAMS — a broad topic path across a whole discipline, earned the same way.\n\n' +
      'Tap any collection to see what you’ve earned and what’s still ahead.',
    button: 'Tap anywhere to continue',
  },
  mixingProNote: {
    // The owner's own copy, word for word (owner 2026-10-07: chose "original,
    // unchanged"; the title was added). Rendered by ProNoteSheet
    // (src/features/lab/ProNote.tsx) — a scrolling body with GOT IT pinned
    // below, not the tap-anywhere IntroSheet. Paragraphs split on blank lines.
    placeholder: false,
    title: 'Knowing When to Bring In a Pro',
    body:
      'As you begin these mixing and mastering labs, remember that learning these processes also helps you recognize when to bring in a qualified professional. For music you intend to release, an experienced mixing or mastering engineer can be a valuable investment in the final result.\n\n' +
      'A skilled engineer brings practiced listening, technical judgment, reliable equipment, and a studio environment that supports accurate decisions. Their experience helps them recognize problems, preserve what already works, and choose changes that serve the music. When choosing someone, listen to their previous work, review their credits, and consider their experience with your musical style. Equipment and an impressive résumé matter, but the quality of their work and their understanding of your goals matter most.\n\n' +
      'This is especially valuable in mastering. An experienced mastering engineer may evaluate finished mixes from many artists, producers, and mixing engineers, developing a broad perspective on balance, dynamics, and release preparation. Just as importantly, they hear your project with fresh ears. After repeatedly recording, editing, and mixing the same music, you can become accustomed to imbalances, harshness, distortion, or excessive processing. Even experienced professionals can lose perspective when they have spent too long with a track.\n\n' +
      'If these labs inspire you to pursue mixing or mastering professionally, pursue that goal. Practice, develop your listening skills, seek feedback, and build your experience. If your main goal is to create and release music, however, and your listening skills, monitoring environment, or understanding of the process are still developing, professional help may give your work its best opportunity to succeed.\n\n' +
      'Continue learning and experimenting. Understanding the craft will help you communicate your intentions and evaluate the results when you collaborate with an engineer. Knowing when to seek another person’s expertise is itself an important professional skill.',
    button: 'Got it',
  },
};
