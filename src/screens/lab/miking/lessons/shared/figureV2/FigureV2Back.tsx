/**
 * FIGURE V2 — A PERSON FROM BEHIND, DRAWN (wave 6 of D78, 2026-11-24). The
 * parts of backPlan.ts painted far to near in the approved look's one light
 * (the key light from the upper left of the PICTURE: seen from behind that is
 * the person's left side — every value is painted from it, never a mirrored
 * front):
 *   the shoes' contact shadows → the heels → the trousers (the seat and both
 *   legs as one garment, the seat seam, the welt pockets, the creases, the
 *   cloth behind the knees, the hem over the heel) → the ears and the head's
 *   skin → the back of the neck → the shirt's back (the shoulder blades'
 *   light, the shoulder seams, a yoke, the belt and its loops, the shirt
 *   blousing over it, or the loose hem) → the collar → the jacket's back
 *   (its collar, the side seams, the center seam and vent) → the hair (a tail,
 *   a bun) → each arm (one sleeve, the jacket's sleeve over it, the cuff, the
 *   hand from behind).
 * EDGES as the front view: a fine edge only a shade darker than the mass.
 * Every path is built once per plan; nothing is computed per frame.
 */
import { memo } from 'react';
import { Group, LinearGradient, Paint, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { PlayerPose } from '../players/playerPose.ts';
import { Blur, FigureScale, levelOf, useFigureScale } from './detail';
import { LIGHT, type Poly, type Pt } from './geom.ts';
import { SOLE } from './palette.ts';
import { AuthoredHand, Folds, Form, Soft, across } from './paint';
import { artPaths, ellipsePath, op, smoothClosed, smoothOpen, unionOf, type ArtPaths, type SkPath } from './paths.ts';
import { backPlan, type BackArm, type BackOpts, type BackPlan } from './backPlan.ts';
import { FigureLook, useLook } from './look';
import type { CastMember } from './cast';
import { JACKET_DEFAULT } from './jacketV2';
import type { Material } from './palette.ts';

/* ── paths ── */

type ArmP = { sleeve: SkPath; armhole: SkPath; cuff: SkPath; cuffRim: SkPath; cuffSeam: SkPath; folds: SkPath; elbowLight: SkPath; hand: ArtPaths; jacket: { outline: SkPath; endRim: SkPath; folds: SkPath } | null };
export type BackPaths = {
  skull: SkPath;
  turn: SkPath;
  ears: SkPath[];
  earRoots: SkPath[];
  hair: SkPath;
  clumps: SkPath[];
  comb: SkPath | null;
  sheen: SkPath;
  tail: SkPath | null;
  tailClumps: SkPath[];
  tie: SkPath | null;
  bun: SkPath | null;
  bunTurns: SkPath | null;
  ends: SkPath | null;
  neck: SkPath;
  furrow: SkPath;
  neckLight: SkPath;
  napeShadow: SkPath;
  shirt: SkPath;
  collar: SkPath;
  collarTop: SkPath;
  shoulderSeams: SkPath;
  yoke: SkPath | null;
  pleat: SkPath | null;
  blades: SkPath[];
  spine: SkPath;
  belt: SkPath | null;
  loops: SkPath | null;
  blouse: SkPath | null;
  shirtFolds: SkPath;
  trousers: SkPath;
  legs: SkPath[];
  /** Each leg with its own half of the seat (the leg's cloth light carried up to the belt). */
  legsUp: SkPath[];
  seatSeam: SkPath;
  pockets: SkPath;
  seatFold: SkPath;
  creases: SkPath;
  legFolds: SkPath;
  calfLights: SkPath[];
  legGap: SkPath | null;
  shoes: { upper: SkPath; heel: SkPath; seam: SkPath; heelLight: SkPath; contact: SkPath }[];
  arms: ArmP[];
  jacket: { body: SkPath; collar: SkPath; seam: SkPath; vent: SkPath; ventTop: SkPath; sideSeams: SkPath; hem: SkPath; folds: SkPath } | null;
};

const many = (ps: readonly Poly[], closed = true): SkPath => {
  const p = smoothClosed([], 0.5);
  for (const q of ps) p.addPath(closed ? smoothClosed(q, 0.5) : smoothOpen(q));
  return p;
};

const cache = new WeakMap<BackPlan, BackPaths>();
export function backPaths(B: BackPlan): BackPaths {
  const hit = cache.get(B);
  if (hit) return hit;
  const h = B.head;
  const skull = smoothClosed(h.skull, 0.5);
  const shirt = smoothClosed(B.shirt, 0.45);
  const seat = smoothClosed(B.seat, 0.45);
  const legs = B.legs.map((l) => smoothClosed(l.outline, 0.45));
  const trousers = unionOf(seat, ...legs);
  // (Ensembles3) each leg's cloth carried up over its own half of the seat: the seat is the two legs' cylinders
  // meeting at the seat seam, never a lighter panel (a box) between the belt and the legs
  const midU = B.legs.length === 2 ? (B.legs[0].axis[0].u + B.legs[1].axis[0].u) / 2 : B.axis[0].u;
  const legsUp = legs.map((l, i) => {
    const side = Math.sign((B.legs[i]?.axis[0].u ?? midU) - midU) || 1;
    const half = Skia.Path.Make();
    half.addRect(Skia.XYWHRect(side > 0 ? midU : midU - 4000, -8000, 4000, 16000));
    return unionOf(l, op(seat, half, PathOp.Intersect));
  });
  const out: BackPaths = {
    skull,
    turn: (() => {
      const inner = skull.copy();
      const b = skull.getBounds();
      const cx0 = b.x + b.width / 2;
      const cy0 = b.y + b.height / 2;
      const m = Skia.Matrix();
      m.translate(cx0, cy0);
      m.scale(0.86, 0.93);
      m.translate(-cx0, -cy0);
      inner.transform(m);
      return op(skull, inner, PathOp.Difference);
    })(),
    ears: h.ears.map((e) => smoothClosed(e, 0.55)),
    earRoots: h.earRoots.map((e) => smoothOpen(e)),
    hair: smoothClosed(h.hair, 0.45),
    clumps: h.clumps.map((c) => smoothClosed(c, 0.5)),
    comb: h.combLines.length ? many(h.combLines, false) : null,
    sheen: smoothOpen(h.sheen),
    tail: h.tail ? smoothClosed(h.tail, 0.5) : null,
    tailClumps: h.tailClumps.map((c) => smoothClosed(c, 0.5)),
    tie: h.tie ? ellipsePath(h.tie) : null,
    bun: h.bun ? smoothClosed(h.bun, 0.5) : null,
    bunTurns: h.bunTurns.length ? many(h.bunTurns, false) : null,
    ends: h.ends ? smoothClosed(h.ends, 0.4) : null,
    neck: smoothClosed(h.neck, 0.5),
    furrow: smoothOpen(h.furrow),
    neckLight: ellipsePath(h.neckLight),
    napeShadow: smoothClosed(h.napeShadow, 0.5),
    shirt,
    collar: smoothClosed(B.collar, 0.4),
    collarTop: smoothOpen(B.collarTop),
    shoulderSeams: many(B.shoulderSeams, false),
    yoke: B.yoke ? smoothOpen(B.yoke) : null,
    pleat: B.pleat.length ? many(B.pleat, false) : null,
    blades: B.blades.map(ellipsePath),
    spine: smoothOpen(B.spine),
    belt: B.belt ? op(smoothClosed(B.belt, 0.3), unionOf(shirt, seat), PathOp.Intersect) : null,
    loops: B.loops.length ? many(B.loops) : null,
    blouse: B.blouse ? op(smoothClosed(B.blouse, 0.4), shirt, PathOp.Intersect) : null,
    shirtFolds: many(B.shirtFolds),
    trousers,
    legs,
    legsUp,
    seatSeam: smoothOpen(B.seatSeam),
    pockets: many(B.pockets, false),
    seatFold: smoothClosed(B.seatFold, 0.5),
    creases: many(
      B.legs.map((l) => l.crease),
      false,
    ),
    legFolds: many(B.legs.flatMap((l) => l.folds)),
    calfLights: B.legs.map((l) => ellipsePath(l.calfLight)),
    legGap: B.legGap ? smoothClosed(B.legGap, 0.5) : null,
    shoes: B.shoes.map((s) => ({ upper: smoothClosed(s.upper, 0.4), heel: smoothClosed(s.heel, 0.25), seam: smoothOpen(s.seam), heelLight: ellipsePath(s.heelLight), contact: ellipsePath(s.contact) })),
    arms: B.arms.map((a, i) => {
      const js = B.jacket ? B.jacket.sleeves[i] : null;
      return {
        sleeve: smoothClosed(a.sleeve, 0.45),
        armhole: smoothOpen(a.armhole),
        cuff: smoothClosed(a.cuff, 0.3),
        cuffRim: smoothOpen(a.cuffRim),
        cuffSeam: smoothOpen(a.cuffSeam),
        folds: many(a.folds),
        elbowLight: ellipsePath(a.elbowLight),
        hand: artPaths(a.hand, null),
        jacket: js ? { outline: smoothClosed(js.outline, 0.4), endRim: smoothOpen(js.endRim), folds: many(js.folds) } : null,
      };
    }),
    jacket: B.jacket
      ? {
          body: smoothClosed(B.jacket.body, 0.4),
          collar: smoothClosed(B.jacket.collar, 0.4),
          seam: smoothOpen(B.jacket.seam),
          vent: smoothOpen(B.jacket.vent),
          ventTop: smoothOpen(B.jacket.ventTop),
          sideSeams: many(B.jacket.sideSeams, false),
          hem: smoothOpen(B.jacket.hem),
          folds: many(B.jacket.folds),
        }
      : null,
  };
  cache.set(B, out);
  return out;
}

/* ── the cloth's light on the torso (from the picture's upper left) ── */

function TorsoLight({ path, B, mat }: { path: SkPath; B: BackPlan; mat: Material }) {
  const [s, e] = across(B.axis[0], B.axis[1], 190);
  const b = path.getBounds();
  return (
    <Group>
      <Path path={path}>
        <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={mat.form} positions={mat.pos} />
      </Path>
      <Path path={path}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x, b.y + b.height)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']} />
      </Path>
    </Group>
  );
}

