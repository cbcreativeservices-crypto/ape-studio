/**
 * I06b FINGER CYMBALS — the look (charter §2 layer 3), drawn ONLY from
 * model.ts's sizes and geometry.ts's anchors, in millimetres of each view:
 *   side   u = x, v = y — from the player's right;
 *   top    u = x, v = z — from above;
 *   front  u = −z, v = y — from the audience.
 * Small brass cymbals (a flat flange and a raised dome) lit from the upper
 * left, with a rim highlight and a leather strap through the centre; the
 * player is quiet line art. Nothing moves by itself (D8).
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Oval, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import type { VariantId, ViewBox, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { BRASS, Floor, HIGHLIGHT, make, PlayerInk, playerFront, playerSide, playerTop, polyPath } from '../shared/metal/metalArt';
import { Hand } from '../shared/smallperc/Hand';
import { pinchHand, wristFor, type Placement } from '../shared/smallperc/hands.ts';
import type { FrontArt } from '../shared/metal/metalPages';
import { FC, FLANGE_RISE, P0, P0D, profile, RA, RB } from './model.ts';
import { DROP_C, DROP_TILT, HAND_L, HAND_R } from './geometry.ts';

const H = FC.h.mm;
const isDance = (v: VariantId) => v === 'dance';

/** A dancer seen from the audience (u = −z): mid-step, arms raised in
 *  curves to the two hands, the hips swayed — quiet line art. */
function dancerFront(hands: readonly [number, number][]) {
  const p = make();
  // (the head: PlayerInk head="front" at (30, −1660) — the figure's own)
  p.moveTo(-170, -1450);
  p.cubicTo(-80, -1500, 120, -1500, 210, -1440); // shoulders
  p.moveTo(-150, -1440);
  p.cubicTo(-110, -1200, -170, -1050, -120, -940); // torso, swayed
  p.moveTo(190, -1430);
  p.cubicTo(150, -1200, 200, -1050, 150, -940);
  p.moveTo(-120, -940);
  p.cubicTo(-60, -900, 90, -900, 150, -940); // hips
  p.moveTo(-90, -930);
  p.cubicTo(-160, -600, -260, -330, -300, -20); // one leg reaching out
  p.moveTo(110, -930);
  p.cubicTo(140, -620, 60, -420, 120, -230); // the other, bent
  p.lineTo(70, -20);
  const shoulders: [number, number][] = [[-170, -1450], [210, -1440]];
  hands.forEach(([hu, hv], i) => {
    const [su, sv] = shoulders[hu < 0 ? 0 : 1] ?? shoulders[i];
    p.moveTo(su, sv);
    p.cubicTo(su + (hu - su) * 0.2, sv - 160, hu - (hu - su) * 0.3, hv + 120, hu, hv);
  });
  return p;
}

/** A cymbal seen edge-on: centre (u, v), radius r, rotated by `deg`, dome up
 *  (or down with flip). Brass, lit from the upper left; a rim highlight. */
