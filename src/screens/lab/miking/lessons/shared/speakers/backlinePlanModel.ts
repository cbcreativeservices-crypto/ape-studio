/**
 * The amplified-chain plans' layout (BacklinePlan.tsx draws it) — pure, so
 * the plans' overlap test reads the same numbers the drawing uses.
 *
 * Frame: the miked amp at the origin, u toward the audience (frame C's x),
 * v across the stage (frame C's z), mm. Positions are a typical layout,
 * ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: "the side fill hovers over the floor tom
 * and the ride"): the drum kit keeps its corner upstage; the side fill stands
 * BESIDE it at the stage's side (the lessons' live.wedges); the PA stacks
 * stand on the deck's downstage corners, clear of the front row; the front
 * row keeps a centre aisle (where its name sits). STUDIO (owner 2026-10-15):
 * no wedges — the player's personal headphone mixer at their station, fed
 * from the CONTROL ROOM at the room's edge (monitoring/cueMix.ts).
 */
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout } from './speakerModel.ts';
import { bassHead } from './ampModel.ts';
import { chairRowFacingStage, frontRowAt } from '../../../../../../features/lab/audienceChairsModel.ts';
import { chairFoots, foot, kitPieceFoots, rectAround, rectOfCircle, wedgeFoot, type PlanCable, type PlanFoot } from '../planFoot.ts';
import { cueFootprints, type CueRig } from '../monitoring/cueMix.ts';

export type Backline = 'guitar' | 'bass' | 'steel';
export type BacklineScene = 'stage' | 'studio';

/** The stage deck's downstage edge (the audience floor beyond). */
export const DECK_EDGE_U = 2850;
/** Typical positions (mm, plan u/v), ILLUSTRATIVE. The front row sits
 *  FRONT_ROW_GAP_MM clear of the deck's lip (owner 2026-10-15: an audience
 *  only where one fits — never chairs pressed against the stage). */
export const BACKLINE_POS = {
  // R2-MK-04 (2026-10-21): each DI moved to where its cables run clear — the
  // guitar's and bass's beside the pedalboard's input end, the steel's
  // between its keep-clear zone and the amp side (backlineCables).
  guitar: { player: { u: 950, v: 560 }, pedals: { u: 1380, v: 560 }, di: { u: 1400, v: 1090 } },
  bass: { player: { u: 1050, v: 620 }, pedals: { u: 1480, v: 620 }, di: { u: 1500, v: 1170 } },
  steel: { player: { u: 950, v: 720 }, pedals: { u: 1300, v: 720 }, di: { u: 1200, v: -60 } },
  drums: { u: -350, v: -1550 },
  otherAmp: { u: -60, v: 1750 },
  audience: frontRowAt(DECK_EDGE_U),
} as const;
/** The plan boxes. The stage reaches upstage far enough for the drum kit at
 *  its true size (the art pass of 2026-10-10 drew the real kit, ≈ 1.8 m). */
export const BACKLINE_BOX = { stage: { u0: -1400, u1: 4700, v0: -2600, v1: 2350 }, studio: { u0: -1000, u1: 3100, v0: -2200, v1: 2300 } } as const;
/** Where the shared kit's origin (its kick's batter head) sits on the stage. */
export const KIT_AT = { u: -250, v: -1600 } as const;
/** The kit's own centre (its plan box, kitPlanModel PLAN_BOX.kit). */
export const KIT_MID = { u: -135, v: 20 } as const;
/** The PA stacks: on the deck's downstage corners (their sub 700 deep). */
export const PA_AT = [
  { u: DECK_EDGE_U - 400, v: -1950 },
  { u: DECK_EDGE_U - 400, v: 1950 },
] as const;
/** The front row: chairs either side of a centre aisle (|v| < AISLE). */
export const AISLE = 620;
export const inFrontRow = (c: { y: number }): boolean => Math.abs(c.y) >= AISLE;
export function backlineChairs(): { x: number; y: number; rotation: number }[] {
  return chairRowFacingStage(BACKLINE_POS.audience, -2100, 2100).filter(inFrontRow);
}
/** The studio room's inner wall faces (the room is drawn 40 mm thick). */
export const BACKLINE_ROOM = { u0: -930, u1: 3030, v0: -2130, v1: 2230 } as const;

