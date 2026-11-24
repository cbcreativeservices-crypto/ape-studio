/**
 * FIGURE V2 — A CAST MEMBER PLAYING (wave 3, sets 3b–3d of D78, 2026-11-24).
 * The approved renderers on a plan from playersPlan.ts: the side view
 * (FigureV2Side, or SideLite at lesson sizes, the head in full detail when it
 * is drawn ≥ 45 pt tall) and the view from above (the drummer's top-view arm,
 * sleeve, cuff and back of the hand; the cast member's shoulders and head),
 * dressed as the cast member, each stick or mallet passing through its fist.
 * A receding player stays OPAQUE (blended toward the stage's dark, as the old
 * figure and the drummer recede).
 */
import { memo, type ReactNode } from 'react';
import { Blur as SkBlur, Circle, ColorMatrix, Group, Paint, Path } from '@shopify/react-native-skia';
import { LIGHT } from './geom.ts';
import { FigureV2Side, Arm, ShirtLight, FAR_DIM, FAR_SKIN_DIM, type Torso } from './FigureV2Side';
import { ArmLite, SideLite, TopLite } from './lite';
import type { SkPath } from './paths.ts';
import { DrummerTopLegsV2, HeadTop, topPaths } from './FigureV2Top';
import { Folds } from './paint';
import { sidePaths, unionOf } from './paths.ts';
import { Soft } from './paint';
import { FigureScale, levelOf, useFigureScale } from './detail';
import { FigureLook } from './look';
import { FULL_HEAD_PT } from './personV2';
import type { SidePlan } from './sidePlan.ts';
import type { TopPlan } from './topPlan.ts';
import type { CastMember } from './cast';
import { HeldHand, gripSilhouette } from './heldHandV2';
import type { PlacedGrip } from './heldHands.ts';
import type { PlayerPose } from '../players/playerPose.ts';
import { personTopPlan } from './topPerson.ts';
import { gripToPage, headOverNeck } from './playersGrip.ts';
import { GripCues, GripPlug, PlayerFist, playerFistSilhouette, plugOf } from './playersFist';

/** (round 3) Grips placed by playersGrip and seen mostly along their rod are painted as separate finger forms
 *  (playersFist.tsx); false: the mic hand's united-layer painter (heldHandV2) everywhere, as before. */
export const GRIP_FIST = true;
/** How far along the rod the view must look (|toward·rod|) for the separate finger forms. */
const ALONG_ROD = 0.5;
/** A grip's whole outline, as the painter in use draws it. */
const gripSil = (g: PlacedGrip) => {
  const tp = GRIP_FIST && Math.abs(g.view.toward.w) > ALONG_ROD ? gripToPage(g) : null;
  return tp ? playerFistSilhouette(g, tp) : gripSilhouette(g);
};

const RECEDE_BG = [0.075, 0.078, 0.094] as const;
const recedeCache = new Map<number, ReactNode>();
/** Blended toward the stage's dark by `dim`, as one opaque layer (PlayerFigure.recede). */
export function recedeV2(dim: number): ReactNode | undefined {
  if (dim >= 1) return undefined;
  const k = Math.max(0, dim);
  let r = recedeCache.get(k);
  if (!r) {
    const m = [k, 0, 0, 0, (1 - k) * RECEDE_BG[0], 0, k, 0, 0, (1 - k) * RECEDE_BG[1], 0, 0, k, 0, (1 - k) * RECEDE_BG[2], 0, 0, 0, 1, 0];
    r = (
      <Paint>
        <ColorMatrix matrix={m} />
      </Paint>
    );
    recedeCache.set(k, r);
  }
  return r;
}

/** The head's drawn height (pt) on a side plan (≈ the skull's box). */
const headPtOf = (plan: SidePlan, ptPerMm: number | null) => (ptPerMm ?? 0) * (plan.head.box.v1 - plan.head.box.v0);

/**
 * Where the two fists lie almost one over the other in profile (the far hand ≈ 30 cm deeper, at the same
 * height — the timpanist's two mallets), the near hand and cuff cast a soft occlusion shadow onto the far
 * hand, so each fist reads as its own form, the far one behind (drawn after the far arm, before the body).
 */