export function CymbalEdge({ u, v, r, deg = 0, flip = false, glow = false }: { u: number; v: number; r: number; deg?: number; flip?: boolean; glow?: boolean }): ReactElement {
  const g = useMemo(() => {
    const sg = flip ? -1 : 1;
    const pts = profile(r, H).map(([a, b]) => [a, sg * b] as [number, number]);
    const top = make();
    pts.forEach(([a, b], i) => (i === 0 ? top.moveTo(a, b) : top.lineTo(a, b)));
    const rd = (FC.domeD.mm / 2) * (r / RA);
    const t = FC.thick.mm * 1.6;
    // the body: the top surface, then the underside — the flange's thickness
    // back to the bell's mouth (the bell's hollow is out of sight)
    const body = make();
    pts.forEach(([a, b], i) => (i === 0 ? body.moveTo(a, b) : body.lineTo(a, b)));
    body.lineTo(r, sg * t);
    body.lineTo(rd + 2, sg * (-FLANGE_RISE + t));
    body.lineTo(-rd - 2, sg * (-FLANGE_RISE + t));
    body.lineTo(-r, sg * t);
    body.close();
    // a soft specular streak on the bell's lit (upper-left) shoulder
    const shine = make();
    const dh = H * 0.7;
    shine.moveTo(-rd * 0.78, sg * (-FLANGE_RISE - (dh - FLANGE_RISE) * 0.45));
    shine.quadTo(-rd * 0.62, sg * -dh * 0.92, -rd * 0.15, sg * -dh * 0.99);
    // the strap: a short leather loop out through the bell's centre hole
    const strap = make();
    const y0 = sg * -dh;
    strap.moveTo(-4, y0 + sg * 1);
    strap.cubicTo(-7, y0 - sg * 10, 7, y0 - sg * 10, 4, y0 + sg * 1);
    return { body, top, shine, strap };
  }, [r, flip]);
  return (
    <Group transform={[{ translateX: u }, { translateY: v }, { rotate: (deg * Math.PI) / 180 }]}>
      {glow ? <Circle cx={0} cy={0} r={r * 1.25} color={HIGHLIGHT} opacity={0.3} /> : null}
      <Path path={g.strap} style="stroke" strokeWidth={3.4} strokeCap="round" color="#3a2010" />
      <Path path={g.strap} style="stroke" strokeWidth={2} strokeCap="round" color="#8a5530" />
      <Path path={g.body}>
        <LinearGradient start={vec(-r, -H)} end={vec(r, H * 0.4)} colors={[BRASS[0], BRASS[1], BRASS[2], BRASS[3]]} />
      </Path>
      <Path path={g.shine} style="stroke" strokeWidth={1.6} strokeCap="round" color="#fff6d8" opacity={0.7} />
      <Path path={g.body} style="stroke" strokeWidth={1} color={BRASS[4]} />
      <Path path={g.top} style="stroke" strokeWidth={0.8} color={BRASS[0]} opacity={0.8} />
    </Group>
  );
}

/** A cymbal seen from above or below: the flange ring and the dome. */
function CymbalFace({ u, v, r, sq = 1, glow = false }: { u: number; v: number; r: number; sq?: number; glow?: boolean }): ReactElement {
  const rd = (FC.domeD.mm / 2) * (r / RA);
  return (
    <Group>
      {glow ? <Oval x={u - r * 1.3} y={v - r * 1.3 * sq} width={r * 2.6} height={r * 2.6 * sq} color={HIGHLIGHT} opacity={0.3} /> : null}
      <Oval x={u - r} y={v - r * sq} width={2 * r} height={2 * r * sq}>
        <RadialGradient c={vec(u - r * 0.35, v - r * 0.35 * sq)} r={r * 1.6} colors={[BRASS[1], BRASS[2], BRASS[3], BRASS[4]]} />
      </Oval>
      <Oval x={u - rd} y={v - rd * sq} width={2 * rd} height={2 * rd * sq}>
        <RadialGradient c={vec(u - rd * 0.4, v - rd * 0.4 * sq)} r={rd * 1.5} colors={[BRASS[0], BRASS[1], BRASS[3]]} />
      </Oval>
      <Oval x={u - r} y={v - r * sq} width={2 * r} height={2 * r * sq} style="stroke" strokeWidth={1.2} color={BRASS[4]} />
      <Circle cx={u} cy={v} r={3} color="#3a2414" />
    </Group>
  );
}

/* ═══════════════ side and top ═══════════════ */

function sideArt(v: VariantId): ReactElement {
  if (isDance(v)) {
    const hands: [number, number][] = [[HAND_L.x, HAND_L.y], [HAND_R.x + 30, HAND_R.y - 20]];
    return (
      <Group>
        <Floor u0={-4000} u1={5000} />
        <PlayerInk path={playerSide(hands)} head="side" />
        {hands.map(([a, b], i) => (
          <Group key={i}>
            <CymbalEdge u={a + 8} v={b - 16} r={RA} deg={-70} />
            <CymbalEdge u={a + 14} v={b + 14} r={RB} deg={-110} />
          </Group>
        ))}
      </Group>
    );
  }
  return (
    <Group>
      <Floor u0={-4000} u1={5000} />
      <PlayerInk path={playerSide([[P0.x - 30, P0.y + 30], [DROP_C.x - 20, DROP_C.y - 25]])} head="side" />
      <CymbalEdge u={P0.x} v={P0.y} r={RA} />
      <CymbalEdge u={DROP_C.x} v={DROP_C.y} r={RB} deg={-DROP_TILT} />
    </Group>
  );
}

