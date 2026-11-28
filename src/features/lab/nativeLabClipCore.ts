/**
 * nativeLabClipCore — the PURE core behind loadNativeLabClip (engine 13,
 * 2026-11-27, build must-do D16 / A15): get one lab-audio asset onto the disk
 * and into the NATIVE clip source (ApeDsp.loadClip), so a lab that plays
 * through the native generator + effect chain can play a recording through it.
 *
 * Everything platform-specific (the engine, the signed URL, the download, the
 * disk) is INJECTED, so this file has no React / native imports and is tested
 * in Node. The app's wiring lives in nativeLabClip.ts.
 *
 * Unlike labClipCache (which decodes WAV in JS for the JS clip labs), nothing
 * is decoded here: the file goes to the native decoder as a local URI, so the
 * published AAC/M4A plays as well as WAV.
 *
 * Order of a load:
 *   0. no clip source in this build (engine < 13, web) → 'unavailable', and
 *      NOTHING else happens — no URL, no download, no disk
 *   1. a fresh disk copy                     → loadClip(it)   (offline-capable)
 *   2. signed URL (edge fn) → download into the cache dir → loadClip
 *   3. offline / no URL with an OLD disk copy → loadClip(the old copy)
 * A disk copy the native decoder cannot read is deleted and fetched once more.
 *
 * It never STARTS sound: the caller plays the loaded clip with
 * genSet({ mode: GEN_MODES.clip }) and a fenced genStart (startFenced).
 * Errors are a typed result — never a rejection.
 */
import type { ClipLoadResult } from '../../../modules/ape-dsp';
import { clipKey } from './labClipCache';

export type NativeClipErrorCode = 'unavailable' | 'offline' | 'not_found' | 'unauthorized' | 'decode' | 'aborted';

export type NativeClipLoad =
  | {
      ok: true;
      labKey: string;
      assetKey: string;
      /** The local file the engine decoded (app cache dir). */
      uri: string;
      frames: number;
      /** The FILE's rate — the engine resamples at render time. */
      sampleRate: number;
      channels: 1 | 2;
      durationSec: number;
      /** True when a disk copy was used (no network round trip). */
      fromCache: boolean;
    }
  | {
      ok: false;
      error: NativeClipErrorCode;
      /** The native loadClip code behind a 'decode' (too_long, empty, …). */
      detail?: string;
      message: string;
    };

export type NativeClipResolve = { url: string; ext: string } | { reason: 'auth' | 'not_found' | 'network' };

/** A typed download failure (anything else thrown reads as 'offline'). */
export class NativeClipFetchError extends Error {
  readonly code: 'offline' | 'not_found' | 'unauthorized';
  constructor(code: 'offline' | 'not_found' | 'unauthorized', message?: string) {
    super(message ?? code);
    this.name = 'NativeClipFetchError';
    this.code = code;
  }
}

export interface NativeClipDeps {
  /** ApeDsp.clipAvailable — false on web and on binaries older than engine 13. */
  available: () => boolean;
  /** ApeDsp.loadClip — resolves a ClipLoadResult, never rejects. */
  loadClip: (uri: string) => Promise<ClipLoadResult>;
  /** Signed URL + file extension for (lab, asset) — labAudio.fetchLabAudio. */
  resolveUrl: (labKey: string, assetKey: string) => Promise<NativeClipResolve>;
  /** The disk copy for this key, if any (stale = older than the refresh age). */
  findCached: (key: string) => Promise<{ uri: string; stale: boolean } | null>;
  /** Download `url` into the cache under `key` + `ext`; resolves the local URI. */
  download: (url: string, key: string, ext: string) => Promise<string>;
  /** Delete a disk copy (a file the decoder could not read). */
  remove: (uri: string) => Promise<void>;
}

const fail = (error: NativeClipErrorCode, message: string, detail?: string): NativeClipLoad =>
  detail ? { ok: false, error, message, detail } : { ok: false, error, message };

const aborted = (): NativeClipLoad => fail('aborted', 'Load canceled');

/**
 * Load one lab-audio asset into the native clip source. Resolves — never
 * rejects — with the clip's facts or a typed reason. Aborting `signal` stops
 * the work at the next step (a clip already handed to the engine stays loaded;
 * the caller's own stop/unload owns that).
 */
export async function loadNativeLabClip(
  labKey: string,
  assetKey: string,
  deps: NativeClipDeps,
  opts?: { signal?: AbortSignal },
): Promise<NativeClipLoad> {
  if (!deps.available()) return fail('unavailable', 'This build has no clip source');
  const signal = opts?.signal;
  if (signal?.aborted) return aborted();
  const key = clipKey(labKey, assetKey);

  const tryLoad = async (uri: string, fromCache: boolean): Promise<NativeClipLoad | 'unreadable'> => {
    const r = await deps.loadClip(uri);
    if (r.ok) {
      return {
        ok: true,
        labKey,
        assetKey,
        uri,
        frames: r.frames,
        sampleRate: r.sampleRate,
        channels: r.channels,
        durationSec: r.sampleRate > 0 ? r.frames / r.sampleRate : 0,
        fromCache,
      };
    }
    if (r.error === 'unavailable') return fail('unavailable', r.message);
    // The FILE is the problem (damaged / partial / not audio): let the caller refetch.
    if (r.error === 'decode' || r.error === 'empty' || r.error === 'not_found') return 'unreadable';
    return fail('decode', r.message, r.error);
  };

  let stale: string | null = null;
  const cached = await deps.findCached(key).catch(() => null);
  if (cached) {
    if (!cached.stale) {
      const got = await tryLoad(cached.uri, true);
      if (got !== 'unreadable') return signal?.aborted ? aborted() : got;
      await deps.remove(cached.uri).catch(() => {});
    } else {
      stale = cached.uri;
    }
  }
  if (signal?.aborted) return aborted();

  const fallBackToStale = async (err: NativeClipLoad): Promise<NativeClipLoad> => {
    if (!stale || err.ok || err.error !== 'offline') return err;
    const got = await tryLoad(stale, true);
    if (got !== 'unreadable') return got;
    await deps.remove(stale).catch(() => {});
    return err;
  };

  let r: NativeClipResolve;
  try {
    r = await deps.resolveUrl(labKey, assetKey);
  } catch {
    r = { reason: 'network' };
  }
  if (!('url' in r)) {
    const err =
      r.reason === 'auth'
        ? fail('unauthorized', 'lab-audio auth')
        : r.reason === 'not_found'
          ? fail('not_found', 'lab-audio not_found')
          : fail('offline', 'lab-audio network');
    return fallBackToStale(err);
  }
  if (signal?.aborted) return aborted();

  let uri: string;
  try {
    uri = await deps.download(r.url, key, r.ext);
  } catch (e) {
    const code = e instanceof NativeClipFetchError ? e.code : 'offline';
    return fallBackToStale(fail(code, (e as Error)?.message ?? code));
  }
  if (signal?.aborted) return aborted();

  const got = await tryLoad(uri, false);
  if (got === 'unreadable') {
    await deps.remove(uri).catch(() => {});
    return fail('decode', 'The downloaded file could not be decoded');
  }
  return signal?.aborted ? aborted() : got;
}

/** A safe file extension for the cache name (the native decoders read the
 *  container from the bytes; iOS also takes a hint from the extension). */
export function clipFileExt(ext: string | undefined | null): string {
  const e = (ext ?? '').toLowerCase().replace(/^\./, '');
  return /^[a-z0-9]{1,5}$/.test(e) ? e : 'wav';
}
