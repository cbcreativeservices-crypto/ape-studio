/**
 * tuningAudio — the Tuning & Temperament Lab's player (spec Stage 1 §10,
 * Stage 5 §1). Wraps the existing offline → WAV → expo-audio pipeline
 * (EarClipPlayer) behind the app-wide audio gate; one voice slot, so rapid
 * play/stop can never stack sources; stops on unmount and when the app
 * leaves the foreground. Renderers live in tuningRender.ts (pure, tested).
 *
 * SAVED CLIPS (owner 2026-09-29): each rendered clip is kept (tuningClipCache)
 * with its WAV file and a loaded player (the pool below), so a repeat tap plays
 * at once; preload() pre-renders a chapter's clips in the background.
 */
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import type { Mono } from '../ear/earDsp';
import { EarClipPlayer } from '../ear/earPlayer';
import { isAudioOutputEnabled } from '../audio/audioOutputStore';
import { ByteLru } from '../audio/clipLru';
import { startFenced } from '../audio/startFenced';
import { AUDIO_UNAVAILABLE_MESSAGE } from '../../../modules/ape-dsp';
import { clipSeconds } from './tuningRender';
import { clipKeyOf, wavBytes } from './tuningClipCache';

export * from './tuningRender';
// The chapters' renderers, MEMOISED (owner 2026-09-29 "save each clip"): an
// explicit export wins over the `export *` above, so every chapter that
// imports renderNotes & co. from here gets the cached versions unchanged.
export { renderNotes, renderPartials, renderSequence, concatWithGap } from './tuningClipCache';

/**
 * Loaded-player budget (owner 2026-09-29, "if it isn't too much extra on the
 * user's memory"): at most PLAYER_POOL_MAX clips kept as a written WAV file
 * plus a loaded expo-audio player, and at most PLAYER_POOL_BYTES of WAV on
 * disk (a 1.4 s two-note clip is 134 KB, a 2.2 s chord 211 KB). Least
 * recently used released first — file deleted, player removed — never the
 * clip that is playing or about to play. All released on close (dispose).
 */
export const PLAYER_POOL_MAX = 12;
export const PLAYER_POOL_BYTES = 3 * 1024 * 1024;
/** Chapter-open pre-render waits this long first, so it never competes with
 *  the chapter's first paint, and breathes this long between clips. */
const PRELOAD_FIRST_MS = 400;
const PRELOAD_BREATH_MS = 60;
const PRELOAD_QUEUE_MAX = 24;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ── player ─────────────────────────────────────────────────────────────── */

export type PlayerStatus = {
  playing: boolean;
  label: string | null;
  /** ADDITIVE (2026-09-11): the clip currently being SYNTHESISED, if any.
   *  Optional so the existing `{ playing, label }` literals still typecheck. */
  rendering?: string | null;
  /** ADDITIVE (K8, hunt 11 2026-10-04): the learner's play could not sound —
   *  its clip failed to load (a WAV write refused: disk full, cache cleared).
   *  It used to clear to "stopped" with no word. The shared
   *  AUDIO_UNAVAILABLE_MESSAGE; cleared by the next play. */
  error?: string | null;
};

export class TuningPlayer {
  private ear = new EarClipPlayer();
  private status: PlayerStatus = { playing: false, label: null, rendering: null };
  private busy = false;
  private listeners = new Set<(s: PlayerStatus) => void>();
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private appSub: NativeEventSubscription | null;
  private token = 0;
  /** Saved clips (owner 2026-09-29): one loaded EarClipPlayer per cached
   *  clip, keyed by clipKeyOf. See PLAYER_POOL_MAX / PLAYER_POOL_BYTES. */
  private pool = new ByteLru<EarClipPlayer>(
    PLAYER_POOL_BYTES,
    PLAYER_POOL_MAX,
    (_k, p) => p.dispose(),
    (k, p) => p === this.voice || k === this.wantKey,
  );
  /** In-flight loads, so a pre-render and a tap on the same clip share one. */
  private loadingClips = new Map<string, Promise<EarClipPlayer | null>>();
  /** The player sounding now (a pooled one, or `ear` for an uncached clip). */
  private voice: EarClipPlayer | null = null;
  /** The clip a play() is loading — pinned so a pre-render cannot evict it. */
  private wantKey: string | null = null;
  private preloadToken = 0;
  private preloadQueue: (() => Mono)[] = [];
  private preloading = false;
  private disposed = false;

