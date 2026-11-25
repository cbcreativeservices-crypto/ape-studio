/**
 * cymatics/vizGain — the display mappings the Plate and Drum views share
 * (owner 2026-11-25, fix-next CYM). Pure, so node tests run them as written.
 *
 * TWO DIFFERENT QUESTIONS, TWO DIFFERENT NUMBERS (checker round 2, Y1):
 *  • RESPONSE (`strength`, against the fixed Low-damping reference) says how
 *    FAR the plate moves. It sets the heat colours and the 3D / slice height.
 *  • NEAR (`near`, against the current plate's own peak) says whether the
 *    drive sits ON a mode. It decides whether the sand forms a figure. Damping
 *    does not move a resonance, so on a mode a damped plate still forms its
 *    figure: damping BLURS it (wider still lines, slower settling) instead.
 */
import { heatColor } from '../tools/levelColor';

const clamp01 = (v: number) => (v !== v ? 0 : Math.max(0, Math.min(1, v)));

// ── LEVEL → heat brightness ─────────────────────────────────────────────────
/**
 * ONE stated compressive curve from LEVEL to the heat colours' gain:
 *
 *     g(L) = ln(1 + 50·L) / ln(51)
 *
 * It is a DISPLAY curve (like a camera's exposure curve), not physics: the
 * heat colours rise strictly with LEVEL over the whole fader, LEVEL 0 is a
 * dark, still plate and LEVEL 100 % is full scale. The studios' opening LEVEL
 * (30 %) already reads bright (g = 0.705), the "Turn it up" start (20 %)
 * reads 0.59, and the top of the fader still visibly brightens (60 % → 100 %
 * adds 0.127; checker round 2: 1 − (1 − L)⁴ left the top 40 % of the fader
 * almost dead). The four fixed-drive views (home hero, modules, Nodes, Change
 * One Thing) drive at 80 %: g = 0.944, about 6 % less bright than before LEVEL
 * reached the colours. (Round 1 used g = L: the opening picture peaked at
 * 0.30 and never reached red.)
 */
export const HEAT_LEVEL_K = 50;
export function heatLevelGain(level01: number): number {
  return Math.log(1 + HEAT_LEVEL_K * clamp01(level01)) / Math.log(1 + HEAT_LEVEL_K);
}
/** The response share of the heat colours: a faint floor keeps the shape legible between modes. */
export function heatStrengthK(strength: number): number {
  return 0.12 + 0.88 * clamp01(strength);
}
/** Heat-colour gain for a cell of |field| 1 (the brightest cell). */
export function heatGainK(level01: number, strength: number): number {
  return heatLevelGain(level01) * heatStrengthK(strength);
}

/**
 * heatColor through a 4096-step lookup (Y4, performance): moving LEVEL
 * recolours every cell, and the house heatColor parses and rebuilds a hex
 * string per call (3,136 calls per fader step on the plate). The table is
 * heatColor itself, sampled every 1/4095 of the ramp: a channel differs by at
 * most 1 of 255 from the direct call.
 */
const LUT_N = 4096;
let lut: string[] | null = null;
export function heatColorFast(t01: number): string {
  if (!lut) {
    lut = new Array(LUT_N);
    for (let i = 0; i < LUT_N; i++) lut[i] = heatColor(i / (LUT_N - 1));
  }
  return lut[Math.round(clamp01(t01) * (LUT_N - 1))];
}

// ── the sand ───────────────────────────────────────────────────────────────
export type SandDrive = {
  /** How hard the plate throws the sand (0..1): LEVEL × how close to a mode. */
  agit: number;
  /** Gradient gain: how fast the grains walk to the still lines. */
  kick: number;
  /** Random-walk size. */
  jit: number;
  /** × the static-friction band: grains stop this much farther from a still line (wider lines). */
  settleScale: number;
};

/**
 * The sand's drive. `near` (0..1) decides WHETHER a figure forms (between
 * modes it is small and the sand only shivers, at any damping); `qRel` is the
 * plate's Q over its Low-damping Q (1 at Low, 0.35 at Medium, 0.075 at High),
 * and it BLURS the figure: a damped plate moves less on its mode, so more of
 * it is too still to throw sand (the still lines widen) and the grains walk
 * there more slowly.
 *
 * The small 0.04 floor (a plate is never perfectly still) feeds the SHIVER
 * (jitter) only, never the walk to the lines (kick): with the floor inside the
 * kick, sand between modes slowly organised into the off-resonance field (69 %
 * of grains on still lines after 30 s; checker round 2), and the lab says it
 * "shivers but does not organize". On a mode the kick is 4 % below its old value.
 */
export function sandDrive(level01: number, near: number, qRel: number): SandDrive {
  const a = clamp01(level01);
  const n = clamp01(near);
  const sharp = Math.sqrt(clamp01(qRel));
  const agit = a * (0.04 + 0.96 * n * n);
  return {
    agit,
    kick: 2.2 * a * 0.96 * n * n * (0.3 + 0.7 * sharp),
    jit: 0.09 * agit,
    settleScale: 1 + 1.5 * (1 - sharp),
  };
}
