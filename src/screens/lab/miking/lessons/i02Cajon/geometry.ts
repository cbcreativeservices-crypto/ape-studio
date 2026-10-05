/**
 * I02 CAJÓN — where things are (charter §2 layer 2), built from the states in
 * model.ts by the family helper (smallperc/build.ts) with the SEATED player's
 * keep-outs in place of the standing body.
 */
import type { Envelope, InstrumentModel, Part, Rim } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { ill, v3 } from '../shared/smallperc/geom.ts';
import { BH, CAJ_DIMS, handsBox, HX, HZ, motionOf, PORT_R, SEAT, STATES, type CajState } from './model.ts';

const WHY = ill('the seated player, drawn from the posture (proposal Frame J); no source gives a clearance');

function parts(s: CajState): Part[] {
  const v = s.id;
  const front = v === 'frontport';
  const lo = CAJ_DIMS.ledgeH.mm;
  const out: Part[] = [
    {
      id: `caj.box.${v}`,
      label: 'the box',
      short: 'box',
      role: 'A wooden box the player sits on: the box and its playing surface vibrate — an idiophone, with no stretched head.',
      prov: CAJ_DIMS.h.prov,
      solid: { kind: 'box', min: v3(-HX, -BH, -HZ), max: v3(s.plateX, 0, HZ) },
    },
    {
      id: `caj.plate.${v}`,
      label: 'the front plate (the playing surface)',
      short: 'plate',
      role: 'Struck by the hands: near the middle for the low bass tone, at the top corners for the snare-like slap.',
      prov: { kind: 'sourced', src: 'GRIN-CAJ', quote: 'a bass tone by striking the bottom-half of the front face; a snare-drum-like quality by striking the upper edge of the front face' },
    },
    {
      id: `caj.snares.${v}`,
      label: 'the snare wires (inside)',
      short: 'snares',
      role: 'Inside, resting against the plate’s top part: they add the buzz to a slap. Never retuned or taped without the player’s agreement.',
      prov: { kind: 'sourced', src: 'MEINL-JC50', quote: 'dual internal snares are fitted to rest against the inside of the frontplate' },
    },
    {
      id: `caj.port.${v}`,
      label: front ? 'the port (front, facing up)' : 'the port (on the back)',
      short: 'port',
      role: front ? 'On this model the port is in front, facing up — not behind the player. Its air can pop a mic placed in its path.' : 'A round hole in the back. It sends out much of the low end — and a puff of air on bass strokes.',
      prov: front ? { kind: 'sourced', src: 'MEINL-SLAP', quote: 'upward facing front port' } : CAJ_DIMS.port.prov,
    },
  ];
  if (front) out.push({ id: 'caj.ledge.frontport', label: 'the front ledge', short: 'ledge', role: 'The low front shelf the upward port opens through; the playing surface sits back above it.', prov: CAJ_DIMS.ledgeH.prov, solid: { kind: 'box', min: v3(s.plateX, -lo, -HZ), max: v3(HX, 0, HZ) } });
  return out;
}

function seated(v: string): Envelope[] {
  const z = (p: { x: number; y: number }, k: number) => v3(p.x, p.y, k);
  const out: Envelope[] = [
    { id: `env.torso.${v}`, label: 'the player’s torso', shape: { kind: 'capsule', a: v3(SEAT.hip.x, SEAT.hip.y - 40, 0), b: v3(SEAT.shoulder.x - 20, SEAT.shoulder.y + 20, 0), r: 170 }, prov: WHY },
    { id: `env.head.${v}`, label: 'the player’s head', shape: { kind: 'capsule', a: SEAT.head, b: v3(SEAT.head.x - 10, SEAT.head.y - 30, 0), r: 105 }, prov: WHY },
  ];
  for (const k of [1, -1]) {
    const side = k > 0 ? 'right' : 'left';
    out.push({ id: `env.thigh.${side}.${v}`, label: `the player’s ${side} thigh and knee`, shape: { kind: 'capsule', a: z(SEAT.hip, k * SEAT.hipZ), b: z(SEAT.knee, k * SEAT.kneeZ), r: 75 }, prov: WHY });
    out.push({ id: `env.shin.${side}.${v}`, label: `the player’s ${side} shin`, shape: { kind: 'capsule', a: z(SEAT.knee, k * SEAT.kneeZ), b: z(SEAT.ankle, k * SEAT.ankleZ), r: 60 }, prov: WHY });
    out.push({ id: `env.foot.${side}.${v}`, label: `the player’s ${side} foot and heel`, shape: { kind: 'capsule', a: z(SEAT.ankle, k * SEAT.ankleZ), b: z(SEAT.toe, k * (SEAT.ankleZ + 15)), r: 48 }, prov: WHY });
  }
  return out;
}

