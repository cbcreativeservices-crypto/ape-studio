/**
 * The native CLIP source (engine 13, 2026-11-27, 1.0.1 store build — build
 * must-do D16 / build-list A15; owner go 2026-11-27 "Yes, start it", decision
 * E8). Labs that play through ApeDsp's generators can later play the audio
 * engineer's recordings THROUGH the effect chain. This build ships the
 * CAPABILITY and a dev-only harness; no production lab is wired to a file
 * (owner 2026-10-29: no recordings for labs that do not play audio, and these
 * labs' recordings are not delivered yet).
 *
 * Covered here:
 *   1. the JS loader core (nativeLabClipCore): old engine / web = a no-op,
 *      the disk cache, the refetch of a damaged copy, the offline fallback,
 *      every error path, cancellation;
 *   2. the ApeDsp surface (index.ts, evaluated with a fake native module):
 *      clipAvailable on engine 13 only, loadClip never rejects, older
 *      binaries untouched;
 *   3. pins on the C++ core, the iOS and Android bridges and the decoders;
 *   4. the dev harness: fenced, lazy, not on any production screen.
 * The DSP itself (sample-accurate, loop wrap, one-shot, the safety ceiling,
 * swap-while-playing) is proven by the golden suite: modules/ape-dsp/test/
 * golden_main.cpp section 16.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const g = globalThis as Record<string, any>;
g.__DEV__ = false;

const ROOT_URL = new URL('../', import.meta.url);
const ROOT = fileURLToPath(ROOT_URL);
const read = (p: string) => readFileSync(new URL(p, ROOT_URL), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped (a comment can never satisfy a match). */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

const INDEX_URL = new URL('../modules/ape-dsp/index.ts', import.meta.url).href;
const STUBS: Record<string, string> = {
  'ape-clip:react-native': `export const Platform = { OS: globalThis.__CLIP_OS__ ?? 'ios' };`,
  'ape-clip:expo-modules-core': `export function requireNativeModule() {
    const n = globalThis.__CLIP_NATIVE__;
    if (!n) throw new Error('ape-dsp native module not in this build');
    return n;
  }`,
};

