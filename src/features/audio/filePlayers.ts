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
  /** expo-audio: true while the player is muted (no output). */
  muted?: boolean;
  /** expo-audio: false while the source has not loaded (or failed to). */
  isLoaded?: boolean;
  /** expo-audio: true while it is waiting for data (no output yet). */
  isBuffering?: boolean;
};

const live = new Set<StoppablePlayer>();

// ── Clip playback counts toward listening exposure (owner 2026-10-04:
//    "clips count if output is happening") ─────────────────────────────────────
//
// Every recorded/rendered clip in the app plays through a player in this
// register (applyCeiling adopts each one), so this is the ONE choke point the
// exposure monitor reads. A clip's level uses the SAME scale as the native
// generator's `effectiveLevelDb` — the peak of a sine in dBFS — so a clip and a
// tone carrying the same energy read the same estimate. A sine's RMS sits
// 3.01 dB below its peak, so a clip's measured RMS is lifted by that much.

/** RMS dBFS → the generator's sine-peak scale (20·log10(√2)). */
export const SINE_PEAK_OVER_RMS_DB = 20 * Math.log10(Math.SQRT2);

/**
 * The level assumed for a clip whose samples the app never sees (a lab asset
 * streamed from its URL, a Scenarios recording) — on the generator's
 * sine-peak scale, BEFORE the player's volume.
 *
 * −3 dBFS here is an RMS of about −6 dBFS: the loudest master the recording
 * brief asks for (≈ −6 LUFS, peaks near 0 dBFS). Its matched teaching sets sit
 * at −20 LUFS, so a typical unmeasured clip is OVER-estimated by about 14 dB,
 * never under — the safe direction for a hearing-dose figure. A clip whose
 * decoded samples the app does hold is measured instead (setFilePlayerLevel),
 * never assumed.
 */
export const ASSUMED_CLIP_LEVEL_DBFS = -3;

/** Measured content level per player (sine-peak scale, before volume). */
const levels = new WeakMap<StoppablePlayer, number>();

/**
 * Record the MEASURED level of what this player holds (from
 * `measuredClipLevelDb`). −Infinity = measured silence. Call again whenever
 * the player's source is replaced; `null` forgets it (back to the assumption).
 */
export function setFilePlayerLevel(p: StoppablePlayer | null | undefined, dbfs: number | null): void {
  if (!p) return;
  if (dbfs == null || Number.isNaN(dbfs)) levels.delete(p);
  else levels.set(p, dbfs);
}

/**
 * The measured level of decoded audio: its RMS over every channel, on the
 * generator's sine-peak scale. −Infinity for silence or no samples.
 */
export function measuredClipLevelDb(channels: readonly Float32Array[]): number {
  let s = 0;
  let n = 0;
  for (const c of channels) {
    for (let i = 0; i < c.length; i++) s += c[i] * c[i];
    n += c.length;
  }
  const rms = n ? Math.sqrt(s / n) : 0;
  return rms > 0 ? 20 * Math.log10(rms) + SINE_PEAK_OVER_RMS_DB : -Infinity;
}

/**
 * The loudest clip AUDIBLY playing right now, in dBFS on the generator's
 * scale — its content level plus the player's volume — or −Infinity when no
 * clip is sounding. Stopped, paused, muted, zero-volume, not-loaded (or failed)
 * and buffering players are silent: only output that is happening counts.
 * Guarded per player — a released handle reads as silent.
 */
export function soundingFilePlayerDbfs(): number {
  let loudest = -Infinity;
  for (const p of live) {
    try {
      if (p.playing !== true || p.muted === true || p.isLoaded === false || p.isBuffering === true) continue;
      const vol = typeof p.volume === 'number' && Number.isFinite(p.volume) ? p.volume : 1;
      if (vol <= 0) continue;
      const content = levels.has(p) ? (levels.get(p) as number) : ASSUMED_CLIP_LEVEL_DBFS;
      const db = content + 20 * Math.log10(vol);
      if (db > loudest) loudest = db;
    } catch {
      /* released underneath us */
    }
  }
  return loudest;
}

/** Call immediately after creating a player. Idempotent. */
export function registerFilePlayer(p: StoppablePlayer | null | undefined): void {
  if (p) live.add(p);
}

/** Call when releasing a player, so a dead handle is never pausing. */
export function unregisterFilePlayer(p: StoppablePlayer | null | undefined): void {
  if (p) {
    live.delete(p);
    levels.delete(p);
  }
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
      // PAUSE ONLY — do NOT zero the volume (corrected 2026-09-17).
      //
      // This used to also set `volume = 0` as belt and braces, on the theory
      // that a platform might ignore a pause mid-buffer. Nothing ever set it
      // back: `applyCeiling` runs on the CREATE branch of all three player
      // owners, and expo-audio's `volume` survives `replace()`, so a player
      // reused for the next clip stayed silent. The result was that using the
      // emergency mute — or simply leaving the app idle for twenty minutes —
      // permanently broke playback until the learner left the screen and came
      // back, with the transport still showing the progress bar moving.
      //
      // A speculative guard that certainly breaks playback is worse than the
      // rare platform quirk it was guarding against. `pause()` is the contract
      // expo-audio actually gives us, so that is what this asks for.
      p.pause?.();
      stopped += 1;
    } catch {
      // Released underneath us — forget it rather than keep trying forever.
      live.delete(p);
    }
  }
  return stopped;
}

/**
 * True while any registered player reports it is playing. Read by the idle
 * auto-mute (audioOutputStore): a clip that is sounding is the learner USING
 * audio, so it counts as activity (owner 2026-09-30). Guarded per player — a
 * released handle reads as not playing.
 */
export function anyFilePlayerPlaying(): boolean {
  for (const p of live) {
    try {
      if (p.playing === true) return true;
    } catch {
      /* released underneath us */
    }
  }
  return false;
}

/** How many players are currently registered. For tests and diagnostics. */
export function liveFilePlayerCount(): number {
  return live.size;
}

/** Test seam. Not called by the app. */
export function __resetFilePlayersForTests(): void {
  for (const p of live) levels.delete(p);
  live.clear();
}
