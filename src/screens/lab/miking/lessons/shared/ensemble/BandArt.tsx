/**
 * THE BAND DRAWINGS (group 4) — the stage-plot players and gear in frame S's
 * three views, painted by SeatingArt.tsx's batches (the same materials, the
 * same upper-left light, the same FigureHead figures):
 *
 *   the drum kit     Lab 1's shared kit, whole: from above KitTop and from
 *                    the side KitSide (kitScene/KitSceneArt — the drummer
 *                    included), turned to the drummer's facing; from the hall
 *                    KitFront here, built from the drum and cymbal families
 *                    (DrumExterior, CymbalSide) at the kit's own positions
 *   the guitars      electric guitar and bass on a strap, a seated acoustic
 *                    guitar and a mandolin: a real outline (two bouts, the
 *                    waist, the neck and the headstock) in the plane of the
 *                    top, seen face-on from the hall and edge-on from above
 *   keys             a stage keyboard on an X stand
 *   the tenor sax    neck, body, bow and the upturned bell
 *   gear             the combo and the bass rig (Lab 4's cabinet sizes), the
 *                    floor wedge (a sloped grille facing its player), the DI
 *                    box, a PA box on its stand, a gobo on its feet
 *
 * Nothing floats: every amp, wedge and box stands on the floor; the PA on a
 * tripod; the keyboard on its stand. Static (D8): built once per seating and
 * view (SeatingArt caches the batches). Drawing defaults throughout (sizes
 * from the families where they exist).
 */
