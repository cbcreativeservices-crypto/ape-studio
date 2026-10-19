/**
 * Lab first-open term popup — the pure half (owner 2026-10-19).
 *
 * "When a lab is opened for the first time, I want a popup to appear first
 * with the lab's title and the plain english definition underneath it …
 * then a continue button and on into the lab. This happens only the very
 * first time a user opens the lab. … since we are based on a glossary, we
 * should start with our plain english definition."
 *
 * And (owner, same day): "do not show the glossary pop up for free
 * non-members. this is for members when they are opening the lab. free users
 * should be going straight to the membership gate denial."
 *
 * This file holds no React and no storage, so the rules are node-testable:
 *   • labTermKey     — which catalog lab a route (and its params) is;
 *   • wiredLabTerm   — its term + exact glossary text, or null (HOLD / none);
 *   • isLabTermSeen  — seen per glossary TERM: one CONTINUE covers every lab
 *     that uses the same term (labTermSeenFlag is what CONTINUE stores);
 *   • labTermIntroState — whether the popup is OWED (the lab's own intros
 *     wait for it) and whether it may SHOW now.
 * The screen half is LabTermIntro.tsx; the seen flags labTermSeenStore.ts.
 */
import { LAB_TERM_ENTRIES, type LabTermEntry } from './labTermIntroData';

export { LAB_TERM_ENTRIES };
export type { LabTermEntry };

/**
 * The catalog lab a screen route is, or null when the route is not a catalog
 * lab (a module screen inside a lab, a tool, a calculator workspace…).
 *
 * Mostly the route name. Three routes serve several catalog rows and are told
 * apart by their params: the Miking family hub (`{ lab }`), the meter module
 * that is Signal Detective (`{ id: 'detective' }`), and the shared production
 * screen (`{ lab: 'preprod' | 'postprod' }`, also registered by name).
 */
export function labTermKey(routeName: string, params?: unknown): string | null {
  const p = (params ?? {}) as { lab?: unknown; id?: unknown };
  let key: string = routeName;
  if (routeName === 'MikingHub') {
    if (typeof p.lab !== 'string') return null;
    key = `MikingHub:${p.lab}`;
  } else if (routeName === 'MeterModule') {
    if (typeof p.id !== 'string') return null;
    key = `MeterModule:${p.id}`;
  } else if (routeName === 'ProductionLab') {
    if (p.lab === 'preprod') key = 'PreProdLab';
    else if (p.lab === 'postprod') key = 'PostProdLab';
    else return null;
  }
  return key in LAB_TERM_ENTRIES ? key : null;
}

export type WiredLabTerm = { key: string; term: string; plainEnglish: string; glossaryId: string };

/** The popup's copy for a lab, or null: not a catalog lab, or on HOLD. */
export function wiredLabTerm(key: string | null): WiredLabTerm | null {
  if (!key) return null;
  const e = LAB_TERM_ENTRIES[key];
  if (!e || e.status !== 'wired') return null;
  return { key, term: e.term, plainEnglish: e.plainEnglish, glossaryId: e.glossaryId };
}

/**
 * SEEN IS PER TERM, not per lab (owner 2026-10-19: "any pop up word like
 * 'Miking' - if shown twice for 2 different labs, do not make user have to see
 * it again for the other lab that uses the same pop up intro term/definition").
 *
 * The term is its glossary ROW (glossaryId), so the eight miking labs, the
 * three mixing labs and the two EQ labs each share one flag. CONTINUE stores
 * `term:<glossaryId>`. A plain lab key in the list (the per-lab flags written
 * before this rule) still counts, and counts for its TERM: every lab that uses
 * the same glossary row is seen too.
 */
export const LAB_TERM_SEEN_PREFIX = 'term:';
export function labTermSeenFlag(labKey: string): string {
  const e = LAB_TERM_ENTRIES[labKey];
  return e && e.status === 'wired' ? LAB_TERM_SEEN_PREFIX + e.glossaryId : labKey;
}
/** Pure: whether a lab's popup was already seen, by this lab or any lab
 *  sharing its glossary term. */
