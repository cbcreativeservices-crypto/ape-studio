/**
 * FIGURE V2 — A PERSON FROM THE FRONT, DRAWN (wave 4 of D78, 2026-11-24). The
 * parts of frontPlan.ts painted far to near in the approved look's one light
 * (the drums' key light, upper left — the viewer's left side lit):
 *   standing: the shoes' contact shadows → the shoes → the trousers (the seat
 *   and both legs as one garment, each leg's own cylinder light, the pressed
 *   crease, the break over the shoe) → the neck → the shirt (its light across
 *   the torso, folds, the placket and buttons, the belt and the shirt
 *   blousing over it, or the loose hem) → the collar → the jacket's body →
 *   the head (the ears, the face's planes, the eyes, the nose, the lips, the
 *   hair) → each arm (one sleeve, the jacket's sleeve over it, the cuff, the
 *   wrist and the hand at rest);
 *   seated: the shoes and the shins, the torso and the head as standing, then
 *   the thighs and knees toward the viewer, then the arms with the hands on
 *   the knees.
 * EDGES as the side view: a fine edge only a shade darker than the mass, none
 * where a sleeve lies over the shirt (a soft seam there). Every path is built
 * once per plan; nothing is computed per frame.
 */
import { memo } from 'react';
import { Group, LinearGradient, Mask, Paint, Path, PathOp, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { PlayerPose } from '../players/playerPose.ts';
import { Blur, FigureScale, levelOf, useFigureScale } from './detail';
import { LIGHT, type Poly, type Pt } from './geom.ts';
import { SOLE } from './palette.ts';
import { AuthoredHand, Folds, Form, Soft, across } from './paint';
import { artPaths, ellipsePath, op, smoothClosed, smoothOpen, unionOf, type ArtPaths, type SkPath } from './paths.ts';
import { frontPlan, type FrontArm, type FrontOpts, type FrontPlan } from './frontPlan.ts';
import { FigureLook, useLook } from './look';
import type { CastMember } from './cast';
import { JACKET_DEFAULT } from './jacketV2';
import type { Material } from './palette.ts';
import { headPt, FULL_HEAD_PT } from './personV2';

/* ── paths ── */

type ArmP = { sleeve: SkPath; armhole: SkPath; cuff: SkPath; cuffRim: SkPath; cuffSeam: SkPath; folds: SkPath; hand: ArtPaths; jacket: { outline: SkPath; endRim: SkPath; folds: SkPath } | null };
// (the head's fields grouped one line per feature, each line led by its comment: a text check that reads
// frontPaths' builder lines by their leading name finds the builder below, never this type)
export type FrontPaths = {
  /* skull, ears, hair */ skull: SkPath; ears: SkPath[]; earFolds: SkPath[]; hair: SkPath; clumps: SkPath[]; part: SkPath | null; sheen: SkPath;
  /** (FrontBoom3) the gathered hair behind the head and neck (a ponytail's, a bun's edge), or null. */
  hairBack: SkPath | null;
  /* neck and jaw */ neck: SkPath; jawShadow: SkPath; jaw: SkPath; scm: SkPath;
  /* brows and eyes */ brows: SkPath[]; eyes: SkPath[]; irises: SkPath[]; lids: SkPath[]; creases: SkPath; sockets: SkPath[];
  /* nose */ noseShade: SkPath; noseBridge: SkPath; noseTip: SkPath; alae: SkPath[]; nostrils: SkPath[]; underNose: SkPath; nasolabial: SkPath;
  /* lips */ upperLip: SkPath; lowerLip: SkPath; mouth: SkPath;
  underLip: SkPath;
  chinLight: SkPath;
  lights: SkPath[];
  shadeSide: SkPath;
  formsDark: SkPath[];
  formsLight: SkPath[];
  /** The skull's inner rim: the head's sides turning away from the viewer. */
  turn: SkPath;
  shirt: SkPath;
  collar: SkPath;
  collarShadow: SkPath;
  placket: SkPath | null;
  buttons: SkPath | null;
  belt: SkPath | null;
  buckle: SkPath | null;
  blouse: SkPath | null;
  shirtFolds: SkPath;
  trousers: SkPath;
  legs: SkPath[];
  thighs: SkPath[];
  knees: SkPath[];
  creasesLeg: SkPath;
  legFolds: SkPath;
  kneeLights: SkPath[];
  legGap: SkPath | null;
  shoes: { upper: SkPath; sole: SkPath; toeLight: SkPath; contact: SkPath }[];
  arms: ArmP[];
  jacket: { body: SkPath; faces: SkPath; cutEdges: SkPath; rolls: SkPath; notches: SkPath; button: SkPath; pockets: SkPath; hem: SkPath; folds: SkPath } | null;
};

const many = (ps: readonly Poly[], closed = true): SkPath => {
  const p = smoothClosed([], 0.5);
  for (const q of ps) p.addPath(closed ? smoothClosed(q, 0.5) : smoothOpen(q));
  return p;
};

const cache = new WeakMap<FrontPlan, FrontPaths>();
export function frontPaths(F: FrontPlan): FrontPaths {
  const hit = cache.get(F);
  if (hit) return hit;
  const h = F.head;
  const collar = many(F.collar);
  const collarShadow = op(
    (() => {
      const q = collar.copy();
      q.offset(-LIGHT.u * 7, -LIGHT.v * 7);
      return q;
    })(),
    collar,
    PathOp.Difference,
  );
  const shirt = smoothClosed(F.shirt, 0.45);
  const seat = smoothClosed(F.seat, 0.45);
  const legs = F.legs.map((l) => smoothClosed(l.outline, 0.45));
  const trousers = unionOf(seat, ...legs);
  const out: FrontPaths = {
    skull: smoothClosed(h.skull, 0.5),
    ears: h.ears.map((e) => smoothClosed(e, 0.55)),
    earFolds: h.earFolds.map((e) => smoothOpen(e)),
    hair: smoothClosed(h.hair, 0.45),
    hairBack: h.hairBack && h.hairBack.length ? unionOf(...h.hairBack.map((q) => smoothClosed(q, 0.55))) : null,
    clumps: h.clumps.map((c) => smoothClosed(c, 0.5)),
    part: h.part ? smoothOpen(h.part) : null,
    sheen: smoothOpen(h.sheen),
    neck: smoothClosed(h.neck, 0.5),
    jawShadow: smoothClosed(h.jawShadow, 0.5),
    jaw: smoothOpen(h.jaw),
    scm: many(h.scm, false),
    brows: h.brows.map((b) => smoothClosed(b, 0.5)),
    eyes: h.eyes.map((e) => smoothClosed(e, 0.45)),
    irises: h.irises.map(ellipsePath),
    lids: h.lids.map((l) => smoothClosed(l, 0.4)),
    creases: many(h.lidCreases, false),
    sockets: h.sockets.map(ellipsePath),
    noseShade: smoothClosed(h.noseShade, 0.5),
    noseBridge: ellipsePath(h.noseBridge),
    noseTip: ellipsePath(h.noseTip),
    alae: h.alae.map(ellipsePath),
    nostrils: h.nostrils.map(ellipsePath),
    underNose: ellipsePath(h.underNose),
    nasolabial: many(h.nasolabial, false),
    upperLip: smoothClosed(h.upperLip, 0.4),
    lowerLip: smoothClosed(h.lowerLip, 0.45),
    mouth: smoothOpen(h.mouth),
    underLip: ellipsePath(h.underLip),
    chinLight: ellipsePath(h.chinLight),
    lights: h.lights.map(ellipsePath),
    shadeSide: smoothClosed(h.shadeSide, 0.5),
    formsDark: h.forms.dark.map(ellipsePath),
    formsLight: h.forms.light.map(ellipsePath),
    turn: (() => {
      const sk = smoothClosed(h.skull, 0.5);
      const inner = sk.copy();
      const b = sk.getBounds();
      const cx0 = b.x + b.width / 2;
      const cy0 = b.y + b.height / 2;
      const m = Skia.Matrix();
      m.translate(cx0, cy0);
      m.scale(0.86, 0.93);
      m.translate(-cx0, -cy0);
      inner.transform(m);
      return op(sk, inner, PathOp.Difference);
    })(),
    shirt,
    collar,
    collarShadow,
    placket: F.placket ? smoothOpen(F.placket) : null,
    buttons: F.buttons.length
      ? (() => {
          const p = smoothClosed([], 0.5);
          for (const b of F.buttons) p.addCircle(b.u + 3, b.v, 4.2);
          return p;
        })()
      : null,
    belt: F.belt ? op(smoothClosed(F.belt, 0.3), unionOf(shirt, seat), PathOp.Intersect) : null,
    buckle: F.buckle ? smoothClosed(F.buckle, 0.15) : null,
    blouse: F.blouse ? op(smoothClosed(F.blouse, 0.4), shirt, PathOp.Intersect) : null,
    shirtFolds: many(F.shirtFolds),
    trousers,
    legs,
    thighs: F.legs.filter((l) => l.thigh).map((l) => smoothClosed(l.thigh!, 0.5)),
    knees: F.legs.filter((l) => l.knee).map((l) => ellipsePath(l.knee!)),
    creasesLeg: many(
      F.legs.map((l) => l.crease),
      false,
    ),
    legFolds: many(F.legs.flatMap((l) => l.folds)),
    kneeLights: F.legs.map((l) => ellipsePath(l.kneeLight)),
    legGap: F.legGap ? smoothClosed(F.legGap, 0.5) : null,
    shoes: F.shoes.map((s) => ({ upper: smoothClosed(s.upper, 0.4), sole: smoothClosed(s.sole, 0.2), toeLight: ellipsePath(s.toeLight), contact: ellipsePath(s.contact) })),
    arms: F.arms.map((a, i) => {
      const js = F.jacket ? F.jacket.sleeves[i] : null;
      return {
        sleeve: smoothClosed(a.sleeve, 0.45),
        armhole: smoothOpen(a.armhole),
        cuff: smoothClosed(a.cuff, 0.3),
        cuffRim: smoothOpen(a.cuffRim),
        cuffSeam: smoothOpen(a.cuffSeam),
        folds: many(a.folds),
        // (the hand's own outline runs on up under the cuff: no separate wrist piece, which shows as a block)
        hand: artPaths(a.hand, null),
        jacket: js ? { outline: smoothClosed(js.outline, 0.4), endRim: smoothOpen(js.endRim), folds: many(js.folds) } : null,
      };
    }),
    jacket: F.jacket
      ? {
          body: unionOf(...F.jacket.body.map((q) => smoothClosed(q, 0.4))),
          faces: many(F.jacket.faces),
          cutEdges: many(F.jacket.cutEdges, false),
          rolls: many(F.jacket.rolls, false),
          notches: many(F.jacket.notches),
          button: ellipsePath(F.jacket.button),
          pockets: many(F.jacket.pockets, false),
          hem: smoothOpen(F.jacket.hem),
          folds: many(F.jacket.folds),
        }
      : null,
  };
  cache.set(F, out);
  return out;
}

/* ── the cloth's light on the torso ── */

function TorsoLight({ path, F, mat }: { path: SkPath; F: FrontPlan; mat: Material }) {
  const [s, e] = across(F.axis[0], F.axis[1], 190);
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

/* ── the head ── */

function HeadFront({ F, P }: { F: FrontPlan; P: FrontPaths }) {
  const { MAT, HEAD_SKIN, LIP } = useLook();
  const h = F.head;
  const c = h.c;
  const R = h.r * 0.72;
  const hairLight = (
    <LinearGradient start={vec(c.u + LIGHT.u * h.r, c.v + LIGHT.v * h.r)} end={vec(c.u - LIGHT.u * h.r, c.v - LIGHT.v * h.r)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
  );
  return (
    <Group>
      {/* the ears, behind the side of the head (their roots hidden by the cheek) */}
      {P.ears.map((e, i) => (
        <Form key={`e${i}`} path={e} mat={HEAD_SKIN} round={{ c, r: R }} rim={2} edge={0.4}>
          <Path path={e} color={MAT.skin.deep} opacity={0.16} />
          <Path path={P.earFolds[i]} style="stroke" strokeWidth={3} strokeCap="round" color={MAT.skin.deep} opacity={0.4}>
            <Blur mm={1.2} />
          </Path>
        </Form>
      ))}
      <Form path={P.skull} mat={HEAD_SKIN} round={{ c, r: R }} rim={5} edge={0.8}>
        {/* the face's shadow side (the viewer's right), the planes turning from the light */}
        <Soft path={P.shadeSide} color={MAT.skin.deep} opacity={0.16} blur={14} />
        {/* the head turning away at its sides, and the face's own planes */}
        <Soft path={P.turn} color={MAT.skin.deep} opacity={0.22} blur={9} />
        {P.formsDark.map((d, i) => (
          <Soft key={`fd${i}`} path={d} color={MAT.skin.deep} opacity={0.2} blur={6} />
        ))}
        {P.formsLight.map((l, i) => (
          <Soft key={`fl${i}`} path={l} color={MAT.skin.rim} opacity={0.16} blur={5} />
        ))}
        {P.lights.map((l, i) => (
          <Soft key={`l${i}`} path={l} color={MAT.skin.rim} opacity={i === 0 ? 0.12 : 0.16} blur={i === 2 ? 2.5 : 6} />
        ))}
        {P.sockets.map((s, i) => (
          <Soft key={`s${i}`} path={s} color={MAT.skin.deep} opacity={0.38} blur={5} />
        ))}
        {/* the nose: the shadow side, the bridge's and the tip's light, the wings, the nostrils, its shadow */}
        <Soft path={P.noseShade} color={MAT.skin.deep} opacity={0.3} blur={3} />
        <Soft path={P.noseBridge} color={MAT.skin.rim} opacity={0.22} blur={2} />
        <Soft path={P.noseTip} color={MAT.skin.rim} opacity={0.2} blur={2.4} />
        {P.alae.map((a, i) => (
          <Soft key={`a${i}`} path={a} color={MAT.skin.deep} opacity={i === 1 ? 0.22 : 0.12} blur={2.2} />
        ))}
        {P.nostrils.map((n, i) => (
          <Path key={`n${i}`} path={n} color={MAT.skin.deep} opacity={0.62}>
            <Blur mm={0.6} />
          </Path>
        ))}
        <Soft path={P.underNose} color={MAT.skin.deep} opacity={0.22} blur={2.4} />
        <Path path={P.nasolabial} style="stroke" strokeWidth={3} strokeCap="round" color={MAT.skin.deep} opacity={0.12}>
          <Blur mm={1.8} />
        </Path>
        {/* the lips: the upper in a little shade (it turns down), the lower catching the light */}
        <Path path={P.upperLip} color={LIP} opacity={0.5} />
        <Path path={P.upperLip} color="#2a140e" opacity={0.14} />
        <Path path={P.lowerLip} color={LIP} opacity={0.4} />
        <Path path={P.mouth} style="stroke" strokeWidth={1.4} strokeCap="round" color={MAT.skin.deep} opacity={0.72} />
        <Soft path={P.underLip} color={MAT.skin.deep} opacity={0.3} blur={1.8} />
        <Soft path={P.chinLight} color={MAT.skin.rim} opacity={0.14} blur={4} />
        {/* the eyes: the white in the socket's shade, the iris, the upper lid's dark edge, its crease */}
        {P.eyes.map((e, i) => (
          <Group key={`y${i}`}>
            <Path path={e} color="#d6c8bd" opacity={0.7} />
            <Group clip={e}>
              <Path path={P.irises[i]} color="#2c1d16" opacity={0.92} />
              <Path path={e} color="#1a0f0a" opacity={0.12} />
            </Group>
            <Path path={P.lids[i]} color={MAT.hair.edge} opacity={0.85} />
          </Group>
        ))}
        <Path path={P.creases} style="stroke" strokeWidth={1.1} strokeCap="round" color={MAT.skin.deep} opacity={0.38} />
        {P.brows.map((b, i) => (
          <Path key={`b${i}`} path={b} color={MAT.hair.form[2]} opacity={0.8}>
            <Blur mm={0.7} />
          </Path>
        ))}
      </Form>
      {/* THE HAIR: one calm shape, its strands along the growth, a sheen over the crown */}
      <Soft path={P.hair} color={MAT.skin.deep} opacity={0.3} blur={2.5} clip={P.skull} />
      <Path path={P.hair}>
        {hairLight}
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
        {P.part ? (
          <Path path={P.part} style="stroke" strokeWidth={2.4} strokeCap="round" color={MAT.hair.deep} opacity={0.3}>
            <Blur mm={0.8} />
          </Path>
        ) : null}
        <Path path={P.sheen} style="stroke" strokeWidth={10} strokeCap="round" color={MAT.hair.rim} opacity={0.2}>
          <Blur mm={4} />
        </Path>
      </Group>
    </Group>
  );
}

/* ── the arm ── */

function ArmFront({ a, P, F }: { a: FrontArm; P: ArmP; F: FrontPlan }) {
  const { MAT } = useLook();
  const J = useJacket();
  const shirtBody = frontPaths(F).shirt;
  // the sleeve's own cylinder light fades in below the shoulder: at the top it is the shirt's one light
  const f0 = { u: a.shoulder.u, v: a.shoulder.v - 10 };
  const f1 = { u: a.shoulder.u, v: a.shoulder.v + 150 };
  const sleeveForm = (path: SkPath, mat: Material, w: number, folds: SkPath) => (
    <Group>
      <TorsoLight path={path} F={F} mat={mat} />
      <Mask
        mode="alpha"
        mask={
          <Path path={path}>
            <LinearGradient start={vec(f0.u, f0.v)} end={vec(f1.u, f1.v)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']} />
          </Path>
        }
      >
        <Form path={path} mat={mat} axis={a.upperAxis} w={w} rim={5} edge={0} fall={0.1} />
      </Mask>
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
      {/* an outline only where the sleeve is the figure's silhouette */}
      <Group clip={shirtBody} invertClip>
        <Path path={P.sleeve} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      </Group>
      {P.jacket ? (
        <Group>
          {sleeveForm(P.jacket.outline, J, 48, P.jacket.folds)}
          <Group clip={frontPaths(F).jacket?.body ?? shirtBody} invertClip>
            <Path path={P.jacket.outline} style="stroke" strokeWidth={1} color={J.edge} opacity={0.6} />
          </Group>
        </Group>
      ) : null}
      {/* the hand, its wrist running up under the cuff */}
      <AuthoredHand a={P.hand} />
      {/* the cuff over the wrist: its soft shadow on the skin just below it, the band, its seam, its rim */}
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

/* ── the legs and shoes ── */

function Shoes({ P }: { P: FrontPaths }) {
  const { MAT } = useLook();
  return (
    <Group>
      {P.shoes.map((s, i) => (
        <Group key={i}>
          <Soft path={s.contact} opacity={0.55} blur={6} />
          <Form path={s.upper} mat={MAT.leather} rim={4} edge={0.9}>
            <Soft path={s.toeLight} color="#fff0e2" opacity={0.18} blur={3} />
          </Form>
          <Path path={s.sole}>
            <LinearGradient start={vec(0, s.sole.getBounds().y)} end={vec(0, s.sole.getBounds().y + s.sole.getBounds().height)} colors={[SOLE.top, SOLE.bottom]} />
          </Path>
          <Path path={s.sole} style="stroke" strokeWidth={0.8} color={SOLE.edge} opacity={0.6} />
        </Group>
      ))}
    </Group>
  );
}

function Trousers({ F, P }: { F: FrontPlan; P: FrontPaths }) {
  const { MAT, CLOTH } = useLook();
  return (
    <Group>
      <Form path={P.trousers} mat={CLOTH} axis={F.axis} w={190} rim={5}>
        {P.legs.map((l, i) => (
          <Group key={i} clip={l}>
            <Path path={l}>
              <LinearGradient start={vec(across(F.legs[i].axis[0], F.legs[i].axis[1], 60)[0].u, across(F.legs[i].axis[0], F.legs[i].axis[1], 60)[0].v)} end={vec(across(F.legs[i].axis[0], F.legs[i].axis[1], 60)[1].u, across(F.legs[i].axis[0], F.legs[i].axis[1], 60)[1].v)} colors={CLOTH.form} positions={CLOTH.pos} />
              <Blur mm={5} />
            </Path>
          </Group>
        ))}
        {P.legGap ? <Soft path={P.legGap} color={MAT.trousers.deep} opacity={0.35} blur={10} /> : null}
        {P.kneeLights.map((k, i) => (
          <Soft key={i} path={k} color={MAT.trousers.rim} opacity={0.12} blur={8} />
        ))}
        <Path path={P.creasesLeg} style="stroke" strokeWidth={2.4} strokeCap="round" color={MAT.trousers.rim} opacity={0.16}>
          <Blur mm={1.2} />
        </Path>
        <Folds path={P.legFolds} mat={MAT.trousers} opacity={0.5} />
        {F.flySeam ? (
          <Group>
            {/* the fly: its fold a soft shade, its stitch line a fine light dash beside it */}
            <Path path={smoothOpen(F.flySeam)} style="stroke" strokeWidth={2.2} strokeCap="round" color={MAT.trousers.deep} opacity={0.4}>
              <Blur mm={0.8} />
            </Path>
            <Group transform={[{ translateX: 3 }]}>
              <Path path={smoothOpen(F.flySeam)} style="stroke" strokeWidth={0.7} strokeCap="round" color={MAT.trousers.rim} opacity={0.3} />
            </Group>
          </Group>
        ) : null}
      </Form>
      {/* the hem's soft shadow on the shoe */}
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

function Thighs({ F, P }: { F: FrontPlan; P: FrontPaths }) {
  const { MAT, CLOTH } = useLook();
  const legs = F.legs.filter((l) => l.thigh);
  return (
    <Group>
      {P.thighs.map((t, i) => {
        const l = legs[i];
        const b = t.getBounds();
        const axis: [Pt, Pt] = [{ u: b.x + b.width / 2, v: b.y }, { u: l.knee ? l.knee.c.u : b.x + b.width / 2, v: b.y + b.height }];
        return (
          <Group key={i}>
            {/* its soft shadow on the shin below the knee (FrontBoom3: a soft turn under the knee, never a step) */}
            <Group clip={P.legs[F.legs.indexOf(l)]}>
              <Group transform={[{ translateX: -LIGHT.u * 2 }, { translateY: 5 }]}>
                <Path path={t} color="#000" opacity={0.2}>
                  <Blur mm={6} />
                </Path>
              </Group>
            </Group>
            {/* (the knee's lower edge over the shin: no hard line — the same cloth turning under the knee) */}
            <Form path={t} mat={CLOTH} axis={axis} w={90} rim={5} edge={0.9} fall={0.16} over={P.legs[F.legs.indexOf(l)]}>
              {/* the thigh's top faces up toward the light; the knee's front a soft swell */}
              <Soft path={P.kneeLights[F.legs.indexOf(l)]} color={MAT.trousers.rim} opacity={0.16} blur={14} />
              {P.knees[i] ? <Soft path={P.knees[i]} color={MAT.trousers.rim} opacity={0.12} blur={8} /> : null}
            </Form>
          </Group>
        );
      })}
    </Group>
  );
}

/* ── the torso ── */

function Torso({ F, P }: { F: FrontPlan; P: FrontPaths }) {
  const { MAT, HEAD_SKIN } = useLook();
  const h = F.head;
  return (
    <Group>
      {/* the neck: a column in the head's own light, the jaw's shadow, the sternomastoids */}
      <Form path={P.neck} mat={HEAD_SKIN} round={{ c: h.c, r: h.r * 0.72 }} rim={4} edge={0.8}>
        <Path path={P.jawShadow} color={MAT.skin.deep} opacity={0.3}>
          <Blur mm={6} />
        </Path>
        <Path path={P.scm} style="stroke" strokeWidth={6} strokeCap="round" color={MAT.skin.deep} opacity={0.1}>
          <Blur mm={3} />
        </Path>
      </Form>
      <TorsoLight path={P.shirt} F={F} mat={MAT.shirt} />
      <Group clip={P.shirt}>
        <Folds path={P.shirtFolds} mat={MAT.shirt} opacity={0.45} />
        <Soft path={P.collarShadow} color={MAT.shirt.deep} opacity={0.45} blur={3} />
        {P.placket ? <Path path={P.placket} style="stroke" strokeWidth={1.2} strokeCap="round" color={MAT.shirt.deep} opacity={0.42} /> : null}
        {P.buttons ? <Path path={P.buttons} color={MAT.shirt.rim} opacity={0.35} /> : null}
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
          {P.buckle ? (
            <Group>
              <Path path={P.buckle} style="stroke" strokeWidth={4} color="#8b9099" />
              <Path path={P.buckle} style="stroke" strokeWidth={1.4} color="#d9dce2" opacity={0.6} transform={[{ translateX: LIGHT.u * 1.2 }, { translateY: LIGHT.v * 1.2 }]} />
              {/* (FrontBoom3: "the buckle two white bars with a gap") a whole frame buckle: its prong across the
                  middle into the belt's tongue */}
              {(() => {
                const b = P.buckle.getBounds();
                const prong = Skia.Path.Make();
                prong.moveTo(b.x + 2, b.y + b.height / 2);
                prong.lineTo(b.x + b.width * 0.62, b.y + b.height / 2);
                return <Path path={prong} style="stroke" strokeWidth={2.4} strokeCap="round" color="#9aa0aa" />;
              })()}
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
              <TorsoLight path={P.blouse} F={F} mat={MAT.shirt} />
            </Group>
          ) : null}
        </Group>
      ) : null}
      <Form path={P.collar} mat={MAT.shirt} axis={F.axis} w={80} rim={0} edge={0.9}>
        <Group transform={[{ translateX: LIGHT.u * 3 }, { translateY: LIGHT.v * 3 }]}>
          <Path path={P.collar} style="stroke" strokeWidth={2} color={MAT.shirt.rim} opacity={0.18} />
        </Group>
      </Form>
    </Group>
  );
}

function JacketBody({ F, P }: { F: FrontPlan; P: NonNullable<FrontPaths['jacket']> }) {
  const J = useJacket();
  const shirt = frontPaths(F).shirt;
  return (
    <Group>
      {/* its soft shadow on the shirt in the V */}
      <Group clip={shirt}>
        <Group transform={[{ translateX: -LIGHT.u * 5 }, { translateY: -LIGHT.v * 5 }]}>
          <Path path={P.body} color="#000" opacity={0.4}>
            <Blur mm={3} />
          </Path>
        </Group>
      </Group>
      <TorsoLight path={P.body} F={F} mat={J} />
      <Group clip={P.body}>
        <Folds path={P.folds} mat={J} opacity={0.45} />
        {/* the lapels and the collar turned back: standing a little off the body, facing the light a little more */}
        <Group transform={[{ translateX: -LIGHT.u * 3 }, { translateY: -LIGHT.v * 3 }]}>
          <Path path={P.faces} color={J.deep} opacity={0.45}>
            <Blur mm={2.2} />
          </Path>
        </Group>
      </Group>
      <TorsoLight path={P.faces} F={F} mat={J} />
      <Path path={P.faces} color={J.rim} opacity={0.12} />
      <Path path={P.cutEdges} style="stroke" strokeWidth={1.2} strokeJoin="round" strokeCap="round" color={J.edge} opacity={0.75} />
      {/* (FrontBoom3: "black triangles at the lapel notches read as holes") the notch is the cloth's own shade */}
      <Path path={P.notches} color={J.deep} opacity={0.38}>
        <Blur mm={1} />
      </Path>
      <Group transform={[{ translateX: LIGHT.u * 1.6 }, { translateY: LIGHT.v * 1.6 }]}>
        <Path path={P.rolls} style="stroke" strokeWidth={2.4} strokeCap="round" color={J.rim} opacity={0.24}>
          <Blur mm={0.8} />
        </Path>
      </Group>
      <Path path={P.rolls} style="stroke" strokeWidth={1.1} strokeCap="round" color={J.edge} opacity={0.7} />
      <Group clip={P.body}>
        <Path path={P.pockets} style="stroke" strokeWidth={1.6} strokeCap="round" strokeJoin="round" color={J.deep} opacity={0.6} />
        <Group transform={[{ translateX: LIGHT.u * 2 }, { translateY: LIGHT.v * 2 }]}>
          <Path path={P.hem} style="stroke" strokeWidth={2} strokeCap="round" color={J.rim} opacity={0.14} />
        </Group>
      </Group>
      <Path path={P.button} color="#121317" />
      <Path path={P.button} style="stroke" strokeWidth={1} color={J.rim} opacity={0.3} transform={[{ translateX: LIGHT.u * 1.2 }, { translateY: LIGHT.v * 1.2 }]} />
      <Path path={P.body} style="stroke" strokeWidth={1} strokeJoin="round" color={J.edge} opacity={0.6} />
    </Group>
  );
}

/** (FrontBoom3) the gathered hair behind the head and the neck: the hair's own light, its strands along it. */
function HairBack({ F, P }: { F: FrontPlan; P: FrontPaths }) {
  const { MAT } = useLook();
  const h = F.head;
  const c = h.c;
  if (!P.hairBack) return null;
  const b = P.hairBack.getBounds();
  return (
    <Group>
      <Path path={P.hairBack}>
        <LinearGradient start={vec(b.x, c.v - h.r)} end={vec(b.x + b.width, c.v + h.r * 1.4)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
      </Path>
      <Group clip={P.hairBack}>
        <Path path={P.hairBack} style="stroke" strokeWidth={5} color={MAT.hair.deep} opacity={0.35}>
          <Blur mm={2} />
        </Path>
      </Group>
      <Path path={P.hairBack} style="stroke" strokeWidth={0.8} color={MAT.hair.edge} opacity={0.45} />
    </Group>
  );
}

/** The whole person from the front, full detail. `head` false: the body only (a step draws the head). */
export function FigureV2Front({ F, head = true, arms = true }: { F: FrontPlan; head?: boolean; /** false: the body without its arms (a step draws them: the boom operator) */ arms?: boolean }) {
  const P = frontPaths(F);
  return (
    <Group>
      <Shoes P={P} />
      <Trousers F={F} P={P} />
      {head && P.hairBack ? <HairBack F={F} P={P} /> : null}
      <Torso F={F} P={P} />
      {P.jacket ? <JacketBody F={F} P={P.jacket} /> : null}
      {head ? <HeadFront F={F} P={P} /> : null}
      {F.seated ? <Thighs F={F} P={P} /> : null}
      {arms
        ? F.arms.map((a, i) => (
            <ArmFront key={i} a={a} P={P.arms[i]} F={F} />
          ))
        : null}
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
      {a.edges ? <Path path={a.edges} style="stroke" strokeWidth={1} strokeCap="round" color={MAT.skin.edge} opacity={0.4} /> : null}
      <Path path={a.all} style="stroke" strokeWidth={0.9} color={MAT.skin.edge} opacity={0.5} />
    </Group>
  );
}

export function HeadFrontLite({ F, P }: { F: FrontPlan; P: FrontPaths }) {
  const { MAT, HEAD_SKIN, LIP } = useLook();
  const h = F.head;
  const R = h.r * 0.72;
  return (
    <Group>
      {P.ears.map((e, i) => (
        <Round key={`e${i}`} path={e} mat={HEAD_SKIN} c={h.c} r={R} />
      ))}
      <Round path={P.skull} mat={HEAD_SKIN} c={h.c} r={R} />
      <Path path={P.noseShade} color={MAT.skin.deep} opacity={0.18} />
      <Path path={P.turn} color={MAT.skin.deep} opacity={0.14} />
      {P.sockets.map((s, i) => (
        <Path key={`so${i}`} path={s} color={MAT.skin.deep} opacity={0.14} />
      ))}
      {P.eyes.map((e, i) => (
        <Path key={`y${i}`} path={e} color="#d6c8bd" opacity={0.6} />
      ))}
      {P.irises.map((e, i) => (
        <Path key={`i${i}`} path={e} color="#2c1d16" opacity={0.85} />
      ))}
      {P.lids.map((e, i) => (
        <Path key={`l${i}`} path={e} color={MAT.hair.edge} opacity={0.85} />
      ))}
      {P.brows.map((b, i) => (
        <Path key={`b${i}`} path={b} color={MAT.hair.form[2]} opacity={0.8} />
      ))}
      <Path path={P.upperLip} color={LIP} opacity={0.5} />
      <Path path={P.lowerLip} color={LIP} opacity={0.4} />
      <Path path={P.mouth} style="stroke" strokeWidth={1.4} strokeCap="round" color={MAT.skin.deep} opacity={0.7} />
      <Path path={P.hair}>
        <LinearGradient start={vec(h.c.u + LIGHT.u * h.r, h.c.v + LIGHT.v * h.r)} end={vec(h.c.u - LIGHT.u * h.r, h.c.v - LIGHT.v * h.r)} colors={[MAT.hair.form[1], MAT.hair.form[2], MAT.hair.form[3]]} />
      </Path>
    </Group>
  );
}

export function FigureV2FrontLite({ F, head = true, fullHead, arms: withArms = true }: { F: FrontPlan; head?: boolean; fullHead?: boolean; arms?: boolean }) {
  const { MAT, HEAD_SKIN, CLOTH } = useLook();
  const J = useJacket();
  const P = frontPaths(F);
  const ax = F.axis;
  const arms = F.arms.map((a, i) => {
    const A = P.arms[i];
    return (
      <Group key={i}>
        <M path={A.sleeve} mat={MAT.shirt} axis={a.upperAxis} w={44} />
        {A.jacket ? <M path={A.jacket.outline} mat={J} axis={a.upperAxis} w={50} /> : null}
        <HandLite a={A.hand} />
        <M path={A.cuff} mat={MAT.shirt} axis={a.foreAxis} w={34} />
      </Group>
    );
  });
  return (
    <Group>
      {P.shoes.map((s, i) => (
        <Group key={`s${i}`}>
          <M path={s.upper} mat={MAT.leather} axis={F.shoes[i].axis} w={30} />
          <Path path={s.sole} color={SOLE.bottom} />
        </Group>
      ))}
      <M path={P.trousers} mat={CLOTH} axis={ax} w={190} />
      {head && P.hairBack ? <M path={P.hairBack} mat={MAT.hair} axis={ax} w={60} /> : null}
      <Round path={P.neck} mat={HEAD_SKIN} c={F.head.c} r={F.head.r * 0.72} />
      <M path={P.shirt} mat={MAT.shirt} axis={ax} w={190} />
      <Path path={P.shirt} style="stroke" strokeWidth={1} color={MAT.shirt.edge} opacity={0.5} />
      {P.placket ? <Path path={P.placket} style="stroke" strokeWidth={1.4} color={MAT.shirt.deep} opacity={0.4} /> : null}
      {P.belt ? <Path path={P.belt} color="#33251c" /> : null}
      {P.buckle ? <Path path={P.buckle} style="stroke" strokeWidth={4} color="#8b9099" /> : null}
      {P.blouse ? <M path={P.blouse} mat={MAT.shirt} axis={ax} w={190} /> : null}
      <M path={P.collar} mat={MAT.shirt} axis={ax} w={80} />
      {P.jacket ? (
        <Group>
          <M path={P.jacket.body} mat={J} axis={ax} w={190} />
          <M path={P.jacket.faces} mat={J} axis={ax} w={190} />
          <Path path={P.jacket.faces} color={J.rim} opacity={0.14} />
          <Path path={P.jacket.cutEdges} style="stroke" strokeWidth={1.4} color={J.edge} opacity={0.8} />
          <Path path={P.jacket.rolls} style="stroke" strokeWidth={1.4} color={J.edge} opacity={0.8} />
          <Path path={P.jacket.button} color="#121317" />
        </Group>
      ) : null}
      {head ? fullHead ? <HeadFront F={F} P={P} /> : <HeadFrontLite F={F} P={P} /> : null}
      {F.seated
        ? P.thighs.map((t, i) => {
            const b = t.getBounds();
            return <M key={`t${i}`} path={t} mat={CLOTH} axis={[{ u: b.x + b.width / 2, v: b.y }, { u: b.x + b.width / 2, v: b.y + b.height }]} w={90} />;
          })
        : null}
      {withArms ? arms : null}
    </Group>
  );
}

/* ── a cast member from the front ── */

export type PersonFrontOpts = { lip?: Pt; jacket?: boolean; /** (FrontBoom4) both arms raised: the trousers' top follows the hips (frontPlan FrontOpts.armsUp) */ armsUp?: boolean };

/** The plan for a cast member on a front pose. */
export function personFrontPlan(pose: PlayerPose, who: CastMember, o: PersonFrontOpts = {}): FrontPlan {
  const opts: FrontOpts = { head: who.head, body: who.body, woman: who.woman, ...(o.lip ? { lip: o.lip } : {}), ...(o.jacket ? { jacket: true } : {}), ...(o.armsUp ? { armsUp: true } : {}) };
  return frontPlan(pose, opts);
}

/** A cast member from the front (full detail at close-up sizes, lite at lesson sizes; a head drawn ≥ 45 pt
 *  tall takes full detail). `dim` fades the whole person as one layer; `head` false leaves the head off. */
export const PersonFrontV2 = memo(function PersonFrontV2({ pose, who, opts = {}, dim = 1, assumePtPerMm, head = true, arms = true }: { pose: PlayerPose; who: CastMember; opts?: PersonFrontOpts; dim?: number; assumePtPerMm?: number; head?: boolean; /** false: the arms are drawn by a step (the boom operator) */ arms?: boolean }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const F = personFrontPlan(pose, who, opts);
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={dim < 1 ? <Paint opacity={dim} /> : undefined}>
          {level === 'lite' ? <FigureV2FrontLite F={F} head={head} arms={arms} fullHead={headPt(pose, ptPerMm) >= FULL_HEAD_PT} /> : <FigureV2Front F={F} head={head} arms={arms} />}
        </Group>
      </FigureLook>
    </FigureScale>
  );
});
