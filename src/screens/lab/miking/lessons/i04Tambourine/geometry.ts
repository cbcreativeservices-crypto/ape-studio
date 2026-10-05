/**
 * I04 HEADLESS TAMBOURINE — where things are (charter §2 layer 2), built from
 * the poses in model.ts by the family helper (smallperc/build.ts): the ring
 * (or the crescent) and its jingles follow each state's pose, so the
 * drawing, the zones and the keep-outs agree.
 */
import type { Envelope, InstrumentModel, Part } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { add, ill, mul, v3 } from '../shared/smallperc/geom.ts';
import { frontX, JOUT, motionOf, R, STATES, TMB_DIMS, topY, type TmbState } from './model.ts';

const DEPTH = TMB_DIMS.depth.mm;
const FT = TMB_DIMS.frameT.mm;
const neg = (v: { x: number; y: number; z: number }) => v3(-v.x, -v.y, -v.z);

/** The crescent's arc as capsules (outer radius, 200° of arc about the
 *  ring's centre, open toward the audience side). */
function crescentCapsules(s: TmbState, r: number): { a: { x: number; y: number; z: number }; b: { x: number; y: number; z: number } }[] {
  const p = s.pose;
  const e2 = v3(0, 0, 1);
  const pts: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i <= 4; i++) {
    const a = ((80 + (200 * i) / 4) * Math.PI) / 180; // the arc's back two-thirds
    pts.push(add(p.c, add(mul(p.e1, Math.cos(a) * r), mul(e2, Math.sin(a) * r))));
  }
  return pts.slice(1).map((b, i) => ({ a: pts[i], b }));
}

function parts(s: TmbState): Part[] {
  const p = s.pose;
  const into = neg(p.n);
  const v = s.id;
  if (s.crescent) {
    const r = TMB_DIMS.crescentR.mm - TMB_DIMS.crescentW.mm / 2;
    const caps = crescentCapsules(s, r);
    return [
      { id: `tmb.frame.${v}`, label: 'crescent frame (with a grip)', short: 'frame', role: 'A curved half-ring frame with a moulded grip — no head. The player holds it by the grip and shakes or strikes it.', moving: true, prov: TMB_DIMS.crescentR.prov, solid: { kind: 'capsule', a: caps[1].a, b: caps[2].b, r: TMB_DIMS.crescentW.mm / 2 + 6 } },
      { id: `tmb.jingles.${v}`, label: 'jingle pairs (one row)', short: 'jingles', role: 'Pairs of thin metal discs loose on pins in slots along the frame. Every shake and strike throws them against each other — the whole sound of a headless tambourine.', moving: true, prov: TMB_DIMS.slots.prov, solid: { kind: 'capsule', a: caps[0].a, b: caps[3].b, r: TMB_DIMS.crescentW.mm / 2 } },
    ];
  }
  const out: Part[] = [
    { id: `tmb.frame.${v}`, label: 'frame (ring, no head)', short: 'frame', role: 'A wooden ring with slots for the jingles — and no head: nothing in the middle vibrates. The player holds it at the grip edge.', moving: v !== 'mounted', prov: TMB_DIMS.d.prov, solid: { kind: 'tube', c: p.c, axis: into, rIn: R - FT, rOut: R, x0: -DEPTH / 2, x1: DEPTH / 2 } },
    { id: `tmb.jingles.${v}`, label: 'jingle pairs (one row)', short: 'jingles', role: 'Pairs of thin metal discs loose on pins in slots round the frame. Every shake and strike throws them against each other — the whole sound of a headless tambourine.', moving: v !== 'mounted', prov: { kind: 'sourced', src: 'MEINL-MTA1', quote: '1 row and 2 row versions' }, solid: { kind: 'tube', c: p.c, axis: into, rIn: R, rOut: R + JOUT, x0: -DEPTH / 2 + 6, x1: DEPTH / 2 - 6 } },
  ];
  if (v === 'mounted') {
    out.push({ id: 'tmb.mount', label: 'stand clamp and stand', short: 'mount', role: 'A stand clamp holding the ring flat for stick playing. Check it is secure and listen for its own rattles.', prov: ill('a stand clamp at h 1000 (proposal)'), solid: { kind: 'capsule', a: v3(-R - 30, p.c.y + 20, 0), b: v3(-R - 30, -40, 0), r: 12 } });
    out.push({ id: 'tmb.stick', label: 'stick', short: 'stick', role: 'A drumstick in the player’s right hand: it strikes the frame and jingles from the player’s side.', moving: true, prov: ill('a stick over the player’s half of the ring (drawing default)'), solid: { kind: 'capsule', a: s.stick!.a, b: s.stick!.b, r: 8 } });
  }
  return out;
}

