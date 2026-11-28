/**
 * I02 CAJÓN — the look (charter §2 layer 3), drawn ONLY from the states and
 * the SEAT in model.ts, in millimetres of the view's (u, v): side u = x,
 * v = y; top u = x, v = z.
 *
 *   SIDE  camera on the player's right: the box (front plate to the right),
 *         its port edge-on on the back (or on the front ledge, facing up),
 *         the snare wires dashed inside the plate's top; the SEATED player —
 *         astride the top, leaning over, knees either side of the plate,
 *         feet on the floor; the right hand at a top corner (the slap), the
 *         left at the middle (the bass).
 *   TOP   the box from above, the thighs over its top, the hands on the
 *         plate between the knees; the rear port edge-on on the back, or the
 *         upward front port as a round hole.
 * Proportions ILLUSTRATIVE (proposal Frame J). Nothing moves.
 */
import { useMemo } from 'react';
import { BlurMask, DashPathEffect, Group, LinearGradient, Path, PathOp, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { INK, make, oval, rrect } from '../shared/concert/paths.ts';
import { Hand } from '../shared/smallperc/Hand';
import { dorsalFlat, type Pt } from '../shared/smallperc/hands.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { cajonPose } from './cajonPose.ts';
import { poseHit } from '../shared/players/playerPose.ts';
import { figureV2On } from '../shared/figureV2/figureV2Config';
import { PlayerArmV2, PlayerBodyV2, PlayerSideV2, PlayerTopV2 } from '../shared/figureV2/playersV2';
import { op, sidePaths, smoothClosed, unionOf, type SkPath } from '../shared/figureV2/paths.ts';
import type { SidePlan } from '../shared/figureV2/sidePlan.ts';
import { personShapes } from '../shared/figureV2/personV2';
import { inPoly } from '../shared/figureV2/geom.ts';
import { CAJON_PLAYER, cajonSidePlan, cajonTopPlan } from './cajonV2.ts';

/** The new look (figure V2, wave 3 set 3b): the player is the drummer of the cast. */
export const V2 = figureV2On('sidePlayers');
import { BH, CAJ_DIMS, HX, HZ, PORT_R, stateOf, type CajState } from './model.ts';

/** From above, each hand lies flat on the plate's vertical face, fingers
 *  down, its back toward the audience: seen from above it is the back of the
 *  hand foreshortened to a strip ≈ 30 mm deep in front of the plate (a 190 mm
 *  hand tilted ≈ 80° from the view: × 0.17). It was an open hand pointing
 *  forward into the air past the box (clash sweep 2026-10-10). */
const BACK = dorsalFlat(8);
const FORESHORTEN = 0.17;
function HandOnPlate({ x, z, right, k = FORESHORTEN }: { x: number; z: number; right: boolean; /** the foreshortening along the hand (its length seen from above) */ k?: number }) {
  // the right hand's thumb toward −z (inward), the left's toward +z
  const pl = { at: [x, z] as Pt, angle: 0, mirror: !right };
  return (
    <Group transform={[{ translateX: x }, { scaleX: k }, { translateX: -x }]}>
      <Hand geo={BACK} pl={pl} />
    </Group>
  );
}
/**
 * (owner 2026-11-24 on /players3b: "small paddle hands" from above) The new look: each hand at its true size
 * (the hand-drum hand, ≈ 190 mm), its wrist ON the forearm's end (the model's wrist, just over the plate's top
 * edge), foreshortened only as much as the hand really tilts away from the view — its own wrist → fingers line
 * (model W → G) seen from above — so the forearm runs into the hand and the hand lies down the plate's face.
 */
function HandOnPlateV2({ a, right }: { a: CajState['R']; right: boolean }) {
  const d = { x: a.G.x - a.W.x, y: a.G.y - a.W.y, z: a.G.z - a.W.z };
  const k = Math.max(FORESHORTEN, Math.hypot(d.x, d.z) / (Math.hypot(d.x, d.y, d.z) || 1));
  return <HandOnPlate x={a.W.x} z={a.W.z} right={right} k={k} />;
}
const BIRCH = ['#ecd2a2', '#d5b07a', '#b48a54', '#86622f'];
const PLATE = ['#5b3a22', '#7a5030', '#4a2e1a'];
const DARK = '#120b06';

/* ── The box ── */

function BoxSide({ s }: { s: CajState }) {
  const front = s.id === 'frontport';
  const lo = CAJ_DIMS.ledgeH.mm;
  const g = useMemo(() => {
    const body = make();
    body.moveTo(-HX, -BH);
    body.lineTo(s.plateX, -BH);
    body.lineTo(s.plateX, front ? -lo : 0);
    if (front) {
      body.lineTo(HX, -lo);
      body.lineTo(HX, 0);
    }
    body.lineTo(-HX, 0);
    body.close();
    const plate = rrect(make(), s.plateX - CAJ_DIMS.plateT.mm - 3, -BH + 2, s.plateX + 1, front ? -lo : -2, 2);
    const feet = make();
    for (const x of [-HX + 18, HX - 42]) rrect(feet, x, -CAJ_DIMS.feet.mm, x + 24, 0, 3);
    const snares = make();
    for (let i = 0; i < 2; i++) {
      snares.moveTo(s.plateX - 14 - i * 9, -BH + 20);
      snares.lineTo(s.plateX - 14 - i * 9, -BH + 165);
    }
    const port = front ? oval(make(), (s.plateX + HX) / 2, -lo, CAJ_DIMS.portF.mm / 2, 6) : oval(make(), -HX - 3, s.port.y, 9, PORT_R);
    const grain = make();
    for (let k = 1; k < 6; k++) {
      const y = -BH + (k * BH) / 6;
      grain.moveTo(-HX + 12, y);
      grain.cubicTo(-HX * 0.4, y - 6, 0, y + 7, s.plateX - 20, y - 2);
    }
    const seat = rrect(make(), -HX + 6, -BH - 7, s.plateX - 6, -BH + 1, 4);
    return { body, plate, feet, snares, port, grain, seat };
  }, [s, front, lo]);
  return (
    <Group>
      <Path path={g.body}>
        <LinearGradient start={vec(-HX, -BH)} end={vec(s.plateX, 0)} colors={BIRCH} />
      </Path>
      <Path path={g.grain} style="stroke" strokeWidth={1.2} color="#9a7442" opacity={0.35} />
      <Path path={g.seat} color="#c19a64" />
      <Path path={g.body} style="stroke" strokeWidth={2} color={INK} />
      <Path path={g.plate}>
        <LinearGradient start={vec(s.plateX - 8, -BH)} end={vec(s.plateX, 0)} colors={PLATE} />
      </Path>
      <Path path={g.snares} style="stroke" strokeWidth={2} color="#c8ccd4" opacity={0.75}>
        <DashPathEffect intervals={[5, 4]} />
      </Path>
      <Path path={g.port} color={DARK} />
      <Path path={g.feet} color="#1b1c20" />
    </Group>
  );
}

function BoxTop({ s }: { s: CajState }) {
  const front = s.id === 'frontport';
  const g = useMemo(() => {
    const body = rrect(make(), -HX, -HZ, HX, HZ, 6);
    const topFace = rrect(make(), -HX + 10, -HZ + 10, s.plateX - 10, HZ - 10, 4);
    const ledge = front ? rrect(make(), s.plateX, -HZ, HX, HZ, 3) : null;
    const plateEdge = rrect(make(), s.plateX - 5, -HZ + 2, s.plateX + 1, HZ - 2, 2);
    const port = front ? oval(make(), s.port.x, 0, CAJ_DIMS.portF.mm / 2 - 10, CAJ_DIMS.portF.mm / 2) : rrect(make(), -HX - 4, -PORT_R, -HX + 3, PORT_R, 2);
    return { body, topFace, ledge, plateEdge, port };
  }, [s, front]);
  return (
    <Group>
      <Path path={g.body} color="#000" opacity={0.4} transform={[{ translateX: 18 }, { translateY: 24 }]}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={g.body}>
        <LinearGradient start={vec(-HX, -HZ)} end={vec(HX, HZ)} colors={BIRCH} />
      </Path>
      <Path path={g.topFace} color="#c9a46c" opacity={0.6} />
      {g.ledge ? <Path path={g.ledge} color="#b48a54" /> : null}
      <Path path={g.body} style="stroke" strokeWidth={2} color={INK} />
      <Path path={g.plateEdge} color={PLATE[1]} />
      <Path path={g.port} color={DARK} />
    </Group>
  );
}

/* ── The seated player: the shared figure (cajonPose.ts; art fix round 3) ── */

const legCache = new WeakMap<SidePlan, { leg: SkPath; nearHide: SkPath; beforeFar: SkPath }>();
/**
 * What lies in front of each arm: `leg` the near leg's outline (thigh, knee, shin) as the figure paints it, less
 * the shirt (over the thigh at the hip the shirt is drawn, not the leg); `beforeFar` the torso, the seat and the
 * near leg (what the figure paints after its far arm).
 */
export function cajonLegRegions(plan: SidePlan): { leg: SkPath; nearHide: SkPath; beforeFar: SkPath } {
  let r = legCache.get(plan);
  if (!r) {
    const P = sidePaths(plan);
    const legNear = unionOf(smoothClosed(plan.legs.near.outline, 0.5), smoothClosed(plan.legs.near.lower, 0.4));
    const leg = op(legNear, P.shirt, PathOp.Difference);
    // (the near forearm lies over the thigh's top — its elbow well outside the thigh — and only the hand dives behind
    // the leg to the plate: the leg hides what lies past the cuff's opening, a line across the wrist that IS the
    // cuff's rim, so the occlusion never cuts the sleeve along the thigh's straight top edge)
    const a = plan.arms.near;
    const o = a.opening.e.c;
    const dl = a.line[a.line.length - 1];
    const dp = a.line[a.line.length - 2];
    const L0 = Math.hypot(dl.u - dp.u, dl.v - dp.v) || 1;
    const d = { u: (dl.u - dp.u) / L0, v: (dl.v - dp.v) / L0 };
    const n = { u: -d.v, v: d.u };
    const past = Skia.Path.Make();
    past.moveTo(o.u + n.u * 2000, o.v + n.v * 2000);
    past.lineTo(o.u - n.u * 2000, o.v - n.v * 2000);
    past.lineTo(o.u - n.u * 2000 + d.u * 3000, o.v - n.v * 2000 + d.v * 3000);
    past.lineTo(o.u + n.u * 2000 + d.u * 3000, o.v + n.v * 2000 + d.v * 3000);
    past.close();
    r = { leg, nearHide: op(leg, past, PathOp.Intersect), beforeFar: unionOf(P.shirt, P.trousersNear) };
    legCache.set(plan, r);
  }
  return r;
}

/**
 * THE NEAR LEG AND THE HANDS ON THE PLATE (review 2026-11-24; THE OWNER RULES — he plays the cajón). From the
 * right the hands strike the plate BETWEEN the knees, so the near thigh and shin lie in front of them:
 *   'trueDepth'     the near leg drawn over the hands (they show only where the leg does not cover them);
 *   'ghostLeg'      the hands drawn, the near leg over them as a ghost (a soft outline and a faint fill), so
 *                   the hands read through it;
 *   'handOverKnee'  the earlier drawing: the hands over the knee.
 * `whole`: the lesson's whole-figure views; `hands`: a picture made to SHOW the hands on the plate (a close-up).
 */
export const CAJON_NEAR_LEG: { whole: CajonLegMode; hands: CajonLegMode } = { whole: 'trueDepth', hands: 'ghostLeg' };
export type CajonLegMode = 'trueDepth' | 'ghostLeg' | 'handOverKnee';

export function CajonArt({ view, variant, v2 = V2, focus = 'whole' }: { view: ViewId; variant: VariantId; /** (the study page compares the old look) */ v2?: boolean; /** 'hands': a picture made to show the hands on the plate (CAJON_NEAR_LEG.hands) */ focus?: 'whole' | 'hands' }) {
  const s = stateOf(variant);
  const pose = cajonPose(view === 'top' ? 'top' : 'side', variant);
  if (v2) {
    // THE NEW LOOK: from above the legs, the forearms reaching to the plate, the shoulders and head, then
    // the approved hand-drum hands on the plate; from the right the player astride the box, each hand
    // flat on the plate's face.
    if (view === 'top')
      return (
        <Group>
          <BoxTop s={s} />
          <PlayerTopV2 plan={cajonTopPlan(variant)} who={CAJON_PLAYER} legs bareArms />
          <HandOnPlateV2 a={s.L} right={false} />
          <HandOnPlateV2 a={s.R} right />
        </Group>
      );
    // (review 2026-11-24: "the near hand on the plate drawn OVER the near thigh") the hands strike the plate
    // BETWEEN the knees: from the right the near thigh and shin lie in front of the near hand (and of the far
    // one) where they overlap — the body is drawn again, without its arms, inside the near leg's own outline
    const plan = cajonSidePlan(variant);
    const mode = CAJON_NEAR_LEG[focus];
    if (mode === 'handOverKnee')
      return (
        <Group>
          <BoxSide s={s} />
          <PlayerSideV2 plan={plan} who={CAJON_PLAYER} />
        </Group>
      );
    // (coordinator review 2026-11-24: "a gray hard-edged panel over the hip where the near arm meets the thigh"; "the
    // ghost leg a translucent rectangle with a pale outline loop") — the body is no longer drawn twice. The body
    // once, without its arms; then each arm over it, hidden only where the body truly lies in front of it: the far
    // arm behind the torso, the seat and the near leg (as the figure itself orders it); the near arm behind the near
    // leg alone — the leg's own outline, less the shirt that lies over the thigh at the hip (so no clip edge falls
    // where the drawing shows no edge).
    const L = cajonLegRegions(plan);
    return (
      <Group>
        <BoxSide s={s} />
        <PlayerBodyV2 plan={plan} who={CAJON_PLAYER} />
        <PlayerArmV2 plan={plan} who={CAJON_PLAYER} which="far" hideIn={L.beforeFar} />
        {mode === 'trueDepth' ? (
          <PlayerArmV2 plan={plan} who={CAJON_PLAYER} which="near" hideIn={L.nearHide} />
        ) : (
          // 'ghostLeg' (a picture made to show the hands): the near arm whole, the near leg over it as a soft
          // low-opacity veil of the trousers in the leg's own outline, with a faint soft edge
          <Group>
            <PlayerArmV2 plan={plan} who={CAJON_PLAYER} which="near" />
            <Group clip={L.leg} opacity={0.3}>
              <PlayerBodyV2 plan={plan} who={CAJON_PLAYER} />
            </Group>
            <Group clip={L.leg}>
              <Path path={L.leg} style="stroke" strokeWidth={6} color="#14161b" opacity={0.35}>
                <BlurMask blur={3} style="normal" />
              </Path>
            </Group>
          </Group>
        )}
      </Group>
    );
  }
  if (view === 'top') {
    // From above: the box, then the body over its top, the forearms down to
    // the plate; each hand lies on the plate's vertical face (the back of the
    // hand, foreshortened — the figure's own hands would point into the air).
    return (
      <Group>
        <BoxTop s={s} />
        <PlayerBehind pose={pose} />
        <PlayerInFront pose={pose} hands={false} />
        <HandOnPlate x={s.plateX + 1} z={s.L.W.z} right={false} />
        <HandOnPlate x={s.plateX + 1} z={s.R.W.z} right />
      </Group>
    );
  }
  // From the right: the box, then the player astride it — the legs lie
  // outside the box's width (knees either side of the plate), so the near leg
  // passes in front of its side and the far leg sits right behind it in
  // profile; then the body and the near arm, its hand on the plate.
  return (
    <Group>
      <BoxSide s={s} />
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} />
    </Group>
  );
}

