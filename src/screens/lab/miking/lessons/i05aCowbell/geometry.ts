/**
 * I05a COWBELL — where things are (charter §2 layer 2), built from the states
 * in model.ts by the family helper (smallperc/build.ts).
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { add, ill, mul, v3 } from '../shared/smallperc/geom.ts';
import { BELL_DIMS, motionOf, STATES, type BellState } from './model.ts';

const L = BELL_DIMS.len.mm;
const MW = BELL_DIMS.mouthW.mm;
const MH = BELL_DIMS.mouthH.mm;

function parts(s: BellState): Part[] {
  const v = s.id;
  const c = s.c;
  const out: Part[] = [
    { id: `bell.body.${v}`, label: 'the bell (steel body)', short: 'bell', role: 'A tapered steel box, closed at one end and open at the mouth. The whole metal body vibrates after the stick strikes it — not only the mouth.', prov: BELL_DIMS.len.prov, solid: { kind: 'box', min: v3(c.x - L / 2, c.y - MH / 2, c.z - MW / 2), max: v3(c.x + L / 2, c.y + MH / 2, c.z + MW / 2) } },
    { id: `bell.mouth.${v}`, label: 'the mouth (open end)', short: 'mouth', role: 'The open end. Its shape and any damping matter — but it is not a trumpet’s bell: the walls radiate too.', prov: BELL_DIMS.mouthH.prov },
    { id: `bell.mute.${v}`, label: 'a mute (cushion or magnet)', short: 'mute', role: 'A soft cushion inside the mouth, or a magnetic mute on the side, shortens the ring — the larger one lowers the pitch too. It must stay secure and clear of the stick.', prov: { kind: 'sourced', src: 'MEINL-GROOVE', quote: 'The small mute takes the edge off, while the large mute muffles the sustain and lowers the pitch.' } },
    { id: `bell.stick.${v}`, label: 'stick', short: 'stick', role: 'The stick strikes the top of the bell near the mouth; its rebound and fills set where a mic can go.', moving: true, prov: BELL_DIMS.stick.prov, solid: { kind: 'capsule', a: s.stick.hand, b: s.stick.tip, r: 8 } },
  ];
  if (v === 'mounted') {
    const clampAt = add(c, mul(s.ax, -L / 2 - 30));
    out.push({ id: 'bell.mount', label: 'clamp and stand', short: 'mount', role: 'A clamp on a stand holds the bell. Secure, it can still pass vibration to the hardware; loose, it buzzes or turns into the stick’s path.', prov: ill('a percussion stand under the closed end (drawing default)'), solid: { kind: 'capsule', a: clampAt, b: v3(clampAt.x, -40, clampAt.z), r: 14 } });
  }
  return out;
}

function state(s: BellState, label: string, blurb: string, phrase: string): StateSpec {
  const mo = motionOf(s);
  return {
    variant: { id: s.id, label, blurb, phrase },
    parts: parts(s),
    motion: { ...mo, label: 'the stick’s stroke and rebound', prov: BELL_DIMS.rise.prov },
    arms: [{ id: 'arm.R', label: 'right', arm: s.arm, sweep: 25 }, ...(s.holder ? [{ id: 'arm.L', label: 'left', arm: s.holder, sweep: 0 }] : [])],
    ref: { id: `bell.${s.id}`, partId: `bell.body.${s.id}`, label: 'the bell', point: s.c, normal: v3(0, -1, 0) },
    surfaces: [{ id: `bellside.${s.id}`, partId: `bell.body.${s.id}`, label: 'the bell (from the side)', point: s.c, normal: v3(0, 0, -1), target: true }],
    regions: [{ id: `r.bell.${s.id}`, partId: `bell.body.${s.id}`, label: 'bell', anchor: s.c, prov: BELL_DIMS.len.prov, note: 'The whole steel body rings after the strike: the walls and the mouth radiate.' }],
  };
}

export const BELL_MODEL: InstrumentModel = smallPercModel({
  id: 'cowbell7',
  name: '7 in cowbell',
  states: [
    state(STATES.mounted, 'MOUNTED', 'On a stand’s clamp, the mouth toward the player, struck on its top with a stick: the bell stays put while the stick moves round it.', 'on a stand'),
    state(STATES.handheld, 'HANDHELD', 'Held in the left palm by the closed end, the mouth away from the player, struck with a stick: the hand damps it a little and it moves.', 'held in the hand'),
  ],
  views: {
    side: { u0: -560, u1: 760, v0: -1700, v1: -640 },
    top: { u0: -560, u1: 760, v0: -560, v1: 560 },
  },
});
