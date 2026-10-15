/**
 * FEW STOPS → TAP CHOICES (owner 2026-10-14, slider audit hold #5: "Miking
 * faders with only 3–4 positions — turn them into tap buttons instead of a
 * slider"). A stepped fader whose whole travel holds just 3 or 4 values made
 * most of the lane dead: the finger moved and nothing changed until it crossed
 * a step. Those controls are a key that opens its choices instead.
 *
 * A page whose choices are FIXED at 3–4 writes its `kind: 'options'` key
 * directly. A page whose list comes from the lesson (sound stages, setups,
 * plan items, parts…) builds its fader as before and passes it through
 * `tapsWhenFew`: 3–4 choices → a tap key with the same id, label, readout and
 * effect; any other count → the fader, unchanged.
 *
 * Pure (no React Native), so the tests reach it directly.
 */
import type { DockParam } from '../../../rack/rackTypes';

type Fader = Extract<DockParam, { kind: 'fader' }>;

/** The stop counts that become tap choices. */
export const TAP_STOPS = { min: 3, max: 4 } as const;

/** True when a stepped control of `n` stops is tap choices, not a fader. */
export function fewStops(n: number): boolean {
  return n >= TAP_STOPS.min && n <= TAP_STOPS.max;
}

/**
 * For a fader that already has a tap twin on the same dock (a SETUP fader
 * beside its SETUPS key, which lists the very same setups): with 3–4 stops the
 * fader is dropped — the tap key is the control — instead of making a second,
 * identical key. Any other count keeps the fader. Spread it into the params.
 */
export function faderUnlessFew(n: number, f: Fader): DockParam[] {
  return fewStops(n) ? [] : [f];
}

/**
 * The fader `f` as tap choices when its travel holds 3–4 stops.
 *  - `n`: how many stops the fader's travel holds;
 *  - `at`: the stop it is on now (0-based);
 *  - `label(i)`: the words on choice i;
 *  - `pick(i)`: what landing on stop i does — the fader's own effect (for a
 *    preview/commit fader, the commit).
 * The key keeps the fader's id, label, help and readout (`formatShort` on the
 * key, `format` read aloud); the tray stays open so the choices can be A/B'd
 * while the display reacts. A LOCKED fader stays a fader (it shows its lock).
 */
export function tapsWhenFew(f: Fader, n: number, at: number, label: (i: number) => string, pick: (i: number) => void): DockParam {
  if (!fewStops(n) || f.locked) return f;
  const full = f.format(f.value);
  return {
    kind: 'options',
    id: f.id,
    label: f.label,
    valueLabel: (f.formatShort ?? f.format)(f.value),
    valueA11y: full,
    options: Array.from({ length: n }, (_, i) => ({ id: String(i), label: label(i) })),
    selectedId: at >= 0 && at < n ? String(at) : null,
    onSelect: (id) => pick(Number(id)),
    sticky: true,
    helpKey: f.helpKey,
  };
}
