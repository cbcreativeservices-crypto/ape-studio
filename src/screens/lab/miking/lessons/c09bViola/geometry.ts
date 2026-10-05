/**
 * C09b VIOLA — where things are (charter §2 layer 2): the shared bowed
 * family's viola row (viola/GEOMETRY_PROPOSAL.md: the violin family frame
 * and posture, the tail 20 mm lower), STANDING or SEATED as the violin.
 * Clip attachments: a body clip on the bass-side rib, and a holder on two
 * strings between the tailpiece and the bridge.
 */
import type { InstrumentModel, ReferenceSurface } from '../../engine/model/types.ts';
import { norm } from '../../engine/geometry/vec.ts';
import { bowedModel, mergeVariants, type BowedModelOpts } from '../shared/bowed/bowedModel.ts';
import { CLEAR, VIOLA, archAt, halfWidth, stationsOf, stringZ } from '../shared/bowed/bowedSpec.ts';
import { anchorsOf, toLesson, underChin } from '../shared/bowed/posture.ts';

export const SPEC = VIOLA;
const st = stationsOf(SPEC);
export const STANDING = underChin(SPEC, 20, false);
export const SEATED = underChin(SPEC, 20, true);
export const A = anchorsOf(STANDING);
const ax = STANDING.ax;
export const B = (x: number, y: number, z: number) => toLesson(ax, { x, y, z });

/** "In front of and somewhat above": 20° above the audience-facing line. */
export const FRONT = norm({ x: 1, y: -Math.tan((20 * Math.PI) / 180), z: 0 });
const XL = st.tailX + SPEC.body.mm * SPEC.stations.lower;
export const RIB_CLIP = { x: XL + 25, y: -(halfWidth(SPEC, XL + 25) + 2), z: -SPEC.rib.mm / 2 };
export const HOLDER_AT = { x: -32, y: 0, z: stringZ(SPEC, -32) };
export const BEHIND = B(-22, 0, (stringZ(SPEC, -22) + archAt(SPEC, -22)) / 2 + 4);

export const VIOLA_VIEWS = {
  side: { u0: -760, u1: 1400, v0: -760, v1: 660 },
  top: { u0: -760, u1: 1400, v0: -780, v1: 840 },
};

const surfaces: ReferenceSurface[] = [
  { id: 'foot', partId: 'bw.bridge', label: 'the bridge’s foot', point: A.bridgeFoot, normal: ax.z, target: true },
  { id: 'behind', partId: 'bw.strings', label: 'the strings behind the bridge', point: BEHIND, normal: ax.z, target: true },
];

const opts: BowedModelOpts = {
  id: 'viola',
  name: 'viola',
  right: 'bow',
  views: VIOLA_VIEWS,
  attach: [
    { id: 'clip.rib', label: 'the rib on the bass side', at: RIB_CLIP },
    { id: 'clip.holder', label: 'two strings behind the bridge', at: HOLDER_AT },
  ],
  front: FRONT,
  clearance: CLEAR.body,
  surfaces,
  variants: [
    { id: 'standing', label: 'STANDING', blurb: 'The violist stands: the viola under the chin, about shoulder height, the scroll forward and to the left.' },
    { id: 'seated', label: 'SEATED', blurb: 'The violist sits, as in a quartet or an orchestra: the same hold, about 45 cm lower; the knees and the floor come closer.' },
  ],
};

export const VIOLA_MODEL: InstrumentModel = mergeVariants([
  { variant: 'standing', model: bowedModel(STANDING, opts) },
  { variant: 'seated', model: bowedModel(SEATED, opts) },
]);
