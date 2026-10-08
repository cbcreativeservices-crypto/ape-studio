/**
 * THE VOICE'S STARTING POINTS, built on any singer (frame V, voiceSpec.ts):
 * the mouth as a reference TARGET (every distance is "from the mouth": the
 * lip point to the mic's front), the mouth's axis as a reference line, the
 * places the voice leaves (the mouth; the nose), and the recommended zones —
 * each a distance band from the mouth, an approach (how far off the mouth's
 * axis, and to which side), and an aim at the mouth — with a start pose
 * found once at load: the first candidate inside the zone and clear of every
 * solid in every variant it is offered in (bowedModel.firstClear).
 *
 * Pure (no React). The words of each zone are the lesson's; the numbers come
 * from voiceSpec.VOICE_ROWS and the drawing defaults of VOICE_DIMS.
 */
import type { DocumentedZone, InstrumentModel, MicType, MountKind, Provenance, RadiatingRegion, RefLine, ReferenceSurface, VariantId, Vec3 } from '../../../engine/model/types.ts';
import { around, firstClear, zoneSection } from '../bowed/bowedModel.ts';
import { NOSE, NOSE_MOUTH, down, left, vDir, type VoiceAnchor } from './voiceSpec.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

/** Lift a frame-V point onto an anchor (V.lip + x·fwd + (−y)·up + z·right). */
export function onAnchor(V: VoiceAnchor, p: Vec3): Vec3 {
  return {
    x: V.lip.x + V.fwd.x * p.x - V.up.x * p.y + V.right.x * p.z,
    y: V.lip.y + V.fwd.y * p.x - V.up.y * p.y + V.right.y * p.z,
    z: V.lip.z + V.fwd.z * p.x - V.up.z * p.y + V.right.z * p.z,
  };
}

/** The mouth as a TARGET surface (distances from the lip point). */
export function mouthSurface(V: VoiceAnchor, opts: { id?: string; partId: string; variants?: VariantId[] }): ReferenceSurface {
  return { id: opts.id ?? 'mouth', partId: opts.partId, label: 'the lips', point: V.lip, normal: V.fwd, target: true, plus: { words: 'from', key: 'FROM' }, ...(opts.variants ? { variants: opts.variants } : {}) };
}

/** The mouth's axis (straight out of the lips): the line a zone's "off the
 *  axis" is read against. */
export function mouthLine(V: VoiceAnchor, opts: { id?: string; surface?: string; variants?: VariantId[] }): RefLine {
  return {
    id: opts.id ?? 'mouthAxis',
    label: 'the mouth’s axis (straight out of the lips)',
    point: V.lip,
    dir: V.fwd,
    surfaces: [opts.surface ?? 'mouth'],
    words: { plus: 'off', minus: 'off', keyPlus: 'OFF AXIS', keyMinus: 'OFF AXIS' },
    ...(opts.variants ? { variants: opts.variants } : {}),
  };
}

/** Where the voice leaves: the mouth (nearly everything) and the nose (the
 *  hummed m, n and ng). */
export function voiceRegions(V: VoiceAnchor, opts: { mouthPart: string; nosePart: string; prefix?: string; variants?: VariantId[] }): RadiatingRegion[] {
  const pre = opts.prefix ?? 'r';
  const vs = opts.variants ? { variants: opts.variants } : {};
  return [
    { id: `${pre}.mouth`, partId: opts.mouthPart, label: 'the mouth', anchor: V.lip, prov: ill('the lip point stands for the mouth’s opening'), note: 'Almost all of the voice leaves through the open mouth — the vowels, the consonants and the breath. Every starting point here is measured from it.', ...vs },
    { id: `${pre}.nose`, partId: opts.nosePart, label: 'the nose', anchor: onAnchor(V, NOSE), prov: ill('the nose tip stands for the nostrils (a drawing default)'), note: 'On m, n and ng the mouth closes or narrows and the sound leaves through the nose — a smaller part of the voice, close to the mouth.', ...vs },
  ];
}

