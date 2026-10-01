/**
 * wavDecode — a pure RIFF/WAVE decoder (2026-10-01, "read recorded files and
 * process them in the app's own code"). No React, no native module: it runs in
 * Node (tests), Hermes (iOS/Android) and the browser alike, so it ships in an
 * OTA update.
 *
 * Supported:
 *   • WAVE_FORMAT_PCM (1): 8-bit unsigned, 16 / 24 / 32-bit signed integer
 *   • WAVE_FORMAT_IEEE_FLOAT (3): 32 / 64-bit float
 *   • WAVE_FORMAT_EXTENSIBLE (0xFFFE) whose sub-format GUID is PCM or float
 * Unknown chunks (LIST, bext, iXML, JUNK, fact, cue, …) are skipped, and the
 * RIFF pad byte after an odd-sized chunk is honoured.
 *
 * Output: one Float32Array per channel, samples in −1..1 (integer formats are
 * scaled by their full-scale code; float files are passed through as stored).
 *
 * Tolerance: a data chunk whose declared size runs past the end of the file
 * (a recorder that never patched its header, or a size of 0xFFFFFFFF) is
 * clamped to the whole frames actually present — the audio is still good.
 *
 * Speed: the hot loops read a Uint8Array / aligned typed-array view — never a
 * DataView call per sample (DataView is several times slower on Hermes).
 */

export type WavDecodeErrorCode =
  /** Not a RIFF file (or too short to be one). */
  | 'not_riff'
  /** RIFF, but not WAVE (AVI, RF64, …). */
  | 'not_wave'
  /** No `fmt ` chunk before the data, or one too short to read. */
  | 'no_fmt'
  /** No `data` chunk. */
  | 'no_data'
  /** A format tag this decoder does not read (ADPCM, µ-law, MP3-in-WAV, …). */
  | 'unsupported_format'
  /** A bit depth this decoder does not read for that format (e.g. 12-bit). */
  | 'unsupported_bit_depth'
  /** Header fields that cannot describe real audio (0 channels, 0 Hz, …). */
  | 'corrupt';

export class WavDecodeError extends Error {
  readonly code: WavDecodeErrorCode;
  constructor(code: WavDecodeErrorCode, message: string) {
    super(message);
    this.name = 'WavDecodeError';
    this.code = code;
  }
}

export interface DecodedAudio {
  sampleRate: number;
  /** One array per channel, all `frames` long, samples in −1..1. */
  channels: Float32Array[];
  frames: number;
}

export const WAVE_FORMAT_PCM = 1;
export const WAVE_FORMAT_IEEE_FLOAT = 3;
export const WAVE_FORMAT_EXTENSIBLE = 0xfffe;

/** The 14 bytes every KSDATAFORMAT_SUBTYPE_* GUID shares after its 2-byte tag. */
const GUID_TAIL = [0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71];

export interface WavInfo {
  /** The EFFECTIVE format: 1 (PCM) or 3 (float) — extensible is resolved. */
  format: 1 | 3;
  channels: number;
  sampleRate: number;
  /** Container bits per sample (8/16/24/32/64). */
  bitsPerSample: number;
  /** Bytes per frame as declared (≥ channels × bytes per sample). */
  blockAlign: number;
  /** Byte offset of the first sample, and the usable byte length (whole frames). */
  dataOffset: number;
  dataBytes: number;
  frames: number;
}

const LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

function u16(b: Uint8Array, o: number): number {
  return b[o] | (b[o + 1] << 8);
}
function u32(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}
function id4(b: Uint8Array, o: number): string {
  return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
}

function asBytes(input: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (input instanceof Uint8Array) return input;
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  return new Uint8Array(input);
}

