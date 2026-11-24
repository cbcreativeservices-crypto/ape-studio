/**
 * FIGURE V2 — THE CHORISTER WITH A MUSIC FOLDER (wave 6 of D78, the
 * ensembles: E05 choir, E06 children's choir; 2026-11-24). One 3-D pose of the
 * arms and the folder, projected in each view the seatings draw a chorister:
 *   • 'front' from the hall (PersonFrontV2, the arms drawn here);
 *   • 'side'  the section, in profile (PersonSideV2, the arms drawn here);
 *   • 'top'   the plan, from above (PersonTopV2 standing, the arms drawn here).
 *
 * HOW A CHOIR FOLDER IS HELD (the usual choral practice, drawing default): the
 * black folder (a music folder, here 190 × 250 mm a cover — the old drawing's 350 × 230 mm open) open at
 * about 150°, held at chest height a little out in front, its top tipped
 * forward so the pages face up toward the eyes and the singer looks over it to
 * the conductor (the head up, not buried in the music). BOTH HANDS UNDER THE
 * FOLDER'S LOWER EDGE, the palms up beneath it, the fingers curling round the
 * edge onto the cover's side, the THUMBS ON TOP on the pages — each hand one
 * 3-D grip round the edge (heldHands.ts, read only: the fingers round one side,
 * the thumb round the other), about two thirds of the way out on its half. The
 * elbows hang near the body, the forearms forward to the edge.
 *
 * Heights are the old drawing's (SeatingArt elevSeat 'chorister': the folder's
 * lower edge 1160 mm above the standing surface, the hands there).
 */
import { memo, type ReactNode } from 'react';
import { Group, LinearGradient, Paint, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { FigureScale, levelOf, useFigureScale } from './detail';
import { P, add, limbOutline, lerp, mul, sub, unit, type Pt } from './geom.ts';
import { AuthoredHand, Folds, Form } from './paint';
import { artPaths, smoothClosed, type ArtPaths, type SkPath } from './paths.ts';
import { FOLDER_FRONT_ART, placeArt } from './backHands.ts';
import { heldFrame, placeGrip, type PlacedGrip, type V3 } from './heldHands.ts';
import { HeldHand } from './heldHandV2';
import { FigureLook, useLook } from './look';
import type { CastMember } from './cast';
import type { Material } from './palette.ts';
import { lens } from './sidePlan.ts';
import { FRONT_STANDING } from './frontPlan.ts';
import { PersonFrontV2, frontPaths, personFrontPlan } from './FigureV2Front';
import { PersonSideV2, PersonTopV2 } from './personV2';
import { SINGER_SIDE } from '../voice/voicePose.ts';
import { poseOnTalker } from '../broadcast/talkerPose.ts';
import { standingAbovePose } from './markerPose.ts';
import type { PlayerPose } from '../players/playerPose.ts';

const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const add3 = (a: V3, b: V3): V3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);
const sub3 = (a: V3, b: V3): V3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);
const mul3 = (a: V3, k: number): V3 => v3(a.x * k, a.y * k, a.z * k);
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross3 = (a: V3, b: V3): V3 => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const unit3 = (a: V3): V3 => mul3(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));
const DEG = Math.PI / 180;

/** The folder (mm, degrees): one cover's width and height, the opening angle, the forward tip of its top from
 *  upright, its lower edge's middle (height above the standing surface, ahead of the body's middle), where along
 *  each half the hand holds it (0 the spine, 1 the outer corner). */
export const FOLDER = { w: 190, h: 250, open: 150, tilt: 22, lowY: 1160, lowZ: 250, hold: 0.62 } as const;
/** From each shoulder to the elbow (x the singer's right, y up, z forward): the upper arm hanging near the body. */
export const CHOIR_ARM = { toElbow: { R: v3(-20, -285, 50), L: v3(20, -285, 50) } } as const;
/** The bulb of the grip model round the folder's edge: the two covers and the pages, about 6 mm thick, held. */
const EDGE_R = 6;

/** The folder's two halves in the singer's frame: each a quad (spine bottom, outer bottom, outer top, spine top),
 *  the pages' side normal (toward the singer). */
