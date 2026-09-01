/**
 * vuGeometry — the VU skin's shared coordinate space.
 *
 * Split out of SkinnedVu (2026-09-01) to break a REQUIRE CYCLE: SkinnedVu
 * renders VuGlass, and VuGlass needs the face rectangle to clip to. With both
 * constants living in SkinnedVu that was SkinnedVu → VuGlass → SkinnedVu, and
 * under Hermes it threw "Cannot access 'VU_FACE' before initialization" at
 * module init — a hard blank-app crash. Leaf modules holding shared constants
 * cannot cycle.
 *
 * SkinnedVu re-exports both names, so every existing importer is unaffected.
 */

/** The skin artwork's coordinate space — every constant below is in these units. */
export const SKIN_VB = '0 0 1586 992';

/** Face window (skin space) — the glass aperture. The needle is CLIPPED to this
 *  so the blade never paints over the bezel below the glass, and the drawn
 *  glass pane is clipped to it for the same reason. */
export const VU_FACE = { x: 250, y: 175, w: 1090, h: 638, rx: 40 };
