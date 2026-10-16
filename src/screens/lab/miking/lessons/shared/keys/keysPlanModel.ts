/**
 * The electric pianos' stage / studio plan layout (KeysPlan.tsx draws it) —
 * pure, so the plans' overlap test (test/mikingPlanCollisions_20261015)
 * reads the same numbers the drawing uses.
 *
 *   tine piano   u = x, v = z of the combo's frame C — the combo at the
 *                origin facing the audience, the keyboard 1500 mm to its side
 *                (a drawing default), the player seated behind it
 *   reed piano   u = −x, v = z of frame W — the instrument at the origin, its
 *                speakers facing the PLAYER, who sits on the stage side and
 *                faces the audience over it
 *
 * Positions are a typical layout, ILLUSTRATIVE (never a measurement).
 *
 * Collision pass 2026-10-15 (owner: no collisions or impossible layering in
 * ANY plan): the drum kit is the shared five-piece kit at true size (it was
 * seven loose circles), upstage clear of the side fill; the other amp is the
 * shared 2 × 12 combo, inside the studio walls and clear of the kit; the PA
 * stacks stand on the deck's downstage corners, clear of the front row,
 * which keeps a centre aisle (where its name sits). The tine piano's sustain
 * pedal stands on the floor under the front of the keybed at the player's
 * foot — the keyboard stands over it on its legs (one assembly with the
 * player, the bench and the keyboard), so only its heel end shows in front
 * of the keys. STUDIO: no wedges — the keyboard player's personal headphone
 * mixer at their left (away from the sustain pedal), fed from the CONTROL
 * ROOM at the room's edge (monitoring/cueMix.ts).
 */
import type { Wedge } from '../../../engine/model/types.ts';
import { cabLayout } from '../speakers/speakerModel.ts';
import { OTHER_AMP } from '../speakers/backlinePlanModel.ts';
import { RHODES, WURLI } from './keysSpec.ts';
import { W } from './wurliModel.ts';
import { chairRowFacingStage } from '../../../../../../features/lab/audienceChairsModel.ts';
import { chairFoots, foot, kitPieceFoots, wedgeFoot, type PlanFoot, type PlanRect } from '../planFoot.ts';
import { cueFootprints, type CueRig } from '../monitoring/cueMix.ts';

export type KeysRig = 'rhodes' | 'wurli';
export type KeysScene = 'stage' | 'studio';

export { OTHER_AMP };

/** Typical positions (mm, plan u/v), ILLUSTRATIVE. */
export const SIDE = RHODES.sideBySide.mm;
export const KEYS_POS = {
  rhodes: {
    keyboard: { u: 560, v: SIDE },
    player: { u: 40, v: SIDE },
    /** On the floor under the front of the keybed, at the right foot. */
    pedal: { u: 250, v: SIDE + 110 },
    di: { u: 150, v: SIDE + 720 },
    otherAmp: { u: -60, v: -820 },
  },
  wurli: {
    player: { u: -620, v: 0 },
    pedal: { u: -230, v: 100 },
    di: { u: 250, v: -820 },
    otherAmp: { u: -1000, v: 1100 },
  },
  audience: 3300,
} as const;
/** Where the shared kit's origin (its kick's batter head) sits on each stage,
 *  and the kit's own centre (kitPlanModel PLAN_BOX.kit). */
export const KEYS_KIT_AT = { rhodes: { u: -350, v: -2150 }, wurli: { u: -1300, v: -2250 } } as const;
export const KIT_MID = { u: -135, v: 20 } as const;

export const KEYS_BOX = {
  rhodes: { stage: { u0: -1600, u1: 3650, v0: -3150, v1: 2550 }, studio: { u0: -900, u1: 2900, v0: -1300, v1: 2600 } },
  wurli: { stage: { u0: -2550, u1: 3650, v0: -3250, v1: 2300 }, studio: { u0: -1700, u1: 2600, v0: -1800, v1: 1800 } },
} as const;

/** The studio room as drawn (inset 50 from the box, a 40 mm wall stroke)
 *  and its inner wall faces. */
export function keysRoomDrawn(rig: KeysRig): PlanRect {
  const B = KEYS_BOX[rig].studio;
  return { u0: B.u0 + 50, u1: B.u1 - 50, v0: B.v0 + 50, v1: B.v1 - 50 };
}
export function keysRoom(rig: KeysRig): PlanRect {
  const r = keysRoomDrawn(rig);
  return { u0: r.u0 + 20, u1: r.u1 - 20, v0: r.v0 + 20, v1: r.v1 - 20 };
}

