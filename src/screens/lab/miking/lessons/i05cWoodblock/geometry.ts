/**
 * I05c WOODBLOCK — where things are (charter §2 layer 2), built from the
 * states in model.ts by the family helper (smallperc/build.ts).
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { ill, v3 } from '../shared/smallperc/geom.ts';
import { motionOf, STATES, WB_DIMS, type WbState } from './model.ts';

const L = WB_DIMS.len.mm;
const DP = WB_DIMS.depth.mm;
const H = WB_DIMS.h.mm;
export const TABLE = { x0: -230, x1: 250, z0: -420, z1: 420 } as const;

function parts(s: WbState): Part[] {
  const v = s.id;
  const c = s.c;
  const out: Part[] = [
    { id: `wb.block.${v}`, label: 'the block (hardwood)', short: 'block', role: 'A solid hardwood body with a slot cut into it. Struck on top, its thin wall over the slot and the air inside ring together.', prov: WB_DIMS.len.prov, solid: { kind: 'box', min: v3(c.x - DP / 2, c.y - H / 2, c.z - L / 2), max: v3(c.x + DP / 2, c.y + H / 2, c.z + L / 2) } },
    { id: `wb.slot.${v}`, label: 'the slot (the opening)', short: 'slot', role: 'The opening, here facing the audience. It shapes the block’s hollow ring — a mic is never put into it.', prov: { kind: 'sourced', src: 'PAS-ECV02', quote: 'The opening of the wood block should face towards the audience when possible.' } },
    { id: `wb.mallet.${v}`, label: 'mallet (rubber head)', short: 'mallet', role: 'A rubber, plastic or hard-cord mallet. It strikes just off the middle of the top, toward the opening; its rebound and a missed stroke set the clearance.', moving: true, prov: WB_DIMS.mallet.prov, solid: { kind: 'capsule', a: s.mallet.hand, b: s.mallet.head, r: 15 } },
  ];
  if (v === 'table') {
    const fy = c.y + H / 2;
    out.push({ id: 'wb.foam', label: 'foam pad', short: 'foam', role: 'Space underneath so the block is not muffled: foam, not thick carpet or towels.', prov: { kind: 'sourced', src: 'PAS-ECV02', quote: 'Avoid putting wood blocks on a trap stand with thick carpet or towels' }, solid: { kind: 'box', min: v3(c.x - 50, fy, c.z - 100), max: v3(c.x + 50, fy + WB_DIMS.foamT.mm, c.z + 100) } });
    out.push({ id: 'wb.table', label: 'trap table', short: 'table', role: 'The table the small instruments wait on. It must not rattle when the block is struck.', prov: ill('a trap table at h 900 (drawing default)'), solid: { kind: 'box', min: v3(TABLE.x0, -WB_DIMS.tableH.mm, TABLE.z0), max: v3(TABLE.x1, -WB_DIMS.tableH.mm + 30, TABLE.z1) } });
  }
  return out;
}

function state(s: WbState, label: string, blurb: string, phrase: string): StateSpec {
  const mo = motionOf(s);
  return {
    variant: { id: s.id, label, blurb, phrase },
    parts: parts(s),
    motion: { ...mo, label: 'the mallet’s stroke and rebound', prov: WB_DIMS.mallet.prov },
    arms: [{ id: 'arm.R', label: 'right', arm: s.arm, sweep: 20 }, ...(s.holder ? [{ id: 'arm.L', label: 'left', arm: s.holder, sweep: 0 }] : [])],
    ref: { id: `surf.${s.id}`, partId: `wb.block.${s.id}`, label: 'the playing surface', point: s.spot, normal: v3(0, -1, 0) },
    surfaces: [{ id: `slot.${s.id}`, partId: `wb.block.${s.id}`, label: 'the opening', point: s.slot, normal: v3(1, 0, 0), target: true }],
    regions: [{ id: `r.block.${s.id}`, partId: `wb.block.${s.id}`, label: 'block', anchor: s.c, prov: WB_DIMS.len.prov, note: 'The block and the air in its slot ring together; the opening faces the audience.' }],
  };
}

export const WB_MODEL: InstrumentModel = smallPercModel({
  id: 'woodblock',
  name: 'woodblock',
  states: [
    state(STATES.table, 'ON A TABLE', 'On a foam pad on a trap table, the opening toward the audience: space underneath, so it is not muffled.', 'on a table'),
    state(STATES.held, 'HELD', 'Held in the left palm, the opening toward the audience — the block moves a little and the hand must not choke it.', 'held in the hand'),
  ],
  views: {
    side: { u0: -560, u1: 760, v0: -1700, v1: -640 },
    top: { u0: -560, u1: 760, v0: -560, v1: 560 },
  },
});
