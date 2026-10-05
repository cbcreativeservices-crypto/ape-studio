/**
 * A timpano's DRAWING DEFAULTS (pure; the geometry, the art and the tests
 * read the same numbers). Only the head diameters are sourced (timpani/
 * SOURCES.md); the bowl's shape and depth, the counterhoop, the rod count,
 * the ring, the legs and the pedal are drawing defaults (timpani/
 * GEOMETRY_PROPOSAL.md: kettle height UNKNOWN), listed in M06's unknowns.
 */
export const TIMPANO_DRAW = {
  /** The bowl's lip stands this far out past the head. */
  lip: 10,
  /** Bowl depth as a fraction of the head DIAMETER. */
  depthK: 0.55,
  /** The suspension ring's height below the head, as a fraction of the bowl depth. */
  ringK: 0.18,
  /** The counterhoop: above the head, below it, radial thickness; the T-handles' reach. */
  hoopUp: 22,
  hoopDown: 14,
  hoopT: 12,
  handle: 46,
  rods: 8,
  /** Legs: plan angles from the lesson's +x (toward the conductor), and the foot radius past R. */
  legsDeg: [0, 120, 240] as const,
  footOut: 40,
  pedal: { len: 230, w: 200, gap: 25 },
} as const;

export function bowlDepth(R: number): number {
  return 2 * R * TIMPANO_DRAW.depthK;
}

/** Radius of the bowl (lip radius Rb, depth Db) at depth s below its lip. */
export function bowlRadiusAt(Rb: number, Db: number, s: number): number {
  if (s <= 0) return Rb;
  if (s >= Db) return 0;
  return Rb * Math.pow(1 - Math.pow(s / Db, 2.4), 1 / 2.4);
}
