/**
 * The two study membership gates on the Dashboard, as pure predicates
 * (owner 2026-09-13: "gate it").
 *
 * Import-free on purpose, so node:test can read it without the React Native
 * module graph — same reason as `realAccount.ts` and `profileRead.ts`.
 *
 * ⚠️ THERE ARE TWO OF THESE AND THEY ARE NOT INTERCHANGEABLE. That is the whole
 * point of this file. `studyMethodLocked` reads the DISPLAYED topic, because the
 * method blocks and the quiz must act on whatever the carousel is showing — a
 * gate on the committed topic once opened DAW's flashcards from an Astronomical
 * Acoustics card (user bug 2026-08-13). The ★ Custom List panel is the mirror
 * image: it renders on the COMMITTED topic, so reading the displayed one would
 * leave its Study button open whenever the carousel happened to be previewing a
 * free topic. It is never free for a non-member whatever the carousel shows, so
 * it gets a gate that does not look at the carousel at all.
 */

/** Tier values these gates care about; anything else is treated as not-academy. */
export type GateTier = string;

/**
 * A study method or the quiz, for the topic currently DISPLAYED.
 *
 * `resolved` comes first deliberately: the entitlement provider boots at
 * 'anonymous' and only learns the real tier after a server read, so before it
 * lands this would say "not a member" about EVERYONE — and a member tapping a
 * method inside that window was shown the upgrade sheet for the membership they
 * already pay for. Hold the member-favouring state until the tier is known; the
 * study screens still gate on the server, so this can only delay a lock, never
 * grant access.
 */
export function studyMethodLocked(input: {
  resolved: boolean;
  entitlement: GateTier;
  /** `global_sequence` of the DISPLAYED topic; null for a pseudo-topic. */
  displayedGs: number | null | undefined;
  /** The auto-enrolled free topics (FREE_ENROLL_GS: gs3060, gs3970). */
  freeGs: readonly number[];
}): boolean {
  const { resolved, entitlement, displayedGs, freeGs } = input;
  if (!resolved) return false;
  if (entitlement === 'academy') return false;
  // Fails CLOSED when there is no gs — a pseudo-topic is not a free topic.
  return !(displayedGs != null && freeGs.includes(displayedGs));
}

/**
 * The ★ Custom List.
 *
 * ⚠️ WHY IT IS GATED AT ALL (it was exempt until 2026-09-13). A free user can
 * star any glossary term and study it here, so the exemption was an unmetered
 * path to all 26,855 definitions — around both the 14-a-week allowance and the
 * server gateway built to meter it. Masking `glossary_study_v` closed the data
 * side; without this gate the cards would render 120-character teasers as
 * though they were definitions, which reads as broken rather than gated.
 */
