/**
 * gaEngine — the lab's handle on its sound engine. Pure TypeScript (no React
 * Native): it owns the conversation with whichever TRANSPORT is attached (the
 * page's own Web Audio in the web build, a hidden web view on a phone —
 * engine/GaEngineHost.tsx attaches one) and knows nothing about game logic.
 *
 * What it adds over the raw protocol:
 *   - a STATUS the screen can show honestly: off / starting / running /
 *     blocked (the platform has not let audio start) / unavailable / failed;
 *   - buffers loaded once, by id, with the answer awaited (a start is never
 *     sent for a sound the engine has not confirmed it holds);
 *   - commands sent before the transport is ready are QUEUED, in order;
 *   - the measured level of the mix and the live voice count, for the
 *     readouts and for the app's listening-exposure monitor.
 *
 * It is a plain object with subscribe(), so the model's conductor and the
 * React layer both read it without a second copy of the truth.
 */
import { f32ToI16Base64, type GaCmd, type GaEvt } from './gaEngineProtocol.ts';

export type GaTransport = {
  kind: 'web' | 'webview';
  send: (cmd: GaCmd) => void;
  dispose: () => void;
};

export type GaEngineStatus = 'off' | 'starting' | 'running' | 'blocked' | 'unavailable' | 'failed';

export type GaLevel = { rms: number; peak: number; l: number; r: number; voices: number };

/** Longest init() waits for the engine's `ready`. */
export const GA_INIT_WAIT_MS = 4000;
/** Longest a buffer load waits for its answer. */
export const GA_BUFFER_WAIT_MS = 6000;

type Timers = { set: (f: () => void, ms: number) => unknown; clear: (id: unknown) => void };
const realTimers: Timers = { set: (f, ms) => setTimeout(f, ms), clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>) };

export class GaEngine {
  status: GaEngineStatus = 'off';
  sampleRate = 0;
  level: GaLevel = { rms: 0, peak: 0, l: 0, r: 0, voices: 0 };
  lastError: string | null = null;

  private transport: GaTransport | null = null;
  private queue: GaCmd[] = [];
  private listeners = new Set<(e: GaEvt) => void>();
  private statusListeners = new Set<() => void>();
  private loaded = new Set<string>();
  private loading = new Map<string, Promise<boolean>>();
  private bufferWaiters = new Map<string, (ok: boolean) => void>();
  private readyWaiters: ((s: GaEngineStatus) => void)[] = [];
  private timers: Timers;

  constructor(timers: Timers = realTimers) {
    this.timers = timers;
  }

  /* ── transport ─────────────────────────────────────────────────────── */

  /** The host found no way to run the engine on this device. */
  markUnavailable(why: string): void {
    this.lastError = why;
    this.setStatus('unavailable');
    this.flushReady();
  }

  attach(t: GaTransport): void {
    this.transport = t;
    const q = this.queue;
    this.queue = [];
    for (const c of q) t.send(c);
  }

  /** The transport went away (the screen closed, the web view was torn
   *  down). Everything it held is gone with it. */
  detach(): void {
    const t = this.transport;
    this.transport = null;
    this.queue = [];
    this.loaded.clear();
    this.loading.clear();
    for (const w of this.bufferWaiters.values()) w(false);
    this.bufferWaiters.clear();
    this.level = { rms: 0, peak: 0, l: 0, r: 0, voices: 0 };
    if (t) {
      try {
        t.dispose();
      } catch {
        /* already gone */
      }
    }
    this.setStatus('off');
    this.flushReady();
  }

  get attached(): boolean {
    return this.transport != null;
  }
  get transportKind(): GaTransport['kind'] | null {
    return this.transport?.kind ?? null;
  }

  send(cmd: GaCmd): void {
    if (this.status === 'unavailable') return;
    if (this.transport) this.transport.send(cmd);
    else this.queue.push(cmd);
  }

  /* ── events ────────────────────────────────────────────────────────── */

