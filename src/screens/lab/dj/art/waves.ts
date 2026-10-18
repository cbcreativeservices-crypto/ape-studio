/**
 * waves — the decks' waveform pictures, built from the REAL audio's min/max
 * (engine/djMusic.overviewOf: the track assembled and measured, never a
 * cartoon). Paths are built ONCE per track (and per grid) in track-seconds
 * on x and ±1 full scale on y; the drawings place and scroll them with a
 * transform, so a frame costs one matrix, not a new path.
 *
 * Colour comes from the house loudness ramp through WAVE_LEVEL_STOPS (blue at
 * the zero line, climbing to red at ±full scale) — the gradient maps to the
 * path's own ±1 axis, so a louder column is redder at its tip.
 */
import { Skia, type SkPath } from '@shopify/react-native-skia';
import { overviewOf, trackSeconds, type TrackId } from '../engine/djMusic';
import { BEATS_PER_BAR, timeOfBeat, type Grid } from '../model/djTime';
import { WAVE_LEVEL_STOPS } from '../../../../features/tools/levelColor';

const wavePaths = new Map<string, SkPath>();

/**
 * The track's waveform as a filled min/max path, x in seconds, y in ±1
 * (up = positive). `step` merges columns (2 = every other column's extremes
 * pooled) for the small overview.
 */
export function wavePath(id: TrackId, step = 1): SkPath | null {
  const key = `${id}:${step}`;
  const hit = wavePaths.get(key);
  if (hit) return hit;
  const o = overviewOf(id);
  if (!o) return null;
  const p = Skia.PathBuilder.Make();
  const n = o.hi.length;
  const cols = Math.ceil(n / step);
  const hi: number[] = [];
  const lo: number[] = [];
  for (let c = 0; c < cols; c++) {
    let h = -1;
    let l = 1;
    for (let k = c * step; k < Math.min(n, (c + 1) * step); k++) {
      if (o.hi[k] > h) h = o.hi[k];
      if (o.lo[k] < l) l = o.lo[k];
    }
    hi.push(h);
    lo.push(l);
  }
  const dx = o.colSec * step;
  p.moveTo(0, -hi[0]);
  for (let c = 1; c < cols; c++) p.lineTo(c * dx, -hi[c]);
  for (let c = cols - 1; c >= 0; c--) p.lineTo(c * dx, -lo[c]);
  p.close();
  const path = p.detach();
  wavePaths.set(key, path);
  return path;
}

const gridPaths = new Map<string, { beats: SkPath; bars: SkPath }>();

/** Beat lines (thin) and bar lines (bold) of `grid` across a track, x in
 *  seconds, y from −1 to +1. */
export function gridPath(id: TrackId, grid: Grid): { beats: SkPath; bars: SkPath } {
  const key = `${id}:${grid.bpm.toFixed(4)}:${grid.firstBeatSec.toFixed(5)}`;
  const hit = gridPaths.get(key);
  if (hit) return hit;
  const beats = Skia.PathBuilder.Make();
  const bars = Skia.PathBuilder.Make();
  const end = trackSeconds(id);
  const first = Math.ceil((-grid.firstBeatSec * grid.bpm) / 60);
  for (let b = first; ; b++) {
    const t = timeOfBeat(grid, b);
    if (t > end) break;
    if (t < 0) continue;
    const target = b % BEATS_PER_BAR === 0 ? bars : beats;
    target.moveTo(t, -1);
    target.lineTo(t, 1);
  }
  const v = { beats: beats.detach(), bars: bars.detach() };
  gridPaths.set(key, v);
  return v;
}

/** Gradient stops for a waveform drawn on a ±1 axis. */
export const WAVE_COLOURS = WAVE_LEVEL_STOPS.map((s) => s.color);
export const WAVE_POSITIONS = WAVE_LEVEL_STOPS.map((s) => s.offset);
