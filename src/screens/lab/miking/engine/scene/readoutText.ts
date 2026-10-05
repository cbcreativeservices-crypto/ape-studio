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
  /** A negative distance in words / as a bezel key (default behind / BEHIND). */
  minusWords?: string;
  minusKey?: string;
  /** A positive distance in words / as a bezel key (default from / FROM). */
  plusWords?: string;
  plusKey?: string;
  /** A SIGNED radial (a line with an offset): its words and keys. */
  lineWords?: { plus: string; minus: string; keyPlus: string; keyMinus: string };
};

/** "≈ 5 cm above the rim" — the distance from the reference surface. */
function distWords(r: Readouts, w: ReadoutWords): string {
  'worklet';
  return `${fmtLen(Math.abs(r.distance))} ${r.distance >= 0 ? w.plusWords ?? 'from' : w.minusWords ?? 'behind'} ${w.surfaceLabel}`;
}

/** "≈ 2 cm off the beater line", or, signed, "≈ 2 cm in from the rim edge". */
export function radialWords(r: Readouts, w: Pick<ReadoutWords, 'lineLabel' | 'lineWords'>): string {
  'worklet';
  if (w.lineWords) return `${fmtLen(Math.abs(r.radial))} ${r.radial >= 0 ? w.lineWords.plus : w.lineWords.minus} ${w.lineLabel}`;
  return `${fmtLen(r.radial)} off ${w.lineLabel}`;
}

/** The readouts as shown: an actual intersection wins, else the stop reason. */
export function withStop(r: Readouts, stop: Stop): Readouts {
  'worklet';
  if (r.blocked || !stop) return r;
  return { ...r, blocked: { partId: stop.partId, label: stop.label } };
}

/** The live strip over the canvas (one line per mic). */
export function liveLine(r: Readouts, w: ReadoutWords): string {
  'worklet';
  const dist = `${w.slot} · ${distWords(r, w)} · ${radialWords(r, w)}${w.showAim ? ` · aim ${fmtAngle(r.offAxis)}` : ''}`;
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

/** A stop's short name for the bezel: the part's `short`, else a keep-out's
 *  own words ("the player’s hands" → "player’s hands") — never a raw id such
 *  as "env.hands" (clarity pass 2026-10-05). */
export function stopShortOf(model: { parts: { id: string; short: string }[]; envelopes: { id: string; label: string }[] }, extra: Record<string, string> = {}): (id: string) => string {
  return (id) => model.parts.find((p) => p.id === id)?.short ?? extra[id] ?? model.envelopes.find((e) => e.id === id)?.label.replace(/^the /i, '') ?? id;
}

export type BezelCell ={ k: string; v: string; sub?: string; tint?: string; flex?: number };

export const ZONE_TINT = { zone: '#6fa8ff', blocked: '#ff6b5e' } as const;

/** A zone's mark: one consistent style for every recommended starting point
 *  (owner ruling 2026-10-04 — no SOURCED / TRIAL marks on screen). */
export function zoneMark(zone: DocumentedZone | null): string {
  return zone ? 'IN ZONE' : 'NONE';
}

/** Page 3's bezel: distance (from the zone's / chosen head), off the line,
 *  aim, zone — all from the SAME shown readouts as the strip and NOW line. */
export function placementBezel(r: Readouts, w: ReadoutWords, zone: DocumentedZone | null, partShort: (partId: string) => string = (id) => id): BezelCell[] {
  const d = lenCell(Math.abs(r.distance));
  const off = lenCell(w.lineWords ? Math.abs(r.radial) : r.radial);
  const offKey = w.lineWords ? (r.radial >= 0 ? w.lineWords.keyPlus : w.lineWords.keyMinus) : `OFF ${lineRef(w.lineLabel)}`;
  return [
    // The slot letter lives in the strip ("A · …"); one mic per page-3 bezel,
    // so the key spends its width on the head it is measured from.
    { k: `${r.distance >= 0 ? w.plusKey ?? 'FROM' : w.minusKey ?? 'BEHIND'} ${shortRef(w.surfaceLabel)}`, v: d.v, sub: d.sub, flex: 1.4 },
    { k: offKey, v: off.v, sub: off.sub, flex: 1.5 },
    { k: 'AIM', v: w.showAim ? fmtAngle(r.offAxis) : 'FLAT', flex: 0.8 },
    // The stop names the PART (its short name), in red, with the ✕ in the
    // key — colour is never the only signal (charter §8).
    r.blocked
      ? { k: '✕ STOPPED', v: partShort(r.blocked.partId).toUpperCase(), tint: ZONE_TINT.blocked, flex: 1.3 }
      : { k: 'ZONE', v: zoneMark(zone), sub: zone ? 'start here' : undefined, tint: zone ? ZONE_TINT.zone : undefined, flex: 1.3 },
  ];
}
