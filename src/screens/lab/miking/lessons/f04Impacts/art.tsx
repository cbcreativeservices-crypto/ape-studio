/**
 * F04 IMPACTS, LIQUIDS AND TEXTURES — the look (charter §2 layer 3), drawn
 * from the model only (geometry.ts; the shared props): side u = x, v = y
 * (from the artist's right); top u = x, v = z. The action sits at the
 * origin in every variant.
 *
 *   IMPACT   the artist at a sturdy wooden table, a padded block raised to
 *            strike it.
 *   WATER    a shallow basin on a stable low table and a non-slip mat, a
 *            small jug pouring; in plan the SPLASH ENVELOPE (dashed blue,
 *            illustrative) — every stand, cable and power supply outside it.
 *   TEXTURE  a dry brush across coarse fabric on a board.
 *   LIVE     the impact at a station, its rail and the PA.
 * Static (D8).
 */
import { useMemo } from 'react';
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { poseCovers } from '../shared/foley/performer.ts';
import { BoothArt, PitSection, StageFloorPlan, TableArt } from '../shared/foley/StageArt';
import { liveBooth } from '../shared/foley/stage.ts';
import { Basin, BrushBoard, PaddedBlock } from '../shared/foley/props';
import { BASIN, PROP_DIMS, splashRadius } from '../shared/foley/propGeom.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { make } from '../shared/concert/paths.ts';
import { F04_MODEL, floorOf, posesOf, TABLE, tableTop } from './geometry.ts';
import { F04_ZONES } from './model.ts';
import { figureV2On } from '../shared/figureV2/figureV2Config';
import { PlayerSideV2, PlayerTopV2 } from '../shared/figureV2/playersV2';
import { personShapes } from '../shared/figureV2/personV2';
import { inPoly, P as P2 } from '../shared/figureV2/geom.ts';
import { FOLEY_PERFORMER, IMPACTS_HOLD, foleySideGrips, foleySidePlan, foleyTopGrips, foleyTopPlan, legsFromAbove } from '../shared/foley/foleyV2.ts';
import { bodyOf } from './geometry.ts';

/** The new look (figure V2, wave 3 set 3b): the Foley artist is Mei of the cast. */
export const V2 = figureV2On('sidePlayers');
const specOf = (v: VariantId) => IMPACTS_HOLD[v] ?? IMPACTS_HOLD.impact;
const sideOf = (v: VariantId) => foleySidePlan(bodyOf(v), specOf(v));
const topOf = (v: VariantId) => foleyTopPlan(bodyOf(v), specOf(v));
const v2Covers = (variant: VariantId, u: number, v: number, tol: number) => {
  const shapes = personShapes(sideOf(variant));
  const pts = tol > 0 ? [P2(u, v), P2(u - tol, v), P2(u + tol, v), P2(u, v - tol), P2(u, v + tol)] : [P2(u, v)];
  return pts.some((q) => shapes.some((sh) => inPoly(q, sh)));
};

const TOP = F04_MODEL.views.top!;

/**
 * A small jug pouring (art pass 2026-10-10; it was a six-point parallelogram).
 * A 1-litre stainless jug: base Ø 104 mm, belly Ø 116, mouth Ø 100, 190 mm to
 * the rim, a pinched pouring lip, a C handle on the back (drawing defaults of
 * the class). Side: tipped 100° toward the basin (a pour needs the lip below the base), the right hand (the pose's
 * grip, about (−150, −290)) on the handle, the lip over the entry, the stream
 * falling to it. Top: the round body, the lip toward the entry, the handle back.
 */
