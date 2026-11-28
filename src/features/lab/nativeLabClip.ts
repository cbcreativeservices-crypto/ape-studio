/**
 * nativeLabClip — "load a lab-audio asset into the NATIVE clip source"
 * (engine 13, 2026-11-27, build must-do D16 / A15).
 *
 *   const r = await loadNativeLabClip('demo_signals', 'piano-chord-1', { signal });
 *   if (r.ok) {
 *     ApeDsp.genSet({ levelDb: -20, clip: { loop: true, gainDb: 0 }, mode: GEN_MODES.clip });
 *     await startFenced({ start: () => ApeDsp.genStart(), stop: () => ApeDsp.genStop(), isCurrent });
 *   }
 *
 * The pure engine (order of a load, typed errors, refetch of a bad copy,
 * offline fallback) is nativeLabClipCore.ts. The FILE side REUSES the JS clip
 * labs' path in labClipBuffer.ts (nativeClipFiles): the same `lab-audio` edge
 * function (labAudio.fetchLabAudio → 120 s signed URL, the one Supabase
 * client), the same timeouts, the same app CACHE directory root
 * (`lab-clips/`, never shared storage), the same 30-day refresh rule. The file
 * keeps its own extension (the published AAC is .m4a) and is never read into
 * JS — the native decoder takes the path.
 *
 * Nothing here plays sound. Not on the app-start path: require it on demand
 * (the dev harness does). The disk copies are public, identical for every
 * user, and stay through the account wipe like labClipBuffer's.
 */
import { ApeDsp } from '../../../modules/ape-dsp';
import { nativeClipFiles } from './labClipBuffer';
import { loadNativeLabClip as loadCore, type NativeClipDeps, type NativeClipLoad } from './nativeLabClipCore';

export type { NativeClipErrorCode, NativeClipLoad } from './nativeLabClipCore';

const deps: NativeClipDeps = {
  available: () => ApeDsp.clipAvailable(),
  loadClip: (uri) => ApeDsp.loadClip(uri),
  ...nativeClipFiles,
};

/**
 * Fetch (or reuse the cached copy of) one lab-audio asset and load it into the
 * native clip source. Resolves — never rejects — with the clip's facts, or
 * { ok: false, error: 'unavailable' | 'offline' | 'not_found' | 'unauthorized'
 * | 'decode' | 'aborted' }. On web and older binaries: 'unavailable', with no
 * network and no disk touched. Does not start sound.
 */
export function loadNativeLabClip(
  labKey: string,
  assetKey: string,
  opts?: { signal?: AbortSignal },
): Promise<NativeClipLoad> {
  return loadCore(labKey, assetKey, deps, opts);
}
