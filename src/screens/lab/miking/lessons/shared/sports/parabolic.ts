/**
 * THE PARABOLIC DISH — the shared dish tool (Lab 7 part 2; B12 defines it,
 * B13–B16 use it). Built once by group 2 (lab7-g5); docs/labs/miking/
 * parabolic/GEOMETRY_PROPOSAL.md, SOURCES.md §b. Pure; tested.
 *
 * FRAME D (millimetres): origin at the dish's VERTEX (the bottom of the
 * bowl), +x along the dish axis forward (out of the bowl, toward the target),
 * +y across (drawn down the screen in a section). The reflector is the
 * paraboloid y² + z² = 4 f x, its rim at x = depth.
 *
 * THE TWO PRESETS are DERIVED, not read from a drawing (parabolic/SOURCES.md
 * §b): taking each model number as the rim diameter in inches and the maker's
 * focal reference "behind the front face" as depth − f — large: D 660 mm,
 * depth 224, f 122; small: D 406 mm, depth 122, f 84. `placeholder` until a
 * maker drawing is read; never printed as a dimension on screen.
 *
 * READOUTS (DERIVED, an ideal model, said "a simplified picture" once):
 *   gain onset    ≈ c / D — below about this frequency the bowl adds little
 *                 (the wavelength is longer than the dish is wide); the
 *                 capsule still hears low sound directly (B12 L8). Large ≈
 *                 520 Hz, small ≈ 845 Hz (c from the calculator, 20 °C).
 *   focus error   the element slid along the axis: the offset only — "higher
 *                 frequencies weaken first", no invented dB curve.
 *   aim error     0 / 10 / 20° off the axis (the lesson's trials): words, and
 *                 the reflected rays drawn missing the focus by an amount the
 *                 geometry gives.
 * Correction B12-01 (Klover's FAQ: wavelength "not relevant in the same
 * way") is never shown: the wave-acoustic reading is the one taught.
 */
import { C20 } from '../../../engine/physics/twoMic.ts';

export type DishId = 'large' | 'small';
export type Dish = { id: DishId; label: string; short: string; D: number; depth: number; f: number; placeholder: true };

export const DISHES: Readonly<Record<DishId, Dish>> = {
  large: { id: 'large', label: 'A large hand-held dish', short: 'LARGE DISH', D: 660, depth: 224, f: 122, placeholder: true },
  small: { id: 'small', label: 'A small hand-held dish', short: 'SMALL DISH', D: 406, depth: 122, f: 84, placeholder: true },
};
export const DISH_IDS: readonly DishId[] = ['large', 'small'];

/** The paraboloid's focal length from its rim radius r and depth d: f = r² / (4d). */
export const focalLength = (D: number, depth: number): number => (D / 2) ** 2 / (4 * depth);
/** The bowl's half-width (mm) at a distance x from the vertex. */
export const halfWidthAt = (dish: Dish, x: number): number => Math.sqrt(Math.max(0, 4 * dish.f * x));
/** The reflector's profile as points (x, y) from rim to rim through the vertex. */
export function profile(dish: Dish, n = 40): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const R = halfWidthAt(dish, dish.depth);
  for (let i = 0; i <= n; i++) {
    const y = -R + (2 * R * i) / n;
    out.push({ x: (y * y) / (4 * dish.f), y });
  }
  return out;
}

/** The lowest frequency the bowl helps with, in the ideal model: c / D (Hz). */
export function gainOnsetHz(dish: Dish, c: number = C20): number {
  return c / (dish.D / 1000);
}
/** A frequency rounded for a label ("about 520 Hz"). */
export const fmtHz = (f: number): string => (f >= 1000 ? `${(Math.round(f / 100) / 10).toFixed(1)} kHz` : `${Math.round(f / 10) * 10} Hz`);

/**
 * A ray arriving `offDeg` off the dish axis at height `y0` across the bowl
 * (frame D, in the section's plane), reflected off the paraboloid. Returns
 * the hit point, the reflected direction (unit) and how far the reflected ray
 * passes from the focus (its closest approach, mm). On the axis every ray
 * passes through the focus (0 mm) — the paraboloid's defining property.
 */