function NearOnFar({ plan, grips, nearStick, farStick }: { plan: SidePlan; grips?: { near?: PlacedGrip | null; far?: PlacedGrip | null }; /** (2026-11-24) the near hand's stick: its soft shadow on the far fist, so a shaft passing in front of the far hand reads as in front of it, not held by it */ nearStick?: ReactNode; /** (2026-11-24) the far hand's stick: the near hand's soft shadow on it where it leaves the far fist, so it reads as passing BEHIND the near fist, not held by it */ farStick?: ReactNode }) {
  const P = sidePaths(plan);
  const lite = useFigureScale().level === 'lite';
  const nearHand = grips?.near ? gripSil(grips.near) : P.near.art?.all ?? null;
  const farHand = grips?.far ? gripSil(grips.far) : P.far.art?.all ?? null;
  const near = nearHand ? unionOf(nearHand, P.near.cuff, P.near.wristSkin) : null;
  const far = farHand ? unionOf(farHand, P.far.wristSkin) : null;
  if (!near || !far) return null;
  // (spread a little past the near hand's edge, so a dark band runs along it on the far hand)
  return (
    <Group>
      <Group clip={far}>
        {/* (the far fist a step dimmer: about 30 cm deeper) */}
        <Path path={far} color="#000" opacity={0.16} />
        <Soft path={near} opacity={0.5} blur={7} />
        <Soft path={near} opacity={0.55} blur={2.5} />
        {nearStick ? (
          <Group layer={STICK_SHADOW as never} transform={[{ translateX: -LIGHT.u * 4 }, { translateY: -LIGHT.v * 4 }]}>
            {nearStick}
          </Group>
        ) : null}
      </Group>
      {farStick ? (
        // (the far stick again outside the far fist — the same pixels — with the near hand's shadow on it alone)
        <Group clip={far} invertClip>
          <Group layer={dimPaint(lite ? FAR_DIM : FAR_SKIN_DIM)}>
            {farStick}
            <Group blendMode="srcATop">
              <Soft path={near} opacity={0.6} blur={5} />
            </Group>
          </Group>
        </Group>
      ) : null}
    </Group>
  );
}
/**
 * (owner 2026-11-24: "always make sure pole/stick is within the hand. common mistake is it is along the hand
 * outside") The drummer's fist from the back of the hand ('backTop'): the shaft lies inside the fist, under the back
 * of the hand, and leaves it between the thumb and the curled index at the grip point. There the shaft comes out of
 * the fist's shadowed hollow: a soft dark falloff on the SHAFT ALONE (its own pixels) round the grip point, so it
 * reads as emerging from inside the grip, never as a stick laid beside or behind the hand.
 */
function withHollow(stick: ReactNode | undefined, placed: SidePlan['arms']['near']['placed'] | null | undefined): ReactNode | undefined {
  if (!stick || !placed || placed.art.view !== 'backTop') return stick;
  const F = placed.F;
  return (
    <Group layer={<Paint />}>
      {stick}
      <Group blendMode="srcATop">
        <Circle cx={F.u} cy={F.v} r={16} color="#120804" opacity={0.6}>
          <SkBlur blur={6} />
        </Circle>
      </Group>
    </Group>
  );
}

/** A node painted as its own soft dark shadow (black, half its alpha, blurred). */
const STICK_SHADOW = (
  <Paint>
    <ColorMatrix matrix={[0, 0, 0, 0, 0.1, 0, 0, 0, 0, 0.05, 0, 0, 0, 0, 0.03, 0, 0, 0, 0.6, 0]} />
    <SkBlur blur={2.5} />
  </Paint>
);

/** A cast member playing, in profile. `separate`: the near hand's soft shadow on the far hand (two fists
 *  nearly in line with the eye). */