export function folder3() {
  const t = FOLDER.tilt * DEG;
  const a = ((180 - FOLDER.open) / 2) * DEG;
  // the tip forward about the singer's x axis: up → (0, cos t, sin t), forward → (0, −sin t, cos t)
  const tip = (p: V3) => v3(p.x, p.y * Math.cos(t) - p.z * Math.sin(t), p.y * Math.sin(t) + p.z * Math.cos(t));
  const B0 = v3(0, FOLDER.lowY, FOLDER.lowZ);
  const up = tip(v3(0, 1, 0));
  const half = (sx: 1 | -1) => {
    // (open toward the singer: the outer edges a little back toward him, the spine farthest out)
    const o = tip(v3(sx * Math.cos(a), 0, -Math.sin(a)));
    const q = [B0, add3(B0, mul3(o, FOLDER.w)), add3(add3(B0, mul3(o, FOLDER.w)), mul3(up, FOLDER.h)), add3(B0, mul3(up, FOLDER.h))];
    let n = unit3(cross3(o, up));
    if (n.z > 0) n = mul3(n, -1);
    return { quad: q, out: o, pages: n, hold: add3(B0, mul3(o, FOLDER.w * FOLDER.hold)) };
  };
  return { R: half(1), L: half(-1), up };
}

/* ── the views ── */

export type ChoirView = 'front' | 'side' | 'top';
const FLOOR = FRONT_STANDING.floor ?? 1550;
/** Frame V (the lips at the origin, the floor at FLOOR): the body's middle 124 mm behind the lips. */
const LIP_AHEAD = 124;
const SIDE_LEFT: PlayerPose = poseOnTalker(SINGER_SIDE, { id: 'choirLeft', lip: { x: 0, y: 0, z: 0 }, facing: -1 } as never);

/** His frame → (u, v on the page, depth toward the viewer). Elevations in frame V; from above round the neck,
 *  facing up the page. */
function dirOf(view: ChoirView, facing: 1 | -1): { pt: (p: V3) => Pt; toward: V3 } {
  if (view === 'front') return { pt: (p) => P(-p.x, FLOOR - p.y), toward: v3(0, 0, 1) };
  if (view === 'side') return { pt: (p) => P(facing * (p.z - LIP_AHEAD), FLOOR - p.y), toward: v3(facing, 0, 0) };
  return { pt: (p) => P(p.x, -p.z), toward: v3(0, 1, 0) };
}

export type ChoirArm = {
  side: 'R' | 'L';
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
  sleeve: Pt[];
  cuff: Pt[];
  folds: Pt[][];
  grip: PlacedGrip;
  /** The digits that lie on the viewer's side of the folder's half (the thumb on the pages, or the fingers on
   *  the cover): painted again over the folder; the rest of the hand lies behind its sheet. */
  onSide: PlacedGrip;
  /** The arm's depth toward the viewer at the hand (the nearer arm is drawn last). */
  depth: number;
};
export type ChoirPlan = { view: ChoirView; facing: 1 | -1; arms: { R: ChoirArm; L: ChoirArm }; folder: { quad: Pt[]; pages: boolean; depth: number }[] };

