/**
 * FIGURE V2 — A STANDING OR SEATED PLAYER FROM ABOVE WITH HANDS ON AN
 * INSTRUMENT (waves 6 and 7 of D78, 2026-11-24: plan markers, seating plans and
 * the pictures outside Miking). New code beside the approved top view: the
 * cast member's shoulders, back and head come from `personTopPlan` (topPerson.ts,
 * unchanged), the arms from the approved arm (sidePlan.armPlan, seen from above)
 * ending in the approved fist seen from above (authoredHands 'backTop', the
 * kit drummer's: the back of the hand, the thumb under the hand). A hand on a
 * guitar neck, a pick, a mallet, a bow, a wind's keys is drawn as that one
 * approved hand from above, closed round the thing it holds (`grip` gives the
 * line the hand closes round), never a flat paddle.
 *
 * The caller gives the hands' places in the PICTURE's frame (mm; the player's
 * neck at `neck`, the chest toward `facing` radians, 0 = +u), as the old plan
 * markers did; nothing the learner reads moves.
 */
import { memo, type ReactNode } from 'react';
import { Group, Paint, Path } from '@shopify/react-native-skia';
import type { PlayerPose } from '../players/playerPose.ts';
import { add, crossZ, dist, mul, P, sub, unit, type Pt } from './geom.ts';
import { placeHand, placeRest, type PlacedHand } from './authoredHands.ts';
import { armPlan, type ArmPlan } from './sidePlan.ts';
import type { TopPlan } from './topPlan.ts';
import { personTopPlan } from './topPerson.ts';
import { topPaths, HeadTop, DrummerTopLegsV2 } from './FigureV2Top';
import { Arm, ShirtLight, type Torso } from './FigureV2Side';
import { TopLite } from './lite';
import { Folds } from './paint';
import { FigureScale, levelOf, useFigureScale } from './detail';
import { FigureLook } from './look';
import type { CastMember } from './cast';
import { PersonTopV2 } from './personV2';
import { standingAbovePose } from './markerPose.ts';
import { noseTip } from './playersGrip.ts';

/** One hand on its instrument, in the picture's frame (mm). */
export type TopGrip = {
  /** Where the elbow is. */
  elbow: Pt;
  /** The middle of the fist (the point the hand closes round). */
  at: Pt;
  /** The direction of the thing held through the fist (a neck toward its head, a stick toward its tip). */
  along: Pt;
  /** Which side the thumb lies (the approved fist from above: the thumb under the hand, toward this side). */
  thumb: 1 | -1;
  /** Foreshortening along the hand (1: the hand lies flat to the viewer). */
  sx?: number;
  /** 'fist' (default): closed round `along`; 'rest': the approved relaxed hand from above (restTop), the back
   *  of the hand up, fingers gently curled, pointing along `along` (a bassist's plucking fingers, a hand on keys). */
  kind?: 'fist' | 'rest';
};

export type TopPlayer = {
  /** The neck (the base of the collar), in the picture. */
  neck: Pt;
  /** The chest's direction (radians; 0 = +u). */
  facing: number;
  /** The player's right and left hands. */
  R: TopGrip;
  L: TopGrip;
  /** Seated: the thighs and shoes, forward of the hips. */
  seated?: boolean;
};

const rot = (a: number) => (d: Pt): Pt => P(d.u * Math.cos(a) - d.v * Math.sin(a), d.u * Math.sin(a) + d.v * Math.cos(a));

