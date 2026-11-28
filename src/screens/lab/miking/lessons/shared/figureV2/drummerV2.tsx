/**
 * FIGURE V2 — THE KIT DRUMMER EVERYWHERE THE APP SHOWS HIM (wave 1 of D78,
 * 2026-11-23). One place for every call site (kitScene/KitSceneArt's kit
 * scene, kitScene/stickPlayer's lesson drummer, phantom, hand-over and strike
 * close-up): the approved side view (FigureV2Side on kitDrummerPlan) and the
 * view from above (FigureV2Top on kitDrummerTopPlan), for any stroke the
 * drummer plays (a DrummerSpec), receded by `dim` as the old figure recedes
 * (blended toward the stage's dark, opaque: PlayerFigure.recede).
 *
 * The label tests and the labels' occupancy read `drummerV2Covers`: the very
 * outlines the new figure paints.
 */
import { memo, type ReactNode } from 'react';
import { ColorMatrix, Group, Paint } from '@shopify/react-native-skia';
import type { DrummerSpec } from '../kitScene/stickPose.ts';
import { KIT_GROOVE } from '../kitScene/kitStrokes.ts';
import { inPoly, P, type Poly, type Pt } from './geom.ts';
import { kitDrummerPlan } from './kitDrummerV2';
import { kitDrummerTopPlan, type TopPlan } from './topPlan.ts';
import { DrummerTopLegsV2, DrummerTopUpperV2, topPaths } from './FigureV2Top';
import { Arm, FigureV2HandAlone, FigureV2Side, type Torso } from './FigureV2Side';
import type { SidePlan } from './sidePlan.ts';
import { FigureScale, levelOf, useFigureScale } from './detail';
import { ArmLite, SideLite, TopLite } from './lite';
import { sidePaths } from './paths.ts';

/** A receding drummer stays OPAQUE: its colours blended toward the stage's dark (PlayerFigure.recede). */
const RECEDE_BG = [0.075, 0.078, 0.094] as const;
const recedeCache = new Map<number, ReactNode>();
function recede(dim: number): ReactNode | undefined {
  if (dim >= 1) return undefined;
  const k = Math.max(0, dim);
  let r = recedeCache.get(k);
  if (!r) {
    const m = [k, 0, 0, 0, (1 - k) * RECEDE_BG[0], 0, k, 0, 0, (1 - k) * RECEDE_BG[1], 0, 0, k, 0, (1 - k) * RECEDE_BG[2], 0, 0, 0, 1, 0];
    r = (
      <Paint>
        <ColorMatrix matrix={m} />
      </Paint>
    );
    recedeCache.set(k, r);
  }
  return r;
}

/**
 * The drawn scale here (detail.tsx), with `assume` standing in where no scene
 * provides one (a strike close-up is drawn about 0.6 pt/mm); a receding
 * phantom (dim under .5) is always drawn lite.
 */
function useScaleFor(dim: number, assume?: number) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assume ?? null;
  const level = dim < 0.5 ? ('lite' as const) : levelOf({ ptPerMm, level: v.level });
  return { ptPerMm, level };
}

/** The drummer from the side (the approved look), each stick through its fist. */
export const DrummerSideV2 = memo(function DrummerSideV2({ spec = KIT_GROOVE, farStick, nearStick, dim = 1, hangLeft = false, assumePtPerMm }: { spec?: DrummerSpec; farStick?: ReactNode; nearStick?: ReactNode; dim?: number; hangLeft?: boolean; assumePtPerMm?: number }) {
  const sc = useScaleFor(dim, assumePtPerMm);
  const plan = kitDrummerPlan(spec, hangLeft ? { hangLeft } : {});
  return (
    <FigureScale ptPerMm={sc.ptPerMm} level={sc.level}>
      <Group layer={recede(dim) as never}>
        {sc.level === 'lite' ? <SideLite plan={plan} P={sidePaths(plan)} farStick={farStick} nearStick={nearStick} /> : <FigureV2Side plan={plan} farStick={farStick} nearStick={nearStick} />}
      </Group>
    </FigureScale>
  );
});