/** The stage deck's downstage edge (the audience floor beyond). */
export const DECK_EDGE_U = KEYS_POS.audience - 450;
/** The PA stacks: on the deck's downstage corners (their sub 700 deep). */
export function keysPaAt(rig: KeysRig): { u: number; v: number }[] {
  const B = KEYS_BOX[rig].stage;
  return [
    { u: DECK_EDGE_U - 400, v: B.v0 + 330 },
    { u: DECK_EDGE_U - 400, v: B.v1 - 330 },
  ];
}
/** The front row: chairs either side of a centre aisle (|v| ≥ AISLE). */
export const CHAIR_ROW = { u: KEYS_POS.audience, v0: -2100, v1: 2100 } as const;
export const AISLE = 620;
export const inAisle = (c: { y: number }) => Math.abs(c.y) >= AISLE;
export function keysChairs(): { x: number; y: number; rotation: number }[] {
  return chairRowFacingStage(CHAIR_ROW.u, CHAIR_ROW.v0, CHAIR_ROW.v1).filter(inAisle);
}

/** The keyboard's case from above: centre, width (across v), depth (along u),
 *  the keys' depth, the white-key count. */
export function keyboardDims(rig: KeysRig): { cu: number; cv: number; width: number; depth: number; keyDepth: number; nWhite: number } {
  return rig === 'rhodes'
    ? { cu: KEYS_POS.rhodes.keyboard.u, cv: KEYS_POS.rhodes.keyboard.v, width: RHODES.stage.w.mm, depth: RHODES.stage.d.mm, keyDepth: 150, nWhite: 36 }
    : { cu: (-W.slipX - W.caseBackX) / 2, cv: 0, width: WURLI.w.mm, depth: WURLI.d.mm, keyDepth: 168, nWhite: 38 };
}
export function keyboardRect(rig: KeysRig): PlanRect {
  const k = keyboardDims(rig);
  return { u0: k.cu - k.depth / 2, u1: k.cu + k.depth / 2, v0: k.cv - k.width / 2, v1: k.cv + k.width / 2 };
}

/** Local shapes (about their own centre). */
export const BENCH = { u0: -330, u1: -70, v0: -380, v1: 380 } as const;
export const SHOULDERS = { hu: 120, hv: 230 } as const;
export const PEDAL = { hu: 70, hv: 45 } as const;
export const DI = { hu: 60, hv: 45 } as const;

/** The player's keep-clear space: hands, knees and the sustain pedal. */
export function keysKeep(rig: KeysRig): PlanRect {
  const P = KEYS_POS[rig];
  return rig === 'rhodes' ? { u0: P.player.u - 260, u1: keyboardRect('rhodes').u0 + 170, v0: SIDE - 520, v1: SIDE + 520 } : { u0: P.player.u - 330, u1: 30, v0: -560, v1: 560 };
}

/** A wedge in this plan's frame: centre and the angle it faces (the reed
 *  piano's plan mirrors frame W's x). */
export function keysWedgeAt(rig: KeysRig, wd: Pick<Wedge, 'p' | 'faces'>): { u: number; v: number; a: number } {
  return rig === 'rhodes' ? { u: wd.p.x, v: wd.p.z, a: Math.atan2(wd.faces.z, wd.faces.x) } : { u: -wd.p.x, v: wd.p.z, a: Math.atan2(wd.faces.z, -wd.faces.x) };
}

/** The studio headphone mix: the keyboard player's mixer at their left (the
 *  side away from the sustain pedal), just outside their space, fed from the
 *  control room on the room's nearest wall. */
export function keysCue(rig: KeysRig): CueRig {
  const P = KEYS_POS[rig].player;
  const room = keysRoom(rig);
  return rig === 'rhodes'
    ? { room, wall: 'u0', hubAt: 800, stations: [{ id: 'keyboardist', at: { u: -60, v: 800 }, head: P, facing: 0 }] }
    : { room, wall: 'v0', hubAt: -1100, stations: [{ id: 'keyboardist', at: { u: -650, v: -760 }, head: P, facing: 0 }] };
}