const JUG = { rBase: 52, rBelly: 58, rMouth: 50, h: 190, lip: 20, tilt: 100, grip: { u: -150, v: -290 } } as const;
function Jug({ view }: { view: ViewId }) {
  const g = useMemo(() => {
    const body = make();
    const handle = make();
    const mouth = make();
    const stream = make();
    const { rBase, rBelly, rMouth, h, lip } = JUG;
    if (view === 'side') {
      // The jug upright in its own frame (x toward the lip, y down from the base at 0).
      body.moveTo(-rBase, 0);
      body.cubicTo(-rBelly - 4, -40, -rBelly, -90, -rMouth - 2, -150);
      body.lineTo(-rMouth, -h);
      body.lineTo(rMouth - 6, -h);
      body.quadTo(rMouth + lip * 0.6, -h - 4, rMouth + lip, -h + 6); // the lip
      body.quadTo(rMouth + 2, -h + 14, rMouth + 2, -150);
      body.cubicTo(rBelly, -90, rBelly + 4, -40, rBase, 0);
      body.close();
      // The C handle: outer and inner curves (14 mm strap).
      handle.moveTo(-rMouth + 2, -170);
      handle.cubicTo(-rMouth - 60, -175, -rMouth - 66, -70, -rBelly + 2, -50);
      handle.lineTo(-rBelly + 4, -64);
      handle.cubicTo(-rMouth - 48, -82, -rMouth - 46, -158, -rMouth + 2, -156);
      handle.close();
      mouth.addOval(Skia.XYWHRect(-rMouth + 4, -h - 7, 2 * rMouth - 8, 14));
      const m = Skia.Matrix();
      const t = (JUG.tilt * Math.PI) / 180;
      // Place it so the handle's middle sits in the grip.
      const hx = -rMouth - 50;
      const hy = -110;
      const rx = hx * Math.cos(t) - hy * Math.sin(t);
      const ry = hx * Math.sin(t) + hy * Math.cos(t);
      m.translate(JUG.grip.u - rx, JUG.grip.v - ry);
      m.rotate(t);
      for (const q of [body, handle, mouth]) q.transform(m);
      const lx = rMouth + lip;
      const ly = -h + 6;
      const tip = { u: JUG.grip.u - rx + lx * Math.cos(t) - ly * Math.sin(t), v: JUG.grip.v - ry + lx * Math.sin(t) + ly * Math.cos(t) };
      stream.moveTo(tip.u, tip.v);
      // A pour leaves the lip near-level and falls as a parabola: (x/2, y0) is its control.
      stream.quadTo(tip.u / 2, tip.v, 0, 0);
    } else {
      // (review 2026-11-24: from above the jug was missing — a round body hidden under the fist.) Tipped 100° as
      // the side view draws it, the jug lies on its side UNDER the hand: its base behind the fist (≈ x −276),
      // its mouth ahead of it (≈ x −89), the belly 116 across, the handle on its top under the fingers, the
      // mouth seen almost edge-on with the lip at the front, the stream running to the basin.
      const xb = JUG.grip.u - 126;
      const xm = JUG.grip.u + 61;
      body.moveTo(xb, -rBase);
      body.cubicTo(xb + 50, -rBelly - 4, xm - 70, -rBelly, xm - 8, -rMouth - 2);
      body.quadTo(xm + lip, 0, xm - 8, rMouth + 2);
      body.cubicTo(xm - 70, rBelly, xb + 50, rBelly + 4, xb, rBase);
      body.quadTo(xb - 10, 0, xb, -rBase);
      body.close();
      mouth.addOval(Skia.XYWHRect(xm - 12, -rMouth + 4, 14, 2 * rMouth - 8));
      handle.addRRect(Skia.RRectXY(Skia.XYWHRect(JUG.grip.u - 80, -8, 120, 16), 8, 8));
      stream.moveTo(xm + lip - 4, 0);
      stream.lineTo(0, 0);
    }
    return { body, handle, mouth, stream };
  }, [view]);
  return (
    <Group>
      <Path path={g.stream} style="stroke" strokeWidth={9} strokeCap="round" color="#7fbde6" opacity={0.85} />
      <Path path={g.handle}>
        <LinearGradient start={vec(-260, -420)} end={vec(-60, -200)} colors={['#dfe4ea', '#8d959f', '#4a5058']} />
      </Path>
      <Path path={g.handle} style="stroke" strokeWidth={2.2} color="#22262b" />
      <Path path={g.body}>
        <LinearGradient start={vec(-260, -420)} end={vec(-20, -180)} colors={['#f2f5f8', '#b9c0c8', '#6a727b', '#3e444b']} />
      </Path>
      <Path path={g.body} style="stroke" strokeWidth={2.2} color="#22262b" />
      <Path path={g.mouth} color="#2a2f35" />
      <Path path={g.mouth} style="stroke" strokeWidth={2} color="#e9edf1" />
    </Group>
  );
}