import type { ReactElement } from 'react';
import { Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { Vec3 } from '../../../engine/model/types.ts';
import { KitSide, KitTop } from '../kitScene/KitSceneArt';
import { DrumExterior } from '../drums/DrumArt';
import { CymbalSide } from '../cymbals/CymbalArt';
import { KIT_PLACED_CYMBALS } from '../cymbals/cymbalSpec.ts';
import { KIT_DRUMS, KIT_FLOOR_Y, KIT } from '../kitPlanModel.ts';
import { DEG, planDir, uv, type StageView } from './frameS.ts';
import { ampGeom, GEAR_SIZE, GUITAR_POSE, kitOrigin, PA_BOX, rightOf, type GuitarKind } from './bandStage.ts';
import type { Gear, Seat } from './seating.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
type P2 = { u: number; v: number };
const make = () => Skia.Path.Make();

/** The batch SeatingArt paints (its materials by name). */
export type BandBatch = {
  fig: Record<'shirt' | 'trousers' | 'skin' | 'shoe' | 'seat', SkPath>;
  mat: Record<string, SkPath>;
  hair: SkPath;
  stick: SkPath;
  legs: SkPath;
  desks: SkPath;
  holes: SkPath;
  extra: { key: string; el: ReactElement }[];
};
/** SeatingArt's path builders (mm). */
export type BandTools = {
  P: (u: number, v: number) => P2;
  capsule: (a: P2, b: P2, r: number) => SkPath;
  taper: (a: P2, b: P2, ra: number, rb: number) => SkPath;
  ellipse: (c: P2, rx: number, ry: number) => SkPath;
  rr: (x0: number, y0: number, x1: number, y1: number, r: number) => SkPath;
  poly: (pts: readonly P2[]) => SkPath;
  line: (p: SkPath, a: P2, b: P2) => SkPath;
  flare: (a: P2, b: P2, ra: number, rb: number) => SkPath;
};
/** A seat's plan helpers (local: x = the player's right, y = BACK). */
export type PlanHelp = BandTools & { put: (into: SkPath, local: SkPath) => void; arm: (pts: P2[]) => void; hand: (c: P2) => void; LS: P2; RS: P2 };
/** A seat's elevation helpers (SeatingArt.elevSeat). */
export type ElevHelp = BandTools & {
  Q: (right: number, fwd: number, up: number) => P2;
  X: (right: number, fwd: number) => number;
  arm: (pts: P2[]) => void;
  hand: (c: P2) => void;
  shL: P2;
  shR: P2;
  g: number;
  o: P2;
  front: boolean;
  rightU: number;
  fwdU: number;
};

/** The kinds this file draws (SeatingArt's switch hands them over). The
 *  drum kit is one kind for groups 4 and 5; the standing tenor is
 *  `tenorSax` (group 5's section saxes are SeatingArt's `sax`/`bariSax`); the
 *  singer is one kind for groups 2 and 4, drawn by SeatingArt (group 2). */
export const BAND_KINDS = new Set(['drumkit', 'eguitar', 'ebass', 'keys', 'tenorSax', 'aguitar', 'mandolin']);

/* ═══════════════ a guitar-family outline in the plane of its top ═══════════════ */
/** Half-width of a body at s (0 = tail, 1 = neck end): lower bout, waist,
 *  upper bout (proportions of the family drawings; a drawing default). */
function halfWidth(s: number, lower: number, waist: number, upper: number): number {
  const lb = lower * Math.sin(Math.PI * Math.min(1, s / 0.55)) ** 0.6;
  const ub = upper * Math.sin(Math.PI * Math.max(0, Math.min(1, (s - 0.35) / 0.65))) ** 0.6;
  const w = s < 0.5 ? lb : Math.max(ub, waist + (lb - waist) * Math.max(0, (0.62 - s) / 0.12));
  return Math.max(4, s > 0.45 && s < 0.65 ? Math.min(w, waist + (Math.abs(s - 0.55) / 0.1) * (lower - waist)) : w);
}
type Body = { L: number; lower: number; waist: number; upper: number; neck: number; neckW: number; head: number };
/** Body proportions (the lengths are bandStage.GUITAR_POSE's, so the spots
 *  the lessons aim land on the drawing). */
const BODIES: Record<GuitarKind, Body> = {
  eguitar: { L: GUITAR_POSE.eguitar.L, lower: 165, waist: 120, upper: 140, neck: GUITAR_POSE.eguitar.neck, neckW: 26, head: 190 },
  ebass: { L: GUITAR_POSE.ebass.L, lower: 175, waist: 125, upper: 140, neck: GUITAR_POSE.ebass.neck, neckW: 28, head: 200 },
  aguitar: { L: GUITAR_POSE.aguitar.L, lower: 200, waist: 125, upper: 150, neck: GUITAR_POSE.aguitar.neck, neckW: 28, head: 180 },
  mandolin: { L: GUITAR_POSE.mandolin.L, lower: 125, waist: 115, upper: 120, neck: GUITAR_POSE.mandolin.neck, neckW: 18, head: 140 },
};
/** The outline points (s along the axis from the tail, t across) and the
 *  neck's end, mapped by `at` into a view. */
function guitarPaths(k: keyof typeof BODIES, at: (s: number, t: number) => P2, T: BandTools): { body: SkPath; neck: SkPath; head: SkPath; hole: SkPath | null; bridge: SkPath } {
  const b = BODIES[k];
  const n = 28;
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    pts.push(at(s * b.L, halfWidth(s, b.lower, b.waist, b.upper)));
  }
  for (let i = n; i >= 0; i--) {
    const s = i / n;
    pts.push(at(s * b.L, -halfWidth(s, b.lower, b.waist, b.upper)));
  }
  const body = T.poly(pts);
  const neck = T.poly([at(b.L - 30, b.neckW), at(b.L + b.neck, b.neckW * 0.85), at(b.L + b.neck, -b.neckW * 0.85), at(b.L - 30, -b.neckW)]);
  const head = T.poly([at(b.L + b.neck, b.neckW * 1.3), at(b.L + b.neck + b.head, b.neckW * 1.6), at(b.L + b.neck + b.head, -b.neckW * 0.9), at(b.L + b.neck, -b.neckW * 1.3)]);
  const acoustic = k === 'aguitar' || k === 'mandolin';
  let hole: SkPath | null = null;
  if (acoustic) {
    hole = make();
    const c = at(b.L * 0.62, 0);
    const e = at(b.L * 0.62 + (k === 'aguitar' ? 45 : 30), 0);
    const r = Math.max(6, Math.hypot(e.u - c.u, e.v - c.v));
    hole.addCircle(c.u, c.v, r);
  }
  const bridge = T.poly([at(b.L * 0.2, b.lower * 0.45), at(b.L * 0.2 + 22, b.lower * 0.45), at(b.L * 0.2 + 22, -b.lower * 0.45), at(b.L * 0.2, -b.lower * 0.45)]);
  return { body, neck, head, hole, bridge };
}
const BODY_MAT: Record<keyof typeof BODIES, string> = { eguitar: 'sunburst', ebass: 'cherry', aguitar: 'maple', mandolin: 'varnish' };

