/**
 * Reading recorded files and processing them in the app's own code
 * (2026-10-01): the WAV decoder, the 48 kHz resampler, the lab clip cache, the
 * recorded-render helpers, and the Ear Training real-source integration.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { decodeWav, parseWavHeader, WavDecodeError } = await import('../src/features/audio/wavDecode.ts');
const { resample, resampleAsync, resampledLength, toMono, ensureStereo, trim, loopSlice } = await import(
  '../src/features/audio/resample.ts'
);
const { LabClipCache, LabClipError, clipKey, base64ToBytes, bytesToBase64 } = await import(
  '../src/features/lab/labClipCache.ts'
);
const { renderRecorded, playRendered } = await import('../src/features/audio/renderRecorded.ts');
const { M2_EQ, M3_BAND, BANDS } = await import('../src/features/ear/modules/tone.ts');
const { EAR_SOURCES, programFromClip, resolveEarSource, earSourceById } = await import(
  '../src/features/ear/earPrograms.ts'
);
const { bandDb } = await import('../src/features/ear/earDsp.ts');

// ————————————————————————————— WAV builder ——————————————————————————————————

type Fmt = { tag: number; bits: number; extensible?: boolean; subTag?: number; blockAlign?: number };

function chunk(id: string, body: Uint8Array): Uint8Array {
  const pad = body.length & 1;
  const out = new Uint8Array(8 + body.length + pad);
  for (let i = 0; i < 4; i++) out[i] = id.charCodeAt(i);
  new DataView(out.buffer).setUint32(4, body.length, true);
  out.set(body, 8);
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const GUID_TAIL = [0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71];

function fmtChunk(f: Fmt, channels: number, rate: number): Uint8Array {
  const ext = !!f.extensible;
  const body = new Uint8Array(ext ? 40 : 16);
  const dv = new DataView(body.buffer);
  const align = f.blockAlign ?? channels * (f.bits / 8);
  dv.setUint16(0, ext ? 0xfffe : f.tag, true);
  dv.setUint16(2, channels, true);
  dv.setUint32(4, rate, true);
  dv.setUint32(8, rate * align, true);
  dv.setUint16(12, align, true);
  dv.setUint16(14, f.bits, true);
  if (ext) {
    dv.setUint16(16, 22, true);
    dv.setUint16(18, f.bits, true);
    dv.setUint32(20, channels === 2 ? 3 : 4, true);
    dv.setUint16(24, f.subTag ?? f.tag, true);
    body.set(GUID_TAIL, 26);
  }
  return chunk('fmt ', body);
}

/** Encode per-channel float samples as the given format. */
function dataBody(f: Fmt, chans: number[][]): Uint8Array {
  const nc = chans.length;
  const frames = chans[0].length;
  const bps = f.bits / 8;
  const align = f.blockAlign ?? nc * bps;
  const body = new Uint8Array(frames * align);
  const dv = new DataView(body.buffer);
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < nc; c++) {
      const v = chans[c][i];
      const o = i * align + c * bps;
      if (f.tag === 3) {
        if (f.bits === 32) dv.setFloat32(o, v, true);
        else dv.setFloat64(o, v, true);
      } else if (f.bits === 8) dv.setUint8(o, Math.max(0, Math.min(255, Math.round(v * 128) + 128)));
      else if (f.bits === 16) dv.setInt16(o, Math.max(-32768, Math.min(32767, Math.round(v * 32768))), true);
      else if (f.bits === 24) {
        const x = Math.max(-8388608, Math.min(8388607, Math.round(v * 8388608)));
        dv.setUint8(o, x & 255);
        dv.setUint8(o + 1, (x >> 8) & 255);
        dv.setUint8(o + 2, (x >> 16) & 255);
      } else dv.setInt32(o, Math.max(-2147483648, Math.min(2147483647, Math.round(v * 2147483648))), true);
    }
  }
  return body;
}

function wav(f: Fmt, chans: number[][], rate = 48000, opts: { before?: Uint8Array[]; after?: Uint8Array[] } = {}): Uint8Array {
  const parts = [fmtChunk(f, chans.length, rate), ...(opts.before ?? []), chunk('data', dataBody(f, chans)), ...(opts.after ?? [])];
  const body = concat(parts);
  const head = new Uint8Array(12);
  head.set([0x52, 0x49, 0x46, 0x46], 0);
  new DataView(head.buffer).setUint32(4, 4 + body.length, true);
  head.set([0x57, 0x41, 0x56, 0x45], 8);
  return concat([head, body]);
}