const useJacket = (): Material => useLook().JACKET ?? JACKET_DEFAULT;

/** The page below a height (v ≥ v0). */
function belowV(v0: number): SkPath {
  const p = Skia.Path.Make();
  p.addRect(Skia.XYWHRect(-20000, v0, 40000, 40000));
  return p;
}

/* ── the head from behind ── */

function HairBack({ B, P }: { B: BackPlan; P: BackPaths }) {
  const { MAT } = useLook();
  const h = B.head;
  const c = h.c;
  const light = (
    <LinearGradient start={vec(c.u + LIGHT.u * h.r, c.v + LIGHT.v * h.r)} end={vec(c.u - LIGHT.u * h.r, c.v - LIGHT.v * h.r)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
  );
  // (Ensembles3) a short cut's or a crop's hair thins out toward the nape — a natural hairline, never a straight
  // cut edge: its last few mm fade into the skin under it
  const k = h.r / 110;
  const fades = h.style === 'short' || h.style === 'crop';
  const fadeTop = h.nape.v - (h.style === 'crop' ? 22 : 30) * k;
  return (
    <Group>
      {/* the hair's shadow on the nape and the skull's skin */}
      <Soft path={P.hair} color={MAT.skin.deep} opacity={0.3} blur={2.5} clip={P.skull} />
      <Group layer={fades ? <Paint /> : undefined}>
      <Path path={P.hair}>
        {light}
        <Blur mm={1} />
      </Path>
      <Group clip={P.hair}>
        {P.clumps.map((q, i) => (
          <Group key={i}>
            <Path path={q} color={MAT.hair.form[i % 2 === 0 ? 1 : 3]} opacity={0.2}>
              <Blur mm={2.4} />
            </Path>
            <Path path={q} style="stroke" strokeWidth={0.9} color={MAT.hair.deep} opacity={0.16}>
              <Blur mm={0.6} />
            </Path>
          </Group>
        ))}
        {P.comb ? (
          <Path path={P.comb} style="stroke" strokeWidth={1.4} strokeCap="round" color={MAT.hair.deep} opacity={0.3}>
            <Blur mm={0.5} />
          </Path>
        ) : null}
        {P.ends ? <Soft path={P.ends} color={MAT.hair.deep} opacity={0.4} blur={3} /> : null}
        <Path path={P.sheen} style="stroke" strokeWidth={10} strokeCap="round" color={MAT.hair.rim} opacity={0.2}>
          <Blur mm={4} />
        </Path>
      </Group>
      <Path path={P.hair} style="stroke" strokeWidth={0.8} color={MAT.hair.edge} opacity={0.4} />
      {fades ? (
        <Path path={P.hair} blendMode="dstOut">
          <LinearGradient start={vec(h.nape.u, fadeTop)} end={vec(h.nape.u, h.nape.v + 2 * k)} colors={['rgba(0,0,0,0)', h.style === 'crop' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.6)']} />
        </Path>
      ) : null}
      </Group>
      {P.bun ? (
        <Group>
          <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
            <Path path={P.bun} color="#000" opacity={0.35}>
              <Blur mm={2.4} />
            </Path>
          </Group>
          <Form path={P.bun} mat={MAT.hair} round={{ c: h.knot ?? c, r: 30 }} rim={3} edge={0.8}>
            {P.bunTurns ? (
              <Path path={P.bunTurns} style="stroke" strokeWidth={1.6} strokeCap="round" color={MAT.hair.deep} opacity={0.45}>
                <Blur mm={0.6} />
              </Path>
            ) : null}
          </Form>
        </Group>
      ) : null}
      {P.tail ? (
        <Group>
          <Group clip={P.neck}>
            <Group transform={[{ translateX: -LIGHT.u * 4 }, { translateY: -LIGHT.v * 4 }]}>
              <Path path={P.tail} color="#000" opacity={0.35}>
                <Blur mm={3} />
              </Path>
            </Group>
          </Group>
          <Form path={P.tail} mat={MAT.hair} axis={[{ u: c.u, v: c.v }, { u: c.u, v: c.v + 110 * (h.r / 110) }]} w={30} rim={4} edge={0.7}>
            {P.tailClumps.map((q, i) => (
              <Group key={i}>
                <Path path={q} color={MAT.hair.form[i % 2 === 0 ? 0 : 3]} opacity={i % 2 === 0 ? 0.28 : 0.22}>
                  <Blur mm={2} />
                </Path>
                <Path path={q} style="stroke" strokeWidth={0.9} color={MAT.hair.deep} opacity={0.2}>
                  <Blur mm={0.5} />
                </Path>
              </Group>
            ))}
          </Form>
          {P.tie ? (
            <Group>
              <Path path={P.tie} color={MAT.hair.form[3]} />
              <Path path={P.tie} style="stroke" strokeWidth={1.2} color={MAT.hair.rim} opacity={0.25} />
            </Group>
          ) : null}
        </Group>
      ) : null}
    </Group>
  );
}

function HeadBack({ B, P }: { B: BackPlan; P: BackPaths }) {
  const { MAT, HEAD_SKIN } = useLook();
  const h = B.head;
  const c = h.c;
  const R = h.r * 0.72;
  return (
    <Group>
      {/* the ears' backs, behind the skull (their roots hidden by the back of the head) */}
      {P.ears.map((e, i) => (
        <Form key={`e${i}`} path={e} mat={HEAD_SKIN} round={{ c, r: R }} rim={2} edge={0.4}>
          <Path path={e} color={MAT.skin.deep} opacity={0.22} />
          <Path path={P.earRoots[i]} style="stroke" strokeWidth={3} strokeCap="round" color={MAT.skin.deep} opacity={0.4}>
            <Blur mm={1.2} />
          </Path>
        </Form>
      ))}
      <Form path={P.skull} mat={HEAD_SKIN} round={{ c, r: R }} rim={5} edge={0.8}>
        <Soft path={P.turn} color={MAT.skin.deep} opacity={0.22} blur={9} />
      </Form>
    </Group>
  );
}

function NeckBack({ B, P }: { B: BackPlan; P: BackPaths }) {
  const { MAT, HEAD_SKIN } = useLook();
  const h = B.head;
  return (
    <Form path={P.neck} mat={HEAD_SKIN} round={{ c: { u: h.c.u, v: h.c.v + 60 }, r: h.r * 0.8 }} rim={4} edge={0.8}>
      <Soft path={P.neckLight} color={MAT.skin.rim} opacity={0.14} blur={6} />
      <Path path={P.furrow} style="stroke" strokeWidth={6} strokeCap="round" color={MAT.skin.deep} opacity={0.14}>
        <Blur mm={3} />
      </Path>
      <Soft path={P.napeShadow} color={MAT.skin.deep} opacity={0.32} blur={5} />
    </Form>
  );
}

/* ── the arm ── */

function ArmBack({ a, P, B }: { a: BackArm; P: ArmP; B: BackPlan }) {
  const { MAT } = useLook();
  const J = useJacket();
  const shirtBody = backPaths(B).shirt;
  const sleeveForm = (path: SkPath, mat: Material, w: number, folds: SkPath) => (
    <Group>
      <TorsoLight path={path} B={B} mat={mat} />
      <Form path={path} mat={mat} axis={a.upperAxis} w={w} rim={5} edge={0} fall={0.1}>
        <Soft path={P.elbowLight} color={mat.rim} opacity={0.12} blur={6} />
      </Form>
      <Group clip={path}>
        <Folds path={folds} mat={mat} opacity={0.5} />
      </Group>
    </Group>
  );
  return (
    <Group>
      {sleeveForm(P.sleeve, MAT.shirt, 42, P.folds)}
      <Group clip={P.sleeve}>
        <Path path={P.armhole} style="stroke" strokeWidth={4} strokeCap="round" color={MAT.shirt.deep} opacity={0.12}>
          <Blur mm={2.2} />
        </Path>
        <Path path={P.armhole} style="stroke" strokeWidth={0.9} strokeCap="round" color={MAT.shirt.deep} opacity={0.22} />
      </Group>
      <Group clip={shirtBody} invertClip>
        <Path path={P.sleeve} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      </Group>
      {P.jacket ? (
        <Group>
          {sleeveForm(P.jacket.outline, J, 48, P.jacket.folds)}
          <Group clip={backPaths(B).jacket?.body ?? shirtBody} invertClip>
            <Path path={P.jacket.outline} style="stroke" strokeWidth={1} color={J.edge} opacity={0.6} />
          </Group>
        </Group>
      ) : null}
      <AuthoredHand a={P.hand} />
      <Group clip={P.hand.all}>
        <Group transform={[{ translateX: -LIGHT.u * 2 }, { translateY: 4 }]}>
          <Path path={P.cuff} color={MAT.skin.deep} opacity={0.42}>
            <Blur mm={2.5} />
          </Path>
        </Group>
      </Group>
      <Form path={P.cuff} mat={MAT.shirt} axis={a.foreAxis} w={34} rim={3} edge={0.9}>
        <Path path={P.cuffSeam} style="stroke" strokeWidth={1.2} strokeCap="round" color={MAT.shirt.deep} opacity={0.5} />
        <Path path={P.cuffRim} style="stroke" strokeWidth={4} strokeCap="round" color={MAT.shirt.rim} opacity={0.22}>
          <Blur mm={0.8} />
        </Path>
      </Form>
      {P.jacket ? (
        <Group>
          <Group clip={P.cuff}>
            <Path path={P.jacket.endRim} style="stroke" strokeWidth={6} strokeCap="round" color="#000" opacity={0.35}>
              <Blur mm={2.4} />
            </Path>
          </Group>
          <Path path={P.jacket.endRim} style="stroke" strokeWidth={1.2} strokeCap="round" color={J.edge} opacity={0.7} />
        </Group>
      ) : null}
    </Group>
  );
}

/* ── the legs and the heels ── */

function Heels({ P }: { P: BackPaths }) {
  const { MAT } = useLook();
  return (
    <Group>
      {P.shoes.map((s, i) => (
        <Group key={i}>
          <Soft path={s.contact} opacity={0.55} blur={6} />
          <Form path={s.upper} mat={MAT.leather} rim={4} edge={0.9}>
            <Soft path={s.heelLight} color="#fff0e2" opacity={0.16} blur={3} />
            <Path path={s.seam} style="stroke" strokeWidth={1.1} strokeCap="round" color={MAT.leather.deep} opacity={0.55} />
          </Form>
          <Path path={s.heel}>
            <LinearGradient start={vec(0, s.heel.getBounds().y)} end={vec(0, s.heel.getBounds().y + s.heel.getBounds().height)} colors={[SOLE.top, SOLE.bottom]} />
          </Path>
          <Path path={s.heel} style="stroke" strokeWidth={0.8} color={SOLE.edge} opacity={0.6} />
        </Group>
      ))}
    </Group>
  );
}

function TrousersBack({ B, P }: { B: BackPlan; P: BackPaths }) {
  const { MAT, CLOTH } = useLook();
  return (
    <Group>
      <Form path={P.trousers} mat={CLOTH} axis={B.axis} w={190} rim={5}>
        {P.legsUp.map((l, i) => {
          const [s, e] = across(B.legs[i].axis[0], B.legs[i].axis[1], 60);
          return (
            <Group key={i} clip={l}>
              <Path path={l}>
                <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={CLOTH.form} positions={CLOTH.pos} />
                <Blur mm={5} />
              </Path>
            </Group>
          );
        })}
        {P.legGap ? <Soft path={P.legGap} color={MAT.trousers.deep} opacity={0.35} blur={10} /> : null}
        <Soft path={P.seatFold} color={MAT.trousers.deep} opacity={0.22} blur={9} />
        {P.calfLights.map((k, i) => (
          <Soft key={i} path={k} color={MAT.trousers.rim} opacity={0.1} blur={10} />
        ))}
        <Path path={P.creases} style="stroke" strokeWidth={2.4} strokeCap="round" color={MAT.trousers.rim} opacity={0.14}>
          <Blur mm={1.2} />
        </Path>
        <Path path={P.seatSeam} style="stroke" strokeWidth={1.1} strokeCap="round" color={MAT.trousers.deep} opacity={0.55} />
        <Path path={P.pockets} style="stroke" strokeWidth={2.2} strokeCap="round" color={MAT.trousers.deep} opacity={0.6} />
        <Group transform={[{ translateX: LIGHT.u * 1.6 }, { translateY: LIGHT.v * 1.6 }]}>
          <Path path={P.pockets} style="stroke" strokeWidth={1.2} strokeCap="round" color={MAT.trousers.rim} opacity={0.16} />
        </Group>
        <Folds path={P.legFolds} mat={MAT.trousers} opacity={0.5} />
      </Form>
      {/* the hem's soft shadow on the heel */}
      {P.shoes.map((s, i) => (
        <Group key={`h${i}`} clip={s.upper}>
          <Group clip={P.trousers} invertClip>
            <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: 5 }]}>
              <Path path={P.trousers} color="#000" opacity={0.42}>
                <Blur mm={2.5} />
              </Path>
            </Group>
          </Group>
        </Group>
      ))}
    </Group>
  );
}

