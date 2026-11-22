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
const labTermSignal = {
  owed: new Set<number>(),
  holds: new Set<number>(),
  /** Screen intro cards owed or on screen (ScreenGuide's IntroCardController
   *  and its overlay) — see "ONE AT A TIME" below. */
  cards: new Set<number>(),
  /** Work under way inside a ScreenGuideHost (a tray open, a drag). */
  work: new Set<number>(),
  /** Hosts able to carry the lab term inside their intro card: 'pending'
   *  while the card's seen flag is still being read, 'ready' once it is due. */
  carriers: new Map<number, 'pending' | 'ready'>(),
  /** The focused lab's term, offered to a carrier while it is owed. */
  offered: null as CarriedLabTerm | null,
  offeredBy: 0,
  seq: 0,
};
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
function setIn(set: Set<number>, id: number, on: boolean): void {
  if (set.has(id) === on) return;
  if (on) set.add(id);
  else set.delete(id);
  emitLabTerm();
}
export function setLabTermIntroOwed(id: number, owed: boolean): void {
  setIn(labTermSignal.owed, id, owed);
}
/**
 * ⛔ ONE AT A TIME (audit 2026-11-14, row 1: "Two to four popups arrive
 * before the first touch, and late ones swallow the first tap"; owner
 * approval: "Begin fixing all bugs found and do obvious ... fixes").
 *
 * "Owed" now means a FIRST-OPEN CARD is still to come on this visit: the lab
 * term popup OR the screen's intro card (which may carry the term inside it,
 * see CARRY below). Everything that already waited for the term popup — the
 * lab's own first-open popups (useScreenIntro: ProNote), GuestStartReminder,
 * LabShell's arrival audio ask and the ⓘ hint — now also waits for the card,
 * so they come one after another, never on top of each other.
 */
export function isLabTermIntroOwed(): boolean {
  return labTermSignal.owed.size > 0 || labTermSignal.cards.size > 0;
}
export function useLabTermIntroOwed(): boolean {
  return useSyncExternalStore(subscribeLabTerm, isLabTermIntroOwed, isLabTermIntroOwed);
}
/** The TERM popup alone (the intro card itself waits on this, never on its
 *  own entry). */
export function isLabTermOnlyOwed(): boolean {
  return labTermSignal.owed.size > 0;
}
export function useLabTermOnlyOwed(): boolean {
  return useSyncExternalStore(subscribeLabTerm, isLabTermOnlyOwed, isLabTermOnlyOwed);
}
/** A focused screen's intro card is owed or on screen (ScreenGuide). */
export function setIntroCardOwed(id: number, owed: boolean): void {
  setIn(labTermSignal.cards, id, owed);
}
export function isIntroCardOwed(): boolean {
  return labTermSignal.cards.size > 0;
}

/**
 * WORK UNDER WAY (introHold.ts publishes it): a view inside a ScreenGuideHost
 * has a tray open or a drag on its lane. App-wide, so surfaces outside the
 * host (the lab term popup, the Sound Safety arrival ask) never open over it.
 */
export function setScreenWork(id: number, on: boolean): void {
  setIn(labTermSignal.work, id, on);
}
export function isScreenWorkUnderway(): boolean {
  return labTermSignal.work.size > 0;
}
export function useScreenWorkUnderway(): boolean {
  return useSyncExternalStore(subscribeLabTerm, isScreenWorkUnderway, isScreenWorkUnderway);
}

/**
 * CARRY: the lab term rides INSIDE the intro card (audit 2026-11-14, row 1:
 * "Merge the term card into the intro card"). One card, the term on top.
 *
 *   LabTermIntro  — while its term is owed and ready, OFFERS it
 *                   (offerLabTermToCard) and, while a carrier is 'pending' or
 *                   'ready', draws nothing of its own (still owed, so the
 *                   lab's other popups keep waiting);
 *   ScreenGuide   — a focused host whose intro card is due registers as a
 *                   carrier (setLabTermCarrier), draws the offered term inside
 *                   the card, and on close reports it read
 *                   (finishCarriedLabTerm), which marks the term seen.
 * A screen with no intro card due has no carrier: the term shows on its own
 * sheet as before.
 */
export type CarriedLabTerm = { key: string; title: string; plainEnglish: string };
/** `offeredBy` is the owner of the offer slot: a blurred lab withdrawing late
 *  never clears the focused lab's offer. */
