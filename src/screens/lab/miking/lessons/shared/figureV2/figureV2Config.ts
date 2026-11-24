/**
 * FIGURE V2 — the switches for the new figure look (the owner's realism pass,
 * must-do D78). The owner judged ONE example first (the seated kit drummer,
 * Drum Overheads, side view) and passed it on 2026-11-23 ("Drummer passes";
 * "then all the others can then match the approved example"). The roll-out
 * runs in WAVES, one figure family at a time, each family switched on here
 * when its wave lands:
 *   • FIGURE_V2_READY — every family not yet rolled out (stays false until the
 *     last wave);
 *   • FIGURE_V2_FAMILY — per family; a family missing here follows
 *     FIGURE_V2_READY.
 */
export const FIGURE_V2_READY = false; // [MD:D78] the families after wave 1 keep the current look until their waves

/** Wave 1 (2026-11-23): the seated kit drummer, side view and view from above,
 *  everywhere the app shows him (the kit scene, the drum and cymbal lessons'
 *  drummer, phantoms, close-up strike arms, the band seat, the setting plans). */
export const FIGURE_V2_FAMILY = {
  kitDrummer: true,
  /** Wave 3a (2026-11-23): standing people — side view and from above — in the lessons that draw ALL
   *  their figures new (E01, E03: the singer). A lesson opts in at its call sites (`v2`). */
  sideStanding: true,
  /** Wave 3a, kind C (built, parked until the owner's GO): a talker seated at a desk. */
  sideDeskTalker: true,
} as const;

export type FigureFamily = keyof typeof FIGURE_V2_FAMILY;
/** Whether a family draws the new look. */
export const figureV2On = (f: FigureFamily): boolean => FIGURE_V2_FAMILY[f] ?? FIGURE_V2_READY;