/** The other amp on the backline: a 2 × 12 combo (690 × 270), facing +u. */
export const OTHER_AMP = { u0: -135, u1: 135, v0: -345, v1: 345 } as const;

/** The player's keep-clear space (the pedalboard, or a steel's pedals). */
export function keepRect(who: Backline) {
  const P = BACKLINE_POS[who];
  return who === 'steel' ? { u0: P.player.u - 80, u1: P.player.u + 520, v0: P.player.v - 520, v1: P.player.v + 520 } : { u0: P.pedals.u - 180, u1: P.pedals.u + 180, v0: P.pedals.v - 260, v1: P.pedals.v + 260 };
}

/** The player's head (FigureHead at the player's centre, facing +u). */
export function backlineHead(who: Backline): { u: number; v: number } {
  return BACKLINE_POS[who].player;
}

/** The studio headphone mix: the player's mixer at their right hand (the
 *  side away from the neck), clear of the pedalboard, fed from the control
 *  room on the room's far (+v) wall. */
export function backlineCue(who: Backline): CueRig {
  const P = BACKLINE_POS[who].player;
  const at = who === 'steel' ? { u: P.u - 430, v: P.v + 830 } : { u: P.u - 120, v: P.v + 560 };
  return {
    room: BACKLINE_ROOM,
    wall: 'v1',
    hubAt: 1500,
    stations: [{ id: 'player', at, head: P, facing: 0 }],
  };
}

/** Every object's footprint on the plan (mm). */
export function backlineFoots(who: Backline, scene: BacklineScene, wedges: readonly Wedge[]): PlanFoot[] {
  const P = BACKLINE_POS[who];
  const c = cabLayout(who === 'bass' ? 'bass410' : 'combo12');
  const out: PlanFoot[] = [foot('amp', 'amp', { u0: c.box.x0, u1: c.box.x1, v0: c.box.z0, v1: c.box.z1 })];
  if (who === 'bass') {
    const hd = bassHead();
    out.push(foot('ampHead', 'ampHead', { u0: hd.x0, u1: hd.x1, v0: hd.z0, v1: hd.z1 }));
  }
  out.push(foot('otherAmp', 'amp', { u0: BACKLINE_POS.otherAmp.u + OTHER_AMP.u0, u1: BACKLINE_POS.otherAmp.u + OTHER_AMP.u1, v0: BACKLINE_POS.otherAmp.v + OTHER_AMP.v0, v1: BACKLINE_POS.otherAmp.v + OTHER_AMP.v1 }));
  // the player (shoulders, arms) and the worn instrument, edge-on
  const g = `player:${who}`;
  if (who === 'steel') {
    out.push(foot('player', 'player', { u0: P.player.u - 130, u1: P.player.u + 500, v0: P.player.v - 300, v1: P.player.v + 300 }, { group: g }));
    out.push(foot('steel', 'instrument', { u0: P.player.u + 160, u1: P.player.u + 480, v0: P.player.v - 450, v1: P.player.v + 450 }, { group: g }));
  } else {
    out.push(foot('player', 'player', { u0: P.player.u - 130, u1: P.player.u + 270, v0: P.player.v - 300, v1: P.player.v + 300 }, { group: g }));
    const bass = who === 'bass';
    out.push(foot('instrument', 'instrument', { u0: P.player.u + 118, u1: P.player.u + 165, v0: P.player.v + (bass ? -810 : -663), v1: P.player.v + (bass ? 350 : 327) }, { group: g }));
    out.push(foot('pedals', 'pedalboard', { u0: P.pedals.u - 165, u1: P.pedals.u + 165, v0: P.pedals.v - 250, v1: P.pedals.v + 250 }, { group: g }));
  }
  out.push(foot('keepClear', 'keepClear', keepRect(who), { group: g, zone: true }));
  // The DI box stands turned a quarter (DI_TURN): 84 across u, 140 along v.
  out.push(foot('dibox', 'dibox', { u0: P.di.u - 42, u1: P.di.u + 42, v0: P.di.v - 70, v1: P.di.v + 70 }));
  if (scene === 'stage') {
    out.push(...kitPieceFoots(KIT_AT));
    for (const w of wedges) if (w.glyph !== 'none') out.push(wedgeFoot(w));
    PA_AT.forEach((p, i) => out.push(foot(`pa${i}`, 'pa', { u0: p.u - 350, u1: p.u + 350, v0: p.v - 280, v1: p.v + 280 })));
    out.push(...chairFoots(backlineChairs()));
  } else {
    out.push(...cueFootprints(backlineCue(who)));
  }
  void rectAround;
  void rectOfCircle;
  return out;
}

