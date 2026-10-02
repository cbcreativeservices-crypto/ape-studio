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
import { unregisterFilePlayer } from '../audio/filePlayers';
import { startFenced } from '../audio/startFenced';
import { applyCeiling } from '../audio/outputCeiling';
import { fetchLabAudio, type LabAudioReason } from './labAudio';
import { labProbe } from './labProbe';

/** Reuse a signed URL only while this fresh — well inside the 120 s TTL, with
 *  headroom for buffering. */
export const URL_REUSE_MS = 90_000;

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

/** Most clips kept loaded at once (owner 2026-09-29: "tighten the time between
 *  the change and hearing it"; later the same day: "load in … as many as
 *  possible with still good function … if it isn't too much extra on the
 *  user's memory").
 *
 *  MEMORY BUDGET: a bass clip is ~0.3–0.6 MB of WAV, so 28 loaded players is
 *  ≤ ~17 MB of audio held by the native players — about one photo-heavy
 *  screen's worth — released on close (dispose). Callers plan at most
 *  PRELOAD_MAX of them, leaving headroom so the notes a learner TAPS are
 *  never evicted by the plan itself. */
export const POOL_MAX = 28;
/** Most clips a screen asks to preload at once (see POOL_MAX). */
export const PRELOAD_MAX = 24;
/** Most preloads fetched at once — two, so a tapped note (its own fetch) is
 *  never starved behind a burst. */
const PRELOAD_CONCURRENCY = 2;

type PoolEntry = {
  assetKey: string;
  player: AudioPlayer;
  sub: { remove: () => void } | null;
  /** When the signed URL behind this player was issued. A player older than
   *  URL_REUSE_MS is rebuilt: the stream may re-request byte ranges on a
   *  replay, and an expired URL would fail silently. */
  at: number;
  lastUsed: number;
};

export class LabAudioPlayer {
  /** Loaded players, keyed by keyOf(lab, asset). A pooled note plays at once —
   *  no edge-fn round trip, no stream buffering (owner 2026-09-29). */
  private pool = new Map<string, PoolEntry>();
  /** In-flight loads, so a preload and a tap on the same note share one fetch. */
  private loading = new Map<string, Promise<PoolEntry | LabAudioReason>>();
  private current: PoolEntry | null = null;
  /** The asset_key currently playing, or null. */
  private activeKey: string | null = null;
  /** When the current clip was started — see the finish guard. */
  private startedAt = 0;
  /** TEMP probe: status updates reported for the current clip. */
  private probeSeen = 0;
  private disposed = false;
  private urlCache = new Map<string, { url: string; at: number }>();
  /** The audio-session mode is awaited once (bounded); after that it is re-sent
   *  without waiting — it used to hold every tap for up to 1.5 s. */
  private modeSettled = false;
  /** Guards against a play() that resolves AFTER a newer play()/stop()/dispose()
   *  — only the latest request may touch the player. */
  private playToken = 0;
  /** Called when a clip finishes on its own. Optional. */
  onEnded: ((assetKey: string) => void) | null = null;

  private async settleMode(): Promise<void> {
    // Play even with the iOS silent switch on — a clip the learner started is
    // content, not a notification. BOUNDED (2026-09-27): a session call that
    // never answers must never be a reason not to play.
    const mode = setAudioModeAsync({ playsInSilentMode: true })
      .then(() => 'mode ok')
      .catch((e: unknown) => `mode ERR ${(e as Error)?.message ?? e}`);
    if (this.modeSettled) return;
    const won = await Promise.race([
      mode,
      new Promise<string>((r) => setTimeout(() => r('mode TIMEOUT'), AUDIO_MODE_WAIT_MS)),
    ]);
    labProbe(won); // TEMP probe
    this.modeSettled = true;
  }