function topArt(v: VariantId): ReactElement {
  if (isDance(v)) {
    const R = FC.route.mm;
    const route = polyPath([[0, -R], [0, R]]);
    const arrows = make();
    for (const s of [-1, 1]) {
      arrows.moveTo(-60, s * (R - 90));
      arrows.lineTo(0, s * R);
      arrows.lineTo(60, s * (R - 90));
    }
    return (
      <Group>
        <Path path={route} style="stroke" strokeWidth={14} color="#8a8f9c" opacity={0.5}>
          <DashPathEffect intervals={[60, 40]} />
        </Path>
        <Path path={arrows} style="stroke" strokeWidth={14} strokeCap="round" strokeJoin="round" color="#8a8f9c" opacity={0.6} />
        {[-R * 0.75, R * 0.75].map((zz) => (
          <Group key={zz} transform={[{ translateY: zz }]}>
            <PlayerInk path={playerTop()} faint head="top" />
          </Group>
        ))}
        <PlayerInk path={playerTop([[HAND_L.x, HAND_L.z], [HAND_R.x, HAND_R.z]])} head="top" />
        <CymbalFace u={HAND_L.x + 20} v={HAND_L.z} r={RA} />
        <CymbalFace u={HAND_R.x + 20} v={HAND_R.z} r={RA} />
      </Group>
    );
  }
  return (
    <Group>
      <PlayerInk path={playerTop([[P0.x - 30, P0.z - 40], [DROP_C.x - 10, DROP_C.z + 40]])} faint head="top" />
      <Circle cx={10} cy={14} r={RA + 4} color="#000" opacity={0.45}>
        <BlurMask blur={8} style="normal" />
      </Circle>
      <CymbalFace u={P0.x} v={P0.z} r={RA} />
      <CymbalFace u={DROP_C.x} v={DROP_C.z} r={RB} sq={Math.cos((DROP_TILT * Math.PI) / 180)} />
    </Group>
  );
}

const built: Partial<Record<string, ReactElement>> = {};
export function FingerCymbalsArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const key = `${view}:${variant}`;
  return (built[key] ??= view === 'top' ? topArt(variant) : sideArt(variant));
}

export function fingerCymbalsLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  if (isDance(variant)) {
    if (view === 'top') {
      return [
        { id: 'route', text: 'THE DANCER’S ROUTE', short: 'ROUTE', u: 140, v: -FC.route.mm + 120, align: 'left', tone: 'muted' },
        { id: 'pairs', text: 'A PAIR ON EACH HAND', short: 'PAIRS', u: 120, v: HAND_R.z + 90, align: 'left' },
      ];
    }
    return [
      { id: 'pairs', text: 'A PAIR ON EACH HAND', short: 'PAIRS', u: 120, v: P0D.y - 60, align: 'left' },
      { id: 'player', text: 'DANCER', u: -360, v: -1800, align: 'center', tone: 'muted' },
    ];
  }
  if (view === 'top') {
    return [
      { id: 'pair', text: 'FINGER CYMBALS', short: 'CYMBALS', u: 60, v: -70, align: 'left' },
      { id: 'player', text: 'PLAYER', u: -360, v: 160, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'pair', text: 'FINGER CYMBALS', short: 'CYMBALS', u: 60, v: P0.y - 70, align: 'left' },
    { id: 'player', text: 'PLAYER', u: -360, v: -1780, align: 'center', tone: 'muted' },
  ];
}

