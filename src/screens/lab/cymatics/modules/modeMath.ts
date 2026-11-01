/**
 * Pure maths behind two Cymatics module displays (no React, so the tests run
 * the very functions the screens use).
 *
 *  • nodesModeLists — module 2 (Nodes, Antinodes & Modes). ONE mode list feeds
 *    the JUMP TO A MODE tray, the resonance read, the drawn field and the FREQ
 *    warp (D41 #21: the tray came from 24 computed modes while the rest used
 *    14, so on the square plate tray entries 5–7 — 1.03 kHz (4,4), 1.73 kHz
 *    and 1.82 kHz — read BETWEEN, 0 %, MODE and LINES a dash).
 *  • responseBands — module 1's RESPONSE vs FREQUENCY strip (D41 #22/#23).
 */
import { modeResponse, plateModes, type PlateMode, type PlateSpec } from '../../../../features/cymatics/plateModes';

/** How many computed modes module 2 reads. 24 holds the square plate's seven
 *  lowest excitable modes (centre-driven, so odd orders sleep) and every disc
 *  mode; the field then sums 7 driven modes on the square (it was 4), still
 *  fewer than the disc's 15. */
export const NODES_MODE_COUNT = 24;
/** The tray lists at most this many modes. */
export const NODES_TRAY_MAX = 8;

/** Module 2's one shared list (`all`) and the tray drawn from it (`tray`). */
export function nodesModeLists(spec: PlateSpec): { all: PlateMode[]; tray: PlateMode[] } {
  const all = plateModes(spec, NODES_MODE_COUNT);
  return { all, tray: all.filter((m) => m.drive > 0.05).slice(0, NODES_TRAY_MAX) };
}

/** Each bar's height: the PEAK normalised response over its own log band.
 *  A mode's response only rises toward its peak and falls away from it, so the
 *  band maximum is at the point of the band nearest the mode's hertz — the
 *  mode itself when it falls inside (a full bar). Sampling one frequency per
 *  bar missed every resonance: at Q ≈ 566 a peak is ~0.18 % wide and the bars
 *  ~9 % apart, so the tallest bar read 0.04 and the strip was flat. Cost:
 *  bars × modes evaluations, as before. */
export function responseBands(modes: PlateMode[], Q: number, fMin: number, fMax: number, bars = 40): number[] {
  const out: number[] = [];
  const step = Math.pow(fMax / fMin, 1 / bars);
  for (let i = 0; i < bars; i++) {
    const lo = fMin * Math.pow(step, i);
    const hi = lo * step;
    let best = 0;
    for (const m of modes) {
      const f = Math.min(hi, Math.max(lo, m.hz));
      best = Math.max(best, (modeResponse(f, m.hz, Q) * m.drive) / (Q * Math.max(m.drive, 1e-6)));
    }
    out.push(Math.min(1, best));
  }
  return out;
}