/** Read and validate the header without decoding any samples. */
export function parseWavHeader(input: ArrayBuffer | ArrayBufferView): WavInfo {
  const b = asBytes(input);
  if (b.length < 12 || id4(b, 0) !== 'RIFF') {
    throw new WavDecodeError(b.length >= 4 && id4(b, 0) === 'RF64' ? 'not_wave' : 'not_riff', 'Not a RIFF/WAVE file');
  }
  if (id4(b, 8) !== 'WAVE') throw new WavDecodeError('not_wave', 'RIFF file is not WAVE');

  let fmt: { tag: number; channels: number; rate: number; blockAlign: number; bits: number } | null = null;
  let dataOffset = -1;
  let dataSize = 0;
  let o = 12;
  while (o + 8 <= b.length) {
    const id = id4(b, o);
    const size = u32(b, o + 4);
    const body = o + 8;
    if (id === 'fmt ') {
      if (size < 16 || body + 16 > b.length) throw new WavDecodeError('no_fmt', 'fmt chunk too short');
      let tag = u16(b, body);
      const channels = u16(b, body + 2);
      const rate = u32(b, body + 4);
      const blockAlign = u16(b, body + 12);
      const bits = u16(b, body + 14);
      if (tag === WAVE_FORMAT_EXTENSIBLE) {
        // cbSize(2) validBits(2) channelMask(4) subFormat GUID(16) → needs 40.
        if (size < 40 || body + 40 > b.length) throw new WavDecodeError('corrupt', 'Extensible fmt chunk too short');
        const g = body + 24;
        tag = u16(b, g);
        for (let i = 0; i < GUID_TAIL.length; i++) {
          if (b[g + 2 + i] !== GUID_TAIL[i]) {
            throw new WavDecodeError('unsupported_format', 'Extensible sub-format is not PCM or float');
          }
        }
      }
      fmt = { tag, channels, rate, blockAlign, bits };
    } else if (id === 'data') {
      dataOffset = body;
      dataSize = size;
      break; // everything we need is in hand; trailing chunks are irrelevant
    }
    // Next chunk: size plus the RIFF pad byte when the size is odd.
    const next = body + size + (size & 1);
    if (next <= o) break; // defensive: a wrapped size can never move backwards
    o = next;
  }

  if (dataOffset < 0) {
    throw new WavDecodeError(fmt ? 'no_data' : 'no_fmt', fmt ? 'No data chunk' : 'No fmt chunk');
  }
  if (!fmt) throw new WavDecodeError('no_fmt', 'data chunk before any fmt chunk');

  const { tag, channels, rate, bits } = fmt;
  if (tag !== WAVE_FORMAT_PCM && tag !== WAVE_FORMAT_IEEE_FLOAT) {
    throw new WavDecodeError('unsupported_format', `WAV format tag ${tag} is not supported`);
  }
  if (tag === WAVE_FORMAT_PCM && bits !== 8 && bits !== 16 && bits !== 24 && bits !== 32) {
    throw new WavDecodeError('unsupported_bit_depth', `${bits}-bit PCM is not supported`);
  }
  if (tag === WAVE_FORMAT_IEEE_FLOAT && bits !== 32 && bits !== 64) {
    throw new WavDecodeError('unsupported_bit_depth', `${bits}-bit float is not supported`);
  }
  if (channels < 1 || channels > 32) throw new WavDecodeError('corrupt', `Channel count ${channels} is invalid`);
  if (rate < 1000 || rate > 768000) throw new WavDecodeError('corrupt', `Sample rate ${rate} is invalid`);
  const minAlign = channels * (bits / 8);
  // Some writers leave blockAlign 0 or wrong; anything below the minimum
  // cannot be a real stride, so use the computed one.
  const blockAlign = fmt.blockAlign >= minAlign ? fmt.blockAlign : minAlign;

  const available = Math.max(0, b.length - dataOffset);
  const declared = dataSize === 0xffffffff ? available : dataSize;
  const frames = Math.floor(Math.min(declared, available) / blockAlign);
  return {
    format: tag as 1 | 3,
    channels,
    sampleRate: rate,
    bitsPerSample: bits,
    blockAlign,
    dataOffset,
    dataBytes: frames * blockAlign,
    frames,
  };
}

