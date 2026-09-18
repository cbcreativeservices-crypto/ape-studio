/**
 * filePlayers — the register of every LIVE expo-audio player, so the app's
 * safety controls can actually reach them.
 *
 * ── THE HOLE THIS FILLS ──────────────────────────────────────────────────────
 *
 * Found 2026-09-17 by a bug-hunting pass over the audio system. The app had two
 * ways to silence itself and NEITHER could stop a playing file:
 *
 *   • `panicMuteAudio()` — the shake-to-mute gesture — stopped the native
 *     generator, the binaural bus, the modular voice and text-to-speech. It had
 *     no handle on any expo-audio player, so an ear-training clip, a tuning
 *     reference or a mixing stem played on to its end while the user shook the
 *     phone. The Sound Safety Warning shipped hours earlier PROMISES IN WRITING
 *     that shaking mutes instantly — a promise the code did not keep, which is
 *     worse than not making it.
 *
 *   • `disableAudioOutput()` — the auto-mute on login, on foreground-after-idle
 *     and on relaunch — only flipped a boolean. Worse, two of its subscribers
 *     stop PROTECTING when it fires: ShakeToMute tears down the accelerometer
 *     and exposureMonitor disarms its dose poller. So an auto-mute during file
 *     playback left audio running with the warning border gone, the dose no
 *     longer counted, and the panic gesture dead.
 *
 * ── WHY A REGISTRY RATHER THAN A SINGLETON PLAYER ───────────────────────────
 *
 * Because there are four independent player owners (earPlayer's per-variant
 * map, LabAudioPlayer's single active clip, the S12 AudioPlayer component, and
 * the mixing lab), each with its own lifecycle, and none of them should have to
 * know about the others. They register what they create and unregister what
 * they release; the safety path iterates whatever is currently live.
 *
 * DEPENDENCY-FREE ON PURPOSE. This module imports nothing from the audio store
 * or the gate, so `audioOutputStore` can call into it without a cycle.
 */

/** The slice of an expo-audio player this module needs. Structural, so a mock
 *  or a future player type satisfies it without a cast. */
export type StoppablePlayer = {
  pause?: () => void;
  remove?: () => void;
  playing?: boolean;
  volume?: number;
};

const live = new Set<StoppablePlayer>();

/** Call immediately after creating a player. Idempotent. */
export function registerFilePlayer(p: StoppablePlayer | null | undefined): void {
  if (p) live.add(p);
}

/** Call when releasing a player, so a dead handle is never pausing. */
export function unregisterFilePlayer(p: StoppablePlayer | null | undefined): void {
  if (p) live.delete(p);
}

/**
 * Pause every live file player, right now.
 *
 * Returns how many it stopped, which the caller may log — a silencing path that
 * reports zero when the user can hear something is the symptom this file
 * exists to make visible.
 *
 * Every call is individually guarded: a player released between registration
 * and here will throw, and one dead handle must never prevent the rest from
 * being silenced. That is the whole job.
 */
export function stopAllFilePlayers(): number {
  let stopped = 0;
  for (const p of [...live]) {
    try {
      // Drop the level as well as pausing. If a platform ignores a pause on a
      // player mid-buffer, a zero volume still means silence.
      if (typeof p.volume === 'number') p.volume = 0;
      p.pause?.();
      stopped += 1;
    } catch {
      // Released underneath us — forget it rather than keep trying forever.
      live.delete(p);
    }
  }
  return stopped;
}

/** How many players are currently registered. For tests and diagnostics. */
export function liveFilePlayerCount(): number {
  return live.size;
}

/** Test seam. Not called by the app. */
export function __resetFilePlayersForTests(): void {
  live.clear();
}