/* ── the torso from behind ── */

function TorsoBack({ B, P }: { B: BackPlan; P: BackPaths }) {
  const { MAT } = useLook();
  return (
    <Group>
      <TorsoLight path={P.shirt} B={B} mat={MAT.shirt} />
      <Group clip={P.shirt}>
        {P.blades.map((b, i) => (
          <Soft key={i} path={b} color={i === 0 ? MAT.shirt.rim : MAT.shirt.deep} opacity={i === 0 ? 0.1 : 0.08} blur={18} />
        ))}
        <Path path={P.spine} style="stroke" strokeWidth={8} strokeCap="round" color={MAT.shirt.deep} opacity={0.08}>
          <Blur mm={5} />
        </Path>
        <Folds path={P.shirtFolds} mat={MAT.shirt} opacity={0.45} />
        <Path path={P.shoulderSeams} style="stroke" strokeWidth={1} strokeCap="round" color={MAT.shirt.deep} opacity={0.32} />
        {P.yoke ? (
          <Group>
            <Path path={P.yoke} style="stroke" strokeWidth={1.1} strokeCap="round" color={MAT.shirt.deep} opacity={0.42} />
            <Group transform={[{ translateY: 2 }]}>
              <Path path={P.yoke} style="stroke" strokeWidth={1.6} strokeCap="round" color={MAT.shirt.rim} opacity={0.12} />
            </Group>
          </Group>
        ) : null}
        {P.pleat ? <Path path={P.pleat} style="stroke" strokeWidth={1} strokeCap="round" color={MAT.shirt.deep} opacity={0.32} /> : null}
        {/* the collar's soft shadow on the shirt below it */}
        <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 4 }]}>
          <Path path={P.collar} color={MAT.shirt.deep} opacity={0.4}>
            <Blur mm={2.4} />
          </Path>
        </Group>
      </Group>
      <Path path={P.shirt} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      {P.belt ? (
        <Group>
          <Path path={P.belt}>
            <LinearGradient start={vec(0, P.belt.getBounds().y)} end={vec(0, P.belt.getBounds().y + P.belt.getBounds().height)} colors={['#5a4334', '#33251c', '#1a120d']} />
          </Path>
          <Path path={P.belt}>
            <LinearGradient start={vec(P.belt.getBounds().x, 0)} end={vec(P.belt.getBounds().x + P.belt.getBounds().width, 0)} colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']} positions={[0, 0.2, 0.75, 1]} />
          </Path>
          <Path path={P.belt} style="stroke" strokeWidth={0.9} color="#0b0806" opacity={0.8} />
          {P.loops ? (
            <Group>
              <Path path={P.loops} color="#3a2a20" />
              <Path path={P.loops} style="stroke" strokeWidth={0.8} color="#0b0806" opacity={0.7} />
            </Group>
          ) : null}
          {P.blouse ? (
            <Group>
              <Group clip={P.belt}>
                <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
                  <Path path={P.blouse} color="#000" opacity={0.45}>
                    <Blur mm={2.5} />
                  </Path>
                </Group>
              </Group>
              <TorsoLight path={P.blouse} B={B} mat={MAT.shirt} />
            </Group>
          ) : null}
        </Group>
      ) : null}
      <Form path={P.collar} mat={MAT.shirt} axis={B.axis} w={80} rim={0} edge={0.9}>
        <Path path={P.collarTop} style="stroke" strokeWidth={3} strokeCap="round" color={MAT.shirt.rim} opacity={0.2}>
          <Blur mm={0.8} />
        </Path>
      </Form>
    </Group>
  );
}

