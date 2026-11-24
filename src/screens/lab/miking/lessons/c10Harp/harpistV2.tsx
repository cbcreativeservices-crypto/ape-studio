/**
 * C10 HARP — the harpist in the new look (figure V2, wave 3 set 3c of D78,
 * 2026-11-24): Ruth of the cast, on the lesson's seat, on the SAME 3-D body
 * and the SAME posed hands as the current picture (harpistPose.ts: the harp's
 * soundbox resting on the right shoulder, the forearms level toward the
 * strings, each hand's pads solved onto real strings — the thumb up on the
 * higher string, index, middle and ring each two strings lower, the fingers
 * curved, the thumb's tip toward the neck; the right hand on the near side of
 * the strings, the left on the far side, seen through them; the near foot on
 * the pedals). Only the drawing is new: the approved seated body, the approved
 * sleeve to just past each hand's own wrist crease, and each posed hand drawn
 * in the approved hands' language (figureV2/familyHand: one silhouette out of
 * the cuff's opening, the thumb grown from its mound, one finger one shape).
 * Nothing moves a string, the harp, a keep-out or a measured point.
 */
import { memo } from 'react';
import { BlurMask, Group, Path } from '@shopify/react-native-skia';
import type { PlayerPose } from '../shared/players/playerPose.ts';
import type { HandSkeleton, V3 } from '../shared/players/handModel.ts';
import { castFor, type CastMember } from '../shared/figureV2/cast';
import { armPlan, sidePlan, type SidePlan } from '../shared/figureV2/sidePlan.ts';
import { personTopPlan } from '../shared/figureV2/topPerson.ts';
import type { TopPlan } from '../shared/figureV2/topPlan.ts';
import { armPaths, sidePaths, smoothClosed, unionOf, type SkPath } from '../shared/figureV2/paths.ts';
import { familyHand, type FamHand } from '../shared/figureV2/familyHand.ts';
import { FamilyHandV2 } from '../shared/figureV2/familyHandV2';
import { PlayerArmV2, PlayerBodyV2, PlayerTopV2, recedeV2 } from '../shared/figureV2/playersV2';
import { Arm, type Torso } from '../shared/figureV2/FigureV2Side';
import { ArmLite } from '../shared/figureV2/lite';
import { topPaths } from '../shared/figureV2/FigureV2Top';
import { FigureScale, levelOf, useFigureScale } from '../shared/figureV2/detail';
import { FigureLook } from '../shared/figureV2/look';
import { P, type Pt } from '../shared/figureV2/geom.ts';
import { harpHands, harpistBody } from './harpistPose.ts';

export const HARPIST = castFor('player.harp');

const SIDE_VIEW = (p: V3) => ({ u: p.x, v: p.y, d: p.z });
const TOP_VIEW = (p: V3) => ({ u: p.x, v: p.z, d: -p.y });

type Posed = { sk: HandSkeleton };
const posedOf = (h: PlayerPose['handR']): HandSkeleton | null => ((h as unknown as { posed?: Posed }).posed ? (h as unknown as { posed: Posed }).posed.sk : null);
const sub3 = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

/**
 * THE HEAD BESIDE THE HARP'S TOP (review 2026-11-24, KeysGuitar2: "the soundboard is drawn diagonally across her
 * eye and forehead"). True depth from the player's right: the pedal harp's soundbox rests on her right shoulder
 * (its top ≈ z 0, 120 wide) and her head is to its LEFT (z −150), so the soundbox IS nearer the camera and is
 * rightly drawn over whatever of the head lies behind it — the draw order stays. What was wrong is the posture:
 * the head sat upright behind the shoulders, its eyes exactly behind the soundbox's top. A harpist brings the
 * head forward beside the neck of the harp to look PAST the strings: here the neck ≈ 5 cm and the head ≈ 11 cm
 * toward the strings, a little down, so the face is in front of the soundboard's edge (seen through the strings)
 * and the soundbox's top lies over the back of her head. Drawing only: the shoulders, arms and every posed hand
 * and string contact are the lesson's. The lever harp's smaller soundbox already clears her face: no lean.
 */
const LEVER_NECK = harpistBody(true).neck;
export const HEAD_LEAN = { head: P(-58, -4), neck: P(-18, 0) } as const;
export function headLean(pose: PlayerPose): { head: Pt; neck: Pt } {
  const lever = Math.abs(pose.neck.u - LEVER_NECK.x) < 1 && Math.abs(pose.neck.v - LEVER_NECK.y) < 1;
  return lever ? { head: P(0, 0), neck: P(0, 0) } : HEAD_LEAN;
}

/** The side plan of a harpist pose (the lesson's, or a pluck step's): each sleeve to 16 mm past the posed
 *  hand's own wrist crease; the hands drawn by familyHand. Memoised per pose. */
