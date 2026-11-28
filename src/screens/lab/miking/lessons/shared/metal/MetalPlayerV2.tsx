/**
 * THE METAL-PERCUSSION PLAYER, DRAWN (figure roll-out, D78, 2026-11-24): a
 * picture's 3-D skeleton (metalFigureV2.ts) as the cast person in the approved
 * look (figureV2/familyV2: the body, the sleeves, the posed hands).
 *   part 'back'  the whole person, behind the instrument;
 *   part 'front' the person again over the instrument, only the hands' near
 *                layers (each hand wraps what it holds: the fingers over the
 *                beater, the mallet's handle, the clip or the strap; what lies
 *                beyond it stays behind).
 * Face-on (from the audience) the body is the approved front figure with its
 * arms off and each arm drawn here on the skeleton (an arm reaching forward to
 * what it holds is foreshortened above the elbow: its sleeve grows out of the
 * shoulder over the chest, its first few centimetres fading into the shirt —
 * BoomV2's shoulder rule — never a hard-edged patch cut round the shoulder).
 * A quiet player (`dim` < 1) stays opaque, blended toward the stage's dark
 * (as every approved figure recedes), so the instrument stays the subject.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { figureV2On } from '../figureV2/figureV2Config.ts';
import { Group, LinearGradient, Paint, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import { castFor, type RoleKey } from '../figureV2/cast';
import { famFrontRegion, famPlan, famProj, FamilyFigureFrontV2, FamilyFigureV2, type FamArmPlan, type FamPlan } from '../figureV2/familyV2';
import { armPaths, op, unionOf, type SkPath } from '../figureV2/paths.ts';
import { Arm, type Torso } from '../figureV2/FigureV2Side';
import { ArmLite } from '../figureV2/lite';
import { FamilyHandV2 } from '../figureV2/familyHandV2';
import { frontPaths, personFrontPlan, PersonFrontV2 } from '../figureV2/FigureV2Front';
import { FigureScale, levelOf, useFigureScale } from '../figureV2/detail';
import { FigureLook } from '../figureV2/look';
import { mul, P, sub, unit, type Pt } from '../figureV2/geom.ts';
import { armPlan, type ArmPlan } from '../figureV2/sidePlan.ts';
import { gripInView, gripToPage, openingOf, tiltTo, type GripView } from '../figureV2/playersGrip.ts';
import { GRIP_FIST, GripHand, recedeV2 } from '../figureV2/playersV2';
import { playerFistSilhouette, plugOf } from '../figureV2/playersFist';
import { gripSilhouette } from '../figureV2/heldHandV2';
import type { PlacedGrip, V3 } from '../figureV2/heldHands.ts';
import { towardOf, type MetalFig, type MetalGrip } from './metalFigureV2.ts';
import { MetalHand, type MetalHandArt, type MetalLayer } from '../figureV2/metalHandPaint';
import { METAL_HAND_ZILL_PALM } from '../figureV2/metalHandZillPalm';
import { METAL_HAND_CLIP_SIDE } from '../figureV2/metalHandClipSide';
import { METAL_HAND_ZILL_EDGE } from '../figureV2/metalHandZillEdge';
import { METAL_HAND_BEATER_BACK } from '../figureV2/metalHandBeaterBack';
import type { MetalHandKind } from './metalHands.ts';

/** (family batch 2026-11-25) every authored metal-family hand, by kind (metalHands.ts places them). */
export const METAL_HANDS: Record<MetalHandKind, MetalHandArt> = {
  zillPalm: METAL_HAND_ZILL_PALM,
  zillEdge: METAL_HAND_ZILL_EDGE,
  beaterBack: METAL_HAND_BEATER_BACK,
  clipSide: METAL_HAND_CLIP_SIDE,
};

/** (the study page) draw the old figure in a picture whatever the switch says: OLD beside NEW. */
const OldCtx = createContext(false);
export const MetalOld = OldCtx.Provider;
/** The new look where the family is switched on (and the study page does not ask for the old), else the old. */
export function MetalSwitch({ v2, old }: { v2: ReactNode; old: ReactNode }) {
  const forceOld = useContext(OldCtx);
  return <>{figureV2On('familyMetal') && !forceOld ? v2 : old}</>;
}

