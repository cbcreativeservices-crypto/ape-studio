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
      const c = -150;
      body.addCircle(c, 0, rBelly);
      body.moveTo(c + rMouth - 6, -14);
      body.quadTo(c + rMouth + lip, 0, c + rMouth - 6, 14);
      body.close();
      mouth.addCircle(c, 0, rMouth - 6);
      handle.addRRect(Skia.RRectXY(Skia.XYWHRect(c - rBelly - 46, -8, 52, 16), 8, 8));
      stream.moveTo(c + rMouth + lip, 0);
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

export function ImpactsArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const P = posesOf(variant);
  const floor = floorOf(variant);
  const live = variant === 'live';
  const booth = liveBooth(floor);
  const tt = tableTop(variant);
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
    if (variant === 'water') out.push({ id: 'basin', text: 'BASIN · WATER ONLY', short: 'BASIN', u: 300, v: -280, align: 'left', at: { u: BASIN.R - 40, v: 0 } }, { id: 'mat', text: 'NON-SLIP MAT', short: 'MAT', u: 420, v: 160, align: 'left', tone: 'muted', at: { u: BASIN.R + 120, v: BASIN.water + 4 } });
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
  if (poseCovers(view === 'side' ? P.side : P.top, u, v, tol)) return 'f04.artist';
  return null;
}

export const F04_ART: LessonArt = {
  Instrument: ImpactsArt,
  labels: impactsLabels,
  hitTest: impactsHitTest,
  figureAt: (view, variant, u, v, tol) => poseCovers(view === 'side' ? posesOf(variant).side : posesOf(variant).top, u, v, tol),
  labelObstacles: voiceLabelObstacles(F04_ZONES),
  labelsYieldToMic: true,
};