const cache = new Map<string, ChoirPlan>();
export function choristerPlan(view: ChoirView, facing: 1 | -1 = 1): ChoirPlan {
  const key = `${view}|${facing}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const D = dirOf(view, facing);
  const F = folder3();
  // the shoulders in his frame: across and height from the front figure, the side figure's place along the body
  const sideNear = (facing > 0 ? SINGER_SIDE : SIDE_LEFT).shoulderR;
  const zS = facing * sideNear.u + LIP_AHEAD;
  const sh = (s: 'R' | 'L') => {
    const q = s === 'R' ? FRONT_STANDING.shoulderR : FRONT_STANDING.shoulderL;
    return v3(-q.u, FLOOR - q.v, view === 'front' ? 0 : zS);
  };
  const arm = (s: 'R' | 'L'): ChoirArm => {
    const S3 = sh(s);
    const E3 = add3(S3, CHOIR_ARM.toElbow[s]);
    const half = F[s];
    // the fist's middle on the edge (the grip's handle line), a little out from the lower edge's own line
    const fist3 = half.hold;
    const hand3 = unit3(sub3(fist3, E3));
    const W3 = sub3(fist3, mul3(hand3, 58));
    // the palm up under the edge: the handle's thumb side toward the folder's outer corner
    const fr = heldFrame(E3, fist3, half.out, s, v3(s === 'R' ? 1 : -1, 0, 0));
    const S = D.pt(S3);
    const E = D.pt(E3);
    const W = D.pt(W3);
    const df = unit(sub(W, E));
    const cuffA = sub(W, mul(df, 34));
    const cuffB = sub(W, mul(df, 12));
    const rootIn = sub(S, mul(unit(sub(E, S)), 22));
    const grip = placeGrip(fist3, fr, D.toward, D.pt, EDGE_R, { wristFrom2: cuffB, back: true });
    const keep = dot3(half.pages, D.toward) > 0 ? 'thumb' : 'fingers';
    const onSide: PlacedGrip = { ...grip, parts: grip.parts.filter((q) => q.name === keep), order: grip.order.filter((k) => k === 'MIC' || k.name === keep) };
    return {
      side: s,
      shoulder: S,
      elbow: E,
      wrist: W,
      sleeve: limbOutline([rootIn, S, lerp(S, E, 0.45), E, lerp(E, cuffA, 0.5), cuffA], [34, 40, 39, 37, 34, 33]),
      cuff: limbOutline([sub(cuffA, mul(df, 2)), cuffB], [34, 33.4], { capStart: false, capEnd: false }),
      folds: [lens(add(E, P(-14, -14)), add(E, P(14, 10)), 4, 2)],
      grip,
      onSide,
      depth: dot3(W3, D.toward),
    };
  };
  const folder = (['L', 'R'] as const)
    .map((s) => {
      const h = F[s];
      const c = mul3(add3(add3(h.quad[0], h.quad[1]), add3(h.quad[2], h.quad[3])), 0.25);
      return { quad: h.quad.map(D.pt), pages: dot3(h.pages, D.toward) > 0, depth: dot3(c, D.toward) };
    })
    .sort((a, b) => a.depth - b.depth);
  const out: ChoirPlan = { view, facing, arms: { R: arm('R'), L: arm('L') }, folder };
  cache.set(key, out);
  return out;
}

/* ── the drawing ── */

const COVER: Material = { form: ['#3a3b40', '#26272b', '#1a1b1e', '#0e0f11', '#141518'], pos: [0, 0.2, 0.52, 0.8, 1], rim: '#6e7078', edge: '#050506', deep: '#050506' };
function flat(pts: Pt[]): SkPath {
  const p = Skia.Path.Make();
  pts.forEach((q, i) => (i ? p.lineTo(q.u, q.v) : p.moveTo(q.u, q.v)));
  p.close();
  return p;
}
const quadCache = new WeakMap<object, SkPath>();
const quadPath = (f: { quad: Pt[] }) => {
  const hit = quadCache.get(f);
  if (hit) return hit;
  const p = flat(f.quad);
  quadCache.set(f, p);
  return p;
};

/** The open folder: each half far to near, its pages (cream, a few faint staves) or its black cover. */
function Folder({ plan }: { plan: ChoirPlan }) {
  return (
    <Group>
      {plan.folder.map((f, i) => {
        const p = quadPath(f);
        const [a, b, c] = f.quad;
        return (
          <Group key={i}>
            {f.pages ? (
              <Group>
                <Path path={p}>
                  <LinearGradient start={vec(a.u, a.v)} end={vec(c.u, c.v)} colors={['#efe9da', '#ddd5c2', '#c9c0aa']} />
                </Path>
                <Group clip={p}>
                  {[0.3, 0.5, 0.7].map((t) => {
                    const l = Skia.Path.Make();
                    const s0 = lerp(a, f.quad[3], t);
                    const s1 = lerp(b, c, t);
                    l.moveTo(s0.u, s0.v);
                    l.lineTo(s1.u, s1.v);
                    return <Path key={t} path={l} style="stroke" strokeWidth={6} color="#8f8878" opacity={0.25} />;
                  })}
                </Group>
              </Group>
            ) : (
              <Path path={p}>
                <LinearGradient start={vec(a.u, a.v)} end={vec(c.u, c.v)} colors={COVER.form} positions={COVER.pos} />
              </Path>
            )}
            <Path path={p} style="stroke" strokeWidth={3} strokeJoin="round" color="#0a0a0c" opacity={0.9} />
          </Group>
        );
      })}
    </Group>
  );
}

const armCache = new WeakMap<ChoirArm, { sleeve: SkPath; cuff: SkPath; folds: SkPath }>();
function armPathsOf(a: ChoirArm) {
  const hit = armCache.get(a);
  if (hit) return hit;
  const folds = Skia.Path.Make();
  for (const f of a.folds) folds.addPath(smoothClosed(f, 0.5));
  const out = { sleeve: smoothClosed(a.sleeve, 0.45), cuff: smoothClosed(a.cuff, 0.3), folds };
  armCache.set(a, out);
  return out;
}

function Sleeve({ a, body }: { a: ChoirArm; body?: SkPath | null }) {
  const { MAT } = useLook();
  const P0 = armPathsOf(a);
  const form = (
    <Form path={P0.sleeve} mat={MAT.shirt} axis={[a.shoulder, a.elbow]} w={40} rim={5} edge={0.9} fall={0.08}>
      <Folds path={P0.folds} mat={MAT.shirt} opacity={0.45} />
    </Form>
  );
  if (!body) return form;
  // (Ensembles3, reviewer: "round ball shoulder caps") the sleeve grows out of the shirt's shoulder — BoomV2's
  // shoulderRoot rule: off the body nothing of the sleeve above a line across the shoulder (square to the upper
  // arm, 6 mm up from the shoulder point); over the body its first 40 mm fade into the shirt
  const r = rootCut(a, body);
  return (
    <Group layer={<Paint />}>
      {form}
      <Path path={r.behindOff} color="black" blendMode="dstOut" />
      <Group clip={body}>
        <Path path={r.plane} blendMode="dstOut">
          <LinearGradient start={vec(r.from.u, r.from.v)} end={vec(r.to.u, r.to.v)} colors={['black', 'rgba(0,0,0,0)']} />
        </Path>
      </Group>
    </Group>
  );
}
const cutCache = new WeakMap<ChoirArm, Map<SkPath, { behindOff: SkPath; plane: SkPath; from: Pt; to: Pt }>>();
function rootCut(a: ChoirArm, body: SkPath) {
  let m = cutCache.get(a);
  if (!m) {
    m = new Map();
    cutCache.set(a, m);
  }
  const hit = m.get(body);
  if (hit) return hit;
  const s = a.shoulder;
  const du = unit(sub(a.elbow, s));
  const n = P(-du.v, du.u);
  const far = 5000;
  const o = sub(s, mul(du, 6));
  const half = Skia.Path.Make();
  half.moveTo(o.u + n.u * far, o.v + n.v * far);
  half.lineTo(o.u + n.u * far + du.u * far, o.v + n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far + du.u * far, o.v - n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far, o.v - n.v * far);
  half.close();
  const plane = Skia.Path.Make();
  plane.addRect(Skia.XYWHRect(s.u - far, s.v - far, 2 * far, 2 * far));
  const behind = Skia.Path.MakeFromOp(plane, half, PathOp.Difference) ?? Skia.Path.Make();
  const out = { behindOff: Skia.Path.MakeFromOp(behind, body, PathOp.Difference) ?? behind, plane, from: sub(o, mul(du, 10)), to: add(o, mul(du, 40)) };
  m.set(body, out);
  return out;
}
const shirtCache = new Map<string, SkPath>();
function frontShirt(who: CastMember): SkPath {
  const hit = shirtCache.get(who.id);
  if (hit) return hit;
  const p = frontPaths(personFrontPlan(FRONT_STANDING, who, {})).shirt;
  shirtCache.set(who.id, p);
  return p;
}
function Cuff({ a }: { a: ChoirArm }) {
  const { MAT } = useLook();
  return <Form path={armPathsOf(a).cuff} mat={MAT.shirt} axis={[a.elbow, a.wrist]} w={34} rim={3} edge={0.9} />;
}

/** The two hands round the folder's lower edge, the folder between their layers (what lies behind it, the folder,
 *  what lies before it). */
function HandsAndFolder({ plan }: { plan: ChoirPlan }) {
  const { R, L } = plan.arms;
  const [far, near] = R.depth < L.depth ? [R, L] : [L, R];
  return (
    <Group>
      <Cuff a={far} />
      <HeldHand h={far.grip} mic={null} />
      <Cuff a={near} />
      <HeldHand h={near.grip} mic={null} />
      <Folder plan={plan} />
      <HeldHand h={far.onSide} mic={null} />
      <HeldHand h={near.onSide} mic={null} />
    </Group>
  );
}

/** (Ensembles3) the two folder hands from the hall, placed on the lower edge at each hold point, the fingers up
 *  the cover, the thumb's side outward. */
let FRONT_HANDS: ArtPaths[] | null = null;
function frontHands(): ArtPaths[] {
  if (FRONT_HANDS) return FRONT_HANDS;
  const D = dirOf('front', 1);
  const F = folder3();
  FRONT_HANDS = (['R', 'L'] as const).map((s) => {
    const h = F[s].hold;
    const o = D.pt(h);
    const up = sub(D.pt(add3(h, F.up)), o);
    const out = P(Math.sign(o.u) || 1, 0);
    return artPaths(placeArt(FOLDER_FRONT_ART, o, Math.atan2(up.v, up.u), out), null);
  });
  return FRONT_HANDS;
}

/** A chorister holding the open folder, in a view (origin: frame V's lips in elevation; the neck from above,
 *  facing up the page). Full detail at close-up sizes, lite at plan and seating sizes. */
export const ChoristerV2 = memo(function ChoristerV2({ who, view, facing = 1, assumePtPerMm }: { who: CastMember; view: ChoirView; facing?: 1 | -1; assumePtPerMm?: number }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const plan = choristerPlan(view, facing);
  const { R, L } = plan.arms;
  let body: ReactNode;
  if (view === 'front') body = <PersonFrontV2 pose={FRONT_STANDING} who={who} arms={false} />;
  else if (view === 'side') body = <PersonSideV2 pose={facing > 0 ? SINGER_SIDE : SIDE_LEFT} who={who} opts={{ lip: { u: 0, v: 0 }, noArm: 'both', rest: 'restSide' }} />;
  else
    body = (
      <Group transform={[{ rotate: -Math.PI }]}>
        <PersonTopV2 pose={standingAbovePose()} who={who} />
      </Group>
    );
  const [farA, nearA] = R.depth < L.depth ? [R, L] : [L, R];
  const drawn =
    view === 'front' ? (
      // (Ensembles3) from the hall: the cuffs, the folder's back cover, then each hand under its lower edge with
      // the fingers curled up onto the cover — never a fist laid in front of the folder; the thumbs over the top
      // on the pages, hidden, their mounds at the edge
      <Group>
        {body}
        <Sleeve a={farA} body={frontShirt(who)} />
        <Sleeve a={nearA} body={frontShirt(who)} />
        <Cuff a={farA} />
        <Cuff a={nearA} />
        <Folder plan={plan} />
        {frontHands().map((h, i) => (
          <AuthoredHand key={i} a={h} />
        ))}
      </Group>
    ) : view === 'side' ? (
      <Group>
        <Sleeve a={farA} />
        <Cuff a={farA} />
        <HeldHand h={farA.grip} mic={null} />
        {body}
        <Sleeve a={nearA} />
        <Cuff a={nearA} />
        <HeldHand h={nearA.grip} mic={null} />
        <Folder plan={plan} />
        <HeldHand h={nearA.onSide} mic={null} />
      </Group>
    ) : (
      <Group>
        <Sleeve a={farA} />
        <Sleeve a={nearA} />
        <HandsAndFolder plan={plan} />
        {body}
      </Group>
    );
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>{drawn}</FigureLook>
    </FigureScale>
  );
});
