/**
 * tuningAudio — the Tuning & Temperament Lab's player (spec Stage 1 §10,
 * Stage 5 §1). Wraps the existing offline → WAV → expo-audio pipeline
 * (EarClipPlayer) behind the app-wide audio gate; one voice slot, so rapid
 * play/stop can never stack sources; stops on unmount and when the app
 * leaves the foreground. Renderers live in tuningRender.ts (pure, tested).
 */
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import type { Mono } from '../ear/earDsp';
import { EarClipPlayer } from '../ear/earPlayer';
import { clipSeconds } from './tuningRender';

export * from './tuningRender';

/* ── player ─────────────────────────────────────────────────────────────── */

export type PlayerStatus = {
  playing: boolean;
  label: string | null;
  /** ADDITIVE (2026-09-11): the clip currently being SYNTHESISED, if any.
   *  Optional so the existing `{ playing, label }` literals still typecheck. */
  rendering?: string | null;
};

export class TuningPlayer {
  private ear = new EarClipPlayer();
  private status: PlayerStatus = { playing: false, label: null, rendering: null };
  private busy = false;
  private listeners = new Set<(s: PlayerStatus) => void>();
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private appSub: NativeEventSubscription | null;
  private token = 0;

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

  /** Play one rendered clip; any previous clip stops first. Never autoplays. */
  async play(buf: Mono, label: string): Promise<void> {
    const my = ++this.token;
    if (!(await this.requestOutput())) return;
    if (my !== this.token) return; // a newer request superseded us while the gate was open
    this.ear.stop();
    if (this.stopTimer) clearTimeout(this.stopTimer);
    await this.ear.load([buf]);
    if (my !== this.token) return;
    this.ear.play(0);
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
    } finally {
      this.busy = false;
      if (this.status.rendering === label) this.set({ ...this.status, rendering: null });
    }
  }

  stop(): void {
    this.token++;
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
    this.ear.stop();
    if (this.status.playing || this.status.rendering) this.set({ playing: false, label: null, rendering: null });
  }

  dispose(): void {
    this.stop();
    this.appSub?.remove();
    this.appSub = null;
    this.ear.dispose();
    this.listeners.clear();
  }
}
