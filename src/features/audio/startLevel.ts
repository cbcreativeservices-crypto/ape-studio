/**
 * Where a level fader SITS when a sound lab is first opened.
 *
 * ── WHY (owner 2026-09-19) ──────────────────────────────────────────────────
 *
 * "In all labs that turn on sound, the volume setting/fader auto starts at 30%
 * always when the user first opens that particular lab screen. That way volume
 * never starts loud. It can start off as needed."
 *
 * A lab may still start SILENT — several do, and the audio-output gate means
 * nothing sounds until the learner allows it. This is about where the fader is
 * WAITING, so that allowing sound is never an ambush.
 *
 * ── WHY A CONSTANT AND NOT A CLAMP ─────────────────────────────────────────
 *
 * It would be less code to clamp the level inside the tone helper every lab
 * funnels through. That is the wrong place: it would cap the SOUND without
 * moving the FADER, so a lane would read 70% while playing at 30% and the
 * bezel readouts (`Math.round(amplitude * 100)`) would be lying. This app's
 * standard is that a control shows what is true. So the default moves, and
 * the fader moves with it.
 *
 * ── WHAT THIS IS NOT FOR ───────────────────────────────────────────────────
 *
 * Not every level in the app is a volume:
 *   · Liquid Studio's SHAKE is an ACCELERATION in g, and the Faraday
 *     threshold is the lesson — 30% of that lane sits below threshold and the
 *     dish would look broken.
 *   · The Signal Generator's -20 dBFS default IS the engine's own
 *     `defaultLevelDb` and is already 10% of full scale; it only looks high
 *     because the fader spans -60..0 dB.
 *   · Mixing faders start at unity because unity is the lesson.
 * Those three are deliberately untouched. Before applying this to a new
 * control, ask whether the number means loudness.
 *
 * Output is separately bounded by `outputCeiling.ts` (-12 dBFS); this is the
 * starting position, not the safety limit.
 */

/** The fader position, 0..1, a sound lab opens at. */
export const START_LEVEL_01 = 0.3;

/**
 * The same starting position expressed in dB, for the labs whose faders are
 * calibrated in dB rather than 0..1.
 */
export function startLevelDb(minDb: number, maxDb: number): number {
  return minDb + START_LEVEL_01 * (maxDb - minDb);
}
