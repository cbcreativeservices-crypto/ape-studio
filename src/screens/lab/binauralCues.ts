/**
 * binauralCues — the Binaural Panner's cue words, pure so tests load them
 * (beginner waves 1-3, owner 2026-11-15: "build waves 1 thru 3", D62 adoption
 * plan, items BIN-01, BIN-03, BIN-04, BIN-05). The numbers (ITD in µs, the
 * far-ear level drop in dB) come from the screen's own model mirrors
 * (BinauralLabScreen itdUs / ildDb), passed in, so this file holds words and
 * geometry only, never a second copy of the head model.
 */

/** An angle wrapped to −179…+180 whole degrees (0 = front, +90 = right). */
function wrapAz(azDeg: number): number {
  let a = Math.round(azDeg);
  while (a > 180) a -= 360;
  while (a <= -180) a += 360;
  return a;
}

/** The side the object is on, so the NEAR ear; null on the front–back line. */
export function nearSide(azDeg: number): 'LEFT' | 'RIGHT' | null {
  const a = wrapAz(azDeg);
  if (a > 0 && a < 180) return 'RIGHT';
  if (a < 0) return 'LEFT';
  return null;
}

/** BIN-01: the far ear the stage dims ("late"), as the head's L / R mark. */
export function farEarMark(azDeg: number): 'L' | 'R' | null {
  const s = nearSide(azDeg);
  return s === 'RIGHT' ? 'L' : s === 'LEFT' ? 'R' : null;
}

/** BIN-04: THE TWO CUES in words, naming the side and the far ear. */
export function twoCuesLine(objectNo: number, azDeg: number, itdUs: number, ildDb: number): string {
  const side = nearSide(azDeg);
  if (!side) {
    const where = wrapAz(azDeg) === 0 ? 'straight ahead' : 'straight behind';
    return `Object ${objectNo} is ${where}: both ears hear it at the same moment and level, so neither cue points left or right.`;
  }
  const far = side === 'RIGHT' ? 'LEFT' : 'RIGHT';
  return `Object ${objectNo} is on your ${side}, so your ${far} ear hears it ${itdUs.toFixed(0)} µs later, ${ildDb.toFixed(1)} dB quieter and a little darker (the head shadow). Those are the two cues your brain uses to place a sound.`;
}

/** BIN-03: within 20° of the front–back line (the AZ readout's own "front"
 *  and "behind" words reach 25°), front and behind give almost the same cues. */
export function nearFrontBackLine(azDeg: number): boolean {
  const a = Math.abs(wrapAz(azDeg));
  return a <= 20 || a >= 160;
}

export const FRONT_BACK_LINE =
  'Front and behind give almost the same cues here, which is why your brain mixes them up. Telling them apart needs the outer ear (HRTF), which this simple model leaves out.';

/** BIN-05: each object's ring radius on the stage (logical units). An object
 *  drawn on (or almost on) an earlier one gets a wider ring, so stacked
 *  objects show as concentric rings and none ever disappears. */
export function stageRingRadii(points: readonly { x: number; y: number }[], selected: number, touch = 8): number[] {
  return points.map((p, i) => {
    const base = i === selected ? 12 : 10;
    const under = points.slice(0, i).filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < touch).length;
    return base + under * 5;
  });
}