  constructor(private requestOutput: () => Promise<boolean>) {
    this.appSub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s !== 'active') this.stop();
    });
  }

  subscribe(fn: (s: PlayerStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this.status);
    return () => this.listeners.delete(fn);
  }

  private set(s: PlayerStatus) {
    this.status = s;
    this.listeners.forEach((l) => l(s));
  }

  /** A loaded player for a cached clip — pooled, in flight, or loaded now.
   *  null when the player was disposed meanwhile. Never plays. */
  private loadClip(key: string, buf: Mono): Promise<EarClipPlayer | null> {
    const have = this.pool.get(key);
    if (have) return Promise.resolve(have);
    const inflight = this.loadingClips.get(key);
    if (inflight) return inflight;
    const job = (async (): Promise<EarClipPlayer | null> => {
      const p = new EarClipPlayer();
      try {
        await p.load([buf]);
      } catch (e) {
        p.dispose(); // never pooled — nothing else would release it
        throw e;
      }
      if (this.disposed) {
        p.dispose();
        return null;
      }
      this.pool.set(key, p, wavBytes(buf));
      return p;
    })();
    this.loadingClips.set(key, job);
    // .finally() hands back a NEW promise carrying the job's rejection; left
    // bare, a failed load was an unhandled rejection even though play() and
    // preload() both handle the job itself (night pass 2, 2026-10-01).
    job.finally(() => this.loadingClips.delete(key)).catch(() => {});
    return job;
  }

  /** Play one rendered clip; any previous clip stops first. Never autoplays. */
  async play(buf: Mono, label: string): Promise<void> {
    const my = ++this.token;
    if (!(await this.requestOutput())) return;
    if (my !== this.token) return; // a newer request superseded us while the gate was open
    this.voice?.stop();
    this.ear.stop();
    if (this.stopTimer) clearTimeout(this.stopTimer);
    // A saved clip (owner 2026-09-29) plays from its already-loaded player —
    // no WAV encode, no file write, no load. An uncached clip takes the old
    // one-slot path.
    const key = clipKeyOf(buf) ?? null;
    // ⛔ SAFETY — the fence (startFenced): the gate answered before the WAV
    // encode/load; shake-to-mute, the idle lock, backgrounding, a stop-all or
    // a newer request may land inside it. Never start a clip into a closed
    // gate (bug hunt 2026-09-29).
    const fenced = await startFenced({
      start: async (): Promise<EarClipPlayer | null> => {
        if (!key) {
          await this.ear.load([buf]);
          return this.ear;
        }
        this.wantKey = key;
        try {
          return await this.loadClip(key, buf);
        } finally {
          if (this.wantKey === key) this.wantKey = null; // unpinned on a failed load too
        }
      },
      stop: () => {}, // loaded, not sounding: nothing to silence
      isCurrent: () => my === this.token,
    });
    if (fenced.status !== 'started' || !fenced.value) return;
    const voice = fenced.value;
    this.voice = voice;
    voice.play(0);
    this.set({ playing: true, label, rendering: null });
    this.stopTimer = setTimeout(() => {
      if (my === this.token) this.set({ playing: false, label: null, rendering: null });
    }, clipSeconds(buf) * 1000 + 80);
  }

  /**
   * Render-then-play. The chapters' renderers are SYNCHRONOUS DSP bursts —
   * a 1.4 s two-note clip measures ~14 ms in Node, a 2.2 s triad ~30 ms and a
   * seven-voice chord ~74 ms, several times that on a phone's JS thread.
   * Calling `make()` inline as an argument (`play(renderNotes(…), label)`)
   * ran the synthesis in the SAME tick as the tap, so nothing — not even the
   * button's own pressed state — could paint until it finished. That is the
   * class that froze the mixing lab's null test on device (2026-09-11).
   *
   * Yield one macrotask so the tap and the RENDERING line paint, THEN
   * synthesise. `busy` keeps a double-tap from stacking two bursts, and the
   * token check lets STOP win a race against a burst already in flight.
   * The buffer `make()` returns is byte-identical to the old inline call.
   */
  async renderAndPlay(make: () => Mono, label: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    const my = this.token;
    this.set({ playing: false, label: null, rendering: label });
    try {
      await new Promise<void>((r) => setTimeout(r, 0));
      if (my !== this.token) return; // STOP, or a chapter change, superseded us
      await this.play(make(), label);
    } catch {
      // A failed clip load (e.g. a file write) must not become an unhandled
      // rejection: callers fire this with `void`. Nothing sounds — and the
      // learner is told so (K8), unless STOP or a newer press took over
      // (play() took exactly one token; anything later moved it on).
      if (this.token === my + 1) {
        this.set({ playing: false, label: null, rendering: null, error: AUDIO_UNAVAILABLE_MESSAGE });
      }
    } finally {
      this.busy = false;
      if (this.status.rendering === label) this.set({ ...this.status, rendering: null });
    }
  }

  /**
   * Pre-render the clips a chapter can play (owner 2026-09-29: "load in when
   * possible"), so the first tap is as quick as a repeat. Runs in the
   * background AFTER the chapter's first paint, one clip at a time with a
   * breath between (the renders are synchronous DSP), and waits while a tap
   * is rendering so a tapped clip is never starved. The DSP render is always
   * cached; the WAV file + loaded player only once sound output is on (no
   * audio-session work before the learner has enabled sound). NEVER plays.
   * The newest request goes to the FRONT of the queue (the chapter on screen
   * first); the queue keeps at most PRELOAD_QUEUE_MAX, dropping the oldest.
   */
  preload(makes: readonly (() => Mono)[]): void {
    if (this.disposed) return;
    this.preloadQueue = [...makes, ...this.preloadQueue].slice(0, PRELOAD_QUEUE_MAX);
    if (this.preloading) return;
    this.preloading = true;
    const my = this.preloadToken;
    const live = () => !this.disposed && my === this.preloadToken;
    void (async () => {
      try {
        await sleep(PRELOAD_FIRST_MS);
        while (live() && this.preloadQueue.length > 0) {
          while (live() && this.busy) await sleep(120);
          const make = this.preloadQueue.shift();
          if (!live() || !make) return;
          let buf: Mono;
          try {
            buf = make();
          } catch {
            continue; // a chapter state that cannot render yet — skip it
          }
          const key = clipKeyOf(buf);
          if (key && isAudioOutputEnabled() && !this.pool.has(key)) {
            await this.loadClip(key, buf).catch(() => null);
          }
          await sleep(PRELOAD_BREATH_MS);
        }
      } finally {
        if (my === this.preloadToken) this.preloading = false;
      }
    })();
  }

  stop(): void {
    this.token++;
    this.wantKey = null;
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
    this.ear.stop();
    this.voice?.stop();
    if (this.status.playing || this.status.rendering || this.status.error) this.set({ playing: false, label: null, rendering: null });
  }

  dispose(): void {
    this.stop();
    this.disposed = true;
    this.preloadToken++;
    this.preloadQueue = [];
    this.appSub?.remove();
    this.appSub = null;
    this.ear.dispose();
    this.voice = null;
    this.pool.clear(); // every saved clip's file + player, released on close
    this.listeners.clear();
  }
}