/* ── R2-MK-04 (2026-10-21): THE CABLES, so the plan shows the lesson's point —
 * a DI BEFORE the amp (its own electrical source), not the amp's direct out.
 * GUITAR / BASS (the chain the lesson's signal path draws, DiPath): the
 *   instrument (its tail jack) → the DI's INPUT; the DI's THRU → the
 *   pedalboard's input (its +v end); the pedalboard's output (its −v end) →
 *   upstage of the instrument's head → the amp's INPUT on its front panel
 *   (the bass head's, on top of the cabinet); the DI's XLR → TO STAGE BOX
 *   (upstage, off the plan) / TO WALL PANEL (studio, the far wall).
 * STEEL ("a DI or splitter before the amp"): the steel's own run (pickup →
 *   volume pedal, inside its keep-clear zone — the player's own, not drawn)
 *   leaves the zone → the DI's INPUT; the THRU → the amp's INPUT; the XLR
 *   upstage → TO STAGE BOX / the near wall's panel.
 * Each cable its own lane: none crosses another, none runs through an object
 * or the keep-clear zone (a cable that starts or ends at the pedalboard or the
 * steel's run names the zone as its own end), none crosses the studio's
 * headphone cords. The DI box is drawn turned a quarter: its two jacks on one
 * end, its XLR (male) on the other. */
export const DI_TURN: Record<Backline, number> = { guitar: Math.PI / 2, bass: Math.PI / 2, steel: -Math.PI / 2 };
/** The DI's jacks (in, thru) and its XLR, on the plan (mm): the drawn box is
 *  110 × 84 with the jacks 13 proud at one end, the XLR 15 at the other. */