function JacketBack({ B, P }: { B: BackPlan; P: NonNullable<BackPaths['jacket']> }) {
  const J = useJacket();
  return (
    <Group>
      <TorsoLight path={P.body} B={B} mat={J} />
      <Group clip={P.body}>
        <Folds path={P.folds} mat={J} opacity={0.4} />
        <Path path={P.sideSeams} style="stroke" strokeWidth={1.1} strokeCap="round" color={J.deep} opacity={0.45} />
        <Path path={P.seam} style="stroke" strokeWidth={1.2} strokeCap="round" color={J.deep} opacity={0.6} />
        {/* the vent: the left panel's edge lying over the right, its soft shadow, its stitched top */}
        <Group transform={[{ translateX: 2.5 }, { translateY: 0 }]}>
          <Path path={P.vent} style="stroke" strokeWidth={4} strokeCap="round" color="#000" opacity={0.3}>
            <Blur mm={1.6} />
          </Path>
        </Group>
        <Path path={P.vent} style="stroke" strokeWidth={1.3} strokeCap="round" color={J.edge} opacity={0.75} />
        <Path path={P.ventTop} style="stroke" strokeWidth={1.1} strokeCap="round" color={J.deep} opacity={0.6} />
        <Group transform={[{ translateX: LIGHT.u * 2 }, { translateY: LIGHT.v * 2 }]}>
          <Path path={P.hem} style="stroke" strokeWidth={2} strokeCap="round" color={J.rim} opacity={0.12} />
        </Group>
        {/* the collar's shadow on the back */}
        <Group transform={[{ translateX: -LIGHT.u * 4 }, { translateY: -LIGHT.v * 5 }]}>
          <Path path={P.collar} color="#000" opacity={0.35}>
            <Blur mm={3} />
          </Path>
        </Group>
      </Group>
      <Path path={P.body} style="stroke" strokeWidth={1} strokeJoin="round" color={J.edge} opacity={0.6} />
      <TorsoLight path={P.collar} B={B} mat={J} />
      <Path path={P.collar} color={J.rim} opacity={0.1} />
      <Path path={P.collar} style="stroke" strokeWidth={1.1} strokeJoin="round" color={J.edge} opacity={0.7} />
    </Group>
  );
}

