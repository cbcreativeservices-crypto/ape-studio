/**
 * Effects labs: the drawn CLICK meets the HEARD click — the phone's audio
 * OUTPUT DELAY is subtracted (must-do D85 known limit (a), owner go
 * 2026-11-27 "Yes, start it", decision E6: in the 1.0.1 store build).
 *
 * The anchor (fxClickTempo ClickAnchor) is the time the generator PLAYS each
 * click; the student hears it later by the output delay (Bluetooth about
 * 100–300 ms). Engine 12 reads that delay natively (iOS AVAudioSession
 * outputLatency + ioBufferDuration; Android Oboe calculateLatencyMillis), and
 * FxLabScreen hands the drawings heardClickAnchor(anchor, delay).
 *
 * Covered: null (an older build) → exactly today's anchor; a delay shifts the
 * drawn hit by that amount; the 0–500 ms cap; a route change mid-session; the
 * native read on both platforms; the engine-12 guard.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped (a comment can never satisfy a match). */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const T = await import('../src/screens/lab/fxClickTempo.ts');

/** Lift plain functions out of a source file and run them (types stripped). */
function lift<R>(file: string, names: string[], prelude: string, ret: string): R {
  const src = read(file);
  const parts = names.map((n) => {
    const m = src.match(new RegExp(`function ${n}\\([\\s\\S]*?\\n\\}\\n`));
    assert.ok(m, `${n} not found in ${file}`);
    return m![0];
  });
  const js = ts.transpileModule(`${prelude}\n${parts.join('\n')}\nreturn ${ret};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return new Function(js)() as R;
}
const hitNowMs = lift<(phase: number, g: number[]) => number>('src/screens/lab/fxAnim.tsx', ['hitNowMs'], 'const PI2 = Math.PI * 2;', 'hitNowMs');
const mod = (x: number, m: number) => ((x % m) + m) % m;
/** The newest hit a CLICK drawing shows at the stage at this instant, from
 *  the grid useHitGrid builds out of the anchor it is handed ([P, t0, 1]). */
const drawnLastHit = (a: { t0: number; periodMs: number }) => {
  const g = [a.periodMs, a.t0, 1];
  const wall = performance.now();
  return { wall, hit: wall - mod(hitNowMs(0, g), g[0]) };
};

describe('1. the delay as a number: null → 0, the cap, no jitter', () => {
  it('null, undefined, NaN, ±Infinity, negative or zero read as 0 (today’s picture)', () => {
    for (const v of [null, undefined, NaN, Infinity, -Infinity, -1, -40, 0]) assert.equal(T.clampOutputLatencyMs(v as number | null | undefined), 0, String(v));
  });
  it('a real delay passes through; the cap is 0–500 ms', () => {
    assert.equal(T.OUTPUT_LATENCY_MAX_MS, 500);
    for (const v of [3, 12.5, 180, 299.9, 500]) assert.equal(T.clampOutputLatencyMs(v), v);
    for (const v of [500.1, 900, 12000]) assert.equal(T.clampOutputLatencyMs(v), 500);
  });
  it('a reading not known now keeps the delay in use; a change under 8 ms keeps it; a real change takes it', () => {
    assert.equal(T.OUTPUT_LATENCY_STEP_MS, 8);
    assert.equal(T.nextOutputLatencyMs(0, null), 0);
    assert.equal(T.nextOutputLatencyMs(180, null), 180, 'a transient null (no timestamp yet) keeps the Bluetooth delay');
    assert.equal(T.nextOutputLatencyMs(180, NaN), 180);
    assert.equal(T.nextOutputLatencyMs(180, -1), 180);
    assert.equal(T.nextOutputLatencyMs(0, 5), 0, '5 ms cannot be seen: the picture does not move');
    assert.equal(T.nextOutputLatencyMs(12, 17), 12, 'Android wobbles by about a burst');
    assert.equal(T.nextOutputLatencyMs(12, 20), 20);
    assert.equal(T.nextOutputLatencyMs(0, 900), 500, 'capped');
    assert.equal(T.nextOutputLatencyMs(500, 1200), 500);
  });
});

describe('2. the drawn hit: null is today exactly; a delay shifts it by that much', () => {
  const P = T.clickPeriodMs(120);
  const a = T.anchorAtStart(P, performance.now() - 61234.5);
  it('no reading (an older build, or 0): the drawings get the very same anchor object', () => {
    assert.equal(T.heardClickAnchor(a, 0), a);
    assert.equal(T.heardClickAnchor(a, null), a);
    assert.equal(T.heardClickAnchor(a, undefined), a);
    assert.equal(T.heardClickAnchor(a, NaN), a);
    assert.equal(T.heardClickAnchor(a, -3), a);
  });
  it('a 180 ms (Bluetooth) delay: every drawn hit is the played click + 180 ms, the period unchanged', () => {
    const h = T.heardClickAnchor(a, 180);
    assert.equal(h.periodMs, P);
    assert.equal(h.t0, a.t0 + 180);
    for (const w of [a.t0 + 1000, a.t0 + 1234.5, a.t0 + 99999]) {
      assert.ok(Math.abs(T.lastHitMs(h, w + 180) - (T.lastHitMs(a, w) + 180)) < 1e-6);
    }
    // what the worklet draws at this instant: the newest hit at the stage was PLAYED 180 ms earlier
    const { wall, hit } = drawnLastHit(h);
    assert.ok(Math.abs(hit - (T.lastHitMs(a, wall - 180) + 180)) < 1);
  });
  it('the cap: a 900 ms reading shifts the drawn hit by 500 ms, no more', () => {
    const h = T.heardClickAnchor(a, 900);
    assert.equal(h.t0, a.t0 + 500);
  });
  it('a tempo write still maps in play time; the heard train is that one, later by the delay', () => {
    const w = a.t0 + 4321;
    const moved = T.anchorAfterTempoWrite(a, T.clickPeriodMs(60), w);
    const heard = T.heardClickAnchor(moved, 150);
    assert.equal(heard.periodMs, moved.periodMs);
    assert.equal(heard.t0, moved.t0 + 150);
  });
});

describe('3. a route change mid-session moves the picture to the new delay', () => {
  it('speaker → Bluetooth → speaker: the delay in use follows each reading the poll gets', () => {
    // ▶ with no timestamp yet, then the speaker, then Bluetooth pairs, a transient null, then unplugged
    const reads = [null, 12, 14, 9, 184, 181, null, 178, 11];
    const want = [0, 12, 12, 12, 184, 184, 184, 184, 11];
    let d = 0;
    const got = reads.map((r) => (d = T.nextOutputLatencyMs(d, r)));
    assert.deepEqual(got, want);
    const a = T.anchorAtStart(T.clickPeriodMs(90), 1000);
    assert.deepEqual(
      got.map((x) => T.heardClickAnchor(a, x).t0 - a.t0),
      want,
    );
  });
  it('the playing lab re-reads every 500 ms, and at ▶, a CLICK pick and each tempo write', () => {
    assert.equal(T.OUTPUT_LATENCY_POLL_MS, 500);
    const SCREEN = code('src/screens/lab/FxLabScreen.tsx');
    assert.match(SCREEN, /const \[outLatencyMs, setOutLatencyMs\] = useState\(0\);/);
    assert.match(SCREEN, /const read = ApeDsp\.outputLatencyMs\(\);\s*setOutLatencyMs\(\(prev\) => nextOutputLatencyMs\(prev, read\)\);/);
    assert.match(SCREEN, /if \(!running \|\| labClickIdx < 0 \|\| !ApeDsp\.outputLatencyAvailable\(\)\) return;\s*const id = setInterval\(readOutLatency, OUTPUT_LATENCY_POLL_MS\);\s*return \(\) => clearInterval\(id\);/);
    // ▶: after the anchor is set from the started click
    assert.match(SCREEN, /: anchorAtStart\(P, startedAt\)\);\s*readOutLatency\(\);/);
    const pick = SCREEN.slice(SCREEN.indexOf('const pickSource = (i: number) => {'), SCREEN.indexOf('const setClickTempo'));
    assert.match(pick, /GEN_RETRIGGER_DIP_MS\)\);\s*readOutLatency\(\);/);
    const set = SCREEN.slice(SCREEN.indexOf('const setClickTempo = (bpm: number) => {'), SCREEN.indexOf('const paramById'));
    assert.match(set, /ApeDsp\.genSet\(\{ clickBpm: b \}\);\s*noteAudioActivity\(\);\s*readOutLatency\(\);/);
    // the hero is handed the HEARD train; the play-time anchor stays the one every write moves
    assert.match(SCREEN, /clickAnchor=\{labClickIdx >= 0 \? heardAnchor : undefined\}/);
    assert.equal((SCREEN.match(/setClickAnchor\(/g) ?? []).length, 3, 'no new place moves the play-time anchor');
    assert.doesNotMatch(SCREEN, /InteractionManager/);
  });
});

describe('4. the native read, on both platforms, behind engine 12', () => {
  const IDX = code('modules/ape-dsp/index.ts');
  const SWIFT = code('modules/ape-dsp/ios/ApeDspModule.swift');
  const KT = code('modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt');
  const JNI = code('modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp');
  it('engine 12 in the one version constant, with its changelog line', () => {
    const hub = read('modules/ape-dsp/ios/core/EngineHub.hpp');
    assert.match(hub, /constexpr uint32_t kEngineVersion = 12;/);
    assert.match(hub, /\/\/\/ 12 \(2026-11-27, 1\.0\.1 store build, must-do D85 \(a\)\): the OUTPUT LATENCY/);
  });
  it('JS: an older build (engine < 12, or no native function) reads null; -1 / NaN read null', () => {
    assert.match(IDX, /outputLatencyAvailable\(\): boolean \{\s*return this\.engineVersion\(\) >= 12 && typeof native\?\.outputLatencyMs === 'function';/);
    assert.match(IDX, /outputLatencyMs\(\): number \| null \{\s*if \(!this\.outputLatencyAvailable\(\)\) return null;/);
    assert.match(IDX, /return typeof v === 'number' && Number\.isFinite\(v\) && v >= 0 \? v : null;/);
    assert.match(IDX, /outputLatencyMs\?\(\): number;/);
  });
  it('iOS: AVAudioSession outputLatency + ioBufferDuration while the output graph runs, refreshed on every route change, on main', () => {
    assert.match(SWIFT, /Function\("outputLatencyMs"\) \{ \(\) -> Double in/);
    assert.match(SWIFT, /DispatchQueue\.main\.async \{ \[weak self\] in self\?\.refreshOutputLatency\(\) \}/);
    assert.match(SWIFT, /if let e = outEngine, e\.isRunning \{\s*let s = AVAudioSession\.sharedInstance\(\)\s*let sec = s\.outputLatency \+ s\.ioBufferDuration/);
    // the route-change observer calls refreshOutputRouteAndHpf, which now refreshes the delay
    const route = SWIFT.slice(SWIFT.indexOf('private func refreshOutputRouteAndHpf()'), SWIFT.indexOf('private func refreshOutputLatency()'));
    assert.match(route, /refreshOutputLatency\(\)/);
    assert.match(SWIFT, /forName: AVAudioSession\.routeChangeNotification[\s\S]{0,400}self\.refreshOutputRouteAndHpf\(\)/);
    assert.match(SWIFT, /outLatencyLock\.lock\(\)\s*outLatencyMsCache = ms\s*outLatencyLock\.unlock\(\)/);
  });
  it('Android: Oboe calculateLatencyMillis on the running output stream, fresh per call, never blocking the JS thread', () => {
    assert.match(KT, /private external fun nativeOutputLatencyMs\(h: Long\): Double/);
    assert.match(KT, /Function\("outputLatencyMs"\) \{ if \(handle != 0L\) nativeOutputLatencyMs\(handle\) else -1\.0 \}/);
    assert.match(JNI, /Java_expo_modules_apedsp_ApeDspModule_nativeOutputLatencyMs\(JNIEnv\*, jobject, jlong h\) \{\s*return eng\(h\)->outputLatencyMs\(\);/);
    const fn = JNI.slice(JNI.indexOf('double outputLatencyMs() {'), JNI.indexOf('bool genStart() {'));
    assert.match(fn, /std::unique_lock<std::mutex> lk\(outStreamMu_, std::try_to_lock\);/);
    assert.match(fn, /if \(!lk\.owns_lock\(\) \|\| !outStream_ \|\| outputDead_\.load\(\)\) return -1\.0;/);
    assert.match(fn, /outStream_->getState\(\) != oboe::StreamState::Started/);
    assert.match(fn, /outStream_->calculateLatencyMillis\(\);/);
    assert.match(fn, /return std::isfinite\(ms\) && ms >= 0\.0 \? ms : -1\.0;/);
    assert.match(JNI, /#include <cmath>/);
  });
});