export const PlayerSideV2 = memo(function PlayerSideV2({ plan, who, dim = 1, farStick, nearStick, assumePtPerMm, separate = false, grips }: { plan: SidePlan; who: CastMember; dim?: number; farStick?: ReactNode; nearStick?: ReactNode; assumePtPerMm?: number; separate?: boolean; /** (review 2026-11-24) the hands closed round their rods (playersGrip.ts): each stick passes through its fist */ grips?: { near?: PlacedGrip | null; far?: PlacedGrip | null } }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const over = separate ? { far: <NearOnFar plan={plan} grips={grips} nearStick={grips?.near || grips?.far ? undefined : nearStick} farStick={grips?.near || grips?.far ? undefined : farStick} /> } : undefined;
  if (!grips?.near && !grips?.far) {
    nearStick = withHollow(nearStick, plan.arms.near.placed);
    farStick = withHollow(farStick, plan.arms.far.placed);
  }
  if (grips?.near || grips?.far) {
    const SP = sidePaths(plan);
    if (grips.near) nearStick = <GripHand grip={grips.near} rod={nearStick} hide={plan.arms.near.away ? undefined : unionOf(SP.near.foreSleeve, SP.near.upper)} under={plan.arms.near.away ? undefined : plugOf(SP.near.wristSkin, SP.near.opening, plan.arms.near.opening.e.c)} />;
    if (grips.far) farStick = <GripHand grip={grips.far} rod={farStick} far hide={plan.arms.far.away ? undefined : unionOf(SP.far.foreSleeve, SP.far.upper)} under={plan.arms.far.away ? undefined : plugOf(SP.far.wristSkin, SP.far.opening, plan.arms.far.opening.e.c)} />;
  }
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={recedeV2(dim) as never}>
          {level === 'lite' ? (
            <SideLite
              plan={plan}
              P={sidePaths(plan)}
              farStick={farStick}
              nearStick={nearStick}
              over={over}
              fullHead={
                headPtOf(plan, ptPerMm) >= FULL_HEAD_PT ? (
                  <FigureScale ptPerMm={ptPerMm} level="full">
                    <FigureV2Side plan={plan} part="head" />
                  </FigureScale>
                ) : undefined
              }
            />
          ) : (
            <FigureV2Side plan={plan} farStick={farStick} nearStick={nearStick} over={over} />
          )}
        </Group>
      </FigureLook>
    </FigureScale>
  );
});

/**
 * A cast member playing, from above: `part` 'legs' (a seated player's legs,
 * under the instrument), 'upper' (the arms with their sticks, the shoulders
 * over the arms' roots, the head over all), or both. `legs`: draw the legs
 * (a seated player; a standing player's legs lie under the shoulders).
 */
