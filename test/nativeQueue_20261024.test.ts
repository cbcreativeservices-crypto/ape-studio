/**
 * Store-build native queue (owner 2026-10-24: "nothing postponed") — engine 10.
 *
 *  #10 Delay ping-pong really ping-pongs on a mono source (Effects.hpp).
 *  #11 Stereo Imaging lab gets a real stereo source (Generator stereo spread),
 *      with a mono comparison kept; older builds keep the old source list.
 *  #6  Android: a mic SILENCED by another app is reported (AudioRecordingCallback
 *      + exact-zero input), and the tools show the NO SOUND banner at once.
 *  #8  iOS: AVAudioEngineConfigurationChange restarts capture / output.
 *  iPad: the built-in mic's front/top omni data source is preferred.
 *
 * The DSP arithmetic is pinned by the native golden suite
 * (modules/ape-dsp/test/golden_main.cpp, sections 12k and 12l). Swift and
 * Kotlin cannot be compiled here, so this pins the source shape of each fix.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const SWIFT = 'modules/ape-dsp/ios/ApeDspModule.swift';
const KT = 'modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt';
const JNI = 'modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp';

test('engine 10 is the one version constant', () => {
  const hub = read('modules/ape-dsp/ios/core/EngineHub.hpp');
  assert.match(hub, /constexpr uint32_t kEngineVersion = 10;/);
  assert.match(hub, /\/\/\/ 10 \(2026-10-24, store-build native queue\)/);
});

test('#10 ping-pong: mono input into ONE line, repeats cross-fed; normal mode unchanged', () => {
  const fx = read('modules/ape-dsp/ios/core/Effects.hpp');
  const body = fx.slice(fx.indexOf('class DelayEffect'), fx.indexOf('class ModEffect'));
  assert.match(body, /if \(pp\) \{[\s\S]*?bufL_\[w_\] = static_cast<float>\(\(inL \+ inR\) \* 0\.5 \+ lpR_ \* fb\);\n\s*bufR_\[w_\] = static_cast<float>\(lpL_ \* fb\);/);
  assert.match(body, /\} else \{\n\s*bufL_\[w_\] = static_cast<float>\(inL \+ lpL_ \* fb\);\n\s*bufR_\[w_\] = static_cast<float>\(inR \+ lpR_ \* fb\);/);
  assert.doesNotMatch(body, /inL \+ \(pp \? lpR_ : lpL_\) \* fb/, 'the old both-lines form is gone');
  // The lab's timeline draws repeat 1 on L, 2 on R — the order the audio now plays.
  const viz = read('src/features/lab/fxViz.tsx');
  assert.match(viz, /side: pingpong \? \(n % 2 === 1 \? 'L' : 'R'\) : 'C'/);
  const golden = read('modules/ape-dsp/test/golden_main.cpp');
  assert.match(golden, /Ping-pong mono: repeat 1 is LEFT only/);
  assert.match(golden, /Ping-pong mono: repeat 2 is RIGHT only/);
  assert.match(golden, /Ping-pong OFF: mono in → L == R on every repeat \(unchanged\)/);
});

test('#11 stereo spread: generator, every bridge, the same key on both platforms', () => {
  const gen = read('modules/ape-dsp/ios/core/Generator.hpp');
  assert.match(gen, /void setStereoSpread\(double rad\) \{/);
  assert.match(gen, /case GenMode::Sine:\n\s*return std::sin\(2\.0 \* kPi \* phase_ - spreadRadCur_\);/);
  assert.match(gen, /case GenMode::Pink:\n\s*return c \* l \+ s \* pink2\(\);/);
  // A two-channel caller runs the R high-pass every sample (bit-identical for mono).
  assert.match(gen, /sR = R \? rawR \* \(1\.0 - hpfMix_\)/);
  assert.match(read('modules/ape-dsp/ios/ApeDspCore.h'), /- \(void\)genSetStereoSpread:\(double\)rad;/);
  assert.match(read('modules/ape-dsp/ios/ApeDspCore.mm'), /_gen->setStereoSpread\(rad\);/);
  const swift = read(SWIFT);
  assert.match(swift, /if let sp = \(params\["stereoSpreadRad"\] as\? NSNumber\)\?\.doubleValue \{\n\s*self\.core\.genSetStereoSpread\(sp\)/);
  // Targets-first: before "mode".
  assert.ok(swift.indexOf('params["stereoSpreadRad"]') < swift.indexOf('if let m = (params["mode"] as? NSNumber)'));
  const kt = read(KT);
  assert.match(kt, /\(params\["stereoSpreadRad"\] as\? Number\)\?\.let \{ nativeGenSetStereoSpread\(handle, it\.toDouble\(\)\) \}/);
  assert.ok(kt.indexOf('params["stereoSpreadRad"]') < kt.indexOf('(params["mode"] as? Number)'));
  assert.match(kt, /private external fun nativeGenSetStereoSpread\(h: Long, rad: Double\)/);
  assert.match(read(JNI), /Java_expo_modules_apedsp_ApeDspModule_nativeGenSetStereoSpread\(JNIEnv\*, jobject, jlong h,\n\s*jdouble rad\) \{\n\s*eng\(h\)->gen_\.setStereoSpread\(rad\);/);
  const idx = read('modules/ape-dsp/index.ts');
  assert.match(idx, /stereoSpreadRad\?: number;/);
  assert.match(idx, /stereoSpreadAvailable\(\): boolean \{\n\s*return this\.engineVersion\(\) >= 10;/);
  // The web sim shows the store-build list (visual only).
  assert.match(read('modules/ape-dsp/apeDspSim.ts'), /stereoSpreadAvailable: \(\) => true,/);
});

test('#11 the Stereo lab: stereo sources on v10+, the old list below, a mono comparison drawn as mono', () => {
  const cfg = read('src/screens/lab/fxLabConfigs.tsx');
  const stereo = cfg.slice(cfg.indexOf('const stereoConfig: FxLabConfig'));
  assert.match(stereo, /sources: \[SRC_PINK, srcSine\(440\)\],/, 'older builds keep the approved list');
  assert.match(stereo, /stereoSources: \[SRC_PINK_STEREO, SRC_SINE_STEREO, SRC_PINK_MONO\],/);
  assert.match(cfg, /gen: \{ mode: GEN_MODES\.pink, stereoSpreadRad: STEREO_TEST_LR_RAD \}/);
  assert.match(cfg, /gen: \{ mode: GEN_MODES\.sine, frequency: 440, stereoSpreadRad: STEREO_TEST_LR_RAD \}/);
  assert.match(cfg, /const SRC_PINK_MONO = \{[\s\S]*?monoCompare: true,/);
  assert.match(stereo, /inputLrRad=\{src\?\.monoCompare \? 0 : STEREO_TEST_LR_RAD\}/);
  assert.match(stereo, /monoIn: src\?\.monoCompare === true,/);
  // The PHASE lab stays mono (Ø + MONO-FOLD = silence needs L = R).
  const phase = cfg.slice(cfg.indexOf('const phaseConfig: FxLabConfig'), cfg.indexOf('const stereoConfig: FxLabConfig'));
  assert.doesNotMatch(phase, /stereoSources|stereoSpreadRad/);
  const anim = read('src/screens/lab/fxAnim.tsx');
  assert.match(anim, /const stereoIn = flavor === 'width' && !monoIn;\n\s*const d0 = stereoIn \? STEREO_TEST_LR_RAD : 0;/);
  assert.match(anim, /monoIn=\{model\.monoIn\}/);
});

test('#11 the spread never leaks out of the lab that set it', () => {
  const s = read('src/screens/lab/FxLabScreen.tsx');
  assert.match(s, /return \{ levelDb: GEN_LEVEL_DB, stereoSpreadRad: 0, \.\.\.src\.gen \};/);
  assert.match(s, /config\.stereoSources && ApeDsp\.stereoSpreadAvailable\(\) \? config\.stereoSources : config\.sources/);
  // Every generator write goes through genParamsFor — no raw source spread.
  assert.doesNotMatch(s, /ApeDsp\.genSet\(\{ levelDb: GEN_LEVEL_DB, \.\.\.config\.sources/);
  assert.equal((s.match(/ApeDsp\.genSet\(genParamsFor\(sources\[/g) ?? []).length, 3);
  // Stop (and the fence's stop) clear it.
  const stop = s.slice(s.indexOf('const stop = useCallback(() => {'), s.indexOf('useStopWhenSilenced(running, stop);'));
  assert.match(stop, /ApeDsp\.genSet\(\{ stereoSpreadRad: 0 \}\);/);
  const fence = s.slice(s.indexOf('const fenced = await startFenced({'), s.indexOf('isCurrent: () => gen === genRef.current,'));
  assert.match(fence, /ApeDsp\.genSet\(\{ stereoSpreadRad: 0 \}\);/);
});

test('#6 Android: AudioRecordingCallback → silenced (API 29+), paired with exact-zero input', () => {
  const kt = read(KT);
  assert.match(kt, /Events\("onOutputLost", "onInputSilenced"\)/);
  assert.match(kt, /if \(Build\.VERSION\.SDK_INT >= Build\.VERSION_CODES\.Q\) \{\n\s*val rc = object : AudioManager\.AudioRecordingCallback\(\) \{/);
  assert.match(kt, /am\.registerAudioRecordingCallback\(rc, null\)/);
  assert.match(kt, /am\?\.unregisterAudioRecordingCallback\(it\)/);
  const upd = kt.slice(kt.indexOf('private fun updateInputSilenced'), kt.indexOf('private fun inputSilencedNow'));
  assert.match(upd, /if \(Build\.VERSION\.SDK_INT < Build\.VERSION_CODES\.Q\) return/);
  assert.match(upd, /it\.isClientSilenced && oursSources\.contains\(it\.clientAudioSource\)/);
  assert.match(upd, /sendEvent\("onInputSilenced", mapOf\("silenced" to now\)\)/);
  // Genuine silence never trips it: the OS report AND exact zeros for 0.25 s.
  assert.match(kt, /osSilenced && handle != 0L && nativeInputZeroSeconds\(handle\) > 0\.25/);
  assert.equal((kt.match(/"inputSilenced" to inputSilencedNow\(\)/g) ?? []).length, 2, 'getFrame + getMeterFrame');
  const jni = read(JNI);
  assert.match(jni, /if \(in\[i\] != 0\.0f\) \{\n\s*eng->lastNonZeroAt_\.store\(t, std::memory_order_relaxed\);\n\s*break;/);
  assert.match(jni, /Java_expo_modules_apedsp_ApeDspModule_nativeInputZeroSeconds/);
  // iOS declares the same events (it never sends this one — it interrupts).
  assert.match(read(SWIFT), /Events\("onOutputLost", "onInputSilenced"\)/);
});

test('#6 JS: a silenced frame is not live, raises the banner at once, flags the save', () => {
  const idx = read('modules/ape-dsp/index.ts');
  assert.match(idx, /inputSilenced\?: boolean;/);
  assert.match(idx, /export function onInputSilenced\(cb: \(silenced: boolean\) => void\): \(\) => void \{/);
  assert.match(idx, /emitter\.addListener\('onInputSilenced'/);
  const e = read('src/features/tools/engine/useDspEngine.ts');
  assert.match(e, /return !!m && m\.running && !m\.captureStalled && !m\.inputSilenced;/);
  assert.match(e, /if \(m\?\.inputSilenced\) \{\n\s*setNoSignal\(true\);\n\s*return;\n\s*\}\n\s*if \(frameIsLive\(m\)\) \{/);
  assert.match(e, /return onInputSilenced\(\(\) => silenceCheckRef\.current\?\.\(\)\);/);
  assert.match(e, /if \(m\.captureStalled \|\| !m\.running \|\| m\.inputSilenced\) flags\.push\('engine_inactive'\);/);
  // The banner it raises is the existing, approved one — no new wording.
  assert.match(read('src/screens/tools/EngineGate.tsx'), /close other apps using the mic \(calls, recorders\)/);
});

test('#8 iOS: AVAudioEngineConfigurationChange restarts the engine that changed, on main', () => {
  const s = read(SWIFT);
  assert.match(s, /nc\.addObserver\(forName: \.AVAudioEngineConfigurationChange, object: nil, queue: \.main\) \{/);
  assert.match(s, /guard let self, let changed = note\.object as\? AVAudioEngine else \{ return \}\n\s*if let cap = self\.engine, changed === cap \{\n\s*self\.handleCaptureConfigChange\(\)\n\s*\} else if let out = self\.outEngine, changed === out \{\n\s*self\.handleOutputConfigChange\(\)/);
  const cap = s.slice(s.indexOf('private func handleCaptureConfigChange()'), s.indexOf('private func handleOutputConfigChange()'));
  assert.match(cap, /guard running, !restarting, !inBackground else \{ return \}/);
  assert.match(cap, /Date\(\)\.timeIntervalSince\(last\) < 1\.0/, 'no restart loop');
  assert.match(cap, /stopCapture\(reason: "config-change"\)\n\s*do \{\n\s*try startCapture\(\)/);
  assert.match(cap, /logEvent\("engine config CHANGED \(capture\)"\)/);
  assert.doesNotMatch(cap, /inputNode/, 'never touches inputNode');
  const out = s.slice(s.indexOf('private func handleOutputConfigChange()'), s.indexOf('private func dropAudioObjectsAfterReset()'));
  assert.match(out, /outEngine = nil\n\s*outNode = nil\n\s*guard core\.anyOutputRunning\(\) else \{ return \}/);
  assert.match(out, /try startGeneratorOutput\(\)/);
  assert.match(out, /sendEvent\("onOutputLost", \["reason": "config-change"\]\)/);
});

test('iPad: front/top omni data source preferred; never throws; no-op off iPad', () => {
  const s = read(SWIFT);
  const fn = s.slice(s.indexOf('private func preferIPadOmniMic('), s.indexOf('⛔ ENGINE CONFIGURATION CHANGE'));
  assert.match(fn, /guard apeDeviceModel\.hasPrefix\("iPad"\) else \{ return \}/);
  assert.match(fn, /current\.portType == \.builtInMic else \{ return \}/);
  assert.match(fn, /sources\.filter \{ \$0\.orientation == AVAudioSession\.Orientation\.front \}/);
  assert.match(fn, /sources\.filter \{ \$0\.orientation == AVAudioSession\.Orientation\.top \}/);
  assert.match(fn, /let ranked: \[AVAudioSessionDataSourceDescription\] = front \+ top \+ sources/);
  assert.match(fn, /try pick\.setPreferredPolarPattern\(omni\)\n\s*try builtIn\.setPreferredDataSource\(pick\)/);
  assert.match(fn, /\} catch \{\n\s*logEvent\("iPad mic: data source not set/);
  assert.doesNotMatch(fn, /\bthrow\b(?!s)/, 'never throws out of startCapture');
  assert.doesNotMatch(fn, /inputNode|setMode|\.measurement/, 'measurement mode untouched');
  // Called after the session is active, before the engine exists.
  const start = s.slice(s.indexOf('private func startCapture() throws {'), s.indexOf('private func stopCapture(reason: String)'));
  const at = start.indexOf('preferIPadOmniMic(session)');
  assert.ok(at > start.indexOf('try session.setActive(true, options: [])'));
  assert.ok(at < start.indexOf('let engine = AVAudioEngine()'));
  assert.match(start, /try session\.setCategory\(\.playAndRecord, mode: \.measurement, options: \[\.defaultToSpeaker\]\)/);
});

test('#9 (verify only): the silence check reads a per-chunk PEAK, not a decaying level', () => {
  const hub = read('modules/ape-dsp/ios/core/EngineHub.hpp');
  // maxAbs restarts at 0 for every drained chunk and peakDb is THAT chunk's peak.
  assert.match(hub, /float maxAbs = 0\.0f;\n\s*if \(samples != nullptr && n > 0\) \{/);
  assert.match(hub, /meter_\.peakDb = static_cast<float>\(20\.0 \* std::log10\(static_cast<double>\(maxAbs\) \+ 1e-12\)\);/);
  const e = read('src/features/tools/engine/useDspEngine.ts');
  assert.match(e, /if \(!isDigitalSilence\(m\.peakDb\)\) \{/);
});
