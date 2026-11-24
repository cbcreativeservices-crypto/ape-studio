/**
 * FIGURE V2 — ANY PERSON OF THE CAST, IN PROFILE (wave 3 of D78, 2026-11-23).
 * The approved drawing (FigureV2Side, or SideLite at lesson sizes) on any
 * side-view pose, dressed as the cast member who plays the role (cast.ts), with
 * the hands that hold nothing drawn at rest (authoredHands restSide /
 * restFlat). New code beside the drummer's: his paths are not touched.
 */
import { memo } from 'react';
import { Group, Paint, Path } from '@shopify/react-native-skia';
import type { PlayerPose } from '../players/playerPose.ts';
import { inPoly, P, type Poly, type Pt } from './geom.ts';
import { sidePlan, type SidePlan } from './sidePlan.ts';
import { sidePaths } from './paths.ts';
import { FigureV2Side } from './FigureV2Side';
import { SideLite, TopLite } from './lite';
import { Arm, ShirtLight, type Torso } from './FigureV2Side';
import { DrummerTopLegsV2, HeadTop, topPaths } from './FigureV2Top';
import { Folds } from './paint';
import { personTopPlan, type PersonTopOpts } from './topPerson.ts';
import { FigureScale, levelOf, useFigureScale } from './detail';
import { FigureLook } from './look';
import type { CastMember } from './cast';

export type PersonOpts = {
  /** Where the front of the mouth is (a talker's lip point), when the pose has one. */
  lip?: Pt;
  /** The hands at rest: at the side, or on a desk. */
  rest?: 'restSide' | 'restFlat';
  /** A seated figure's seat top (its soft contact shadow). */
  seatV?: number;
};

/** A head drawn this many points tall or more takes full detail even where the body is lite
 *  (coordinator round, 2026-11-23: "the HEAD takes full detail whenever it is drawn about 45 px tall or
 *  more on a 390 pt phone"). */
export const FULL_HEAD_PT = 45;
/** The head's drawn height (pt): ≈ 228 mm for a head of radius 110 (sidePlan.headPlan). */
export const headPt = (pose: PlayerPose, ptPerMm: number | null) => (ptPerMm ?? 0) * 228 * (pose.head.r / 110);

/** The plan for a cast member on a pose (memoised per pose and options). */
export function personPlan(pose: PlayerPose, who: CastMember, o: PersonOpts = {}): SidePlan {
  return sidePlan(pose, { head: who.head, lip: o.lip, restR: o.rest, restL: o.rest, seatV: o.seatV, body: who.body });
}

/** A cast member in profile. `dim` fades the whole person as one layer. */
export const PersonSideV2 = memo(function PersonSideV2({ pose, who, opts, dim = 1, assumePtPerMm, part = 'all' }: { pose: PlayerPose; who: CastMember; opts?: PersonOpts; dim?: number; assumePtPerMm?: number; /** 'headless': a step draws the head turned; 'head': that head alone */ part?: 'all' | 'headless' | 'head' }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const plan = personPlan(pose, who, opts);
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={dim < 1 ? <Paint opacity={dim} /> : undefined}>
          {level === 'lite' ? (
            <SideLite
              plan={plan}
              P={sidePaths(plan)}
              part={part}
              fullHead={
                headPt(pose, ptPerMm) >= FULL_HEAD_PT ? (
                  <FigureScale ptPerMm={ptPerMm} level="full">
                    <FigureV2Side plan={plan} part="head" />
                  </FigureScale>
                ) : undefined
              }
            />
          ) : (
            <FigureV2Side plan={plan} part={part} />
          )}
        </Group>
      </FigureLook>
    </FigureScale>
  );
});

/** Every outline the person paints (labels keep off them). */
export function personShapes(plan: SidePlan): Poly[] {
  const arm = (a: SidePlan['arms']['near']): Poly[] => [a.upper, a.foreSleeve, a.cuff, a.wristSkin, ...(a.placed ? a.placed.parts.map((q) => q.placed) : [])];
  return [plan.shirt, plan.head.skull, plan.head.hair, plan.head.neck, plan.seat, plan.legs.near.outline, plan.legs.near.lower, plan.legs.far.outline, plan.legs.far.lower, plan.shoes.near.upper, plan.shoes.far.upper, ...arm(plan.arms.near), ...arm(plan.arms.far)];
}