export const PlayerTopV2 = memo(function PlayerTopV2({ plan, who, dim = 1, part = 'all', legs = false, bareArms = false, farStick, nearStick, assumePtPerMm, grips, plate, hollow = false }: { /** (2026-11-24, opt-in) the shaft leaving the drummer's fist from above out of the fist's shadowed hollow (withHollow) */ hollow?: boolean; /** (round 3) both hands hold a plate by its edges (a clipboard), its outline on the page: the fingers on its far face hidden by it */ plate?: SkPath; plan: TopPlan; who: CastMember; dim?: number; part?: 'all' | 'legs' | 'upper'; legs?: boolean; /** draw both arms though they hold nothing (the hands are drawn by the art, e.g. on a cajón's plate) */ bareArms?: boolean; farStick?: ReactNode; nearStick?: ReactNode; assumePtPerMm?: number; /** (review 2026-11-24) the hands closed round their rods (playersGrip.ts); an arm with a grip is drawn */ grips?: { near?: PlacedGrip | null; far?: PlacedGrip | null } }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  if (grips?.near || grips?.far) {
    const TP = topPaths(plan);
    if (grips.near) nearStick = <GripHand grip={grips.near} rod={nearStick} plate={plate} hide={plan.arms.near.away ? undefined : unionOf(TP.near.foreSleeve, TP.near.upper)} under={plan.arms.near.away ? undefined : plugOf(TP.near.wristSkin, TP.near.opening, plan.arms.near.opening.e.c)} />;
    if (grips.far) farStick = <GripHand grip={grips.far} rod={farStick} plate={plate} hide={plan.arms.far.away ? undefined : unionOf(TP.far.foreSleeve, TP.far.upper)} under={plan.arms.far.away ? undefined : plugOf(TP.far.wristSkin, TP.far.opening, plan.arms.far.opening.e.c)} />;
  } else if (hollow) {
    nearStick = withHollow(nearStick, plan.arms.near.placed);
    farStick = withHollow(farStick, plan.arms.far.placed);
  }
  const showNear = !!plan.arms.near.placed || bareArms || !!grips?.near;
  const showFar = !!plan.arms.far.placed || bareArms || !!grips?.far;
  const T = topPaths(plan);
  const b = T.torso.getBounds();
  const torso: Torso = { axis: plan.torsoAxis, box: { x: b.x, y: b.y, width: b.width, height: b.height }, body: T.torso };
  const showLegs = legs && part !== 'upper';
  const showUpper = part !== 'legs';
  const body =
    level === 'lite' ? (
      <Group>
        {showLegs ? <TopLite plan={plan} T={T} part="legs" /> : null}
        {showUpper ? <TopLite plan={plan} T={T} part="upper" farStick={farStick} nearStick={nearStick} noArm={!showNear ? 'near' : !showFar ? 'far' : undefined} arms={showNear || showFar} /> : null}
      </Group>
    ) : (
      <Group>
        {showLegs ? <DrummerTopLegsV2 plan={plan} /> : null}
        {showUpper ? (
          <Group>
            {/* (an arm that holds nothing hangs under the shoulder: not drawn from above) */}
            {showFar ? <Arm a={plan.arms.far} P={T.far} t={torso} stick={farStick} /> : null}
            {showNear ? <Arm a={plan.arms.near} P={T.near} t={torso} stick={nearStick} /> : null}
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
        <Group layer={recedeV2(dim) as never}>{body}</Group>
      </FigureLook>
    </FigureScale>
  );
});

/**
 * (review 2026-11-24) A hand closed round its rod (playersGrip.ts → heldHands placeGrip, the approved held-mic
 * hand): the parts behind the rod, the rod, the parts in front — the rod passes THROUGH the fist. `far`: the
 * far side's skin step.
 */
export function GripHand({ grip, rod, far = false, hide, under, plate }: { /** (round 3) a plate held by its edge (a clipboard from above), its outline on the page: the fingers on its far face hidden by it */ plate?: SkPath; grip: PlacedGrip; rod?: ReactNode; far?: boolean; /** the arm's own sleeve: the heel of the hand runs on INSIDE it (never drawn over the cloth beyond the cuff) */ hide?: SkPath; /** (round 3: "a square patch over the wrist and a black notch between cuff and hand") the arm's own wrist stub and
   *  the cuff's opening: filled with the hand's own skin under the hand, so the wrist comes out of the cuff as one skin */ under?: SkPath }) {
  // (seen along the rod — the whole hand on the near side of its crossing — the rod's piece in view lies behind
  // the fist: drawn first, the hand over it, as the conductor's bulb)
  const endOn = grip.order[grip.order.length - 1] === 'MIC';
  // (round 3, second review: the united-layer painter read as a wedge / mitten / paddle at lesson size) a grip
  // placed by playersGrip is painted as separate solid finger forms in depth (playersFist.tsx)
  // — only where the rod is seen mostly ALONG its length (the fist from its little finger's or its thumb's side:
  // there the united layers are one block); seen across the rod the approved painter's finger group with its gaps
  // from the tips stays, its creases and lines held to a readable width at lesson size (GripCues)
  const toPage = GRIP_FIST && Math.abs(grip.view.toward.w) > ALONG_ROD ? gripToPage(grip) : null;
  const hand0 = toPage ? (
    <PlayerFist g={grip} toPage={toPage} rod={rod} plate={plate} />
  ) : endOn ? (
    <Group>
      {rod ?? null}
      <HeldHand h={grip} mic={null} />
      <GripCues h={grip} />
    </Group>
  ) : (
    <Group>
      {/* (the mic slot lies between the layers: the cues of the parts behind the rod, then the rod) */}
      <HeldHand
        h={grip}
        mic={
          <Group>
            <GripCues h={grip} layer="behind" />
            {rod ?? null}
          </Group>
        }
      />
      <GripCues h={grip} layer="front" />
    </Group>
  );
  const plug = under ? <GripPlug h={grip} path={under} fist={!!toPage} /> : null;
  const hand = hide ? (
    <Group>
      <Group clip={hide} invertClip>
        {plug}
        {hand0}
      </Group>
    </Group>
  ) : (
    <Group>
      {plug}
      {hand0}
    </Group>
  );
  return far ? <Group layer={dimPaint(FAR_SKIN_DIM)}>{hand}</Group> : hand;
}

const standingTopCache = new WeakMap<PlayerPose, Map<string, TopPlan>>();
/**
 * (review 2026-11-24: from above "the head at the front edge of an egg-shaped body, the face and a beak nose
 * poking out; an armless egg") A standing cast member seen from above: the head over the neck with only the
 * nose's tip past the brow (playersGrip headOverNeck), the hanging arms' sleeve heads at the shoulders. `head`
 * 'only': the head alone (the in-ear wearer's).
 */
export function StandingTopV2({ pose, who, dim = 1, head }: { pose: PlayerPose; who: CastMember; dim?: number; head?: 'only' }) {
  let m = standingTopCache.get(pose);
  if (!m) {
    m = new Map();
    standingTopCache.set(pose, m);
  }
  let plan = m.get(who.id);
  if (!plan) {
    plan = headOverNeck(personTopPlan(pose, who, {}));
    m.set(who.id, plan);
  }
  if (head === 'only')
    return (
      <FigureLook look={who.look}>
        <Group layer={recedeV2(dim) as never}>
          <HeadTop plan={plan} T={topPaths(plan)} />
        </Group>
      </FigureLook>
    );
  return <PlayerTopV2 plan={plan} who={who} dim={dim} bareArms />;
}

const dimPaint = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);

/**
 * (set 3d) A cast member in profile WITHOUT arms, the arms drawn by PlayerArmV2 over an instrument that lies
 * between the body and the hands (a drum across the lap): the legs, torso and head here, then the instrument,
 * then the arms.
 */
export const PlayerBodyV2 = memo(function PlayerBodyV2({ plan, who, dim = 1, assumePtPerMm }: { plan: SidePlan; who: CastMember; dim?: number; assumePtPerMm?: number }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={recedeV2(dim) as never}>
          {level === 'lite' ? (
            <SideLite
              plan={plan}
              P={sidePaths(plan)}
              noArm="both"
              fullHead={
                headPtOf(plan, ptPerMm) >= FULL_HEAD_PT ? (
                  <FigureScale ptPerMm={ptPerMm} level="full">
                    <FigureV2Side plan={plan} part="head" />
                  </FigureScale>
                ) : undefined
              }
            />
          ) : (
            <FigureV2Side plan={plan} noArm="both" />
          )}
        </Group>
      </FigureLook>
    </FigureScale>
  );
});

