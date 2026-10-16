/**
 * THE KIT'S STAGE MONITORS — the two floor wedges every Lab 1 / Lab 2 kit
 * lesson puts on its stage (M01's places), in the KIT frame K (u = x toward
 * the audience, v = z the drummer's right; mm). Pure numbers, no imports, so
 * every lesson's live.wedges and the kit plans read the same places.
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering):
 * the drummer's fill stood at (−450, 750), over the floor tom and the ride.
 * It now stands BESIDE the kit — on the drummer's right, behind the floor
 * tom's legs and clear of the drummer's space — angled at the drummer. The
 * downstage wedge keeps its place; the kit plan's stage lip moved
 * downstage of it (kitPlanLayout.ts). ILLUSTRATIVE positions.
 */

/** The drummer's own fill: on the floor at the drummer's right, behind the
 *  floor tom, its baffle angled up at the drummer. */
export const KIT_FILL = { x: -1060, z: 600, faces: { x: 0.35, y: 0, z: -1 } } as const;

/** A floor wedge for another player, downstage of the kick, facing upstage
 *  (the kick's depth 457.2 + 900). */
export const KIT_DOWNSTAGE = { x: 457.2 + 900, z: -450, faces: { x: -1, y: 0, z: 0 } } as const;
