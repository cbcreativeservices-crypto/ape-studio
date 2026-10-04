/**
 * READOUT TEXT — every string the placement pages print about a mic's pose,
 * built from ONE `Readouts` value (deriveReadouts) so the live strip over the
 * canvas, the bezel cells, the well's NOW line and the canvas label can never
 * disagree (charter §6, "no stale labels"). Pure; worklets (the live strip is
 * formatted on the UI thread during a native drag). No React Native imports,
 * so the tests reach it directly.
 *
 *   withStop(r, stop)   the readouts as SHOWN: a pose that is clear but was
 *                       stopped by a part (constrainMove / a refused zone jump)
 *                       reads "✕ <part>" everywhere, not only in the strip
 *   liveLine(r, …)      "A · ≈ 25 cm (9.8 in) from the batter head · …"
 *   lenCell(mm)         a bezel cell's value + its imperial line, so the cell
 *                       keeps its KEY (BezelReadouts drops the key of a value
 *                       too wide for the cell — D36)
 *   placementBezel(…)   page 3's four bezel cells
 */
import type { DocumentedZone, Readouts } from '../model/types.ts';
import { fmtAngle, fmtImperial, fmtLen, fmtMetric } from '../model/units.ts';

export type Stop = null | { partId: string; label: string };

export type ReadoutWords = {
  slot: string;
  /** e.g. "the batter head" */
  surfaceLabel: string;
  /** e.g. "the beater line" */
  lineLabel: string;
  /** Off-axis is meaningless for a surface plate (fixed aim). */
  showAim: boolean;
};

/** The readouts as shown: an actual intersection wins, else the stop reason. */
export function withStop(r: Readouts, stop: Stop): Readouts {
  'worklet';
  if (r.blocked || !stop) return r;
  return { ...r, blocked: { partId: stop.partId, label: stop.label } };
}

/** The live strip over the canvas (one line per mic). */
export function liveLine(r: Readouts, w: ReadoutWords): string {
  'worklet';
  const dist = `${w.slot} · ${fmtLen(Math.abs(r.distance))} ${r.distance >= 0 ? 'from' : 'behind'} ${w.surfaceLabel} · ${fmtLen(r.radial)} off ${w.lineLabel}${w.showAim ? ` · aim ${fmtAngle(r.offAxis)}` : ''}`;
  return r.blocked ? `${dist} · ✕ ${r.blocked.label}` : dist;
}

/** A length for a bezel cell: "≈ 25 cm" over "(9.8 in)" — both units, same
 *  rounding as everywhere else (≈ 5 mm). `signed` prints + / − (Δd). */
export function lenCell(mm: number, signed = false): { v: string; sub: string } {
  'worklet';
  if (!(mm === mm)) return { v: '—', sub: 'not measured' };
  const a = Math.abs(mm);
  const zero = Math.round(a / 5) === 0;
  const s = !signed || zero ? '' : mm > 0 ? '+' : '−';
  return { v: `≈ ${s}${fmtMetric(a)}`, sub: `(${s}${fmtImperial(a)})` };
}

/** "the batter head" → "BATTER"; "the front head" → "FRONT". */
export function shortRef(label: string): string {
  return label.replace(/^the /, '').replace(/ head$/, '').toUpperCase();
}

/** "the beater line" → "BEATER LINE"; "the drum’s axis" → "DRUM AXIS". */
export function lineRef(label: string): string {
  return label.replace(/^the /, '').replace(/’s\b/, '').toUpperCase();
}

export type BezelCell = { k: string; v: string; sub?: string; tint?: string; flex?: number };

export const ZONE_TINT = { sourced: '#6fa8ff', trial: '#ffc64d', blocked: '#ff6b5e' } as const;

/** Page 3's bezel: distance (from the zone's / chosen head), off the line,
 *  aim, zone — all from the SAME shown readouts as the strip and NOW line. */
export function placementBezel(r: Readouts, w: ReadoutWords, zone: DocumentedZone | null, partShort: (partId: string) => string = (id) => id): BezelCell[] {
  const d = lenCell(Math.abs(r.distance));
  const off = lenCell(r.radial);
  return [
    // The slot letter lives in the strip ("A · …"); one mic per page-3 bezel,
    // so the key spends its width on the head it is measured from.
    { k: `${r.distance >= 0 ? 'FROM' : 'BEHIND'} ${shortRef(w.surfaceLabel)}`, v: d.v, sub: d.sub, flex: 1.4 },
    { k: `OFF ${lineRef(w.lineLabel)}`, v: off.v, sub: off.sub, flex: 1.5 },
    { k: 'AIM', v: w.showAim ? fmtAngle(r.offAxis) : 'FLAT', flex: 0.8 },
    // The stop names the PART (its short name), in red, with the ✕ in the
    // key — colour is never the only signal (charter §8).
    r.blocked
      ? { k: '✕ STOPPED', v: partShort(r.blocked.partId).toUpperCase(), tint: ZONE_TINT.blocked, flex: 1.3 }
      : { k: 'ZONE', v: zone ? (zone.kind === 'trial' ? 'TRIAL' : 'SOURCED') : 'NONE', sub: zone ? (zone.kind === 'trial' ? 'dashed band' : 'solid band') : undefined, tint: zone ? ZONE_TINT[zone.kind] : undefined, flex: 1.3 },
  ];
}