registerHooks({
  resolve(specifier, context, next) {
    if (context.parentURL?.startsWith(INDEX_URL)) {
      if (specifier === 'react-native') return { url: 'ape-clip:react-native', shortCircuit: true };
      if (specifier === 'expo-modules-core') return { url: 'ape-clip:expo-modules-core', shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier.split('?')[0])) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url in STUBS) return { format: 'module', source: STUBS[url], shortCircuit: true };
    if (url.startsWith(INDEX_URL)) {
      const out = ts.transpileModule(read('modules/ape-dsp/index.ts'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        fileName: 'index.ts',
      });
      return { format: 'module', source: out.outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});

const core = await import('../src/features/lab/nativeLabClipCore.ts');
const { clipKey } = await import('../src/features/lab/labClipCache.ts');

type Calls = { resolve: number; download: string[]; loadClip: string[]; remove: string[]; findCached: number };
type ClipRes = { ok: true; frames: number; sampleRate: number; channels: 1 | 2 } | { ok: false; error: string; message: string };
const OK: ClipRes = { ok: true, frames: 96000, sampleRate: 48000, channels: 2 };

function world(o: {
  available?: boolean;
  cached?: { uri: string; stale: boolean } | null;
  resolve?: () => Promise<unknown>;
  download?: (url: string, key: string, ext: string) => Promise<string>;
  loadClip?: (uri: string) => ClipRes;
}) {
  const calls: Calls = { resolve: 0, download: [], loadClip: [], remove: [], findCached: 0 };
  const deps = {
    available: () => o.available ?? true,
    loadClip: async (uri: string) => {
      calls.loadClip.push(uri);
      return (o.loadClip ?? (() => OK))(uri) as never;
    },
    resolveUrl: async () => {
      calls.resolve++;
      return (o.resolve ? await o.resolve() : { url: 'https://signed.example/x', ext: 'm4a' }) as never;
    },
    findCached: async () => {
      calls.findCached++;
      return o.cached ?? null;
    },
    download: async (url: string, key: string, ext: string) => {
      calls.download.push(`${url}|${key}|${ext}`);
      return o.download ? o.download(url, key, ext) : `file:///cache/lab-clips/native-v1/${key}.${ext}`;
    },
    remove: async (uri: string) => {
      calls.remove.push(uri);
    },
  };
  return { deps, calls };
}

describe('1. the loader core: one lab-audio asset into the native clip source', () => {
  const KEY = clipKey('demo_signals', 'piano-chord-1');

  it('an older binary / web (no clip source): "unavailable", and NOTHING else happens', async () => {
    const { deps, calls } = world({ available: false, cached: { uri: 'file:///c.m4a', stale: false } });
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
    assert.deepEqual(r, { ok: false, error: 'unavailable', message: 'This build has no clip source' });
    assert.deepEqual(calls, { resolve: 0, download: [], loadClip: [], remove: [], findCached: 0 }, 'no URL, no download, no disk, no engine call');
  });

  it('no copy on disk: signed URL → download into the cache under the clip key + the asset extension → loadClip', async () => {
    const { deps, calls } = world({});
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
    assert.equal(calls.resolve, 1);
    assert.deepEqual(calls.download, [`https://signed.example/x|${KEY}|m4a`]);
    assert.deepEqual(calls.loadClip, [`file:///cache/lab-clips/native-v1/${KEY}.m4a`]);
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.fromCache, false);
      assert.equal(r.frames, 96000);
      assert.equal(r.sampleRate, 48000);
      assert.equal(r.channels, 2);
      assert.equal(r.durationSec, 2);
      assert.equal(r.uri, `file:///cache/lab-clips/native-v1/${KEY}.m4a`);
    }
  });

  it('a fresh disk copy is used with no network at all (offline-capable)', async () => {
    const { deps, calls } = world({ cached: { uri: 'file:///cache/x.m4a', stale: false } });
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
    assert.ok(r.ok && r.fromCache);
    assert.equal(calls.resolve, 0);
    assert.deepEqual(calls.download, []);
    assert.deepEqual(calls.loadClip, ['file:///cache/x.m4a']);
  });

  it('a disk copy the decoder cannot read is deleted and fetched once more', async () => {
    const { deps, calls } = world({
      cached: { uri: 'file:///cache/bad.m4a', stale: false },
      loadClip: (u) => (u === 'file:///cache/bad.m4a' ? { ok: false, error: 'decode', message: 'nope' } : OK),
    });
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
    assert.ok(r.ok && !r.fromCache);
    assert.deepEqual(calls.remove, ['file:///cache/bad.m4a']);
    assert.equal(calls.download.length, 1);
  });

  it('a downloaded file that will not decode is removed and reported as "decode"', async () => {
    const { deps, calls } = world({ loadClip: () => ({ ok: false, error: 'empty', message: 'no frames' }) });
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, 'decode');
    assert.equal(calls.remove.length, 1);
  });

  it('a file the engine refuses for what it IS (too long) is reported with the native code, not refetched', async () => {
    const { deps, calls } = world({
      cached: { uri: 'file:///cache/long.wav', stale: false },
      loadClip: () => ({ ok: false, error: 'too_long', message: 'Longer than 60 s' }),
    });
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
    assert.deepEqual(r, { ok: false, error: 'decode', message: 'Longer than 60 s', detail: 'too_long' });
    assert.deepEqual(calls.remove, []);
    assert.equal(calls.resolve, 0);
  });

  it('the signed URL: auth → unauthorized, not_found → not_found, network / a throw → offline', async () => {
    for (const [reason, want] of [['auth', 'unauthorized'], ['not_found', 'not_found'], ['network', 'offline']] as const) {
      const { deps, calls } = world({ resolve: async () => ({ reason }) });
      const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
      assert.equal(r.ok, false);
      if (!r.ok) assert.equal(r.error, want, reason);
      assert.deepEqual(calls.download, []);
      assert.deepEqual(calls.loadClip, []);
    }
    const { deps } = world({ resolve: async () => Promise.reject(new Error('boom')) });
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
    assert.equal(!r.ok && r.error, 'offline');
  });

  it('the download: a typed failure keeps its code; anything else thrown reads as offline', async () => {
    const typed = world({ download: async () => Promise.reject(new core.NativeClipFetchError('not_found', 'HTTP 404')) });
    const a = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', typed.deps);
    assert.deepEqual(a, { ok: false, error: 'not_found', message: 'HTTP 404' });
    const other = world({ download: async () => Promise.reject(new Error('socket hang up')) });
    const b = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', other.deps);
    assert.deepEqual(b, { ok: false, error: 'offline', message: 'socket hang up' });
    assert.deepEqual(other.calls.loadClip, [], 'nothing half-downloaded reaches the engine');
  });

  it('offline with an OLD disk copy: the old copy is still the asset', async () => {
    const viaUrl = world({ cached: { uri: 'file:///cache/old.m4a', stale: true }, resolve: async () => ({ reason: 'network' }) });
    const a = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', viaUrl.deps);
    assert.ok(a.ok && a.fromCache);
    assert.deepEqual(viaUrl.calls.loadClip, ['file:///cache/old.m4a']);
    const viaDownload = world({
      cached: { uri: 'file:///cache/old.m4a', stale: true },
      download: async () => Promise.reject(new core.NativeClipFetchError('offline', 'timed out')),
    });
    const b = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', viaDownload.deps);
    assert.ok(b.ok && b.fromCache);
    // …but a stale copy is never used to paper over "not entitled" or "no such asset"
    const auth = world({ cached: { uri: 'file:///cache/old.m4a', stale: true }, resolve: async () => ({ reason: 'auth' }) });
    const c = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', auth.deps);
    assert.equal(!c.ok && c.error, 'unauthorized');
    assert.deepEqual(auth.calls.loadClip, []);
  });

  it('a stale copy is refreshed when online (the fresh download is what loads)', async () => {
    const { deps, calls } = world({ cached: { uri: 'file:///cache/old.m4a', stale: true } });
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps);
    assert.ok(r.ok && !r.fromCache);
    assert.deepEqual(calls.loadClip, [`file:///cache/lab-clips/native-v1/${KEY}.m4a`]);
  });

  it('cancellation: an aborted signal stops before any work; a late abort reports "aborted"', async () => {
    const ctl = new AbortController();
    ctl.abort();
    const { deps, calls } = world({});
    const r = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', deps, { signal: ctl.signal });
    assert.equal(!r.ok && r.error, 'aborted');
    assert.deepEqual(calls, { resolve: 0, download: [], loadClip: [], remove: [], findCached: 0 });
    const late = new AbortController();
    const w2 = world({ resolve: async () => (late.abort(), { url: 'https://signed.example/y', ext: 'wav' }) });
    const r2 = await core.loadNativeLabClip('demo_signals', 'piano-chord-1', w2.deps, { signal: late.signal });
    assert.equal(!r2.ok && r2.error, 'aborted');
    assert.deepEqual(w2.calls.download, [], 'no download after the abort');
  });

  it('the cache file extension is sanitised (the edge function’s ext, else wav)', () => {
    assert.equal(core.clipFileExt('m4a'), 'm4a');
    assert.equal(core.clipFileExt('.M4A'), 'm4a');
    assert.equal(core.clipFileExt('wav'), 'wav');
    for (const bad of [undefined, null, '', '../x', 'a/b', 'toolongext', 'm 4a']) assert.equal(core.clipFileExt(bad as string), 'wav', String(bad));
  });
});