const SAMPLES = [0, 0.5, -0.5, 0.25, -1, 0.999, -0.125, 0.75];
const RIGHT = SAMPLES.map((v) => -v * 0.5);

function close(a: Float32Array, b: number[], tol: number, what: string): void {
  assert.equal(a.length, b.length, `${what}: length`);
  for (let i = 0; i < b.length; i++) assert.ok(Math.abs(a[i] - b[i]) <= tol, `${what}[${i}]: ${a[i]} vs ${b[i]}`);
}

// ————————————————————————————— wavDecode ————————————————————————————————————

describe('wavDecode', () => {
  const cases: [string, Fmt, number][] = [
    ['8-bit PCM', { tag: 1, bits: 8 }, 1 / 128],
    ['16-bit PCM', { tag: 1, bits: 16 }, 1 / 32768],
    ['24-bit PCM', { tag: 1, bits: 24 }, 1 / 8388608],
    ['32-bit PCM', { tag: 1, bits: 32 }, 1e-7],
    ['float32', { tag: 3, bits: 32 }, 1e-7],
    ['float64', { tag: 3, bits: 64 }, 1e-7],
    ['extensible PCM 24', { tag: 1, bits: 24, extensible: true }, 1 / 8388608],
    ['extensible float32', { tag: 3, bits: 32, extensible: true }, 1e-7],
  ];
  for (const [name, f, tol] of cases) {
    it(`decodes ${name} stereo`, () => {
      const d = decodeWav(wav(f, [SAMPLES, RIGHT], 44100));
      assert.equal(d.sampleRate, 44100);
      assert.equal(d.frames, SAMPLES.length);
      assert.equal(d.channels.length, 2);
      close(d.channels[0], SAMPLES, tol + 1e-9, `${name} L`);
      close(d.channels[1], RIGHT, tol + 1e-9, `${name} R`);
    });
  }

  it('decodes mono 16-bit', () => {
    const d = decodeWav(wav({ tag: 1, bits: 16 }, [SAMPLES]));
    assert.equal(d.channels.length, 1);
    close(d.channels[0], SAMPLES, 1 / 32768, 'mono');
  });

  it('skips unknown chunks, honours odd-size padding, and reads an ArrayBuffer at an unaligned offset', () => {
    const odd = chunk('LIST', new Uint8Array([1, 2, 3, 4, 5])); // 5 bytes + pad
    const junk = chunk('JUNK', new Uint8Array(27));
    const bext = chunk('bext', new Uint8Array(13));
    const file = wav({ tag: 1, bits: 16 }, [SAMPLES, RIGHT], 48000, {
      before: [odd, junk, bext],
      after: [chunk('cue ', new Uint8Array(3))],
    });
    // data now starts at an odd byte offset relative to a misaligned view too
    const host = new Uint8Array(file.length + 1);
    host.set(file, 1);
    const d = decodeWav(host.subarray(1));
    close(d.channels[0], SAMPLES, 1 / 32768, 'L');
    close(d.channels[1], RIGHT, 1 / 32768, 'R');
    // fmt AFTER a junk chunk works too
    const swapped = concat([
      new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]),
      chunk('iXML', new Uint8Array(9)),
      fmtChunk({ tag: 3, bits: 32 }, 1, 48000),
      chunk('fact', new Uint8Array(4)),
      chunk('data', dataBody({ tag: 3, bits: 32 }, [SAMPLES])),
    ]);
    close(decodeWav(swapped.buffer).channels[0], SAMPLES, 1e-7, 'float after junk');
  });

  it('honours a padded blockAlign stride', () => {
    const f: Fmt = { tag: 1, bits: 24, blockAlign: 8 }; // 24-bit stereo in 4-byte slots
    const d = decodeWav(wav(f, [SAMPLES, RIGHT]));
    close(d.channels[0], SAMPLES, 1 / 8388608, 'L');
    close(d.channels[1], RIGHT, 1 / 8388608, 'R');
  });

  it('clamps a data chunk that claims more bytes than the file holds', () => {
    const file = wav({ tag: 1, bits: 16 }, [SAMPLES, RIGHT]);
    const cut = file.subarray(0, file.length - 5); // lose 1.25 frames
    const view = new DataView(cut.buffer, cut.byteOffset);
    assert.equal(view.getUint32(40, true), SAMPLES.length * 4); // declared size untouched
    const d = decodeWav(cut);
    assert.equal(d.frames, SAMPLES.length - 2);
  });

  it('throws typed errors for bad input', () => {
    const code = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        assert.ok(e instanceof WavDecodeError, 'is WavDecodeError');
        return (e as InstanceType<typeof WavDecodeError>).code;
      }
      return 'no throw';
    };
    assert.equal(code(() => decodeWav(new Uint8Array(4))), 'not_riff');
    assert.equal(code(() => decodeWav(new TextEncoder().encode('OggS........................'))), 'not_riff');
    const notWave = wav({ tag: 1, bits: 16 }, [SAMPLES]);
    notWave.set([0x41, 0x56, 0x49, 0x20], 8);
    assert.equal(code(() => decodeWav(notWave)), 'not_wave');
    const noData = concat([
      new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]),
      fmtChunk({ tag: 1, bits: 16 }, 1, 48000),
    ]);
    assert.equal(code(() => decodeWav(noData)), 'no_data');
    const noFmt = concat([
      new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]),
      chunk('data', new Uint8Array(4)),
    ]);
    assert.equal(code(() => decodeWav(noFmt)), 'no_fmt');
    // Patch a valid file's header: format tag at byte 20, bits at byte 34.
    const patched = (tag: number, bits: number) => {
      const f = wav({ tag: 1, bits: 16 }, [SAMPLES]);
      const dv = new DataView(f.buffer);
      dv.setUint16(20, tag, true);
      dv.setUint16(34, bits, true);
      return f;
    };
    assert.equal(code(() => decodeWav(patched(2, 4))), 'unsupported_format'); // MS ADPCM
    assert.equal(code(() => decodeWav(patched(7, 8))), 'unsupported_format'); // µ-law
    assert.equal(code(() => decodeWav(patched(1, 12))), 'unsupported_bit_depth');
    assert.equal(code(() => decodeWav(patched(3, 16))), 'unsupported_bit_depth');
    assert.equal(code(() => decodeWav(wav({ tag: 1, bits: 16, extensible: true, subTag: 2 }, [[0]]))), 'unsupported_format');
    const zeroRate = wav({ tag: 1, bits: 16 }, [SAMPLES], 0);
    assert.equal(code(() => decodeWav(zeroRate)), 'corrupt');
  });

  it('parseWavHeader reports the effective format', () => {
    const h = parseWavHeader(wav({ tag: 3, bits: 32, extensible: true }, [SAMPLES, RIGHT], 96000));
    assert.equal(h.format, 3);
    assert.equal(h.channels, 2);
    assert.equal(h.sampleRate, 96000);
    assert.equal(h.frames, SAMPLES.length);
  });
});