function LowTable({ view, floor }: { view: ViewId; floor: number }) {
  return <TableArt view={view} x0={-380} x1={380} z0={-380} z1={380} topY={BASIN.water} floorY={floor} thick={30} />;
}

export function ImpactsArt({ view, variant, v2 = V2 }: { view: ViewId; variant: VariantId; /** (the study page compares the old look) */ v2?: boolean }) {
  const P = posesOf(variant);
  const floor = floorOf(variant);
  const live = variant === 'live';
  const booth = liveBooth(floor);
  const tt = tableTop(variant);
  if (v2) {
    // THE NEW LOOK: the table and props first, then the artist over them — the block and the jug through the
    // right fist, the brush under the flat right hand
    const block = variant === 'impact' || live;
    if (view === 'top')
      return (
        <Group>
          <StageFloorPlan u0={TOP.u0 - 200} u1={TOP.u1 + 900} v0={TOP.v0 - 200} v1={TOP.v1 + 200} />
          {live ? <BoothArt view="top" rail={booth.rail} pa={{ x: booth.pa.p.x, y: booth.pa.p.y, z: booth.pa.p.z }} /> : null}
          {/* (cast sweep 2026-11-26) bent over the table, the seat and the shoes show behind the back from above —
              drawn before the table, so a toe under its edge stays under the top */}
          {legsFromAbove(bodyOf(variant)) ? <PlayerTopV2 plan={topOf(variant)} who={FOLEY_PERFORMER} part="legs" legs /> : null}
          {variant === 'water' ? <LowTable view="top" floor={floor} /> : <TableArt view="top" x0={TABLE.x0} x1={TABLE.x1} z0={TABLE.z0} z1={TABLE.z1} topY={tt} floorY={floor} />}
          {variant === 'water' ? <Basin view="top" /> : null}
          {variant === 'texture' ? <BrushBoard view="top" /> : null}
          {variant === 'water' ? <Jug view="top" /> : null}
          <PlayerTopV2 plan={topOf(variant)} grips={foleyTopGrips(bodyOf(variant), specOf(variant))} who={FOLEY_PERFORMER} part="upper" nearStick={block ? <PaddedBlock view="top" /> : undefined} />
        </Group>
      );
    const s = F04_MODEL.viewsByVariant?.[variant]?.side ?? F04_MODEL.views.side!;
    return (
      <Group>
        <PitSection surface="concrete" floorY={floor} u0={s.u0 - 200} u1={s.u1 + 200} pit={false} />
        {live ? <BoothArt view="side" floorY={floor} rail={booth.rail} pa={{ x: booth.pa.p.x, y: booth.pa.p.y, z: booth.pa.p.z }} /> : null}
        {variant === 'water' ? <LowTable view="side" floor={floor} /> : <TableArt view="side" x0={TABLE.x0} x1={TABLE.x1} z0={TABLE.z0} z1={TABLE.z1} topY={tt} floorY={floor} />}
        {variant === 'water' ? <Basin view="side" /> : null}
        <PlayerSideV2 plan={sideOf(variant)} grips={foleySideGrips(bodyOf(variant), specOf(variant))} who={FOLEY_PERFORMER} nearStick={block ? <PaddedBlock view="side" lift={200} /> : variant === 'water' ? <Jug view="side" /> : undefined} />
        {/* (the brush on its board lies nearer the camera than the left hand on the board: drawn over it; the
            right hand rests on the brush's top, clear of it) */}
        {variant === 'texture' ? <BrushBoard view="side" /> : null}
      </Group>
    );
  }
  if (view === 'top') {
    return (
      <Group>
        <StageFloorPlan u0={TOP.u0 - 200} u1={TOP.u1 + 900} v0={TOP.v0 - 200} v1={TOP.v1 + 200} />
        {live ? <BoothArt view="top" rail={booth.rail} pa={{ x: booth.pa.p.x, y: booth.pa.p.y, z: booth.pa.p.z }} /> : null}
        {variant === 'water' ? <LowTable view="top" floor={floor} /> : <TableArt view="top" x0={TABLE.x0} x1={TABLE.x1} z0={TABLE.z0} z1={TABLE.z1} topY={tt} floorY={floor} />}
        {variant === 'water' ? <Basin view="top" /> : null}
        {variant === 'texture' ? <BrushBoard view="top" /> : null}
        <PlayerBehind pose={P.top} />
        {variant === 'impact' || live ? <PaddedBlock view="top" /> : null}
        {variant === 'water' ? <Jug view="top" /> : null}
        <PlayerInFront pose={P.top} />
      </Group>
    );
  }
  const s = F04_MODEL.viewsByVariant?.[variant]?.side ?? F04_MODEL.views.side!;
  return (
    <Group>
      <PitSection surface="concrete" floorY={floor} u0={s.u0 - 200} u1={s.u1 + 200} pit={false} />
      {live ? <BoothArt view="side" floorY={floor} rail={booth.rail} pa={{ x: booth.pa.p.x, y: booth.pa.p.y, z: booth.pa.p.z }} /> : null}
      <PlayerBehind pose={P.side} />
      {variant === 'water' ? <LowTable view="side" floor={floor} /> : <TableArt view="side" x0={TABLE.x0} x1={TABLE.x1} z0={TABLE.z0} z1={TABLE.z1} topY={tt} floorY={floor} />}
      {variant === 'water' ? <Basin view="side" /> : null}
      {variant === 'texture' ? <BrushBoard view="side" /> : null}
      {variant === 'impact' || live ? <PaddedBlock view="side" lift={200} /> : null}
      {variant === 'water' ? <Jug view="side" /> : null}
      <PlayerInFront pose={P.side} />
    </Group>
  );
}