/** Everything in front of every instrument part (only the hands' own near layers are drawn over it). */
const HANDS_ONLY = 1e5;

const planCache = new WeakMap<MetalFig, Map<string, FamPlan>>();
export function metalPlan(fig: MetalFig, role: RoleKey): FamPlan {
  let m = planCache.get(fig);
  if (!m) {
    m = new Map();
    planCache.set(fig, m);
  }
  const hit = m.get(role);
  if (hit) return hit;
  const fp = famPlan({ key: `metal|${fig.key}`, s: fig.s, view: fig.view, who: castFor(role), seated: false, floorY: fig.floorY, arms: fig.arms });
  m.set(role, fp);
  return fp;
}

/**
 * (an arm whose hand the lesson draws itself — the approved hand-drum hand) the arm's cloth on the page (the
 * sleeve and its cuff: the hand is clipped out of it, so the cuff stays over the wrist) and its elbow on the page
 * (the hand's bare forearm runs toward it, under the sleeve).
 */
export function metalArmCloth(fig: MetalFig, role: RoleKey, side: 'L' | 'R'): { cloth: SkPath; elbow: [number, number] } {
  const fp = metalPlan(fig, role);
  const a = fp.arms.find((x) => x.side === side)!;
  const AP = armPaths(a.arm, famProj(fig.view));
  return { cloth: unionOf(AP.upper, AP.foreSleeve, AP.cuffCloth), elbow: [a.arm.elbow.u, a.arm.elbow.v] };
}

/** The lesson's own hand on a metal arm: drawn outside the arm's sleeve and cuff. */
export function OutsideSleeve({ fig, role, side, children }: { fig: MetalFig; role: RoleKey; side: 'L' | 'R'; children: ReactNode }) {
  const { cloth } = metalArmCloth(fig, role, side);
  return (
    <Group clip={cloth} invertClip>
      {children}
    </Group>
  );
}

/* ── face-on ── */

const torsoOf = (path: SkPath, axis: [Pt, Pt]): Torso => {
  const b = path.getBounds();
  return { axis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: path };
};

/**
 * One arm face-on, its sleeve GROWING OUT OF THE SHOULDER (BoomV2 shoulderRoot, the approved boom operator's
 * rule): the sleeve is rebuilt from the front figure's own shoulder point (`at`: where its shirt's shoulder ends —
 * never set down the arm, which left a gap) through the skeleton's elbow to its wrist; nothing of it behind a line
 * across the shoulder (square to the upper arm, 6 mm back) is drawn off the body, so no round root stands above or
 * outside the shoulder (no pad); over the body its first 34 mm fade into the shirt (no seam, no cap patch).
 */
function FrontArm({ a, t, lite, arm }: { a: FamArmPlan; t: Torso; lite: boolean; arm: ArmPlan }) {
  const AP = armPaths(arm, famProj('front'));
  const hand = a.handElsewhere ? null : <FamilyHandV2 h={a.hand} />;
  const body = lite ? <ArmLite a={arm} P={AP} stick={hand} /> : <Arm a={arm} P={AP} t={t} stick={hand} />;
  const R0 = shoulderRoot(arm, t.body);
  if (lite) return <Group clip={R0.clip}>{body}</Group>;
  return (
    <Group layer={<Paint />}>
      {body}
      <Path path={R0.behindOff} color="black" blendMode="dstOut" />
      <Group clip={t.body}>
        <Path path={R0.plane} blendMode="dstOut">
          <LinearGradient start={vec(R0.from.u, R0.from.v)} end={vec(R0.to.u, R0.to.v)} colors={['black', 'rgba(0,0,0,0)']} />
        </Path>
      </Group>
    </Group>
  );
}

/** BoomV2 shoulderRoot (read-only there, the same rule here): the half of the page on the arm's side of a line
 *  across the shoulder; what lies behind it off the body; the fade's run. */