export function cajonLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = stateOf(variant);
  const front = s.id === 'frontport';
  if (view === 'top') {
    return [
      { id: 'plate', text: 'FRONT PLATE', short: 'PLATE', u: s.plateX + 20, v: -HZ - 40, align: 'left', at: { u: s.plateX, v: -HZ + 12 } },
      front ? { id: 'port', text: 'PORT (FACING UP)', short: 'PORT ↑', u: s.port.x + 60, v: HZ + 50, align: 'left', tone: 'muted' } : { id: 'port', text: 'PORT (ON THE BACK)', short: 'PORT', u: -HX - 20, v: HZ + 50, align: 'right', tone: 'muted' },
      { id: 'player', text: 'PLAYER (SEATED)', short: 'PLAYER', u: -200, v: -300, align: 'center', tone: 'muted' },
    ];
  }
  return [
    // The leaders land on the plate below the hands and on the wires inside
    // (they landed on the player's fingers: clash sweep 2026-10-10).
    { id: 'plate', text: 'FRONT PLATE', short: 'PLATE', u: s.plateX + 30, v: -BH + 40, align: 'left', at: { u: s.plateX - 2, v: (front ? -CAJ_DIMS.ledgeH.mm : 0) - 70 } },
    // (second review 2026-11-24: from the plate's side its leader crossed the player's shin — the wires are named from
    // the box's back, the leader running inside the box to them, clear of the legs)
    { id: 'snares', text: 'SNARE WIRES (INSIDE)', short: 'SNARES', u: -HX - 20, v: -BH + 60, align: 'right', tone: 'muted', at: { u: s.plateX - 23, v: -BH + 135 }, alts: [{ u: s.plateX + 30, v: -BH + 100, align: 'left' }] },
    front ? { id: 'port', text: 'PORT ↑ (ON THE LEDGE)', short: 'PORT ↑', u: HX + 30, v: -CAJ_DIMS.ledgeH.mm + 10, align: 'left', tone: 'muted' } : { id: 'port', text: 'PORT (ON THE BACK) →', short: 'PORT →', u: -HX - 20, v: s.port.y, align: 'right', tone: 'muted', alts: [{ u: -HX - 20, v: -60, align: 'right' }] },
    { id: 'player', text: 'PLAYER, SEATED ON THE BOX', short: 'PLAYER', u: -260, v: -1250, align: 'center', tone: 'muted' },
  ];
}

