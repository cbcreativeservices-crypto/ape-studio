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
import { BlurMask, DashPathEffect, Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { INK, make, oval, rrect } from '../shared/concert/paths.ts';
import { Hand } from '../shared/smallperc/Hand';
import { dorsalFlat, type Pt } from '../shared/smallperc/hands.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { cajonPose } from './cajonPose.ts';
import { poseHit } from '../shared/players/playerPose.ts';
import { BH, CAJ_DIMS, HX, HZ, PORT_R, stateOf, type CajState } from './model.ts';

/** From above, each hand lies flat on the plate's vertical face, fingers
 *  down, its back toward the audience: seen from above it is the back of the
 *  hand foreshortened to a strip ≈ 30 mm deep in front of the plate (a 190 mm
 *  hand tilted ≈ 80° from the view: × 0.17). It was an open hand pointing
 *  forward into the air past the box (clash sweep 2026-10-10). */
const BACK = dorsalFlat(8);
const FORESHORTEN = 0.17;
function HandOnPlate({ x, z, right }: { x: number; z: number; right: boolean }) {
  // the right hand's thumb toward −z (inward), the left's toward +z
  const pl = { at: [x, z] as Pt, angle: 0, mirror: !right };
  return (
    <Group transform={[{ translateX: x }, { scaleX: FORESHORTEN }, { translateX: -x }]}>
      <Hand geo={BACK} pl={pl} />
    </Group>
  );
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

export function CajonArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = stateOf(variant);
  const pose = cajonPose(view === 'top' ? 'top' : 'side', variant);
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
    { id: 'snares', text: 'SNARE WIRES (INSIDE)', short: 'SNARES', u: s.plateX + 30, v: -BH + 100, align: 'left', tone: 'muted', at: { u: s.plateX - 23, v: -BH + 40 }, alts: [{ u: -HX - 20, v: -BH + 60, align: 'right' }] },
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
const cajonFigureAt = (view: ViewId, variant: VariantId, u: number, v: number, tol: number) => view === 'side' && poseHit(cajonPose('side', variant), u, v, tol);

export const CAJ_ART: LessonArt = { Instrument: CajonArt, labels: cajonLabels, hitTest: cajonHitTest, figureAt: cajonFigureAt };