export function impactsLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const floor = floorOf(variant);
  const live = variant === 'live';
  const out: ArtLabel[] = [];
  if (view === 'side') {
    if (variant === 'impact' || live) out.push({ id: 'block', text: 'PADDED BLOCK', short: 'BLOCK', u: 260, v: -380, align: 'left', at: { u: 60, v: -230 } }, { id: 'table', text: 'WOODEN TABLE', short: 'TABLE', u: 380, v: 330, align: 'left', tone: 'muted', at: { u: TABLE.x1 - 40, v: 200 } });
    if (variant === 'water') {
      // Above the scene, its leader straight down to the basin between the
      // pouring hand and the mic's lobe (art fix 2026-10-16: the name and its
      // leader crossed the lobe and the distance line; the mat, a part of
      // the low table, is named by a tap).
      // (review 2026-11-24: that leader dropped through the artist's forearm, the jug and the air before her
      // face — it now comes from the basin's open side, away from her, to the water's far half)
      out.push({ id: 'basin', text: 'BASIN · WATER ONLY', short: 'BASIN', u: 380, v: -420, align: 'left', at: { u: 110, v: 6 } });
    }
    if (variant === 'texture') out.push({ id: 'brush', text: 'DRY BRUSH ON FABRIC', short: 'BRUSH', u: 260, v: -300, align: 'left', at: { u: 100, v: -50 } });
    if (live) {
      const b = liveBooth(floor);
      out.push({ id: 'pa', text: 'PA', u: b.pa.p.x, v: b.pa.p.y - 420, align: 'center', at: { u: b.pa.p.x, v: b.pa.p.y - 330 } });
    }
    return out;
  }
  if (variant === 'water') out.push({ id: 'splash', text: 'SPLASH ENVELOPE', short: 'SPLASH', u: 0, v: -splashRadius() - 90, align: 'center', tone: 'muted', at: { u: 0, v: -splashRadius() } });
  if (variant === 'texture') out.push({ id: 'stroke', text: '↕ THE STROKE', short: '↕', u: 260, v: -PROP_DIMS.boardD.mm / 2 - 60, align: 'left', tone: 'muted' });
  if (variant === 'impact' || live) out.push({ id: 'block', text: 'BLOCK', u: 260, v: -240, align: 'left', at: { u: 60, v: -40 } });
  if (live) {
    const b = liveBooth(floor);
    out.push({ id: 'pa', text: 'PA', u: b.pa.p.x - 260, v: b.pa.p.z, align: 'right', at: { u: b.pa.p.x - 200, v: b.pa.p.z } });
  }
  return out;
}