  private async signedUrl(labKey: string, assetKey: string): Promise<{ url: string; at: number } | LabAudioReason> {
    const cacheKey = keyOf(labKey, assetKey);
    const cached = this.urlCache.get(cacheKey);
    if (cached && Date.now() - cached.at < URL_REUSE_MS) return cached;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { asset, reason } = await Promise.race([
      fetchLabAudio(labKey, assetKey),
      new Promise<{ asset: null; reason: LabAudioReason }>((r) => {
        timer = setTimeout(() => r({ asset: null, reason: 'network' }), LAB_AUDIO_FETCH_MS);
      }),
    ]);
    clearTimeout(timer);
    if (!asset) return reason;
    const hit = { url: asset.url, at: Date.now() };
    this.urlCache.set(cacheKey, hit);
    return hit;
  }

  private release(k: string, e: PoolEntry): void {
    if (this.pool.get(k) === e) this.pool.delete(k);
    e.sub?.remove();
    // Off the safety registry before the handle dies (2026-09-17).
    unregisterFilePlayer(e.player);
    try {
      e.player.remove();
    } catch {
      // already gone
    }
    if (this.current === e) this.current = null;
  }

  private isPooled(e: PoolEntry): boolean {
    for (const v of this.pool.values()) if (v === e) return true;
    return false;
  }

  /** A loaded player for this note — pooled if fresh, else fetched + created. */
  private load(labKey: string, assetKey: string): Promise<PoolEntry | LabAudioReason> {
    const k = keyOf(labKey, assetKey);
    const have = this.pool.get(k);
    if (have && Date.now() - have.at < URL_REUSE_MS) return Promise.resolve(have);
    const inflight = this.loading.get(k);
    if (inflight) return inflight;
    const job = (async (): Promise<PoolEntry | LabAudioReason> => {
      const u = await this.signedUrl(labKey, assetKey);
      if (typeof u === 'string') return u;
      if (this.disposed) return 'network';
      const player = createAudioPlayer({ uri: u.url });
      // Hard output ceiling (owner 2026-09-17) — see features/audio/outputCeiling.
      applyCeiling(player);
      const entry: PoolEntry = { assetKey, player, sub: null, at: u.at, lastUsed: Date.now() };
      try {
        entry.sub = player.addListener('playbackStatusUpdate', (st: any) => {
          if (this.current !== entry) return;
          // TEMP probe: the first few status updates of each clip.
          if (this.probeSeen < 4 || st?.didJustFinish || st?.error) {
            this.probeSeen++;
            labProbe(
              `st loaded=${st?.isLoaded} play=${st?.playing} buf=${st?.isBuffering} t=${Math.round((st?.currentTime ?? 0) * 100) / 100}/${Math.round((st?.duration ?? 0) * 100) / 100}${st?.didJustFinish ? ' FINISH' : ''}${st?.error ? ` ERR ${st.error}` : ''}`,
            );
          }
          if (st?.didJustFinish && this.activeKey != null && Date.now() - this.startedAt > 250) {
            const ended = this.activeKey;
            this.activeKey = null;
            this.onEnded?.(ended);
          }
        });
      } catch {
        // Older expo-audio without the event: didJustFinish never fires.
      }
      const old = this.pool.get(k);
      if (old && old !== this.current) this.release(k, old);
      this.pool.set(k, entry);
      this.evict();
      return entry;
    })();
    this.loading.set(k, job);
    void job.finally(() => this.loading.delete(k));
    return job;
  }

  /** Keep the pool at POOL_MAX — least-recently-used first, never the one playing. */
  private evict(): void {
    while (this.pool.size > POOL_MAX) {
      let oldestK: string | null = null;
      let oldest = Infinity;
      for (const [k, e] of this.pool) {
        if (e === this.current) continue;
        if (e.lastUsed < oldest) {
          oldest = e.lastUsed;
          oldestK = k;
        }
      }
      if (oldestK == null) return;
      this.release(oldestK, this.pool.get(oldestK)!);
    }
  }