export function offerLabTermToCard(owner: number, term: CarriedLabTerm | null): void {
  if (!term) {
    if (labTermSignal.offeredBy !== owner || labTermSignal.offered == null) return;
    labTermSignal.offeredBy = 0;
    labTermSignal.offered = null;
    emitLabTerm();
    return;
  }
  const cur = labTermSignal.offered;
  if (labTermSignal.offeredBy === owner && cur && cur.key === term.key && cur.plainEnglish === term.plainEnglish) return;
  labTermSignal.offeredBy = owner;
  labTermSignal.offered = term;
  emitLabTerm();
}
function offeredNow(): CarriedLabTerm | null {
  return labTermSignal.offered;
}
export function useOfferedLabTerm(): CarriedLabTerm | null {
  return useSyncExternalStore(subscribeLabTerm, offeredNow, offeredNow);
}
export function setLabTermCarrier(id: number, state: 'none' | 'pending' | 'ready'): void {
  const cur = labTermSignal.carriers.get(id) ?? 'none';
  if (cur === state) return;
  if (state === 'none') labTermSignal.carriers.delete(id);
  else labTermSignal.carriers.set(id, state);
  emitLabTerm();
}
/** 'ready' if any carrier is ready, else 'pending' if any is still reading,
 *  else 'none'. */
export function labTermCarrierState(): 'none' | 'pending' | 'ready' {
  let pending = false;
  for (const s of labTermSignal.carriers.values()) {
    if (s === 'ready') return 'ready';
    pending = true;
  }
  return pending ? 'pending' : 'none';
}
export function useLabTermCarrierState(): 'none' | 'pending' | 'ready' {
  return useSyncExternalStore(subscribeLabTerm, labTermCarrierState, labTermCarrierState);
}
const carriedDone = new Set<(key: string) => void>();
/** The carrying card closed: its term was read. */
export function finishCarriedLabTerm(key: string): void {
  for (const fn of Array.from(carriedDone)) fn(key);
}
export function onCarriedLabTermDone(fn: (key: string) => void): () => void {
  carriedDone.add(fn);
  return () => {
    carriedDone.delete(fn);
  };
}

/**
 * A popup ignores taps for its first moment (audit 2026-11-14, quick win 1:
 * "Make popups ignore taps until they are fully shown"). A tap aimed at the
 * page a beat before a card arrived must not close it, nor press a button on
 * it. Shared by the intro card, the term popup, the ⓘ hint and the Sound
 * Safety sheet.
 */