export function fingerCymbalsHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const t = tol + 40;
  if (isDance(variant)) {
    if (view === 'top') {
      if (Math.hypot(u - HAND_L.x, v - HAND_L.z) <= t || Math.hypot(u - HAND_R.x, v - HAND_R.z) <= t) return 'fc.thumb';
      if (Math.abs(u) <= 60 + tol && Math.abs(v) <= FC.route.mm) return 'fc.route';
      return null;
    }
    return Math.hypot(u - HAND_L.x, v - HAND_L.y) <= t ? 'fc.thumb' : null;
  }
  if (view === 'top') {
    if (Math.hypot(u - DROP_C.x, v - DROP_C.z) <= RB && v > 10) return 'fc.drop';
    return Math.hypot(u - P0.x, v - P0.z) <= RA + tol ? 'fc.held' : null;
  }
  if (Math.abs(u) <= RA + tol && Math.abs(v - P0.y) <= 20 + tol) return 'fc.held';
  if (Math.abs(u - DROP_C.x) <= RB + tol && Math.abs(v - DROP_C.y) <= 30 + tol) return 'fc.drop';
  return null;
}

/* ═══════════════ front (from the audience) ═══════════════ */

/** Front coordinates: u = −z. */
const FU = (zz: number) => -zz;

/** The strap loop's top above the cymbal's centre (CymbalEdge's loop). */
const STRAP_TOP = -H * 0.7 - 6.5;
const PINCH = pinchHand();
/** A pinching hand whose pinch lands on `at`, the hand reaching down to it
 *  from the upper right (or, mirrored, from the upper left). */
function pinchAt(at: readonly [number, number], fromLeft: boolean): Placement {
  const angle = fromLeft ? 82 : 98;
  return { at: wristFor(PINCH.hold!, [at[0], at[1]], angle, 1, fromLeft), angle, mirror: fromLeft };
}
/** The forearm, continuing from the pinch through the wrist and up out of
 *  the drawing, a sleeve on its far part. */
function armOf(pl: Placement, at: readonly [number, number]): { from: readonly [number, number]; w: number; sleeve: number } {
  const dx = pl.at[0] - at[0];
  const dy = pl.at[1] - at[1];
  const l = Math.hypot(dx, dy) || 1;
  return { from: [pl.at[0] + (dx / l) * 420, pl.at[1] + (dy / l) * 420], w: 54, sleeve: 260 };
}

