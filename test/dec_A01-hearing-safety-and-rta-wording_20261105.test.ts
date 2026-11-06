/**
 * Decisions 1 and 19 (owner, 2026-11-05).
 *
 * 1. "Unavailable until a level is estimated" also printed beside a real reading
 *    below the chosen standard's floor (68 dBA on Recommended). The two cases are
 *    now told apart, driven here through the real monitor: a clip at 68 dBA, and
 *    no sound at all.
 * 19. The RTA draws 30 bands, 25 Hz to 20 kHz, so the words claim the spacing and
 *    the span, never 31 bars. The band-mode key still reads 31.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it, mock } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORAGE_URL = 'ape-test-a01:async-storage';
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
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: STORAGE_URL, shortCircuit: true };
    if (specifier in MOCKS) return { url: `ape-test-a01m:${specifier}`, shortCircuit: true };
    const tail = specifier.split('/').pop() ?? '';
    if (specifier.startsWith('.') && tail in MOCKS) return { url: `ape-test-a01m:${tail}`, shortCircuit: true };
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
        source: `const mem = new Map();
          export default {
            async getItem(k) { return mem.has(k) ? mem.get(k) : null; },
            async setItem(k, v) { mem.set(k, v); },
            async removeItem(k) { mem.delete(k); },
            async multiGet(ks) { return ks.map((k) => [k, mem.has(k) ? mem.get(k) : null]); },
          };`,
      };
    }
    if (url.startsWith('ape-test-a01m:')) return { format: 'module', shortCircuit: true, source: MOCKS[url.slice(14)] };
    return next(url, context);
  },
});

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (f: string) => readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const NO_LEVEL = 'Unavailable until a level is estimated';
const BELOW = 'Level is below this standard’s range';

type Snap = {
  currentDb: number | null;
  remainingSec: number | null;
  belowStandardRange: boolean;
  confidence: 'calibrated' | 'general';
  todayDose: number;
  todayActiveSec: number;
  settings: { refSplAt0Dbfs: number; standard: string };
};

describe('decision 1: a real low reading is not "unavailable"', () => {
  it('no level yet keeps the old words; 68 dBA on Recommended gets the new ones', async () => {
    const ex = (await import('../src/features/audio/exposureMonitor.ts')) as unknown as {
      getExposureSnapshot: () => Snap;
      initExposureMonitor: (s: (cb: () => void) => void) => void;
      fmtRemaining: (sec: number | null, c: string, dose: number, below: boolean) => string;
      exposureMessage: (s: Snap) => string;
    };
    const fp = (await import('../src/features/audio/filePlayers.ts')) as unknown as {
      registerFilePlayer: (p: object) => void;
      setFilePlayerLevel: (p: object, db: number | null) => void;
    };
    const words = (s: Snap) => ex.fmtRemaining(s.remainingSec, s.confidence, s.todayDose, s.belowStandardRange);
    const flush = async () => {
      for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r));
    };
    mock.timers.enable({ apis: ['setInterval', 'Date'], now: new Date(2026, 10, 5, 10, 0, 0).getTime() });
    try {
      ex.initExposureMonitor(() => {});
      await flush();

      const before = ex.getExposureSnapshot();
      assert.equal(before.currentDb, null);
      assert.equal(before.remainingSec, null);
      assert.equal(before.belowStandardRange, false);
      assert.equal(words(before), NO_LEVEL);

      const clip = { playing: true, volume: 1 };
      fp.registerFilePlayer(clip);
      fp.setFilePlayerLevel(clip, 68 - before.settings.refSplAt0Dbfs);
      for (let i = 0; i < 3; i++) {
        mock.timers.tick(1000);
        await flush();
      }
      const quiet = ex.getExposureSnapshot();
      assert.equal(quiet.settings.standard, 'niosh3', 'Recommended');
      assert.equal(quiet.currentDb, 68);
      assert.equal(quiet.remainingSec, null, 'no time limit applies below the floor');
      assert.equal(quiet.belowStandardRange, true);
      assert.equal(words(quiet), BELOW);
      clip.playing = false;
    } finally {
      mock.timers.reset();
    }

    assert.equal(ex.fmtRemaining(null, 'general', 1, true), 'Recommended dose reached', 'a reached dose still outranks it');
    assert.equal(ex.fmtRemaining(3600, 'general', 0.1, false), 'About 1 hr', 'a real figure is unchanged');
    const line = ex.exposureMessage({
      ...ex.getExposureSnapshot(),
      todayDose: 0.3,
      todayActiveSec: 1200,
      currentDb: 68,
      remainingSec: null,
      belowStandardRange: true,
    });
    assert.ok(line.includes('below this standard’s range'), line);
    assert.ok(!line.includes('of recommended exposure remain'), 'never a sentence with no time in it');
  });

  it('both screens pass the case through, and the check-in adds "remaining" only to a time', () => {
    const args = 'fmtRemaining(snap.remainingSec, snap.confidence, snap.todayDose, snap.belowStandardRange)';
    assert.ok(read('src/screens/tools/ExposureMonitorScreen.tsx').includes(`label="Time remaining" value={${args}}`));
    const checkin = read('src/features/audio/ExposureCheckin.tsx');
    assert.ok(checkin.includes(`{${args}}`));
    assert.ok(checkin.includes("{snap.remainingSec != null && snap.todayDose < 1 ? ' remaining' : ''}"));
  });
});

describe('decision 19: the RTA promises the spacing and the span', () => {
  const WORDS = 'the same band spacing as a 31-band graphic EQ, shown here from 25 Hz to 20 kHz';
  it('the band-mode blurb says it, the key still reads 31', () => {
    const rta = read('src/screens/tools/RtaScreen.tsx');
    assert.ok(rta.includes(`with ${WORDS}.`));
    assert.ok(!rta.includes('fader for fader'));
    assert.ok(rta.includes('const BAND_MODES: readonly BandMode[] = [7, 10, 15, 31, 61] as const;'));
  });
  it('the MultiMeter tool description says it', () => {
    const tools = read('src/screens/tools/toolsData.ts').replace(/' \+\n\s+'/g, '');
    // The MultiMeter hero draws the derived 61-band frame (1/6 OCT on its own
    // display), so its entry says that, not the RTA's 31-band spacing.
    assert.ok(tools.includes('a 61-band (1/6-octave) spectrum with a fine FFT overlay'));
    assert.ok(!tools.includes(WORDS));
    assert.ok(!tools.includes('a 31-band spectrum'));
  });
});
