/**
 * waves — the decks' waveform pictures, built from the REAL audio's analysis
 * (engine/djMusic.overviewOf: the track assembled and measured, never a
 * cartoon). Paths are built ONCE per track (and per grid) in track-seconds
 * on x and ±1 full scale on y; the drawings place and scroll them with a
 * transform, so a frame costs one matrix, not a new path.
 *
 * THE LAYERS (visual review 2026-10-18, blocker 1 — every lane, player screen
 * and laptop draws the same stack, waveDraw.tsx):
 *   peak   the min/max envelope (the loudest instants), drawn at 55 %;
 *   rms    the RMS core (the body of the sound), solid;
 *   low    the low band's peak (kicks and bass), a tint so a kick stands out;
 * all three in the house loudness ramp's ±1 axis (WAVE_LEVEL_STOPS), scaled
 * per track by `gain` so the track's 99th-percentile peak reaches 80 % of the
 * lane's half-height (headroom scaling — the colour still reads the true
 * level, since the gradient keys to the path's own ±1 axis). The beat grid is
 * drawn ON TOP, with keylines.
 */
import { Skia, type SkPath } from '@shopify/react-native-skia';
import { overviewOf, trackSeconds, type TrackId } from '../engine/djMusic';
import { BEATS_PER_BAR, timeOfBeat, type Grid } from '../model/djTime';
import { WAVE_LEVEL_STOPS } from '../../../../features/tools/levelColor';
import { headroomGain, lowOnsets } from './waveHeadroom';

export { headroomGain };

export type WaveLayers = { peak: SkPath; rms: SkPath; low: SkPath; kicks: SkPath; gain: number };

const layerCache = new Map<string, WaveLayers>();

/**
 * The track's three waveform layers, x in seconds, y in ±1 (up = positive).
 * `step` pools columns (each pooled column keeps its extremes, its loudest
 * RMS and its loudest low band) for the small overviews.
 */
export function waveLayers(id: TrackId, step = 1): WaveLayers | null {
  const key = `${id}:${step}`;
  const hit = layerCache.get(key);
  if (hit) return hit;
  const o = overviewOf(id);
  if (!o) return null;
  const n = o.hi.length;
  const cols = Math.ceil(n / step);
  const hi: number[] = [];
  const lo: number[] = [];
  const rm: number[] = [];
  const lw: number[] = [];
  for (let c = 0; c < cols; c++) {
    let h = -1;
    let l = 1;
    let r = 0;
    let w = 0;
    for (let k = c * step; k < Math.min(n, (c + 1) * step); k++) {
      if (o.hi[k] > h) h = o.hi[k];
      if (o.lo[k] < l) l = o.lo[k];
      if (o.rms[k] > r) r = o.rms[k];
      if (o.low[k] > w) w = o.low[k];
    }
    hi.push(h);
    lo.push(l);
    rm.push(r);
    lw.push(w);
  }
  const dx = o.colSec * step;
  const band = (top: number[], bot: number[]) => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(0, -top[0]);
    for (let c = 1; c < cols; c++) p.lineTo(c * dx, -top[c]);
    for (let c = cols - 1; c >= 0; c--) p.lineTo(c * dx, -bot[c]);
    p.close();
    return p.detach();
  };
  // the kick-tick row: a short mark at the foot of the lane at every onset
  // of the low band (y in the lane's ±1, before the track's gain)
  const kp = Skia.PathBuilder.Make();
  const g = headroomGain(o.hi, o.lo);
  for (const c of lowOnsets(o.low)) {
    const t = c * o.colSec;
    kp.moveTo(t, 0.8 / g);
    kp.lineTo(t, 1.02 / g);
  }
  const v: WaveLayers = {
    peak: band(hi, lo),
    rms: band(rm, rm.map((x) => -x)),
    low: band(lw, lw.map((x) => -x)),
    kicks: kp.detach(),
    gain: g,
  };
  layerCache.set(key, v);
  return v;
}

const gridPaths = new Map<string, { beats: SkPath; bars: SkPath }>();

/** Beat lines (thin) and bar lines (bold) of `grid` across a track, x in
 *  seconds, y from −1 to +1 (the lane's full height after its scale). */
export function gridPath(id: TrackId, grid: Grid, yExtent = 1): { beats: SkPath; bars: SkPath } {
  const key = `${id}:${grid.bpm.toFixed(4)}:${grid.firstBeatSec.toFixed(5)}:${yExtent}`;
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
    target.moveTo(t, -yExtent);
    target.lineTo(t, yExtent);
  }
  const v = { beats: beats.detach(), bars: bars.detach() };
  gridPaths.set(key, v);
  return v;
}

/** Gradient stops for a waveform drawn on a ±1 axis. */
export const WAVE_COLOURS = WAVE_LEVEL_STOPS.map((s) => s.color);
export const WAVE_POSITIONS = WAVE_LEVEL_STOPS.map((s) => s.offset);
/** The low band's tint: outside the loudness ramp, so a kick reads as a kick. */
export const WAVE_LOW = '#c9a2ff';