/** Decode a whole WAV file to per-channel Float32 in −1..1. */
export function decodeWav(input: ArrayBuffer | ArrayBufferView): DecodedAudio {
  const b = asBytes(input);
  const info = parseWavHeader(b);
  const { channels: nc, frames, blockAlign, bitsPerSample: bits, format } = info;
  const out: Float32Array[] = [];
  for (let c = 0; c < nc; c++) out.push(new Float32Array(frames));
  if (frames === 0) return { sampleRate: info.sampleRate, channels: out, frames: 0 };

  const bps = bits / 8;
  const start = info.dataOffset;
  // Tightly packed + little-endian host → a typed-array view over the data
  // (copied once into an aligned buffer if the offset is not aligned).
  const packed = blockAlign === nc * bps && LITTLE_ENDIAN;
  const view = <T>(Ctor: { new (buf: ArrayBuffer, off: number, len: number): T; BYTES_PER_ELEMENT: number }): T => {
    const abs = b.byteOffset + start;
    if (abs % Ctor.BYTES_PER_ELEMENT === 0) return new Ctor(b.buffer as ArrayBuffer, abs, frames * nc);
    const copy = b.slice(start, start + frames * nc * Ctor.BYTES_PER_ELEMENT);
    return new Ctor(copy.buffer, 0, frames * nc);
  };

  if (format === WAVE_FORMAT_IEEE_FLOAT) {
    if (packed) {
      const src = bits === 32 ? view(Float32Array) : view(Float64Array);
      for (let c = 0; c < nc; c++) {
        const ch = out[c];
        for (let i = 0, k = c; i < frames; i++, k += nc) ch[i] = src[k];
      }
    } else {
      const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
      for (let i = 0; i < frames; i++) {
        const f = start + i * blockAlign;
        for (let c = 0; c < nc; c++) {
          out[c][i] = bits === 32 ? dv.getFloat32(f + c * bps, true) : dv.getFloat64(f + c * bps, true);
        }
      }
    }
    return { sampleRate: info.sampleRate, channels: out, frames };
  }

  // Integer PCM.
  if (bits === 16 && packed) {
    const src = view(Int16Array);
    const s = 1 / 32768;
    for (let c = 0; c < nc; c++) {
      const ch = out[c];
      for (let i = 0, k = c; i < frames; i++, k += nc) ch[i] = src[k] * s;
    }
  } else if (bits === 32 && packed) {
    const src = view(Int32Array);
    const s = 1 / 2147483648;
    for (let c = 0; c < nc; c++) {
      const ch = out[c];
      for (let i = 0, k = c; i < frames; i++, k += nc) ch[i] = src[k] * s;
    }
  } else if (bits === 24) {
    // No 24-bit typed array: assemble from bytes. `<< 8 >> 8` sign-extends.
    const s = 1 / 8388608;
    for (let c = 0; c < nc; c++) {
      const ch = out[c];
      for (let i = 0, p = start + c * 3; i < frames; i++, p += blockAlign) {
        ch[i] = (((b[p] | (b[p + 1] << 8) | (b[p + 2] << 16)) << 8) >> 8) * s;
      }
    }
  } else if (bits === 8) {
    const s = 1 / 128;
    for (let c = 0; c < nc; c++) {
      const ch = out[c];
      for (let i = 0, p = start + c; i < frames; i++, p += blockAlign) ch[i] = (b[p] - 128) * s;
    }
  } else if (bits === 16) {
    const s = 1 / 32768;
    for (let c = 0; c < nc; c++) {
      const ch = out[c];
      for (let i = 0, p = start + c * 2; i < frames; i++, p += blockAlign) {
        ch[i] = (((b[p] | (b[p + 1] << 8)) << 16) >> 16) * s;
      }
    }
  } else {
    // 32-bit, padded stride or big-endian host.
    const s = 1 / 2147483648;
    for (let c = 0; c < nc; c++) {
      const ch = out[c];
      for (let i = 0, p = start + c * 4; i < frames; i++, p += blockAlign) {
        ch[i] = (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) * s;
      }
    }
  }
  return { sampleRate: info.sampleRate, channels: out, frames };
}

/** True when the bytes start like a RIFF/WAVE file (cheap sniff, no throw). */
export function looksLikeWav(input: ArrayBuffer | ArrayBufferView): boolean {
  const b = asBytes(input);
  return b.length >= 12 && id4(b, 0) === 'RIFF' && id4(b, 8) === 'WAVE';
}
