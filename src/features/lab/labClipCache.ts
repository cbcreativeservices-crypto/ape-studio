/**
 * labClipCache — the PURE core behind loadLabClipBuffer (2026-10-01): fetch a
 * lab-audio bucket asset, decode it, resample it to the 48 kHz DSP rate, and
 * keep the result.
 *
 * Everything platform-specific (the signed-URL edge function, the byte fetch,
 * the disk) is INJECTED, so this file has no React / native imports and is
 * tested in Node. The app's wiring lives in labClipBuffer.ts.
 *
 * Order of a load:
 *   1. memory LRU (decoded, 48 kHz)          → instant
 *   2. de-dup: an identical load in flight   → share it
 *   3. disk cache (raw WAV bytes)            → offline-capable
 *   4. signed URL (edge fn) → fetch bytes    → persist to disk → decode
 * A stale disk copy is refreshed when online, and still served when not.
 * A disk copy that fails to decode is deleted and refetched once.
 *
 * Errors are LabClipError with a code — never an untyped rejection.
 */
import { ByteLru } from '../audio/clipLru';
import { decodeWav, WavDecodeError, type DecodedAudio } from '../audio/wavDecode';
import { DSP_RATE, resampleAsync } from '../audio/resample';

export type LabClipErrorCode = 'offline' | 'not_found' | 'decode' | 'unauthorized' | 'aborted';

export class LabClipError extends Error {
  readonly code: LabClipErrorCode;
  constructor(code: LabClipErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'LabClipError';
    this.code = code;
  }
}

export function isLabClipError(e: unknown): e is LabClipError {
  return e instanceof LabClipError;
}

/** A decoded, 48 kHz lab clip. Treat the arrays as READ-ONLY — they are shared. */
export interface LabClipBuffer {
  labKey: string;
  assetKey: string;
  /** Always DSP_RATE (48 000). */
  sampleRate: number;
  /** The file's own rate before resampling. */
  sourceRate: number;
  /** One Float32Array per channel, −1..1. */
  channels: Float32Array[];
  frames: number;
  durationSec: number;
}

export type ResolveResult = { url: string } | { reason: 'auth' | 'not_found' | 'network' };

export interface DiskEntry {
  bytes: Uint8Array;
  /** True when older than the refresh age — use only if the network fails. */
  stale: boolean;
}

export interface LabClipDisk {
  read(key: string): Promise<DiskEntry | null>;
  write(key: string, bytes: Uint8Array): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface FetchedBytes {
  bytes: Uint8Array;
  /** The fetcher already wrote these bytes to the disk cache under `key`. */
  persisted?: boolean;
}

export interface LabClipDeps {
  /** Signed URL for (lab, asset) — labAudio.fetchLabAudio in the app. */
  resolveUrl: (labKey: string, assetKey: string) => Promise<ResolveResult>;
  /**
   * Fetch the bytes. Throw a LabClipError for a typed failure; anything else
   * thrown is reported as 'offline'. `diskKey` lets a native fetcher download
   * straight into the cache (then return persisted: true).
   */
  fetchBytes: (url: string, diskKey: string, signal: AbortSignal) => Promise<FetchedBytes>;
  /** Optional — omit (web) for memory-only caching. */
  disk?: LabClipDisk | null;
  /** Memory budget for decoded buffers, bytes (default 64 MB). */
  maxBytes?: number;
  /** Most decoded clips kept (default 48). */
  maxCount?: number;
  /** Overridable for tests. */
  decode?: (bytes: Uint8Array) => DecodedAudio;
}

export const DEFAULT_CLIP_MEMORY_BYTES = 64 * 1024 * 1024;

// ————— base64 (the legacy expo-file-system API reads/writes binary as base64) —————

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INV = (() => {
  const t = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i;
  t['-'.charCodeAt(0)] = 62; // tolerate the URL-safe alphabet too
  t['_'.charCodeAt(0)] = 63;
  return t;
})();

/** Decode base64 (whitespace and padding tolerated) to bytes. */
export function base64ToBytes(s: string): Uint8Array {
  let n = 0;
  const clean = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const v = c < 128 ? B64_INV[c] : -1;
    if (v >= 0) clean[n++] = v;
  }
  const out = new Uint8Array(Math.floor((n * 3) / 4));
  let o = 0;
  let i = 0;
  for (; i + 4 <= n; i += 4) {
    const x = (clean[i] << 18) | (clean[i + 1] << 12) | (clean[i + 2] << 6) | clean[i + 3];
    out[o++] = x >> 16;
    out[o++] = (x >> 8) & 255;
    out[o++] = x & 255;
  }
  const rest = n - i;
  if (rest >= 2) {
    const x = (clean[i] << 18) | (clean[i + 1] << 12) | (rest === 3 ? clean[i + 2] << 6 : 0);
    out[o++] = x >> 16;
    if (rest === 3) out[o++] = (x >> 8) & 255;
  }
  return o === out.length ? out : out.subarray(0, o);
}