export function customListLocked(input: { resolved: boolean; entitlement: GateTier }): boolean {
  return input.resolved && input.entitlement !== 'academy';
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MY CUSTOM LIST — the rules, as pure functions (owner 2026-10-19).
 *
 * Kept in THIS import-free file, not a module of their own: the app-start
 * graph is capped (test/perfStartTrim_20261004 — 260 modules) and every
 * importer (flaggedStore, deckOrderStore, the Dashboard) is already in it.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *
 * The owner's words (2026-10-19): "The MY CUSTOM LIST is always loaded and
 * available in the study dashboard — in fact it is the only topic that can
 * never be removed from the study dashboard. … A user cannot finish the custom
 * list flashcards to unlock the other study methods, so already have all study
 * methods, scenarios, and the quiz just populate with whatever terms they have
 * in their custom list. … On the custom list quiz allow the quiz to go from a
 * minimum of 30 terms up to their total list of terms (randomly selected). But
 * inform user the quiz cannot begin without at least 30 terms."
 *
 *   1. ALWAYS ON THE DASHBOARD. The deck never drops it: not from the Topic
 *      Deck sheet (no ✕), not from Enrollments (no UNLOAD), not from a stored
 *      `removed` list written before this rule existed.
 *   2. NO POWER SEQUENCE. Every method it has is open from the start — the
 *      list changes as the learner edits it, so "finish flashcards first" can
 *      never be met. Real topics keep their chain unchanged.
 *   3. EMPTY ≠ LOADING ≠ UNREADABLE. A tap on an empty list explains how to
 *      fill it; a tap before the list has been read says "Checking…"; a list
 *      that could not be read is never called empty.
 *   4. QUIZ: at least 30 terms; the learner picks 30 … all; the terms are a
 *      random draw of that many.
 */

/** The pseudo-topic id (storage and routes keep 'flagged' so starred terms
 *  carry over — see flaggedStore.ts). */
export const CUSTOM_LIST_ID = 'flagged';

export function isCustomListId(id: string | null | undefined): boolean {
  return id === CUSTOM_LIST_ID;
}

/**
 * ⏸ HOLD — SERVER NOT READY (2026-10-19).
 *
 * Scenarios and the quiz are SERVER-BACKED and keyed by a real topic uuid:
 * `get_scenario_homework(p_achievement_id uuid)` and
 * `start_quiz_attempt(p_achievement_id uuid, p_client_attempt_id uuid)`.
 * Neither accepts a set of glossary ids or a length, and `submit_quiz` grades
 * 1–30 questions. Until Comp A ships the custom-list RPCs (brief:
 * Downloads/2026-10-19_COMP_A_CUSTOM_LIST_QUIZ.md) the custom list shows
 * Flashcards, Fill in the Blank and Matching only — those three run entirely
 * on the device from the list's own terms.
 *
 * ⛔ DO NOT flip this alone. It also needs the client half named in the brief
 * (QuizScreen + ScenariosScreen calling the new RPCs with the drawn ids).
 * With this false, the dashboard never routes the custom list to either
 * server screen, so nothing can break before the server is ready.
 */
export const CUSTOM_LIST_SERVER_READY = false;

/** The study methods the custom list offers right now. */
export function customListMethods(serverReady: boolean = CUSTOM_LIST_SERVER_READY): string[] {
  return serverReady
    ? ['flashcards', 'fill_in_blank', 'matching', 'scenarios']
    : ['flashcards', 'fill_in_blank', 'matching'];
}

/** Whether the custom list shows its quiz panel right now. */
export function customListHasQuiz(serverReady: boolean = CUSTOM_LIST_SERVER_READY): boolean {
  return serverReady;
}

/**
 * Rule 2b (owner 2026-10-19): "On My Custom List - do not progress progress
 * bars, show all always at 100% already (also to show they are open and
 * available to use)." Every custom-list meter — each method, the list quiz and
 * the topic card — reads FULL from the start and never moves, whatever the
 * list holds (an empty list still says EMPTY in words). Nothing is recorded.
 */
export const CUSTOM_LIST_METER_PCT = 100;

/** Rule 2: every custom-list method is powered from the start. */
export function customListMethodPowered(_method: string): true {
  return true;
}

/* ---- Rule 1: never removed ---- */

/** The ids that can never leave the study dashboard. */
export const UNREMOVABLE_DECK_IDS: readonly string[] = [CUSTOM_LIST_ID];

export function canRemoveFromDeck(id: string): boolean {
  return !UNREMOVABLE_DECK_IDS.includes(id);
}

/** A stored `removed` list with the unremovable ids taken out — a device that
 *  removed the list before 2026-10-19 gets it back. */
export function effectiveRemoved(removed: readonly string[]): string[] {
  return removed.filter(canRemoveFromDeck);
}

/* ---- Rule 3: the state of the list when a method is tapped ---- */

export type ListRead = {
  /** The stored list has been read at least once (0 really means empty). */
  read: boolean;
  /** The stored list could NOT be read. */
  unreadable: boolean;
  /** Terms in the list (only meaningful once read). */
  count: number;
};

export type MethodTap = 'open' | 'empty' | 'checking';

/**
 * A tap on Flashcards / Fill in the Blank / Matching / Scenarios.
 *
 * Unreadable OPENS the method: its screen reads the list itself and shows
 * "could not load" with its own Retry (house rule: a failed read is never
 * "empty", and it keeps the learner a way on).
 */
export function customMethodTap(s: ListRead): MethodTap {
  if (s.unreadable) return 'open';
  if (!s.read) return 'checking';
  return s.count > 0 ? 'open' : 'empty';
}

/* ---- Rule 4: the quiz ---- */

export const CUSTOM_QUIZ_MIN = 30;

export type QuizTap = 'checking' | 'unreadable' | 'empty' | 'too_few' | 'choose';

/** A tap on the custom-list quiz. Unreadable cannot count to 30, so it says so. */
export function customQuizTap(s: ListRead): QuizTap {
  if (s.unreadable) return 'unreadable';
  if (!s.read) return 'checking';
  if (s.count === 0) return 'empty';
  if (s.count < CUSTOM_QUIZ_MIN) return 'too_few';
  return 'choose';
}

/** "add X more" for a list that is short of the minimum. */
export function termsShort(count: number): number {
  return Math.max(0, CUSTOM_QUIZ_MIN - Math.max(0, Math.floor(count)));
}

/**
 * The quiz-length choices: 30 / 50 / 100 and ALL, capped at the count.
 * Fixed steps strictly below the count, then the full count as ALL — so a
 * 45-term list offers 30 · ALL (45), and a 30-term list offers ALL (30) only.
 * Empty below the minimum.
 */
export const CUSTOM_QUIZ_STEPS: readonly number[] = [30, 50, 100];

export type QuizLengthOption = { n: number; all: boolean };

export function quizLengthOptions(count: number): QuizLengthOption[] {
  const c = Math.floor(count);
  if (!(c >= CUSTOM_QUIZ_MIN)) return [];
  const out: QuizLengthOption[] = CUSTOM_QUIZ_STEPS.filter((n) => n < c).map((n) => ({ n, all: false }));
  out.push({ n: c, all: true });
  return out;
}

/** A requested length, clamped into [30, count]. Null below the minimum. */
export function clampQuizLength(requested: number, count: number): number | null {
  const c = Math.floor(count);
  if (!(c >= CUSTOM_QUIZ_MIN)) return null;
  const r = Number.isFinite(requested) ? Math.floor(requested) : CUSTOM_QUIZ_MIN;
  return Math.min(c, Math.max(CUSTOM_QUIZ_MIN, r));
}

/**
 * A uniform random draw of `n` distinct ids (partial Fisher–Yates). Duplicate
 * ids in the input count once. `rand` is injectable for tests.
 */
export function drawRandomTerms(ids: Iterable<string>, n: number, rand: () => number = Math.random): string[] {
  const pool = [...new Set(ids)];
  const k = Math.max(0, Math.min(pool.length, Math.floor(n)));
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rand() * (pool.length - i));
    const t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  return pool.slice(0, k);
}