export function impactsHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const floor = floorOf(variant);
  const live = variant === 'live';
  const P = posesOf(variant);
  if (variant === 'impact' || live) {
    if (Math.abs(u) <= 90 + tol && (view === 'side' ? v >= -270 - tol && v <= -190 + tol : Math.abs(v) <= 60 + tol)) return 'f04.block';
    if (u >= TABLE.x0 - tol && u <= TABLE.x1 + tol && (view === 'side' ? v >= -tol && v <= floor : Math.abs(v) <= TABLE.z1 + tol)) return 'f04.table';
  }
  if (variant === 'water') {
    if (Math.abs(u) <= BASIN.R + tol && (view === 'side' ? v >= -(BASIN.depth - BASIN.water) - tol && v <= BASIN.water + tol : Math.abs(v) <= BASIN.R + tol)) return 'f04.basin';
    if (Math.abs(u) <= 380 + tol && (view === 'side' ? v > BASIN.water && v <= floor : Math.abs(v) <= 380 + tol)) return 'f04.lowTable';
  }
  if (variant === 'texture') {
    if (Math.abs(u) <= 320 + tol && (view === 'side' ? v >= -80 - tol && v <= 20 + tol : Math.abs(v) <= 220 + tol)) return 'f04.board';
    if (u >= TABLE.x0 - tol && u <= TABLE.x1 + tol && (view === 'side' ? v >= 18 - tol && v <= floor : Math.abs(v) <= TABLE.z1 + tol)) return 'f04.tableTex';
  }
  if (live) {
    const b = liveBooth(floor);
    if (view === 'side' && Math.abs(u - b.pa.p.x) <= 220 + tol && v >= b.pa.p.y - 340 - tol && v <= b.pa.p.y + 340 + tol) return 'f04.pa';
    if (view === 'top' && Math.abs(u - b.pa.p.x) <= 220 + tol && Math.abs(v - b.pa.p.z) <= 300 + tol) return 'f04.pa';
    if (u >= b.rail.x - tol && u <= b.rail.x + 60 + tol) return 'f04.booth';
  }
  if (view === 'side' && V2 ? v2Covers(variant, u, v, tol) : poseCovers(view === 'side' ? P.side : P.top, u, v, tol)) return 'f04.artist';
  return null;
}

export const F04_ART: LessonArt = {
  Instrument: ImpactsArt,
  labels: impactsLabels,
  hitTest: impactsHitTest,
  figureAt: (view, variant, u, v, tol) => (view === 'side' && V2 ? v2Covers(variant, u, v, tol) : poseCovers(view === 'side' ? posesOf(variant).side : posesOf(variant).top, u, v, tol)),
  labelObstacles: voiceLabelObstacles(F04_ZONES),
  labelsYieldToMic: true,
  // ORIENT's figure: the artist head to floor at the table (art fix 2026-10-16).
  figureBox: (v) => ({ u0: -1050, u1: 520, v0: floorOf(v) - 1820, v1: floorOf(v) + 70 }),
};