export const POPUP_ARM_MS = 350;
/** Pure: is a tap at `now` inside the arm window of a popup shown at `shownAt`? */
export function popupArming(shownAt: number | null, now: number, armMs = POPUP_ARM_MS): boolean {
  return shownAt != null && now - shownAt < armMs;
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
      'Our glossary, lessons, and quizzes are created for education—not advertising. Companies cannot pay to influence our definitions, suggestions, or learning content.\n\n' +
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
      'Learn one term at a time with an interactive deck designed to help you remember it for the long term.\n\n' +
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
      'Use FILTER to choose which parts of each definition appear when you reveal a card. Use the BEG, INT, ADV (beginner, intermediate, advanced), ' +
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
    // Title + the LABS line 2026-10-29 (owner: "Trophy Case" is not
    // relevant; the LABS tile was added).
    title: 'My Progress',
    body:
      'Everything you earn lives in four collections.\n\n' +
      'TOPICS — every topic quiz you pass is banked here.\n\n' +
      'LABS — every lab you complete is listed here.\n\n' +
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

/**
 * ⛔ THE GUEST PRIVACY NOTICE (owner 2026-11-20) [MD:D72].
 *
 * Every tap of GUEST MODE (each one erases the visit before it, D57) owes one
 * popup on the main menu BEFORE the intro video: our stance on tracking, the
 * guest erase, and how little an account keeps. "Got it" settles it and the
 * video then plays — every guest sign-in, by the owner's choice (its "seen"
 * flag is device-level and survives the wipe, so on its own it plays once per
 * phone; `guestVideoOwed` launches it anyway, without touching that flag).
 *
 * Every sentence is true for the shipped app (checked 2026-11-20 against
 * features/telemetry, clearLocalAccountData GUEST_KEEP and Privacy Policy
 * 3.2): no advertising id and no cross-app tracking; the guest wipe keeps only
 * the glossary / calculator weekly counts, the install id and intro flags;
 * Sentry and Aptabase carry no name, email or account. Change a fact here
 * only together with the code that makes it true.
 *
 * In memory on purpose: both are owed by THIS sign-in, never a stored record
 * (no storage at all). A later account sign-in cannot show it: the notice
 * and the guest video both require useGuestWording().guest.
 * Kept in this file (already at app start) so no new module joins the start
 * graph (perfStartTrim, cap 260).
 */
/** Paragraphs both versions share: the opening two and the closing one. */
const PRIVACY_OPEN = [
  'We believe privacy is a right, not a setting. You came here to learn audio, not to be studied yourself.',
  'So we do not track people. We never sell or share anyone’s information, we show no ads, and we never follow you across other apps or websites.',
] as const;
const PRIVACY_CLOSE = 'For everyone, crash reports and usage counts are anonymous. They exist only to help us fix and improve the Academy.';

/** GUEST version (owner-approved 2026-11-20, "Option 1"). */
export const GUEST_PRIVACY_NOTICE = {
  title: 'Your Privacy, Our Promise',
  paragraphs: [
    ...PRIVACY_OPEN,
    'Guest Mode lives by that promise: every guest sign-in erases everything from before on this device, including lab work, scores and settings. Only a weekly count of free lookups stays, with no name on it.',
    'Students with an account are tracked as little as possible: just your email, your membership, and your progress and scores, so your work follows you to any device.',
    PRIVACY_CLOSE,
  ],
  button: 'Got it',
} as const;

/** ACCOUNT version (owner-approved 2026-11-20: "ok build it"). Shown once per
 *  account: a brand-new account sees it before the intro video; an existing
 *  account sees it alone, once. "Anything you choose to post or share" keeps
 *  "only" true (forum posts, the profile name). */
export const ACCOUNT_PRIVACY_NOTICE = {
  title: 'Your Privacy, Our Promise',
  paragraphs: [
    ...PRIVACY_OPEN,
    'Your account lives by that promise. We keep only what your learning needs: your email, your membership, and your progress and scores, so your work follows you to any device, plus anything you choose to post or share.',
    PRIVACY_CLOSE,
  ],
  button: 'Got it',
} as const;

/** The account version's per-phone "seen" flag, per account (an `ape:intro:`
 *  key: device-level, survives the wipes, cleared by "Reset onboarding
 *  hints" and by a brand-new account's intro reset). Used only while the
 *  server has no answer (`my_privacy_notice_seen`). */
export function accountPrivacyIntroKey(uid: string): `accountPrivacy:${string}` {
  return `accountPrivacy:${uid}`;
}

/** Two flags owed by ONE guest sign-in. A const holder: no user data, no
 *  storage, and an account never reads them (the notice and the guest video
 *  both require useGuestWording().guest), so the account wipe has nothing to
 *  forget here. */
const guestStart = { privacyOwed: false, videoOwed: false };
const guestPrivacyListeners = new Set<() => void>();
const guestStartListeners = new Set<() => void>();
function emitGuestPrivacy(): void {
  for (const fn of Array.from(guestPrivacyListeners)) fn();
}

/** A guest sign-in has just wiped the device (AuthScreen's enterGuest): owe
 *  the privacy notice, then the intro video again (Home's once-per-session
 *  launch latch is released through onGuestStart). */
export function oweGuestStart(): void {
  guestStart.privacyOwed = true;
  guestStart.videoOwed = true;
  for (const fn of Array.from(guestStartListeners)) {
    try {
      fn();
    } catch {
      // one listener failing must not stop the others
    }
  }
  emitGuestPrivacy();
}

/** "Got it" (or Android BACK) on the notice. */
export function settleGuestPrivacyNotice(): void {
  if (!guestStart.privacyOwed) return;
  guestStart.privacyOwed = false;
  emitGuestPrivacy();
}

/** The guest's video is owed (read by Home's launch effect). */
export function guestIntroVideoOwed(): boolean {
  return guestStart.videoOwed;
}
/** Home launched the video for this guest sign-in. */
export function settleGuestIntroVideo(): void {
  guestStart.videoOwed = false;
}

export function onGuestStart(fn: () => void): void {
  guestStartListeners.add(fn);
}

function subscribeGuestPrivacy(fn: () => void): () => void {
  guestPrivacyListeners.add(fn);
  return () => guestPrivacyListeners.delete(fn);
}
const readGuestPrivacy = () => guestStart.privacyOwed;
/** True while this guest sign-in's privacy notice has not been answered. */
export function useGuestPrivacyOwed(): boolean {
  return useSyncExternalStore(subscribeGuestPrivacy, readGuestPrivacy, readGuestPrivacy);
}