/** The whole person from behind, full detail. */
export function FigureV2Back({ B, arms = true }: { B: BackPlan; /** false: the arms are drawn by the caller (the conductor) */ arms?: boolean }) {
  const P = backPaths(B);
  return (
    <Group>
      <Heels P={P} />
      {/* (Ensembles3) under a jacket the trousers show only below its hem: their seat never stands out past the
          jacket's sides at the hips (two boxes) */}
      {P.jacket && B.jacket ? (
        <Group clip={unionOf(P.jacket.body, belowV(Math.min(B.jacket.hemAt.v, ...B.jacket.hem.map((q) => q.v)) - 4))}>
          <TrousersBack B={B} P={P} />
        </Group>
      ) : (
        <TrousersBack B={B} P={P} />
      )}
      <HeadBack B={B} P={P} />
      <NeckBack B={B} P={P} />
      <TorsoBack B={B} P={P} />
      {P.jacket ? <JacketBack B={B} P={P.jacket} /> : null}
      <HairBack B={B} P={P} />
      {arms ? B.arms.map((a, i) => <ArmBack key={i} a={a} P={P.arms[i]} B={B} />) : null}
    </Group>
  );
}

/* ── lite (lesson sizes): the same masses, one gradient each, no blur ── */

function M({ path, mat, axis, w }: { path: SkPath; mat: Material; axis: [Pt, Pt]; w: number }) {
  const [s, e] = across(axis[0], axis[1], w);
  return (
    <Path path={path}>
      <LinearGradient start={vec(s.u, s.v)} end={vec(e.u, e.v)} colors={mat.form} positions={mat.pos} />
    </Path>
  );
}
function Round({ path, mat, c, r }: { path: SkPath; mat: Material; c: Pt; r: number }) {
  return (
    <Path path={path}>
      <RadialGradient c={vec(c.u + LIGHT.u * r * 0.45, c.v + LIGHT.v * r * 0.45)} r={r * 1.55} colors={mat.form} positions={mat.pos} />
    </Path>
  );
}

