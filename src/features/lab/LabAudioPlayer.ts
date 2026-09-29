/**
 * LabAudioPlayer — streams lab audio assets from their signed URLs (batch-1
 * wiring, 2026-09-15). Companion to labAudio.ts.
 *
 * Model: ONE active clip at a time (a learner taps a fretboard note / a demo
 * signal / a dialogue line). Unlike earPlayer — which encodes synthesized PCM to
 * a local WAV file — a lab asset is already a real file behind a signed URL, so
 * expo-audio streams the URL directly; no encode, no file write.
 *
 * The signed URL expires in 120 s, so it is fetched at PLAY time. A tiny cache
 * reuses a URL only while it is comfortably fresh (< URL_REUSE_MS), so rapid
 * replays of the same clip don't spam the edge fn, but a stale URL is never
 * handed to the player.
 *
 * Playback still sits behind the app-wide audio gate: the SCREEN calls
 * requestAudioOutput() before the first play (see useLabAudio). This module
 * never plays on its own.
 *
 * NOTE: simultaneous multitrack playback (the mixing-lab mixer playing several
 * stems together, sample-synced) is a separate engine to build WHEN that lab
 * exists — this single-active-clip player covers the fretboard / harmonics /
 * demo-signal / critical-listening one-at-a-time case.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { isAudioOutputEnabled } from '../audio/audioOutputStore';
import { unregisterFilePlayer } from '../audio/filePlayers';
import { applyCeiling } from '../audio/outputCeiling';
import { fetchLabAudio, type LabAudioReason } from './labAudio';
import { labProbe } from './labProbe';

/** Reuse a signed URL only while this fresh — well inside the 120 s TTL, with
 *  headroom for buffering. */
const URL_REUSE_MS = 90_000;

/** Longest play() waits for the audio-session mode before playing anyway. */
const AUDIO_MODE_WAIT_MS = 1500;

/** Longest play() waits for the signed URL (bug hunt 2026-09-29): the edge fn
 *  call had no timeout, so a stalled request held the lab's transport on
 *  `loading` for good. Past this the clip reports 'network' — the lab's own
 *  "could not be fetched" line and fallback take over. */
export const LAB_AUDIO_FETCH_MS = 8000;

function keyOf(labKey: string, assetKey: string): string {
  // The separator is written as an ESCAPE, not as a literal NUL (2026-09-17).
  //
  // It used to be a raw 0x00 byte in the source. That single character made the
  // whole file register as BINARY to ripgrep, so it was silently skipped by
  // every content search in the repo — an audit that grepped for player
  // creation sites found two of three and missed this one entirely. The value
  // is identical; the file is now searchable.
  return `${labKey}\u0000${assetKey}`;
}

export class LabAudioPlayer {
  private player: AudioPlayer | null = null;
  private sub: { remove: () => void } | null = null;
  /** The asset_key currently playing, or null. */
  private activeKey: string | null = null;
  /** When the current clip was started — see the finish guard. */
  private startedAt = 0;
  /** TEMP probe: status updates reported for the current clip. */
  private probeSeen = 0;
  private disposed = false;
  private urlCache = new Map<string, { url: string; at: number }>();
  /** Guards against a play() that resolves AFTER a newer play()/stop()/dispose()
   *  — only the latest request may touch the player. */
  private playToken = 0;
  /** Called when a clip finishes on its own, so a ▶/■ UI can drop back to idle.
   *  Optional. */
  onEnded: ((assetKey: string) => void) | null = null;

