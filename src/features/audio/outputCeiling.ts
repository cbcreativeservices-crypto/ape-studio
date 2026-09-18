/**
 * outputCeiling — a hard ceiling on the FILE-PLAYBACK path.
 *
 * Owner 2026-09-17, on the recommendation that the strongest safeguard is not a
 * warning but an inability to produce a dangerous level in the first place.
 *
 * ── WHAT ALREADY EXISTED, AND WHAT DID NOT ───────────────────────────────────
 *
 * The NATIVE signal generator is already capped: it starts at −20 dBFS, refuses
 * to pass −12 dBFS, and reports `capUnlocked` honestly (ape-dsp GenStatus, the
 * "Q4 cap chain"). That is a better protection than the one being asked for,
 * and it was already there.
 *
 * FILE PLAYBACK had none. `LabAudioPlayer` and `earPlayer` hand a URI to
 * expo-audio and play it, and expo-audio defaults `volume` to 1.0 — so a lab
 * asset, an ear-training clip or a mix stem played at whatever level it was
 * mastered at, full scale, with nothing between it and the output. That is the
 * gap this file closes, and it is a real one: a normalised music bed is roughly
 * 20 dB hotter than the generator's default tone, so switching from a tone to a
 * clip could be a sudden, large jump in level with no warning.
 *
 * ── THE NUMBERS, AND WHY ─────────────────────────────────────────────────────
 *
 * DEFAULT_PLAYBACK is −12 dBFS expressed as a linear volume. It matches the
 * generator's CEILING rather than its default, because a normalised file is
 * already dense where a sine is a single tone — matching the generator's −20
 * would leave speech and music noticeably quiet and invite the user to reach
 * for the hardware volume, which is the control this app cannot see and must
 * not encourage anyone to raise.
 *
 * There is NO unlock here. The generator has one because a calibration task
 * genuinely needs a known hotter level; playing a recorded asset never does.
 * If a lab is ever built that needs full scale, add the unlock deliberately,
 * with its own gesture — do not quietly raise this constant.
 */

/** −12 dBFS as a linear amplitude: 10^(−12/20). */
export const PLAYBACK_CEILING_DB = -12;
export const PLAYBACK_CEILING = 10 ** (PLAYBACK_CEILING_DB / 20); // ≈ 0.2512

/**
 * The volume any file player should be set to.
 *
 * Takes an optional per-clip factor (0..1) for a lab that wants something
 * QUIETER — a background bed under a narration, say. It can only ever attenuate:
 * a caller passing 5 gets the ceiling, not five times it.
 */
export function playbackVolume(relative = 1): number {
  const r = Number.isFinite(relative) ? Math.max(0, Math.min(1, relative)) : 1;
  return PLAYBACK_CEILING * r;
}

/**
 * Apply the ceiling to an expo-audio player.
 *
 * Deliberately tolerant: a player that has been released, or a build whose
 * expo-audio does not expose `volume`, must not throw and take the playback
 * down with it. Failing to SET the ceiling is a worse outcome than failing to
 * play, so it is logged rather than swallowed silently.
 */
export function applyCeiling(player: { volume?: number } | null, relative = 1): void {
  if (!player) return;
  try {
    player.volume = playbackVolume(relative);
  } catch (e) {
    console.warn('[outputCeiling] could not set volume:', (e as Error)?.message);
  }
}
