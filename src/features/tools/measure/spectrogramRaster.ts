/**
 * The spectrogram's colour mapping and raster builder — shared by the LIVE tool
 * and by anything that redraws a SAVED snapshot.
 *
 * WHY THIS IS ITS OWN MODULE (2026-09-11). A saved spectrogram is redrawn from
 * the dB grid in its payload rather than from a stored bitmap, which is only
 * legitimate if the redraw is the SAME drawing: same log frequency rows, same
 * floor, same colour ramp, same fixed anchor. If the library owned a second
 * copy of this maths, the two could drift and a saved measurement would quietly
 * stop matching the one the user watched — the exact class of dishonesty the
 * no-fake-meters rule exists to prevent. So there is one implementation and
 * both callers import it.
 *
 * The redraw is exact, not approximate, because of two properties:
 *   • the colour anchor is a CONSTANT (owner 2026-08-14 — history never
 *     recolours), so it needs no session state to reproduce, and
 *   • the saved `grid` IS the raster input: one row per CELL_CENTERS_HZ entry,
 *     already at display resolution.
 * Given the payload's own `dynamicRangeDb`, the picture comes back pixel for
 * pixel.
 */
import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';
import { heatColor } from '../levelColor';

/** Log-spaced frequency rows per column. The saved grid has exactly this many
 *  values per column, so changing it breaks every existing saved snapshot —
 *  see CELL_CENTERS_HZ. */
export const ROWS = 128;
export const F_MIN = 50;
export const F_MAX = 16000;

/** Exported so the live tool's FFT bin→row mapping uses the SAME log axis the
 *  raster and the saved redraw do. */
export const LOG_MIN = Math.log(F_MIN);
export const LOG_SPAN = Math.log(F_MAX) - LOG_MIN;

/** Geometric row centres, precomputed once — also the `bandsHz` every snapshot
 *  stores, which is what lets an old record state its own axis rather than
 *  inherit today's. */
export const CELL_CENTERS_HZ: number[] = Array.from({ length: ROWS }, (_, i) =>
  Math.round(Math.exp(LOG_MIN + (LOG_SPAN * (i + 0.5)) / ROWS)),
);

/** Row floor: a row whose bins all sit at or below this renders as background
 *  and is STORED as this value — a stated display floor, never fabricated. */
export const CELL_FLOOR_DB = -120;

/**
 * FIXED colour anchor (owner 2026-08-14): the top of the colormap is a constant
 * 0 dBFS, with the selected dynamic range below it. A cell's colour is
 * therefore permanent — a later loud event never recolours history, and a
 * snapshot saved last week redraws in the same colours it was captured in.
 */
export const FIXED_ANCHOR_DB = 0;

/** The app-wide amplitude ramp (red = loud, blue = quiet), sampled once to an
 *  RGB lookup so the per-pixel loop never parses a colour string. */
const RASTER_N = 256;
const RASTER_LUT: ReadonlyArray<readonly [number, number, number]> = Array.from(
  { length: RASTER_N },
  (_, i) => {
    const v = parseInt(heatColor(i / (RASTER_N - 1)).slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255] as const;
  },
);

/** Frequency → y as a 0..1 fraction of the grid height, log axis, low
 *  frequencies at the BOTTOM. Shared so a saved snapshot's axis labels land
 *  where the live tool puts them. */
export function freqFraction(hz: number): number {
  const t = (Math.log(Math.max(F_MIN, Math.min(F_MAX, hz))) - LOG_MIN) / LOG_SPAN;
  return 1 - t;
}

/** The axis ticks the live grid draws — reused so a redraw is labelled the same. */
export const FREQ_LABELS = [
  { hz: 100, text: '100' },
  { hz: 1000, text: '1k' },
  { hz: 10000, text: '10k' },
] as const;

/**
 * Build columns of dB cells into ONE SkImage: `n` columns × ROWS rows, each
 * pixel the full-resolution amplitude colour of a REAL measured cell — the same
 * cells, floor and scale as the readouts, with nothing fabricated. Cells at or
 * below the scale floor are TRANSPARENT so the chart background shows through.
 * Row 0 (low frequency) maps to the bottom; the newest column is the rightmost
 * pixel. Drawn scaled with bilinear filtering → smooth in time AND frequency.
 *
 * Takes plain `number[][]` rather than the live tool's column objects so a
 * saved payload's grid can be passed straight in.
 *
 * The caller OWNS the returned image and must dispose() it when it is replaced
 * or unmounted — an SkImage is native memory behind a JS handle.
 */
export function buildRasterImage(
  columns: readonly (readonly number[])[],
  anchor: number,
  dynRange: number,
): SkImage | null {
  const n = columns.length;
  if (n === 0 || dynRange <= 0) return null;
  const floor = anchor - dynRange;
  const inv = 1 / dynRange;
  const last = RASTER_N - 1;
  const buf = new Uint8Array(n * ROWS * 4); // zero-filled = transparent background
  for (let px = 0; px < n; px++) {
    const cells = columns[px];
    for (let py = 0; py < ROWS; py++) {
      // py 0 = top = high frequency; row 0 = low frequency → bottom.
      const v = cells[ROWS - 1 - py];
      if (v != null && v > floor) {
        let t = (v - floor) * inv;
        if (t > 1) t = 1;
        const [r, g, b] = RASTER_LUT[(t * last) | 0];
        const o = (py * n + px) * 4;
        buf[o] = r;
        buf[o + 1] = g;
        buf[o + 2] = b;
        buf[o + 3] = 255;
      }
    }
  }
  const data = Skia.Data.fromBytes(buf);
  const img = Skia.Image.MakeImage(
    { width: n, height: ROWS, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    data,
    n * 4,
  );
  // Release the SkData WRAPPER now (resource hygiene 2026-09-11). Native
  // fromBytes does SkData::MakeWithCopy and MakeImage does
  // SkImages::RasterFromData, which takes its OWN sk_sp ref on that same
  // SkData — so dispose() here is a refcount decrement, never a free, and the
  // image's pixels stay valid. (On the web build the wrapper's ref is the plain
  // Uint8Array, which has no delete(), so dispose() is a no-op there.)
  data.dispose();
  return img;
}
