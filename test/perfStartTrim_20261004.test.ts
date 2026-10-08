/**
 * Perf start trim (owner-approved 2026-10-04: "do the sign-out clean-up and
 * the members-only gate") — receipts.
 *
 * Two chains still pulled heavy code into the app-start graph after perf
 * decision B:
 *
 *  1. SIGN-OUT CLEAN-UP. features/account/clearLocalAccountData.ts imported
 *     five modules only to reach their reset functions: the Signal Detective
 *     screen module (modMeterC → meter engine + guided lessons), the Mixing lab
 *     kit (→ mixing engine), the Career Finder store (→ the 217 KB career
 *     index), the lab-clip decoder and the community directory API. Each now
 *     calls `registerLocalStoreReset(...)` when it is first EVALUATED, and the
 *     wipe's `resetRegisteredLocalStores()` runs it. A module never loaded this
 *     session holds no memory to reset; every key it owns is `ape:*`, which the
 *     sweep removes.
 *  2. MEMBERS-ONLY GATE. withMembershipPreview → labCatalog → calc/registry
 *     pulled every calculator workspace in. The gate needs only routes, names
 *     and sections (labMembership); the one thing that needed the registry —
 *     the Calculator Laboratory's "N Calculators" row count — is now a getter
 *     that `require`s the registry on first read.
 *
 * eagerGraph (static, non-type imports from App.tsx): 338 modules / 3978 KB
 * before → 255 / 2312 KB after; JSON in the start graph 239 KB → 0.
 *
 * R2: with the HEAD (b32f9411) versions of the changed files written back,
 * every block below FAILS except the ones marked GUARD, which protect what
 * must not change (the sweep's key coverage and the gate's decisions) and hold
 * on HEAD by design.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const slash = (p: string) => p.split('\\').join('/');

const WIPE = 'src/features/account/clearLocalAccountData.ts';
// Snapshots below were taken with the Miking tiles visible (preview state).
process.env.EXPO_PUBLIC_MIKING_PREVIEW = '1';
const CATALOG = 'src/screens/lab/labCatalog.ts';
/** The five modules the wipe used to import, and what each keeps. */
const MOVED = {
  'src/screens/lab/meter/modules/modMeterC.tsx': 'resetLocal',
  'src/screens/lab/mixing/kit.tsx': 'resetMixingCommitments',
  'src/features/careerfinder/store.ts': 'resetLocal',
  'src/features/lab/labClipBuffer.ts': 'resetLabClipMemory',
  'src/features/directory/api.ts': 'resetTaxonomyCache',
} as const;

// ── the eagerGraph walk (same rules as perfDecisionsB) ─────────────────────
const EXTS = ['.tsx', '.ts', '.js', '.jsx', '.json'];
function resolveFile(fromAbs: string, spec: string): string | null {
  const base = resolve(dirname(fromAbs), spec);
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const e of EXTS) if (existsSync(base + e)) return base + e;
  for (const e of EXTS) if (existsSync(join(base, 'index' + e))) return join(base, 'index' + e);
  return null;
}
/** Modules evaluated before the first frame: the closure of STATIC, non-type
 *  `import` / `export … from` from the entry. A `require` inside a function is
 *  not followed — that is the point of it. */
function eagerClosure(entry: string): Set<string> {
  const seen = new Set<string>();
  const walk = (abs: string) => {
    if (seen.has(abs)) return;
    seen.add(abs);
    if (abs.endsWith('.json')) return;
    const src = readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of src.matchAll(/^\s*(?:import|export)\s+(?!type\b)(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/gm)) {
      if (!m[1].startsWith('.')) continue;
      const r = resolveFile(abs, m[1]);
      if (r) walk(r);
    }
  };
  walk(join(ROOT, entry));
  return new Set([...seen].map((a) => slash(relative(ROOT, a))));
}