// ————————————————————————————— resample ————————————————————————————————————

function sineArr(freq: number, rate: number, frames: number, amp = 0.5): Float32Array {
  const x = new Float32Array(frames);
  for (let i = 0; i < frames; i++) x[i] = amp * Math.sin((2 * Math.PI * freq * i) / rate);
  return x;
}

/** Amplitude of the `freq` component (single-bin DFT over a Hann window). */
function amplitudeAt(x: Float32Array, rate: number, freq: number, from = 0, len = x.length - from): number {
  let re = 0;
  let im = 0;
  let wsum = 0;
  for (let i = 0; i < len; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (len - 1));
    const v = x[from + i] * w;
    const ph = (2 * Math.PI * freq * i) / rate;
    re += v * Math.cos(ph);
    im -= v * Math.sin(ph);
    wsum += w;
  }
  return (2 * Math.hypot(re, im)) / wsum;
}

describe('resample', () => {
  it('is a no-op (same arrays) when the rate already matches', () => {
    const x = sineArr(1000, 48000, 480);
    const out = resample([x], 48000, 48000);
    assert.equal(out[0], x);
  });

  it('44.1 kHz → 48 kHz keeps a 1 kHz sine at frequency and amplitude, with the right length', () => {
    const x = sineArr(1000, 44100, 44100, 0.5);
    const [y] = resample([x], 44100, 48000);
    assert.equal(y.length, 48000);
    assert.equal(resampledLength(44100, 44100, 48000), 48000);
    const a = amplitudeAt(y, 48000, 1000, 4800, 38400);
    assert.ok(Math.abs(20 * Math.log10(a / 0.5)) < 0.01, `1 kHz level off by ${20 * Math.log10(a / 0.5)} dB`);
    // Zero crossings ≈ 2 per cycle → frequency within 0.1 %.
    let zc = 0;
    for (let i = 4801; i < 43200; i++) if ((y[i - 1] < 0) !== (y[i] < 0)) zc++;
    const f = zc / 2 / ((43200 - 4801) / 48000);
    assert.ok(Math.abs(f - 1000) < 1, `measured ${f} Hz`);
  });

  it('passband is flat to 20 kHz and images that would fold below 20 kHz are < −80 dB', () => {
    for (const f of [100, 5000, 15000, 19000, 20000]) {
      const [y] = resample([sineArr(f, 44100, 22050, 0.5)], 44100, 48000);
      const a = amplitudeAt(y, 48000, f, 2400, 19200);
      const db = 20 * Math.log10(a / 0.5);
      assert.ok(Math.abs(db) < 0.05, `${f} Hz passband ${db.toFixed(4)} dB`);
      // The image of f at 44.1k − f, sampled at 48 k, folds to 48k − (44.1k − f).
      const fold = 48000 - (44100 - f);
      if (fold < 24000) {
        const img = amplitudeAt(y, 48000, fold, 2400, 19200);
        const imgDb = 20 * Math.log10(img / 0.5 + 1e-12);
        assert.ok(imgDb < -80, `${f} Hz image at ${fold} Hz is ${imgDb.toFixed(1)} dB`);
      }
    }
  });

  it('48 kHz → 44.1 kHz rejects 24–28 kHz-adjacent aliases', () => {
    // 25 kHz cannot exist at 48 k, so test 23 kHz: aliases to 44.1k − 23k = 21.1 kHz.
    const [y] = resample([sineArr(23000, 48000, 24000, 0.5)], 48000, 44100);
    const alias = amplitudeAt(y, 44100, 21100, 2205, 17640);
    // 23 kHz is in the transition band (20 → 24.1 kHz): attenuated, not the spec target.
    assert.ok(20 * Math.log10(alias / 0.5) < -20);
    const [z] = resample([sineArr(1000, 48000, 24000, 0.5)], 48000, 44100);
    assert.equal(z.length, 22050);
    assert.ok(Math.abs(20 * Math.log10(amplitudeAt(z, 44100, 1000, 2205, 17640) / 0.5)) < 0.01);
  });

  it('resampleAsync matches resample sample-for-sample', async () => {
    const x = sineArr(440, 44100, 30000);
    const [a] = resample([x], 44100, 48000);
    const [b] = await resampleAsync([x], 44100, 48000, { sliceFrames: 4096 });
    assert.deepEqual(Array.from(b.subarray(0, 50)), Array.from(a.subarray(0, 50)));
    for (let i = 0; i < a.length; i++) assert.equal(a[i], b[i]);
  });

  it('odd rates use the interpolated-phase path and still track the tone', () => {
    const [y] = resample([sineArr(1000, 44056, 44056, 0.5)], 44056, 48000);
    assert.equal(y.length, 48000);
    const a = amplitudeAt(y, 48000, 1000, 4800, 38400);
    assert.ok(Math.abs(20 * Math.log10(a / 0.5)) < 0.05);
  });

  it('toMono / ensureStereo / trim / loopSlice', () => {
    const l = Float32Array.from([1, 1, 1, 1]);
    const r = Float32Array.from([0, 0, 0, 0]);
    assert.deepEqual(Array.from(toMono([l, r])), [0.5, 0.5, 0.5, 0.5]);
    assert.equal(toMono([l]), l);
    const [a, b] = ensureStereo([l]);
    assert.equal(a, l);
    assert.equal(b, l);
    assert.equal(ensureStereo([l, r, l])[1], r);
    assert.deepEqual(Array.from(trim([Float32Array.from([0, 1, 2, 3, 4])], 1, 3)[0]), [1, 2]);
    assert.deepEqual(Array.from(trim([Float32Array.from([0, 1, 2])], -5, 99)[0]), [0, 1, 2]);
    const ramp = Float32Array.from([0, 1, 2, 3, 4]);
    assert.deepEqual(Array.from(loopSlice([ramp], 3, 7)[0]), [3, 4, 0, 1, 2, 3, 4]);
    assert.deepEqual(Array.from(loopSlice([ramp], 1, 3)[0]), [1, 2, 3]);
    // crossfade 2: tail [3,4] blends into head [0,1], then resumes at 2
    const xf = Array.from(loopSlice([ramp], 0, 8, 2)[0]);
    assert.deepEqual(xf, [0, 1, 2, 3, 2.5, 2, 3, 2.5]);
  });
});

