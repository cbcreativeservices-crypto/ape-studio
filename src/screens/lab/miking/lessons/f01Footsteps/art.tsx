/**
 * F01 FOLEY FOOTSTEPS — the look (charter §2 layer 3), drawn from the model
 * only (geometry.ts, the shared Foley stage): in millimetres of the view's
 * (u, v) — side u = x, v = y (a section through the walker's front line, the
 * pit cut open); top u = x, v = z.
 *
 *   SIDE  the stage floor and its 35 cm slab in section, the pit's concrete
 *         rim and the variant's surface layers (tile on mortar and concrete;
 *         boards over an air void; gravel on sand; carpet and underlay over
 *         boards), the walker mid-stride in profile; LIVE: the booth's front
 *         rail and the PA on its pole stand.
 *   TOP   the stage floor, the pit's frame and surface, spike tape at the
 *         corners of the movement, the walker from above; LIVE: the rail and
 *         the PA.
 * Static (D8). Labels name what a mic decision needs; the figure is never
 * covered by words (figureAt).
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { PlayerBehind, PlayerInFront } from '../shared/players/PlayerFigure';
import { poseCovers } from '../shared/foley/performer.ts';
import { BoothArt, PitPlan, PitSection, StageFloorPlan } from '../shared/foley/StageArt';
import { liveBooth, PIT } from '../shared/foley/stage.ts';
import { PERFORMER_DIMS } from '../shared/foley/performer.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { F01_MODEL, F01_SURFACE, HEEL, surfaceOf, WALKER_SIDE, WALKER_TOP } from './geometry.ts';
import { F01_ZONES } from './model.ts';

const V = F01_MODEL.views;
const BOOTH = liveBooth(0);
const TAPE = { u0: -PIT.hx - PIT.rim, u1: PIT.hx + PIT.rim, v0: -PIT.hz - PERFORMER_DIMS.sweep.mm, v1: PIT.hz + PERFORMER_DIMS.sweep.mm };

export function FootstepsArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const surface = F01_SURFACE[variant] ?? 'tile';
  const live = variant === 'live';
  if (view === 'top') {
    const t = V.top!;
    return (
      <Group>
        <StageFloorPlan u0={t.u0 - 200} u1={t.u1 + 200} v0={t.v0 - 200} v1={t.v1 + 200} />
        <PitPlan surface={surface} tapeBox={TAPE} />
        {live ? <BoothArt view="top" rail={BOOTH.rail} pa={{ x: BOOTH.pa.p.x, y: BOOTH.pa.p.y, z: BOOTH.pa.p.z }} /> : null}
        <PlayerBehind pose={WALKER_TOP} />
        <PlayerInFront pose={WALKER_TOP} />
      </Group>
    );
  }
  const s = V.side!;
  return (
    <Group>
      <PitSection surface={surface} u0={s.u0 - 200} u1={s.u1 + 200} />
      {live ? <BoothArt view="side" rail={BOOTH.rail} pa={{ x: BOOTH.pa.p.x, y: BOOTH.pa.p.y, z: BOOTH.pa.p.z }} /> : null}
      <PlayerBehind pose={WALKER_SIDE} />
      <PlayerInFront pose={WALKER_SIDE} />
    </Group>
  );
}

export function footstepsLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = surfaceOf(variant);
  const top = s.layers[0];
  const live = variant === 'live';
  if (view === 'top') {
    const out: ArtLabel[] = [
      { id: 'pit', text: `PIT · ${s.short}`, short: s.short, u: 0, v: PIT.hz + 200, align: 'center', at: { u: 0, v: PIT.hz - 60 } },
      { id: 'tape', text: 'MOVEMENT MARKED', short: 'MARKED', u: TAPE.u1 + 60, v: TAPE.v1 - 40, align: 'left', tone: 'muted', at: { u: TAPE.u1, v: TAPE.v1 } },
      { id: 'exit', text: '↑ EXIT PATH', short: '↑ EXIT', u: -200, v: TAPE.v0 - 90, align: 'center', tone: 'muted' },
    ];
    if (live) out.push({ id: 'pa', text: 'PA', u: BOOTH.pa.p.x - 260, v: BOOTH.pa.p.z, align: 'right', at: { u: BOOTH.pa.p.x - 200, v: BOOTH.pa.p.z } });
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'heel', text: 'HEEL', u: HEEL.x + 260, v: -260, align: 'left', at: { u: HEEL.x, v: -20 }, alts: [{ u: HEEL.x + 320, v: -180, align: 'left' }] },
    { id: 'surface', text: `${s.short} SURFACE`, short: s.short, u: PIT.hx + 160, v: 120, align: 'left', at: { u: PIT.hx - 60, v: top.mm / 2 } },
    { id: 'slab', text: 'BASE SLAB', short: 'SLAB', u: -PIT.hx - 140, v: 330, align: 'right', tone: 'muted', at: { u: -PIT.hx - 60, v: 300 } },
  ];
  if (s.hollow) {
    const voidLayer = s.layers.find((l) => l.kind === 'void');
    let y = 0;
    for (const l of s.layers) {
      if (l === voidLayer) break;
      y += l.mm;
    }
    out.push({ id: 'void', text: 'AIR GAP UNDER THE BOARDS', short: 'AIR GAP', u: PIT.hx + 160, v: 260, align: 'left', at: { u: PIT.hx - 120, v: y + (voidLayer?.mm ?? 0) / 2 } });
  }
  if (live) out.push({ id: 'pa', text: 'PA', u: BOOTH.pa.p.x, v: BOOTH.pa.p.y - 420, align: 'center', at: { u: BOOTH.pa.p.x, v: BOOTH.pa.p.y - 330 } });
  return out;
}

export function footstepsHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const live = variant === 'live';
  const s = surfaceOf(variant);
  if (view === 'side') {
    if (Math.hypot(u - HEEL.x, v + 40) <= 90 + tol) return 'f01.shoe';
    if (poseCovers(WALKER_SIDE, u, v, tol)) return 'f01.walker';
    if (live && Math.abs(u - BOOTH.pa.p.x) <= 220 + tol && v >= BOOTH.pa.p.y - 340 - tol && v <= BOOTH.pa.p.y + 340 + tol) return 'f01.pa';
    if (live && u >= BOOTH.rail.x - tol && u <= BOOTH.rail.x + 60 + tol && v >= -BOOTH.rail.h - tol && v <= tol) return 'f01.booth';
    if (Math.abs(u) <= PIT.hx + tol && v >= -tol && v <= PIT.depth + tol) return v <= s.layers[0].mm + tol ? `f01.surface.${variant}` : `f01.under.${variant}`;
    if (Math.abs(u) <= PIT.hx + PIT.rim + tol && v >= -tol && v <= 25 + tol) return 'f01.pitRim';
    // The slab under the pit (its tap area kept to the section round the pit).
    if (v > 25 && v <= PIT.depth + 180 + tol && Math.abs(u) <= PIT.hx + PIT.rim + 150) return 'f01.slab';
    return null;
  }
  if (poseCovers(WALKER_TOP, u, v, tol)) return 'f01.walker';
  if (live && Math.abs(u - BOOTH.pa.p.x) <= 220 + tol && Math.abs(v - BOOTH.pa.p.z) <= 300 + tol) return 'f01.pa';
  if (live && u >= BOOTH.rail.x - tol && u <= BOOTH.rail.x + 60 + tol) return 'f01.booth';
  if (Math.abs(u) <= PIT.hx + tol && Math.abs(v) <= PIT.hz + tol) return `f01.surface.${variant}`;
  if (Math.abs(u) <= PIT.hx + PIT.rim + tol && Math.abs(v) <= PIT.hz + PIT.rim + tol) return 'f01.pitRim';
  return null;
}

export const F01_ART: LessonArt = {
  Instrument: FootstepsArt,
  labels: footstepsLabels,
  hitTest: footstepsHitTest,
  figureAt: (view, _variant, u, v, tol) => poseCovers(view === 'side' ? WALKER_SIDE : WALKER_TOP, u, v, tol),
  labelObstacles: voiceLabelObstacles(F01_ZONES),
  labelsYieldToMic: true,
};
