/**
 * aLoopShapes — the REAL shape of each ambience loop, for the beds strip's
 * loop line (page 10). Owner's rule: never stylized audio. Each table is the
 * loop's own samples (sounds/gaSynth, through gaSoundBank), read as a sound
 * editor draws an overview: the largest sample magnitude in each quarter
 * second, both channels, in hundredths of full scale.
 *
 * They are written out here, not computed on the phone, because building a
 * ten-second loop only to draw forty bars would cost the learner a pause.
 * test/gameAudioHudA.test.ts builds the three loops and fails if a table
 * stops matching the sound.
 *
 * What the tables show is the page's point: the prepared wind ends where it
 * begins (9 … 9), so its join is smooth; the raw cut begins in a lull and
 * ends in a gust (4 … 45), so the level jumps at the join on every pass.
 *
 * Pure data.
 */

/** Columns per second of loop. */
export const A_SHAPE_PER_S = 4;

export const A_LOOP_SHAPES: Readonly<Record<string, readonly number[]>> = {
  amb_yard: [9, 10, 9, 12, 13, 19, 28, 31, 39, 35, 40, 42, 45, 40, 30, 32, 19, 13, 11, 10, 8, 9, 7, 11, 10, 14, 17, 23, 25, 23, 19, 20, 13, 12, 8, 9, 8, 7, 9, 9],
  amb_yard_raw: [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 10, 9, 10, 12, 11, 12, 14, 15, 14, 17, 14, 21, 18, 20, 23, 25, 28, 27, 29, 37, 32, 37, 36, 42, 37, 40, 42, 45],
  amb_room: [33, 33, 33, 40, 26, 31, 34, 35, 31, 32, 29, 30, 36, 31, 39, 32, 32, 29, 30, 31, 30, 35, 32, 31, 30, 30, 35, 29, 37, 30, 31, 31],
};

/** The overview of a sound, straight from its samples (the test's side of
 *  the pin; the same arithmetic that wrote the tables). */
export function aShapeOf(sound: { sr: number; ch: readonly Float32Array[] }): number[] {
  const n = sound.ch[0]?.length ?? 0;
  const cols = Math.round((n / sound.sr) * A_SHAPE_PER_S);
  const out: number[] = [];
  for (let c = 0; c < cols; c++) {
    const a = Math.floor((c * n) / cols);
    const b = Math.floor(((c + 1) * n) / cols);
    let pk = 0;
    for (const ch of sound.ch) {
      for (let i = a; i < b; i++) {
        const v = Math.abs(ch[i]);
        if (v > pk) pk = v;
      }
    }
    out.push(Math.round(pk * 100));
  }
  return out;
}

/** The step in level at the join: the last column against the first, in
 *  hundredths of full scale (0 = the loop ends where it begins). */
export function aJoinStep(shape: readonly number[]): number {
  return shape.length ? shape[shape.length - 1] - shape[0] : 0;
}