/** The drummer from above: `legs` under the drums, `upper` over them, or both. */
export const DrummerTopV2 = memo(function DrummerTopV2({ spec = KIT_GROOVE, part = 'all', farStick, nearStick, dim = 1 }: { spec?: DrummerSpec; part?: 'all' | 'legs' | 'upper'; farStick?: ReactNode; nearStick?: ReactNode; dim?: number }) {
  const sc = useScaleFor(dim);
  const plan = kitDrummerTopPlan(spec);
  return (
    <FigureScale ptPerMm={sc.ptPerMm} level={sc.level}>
      <Group layer={recede(dim) as never}>
        {sc.level === 'lite' ? (
          <TopLite plan={plan} T={topPaths(plan)} part={part} farStick={farStick} nearStick={nearStick} />
        ) : (
          <>
            {part !== 'upper' ? <DrummerTopLegsV2 plan={plan} /> : null}
            {part !== 'legs' ? <DrummerTopUpperV2 plan={plan} farStick={farStick} nearStick={nearStick} /> : null}
          </>
        )}
      </Group>
    </FigureScale>
  );
});

/** The near (stick) arm and hand again, over a nearer piece that covered the
 *  drummer, so the fist still closes over its stick (stickPlayer.StickHandOver). */
export const DrummerNearArmV2 = memo(function DrummerNearArmV2({ view, spec = KIT_GROOVE, stick, dim = 1 }: { view: 'side' | 'top'; spec?: DrummerSpec; stick?: ReactNode; dim?: number }) {
  const sc = useScaleFor(dim);
  const lite = sc.level === 'lite';
  if (view === 'side') {
    const plan = kitDrummerPlan(spec);
    return (
      <FigureScale ptPerMm={sc.ptPerMm} level={sc.level}>
        <Group layer={recede(dim) as never}>{lite ? <ArmLite a={plan.arms.near} P={sidePaths(plan).near} stick={stick} /> : <FigureV2HandAlone plan={plan} which="near" stick={stick} />}</Group>
      </FigureScale>
    );
  }
  const plan = kitDrummerTopPlan(spec);
  const T = topPaths(plan);
  const b = T.torso.getBounds();
  const torso: Torso = { axis: plan.torsoAxis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: T.torso };
  return (
    <FigureScale ptPerMm={sc.ptPerMm} level={sc.level}>
      <Group layer={recede(dim) as never}>{lite ? <ArmLite a={plan.arms.near} P={T.near} stick={stick} /> : <Arm a={plan.arms.near} P={T.near} t={torso} stick={stick} />}</Group>
    </FigureScale>
  );
});

/* ── the drawn silhouette (labels, mic starts, the tests) ── */

/** Every outline the side figure paints (view u, v). */
export function sideShapes(plan: SidePlan): Poly[] {
  const arm = (a: SidePlan['arms']['near']): Poly[] => [a.upper, a.foreSleeve, a.cuff, a.wristSkin, ...(a.placed ? a.placed.parts.map((q) => q.placed) : [])];
  return [plan.shirt, plan.head.skull, plan.head.hair, plan.legs.near.outline, plan.legs.near.lower, plan.legs.far.outline, plan.legs.far.lower, plan.shoes.near.upper, plan.shoes.far.upper, ...arm(plan.arms.near), ...arm(plan.arms.far)];
}
/** Every outline the top figure paints (view u = x, v = z). */
export function topShapesAll(plan: TopPlan): Poly[] {
  const arm = (a: TopPlan['arms']['near']): Poly[] => [a.upper, a.foreSleeve, a.cuff, a.wristSkin, ...(a.placed ? a.placed.parts.map((q) => q.placed) : [])];
  return [plan.torso, plan.head.skull, plan.head.hair, ...plan.head.ears, plan.head.nose, ...plan.legs.thighs, ...plan.legs.shins, ...plan.shoes.map((s) => s.sole), ...arm(plan.arms.near), ...arm(plan.arms.far)];
}

/** Whether the NEW drummer, as drawn, covers (u, v) within `tol` mm. */
export function drummerV2Covers(view: 'side' | 'top', spec: DrummerSpec, u: number, v: number, tol = 0, opts: { hangLeft?: boolean } = {}): boolean {
  const shapes = view === 'side' ? sideShapes(kitDrummerPlan(spec, opts.hangLeft ? { hangLeft: true } : {})) : topShapesAll(kitDrummerTopPlan(spec));
  const pts: Pt[] = tol > 0 ? [P(u, v), P(u - tol, v), P(u + tol, v), P(u, v - tol), P(u, v + tol)] : [P(u, v)];
  for (const q of pts) for (const s of shapes) if (inPoly(q, s)) return true;
  return false;
}
