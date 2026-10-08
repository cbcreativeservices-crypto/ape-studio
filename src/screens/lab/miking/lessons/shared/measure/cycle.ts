/**
 * THE OPERATING CYCLE — a made-up level strip of a device run through one
 * cycle (F15; machinery_sound/GEOMETRY_PROPOSAL.md §3 "Cycle log": start /
 * steady / stop markers on a SYNTHETIC level strip, labelled a made-up
 * example — owner decision D-6B-2). Built by Lab 6 group 5 (branch lab6-g5).
 * Pure; tested.
 *
 * The run: the device off (the background), a start-up with its overshoot,
 * a steady stretch with a rattle that comes and goes, the stop and its
 * run-down, the background again. The levels are RELATIVE (dB re the
 * background's typical level) — a strip to read the shape of a cycle, never
 * a pressure. A sample's energy average goes through the SPL calculator's
 * `leq` (calcBridge.leqOf), never a copied formula.
 *
 * What the strip teaches (F15 L27): a short sample taken at one phase can
 * miss an intermittent rattle or exaggerate the start-up — capture whole
 * cycles, with the start, the steady state and the stop marked.
 */
import { seeded } from './levelHistory.ts';

export const CYCLE_HZ = 8;
export const CYCLE = {
  seconds: 60,
  on: 8,
  steady: 11,
  stop: 52,
  quiet: 56,
  background: 0,
  running: 14,
  overshoot: 6,
  rattles: [21, 35, 47] as const,
  rattleDb: 7,
  rattleS: 0.8,
} as const;

/** The strip: one level (dB, relative) every 1/CYCLE_HZ s. Deterministic. */
export function makeCycle(seed = 15): number[] {
  const rnd = seeded(seed);
  const out: number[] = [];
  const n = CYCLE.seconds * CYCLE_HZ;
  for (let i = 0; i < n; i++) {
    const t = i / CYCLE_HZ;
    let db: number = CYCLE.background;
    if (t >= CYCLE.on && t < CYCLE.steady) {
      // The start-up: up through an overshoot, settling at the running level.
      const u = (t - CYCLE.on) / (CYCLE.steady - CYCLE.on);
      db = CYCLE.background + (CYCLE.running - CYCLE.background) * Math.min(1, u * 2) + CYCLE.overshoot * Math.sin(Math.PI * Math.min(1, u * 1.4));
    } else if (t >= CYCLE.steady && t < CYCLE.stop) {
      db = CYCLE.running;
      for (const r of CYCLE.rattles) if (t >= r && t < r + CYCLE.rattleS) db = CYCLE.running + CYCLE.rattleDb;
    } else if (t >= CYCLE.stop && t < CYCLE.quiet) {
      const u = (t - CYCLE.stop) / (CYCLE.quiet - CYCLE.stop);
      db = CYCLE.running + (CYCLE.background - CYCLE.running) * u;
    }
    out.push(db + (rnd() - 0.5) * 1.2);
  }
  return out;
}

export type Phase = 'off' | 'start' | 'steady' | 'stop';
/** The phase at time t (s). */
export function phaseAt(t: number): Phase {
  if (t < CYCLE.on || t >= CYCLE.quiet) return 'off';
  if (t < CYCLE.steady) return 'start';
  if (t < CYCLE.stop) return 'steady';
  return 'stop';
}

/** What a sample from `from` for `len` seconds holds: the rattles it caught, the phases it spans. */
export function sampleOf(from: number, len: number): { rattles: number; phases: Phase[]; whole: boolean } {
  const to = from + len;
  const rattles = CYCLE.rattles.filter((r) => r + CYCLE.rattleS > from && r < to).length;
  const phases: Phase[] = [];
  for (let t = from; t < to; t += 0.25) {
    const p = phaseAt(t);
    if (!phases.includes(p)) phases.push(p);
  }
  return { rattles, phases, whole: from <= CYCLE.on && to >= CYCLE.quiet };
}
