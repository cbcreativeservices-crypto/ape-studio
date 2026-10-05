/**
 * describeScene — the scene in words (blueprint §9). Every miking <Canvas> is
 * labelled with this, and the well's "NOW:" line carries the short form, so
 * a screen-reader user and a learner who cannot see the drawing well get the
 * same facts the picture shows. Numbers use the bezel's rounding (≈ 5 mm,
 * ≈ 5°). Pure; worklet-safe (the live summary is formatted during a drag).
 */
import type { Readouts } from '../model/types.ts';
import { fmtAngle, fmtLen } from '../model/units.ts';

export type MicDescription = {
  slot: string;
  typeLabel: string;
  patternLabel: string;
  readouts: Readouts;
  /** e.g. "the batter head" */
  surfaceLabel: string;
  /** e.g. "the beater line" */
  lineLabel: string;
  /** "Inside, near the batter head, start about 5–7.5 cm …" — null when not in a zone. */
  zoneLabel: string | null;
  /** Off-axis is meaningless for a surface plate (fixed aim). */
  showAim: boolean;
  /** How a negative distance is said (default "behind"). */
  minusWords?: string;
  /** How a positive distance is said (default "from"). */
  plusWords?: string;
  /** A signed radial's words (a line with an offset). */
  lineWords?: { plus: string; minus: string };
};

export type SceneDescription = {
  view: 'side' | 'top';
  /** "a 22 × 18 in bass drum with a ported front head" */
  subject: string;
  mics: MicDescription[];
  extra?: string;
};

export function describeMic(m: MicDescription, short = false): string {
  'worklet';
  const r = m.readouts;
  const where = r.inside ? 'inside the drum' : 'outside the drum';
  const dist = `${fmtLen(Math.abs(r.distance))} ${r.distance >= 0 ? m.plusWords ?? 'from' : m.minusWords ?? 'behind'} ${m.surfaceLabel}`;
  const off = m.lineWords ? `${fmtLen(Math.abs(r.radial))} ${r.radial >= 0 ? m.lineWords.plus : m.lineWords.minus} ${m.lineLabel}` : `${fmtLen(r.radial)} off ${m.lineLabel}`;
  const aim = m.showAim ? `, aimed ${fmtAngle(r.offAxis)} off the head's axis` : '';
  const zone = m.zoneLabel ? ` At a recommended starting point: ${m.zoneLabel}.` : ' Not at a recommended starting point.';
  const clear = r.blocked ? ` Blocked: it would touch the ${r.blocked.label}.` : ' Clear of all parts.';
  if (short) return `Mic ${m.slot}: ${where}, ${dist}, ${off}${aim}.${m.zoneLabel ? ` Zone: ${m.zoneLabel}.` : ''}${r.blocked ? ` Blocked by the ${r.blocked.label}.` : ''}`;
  return `Mic ${m.slot}: ${m.typeLabel}, ${m.patternLabel}, ${where}, ${dist}, ${off}${aim}.${zone}${clear}`;
}

export function describeScene(d: SceneDescription): string {
  'worklet';
  const view = d.view === 'side' ? 'Side view, cutaway,' : 'Top view';
  let s = `${view} of ${d.subject}.`;
  for (let i = 0; i < d.mics.length; i++) s += ` ${describeMic(d.mics[i])}`;
  if (d.extra) s += ` ${d.extra}`;
  return s;
}

/** The well's one-line NOW summary. */
export function describeNow(d: SceneDescription): string {
  'worklet';
  let s = '';
  for (let i = 0; i < d.mics.length; i++) s += `${i ? ' ' : ''}${describeMic(d.mics[i], true)}`;
  return s;
}
