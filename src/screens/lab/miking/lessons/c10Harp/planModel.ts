/**
 * C10 HARP — the setting page's plans (PStagePlan draws them), pure so the
 * plans' overlap test reads the same numbers (planCases/pstage.ts).
 *
 * Frame H from above: u = x toward the audience, v = z the harpist's right.
 * Positions are ILLUSTRATIVE (a typical layout).
 *
 * Collision pass 2026-10-15: the band's riser stands upstage of the harp,
 * inside the plan and clear of the other player's wedge (it ran off the
 * plan's top and under that wedge); the wedges are the shared 2-way wedge
 * at true size. STUDIO: no wedges — the harpist's personal headphone mixer
 * at their left (away from the strings and the neck), fed from the CONTROL
 * ROOM on the room's upstage wall.
 */
import type { VariantId, ViewBox } from '../../engine/model/types.ts';
import { foot, type PlanFoot } from '../shared/planFoot.ts';
import { cueFootprints, type CueRig } from '../shared/monitoring/cueMix.ts';
import { roomOfBox, stringPlanFoots, type PlanScene, type PlanSpot } from '../shared/strings/pstagePlanModel.ts';
import { harpGeom, harpistAt } from './harpSpec.ts';

const isLever = (v: VariantId) => v === 'lever';

export const HARP_NEAR = (v: VariantId): ViewBox => (isLever(v) ? { u0: -1250, u1: 900, v0: -950, v1: 750 } : { u0: -1350, u1: 1150, v0: -1050, v1: 800 });
export const HARP_WIDE: ViewBox = { u0: -1700, u1: 3700, v0: -2500, v1: 1300 };
/** The stage's wide plan reaches past the deck's edge for the AUDIENCE word. */
export const HARP_WIDE_STAGE: ViewBox = { ...HARP_WIDE, u1: 3780 };
export const HARP_ROOM = roomOfBox(HARP_WIDE);
/** The stage's downstage edge (dashed) just in front of the PA pair, and
 *  the way to the house beyond it — an off-plan direction (owner
 *  2026-10-15: an audience is marked only where one fits). The plan is drawn
 *  turned (DOWNSTAGE = BOTTOM, owner 2026-10-16): the word sits centred
 *  below the edge, its arrow down. */
export const HARP_AUDIENCE = { text: 'AUDIENCE ↓', u: 3500, v: -600, align: 'center' as const, lip: { axis: 'u' as const, at: 3260 } };

/** The harp's own plan box (the soundbox top to the base's front, the
 *  base's width); `pad` widens it (the tap target). */
export function harpBox(v: VariantId, pad = 0) {
  const g = harpGeom(isLever(v));
  return { u0: Math.min(g.b1[0], g.backAt(1)[0]) - pad, u1: g.base.x1 + pad, v0: -g.base.hw - pad, v1: g.base.hw + pad };
}

/** The harpist's head (HarpistPlan: the neck 10 behind the head's x, the
 *  head 18 behind the neck) and the plan footprint of the seated harpist —
 *  the seat, the shoulders (±188 round the neck), the hands at the strings,
 *  the knees and feet toward the pedals. */
export function harpistHead() {
  const h = harpistAt();
  return { u: h.head.x - 10 - 18, v: h.head.z };
}

export function harpSpots(v: VariantId): PlanSpot[] {
  const g = harpGeom(isLever(v));
  return [
    { item: 'chair', glyph: 'none', x: -780, z: 0, scene: 'all', r: 330, label: { du: -200, dv: 520 } },
    { item: 'stand', glyph: 'stand', x: g.crown.c[0] + 450, z: -650, faces: { x: -1, z: 0.3 }, scene: 'near', r: 220, label: { du: 0, dv: -330 } },
    { item: 'wedge.harp', glyph: 'wedge', x: 1300, z: 250, faces: { x: -1, z: 0 }, scene: 'stage', r: 330, label: { du: 0, dv: 420 } },
    { item: 'wedge.other', glyph: 'wedge', x: 1700, z: -1300, faces: { x: -0.8, z: -0.6 }, scene: 'stage', r: 330, label: { du: 0, dv: 420 } },
    // upstage, where the other player's wedge faces; inside the plan
    { item: 'band', glyph: 'band', x: 300, z: -1930, half: { u: 950, v: 520 }, scene: 'stage', r: 650 },
    // the PA pair on the deck's downstage corners, facing the audience
    { item: 'pa', glyph: 'pa', x: 3000, z: 900, faces: { x: 1, z: 0 }, scene: 'stage', r: 380 },
    { item: 'pa.2', glyph: 'pa', x: 3000, z: -2100, faces: { x: 1, z: 0 }, scene: 'stage', r: 0, text: 'PA', label: { du: 0, dv: 420 } },
    { item: 'pair', glyph: 'pair', x: g.boardAt(0.5)[0] + 2200, z: 300, faces: { x: -1, z: 0 }, scene: 'studio', r: 320 },
    { item: 'room', glyph: 'none', x: 2900, z: -1700, scene: 'studio', r: 500, label: { du: 0, dv: 0 } },
  ];
}

/** The harp and the harpist: one assembly (the soundbox rests on the
 *  harpist's right shoulder). */
export function harpOwnFoots(v: VariantId): PlanFoot[] {
  const h = harpistAt();
  return [
    foot('harp', 'instrument', harpBox(v), { group: 'harpist' }),
    foot('harpist', 'player', { u0: h.seat.x0, u1: -290, v0: h.head.z - 190, v1: h.seat.hw }, { group: 'harpist' }),
  ];
}

/** STUDIO: the harpist's headphone mixer at their left, behind the hands;
 *  its feed drops straight to the CONTROL ROOM box on the upstage wall. */
export function harpCue(): CueRig {
  const at = { u: -750, v: -700 };
  return { room: HARP_ROOM, wall: 'v0', hubAt: at.u, stations: [{ id: 'harpist', at, head: harpistHead(), facing: 0 }] };
}

export function harpPlanFoots(v: VariantId, scene: PlanScene): PlanFoot[] {
  return stringPlanFoots(harpOwnFoots(v), harpSpots(v), scene, cueFootprints(harpCue()));
}
