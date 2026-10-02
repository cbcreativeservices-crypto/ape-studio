/**
 * labCtx — what every Room Design module receives from the host: the ONE
 * design being edited, the analysis of it, and the setters. Modules never
 * keep their own copy of the room — a change in CREATE is what EXPLORE sees.
 */
import type { Analysis, RoomDesign, Units } from './roomModel';

export type RoomLabCtx = {
  design: RoomDesign;
  /** Functional update; the host stamps `updatedAt`. */
  update: (fn: (d: RoomDesign) => RoomDesign) => void;
  analysis: Analysis;
  units: Units;
  /** A signed-out guest or a members-only preview: designs are not saved,
   *  and the lab says so plainly. */
  guest: boolean;
  /** Of those, a SIGNED-IN members-only preview (night pass 3, 2026-10-01):
   *  `guest` covers both, and the preview user — who IS signed in — was told
   *  "you are not signed in". The cable lab's PREVIEW wording (completeCopy). */
  preview: boolean;
  /** The entitlement tier is known. Before it is, `guest` reads false and a
   *  save stays in memory — say neither "saved" nor "not signed in". */
  resolved: boolean;
  /** The library on this device (empty for a guest). */
  saved: RoomDesign[];
  /** The saved design a SAVE of `design` would push out of a full library,
   *  judged on the store's own list (toddler pass 2: `saved` is the repaired
   *  list, so a record repair drops still took a slot — the store evicted
   *  the oldest while the message said nothing). */
  evicts: RoomDesign | null;
  /** Resolves with whether the design is on the device and the design as it
   *  was filed — a clashing name is numbered on ("My room 2", toddler pass
   *  3), and that renamed design is the one now on screen. */
  saveCurrent: (name?: string) => Promise<SaveResult>;
  loadSaved: (id: string) => void;
  /** Resolves false when the device refused the write (the row comes back). */
  deleteSaved: (id: string) => Promise<boolean>;
  /** The saved designs could not be READ from this device (the store stays
   *  un-hydrated and refuses to write): the library is unknown, not empty. */
  unreadable: boolean;
};

/** A DELETE the device refused (store follow-up to toddler pass 3). */
export const DELETE_FAILED = 'Could not delete — this device could not be written. The design is still saved.';
/** The library could not be read: never "No saved designs" over designs on disk. */
export const STORE_UNREADABLE = 'Your saved designs could not be read from this device just now — they are not lost, and nothing is written over them. Leave the lab and come back to try again.';

/** A signed-in member's SAVE that the DEVICE refused (toddler pass 2,
 *  2026-10-01): the store now resolves false for a failed write, and EXPLORE
 *  fell through to "you are not signed in" while REVIEW said a bare "Not
 *  saved." Both buttons say this instead. */
export const SAVE_FAILED = 'Not saved — this device could not store the design (storage full or unavailable). It is still on screen; try SAVE again.';
/** The SAVE tapped before the tier was known (the store is blocked then). */
export const SAVE_NOT_YET = 'Not saved yet — still checking your account. Tap SAVE again in a moment.';

/** A "Saved" line must not outlive the design it was about (toddler pass 2):
 *  after OPTION B, a LOAD or any edit the tray still read "Saved on this
 *  device." over a design that was not. */
export const SAVED_THEN_CHANGED = 'Saved earlier — the design has changed since. SAVE again to keep the changes.';

/** …nor the delete of that save (toddler pass 3): SAVE, then DELETE on the
 *  "(this one)" row, and REVIEW still read "Saved … on this device." */
export const SAVED_THEN_DELETED = 'That save was deleted from this device. The design is still on screen — SAVE again to keep it.';

/** `held`: a guest's save, kept for this app session and saved to the
 *  account they sign in to before closing the app (owner ruling 2026-10-01). */
export type SaveResult = { ok: boolean; at: RoomDesign; held?: boolean };

/** A guest's SAVE that the session hand-off holds (owner ruling 2026-10-01). */
export const SAVE_HELD = 'Kept for this session — you are not signed in yet. Sign in before you close the app and it is saved on this device.';

/** The line to show for a kept save result, given the design on screen now
 *  and whether the library still holds it (`kept`). */
export function saveLine(msg: { text: string; ok: boolean; at: unknown } | null, design: unknown, kept = true): string | null {
  if (!msg) return null;
  if (!msg.ok) return msg.text;
  if (msg.at !== design) return SAVED_THEN_CHANGED;
  return kept ? msg.text : SAVED_THEN_DELETED;
}

/** The honesty badge strings every display carries — one of the three tiers
 *  leads, and the detail says what rests on it. */
export const BADGE = {
  create: 'CALCULATED · dimensions, area and volume are exact arithmetic from your entries',
  monitoring: 'CALCULATED · distances, listening angle and symmetry · ESTIMATED · the boundary-notch guide',
  exploreRect: 'CALCULATED · idealized modes of a rectangular room · ESTIMATED · reflection paths and levels',
  exploreApprox: 'ESTIMATED · modes from the bounding box / mean ceiling height (not a rectangular box — less reliable) · ESTIMATED · reflections',
  treatment: 'ESTIMATED · simplified material absorption; Sabine/Eyring are approximations in a small room',
} as const;