function FrontArtImpl({ variant, highlight }: { variant: VariantId; highlight: string | null }): ReactElement {
  const hl = (id: string) => highlight === id;
  if (isDance(variant)) {
    const hands: [number, number][] = [[FU(HAND_R.z), HAND_R.y], [FU(HAND_L.z), HAND_L.y]];
    const R = FC.route.mm;
    const arrows = make();
    arrows.moveTo(-R * 0.25, -40);
    arrows.lineTo(R * 0.25, -40);
    for (const s of [-1, 1]) {
      arrows.moveTo(s * (R * 0.25 - 50), -80);
      arrows.lineTo(s * R * 0.25, -40);
      arrows.lineTo(s * (R * 0.25 - 50), 0);
    }
    return (
      <Group>
        <Floor u0={-2400} u1={2400} />
        {hl('fc.route') ? <Path path={polyPath([[-R * 0.25, -40], [R * 0.25, -40]])} style="stroke" strokeWidth={60} color={HIGHLIGHT} opacity={0.3} /> : null}
        <Path path={arrows} style="stroke" strokeWidth={10} strokeCap="round" strokeJoin="round" color="#8a8f9c" opacity={0.7} />
        <PlayerInk path={dancerFront(hands)} head="front" headAt={[30, -1660]} />
        {hands.map(([a, b], i) => (
          <Group key={i}>
            <CymbalEdge u={a + (i ? 10 : -10)} v={b - 20} r={RA} deg={i ? 80 : -80} glow={hl('fc.thumb')} />
            <CymbalEdge u={a + (i ? 34 : -34)} v={b + 10} r={RB} deg={i ? 100 : -100} glow={hl('fc.finger')} />
          </Group>
        ))}
      </Group>
    );
  }
  const heldU = FU(P0.z);
  const dropU = FU(DROP_C.z);
  // Each hand pinches its cymbal's strap loop between the thumb and the index
  // finger, just above the bell: the held one from the player's left (screen
  // right), the dropped one from the right. Anatomical hands at true size
  // (smallperc/hands.ts pinchHand: ≈ 190 mm hand, the thumb's pad on the
  // index finger's pad), so the 55 mm cymbals read at their real scale.
  const a = (DROP_TILT * Math.PI) / 180;
  const sTop = STRAP_TOP;
  const dropStrap: [number, number] = [dropU - Math.sin(a) * sTop, DROP_C.y + Math.cos(a) * sTop];
  return (
    <Group>
      {([[[heldU, P0.y + sTop], false], [dropStrap, true]] as const).map(([at, left], i) => {
        const pl = pinchAt(at, left);
        return <Hand key={i} geo={PINCH} pl={pl} forearm={armOf(pl, at)} edge={0.7} />;
      })}
      <Circle cx={heldU + 8} cy={P0.y + 10} r={RA} color="#000" opacity={0.35}>
        <BlurMask blur={8} style="normal" />
      </Circle>
      <CymbalEdge u={heldU} v={P0.y} r={RA} glow={hl('fc.held')} />
      <CymbalEdge u={dropU} v={DROP_C.y} r={RB} deg={DROP_TILT} glow={hl('fc.drop')} />
      {hl('fc.strap') ? <Circle cx={heldU} cy={P0.y - H * 0.7 - 6} r={14} color={HIGHLIGHT} opacity={0.4} /> : null}
    </Group>
  );
}

function frontBox(v: VariantId): ViewBox {
  // Orchestral: wide enough for both hands at true size, wrists and all.
  return isDance(v) ? { u0: -620, u1: 620, v0: -1900, v1: 80 } : { u0: -250, u1: 250, v0: P0.y - 300, v1: P0.y + 80 };
}

function frontLabels(v: VariantId): ArtLabel[] {
  if (isDance(v)) {
    return [
      { id: 'fc.thumb', text: 'ON THE THUMB', short: 'THUMB', u: FU(HAND_R.z) - 60, v: HAND_R.y - 70, align: 'right' },
      { id: 'fc.finger', text: 'ON A FINGER', short: 'FINGER', u: FU(HAND_L.z) + 70, v: HAND_L.y + 50, align: 'left' },
      { id: 'fc.route', text: '← THE ROUTE →', short: 'ROUTE', u: 0, v: -130, align: 'center', tone: 'muted' },
    ];
  }
  return [
    { id: 'fc.held', text: 'HELD FLAT', u: FU(P0.z) + RA + 8, v: P0.y + 4, align: 'left' },
    { id: 'fc.drop', text: 'DROPPED EDGE-FIRST', short: 'DROPPED', u: FU(DROP_C.z) - RB - 6, v: DROP_C.y - 18, align: 'right' },
    // The name sits clear to the left; its leader lands on the strap loop
    // (between the bell and the pinching fingers), never on the hand.
    { id: 'fc.strap', text: 'STRAP', u: FU(P0.z) - RA - 10, v: P0.y - H * 0.7 - 30, align: 'right', tone: 'muted', at: { u: FU(P0.z) - 3, v: P0.y - H * 0.7 - 3 } },
  ];
}