/* ═══════════════ PLAN (from above) ═══════════════ */

/** The kit from above: Lab 1's shared kit turned to the drummer's facing. */
function kitPlan(b: BandBatch, s: Seat) {
  const O = kitOrigin(s);
  const a = (s.face - 90) * DEG;
  b.extra.push({
    key: `kit:${s.id}:plan`,
    el: (
      <Group key={`kit:${s.id}:plan`} transform={[{ translateX: O.x }, { translateY: O.z }, { rotate: a }]}>
        <KitTop keepOuts={false} />
      </Group>
    ),
  });
}

/** A drum kit seat draws everything itself (the kit includes its drummer). */
export function bandPlanWhole(b: BandBatch, s: Seat): boolean {
  if (s.kind !== 'drumkit') return false;
  kitPlan(b, s);
  return true;
}

/** The instrument of a band seat from above (the figure is SeatingArt's). */
export function bandPlanInstrument(b: BandBatch, s: Seat, H: PlanHelp) {
  const { put, arm, hand, LS, RS, P } = H;
  switch (s.kind) {
    case 'eguitar':
    case 'ebass':
    case 'aguitar':
    case 'mandolin': {
      // The top faces forward, so from above the body is its rim: a strip
      // across the player's front, the neck out to the left and forward.
      // The pose is bandStage.GUITAR_POSE's (the elevations and the lessons'
      // spot targets use the same numbers): the tail at the right, the top
      // `fwd` ahead, the axis rising to the left — foreshortened from above.
      const k = s.kind;
      const B = BODIES[k];
      const G = GUITAR_POSE[k];
      const c = Math.cos(G.ang * DEG);
      const depth = k === 'aguitar' ? 100 : k === 'mandolin' ? 60 : 45;
      const y0 = -G.fwd + depth / 2;
      const x1 = G.tailR;
      const x0 = x1 - c * B.L;
      put(b.mat[BODY_MAT[k]], H.rr(x0, y0 - depth, x1, y0, 22));
      const nEnd = P(x0 - c * B.neck, y0 - depth / 2);
      put(b.mat.maple, H.capsule(P(x0 + 20, y0 - depth / 2), nEnd, B.neckW * 0.55));
      put(b.mat.ebony, H.capsule(nEnd, P(nEnd.u - c * B.head, nEnd.v), B.neckW * 0.75));
      const fret = P(x0 - c * B.neck * 0.55, y0 - depth / 2);
      arm([LS, P(-250, -60), fret]);
      hand(fret);
      const pick = P(x1 - c * B.L * 0.55, y0 - depth - 20);
      arm([RS, P(230, -40), pick]);
      hand(pick);
      break;
    }
    case 'keys': {
      // A stage keyboard on an X stand, its keys toward the player.
      put(b.mat.piano, H.rr(-640, -620, 640, -300, 26));
      put(b.mat.ivory, H.rr(-610, -430, 610, -310, 10));
      for (let i = -600; i <= 600; i += 96) put(b.holes, H.rr(i + 30, -430, i + 62, -372, 4));
      put(b.legs, H.line(make(), P(-480, -650), P(-260, -270)));
      put(b.legs, H.line(make(), P(-480, -270), P(-260, -650)));
      put(b.legs, H.line(make(), P(260, -650), P(480, -270)));
      put(b.legs, H.line(make(), P(260, -270), P(480, -650)));
      arm([LS, P(-220, -150), P(-200, -340)]);
      arm([RS, P(220, -150), P(220, -340)]);
      hand(P(-200, -340));
      hand(P(220, -340));
      break;
    }
    case 'tenorSax': {
      // The neck from the lips, the body down in front of the player's right,
      // the bell turned up and forward.
      put(b.mat.brass, H.taper(P(0, -110), P(70, -200), 14, 22));
      put(b.mat.brass, H.taper(P(70, -200), P(140, -250), 30, 46));
      put(b.mat.brass, H.ellipse(P(150, -265), 70, 62));
      put(b.holes, H.ellipse(P(150, -268), 48, 42));
      arm([LS, P(-120, -150), P(60, -190)]);
      hand(P(60, -190));
      arm([RS, P(260, -110), P(170, -215)]);
      hand(P(170, -215));
      break;
    }
  }
}