/** Whether the person, as drawn, covers (u, v) within `tol` mm. */
export function personCovers(pose: PlayerPose, who: CastMember, o: PersonOpts, u: number, v: number, tol = 0): boolean {
  const shapes = personShapes(personPlan(pose, who, o));
  const pts: Pt[] = tol > 0 ? [P(u, v), P(u - tol, v), P(u + tol, v), P(u, v - tol), P(u, v + tol)] : [P(u, v)];
  for (const q of pts) for (const s of shapes) if (inPoly(q, s)) return true;
  return false;
}

/* ── from above ── */

/** A cast member from above: `part` 'lower' (the legs, under a desk) or 'upper' (the rest), or both;
 *  `head` 'none' (a step draws it turned) or 'only' (that head alone). */
export const PersonTopV2 = memo(function PersonTopV2({ pose, who, opts = {}, part = 'all', head = 'show', dim = 1, assumePtPerMm }: { pose: PlayerPose; who: CastMember; opts?: PersonTopOpts; part?: 'all' | 'lower' | 'upper'; head?: 'show' | 'none' | 'only'; dim?: number; assumePtPerMm?: number }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = head === 'only' ? 'full' : levelOf({ ptPerMm, level: v.level });
  const plan = personTopPlan(pose, who, opts);
  const T = topPaths(plan);
  const b = T.torso.getBounds();
  const torso: Torso = { axis: plan.torsoAxis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: T.torso };
  const arms = !!opts.desk;
  // (standing, seen from directly above: the legs and feet lie under the shoulders — not drawn, as the old figure)
  const legs = !!opts.desk;
  const body =
    head === 'only' ? (
      <HeadTop plan={plan} T={T} />
    ) : level === 'lite' ? (
      legs || part !== 'lower' ? <TopLite plan={plan} T={T} part={part === 'lower' ? 'legs' : legs ? part : 'upper'} arms={arms} head={head === 'show'} /> : null
    ) : (
      <Group>
        {part !== 'upper' && legs ? <DrummerTopLegsV2 plan={plan} /> : null}
        {part !== 'lower' ? (
          <Group>
            {arms ? <Arm a={plan.arms.far} P={T.far} t={torso} /> : null}
            {arms ? <Arm a={plan.arms.near} P={T.near} t={torso} /> : null}
            <ShirtLight path={T.torso} t={torso} />
            <Group clip={T.torso}>
              <Folds path={T.blades} mat={who.look.MAT.shirt} opacity={0.5} />
            </Group>
            <Path path={T.torso} style="stroke" strokeWidth={1} color={who.look.MAT.shirt.edge} opacity={0.5} />
            {head === 'show' ? <HeadTop plan={plan} T={T} /> : null}
          </Group>
        ) : null}
      </Group>
    );
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={dim < 1 ? <Paint opacity={dim} /> : undefined}>{body}</Group>
      </FigureLook>
    </FigureScale>
  );
});

/** Whether the person from above, as drawn, covers (u, v) within `tol` mm. */
export function personTopCovers(pose: PlayerPose, who: CastMember, o: PersonTopOpts, u: number, v: number, tol = 0): boolean {
  const plan = personTopPlan(pose, who, o);
  const arm = (a: typeof plan.arms.near): Poly[] => [a.upper, a.foreSleeve, a.cuff, a.wristSkin, ...(a.placed ? a.placed.parts.map((q) => q.placed) : [])];
  const shapes = [plan.torso, plan.head.skull, plan.head.hair, plan.head.nose, ...(o.desk ? [...plan.legs.thighs, ...plan.legs.shins, ...plan.shoes.map((s) => s.sole), ...arm(plan.arms.near), ...arm(plan.arms.far)] : [])];
  const pts: Pt[] = tol > 0 ? [P(u, v), P(u - tol, v), P(u + tol, v), P(u, v - tol), P(u, v + tol)] : [P(u, v)];
  for (const q of pts) for (const sh of shapes) if (inPoly(q, sh)) return true;
  return false;
}