export function diJacks(who: Backline): { input: { u: number; v: number }; thru: { u: number; v: number }; xlr: { u: number; v: number } } {
  const d = BACKLINE_POS[who].di;
  // guitar / bass: the jacks toward −v (the pedalboard), the XLR toward +v;
  // the steel: the jacks toward +v (its zone), the XLR toward −v.
  return who === 'steel'
    ? { input: { u: d.u + 18, v: d.v + 68 }, thru: { u: d.u - 18, v: d.v + 68 }, xlr: { u: d.u, v: d.v - 70 } }
    : { input: { u: d.u - 18, v: d.v - 68 }, thru: { u: d.u + 18, v: d.v - 68 }, xlr: { u: d.u, v: d.v + 70 } };
}
/** The off-plan destination of the DI's XLR. */
export const BACKLINE_XLR_TO: Record<BacklineScene, string> = { stage: 'TO STAGE BOX', studio: 'TO WALL PANEL' };
/** The amp's INPUT on its front panel (the bass: the head's), at the panel's −v end. */
export function ampInput(who: Backline): { u: number; v: number } {
  if (who === 'bass') return { u: bassHead().x1, v: -300 };
  if (who === 'steel') return { u: cabLayout('combo12').box.x1, v: 90 };
  return { u: cabLayout('combo12').box.x1, v: -300 };
}
export function backlineCables(who: Backline, scene: BacklineScene): PlanCable[] {
  const P = BACKLINE_POS[who];
  const J = diJacks(who);
  const A = ampInput(who);
  const K = keepRect(who);
  if (who === 'steel') {
    const xlr =
      scene === 'stage'
        ? [J.xlr, { u: J.xlr.u, v: -500 }, { u: BACKLINE_BOX.stage.u0, v: -500 }]
        : [J.xlr, { u: J.xlr.u, v: BACKLINE_ROOM.v0 }];
    return [
      { id: 'steelOut', kind: 'instrumentCable', pts: [{ u: J.input.u, v: K.v0 }, J.input], from: 'keepClear', to: 'dibox' },
      { id: 'diThru', kind: 'instrumentCable', pts: [J.thru, { u: J.thru.u, v: A.v }, A], from: 'dibox', to: 'amp' },
      { id: 'diXlr', kind: 'xlr', pts: xlr, from: 'dibox' },
    ];
  }
  const bass = who === 'bass';
  // the instrument's tail jack (PlanInstrumentEdge: the body's +v end, its face at u + 140)
  const tail = { u: P.player.u + 140, v: P.player.v + (bass ? 350 : 327) };
  const cordV = tail.v + 70;
  const xlrV = J.xlr.v + (bass ? 60 : 90);
  const xlr =
    scene === 'stage'
      ? [J.xlr, { u: J.xlr.u, v: xlrV }, { u: BACKLINE_BOX.stage.u0, v: xlrV }]
      : [J.xlr, { u: J.xlr.u, v: xlrV }, { u: BACKLINE_ROOM.u1, v: xlrV }];
  return [
    { id: 'instrumentCord', kind: 'instrumentCable', pts: [tail, { u: tail.u, v: cordV }, { u: J.input.u, v: cordV }, J.input], from: 'instrument', to: 'dibox' },
    { id: 'diThru', kind: 'instrumentCable', pts: [J.thru, { u: J.thru.u, v: K.v1 - 10 }], from: 'dibox', to: 'keepClear' },
    { id: 'pedalsOut', kind: 'instrumentCable', pts: [{ u: P.pedals.u, v: K.v0 + 10 }, { u: P.pedals.u, v: A.v }, A], from: 'keepClear', to: 'amp' },
    { id: 'diXlr', kind: 'xlr', pts: xlr, from: 'dibox' },
  ];
}

/** Item ids on the plan and where each sits (taps and highlights). */
export function backlineItems(who: Backline, scene: BacklineScene, wedges: readonly Wedge[]): { id: string; u: number; v: number; r: number }[] {
  const P = BACKLINE_POS[who];
  const out = [
    { id: 'amp', u: -100, v: 0, r: 420 },
    { id: 'player', u: P.player.u, v: P.player.v, r: 300 },
    { id: 'pedals', u: P.pedals.u, v: P.pedals.v, r: who === 'steel' ? 420 : 260 },
    { id: 'dibox', u: P.di.u, v: P.di.v, r: 160 },
    { id: 'otherAmp', u: BACKLINE_POS.otherAmp.u, v: BACKLINE_POS.otherAmp.v, r: 420 },
  ];
  if (scene === 'stage') {
    out.push({ id: 'drums', u: KIT_AT.u + KIT_MID.u, v: KIT_AT.v + KIT_MID.v, r: 900 });
    for (const w of wedges) out.push({ id: w.id === wedges[0].id ? 'wedge' : w.id, u: w.p.x, v: w.p.z, r: 330 });
    out.push({ id: 'audience', u: BACKLINE_POS.audience + 150, v: 0, r: 700 });
  } else out.push({ id: 'room', u: 2500, v: -1700, r: 500 });
  return out;
}
