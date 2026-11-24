/**
 * THE SMALL-PERCUSSION PLAYER IN THE APPROVED LOOK (figure roll-out wave 5,
 * D78, 2026-11-24): shaker, egg, maracas (I03a–c), tambourine (I04),
 * cowbell, claves, woodblock, güiro (I05a–d) — the standing player from the
 * side (camera on the player's right) and from above, each arm, and each hand
 * on what it holds.
 *
 * Nothing of the scene moves (geom.ts: the shoulders, the arm points the
 * keep-outs read; each lesson's posed hand — the grip round a shaker or a
 * maraca's handle, the cradle under a clave, the stick hand, the pinch): only
 * the drawing is new — the body is the cast member's (the approved side and
 * top figure), each arm the approved sleeve from the lesson's own shoulder
 * through its elbow to the cuff at the wrist, each hand the posed hand in the
 * approved look (familyHand), wrapping what it holds: the parts beyond the
 * object's middle painted before it, the near parts after it.
 *
 * Who plays (cast.ts ROLES 'smallperc.player'): Ruth.
 */
import type { ReactNode } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { HandSkeleton, V3 } from '../players/handModel.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { castFor } from '../figureV2/cast';
import { FigureLook } from '../figureV2/look';
import { useFigureScale } from '../figureV2/detail';
import { Arm, type Torso } from '../figureV2/FigureV2Side';
import { ArmLite } from '../figureV2/lite';
import { armPaths, type SkPath } from '../figureV2/paths.ts';
import { armPlan, type ArmPlan } from '../figureV2/sidePlan.ts';
import { add, lerp, mul, P, sub, unit, type Pt } from '../figureV2/geom.ts';
import { PersonSideV2, PersonTopV2, personPlan } from '../figureV2/personV2';
import { sidePaths } from '../figureV2/paths.ts';
import { personTopPlan } from '../figureV2/topPerson.ts';
import { topPaths } from '../figureV2/FigureV2Top';
import { familyHand, type FamLayer } from '../figureV2/familyHand.ts';
import { FamilyHandV2 } from '../figureV2/familyHandV2';
import { PLAYER } from './geom.ts';

export const spPlayer = () => castFor('smallperc.player');

type P2 = readonly [number, number];
const VIEWS = {
  side: (p: V3) => ({ u: p.x, v: p.y, d: p.z }),
  top: (p: V3) => ({ u: p.x, v: p.z, d: -p.y }),
} as const;
export type SPView = keyof typeof VIEWS;

/* ── the body ── */

const H = (h: number) => -h;
/** The standing player from the right, facing +x (the old figure's own masses: the head at 1606, the collar
 *  1440, the belt 950, the back at −470, the chest at −250). The arms are each lesson's: the near one switched
 *  off, the far one tucked inside the torso's outline (painted before the shirt, so it never shows). */
const SIDE_POSE: PlayerPose = (() => {
  const neck = P(-352, H(1440));
  const hip = P(-368, H(955));
  return {
    view: 'side',
    posture: 'standing',
    head: { c: P(-346, H(1606)), r: 108 },
    neck,
    shoulderR: P(PLAYER.shoulderX, H(PLAYER.shoulderH)),
    shoulderL: lerp(hip, neck, 0.9),
    elbowR: P(PLAYER.shoulderX + 10, H(PLAYER.shoulderH - 290)),
    elbowL: lerp(hip, neck, 0.6),
    handR: { wrist: P(PLAYER.shoulderX + 30, H(PLAYER.shoulderH - 550)), dir: Math.PI / 2, kind: 'rest' },
    handL: { wrist: lerp(hip, neck, 0.36), dir: Math.PI / 2, kind: 'rest' },
    hipR: hip,
    hipL: P(hip.u - 6, hip.v),
    kneeR: P(-366, H(520)),
    kneeL: P(-372, H(520)),
    footR: P(-300, 0),
    footL: P(-306, 0),
    floor: 0,
    facing: 1,
  };
})();

/** From above (u = x, v = z), chest toward +x: authored round the neck with the chest toward +v (facing 0 →
 *  turned to +x by topPerson's own turn). */