  /**
   * Fetch (or reuse) the signed URL and play the asset from the start, stopping
   * whatever was playing. Returns the fetch reason: 'ok' on success, else
   * 'auth' | 'not_found' | 'network' (nothing plays), or 'blocked' when the
   * app silenced output while the URL was in flight. Safe to call repeatedly.
   */
  async play(labKey: string, assetKey: string): Promise<LabAudioReason | 'blocked'> {
    if (this.disposed) return 'network';
    const token = ++this.playToken;

    // Play even with the iOS silent switch on — a clip the learner started is
    // content, not a notification. Matches earPlayer.
    //
    // BOUNDED (owner report 2026-09-27, iOS 27 / build 32: "the play button in
    // the bass guitar lab does not work"). The server logs showed the tap never
    // reached the signed-URL fetch below — and this await is the only thing in
    // between. It had no timeout, so an audio-session call that never answers
    // (another engine holding the session) stalled play() for good: no fetch,
    // no sound, and the lab's ▶ held disabled on `loading`. The mode is a
    // nicety for the silent switch; it must never be a reason not to play.
    const modeWon = await Promise.race([
      setAudioModeAsync({ playsInSilentMode: true })
        .then(() => 'mode ok')
        .catch((e: unknown) => `mode ERR ${(e as Error)?.message ?? e}`),
      new Promise<string>((r) => setTimeout(() => r('mode TIMEOUT'), AUDIO_MODE_WAIT_MS)),
    ]);
    labProbe(modeWon); // TEMP probe
    if (this.disposed || token !== this.playToken) return 'network';

    const cacheKey = keyOf(labKey, assetKey);
    let url: string | null = null;
    const cached = this.urlCache.get(cacheKey);
    if (cached && Date.now() - cached.at < URL_REUSE_MS) {
      url = cached.url;
      labProbe('url cached'); // TEMP probe
    } else {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const { asset, reason } = await Promise.race([
        fetchLabAudio(labKey, assetKey),
        new Promise<{ asset: null; reason: LabAudioReason }>((r) => {
          timer = setTimeout(() => r({ asset: null, reason: 'network' }), LAB_AUDIO_FETCH_MS);
        }),
      ]);
      clearTimeout(timer);
      // A newer request (or teardown) landed while we were fetching — abandon
      // this one without touching the player.
      if (this.disposed || token !== this.playToken) return 'network';
      labProbe(`fetch ${reason}${asset ? ` ${asset.ext} ${asset.durationMs}ms ${asset.samplerate}Hz ${asset.channels}ch` : ''}`); // TEMP probe
      if (!asset) return reason;
      url = asset.url;
      this.urlCache.set(cacheKey, { url, at: Date.now() });
    }

    // ⛔ SAFETY (bug hunt 2026-09-29): the gate was passed BEFORE the awaits
    // above. Shake-to-mute, the idle lock or backgrounding can land during
    // them — panicMuteAudio stops the players that exist, not one about to
    // start — so the clip would begin AFTER the learner silenced the app.
    // Ask again at the last moment; off means nothing plays.
    if (!isAudioOutputEnabled()) return 'blocked';

    try {
    if (this.player) {
      this.player.replace({ uri: url });
      labProbe('player replaced'); // TEMP probe
    } else {
      const p = createAudioPlayer({ uri: url });
      labProbe(`player created vol ${Math.round(((p as { volume?: number }).volume ?? -1) * 100) / 100}`); // TEMP probe
      // Hard output ceiling (owner 2026-09-17) — see features/audio/outputCeiling.
      // The native generator has had one all along; file playback had none.
      applyCeiling(p);
      this.player = p;
      try {
        // Compare against the CURRENT clip (`this.activeKey`), never the
        // `assetKey` this closure captured: the listener is created once, on
        // the first play, so it used to recognise only that first clip's end —
        // every later note finished silently and the lab's ■ stayed lit over
        // silence (2026-09-27). The short guard ignores a stale finish from
        // the clip that `replace()` just swapped out.
        this.sub = p.addListener('playbackStatusUpdate', (st: any) => {
          // TEMP probe: the first few status updates of each clip.
          if (this.probeSeen < 4 || st?.didJustFinish || st?.error) {
            this.probeSeen++;
            labProbe(
              `st loaded=${st?.isLoaded} play=${st?.playing} buf=${st?.isBuffering} t=${Math.round((st?.currentTime ?? 0) * 100) / 100}/${Math.round((st?.duration ?? 0) * 100) / 100} vol=${st?.volume ?? '?'} mute=${st?.mute ?? '?'}${st?.didJustFinish ? ' FINISH' : ''}${st?.error ? ` ERR ${st.error}` : ''}${st?.reasonForWaitingToPlay ? ` wait=${st.reasonForWaitingToPlay}` : ''}`,
            );
          }
          if (st?.didJustFinish && this.activeKey != null && Date.now() - this.startedAt > 250) {
            const ended = this.activeKey;
            this.activeKey = null;
            this.onEnded?.(ended);
          }
        });
      } catch {
        // Older expo-audio without the event: didJustFinish simply never fires;
        // callers must not depend on it for correctness.
      }
    }
    this.probeSeen = 0; // TEMP probe
    void this.player.seekTo(0);
    this.player.play();
    labProbe('play() called'); // TEMP probe
    } catch (e) {
      // TEMP probe: a throw here used to escape silently — ▶ did nothing.
      labProbe(`player THREW ${(e as Error)?.message ?? e}`);
      throw e;
    }
    this.activeKey = assetKey;
    this.startedAt = Date.now();
    return 'ok';
  }

  /** Stop playback (any in-flight play() is also cancelled). */
  stop(): void {
    this.playToken++;
    this.player?.pause();
    this.activeKey = null;
  }

  /** The asset_key currently playing, or null. */
  get active(): string | null {
    return this.activeKey;
  }

  /** Terminal — release the native player + listener. */
  dispose(): void {
    this.disposed = true;
    this.playToken++;
    this.sub?.remove();
    this.sub = null;
    // Off the safety registry before the handle dies (2026-09-17).
    unregisterFilePlayer(this.player);
    this.player?.remove();
    this.player = null;
    this.activeKey = null;
    this.urlCache.clear();
  }
}