  /**
   * Load these notes in the background so a later play() starts at once
   * (owner 2026-09-29). Silent: nothing plays. Safe to call on every change.
   */
  preload(labKey: string, assetKeys: readonly string[]): void {
    if (this.disposed) return;
    const now = Date.now();
    const todo = assetKeys.filter((a) => {
      const k = keyOf(labKey, a);
      const e = this.pool.get(k);
      const fresh = !!e && now - e.at < URL_REUSE_MS;
      // Still wanted: count it as used now, so the eviction keeps the notes
      // the NEW plan wants over the ones only an old plan did.
      if (fresh) e!.lastUsed = now;
      return !fresh && !this.loading.has(k);
    });
    let i = 0;
    // A refused signed URL (a guest / preview without access) refuses the
    // rest of the batch too — stop instead of spending a call per note.
    let refused = false;
    const next = (): void => {
      if (this.disposed || refused || i >= todo.length) return;
      const a = todo[i++];
      void this.load(labKey, a)
        .then((r) => {
          if (r === 'auth') refused = true;
        })
        .finally(next);
    };
    for (let n = 0; n < PRELOAD_CONCURRENCY; n++) next();
  }

  /**
   * Play the asset from the start, stopping whatever was playing. Returns 'ok',
   * else 'auth' | 'not_found' | 'network' (nothing plays), or 'blocked' when
   * the app silenced output meanwhile. Safe to call repeatedly.
   */
  async play(labKey: string, assetKey: string): Promise<LabAudioReason | 'blocked'> {
    if (this.disposed) return 'network';
    const token = ++this.playToken;
    const pooled = this.pool.has(keyOf(labKey, assetKey));
    // ⛔ SAFETY — the fence (startFenced): the gate was passed BEFORE the
    // awaits below. Shake-to-mute, the idle lock, backgrounding, a newer
    // play()/stop()/dispose(), or leaving the app with "Mute audio when I
    // leave the app" OFF (every sound stops but the gate stays ON — only the
    // sound-stop epoch shows it) can land during them; a clip whose fetch was
    // still running must not start behind the learner (2026-09-29, 10-01).
    const fenced = await startFenced({
      start: async () => {
        await this.settleMode();
        if (this.disposed || token !== this.playToken) return null;
        return this.load(labKey, assetKey);
      },
      // Loaded, not sounding: nothing to silence — the pooled player waits
      // for the next tap, and a newer play() owns the transport.
      stop: () => {},
      isCurrent: () => !this.disposed && token === this.playToken,
    });
    if (fenced.status !== 'started') return fenced.why === 'superseded' ? 'network' : 'blocked';
    const got = fenced.value;
    if (got === null) return 'network';
    if (typeof got === 'string') {
      labProbe(`fetch ${got}`); // TEMP probe
      return got;
    }
    labProbe(pooled ? 'clip ready (preloaded)' : 'clip loaded'); // TEMP probe

    try {
      if (this.current && this.current !== got) {
        const prev = this.current;
        prev.player.pause();
        // A player the pool already replaced (its URL went stale while it was
        // current) belongs to nobody once it stops being current: release it,
        // or it stays loaded until the process dies (evening pass 1, 2026-10-02).
        if (!this.isPooled(prev)) this.release('', prev);
      }
      this.current = got;
      got.lastUsed = Date.now();
      this.probeSeen = 0; // TEMP probe
      void got.player.seekTo(0);
      got.player.play();
      labProbe('play() called'); // TEMP probe
    } catch (e) {
      labProbe(`player THREW ${(e as Error)?.message ?? e}`); // TEMP probe
      throw e;
    }
    this.activeKey = assetKey;
    this.startedAt = Date.now();
    return 'ok';
  }

  /** Stop playback (any in-flight play() is also cancelled). */
  stop(): void {
    this.playToken++;
    this.current?.player.pause();
    this.activeKey = null;
  }

  /** The asset_key currently playing, or null. */
  get active(): string | null {
    return this.activeKey;
  }

  /** Terminal — release every native player + listener. */
  dispose(): void {
    this.disposed = true;
    this.playToken++;
    for (const [k, e] of [...this.pool]) this.release(k, e);
    // The playing player is not pooled when a refresh replaced it meanwhile.
    if (this.current) this.release('', this.current);
    this.current = null;
    this.activeKey = null;
    this.urlCache.clear();
  }
}