  /** Called by the transport for every engine event. */
  receive = (e: GaEvt): void => {
    switch (e.e) {
      case 'ready':
        this.sampleRate = e.sr;
        this.setStatus(e.state === 'running' ? 'running' : 'blocked');
        this.flushReady();
        break;
      case 'state':
        if (this.status === 'off' || this.status === 'unavailable') break;
        this.setStatus(e.state === 'running' ? 'running' : e.state === 'closed' ? 'off' : 'blocked');
        break;
      case 'buffer': {
        if (e.ok) this.loaded.add(e.id);
        const w = this.bufferWaiters.get(e.id);
        if (w) {
          this.bufferWaiters.delete(e.id);
          w(e.ok);
        }
        break;
      }
      case 'level':
        this.level = { rms: e.rms, peak: e.peak, l: e.l, r: e.r, voices: e.voices };
        break;
      case 'error':
        this.lastError = e.msg;
        if (this.status === 'starting') {
          this.setStatus('failed');
          this.flushReady();
        }
        break;
      default:
        break;
    }
    for (const l of [...this.listeners]) l(e);
  };

  subscribe(l: (e: GaEvt) => void): () => void {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }
  onStatus(l: () => void): () => void {
    this.statusListeners.add(l);
    return () => {
      this.statusListeners.delete(l);
    };
  }
  private setStatus(s: GaEngineStatus): void {
    if (s === this.status) return;
    this.status = s;
    for (const l of [...this.statusListeners]) l();
  }
  private flushReady(): void {
    const w = this.readyWaiters;
    this.readyWaiters = [];
    for (const f of w) f(this.status);
  }

  /* ── lifecycle ─────────────────────────────────────────────────────── */

  /** Start the engine. Resolves with the status it reached: 'running',
   *  'blocked' (the platform is holding audio back — the screen says so and
   *  offers a retry), 'unavailable', or 'failed'. Bounded: a transport that
   *  never answers is a failure, not a spinner. */
  init(): Promise<GaEngineStatus> {
    if (this.status === 'running' || this.status === 'unavailable') return Promise.resolve(this.status);
    return new Promise((resolve) => {
      let done = false;
      const finish = (s: GaEngineStatus) => {
        if (done) return;
        done = true;
        this.timers.clear(timer);
        resolve(s);
      };
      const timer = this.timers.set(() => {
        if (this.status === 'starting') {
          this.lastError = 'The sound engine did not answer.';
          this.setStatus('failed');
        }
        this.readyWaiters = this.readyWaiters.filter((f) => f !== finish);
        finish(this.status);
      }, GA_INIT_WAIT_MS);
      this.readyWaiters.push(finish);
      if (this.status !== 'blocked') this.setStatus('starting');
      this.send({ t: 'init' });
      if (this.status === 'blocked') this.send({ t: 'resume' });
    });
  }

  /** Ask a blocked engine to run (called from a tap). */
  resume(): void {
    this.send({ t: 'resume' });
  }

  has(id: string): boolean {
    return this.loaded.has(id);
  }

  /** Hand decoded audio to the engine; resolves true once the engine has
   *  confirmed it holds it. A second call for the same id shares the first. */
  load(id: string, sr: number, channels: Float32Array[]): Promise<boolean> {
    if (this.loaded.has(id)) return Promise.resolve(true);
    const pending = this.loading.get(id);
    if (pending) return pending;
    const p = new Promise<boolean>((resolve) => {
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        this.timers.clear(timer);
        this.loading.delete(id);
        resolve(ok);
      };
      const timer = this.timers.set(() => {
        this.bufferWaiters.delete(id);
        finish(false);
      }, GA_BUFFER_WAIT_MS);
      this.bufferWaiters.set(id, finish);
      if (this.transport?.kind === 'web') this.send({ t: 'buffer', id, sr, f32: channels });
      else this.send({ t: 'buffer', id, sr, i16: channels.map(f32ToI16Base64) });
    });
    this.loading.set(id, p);
    return p;
  }

  stopAll(fade = 0.03): void {
    this.send({ t: 'stopAll', fade });
  }
}