function frontHit(v: VariantId, u: number, vv: number, tol: number): string | null {
  if (isDance(v)) {
    for (const hnd of [HAND_L, HAND_R]) {
      const a = FU(hnd.z);
      if (Math.hypot(u - a, vv - (hnd.y - 20)) <= 45 + tol) return 'fc.thumb';
      if (Math.hypot(u - a, vv - (hnd.y + 10)) <= 55 + tol) return 'fc.finger';
    }
    if (Math.abs(vv + 40) <= 60 + tol && Math.abs(u) <= FC.route.mm * 0.25) return 'fc.route';
    return null;
  }
  if (Math.abs(u - FU(P0.z)) <= 10 + tol && vv < P0.y - H * 0.5 && vv > P0.y - H - 20) return 'fc.strap';
  if (Math.abs(u - FU(P0.z)) <= RA + tol && Math.abs(vv - P0.y) <= 18 + tol) return 'fc.held';
  if (Math.abs(u - FU(DROP_C.z)) <= RB + tol && Math.abs(vv - DROP_C.y) <= 30 + tol) return 'fc.drop';
  return null;
}

export const FC_FRONT: FrontArt = { box: frontBox, Art: FrontArtImpl, labels: frontLabels, hitTest: frontHit };

/* ═══════════════ HOW IT SOUNDS: the stroke, close up ═══════════════ */

const STRIKE_BOX: ViewBox = { u0: -130, u1: 130, v0: -160, v1: 80 };

export function FingerCymbalsStrike({ w, h, variant, shown, accessibilityLabel }: { w: number; h: number; variant: VariantId; shown: number; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', STRIKE_BOX, w, h, 6), [w, h]);
  const dance = isDance(variant);
  // Close up, in local mm round the pair: the lower/thumb cymbal at (0, 0).
  // ① the upper one approaches; ② edges meet; ③ it lifts away, both ring; ④ sound leaves both.
  const upper = shown === 1 ? { u: 22, v: -78, deg: 35 } : shown === 2 ? { u: 34, v: -22, deg: 35 } : { u: 20, v: -92, deg: 20 };
  const contact: [number, number] = [RA * 0.86, -4];
  const rings = useMemo(() => {
    const p = make();
    for (const r of [RA + 14, RA + 28]) {
      p.addArc(Skia.XYWHRect(-r, -r - 8, 2 * r, 2 * r), 200, 140);
      p.addArc(Skia.XYWHRect(upper.u - r, upper.v - r, 2 * r, 2 * r), 20, 140);
    }
    return p;
  }, [upper.u, upper.v]);
  const arcs = useMemo(() => {
    const p = make();
    for (const r of [95, 115]) p.addCircle(10, -40, r);
    return p;
  }, []);
  const labels: StaticLabel[] = [
    { id: 'n1', text: dance ? '① THUMB AND FINGER CLOSE' : '① DROPPED EDGE-FIRST', short: '① CLOSE', u: -120, v: -140, align: 'left', tone: shown === 1 ? 'amber' : 'muted' },
    { id: 'n2', text: '② EDGES MEET', u: contact[0] + 16, v: contact[1] + 30, align: 'left', tone: shown === 2 ? 'amber' : 'muted' },
    { id: 'n3', text: '③ APART, BOTH RING', short: '③ BOTH RING', u: -120, v: 60, align: 'left', tone: shown === 3 ? 'amber' : 'muted' },
    { id: 'n4', text: '④ SOUND ALL ROUND', short: '④ ALL ROUND', u: 120, v: 60, align: 'right', tone: shown === 4 ? 'amber' : 'muted' },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {shown >= 4 ? (
            <Path path={arcs} style="stroke" strokeWidth={2.4} color="#8fbcff" opacity={0.55}>
              <DashPathEffect intervals={[8, 6]} />
            </Path>
          ) : null}
          {shown >= 3 ? <Path path={rings} style="stroke" strokeWidth={2} color="#ffc64d" opacity={0.55} /> : null}
          <CymbalEdge u={0} v={0} r={RA} deg={dance ? -12 : 0} />
          <CymbalEdge u={upper.u} v={upper.v} r={RB} deg={upper.deg} />
          {shown === 2 ? (
            <Group>
              <Circle cx={contact[0]} cy={contact[1]} r={12} color="#ffc64d" opacity={0.4}>
                <BlurMask blur={6} style="normal" />
              </Circle>
              <Circle cx={contact[0]} cy={contact[1]} r={9} style="stroke" strokeWidth={2} color="#ffc64d" />
            </Group>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
