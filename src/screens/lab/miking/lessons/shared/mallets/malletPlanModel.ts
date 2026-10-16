/**
 * MALLET-BAR FAMILY — THE SETTING's plan, pure (MalletPlan.tsx draws it on
 * the shared band plan, handdrums/HandPlan): the plan spec type and the
 * keyboard's own footprint on the plan (collision pass 2026-10-15).
 *
 * The family frame (x along the bars, z toward the audience; the player at
 * zPlayer) is turned onto the plan (u toward the audience → right, v down)
 * by a quarter turn: (x, z) ↦ (z, −x) — the same turn MalletPlan draws.
 */
import type { InstrumentModel, VariantId } from '../../../engine/model/types.ts';
import type { PlanThing } from '../handdrums/family.ts';
import { modelArtPlan, type ArtPlan, type PlanCueSpec } from '../handdrums/handPlanModel.ts';
import { malletGeom, type MalletFamily } from './malletModel.ts';

export type MalletPlanSpec = { box: { u0: number; u1: number; v0: number; v1: number }; things: readonly PlanThing[]; cue?: PlanCueSpec };

/** The player drawn from above at the keyboard (the house figure): the
 *  shoulders and elbows across (x), the body behind the near rail (z). */
export const MALLET_PLAYER_TOP = { half: 300, back: 150, front: 150 } as const;

/** (x, z) of the family frame onto the plan's (u, v). */
export const turnToPlan = (r: { u0: number; u1: number; v0: number; v1: number }) => ({ u0: r.v0, u1: r.v1, v0: -r.u1, v1: -r.u0 });

/** The keyboard (its parts) and the drawn player, on the plan, about the
 *  instrument's anchor. */
export function malletArtPlan(fam: MalletFamily, model: InstrumentModel, variant: VariantId): ArtPlan {
  const G = malletGeom(fam);
  const L = G.layouts[variant] ?? G.layouts[fam.variants[0].row.id];
  const inst = modelArtPlan(model, variant, false);
  const zP = L.zPlayer;
  const P = MALLET_PLAYER_TOP;
  return {
    foots: [
      ...inst.foots.map((f) => ({ ...f, r: turnToPlan(f.r) })),
      { id: 'artPlayer', kind: 'player', r: turnToPlan({ u0: -P.half, u1: P.half, v0: zP - P.back, v1: zP + P.front }) },
    ],
    keepClear: [],
    head: { u: zP, v: 0 },
    facing: 0,
  };
}
