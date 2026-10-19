/**
 * waveDraw — ONE waveform renderer for every lane, player screen, laptop and
 * standalone screen (visual review 2026-10-18, blocker 1). It draws inside a
 * transform the caller owns: x in track-seconds × `pps` (points per second),
 * y in ±1 × the lane's half-height. The track's headroom gain is applied
 * here, so the caller's half-height is the LANE's, never the audio's.
 *
 *   WaveBody   peak envelope (55 %) + RMS core (solid) + the low band's tint,
 *              in the house loudness ramp (blue floor → red at full scale);
 *   GridOver   the analysed grid ON TOP: beat lines 1 pt white at 0.5, bar
 *              lines 2 pt amber, each over a 1 pt dark keyline, so a line
 *              reads across a loud wave as well as a quiet one.
 */
import { Group, LinearGradient, Path, vec, type SkPath } from '@shopify/react-native-skia';
import type { TrackId } from '../engine/djMusic';
import type { Grid } from '../model/djTime';
import { gridPath, waveLayers, WAVE_COLOURS, WAVE_LOW, WAVE_POSITIONS } from './waves';

/** The waveform layers of `id`, in (seconds, ±1·gain) — wrap in the lane's
 *  transform. `low` = draw the kick tint (off on tiny overviews). */
export function WaveBody({ id, step = 1, low = true, gainOf, kicks = 0 }: { id: TrackId; step?: number; low?: boolean; gainOf?: (g: number) => number; kicks?: number }) {
  const L = waveLayers(id, step);
  if (!L) return null;
  const g = gainOf ? gainOf(L.gain) : L.gain;
  const grad = <LinearGradient start={vec(0, -1)} end={vec(0, 1)} colors={WAVE_COLOURS} positions={WAVE_POSITIONS} />;
  return (
    <Group transform={[{ scaleY: g }]}>
      <Path path={L.peak} opacity={0.55}>
        {grad}
      </Path>
      {low ? <Path path={L.low} color={WAVE_LOW} opacity={0.5} /> : null}
      <Path path={L.rms}>{grad}</Path>
      {kicks > 0 ? <Path path={L.kicks} style="stroke" strokeWidth={kicks} color={WAVE_LOW} strokeCap="butt" /> : null}
    </Group>
  );
}

/**
 * ADDITIVE (visual review 2 #8): the same stack for a lane that is not a
 * whole track — a STEM — in one flat colour (a stem's identity colour, not
 * the loudness ramp): the peak envelope at 55 % over the RMS core, solid.
 * Paths in (seconds, ±1); `gain` is the lane's headroom scale.
 */
export function WaveBand({ peak, rms, colour, gain = 1, opacity = 1 }: { peak: SkPath; rms: SkPath; colour: string; gain?: number; opacity?: number }) {
  return (
    <Group transform={[{ scaleY: gain }]} opacity={opacity}>
      <Path path={peak} color={colour} opacity={0.55} />
      <Path path={rms} color={colour} />
    </Group>
  );
}

/** The track's headroom gain (1 before it is analysed). */
export function waveGain(id: TrackId | null): number {
  if (!id) return 1;
  return waveLayers(id)?.gain ?? 1;
}

/**
 * The grid over the wave, in the same (seconds, ±1) transform. `pps` turns a
 * width in points into seconds so the strokes stay 1 / 2 pt at any zoom of
 * the lane; `k` grows them with the full-screen zoom.
 */
export function GridOver({ id, grid, pps, k = 1 }: { id: TrackId; grid: Grid; pps: number; k?: number }) {
  const lines = gridPath(id, grid);
  // y runs ±1 here; a stroke's width is in x units (seconds) on a vertical
  // line, so only `pps` matters for its thickness.
  const w = (pt: number) => (pt * k) / pps;
  return (
    <Group>
      <Path path={lines.beats} style="stroke" strokeWidth={w(3)} color="rgba(0,0,0,0.55)" />
      <Path path={lines.beats} style="stroke" strokeWidth={w(1)} color="rgba(255,255,255,0.5)" />
      <Path path={lines.bars} style="stroke" strokeWidth={w(4)} color="rgba(0,0,0,0.7)" />
      <Path path={lines.bars} style="stroke" strokeWidth={w(2)} color="rgba(255,198,77,0.95)" />
    </Group>
  );
}
