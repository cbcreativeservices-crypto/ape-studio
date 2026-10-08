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

/** A small jug pouring (side view): the jug tilted above the basin, the stream into the entry. */
function Jug({ view }: { view: ViewId }) {
  const g = useMemo(() => {
    const jug = make();
    const stream = make();
    if (view === 'side') {
      jug.moveTo(-240, -380);
      jug.lineTo(-130, -420);
      jug.lineTo(-90, -320);
      jug.lineTo(-60, -300);
      jug.lineTo(-90, -290);
      jug.lineTo(-180, -270);
      jug.close();
      stream.moveTo(-62, -298);
      stream.cubicTo(-30, -250, -8, -150, 0, 0);
    } else {
      jug.addOval(Skia.XYWHRect(-230, -60, 150, 120));
      stream.moveTo(-80, 0);
      stream.lineTo(0, 0);
    }
    return { jug, stream };
  }, [view]);
  return (
    <Group>
      <Path path={g.stream} style="stroke" strokeWidth={9} strokeCap="round" color="#7fbde6" opacity={0.85} />
      <Path path={g.jug}>
        <LinearGradient start={vec(-240, -420)} end={vec(-60, -270)} colors={['#e9edf1', '#a9b1ba', '#5e666f']} />
      </Path>
      <Path path={g.jug} style="stroke" strokeWidth={2.2} color="#22262b" />
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