export function reflectRay(dish: Dish, y0: number, offDeg: number): { hit: { x: number; y: number }; dir: { x: number; y: number }; miss: number; at: { x: number; y: number } } {
  const t = (offDeg * Math.PI) / 180;
  // Incoming direction: toward the vertex (−x), tilted by the off-axis angle.
  const d = { x: -Math.cos(t), y: -Math.sin(t) };
  // Where a ray through (depth, y0) along d meets x = y² / 4f.
  const p0 = { x: dish.depth, y: y0 };
  // Solve (p0.y + s·d.y)² = 4f (p0.x + s·d.x) for the smallest s > 0.
  const a = d.y * d.y;
  const b = 2 * p0.y * d.y - 4 * dish.f * d.x;
  const c = p0.y * p0.y - 4 * dish.f * p0.x;
  let s: number;
  if (Math.abs(a) < 1e-12) s = -c / b;
  else {
    const disc = Math.max(0, b * b - 4 * a * c);
    const r1 = (-b - Math.sqrt(disc)) / (2 * a);
    const r2 = (-b + Math.sqrt(disc)) / (2 * a);
    s = [r1, r2].filter((q) => q > 1e-9).sort((m, n) => m - n)[0] ?? r1;
  }
  const hit = { x: p0.x + s * d.x, y: p0.y + s * d.y };
  // Surface normal of x = y²/4f is (1, −y/2f) (pointing into the bowl, +x side).
  const nx = 1;
  const ny = -hit.y / (2 * dish.f);
  const nl = Math.hypot(nx, ny);
  const n = { x: nx / nl, y: ny / nl };
  const k = 2 * (d.x * n.x + d.y * n.y);
  const r = { x: d.x - k * n.x, y: d.y - k * n.y };
  const rl = Math.hypot(r.x, r.y);
  const dir = { x: r.x / rl, y: r.y / rl };
  // Closest approach of the reflected ray (from hit along dir) to the focus (f, 0).
  const fx = dish.f - hit.x;
  const fy = 0 - hit.y;
  const along = Math.max(0, fx * dir.x + fy * dir.y);
  const at = { x: hit.x + along * dir.x, y: hit.y + along * dir.y };
  return { hit, dir, miss: Math.hypot(dish.f - at.x, at.y), at };
}

/** The rays drawn for an aim error: `n` rays spread across the bowl's mouth
 *  (the outer 10 % left out, so a ray never grazes the rim). */
export function raySet(dish: Dish, offDeg: number, n = 7): ReturnType<typeof reflectRay>[] {
  const R = halfWidthAt(dish, dish.depth) * 0.9;
  return Array.from({ length: n }, (_, i) => reflectRay(dish, -R + (2 * R * i) / (n - 1), offDeg));
}
/** The largest miss of a ray set (mm) — a picture of "off the axis, the
 *  reflected sound no longer meets at the element". */
export const spreadAt = (dish: Dish, offDeg: number): number => Math.max(...raySet(dish, offDeg).map((r) => r.miss));

/** The aim-error trials of B12 (L49: centre aim, a small aim error, a
 *  deliberately off-axis target) and B13 (L142: 10 and 20 degrees). */
export const AIM_TRIALS = [0, 10, 20] as const;
export const AIM_WORDS: Readonly<Record<(typeof AIM_TRIALS)[number], string>> = {
  0: 'On the axis: the reflected sound meets at the element — the most high-frequency detail from the target.',
  10: 'A small aim error: the reflections no longer meet at one point. Listen for the target’s high-frequency definition fading first.',
  20: 'Well off the axis: the bowl now favours whatever IS on its axis — perhaps the crowd beyond. The target is mostly heard directly, duller.',
};

/** The element slid along the axis (mm, + = out of the bowl), the trial range. */
export const FOCUS_SLIDE = 20;
export function focusWords(offsetMm: number): string {
  const a = Math.abs(Math.round(offsetMm));
  if (a === 0) return 'At the maker’s focal reference: the reflected sound meets at the element.';
  return `${a} mm ${offsetMm > 0 ? 'out of' : 'into'} the bowl from the focus: higher frequencies weaken first. Measure the focus from the surface the maker names — never an estimated centre — and recheck it after travel.`;
}