function HandLite({ a }: { a: ArtPaths }) {
  const { MAT, HAND } = useLook();
  const b = a.all.getBounds();
  const m = { u: b.x + b.width / 2, v: b.y + b.height / 2 };
  return (
    <Group>
      {a.parts.map((p, i) => (
        <Path key={i} path={p.path}>
          <LinearGradient start={vec(m.u - 0.32 * 56, m.v - 0.95 * 56)} end={vec(m.u + 0.32 * 56, m.v + 0.95 * 56)} colors={HAND} positions={[0, 0.35, 0.75, 1]} />
        </Path>
      ))}
      {a.gaps ? <Path path={a.gaps} color={MAT.skin.deep} opacity={0.5} /> : null}
      <Path path={a.all} style="stroke" strokeWidth={0.9} color={MAT.skin.edge} opacity={0.5} />
    </Group>
  );
}

/** The head from behind at the lite level (the hair one gradient). */
export function HeadBackLite({ B, P }: { B: BackPlan; P: BackPaths }) {
  const { MAT, HEAD_SKIN } = useLook();
  const h = B.head;
  const R = h.r * 0.72;
  const hairG = <LinearGradient start={vec(h.c.u + LIGHT.u * h.r, h.c.v + LIGHT.v * h.r)} end={vec(h.c.u - LIGHT.u * h.r, h.c.v - LIGHT.v * h.r)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />;
  return (
    <Group>
      {P.ears.map((e, i) => (
        <Round key={`e${i}`} path={e} mat={HEAD_SKIN} c={h.c} r={R} />
      ))}
      <Round path={P.skull} mat={HEAD_SKIN} c={h.c} r={R} />
      <Round path={P.neck} mat={HEAD_SKIN} c={{ u: h.c.u, v: h.c.v + 60 }} r={h.r * 0.8} />
      <Path path={P.hair}>{hairG}</Path>
      {P.bun ? <Path path={P.bun}>{hairG}</Path> : null}
      {P.bun && P.bunTurns ? <Path path={P.bunTurns} style="stroke" strokeWidth={1.6} color={MAT.hair.deep} opacity={0.45} /> : null}
      {P.tail ? <Path path={P.tail}>{hairG}</Path> : null}
      {P.tie ? <Path path={P.tie} color={MAT.hair.edge} /> : null}
    </Group>
  );
}

export function FigureV2BackLite({ B, arms: withArms = true }: { B: BackPlan; arms?: boolean }) {
  const { MAT, CLOTH } = useLook();
  const J = useJacket();
  const P = backPaths(B);
  const ax = B.axis;
  return (
    <Group>
      {P.shoes.map((s, i) => (
        <Group key={`s${i}`}>
          <M path={s.upper} mat={MAT.leather} axis={B.shoes[i].axis} w={30} />
          <Path path={s.heel} color={SOLE.bottom} />
        </Group>
      ))}
      <M path={P.trousers} mat={CLOTH} axis={ax} w={190} />
      <Path path={P.seatSeam} style="stroke" strokeWidth={1.2} color={MAT.trousers.deep} opacity={0.5} />
      <HeadBackLite B={B} P={P} />
      <M path={P.shirt} mat={MAT.shirt} axis={ax} w={190} />
      <Path path={P.shirt} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      {P.belt ? <Path path={P.belt} color="#33251c" /> : null}
      {P.blouse ? <M path={P.blouse} mat={MAT.shirt} axis={ax} w={190} /> : null}
      <M path={P.collar} mat={MAT.shirt} axis={ax} w={80} />
      {P.jacket ? (
        <Group>
          <M path={P.jacket.body} mat={J} axis={ax} w={190} />
          <Path path={P.jacket.seam} style="stroke" strokeWidth={1.4} color={J.edge} opacity={0.7} />
          <Path path={P.jacket.vent} style="stroke" strokeWidth={1.4} color={J.edge} opacity={0.8} />
          <M path={P.jacket.collar} mat={J} axis={ax} w={80} />
        </Group>
      ) : null}
      {/* (the hair again over the collar: a bob's ends and a tail lie over it) */}
      {P.tail ? <M path={P.tail} mat={MAT.hair} axis={ax} w={30} /> : null}
      {withArms
        ? B.arms.map((a, i) => {
            const A = P.arms[i];
            return (
              <Group key={i}>
                <M path={A.sleeve} mat={MAT.shirt} axis={a.upperAxis} w={44} />
                {A.jacket ? <M path={A.jacket.outline} mat={J} axis={a.upperAxis} w={50} /> : null}
                <HandLite a={A.hand} />
                <M path={A.cuff} mat={MAT.shirt} axis={a.foreAxis} w={34} />
              </Group>
            );
          })
        : null}
    </Group>
  );
}

/* ── a cast member from behind ── */

export type PersonBackOpts = { jacket?: boolean };

/** The plan for a cast member on a pose seen from behind. */
export function personBackPlan(pose: PlayerPose, who: CastMember, o: PersonBackOpts = {}): BackPlan {
  const opts: BackOpts = { head: who.head, ...(who.body ? { body: who.body } : {}), woman: who.woman, ...(o.jacket ? { jacket: true } : {}) };
  return backPlan(pose, opts);
}

/** A cast member from behind (full detail at close-up sizes, lite at lesson sizes). */
export const PersonBackV2 = memo(function PersonBackV2({ pose, who, opts = {}, dim = 1, assumePtPerMm, arms = true }: { pose: PlayerPose; who: CastMember; opts?: PersonBackOpts; dim?: number; assumePtPerMm?: number; arms?: boolean }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const B = personBackPlan(pose, who, opts);
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={dim < 1 ? <Paint opacity={dim} /> : undefined}>{level === 'lite' ? <FigureV2BackLite B={B} arms={arms} /> : <FigureV2Back B={B} arms={arms} />}</Group>
      </FigureLook>
    </FigureScale>
  );
}, (a, b) => a.pose === b.pose && a.who === b.who && a.dim === b.dim && a.assumePtPerMm === b.assumePtPerMm && a.arms === b.arms && !!a.opts?.jacket === !!b.opts?.jacket);
