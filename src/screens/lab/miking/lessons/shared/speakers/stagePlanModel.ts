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
 * panel (it ran over the cabinet's top) — to the amp's LINE / DI OUT jack,
 * never its speaker or extension-speaker output (wiring fix MK-01,
 * 2026-10-20; DI_CABLE_JACKS). The organ console, its pedalboard
 * and its bench are ONE assembly (the bench stands over the back of the
 * pedalboard: the organist sits above the pedals, heels on their back ends).
 * STUDIO: no wedges — each performer (the guitarist, and the organist at the
 * bench) has a personal headphone mixer, fed from the CONTROL ROOM at the
 * room's edge (monitoring/cueMix.ts).
 */
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout, LESLIE } from './speakerModel.ts';
import { chairRowFacingStage, frontRowAt } from '../../../../../../features/lab/audienceChairsModel.ts';
import { chairFoots, foot, kitPieceFoots, rectOfCircle, shift, wedgeFoot, type PlanCable, type PlanFoot, type PlanPt, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig } from '../monitoring/cueMix.ts';
import type { In, Out } from './signalChain.ts';

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
  audience: frontRowAt(2850),
} as const;

export const PLAN_BOX = { stage: { u0: -1500, u1: 4750, v0: -2700, v1: 3000 }, studio: { u0: -1400, u1: 3300, v0: -2300, v1: 3000 } } as const;

/** The shared five-piece kit's origin on this stage (its kick's batter head)
 *  and its own centre (kitPlanModel PLAN_BOX.kit): the kit at true size,
 *  upstage, the side fill beside it downstage. */
export const KIT_AT = { u: -400, v: -1770 } as const;
export const KIT_MID = { u: -135, v: 20 } as const;

/** The stage deck's downstage edge (the audience floor beyond). */
export const DECK_EDGE_U = 2850;
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
 *  the combo's back panel: the amp's LINE / DI OUT jack into the DI's input,
 *  never the speaker output (signalChain patchVerdict: speakerOut → diIn is
 *  'stop'). */
export const DI_CABLE_JACKS: { amp: Out; di: In } = { amp: 'lineOut', di: 'diIn' };
export const DI_CABLE: PlanCable = { id: 'diCable', kind: 'instrumentCable', pts: [{ u: POS.di.u + 68, v: POS.di.v - 18 }, { u: CAB.box.x0 + 10, v: 180 }], from: 'dibox', to: 'cab' };

/* The rest of the signal path, end to end (MK-01 drawing, 2026-10-20; D70:
 * every cable its own traceable lane):
 *  - the guitar's INSTRUMENT CORD, from the jack at the guitar's tail (the
 *    strap end): on the floor under the player, out from behind them (inside
 *    their own space), then in its own lane to the amp's INPUT on the front
 *    panel's +v end — clear of the air path (v = 0), of every word, and of
 *    the studio phones cord (which drops from the head above it);
 *  - the DI's XLR out (its upstage end) to the plan's edge: upstage, TO STAGE
 *    BOX (off the plan); in the studio, to the WALL PANEL (the room's tie
 *    lines to the control room), on the upstage wall above the cabinet,
 *    where its words have room. */
export const GUITAR_CORD_JACKS: { guitar: Out; amp: In } = { guitar: 'instrumentOut', amp: 'ampIn' };
/** The guitar's output jack at the tail (PlanInstrumentEdge: the body
 *  118…163 × −128…327, local) and its straight plug, 43 long. */
export const GUITAR_JACK = { u: POS.player.u + 140, v: POS.player.v + 327, plug: 43 } as const;
/** The amp's INPUT jack on the front panel (CAB.box.x1), at its +v end; a
 *  right-angle plug (20 proud of the panel), so the cord can run down the
 *  cabinet's front, clear of the CAB word below it. */
