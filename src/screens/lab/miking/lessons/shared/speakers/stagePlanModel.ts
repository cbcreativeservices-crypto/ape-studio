/**
 * The speaker module's stage / studio plan layout (StagePlan.tsx draws it) —
 * pure, so the plans' overlap test (test/mikingPlanCollisions_20261015)
 * reads the same numbers the drawing uses.
 *
 * Plan coordinates: u = toward the audience (right on screen), v = across the
 * stage; the guitar cabinet's speaker at (0, 0) — frame C's x and z.
 * Positions are a typical layout, ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * ANY plan): the PA stacks stand on the deck's downstage corners, clear of
 * the front row; the front row keeps a centre aisle (where its name sits);
 * the DI box sits on the floor behind the combo, its cable to the amp's back
 * panel (it ran over the cabinet's top). The organ console, its pedalboard
 * and its bench are ONE assembly (the bench stands over the back of the
 * pedalboard: the organist sits above the pedals, heels on their back ends).
 * STUDIO: no wedges — each performer (the guitarist, and the organist at the
 * bench) has a personal headphone mixer, fed from the CONTROL ROOM at the
 * room's edge (monitoring/cueMix.ts).
 */
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout, LESLIE } from './speakerModel.ts';
import { chairRowFacingStage } from '../../../../../../features/lab/audienceChairsModel.ts';
import { chairFoots, foot, kitPieceFoots, rectOfCircle, shift, wedgeFoot, type PlanCable, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig } from '../monitoring/cueMix.ts';

export type PlanScene = 'stage' | 'studio';

export const CAB = cabLayout('1x12');

/** Typical positions (mm), ILLUSTRATIVE. */
export const POS = {
  player: { u: 1050, v: 120 },
  /** On the floor behind the combo, its jacks toward the amp's back panel. */
  di: { u: -560, v: 330 },
  organ: { u: 500, v: 1850 },
  bench: { u: 1050, v: 1850 },
  leslie: { u: -150, v: 2450 },
  audience: 3300,
} as const;

export const PLAN_BOX = { stage: { u0: -1500, u1: 3750, v0: -2700, v1: 3000 }, studio: { u0: -1400, u1: 3300, v0: -2300, v1: 3000 } } as const;

/** The shared five-piece kit's origin on this stage (its kick's batter head)
 *  and its own centre (kitPlanModel PLAN_BOX.kit): the kit at true size,
 *  upstage, the side fill beside it downstage. */
export const KIT_AT = { u: -400, v: -1770 } as const;
export const KIT_MID = { u: -135, v: 20 } as const;

/** The stage deck's downstage edge (the audience floor beyond). */
export const DECK_EDGE_U = POS.audience - 450;
/** The PA stacks: on the deck's downstage corners (their sub 700 deep). */
export const PA_AT = [
  { u: DECK_EDGE_U - 400, v: PLAN_BOX.stage.v0 + 330 },
  { u: DECK_EDGE_U - 400, v: PLAN_BOX.stage.v1 - 330 },
] as const;
/** The front row: chairs either side of a centre aisle (|v| ≥ AISLE). */
export const CHAIR_ROW = { u: POS.audience, v0: -2400, v1: 2400 } as const;
export const AISLE = 800;
export const inAisle = (c: { y: number }) => Math.abs(c.y) >= AISLE;
export function spkChairs(): { x: number; y: number; rotation: number }[] {
  return chairRowFacingStage(CHAIR_ROW.u, CHAIR_ROW.v0, CHAIR_ROW.v1).filter(inAisle);
}

/** The studio room: drawn as a rounded rect with a 60 mm wall stroke; these
 *  are its inner faces. */
export const ROOM_DRAWN = { u0: -1300, v0: -2200, u1: 3200, v1: 2900 } as const;
export const SPK_ROOM: PlanRect = { u0: ROOM_DRAWN.u0 + 30, u1: ROOM_DRAWN.u1 - 30, v0: ROOM_DRAWN.v0 + 30, v1: ROOM_DRAWN.v1 - 30 };

/* The organ console, its pedalboard and the bench (local, keys toward +u,
 * where the organist sits): the console 1245 wide with its key cheeks to
 * 250, the 25-note pedalboard frame in front of it, the bench 1100 × 380. */
export const ORGAN = {
  console: { u0: -260, u1: 250, v0: -622, v1: 622 },
  pedals: { u0: 240, u1: 560, v0: -510, v1: 510 },
  bench: { u0: -190, u1: 190, v0: -550, v1: 550 },
} as const;
/** The rotary cabinet from above (front toward +u), its top moulding 9 proud. */
export const LESLIE_TOP = { hu: LESLIE.d.mm / 2 + 9, hv: LESLIE.w.mm / 2 + 9 } as const;
/** The guitarist's space (a circle) and the organist's (round the console,
 *  the pedals and the bench): keep clear. */
export const PLAYER_SPACE_R = 520;
export const ORGAN_SPACE = { u0: POS.organ.u - 300, u1: POS.bench.u + 420, v0: POS.organ.v - 720, v1: POS.organ.v + 720 } as const;

/** The DI box's jack end (rotated: jacks toward the amp) and its cable to
 *  the combo's back panel. */