function state(s: TmbState, label: string, blurb: string, phrase: string): StateSpec {
  const mo = motionOf(s);
  const env: Envelope[] = [];
  if (s.off) env.push({ id: `env.freeHand.${s.id}`, label: 'the other hand the ring is struck into', shape: { kind: 'capsule', a: s.off.W, b: s.off.G, r: 70 }, prov: ill('the other hand (drawing default)') });
  return {
    variant: { id: s.id, label, blurb, phrase },
    parts: parts(s),
    motion: { ...mo, label: s.id === 'mounted' ? 'the stick’s reach' : s.id === 'struck' ? 'the strike into the hand' : 'the shake', prov: s.id === 'struck' ? TMB_DIMS.strike.prov : TMB_DIMS.shake.prov },
    arms: [{ id: 'arm.R', label: 'right', arm: s.arm, sweep: s.id === 'mounted' ? 20 : 30 }, ...(s.off ? [{ id: 'arm.L', label: 'left', arm: s.off, sweep: 20 }] : [])],
    ref: { id: `front.${s.id}`, partId: `tmb.frame.${s.id}`, label: 'the tambourine', point: v3(frontX(s), s.pose.c.y, 0), normal: v3(1, 0, 0) },
    surfaces: [
      { id: `top.${s.id}`, partId: `tmb.frame.${s.id}`, label: 'the top of the tambourine', point: v3(s.pose.c.x, topY(s), 0), normal: v3(0, -1, 0), target: true },
      ...(s.id === 'struck' ? [{ id: 'side.struck', partId: 'tmb.frame.struck', label: 'the side of the tambourine', point: v3(s.pose.c.x, s.pose.c.y, R + JOUT), normal: v3(0, 0, 1), target: true }] : []),
    ],
    envelopes: env,
    regions: [{ id: `r.jingles.${s.id}`, partId: `tmb.jingles.${s.id}`, label: 'jingles', anchor: add(s.pose.c, mul(s.pose.e1, R)), prov: TMB_DIMS.d.prov, note: 'The jingle pairs round the frame: the whole sound — bright, metallic, with brief high peaks.' }],
  };
}

export const TMB_MODEL: InstrumentModel = smallPercModel({
  id: 'headlessTambourine10',
  name: '10 in headless tambourine',
  states: [
    state(STATES.shaken, 'RING, SHAKEN', 'A 10 in ring held at about 45° and shaken side to side: the jingles clash on every change of direction.', 'shaken'),
    state(STATES.struck, 'STRUCK INTO THE HAND', 'The same ring struck into the other hand: a stronger, less continuous accent.', 'struck into the hand'),
    state(STATES.crescent, 'CRESCENT', 'A crescent-shaped frame with a grip, shaken: the same jingles, a different hold.', 'a crescent, shaken'),
    state(STATES.mounted, 'MOUNTED', 'The ring flat on a stand clamp, struck with a stick: the instrument stays put; the clamp may rattle.', 'on a stand clamp'),
  ],
  views: {
    side: { u0: -560, u1: 700, v0: -1780, v1: -760 },
    top: { u0: -560, u1: 700, v0: -620, v1: 620 },
  },
  viewsByVariant: { mounted: { side: { u0: -560, u1: 700, v0: -1600, v1: -580 } } },
});
