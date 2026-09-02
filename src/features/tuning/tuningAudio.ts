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

export type PlayerStatus = { playing: boolean; label: string | null };

export class TuningPlayer {
  private ear = new EarClipPlayer();
  private status: PlayerStatus = { playing: false, label: null };
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
    this.set({ playing: true, label });
    this.stopTimer = setTimeout(() => {
      if (my === this.token) this.set({ playing: false, label: null });
    }, clipSeconds(buf) * 1000 + 80);
  }

  stop(): void {
    this.token++;
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.stopTimer = null;
    this.ear.stop();
    if (this.status.playing) this.set({ playing: false, label: null });
  }

  dispose(): void {
    this.stop();
    this.appSub?.remove();
    this.appSub = null;
    this.ear.dispose();
    this.listeners.clear();
  }
}
