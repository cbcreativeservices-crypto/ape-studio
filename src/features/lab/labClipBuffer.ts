/**
 * labClipBuffer — "fetch a lab-audio bucket asset as DSP buffers" (2026-10-01).
 *
 *   const clip = await loadLabClipBuffer('demo_signals', 'piano-chord-1', { signal });
 *   clip.channels   // Float32Array[] at 48 kHz, −1..1 — feed earDsp / renderRecorded
 *
 * Path: labAudio.fetchLabAudio (edge fn → 120 s signed URL) → bytes → decodeWav
 * → resample to 48 kHz. The pure engine (memory LRU, de-dup, cancellation,
 * typed errors) is labClipCache.ts; this file only supplies the platform:
 *
 *   NATIVE  the WAV is downloaded STRAIGHT into the app cache directory
 *           (expo-file-system legacy downloadAsync, already in the binary — no
 *           native change, OTA-safe), then read back as base64. Repeat use is
 *           offline: a cached file is served without asking for a URL. Files
 *           older than DISK_REFRESH_MS are refreshed when online and still
 *           served when not. The OS may purge the cache directory at will.
 *   WEB     fetch → arrayBuffer, memory cache only (expo-file-system has no
 *           web implementation).
 *
 * GUEST RULE: lab assets used here are `public`-tier teaching material — the
 * edge fn needs no account, so a signed-out learner loads them too.
 *
 * ACCOUNT WIPE: the cache holds shared, public, non-user content. The decoded
 * memory copies are dropped by resetLabClipMemory(), registered with the wipe
 * (localStoreRegistry) when this module is first evaluated — the wipe does not
 * import it, so the decoder stays out of app start (perf start trim
 * 2026-10-04); a session that never loaded a clip has no copies to drop. The
 * disk copies are identical for every user and stay, like the glossary catalog.
 *
 * Nothing here plays audio. Playback stays behind the app-wide output gate
 * (renderRecorded.ts / useRecordedPlayback.ts → EarClipPlayer).
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { fetchLabAudio } from './labAudio';
import { registerLocalStoreReset } from '../storage/localStoreRegistry';
import {
  LabClipCache, LabClipError, base64ToBytes, bytesToBase64,
  type FetchedBytes, type LabClipBuffer, type LabClipDisk, type ResolveResult,
} from './labClipCache';

export { LabClipError, isLabClipError, type LabClipBuffer, type LabClipErrorCode } from './labClipCache';

/** Longest the signed-URL request may take (same budget as LabAudioPlayer). */
export const CLIP_URL_TIMEOUT_MS = 8000;
/** Longest the byte download may take. A 30 s stereo 24-bit WAV is ~8.6 MB. */
export const CLIP_FETCH_TIMEOUT_MS = 45000;
/** A disk copy older than this is re-fetched when online (still used offline). */
export const DISK_REFRESH_MS = 30 * 24 * 3600 * 1000;
/** Bump to invalidate every on-disk copy (a changed file layout). */
const DISK_VERSION = 'v1';