const ROOT_FADE = 34;
/** How far in from the front figure's shoulder point the sleeve's root is set (mm, level). */
const ROOT_IN = 26;
function shoulderRoot(a: ArmPlan, body: SkPath): { clip: SkPath; behindOff: SkPath; plane: SkPath; from: Pt; to: Pt } {
  const s = a.shoulder;
  const du = unit(sub(a.elbow, s));
  const n = P(-du.v, du.u);
  const o = sub(s, mul(du, 6));
  const far = 5000;
  const half = Skia.Path.Make();
  half.moveTo(o.u + n.u * far, o.v + n.v * far);
  half.lineTo(o.u + n.u * far + du.u * far, o.v + n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far + du.u * far, o.v - n.v * far + du.v * far);
  half.lineTo(o.u - n.u * far, o.v - n.v * far);
  half.close();
  const plane = Skia.Path.Make();
  plane.addRect(Skia.XYWHRect(s.u - far, s.v - far, 2 * far, 2 * far));
  const behind = op(plane, half, PathOp.Difference);
  return { clip: op(half, body, PathOp.Union), behindOff: op(behind, body, PathOp.Difference), plane, from: o, to: P(o.u + du.u * ROOT_FADE, o.v + du.v * ROOT_FADE) };
}

/** Face-on: the front figure's plan, its torso and each arm's sleeve as drawn (rebuilt from the front figure's own
 *  shoulder point), the farther first. */
type FrontPlans = { F: ReturnType<typeof personFrontPlan>; t: Torso; arms: { a: FamArmPlan; arm: ArmPlan }[] };
const frontCache = new WeakMap<FamPlan, FrontPlans>();
function frontPlans(fp: FamPlan): FrontPlans {
  const hit = frontCache.get(fp);
  if (hit) return hit;
  const who = fp.in.who;
  const pose = fp.front!.pose;
  const F = personFrontPlan(pose, who, {});
  const t = torsoOf(frontPaths(F).shirt, F.axis);
  const sorted = [...fp.arms].sort((x, y) => x.dFore - y.dFore);
  // (each arm's root: the front figure's own shoulder point on that side — the nearer of its two)
  const rootFor = (a: FamArmPlan): Pt => {
    let best = F.arms[0].shoulder;
    const s = a.arm.shoulder;
    for (const fa of F.arms) if (Math.hypot(fa.shoulder.u - s.u, fa.shoulder.v - s.v) < Math.hypot(best.u - s.u, best.v - s.v)) best = fa.shoulder;
    // (a little in from the shirt's shoulder edge, level: the sleeve's first centimetres lie over the shirt and
    // fade into it — no seam where the shirt stops and the sleeve starts)
    const sg = best.u >= pose.neck.u ? 1 : -1;
    // (a hanging arm's root a little lower too: its sleeve's outer edge then starts under the shirt's rounded
    // shoulder, never a corner standing out past it)
    const dn = Math.max(0, (a.arm.elbow.v - best.v) / (Math.hypot(a.arm.elbow.u - best.u, a.arm.elbow.v - best.v) || 1));
    return P(best.u - sg * ROOT_IN, best.v + 4 + 22 * Math.max(0, (dn - 0.6) / 0.4));
  };
  const B = who.body;
  const build = B ? { one: true, k: B.shoulder, fore: B.limb } : { one: true };
  const out: FrontPlans = { F, t, arms: sorted.map((a) => ({ a, arm: armPlan(rootFor(a), a.arm.elbow, a.arm.wrist, null, false, null, 0, null, false, build) })) };
  frontCache.set(fp, out);
  return out;
}

