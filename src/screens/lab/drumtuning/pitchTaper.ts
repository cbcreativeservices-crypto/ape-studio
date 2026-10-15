/**
 * Drum pitch faders move in MUSICAL steps (slider audit HOLD #8, owner
 * 2026-10-14: "switch to musical steps (semitones)").
 *
 * A straight-Hz lane gave the low end too little travel and the top too much:
 * on a 45–90 Hz kick, the first 10 % of the lane was over two semitones and
 * the last 10 % barely one. The ear hears pitch as a RATIO, so the lane now
 * rides log(Hz): equal travel = an equal pitch interval, everywhere on the
 * lane. The endpoints are the same as before; only the spacing between them
 * changed.
 *
 * Pure (no React) so the taper is unit-tested in node
 * (test/holdWordingTapers_20261014.test.ts).
 */
import type { DockParam } from '../rack/rackTypes';

/** Lane position (0..1) → Hz on a log scale between lo and hi. */
export function laneToHz(t: number, lo: number, hi: number): number {
  const c = Math.max(0, Math.min(1, t));
  return lo * Math.pow(hi / lo, c);
}

/** Hz → lane position (0..1) on the same log scale (clamped). */
export function hzToLane(hz: number, lo: number, hi: number): number {
  if (!(hi > lo) || !(lo > 0)) return 0;
  const t = Math.log(Math.max(lo, Math.min(hi, hz)) / lo) / Math.log(hi / lo);
  return Math.max(0, Math.min(1, t));
}

/** Semitones the whole lane spans (the lane's musical width). */
export function laneSemitones(lo: number, hi: number): number {
  return 12 * Math.log2(hi / lo);
}

/**
 * A pitch fader on the musical taper. `value`, `min`, `max`, `step` and
 * `home` are in the PAGE's units — Hz by default; for a tension fader pass
 * `toHz` / `fromHz` (N/m ↔ the head's pitch) and the lane rides the PITCH
 * that tension makes, while the page keeps (and snaps) its own N/m. Every
 * readout the page prints from its value — tension word, N/m, Hz, note —
 * stays exactly as before, because the page's value is still the source.
 */
export function pitchFaderParam(o: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  formatShort?: (v: number) => string;
  onChange: (v: number) => void;
  home?: number;
  tint?: string;
  /** Page units → Hz (default: the value IS Hz). */
  toHz?: (v: number) => number;
  /** Hz → page units (default: the value IS Hz). */
  fromHz?: (hz: number) => number;
}): DockParam {
  const toHz = o.toHz ?? ((v: number) => v);
  const fromHz = o.fromHz ?? ((hz: number) => hz);
  const lo = toHz(o.min);
  const hi = toHz(o.max);
  const step = o.step ?? 1;
  return {
    kind: 'fader',
    id: o.id,
    label: o.label,
    value: hzToLane(toHz(o.value), lo, hi),
    onChange: (t) => {
      const raw = fromHz(laneToHz(t, lo, hi));
      const snapped = Math.min(o.max, Math.max(o.min, Math.round(raw / step) * step));
      // Same step as now → no call (the lane hands the page a value every
      // frame; see AmpRack.faderParam).
      if (Math.abs(snapped - o.value) < step * 1e-6) return;
      o.onChange(snapped);
    },
    format: () => o.format(o.value),
    formatShort: o.formatShort ? () => o.formatShort!(o.value) : undefined,
    tint: o.tint,
    home: o.home != null ? hzToLane(toHz(o.home), lo, hi) : undefined,
  };
}
