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
  /** The library on this device (empty for a guest). */
  saved: RoomDesign[];
  saveCurrent: (name?: string) => Promise<boolean>;
  loadSaved: (id: string) => void;
  deleteSaved: (id: string) => void;
};

/** The honesty badge strings every display carries — one of the three tiers
 *  leads, and the detail says what rests on it. */
export const BADGE = {
  create: 'CALCULATED · dimensions, area and volume are exact arithmetic from your entries',
  monitoring: 'CALCULATED · distances, listening angle and symmetry · ESTIMATED · the boundary-notch guide',
  exploreRect: 'CALCULATED · idealized modes of a rectangular room · ESTIMATED · reflection paths and levels',
  exploreApprox: 'ESTIMATED · modes from the bounding box / mean ceiling height (not a rectangular box — less reliable) · ESTIMATED · reflections',
  treatment: 'ESTIMATED · simplified material absorption; Sabine/Eyring are approximations in a small room',
} as const;