// ————————————————————————————— labClipCache ————————————————————————————————

function makeWavBytes(seconds: number, rate = 48000, channels = 2): Uint8Array {
  const n = Math.round(seconds * rate);
  const chans = Array.from({ length: channels }, (_, c) => Array.from(sineArr(440 * (c + 1), rate, n, 0.3)));
  return wav({ tag: 1, bits: 16 }, chans, rate);
}

type Hooks = {
  resolves: number;
  fetches: number;
  disk: Map<string, Uint8Array>;
};

function harness(opts: {
  bytes?: (asset: string) => Uint8Array;
  resolve?: (asset: string) => { url: string } | { reason: 'auth' | 'not_found' | 'network' };
  fetchFail?: () => Error | null;
  maxBytes?: number;
  disk?: boolean;
  delayMs?: number;
}) {
  const h: Hooks = { resolves: 0, fetches: 0, disk: new Map() };
  const cache = new LabClipCache({
    resolveUrl: async (_lab, asset) => {
      h.resolves++;
      return opts.resolve ? opts.resolve(asset) : { url: `https://x/${asset}` };
    },
    fetchBytes: async (url) => {
      h.fetches++;
      if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      const err = opts.fetchFail?.();
      if (err) throw err;
      const asset = url.split('/').pop()!;
      return { bytes: (opts.bytes ?? (() => makeWavBytes(0.1)))(asset) };
    },
    disk:
      opts.disk === false
        ? null
        : {
            read: async (k) => (h.disk.has(k) ? { bytes: h.disk.get(k)!, stale: false } : null),
            write: async (k, b) => void h.disk.set(k, b),
            remove: async (k) => void h.disk.delete(k),
          },
    maxBytes: opts.maxBytes,
  });
  return { cache, h };
}

const codeOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 'resolved';
  } catch (e) {
    assert.ok(e instanceof LabClipError, `typed error, got ${e}`);
    return (e as InstanceType<typeof LabClipError>).code;
  }
};

describe('labClipCache', () => {
  it('decodes, resamples a 44.1 kHz asset to 48 kHz, and serves repeats from memory', async () => {
    const { cache, h } = harness({ bytes: () => makeWavBytes(0.5, 44100) });
    const a = await cache.load('demo_signals', 'piano');
    assert.equal(a.sampleRate, 48000);
    assert.equal(a.sourceRate, 44100);
    assert.equal(a.frames, 24000);
    assert.equal(a.channels.length, 2);
    const b = await cache.load('demo_signals', 'piano');
    assert.equal(b, a);
    assert.equal(h.fetches, 1);
    assert.equal(cache.peek('demo_signals', 'piano'), a);
  });

  it('de-duplicates concurrent loads of the same asset', async () => {
    const { cache, h } = harness({ delayMs: 20 });
    const [a, b, c] = await Promise.all([cache.load('l', 'x'), cache.load('l', 'x'), cache.load('l', 'x')]);
    assert.equal(a, b);
    assert.equal(b, c);
    assert.equal(h.resolves, 1);
    assert.equal(h.fetches, 1);
  });

  it('evicts least-recently-used buffers past the byte budget', async () => {
    // 0.1 s stereo at 48 k = 4800 × 2 × 4 = 38 400 bytes each; budget fits two.
    const { cache } = harness({ maxBytes: 80000 });
    await cache.load('l', 'a');
    await cache.load('l', 'b');
    cache.peek('l', 'a'); // a is now the most recent
    await cache.load('l', 'c');
    assert.deepEqual(cache.memoryKeys(), [clipKey('l', 'a'), clipKey('l', 'c')]);
    assert.ok(cache.memoryBytes <= 80000);
  });

  it('cancellation rejects only the aborted caller; the shared load still completes', async () => {
    const { cache, h } = harness({ delayMs: 30 });
    const ctl = new AbortController();
    const aborted = cache.load('l', 'x', { signal: ctl.signal });
    const other = cache.load('l', 'x');
    ctl.abort();
    assert.equal(await codeOf(aborted), 'aborted');
    const buf = await other;
    assert.ok(buf.frames > 0);
    assert.equal(h.fetches, 1);
    // An already-aborted signal rejects at once, even on a memory hit.
    const pre = new AbortController();
    pre.abort();
    assert.equal(await codeOf(cache.load('l', 'x', { signal: pre.signal })), 'aborted');
  });

  it('types every failure', async () => {
    assert.equal(await codeOf(harness({ resolve: () => ({ reason: 'auth' }) }).cache.load('l', 'x')), 'unauthorized');
    assert.equal(await codeOf(harness({ resolve: () => ({ reason: 'not_found' }) }).cache.load('l', 'x')), 'not_found');
    assert.equal(await codeOf(harness({ resolve: () => ({ reason: 'network' }) }).cache.load('l', 'x')), 'offline');
    assert.equal(await codeOf(harness({ fetchFail: () => new TypeError('Network request failed') }).cache.load('l', 'x')), 'offline');
    assert.equal(await codeOf(harness({ fetchFail: () => new LabClipError('not_found') }).cache.load('l', 'x')), 'not_found');
    assert.equal(await codeOf(harness({ bytes: () => new Uint8Array([1, 2, 3]) }).cache.load('l', 'x')), 'decode');
  });

  it('a failed load is not cached; the next attempt retries', async () => {
    let fail = true;
    const { cache, h } = harness({ fetchFail: () => (fail ? new TypeError('offline') : null) });
    assert.equal(await codeOf(cache.load('l', 'x')), 'offline');
    fail = false;
    const b = await cache.load('l', 'x');
    assert.ok(b.frames > 0);
    assert.equal(h.fetches, 2);
  });

  it('the disk copy makes a repeat load offline-capable (no signed URL needed)', async () => {
    let online = true;
    const { cache, h } = harness({ fetchFail: () => (online ? null : new TypeError('offline')) });
    await cache.load('l', 'x');
    assert.equal(h.disk.size, 1);
    cache.clearMemory();
    online = false;
    const b = await cache.load('l', 'x');
    assert.ok(b.frames > 0);
    assert.equal(h.resolves, 1, 'served from disk without asking for a URL');
  });

  it('a corrupt disk copy is removed and refetched', async () => {
    const { cache, h } = harness({});
    h.disk.set(clipKey('l', 'x'), new Uint8Array([9, 9, 9]));
    const b = await cache.load('l', 'x');
    assert.ok(b.frames > 0);
    assert.equal(h.fetches, 1);
    assert.ok((h.disk.get(clipKey('l', 'x'))?.length ?? 0) > 100);
  });

  it('a stale disk copy is refreshed online and still served offline', async () => {
    const good = makeWavBytes(0.1);
    const disk = new Map<string, Uint8Array>([[clipKey('l', 'x'), good]]);
    const cache = new LabClipCache({
      resolveUrl: async () => ({ reason: 'network' }),
      fetchBytes: async () => {
        throw new Error('unreachable');
      },
      disk: {
        read: async (k) => (disk.has(k) ? { bytes: disk.get(k)!, stale: true } : null),
        write: async () => {},
        remove: async (k) => void disk.delete(k),
      },
    });
    const b = await cache.load('l', 'x');
    assert.equal(b.frames, 4800);
  });

  it('clearMemory (the account-wipe hook) drops decoded buffers and fences in-flight loads', async () => {
    const { cache } = harness({ delayMs: 20 });
    await cache.load('l', 'a');
    const inflight = cache.load('l', 'b');
    cache.clearMemory();
    assert.equal(cache.memoryCount, 0);
    await inflight; // still resolves for its caller…
    assert.equal(cache.peek('l', 'b'), undefined); // …but does not repopulate the wiped cache
  });

  it('base64 round-trips binary (the native disk path)', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 1000, 65537]) {
      const b = new Uint8Array(n);
      for (let i = 0; i < n; i++) b[i] = (i * 37 + 11) & 255;
      const s = bytesToBase64(b);
      assert.equal(s, Buffer.from(b).toString('base64'));
      assert.deepEqual(base64ToBytes(s), b);
    }
    assert.deepEqual(Array.from(base64ToBytes('AQID\nBA==')), [1, 2, 3, 4]);
  });
});