// ── 2. the ApeDsp surface, evaluated with a fake native module ───────────────

let seq = 0;
async function apeDsp(native: Record<string, unknown> | null) {
  g.__CLIP_NATIVE__ = native;
  const mod = await import(`${INDEX_URL}?clip=${++seq}`);
  return mod as {
    ApeDsp: {
      clipAvailable(): boolean;
      loadClip(uri: string): Promise<ClipRes & { error?: string }>;
      unloadClip(): void;
      engineVersion(): number;
    };
    GEN_MODES: Record<string, number>;
  };
}
function fakeNative(engineVersion: number, extra: Record<string, unknown>) {
  const calls: string[] = [];
  return {
    calls,
    native: {
      getMeterFrame: () => ({}),
      getInfo: () => ({ engineVersion }),
      ...Object.fromEntries(
        Object.entries(extra).map(([k, v]) => [k, typeof v === 'function' ? (...a: unknown[]) => (calls.push(k), (v as (...x: unknown[]) => unknown)(...a)) : v]),
      ),
    },
  };
}

describe('2. ApeDsp: clipAvailable / loadClip / unloadClip, engine 13 only', () => {
  it('GEN_MODES.clip is 15 (apedsp::GenMode::Clip)', async () => {
    const { GEN_MODES } = await apeDsp(null);
    assert.equal(GEN_MODES.clip, 15);
    assert.equal(GEN_MODES.dual, 14, 'no existing mode renumbered');
  });

  it('no native module (web / Expo Go): unavailable, nothing thrown', async () => {
    const { ApeDsp } = await apeDsp(null);
    assert.equal(ApeDsp.clipAvailable(), false);
    assert.deepEqual(await ApeDsp.loadClip('file:///x.m4a'), { ok: false, error: 'unavailable', message: 'clip source not in this build' });
    ApeDsp.unloadClip();
  });

  it('an engine-12 binary (today’s store build): unavailable, and the native side is never called', async () => {
    const f = fakeNative(12, { loadClip: async () => ({ ok: true, frames: 1, sampleRate: 48000, channels: 1 }), unloadClip: () => {} });
    const { ApeDsp } = await apeDsp(f.native);
    assert.equal(ApeDsp.engineVersion(), 12);
    assert.equal(ApeDsp.clipAvailable(), false);
    const r = await ApeDsp.loadClip('file:///x.m4a');
    assert.equal(r.ok, false);
    assert.equal((r as { error: string }).error, 'unavailable');
    ApeDsp.unloadClip();
    assert.deepEqual(f.calls, []);
  });

  it('engine 13 without the native function (a mismatched dev client): unavailable', async () => {
    const f = fakeNative(13, {});
    const { ApeDsp } = await apeDsp(f.native);
    assert.equal(ApeDsp.clipAvailable(), false);
  });

  it('engine 13: the native result passes through; odd shapes and rejections become typed results', async () => {
    let next: () => Promise<unknown> = async () => ({ ok: true, frames: 96000, sampleRate: 44100, channels: 2 });
    const f = fakeNative(13, { loadClip: () => next(), unloadClip: () => {} });
    const { ApeDsp } = await apeDsp(f.native);
    assert.equal(ApeDsp.clipAvailable(), true);
    assert.deepEqual(await ApeDsp.loadClip('file:///a.m4a'), { ok: true, frames: 96000, sampleRate: 44100, channels: 2 });
    next = async () => ({ ok: true, frames: 10, sampleRate: 48000, channels: 1 });
    assert.deepEqual(await ApeDsp.loadClip('file:///m.wav'), { ok: true, frames: 10, sampleRate: 48000, channels: 1 });
    next = async () => ({ ok: false, error: 'too_long', message: 'Longer than 60 s' });
    assert.deepEqual(await ApeDsp.loadClip('file:///b.m4a'), { ok: false, error: 'too_long', message: 'Longer than 60 s' });
    next = async () => ({ ok: false, error: 'mystery' });
    assert.deepEqual(await ApeDsp.loadClip('file:///c.m4a'), { ok: false, error: 'decode', message: 'decode' });
    next = async () => ({ ok: true, frames: 0, sampleRate: 48000 });
    assert.equal((await ApeDsp.loadClip('file:///d.m4a')).ok, false, 'zero frames is never "ok"');
    next = async () => null;
    assert.equal((await ApeDsp.loadClip('file:///e.m4a')).ok, false);
    next = async () => Promise.reject(new Error('bridge died'));
    assert.deepEqual(await ApeDsp.loadClip('file:///f.m4a'), { ok: false, error: 'decode', message: 'bridge died' });
    ApeDsp.unloadClip();
    assert.equal(f.calls.filter((c) => c === 'loadClip').length, 7);
    assert.equal(f.calls.filter((c) => c === 'unloadClip').length, 1);
  });
});