export function cajonHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = stateOf(variant);
  const front = s.id === 'frontport';
  const lo = CAJ_DIMS.ledgeH.mm;
  if (view === 'side') {
    if (front ? Math.abs(u - s.port.x) <= CAJ_DIMS.portF.mm / 2 + tol && Math.abs(v + lo) <= 14 + tol : Math.abs(u + HX) <= 14 + tol && Math.abs(v - s.port.y) <= PORT_R + tol) return `caj.port.${s.id}`;
    if (u >= s.plateX - 20 && u <= s.plateX + tol && v >= -BH && v <= (front ? -lo : 0)) return v < -BH + 170 ? `caj.snares.${s.id}` : `caj.plate.${s.id}`;
    if (front && u >= s.plateX && u <= HX + tol && v >= -lo && v <= 0) return 'caj.ledge.frontport';
    if (u >= -HX - tol && u <= s.plateX && v >= -BH - tol && v <= 0) return `caj.box.${s.id}`;
    return null;
  }
  if (front && Math.hypot(u - s.port.x, v) <= CAJ_DIMS.portF.mm / 2 + tol) return `caj.port.${s.id}`;
  if (!front && Math.abs(u + HX) <= 14 + tol && Math.abs(v) <= PORT_R + tol) return `caj.port.${s.id}`;
  if (Math.abs(u - s.plateX) <= 12 + tol && Math.abs(v) <= HZ) return `caj.plate.${s.id}`;
  if (u >= -HX - tol && u <= HX + tol && Math.abs(v) <= HZ + tol) return u > s.plateX ? 'caj.ledge.frontport' : `caj.box.${s.id}`;
  return null;
}

/** The part names keep off the drawn player (side view; art fix round 3 —
 *  SNARE WIRES and FRONT PLATE sat on the hand and the knee). */
const cajonFigureAt = (view: ViewId, variant: VariantId, u: number, v: number, tol: number) => {
  if (view !== 'side') return false;
  if (!V2) return poseHit(cajonPose('side', variant), u, v, tol);
  // (the new figure: the very outlines it paints)
  const shapes = personShapes(cajonSidePlan(variant));
  const pts = tol > 0 ? [{ u, v }, { u: u - tol, v }, { u: u + tol, v }, { u, v: v - tol }, { u, v: v + tol }] : [{ u, v }];
  return pts.some((q) => shapes.some((sh) => inPoly(q, sh)));
};

export const CAJ_ART: LessonArt = { Instrument: CajonArt, labels: cajonLabels, hitTest: cajonHitTest, figureAt: cajonFigureAt };