function state(s: CajState, label: string, blurb: string, phrase: string): StateSpec {
  const v = s.id;
  const hb = handsBox(s);
  return {
    variant: { id: v, label, blurb, phrase },
    parts: parts(s),
    motion: { ...motionOf(s), label: 'both hands’ strokes on the plate', prov: ill('the hands’ strike arcs out to 130 mm from the plate (proposal ko.hands, drawn narrower)') },
    arms: [{ id: 'arm.R', label: 'right', arm: s.R, sweep: 15 }, { id: 'arm.L', label: 'left', arm: s.L, sweep: 15 }],
    ref: { id: `plate.${v}`, partId: `caj.plate.${v}`, label: 'the middle of the front plate', point: s.plate, normal: v3(1, 0, 0) },
    surfaces: [{ id: `port.${v}`, partId: `caj.port.${v}`, label: 'the port', point: s.port, normal: s.portN, target: true }],
    regions: [
      { id: `r.plate.${v}`, partId: `caj.plate.${v}`, label: 'plate', anchor: s.plate, prov: CAJ_DIMS.h.prov, note: 'The plate: hand attack, slaps and the box’s body.' },
      { id: `r.port.${v}`, partId: `caj.port.${v}`, label: 'port', anchor: s.port, prov: CAJ_DIMS.port.prov, note: 'The port: much of the low end, and air on bass strokes.' },
    ],
    envelopes: [
      { id: `env.hands.${v}`, label: 'both hands’ strike arcs', shape: { kind: 'box', min: hb.min, max: hb.max }, prov: ill('the hands’ arcs in front of the plate (proposal ko.hands)') },
      ...seated(v),
      { id: `env.rock.${v}`, label: 'the box rocked back (its top edge)', shape: { kind: 'box', min: v3(-HX - 125, -BH - 20, -HZ - 10), max: v3(-HX, -330, HZ + 10) }, prov: ill('a tilt of up to about 15° onto the back edge (proposal ko.rock)') },
      { id: `env.exit.${v}`, label: 'the player’s way off the box (stand bases and cables stay out)', shape: { kind: 'box', min: v3(-450, -150, -760), max: v3(300, 0, -230) }, prov: ill('a 600 mm path from the seat to the side, at floor level (proposal ko.exit)') },
    ],
  };
}

const RIMS: Rim[] = [{ id: 'rim.port.rear', label: 'the port’s edge', c: STATES.rear.port, axis: v3(-1, 0, 0), r: PORT_R, variants: ['rear'] }];

export const CAJ_MODEL: InstrumentModel = {
  ...smallPercModel({
    id: 'cajon',
    name: 'cajón',
    body: false,
    states: [
      state(STATES.rear, 'REAR PORT', 'A box cajón with its port on the back, snare wires inside the plate.', 'a rear-port cajón'),
      state(STATES.frontport, 'FRONT PORT', 'A front-port model: the port in front, facing up, below a set-back playing surface.', 'a front-port cajón'),
    ],
    views: {
      side: { u0: -700, u1: 820, v0: -1300, v1: 60 },
      top: { u0: -700, u1: 820, v0: -680, v1: 680 },
    },
  }),
  rims: RIMS,
  // A rear mic faces the other way (toward the back of the box).
  aimAzLimit: 180,
};
