/**
 * FIGURE V2 — THE HELD ARM IN A LESSON (wave 3, step B round 2; the study
 * page /heldarm passed 2026-11-24). The arm that carries a hand-held mic, drawn
 * by the lesson's own scene at the holder's depth (the far arm behind the body,
 * the near arm in front of it), wherever the mic is — dragged in the placement
 * scene, set by a tool step's options:
 *
 *   • each frame: the arm solved (heldHands.heldArmSolve: 300 / 290 mm, the
 *     elbow never above the shoulder, the wrist near straight), the approved
 *     sleeve (FigureV2Side.Arm) on it, its cuff over the wrist;
 *   • the hand's paths built ONCE per grip (the frame of the hand, kept to a few
 *     degrees) at the origin, and moved to the fist by one transform;
 *   • the person drawn with that arm off (`noArm`): a new body never carries an
 *     old arm; when the holder holds nothing, the person's own arms.
 *
 * The mic itself is the engine's (or the tool step's): after it, `HeldFront`
 * paints the hand's parts that lie in front of the handle again, so the
 * fingers close round it. Nothing here moves a mic or a measured point.
 */
import { createContext, memo, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { ColorMatrix, Group, Paint } from '@shopify/react-native-skia';
import { useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { CompiledScene, MicBody, MicPose, ViewId } from '../../../engine/model/types.ts';
import { assembly } from '../../../engine/geometry/collision.ts';
import { heldFist } from '../../../engine/geometry/arm.ts';
import { aimVec } from '../../../engine/geometry/vec.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { useFigureScale } from './detail';
import { Arm, FAR_DIM, FAR_SKIN_DIM, type Torso } from './FigureV2Side';
import { ArmLite } from './lite';
import { armPaths, sidePaths } from './paths.ts';
import { armPlan } from './sidePlan.ts';
import { P, type Pt } from './geom.ts';
import { heldArmSolve, heldFrame, placeGrip, type HeldArm, type HeldArmOpts, type PlacedGrip, type V3 } from './heldHands.ts';
import { HeldHand } from './heldHandV2';
import { personPlan, type PersonOpts } from './personV2';
import { personTopPlan, type PersonTopOpts } from './topPerson.ts';
import { topPaths } from './FigureV2Top';
import { FigureLook } from './look';
import type { CastMember } from './cast';

/* ── who holds ── */

/** A person who may hold a mic in a lesson: the engine's grip for them (their shoulder, a `Rim`'s centre), the
 *  person (cast member, poses, options without `noArm`), seated or standing. */
export type HeldHolder = {
  id: string;
  /** The shoulder (frame of the model): the rim's centre the held mic's arm hangs from. */
  shoulder: V3;
  /** The holder's lip point (which side of the body the shoulder is on). */
  lip: V3;
  who: CastMember;
  pose: { side: PlayerPose; top: PlayerPose };
  side: PersonOpts;
  top: PersonTopOpts;
  seated: boolean;
  /** How the arm holds when the mic is far out (the elbow dropped, the shoulder brought forward). */
  drop?: HeldArmOpts['drop'];
  /** From the side this person stands BEHIND another (B10's reporter behind the guest): their held arm is a
   *  value step down, as a far arm, and the scene draws it before the person in front (it comes out from behind
   *  them) - opaque, so the hand closes round the mic with nothing showing through. */
  behindSide?: boolean;
  /** (2026-11-24, FrontBoom3, additive) an arm solved nearly straight keeps a soft bend: the elbow this many mm below
   *  the straight line (B03's reporter "as they stand"). */
  straightBend?: number;
};

/** A held mic now: its front and unit aim, the grip it hangs from, the fist's centre on its handle, the handle's radius there. */
export type HeldMicNow = { key: string; front: V3; aim: V3; grip: V3; fist: V3; r: number; /** the body's length (its tail) */ len?: number };

/** A lesson's held mics: who may hold one, where the fist closes on a type's handle (mm back from the front, when
 *  not the engine's), the handle's radius where the hand closes. */
export type HeldConfig = {
  holders: readonly HeldHolder[];
  fistFromFront?: (typeId: string) => number | undefined;
  gripR?: (typeId: string, radius: number) => number;
  /** (2026-11-24, FrontAndBoom, additive) mic types whose poses the bridge carries too though no hand holds them
   *  — B10's boom: the scene puts its operator's hands on the pole's line as the learner drags the mic. */
  carry?: readonly string[];
  /** (2026-11-24, FrontBoom3, additive) drawn after the mics with the held hands' front parts — B10's boom
   *  operator's fists again over the engine's pole, so the pole passes THROUGH them. */
  front?: (view: ViewId) => ReactNode;
};

type Source = { subscribe: (cb: () => void) => () => void; snapshot: () => readonly HeldMicNow[] };
type Ctx = { cfg: HeldConfig; src: Source };
const HeldCtx = createContext<Ctx | null>(null);

/** The engine's store of the held mics now (one entry per shown mic on a hand). */
export type HeldStore = Source & { set: (key: string, m: HeldMicNow | null) => void };
export function makeHeldStore(): HeldStore {
  const map = new Map<string, HeldMicNow>();
  let snap: readonly HeldMicNow[] = [];
  const subs = new Set<() => void>();
  return {
    subscribe: (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    snapshot: () => snap,
    set: (key, m) => {
      if (m) map.set(key, m);
      else if (!map.delete(key)) return;
      snap = [...map.values()];
      subs.forEach((f) => f());
    },
  };
}

/** The handle's radius where the hand closes (the held hand study's: a flag handheld 0.52 r, a lip ribbon 0.6 r). */
export const heldGripR = (art: string, r: number) => (art === 'lipRibbon' ? 0.6 * r : 0.52 * r);

/** A held mic from its pose (the engine's assembly: the arm hangs from the nearest grip). */
export function heldMicOf(key: string, pose: MicPose, body: MicBody, scene: CompiledScene, typeId: string, cfg: HeldConfig): HeldMicNow | null {
  const segs = assembly(scene, pose, body);
  const arm = segs.find((s) => s.piece === 'arm');
  if (!arm) return null;
  const aim = aimVec(pose.az, pose.el);
  const k = cfg.fistFromFront?.(typeId);
  const fist = k != null ? { x: pose.p.x - aim.x * k, y: pose.p.y - aim.y * k, z: pose.p.z - aim.z * k } : heldFist(arm.a, aim);
  return { key, front: pose.p, aim, grip: arm.b, fist, r: cfg.gripR ? cfg.gripR(typeId, body.radius) : 0.52 * body.radius, len: body.length };
}

/** A held mic where a tool step puts it: its front, unit aim, body length and radius, the holder's grip. */
export function heldMicAt(key: string, front: V3, aim: V3, len: number, radius: number, grip: V3, cfg: HeldConfig, typeId: string): HeldMicNow {
  const k = cfg.fistFromFront?.(typeId);
  const fist = k != null ? { x: front.x - aim.x * k, y: front.y - aim.y * k, z: front.z - aim.z * k } : heldFist({ x: front.x - aim.x * len, y: front.y - aim.y * len, z: front.z - aim.z * len }, aim);
  return { key, front, aim, grip, fist, r: cfg.gripR ? cfg.gripR(typeId, radius) : 0.52 * radius, len };
}

/** The engine's scope: the store the bridges fill, the lesson's holders. */
export function HeldScope({ cfg, src, children }: { cfg: HeldConfig; src: Source; children: ReactNode }) {
  const v = useMemo(() => ({ cfg, src }), [cfg, src]);
  return <HeldCtx.Provider value={v}>{children}</HeldCtx.Provider>;
}

/** A tool step's scope: the mics where the step puts them (no dragging). */
export function HeldStatic({ cfg, mics, children }: { cfg: HeldConfig; mics: readonly HeldMicNow[]; children: ReactNode }) {
  const key = mics.map((m) => `${m.key}:${m.front.x},${m.front.y},${m.front.z}:${m.aim.x},${m.aim.y},${m.aim.z}`).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- by value
  const src = useMemo<Source>(() => ({ subscribe: () => () => undefined, snapshot: () => mics }), [key]);
  return (
    <HeldScope cfg={cfg} src={src}>
      {children}
    </HeldScope>
  );
}

/** The engine's bridge for one shown held mic: its pose (a shared value) into the store, as it moves. Renders nothing. */
export function HeldBridge({ store, slot, pose, body, scene, typeId, cfg }: { store: HeldStore; slot: string; pose: SharedValue<MicPose>; body: MicBody; scene: CompiledScene; typeId: string; cfg: HeldConfig }) {
  const push = useMemo(() => (v: MicPose) => store.set(slot, heldMicOf(slot, v, body, scene, typeId, cfg)), [store, slot, body, scene, typeId, cfg]);
  useAnimatedReaction(
    () => pose.value,
    (v, prev) => {
      if (v !== prev) scheduleOnRN(push, v);
    },
    [push],
  );
  useEffect(() => {
    push(pose.value);
    return () => store.set(slot, null);
  }, [push, pose, store, slot]);
  return null;
}

/**
 * (2026-11-24, B10: "the operator's fists painted again over the pole do not land on her hands") The store is read as
 * an external store (React's useSyncExternalStore): a layer mounted while the engine's bridge fills the store — the
 * bridges push from the native tree's effects, which run apart from the canvas tree's — never misses that first update
 * and so never draws an older state than its neighbours (B10's operator stood at the starting rig while her fists,
 * painted again after the mics, were drawn at the dragged rig's). The snapshot is the store's own array, replaced only
 * when a mic changes.
 */
const NO_MICS: readonly HeldMicNow[] = [];
const noSubscribe = () => () => undefined;
const noSnapshot = () => NO_MICS;
function useHeldNow(): { cfg: HeldConfig; mics: readonly HeldMicNow[] } | null {
  const ctx = useContext(HeldCtx);
  const mics = useSyncExternalStore(ctx ? ctx.src.subscribe : noSubscribe, ctx ? ctx.src.snapshot : noSnapshot);
  return ctx ? { cfg: ctx.cfg, mics } : null;
}

/** (additive) The mics now in the engine's store (null outside a placement scene), re-rendering as they move. */
export function useHeldMicsNow(): readonly HeldMicNow[] | null {
  return useHeldNow()?.mics ?? null;
}

const near1 = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1;

/* ── the person: their plan once per view ── */

const TOWARD: Record<ViewId, V3> = { side: { x: 0, y: 0, z: 1 }, top: { x: 0, y: -1, z: 0 } };
const projOf = (view: ViewId) => (view === 'side' ? (p: V3): Pt => P(p.x, p.y) : (p: V3): Pt => P(p.x, p.z));

type HolderView = { far: boolean; noArm: 'near' | 'far' | undefined; torso: Torso; shoulder2: Pt; outward: V3 };
const boxOf = (p: { getBounds: () => { x: number; y: number; width: number; height: number } }) => {
  const b = p.getBounds();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
};
const viewCache = new WeakMap<HeldHolder, Partial<Record<ViewId, HolderView>>>();
function holderView(h: HeldHolder, view: ViewId): HolderView {
  let c = viewCache.get(h);
  if (!c) viewCache.set(h, (c = {}));
  const hit = c[view];
  if (hit) return hit;
  const outward: V3 = { x: 0, y: 0, z: Math.sign(h.shoulder.z - h.lip.z) || 1 };
  let out: HolderView;
  if (view === 'side') {
    // the arm on the far side of the body from the side (its shoulder away from the viewer): drawn first
    const far = (h.shoulder.z - h.lip.z) * TOWARD.side.z < 0;
    const noArm = far ? 'far' : 'near';
    const plan = personPlan(h.pose.side, h.who, { ...h.side, noArm });
    const shirt = sidePaths(plan).shirt;
    out = { far, noArm, torso: { axis: [plan.hip, plan.neck], box: boxOf(shirt), body: shirt }, shoulder2: (far ? plan.arms.far : plan.arms.near).shoulder, outward };
  } else {
    // from above a standing person's arms hang under the shoulders (not drawn); a seated one's rest on the desk
    const noArm = h.seated ? 'near' : undefined;
    const plan = personTopPlan(h.pose.top, h.who, { ...h.top, ...(noArm ? { noArm } : {}) });
    const T = topPaths(plan);
    out = { far: false, noArm, torso: { axis: plan.torsoAxis, box: boxOf(T.torso), body: T.torso }, shoulder2: plan.arms.near.shoulder, outward };
  }
  c[view] = out;
  return out;
}

/* ── one frame of the arm ── */

const sub3 = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add3 = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul3 = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const unit3 = (a: V3): V3 => mul3(a, 1 / (Math.hypot(a.x, a.y, a.z) || 1));
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const ORIGIN: V3 = { x: 0, y: 0, z: 0 };

/** The hand's grips, built once each at the origin (the frame kept to about 1°, the wrist's start to 2 mm). */
const gripCache = new Map<string, { g0: PlacedGrip; grips: Map<string, PlacedGrip> }>();
const q = (x: number, k: number) => Math.round(x / k);
const qv = (v: V3, k: number) => `${q(v.x, k)},${q(v.y, k)},${q(v.z, k)}`;
function frameGrips(fr: { f: V3; h: V3; d: V3 }, view: ViewId, R: number) {
  const key = `${view}|${R.toFixed(1)}|${qv(fr.f, 0.015)}|${qv(fr.h, 0.015)}|${qv(fr.d, 0.015)}`;
  let hit = gripCache.get(key);
  if (!hit) {
    if (gripCache.size > 96) gripCache.delete(gripCache.keys().next().value!);
    hit = { g0: placeGrip(ORIGIN, fr, TOWARD[view], projOf(view), R), grips: new Map() };
    gripCache.set(key, hit);
  }
  return hit;
}

export type HeldLiveFrame = { sol: HeldArm; arm: ReturnType<typeof armPlan>; grip: PlacedGrip; at: Pt; far: boolean; /** the mic's tail lies BEHIND the cuff where they cross on the page: the sleeve is painted again over it */ sleeveOver: boolean };

/** The arm for a held mic, one frame (pure: the tests reach it). */
export function heldLiveFrame(h: HeldHolder, view: ViewId, m: HeldMicNow): HeldLiveFrame {
  const hv = holderView(h, view);
  const proj = projOf(view);
  // (the engine lets a held mic reach 630 mm from the shoulder to its tail: near the end of that reach the shoulder
  // comes forward with the arm — up to 50 mm, as a real reach does — so the hand gets there)
  const sf = sub3(m.fist, h.shoulder);
  const d = Math.hypot(sf.x, sf.y, sf.z);
  const shoulder = d > 575 ? add3(h.shoulder, mul3(unit3(sf), Math.min(50, d - 575))) : h.shoulder;
  const sol0 = heldArmSolve(shoulder, m.fist, m.aim, hv.outward, 300, 290, 75, h.drop ? { drop: h.drop } : {});
  // (2026-11-24, FrontBoom3, additive: `straightBend`) an arm at its full reach keeps a soft bend: the elbow a few
  // cm below the straight shoulder–fist line (a drawing default; the fist, the mic and every point unchanged)
  const sol = (() => {
    if (!h.straightBend) return sol0;
    // (a long reach: the elbow swung DOWN round the shoulder–fist line, a little out — never a level rod from the
    // side, never a wide sideways arc from above; its bend at least `straightBend` mm off the line)
    const u = unit3(sub3(sol0.fist, shoulder));
    const se = sub3(sol0.elbow, shoulder);
    const c = add3(shoulder, mul3(u, dot3(se, u)));
    const rv = sub3(sol0.elbow, c);
    const r = Math.max(h.straightBend, Math.hypot(rv.x, rv.y, rv.z));
    const dn = unit3(sub3({ x: 0, y: 1, z: 0 }, mul3(u, u.y)));
    let ow = sub3(hv.outward, add3(mul3(u, dot3(hv.outward, u)), mul3(dn, dot3(hv.outward, dn))));
    ow = Math.hypot(ow.x, ow.y, ow.z) < 1e-3 ? { x: 0, y: 0, z: 0 } : unit3(ow);
    return { ...sol0, elbow: add3(c, add3(mul3(dn, r * 0.88), mul3(ow, r * 0.47))) };
  })();
  const fr = heldFrame(sol.elbow, sol.fist, m.aim, 'R', hv.outward);
  const G = frameGrips(fr, view, m.r);
  const wrist3 = add3(sol.fist, G.g0.wrist3);
  const fore = unit3(sub3(wrist3, sol.elbow));
  const away = dot3(fore, TOWARD[view]) < -0.35;
  const arm = armPlan(hv.shoulder2, proj(sol.elbow), proj(add3(wrist3, mul3(fore, -4))), null, away, null, 0, null, false, { one: true });
  // the wrist's skin from the cuff's opening (its near rim painted over it): never inside the sleeve
  const at = proj(sol.fist);
  const { e, out } = arm.opening;
  const rel = P(q(e.c.u + out.u * 2 - at.u, 2) * 2, q(e.c.v + out.v * 2 - at.v, 2) * 2);
  const rk = `${rel.u},${rel.v}`;
  let grip = G.grips.get(rk);
  if (!grip) {
    if (G.grips.size > 24) G.grips.delete(G.grips.keys().next().value!);
    grip = placeGrip(ORIGIN, fr, TOWARD[view], proj, m.r, { wristFrom2: rel, back: true });
    G.grips.set(rk, grip);
  }
  // (the tail of a handle near the forearm's line: where it passes behind the cuff, the sleeve is in front of it)
  let sleeveOver = false;
  if (m.len) {
    const tail = sub3(m.front, mul3(m.aim, m.len));
    const cuff3 = sub3(wrist3, mul3(fore, 46));
    const T = TOWARD[view];
    const a2 = proj(sol.elbow);
    const b2 = proj(wrist3);
    const t2 = proj(tail);
    const ab = { u: b2.u - a2.u, v: b2.v - a2.v };
    const L2 = ab.u * ab.u + ab.v * ab.v || 1;
    const k = Math.max(0, Math.min(1, ((t2.u - a2.u) * ab.u + (t2.v - a2.v) * ab.v) / L2));
    const dist = Math.hypot(t2.u - (a2.u + ab.u * k), t2.v - (a2.v + ab.v * k));
    sleeveOver = dist < 42 + m.r && dot3(sub3(cuff3, tail), T) > 8;
  }
  return { sol, arm, grip, at, far: sol.far, sleeveOver };
}

/** The last frame per holder and view (the arm and the hand over the mic share it). */
const lastFrame = new WeakMap<HeldHolder, Partial<Record<ViewId, { m: HeldMicNow; f: HeldLiveFrame }>>>();
function frameFor(h: HeldHolder, view: ViewId, m: HeldMicNow): HeldLiveFrame {
  let c = lastFrame.get(h);
  if (!c) lastFrame.set(h, (c = {}));
  const hit = c[view];
  if (hit && hit.m.front === m.front && hit.m.aim.x === m.aim.x && hit.m.aim.y === m.aim.y && hit.m.aim.z === m.aim.z && hit.m.fist.x === m.fist.x && hit.m.fist.y === m.fist.y && hit.m.fist.z === m.fist.z) return hit.f;
  const f = heldLiveFrame(h, view, m);
  c[view] = { m, f };
  return f;
}

/* ── drawn ── */

const dim = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);
/** Out of reach: the arm tinted red (the engine's red for an arm that cannot reach). */
const RED = (
  <Paint>
    <ColorMatrix matrix={[0.55, 0.25, 0.25, 0, 0.45, 0.1, 0.35, 0.1, 0, 0.05, 0.1, 0.1, 0.35, 0, 0.04, 0, 0, 0, 1, 0]} />
  </Paint>
);

const ArmDrawn = memo(function ArmDrawn({ h, view, f, noHand = false }: { h: HeldHolder; view: ViewId; f: HeldLiveFrame; /** the sleeve alone (painted again over a mic tail behind it) */ noHand?: boolean }) {
  const lite = useFigureScale().level === 'lite';
  const hv = holderView(h, view);
  const step = hv.far || (view === 'side' && !!h.behindSide);
  const Pa = armPaths(f.arm, (p) => ({ u: p.x, v: p.y, d: p.z }));
  const hand = noHand ? undefined : (
    <Group transform={[{ translateX: f.at.u }, { translateY: f.at.v }]}>
      <HeldHand h={f.grip} mic={null} />
    </Group>
  );
  const body = lite ? (
    <Group layer={step ? dim(FAR_DIM) : undefined}>
      <ArmLite a={f.arm} P={Pa} stick={hand} />
    </Group>
  ) : (
    <Arm a={f.arm} P={Pa} t={hv.torso} stick={hand} cloth={step ? dim(FAR_DIM) : undefined} skin={step ? dim(FAR_SKIN_DIM) : undefined} />
  );
  return (
    <FigureLook look={h.who.look}>
      <Group layer={f.far ? RED : undefined}>{body}</Group>
    </FigureLook>
  );
});

/**
 * A person who may hold a mic, drawn by the scene: `person(noArm)` draws them (with that arm off while they hold
 * one), and the held arm is drawn at its depth — the far arm before the body, the near arm after it; from above
 * before the body (its shoulder under the shirt). `part` (a seated person from above, drawn round the desk): the
 * 'lower' part has no arm.
 */
export function HeldBy({ holder, view, part = 'all', person, only }: { holder: HeldHolder; view: ViewId; part?: 'all' | 'lower' | 'upper'; person: (noArm: 'near' | 'far' | undefined) => ReactNode; /** the arm alone or the body alone (a person behind another: the arm drawn before the one in front) */ only?: 'arm' | 'body' }) {
  const now = useHeldNow();
  const m = now?.mics.find((x) => near1(x.grip, holder.shoulder));
  const hv = holderView(holder, view);
  // (the person is drawn once per holding state — never again for each frame of a drag)
  const noArm = m ? hv.noArm : undefined;
  const body = useMemo(() => <Group key="body">{person(noArm)}</Group>, [person, noArm]);
  if (!m) return only === 'arm' ? null : body;
  if (part === 'lower') return only === 'arm' ? null : body;
  if (only === 'body') return body;
  const f = frameFor(holder, view, m);
  const arm = <ArmDrawn key="arm" h={holder} view={view} f={f} />;
  if (only === 'arm') return arm;
  if (view === 'side') return <Group>{hv.far ? [arm, body] : [body, arm]}</Group>;
  return <Group>{[arm, body]}</Group>;
}

/** After the mics: the hand's parts in front of each held mic's handle, painted again (the fingers close round it). */
export function HeldFront({ view }: { view: ViewId }) {
  const now = useHeldNow();
  if (!now) return null;
  const out: ReactNode[] = [];
  for (const m of now.mics) {
    const h = now.cfg.holders.find((x) => near1(x.shoulder, m.grip));
    if (!h) continue;
    const f = frameFor(h, view, m);
    const hv = holderView(h, view);
    const step = hv.far || (view === 'side' && !!h.behindSide);
    if (f.sleeveOver) out.push(<ArmDrawn key={`${m.key}:sleeve`} h={h} view={view} f={f} noHand />);
    out.push(
      <FigureLook key={m.key} look={h.who.look}>
        <Group layer={f.far ? RED : undefined}>
          <Group layer={step ? dim(FAR_SKIN_DIM) : undefined} transform={[{ translateX: f.at.u }, { translateY: f.at.v }]}>
            <HeldHand h={f.grip} mic={null} only="front" />
          </Group>
        </Group>
      </FigureLook>,
    );
  }
  const extra = now.cfg.front?.(view);
  if (extra) out.push(<Group key="cfg-front">{extra}</Group>);
  return out.length ? <Group>{out}</Group> : null;
}

/** Whether a lesson's held-mic holder holds the mic at `m` (a tool step's own drawing). */
export const holds = (h: HeldHolder, m: Pick<HeldMicNow, 'grip'>) => near1(h.shoulder, m.grip);
