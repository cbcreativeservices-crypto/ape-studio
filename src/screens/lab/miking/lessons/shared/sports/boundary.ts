/**
 * THE BOUNDARY AND PLANT TOOLS — a mic at a hard surface, and a mic on a
 * structure (Lab 7 part 2; B14 defines them, B15–B17 use them). Built once
 * by group 2 (lab7-g5); docs/labs/miking/court_ice/GEOMETRY_PROPOSAL.md §2,
 * SOURCES.md "Derived". Pure; tested.
 *
 * THE REFLECTION (a section view; millimetres): a capsule `h` above a large
 * hard floor hears the source twice — straight, and off the floor. The floor
 * acts as a mirror: the reflected path is the path from the source's IMAGE
 * below the floor. The extra path Δ = |image − capsule| − |source − capsule|
 * sets the arrival-time difference (Δ / c) and the comb's notches
 * (engine/physics/twoMic, same polarity — a hard floor reflects without
 * inverting). For sound arriving straight down onto the capsule Δ = 2h and
 * the first notch is c / (4h): h = 0.30 m → 286 Hz, 0.10 m → 858 Hz,
 * 0.01 m → 8.6 kHz (CONFIRMED by geometry). At grazing arrival Δ shrinks
 * toward zero. A capsule AT the surface (a boundary mic, in its intended
 * geometry) moves the first notch above the audio band. An ideal model:
 * equal-level arrivals, a perfectly hard and large floor, no edges — said
 * once as "a simplified picture".
 *
 * Words that stay with it (B14 L55, L131; B15): a shotgun laid on foam on the
 * floor is not a boundary mic; soft mats are not a large hard surface; the
 * usable range depends on the surface's size and nearby edges.
 *
 * THE PLANT: an airborne capsule on an ISOLATED mount (a compatible
 * suspension, a controlled cable loop) or a RIGID clamp — the vibration path
 * drawn, never given a number. A CONTACT SENSOR is a separate thing: it
 * "hears the structure, not the air"; its input impedance and interface come
 * from its own documentation, and no phantom power unless that says so.
 */
import { deltaTms, notchesHz, C20 } from '../../../engine/physics/twoMic.ts';

export type BoundaryGeom = { /** capsule height above the surface (mm) */ h: number; /** the source's horizontal distance (mm) */ x: number; /** the source's height above the surface (mm) */ hs: number };

/** The direct and reflected path lengths and the extra path (mm). */
export function paths(g: BoundaryGeom): { direct: number; reflected: number; extra: number } {
  const direct = Math.hypot(g.x, g.hs - g.h);
  const reflected = Math.hypot(g.x, g.hs + g.h);
  return { direct, reflected, extra: reflected - direct };
}
/** Where the reflected path meets the floor (mm along the floor from the capsule). */
export function bouncePoint(g: BoundaryGeom): number {
  // Similar triangles: the image ray crosses the floor h/(h+hs) of the way from the capsule.
  return g.hs + g.h <= 1e-9 ? 0 : (g.x * g.h) / (g.h + g.hs);
}
/** The first notch of the direct + reflected sum (Hz), or null above 20 kHz. */
export function firstNotch(g: BoundaryGeom, c: number = C20): number | null {
  const n = notchesHz(deltaTms(paths(g).extra, c), 1, 20000, 1);
  return n.length ? n[0] : null;
}
/** The first notch for sound arriving straight down onto a capsule h mm up: c / (4h). */
export const perpendicularNotch = (h: number, c: number = C20): number => c / (4 * (h / 1000));

/** The heights the tool offers (mm): a raised mic, two lower ones, and AT the surface. */
export const HEIGHTS = [300, 100, 10, 0] as const;

export type PlantMount = 'isolated' | 'rigid' | 'contact';
export const PLANT_WORDS: Readonly<Record<PlantMount, { label: string; short: string; hears: string; check: string }>> = {
  isolated: {
    label: 'An airborne mic on an isolated mount',
    short: 'ISOLATED',
    hears: 'Mostly the air: the suspension keeps most of the structure’s shaking from the capsule.',
    check: 'A controlled cable loop, so the cable does not bypass the suspension; secured away from access and play.',
  },
  rigid: {
    label: 'An airborne mic clamped rigidly',
    short: 'RIGID',
    hears: 'The air AND the structure: rattles and transmitted impacts come straight through the clamp.',
    check: 'If vibration dominates, move the capsule to an independently supported approved point — a high-pass filter cannot give back the missing perspective.',
  },
  contact: {
    label: 'A contact sensor on the structure',
    short: 'CONTACT',
    hears: 'The structure, not the air: thuds and resonance, exaggerated — not the same perspective as an airborne mic.',
    check: 'Its input impedance and interface from its own documentation; no phantom power unless that documentation specifies it; labelled as a contact sensor in the mix.',
  },
};
export const PLANT_IDS: readonly PlantMount[] = ['isolated', 'rigid', 'contact'];