// ————————————————————————————— renderRecorded ——————————————————————————————

describe('renderRecorded', () => {
  const src = { channels: [sineArr(1000, 48000, 48000, 0.5), sineArr(1000, 48000, 48000, 0.25)], sampleRate: 48000 };

  it('slices, level-matches (linked RMS) and never exceeds the peak ceiling', () => {
    const out = renderRecorded(src, { startSec: 0.25, durationSec: 0.5, rmsTargetDb: -20 }) as { l: Float32Array; r: Float32Array };
    assert.equal(out.l.length, 24000);
    let s = 0;
    for (const c of [out.l, out.r]) for (const v of c) s += v * v;
    const db = 10 * Math.log10(s / 48000);
    assert.ok(Math.abs(db + 20) < 0.2, `rms ${db}`);
    assert.ok(out.l[0] === 0, 'edge fade');
    const hot = renderRecorded(src, { gainDb: 30 }) as { l: Float32Array };
    assert.ok(Math.max(...Array.from(hot.l).map(Math.abs)) <= 0.98 + 1e-6);
    // the source is never mutated
    assert.ok(Math.abs(src.channels[0][12000] - 0.5 * Math.sin((2 * Math.PI * 1000 * 12000) / 48000)) < 1e-6);
  });

  it('applies EQ through earDsp biquads, loops a short clip, folds to mono, and resamples 44.1 k input', () => {
    const cut = renderRecorded(src, { mono: true, eq: [{ type: 'peak', freq: 1000, gainDb: -12, q: 1.4 }], fadeMs: 0 }) as Float32Array;
    const dry = renderRecorded(src, { mono: true, fadeMs: 0 }) as Float32Array;
    const drop = 20 * Math.log10(amplitudeAt(cut, 48000, 1000, 4800, 38400) / amplitudeAt(dry, 48000, 1000, 4800, 38400));
    assert.ok(Math.abs(drop + 12) < 0.3, `EQ cut ${drop} dB`);
    const looped = renderRecorded({ channels: [sineArr(500, 48000, 4800)] }, { durationSec: 0.5 }) as Float32Array;
    assert.equal(looped.length, 24000);
    const from441 = renderRecorded({ channels: [sineArr(1000, 44100, 44100)], sampleRate: 44100 }) as Float32Array;
    assert.equal(from441.length, 48000);
  });

  it('playRendered plays nothing when the gate is refused or closes during the load', async () => {
    const calls: string[] = [];
    const player = {
      load: async () => void calls.push('load'),
      play: (i: number) => void calls.push(`play${i}`),
      stop: () => void calls.push('stop'),
    };
    assert.equal(await playRendered(player, [], 0, { requestAudioOutput: async () => false, isEnabled: () => true }), false);
    assert.deepEqual(calls, []);
    assert.equal(await playRendered(player, [], 0, { requestAudioOutput: async () => true, isEnabled: () => false }), false);
    assert.deepEqual(calls, ['load']);
    assert.equal(await playRendered(player, [], 1, { requestAudioOutput: async () => true, isEnabled: () => true }), true);
    assert.deepEqual(calls, ['load', 'load', 'play1']);
  });
});

