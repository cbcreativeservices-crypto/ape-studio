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

/** RN lacks btoa on some engines — tiny local base64 for Uint8Array. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : '=';
    out += i + 2 < bytes.length ? B64[c & 63] : '=';
  }
  return out;
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
  await FileSystem.writeAsStringAsync(uri, toBase64(wav), { encoding: FileSystem.EncodingType.Base64 });
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

  /** Load a trial's clips (index-addressed). Previous files are deleted. */
  async load(bufs: Buf[]): Promise<void> {
    await this.unloadFiles();
    // Playback category: play even with the iOS silent switch on — a training
    // clip the learner explicitly started is content, not a notification.
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const uris = await Promise.all(bufs.map((b) => bufToWavFile(b)));
    this.files = uris;
    uris.forEach((uri, i) => {
      const existing = this.players.get(i);
      if (existing) existing.replace({ uri });
      else this.players.set(i, createAudioPlayer({ uri }));
    });
    // Drop any leftover players beyond this trial's clip count.
    for (const [i, p] of [...this.players]) {
      if (i >= uris.length) {
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
    for (const [, p] of this.players) p.remove();
    this.players.clear();
    void this.unloadFiles();
  }
}