type SideBuilt = { plan: SidePlan; near: FamHand | null; far: FamHand | null; cuffs: { near: SkPath; far: SkPath } };
const sideCache = new WeakMap<PlayerPose, SideBuilt>();
export function harpistSideV2(pose: PlayerPose, who: CastMember = HARPIST): SideBuilt {
  const hit = sideCache.get(pose);
  if (hit) return hit;
  const end = (h: PlayerPose['handR'], elbow: Pt) => {
    const sk = posedOf(h);
    if (!sk) return h.wrist;
    const o = P(sk.frame.o.x, sk.frame.o.y);
    const d = P(o.u - elbow.u, o.v - elbow.v);
    const l = Math.hypot(d.u, d.v) || 1;
    return P(o.u + (d.u / l) * 16, o.v + (d.v / l) * 16);
  };
  // (the far knee and foot drawn a little behind the near ones — drawing only — so both legs read)
  const lean = headLean(pose);
  const posed: PlayerPose = {
    ...pose,
    head: { ...pose.head, c: P(pose.head.c.u + lean.head.u, pose.head.c.v + lean.head.v) },
    neck: P(pose.neck.u + lean.neck.u, pose.neck.v + lean.neck.v),
    kneeL: P(pose.kneeL.u - 60, pose.kneeL.v),
    footL: P(pose.footL.u - 80, pose.footL.v),
    handR: { ...pose.handR, wrist: end(pose.handR, pose.elbowR) },
    handL: { ...pose.handL, wrist: end(pose.handL, pose.elbowL) },
  };
  const plan = sidePlan(posed, { head: who.head, body: who.body, nod: 4 });
  const hand = (h: PlayerPose['handR'], a: SidePlan['arms']['near'], k: string) => {
    const sk = posedOf(h);
    if (!sk) return null;
    const { e, out } = a.opening;
    return familyHand(sk, SIDE_VIEW, `harp|side|${k}|${sk.frame.o.x.toFixed(1)},${sk.frame.o.y.toFixed(1)}`, { from: P(e.c.u + out.u * 2, e.c.v + out.v * 2) });
  };
  const SP = sidePaths(plan);
  const built = { plan, near: hand(pose.handR, plan.arms.near, 'R'), far: hand(pose.handL, plan.arms.far, 'L'), cuffs: { near: SP.near.cuffCloth, far: SP.far.cuffCloth } };
  sideCache.set(pose, built);
  return built;
}

/** A posed hand painted outside its cuff's cloth (the wrist's skin comes out of the opening). */
function HandOut({ h, cuff }: { h: FamHand | null; cuff: SkPath }) {
  if (!h) return null;
  return (
    <Group clip={cuff} invertClip>
      <FamilyHandV2 h={h} />
    </Group>
  );
}

/** The near leg's drawn outline (thigh, shin, shoe) — where it lies over the harp it is painted again. */
export function harpistNearLegPath(pose: PlayerPose): SkPath {
  const { plan } = harpistSideV2(pose);
  const L = plan.legs.near;
  const S = plan.shoes.near;
  return unionOf(smoothClosed(L.outline), smoothClosed(L.lower), smoothClosed(S.upper), smoothClosed(S.sole));
}

/** From the side, BEHIND the harp: the far arm with its hand (beyond the strings), then the body (legs, torso,
 *  head) over it. */
export const HarpistSideBehindV2 = memo(function HarpistSideBehindV2({ pose, dim = 1 }: { pose: PlayerPose; dim?: number }) {
  const b = harpistSideV2(pose);
  return (
    <Group>
      <PlayerArmV2 plan={b.plan} who={HARPIST} which="far" dim={dim} stick={<HandOut h={b.far} cuff={b.cuffs.far} />} />
      <PlayerBodyV2 plan={b.plan} who={HARPIST} dim={dim} />
    </Group>
  );
});

/** The body again inside `clip` (the near leg where it lies in front of the soundbox and the pedals). */
export const HarpistSideLegsV2 = memo(function HarpistSideLegsV2({ pose, clip, dim = 1 }: { pose: PlayerPose; clip: SkPath; dim?: number }) {
  const b = harpistSideV2(pose);
  return (
    <Group clip={clip}>
      <PlayerBodyV2 plan={b.plan} who={HARPIST} dim={dim} />
    </Group>
  );
});

/** From the side, IN FRONT of the strings: the near arm and its hand. */
export const HarpistSideNearV2 = memo(function HarpistSideNearV2({ pose, dim = 1 }: { pose: PlayerPose; dim?: number }) {
  const b = harpistSideV2(pose);
  return <PlayerArmV2 plan={b.plan} who={HARPIST} which="near" dim={dim} stick={<HandOut h={b.near} cuff={b.cuffs.near} />} />;
});

