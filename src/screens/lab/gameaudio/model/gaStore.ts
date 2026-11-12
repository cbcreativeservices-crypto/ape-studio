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
 * With SOUND OFF nothing is sent, and one-shots are ended by a timer here
 * (their nominal length), so the model's instances come and go exactly as
 * they would if they were heard.
 */
import { useSyncExternalStore } from 'react';
import type { GaEngine } from '../engine/gaEngine.ts';
import type { GaCmd } from '../engine/gaEngineProtocol.ts';
import { gaSoundSeconds } from '../sounds/gaSoundBank.ts';
import { gaInitial, gaReduce, type GaAction, type GaState } from './gaModel.ts';

type Listener = () => void;

let state: GaState = gaInitial();
const listeners = new Set<Listener>();
let engine: GaEngine | null = null;
let ensureAssets: ((ids: readonly string[]) => Promise<string[]>) | null = null;
let unbind: (() => void) | null = null;
const expiry = new Map<string, ReturnType<typeof setTimeout>>();
/** The unheard music request whose boundary is being waited for. */
let musicWait: { req: string; timer: ReturnType<typeof setTimeout> } | null = null;
/** Counts every "everything stops" (■ STOP, a page opening, a reset): a
 *  start that was waiting for its sound to load is dropped if this moved. */
let stopEpoch = 0;
function clearMusicWait(): void {
  if (musicWait) clearTimeout(musicWait.timer);
  musicWait = null;
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

/** How long an unheard one-shot is taken to last (seconds), by asset. */
function nominalSeconds(asset: string): number {
  // a spoken line lasts as long as its OWN take: the lesson is that a
  // second-language take has a different length, heard or not
  if (asset.startsWith('vo_')) return gaSoundSeconds(asset) || 2.6;
  if (asset.startsWith('fs_')) return 0.4;
  if (asset === 'door') return 1.2;
  if (asset === 'mu_stinger') return 2.4;
  return 0.8;
}

function send(cmds: GaCmd[]): void {
  const e = engine;
  if (!e || !cmds.length) return;
  for (const c of cmds) {
    const need = c.t === 'start' ? [c.buf] : c.t === 'reverb' ? [c.buf] : c.t === 'music' && c.op === 'start' ? c.stems.map((s) => s.buf) : c.t === 'music' && c.op === 'stinger' ? [c.buf] : null;
    const missing = need?.filter((id) => !e.has(id)) ?? [];
    if (!missing.length || !ensureAssets) {
      e.send(c);
      continue;
    }
    // the engine does not hold this sound yet: load it, then send — unless
    // the scene was stopped or the engine was swapped while it loaded
    const epochAtAsk = stopEpoch;
    void ensureAssets(missing).then((failed) => {
      if (engine !== e) return;
      if (stopEpoch !== epochAtAsk) return;
      if (failed.length && c.t === 'start') {
        gaDispatch({ type: 'engine', evt: { e: 'failed', v: c.v, why: 'missing-buffer', detail: failed.join(', ') } });
        return;
      }
      e.send(c);
    });
  }
}

export function gaDispatch(a: GaAction): void {
  const before = state;
  if (a.type === 'stopAll' || a.type === 'enterPage' || a.type === 'reset') {
    stopEpoch += 1;
    for (const t of expiry.values()) clearTimeout(t);
    expiry.clear();
  }
  const r = gaReduce(state, a, gaNow());
  state = r.state;
  send(r.cmds);
  if (!state.soundOn) {
    // unheard one-shots end on a timer, as heard ones end on the engine's word
    for (const v of state.voices) {
      if (v.loop || expiry.has(v.v) || before.voices.some((x) => x.v === v.v)) continue;
      const id = v.v;
      expiry.set(
        id,
        setTimeout(() => {
          expiry.delete(id);
          gaDispatch({ type: 'expire', v: id });
        }, (v.delayS + nominalSeconds(v.asset)) * 1000),
      );
    }
  }
  // an unheard music request reaches its boundary on scene time
  const pend = state.soundOn ? null : state.music.pending;
  if (!pend || pend.inS == null) clearMusicWait();
  else if (musicWait?.req !== pend.req) {
    clearMusicWait();
    const req = pend.req;
    musicWait = {
      req,
      timer: setTimeout(() => {
        musicWait = null;
        gaDispatch({ type: 'engine', evt: { e: 'music', what: 'applied', req, at: 0 } });
      }, pend.inS * 1000),
    };
  }
  for (const l of [...listeners]) l();
}

/** Connect the scene to an engine for as long as the lab screen is mounted.
 *  `ensure` loads sounds into that engine (engine/useGaSound). */
export function gaBindEngine(e: GaEngine, ensure: (ids: readonly string[]) => Promise<string[]>): () => void {
  unbind?.();
  engine = e;
  ensureAssets = ensure;
  const off = e.subscribe((evt) => {
    if (evt.e === 'started' || evt.e === 'failed' || evt.e === 'ended' || evt.e === 'music') gaDispatch({ type: 'engine', evt });
  });
  const mine = () => {
    off();
    if (engine === e) {
      engine = null;
      ensureAssets = null;
    }
    if (unbind === mine) unbind = null;
  };
  unbind = mine;
  return mine;
}

/** A clean scene (the lab opens with one; RESET SCENE asks for one). */
export function gaResetScene(): void {
  for (const t of expiry.values()) clearTimeout(t);
  expiry.clear();
  clearMusicWait();
  gaDispatch({ type: 'reset' });
}

/** The lab closed: forget the scene entirely. */
export function gaCloseScene(): void {
  for (const t of expiry.values()) clearTimeout(t);
  expiry.clear();
  clearMusicWait();
  state = gaInitial();
  t0 = wall();
  for (const l of [...listeners]) l();
}