// ————————————————————————————— Ear Training real sources ———————————————————

/** A synthetic "piano chord": decaying partials of an A major triad. */
function fakeChord(seconds = 4): Float32Array {
  const n = seconds * 48000;
  const x = new Float32Array(n);
  for (const f0 of [220, 277.18, 329.63, 440]) {
    for (let h = 1; h <= 12; h++) {
      const f = f0 * h;
      if (f > 20000) break;
      for (let i = 0; i < n; i++) x[i] += (0.2 / h) * Math.exp(-i / 48000) * Math.sin((2 * Math.PI * f * i) / 48000);
    }
  }
  return x;
}

describe('Ear Training — real program sources', () => {
  const program = { name: 'piano chord', mono: fakeChord() };

  it('the synth path is byte-identical with no program (grading unchanged)', () => {
    for (const mod of [M2_EQ, M3_BAND]) {
      for (const level of [1, 2, 3, 4]) {
        for (const seed of [1, 7, 12345, 99999]) {
          const a = mod.makeTrial(level, seed, { subBassOk: true });
          const b = mod.makeTrial(level, seed, { subBassOk: true, program: undefined });
          assert.equal(a.question, b.question);
          assert.equal(a.correct, b.correct);
          assert.equal(a.reveal, b.reveal);
          assert.equal(a.source, undefined);
          assert.deepEqual(Array.from(a.clips[1].buf as Float32Array).slice(0, 64), Array.from(b.clips[1].buf as Float32Array).slice(0, 64));
        }
      }
    }
  });

  it('M2 with a recording: same answer logic, the stated move is genuinely in the sound, level-matched', () => {
    let used = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const t = M2_EQ.makeTrial(2, seed, { program });
      if (t.source === 'piano chord') used++;
      else assert.match(t.reveal, /piano chord has too little energy/);
      // Answer key still derived from the reveal's move.
      const m = /^([+-]?\d+) dB .* at ([\d.]+ k?Hz)/.exec(t.reveal);
      assert.ok(m, t.reveal);
      if (t.question.startsWith('Is B boosted')) assert.equal(t.correct, Number(m![1]) > 0 ? 0 : 1);
      if (t.question.startsWith('B has one EQ move')) assert.equal(t.answers[t.correct].label, m![2]);
      // Both clips at the module's −20 dBFS RMS target.
      for (const c of t.clips) {
        const x = c.buf as Float32Array;
        let s = 0;
        for (const v of x) s += v * v;
        assert.ok(Math.abs(10 * Math.log10(s / x.length) + 20) < 0.5);
      }
    }
    assert.ok(used >= 20, `the recording should carry most trials (used ${used}/40)`);
  });

  it('M3 with a recording: the declared band is still the biggest mover', () => {
    let checked = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const t = M3_BAND.makeTrial(2, seed, { subBassOk: true, program });
      if (t.source !== 'piano chord') continue;
      const dry = t.clips[0].buf as Float32Array;
      const wet = t.clips[1].buf as Float32Array;
      const bands = t.seeIt.kind === 'spectrum' ? t.seeIt.bands ?? [] : [];
      const deltas = bands.map((b) => {
        const c = Math.min(BANDS.find((x) => x.label === b.label)!.c, 16000);
        const oct = Math.log2(Math.min(b.hi, 20000) / b.lo);
        return Math.abs(bandDb(wet, c, oct) - bandDb(dry, c, oct));
      });
      assert.equal(deltas.indexOf(Math.max(...deltas)), t.correct, t.reveal);
      checked++;
    }
    assert.ok(checked >= 5, `recording carried ${checked}/20 band trials`);
  });

  it('falls back to the synth on any loader error, while loading, and for the synth choice', () => {
    const piano = earSourceById('piano');
    const ready = { status: 'ready' as const, buffer: { channels: [fakeChord(1)], sampleRate: 48000 } };
    const prog = programFromClip(piano.name, ready.buffer);
    assert.ok(prog);
    assert.equal(resolveEarSource(piano, ready, prog).program, prog);
    for (const status of ['error', 'loading', 'idle'] as const) {
      const r = resolveEarSource(piano, { status, buffer: null }, null);
      assert.equal(r.program, undefined, status);
      assert.ok(r.note && r.note.length > 10, `${status} explains itself`);
    }
    assert.match(resolveEarSource(piano, { status: 'error', buffer: null }, null).note!, /synthesized source/);
    const synth = resolveEarSource(earSourceById('synth'), { status: 'idle', buffer: null }, null);
    assert.deepEqual(synth, { program: undefined, note: null });
    // A clip that is not 48 kHz or too short is never used.
    assert.equal(programFromClip('x', { channels: [new Float32Array(1000)], sampleRate: 48000 }), null);
    assert.equal(programFromClip('x', { channels: [fakeChord(1)], sampleRate: 44100 }), null);
    // The module then draws exactly the synth trial.
    const a = M2_EQ.makeTrial(3, 42, { program: resolveEarSource(piano, { status: 'error', buffer: null }, null).program });
    const b = M2_EQ.makeTrial(3, 42);
    assert.equal(a.reveal, b.reveal);
    assert.equal(a.correct, b.correct);
  });

  it('uses the published demo_signals assets', () => {
    const keys = EAR_SOURCES.filter((s) => s.assetKey).map((s) => `${s.labKey}/${s.assetKey}`);
    assert.deepEqual(keys, ['demo_signals/piano-chord-1', 'demo_signals/acoustic-guitar-a-chord']);
    assert.equal(EAR_SOURCES[0].id, 'synth', 'the synth stays the default');
  });
});

