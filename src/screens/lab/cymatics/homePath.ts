/**
 * The Cymatics home's words, as data (beginner waves 1-3, owner 2026-11-15:
 * "build waves 1 thru 3", D62 adoption plan items CY-01, CY-02 and CY-04).
 *
 * The home used to open on four bright studio buttons ABOVE the eight learn
 * modules, a one-line START HERE row, a paragraph hook and an all-caps badge
 * ("SIMULATION · 240 mm ALUMINUM · FREE EDGES · CENTER-DRIVEN"). A beginner
 * opened an instrument before any framing, and the lab's designed path (the
 * seventeen-experiment series) was buried inside module 8.
 *
 * Now, under ONE sand-plate picture with a plain one-line note: the question
 * and a numbered three-step path, each step opening its own place. Step 3 is
 * START THE SERIES's own spot on the home (CY-01 and CY-04 built once). The
 * modules follow; the studios sit below them under STUDIOS, FREE PLAY, each
 * saying which modules it belongs to (CY-02).
 *
 * Pure data, no imports, so the test reads it directly. [MD:D62]
 */

/** The plain line under the hero plate (was the all-caps badge). */
export const HOME_HERO_NOTE = 'A simulated sand plate: a square aluminum sheet, shaken at its center.';

/** The hook above the three steps. */
export const HOME_PATH_HEAD = 'Does a note have a shape? Let’s test it.';

export type HomePathStep =
  | { label: string; open: { module: 'intro' | 'change' } }
  | { label: string; open: { series: true } };

/** The three numbered steps. Each opens its own place. */
export const HOME_PATH: readonly HomePathStep[] = [
  { label: 'Watch sand find the still lines', open: { module: 'intro' } },
  { label: 'Change one thing', open: { module: 'change' } },
  { label: 'Run the experiments', open: { series: true } },
];

/** The heading over the four studios, below the modules. */
export const STUDIOS_HEADING = 'STUDIOS, FREE PLAY';

export type HomeStudio = { route: 'CymaticsPlateStudio' | 'CymaticsLiquidStudio' | 'CymaticsMembraneStudio' | 'CymaticsGallery'; title: string; sub: string; a11y: string };

/** Each studio says how it relates to the modules (CY-02). */
export const HOME_STUDIOS: readonly HomeStudio[] = [
  { route: 'CymaticsPlateStudio', title: 'CHLADNI PLATE STUDIO ›', sub: 'The plate from modules 1 to 3, with every control open.', a11y: 'Open the Chladni Plate Studio' },
  { route: 'CymaticsLiquidStudio', title: 'LIQUID CYMATICS STUDIO ›', sub: 'The water surface from module 6: a dish on a shaker.', a11y: 'Open the Liquid Cymatics Studio' },
  { route: 'CymaticsMembraneStudio', title: 'MEMBRANE & LOUDSPEAKER STUDIO ›', sub: 'The drumhead from module 4 and the speaker cone from module 6.', a11y: 'Open the Membrane and Loudspeaker Studio' },
  { route: 'CymaticsGallery', title: 'PATTERN GALLERY & ART STUDIO ›', sub: 'Patterns you save in any studio, to color and compare.', a11y: 'Open the Pattern Gallery and Art Studio' },
];

/** The one line each studio's own intro opens with: how it relates to the modules (CY-02). */
export const STUDIO_RELATION = {
  plate: 'Free play with the plate from modules 1 to 3.',
  liquid: 'Free play with the water surface from module 6.',
  membrane: 'Free play with the drumhead from module 4 and the speaker cone from module 6.',
} as const;
