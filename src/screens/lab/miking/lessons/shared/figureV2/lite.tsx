/**
 * FIGURE V2 — THE LITE DRUMMER (wave 1 of D78, 2026-11-23): the approved
 * figure as it is drawn at lesson sizes (under ≈ 0.28 pt/mm: the drummer under
 * ≈ 400 pt tall, detail.tsx). The SAME masses from the same cached paths, in
 * the same materials and the same depth order — the shirt, sleeves, cuffs,
 * hands, trousers, shoes, the head with its hair, eye, brow and mouth — each
 * one gradient fill, with no blur and none of the modelling that is under a
 * pixel there (folds, creases, rims, nails, lights). Every finger is still its
 * own shape. Built for the per-frame cost: about the old figure's.
 */
import type { ReactNode } from 'react';
import { ColorMatrix, Group, LinearGradient, Paint, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { LIGHT, type Pt } from './geom.ts';
import { HEAD_SKIN, MAT, SOLE, type Material } from './palette.ts';
import { across } from './paint';
import type { ArmPaths, ArtPaths, ShoePaths, SidePaths, SkPath } from './paths.ts';
import type { ArmPlan, SidePlan } from './sidePlan.ts';
import type { TopPaths } from './FigureV2Top';
import type { TopPlan } from './topPlan.ts';
import { CLOTH } from './FigureV2Side';
import { useLook } from './look';

/** A mass in its material, turned across its axis (one gradient). */
function M({ path, mat, axis, w }: { path: SkPath; mat: Material; axis: [Pt, Pt]; w: number }) {
  const [s, e] = across(axis[0], axis[1], w);
  return (
    <Path path={path}>
      <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={mat.form} positions={mat.pos} />
    </Path>
  );
}
/** A round mass (the head) in its own light. */
function Round({ path, mat, c, r }: { path: SkPath; mat: Material; c: Pt; r: number }) {
  return (
    <Path path={path}>
      <RadialGradient c={vec(c.u + LIGHT.u * r * 0.45, c.v + LIGHT.v * r * 0.45)} r={r * 1.55} colors={mat.form} positions={mat.pos} />
    </Path>
  );
}


/** The authored hand on its stick, each part one fill in the hand's one skin light. */
function HandLite({ a, stick }: { a: ArtPaths; stick?: ReactNode }) {
  const { MAT, HAND } = useLook();
  const b = a.all.getBounds();
  const m = { u: b.x + b.width / 2, v: b.y + b.height / 2 };
  const R = 56;
  const fill = (p: { path: SkPath }, i: number) => (
    <Path key={i} path={p.path}>
      <LinearGradient start={vec(m.u - 0.32 * R, m.v - 0.95 * R)} end={vec(m.u + 0.32 * R, m.v + 0.95 * R)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
    </Path>
  );
  const back = a.parts.filter((p) => p.layer === 'back');
  const front = a.parts.filter((p) => p.layer === 'front');
  const edge = <Path path={a.all} style="stroke" strokeWidth={0.9} color={MAT.skin.edge} opacity={0.5} />;
  // (the parts' own lines only — a thumb's outer edge and gap line — never a closed outline round a thumb)
  const digitEdges = a.edges ? <Path path={a.edges} style="stroke" strokeWidth={1} strokeCap="round" color={MAT.skin.edge} opacity={0.4} /> : null;
  if (a.endOn || a.stickUnder)
    return (
      <Group>
        {stick ?? null}
        {a.parts.map(fill)}
        {digitEdges}
        {edge}
        {a.stub ? <Path path={a.stub} color="#c79a5c" /> : null}
      </Group>
    );
  return (
    <Group>
      {back.map(fill)}
      {stick ?? null}
      {front.map(fill)}
      {a.gaps ? <Path path={a.gaps} color={MAT.skin.deep} opacity={0.5} /> : null}
      {digitEdges}
      {edge}
    </Group>
  );
}

/** One arm in the side view's depth order (the far rim and inside, the wrist and hand, the near rim). */
export function ArmLite({ a, P, stick }: { a: ArmPlan; P: ArmPaths; stick?: ReactNode }) {
  const { MAT } = useLook();
  const upper = <M path={P.upper} mat={MAT.shirt} axis={a.upperAxis} w={46} />;
  const fore = (
    <Group>
      <M path={P.foreSleeve} mat={MAT.shirt} axis={a.foreAxis} w={38} />
      {a.mouth ? <M path={P.cuff} mat={MAT.shirt} axis={a.foreAxis} w={38} /> : null}
    </Group>
  );
  const inside = P.toViewer && P.rimFar ? <Path path={P.opening} color="#1d222c" /> : null;
  const hand = P.art ? <HandLite a={P.art} stick={stick} /> : <Group>{stick ?? null}</Group>;
  const near = a.mouth ? (
    <Path path={P.rimNear} style="stroke" strokeWidth={7} strokeCap="round" color={MAT.shirt.form[1]} />
  ) : (
    <M path={P.cuffCloth} mat={MAT.shirt} axis={a.foreAxis} w={38} />
  );
  if (a.away && P.behindMouth)
    return (
      <Group>
        {upper}
        {fore}
        {hand}
        <Group clip={P.behindMouth}>
          {fore}
          {upper}
        </Group>
        {near}
      </Group>
    );
  return a.away ? (
    <Group>
      {inside}
      {hand}
      {fore}
      {near}
      {upper}
    </Group>
  ) : (
    <Group>
      {upper}
      {fore}
      {inside}
      {hand}
      {near}
    </Group>
  );
}

const FAR = (
  <Paint>
    <ColorMatrix matrix={[0.74, 0, 0, 0, 0, 0, 0.74, 0, 0, 0, 0, 0, 0.74, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);

function ShoeLite({ s, axis }: { s: ShoePaths; axis: [Pt, Pt] }) {
  const { MAT } = useLook();
  return (
    <Group>
      <M path={s.upper} mat={MAT.leather} axis={axis} w={40} />
      <Path path={s.sole} color={SOLE.bottom} />
    </Group>
  );
}

/** The side view, lite. */
export function SideLite({ plan, P, farStick, nearStick, part = 'all', fullHead, over, noArm }: { /** (the held arm) that arm not drawn ('both': the boom operator) */ noArm?: 'near' | 'far' | 'both'; plan: SidePlan; P: SidePaths; farStick?: ReactNode; nearStick?: ReactNode; part?: 'all' | 'headless' | 'head'; /** (wave 3) the head drawn in full detail in place of the lite head (a head ≥ 45 pt tall) */ fullHead?: ReactNode; /** (wave 3, the jacket) pieces over the far arm, the shirt's collar and the near arm */ over?: { far?: ReactNode; body?: ReactNode; near?: ReactNode } }) {
  const { MAT, HEAD_SKIN, CLOTH, LIP } = useLook();
  const L = plan.legs;
  const h = plan.head;
  const c = { u: (h.box.u0 + h.box.u1) / 2, v: (h.box.v0 + h.box.v1) / 2 };
  const R = (h.box.u1 - h.box.u0) / 2;
  // (wave 3: the head alone, turned by a step; or the body with only its neck)
  const headOnly = (
    <Group>
      <Round path={P.skull} mat={HEAD_SKIN} c={c} r={R} />
      <Path path={P.eye} color="#d6c8bd" opacity={0.62} />
      <Path path={P.lid} color={MAT.hair.edge} opacity={0.82} />
      <Path path={P.brow} color={MAT.hair.form[2]} opacity={0.78} />
      <Path path={P.lips} color={LIP} opacity={0.42} />
      {/* (a cast member: the lips in the full head's own tone — it lies in the face's turning shade) */}
      {plan.dress ? <Path path={P.lips} color="#3a2016" opacity={0.2} /> : null}
      <Path path={P.mouth} style="stroke" strokeWidth={1.5} strokeCap="round" color={MAT.skin.deep} opacity={0.7} />
      <Path path={P.hair}>
        <LinearGradient start={vec(c.u + LIGHT.u * R, c.v + LIGHT.v * R)} end={vec(c.u - LIGHT.u * R, c.v - LIGHT.v * R)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
      </Path>
      {h.earShows ? <Round path={P.ear} mat={HEAD_SKIN} c={c} r={R} /> : null}
    </Group>
  );
  if (part === 'head') return fullHead ? <Group>{fullHead}</Group> : headOnly;
  const torsoAxis: [Pt, Pt] = [plan.hip, plan.neck];
  const shoeAxis = (s: SidePlan['shoes']['near']): [Pt, Pt] => [s.heel, s.toe];
  return (
    <Group>
      <Group layer={FAR}>
        <ShoeLite s={P.shoeFar} axis={shoeAxis(plan.shoes.far)} />
        <M path={P.legFar} mat={CLOTH} axis={L.far.thighAxis} w={70} />
      </Group>
      {noArm === 'far' || noArm === 'both' ? null : (
        <>
      <Group layer={FAR}>
        <ArmLite a={plan.arms.far} P={P.far} stick={farStick} />
      </Group>
      {over?.far ?? null}
        </>
      )}
      <ShoeLite s={P.shoeNear} axis={shoeAxis(plan.shoes.near)} />
      <M path={P.trousersNear} mat={CLOTH} axis={L.near.thighAxis} w={70} />
      {/* the head */}
      <Round path={P.neck} mat={HEAD_SKIN} c={c} r={R} />
      {part === 'headless' ? null : fullHead ?? headOnly}
      {/* the shirt, belt and collar */}
      <M path={P.shirt} mat={MAT.shirt} axis={torsoAxis} w={120} />
      <Path path={P.shirt} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      {plan.dress?.tucked === false ? null : (
        <Group>
          <Path path={P.belt} color="#33251c" />
          <Path path={P.buckle} color="#8b9099" />
          <M path={P.blouse} mat={MAT.shirt} axis={torsoAxis} w={120} />
        </Group>
      )}
      <M path={P.collar} mat={MAT.shirt} axis={torsoAxis} w={70} />
      {over?.body ?? null}
      {noArm === 'near' || noArm === 'both' ? null : (
        <>
      <ArmLite a={plan.arms.near} P={P.near} stick={nearStick} />
      {over?.near ?? null}
        </>
      )}
    </Group>
  );
}

/** The view from above, lite: `legs` under the drums, `upper` over them. */
export function TopLite({ plan, T, part, farStick, nearStick, arms = true, head = true, over, noArm }: { /** (the held arm) that arm not drawn */ noArm?: 'near' | 'far'; plan: TopPlan; T: TopPaths; part: 'all' | 'legs' | 'upper'; farStick?: ReactNode; nearStick?: ReactNode; /** (wave 3) a standing person's arms hang under the shoulders: not drawn */ arms?: boolean; /** (wave 3) false: the head is drawn turned by a step */ head?: boolean; /** (wave 3, the jacket) pieces over the arms and over the shoulders (before the head) */ over?: { arms?: ReactNode; body?: ReactNode } }) {
  const { MAT, HEAD_SKIN, CLOTH } = useLook();
  const hc = plan.head.c;
  return (
    <Group>
      {part !== 'upper' ? (
        <Group>
          {T.shoes.map((s, i) => (
            <Group key={`s${i}`}>
              <Path path={s.sole} color={SOLE.bottom} />
              <M path={s.upper} mat={MAT.leather} axis={plan.shoes[i].axis} w={40} />
            </Group>
          ))}
          {T.shins.map((p, i) => (
            <M key={`sh${i}`} path={p} mat={CLOTH} axis={plan.legs.thighAxes[i]} w={50} />
          ))}
          {T.thighs.map((p, i) => (
            <M key={`th${i}`} path={p} mat={CLOTH} axis={plan.legs.thighAxes[i]} w={70} />
          ))}
        </Group>
      ) : null}
      {part !== 'legs' ? (
        <Group>
          {arms && noArm !== 'far' ? <ArmLite a={plan.arms.far} P={T.far} stick={farStick} /> : null}
          {arms && noArm !== 'near' ? <ArmLite a={plan.arms.near} P={T.near} stick={nearStick} /> : null}
          {over?.arms ?? null}
          <M path={T.torso} mat={MAT.shirt} axis={plan.torsoAxis} w={120} />
          <Path path={T.torso} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
          {over?.body ?? null}
          {head ? (
            <Group>
            <Round path={T.skull} mat={HEAD_SKIN} c={hc} r={110} />
            {T.ears.map((e, i) => (
              <Path key={`e${i}`} path={e} style="stroke" strokeWidth={9} strokeCap="round" color={HEAD_SKIN.form[2]} />
            ))}
            <Round path={T.nose} mat={HEAD_SKIN} c={hc} r={110} />
            <Path path={T.hair}>
              <LinearGradient start={vec(hc.u + LIGHT.u * 110, hc.v + LIGHT.v * 110)} end={vec(hc.u - LIGHT.u * 110, hc.v - LIGHT.v * 110)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
            </Path>
            </Group>
          ) : null}
        </Group>
      ) : null}
    </Group>
  );
}