export function isLabTermSeen(seen: readonly string[], labKey: string): boolean {
  if (seen.includes(labKey)) return true;
  const e = LAB_TERM_ENTRIES[labKey];
  if (!e || e.status !== 'wired') return false;
  if (seen.includes(LAB_TERM_SEEN_PREFIX + e.glossaryId)) return true;
  return seen.some((k) => {
    const other = LAB_TERM_ENTRIES[k];
    return !!other && other.status === 'wired' && other.glossaryId === e.glossaryId;
  });
}

/** The title as shown: the glossary's own term with its first letter raised
 *  ("delay" → "Delay"). The definition is never touched. */
export function labTermTitle(term: string): string {
  return term.length ? term[0].toUpperCase() + term.slice(1) : term;
}

/** The popup's seen flags (`term:<glossaryId>`, or an older plain lab key),
 *  de-duplicated, in the order seen. */
export function parseSeenLabTerms(parsed: unknown): string[] {
  if (!Array.isArray(parsed)) throw new Error('lab term seen flags: not a list');
  return Array.from(new Set(parsed.filter((k): k is string => typeof k === 'string' && k.length > 0)));
}
export function withSeenLabTerm(seen: readonly string[], key: string): string[] {
  return seen.includes(key) ? [...seen] : [...seen, key];
}

/** What the popup's state machine reads. */
export type LabTermIntroInput = {
  /** The lab is wired (a term and its text exist). */
  wired: boolean;
  /** useMemberGate(): only 'open' (academy standing) ever gets the popup. */
  gate: 'open' | 'locked' | 'checking' | 'unconfirmed';
  /** A members-only preview (scrim + upgrade sheet) is armed. */
  previewActive: boolean;
  /** The stored flags: 'loading' (read out), 'unreadable' (read failed),
   *  else whether this lab was already seen. */
  seen: 'loading' | 'unreadable' | boolean;
  /** CONTINUE was pressed on this visit. */
  dismissed: boolean;
  /** The host screen is the focused route. */
  focused: boolean;
  /** Low-Light Production Mode or the dev kill switch (useOverlaysSuppressed),
   *  or the first-run sampler (useSamplingActive). */
  suppressed: boolean;
  /** Something that owns the screen first: the amplitude orientation page. */
  held: boolean;
  /** The screen's push animation has finished (iOS: a Modal presented
   *  mid-push can stick half-presented — the GuestStartReminder rule). */
  pushSettled: boolean;
  /** Another DimModal is open (a sheet, a dialog, the sound-safety popup). */
  otherModalOpen: boolean;
  /** rootModalHoldMs(): a closing Modal is still animating away. */
  holdMs: number;
  /** The popup is already on screen (once up, it stays until CONTINUE). */
  presented: boolean;
};

/**
 * `owed`: the popup is still to come on this visit, so the lab's OWN first-open
 * popups (ProNote, the guest reminder, any useScreenIntro) wait for it — it
 * shows first. Only for a member, only while focused, and never for a stored
 * flag that could not be read (a failed read shows nothing, the house rule
 * for seen flags, and must not hold the lab's own intros forever).
 *
 * `show`: draw it now. Never stacked on another Modal, never during a closing
 * Modal's fade, never mid-push, never while Low-Light / the dev switch / the
 * sampler suppress overlays, never over the orientation page, never over a
 * members-only preview. Once presented it stays until CONTINUE.
 */
export function labTermIntroState(i: LabTermIntroInput): { owed: boolean; show: boolean } {
  const forMember = i.wired && i.gate === 'open' && !i.previewActive;
  if (!forMember || !i.focused || i.dismissed || i.seen === 'unreadable' || i.seen === true) {
    return { owed: false, show: false };
  }
  if (i.seen === 'loading') return { owed: true, show: false };
  if (i.presented) return { owed: true, show: !i.suppressed };
  const clear = !i.suppressed && !i.held && i.pushSettled && !i.otherModalOpen && i.holdMs <= 0;
  return { owed: true, show: clear };
}
