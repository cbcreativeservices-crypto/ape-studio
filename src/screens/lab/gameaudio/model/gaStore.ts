/**
 * gaStore — THE ONE SCENE for the whole Game Audio lab session, and the
 * CONDUCTOR between the pure model and the sound engine. A module-scope
 * store (the DJ lab's boothStore pattern: a tiny external store +
 * useSyncExternalStore). Each page opens on a clean copy of the scene
 * (model: 'enterPage'); the facts of what the learner did are kept.
 *
 * It is SESSION state, not saved data: it lives as long as the lab is open
 * and starts clean next time (credit lives in PagedLab's progress).
 *
 *   gaDispatch(action)
 *     → gaReduce(state, action, now)        model/gaModel (pure)
 *     → the engine commands it called for   sent in order; a start whose
 *                                           sound the engine does not hold
 *                                           yet waits for that one load
 *   engine events → gaDispatch({ type: 'engine', evt })
 *
 * A START THAT WAITS IS NEVER OVERTAKEN (audit 2, F4). While a voice's start
 * waits for its sound to load, what the model says about that voice next is
 * kept with it instead of being sent ahead of it: a later `stop` cancels the
 * waiting start (neither is sent), a later `set` is merged into it (it then
 * starts with the newest level, pan, filter and rate). The same holds for
 * the music: commands that follow a waiting music start are sent after it,
 * in order (each with its own load), and a music stop cancels it. A stinger
 * whose file is loading belongs to the music it was asked for: a music stop
 * or a new music start before it has loaded cancels it (check N2, N3). The
 * room reverb is setup, not a sound: it is sent when it has loaded whatever
 * stopped in between (check N4).
 *
 * With SOUND OFF nothing is sent, and one-shots are ended by a timer here
 * (their nominal length), so the model's instances come and go exactly as
 * they would if they were heard.
 *
 * THINGS THAT HAPPEN LATER are due times in the model's state (a network
 * action lands, a bird calls): one timer here moves the clock to the next of
 * them (`tick`), and the reducer, which stays pure, does what is due.
 */
import { useSyncExternalStore } from 'react';
import type { GaEngine } from '../engine/gaEngine.ts';
import type { GaCmd } from '../engine/gaEngineProtocol.ts';
import { gaInitial, gaNextDue, gaNominalSeconds, gaReduce, type GaAction, type GaState } from './gaModel.ts';

type Listener = () => void;
type Timer = ReturnType<typeof setTimeout>;
type StartCmd = Extract<GaCmd, { t: 'start' }>;
type StingerCmd = Extract<GaCmd, { t: 'music'; op: 'stinger' }>;

let state: GaState = gaInitial();
const listeners = new Set<Listener>();
let engine: GaEngine | null = null;
let ensureAssets: ((ids: readonly string[]) => Promise<string[]>) | null = null;
let unbind: (() => void) | null = null;
const expiry = new Map<string, Timer>();
/** An unheard request whose boundary is being waited for: the layer change,
 *  and the stinger. */
let musicWait: { req: string; timer: Timer } | null = null;
let stingerWait: { req: string; timer: Timer } | null = null;
/** The one timer that moves the clock to the next thing due. */
let wake: { at: number; timer: Timer } | null = null;
/** Starts waiting for their sound to load, by voice id (F4). */
const waitingStarts = new Map<string, StartCmd>();
/** A music start whose stems are loading, and the music commands behind it. */
let waitingMusic: { queue: GaCmd[] } | null = null;
/** Stingers waiting for their file to load, by request id. */
const waitingStingers = new Map<string, StingerCmd>();

/** A timer that never keeps a test process (node) alive by itself. */
function later(fn: () => void, ms: number): Timer {
  const t = setTimeout(fn, Math.max(0, ms));
  (t as unknown as { unref?: () => void }).unref?.();
  return t;
}
function clearMusicWait(): void {
  if (musicWait) clearTimeout(musicWait.timer);
  musicWait = null;
}
function clearStingerWait(): void {
  if (stingerWait) clearTimeout(stingerWait.timer);
  stingerWait = null;
}
function clearWake(): void {
  if (wake) clearTimeout(wake.timer);
  wake = null;
}
/** Nothing that waits for a load may start now (everything stopped, sound
 *  went off, the engine changed). The reverb is not a sound and is kept. */