/* ---- Copy (plain words; centred popups via notify) ---- */

export const CUSTOM_EMPTY_TITLE = 'No terms in your list yet';
export const CUSTOM_EMPTY_BODY =
  'Add terms from the Glossary to study them here: tap the custom-list icon (three stacked cards) beside any term. ' +
  'You can also tap it on a flashcard while you study any of your other topics.';

export const CUSTOM_CHECKING_TITLE = 'Checking…';
export const CUSTOM_CHECKING_BODY = 'Your custom list is still loading on this phone. Try again in a moment.';

export const CUSTOM_UNREADABLE_TITLE = 'Your list couldn’t be read';
export const CUSTOM_UNREADABLE_BODY =
  'Your custom list couldn’t be read on this phone just now. Nothing has been removed — try again in a moment.';

export const CUSTOM_QUIZ_MIN_TITLE = 'Not enough terms yet';

export function customQuizMinBody(count: number): string {
  const n = Math.max(0, Math.floor(count));
  const x = termsShort(n);
  return `The quiz needs at least ${CUSTOM_QUIZ_MIN} terms in your list. You have ${n} — add ${x} more to start.`;
}

/** The custom list's count line: never "0 TERMS" for a list not read yet. */
export function customListCountLine(s: ListRead): string {
  if (s.unreadable) return 'TERMS COULD NOT BE READ';
  if (!s.read) return 'CHECKING…';
  return `${s.count} TERM${s.count === 1 ? '' : 'S'}`;
}