/** Encode bytes as standard padded base64. */
export function bytesToBase64(b: Uint8Array): string {
  const parts: string[] = [];
  const CHUNK = 3 * 16384;
  for (let start = 0; start < b.length; start += CHUNK) {
    const end = Math.min(b.length, start + CHUNK);
    let s = '';
    for (let i = start; i < end; i += 3) {
      const a = b[i];
      const has1 = i + 1 < b.length;
      const has2 = i + 2 < b.length;
      const c1 = has1 ? b[i + 1] : 0;
      const c2 = has2 ? b[i + 2] : 0;
      s += B64[a >> 2] + B64[((a & 3) << 4) | (c1 >> 4)];
      s += has1 ? B64[((c1 & 15) << 2) | (c2 >> 6)] : '=';
      s += has2 ? B64[c2 & 63] : '=';
    }
    parts.push(s);
  }
  return parts.join('');
}

/** Stable cache key; also the on-disk file stem. */
export function clipKey(labKey: string, assetKey: string): string {
  const safe = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, '_');
  return `${safe(labKey)}__${safe(assetKey)}`;
}

/** Bytes a decoded buffer holds in memory. */
export function clipMemoryBytes(b: Pick<LabClipBuffer, 'channels' | 'frames'>): number {
  return b.channels.length * b.frames * 4;
}

function abortError(): LabClipError {
  return new LabClipError('aborted', 'Load cancelled');
}

/** Race a shared promise against ONE caller's signal (the shared work goes on). */
function withSignal<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return p;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    p.then(
      (v) => {
        signal.removeEventListener('abort', onAbort);
        if (signal.aborted) reject(abortError());
        else resolve(v);
      },
      (e) => {
        signal.removeEventListener('abort', onAbort);
        reject(signal.aborted ? abortError() : e);
      },
    );
  });
}

function asTyped(e: unknown, fallback: LabClipErrorCode): LabClipError {
  if (e instanceof LabClipError) return e;
  if (e instanceof WavDecodeError) return new LabClipError('decode', e.message);
  return new LabClipError(fallback, (e as Error)?.message);
}

export class LabClipCache {
  private readonly deps: LabClipDeps;
  private readonly mem: ByteLru<LabClipBuffer>;
  private readonly inflight = new Map<string, Promise<LabClipBuffer>>();
  /** Bumped by clearMemory(): a load that started before must not repopulate. */
  private epoch = 0;

  constructor(deps: LabClipDeps) {
    this.deps = deps;
    this.mem = new ByteLru<LabClipBuffer>(deps.maxBytes ?? DEFAULT_CLIP_MEMORY_BYTES, deps.maxCount ?? 48);
  }

  /** The decoded clip if it is already in memory (marks it recently used). */
  peek(labKey: string, assetKey: string): LabClipBuffer | undefined {
    return this.mem.get(clipKey(labKey, assetKey));
  }

  get memoryBytes(): number {
    return this.mem.bytes;
  }

  get memoryCount(): number {
    return this.mem.size;
  }

  /** Keys currently held in memory, least-recent first (diagnostics/tests). */
  memoryKeys(): string[] {
    return this.mem.keys();
  }

  /** Drop every decoded buffer (the disk copies stay). */
  clearMemory(): void {
    this.epoch++;
    this.mem.clear();
    this.inflight.clear();
  }