// ── 3. pins: the C++ core, the bridges, the decoders ─────────────────────────

describe('3. engine 13 in the core and on both platforms', () => {
  const HUB = read('modules/ape-dsp/ios/core/EngineHub.hpp');
  const GEN = code('modules/ape-dsp/ios/core/Generator.hpp');
  const CLIP = code('modules/ape-dsp/ios/core/Clip.hpp');
  const H = read('modules/ape-dsp/ios/ApeDspCore.h');
  const MM = code('modules/ape-dsp/ios/ApeDspCore.mm');
  const SWIFT = code('modules/ape-dsp/ios/ApeDspModule.swift');
  const KT = code('modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt');
  const DEC = code('modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ClipDecoder.kt');
  const JNI = code('modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp');
  const IDX = code('modules/ape-dsp/index.ts');

  it('engine 13 in the one version constant, with its changelog line', () => {
    assert.match(HUB, /constexpr uint32_t kEngineVersion = 13;/);
    assert.match(HUB, /\/\/\/ 13 \(2026-11-27, 1\.0\.1 store build, build must-do D16 \/ A15\): the CLIP/);
    assert.match(IDX, /clipAvailable\(\): boolean \{\s*return this\.engineVersion\(\) >= 13 && typeof native\?\.loadClip === 'function';/);
  });

  it('GenMode::Clip = 15, appended (no mode renumbered)', () => {
    assert.match(GEN, /Dual = 14,\s*Clip = 15,\s*\};/);
  });

  it('the SAFETY CEILING: a clip is a unit-level source under the same Q4 cap chain as every mode', () => {
    // clip gain (≤ 1) applies to the raw sample; the ONE amplitude authority stays ampCur_ × env_ × routeGate_
    assert.match(GEN, /rawL = \(R \? cl : 0\.5 \* \(cl \+ cr\)\) \* clipGainCur_;\s*rawR = cr \* clipGainCur_;/);
    assert.match(GEN, /const double g = ampCur_ \* env_ \* routeGate_;/);
    assert.match(GEN, /const double ampTarget = std::pow\(10\.0, effectiveLevelDb\(\) \/ 20\.0\);/);
    // the clip gain can only attenuate; NaN → 0 dB
    assert.match(GEN, /const double g = !\(gainDb <= 0\.0\) \? 0\.0 : \(gainDb < genclip::kMinGainDb \? genclip::kMinGainDb : gainDb\);/);
    // every interpolated sample clamped to ±1; a hot file normalised at load
    assert.match(GEN, /l = l > 1\.0 \? 1\.0 : \(l < -1\.0 \? -1\.0 : l\);\s*r = r > 1\.0 \? 1\.0 : \(r < -1\.0 \? -1\.0 : r\);/);
    assert.match(CLIP, /if \(peak > 1\.0f\) \{\s*const float g = 1\.0f \/ peak;/);
    assert.match(CLIP, /if \(!std::isfinite\(x\)\) x = 0\.0f;/);
    // it rides the speaker HPF (the clip branch is a raw source, before the HPF block)
    assert.ok(GEN.indexOf('if (modeCur_ == GenMode::Clip) {') < GEN.indexOf('if (hpfDesigned) {'));
  });

  it('the swap is lock-free: the audio thread never frees; a sounding swap rides the retrigger dip', () => {
    const adopt = CLIP.slice(CLIP.indexOf('bool adopt() {'), CLIP.indexOf('const ClipBuffer* current() const'));
    assert.doesNotMatch(adopt, /\bdelete\b|\bnew\b|lock|mutex/, 'adopt() runs on the audio thread');
    assert.match(adopt, /if \(head - tail >= kSlots\) return false;/);
    assert.match(CLIP, /ClipBuffer\* never = pending_\.exchange\(b, std::memory_order_acq_rel\);\s*delete never;/);
    assert.match(GEN, /if \(clip_\.hasPending\(\)\) \{\s*if \(modeCur_ == GenMode::Clip && env_ > 0\.0\) trigPending_ = true;\s*else if \(clip_\.adopt\(\)\) resetClipPlayhead\(\);/);
    const render = GEN.slice(GEN.indexOf('void renderInto(float* L, float* R, uint32_t n) {'), GEN.indexOf(' private:'));
    assert.doesNotMatch(render, /clipBridgeMu_|\bdelete\b|makeClip|publish\(/, 'render takes no lock, frees nothing, builds nothing');
    assert.match(GEN, /std::lock_guard<std::mutex> lk\(clipBridgeMu_\);\s*clip_\.drain\(\);/);
  });

  it('limits agree: 60 s in the core, the Swift bridge and the Kotlin decoder', () => {
    assert.match(CLIP, /constexpr double kMaxSeconds = 60\.0;/);
    assert.match(SWIFT, /private static let clipMaxSeconds = 60\.0/);
    assert.match(DEC, /private const val MAX_SECONDS = 60\.0/);
  });

  it('iOS: AVAudioFile → float32 deinterleaved at the file rate, a local file only, off main and off the render thread', () => {
    assert.match(H, /- \(int\)genLoadClipLeft:\(const float \*\)left\s*right:\(const float \*_Nullable\)right\s*frames:\(uint32_t\)frames\s*sampleRate:\(double\)sampleRate;/);
    assert.match(MM, /return _gen->loadClip\(left, right, frames, sampleRate\);/);
    assert.match(MM, /_gen->unloadClip\(\);/);
    assert.match(MM, /_gen->setClip\(loop == YES, gainDb\);/);
    const status = MM.slice(MM.indexOf('- (NSDictionary<NSString *, id> *)genStatus {'), MM.indexOf('- (void)genRender:'));
    assert.match(status, /_gen->reclaimClips\(\);/);
    for (const k of ['clipFrames', 'clipSampleRate', 'clipChannels', 'clipEnded', 'clipNormGain']) assert.match(status, new RegExp(`@"${k}" :`), k);
    const load = SWIFT.slice(SWIFT.indexOf('AsyncFunction("loadClip")'), SWIFT.indexOf('Function("unloadClip")'));
    assert.match(load, /return self\.decodeAndLoadClip\(uri: uri\)/);
    assert.doesNotMatch(load, /runOnQueue\(\.main\)/, 'decoding never blocks main');
    assert.match(SWIFT, /try AVAudioFile\(forReading: url, commonFormat: \.pcmFormatFloat32, interleaved: false\)/);
    assert.match(SWIFT, /\} else if let u = URL\(string: uri\), u\.isFileURL \{\s*url = u\s*\} else \{\s*return clipError\("unsupported"/);
    assert.match(SWIFT, /Function\("unloadClip"\) \{ \(\) -> Void in\s*self\.core\.genUnloadClip\(\)/);
    // targets-first: the clip key before mode
    assert.ok(SWIFT.indexOf('params["clip"]') > 0 && SWIFT.indexOf('params["clip"]') < SWIFT.indexOf('if let m = (params["mode"] as? NSNumber)'));
  });

  it('Android: MediaExtractor + MediaCodec in ClipDecoder.kt, JNI copy with JNI_ABORT, 13 status slots', () => {
    assert.match(DEC, /val ex = MediaExtractor\(\)/);
    assert.match(DEC, /MediaCodec\.createDecoderByType\(mime\)/);
    assert.match(DEC, /return if \(u\.scheme == "file"\) u\.path else null/);
    assert.match(DEC, /AudioFormat\.ENCODING_PCM_FLOAT ->/);
    assert.match(DEC, /AudioFormat\.ENCODING_PCM_16BIT ->/);
    assert.match(KT, /private external fun nativeGenLoadClip\(h: Long, left: FloatArray, right: FloatArray\?, frames: Int, sampleRate: Double\): Int/);
    assert.match(KT, /AsyncFunction\("loadClip"\) \{ uri: String, promise: Promise ->/);
    assert.match(KT, /ClipDecoder\.decode\(uri\)/);
    assert.match(KT, /Function\("unloadClip"\) \{ if \(handle != 0L\) nativeGenUnloadClip\(handle\) \}/);
    assert.ok(KT.indexOf('params["clip"]') > 0 && KT.indexOf('params["clip"]') < KT.indexOf('(params["mode"] as? Number)'));
    assert.match(KT, /val g = if \(handle != 0L\) nativeGenStatus\(handle\) else DoubleArray\(13\)/);
    assert.match(KT, /"clipEnded" to \(g\[11\] == 1\.0\), "clipNormGain" to g\[12\],/);
    assert.match(JNI, /Java_expo_modules_apedsp_ApeDspModule_nativeGenLoadClip\(JNIEnv\* env, jobject, jlong h,/);
    assert.match(JNI, /env->ReleaseFloatArrayElements\(left, l, JNI_ABORT\);/);
    assert.match(JNI, /jdoubleArray a = env->NewDoubleArray\(13\);/);
    assert.match(JNI, /g\.reclaimClips\(\);/);
  });

  it('the golden suite proves the DSP (section 16)', () => {
    const golden = read('modules/ape-dsp/test/golden_main.cpp');
    assert.match(golden, /#define APEDSP_CLIP_TEST_HOOKS 1/);
    for (const name of [
      'Clip (b): L == cap x clip, sample for sample (exact)',
      'Clip (c): seamless loop = the continuous sine across 3 wraps (exact)',
      'Clip (d): non-loop file - crossfaded seam',
      'Clip (e): one-shot ends in exact silence',
      'Clip (f): hot clip peak <= the -12 dBFS cap',
      'Clip (g): 400 swaps under a live render - no freed buffer ever read (no NaN)',
    ]) assert.ok(golden.includes(name), name);
    // test hooks never leak into an app build
    assert.doesNotMatch(read('modules/ape-dsp/ios/ApeDspCore.mm') + read('modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp'), /APEDSP_CLIP_TEST_HOOKS/);
  });
});

// ── 4. the dev harness, and no production wiring ─────────────────────────────

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('4. a dev-only harness; no production screen plays a clip', () => {
  it('the harness fences its start, and cleans up the voice, the chain and the clip when it closes', () => {
    const H = code('src/dev/NativeClipCheck.tsx');
    assert.match(H, /const fenced = await startFenced\(\{\s*start: \(\) => ApeDsp\.genStart\(\),\s*stop: \(\) => ApeDsp\.genStop\(\),\s*isCurrent:/);
    assert.match(H, /import \{ startFenced \} from '\.\.\/features\/audio\/startFenced';/);
    assert.match(H, /ApeDsp\.genSet\(\{ levelDb: LEVEL_DB, clip: \{ loop, gainDb: 0 \}, mode: GEN_MODES\.clip \}\);/);
    assert.match(H, /return \(\) => \{\s*mounted\.current = false;\s*gen\.current\+\+;\s*void ApeDsp\.genStop\(\)\.catch\(\(\) => \{\}\);\s*ApeDsp\.fxReset\(\);\s*ApeDsp\.unloadClip\(\);/);
    // the loader is required on demand; its type import is erased
    assert.match(H, /import type \{ NativeClipLoad \} from '\.\.\/features\/lab\/nativeLabClip';/);
    assert.match(H, /require\('\.\.\/features\/lab\/nativeLabClip'\)/);
    // web says native only
    assert.match(read('src/dev/NativeClipCheck.tsx'), /Native only\./);
  });

  it('reached only from the web harness and the __DEV__ dev menu, lazily', () => {
    assert.match(code('src/dev/webPreviews.tsx'), /NativeClipCheck: NativeClipCheck as ComponentType,/);
    const idx = code('src/features/dev/DevVisualIndex.tsx');
    assert.match(idx, /require\('\.\.\/\.\.\/dev\/NativeClipCheck'\)/);
    assert.doesNotMatch(idx, /^import[^\n]*NativeClipCheck/m, 'no static import');
    assert.match(code('src/screens/profile/ProfileScreen.tsx'), /\{__DEV__ \? <DevVisualIndex \/> : null\}/);
  });

  it('nothing in src/ outside the harness and the loader uses the clip source', () => {
    const allowed = new Set(['src/dev/NativeClipCheck.tsx', 'src/features/lab/nativeLabClip.ts', 'src/features/lab/nativeLabClipCore.ts']);
    for (const p of walk(join(ROOT, 'src'))) {
      const f = relative(ROOT, p).replace(/\\/g, '/');
      if (allowed.has(f)) continue;
      const s = code(f);
      assert.doesNotMatch(s, /GEN_MODES\.clip|ApeDsp\.loadClip|ApeDsp\.unloadClip|loadNativeLabClip|nativeLabClip'/, `${f} wires the clip source — no production lab is wired yet (D16: recordings not delivered)`);
    }
  });

  it('the loader REUSES the JS clip path: the lab-audio edge function, its timeouts, the app cache dir (never shared storage)', () => {
    const W = code('src/features/lab/nativeLabClip.ts');
    assert.match(W, /import \{ nativeClipFiles \} from '\.\/labClipBuffer';/);
    assert.match(W, /available: \(\) => ApeDsp\.clipAvailable\(\),\s*loadClip: \(uri\) => ApeDsp\.loadClip\(uri\),\s*\.\.\.nativeClipFiles,/);
    assert.doesNotMatch(W, /expo-file-system|supabase|createClient/, 'no second file or network path');
    // the file side lives with the JS clip path it reuses
    const B = code('src/features/lab/labClipBuffer.ts');
    const native = B.slice(B.indexOf("const NATIVE_DISK_VERSION = 'native-v1';"));
    assert.match(native, /`\$\{FileSystem\.cacheDirectory\}lab-clips\/\$\{NATIVE_DISK_VERSION\}\/`/);
    assert.match(native, /await withTimeout\(fetchLabAudio\(labKey, assetKey\), CLIP_URL_TIMEOUT_MS,/);
    assert.match(native, /res = await withTimeout\(task\.downloadAsync\(\), CLIP_FETCH_TIMEOUT_MS,/);
    assert.match(native, /return \{ uri, stale: ageMs > DISK_REFRESH_MS \};/);
    assert.match(native, /await FileSystem\.moveAsync\(\{ from: tmp, to: final \}\);/);
    assert.doesNotMatch(B, /documentDirectory|StorageAccessFramework|MediaLibrary/);
    // the pure core imports nothing platform-specific
    const C = code('src/features/lab/nativeLabClipCore.ts');
    assert.doesNotMatch(C, /from 'react-native'|expo-file-system|supabase/);
  });
});