export type Side = 'down' | 'up' | 'right' | 'left';
const sideVec = (V: VoiceAnchor, s: Side): Vec3 => (s === 'down' ? down(V) : s === 'up' ? V.up : s === 'right' ? V.right : left(V));

/** One vocal starting point, before its start pose is found. */
export type VoiceZoneSpec = {
  id: string;
  label: string;
  band: string;
  kind: 'sourced' | 'trial';
  src: string;
  quote: string;
  bandProv?: Provenance;
  distance: { min: number; max: number };
  /** How far off the mouth's axis (degrees), and toward which side; absent
   *  = round the axis, within `max`. */
  off: { min: number; max: number; toward?: Side; prov: Provenance };
  /** Aimed at the mouth within this many degrees. */
  aimTol: number;
  aimProv?: Provenance;
  micTypeIds: string[];
  mount?: MountKind;
  variant?: VariantId;
  variants?: VariantId[];
  /** Where the start is looked for: distances in order of preference, the
   *  angle off the axis, and the spread round it. `at`: what the mic aims at
   *  (default between the nose and the mouth on axis, the mouth off it). */
  start: { d: number[]; deg?: number; spread?: number; at?: 'mouth' | 'noseMouth'; /** A point of the host to aim at instead (E07: between the mouth and the guitar). */ aimPoint?: Vec3 };
  /** Opt out of the drawn section (a clip-held capsule beside the mouth). */
  noDraw?: boolean;
  tendency: string;
  checks: string[];
};

/** The zone's DocumentedZone on a singer, its start found in `model`. */
export function voiceZone(model: InstrumentModel, V: VoiceAnchor, z: VoiceZoneSpec, micTypes: Record<string, MicType>, opts: { surface?: string } = {}): DocumentedZone {
  const toward = z.off.toward ? sideVec(V, z.off.toward) : undefined;
  const mid = (z.off.min + z.off.max) / 2;
  const axis = toward ? vDir(V, mid, toward) : V.fwd;
  const half = toward ? (z.off.max - z.off.min) / 2 : z.off.max;
  const surface = opts.surface ?? 'mouth';
  const r0 = Math.max(z.distance.min, 20);
  const draw = z.noDraw
    ? undefined
    : {
        side: zoneSection('side', V.lip, axis, half, r0, z.distance.max, toward),
        top: zoneSection('top', V.lip, axis, half, r0, z.distance.max, toward),
      };
  const base: Omit<DocumentedZone, 'start'> = {
    id: z.id,
    label: z.label,
    band: z.band,
    kind: z.kind,
    src: z.src,
    quote: z.quote,
    ...(z.bandProv ? { bandProv: z.bandProv } : {}),
    refSurface: surface,
    side: 'either',
    distance: z.distance,
    cone: { min: z.off.min, max: z.off.max, ...(toward ? { toward } : {}), prov: z.off.prov },
    aim: { maxOffAxis: z.aimTol, prov: z.aimProv ?? ill(`aimed at the mouth: within ${z.aimTol}° (the lab’s tolerance)`) },
    requires: { ...(z.variant ? { variant: z.variant } : {}), ...(z.variants ? { variants: z.variants } : {}), micTypeIds: z.micTypeIds, ...(z.mount ? { mount: z.mount } : {}) },
    ...(draw ? { draw } : {}),
    tendency: z.tendency,
    checks: z.checks,
  };
  const aimPt = z.start.aimPoint ?? ((z.start.at ?? (z.off.max <= 20 && !toward ? 'noseMouth' : 'mouth')) === 'noseMouth' ? onNoseMouth(V) : V.lip);
  const startDir = z.start.deg != null && toward ? vDir(V, z.start.deg, toward) : axis;
  const side = toward ?? V.up;
  const variants = z.variant ? [z.variant] : z.variants ?? model.variants.map((v) => v.id);
  const start = firstClear(model, base, variants, around(V.lip, startDir, z.start.d, z.start.spread ?? 6, aimPt, side), micTypes);
  return { ...base, start };
}

/** Between the nose and the mouth (S-REC's aim), on an anchor. */
export function onNoseMouth(V: VoiceAnchor): Vec3 {
  return onAnchor(V, NOSE_MOUTH);
}