/* ═══════════════ FRONT and SECTION ═══════════════ */

/** The kit from the hall: Lab 1's shared kit seen from in front (K's
 *  positions projected: u = x_K·sin F + z_K·cos F), built from the drum and
 *  cymbal families. Drawn over the drummer (SeatingArt's figure). */
function KitFront({ face }: { face: number }) {
  const sF = Math.sin(face * DEG);
  const cF = Math.cos(face * DEG);
  const U = (p: Vec3) => p.x * sF + p.z * cF;
  const Y = (p: Vec3) => p.y - KIT_FLOOR_Y;
  const R = KIT.kick.R;
  const rx = R * Math.max(0.2, Math.abs(cF));
  const kickU = U({ x: KIT.kick.depth, y: 0, z: 0 });
  const kickY = -KIT_FLOOR_Y;
  const cym = (id: 'crash1' | 'crash2' | 'ride') => KIT_PLACED_CYMBALS[id];
  const stand = (u: number, top: number) => {
    const p = make();
    p.moveTo(u, top);
    p.lineTo(u, -120);
    p.moveTo(u, -160);
    p.lineTo(u - 230, 0);
    p.moveTo(u, -160);
    p.lineTo(u + 230, 0);
    return p;
  };
  const hh = KIT_PLACED_CYMBALS.hihat;
  const drumsBack = (['floor', 'snare'] as const).map((id) => KIT_DRUMS[id]);
  const toms = (['tom1', 'tom2'] as const).map((id) => KIT_DRUMS[id]);
  const legs = make();
  for (const id of ['crash1', 'crash2', 'ride'] as const) legs.addPath(stand(U(cym(id).c), Y(cym(id).c) + 10));
  legs.addPath(stand(U(hh.c), Y(hh.c) + 10));
  legs.addPath(stand(U(KIT_DRUMS.snare.c), Y(KIT_DRUMS.snare.c) + KIT_DRUMS.snare.spec.depth.mm));
  const kick = make();
  kick.addOval(Skia.XYWHRect(kickU - rx - 30, kickY - R - 30, 2 * (rx + 30), 2 * (R + 30)));
  const head = make();
  head.addOval(Skia.XYWHRect(kickU - rx, kickY - R, 2 * rx, 2 * R));
  return (
    <Group>
      <StrokePath path={legs} />
      {drumsBack.map((d) => (
        <Group key={d.spec.id} transform={[{ translateX: U(d.c) }, { translateY: Y(d.c) }]}>
          <DrumExterior spec={d.spec} />
        </Group>
      ))}
      <KickFace hoop={kick} head={head} cx={kickU} cy={kickY} r={R} />
      {toms.map((d) => (
        <Group key={d.spec.id} transform={[{ translateX: U(d.c) }, { translateY: Y(d.c) }]}>
          <DrumExterior spec={d.spec} />
        </Group>
      ))}
      <CymbalSide spec={hh.spec} cx={U(hh.c)} cy={Y(hh.c) + 14} tiltDeg={0} mount={false} />
      <CymbalSide spec={hh.spec} cx={U(hh.c)} cy={Y(hh.c)} tiltDeg={0} />
      {(['ride', 'crash1', 'crash2'] as const).map((id) => (
        <CymbalSide key={id} spec={cym(id).spec} cx={U(cym(id).c)} cy={Y(cym(id).c)} tiltDeg={0} />
      ))}
    </Group>
  );
}
function StrokePath({ path }: { path: SkPath }) {
  return (
    <Group>
      <Path path={path} style="stroke" strokeWidth={22} strokeCap="round" color="#0b0c0f" />
      <Path path={path} style="stroke" strokeWidth={13} strokeCap="round" color="#9aa0ab" />
    </Group>
  );
}
/** The kick's front head from in front: a wood hoop round a coated head. */
function KickFace({ hoop, head, cx, cy, r }: { hoop: SkPath; head: SkPath; cx: number; cy: number; r: number }) {
  return (
    <Group>
      <Path path={hoop}>
        <LinearGradient start={vec(cx - r, cy - r)} end={vec(cx + r, cy + r)} colors={['#c48a4c', '#7a4a20', '#3a220e']} />
      </Path>
      <Path path={head}>
        <RadialGradient c={vec(cx - r * 0.35, cy - r * 0.4)} r={r * 1.6} colors={['#3a3d45', '#1d1f24', '#0c0d10']} />
      </Path>
      <Path path={head} style="stroke" strokeWidth={6} color="#5d616c" />
    </Group>
  );
}