const TOP_POSE: PlayerPose = (() => {
  const n = P(PLAYER.shoulderX, 0);
  // world (x, z) → authored: rotate by +90° round the neck (topPerson turns it back by −90°)
  const A = (x: number, z: number): Pt => P(n.u - (z - n.v), n.v + (x - n.u));
  return {
    view: 'above',
    posture: 'standing',
    head: { c: A(-346, 0), r: 100 },
    neck: n,
    shoulderR: A(PLAYER.shoulderX, PLAYER.shoulderZ),
    shoulderL: A(PLAYER.shoulderX, -PLAYER.shoulderZ),
    elbowR: A(PLAYER.shoulderX + 4, PLAYER.shoulderZ + 10),
    elbowL: A(PLAYER.shoulderX + 4, -PLAYER.shoulderZ - 10),
    handR: { wrist: A(PLAYER.shoulderX + 120, PLAYER.shoulderZ), dir: 0, kind: 'rest' },
    handL: { wrist: A(PLAYER.shoulderX + 120, -PLAYER.shoulderZ), dir: 0, kind: 'rest' },
    hipR: A(-368, 100),
    hipL: A(-368, -100),
    kneeR: A(-366, 105),
    kneeL: A(-366, -105),
    footR: A(-300, 100),
    footL: A(-300, -100),
    floor: null,
    facing: 0,
  };
})();

export function PlayerSideV2SP({ opacity = 1 }: { opacity?: number }) {
  return <PersonSideV2 pose={SIDE_POSE} who={spPlayer()} opts={{ noArm: 'near' }} dim={opacity} />;
}
export function PlayerTopV2SP({ opacity = 1 }: { opacity?: number }) {
  return <PersonTopV2 pose={TOP_POSE} who={spPlayer()} part="upper" dim={opacity} />;
}

/* ── an arm and its hand ── */

const armCache = new Map<string, ArmPlan>();
/** The approved sleeve from the shoulder through the elbow to a cuff that ends AT the wrist (view points). */
export function spArm(s: P2, e: P2, w: P2): ArmPlan {
  const k = `${s.join(',')}|${e.join(',')}|${w.join(',')}`;
  const hit = armCache.get(k);
  if (hit) return hit;
  const S = P(s[0], s[1]);
  const E = P(e[0], e[1]);
  const W0 = P(w[0], w[1]);
  const fd = unit(sub(W0, E));
  const B = spPlayer().body;
  const a = armPlan(S, E, add(W0, mul(fd, 16)), null, false, null, 0, null, false, { one: true, k: B?.shoulder ?? 1, fore: B?.limb ?? 1 });
  armCache.set(k, a);
  return a;
}

/** The person's own shirt (side or from above): the sleeve shares its light and is outlined only where it is the
 *  figure's edge — never a tube outlined over the shirt. */
const torsoCache = new Map<SPView, Torso>();
function torsoFor(view: SPView): Torso {
  const hit = torsoCache.get(view);
  if (hit) return hit;
  let t: Torso;
  if (view === 'side') {
    const plan = personPlan(SIDE_POSE, spPlayer(), { noArm: 'near' });
    const shirt = sidePaths(plan).shirt;
    const b = shirt.getBounds();
    t = { axis: [plan.hip, plan.neck], box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: shirt };
  } else {
    const plan = personTopPlan(TOP_POSE, spPlayer(), {});
    const torso = topPaths(plan).torso;
    const b = torso.getBounds();
    t = { axis: plan.torsoAxis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: torso };
  }
  torsoCache.set(view, t);
  return t;
}

/** An arm alone in its sleeve (its hand drawn by SPHandV2 / HeldHandV2). */
export function Arm2DV2({ s, e, w, view = 'side', opacity = 1, stick }: { s: P2; e: P2; w: P2; view?: SPView; opacity?: number; stick?: ReactNode }) {
  const lite = useFigureScale().level === 'lite';
  const a = spArm(s, e, w);
  const AP = armPaths(a, VIEWS[view]);
  return (
    <FigureLook look={spPlayer().look}>
      <Group opacity={opacity}>{lite ? <ArmLite a={a} P={AP} stick={stick ?? null} /> : <Arm a={a} P={AP} t={torsoFor(view)} stick={stick ?? null} />}</Group>
    </FigureLook>
  );
}

