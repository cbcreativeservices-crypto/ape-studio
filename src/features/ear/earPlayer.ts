/**
 * earPlayer — plays rendered ear-training stimuli (spec §3).
 *
 * Pipeline: Float32 PCM (earDsp) → 16-bit WAV bytes → base64 file in the app
 * cache → expo-audio player. File-based because iOS AVPlayer does not accept
 * data: URIs reliably; expo-file-system ships inside the expo core, so this
 * works on the CURRENT dev client with no rebuild.
 *
 * One player per transport chip, created lazily and reused via replace();
 * everything is torn down by dispose(). All playback still sits behind the
 * app-wide audio gate — the SCREEN asks requestAudioOutput() before the first
 * play; this module never plays on its own.
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { encodeWav, type Buf } from './earDsp';

/** RN lacks btoa on some engines — tiny local base64 for Uint8Array.
 *
 *  Sliced, with a breath between slices. The mixing lab's clip is a 10 s
 *  STEREO loop: 1.92 MB of WAV → ~2.56 M base64 characters, which measured
 *  76 ms in Node as one uninterrupted block — several times that on a phone's
 *  JS thread, and multiplied by the two-to-four variants a page loads at once
 *  (177 ms in Node for two). That block sat AFTER the mixing lab's carefully
 *  staged renders, so it was the last place the whole app still froze on a
 *  tap (the 2026-09-11 device-freeze class). The returned string is
 *  byte-identical to the single-pass version: the slice length is a multiple
 *  of 3, so no 3-byte group is ever split and only the true final group can
 *  take padding. Only WHEN the work happens changed. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** Bytes encoded per breath. MUST stay a multiple of 3. ~7 ms per slice in
 *  Node, so roughly one frame's worth on a phone. */
const B64_SLICE = 196608;
async function toBase64(bytes: Uint8Array): Promise<string> {
  const parts: string[] = [];
  for (let start = 0; start < bytes.length; start += B64_SLICE) {
    const end = Math.min(start + B64_SLICE, bytes.length);
    let out = '';
    for (let i = start; i < end; i += 3) {
      const a = bytes[i];
      const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
      out += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : '=';
      out += i + 2 < bytes.length ? B64[c & 63] : '=';
    }
    parts.push(out);
    if (end < bytes.length) await new Promise<void>((r) => setTimeout(r, 0));
  }
  return parts.join('');
}

let fileNonce = 0;
const isWeb = Platform.OS === 'web';

/**
 * Turn a rendered buffer into a playable uri. Native: base64 → cache WAV file
 * (iOS AVPlayer wants a real file). Web: expo-file-system has no web
 * implementation, so use a blob: URL — the browser's audio element takes it
 * directly. Caller cleans up via freeWavUri().
 */
export async function bufToWavFile(buf: Buf): Promise<string> {
  const wav = encodeWav(buf);
  if (isWeb) {
    const copy = new Uint8Array(wav); // detach from any pooled buffer view
    return URL.createObjectURL(new Blob([copy.buffer], { type: 'audio/wav' }));
  }
  const uri = `${FileSystem.cacheDirectory}ear_${Date.now().toString(36)}_${fileNonce++}.wav`;
  await FileSystem.writeAsStringAsync(uri, await toBase64(wav), { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}

async function freeWavUri(uri: string): Promise<void> {
  if (isWeb) {
    try {
      URL.revokeObjectURL(uri);
    } catch {}
    return;
  }
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}

export class EarClipPlayer {
  private players = new Map<number, AudioPlayer>();
  private files: string[] = [];
  private activeIdx: number | null = null;
  private subs = new Map<number, { remove: () => void }>();
  /** Terminal once dispose() has run. load() spans many ticks (one WAV encode
   *  + base64 + file write per clip, with breaths inside toBase64), so a screen
   *  torn down mid-load used to let the rest of the load run against a disposed
   *  instance: it re-populated `this.files` AFTER unloadFiles() had emptied it
   *  and created fresh expo-audio players + listeners that nothing would ever
   *  remove — leaked native players and ~2 MB temp WAVs per occurrence, orphaned
   *  because the caller has already dropped its reference (perf audit
   *  2026-09-11). dispose() is terminal at every call site, so bailing out is
   *  behaviour-preserving on every live path. */
  private disposed = false;
  /** ADDITIVE (2026-09-11, mixing lab): called when clip `i` finishes playing
   *  naturally, so a UI's ▶/■ state can stop claiming "playing" over silence.
   *  Optional — the ear lab's existing behaviour is unchanged when unset. */
  onEnded: ((i: number) => void) | null = null;

  /** Load a trial's clips (index-addressed). Previous files are deleted. */
  async load(bufs: Buf[]): Promise<void> {
    if (this.disposed) return;
    await this.unloadFiles();
    // Playback category: play even with the iOS silent switch on — a training
    // clip the learner explicitly started is content, not a notification.
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    // ONE CLIP AT A TIME, not Promise.all: the WAV encode and base64 pass are
    // synchronous, so mapping them eagerly ran every clip's encode back-to-back
    // in a single tick (two 10 s stereo mixing-lab variants measured 177 ms in
    // Node, and pages load up to four). Sequential + the breaths inside
    // toBase64 keep the JS thread free between clips. Same files, same order.
    if (this.disposed) return;
    const uris: string[] = [];
    for (const b of bufs) {
      const uri = await bufToWavFile(b);
      uris.push(uri);
      // Torn down mid-load: delete what we have already written and stop before
      // any player is created. Nothing else holds these paths.
      if (this.disposed) {
        await Promise.all(uris.map((u) => freeWavUri(u)));
        return;
      }
    }
    this.files = uris;
    uris.forEach((uri, i) => {
      const existing = this.players.get(i);
      if (existing) existing.replace({ uri });
      else {
        const p = createAudioPlayer({ uri });
        this.players.set(i, p);
        try {
          const sub = p.addListener('playbackStatusUpdate', (st: { didJustFinish?: boolean }) => {
            if (st?.didJustFinish && this.activeIdx === i) {
              this.activeIdx = null;
              this.onEnded?.(i);
            }
          });
          this.subs.set(i, sub);
        } catch {
          // Older expo-audio without the event: the callback simply never
          // fires; callers must not depend on it for correctness.
        }
      }
    });
    // Drop any leftover players beyond this trial's clip count.
    for (const [i, p] of [...this.players]) {
      if (i >= uris.length) {
        this.subs.get(i)?.remove();
        this.subs.delete(i);
        p.remove();
        this.players.delete(i);
      }
    }
    this.activeIdx = null;
  }

  /** Play clip i from the start (stops any other clip). */
  play(i: number): void {
    for (const [j, p] of this.players) if (j !== i) p.pause();
    const p = this.players.get(i);
    if (!p) return;
    void p.seekTo(0);
    p.play();
    this.activeIdx = i;
  }

  stop(): void {
    for (const [, p] of this.players) p.pause();
    this.activeIdx = null;
  }

  get active(): number | null {
    return this.activeIdx;
  }

  private async unloadFiles(): Promise<void> {
    const old = this.files;
    this.files = [];
    await Promise.all(old.map((u) => freeWavUri(u)));
  }

  dispose(): void {
    this.disposed = true;
    for (const [, s] of this.subs) s.remove();
    this.subs.clear();
    for (const [, p] of this.players) p.remove();
    this.players.clear();
    void this.unloadFiles();
  }
}