/** A drum kit seat in a section view draws everything itself (KitSide
 *  includes the drummer); true when it did. */
export function bandElevWhole(b: BandBatch, s: Seat, view: 'front' | 'section'): boolean {
  if (s.kind !== 'drumkit' || view !== 'section') return false;
  const O = kitOrigin(s);
  // Section: u = −z = −O.z + x_K·cos F − z_K·sin F. KitSide draws u = x_K
  // (from the drummer's right), so scale u by cos F about the kick's origin
  // (facing the hall, −1: mirrored, as seen from the drummer's left).
  const at = uv('section', { x: O.x, y: s.p.y, z: O.z });
  b.extra.push({
    key: `kit:${s.id}:section`,
    el: (
      <Group key={`kit:${s.id}:section`} transform={[{ translateX: at.u }, { translateY: at.v - KIT_FLOOR_Y }, { scaleX: Math.cos(s.face * DEG) }]}>
        <KitSide keepOuts={false} />
      </Group>
    ),
  });
  return true;
}

/** The instrument of a band seat seen from the hall or from the side. */
export function bandElevInstrument(b: BandBatch, s: Seat, view: 'front' | 'section', H: ElevHelp) {
  const { Q, arm, hand, shL, shR, rightU, fwdU, P } = H;
  switch (s.kind) {
    case 'drumkit': {
      // From the hall (the section is bandElevWhole): the kit over the drummer.
      const O = kitOrigin(s);
      const at = uv('front', { x: O.x, y: s.p.y, z: O.z });
      b.extra.push({
        key: `kit:${s.id}:front`,
        el: (
          <Group key={`kit:${s.id}:front`} transform={[{ translateX: at.u }, { translateY: at.v }]}>
            <KitFront face={s.face} />
          </Group>
        ),
      });
      arm([shL, Q(-260, 200, 900), Q(-180, 420, 820)]);
      arm([shR, Q(260, 200, 900), Q(180, 420, 820)]);
      break;
    }
    case 'eguitar':
    case 'ebass':
    case 'aguitar':
    case 'mandolin': {
      const k = s.kind;
      const seated = k === 'aguitar' || k === 'mandolin';
      // The body's tail at the right hip (standing, on a strap) or on the
      // right thigh (seated); the neck rises to the player's left
      // (bandStage.GUITAR_POSE: the lessons' spots aim at the same points).
      const G = GUITAR_POSE[k];
      const tail = { r: G.tailR, up: G.tailUp };
      const fwd = G.fwd;
      const ang = G.ang * DEG;
      const axis = { r: -Math.cos(ang), up: Math.sin(ang) };
      // Seen face-on, t runs across the body (perpendicular to the axis in the plane).
      const across = (sAx: number, t: number) => {
        const r = tail.r + axis.r * sAx - axis.up * t;
        const up = tail.up + axis.up * sAx + -axis.r * t;
        return Q(r, fwd, up);
      };
      const faceOn = Math.abs(rightU) > 0.35;
      if (faceOn) {
        const g = guitarPaths(k, across, H);
        b.mat[BODY_MAT[k]].addPath(g.body);
        b.mat.maple.addPath(g.neck);
        b.mat.ebony.addPath(g.head);
        if (g.hole) b.holes.addPath(g.hole);
        b.mat.ebony.addPath(g.bridge);
      } else {
        // Edge-on from the side: the rim, a strip as deep as the body.
        const B = BODIES[k];
        const depth = k === 'aguitar' ? 100 : k === 'mandolin' ? 60 : 45;
        const a = Q(tail.r, fwd, tail.up);
        const e = Q(tail.r + axis.r * B.L, fwd, tail.up + axis.up * B.L);
        const d = depth * Math.sign(fwdU || 1);
        b.mat[BODY_MAT[k]].addPath(H.poly([P(a.u, a.v + B.lower * 0.6), P(a.u + d, a.v + B.lower * 0.6), P(e.u + d, e.v - B.upper * 0.7), P(e.u, e.v - B.upper * 0.7)]));
        const ne = Q(tail.r + axis.r * (B.L + B.neck), fwd, tail.up + axis.up * (B.L + B.neck));
        b.mat.maple.addPath(H.capsule(e, ne, 14));
        b.mat.ebony.addPath(H.capsule(ne, P(ne.u, ne.v - B.head * 0.9), 16));
      }
      const fret = across(BODIES[k].L + BODIES[k].neck * 0.55, 0);
      arm([shL, Q(-260, 140, seated ? 820 : 1150), fret]);
      hand(fret);
      const pick = across(BODIES[k].L * 0.55, -BODIES[k].lower * 0.3);
      arm([shR, Q(230, 120, seated ? 820 : 1150), pick]);
      hand(pick);
      break;
    }
    case 'keys': {
      // The keyboard on its X stand, ahead of the player at hip height.
      const us = [H.X(-640, 300), H.X(640, 300), H.X(-640, 620), H.X(640, 620)];
      const u0 = Math.min(...us);
      const u1 = Math.max(...us);
      const top = 960;
      b.mat.piano.addPath(H.rr(u0, H.g - top, u1, H.g - top + 110, 14));
      if (H.front) b.mat.ivory.addPath(H.rr(u0 + 20, H.g - top - 6, u1 - 20, H.g - top + 24, 6));
      const mid = (u0 + u1) / 2;
      const half = (u1 - u0) / 2;
      for (const sx of [-1, 1]) {
        H.line(b.legs, P(mid + sx * half * 0.55, H.g - top + 110), P(mid + sx * half * 0.2, H.g));
        H.line(b.legs, P(mid + sx * half * 0.2, H.g - top + 110), P(mid + sx * half * 0.55, H.g));
      }
      arm([shL, Q(-200, 180, 1150), Q(-190, 360, top + 30)]);
      arm([shR, Q(200, 180, 1150), Q(200, 360, top + 30)]);
      hand(Q(-190, 360, top + 30));
      hand(Q(200, 360, top + 30));
      break;
    }
    case 'tenorSax': {
      // A tenor: the neck from the lips, the body down in front of the
      // player's right to the bow at the knee, the bell turned up.
      const mouth = Q(0, 110, 1540);
      const top = Q(60, 190, 1330);
      const bow = Q(140, 230, 640);
      const bell = Q(210, 250, 820);
      b.mat.brass.addPath(H.taper(mouth, top, 12, 20));
      b.mat.brass.addPath(H.taper(top, bow, 26, 50));
      b.mat.brass.addPath(H.taper(bow, bell, 52, 60));
      b.mat.brass.addPath(H.ellipse(bell, 74, 26));
      b.holes.addPath(H.ellipse(P(bell.u, bell.v - 4), 52, 14));
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        b.mat.silver.addPath(H.ellipse(P(top.u + (bow.u - top.u) * t + 18, top.v + (bow.v - top.v) * t), 10, 10));
      }
      arm([shL, Q(-140, 160, 1150), P(top.u + (bow.u - top.u) * 0.2, top.v + (bow.v - top.v) * 0.2)]);
      arm([shR, Q(260, 120, 1050), P(top.u + (bow.u - top.u) * 0.6, top.v + (bow.v - top.v) * 0.6)]);
      hand(P(top.u + (bow.u - top.u) * 0.2, top.v + (bow.v - top.v) * 0.2));
      hand(P(top.u + (bow.u - top.u) * 0.6, top.v + (bow.v - top.v) * 0.6));
      break;
    }
  }
}