/** Every object's footprint on the plan (mm). */
export function keysFoots(rig: KeysRig, scene: KeysScene, wedges: readonly Wedge[]): PlanFoot[] {
  const P = KEYS_POS[rig];
  const g = 'player:keys';
  const out: PlanFoot[] = [];
  if (rig === 'rhodes') {
    const c = cabLayout('combo12');
    out.push(foot('amp', 'amp', { u0: c.box.x0, u1: c.box.x1, v0: c.box.z0, v1: c.box.z1 }));
    out.push(foot('keyboard', 'instrument', keyboardRect('rhodes'), { group: g }));
  } else {
    // the reed piano IS the miked source (its speakers face the player)
    out.push(foot('amp', 'instrument', keyboardRect('wurli'), { group: g }));
  }
  out.push(foot('player', 'player', { u0: P.player.u - SHOULDERS.hu, u1: P.player.u + SHOULDERS.hu, v0: P.player.v - SHOULDERS.hv, v1: P.player.v + SHOULDERS.hv }, { group: g }));
  out.push(foot('bench', 'bench', { u0: P.player.u + BENCH.u0, u1: P.player.u + BENCH.u1, v0: P.player.v + BENCH.v0, v1: P.player.v + BENCH.v1 }, { group: g }));
  out.push(foot('pedal', 'pedal', { u0: P.pedal.u - PEDAL.hu, u1: P.pedal.u + PEDAL.hu, v0: P.pedal.v - PEDAL.hv, v1: P.pedal.v + PEDAL.hv }, { group: g }));
  out.push(foot('keepClear', 'keepClear', keysKeep(rig), { group: g, zone: true }));
  out.push(foot('dibox', 'dibox', { u0: P.di.u - DI.hu, u1: P.di.u + DI.hu, v0: P.di.v - DI.hv, v1: P.di.v + DI.hv }));
  out.push(foot('otherAmp', 'amp', { u0: P.otherAmp.u + OTHER_AMP.u0, u1: P.otherAmp.u + OTHER_AMP.u1, v0: P.otherAmp.v + OTHER_AMP.v0, v1: P.otherAmp.v + OTHER_AMP.v1 }));
  if (scene === 'stage') {
    out.push(...kitPieceFoots(KEYS_KIT_AT[rig]));
    for (const w of wedges) {
      const a = keysWedgeAt(rig, w);
      out.push(wedgeFoot({ id: w.id, p: { x: a.u, y: 0, z: a.v }, faces: { x: Math.cos(a.a), y: 0, z: Math.sin(a.a) } }));
    }
    keysPaAt(rig).forEach((p, i) => out.push(foot(`pa${i}`, 'pa', { u0: p.u - 350, u1: p.u + 350, v0: p.v - 280, v1: p.v + 280 })));
    out.push(...chairFoots(keysChairs()));
  } else {
    out.push(...cueFootprints(keysCue(rig)));
  }
  return out;
}

/** Item ids on the plan and where each sits (taps and highlights). */
export function keysItems(rig: KeysRig, scene: KeysScene, wedges: readonly Wedge[]): { id: string; u: number; v: number; r: number }[] {
  const P = KEYS_POS[rig];
  const out: { id: string; u: number; v: number; r: number }[] =
    rig === 'rhodes'
      ? [
          { id: 'amp', u: -100, v: 0, r: 420 },
          { id: 'keys', u: KEYS_POS.rhodes.keyboard.u, v: KEYS_POS.rhodes.keyboard.v, r: 480 },
          { id: 'musician', u: P.player.u, v: P.player.v, r: 300 },
          { id: 'pedal', u: P.pedal.u, v: P.pedal.v, r: 140 },
          { id: 'dibox', u: P.di.u, v: P.di.v, r: 160 },
          { id: 'otherAmp', u: P.otherAmp.u, v: P.otherAmp.v, r: 420 },
        ]
      : [
          { id: 'amp', u: 230, v: 0, r: 500 },
          { id: 'musician', u: P.player.u, v: P.player.v, r: 300 },
          { id: 'pedal', u: P.pedal.u, v: P.pedal.v, r: 140 },
          { id: 'dibox', u: P.di.u, v: P.di.v, r: 160 },
          { id: 'otherAmp', u: P.otherAmp.u, v: P.otherAmp.v, r: 420 },
        ];
  if (scene === 'stage') {
    const K = KEYS_KIT_AT[rig];
    out.push({ id: 'drums', u: K.u + KIT_MID.u, v: K.v + KIT_MID.v, r: 900 });
    for (const w of wedges) {
      const a = keysWedgeAt(rig, w);
      out.push({ id: w.id === wedges[0].id ? 'wedge' : w.id, u: a.u, v: a.v, r: 330 });
    }
    out.push({ id: 'audience', u: KEYS_POS.audience + 150, v: 0, r: 700 });
  } else out.push({ id: 'room', u: rig === 'rhodes' ? 2300 : 1900, v: rig === 'rhodes' ? -900 : -1300, r: 420 });
  return out;
}

/** The footprint ids each plan item names (its label keeps clear of them). */
export function keysItemFootIds(rig: KeysRig, id: string, wedges: readonly Wedge[]): string[] {
  if (id === 'keys') return ['keyboard'];
  if (id === 'musician') return ['player', 'bench'];
  if (id === 'wedge') return [wedges[0]?.id ?? 'wedge'];
  void rig;
  return [id];
}