function dropWaiting(): void {
  waitingStarts.clear();
  waitingMusic = null;
  waitingStingers.clear();
}

const wall = (): number => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
let t0 = wall();
/** Scene time now, in seconds. */
export const gaNow = (): number => (wall() - t0) / 1000;

export const gaGet = (): GaState => state;
export function gaSubscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
/** The whole scene state; the screen re-renders on every change. */
export const useGa = (): GaState => useSyncExternalStore(gaSubscribe, gaGet, gaGet);

function send(cmds: GaCmd[]): void {
  const e = engine;
  if (!e || !cmds.length) return;
  for (const c of cmds) {
    // a voice whose start is still waiting for its sound: what follows for
    // that voice is kept WITH the start, never sent ahead of it
    if (c.t === 'stop' && waitingStarts.has(c.v)) {
      waitingStarts.delete(c.v);
      continue;
    }
    if (c.t === 'set' && waitingStarts.has(c.v)) {
      const held = waitingStarts.get(c.v)!;
      if (c.gain != null) held.gain = c.gain;
      if (c.pan != null) held.pan = c.pan;
      if (c.pos != null) held.pos = c.pos;
      if (c.rate != null) held.rate = c.rate;
      if (c.lowpass != null) held.lowpass = c.lowpass;
      if (c.rev != null) held.rev = c.rev;
      // a renderer change while it waits: it starts on the new renderer
      if (c.mode != null && held.mode !== 'none') held.mode = c.mode;
      continue;
    }
    if (c.t === 'stopAll') dropWaiting();
    if (c.t === 'music') {
      // a stinger still loading belonged to the music that is now stopped
      // or replaced: it must never play on the next one (check N2)
      if (c.op === 'start' || c.op === 'stop') waitingStingers.clear();
      if (waitingMusic && c.op !== 'start') {
        if (c.op === 'stop') {
          // the start that was waiting is cancelled; the stop goes out (it
          // ends anything an earlier start left playing)
          waitingMusic = null;
          e.send(c);
        } else waitingMusic.queue.push(c);
        continue;
      }
    }
    const need = c.t === 'start' ? [c.buf] : c.t === 'reverb' ? [c.buf] : c.t === 'music' && c.op === 'start' ? c.stems.map((s) => s.buf) : c.t === 'music' && c.op === 'stinger' ? [c.buf] : null;
    const missing = need?.filter((id) => !e.has(id)) ?? [];
    if (!missing.length || !ensureAssets) {
      e.send(c);
      continue;
    }
    // the engine does not hold this sound yet: load it, then send — unless
    // the scene was stopped or the engine was swapped while it loaded
    if (c.t === 'start') {
      const held: StartCmd = { ...c };
      waitingStarts.set(c.v, held);
      void ensureAssets(missing).then((failed) => {
        if (engine !== e) return;
        // cancelled by a stop, by "everything stops", or replaced
        if (waitingStarts.get(held.v) !== held) return;
        waitingStarts.delete(held.v);
        if (failed.length) {
          gaDispatch({ type: 'engine', evt: { e: 'failed', v: held.v, why: 'missing-buffer', detail: failed.join(', ') } });
          return;
        }
        e.send(held);
      });
      continue;
    }
    if (c.t === 'music' && c.op === 'start') {
      const mine = { queue: [] as GaCmd[] };
      waitingMusic = mine;
      void ensureAssets(missing).then(() => {
        if (engine !== e) return;
        if (waitingMusic !== mine) return;
        waitingMusic = null;
        // a stem that failed to load is reported by the engine itself
        e.send(c);
        // what waited behind it goes through here again, so each command
        // has its own sound loaded first (a stinger its file: check N3)
        send(mine.queue);
      });
      continue;
    }
    if (c.t === 'music' && c.op === 'stinger') {
      const held = c;
      waitingStingers.set(c.req, held);
      void ensureAssets(missing).then(() => {
        if (engine !== e) return;
        // withdrawn by a music stop, a new music start, or everything stopping
        if (waitingStingers.get(held.req) !== held) return;
        waitingStingers.delete(held.req);
        e.send(held);
      });
      continue;
    }
    // the room reverb: setup, sent once it has loaded, whatever stopped in
    // between (a page change while it loaded must not leave the room dry: N4)
    void ensureAssets(missing).then(() => {
      if (engine !== e) return;
      e.send(c);
    });
  }
}