/* ═══════════════ GEAR ═══════════════ */

/** The plan corners of a gear's footprint (x across its front, y back). */
function placeGear(g: Gear) {
  const F = g.face * DEG;
  const m = Skia.Matrix().translate(g.p.x, g.p.z).rotate(F);
  return (into: SkPath, local: SkPath) => {
    const q = local.copy();
    q.transform(m);
    into.addPath(q);
  };
}

/** A piece of gear from above (local: x across, −y toward its front). */
export function bandGearPlan(b: BandBatch, g: Gear, T: BandTools) {
  const put = placeGear(g);
  const S = GEAR_SIZE[g.kind];
  const w = S.w / 2;
  const d = S.d / 2;
  switch (g.kind) {
    case 'combo':
    case 'bassRig': {
      put(b.mat.tolex, T.rr(-w, -d, w, d, 30));
      put(b.mat.cloth, T.rr(-w + 30, -d - 4, w - 30, -d + 26, 8));
      if (g.kind === 'bassRig') {
        // The head on top, flush with the cabinet's front.
        put(b.mat.steel, T.rr(-165, -d + 12, 165, -d + 12 + 250, 18));
        put(b.desks, T.rr(-140, -d + 20, 140, -d + 46, 6));
      } else {
        put(b.desks, T.rr(-w + 40, -d + 6, w - 40, -d + 34, 6));
      }
      put(b.legs, T.line(make(), T.P(-90, 0), T.P(90, 0)));
      break;
    }
    case 'wedge': {
      put(b.mat.tolex, T.rr(-w, -d, w, d, 26));
      put(b.mat.cloth, T.rr(-w + 26, -d + 18, w - 26, d * 0.35, 14));
      break;
    }
    case 'di': {
      put(b.mat.steel, T.rr(-w, -d, w, d, 12));
      put(b.holes, T.ellipse(T.P(-25, -d + 18), 12, 9));
      put(b.holes, T.ellipse(T.P(25, -d + 18), 12, 9));
      break;
    }
    case 'pa': {
      for (let i = 0; i < 3; i++) {
        const a = Math.PI / 2 + (i * 2 * Math.PI) / 3;
        put(b.legs, T.line(make(), T.P(0, 0), T.P(Math.cos(a) * 520, Math.sin(a) * 520)));
      }
      put(b.mat.tolex, T.rr(-w, -d, w, d, 24));
      put(b.mat.cloth, T.rr(-w + 24, -d - 4, w - 24, -d + 30, 8));
      break;
    }
    case 'gobo': {
      put(b.mat.cloth, T.rr(-w, -d, w, d, 20));
      put(b.legs, T.line(make(), T.P(-w + 120, -260), T.P(-w + 120, 260)));
      put(b.legs, T.line(make(), T.P(w - 120, -260), T.P(w - 120, 260)));
      break;
    }
  }
}

