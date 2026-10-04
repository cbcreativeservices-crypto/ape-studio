/**
 * OWNER RULING 2026-10-04 — "clips count if output is happening."
 * Receipts; each fails on HEAD e262b2ec.
 *
 * The hearing-safety exposure monitor counted generated output (tones, binaural,
 * modular, speech) but NOT recorded clip playback — Ear Training, Drum, Mixing,
 * Mastering, Tuning, the lab clip players, the Scenarios player — because their
 * level was unknown. Every one of those plays through a player in the
 * file-player register (applyCeiling adopts each), so that register is the one
 * choke point the monitor now reads:
 *
 *  1. Only a SOUNDING player counts: stopped, paused, muted, not loaded / failed,
 *     buffering and zero-volume players are silent.
 *  2. Level model: the clip's measured RMS on the generator's sine-peak dBFS
 *     scale (RMS + 3.01 dB) where the decoded buffer is in hand (EarClipPlayer,
 *     which every rendered lab clip goes through), else one named conservative
 *     assumption (ASSUMED_CLIP_LEVEL_DBFS); plus 20·log10(player volume); into the
 *     SAME reference (refSplAt0Dbfs) the generator uses.
 *  3. The monitor integrates it with every K9 rule intact (held second, session).
 *  4. EarClipPlayer measures each buffer it loads, on create AND on replace.
 *  5. The wording says clips count while they play.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { mock, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORAGE_URL = 'ape-test-exr:async-storage';
const MOCKS: Record<string, string> = {
  'react-native': `export const Platform = { OS: 'android' };
    export const AppState = { currentState: 'active', addEventListener() { return { remove() {} }; } };`,
  'expo-speech': 'export async function isSpeakingAsync() { return false; } export function speak() {} export function stop() {}',
  'ape-dsp': `export const ApeDsp = {
    isAvailable: () => true,
    genStatus: () => ({ running: false, effectiveLevelDb: -20 }),
    binStatus: () => null,
    modStatus: () => null,
    getInfo: () => ({ outputRoute: 'headphones' }),
    getMeterFrame: () => null,
  };`,
  useDspEngine: 'export const frameIsLive = () => false;',
  audioOutputStore: 'export const isAudioOutputEnabled = () => true; export const isMicActive = () => false;',
  popupSuppressStore: 'export const areOverlaysSuppressed = () => false;',
  calibrationStore: 'export const getSplCalibration = () => null;',
  'expo-file-system/legacy': `export const cacheDirectory = 'file:///cache/';
    export const EncodingType = { Base64: 'base64' };
    export async function writeAsStringAsync() {}
    export async function deleteAsync() {}`,
  'expo-audio': `export async function setAudioModeAsync() {}
    export function createAudioPlayer(src) {
      const p = { src, playing: false, volume: 1, isLoaded: true,
        replace(s) { this.src = s; }, play() { this.playing = true; }, pause() { this.playing = false; },
        seekTo() { return Promise.resolve(); }, remove() {},
        addListener() { return { remove() {} }; } };
      (globalThis.__exrPlayers ??= []).push(p);
      return p;
    }`,
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_URL, shortCircuit: true };
    if (specifier in MOCKS) return { url: `ape-test-exrm:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-exrm:${tail}`, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === STORAGE_URL) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          const mem = new Map();
          export default {
            async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
            async multiGet(ks) { return ks.map((k) => [k, mem.has(k) ? mem.get(k) : null]); },
          };
        `,
      };
    }
    if (url.startsWith('ape-test-exrm:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(14)] };
    return next(url, context);
  },
});

declare global {
  // eslint-disable-next-line no-var
  var __exrPlayers: Array<Record<string, unknown>> | undefined;
}

type FP = Record<string, unknown>;
const fp = (await import('../src/features/audio/filePlayers.ts')) as unknown as FP;
const register = fp.registerFilePlayer as (p: object) => void;
const unregister = fp.unregisterFilePlayer as (p: object) => void;
const reset = fp.__resetFilePlayersForTests as () => void;
const setLevel = fp.setFilePlayerLevel as (p: object, db: number | null) => void;
const sounding = fp.soundingFilePlayerDbfs as () => number;
const measure = fp.measuredClipLevelDb as (chs: Float32Array[]) => number;
const ASSUMED = fp.ASSUMED_CLIP_LEVEL_DBFS as number;

const sine = (amp: number, n = 48000) => {
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = amp * Math.sin((2 * Math.PI * 1000 * i) / 48000);
  return a;
};
const near = (a: number, b: number, tol = 0.05) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('1. only a sounding clip player counts — stopped, paused, muted, unloaded/failed, buffering, zero volume are silent', () => {
  assert.equal(typeof sounding, 'function', 'the register can say what is sounding');
  reset();
  const p: FP = { playing: false, volume: 1 };
  register(p);
  setLevel(p, -10);
  assert.equal(sounding(), -Infinity, 'stopped / paused = no exposure');
  p.playing = true;
  near(sounding(), -10);
  p.muted = true;
  assert.equal(sounding(), -Infinity, 'muted');
  p.muted = false;
  p.isLoaded = false;
  assert.equal(sounding(), -Infinity, 'not loaded / failed to load');
  p.isLoaded = true;
  p.isBuffering = true;
  assert.equal(sounding(), -Infinity, 'buffering — no output yet');
  p.isBuffering = false;
  p.volume = 0;
  assert.equal(sounding(), -Infinity, 'zero volume');
  p.volume = 10 ** (-12 / 20); // the -12 dB output ceiling
  near(sounding(), -22);
  unregister(p);
  assert.equal(sounding(), -Infinity, 'a released player is gone');
});

test('2. level model: measured RMS on the generator sine-peak scale, else the one conservative assumption; loudest wins', () => {
  reset();
  // A full-scale-peak sine reads 0 dBFS, as the generator's effectiveLevelDb does.
  near(measure([sine(1)]), 0, 0.01);
  near(measure([sine(0.1)]), -20, 0.01);
  assert.equal(measure([new Float32Array(100)]), -Infinity, 'measured silence');
  assert.equal(typeof ASSUMED, 'number');
  assert.ok(ASSUMED >= -6, 'the assumption is deliberately loud (conservative)');
  const unmeasured: FP = { playing: true, volume: 1 };
  register(unmeasured);
  near(sounding(), ASSUMED, 0.001);
  const measured: FP = { playing: true, volume: 1 };
  register(measured);
  setLevel(measured, 0);
  near(sounding(), Math.max(0, ASSUMED), 0.001);
  setLevel(measured, -Infinity);
  near(sounding(), ASSUMED, 0.001);
  reset();
});

test('3. the monitor counts a playing clip — same reference, the held second — and nothing while it is paused', async () => {
  reset();
  mock.timers.enable({ apis: ['setInterval', 'Date'], now: new Date(2026, 9, 4, 10, 0, 0).getTime() });
  try {
    const ex = (await import('../src/features/audio/exposureMonitor.ts')) as Record<string, unknown>;
    const snap = ex.getExposureSnapshot as () => {
      soundingNow: boolean;
      currentDb: number | null;
      todayActiveSec: number;
      sessionActiveSec: number;
      route: string;
      settings: { refSplAt0Dbfs: number };
    };
    (ex.initExposureMonitor as (s: (cb: () => void) => void) => void)(() => {});
    const flush = async () => {
      for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
    };
    await flush();

    const clip: FP = { playing: false, volume: 10 ** (-12 / 20) };
    register(clip);
    setLevel(clip, -14); // a measured mix at -17 dBFS RMS
    for (let i = 0; i < 5; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    assert.equal(snap().todayActiveSec, 0, 'a loaded, preloaded or stopped clip never counts');

    clip.playing = true;
    for (let i = 0; i < 10; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    const s = snap();
    assert.equal(s.soundingNow, true);
    assert.equal(s.currentDb, Math.round((s.settings.refSplAt0Dbfs - 14 - 12) * 10) / 10, 'reference + clip level + volume');
    assert.equal(s.todayActiveSec, 10, 'ten playing seconds, the held first second retro-credited');
    assert.equal(s.sessionActiveSec, 10);
    assert.equal(s.route, 'headphones', 'the engine route, as for a tone');

    clip.playing = false; // paused
    for (let i = 0; i < 5; i++) {
      mock.timers.tick(1000);
      await flush();
    }
    assert.equal(snap().todayActiveSec, 10, 'a paused clip adds nothing');
    assert.equal(snap().soundingNow, false);
  } finally {
    mock.timers.reset();
    reset();
  }
});

test('4. EarClipPlayer measures what it loads — on a new player and on a replaced one', async () => {
  reset();
  globalThis.__exrPlayers = [];
  const { EarClipPlayer } = (await import('../src/features/ear/earPlayer.ts')) as unknown as {
    EarClipPlayer: new () => { load(b: unknown[]): Promise<void>; play(i: number): void; stop(): void; dispose(): void };
  };
  const ear = new EarClipPlayer();
  await ear.load([sine(0.5)]);
  const p = globalThis.__exrPlayers![0];
  ear.play(0);
  const ceil = 20 * Math.log10(p.volume as number);
  near(sounding(), 20 * Math.log10(0.5) + ceil, 0.01);
  ear.stop();
  assert.equal(sounding(), -Infinity);
  await ear.load([{ l: sine(0.05), r: sine(0.05) }]);
  assert.equal(globalThis.__exrPlayers!.length, 1, 'the player was reused (replace)');
  ear.play(0);
  near(sounding(), 20 * Math.log10(0.05) + ceil, 0.01);
  ear.dispose();
  assert.equal(sounding(), -Infinity);
});

test('5. the wording says clips count while they play; the accuracy note stays', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const mon = readFileSync(path.join(root, 'src/features/audio/exposureMonitor.ts'), 'utf8');
  assert.match(mon, /includes tones and lab clips, counted only while they are actually playing/);
  const scr = readFileSync(path.join(root, 'src/screens/tools/ExposureMonitorScreen.tsx'), 'utf8').replace(/\s+/g, ' ');
  assert.match(scr, /a clip counts only while it is actually playing — never while it is stopped, paused, muted or failed to load/);
  assert.match(scr, /the phone’s volume buttons are not read/);
  assert.match(scr, /<AccuracyNote/);
});