const isWeb = Platform.OS === 'web';
const diskDir = !isWeb && FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}lab-clips/${DISK_VERSION}/` : null;

function withTimeout<T>(p: Promise<T>, ms: number, onTimeout: () => T | Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    p,
    new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => {
        Promise.resolve()
          .then(onTimeout)
          .then(resolve, reject);
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function resolveUrl(labKey: string, assetKey: string): Promise<ResolveResult> {
  const { asset, reason } = await withTimeout(fetchLabAudio(labKey, assetKey), CLIP_URL_TIMEOUT_MS, () => ({
    asset: null,
    reason: 'network' as const,
  }));
  if (asset) return { url: asset.url };
  return { reason: reason === 'ok' ? 'network' : reason };
}

function httpError(status: number): LabClipError {
  if (status === 401 || status === 403) return new LabClipError('unauthorized', `HTTP ${status}`);
  if (status === 404 || status === 400) return new LabClipError('not_found', `HTTP ${status}`);
  return new LabClipError('offline', `HTTP ${status}`);
}

let tmpNonce = 0;

async function fetchNative(url: string, key: string): Promise<FetchedBytes> {
  if (!diskDir) throw new LabClipError('offline', 'No cache directory');
  await FileSystem.makeDirectoryAsync(diskDir, { intermediates: true }).catch(() => {});
  const final = `${diskDir}${key}.wav`;
  const tmp = `${diskDir}${key}.${Date.now().toString(36)}_${tmpNonce++}.part`;
  const task = FileSystem.createDownloadResumable(url, tmp);
  let res: Awaited<ReturnType<typeof task.downloadAsync>>;
  try {
    res = await withTimeout(task.downloadAsync(), CLIP_FETCH_TIMEOUT_MS, async () => {
      await task.cancelAsync().catch(() => {});
      throw new LabClipError('offline', 'Download timed out');
    });
  } catch (e) {
    await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
    if (e instanceof LabClipError) throw e;
    throw new LabClipError('offline', (e as Error)?.message);
  }
  if (!res || res.status < 200 || res.status >= 300) {
    await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
    throw res ? httpError(res.status) : new LabClipError('offline', 'Download cancelled');
  }
  // Complete file only: the final name never holds a partial download.
  await FileSystem.deleteAsync(final, { idempotent: true }).catch(() => {});
  await FileSystem.moveAsync({ from: tmp, to: final });
  const b64 = await FileSystem.readAsStringAsync(final, { encoding: FileSystem.EncodingType.Base64 });
  return { bytes: base64ToBytes(b64), persisted: true };
}

async function fetchWeb(url: string, signal: AbortSignal): Promise<FetchedBytes> {
  let res: Response;
  try {
    const ctl = new AbortController();
    const relay = () => ctl.abort();
    signal.addEventListener('abort', relay, { once: true });
    res = await withTimeout(fetch(url, { signal: ctl.signal }), CLIP_FETCH_TIMEOUT_MS, () => {
      ctl.abort();
      throw new LabClipError('offline', 'Download timed out');
    });
    signal.removeEventListener('abort', relay);
  } catch (e) {
    if (e instanceof LabClipError) throw e;
    throw new LabClipError('offline', (e as Error)?.message);
  }
  if (!res.ok) throw httpError(res.status);
  try {
    return { bytes: new Uint8Array(await res.arrayBuffer()) };
  } catch (e) {
    throw new LabClipError('offline', (e as Error)?.message);
  }
}

const nativeDisk: LabClipDisk | null = diskDir
  ? {
      async read(key) {
        const uri = `${diskDir}${key}.wav`;
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || info.isDirectory) return null;
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const ageMs = Date.now() - (info.modificationTime ?? 0) * 1000;
        return { bytes: base64ToBytes(b64), stale: ageMs > DISK_REFRESH_MS };
      },
      async write(key, bytes) {
        await FileSystem.makeDirectoryAsync(diskDir, { intermediates: true }).catch(() => {});
        await FileSystem.writeAsStringAsync(`${diskDir}${key}.wav`, bytesToBase64(bytes), {
          encoding: FileSystem.EncodingType.Base64,
        });
      },
      async remove(key) {
        await FileSystem.deleteAsync(`${diskDir}${key}.wav`, { idempotent: true });
      },
    }
  : null;

/** The app-wide clip cache (one per JS runtime). */
export const labClipCache = new LabClipCache({
  resolveUrl,
  fetchBytes: (url, key, signal) => (isWeb ? fetchWeb(url, signal) : fetchNative(url, key)),
  disk: nativeDisk,
});

/**
 * Fetch, decode and resample one lab asset to 48 kHz. Rejects only with a
 * LabClipError: 'offline' | 'not_found' | 'unauthorized' | 'decode' |
 * 'aborted' (the caller's signal fired).
 */
export function loadLabClipBuffer(
  labKey: string,
  assetKey: string,
  opts?: { signal?: AbortSignal },
): Promise<LabClipBuffer> {
  return labClipCache.load(labKey, assetKey, opts);
}

/** The decoded clip if already in memory, else undefined. Synchronous. */
export function peekLabClipBuffer(labKey: string, assetKey: string): LabClipBuffer | undefined {
  return labClipCache.peek(labKey, assetKey);
}

/** Account wipe: drop the decoded copies (public content; disk copies stay). */
export function resetLabClipMemory(): void {
  labClipCache.clearMemory();
}
registerLocalStoreReset(resetLabClipMemory);