/** A piece of gear from the hall (front) or the side (section). */
export function bandGearElev(b: BandBatch, g: Gear, view: 'front' | 'section', T: BandTools) {
  const S = GEAR_SIZE[g.kind];
  const f = planDir(g.face);
  const r = rightOf(g.face);
  const o = uv(view, g.p);
  const gy = o.v;
  // Its footprint's extent on screen (u), from its four plan corners.
  const corner = (cx: number, cy: number) => uv(view, { x: g.p.x + r.x * cx + f.x * cy, y: g.p.y, z: g.p.z + r.z * cx + f.z * cy }).u;
  const us = [corner(-S.w / 2, -S.d / 2), corner(S.w / 2, -S.d / 2), corner(-S.w / 2, S.d / 2), corner(S.w / 2, S.d / 2)];
  const u0 = Math.min(...us);
  const u1 = Math.max(...us);
  // Toward the viewer: the hall (+z) from the front, the audience's right (+x) from the side.
  const toViewer = view === 'front' ? f.z : f.x;
  const faceU = view === 'front' ? f.x : -f.z;
  switch (g.kind) {
    case 'combo':
    case 'bassRig': {
      const a = ampGeom(g.kind);
      b.mat.tolex.addPath(T.rr(u0, gy - a.h, u1, gy, 26));
      if (toViewer > 0.45) {
        // The grille seen from in front: the cloth and the speaker behind it.
        const inset = 34;
        const panel = g.kind === 'combo' ? 90 : 20;
        b.mat.cloth.addPath(T.rr(u0 + inset, gy - a.h + panel + inset * 0.5, u1 - inset, gy - inset, 14));
        if (g.kind === 'combo') b.desks.addPath(T.rr(u0 + inset, gy - a.h + 14, u1 - inset, gy - a.h + panel - 6, 6));
      } else {
        // The side: a handle strap; which way it faces is the cloth's edge.
        const edge = faceU >= 0 ? u1 : u0;
        b.mat.cloth.addPath(T.rr(Math.min(edge, edge - Math.sign(faceU || 1) * 30), gy - a.h + 30, Math.max(edge, edge - Math.sign(faceU || 1) * 30), gy - 30, 6));
      }
      if (g.kind === 'bassRig') {
        const hw = (u1 - u0) * 0.22;
        const mid = (u0 + u1) / 2;
        b.mat.steel.addPath(T.rr(mid - hw, gy - a.h - a.head, mid + hw, gy - a.h + 4, 12));
      }
      break;
    }
    case 'wedge': {
      // A floor wedge: a low box whose sloped front faces its player.
      const h = S.h;
      if (Math.abs(toViewer) > 0.6) {
        b.mat.tolex.addPath(T.rr(u0, gy - h, u1, gy, 22));
        if (toViewer > 0) b.mat.cloth.addPath(T.rr(u0 + 26, gy - h + 26, u1 - 26, gy - 26, 12));
      } else {
        // Its profile: the slope rises away from the player.
        const back = faceU >= 0 ? u0 : u1;
        const fr = faceU >= 0 ? u1 : u0;
        b.mat.tolex.addPath(T.poly([T.P(back, gy), T.P(back, gy - h), T.P(back + (fr - back) * 0.35, gy - h), T.P(fr, gy - 90), T.P(fr, gy)]));
        b.mat.cloth.addPath(T.poly([T.P(back + (fr - back) * 0.4, gy - h + 18), T.P(fr - Math.sign(fr - back) * 16, gy - 100), T.P(fr - Math.sign(fr - back) * 30, gy - 90), T.P(back + (fr - back) * 0.38, gy - h + 34)]));
      }
      break;
    }
    case 'di': {
      b.mat.steel.addPath(T.rr(u0, gy - S.h, u1, gy, 10));
      break;
    }
    case 'pa': {
      // A full-range box on a tripod speaker stand.
      const mid = (u0 + u1) / 2;
      T.line(b.legs, T.P(mid, gy - PA_BOX.bottom), T.P(mid, gy - 220));
      T.line(b.legs, T.P(mid, gy - 260), T.P(mid - 480, gy));
      T.line(b.legs, T.P(mid, gy - 260), T.P(mid + 480, gy));
      b.mat.tolex.addPath(T.rr(u0, gy - PA_BOX.bottom - PA_BOX.h, u1, gy - PA_BOX.bottom, 22));
      if (toViewer > 0.45) b.mat.cloth.addPath(T.rr(u0 + 26, gy - PA_BOX.bottom - PA_BOX.h + 26, u1 - 26, gy - PA_BOX.bottom - 26, 12));
      break;
    }
    case 'gobo': {
      b.mat.cloth.addPath(T.rr(u0, gy - S.h - 120, u1, gy - 120, 18));
      T.line(b.legs, T.P(u0 + 80, gy - 120), T.P(u0 + 80, gy));
      T.line(b.legs, T.P(u1 - 80, gy - 120), T.P(u1 - 80, gy));
      break;
    }
  }
}

/** Gear drawn BEHIND the players in an elevation (the rest in front). */
export const gearBehind = (g: Gear): boolean => g.kind !== 'wedge' && g.kind !== 'di';
