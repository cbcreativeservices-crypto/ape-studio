/**
 * C09a VIOLIN / FIDDLE — where things are (charter §2 layer 2): the shared
 * bowed family's violin row (lessons/shared/bowed/bowedSpec.ts) held under
 * the chin (posture.ts `underChin`: the proposal's 45° forward-left, 10°
 * rise, 30° roll), STANDING or SEATED (the proposal's seated option, 450 mm
 * lower). In the lesson frame the violin stays put; the floor, the legs and
 * the chair move.
 *
 * Clip attachments: a body clip on the BASS-side rib at the lower bout ("the
 * left side", DPA's mounting guide), and a holder gripping two strings
 * between the tailpiece and the bridge.
 */
import type { InstrumentModel, ReferenceSurface } from '../../engine/model/types.ts';
import { add, norm, scale } from '../../engine/geometry/vec.ts';
import { bowedModel, mergeVariants, type BowedModelOpts } from '../shared/bowed/bowedModel.ts';
import { CLEAR, VIOLIN, archAt, halfWidth, stationsOf, stringZ } from '../shared/bowed/bowedSpec.ts';
import { anchorsOf, toLesson, underChin } from '../shared/bowed/posture.ts';

export const SPEC = VIOLIN;
const st = stationsOf(SPEC);
export const STANDING = underChin(SPEC, 0, false);
export const SEATED = underChin(SPEC, 0, true);
export const A = anchorsOf(STANDING);
const ax = STANDING.ax;
export const B = (x: number, y: number, z: number) => toLesson(ax, { x, y, z });

/** "In front of and somewhat above": 20° above the audience-facing line. */
export const FRONT = norm({ x: 1, y: -Math.tan((20 * Math.PI) / 180), z: 0 });
const XL = st.tailX + SPEC.body.mm * SPEC.stations.lower;
/** The body clip's grip on the bass-side rib at the lower bout. */
export const RIB_CLIP = { x: XL + 25, y: -(halfWidth(SPEC, XL + 25) + 2), z: -SPEC.rib.mm / 2 };
/** The holder's grip on two strings, between the tailpiece and the bridge. */
export const HOLDER_AT = { x: -30, y: 0, z: stringZ(SPEC, -30) };
/** Where the holder brings the capsule: just behind the bridge, by the strings. */
export const BEHIND = B(-20, 0, (stringZ(SPEC, -20) + archAt(SPEC, -20)) / 2 + 4);
/** The treble rib at the lower bout's widest point, toward the bow side. */
export const RIB_T = A.ribT;

export const VIOLIN_VIEWS = {
  side: { u0: -760, u1: 1400, v0: -760, v1: 640 },
  top: { u0: -760, u1: 1400, v0: -760, v1: 820 },
};

const surfaces: ReferenceSurface[] = [
  { id: 'side', partId: 'bw.body', label: 'the side of the violin', point: RIB_T, normal: ax.y, target: true },
  { id: 'foot', partId: 'bw.bridge', label: 'the bridge’s foot', point: A.bridgeFoot, normal: ax.z, target: true },
  { id: 'behind', partId: 'bw.strings', label: 'the strings behind the bridge', point: BEHIND, normal: ax.z, target: true },
];

const opts: BowedModelOpts = {
  id: 'violin',
  name: 'violin',
  right: 'bow',
  views: VIOLIN_VIEWS,
  attach: [
    { id: 'clip.rib', label: 'the rib on the bass side', at: RIB_CLIP },
    { id: 'clip.holder', label: 'two strings behind the bridge', at: HOLDER_AT },
  ],
  front: FRONT,
  clearance: CLEAR.body,
  surfaces,
  variants: [
    { id: 'standing', label: 'STANDING', blurb: 'The violinist stands: the violin under the chin, about shoulder height, the scroll forward and to the left.' },
    { id: 'seated', label: 'SEATED', blurb: 'The violinist sits, as in an orchestra or a quartet: the same hold, the instrument about 45 cm lower, the floor and the knees closer.' },
  ],
};

export const VIOLIN_MODEL: InstrumentModel = mergeVariants([
  { variant: 'standing', model: bowedModel(STANDING, opts) },
  { variant: 'seated', model: bowedModel(SEATED, opts) },
]);

/** The contact point's line, a little in front (toward the audience). */
export const CLOSE_DIR = norm(add(ax.z, scale({ x: 1, y: 0, z: 0 }, 0.8)));
