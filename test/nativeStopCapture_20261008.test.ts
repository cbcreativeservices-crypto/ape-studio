/**
 * GUARD — Sentry APE-STUDIO-T, the NATIVE half (fatal, iPad Pro 12.9" 5th gen,
 * iOS 26.6.1, build 27): EXC_BAD_ACCESS in AVAudioEngineImpl::UpdateInputNode
 * ← ApeDspModule.stopCapture, with the app in the BACKGROUND eight minutes
 * after it left the Tools hub.
 *
 * Root-cause pattern: a native audio call made after iOS had torn the audio
 * session down behind a backgrounded app — and `engine.inputNode` is not a
 * property read, it rebuilds the input node against whatever hardware is (not)
 * there.
 *
 * ⛔ THIS FILE'S SOURCE MOVES THE iOS RUNTIME FINGERPRINT: it ships ONLY in a
 * new iOS build (branch native-ios-fixes). Never merge it into a branch that
 * still publishes OTA updates to builds 33/34.
 */
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const s = readFileSync('modules/ape-dsp/ios/ApeDspModule.swift', 'utf8').replace(/\r\n/g, '\n');
const body = (from: string, to: string) => {
  const a = s.indexOf(from);
  const b = s.indexOf(to, a + from.length);
  assert.ok(a >= 0 && b > a, `${from} … ${to}`);
  return s.slice(a, b);
};
/** Swift source with comments removed, so a comment naming a call is fine. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

test('stopCapture never touches inputNode, is idempotent and re-entrancy safe', () => {
  const stop = code(body('private func stopCapture(reason: String) {', 'private var stopping = false'));
  assert.doesNotMatch(stop, /inputNode/, 'the access that crashed must not be on the stop path at all');
  assert.match(stop, /guard running \|\| engine != nil else \{ return \}/, 'a second stop is a no-op');
  assert.match(stop, /if stopping \{ return \}/);
  assert.match(stop, /if let engine = engine, engine\.isRunning \{ engine\.stop\(\) \}/);
  assert.match(stop, /engine = nil/);
});

test('capture is closed natively on background and never opened there', () => {
  const obs = code(body('private func observeNotifications() {', 'AVAudioSession.routeChangeNotification'));
  assert.match(obs, /UIApplication\.didEnterBackgroundNotification[\s\S]*self\.inBackground = true[\s\S]*self\.stopCapture\(reason: "background"\)/);
  assert.match(obs, /UIApplication\.willEnterForegroundNotification[\s\S]*inBackground = false/);
  const start = code(body('private func startCapture() throws {', 'private func stopCapture('));
  assert.ok(start.indexOf('if inBackground {') >= 0 && start.indexOf('if inBackground {') < start.indexOf('engine.inputNode'), 'refuse before any engine is built');
  assert.ok(start.indexOf('guard session.isInputAvailable, !session.currentRoute.inputs.isEmpty else {') < start.indexOf('engine.inputNode'), 'no input route → no inputNode');
  const wd = code(body('private func startWatchdog() {', 'private func stopWatchdog()'));
  assert.match(wd, /!self\.interrupted, !self\.inBackground else \{ return \}/, 'the watchdog restarts nothing behind a suspended app');
});

test('a media-services reset drops every audio object without calling into it', () => {
  const obs = code(body('private func observeNotifications() {', 'AVAudioSession.routeChangeNotification'));
  assert.match(obs, /AVAudioSession\.mediaServicesWereResetNotification[\s\S]*dropAudioObjectsAfterReset\(\)/);
  const drop = code(body('private func dropAudioObjectsAfterReset() {', '\n  }\n'));
  assert.doesNotMatch(drop, /[eE]ngine\??\.|inputNode|removeTap|outNode\??\./, 'nothing may be called on a reset AVAudio object (the C++ core is ours and stays)');
  assert.match(drop, /engine = nil/);
  assert.match(drop, /outEngine = nil/);
});

test('every engine-touching start/stop runs on the main queue with the observers', () => {
  for (const fn of ['stop', 'genStart', 'genStop', 'binStart', 'binStop', 'modStart', 'modStop']) {
    const at = s.indexOf(`AsyncFunction("${fn}")`);
    assert.ok(at >= 0, fn);
    const next = s.indexOf('AsyncFunction(', at + 10);
    const fnFunc = s.indexOf('Function(', at + 10);
    const end = Math.min(...[next, fnFunc, s.indexOf('OnCreate', at)].filter((x) => x > 0));
    assert.match(s.slice(at, end), /\}\.runOnQueue\(\.main\)/, `${fn} on main`);
  }
});