/** The 'above' pose for the player (authored round the neck: u toward the player's left, v forward). */
export function topPlayerPose(p: TopPlayer): PlayerPose {
  // picture → authored: undo the turn of personTopPlan (facing − π/2 about the neck)
  const back = rot(-(p.facing - Math.PI / 2));
  const A = (q: Pt): Pt => add(p.neck, back(sub(q, p.neck)));
  const L = (left: number, fwd: number) => P(p.neck.u + left, p.neck.v + fwd);
  const seated = !!p.seated;
  return {
    view: 'above',
    posture: seated ? 'seated' : 'standing',
    facing: p.facing,
    head: { c: L(0, 18), r: 110 },
    neck: p.neck,
    shoulderR: L(-176, -6),
    shoulderL: L(176, -6),
    elbowR: A(p.R.elbow),
    elbowL: A(p.L.elbow),
    handR: { wrist: A(p.R.at), dir: 0, kind: 'rest' },
    handL: { wrist: A(p.L.at), dir: 0, kind: 'rest' },
    hipR: L(-106, seated ? -10 : -6),
    hipL: L(106, seated ? -10 : -6),
    kneeR: seated ? L(-112, 420) : L(-110, 6),
    kneeL: seated ? L(112, 420) : L(110, 6),
    footR: seated ? L(-120, 470) : L(-104, 70),
    footL: seated ? L(120, 470) : L(104, 70),
    floor: null,
  };
}

/** The approved fist from above, closed round `g.along` at `g.at`. */
export function placeTopGrip(g: TopGrip): PlacedHand {
  const d = unit(g.along);
  if (g.kind === 'rest') {
    // the relaxed hand: its wrist behind the middle of the hand, the thumb toward the `thumb` side of `along`
    const side = mul(P(-d.v, d.u), g.thumb);
    return placeRest('restTop', add(g.at, mul(d, -80)), Math.atan2(d.v, d.u), side);
  }
  const Q = (k: number) => add(g.at, mul(d, k));
  // the wrist: back along the forearm from the fist (the side view's own hand length scale)
  const W = add(g.at, mul(unit(sub(g.elbow, g.at)), 70));
  const sx = g.sx ?? 0.85;
  const mirror = g.thumb < 0;
  return placeHand('backTop', W, g.at, Q(-116), Q(290), sx, { mirror });
}

const planCache = new WeakMap<TopPlayer, Map<string, TopPlan>>();

/** The cast member playing, from above (memoised per player and person). */
export function topPlayerPlan(p: TopPlayer, who: CastMember): TopPlan {
  let m = planCache.get(p);
  if (!m) {
    m = new Map();
    planCache.set(p, m);
  }
  const hit = m.get(who.id);
  if (hit) return hit;
  const pose = topPlayerPose(p);
  // the shoulders, back, head and legs of the approved top view (the desk variant carries the legs)
  const base = personTopPlan(pose, who, { desk: !!p.seated });
  const turn = rot(p.facing - Math.PI / 2);
  const W = (a: Pt): Pt => add(p.neck, turn(sub(a, p.neck)));
  const armB = who.body ? { one: true, k: who.body.shoulder, fore: who.body.limb } : {};
  const arm = (s: Pt, g: TopGrip): ArmPlan => {
    const placed = placeTopGrip(g);
    return armPlan(s, g.elbow, placed.wrist, null, false, placed, 0, null, true, armB);
  };
  const near = arm(W(pose.shoulderR), p.R);
  const far = arm(W(pose.shoulderL), p.L);
  // (Ensembles3, reviewer: "the nose a big triangular spike past the hairline — a beak") from above only the nose's
  // tip shows past the brow (playersGrip noseTip, the players' own rule)
  const plan: TopPlan = noseTip({ ...base, arms: { near, far } });
  m.set(who.id, plan);
  return plan;
}