describe('1. the app-start graph no longer reaches the wipe’s lab modules or the calculators', () => {
  const start = eagerClosure('App.tsx');

  it('none of the five self-registered modules, nor what they dragged in, loads at start', () => {
    const heavy = [
      ...Object.keys(MOVED),
      'src/data/careerIndex.json',
      'src/features/lab/guidedLessons/content.ts',
      'src/screens/lab/meter/meterEngine.ts',
      'src/screens/lab/mixing/audio/mixAudio.ts',
    ];
    assert.deepEqual(heavy.filter((f) => start.has(f)), []);
    assert.equal([...start].filter((f) => f.endsWith('.json')).length, 0, 'no JSON data at app start');
  });

  it('the calc registry and every calculator workspace stay out of the start graph', () => {
    assert.ok(start.has('src/features/lab/withMembershipPreview.tsx') && start.has(CATALOG), 'precondition: the gate and the catalog are eager');
    assert.deepEqual([...start].filter((f) => f.startsWith('src/screens/lab/calc/workspaces/') || f === 'src/screens/lab/calc/registry.ts'), []);
  });

  it('the start graph is at most 260 modules (338 at b32f9411)', () => {
    assert.ok(start.size <= 260, `start graph is ${start.size} modules`);
  });

  it('the wipe imports none of the five; each registers its own reset at first evaluation', () => {
    const wipe = code(WIPE);
    for (const [file, reset] of Object.entries(MOVED)) {
      const stem = file.replace(/^src\//, '').replace(/\.tsx?$/, '').split('/').slice(-2).join('/');
      assert.doesNotMatch(wipe, new RegExp(`from '[^']*${stem}'`), `${WIPE} still imports ${stem}`);
      const s = code(file);
      assert.match(s, new RegExp(`^export function ${reset}\\(\\): void`, 'm'), `${file} exports ${reset}`);
      // The Career Finder moved onto the house store (2026-10-04, guestCareer):
      // createLocalStore registers the store's reset at creation — at module
      // evaluation, the same moment — and resetLocal is that reset. The
      // behavioural test below still sees exactly one registration appear.
      if (/^const store = createLocalStore</m.test(s)) {
        assert.match(s, /import \{ createLocalStore \} from '[^']*storage\/localStore';/, file);
        assert.match(s, new RegExp(`^export function ${reset}\\(\\): void \\{\\s*store\\.reset\\(\\);\\s*\\}`, 'm'), `${file}: ${reset} is the store's reset`);
        continue;
      }
      assert.match(s, /import \{ registerLocalStoreReset \} from '[^']*storage\/localStoreRegistry';/, file);
      assert.match(s, new RegExp(`^registerLocalStoreReset\\(${reset}\\);`, 'm'), `${file} registers ${reset}`);
    }
    assert.match(wipe, /^\s*resetRegisteredLocalStores\(\);/m, 'the wipe runs every registered reset');
  });

  it('labCatalog reaches the calc registry only through a lazy require', () => {
    const s = code(CATALOG);
    assert.doesNotMatch(s, /^import [^;]*from '\.\/calc\/registry'/m);
    assert.match(s, /require\('\.\/calc\/registry'\) as CalcRegistryModule/);
    assert.match(s, /get count\(\) \{\s*return calcFunctionCount\(\);\s*\}/);
  });
});

// ── behavioural harness: the REAL wipe, the REAL registry, the REAL Career
// Finder store, a fake AsyncStorage. Every other module the wipe imports is a
// generated no-op stub (they are not what this receipt is about).
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__PST_AS__ = AS;
const dataMod = (src: string) => 'data:text/javascript,' + encodeURIComponent(src);
const FAKE_AS = dataMod(`
  const s = globalThis.__PST_AS__;
  export default {
    async getItem(k) { return s.has(k) ? s.get(k) : null; },
    async setItem(k, v) { s.set(k, String(v)); },
    async removeItem(k) { s.delete(k); },
    async getAllKeys() { return [...s.keys()]; },
    async multiRemove(ks) { for (const k of ks) s.delete(k); },
  };`);
const REACT = dataMod(`
  export function useSyncExternalStore(_s, get) { return get(); }
  export default { useSyncExternalStore };`);
const WIPE_URL = pathToFileURL(join(ROOT, WIPE)).href;
const WIPE_SRC = readFileSync(join(ROOT, WIPE), 'utf8');
/** Imported by the wipe and kept REAL. */
const REAL_FROM_WIPE = new Set(['../storage/localStoreRegistry', '../careerfinder/store']);
/** Which of the five were reached by ANY import, stubbed or not. */
const reached = new Set<string>();
const MOVED_RE = /careerfinder\/store|meter\/modules\/modMeterC|mixing\/kit|lab\/labClipBuffer|directory\/api/;
function stubFor(spec: string): string {
  const esc = spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const m = WIPE_SRC.match(new RegExp(`import \\{([^}]+)\\} from '${esc}'`));
  const names = (m?.[1] ?? '').split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean);
  return dataMod(names.map((n) => `export function ${n}() {}`).join('\n'));
}
registerHooks({
  resolve(specifier, context, nextResolve) {
    const short = (url: string) => ({ url, shortCircuit: true });
    if (MOVED_RE.test(specifier)) reached.add(specifier);
    if (specifier === '@react-native-async-storage/async-storage') return short(FAKE_AS);
    if (specifier === 'react') return short(REACT);
    if (context.parentURL === WIPE_URL && specifier.startsWith('.') && !REAL_FROM_WIPE.has(specifier)) {
      return short(stubFor(specifier));
    }
    // careerIndex imports JSON; the store only needs familyFieldOf at completion.
    if (specifier === './careerIndex') return short(dataMod('export const familyFieldOf = () => null;'));
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx']) {
        const c = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(c))) return short(c.href);
      }
    }
    return nextResolve(specifier, context);
  },
});
const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