/** A posed hand in the approved look, its wrist out of the arm's cuff (`s`, `e`: the arm's shoulder and elbow
 *  in the view, so the wrist starts at that cuff), one layer or both. */
export function SPHandV2({ sk, view, s, e, cut, part = 'all' }: { sk: HandSkeleton; view: SPView; s: P2; e: P2; cut?: { p: V3; n: V3 } | null; part?: 'all' | FamLayer }) {
  const V = VIEWS[view];
  const w0 = V(sk.frame.o);
  const a = spArm(s, e, [w0.u, w0.v]);
  const { e: op, out } = a.opening;
  const h = familyHand(sk, V, `sp|${view}|${s.join(',')}|${e.join(',')}`, { cut: cut ?? null, from: P(op.c.u + out.u * 2, op.c.v + out.v * 2) });
  const cuff: SkPath = armPaths(a, V).cuffCloth;
  return (
    <FigureLook look={spPlayer().look}>
      {/* (the cuff stays over the wrist: the hand is not painted on it) */}
      <Group clip={cuff} invertClip>
        <FamilyHandV2 h={h} layer={part === 'all' ? undefined : part} />
      </Group>
    </FigureLook>
  );
}

const proj = (view: SPView, p: V3): P2 => {
  const r = VIEWS[view](p);
  return [r.u, r.v];
};

/** HeldHand in the approved look: the arm, the hand's far parts, what it holds, its near parts. */
export function HeldHandV2({ view, S, E, sk, held, cut, arm = true, armElsewhere = false, opacity = 1 }: { view: SPView; S: V3; E: V3; sk: HandSkeleton; held?: ReactNode; cut?: { p: V3; n: V3 }; arm?: boolean; armElsewhere?: boolean; opacity?: number }) {
  const s = proj(view, S);
  const e = proj(view, E);
  const w = proj(view, sk.frame.o);
  return (
    <Group opacity={opacity}>
      {arm && !armElsewhere ? <Arm2DV2 s={s} e={e} w={w} view={view} /> : null}
      {cut ? <SPHandV2 sk={sk} view={view} s={s} e={e} cut={cut} part="behind" /> : null}
      {held}
      <SPHandV2 sk={sk} view={view} s={s} e={e} cut={cut} part={cut ? 'front' : 'all'} />
    </Group>
  );
}

/** The plane through a held stick, square to the view: the fingers wrapped beyond it go behind the stick. */
export function stickCut(view: SPView, a: V3, b: V3): { p: V3; n: V3 } {
  const ax = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const l = Math.hypot(ax.x, ax.y, ax.z) || 1;
  const u = { x: ax.x / l, y: ax.y / l, z: ax.z / l };
  const t = view === 'side' ? { x: 0, y: 0, z: 1 } : { x: 0, y: -1, z: 0 };
  const d = t.x * u.x + t.y * u.y + t.z * u.z;
  const n = { x: t.x - u.x * d, y: t.y - u.y * d, z: t.z - u.z * d };
  const nl = Math.hypot(n.x, n.y, n.z) || 1;
  return { p: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }, n: { x: n.x / nl, y: n.y / nl, z: n.z / nl } };
}

/** A lesson's posed hand: the approved look when the family's switch is on (`S`, `E`: its arm's shoulder and
 *  elbow, so the wrist leaves that arm's cuff), else the lesson's old hand (`old`). */
export function SPHand3({ sk, view, S, E, cut, part = 'all', old, on }: { sk: HandSkeleton; view: SPView; S: V3; E: V3; cut?: { p: V3; n: V3 } | null; part?: 'all' | FamLayer; old: ReactNode; on: boolean }) {
  if (!on) return <>{old}</>;
  return <SPHandV2 sk={sk} view={view} s={proj(view, S)} e={proj(view, E)} cut={cut} part={part} />;
}