/** The person face-on: the approved front figure without its arms, then each arm (the farther first). */
function FrontFigure({ fp }: { fp: FamPlan }) {
  const v = useFigureScale();
  const level = levelOf({ ptPerMm: v.ptPerMm, level: v.level });
  const who = fp.in.who;
  const { t, arms } = frontPlans(fp);
  return (
    <FigureScale ptPerMm={v.ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <PersonFrontV2 pose={fp.front!.pose} who={who} arms={false} />
        {arms.map(({ a, arm }) => (
          <FrontArm key={a.side} a={a} t={t} lite={level === 'lite'} arm={arm} />
        ))}
      </FigureLook>
    </FigureScale>
  );
}

/* ── the hands closed round a beater or a mallet ── */

/** The arm as drawn on the page, each side (face-on: the sleeve rebuilt from the front figure's shoulder). */
const drawnArm = (fp: FamPlan, side: 'L' | 'R'): { a: FamArmPlan; arm: ArmPlan } | null => {
  if (fp.front) return frontPlans(fp).arms.find((x) => x.a.side === side) ?? null;
  const a = fp.arms.find((x) => x.side === side);
  return a ? { a, arm: a.arm } : null;
};

/** One placed grip: the approved held hand on the page, its sleeve (the heel of the hand runs on inside it) and
 *  the wrist's plug (the wrist comes out of the cuff as one skin). */
type PlacedMetalGrip = { side: 'L' | 'R'; placed: PlacedGrip; mg: MetalGrip; hide?: SkPath; under?: SkPath; far: boolean; sil: SkPath };
const gripsCache = new WeakMap<FamPlan, PlacedMetalGrip[]>();
/** (playersV2: the fist painter for a grip seen mostly along its rod) */
const ALONG_ROD = 0.5;
export function metalGripsPlaced(fig: MetalFig, fp: FamPlan): PlacedMetalGrip[] {
  const hit = gripsCache.get(fp);
  if (hit) return hit;
  const pr = famProj(fig.view);
  const vs: GripView = { toward: towardOf(fig.view), proj: (p) => { const q = pr(p); return P(q.u, q.v); } };
  const out: PlacedMetalGrip[] = [];
  for (const side of ['L', 'R'] as const) {
    const mg = fig.grips[side];
    const d = drawnArm(fp, side);
    if (!mg || !d) continue;
    const placed = gripInView(mg.g, vs, openingOf(d.arm));
    const AP = armPaths(d.arm, pr);
    // (a forearm coming toward the viewer: the hand lies over its own cuff; otherwise the heel of the hand runs on
    // inside the sleeve and the wrist's skin fills the cuff's opening)
    const over = d.arm.away || tiltTo(mg.g, vs.toward) > 0.3;
    const tp = GRIP_FIST && Math.abs(placed.view.toward.w) > ALONG_ROD ? gripToPage(placed) : null;
    const sil = tp ? playerFistSilhouette(placed, tp) : gripSilhouette(placed);
    out.push({ side, placed, mg, hide: over ? undefined : unionOf(AP.foreSleeve, AP.upper), under: over ? undefined : plugOf(AP.wristSkin, AP.opening, d.arm.opening.e.c), far: d.a.far, sil });
  }
  gripsCache.set(fp, out);
  return out;
}

/** The rod's piece inside the fist (drawn between the hand's layers, only within the hand's outline — outside it
 *  the lesson's own beater or handle shows). */
function RodInHand({ g, pr }: { g: PlacedMetalGrip; pr: (p: V3) => { u: number; v: number } }) {
  const A = pr(g.mg.a);
  const B = pr(g.mg.b);
  const p = Skia.Path.Make();
  p.moveTo(A.u, A.v);
  p.lineTo(B.u, B.v);
  const L = g.mg.look;
  return (
    <Group clip={g.sil}>
      <Path path={p} style="stroke" strokeWidth={L.d} strokeCap="butt" color={L.edge} />
      <Path path={p} style="stroke" strokeWidth={L.d * 0.62} strokeCap="butt" color={L.color} />
    </Group>
  );
}

/** Every hand closed round a rod, over what is already drawn. */
function GripHands({ fig, fp }: { fig: MetalFig; fp: FamPlan }) {
  const v = useFigureScale();
  const gs = metalGripsPlaced(fig, fp);
  if (!gs.length) return null;
  const level = levelOf({ ptPerMm: v.ptPerMm, level: v.level });
  const pr = famProj(fig.view);
  return (
    <FigureScale ptPerMm={v.ptPerMm} level={level}>
      <FigureLook look={fp.in.who.look}>
        {gs.map((g) => (
          <GripHand key={g.side} grip={g.placed} rod={<RodInHand g={g} pr={pr} />} far={g.far} hide={g.hide} under={g.under} />
        ))}
      </FigureLook>
    </FigureScale>
  );
}

/** What is painted again over the instrument: each hand's near layer and, on a hand closed round a stick or a
 *  handle, its cuff (the stick's butt end leaves the fist under the heel of the hand, behind the wrist — never
 *  laid over the cuff). */
const regionCache = new WeakMap<FamPlan, SkPath | null>();
function frontRegion(fig: MetalFig, fp: FamPlan): SkPath | null {
  if (regionCache.has(fp)) return regionCache.get(fp) ?? null;
  const hands = famFrontRegion(fp, HANDS_ONLY);
  const cuffs = fp.arms
    .filter((a) => (fig.arms[a.side].cut && fig.arms[a.side].sk.thumb && !a.handElsewhere && isStick(fig, a.side)) || !!fig.grips[a.side] || hasFront(fig.drawn[a.side]?.kind))
    .map((a) => armPaths(drawnArm(fp, a.side)?.arm ?? a.arm, famProj(fig.view)).cuffCloth);
  const r = cuffs.length ? unionOf(...(hands ? [hands] : []), ...cuffs) : hands;
  regionCache.set(fp, r);
  return r;
}
/** A hand on a stick (its cut runs along the stick: the plane's point is the stick's middle, away from the pads). */
const isStick = (fig: MetalFig, side: 'L' | 'R') => {
  const a = fig.arms[side];
  const c = a.cut;
  if (!c) return false;
  const pads = [a.sk.thumb.joints[3], ...a.sk.fingers.map((f) => f.joints[3])];
  return Math.min(...pads.map((p) => Math.hypot(p.x - c.p.x, p.y - c.p.y, p.z - c.p.z))) > 40;
};

/* ── (family batch 2026-11-25) the hands drawn as authored 2-D art ── */

const HANDS: Record<string, MetalHandArt | undefined> = METAL_HANDS;
/** The authored drawing of a kind (metalHands.ts). */
export const drawnArt = (kind: string): MetalHandArt | undefined => HANDS[kind];
/** Has the drawing pieces in front of what it holds (painted again over the instrument)? */
const hasFront = (kind: string | undefined): boolean => !!kind && !!HANDS[kind]?.pieces.some((p) => p.layer === 'front');

/**
 * Each authored hand: its anchor on the held thing, turned as the pose module set it (the arm was solved to its
 * wrist), in the player's skin, painted outside the arm's sleeve (the cuff stays over the wrist). `layer`: the
 * pieces behind what it holds ('back', with the body) or in front of it ('front', over the instrument).
 */
function DrawnHands({ fig, role, fp, layer }: { fig: MetalFig; role: RoleKey; fp: FamPlan; layer: MetalLayer }) {
  const v = useFigureScale();
  const level = levelOf({ ptPerMm: v.ptPerMm, level: v.level });
  const sides = (['L', 'R'] as const).filter((s) => {
    const d = fig.drawn[s];
    const art = d ? HANDS[d.kind] : undefined;
    return !!art && art.pieces.some((p) => p.layer === layer);
  });
  if (!sides.length) return null;
  return (
    <FigureScale ptPerMm={v.ptPerMm} level={level}>
      <FigureLook look={fp.in.who.look}>
        {sides.map((s) => {
          const d = fig.drawn[s]!;
          return (
            <OutsideSleeve key={s} fig={fig} role={role} side={s}>
              <MetalHand art={HANDS[d.kind]!} x={d.at.u} y={d.at.v} rot={d.rot} mirror={d.mirror} layer={layer} />
            </OutsideSleeve>
          );
        })}
      </FigureLook>
    </FigureScale>
  );
}

export function MetalPlayerV2({ fig, role, part = 'back', dim = 1 }: { fig: MetalFig; role: RoleKey; part?: 'back' | 'front'; dim?: number }) {
  const fp = metalPlan(fig, role);
  const body = part === 'front' ? <FamilyFigureFrontV2 fp={fp} region={frontRegion(fig, fp)} /> : fp.front ? <FrontFigure fp={fp} /> : <FamilyFigureV2 fp={fp} />;
  return (
    <Group layer={recedeV2(dim) as never}>
      {body}
      <GripHands fig={fig} fp={fp} />
      <DrawnHands fig={fig} role={role} fp={fp} layer={part} />
    </Group>
  );
}