/** Every AsyncStorage key a module owns, resolved from its source: literal
 *  'ape:…' keys, constants holding them, and `${CONST}suffix` templates. A
 *  storage call whose key cannot be resolved FAILS the scan. */
function ownedKeys(file: string): string[] {
  const s = code(file);
  const consts = new Map<string, string>();
  for (const m of s.matchAll(/const (\w+) = '([^']+)';/g)) consts.set(m[1], m[2]);
  const keys = new Set<string>();
  const args = [
    ...[...s.matchAll(/AsyncStorage\.\w+\(\s*([^,)]+)/g)].map((m) => m[1].trim()),
    ...[...s.matchAll(/createLocalStore<[^>]*>\(\{\s*key: ([^,]+),/g)].map((m) => m[1].trim()),
  ];
  for (const a of args) {
    let k: string | undefined;
    if (/^'[^']+'$/.test(a)) k = a.slice(1, -1);
    else if (/^\w+$/.test(a)) k = consts.get(a);
    else {
      const t = a.match(/^`\$\{(\w+)\}([^`$]*)`$/);
      if (t && consts.has(t[1])) k = consts.get(t[1]) + t[2];
    }
    assert.ok(k, `${file}: cannot resolve the storage key ${a}`);
    keys.add(k);
  }
  // A createLocalStore key also owns the safe store's damaged set-aside,
  // `<key>:damaged` (written by localStore.ts, not by the module itself).
  for (const m of s.matchAll(/createLocalStore<[^>]*>\(\{\s*key: (\w+),/g)) {
    const k = consts.get(m[1]);
    if (k) keys.add(`${k}:damaged`);
  }
  return [...keys];
}

describe('2. the wipe still resets every store (behavioural)', () => {
  it('GUARD: every key the five modules own is `ape:*` and is removed by the sweep (account switch AND guest)', async () => {
    const { clearLocalAccountData } = await import('../src/features/account/clearLocalAccountData.ts');
    const all = Object.keys(MOVED).flatMap(ownedKeys);
    // The scan found the stores it should (labClipBuffer and the directory
    // keep memory only — public clips on disk are shared content by design).
    assert.deepEqual(new Set(all), new Set([
      'ape:detectiveSolved', 'ape:mixing:focal', 'ape:mixing:priorities',
      // the safe store's set-aside for a createLocalStore key (2026-10-04)
      'ape:mixing:priorities:damaged',
      'ape:careerfinder:v1', 'ape:careerfinder:v1:damaged',
    ]));
    for (const total of [false, true]) {
      AS.clear();
      for (const k of all) AS.set(k, '["departing user"]');
      AS.set('ape:deviceId', 'install-1'); // KEEP: proves the sweep is the real, selective one
      await clearLocalAccountData({ total });
      assert.deepEqual(all.filter((k) => AS.has(k)), [], `left behind (total=${total})`);
      assert.equal(AS.get('ape:deviceId'), 'install-1');
    }
  });

  it('importing the wipe loads none of the five modules', async () => {
    await import('../src/features/account/clearLocalAccountData.ts');
    assert.deepEqual([...reached], []);
  });

  it('a module NEVER loaded leaves no residue: its keys are swept, and it has no memory', async () => {
    const { clearLocalAccountData, resetAllLocalStores } = await import('../src/features/account/clearLocalAccountData.ts');
    AS.clear();
    AS.set('ape:detectiveSolved', '["case-1","case-2"]');
    AS.set('ape:mixing:focal', 'lead-vocal');
    AS.set('ape:mixing:priorities', '["vocal","kick"]');
    await clearLocalAccountData();
    resetAllLocalStores();
    assert.deepEqual([...AS.keys()].filter((k) => /detective|mixing/.test(k)), []);
    // Never evaluated in this run, so the next open hydrates from the cleared keys.
    assert.ok(![...reached].some((s) => /modMeterC|mixing\/kit/.test(s)), 'the meter and mixing modules were never loaded');
  });

  it('a module whose state WAS loaded is emptied by the wipe — every wipe, not just the first', async () => {
    const { clearLocalAccountData, resetAllLocalStores } = await import('../src/features/account/clearLocalAccountData.ts');
    const { registeredLocalStoreCount } = await import('../src/features/storage/localStoreRegistry.ts');
    const before = registeredLocalStoreCount();
    AS.clear();
    AS.set('ape:careerfinder:v1', JSON.stringify({
      version: 'career-finder-v1', responses: {}, index: 0, completed: false, completedAt: null,
      dimensionScores: null, rankedFamilyIds: ['live-sound'], saved: ['live-sound', 'mastering'], feedback: null,
    }));
    const finder = await import('../src/features/careerfinder/store.ts');
    assert.equal(registeredLocalStoreCount(), before + 1, 'the store registered itself when it was evaluated');
    await finder.hydrateCareerFinder();
    await settle();
    assert.deepEqual(finder.getCareerFinder().saved, ['live-sound', 'mastering'], 'precondition: the departing user’s record is in memory');

    await clearLocalAccountData();
    resetAllLocalStores();
    await settle();
    assert.deepEqual(finder.getCareerFinder().saved, [], 'memory emptied by the wipe');
    assert.equal(finder.getCareerFinder().rankedFamilyIds, null);
    assert.equal(AS.has('ape:careerfinder:v1'), false, 'storage swept');

    // The next user's own record, then a second wipe: still reached. Written
    // THROUGH the store (2026-10-04, on the house store: after a wipe the
    // store reads the swept key once, so a record slipped into storage behind
    // its back is not something the app can produce).
    finder.toggleSavedFamily('broadcast');
    await settle();
    assert.deepEqual(finder.getCareerFinder().saved, ['broadcast']);
    assert.ok(AS.has('ape:careerfinder:v1'), 'the next user’s record was written');
    await clearLocalAccountData();
    resetAllLocalStores();
    await settle();
    assert.deepEqual(finder.getCareerFinder().saved, []);
    assert.equal(AS.size, 0);
  });
});

// ── 3. the members-only gate: identical decisions, old vs new ──────────────
/**
 * The gate at b32f9411 (HEAD before this change), captured by importing that
 * labCatalog and asking `isMemberOnlyLabRoute` / `labRouteName` for every
 * route in navigation/types.ts and every route the catalog names (147).
 * [membersOnly, lab name or null].
 */
const GATE_AT_HEAD: Record<string, [boolean, string | null]> = {
  About: [false, null],
  Achievements: [false, null],
  AchievementsHome: [false, null],
  AdvancedMixingLab: [true, 'Advanced Mixing'],
  AmpLab: [true, 'Amplifier Principles Lab'],
  AmpModule: [true, 'Amplifier Lab'],
  AmplitudeLab: [false, 'Understanding Level & Amplitude'],
  AudioCommunityDirectory: [false, null],
  AudioLearning: [false, null],
  Auth: [false, null],
  AutotuneLab: [true, 'Autotune'],
  AwardProgress: [false, null],
  Awards: [false, null],
  BassLab: [true, 'Bass Guitar Physics'],
  BeginningMixingLab: [true, 'Beginning Mixing'],
  BinauralLab: [true, 'Binaural Panner'],
  CableInstallLab: [true, 'Cable Dressing & Installation'],
  CableLab: [true, 'Cable & Connector Fundamentals'],
  CalcLab: [false, 'Audio Calculator Laboratory'],
  CalcProjects: [false, null],
  CalcResults: [false, null],
  CalcSymbolsKey: [false, null],
  CalcWorkflowEdit: [false, null],
  CalcWorkflowRun: [false, null],
  CalcWorkflows: [false, null],
  CalcWorkspace: [false, null],
  CareerFamily: [false, null],
  CareerFamilyList: [false, null],
  CareerFinder: [false, null],
  CareerFinderAbout: [false, null],
  CareerFinderQuiz: [false, null],
  CareerFinderResults: [false, null],
  Celebration: [false, null],
  Certificates: [false, null],
  ChorusLab: [true, 'Chorus'],
  CompressionLab: [true, 'Compression'],
  ConceptModule: [false, null],
  ConnectorSelectLab: [true, 'Audio Connectors & Cable Selection'],
  CymaticsGallery: [true, 'Cymatics Lab'],
  CymaticsLab: [true, 'Cymatics Lab: Sound Made Visible'],
  CymaticsLiquidStudio: [true, 'Cymatics Lab'],
  CymaticsMembraneStudio: [true, 'Cymatics Lab'],
  CymaticsModule: [true, 'Cymatics Lab'],
  CymaticsPlateStudio: [true, 'Cymatics Lab'],
  Dashboard: [false, null],
  DeEsserLab: [true, 'De-Esser & Sibilance Control'],
  DelayLab: [true, 'Delay'],
  DigitalLab: [true, 'Digital Audio Systems'],
  DigitalModule: [true, 'Digital Audio Lab'],
  DistortionLab: [true, 'Distortion'],
  DrumTuningLab: [true, 'Drum Tuning Lab'],
  DspDebug: [false, null],
  EarLab: [false, null],
  EarModule: [true, 'Ear Training Lab'],
  EarTrainingLab: [true, 'Ear Training Lab'],
  EmployerAdmin: [false, null],
  EnvelopeLab: [true, 'Sound Envelope & Transients Lab'],
  EqLab: [true, 'Equalizer'],
  EqLabHome: [true, 'EQ Lab'],
  EqModule: [true, 'EQ Lab'],
  ExposureMonitor: [false, null],
  FillInBlank: [false, null],
  FinalExam: [false, null],
  FinalExamResult: [false, null],
  FlangerLab: [true, 'Flanger'],
  Flashcards: [false, null],
  FmLab: [true, 'FM Synthesis'],
  FoundationsCourse: [false, 'Foundations of Sound'],
  FoundationsPlayground: [true, 'Sound Playground'],
  FrequencyCounter: [false, null],
  GainLabHome: [true, 'Gain Staging'],
  GainModule: [true, 'Gain Staging Lab'],
  Gallery: [false, null],
  GateLab: [true, 'Gate / Expander'],
  Glossary: [false, null],
  HarmonicLab: [true, 'Harmonics'],
  HarmonographLab: [true, 'Harmonograph'],
  Help: [false, null],
  Home: [false, null],
  LabCategory: [false, null],
  LimiterLab: [true, 'Limiter'],
  Main: [false, null],
  MasteringLab: [true, 'Mastering Lab: From Final Mix to Release'],
  Matching: [false, null],
  MeterLab: [true, 'Visual Audio Analysis'],
  MeterModule: [true, 'Signal Detective'],
  MicLab: [true, 'Microphone Principles'],
  MikingHub: [true, 'Miking Labs'], // one catalog tile per family (owner 2026-10-06); the shared route is named for the whole set
  MikingLesson: [true, 'Miking Labs'], // the lesson host (MEMBER_ONLY_EXTRA_ROUTES)
  MicSelectLab: [true, 'Microphone Selection Lab'],
  MixingGuides: [true, 'Mixing Guides'], // Mixing Guides hub (2026-10-07): catalog leaf (Mixing, training) + MEMBER_ONLY_EXTRA_ROUTES while hidden
  MixingGuide: [true, 'Mixing Guides'], // one style's guide (MEMBER_ONLY_EXTRA_ROUTES)
  ModularLab: [true, 'Modular Synth'],
  MultiMeter: [false, null],
  NoiseLab: [true, 'Noise'],
  OscillatorLab: [true, 'Oscillators'],
  PatchbayLab: [true, 'Patchbay Signal Flow & Normalling'],
  Paywall: [false, null],
  PhaseLab: [true, 'Phase'],
  PhaserLab: [true, 'Phaser'],
  PostProdLab: [true, 'Audio Post-Production'],
  PreProdLab: [true, 'Audio Pre-Production'],
  ProductionActivity: [true, 'Production Labs'],
  ProductionLab: [true, 'Production Labs'],
  // Added 2026-10-04 with the route (productionDesign): the packet screen sits
  // inside the paid lab, members-only like its siblings.
  ProductionPacket: [true, 'Production Labs'],
  ProductionStage: [true, 'Production Labs'],
  Profile: [false, null],
  Programs: [false, null],
  PublicGlossary: [false, null],
  Quiz: [false, null],
  ReportsAdmin: [false, null],
  Results: [false, null],
  ReverbLab: [true, 'Reverb'],
  RoomDesignLab: [true, 'Room Design & Monitoring'],
  Rt60Live: [false, null],
  Rta: [false, null],
  Scenarios: [false, null],
  Settings: [false, null],
  SignalChainLab: [true, 'Signal Chain Builder'],
  SignalGen: [false, null],
  SmartProcessorsLab: [true, 'Smart Processors Lab'],
  SoundSystemsBuild: [true, 'Sound Systems Lab'],
  SoundSystemsLab: [true, 'Sound Systems Lab'],
  SoundSystemsLearn: [true, 'Sound Systems Lab'],
  SoundSystemsOperate: [true, 'Sound Systems Lab'],
  SoundSystemsRoute: [true, 'Sound Systems Lab'],
  SoundSystemsTroubleshoot: [true, 'Sound Systems Lab'],
  SpeakerLab: [true, 'Speaker Placement & Coverage'],
  SpectrogramLive: [false, null],
  SpeechLab: [true, 'Speech & Voice Lab'],
  SplMeter: [false, null],
  Splash: [false, null],
  StartHere: [false, null],
  StartHereTerms: [false, null],
  StereoLab: [true, 'Stereo Imaging'],
  Study: [false, null],
  ToolDemo: [false, null],
  ToolInfo: [false, null],
  ToolLearn: [false, null],
  ToolLibrary: [false, null],
  ToolsHub: [false, null],
  Topics: [false, null],
  Trophy: [false, null],
  TubeCard: [true, 'Tube Reference'],
  TubeLab: [true, 'Vacuum Tube Fundamentals'],
  TubeReference: [true, 'Tube Reference'],
  TuningLab: [true, 'Tuning & Temperament Lab'],
  WaveLab: [false, 'Wave Physics Laboratory'],
  WaveModule: [false, null],
  WaveformLive: [false, null],
  WeeklyConcept: [false, null],
};
/** The Lab landing's row labels at HEAD, and the grand total. */
const COUNTS_AT_HEAD: Record<string, string> = {
  sound: '4 Labs', acoustics: '3 Labs', signal: '9 Labs', mixingworkflow: '4 Labs', production: '2 Labs',
  livesound: '1 Lab', equalization: '2 Labs', dynamics: '4 Labs', timefx: '2 Labs', modulation: '3 Labs',
  saturation: '1 Lab', phase: '1 Lab', synthesis: '6 Labs', spatial: '2 Labs', pitch: '3 Labs',
  // instruments: +1 for Miking Lab 6's family tile (Foley, Field & Scientific; Lab 6 group 4, 2026-10-08).
  visualization: '2 Labs', instruments: '8 Labs', voice: '1 Lab', electronics: '2 Labs', eartraining: '1 Lab',
  calculators: '166 Calculators', // 163 + the 3 Conductor Ampacity (NEC) functions (owner 2026-10-04, receipt calcAmpacity)
};
const TOTAL_AT_HEAD = 227; // was 217 before the ampacity calculator; +1 Miking Labs 1-4 (2026-10-04/05); +1 Mixing Guides (2026-10-07, preview state); +1 Miking Lab 5: Voice & Ensemble (2026-10-07); +1 Miking Lab 6: Foley, Field & Scientific (2026-10-08)
/** Lab 6 group 1 (2026-10-08): a Miking lab is listed once it has a ready lesson, so the
 *  instruments row and the total follow the registry's ready labs (6 when the counts above
 *  were taken) instead of a hard-coded lab total. */
const MIKING_READY_AT_HEAD = 6;

describe('3. the members-only gate decides exactly as before', () => {
  it('loading the catalog (what the gate does at start) does not load the calc registry', async () => {
    const before = new Set(reached);
    const seen: string[] = [];
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (/calc\/registry|calc\/workspaces\//.test(specifier)) seen.push(specifier);
        return nextResolve(specifier, context);
      },
    });
    const cat = await import('../src/screens/lab/labCatalog.ts');
    cat.isMemberOnlyLabRoute('CompressionLab');
    cat.labRouteName('CompressionLab');
    assert.deepEqual(seen, [], 'the gate path loaded the calculators');
    assert.deepEqual(new Set(reached), before);
  });

  it('GUARD: same membersOnly decision and same lab name for all 150 routes (147 + ProductionPacket, 2026-10-04; + MixingGuides, MixingGuide, 2026-10-07)', async () => {
    const cat = await import('../src/screens/lab/labCatalog.ts');
    const now: Record<string, [boolean, string | null]> = {};
    for (const r of Object.keys(GATE_AT_HEAD)) now[r] = [cat.isMemberOnlyLabRoute(r), cat.labRouteName(r) ?? null];
    assert.deepEqual(now, GATE_AT_HEAD);
    assert.equal(Object.values(now).filter(([m]) => m).length, 77, '77 members-only routes (72 + ProductionPacket + MikingHub + MikingLesson + MixingGuides + MixingGuide)');
  });

  it('GUARD: every route the catalog and the navigator name is in that comparison', () => {
    const types = read('src/navigation/types.ts');
    const typesBody = types.slice(types.indexOf('export type RootStackParamList = {'));
    const routes = new Set<string>();
    for (const m of typesBody.slice(0, typesBody.indexOf('\n};')).matchAll(/^  (\w+)\??:/gm)) routes.add(m[1]);
    for (const m of code(CATALOG).matchAll(/route: '(\w+)'/g)) routes.add(m[1]);
    assert.deepEqual([...routes].filter((r) => !(r in GATE_AT_HEAD)), []);
  });

  it('GUARD: the Lab landing counts are unchanged — the calculator count arrives on first read', async () => {
    // Node has no `require` in an ES module; Metro does. Give the lazy read one.
    g.require = createRequire(join(ROOT, CATALOG));
    const cat = await import('../src/screens/lab/labCatalog.ts');
    const now: Record<string, string> = {};
    for (const c of cat.LAB_CATEGORIES) now[c.id] = cat.categoryCountLabel(c);
    const { readyLabs } = await import('../src/screens/lab/miking/data/registry.ts');
    const more = readyLabs().length - MIKING_READY_AT_HEAD;
    const instruments = 8 + more;
    assert.deepEqual(now, { ...COUNTS_AT_HEAD, instruments: `${instruments} Labs` });
    assert.equal(cat.totalLabCount(), TOTAL_AT_HEAD + more);
  });
});
