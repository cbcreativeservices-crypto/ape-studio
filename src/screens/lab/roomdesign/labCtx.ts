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
  saveCurrent: (name?: string) => Promise<boolean>;
  loadSaved: (id: string) => void;
  deleteSaved: (id: string) => void;
};

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

/** The line to show for a kept save result, given the design on screen now. */
export function saveLine(msg: { text: string; ok: boolean; at: unknown } | null, design: unknown): string | null {
  if (!msg) return null;
  return msg.ok && msg.at !== design ? SAVED_THEN_CHANGED : msg.text;
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