export function gaDispatch(a: GaAction): void {
  const before = state;
  // sound going off sends the engine nothing, so what waits for a load is
  // dropped here. (■ STOP, a page opening and a reset send `stopAll`, which
  // drops it in `send`.)
  if (a.type === 'sound' && !a.on) dropWaiting();
  if (a.type === 'stopAll' || a.type === 'enterPage' || a.type === 'reset') {
    for (const t of expiry.values()) clearTimeout(t);
    expiry.clear();
  }
  const r = gaReduce(state, a, gaNow());
  state = r.state;
  send(r.cmds);
  // unheard one-shots end on a timer, as heard ones end on the engine's word.
  // A stinger that has begun ends on the engine's `stinger` event; its timer
  // is a net under that (a second late), so PLAYING can never hold it for ever.
  for (const v of state.voices) {
    if (v.loop || expiry.has(v.v) || before.voices.some((x) => x.v === v.v)) continue;
    if (state.soundOn && !v.music) continue;
    const id = v.v;
    expiry.set(
      id,
      later(() => {
        expiry.delete(id);
        gaDispatch({ type: 'expire', v: id });
      }, (v.delayS + gaNominalSeconds(v.asset) + (state.soundOn ? 1 : 0)) * 1000),
    );
  }
  // an unheard music request reaches its boundary on scene time
  const pend = state.soundOn ? null : state.music.pending;
  if (!pend || pend.inS == null) clearMusicWait();
  else if (musicWait?.req !== pend.req) {
    clearMusicWait();
    const req = pend.req;
    musicWait = {
      req,
      timer: later(() => {
        musicWait = null;
        gaDispatch({ type: 'engine', evt: { e: 'music', what: 'applied', req, at: 0 } });
      }, pend.inS * 1000),
    };
  }
  // and so does an unheard stinger: its boundary comes, it begins
  const sting = state.soundOn ? null : state.music.stinger;
  if (!sting || sting.inS == null) clearStingerWait();
  else if (stingerWait?.req !== sting.req) {
    clearStingerWait();
    const req = sting.req;
    stingerWait = {
      req,
      timer: later(() => {
        stingerWait = null;
        gaDispatch({ type: 'engine', evt: { e: 'music', what: 'applied', req, at: 0 } });
      }, sting.inS * 1000),
    };
  }
  // the next thing due in the model (a network action lands, a bird calls)
  const next = gaNextDue(state);
  if (next == null) clearWake();
  else if (!wake || Math.abs(wake.at - next) > 1e-6) {
    clearWake();
    wake = {
      at: next,
      timer: later(() => {
        wake = null;
        // never a moment EARLY: the reducer acts on what is due by `t`
        gaDispatch({ type: 'tick', t: Math.max(next, gaNow()) });
      }, (next - gaNow()) * 1000),
    };
  }
  for (const l of [...listeners]) l();
}

/** Connect the scene to an engine for as long as the lab screen is mounted.
 *  `ensure` loads sounds into that engine (engine/useGaSound). */
export function gaBindEngine(e: GaEngine, ensure: (ids: readonly string[]) => Promise<string[]>): () => void {
  unbind?.();
  dropWaiting();
  engine = e;
  ensureAssets = ensure;
  const off = e.subscribe((evt) => {
    if (evt.e === 'started' || evt.e === 'failed' || evt.e === 'ended' || evt.e === 'music' || evt.e === 'reverb' || evt.e === 'clock') gaDispatch({ type: 'engine', evt });
  });
  const mine = () => {
    off();
    if (engine === e) {
      engine = null;
      ensureAssets = null;
      dropWaiting();
    }
    if (unbind === mine) unbind = null;
  };
  unbind = mine;
  return mine;
}

function clearTimers(): void {
  for (const t of expiry.values()) clearTimeout(t);
  expiry.clear();
  clearMusicWait();
  clearStingerWait();
  clearWake();
}

/** A clean scene (the lab opens with one; RESET SCENE asks for one). */
export function gaResetScene(): void {
  clearTimers();
  gaDispatch({ type: 'reset' });
}

/** The lab closed: forget the scene entirely. */
export function gaCloseScene(): void {
  clearTimers();
  dropWaiting();
  state = gaInitial();
  t0 = wall();
  for (const l of [...listeners]) l();
}