export const AMP_INPUT = { u: CAB.box.x1, v: 215, plug: 20 } as const;
/** The cord's lane outside the player's space. STAGE (drawn turned): beside
 *  the PLAYER and CAB words, then down the cabinet's front into the plug.
 *  STUDIO: straight in at the plug's height (the CAB word sits below the
 *  cabinet, the PLAYER word beside the player). */
export const CORD_LANE: Record<PlanScene, number> = { stage: 560, studio: AMP_INPUT.v };
/** The drawn cord (plan mm): the guitar's plug → a U-turn beside the tail →
 *  on the floor under the torso → out behind the player → its lane → the
 *  amp's plug. */
export function guitarCordDrawn(scene: PlanScene) {
  const plug = { u: AMP_INPUT.u + AMP_INPUT.plug, v: AMP_INPUT.v };
  const v = CORD_LANE[scene];
  const lane = v === plug.v ? [{ u: POS.player.u - PLAYER_SPACE_R, v }, plug] : [{ u: POS.player.u - PLAYER_SPACE_R, v }, { u: plug.u, v }, plug];
  const J = { u: GUITAR_JACK.u, v: GUITAR_JACK.v + GUITAR_JACK.plug };
  return {
    from: J,
    // a U-turn at the plug (seen leaving the jack), back beside the tail…
    turn: [{ u: J.u, v: J.v + 55 }, { u: J.u - 50, v: J.v + 50 }, { u: J.u - 50, v: J.v - 50 }],
    // …then on the floor under the torso (the studio phones cord drops from
    // the head over it there), out behind the player
    under: [{ u: J.u - 50, v: J.v - 190 }, { u: POS.player.u - 50, v: POS.player.v + 150 }, { u: POS.player.u - 150, v: POS.player.v + 230 }],
    lane,
  };
}
/** The cord's run outside the player's space (its start inside the space is the player's own). */
export function guitarCord(scene: PlanScene): PlanCable {
  return { id: 'guitarCord', kind: 'instrumentCable', pts: guitarCordDrawn(scene).lane, from: 'playerSpace', to: 'cab' };
}

export const DI_XLR_JACKS: { di: Out; to: In } = { di: 'diOut', to: 'micIn' };
/** The DI's XLR (local +55…70, turned: its upstage end). */
export const DI_XLR_AT = { u: POS.di.u - 70, v: POS.di.v } as const;
/** The studio's wall panel: on the upstage (u0) wall, above the cabinet. */
export const WALL_PANEL_V = -700;
export function diXlr(scene: PlanScene): PlanCable {
  const pts =
    scene === 'stage'
      ? [DI_XLR_AT, { u: PLAN_BOX.stage.u0, v: DI_XLR_AT.v }]
      : [DI_XLR_AT, { u: -950, v: DI_XLR_AT.v }, { u: -950, v: WALL_PANEL_V }, { u: SPK_ROOM.u0, v: WALL_PANEL_V }];
  return { id: 'diXlr', kind: 'xlr', pts, from: 'dibox' };
}
/** Its far end: the plan's upstage edge (stage) or the wall panel (studio). */
export function diXlrEnd(scene: PlanScene): PlanPt {
  const k = diXlr(scene).pts;
  return k[k.length - 1];
}
/** The off-plan destination's words. */
export const DI_XLR_TO: Record<PlanScene, string> = { stage: 'TO STAGE BOX', studio: 'TO WALL PANEL' };
/** Every cable the plan draws (the studio's headphone cables come from cueMix). */
export function spkCables(scene: PlanScene): PlanCable[] {
  return [DI_CABLE, ...spkPathCables(scene)];
}
/** The MK-01 cables (guitar cord, DI XLR): the plan's words keep clear of
 *  them. (The short DI → amp cable keeps its 10-15 label layout: the DI's
 *  name sits beside it, off its line.) */
export function spkPathCables(scene: PlanScene): PlanCable[] {
  return [guitarCord(scene), diXlr(scene)];
}

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
      { id: 'organist', at: { u: 1650, v: 1700 }, head: POS.bench, facing: Math.PI, alone: true },
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
