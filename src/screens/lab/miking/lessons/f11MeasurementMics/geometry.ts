/**
 * F11 MEASUREMENT MICROPHONES AND CALIBRATION — where things are (charter §2
 * layer 2). One TEST BENCH in scene frame F (lessons/shared/field/
 * sceneFrame.ts): a small two-way test loudspeaker on a stand, its
 * REFERENCE POINT on the front baffle at the origin, +x out of the baffle
 * toward the mic, +y down, the floor 1.2 m below the reference axis; the
 * person running the measurement standing back, to one side.
 *
 * Every size here is a DRAWING DEFAULT (measurement_mics/GEOMETRY_PROPOSAL.md
 * §2, §4): no source gives a test loudspeaker's size, the axis height, or a
 * universal measuring distance — the method does. The 1 m "logged distance"
 * is the proposal's drawing default and is never taught as a rule.
 */
import type { Envelope, InstrumentModel, Part, RefLine, ReferenceSurface, ViewBox } from '../../engine/model/types.ts';
import { ill, measureModel, operatorPart, operatorSide, operatorTop } from '../shared/measure/measureModel.ts';
import type { TestSpeakerGeom } from '../shared/measure/MeasureArt';

/** The floor, below the reference axis (drawing default 1.2 m). */
export const F11_GROUND = 1200;

/** The test loudspeaker: baffle at x = 0, the reference point between the drivers. */
export const F11_SPK: TestSpeakerGeom = { front: 0, depth: 250, top: -230, bottom: 170, half: 125, woofer: { y: 55, r: 82 }, tweeter: { y: -140, r: 20 }, floorY: F11_GROUND };

/** Where the operator stands: back from the mic and to one side (drawing default). */
export const F11_OP = { x: 2600, z: -1000 };

export const F11_VIEWS: Record<'side' | 'top', ViewBox> = {
  side: { u0: -700, u1: 2950, v0: -760, v1: F11_GROUND + 60 },
  top: { u0: -700, u1: 2950, v0: -1550, v1: 2150 },
};

const SPK_PROV = ill('drawing default: a small two-way test loudspeaker (measurement_mics/GEOMETRY_PROPOSAL.md §4)');

const PARTS: Part[] = [
  {
    id: 'spk.box',
    label: 'the test loudspeaker',
    short: 'loudspeaker',
    role: 'The source under test: a small two-way loudspeaker. Its reference point — here, on the front baffle between the drivers — is where every distance is measured from, and it is written down.',
    solid: { kind: 'box', min: { x: -F11_SPK.depth, y: F11_SPK.top, z: -F11_SPK.half }, max: { x: 14, y: F11_SPK.bottom, z: F11_SPK.half } },
    prov: SPK_PROV,
  },
  {
    id: 'spk.woofer',
    label: 'the woofer',
    short: 'woofer',
    role: 'The larger driver: the lows and mids leave from its cone.',
    prov: SPK_PROV,
  },
  {
    id: 'spk.tweeter',
    label: 'the tweeter',
    short: 'tweeter',
    role: 'The small driver: the highs leave from its dome. Above the woofer, so a mic too high or too low hears the two at different distances.',
    prov: SPK_PROV,
  },
  {
    id: 'spk.stand',
    label: 'the loudspeaker stand',
    short: 'stand',
    role: 'A rigid stand on a weighted base: the loudspeaker must not move between readings.',
    solid: { kind: 'box', min: { x: -125 - 190, y: F11_SPK.bottom, z: -170 }, max: { x: -125 + 190, y: F11_GROUND, z: 170 } },
    prov: SPK_PROV,
  },
  operatorPart(F11_OP.x, F11_OP.z, F11_GROUND, 'You, back from the mic and to one side. A person near the capsule reflects sound into it and changes the very field being measured — so keep back, as the method asks.'),
];

export const F11_SURFACES: ReferenceSurface[] = [
  { id: 'baffle', partId: 'spk.box', label: 'the loudspeaker’s front baffle', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, plus: { words: 'from', key: 'FROM' } },
  { id: 'ref', partId: 'spk.box', label: 'the loudspeaker’s reference point', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, target: true },
];

export const F11_LINES: RefLine[] = [{ id: 'axis', label: 'the loudspeaker’s axis', point: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }];

/** The operator's poses (the art draws them; the solid above is the same body). */
export const F11_OP_SIDE = operatorSide(F11_OP.x, F11_GROUND, -1);
export const F11_OP_TOP = operatorTop(F11_OP.x, F11_OP.z, -1);

const ENVELOPES: Envelope[] = [];

export const F11_MODEL: InstrumentModel = measureModel({
  id: 'testBench',
  name: 'measurement bench',
  parts: PARTS,
  regions: [
    { id: 'drivers', partId: 'spk.box', label: 'the drivers on the front baffle', anchor: { x: 0, y: 0, z: 0 }, prov: SPK_PROV, note: 'The sound under test leaves the woofer’s cone and the tweeter’s dome, out of the front baffle.' },
  ],
  surfaces: F11_SURFACES,
  lines: F11_LINES,
  envelopes: ENVELOPES,
  variants: [{ id: 'bench', label: 'TEST BENCH', blurb: 'A loudspeaker test on a bench: one source, one direction, a measurement mic on a stand in front of it, and you standing back.', phrase: 'on a test bench' }],
  defaultVariant: 'bench',
  views: F11_VIEWS,
  viewTags: { side: 'SIDE', top: 'FROM ABOVE' },
  groundY: { mm: F11_GROUND, prov: ill('drawing default: the reference axis 1.2 m above the floor'), placeholder: true },
  aimAzLimit: 180,
});