  /**
   * Load a clip. Resolves with the 48 kHz buffer or rejects with a
   * LabClipError ('offline' | 'not_found' | 'unauthorized' | 'decode' |
   * 'aborted'). Concurrent calls for the same asset share one fetch/decode;
   * aborting one caller's signal rejects only that caller.
   */
  load(labKey: string, assetKey: string, opts?: { signal?: AbortSignal }): Promise<LabClipBuffer> {
    const key = clipKey(labKey, assetKey);
    const hit = this.mem.get(key);
    if (hit) return opts?.signal?.aborted ? Promise.reject(abortError()) : Promise.resolve(hit);
    let job = this.inflight.get(key);
    if (!job) {
      const epoch = this.epoch;
      job = this.run(labKey, assetKey, key).then((buf) => {
        if (epoch === this.epoch) this.mem.set(key, buf, clipMemoryBytes(buf));
        return buf;
      });
      const mine = job;
      this.inflight.set(key, mine);
      // Never an unhandled rejection from the shared job itself — callers get
      // the rejection through their own (withSignal) promise.
      mine.catch(() => {}).finally(() => {
        if (this.inflight.get(key) === mine) this.inflight.delete(key);
      });
    }
    return withSignal(job, opts?.signal);
  }

  /** Warm the cache without caring about the result. Never rejects. */
  prefetch(labKey: string, assetKey: string): void {
    this.load(labKey, assetKey).catch(() => {});
  }

  private async run(labKey: string, assetKey: string, key: string): Promise<LabClipBuffer> {
    const disk = this.deps.disk ?? null;
    let stale: Uint8Array | null = null;

    if (disk) {
      const entry = await disk.read(key).catch(() => null);
      if (entry) {
        if (!entry.stale) {
          try {
            return await this.finish(labKey, assetKey, entry.bytes);
          } catch {
            // A damaged cache file: forget it and fetch afresh.
            await disk.remove(key).catch(() => {});
          }
        } else {
          stale = entry.bytes;
        }
      }
    }

    let bytes: Uint8Array;
    try {
      bytes = await this.fetch(labKey, assetKey, key, disk);
    } catch (e) {
      const err = asTyped(e, 'offline');
      // Offline with an old copy on disk: the old copy is still the asset.
      if (stale && err.code === 'offline') {
        try {
          return await this.finish(labKey, assetKey, stale);
        } catch {
          await disk?.remove(key).catch(() => {});
        }
      }
      throw err;
    }
    try {
      return await this.finish(labKey, assetKey, bytes);
    } catch (e) {
      await disk?.remove(key).catch(() => {});
      throw asTyped(e, 'decode');
    }
  }

  private async fetch(labKey: string, assetKey: string, key: string, disk: LabClipDisk | null): Promise<Uint8Array> {
    let r: ResolveResult;
    try {
      r = await this.deps.resolveUrl(labKey, assetKey);
    } catch {
      throw new LabClipError('offline', 'Signed URL request failed');
    }
    if (!('url' in r)) {
      throw new LabClipError(
        r.reason === 'auth' ? 'unauthorized' : r.reason === 'not_found' ? 'not_found' : 'offline',
        `lab-audio ${r.reason}`,
      );
    }
    // The shared job is not tied to any one caller, so it gets its own
    // controller; it runs to completion and fills the cache for the next ask.
    const ctl = new AbortController();
    const got = await this.deps.fetchBytes(r.url, key, ctl.signal);
    if (disk && !got.persisted) await disk.write(key, got.bytes).catch(() => {});
    return got.bytes;
  }

  private async finish(labKey: string, assetKey: string, bytes: Uint8Array): Promise<LabClipBuffer> {
    const decoded = (this.deps.decode ?? decodeWav)(bytes);
    const channels = await resampleAsync(decoded.channels, decoded.sampleRate, DSP_RATE);
    const frames = channels[0]?.length ?? 0;
    return {
      labKey,
      assetKey,
      sampleRate: DSP_RATE,
      sourceRate: decoded.sampleRate,
      channels,
      frames,
      durationSec: frames / DSP_RATE,
    };
  }
}