export const DI_CABLE: PlanCable = { id: 'diCable', kind: 'instrumentCable', pts: [{ u: POS.di.u + 68, v: POS.di.v - 18 }, { u: CAB.box.x0 + 10, v: 180 }], from: 'dibox', to: 'cab' };

/** The studio headphone mix: the guitarist's mixer at the right hand (the
 *  side away from the neck), just outside their space; the organist's beside
 *  and behind the bench, outside the organ's space; both fed from the
 *  control room on the room's audience-side (+u) wall. */
export function spkCue(): CueRig {
  return {
    room: SPK_ROOM,
    wall: 'u1',
    hubAt: 1250,
    stations: [
      { id: 'guitarist', at: { u: 1000, v: 830 }, head: POS.player, facing: 0 },
      // no figure on the bench: the phones rest on the seat; the organist faces the console (−u)
      { id: 'organist', at: { u: 1650, v: 1700 }, head: POS.bench, facing: Math.PI },
    ],
  };
}

/** Every object's footprint on the plan (mm). */
export function spkFoots(scene: PlanScene, wedges: readonly Wedge[]): PlanFoot[] {
  const P = POS.player;
  const out: PlanFoot[] = [foot('cab', 'amp', { u0: CAB.box.x0, u1: CAB.box.x1, v0: CAB.box.z0, v1: CAB.box.z1 })];
  out.push(foot('dibox', 'dibox', { u0: POS.di.u - 70, u1: POS.di.u + 70, v0: POS.di.v - 42, v1: POS.di.v + 42 }));
  // the guitarist (shoulders, arms) and the guitar worn edge-on (BacklinePlan's figure)
  const g = 'player:guitarist';
  out.push(foot('player', 'player', { u0: P.u - 130, u1: P.u + 270, v0: P.v - 300, v1: P.v + 300 }, { group: g }));
  out.push(foot('instrument', 'instrument', { u0: P.u + 118, u1: P.u + 165, v0: P.v - 663, v1: P.v + 327 }, { group: g }));
  out.push(foot('playerSpace', 'keepClear', rectOfCircle(P, PLAYER_SPACE_R), { group: g, zone: true }));
  // the organ: console, pedalboard and bench — one assembly
  const o = 'organ';
  out.push(foot('organ', 'organ', shift(ORGAN.console, POS.organ.u, POS.organ.v), { group: o }));
  out.push(foot('organPedals', 'pedalboard', shift(ORGAN.pedals, POS.organ.u, POS.organ.v), { group: o }));
  out.push(foot('bench', 'bench', shift(ORGAN.bench, POS.bench.u, POS.bench.v), { group: o }));
  out.push(foot('organSpace', 'keepClear', ORGAN_SPACE, { group: o, zone: true }));
  out.push(foot('leslie', 'rotaryCab', { u0: POS.leslie.u - LESLIE_TOP.hu, u1: POS.leslie.u + LESLIE_TOP.hu, v0: POS.leslie.v - LESLIE_TOP.hv, v1: POS.leslie.v + LESLIE_TOP.hv }));
  if (scene === 'stage') {
    out.push(...kitPieceFoots(KIT_AT));
    for (const w of wedges) out.push(wedgeFoot(w));
    PA_AT.forEach((p, i) => out.push(foot(`pa${i}`, 'pa', { u0: p.u - 350, u1: p.u + 350, v0: p.v - 280, v1: p.v + 280 })));
    out.push(...chairFoots(spkChairs()));
  } else {
    out.push(...cueFootprints(spkCue()));
  }
  return out;
}

/** Item ids the plan carries, and where each sits (for taps and highlights). */
export function planItems(scene: PlanScene, wedges: readonly Wedge[]): { id: string; u: number; v: number; r: number }[] {
  const out = [
    { id: 'cab', u: (CAB.box.x0 + CAB.box.x1) / 2, v: 0, r: 330 },
    { id: 'player', u: POS.player.u, v: POS.player.v, r: 280 },
    { id: 'di', u: POS.di.u, v: POS.di.v, r: 150 },
    { id: 'organ', u: (POS.organ.u + POS.bench.u) / 2, v: POS.organ.v, r: 650 },
    { id: 'leslie', u: POS.leslie.u, v: POS.leslie.v, r: 420 },
  ];
  if (scene === 'stage') {
    out.push({ id: 'drums', u: KIT_AT.u + KIT_MID.u, v: KIT_AT.v + KIT_MID.v, r: 900 });
    for (const w of wedges) out.push({ id: w.id === 'guitarWedge' ? 'wedge' : w.id, u: w.p.x, v: w.p.z, r: 330 });
    out.push({ id: 'audience', u: POS.audience + 150, v: 0, r: 700 });
  } else {
    out.push({ id: 'room', u: 2600, v: -1700, r: 600 });
  }
  return out;
}

/** The footprint ids each plan item names (its label keeps clear of them). */
export function spkItemFootIds(id: string, wedges: readonly Wedge[]): string[] {
  if (id === 'player') return ['player', 'instrument'];
  if (id === 'di') return ['dibox'];
  if (id === 'organ') return ['organ', 'organPedals', 'bench'];
  if (id === 'wedge') return [wedges.find((w) => w.id === 'guitarWedge')?.id ?? 'guitarWedge'];
  return [id];
}