/**
 * (set 3d) One arm of a side plan, with its hand, over what lies under it. `which` 'far': the far side's value
 * step, and `hideIn` (e.g. the torso's outline) keeps the part of the arm that passes behind the body hidden.
 */
export const PlayerArmV2 = memo(function PlayerArmV2({ plan, who, which, dim = 1, hideIn, stick, assumePtPerMm }: { plan: SidePlan; who: CastMember; which: 'near' | 'far'; dim?: number; hideIn?: SkPath; stick?: ReactNode; assumePtPerMm?: number }) {
  const v = useFigureScale();
  const ptPerMm = v.ptPerMm ?? assumePtPerMm ?? null;
  const level = levelOf({ ptPerMm, level: v.level });
  const P = sidePaths(plan);
  const a = plan.arms[which];
  const ap = which === 'near' ? P.near : P.far;
  const far = which === 'far';
  const sb = P.shirt.getBounds();
  const torso: Torso = { axis: [plan.hip, plan.neck], box: { x: sb.x, y: sb.y, width: sb.width, height: sb.height }, body: P.shirt };
  const arm =
    level === 'lite' ? (
      <Group layer={far ? dimPaint(FAR_DIM) : undefined}>
        <ArmLite a={a} P={ap} stick={stick} />
      </Group>
    ) : (
      <Arm a={a} P={ap} t={torso} stick={stick} cloth={far ? dimPaint(FAR_DIM) : undefined} skin={far ? dimPaint(FAR_SKIN_DIM) : undefined} />
    );
  return (
    <FigureScale ptPerMm={ptPerMm} level={level}>
      <FigureLook look={who.look}>
        <Group layer={recedeV2(dim) as never}>
          {hideIn ? (
            <Group clip={hideIn} invertClip>
              {arm}
            </Group>
          ) : (
            arm
          )}
        </Group>
      </FigureLook>
    </FigureScale>
  );
});
