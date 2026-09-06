/**
 * jogGeometry — pure numbers for the Dashboard jog wheel (owner brief +
 * blueprint 2026-09-05, docs/design/JOG_WHEEL_BLUEPRINT_2026_09_05.md).
 *
 * No React, no Skia, no RN: every dimension of the puck is a fraction of the
 * face radius R so the 96 px dial and the ~300 px overlay are literally the
 * same object at two sizes. Pixel clamps (minimum stroke / blur widths) are
 * applied here once so the raster builder stays a plain list of layers.
 */

export type Pt = { x: number; y: number };

/** Unit vector from the surface TOWARD the key light: overhead, 30° to the
 *  viewer's left — the app's global lighting convention (ToolsHub tiles' lit
 *  top rim / shadowed bottom, the trophy bevel's 0.35:0.20 lip). */
export const LIGHT: Pt = { x: -0.5, y: -0.866 };
/** Away from the light (where shadows fall). */
export const AWAY: Pt = { x: 0.5, y: 0.866 };

/** The finger dimple rests at 2 o'clock (owner 2026-08-01): its orbit angle
 *  is `spin − 30°` in screen coordinates (0° = +x, clockwise positive), which
 *  is why the overlay's DIMPLE_OFFSET is +30 — the dimple lands under the
 *  finger. */
export const DIMPLE_REST_DEG = -30;

export type JogGeom = {
  /** Box size (the S×S view the knob is laid out in). */
  S: number;
  /** Face radius. */
  R: number;
  /** Canvas bleed on every side (holds the wall, collar and contact shadow). */
  pad: number;
  /** Canvas side = S + 2·pad. */
  Sc: number;
  /** Face centre in CANVAS coordinates. */
  C: Pt;
  /** Visible cylinder-wall height under the face (the puck is seen very
   *  slightly from above). */
  t: number;
  /** Base-circle centre (face centre dropped by t). */
  Cb: Pt;
  /** Dish radius. */
  dR: number;
  /** Dish orbit radius about C. */
  orbit: number;
  /** Side of the square dish raster (2.6·dR: room for the soft fillet + lip). */
  dishSide: number;
  /** Whether the wall-bounce spot inside the dish is drawn (only when the
   *  dish is big enough for it to read as light, not mud). */
  bounceSpot: boolean;
  // ── body layers ─────────────────────────────────────────────────────────
  aoR: number;
  aoSigma: number;
  shadowC: Pt;
  shadowSigma: number;
  collarR: number;
  collarW: number;
  collarSigma: number;
  filletR: number;
  filletW: number;
  filletSigma: number;
  rimR: number;
  rimW: number;
  // ── dish layers ─────────────────────────────────────────────────────────
  crescentSigma: number;
  lipW: number;
  lipSigma: number;
};

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Every dimension of the puck for a box of side S. */
export function geom(S: number): JogGeom {
  const R = 0.47 * S;
  const pad = 0.1 * S;
  const Sc = S + 2 * pad;
  const C = { x: Sc / 2, y: Sc / 2 };
  const t = 0.095 * R;
  const Cb = { x: C.x, y: C.y + t };
  const dR = 0.27 * R;
  return {
    S,
    R,
    pad,
    Sc,
    C,
    t,
    Cb,
    dR,
    orbit: 0.52 * R,
    dishSide: 2.6 * dR,
    bounceSpot: dR >= 20,
    aoR: 1.04 * R,
    aoSigma: Math.max(0.03 * R, 1),
    shadowC: { x: C.x + 0.05 * R, y: C.y + t + 0.06 * R },
    shadowSigma: Math.max(0.065 * R, 1.5),
    collarR: 1.012 * R,
    collarW: Math.max(0.025 * R, 1),
    collarSigma: Math.max(0.012 * R, 0.5),
    filletR: R - 0.035 * R,
    filletW: 0.07 * R,
    filletSigma: Math.max(0.02 * R, 0.5),
    rimR: R - 0.012 * R,
    rimW: clamp(0.016 * R, 1, 2.4),
    crescentSigma: Math.max(0.1 * dR, 0.6),
    lipW: Math.max(0.055 * dR, 1),
    lipSigma: Math.max(0.03 * dR, 0.5),
  };
}

/** Dish centre (canvas coordinates) for a wheel rotation of `spinDeg`. The
 *  dish is a circle under a broad distant light, so translating it along the
 *  orbit is exactly what rotating the knob looks like — its shading never
 *  turns with it (the light is world-fixed). */
export function dishCentre(spinDeg: number, g: JogGeom): Pt {
  const th = ((spinDeg + DIMPLE_REST_DEG) * Math.PI) / 180;
  return { x: g.C.x + g.orbit * Math.cos(th), y: g.C.y + g.orbit * Math.sin(th) };
}

/** Top-left corner of the dish raster for a wheel rotation of `spinDeg`. */
export function dishOrigin(spinDeg: number, g: JogGeom): Pt {
  const c = dishCentre(spinDeg, g);
  return { x: c.x - g.dishSide / 2, y: c.y - g.dishSide / 2 };
}

/** Sandblast grain cell in DEVICE pixels — the design spec's sub-linear pitch
 *  law: the grain scales with the object (the overlay is the same puck seen
 *  ~3× closer) but never becomes dirt. dpr 3: dial 1, overlay 2; dpr ≤ 2: 1. */
export function grainCell(S: number, dpr: number): number {
  return Math.max(1, Math.floor(dpr * 0.5 * Math.pow(S / 96, 0.4)));
}

/** Global grain opacity: coarser device pixels get lower per-dot contrast, and
 *  the dial variant is the same surface seen three times farther away (no
 *  resolvable dots, only a fine lift). */
export function grainAlpha(S: number, dpr: number): number {
  return clamp(dpr / 3, 0.5, 1) * (S < 150 ? 0.6 : 1);
}