/** A cast member playing, from above. `part`: 'lower' the seated legs (under an instrument), 'upper' the rest. */
export const PlayerTopV2 = memo(function PlayerTopV2({ player, who, part = 'all', dim = 1, assumePtPerMm, nearHeld, farHeld }: { player: TopPlayer; who: CastMember; part?: 'all' | 'lower' | 'upper'; dim?: number; assumePtPerMm?: number; /** what each hand holds, drawn between the fist's back and front layers */ nearHeld?: ReactNode; farHeld?: ReactNode }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const plan = topPlayerPlan(player, who);
  const T = topPaths(plan);
  const b = T.torso.getBounds();
  const torso: Torso = { axis: plan.torsoAxis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: T.torso };
  const legs = !!player.seated;
  const body =
    level === 'lite' ? (
      legs || part !== 'lower' ? <TopLite plan={plan} T={T} part={part === 'lower' ? 'legs' : legs ? part : 'upper'} arms farStick={farHeld} nearStick={nearHeld} /> : null
    ) : (
      <Group>
        {part !== 'upper' && legs ? <DrummerTopLegsV2 plan={plan} /> : null}
        {part !== 'lower' ? (
          <Group>
            <Arm a={plan.arms.far} P={T.far} t={torso} stick={farHeld} />
            <Arm a={plan.arms.near} P={T.near} t={torso} stick={nearHeld} />
            <ShirtLight path={T.torso} t={torso} />
            <Group clip={T.torso}>
              <Folds path={T.blades} mat={who.look.MAT.shirt} opacity={0.5} />
            </Group>
            <Path path={T.torso} style="stroke" strokeWidth={1} color={who.look.MAT.shirt.edge} opacity={0.5} />
            <HeadTop plan={plan} T={T} />
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

/** (tests) the elbow's bend from above, degrees, and the forearm's drawn length (mm). */
export function topGripNumbers(p: TopPlayer, g: TopGrip): { fore: number; thumbSide: number } {
  const placed = placeTopGrip(g);
  return { fore: dist(g.elbow, placed.wrist), thumbSide: placed.thumbTip ? Math.sign(crossZ(unit(g.along), sub(placed.thumbTip, g.at))) : 0 };
}

/**
 * A plan's small standing person (the old "shoulders and a head" marker: a singer at a mic, an
 * accompanist, a neighbour on a stage plan), drawn as the cast member from above — the approved top
 * view, the arms hanging (only the shoulders, back and head show). The neck at the origin, facing
 * `facing` radians (0 = +u, as the old markers' heads were turned). `narrow`: a person standing close.
 */
export const MarkerTopV2 = memo(function MarkerTopV2({ who, facing = 0, dim = 1, narrow = false }: { who: CastMember; facing?: number; dim?: number; narrow?: boolean }) {
  return (
    <Group transform={[{ rotate: facing - Math.PI / 2 }]}>
      <PersonTopV2 pose={standingAbovePose(narrow)} who={who} dim={dim} />
    </Group>
  );
});

/**
 * (wave 7, the sports dish operators) A TopPlayer from an 'above' PlayerPose (joints authored round the neck,
 * the chest toward +v, turned by `facing`, as PlayerFigure.buildAbove / topPerson.ts read them): the hands at
 * the pose's wrists, each closed round a grip (the approved fist from above) or resting ('rest').
 */
export function topPlayerOfPose(pose: PlayerPose, kinds: { R: 'fist' | 'rest'; L: 'fist' | 'rest' }): TopPlayer {
  const n = pose.neck;
  const turn = rot((pose.facing ?? 0) - Math.PI / 2);
  const W = (a: Pt): Pt => add(n, turn(sub(a, n)));
  const grip = (e: Pt, w: Pt, kind: 'fist' | 'rest', sx: 1 | -1): TopGrip => {
    const E = W(e);
    const Wr = W(w);
    const f = unit(sub(Wr, E));
    const at = add(Wr, mul(f, 55));
    return kind === 'rest' ? { elbow: E, at, along: f, thumb: sx, kind: 'rest' } : { elbow: E, at, along: P(-f.v * sx, f.u * sx), thumb: (-sx) as 1 | -1, sx: 0.8 };
  };
  return { neck: n, facing: pose.facing ?? 0, R: grip(pose.elbowR, pose.handR.wrist, kinds.R, 1), L: grip(pose.elbowL, pose.handL.wrist, kinds.L, -1), seated: pose.posture === 'seated' };
}
