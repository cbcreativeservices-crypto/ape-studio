/**
 * C12 CLAVINET — the setting page's plans (PStagePlan draws them), pure so
 * the plans' overlap test reads the same numbers (planCases/pstage.ts).
 *
 * Frame C from above: u = x toward the audience, v = z. The amp behind the
 * keyboardist at the origin, the clavinet in front of them (ampSpec LAYOUT).
 * Positions are ILLUSTRATIVE (a typical layout).
 *
 * Collision pass 2026-10-15: the band's riser starts beyond the band's
 * wedge (the wedge stood on it) and stays inside the plan (it ran off the
 * bottom). STUDIO: the DI box drawn on the floor, in the line from the
 * pedals to the amp; the room mic on its stand (it was drawn as a music
 * stand); no wedges — the keyboardist's personal headphone mixer at their
 * left, away from the keys and the pedals, fed from the CONTROL ROOM on the
 * room's upstage wall.
 */
import type { VariantId, ViewBox } from '../../engine/model/types.ts';
import { foot, type PlanFoot } from '../shared/planFoot.ts';
import { cueFootprints, type CueRig } from '../shared/monitoring/cueMix.ts';
import { roomOfBox, stringPlanFoots, type PlanScene, type PlanSpot } from '../shared/strings/pstagePlanModel.ts';
import { ampBox, LAYOUT } from './ampSpec.ts';

export const CLAV_NEAR: ViewBox = { u0: -500, u1: 2000, v0: -1700, v1: 500 };
export const CLAV_WIDE: ViewBox = { u0: -1150, u1: 3600, v0: -2000, v1: 2600 };
/** The stage's wide plan reaches past the deck's edge for the AUDIENCE word. */
export const CLAV_WIDE_STAGE: ViewBox = { ...CLAV_WIDE, u1: 3930 };
export const CLAV_ROOM = roomOfBox(CLAV_WIDE);
/** The stage's downstage edge (dashed) just in front of the PA pair; the
 *  house beyond it is an off-plan direction (owner 2026-10-15). Drawn turned
 *  (DOWNSTAGE = BOTTOM, owner 2026-10-16): the word centred below the edge. */
export const CLAV_AUDIENCE = { text: 'AUDIENCE ↓', u: 3650, v: 300, align: 'center' as const, lip: { axis: 'u' as const, at: 3410 } };

export const clavAmpBox = (v: VariantId) => ampBox(v === 'cab' ? 'cab' : 'combo');

/** The keyboardist from above (ClavinetPlan): the body oval, the arms out
 *  to the keys; the head 10 in front of the body's centre. */
export const KEYS_PLAYER = {
  body: { u0: LAYOUT.player.x - 140, u1: LAYOUT.player.x + 140, v0: LAYOUT.player.z - 240, v1: LAYOUT.player.z + 240 },
  arms: { u0: LAYOUT.player.x + 40, u1: LAYOUT.player.x + 300, v0: LAYOUT.player.z - 245, v1: LAYOUT.player.z + 245 },
  head: { u: LAYOUT.player.x + 10, v: LAYOUT.player.z },
};
/** The three pedals (ClavinetPlan: 110 × 130 at 150 pitch). */
export const CLAV_PEDALS = { u0: LAYOUT.pedals.x - 60, u1: LAYOUT.pedals.x + 50, v0: LAYOUT.pedals.z - 60, v1: LAYOUT.pedals.z + 370 };

/** The DI (studio): on the floor, in the line from the pedals to the amp —
 *  the instrument cable's point at t = 0.4 (ClavinetPlan's cable). */
export const CLAV_DI = { u: 645, v: 117 };

export const CLAV_SPOTS: PlanSpot[] = [
  { item: 'clav', glyph: 'none', x: (LAYOUT.clav.x0 + LAYOUT.clav.x1) / 2, z: LAYOUT.clav.z0, scene: 'all', r: 420, label: { du: 0, dv: -120 } },
  { item: 'pedals', glyph: 'none', x: LAYOUT.pedals.x, z: LAYOUT.pedals.z + 160, scene: 'near', r: 220, label: { du: -320, dv: 0 } },
  // the lesson's live.wedges positions (the Studio-or-live page)
  { item: 'wedge.keys', glyph: 'wedge', x: 2100, z: -1400, faces: { x: -1, z: 0 }, scene: 'stage', r: 330, label: { du: 0, dv: 420 } },
  { item: 'wedge.band', glyph: 'wedge', x: -600, z: 1100, faces: { x: 0, z: 1 }, scene: 'stage', r: 330, label: { du: 0, dv: -400 } },
  // the other players, on the riser the band's wedge faces
  { item: 'band', glyph: 'band', x: -150, z: 1950, half: { u: 950, v: 550 }, scene: 'stage', r: 450 },
  // the PA pair on the deck's downstage corners, facing the audience
  { item: 'pa', glyph: 'pa', x: 3150, z: -1600, faces: { x: 1, z: 0 }, scene: 'stage', r: 380, label: { du: 0, dv: 450 } },
  { item: 'pa.2', glyph: 'pa', x: 3150, z: 2200, faces: { x: 1, z: 0 }, scene: 'stage', r: 0, text: 'PA', label: { du: 0, dv: -450 } },
  { item: 'di', glyph: 'di', x: CLAV_DI.u, z: CLAV_DI.v, scene: 'studio', r: 240 },
  { item: 'room', glyph: 'mic', x: 1500, z: 900, faces: { x: -1, z: -0.6 }, scene: 'studio', r: 300, label: { du: 0, dv: 380 } },
];

/** The keyboardist, the clavinet and the pedals: one station; the amp is
 *  its own object. */
export function clavOwnFoots(v: VariantId): PlanFoot[] {
  const b = clavAmpBox(v);
  const g = 'keys';
  return [
    foot('amp', 'amp', { u0: b.x0, u1: b.x1, v0: b.z0, v1: b.z1 }),
    foot('clav', 'instrument', { u0: LAYOUT.clav.x0, u1: LAYOUT.clav.x1, v0: LAYOUT.clav.z0, v1: LAYOUT.clav.z1 }, { group: g }),
    foot('keys:body', 'player', KEYS_PLAYER.body, { group: g }),
    foot('keys:arms', 'player', KEYS_PLAYER.arms, { group: g }),
    foot('pedals', 'pedalboard', CLAV_PEDALS, { group: g }),
  ];
}

/** STUDIO: the keyboardist's mixer at their left, behind the keys; its feed
 *  runs to the CONTROL ROOM box on the upstage wall. */
export function clavCue(): CueRig {
  return { room: CLAV_ROOM, wall: 'v0', hubAt: 300, stations: [{ id: 'keys', at: { u: 800, v: -1450 }, head: KEYS_PLAYER.head, facing: 0 }] };
}

export function clavPlanFoots(v: VariantId, scene: PlanScene): PlanFoot[] {
  return stringPlanFoots(clavOwnFoots(v), CLAV_SPOTS, scene, cueFootprints(clavCue()));
}