// ————————————————————————————— performance (reported, loosely bounded) —————

describe('performance (30 s stereo)', () => {
  it('decodes 24-bit and resamples 44.1 → 48 kHz in reasonable time', () => {
    const frames = 30 * 48000;
    const l = new Array<number>(frames);
    const r = new Array<number>(frames);
    for (let i = 0; i < frames; i++) {
      l[i] = 0.3 * Math.sin(i * 0.05);
      r[i] = 0.3 * Math.cos(i * 0.031);
    }
    const file24 = wav({ tag: 1, bits: 24 }, [l, r], 48000);
    let t = performance.now();
    const d = decodeWav(file24);
    const decodeMs = performance.now() - t;
    assert.equal(d.frames, frames);
    const file16 = wav({ tag: 1, bits: 16 }, [l, r], 48000);
    t = performance.now();
    decodeWav(file16);
    const decode16Ms = performance.now() - t;
    const f441 = 30 * 44100;
    const src = [sineArr(1000, 44100, f441), sineArr(500, 44100, f441)];
    t = performance.now();
    const out = resample(src, 44100, 48000);
    const resampleMs = performance.now() - t;
    assert.equal(out[0].length, frames);
    console.log(
      `[perf] 30 s stereo: decode 24-bit ${decodeMs.toFixed(1)} ms · decode 16-bit ${decode16Ms.toFixed(1)} ms · ` +
        `resample 44.1→48 k ${resampleMs.toFixed(0)} ms (Node)`,
    );
    assert.ok(decodeMs < 2000 && resampleMs < 20000);
  });
});