/* ── from above ── */

type TopBuilt = { plan: TopPlan; near: FamHand; far: FamHand; cuffs: { near: SkPath; far: SkPath } };
const topCache = new Map<string, TopBuilt>();
export function harpistTopV2(pose: PlayerPose, lever: boolean, who: CastMember = HARPIST): TopBuilt {
  const key = `${lever ? 'l' : 'p'}:${who.id}`;
  const hit = topCache.get(key);
  if (hit) return hit;
  const H = harpHands(lever);
  // (the same head lean as the side view; the top pose is authored chest toward +v and turned a quarter round
  // its neck, so a move toward the strings (+x) is +v here)
  const lean = lever ? 0 : HEAD_LEAN.head.u;
  const base = personTopPlan(lean ? { ...pose, head: { ...pose.head, c: P(pose.head.c.u, pose.head.c.v + lean) } } : pose, who, { desk: true });
  const B = who.body;
  const armB = B ? { one: true, k: B.shoulder, fore: B.limb } : {};
  const xz = (q: V3): Pt => P(q.x, q.z);
  const arm = (h: (typeof H)['R']) => {
    const o = h.sk.frame.o;
    const fore = sub3(o, h.elbow);
    const l = Math.hypot(fore.x, fore.y, fore.z) || 1;
    const end = { x: o.x + (fore.x / l) * 16, y: o.y + (fore.y / l) * 16, z: o.z + (fore.z / l) * 16 };
    return armPlan(xz(h.shoulder), xz(h.elbow), xz(end), null, false, null, -fore.y / l, null, true, armB);
  };
  const plan: TopPlan = { ...base, arms: { near: arm(H.R), far: arm(H.L) } };
  const hand = (h: (typeof H)['R'], a: TopPlan['arms']['near'], k: string) => {
    const { e, out } = a.opening;
    return familyHand(h.sk, TOP_VIEW, `harp|top|${k}|${key}`, { from: P(e.c.u + out.u * 2, e.c.v + out.v * 2) });
  };
  const built = { plan, near: hand(H.R, plan.arms.near, 'R'), far: hand(H.L, plan.arms.far, 'L'), cuffs: { near: armPaths(plan.arms.near, TOP_VIEW).cuffCloth, far: armPaths(plan.arms.far, TOP_VIEW).cuffCloth } };
  topCache.set(key, built);
  return built;
}

/** From above: 'behind' the seat-side body (legs, shoulders, head — under the soundbox); 'front' both arms and
 *  hands (over the soundbox, under the neck and strings). */
export const HarpistTopV2 = memo(function HarpistTopV2({ pose, lever, part, dim = 1 }: { pose: PlayerPose; lever: boolean; part: 'behind' | 'front'; dim?: number }) {
  const b = harpistTopV2(pose, lever);
  if (part === 'behind') return <PlayerTopV2 plan={b.plan} who={HARPIST} dim={dim} legs />;
  return <HarpistTopArms b={b} dim={dim} />;
});

function HarpistTopArms({ b, dim }: { b: TopBuilt; dim: number }) {
  const v = useFigureScale();
  const level = levelOf({ ptPerMm: v.ptPerMm, level: v.level });
  const T = topPaths(b.plan);
  const bb = T.torso.getBounds();
  const torso: Torso = { axis: b.plan.torsoAxis, box: { x: bb.x, y: bb.y, width: bb.width, height: bb.height }, body: T.torso };
  const one = (which: 'near' | 'far') => {
    const stick = <HandOut h={b[which]} cuff={b.cuffs[which]} />;
    return level === 'lite' ? <ArmLite a={b.plan.arms[which]} P={T[which]} stick={stick} /> : <Arm a={b.plan.arms[which]} P={T[which]} t={torso} stick={stick} />;
  };
  return (
    <FigureScale ptPerMm={v.ptPerMm} level={level}>
      <FigureLook look={HARPIST.look}>
        <Group layer={recedeV2(dim) as never}>
          {/* (the arms go in UNDER the shoulders: nothing of them is painted inside the shoulders' cloth, and the
              shoulders' soft shadow lies on them at the root) */}
          <Group clip={T.torso} invertClip>
            {one('far')}
            {one('near')}
            {(['far', 'near'] as const).map((w) => (
              <Group key={w} clip={T[w].upper}>
                <Group transform={[{ translateX: 6 }, { translateY: 8 }]}>
                  <Path path={T.torso} color="#000" opacity={0.3}>
                    <BlurMask blur={8} style="normal" />
                  </Path>
                </Group>
              </Group>
            ))}
          </Group>
        </Group>
      </FigureLook>
    </FigureScale>
  );
}
